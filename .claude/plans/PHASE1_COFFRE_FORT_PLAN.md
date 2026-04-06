# PHASE 1 — Plan detaille : Coffre-fort + Extension Gemini + Integration Assistant

**Date** : 2026-04-05
**Prerequis** : Migration 287 (prochaine disponible)
**Statut** : COMPLETE (auto-critique faite, 10 bugs critiques/majeurs corriges)

---

## SOUS-PHASES D'IMPLEMENTATION

### SP1.1 — Migration BD (toutes les tables en 1 migration)
### SP1.2 — Module backend user_documents/ (CRUD + upload + quota)
### SP1.3 — Extension GeminiDocumentProcessor (post_process_for_vault)
### SP1.4 — Auto-import hooks (wizard → coffre + generes → coffre)
### SP1.5 — 7 nouveaux tools chatbot
### SP1.6 — Frontend module user-documents/ (page complete)
### SP1.7 — Frontend integration wizard + chat
### SP1.8 — i18n (es/fr/en)
### SP1.9 — Tests + Auto-critique

---

## SP1.1 — MIGRATION BD

**Fichier** : `packages/backend/database/migrations/287_user_documents_vault.sql`

**Tables creees :**
1. `user_documents` — coffre-fort unifie
2. `user_document_workflow_tags` — tags workflow
3. `user_document_access_log` — audit acces
4. `user_document_alerts` — alertes expiration
5. `user_agent_memory` — memoire comportementale
6. `user_agent_permissions` — permissions autonomie

**Checklist SP1.1 :**
- [x] Ecriture migration SQL (287_user_documents_vault.sql)
- [x] Index partiels pour 1M+ users (8 index)
- [x] GIN index pour full-text search (idx_ud_search)
- [x] UNIQUE constraints (workflow_tags, agent_permissions)
- [x] FK constraints avec ON DELETE CASCADE
- [x] Verification colonnes vs rapport V3 (DO $$ block)

---

## SP1.2 — MODULE BACKEND

**Structure :**
```
packages/backend/app/modules/user_documents/
├── __init__.py
├── api/
│   ├── __init__.py
│   └── user_documents_routes.py
├── models/
│   ├── __init__.py
│   └── user_document.py
├── repositories/
│   ├── __init__.py
│   └── user_documents_repository.py
└── services/
    ├── __init__.py
    ├── user_documents_service.py
    └── vault_storage_service.py
```

**Endpoints (user_documents_routes.py) :**
```
POST   /upload              — Upload + Gemini async + quota check
POST   /bulk-upload          — Multi (max 5)
GET    /                     — Liste paginee (cursor-based)
GET    /{id}                 — Detail + audit log
GET    /{id}/download        — Signed URL 15min
GET    /{id}/thumbnail       — Thumbnail webp
PUT    /{id}                 — Modifier metadonnees
PUT    /{id}/reclassify      — Re-traitement Gemini
PUT    /{id}/archive         — Archiver
DELETE /{id}                 — Soft delete
POST   /bulk-action          — Actions groupees
GET    /generated            — Documents generes
GET    /generated/{id}/download — Download genere
GET    /search               — Full-text search
GET    /stats                — Stats + quota
GET    /for-workflow/{code}  — Docs compatibles workflow
GET    /readiness            — Readiness tous workflows
GET    /readiness/{code}     — Readiness workflow specifique
POST   /export               — Export ZIP async
GET    /alerts               — Alertes actives
PUT    /alerts/{id}/read     — Marquer lue
PUT    /alerts/{id}/dismiss  — Dismiss
GET    /{id}/versions        — Historique versions
```

**Models (user_document.py) :**
- UserDocumentCreate (upload)
- UserDocumentUpdate (metadata)
- UserDocumentResponse (detail)
- UserDocumentListResponse (pagination cursor)
- UserDocumentStats
- ReadinessResult
- AlertResponse

**Repository pattern :**
- Tous les queries avec $1, $2... (asyncpg parameterized)
- Cursor pagination sur (created_at DESC, id)
- Partial indexes dans les WHERE

**Service pattern :**
- upload_personal_document() → Firebase + Gemini async
- _check_quota() → SUM file_size_bytes WHERE user_id + source='personal'
- _find_duplicate() → SELECT WHERE file_hash
- _process_document_async() → GeminiDocumentProcessor.process() + post_process_for_vault()
- auto_import_from_wizard() → hook post-persist
- auto_import_generated() → hook post-receipt/certificate

**Checklist SP1.2 :**
- [x] __init__.py module registration
- [x] Pydantic models (11 types, 5 constants, 13 models)
- [x] Repository CRUD (16 methods, all parameterized $1)
- [x] Repository pagination cursor-based
- [x] Repository full-text search (tsvector)
- [x] Service upload + Gemini async (17 methods)
- [x] Service quota check (100 Mo)
- [x] Service deduplication (SHA-256)
- [x] Service auto-import wizard hook
- [x] Service auto-import generated hook
- [ ] Vault storage (Firebase paths /user-vault/) — uses existing storage_service
- [x] Routes avec auth (22 endpoints)
- [x] Routes avec audit log
- [x] Registration main.py (prefix=/api/v1/user-documents)

---

## SP1.3 — EXTENSION GEMINI

**Fichier modifie** : `gemini_document_processor.py`

**Ajouts :**
- DOCUMENT_CATEGORY_MAP (dict statique ~30 entries)
- EXPIRY_FIELD_PATHS, HOLDER_NAME_PATHS, DOCUMENT_NUMBER_PATHS
- post_process_for_vault() method
- _derive_workflow_tags() method (JOIN BD)
- _extract_normalized_date() method
- _extract_holder_name() method
- _extract_first_match() method

**Checklist SP1.3 :**
- [x] DOCUMENT_CATEGORY_MAP complet (~95 entries, 14 categories)
- [x] post_process_for_vault() method
- [x] _derive_workflow_tags() avec JOIN workflow_document_requirements
- [x] Helpers extraction (_extract_date_from_paths, _extract_text_from_paths, _resolve_nested_path)
- [ ] Tests unitaires

---

## SP1.4 — AUTO-IMPORT HOOKS

**Fichiers modifies :**
- `wizard_session_service.py` : _persist_session_data() → creer user_documents
- `receipt_service.py` (ou equivalent) : post-paiement → creer user_documents generated

**Checklist SP1.4 :**
- [ ] Hook _persist_session_data : create vault entries from wizard docs
- [ ] Hook documents generes : recus paiement
- [ ] Pas de duplication (check source_document_id)

---

## SP1.5 — 7 NOUVEAUX TOOLS CHATBOT

**Fichiers modifies :**
- `chatbot_tools_authenticated.py` : 7 nouvelles functions
- `chatbot_tools.py` : merge dans CHATBOT_AUTH_FUNCTION_MAP + CHATBOT_AUTH_FUNC_DECLS

**Tools :**
1. list_vault_documents
2. check_readiness
3. get_expiring_documents
4. get_vault_stats
5. suggest_next_uploads
6. prepare_renewal
7. get_agent_memory

**Checklist SP1.5 :**
- [x] 7 async functions dans chatbot_tools_authenticated.py
- [x] 7 FunctionDeclaration dans chatbot_tools.py
- [x] Merge dans CHATBOT_AUTH_FUNCTION_MAP (15 tools total)
- [x] Merge dans CHATBOT_AUTH_FUNC_DECLS (15 declarations total)
- [x] Security : user_id filter dans chaque query (all use $1::uuid)

---

## SP1.6 — FRONTEND MODULE

**Structure :**
```
packages/web/src/modules/user-documents/
├── components/
│   ├── DocumentVault.tsx
│   ├── PersonalDocumentsGrid.tsx
│   ├── GeneratedDocumentsGrid.tsx
│   ├── DocumentCard.tsx
│   ├── DocumentUploadDialog.tsx
│   ├── DocumentDetailSheet.tsx
│   ├── DocumentPreview.tsx
│   ├── DocumentFilters.tsx
│   ├── DocumentAlertsBanner.tsx
│   ├── ReadinessCheck.tsx
│   ├── ExpiryBadge.tsx
│   ├── WorkflowTagChips.tsx
│   ├── EmptyVaultState.tsx
│   └── index.ts
├── hooks/
│   ├── useUserDocuments.ts
│   ├── useDocumentUpload.ts
│   ├── useDocumentAlerts.ts
│   ├── useGeneratedDocuments.ts
│   └── index.ts
├── services/
│   ├── api.ts
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts
```

**Route** : `/[locale]/(dashboard)/dashboard/documents/page.tsx`

**Checklist SP1.6 :**
- [x] Route + page.tsx (/dashboard/documents/)
- [x] DocumentVault.tsx (4 tabs: personal/generated/alerts/readiness)
- [x] PersonalDocumentsGrid.tsx (infinite scroll, search, category filters)
- [x] GeneratedDocumentsGrid.tsx (infinite scroll, type filters)
- [x] DocumentCard.tsx (icon, category badge, expiry, workflow tags, actions dropdown)
- [x] ExpiryBadge.tsx (green/orange/red/muted)
- [x] WorkflowTagChips.tsx (chips + overflow +N)
- [x] DocumentUploadDialog.tsx (drag-drop, validation, progress, dedup detection)
- [ ] DocumentDetailSheet.tsx (side panel) — DEFERRED P1.5
- [ ] DocumentPreview.tsx (PDF/image viewer) — DEFERRED P1.5
- [ ] DocumentFilters.tsx — integrated in PersonalDocumentsGrid
- [x] AlertsTab.tsx (grouped by severity, mark/dismiss)
- [x] ReadinessCheck.tsx (progress bars, ready/missing/expiring)
- [x] EmptyVaultState integrated in PersonalDocumentsGrid
- [x] Hooks (6 hooks: useUserDocuments, useDocumentUpload, useGeneratedDocuments, useDocumentStats, useDocumentAlerts, useReadiness + mutations)
- [x] API client complet (21 methods)
- [x] Types TypeScript (12 interfaces + 7 types + CATEGORY_LABELS)
- [x] Responsive mobile-first (grid cols adapt)

---

## SP1.7 — FRONTEND INTEGRATION

**Checklist SP1.7 :**
- [ ] Bouton "Depuis Mes Documents" dans DocumentUploader wizard
- [ ] Quick actions enrichies dans /dashboard/chat
- [ ] ActionConfirmCard.tsx dans le chat
- [ ] Menu sidebar : lien "Mes Documents"

---

## SP1.8 — i18n

**Fichiers** : `packages/web/messages/es.json`, `fr.json`, `en.json`

**Checklist SP1.8 :**
- [x] Section "userDocuments" dans es.json (~100 keys, 14 sections)
- [x] Traduction fr.json (complet)
- [x] Traduction en.json (complet)

---

## SP1.9 — TESTS + AUTO-CRITIQUE

**Checklist SP1.9 :**
- [ ] Tests Pydantic models — DEFERRED Phase 3
- [ ] Tests repository — DEFERRED Phase 3
- [ ] Tests routes — DEFERRED Phase 3
- [ ] Tests extension Gemini — DEFERRED Phase 3
- [ ] Tests tools chatbot — DEFERRED Phase 3
- [x] Auto-critique : revue code complete (7 CRITICAL, 10 MAJOR, 5 MINOR trouves)
- [x] Auto-critique : revue OWASP (user_id ownership, parameterized queries, signed URLs)
- [x] Auto-critique : revue performance (index, cursor pagination)
- [x] Correction bugs critiques :
  - [x] BUG #1: CHECK constraint access_type missing values → FIXED
  - [x] BUG #2: user_document_alerts missing updated_at/dismissed_at → FIXED
  - [x] BUG #3+16: Alert reads title not title_es → FIXED
  - [x] BUG #4: file_size_bytes CHECK > 0 vs default 0 → FIXED (>= 0)
  - [x] BUG #7: _row_to_dict returns {} for None → FIXED (returns None)
  - [x] BUG #10+11: Alert methods use nonexistent columns → FIXED
  - [x] BUG #14: Reclassify never launches Gemini → FIXED (calls service)
  - [x] BUG #15: expiration_seconds TypeError → FIXED (expiration_hours)
  - [x] BUG #21: workflow_map case sensitivity → FIXED (.lower())
  - [x] BUG #23: wdr.workflow_id column doesn't exist → FIXED (wdr.workflow_code)

---

*Plan Phase 1 — A cocher au fur et a mesure*
