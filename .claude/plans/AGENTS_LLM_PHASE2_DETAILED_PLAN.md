# Phase 2 — Plan détaillé : Monter `AgentSettingsPanel` dans `DocumentVault`

## Objectif
Rendre le panneau de permissions agent réellement accessible depuis `DocumentVault`, avec support des deep-links `?settings=agent`, `?permission=X` (highlight ciblé), et `?upload=CODE` (ouvre dialog upload).

## Bugs ciblés (2/7)
- **Bug 1** : `AgentSettingsPanel` orphelin — jamais monté dans l'UI
- **Bug 5** : `/dashboard/documents?upload=CODE` émis par `ReadinessCheck.tsx:113` mais ignoré par `DocumentVault`

## Architecture

### Flow after fix
```
Chat agent refuse tool → action { url: /dashboard/documents?settings=agent&permission=prepare_request }
                                          ↓ user clicks
                                          ↓ router navigates
                                          ↓
                                 DocumentVault mounts
                                          ↓
                                 useEffect reads searchParams
                                          ↓
                                 setAgentPanelOpen(true) + setHighlightPerm('prepare_request')
                                          ↓
                                 AgentSettingsPanel slides in from right
                                          ↓
                                 PermissionRow[prepare_request] scrolls + flashes
                                          ↓
                                 User toggles switch → mutation fires
                                          ↓
                                 router.replace clean URL (no re-trigger on refresh)
```

### Points d'entrée du panneau (après Phase 2)
1. **Gear icon header** (nouveau) : bouton ghost + icon Settings2 à côté de "Upload"
2. **Deep-link `?settings=agent`** : auto-ouverture à l'arrivée sur la page
3. **Deep-link `?settings=agent&permission=X`** : auto-ouverture + scroll/flash sur la ligne X

### Principes
- **Guard ref** : `hasHandledUrlRef` pour éviter ré-ouverture après close + re-trigger
- **URL cleanup** : `router.replace` après consommation pour qu'un refresh ne rouvre pas le panneau
- **Cache partagé** : le panneau utilise `agentKeys.permissions` — ouvert 2 fois (DocumentVault puis chat), 1 seul fetch grâce à react-query cache
- **`enabled: open`** (déjà en place) : pas de fetch tant que le panneau est fermé → 0 coût au premier render

## Fichiers modifiés

### F1. `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx`

**Changement 1 — props** (ligne 109-112)
```typescript
interface AgentSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialHighlightPermission?: string; // nouveau
}
```

**Changement 2 — PermissionRow ajoute ref + highlighted** (lignes 119-181)
```typescript
function PermissionRow({
  permissionKey,
  icon: Icon,
  alwaysOn,
  permission,
  isToggling,
  highlighted, // nouveau
  onToggle,
  onLevelChange,
}: {
  // ... existants ...
  highlighted?: boolean;
}) {
  // ... existant ...
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlighted && rowRef.current) {
      // Defer to let Sheet animation finish (~250ms) before scroll
      const timer = setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlighted]);

  return (
    <div
      ref={rowRef}
      className={`flex items-center gap-3 py-2.5 transition-colors ${highlighted ? 'bg-primary/10 rounded -mx-2 px-2' : ''}`}
    >
      {/* contenu existant */}
    </div>
  );
}
```

**Changement 3 — `AgentSettingsPanel` signature + rendu** (ligne 240, 406-417)
```typescript
export function AgentSettingsPanel({
  open,
  onOpenChange,
  initialHighlightPermission,
}: AgentSettingsPanelProps) {
  // ... existants ...

  // Clear highlight when panel closes
  const [activeHighlight, setActiveHighlight] = useState<string | undefined>(
    initialHighlightPermission
  );
  useEffect(() => {
    if (open) setActiveHighlight(initialHighlightPermission);
    else setActiveHighlight(undefined);
  }, [open, initialHighlightPermission]);

  // ... dans le render PermissionRow map (ligne 406-417) ...
  {PERMISSION_TYPES.map((pt) => (
    <PermissionRow
      key={pt.key}
      permissionKey={pt.key}
      icon={pt.icon}
      alwaysOn={pt.alwaysOn}
      permission={permissionMap[pt.key]}
      isToggling={togglingType === pt.key}
      highlighted={activeHighlight === pt.key} // nouveau
      onToggle={handleToggle}
      onLevelChange={handleLevelChange}
    />
  ))}
```

**Import nécessaire** : `useRef` (déjà importé via `useState, useCallback, useMemo` ligne 14)
```typescript
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
```

### F2. `packages/web/src/modules/user-documents/components/DocumentVault.tsx`

**Changement 1 — imports** (ligne 19-45)
```typescript
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// ... existants ...
import {
  Upload,
  FileText,
  Shield,
  Bell,
  CheckCircle,
  FolderOpen,
  AlertTriangle,
  HardDrive,
  Settings2, // nouveau
} from 'lucide-react';
// ... existants ...
import { AgentSettingsPanel } from './AgentSettingsPanel';
```

**Changement 2 — hooks + state** (après ligne 154)
```typescript
const router = useRouter();
const searchParams = useSearchParams();

// Agent settings panel
const [agentPanelOpen, setAgentPanelOpen] = useState(false);
const [highlightPerm, setHighlightPerm] = useState<string | undefined>(undefined);

// Guard to prevent re-firing the URL reader on re-renders
const hasHandledUrlRef = useRef(false);
```

**Changement 3 — useEffect URL reader** (avant le return, après l'état existant)
```typescript
// Read deep-link query params from chatbot actions / ReadinessCheck buttons.
// Supported:
//   ?settings=agent                          → open AgentSettingsPanel
//   ?settings=agent&permission=prepare_request → highlight that row
//   ?upload=CODE                             → open DocumentUploadDialog
// Fires once per URL change, cleans the URL after consumption so refresh
// doesn't re-open the panel.
useEffect(() => {
  if (hasHandledUrlRef.current) return;
  const settings = searchParams.get('settings');
  const permission = searchParams.get('permission');
  const upload = searchParams.get('upload');

  let handled = false;

  if (settings === 'agent') {
    setAgentPanelOpen(true);
    if (permission) setHighlightPerm(permission);
    handled = true;
  }

  if (upload) {
    setUploadOpen(true);
    handled = true;
  }

  if (handled) {
    hasHandledUrlRef.current = true;
    // Strip the consumed params from the URL (keep tab state if any)
    const clean = new URL(window.location.href);
    clean.searchParams.delete('settings');
    clean.searchParams.delete('permission');
    clean.searchParams.delete('upload');
    router.replace(`${clean.pathname}${clean.search}`, { scroll: false });
  }
}, [searchParams, router]);
```

**Changement 4 — Gear icon dans header** (ligne 168-171)
```typescript
<div className="flex items-center gap-2">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setAgentPanelOpen(true)}
    aria-label={t('agent.settings') || 'Agent settings'}
    title={t('agent.settings') || 'Agent settings'}
  >
    <Settings2 className="h-4 w-4" />
  </Button>
  <Button onClick={() => setUploadOpen(true)}>
    <Upload className="mr-2 h-4 w-4" />
    {t('addDocument')}
  </Button>
</div>
```

**Changement 5 — Mount `AgentSettingsPanel` après `<AgentOnboarding />`** (ligne 277)
```typescript
{/* ── Agent Settings Panel (mounted from gear icon or ?settings=agent URL) ── */}
<AgentSettingsPanel
  open={agentPanelOpen}
  onOpenChange={(open) => {
    setAgentPanelOpen(open);
    if (!open) setHighlightPerm(undefined);
  }}
  initialHighlightPermission={highlightPerm}
/>
```

## Tests

### Type-check + lint
```bash
cd packages/web && npm run type-check && npx eslint src/modules/user-documents/components/DocumentVault.tsx src/modules/user-documents/components/AgentSettingsPanel.tsx
```

### Test manuel E2E (à valider staging/dev)
1. `/dashboard/documents` → gear icon visible dans le header
2. Cliquer gear icon → panneau slide in from right
3. Toggle `prepare_request` → switch ON → permission créée en BD (vérifier via SQL)
4. Close panneau → refresh page → panneau reste fermé (URL nettoyée)
5. Visiter `/dashboard/documents?settings=agent` → panneau s'ouvre auto
6. Visiter `/dashboard/documents?settings=agent&permission=prepare_request` → panneau s'ouvre, row `prepare_request` scrolle + flash bg-primary/10
7. Visiter `/dashboard/documents?upload=PASAPORTE_ACTUAL` → upload dialog s'ouvre
8. Back-button → retourne sans re-déclencher
9. Non-régression : cliquer onglets personal/generated/alerts/readiness toujours OK

### Test SQL (BD directe)
```sql
-- Vérifier que grant crée bien la ligne
SELECT * FROM user_agent_permissions
WHERE user_id = '<test_user_uuid>'
  AND permission_type = 'prepare_request';
```

## Checklist Phase 2

- [x] `AgentSettingsPanel` : prop `initialHighlightPermission`
- [x] `AgentSettingsPanel` : `useRef` + scrollIntoView + flash class dans `PermissionRow`
- [x] `AgentSettingsPanel` : state `activeHighlight` synchronisé avec open/initialHighlight
- [x] `AgentSettingsPanel` : import `useRef`, `useEffect` ajoutés
- [x] `DocumentVault` : imports `useRouter`, `useSearchParams`, `useEffect`, `useRef`, `Settings2`, `AgentSettingsPanel`
- [x] `DocumentVault` : state `agentPanelOpen`, `highlightPerm`, `hasHandledUrlRef`
- [x] `DocumentVault` : useEffect reader `?settings=agent&permission=X` + `?upload=Y`
- [x] `DocumentVault` : router.replace cleanup URL après consommation
- [x] `DocumentVault` : gear icon dans header (i18n key `userDocuments.agent.settings` vérifiée fr/es/en)
- [x] `DocumentVault` : `AgentSettingsPanel` monté après `AgentOnboarding`
- [x] Type-check passe — `tsc --noEmit` EXIT=0
- [x] Lint passe — eslint EXIT=0
- [ ] Test manuel : gear → panneau ouvre (à valider user)
- [ ] Test manuel : `?settings=agent` → auto-ouvre (à valider user)
- [ ] Test manuel : `?permission=X` → scroll + flash (à valider user)
- [ ] Test manuel : `?upload=CODE` → upload dialog ouvre (à valider user)
- [ ] Test manuel : URL nettoyée après consommation (à valider user)
- [ ] Test manuel : refresh ne rouvre pas le panneau (à valider user)
- [ ] Test non-régression : 4 onglets + upload + onboarding (à valider user)
- [ ] Test SQL direct après grant : `SELECT * FROM user_agent_permissions` (à valider user en staging)
- [x] Critique post-implémentation : ref guard empêche re-entry ; URL cleanup garde autres params (tab state) ; i18n key existe ; 2 points d'entrée (gear + deep-link) partagent le même cache react-query
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| `useSearchParams` null en SSR | `'use client'` ligne 19 ✓, hook safe côté client |
| useEffect boucle si dépendance `searchParams` change sur `router.replace` | `useRef` guard empêche 2e fire |
| `router.replace` fait un re-render qui déclenche le useEffect → re-reset ref | ref reste à `true` sur re-render, le return early bloque |
| Gear icon casse le layout mobile (stack) | `flex items-center gap-2` préserve l'alignement responsive |
| AgentSettingsPanel rendu 2× (DocumentVault + future ChatPage) → 2 fetches | `enabled: open` + cache react-query partagé via `agentKeys.permissions` |
| i18n clé `agent.settings` manquante | fallback via `\|\| 'Agent settings'` jusqu'à ajout en fr/es/en (Phase 3) |

## Ce qui N'EST PAS dans Phase 2

- Localisation du gear icon i18n (fallback string utilisé)
- Mount dans ChatPage (Phase 3 avec MessageItem dispatcher)
- Pre-sélection du type de document dans DocumentUploadDialog basée sur `?upload=CODE` (extension future, dialog accepte juste `open`/`onOpenChange` aujourd'hui)
- Historique des actions exécutives (Phase 5)

## Estimation

- Implémentation : 25 min
- Type-check + lint : 5 min
- Test manuel : 15 min
- Critique + fix : 10 min
- Commit : 2 min
- **Total : ~60 min**
