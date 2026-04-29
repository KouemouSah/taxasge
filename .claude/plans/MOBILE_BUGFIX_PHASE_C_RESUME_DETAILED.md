# PHASE C — Resume from background (DETAILED PLAN)

**Date** : 2026-04-29
**Phase parent** : `MOBILE_BUGFIX_PHASE9_TO_10_MASTER_PLAN.md` §3 Phase C
**Bug couvert** : B6 — m9.jpg "spinner figé" après long background
**Durée estimée** : 0.5j (45 min code + 15 min validation)
**Bloquant pour soft-launch** : OUI (le user a explicitement noté que c'est la friction la plus gênante)

---

## 1. CONTEXTE

L'utilisateur a rapporté : après plusieurs heures avec l'app en background, retourner sur Services / Empresas affiche un spinner indéfini. Force-quit + relance résout. Friction utilisateur majeure.

**Cause technique probable** (vérifiée par lecture du code) :
- `QueryClient` (`packages/mobile/src/app/_layout.tsx:66-75`) : `refetchOnWindowFocus: false`. Pas de `refetchOnReconnect`. Aucun pont entre `AppState`/`NetInfo` et `focusManager`/`onlineManager` de React Query.
- Conséquence : quand le système Android tue les sockets en background (iOS Doze, économie de batterie), React Query ne sait pas que la connexion est cassée. Au retour au premier plan, les requêtes en cours restent en `pending` indéfiniment puisque la TCP est morte mais le client ne le détecte pas.
- Le hook `useNetwork` (`core/hooks/use-network.ts`) écoute `NetInfo` mais expose juste l'état au composant — n'informe **pas** React Query.
- `AppState` est utilisé dans `core/security/app-lock.tsx` (verrou biométrique) mais pas pour signaler `focusManager`.

**Précédents** :
- React Query docs explicit : "On React Native, focus and online managers must be wired manually via `AppState` and `NetInfo`" (https://tanstack.com/query/latest/docs/framework/react/react-native).
- Le bug B6 est l'archétype de ce gap.

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Fichiers à modifier / créer

| Fichier | Type | Rôle |
|---------|------|------|
| `packages/mobile/src/core/api/query-listeners.ts` | **NOUVEAU** | `setupQueryListeners(queryClient)` — branche AppState→focusManager + NetInfo→onlineManager + cold-resume invalidation |
| `packages/mobile/src/app/_layout.tsx` | Edit | (a) `refetchOnReconnect: true` au QueryClient ; (b) appeler `setupQueryListeners` dans `DeferredEffects` |

**Pas d'autre fichier touché**. Surface minimale = risque minimal.

### 2.2 Décisions clés

**D1 — focusManager via AppState**
React Native n'a pas d'événement `window.focus`. On utilise `AppState`. Quand l'app passe `active`, on `focusManager.setFocused(true)` ; sinon `false`. Combiné avec `refetchOnWindowFocus: 'always'`, React Query déclenchera un refetch automatique des queries stale au retour.

**D2 — onlineManager via NetInfo**
`NetInfo.addEventListener` écoute les transitions réseau. On `onlineManager.setOnline(state.isConnected && state.isInternetReachable !== false)`. Quand le réseau revient, React Query reprend les queries en `paused`.

Important : `isInternetReachable` peut être `null` sur certaines conditions (DNS lent, etc.) — on traite `null` comme "ne pas trancher" → on ne baisse pas le flag online uniquement sur ce champ.

**D3 — Cold-resume invalidation**
`refetchOnWindowFocus` ne déclenche un refetch que pour les queries `stale` (>= staleTime). Pour des queries fraîches mais qui dépendent d'un socket cassé, ça ne suffit pas. On ajoute une invalidation explicite si l'app était en background > 5 min.

```ts
const RESUME_THRESHOLD_MS = 5 * 60_000;
const CRITICAL_QUERY_PREFIXES = ['fiscal-services', 'companies', 'directory', 'dashboard', 'service-requests'];
```

Pourquoi 5 min : assez long pour ne pas invalider à chaque switch d'app rapide, assez court pour couvrir les "plusieurs heures" du bug terrain. Réglable.

Pourquoi des prefixes ciblés : on ne veut PAS invalider les queries d'auth (token déjà refresh-managé via interceptor), ni les queries de payment polling (état serveur transactionnel délicat), ni les notifications (poussées via push). On invalide juste les **listings/catalogues** que le user voit en arrivant sur un onglet.

**D4 — `refetchOnWindowFocus: 'always'` vs `true`**
- `true` = refetch quand stale ET focus
- `'always'` = refetch à chaque focus, même si pas stale

Choisi : `'always'` pour les queries critiques (via `meta`) ; `true` (default) pour le reste. **Sécurité** : cela ne s'active QU'au moment où `focusManager.setFocused(true)` après être passé à `false`. Avec `staleTime: 2min`, l'expérience habituelle reste fluide.

Décision : laisser `refetchOnWindowFocus: true` global (la plupart des queries supportent). Si effet de bord → cibler via `meta.refetchOnFocus: 'always'` sur les seuls listings.

**D5 — Cleanup**
La fonction `setupQueryListeners` retourne un `() => void` qui détache tous les listeners. Appelée dans un `useEffect` de `DeferredEffects` qui n'est monté qu'une fois → cleanup au démontage final = jamais déclenché en pratique mais propre par défaut.

### 2.3 Pseudocode

```ts
// core/api/query-listeners.ts
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, type QueryClient } from '@tanstack/react-query';

const RESUME_THRESHOLD_MS = 5 * 60_000;
const CRITICAL_QUERY_PREFIXES = [
  'fiscal-services', 'companies', 'directory', 'dashboard',
  'service-requests', 'bundles', 'documents',
];

export function setupQueryListeners(queryClient: QueryClient): () => void {
  let lastBackgroundedAt: number | null = null;

  const handleAppStateChange = (status: AppStateStatus) => {
    const isActive = status === 'active';
    focusManager.setFocused(isActive);

    if (!isActive) {
      lastBackgroundedAt = Date.now();
      return;
    }
    if (lastBackgroundedAt === null) return;
    const elapsed = Date.now() - lastBackgroundedAt;
    lastBackgroundedAt = null;
    if (elapsed < RESUME_THRESHOLD_MS) return;

    void queryClient.invalidateQueries({
      predicate: (q) => {
        const prefix = String(q.queryKey[0] ?? '');
        return CRITICAL_QUERY_PREFIXES.includes(prefix);
      },
    });
  };

  const appStateSub = AppState.addEventListener('change', handleAppStateChange);

  const netInfoUnsub = NetInfo.addEventListener((state) => {
    const reachable = state.isInternetReachable;
    const online = !!state.isConnected && reachable !== false;
    onlineManager.setOnline(online);
  });

  return () => {
    appStateSub.remove();
    netInfoUnsub();
  };
}
```

```ts
// _layout.tsx (deltas only)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: PERSISTED_MAX_AGE,
      retry: 2,
      refetchOnWindowFocus: true,    // était false
      refetchOnReconnect: true,       // ajouté
    },
  },
});

// DeferredEffects
useEffect(() => {
  return setupQueryListeners(queryClient);
}, []);
```

---

## 3. CHECKLIST ATOMIQUE PHASE C

### C.1 Plan validé ✅
- [x] Plan rédigé et enregistré dans `.claude/plans/`

### C.2 Implementation (~30 min)
- [ ] **C.2.1** Créer `core/api/query-listeners.ts` avec la fonction `setupQueryListeners`
- [ ] **C.2.2** Ajouter export barrel si nécessaire (sinon import direct depuis `_layout.tsx`)
- [ ] **C.2.3** Modifier `_layout.tsx:66-75` : `refetchOnWindowFocus: true`, `refetchOnReconnect: true`
- [ ] **C.2.4** Modifier `_layout.tsx::DeferredEffects` : `useEffect` qui appelle `setupQueryListeners(queryClient)` et retourne le cleanup
- [ ] **C.2.5** Vérifier que les 2 listeners AppState (existant `app-lock.tsx` + nouveau) cohabitent (les deux sont des écouteurs indépendants — pas de conflit)

### C.3 Validation (~10 min)
- [ ] **C.3.1** `npx tsc --noEmit` EXIT=0
- [ ] **C.3.2** `npx eslint src/core/api/query-listeners.ts src/app/_layout.tsx` 0 erreur, 0 warning nouveau
- [ ] **C.3.3** Aucun import non utilisé
- [ ] **C.3.4** Pas de hardcoded — `RESUME_THRESHOLD_MS` et `CRITICAL_QUERY_PREFIXES` sont des constantes module documentées

### C.4 Smoke (manuel, en Phase D groupé)
- [ ] **C.4.1** Cas 1 : app active → background 30s → reactive → pas d'invalidation (cumul < 5min)
- [ ] **C.4.2** Cas 2 : app active → background 6min → reactive → invalidation des queries critiques (Services tab refetch visible)
- [ ] **C.4.3** Cas 3 : app active → mode avion ON → tab Services → mode avion OFF → onlineManager fait reprendre les queries paused
- [ ] **C.4.4** Cas 4 : auth expired ne casse pas le flow (l'interceptor 401 prend le relais)

### C.5 Commit + critique (~5 min)
- [ ] **C.5.1** Commit local : `fix(mobile): query-client — wire AppState/NetInfo to focusManager/onlineManager + cold-resume invalidation (B6 m9)`
- [ ] **C.5.2** Update `MOBILE_BUGFIX_PHASE_C_CRITIQUE.md` (nouveau fichier)
- [ ] **C.5.3** Push **en attente** confirmation utilisateur

---

## 4. CRITÈRES DE VALIDATION (DoD Phase C)

| # | Critère | Méthode | Niveau |
|---|---------|---------|--------|
| V1 | `setupQueryListeners` enregistre 2 subscriptions cleanup-able | revue code | code |
| V2 | `focusManager.setFocused` reçoit `true` sur `'active'`, `false` sinon | revue code | code |
| V3 | `onlineManager.setOnline` reçoit `false` sur `state.isConnected === false` | revue code | code |
| V4 | Cold-resume > 5min déclenche `invalidateQueries` ciblé | revue code + smoke | code + device |
| V5 | Auth queries (`['auth']`) NON invalidées au resume (token interceptor gère) | revue prefix list | code |
| V6 | Payment polling (`['payments']`) NON invalidé (transactionnel) | revue prefix list | code |
| V7 | Coexistence avec `app-lock.tsx::AppState` listener | revue + smoke | code + device |
| V8 | tsc 0 erreur | CI | CI |
| V9 | ESLint 0 nouveau warning | CI | CI |
| V10 | Smoke device "background 6min" — Services refetch | EAS preview | device (Phase D) |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `refetchOnWindowFocus: true` cause beaucoup de refetch sur switch app rapide | MOYENNE | FAIBLE | `staleTime: 2min` borne les refetch à 1× / 2min par query. Si trop bruyant → `refetchOnWindowFocus: 'always'` ciblé via `meta` sur seules les listings. |
| `onlineManager.setOnline(false)` met toutes les queries en `paused` → spinners visibles | FAIBLE | FAIBLE | Comportement souhaité. Quand le réseau revient → reprise auto. |
| Conflit entre les 2 listeners AppState (app-lock + query) | NULL | NULL | API `AppState.addEventListener` permet plusieurs subscribers. Pas de mutation partagée entre eux. |
| `invalidateQueries` en cold-resume cause un flicker UI (skeleton momentané) | MOYENNE | FAIBLE | C'est le UX souhaité — informer le user que les données fraîchissent. Bien pire = afficher des données stale d'il y a 6h. |
| `NetInfo.isInternetReachable` `null` sur conditions ambigües | CERTAINE | NULL | Code traite explicitement `null` comme "ne pas trancher" → ne désactive pas online. |
| Test smoke device impossible (EAS build cassé) | FAIBLE | MOYEN | Code est validable par revue + tsc. Smoke remis en Phase D groupé. |
| Régression sur les workflows non-bundle (Pasaporte, etc.) | NULL | NULL | Pas de toucher au code workflow. Seul le QueryClient est élargi. Tous les workflows utilisent les mêmes hooks → bénéficient du fix. |

---

## 6. ORDRE D'EXÉCUTION

1. **C.2.1** Créer `query-listeners.ts` (~10 min)
2. **C.2.3-4** Modifier `_layout.tsx` (~10 min)
3. **C.3** Validation tsc + ESLint (~5 min)
4. **C.5** Commit + critique (~10 min)

Smoke device repoussé en Phase D groupé (cohérent avec stratégie A/B).

---

## 7. CHANGELOG

- **2026-04-29 v1.0** : créé en démarrage Phase C.
