# Rétro — Phase 4 : Alignement Mobile Inspector ↔ Backend P1+P2+P3

**Date** : 2026-04-11
**Plan** : `.claude/plans/INSPECTION_BUNDLE_P4_DETAIL.md`
**Statut** : ✅ DONE (commit local, pas push)

---

## Bilan chiffré

| Métrique | Valeur |
|----------|--------|
| Fichiers code modifiés | 8 (types, client, inspections-api, inspections-hooks, verify.tsx, create.tsx, payment.tsx, obligation-list.tsx, errors.ts) |
| Fichiers code nouveaux | 1 (`core/api/idempotency.ts`) |
| TypeScript errors | **0** |
| ESLint errors introduites | **0** (5 errors restantes pre-existantes, hors scope P4) |
| ESLint erreur P4 corrigée | 1 (payment.tsx `rules-of-hooks` — réorganisation hooks/early return) |
| **Alignement P3 backend** | **Complet** |

---

## Ce qui a bien marché

1. **Pas d'offline** (décision utilisateur) — scope divisé par 2, P4 terminée en ~30 min au lieu de 3j. Zero compromission de fiabilité financière.
2. **Infrastructure existante** : `NetworkBanner`, `useNetwork`, `check_rate_limit` côté backend, `apiClient` interceptors Axios déjà en place. Juste à étendre.
3. **`apiPost` signature backward-compatible** : param `options` optionnel → 0 breaking change sur les appelants existants.
4. **Idempotency-Key via `useRef(generateIdempotencyKey())`** : pattern propre, stable pendant la vie du screen, régénéré à unmount/remount.
5. **Error handlers granulaires 403/429** : distinction claire entre "hors scope" vs "rate limited" vs "generic" avec i18n fallback.
6. **Hard block `/collect` offline** (user decision + expert concur) : pas de queue locale = pas de sync raté. L'agent doit attendre le réseau.
7. **Retry axios automatique conditionné** : GET ou `Idempotency-Key` header présent uniquement. POST mutations sans clé = pas de retry (safety).
8. **Supervisor screens déjà alignés** — 0 dev. P4.G no-op. `pending-seals`, `reconciliation`, `agents`, `missions`, `analytics` existent avec bons hooks.

---

## Découvertes / surprises

### Infrastructure déjà existante (bonus)
- `NetworkBanner` component existait déjà dans `components/ui/` et était intégré dans `_layout.tsx`. **0 dev nécessaire pour P4.F**.
- `useNetwork` hook existait déjà dans `core/hooks/`.
- `@react-native-community/netinfo` déjà installé.
- Supervisor screens (pending-seals, reconciliation, agents, missions, analytics) déjà créés en P6 polish précédent.

### Lint pre-existants (hors scope)
5 erreurs `react-hooks/rules-of-hooks` dans `complete.tsx`, `med.tsx`, `seal.tsx`, `seal-review.tsx`. Pattern : `useCallback` appelé après `if (isLoading) return <LoadingScreen />`. **Pre-existant depuis commit P6 polish** (`a6dcc709`). Non corrigés ici — hors scope P4. Ils étaient déjà présents quand le CI P3 passait donc soit le CI les tolère, soit le lint en CI est plus permissif.

**Je n'ai PAS corrigé les 4 fichiers pre-existants** car :
1. Hors scope P4 (l'utilisateur veut focus alignement P1/P2/P3)
2. Le CI des phases précédentes passait avec ces erreurs
3. Correction nécessiterait de réorganiser chacun individuellement

**P4 correction** sur `payment.tsx` uniquement — car j'avais shifté les lignes et ça flag (déplacement de `handleSubmit useCallback` avant le early return).

---

## Ce qui n'a pas été fait (reporté)

| Item | Raison | Suite |
|------|--------|-------|
| Tests manuels sur simulator Android | Pas de simulator actif dans la session — à faire avant push P5 | P5 |
| Build APK dev via EAS | Infrastructure cloud, non testable localement | P5 |
| Fix 4 autres `rules-of-hooks` pre-existants | Hors scope P4 (concerne complete/med/seal/seal-review) | P5 ou hotfix séparé |
| i18n clés complètes (fr/es/en) pour nouvelles strings | Utilisation `defaultValue` en fallback (fonctionnel mais perfectible) | P5 ou hotfix i18n |

---

## Risques résiduels

1. **i18n clés manquantes** : j'utilise `t('verify.existingDossier')`, `t('verify.pendingPayment')`, `t('verify.pendingPaymentHint')`, `t('verify.collectible')`, `t('verify.outOfScope')`, `t('verify.restrictedHint')`, `t('collect.errorOutOfScope')`, `t('collect.errorRateLimit')`, `t('collect.offlineBlock')`. Les `defaultValue` fournis assurent que l'UI ne sera pas vide, mais l'expérience en prod sera partiellement en anglais tant que les traductions es/fr ne sont pas ajoutées.
2. **Retry automatique d'idempotent GET** : peut causer un léger latence supplémentaire (2x) en cas de network blip. Backoff 500ms+1500ms = 2s max.
3. **`Crypto.randomUUID()` fallback** : si la plateforme ne supporte pas randomUUID (très rare en SDK 54+), fallback `Math.random()` — moins cryptographique mais suffisant comme clé de déduplication.
4. **5 lint errors pre-existantes** dans le code mobile : à corriger en P5 hotfix si le CI remote les flag comme bloquants (à observer lors du push).
5. **Mobile UI non testée en prod simulator** : je me suis basé sur TS + lint. Les tests visuels manquent.

---

## Prochaine étape

**P5** — Observabilité + audit trail bundle + load test 100+ agents :
- Métriques Prometheus (`collect_field_payment_total`, `idempotency_replay_total`, `collect_forbidden_total`, `cleanup_skipped_bundle_total`)
- Locust load test scenario 100 agents parallèles
- Audit trail légal étendu (license_compliance_events)
- Mobile tests E2E (Detox/Maestro)
- Fix 4 lint errors pre-existants si bloquants
- i18n hotfix fr/es pour les nouvelles clés P4

**Avant P5** : validation utilisateur du commit local P4 + push éventuel.
