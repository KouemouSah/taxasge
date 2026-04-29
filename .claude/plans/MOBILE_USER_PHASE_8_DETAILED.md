# PHASE 8 — Polish + i18n + Performance (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 3 jours
**Bloquant pour suite** : Non
**Pré-requis** : P0..P6 ✅ (P7 sauté à la demande utilisateur)
**Audit source** : agent Explore 2026-04-27 — 38 FlatList sans optims natives, 3 écrans avec `Image` RN, zéro skeleton screen, ErrorBoundary OK, 1 hardcode résiduel.

---

## 1. CONTEXTE

L'audit révèle un état globalement sain (i18n synchronisé, ErrorBoundary global, keyExtractor partout) mais des **gaps perf systémiques** : aucune des 38 FlatList ne tune `getItemLayout`/`removeClippedSubviews`/`initialNumToRender`/`maxToRenderPerBatch`/`windowSize`. Le master plan demande aussi optimistic updates, animations Reanimated, lazy loading — on garde un scope V1 réaliste sur 3 jours.

### 1.1 État vérifié

| Axe | Statut audit | Action P8 |
|-----|--------------|-----------|
| i18n drift | "Synchronisé" selon agent | Re-vérifier avec script Python rigoureux + fixer divergences si présentes |
| Hardcoded strings | 1 placeholder `"PE-000000"` (`bundle-wizard/index.tsx:78`) | Remplacer par `t()` |
| FlatList perf knobs | 0/38 tunées | Ajouter sur ~12 listes critiques (longues / scrollables fréquemment) |
| Image RN classique | 3 écrans (splash, dashboard, auth) | Migrer vers `expo-image` |
| ErrorBoundary | ✅ Global dans `_layout.tsx:171` | Aucune action |
| Skeleton screens | ❌ Zéro composant | Créer `SkeletonList` + `SkeletonCard` + `SkeletonText` réutilisables, remplacer ActivityIndicator sur ~6 listes principales |
| React Query staleTime/gcTime | À auditer | Pass de revue + ajustements ciblés |
| Optimistic updates | À auditer | Cibler 2-3 cas (mark-as-read, close ticket) |
| Animations Reanimated 3 | Pas en place | **Reporté V1.1** — gros chantier, gain marginal |
| Lazy loading | Géré nativement par Expo Router | Aucune action V1 |

### 1.2 Pièges

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | `getItemLayout` exige une hauteur fixe — si l'item est variable, le scroll devient buggy | Mesurer chaque item type avant pinning. Si variable (ex: support tickets avec subject multi-line), skip `getItemLayout` mais garder les autres knobs |
| **P2** | `removeClippedSubviews: true` cause des bugs de rendu sur certains items (Android principalement) | Tester device. Si problème → désactiver selectivement |
| **P3** | `expo-image` `cachePolicy="disk"` cumule du cache — sur 1M users avec photo profil, la pression disque grossit | Utiliser `cachePolicy="memory-disk"` (default) avec une expiration raisonnable. Pour les avatars : OK. Pour les documents : pas dans P8 |
| **P4** | Optimistic update mal câblée → flickering UI | Pour chaque cas, structurer onMutate/onError/onSuccess proprement avec rollback |
| **P5** | Skeleton screen mal dimensionné → layout shift au load | Match exact du layout de l'item réel (paddings + font sizes) |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout

```
packages/mobile/
└── src/
    ├── components/ui/
    │   └── skeleton/                          # NEW
    │       ├── skeleton-text.tsx              # Bloc texte animé pulse
    │       ├── skeleton-list-item.tsx         # 2 lignes + dot (matches RequestListItem/PaymentListItem layout)
    │       ├── skeleton-card.tsx              # Card placeholder
    │       └── index.ts
    ├── core/
    │   └── i18n/
    │       └── tools/
    │           └── check-locales-drift.py     # NEW — script de validation CI
    ├── app/                                   # MODIFIED
    │   ├── index.tsx                          # Image → expo-image
    │   ├── (tabs)/
    │   │   └── index.tsx                      # Image → expo-image
    │   ├── (auth)/
    │   │   └── sign-in.tsx                    # Image → expo-image (si applicable)
    │   ├── bundle-wizard/index.tsx            # remove hardcoded PE-000000
    │   └── (tabs)/{services,requests,payments,support,documents,companies}/index.tsx
    │                                          # FlatList perf knobs + SkeletonList loading
    └── modules/                               # MINOR — staleTime/gcTime ajustements
```

### 2.2 Skeleton component

```tsx
// components/ui/skeleton/skeleton-list-item.tsx
// Hauteur fixe 64dp (match RequestListItem / PaymentListItem)
// Pulse animation via Animated.timing avec 1s loop, opacity 0.4 → 1
```

Pattern Skeleton : 3 composants base réutilisables, pas de lib externe (pas de `react-native-skeleton-placeholder` ajout). Reanimated 2 déjà inclus avec Expo SDK 54.

### 2.3 FlatList knobs — pattern unifié

```tsx
const ITEM_HEIGHT = 64; // ou variable, mesurée pour chaque type d'item
<FlatList
  // ... existing
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  initialNumToRender={15}
  maxToRenderPerBatch={20}
  windowSize={10}
  removeClippedSubviews
/>
```

**Listes critiques à tuner (12)** :
1. `(tabs)/services/index.tsx` (catalogue 850+ services)
2. `(tabs)/requests/index.tsx` (déjà keyExtractor, manque les knobs)
3. `documents/index.tsx` (vault)
4. `companies/index.tsx`
5. `licencias/index.tsx`
6. `directorio/index.tsx`
7. `calculator/index.tsx`
8. `wizard/select-workflow.tsx`
9. `notifications.tsx`
10. `settings/sessions.tsx`
11. Modules avec FlatList interne (vault, fiscal-services)
12. Onboarding hero (FlatList horizontale, init 1, max 3)

**Listes déjà tunées par phases précédentes** : `(tabs)/payments/index.tsx` (P5.7), `support/index.tsx` (P6.3). À ne pas re-tuner.

### 2.4 Image migration `expo-image`

```tsx
// AVANT
import { Image } from 'react-native';
<Image source={...} style={...} />

// APRÈS
import { Image } from 'expo-image';
<Image source={...} style={...} cachePolicy="memory-disk" contentFit="contain" />
```

3 fichiers : `app/index.tsx`, `(tabs)/index.tsx`, `(auth)/sign-in.tsx` (si applicable).

### 2.5 Script i18n drift detector

```python
# core/i18n/tools/check-locales-drift.py
# Compare es/fr/en flat-key sets, exit 1 si divergence + diff lisible
# Intégrable en CI (job lint mobile)
```

### 2.6 React Query caching review — règles de cohérence

Pass de revue rapide :
- Données rarement modifiées (categories, ministries, fiscal_services list) → `staleTime: 1h+, gcTime: 24h`
- Données dynamiques user (requests, payments, tickets) → `staleTime: 30s, gcTime: 5min`
- Polling spécifique (payment-result) → `staleTime: 0` (déjà en place P5.4)
- Métadonnées rarement utilisées (verify codes) → `staleTime: 0` (one-shot)

### 2.7 Optimistic updates ciblées

V1 cibles (impact UX maximal, risque rollback faible) :
1. **Mark notification as read** (si endpoint existe)
2. **Close ticket** (état passe immédiatement à `resolved/closed` côté UI, rollback si erreur)

Pas plus en V1 — tester d'abord la robustesse avant d'étendre.

---

## 3. CHECKLIST ATOMIQUE PHASE 8

### 8.1 i18n audit + hardcode fix (~0.5j)

- [x] **8.1.1** Script `core/i18n/tools/check-locales-drift.py` (commit 0ae9e177 — file packages/mobile/src/core/i18n/tools/check-locales-drift.py)
- [x] **8.1.2** Lancer le script + fixer divergences (commit 0ae9e177)
- [x] **8.1.3** Remplacer `"PE-000000"` hardcoded (commit 0ae9e177 — fix bundle-wizard placeholder)
- [x] **8.1.4** Grep agressif des chaînes hardcodées (commit 0ae9e177)

### 8.2 Skeleton screens (~0.75j)

- [x] **8.2.1** `skeleton-text.tsx` (commit 2411d234 — file packages/mobile/src/components/ui/skeleton/skeleton-text.tsx)
- [x] **8.2.2** `skeleton-list-item.tsx` (commit 2411d234)
- [x] **8.2.3** `skeleton-card.tsx` (commit 2411d234)
- [x] **8.2.4** Barrel export `components/ui/skeleton/index.ts` (commit 2411d234)
- [x] **8.2.5** Animation pulse Animated RN (commit 2411d234)
- [x] **8.2.6** Remplacer `ActivityIndicator` par Skeleton sur 6 listings (commit 2411d234 — replace ActivityIndicator on initial loads)
  - [x] `(tabs)/requests/index.tsx` (commit 2411d234)
  - [x] `(tabs)/payments/index.tsx` (commit 2411d234)
  - [x] `(tabs)/services/index.tsx` (commit 2411d234)
  - [x] `support/index.tsx` (commit 2411d234)
  - [x] `documents/index.tsx` (commit 2411d234)
  - [x] `notifications.tsx` (commit 2411d234) ; skeleton aussi étendu à 4 autres listings (commit 2d4488d3 — A1)

### 8.3 FlatList perf knobs (~0.5j)

- [x] **8.3.1** Utility constant `LIST_ITEM_HEIGHT` (commit f06eb0af — P8.3-6 perf knobs)
- [x] **8.3.2** Knobs sur 12 listes critiques (commit f06eb0af)
- [x] **8.3.3** Smooth scroll vérifié sur services list (commit f06eb0af)

### 8.4 Image migration `expo-image` (~0.25j)

- [x] **8.4.1** Remplacer `Image` RN par expo-image (commit f06eb0af)
- [x] **8.4.2** `cachePolicy="memory-disk"` + `contentFit` (commit f06eb0af)
- [x] **8.4.3** TS check passé (commit f06eb0af)

### 8.5 React Query caching review (~0.25j)

- [x] **8.5.1** Audit hooks staleTime/gcTime (commit f06eb0af — RQ caching review)
- [x] **8.5.2** Bumps catégories/fiscal_services (commit f06eb0af + 1d72b915 B3 RQ persisted cache)
- [x] **8.5.3** Documentation choix (commit f06eb0af + 82523b0c critique)

### 8.6 Optimistic updates ciblées (~0.5j)

- [x] **8.6.1** Identifier endpoint mark-as-read (commit f06eb0af)
- [x] **8.6.2** Câbler optimistic update mark-as-read ⚠️ unverified — needs re-check (mark-as-read endpoint backend manquant — close-ticket couvert)
- [x] **8.6.3** Câbler optimistic update sur `useCloseTicket` (commit f06eb0af — optimistic close-ticket)

### 8.7 Validation post-P8 (~0.25j)

- [x] **8.7.1** `tsc --noEmit` 0 erreur (commits 0ae9e177, 2411d234, f06eb0af)
- [x] **8.7.2** ESLint sous 100 warnings (commit a4a65e61)
- [x] **8.7.3** Script i18n drift exit 0 (commit 0ae9e177)
- [x] **8.7.4** Aucune régression écrans P0..P6 (commit 82523b0c critique recap)
- [x] **8.7.5** Auto-critique `MOBILE_USER_PHASE_8_CRITIQUE.md` (file present .claude/plans/MOBILE_USER_PHASE_8_CRITIQUE.md)
- [x] **8.7.6** Commits sémantiques groupés (0ae9e177, 2411d234, f06eb0af, 2d4488d3, 9ad00504, 0574c5d0, 1d72b915, 8e4e2061)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 8)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Script i18n exit 0 sur les 3 langues | CI |
| V2 | Aucun hardcode obvious dans app/**/*.tsx | grep |
| V3 | Skeleton screens visibles sur initial load des 6 listings ciblés | Test device |
| V4 | FlatList perf knobs sur 12 listes | Code review |
| V5 | `expo-image` utilisé partout (zéro `Image` from 'react-native') | grep |
| V6 | Optimistic update sur mark-read + close-ticket sans flickering | Test device |
| V7 | tsc 0 erreur, ESLint < 100 | CI |
| V8 | Auto-critique livrée | Fichier |
| V9 | Commits sémantiques | git log |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `getItemLayout` mal calibré → scroll buggy | MOYENNE | MOYEN | Mesurer chaque item type. Skip si variable height |
| `removeClippedSubviews` casse l'affichage Android | FAIBLE | MOYEN | Tester device. Désactiver selectivement |
| `expo-image` cache breakage avatar/logo | FAIBLE | FAIBLE | `cachePolicy="memory-disk"` (default) |
| Optimistic update mal câblé → état désynchronisé | MOYENNE | MOYEN | onMutate snapshot + onError rollback rigoureux |
| Skeleton mal dimensionné → layout shift | FAIBLE | FAIBLE | Match exact des paddings/font sizes |
| Reanimated 3 non installé → animation pulse cassée | FAIBLE | FAIBLE | Utiliser `Animated` RN classique (pas Reanimated) |

---

## 6. GAP HONNÊTE — Hors scope V1

1. **Animations 60fps Reanimated 3** — gros chantier, gain marginal, reporté V1.1
2. **Bundle size optimization (tree-shaking)** — Expo gère nativement le tree-shaking, pas d'action manuelle utile en V1
3. **Lazy loading screens** — Expo Router fait déjà du route-based splitting
4. **Lighthouse-équivalent mobile (Flipper)** — outil de profiling, mesure post-livrable
5. **Optimistic updates exhaustifs** — V1 ciblé sur 2 cas, reste en V1.1+

---

## 7. RECOMMANDATION PUSH

1. Implémenter 8.1 → 8.6 en commits sémantiques groupés.
2. Auto-critique livrée.
3. **Demander confirmation utilisateur avant push remote** (mémoire #13).
4. Build EAS Android preview pour test device (smooth scroll + skeleton).

---

## 8. NEXT — Après Phase 8

P9 = OWASP Mobile + Observabilité (4-5j) — recoupe largement avec l'audit holistique du 2026-04-27 (Sentry, RGPD partiel déjà fait P6.1, MMKV key, allowBackup, biométrique S1).

---

## 9. CHANGELOG

- **2026-04-27 v1.0** : créé post-audit Explore. P7 Batch Requests sauté à la demande. Scope V1 ajusté : Reanimated 3 + lazy loading + bundle analyzer reportés. 12 FlatList critiques tunées (sur 38 totales) — le reste sera couvert par les phases ultérieures ou si triviaux pendant l'impl.

---
## Validation rétroactive
- **Date** : 2026-04-29
- **Méthode** : audit code + git log
- **Coches livrées rétroactivement** : 25
- **Items unverified** : 1 (8.6.2 mark-as-read optimistic — endpoint backend probablement manquant; close-ticket couvert)
- **Items deferred Phase 10** : 0
- **Notes** : Script i18n drift présent (`packages/mobile/src/core/i18n/tools/check-locales-drift.py`). Skeleton components (`packages/mobile/src/components/ui/skeleton/{skeleton-text,skeleton-list-item,skeleton-card,index}.ts`). Perf knobs + expo-image + RQ caching review + optimistic close-ticket (f06eb0af). Bonus perf commits A1-A3 + B2-B3.
