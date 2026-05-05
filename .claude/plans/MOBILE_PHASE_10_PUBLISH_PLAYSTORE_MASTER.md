# MOBILE PHASE 10 — PUBLICATION PLAY STORE — MASTER PLAN

**Date de création** : 2026-05-02
**Auteur** : Claude (Opus 4.7) — agissant comme expert mobile + GCP + Play Console
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md` (dernière phase)
**Cible** : `packages/mobile/` — app **Facil** (citizen + business)
**Goal final** : V1 Facil mobile **disponible publiquement** sur Google Play Store
**Branche de travail** : `develop` (exclusivement — confirmé user)
**Plateforme V1** : Android uniquement (iOS reporté V1.1 si Apple Dev Account)

---

## 0. CADRAGE — Ce que cette phase EST et N'EST PAS

### Ce que c'est
- **Finalisation production** d'une app mobile déjà en Phase 9 livrée (OWASP Mobile + Sentry + LogRocket + RGPD export wirés)
- **Mise en conformité réglementaire** Play Store (Data Safety, Content Rating, Target Audience, Privacy Policy mobile)
- **Configuration GCP/EAS submit** (service account Play API, secrets prod, signing)
- **Assets store** (screenshots, listing, descriptions × 3 langues)
- **Soft-launch interne** (Internal Testing track) puis **promotion Production**

### Ce que ce n'est PAS
- ❌ Refonte du design (Phase A est limitée aux bugs visuels résiduels post device test)
- ❌ Nouvelles fonctionnalités (V1 = scope figé Phase 0-9)
- ❌ Migration backend prod séparé (décision user : staging = prod V1)
- ❌ Build iOS (différé — pas d'Apple Dev Account actif sur ce compte)
- ❌ Closed/Open Testing tracks (décision user : Internal → Production direct)

### Sources de vérité
1. **Code mobile actuel** (`packages/mobile/src/`) — Phase 9 livrée
2. **EAS config existante** (`packages/mobile/eas.json`, `app.json`)
3. **CI/CD existant** (`.github/workflows/mobile-eas-build.yml`, `mobile-build.yml`)
4. **GCP Secret Manager** (project `taxasge-dev`, secrets `expo-token`, `sentry-auth-token`, `logrocket-app-id`)
5. **Play Console** : compte actif sur `kouemou.sah@gmail.com` (utilisé par GCP)
6. **Web legal pages** (`packages/web/src/app/[locale]/(public)/legal/*`) — référence textuelle
7. **Play Console policies** : https://support.google.com/googleplay/android-developer/answer/9859455 (Data safety) + https://play.google.com/about/developer-content-policy/

### Décisions actées (user — 2026-05-02)
| # | Sujet | Décision |
|---|-------|----------|
| D1 | Compte Play Console | `kouemou.sah@gmail.com` (déjà actif, lié GCP) |
| D2 | Environnement V1 | **`taxasge-dev` UNIQUEMENT** = considéré comme prod V1. NE PAS toucher `taxasge-pro` (laisser dormant pour V1.1+). Tous les pipelines, secrets, Firebase config, Supabase, Cloud Run, Sentry environnement = `taxasge-dev`. Les fichiers `*.prod.json` / `*.pro.plist` du dossier `config/` ne sont PAS utilisés en V1. |
| D3 | Release strategy | Internal Testing → Production direct (pas de Closed/Open) |
| D4 | Plateforme V1 | Android (production Play Store) + iOS Simulator build only (debug interne, pas de distribution device/TestFlight/App Store) — voir §11 |
| D5 | Pays cible | Guinée Équatoriale (à confirmer Phase E listing) |
| D6 | Fichiers Firebase mobile | `google-services.json` (= dev) et `GoogleService-Info.plist` (= dev) — **PAS** les variantes `.prod.json` / `.pro.plist`. Vérifier en Phase D que ce qui est packagé dans l'AAB pointe bien sur `taxasge-dev` (project_number 392159428433). |

---

## 1. ÉTAT INITIAL — Ce qui est déjà en place

### ✅ Fait (depuis Phase 0-9)
- App **Facil** Expo SDK 54, Expo Router, RN Paper MD3 (159+ fichiers TS/TSX)
- Auth complet (sign-in, sign-up, 2FA, reset, email verify)
- Modules livrés : Vault, Companies, Wizard, Payments BANGE, Support, Calculator, Directory, Dashboard
- Push notifications FCM (`firebase-admin` backend, `expo-notifications` token natif)
- Deep links Expo Router (`facil://`)
- i18n 3 langues (es default, fr, en — 875 clés × 3, 0 drift)
- Sentry React Native wired (`@sentry/react-native/expo` plugin, DSN via env)
- LogRocket session replay wired
- OWASP Mobile partiel (M1 secure-store, M2 npm audit HIGH=0, M3 token rotation, M4 Zod, M5 TLS, M6 RGPD export, M7 ProGuard ON, M9 expo-secure-store)
- Keystore Android signing : `packages/mobile/android/app/facil-release.keystore`
- EAS pipeline : `mobile-eas-build.yml` déclenché sur tag `v*.*.*` → AAB production
- GCP Secret Manager : `expo-token`, `sentry-auth-token`, `logrocket-app-id` rotés
- Privacy + Terms web pages (`/legal/privacy`, `/legal/terms`, `/legal/cookies`) × 3 langues

### ❌ Manquant / à corriger pour Play Store
| # | Item | Sévérité | Phase |
|---|------|----------|-------|
| M1 | Bugs visuels résiduels device (1.jpg safe-area, 2-3.jpg gap documents, onboarding spacing) | 🟠 IMPORTANT | A |
| M2 | Pages mobile **Privacy Policy + Terms** (3 langues, lien profile) | 🔴 BLOCKER | B |
| M3 | Écran **acceptation ToS au signup** (checkbox required + persistance BD) | 🔴 BLOCKER | B |
| M4 | **Data Safety Form** Play Console rempli | 🔴 BLOCKER | C |
| M5 | **Content Rating IARC** questionnaire complété | 🔴 BLOCKER | C |
| M6 | **Target Audience** (ages) déclaré | 🔴 BLOCKER | C |
| M7 | **Privacy Policy URL** hébergée publique (web `/legal/privacy`) — vérifier accessibilité publique | 🔴 BLOCKER | C |
| M8 | **Service Account GCP** Play Developer API + JSON key in Secret Manager | 🔴 BLOCKER | D |
| M9 | `eas.json` submit production : `serviceAccountKeyPath` réf vers le fichier décodé | 🔴 BLOCKER | D |
| M10 | Sentry environnement = `production` séparé du dev (release tagging `mobile@1.0.0`) | 🟠 IMPORTANT | D |
| M11 | **Play App Signing** : enrôler la clé upload (Google managed signing) | 🔴 BLOCKER | D |
| M12 | **Icon 512×512** + **Feature graphic 1024×500** | 🔴 BLOCKER | E |
| M13 | **8 screenshots phone** 1080×1920 avec captions × 3 langues | 🔴 BLOCKER | E |
| M14 | **Descriptions** courte (80c) + longue (4000c) × 3 langues | 🔴 BLOCKER | E |
| M15 | Tests E2E Maestro (5 flows critiques) | 🟠 IMPORTANT | F |
| M16 | Build AAB production via tag `v1.0.0` + upload Internal | 🔴 BLOCKER | F |
| M17 | Sentry alerts (crash-free < 99% → notification) | 🟠 IMPORTANT | G |

---

## 2. PHASES — Vue d'ensemble

| Phase | Titre | Durée estimée | Bloquant suite ? |
|-------|-------|----------------|------------------|
| **A** | Audit visuel résiduel + finition layout (post device captures) | 0.5j | OUI (UX qualité) |
| **B** | Privacy Policy + Terms mobile + écran acceptation | 1j | ✅ BLOCKER store |
| **C** | Conformité Google Play (Data Safety + IARC + Target Audience + listing form) | 1j | ✅ BLOCKER store |
| **D** | Configuration GCP + EAS Submit + Play App Signing | 0.5-1j | ✅ BLOCKER store |
| **E** | Assets Store (icons, screenshots, descriptions × 3 langues) | 0.5-1j | ✅ BLOCKER store |
| **F** | Tests E2E + Build AAB production + Internal Testing soft-launch | 1-2j travail + 5-7j monitoring | ✅ BLOCKER promo |
| **G** | Promotion Production + Monitoring post-launch + bilan | 0.5j travail + 7j monitoring | Final |

**Total temps de travail effectif** : ~5-7 jours
**Total temps de calendrier** (incluant soft-launch + monitoring) : ~14-21 jours

### Ordre d'exécution recommandé
1. **A → B** (qualité visuelle + légal — bloque tout le reste)
2. **C en parallèle de D** (Play Console form indépendant de la config GCP)
3. **E** (assets — peut commencer en parallèle de C)
4. **F** (build AAB + soft-launch) — ne peut commencer qu'après A→E ✅
5. **G** (promo + monitoring) — après 5-7j Internal Testing sans crash bloquant

---

## 3. PHASE-BY-PHASE — Checklists générales

> **Règle 1** : avant chaque phase, créer le plan détaillé `MOBILE_PHASE_10_X_DETAILED.md` avec architecture, design, fichiers impactés, payloads, schémas BD, tests.
> **Règle 2** : commit local par sous-tâche validée. Push après auto-critique de la phase, **après confirmation utilisateur** (mémoire #13).
> **Règle 3** : à la fin de chaque phase, mettre à jour ce master en cochant la checklist + ajouter au § 8 SUIVI.

---

### PHASE A — Audit visuel résiduel + finition layout

**Objectif** : éliminer tous les bugs visuels device détectés (post-fix captures 1.jpg/2.jpg/3.jpg) avant build production.

**Fichiers cibles connus**
- `packages/mobile/src/app/documents/index.tsx` (vault list — vérifier post-fix `flexGrow:1` + `removeClippedSubviews` retiré)
- `packages/mobile/src/app/companies/[id].tsx` (safe-area bottom)
- `packages/mobile/src/app/onboarding.tsx` (B1 spacing — déjà fix `adc92e4f` mais re-vérifier)
- `packages/mobile/src/app/(tabs)/index.tsx` (dashboard — référence m8.jpg OK)

**Checklist générale**
- [ ] **A.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_A_VISUAL_FINISH_DETAILED.md`
- [ ] **A.2** Build EAS preview (Android APK) avec token Expo (GCP Secret Manager `expo-token`)
- [ ] **A.3** Smoke test device : 5 onglets bottom nav (Accueil, Services, Mes demandes, Assistant IA, Profil) — capture par écran, comparer à m8.jpg référence
- [ ] **A.4** Smoke test stack screens : `/documents`, `/companies/[id]`, `/companies/[id]/payments`, `/support/*`, `/wizard/*`, `/payments/*`, `/calculator`, `/directorio`
- [ ] **A.5** Recensement bugs visuels résiduels (rapport `MOBILE_PHASE_10_A_DEVICE_AUDIT.md`)
- [ ] **A.6** Fix bugs P1 (safe-area, spacing manifeste, items coupés)
- [ ] **A.7** Vérifier que tous les écrans avec `FlatList` + `flex:1` ont la même protection (post-fix pattern documents)
- [ ] **A.8** Test 4 thèmes : Android light, Android dark, font-size accessibility (1.0× et 1.3×), petit écran (5"), grand écran (6.7"+)
- [ ] **A.9** Auto-critique `MOBILE_PHASE_10_A_CRITIQUE.md`
- [ ] **A.10** Commits sémantiques + push après confirmation user
- [ ] **A.11** GitHub Actions verts (mobile-build.yml + mobile-eas-build.yml manual dispatch preview)

**DoD Phase A**
- 0 bug visuel P1/P2 sur device réel
- tsc 0 erreur, ESLint < 100 warnings
- Captures avant/après archivées dans `Documentations/workflow/debug/tesoro/phase10-a/`

---

### PHASE B — Privacy Policy + Terms mobile + acceptation utilisateur

**Objectif** : obligatoire Play Store + RGPD-compliant. L'utilisateur DOIT voir et accepter avant de finaliser son inscription.

**Architecture proposée**
1. **Pages mobile inline** (réutilisent les textes web via i18n keys partagés) :
   - `/legal/privacy` : politique de confidentialité (3 langues)
   - `/legal/terms` : conditions générales d'utilisation (3 langues)
   - `/legal/cookies` : usage cookies + analytics + Sentry/LogRocket (3 langues)
2. **Écran acceptation au signup** :
   - Composant `LegalAcceptanceCard` injecté dans `(auth)/sign-up`
   - 2 checkboxes obligatoires : "J'accepte CGU" + "Je confirme avoir lu la politique de confidentialité"
   - Liens cliquables vers `/legal/terms` et `/legal/privacy`
   - Bouton "Créer mon compte" disabled tant que les 2 checkboxes ne sont pas cochées
3. **Persistance backend** :
   - Ajouter colonnes `users.terms_accepted_at TIMESTAMPTZ`, `users.terms_version VARCHAR(16)`, `users.privacy_accepted_at TIMESTAMPTZ`, `users.privacy_version VARCHAR(16)`
   - Migration SQL nouvelle (numéro suivant)
   - Endpoint `POST /auth/register` mis à jour pour exiger ces champs au payload
   - Endpoint `GET /legal/versions` pour exposer les versions courantes (lue par mobile)
4. **Profil mobile → Légal** :
   - Section "Légal" dans `/settings/profile` avec liens vers les 3 pages
   - Bouton "Re-consulter et ré-accepter" si version change

**Fichiers à créer**
- `packages/mobile/src/app/legal/privacy.tsx`
- `packages/mobile/src/app/legal/terms.tsx`
- `packages/mobile/src/app/legal/cookies.tsx`
- `packages/mobile/src/app/legal/_layout.tsx` (stack header)
- `packages/mobile/src/modules/legal/components/legal-acceptance-card.tsx`
- `packages/mobile/src/core/i18n/locales/{es,fr,en}.json` — section `legal.privacy.*`, `legal.terms.*`, `legal.cookies.*`
- `packages/backend/migrations/3XX_legal_acceptance_columns.sql`
- `packages/backend/app/modules/legal/api/legal_routes.py` (NEW)
- `packages/backend/app/main.py` — register router

**Checklist générale**
- [ ] **B.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_B_LEGAL_DETAILED.md`
- [ ] **B.2** Audit textes légaux web : extraire textes complets en 3 langues (`legalPages.privacy.*`, `legalPages.terms.*`, `legalPages.cookies.*`)
- [ ] **B.3** Backend : migration `users.terms_accepted_at` + `terms_version` + `privacy_accepted_at` + `privacy_version`
- [ ] **B.4** Backend : router `legal_routes.py` exposant `GET /legal/versions` (lit env vars `LEGAL_TERMS_VERSION`, `LEGAL_PRIVACY_VERSION`)
- [ ] **B.5** Backend : modifier `/auth/register` pour exiger `terms_version_accepted` + `privacy_version_accepted` au payload + persister timestamp
- [ ] **B.6** Mobile : pages `/legal/privacy.tsx`, `/legal/terms.tsx`, `/legal/cookies.tsx` (3 langues, scrollview, sections numérotées, "Dernière mise à jour" date)
- [ ] **B.7** Mobile : composant `LegalAcceptanceCard` avec 2 checkboxes + liens
- [ ] **B.8** Mobile : intégration dans `(auth)/sign-up` — bouton submit disabled tant que checkboxes != cochées
- [ ] **B.9** Mobile : section "Légal" dans `/settings/profile` (3 liens)
- [ ] **B.10** Mobile : i18n 3 langues — clés `legal.privacy.*`, `legal.terms.*`, `legal.cookies.*`, `legal.acceptance.*`
- [ ] **B.11** Hook `useLegalVersions()` qui pull `/legal/versions` au mount sign-up
- [ ] **B.12** Tests : sign-up sans cocher → bouton disabled. Avec cocher → POST /auth/register inclut versions. BD updated.
- [ ] **B.13** Auto-critique `MOBILE_PHASE_10_B_CRITIQUE.md`
- [ ] **B.14** Commits sémantiques (5-6 commits : migration BD, backend route, mobile legal pages, mobile acceptance card, mobile profile section, i18n)
- [ ] **B.15** Push après confirmation user

**DoD Phase B**
- Sign-up impossible sans accepter les 2 documents
- Versions persistées en BD avec timestamps
- 3 pages mobile rendent le contenu en 3 langues
- Lien depuis Profile fonctionne
- 0 régression sign-up (tests existants passent)
- Privacy Policy URL **publique** = `https://taxasge.gob.gq/{lang}/legal/privacy` (à confirmer prod web URL)

---

### PHASE C — Conformité Google Play (Data Safety + IARC + Target Audience + listing form)

**Objectif** : remplir TOUS les questionnaires Play Console qui bloquent la soumission.

**Checklist générale**
- [ ] **C.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_C_PLAY_COMPLIANCE_DETAILED.md`
- [ ] **C.2** Recenser **données collectées par Facil** (audit code mobile + backend) :
  - Identifiants : email, téléphone, NIF, full_name, avatar
  - Localisation approximative : ville/province (saisie user, pas GPS)
  - Documents personnels : DIP, passeports, certificats (vault)
  - Données financières : transactions paiements BANGE
  - Activité in-app : Sentry events, LogRocket sessions
  - Identifiants device : FCM token, build version, device_info
- [ ] **C.3** Pour chaque catégorie, déterminer :
  - Collected ? Y/N
  - Shared with third parties ? Y/N (Sentry, LogRocket, Firebase, BANGE)
  - Encrypted in transit ? Y (TLS 1.2+)
  - Required or optional ?
  - User can request delete ? Y (RGPD `/users/profile` DELETE livré P9)
- [ ] **C.4** Remplir **Data Safety Form** dans Play Console (pas de code)
- [ ] **C.5** Compléter **Content Rating IARC questionnaire** — Facil ne contient ni violence, ni sexe, ni gambling — rating attendu : "Everyone" ou "PEGI 3"
- [ ] **C.6** **Target Audience** : sélectionner "18+" (services fiscaux/légaux) ou "13+" si on veut élargir (à valider — services nécessitent NIF officiel)
- [ ] **C.7** **News App Declaration** : "Not a news app"
- [ ] **C.8** **Government App Declaration** : déclarer "Government Entity / Government App" (Facil = service gouvernemental Guinée Équatoriale) — fournir lettre d'autorisation ou domain `.gob.gq`
- [ ] **C.9** **App access** : déclarer login required + provide demo credentials (compte test + mot de passe pour reviewers Google)
- [ ] **C.10** **App Category** : "Finance" (primary) — peut-être "Productivity" alt
- [ ] **C.11** **App Tags** : taxes, gobierno, fiscal, ges, finance
- [ ] **C.12** **Privacy Policy URL** : confirmer URL web publique (`https://taxasge.gob.gq/es/legal/privacy` ou équivalent) accessible sans login
- [ ] **C.13** **Permissions justification** (par permission Android) : INTERNET (API), CAMERA (scan docs), READ_EXTERNAL_STORAGE (upload), VIBRATE (UX), USE_BIOMETRIC (auth), POST_NOTIFICATIONS (alerts)
- [ ] **C.14** **Country availability** : Guinée Équatoriale (+ optionnel Espagne, France pour diaspora — à valider)
- [ ] **C.15** **Pricing** : Free, sans IAP
- [ ] **C.16** **Ads** : "No ads"
- [ ] **C.17** Auto-critique `MOBILE_PHASE_10_C_CRITIQUE.md`
- [ ] **C.18** Screenshots du formulaire Play Console rempli archivés dans `Documentations/playstore/forms/`

**DoD Phase C**
- Tous les questionnaires Play Console verts
- Data Safety Form publié (visible avant install par les users)
- Content Rating obtenu (badge officiel IARC)
- 0 erreur "Required item missing" dans Play Console dashboard

---

### PHASE D — Configuration GCP + EAS Submit + Play App Signing

**Objectif** : pipeline EAS submit fonctionnel, Sentry/LogRocket prod isolés, signing Play managé.

**Architecture**
1. **Service Account GCP** (Google Play Developer API)
   - Créer dans GCP Console projet `taxasge-dev` (ou nouveau projet `taxasge-prod`) : IAM → Service Accounts → Create
   - Rôle minimal : aucun rôle GCP requis. C'est dans **Play Console** qu'on attribue les permissions.
   - Générer JSON key
   - Stocker dans GCP Secret Manager : `gcloud secrets create google-play-service-account --data-file=key.json`
   - Dans **Play Console** → Users and permissions → Inviter le service account email + permissions "Release manager" (ou plus restrictif "Releases to testing tracks only")
2. **EAS submit config**
   - Modifier `packages/mobile/eas.json` submit production pour utiliser `serviceAccountKeyPath` qui résout vers le JSON décodé runtime
   - Workflow GitHub Action `mobile-eas-submit.yml` (NEW) qui :
     - Pulls JSON depuis Secret Manager
     - Écrit fichier temporaire
     - Lance `eas submit --platform android --profile production --latest`
3. **Sentry environnement séparé**
   - Modifier `core/observability/sentry.ts` : `environment: __DEV__ ? 'development' : 'production'`
   - Release tagging : `release: 'mobile@${appVersion}+${buildNumber}'`
   - Sourcemaps upload via plugin Expo (déjà wired)
4. **LogRocket appId production** : déjà via env var, vérifier que prod env utilise le bon
5. **Play App Signing**
   - Ne PAS soumettre la keystore originale — Google la génère
   - Upload notre `facil-release.keystore` comme **upload key** (pas signing key)
   - Google App Signing va re-signer avant distribution
   - Documenter `keystore-fingerprint` SHA-1, SHA-256 pour FCM, Google Sign-In éventuel

**Checklist générale**
- [ ] **D.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_D_GCP_EAS_DETAILED.md`
- [ ] **D.2** GCP : créer Service Account `play-publisher@taxasge-dev.iam.gserviceaccount.com`
- [ ] **D.3** GCP : générer JSON key + uploader Secret Manager `google-play-service-account`
- [ ] **D.4** Play Console : inviter service account email avec rôle "Release manager"
- [ ] **D.5** Play Console : vérifier rôle visible avant tester (24h propagation parfois)
- [ ] **D.6** EAS : `eas submit --profile production --dry-run` pour valider config
- [ ] **D.7** GitHub Actions : `mobile-eas-submit.yml` qui pull secret + soumet AAB
- [ ] **D.8** Sentry : config `environment: 'production'` + release tagging + DSN prod (séparer si possible un nouveau projet `react-native-prod`)
- [ ] **D.9** LogRocket : vérifier que `LOGROCKET_APP_ID` prod EAS env = appId distinct du dev
- [ ] **D.10** Play App Signing : enrôler la clé dans Play Console — upload keystore SHA1/SHA256 fingerprint
- [ ] **D.11** Documenter `Documentations/mobile/SIGNING_KEYS.md` : fingerprints, alias, where stored
- [ ] **D.12** Test build production preview (no-submit) — vérifier qu'il s'inscrit avec la bonne signature
- [ ] **D.13** Auto-critique `MOBILE_PHASE_10_D_CRITIQUE.md`
- [ ] **D.14** Commits + push après confirmation user

**DoD Phase D**
- `eas submit` fonctionne sans erreur (dry-run)
- Service account peut uploader sur Internal Testing track
- Sentry events prod isolés du dev (filtre `environment=production` testé)
- Keystore fingerprints documentés
- Aucun secret en clair dans repo

---

### PHASE E — Assets Store (icons, screenshots, descriptions × 3 langues)

**Objectif** : tous les assets visuels et textuels prêts pour Play Console.

**Spécifications Play Store**
| Asset | Dimensions | Format | Obligatoire |
|-------|-----------|--------|-------------|
| App icon | 512×512 | PNG 32-bit (alpha) | ✅ |
| Feature graphic | 1024×500 | PNG/JPG 24-bit | ✅ |
| Phone screenshots | min 1080×1920 (16:9) | PNG/JPG | ✅ (min 2, max 8) |
| 7" tablet screenshots | min 1024×600 | PNG/JPG | optionnel |
| 10" tablet screenshots | min 1080×1920 | PNG/JPG | optionnel |
| Promo video | URL YouTube | URL | optionnel |
| Short description | max 80 chars | texte | ✅ |
| Full description | max 4000 chars | texte | ✅ |
| Title | max 30 chars | texte | ✅ |

**Checklist générale**
- [ ] **E.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_E_ASSETS_DETAILED.md`
- [ ] **E.2** Vérifier icon existant `assets/images/icon_facil.png` est **512×512 32-bit alpha** (sinon redresser depuis logo HD)
- [ ] **E.3** Créer **Feature Graphic 1024×500** (logo Facil + tagline)
- [ ] **E.4** Choisir 8 écrans clés à capturer (recommandation) :
  1. Onboarding slide 1 (welcome)
  2. Dashboard accueil avec stats
  3. Liste services fiscaux
  4. Wizard step (upload doc + extraction Gemini)
  5. Payment BANGE recap
  6. Vault documents
  7. Companies (business)
  8. Profil + 2FA
- [ ] **E.5** Capturer × 3 langues (24 screenshots total) avec device emulator pixel-perfect 1080×1920
- [ ] **E.6** **Title** : "Facil" (≤30 chars) ✅
- [ ] **E.7** **Short description** × 3 langues (≤80 chars) :
  - ES : "Facil — Servicios fiscales digitales de Guinea Ecuatorial"
  - FR : "Facil — Services fiscaux numériques de la Guinée Équatoriale"
  - EN : "Facil — Digital fiscal services for Equatorial Guinea"
- [ ] **E.8** **Full description** × 3 langues (≤4000 chars) — sections : What is Facil, Features, Who is it for, Privacy & Security, Support contact
- [ ] **E.9** **Tagline / promotional text** (optionnel)
- [ ] **E.10** **What's new** (release notes V1) × 3 langues
- [ ] **E.11** Promo video YouTube (optionnel V1.1)
- [ ] **E.12** Auto-critique `MOBILE_PHASE_10_E_CRITIQUE.md`
- [ ] **E.13** Commit assets dans repo (`Documentations/playstore/assets/`)

**DoD Phase E**
- Tous les assets uploadés Play Console (preview avant publish)
- 3 langues présentes pour tous les textes
- Icon respecte les guidelines (pas de bordure, pas de cadre, transparent OK)

---

### PHASE F — Tests E2E + Build AAB production + Internal Testing

**Objectif** : AAB production signée + 5-7j soft-launch interne.

**Architecture**
1. **Tests E2E Maestro** (5 flows critiques)
   - Login → Dashboard
   - Wizard Pasaporte (sans paiement réel — abort avant POST `/initiate-payment`)
   - Vault upload + use in wizard
   - Companies → Bundle obligation list
   - Support créer ticket + reply
2. **Build AAB production**
   - Bump version `1.0.0` dans `app.json` (déjà case)
   - `autoIncrement: true` côté EAS gère le `versionCode`
   - Tag `git tag v1.0.0` → workflow `mobile-eas-build.yml` se déclenche
3. **Upload Internal Testing**
   - `eas submit --platform android --profile production --latest --track internal` (déjà case dans eas.json)
   - Inviter 10-20 testeurs internes (emails Gmail) — équipe Facil + early adopters
4. **Soft-launch monitoring 5-7 jours**
   - Sentry dashboard : crash-free rate, top errors
   - LogRocket : sessions, frustration index
   - Manual feedback collecté (formulaire Google Form ou support tickets)

**Checklist générale**
- [ ] **F.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_F_E2E_BUILD_DETAILED.md`
- [ ] **F.2** Setup Maestro : `npm i -g @mobile-dev/maestro` ou équivalent CI
- [ ] **F.3** Écrire 5 flows Maestro `.maestro/{login,wizard,vault,companies,support}.yaml`
- [ ] **F.4** Run E2E sur Android Emulator local
- [ ] **F.5** CI E2E : optionnel job `mobile-e2e.yml` (peut être différé V1.1)
- [ ] **F.6** `app.json` version `1.0.0` + bump versionCode
- [ ] **F.7** Vérifier `eas.json` production env vars complets (API_URL = staging URL = prod V1, LogRocket prod, Sentry prod)
- [ ] **F.8** Tag `git tag v1.0.0` + push → trigger `mobile-eas-build.yml`
- [ ] **F.9** Suivre build sur https://expo.dev/accounts/emacsah/projects/facil/builds
- [ ] **F.10** Téléchargement AAB de l'EAS dashboard
- [ ] **F.11** `eas submit --profile production --latest` (track Internal)
- [ ] **F.12** Play Console : Internal Testing track → vérifier release status
- [ ] **F.13** Inviter 10-20 testeurs (emails) via Play Console "Testers" tab
- [ ] **F.14** Notification Slack/email équipe : "Internal Testing live"
- [ ] **F.15** Soft-launch 5-7 jours : daily check Sentry crash-free rate, LogRocket frustration, support tickets
- [ ] **F.16** Bugfix éventuels (si bug bloquant : nouveau patch v1.0.1)
- [ ] **F.17** Auto-critique `MOBILE_PHASE_10_F_CRITIQUE.md`
- [ ] **F.18** GO/NO-GO Phase G — décision basée sur métriques :
  - GO : crash-free > 99.5%, ANR < 0.5%, 0 crash bloquant signalé, 0 issue P1 ouverte
  - NO-GO : ≥ 1 crash bloquant → Phase F.16 patch + nouvelle attente 5j

**DoD Phase F**
- AAB v1.0.0 uploadée Internal Testing
- 10+ testeurs ont installé et utilisé l'app pendant 5-7 jours
- Crash-free sessions > 99.5%
- 0 crash bloquant rapporté

---

### PHASE G — Promotion Production + Monitoring post-launch

**Objectif** : V1 publique sur Play Store + monitoring 7j garanti.

**Architecture**
1. **Promotion Internal → Production**
   - Play Console → Production track → "Create new release"
   - Sélectionner le même AAB que Internal (ou re-build si patch nécessaire)
   - Country availability : Guinée Équatoriale (+ optionnel Espagne, France diaspora)
   - Phased rollout : commencer 20% → 50% → 100% sur 7-10 jours
2. **Monitoring alerts**
   - Sentry alert "Crash-free sessions < 99% over 1h" → email
   - Sentry alert "New issue with ≥ 50 events/h" → email + Slack
   - LogRocket alert "Frustration index spike" → email
3. **Rollback strategy**
   - Si crash critique apparaît : suspendre rollout + investiguer
   - Patch rapide : v1.0.1 publié en 24-48h max
   - Worst case : "Halt rollout" Play Console (n'unpublish pas mais arrête nouveaux installs)

**Checklist générale**
- [ ] **G.1** Plan détaillé `.claude/plans/MOBILE_PHASE_10_G_PRODUCTION_DETAILED.md`
- [ ] **G.2** Sentry : créer alerts (crash-free rate, new issue volume)
- [ ] **G.3** LogRocket : configure session sampling production (50% par défaut, 100% si erreur)
- [ ] **G.4** Play Console : créer release Production avec phased rollout 20%
- [ ] **G.5** Country availability : Guinée Équatoriale + (à confirmer) Espagne + France
- [ ] **G.6** Submit for review (24h-7j review temps Google)
- [ ] **G.7** Approval : monitoring 24h après live
- [ ] **G.8** Augmenter rollout 20% → 50% (J+3 si métriques OK)
- [ ] **G.9** Augmenter 50% → 100% (J+7 si métriques OK)
- [ ] **G.10** Documentation finale `Documentations/mobile/V1_LAUNCH_REPORT.md` :
  - Date publication, version, AAB SHA, signing fingerprint
  - Métriques 7 premiers jours (installs, crash-free, retention D1/D7)
  - Issues majeures rencontrées + résolutions
  - Backlog V1.1
- [ ] **G.11** Mise à jour `MEMORY.md` projet TaxasGE — entrée "Phase 10 Production launch"
- [ ] **G.12** Push final + tag git `mobile-prod-v1.0.0`
- [ ] **G.13** Auto-critique globale Phase 10 `MOBILE_PHASE_10_GLOBAL_CRITIQUE.md`
- [ ] **G.14** Bilan session + remerciements équipe

**DoD Phase G**
- App live sur Play Store accessible publiquement
- 100% rollout atteint sans crash bloquant
- Monitoring vert 7 jours
- Documentation V1 livrée

---

## 4. CRITÈRES DE VALIDATION GLOBAL (DoD du plan complet)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | App publiée sur Play Store, downloadable par tout user GE | URL publique Play Store |
| V2 | Crash-free sessions > 99.5% sur 7j | Sentry dashboard |
| V3 | ANR rate < 0.5% sur 7j | Play Console vitals |
| V4 | Tous les questionnaires Play Console verts | Play Console review |
| V5 | Privacy Policy + ToS publiés (web) + acceptation forcée signup | URL web + sign-up flow |
| V6 | RGPD : delete account + export data fonctionnent | smoke test |
| V7 | OWASP Mobile M1-M10 : audit final 100% checklist | `MOBILE_USER_PHASE_9_AUDIT_ADVERSARIAL.md` updated |
| V8 | i18n 3 langues complètes sur 100% des clés | drift script exit 0 |
| V9 | Tests E2E Maestro 5 flows verts | CI report |
| V10 | Aucun secret en clair dans repo (`gitleaks` scan) | gitleaks |
| V11 | Toutes les phases A-G ont leur plan détaillé + critique livrée | git log .claude/plans/ |
| V12 | Documentation V1 launch report complète | `Documentations/mobile/V1_LAUNCH_REPORT.md` |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Google Play rejette l'app (Data Safety incomplet, permissions injustifiées) | MOYENNE | HAUT | Phase C exhaustive, demo credentials fournis, Government App declaration |
| Crash bloquant détecté en Internal Testing | MOYENNE | HAUT | Bugfix v1.0.1, monitoring Sentry/LogRocket actif |
| Service Account Play API pas propagé (24h delay parfois) | MOYENNE | MOYEN | Faire D.4 d'abord, attendre 24h avant F.11 |
| Backend staging downtime impacte les users prod | MOYENNE | HAUT | Décision user accepted ; alerting GCP Cloud Run uptime ; CDN/cache aggressive |
| Privacy Policy URL non accessible publique (web auth gate) | FAIBLE | HAUT | Vérifier Phase B.6 que `/legal/*` est dans `(public)` route group |
| Play App Signing key fingerprint mismatch | FAIBLE | HAUT | Documentation `SIGNING_KEYS.md` + dry-run avant submit |
| Sentry rate-limit prod (1M users) | FAIBLE | MOYEN | Sampling rate ajustable, plan Sentry adapté à user count |
| Tests E2E Maestro flaky | MOYENNE | FAIBLE | Acceptable retry, ne bloque pas Phase F |
| Apple Dev Account pression interne future | FAIBLE | MOYEN | iOS différé V1.1, code reste cross-platform |
| Bug post-fix layout pas vraiment résolu sur certains devices | MOYENNE | MOYEN | Phase A vérifie au moins 3 modèles Android (Samsung, Xiaomi, Pixel) |

---

## 6. RÈGLES D'EXÉCUTION (CLAUDE.md compliant)

1. **Avant chaque phase** : créer plan détaillé `.claude/plans/MOBILE_PHASE_10_X_DETAILED.md` avec architecture, design, types, payloads, schémas BD, tests.
2. **Pendant la phase** : commit local par sous-tâche validée. Pas de push tant que la phase n'est pas critiquée et corrigée.
3. **Fin de phase** :
   - Tests automatisés passent (TS check, lint, drift script i18n)
   - Auto-critique écrite (qu'est-ce qui pourrait casser ?)
   - Corrections appliquées
   - Demande de validation utilisateur AVANT push (mémoire #13)
4. **Aucun hardcodage** : tout via `appConfig`, env vars, GCP Secret Manager.
5. **Aucun mock de données** : si l'endpoint n'existe pas backend, on l'ajoute backend AVANT mobile.
6. **OWASP en continu** : checklist M1-M10 à chaque phase + audit final Phase G.
7. **Délégation** : Phase E (assets) si volume → délégation `documentation-engineer` ou `frontend-design`. Phase C audit data → `general-purpose`.
8. **Pas de régression** : workflows non-bundle stables (mémoire #16).
9. **JAMAIS de build manuel gcloud** — toujours via GitHub Actions / EAS Cloud.

---

## 7. INTÉGRATIONS CRITIQUES (à valider avant Phase A)

### 7.1 Compte Play Console
- Compte : `kouemou.sah@gmail.com` (utilisé par GCP, même que `gcloud auth list`)
- App créée ? **À vérifier en début de Phase D** — si non, créer "Facil" avec package `com.taxasge.app`

### 7.2 Projet GCP unique V1
- **`taxasge-dev`** (project number `392159428433`) = environnement unique V1
- Cloud Run backend : `taxasge-backend-staging-392159428433.us-central1.run.app` (déjà en place)
- Firebase mobile : `google-services.json` + `GoogleService-Info.plist` (= dev) packagés dans l'AAB
- Supabase : projet dev existant (URL/keys via env Cloud Run)
- Sentry environnement field : reste `production` (pour distinguer __DEV__ local) mais projet Sentry unique `react-native`
- LogRocket : `LOGROCKET_APP_ID` unique dev
- **`taxasge-pro` reste DORMANT** — ne pas toucher en V1

### 7.3 GCP Secrets requis (tous sur `taxasge-dev`)
| Secret | Usage | Statut |
|--------|-------|--------|
| `expo-token` | EAS CLI auth | ✅ existe (taxasge-dev) |
| `sentry-auth-token` | Sourcemap upload | ✅ existe |
| `logrocket-app-id` | LogRocket SDK | ✅ existe |
| `google-play-service-account` | EAS submit | ❌ à créer Phase D (sur `taxasge-dev`) |
| `android-keystore-base64` | GitHub Actions signing | ⚠️ déjà GitHub secret (ANDROID_KEYSTORE_BASE64) — synchroniser avec GCP optionnel |

### 7.3 GitHub Actions secrets requis (déjà en place — vérifier)
- `EXPO_TOKEN`
- `SENTRY_AUTH_TOKEN`
- `LOGROCKET_APP_ID`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- À ajouter Phase D : `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (base64) ou pull depuis GCP

---

## 8. SUIVI DU PLAN

### État global
- 🔄 **Phase A** : pending (Plan détaillé à écrire en début)
- 🔄 **Phase B** : pending
- 🔄 **Phase C** : pending
- 🔄 **Phase D** : pending
- 🔄 **Phase E** : pending
- 🔄 **Phase F** : pending
- 🔄 **Phase G** : pending

### Plans détaillés à créer (au fur et à mesure)
- [ ] `MOBILE_PHASE_10_A_VISUAL_FINISH_DETAILED.md`
- [ ] `MOBILE_PHASE_10_B_LEGAL_DETAILED.md`
- [ ] `MOBILE_PHASE_10_C_PLAY_COMPLIANCE_DETAILED.md`
- [ ] `MOBILE_PHASE_10_D_GCP_EAS_DETAILED.md`
- [ ] `MOBILE_PHASE_10_E_ASSETS_DETAILED.md`
- [ ] `MOBILE_PHASE_10_F_E2E_BUILD_DETAILED.md`
- [ ] `MOBILE_PHASE_10_G_PRODUCTION_DETAILED.md`

### Critiques par phase
- [ ] `MOBILE_PHASE_10_A_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_B_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_C_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_D_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_E_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_F_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_G_CRITIQUE.md`
- [ ] `MOBILE_PHASE_10_GLOBAL_CRITIQUE.md`

---

## 9. CHANGELOG

- **2026-05-02 v1.0** : Création initiale après audit code mobile + git history + plans Phase 0-9 + lecture eas.json/app.json/CI/CD. Décisions user actées : compte Play `kouemou.sah@gmail.com`, backend staging=prod V1, Internal→Production direct, Android only V1.
- **2026-05-02 v1.1** : Découverte dossier `config/` (Firebase prod + dev séparés). Décision user post-découverte : **`taxasge-dev` UNIQUEMENT** comme environnement V1 (considéré comme prod). `taxasge-pro` reste dormant — pas de bascule en V1. D2 et §7 mis à jour.
- **2026-05-02 v1.2** : Ajout §11 iOS — clarification honnête sur ce qui est faisable SANS Apple Developer Account ($99/an). Build Simulator OUI (debug Mac uniquement, déjà wired dans `eas.json` profile preview). Build device / TestFlight / App Store NON possibles, GCP/Firebase n'ont AUCUN rôle dans le pipeline de signing Apple. Master plan v1.1 validé par user.

---

## 10. DÉCISIONS À PRENDRE AVANT D'ATTAQUER UNE PHASE

| Phase | Question | Quand demander |
|-------|----------|----------------|
| B | Versions ToS / Privacy : `1.0.0` ou date ISO `2026-05-02` ? | Avant B.4 |
| C | Target Audience : 18+ (services fiscaux) ou 13+ (élargir base) ? | Avant C.6 |
| C | Country availability au-delà de GE : Espagne / France / Maroc / Cameroun (diaspora) ? | Avant C.14 |
| D | Sentry : nouveau projet `react-native-prod` ou `environment` field suffit ? | Avant D.8 |
| F | Tests E2E Maestro : skipper ou inclure obligatoire ? | Avant F.2 (peut être différé V1.1) |
| G | Phased rollout : 20→50→100 ou 100% direct (apps gov souvent direct) ? | Avant G.4 |

---

**Prêt pour exécution.** Premier acte : Phase A — plan détaillé + smoke device.

---

## 11. iOS — Ce qui est faisable SANS Apple Developer Account

### Position honnête (challenge à la demande user)

> *"Intègre le build et déploiement iOS si les outils GCP permettent de le faire sans compte Apple Developer."*

**Réponse experte** : **GCP / Firebase n'ont AUCUN rôle dans le pipeline de signing/distribution iOS.** Apple est un écosystème fermé. Aucun cloud provider tiers ne peut contourner cette exigence. Voici ce qui est réellement faisable :

### 11.1 Matrice des possibilités iOS

| Action | Apple Dev Account requis ? | GCP peut aider ? | Statut V1 |
|--------|----------------------------|------------------|-----------|
| Build iOS Simulator (`.app`) — pour debug Mac uniquement | ❌ NON | ❌ N/A | ✅ Faisable V1 |
| Build iOS Device (`.ipa` ad-hoc, installable iPhone réel) | ✅ OUI ($99/an + provisioning profile) | ❌ N/A | ❌ Différé V1.1 |
| TestFlight (beta testers iOS, jusqu'à 10k externes) | ✅ OUI ($99/an + ASC API key) | ❌ N/A | ❌ Différé V1.1 |
| App Store distribution publique | ✅ OUI ($99/an + ASC API key + review Apple) | ❌ N/A | ❌ Différé V1.1 |

**Pourquoi GCP ne peut rien faire** : Apple impose que tout binaire installable sur un device réel soit signé avec une **provisioning profile** délivrée par le **Apple Developer Portal** lié à un compte payant. C'est une DRM matérielle (fairplay) du noyau iOS. Aucun cloud, aucune signature alternative, aucune VM Mac n'y change rien.

### 11.2 Ce qu'on intègre en V1 (limité mais propre)

**Build iOS Simulator via EAS Cloud** — utile pour :
- Tester le rendu iOS visuellement sur Mac (capture screenshots iOS pour V1.1 listing)
- Détecter les régressions plateforme (`Platform.OS === 'ios'` branches du code)
- Préparer en avance les artifacts de Phase A audit visuel iOS

**Workflow EAS existant** (`packages/mobile/eas.json` profile `preview`) :
```json
"preview": {
  "ios": { "simulator": true }   // ← déjà wired
}
```

→ Trigger : `eas build --profile preview --platform ios` produit un `.app` simulator (gratuit, pas de signing).

**Ajout V1 — bouton iOS Simulator dans CI** :
- Workflow existant `mobile-eas-build.yml` accepte déjà `platform=all` (Android + iOS)
- iOS path = simulator build only tant que `MOBILE_BUILD_PLATFORM` repo variable n'est PAS flippée à `all` avec credentials Apple
- Sur tag `v*.*.*`, on continue Android-only en prod
- Sur dispatch manuel, on peut déclencher `platform=ios` profile=`preview` → build Simulator

### 11.3 Checklist intégration iOS V1 (additions au master)

- [ ] **Phase A.X** Vérifier `eas.json` preview iOS simulator profile non régressé (déjà case)
- [ ] **Phase F.X** Run optionnel `eas build --profile preview --platform ios` après build Android prod, archiver le `.app` Simulator dans EAS dashboard pour visual diff
- [ ] **Phase G.X** Documenter dans `V1_LAUNCH_REPORT.md` que iOS distribution = V1.1 contingent Apple Dev Program

### 11.4 Pré-requis V1.1 (quand l'Apple Dev Account sera souscrit)

Pour mémoire — à exécuter en V1.1, hors scope V1 :
1. Souscrire **Apple Developer Program** ($99/an) sur `kouemou.sah@gmail.com` (ou compte org dédié)
2. Générer **App Store Connect API key** (.p8) avec rôle Admin
3. `eas credentials --platform ios` → upload .p8 + bundle ID `com.taxasge.app`
4. Apple va générer auto les provisioning profiles + certificats
5. `eas.json` ajouter profile `production` iOS (pas simulator) + EAS submit credentials
6. Workflow Apple Review (1-7 jours) avant TestFlight
7. Promotion TestFlight → App Store Production

### 11.5 Conclusion challenge

**Tu as bien raison de questionner**, et la réponse honnête est : **non, GCP/Firebase ne permettent pas de contourner Apple**. Mais on peut quand même :
- Intégrer le build Simulator dans le pipeline V1 (gratuit, utile pour debug + screenshots)
- Documenter clairement ce qui sera ajouté en V1.1 dès l'Apple Dev Account souscrit

Je recommande de souscrire l'Apple Dev Account dès le launch Android V1 (J+0) car le delay de validation Apple identity verification + tax/banking forms peut prendre 2-4 semaines. Ça permet d'enchaîner V1.1 iOS sans gap calendaire.
