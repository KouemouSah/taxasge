# BILAN SESSION — Bundle workflow debug

**Date de début** : 2026-04-13
**Date de fin** : 2026-04-14
**Branche** : `develop`
**Durée cumulée** : ~8h effectives sur 2 journées
**Déclencheur initial** : Bug production `POST /api/v1/bundle-workflow/initiate-payment → 500` — 100 % des bundle-payments en échec depuis la migration 291

---

## 1. Résumé exécutif

La session a débuté sur un bug bloquant en production (100 % des `bundle-payment` en échec) et s'est transformée en un **audit architectural complet** du workflow bundle (citoyen → collecte → traitement ministère). Au fil des tests, chaque fix a exposé un bug latent suivant (layered bugs), révélant une série de bugs dormants que personne n'avait jamais déclenchés en production.

**État final** :
- ✅ **Happy path bundle-payment fonctionne** jusqu'à la création atomique des 3 service_payments
- ✅ **Backend routing Vision B** (Mode A per_line → MIN_* agents) **complètement fonctionnel** — prouvé par 2 assignments + 2 emails + 14 events de routing
- ✅ **Validation Tesoro cash payment** techniquement réussie (workflow_status=completed, obligations routées)
- ❌ **UI côté agents MIN_\*, AYUNTAMIENTO, CAMARA_COMERCIO** : frontend fetch les mauvaises pages/endpoints → listes vides malgré des données correctes en BD
- ❌ **UX citoyen post-paiement** : page détail LIC-xxxx sans liste d'obligations, pas de reçu PDF, pas de notifications

---

## 2. Phases exécutées + commits poussés

### Phases 1-5 (session 2026-04-13)
Master plan : `.claude/plans/BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`

| # | Phase | Commit | Fichiers | Tests |
|---|---|---|---|---|
| P1 | Fix INSERT service_requests.commercial_license_id + lock timeouts + i18n | `143e0a06` (absorbé dans un commit Phase 8 `agents-llm` par session parallèle) | 6 | 6/6 repo pytest |
| P2 | Audit call sites `sr_repo.create()` + garde défensive + batch regression test | `5dd6b3de` (même mélange) | 3 | 7/7 |
| P3 | Frontend `extractApiError` + catalog 18 codes × 3 langues + `BundleErrorAlert` | `50a61d7a` (worktree puis cherry-pick) | 9 | 11/11 jest |
| P4 | `db_error_handler` + 9 nouveaux `ErrorCode` DB_* + mapping asyncpg → métier | `5816cc62` | 5 | 15/15 pytest |
| P5 | Rate limit dual-key (user + IP) + audit log third-party + renommage `DEFAULT_VALIDATOR_ENTITY_CODE` | `bb4a3628` | 5 | 7/7 pytest |

### Hotfix P1.1 (session 2026-04-14)
Plan : `.claude/plans/BUNDLE_DEBUG_PHASE1_PLAN.md` (étendu)

| # | Commit | Scope |
|---|---|---|
| P1.1 | `a0ad80a2` | Fix `fee_type='bundle'` hardcodé → `entity_obligations[0]['fee_type']` dans `bundle_workflow_service.initiate_payment` + retrait filtre redondant ligne 878 + test régression invariants |

### Fix B1 + B2 (session 2026-04-14)
Plan : conversation Phase 8 ci-dessous.

| # | Commit | Scope |
|---|---|---|
| B1+B2 | `37eaef5d` | FK `validated_by_agent_id` reçoit agent_profile_id (pas user_id) + PaymentAssignmentHandler propage `target_entity_code` au lieu de TESORO hardcodé + rename constant + wire `PaymentContext.metadata.target_entity_code` dans bundle_workflow_service |

### Fix X3 (session 2026-04-14)
| # | Commit | Scope |
|---|---|---|
| X3 | `b196e01e` | Remove writes to `agent_performance_stats.sla_respect_percentage` (GENERATED ALWAYS column) dans `update_sla_stats` et `reset_monthly_stats` |

**Total poussé sur `origin/develop`** : 7 commits effectifs (+ 2 absorbés par la session B).

---

## 3. Architecture finale du bundle-payment (vérifiée en BD)

### 3.1 Flux complet

```
CITIZEN WIZARD (frontend bundle-workflow)
    ↓ selects company + obligations + payment method
    ↓ POST /api/v1/bundle-workflow/initiate-payment
    ↓
BundleWorkflowService.initiate_payment(conn)
    ↓ SET LOCAL lock_timeout='3s', statement_timeout='5s'
    ↓ SELECT commercial_license FOR UPDATE NOWAIT
    ↓ Audit log if user != company owner
    ↓ Group obligations by entity via v_obligation_routing (payment_validator role):
    ↓   fee_type='tesoro' → TESORO
    ↓   fee_type='municipal' → AYUNTAMIENTO
    ↓   fee_type='chamber' → CAMARA_COMERCIO
    ↓
CREATE 1 service_request (workflow_code='BUNDLE_PAYMENT', primary_entity)
    ↓ fail-fast guard in sr_repo.create() if commercial_license_id/fiscal_year missing
    ↓ trigger fn_enforce_bundle_sr_integrity validates at DB level
    ↓
LOOP per entity_group:
    ↓ PaymentContext with metadata.target_entity_code = entity_code (NEW in commit 37eaef5d)
    ↓ registry.initiate_payment → manual_processor.initiate (for cash/check)
    ↓   CREATE service_payment
    ↓   PUBLISH EVENT PAYMENT_MANUAL_PENDING (with target_entity_code in payload)
    ↓
HANDLER PaymentAssignmentHandler.handle_manual_payment_pending
    ↓ Reads target_entity_code from payload (fallback TESORO if missing)
    ↓ Resolves entity_location for same city
    ↓ AutoAssignmentService.auto_assign_item(entity_code=target_entity_code)
    ↓   RulesEngine: workload + availability + site match
    ↓ UPDATE service_payment SET assigned_agent_id = <result>
    ↓
UPDATE service_payments (bundle_workflow_service)
    ↓ SET fee_type = entity_obligations[0].fee_type (hotfix a0ad80a2)
    ↓ SET entity_code = primary entity, company_id
    ↓
UPDATE license_obligations
    ↓ SET payment_id = <created sp>, status = 'payment_pending'
    ↓
RESPONSE: redirect_url (BANGE) OR confirmation (cash)

───────────────────────────────────────────────────────────

AGENT VALIDATES CASH PAYMENT (Tesoro, Ayuntamiento, Camara)
    ↓ POST /api/v1/admin/service-requests/treasury/payments/{id}/validate
    ↓
manual_processor.validate_payment(db, payment_id, agent_profile_id)
    ↓ Resolve user_id from agent_profile_id for logs/notifs only
    ↓ UPDATE service_payments SET validated_by_agent_id = agent_profile_id (FK ok)
    ↓ receipt_service.generate_and_store_receipt
    ↓ LicenseService.on_payment_completed(db, payment_id)
    ↓   UPDATE license_obligations SET status='paid'
    ↓   ObligationRoutingService.route_paid_obligations(obligations, license_row)
    ↓     Per obligation, resolve_target_entity:
    ↓       municipal → AYUNTAMIENTO (always)
    ↓       chamber → CAMARA_COMERCIO (always)
    ↓       tesoro + Mode A (per_line) → ministry entity (MIN_HACIENDA, MIN_AGRICULTURA, etc.)
    ↓       tesoro + Mode B (consolidated) → TESORO polyvalent
    ↓     UPDATE obligation status='processing'
    ↓     AutoAssignmentService.auto_assign_item(item_type='obligation_processing')
    ↓     Notify assigned agent via email
    ↓ WorkloadRepository.update_sla_stats (fix b196e01e: no writes to generated column)
```

### 3.2 Tables / contraintes clés (vérifiées via psycopg2 directe)

- `commercial_licenses.fiscal_year INT NOT NULL` — existait avant, clé de la garde trigger 291
- `service_requests.source varchar NOT NULL DEFAULT 'citizen_wizard'`
- `service_requests` triggers actifs (7) :
  - `trg_sr_auto_reference` (BEFORE INSERT)
  - `trg_resolve_workflow_code` (BEFORE INSERT)
  - `trg_enforce_bundle_sr_integrity` (BEFORE INSERT/UPDATE) — **migration 291**
  - `trg_sync_license_sr_id` (AFTER INSERT/UPDATE) — auto-sync commercial_licenses.service_request_id
  - `trg_sr_updated_at`, `trg_auto_submitted_at`
- `service_payments_fee_type_check` : `fee_type IN ('tesoro', 'municipal', 'chamber')` — **n'accepte PAS 'bundle'**
- `service_payments_validated_by_agent_profile_id_fkey` : FK → `agent_profiles(id)` (malgré la tentative de migration 172 qui a voulu changer ça mais n'a pas droppé la FK)
- `agent_performance_stats.sla_respect_percentage` : **GENERATED ALWAYS** via `CASE WHEN count=0 THEN 0 ELSE (respected / total) * 100 END`
- `idx_sr_commercial_license_unique` : UNIQUE partial on `service_requests.commercial_license_id WHERE NOT NULL`
- `v_obligation_routing` view : deux rôles `payment_validator` + `post_payment_processor` (Vision B) — **utilisée par obligation_routing_service**

### 3.3 Domaines 1:1 vérifiés
- `license_obligations.fee_type` ↔ `entities.code` (payment_validator) : strict 1:1
- `ministries.id` ↔ `entities.id` : **PAS** de FK entre ces deux tables (référentiel catalogue vs opérationnel)

---

## 4. État des bugs post-session

### ✅ Résolus
| # | Bug | Commit |
|---|---|---|
| P1 | `CheckViolationError: must have commercial_license_id` | `143e0a06` |
| P1 | `CheckViolationError: must have fiscal_year` | `143e0a06` |
| P1 | Missing lock timeouts CLAUDE.md | `143e0a06` |
| P1 | i18n erreurs bundle | `143e0a06` |
| P2 | Garde call sites `sr_repo.create()` | `5dd6b3de` |
| P3 | Frontend toast "Request failed status 500" générique | `50a61d7a` |
| P4 | Exceptions asyncpg non structurées (OWASP A05) | `5816cc62` |
| P5 | DoS risque endpoint `initiate-payment` | `bb4a3628` |
| P5 | Audit trail incohérent third-party vs initiate | `bb4a3628` |
| P1.1 | `CheckViolationError: service_payments_fee_type_check` (`'bundle'`) | `a0ad80a2` |
| B1 | FK violation `validated_by_agent_id` (bug latent depuis commit `67ded0f5` du 5 mars 2026) | `37eaef5d` |
| B2 | Bundle splits tous routés TESORO au lieu de AYUNT/CAMARA | `37eaef5d` |
| B3 | (résolu par B2) | `37eaef5d` |
| B4 | (pas un bug — cache UI obsolète, obligations étaient bien en `payment_pending`) | n/a |
| B5 | (résolu par B2 — dashboard vs validation page cohérents) | `37eaef5d` |
| X3 | `GeneratedAlwaysError: sla_respect_percentage can only be updated to DEFAULT` | `b196e01e` |

### ❌ Non résolus (backlog Phase 8)

Voir `BUNDLE_DEBUG_PHASE8_PLAN.md` pour détail complet.

| # | Description | Sévérité |
|---|---|---|
| X4 | Agents MIN_* (agricultura, hacienda, …) voient 0 dans `/oms/queue/pending` malgré assignments BD corrects | 🔴 High |
| X2 | Agents AYUNT/CAMARA voient 0 dans `/oms/validation/pending` malgré paiements assignés | 🔴 High |
| X1 | Tesoro dashboard compte 3 mais validation page 1 (filtres incohérents) | 🟡 Medium |
| X4b | La page bundle payment montre juste le montant sans la liste des obligations | 🟡 Medium |
| B6 | Page citoyen LIC-2026-0000x sans liste des obligations choisies/payées + PDF récépissé vide | 🟡 Medium |
| B7 | Notifications/reçu/summary PDF parity avec workflows non-bundle | 🟡 Medium |
| X5 | 0 agents actifs pour MIN_COMERCIO, MIN_ELECTRICIDAD, MIN_INFORMACION en staging | 🟢 Low (data only) |
| 172 | Migration 172 `fix_validated_by_agent_id` : code SQL présent en repo mais **jamais appliqué** en staging + FK conserve `agent_profiles(id)` — décider drop ou re-apply complete | 🟢 Low (dead code) |

---

## 5. Tests verts en local (cumulatif sur la session)

| Module | Tests | Résultat |
|---|---|---|
| `tests/unit/service_requests/test_service_request_repository_bundle.py` | 7 | 7/7 ✅ |
| `tests/unit/fiscal_services/test_bundle_fee_type_invariant.py` | 3 | 3/3 ✅ |
| `tests/unit/core/test_db_error_handler.py` | 15 | 15/15 ✅ |
| `tests/unit/core/test_rate_limit.py` | 7 | 7/7 ✅ |
| `packages/web/src/core/api/__tests__/errors.test.ts` | 11 | 11/11 ✅ |
| **Total** | **43** | **43/43** |

---

## 6. État BD staging (2026-04-14 ~14:40)

### Licence de test `b840aaaa-18a2-4b6f-a4fb-5c80d3a54576` (TIENDA HERMIONNE LIZE)
- `processing_mode='per_line'` (Mode A)
- Statut `partial`
- City : Malabo

### 3 service_payments (bundle splits)
| Reference | Entity | Amount | Agent assigné | Workflow status |
|---|---|---|---|---|
| `CSH-...A8826196` | TESORO | 117 000 | `tesoreria.ge@outlook.fr` | **completed** (validé) |
| `CSH-...3206EE74` | AYUNTAMIENTO | 99 000 | `ayumalabo1@gmail.com` | pending_agent_review |
| `CSH-...AE6976C0` | CAMARA_COMERCIO | 20 000 | `camaramalabo1@gmail.com` | pending_agent_review |

(Les 2 derniers ré-assignés par le backfill SQL `scripts/debug_bundle_b1b2_backfill.sql`)

### 9 obligations de la licence
- 1 chamber → `payment_pending` (attend validation CAMARA)
- 1 municipal → `payment_pending` (attend validation AYUNT)
- 1 tesoro MIN_AGRICULTURA → `processing` + assignment à `agrimalabo@outlook.fr` + email envoyé ✅
- 1 tesoro MIN_HACIENDA → `processing` + assignment à `malabohacienda@gmail.com` + email envoyé ✅
- 4 tesoro MIN_COMERCIO → `processing` **mais 0 assignment** (0 agents actifs)
- 1 tesoro MIN_INFORMACION → `pending` + no payment (user deselected volontairement)

### Events compliance
- 9 `payment_initiated` events
- 7 `payment_validated` events (7 obligations effectivement validées lors du test)
- 14 `obligation_routed` events (compte paire events d'historique)
- 1 `config_changed`

---

## 7. Règles importantes apprises / appliquées

1. **Toujours interroger la BD directement** (`psycopg2`) avant d'écrire du code — découverte : migration 172 désalignée avec FK, sla_respect_percentage generated column, v_obligation_routing deux rôles
2. **Commit local par phase, push uniquement après validation globale**
3. **Sessions parallèles TaxasGE** : quand une autre session Claude est active sur le même repo, elle peut absorber le working tree via `git add -A` → les commits locaux se fusionnent avec ses changements. Atténuation : utiliser `git worktree` pour isoler
4. **Lock timeouts CLAUDE.md** : `SET LOCAL lock_timeout='3s'` + `statement_timeout='5s'` obligatoires sur chemins bundle critiques
5. **Layered bugs** : quand un bug débloque un chemin, le bug suivant se révèle. Budgeter pour ça
6. **GENERATED ALWAYS columns** : PostgreSQL 15+ rejette toute écriture manuelle. Toujours vérifier `is_generated` et `generation_expression` avant d'écrire un UPDATE
7. **v_obligation_routing** : vue BD pivot avec 2 routing_roles (`payment_validator`, `post_payment_processor`). C'est l'autorité canonique pour savoir qui collecte vs qui traite
8. **Vision A (polyvalent) vs Vision B (per-ministère)** : coexistent via `commercial_licenses.processing_mode` (per_line / consolidated). Ce N'EST PAS un choix global métier — c'est un choix PAR LICENCE fait par le citoyen dans le wizard

---

## 8. Scripts et outils produits

- `scripts/debug_bundle_p1_db_probe.py` — probe Phase 1
- `scripts/debug_bundle_p2_db_probe.py` — probe Phase 2 (pg_proc, cascade triggers, base_code resolution)
- `scripts/debug_bundle_p5_db_probe.py` — probe Phase 5 (indexes, FK, row counts)
- `scripts/debug_bundle_b1b2_backfill.sql` — backfill SQL pour réassigner les 3 paiements avant B1+B2 fix

Ces scripts sont gitignorés (`scripts/` dans `.gitignore`) mais présents sur disque local. Ils servent de référence et de template pour la Phase 8.

---

## 9. Décisions architecturales validées

1. **Mode A = per-ministère** (per_line) : route chaque obligation tesoro vers son ministère propriétaire (MIN_*). Vision B dans mon doc de décision qui est désormais **obsolète** — car coexiste avec Vision A via processing_mode par licence
2. **Mode B = polyvalent** (consolidated) : tous les tesoro obligations vont à TESORO polyvalent
3. `fee_type` sur service_payments est une **catégorie fiscale** (tesoro/municipal/chamber), pas un marqueur structurel
4. `workflow_code='BUNDLE_PAYMENT'` sur service_requests est LE marqueur bundle (utilisé par trigger 291 et par obligation_routing)
5. `PaymentContext.metadata.target_entity_code` est le canal de propagation du routing intent du caller (bundle_workflow_service) vers le handler async (PaymentAssignmentHandler)

---

## 10. Références

- `.claude/plans/BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`
- `.claude/plans/BUNDLE_DEBUG_PHASE1_PLAN.md`
- `.claude/plans/BUNDLE_DEBUG_PHASE2_PLAN.md`
- `.claude/plans/BUNDLE_DEBUG_PHASE2_AUDIT.md`
- `.claude/plans/BUNDLE_DEBUG_PHASE3_PLAN.md`
- `.claude/plans/BUNDLE_DEBUG_PHASE4_PLAN.md`
- `.claude/plans/BUNDLE_DEBUG_PHASE5_PLAN.md`
- `.claude/plans/BUNDLE_ROUTING_VISION_DECISION.md` (**OBSOLÈTE** — présente A/B comme exclusives alors qu'elles coexistent. À ignorer, remplacé par ce bilan + Phase 8 plan)
- `.claude/plans/BUNDLE_DEBUG_PHASE8_PLAN.md` (prochaine session)

---

**Fin du bilan.**
