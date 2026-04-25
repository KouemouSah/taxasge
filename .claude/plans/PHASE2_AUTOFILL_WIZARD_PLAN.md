# Phase 2 — Auto-fill Wizard avec Documents du Vault

> **Statut** : EN COURS
> **Date** : 2026-04-25
> **Prerequis** : Phase 1 (dedup) complete

---

## 1. ANALYSE DE L'EXISTANT

### Ce qui existe
| Element | Etat |
|---------|------|
| `VaultDocumentPicker` composant | OK mais JAMAIS utilise dans le wizard (prop `onSelectFromVault` jamais passe) |
| `DocumentUploader` accepte `onSelectFromVault` prop | OK mais JAMAIS connecte |
| `readiness/{workflow_code}` endpoint | OK retourne ready/missing/expiring |
| `auto_import_from_wizard()` | OK importe docs apres soumission |
| Wizard session `preview_document()` | Requiert File upload (pas vault ID) |
| Wizard session `confirm_document()` | Confirme extraction (pas vault selection) |

### GAPS
| # | Gap | Impact |
|---|-----|--------|
| G1 | DocumentUploader dans les 2 wizards NE PASSE PAS `onSelectFromVault` | Bouton "From Vault" invisible |
| G2 | Pas d'endpoint backend pour "selectionner un doc vault" dans wizard | Impossible de confirmer un vault doc sans re-upload |
| G3 | Pas d'auto-detection docs vault au chargement du step | Utilisateur doit manuellement chercher |
| G4 | readiness endpoint ne retourne pas vault_document_id | Frontend ne sait pas quel doc utiliser |

---

## 2. ARCHITECTURE PHASE 2

### Flux APRES (Phase 2)
```
Wizard Step "Documents" charge :
  1. Frontend appelle GET /readiness/{workflow_code}
  2. Pour chaque doc requis avec vault match :
     → Badge inline "Encontrado en cofre" + nom du doc
     → Bouton "Usar" pour confirmer / "Reemplazar" pour upload
  3. Si utilisateur clique "Usar" :
     → POST /wizard-sessions/{id}/documents/use-vault
       body: { document_code, vault_document_id }
     → Backend: copie extraction_data depuis vault, marque comme uploaded
     → Pas de re-upload Firebase
  4. Si utilisateur clique "Reemplazar" :
     → Flux normal upload + preview
  5. Bouton "From Vault" reste disponible pour recherche manuelle
```

### Separation responsabilites
- **readiness endpoint** : enrichi pour retourner vault_document_id par doc
- **use-vault endpoint** : nouveau, confirme un doc vault dans le wizard
- **Frontend** : auto-detection au chargement + inline UX (pas dialog)

---

## 3. SOUS-TACHES

### 2A. Backend : enrichir readiness avec vault_document_id

**Fichier** : `user_documents_routes.py` (_compute_readiness helper)
- Pour chaque doc "ready" ou "expiring", inclure `vault_document_id`
- Retourner aussi `file_name`, `display_name`, `expiry_date`

### 2B. Backend : nouveau endpoint use-vault dans wizard session

**Fichier** : `wizard_session_service.py`
**Route** : `POST /wizard-sessions/{session_id}/documents/use-vault`

```python
Body: { document_code: str, vault_document_id: UUID }
```

Logique:
1. Valider que vault_document_id appartient au user
2. Lire le document du vault (file_path, extraction_data, etc.)
3. Stocker dans la session comme si le doc avait ete uploade :
   - content_b64: NON (pas de re-download)
   - file_path: du vault (pour persist)
   - extraction: copie de user_documents.extraction_data
   - confidence: copie de extraction_confidence
   - doc_hash: copie de file_hash
   - vault_document_id: reference pour persist (skip Firebase)
4. Retourner la session mise a jour

### 2C. Backend : wizard persist reconnait les docs vault

**Fichier** : `wizard_session_service.py` (_persist_session_data)
- Si doc_data a `vault_document_id` (pas content_b64) :
  - Skip Firebase upload
  - Utiliser file_path du vault
  - Creer service_request_documents avec source='vault_reuse'

### 2D. Frontend : connecter onSelectFromVault dans les 2 wizards

**Fichier 1** : `wizard/session/[sessionId]/page.tsx`
**Fichier 2** : `service-requests/[id]/wizard/page.tsx`

- Passer `onSelectFromVault` et `workflowCode` au DocumentUploader
- Implementer handler qui appelle use-vault endpoint

### 2E. Frontend : auto-detection au chargement du step documents

**Fichier** : `wizard/session/[sessionId]/page.tsx`

Au chargement du step `document_upload` :
1. Appeler readiness endpoint
2. Pour chaque doc trouvé dans vault :
   - Afficher badge inline "Encontrado en cofre" sous le DocumentUploader
   - Bouton compact "Usar este documento" (inline, pas dialog)
3. Auto-select si tous les docs vault sont presents (opt-in)

### 2F. Frontend : wizard-session-api.ts nouvel endpoint

**Fichier** : `wizard-session-api.ts`
- Nouvelle methode `useVaultDocument(sessionId, documentCode, vaultDocumentId)`

---

## 4. CHECKLIST

### 2A. Readiness enrichi
- [ ] vault_document_id retourne pour docs ready/expiring
- [ ] display_name, file_name, expiry_date inclus
- [ ] Test : readiness pour PASAPORTE avec DIP en vault

### 2B. Endpoint use-vault
- [ ] POST /wizard-sessions/{id}/documents/use-vault cree
- [ ] Validation ownership vault doc
- [ ] Extraction data copiee dans session
- [ ] Session mise a jour (documentsUploaded, documentsCount)
- [ ] Test : use-vault avec doc existant

### 2C. Persist vault docs
- [ ] Skip Firebase pour docs avec vault_document_id
- [ ] source='vault_reuse' dans service_request_documents
- [ ] file_hash propage
- [ ] Test : persist avec vault doc → verifier pas de nouveau Firebase

### 2D. Frontend connection
- [ ] onSelectFromVault passe dans session wizard
- [ ] onSelectFromVault passe dans legacy wizard
- [ ] workflowCode passe
- [ ] Handler appelle use-vault endpoint
- [ ] Test : bouton "From Vault" visible

### 2E. Auto-detection
- [ ] Readiness appele au chargement step documents
- [ ] Badge inline pour docs trouves
- [ ] Bouton "Usar" inline
- [ ] Gestion doc expire (pas d'auto-select)
- [ ] Test : step documents avec docs vault → badges affiches

### 2F. API frontend
- [ ] useVaultDocument() methode ajoutee
- [ ] Test : appel reussit

---

## 5. ORDRE D'IMPLEMENTATION

1. **2A** (15 min) — enrichir readiness
2. **2B** (30 min) — endpoint use-vault
3. **2F** (10 min) — API frontend
4. **2C** (15 min) — persist vault docs
5. **2D** (20 min) — connecter onSelectFromVault
6. **2E** (30 min) — auto-detection UX
7. **Tests** (20 min)
