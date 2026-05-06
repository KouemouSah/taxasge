# Plan Maître — Correction Bugs Supervisor Tesoro
**Date** : 2026-05-06
**Branche** : develop
**Contexte** : 3 bugs reportés sur le dashboard Supervisor Tesoro (Tesoro Público).

---

## Synthèse des bugs

| # | Description | Endpoint | Cause racine confirmée |
|---|-------------|----------|------------------------|
| **Bug 3** | Card "Eficacia de Reglas" → Error 500 | `GET /api/v1/supervisor/rules/effectiveness/report` | `AttributeError: 'RulesRepository' object has no attribute 'get_effectiveness_report'` (supervisor_routes.py:2024). La méthode est appelée mais n'existe PAS dans `rules_repository.py`. |
| **Bug 2** | Tab "Reporte" Analytics → "Error al cargar los datos analiticos" | `GET /api/v1/admin/service-requests/treasury/analytics/report?period=month` | `pearsonr` sur série constante → coefficient = NaN → `ValueError('Out of range float values are not JSON compliant')` (treasury_analytics.py:387). |
| **Bug 1** | Supervisor TESORO voit agents Ayuntamiento + Camara dans Workload + Auditoria + Analista IA | `/admin/service-requests/treasury/stats/workload-dashboard`, `/audit`, etc. | 5 sous-requêtes (`q_daily_velocity`, `q_sla_breakdown`, `q_volume_trend`, `q_processing_times`, `q_rankings`) lisent `mv_agent_daily_workload` et `payment_validation_audit` SANS filtre `entity_code='TESORO'` (admin_routes.py:6766+). Idem côté audit. |

**Note** : aussi observé dans `q_kpis` sur la sous-requête `queue` qui n'inclut pas le filtre entity, alors que `period_stats` inclut `loc_filter_pva` mais pas le filtre TESORO entity (le filtre TESORO n'apparaît que pour `total_agents`).

---

## Stratégie globale

Phase par phase, du plus simple au plus impactant. Chaque phase produit son propre plan détaillé dans `.claude/plans/` avant impl, exécution avec checklist, test, puis critique honnête.

| Phase | Titre | Fichiers principaux |
|-------|-------|---------------------|
| 1 | Fix Bug 3 — `get_effectiveness_report` | `rules_repository.py` |
| 2 | Fix Bug 2 — sanitize NaN/Inf dans treasury_analytics | `treasury_analytics.py` |
| 3 | Fix Bug 1 — Scope entité strict sur workload dashboard + audit + autres sous-menus Informes | `admin_routes.py` (treasury endpoints) |
| 4 | Audit complet sous-menus Informes (statistiques, anomalies, exportaciones, analista IA) — vérifier scope entité partout | `admin_routes.py` + Analista IA service |
| 5 | Critique globale, commits sémantiques, demande confirmation push (Règle #13) |

---

## Checklist globale

- [x] Master plan rédigé et enregistré dans `.claude/plans/`
- [ ] Phase 1 : plan détaillé écrit, méthode `get_effectiveness_report` implémentée, test endpoint, checklist validée
- [ ] Phase 2 : plan détaillé écrit, sanitize NaN/Inf appliqué côté correlations + global, test, checklist validée
- [ ] Phase 3 : plan détaillé écrit, filtre `entity_code = tctx.entity_code` ajouté à toutes les queries treasury workload, test, checklist validée
- [ ] Phase 4 : audit autres sous-menus Informes, fix appliqués si fuites identifiées, test, checklist validée
- [ ] Phase 5 : auto-critique globale, vérifier zéro régression non-tesoro, commits locaux groupés, demande confirmation push

---

## Contraintes & règles applicables

- **Règle #1** : JAMAIS de build manuel gcloud — push vers develop, GitHub Actions construit.
- **Règle #12** : interroger BD directement avant d'écrire un INSERT/UPDATE.
- **Règle #13** : demander confirmation explicite avant push.
- **Règle #16** : zéro régression sur workflows non-tesoro stables (cnedoge, conducir, residencia, bundle, etc.).
- **Règle #19** : `status::text` pour comparaisons enum.
- **Règle #20** : Location scope absolu — un site overload ne reroute jamais vers autre site.
- **OWASP** : aucun input non-paramétré dans les SQL ; vérifier autorisation entité (P8.2-B1 : tesoreria.ge avait validé AYUNT payments).
- **1M+ users** : pas de N+1 ; rester sur les MVs et indexes existants ; ajouter un join entity_id index-friendly seulement.

---

## Risques identifiés

1. **Régression sur autre supervisor non-TESORO** : si on remplace `WHERE e.code = 'TESORO'` par `WHERE e.code = $entity_code` dans les queries déjà filtrées, il faut garder la sémantique pour les non-TESORO qui appelleraient cet endpoint. **Mitigation** : ce endpoint est dans `/treasury/...`, donc dédié — garder TESORO mais filtrer les MVs aussi.
2. **Cache key collision** : `cache_key = f"treasury:workload_dashboard:{days}:{loc_key}"` ne tient pas compte de `entity_code`. Si on rendait l'endpoint multi-entité, il faudrait l'ajouter. **Mitigation** : garder TESORO-only pour cet endpoint, pas de changement cache.
3. **JSON NaN partout dans treasury_analytics** : pas que dans correlations. Trends, predictions, statistics peuvent aussi produire NaN/Inf. **Mitigation** : sanitizer global avec `_clean_float()` appliqué aux floats dans tous les modèles.

---

## Sources de vérité utilisées

- Logs Cloud Run captés en session (insertId 69fb74a3..., 69fb7561..., 69fb7562...)
- `app/modules/assignment/api/supervisor_routes.py:2024` — appel manquant
- `app/modules/assignment/repositories/rules_repository.py` — méthode absente, lignes existantes 33-440
- `app/modules/service_requests/services/treasury_analytics.py:387` — pearsonr NaN
- `app/modules/service_requests/api/admin_routes.py:6766+` — workload dashboard sans filtre entité
- Images debug : `Documentations/workflow/debug/tesoro/{1,2,3,4}.png`

---

## Validation finale

À l'issue de Phase 5, le supervisor "Tesoro Público" doit :
1. Voir uniquement les 3 agents TESORO (Tesoro TGE, Tesoro Bata, Sup Tesoro) — JAMAIS Camara/Ayuntamiento dans Workload, Audit, Analista IA, Estadisticas.
2. Charger la page Analytics Reporte sans erreur (correlations rendues correctement même sur séries constantes).
3. Voir la card "Eficacia de Reglas" du dashboard sans erreur 500.

---

## Phase 8 — Hardening pre-push (2026-05-06)

Traitement des risques résiduels identifiés à l'audit avant push :

### Résolus
- **Risque 1 (cache stale)** → bumped 4 cache_keys to `:v2` (supervisor_overview, workload_dashboard, analyst:ask, analyst:briefing). Effet immédiat post-deploy : ancien cache abandonné, nouvelles entrées scopées.
- **Risque 2 (run_detection global)** → propagation de `entity_code` aux 7 méthodes `_detect_*` du service. Pattern paramétré ($N), entity_code=None → comportement global préservé. `_detect_orphan_transactions` court-circuite avec log explicite (bank tx orphelines non-attribuables).
- **Risque 4 (export inactif profile)** → migration 333 ajoute `requested_by_entity_code` dénormalisé sur `treasury_exports`. Backfill auto. `_authorize_export_action` utilise COALESCE(col, JOIN agent_profiles) → indépendant de l'état du profile. INSERT côté `/treasury/exports/generate` capture la valeur au moment de la création.

### Documenté (pas de fix code)
- **Risque 3 (bank_transactions partagées)** : design intentionnel. Les transactions bancaires arrivent du système bancaire AVANT toute attribution à un payment ; le scoping par entité n'est pas applicable au niveau de la table. La reconciliation (`/treasury/reconciliation/*`) est elle scopée côté candidat-payment via `service_payments.entity_code`. Les transactions non-réconciliées restent visibles à toutes les entités, ce qui est nécessaire pour l'opération (toute entité doit pouvoir matcher une tx pending). Aucune PII dans `bank_transactions` (ref bancaire + montant). Acceptable.

### Out of scope (à traiter ultérieurement si besoin)
- **Frontend dashboards "TESORO" hardcoded** : si certaines pages frontend affichent encore "Tesoro Público" comme titre statique pour un supervisor AYUNTAMIENTO, il faudra dériver le titre depuis `tctx.entity_code` côté UI.
- **Audit /api/v1/inspection/* et /api/v1/oms/*** : autres modules potentiellement vulnérables au même bug, hors scope car non rapporté.
