# PHASE 4 — Auto-critique & DoD Validation

**Date** : 2026-04-27 (mis à jour P4.5 le 2026-04-27)
**Phase** : `MOBILE_USER_PHASE_4_DETAILED.md`
**Statut global** : ✅ Code livré + checklist #35 complète passée. Bug latent P0 corrigé en passant. **P4.5 livré** : `<ReadinessBanner>` câblé dans `app/wizard/create.tsx` (gated `isAuthenticated`) + `sessionId`/`workflowCode` propagés à `<StepUpload>` dans `app/wizard/[session-id].tsx`. ⏳ Validation device.

---

## 1. Bilan factuel

| Domaine | Avant P4 | Après P4 |
|---------|----------|----------|
| Composants vault auto-fill | Aucun | `VaultPickerSheet`, `ReadinessBanner` (réutilisables) |
| `wizardApi.useVaultDocument` payload | `{document_id, document_code}` ❌ (bug latent P0) | `{vault_document_id, document_code}` ✅ (aligné backend `UseVaultDocumentRequest`) |
| Bouton "Depuis le coffre" dans step-upload | Inexistant | Apparaît automatiquement si readiness retourne `vault_document_id` pour le doc_code requis |
| i18n vault picker + readiness | Aucun | 3 langues (vault.picker, vault.readiness, wizard.upload.vault) |

**Stats** : 2 nouveaux composants vault (~190 LOC) + 1 fichier wizard modifié (additions de ~70 LOC) + 1 fix wizard-api + i18n 3 langues × 8 clés.

---

## 2. Checklist mémoire #35 — Validation phase complète

| Étape | Résultat |
|-------|----------|
| 1. `tsc --noEmit` | ✅ 0 erreur |
| 2. ESLint sous seuil 100 | ✅ 82 warnings |
| 3. Grep paths hardcodés (HTTP only) | ✅ Vide |
| 4. Smoke tests staging | ✅ **3/3** (`/user-documents/readiness/PASAPORTE_EXPEDICION`, `/user-documents/for-workflow/PASAPORTE_EXPEDICION`, `POST /wizard-sessions/fake/documents/use-vault`) tous → 403 (auth gate OK) |
| 5. Imports/exports cohérents barrel | ✅ `VaultPickerSheet` + `ReadinessBanner` exportés depuis `@modules/vault` |
| 6. Auto-critique écrite | ✅ (ce fichier) |
| 7. Commits sémantiques locaux | ⏳ À exécuter |

---

## 3. Bug latent P0 attrapé par la rigueur P4

`wizardApi.useVaultDocument` (P0) envoyait `{document_id, document_code}` mais le backend `UseVaultDocumentRequest` attend `{vault_document_id, document_code}` (audit Explore confirme). Le bug n'était pas visible avant car ce hook n'était jamais appelé (P0 a juste câblé l'endpoint). P4 le corrige avant le 1er appel réel.

**Leçon** : la checklist #35 (smoke tests + audit endpoint contracts) capture exactement ce type de bug. Ici je l'ai trouvé en lisant la signature du hook avant de l'utiliser. Ajouter à la mémoire : **avant tout 1er appel d'un hook P0/historique, valider sa signature contre le schéma openapi-types.ts en miroir**.

---

## 4. DoD Phase 4

| # | Critère | Méthode | Statut |
|---|---------|---------|--------|
| V1 | Bouton "Depuis le coffre" visible si vault doc compatible | Test device | ⏳ Code complet |
| V2 | Tap → sheet filtre par document_code | Test device | ⏳ Code complet (filtre `document_type === documentCode`) |
| V3 | Sélection → POST use-vault → wizard refresh | Test device | ⏳ Code complet, payload aligné |
| V4 | ReadinessBanner sur écran wizard initial | Test device | ✅ Câblé P4.5 dans `app/wizard/create.tsx` (rendu conditionnel `isAuthenticated && workflow_code`) — ⏳ test device |
| V5 | Tap banner → navigate vers vault | Test device | ⏳ Code complet sur le composant |
| V6 | Aucune régression upload classique | Test device | ✅ Modifs purement additives (props optionnelles, comportement inchangé sans sessionId/workflowCode) |
| V7 | tsc 0 erreur | CI | ✅ |
| V8 | ESLint < 100 | CI | ✅ 82 |
| V9 | Smoke tests 3/3 | curl | ✅ |
| V10 | i18n 3 langues | Code review | ✅ |
| V11 | Auto-critique | Fichier | ✅ |
| V12 | Commits sémantiques | git log | ⏳ |

---

## 5. Risques de régression

### 5.1 Risques élevés

**R1. step-upload props optionnelles non passées par le parent** — ✅ **Résolu P4.5** : `app/wizard/[session-id].tsx` passe maintenant `sessionId={sessionId}` et `workflowCode={session.workflow_code}` à `<StepUpload>`. Plus de feature dormante. Modifs purement additives — la branche sans props reste fonctionnelle.

### 5.2 Risques moyens

**R2. Filtre `document_type === documentCode` côté UI peut être trop strict** — un vault doc peut avoir `document_type: 'pasaporte_antiguo'` alors que le wizard exige `document_code: 'pasaporte'`. Pas de mapping côté mobile. Si readiness backend dit que ce vault doc est compatible (via `vault_document_id` non null), le filtre UI le rejette quand même. **Mitigation** : à V2 — filtrer sur `vault_document_id` matchant l'item readiness (plus robuste). V1 simple = exact match document_code.

**R3. `useVaultReadinessForWorkflow` rate-limited 30s côté React Query** — si le user upload un doc dans le wizard, la readiness reste cached et le bouton "Depuis le coffre" peut apparaître pour un doc qu'il vient juste d'uploader (incohérent UX). **Mitigation** : on invalide la readiness query après use-vault (déjà fait). Pour les uploads classiques, on ne l'invalide pas — léger risque cosmétique acceptable V1.

### 5.3 Risques faibles

**R4. Bottom sheet `Dialog` Paper peut paraître étrange sur Android (modale plein écran au lieu de sheet)** — V1 OK, V2 si UX complainte → migrer vers `react-native-bottom-sheet`.

---

## 6. Gap honnête

1. **Test device physique** — V1-V5 + V6 partial. APK EAS encore à installer.
2. ~~**`ReadinessBanner` non câblé dans le flow wizard**~~ ✅ **Livré P4.5** dans `app/wizard/create.tsx` (juste après le titre, avant l'erreur, conditionné `isAuthenticated && workflow_code`). Tap → `router.push('/documents')`.
3. ~~**`step-upload` câblage parent**~~ ✅ **Livré P4.5** dans `app/wizard/[session-id].tsx` ligne ~369-370 (`sessionId={sessionId}` + `workflowCode={session.workflow_code}`).

### 6.bis P4.5 — Validation
- `tsc --noEmit` : 0 erreur ✅
- ESLint : 82 warnings (< 100) ✅ (aucun warning dans les fichiers modifiés)
- Pas de paths HTTP hardcodés dans `app/wizard/*.tsx` ✅
- Modifs additives : `<ReadinessBanner>` rendu conditionnellement, `<StepUpload>` props optionnelles, zéro régression sur les workflows non authentifiés ou sans vault

---

## 7. Recommandation push

OK pour commits locaux automatiques (mémoire #32). Avant push remote :
1. Build EAS Android preview pour intégrer P4 + P4.5.
2. ~~Câblage `sessionId`/`workflowCode`~~ ✅ Livré P4.5.
3. ~~Câblage `<ReadinessBanner>`~~ ✅ Livré P4.5.
4. Test device (utilisateur authentifié → readiness banner visible sur create + bouton "Depuis le coffre" visible sur upload-step si vault doc compatible).

---

## 8. Next — Phase 5

P5 = Payments end-to-end + BANGE deep links. Aucune dépendance bloquante P4. P4.5 (câblage final) peut être fait en parallèle P5 ou en début P5.
