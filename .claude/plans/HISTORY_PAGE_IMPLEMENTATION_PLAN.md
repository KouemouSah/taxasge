# Plan d'Implémentation - Page Historial (History)

## Contexte

Page de suivi chronologique des actions sur les demandes de service pour les agents CNEDOGE passeport.

**Table source**: `service_request_history` (Migration 020)
- Colonnes: `id`, `request_id`, `action`, `previous_status`, `new_status`, `performed_by`, `performed_at`, `details`, `comment`

---

## Phase 1 - Backend API ✅ COMPLETED

**Commit**: `f3095429` (2026-01-27)

### Task 1: Modèles Pydantic ✅
- [x] `HistoryActionType` enum (status_change, document_added, assigned, cita_scheduled, verification_updated, comment_added, payment_received, escalated, reopened)
- [x] `HistoryActionSource` enum (user, agent, system, webhook)
- [x] `PerformerInfo` model (user_id, full_name, email, role, is_system)
- [x] `HistoryEntry` model (id, action, previous_status, new_status, details, comment, performed_by, performed_at)
- [x] `HistoryFilters` model (action_types, from_date, to_date, include_system)
- [x] `HistoryListResponse` model (request_id, reference, entries, total, stats)
- [x] `HistorySummaryItem` model (request_id, reference, last_action, total_actions)
- [x] `HistoryListSummaryResponse` model (items, total, page, page_size)

**File**: `packages/backend/app/modules/service_requests/models/history.py`

### Task 2: Repository Methods ✅
- [x] `get_request_history(db, request_id, filters)` - Timeline complète avec performer info
- [x] `get_request_with_history_summary(db, request_id)` - Request avec statistiques
- [x] `get_history_list_for_entity(db, workflow_codes, status_filter)` - Liste pour page historial

**File**: `packages/backend/app/modules/service_requests/repositories/service_request_repository.py`

### Task 3: API Endpoints ✅
- [x] `GET /{request_id}/history` - Historique complet d'une demande
- [x] `GET /history` - Liste des demandes avec résumé historique

**File**: `packages/backend/app/modules/service_requests/api/agent_routes.py`

### Task 4: Tests Unitaires ✅
- [x] Tests modèles Pydantic
- [x] Tests sérialisation JSON
- [x] Tests filtres

**File**: `packages/backend/tests/unit/service_requests/test_history.py`

---

## Phase 2 - Frontend Page ✅ COMPLETED

**Commit**: `8dba1790`, `59a38634` (2026-01-27)

### Task 1: Page Historial ✅
- [x] Créer `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/cnedoge-pasaporte/pasaportes/history/page.tsx`
- [x] Layout avec liste table, détail en Sheet (slide-over)
- [x] Pagination et tri par date

### Task 2: Composants Timeline ✅
- [x] `TimelineEntry` component - Affichage chronologique vertical
- [x] `ActionIcon` component - Icône par type d'action
- [x] Filtres par statut intégrés
- [x] Source badges (history, ocr, assignment)

### Task 3: Service API ✅
- [x] API methods dans `serviceRequestsApi` avec React Query
- [x] Types TypeScript alignés avec backend (`HistoryEntry`, `HistoryEntrySource`, etc.)
- [x] Gestion du cache avec React Query

### Task 4: Traductions ✅
- [x] Clés i18n pour actions (es, fr, en) dans `getHistoryActionLabel()`
- [x] Labels des filtres
- [x] Messages vides et erreurs

### Task 5: Menu Configuration ✅
- [x] Menu "Historial" existe dans `entity-menus.ts` ligne 217
- [x] Lien vers `/dashboard/agent/cnedoge-pasaporte/pasaportes/history`

---

## Phase 3 - Consolidation ✅ COMPLETED

**Commit**: `59a38634` (2026-01-27)

### Task 1: Intégrer Documents OCR ✅
- [x] Afficher résultats OCR dans historique (ocr_completed, ocr_failed actions)
- [x] UNION ALL avec `gemini_processing_logs` table
- [x] Détails OCR: document_code, extraction_confidence, risk_level, processor

### Task 2: Intégrer Assignments ✅
- [x] Afficher changements d'assignation (assigned, reassigned actions)
- [x] UNION ALL avec table `assignments`
- [x] Détails: agent_name, reassigned_to_name, assignment_method, reassignment_reason

### Task 3: Source Tracking ✅
- [x] Added `HistoryEntrySource` enum (history, ocr, assignment)
- [x] Source badges in timeline UI
- [x] Filter params: `include_ocr`, `include_assignments`

---

## Phase 4 - UX Améliorations ✅ COMPLETED

**Commit**: `f3ad9a66` (2026-01-27)

### Task 1: Export ✅
- [x] Export CSV du timeline (UTF-8 BOM pour Excel)
- [x] Export PDF avec timeline formaté (xhtml2pdf)
- [x] Endpoint: `GET /{request_id}/history/export?format=csv|pdf`
- [x] Boutons export dans le Sheet frontend

### Task 2: Recherche Avancée ✅
- [x] Recherche par référence et nom citoyen
- [x] Filtres combinés avec panneau collapsible
- [x] Filtre par type d'action (status_change, document_added, ocr_completed, etc.)
- [x] Filtres de plage de dates (from/to)
- [x] Badges de filtres actifs avec bouton clear

### Task 3: Statistiques ✅
- [x] Endpoint: `GET /history/statistics?entity_code=X&days=30`
- [x] Distribution des actions (bar chart horizontal)
- [x] Temps moyen par statut
- [x] Activité journalière (bar chart 14 jours)
- [x] Métriques clés: total actions, solicitudes actives, jour le plus actif

---

## Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `models/history.py` | Modèles Pydantic (HistoryEntry, HistoryEntrySource, etc.) |
| `repositories/service_request_repository.py` | Méthodes DB avec UNION ALL |
| `api/agent_routes.py` | Endpoints REST avec filtres OCR/assignments |
| `tests/unit/service_requests/test_history.py` | Tests unitaires |
| `dashboard/agent/cnedoge-pasaporte/pasaportes/history/page.tsx` | Page frontend |
| `modules/service-requests/types/index.ts` | Types TypeScript |

---

## API Endpoints

```
GET /api/v1/service-requests/{request_id}/history
  Query params: action_type, from_date, to_date, include_system, include_ocr, include_assignments, page, page_size
  Response: HistoryListResponse

GET /api/v1/service-requests/history
  Query params: entity_code, status_filter, page, page_size
  Response: HistoryListSummaryResponse
```

---

## Notes Techniques

1. **performed_by nullable**: Intentionnel pour actions système (migrations, webhooks)
2. **Enum case**: `service_request_history.action` utilise lowercase (status_change, etc.)
3. **Colonnes previous_status/new_status**: Dénormalisation volontaire pour audit trail efficace
4. **UNION ALL**: Utilisé pour consolider history, gemini_processing_logs, et assignments
5. **Source field**: Tracks data origin (history, ocr, assignment) pour UI badges
6. **Confidence colors**: Green (>90%), Yellow (>70%), Red (<70%) pour OCR
