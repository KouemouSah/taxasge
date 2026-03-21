# OMS Phase 5 — Supervisor Dashboard (Plan révisé)

## Principes
- **NE PAS dupliquer** les pages agent OMS (queue, licenses, compliance) — elles fonctionnent déjà pour les superviseurs via le backend (`is_supervisor=true`)
- **ENRICHIR** le ministry-dashboard existant (4 onglets) avec les données OMS
- **CRÉER** uniquement ce qui n'existe pas : endpoint per-agent performance + page team OMS
- **RÉUTILISER** GaugeRing, analytics-engine, GEChoroplethMap

## Architecture

```
Supervisor Menu (après Phase 5)
├── Dashboard principal (existant — inchangé)
├── OMS
│   ├── Queue         → RÉUTILISE /agent/oms (superviseur voit tout)
│   ├── Licences      → RÉUTILISE /agent/oms/licenses
│   ├── Compliance    → RÉUTILISE /agent/oms/compliance
│   └── Équipe        → NOUVEAU — performance par agent
├── Entreprises
│   ├── Liste         → existant
│   ├── Site Dashboard → existant — ENRICHI onglet OMS
│   └── Ministry Dashboard → existant — ENRICHI onglet OMS
└── ... (team, escalations, etc.)
```

---

## Phase 5A : Menu + Câblage (0 nouveau composant)

### 5A.1 — Ajouter les pages agent OMS au menu superviseur
- [ ] Migration: ajouter bloc `oms` dans `roles.menu_config` des 9 superviseurs OMS
- [ ] Items: Queue (`/dashboard/agent/oms`), Licences (`/dashboard/agent/oms/licenses`), Compliance (`/dashboard/agent/oms/compliance`)
- [ ] Vérifier que les pages agent OMS détectent `is_supervisor` et affichent le titre approprié

### 5A.2 — Adapter les pages agent OMS pour le mode superviseur
- [ ] Queue page: ajouter colonne "Agent assigné" si `is_supervisor` (via query param ou contexte)
- [ ] Queue page: permettre filtrage par agent (dropdown des agents du ministère)
- [ ] Compliance page: titre dynamique ("Mon ministère" pour supervisor vs "Ma queue" pour agent)

---

## Phase 5B : Endpoint per-agent OMS performance (NOUVEAU backend)

### 5B.1 — `GET /oms/team/performance`
```
Permission: fiscal_service.process_obligations (supervisors only — enforced by is_supervisor check)
Query params: fiscal_year (default current), period_days (default 30)

Returns:
{
  "agents": [
    {
      "agent_profile_id": "uuid",
      "agent_name": "Juan Agent",
      "role_code": "agent_min_comercio",
      "entity_code": "MIN_COMERCIO",
      "availability": "available",
      "obligations_assigned": 45,
      "obligations_completed": 38,
      "obligations_pending": 7,
      "obligations_rejected": 2,
      "amount_processed": 12500000,
      "avg_processing_minutes": 12,
      "completion_rate": 84.4,
      "rejection_rate": 4.4
    }
  ],
  "team_totals": {
    "total_assigned": 180,
    "total_completed": 152,
    "total_pending": 28,
    "total_amount_processed": 52300000,
    "avg_completion_rate": 84.4,
    "avg_processing_minutes": 15
  }
}
```

### 5B.2 — SQL (single query via assignments + license_obligations)
```sql
SELECT
    ap.id as agent_profile_id,
    u.first_name || ' ' || u.last_name as agent_name,
    r.code as role_code,
    e.code as entity_code,
    ap.availability,
    COUNT(a.id) as obligations_assigned,
    COUNT(a.id) FILTER (WHERE a.status = 'completed') as obligations_completed,
    COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress')) as obligations_pending,
    COUNT(lce.id) FILTER (WHERE lce.event_type = 'agent_rejected') as obligations_rejected,
    COALESCE(SUM(lo.amount) FILTER (WHERE a.status = 'completed'), 0) as amount_processed,
    ROUND(AVG(EXTRACT(EPOCH FROM (a.completed_at - a.created_at)) / 60)
        FILTER (WHERE a.status = 'completed'), 1) as avg_processing_minutes
FROM agent_profiles ap
JOIN users u ON u.id = ap.user_id
JOIN roles r ON r.id = u.role_id
JOIN entities e ON e.id = ap.entity_id
LEFT JOIN assignments a ON a.agent_profile_id = ap.id
    AND a.item_type = 'obligation_processing'
    AND a.created_at >= NOW() - INTERVAL '{period_days} days'
LEFT JOIN license_obligations lo ON lo.id = a.item_id
LEFT JOIN license_compliance_events lce ON lce.obligation_id = lo.id
    AND lce.event_type = 'agent_rejected'
    AND lce.triggered_by = ap.user_id
WHERE ap.is_active = true
  AND ap.ministry_id = $ministry_id  -- supervisor scope
  AND r.code IN (OMS_PROCESSOR_ROLES)
GROUP BY ap.id, u.first_name, u.last_name, r.code, e.code, ap.availability
ORDER BY obligations_completed DESC
```

---

## Phase 5C : Enrichir Ministry Dashboard (onglet OMS)

### 5C.1 — Ajouter onglet "OMS" au ministry-dashboard existant
Le ministry-dashboard a déjà 4 onglets. Ajouter un 5ème : **OMS (Obligaciones)**

**Contenu de l'onglet OMS :**
- [ ] **KPIs** (réutiliser GaugeRing) :
  - Recovery % global (gauge)
  - Obligations pendantes (nombre)
  - Montant vencido (XAF)
  - Agents actifs (nombre)
- [ ] **Donut** : Répartition paid/pending/overdue (chart.js, pattern existant du ministry-dashboard)
- [ ] **Bar chart** : Recovery par fee_type (tesoro/municipal/chamber)
- [ ] **Table top debtors OMS** : Réutiliser le pattern `classifyDebtors()` de analytics-engine.ts
  - Entreprise, NIF, zone, montant overdue, jours retard, score risque (critical/high/medium/low)
- [ ] **Performance agents** : Mini-tableau (nom, complétées, pendantes, taux, avg temps)
  - Source: nouvel endpoint `GET /oms/team/performance`

### 5C.2 — Données depuis APIs existantes
- `omsLicensesApi.getStats(fiscal_year)` → KPIs
- `omsLicensesApi.getComplianceSummary(fiscal_year)` → Donut + bar + top debtors
- Nouvel endpoint `GET /oms/team/performance` → Table agents

---

## Phase 5D : Page Équipe OMS (NOUVELLE page)

### Path: `/dashboard/supervisor/oms/team`

**Layout :**
- [ ] **KPIs équipe** : Agents actifs, Taux complétion global, Obligations/agent moyen, Rejets total
- [ ] **Table agents** (paginée, triable) :
  - Nom, Rôle, Entité, Assignées, Complétées, Pendantes, Rejetées, Montant traité, Temps moyen, Taux complétion (Progress bar)
- [ ] **Détail agent** (clic → Sheet) :
  - Stats détaillées 30j
  - Historique obligations récentes (dernières 10)
  - Charge actuelle vs capacité
- [ ] **Actions superviseur** :
  - Réassigner obligations d'un agent à un autre (drag & drop ou select)
  - Voir la queue d'un agent spécifique (lien vers queue page filtrée par agent)

---

## Phase 5E : Enrichir Site Dashboard (carte GeoJSON + OMS)

### Si pertinent (site dashboard = zone-scoped)
- [ ] Ajouter métrique OMS à la carte GeoJSON : couleur par recovery % obligation (en plus des métriques entreprises existantes)
- [ ] Tooltip zone : + "Obligations: X pendantes, Y vencidas, Z% recovery"
- [ ] Source: `complianceSummary` filtré par zone (si backend le supporte)

---

## Checklist validation Phase 5
- [ ] Menu superviseur avec 4 items OMS
- [ ] Pages agent OMS accessibles par superviseur avec colonne agent
- [ ] Ministry dashboard onglet OMS fonctionnel
- [ ] Endpoint per-agent performance testé
- [ ] Page team OMS avec table + détail agent
- [ ] 0 erreur TypeScript
- [ ] Traductions es/fr/en
- [ ] Permissions vérifiées (supervisor_* uniquement)

---

## Estimation
- 5A (menu + câblage) : 1h
- 5B (endpoint backend) : 1h
- 5C (onglet ministry-dashboard) : 2h
- 5D (page team) : 2h
- 5E (carte GeoJSON) : 1h optionnel
