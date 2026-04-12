# Rétro — Phase 3 : Reprise dossier + Idempotency + permissions fee_type

**Date** : 2026-04-11
**Plan** : `.claude/plans/INSPECTION_BUNDLE_P3_DETAIL.md`
**Statut** : ✅ DONE (commit local, pas push)

---

## Bilan chiffré

| Métrique | Valeur |
|----------|--------|
| Objectifs P3 du plan général | 3 (B11 Idempotency, B12 fee_type check, enriched verify) |
| Fichiers code modifiés | 4 (oms_agent_service, collection_service, inspection_routes, inspection_service) |
| Fichiers code nouveaux | 1 (app/core/idempotency.py) |
| Fichiers tests nouveaux | 3 (test_idempotency, test_permissions_fee_type, test_verify_enriched) |
| Correctifs dans repo | 1 (inspection_repository: ajout `lo.ministry_id` au SELECT) |
| Tests P3 | **20 passed** |
| Tests P1 regression | **19 passed / 1 skipped** (après adaptation du fixture) |
| Tests P2 regression | **10 passed** |
| **Total cumulé** | **49 passed / 8 skipped / 0 failed** |

---

## Ce qui a bien marché

1. **OmsAgentService déjà compatible** — toute la logique `INDEPENDENT_FEE_ROLES`, `POLYVALENT_ROLES`, `is_polyvalent`, `is_independent` existait déjà. Ajout de 2 helpers `compute_collection_scope` + `check_obligations_in_scope` = peu de dette technique.
2. **Idempotency helpers explicites** (pas de décorateur magique) — plus simple à déboguer, testable en isolation, pattern Stripe éprouvé.
3. **`/verify` enrichi backward-compatible** — additif seulement, l'app mobile existante ignore les nouveaux champs.
4. **Addendum 3 correctement implémenté** : polyvalent → `{'tesoro'}` only, pas `None` (municipal/chamber toujours indépendants). Testé explicitement.
5. **Fail-open sur cache** — si Redis tombe, les helpers Idempotency passent en mode pass-through au lieu de bloquer les requêtes.
6. **Rate limit 20/min/collect** — défense en profondeur sans coût fonctionnel.

---

## Découvertes / surprises

### Bug de dette technique trouvé
**`InspectionRepository.get_license_for_verification`** — la query obligations ne retournait PAS `lo.ministry_id` dans le SELECT, seulement `m.name_es AS ministry_name`. Mon code `obl.get("ministry_id")` retournait None → le check ministry échouait silencieusement. **Fixé** par ajout de `lo.ministry_id` au SELECT.

### Régression P1 détectée en test
Le fixture `test_data` P1 sélectionnait un agent (souvent `agent_ayuntamiento`) sans vérifier que son scope matche les obligations de la licence utilisée. Après P3.D (fee_type check), ces tests ont failli avec `PermissionError`. **Fixé** en rendant le fixture "scope-aware" : il choisit maintenant une licence avec obligations tesoro + un `agent_min_*` matching le ministry (fallback polyvalent). Les tests P1 sont re-verts.

### Bug enum `payment_workflow_status`
Ma query `has_pending_citizen_payment` utilisait `NOT IN (..., 'refunded')` mais `refunded` n'existe pas dans l'enum. **Fixé** — remplacé par les vraies valeurs finales : `completed, rejected_by_agent, expired, cancelled_by_user, cancelled_by_agent`.

---

## Ce qui n'a pas été fait (reporté)

| Item | Raison | Suite |
|------|--------|-------|
| Test E2E réel de l'Idempotency-Replay via FastAPI client | Nécessite un conftest httpx complet — lourd pour juste 1 test | P5 |
| Métriques Prometheus `idempotency_replay_total`, `collect_forbidden_total` | Observabilité = P5 | P5 |
| Alerte PagerDuty sur `forbidden > 10/h` | Observabilité = P5 | P5 |
| Tests `test_verify_restricted_for_ministry_agent` détaillé | Skipped si pas de licence multi-ministry en BD | À revisiter en P5 avec seed data |

---

## Risques résiduels

1. **Mobile app non-aware** — la UI actuelle ne va pas griser `restricted_obligations` tant que P4 Mobile Inspector n'est pas fait. En attendant, l'agent peut tenter de collecter et recevoir 403. Non-bloquant mais expérience UX dégradée.
2. **Idempotency cache éphémère (in-memory fallback)** — si Redis/Upstash tombe, le fallback in-memory est **par instance Cloud Run**. Retry du client vers une autre instance = cache miss. Acceptable (fail-open) mais non-idéal. P5 : monitoring Upstash uptime.
3. **Fixture P1 dépendante de données prod** — si la BD test n'a plus de licence tesoro pending, le fixture skip. À solidifier en P5 avec seed data.
4. **`resolve_agent_context` blocks non-OMS users** — un user avec `inspection.collect_payment` mais sans rôle OMS reçoit un `PermissionError` du nouveau check. Dans la pratique, tous les rôles avec cette permission SONT dans `OMS_PROCESSOR_ROLES`, mais c'est un couplage à surveiller (si on ajoute un nouveau rôle inspection, il faut le synchroniser).

---

## Prochaine étape

**P4** — Mobile Inspector : supervisor avancé + offline SQLite queue + FCM + intégration endpoints corrigés (P1+P2+P3).

**Avant P4** : validation utilisateur du commit local P3 + push possible pour valider CI sur P3.
