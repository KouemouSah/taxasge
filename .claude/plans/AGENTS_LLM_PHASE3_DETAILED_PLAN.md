# Phase 3 — Plan détaillé : Payload actions backend + dispatcher frontend i18n

## Objectif
Corriger les labels Spanish-only dans les actions backend, transformer `MessageItem` en dispatcher capable d'ouvrir `AgentSettingsPanel` inline dans le chat authentifié (sans navigation), et garantir la dégradation gracieuse pour le chat public.

## Scope clarifié (important)
Les outils Level 2/3 (`auto_prepare_wizard`, `submit_prepared_request`, `book_appointment`) **exigent un `user_id`**. `check_tool_level()` échoue en premier ligne 86-87 si `user_id` est absent. Donc le chat public (anonyme) **ne recevra jamais** d'action `permission_required`. Le panneau n'est monté que dans `/dashboard/chat`. Le chat public conserve son comportement actuel `<a href>` pour tout action qui arriverait (quasi-jamais).

## Bugs ciblés (2/7 + dégradation)
- **Bug 3** : Labels backend Spanish-only → `chatbot_service_rag.py:2146-2200` (4 branches + un Spanish refusal text `chatbot_tools_authenticated.py:118-122`)
- **Bug 1 (final fix)** : Cliquer sur "Activer le permis" dans le chat ouvre le panneau **inline** au lieu de naviguer vers `/dashboard/documents` (perte du contexte de conversation)

## Architecture

### Payload enrichi
```python
# Avant (chatbot_service_rag.py:2146-2153)
actions.append({
    "type": "open_settings",
    "label": f"Activar permiso: {perm_type}",   # Spanish hardcodé
    "url": "/dashboard/documents?settings=agent",
    "permission_type": perm_type,
})

# Après
actions.append({
    "type": "open_settings",
    # Semantic payload for frontend i18n
    "label_key": "chatbot.actions.activatePermission",
    "label_params": {"permission_key": perm_type},
    # Legacy Spanish fallback kept for backward compat (1 release cycle)
    "label": f"Activar permiso: {perm_type}",
    # URL fallback used by public chat / when onOpenAgentPanel not wired
    "url": f"/dashboard/documents?settings=agent&permission={perm_type}",
    "permission_type": perm_type,
})
```

### MessageItem dispatcher
```tsx
// NEW props (both optional for backward compat with public chat)
export interface MessageItemProps {
  message: ChatMessage
  locale?: string
  className?: string
  onOpenAgentPanel?: (permissionType?: string) => void
}

// Inside render, replace the <a> block at lines 268-285
{isBot && message.actions && message.actions.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-stone-200/50 dark:border-stone-700/50">
    {message.actions.map((action, i) => {
      // Resolve label via i18n key first, fall back to backend literal
      const permLabel = action.permission_type
        ? tDocs(`agent.permissionTypes.${action.permission_type}`)
        : undefined;
      const labelText = action.label_key
        ? t(action.label_key, permLabel ? { permission: permLabel } : undefined)
        : action.label;

      // Open Settings → in-place panel when authenticated chat provides handler
      if (action.type === 'open_settings' && onOpenAgentPanel) {
        return (
          <Button
            key={i}
            size="sm"
            variant="default"
            className="h-8 text-xs"
            onClick={() => onOpenAgentPanel(action.permission_type)}
          >
            <Settings className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
            {labelText}
          </Button>
        );
      }

      // Default: navigate via <a> (existing behavior)
      if (!action.url || !action.url.startsWith('/')) return null;
      return (
        <a key={i} href={action.url} className="...existing classes...">
          {(action.type === 'start_workflow' || action.type === 'open_wizard') && <ExternalLink className="h-3 w-3" />}
          {action.type === 'open_settings' && <Settings className="h-3 w-3" />}
          {labelText}
        </a>
      );
    })}
  </div>
)}
```

### Dashboard chat page wiring
```tsx
// (dashboard)/dashboard/chat/page.tsx
import { AgentSettingsPanel } from '@/modules/user-documents/components/AgentSettingsPanel';

// Inside component
const [agentPanelOpen, setAgentPanelOpen] = useState(false);
const [highlightPerm, setHighlightPerm] = useState<string | undefined>(undefined);

const openAgentPanel = useCallback((permType?: string) => {
  setHighlightPerm(permType);
  setAgentPanelOpen(true);
}, []);

// In messages map (line 248-254)
<MessageItem
  key={`${msg.timestamp}-${i}`}
  message={msg}
  locale={locale}
  onOpenAgentPanel={openAgentPanel}
/>

// After </div> wrapping the chat
<AgentSettingsPanel
  open={agentPanelOpen}
  onOpenChange={(open) => {
    setAgentPanelOpen(open);
    if (!open) setHighlightPerm(undefined);
  }}
  initialHighlightPermission={highlightPerm}
/>
```

## Fichiers modifiés

### Backend

**`packages/backend/app/modules/chatbot/services/chatbot_service_rag.py`**
- Lignes 2146-2200 : 4 branches `permission_required` → ajout `label_key` + `label_params` + URL avec `permission` query
- Lignes 2103-2131 : branches `start_workflow` / `open_wizard` / `view_pricing` → ajout `label_key` (dual-write avec label existant)
- Lignes 2155-2162 : branch `submit_prepared_request.submitted` → `label_key` pour "Ver solicitud"
- Lignes 2184-2192 : branch `prepare_renewal.prepared` → `label_key` pour "Iniciar renovación"

### Frontend types

**`packages/web/src/modules/chatbot/types/index.ts`**
- Ligne 303-309 : extension de `ChatAction` avec `label_key?: string`, `label_params?: Record<string, string | number>`

### Frontend dispatcher

**`packages/web/src/modules/chatbot/components/MessageItem.tsx`**
- Props (ligne 52-56) : ajout `onOpenAgentPanel?: (permissionType?: string) => void`
- Ligne 268-285 : réécriture du rendu des actions en dispatcher
- Remplacer le filtre drop-silencieux par un `return null` explicite dans le map
- Ajouter `useTranslations('chatbot.actions')` pour résoudre `label_key`
- Ajouter `useTranslations('userDocuments.agent.permissionTypes')` pour résoudre `permission_key` → label humain

### Dashboard chat page

**`packages/web/src/app/[locale]/(dashboard)/dashboard/chat/page.tsx`**
- Imports : `useCallback`, `AgentSettingsPanel`
- State : `agentPanelOpen`, `highlightPerm`
- Callback : `openAgentPanel`
- MessageItem map : pass `onOpenAgentPanel={openAgentPanel}`
- Mount `<AgentSettingsPanel>` en bas du composant

### Public chat (aucun changement)

`packages/web/src/modules/chatbot/components/ChatPage.tsx` + `MessageList.tsx` ne sont pas modifiés. Ils utilisent `MessageItem` sans `onOpenAgentPanel` → fallback `<a href>` activé → comportement actuel préservé. Le scénario "action `permission_required` dans le chat public" ne se produit pas en pratique (pas de `user_id` → Level 2/3 tools refusés avant de produire une action).

### i18n

**`packages/web/messages/{fr,es,en}.json`**
Nouveau namespace `chatbot.actions` (si n'existe pas) :
```json
"chatbot": {
  "actions": {
    "activatePermission": "Activer : {permission}",       // fr
    "activateSubmitPermission": "Activer l'envoi",
    "activateBookPermission": "Activer la réservation",
    "startWorkflow": "Démarrer {workflow} sur Facil",
    "startInFacil": "Démarrer sur Facil",
    "startRenewal": "Démarrer le renouvellement",
    "finalize": "Finaliser la demande",
    "viewRequest": "Voir la demande",
    "appointmentBooked": "RDV : {date}",
    "viewPricing": "Voir les tarifs par zone"
  }
}
```
3 langues avec traductions cohérentes :
- es : "Activar : {permission}", "Iniciar {workflow} en Facil", etc.
- en : "Enable: {permission}", "Start {workflow} on Facil", etc.

## Tests

### Type-check + lint (4 fichiers modifiés)
```bash
cd packages/web && npm run type-check
node node_modules/eslint/bin/eslint.js packages/web/src/modules/chatbot/components/MessageItem.tsx packages/web/src/modules/chatbot/types/index.ts "packages/web/src/app/[locale]/(dashboard)/dashboard/chat/page.tsx"
```

### Backend pytest (si existe)
```bash
cd packages/backend && pytest tests/unit/chatbot/ -v 2>&1 | tail -30
```

### i18n coverage
```bash
# Vérifier que chatbot.actions.* existe dans les 3 locales (même clés)
for f in fr es en; do
  echo "=== $f ==="
  python -c "import json; d=json.load(open('packages/web/messages/$f.json', encoding='utf-8')); print(sorted(d.get('chatbot', {}).get('actions', {}).keys()))"
done
```

### Test manuel E2E (à valider staging)
1. Login user citoyen
2. Aller sur `/dashboard/chat`
3. Tape : "Prepare mi pasaporte nuevo"
4. Attendre la réponse : doit inclure un bouton "Activer : Préparer les demandes" en FR
5. Cliquer → `AgentSettingsPanel` slide in from right, row `prepare_request` scroll + flash
6. Toggle ON → succès → close panneau
7. Tape encore : "Prepare mi pasaporte nuevo"
8. Attendre : agent prépare, bouton "Finaliser la demande" apparaît
9. Cliquer → landing sur `/dashboard/service-requests/wizard/session/{id}`

### Test non-régression chat public
1. Visiter `/` (non connecté) ou `/chat`
2. Tape : "Cuanto cuesta el pasaporte"
3. Vérifier : réponse normale, boutons "Démarrer sur Facil" (link vers wizard) marchent
4. Aucune action `open_settings` ne devrait apparaître

## Checklist Phase 3

### Backend
- [x] `chatbot_service_rag.py` : helper `_build_permission_action(perm_type)` ajouté
- [x] 4 branches `permission_required` → `label_key` + `label_params` + URL enrichie avec `&permission={perm_type}`
- [x] 7 branches au total émettent `label_key` (start_workflow, get_workflow_guide, search_bundles, get_document_checklist, auto_prepare_wizard, submit_prepared_request, book_appointment, prepare_renewal)
- [x] Dual-write `label` Spanish fallback préservé
- [x] Python syntax OK (`py_compile` exit 0)

### Frontend types
- [x] `types/index.ts` : `ChatAction.label_key?` + `label_params?: Record<string, string | number>` + union étendue avec `'appointment_booked'`

### Frontend dispatcher
- [x] `MessageItem.tsx` : prop optionnelle `onOpenAgentPanel?: (permissionType?: string) => void`
- [x] `MessageItem.tsx` : dispatcher branch `open_settings` + onClick → ouvre panneau inline
- [x] `MessageItem.tsx` : `resolveActionLabel` avec 2 namespaces (`chatbot.actions` + `userDocuments.agent.permissionTypes`)
- [x] `MessageItem.tsx` : `permission_key` → lookup permissionTypes pour humaniser la clé (e.g. `prepare_request` → "Préparer les demandes")
- [x] Fallback `<a href>` préservé quand `onOpenAgentPanel` absent OU action non-open_settings
- [x] Filter drop-silencieux remplacé par `return null` explicite pour url non-interne

### Dashboard chat page
- [x] Import `AgentSettingsPanel`
- [x] State `agentPanelOpen`, `highlightPerm`
- [x] `openAgentPanel` callback mémoisé avec `useCallback`
- [x] Prop `onOpenAgentPanel={openAgentPanel}` passée à `MessageItem`
- [x] Mount `<AgentSettingsPanel>` à la fin du composant

### i18n
- [x] `fr.json` : namespace `chatbot.actions` avec 10 clés
- [x] `es.json` : mêmes clés + valeurs espagnol
- [x] `en.json` : mêmes clés + valeurs anglais
- [x] Vérification cohérence via `node -e`: `keys(fr) === keys(es) === keys(en)` ✅ identiques

### Validation
- [x] Type-check passe (0 new errors) — `tsc --noEmit` EXIT=0
- [x] Lint : 0 errors, 17 warnings (tous pre-existants `any` dans types/index.ts, non liés)
- [ ] Test manuel : chat auth → clic bouton Activer → panneau inline (à valider user)
- [ ] Test manuel : 3 langues → label localisé (à valider user)
- [ ] Test non-régression chat public : MessageList ne passe pas `onOpenAgentPanel` → fallback `<a href>` confirmé via code review
- [x] Critique post-implémentation : dégradation gracieuse vérifiée (public chat fallback), dual-write compat préservée, label resolver try/catch pour clés manquantes
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| `useTranslations` 2e namespace crash si clé absente | Fallback `action.label` si `label_key` undefined |
| Backend envoie `label_key` mais frontend n'a pas encore déployé | `label` field préservé en fallback (dual-write) |
| `useTranslations('userDocuments.agent.permissionTypes')` clash avec namespace `chatbot` dans MessageItem | Next-intl permet des calls multiples à `useTranslations` avec namespaces différents ; chaque call retourne un `t()` indépendant |
| Public chat reçoit accidentellement une action `permission_required` | Impossible en pratique (Level 2/3 tools refusent sans user_id avant de générer une action), mais fallback `<a href>` assure dégradation gracieuse |
| Boucle infinie setState si handler recréé à chaque render | `useCallback` sur `openAgentPanel` |
| `label_params` contient valeur brute "prepare_request" sans résolution | Résoudre via 2e namespace `userDocuments.agent.permissionTypes.${perm_type}` côté frontend |

## Ce qui N'EST PAS dans Phase 3

- Catalog permissions dynamique (Phase 4)
- Niveau 3 executive confirmation (Phase 5)
- Localisation du message Spanish de `check_tool_level` lui-même (rester en fallback — ce message passe par le LLM qui reformule)
- Remplacement total du dual-write `label` par `label_key` uniquement (rester compat 1 cycle)

## Estimation

- Backend : 20 min
- Frontend types : 3 min
- Frontend dispatcher : 25 min
- Dashboard chat page : 10 min
- i18n keys : 15 min
- Type-check + lint : 5 min
- Critique + fix : 15 min
- Commit : 2 min
- **Total : ~95 min**
