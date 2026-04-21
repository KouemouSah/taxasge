# Phase 8.2 — X2 : AYUNT/CAMARA 403 sur "Approuver" bundle payment

**Statut** : 🔵 PLAN — investigation complète, approche proposée
**Date** : 2026-04-15
**Worktree** : `bundle-phase8` (HEAD `4261070b`, cherry-pick sur develop `751022ba`)
**Effort estimé** : 30 min – 1 h (surprise positive : très peu de code)
**Référence BOOT** : §P8.2, §3 item X2

---

## 1. Symptôme documenté (BOOT §P8.2)

Agents AYUNT (`ayumalabo1@gmail.com`) et CAMARA (`camaramalabo1@gmail.com`) se connectent, voient leur menu "Paiements → Validation en attente" qui pointe vers `/dashboard/agent/oms/validation` (puis `pending`). Après le backfill des `service_payments.assigned_agent_id`, ils voient **1 dossier dans la liste**, mais le click "Approuver" retourne systématiquement **403 Forbidden**.

## 2. Investigation complète (2026-04-15)

### 2.1 Chaîne d'appel actuelle (pour AYUNT/CAMARA bundle validation)

```
URL: /dashboard/agent/oms/validation/pending
  ↓
[entityCode]=oms, [workflowGroup]=validation, [action]=pending
  ↓
app/.../dashboard/agent/[entityCode]/[workflowGroup]/[action]/page.tsx:279
  ↓ si action === 'pending' :
<PendingPage entityCode={ENTITY_CODE} />  // ENTITY_CODE = 'AYUNTAMIENTO' depuis agent profile
  ↓
PendingPage (modules/agent-dashboard/components/pending/PendingPage.tsx)
  ↓ fetch liste via :
useEntityServiceRequests({entityCode: 'AYUNTAMIENTO', action: 'pending'})
  ↓ appelle :
GET /api/v1/agent/service-requests/entity/AYUNTAMIENTO/requests?action=pending
  ↓ retourne des service_requests (pas des service_payments)
  ↓
User clique "Approuver" →
PendingPage:166 → agentRequestsApi.makeDecision(selectedId, 'approve', ...)
  ↓
POST /api/v1/agent/service-requests/{sr_id}/decision  ← ❌ 403 ici
  ↓ (backend check)
SELECT id FROM agent_work_queue
WHERE item_id = sr_id AND assigned_to = current_user_id AND status = 'assigned'
  ↓ 0 rows (le bundle SR est dans agent_work_queue uniquement pour l'agent TESORO)
  ↓
HTTP 403 "This request is not assigned to you"
```

### 2.2 Pourquoi le backend rejette

Le bundle `service_request` a :
- `entity_code = 'TESORO'` (primary_entity, choisi par `bundle_workflow_service`)
- **Un seul `agent_work_queue` row**, assigné à l'agent Tesoro (celui du split primary)

Mais les splits AYUNT/CAMARA sont des `service_payments` indépendants avec leur propre `assigned_agent_id`. **Il n'y a PAS d'agent_work_queue row pour AYUNT/CAMARA au niveau SR** — c'est sémantiquement correct : l'AYUNT/CAMARA valide un **payment**, pas un **service request**.

Le endpoint `/agent/service-requests/{id}/decision` est **SR-level** : il valide la totalité de la request, pas un split de payment. Son check de sécurité est donc hostile au bundle.

### 2.3 Découverte clé — l'endpoint payment-level est déjà multi-entité 🎯

**`POST /api/v1/admin/service-requests/treasury/payments/{payment_id}/validate`** (admin_routes.py:3685) :

```python
@router.post("/treasury/payments/{payment_id}/validate", ...)
async def validate_payment(
    payment_id: str,
    body: PaymentValidationRequest,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.validate_payment"))  # ← clé
):
    tctx = await _get_treasury_context(db, current_user.id)
    if not tctx.has_profile: no_agent_profile()
    agent_profile_id = tctx.profile_id
    # ... validate via registry
```

**Permission `treasury.validate_payment`** est attribuée en BD à **7 rôles** :
- `agent_tesoro`
- **`agent_ayuntamiento`** ✅
- **`agent_camara`** ✅
- `supervisor_tesoro`, `supervisor_ayuntamiento`, `supervisor_camara`
- `super_admin`

**`_get_treasury_context(db, user_id)`** ne filtre PAS par `entity_code` — il retourne le profil de n'importe quel agent actif. Le nom "treasury" est un misnomer : cette fonction accepte tesoro + ayuntamiento + camara indifféremment.

**Conclusion backend** : `/treasury/payments/{id}/validate` **accepte déjà les 3 entités collecteuses**. Aucun changement backend requis.

### 2.4 Deuxième découverte — l'endpoint liste est aussi multi-entité

**`GET /api/v1/admin/service-requests/treasury/payments/pending`** (admin_routes.py:3165) :

Ligne 3272-3274 (agent non-supervisor) :
```python
where_clauses.append(f"sp.assigned_agent_id = ${param_idx}::uuid")
params.append(str(current_agent_profile_id))
```

**Filtre par `assigned_agent_id` uniquement — aucun filtre d'entité**. Donc :
- Tesoro agent voit ses splits TESORO assignés
- AYUNT agent voit ses splits AYUNTAMIENTO assignés
- CAMARA agent voit ses splits CAMARA_COMERCIO assignés

La page `/dashboard/agent/treasury/validation` (Tesoro actuel) utilise `usePendingPayments` qui hit cet endpoint. **Elle marcherait déjà en l'état pour AYUNT/CAMARA** si on les dirigeait dessus.

## 3. Options de fix — analyse critique

### Option A — Frontend : rediriger makeDecision vers le payment endpoint si workflow=BUNDLE
**Scope** : modifier `PendingPage.tsx` (+ nouveau helper pour récupérer le `payment_id` assigné à l'agent courant pour ce SR)
**Changes** :
- `PendingPage.handleApprove/Reject` : si `request.workflow_code === 'BUNDLE_PAYMENT'`, fetch assigned payment_id + call `/treasury/payments/{id}/validate`
- Nouveau endpoint backend `GET /agent/service-requests/{id}/my-assigned-payment` OU extension du preview
**Pros** : préserve l'URL actuelle AYUNT/CAMARA + conserve PendingPage comme composant unique
**Cons** :
- **Mélange 2 flows** dans le même composant (SR decision pour non-bundle, payment validation pour bundle)
- Nouvelle API call par click ou enrichissement de l'API preview
- Ne résout pas le fait que `useEntityServiceRequests` fetche des SRs alors que le vrai objet métier pour AYUNT/CAMARA est un payment
- **Reste sémantiquement faux** : AYUNT valide un payment, pas une SR
- Ne fixe pas UI1–UI9 (le rendu bundle-unaware de PendingPage sur SRs reste)

### Option B — Backend : autoriser decision SR-level si l'agent a un payment assigné
**Scope** : modifier `agent_routes.py::make_decision` pour accepter "partial validation" si current_user a un `service_payments.assigned_agent_id` = son profile pour ce SR
**Changes** : +20 lignes backend + logique de "partial validation" non triviale (comment agréger 3 validations pour décider le status final de la SR ?)
**Pros** : frontend intact
**Cons** :
- **Overload sémantique majeur** : `decision` devient polymorphe (tout le SR OU un split)
- Risque de régression sur non-bundle workflows
- Duplique la logique de `validate_manual_payment` dans un autre endpoint
- Complexifie le raisonnement pour les 100+ agents en concurrence

### Option C — BD menu migration : AYUNT/CAMARA utilisent la page treasury validation existante ⭐
**Scope** : 1 UPDATE SQL sur `roles.menu_config` pour `agent_ayuntamiento` et `agent_camara` (+ `supervisor_*` si cohérence)
**Changes** :
```sql
UPDATE roles
SET menu_config = jsonb_set(
  menu_config,
  '{menus,1,items,0,href}',
  '"/dashboard/agent/treasury/validation"'::jsonb
)
WHERE code IN ('agent_ayuntamiento', 'agent_camara');
```
**Pros** :
- ✅ **Zéro code frontend**
- ✅ **Zéro code backend**
- ✅ Réutilise le flow déjà PROUVÉ fonctionnel pour Tesoro (fixé en P8.1, splits AYUNT/CAMARA sont `assigned_agent_id` en BD depuis B1+B2 commit `37eaef5d`)
- ✅ Le header/titre de la page est i18n-driven (`t('validation.title')`) — neutre, pas de hardcode "Tesoro"
- ✅ Aligne architecturalement : les 3 entités collecteuses utilisent le MÊME flow de validation payment-level (principe de symétrie)
- ✅ **Résout automatiquement une partie de UI1–UI9** — le PendingPage bundle-unaware est juste retiré du flow pour AYUNT/CAMARA
**Cons** :
- ⚠️ Les AYUNT/CAMARA perdent la vue "liste SR" qu'ils avaient (mais cette vue ne marchait pas — le bouton approve 403)
- ⚠️ Modification BD staging → rollback = nouveau UPDATE SQL (trivial)
- ⚠️ Nécessite un script migration SQL numéroté (ou backfill data) — **mais pas une vraie migration schéma**
- ⚠️ **Vérification i18n requise** : le titre "Validation" doit rester neutre (pas "Tesoro Validation") côté FR/ES/EN

### Option D — Créer un nouveau composant partagé dédié
**Scope** : créer `/dashboard/agent/validation/` (route commune) + composant `EntityPaymentValidationPage` qui wrappe la logique existante
**Pros** : architecture propre à long terme
**Cons** : scope creep massif (plan dit "pas de refactor au-delà du scope du ticket"), doublon avec treasury/validation qui fait déjà exactement ça

## 4. Ma recommandation — Option C

**Justification expert** :
1. **Effort minimal + risque minimal** : 1 UPDATE SQL, rollback trivial
2. **Zero scope creep** — respecte R-P8-2 (ne pas toucher d'autres workflows)
3. **Le backend est déjà prêt** depuis toujours (permissions + _get_treasury_context multi-entité) — on finit juste de câbler le frontend
4. **Le fix X9 P8.1 a démontré la stratégie "menu_config = source of truth"** — on la continue logiquement
5. **Résout sans coder** le problème UX mentionné par §P8.3bis (UI1-UI9) pour AYUNT/CAMARA — ils n'iront plus sur PendingPage bundle-unaware

**Scope Option C précis** :

### Fichiers touchés
- **Zéro fichier frontend modifié**
- **1 script migration SQL** : `packages/backend/database/migrations/294_ayunt_camara_treasury_validation_menu.sql`

### Contenu de la migration
```sql
-- 294_ayunt_camara_treasury_validation_menu.sql
-- P8.2 X2 fix: route AYUNT/CAMARA validation menu to the payment-level
-- treasury validation page (same flow Tesoro uses). The existing OMS
-- validation route (/dashboard/agent/oms/validation) used PendingPage which
-- called a SR-level endpoint that 403'd for bundle splits.
--
-- Backend is already multi-entity for:
--   - /treasury/payments/pending (filters by assigned_agent_id only)
--   - /treasury/payments/{id}/validate (permission treasury.validate_payment
--     granted to agent_ayuntamiento and agent_camara)

BEGIN;

UPDATE roles
SET menu_config = jsonb_set(
  menu_config,
  '{menus,1,items,0,href}',
  '"/dashboard/agent/treasury/validation"'::jsonb
),
menu_config = jsonb_set(
  menu_config,
  '{version}',
  '"2.3"'::jsonb
)
WHERE code IN ('agent_ayuntamiento', 'agent_camara');

-- Verify: expect 2 rows updated
-- SELECT code, menu_config->'menus'->1->'items'->0->>'href' FROM roles
--   WHERE code IN ('agent_ayuntamiento', 'agent_camara');

COMMIT;
```

**⚠️ Attention critique** : `menus[1].items[0]` est un chemin JSONPath ordinal. Il faut **vérifier que l'ordre reste constant** avant l'UPDATE. Alternative plus défensive :

```sql
-- Alternative défensive (pas d'index hardcodé)
UPDATE roles r
SET menu_config = (
  SELECT jsonb_set(
    r.menu_config,
    array['menus', (idx - 1)::text, 'items', '0', 'href'],
    '"/dashboard/agent/treasury/validation"'::jsonb
  )
  FROM (
    SELECT jsonb_path_query_first(r.menu_config, '$.menus ? (@.id == "validation" || @.id == "payments")') AS m,
           (jsonb_path_query_first(r.menu_config, '$.menus[*] ? (@.id == "validation" || @.id == "payments")').idx) AS idx
  ) x
)
WHERE r.code IN ('agent_ayuntamiento', 'agent_camara');
```

En pratique je vais utiliser une approche plus simple : SELECT, print, manual verify, UPDATE avec chemin fixe après vérification.

### Tests manuels après migration
1. **AYUNT agent** : login `ayumalabo1@gmail.com`
2. Sidebar : click "Paiements → Validation en attente" (ou équivalent)
3. **Attendu** : arrivée sur `/dashboard/agent/treasury/validation`, voir 1 paiement 99 000 XAF du bundle LIC-2026-00001
4. Click "Approuver"
5. **Attendu** : dialog confirmation + validation → receipt dialog → `/api/v1/admin/service-requests/treasury/payments/{id}/validate` → 200 OK
6. Réception email reçu PDF citoyen (B7 niveau 1 déjà fonctionnel)
7. **CAMARA agent** : même test avec `camaramalabo1@gmail.com` sur split 20 000 XAF
8. **Tesoro agent** (non-régression) : le flow Tesoro ne change pas
9. **Agents MIN_* (non-régression)** : leur menu_config n'a pas ce path → pas impactés

## 5. Plan d'exécution

```
P8.2.A  Verify current menu_config paths (dump AYUNT + CAMARA JSONB)
        → Confirme l'index JSON exact avant UPDATE
        Effort: 5 min

P8.2.B  Rédiger migration 294_ayunt_camara_treasury_validation_menu.sql
        → chemin JSONPath vérifié + rollback SQL au bas du fichier
        Effort: 15 min

P8.2.C  Apply migration en staging (direct via psycopg2, pas d'auto-migration)
        → Via script run_migration.py ou UPDATE SQL manuel
        Effort: 5 min

P8.2.D  Tests manuels cross-roles (utilisateur)
        Effort: 15 min

P8.2.E  Commit + push (migration SQL uniquement)
        Effort: 10 min

Total : ~50 min
```

## 6. Risques

### R-X2-1 : Autre sous-item bundle-unaware dans la sidebar AYUNT/CAMARA
Le menu `validation` peut avoir d'autres items (`history`, etc.) qui pointent vers des pages OMS bundle-unaware. À auditer dans P8.2.A.
**Mitigation** : dumper le menu_config complet, identifier tous les items pointant `/dashboard/agent/oms/validation*`, décider au cas par cas.

### R-X2-2 : Titre/i18n de la page treasury pas neutre
Si `t('validation.title')` traduit en "Validation Tesoro" spécifiquement, les AYUNT/CAMARA verront une page mal étiquetée.
**Mitigation** : auditer `packages/web/messages/{es,fr,en}.json` pour la clé `treasury.validation.title`. Si hardcode "Tesoro" → patch i18n au même commit.

### R-X2-3 : PendingPage (qui restait pour non-bundle) est toujours cassé pour AYUNT/CAMARA
Après fix C, le menu ne pointe plus sur PendingPage. **Mais** si AYUNT/CAMARA ont un autre sous-item qui pointe vers PendingPage (ex: via `oms_dashboard`), ils le verront encore cassé.
**Mitigation** : identifier + migrer tous les sous-items OMS bundle-unaware au même commit, OU accepter que les autres sous-items restent broken jusqu'à P8.X ultérieur.

### R-X2-4 : Downgrade supervisor
Si on migre `agent_ayuntamiento` mais PAS `supervisor_ayuntamiento`, le supervisor continue à voir la vieille URL.
**Mitigation** : décider d'inclure ou non les supervisor_* dans la même migration. Ma recommandation : **exclure** supervisor_* pour l'instant (ils ont `/dashboard/supervisor` comme dashboard principal, leur flow est différent).

## 7. Décisions d'expert verrouillées (2026-04-15)

1. **Option retenue = C** (BD migration, 0 code). Décision expert finale.
2. **Sous-items** : migration de **`menus[1].items[0]` (pending) + `menus[1].items[1]` (history)**. Le menu "validation" est un groupe cohérent — migrer l'un sans l'autre crée un état partiel. Les autres menus AYUNT (`companies`, `oms_dashboard`, `oms_licenses`, `field_inspections`) restent intacts — hors scope X2.
3. **Supervisors exclus**. Confirmation user : "les obligations sont traitées visible chez les superviseur qui les traitent et génèrent les documents (comme MIN_*)". Le flow supervisor est différent (post-routing obligation processing), tracé comme **P8.X — Supervisor post-validation obligation processing** (follow-up).
4. **Rollback plan** : bloc `-- ROLLBACK` commenté inclus dans le fichier migration.
5. **i18n neutre vérifié** :
   - ES `treasury.validation.title` = "Validación de Pagos"
   - FR `treasury.validation.title` = "Validation des Paiements"
   - EN `treasury.validation.title` = "Payment Validation"
   - **Aucun "Tesoro"/"Treasury"** dans les 3 langues → safe pour AYUNT/CAMARA
6. **Version bump** : `menu_config.version` `"1.0"` → `"1.1"` pour tracer l'origine de la migration.

## 8. Observation annexe — "Tesoro Bata" display bug

**Signalé par user** : sur la liste des validations en attente (current state, avant migration), le nom utilisateur affiché est "Tesoro Bata" pour les agents AYUNT/CAMARA.

**Audit code** :
- Aucun hardcode "Tesoro Bata" dans `packages/web/src` (0 match)
- Aucun hardcode dans les clés i18n `packages/web/messages/*.json`
- BD users AYUNT/CAMARA ont les bons profiles (Ayuntamiento Malabo, Ayuntamiento Bata, Camara Comercio Malabo) avec les bonnes `entity_location_id`

**Hypothèses restantes** (non bloquantes pour X2) :
1. Le display vient d'une donnée dynamique (ex: `payment.assignedAgentName` d'un paiement effectivement assigné à un agent Tesoro de Bata)
2. Cache session stale dans le navigateur du user (test d'abord Tesoro puis AYUNT sans logout complet)
3. Un composant header/sidebar fetchant `/agents/profiles/me` avec stale cache

**Action** : **à revérifier après migration P8.2** via tests staging. Si le bug persiste pour AYUNT/CAMARA sur la NOUVELLE page `/dashboard/agent/treasury/validation`, on ouvre un P8.2bis dédié avec screenshot + network tab. Sinon, le bug était lié à la page OMS bundle-unaware (PendingPage) et se résout mécaniquement avec la migration.

## 9. Contenu migration finale (idempotente)

**⚠️ Contrainte critique** : `run_migrations.py` re-run TOUS les `.sql` à chaque deploy backend sans tracking. **Idempotence obligatoire**.

Fichier : `packages/backend/database/migrations/294_ayunt_camara_treasury_validation_menu.sql`

```sql
-- 294_ayunt_camara_treasury_validation_menu.sql
-- P8.2 X2 fix: route AYUNT/CAMARA validation menu to payment-level treasury
-- validation page. Backend /treasury/payments/{id}/validate already multi-entity
-- (permission granted to agent_ayuntamiento/agent_camara, _get_treasury_context
-- entity-agnostic). Root cause: commit 3fdce698 refactor (2026-03-01) missed
-- menu_config migration. Idempotent: WHERE clause filters rows still needing
-- migration (href still pointing to old OMS route).

BEGIN;

-- Migrate validation.items[0] (pending)
UPDATE roles
SET menu_config = jsonb_set(
  menu_config,
  '{menus,1,items,0,href}',
  '"/dashboard/agent/treasury/validation"'::jsonb
)
WHERE code IN ('agent_ayuntamiento', 'agent_camara')
  AND menu_config->'menus'->1->'items'->0->>'id' = 'pending'
  AND menu_config->'menus'->1->'items'->0->>'href' = '/dashboard/agent/oms/validation';

-- Migrate validation.items[1] (history) to processed-status filter on same page
UPDATE roles
SET menu_config = jsonb_set(
  menu_config,
  '{menus,1,items,1,href}',
  '"/dashboard/agent/treasury/validation?status=processed"'::jsonb
)
WHERE code IN ('agent_ayuntamiento', 'agent_camara')
  AND menu_config->'menus'->1->'items'->1->>'id' = 'history'
  AND menu_config->'menus'->1->'items'->1->>'href' = '/dashboard/agent/oms/validation/history';

-- Bump version to trace migration origin (idempotent: only bump if not already done)
UPDATE roles
SET menu_config = jsonb_set(menu_config, '{version}', '"1.1"'::jsonb)
WHERE code IN ('agent_ayuntamiento', 'agent_camara')
  AND menu_config->>'version' = '1.0';

COMMIT;

-- ============================================================================
-- ROLLBACK (uncomment + execute manually if needed)
-- ============================================================================
-- BEGIN;
-- UPDATE roles
-- SET menu_config = jsonb_set(menu_config, '{menus,1,items,0,href}',
--   '"/dashboard/agent/oms/validation"'::jsonb)
-- WHERE code IN ('agent_ayuntamiento', 'agent_camara');
-- UPDATE roles
-- SET menu_config = jsonb_set(menu_config, '{menus,1,items,1,href}',
--   '"/dashboard/agent/oms/validation/history"'::jsonb)
-- WHERE code IN ('agent_ayuntamiento', 'agent_camara');
-- UPDATE roles SET menu_config = jsonb_set(menu_config, '{version}', '"1.0"'::jsonb)
--   WHERE code IN ('agent_ayuntamiento', 'agent_camara');
-- COMMIT;
```

## 10. Plan d'exécution final (idempotent-safe)

```
P8.2.A  ✅ Audit terminé
        - i18n neutre confirmé (3 langues)
        - menu_config structure verified (menus[1] = validation group)
        - BD users OK (names + locations correct)
        - "Tesoro Bata" bug flagged as observation

P8.2.B  Écrire migration 294_ayunt_camara_treasury_validation_menu.sql
        - Idempotent via WHERE clause restrictive
        - 3 UPDATE statements (items[0], items[1], version)
        - Rollback commenté inclus
        Effort: 10 min

P8.2.C  Appliquer migration en staging directement via psycopg2 + vérifier
        - Commande: python run_migrations.py OU exec direct
        - Vérifier 2 rows affectées
        - Vérifier nouveau href dans BD
        Effort: 5 min

P8.2.D  Tests manuels cross-roles (user)
        - AYUNT Malabo login + click validation → treasury page, voir 99 000 XAF payment pending
        - CAMARA Malabo login + click validation → treasury page, voir 20 000 XAF payment pending
        - Click approve → 200 OK + receipt dialog
        - Tesoro (non-régression) : flow inchangé
        - Observer "Tesoro Bata" display: persiste ou disparaît ?
        Effort: 20 min

P8.2.E  Commit migration file + cherry-pick develop + push
        Effort: 10 min

P8.2.F  Monitor CI + post-deploy verification
        Effort: 15 min (incluant CI wait)

Total : ~60 min
```
