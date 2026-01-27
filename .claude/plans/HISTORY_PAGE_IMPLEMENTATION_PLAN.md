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

## Phase 2 - Frontend Page 🔄 IN PROGRESS

### Task 1: Page Historial
- [ ] Créer `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/cnedoge-pasaporte/historial/page.tsx`
- [ ] Layout avec liste à gauche, détail à droite (ou modal)
- [ ] Pagination et tri par date

### Task 2: Composants Timeline
- [ ] `HistoryTimeline.tsx` - Affichage chronologique vertical
- [ ] `HistoryEntry.tsx` - Entrée individuelle avec icône par type
- [ ] `HistoryFilters.tsx` - Filtres par type d'action, date
- [ ] `PerformerBadge.tsx` - Badge utilisateur/système

### Task 3: Service API
- [ ] `historyService.ts` - Appels API avec React Query
- [ ] Types TypeScript alignés avec backend
- [ ] Gestion du cache et invalidation

### Task 4: Traductions
- [ ] Ajouter clés i18n pour actions (es, fr, en)
- [ ] Labels des filtres
- [ ] Messages vides et erreurs

### Task 5: Menu Configuration
- [ ] Vérifier que le menu "Historial" existe dans `menu_configurations`
- [ ] Lien vers `/dashboard/agent/cnedoge-pasaporte/historial`

---

## Phase 3 - Consolidation (Future)

### Task 1: Intégrer Documents OCR
- [ ] Afficher résultats OCR dans historique
- [ ] Lien vers `gemini_processing_logs`

### Task 2: Intégrer Assignments
- [ ] Afficher changements d'assignation
- [ ] Lien vers table `assignments`

### Task 3: Notifications
- [ ] Alertes pour actions importantes
- [ ] Badge compteur non-lus

---

## Phase 4 - UX Améliorations (Future)

### Task 1: Export
- [ ] Export PDF du timeline
- [ ] Export CSV pour analyse

### Task 2: Recherche Avancée
- [ ] Recherche par référence, citoyen, agent
- [ ] Filtres combinés

### Task 3: Statistiques
- [ ] Graphique temps moyen par étape
- [ ] Tendances par période

---

## Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `models/history.py` | Modèles Pydantic |
| `repositories/service_request_repository.py` | Méthodes DB |
| `api/agent_routes.py` | Endpoints REST |
| `tests/unit/service_requests/test_history.py` | Tests unitaires |
| `dashboard/agent/cnedoge-pasaporte/historial/page.tsx` | Page frontend |

---

## API Endpoints

```
GET /api/v1/service-requests/{request_id}/history
  Query params: action_types[], from_date, to_date, include_system, page, page_size
  Response: HistoryListResponse

GET /api/v1/service-requests/history
  Query params: entity_code, workflow_codes[], status, page, page_size
  Response: HistoryListSummaryResponse
```

---

## Notes Techniques

1. **performed_by nullable**: Intentionnel pour actions système (migrations, webhooks)
2. **Enum case**: `service_request_history.action` utilise lowercase (status_change, etc.)
3. **Colonnes previous_status/new_status**: Dénormalisation volontaire pour audit trail efficace
4. **LATERAL JOIN**: Utilisé pour récupérer last_action efficacement dans la liste
