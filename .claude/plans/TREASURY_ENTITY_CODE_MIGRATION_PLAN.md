# PLAN : Migration Treasury ministry_id → entity_code sur service_payments

## Contexte & Diagnostic

### Problème fondamental
`service_payments.ministry_id` est calculé par un trigger legacy via la chaîne :
```
service_request_id → fiscal_service_id → fiscal_services → categories → sectors → ministries
```
Mais `fiscal_service_id` est **NULL pour 100% des service_requests modernes** (qui utilisent `workflow_code`).
**Résultat : `ministry_id = NULL` pour 100% des paiements (11/11 en BD).**

### Architecture correcte (source de vérité)
```
service_payments.service_request_id
  → service_requests.entity_code     ← TOUJOURS peuplé (11/11)
  → entities.code + entities.name    ← Dimension organisationnelle réelle
  → entities.ministry_id             ← Optionnel (4/12 entités ont un ministry)
```

### Bugs identifiés (8 total)

| # | Fichier | Ligne | Bug | Sévérité |
|---|---------|-------|-----|----------|
| 1 | treasury_export_service.py | 354 | `::uuid` sur colonne INTEGER → CRASH | CRITIQUE |
| 2 | treasury_export_service.py | 404 | `::uuid` sur colonne INTEGER → CRASH | CRITIQUE |
| 3 | treasury_export_service.py | 380 | `LEFT JOIN m ON sp.ministry_id` → NULL | HAUT |
| 4 | treasury_export_service.py | 419 | `JOIN m ON sp.ministry_id` → 0 lignes | HAUT |
| 5 | treasury_export_service.py | 626 | `LEFT JOIN m ON sp.ministry_id` → NULL code_ministere | HAUT |
| 6 | admin_routes.py | 5592 | GROUP BY sp.ministry_id → tout "Sin Ministerio" | HAUT |
| 7 | mv_treasury_daily_kpis | - | GROUP BY ministry_id → 1 groupe NULL | HAUT |
| 8 | v_top_ministries | - | `WHERE ministry_id IS NOT NULL` → 0 lignes | HAUT |

### Données réelles (via entity_code)
| entity_code | entity_name | ministry_id | Paiements | Montant |
|-------------|-------------|-------------|-----------|---------|
| CNEDOGE_PASAPORTE | Servicio de Pasaportes | NULL | 10 | 75,000 XAF |
| DGT | Dirección General de Tráfico | 93 | 1 | 25,000 XAF |

---

## Décision architecturale : Dénormalisation entity_code

### Pourquoi ajouter `entity_code` directement sur `service_payments` ?

**Arguments POUR (à 1M+ lignes, 100+ agents) :**
1. **Élimine 1 JOIN** sur toutes les queries treasury hot path (sp → sr → entities réduit à sp → entities)
2. **Index composite** `(entity_code, workflow_status, created_at)` = scan direct sans JOIN
3. **Partitionnement futur** : `entity_code` est un candidat naturel pour le range/list partitioning
4. **Cohérent** avec le pattern existant : `service_requests` a déjà `entity_code` dénormalisé

**Arguments CONTRE :**
1. Dénormalisation = risque d'incohérence → mitigé par trigger + NOT NULL constraint
2. +1 colonne VARCHAR(50) sur 1M lignes = ~50MB → négligeable

**Verdict : AJOUTER `entity_code` sur `service_payments`.**

### Schéma cible

```sql
service_payments
  + entity_code VARCHAR(50) NOT NULL  -- Dénormalisé depuis service_requests
  ~ ministry_id INTEGER               -- CONSERVÉ mais peuplé via entities.ministry_id (optionnel)
  + idx_sp_entity_status_date (entity_code, workflow_status, created_at)
```

---

## Phase 1 : Migration schema + Trigger + Backfill
**Estimation : 1 migration SQL**

### Étape 1.1 : ALTER TABLE + Backfill + Trigger
**Fichier** : `packages/backend/database/migrations/146_add_entity_code_to_service_payments.sql`

```sql
-- 1. Add column (nullable for backfill, then NOT NULL)
ALTER TABLE service_payments ADD COLUMN entity_code VARCHAR(50);

-- 2. Backfill from service_requests
UPDATE service_payments sp
SET entity_code = sr.entity_code
FROM service_requests sr
WHERE sr.id = sp.service_request_id;

-- 3. Backfill ministry_id from entities (fix the NULL issue)
UPDATE service_payments sp
SET ministry_id = e.ministry_id
FROM service_requests sr
JOIN entities e ON e.code = sr.entity_code
WHERE sr.id = sp.service_request_id
  AND e.ministry_id IS NOT NULL;

-- 4. Set NOT NULL + default guard
ALTER TABLE service_payments ALTER COLUMN entity_code SET NOT NULL;

-- 5. Update trigger to populate entity_code + ministry_id
CREATE OR REPLACE FUNCTION calculate_payment_ministry() ...
   -- NEW: populate entity_code from service_requests
   -- NEW: populate ministry_id from entities.ministry_id (if exists)

-- 6. New indexes (replace ministry-based index)
DROP INDEX idx_service_payments_workflow_ministry;
CREATE INDEX idx_sp_entity_status_date ON service_payments (entity_code, workflow_status, created_at);
CREATE INDEX idx_sp_entity_amount ON service_payments (entity_code, workflow_status, total_amount)
    WHERE workflow_status = 'completed';

-- 7. Update materialized view to use entity_code
DROP MATERIALIZED VIEW mv_treasury_daily_kpis CASCADE;
-- Recreate with entity_code instead of ministry_id as primary grouping
-- Keep ministry_id as secondary dimension (from entities)
```

**Checklist validation :**
- [ ] `SELECT entity_code, COUNT(*) FROM service_payments GROUP BY entity_code` retourne 2 groupes (CNEDOGE_PASAPORTE: 10, DGT: 1)
- [ ] `SELECT ministry_id FROM service_payments WHERE entity_code = 'DGT'` retourne 93
- [ ] `SELECT COUNT(*) FROM service_payments WHERE entity_code IS NULL` = 0
- [ ] Trigger testé : INSERT avec service_request_id → entity_code auto-peuplé
- [ ] Index `idx_sp_entity_status_date` visible dans pg_indexes

---

## Phase 2 : Réécriture queries backend
**Estimation : 2 fichiers, 6 queries**

### Étape 2.1 : Fix treasury_export_service.py (5 queries + 2 bugs type)

| Query | Ligne | Avant | Après |
|-------|-------|-------|-------|
| Sage X3 filter | 354 | `sp.ministry_id = $N::uuid` | `sp.entity_code = $N` |
| Sage X3 data | 380 | `LEFT JOIN ministries m ON m.id = sp.ministry_id` | `LEFT JOIN entities e ON e.code = sp.entity_code LEFT JOIN ministries m ON m.id = e.ministry_id` |
| Ministry report filter | 404 | `sp.ministry_id = $3::uuid` | `sp.entity_code = $N` (ou `e.ministry_id = $N::integer`) |
| Ministry report data | 419 | `JOIN ministries m ON m.id = sp.ministry_id` | `JOIN entities e ON e.code = sp.entity_code JOIN ministries m ON m.id = e.ministry_id` |
| Generic export | ~570 | `LEFT JOIN ministries m ON m.id = sp.ministry_id` | Même pattern via entities |
| BEAC export | 626 | `LEFT JOIN ministries m ON m.id = sp.ministry_id` | Même pattern via entities |

**Pattern de réécriture :**
```sql
-- AVANT (cassé)
LEFT JOIN ministries m ON m.id = sp.ministry_id

-- APRÈS (correct)
LEFT JOIN entities e ON e.code = sp.entity_code
LEFT JOIN ministries m ON m.id = e.ministry_id
```

**Pour les exports, ajouter aussi le nom d'entité :**
```sql
SELECT e.name as entity_name, m.name_es as ministry_name
```

**Checklist validation :**
- [ ] Sage X3 export avec `ministry_id` filter ne crashe plus
- [ ] Ministry report retourne > 0 lignes
- [ ] BEAC export a `code_ministere` non-NULL pour DGT
- [ ] Generic export a entity_name rempli

### Étape 2.2 : Fix admin_routes.py KPI ministry stats (1 query)

**Ligne 5592 — Réécrire comme "top entities" au lieu de "top ministries" :**
```sql
-- AVANT
SELECT sp.ministry_id, COALESCE(m.name_es, 'Sin Ministerio') AS ministry_name, ...
FROM service_payments sp
LEFT JOIN ministries m ON m.id = sp.ministry_id

-- APRÈS
SELECT sp.entity_code, e.name AS entity_name, COUNT(*) AS count, SUM(sp.total_amount) AS amount
FROM service_payments sp
LEFT JOIN entities e ON e.code = sp.entity_code
WHERE sp.workflow_status = 'completed'
  AND sp.validated_at BETWEEN $1 AND $2
GROUP BY sp.entity_code, e.name
ORDER BY amount DESC
LIMIT 10
```

**Checklist validation :**
- [ ] KPI retourne 2 groupes (CNEDOGE_PASAPORTE, DGT) au lieu de 1 "Sin Ministerio"
- [ ] Les montants correspondent (75,000 + 25,000)

---

## Phase 3 : Réécriture vues matérialisées + vues dépendantes
**Estimation : 1 migration SQL**

### Étape 3.1 : Refonte mv_treasury_daily_kpis

**Changements :**
- Remplacer `sp.ministry_id` + `m.name_es` par `sp.entity_code` + `e.name`
- Garder `e.ministry_id` comme dimension secondaire (optionnelle, pour backward compat)
- Mettre à jour les 5 indexes
- Mettre à jour les 4 vues dépendantes (v_kpi_summary, v_top_payment_methods, v_top_ministries → v_top_entities, v_top_workflows)

**Changement clé dans la vue :**
```sql
-- AVANT
GROUP BY date(sp.created_at), sp.payment_method, sp.ministry_id, m.name_es, ...

-- APRÈS
GROUP BY date(sp.created_at), sp.payment_method, sp.entity_code, e.name, e.ministry_id, ...
```

**Renommer `v_top_ministries` → `v_top_entities` :**
```sql
CREATE OR REPLACE VIEW v_top_entities AS
SELECT entity_code, entity_name, SUM(completed_count) AS transaction_count, SUM(total_amount) AS total_amount
FROM mv_treasury_daily_kpis
WHERE report_date >= date_trunc('month', CURRENT_DATE) AND entity_code IS NOT NULL
GROUP BY entity_code, entity_name
ORDER BY total_amount DESC
LIMIT 10;
```

**Checklist validation :**
- [ ] `SELECT * FROM v_top_entities` retourne CNEDOGE_PASAPORTE + DGT
- [ ] `SELECT * FROM v_kpi_summary` retourne les mêmes totaux qu'avant
- [ ] `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_treasury_daily_kpis` réussit

---

## Phase 4 : Frontend + Treasury Analyst LLM
**Estimation : 3-4 fichiers**

### Étape 4.1 : Mettre à jour les types TypeScript
- `TreasuryKPIData` : ajouter `entity_code`, `entity_name` dans les stats
- Remplacer `ministry_name` par `entity_name` dans les labels chart

### Étape 4.2 : Mettre à jour ServiceDistributionChart
- Grouper par entity au lieu de ministry

### Étape 4.3 : Mettre à jour les fonctions LLM Treasury Analyst
- `get_revenue_by_service()` → ajouter entity_code dimension
- `get_revenue_summary()` → remplacer ministry grouping par entity grouping

**Checklist validation :**
- [ ] Dashboard superviseur affiche des données par entité (pas "Sin Ministerio")
- [ ] Treasury Analyst répond correctement à "Ingresos por entidad"
- [ ] Pas d'erreur TypeScript

---

## Phase 5 : Optimisation indexes pour scale 1M+
**Estimation : 1 migration SQL**

### Indexes cibles pour 1M lignes, 100 agents concurrents

```sql
-- Hot path: agent dashboard (par entité + status pending)
CREATE INDEX idx_sp_entity_pending ON service_payments (entity_code, assigned_agent_id, created_at)
    WHERE workflow_status IN ('pending_agent_review', 'agent_reviewing', 'requires_documents');

-- Hot path: treasury KPIs (completed payments par entité + date)
CREATE INDEX idx_sp_entity_completed ON service_payments (entity_code, validated_at, total_amount)
    WHERE workflow_status = 'completed';

-- Hot path: SLA monitoring (pending + expiration)
-- (idx_service_payments_pending_validation déjà optimisé dans migration 145)

-- COVERING index pour exports (éviter heap lookups)
CREATE INDEX idx_sp_export_covering ON service_payments
    (entity_code, workflow_status, created_at)
    INCLUDE (total_amount, payment_method, payment_reference, user_id)
    WHERE workflow_status = 'completed';
```

**Checklist validation :**
- [ ] `EXPLAIN ANALYZE` sur chaque query treasury montre Index Scan (pas Seq Scan)
- [ ] Aucune query > 50ms sur 11 lignes (baseline pour extrapoler à 1M)

---

## Fichiers modifiés

| Phase | Fichier | Action |
|-------|---------|--------|
| 1 | `146_add_entity_code_to_service_payments.sql` | NOUVEAU - Migration |
| 1 | `calculate_payment_ministry()` trigger | REWRITE - entity_code + ministry_id |
| 2 | `treasury_export_service.py` | FIX - 5 queries + 2 type bugs |
| 2 | `admin_routes.py` | FIX - 1 query KPI ministry stats |
| 3 | `147_refactor_treasury_views_entity_code.sql` | NOUVEAU - Vues matérialisées |
| 4 | Frontend types + components | UPDATE - entity au lieu de ministry |
| 4 | `treasury_analyst_service.py` | UPDATE - LLM functions |
| 5 | `148_treasury_performance_indexes.sql` | NOUVEAU - Indexes optimisés |

## Estimation complexité

| Phase | Effort | Risque | Priorité |
|-------|--------|--------|----------|
| Phase 1 | Moyen | Faible (11 lignes) | P0 - Bloquant |
| Phase 2 | Moyen | Moyen (queries critiques) | P0 - Bugs actifs |
| Phase 3 | Moyen | Faible (vues recréables) | P1 |
| Phase 4 | Faible | Faible (frontend) | P2 |
| Phase 5 | Faible | Faible (indexes only) | P2 |

## Vérification end-to-end

1. `SELECT entity_code, COUNT(*), SUM(total_amount) FROM service_payments GROUP BY entity_code` → 2 groupes
2. Dashboard superviseur treasury : KPIs non-NULL par entité
3. Export Sage X3 : `entity_name` + `ministry_name` remplis
4. Export BEAC : `code_ministere` non-NULL pour DGT
5. Treasury Analyst : "Resumen por entidad" → CNEDOGE + DGT
6. `EXPLAIN ANALYZE` sur query KPI → Index Scan
