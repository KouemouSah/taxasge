# PHASE C — Conformité Google Play Console (Plan détaillé)

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Sortie attendue** : tous les questionnaires Play Console verts (Data Safety, IARC Content Rating, Target Audience, Government Declaration, App Access, Privacy Policy URL, Permissions justification).
**Cible time** : 1 jour
**Branche** : `develop` (commits docs + checklist mise à jour)

---

## 1. CONTEXTE

Avant de pouvoir soumettre l'AAB sur Play Console, l'app doit avoir TOUS les questionnaires "Required for publish" en vert. Les principaux :
1. **Data Safety Form** — déclaration de ce qui est collecté/partagé
2. **Content Rating** (IARC) — questionnaire automatisé qui produit un rating PEGI/ESRB
3. **Target Audience and Content** — tranche d'âge cible + contenu pour enfants
4. **Government App Declaration** — Facil = service gouvernemental
5. **App Access** — credentials de test pour les reviewers Google
6. **Privacy Policy URL** — URL publique accessible sans login
7. **Permissions justification** — pour chaque permission Android dangereuse
8. **App Category & Tags** — classification dans le store
9. **Country availability + Pricing** — où l'app est disponible

Cette phase **ne génère pas de code** — seulement de la documentation + actions Play Console côté user. Le livrable : un fichier `.md` pré-rempli pour copier-coller dans Play Console.

---

## 2. AUDIT DATA SAFETY (résumé exhaustif via agent Explore — 2026-05-02)

### 2.1 Données réellement collectées et partagées

#### Personal Info ✅ Collected
| Type | Required ? | Shared with | Encrypted in transit | User can delete ? |
|------|-----------|-------------|---------------------|-------------------|
| Name (first_name, last_name) | Required | — | TLS | Y (RGPD `/users/profile` DELETE) |
| Email | Required | — | TLS | Y |
| User ID (UUID) | Required | Sentry, LogRocket | TLS | Y |
| Phone number | Optional | BANGE (payments) | TLS | Y |
| Address | Optional | — | TLS | Y |
| City | Optional | — | TLS | Y |
| National ID (DIP) / Tax ID (NIF) | Optional | Vertex AI/Gemini (OCR) | TLS | Y |

**Evidence**: `users` table 47 colonnes (asyncpg 2026-05-02), `auth_routes.py` RegisterRequest

#### Financial Info ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| Payment info (amount, method, status) | Required | BANGE | TLS | Y |
| Bank reference | Optional | BANGE | TLS | Y |
| Purchase history | Optional | — | TLS | Y |

**Evidence**: `payments` table, `bange_service.py`

#### Messages ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| Chatbot in-app messages | Optional | Vertex AI/Gemini | TLS | Y (delete account) |

**Evidence**: BD table `chatbot_conversations` (id, user_id, conversation_id, messages JSONB, created_at). Retention : indéfinie tant que account actif. Account delete (RGPD `/users/profile DELETE`) → cascade ?
**À VÉRIFIER en Phase C.4** : `chatbot_conversations` a-t-elle FK CASCADE sur users.id ?

#### Photos & Videos ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| Document scans (DIP, passport, certificates) | Required | Vertex AI / Cloud Vision (OCR) | TLS | Y |
| Avatar | Optional | — (Supabase Storage) | TLS | Y |

**Evidence**: `app.json` `NSCameraUsageDescription`, `documents` module backend. Stockage : Supabase Storage `documents/` bucket.

#### Files & Docs ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| User documents (uploaded PDFs, generated receipts) | Required | Vertex AI (extraction) | TLS | Y |

**Evidence**: `user_documents` module backend, `uploaded_files` table

#### Calendar ✅ Collected (in-app — pas l'agenda système)
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| Appointment dates/times | Optional | — | TLS | Y |

**Evidence**: `appointment_routes.py`. **Nota** : ce ne sont PAS des Calendar events Android natifs (l'app ne lit/écrit PAS l'agenda système).

#### App Activity ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| App interactions (screens, taps, navigation) | Optional | LogRocket (sanitized) | TLS | N (LogRocket auto-purge 30j) |
| User-generated content (workflows, declarations) | Required | — | TLS | Y |

**Evidence**: `core/observability/logrocket.ts` (textSanitizer='excluded', no PII tracked)

#### App Info & Performance ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| Crash logs | Optional | Sentry | TLS | N (Sentry auto-purge 90j) |
| Diagnostics (perf metrics) | Optional | Sentry, LogRocket | TLS | N (auto-purge) |

**Evidence**: `core/observability/sentry.ts` (sendDefaultPii: false, beforeSend strips PII)

#### Device or Other IDs ✅ Collected
| Type | Required ? | Shared with | Encrypted | Delete ? |
|------|-----------|-------------|-----------|----------|
| Device push token (FCM) | Required (notifications) | Firebase Cloud Messaging | TLS | Y |
| Device type / OS version | Optional | Sentry, LogRocket | TLS | Auto-purge |
| IP address | Optional | Backend telemetry, **PAS** LogRocket (`enableIPCapture: false`), **PAS** Sentry (auto-anonymise) | TLS | 30j |

### 2.2 Catégories NON collectées

❌ Health and fitness (ne s'applique pas à une app fiscale)
❌ Audio files (pas de mic)
❌ Contacts (pas d'accès au répertoire)
❌ Web browsing history (pas de tracking de navigation externe)

---

## 3. DATA SAFETY FORM — réponses Play Console (à reporter manuellement)

### 3.1 Encryption in transit
> Q: Is all of the user data collected by your app encrypted in transit?
- **Réponse** : ✅ **YES** (TLS 1.2+ partout, HSTS sur backend Cloud Run, Cloud Run forces HTTPS)

### 3.2 Data deletion
> Q: Do you provide a way for users to request that their data be deleted?
- **Réponse** : ✅ **YES — In-app deletion**
- **Path** : Profile → Danger zone → Delete my account (RGPD art. 17)
- **Endpoint** : `DELETE /api/v1/users/profile` (Phase 6.1 livré)
- **Web URL alternative** : (à fournir si demandé) `https://taxasge-dev.web.app/{lang}/profile/account/delete`

### 3.3 Toggle par catégorie (à cocher dans Play Console)

À déclarer **collected** ET **shared** (car certains tiers — voir colonne "Shared" matrice §2.1) :

| Catégorie | Collected | Shared | Optional/Required | Purposes |
|-----------|-----------|--------|---------------------|----------|
| Personal info → Name | ✅ | ❌ | Required | Account management |
| Personal info → Email | ✅ | ❌ | Required | Account mgmt + Communications |
| Personal info → User IDs | ✅ | ✅ (Sentry, LogRocket) | Required | Account mgmt + Analytics |
| Personal info → Phone number | ✅ | ✅ (BANGE) | Optional | Account mgmt + Payment |
| Personal info → Address | ✅ | ❌ | Optional | Account mgmt |
| Personal info → Other info (NIF/DIP) | ✅ | ✅ (Vertex AI OCR) | Optional | App functionality |
| Financial info → Payment info | ✅ | ✅ (BANGE) | Required | App functionality |
| Financial info → Purchase history | ✅ | ❌ | Optional | App functionality |
| Messages → Other in-app messages | ✅ | ✅ (Vertex AI) | Optional | App functionality (chatbot) |
| Photos and videos → Photos | ✅ | ✅ (Vertex AI OCR) | Required | App functionality (doc scan) |
| Files and docs | ✅ | ✅ (Vertex AI) | Required | App functionality |
| Calendar → Calendar events | ❌ | — | — | (in-app appointments, NOT Android Calendar) |
| App activity → App interactions | ✅ | ✅ (LogRocket sanitized) | Optional | Analytics |
| App activity → Other user-generated content | ✅ | ❌ | Required | App functionality |
| App info and performance → Crash logs | ✅ | ✅ (Sentry) | Optional | Analytics |
| App info and performance → Diagnostics | ✅ | ✅ (Sentry, LogRocket) | Optional | Analytics |
| Device or other IDs → Device or other IDs | ✅ | ✅ (FCM, Sentry, LogRocket) | Required | App functionality (push) |

### 3.4 Sensitive data
> Q: Does your app collect or share any of the required user data types?
- ✅ Sensitive: financial info, IDs (NIF/DIP via OCR)

### 3.5 Reasoning
- **Account management** : create/login/profile/delete account
- **App functionality** : process tax declarations, payments, document uploads
- **Analytics** : crash diagnosis, perf monitoring (Sentry, LogRocket — anonymized)
- **Communications** : push notifications (FCM), email (account events)

---

## 4. CONTENT RATING — IARC Questionnaire

Réponses pré-remplies (Facil = service fiscal, ZERO contenu mature) :

| Question | Réponse |
|----------|---------|
| Does the app contain violence ? | NO |
| Does the app contain sexuality ? | NO |
| Does the app contain language (profanity) ? | NO |
| Does the app contain controlled substances (drugs/alcohol/tobacco) ? | NO |
| Does the app contain user-generated content (UGC) ? | YES — but moderated (support tickets only) |
| Does the app contain in-app purchases ? | NO (free + government services) |
| Does the app collect location ? | NO (city saisie user, pas GPS) |
| Does the app share user data with third parties ? | YES (Sentry/LogRocket analytics, Vertex AI for OCR/chat, FCM push, BANGE payments — all declared in Privacy Policy) |
| Does the app contain gambling/contests ? | NO |
| Does the app contain horror/fear-inducing content ? | NO |

**Rating attendu** : **3+ (Everyone)** ou **PEGI 3** sur les marchés EU.

---

## 5. TARGET AUDIENCE AND CONTENT

> Décision pendant Phase C — choix user requis

| Option | Implications |
|--------|--------------|
| **18+** (Recommandé) | Cohérent avec services fiscaux (NIF, déclarations). Limite l'audience aux adultes. Pas d'obligations COPPA/RGPD-K. |
| **13+** | Possible mais introduit des obligations COPPA-light (US) et notice de parents |

**Recommandation 18+** : la nature des services (déclarations fiscales personnelles, paiements BANGE, accès aux licences commerciales) implique typically un user adulte (NIF officiel, signature légale).

**Children policy** :
- App **not designed primarily for children** ✅
- Pas de contenu enfants
- Pas de Google Family Library

---

## 6. APP ACCESS — Demo credentials pour reviewers Google

Les reviewers Google ont besoin de credentials pour tester les fonctionnalités auth-required. À fournir :

```
Test Account (citizen role)
Email : test-google-review@taxasge.dev    (à créer en BD avant submission)
Password : <à générer 12 chars + sauvegarder GCP Secret>

Description : Standard citizen account with empty workflow history.
Access this credentials to verify sign-up flow, vault, payments, support
features. Cannot access admin/agent features.
```

**Action Phase C.5** : créer le user test en BD via INSERT direct + sauvegarder password en GCP Secret `play-review-test-password`.

---

## 7. GOVERNMENT APP DECLARATION

Facil = **service gouvernemental officiel** de la République de Guinée Équatoriale.

Play Console requirement : déclarer l'app comme "Government Entity" et fournir une preuve d'autorisation.

**Preuves possibles** :
- Domain `.gob.gq` (à vérifier — peut-être `taxasge.gob.gq` enregistré ?)
- Lettre d'autorisation officielle Direction Générale des Impôts
- Email officiel `@dgi.gob.gq` ou similaire

**Si pas de preuve dispo en V1** :
- Soumettre comme app standard (privée) avec descriptions précisant "Plateforme officielle de la Direction Générale des Impôts de la Guinée Équatoriale"
- Risque : Google peut demander preuve gov si l'app est trop ressemblant à une app gov sans déclaration

**Action Phase C.5** : confirmer avec l'user si domain `.gob.gq` existe + si lettre dispo. Si non, listing standard avec description gov.

---

## 8. PRIVACY POLICY URL — vérification

### 8.1 Pages web confirmées publiques (route group `(public)`)
- `packages/web/src/app/[locale]/(public)/legal/privacy/page.tsx`
- `packages/web/src/app/[locale]/(public)/legal/terms/page.tsx`
- `packages/web/src/app/[locale]/(public)/legal/cookies/page.tsx`

### 8.2 URL publique CONFIRMÉE (vérifié 2026-05-02 via curl)

Le frontend Next.js est déployé sur **Cloud Run** (output: standalone, SSR/ISR), pas Firebase Hosting (le `firebase.json` racine est legacy).

| URL | Status | Usage |
|-----|--------|-------|
| `https://taxasge-frontend-staging-392159428433.us-central1.run.app/` | ✅ 200 | Root |
| `https://taxasge-frontend-staging-392159428433.us-central1.run.app/es` | ✅ 200 | Locale ES |
| `https://taxasge-frontend-staging-392159428433.us-central1.run.app/es/legal/privacy` | ✅ 200 | **Privacy Policy URL — Play Store** |
| `https://taxasge-frontend-staging-392159428433.us-central1.run.app/es/legal/terms` | ✅ 200 | Terms URL |
| `https://taxasge-frontend-staging-392159428433.us-central1.run.app/legal/privacy` (sans locale) | ⚠️ 307 redirect | Mobile-friendly fallback |

**❌ NON UTILISABLE** :
- `https://taxasge-dev.web.app/es/legal/privacy` (404 — Firebase Hosting ne sert pas Next.js SSR)
- Custom domain `taxasge.gob.gq` / `taxasge.app` non résolus en DNS

**URL Privacy à fournir Play Console (V1)** :
```
https://taxasge-frontend-staging-392159428433.us-central1.run.app/es/legal/privacy
```

**Recommandation** : avant submission Play Store finale, configurer un custom domain (`taxasge.gob.gq` ou `app.taxasge.gq`) qui aliase vers le Cloud Run, pour une URL plus présentable. Actionnable via :
```
gcloud run domain-mappings create --service=taxasge-frontend-staging --domain=taxasge.gob.gq --region=us-central1
```
+ DNS CNAME → ghs.googlehosted.com.

---

## 9. PERMISSIONS JUSTIFICATION

Permissions déclarées dans `packages/mobile/app.json` :

| Permission | Justification (à coller Play Console si demandé) |
|------------|--------------------------------------------------|
| `INTERNET` | Required to communicate with the Facil backend (HTTPS REST API) |
| `CAMERA` | Required to scan tax documents (DIP, passport, certificates) for OCR processing |
| `READ_EXTERNAL_STORAGE` | Required to upload existing PDFs/images to the vault |
| `VIBRATE` | Used to provide tactile feedback on form validation errors and notifications |
| `USE_BIOMETRIC` / `USE_FINGERPRINT` | Optional — quick re-auth via fingerprint/Face ID after first login |
| `POST_NOTIFICATIONS` | Required to receive push notifications about service request status, payment confirmations, document expiry alerts |

**iOS** (préparé, non distribué V1) :
- `NSCameraUsageDescription` ✅ déclaré dans app.json
- `NSPhotoLibraryUsageDescription` ✅
- `NSFaceIDUsageDescription` ✅
- `UIBackgroundModes: remote-notification` ✅

---

## 10. APP CATEGORY, TAGS, COUNTRY

| Champ | Valeur |
|-------|--------|
| **Category** | Finance |
| **Tags** | Tax, Government services, Equatorial Guinea, Fiscal |
| **Country availability** | Equatorial Guinea (primary) — extensions possibles : Espagne, France, Cameroun (diaspora) — à confirmer user |
| **Pricing** | Free, no in-app purchases |
| **Ads** | No ads |
| **Title** | Facil (≤30 chars) ✅ |

---

## 11. CHECKLIST OPÉRATIONNELLE

- [x] **C.1** Plan détaillé (ce fichier)
- [x] **C.2** Audit data exhaustif (intégré §2)
- [ ] **C.3** Vérifier `chatbot_conversations` cascade delete sur users.id (BD direct asyncpg)
- [ ] **C.4** Tester URL publique web `/legal/privacy` accessible sans auth (curl staging)
- [ ] **C.5** Créer user test reviewer Google en BD (INSERT direct + password en GCP Secret)
- [ ] **C.6** Confirmer avec user :
  - Target Audience 18+ ou 13+ ?
  - Country availability au-delà de GE ?
  - Domain `.gob.gq` ou lettre d'autorisation gov dispo ?
  - URL Privacy Policy définitive ?
- [ ] **C.7** Reporter Data Safety Form dans Play Console (action user post-Phase D)
- [ ] **C.8** Reporter IARC questionnaire dans Play Console (action user)
- [ ] **C.9** Reporter Target Audience + Government Declaration (action user)
- [ ] **C.10** Reporter Permissions justifications (action user)
- [ ] **C.11** Auto-critique `MOBILE_PHASE_10_C_CRITIQUE.md`
- [ ] **C.12** Commit local — plan Phase C + critique. Pas de code modifié.

---

## 12. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Google rejette pour Government App sans preuve | MOYENNE | HAUT | Phase C.6 confirmer avec user + soumettre version standard si pas de preuve |
| BANGE retention policy non documentée | HAUTE | MOYEN | Mention dans Privacy Policy "BANGE applique sa propre policy" + lien BANGE si dispo |
| Vertex AI default retention 30j (Google Cloud) | FAIBLE | FAIBLE | Mention Privacy Policy "Documents transmitted to Google Cloud Vertex AI for AI processing, retained according to Google Cloud terms" |
| URL Privacy Policy 404 en prod | FAIBLE | HAUT | Phase C.4 vérifier curl avant submission |
| User test review credentials leak | FAIBLE | MOYEN | Mot de passe en GCP Secret, rotation après review Google |
| `chatbot_conversations` ne cascade pas → orphelins après delete account | À VÉRIFIER | MOYEN | Phase C.3 vérifier FK ; si absent → migration 332 ALTER TABLE |

---

## 13. SUIVI

- **2026-05-02 v1.0** : Plan détaillé créé après audit data exhaustif via agent Explore. 17 catégories de données mappées. Décisions à confirmer user : Target Audience, Country availability, Government Declaration, URL Privacy Policy.
