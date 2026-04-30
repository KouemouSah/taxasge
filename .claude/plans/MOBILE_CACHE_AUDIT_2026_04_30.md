# Mobile — Audit cache & propositions d'optimisation

**Date** : 2026-04-30
**Contexte** : User signale temps de chargement long à chaque relance/coupure réseau, demande si le cache mémoire est en place.

---

## 1. État actuel — l'infrastructure cache EXISTE déjà

L'app utilise **PersistQueryClientProvider** (`@tanstack/react-query-persist-client`) avec un persister AsyncStorage. Configuration dans `packages/mobile/src/app/_layout.tsx:67-118` :

| Composant | Valeur | Effet |
|-----------|--------|-------|
| `staleTime` (default) | 2 min | Pas de refetch sous 2 min |
| `gcTime` (default) | 24 h | Le cache survit 24h en mémoire |
| `staleTime` catalogues | 24 h | Ministries / categories / popular / commerce-types — pas de refetch sous 24h |
| `staleTime` popular services | 6 h | Listing populaire un peu plus frais |
| `placeholderData: keepPreviousData` | ✅ tous catalogues | UI ne flash pas quand re-fetch |
| `refetchOnWindowFocus` | true | Refetch au foreground |
| `refetchOnReconnect` | true | Refetch quand réseau revient |
| Persister storage | AsyncStorage | Cache disque, survit aux relances |
| Persister maxAge | 24 h | Cache disque expire après 24h |
| Persister buster | `'v1'` | Bump = invalide tout |
| Whitelist persistance | `fiscal-services`, `workflows`, `directory`, `bundles`, `support-categories` | Seules ces queries sont persistées (sécurité) |
| Prefetch boot | 4 catalogues (ministries, categories, commerce-types, zones) à T+3s | Données disponibles avant que l'user clique |
| Resume invalidation | > 5 min de background → invalidate `fiscal-services`, `companies`, `directory`, `dashboard`, `service-requests`, `bundles`, `documents` | Pas de stale data après long sleep |
| AppState → focusManager | ✅ via `setupQueryListeners()` | Refetch on foreground |
| NetInfo → onlineManager | ✅ | Pause queries offline, resume online |

**Conclusion** : le cache existe et est plutôt bien pensé. Le user a raison qu'il y a un délai, mais ce n'est pas l'absence de cache — c'est la **lenteur d'hydratation d'AsyncStorage** au cold start.

---

## 2. Pourquoi le user perçoit un "temps de chargement très long"

### Hypothèse 1 (probable) — AsyncStorage hydratation lente sur Android bas de gamme

`createAsyncStoragePersister` lit le cache de manière **asynchrone** depuis SQLite (AsyncStorage Android = SQLite). Sur les devices bas de gamme avec stockage saturé, cette lecture peut prendre **500ms à 2s**. Pendant ce temps :
- Le `<PersistQueryClientProvider>` n'a pas encore hydraté le cache
- Les écrans qui mountent voient des queries en `pending` state
- `isLoading: true` → l'UI affiche un `ActivityIndicator` (ex. `services/index.tsx:432-433`)

L'app se comporte comme si le cache n'existait pas pendant cette fenêtre.

### Hypothèse 2 — Pas de gate `useIsRestoring()` sur les écrans

`@tanstack/react-query-persist-client` expose un hook `useIsRestoring()` qui dit `true` tant que la cache est en cours d'hydratation. Aucun écran ne l'utilise actuellement (grep `useIsRestoring` → 0 résultat). Conséquence : pendant la rehydratation, les écrans déclenchent des fetch réseau redondants au lieu d'attendre le cache.

### Hypothèse 3 — Skeleton vs ActivityIndicator

`SkeletonListItem` existe (`@components/ui/skeleton`) et est utilisé sur certains écrans (services, payments, requests). Mais d'autres écrans (services tab ministries, dashboard partial, calculator) montrent un `ActivityIndicator` blanc qui est perçu comme "il ne se passe rien". Skeleton donne l'impression de progression.

### Hypothèse 4 (réseau) — refetchOnReconnect bloque l'UI

`refetchOnReconnect: true` global. Quand le réseau revient après une coupure, **toutes** les queries marquées stale refetch. Si l'écran n'a pas `placeholderData`, l'UI affiche son loader. Sur 3G/LTE patchy, refetch lent → loader long.

---

## 3. Recommandations classées par ROI

### P1 — Migrer le persister AsyncStorage → MMKV (HIGH IMPACT, LOW RISK)

**Bénéfice** : hydratation cache de ~500-2000ms → <50ms (synchrone). Le cache devient quasi instantané au cold start.

**Pourquoi facile** : MMKV est **déjà** installé (`packages/mobile/src/core/storage/mmkv.ts`). Il suffit de :
1. Remplacer `createAsyncStoragePersister` par `createSyncStoragePersister`
2. Adapter MMKV à l'interface Storage attendue (`getItem`/`setItem`/`removeItem` synchrones)
3. Garder la clé dédiée `facil:rq-cache:v1`

**Risque** : MMKV a une limite de payload pratique (~2MB total recommandé). On a déjà un cap implicite à 1MB via `serialize`. À surveiller mais OK pour notre whitelist (catalogues qui font typiquement < 200KB).

```ts
// AVANT (_layout.tsx:104-110)
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'facil:rq-cache:v1',
});

// APRÈS
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { storage as mmkv } from '@core/storage/mmkv';

const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: (key) => mmkv.delete(key),
  },
  key: 'facil:rq-cache:v1',
});
```

### P2 — Gate `useIsRestoring()` sur les écrans à fort traffic (MEDIUM IMPACT)

Ajouter un check sur dashboard, services, directory, companies :

```tsx
import { useIsRestoring } from '@tanstack/react-query-persist-client';

const isRestoring = useIsRestoring();
if (isRestoring) return <FullScreenSkeleton />;  // empêche les fetch redondants
```

Bénéfice : pendant l'hydratation, on affiche un skeleton stable plutôt qu'une bouillie de loaders.

### P3 — Étendre la whitelist de persistance

Ajouter `dashboard` et `service-requests` (récents) à `PERSISTED_QUERY_PREFIXES`. Risque sécurité : `service-requests` est user-scoped, mais il est déjà filtré côté backend par `target_role`. Bénéfice : le dashboard re-render instant + liste récente disponible offline.

**Attention** : si on ajoute `service-requests`, il faut **invalider la persistence au logout**. Vérifier que `auth-provider.tsx` appelle `queryClient.clear()` au signOut. Sinon, faire fix.

### P4 — Skeleton partout au lieu d'ActivityIndicator

`(tabs)/services/index.tsx:432-433` montre un `ActivityIndicator` pour ministries → remplacer par 4-6 `SkeletonListItem` dans une grille horizontale. Plus rapide perçu.

### P5 — Bouton "Réessayer" visible sur erreur réseau

Le pattern `m9.jpg fix` (cloud-off-outline + retry) existe déjà sur services tab — propager à directory, companies/index, dashboard.

---

## 4. Plan de mise en œuvre proposé

| Phase | Scope | Effort | Risque |
|-------|-------|--------|--------|
| **C1 — MMKV persister** | 1 fichier (`_layout.tsx`) + nouveau `query-persister.ts` | 30 min | Faible |
| **C2 — `useIsRestoring` gate** | 4-5 écrans clés + composant `<FullScreenSkeleton>` | 1h | Faible |
| **C3 — Whitelist + clear on logout** | `_layout.tsx` + audit `auth-provider.tsx` | 30 min | Moyen (vérifier logout flow) |
| **C4 — Skeleton ActivityIndicator → SkeletonListItem** | 3 écrans | 30 min | Nul |
| **C5 — Validation** | tsc / ESLint / push EAS preview | 30 min | — |

Total : ~3h, validation device après push EAS preview.

---

## 5. Sentry — investigation des erreurs réseau

User mentionne avoir "des problèmes de connexion sur l'application depuis ce matin". Sans accès au MCP Sentry dans cette session (à recharger via relance Claude Code, cf. `SENTRY_MCP_SETUP.md`), pistes côté code :

- `core/api/client.ts` : axios interceptors avec retry sur 401 (refresh token)
- Pas de retry custom sur 5xx → React Query default `retry: 2`
- Timeout : à vérifier dans le client axios

Si Sentry confirme un pic d'erreurs réseau côté backend ce matin, le fix cache n'élimine pas la cause mais MASQUE le problème (l'user voit le cache plutôt qu'une erreur). À faire en parallèle d'un audit infra backend.

---

## 6. Décision attendue

User doit choisir :
1. **Implémenter C1 (MMKV persister) maintenant** — gros gain UX, faible risque, scope serré
2. **Implémenter C1+C2** — plus complet, ~1h30
3. **Tout (C1-C5)** — ~3h, livrable polish complet
4. **Documenter et reporter à Phase 10** — prioriser autres bugs d'abord

Je recommande **option 2 (C1+C2)** : élimine le bug perçu, sans toucher à la logique métier. C3+C4 peuvent attendre Phase 10 polish.

---

## 7. Changelog

- **2026-04-30 v1.0** : audit créé après question utilisateur sur le cache mobile.
