# Session 8 — Supervisor Field Operations Module (Production-Grade)

**Prérequis** : Sessions 3-7 complètes (inspections, scellés, collection, double validation)
**Effort estimé** : 36h (8 phases)
**Priorité** : HAUTE — Le superviseur ne peut pas piloter les opérations terrain sans ces outils

---

## État actuel (BASIQUE)
- 5 KPIs + timeline, 3 onglets (dashboard/versements/scellés)
- Aucun filtre, tri, export, planification, carte, automatisation
- Tables hardcodées sans interaction

## Objectif
Transformer le dashboard superviseur en un **centre de commandement terrain** avec :
- Planification des missions et composition d'équipes
- Analytics croisées agents × zones × obligations
- Filtres avancés, exports, rapports automatisés
- Alertes SLA et automatisations
- Vue carte GPS des inspections

---

## Phase 1 : Fondations BD (P0, 2h)

### 1.1 Table `field_missions` — Planification journalière
```sql
CREATE TABLE field_missions (
    id UUID PK DEFAULT gen_random_uuid(),
    entity_id UUID FK entities NOT NULL,
    entity_location_id UUID FK entity_locations NOT NULL,
    supervisor_id UUID FK users NOT NULL,
    mission_date DATE NOT NULL,
    title VARCHAR(200),
    notes TEXT,
    zone_ids UUID[],
    status VARCHAR(20) CHECK IN ('planned','in_progress','completed','cancelled'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entity_id, mission_date)
);
```

### 1.2 Table `field_mission_agents` — Affectation agents
```sql
CREATE TABLE field_mission_agents (
    id UUID PK DEFAULT gen_random_uuid(),
    mission_id UUID FK field_missions NOT NULL,
    agent_id UUID FK users NOT NULL,
    agent_profile_id UUID FK agent_profiles NOT NULL,
    assigned_zones UUID[],
    target_inspections INT DEFAULT 10,
    status VARCHAR(20) CHECK IN ('assigned','active','completed','absent'),
    actual_inspections INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (mission_id, agent_id)
);
```

### 1.3 Table `supervisor_filter_presets` — Filtres sauvegardés
```sql
CREATE TABLE supervisor_filter_presets (
    id UUID PK DEFAULT gen_random_uuid(),
    user_id UUID FK users NOT NULL,
    preset_name VARCHAR(100) NOT NULL,
    table_key VARCHAR(50) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    column_visibility JSONB,
    sort_config JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, preset_name, table_key)
);
```

### 1.4 Colonnes sur field_inspections
```sql
ALTER TABLE field_inspections ADD COLUMN zone_id UUID REFERENCES commerce_zones(id);
ALTER TABLE field_inspections ADD COLUMN mission_id UUID REFERENCES field_missions(id);
ALTER TABLE field_inspections ADD COLUMN duration_minutes INT;
```

### 1.5 Vue matérialisée analytics zones
```sql
CREATE MATERIALIZED VIEW mv_inspection_zone_analytics AS
SELECT
  fi.entity_id, fi.zone_id, cz.zone_code, cz.name_es,
  DATE_TRUNC('week', fi.inspection_date) as week_start,
  COUNT(*) as inspections,
  COUNT(*) FILTER (WHERE result = 'conforme') as conforme,
  COUNT(*) FILTER (WHERE result = 'non_conforme') as non_conforme,
  COUNT(*) FILTER (WHERE payment_collected) as collections,
  COALESCE(SUM(payment_amount) FILTER (WHERE payment_collected), 0) as collected_amount,
  COUNT(*) FILTER (WHERE mise_en_demeure_issued) as med_count,
  COUNT(*) FILTER (WHERE seal_applied) as seal_count,
  COUNT(DISTINCT agent_id) as agents_active,
  AVG(duration_minutes) as avg_duration
FROM field_inspections fi
LEFT JOIN commerce_zones cz ON cz.id = fi.zone_id
GROUP BY fi.entity_id, fi.zone_id, cz.zone_code, cz.name_es, DATE_TRUNC('week', fi.inspection_date);
```

### 1.6 Permissions
- `inspection.manage_missions` — Créer/modifier les missions
- `inspection.view_analytics` — Voir les analytics et tendances
- `inspection.manage_filter_presets` — Sauvegarder les filtres

### Checklist Phase 1
- [ ] Migration créée et exécutée
- [ ] Indexes vérifiés avec EXPLAIN
- [ ] Permissions assignées aux superviseurs
- [ ] MV refresh dans InternalScheduler

---

## Phase 2 : Backend API (P0, 8h)

### 2.1 MissionPlanningService — 9 endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/inspections/missions/` | manage_missions | Créer mission |
| GET | `/inspections/missions/` | view_entity | Lister missions |
| GET | `/inspections/missions/{id}` | view_entity | Détail mission |
| PUT | `/inspections/missions/{id}` | manage_missions | Modifier mission |
| POST | `/inspections/missions/{id}/agents` | manage_missions | Affecter agents |
| DELETE | `/inspections/missions/{id}/agents/{agent_id}` | manage_missions | Retirer agent |
| GET | `/inspections/missions/suggest-zones` | manage_missions | Auto-suggestion zones prioritaires |
| GET | `/inspections/missions/agents/availability` | manage_missions | Disponibilité agents pour date |
| POST | `/inspections/missions/{id}/complete` | manage_missions | Clôturer mission |

### 2.2 InspectionAnalyticsService — 6 endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/inspections/analytics/agents` | view_reports | Performance par agent |
| GET | `/inspections/analytics/agents/{id}` | view_reports | Détail agent |
| GET | `/inspections/analytics/zones` | view_reports | Analytics par zone |
| GET | `/inspections/analytics/trends` | view_analytics | Séries temporelles |
| GET | `/inspections/analytics/compare` | view_analytics | Comparatif |
| GET | `/inspections/analytics/priority-zones` | view_analytics | Zones prioritaires |

### 2.3 Filtres avancés sur GET /inspections/

Paramètres additionnels :
- `agent_id`, `zone_code`, `result`, `date_from`, `date_to`
- `search` (full-text company_name/nif)
- `has_payment`, `has_med`, `has_seal`
- `sort_by`, `sort_dir`

### 2.4 Filter presets CRUD — 4 endpoints
### 2.5 Export — 3 endpoints (CSV, PDF rapport, CSV agents)

Pattern : `TreasuryExportService` (pandas + xhtml2pdf + openpyxl)

### Checklist Phase 2
- [ ] 18+ endpoints testés
- [ ] Entity scoping IDOR vérifié
- [ ] CSV UTF-8 BOM valide
- [ ] PDF rapport avec charts (reportlab)

---

## Phase 3 : Automatisations (P1, 3h)

### 3.1 Jobs InternalScheduler

| Job | Fréquence | Description |
|-----|-----------|-------------|
| `field_sla_check` | Daily | Cash >48h non-reversé → alerte superviseur |
| `inspection_daily_summary` | Daily 18h | Stats jour par superviseur → email |
| `inspection_weekly_digest` | Hebdo | Performance semaine vs précédente → email |
| `refresh_zone_mv` | Daily | REFRESH MATERIALIZED VIEW CONCURRENTLY |

### 3.2 Alertes SLA

- Cash non-reversé >48h → `SLA_WARNING` à superviseur
- Agent inactif >3 jours ouvrés → notification superviseur
- MED expiré sans action → `MISE_EN_DEMEURE_EXPIRED`
- Zone >30j sans inspection → inclure dans résumé quotidien

### 3.3 Templates notifications (4 nouveaux)

- `inspection_daily_summary` — Résumé du jour (HTML table)
- `inspection_weekly_digest` — Digest semaine (comparatif)
- `inspection_field_sla_warning` — Alerte cash non-reversé
- `inspection_med_expired` — MED expirée

### Checklist Phase 3
- [ ] Jobs enregistrés dans scheduler start()
- [ ] Jobs idempotents (safe multi-instance)
- [ ] Templates email insérés en BD
- [ ] Seuils SLA configurables via system_rules

---

## Phase 4 : Frontend Dashboard (P0, 10h)

### 4.1 Restructuration — 6 onglets

| # | Onglet | Contenu | Badge |
|---|--------|---------|-------|
| 1 | Vue d'ensemble | 7 KPIs + alertes + timeline filtrable | - |
| 2 | Versements terrain | Table double validation + batch validate | count pending |
| 3 | Scellés | Table scellés + filtres + tri urgence | count pending |
| 4 | Agents | Performance par agent (DataTable triable) | - |
| 5 | Missions | Calendrier semaine + planification | today status |
| 6 | Zones | Analytics zones + heat map couleur | - |

### 4.2 Composants partagés (11)

| Composant | Usage | Priorité |
|-----------|-------|----------|
| `InspectionFilters.tsx` | Barre filtres (dates, statut, agent, zone, search) | P0 |
| `InspectionDataTable.tsx` | DataTable avec colonnes inspections + tri | P0 |
| `AgentPerformanceTable.tsx` | Métriques par agent avec sparklines | P0 |
| `ZoneAnalyticsTable.tsx` | Métriques zone avec indicateur couverture | P1 |
| `MissionCalendar.tsx` | Vue calendrier semaine | P1 |
| `MissionPlanDialog.tsx` | Dialog création mission + zone picker + agents | P1 |
| `InspectionTrendChart.tsx` | Charts Chart.js (line/bar) | P1 |
| `ExportButton.tsx` | Téléchargement CSV/PDF avec filtres courants | P0 |
| `FilterPresetSelector.tsx` | Dropdown load/save presets | P1 |
| `ColumnVisibilityToggle.tsx` | Toggle colonnes visibles | P2 |
| `BatchValidateDialog.tsx` | Validation batch réconciliation | P1 |

### Checklist Phase 4
- [ ] 6 onglets sans scroll sur 1080p
- [ ] Tri toutes colonnes
- [ ] Date range picker locale-aware
- [ ] Charts Chart.js (pas recharts)
- [ ] CSV download via navigateur
- [ ] Filter presets save/load
- [ ] Mobile : onglets en dropdown
- [ ] i18n complet (es/fr/en)
- [ ] ESLint 0, TypeScript 0

---

## Phase 5 : Mission Planning UI (P1, 4h)

### 5.1 Page missions/page.tsx
- Calendrier semaine (Lun-Ven)
- Cartes par jour : titre, zones, agents, barre progression
- Navigation semaine précédente/suivante
- Bouton "Créer Mission"

### 5.2 Page missions/[id]/page.tsx
- Header : date, titre, status, zones
- Section agents : dropdown disponibles, cartes assignés avec progress
- Inspections liées à cette mission
- Auto-suggestion zones (obligations overdue)

---

## Phase 6 : Analytics & Charts UI (P1, 4h)

### 6.1 Page analytics/page.tsx
- Tendances (Chart.js Line + Bar) avec granularité daily/weekly/monthly
- Table zones heat (couverture %, revenu, conformité)
- Panneau comparatif (2 agents ou 2 zones ou 2 périodes)

### 6.2 Page agents/[id]/page.tsx
- Performance individuelle dans le temps
- Inspections récentes
- Couverture zones
- Résumé collections

---

## Phase 7 : Carte GPS (P2, 3h)

- Overlay points GPS sur GEMapSVG existant
- Couleur par zone (coverage heat map)
- Clic zone → filtre table inspections
- Points pulsants pour inspections du jour

---

## Phase 8 : Vue temps réel (P2, 2h)

- Polling 30s (pas WebSocket pour MVP)
- `GET /inspections/live-status` (cache Redis 30s)
- Cartes agents : actif (vert <2h), idle (ambre 2-4h), inactif (rouge >4h)
- Compteurs live : inspections en cours, cash collecté aujourd'hui

---

## Séquence d'implémentation

```
Phase 1 (BD) → Phase 2 (Backend) → Phase 4 (Frontend)
                    ↓                     ↓
              Phase 3 (Auto)        Phase 5 (Missions)
                                    Phase 6 (Analytics)
                                    Phase 7 (Carte)
                                    Phase 8 (Real-time)
```

Phases 3, 5, 6, 7, 8 parallélisables après Phase 2+4.

---

## Risques

| Risque | Mitigation |
|--------|------------|
| 0 inspections en BD pour tester | Seeder 100+ inspections de test |
| chart.js bundle size mobile | `next/dynamic` pour import lazy |
| MV refresh bloque les queries | `REFRESH CONCURRENTLY` (unique index inclus) |
| Scheduler multi-instance | Jobs idempotents (UPDATE...WHERE...RETURNING) |
| agent_profiles.specializations vide | v1 : utiliser working_days + availability seulement |
