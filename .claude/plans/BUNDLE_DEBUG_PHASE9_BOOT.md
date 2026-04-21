# 🎯 REPRISE SESSION — Bundle Workflow TaxasGE Phase 9

> **INSTRUCTIONS D'UTILISATION** : ce fichier est un prompt d'initialisation de session. Une nouvelle session Claude Code doit lire ce fichier et **exécuter littéralement** son contenu comme ses instructions primaires. Commencer par l'étape 0, dans l'ordre.

---

Tu reprends le travail bundle-workflow TaxasGE. La session précédente (2026-04-14 à 2026-04-16) a poussé 13 commits sur `origin/develop` couvrant les items X9, X2, X8 de la Phase 8. Les flows multi-entité (TESORO + AYUNTAMIENTO + CAMARA_COMERCIO) fonctionnent de bout en bout. Il reste des gaps MIN_*, UX, et features citoyen.

# 0. ⚠️ AVANT TOUT CODE — CRÉER UNE WORKTREE

**Première action obligatoire** :
```
EnterWorktree(name="bundle-phase9")
```

# 1. 📋 RÉSUMÉ SESSION PRÉCÉDENTE (contexte embedded)

## Items résolus (Phase 8, session 2)

| Item | Commits | Scope |
|---|---|---|
| **X9** | `751022ba` | Redirect post-validation via menu_config (delete dead treasury/page.tsx) |
| **X2** | `32981347` → `3e8cc3b9` (6 commits) | Multi-entity validation: TreasuryAgentContext strict, security auth, inline assignment MVCC fix, city routing, widget scoping, queue_stats bundle-aware |
| **X8** | `ad9386ad` → `500e0069` (5 commits) | Receipt PDF: bundle calc_details parser, fiscal_service names, entity header, cosmetics |

## Architecture bundle validée

```
CITIZEN → initiate-payment
  ↓ T1 transaction (atomic)
  ↓ LOOP per entity: create sp + inline auto_assign(entity, city)
  ↓ COMMIT
AGENT validates (per entity, sees only their split)
  ↓ _authorize_payment_action check
  ↓ receipt PDF (bundle-aware: entity header + obligation names)
  ↓ obligation routing to MIN_* agents
```

## Scoping hierarchy (TreasuryAgentContext)
1. Global (treasury.view_all): all entities, all sites
2. Entity-global (main-office supervisor, no view_all): own entity, all sites
3. Site supervisor: own entity, own site
4. Regular agent: own assigned payments only

## Points sensibles à ne pas oublier
- `has_global_scope = has_treasury_view_all` (strict — plus supervisor+main_office)
- `sp.entity_code` pour le scope par propriété du paiement (pas `assigned_ap.entity_id`)
- Inline assignment dans T1 pour bundle (pas d'event async) via `auto_assign_item`
- `manual_processor` skip publish pour `workflow_code == 'BUNDLE_PAYMENT'`
- Receipt: fiscal_service.name_es snapshotted dans calc_details.obligations[].name
- Run migrations: `app.current_user_id` must be set for audit trigger on role_permissions

# 2. 🚫 RÈGLES NON NÉGOCIABLES

Identiques au BOOT Phase 8 (voir `.claude/plans/BUNDLE_DEBUG_PHASE8_BOOT.md` §2), plus :

- **Règle #16** : Fix bundle = zéro régression non-bundle. Si un fix touche un chemin partagé, isoler par condition. Bugs latents non-bundle = ticket séparé. Détails: `memory/feedback_no_regression_working_flows.md`
- **TOUJOURS vérifier la BD** avant d'écrire une query (règle #12). Session 2 a eu un crash car `fs.code` n'existait pas (la colonne est `fs.service_code`).
- **Script reset disponible** : `scripts/reset_bundle_staging.py --yes` pour nettoyer tous les bundles staging.

# 3. 📦 BACKLOG PRIORISÉ — Phase 9

| # | Bug | Sévérité | Effort | Description |
|---|---|---|---|---|
| **X4** | 🟠 High | 3-4 h | **MIN_* voient 0 dans queue/stats et widgets**. Root cause : B2 `get_queue_stats` bundle path compte `service_payments` → 0 pour MIN_* qui sont des processeurs d'obligations (pas de sp). Fix : pour entities "processeur", compter `assignments WHERE item_type='obligation_processing'`. Widget `oms_pending_validations` doit aussi être adapté pour montrer les obligations (pas les payments). Le frontend `/oms/queue/pending` utilise `PendingPage` qui fetche des `service_requests` → ne voit pas les obligations assignées. |
| **UI1-UI9** | 🟡 Med | 3-4 h | 9 issues UX cumulées sur la page OMS validation (conditional sections, i18n keys manquantes, UUID formatters, boutons non traduits). Voir `BUNDLE_DEBUG_PHASE8_PLAN.md` §P8.3bis pour le détail. |
| **409 guard** | 🟡 Med | 2 h | `bundle_workflow_service` guard anti-double-paiement est trop restrictif (bloque par company_id). Un citoyen qui a payé 8/10 obligations ne peut pas initier un 2ème bundle pour les 2 restantes. Fix : checker par overlap d'obligations sélectionnées, pas par company_id global. Aussi mettre à jour `idx_sr_commercial_license_unique`. |
| **B6** | 🟡 Med | 3-4 h | Page citoyen `/dashboard/service-requests/{id}` pour bundle : afficher liste obligations + montants + statuts + PDF enrichi. |
| **P8.2-B** | 🟡 Med | 2-3 h | `get_workload_dashboard` + `get_supervisor_overview` entity-aware refactor (3 TESORO hardcodes restants). Grant `treasury_stat.view` si nécessaire. |
| **B7 niv 2** | 🟢 Low | 2-3 h | Email parity bundle : template split X/N + bundle_completed event quand tous splits validés. |
| **run_migrations.py** | 🟢 Low | 2 h | Upgrade avec tracking table `schema_migrations`, baseline, fail-hard, checksum. |
| **MVCC race non-bundle** | 🟢 Low | 1-2 h | Même race potentielle dans `wizard_session_service`. Fixable par inline assignment scoped via workflow_code condition. |

**Ordre recommandé** : X4 → 409 guard → UI1-UI9 → P8.2-B → B6 → B7 niv 2 → run_migrations → MVCC

# 4. 🧪 WORKFLOW DE DÉMARRAGE

1. **Créer worktree** : `EnterWorktree(name="bundle-phase9")`
2. **Lire les contextes** :
   - `BUNDLE_DEBUG_SESSION2_BILAN_2026_04_16.md` (bilan complet)
   - `BUNDLE_DEBUG_PHASE8_PLAN.md` (plan détaillé items restants)
   - `CLAUDE.md` (racine) — règles projet
   - `memory/MEMORY.md` — mémoire persistante
3. **Snapshot git** : `git log --oneline -15` + `git status`
4. **Snapshot BD** : `scripts/debug_bundle_p8_snapshot.py` ou probe ciblé
5. **Rédiger** plan détaillé du premier item (X4)
6. **Demander validation** utilisateur avant tout changement code
7. Implémenter → Tests → Commit local → Validation → Push

# 5. 🚫 CE QUE TU NE DOIS PAS FAIRE SANS AUTORISATION

- `git push` sans confirmation explicite
- Modifier le code de workflows non-bundle (cnedoge, conducir, residencia, etc.)
- `DROP` / `TRUNCATE` en BD staging
- Refactor au-delà du scope du ticket
- Créer des migrations SQL sans vérifier les colonnes en BD d'abord (règle #12)

# 6. 📨 PREMIER MESSAGE ATTENDU

Après worktree + lecture contexte + snapshots :

Résume en **3-5 phrases** :
1. Ce que tu as compris du contexte (1 phrase)
2. Ton plan pour le premier item X4 (2 phrases)
3. Questions ouvertes nécessitant décision utilisateur (1-2 phrases)

Attends la **validation user explicite** avant tout changement de code.

---

**Fichiers clés à consulter** :
- `.claude/plans/BUNDLE_DEBUG_SESSION2_BILAN_2026_04_16.md` — bilan session 2
- `.claude/plans/BUNDLE_DEBUG_PHASE8_PLAN.md` — détail items backlog
- `packages/backend/app/modules/service_requests/api/agent_routes.py` — get_queue_stats (bundle path)
- `packages/backend/app/modules/service_requests/api/admin_routes.py` — TreasuryAgentContext + endpoints treasury
- `packages/backend/app/modules/fiscal_services/services/bundle_workflow_service.py` — initiate_payment (inline assignment)
- `packages/backend/app/modules/payments/services/receipt_service.py` — receipt bundle parser
- `packages/backend/app/modules/payments/services/processors/manual_processor.py` — validate_manual_payment
- `packages/backend/app/modules/payments/handlers/payment_assignment_handler.py` — event handler (legacy non-bundle)
- `packages/web/src/modules/agent-dashboard/components/widgets/WidgetRegistry.tsx` — OMS widget aliases
- `scripts/reset_bundle_staging.py` — staging reset tool

**Fin du prompt. Commence par l'étape 0.**
