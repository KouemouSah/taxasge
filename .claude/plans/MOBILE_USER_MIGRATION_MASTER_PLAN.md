# MOBILE USER MIGRATION — MASTER PLAN

**Date de création** : 2026-04-26
**Auteur** : Claude (Opus 4.7) — agissant comme expert mobile + backend
**Cible** : `packages/mobile/` (app "Facil" — Expo SDK 54, Expo Router, React Query, Zustand, Paper MD3)
**Audience utilisateur** : citizen + business (accountant retiré — module non actif côté web)
**Ordres de grandeur** : 1M+ utilisateurs, 100+ agents simultanés (côté backend), zone GE (connectivité instable)

---

## 0. CADRAGE — Ce que cette migration EST et N'EST PAS

### Ce que c'est
- **Synchronisation** de l'app mobile avec l'évolution backend (Document AI, Bundle Workflow, Vault, Companies CRUD, breaking changes Pydantic)
- **Complétion** des modules stub (support, calculator, payment-result, settings)
- **Ajout** des modules manquants critiques (push notifications, vault, companies CRUD, batch, declarations)
- **Hardening** sécurité OWASP Mobile + observabilité

### Ce que ce n'est PAS
- ❌ Réécriture from scratch (159 fichiers TS/TSX déjà solides)
- ❌ Refactor d'architecture (Expo Router + React Query + Zustand est validé)
- ❌ Migration de techno (on reste sur Paper MD3 + i18next)

### Sources de vérité (CLAUDE.md)
1. **Schéma BD** — interroger directement (`information_schema`, `pg_type`)
2. **Routes FastAPI** — lire les `*_routes.py` et `main.py` (1743 lignes, 60+ routers)
3. **Code mobile existant** — patterns Expo Router + hooks React Query
4. **Documentation** — en dernier recours

---

## 1. PROBLÈMES CRITIQUES DÉJÀ IDENTIFIÉS (à corriger en Phase 0)

| # | Bug | Localisation | Sévérité | Impact |
|---|-----|--------------|----------|--------|
| 1 | Endpoints wizard appointments faux | `mobile/src/core/api/endpoints.ts:74-80` | 🔴 BLOCKER | RDV impossibles à booker |
| 2 | `formConfig` sans `step_id` en path | `endpoints.ts:69` | 🔴 BLOCKER | Forms dynamiques cassés |
| 3 | Aucun endpoint `/documents/use-vault` | `mobile` absent | 🟠 IMPORTANT | Pas d'auto-fill vault → wizard |
| 4 | `/users/profile/device-token` jamais appelé | `mobile` absent | 🔴 BLOCKER | Push notifications invisibles |
| 5 | Upload `file_content` (bytes) vs UploadFile | tous uploads mobile | 🟠 IMPORTANT | Backend rejette anciens uploads (commit `c0199fb7`) |
| 6 | 12 mismatches Pydantic↔TS | tous les types mobile | 🟠 IMPORTANT | Crashes de désérialisation (commit `912654a1`) |
| 7 | Magic bytes / Content-Type strict | uploads mobile | 🟠 IMPORTANT | OWASP backend rejette uploads (commit `bdac3cd9`) |
| 8 | Routes service_requests refactorées | mobile à valider | 🟡 MEDIUM | Possibles 404 silencieux (commit `5bd6714a`) |
| 9 | Aucun deep link payment return | `mobile` absent | 🔴 BLOCKER | Paiement BANGE → utilisateur perdu |
| 10 | Aucun écran Vault | `mobile` absent | 🔴 BLOCKER | Module utilisateur principal manquant |
| 11 | Aucune observabilité (Crashlytics/Sentry) | `mobile` absent | 🟠 IMPORTANT | Aveugle en prod 1M users |
| 12 | OWASP Mobile (M1-M10) non audité | global mobile | 🟠 IMPORTANT | Risque sécurité données fiscales |
| 13 | Mode offline non implémenté | `appConfig.features.offlineMode` | 🟡 STRATEGIC | Décision : offline-first ou non ? |

---

## 2. PHASES — Vue d'ensemble

| Phase | Titre | Durée estimée | Bloquant pour suite ? |
|-------|-------|----------------|------------------------|
| **P0** | Backend Sync & Audit (correction des paths, types, breaking changes) | 2-3 jours | ✅ OUI |
| **P1** | Push Notifications + Deep Links + Notification Center | 3-4 jours | ✅ OUI (UX) |
| **P2** | Document Vault (Mes Documents) + Auto-fill Wizard | 5-7 jours | Non |
| **P3** | Companies CRUD + Bundle Workflow alignement complet | 4-5 jours | Non |
| **P4** | Wizard OCR/Gemini complet + Vault integration | 3-4 jours | Non |
| **P5** | Payments end-to-end (BANGE deep links, receipts, plans) | 4-5 jours | Non |
| **P6** | Support tickets + Appointments management + Settings | 4-5 jours | Non |
| **P7** | Batch Requests (business uniquement) | 3-4 jours | Non |
| **P8** | Polish + i18n complet + Performance + Offline-read (Option B) | 4-5 jours | Non |
| **P9** | OWASP Mobile + Observabilité (Sentry/Crashlytics) + Hardening | 3-4 jours | ✅ OUI (avant store) |
| **P10** | Build production + Tests E2E + App Stores submission | 3-5 jours | Final |

**Total estimé : 33-46 jours** (équipe 1 dev). Avec délégation parallèle d'agents : ~22-30 jours.

**Hors scope V1** : Tax Declarations + Accountant module — non actifs côté web (corrections architecture + règles métier en cours).

**iOS skip P1→P9** : pas d'Apple Developer Account aujourd'hui (décision 2026-04-27).
Toutes les phases mobile **se valident sur Android uniquement** jusqu'en P10.
Le code mobile reste plateforme-agnostique (Expo gère iOS automatiquement à la
recompile). En **P10**, souscription Apple Dev Program ($99/an) + setup
credentials EAS + smoke tests iOS sur iPhone physique. APNs (push iOS) ne
peut **pas** être validé avant P10 car APNs ne fonctionne que sur device réel
(jamais sur Simulator).

---

## 3. PHASE-BY-PHASE — Checklists générales

### PHASE 0 — Backend Sync & Audit ⚠️ CRITIQUE

**Objectif** : aucun appel mobile cassé, tous les types alignés, foundation propre.

- [ ] Inventaire EXHAUSTIF des endpoints mobile vs backend (script auto si possible)
- [ ] Correction `endpoints.ts` paths wizard appointments (4 paths)
- [ ] Correction `formConfig` ajout `step_id` param
- [ ] Ajout `documents/use-vault` endpoint
- [ ] Régénération types TS depuis Pydantic (12 mismatches du commit `912654a1`)
- [ ] Audit uploads : `file_content` bytes + Content-Type strict
- [ ] Audit routes service_requests post-refactor (`5bd6714a`)
- [ ] Test E2E auth → list services → list requests → wizard create (smoke test backend)
- [ ] Documentation `endpoints.ts` comme contrat figé (commentaire de référence main.py)

**Validation Phase** : tous les hooks React Query existants retournent des données ; aucun 404/422 silencieux.

---

### PHASE 1 — Push Notifications + Deep Links + Notification Center

**Objectif** : canal de communication avec l'utilisateur opérationnel.

- [ ] Configuration `expo-notifications` (permissions, channels Android, certificates iOS)
- [ ] Hook `useDeviceTokenRegistration()` → POST `/users/profile/device-token`
- [ ] Handler in-app notifications (foreground/background/killed states)
- [ ] Configuration `expo-router` deep links : `facil://request/{id}`, `facil://payment/result?ref=...`, `facil://ticket/{id}`, `facil://reset-password?token=...`
- [ ] Écran `Notifications` paginé + pull-to-refresh + mark-as-read
- [ ] Badge tab Notifications (count unread)
- [ ] Préférences notifications (toggle catégories) → backend `/users/profile` ou `/communications/preferences`
- [ ] Tests : send test push depuis backend → vérifier réception + tap → navigation correcte

**Validation Phase** : push test depuis admin reçu en < 5s, tap navigue vers la bonne page.

---

### PHASE 2 — Document Vault (Mes Documents) + Auto-fill Wizard

**Objectif** : citoyen peut stocker, consulter, utiliser ses documents.

- [ ] Module `src/modules/user-documents/` créé (structure complète)
- [ ] Hooks : `useUserDocuments`, `useUploadDocument`, `useDocumentDetail`, `useDeleteDocument`, `useReclassify`, `useDocumentAlerts`, `useDocumentReadiness`
- [ ] Écrans :
  - [ ] `/(tabs)/documents/index.tsx` — liste avec filtres (catégorie, statut, expiration)
  - [ ] `/(tabs)/documents/[id].tsx` — détail + extraction Gemini + thumbnail
  - [ ] `/(tabs)/documents/upload.tsx` — modal upload (camera + galerie + file picker)
  - [ ] `/(tabs)/documents/alerts.tsx` — alertes expiration
  - [ ] `/(tabs)/documents/generated.tsx` — documents générés (proforma, license, summary, receipt)
- [ ] Composants : `DocumentCard`, `DocumentPreview`, `ExpiryBadge`, `ClassificationBadge`, `BulkActionBar`
- [ ] Upload flow : sélection → magic bytes check client → multipart `file_content` → progress → preview classification Gemini → confirm
- [ ] Vault → Wizard : bouton "Utiliser depuis mon coffre" → POST `/wizard-sessions/{id}/documents/use-vault`
- [ ] Téléchargement : `expo-file-system` + `expo-sharing` (PDF preview natif)
- [ ] i18n : 3 langues complètes (clés `documents.*`)
- [ ] Tests : upload → classify → use in wizard → générer summary

**Validation Phase** : flow complet citizen "upload DIP → wizard residencia → auto-fill" fonctionnel.

---

### PHASE 3 — Companies CRUD + Bundle Workflow alignement complet

**Objectif** : business user peut gérer ses entreprises et leurs obligations.

- [ ] Module `src/modules/companies/` créé
- [ ] Hooks : `useMyCompanies`, `useCompanyDetail`, `useCreateCompany`, `useUpdateCompany`, `useCompanyMembers`, `useAddMember`, `useUpdateMemberRole`, `useRemoveMember`, `usePublicCompanySearch`
- [ ] Hooks bundle additionnels : `useMyCompanyDetail`, `useCompanyPayments`, `useDownloadLicensePdf`
- [ ] Écrans :
  - [ ] `/(tabs)/empresas/index.tsx` — liste mes entreprises avec license status
  - [ ] `/(tabs)/empresas/[id].tsx` — détail + obligations + paiements + download license PDF
  - [ ] `/(tabs)/empresas/[id]/members.tsx` — gestion membres
  - [ ] `/empresas/new.tsx` — création (search public ou create new)
- [ ] Composants : `CompanyCard`, `LicenseStatusBadge`, `ObligationsList`, `MembersTable`, `RolePicker`
- [ ] Public directory : search + filtres zones/sectors/provincias/ciudades/formas-juridicas
- [ ] Bundle Workflow : audit complet du module existant (paths, payloads, écrans), couverture obligations/payments
- [ ] Téléchargement license PDF : intégration vault (PDF auto-stocké)
- [ ] i18n : 3 langues complètes (clés `companies.*`, `obligations.*`)
- [ ] Tests : create company → search NIF → init bundle → pay → download license

**Validation Phase** : flow business "create company → run bundle → pay obligations → license PDF in vault".

---

### PHASE 4 — Wizard OCR/Gemini complet + Vault integration

**Objectif** : wizard expérience web-parity (extraction AI, risk analysis, corrections).

- [ ] Audit composant `dynamic-form-renderer.tsx` : conditions, validations, messages erreurs
- [ ] Composant `DocumentExtractionSheet` : affichage résultats Gemini (champs + confidence + warnings)
- [ ] Composant `RiskAnalysisBanner` : niveau risque + recommandations
- [ ] Composant `ManualCorrectionForm` : édition champs extraits avec re-validation
- [ ] Intégration `/wizard-sessions/{id}/documents/use-vault` (bouton dans step-upload)
- [ ] Composant `VaultDocumentPicker` : modal de sélection depuis le vault
- [ ] Cross-validation results display (agrégé + par règle)
- [ ] Persistance step intermédiaire : `wizard-sessions/{id}/persist` avant payment
- [ ] Audit countdown TTL : 60min Redis (alignement web)
- [ ] Tests : workflow Pasaporte complet sur device + workflow Bundle complet

**Validation Phase** : 2 workflows critiques (Pasaporte + Bundle) testés end-to-end avec OCR réel.

---

### PHASE 5 — Payments end-to-end (BANGE)

**Objectif** : flow paiement robuste avec retour utilisateur garanti.

- [ ] Audit `usePayments`, `useInitiatePayment` ; alignement nouveaux types Pydantic
- [ ] Deep link handler payment result : `facil://payment/result?ref=XXX&status=YYY`
- [ ] Écran `payment-result.tsx` complet : polling status backend (pas seulement query string)
- [ ] Écran `/(tabs)/payments/index.tsx` — historique paiements avec filtres
- [ ] Écran `/(tabs)/payments/[id].tsx` — détail + reçu téléchargeable
- [ ] Hooks `usePaymentPlans`, `usePaymentInstallments` (échéancier)
- [ ] Intégration `/verify/receipts` — vérification reçu BANGE (QR code scanner pour agents inspecteurs futurs)
- [ ] Receipts dans vault : auto-déposés via `payment_receipt` GenerationType
- [ ] Idempotency keys client-side (UUID v4 pour POST `/payments`)
- [ ] BANGE redirect URL : open via `expo-web-browser` (in-app browser) avec close detection
- [ ] Tests : init payment → BANGE → return → polling → receipt → vault

**Validation Phase** : payment réel sur staging (1 transaction) avec receipt téléchargeable et listé.

---

### PHASE 6 — Support tickets + Appointments management + Settings

**Objectif** : finir les écrans stub + gestion post-booking RDV.

- [ ] Support tickets : compléter écrans `support/index`, `support/new`, `support/[id]`
  - [ ] Liste paginée
  - [ ] Création avec attachments (max 5 fichiers, types whitelist)
  - [ ] Thread messages avec real-time refresh
  - [ ] Close ticket
- [ ] Appointments :
  - [ ] Écran `/(tabs)/appointments/index.tsx` — mes RDV avec filtres (à venir / passés)
  - [ ] Détail appointment
  - [ ] Annulation (24h avant) avec confirmation
  - [ ] Calendar view native (`react-native-calendars`)
  - [ ] Reminder notifications (push + system reminder)
- [ ] Settings :
  - [ ] Écran `/settings/security.tsx` — full 2FA setup (QR code SVG render, backup codes display+save, disable flow)
  - [ ] Écran `/settings/sessions.tsx` — déjà partiel, ajouter revoke + device fingerprint
  - [ ] Écran `/settings/notifications.tsx` — préférences granulaires (push, email, SMS)
  - [ ] Écran `/settings/biometric.tsx` — toggle + re-auth flow
  - [ ] Écran `/settings/account/delete.tsx` — RGPD-friendly suppression compte
- [ ] i18n : compléter clés manquantes
- [ ] Tests : 2FA enable/disable, ticket lifecycle, appointment cancel

**Validation Phase** : checklist OWASP partielle (M1, M3, M9 — secure storage, auth, code tampering).

---

### PHASE 7 — Batch Requests (business uniquement)

**Objectif** : couverture rôle `business` pour soumissions groupées.

- [ ] Module `src/modules/batch-requests/`
  - [ ] Hooks : `useBatchSession`, `useBatchUploadCsv`, `useBatchSubmit`, `useBatchDetail`
  - [ ] Wizard batch : workflow → bénéficiaires (CSV ou manual) → docs partagés → paiement groupé
  - [ ] Écrans : `batch-requests/index`, `batch-requests/[id]`, `batch-requests/wizard`
- [ ] Composants : `BeneficiaryRoster`, `BatchDataGrid`, `CsvUploadCard`
- [ ] Permissions : afficher module uniquement si `user.role === 'business'`
- [ ] Tests : create batch → upload CSV → submit → payment

**Validation Phase** : un user `business` peut faire une batch request complète end-to-end.

**Hors scope V1** : Tax Declarations + Accountant — déplacés en backlog post-V1, à réintégrer quand le web sera stabilisé sur ces modules.

---

### PHASE 8 — Polish + i18n complet + Performance

**Objectif** : qualité production.

- [ ] Audit i18n : couverture es/fr/en sur 100% des clés (script de diff)
- [ ] Skeleton screens pour tous les loading states (pas de spinner blanc)
- [ ] Optimistic updates sur mutations critiques (mark-as-read, like, etc.)
- [ ] React Query caching strategy review : staleTime, gcTime, prefetch
- [ ] Bundle size optimization : `expo-tree-shaking`, lazy loading screens, image optimization
- [ ] Image caching : `expo-image` partout (vs `Image` natif)
- [ ] Animations 60fps : Reanimated 3 pour transitions critiques
- [ ] Accessibility : labels, focus order, contrast ratios (WCAG AA minimum)
- [ ] Empty states : tous les listings ont un empty state custom + CTA
- [ ] Error boundaries : pas d'écran blanc, fallback UI partout
- [ ] Pull-to-refresh : tous les listings
- [ ] Infinite scroll : lists > 20 items
- [ ] Tests : Lighthouse-équivalent mobile (Flipper / DevTools)

**Validation Phase** : démo de 5 workflows critiques en < 60s chacun, pas de jank visible.

---

### PHASE 9 — OWASP Mobile + Observabilité

**Objectif** : sécurité et visibilité production.

#### OWASP Mobile (M1-M10)
- [ ] **M1 Improper Credential Usage** : audit secure-store, pas de mdp en plain text
- [ ] **M2 Inadequate Supply Chain Security** : audit dependencies (npm audit + Snyk), lockfile signé
- [ ] **M3 Insecure Authentication/Authorization** : token rotation, refresh flow, 2FA enforcement
- [ ] **M4 Insufficient Input/Output Validation** : Zod sur tous les inputs, escape outputs
- [ ] **M5 Insecure Communication** : certificate pinning (`expo-ssl-pinning`), TLS 1.3, HSTS
- [ ] **M6 Inadequate Privacy Controls** : data minimization, opt-in tracking, RGPD
- [ ] **M7 Insufficient Binary Protection** : ProGuard/R8 (Android), code obfuscation, anti-tampering checks
- [ ] **M8 Security Misconfiguration** : `expo-screen-capture` ON, jailbreak detection (`expo-device`), debug mode strict
- [ ] **M9 Insecure Data Storage** : audit AsyncStorage usage (déconseillé pour secrets), expo-secure-store partout
- [ ] **M10 Insufficient Cryptography** : pas de crypto custom, AES-256 via expo-crypto

#### Observabilité
- [ ] Sentry React Native intégré (ou Firebase Crashlytics)
- [ ] Error boundary global → Sentry
- [ ] Performance monitoring : transactions clés (auth, wizard submit, payment)
- [ ] Custom breadcrumbs : route changes, API calls, user actions
- [ ] User context (sans PII) : userId, role, locale
- [ ] Source maps uploadés sur build CI
- [ ] Analytics : Firebase Analytics ou Amplitude (events clés)

**Validation Phase** : pen-test interne (1 session), Sentry capture erreur synthétique → notification Slack.

---

### PHASE 10 — Build production + Tests E2E + App Stores

**Objectif** : MEP.

- [ ] Tests E2E : Maestro ou Detox (15-20 scénarios critiques)
- [ ] Build EAS production iOS + Android
- [ ] App Store Connect : metadata, screenshots, app review info
- [ ] Google Play Console : metadata, screenshots, signing
- [ ] Privacy policy + Terms of service (URL hébergée)
- [ ] App icons + splash screens (3 résolutions Android, 2 iOS)
- [ ] Analytics dashboards créés (Firebase Console / Amplitude)
- [ ] Documentation utilisateur (premiers pas, FAQ)
- [ ] Soft launch staging (testeurs internes via TestFlight + Internal Testing Track)
- [ ] Hard launch après 7 jours soft launch sans crash bloquant

**Validation Phase** : 1ère version live sur stores, monitoring vert 24h.

---

## 4. RÈGLES D'EXÉCUTION (CLAUDE.md compliant)

1. **Avant chaque phase** : créer un fichier détaillé `.claude/plans/MOBILE_USER_PHASE_X_DETAILED.md` avec architecture, design, types, payloads, mocks, checklist atomique.
2. **Pendant la phase** : commit local par sous-tâche validée. Pas de push tant que la phase n'est pas critiquée et corrigée.
3. **Fin de phase** :
   - Tests automatisés passent (TS check, lint, tests unitaires)
   - Auto-critique écrite (qu'est-ce qui pourrait casser ?)
   - Corrections appliquées
   - Demande de validation utilisateur AVANT push
4. **Aucun hardcodage** : tout via `appConfig`, env vars, ou backend.
5. **Aucun mock de données** : si l'endpoint n'existe pas backend, on l'ajoute backend AVANT mobile.
6. **OWASP en continu** : à chaque PR, checklist M1-M10 partielle.
7. **Délégation** : phases lourdes (P2 Vault, P3 Companies, P7 Declarations) → agents spécialisés (`taxasge-frontend-dev` ou Explore en parallèle).

---

## 5. STRATÉGIE OFFLINE — Décision requise utilisateur

Le flag `appConfig.features.offlineMode` existe mais n'est pas implémenté. **Trois options** :

### Option A — Online-only (status quo)
- ✅ Simple, maintenance basse
- ❌ Inutilisable hors connexion
- ❌ Mauvaise UX en GE (zones rurales)

### Option B — Offline-read (recommandé pour P8/P9)
- ✅ Cache React Query persisté (consultation profil, mes demandes, mes documents listing)
- ✅ Actions différées en queue (upload, mutations) avec retry au retour réseau
- ✅ Effort moyen
- 🟡 Conflits possibles si modif simultanée web/mobile

### Option C — Offline-first complet
- ✅ Expérience native excellente
- ❌ Complexité élevée (CRDT ou OT pour conflits)
- ❌ Effort 4-6 semaines supplémentaires
- ❌ Justifié seulement si métrique « > 30% sessions offline »

**Décision retenue** : ✅ Option B (offline-read) — intégrée en Phase 8.

---

## 6. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Backend continue d'évoluer pendant mobile | HAUTE | HAUT | Phase 0 répétée mensuellement, contrat OpenAPI versionné |
| Nouveaux breaking changes Pydantic | MOYENNE | MOYEN | Génération auto types TS depuis OpenAPI (script CI) |
| BANGE downtime | FAIBLE | HAUT | Retry + circuit breaker côté mobile, fallback "réessayer plus tard" |
| Push notifications spam | MOYENNE | MOYEN | Préférences granulaires + rate limiting backend |
| App rejected by stores | FAIBLE | HAUT | Privacy nutrition labels Apple, Google data safety form, RGPD compliant dès P9 |
| 1M users → API rate limits | HAUTE | HAUT | Caching agressif client (React Query staleTime), backend Redis cache (existe déjà) |
| Crashlytics noise | MOYENNE | FAIBLE | Filters + grouping rules, ignore network timeouts < 1% |

---

## 7. MÉTRIQUES DE SUCCÈS

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Crash-free sessions | > 99.5% | Sentry |
| App startup time (cold) | < 2s | Firebase Performance |
| API call p95 latency | < 500ms | Sentry transactions |
| Wizard completion rate | > 70% | Analytics funnel |
| Payment success rate | > 95% | Backend logs |
| User satisfaction (CSAT) | > 4.0/5 | App store reviews |
| i18n coverage | 100% | Script de diff |
| OWASP M1-M10 compliance | 100% | Audit checklist |

---

## 8. SUIVI DU PLAN

- ✅ Plan validé : __ (date)
- 🔄 Phase 0 : __ (date début / fin)
- 🔄 Phase 1 : __
- 🔄 Phase 2 : __
- 🔄 Phase 3 : __
- 🔄 Phase 4 : __
- 🔄 Phase 5 : __
- 🔄 Phase 6 : __
- 🔄 Phase 7 : __
- 🔄 Phase 8 : __
- 🔄 Phase 9 : __
- 🔄 Phase 10 : __

---

## 9. CHANGELOG DE CE PLAN

- **2026-04-26 v1.0** : Création initiale après analyse exhaustive (3 agents Explore + lecture directe backend routes + main.py + endpoints.ts mobile + bundle-api.ts).

