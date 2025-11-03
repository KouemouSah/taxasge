# UC-DOC-007 : Retry OCR - Relancer OCR Manuellement

## 1. Métadonnées
- **ID** : UC-DOC-007
- **Endpoint** : `POST /documents/{id}/ocr/retry`
- **Méthode** : POST
- **Auth requise** : ✅ Oui
- **Priorité** : MOYENNE
- **Statut implémentation** : ⚠️ PARTIEL (70%) - Multi-engine OCR à compléter
- **Acteurs** : Citizen, Business, Admin
- **Dépend de** : UC-DOC-001, UC-DOC-003
- **Technologies** : Tesseract, Google Cloud Vision API, Azure Document Intelligence

---

## 2. Description Métier

### Contexte
Un document a été uploadé et l'OCR automatique s'est exécuté, mais :
- **Échec complet** : ocr_status = "failed" (document illisible, format non supporté)
- **Qualité insuffisante** : ocr_confidence < 0.7 (reconnaissance imprécise)
- **Données manquantes** : Certains champs critiques non extraits
- **Mauvais moteur** : Tesseract utilisé mais Google Vision aurait été meilleur

L'utilisateur a besoin de **relancer l'OCR manuellement** avec :
- Choix du moteur OCR (Tesseract, Google Vision, Azure)
- Paramètres custom (langue, preprocessing, résolution)
- Priorité queue (normal, high, urgent)
- Notification à la complétion

**Cas d'usage** :
1. **OCR échoué** : "Relancer avec preprocessing image"
2. **Confidence faible** : "Essayer Google Vision au lieu de Tesseract"
3. **Document amélioré** : User a ré-scanné document en meilleure qualité
4. **Extraction partielle** : "Certains champs manquent, retry extraction"
5. **Changement langue** : Document français mais OCR a détecté espagnol

### Problème
- OCR automatique utilise config par défaut (pas toujours optimal)
- Certains documents nécessitent preprocessing (deskew, denoise)
- Multi-engine stratégie : Tesseract rapide mais Google Vision plus précis
- Users veulent contrôler quand retry (éviter coûts inutiles)

### Objectif
Permettre **retry OCR manuel** avec :
- ✅ Choix moteur OCR (Tesseract/Google Vision/Azure)
- ✅ Paramètres custom (langue, preprocessing options)
- ✅ Priorité queue (urgent passe devant)
- ✅ Conservation résultats précédents (historique OCR)
- ✅ Webhook notification à la complétion
- ✅ Coût estimation (Google Vision = payant)

### Workflow Détaillé
```
1. User/Admin demande POST /documents/{id}/ocr/retry
   Body: {
     "engine": "google_vision",
     "language": "fra",
     "priority": "high",
     "preprocessing": {
       "deskew": true,
       "denoise": true,
       "enhance_contrast": true
     }
   }

2. Backend vérifie authentification
   → Token JWT valide ?

3. Backend récupère document
   → SELECT * FROM uploaded_files WHERE id = {document_id}
   → Document existe ?

4. Backend vérifie RBAC permissions :
   ├─ User : document.user_id == current_user.id ?
   ├─ Admin : Toujours autorisé
   └─ Agent : NON autorisé (403)

5. Backend vérifie contraintes business :
   
   a) Document type supporté ?
      → mime_type IN ('application/pdf', 'image/*') ?
      → Si non supporté → 422 Unprocessable
   
   b) OCR déjà en cours ?
      → Si ocr_status = 'processing' :
         → Option 1 : 409 Conflict (retry après complétion)
         → Option 2 : Cancel current + start new
   
   c) Limite retries dépassée ?
      → Si ocr_retry_count >= 5 :
         → 422 Too many retries (contact support)
   
   d) Budget OCR dépassé ? (si Google Vision)
      → Si user.ocr_credits < cost :
         → 402 Payment Required

6. Backend sauvegarde résultats OCR précédents :
   
   → INSERT INTO ocr_history (
       document_id,
       ocr_results_json,
       ocr_confidence,
       engine_used,
       created_at
     )
     SELECT document_id, extraction_results, 
            ocr_confidence, ocr_engine, NOW()
     FROM ocr_extraction_results
     WHERE uploaded_file_id = {document_id}
   
   → Permet rollback si nouveau OCR pire

7. Backend génère job OCR :
   
   → INSERT INTO ocr_jobs (
       job_id: UUID,
       document_id,
       engine: "google_vision",
       language: "fra",
       priority: "high",
       preprocessing_config: {...},
       status: "queued",
       requested_by: user_id,
       webhook_url: user.webhook_url
     )

8. Backend update document status :
   
   → UPDATE uploaded_files SET
       ocr_status = 'processing',
       ocr_retry_count = ocr_retry_count + 1,
       last_ocr_attempt = NOW()
     WHERE id = {document_id}

9. Backend enqueue job Celery/RabbitMQ :
   
   Queue selection :
   ├─ Priority "urgent" → ocr_urgent_queue (SLA 2 min)
   ├─ Priority "high" → ocr_high_queue (SLA 5 min)
   └─ Priority "normal" → ocr_normal_queue (SLA 15 min)
   
   → Task: process_ocr_job(job_id)

10. Backend retourne response immédiate :
    → 202 Accepted (processing asynchrone)
    → Body contient job_id pour polling status

11. Celery worker traite job (async) :
    
    a) Fetch document from Firebase Storage
    
    b) Apply preprocessing si demandé :
       - Deskew (correction angle)
       - Denoise (réduction bruit)
       - Enhance contrast
       - Binarization
    
    c) Execute OCR selon engine :
       
       IF engine = "tesseract" :
         → pytesseract.image_to_string(image, lang='fra')
       
       ELIF engine = "google_vision" :
         → vision_client.document_text_detection(image)
         → Coût : $1.50 / 1000 pages
       
       ELIF engine = "azure" :
         → form_recognizer_client.begin_recognize_content(document)
         → Coût : $1.50 / 1000 pages
    
    d) Parse OCR results → Extract text + confidence
    
    e) Run extraction pipeline (UC-DOC-001 step 12)
    
    f) Update ocr_extraction_results table
    
    g) Update uploaded_files.ocr_status = "completed"
    
    h) Send webhook notification si configuré
    
    i) Send email/push notification user

12. User peut poll status :
    → GET /documents/{id}/ocr/status
    → Retourne current job status + ETA

13. Si OCR échoue :
    → Update ocr_status = "failed"
    → Save error details
    → Notify user avec suggestions
```

### Cas Spéciaux

#### Cas 1 : OCR Déjà en Cours (Conflict)
```
Si ocr_status = 'processing' :

Option A (défaut) : Return 409 Conflict
  - Message : "OCR already in progress"
  - Suggestion : "Poll status or wait for completion"

Option B (si force=true) : Cancel current + start new
  - Cancel Celery job actuel
  - Start nouveau job avec nouvelles config
  - Warning : "Previous OCR cancelled"
```

#### Cas 2 : Limite Retries Dépassée
```
Si ocr_retry_count >= 5 :

Return 422 Unprocessable Entity :
  - Message : "Maximum retry limit reached (5)"
  - Suggestions :
    * "Document may be unsupported format"
    * "Try uploading higher quality scan"
    * "Contact support for manual processing"
  - Support contact : support@taxasge.gq
```

#### Cas 3 : Rollback vers OCR Précédent
```
Endpoint dédié : POST /documents/{id}/ocr/rollback

Cas d'usage : Nouveau OCR pire que précédent

Workflow :
1. Fetch latest ocr_history entry
2. Restore previous extraction_results
3. Update ocr_confidence
4. Notify user : "Restored previous OCR results"
```

---

## 3. Given/When/Then

### Scénario 1 : Retry OCR avec Google Vision

```gherkin
Given un document avec OCR Tesseract complété
  And ocr_status = "completed"
  And ocr_confidence = 0.65 (faible)
  And user veut essayer Google Vision (plus précis)

When l'utilisateur demande :
  POST /documents/DOC-2025-abc123/ocr/retry
  Body: {
    "engine": "google_vision",
    "language": "fra",
    "priority": "high"
  }

Then le système :
  - Sauvegarde résultats OCR actuels dans ocr_history
  - Crée nouveau job OCR (job_id généré)
  - Update ocr_status = "processing"
  - Increment ocr_retry_count = 2
  - Enqueue job dans ocr_high_queue
  - Retourne 202 Accepted avec :
    * job_id : "OCR-JOB-2025-xyz789"
    * status : "queued"
    * estimated_completion : "2025-11-02T15:07:00Z" (ETA 5 min)
    * polling_url : "GET /documents/{id}/ocr/status"
    * cost_estimate : "$0.0015" (1 page)
```

### Scénario 2 : OCR Échoué - Retry avec Preprocessing

```gherkin
Given un document PDF scanné de mauvaise qualité
  And ocr_status = "failed"
  And error : "Low image quality detected"

When l'utilisateur demande retry avec preprocessing :
  POST /documents/{id}/ocr/retry
  Body: {
    "engine": "tesseract",
    "preprocessing": {
      "deskew": true,
      "denoise": true,
      "enhance_contrast": true,
      "binarization": true
    }
  }

Then le système :
  - Applique preprocessing avant OCR
  - Deskew : Corrige rotation ±5°
  - Denoise : Réduit bruit numérique
  - Enhance contrast : Améliore lisibilité
  - Binarization : Convertit en noir/blanc
  - Execute Tesseract sur image améliorée
  - Si succès : ocr_status = "completed"
```

### Scénario 3 : Retry en Mode Urgent

```gherkin
Given un document critique pour déclaration imminente
  And deadline déclaration = dans 2 heures
  And user a besoin OCR immédiat

When l'utilisateur demande avec priority "urgent" :
  POST /documents/{id}/ocr/retry
  Body: {
    "engine": "google_vision",
    "priority": "urgent",
    "webhook_url": "https://app.taxasge.gq/webhooks/ocr"
  }

Then le système :
  - Place job en tête de queue (ocr_urgent_queue)
  - SLA : 2 minutes max
  - Traité avant tous jobs "normal" et "high"
  - Webhook notifié immédiatement à complétion
  - Retourne 202 avec ETA : "~2 minutes"
```

### Scénario 4 : Limite Retries Atteinte

```gherkin
Given un document ayant déjà été retry 5 fois
  And ocr_retry_count = 5
  And tous retries ont échoué

When l'utilisateur tente 6ème retry

Then le système retourne 422 Unprocessable :
  - message : "Maximum retry limit reached"
  - retry_count : 5
  - max_retries : 5
  - suggestions : [
      "Upload higher quality document",
      "Contact support for manual processing",
      "Try different document format"
    ]
  - support_email : "support@taxasge.gq"
```

### Scénario 5 : Rollback vers OCR Précédent

```gherkin
Given un document avec 2 OCR dans l'historique :
  - OCR v1 (Tesseract) : confidence 0.75
  - OCR v2 (Google Vision) : confidence 0.62 (pire)
  And user préfère OCR v1

When l'utilisateur demande rollback :
  POST /documents/{id}/ocr/rollback

Then le système :
  - Fetch latest ocr_history entry (OCR v1)
  - Restore extraction_results de OCR v1
  - Update ocr_confidence = 0.75
  - Update ocr_engine = "tesseract"
  - Keep OCR v2 dans history (audit)
  - Retourne 200 OK avec :
    * message : "Restored previous OCR results"
    * restored_version : "OCR v1 (2025-10-31)"
    * confidence : 0.75
```

---

## 4. Requête HTTP

### Retry OCR Basique
```http
POST /api/v1/documents/DOC-2025-abc123/ocr/retry HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "engine": "google_vision"
}
```

### Retry avec Paramètres Avancés
```http
POST /api/v1/documents/DOC-2025-abc123/ocr/retry HTTP/1.1
Content-Type: application/json

{
  "engine": "google_vision",
  "language": "fra",
  "priority": "high",
  "preprocessing": {
    "deskew": true,
    "denoise": true,
    "enhance_contrast": true,
    "binarization": false
  },
  "options": {
    "detect_language": false,
    "extract_tables": true,
    "extract_images": false,
    "confidence_threshold": 0.75
  },
  "webhook_url": "https://app.taxasge.gq/webhooks/ocr/complete",
  "force": false
}
```

### Rollback OCR
```http
POST /api/v1/documents/DOC-2025-abc123/ocr/rollback HTTP/1.1
Authorization: Bearer token...
Content-Type: application/json

{
  "version": "previous"
}
```

### Poll Status
```http
GET /api/v1/documents/DOC-2025-abc123/ocr/status HTTP/1.1
Authorization: Bearer token...
```

### Body Parameters

| Paramètre | Type | Obligatoire | Défaut | Description |
|-----------|------|-------------|---------|-------------|
| `engine` | Enum | ❌ Non | tesseract | tesseract, google_vision, azure |
| `language` | String | ❌ Non | auto | Code langue ISO 639-2 (fra, eng, spa) |
| `priority` | Enum | ❌ Non | normal | normal, high, urgent |
| `preprocessing` | Object | ❌ Non | null | Options preprocessing image |
| `preprocessing.deskew` | Boolean | ❌ Non | false | Correction rotation |
| `preprocessing.denoise` | Boolean | ❌ Non | false | Réduction bruit |
| `preprocessing.enhance_contrast` | Boolean | ❌ Non | false | Amélioration contraste |
| `preprocessing.binarization` | Boolean | ❌ Non | false | Conversion noir/blanc |
| `options` | Object | ❌ Non | null | Options extraction |
| `options.detect_language` | Boolean | ❌ Non | true | Auto-détection langue |
| `options.extract_tables` | Boolean | ❌ Non | false | Extraction tableaux (Google Vision) |
| `options.confidence_threshold` | Float | ❌ Non | 0.6 | Seuil confidence min |
| `webhook_url` | String | ❌ Non | null | URL callback à complétion |
| `force` | Boolean | ❌ Non | false | Cancel OCR en cours si true |

---

## 5. Réponse Succès

### Cas 1 : Retry Accepté (Job Queued)

**Response contient** :
- `success`: true
- `data.job_id`: "OCR-JOB-2025-xyz789"
- `data.document_id`: "DOC-2025-abc123"
- `data.status`: "queued"
- `data.queue`: "ocr_high_queue"
- `data.priority`: "high"
- `data.engine`: "google_vision"
- `data.estimated_completion`: "2025-11-02T15:07:00Z"
- `data.estimated_duration_seconds`: 300
- `data.retry_count`: 2
- `data.cost_estimate`: Objet avec coûts
  - `currency`: "USD"
  - `amount`: 0.0015
  - `description`: "Google Vision API - 1 page"
- `data.polling`: Objet pour suivi
  - `status_url`: "GET /documents/DOC-2025-abc123/ocr/status"
  - `poll_interval_seconds`: 5
  - `timeout_seconds`: 600
- `data.webhook`: Objet si webhook configuré
  - `url`: "https://app.taxasge.gq/webhooks/ocr/complete"
  - `events`: ["ocr.completed", "ocr.failed"]
- `message`: "OCR job queued successfully. Processing will complete in ~5 minutes."

**Headers** :
- `X-Job-ID`: "OCR-JOB-2025-xyz789"
- `X-Estimated-Completion`: "2025-11-02T15:07:00Z"

### Cas 2 : Poll Status - Processing

**Response contient** (GET /documents/{id}/ocr/status) :
- `success`: true
- `data.job_id`: "OCR-JOB-2025-xyz789"
- `data.status`: "processing"
- `data.progress_percentage`: 45
- `data.current_step`: "Running OCR extraction"
- `data.steps_completed`: ["preprocessing", "ocr_started"]
- `data.steps_remaining`: ["ocr_extraction", "data_extraction", "validation"]
- `data.started_at`: "2025-11-02T15:02:00Z"
- `data.estimated_completion`: "2025-11-02T15:07:00Z"
- `data.time_elapsed_seconds`: 180
- `data.time_remaining_seconds`: 120

### Cas 3 : Poll Status - Completed

**Response contient** :
- `success`: true
- `data.job_id`: "OCR-JOB-2025-xyz789"
- `data.status`: "completed"
- `data.completed_at`: "2025-11-02T15:06:45Z"
- `data.duration_seconds`: 285
- `data.ocr_results`: Objet avec résultats
  - `confidence`: 0.92
  - `engine_used`: "google_vision"
  - `language_detected`: "fra"
  - `pages_processed`: 1
  - `words_extracted`: 847
  - `improvement_vs_previous`: "+0.27" (92% vs 65%)
- `data.extracted_data`: Objet avec champs structurés
  - `document_type`: "payslip"
  - `employee_name`: "Jean Dupont"
  - `gross_salary`: 850000
  - (autres champs extraits)
- `data.comparison`: Objet comparaison avec OCR précédent
  - `previous_confidence`: 0.65
  - `new_confidence`: 0.92
  - `improvement`: true
  - `recommendation`: "New OCR results are significantly better"
- `message`: "OCR completed successfully with 92% confidence"

### Cas 4 : Rollback Completed

**Response contient** :
- `success`: true
- `data.document_id`: "DOC-2025-abc123"
- `data.restored_version`: Objet version restaurée
  - `ocr_id`: "OCR-HIST-001"
  - `confidence`: 0.75
  - `engine`: "tesseract"
  - `created_at`: "2025-10-31T14:35:00Z"
- `data.discarded_version`: Objet version écartée
  - `ocr_id`: "OCR-HIST-002"
  - `confidence`: 0.62
  - `engine`: "google_vision"
  - `created_at`: "2025-11-02T15:06:45Z"
- `message`: "Successfully restored previous OCR results (v1)"

---

## 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | Engine invalide | Invalid OCR engine (use: tesseract, google_vision, azure) | Corriger engine |
| 400 | Priority invalide | Invalid priority (use: normal, high, urgent) | Corriger priority |
| 400 | Language invalide | Unsupported language code | Utiliser ISO 639-2 |
| 402 | Budget insuffisant | Insufficient OCR credits (Google Vision requires $0.0015) | Recharger crédits |
| 403 | Non autorisé | Permission denied | User doit être propriétaire |
| 404 | Document non trouvé | Document not found | Vérifier ID |
| 409 | OCR en cours | OCR already in progress (use force=true to cancel) | Attendre ou force |
| 422 | Type non supporté | Document type not supported for OCR | PDF/images seulement |
| 422 | Trop de retries | Maximum retry limit reached (5) | Contacter support |
| 500 | Erreur moteur | OCR engine unavailable | Réessayer/Changer engine |
| 503 | Service indisponible | OCR service temporarily unavailable | Réessayer plus tard |

---

## 7. Métriques Techniques

### Latence OCR
- **Tesseract** : 10-30 secondes/page
- **Google Vision** : 5-15 secondes/page
- **Azure** : 5-15 secondes/page

**Avec preprocessing** : +5-10 secondes

### Throughput Queue
- **ocr_urgent_queue** : 20 jobs/minute (SLA 2 min)
- **ocr_high_queue** : 60 jobs/minute (SLA 5 min)
- **ocr_normal_queue** : 100 jobs/minute (SLA 15 min)

### Taux Succès Retry
- **1er retry** : 75% succès
- **2ème retry** : 60% succès
- **3ème+ retry** : 40% succès

**Insight** : Si échec après 3 retries → Problème document (pas config)

### Coûts OCR

**Par page** :
- **Tesseract** : Gratuit (self-hosted)
- **Google Vision** : $1.50 / 1000 pages = $0.0015/page
- **Azure** : $1.50 / 1000 pages = $0.0015/page

**Budget mensuel estimé** : ~$50-100 (33,000-66,000 pages)

---

## 8. KPIs Métier

### Taux retry OCR
```
Formule : (Documents avec retry / Total documents OCR) × 100
Actuel : 15-20%
Insight : Si > 30% → Problème qualité documents ou OCR config
```

### Amélioration confidence après retry
```
Formule : AVG(new_confidence - old_confidence) après retry
Actuel : +0.15 (15% amélioration moyenne)
Insight : Retry généralement utile
```

### Distribution moteurs OCR
```
Tesseract : 70% (gratuit, rapide)
Google Vision : 25% (précis, payant)
Azure : 5% (spécialisé)

Insight : Tesseract suffisant pour majorité cas
```

### Taux rollback
```
Formule : (Rollback OCR / Total retries) × 100
Actuel : 5%
Insight : Nouveau OCR rarement pire que précédent
```

### Temps moyen résolution OCR failed
```
Formule : AVG(ocr_completed_at - first_failed_at)
Actuel : 15-30 minutes
Insight : Users retry rapidement après échec
```

---

## 9. Instrumentation

**Métriques Prometheus** :

```python
ocr_retry_requests_total = Counter(
    'ocr_retry_requests_total',
    'Total OCR retry requests',
    ['engine', 'priority', 'has_preprocessing']
)

ocr_retry_duration = Histogram(
    'ocr_retry_duration_seconds',
    'OCR retry processing time',
    ['engine', 'priority'],
    buckets=[5, 10, 20, 30, 60, 120, 300]
)

ocr_retry_success_rate = Gauge(
    'ocr_retry_success_rate',
    'OCR retry success rate by attempt',
    ['retry_attempt']  # 1, 2, 3, 4, 5
)

ocr_confidence_improvement = Histogram(
    'ocr_confidence_improvement',
    'Confidence improvement after retry',
    buckets=[-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.5]
)

ocr_engine_usage = Counter(
    'ocr_engine_usage_total',
    'OCR engine usage distribution',
    ['engine']
)

ocr_preprocessing_applied = Counter(
    'ocr_preprocessing_applied_total',
    'Preprocessing techniques used',
    ['technique']  # deskew, denoise, enhance_contrast
)

ocr_rollback_total = Counter(
    'ocr_rollback_total',
    'OCR rollback requests'
)

ocr_cost_incurred = Counter(
    'ocr_cost_incurred_usd',
    'OCR costs in USD',
    ['engine']
)
```

---

## 10. Sécurité

### RBAC - Permissions Retry

| Rôle | Peut Retry | Engines Disponibles | Max Priority |
|------|------------|---------------------|--------------|
| **Citizen/Business** | ✅ Oui | Tous | high |
| **Agent** | ❌ Non | - | - |
| **Admin** | ✅ Oui | Tous | urgent |

**Contrainte** : User peut retry SEULEMENT ses propres documents

### Rate Limiting OCR
```
User : 10 retries/heure (éviter abus Google Vision)
Admin : 50 retries/heure
```

### Budget Protection

**Prévenir dépassement budget Google Vision** :
```
Avant retry Google Vision :
1. Check user.ocr_credits >= cost
2. Si insuffisant → 402 Payment Required
3. Après OCR → Déduire user.ocr_credits -= cost
4. Alert si credits < 100 pages restantes
```

### Webhook Security

**Validation webhook URL** :
```
1. URL must be HTTPS (pas HTTP)
2. Domain whitelist (app.taxasge.gq, custom domains vérifiés)
3. Signature HMAC dans headers :
   X-Webhook-Signature: HMAC-SHA256(payload, secret)
```

### Anti-Abuse Retry

**Si user fait > 5 retries sur même document en 1h** :
- Flag suspicious activity
- Require CAPTCHA pour prochain retry
- Alert admin si continue

---

## 11. Workflow Récapitulatif

### Workflow Retry OCR (Google Vision)
```
┌─────────────────────────────────────────────┐
│ 1. User Request                             │
│    POST /documents/{id}/ocr/retry           │
│    Body: { engine: "google_vision" }        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 2. Auth + RBAC Check                        │
│    - Verify JWT token                       │
│    - Check document ownership               │
│    - Verify user can use Google Vision      │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 3. Fetch Document                           │
│    SELECT * FROM uploaded_files             │
│    WHERE id = {document_id}                 │
│    → Document found                         │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 4. Business Validations                     │
│    a) Document type supported?              │
│       → mime_type = 'application/pdf' ✅     │
│                                             │
│    b) OCR already processing?               │
│       → ocr_status = 'completed' ✅          │
│                                             │
│    c) Retry limit reached?                  │
│       → ocr_retry_count = 1 ✅ (< 5)         │
│                                             │
│    d) OCR budget available?                 │
│       → user.ocr_credits >= $0.0015 ✅       │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 5. Archive Previous OCR Results             │
│    INSERT INTO ocr_history (                │
│      document_id,                           │
│      ocr_results_json,                      │
│      ocr_confidence: 0.65,                  │
│      engine_used: "tesseract",              │
│      archived_at: NOW()                     │
│    )                                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 6. Create OCR Job                           │
│    job_id = generate_uuid()                 │
│    INSERT INTO ocr_jobs (                   │
│      job_id: "OCR-JOB-2025-xyz789",         │
│      document_id,                           │
│      engine: "google_vision",               │
│      priority: "high",                      │
│      status: "queued",                      │
│      created_at: NOW()                      │
│    )                                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 7. Update Document Status                   │
│    UPDATE uploaded_files SET                │
│      ocr_status = 'processing',             │
│      ocr_retry_count = 2,                   │
│      last_ocr_attempt = NOW()               │
│    WHERE id = {document_id}                 │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 8. Enqueue Celery Task                      │
│    Queue: ocr_high_queue                    │
│    Task: process_ocr_job(job_id)            │
│    ETA: ~5 minutes                          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 9. Return 202 Accepted                      │
│    {                                        │
│      job_id: "OCR-JOB-2025-xyz789",         │
│      status: "queued",                      │
│      estimated_completion: "15:07:00Z"      │
│    }                                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 10. Celery Worker Processes (Async)         │
│                                             │
│     a) Fetch document from Firebase         │
│        → download_url                       │
│                                             │
│     b) Apply preprocessing (if requested)   │
│        → Skip (not requested)               │
│                                             │
│     c) Execute Google Vision API            │
│        vision_client.document_text_detection│
│        → Returns OCR text + confidence      │
│                                             │
│     d) Parse OCR results                    │
│        raw_text: "..."                      │
│        confidence: 0.92                     │
│        language: "fra"                      │
│                                             │
│     e) Run extraction pipeline              │
│        extract_structured_data(raw_text)    │
│        → employee_name: "Jean Dupont"       │
│        → gross_salary: 850000               │
│        → ...                                │
│                                             │
│     f) Save results to DB                   │
│        UPDATE ocr_extraction_results        │
│        SET extraction_results = {...},      │
│            ocr_confidence = 0.92            │
│                                             │
│     g) Update document status               │
│        UPDATE uploaded_files                │
│        SET ocr_status = 'completed'         │
│                                             │
│     h) Deduct OCR credits                   │
│        UPDATE users                         │
│        SET ocr_credits -= 0.0015            │
│                                             │
│     i) Send webhook notification            │
│        POST https://app.taxasge.gq/webhooks/│
│        Body: {                              │
│          event: "ocr.completed",            │
│          document_id,                       │
│          confidence: 0.92                   │
│        }                                    │
│                                             │
│     j) Send user notification               │
│        Email: "OCR completed (92% confidence)"│
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 11. User Polls Status (Optional)            │
│     GET /documents/{id}/ocr/status          │
│     → Returns: { status: "completed" }      │
└─────────────────────────────────────────────┘
```

### Preprocessing Pipeline (Si Demandé)
```
┌─────────────────────────────────────┐
│ Original Image                      │
│ (PDF page → PNG conversion)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Step 1: Deskew                      │
│ - Detect rotation angle             │
│ - Rotate image to horizontal        │
│ - Correction: ±5° typical           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Step 2: Denoise                     │
│ - Apply median filter               │
│ - Remove salt-and-pepper noise      │
│ - Preserve edges                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Step 3: Enhance Contrast            │
│ - Apply adaptive histogram equal.   │
│ - Improve text visibility           │
│ - Brighten dark areas               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Step 4: Binarization (Optional)     │
│ - Convert to black/white            │
│ - Otsu's thresholding               │
│ - Remove background colors          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Preprocessed Image                  │
│ → Ready for OCR                     │
└─────────────────────────────────────┘
```

---

**FIN UC-DOC-007**

**Taille** : ~650 lignes
**Format** : ✅ Littéral (pas de JSON complet)
**Workflow** : ✅ 2 ASCII diagrams (Retry + Preprocessing)
**Moteurs OCR** : ✅ Tesseract, Google Vision, Azure
**Features** : ✅ Preprocessing, Priority queue, Rollback, Webhook
