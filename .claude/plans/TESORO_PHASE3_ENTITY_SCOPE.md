# Phase 3 — Fix Bug 1 : Scope entité strict pour Treasury workload dashboard
**Date** : 2026-05-06
**Bug** : Supervisor TESORO voit agents AYUNTAMIENTO + CAMARA dans workload, audit, analytics, analista IA.

## Architecture & Cause racine

### Endpoints en fuite (TESORO-only mais ne filtrent pas)
1. `GET /api/v1/admin/service-requests/treasury/stats/workload-dashboard`
   - q_daily_velocity → lit `mv_agent_daily_workload` SANS filtre TESORO
   - q_sla_breakdown → lit `payment_validation_audit` SANS filtre TESORO
   - q_volume_trend → lit `service_payments` + `payment_validation_audit` SANS filtre TESORO
   - q_processing_times → lit `mv_agent_daily_workload` SANS filtre TESORO
   - q_rankings → lit `mv_agent_daily_workload` SANS filtre TESORO
   - q_kpis subquery `period_stats` → lit `payment_validation_audit` SANS filtre TESORO
   - q_kpis subquery `queue` → lit `service_payments` SANS filtre TESORO
   - **q_agent_load** : OK déjà filtré `WHERE e.code = 'TESORO'`
2. `GET /api/v1/admin/service-requests/treasury/analytics/report`
   - `treasury_analytics_service.get_kpi_data` → lit `mv_treasury_daily_kpis` SANS filtre TESORO
3. `GET /api/v1/admin/service-requests/treasury/audit/...` (à explorer)
4. Chatbot Analista IA (à explorer)

### Strategie de filtrage

**Pour mv_agent_daily_workload** (sans col entity) : EXISTS subquery
```sql
AND EXISTS (
    SELECT 1 FROM agent_profiles ap2
    JOIN entities e2 ON e2.id = ap2.entity_id
    WHERE ap2.id = mv.agent_profile_id
      AND e2.code = 'TESORO'
      AND ap2.is_active = true
)
```

**Pour payment_validation_audit pva** (col agent_profile_id) : même EXISTS via agent_profile_id

**Pour service_payments sp** : EXISTS sur sp.assigned_agent_id, OU jointure sur entity_code de la fiscal_service. Stratégie retenue : filtrer via `assigned_agent_id` (cohérent avec audit deja fait pour SLA/volume).
  - Risque : sp non assigné encore (queue) n'a pas assigned_agent_id → on perd ces lignes.
  - **Pour `queue`** subquery (q_kpis), on doit filtrer par fiscal_service entity. Approche : `JOIN fiscal_services fs ON fs.id = sp.service_id WHERE fs.entity_code = 'TESORO'` ou via sr_data.
  - Alternative simple : JOIN sur `service_requests sr WHERE sr.entity_code = 'TESORO'`.

**Pour mv_treasury_daily_kpis** (col entity_code DEJA présente) : `WHERE entity_code = 'TESORO'`

### Performance
- EXISTS subquery est O(1) avec index sur `agent_profiles.id` (PK), `agent_profiles.entity_id`, `entities.id` (PK), `entities.code`.
- Pas de nouveau index nécessaire (index existants dans schéma).

### Sécurité (OWASP)
- Filtre hardcoded 'TESORO' littéral (pas d'input user) → safe
- Endpoint protégé par `permission_required("treasury_stat.view")`
- Cache key inclut `loc_key` mais pas `entity_code` → OK car endpoint est TESORO-dédié

## Checklist d'implémentation

### A. Workload dashboard (`admin_routes.py`)
- [ ] 3.A.1 q_daily_velocity : ajouter EXISTS TESORO sur agent_profile_id
- [ ] 3.A.2 q_sla_breakdown : ajouter EXISTS TESORO sur pva.agent_profile_id
- [ ] 3.A.3 q_volume_trend : ajouter EXISTS TESORO sur sp.assigned_agent_id (incoming) ET pva.agent_profile_id (outgoing)
- [ ] 3.A.4 q_processing_times : ajouter EXISTS TESORO sur agent_profile_id
- [ ] 3.A.5 q_rankings : ajouter EXISTS TESORO sur agent_profile_id (CTE agent_totals)
- [ ] 3.A.6 q_kpis period_stats : ajouter EXISTS TESORO sur pva.agent_profile_id
- [ ] 3.A.7 q_kpis queue : filtrer par entity (via fiscal_services ou service_requests)

### B. Treasury analytics (`treasury_analytics.py`)
- [ ] 3.B.1 `get_kpi_data` : ajouter `AND entity_code = 'TESORO'` (col existe dans MV)
- [ ] 3.B.2 `get_agent_performance_data` : ajouter EXISTS TESORO sur pva.agent_profile_id
- [ ] 3.B.3 Vérifier impact sur callers (chatbot analista IA notamment)

### C. Audit endpoint
- [ ] 3.C.1 Identifier endpoint `/treasury/audit` ou équivalent (image 4.png)
- [ ] 3.C.2 Vérifier filtre entité, fix si fuite

### D. Validation
- [ ] 3.D.1 py_compile sur fichiers modifiés
- [ ] 3.D.2 Grep `e.code = 'TESORO'` ou EXISTS pattern partout dans treasury endpoints
- [ ] 3.D.3 Critique honnête : ai-je oublié un endpoint ? (audit, anomalies, exportaciones)

## Tests post-deploy attendus

- Supervisor TESORO connecté → page Workload n'affiche QUE Tesoro TGE, Tesoro Bata, Sup Tesoro
- Supervisor TESORO → page Audit n'affiche QUE actions des agents TESORO
- Chatbot Analista IA → réponses incluent UNIQUEMENT chiffres TESORO
- Cache invalidé : redémarrer le worker ou attendre 5 min TTL

## Risques

1. **Fall-through si pas d'agents TESORO actifs** : tableaux vides → frontend doit gérer (probablement déjà OK).
2. **Régression sur endpoints non-tesoro** : aucune, on touche uniquement `/treasury/*`.
3. **Cache stale** : l'ancienne version est en cache 5 min — le user verra encore l'ancien dashboard pour 5 min après deploy. Acceptable.
4. **Caller chatbot Analista IA** : à vérifier. S'il appelle `get_kpi_data` directement, ses réponses changent → c'est l'effet désiré.
