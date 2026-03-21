# OMS P1-P4 Production Fixes — Plan d'implémentation

## Objectif
Corriger TOUS les bugs/lacunes identifiés dans l'audit critique des phases 1-4 OMS avant de passer à la phase 5.

---

## Phase A : Fixes Backend Critiques (Bloquants)

### A1. OMS_PROCESSOR_ROLES — Rôles manquants ✅
- [x] Ajouter: agent_ayuntamiento, agent_camara, supervisor_ayuntamiento, supervisor_camara, agent_tesoro
- [x] Ajouter SUPERVISOR_ROLES set pour dual-mode queue
- Fichier: `oms_agent_service.py:19-40`

### A2. Queue filtré par assignment (IDOR agent) ✅
- [x] Modifier `resolve_agent_context()` pour retourner `agent_profile_id`
- [x] Modifier `get_agent_queue()` pour JOIN assignments si non-superviseur
- [x] Modifier `get_agent_queue_stats()` idem
- [x] Superviseurs voient tout (pas de JOIN assignment)
- Fichiers: `oms_agent_service.py`, `license_repository.py`

### A3. Search + fee_type server-side ✅
- [x] Ajouter params `search`, `fee_type` à `get_agent_queue()` + repository
- [x] Implémenter ILIKE search sur company_name, NIF, service_name
- [x] Implémenter WHERE fee_type = $N
- [x] Câbler frontend: api.ts + page.tsx (server-side filters, removed client-side filtering)
- Fichiers: `license_repository.py`, `oms_agent_routes.py`, `api.ts`, `page.tsx`

### A4. Compliance aggregation endpoint ✅
- [x] Créer `GET /licenses/compliance-summary?fiscal_year=N`
- [x] 1 requête SQL: GROUP BY fee_type avec counts + amounts + overdue companies
- [x] Frontend compliance page refactoré → 1 appel API au lieu de N+1
- Fichiers: `license_routes.py`, `license_repository.py`, `compliance/page.tsx`

### A5. EventType enum OMS ✅
- [x] Ajouté 6 types: OBLIGATION_ROUTED, PROCESSED, REJECTED, OVERDUE, PENALTY_APPLIED, REMINDER_SENT
- Fichier: `event_types.py`

### A6. Cron auth — X-Cron-Secret ✅
- [x] Remplacé `permission_required()` par `verify_cron_auth()` sur 3 crons
- [x] Ajouté cron `/cron/obligation-reminders` avec X-Cron-Secret auth
- Fichier: `license_routes.py`

---

## Phase B : Fonctionnalités Métier

### B1. Relances automatiques (OmsReminderService) ✅
- [x] Créé `oms_reminder_service.py` (pattern PaymentSLAService)
- [x] Migration 246: `reminder_sent_at` + index `idx_assignments_oms_obligation` + 3 email templates
- [x] 3 tiers: J-15 reminder, J+1 overdue notice, J+30 escalation superviseur
- [x] Cron endpoint dans license_routes.py
- Fichiers: nouveau service, migration 246, `license_routes.py`

### B2. "Ver deuda" + "Enviar relance" — Corrigés ✅
- [x] Supprimé bouton "Ver deuda" (lien 404) — "Ver licencia" suffit
- [x] Supprimé bouton "Enviar relance" mock — relances sont automatiques maintenant
- Fichier: `compliance/page.tsx` (réécriture complète)

---

## Phase C : Frontend Production Quality

### C1. i18n — Remplacer strings hardcodées ✅ (compliance + queue partiellement)
- [x] Compliance page: 100% useTranslations('oms.compliance')
- [x] Queue page: useTranslations('oms') importé + useLocale()
- [x] Clés loadError ajoutées dans es/fr/en.json
- [ ] Licenses page + license detail → à compléter (non bloquant)

### C2. Shared utils — DRY ✅
- [x] Créé `packages/web/src/modules/oms/utils/formatters.ts`
- [x] Centralisé: fmtXAF, fmtK, fmtDate, OBLIGATION_STATUS_CONFIG, LICENSE_STATUS_CONFIG
- [x] Queue page refactoré pour utiliser shared formatters
- [x] Compliance page refactoré

### C3. Compliance page — Utiliser nouvel endpoint ✅
- [x] Remplacé N+1 fetch par 1 appel `GET /licenses/compliance-summary`
- [x] Type ComplianceSummaryGroup dans types/index.ts
- [x] API method getComplianceSummary dans api.ts

### C4. Queue page — Filtres server-side ✅
- [x] search → param backend `search` (debounced 300ms, reset page to 1)
- [x] fee_type → param backend `fee_type` (tesoro/municipal/chamber dropdown)
- [x] Supprimé filtre client-side redondant

---

## Checklist validation
- [x] 0 erreur TypeScript ✅
- [x] Permissions vérifiées
- [x] Traductions complètes (es/fr/en) pour compliance
- [ ] ESLint check
- [ ] Commit local après validation
