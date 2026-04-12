# Phase 1 — Plan détaillé : Fix "Démarrer la démarche" + Wizard deep-link

## Objectif
Débloquer le path manuel non-IA pour lancer une démarche directement depuis l'onglet "Préparation" de `Mes Documents`, et rendre les liens backend `/dashboard/service-requests/new?workflow=X` réellement fonctionnels.

## Bugs ciblés (2/7)
- **Bug 2** : `ReadinessCheck.tsx:221-226` — bouton "Démarrer la démarche" sans `onClick`
- **Bug 4** : `service-requests/new/page.tsx` — aucun `useSearchParams`, `?workflow=X` silencieusement ignoré (émis 3× par backend)

## Architecture de la solution

### Principe
Le backend et ReadinessCheck émettent déjà l'URL correcte `/dashboard/service-requests/new?workflow=CODE`. Le seul gap est le **reader** côté page `new`. On implémente ce reader + on ajoute le `onClick` manquant dans ReadinessCheck. Pas de nouvelle route, pas de nouvelle API.

### Flow after fix
```
User → Mes Documents → Préparation tab → [Démarrer la démarche] (card ready)
                                             ↓ onClick
                                             ↓ router.push(/dashboard/service-requests/new?workflow=PASAPORTE_NUEVO)
                                             ↓
                                   NewServiceRequestPage mounts
                                             ↓
                                   useEffect reads ?workflow=PASAPORTE_NUEVO
                                             ↓ guard ref check (ran once?)
                                             ↓ startNewRequest(PASAPORTE_NUEVO) [existant, line 241]
                                             ↓
                                   /dashboard/service-requests/wizard/session/{sessionId}
```

### Guards (robustesse)
1. **useRef `hasStartedRef`** : empêche re-déclenchement sur re-render ou back-button
2. **Validation code non-vide** : si `?workflow=` est vide/invalide → fall-through vers la grille catégories (comportement actuel)
3. **Validation workflow existe** (optionnelle, Phase 1.1 si temps) : si `workflows` est chargé ET que `code` n'existe pas dans la liste → fallback gracieux
4. **isStarting flag existant** : empêche double call à `startNewRequest` (déjà en place)

## Fichiers modifiés

### F1. `packages/web/src/modules/user-documents/components/ReadinessCheck.tsx`

**Changement 1 — imports (après ligne 15)**
```typescript
import { useRouter } from 'next/navigation';
```
(`useLocale` déjà importé à la ligne 15)

**Changement 2 — `ReadinessCard` component (ligne 136)**
Ajouter `const router = useRouter();` après `const locale = useLocale();`

**Changement 3 — Button "Démarrer la démarche" (lignes 221-226)**
```typescript
{result.can_start && (
  <Button
    variant="outline"
    size="sm"
    className="flex-1 text-xs"
    onClick={() => {
      router.push(`/${locale}/dashboard/service-requests/new?workflow=${result.workflow_code}`);
    }}
  >
    {t('readiness.startProcedure')}
    <ArrowRight className="ml-1 h-3 w-3" />
  </Button>
)}
```

**Changement 4 — QUICK_WORKFLOWS buttons (lignes 291-303)**
Actuellement : routent vers `/dashboard/chat?q=...` (chat + message préremplì → déclenche loop permission).
Nouveau : deux boutons par workflow ? Non, pour rester simple et minimiser le changement : **garder l'intent actuel** (Assistant chat) car c'est une section "lancement assisté" avec description "L'asistente carga sus documentos y pre-rellena...". 

**DÉCISION** : ne pas toucher QUICK_WORKFLOWS dans Phase 1. Cela concerne l'intent "préparer avec l'assistant" qui est correct dans le contexte de la section "Iniciar un tramite". Le fix est ailleurs (Phase 3 quand le chat pourra réellement activer le permis).

→ **Seul le bouton "Démarrer la démarche" des readiness cards est modifié dans cette phase.**

**Changement 5 — ReadinessCard ne re-render pas sur chaque router change**
Le composant fetch via react-query (`useQuery` ligne 263-272) avec `staleTime: 60_000`. L'ajout de `useRouter()` dans `ReadinessCard` est safe : `router` est stable (référence).

### F2. `packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/new/page.tsx`

**Changement 1 — imports (ligne 9-10)**
```typescript
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
```

**Changement 2 — hook dans component (après ligne 153)**
```typescript
const searchParams = useSearchParams()
const hasAutoStartedRef = useRef(false)
```

**Changement 3 — useEffect auto-start (après `loadData` useEffect, ligne 176)**
```typescript
// Auto-start wizard if ?workflow=CODE is present in URL
// Source: ReadinessCheck "Démarrer la démarche" button, chatbot backend actions
useEffect(() => {
  if (hasAutoStartedRef.current) return
  const prefilledWorkflow = searchParams.get('workflow')
  if (!prefilledWorkflow) return
  hasAutoStartedRef.current = true
  // Fire-and-forget : startNewRequest handles loading state + navigation
  startNewRequest(prefilledWorkflow)
}, [searchParams])
```

**Note importante** : `startNewRequest` est déclarée ligne 241 mais utilisée dans le useEffect. En React/TS strict, il faut vérifier que la déclaration est accessible. En JS, les function declarations sont hoisted mais ici c'est une `const async () => {...}`, donc PAS hoisted. 

**Solution** : déplacer le useEffect APRÈS la déclaration de `startNewRequest` (après ligne 283) OU utiliser une ref. **Option la plus propre** : placer le useEffect juste avant le `return` (ligne 313) mais après `startNewRequest`.

**Changement 3 corrigé — useEffect placement**
Placer le useEffect entre `categoriesWithWorkflows` (ligne 311) et `return` (ligne 313).

**Changement 4 — guard contre auto-start après retour arrière**
`hasAutoStartedRef` persiste pour la vie du composant. Si user navigue ailleurs puis revient avec le même `?workflow=...`, le composant remount → ref reset → re-déclenche. C'est le comportement voulu pour back-button (mais pas pour bouton browser back qui garde l'URL).

**Risk** : si `isStarting` état existant est `true` quand `startNewRequest` est déjà en cours, le second call sera no-op (existing guard ligne 242). OK.

**Changement 5 — nettoyer l'URL après auto-start (optionnel)**
Pour éviter la re-trigger sur refresh : `router.replace(`/${locale}/dashboard/service-requests/new`, { scroll: false })` après le call. Mais `startNewRequest` navigate déjà ailleurs, donc ce n'est pas nécessaire. Skip.

## Tests

### Type-check
```bash
cd packages/web && npm run type-check
```
Attendu : 0 erreurs (zero new warnings).

### Lint
```bash
cd packages/web && npm run lint
```
Attendu : 0 erreurs sur les 2 fichiers modifiés.

### Test E2E manuel (Chrome DevTools MCP)
1. Login comme user citoyen
2. Aller à `/dashboard/documents`
3. Cliquer onglet Préparation
4. Cliquer "Démarrer la démarche" sur une card `can_start: true`
5. **Vérifier** : landing sur `/dashboard/service-requests/wizard/session/{sessionId}` direct
6. Retour arrière → retour sur onglet Préparation (pas de loop)
7. Visiter directement `/dashboard/service-requests/new?workflow=PASAPORTE_NUEVO`
8. **Vérifier** : skip la grille catégories, démarre la session wizard direct
9. Visiter `/dashboard/service-requests/new?workflow=INVALID_CODE`
10. **Vérifier** : pas de crash, la page affiche soit la grille catégories, soit une erreur gracieuse (toast)

### Test E2E non régression
1. Aller à `/dashboard/service-requests/new` (sans query)
2. **Vérifier** : grille catégories s'affiche (comportement actuel)
3. Cliquer un workflow dans la grille
4. **Vérifier** : démarre la session comme avant

## Checklist Phase 1

- [x] `ReadinessCheck.tsx` : import `useRouter` ajouté
- [x] `ReadinessCheck.tsx` : `const router = useRouter()` dans `ReadinessCard`
- [x] `ReadinessCheck.tsx` : onClick ajouté sur "Démarrer la démarche" avec `router.push` et template literal correct
- [x] `new/page.tsx` : imports `useRef`, `useSearchParams`
- [x] `new/page.tsx` : `useRef` guard + `useSearchParams` lecture
- [x] `new/page.tsx` : useEffect placé APRÈS `startNewRequest` (hoisting OK, ligne 320)
- [x] `new/page.tsx` : auto-start valide, ne boucle pas, fallback gracieux si code absent
- [x] Type-check passe (0 new errors) — `tsc --noEmit` EXIT=0
- [x] Lint passe (0 new errors) — `eslint` EXIT=0
- [ ] Test E2E manuel : Démarrer la démarche → wizard direct (à valider en staging/dev par user)
- [ ] Test E2E manuel : URL deep-link `?workflow=CODE` → wizard direct (idem)
- [ ] Test E2E manuel : URL deep-link invalid code → fallback gracieux (idem)
- [ ] Test non-régression : grille catégories sans query fonctionne toujours (idem)
- [x] Critique post-implémentation : `encodeURIComponent` côté emit + `searchParams.get` auto-decode OK ; `useRef` prévient double-fire ; useEffect placé après déclaration de `startNewRequest` (pas de hoisting needed car fonction arrow) ; eslint-disable sur exhaustive-deps standard pour event-like effects
- [ ] Commit local (pas de push sans validation globale) — à faire après validation user

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| `useRouter()` hook error si pas dans client component | `ReadinessCheck.tsx` ligne 13 a déjà `'use client'` ✅ |
| `useSearchParams()` nécessite Suspense boundary en Next 15 | `new/page.tsx` a déjà `'use client'` ligne 1 ✅. Next 14 ne requiert pas Suspense. |
| Re-render infini du useEffect | `useRef` guard + dépendance sur `searchParams` (stable ref) |
| `startNewRequest` pas hoisted dans useEffect | Placer useEffect après sa déclaration |
| Backend emet `/dashboard/service-requests/new?workflow=` avec code workflow qui n'existe plus | `startNewRequest` crée une session via API — si le code est invalide, API rejettera et `setIsStarting(false)` reset l'état. Gracieux. |
| Toast error si creation session échoue | Déjà géré ligne 278 `console.error` — mais pas de toast UI. Non-blocking pour cette phase. |

## Ce qui N'EST PAS dans Phase 1

- QUICK_WORKFLOWS buttons : pas de changement (contexte "lancement assisté")
- Localisation des messages backend : Phase 3
- Mount AgentSettingsPanel : Phase 2
- Nettoyage `?upload=CODE` dans DocumentVault : Phase 2

## Estimation

- Implémentation : 15 min
- Type-check + lint : 5 min
- Test E2E : 10 min
- Critique + fix : 5 min
- Commit : 2 min
- **Total : ~40 min**
