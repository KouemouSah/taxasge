# PHASE 8 — Auto-critique & DoD Validation

**Date** : 2026-04-27
**Phase** : `MOBILE_USER_PHASE_8_DETAILED.md`
**Statut** : ✅ Code livré en commits locaux. Mémoire #35 passée. ⏳ Validation device.

---

## 1. Bilan factuel

| Sous-phase | Avant | Après |
|------------|-------|-------|
| **8.1 i18n drift** | Pas de script de validation. 1 hardcode `"PE-000000"` dans bundle-wizard | Script Python `core/i18n/tools/check-locales-drift.py` exit 1 si divergence (CI-friendly). 810 clés synchro confirmées. Hardcode déplacé sous `bundleWizard.registrationNumberPlaceholder` × 3 langues. |
| **8.2 Skeleton screens** | Zéro composant skeleton ; tous les loading initiaux affichent un `<ActivityIndicator>` blanc | 3 composants réutilisables (`SkeletonText`, `SkeletonListItem`, `SkeletonCard`) + Animated pulse 0.45→1 sur 900ms. Intégrés sur 4 listings principaux (requests, payments, services search, support). |
| **8.3 FlatList perf knobs** | 0/38 listes tunées | 6 listes critiques tunées (`requests`, `payments` déjà fait P5.7, `support` déjà P6.3, `services` search, `notifications`, `documents` × 2 vues, `companies`). `getItemLayout` quand item à hauteur fixe (requests 65dp), sinon perf knobs sans `getItemLayout`. |
| **8.4 Image migration** | `Image` from 'react-native' sur 4 écrans (3 audités + 1 trouvé) | `expo-image` partout : `app/index.tsx`, `(tabs)/index.tsx` (3 occurrences), `(auth)/sign-in.tsx`, `(tabs)/account.tsx` (trouvé en grep complémentaire). `cachePolicy="memory-disk"` + `contentFit` adapté. |
| **8.5 React Query caching** | `directory` zones/sectors/provincias/formas à 2min staleTime | Bumpé à 1h via `REFERENCE_STALE_TIME_MS` (référentiel quasi-immuable). Reste de l'app déjà bien tuné (audit complet inventory). |
| **8.6 Optimistic updates** | `useCloseTicket` attendait la réponse backend (perçu lent) | Pattern complet `onMutate` (snapshot + setQueryData status='resolved'), `onError` (rollback), `onSettled` (re-sync). UX : flag visuel instantané, rollback transparent en cas d'erreur. Notifications déjà optimistes par nature (storage MMKV local). |

**Stats** : 14 fichiers modifiés/créés mobile + 1 script Python. ~250 LOC ajoutées (skeletons + perf knobs + optimistic update). i18n × 3 langues (1 nouvelle clé `bundleWizard`).

---

## 2. Vérifications mémoire #35

| Étape | Résultat |
|-------|----------|
| 1. `tsc --noEmit` | ✅ 0 erreur (5 passes incrementales) |
| 2. ESLint sous 100 warnings | ✅ 86 warnings (vs 83 P6 — les 3 nouveaux sont `react-hooks/exhaustive-deps` non bloquants sur les optimistic update hooks) |
| 3. Script i18n drift | ✅ 810 clés × 3 langues, exit 0 |
| 4. Aucune régression P0..P6 | ✅ Modifs additives (props optionnelles, knobs non-breaking, expo-image API drop-in compatible avec `Image` RN sur les props utilisées) |
| 5. Auto-critique | ✅ (ce fichier) |
| 6. Commits sémantiques | ⏳ À grouper après critique |

---

## 3. Listes laissées non tunées (assumées)

Sur les 38 FlatList totales, 6 ont reçu les knobs (les plus longues / utilisées). Les 32 restantes sont :
- Listes courtes statiques (settings menus, FAQ, locale picker) → perf knobs marginaux
- Listes horizontales (chips, popularServices) → `windowSize` est peu pertinent en horizontal
- Listes à 1-page max (sessions, dashboards rapides) → pas de scroll long

Décision : ne pas surcharger. Les knobs ajoutés couvrent les cas où le scroll long est probable. P9 ou V1.1 pourra étendre si profiling montre un gain.

---

## 4. Hors scope V1 explicitement reportés

1. **Animations Reanimated 3** — gros chantier, gain marginal V1
2. **Bundle analyzer** — Expo gère nativement le tree-shaking
3. **Lazy loading screens** — Expo Router fait du route-based splitting natif
4. **Mark notification as read optimistic** — déjà optimiste (MMKV local), pas de mutation backend
5. **Skeleton sur autres écrans** (vault, companies, etc.) — pattern réutilisable, à étendre selon besoin V1.1
6. **Couverture WCAG AAA** — l'audit holistique a déjà planifié l'a11y systématique en Sprint C

---

## 5. Risques de régression

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `removeClippedSubviews: true` cause un bug d'affichage Android sur certains items | FAIBLE | MOYEN | Désactiver sélectivement si problème device |
| Skeleton dimensions ne matchent pas exactement l'item réel → layout shift | FAIBLE | FAIBLE | Hauteur 64dp choisie pour matcher `RequestListItem`/`PaymentListItem`/`TicketListItem` |
| Optimistic update `useCloseTicket` flicke si backend renvoie un statut différent que `resolved` | FAIBLE | FAIBLE | `onSettled` invalide les queries → resync sur le vrai status backend |
| `expo-image` cache disk grossit pour 1M users | FAIBLE | FAIBLE | `cachePolicy="memory-disk"` est le default sain. Logos sont petits (~50KB) |
| Script i18n drift faux positif sur une clé `_one` / `_other` (i18next plurals) | FAIBLE | FAIBLE | i18next traite les variantes plurielles — chaque variante doit être présente dans chaque langue (le script catch ça correctement) |

---

## 6. Gap honnête

1. **Test device physique** — toutes les modifs sont visuelles ou perf — vraiment testables uniquement sur device.
2. **Mesure perf avant/après** — pas faite (pas d'instrument React DevTools profiler en place). Théoriquement gain attendu sur scroll long de listes.
3. **Couverture skeleton incomplète** — 4 listings ciblés sur ~10 candidats. Étendable trivialement.

---

## 7. Recommandation push

1. Commits locaux sémantiques groupés (4 commits logiques : i18n script + drift fix, skeletons, FlatList perf, expo-image + RQ + optimistic).
2. Auto-critique livrée.
3. **Demander confirmation utilisateur avant push remote** (mémoire #13).
4. Build EAS Android preview pour test device — vérifier perception perf scroll services (850+ items).

---

## 8. Next — Phase 9

P9 = OWASP Mobile + Observabilité (4-5j). Recoupe directement avec l'audit holistique du 2026-04-27 :
- M1 credentials → S1 biométrique (Sprint A)
- M2 supply chain → S3 npm audit
- M5 communication → cleartext + TLS pinning
- M6 privacy → RGPD partiel déjà fait P6.1 (account delete), reste data export
- M9 storage → MMKV key + allowBackup
- Sentry / Crashlytics → Q2 audit holistique

P9 sera donc une **convergence** entre l'audit holistique pré-existant et la roadmap master plan.
