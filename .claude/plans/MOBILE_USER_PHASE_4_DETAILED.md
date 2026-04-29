# PHASE 4 — Wizard Vault Auto-fill + Readiness Banner (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 2 jours (réduit vs 3-4j initial — scope clarifié post-audit)
**Bloquant pour suite** : Non
**Pré-requis** : Phase 0/1/2/3 ✅
**Inclut** : P2.5 (auto-fill wizard reporté de Phase 2)

---

## 1. CONTEXTE

P4 ne crée PAS un nouveau module. Il **branche** le vault existant (P2) sur le wizard existant (déjà fonctionnel) pour offrir aux utilisateurs un auto-fill "Choisir depuis le coffre" au lieu de re-uploader des documents qu'ils ont déjà.

### 1.1 État backend (audit Explore confirmé 2026-04-27)

| Endpoint | Statut | Comportement clé |
|----------|--------|------------------|
| `POST /wizard-sessions/{id}/documents/use-vault` | ✅ Production-ready | Body `{document_code, vault_document_id}`. Copie extraction_data. **`auto_confirmed = true` UNIQUEMENT si vault confidence ≥ 0.85**, sinon doc reste à confirmer manuellement par l'utilisateur (`needs_correction`). Validation user ownership en BD. |
| `POST /wizard-sessions/{id}/documents/preview` | ✅ Bloque jusqu'à Gemini | Retourne `extraction + confidence + needs_correction`. Synchrone (pas de SSE pour le wizard). |
| `GET /wizard-sessions/{id}` | ✅ | `documents_uploaded: string[]` — **PAS de marker `from_vault`**. Mobile doit tracker localement quels documents viennent du vault. |
| `GET /user-documents/readiness/{workflow_code}` | ✅ Câblé P2 | Retourne pour chaque document_code requis : `{status: ready|expiring|missing, vault_document_id, vault_display_name, days_until_expiry, ...}`. **`vault_document_id` directement utilisable dans le POST use-vault.** |
| `POST /chatbot/analyze-document` | ⚠️ Placeholder backend | Skip pour P4 — pas de production integration. |

### 1.2 État mobile

| Élément | État |
|---------|------|
| `wizardApi.useVaultDocument()` | ✅ Câblé P0 (jamais appelé jusqu'à P4) |
| Module `modules/vault/` | ✅ Livré P2 (hooks `useVaultReadinessForWorkflow`, `useDocumentsForWorkflow` exposés) |
| `step-upload.tsx` existant | ✅ Marche, fait le upload-only flow aujourd'hui |
| `VaultPickerSheet` réutilisable | ❌ À créer (côté vault module pour réutilisation) |
| `ReadinessBanner` sur écran sélection workflow | ❌ À créer |
| Marker visuel "depuis le coffre" sur step-upload | ❌ À créer |

### 1.3 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | Backend ne renvoie pas de marker `from_vault` dans `documents_uploaded`. Mobile doit savoir si un doc vient du vault pour ne pas re-afficher l'upload | Stocker localement (Zustand ou hook ref) la map `{document_code → from_vault: boolean}` après chaque appel use-vault |
| **P2** | use-vault `auto_confirmed` est conditionnel à confidence ≥ 0.85. Si confidence basse, le doc est posté en wizard mais en état "needs_correction" → l'UI doit quand même afficher un step form_review pour validation utilisateur | Pas spécifique à P4 — le wizard gère déjà form_review_X côté UI. Au pire, après use-vault, le user voit un form_review au lieu de skip vers next step. |
| **P3** | Aucune validation backend que `document_code` matche le `document_type` du vault doc | UI doit pre-filtrer `useDocumentsForWorkflow` et n'afficher que les docs **compatibles** avec le code requis. Si user force un mismatch, le backend accepte mais l'extraction sera fausse. |
| **P4** | `useVaultReadinessForWorkflow` est un useQuery — il refresh au mount. Si user upload un nouveau doc dans le wizard puis revient en arrière, la readiness peut être obsolète | Invalidate la query readiness après use-vault et après preview/confirm. |
| **P5** | Banner sur écran `select-workflow` dépend de l'utilisateur déjà authentifié. Si workflow est sélectionné en public mode (avant login), pas de readiness possible | Conditionner l'affichage du banner sur `isAuthenticated` + workflow choisi |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout

```
packages/mobile/
└── src/
    └── modules/
        └── vault/
            └── components/
                ├── vault-picker-sheet.tsx    # NEW — bottom sheet réutilisable
                └── readiness-banner.tsx      # NEW — banner pré-flight workflow
        └── wizard/
            └── components/
                └── step-upload.tsx           # MODIFIED — bouton "Depuis le coffre"
            └── components/
                └── step-selection.tsx        # MODIFIED — réutiliser ReadinessBanner
```

### 2.2 Composant `VaultPickerSheet` (vault module)

```tsx
interface VaultPickerSheetProps {
  visible: boolean;
  workflowCode: string;
  documentCode: string;
  /** Optional vault `document_type` to pre-filter. Defaults to documentCode. */
  documentTypeHint?: string;
  onCancel: () => void;
  onSelect: (vaultDocumentId: string) => void;
}
```

Comportement :
1. Au mount, fetch `useDocumentsForWorkflow(workflowCode)` (filtré côté backend par compatibilité workflow)
2. Render liste filtrée par `document_type === (documentTypeHint ?? documentCode)`
3. Tap doc → `onSelect(doc.id)` + close
4. Empty state si aucun doc compatible → CTA "Aller dans le coffre" qui navigate vers `/documents/upload`

### 2.3 Composant `ReadinessBanner` (vault module)

```tsx
interface ReadinessBannerProps {
  workflowCode: string;
  onPress?: () => void; // Tap to navigate to vault
}
```

Comportement :
1. `useVaultReadinessForWorkflow(workflowCode)` → `{readiness_score, ready, missing, expiring}`
2. Render si `readiness_score < 100` :
   - Card colorée selon score (vert ≥80, ambre 50-79, rouge <50)
   - Titre i18n `"Vous avez X/Y documents prêts dans votre coffre"`
   - Sous-titre i18n détaillant `missing.length` + `expiring.length`
   - Tap → `onPress?.()` ou navigate vers `/documents`
3. Si `readiness_score === 100` : render success banner "Tous vos documents sont prêts"

### 2.4 Modifications `step-upload.tsx`

L'écran upload step actuel a un bouton "Choisir un fichier" classique. P4 ajoute :

1. Hook `useVaultReadinessForWorkflow` pour le workflow courant
2. Si `readiness.ready` contient un doc avec `code === currentDocumentCode` :
   - Affiche un 2e bouton "Depuis le coffre" (libellé i18n + icon `folder-check`)
   - Tap → ouvre `VaultPickerSheet` filtré pour ce document_code
3. Sur `onSelect(vaultDocumentId)` :
   - Mutation `wizardApi.useVaultDocument(sessionId, {document_code, vault_document_id})`
   - On success : `queryClient.invalidateQueries(['wizard-session', sessionId])` + `queryClient.invalidateQueries(['vault', 'readiness', workflowCode])`
   - Toast "Documento del coffre utilizado"
4. Local Zustand store ou `useState` qui marque `documentsFromVault: Set<string>` pour ne pas re-proposer le même doc en upload

### 2.5 Modifications `step-selection.tsx`

L'écran initial du wizard (sélection du workflow) gagne un `<ReadinessBanner>` rendu **après** que l'utilisateur ait cliqué sur un workflow et avant le step suivant. Affiche le score readiness pour anticiper si le wizard se passera bien.

---

## 3. CHECKLIST ATOMIQUE PHASE 4

### 3.1 Composants vault réutilisables

- [x] **4.1.1** Créer `modules/vault/components/vault-picker-sheet.tsx` (commit c731d748 — file packages/mobile/src/modules/vault/components/vault-picker-sheet.tsx)
- [x] **4.1.2** Créer `modules/vault/components/readiness-banner.tsx` (commit c731d748 — file packages/mobile/src/modules/vault/components/readiness-banner.tsx)
- [x] **4.1.3** Exporter les 2 depuis `modules/vault/index.ts` (commit c731d748)
- [x] **4.1.4** Ajouter clés i18n `vault.picker.*` et `vault.readiness.*` dans 3 langues (commit c731d748)

### 3.2 Intégration wizard step-upload

- [x] **4.2.1** Modifier `modules/wizard/components/step-upload.tsx` (commit 716ca2eb — wizard step-upload "From the vault" auto-fill)
- [x] **4.2.2** Ajouter mutation hook (commit 716ca2eb)
- [x] **4.2.3** Tracker localement `documentsFromVault` (commit 716ca2eb)
- [x] **4.2.4** Toast i18n succès / erreur (commit 716ca2eb)

### 3.3 Intégration wizard step-selection (banner)

- [x] **4.3.1** Modifier `modules/wizard/components/step-selection.tsx` pour intégrer `<ReadinessBanner>` (commit d28fa7a0 — wire vault auto-fill into wizard parent screens)
- [x] **4.3.2** Intégration finalisée dans wrapper (commit d28fa7a0)

### 3.4 Validation post-P4 (checklist mémoire #35)

- [x] **4.4.1** `tsc --noEmit` 0 erreur (commits c731d748, 716ca2eb, d28fa7a0)
- [x] **4.4.2** ESLint sous 100 warnings (commit a4a65e61)
- [x] **4.4.3** Grep paths hardcodés hors endpoints.ts → vide (commit 75cb01fb)
- [ ] **4.4.4** Smoke tests staging (3 curl) ⚠️ unverified — needs re-check
- [x] **4.4.5** Vérifier imports/exports `@modules/vault` cohérents (commit c731d748 barrel)
- [x] **4.4.6** Aucune régression wizard P0+P1+P2+P3 (commit 75cb01fb critique)
- [x] **4.4.7** Auto-critique `MOBILE_USER_PHASE_4_CRITIQUE.md` (commit 75cb01fb)
- [x] **4.4.8** Commits sémantiques locaux groupés (c731d748, 716ca2eb, d28fa7a0, 75cb01fb)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 4)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Bouton "Depuis le coffre" visible si vault doc compatible existe | Test device |
| V2 | Tap → sheet filtre les docs vault compatibles avec document_code | Test device |
| V3 | Sélection → POST use-vault → wizard session refresh + extraction copiée | Test device |
| V4 | ReadinessBanner visible sur écran initial wizard si readiness < 100 | Test device |
| V5 | Tap banner → navigue vers vault | Test device |
| V6 | Aucune régression wizard upload classique | Test device |
| V7 | tsc 0 erreur | CI |
| V8 | ESLint sous 100 warnings | CI |
| V9 | Smoke tests staging 3/3 | curl |
| V10 | i18n 3 langues complète | Code review |
| V11 | Auto-critique | Fichier |
| V12 | Commits sémantiques | git log |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Modif step-upload casse le flow upload classique | MOYENNE | HAUT | Modifs additives uniquement (nouveau bouton à côté de l'existant), test smoke wizard pasaporte avant push |
| Mismatch document_code vs vault.document_type → extraction fausse | MOYENNE | MOYEN | Pre-filter strict côté UI ; si user veut quand même → toast warning |
| ReadinessBanner clignote au mount (loading state) | FAIBLE | FAIBLE | Render uniquement après data ready, pas de skeleton aggressive |
| Local `documentsFromVault` perdu au unmount step | FAIBLE | FAIBLE | Si re-mount, le wizard session a `documents_uploaded` qui contient le code → pas grave si on re-affiche le bouton (use-vault est idempotent côté backend) |

---

## 6. NEXT — Après Phase 4

P5 = Payments end-to-end avec BANGE deep links (4-5 jours).

---

## 7. CHANGELOG

- **2026-04-27 v1.0** : création post-audit backend + mobile. Scope réduit vs plan initial (P4 = pure intégration vault↔wizard, le reste OCR/Gemini est déjà fait par le backend).

---
## Validation rétroactive
- **Date** : 2026-04-29
- **Méthode** : audit code + git log
- **Coches livrées rétroactivement** : 13
- **Items unverified** : 1 (smoke tests staging — 3 curl)
- **Items deferred Phase 10** : 0
- **Notes** : Vault picker sheet + readiness banner livrés (`packages/mobile/src/modules/vault/components/{vault-picker-sheet,readiness-banner}.tsx`). Step-upload modifié (716ca2eb). Step-selection wrapper wired (d28fa7a0). Auto-critique 75cb01fb.
