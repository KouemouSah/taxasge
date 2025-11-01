# 🔌 PHASE 4 : INTÉGRATIONS

**Durée estimée** : 3 semaines  
**Objectif** : Implémenter WEBHOOKS BANGE + NOTIFICATIONS + OCR amélioré

---

## VUE D'ENSEMBLE

**Modules Phase 4** :
- Module WEBHOOKS (10 endpoints) - 1 semaine - **CRITIQUE BLOCANT**
- Module NOTIFICATIONS (10 endpoints) - 1 semaine
- OCR Amélioré - 1 semaine

**Total** : 30 endpoints, 3 semaines

---

## SEMAINE 1 : WEBHOOKS BANGE (CRITIQUE)

### TASK-P4-001 : UC-WEBHOOK-001 (BANGE Webhook Reception)

**Agent** : Dev  
**Priorité** : CRITIQUE - BLOCANT REVENUS  
**Effort** : 2 jours  
**Use Case** : UC-WEBHOOK-001

#### Contexte
Reception webhooks BANGE pour confirmation paiements. **BLOCANT** : Sans ce webhook, aucun paiement ne peut être confirmé → 0 revenus collectés.

#### Endpoint
POST /webhooks/bange - Recevoir webhook BANGE

#### Payload BANGE Attendu
```json
{
  "event": "payment.success",
  "transaction_id": "TXN-20251020-ABC123",
  "reference": "DECL-2025-000123",
  "amount": 250000,
  "currency": "XAF",
  "payment_method": "mobile_money",
  "provider": "MTN",
  "phone_number": "+237670000000",
  "status": "completed",
  "timestamp": "2025-10-20T10:30:00Z",
  "signature": "hmac_sha256_signature_here"
}
```

#### Workflow (CRITIQUE - Chaque étape essentielle)
1. **Validation HMAC signature** (Sécurité CRITIQUE)
   ```python
   import hmac
   import hashlib
   import json
   
   def verify_bange_signature(payload: dict, signature: str) -> bool:
       """
       Vérifier signature HMAC-SHA256 BANGE
       
       CRITIQUE : Sans cette vérification, risque de fraude
       (faux webhooks pour marquer paiements comme payés)
       """
       secret = settings.BANGE_WEBHOOK_SECRET
       
       # Serializer payload exactement comme BANGE
       payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
       
       # Calculer HMAC
       computed = hmac.new(
           secret.encode('utf-8'),
           payload_str.encode('utf-8'),
           hashlib.sha256
       ).hexdigest()
       
       # Comparaison constant-time (évite timing attacks)
       return hmac.compare_digest(computed, signature)
   ```

2. **Vérifier idempotence** (Éviter double traitement)
   ```python
   async def check_idempotence(transaction_id: str) -> bool:
       """
       Check si transaction déjà traitée
       
       CRITIQUE : Sans idempotence, un retry BANGE
       pourrait crediter 2x le même paiement
       """
       pool = Database.get_pool()
       async with pool.acquire() as conn:
           existing = await conn.fetchrow(
               "SELECT id FROM webhook_events WHERE transaction_id = $1",
               transaction_id
           )
           return existing is not None
   ```

3. **Update payment status**
   ```python
   async def process_payment_webhook(payload: dict):
       """Process payment webhook"""
       reference = payload["reference"]  # DECL-2025-000123
       
       # Récupérer payment par reference
       payment = await payment_repo.get_by_reference(reference)
       if not payment:
           raise NotFoundError(f"Payment not found for reference {reference}")
       
       # Update status
       payment.status = "completed"
       payment.paid_at = datetime.fromisoformat(payload["timestamp"])
       payment.transaction_id = payload["transaction_id"]
       payment.provider = payload["provider"]
       
       await payment_repo.update(payment)
   ```

4. **Update declaration status**
   ```python
   # Update declaration : validated → paid
   declaration = await declaration_repo.get_by_id(payment.declaration_id)
   declaration.status = "paid"
   declaration.paid_at = payment.paid_at
   await declaration_repo.update(declaration)
   ```

5. **Notification user**
   ```python
   # Email + SMS notification
   await notification_service.send(
       user_id=declaration.user_id,
       type="payment_received",
       data={
           "reference": declaration.reference,
           "amount": payment.amount,
           "receipt_url": f"https://taxasge.com/receipts/{payment.id}"
       },
       channels=["email", "sms"]
   )
   ```

6. **Logger webhook**
   ```python
   # Log dans webhook_events pour audit
   await conn.execute(
       """
       INSERT INTO webhook_events 
       (id, event_type, payload, signature, signature_valid, processed, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       """,
       uuid.uuid4(), payload["event"], json.dumps(payload),
       signature, True, True, processing_time
   )
   ```

7. **Retour 200 OK**
   - BANGE attend 200 OK < 5 secondes
   - Si timeout → retry webhook (jusqu'à 3 fois avec exponential backoff)

#### Fichiers Concernés
**Créer** :
- `app/api/v1/webhooks.py` (endpoint)
- `app/services/webhook_service.py` (logique)
- `app/utils/signature.py` (HMAC verification)
- `tests/use_cases/test_uc_webhook.py`

**Tables DB** :
```sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,  -- payment.success, payment.failed
    transaction_id VARCHAR(100) UNIQUE,
    payload JSONB NOT NULL,
    signature VARCHAR(256) NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_time_ms INTEGER,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_transaction_id ON webhook_events(transaction_id);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
```

#### Critères Validation
- ✅ HMAC signature validée correctement
- ✅ Idempotence garantie (pas de double traitement)
- ✅ Payment status updated (pending → completed)
- ✅ Declaration status updated (validated → paid)
- ✅ Notification envoyée
- ✅ Webhook loggé dans DB
- ✅ Latence < 2 secondes (P95)
- ✅ Tests avec payloads réels BANGE

---

### TASK-P4-002 : Tests Webhooks BANGE (CRITIQUE)

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 1 jour  

#### Tests Critiques
1. **Test signature valide** : Webhook accepté (200 OK)
2. **Test signature invalide** : 401 Unauthorized
3. **Test idempotence** : Même transaction_id 2x → 1 seul traitement
4. **Test timeout** : Webhook process < 5s
5. **Test différents statuts** : success, failed, pending, refunded
6. **Test retry BANGE** : 3 retries max avec exponential backoff

#### Mock BANGE
```python
import hmac
import hashlib
import json

@pytest.fixture
def bange_webhook_payload():
    """Generate valid BANGE webhook payload with signature"""
    payload = {
        "event": "payment.success",
        "transaction_id": f"TXN-{uuid.uuid4()}",
        "reference": "DECL-2025-000123",
        "amount": 250000,
        "currency": "XAF",
        "status": "completed",
        "timestamp": "2025-10-20T10:30:00Z"
    }
    
    # Générer signature valide
    secret = settings.BANGE_WEBHOOK_SECRET
    payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    signature = hmac.new(
        secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return payload, signature

@pytest.mark.asyncio
async def test_webhook_valid_signature(client, bange_webhook_payload):
    """Test webhook avec signature valide"""
    payload, signature = bange_webhook_payload
    
    response = await client.post(
        "/api/v1/webhooks/bange",
        json=payload,
        headers={"X-BANGE-Signature": signature}
    )
    
    assert response.status_code == 200
    
    # Vérifier payment updated
    payment = await payment_repo.get_by_reference(payload["reference"])
    assert payment.status == "completed"
    assert payment.transaction_id == payload["transaction_id"]

@pytest.mark.asyncio
async def test_webhook_invalid_signature(client):
    """Test webhook avec signature invalide"""
    payload = {"event": "payment.success", "reference": "DECL-2025-000123"}
    
    response = await client.post(
        "/api/v1/webhooks/bange",
        json=payload,
        headers={"X-BANGE-Signature": "invalid_signature"}
    )
    
    assert response.status_code == 401
    assert "Invalid signature" in response.json()["detail"]

@pytest.mark.asyncio
async def test_webhook_idempotence(client, bange_webhook_payload):
    """Test idempotence : même webhook 2x"""
    payload, signature = bange_webhook_payload
    
    # Premier appel
    response1 = await client.post(
        "/api/v1/webhooks/bange",
        json=payload,
        headers={"X-BANGE-Signature": signature}
    )
    assert response1.status_code == 200
    
    # Deuxième appel (retry BANGE)
    response2 = await client.post(
        "/api/v1/webhooks/bange",
        json=payload,
        headers={"X-BANGE-Signature": signature}
    )
    assert response2.status_code == 200  # Still OK
    
    # Vérifier qu'un seul webhook event créé
    events = await conn.fetch(
        "SELECT * FROM webhook_events WHERE transaction_id = $1",
        payload["transaction_id"]
    )
    assert len(events) == 1
```

#### Critères Validation
- ✅ 100% tests passants
- ✅ Coverage >95% webhook handler
- ✅ Tests avec vraies signatures BANGE (mock)
- ✅ Tests concurrency/idempotence

---

### TASK-P4-003 : Webhook Logs & Monitoring

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Endpoints Admin
1. GET /admin/webhooks/logs - Historique webhooks
2. GET /admin/webhooks/stats - Statistiques webhooks

#### Métriques Prometheus
```python
from prometheus_client import Counter, Histogram

# Métriques
webhook_requests_total = Counter(
    'webhook_requests_total',
    'Total webhook requests received',
    ['event_type', 'status']
)

webhook_processing_time = Histogram(
    'webhook_processing_seconds',
    'Webhook processing time',
    ['event_type']
)

webhook_errors_total = Counter(
    'webhook_errors_total',
    'Total webhook errors',
    ['error_type']
)

# Instrumenter handler
@router.post("/webhooks/bange")
async def receive_bange_webhook(request: Request):
    start_time = time.time()
    
    try:
        # Process webhook...
        webhook_requests_total.labels(
            event_type=payload["event"],
            status="success"
        ).inc()
        
    except SignatureError:
        webhook_requests_total.labels(
            event_type="unknown",
            status="invalid_signature"
        ).inc()
        webhook_errors_total.labels(error_type="signature").inc()
        raise
    
    finally:
        processing_time = time.time() - start_time
        webhook_processing_time.labels(
            event_type=payload.get("event", "unknown")
        ).observe(processing_time)
```

#### Alertes PagerDuty
```yaml
# alertmanager.yml
groups:
  - name: webhooks
    rules:
      - alert: WebhookSignatureFailures
        expr: rate(webhook_errors_total{error_type="signature"}[5m]) > 10
        annotations:
          summary: "High webhook signature failures"
          description: ">10 webhooks/5min with invalid signatures"
        
      - alert: WebhookProcessingTimeout
        expr: histogram_quantile(0.95, webhook_processing_seconds) > 3
        annotations:
          summary: "Webhook processing too slow"
          description: "P95 processing time >3s (BANGE timeout 5s)"
      
      - alert: WebhookProcessingFailures
        expr: rate(webhook_errors_total[5m]) > 5
        annotations:
          summary: "High webhook processing failures"
```

#### Critères Validation
- ✅ Tous webhooks loggés dans DB
- ✅ Métriques Prometheus instrumentées
- ✅ Alertes PagerDuty configurées
- ✅ Dashboard Grafana webhook

---

## SEMAINE 2 : NOTIFICATIONS

### TASK-P4-004 : UC-NOTIF-001 (Système Notifications Multi-Canal)

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 3 jours  
**Use Case** : UC-NOTIF-001

#### Endpoints
1. POST /notifications/send - Envoyer notification
2. GET /notifications - Liste notifications utilisateur
3. GET /notifications/{id} - Détails notification
4. PATCH /notifications/{id}/mark-read - Marquer lu
5. DELETE /notifications/{id} - Supprimer notification

#### Canaux Supportés
- **Email** (Mailgun API)
- **SMS** (Twilio API)
- **Push Notifications** (Firebase Cloud Messaging)
- **In-App** (Table database `notifications`)

#### Types Notifications
1. **Declaration Status** : Submitted, Validated, Rejected, Paid
2. **Payment** : Payment Received, Payment Failed
3. **Document** : Document Required, Document Approved
4. **System** : Maintenance, New Feature
5. **Reminder** : Payment Deadline, Document Missing

#### Templates
```python
# app/services/notification_templates.py
TEMPLATES = {
    "declaration_validated": {
        "email": {
            "subject": "Déclaration validée - {reference}",
            "body": """
            Bonjour {user_name},
            
            Votre déclaration {reference} a été validée par nos agents.
            
            Montant à payer : {amount} XAF
            Lien de paiement : {payment_link}
            
            Cordialement,
            L'équipe TaxasGE
            """
        },
        "sms": {
            "body": "TaxasGE: Déclaration {reference} validée. Payer {amount} XAF sur {payment_link}"
        },
        "push": {
            "title": "Déclaration validée",
            "body": "Votre déclaration {reference} est prête pour paiement",
            "action_url": "/declarations/{declaration_id}"
        }
    },
    
    "payment_received": {
        "email": {
            "subject": "Paiement confirmé - {reference}",
            "body": """
            Bonjour {user_name},
            
            Nous confirmons la réception de votre paiement de {amount} XAF 
            pour la déclaration {reference}.
            
            Reçu fiscal : {receipt_url}
            
            Cordialement,
            L'équipe TaxasGE
            """
        },
        "sms": {
            "body": "TaxasGE: Paiement {amount} XAF reçu. Reçu: {receipt_url}"
        },
        "push": {
            "title": "Paiement confirmé",
            "body": "Paiement de {amount} XAF reçu pour {reference}",
            "action_url": "/receipts/{receipt_id}"
        }
    },
    
    "payment_deadline_reminder": {
        "email": {
            "subject": "Rappel : Paiement à effectuer - {reference}",
            "body": """
            Bonjour {user_name},
            
            Votre déclaration {reference} doit être payée avant le {deadline}.
            
            Montant : {amount} XAF
            Jours restants : {days_remaining}
            
            Lien de paiement : {payment_link}
            
            Cordialement,
            L'équipe TaxasGE
            """
        },
        "sms": {
            "body": "TaxasGE: {days_remaining}j pour payer {amount} XAF ({reference}). {payment_link}"
        }
    }
}
```

#### Workflow Envoi
```python
async def send_notification(
    user_id: str,
    notification_type: str,
    data: dict,
    channels: list[str] = ["email", "in_app"]
):
    """
    Envoyer notification multi-canal
    
    Args:
        user_id: ID utilisateur
        notification_type: Type (declaration_validated, payment_received, etc.)
        data: Données pour templates
        channels: Canaux (email, sms, push, in_app)
    """
    # Récupérer user et préférences
    user = await user_repo.get_by_id(user_id)
    user_prefs = await user_prefs_repo.get_by_user_id(user_id)
    
    # Respecter préférences user
    enabled_channels = [
        ch for ch in channels 
        if user_prefs.get(f"{ch}_notifications_enabled", True)
    ]
    
    # Récupérer templates
    template = TEMPLATES[notification_type]
    
    # Préparer data
    data["user_name"] = user.full_name
    
    # Envoi asynchrone parallèle
    tasks = []
    for channel in enabled_channels:
        if channel == "email":
            tasks.append(send_email(
                to=user.email,
                subject=template["email"]["subject"].format(**data),
                body=template["email"]["body"].format(**data)
            ))
        
        elif channel == "sms":
            tasks.append(send_sms(
                to=user.phone,
                body=template["sms"]["body"].format(**data)
            ))
        
        elif channel == "push":
            tasks.append(send_push(
                user_id=user.id,
                title=template["push"]["title"].format(**data),
                body=template["push"]["body"].format(**data),
                action_url=template["push"]["action_url"].format(**data)
            ))
        
        elif channel == "in_app":
            tasks.append(create_in_app_notification(
                user_id=user.id,
                type=notification_type,
                title=template["push"]["title"].format(**data),
                body=template["push"]["body"].format(**data),
                data=data
            ))
    
    # Envoi parallèle (pas de blocage)
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Logger échecs
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Notification failed on channel {enabled_channels[i]}: {result}")
```

#### Providers
**Email - Mailgun** :
```python
async def send_email(to: str, subject: str, body: str):
    """Envoyer email via Mailgun"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
            auth=("api", settings.MAILGUN_API_KEY),
            data={
                "from": f"TaxasGE <noreply@{settings.MAILGUN_DOMAIN}>",
                "to": to,
                "subject": subject,
                "text": body
            }
        )
        response.raise_for_status()
```

**SMS - Twilio** :
```python
async def send_sms(to: str, body: str):
    """Envoyer SMS via Twilio"""
    client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    message = await client.messages.create_async(
        to=to,
        from_=settings.TWILIO_PHONE_NUMBER,
        body=body
    )
    
    return message.sid
```

**Push - Firebase** :
```python
async def send_push(user_id: str, title: str, body: str, action_url: str):
    """Envoyer push notification via Firebase"""
    # Récupérer FCM token user
    token = await user_repo.get_fcm_token(user_id)
    
    if not token:
        return  # User n'a pas activé push
    
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        data={
            "action_url": action_url
        },
        token=token
    )
    
    response = messaging.send(message)
    return response
```

#### Fichiers Concernés
**Créer** :
- `app/api/v1/notifications.py`
- `app/services/notification_service.py`
- `app/services/notification_templates.py`
- `app/services/providers/email_provider.py`
- `app/services/providers/sms_provider.py`
- `app/services/providers/push_provider.py`

**Tables DB** :
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

#### Critères Validation
- ✅ Multi-canal fonctionnel (email, SMS, push, in-app)
- ✅ Templates complets (10+ types)
- ✅ Préférences user respectées
- ✅ Envoi asynchrone (pas de blocage)
- ✅ Gestion échecs graceful
- ✅ Tests avec mocks providers

---

### TASK-P4-005 : Notifications Scheduling (Celery)

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 2 jours  

#### Fonctionnalités
1. **Notifications différées** : Envoyer à date/heure spécifique
2. **Notifications récurrentes** : Reminders automatiques
3. **Batch notifications** : Envoyer à plusieurs users

#### Use Cases
- Reminder 3 jours avant deadline paiement
- Reminder si documents manquants après 7 jours
- Newsletter mensuelle (tous users actifs)

#### Implementation (Celery + Redis)
```python
# app/tasks/notifications.py
from celery import Celery
from celery.schedules import crontab

celery_app = Celery('taxasge', broker=settings.REDIS_URL)

@celery_app.task
def send_payment_reminder(declaration_id: str):
    """Envoyer reminder paiement si deadline proche"""
    declaration = get_declaration(declaration_id)
    
    if declaration.status == "validated":
        days_until_deadline = (declaration.payment_deadline - datetime.now()).days
        
        if days_until_deadline == 3:
            # Reminder 3 jours avant
            send_notification(
                declaration.user_id,
                "payment_deadline_reminder",
                {
                    "reference": declaration.reference,
                    "amount": declaration.amount,
                    "deadline": declaration.payment_deadline,
                    "days_remaining": 3,
                    "payment_link": f"https://taxasge.com/pay/{declaration.id}"
                },
                channels=["email", "sms", "push"]
            )

# Schedule automatique
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Tous les jours à 9h : Check payment reminders
    sender.add_periodic_task(
        crontab(hour=9, minute=0),
        check_payment_reminders.s(),
    )
    
    # Tous les lundis à 10h : Newsletter hebdo
    sender.add_periodic_task(
        crontab(day_of_week=1, hour=10, minute=0),
        send_weekly_newsletter.s(),
    )

@celery_app.task
def check_payment_reminders():
    """Check toutes déclarations validated avec deadline proche"""
    declarations = get_validated_declarations_with_upcoming_deadline()
    
    for decl in declarations:
        # Enqueue task
        send_payment_reminder.delay(decl.id)

@celery_app.task
def send_weekly_newsletter():
    """Envoyer newsletter hebdo à tous users actifs"""
    active_users = get_active_users(last_30_days=True)
    
    for user in active_users:
        send_notification(
            user.id,
            "weekly_newsletter",
            {
                "week_stats": get_user_week_stats(user.id)
            },
            channels=["email"]
        )
```

#### Configuration
```python
# app/config.py
class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = REDIS_URL
    CELERY_RESULT_BACKEND: str = REDIS_URL
```

#### Démarrer Celery
```bash
# Worker
celery -A app.tasks.notifications worker --loglevel=info

# Beat (scheduler)
celery -A app.tasks.notifications beat --loglevel=info
```

#### Critères Validation
- ✅ Scheduling fonctionnel
- ✅ Reminders automatiques envoyés
- ✅ Tests scheduling avec Celery (pytest-celery)
- ✅ Monitoring tasks (Flower dashboard)

---

## SEMAINE 3 : OCR AMÉLIORÉ

### TASK-P4-006 : UC-DOC-007 (OCR Manuel Trigger + Extractors)

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 2 jours  
**Use Case** : UC-DOC-007

#### Endpoint
POST /documents/{id}/ocr - Trigger OCR manuel

#### Extractors Spécialisés (5 types)
1. **National ID Card** : Nom, date naissance, numéro ID
2. **Passport** : Nom, nationalité, numéro passport
3. **Business Registration (RC)** : Raison sociale, RC, NIF
4. **Tax Receipt** : Montant, date, référence
5. **Invoice** : Fournisseur, montant, items

#### Workflow OCR
```python
async def process_ocr(document_id: str):
    """Process OCR sur document"""
    doc = await document_repo.get_by_id(document_id)
    
    # 1. Télécharger fichier depuis Firebase
    file_bytes = await download_from_firebase(doc.file_url)
    
    # 2. Détection type document (ML classifier ou metadata)
    doc_type = await classify_document_type(file_bytes, doc.file_name)
    
    # 3. OCR avec provider approprié
    if doc_type in ["national_id", "passport"]:
        # Google Vision API (meilleur pour IDs)
        text = await google_vision_ocr(file_bytes)
    else:
        # Tesseract (gratuit, bon pour invoices/receipts)
        text = await tesseract_ocr(file_bytes)
    
    # 4. Extraction structurée selon type
    extractor = EXTRACTORS[doc_type]
    extracted_data = extractor.extract(text)
    
    # 5. Validation qualité (score >80%)
    quality_score = calculate_ocr_quality(extracted_data, text)
    
    # 6. Sauvegarder résultats
    await save_ocr_results(document_id, {
        "extracted_data": extracted_data,
        "quality_score": quality_score,
        "raw_text": text,
        "doc_type": doc_type,
        "provider": "google_vision" if doc_type in ["national_id", "passport"] else "tesseract"
    })
    
    return extracted_data, quality_score
```

#### Extractors Implementation
```python
# app/services/ocr/extractors.py
import re
from datetime import datetime

class NationalIDExtractor:
    """Extractor pour carte d'identité nationale"""
    
    def extract(self, text: str) -> dict:
        """Extract données structured"""
        data = {}
        
        # Nom (pattern : NOM: John Doe)
        name_match = re.search(r'NOM[:\s]+([A-ZÀ-Ý\s]+)', text, re.IGNORECASE)
        if name_match:
            data["full_name"] = name_match.group(1).strip()
        
        # Date naissance (pattern : 01/01/1990)
        dob_match = re.search(r'(\d{2}/\d{2}/\d{4})', text)
        if dob_match:
            data["date_of_birth"] = dob_match.group(1)
        
        # Numéro ID (pattern : 123456789)
        id_match = re.search(r'N[°\s]*(\d{9})', text)
        if id_match:
            data["national_id"] = id_match.group(1)
        
        return data

class PassportExtractor:
    """Extractor pour passeport"""
    
    def extract(self, text: str) -> dict:
        data = {}
        
        # Passport number (format : P123456)
        passport_match = re.search(r'P(\d{6})', text)
        if passport_match:
            data["passport_number"] = f"P{passport_match.group(1)}"
        
        # Nationality
        nationality_match = re.search(r'NATIONALITY[:\s]+([A-Z]+)', text)
        if nationality_match:
            data["nationality"] = nationality_match.group(1)
        
        return data

class BusinessRegistrationExtractor:
    """Extractor pour RC (Registre de Commerce)"""
    
    def extract(self, text: str) -> dict:
        data = {}
        
        # Raison sociale
        name_match = re.search(r'RAISON SOCIALE[:\s]+([A-ZÀ-Ý\s]+)', text, re.IGNORECASE)
        if name_match:
            data["company_name"] = name_match.group(1).strip()
        
        # RC number
        rc_match = re.search(r'RC[:\s]*([A-Z0-9\-]+)', text)
        if rc_match:
            data["rc_number"] = rc_match.group(1)
        
        # NIF
        nif_match = re.search(r'NIF[:\s]*([A-Z0-9]+)', text)
        if nif_match:
            data["nif"] = nif_match.group(1)
        
        return data

# Registry
EXTRACTORS = {
    "national_id": NationalIDExtractor(),
    "passport": PassportExtractor(),
    "business_registration": BusinessRegistrationExtractor(),
    # ... autres extractors
}
```

#### Quality Score
```python
def calculate_ocr_quality(extracted_data: dict, raw_text: str) -> float:
    """
    Calculer score qualité OCR (0-100)
    
    Critères :
    - % champs extraits / champs requis (50%)
    - Confiance provider (30%)
    - Validation format (20%)
    """
    score = 0
    
    # 1. Champs extraits (50 points)
    required_fields = get_required_fields(extracted_data["type"])
    extracted_fields = [k for k, v in extracted_data.items() if v]
    
    fields_score = (len(extracted_fields) / len(required_fields)) * 50
    score += fields_score
    
    # 2. Validation format (50 points)
    valid_formats = 0
    if "date_of_birth" in extracted_data:
        if is_valid_date(extracted_data["date_of_birth"]):
            valid_formats += 1
    
    if "national_id" in extracted_data:
        if re.match(r'^\d{9}$', extracted_data["national_id"]):
            valid_formats += 1
    
    format_score = (valid_formats / len(extracted_fields)) * 50 if extracted_fields else 0
    score += format_score
    
    return round(score, 2)
```

#### Critères Validation
- ✅ 5 extractors fonctionnels
- ✅ Score qualité >80% sur 90% documents test
- ✅ Fallback Tesseract si Google Vision échoue
- ✅ Tests avec vrais documents (10+ par type)

---

### TASK-P4-007 : Tests Phase 4

**Agent** : Test  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Tests Critiques
1. **Webhooks BANGE** : Signature, idempotence, retry
2. **Notifications** : Multi-canal, templates, préférences
3. **OCR** : 5 extractors, quality score

#### Critères Validation
- ✅ 100% tests passants
- ✅ Coverage >85% modules WEBHOOK + NOTIF + OCR
- ✅ Tests intégration end-to-end

---

## 📊 KPIs Phase 4

| Métrique | Avant | Après | Objectif |
|----------|-------|-------|----------|
| Endpoints impl | 127 | 157 | 157 |
| Webhooks BANGE | ❌ 0% | ✅ 100% | 100% |
| Notifications | ❌ 0% | ✅ 100% | 100% |
| OCR Quality | ~60% | >80% | >80% |
| Revenus confirmés | ❌ 0% | ✅ 100% | 100% |

## ⏱️ Timeline

| Semaine | Tâches | Agent | Focus |
|---------|--------|-------|-------|
| S1 | TASK-P4-001 à P4-003 | Dev + Test | Webhooks BANGE |
| S2 | TASK-P4-004 à P4-005 | Dev | Notifications |
| S3 | TASK-P4-006 à P4-007 | Dev + Test | OCR + Tests |

---

**Prochaine Phase** : Phase 5 - Tests & QA (2 semaines)
