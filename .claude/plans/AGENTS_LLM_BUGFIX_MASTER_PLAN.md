# Plan Master — Bugfix Agents LLM & Système de Permissions

> Plan enregistré aussi dans `C:\taxasge\.claude\plans\AGENTS_LLM_BUGFIX_MASTER_PLAN.md` (règle projet).

## Context

L'utilisateur rapporte que l'agent LLM d'exécution automatique ne fonctionne pas en bout de chaîne : le chatbot demande à l'utilisateur d'activer un permis (`prepare_request`, niveau 2) mais aucune interface ne permet de l'activer. Les boutons "Démarrer la démarche" dans l'onglet Préparation ne font rien. Objectif : rendre le système agents LLM pleinement opérationnel pour 1M+ utilisateurs, sans frictions, sécurisé OWASP.

## Vérification des bugs (grep/read directs, pas de supposition)

| # | Bug | Fichier:ligne | Preuve | Niveau |
|---|-----|---------------|--------|--------|
| 1 | `AgentSettingsPanel` orphelin | `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx` + `DocumentVault.tsx:39-45` | Grep = 0 import en dehors de `index.ts` (export seul) | CRITIQUE |
| 2 | Bouton "Démarrer la démarche" sans onClick | `packages/web/src/modules/user-documents/components/ReadinessCheck.tsx:221-226` | `<Button>` sans `onClick` ; voisin `askAssistant:227-238` en a un | CRITIQUE |
| 3 | Labels backend Spanish-only pour actions | `packages/backend/app/modules/chatbot/services/chatbot_service_rag.py:2146-2200` | 4 `actions.append({"label": f"Activar permiso: ..."})` + 1 Spanish refusal text `chatbot_tools_authenticated.py:118-122` | HAUT |
| 4 | `/dashboard/service-requests/new?workflow=X` silencieusement ignoré | `packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/new/page.tsx` | Aucun `useSearchParams` ; backend émet pourtant cette URL 3× (`chatbot_service_rag.py:2115, 2129, 2190`) | HAUT |
| 5 | `/dashboard/documents?upload=CODE` silencieusement ignoré | `DocumentVault.tsx` (aucun reader) + `ReadinessCheck.tsx:113` émetteur | DocumentVault ne lit aucun search param | MOYEN |
| 6 | 3 toggles frontend non branchés backend | `AgentSettingsPanel.tsx:79-85` vs `_TOOL_PERMISSION_MAP:62-67` | Frontend propose 5 types, backend n'en check que 4 → `suggest_appointments`, `proactive_alerts`, `auto_classify` = UI morts | MOYEN |
| 7 | Niveau 3 (Executive) non implémenté | `chatbot_tools_authenticated.py:57-58` + `AgentSettingsPanel.tsx:158-163` | Tools `submit_prepared_request`, `book_appointment` déclarés niveau 3 mais `check_tool_level` ne gère que niveau ≤ 2 ; panneau propose Select 1-2 seulement | HAUT |

### Faux positifs écartés (vérifiés)

- `_consolidate_context()` manquant : **FAUX**, défini à `chatbot_service_rag.py:1204`, appelé lignes 227, 725
- `<->` vs `<=>` index vecteur : **FAUX**, `semantic_search_repository.py` utilise `<=>` systématiquement
- `legislacion_documents` vide : orthogonal au cluster permissions, à traiter séparément

## Architecture de la solution

### Insight fondateur
Le code a été écrit en supposant que les search params pilotent l'état (`?settings=agent`, `?workflow=X`, `?upload=Y`), mais **aucun composant receveur n'implémente `useSearchParams()`**. Les bugs 1, 4, 5 partagent la même racine. Les fixer ensemble dans `DocumentVault` et `service-requests/new` débloque 3 bugs d'un coup.

### Principes directeurs
1. **Pas de réécriture** : `AgentSettingsPanel` fait 571 lignes et fonctionne → on le monte, on ne le refait pas.
2. **Label i18n par clé** : backend renvoie `label_key` + `label_params`, frontend traduit. Dual-write `label` (fallback) pour compat pendant 1 cycle.
3. **Deux points d'entrée pour le panneau** : (a) `DocumentVault` header gear icon, (b) `ChatPage` via action `open_settings` — pas de page dédiée.
4. **Niveau 3 = consentement par action, pas toggle permanent** : pour actes gouvernementaux (soumettre, réserver RDV), un code de confirmation unique (Redis TTL 5min) est plus sûr qu'un switch "toujours autorisé". OWASP A04.
5. **Pas de hardcode** : `PERMISSION_TYPES` doit venir d'un endpoint backend (nouvelle route `/api/v1/user-documents/agent/permission-catalog`).
6. **1M+ users** : react-query gate `enabled: open`, cache partagé entre les 2 sites de mount, pas de requête au render.

## Phases (5 phases, risque croissant)

### Phase 1 — Fixer "Démarrer la démarche" + deep-link wizard (BAS risque, gain immédiat)

**Scope** : débloquer le path manuel non-IA. 2 fichiers frontend uniquement.

**Fichiers**
- `packages/web/src/modules/user-documents/components/ReadinessCheck.tsx`
  - Ligne 222-226 : ajouter `onClick` → `router.push(`/${locale}/dashboard/service-requests/new?workflow=${result.workflow_code}`)`. Import `useRouter` de `next/navigation`.
  - Lignes 287-305 (QUICK_WORKFLOWS) : router vers `/dashboard/service-requests/new?workflow=CODE` au lieu de `/dashboard/chat?q=...` (sauf garder le bouton "Assistant" séparé à 227-238).
- `packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/new/page.tsx`
  - Ajouter `useSearchParams` import.
  - `useEffect` qui lit `?workflow=CODE`, valide contre `workflows` chargés, et appelle `startNewRequest(code)` une seule fois via `useRef` guard. Fallback silencieux si code inconnu.

**Checklist Phase 1**
- [ ] `ReadinessCheck` : onClick ajouté sur "Démarrer la démarche"
- [ ] `ReadinessCheck` : QUICK_WORKFLOWS routent vers le wizard
- [ ] `new/page.tsx` : `useSearchParams` + auto-start avec guard ref
- [ ] Validation : `?workflow=UNKNOWN_CODE` fallback gracieux (pas de crash)
- [ ] Validation : retour arrière ne relance pas le wizard en boucle
- [ ] Test E2E manuel : cliquer "Démarrer la démarche" → landing direct sur wizard session
- [ ] Test E2E manuel : QUICK_WORKFLOWS Passeport Nouveau → wizard, pas chat
- [ ] Type-check + lint passent
- [ ] Critique auto-fix
- [ ] Commit local

### Phase 2 — Monter `AgentSettingsPanel` dans `DocumentVault` + read search params (MOYEN)

**Scope** : rendre le panneau réellement accessible depuis l'UI principale des documents.

**Fichiers**
- `packages/web/src/modules/user-documents/components/DocumentVault.tsx`
  - Imports : `useSearchParams` (`next/navigation`), `useEffect`, `useRef`, `Settings2` (`lucide-react`), `AgentSettingsPanel`
  - State : `agentPanelOpen`, `highlightPerm`, `uploadDocCode`
  - `useEffect` qui lit `?settings=agent`, `?permission=X`, `?upload=Y`. `useRef` pour éviter la réouverture à chaque navigation. `router.replace` pour nettoyer l'URL après consommation.
  - Header ligne 168-171 : `<Button variant="ghost" size="icon" onClick={() => setAgentPanelOpen(true)}><Settings2 /></Button>` à côté de Upload.
  - Monter `<AgentSettingsPanel open={...} onOpenChange={...} initialHighlightPermission={highlightPerm} />` après `<AgentOnboarding />`.
- `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx`
  - Props : ajouter `initialHighlightPermission?: string`
  - `PermissionRow` : accepte `highlighted?: boolean`, applique une classe flash animation + `ref` auto-scroll
  - Principal `AgentSettingsPanel` : quand `open` passe à `true`, si `initialHighlightPermission` défini, scroll vers la ligne après 300ms.

**Checklist Phase 2**
- [ ] `DocumentVault` : state + useEffect + guard ref
- [ ] `DocumentVault` : gear icon header
- [ ] `DocumentVault` : `AgentSettingsPanel` monté
- [ ] `?settings=agent` ouvre le panneau
- [ ] `?settings=agent&permission=prepare_request` scroll + highlight la ligne
- [ ] `?upload=CODE` ouvre `DocumentUploadDialog` (fixe bug 5)
- [ ] URL nettoyée après consommation (pas de reset sur refresh)
- [ ] Onglets personal/generated/alerts/readiness continuent de fonctionner (régression)
- [ ] react-query `enabled: open` respecté (pas de fetch avant ouverture)
- [ ] Type-check + lint
- [ ] Critique auto-fix
- [ ] Commit local

### Phase 3 — Réécrire payload actions backend + dispatcher frontend i18n (HAUT)

**Scope** : corriger les labels Spanish, rendre le bouton "Activar permiso" → "Activer le permis" en FR, cliquable et fonctionnel depuis le chat.

**Fichiers backend**
- `packages/backend/app/modules/chatbot/services/chatbot_service_rag.py`
  - Lignes 2091-2202 : réécrire `_extract_actions_from_tools`. Nouveau helper `_build_permission_action(perm_type)` unifiant les 4 branches `permission_required`.
  - Chaque action émet : `{type, label_key, label_params, url?, permission_type?, workflow_code?, label}` — `label` gardé en Spanish fallback pour compat.
  - Clés émises : `chatbot.actions.activatePermission`, `.startWorkflow`, `.startRenewal`, `.finalize`, `.viewRequest`, `.appointmentBooked`, `.viewPricing`
- `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py`
  - `check_tool_level` : retourner une structure dict `{allowed, permission_type, required_level, i18n_key, message}` au lieu du tuple `(bool, str)`. Adapter les 10 call-sites.
  - Ligne 118-122 : message Spanish reste en fallback, mais `i18n_key = "chatbot.toolRefusal"` ajouté.

**Fichiers frontend**
- `packages/web/src/modules/chatbot/types/index.ts`
  - Étendre le type `Action` : `label_key?: string`, `label_params?: Record<string, string>`
- `packages/web/src/modules/chatbot/components/MessageItem.tsx`
  - Lignes 268-285 : remplacer le `<a>` monolithique par un dispatcher :
    - `action.type === 'open_settings'` → `<Button onClick={onOpenAgentPanel(action.permission_type)}>`
    - `action.type === 'confirm_executive'` → `<Button variant="destructive">` (Phase 5)
    - `'start_workflow' | 'open_wizard'` → `<Link href={action.url}>`
    - default → `<a>`
  - Props : `onOpenAgentPanel?: (permType?: string) => void`, `onConfirmExecutive?: (action) => void`
  - Label : `action.label_key ? t(action.label_key, action.label_params) : action.label`
- `packages/web/src/app/[locale]/(dashboard)/dashboard/chat/page.tsx`
  - State `agentPanelOpen`, `highlightPerm` au niveau de la page chat
  - Prop drill `onOpenAgentPanel` jusqu'à `MessageItem`
  - Mount `<AgentSettingsPanel>` au niveau page chat
- `packages/web/messages/{fr,es,en}.json`
  - Namespace `chatbot.actions` avec les 7 clés ci-dessus
  - Vérifier `userDocuments.agent.permissionTypes` existe pour les 5 types du frontend + `.toolRefusal`

**Checklist Phase 3**
- [ ] Backend : `_build_permission_action` helper
- [ ] Backend : les 7 actions émettent `label_key`
- [ ] Backend : `check_tool_level` retourne dict + call-sites mis à jour
- [ ] Frontend : `Action` type étendu
- [ ] Frontend : `MessageItem` dispatcher avec onClick handler
- [ ] Frontend : `ChatPage` lève l'état et mount le panneau
- [ ] i18n : 7 clés ajoutées en fr/es/en (Claude vérifie JSON-diff)
- [ ] Test : chat refuse passeport, clique bouton → panneau ouvre inline (pas de nav)
- [ ] Test : 3 langues rendent le bon label
- [ ] Test E2E : granter perm → re-query → succès
- [ ] Critique auto-fix
- [ ] Commit local

### Phase 4 — Catalog permissions dynamique + cleanup UI morts (MOYEN)

**Scope** : synchroniser frontend ↔ backend, éliminer les toggles qui ne font rien.

**Fichiers backend**
- `packages/backend/app/modules/user_documents/api/user_documents_routes.py`
  - Nouveau GET `/api/v1/user-documents/agent/permission-catalog`
  - Retourne `[{key, max_level, description_key, always_on}]` dérivé de `_TOOL_PERMISSION_MAP` + `TOOL_LEVELS` (source unique = backend)
  - Cache 1h via Upstash Redis (`get_permissions_cache`)

**Fichiers frontend**
- `packages/web/src/modules/user-documents/services/api.ts`
  - Nouvelle méthode `getAgentPermissionCatalog()`
- `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx`
  - Remplacer `PERMISSION_TYPES` constant (lignes 79-85) par un fetch via `useQuery`
  - `max_level` détermine `<Select>` options (1 ou 1-2 ou 1-2-3)
  - Si catalogue vide temporairement → skeleton
  - **Décision** : `suggest_appointments`, `proactive_alerts`, `auto_classify` → soit wire backend tools, soit les retirer du catalogue jusqu'à implémentation. Retour initial = retirer (on ne peut pas laisser de toggles fantômes en prod).

**Checklist Phase 4**
- [ ] Backend : endpoint `/permission-catalog` + test
- [ ] Backend : catalogue ne liste que les perms réellement wired
- [ ] Frontend : api client + hook react-query
- [ ] Frontend : panneau consomme le catalogue
- [ ] Retirer (ou feature-flag) les 3 toggles non implémentés
- [ ] Type-check + lint
- [ ] Test E2E : panneau affiche les bonnes options, toggles fonctionnent
- [ ] Critique auto-fix
- [ ] Commit local

### Phase 5 — Niveau 3 Executive avec confirmation codes (HAUT risque, feature flagged)

**Scope** : débloquer `submit_prepared_request` et `book_appointment` avec consentement par action (pas de toggle permanent).

**Fichiers backend**
- `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py`
  - `check_tool_level` : branche `required_level == 3`. Vérifier `kwargs.get('confirmation_code')`. Si absent → issue un nouveau code (Redis, TTL 5min, clé `agent:confirm:{user_id}:{tool}:{args_hash}`). Si présent et valide → consommer (DELETE) et autoriser.
  - Args canonicalisés via `json.dumps(sorted_items)` → hash SHA-256 → prévient replay avec args modifiés.
  - Rate limit : max 5 codes pendants par user (via `check_rate_limit`).
- `packages/backend/app/modules/chatbot/services/chatbot_service_rag.py`
  - Émettre action `{type: 'confirm_executive', label_key, confirmation_code, summary, tool_name}` quand `status == "confirmation_required"`
- Nouvelle migration : `agent_executive_audit_log` (append-only, user_id, tool_name, confirmation_code, args_hash, issued_at, redeemed_at, outcome)
- Endpoint `GET /api/v1/user-documents/agent/confirmations` (historique pour le panneau)

**Fichiers frontend**
- `packages/web/src/modules/chatbot/components/ExecutiveConfirmModal.tsx` (nouveau)
  - Modal destructive-variant, affiche `summary`, bouton Confirmer → re-call tool avec `confirmation_code`
- `packages/web/src/modules/chatbot/components/MessageItem.tsx`
  - Handle `action.type === 'confirm_executive'` → onClick ouvre ExecutiveConfirmModal
- `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx`
  - Nouvelle section "Historique d'actions exécutives" sous Stats (append-only, read-only)

**Feature flag** : `FEATURE_EXECUTIVE_TOOLS=false` par défaut, toggler via env. Disable 100% Phase 5 si régression.

**Checklist Phase 5**
- [ ] Migration audit log créée + appliquée en staging
- [ ] Redis confirmation cache avec TTL + single-use
- [ ] `check_tool_level` branch niveau 3 + args_hash canonique
- [ ] Rate limit 5 codes/user
- [ ] Tool `submit_prepared_request` retourne `confirmation_required` au 1er call
- [ ] Modal frontend destructive
- [ ] Dispatcher MessageItem branche confirm_executive
- [ ] Historique exécutif dans le panneau
- [ ] Feature flag env + test OFF/ON
- [ ] Test sécurité : replay avec args modifiés → reject
- [ ] Test sécurité : replay du même code → reject (single-use)
- [ ] Test charge : 1000 users concurrents
- [ ] Critique auto-fix
- [ ] Commit local

## Règles de workflow (conformes aux instructions utilisateur)

- **Plan phase-by-phase** : chaque phase = plan détaillé séparé dans `.claude/plans/AGENTS_LLM_PHASE_N_PLAN.md` avant implémentation
- **Test end-of-phase** : type-check, lint, ESLint, pytest backend (modules touchés), E2E Playwright (Phase 1, 2, 3, 5)
- **Critique auto-fix** : à la fin de chaque phase, relire les diffs et corriger les soucis (imports inutilisés, types any, permissions oubliées)
- **Commit local par phase** : `git commit` local seulement, pas de push (règle mémoire `feedback_plan_workflow.md` + `feedback_confirm_push.md`)
- **Push global** : seulement après validation de l'ensemble par l'utilisateur
- **Délégation** : sous-agents Explore/Plan pour sous-tâches complexes (ex: vérifier cohérence i18n, audit sécurité Phase 5)
- **Échelle 1M+ users** : react-query avec `enabled` gates, pas de polling, cache Redis côté backend pour catalogue permissions
- **OWASP** : Phase 5 particulièrement — single-use codes, args_hash, rate limit, audit append-only
- **No hardcoding** : Phase 4 supprime le hardcode des permission types côté frontend

## Fichiers critiques à modifier

| Fichier | Phase |
|---------|-------|
| `packages/web/src/modules/user-documents/components/ReadinessCheck.tsx` | 1 |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/new/page.tsx` | 1 |
| `packages/web/src/modules/user-documents/components/DocumentVault.tsx` | 2 |
| `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx` | 2, 4, 5 |
| `packages/backend/app/modules/chatbot/services/chatbot_service_rag.py` | 3, 5 |
| `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py` | 3, 5 |
| `packages/web/src/modules/chatbot/components/MessageItem.tsx` | 3, 5 |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/chat/page.tsx` | 3 |
| `packages/web/src/modules/chatbot/types/index.ts` | 3 |
| `packages/web/messages/{fr,es,en}.json` | 3, 4 |
| `packages/backend/app/modules/user_documents/api/user_documents_routes.py` | 4, 5 |
| Nouvelle migration `agent_executive_audit_log` | 5 |
| `packages/web/src/modules/chatbot/components/ExecutiveConfirmModal.tsx` (nouveau) | 5 |

## Risques & mitigations

1. **Changement shape `check_tool_level`** casse 10 call-sites → recompiler + tests backend avant commit
2. **`?settings=agent` boucle infinie** → `useRef` + `router.replace` nettoyage URL
3. **i18n key manquante** en prod → script CI `json-diff` entre fr/es/en clés `chatbot.actions.*`
4. **Phase 5 args_hash drift** → hash canonique (clés triées) identique côté issue et redeem
5. **Mount double du panneau** (DocumentVault + Chat) → cache react-query partagé via `queryKey` identique, pas de double fetch
6. **Régression onglet Préparation** (le plus utilisé) → test E2E systématique après chaque phase qui touche `ReadinessCheck`

## Verification end-to-end (après toutes les phases)

1. User connecté, va dans Mes Documents, onglet Préparation
2. Clique "Démarrer la démarche" Passeport Nouveau → landing wizard direct ✅
3. Clique "Préparer avec l'assistant" Passeport Nouveau → chat + message prérempli
4. Chat refuse (permission manquante) → bouton "Activer le permis : Préparer une démarche" en FR
5. Clique le bouton → `AgentSettingsPanel` slide-in in-place → `prepare_request` row flash
6. Toggle ON → mutation succès → panneau se ferme
7. Renvoie le message au chat → agent prépare le wizard, renvoie action "Finaliser la demande"
8. Clique → landing direct sur `/dashboard/service-requests/{id}/wizard?step=...` avec données pré-remplies
9. (Phase 5) : "Soumettre" → modal confirmation → Confirmer → tool exécute → historique dans panneau
10. Vérifier : le même parcours en Español et English affiche les labels corrects

## Définition de "terminé"

- Les 7 bugs confirmés sont corrigés
- 0 hardcoded Spanish label dans les actions chatbot
- 0 composant orphelin (AgentSettingsPanel mounté aux 2 endroits prévus)
- Tests E2E Playwright passent pour le parcours Passeport complet en 3 langues
- GitHub Actions build + tests passent
- Utilisateur valide le comportement en staging
- Plan final archivé dans `.claude/plans/` + MEMORY.md mis à jour avec la feedback de la session
