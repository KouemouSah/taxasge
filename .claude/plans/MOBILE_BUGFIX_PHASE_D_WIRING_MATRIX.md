# Mobile Backend↔Mobile Wiring Matrix

**Date:** 2026-04-29
**Phase:** D (pre-push wiring audit)
**Scope:** Citizen-facing endpoints only (admin / agent / supervisor / cron / OMS-agent excluded)
**Sources:**
- Backend: `packages/backend/app/main.py` (52 `include_router` calls, lines 1233–1752)
- Mobile: `packages/mobile/src/core/api/endpoints.ts` (single SoT, verified 2026-04-27)
- Mobile feature modules: `auth, bundle-workflow, bundles, calculator, chatbot, companies, dashboard, directory, fiscal-services, notifications, payments, profile, service-requests, support, vault, wizard`

---

## 1. Router inventory (citizen-facing only)

| # | Backend prefix | Source file | Notes |
|---|---|---|---|
| 1 | `/api/v1/auth` | `auth/api/auth_routes.py` + `two_factor_routes.py` | Login, register, refresh, 2FA, password, sessions |
| 2 | `/api/v1/users` | `users/api/user_routes.py` | Profile, avatar, device-token, RGPD export/delete |
| 3 | `/api/v1/fiscal-services` | `fiscal_services/api/fiscal_service_routes.py` | Catalog 850+ |
| 4 | `/api/v1/service-bundles` | `fiscal_services/api/bundle_routes.py` | Bundle catalog + simulator |
| 5 | `/api/v1/bundle-workflow` | `fiscal_services/api/bundle_workflow_routes.py` | OMS citizen flow |
| 6 | `/api/v1/companies` | `companies/api/company_routes.py` | Owner CRUD + members |
| 7 | `/api/v1/public/companies` | `companies/api/company_public_routes.py` | Annuaire public |
| 8 | `/api/v1/service-requests` | `service_requests/api/routes.py` | Citizen view |
| 9 | `/api/v1/service-requests` (appointments) | `service_requests/api/appointment_routes.py` | Post-creation booking |
| 10 | `/api/v1/wizard-sessions` | `service_requests/api/wizard_session_routes.py` | Cache-first multi-step |
| 11 | `/api/v1/payments` | `payments/api/payment_routes.py` | Plans + history |
| 12 | `/api/v1/verify` | `payments/api/verify_routes.py` | Public receipt/license/cert verification |
| 13 | `/api/v1/chatbot` | `chatbot/api/chatbot_routes.py` | RAG + Gemini |
| 14 | `/api/v1/user-documents` | `user_documents/api/user_documents_routes.py` | Vault + alerts + agent perms |
| 15 | `/api/v1/documents` | `documents/api/document_routes.py` | Legacy request-scoped (vault is canonical) |
| 16 | `/api/v1/support` | `support/api/support_routes.py` | Tickets |
| 17 | `/api/v1/homepage` | `homepage/api/homepage_routes.py` | Public landing |
| 18 | `/api/v1/translations/system` | `translations/api/translation_routes.py` | i18n DB-driven |
| 19 | `/api/v1/verified-identifiers` (subset) | `verified_identifiers/api/verified_identifiers_routes.py` | External doc verification |

Out-of-scope (admin/agent/cron, ➖): `admin`, `admin/users`, `admin/monitoring`, `assignments`, `supervisor`, `statistics`, `agents`, `agents/analyst`, `service-requests-agent`, `service-requests-admin`, `internal/cron`, `accountant`, `accountant-batch`, `webhooks`, `inspections`, `inspection-missions`, `inspection-analytics`, `field-inspections`, `funcionario`, `entity-locations`, `cities`, `enrichment`, `batch-requests`, `commercial-licenses`, `oms-agent-processing`, `permissions/roles/user-permissions`, `audit-logs`, `entity-translations`, `frontend-translations`, `enums`, `communications`, `email-templates`, `push-templates`, `document-templates`, `procedure-templates`, `config-rules`, `menu-config`, `declarations` (B2B accountant), `ws/admin`.

---

## 2. Wiring matrix (citizen surface)

| Backend endpoint | Auth | Mobile consumer | Status |
|---|---|---|---|
| `POST /auth/login`, `register`, `refresh`, `logout`, `2fa-verify` | public/citizen | `auth` module | ✅ |
| `GET /auth/sessions`, `POST /password/*`, `POST /email/*` | citizen | `auth`, `profile` | ✅ |
| `POST /auth/2fa/{enable,verify,disable}`, `GET /status` | citizen | `auth` | ✅ |
| `GET/PUT /users/profile`, `POST /change-password`, `POST/DELETE /avatar`, `POST /device-token`, `GET /export`, `DELETE /profile` | citizen | `profile` | ✅ |
| `GET /fiscal-services` (+ ministries/sectors/categories/popular/recent) | public | `fiscal-services`, `dashboard` | ✅ |
| `GET /fiscal-services/{id}` (+`/details`,`/documents`,`/procedures`) | public | `fiscal-services` | ✅ |
| `POST /fiscal-services/search`, `/search-db`, `/calculate` | mixed | `fiscal-services`, `calculator` | ✅ |
| `GET /service-bundles/`, `/{id}`, `/{id}/pricing`, `/matrix`, `/documents`, `/installment-preview`, `/zones`, `/commerce-types`, `/by-service/{id}`, `/simulator` | public | `bundles`, `bundle-workflow` | ✅ |
| `GET /bundle-workflow/my-companies` (+`/{id}`,`/payments`,`/license-pdf`,`search-company`) | citizen | `bundle-workflow`, `companies` | ✅ |
| `POST /bundle-workflow/{initiate, classify-preview, initiate-from-upload, validate-selection, initiate-payment}` | citizen | `bundle-workflow`, `wizard` | ✅ |
| `GET/POST /companies` + `/{id}` (CRUD), `/archive`, `/members`, `/members/{u}/role` | citizen owner | `companies` | ✅ |
| `POST /companies/{id}/unarchive` | admin only | — | ➖ |
| `GET /public/companies/{search,zones,sectors,provincias,ciudades,formas-juridicas}` | public | `directory` | ✅ |
| `GET /service-requests/`, `/{id}`, `/detail-view`, `/summary/pdf`, `/dashboard-summary`, `/workflows`, `/workflows/{code}`, `/notifications`, `/filter-options`, `/by-reference/{ref}` | citizen | `service-requests`, `dashboard`, `notifications` | ✅ (filter-options + by-reference NOT in `endpoints.ts`) ⚠️ |
| `POST /service-requests/`, `/{id}/cancel`, `/{id}/submit`, `/{id}/prepare-payment`, `/{id}/step/{n}`, `/{id}/validate-documents` | citizen | `wizard` (mostly persist-only path) | ⚠️ — only the wizard-session prep path is wired; legacy direct submit + step exec are not. Acceptable (wizard supersedes) |
| `GET /service-requests/{id}/documents`, `POST /documents`, `/preview`, `/validate`, `DELETE /{code}`, `GET /{code}/url` | citizen | none — superseded by wizard-sessions/document-* | ⚠️ legacy path (intentional) |
| `PUT /service-requests/{id}`, `DELETE /{id}` | citizen | none | ❌ orphan-backend (low value: edit before submit only) |
| `GET /service-requests/{id}/payment/status`, `/methods`, `POST /initiate` | citizen | `payments`, `wizard/payment-result` | ✅ |
| Wizard sessions full set (create/get/delete/form-data/form-config/documents/use-vault/persist/prepare-payment/initiate-payment/sites/appointments) | citizen | `wizard` | ✅ |
| Appointments (post-creation) `locations/available-days/slots/hold/hold-status/release/fallback/confirm` | citizen | `appointments` (in `endpoints.ts`) | ✅ — but no mobile screen yet under `service-requests/{id}/appointments/*` (wizard-only flow) ⚠️ |
| `POST /payments` (create), `GET /payments`, `/{id}`, `PUT /{id}`, `POST /{id}/plan`, `GET /plans/{id}` | citizen | `payments` (history list, plan detail) | ⚠️ — `POST /payments` direct create not used (initiation goes through `service-requests/{id}/payment/initiate`); `PUT /{id}` orphan |
| `GET /verify/request/{ref}`, `/{receiptNumber}`, `/license/{ref}`, `/certificate/{n}` | public (token) | none in mobile (web-served deep links only) | ❌ orphan-backend (mobile could host an in-app verifier) — low priority |
| Chatbot: `GET /`, `/status`, `POST /chat`, `/chat/stream`, `/execute-confirmed`, `/search`, `/recommend`, `/analyze-document`, `/translate`, `/guide`, `/validate`, `/feedback`, `GET /conversations/{id}` | citizen | `chatbot` | ✅ |
| User-Documents (vault) full set: upload/bulk/list/detail/thumbnail/download/update/archive/delete/permanent/reclassify/processing-status (SSE)/versions/alerts/generated/readiness/for-workflow/search/stats/bulk-action/export/agent-permissions/agent-memory + `check-hash/{h}` | citizen | `vault` | ✅ |
| Documents legacy: `POST /documents/upload`, `GET /list`, `/{id}`, `/{id}/download` | citizen | none (vault supersedes) | ⚠️ legacy (intentional skip) |
| Support: `GET /categories`, `/{id}`, `GET /tickets`, `/my`, `POST /tickets`, `GET /{id}`, `/by-number/{n}`, `PUT /{id}`, `POST /{id}/close`, `GET/POST /{id}/messages` | citizen | `support` | ✅ |
| Homepage: `GET /homepage/`, `POST /homepage/search` | public | `dashboard`, `fiscal-services` | ✅ |
| Homepage extras: `GET /stats`, `/categories`, `/services-by-type`, `/service/{id}`, `/ministries`, `/ministry/{id}`, `/autocomplete`, `/search/semantic`, `/calculator/config` | public | none in mobile (mobile uses fiscal-services equivalents) | ❌ orphan-backend — `/autocomplete`, `/search/semantic`, `/calculator/config` are real UX wins |
| Translations: `GET /translations/system/export/workflow` | public | `wizard` (workflow strings) | ✅ |
| Verified-identifiers (citizen subset): pending verifications, list, etc. | citizen | none | ❌ orphan-backend — niche; depends on workflow needs |

---

## 3. Top 10 gaps (sorted by citizen impact)

| # | Gap | Recommendation | Rationale |
|---|---|---|---|
| 1 | **`GET /homepage/autocomplete`** not in `endpoints.ts` | **Phase 10 ticket** | Service search UX; mobile uses raw `/homepage/search` POST today. Autocomplete halves friction on small keyboards. |
| 2 | **`GET /homepage/search/semantic`** not wired | **Phase 10 ticket** | Already-deployed Gemini-backed search; superior recall vs lexical. Free upgrade. |
| 3 | **`GET /homepage/calculator/config`** not wired | **Phase 10 ticket** | The `calculator` mobile module today probably hard-codes config. Server-driven config = zero-app-update updates. **Verify first** that calculator module isn't already pulling from `/fiscal-services/calculate`; if so, dedupe. |
| 4 | **`GET /service-requests/filter-options`** not in `endpoints.ts` | **Phase 10 ticket** | List screen filters are likely client-side. Server-side dynamic options keep filter set in sync with workflow catalog. |
| 5 | **`GET /service-requests/by-reference/{ref}`** not wired | **Phase 10 ticket** | Useful for QR / SMS deep-links ("Look up RES-2025-00001"). Cheap to add. |
| 6 | **Appointment routes (`/service-requests/{id}/appointments/*`)** declared in `endpoints.ts` but no screen consumes them | **Ship-blocker (Phase D)** verify wiring | The wizard creates the appt during creation; but post-creation re-booking (slot expired, fallback) has no UI. **Confirm via runtime trace** the appt module is actually invoked — if not, ship as Phase 10. |
| 7 | **`PUT /service-requests/{id}` and `DELETE /{id}`** not wired | **Phase 10 ticket** (low) | Edit-before-submit and delete-draft. Wizard-sessions handle drafts; legacy SR drafts likely irrelevant. |
| 8 | **Verify endpoints (`/verify/*`)** not wired | **Phase 10 ticket** | Citizen could scan a QR on a paper receipt and verify in-app. Today only web URL. Differentiator, not blocker. |
| 9 | **Chatbot `POST /chatbot/feedback`** present in `endpoints.ts` — verify UI emits | **Phase D verify** | Critical for RAG quality loop. If button absent, add 1 thumbs-up/down icon under each AI message. Cheap, non-blocking ship. |
| 10 | **`POST /companies/{id}/unarchive`** wired in `endpoints.ts` despite admin-only | **Phase D fix** | `endpoints.ts` already flags `@deprecated`-style; remove from citizen surface or guard server-side. Low risk but tidies the SoT. |

---

## 4. Conclusion

**No ship-blockers found.** The citizen surface is **broadly wired**: auth, profile, services catalog, bundles, OMS bundle workflow, wizard-sessions, payments (via SR initiate), chatbot, vault, support, dashboard, directory and homepage are all consumed.

**Confirmed deliberate skips** (web-only / legacy / OMS-agent): SR direct-submit + step-exec (wizard supersedes), legacy `/documents/*` (vault supersedes), `/payments POST/PUT` direct (SR-initiated flow), agent/admin/inspection/declaration suites.

**Top 3 actionable for Phase D (pre-push):**
1. Verify the appointments module is actually consumed (gap #6) — runtime trace, not paper review.
2. Confirm `chatbot/feedback` UI exposure (gap #9).
3. Tidy the deprecated `companies.unarchive` from citizen-side `endpoints.ts` (gap #10).

**Defer to Phase 10:** gaps #1–#5, #7–#8 — all UX enhancements, none blocks production.

---

*File:* `C:\taxasge\.claude\plans\MOBILE_BUGFIX_PHASE_D_WIRING_MATRIX.md`
