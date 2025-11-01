# 🏗️ PHASE 2 : CORE BACKEND

**Durée estimée** : 6 semaines  
**Objectif** : Backend fonctionnel avec 7 modules critiques

---

## VUE D'ENSEMBLE

**Semaines** :
- Semaines 1-2 : AUTH + USERS (Fondations)
- Semaines 3-4 : DECLARATIONS + DOCUMENTS (Cœur métier)
- Semaines 5-6 : PAYMENTS + WEBHOOKS + NOTIFICATIONS (Intégrations)

**Modules à implémenter** :
1. **AUTH** (3 tâches) - Login, Register, JWT
2. **USERS** (3 tâches) - Profil, CRUD, RBAC
3. **DECLARATIONS** (6 tâches) - Création, Validation, Workflow
4. **DOCUMENTS** (3 tâches) - Upload, OCR, Validation
5. **PAYMENTS** (4 tâches) - Création, Tracking, BANGE
6. **WEBHOOKS** (3 tâches) - BANGE, Signature, Retry
7. **NOTIFICATIONS** (3 tâches) - Multi-canal, Templates, Queue

**Total** : 25 tâches

---

## CRITÈRES ACCEPTATION MVP

**Qualité** :
- ✅ Coverage tests >85% pour tous modules
- ✅ 0 bugs critiques
- ✅ Architecture 3-tiers respectée
- ✅ Error handling RFC 7807

**Fonctionnel** :
- ✅ Parcours citizen complet (Register → Declare → Pay)
- ✅ Parcours agent complet (Queue → Review → Validate)
- ✅ Webhooks BANGE fonctionnels
- ✅ Notifications multi-canal

**Performance** :
- ✅ Endpoints P95 <500ms
- ✅ Webhooks P95 <2s

---

## SEMAINES 1-2 : AUTH + USERS

### TASK-P2-001 : Module AUTH - Register + Login

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 3 jours  

#### Contexte
Implémenter authentification complète avec JWT (Access Token + Refresh Token).

#### Use Cases
- UC-AUTH-001 : POST /auth/register - Créer compte
- UC-AUTH-002 : POST /auth/login - Se connecter
- UC-AUTH-003 : POST /auth/refresh - Rafraîchir token
- UC-AUTH-004 : POST /auth/logout - Se déconnecter

#### Architecture
**3-Tiers** :
- Models : `User`, `RefreshToken`
- Repository : `AuthRepository` (create_user, verify_credentials)
- Service : `AuthService` (register, login, refresh_token, logout)
- Routes : `app/api/v1/auth.py` (4 endpoints)

#### Critères Validation
- [ ] 4 endpoints fonctionnels
- [ ] JWT Access Token (30min expiry)
- [ ] JWT Refresh Token (7 days expiry)
- [ ] Password hashing (bcrypt)
- [ ] Email validation
- [ ] Tests coverage >85%
- [ ] Error handling RFC 7807

#### Livrables
- `app/models/user.py`
- `app/models/refresh_token.py`
- `app/database/repositories/auth_repository.py`
- `app/services/auth_service.py`
- `app/api/v1/auth.py`
- `app/core/jwt.py`
- `app/core/security.py`
- `tests/use_cases/test_uc_auth.py`

---

### TASK-P2-002 : Module AUTH - Email Verification

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Vérification email avec token unique (sécurité).

#### Use Cases
- UC-AUTH-005 : POST /auth/send-verification - Envoyer email
- UC-AUTH-006 : GET /auth/verify-email?token=xxx - Vérifier email

#### Architecture
- Service : `EmailVerificationService`
- Routes : 2 nouveaux endpoints auth

#### Critères Validation
- [ ] Email avec token unique (24h validity)
- [ ] Link verification fonctionnel
- [ ] User.is_verified updated
- [ ] Token invalidé après usage
- [ ] Tests coverage >85%

#### Livrables
- `app/services/email_verification_service.py`
- Endpoints dans `app/api/v1/auth.py`
- `tests/use_cases/test_uc_auth_verification.py`

---

### TASK-P2-003 : Module AUTH - Password Reset

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Reset password avec email + token sécurisé.

#### Use Cases
- UC-AUTH-007 : POST /auth/forgot-password - Demander reset
- UC-AUTH-008 : POST /auth/reset-password - Changer password

#### Architecture
- Service : `PasswordResetService`
- Routes : 2 nouveaux endpoints auth

#### Critères Validation
- [ ] Email avec reset link (1h validity)
- [ ] Token unique et sécurisé
- [ ] Password updated
- [ ] Token invalidé après usage
- [ ] Tests coverage >85%

#### Livrables
- `app/services/password_reset_service.py`
- Endpoints dans `app/api/v1/auth.py`
- `tests/use_cases/test_uc_auth_reset.py`

---

### TASK-P2-004 : Module USERS - Profil Utilisateur

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 2 jours  

#### Contexte
CRUD profil utilisateur avec upload photo.

#### Use Cases
- UC-USER-001 : GET /users/me - Voir profil
- UC-USER-002 : PUT /users/me - Modifier profil
- UC-USER-003 : POST /users/me/photo - Upload photo
- UC-USER-004 : DELETE /users/me - Soft delete compte

#### Architecture
- Repository : `UserRepository` (get, update, soft_delete)
- Service : `UserService` (profile CRUD, photo upload Firebase)
- Routes : `app/api/v1/users.py` (4 endpoints)

#### Critères Validation
- [ ] 4 endpoints fonctionnels
- [ ] Photo upload Firebase Storage
- [ ] Soft delete (is_active=false)
- [ ] Password non exposé dans responses
- [ ] Validation champs (email, phone)
- [ ] Tests coverage >85%

#### Livrables
- `app/database/repositories/user_repository.py`
- `app/services/user_service.py`
- `app/api/v1/users.py`
- `tests/use_cases/test_uc_users.py`

---

### TASK-P2-005 : Module USERS - RBAC (Rôles & Permissions)

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Role-Based Access Control avec 4 rôles (citizen, business, agent, admin).

#### Architecture
- Middleware : `app/core/auth.py` (require_role, require_permission)
- Decorators : `@require_role("admin")`, `@require_permission("declarations.validate")`

#### Rôles & Permissions
**Citizen** :
- declarations.create
- declarations.read_own
- payments.create

**Business** :
- Même que citizen
- declarations.bulk_create

**Agent** :
- declarations.read_all
- declarations.validate
- declarations.reject

**Admin** :
- ALL permissions
- users.manage
- agents.manage

#### Critères Validation
- [ ] 4 rôles implémentés
- [ ] Permissions granulaires
- [ ] Middleware RBAC fonctionnel
- [ ] Tests 401/403 pour chaque rôle
- [ ] Tests coverage >90%

#### Livrables
- `app/core/auth.py` (RBAC middleware)
- `app/core/permissions.py` (définitions permissions)
- `tests/security/test_rbac.py`

---

### TASK-P2-006 : Module USERS - Dashboard Utilisateur

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Dashboard personnalisé par rôle.

#### Use Cases
- UC-USER-005 : GET /users/me/dashboard - Dashboard

#### Dashboard Citizen
- Mes déclarations (statut, deadlines)
- Paiements récents
- Notifications récentes
- Profil

#### Dashboard Business
- Statistiques entreprise
- Déclarations par service fiscal
- Revenue trends

#### Dashboard Agent
- Ma queue
- Mes statistiques
- Déclarations traitées aujourd'hui

#### Critères Validation
- [ ] 1 endpoint adaptatif par rôle
- [ ] Métriques pertinentes par rôle
- [ ] Cache Redis (5min TTL)
- [ ] Tests coverage >85%

#### Livrables
- Service `DashboardService` dans `app/services/user_service.py`
- Endpoint dans `app/api/v1/users.py`
- `tests/use_cases/test_uc_user_dashboard.py`

---

## SEMAINES 3-4 : DECLARATIONS + DOCUMENTS

### TASK-P2-007 : Module DECLARATIONS - Création Draft

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Créer déclaration en mode draft (éditable).

#### Use Cases
- UC-DECL-001 : POST /declarations/create - Créer draft
- UC-DECL-002 : GET /declarations/{id} - Voir déclaration
- UC-DECL-003 : PUT /declarations/{id} - Modifier draft
- UC-DECL-004 : DELETE /declarations/{id} - Supprimer draft

#### Workflow Statuts
```
draft → submitted → processing → validated → paid
              ↓
           rejected
```

#### Architecture
- Models : `Declaration`, `DeclarationData`
- Repository : `DeclarationRepository`
- Service : `DeclarationService`
- Routes : `app/api/v1/declarations.py`

#### Critères Validation
- [ ] 4 endpoints CRUD fonctionnels
- [ ] Status workflow implémenté
- [ ] RBAC : Citizen peut seulement voir/modifier ses déclarations
- [ ] Validation données par service fiscal
- [ ] Tests coverage >85%

#### Livrables
- `app/models/declaration.py`
- `app/database/repositories/declaration_repository.py`
- `app/services/declaration_service.py`
- `app/api/v1/declarations.py`
- `tests/use_cases/test_uc_declarations.py`

---

### TASK-P2-008 : Module DECLARATIONS - Liste & Filtres

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 2 jours  

#### Contexte
Lister déclarations avec filtres + pagination.

#### Use Cases
- UC-DECL-005 : GET /declarations/list - Liste avec filtres

#### Filtres
- status (draft, submitted, processing, validated, paid, rejected)
- service_id (UUID service fiscal)
- date_from, date_to (created_at range)
- search (text search dans reference)

#### Pagination
- limit (default 20, max 100)
- offset (default 0)

#### Critères Validation
- [ ] Filtres fonctionnels
- [ ] Pagination performante
- [ ] Tri par date (desc)
- [ ] RBAC : Citizen voit seulement ses déclarations
- [ ] RBAC : Agent voit toutes déclarations concernants uniquement son ministère
- [ ] Tests coverage >85%

#### Livrables
- Endpoint GET /declarations/list dans `app/api/v1/declarations.py`
- Méthode `list_with_filters` dans `DeclarationRepository`
- `tests/use_cases/test_uc_declarations_list.py`

---

### TASK-P2-009 : Module DECLARATIONS - Submit (Draft → Submitted)

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Soumettre déclaration avec validation complète.

#### Use Cases
- UC-DECL-006 : POST /declarations/{id}/submit - Soumettre

#### Validations Pre-Submit
1. Tous champs requis remplis
2. Tous documents requis uploadés
3. Montant calculé correct
4. User verified (is_verified=true)

#### Post-Submit Actions
1. Status draft → submitted
2. Générer reference unique (DECL-2025-XXXXXX)
3. Créer payment pending
4. Notifier user (email + SMS)
5. Ajouter à queue agents

#### Critères Validation
- [ ] Validations pre-submit strictes
- [ ] Transition status atomique
- [ ] Reference unique générée
- [ ] Payment créé automatiquement
- [ ] Notification envoyée
- [ ] Tests coverage >90%

#### Livrables
- Endpoint POST /declarations/{id}/submit
- Méthode `submit_declaration` dans `DeclarationService`
- Validations dans `DeclarationValidator`
- `tests/use_cases/test_uc_declarations_submit.py`

---

### TASK-P2-010 : Module DECLARATIONS - Calcul Automatique Montant

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 2 jours  

#### Contexte
Calculer montant taxe selon règles service fiscal.

#### Use Cases
- UC-DECL-007 : POST /declarations/{id}/calculate - Calculer montant

#### Règles Calcul (Exemples)
**Impôt sur revenus** :
- 0-2M XAF : 0%
- 2M-5M XAF : 10%
- 5M-10M XAF : 15%
- >10M XAF : 20%

**Taxe foncière** :
- Taux fixe : 5% valeur immobilière

**TVA** :
- Taux : 19.25%

#### Architecture
- Service : `TaxCalculatorService`
- Stratégies : Pattern Strategy par service fiscal

#### Critères Validation
- [ ] Calcul exact selon règles
- [ ] Gestion cas limites (0, négatif)
- [ ] Arrondis corrects
- [ ] Tests unitaires exhaustifs (>95% coverage)
- [ ] Documentation formules

#### Livrables
- `app/services/tax_calculator_service.py`
- `app/services/calculators/income_tax_calculator.py`
- `app/services/calculators/property_tax_calculator.py`
- `tests/services/test_tax_calculator.py`

---

### TASK-P2-011 : Module DECLARATIONS - Status History

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Historique complet des changements de statut (audit trail).

#### Use Cases
- UC-DECL-008 : GET /declarations/{id}/history - Voir historique

#### Événements Trackés
- Status changes (draft → submitted, etc.)
- Agent assignments
- Validations/Rejections (avec raisons)
- Documents uploads
- Payments

#### Architecture
- Model : `DeclarationEvent`
- Repository : `DeclarationEventRepository`

#### Critères Validation
- [ ] Tous événements loggés
- [ ] Timestamps précis
- [ ] User/Agent ID capturé
- [ ] Metadata JSON (raisons, commentaires)
- [ ] Tests coverage >85%

#### Livrables
- `app/models/declaration_event.py`
- `app/database/repositories/declaration_event_repository.py`
- Endpoint GET /declarations/{id}/history
- `tests/use_cases/test_uc_declarations_history.py`

---

### TASK-P2-012 : Module DECLARATIONS - Statistiques Utilisateur

**Agent** : Dev  
**Priorité** : BASSE  
**Effort** : 1 jour  

#### Contexte
Statistiques déclarations pour citizen/business.

#### Use Cases
- UC-DECL-009 : GET /declarations/stats - Stats utilisateur

#### Statistiques
- Total déclarations (par statut)
- Montant total payé (année courante)
- Temps moyen traitement
- Taux validation/rejection
- Services fiscaux utilisés

#### Critères Validation
- [ ] Métriques pertinentes
- [ ] Cache Redis (1h TTL)
- [ ] Performance queries (<200ms)
- [ ] Tests coverage >80%

#### Livrables
- Endpoint GET /declarations/stats
- Méthode `get_user_stats` dans `DeclarationService`
- `tests/use_cases/test_uc_declarations_stats.py`

---

### TASK-P2-013 : Module DOCUMENTS - Upload & Storage

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Upload documents vers Firebase Storage avec validation.

#### Use Cases
- UC-DOC-001 : POST /declarations/{id}/documents - Upload document
- UC-DOC-002 : GET /declarations/{id}/documents - Liste documents
- UC-DOC-003 : DELETE /declarations/{id}/documents/{doc_id} - Supprimer

#### Types Documents
- national_id (CNI)
- proof_of_address (Justificatif domicile)
- business_registration (RC pour business)
- tax_certificate (Certificats fiscaux)
- other (Autres)

#### Validations
- Format : PDF, JPG, PNG
- Taille max : 10MB
- Virus scan (ClamAV)

#### Architecture
- Service : `DocumentStorageService` (Firebase)
- Model : `Document`
- Repository : `DocumentRepository`

#### Critères Validation
- [ ] Upload Firebase fonctionnel
- [ ] Validations format/taille
- [ ] Metadata stockée DB
- [ ] URLs signées (expiry 1h)
- [ ] Tests coverage >85%

#### Livrables
- `app/services/document_storage_service.py`
- `app/models/document.py`
- `app/database/repositories/document_repository.py`
- Endpoints dans `app/api/v1/documents.py`
- `tests/use_cases/test_uc_documents.py`

---

### TASK-P2-014 : Module DOCUMENTS - OCR Extraction

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 2 jours  

#### Contexte
Extraire texte documents avec OCR (Google Vision API ou Tesseract).

#### Use Cases
- UC-DOC-004 : POST /documents/{id}/extract - Extraire texte

#### Champs Extraits (CNI)
- Nom complet
- Date naissance
- Numéro CNI
- Date expiration

#### Architecture
- Service : `OCRService`
- Provider : Google Vision API (primaire), Tesseract (fallback)

#### Critères Validation
- [ ] Extraction texte fonctionnelle
- [ ] Quality score (confidence >80%)
- [ ] Fallback Tesseract si Google échoue
- [ ] Champs structurés extraits
- [ ] Tests avec samples documents
- [ ] Coverage >80%

#### Livrables
- `app/services/ocr_service.py`
- `app/services/ocr_providers/google_vision.py`
- `app/services/ocr_providers/tesseract.py`
- Endpoint POST /documents/{id}/extract
- `tests/services/test_ocr_service.py`

---

### TASK-P2-015 : Module DOCUMENTS - Validation Automatique

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Valider automatiquement documents selon règles.

#### Use Cases
- UC-DOC-005 : POST /documents/{id}/validate - Valider document

#### Règles Validation (CNI)
- Format conforme (dimensions, layout)
- Texte lisible (OCR confidence >80%)
- Date expiration future
- Numéro CNI valide (pattern)

#### Statuts Validation
- pending (uploadé, pas encore validé)
- valid (validé auto ou agent)
- invalid (rejeté avec raisons)
- manual_review (nécessite review agent)

#### Critères Validation
- [ ] Règles validation implémentées
- [ ] Status updated automatiquement
- [ ] Raisons rejection stockées
- [ ] Tests coverage >85%

#### Livrables
- `app/services/document_validator_service.py`
- Méthode `validate_document` dans `DocumentService`
- Endpoint POST /documents/{id}/validate
- `tests/services/test_document_validator.py`

---

## SEMAINES 5-6 : PAYMENTS + WEBHOOKS + NOTIFICATIONS

### TASK-P2-016 : Module PAYMENTS - Création Payment

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Créer payment avec intégration BANGE.

#### Use Cases
- UC-PAY-001 : POST /payments/create - Créer payment
- UC-PAY-002 : GET /payments/{id} - Voir payment
- UC-PAY-003 : GET /payments?declaration_id=xxx - Liste payments

#### Workflow Payment
```
pending → processing → completed
              ↓
           failed → retry → completed
```

#### Intégration BANGE
**API Call** : POST https://api.bange.gq/payments/create
**Payload** :
```
{
  "merchant_id": "MERCHANT_ID",
  "amount": 250000,
  "currency": "XAF",
  "reference": "DECL-2025-001234",
  "callback_url": "https://api.taxasge.com/webhooks/bange",
  "return_url": "https://taxasge.emacsah.com/payments/success"
}
```

**Response** :
```
{
  "transaction_id": "BANGE-TXN-123456",
  "payment_url": "https://pay.bange.gq/checkout/123456",
  "status": "pending"
}
```

#### Architecture
- Model : `Payment`
- Repository : `PaymentRepository`
- Service : `PaymentService` + `BangeAPIClient`
- Routes : `app/api/v1/payments.py`

#### Critères Validation
- [ ] Intégration BANGE fonctionnelle
- [ ] Payment créé automatiquement après validation
- [ ] Status workflow complet
- [ ] Idempotence (payment_reference unique)
- [ ] Tests avec BANGE sandbox
- [ ] Coverage >85%

#### Livrables
- `app/models/payment.py`
- `app/database/repositories/payment_repository.py`
- `app/services/payment_service.py`
- `app/services/bange_api_client.py`
- `app/api/v1/payments.py`
- `tests/use_cases/test_uc_payments.py`

---

### TASK-P2-017 : Module PAYMENTS - Tracking & Status

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Suivre statut payment en temps réel.

#### Use Cases
- UC-PAY-004 : GET /payments/{id}/status - Vérifier statut
- UC-PAY-005 : POST /payments/{id}/check - Forcer check BANGE

#### Polling BANGE
**Fréquence** : Toutes les 30s pendant 5min après création, puis toutes les 5min

**API Call** : GET https://api.bange.gq/payments/{transaction_id}/status

#### Critères Validation
- [ ] Polling automatique implémenté (Celery task)
- [ ] Status updated en temps réel
- [ ] Endpoint check manuel pour user
- [ ] Tests coverage >85%

#### Livrables
- Celery task `check_payment_status` dans `app/tasks/payment_tasks.py`
- Endpoint GET /payments/{id}/status
- Endpoint POST /payments/{id}/check
- `tests/tasks/test_payment_tasks.py`

---

### TASK-P2-018 : Module PAYMENTS - Retry Logic

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Retry automatique si payment échoue (max 3 tentatives).

#### Use Cases
- UC-PAY-006 : POST /payments/{id}/retry - Retry manuel

#### Retry Strategy
**Exponential Backoff** :
- Tentative 1 : Immédiat
- Tentative 2 : 5 minutes après échec
- Tentative 3 : 30 minutes après échec
- Si 3 échecs : Status = failed (nécessite intervention)

#### Critères Validation
- [ ] Retry automatique (Celery)
- [ ] Exponential backoff implémenté
- [ ] Max 3 tentatives
- [ ] Endpoint retry manuel pour admin
- [ ] Tests coverage >85%

#### Livrables
- Celery task `retry_failed_payment` dans `app/tasks/payment_tasks.py`
- Endpoint POST /payments/{id}/retry
- `tests/tasks/test_payment_retry.py`

---

### TASK-P2-019 : Module PAYMENTS - Receipts

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Générer reçus PDF après payment completed.

#### Use Cases
- UC-PAY-007 : GET /payments/{id}/receipt - Télécharger PDF

#### Contenu Reçu
- Logo TaxasGE
- Reference paiement
- Date paiement
- Montant (XAF)
- Déclaration reference
- Service fiscal
- QR Code (vérification)

#### Architecture
- Service : `ReceiptGeneratorService` (ReportLab)
- Model : `Receipt`

#### Critères Validation
- [ ] PDF généré automatiquement après completed
- [ ] Template professionnel
- [ ] QR Code intégré
- [ ] Stocké Firebase Storage
- [ ] Tests coverage >80%

#### Livrables
- `app/services/receipt_generator_service.py`
- `app/models/receipt.py`
- Endpoint GET /payments/{id}/receipt
- Template PDF dans `app/templates/receipt_template.html`
- `tests/services/test_receipt_generator.py`

---

### TASK-P2-020 : Module WEBHOOKS - BANGE Webhook Handler

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Recevoir webhooks BANGE pour updates payment status.

#### Use Cases
- UC-WEBHOOK-001 : POST /webhooks/bange - Recevoir webhook

#### Webhook Events
- payment.pending
- payment.processing
- payment.success
- payment.failed

#### Payload Exemple
```
{
  "event": "payment.success",
  "transaction_id": "BANGE-TXN-123456",
  "reference": "DECL-2025-001234",
  "amount": 250000,
  "status": "completed",
  "paid_at": "2025-10-31T14:23:45Z",
  "signature": "hmac_sha256_signature"
}
```

#### Sécurité
**Signature HMAC-SHA256** :
```
signature = HMAC-SHA256(payload_json, BANGE_WEBHOOK_SECRET)
```

#### Architecture
- Routes : `app/api/webhooks/bange.py`
- Service : `WebhookProcessorService`
- Model : `WebhookEvent` (log tous webhooks)

#### Critères Validation
- [ ] Signature HMAC validée (CRITIQUE)
- [ ] Idempotence (transaction_id unique)
- [ ] Payment status updated
- [ ] Notification user envoyée
- [ ] Webhook loggé dans DB
- [ ] Tests coverage >90%

#### Livrables
- `app/api/webhooks/bange.py`
- `app/services/webhook_processor_service.py`
- `app/models/webhook_event.py`
- `tests/webhooks/test_bange_webhook.py`

---

### TASK-P2-021 : Module WEBHOOKS - Retry Mechanism

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Retry webhooks échoués (DB unavailable, timeout, etc).

#### Strategy
**Exponential Backoff** :
- Retry 1 : 1 min après échec
- Retry 2 : 5 min après échec
- Retry 3 : 30 min après échec
- Si 3 échecs : Alerte PagerDuty

#### Architecture
- Celery task : `retry_failed_webhook`
- Status : pending, processing, success, failed

#### Critères Validation
- [ ] Retry automatique (Celery)
- [ ] Max 3 tentatives
- [ ] Alertes si 3 échecs
- [ ] Tests coverage >85%

#### Livrables
- Celery task `retry_failed_webhook` dans `app/tasks/webhook_tasks.py`
- Méthode `retry_webhook` dans `WebhookProcessorService`
- `tests/tasks/test_webhook_retry.py`

---

### TASK-P2-022 : Module WEBHOOKS - Monitoring & Logs

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Monitoring webhooks avec métriques Prometheus.

#### Métriques
- webhooks_received_total (counter)
- webhooks_processing_duration_seconds (histogram)
- webhooks_failed_total (counter)
- webhook_signature_invalid_total (counter)

#### Logs
- Tous webhooks loggés (success + failed)
- IP source
- Signature valid/invalid
- Processing time
- Error messages

#### Critères Validation
- [ ] Métriques Prometheus instrumentées
- [ ] Logs structurés (JSON)
- [ ] Dashboard Grafana créé
- [ ] Tests coverage >80%

#### Livrables
- Métriques dans `app/api/webhooks/bange.py`
- Dashboard Grafana `grafana/webhooks_dashboard.json`
- `tests/webhooks/test_webhook_metrics.py`

---

### TASK-P2-023 : Module NOTIFICATIONS - Multi-Canal

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 2 jours  

#### Contexte
Envoyer notifications via Email, SMS, Push.

#### Use Cases
- UC-NOTIF-001 : POST /notifications/send - Envoyer notification

#### Canaux
**Email (Mailgun)** :
- Transactional emails
- HTML templates

**SMS (Twilio)** :
- Notifications urgentes
- Codes OTP

**Push (Firebase Cloud Messaging)** :
- Notifications mobiles

#### Architecture
- Service : `NotificationService`
- Providers : `EmailProvider`, `SMSProvider`, `PushProvider`
- Model : `Notification`

#### Critères Validation
- [ ] 3 canaux fonctionnels
- [ ] Templates personnalisables
- [ ] Préférences utilisateur (opt-in/opt-out)
- [ ] Fallback si canal échoue
- [ ] Tests coverage >85%

#### Livrables
- `app/services/notification_service.py`
- `app/services/notification_providers/email_provider.py`
- `app/services/notification_providers/sms_provider.py`
- `app/services/notification_providers/push_provider.py`
- `app/models/notification.py`
- `tests/services/test_notification_service.py`

---

### TASK-P2-024 : Module NOTIFICATIONS - Templates

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Contexte
Templates notifications réutilisables avec variables.

#### Templates Email
1. **welcome_email** : Bienvenue après register
2. **email_verification** : Vérification email
3. **declaration_submitted** : Déclaration soumise
4. **declaration_validated** : Déclaration validée
5. **payment_received** : Paiement reçu
6. **payment_failed** : Paiement échoué
7. **password_reset** : Reset password

#### Variables
- `{user.full_name}`
- `{declaration.reference}`
- `{payment.amount}`
- `{action_url}`

#### Critères Validation
- [ ] 7 templates créés
- [ ] Variables interpolées
- [ ] HTML responsive (email)
- [ ] Tests rendering
- [ ] Coverage >80%

#### Livrables
- Templates dans `app/templates/emails/`
- Service `TemplateRenderer` dans `app/services/notification_service.py`
- `tests/services/test_template_renderer.py`

---

### TASK-P2-025 : Module NOTIFICATIONS - Queue Async

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Queue asynchrone notifications (Celery + Redis).

#### Architecture
- Celery worker
- Redis broker
- Tasks : `send_email_task`, `send_sms_task`, `send_push_task`

#### Retry Strategy
- Max retries : 3
- Retry delay : 5min, 30min, 2h
- Si 3 échecs : Log error + alert

#### Critères Validation
- [ ] Celery configuré
- [ ] Tasks async fonctionnels
- [ ] Retry automatique
- [ ] Monitoring (Flower)
- [ ] Tests coverage >85%

#### Livrables
- `app/tasks/notification_tasks.py`
- Configuration Celery dans `app/core/celery.py`
- `tests/tasks/test_notification_tasks.py`

---

## 📊 CRITÈRES ACCEPTATION PHASE 2

### Qualité Code
- [ ] Coverage tests >85% pour tous modules
- [ ] 0 bugs critiques
- [ ] 0 bugs bloquants
- [ ] Linter/type checker OK (black, flake8, mypy)
- [ ] Architecture 3-tiers respectée partout

### Fonctionnel
- [ ] Parcours citizen complet fonctionnel (E2E test)
- [ ] Parcours agent complet fonctionnel (E2E test)
- [ ] Webhooks BANGE testés en sandbox
- [ ] Notifications multi-canal testées

### Performance
- [ ] Endpoints P95 <500ms (tous)
- [ ] Webhooks P95 <2s
- [ ] Load test 100 users simultanés OK

### Sécurité
- [ ] JWT validation stricte
- [ ] RBAC enforcement
- [ ] Webhook signature validation
- [ ] Input validation (toutes routes)
- [ ] Rate limiting configuré

### Documentation
- [ ] Swagger complet (tous endpoints)
- [ ] README modules
- [ ] Architecture diagram
- [ ] Runbook incidents

---

## ⏱️ Timeline Phase 2

| Semaine | Tâches | Modules | Heures |
|---------|--------|---------|--------|
| S1 | TASK-P2-001 à P2-003 | AUTH | 40h |
| S2 | TASK-P2-004 à P2-006 | USERS | 40h |
| S3 | TASK-P2-007 à P2-009 | DECLARATIONS | 48h |
| S4 | TASK-P2-010 à P2-015 | DECLARATIONS + DOCUMENTS | 56h |
| S5 | TASK-P2-016 à P2-019 | PAYMENTS | 40h |
| S6 | TASK-P2-020 à P2-025 | WEBHOOKS + NOTIFICATIONS | 48h |

**Total** : 6 semaines, 272 heures (environ 7 semaines réelles avec buffer)

---

**Prochaine Phase** : Phase 3 - Admin & Agents (4 semaines)
