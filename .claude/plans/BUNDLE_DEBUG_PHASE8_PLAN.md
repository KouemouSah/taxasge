# PHASE 8 — BUNDLE UX ALIGNMENT + GAPS RESIDUELS

**Contexte** : suite directe de la session 2026-04-13/14 documentée dans `.claude/plans/BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md`.
**Date de rédaction** : 2026-04-14
**Statut** : 🔵 PLAN (aucun code écrit)
**Temps estimé** : 6-10 h selon scope validé
**Branche de travail** : **`worktree-bundle-phase8` obligatoire** (voir règle R-P8-1 — éviter absorption par sessions parallèles)

---

## ⚠️ À LIRE AVANT DE COMMENCER — Prompt d'initialisation pour la nouvelle session

Le bloc ci-dessous est un prompt complet, **auto-portant**, que l'utilisateur peut copier-coller directement dans une nouvelle session Claude Code. Il contient :
1. Le résumé exécutif embedded (pas juste une référence)
2. Toutes les règles de travail non négociables
3. La commande explicite de créer une worktree avant tout changement
4. Le backlog priorisé
5. Les points sensibles à ne pas oublier
6. La clarification architecture routing (ministère ↔ entité MIN_*)

---

````prompt
# 🎯 REPRISE SESSION — Bundle Workflow TaxasGE Phase 8

Je reprends le travail bundle-workflow TaxasGE. La session précédente (2026-04-13/14) a poussé 7 commits sur `origin/develop` pour corriger une série de bugs layered. Le backend fonctionne. Il reste des gaps UX frontend + 2 tâches data.

# 0. ⚠️ AVANT TOUT CODE — CRÉER UNE WORKTREE

**Première action obligatoire** (règle anti-conflits inter-sessions) :
```
EnterWorktree(name="bundle-phase8")
```
Raison : des sessions Claude parallèles actives sur le même repo ont absorbé 2× mon working tree via `git add -A` pendant la session précédente (commits `143e0a06` et `5dd6b3de`). En worktree isolée, ce problème disparaît.

Si `EnterWorktree` échoue, alerter l'utilisateur immédiatement et NE PAS continuer en mode non-isolé.

# 1. 📋 RÉSUMÉ EXÉCUTIF DE LA SESSION PRÉCÉDENTE (embedded)

## Contexte initial
Production bloquée : 100 % des `POST /api/v1/bundle-workflow/initiate-payment` retournaient 500 avec `CheckViolationError: service_request with workflow_code BUNDLE_PAYMENT must have commercial_license_id` (trigger migration 291). **Aucun bundle payment n'avait jamais abouti** depuis la migration.

## Phases exécutées + commits poussés sur `origin/develop`

| # | Commit | Scope |
|---|---|---|
| P1 | `143e0a06` (absorbé) | Fix INSERT service_requests.commercial_license_id + fiscal_year + source + lock timeouts + i18n |
| P2 | `5dd6b3de` (absorbé) | Audit call sites `sr_repo.create()` + garde défensive |
| P3 | `50a61d7a` | Frontend `extractApiError` + catalog 18 codes × 3 langues + `BundleErrorAlert` |
| P4 | `5816cc62` | `db_error_handler` + 9 `ErrorCode` DB_* + asyncpg → métier |
| P5 | `bb4a3628` | Rate limit dual-key + audit log third-party |
| P1.1 | `a0ad80a2` | Fix `fee_type='bundle'` → `entity_obligations[0]['fee_type']` |
| B1+B2 | `37eaef5d` | FK `validated_by_agent_id` = agent_profiles.id + `target_entity_code` dynamic routing |
| X3 | `b196e01e` | `sla_respect_percentage` is GENERATED ALWAYS — stop writing to it |

**43 tests verts en local** (pytest + jest). **CI verte** à chaque push.

## Architecture bundle-payment validée en production

### Flux complet (chaîne fonctionnelle après tous les fixes)

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
     ↓
LOOP per entity_group:
     ↓ PaymentContext.metadata.target_entity_code = entity
     ↓ registry.initiate_payment → manual_processor.initiate
     ↓   CREATE service_payment (fee_type = obligations[0].fee_type)
     ↓   PUBLISH PAYMENT_MANUAL_PENDING (with target_entity_code)
     ↓
PaymentAssignmentHandler (event handler)
     ↓ Reads target_entity_code from payload (fallback TESORO)
     ↓ AutoAssignmentService.auto_assign_item(entity_code=<target>)
     ↓ UPDATE service_payment SET assigned_agent_id
     ↓
[Agent cash validation]
     ↓ POST /admin/service-requests/treasury/payments/{id}/validate
     ↓
manual_processor.validate_payment
     ↓ UPDATE service_payments SET validated_by_agent_id = agent_profile_id (FK ok)
     ↓ LicenseService.on_payment_completed
     ↓   UPDATE license_obligations SET status='paid'
     ↓   ObligationRoutingService.route_paid_obligations
     ↓     Per obligation, resolve_target_entity:
     ↓       municipal → AYUNTAMIENTO (always)
     ↓       chamber → CAMARA_COMERCIO (always)
     ↓       tesoro + Mode A → entity MIN_* (via entities.ministry_id = obligation.ministry_id)
     ↓       tesoro + Mode B → TESORO polyvalent
     ↓     Create assignment 'obligation_processing' for target agent
     ↓     Email notification to assigned agent
     ↓ WorkloadRepository.update_sla_stats (bump counters only, not generated column)
```

### Routing ministère ↔ entité : la confusion à éviter

**Les obligations sont routées PAR ENTITÉ MIN_\***, pas directement par ministère. La clé est le `ministry_id` de l'obligation, mais la **cible** de l'auto-assignment est un `entity_code` (MIN_HACIENDA, MIN_AGRICULTURA, etc.).

Le code fait le pont via :
```sql
SELECT code FROM entities
WHERE ministry_id = <license_obligations.ministry_id>
  AND code != 'TESORO'    -- exclure polyvalent pour préférer MIN_*
LIMIT 1
```

**Pourquoi 2 tables** :
- `ministries` : catalogue des 21 ministères du gouvernement GE (référentiel statique, pas d'agents)
- `entities` : unités opérationnelles avec agents (TESORO + AYUNTAMIENTO + CAMARA_COMERCIO + 6 MIN_* actifs + MINFP inactif)
- `entities.ministry_id` : **FK** qui fait le pont pour les 6 MIN_* entités (chacune correspond à un ministère)

**Résultat** : un fix qui touche au routing doit vérifier que ces 2 tables sont bien alignées. En staging : 6 entités MIN_* actives avec ministry_id correct, mais MIN_COMERCIO + MIN_ELECTRICIDAD + MIN_INFORMACION ont **0 agents `is_active=true`** → pas d'assignment possible (tâche X5 du backlog).

## Points sensibles BD à ne pas oublier

- `service_payments.fee_type` CHECK → `{tesoro, municipal, chamber}`. **JAMAIS** `'bundle'`.
- `service_payments.validated_by_agent_id` FK → `agent_profiles(id)`. **Migration 172** en repo est **inerte** (jamais appliquée en staging) — ignorer.
- `agent_performance_stats.sla_respect_percentage` = **GENERATED ALWAYS** via `CASE WHEN count=0 THEN 0 ELSE (respected/total)*100 END`. Ne jamais écrire dessus.
- `service_requests` a 7 triggers : `trg_sr_auto_reference`, `trg_resolve_workflow_code`, `trg_enforce_bundle_sr_integrity` (migration 291), `trg_sync_license_sr_id`, `trg_sr_updated_at`, `trg_auto_submitted_at`.
- `v_obligation_routing` = vue BD pivot. 2 `routing_role` : `payment_validator` (collect) + `post_payment_processor` (process). Les 2 sont réellement utilisés.
- `idx_sr_commercial_license_unique` = UNIQUE partial sur `service_requests.commercial_license_id WHERE NOT NULL`. Gérer `asyncpg.UniqueViolationError` en recovery.
- Mode A (`per_line`) vs Mode B (`consolidated`) = choix **par licence** (pas global), via `commercial_licenses.processing_mode`.

# 2. 🚫 RÈGLES NON NÉGOCIABLES (héritées des sessions précédentes)

## Git / Deploy
- **JAMAIS** de `gcloud builds submit` ni de `cloud build` manuel — toujours push vers `develop`, laisser GitHub Actions gérer le build
- **TOUJOURS** demander confirmation explicite avant `git push` (règle mémoire #13)
- Commits locaux par phase, push uniquement après validation globale utilisateur (règle mémoire #14)
- **OBLIGATOIRE** : travailler en `worktree` dès le départ (voir §0)
- Python : utiliser `C:\Program Files\Odoo 17\python\python.exe` exclusivement
- Jamais `--no-verify`, `--force`, `git reset --hard`, `rebase -i` sans autorisation explicite

## Analyse et implémentation
- **TOUJOURS** commencer par analyser le contexte, l'architecture, le processus, l'existant
- **TOUJOURS** interroger la BD directement (`psycopg2`) pour vérifier champs, types, contraintes, triggers, generated columns — NE PAS se fier au schema doc
- **TOUJOURS** rédiger un rapport critique de chaque analyse
- **TOUJOURS** faire un plan d'implémentation par phase avec checklists de validation, enregistré dans `.claude/plans/`
- Valider chaque étape avec l'utilisateur avant de passer à la suivante
- Maintenir les plans à jour (cocher les checklists au fur et à mesure)
- Tests à la fin de chaque phase pour valider la checklist
- **Auto-critique** après chaque phase : relire son propre diff, identifier les bugs, les corriger avant de déclarer terminé
- **Déléguer aux sous-agents** via `Agent` tool si la tâche est trop complexe (recherche multi-fichiers, audit, orchestration). Tu es l'orchestrateur
- **Auto-amélioration** : si tu identifies une règle à ajouter à ta mémoire, écris-la dans `memory/MEMORY.md` avant la fin de session
- **Challenger les suggestions utilisateur** — tu es l'expert technique, remets en question tout ce qui n'est pas optimal
- **Ne rien inventer**, travailler avec l'existant
- Pas de hardcode — penser **1 M+ transactions simultanées, 100+ agents connectés, OWASP Top 10**
- Pas de placeholder, pas de code mort, pas de champs fantômes
- **Implémentation complète** : toute fonctionnalité doit avoir backend + frontend + tests avant d'être déclarée terminée. Pas de demi-implémentation.
- Interfaces **intuitives**, vue sans scroll priorisée, responsive, i18n (es/fr/en) obligatoire
- LLM agents (si utilisés) doivent avoir des fonctions métier claires et des outils métier dédiés

## Tests
- Pydantic v2 strict pour tous les modèles
- Tests backend dans `packages/backend/tests/unit/` avec `pytest` + `asyncpg` + transaction rollback
- Tests frontend dans `packages/web/src/**/__tests__/` avec `jest` (exécuter via `node ../../node_modules/jest/bin/jest.js` depuis `packages/web/`)
- Smoke tests avant chaque push
- Si tests manquent sur un endpoint critique, les ajouter dans le même commit

## Qualité code
- Commentaires : POURQUOI (hidden constraints, invariants, workarounds référencés), pas le QUOI
- Pas de backwards-compatibility hacks
- Pas de code mort laissé en place avec `// removed` — supprimer complètement
- Pas de sur-validation aux couches internes — valider aux boundaries seulement
- Parameterized queries asyncpg obligatoires (pas de string format SQL)

## Sécurité (OWASP)
- **A01** Broken access control : owner guard + audit logs
- **A03** Injection : asyncpg parameterized partout
- **A04** Insecure design : lock_timeouts + statement_timeouts sur chemins critiques
- **A05** Security misconfig : CORS + CSP + sanitize errors
- **A09** Logging : log structured events, pas de leak stack trace client

## Communication utilisateur
- User-facing text ≤ 100 mots sauf si tâche exige plus
- ≤ 25 mots entre deux tool calls
- End-of-turn summary : 1-2 phrases
- Challenger, pas valider blindly

# 3. 📦 BACKLOG PRIORISÉ — Phase 8

Ordre d'attaque recommandé (challenger si tu trouves mieux, expliquer pourquoi) :

| # | Bug | Sévérité | Effort | Description |
|---|---|---|---|---|
| **X4** | 🔴 High | 2-3 h | Agents MIN_* voient 0 dans `/oms/queue/pending` malgré assignments BD. Root cause probable : frontend dynamic route `[entityCode]/[workflowGroup]/[action]` passe `entityCode='oms'` (faux) au hook `useEntityServiceRequests` qui fetche des service_requests au lieu d'obligations via `omsQueueApi.getQueue`. |
| **X2** | 🔴 High | 2-3 h | Agents AYUNT/CAMARA voient 0 dans `/oms/validation/pending` malgré paiements assignés. Root cause similaire à X4 — menu nav → dynamic route générique au lieu d'un composant qui appelle `/treasury/payments/pending`. |
| **X1** | 🟡 Med | 1 h | Tesoro dashboard compte 3 mais validation page 1 — aligner les filtres (même WHERE clause). |
| **B6** | 🟡 Med | 3-4 h | Page citoyen `LIC-2026-00001` sans liste d'obligations + PDF vide. Créer variant Bundle du template PDF + endpoint `GET /service-requests/{id}/bundle-details`. |
| **B7** | 🟡 Med | 3-4 h | Parity avec workflows non-bundle : reçu PDF + email + notification post-paiement. Listener sur `PAYMENT_VALIDATED` ou dans `ObligationRoutingService.route_paid_obligations`. |
| **X5** | 🟢 Low | 1 h | 0 agents actifs pour MIN_COMERCIO/ELECTRICIDAD/INFORMACION en staging. Tâche data : update ou create agents. |
| **Mig 172** | 🟢 Low | 30 min | Décider : drop `172_fix_validated_by_agent_id.sql` (recommandé) ou re-apply complet. |

# 4. 🧪 WORKFLOW DE DÉMARRAGE

1. **Créer worktree** : `EnterWorktree(name="bundle-phase8")`
2. **Lire ce prompt** + `BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md` + `BUNDLE_DEBUG_PHASE8_PLAN.md` + `CLAUDE.md` + `memory/MEMORY.md`
3. **Snapshot git** : `git log --oneline -10` + `git status`
4. **Snapshot BD** : lancer un probe psycopg2 (template dans `scripts/debug_bundle_p1_db_probe.py`) pour vérifier l'état actuel de la licence test `b840aaaa-18a2-4b6f-a4fb-5c80d3a54576`
5. **Rédiger** `BUNDLE_DEBUG_PHASE8_1_PLAN.md` — plan détaillé du premier item (X4) avec architecture, tâches, tests
6. **Demander validation** utilisateur avant toute modification code
7. **Implémenter** étape par étape avec auto-critique en fin de chaque étape
8. **Tests** avant commit local
9. **Commit local** — attendre autorisation user avant push
10. **Push + monitor CI** — cycle de validation complet

# 5. 🚫 CE QUE TU NE DOIS PAS FAIRE SANS AUTORISATION

- `git push` sans confirmation
- `git reset --hard`, `rebase -i`, `--force`
- `DROP` / `TRUNCATE` en BD staging
- Supprimer / renommer fichiers existants même s'ils semblent inutiles
- Refactor au-delà du scope du ticket
- Créer des migrations SQL (préférer backfill data > schema changes quand possible)
- Modifier la configuration git (hooks, gpgsign, etc.)
- Modifier le code d'autres workflows (passeport, conducir, etc.) sous prétexte de cohérence

# 6. 📨 PREMIER MESSAGE ATTENDU DE TOI

Après avoir lu tous les fichiers de contexte et créé la worktree, résume en **3-5 phrases** :
- Ce que tu as compris du contexte (1 phrase)
- Ton plan pour la première phase X4 (2 phrases)
- Les questions ouvertes qui nécessitent une décision utilisateur (1-2 phrases)

Attends la validation user **avant tout changement de code**.

---

**Fichiers clés à consulter** :
- `.claude/plans/BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md` — bilan complet (architecture, BD, commits, gaps)
- `.claude/plans/BUNDLE_DEBUG_PHASE8_PLAN.md` — détail des 7 items backlog avec tâches
- `scripts/debug_bundle_p1_db_probe.py` + `p2` + `p5` — templates psycopg2 prêts à l'emploi
- `packages/backend/app/modules/fiscal_services/services/obligation_routing_service.py` — routing Mode A/B (Vision B implémentée)
- `packages/backend/app/modules/fiscal_services/services/bundle_workflow_service.py:initiate_payment` — flux atomique
- `packages/backend/app/modules/payments/handlers/payment_assignment_handler.py` — handler event (corrigé en B2)
- `packages/web/src/modules/oms/services/api.ts` — `omsQueueApi.getQueue` (le vrai endpoint pour les obligations)
````

---

## 1. Contexte

À la fin de la session 2026-04-14, le chemin bundle-payment fonctionne correctement côté **backend** (validation cash, routing post-paiement Mode A/B, assignments, emails) mais plusieurs **gaps UX** restent ouverts côté **frontend** et **données staging**. Les bugs résolus sont listés dans `BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md` §4.

Cette phase a pour objectif de **fermer les gaps UX** pour que l'expérience agent (MIN_*, AYUNTAMIENTO, CAMARA_COMERCIO) soit cohérente avec l'expérience Tesoro déjà fonctionnelle, et que le citoyen ait une visibilité complète sur son bundle.

## 2. Scope et non-scope

### 2.1 IN scope
- X4 : frontend queue OMS pour agents MIN_*
- X2 : frontend validation pour AYUNT/CAMARA (équivalent Tesoro)
- X1 : alignement dashboard Tesoro vs validation page
- B6 : page citoyen LIC-xxxx enrichie avec obligations + PDF
- B7 : event listener post-paiement → notification + reçu citoyen
- X5 : seeding staging agents MIN_COMERCIO/ELECTRICIDAD/INFORMACION
- Décision sur la dette migration 172

### 2.2 OUT of scope (à reporter)
- Refactor global du menu config (workflow_menu_mapping vs roles.menu_config — voir §4 gap P1.1)
- Tests de charge 1 M+ users (pas d'infra de test)
- Auto-renewal licences (Point 4 du backlog original 9 points)
- BANGE webhook reconciliation (Point 7 backlog)
- WebSocket dashboards (Point 9 backlog)

## 3. Backlog priorisé

### P8.1 — X4 : frontend queue OMS pour agents MIN_*

**Symptôme** : MIN_AGRICULTURA agent (agrimalabo@outlook.fr) se connecte, navigue vers "Obligations → En Cours" (URL observée : `/dashboard/agent/oms/queue/pending`). La page affiche "Dossiers en Attente / 0 dossiers à traiter" alors que la BD contient 1 assignment actif pour cet agent (obligation `e019e541`, fee_type=tesoro, ministry_id=104 agriculture).

**Evidence BD** (vérifiée en session précédente) :
```
Assignment: 817b2d54 → agent_profile acfc32e6 (agrimalabo)
  item_id=e019e541, item_type='obligation_processing', status='assigned'
Obligation: e019e541 status='processing', ministry_id=104
License: b840aaaa processing_mode='per_line'
Query simulée (repo.get_agent_queue) retourne 1 row
```

**Hypothèses à vérifier** (par ordre de probabilité) :
1. **Frontend** : le menu "Obligations → En Cours" génère une URL `/dashboard/agent/oms/queue/pending` qui tombe sur le dynamic route `[entityCode]/[workflowGroup]/[action]/page.tsx` avec `entityCode='oms'`, `workflowGroup='queue'`, `action='pending'`. Ce composant utilise `useEntityServiceRequests` qui fetche des **service_requests**, pas des obligations → retourne 0 pour un entity fantôme "oms".
2. **Backend** : le endpoint `/oms/queue` existe (`omsQueueApi.getQueue` côté frontend, `oms_agent_service.get_queue` backend), mais le menu ne pointe pas vers lui.
3. **Middleware** : il y a un rewrite Next.js quelque part qui maps `/dashboard/agent/oms/queue/pending` vers une autre page.

**Tâches** :
- [ ] Localiser le composant qui génère le menu "Obligations → En Cours" (probablement dans un layout sidebar ou un composant `AgentNavigation`)
- [ ] Identifier si c'est hardcodé ou généré par `MenuConfigService._generate_workflow_menus` / `_create_menu_from_mapping`
- [ ] Vérifier que les URL générées pointent vers un composant qui appelle `omsQueueApi.getQueue()`
- [ ] Créer / corriger le composant de page pour que MIN_* agents voient leurs obligations via `oms/queue` endpoint
- [ ] Ajouter un test E2E Playwright agent MIN_AGRICULTURA login → vérifie 1 obligation visible

**Effort estimé** : 2-3 h

---

### P8.2 — X2 : frontend validation pour AYUNT/CAMARA agents

**Symptôme** : AYUNT (`ayumalabo1@gmail.com`) et CAMARA (`camaramalabo1@gmail.com`) agents se connectent, voient "Paiements → Validation en attente" dans leur sidebar. Après backfill des assigned_agent_id (session précédente), ils voient maintenant **1 dossier** dans la liste — mais click "Approuver" → **403 Forbidden systématique**.

**Root cause confirmée** (session 2026-04-14 late) :
Le bouton "Approuver" frontend appelle `POST /api/v1/agent/service-requests/{sr_id}/decision` qui est un endpoint **SR-level**. Le handler (`agent_routes.py:1100-1137`) check :
```sql
SELECT id FROM agent_work_queue
WHERE item_id = <sr_id> AND item_type = 'service_request'
  AND assigned_to = <current_user.id> AND status = 'assigned'
```
Pour un bundle, le `service_request` a `entity_code = 'TESORO'` (primary_entity du split) et est assigné UNIQUEMENT à l'agent Tesoro via `agent_work_queue`. Les agents AYUNT/CAMARA **ne sont pas** dans `agent_work_queue` pour ce SR → lookup vide → `raise HTTPException(403, "This request is not assigned to you")`.

**La bonne architecture** : le bouton "Approuver" sur la page AYUNT/CAMARA devrait appeler `POST /api/v1/admin/service-requests/treasury/payments/{payment_id}/validate` (validation **payment-level**), pas le endpoint SR-level. C'est exactement ce que Tesoro utilise.

**Tâches** :
- [ ] Identifier le composant frontend qui génère le bouton "Approuver" sur la page validation OMS
- [ ] Remplacer l'appel `/agent/service-requests/{id}/decision` par `/treasury/payments/{payment_id}/validate`
- [ ] Le payment_id doit venir du service_payment visible à l'écran (un agent AYUNT voit SON service_payment, pas le SR global)
- [ ] Alternativement : modifier `make_decision` backend pour accepter un bundle SR si le current_user a un service_payment assigné pour ce SR (plus complexe, moins propre)
- [ ] Renommer conceptuellement `/treasury/payments/*` → `/validator/payments/*` pour refléter qu'il est multi-entité (cosmétique, optionnel)
- [ ] Test E2E : AYUNT agent → 1 paiement visible → click Valider → paiement `completed` + SR reste en `PAYMENT_PROCESSING` jusqu'à ce que TOUS les 3 splits soient validés → event PAYMENT_CASH_VALIDATED → email citoyen

**Effort estimé** : 2-4 h (selon fix retenu)

---

### P8.2bis — X9 : **BLOCKER** Redirection post-validation vers dashboard superviseur (403 widgets)

**Symptôme** (session 2026-04-14 late, test bundle `LIC-2026-00002`) :
Après que l'agent Tesoro valide un paiement et arrive sur l'écran de confirmation du reçu (`RECIBO DE PAGO GENERADO` / `recibo_REC-2026-000011.pdf`), il clique sur le bouton **"Continuer"**. Le router frontend le redirige vers `/supervisor/dashboard` (ou équivalent) au lieu de `/agent/dashboard` (ou `/treasury/dashboard` selon la convention).

Conséquence : comme le user est authentifié en tant qu'**agent** (role `agent_tesoro`/`agent_ayuntamiento`/etc., pas `supervisor`), **tous les widgets du dashboard superviseur retournent 403** (dashboard-stats, workload, oms-overview, etc.). L'agent est coincé sur une page inexploitable et doit manuellement re-naviguer vers son propre dashboard.

**Impact** : BLOCKER workflow — casse la boucle "valider → revenir à la liste pour valider le suivant". En production avec 100+ agents validant plusieurs dizaines de paiements/jour, c'est une perte de productivité massive et un UX cassé.

**Root cause hypothèse** (à confirmer) :
- Le composant de confirmation du reçu (`PaymentReceiptConfirmation` / `TreasuryPaymentResult` / nom à identifier) a une redirection hardcodée `router.push('/supervisor/dashboard')` ou équivalent, probablement **copié-collé** d'un flow supervisor dev précédent sans adaptation au contexte agent
- OU bien le composant utilise un helper `getDashboardRoute()` qui résout mal le rôle (fallback supervisor au lieu d'agent)
- OU le bouton "Continuer" utilise `router.back()` ET l'historique est pollué par une navigation supervisor précédente (improbable mais à vérifier)

**Tâches** :
- [ ] Grep frontend `packages/web/src` pour les composants de confirmation post-validation reçu :
  - `PaymentReceiptConfirmation`, `ReceiptGeneratedScreen`, `PaymentValidationSuccess`, etc.
  - Patterns : `router.push('/supervisor`, `href="/supervisor/dashboard"`, `navigate('/supervisor`
- [ ] Identifier le bouton "Continuer" exact (label i18n `common.continue` / `actions.continue` / FR "Continuer")
- [ ] Vérifier la logique de résolution de la route de retour :
  - Doit dépendre du rôle de l'user courant (`useAuth().user.role`)
  - Mapping attendu : `agent_tesoro` → `/treasury/dashboard`, `agent_ayuntamiento` → `/ayuntamiento/dashboard`, etc. OU un `/agent/dashboard` générique avec menu contextuel
  - **Vérifier si un `getRoleHomeRoute(role)` helper existe déjà** (le router role-based de Facil en a probablement un) — sinon, le créer
- [ ] Créer / réutiliser `getAgentHomeRoute(role)` helper centralisé (pas de hardcode par composant)
- [ ] Fix le composant pour appeler `router.push(getAgentHomeRoute(user.role))`
- [ ] Test E2E :
  - Login agent Tesoro → valider paiement bundle → écran reçu → click "Continuer" → **doit arriver sur `/treasury/dashboard`** (pas supervisor) → widgets chargent 200 OK
  - Répéter pour agent AYUNT, CAMARA, MIN_* (si workflow X2 est fixé)
  - Vérifier qu'aucune requête `/api/v1/supervisor/*` n'est déclenchée par des widgets supervisor chargés par erreur (Network tab)

**Risques** :
- Si le helper `getRoleHomeRoute` existe mais est buggé (ex : case insensibilité, enum role mismatch), le fix doit aller dans le helper, pas dans le composant — sinon on crée plusieurs points de vérité
- Si plusieurs composants ont le même hardcode copié, il faut tous les migrer dans le même PR (grep exhaustif obligatoire)

**Effort estimé** : 1-2 h (1h identification + fix, 30min-1h test E2E cross-roles)

---

### P8.3 — X1 refiné : Dashboard Tesoro bundle-unaware + desync validation page

**Symptômes cumulés** (screenshots `p0.png`, `p.png`, `p6.png`, `p5.png`) :
1. **Dashboard Tesoro** affiche "Paiements en Attente : 5" et liste 5 BUNDLE payments : 99k (AYUNT), 20k (CAMARA), 27k (new bundle, entity à identifier), 50k (new bundle), 353 250 (new bundle tesoro just validated)
2. **Page validation Tesoro** (`/treasury/validation?status=pending_agent_review`) affiche "0 Paiements en Attente de Validation" pour le **même agent** Tesoro au **même moment**
3. Le 353 250 vient d'être validé → devrait être en `completed`, absent de pending → correct côté validation page, **mais il reste en dashboard**

**2 bugs distincts** :

**Bug X1a — Dashboard query ne filtre pas par entité** :
- La query dashboard montre tous les bundle payments pending régardless of entity_code ou assigned_agent_id
- Un agent Tesoro voit 99k (AYUNT) et 20k (CAMARA) alors que ces paiements ne le concernent pas
- Fix : ajouter `WHERE sp.entity_code = 'TESORO' OR sp.assigned_agent_id = <current_agent_profile_id>`

**Bug X1b — Dashboard / validation page queries desync** :
- Dashboard : montre 5 (inclut le 353250 qu'on vient de valider)
- Validation page : montre 0
- Le dashboard lit soit depuis un cache stale, soit depuis une query qui inclut les `completed` récents, soit depuis un agrégat différent
- Fix : utiliser la **même WHERE clause** que `get_pending_payments` (ligne 3200+ de admin_routes.py)

**Tâches** :
- [ ] Localiser la query dashboard (probablement dans `admin_routes.py` agent_dashboard ou un service stats)
- [ ] Comparer avec la query `get_pending_payments` (qui fonctionne correctement avec le filtre `assigned_agent_id`)
- [ ] Unifier les 2 queries via un service partagé `PaymentValidationQueryBuilder` pour éviter drift futur
- [ ] Ajouter un test qui appelle les 2 endpoints (dashboard et validation page) et compare le count pour un même agent
- [ ] Si cache Redis utilisé, invalider après validation

**Effort estimé** : 2 h

---

### P8.3bis — UI agent validation page : cleanup bundle-aware

Issues observées en test staging (screenshots `debug/a1.png`, `debug/a2.png`) sur la page `/dashboard/agent/oms/validation/pending` côté AYUNT :

| # | Bug | Correction |
|---|---|---|
| UI1 | Header affiche "Tesoro TGE" (primary_entity du SR) pour un paiement AYUNT → confusion agent | Afficher l'entity du service_payment courant, pas du SR |
| UI2 | "Données de la demande : Documents en attente de traitement OCR" alors que la company est déjà extraite et sauvegardée | Condition : si workflow_code='BUNDLE_PAYMENT' → afficher le nom de la company + NIF depuis `companies` table, pas le statut OCR |
| UI3 | Section "Documents 0 / Sans documents" inutile pour bundle | Conditional hide si workflow_code='BUNDLE_PAYMENT' |
| UI4 | Section "Aucun rendez-vous programmé / Programmer un RDV" inutile pour bundle | Conditional hide idem |
| UI5 | Filtre `agent.pending.filters.allAgents` — i18n key non résolue | Ajouter les clés i18n manquantes dans `packages/web/messages/{es,fr,en}.json` |
| UI6 | `agent.requestDetail.fieldLabels.company_id` / `license_id` / `obligation_ids` / `entity_payments` / `processing_mode` — i18n keys non résolues | Ajouter les clés i18n OU mieux : custom formatters qui transforment ces UUIDs en labels métier |
| UI7 | 🔴 **UUIDs bruts exposés à l'user** : `e4a9368c-3131-4b97-...` etc. | Formatters : `company_id` → nom entreprise, `license_id` → reference LIC-xxx, `obligation_ids` → "9 obligations sélectionnées" |
| UI8 | Boutons en espagnol dans UI française ("Aprobar", "Rechazar", "Escalar", "Solicitar Doc.", "Nota") | Vérifier que `next-intl` translate bien ces labels |
| UI9 | `entity_payments: -` (dict affiché vide) | Custom formatter qui rend `{TESORO: 3, AYUNTAMIENTO: 2, CAMARA: 4}` en chips colorés |

**Tâches** :
- [ ] Localiser le composant `/dashboard/agent/oms/validation/pending` (probablement via le dynamic route `[entityCode]/[workflowGroup]/[action]/page.tsx`)
- [ ] Ajouter la logique conditional bundle-aware pour masquer/afficher les sections
- [ ] Créer les formatters dans `packages/web/src/modules/bundle-workflow/components/formatters.ts`
- [ ] Ajouter les clés i18n manquantes dans `messages/{es,fr,en}.json`
- [ ] Test visuel côté 3 agents (Tesoro/Ayunt/Camara) + MIN_* pour cohérence

**Effort estimé** : 3-4 h

---

### P8.4bis — X8 : **CRITIQUE** Reçu PDF avec montants à 0

**Symptôme** : le receipt PDF `recibo_REC-2026-000011.pdf` est généré et attaché à l'email au citoyen correctement. Le template HTML se rend. **Mais tous les montants affichés sont 0** alors que le paiement validé était 353 250 XAF (split tesoro d'un bundle à 430.250 XAF).

**Evidence** : screenshot user — reçu reçu par libressay@gmail.com après validation tesoro du 2026-04-14 ~16:49.

**Hypothèses de root cause** (à vérifier Phase 8) :
1. **Template variable non résolue** : le template HTML utilise probablement `{{payment.amount}}` ou `{{service_request.total_amount}}`. Pour un bundle, le total du SR n'est peut-être pas set (reste `NULL`) alors que c'est le split service_payment qui contient le montant réel.
2. **receipt_service.generate_and_store_receipt** : regarde `payment_data.get("total_amount")` ou `payment_data["amount"]` — peut-être conversion `None → 0` silencieuse via un `or 0` dans le template.
3. **Colonne service_payments.base_amount** : le template peut utiliser `base_amount` qui est `NULL` pour bundle au lieu de `total_amount` qui est correct.
4. **Calculation_details JSONB** : le template peut lire depuis ce dict et la structure bundle est différente (liste d'obligations par entité) vs non-bundle (simple tarif_breakdown).

**Criticité** : 🔴 **très haute** — un reçu officiel de 0 XAF pour un paiement de 353 250 XAF est :
- **Faux document** : problème légal (le citoyen a un reçu qui ne reflète pas la réalité)
- **Perte de confiance** : impact réputation
- **Bloquant** : on ne peut pas considérer la chaîne validation-reçu comme terminée tant que le reçu n'est pas correct

**Tâches** :
- [ ] Télécharger le PDF incriminé (fourni dans `debug/recibo_REC-2026-000011.pdf`) et l'ouvrir pour voir EXACTEMENT quelles valeurs sont à 0
- [ ] Lire `app/modules/payments/services/receipt_service.py` pour comprendre la signature et le flux
- [ ] Identifier le template HTML utilisé (probablement `packages/backend/app/modules/payments/templates/receipt_*.html` ou `app/modules/service_requests/templates/`)
- [ ] Vérifier en BD que le service_payment a bien `total_amount=353250` (confirmer via psycopg2)
- [ ] Tracer quelle variable le template lit et comparer au dict passé
- [ ] Fix : aligner le template ou la transformation `payment_data` pour bundle
- [ ] Test : valider un nouveau bundle et vérifier que le PDF a les vrais montants
- [ ] Si le fix est aussi requis pour le rendu de la LIST D'OBLIGATIONS dans le reçu, c'est corrélé à B6 — peut-être merger les 2 items

**Effort estimé** : 2-3 h (dépend de la complexité template)

---

### P8.4 — B6 : page citoyen LIC-xxxx enrichie

**Symptôme** : la page `/dashboard/service-requests/{sr_id}` pour un bundle (LIC-2026-00001) affiche juste :
- Numero de demande, type, dates, statut
- Un PDF téléchargeable mais **vide de contenu obligations**

Le citoyen ne voit PAS :
- La liste des obligations qu'il a sélectionnées et payées
- Le montant par obligation
- L'agent/entité qui traite chaque obligation
- Le statut de chaque paiement (pending/validated)

**Attendu** (exemple user `debug/license.pdf`) : le PDF citoyen d'un bundle doit contenir :
- Info entreprise (nom, NIF, RC)
- Liste détaillée des obligations choisies avec montants
- Répartition par entité (TESORO/AYUNT/CAMARA)
- Références de paiement
- QR code ou numéro de validation

**Tâches** :
- [ ] Localiser le composant frontend `ServiceRequestDetailPage` ou similaire
- [ ] Identifier le template PDF actuel (`SummaryPDFService` dans `app/modules/service_requests/services/`)
- [ ] Créer une variant **Bundle** du template PDF qui joint `license_obligations` via `payment_id`
- [ ] Côté frontend, enrichir la page Aperçu avec un tableau des obligations (récupéré via API)
- [ ] Créer un endpoint API `GET /service-requests/{id}/bundle-details` qui retourne les obligations + leurs statuts

**Effort estimé** : 3-4 h

---

### P8.5 — B7 : notifications/reçu/summary parity avec workflows non-bundle

**Investigation effectuée 2026-04-14** — Infrastructure déjà en place :
- `PAYMENT_CASH_VALIDATED` event publié dans `admin_routes.py:3882-3956` avec reçu PDF attaché
- `notification_handler.EVENT_NOTIFICATION_MAP[PAYMENT_CASH_VALIDATED]` → email + SMS + push (priorité high)
- `email_templates.payment_cash_validated` et `sms_templates.PAYMENT_CASH_VALIDATED` : actifs en BD
- `push_templates.payment_cash_validated` : absent (non bloquant, skip gracieux)

**Pourquoi rien ne partait avant** : le bug X3 (`GeneratedAlwaysError` ligne 3802 dans `update_sla_stats`) faisait crasher le handler avant le publish (ligne 3882). **Le fix X3 commit `b196e01e` débloque automatiquement B7 niveau 1**.

### B7 niveau 1 — ✅ CONFIRMÉ FONCTIONNEL (2026-04-14)

**Test réussi de bout en bout** avec un nouveau bundle `LIC-2026-00002` (430.250 XAF, 5 obligations, Mode A) :
1. Wizard citoyen terminé → confirmation OK
2. Agent Tesoro clique "Valider le Paiement" sur son split
3. Validation réussit (post fix X3)
4. Event `PAYMENT_CASH_VALIDATED` publié
5. `notification_handler` reçoit l'event
6. Receipt PDF généré (`recibo_REC-2026-000011.pdf`)
7. Email envoyé au citoyen avec PDF attaché ✅

**Infrastructure totalement fonctionnelle**. À ne plus toucher.

**⚠️ Bug résiduel critique détecté** → voir P8.x nouveau : **X8 — montants du reçu PDF sont à 0**.

### B7 niveau 2 — UX optimale bundle (à faire)

Bundle génère **N `PAYMENT_CASH_VALIDATED`** events (1 par split), donc le citoyen reçoit **3 emails génériques** qui disent "Pago validado: X XAF" **sans** :
- Indiquer que c'est 1 split sur 3 du bundle
- Lister les obligations concernées
- Mentionner le progrès global (X/3 validés, reste Y)

**Décision produit requise avant code** : 3 emails séparés (cohérence non-bundle) OU 1 email consolidé quand les 3 sont validés ?

**Tâches niveau 2** :
- [ ] Décider : 3 emails séparés OU 1 consolidé
- [ ] Créer template `email_templates.payment_bundle_split_validated` (3 langues) — variante qui mentionne "split X sur N du bundle [reference]"
- [ ] Créer template `email_templates.payment_bundle_completed` pour le dernier split (quand tous validés)
- [ ] Logic dans `obligation_routing_service.route_paid_obligations` ou `on_payment_completed` pour détecter bundle completion
- [ ] Event `PAYMENT_BUNDLE_COMPLETED` si tous les splits validés
- [ ] Mapping dans `notification_handler.EVENT_NOTIFICATION_MAP`
- [ ] Test d'intégration multi-splits

**Effort estimé niveau 2** : 2-3 h + décision produit

---

### P8.6 — X5 : seeding staging agents manquants

**Symptôme** : MIN_COMERCIO, MIN_ELECTRICIDAD, MIN_INFORMACION ont des `agent_profiles` mais **0 `is_active=true`** en staging → `auto_assign_item` retourne None → obligations restent sans assignment.

**Tâches** :
- [ ] Script SQL d'UPDATE `is_active=true` pour ces agents OU créer de nouveaux agents
- [ ] Valider avec l'utilisateur (décision métier : quels agents réels existent pour ces ministères ?)
- [ ] Exécuter en staging
- [ ] Re-router les obligations orphelines (4 MIN_COMERCIO obligations de la licence test)

**Effort estimé** : 1 h (principalement décision + validation)

---

### P8.7 — Décision dette technique Migration 172

**Symptôme** : migration `172_fix_validated_by_agent_id.sql` existe dans le repo avec l'intention de changer la sémantique du champ (storing user_id au lieu de agent_profile_id). Mais :
- La FK reste `agent_profiles(id)` (jamais droppée)
- Le backfill SQL ne s'est pas appliqué en staging (9 validated payments contiennent des agent_profile_id)
- Le code `manual_processor` était cassé depuis le 5 mars 2026 à cause de cette incohérence
- Mon fix commit `37eaef5d` a rétabli l'écriture d'agent_profile_id

**Décision à prendre** :
- **Option A** : drop la migration 172 du repo (c'est du code mort qui n'a jamais été appliqué et a introduit un bug 5 semaines)
- **Option B** : compléter la migration (DROP la FK, re-créer vers `users(id)`, backfill data, update code) — **mais** ça déclenche probablement un cascade de bugs ailleurs car `users.id` sémantique ≠ `agent_profiles.id`

**Recommandation** : Option A (drop). Justification : la FK actuelle pointe vers agent_profiles et le code travaille correctement avec ça. Pas de justification métier pour changer.

**Tâches** :
- [ ] Valider la décision avec l'utilisateur
- [ ] Si Option A : supprimer `172_fix_validated_by_agent_id.sql` + ajouter un commit clarifiant
- [ ] Audit des autres places où `validated_by_agent_id` est lu pour vérifier qu'aucune ne s'attend à un user_id

**Effort estimé** : 30 min (décision) + 30 min (implémentation)

---

## 4. Gaps architecturaux connus (pour référence, hors scope immédiat)

### P1.1 — workflow_menu_mapping vs code hardcodé frontend

**Observation** : le menu BUNDLE_% est défini dans `workflow_menu_mapping` avec `menu_group_id='bundle'`, qui produirait des URLs `/dashboard/agent/{entity}/bundle/pending`. **Mais** les URLs réellement observées dans l'app sont `/dashboard/agent/oms/queue/pending` et `/dashboard/agent/oms/validation/pending`.

**Hypothèse** : le menu OMS est généré par un **autre mécanisme** (hardcode frontend ? `roles.menu_config` JSONB ? `_add_common_agent_menus`?) qui court-circuite `workflow_menu_mapping`.

**Pourquoi c'est un gap** : deux systèmes de menu coexistent avec un risque de divergence. Nettoyer en Phase 9 ou 10.

### P1.2 — Relation `/oms/processor/*` vs `/oms/queue/*`

Deux URL pattern distincts visibles :
- `/dashboard/agent/oms/processor/pending` = "Tableau de Bord OMS" sous menu "Licences"
- `/dashboard/agent/oms/queue/pending` = "En Cours" sous menu "Obligations"

Leur **relation fonctionnelle** n'est pas documentée. À clarifier.

### P1.3 — Menu "Obligations" pour AYUNT/CAMARA manquant

Visuellement confirmé en screenshots : les agents MIN_* ont un menu "Obligations" (En Cours + Terminées), mais AYUNT/CAMARA ne l'ont pas. C'est **symétriquement illogique** — ils valident ET processent leurs obligations chamber/municipal. Soit ajouter ce menu pour AYUNT/CAMARA (cohérence), soit le retirer pour MIN_* (simplification).

---

## 5. Règles héritées de la session précédente (déjà dans le prompt §2)

Ces règles doivent être appliquées par toute session qui reprend le travail :

1. Plans avant code, enregistrés dans `.claude/plans/`
2. BD interrogée directement avant toute assomption
3. Phase par phase avec checklist validée
4. Tests à chaque phase
5. Auto-critique en fin de phase
6. Commits locaux par phase, push après validation utilisateur
7. Challenger les suggestions user — tu es l'expert
8. Pas de hardcode, pas de placeholder, pas d'invention
9. 1 M+ users, 100+ agents, OWASP Top 10, UI intuitive vue sans scroll
10. Lock timeouts CLAUDE.md sur chemins critiques
11. Python Odoo : `C:\Program Files\Odoo 17\python\python.exe`

## 6. Scripts utiles déjà produits

- `scripts/debug_bundle_p1_db_probe.py` : snapshot colonnes + triggers + indexes
- `scripts/debug_bundle_p2_db_probe.py` : pg_proc + cascade triggers + base_code
- `scripts/debug_bundle_p5_db_probe.py` : indexes + FK + row counts
- `scripts/debug_bundle_b1b2_backfill.sql` : template pour backfill d'assignments

Ces scripts sont gitignorés mais présents sur disque. Utilise-les comme template pour créer tes propres probes Phase 8.

## 7. Risques identifiés

### R-P8-1 : Session parallèle Claude absorbe le working tree
**Symptôme** : tes changements locaux se retrouvent mélangés dans un commit créé par une autre session via `git add -A`. Observé 2× en session précédente (commits `143e0a06` et `5dd6b3de`).
**Mitigation** : créer une `worktree` dédiée avec `EnterWorktree name="bundle-p8-xxx"`. Les working trees sont isolés par worktree.

### R-P8-2 : Modifier un code utilisé par plusieurs workflows sans s'en rendre compte
**Symptôme** : fix qui aide bundle mais casse passport/conducir/residencia.
**Mitigation** : après tout changement backend, relancer les tests unitaires complets + smoke test mental des autres workflows. Grep les usages du fichier modifié avant de valider.

### R-P8-3 : Déploiement partiel (backend OK, frontend non déployé)
**Symptôme** : CI déploie backend mais pas frontend si aucun fichier `packages/web/**` n'a changé. L'UX reste buggée malgré le backend fixé.
**Mitigation** : toujours vérifier `gh run list --branch develop` après push et confirmer les 3 workflows verts (CI tests + backend deploy + frontend deploy). Si frontend deploy skippé, ajouter un changement no-op dans `packages/web/` pour forcer.

### R-P8-4 : Staging data state dérive pendant le développement
**Symptôme** : tu valides un fix sur la licence de test `b840aaaa` mais son state a été modifié par un autre user pendant ta session (ex: obligations marquées completed, status changed).
**Mitigation** : au début de chaque phase, snapshot de l'état staging avec un probe. Si drift détecté, soit backfill via SQL, soit créer un nouveau bundle de test pour repartir sur une base propre.

## 8. Tests attendus à la fin de Phase 8

- [ ] MIN_AGRICULTURA agent se connecte → voit 1 obligation dans `/oms/queue/pending` (l'obligation du test)
- [ ] MIN_HACIENDA agent se connecte → voit 1 obligation dans sa queue
- [ ] AYUNT agent se connecte → voit 1 paiement 99 000 à valider
- [ ] CAMARA agent se connecte → voit 1 paiement 20 000 à valider
- [ ] Tesoro dashboard compte = validation page count (cohérents)
- [ ] Page citoyen LIC-xxxx affiche la liste des obligations + montants + statuts
- [ ] PDF téléchargé par citoyen contient les détails bundle
- [ ] Email notification envoyé au citoyen après chaque validation agent
- [ ] 43+ tests verts (pas de régression)

## 9. Checklist de départ Phase 8

- [ ] Lire bilan session précédente (`BUNDLE_DEBUG_SESSION_BILAN_2026_04_14.md`)
- [ ] Lire ce plan Phase 8
- [ ] Lire `CLAUDE.md` + `memory/MEMORY.md`
- [ ] `git log --oneline -10` + `git status` pour vérifier l'état git
- [ ] Probe BD staging pour snapshot initial
- [ ] Rédiger `BUNDLE_DEBUG_PHASE8_1_PLAN.md` (détail X4)
- [ ] Demander validation utilisateur avant de toucher au code
- [ ] Créer worktree `bundle-p8-frontend` pour isolation (recommandé)

---

**Prochaine étape** : copier le prompt §"Prompt d'initialisation" dans une nouvelle session Claude Code et lui donner accès au repo.
