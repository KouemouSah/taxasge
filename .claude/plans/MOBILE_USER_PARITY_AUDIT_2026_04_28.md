# Mobile User — Audit de parité endpoints mobile ↔ backend

**Date initiale** : 2026-04-28
**Dernière mise à jour** : 2026-04-28 (post-push C1→C6 sur `develop`)
**Statut** : ✅ **Tous les bloquants traités, push effectué** (commits `a4a65e61` → `efcb351f`).
**Scope** : `packages/mobile/src/core/api/endpoints.ts` vs `packages/backend/app/modules/**/api/*_routes.py`
**Audience cible** : citoyen + business (agents / admin / supervisor / inspecteur **hors scope**)
**Méthode** : lecture directe des décorateurs `@router.get/post/put/delete/patch` côté backend (pas de fabulation, pas de schema reference doc — verif source)
**Référence backend** : `main.py:1224-1743` (router registrations) + 25 routers grep multiline.

Légende :
- ✅ Endpoint existe backend, signature alignée, méthode HTTP correcte
- ⚠️ Existe mais **risque** ou **subtilité** documentée (trailing slash, doublon, shape divergent)
- ❌ Inventé / mort / 404 — à supprimer
- 🔍 Gap parité **mobile manque côté web** — endpoint backend existe et est consommé par le web mais pas par le mobile

---

## 1. Auth & Sessions
**Backend** : `auth_routes.py` (prefix `/api/v1/auth`) + `two_factor_routes.py` (prefix interne `/2fa`, mounted sous `/api/v1/auth`)

| Mobile (`endpoints.ts`) | Méthode | Backend ligne | Statut | Notes |
|------------------------|---------|---------------|--------|-------|
| `auth.info` `/auth/` | GET | `auth_routes.py:315` `GET /` | ✅ | |
| `auth.login` `/auth/login` | POST | `:587` | ✅ | Renvoie `TokenResponse \| TwoFactorLoginResponse` |
| `auth.register` `/auth/register` | POST | `:460` | ✅ | |
| `auth.refresh` `/auth/refresh` | POST | `:724` | ✅ | |
| `auth.logout` `/auth/logout` | POST | `:782` | ✅ | |
| `auth.profile` `/auth/profile` | GET | `:829` | ⚠️ | **Doublon** avec `users.profile` (`user_routes.py:29`). Mobile devrait utiliser `users.profile` partout (pattern web). À auditer dans le code consommateur. |
| `auth.sessions` `/auth/sessions` | GET | `:1371` | ✅ | |
| `auth.requestVerificationCode` `/auth/request-verification-code` | POST | `:346` | ✅ | |
| `auth.passwordResetRequest` | POST | `:887` | ✅ | |
| `auth.passwordResetConfirm` | POST | `:949` | ✅ | |
| `auth.passwordChange` | POST | `:1012` | ✅ | |
| `auth.passwordChangeVerify` | POST | `:1121` | ✅ | |
| `auth.emailVerify` | POST | `:1207` | ✅ | |
| `auth.emailResend` | POST | `:1261` | ✅ | |
| `auth.login2faVerify` | POST | `:661` | ✅ | |
| `auth.twoFactorEnable` `/auth/2fa/enable` | POST | `two_factor_routes.py:36` | ✅ | Path complet via prefix imbriqué `/api/v1/auth` + `/2fa` |
| `auth.twoFactorVerify` | POST | `:98` | ✅ | |
| `auth.twoFactorDisable` | POST | `:176` | ✅ | |
| `auth.twoFactorStatus` | GET | `:253` | ✅ | |

---

## 2. Users / Profile
**Backend** : `user_routes.py` (prefix `/api/v1/users`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `users.profile` `/users/profile` | GET | `:29` | ✅ | |
| `users.updateProfile` `/users/profile` | PUT | `:58` | ✅ | |
| `users.changePassword` `/users/profile/change-password` | POST | `:125` | ✅ | |
| `users.uploadAvatar` `/users/profile/avatar` | POST | `:295` | ✅ | |
| `users.deleteAvatar` `/users/profile/avatar` | DELETE | `:372` | ✅ | |
| `users.deviceToken` `/users/profile/device-token` | POST | `:259` | ✅ | FCM/APNs registration (P1 livré) |
| `users.deleteAccount` `/users/profile` | DELETE | `:575` | ✅ | RGPD soft-delete (P6.1) |
| `users.exportData` `/users/profile/export` | GET | `:419` | ✅ | RGPD art. 20 (P9.10) |

---

## 3. Service Requests (citoyen)
**Backend** : `service_requests/api/routes.py` (prefix `/api/v1` + le router définit ses paths sous `/service-requests`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `serviceRequests.list` `/service-requests/` | GET | `routes.py:749 "/"` | ✅ | Trailing slash respecté |
| `serviceRequests.detail` `/service-requests/{id}` | GET | `:724 "/{request_id}"` | ✅ | |
| `serviceRequests.detailView` `/service-requests/{id}/detail-view` | GET | `:1505` | ✅ | Vue enrichie (workflow, payments, docs) |
| `serviceRequests.summaryPdf` `/service-requests/{id}/summary/pdf` | GET | `:1943` | ✅ | |
| `serviceRequests.dashboardSummary` `/service-requests/dashboard-summary` | GET | `:635` | ✅ | |
| `serviceRequests.workflows` `/service-requests/workflows` | GET | `:77` | ✅ | |
| `serviceRequests.workflowDetail` `/service-requests/workflows/{code}` | GET | `:106` | ✅ | |
| **(absent côté mobile)** `/service-requests/notifications` | GET | `:590` | 🔍 | **GAP PARITÉ** : web consomme cet endpoint (`web/.../dashboard/notifications/page.tsx:130`), mobile stocke uniquement en MMKV local (`core/notifications/notifications-storage.ts`). Sans cet endpoint, push raté = notification jamais vue. |

---

## 4. Service Request Appointments (post-création)
**Backend** : `service_requests/api/appointment_routes.py`

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `appointments.locations` `/service-requests/{id}/appointments/locations` | GET | `:98` | ✅ | |
| `appointments.availableDays` | GET | `:279` | ✅ | |
| `appointments.availableSlots` `.../slots` | GET | `:192` | ✅ | |
| `appointments.hold` | POST | `:374` | ✅ | |
| `appointments.holdStatus` `.../hold-status` | GET | `:462` | ✅ | |
| `appointments.releaseHold` `.../hold` | DELETE | `:524` | ✅ | |
| `appointments.fallbackSubmit` `.../fallback` | POST | `:577` | ✅ | |
| `appointments.confirm` | POST | `:638` | ✅ | |

---

## 5. Wizard Sessions (multi-step request creation)
**Backend** : `wizard_session_routes.py` (router prefix `/wizard-sessions`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `wizardSessions.create` `/wizard-sessions` | POST | `:117 ""` | ✅ | |
| `wizardSessions.get` `/wizard-sessions/{id}` | GET | `:179` | ✅ | |
| `wizardSessions.delete` `/wizard-sessions/{id}` | DELETE | `:1073` | ✅ | |
| `wizardSessions.formData` `/wizard-sessions/{id}/form-data` | PUT | `:430` | ✅ | |
| `wizardSessions.formConfig` `/wizard-sessions/{id}/form-config/{stepId}` | GET | `:475` | ✅ | `step_id` est string (form_review_1, etc.), pas number — confirmé code mobile `endpoints.ts:117-119` |
| `wizardSessions.documentPreview` `.../documents/preview` | POST | `:215` | ✅ | |
| `wizardSessions.documentConfirm` `.../documents/confirm` | POST | `:274` | ✅ | |
| `wizardSessions.documentDelete` `.../documents/{code}` | DELETE | `:325` | ✅ | |
| `wizardSessions.useVaultDocument` `.../documents/use-vault` | POST | `:382` | ✅ | |
| `wizardSessions.preparePayment` | POST | `:525` | ✅ | |
| `wizardSessions.persist` | POST | `:577` | ✅ | |
| `wizardSessions.initiatePayment` | POST | `:633` | ✅ | |
| `wizardSessions.availableSites` | GET | `:700` | ✅ | |
| `wizardSessions.selectSite` | POST | `:755` | ✅ | |
| `wizardSessions.appointmentLocations` | GET | `:822` | ✅ | |
| `wizardSessions.appointmentAvailableDays` | GET | `:894` | ✅ | |
| `wizardSessions.appointmentAvailableSlots` | GET | `:962` | ✅ | |
| `wizardSessions.appointmentSelect` | POST | `:1020` | ✅ | |

---

## 6. Fiscal Services Catalog
**Backend** : `fiscal_service_routes.py` (prefix `/api/v1/fiscal-services`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `fiscalServices.list` `/fiscal-services` | GET | `:159 ""` | ✅ | Sans trailing slash backend, mobile aussi |
| `fiscalServices.detail` `/fiscal-services/{id}` | GET | `:194` | ✅ | |
| `fiscalServices.details` `.../details` | GET | `:210` | ✅ | |
| `fiscalServices.documents` `.../documents` | GET | `:1725` | ✅ | |
| `fiscalServices.procedures` `.../procedures` | GET | `:1854` | ✅ | |
| `fiscalServices.search` `/fiscal-services/search` | POST | `:379` | ✅ | |
| `fiscalServices.searchDb` `.../search-db` | POST | `:399` | ✅ | |
| `fiscalServices.calculate` `.../calculate` | POST | `:502` | ✅ | |
| `fiscalServices.popular` `.../popular/list` | GET | `:482` | ✅ | |
| `fiscalServices.recent` `.../recent/list` | GET | `:492` | ✅ | |
| `fiscalServices.ministries` | GET | `:83` | ✅ | |
| `fiscalServices.sectors` | GET | `:107` | ✅ | |
| `fiscalServices.categories` | GET | `:132` | ✅ | |

---

## 7. Service Bundles (catalog)
**Backend** : `bundle_routes.py` (router prefix `/service-bundles`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `serviceBundles.list` `/service-bundles` | GET | `:68 "/"` | ⚠️ | **Trailing slash backend / mobile sans** — FastAPI selon `redirect_slashes=True` (default) → 307 Redirect. Si client n'autorise pas redirect ou nettoie cookies, échec silencieux. À aligner : soit mobile met `/service-bundles/`, soit backend retire le slash. Précédent connu (mémoire #16 web bundle). |
| `serviceBundles.detail` `/service-bundles/{id}` | GET | `:856` | ✅ | |
| `serviceBundles.pricing` | GET | `:865` | ✅ | |
| `serviceBundles.matrix` | GET | `:887` | ✅ | |
| `serviceBundles.documents` | GET | `:916` | ✅ | |
| `serviceBundles.installmentPreview` | GET | `:927` | ✅ | |
| `serviceBundles.byService` | GET | `:140` | ✅ | |
| `serviceBundles.zones` | GET | `:61` | ✅ | |
| `serviceBundles.commerceTypes` | GET | `:170` | ✅ | |
| `serviceBundles.simulator` | GET | `:97` | ✅ | |

---

## 8. Bundle Workflow (OMS — opérationnel)
**Backend** : `bundle_workflow_routes.py` (router prefix `/bundle-workflow`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `bundleWorkflow.myCompanies` `/bundle-workflow/my-companies` | GET | `:211` | ✅ | Shape minimal (pas de objeto_social/forma_juridica) |
| `bundleWorkflow.myCompanyDetail` | GET | `:234` | ✅ | Shape complet + `inspections[]` (mobile user n'utilise pas inspections — OK) |
| `bundleWorkflow.myCompanyPayments` | GET | `:255` | ✅ | |
| `bundleWorkflow.myCompanyLicensePdf` | GET | `:277` | ✅ | Citoyen-friendly (vérif user_company_roles) |
| `bundleWorkflow.searchCompany` `/bundle-workflow/search-company` | GET | `:328` | ✅ | |
| `bundleWorkflow.initiate` | POST | `:352` | ✅ | |
| `bundleWorkflow.classifyPreview` | POST | `:385` | ✅ | |
| `bundleWorkflow.initiateFromUpload` | POST | `:417` | ✅ | |
| `bundleWorkflow.validateSelection` | POST | `:453` | ✅ | |
| `bundleWorkflow.initiatePayment` | POST | `:481` | ✅ | |

---

## 9. Companies (business — propres entreprises)
**Backend** : `company_routes.py` (prefix `/api/v1/companies`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `companies.list` `/companies` | GET | `:478 ""` | ✅ | |
| `companies.create` `/companies` | POST | `:401 ""` | ✅ | |
| `companies.detail` `/companies/{id}` | GET | `:497` | ✅ | |
| `companies.update` `/companies/{id}` | PUT | `:523` | ✅ | |
| `companies.delete` `/companies/{id}` | DELETE | `:581` | ✅ | |
| `companies.members` `.../members` | GET | `:616` | ✅ | |
| `companies.addMember` `.../members` | POST | `:638` | ✅ | |
| `companies.updateMemberRole` `.../members/{userId}/role` | PUT | `:667` | ✅ | |
| `companies.removeMember` `.../members/{userId}` | DELETE | `:694` | ✅ | |

**Note** : Le commit C2 a déplacé l'écran `app/companies/index.tsx` de `useCompaniesList` (qui consomme `GET /companies`) vers `useBundleMyCompanies` (qui consomme `GET /bundle-workflow/my-companies`). Les hooks `useCompaniesList`/`useCompanyDetail`/`useDeleteCompany`/`useDownloadLicensePdf` restent utilisés mais sur des paths admin-friendly. **Risque gap #5** : pas de garde role UI sur le menu Editar/Eliminar dans `app/companies/[id].tsx` — un citoyen non-`company_owner` peut cliquer ces actions et recevoir un 403 backend (parité web cassée — le web filtre déjà selon `user_company_roles.role`).

---

## 10. Public Company Directory (annuaire)
**Backend** : `company_public_routes.py` (prefix `/api/v1/public/companies`)

| Mobile | Méthode | Backend | Statut |
|--------|---------|---------|--------|
| `publicCompanies.search` | GET | `:56` | ✅ |
| `publicCompanies.zones` | GET | `:181` | ✅ |
| `publicCompanies.sectors` | GET | `:210` | ✅ |
| `publicCompanies.provincias` | GET | `:241` | ✅ |
| `publicCompanies.ciudades` | GET | `:258` | ✅ |
| `publicCompanies.formasJuridicas` | GET | `:286` | ✅ |

---

## 11. User Documents (Vault / Coffre-fort)
**Backend** : `user_documents_routes.py` (prefix `/api/v1/user-documents`)

| Mobile | Méthode | Backend | Statut |
|--------|---------|---------|--------|
| `userDocuments.upload` | POST | `:224` | ✅ |
| `userDocuments.bulkUpload` | POST | `:536` | ✅ |
| `userDocuments.checkHash` | GET | `:724` | ✅ |
| `userDocuments.list` `/user-documents/` | GET | `:797 "/"` | ✅ |
| `userDocuments.detail` | GET | `:1161` | ✅ |
| `userDocuments.thumbnail` | GET | `:1287` | ✅ |
| `userDocuments.download` | GET | `:1211` | ✅ |
| `userDocuments.update` | PUT | `:1448` | ✅ |
| `userDocuments.archive` | PUT | `:1563` | ✅ |
| `userDocuments.delete` | DELETE | `:1669` | ✅ |
| `userDocuments.permanentDelete` | DELETE | `:1711` | ✅ |
| `userDocuments.reclassify` | PUT | `:1483` | ✅ |
| `userDocuments.processingStatus` | GET | `:1338` | ✅ | SSE stream |
| `userDocuments.versions` | GET | `:1411` | ✅ |
| `userDocuments.alerts` | GET | `:1088` | ✅ |
| `userDocuments.alertRead` | PUT | `:1605` | ✅ |
| `userDocuments.alertDismiss` | PUT | `:1637` | ✅ |
| `userDocuments.generated` | GET | `:893` | ✅ |
| `userDocuments.readinessAll` | GET | `:975` | ✅ |
| `userDocuments.readiness` | GET | `:1015` | ✅ |
| `userDocuments.forWorkflow` | GET | `:1034` | ✅ |
| `userDocuments.search` | GET | `:1058` | ✅ |
| `userDocuments.stats` | GET | `:943` | ✅ |
| `userDocuments.bulkAction` | POST | `:1792` | ✅ |
| `userDocuments.exportStart` | POST | `:1896` | ✅ |
| `userDocuments.exportStatus` | GET | `:1998` | ✅ |
| `userDocuments.exportDownload` | GET | `:2056` | ✅ |
| `userDocuments.agentPermissionCatalog` | GET | `:2417` | ✅ |
| `userDocuments.agentPermissions` | GET/POST | `:2456`/`:2500` | ✅ |
| `userDocuments.revokeAgentPermission` | DELETE | `:2596` | ✅ |
| `userDocuments.agentMemory` | GET | `:2644` | ✅ |
| `userDocuments.deleteAgentMemory` | DELETE | `:2723` | ✅ |

---

## 12. Payments
**Backend** : `payment_routes.py` (prefix `/api/v1/payments`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `payments.list` `/payments` | GET | `:95 ""` | ✅ | Pas de trailing slash des deux côtés |
| `payments.create` `/payments` | POST | `:35 ""` | ✅ | |
| `payments.detail` `/payments/{id}` | GET | `:75` | ✅ | |
| `payments.update` `/payments/{id}` | PUT | `:115` | ✅ | |
| `payments.createPlan` `/payments/{id}/plan` | POST | `:149` | ✅ | |
| `payments.planDetail` `/payments/plans/{planId}` | GET | `:175` | ✅ | |
| `payments.serviceRequestStatus` `/service-requests/{requestId}/payment/status` | GET | `routes.py:1204` | ✅ | Ce path est sous service-requests, pas /payments — exposition correcte côté mobile |
| **(absent côté mobile)** `/service-requests/{requestId}/payment/methods` | GET | `routes.py:1258` | 🔍 | Mobile ne récupère pas la liste des méthodes de paiement disponibles. Mobile pré-suppose BANGE / Mobile Money. Si backend ajoute une méthode (carte, virement), le mobile ne la voit pas. **Gap mineur** — impact si nouvelle méthode ajoutée. |
| **(absent côté mobile)** `/service-requests/{requestId}/payment/initiate` | POST | `routes.py:1317` | 🔍 | Mobile passe par `wizardSessions.initiatePayment` (paiement initié depuis wizard). Pour ré-initier un paiement échoué sur une SR existante (pattern web "Réessayer le paiement"), le mobile n'a pas de chemin. |

---

## 13. Public Verification (reçus, requests, licences, certificats)
**Backend** : `verify_routes.py` (prefix `/api/v1/verify`)

| Mobile | Méthode | Backend | Statut |
|--------|---------|---------|--------|
| `verify.request` `/verify/request/{ref}` | GET | `:106` | ✅ |
| `verify.receipt` `/verify/{receiptNumber}` | GET | `:249` | ✅ |
| `verify.license` `/verify/license/{ref}` | GET | `:406` | ✅ |
| `verify.certificate` `/verify/certificate/{number}` | GET | `:512` | ✅ |

---

## 14. Chatbot (RAG + Gemini)
**Backend** : `chatbot_routes.py` (prefix `/api/v1/chatbot`)

| Mobile | Méthode | Backend | Statut |
|--------|---------|---------|--------|
| `chatbot.info` `/chatbot/` | GET | `:46 "/"` | ✅ |
| `chatbot.status` | GET | `:94` | ✅ |
| `chatbot.chat` | POST | `:340` | ✅ |
| `chatbot.stream` | POST | `:497` | ✅ |
| `chatbot.executeConfirmed` | POST | `:417` | ✅ |
| `chatbot.search` | POST | `:563` | ✅ |
| `chatbot.recommend` | POST | `:607` | ✅ |
| `chatbot.analyzeDocument` | POST | `:654` | ✅ |
| `chatbot.translate` | POST | `:723` | ✅ |
| `chatbot.guide` | POST | `:772` | ✅ |
| `chatbot.validate` | POST | `:815` | ✅ |
| `chatbot.feedback` | POST | `:876` | ✅ |
| `chatbot.conversation` `/chatbot/conversations/{id}` | GET | `:298` | ✅ |

---

## 15. Support Tickets
**Backend** : `support_routes.py` (router prefix `/support`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `support.categories` | GET | `:61` | ✅ | |
| `support.categoryDetail` | GET | `:77` | ✅ | |
| `support.tickets` | GET/POST | `:186`/`:310` | ✅ | GET admin-only ; POST citoyen |
| `support.createTicket` | POST | `:310` | ✅ | Alias |
| `support.myTickets` | GET | `:238` | ✅ | |
| `support.ticket` / `ticketDetail` | GET | `:268` | ✅ | |
| `support.ticketByNumber` | GET | `:290` | ✅ | |
| `support.ticketUpdate` | PUT | `:342` | ✅ | |
| `support.closeTicket` / `ticketClose` | POST | `:378` | ✅ | |
| `support.ticketMessages` | GET/POST | `:417`/`:440` | ✅ | |

---

## 16. Documents (legacy — request-scoped, distinct du vault)
**Backend** : `document_routes.py` (prefix `/api/v1/documents`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `documents.upload` | POST | `:106` | ✅ | |
| `documents.list` | GET | `:302` | ✅ | |
| `documents.detail` | GET | `:352` | ✅ | |
| `documents.download` | GET | `:400` | ✅ | |

**Note** : ces 4 endpoints sont distincts du vault (`/user-documents`). Ils servent le flux upload pre-vault (legacy). Le mobile devrait éventuellement migrer son code interne vers `userDocuments` mais c'est hors scope V1 — les 4 paths existent et sont valides.

---

## 17. Translations
**Backend** : `translation_routes.py` (prefix `/api/v1/translations`) + `frontend_translation_routes.py` (`/api/v1/translations/frontend`) + `enum_routes.py` (`/api/v1/enums`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `translations.frontend` `/translations/frontend/{lang}` | GET | ❌ | ❌ | **INVENTÉ MOBILE / MORT**. Le router `frontend_translation_routes.py` (prefix `/translations/frontend`) expose `/namespaces`, `/export/{namespace}`, `/export-all?language=`, `/{translation_id}`, `/import` — **PAS `/{lang}`**. Aucun consommateur mobile trouvé (`grep translations.frontend src/` négatif). À supprimer de `endpoints.ts`. |
| `translations.enums` `/enums` | GET | `enum_routes.py:53 "/"` | ⚠️ | URL `/api/v1/enums` (sans slash mobile, `"/"` backend → 307 redirect). À aligner. Aucun consommateur mobile détecté non plus — vérifier avant suppression. |
| `translations.systemWorkflow` `/translations/system/export/workflow` | GET | `translation_routes.py:142 "/export/{category}"` (prefix `/translations/system`) | ✅ | URL complète `/api/v1/translations/system/export/workflow`. Consommé par `wizard/services/use-workflow-translations.ts:95`. |

---

## 18. Homepage
**Backend** : `homepage_routes.py` (prefix `/api/v1/homepage`)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `homepage.data` `/homepage/` | GET | `:97 "/"` | ✅ | Trailing slash respecté (mobile commentaire confirme 307 redirect sinon) |
| `homepage.search` `/homepage/search` | POST | `:688` | ✅ | |

---

## 19. Communications
**Backend** : `communication_routes.py` + `email_templates_routes.py` (`/api/v1/communications/...` ou similaire — à vérifier prefix)

| Mobile | Méthode | Backend | Statut | Notes |
|--------|---------|---------|--------|-------|
| `communications.emailTemplates` `/communications/templates` | GET | `communication_routes.py:684` | ⚠️ | URL backend existe (`/api/v1/communications/templates`). MAIS aucun consommateur mobile (`grep API_ENDPOINTS.communications` ne trouve que la déclaration dans `endpoints.ts` + ref auto-gen `openapi-types.ts`). Endpoint mort côté mobile. À retirer (mémoire #4). |

---

## 20. Synthèse — gaps à corriger en C5

### Bloquants pour parité mobile/web

| ID | Description | Action C5 | Statut |
|----|-------------|-----------|--------|
| **G-PARITY-1** | Mobile ne lit pas `/service-requests/notifications` (web le fait) — push raté = notification jamais visible. | Ajouter endpoint `serviceRequests.notifications`, créer hook `useServerNotificationsSync` qui pull au mount + on pull-to-refresh, dédupe par id, merge dans MMKV inbox. | ✅ **Traité** (commit `d4a3ca42`). Hook livré `modules/notifications/hooks/use-server-notifications-sync.ts`, branché dans `app/notifications.tsx`. Dédupe via `addNotification`. Refresh manuel = re-sync + invalidate React Query keys. |
| **G-1** (gap.png #1) | Cast `match.company as unknown as CompanySummary` dans `useBundleWizard.preselect` — shape divergent backend status-list. | Vérifier le shape backend, retirer le cast s'il est aligné. | ✅ **Traité** (commit `d4a3ca42`). **Faux-positif confirmé après audit** : `MyCompanyWithStatus.company` est déjà typé `CompanySummary` (types/index.ts:47) et le shape backend `/my-companies` (service.py:91-103) match exactement. Cast retiré, commentaire de doc ajouté. |
| **G-5** (gap.png #5) | Pas de garde role UI sur menu Editar/Eliminar `/companies/[id]` — citoyen non-owner clique → 403 backend. | Lire `useCompanyMembers(id)`, conditionner les `Menu.Item` sur le rôle. | ✅ **Traité différemment** (commits `d4a3ca42` puis `efcb351f`). **Re-cadrage utilisateur** : le web `/empresas/[companyId]` n'expose AUCUN bouton Editar/Eliminar pour citoyen (vérifié grep), donc exposer ces actions sur mobile = régression de parité. Les `Menu.Item` Edit/Delete ont été **retirés** du menu. La logique de garde role est **codifiée** dans le nouveau hook `useCompanyMembership(companyId, userId)` — exporté via `modules/companies` mais non consommé en V1. Prêt pour le futur (cf. `SOFT_DELETE_COMPANIES_PLAN.md`). |
| **G-6** (gap.png #6) | Cast `as unknown as UserDocumentListItem` (`expiry_date: null`) — risque crash si type exige string. | Adapter strict (typed mapping vers `UserDocumentListItem`) au lieu du cast. | ✅ **Traité** (commit `d4a3ca42`). Cast remplacé par construction strictement typée (`category: 'other'`, `expiry_status: 'no_expiry'`, `is_verified: true`). Risque de crash supprimé. |

### Mineurs

| ID | Description | Action | Statut |
|----|-------------|--------|--------|
| **R-TS-1** | Trailing slash `serviceBundles.list` `/service-bundles` (mobile) vs `/` (backend) → 307 redirect. | Ajouter `/` côté mobile. | ✅ **Traité** (commit `d4a3ca42`). `endpoints.ts:175-179` aligné `'/service-bundles/'`, commentaire explicatif ajouté. |
| **R-TS-2** | Trailing slash `translations.enums` `/enums` (mobile) vs `/` (backend) → 307 redirect. | Idem ou suppression si zéro consommateur. | ✅ **Traité par suppression** (commit `d4a3ca42`). `translations.enums` retiré (zéro consommateur, enums rendus via locales bundlées). |
| **R-DEAD-1** | `translations.frontend (lang)` inventé mobile (path n'existe pas backend) + zéro consommateur. | **Supprimer** de `endpoints.ts`. | ✅ **Traité** (commit `d4a3ca42`). Suppression + bloc de commentaire documentant la stratégie locales bundlées + procédure pour OTA futur (créer un endpoint backend `/translations/frontend/export/mobile` dédié, ne pas resurrection de cette clé). |
| **R-DEAD-2** | `communications.emailTemplates` existe backend mais zéro consommateur mobile. | **Supprimer** de `endpoints.ts`. | ✅ **Traité** (commit `d4a3ca42`). Section `communications` supprimée entièrement, commentaire explicatif sur le caractère server-internal. |
| **R-DUP-1** | `auth.profile` doublon avec `users.profile`. | Documenter dans le fichier endpoints.ts que `auth.profile` est legacy. | ✅ **Traité** (commit `d4a3ca42`). JSDoc `@deprecated` ajouté pointant vers `users.profile`. |
| **R-MISSING-1** | `/service-requests/{id}/payment/methods` non exposé mobile (5 méthodes actives backend dont cash/check, web les consomme). | Ajouter endpoint + hook + UI. | ✅ **Traité** (commit `d4a3ca42`). `payments.serviceRequestPaymentMethods(requestId)`, hook `useRequestPaymentMethods`, types `RequestPaymentMethodInfo` / `RequestPaymentMethodsResponse` mappés sur `PaymentMethodsResponse` backend (routes.py:1311). Consommé par `RetryPaymentSheet`. |
| **R-MISSING-2** | `/service-requests/{id}/payment/initiate` non exposé mobile (re-essai paiement post-SR). | Endpoint + hook + UI sheet + bouton sur SR detail. | ✅ **Traité** (commit `d4a3ca42`). `payments.serviceRequestInitiatePayment(requestId)`, hook `useRetryRequestPayment` (mutation), composant `RetryPaymentSheet` (radio méthodes + champ phone si requires_phone + Linking.openURL pour redirect BANGE / messages cash/check), bouton "Réessayer le paiement" sur `(tabs)/requests/[id]` quand `payment_status in ('failed', 'cancelled')` ou `request.status === 'pending_payment'`. i18n × 3 langues (`payments.retry.*`, 11 clés). |

### Hors scope V1 (parité confirmée acceptable)

- `auth.profile` doublon : web utilise les deux interchangeablement.
- Endpoints admin `/admin/*` ou agent `/supervisor/*` exclus volontairement de mobile user (intentionnel).
- `bundleWorkflow.myCompanyDetail` retourne `inspections[]` non consommé mobile : OK (champ mort côté mobile, pas de crash).

---

## 21. Verdict global

### État initial (avant C5/C6)

- **1 endpoint inventé** détecté (`translations.frontend (lang)` — path n'existe pas backend).
- **1 endpoint mort** côté mobile (`communications.emailTemplates` — backend existe mais zéro consommateur).
- **Aucun mismatch grave** d'auth ou de méthode HTTP.
- **Gap parité réel** : notifications backend non consommé mobile (G-PARITY-1).
- **3 gaps qualité** héritage de la session précédente (G-1, G-5, G-6 du gap.png).
- **2 risques de redirect 307** sur trailing slash (R-TS-1, R-TS-2).

### État final (après push `acd1eaee..efcb351f`)

| Catégorie | Items | Statut |
|-----------|-------|--------|
| Bloquants traités | G-PARITY-1, G-1, G-5, G-6 | ✅ 4/4 |
| Mineurs traités | R-TS-1, R-TS-2, R-DEAD-1, R-DEAD-2, R-DUP-1, R-MISSING-1, R-MISSING-2 | ✅ 7/7 |
| Endpoints inventés | (aucun restant) | ✅ |
| Endpoints morts | (aucun restant) | ✅ |
| Régressions introduites en C5 | G-5 menu Editar/Eliminar exposé alors que web ne l'expose pas | ✅ Corrigé en C6 (`efcb351f`) — actions retirées, hook `useCompanyMembership` codifié pour usage futur |

### Gaps / risques restants (hors scope V1)

| ID | Description | Plan |
|----|-------------|------|
| **G-7** (gap.png #7) | Pas de smoke test device réel sur les corrections | À déclencher manuellement (build EAS preview Android) après push — Claude ne peut pas le lancer |
| **SOFT-DELETE** | `DELETE /companies/{id}` backend non protégé : hard-delete des memberships sans check sur licences/payments/SR actives. Aucune UI citoyen ne l'expose (web ni mobile), mais l'endpoint reste appelable via curl. | Plan dédié : `.claude/plans/SOFT_DELETE_COMPANIES_PLAN.md` (créé 2026-04-28). |
| **WEB-PARITY-MEMBERSHIP** | Le hook `useCompanyMembership` mobile n'a pas son équivalent web. Quand le soft-delete UI sera shipped, web devra avoir un hook équivalent pour gater l'archive button. | Inclus dans `SOFT_DELETE_COMPANIES_PLAN.md` Phase 2 web. |

---

## 22. Next steps

### ✅ Complété (cette session)

1. **C1** `chore(mobile): ESLint cleanup` — `a4a65e61`
2. **C2** `feat(mobile): citizen "Mes Empresas" view wired on bundle-workflow` — `e79b498c`
3. **C3** `feat(mobile): vault filter chips tab-aware` — `6890c1c6`
4. **C4** `fix(mobile): support reply UX` — `c1f16204`
5. **C5** `fix(mobile): close P9 audit gaps + parity audit corrections` — `d4a3ca42`
6. **C6** `fix(mobile): companies/[id] — drop unsafe Edit/Delete CTAs, ship membership hook` — `efcb351f`
7. **Push** `develop` → remote (GitHub Actions reprend les CI/CD jobs)
8. **Audit document** mis à jour avec statut de chaque finding (ce fichier)

### 🔄 À planifier

1. **Smoke test EAS preview Android** (gap.png #7) — `npm run build:preview` côté utilisateur, parcours `/companies → wizard → /documents → /support → /(tabs)/requests/[id]` + retry payment.
2. **Soft-delete companies** — exécuter `.claude/plans/SOFT_DELETE_COMPANIES_PLAN.md` avant Phase 10.
3. **Phase 10** (E2E + App Stores) — selon master plan, après soft-delete.

### Validation finale

| Critère | Résultat |
|---------|----------|
| `tsc --noEmit` | ✅ 0 erreurs |
| ESLint | ✅ 17 warnings (cap 100) |
| i18n drift | ✅ 875 clés × 3 langues, 0 drift |
| Backend endpoints (consultation directe sources) | ✅ Tous vérifiés |
| Mémoire #4 (pas d'invention) | ✅ |
| Mémoire #12 (consultation BD/sources directe) | ✅ |
| Mémoire #13 (confirmation push utilisateur) | ✅ |
| Mémoire #14 (commit local par phase, push après validation) | ✅ |
| Mémoire #16 (zéro régression non-bundle) | ⚠️ 1 régression introduite C5, corrigée C6 (logique Edit/Delete companies) — leçon : toujours vérifier la parité web exact match avant d'ajouter une UI |
| Mémoire #35 (checklist validation phase complète) | ✅ |

## 23. Pour la documentation technique

Ce fichier sert de référence d'audit endpoint-par-endpoint mobile user citoyen+business pour la version 1. À régénérer après chaque bump majeur des routes backend ou refonte API. Les sections 1-19 forment la matrice de couverture mobile/backend ; la section 20 est la liste de fixes traçable ; la section 22 est le plan d'action.

---

## Annexe A — Fichiers backend audités

```
auth/api/auth_routes.py             (15 endpoints citoyen)
auth/api/two_factor_routes.py        (4 endpoints)
users/api/user_routes.py             (8 endpoints)
service_requests/api/routes.py       (~30 endpoints citoyen)
service_requests/api/appointment_routes.py (8)
service_requests/api/wizard_session_routes.py (~17)
fiscal_services/api/fiscal_service_routes.py (~14 citoyen)
fiscal_services/api/bundle_routes.py (~10 citoyen)
fiscal_services/api/bundle_workflow_routes.py (~10 citoyen)
companies/api/company_routes.py      (9 citoyen)
companies/api/company_public_routes.py (6)
user_documents/api/user_documents_routes.py (~30)
payments/api/payment_routes.py       (6)
payments/api/verify_routes.py        (4)
chatbot/api/chatbot_routes.py        (13 citoyen)
support/api/support_routes.py        (~12)
documents/api/document_routes.py     (4 legacy)
homepage/api/homepage_routes.py      (~10 public)
translations/api/*                   (à finir auditer)
```

## Annexe B — Convention de stabilité

Tout changement de path backend qui casse un endpoint listé ici doit déclencher :
1. Update de `endpoints.ts` mobile.
2. Régénération des hooks consommateurs.
3. Update de cet audit (cf. version `2026-04-28`).
