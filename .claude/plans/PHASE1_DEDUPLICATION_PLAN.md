# Phase 1 — Deduplication Stricte par Contenu SHA-256

> **Statut** : EN COURS
> **Date** : 2026-04-25
> **Prerequis** : Analyse BD + code terminee

---

## 1. ANALYSE CRITIQUE DE L'EXISTANT

### Ce qui FONCTIONNE deja
| Element | Fichier | Etat |
|---------|---------|------|
| SHA-256 backend (personal upload) | `user_documents_routes.py:335` | OK — calcule hashlib.sha256 |
| SHA-256 backend (wizard preview) | `gemini_document_processor.py:2261` | OK — calcule et attache a extraction_result |
| find_duplicate() repository | `user_documents_repository.py:400` | OK — query par user_id + file_hash |
| 3-level dedup (wizard import) | `user_documents_service.py:1075-1117` | OK — hash > name > source_doc_id |
| Hash propagation wizard → persist | `wizard_session_service.py:590,1307` | OK — doc_hash passe au persist |

### VRAIS GAPS identifies
| # | Gap | Fichier | Impact |
|---|-----|---------|--------|
| G1 | **POST /upload cree le doublon meme si detecte** | `user_documents_routes.py:343+` | Pollution Firebase + BD |
| G2 | **Bulk upload idem** | `user_documents_routes.py:570+` | Meme probleme |
| G3 | **Photos n'ont PAS de hash** (OCR skip → no extraction_result) | `wizard_session_service.py:544-552` | 2/6 SRD sans hash en BD |
| G4 | **Frontend ne calcule PAS de hash** (pas de early-dedup) | `useDocumentUpload.ts` | Pas de feedback instant |
| G5 | **Wizard persist toujours upload Firebase** (pas de reuse) | `wizard_session_service.py:1282` | Meme fichier upload N fois |

### Donnees BD actuelles
- `user_documents` : 16 docs (10 platform_generated + 6 wizard_import)
- `service_request_documents` : 6 docs (4 avec hash, 2 sans = photos)
- Volume staging — preparation pour 1M+ transactions

---

## 2. ARCHITECTURE PHASE 1

### Flux AVANT (actuel)
```
Personal Upload:
  File → Backend SHA-256 → find_duplicate() → WARN only → Firebase upload → DB INSERT → OK

Wizard Upload:
  File → Gemini OCR (SHA-256) → session cache → persist → Firebase upload → DB INSERT
  Photo → NO OCR → NO hash → session cache → persist → Firebase upload → DB INSERT

Auto-import:
  service_request_documents → 3-level dedup → vault INSERT (OK)
```

### Flux APRES (Phase 1)
```
Personal Upload:
  File → Frontend SHA-256 → Backend check → if duplicate → RETURN existing (200, no upload)
                                           → if new → Firebase upload → DB INSERT → 201

Wizard Upload:
  File → Frontend SHA-256 → quick-check hash → if vault match → badge "Ya en vault" + auto-fill option
                                              → if new → Gemini OCR → session cache (avec hash)
  Photo → Frontend SHA-256 → session cache (hash from frontend, no OCR)

Wizard Persist:
  For each doc → if hash matches user_documents → reuse file_path, skip Firebase upload
               → if new → Firebase upload → DB INSERT

Bulk Upload:
  For each file → SHA-256 → find_duplicate() → if match → skip, return existing
                                              → if new → Firebase upload → DB INSERT
```

---

## 3. SOUS-TACHES DETAILLEES

### 1A. Frontend : SHA-256 via Web Crypto API (utility + integration)

**Fichiers a modifier :**
- `packages/web/src/core/utils/file-hash.ts` (CREER) — utility pur
- `packages/web/src/modules/user-documents/hooks/useDocumentUpload.ts` — personal upload
- `packages/web/src/modules/user-documents/services/api.ts` — ajouter check-hash endpoint
- `packages/web/src/modules/service-requests/hooks/useWizardSession.ts` — wizard upload

**Utility file-hash.ts :**
```typescript
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Integration useDocumentUpload.ts :**
- Avant `userDocumentsApi.upload()` : compute hash
- Appeler `userDocumentsApi.checkHash(hash)` → si match → return existing doc sans upload
- Envoyer hash dans FormData pour le backend

**Integration useWizardSession.ts :**
- Avant `previewDocument()` : compute hash
- Envoyer hash dans le multipart (ou query param)

### 1B. Backend : endpoint check-hash + propager hash photos

**Fichiers a modifier :**
- `packages/backend/app/modules/user_documents/api/user_documents_routes.py` — nouveau endpoint
- `packages/backend/app/modules/service_requests/services/wizard_session_service.py` — hash photos

**Nouveau endpoint :**
```python
GET /api/v1/user-documents/check-hash/{file_hash}
→ 200 { exists: true, document: { id, display_name, file_name, expiry_status } }
→ 200 { exists: false }
```

**Fix photos wizard :**
- Ligne 544-552 : quand OCR skip, calculer hash manuellement :
```python
import hashlib
photo_hash = hashlib.sha256(file_content).hexdigest()
extraction_result["doc_hash"] = photo_hash
```

### 1C. Backend : bloquer les vrais doublons (POST /upload)

**Fichier :** `packages/backend/app/modules/user_documents/api/user_documents_routes.py`

**Logique :**
- Ligne 340 : si `existing` != None → retourner le doc existant directement
- Status 200 (pas 201) avec `status: "duplicate"`
- PAS d'upload Firebase, PAS de DB INSERT
- Log access event "duplicate_detected"

### 1D. Backend : bloquer doublons bulk upload

**Fichier :** `packages/backend/app/modules/user_documents/api/user_documents_routes.py`

**Logique :**
- Ligne 572 : si `existing` → ajouter au results avec status "duplicate", SKIP Firebase upload + DB INSERT

### 1E. Backend : skip Firebase au wizard persist si hash match vault

**Fichier :** `packages/backend/app/modules/service_requests/services/wizard_session_service.py`

**Logique :**
- Ligne 1279-1308 : AVANT Firebase upload, checker si hash existe dans user_documents
- Si match → utiliser le file_path existant du vault
- Sinon → upload normal

---

## 4. CHECKLIST DE VALIDATION

### 1A. Frontend SHA-256
- [x] `file-hash.ts` cree avec `computeFileHash()`
- [x] `useDocumentUpload.ts` compute hash avant upload + pre-check
- [x] `api.ts` a `checkHash()` method
- [ ] Hash envoye dans FormData pour personal upload (backend calcule, pas critique)
- [ ] Hash envoye au wizard preview (backend calcule via Gemini, pas critique)

### 1B. Backend check-hash + photos
- [x] `GET /check-hash/{hash}` endpoint cree (+ rate limit 30/min)
- [x] Endpoint retourne doc existant si match (id, display_name, expiry_status)
- [x] Photos ont un hash dans le wizard session (hashlib.sha256)
- [ ] Test : upload photo → verifier hash dans session cache

### 1C. Personal upload dedup
- [x] Si doublon detecte → retourne doc existant (200)
- [x] PAS d'upload Firebase pour les doublons
- [x] PAS d'INSERT DB pour les doublons
- [x] Status "duplicate" dans la reponse
- [x] Log access "duplicate_detected"
- [x] Race condition geree (UniqueViolationError → fallback find_duplicate)
- [ ] Test : upload meme fichier 2 fois → 2e = duplicate

### 1D. Bulk upload dedup
- [x] Si doublon → skip Firebase + DB
- [x] Resultat inclut le doc existant avec status "duplicate"
- [ ] Test : bulk upload avec fichier deja present

### 1E. Wizard persist dedup
- [x] Check hash user_documents avant Firebase upload
- [x] Si match → reuse file_path existant (scoped user_id)
- [x] Si pas match → upload normal
- [ ] Test : soumettre wizard avec doc deja dans vault

### Auto-critique bugs corriges
- [x] Bug 1 (HIGH): Unique partial index `idx_user_documents_dedup` cree (race condition)
- [x] Bug 3 (MEDIUM): find_duplicate() filtre par `status = 'active'` (pas archived/expired)
- [x] Bug 6 (LOW): Rate limit 30/min sur check-hash endpoint

### Integration E2E
- [ ] Upload DIP personal → OK (201)
- [ ] Re-upload meme DIP personal → duplicate (200)
- [ ] Wizard avec DIP deja en vault → pas de re-upload Firebase
- [ ] Photo dans wizard → hash present dans session + SRD
- [ ] Bulk avec doublons → doublons skippes

---

## 5. ORDRE D'IMPLEMENTATION

1. **1B-photos** (5 min) — fix le plus simple, zero risque
2. **1C** (15 min) — bloquer doublons personal upload
3. **1D** (10 min) — bloquer doublons bulk upload
4. **1B-endpoint** (15 min) — nouveau GET /check-hash
5. **1A** (30 min) — frontend hash computation + integration
6. **1E** (20 min) — wizard persist skip Firebase si vault match
7. **Tests E2E** (20 min) — validation complete

---

## 6. RISQUES ET MITIGATIONS

| Risque | Mitigation |
|--------|------------|
| Hash computation lente sur gros fichiers (50MB) | Web Crypto API est native et rapide (~200ms pour 50MB) |
| Race condition : 2 uploads simultanes du meme fichier | Backend find_duplicate() + unique index ON CONFLICT |
| Document dans vault mais expire → ne pas reuser | check-hash retourne expiry_status, frontend decide |
| Photo hash different si compression JPEG | Hash sur bytes exacts recus (pas de recompression) |
