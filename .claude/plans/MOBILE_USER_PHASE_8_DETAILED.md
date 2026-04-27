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

- [ ] **8.1.1** Script `core/i18n/tools/check-locales-drift.py` qui compare es/fr/en flat-key sets et exit non-zero si divergence
- [ ] **8.1.2** Lancer le script — si divergence détectée, fixer (en règle générale ajouter les clés manquantes en se basant sur es.json comme source)
- [ ] **8.1.3** Remplacer `"PE-000000"` hardcoded dans `bundle-wizard/index.tsx:78` par `t('bundleWizard.licenseNumberPlaceholder')` + clés × 3
- [ ] **8.1.4** Grep agressif des chaînes hardcodées Spanish/English dans `app/**/*.tsx` — fixer les ≤5 plus visibles

### 8.2 Skeleton screens (~0.75j)

- [ ] **8.2.1** Créer `components/ui/skeleton/skeleton-text.tsx` (bloc rectangulaire pulse, prop width/height)
- [ ] **8.2.2** Créer `components/ui/skeleton/skeleton-list-item.tsx` (matches list-item layout 64dp)
- [ ] **8.2.3** Créer `components/ui/skeleton/skeleton-card.tsx` (matches Card layout)
- [ ] **8.2.4** Barrel export `components/ui/skeleton/index.ts`
- [ ] **8.2.5** Animation pulse via Animated React Native (pas reanimated, simple loop)
- [ ] **8.2.6** Remplacer `ActivityIndicator` initial loading par `SkeletonList × 8` sur :
  - `(tabs)/requests/index.tsx`
  - `(tabs)/payments/index.tsx`
  - `(tabs)/services/index.tsx`
  - `support/index.tsx`
  - `documents/index.tsx`
  - `notifications.tsx`

### 8.3 FlatList perf knobs (~0.5j)

- [ ] **8.3.1** Utility constant `LIST_ITEM_HEIGHT = 64` exporté depuis `components/ui/list-item-height.ts` (ou inline par fichier si variable)
- [ ] **8.3.2** Ajouter knobs sur les 12 listes critiques (bullet de la section 2.3). Si l'item est variable-height, skip `getItemLayout` mais garder les autres
- [ ] **8.3.3** Vérifier le scroll sur device ne régresse pas (tester smooth scroll sur services list — 850+ items)

### 8.4 Image migration `expo-image` (~0.25j)

- [ ] **8.4.1** Remplacer `Image` RN par `Image` expo-image dans `app/index.tsx`, `(tabs)/index.tsx`, `(auth)/sign-in.tsx` (et tout autre cas trouvé via grep)
- [ ] **8.4.2** Ajouter `cachePolicy="memory-disk"` + `contentFit` adaptés
- [ ] **8.4.3** TS check passé

### 8.5 React Query caching review (~0.25j)

- [ ] **8.5.1** Audit en lisant chaque hook `useXxx` dans modules — vérifier `staleTime`/`gcTime` cohérents
- [ ] **8.5.2** Bumper si pertinent (categories, fiscal_services list, etc. à 1h+)
- [ ] **8.5.3** Documenter les choix dans le commit message

### 8.6 Optimistic updates ciblées (~0.5j)

- [ ] **8.6.1** Identifier l'endpoint de mark notification as read (vérifier backend)
- [ ] **8.6.2** Câbler optimistic update sur ce hook (onMutate snapshot + rollback onError)
- [ ] **8.6.3** Câbler optimistic update sur `useCloseTicket` (status passe à `resolved` côté UI immédiatement)

### 8.7 Validation post-P8 (~0.25j)

- [ ] **8.7.1** `tsc --noEmit` 0 erreur
- [ ] **8.7.2** ESLint sous 100 warnings
- [ ] **8.7.3** Script i18n drift exit 0
- [ ] **8.7.4** Aucune régression écrans P0..P6
- [ ] **8.7.5** Auto-critique `MOBILE_USER_PHASE_8_CRITIQUE.md`
- [ ] **8.7.6** Commits sémantiques groupés

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
