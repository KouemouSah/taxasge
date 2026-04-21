# BILAN SESSION 2 — Bundle workflow debug Phase 8

**Date de début** : 2026-04-14
**Date de fin** : 2026-04-16
**Branche** : `develop`
**Worktree** : `bundle-phase8` (branche `worktree-bundle-phase8`)
**Durée cumulée** : ~16h effectives sur 3 journées

---

## 1. Résumé exécutif

Session 2 a repris le travail Phase 8 depuis le boot prompt `BUNDLE_DEBUG_PHASE8_BOOT.md`. Les items CRITICAL (X9, X2, X8) sont tous résolus. L'architecture multi-entité (TESORO + AYUNTAMIENTO + CAMARA_COMERCIO) est fonctionnelle de bout en bout : création bundle citoyen → splits par entité → validation par agent → reçu PDF correct → email citoyen. La sécurité cross-entité est renforcée via `_authorize_payment_action` et `TreasuryAgentContext` strict.

**État final** :
- ✅ **X9** : redirect post-validation via menu_config (plus hardcode /supervisor)
- ✅ **X2** : multi-entity validation flow complet (6 commits couvrant entity scoping, sécurité, MVCC race, city routing, widget scoping, queue_stats bundle-aware)
- ✅ **X8** : receipt PDF avec montants réels + noms d'obligations + header entity-aware
- ✅ **X5** : déjà résolu (agents MIN_* actifs en staging)
- ✅ **X1** : partiellement résolu par B2 (dashboard stats entity-scoped)
- ❌ **X4** : MIN_* queue/stats gap (obligation_processing vs service_payments) — tracké pour Phase 9

---

## 2. Commits poussés sur `origin/develop` (13 commits)

| # | Commit | Scope |
|---|---|---|
| 1 | `751022ba` | P8.1 X9: route "Back to dashboard" via menu_config + delete treasury/page.tsx orphan |
| 2 | `32981347` | Commit A: TreasuryAgentContext entity-scoped + get_pending_payments entity filter + dashboard_stats + locations + reassign + escalate + migration 294 |
| 3 | `9e73d4c5` | B1: security hotfix `_authorize_payment_action` validate/reject/escalate + sp.entity_code filter |
| 4 | `b8f20aa0` | B1.1: remove duplicate PAYMENT_MANUAL_PENDING publish (wrong key entity_code vs target_entity_code) |
| 5 | `397caf99` | B1.2: inline auto-assignment in T1 to close MVCC race + skip event publish for BUNDLE_PAYMENT |
| 6 | `633c206e` | B1.3: resolve entity_location from license.city_id for city-matched routing |
| 7 | `6c1f3652` | B1.4: scope pending-payments dashboard widget by assignment + entity |
| 8 | `3e8cc3b9` | B2: bundle-aware queue_stats + grant service_request.view_queue_stats to AYUNT/CAMARA/MIN_* + OMS widgets registry |
| 9 | `ad9386ad` | X8: parse bundle calculation_details → real amounts in receipt PDF |
| 10 | `b5a97481` | X8b: snapshot fiscal_service.name_es in calc_details for obligation names |
| 11 | `87900934` | X8 hotfix: fs.code → fs.service_code (UndefinedColumnError) |
| 12 | `93069c18` | X8c: unicode fix + entity_locations human names + entity field from payment_data |
| 13 | `500e0069` | X8d: header entity_name + city, resolve entity display, fix agent_profile JOIN |

**Migrations SQL** : 294, 295, 296 (toutes idempotentes, appliquées en staging)

---

## 3. Architecture validée en staging

### 3.1 Flux complet bundle multi-entité (post session 2)

```
CITIZEN WIZARD → POST /bundle-workflow/initiate-payment
     ↓
BundleWorkflowService.initiate_payment (T1 transaction)
     ↓ SET LOCAL lock_timeout='3s' + statement_timeout='5s'
     ↓ SELECT commercial_license FOR UPDATE NOWAIT
     ↓ Group obligations by entity (v_obligation_routing)
     ↓
LOOP per entity_group (inside T1):
     ↓ registry.initiate_payment → manual_processor.initiate
     ↓   CREATE service_payment
     ↓   SKIP event publish for BUNDLE_PAYMENT (B1.2)
     ↓ UPDATE sp SET entity_code, fee_type, company_id
     ↓ Resolve target_location via license.city_id (B1.3)
     ↓ INLINE auto_assign_item(entity_code, location) (B1.2)
     ↓ UPDATE sp SET assigned_agent_id (visible in T1)
     ↓ UPDATE license_obligations SET payment_id, status='payment_pending'
     ↓
T1 COMMIT → all 3 splits atomically assigned

AGENT VALIDATES (per entity — each sees only their split):
     ↓ POST /treasury/payments/{id}/validate
     ↓ _authorize_payment_action(tctx, payment) (B1 security check)
     ↓ validate_manual_payment
     ↓ generate_and_store_receipt (X8: bundle-aware parser)
     ↓   Header: "{entity_name} - {city}" (X8d)
     ↓   Obligations: fiscal_service.name_es snapshotted (X8b)
     ↓   TOTAL: sp.total_amount (X8)
     ↓ ObligationRoutingService.route_paid_obligations
     ↓   Per obligation → resolve_target_entity (Mode A/B)
     ↓   AutoAssignmentService.auto_assign_item(entity_code=MIN_*)
     ↓   Email notification to assigned MIN_* agent
```

### 3.2 Scoping hierarchy (TreasuryAgentContext post-refactor)

```
1. Global (treasury.view_all)  → all entities, all sites
2. Entity-global (main-office supervisor) → own entity, all its sites
3. Site supervisor → own entity, own site
4. Regular agent → own assigned payments only
```

### 3.3 Receipt PDF structure (post-X8)

```
Header: {entity_name} - {city}
  (e.g. "Cámara de Comercio - Malabo")

Section: Paquete fiscal - {entity_code} (N items)
  {fiscal_service.name_es} .......... {amount} XAF
  {fiscal_service.name_es} .......... {amount} XAF
  ...
TOTAL PAGADO ........................ {sum} XAF

VALIDADO - {entity_name}
  {agent_name} | {date}
  QR code → /verify/REC-xxx?t=hmac
```

---

## 4. Bugs découverts et résolus pendant la session

### 4.1 MVCC race condition (B1.2)
`manual_processor` publiait l'événement PAYMENT_MANUAL_PENDING AVANT que la transaction T1 ne committe. Le handler (sur une autre connexion T2) ne voyait pas la service_payment row (MVCC snapshot isolation). Son `UPDATE sp SET assigned_agent_id WHERE id=X` retournait `UPDATE 0` silencieusement.
**Fix** : inline assignment dans T1 + skip event publish pour BUNDLE_PAYMENT.

### 4.2 Duplicate event publish (B1.1)
`bundle_workflow_service` publiait le même événement 2 fois : une via `manual_processor` (clé `target_entity_code` correcte) et une directement (clé `entity_code` incorrecte → fallback TESORO).
**Fix** : supprimer le publish direct (vestige pré-B1).

### 4.3 Cross-entity security leak (B1)
`validate_payment`, `reject_payment`, `escalate_payment` n'avaient AUCUN check per-payment au-delà de la permission. Tesoreria.ge a pu valider 583 650 XAF de paiements AYUNTAMIENTO.
**Fix** : `_authorize_payment_action(tctx, payment)` → assigné OU supervisor entité OU global.

### 4.4 Dashboard widget unscoped (B1.4)
`/dashboard/widgets/pending-payments` utilisait `v_pending_payment_validations` sans filtre → cross-entity leak dans les stats cards du dashboard agent.
**Fix** : query `service_payments` directement avec assignment/entity filter.

### 4.5 Queue stats SR-level pour bundle (B2)
`get_queue_stats` comptait les `service_requests` pour toutes les entités bundle (workflow_codes=['BUNDLE_PAYMENT']). Tous voyaient les mêmes 4 SRs.
**Fix** : branch bundle-aware qui compte `service_payments` scoped par `sp.entity_code`.

---

## 5. Règles établies

1. **Règle #16** : Fix bundle = zéro régression non-bundle. Si un fix touche un chemin partagé, isoler par condition `workflow_code == 'BUNDLE_PAYMENT'` ou trouver une autre solution.
2. **ayumalabo1.is_supervisor** = data bug corrigé (agent avec flag supervisor → cross-entity leak).
3. **Inline assignment** pour bundle élimine le MVCC race → pattern validé.
4. **Receipt fiscal_service name snapshot** : le nom est stocké dans calc_details au moment du bundle (document légal point-in-time).

---

## 6. Scripts produits

- `scripts/reset_bundle_staging.py` — reset atomique de tous les bundles staging (snapshot JSON + rollback SQL)
- `scripts/debug_bundle_p8_snapshot.py` — probe BD Phase 8
- Backups : `scripts/bundle_reset_snapshot_*.json` + `scripts/bundle_reset_rollback_*.sql`

---

## 7. État BD staging (2026-04-16 fin de session)

- 1 bundle actif (LIC-2026-00001, enterprise de test)
- Certains splits validés, certains pending
- Migrations 294 + 295 + 296 appliquées
- Entity locations renommées (human-readable)
- Permissions `service_request.view_queue_stats` accordées aux AYUNT/CAMARA/MIN_*

---

## 8. Items restants (Phase 9)

| # | Item | Sévérité | Description |
|---|---|---|---|
| **X4** | 🟠 High | MIN_* queue/stats gap : count `assignments` (obligation_processing) au lieu de `service_payments` pour entities processeurs |
| **UI1-UI9** | 🟡 Med | OMS validation page cleanup bundle-aware (conditional sections, i18n, UUID formatters) |
| **B6** | 🟡 Med | Page citoyen bundle-details + PDF enrichi avec obligations |
| **B7 niv 2** | 🟢 Low | Email parity bundle (split X/N info, template custom) |
| **409 guard** | 🟡 Med | Relaxer le guard anti-double-paiement pour paiements partiels multi-étapes |
| **Cosmétique reçu** | 🟢 Low | Encoding unicode résiduel (scan BD), receipt download agent_profile JOIN |
| **run_migrations.py** | 🟢 Low | Upgrade avec tracking table (P8.2.G) |
| **P8.2-B** | 🟡 Med | workload_dashboard + supervisor_overview entity-aware refactor |
| **MVCC race non-bundle** | 🟡 Med | Même race potentielle dans wizard_session_service (latent, non-triggered) |

---

## 9. Références

- `.claude/plans/BUNDLE_DEBUG_PHASE8_BOOT.md` — prompt d'initialisation session 2
- `.claude/plans/BUNDLE_DEBUG_PHASE8_PLAN.md` — plan détaillé Phase 8
- `.claude/plans/BUNDLE_DEBUG_PHASE8_1_PLAN.md` — plan X9 détaillé
- `.claude/plans/BUNDLE_DEBUG_PHASE8_2_PLAN.md` — plan X2 détaillé
- `.claude/plans/BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md` — bilan session 1
- `memory/feedback_no_regression_working_flows.md` — règle non-régression

**Fin du bilan session 2.**
