# UC-DOC-009 : Download Document - Téléchargement Document

## 1. Métadonnées
- **ID** : UC-DOC-009
- **Endpoint** : `POST /documents/{id}/download`
- **Méthode** : POST
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ✅ IMPLÉMENTÉ (95%)
- **Acteurs** : Citizen, Business, Agent, Admin
- **Dépend de** : UC-DOC-001, UC-DOC-003
- **Technologies** : Firebase Storage, Signed URLs, ImageMagick (conversion)

---

## 2. Description Métier

### Contexte
Un utilisateur a besoin de **télécharger un document** qu'il a précédemment uploadé pour :
- Consulter hors ligne
- Imprimer pour signature physique
- Partager avec tiers (comptable, avocat)
- Sauvegarder localement (backup)
- Joindre à email/autre service

**Cas d'usage** :
1. **Téléchargement simple** : "Télécharger ma déclaration IRPF"
2. **Téléchargement avec watermark** : "Download avec tampon 'COPIE'"
3. **Conversion format** : "Télécharger PDF en JPEG (pour impression)"
4. **Bulk download** : "Télécharger tous mes documents IRPF 2024 (ZIP)"
5. **Download via lien temporaire** : "Générer lien valide 1h pour partage"

### Problème
- Documents stockés dans Firebase Storage (accès protégé)
- Pas d'accès direct public (sécurité)
- Besoin générer URL signée temporaire (signed URL)
- Tracking downloads pour audit
- Prévenir abus (rate limiting)
- Supporter conversions format (PDF → images)

### Objectif
Fournir **téléchargement sécurisé** avec :
- ✅ Génération URL signée temporaire (Firebase)
- ✅ Validation permissions (RBAC)
- ✅ Audit downloads (qui, quand, combien de fois)
- ✅ Watermark optionnel ("COPIE", "CONFIDENTIEL")
- ✅ Conversion format (PDF → PNG/JPEG)
- ✅ Bulk download (ZIP multiple documents)
- ✅ Rate limiting (10 downloads/minute)
- ✅ Expiration URL (1h-24h configurable)

### Workflow Détaillé
```
1. User/Agent demande POST /documents/{id}/download
   Body optionnel : {
     "watermark": "COPIE",
     "format": "pdf",
     "expires_in_seconds": 3600
   }

2. Backend vérifie authentification
   → Token JWT valide ?

3. Backend récupère document
   → SELECT * FROM uploaded_files WHERE id = {document_id}
   → Document existe ?

4. Backend vérifie RBAC permissions :
   ├─ User : document.user_id == current_user.id ?
   ├─ Admin : Toujours autorisé
   └─ Agent : Document lié à déclaration assignée ?
   
   Si permission refusée → 403 Forbidden

5. Backend vérifie contraintes business :
   
   a) Document supprimé ?
      → Si deleted_at NOT NULL :
         → 410 Gone (document deleted)
   
   b) Rate limit download ?
      → Check Redis : "downloads:{user_id}:count"
      → Si > 10 downloads dernière minute :
         → 429 Too Many Requests

6. Backend récupère file path Firebase :
   → firebase_storage_path = document.file_path
   → Ex: "users/user-123/documents/DOC-2025-abc123.pdf"

7. Si watermark demandé :
   
   a) Download file from Firebase
   b) Apply watermark using ImageMagick/PIL :
      - Text: "COPIE" en diagonal
      - Opacity: 30%
      - Font: Arial Bold 72pt
      - Color: Gray
   c) Upload watermarked file to temp location
   d) Update firebase_storage_path → temp path

8. Si conversion format demandée :
   
   a) Download original file
   b) Convert using ImageMagick/pdf2image :
      - PDF → PNG : pdf2image.convert_from_path()
      - PDF → JPEG : convert with quality 85%
   c) Upload converted file to temp location
   d) Update firebase_storage_path → temp path

9. Backend génère signed URL Firebase :
   
   → bucket = storage.bucket()
   → blob = bucket.blob(firebase_storage_path)
   → signed_url = blob.generate_signed_url(
       version='v4',
       expiration=datetime.now() + timedelta(seconds=3600),
       method='GET'
     )
   
   → URL valide 1h (configurable)
   → Aucune auth requise pour accéder URL

10. Backend enregistre audit :
    
    → INSERT INTO download_audit (
        document_id,
        user_id,
        downloaded_at: NOW(),
        download_type: 'direct' | 'watermarked' | 'converted',
        expires_at: NOW() + 1 hour,
        ip_address,
        user_agent
      )

11. Backend incrémente compteur Redis :
    
    → INCR "downloads:{user_id}:count"
    → EXPIRE 60 seconds

12. Backend update document stats :
    
    → UPDATE uploaded_files SET
        download_count = download_count + 1,
        last_downloaded_at = NOW()
      WHERE id = {document_id}

13. Return response avec signed URL

14. User suit lien → Download direct depuis Firebase
    (Pas de passage par backend)
```

### Cas Spéciaux

#### Cas 1 : Bulk Download (ZIP Multiple Documents)
```
Endpoint : POST /documents/download/bulk
Body : { document_ids: ["DOC-001", "DOC-002", "DOC-003"] }

Workflow :
1. Vérifier permissions pour TOUS documents
2. Fetch all files from Firebase
3. Créer archive ZIP en mémoire (ou temp file)
4. Upload ZIP to temp Firebase location
5. Generate signed URL pour ZIP
6. Return URL (ZIP auto-cleanup après 1h)
```

#### Cas 2 : Download Expiré (URL Périmée)
```
Si user clique signed URL après expiration :

Firebase retourne : 403 Forbidden
Message : "The signed URL has expired"

Solution :
- Redemander génération nouvelle URL
- POST /documents/{id}/download (nouvelle signed URL)
```

#### Cas 3 : Conversion PDF Multi-Pages
```
Si PDF 10 pages ET format="jpeg" demandé :

Options :
A) Convertir seulement page 1 (défaut)
B) Convertir toutes pages → ZIP avec 10 JPEG
C) Return erreur : "Multi-page PDF conversion requires bulk download"

Paramètre : "pages": "all" | "first" | "1-3"
```

---

## 3. Given/When/Then

### Scénario 1 : Download Simple (PDF Original)

```gherkin
Given un utilisateur authentifié (user_id = "user-123")
  And un document uploadé par cet utilisateur (DOC-2025-abc123.pdf)
  And le document N'EST PAS supprimé
  And user n'a pas atteint rate limit

When l'utilisateur demande :
  POST /documents/DOC-2025-abc123/download

Then le système :
  - Vérifie permissions ✅
  - Génère signed URL Firebase (expiration 1h)
  - Enregistre audit download
  - Incrémente download_count
  - Retourne 200 OK avec :
    * download_url : "https://storage.googleapis.com/taxasge-docs/..."
    * expires_at : "2025-11-02T16:30:00Z"
    * filename : "declaration_irpf_2024.pdf"
    * file_size : 3670016
    * valid_for_seconds : 3600
```

### Scénario 2 : Download avec Watermark

```gherkin
Given un document PDF existant
  And user veut télécharger copie watermarkée

When l'utilisateur demande :
  POST /documents/{id}/download
  Body: { "watermark": "COPIE - NE PAS UTILISER" }

Then le système :
  - Download original PDF from Firebase
  - Apply watermark text diagonal :
    * Text : "COPIE - NE PAS UTILISER"
    * Position : Center diagonal
    * Opacity : 30%
    * Color : Gray
  - Upload watermarked PDF to temp location
  - Generate signed URL for watermarked file
  - Retourne URL watermarked PDF (expires 1h)
  - Original document reste inchangé
```

### Scénario 3 : Conversion PDF → JPEG

```gherkin
Given un document PDF 1 page
  And user veut télécharger en JPEG (pour impression)

When l'utilisateur demande :
  POST /documents/{id}/download
  Body: { "format": "jpeg", "quality": 90 }

Then le système :
  - Download PDF from Firebase
  - Convert PDF page 1 to JPEG (quality 90%)
  - Upload JPEG to temp location
  - Generate signed URL for JPEG
  - Retourne :
    * download_url : URL vers JPEG
    * filename : "declaration_irpf_2024.jpg"
    * original_format : "pdf"
    * converted_format : "jpeg"
```

### Scénario 4 : Bulk Download (ZIP)

```gherkin
Given un utilisateur avec 5 documents IRPF 2024
  And user veut télécharger tous en 1 ZIP

When l'utilisateur demande :
  POST /documents/download/bulk
  Body: {
    "document_ids": ["DOC-001", "DOC-002", "DOC-003", "DOC-004", "DOC-005"],
    "archive_name": "IRPF_2024_documents.zip"
  }

Then le système :
  - Vérifie permissions pour les 5 documents ✅
  - Fetch 5 files from Firebase
  - Créer ZIP archive avec :
    * DOC-001 → declaration_irpf_2024.pdf
    * DOC-002 → fiche_paie_janvier.pdf
    * DOC-003 → fiche_paie_fevrier.pdf
    * ...
  - Upload ZIP to temp Firebase location
  - Generate signed URL (expires 2h car + gros)
  - Retourne :
    * download_url : URL vers ZIP
    * archive_name : "IRPF_2024_documents.zip"
    * total_size : 18500000 (18.5 MB)
    * documents_count : 5
```

### Scénario 5 : Rate Limit Dépassé

```gherkin
Given un utilisateur ayant téléchargé 10 documents en 1 minute
  And rate limit = 10 downloads/minute

When l'utilisateur tente 11ème download

Then le système retourne 429 Too Many Requests :
  - message : "Download rate limit exceeded"
  - retry_after : 45 (secondes restantes)
  - limit : 10
  - current_count : 10
  - suggestion : "Please wait 45 seconds before downloading again"
```

---

## 4. Requête HTTP

### Download Simple
```http
POST /api/v1/documents/DOC-2025-abc123/download HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{}
```

### Download avec Options
```http
POST /api/v1/documents/DOC-2025-abc123/download HTTP/1.1
Content-Type: application/json

{
  "watermark": "COPIE",
  "format": "pdf",
  "expires_in_seconds": 7200,
  "options": {
    "disposition": "attachment",
    "filename": "ma_declaration_2024.pdf"
  }
}
```

### Bulk Download
```http
POST /api/v1/documents/download/bulk HTTP/1.1
Content-Type: application/json

{
  "document_ids": ["DOC-001", "DOC-002", "DOC-003"],
  "archive_name": "mes_documents.zip",
  "watermark": "CONFIDENTIEL"
}
```

### Body Parameters

| Paramètre | Type | Obligatoire | Défaut | Description |
|-----------|------|-------------|---------|-------------|
| `watermark` | String | ❌ Non | null | Texte watermark (max 50 chars) |
| `format` | Enum | ❌ Non | original | original, pdf, jpeg, png |
| `quality` | Integer | ❌ Non | 85 | Quality JPEG/PNG (1-100) |
| `expires_in_seconds` | Integer | ❌ Non | 3600 | Expiration URL (300-86400) |
| `pages` | String | ❌ Non | first | first, all, 1-3 (range) |
| `options` | Object | ❌ Non | null | Options avancées |
| `options.disposition` | Enum | ❌ Non | attachment | attachment, inline |
| `options.filename` | String | ❌ Non | original | Nom fichier téléchargé |

### Bulk Download Parameters

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `document_ids` | String[] | ✅ Oui | IDs documents (max 50) |
| `archive_name` | String | ❌ Non | Nom ZIP (défaut: "documents.zip") |
| `watermark` | String | ❌ Non | Watermark appliqué à tous |
| `format` | Enum | ❌ Non | Conversion tous documents |

---

## 5. Réponse Succès

### Cas 1 : Download Simple Réussi

**Response contient** :
- `success`: true
- `data.download_url`: "https://storage.googleapis.com/taxasge-docs/users/user-123/documents/DOC-2025-abc123.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=...&X-Goog-Expires=3600&X-Goog-Signature=..."
- `data.expires_at`: "2025-11-02T16:30:00Z"
- `data.valid_for_seconds`: 3600
- `data.document_info`:
  - `document_id`: "DOC-2025-abc123"
  - `filename`: "declaration_irpf_2024.pdf"
  - `file_size`: 3670016
  - `file_size_formatted`: "3.5 MB"
  - `mime_type`: "application/pdf"
  - `download_count`: 5 (total downloads ce document)
- `data.download_type`: "direct"
- `message`: "Download URL generated successfully. Valid for 1 hour."

**Headers** :
- `X-Download-Expires`: "2025-11-02T16:30:00Z"
- `X-RateLimit-Remaining`: "9" (downloads restants cette minute)

### Cas 2 : Download avec Watermark

**Response contient** :
- `success`: true
- `data.download_url`: "https://storage.googleapis.com/.../temp/watermarked-DOC-2025-abc123.pdf?..."
- `data.expires_at`: "2025-11-02T16:30:00Z"
- `data.document_info`:
  - `filename`: "declaration_irpf_2024_COPIE.pdf"
  - (autres métadonnées)
- `data.download_type`: "watermarked"
- `data.watermark_applied`:
  - `text`: "COPIE"
  - `position`: "center_diagonal"
  - `opacity`: 0.3
- `data.processing_time_ms`: 850
- `message`: "Watermarked document ready for download"
- `warning`: "⚠️ Original document not modified. Watermark applied to copy only."

### Cas 3 : Conversion Format

**Response contient** :
- `success`: true
- `data.download_url`: "https://storage.googleapis.com/.../temp/converted-DOC-2025-abc123.jpg?..."
- `data.document_info`:
  - `filename`: "declaration_irpf_2024.jpg"
  - `file_size`: 1258000
  - `original_format`: "pdf"
  - `converted_format`: "jpeg"
  - `quality`: 90
  - `pages_converted`: 1
- `data.download_type`: "converted"
- `data.processing_time_ms`: 1250
- `message`: "Document converted to JPEG successfully"

### Cas 4 : Bulk Download (ZIP)

**Response contient** :
- `success`: true
- `data.download_url`: "https://storage.googleapis.com/.../temp/archive-2025-11-02-abc.zip?..."
- `data.archive_info`:
  - `archive_name`: "IRPF_2024_documents.zip"
  - `total_size`: 18500000
  - `total_size_formatted`: "18.5 MB"
  - `documents_count`: 5
  - `compression_ratio`: 0.15 (85% compression)
- `data.documents_included`: Array de documents
  - `document_id`: "DOC-001"
  - `filename`: "declaration_irpf_2024.pdf"
  - `size`: 3670016
- `data.expires_at`: "2025-11-02T18:30:00Z" (2h car plus gros)
- `data.processing_time_ms`: 3500
- `message`: "Archive created with 5 documents"

---

## 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | document_ids vide | document_ids cannot be empty | Fournir IDs |
| 400 | Trop de documents | Maximum 50 documents per bulk download | Réduire nombre |
| 400 | expires_in invalide | expires_in_seconds must be between 300 and 86400 | Ajuster valeur |
| 400 | Format invalide | Invalid format (use: pdf, jpeg, png) | Corriger format |
| 401 | Non authentifié | Authorization required | Se connecter |
| 403 | Pas propriétaire | Permission denied: not document owner | Vérifier ownership |
| 404 | Document non trouvé | Document not found | Vérifier ID |
| 410 | Document supprimé | Document has been deleted | Restaurer si possible |
| 413 | ZIP trop gros | Bulk download size exceeds 100MB limit | Réduire nombre docs |
| 422 | Multi-page PDF | Cannot convert multi-page PDF to single image | Utiliser pages="all" |
| 429 | Rate limit | Download rate limit exceeded (10/min) | Attendre retry_after |
| 500 | Erreur conversion | Document conversion failed | Réessayer sans conversion |
| 503 | Firebase down | Storage service temporarily unavailable | Réessayer plus tard |

---

## 7. Métriques Techniques

### Latence Génération URL
- **Simple signed URL** : < 50ms
- **Avec watermark** : 500-1500ms (selon taille PDF)
- **Avec conversion** : 800-2000ms
- **Bulk download** : 2-10 secondes (selon nombre docs)

### Throughput
- **Pics** : ~50-100 downloads/minute
- **Moyenne** : ~20-30 downloads/minute

### Taux Succès
- **Cible** : > 99%
- **Échecs courants** : Firebase timeout ~0.5%

### Distribution Downloads

**Par type** :
- Simple (original) : 85%
- Avec watermark : 10%
- Avec conversion : 3%
- Bulk download : 2%

### Expiration Signed URLs

**Utilisation** :
- < 5 min : 70% (download immédiat)
- 5-30 min : 20%
- 30-60 min : 8%
- > 1h : 2% (URL expirée)

**Insight** : La plupart users téléchargent immédiatement

---

## 8. KPIs Métier

### Taux téléchargement documents
```
Formule : (Documents téléchargés / Total documents uploadés) × 100
Actuel : 45-50%
Insight : 50% documents sont téléchargés au moins 1 fois
```

### Downloads moyens par document
```
Formule : AVG(download_count) par document
Actuel : 2.5 downloads/document
Insight : Documents téléchargés plusieurs fois (backup, partage)
```

### Délai moyen upload → premier download
```
Formule : AVG(first_download_at - uploaded_at)
Actuel : 5-10 minutes
Insight : Users téléchargent rapidement après upload (vérification)
```

### Taux utilisation bulk download
```
Formule : (Bulk downloads / Total downloads) × 100
Actuel : 2%
Insight : Feature peu utilisée, peut être améliorée UX
```

### Taux URL expirées
```
Formule : (Tentatives accès URL expirée / Total URLs générées) × 100
Actuel : 5%
Insight : 5% users cliquent lien après 1h
```

---

## 9. Instrumentation

**Métriques Prometheus** :

```python
document_downloads_total = Counter(
    'document_downloads_total',
    'Total document downloads',
    ['download_type', 'user_role']  # direct, watermarked, converted, bulk
)

document_download_duration = Histogram(
    'document_download_duration_seconds',
    'Download URL generation duration',
    ['download_type'],
    buckets=[0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

signed_url_generated = Counter(
    'signed_url_generated_total',
    'Signed URLs generated',
    ['expiration_hours']  # 1h, 2h, 24h
)

watermark_applied = Counter(
    'watermark_applied_total',
    'Watermarks applied to documents'
)

document_conversions = Counter(
    'document_conversions_total',
    'Document format conversions',
    ['from_format', 'to_format']  # pdf→jpeg, pdf→png
)

bulk_download_size = Histogram(
    'bulk_download_size_bytes',
    'Bulk download archive size',
    buckets=[1e6, 5e6, 10e6, 50e6, 100e6]  # 1MB, 5MB, 10MB, 50MB, 100MB
)

download_rate_limit_hits = Counter(
    'download_rate_limit_hits_total',
    'Rate limit hits for downloads'
)

expired_url_access_attempts = Counter(
    'expired_url_access_attempts_total',
    'Attempts to access expired URLs'
)
```

---

## 10. Sécurité

### RBAC - Permissions Download

| Rôle | Peut Download | Restrictions |
|------|---------------|--------------|
| **Citizen/Business** | ✅ Oui | Seulement ses documents |
| **Agent** | ✅ Oui | Documents déclarations assignées |
| **Admin** | ✅ Oui | Tous documents |

### Signed URL Security

**Firebase Signed URL** :
- Signature cryptographique (HMAC)
- Expiration temporelle stricte
- Pas de révocation possible (attendre expiration)
- URL unique par génération

**Protection** :
- URL non réutilisable après expiration
- Aucune auth requise (URL = preuve accès)
- HTTPS obligatoire

### Rate Limiting

**Limites** :
```
User : 10 downloads/minute
Agent : 30 downloads/minute
Admin : 50 downloads/minute

Bulk download : 5 requêtes/heure (éviter abus)
```

**Implémentation Redis** :
```
Key : "downloads:{user_id}:count"
TTL : 60 seconds
Increment : +1 par download
Check : < limit avant autoriser
```

### Audit Logging

**Tracking obligatoire** :
```
Pour chaque download :
- document_id
- user_id
- downloaded_at
- download_type
- ip_address
- user_agent
- expires_at (signed URL)
- file_accessed (true si URL utilisée)
```

**Analyse pattern suspect** :
- > 50 downloads/jour même user → Alert
- Download documents non liés → Suspicious
- Accès depuis IPs multiples → Potential leak

### Watermark Integrity

**Protection watermark** :
- Watermark appliqué APRÈS génération signed URL
- Original document jamais modifié
- Watermark non removable facilement
- Metadata embed (source, date, user)

### Conversion Security

**Validation format** :
- Whitelist formats : pdf, jpeg, png
- Sanitize output (éviter code injection)
- Limite taille conversion : 20 MB max
- Timeout conversion : 30 secondes max

---

## 11. Workflow Récapitulatif

### Workflow Download Simple
```
┌────────────────────────────────────────────┐
│ 1. User Request                            │
│    POST /documents/{id}/download           │
│    Body: {}                                │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 2. Auth + RBAC Check                       │
│    - Verify JWT token                      │
│    - Check document.user_id == current_user│
│    - Permission granted ✅                  │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 3. Fetch Document                          │
│    SELECT * FROM uploaded_files            │
│    WHERE id = 'DOC-2025-abc123'            │
│    → Document found                        │
│    → deleted_at IS NULL ✅                  │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 4. Check Rate Limit                        │
│    Redis GET "downloads:user-123:count"    │
│    → Current: 5 downloads                  │
│    → Limit: 10 downloads/min ✅             │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 5. Get Firebase Storage Path               │
│    firebase_path = document.file_path      │
│    = "users/user-123/documents/DOC-abc.pdf"│
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 6. Generate Firebase Signed URL            │
│    bucket = storage.bucket()               │
│    blob = bucket.blob(firebase_path)       │
│    signed_url = blob.generate_signed_url(  │
│      expiration=NOW() + 3600 seconds       │
│    )                                       │
│    → URL valid 1 hour                      │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 7. Audit Logging                           │
│    INSERT INTO download_audit (            │
│      document_id: 'DOC-2025-abc123',       │
│      user_id: 'user-123',                  │
│      downloaded_at: NOW(),                 │
│      download_type: 'direct',              │
│      expires_at: NOW() + 3600s,            │
│      ip_address: request.ip                │
│    )                                       │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 8. Update Document Stats                   │
│    UPDATE uploaded_files SET               │
│      download_count = download_count + 1,  │
│      last_downloaded_at = NOW()            │
│    WHERE id = 'DOC-2025-abc123'            │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 9. Increment Rate Limit Counter            │
│    Redis INCR "downloads:user-123:count"   │
│    → New count: 6                          │
│    Redis EXPIRE 60 seconds                 │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 10. Metrics                                │
│     - Increment document_downloads_total   │
│     - Observe document_download_duration   │
│     - Increment signed_url_generated       │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 11. Return Response                        │
│     200 OK                                 │
│     {                                      │
│       download_url: "https://storage...",  │
│       expires_at: "2025-11-02T16:30:00Z"   │
│     }                                      │
└────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 12. User Clicks URL                        │
│     → Browser redirects to Firebase        │
│     → Firebase validates signature         │
│     → Firebase checks expiration           │
│     → Firebase serves file directly        │
│     → Download starts (no backend involved)│
└────────────────────────────────────────────┘
```

### Workflow Download avec Watermark
```
┌────────────────────────────────────────────┐
│ 1-5. Same as Simple Download               │
│     (Auth, Fetch, Rate Limit, Get Path)    │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 6. Download Original from Firebase         │
│    blob.download_to_filename('/tmp/doc.pdf')│
│    → File downloaded to temp                │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 7. Apply Watermark                         │
│    Using PyPDF2 + ReportLab:               │
│                                            │
│    a) Create watermark PDF with text       │
│       - Text: "COPIE"                      │
│       - Position: Center diagonal          │
│       - Rotation: 45°                      │
│       - Opacity: 30%                       │
│       - Font: Arial Bold 72pt              │
│       - Color: RGB(128, 128, 128)          │
│                                            │
│    b) Merge watermark with each page       │
│       FOR each page in PDF:                │
│         page.merge_page(watermark_page)    │
│                                            │
│    c) Save watermarked PDF                 │
│       output.write('/tmp/watermarked.pdf') │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 8. Upload Watermarked to Temp Firebase     │
│    temp_path = "temp/watermarked-{uuid}.pdf"│
│    bucket.blob(temp_path).upload_from_file()│
│    → Watermarked file in Firebase          │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 9. Generate Signed URL (Temp Path)         │
│    signed_url = blob.generate_signed_url(  │
│      path=temp_path,                       │
│      expiration=NOW() + 3600s              │
│    )                                       │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 10. Schedule Temp File Cleanup             │
│     Celery task : delete_temp_file.delay(  │
│       path=temp_path,                      │
│       eta=NOW() + 3600s                    │
│     )                                      │
│     → File auto-deleted after 1h           │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 11. Return Response                        │
│     {                                      │
│       download_url: URL to watermarked,    │
│       download_type: "watermarked",        │
│       warning: "Original not modified"     │
│     }                                      │
└────────────────────────────────────────────┘
```

### Workflow Bulk Download (ZIP)
```
┌────────────────────────────────────────────┐
│ 1. Request                                 │
│    POST /documents/download/bulk           │
│    Body: {                                 │
│      document_ids: ["DOC-1", "DOC-2", ...]│
│    }                                       │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 2. Validate Request                        │
│    - document_ids.length <= 50 ✅           │
│    - All IDs valid format ✅                │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 3. Check Permissions ALL Documents         │
│    FOR EACH document_id:                   │
│      - Fetch document                      │
│      - Check user ownership                │
│      - If ANY permission denied → 403      │
│    → All permissions OK ✅                  │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 4. Download All Files from Firebase        │
│    files = []                              │
│    FOR EACH document_id:                   │
│      file = blob.download_as_bytes()       │
│      files.append((filename, file_bytes))  │
│    → 5 files downloaded                    │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 5. Create ZIP Archive                      │
│    import zipfile                          │
│    zip_buffer = BytesIO()                  │
│    with zipfile.ZipFile(zip_buffer, 'w',   │
│                         ZIP_DEFLATED) as z:│
│      FOR (filename, file_bytes) in files:  │
│        z.writestr(filename, file_bytes)    │
│                                            │
│    → ZIP created in memory                 │
│    → Size: 18.5 MB                         │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 6. Upload ZIP to Temp Firebase             │
│    temp_path = "temp/archive-{uuid}.zip"   │
│    bucket.blob(temp_path).upload_from_file(│
│      zip_buffer                            │
│    )                                       │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 7. Generate Signed URL                     │
│    signed_url = blob.generate_signed_url(  │
│      expiration=NOW() + 7200s (2h)         │
│    )                                       │
│    → Longer expiration (ZIP plus gros)     │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 8. Schedule Cleanup                        │
│    delete_temp_file.delay(eta=NOW() + 2h)  │
└─────────────┬──────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────┐
│ 9. Return Response                         │
│    {                                       │
│      download_url: URL to ZIP,             │
│      archive_name: "documents.zip",        │
│      total_size: 18500000,                 │
│      documents_count: 5,                   │
│      expires_at: NOW() + 2h                │
│    }                                       │
└────────────────────────────────────────────┘
```

---

**FIN UC-DOC-009**

**Taille** : ~650 lignes
**Format** : ✅ Littéral (pas de JSON complet)
**Workflow** : ✅ 3 ASCII diagrams (Simple, Watermark, Bulk)
**Features** : ✅ Signed URLs, Watermark, Conversion, Bulk ZIP, Rate Limiting
