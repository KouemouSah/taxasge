# 🎯 REPRISE SESSION — Bundle Workflow TaxasGE Phase 8

> **INSTRUCTIONS D'UTILISATION** : ce fichier est un prompt d'initialisation de session. Une nouvelle session Claude Code doit lire ce fichier et **exécuter littéralement** son contenu comme ses instructions primaires. Commencer par l'étape 0, dans l'ordre.

---

Tu reprends le travail bundle-workflow TaxasGE. La session précédente (2026-04-13/14) a poussé 7 commits sur `origin/develop` pour corriger une série de bugs layered. Le backend fonctionne. Il reste des gaps UX frontend + 2 tâches data.

# 0. ⚠️ AVANT TOUT CODE — CRÉER UNE WORKTREE

**Première action obligatoire** (règle anti-conflits inter-sessions) :
```
EnterWorktree(name="bundle-phase8")
```

Raison : des sessions Claude parallèles actives sur le même repo ont absorbé 2× le working tree via `git add -A` pendant la session précédente (commits `143e0a06` et `5dd6b3de`). En worktree isolée, ce problème disparaît.

Si `EnterWorktree` n'est pas disponible ou échoue, alerter l'utilisateur immédiatement et **NE PAS** continuer en mode non-isolé.

# 1. 📋 RÉSUMÉ EXÉCUTIF DE LA SESSION PRÉCÉDENTE (contexte embedded)

## Contexte initial
Production bloquée : 100 % des `POST /api/v1/bundle-workflow/initiate-payment` retournaient 500 avec `CheckViolationError: service_request with workflow_code BUNDLE_PAYMENT must have commercial_license_id` (trigger migration 291). **Aucun bundle payment n'avait jamais abouti** depuis la migration.

## Phases exécutées + commits poussés sur `origin/develop`

| # | Commit | Scope |
|---|---|---|
| P1 | `143e0a06` (absorbé par session parallèle) | Fix INSERT service_requests.commercial_license_id + fiscal_year + source + lock timeouts + i18n |
| P2 | `5dd6b3de` (absorbé) | Audit call sites `sr_repo.create()` + garde défensive |
| P3 | `50a61d7a` | Frontend `extractApiError` + catalog 18 codes × 3 langues + `BundleErrorAlert` |
| P4 | `5816cc62` | `db_error_handler` + 9 `ErrorCode` DB_* + asyncpg → métier |
| P5 | `bb4a3628` | Rate limit dual-key + audit log third-party |
| P1.1 | `a0ad80a2` | Fix `fee_type='bundle'` → `entity_obligations[0]['fee_type']` |
| B1+B2 | `37eaef5d` | FK `validated_by_agent_id` = agent_profiles.id + `target_entity_code` dynamic routing |
| X3 | `b196e01e` | `sla_respect_percentage` is GENERATED ALWAYS — stop writing to it |

**43 tests verts en local** (pytest + jest). **CI verte** à chaque push.

## Architecture bundle-payment validée en production (post-fixes)

```
CITIZEN WIZARD → POST /bundle-workflow/initiate-payment
     ↓
BundleWorkflowService.initiate_payment
     ↓ SET LOCAL lock_timeout='3s' + statement_timeout='5s'
     ↓ SELECT commercial_license FOR UPDATE NOWAIT
     ↓ Group obligations by entity (v_obligation_routing payment_validator)
     ↓   fee_type='tesoro'    → TESORO
     ↓   fee_type='municipal' → AYUNTAMIENTO
     ↓   fee_type='chamber'   → CAMARA_COMERCIO
     ↓
CREATE 1 service_request (workflow_code='BUNDLE_PAYMENT')
     ↓ (trigger fn_enforce_bundle_sr_integrity valide commercial_license_id + fiscal_year + source)
     ↓
LOOP per entity_group (N service_payments — 1 per entity touched by bundle):
     ↓ PaymentContext.metadata.target_entity_code = entity
     ↓ registry.initiate_payment → manual_processor.initiate (cash/check)
     ↓   CREATE service_payment (fee_type = obligations[0].fee_type)
     ↓   PUBLISH PAYMENT_MANUAL_PENDING (with target_entity_code in payload)
     ↓
PaymentAssignmentHandler (event listener)
     ↓ Reads target_entity_code from payload (fallback TESORO if absent — legacy non-bundle)
     ↓ Resolves entity_location for same city
     ↓ AutoAssignmentService.auto_assign_item(entity_code=<target>)
     ↓ UPDATE service_payment SET assigned_agent_id, assigned_at
     ↓
[Agent cash validation — Tesoro, Ayunt, Camara]
     ↓ POST /admin/service-requests/treasury/payments/{id}/validate
     ↓
manual_processor.validate_payment
     ↓ UPDATE service_payments SET validated_by_agent_id = agent_profile_id (FK ok)
     ↓ receipt_service.generate_and_store_receipt
     ↓ LicenseService.on_payment_completed(payment_id)
     ↓   UPDATE license_obligations SET status='paid'
     ↓   ObligationRoutingService.route_paid_obligations(obligations, license_row)
     ↓     Per obligation, resolve_target_entity:
     ↓       municipal → AYUNTAMIENTO (always)
     ↓       chamber   → CAMARA_COMERCIO (always)
     ↓       tesoro + Mode A (per_line) → entity MIN_* (via entities.ministry_id = obligation.ministry_id)
     ↓       tesoro + Mode B (consolidated) → TESORO polyvalent
     ↓     CREATE assignment 'obligation_processing' for target agent
     ↓     Email notification to assigned agent
     ↓ WorkloadRepository.update_sla_stats (bump counters only — generated column)
```

## Routing ministère ↔ entité : ne pas confondre

**Les obligations sont routées PAR ENTITÉ `MIN_*`**, mais la **clé de routage** est le `ministry_id` de l'obligation. Le code fait un pont BD :

```sql
SELECT code FROM entities
WHERE ministry_id = <license_obligations.ministry_id>
  AND code != 'TESORO'    -- exclure polyvalent pour préférer MIN_*
LIMIT 1
```

**Pourquoi 2 tables** :
- `ministries` (21 rows) : catalogue référentiel statique du gouvernement GE, **pas d'agents**
- `entities` (10 rows : TESORO + AYUNT + CAMARA + 6 MIN_* actives + MINFP inactif) : unités opérationnelles, **avec agents**
- `entities.ministry_id` (FK) : le pont pour les 6 MIN_* qui correspondent chacune à un ministère

**Cible finale de l'auto_assignment** : toujours un `entity_code` (`MIN_HACIENDA`, `MIN_AGRICULTURA`, etc.), jamais un `ministry_id` directement.

## Points sensibles BD à ne pas oublier

- `service_payments.fee_type` CHECK → `{tesoro, municipal, chamber}`. **JAMAIS** `'bundle'`.
- `service_payments.validated_by_agent_id` FK → `agent_profiles(id)`. Migration 172 en repo est **inerte** (jamais appliquée en staging) — ignorer / drop dans cette Phase 8 (item "Mig 172" du backlog).
- `agent_performance_stats.sla_respect_percentage` = **GENERATED ALWAYS** via `CASE WHEN count=0 THEN 0 ELSE (respected/total)*100 END`. Ne jamais écrire dessus.
- `service_requests` a 7 triggers actifs : `trg_sr_auto_reference`, `trg_resolve_workflow_code`, `trg_enforce_bundle_sr_integrity` (migration 291), `trg_sync_license_sr_id`, `trg_sr_updated_at`, `trg_auto_submitted_at`.
- `v_obligation_routing` = vue BD pivot avec 2 `routing_role` : `payment_validator` (collect) + `post_payment_processor` (process). Les 2 sont réellement utilisés.
- `idx_sr_commercial_license_unique` = UNIQUE partial sur `service_requests.commercial_license_id WHERE NOT NULL`. Gérer `asyncpg.UniqueViolationError` en recovery déterministe.
- Mode A (`per_line`) vs Mode B (`consolidated`) = choix **par licence** (pas global), via `commercial_licenses.processing_mode`, choisi par le citoyen dans le wizard.

# 2. 🚫 RÈGLES NON NÉGOCIABLES

## Git / Deploy
- **JAMAIS** de `gcloud builds submit` ni de `cloud build` manuel — toujours push vers `develop`, GitHub Actions gère le build
- **TOUJOURS** demander confirmation explicite avant `git push` (règle mémoire #13)
- Commits locaux par phase, push uniquement après validation globale utilisateur (règle mémoire #14)
- **OBLIGATOIRE** : worktree dès le départ (voir §0)
- Python : `C:\Program Files\Odoo 17\python\python.exe` exclusivement
- Jamais `--no-verify`, `--force`, `git reset --hard`, `git rebase -i` sans autorisation explicite
- Éviter `git add -A` ou `git add .` — stage explicitement les fichiers

## Analyse et implémentation
- **TOUJOURS** commencer par analyser le contexte, l'architecture, le processus, l'existant
- **TOUJOURS** interroger la BD directement via `psycopg2` pour vérifier champs, types, contraintes, triggers, generated columns — NE PAS se fier au schema doc
- **TOUJOURS** rédiger un rapport critique de chaque analyse
- **TOUJOURS** faire un plan d'implémentation par phase avec checklists de validation, enregistré dans `.claude/plans/`
- Valider chaque étape avec l'utilisateur avant de passer à la suivante
- Maintenir les plans à jour (cocher les checklists au fur et à mesure)
- Tests à la fin de chaque phase pour valider la checklist
- **Auto-critique** après chaque phase : relire son propre diff, identifier les bugs, les corriger avant de déclarer terminé
- **Déléguer aux sous-agents** via `Agent` tool si la tâche est complexe (recherche multi-fichiers, audit exhaustif, exploration code) — tu es l'orchestrateur
- **Auto-amélioration** : si tu identifies une règle à ajouter à la mémoire persistante, écris-la dans `memory/MEMORY.md` avant la fin de session
- **Challenger les suggestions utilisateur** — tu es l'expert technique, remets en question tout ce qui n'est pas optimal
- **Ne rien inventer**, travailler avec l'existant
- Pas de hardcode — penser **1 M+ transactions simultanées, 100+ agents connectés, OWASP Top 10**
- Pas de placeholder, pas de code mort, pas de champs fantômes
- **Implémentation complète** : toute fonctionnalité doit avoir backend + frontend + tests avant d'être déclarée terminée. Pas de demi-implémentation.
- Interfaces **intuitives**, vue sans scroll priorisée, responsive, i18n (es/fr/en) obligatoire
- LLM agents (si utilisés) doivent avoir des fonctions métier claires et des outils métier dédiés

## Tests
- Pydantic v2 strict pour tous les modèles
- Tests backend dans `packages/backend/tests/unit/` avec `pytest` + `asyncpg` + transaction rollback (pattern des tests existants)
- Tests frontend dans `packages/web/src/**/__tests__/` avec `jest` (exécuter via `node ../../node_modules/jest/bin/jest.js` depuis `packages/web/` pour contourner les chemins monorepo)
- Smoke tests avant chaque push
- Si tests manquent sur un endpoint critique, les ajouter dans le même commit que le fix

## Qualité code
- Commentaires : **POURQUOI** (hidden constraints, invariants subtils, workarounds référencés à un bug), **pas le QUOI**
- Pas de commentaires explicatifs du what — les noms explicites suffisent
- Pas de backwards-compatibility hacks
- Pas de code mort avec `// removed` — supprimer complètement
- Pas de sur-validation aux couches internes — valider aux boundaries seulement
- Parameterized queries asyncpg obligatoires (`$1`, `$2`, ... — jamais de string format SQL)

## Sécurité (OWASP Top 10)
- **A01** Broken access control : owner guard + audit logs sur les actions sensibles
- **A03** Injection : asyncpg parameterized partout, aucune concaténation SQL
- **A04** Insecure design : `SET LOCAL lock_timeout='3s'` + `statement_timeout='5s'` sur chemins critiques (pattern CLAUDE.md)
- **A05** Security misconfig : CORS + CSP + sanitize error bodies (pas de leak stack trace client)
- **A09** Logging : événements structurés, pas de leak PII dans les logs, correlation ID si possible

## Communication utilisateur
- User-facing text ≤ 100 mots sauf si la tâche exige plus
- ≤ 25 mots entre deux tool calls
- End-of-turn summary : 1-2 phrases max
- Challenger les suggestions, ne pas valider blindly

# 3. 📦 BACKLOG PRIORISÉ — Phase 8

Ordre d'attaque recommandé (challenger si tu trouves mieux, expliquer pourquoi dans un rapport critique) :

| # | Bug | Sévérité | Effort | Description |
|---|---|---|---|---|
| **X8** | 🔴 **CRITICAL** | 2-3 h | **Reçu PDF avec montants à 0**. Le PDF est généré + attaché à l'email correctement mais affiche `0 XAF` pour un paiement validé de 353 250 XAF (bundle split tesoro). **Faux document officiel = risque légal**. Template probablement lit une variable vide (`service_request.total_amount` NULL pour bundle au lieu de `service_payment.total_amount`). Voir §P8.4bis du plan. |
| **X9** | 🔴 **BLOCKER** | 1-2 h | **Redirection post-validation vers dashboard superviseur au lieu du dashboard agent**. Après avoir validé un paiement et cliqué "Continuer" sur l'écran de confirmation du reçu, l'agent (Tesoro/AYUNT/CAMARA) est redirigé vers `/supervisor/*` au lieu de `/agent/*`. Résultat : **403 sur tous les widgets** car l'agent n'a pas les permissions supervisor. Bug frontend — `onSuccess` / `router.push()` dans le composant de confirmation du reçu utilise une route hardcodée au lieu de résoudre dynamiquement selon le rôle. Voir §P8.2bis du plan. |
| **X2** | 🔴 **BLOCKER** | 2-4 h | **403 sur `POST /agent/service-requests/{id}/decision`** — quand AYUNT/CAMARA cliquent "Approuver", le endpoint check `agent_work_queue.assigned_to = current_user` mais le bundle SR est assigné uniquement à l'agent du primary_entity (Tesoro). **Fix : router le bouton frontend vers `/treasury/payments/{payment_id}/validate` (payment-level)** au lieu du endpoint SR-level. Voir §P8.2 du plan. |
| **X4** | 🔴 High | 2-3 h | Agents MIN_* voient 0 dans `/oms/queue/pending` malgré assignments BD. Root cause probable : frontend dynamic route `[entityCode]/[workflowGroup]/[action]` passe `entityCode='oms'` (faux) au hook `useEntityServiceRequests` qui fetche des service_requests au lieu d'obligations via `omsQueueApi.getQueue`. |
| **X1** | 🟡 Med+ | 2 h | **Dashboard Tesoro bundle-unaware ET desync validation page**. Dashboard montre 5 BUNDLE payments mélangeant TESORO/AYUNT/CAMARA (99k+20k+27k+50k+353k) alors que validation page (même agent, même moment) montre 0. Bug X1a : dashboard query ne filtre pas par entité. Bug X1b : dashboard inclut un paiement completed (353250 validé juste avant). Fix : unifier les 2 queries via un shared query builder. Voir §P8.3 du plan. |
| **UI1-UI9** | 🟡 Med | 3-4 h | **Page validation agent bundle-unaware** — 9 issues UX cumulées documentées dans §P8.3bis : primary_entity affiché au lieu de current, section Documents/OCR à tort, UUIDs bruts exposés user, 6 clés i18n non résolues, boutons en espagnol, dict `entity_payments` mal formaté. |
| **B6** | 🟡 Med | 3-4 h | Page citoyen `LIC-2026-00001` sans liste d'obligations + PDF vide. Créer variant Bundle du template PDF + endpoint `GET /service-requests/{id}/bundle-details`. **Probablement corrélé à X8** (même template famille). |
| **B7 niv 1** | ✅ **DONE** | 0 h | **Confirmé fonctionnel 2026-04-14** via test nouveau bundle `LIC-2026-00002` 430k XAF : validation Tesoro → receipt PDF généré (`recibo_REC-2026-000011.pdf`) → email envoyé au citoyen avec PDF attaché. Infrastructure (event + listener + templates) 100% opérationnelle. |
| **B7 niv 2** | 🟢 Low | 2-3 h | UX optimale : template `payment_bundle_split_validated` + `payment_bundle_completed` mentionnant "split X sur N du bundle [reference]" + décision produit (3 emails séparés vs 1 consolidé). |
| **X5** | 🟢 Low | 1 h | 0 agents actifs pour MIN_COMERCIO / MIN_ELECTRICIDAD / MIN_INFORMACION en staging. Tâche data : décider avec l'utilisateur si on active ou on crée de nouveaux agents. |
| **Mig 172** | 🟢 Low | 30 min | Décider : drop `172_fix_validated_by_agent_id.sql` (recommandé — code mort en repo, jamais appliqué) ou re-apply complet (DROP FK + RECREATE vers `users` + update code partout). |

**Ordre recommandé** : **X8** (critical — faux document légal) → **X9** (blocker — redirection 403 bloque workflow agent) → **X2** (blocker AYUNT/CAMARA) → **X1** (dashboard) → **UI1-UI9** (cleanup visuel) → **X4** (MIN_* queue) → **B6** (citizen dashboard) → B7 niv 2 → X5 → Mig 172

# 4. 🧪 WORKFLOW DE DÉMARRAGE — ordre strict

1. **Créer worktree** : `EnterWorktree(name="bundle-phase8")` (si pas déjà fait à l'étape 0)
2. **Lire le contexte complémentaire** (en parallèle si possible) :
   - `.claude/plans/BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md` (bilan complet)
   - `.claude/plans/BUNDLE_DEBUG_PHASE8_PLAN.md` (plan détaillé des 7 items)
   - `CLAUDE.md` (racine) — règles projet
   - `memory/MEMORY.md` — mémoire persistante
3. **Snapshot git** : `git log --oneline -10` + `git status`
4. **Snapshot BD** : lancer un probe psycopg2 inspiré de `scripts/debug_bundle_p1_db_probe.py` pour vérifier l'état actuel de la licence de test `b840aaaa-18a2-4b6f-a4fb-5c80d3a54576`
5. **Rédiger** `.claude/plans/BUNDLE_DEBUG_PHASE8_1_PLAN.md` — plan détaillé du premier item **X4** avec architecture, tâches, tests
6. **Demander validation utilisateur** avant toute modification code
7. **Implémenter** étape par étape avec auto-critique en fin de chaque étape
8. **Tests** avant commit local
9. **Commit local** — attendre autorisation user avant push
10. **Push + monitor CI** via `gh run list --branch develop --limit 5`
11. **Mettre à jour** le plan en cochant les checklists validées

# 5. 🚫 CE QUE TU NE DOIS PAS FAIRE SANS AUTORISATION

- `git push` sans confirmation explicite
- `git reset --hard`, `rebase -i`, `--force`
- `DROP` / `TRUNCATE` en BD staging
- Supprimer / renommer des fichiers existants même s'ils semblent inutiles
- Refactor au-delà du scope du ticket
- Créer des migrations SQL (préférer backfill data > schema changes quand possible)
- Modifier la configuration git (hooks, gpgsign, etc.)
- Modifier le code d'autres workflows (passeport, conducir, residencia, etc.) sous prétexte de cohérence
- Dépasser 2 h sans check-in utilisateur

# 6. 📨 PREMIER MESSAGE ATTENDU DE TOI

Après avoir créé la worktree (§0) + lu les fichiers de contexte (§4.2) + snapshots git + BD, **avant de toucher au moindre code** :

Résume en **3-5 phrases** :
1. Ce que tu as compris du contexte (1 phrase)
2. Ton plan pour la première phase X4 (2 phrases avec hypothèse + approche)
3. Les questions ouvertes qui nécessitent une décision utilisateur (1-2 phrases)

Attends la **validation user explicite** avant tout changement de code.

---

**Fichiers clés à consulter pendant la session** :
- `.claude/plans/BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md` — bilan complet (architecture BD, commits, gaps)
- `.claude/plans/BUNDLE_DEBUG_PHASE8_PLAN.md` — détail des 7 items backlog avec tâches et risques
- `scripts/debug_bundle_p1_db_probe.py` + `p2` + `p5` — templates psycopg2 prêts à l'emploi (gitignorés mais présents sur disque)
- `packages/backend/app/modules/fiscal_services/services/obligation_routing_service.py` — routing Mode A/B (Vision B complètement implémentée)
- `packages/backend/app/modules/fiscal_services/services/bundle_workflow_service.py` (méthode `initiate_payment`) — flux atomique bundle
- `packages/backend/app/modules/payments/handlers/payment_assignment_handler.py` — handler event (corrigé en commit `37eaef5d`)
- `packages/backend/app/modules/service_requests/api/admin_routes.py` (ligne ~3200) — `get_pending_payments` endpoint Treasury
- `packages/web/src/modules/oms/services/api.ts` — `omsQueueApi.getQueue` (le vrai endpoint pour les obligations)
- `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/[entityCode]/[workflowGroup]/[action]/page.tsx` — dynamic route qui gère les URLs `/dashboard/agent/oms/*`

**Fin du prompt. Commence par l'étape 0.**
