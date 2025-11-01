# UC-DOC-003 : Get Document - Récupérer Document Complet avec Métadonnées

## 1. Métadonnées
- **ID** : UC-DOC-003
- **Endpoint** : `GET /documents/{id}`
- **Méthode** : GET
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ✅ IMPLÉMENTÉ (85%)
- **Acteurs** : Citizen, Business, Agent
- **Dépend de** : UC-DOC-001 (document doit être uploadé)

---

## 2. Description Métier

### Contexte
Un utilisateur (ou agent) a besoin de récupérer **toutes les informations** d'un document déjà uploadé :
- Métadonnées de base (filename, size, type, etc.)
- Résultats OCR complets (raw_text + confidence)
- Données extraites structurées (extracted_data)
- Mapping formulaire (form_mapping) si applicable
- Statut validation (validated/pending/rejected)
- Historique (uploaded_at, processed_at, validated_at)

**Cas d'usage** :
1. **Frontend** : Afficher détails document dans UI
2. **Agent** : Vérifier document avant validation
3. **User** : Consulter document uploadé précédemment
4. **Système** : Récupérer form_mapping pour pré-remplir formulaire

### Problème
- Nécessité d'accéder aux données complètes d'un document
- Inclure les résultats OCR et mapping (pas juste metadata)
- Vérifier permissions (RBAC : user propriétaire OU agent assigné)

### Objectif
Retourner **toutes les informations disponibles** sur un document :
- ✅ Métadonnées upload (uploaded_files table)
- ✅ Résultats OCR (ocr_extraction_results table)
- ✅ Mapping formulaire (si enable_form_mapping = true)
- ✅ Annotations/validations (si existent)
- ✅ Historique versions (si document modifié)

### Workflow Détaillé
```
1. User/Agent demande GET /documents/{document_id}

2. Backend vérifie authentification
   → Token JWT valide ?

3. Backend récupère document depuis uploaded_files
   → SELECT * FROM uploaded_files WHERE id = {document_id}
   
4. Backend vérifie RBAC permissions :
   ├─ Si User : document.user_id == current_user.id ?
   ├─ Si Agent : declaration assignée à cet agent ?
   └─ Si Admin : OK (full access)
   
   Si permission refusée → 403 Forbidden

5. Backend récupère résultats OCR
   → SELECT * FROM ocr_extraction_results 
      WHERE uploaded_file_id = {document_id}
   
6. Si OCR complété :
   ├─ Ajouter extracted_data (structured fields)
   ├─ Ajouter raw_text (texte brut OCR)
   ├─ Ajouter confidence_score
   └─ Ajouter form_mapping (si disponible)

7. Backend récupère annotations (si existent)
   → SELECT * FROM document_annotations 
      WHERE document_id = {document_id}

8. Backend récupère validations (si existent)
   → SELECT * FROM document_validations 
      WHERE document_id = {document_id}

9. Backend agrège toutes les données :
   {
     metadata: {...},           // uploaded_files
     ocr_results: {...},         // ocr_extraction_results
     form_mapping: {...},        // si applicable
     annotations: [...],         // si existent
     validation: {...},          // si existe
     history: {...}              // versions si multiple uploads
   }

10. Return response JSON complète

11. Metrics :
    - Incrémenter document_views_total
    - Observer document_retrieval_duration
```

### Cas Spéciaux

#### Cas 1 : Document OCR en cours
```
Si document.ocr_status = "processing" :
  → Retourner metadata + status "processing"
  → ocr_results = null
  → form_mapping = null
  → estimated_completion_time fourni
```

#### Cas 2 : Document OCR échoué
```
Si document.ocr_status = "failed" :
  → Retourner metadata + error details
  → ocr_results.error_message
  → Suggestion : retry OCR (UC-DOC-007)
```

#### Cas 3 : Document avec versions multiples
```
Si document a été re-uploadé :
  → Retourner version actuelle (latest)
  → Inclure history: [version_1, version_2, ...]
  → Lien vers UC-DOC-012 (historique complet)
```

---

## 3. Given/When/Then

### Scénario 1 : Récupération Document IRPF Complet

```gherkin
Given un utilisateur authentifié (user_id = "user-123")
  And un document uploadé avec ID = "DOC-2025-abc123"
  And le document appartient à cet utilisateur
  And l'OCR est complété avec succès (confidence = 0.94)
  And le document est de type "declaration_irpf"
  And le form_mapping est généré

When l'utilisateur demande GET /documents/DOC-2025-abc123

Then le système retourne 200 OK
  And la réponse contient :
    - metadata (filename, size, mime_type, storage_url, etc.)
    - ocr_results (raw_text, confidence_score = 0.94)
    - extracted_data structuré (revenus_salaires, deductions, etc.)
    - form_mapping (target_form = "FormIRPF", pre_filled_fields)
    - validation_status = "pending"
    - related_to (type = "tax_declaration", id = "DECL-2025-001234")
```

### Scénario 2 : Document OCR en Cours

```gherkin
Given un document uploadé il y a 2 secondes
  And l'OCR est toujours en traitement (status = "processing")

When l'utilisateur demande GET /documents/{id}

Then le système retourne 200 OK
  And ocr_status = "processing"
  And ocr_results = null
  And estimated_completion_time = "2025-10-31T15:30:05Z"
  And message = "OCR processing in progress"
```

### Scénario 3 : Agent Accède à Document User

```gherkin
Given un agent authentifié (agent_id = "agent-456")
  And un document uploadé par un citoyen (user_id = "user-123")
  And le document est lié à une déclaration assignée à cet agent

When l'agent demande GET /documents/{id}

Then le système retourne 200 OK
  And l'agent voit toutes les données du document
  And can_validate = true (car agent assigné)
```

### Scénario 4 : User Tente d'Accéder Document d'Autrui

```gherkin
Given un utilisateur "user-123"
  And un document uploadé par "user-999" (autre utilisateur)
  And l'utilisateur n'est PAS agent assigné

When "user-123" demande GET /documents/{id}

Then le système retourne 403 Forbidden
  And message = "You don't have permission to access this document"
```

---

## 4. Requête HTTP

```http
GET /api/v1/documents/DOC-2025-abc123xyz HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters (optionnels)

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `include_ocr_raw_text` | Boolean | Inclure texte OCR brut complet (peut être volumineux) | `false` |
| `include_form_mapping` | Boolean | Inclure form_mapping détaillé | `true` |
| `include_annotations` | Boolean | Inclure annotations agent | `true` |
| `include_history` | Boolean | Inclure historique versions | `false` |

**Exemples** :
```http
GET /api/v1/documents/DOC-2025-abc123?include_ocr_raw_text=true
GET /api/v1/documents/DOC-2025-abc123?include_history=true
```

---

## 5. Réponse Succès

### Cas 1 : Document IRPF avec OCR Complété

```json
{
  "success": true,
  "data": {
    "document_id": "DOC-2025-abc123xyz",
    "batch_id": "BATCH-2025-10-31-xyz123",
    
    "metadata": {
      "filename": "declaration_irpf_2024.pdf",
      "original_filename": "Déclaration IRPF Jean Dupont 2024.pdf",
      "document_type": "declaration_irpf",
      "file_size": 3670016,
      "mime_type": "application/pdf",
      "storage_url": "https://firebasestorage.googleapis.com/.../DOC-2025-abc123xyz.pdf",
      "storage_provider": "firebase",
      "uploaded_at": "2025-10-31T14:30:00Z",
      "uploaded_by": {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "Jean Dupont",
        "user_type": "citizen"
      }
    },
    
    "ocr_results": {
      "status": "completed",
      "engine": "tesseract",
      "fallback_used": false,
      "confidence_score": 0.94,
      "processing_time_ms": 2450,
      "language_detected": "spa+fra",
      "pages_count": 2,
      "completed_at": "2025-10-31T14:30:03Z",
      
      "extracted_data": {
        "document_classification": {
          "identified_type": "declaration_irpf",
          "confidence": 0.96,
          "alternative_types": [
            {"type": "declaration_iva", "confidence": 0.15}
          ]
        },
        
        "structured_fields": {
          "nombre_contribuyente": "Jean Dupont",
          "nif": "NIF-123456789",
          "ejercicio_fiscal": 2024,
          "revenus_salaires": 850000,
          "revenus_activites_professionnelles": 0,
          "revenus_capitaux_mobiliers": 15000,
          "total_revenus_bruts": 865000,
          "deductions_charges_famille": 50000,
          "deductions_cotisations_sociales": 85000,
          "total_deductions": 135000,
          "base_liquidable": 730000,
          "tipo_gravamen": 35,
          "calculated_amount": 255500,
          "retenues_a_la_source": 85000,
          "total_a_ingresar": 170500
        },
        
        "confidence_by_field": {
          "revenus_salaires": 0.98,
          "deductions_charges_famille": 0.87,
          "tipo_gravamen": 0.95,
          "calculated_amount": 0.91
        },
        
        "bounding_boxes": {
          "revenus_salaires": {
            "page": 1,
            "x": 120,
            "y": 340,
            "width": 200,
            "height": 30
          }
        }
      },
      
      "raw_text_preview": "DECLARACIÓN IRPF 2024\nNombre: Jean Dupont\nNIF: 123456789\nRENTA SALARIAL: 850.000 XAF\n...",
      "raw_text_length": 4523,
      "raw_text_available": true
    },
    
    "form_mapping": {
      "enabled": true,
      "target_form": "FormIRPF",
      "target_table": "declaration_irpf_data",
      "form_url": "/declarations/irpf/create?prefill=DOC-2025-abc123xyz",
      
      "pre_filled_fields": {
        "revenus_salaires": 850000,
        "revenus_capitaux_mobiliers": 15000,
        "deductions_charges_famille": 50000,
        "deductions_cotisations_sociales": 85000,
        "tipo_gravamen": 35,
        "base_liquidable": 730000,
        "calculated_amount": 255500
      },
      
      "fields_metadata": {
        "revenus_salaires": {
          "confidence": 0.98,
          "needs_validation": false,
          "ocr_source": "RENTA SALARIAL: 850.000 XAF"
        },
        "deductions_charges_famille": {
          "confidence": 0.87,
          "needs_validation": true,
          "ocr_source": "DEDUCCIONES FAMILIA: 50.000 XAF"
        }
      },
      
      "mapping_quality": {
        "total_fields_expected": 12,
        "successfully_mapped": 11,
        "high_confidence_fields": 9,
        "low_confidence_fields": 2,
        "unmapped_fields": 1,
        "overall_score": 0.92
      }
    },
    
    "validation": {
      "status": "pending",
      "validated_by": null,
      "validated_at": null,
      "validation_notes": null,
      "can_validate": false,
      "requires_agent_review": true
    },
    
    "annotations": [],
    
    "related_to": {
      "type": "tax_declaration",
      "id": "DECL-2025-001234",
      "declaration_number": "DECL-2024-IRPF-001234",
      "status": "draft"
    },
    
    "permissions": {
      "can_view": true,
      "can_edit": false,
      "can_delete": true,
      "can_download": true,
      "can_share": false
    },
    
    "statistics": {
      "view_count": 5,
      "last_viewed_at": "2025-10-31T15:45:00Z",
      "download_count": 1
    }
  }
}
```

### Cas 2 : Document OCR en Cours

```json
{
  "success": true,
  "data": {
    "document_id": "DOC-2025-def456uvw",
    "metadata": {
      "filename": "releve_bancaire_oct.pdf",
      "document_type": "bank_statement",
      "file_size": 2936012,
      "uploaded_at": "2025-10-31T15:44:58Z"
    },
    
    "ocr_results": {
      "status": "processing",
      "engine": "tesseract",
      "started_at": "2025-10-31T15:45:00Z",
      "estimated_completion": "2025-10-31T15:45:08Z",
      "extracted_data": null
    },
    
    "form_mapping": null,
    
    "message": "OCR processing in progress. Please check back in a few seconds."
  }
}
```

### Cas 3 : Document OCR Échoué

```json
{
  "success": true,
  "data": {
    "document_id": "DOC-2025-ghi789rst",
    "metadata": {
      "filename": "document_illegible.pdf"
    },
    
    "ocr_results": {
      "status": "failed",
      "engine": "tesseract",
      "fallback_used": true,
      "fallback_also_failed": true,
      "error_code": "OCR_LOW_QUALITY",
      "error_message": "Document quality too low for OCR processing (confidence < 30%)",
      "failed_at": "2025-10-31T15:45:10Z"
    },
    
    "suggestions": [
      {
        "action": "retry_ocr",
        "label": "Relancer OCR manuellement",
        "endpoint": "POST /documents/{id}/ocr"
      },
      {
        "action": "upload_better_quality",
        "label": "Uploader document meilleure qualité",
        "endpoint": "POST /documents/upload"
      }
    ]
  }
}
```

---

## 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | ID invalide | Invalid document ID format | Vérifier format DOC-YYYY-MM-DD-xxx |
| 401 | Non authentifié | Authorization required | Se connecter |
| 403 | Pas propriétaire | You don't have permission to access this document | Vérifier ownership |
| 403 | Agent non assigné | Document not assigned to your queue | Demander réassignation |
| 404 | Document non trouvé | Document not found | Vérifier ID existe |
| 410 | Document supprimé | Document has been deleted | Consulter corbeille (UC-DOC-012) |
| 500 | Erreur DB | Database error retrieving document | Réessayer |
| 503 | Storage indisponible | Storage service unavailable | Réessayer plus tard |

---

## 7. Métriques Techniques

### Latence
- **P50** : < 100ms (metadata only)
- **P95** : < 300ms (avec OCR results + form_mapping)
- **P99** : < 500ms

**Facteurs influençant latence** :
- Taille extracted_data (IRPF > IVA)
- Nombre annotations
- Query parameters (include_ocr_raw_text augmente temps)

### Throughput
- **Pics** : ~200-300 requêtes/minute (heures ouvrées)
- **Moyenne** : ~50-100 requêtes/minute

### Cache
- **Redis TTL** : 5 minutes (metadata + ocr_results)
- **Hit rate cible** : > 60%

### Taux Succès
- **Cible** : > 99.5%

---

## 8. KPIs Métier

### Taux consultation documents
```
Formule : (Documents consultés / Total documents uploadés) × 100
Cible : > 80%
Insight : Si < 70% → Documents uploadés mais jamais consultés
```

### Temps moyen avant première consultation
```
Formule : AVG(first_viewed_at - uploaded_at)
Cible : < 5 minutes
Insight : Utilisateur vérifie rapidement si OCR OK
```

### Documents jamais consultés
```
Formule : COUNT(documents WHERE view_count = 0 AND uploaded_at < NOW() - 24h)
Alerte : > 10%
Action : Améliorer UX notifications post-upload
```

---

## 9. Instrumentation

```python
from prometheus_client import Counter, Histogram, Gauge

# Counters
document_views_total = Counter(
    'document_views_total',
    'Total document views',
    ['document_type', 'viewer_type']  # viewer_type: owner, agent, admin
)

document_retrieval_cache_hits = Counter(
    'document_retrieval_cache_hits_total',
    'Document retrieval cache hits'
)

# Histograms
document_retrieval_duration = Histogram(
    'document_retrieval_duration_seconds',
    'Document retrieval duration',
    ['include_ocr_raw_text'],
    buckets=[0.05, 0.1, 0.2, 0.3, 0.5, 1.0]
)

document_response_size = Histogram(
    'document_response_size_bytes',
    'Document response payload size',
    ['document_type'],
    buckets=[1_000, 10_000, 50_000, 100_000, 500_000]
)

# Gauges
documents_pending_ocr = Gauge(
    'documents_pending_ocr',
    'Number of documents with OCR status=processing'
)
```

---

## 10. Sécurité

### RBAC - Règles d'Accès

| Rôle | Peut Accéder ? | Conditions |
|------|---------------|------------|
| **Owner (Citizen/Business)** | ✅ Oui | `document.user_id == current_user.id` |
| **Agent** | ✅ Oui | Document lié à déclaration assignée à cet agent |
| **Supervisor** | ✅ Oui | Document lié à déclaration dans son ministère |
| **Admin** | ✅ Oui | Accès complet (audit/support) |
| **Autre User** | ❌ Non | 403 Forbidden |

### Vérification Permissions (Workflow)
```
1. Extraire current_user du token JWT
2. Récupérer document.user_id depuis DB
3. Check permissions :
   
   SI current_user.id == document.user_id :
     → Accès OK (propriétaire)
   
   SINON SI current_user.role == 'agent' :
     → Vérifier si déclaration liée assignée à cet agent
     → SELECT * FROM declarations 
        WHERE id = document.related_to_id 
        AND assigned_to_id = current_user.id
     → Si trouvé : Accès OK
     → Sinon : 403 Forbidden
   
   SINON SI current_user.role == 'admin' :
     → Accès OK (toujours)
   
   SINON :
     → 403 Forbidden
```

### Champs Sensibles

Certains champs ne doivent être visibles que par certains rôles :

| Champ | Citizen | Agent | Admin |
|-------|---------|-------|-------|
| `storage_url` | ✅ Oui | ✅ Oui | ✅ Oui |
| `ocr_results.raw_text` | ✅ Oui | ✅ Oui | ✅ Oui |
| `annotations` (agent comments) | ❌ Non | ✅ Oui | ✅ Oui |
| `validation.rejection_reason` | ⚠️ Partiel | ✅ Complet | ✅ Complet |
| `statistics.view_count` | ❌ Non | ❌ Non | ✅ Oui |

### Rate Limiting
```
Citizen/Business : 100 requêtes/minute
Agent : 200 requêtes/minute
Admin : 500 requêtes/minute
```

### Audit Logging
Toutes les consultations sont loggées :
```
{
  "action": "document_viewed",
  "document_id": "DOC-2025-abc123",
  "viewer_id": "user-123",
  "viewer_role": "agent",
  "viewed_at": "2025-10-31T15:45:00Z",
  "ip_address": "41.223.45.67",
  "include_raw_text": false
}
```

---

## 11. Workflow Récapitulatif

### Workflow Standard (Owner Consulte Son Document)
```
┌─────────────────────────────────────────────────────┐
│ 1. User Request                                     │
│    GET /documents/DOC-2025-abc123                   │
│    Authorization: Bearer token                      │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 2. Auth Verification                                │
│    - Decode JWT → current_user.id                   │
│    - Check token valid & not expired                │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 3. Check Redis Cache                                │
│    key = "document:DOC-2025-abc123"                 │
│    ├─ Cache HIT → Return cached data (99% identique)│
│    └─ Cache MISS → Continue to DB                   │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 4. Fetch Document Metadata                          │
│    SELECT * FROM uploaded_files                     │
│    WHERE id = 'DOC-2025-abc123'                     │
│    → document found                                 │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 5. RBAC Verification                                │
│    document.user_id == current_user.id ?            │
│    ✅ YES → Continue                                 │
│    ❌ NO → Check if agent assigned → 403 if not     │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 6. Fetch OCR Results                                │
│    SELECT * FROM ocr_extraction_results             │
│    WHERE uploaded_file_id = 'DOC-2025-abc123'       │
│    → ocr_results found (status = completed)         │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 7. Fetch Form Mapping (if applicable)               │
│    From ocr_results.extracted_data                  │
│    → form_mapping exists (target_form = FormIRPF)   │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 8. Fetch Annotations (if exist)                     │
│    SELECT * FROM document_annotations               │
│    WHERE document_id = 'DOC-2025-abc123'            │
│    → No annotations (empty array)                   │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 9. Fetch Validation Status                          │
│    SELECT * FROM document_validations               │
│    WHERE document_id = 'DOC-2025-abc123'            │
│    → validation_status = pending                    │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 10. Aggregate Response                              │
│     {                                               │
│       metadata: {...},                              │
│       ocr_results: {...},                           │
│       form_mapping: {...},                          │
│       validation: {...},                            │
│       permissions: {...}                            │
│     }                                               │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 11. Cache Response                                  │
│     SET "document:DOC-2025-abc123" = response       │
│     EXPIRE 300 seconds (5 min)                      │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 12. Update Statistics                               │
│     UPDATE uploaded_files                           │
│     SET view_count = view_count + 1,                │
│         last_viewed_at = NOW()                      │
│     WHERE id = 'DOC-2025-abc123'                    │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 13. Audit Log                                       │
│     INSERT INTO audit_logs (                        │
│       action: 'document_viewed',                    │
│       user_id: current_user.id,                     │
│       document_id: 'DOC-2025-abc123'                │
│     )                                               │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 14. Metrics                                         │
│     - Increment document_views_total                │
│     - Observe document_retrieval_duration           │
│     - Observe document_response_size                │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 15. Return Response                                 │
│     200 OK                                          │
│     Content-Type: application/json                  │
│     { success: true, data: {...} }                  │
└─────────────────────────────────────────────────────┘
```

### Optimisations Workflow

1. **Cache Redis** :
   - 60% requêtes servies depuis cache
   - Réduction latence : 300ms → 50ms
   - TTL : 5 minutes (balance fraîcheur/performance)

2. **Query Optimization** :
   - Index sur `uploaded_files.id` (primary key)
   - Index sur `ocr_extraction_results.uploaded_file_id` (foreign key)
   - Avoid N+1 queries via JOIN si possible

3. **Lazy Loading** :
   - `raw_text` chargé SEULEMENT si `include_ocr_raw_text=true`
   - `history` chargé SEULEMENT si `include_history=true`
   - Réduit payload de ~40% par défaut

4. **Response Compression** :
   - Gzip activé pour responses > 1KB
   - Réduction taille : ~60-70%

---

**FIN UC-DOC-003**

**Taille** : ~1,000 lignes (vs 2,100 avec code)
**Focus** : ✅ WORKFLOW détaillé
**Code** : ❌ Supprimé (comme demandé)
