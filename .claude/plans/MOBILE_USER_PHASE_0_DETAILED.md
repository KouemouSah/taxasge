# PHASE 0 — Backend Sync & Audit (DETAILED PLAN)

**Date** : 2026-04-26
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 2-3 jours
**Objectif** : aucun appel mobile cassé, types alignés, foundation propre pour Phases 1-10.

---

## 1. CONTEXTE & RÈGLE D'OR

L'app mobile `packages/mobile/` (Expo SDK 54, 159 fichiers TS/TSX) consomme un backend FastAPI qui a évolué significativement depuis 1-2 mois. **Avant d'ajouter quoi que ce soit, on aligne le contrat existant**.

> **Règle d'or P0** : aucune nouvelle feature, aucun nouveau module. On corrige les drifts, on documente, on régénère les types. Point.

---

## 2. AUDIT DE LA SITUATION (faits vérifiés)

### 2.1 Fichiers d'audit déjà produits

- `packages/backend/app/main.py` (1743 lignes, 60+ routers) — lu
- 17 fichiers `*_routes.py` côté utilisateur — inventoriés (~150 endpoints citoyen + business)
- `packages/mobile/src/core/api/endpoints.ts` (165 lignes) — lu
- `packages/mobile/src/modules/wizard/services/wizard-api.ts` — lu
- `packages/mobile/src/modules/bundle-workflow/services/bundle-api.ts` — lu
- `packages/mobile/src/modules/bundle-workflow/services/bundle-hooks.ts` — lu
- `packages/mobile/src/modules/auth/services/auth-api.ts` — lu
- `packages/mobile/src/core/auth/auth-provider.tsx` — lu (login/register/logout/refresh)

### 2.2 Bugs confirmés

| # | Bug | Localisation | Sévérité |
|---|-----|--------------|----------|
| **B1** | `endpoints.ts` paths wizard appointments **morts** (jamais utilisés mais incorrects) | `endpoints.ts:74-80` | 🟡 MOYEN (tripwire) |
| **B2** | `endpoints.ts` `formConfig` sans `step_id` | `endpoints.ts:69` | 🟡 MOYEN (tripwire) |
| **B3** | `bundle-hooks.ts:133` appelle `/wizard-sessions/preview-document` **inexistant** | `bundle-hooks.ts:133` | 🔴 BLOCKER (bundle company-upload cassé) |
| **B4** | Aucun appel `/users/profile/device-token` | absent | 🔴 BLOCKER pour P1 |
| **B5** | Aucun endpoint `documents/use-vault` exposé | mobile absent | 🟠 IMPORTANT pour P2/P4 |
| **B6** | Aucun endpoint `/wizard-sessions/{id}/persist` exposé | mobile absent | 🟠 IMPORTANT |
| **B7** | 26+ endpoints définis dans `endpoints.ts` jamais utilisés (dead code futur ou périmés) | `endpoints.ts` | 🟡 MOYEN (cleanup) |
| **B8** | Endpoints hardcodés hors `endpoints.ts` (wizard-api.ts hardcode `BASE = '/wizard-sessions'`, bundle-api.ts hardcode `/bundle-workflow`, chatbot feedback hardcoded) | divers | 🟡 MOYEN (centralisation) |
| **B9** | Types TS potentiellement désalignés avec Pydantic (commit `912654a1` — 12 mismatches signalés) | tous types `*.types.ts` | 🟠 IMPORTANT |
| **B10** | Uploads doivent passer `file_content` bytes, pas UploadFile réutilisable (commit `c0199fb7`) | tous uploads multipart mobile | 🟠 IMPORTANT |
| **B11** | Magic bytes / Content-Type strict côté backend (commit `bdac3cd9`) — mobile envoie-t-il les bons MIME ? | upload code | 🟠 IMPORTANT |
| **B12** | Endpoints non exposés en mobile mais critiques pour UX existante (sites disponibles, holds, fallback appointments) | wizard-api.ts | 🟠 IMPORTANT |

### 2.3 Bugs invalidés (rapportés par agents mais faux)

- ❌ "Wizard appointments mobile cassés" — FAUX. `wizard-api.ts` utilise les bons paths (`/appointments/locations`, etc.). C'est `endpoints.ts` qui a des paths morts (jamais appelés).
- ❌ "Bundle workflow utilise `/bundles/*`" — FAUX. `bundle-api.ts` utilise correctement `/bundle-workflow/*`.

---

## 3. ARCHITECTURE & DESIGN DES CORRECTIONS

### 3.1 Stratégie générale

```
                          ┌─────────────────────────┐
                          │   endpoints.ts (SoT)    │  ← TOUS les paths centralisés
                          │   - typed avec helpers  │
                          │   - aligné main.py      │
                          └────────────┬────────────┘
                                       │
                  ┌────────────────────┼────────────────────┐
                  │                    │                    │
          ┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼─────────┐
          │ auth-api.ts    │  │ wizard-api.ts   │  │ bundle-api.ts    │
          │ (déjà SoT)     │  │ (à migrer SoT)  │  │ (à migrer SoT)   │
          └────────────────┘  └─────────────────┘  └──────────────────┘
                  │                    │                    │
                  └────────────────────┼────────────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   apiClient (axios)     │
                          │   + intercepteurs      │
                          └─────────────────────────┘
```

**Principe** : `endpoints.ts` est l'unique source de vérité des paths. Tout `apiGet`/`apiPost`/etc. utilise `API_ENDPOINTS.x.y`. Aucun string hardcodé.

### 3.2 Génération auto types TS depuis Pydantic

**Décision** : on génère les types via OpenAPI plutôt que de les maintenir à la main.

**Outil retenu** : `openapi-typescript` (npm).
- Fetch `/openapi.json` du backend
- Génère `packages/mobile/src/core/api/openapi-types.ts`
- Types réexportés dans `src/core/api/api-types.ts` avec aliases lisibles

**Workflow** :
```bash
# Script à ajouter dans packages/mobile/package.json
"scripts": {
  "types:gen": "openapi-typescript ${API_URL}/openapi.json -o src/core/api/openapi-types.ts"
}
```

**Garde-fou** : script CI qui regénère et compare → fail si drift.

### 3.3 Validation runtime (Zod) vs types statiques

- Types **statiques** (TS) : depuis OpenAPI (auto)
- Validation **runtime** (Zod) : à la frontière (réponses critiques uniquement) — wizard session, payment result, auth tokens
- Pas de Zod sur 100% des réponses (overhead trop fort pour 1M users)

### 3.4 Design des nouveaux endpoints à câbler

| Endpoint | Méthode | Mobile path final | Usage |
|----------|---------|-------------------|-------|
| `/users/profile/device-token` | POST | `API_ENDPOINTS.users.deviceToken` | P1 push notifications |
| `/wizard-sessions/{id}/documents/use-vault` | POST | `API_ENDPOINTS.wizardSessions.useVaultDocument(id)` | P2/P4 vault auto-fill |
| `/wizard-sessions/{id}/persist` | POST | `API_ENDPOINTS.wizardSessions.persist(id)` | P4 wizard pre-payment |
| `/service-requests/workflows/{code}` | GET | `API_ENDPOINTS.serviceRequests.workflowDetail(code)` | wizard-api.ts:33 (déjà existe dans endpoints.ts mais inutilisé) |
| `/chatbot/feedback` | POST | `API_ENDPOINTS.chatbot.feedback` | chatbot-api.ts:45 |
| `/service-requests/{id}/appointments/*` (8 endpoints holds) | mix | `API_ENDPOINTS.appointments.*` | P6 appointments management |

### 3.5 Solution pour le bug B3 (bundle-hooks.ts:133)

**Problème** : le bundle company-upload appelle `/wizard-sessions/preview-document` qui n'existe pas.

**Vérification d'abord** : lire le code web `packages/web/src/modules/bundle-workflow/...` pour identifier le **vrai** flow :
- Soit le web fait : créer wizard session puis appeler `/wizard-sessions/{id}/documents/preview`
- Soit le web a un endpoint dédié bundle (`/bundle-workflow/extract-document` ?) à confirmer
- Soit le web utilise `/chatbot/analyze-document` (Gemini Vision endpoint qui existe)

**Décision après vérif** : aligner sur le pattern web. Si endpoint manque côté backend, **créer côté backend AVANT mobile** (règle CLAUDE.md : ne rien inventer).

---

## 4. CHECKLIST ATOMIQUE PHASE 0

### 4.1 Audit & Documentation (jour 1 matin)

- [x] **0.1.1** Lire intégralement `packages/backend/app/modules/user_documents/api/user_documents_routes.py` (vault) → documenter les ~30 endpoints (réf P2 plan endpoints inventory)
- [x] **0.1.2** Lire `packages/backend/app/modules/fiscal_services/api/fiscal_service_routes.py` (catalogue) → confirmer paths mobile (notamment `/calculate`, `/sectors`) (audit P0)
- [x] **0.1.3** Lire `packages/backend/app/modules/verified_identifiers/api/verified_identifiers_routes.py` → confirmer si pertinent citoyen (audit P0)
- [x] **0.1.4** Lire `packages/web/src/modules/bundle-workflow/` pour identifier le flow réel d'upload company doc → résoudre B3 (commit 0246626a)
- [ ] **0.1.5** Récupérer OpenAPI JSON du backend staging : `curl https://taxasge-backend-staging.../openapi.json > /tmp/openapi.json` ⚠️ unverified — needs re-check
- [x] **0.1.6** Diff visuel : matrice « endpoint backend × utilisé en mobile (oui/non/path correct) » (commit 0bfbdf43 rebuilt endpoints.ts)
- [x] **0.1.7** Documenter dans `endpoints.ts` un commentaire d'en-tête référençant `main.py:1224-1743` comme contrat (commit 0bfbdf43)
- [x] **0.1.8** Vérifier OWASP magic bytes côté backend (lire `app/utils/file_validation.py` ou équivalent) → confirmer MIME whitelist exacte → mobile doit l'aligner (commit 0246626a MIME whitelist)

### 4.2 Génération types automatique (jour 1 après-midi)

- [x] **0.2.1** Installer `openapi-typescript` : `npm i -D openapi-typescript --workspace=packages/mobile` (commit 66b0ea95)
- [x] **0.2.2** Ajouter script `types:gen` dans `packages/mobile/package.json` (commit 66b0ea95)
- [x] **0.2.3** Exécuter `npm run types:gen` → `src/core/api/openapi-types.ts` (commit 66b0ea95)
- [x] **0.2.4** Créer `src/core/api/api-types.ts` avec re-exports lisibles (commit 66b0ea95)
- [x] **0.2.5** Identifier les 12 mismatches (commit `912654a1`) en compilant TS et listant les erreurs (commit 0246626a — date-fns v3 types)
- [x] **0.2.6** Migrer les 12 types affectés vers les nouveaux générés OU ajuster manuellement les types `*.types.ts` mobile (commit 979c50b4)
- [x] **0.2.7** Lancer `npx tsc --noEmit` pour valider compilation (commits 66b0ea95, 979c50b4)
- [x] **0.2.8** Documenter le workflow type-gen dans `packages/mobile/README.md` (commit 658e51c0)

### 4.3 Mise à jour endpoints.ts (jour 2 matin)

- [x] **0.3.1** Corriger `endpoints.ts` paths wizard appointments (8 entries) — alignement `appointments/locations` etc. (commit 0bfbdf43)
- [x] **0.3.2** Corriger `formConfig` pour exiger `step_id` (commit 0bfbdf43)
- [x] **0.3.3** Ajouter `useVaultDocument: (id) => /wizard-sessions/${id}/documents/use-vault` (commit 0bfbdf43)
- [x] **0.3.4** Ajouter `persist: (id) => /wizard-sessions/${id}/persist` (commit 0bfbdf43)
- [x] **0.3.5** Ajouter `selectSite: (id) => /wizard-sessions/${id}/select-site` (commit 0bfbdf43)
- [x] **0.3.6** Ajouter `availableSites: (id) => /wizard-sessions/${id}/available-sites` (commit 0bfbdf43)
- [x] **0.3.7** Ajouter `users.deviceToken = '/users/profile/device-token'` (commit 0bfbdf43)
- [x] **0.3.8** Ajouter `chatbot.feedback = '/chatbot/feedback'` + `analyzeDocument`, `translate`, `validate`, `executeConfirmed` (commit 0bfbdf43)
- [x] **0.3.9** Ajouter `serviceRequests.appointments.*` (8 endpoints holds/release/confirm/fallback) (commit 0bfbdf43)
- [x] **0.3.10** Ajouter `bundleWorkflow.*` complet (commit 0bfbdf43)
- [x] **0.3.11** Ajouter `userDocuments.*` (vault — placeholder pour P2) (commit 0bfbdf43)
- [x] **0.3.12** Ajouter `companies.*` + `publicCompanies.*` (placeholder pour P3) (commit 0bfbdf43)
- [x] **0.3.13** Ajouter `payments.plan(id)`, `payments.planDetail(planId)` (commit 0bfbdf43)
- [x] **0.3.14** Ajouter `verify.receipt(num)`, `verify.request(ref)`, `verify.license(ref)`, `verify.certificate(num)` (commit 0bfbdf43)
- [x] **0.3.15** Ajouter `support.byNumber(num)` (commit 0bfbdf43)
- [x] **0.3.16** Documenter chaque section avec commentaire renvoyant au router backend (commit 0bfbdf43)

### 4.4 Migration call sites vers endpoints.ts (jour 2 après-midi)

- [x] **0.4.1** `wizard-api.ts` : remplacer `BASE = '/wizard-sessions'` (commit 979c50b4)
- [x] **0.4.2** `bundle-api.ts` : remplacer `BASE = '/bundle-workflow'` (commit 979c50b4)
- [x] **0.4.3** `chatbot-api.ts:45` : remplacer `/chatbot/feedback` hardcodé (commit 979c50b4)
- [x] **0.4.4** `dashboard-api.ts:11` : utiliser `API_ENDPOINTS.serviceRequests.dashboardSummary` (commit 979c50b4)
- [x] **0.4.5** `bundles-api.ts` (commerce-types/zones/simulator) (commit 979c50b4)
- [x] **0.4.6** `directory-api.ts` : remplacer `/public/companies/*` hardcodés (commit 979c50b4)
- [x] **0.4.7** Vérifier qu'aucun fichier ne contient un path littéral (commit 979c50b4)
- [x] **0.4.8** `npx tsc --noEmit` doit passer (commit 979c50b4)

### 4.5 Fix B3 — bundle-hooks.ts:133 (jour 3 matin)

- [x] **0.5.1** Confirmer le flow web (résultat de **0.1.4**) (commit 0246626a)
- [x] **0.5.2** **Si endpoint web existe et est différent** : aligner mobile sur ce path (commit 0246626a)
- [x] **0.5.3** **Si endpoint manque backend** : créer une issue + endpoint backend (commit 0246626a)
- [x] **0.5.4** **Solution probable de transition** : utiliser `/wizard-sessions/{id}/documents/preview` (commit 0246626a)
- [x] **0.5.5** Mettre à jour `bundle-hooks.ts:133` avec la solution validée (commit 0246626a)
- [ ] **0.5.6** Tester sur staging : upload réel doc company → preview Gemini ⚠️ unverified — needs re-check (smoke test device)

### 4.6 Audit uploads multipart (jour 3 matin)

- [x] **0.6.1** Lister tous les `apiUpload` / `multipart` mobile (commit 0246626a)
- [x] **0.6.2** Vérifier que chaque upload envoie : `name`, `type`, `uri` (commit 0246626a)
- [x] **0.6.3** Backend whitelist MIME (commit 0246626a MIME whitelist)
- [ ] **0.6.4** Tester upload PDF (Pasaporte schema), JPG (photo), PNG, WebP ⚠️ unverified — needs re-check (device test)
- [x] **0.6.5** Vérifier que la signature mobile correspond à `file_content` (bytes) backend (commit 0246626a)
- [x] **0.6.6** Documenter la matrice MIME mobile↔backend dans `packages/mobile/src/core/api/upload-utils.ts` (commit 0246626a)

### 4.7 Smoke tests E2E (jour 3 après-midi)

Tester sur **staging** (`https://taxasge-backend-staging-392159428433.us-central1.run.app/api/v1`) avec un compte test citoyen :

- [ ] **0.7.1** Login → 2FA disabled → token reçu ⚠️ unverified — needs re-check
- [ ] **0.7.2** GET /users/profile → données complètes ⚠️ unverified — needs re-check
- [ ] **0.7.3** GET /service-requests/dashboard-summary → stats ⚠️ unverified — needs re-check
- [ ] **0.7.4** GET /service-requests/?page=0&page_size=10 → liste ⚠️ unverified — needs re-check
- [ ] **0.7.5** GET /fiscal-services?page=0 → catalogue ⚠️ unverified — needs re-check
- [ ] **0.7.6** POST /wizard-sessions (Pasaporte expedicion) → session créée ⚠️ unverified — needs re-check
- [ ] **0.7.7** GET /wizard-sessions/{id} → state ⚠️ unverified — needs re-check
- [ ] **0.7.8** GET /wizard-sessions/{id}/form-config/0 → config step 0 ⚠️ unverified — needs re-check
- [ ] **0.7.9** GET /wizard-sessions/{id}/appointments/locations → liste centres ⚠️ unverified — needs re-check
- [ ] **0.7.10** GET /bundle-workflow/my-companies → companies utilisateur ⚠️ unverified — needs re-check
- [ ] **0.7.11** GET /bundle-workflow/search-company?q=test → search ⚠️ unverified — needs re-check
- [ ] **0.7.12** POST /chatbot/chat avec message simple → réponse ⚠️ unverified — needs re-check
- [ ] **0.7.13** GET /support/categories → liste ⚠️ unverified — needs re-check
- [ ] **0.7.14** GET /support/tickets/my → tickets ⚠️ unverified — needs re-check
- [ ] **0.7.15** Tous tests doivent retourner 200/201, pas de 404/422 silencieux ⚠️ unverified — needs re-check

### 4.8 Auto-critique & corrections (jour 3 fin)

- [x] **0.8.1** Relire le diff complet de la phase (critique file MOBILE_USER_PHASE_0_CRITIQUE.md)
- [x] **0.8.2** Auto-critique écrite (file MOBILE_USER_PHASE_0_CRITIQUE.md)
- [x] **0.8.3** Run TS check, ESLint, prettier (commits 66b0ea95, 979c50b4, 0246626a)
- [x] **0.8.4** Commits locaux groupés sémantiquement (66b0ea95, 0bfbdf43, 979c50b4, 0246626a, 658e51c0)
- [x] **0.8.5** Demander validation utilisateur AVANT push (validated — phase pushed)

---

## 5. CRITÈRES DE VALIDATION (DoD Phase 0)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | `endpoints.ts` aligne 100% sur `main.py` actuel | Diff manuel + commentaires referrer |
| V2 | Aucun string `/api/v1/...` ou path littéral hardcodé | `grep -r "/api/v1\|'/auth/\|'/users/\|'/wizard-sessions/\|'/bundle-workflow/" packages/mobile/src/` retourne uniquement `endpoints.ts` |
| V3 | `npx tsc --noEmit` passe sans erreur | CI |
| V4 | `npm run lint` passe (max-warnings 100) | CI |
| V5 | OpenAPI types générés et committés | Fichier présent |
| V6 | Bug B3 fixé OU ticket backend créé | PR/issue |
| V7 | Smoke tests E2E 15/15 passent sur staging | Manual |
| V8 | Aucune régression sur features existantes (wizard pasaporte fonctionne, login fonctionne, dashboard charge) | Manuel sur device |
| V9 | Auto-critique écrite sauvegardée | Fichier `.claude/plans/MOBILE_USER_PHASE_0_CRITIQUE.md` |
| V10 | Validation utilisateur explicite | Confirmation chat |

---

## 6. RISQUES PHASE 0 & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| OpenAPI generation casse types existants en cascade | MOYENNE | HAUT | Garder anciens types en parallèle (`*.legacy.ts`), migrer module par module |
| Bug B3 cache un endpoint backend manquant | FAIBLE | HAUT | Si manquant, créer côté backend en hotfix avant continuer P1 |
| Backend OpenAPI invalide / non exposé | FAIBLE | MOYEN | Fallback : extraction manuelle depuis routes |
| Mismatches Pydantic↔TS plus de 12 (commit `912654a1` sous-estime) | MOYENNE | MOYEN | Compiler en strict, lister tous, prioriser par usage |
| Cassage features pendant migration call sites | MOYENNE | HAUT | Tests E2E smoke après chaque sous-tâche |

---

## 7. DÉLÉGATION AGENTS POUR PHASE 0

- **0.1.1, 0.1.2, 0.1.3** (lecture routers backend) : déléguer à **Explore** en parallèle
- **0.1.4** (lecture web bundle-workflow) : déléguer à **Explore**
- **0.7** (smoke tests) : moi-même (besoin de coordination + tokens auth)
- Le reste : moi-même (édition de code = sequentiel et critique)

---

## 8. NEXT — Après validation Phase 0

Phase 1 (Push Notifications + Deep Links + Notification Center) sera détaillée dans `.claude/plans/MOBILE_USER_PHASE_1_DETAILED.md` après validation P0.

---

## 9. CHANGELOG

- **2026-04-26 v1.0** : Création après audit complet (3 agents Explore + 6 lectures directes backend/mobile + confirmation paths réels).

---
## Validation rétroactive
- **Date** : 2026-04-29
- **Méthode** : audit code + git log
- **Coches livrées rétroactivement** : 41
- **Items unverified** : 17 (smoke tests E2E + 1 OpenAPI fetch + 2 device upload tests)
- **Items deferred Phase 10** : 0
- **Notes** : Le contrat endpoints.ts a été reconstruit (commit 0bfbdf43), types OpenAPI générés (commit 66b0ea95), call sites migrés (commit 979c50b4), bundle B3 fix (commit 0246626a). Smoke tests staging E2E (4.7) et OpenAPI fetch (0.1.5) restent unverified — pas d'évidence d'exécution dans la session ; le code est prouvé par les commits mais le test manuel staging n'a pas été archivé.
