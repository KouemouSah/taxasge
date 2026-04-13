# PHASE 3 — FRONTEND ALIGNMENT (bundle-payment UX + i18n)

**Master plan** : `BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`
**Date** : 2026-04-13
**Priorité** : 🟡 HAUTE — UX actionnable + traductions
**Temps estimé** : ~2.5 h
**Statut** : 🔵 EN COURS (worktree `bundle-debug-phases`)

---

## 1. OBSERVATIONS FRONTEND

### 1.1 État actuel (code inspecté)
- `bundle-workflow-api.ts` : client Axios basique, ne parse pas le body erreur FastAPI.
- `useBundleWizard.ts:466` : `e.message` pris tel quel → `"Request failed with status code 500"`.
- `BundlePaymentStep.tsx:213` : `<AlertDescription>{wizard.error}</AlertDescription>` → affiche le message brut.
- Aucun code-to-i18n mapping.
- Aucun CTA (retry, contact support, back to licence).
- Aucune distinction 5xx (serveur, retry) vs 4xx métier (user action).

### 1.2 Structure du body erreur backend
FastAPI renvoie :
```json
{
  "detail": {
    "code": "BUNDLE_INTEGRITY_ERROR",
    "message_es": "...",
    "message_fr": "...",
    "message_en": "..."
  }
}
```
Accessible via `err.response.data.detail` côté Axios.

### 1.3 Écran (screenshot bundle.png)
- Toast rouge : `"Request failed with status code 500"`
- Pas d'action, pas d'explication, user bloqué.

---

## 2. DESIGN DE LA SOLUTION

### 2.1 Helper générique `extractApiError`
Nouveau fichier `packages/web/src/core/api/error-helpers.ts` :
- `extractApiError(error, locale)` → `{ code: string, message: string, status: number, isNetworkError: boolean, isServerError: boolean, isRetryable: boolean }`
- Utilisable par tous les modules (pas seulement bundle).

### 2.2 Catalog d'erreurs métier avec actions
Nouveau fichier `packages/web/src/modules/bundle-workflow/constants/error-catalog.ts` :
- Map `ERROR_CODE → { title, hint, cta: { type: 'retry'|'back'|'support'|'redirect', label, url? } }`
- Fallback générique pour codes inconnus.

### 2.3 Composant `BundleErrorAlert`
Remplace le `<Alert>` brut dans `BundlePaymentStep` :
- Affiche `title`, `message`, `hint`.
- Rend un `Button` d'action selon le CTA.
- Support des 3 langues.

### 2.4 Updates au hook `useBundleWizard`
- `submitPayment` : au lieu de `setError(e.message)`, stocker `{ code, message }` dans un nouveau state `apiError` (et garder `error: string` pour rétrocompat).
- Ajouter `clearApiError()`, `retryPayment()`.
- Gérer `PAYMENT_ALREADY_IN_PROGRESS` : proposer un lien vers la SR existante (nécessite un nouvel endpoint backend `GET /bundle-workflow/in-flight-payment/:licenseId` OU utiliser un header `X-In-Flight-Request-Id` renvoyé par le backend — hors scope Phase 3, fallback = retry après délai).

### 2.5 Codes d'erreur traités (liste exhaustive)

| Code | HTTP | Title es/fr/en | Hint | CTA |
|---|---|---|---|---|
| `PAYMENT_ALREADY_IN_PROGRESS` | 409 | Paiement en cours / Payment in progress | Une transaction existe déjà | `retry` (5s cooldown) |
| `LICENSE_NOT_FOUND` | 404 | Licence introuvable | — | `back` |
| `LICENSE_SUSPENDED` | 403 | Licence suspendue | Contactez l'administration | `support` |
| `LICENSE_ALREADY_COMPLETE` | 409 | Déjà réglé | Toutes les obligations sont payées | `back` |
| `LICENSE_NOT_PAYABLE` | 422 | Licence non payable | Statut non éligible | `back` |
| `NO_PAYABLE_OBLIGATIONS` | 422 | Aucune obligation | — | `back` |
| `NO_OBLIGATIONS_SELECTED` | 422 | Sélection vide | Mode A: choisir ≥1 | `back` (silent) |
| `OBLIGATION_RACE_CONDITION` | 409 | Obligations verrouillées | Retenté par un autre user | `retry` (3s) |
| `INVALID_PROCESSING_MODE` | 422 | Mode invalide | — | `back` |
| `INVALID_PAYMENT_METHOD` | 422 | Méthode non supportée | — | `back` |
| `PAYMENT_INITIATION_FAILED` | 503 | Passerelle BANGE indisponible | Réessayez plus tard | `retry` |
| `PHONE_REQUIRED` | 422 | Téléphone requis | Format +240... | inline fix |
| `BUNDLE_SR_MISSING_LICENSE_ID` | 500 | Erreur interne | Contactez le support | `support` |
| `BUNDLE_SR_MISSING_FISCAL_YEAR` | 500 | Erreur interne | Contactez le support | `support` |
| `BUNDLE_INTEGRITY_ERROR` | 500 | Erreur d'intégrité | Contactez le support | `support` |
| `DATABASE_CONSTRAINT_VIOLATION` | 500 | Conflit BD | Contactez le support | `support` |
| `NETWORK_ERROR` | — | Pas de connexion | Vérifiez votre réseau | `retry` |
| `UNKNOWN_ERROR` | — | Erreur inattendue | Contactez le support | `retry` + `support` |

### 2.6 Comportement du bouton Pay
- Disabled pendant `isPaymentProcessing` ✅ (déjà en place)
- Double-click protection via `paymentLockRef` ✅ (déjà en place)
- Après erreur : bouton réactivé, toast persistant jusqu'à clearError/retry
- Pour `retry` CTA : relance `submitPayment()`
- Pour `back` CTA : `wizard.goBack()`
- Pour `support` CTA : mailto ou `/dashboard/support` (à déterminer)

---

## 3. CHECKLIST D'IMPLÉMENTATION

### 3.1 — Helper générique
- [ ] Créer `packages/web/src/core/api/error-helpers.ts` avec `extractApiError()`
- [ ] Test unitaire Vitest : mock AxiosError avec différents shapes

### 3.2 — Catalog erreurs bundle
- [ ] Créer `packages/web/src/modules/bundle-workflow/constants/error-catalog.ts`
- [ ] Types + 18 codes × 3 langues

### 3.3 — Composant BundleErrorAlert
- [ ] Créer `packages/web/src/modules/bundle-workflow/components/BundleErrorAlert.tsx`
- [ ] Props : `{ error: ApiError|null, locale, onRetry, onBack, onClear }`
- [ ] Utilise le catalog

### 3.4 — Updates hook useBundleWizard
- [ ] Ajouter state `apiError: ApiError|null`
- [ ] `submitPayment` : catch → `extractApiError` → setApiError
- [ ] `loadObligations` / `loadClassification` : idem
- [ ] Nouveau `clearApiError()` + `retryPayment()`
- [ ] Retourner `apiError`, `clearApiError`, `retryPayment`

### 3.5 — BundlePaymentStep.tsx
- [ ] Remplacer `<Alert>` par `<BundleErrorAlert>`
- [ ] Passer handlers `onRetry={wizard.retryPayment}`, `onBack={wizard.goBack}`
- [ ] Ajouter affichage `title + hint + message`

### 3.6 — BundleObligationsReviewStep + BundleClassification (cohérence)
- [ ] Idem : `<BundleErrorAlert>` pour les erreurs d'étape

### 3.7 — Tests
- [ ] Test unitaire `extractApiError` (structured detail, string detail, network error, no response)
- [ ] Test du catalog (toutes les clés ont 3 traductions)
- [ ] Test du composant BundleErrorAlert (render par code, CTA action)
- [ ] Pas de test E2E Playwright Phase 3 (reporté Phase 5)

### 3.8 — Lint + type check
- [ ] `npm run type-check` sur packages/web
- [ ] `npm run lint` (eslint)

### 3.9 — Auto-critique
- [ ] Vérifier que tous les codes backend sont couverts
- [ ] Vérifier que l'UX bloque bien le bouton pendant retry
- [ ] Vérifier que le retry n'oublie pas le payment_lock_ref
- [ ] Vérifier qu'aucun hardcode anglais n'est ajouté (toujours passer par le catalog)

### 3.10 — Commit local
- [ ] `feat(bundle-payment-ui): actionable errors + i18n catalog + extract helper`

---

## 4. NON-GOALS PHASE 3

- E2E Playwright test (Phase 5)
- Refactor global des autres modules (out of scope — ce helper est réutilisable mais on ne propage pas)
- Modifications backend (Phase 1/4 déjà faites)
- Nouvelles routes API (`in-flight-payment/:licenseId`) — nice-to-have pour PAYMENT_ALREADY_IN_PROGRESS, reporté

---

## 5. RISQUES

### R-P3-1 : apiClient intercepteur 401 peut avaler l'erreur
Le refresh token interceptor retourne `Promise.reject(error)` pour les non-401. Mon `extractApiError` doit gérer les cas où `error.response` est undefined.

### R-P3-2 : i18n duplication
J'introduis un catalog `error-catalog.ts` en parallèle du système i18n existant (`messages/{es,fr,en}.json`). Alternative : utiliser `next-intl` avec clés `bundle.errors.PAYMENT_ALREADY_IN_PROGRESS.title`. Plus propre mais plus de touch dans les JSON. **Décision** : catalog colocalisé car les codes sont spécifiques à bundle et le core i18n n'a pas de convention d'erreurs métier. Si Phase 4+ veut migrer ça au i18n central, ce sera trivial (clés identiques).

### R-P3-3 : Tests Vitest non configurés pour packages/web
Vérifier avec `npm test` avant. Fallback : tests minimum type-check only, E2E reporté.

---

## 6. ORDRE D'EXÉCUTION

1. Vérifier la structure de tests du frontend (existence Vitest/Jest)
2. Créer `extractApiError` helper + test
3. Créer `error-catalog.ts`
4. Créer `BundleErrorAlert.tsx`
5. Modifier `useBundleWizard.ts`
6. Modifier `BundlePaymentStep.tsx` + 2 autres steps
7. Type-check + lint
8. Auto-critique
9. Commit local
