# UC-DOC-005 : List Documents - Lister Documents avec Filtres

## 1. Métadonnées
- **ID** : UC-DOC-005
- **Endpoint** : `GET /documents/list`
- **Méthode** : GET
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ✅ IMPLÉMENTÉ (90%)
- **Acteurs** : Citizen, Business, Agent, Admin
- **Dépend de** : UC-DOC-001 (documents doivent exister)

---

## 2. Description Métier

### Contexte
Un utilisateur a besoin de **consulter la liste de tous ses documents uploadés** avec possibilité de :
- Filtrer par type (IRPF, IVA, fiche paie, etc.)
- Filtrer par statut OCR (pending, processing, completed, failed)
- Filtrer par statut validation (pending, validated, rejected)
- Filtrer par période (date upload)
- Filtrer par déclaration liée
- Trier (date, nom, taille, type)
- Paginer (10, 25, 50, 100 docs par page)

**Cas d'usage** :
1. **Dashboard utilisateur** : "Mes documents" (tous types confondus)
2. **Préparation déclaration** : "Documents pour ma déclaration IRPF 2024"
3. **Suivi OCR** : "Documents en cours de traitement"
4. **Agent review** : "Documents à valider assignés à moi"
5. **Recherche** : "Toutes mes fiches de paie de 2024"

### Problème
- Utilisateurs avec 50-200 documents ont besoin de filtrage efficace
- Éviter de charger tous les documents en une fois (performance)
- Afficher informations pertinentes sans détails complets (preview)
- Permettre accès rapide via tri et pagination

### Objectif
Retourner une **liste paginée** avec :
- ✅ Métadonnées essentielles (id, filename, type, size, date)
- ✅ Statuts (OCR, validation)
- ✅ Thumbnails (pour images)
- ✅ Preview first page (pour PDFs)
- ✅ Filtres multiples combinables
- ✅ Tri flexible
- ✅ Pagination cursor-based (performance)

### Workflow Détaillé
```
1. User/Agent demande GET /documents/list avec query parameters

2. Backend vérifie authentification
   → Token JWT valide ?

3. Backend parse query parameters :
   - Filtres (document_type, ocr_status, validation_status, date_range)
   - Tri (sort_by, sort_order)
   - Pagination (page, limit, cursor)

4. Backend construit requête SQL dynamique :
   
   Base query :
   SELECT id, file_name, document_type, file_size_bytes, 
          mime_type, ocr_status, validation_status, 
          uploaded_at, related_to_id
   FROM uploaded_files
   WHERE user_id = current_user.id
     AND deleted_at IS NULL
   
   Ajouter filtres dynamiquement :
   ├─ Si document_type fourni → AND document_type = :type
   ├─ Si ocr_status fourni → AND ocr_status = :status
   ├─ Si date_from fourni → AND uploaded_at >= :date_from
   ├─ Si date_to fourni → AND uploaded_at <= :date_to
   └─ Si related_to_id fourni → AND related_to_id = :related_id

5. Backend applique RBAC :
   ├─ User : Voit SEULEMENT ses propres documents
   ├─ Agent : Voit documents des déclarations assignées
   └─ Admin : Voit tous documents (avec filtre user_id optionnel)

6. Backend applique tri :
   ORDER BY {sort_by} {sort_order}
   
   Sort options :
   - uploaded_at (défaut)
   - file_name
   - file_size_bytes
   - document_type
   - ocr_confidence

7. Backend applique pagination :
   
   Méthode 1 : Offset-based (simple)
   → LIMIT :limit OFFSET :offset
   
   Méthode 2 : Cursor-based (performant)
   → WHERE id > :cursor LIMIT :limit

8. Backend exécute query → Fetch documents

9. Pour chaque document, enrichir avec :
   - Thumbnail URL (si image)
   - Preview URL (si PDF)
   - form_mapping présence (true/false)
   - Can actions (can_view, can_delete, can_download)

10. Backend génère metadata pagination :
    - total_count
    - page_count
    - current_page
    - has_next_page
    - has_previous_page
    - next_cursor
    - previous_cursor

11. Backend cache response (Redis 2 minutes)
    → Clé : "documents:list:{user_id}:{hash(filters)}"

12. Return response avec documents + metadata

13. Metrics :
    - Increment documents_list_requests_total
    - Observe documents_list_duration
    - Track filtres utilisés
```

### Cas Spéciaux

#### Cas 1 : Agent Liste Documents à Valider
```
Query : GET /documents/list?validation_status=pending&assigned_to_me=true

Workflow :
1. Fetch agent.assigned_declarations
2. Fetch documents liés à ces déclarations
3. Filter validation_status = 'pending'
4. Return liste
```

#### Cas 2 : Liste Vide (Aucun Document)
```
Si aucun document trouvé :
Response :
- total_count: 0
- items: []
- message: "No documents found matching filters"
```

#### Cas 3 : Performances avec Milliers de Documents
```
Si user a > 1000 documents :
- Forcer cursor-based pagination
- Limiter tri complexes
- Suggérer filtres plus précis
```

---

## 3. Given/When/Then

### Scénario 1 : User Liste Tous Ses Documents

```gherkin
Given un utilisateur authentifié (user_id = "user-123")
  And l'utilisateur a uploadé 15 documents
  And 5 documents sont de type "declaration_irpf"
  And 3 documents ont ocr_status = "processing"
  And aucun filtre appliqué

When l'utilisateur demande GET /documents/list
  And pagination : page=1, limit=10

Then le système retourne 200 OK avec :
  - items : array de 10 documents (métadonnées)
  - total_count : 15
  - page_count : 2 (ceil(15/10))
  - current_page : 1
  - has_next_page : true
  - Chaque document contient :
    * document_id
    * filename
    * document_type
    * file_size
    * ocr_status
    * uploaded_at
    * thumbnail_url (si image)
    * can_view, can_delete, can_download
```

### Scénario 2 : Filtrer Documents IRPF Complétés

```gherkin
Given un utilisateur avec 15 documents
  And 5 documents type "declaration_irpf"
  And 3 IRPF ont ocr_status = "completed"
  And 2 IRPF ont ocr_status = "processing"

When l'utilisateur demande :
  GET /documents/list?document_type=declaration_irpf&ocr_status=completed

Then le système retourne :
  - items : 3 documents IRPF avec OCR complété
  - total_count : 3
  - Filtres appliqués visibles dans response
```

### Scénario 3 : Agent Liste Documents à Valider

```gherkin
Given un agent authentifié (agent_id = "agent-456")
  And 3 déclarations assignées à cet agent
  And 12 documents liés à ces déclarations
  And 7 documents ont validation_status = "pending"

When l'agent demande :
  GET /documents/list?validation_status=pending&assigned_to_me=true

Then le système retourne :
  - items : 7 documents en attente validation
  - Chaque document inclut :
    * related_declaration info
    * can_validate : true
    * priority (si urgent)
```

### Scénario 4 : Tri par Date Décroissante

```gherkin
Given un utilisateur avec documents uploadés sur plusieurs mois
When l'utilisateur demande :
  GET /documents/list?sort_by=uploaded_at&sort_order=desc

Then les documents sont retournés du plus récent au plus ancien
  And le premier document a la date d'upload la plus récente
```

### Scénario 5 : Pagination Cursor-Based

```gherkin
Given un utilisateur avec 50 documents
When l'utilisateur demande page 1 :
  GET /documents/list?limit=20

Then response contient :
  - items : 20 documents
  - next_cursor : "eyJpZCI6IkRPQy0yMDI1LXh5ejAyMCJ9" (base64)
  - has_next_page : true

When l'utilisateur demande page 2 :
  GET /documents/list?limit=20&cursor=eyJpZCI6IkRPQy0yMDI1LXh5ejAyMCJ9

Then response contient :
  - items : 20 documents suivants
  - next_cursor : nouveau cursor
  - previous_cursor : cursor page 1
```

---

## 4. Requête HTTP

### Liste Basique (tous documents)
```http
GET /api/v1/documents/list HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Liste avec Filtres Multiples
```http
GET /api/v1/documents/list?document_type=declaration_irpf&ocr_status=completed&date_from=2024-01-01&date_to=2024-12-31&sort_by=uploaded_at&sort_order=desc&page=1&limit=25 HTTP/1.1
Authorization: Bearer token...
```

### Query Parameters

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| **Filtres** | | | |
| `document_type` | String | null | Type document (20 types supportés) |
| `document_types[]` | String[] | null | Multiple types (OR logic) |
| `ocr_status` | Enum | null | pending, processing, completed, failed |
| `validation_status` | Enum | null | pending, validated, rejected |
| `date_from` | Date | null | Upload date >= (ISO 8601) |
| `date_to` | Date | null | Upload date <= (ISO 8601) |
| `related_to_id` | String | null | ID déclaration/service lié |
| `related_to_type` | String | null | tax_declaration, fiscal_service |
| `has_form_mapping` | Boolean | null | Documents avec mapping formulaire |
| `assigned_to_me` | Boolean | false | Documents assignés (agent only) |
| **Tri** | | | |
| `sort_by` | Enum | uploaded_at | uploaded_at, file_name, file_size_bytes, document_type |
| `sort_order` | Enum | desc | asc, desc |
| **Pagination** | | | |
| `page` | Integer | 1 | Page number (offset-based) |
| `limit` | Integer | 25 | Items per page (10, 25, 50, 100) |
| `cursor` | String | null | Cursor for cursor-based pagination |
| **Options** | | | |
| `include_thumbnails` | Boolean | true | Inclure thumbnail URLs |
| `include_previews` | Boolean | false | Inclure preview first page (+ latence) |
| `include_deleted` | Boolean | false | Inclure soft deleted (admin only) |

### Exemples Requêtes Courantes

**1. Mes documents IRPF de 2024**
```
GET /documents/list?document_type=declaration_irpf&date_from=2024-01-01&date_to=2024-12-31
```

**2. Documents en attente validation**
```
GET /documents/list?validation_status=pending&sort_by=uploaded_at&sort_order=asc
```

**3. Documents OCR échoués (pour retry)**
```
GET /documents/list?ocr_status=failed
```

**4. Toutes mes fiches de paie**
```
GET /documents/list?document_type=payslip&sort_by=uploaded_at&sort_order=desc
```

**5. Documents liés à déclaration spécifique**
```
GET /documents/list?related_to_id=DECL-2025-001234
```

---

## 5. Réponse Succès

### Cas 1 : Liste Standard avec Pagination

**Response contient** :
- `success`: true
- `data.items`: Array de documents (10-100 items selon limit)
- `data.pagination.total_count`: 45 (total documents matchant filtres)
- `data.pagination.page_count`: 5 (total pages si limit=10)
- `data.pagination.current_page`: 1
- `data.pagination.limit`: 10
- `data.pagination.has_next_page`: true
- `data.pagination.has_previous_page`: false
- `data.pagination.next_cursor`: "eyJpZCI6IkRPQy0yMDI1LXh5ejAxMCJ9" (base64 encoded)
- `data.applied_filters`: Objet avec filtres actifs
- `data.applied_sorting`: Objet avec tri actif

**Chaque item dans `data.items` contient** :
- `document_id`: "DOC-2025-abc123"
- `filename`: "declaration_irpf_2024.pdf"
- `document_type`: "declaration_irpf"
- `file_size`: 3670016 (bytes)
- `file_size_formatted`: "3.5 MB"
- `mime_type`: "application/pdf"
- `uploaded_at`: "2025-10-31T14:30:00Z"
- `uploaded_at_relative`: "2 hours ago"
- `ocr_status`: "completed"
- `ocr_confidence`: 0.94
- `validation_status`: "pending"
- `has_form_mapping`: true
- `thumbnail_url`: "https://storage/.../thumbnail.jpg" (si image)
- `preview_url`: null (si include_previews=false)
- `related_to`: Objet si lié à déclaration
  - `type`: "tax_declaration"
  - `id`: "DECL-2025-001234"
  - `declaration_number`: "DECL-2024-IRPF-001234"
- `permissions`: Objet avec actions autorisées
  - `can_view`: true
  - `can_edit`: false
  - `can_delete`: true
  - `can_download`: true
  - `can_validate`: false (true si agent assigné)
- `actions_urls`: Objets avec endpoints
  - `view`: "GET /documents/DOC-2025-abc123"
  - `delete`: "DELETE /documents/DOC-2025-abc123"
  - `download`: "POST /documents/DOC-2025-abc123/download"
  - `form_mapping`: "GET /documents/DOC-2025-abc123/form-mapping"

### Cas 2 : Liste Vide (Aucun Document)

**Response contient** :
- `success`: true
- `data.items`: []
- `data.pagination.total_count`: 0
- `data.pagination.page_count`: 0
- `data.applied_filters`: Filtres appliqués
- `message`: "No documents found matching the applied filters"
- `suggestions`: Array avec suggestions
  - "Try removing some filters"
  - "Check if documents are deleted"

### Cas 3 : Réponse avec Filtres Multiples

**Response contient** :
- `success`: true
- `data.items`: Array documents filtrés
- `data.applied_filters`:
  - `document_type`: "declaration_irpf"
  - `ocr_status`: "completed"
  - `date_from`: "2024-01-01"
  - `date_to`: "2024-12-31"
- `data.applied_sorting`:
  - `sort_by`: "uploaded_at"
  - `sort_order`: "desc"
- `data.filter_stats`: Statistiques par filtre
  - `total_irpf_documents`: 12
  - `completed_ocr`: 10
  - `in_date_range`: 12

### Cas 4 : Agent - Documents Assignés

**Response contient** :
- `success`: true
- `data.items`: Array documents à valider
- `data.agent_context`:
  - `assigned_declarations_count`: 3
  - `pending_validations`: 7
  - `urgent_documents`: 2
- Chaque item contient :
  - `can_validate`: true
  - `priority`: "high" (si urgent)
  - `declaration_info`: Détails déclaration liée

---

## 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | limit invalide | limit must be between 1 and 100 | Utiliser 10, 25, 50, 100 |
| 400 | sort_by invalide | Invalid sort_by field | Utiliser uploaded_at, file_name, file_size_bytes |
| 400 | date_from format invalide | Invalid date_from format (use ISO 8601) | Corriger format |
| 400 | document_type invalide | Invalid document_type | Utiliser 1 des 20 types |
| 401 | Non authentifié | Authorization required | Se connecter |
| 403 | assigned_to_me non-agent | assigned_to_me filter is only for agents | Retirer filtre |
| 403 | include_deleted non-admin | include_deleted is only for admins | Retirer paramètre |
| 429 | Rate limit | Too many requests | Attendre 1 minute |
| 500 | Erreur DB | Database error | Réessayer |

---

## 7. Métriques Techniques

### Latence
- **P50** : < 100ms (sans thumbnails/previews)
- **P95** : < 200ms
- **P99** : < 300ms
- **Avec previews** : +50-100ms

**Facteurs** :
- Nombre documents user
- Complexité filtres
- Tri (uploaded_at = index, file_name = slower)
- Thumbnails/previews génération

### Throughput
- **Pics** : ~100-200 requêtes/minute (dashboard loads)
- **Moyenne** : ~30-50 requêtes/minute

### Cache
- **Redis TTL** : 2 minutes (liste change fréquemment)
- **Hit rate** : ~40-50% (utilisateurs reloadent souvent)
- **Clé cache** : hash(user_id + filtres + tri + pagination)

### Taux Succès
- **Cible** : > 99%

### Pagination Méthode

**Distribution** :
- Offset-based : 80% (< 100 documents)
- Cursor-based : 20% (> 100 documents)

---

## 8. KPIs Métier

### Taux utilisation filtres
```
Formule : (Requêtes avec filtres / Total requêtes list) × 100
Actuel : 65%
Insight : Users utilisent activement filtres (UX réussie)
```

### Filtres les plus utilisés
```
Top 3 :
1. document_type (45%)
2. ocr_status (25%)
3. date_from/date_to (20%)

Insight : Optimiser ces filtres avec indexes DB
```

### Taille moyenne résultats
```
Formule : AVG(total_count per request)
Actuel : 12-15 documents
Insight : La plupart users ont < 20 documents
```

### Taux liste vide
```
Formule : (Requêtes avec total_count=0 / Total requêtes) × 100
Cible : < 5%
Insight : Si > 10% → Filtres trop stricts ou bugs
```

### Préférence pagination
```
Distribution limit :
- 10 items : 20%
- 25 items : 60% (défaut populaire)
- 50 items : 15%
- 100 items : 5%
```

---

## 9. Instrumentation

**Métriques Prometheus** :

```python
documents_list_requests_total = Counter(
    'documents_list_requests_total',
    'Total list requests',
    ['user_role', 'has_filters']
)

documents_list_duration = Histogram(
    'documents_list_duration_seconds',
    'List request duration',
    ['has_filters', 'include_previews'],
    buckets=[0.05, 0.1, 0.2, 0.3, 0.5]
)

documents_list_results_count = Histogram(
    'documents_list_results_count',
    'Number of documents returned',
    buckets=[0, 1, 5, 10, 25, 50, 100, 500]
)

documents_list_filters_used = Counter(
    'documents_list_filters_used_total',
    'Filters usage frequency',
    ['filter_name']  # document_type, ocr_status, date_range, etc.
)

documents_list_cache_hits = Counter(
    'documents_list_cache_hits_total',
    'Cache hits for list requests'
)

documents_list_pagination_method = Counter(
    'documents_list_pagination_method_total',
    'Pagination method used',
    ['method']  # offset, cursor
)
```

---

## 10. Sécurité

### RBAC - Filtres Autorisés

| Rôle | Filtres Disponibles | Restrictions |
|------|---------------------|--------------|
| **Citizen/Business** | Tous filtres standards | Voit SEULEMENT ses documents |
| **Agent** | + assigned_to_me | Voit documents déclarations assignées |
| **Admin** | + include_deleted + user_id | Voit tous documents |

### Isolation Données (Critical)

**Query DOIT toujours inclure** :
```sql
WHERE user_id = current_user.id
  AND deleted_at IS NULL  -- Sauf si include_deleted=true (admin)
```

**Exception Agent** :
```sql
WHERE uploaded_files.related_to_id IN (
  SELECT id FROM declarations 
  WHERE assigned_to_id = current_agent.id
)
```

### Rate Limiting
```
User : 60 requêtes/minute
Agent : 100 requêtes/minute
Admin : 200 requêtes/minute
```

### Validation Query Parameters

**Sanitization** :
- `document_type` : Whitelist 20 types
- `sort_by` : Whitelist colonnes autorisées (prevent SQL injection)
- `limit` : Clamp [1, 100]
- `cursor` : Decode + validate format

### Protection DDoS

Si user fait > 10 requêtes/seconde :
- Return cached version (ignore query params)
- Log suspicious activity
- Alert si continue > 1 minute

---

## 11. Workflow Récapitulatif

### Workflow Standard (User Liste Ses Documents)
```
┌───────────────────────────────────────────────┐
│ 1. User Request                               │
│    GET /documents/list?                       │
│        document_type=declaration_irpf         │
│        &ocr_status=completed                  │
│        &sort_by=uploaded_at                   │
│        &sort_order=desc                       │
│        &page=1&limit=25                       │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 2. Auth Verification                          │
│    - Decode JWT → current_user.id             │
│    - Verify token valid                       │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 3. Parse & Validate Query Parameters          │
│    - document_type: "declaration_irpf" ✅      │
│    - ocr_status: "completed" ✅                │
│    - sort_by: "uploaded_at" ✅                 │
│    - sort_order: "desc" ✅                     │
│    - page: 1 ✅                                │
│    - limit: 25 ✅ (valid range)                │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 4. Generate Cache Key                         │
│    key = hash(user_id + filters + sort)       │
│    = "docs:list:user-123:irpf-completed-desc" │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 5. Check Redis Cache                          │
│    GET "docs:list:user-123:irpf-completed..."│
│    ├─ Cache HIT → Return cached (skip DB)     │
│    └─ Cache MISS → Continue to DB             │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 6. Build Dynamic SQL Query                    │
│    SELECT id, file_name, document_type,       │
│           file_size_bytes, ocr_status,        │
│           validation_status, uploaded_at      │
│    FROM uploaded_files                        │
│    WHERE user_id = 'user-123'                 │
│      AND deleted_at IS NULL                   │
│      AND document_type = 'declaration_irpf'   │
│      AND ocr_status = 'completed'             │
│    ORDER BY uploaded_at DESC                  │
│    LIMIT 25 OFFSET 0                          │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 7. Execute Query                              │
│    → Found 8 documents matching filters       │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 8. Get Total Count (for pagination)           │
│    SELECT COUNT(*) FROM uploaded_files        │
│    WHERE [same filters]                       │
│    → total_count = 8                          │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 9. Enrich Each Document                       │
│    For each of 8 documents:                   │
│    a) Generate thumbnail_url (if image)       │
│    b) Check form_mapping exists               │
│    c) Calculate permissions (can_view, etc.)  │
│    d) Format relative time "2 hours ago"      │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 10. Build Pagination Metadata                 │
│     - total_count: 8                          │
│     - page_count: 1 (ceil(8/25) = 1)          │
│     - current_page: 1                         │
│     - has_next_page: false                    │
│     - has_previous_page: false                │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 11. Aggregate Response                        │
│     {                                         │
│       items: [8 documents],                   │
│       pagination: {...},                      │
│       applied_filters: {...}                  │
│     }                                         │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 12. Cache Response (2 min TTL)                │
│     SET "docs:list:user-123:..." = response   │
│     EXPIRE 120 seconds                        │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 13. Metrics                                   │
│     - Increment documents_list_requests_total │
│     - Observe documents_list_duration (95ms)  │
│     - Observe documents_list_results_count(8) │
│     - Increment filter usage counters         │
└─────────────┬─────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────┐
│ 14. Return Response                           │
│     200 OK                                    │
│     Content-Type: application/json            │
│     { success: true, data: {...} }            │
└───────────────────────────────────────────────┘
```

### Optimisations Performance

**1. Indexes DB Critiques**
```sql
-- Index user_id + deleted_at (filter base)
CREATE INDEX idx_uploaded_files_user_deleted 
ON uploaded_files(user_id, deleted_at);

-- Index composite filters fréquents
CREATE INDEX idx_uploaded_files_type_status 
ON uploaded_files(user_id, document_type, ocr_status, deleted_at);

-- Index tri date
CREATE INDEX idx_uploaded_files_uploaded_at 
ON uploaded_files(user_id, uploaded_at DESC);
```

**2. Query Optimization**
- Utiliser COUNT(*) OVER() pour total_count en 1 seule query
- Lazy load thumbnails (génération async si manquant)
- Limit fields SELECT (pas SELECT *)

**3. Cache Strategy**
- Cache hit rate cible : 50%
- TTL court (2 min) car liste change souvent
- Invalidation sur upload/delete document

**4. Cursor Pagination (pour > 100 docs)**
```
Avantages :
- Performance constante (pas OFFSET lent)
- Pas de documents manqués si insert concurrent

Query :
SELECT * FROM uploaded_files
WHERE user_id = :user_id
  AND id > :cursor  -- Cursor = last document ID
ORDER BY id
LIMIT 25
```

---

**FIN UC-DOC-005**

**Taille** : ~650 lignes
**Format** : ✅ Littéral (pas de JSON complet)
**Workflow** : ✅ ASCII diagram 14 étapes
**Optimisations** : ✅ Cache, indexes, cursor pagination
