# Phase 10/C — Réponses pré-remplies Play Console (à reporter manuellement)

**Date** : 2026-05-02
**Pour** : `kouemou.sah@gmail.com` (compte Play Console actif)
**App** : Facil — `com.taxasge.app`
**Référence audit** : `MOBILE_PHASE_10_C_PLAY_COMPLIANCE_DETAILED.md`

> Ce document contient toutes les réponses prêtes à copier-coller dans Play Console. À utiliser quand l'AAB sera uploadée (Phase F).

---

## 1. App Information

| Champ | Valeur |
|-------|--------|
| **Application name** | Facil |
| **Default language** | Spanish (Spain) — es-ES |
| **App or game** | App |
| **Free or paid** | Free |
| **Category** | Finance |
| **Tags** | Tax, Government services, Equatorial Guinea, Fiscal |
| **Email** | `kouemou.sah@gmail.com` (developer contact) |
| **Phone** (optional) | _laisser vide ou numéro support_ |
| **Website** | `https://taxasge-frontend-staging-392159428433.us-central1.run.app/` (idéalement custom domain `taxasge.gob.gq`) |

---

## 2. Store Listing — Short description (≤80 chars × 3 langues)

**ES (default)** : `Facil — Servicios fiscales digitales de Guinea Ecuatorial` (58 chars)

**FR** : `Facil — Services fiscaux numériques de la Guinée Équatoriale` (60 chars)

**EN** : `Facil — Digital fiscal services for Equatorial Guinea` (54 chars)

---

## 3. Store Listing — Full description (≤4000 chars × 3 langues)

### ES
```
Facil es la plataforma oficial de la Dirección General de Impuestos de Guinea Ecuatorial para la gestión digital de servicios fiscales y administrativos.

QUÉ PUEDE HACER CON FACIL
• Solicitar y pagar trámites administrativos: pasaportes, permisos de conducir, permisos de residencia, certificados, licencias comerciales
• Gestionar las obligaciones fiscales de su empresa (IVA, IRPF, Impuesto de Sociedades, contribuciones)
• Pagar de forma segura mediante BANGE Mobile Money u otros métodos disponibles
• Almacenar sus documentos oficiales en un coffre-fort digital seguro
• Programar citas en las oficinas de los ministerios competentes
• Consultar el estado de sus trámites en tiempo real
• Recibir notificaciones sobre vencimientos y nuevos requisitos
• Acceder a un asistente IA multilingüe (español, francés, inglés)

PARA QUIÉN
• Ciudadanos: solicitudes individuales (DIP, pasaporte, permisos)
• Empresarios y autónomos: gestión de licencias comerciales, contribuciones
• Contables: cumplimiento fiscal de sus clientes
• Diáspora: trámites desde el extranjero

PRIVACIDAD Y SEGURIDAD
• Cifrado TLS para todas las comunicaciones
• Autenticación de dos factores (2FA) opcional
• Cumplimiento RGPD: derecho de acceso, rectificación, eliminación
• Datos almacenados en infraestructura segura (Google Cloud)

SOPORTE
Soporte técnico disponible directamente desde la aplicación. Email: soporte@taxasge.gob.gq

Facil es desarrollado y operado por la Dirección General de Impuestos de Guinea Ecuatorial.
```

### FR
```
Facil est la plateforme officielle de la Direction Générale des Impôts de la Guinée Équatoriale pour la gestion numérique des services fiscaux et administratifs.

QUE POUVEZ-VOUS FAIRE AVEC FACIL
• Demander et payer des démarches administratives : passeports, permis de conduire, titres de séjour, certificats, licences commerciales
• Gérer les obligations fiscales de votre entreprise (TVA, IRPF, IS, contributions)
• Payer en toute sécurité via BANGE Mobile Money ou d'autres méthodes disponibles
• Stocker vos documents officiels dans un coffre-fort numérique sécurisé
• Prendre rendez-vous dans les bureaux des ministères compétents
• Consulter l'état de vos démarches en temps réel
• Recevoir des notifications sur les échéances et nouvelles exigences
• Accéder à un assistant IA multilingue (espagnol, français, anglais)

POUR QUI
• Citoyens : demandes individuelles (DIP, passeport, permis)
• Entrepreneurs et indépendants : gestion des licences commerciales, contributions
• Comptables : conformité fiscale de leurs clients
• Diaspora : démarches depuis l'étranger

CONFIDENTIALITÉ ET SÉCURITÉ
• Chiffrement TLS pour toutes les communications
• Authentification à deux facteurs (2FA) optionnelle
• Conformité RGPD : droit d'accès, de rectification, de suppression
• Données hébergées sur infrastructure sécurisée (Google Cloud)

ASSISTANCE
Support technique disponible directement depuis l'application. Email : soporte@taxasge.gob.gq

Facil est développé et opéré par la Direction Générale des Impôts de la Guinée Équatoriale.
```

### EN
```
Facil is the official platform of the General Directorate of Taxes of Equatorial Guinea for digital management of fiscal and administrative services.

WHAT YOU CAN DO WITH FACIL
• Request and pay for administrative procedures: passports, driver's licenses, residence permits, certificates, commercial licenses
• Manage your company's fiscal obligations (VAT, income tax, corporate tax, contributions)
• Pay securely via BANGE Mobile Money or other available methods
• Store your official documents in a secure digital vault
• Schedule appointments at competent ministry offices
• Track the status of your procedures in real time
• Receive notifications about deadlines and new requirements
• Access a multilingual AI assistant (Spanish, French, English)

FOR WHOM
• Citizens: individual requests (DIP, passport, permits)
• Business owners and self-employed: commercial license and contribution management
• Accountants: client tax compliance
• Diaspora: procedures from abroad

PRIVACY AND SECURITY
• TLS encryption for all communications
• Optional two-factor authentication (2FA)
• GDPR compliance: right to access, rectification, deletion
• Data stored on secure infrastructure (Google Cloud)

SUPPORT
Technical support available directly from the app. Email: soporte@taxasge.gob.gq

Facil is developed and operated by the General Directorate of Taxes of Equatorial Guinea.
```

---

## 4. Privacy Policy URL

```
https://taxasge-frontend-staging-392159428433.us-central1.run.app/es/legal/privacy
```

(Custom domain `taxasge.gob.gq` recommandé avant submission finale.)

---

## 5. Data Safety Form — Réponses

### 5.1 Encryption in transit
- **Q**: Is all of the user data collected by your app encrypted in transit?
- **R**: ✅ **YES**

### 5.2 User data deletion
- **Q**: Do you provide a way for users to request that their data be deleted?
- **R**: ✅ **YES, in-app**
- **Description** : "Users can request account and data deletion from Profile → Danger zone → Delete my account. Backend deletion endpoint: DELETE /api/v1/users/profile (RGPD article 17 compliant)."

### 5.3 Data types — DECLARATIONS

À cocher pour chaque catégorie :

#### Personal info
- ✅ **Name** — Collected, NOT shared, Required, Purpose: Account management
- ✅ **Email address** — Collected, NOT shared, Required, Purposes: Account management, Communications
- ✅ **User IDs** — Collected, **Shared** (Sentry, LogRocket — anonymized), Required, Purposes: Account management, Analytics
- ✅ **Phone number** — Collected, **Shared** (BANGE for payments), Optional, Purposes: Account management, App functionality (payments)
- ✅ **Address** — Collected, NOT shared, Optional, Purpose: Account management
- ✅ **Other personal info** (NIF/DIP — National ID for tax administration) — Collected, **Shared** (Vertex AI for OCR processing), Optional, Purpose: App functionality (document extraction)

#### Financial info
- ✅ **User payment info** — Collected, **Shared** (BANGE), Required, Purposes: App functionality (payments), Fraud prevention
- ✅ **Purchase history** — Collected, NOT shared, Optional, Purpose: App functionality

#### Messages
- ✅ **Other in-app messages** (chatbot conversations) — Collected, **Shared** (Vertex AI for response generation), Optional, Purpose: App functionality (AI assistant)

#### Photos and videos
- ✅ **Photos** (document scans) — Collected, **Shared** (Google Cloud Vision / Vertex AI for OCR), Required, Purpose: App functionality

#### Files and docs
- ✅ **Files and docs** (uploaded PDFs, generated receipts) — Collected, **Shared** (Vertex AI for processing), Required, Purpose: App functionality

#### Calendar
- ❌ **Calendar events** — NOT COLLECTED (in-app appointments only, NOT Android Calendar API)

#### App activity
- ✅ **App interactions** — Collected, **Shared** (LogRocket — text sanitized, IP not captured), Optional, Purpose: Analytics
- ✅ **Other user-generated content** (workflow data) — Collected, NOT shared, Required, Purpose: App functionality

#### App info and performance
- ✅ **Crash logs** — Collected, **Shared** (Sentry — PII stripped), Optional, Purpose: Analytics
- ✅ **Diagnostics** — Collected, **Shared** (Sentry, LogRocket), Optional, Purpose: Analytics

#### Device or other IDs
- ✅ **Device or other IDs** (FCM push token) — Collected, **Shared** (Firebase Cloud Messaging), Required, Purpose: App functionality (push notifications)

### 5.4 Sensitive data
- ✅ **YES** — collects financial info (payments) and government IDs (NIF/DIP via OCR)

---

## 6. Content Rating — IARC Questionnaire

| Question | Réponse |
|----------|---------|
| Violence | NO |
| Sexuality | NO |
| Profanity / language | NO |
| Drugs / alcohol / tobacco | NO |
| User-generated content | YES — moderated (support tickets) |
| In-app purchases | NO (free + government services only) |
| Location | NO (city is text input, not GPS) |
| Data sharing with third parties | YES (Sentry, LogRocket, Vertex AI, FCM, BANGE — all declared in Privacy Policy) |
| Gambling / contests | NO |
| Horror | NO |
| Discrimination | NO |
| Crude humor | NO |

**Rating attendu** : **Everyone (3+)** / **PEGI 3** / **ESRB Everyone**

---

## 7. Target Audience and Content

### 7.1 Target age group
- **Recommandation V1** : **18+** (justification : services fiscaux nécessitent NIF officiel, signature légale, gestion d'entreprise — typically adultes)

### 7.2 Children's policy
- **Q**: Is your app primarily intended for children?
- **R**: NO

### 7.3 Family policy
- **Q**: Does your app appeal to children?
- **R**: NO

---

## 8. Government App Declaration

> **À CONFIRMER user** : domain `.gob.gq` enregistré ? Lettre d'autorisation officielle Direction Générale des Impôts disponible ?

### Si OUI (preuve disponible)
- **Q**: Does this app belong to a government entity?
- **R**: ✅ **YES**
- **Type**: National government
- **Country**: Equatorial Guinea
- **Authority**: Dirección General de Impuestos (DGI)
- **Proof**: Upload de la lettre d'autorisation OU domain `.gob.gq` confirmé

### Si NON (en attente)
- Soumettre comme app standard
- Description précise dans store listing : "Plateforme officielle de la Direction Générale des Impôts de la Guinée Équatoriale"
- Risque : Google peut demander preuve gov en review post-submission

---

## 9. App Access (credentials reviewer Google)

> Phase C.5 action : créer ce user en BD avant submission

```
Test Account (citizen role — for Play Console reviewers)
Email    : test-google-review@taxasge.dev
Password : [généré 12+ chars, sauvegardé dans GCP Secret Manager
            secret name = "play-review-test-password"]
Notes    : Standard citizen account, empty workflow history.
           Reviewers can verify: sign-up flow, vault, payments,
           support, chatbot. Cannot access admin or agent features.
```

**Q**: Is all functionality available without restrictions?
- **R**: NO — login required for all features beyond home screen and public service catalog
- **Provide credentials**: ✅ Yes (above)

---

## 10. Permissions justification

| Permission Android | Justification |
|--------------------|---------------|
| `INTERNET` | Required to communicate with the Facil backend (HTTPS REST API) for all app functions |
| `CAMERA` | Required to scan tax documents (DIP, passport, certificates) for OCR-based field extraction |
| `READ_EXTERNAL_STORAGE` | Required to upload existing PDFs/images from device storage to the user's secure vault |
| `VIBRATE` | Used to provide tactile feedback on form validation errors and notifications |
| `USE_BIOMETRIC` / `USE_FINGERPRINT` | Optional — quick re-authentication via fingerprint/Face ID after first login. Falls back to password if not available |
| `POST_NOTIFICATIONS` | Required to receive push notifications about service request status, payment confirmations, document expiry alerts |

---

## 11. Country availability

### Recommandation V1
- ✅ **Equatorial Guinea** (primary)
- (Optionnel diaspora) : Espagne, France, Cameroun

### Restricted countries
- Aucun

### Pricing
- **Free** worldwide
- **No in-app purchases**
- **No ads**

---

## 12. Ads declaration
- **Q**: Does your app contain ads?
- **R**: ❌ **NO**

---

## 13. News app declaration
- **Q**: Is this a news app?
- **R**: ❌ **NO**

---

## 14. COVID-19 app declaration
- **Q**: Is this a COVID-19 app?
- **R**: ❌ **NO**

---

## 15. Account deletion (RGPD compliance — required since 2024)

- **Web URL for account deletion** : `https://taxasge-frontend-staging-392159428433.us-central1.run.app/{lang}/profile/account/delete`
- **In-app path** : Profile → Danger zone → Delete my account
- **What gets deleted** : user account, profile data, terms/privacy acceptance records, FCM device token, sessions, refresh tokens. Documents retained per fiscal law (5 years minimum) but anonymized (chatbot conversations user_id → NULL via FK SET NULL).
- **What is retained** : fiscal records mandated by Equatorial Guinea law (5+ years), anonymized analytics (Sentry/LogRocket auto-purge 30-90 days), audit logs (per audit_logs table)

---

## 16. Checklist soumission Play Console (à cocher avant publish)

- [ ] App created in Play Console with package `com.taxasge.app`
- [ ] AAB v1.0.0 uploaded to Internal Testing track
- [ ] Store listing complete (title + 3 languages descriptions)
- [ ] Privacy Policy URL filled (Cloud Run URL or custom domain)
- [ ] Data Safety Form complete + published
- [ ] Content Rating obtained (IARC questionnaire submitted)
- [ ] Target Audience declared (18+ recommandé)
- [ ] App Access credentials provided (test user created en BD + password en Secret)
- [ ] Permissions justifications provided
- [ ] App Category = Finance
- [ ] Country availability = Equatorial Guinea (+ optionals)
- [ ] Ads = No
- [ ] News app = No
- [ ] COVID app = No
- [ ] Government App Declaration (si preuve dispo)
- [ ] Account deletion path provided

---

## 17. Suivi

- **2026-05-02 v1.0** : Documents pré-remplis pour Play Console submission. À utiliser en Phase F lors de l'upload AAB.
