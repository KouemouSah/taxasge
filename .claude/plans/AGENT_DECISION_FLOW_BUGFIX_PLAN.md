# Plan: Agent Decision Flow — Critical Bugfix

## Contexte
Audit complet du flux make_decision() (approve/reject/request_documents).
11 bugs identifiés (3 critiques, 4 majeurs, 4 mineurs) + 2 problèmes de sécurité.

## Status: COMPLETE

---

## Phase 1: CRITIQUES (en production, cassés)

### Bug #2 — SLA SQL: UPDATE...FROM...JOIN référence invalide à `sp`
- **Fichier**: `packages/backend/app/modules/payments/services/payment_sla_service.py`
- **Fix**: JOIN users via `sr.user_id` au lieu de `sp.user_id`
- [x] Fix _process_warnings SQL
- [x] Fix _process_escalations SQL
- [x] Vérifier _process_expirations (OK, comma join syntax)

### Bug #3 — 'APPROVED' inexistant dans enum → appointment-reminders cassé
- **Fichier**: `packages/backend/app/core/scheduler.py:260`
- **Fix**: Remplacer `'APPROVED'` par `'DOSSIER_VALIDE'`
- [x] Fix enum value
- [x] Vérifier autres usages de 'APPROVED' dans le codebase (4 trouvés, tous corrigés)

### Bug #5 — workflows.name_fr inexistant → PDF jamais généré
- **Fichier**: `packages/backend/app/modules/service_requests/api/agent_routes.py:1110`
- **Fix**: Retirer `name_fr` de la requête, utiliser name_es or workflow_code
- [x] Fix SELECT query
- [x] Fix workflow_name fallback

---

## Phase 2: MAJEURS (silencieux, données incorrectes)

### Bug #4 — document_templates: colonnes code/name_es inexistantes
- **Fichier**: `agent_routes.py:1382-1385`
- **Fix**: `code` → `template_code`, `name_es` → `document_name_es`
- [x] Fix SQL query
- [x] Fix dict mapping key

### Bug #1 — Aucune transaction SQL sur make_decision()
- **Fichier**: `agent_routes.py:1079-1442`
- **Fix**: Wrapper les opérations critiques dans `async with conn.transaction()`
- [x] Approve: transaction autour de UPDATE + INSERT history + complete_item
- [x] Reject: transaction autour de UPDATE + INSERT history + complete_item
- [x] Request_documents: transaction autour de UPDATE + INSERT history + cancel queue
- [x] PDF generation et EventBus restent HORS transaction (non-blocking)

### Bug #7 — Aucun toast success/error sur décision agent
- **Fichier**: `page.tsx:269-285`
- **Fix**: Ajouter toast.success dans onSuccess, toast.error dans onError
- [x] Approve: toast "Solicitud aprobada exitosamente"
- [x] Reject: toast "Solicitud rechazada"
- [x] Request docs: toast "Documentos adicionales solicitados"
- [x] onError: toast.error avec message backend

### Bug #11 — Payload rejet manque reference/workflow_name
- **Fichier**: `agent_routes.py:1325-1339`
- **Fix**: Ajouter `reference`, `rejection_reason` au payload REQUEST_REJECTED
- [x] Fix reject payload
- [x] Fix request_documents payload (ajouté reference)

---

## Phase 3: MINEURS + SÉCURITÉ

### Bug #8 — except Exception: pass avale les erreurs notification
- **Fichier**: `agent_routes.py` (multiples endroits)
- **Fix**: Remplacer `pass` par `logger.warning(...)`
- [x] Fix approve event publish
- [x] Fix reject event publish
- [x] Fix request_documents event publish
- [x] Fix escalation enqueue
- [x] Fix appointment cancelled event

### Bug #9 — rejection_reason OR comments → comments ignoré
- **Fichier**: `agent_routes.py:1308`
- **Fix**: Stocker les deux: reason + comments concaténés dans history comment
- [x] Fix INSERT pour inclure les deux

### Bug #10 — Doublon potentiel de RDV post-approval
- **Fichier**: `agent_routes.py:1114-1125`
- **Fix**: Vérifier si cita_date existe déjà avant scheduling
- [x] Ajouter guard conditionnel

### SEC #1 — Pas de vérification de status avant décision
- **Fichier**: `agent_routes.py` après ligne 1070
- **Fix**: Ajouter whitelist de status autorisés
- [x] Ajouter check: status IN ('SUBMITTED', 'UNDER_REVIEW')

### SEC #2 — SELECT * FROM service_requests (over-fetching)
- **Fix**: Colonnes explicites dans SELECT
- [x] Fix service_requests SELECT
- [x] Fix agent_work_queue SELECT (id only)

### Bug #3 follow-up — 'APPROVED' ghost references
- **Fichiers**: appointment_routes.py, agent_routes.py, cron_routes.py, batch_repository.py
- **Fix**: Supprimer 'APPROVED' (dead code, enum inexistant)
- [x] appointment_routes.py: supprimé de APPOINTMENT_ALLOWED_STATUSES
- [x] agent_routes.py: supprimé de eligible_statuses
- [x] cron_routes.py: remplacé par 'DOSSIER_VALIDE'
- [x] batch_repository.py: supprimé (DOSSIER_VALIDE déjà présent)

### Bug #6 — result_status jamais persisté
- **Fichier**: `agent_queue_service.py:356-365`
- **Note**: Colonne n'existe pas dans agent_work_queue. Log seulement, pas de migration nécessaire.
- [x] Évalué: non-bloquant, le status est déjà dans service_request_history

---

## Fichiers impactés
1. `packages/backend/app/modules/payments/services/payment_sla_service.py`
2. `packages/backend/app/core/scheduler.py`
3. `packages/backend/app/modules/service_requests/api/agent_routes.py`
4. `packages/backend/app/modules/service_requests/api/appointment_routes.py`
5. `packages/backend/app/modules/service_requests/api/cron_routes.py`
6. `packages/backend/app/modules/batch_requests/repositories/batch_repository.py`
7. `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/[entityCode]/request/[requestId]/page.tsx`

## Validation
- [x] Chaque phase testée avant de passer à la suivante
- [ ] Vérifier que les logs Cloud Run ne montrent plus les erreurs SLA et appointment
- [ ] Tester approve/reject manuellement après déploiement
