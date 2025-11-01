# UC-DOC-006 : Search Documents - Recherche Avancée Full-Text

## 1. Métadonnées
- **ID** : UC-DOC-006
- **Endpoint** : `POST /documents/search`
- **Méthode** : POST
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ⚠️ PARTIEL (60%) - Full-text search à optimiser
- **Acteurs** : Citizen, Business, Agent, Admin
- **Dépend de** : UC-DOC-001, UC-DOC-005
- **Technologies** : PostgreSQL Full-Text Search OU Elasticsearch

---

## 2. Description Métier

### Contexte
Un utilisateur a besoin de **rechercher un document spécifique** parmi des dizaines/centaines de documents en utilisant :
- Mots-clés libres (ex: "fiche paie octobre", "IRPF 2024", "Jean Dupont")
- Recherche dans le **contenu OCR** (texte extrait)
- Recherche dans **métadonnées** (filename, document_type)
- Recherche dans **données structurées** (NIF, montants, dates)

**Différence avec UC-DOC-005 (LIST)** :
- LIST : Filtres prédéfinis, liste exhaustive avec pagination
- SEARCH : Requête texte libre, scoring pertinence, résultats classés par score

**Cas d'usage** :
1. **Retrouver document spécifique** : "ma déclaration IRPF de mars"
2. **Recherche par contenu** : "NIF 123456789" (cherche dans OCR)
3. **Recherche par montant** : "850000" (cherche dans extracted_data)
4. **Recherche floue** : "fiche paye" → trouve "fiche de paie"
5. **Auto-complete** : "decla..." → suggère "declaration_irpf"

### Problème
- Filtres UC-DOC-005 insuffisants pour recherche libre
- Utilisateur ne se souvient pas du nom exact du fichier
- Besoin chercher dans le contenu OCR (pas juste filename)
- Recherche doit être **rapide** (< 500ms) même avec milliers de docs

### Objectif
Fournir **recherche intelligente** avec :
- ✅ Full-text search (PostgreSQL FTS ou Elasticsearch)
- ✅ Scoring pertinence (résultats les plus pertinents en premier)
- ✅ Recherche multi-champs (filename + OCR + extracted_data)
- ✅ Stemming & normalisation (pluriel, accents, casse)
- ✅ Recherche floue (typos, similarité)
- ✅ Highlighting (mise en évidence termes trouvés)
- ✅ Suggestions auto-complete
- ✅ Combinaison avec filtres (comme UC-DOC-005)

### Workflow Détaillé
```
1. User/Agent soumet POST /documents/search avec :
   - query : "fiche paie octobre 2024"
   - filtres optionnels (document_type, date_range)
   - options (fuzzy, highlight, limit)

2. Backend vérifie authentification
   → Token JWT valide ?

3. Backend parse & analyse query :
   a) Tokenization : ["fiche", "paie", "octobre", "2024"]
   b) Stemming : ["fich", "pay", "octobr", "2024"]
   c) Stopwords removal : (garder tous, pas de stopwords critiques)
   d) Normalisation : minuscules, accents supprimés

4. Backend détermine moteur recherche :
   ├─ Si Elasticsearch disponible → Utiliser ES (recommandé)
   └─ Sinon → PostgreSQL Full-Text Search (fallback)

5. Backend construit requête search :
   
   Elasticsearch DSL :
   {
     "query": {
       "bool": {
         "must": [
           {"multi_match": {
             "query": "fiche paie octobre 2024",
             "fields": [
               "file_name^3",           // Boost filename (poids 3x)
               "ocr_raw_text^2",        // Boost OCR text (poids 2x)
               "extracted_data.*",      // Tous champs structurés
               "document_type"
             ],
             "fuzziness": "AUTO"        // Tolérance typos
           }}
         ],
         "filter": [
           {"term": {"user_id": "user-123"}},
           {"term": {"deleted_at": null}},
           {"range": {"uploaded_at": {...}}}  // Si date_range fourni
         ]
       }
     },
     "highlight": {
       "fields": {"ocr_raw_text": {}}
     },
     "size": 20
   }
   
   PostgreSQL FTS :
   SELECT id, file_name, 
          ts_rank(search_vector, query) AS rank,
          ts_headline(ocr_raw_text, query) AS highlight
   FROM uploaded_files,
        to_tsquery('french', 'fiche & paie & octobre & 2024') query
   WHERE user_id = 'user-123'
     AND deleted_at IS NULL
     AND search_vector @@ query
   ORDER BY rank DESC
   LIMIT 20

6. Backend exécute recherche → Récupère résultats avec scores

7. Backend enrichit résultats :
   Pour chaque document trouvé :
   a) Calculer score pertinence (0-100%)
   b) Extraire snippets avec highlights
   c) Identifier champs matchés (filename? OCR? extracted_data?)
   d) Ajouter métadonnées essentielles

8. Backend trie par score décroissant
   → Documents les plus pertinents en premier

9. Backend génère suggestions (si peu de résultats) :
   - "Did you mean: fiche paie ?"
   - "Try searching: payslip octobre"
   - "Related: fiche salaire, bulletin paie"

10. Backend cache résultats (Redis 5 min)
    → Clé : "search:{user_id}:{hash(query+filters)}"

11. Return response avec :
    - results : array documents avec scores
    - search_metadata : stats recherche
    - suggestions : suggestions si pertinent

12. Metrics :
    - Increment documents_search_total
    - Observe search_duration
    - Track query terms fréquents
```

### Cas Spéciaux

#### Cas 1 : Recherche Retourne Aucun Résultat
```
Si results.length = 0 :
1. Vérifier si query trop spécifique
2. Générer suggestions :
   - Enlever 1 terme et rechercher
   - Recherche floue plus permissive
   - Suggérer termes similaires (Levenshtein distance)
3. Proposer filtres moins restrictifs
```

#### Cas 2 : Recherche par NIF/Identifiant
```
Query : "NIF 123456789"

Workflow spécial :
1. Détecter pattern NIF (regex)
2. Recherche EXACTE dans extracted_data.nif
3. Boost score +50 si match exact
4. Recherche aussi dans OCR (cas NIF mal OCRisé)
```

#### Cas 3 : Auto-Complete (Suggestions Temps Réel)
```
Query partielle : "decla"

1. Lookup dans index auto-complete
2. Return top 10 suggestions :
   - "declaration_irpf"
   - "declaration_iva"
   - "declaracion"
3. Chaque suggestion avec :
   - term : suggestion complète
   - count : nombre docs contenant ce terme
   - category : document_type ou free_text
```

---

## 3. Given/When/Then

### Scénario 1 : Recherche Simple avec Résultats

```gherkin
Given un utilisateur authentifié avec 50 documents
  And 3 documents contiennent "fiche paie octobre"
  And 2 dans filename, 1 dans OCR content

When l'utilisateur recherche :
  POST /documents/search
  Body: { "query": "fiche paie octobre" }

Then le système retourne 200 OK avec :
  - results : 3 documents trouvés
  - Tri par score décroissant :
    1. DOC-001 (score: 95%) - "fiche_paie_octobre_2024.pdf" (match filename)
    2. DOC-002 (score: 92%) - "bulletin_salaire_10_2024.pdf" (match OCR)
    3. DOC-003 (score: 85%) - "fiche_octobre.pdf" (match partiel)
  - Chaque résultat contient :
    * document_id
    * score (0-100%)
    * matched_fields : ["file_name", "ocr_raw_text"]
    * highlights : snippets avec termes surlignés
```

### Scénario 2 : Recherche par Identifiant (NIF)

```gherkin
Given un utilisateur avec documents contenant NIF "123456789"
  And 1 déclaration IRPF avec ce NIF dans extracted_data
  And 1 autre document avec NIF mal OCRisé "I23456789" (I au lieu de 1)

When l'utilisateur recherche "NIF 123456789"

Then le système :
  - Détecte pattern NIF via regex
  - Recherche EXACTE dans extracted_data.nif
  - Trouve 1 document avec match exact (score: 100%)
  - Recherche floue dans OCR trouve document mal OCRisé (score: 75%)
  - Retourne 2 résultats triés par score
```

### Scénario 3 : Aucun Résultat - Suggestions

```gherkin
Given un utilisateur recherche "fisch paye octobr 2024"
  And query contient typos (fisch → fiche, octobr → octobre)
  And aucun document avec ces termes exacts

When recherche stricte retourne 0 résultats

Then le système active recherche floue :
  - Corrige typos automatiquement
  - Recherche "fiche paie octobre 2024"
  - Trouve 3 documents
  - Response inclut :
    * results : 3 documents
    * search_metadata.corrected_query : "fiche paie octobre 2024"
    * search_metadata.original_query : "fisch paye octobr 2024"
    * message : "Showing results for 'fiche paie octobre 2024'"
```

### Scénario 4 : Auto-Complete Suggestions

```gherkin
Given un utilisateur tape "decla" dans search box
  And système doit suggérer termes commençant par "decla"

When frontend demande :
  POST /documents/search/autocomplete
  Body: { "prefix": "decla", "limit": 5 }

Then le système retourne top 5 suggestions :
  1. "declaration_irpf" (12 documents)
  2. "declaration_iva" (5 documents)
  3. "declaracion" (3 documents)
  4. "déclaration fiscale" (8 documents)
  5. "declaration 2024" (15 documents)
```

### Scénario 5 : Recherche avec Filtres Combinés

```gherkin
Given un utilisateur recherche texte + filtres
When demande :
  POST /documents/search
  Body: {
    "query": "octobre",
    "filters": {
      "document_type": "payslip",
      "date_from": "2024-10-01",
      "date_to": "2024-10-31"
    }
  }

Then le système :
  - Recherche "octobre" dans tous champs
  - Applique filtre type = "payslip"
  - Applique filtre date range octobre 2024
  - Retourne documents matchant TOUS critères
```

---

## 4. Requête HTTP

### Recherche Simple
```http
POST /api/v1/documents/search HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "query": "fiche paie octobre 2024"
}
```

### Recherche avec Options Avancées
```http
POST /api/v1/documents/search HTTP/1.1
Content-Type: application/json

{
  "query": "declaration IRPF",
  "filters": {
    "document_type": ["declaration_irpf", "tax_return"],
    "ocr_status": "completed",
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  },
  "options": {
    "fuzzy": true,
    "highlight": true,
    "highlight_length": 150,
    "limit": 20,
    "include_snippets": true,
    "search_fields": ["file_name", "ocr_raw_text", "extracted_data"],
    "boost_filename": 3.0,
    "boost_ocr": 2.0
  }
}
```

### Auto-Complete
```http
POST /api/v1/documents/search/autocomplete HTTP/1.1
Content-Type: application/json

{
  "prefix": "decla",
  "limit": 10,
  "include_counts": true
}
```

### Body Parameters (Recherche)

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `query` | String | ✅ Oui | Texte recherché (min 2 caractères) |
| `filters` | Object | ❌ Non | Filtres comme UC-DOC-005 |
| `filters.document_type` | String[] | ❌ Non | Types documents |
| `filters.ocr_status` | String | ❌ Non | Statut OCR |
| `filters.date_from` | Date | ❌ Non | Date min upload |
| `filters.date_to` | Date | ❌ Non | Date max upload |
| `options` | Object | ❌ Non | Options recherche |
| `options.fuzzy` | Boolean | ❌ Non | Activer recherche floue (défaut: true) |
| `options.highlight` | Boolean | ❌ Non | Surligner termes (défaut: true) |
| `options.highlight_length` | Integer | ❌ Non | Longueur snippets (défaut: 150) |
| `options.limit` | Integer | ❌ Non | Max résultats (défaut: 20, max: 100) |
| `options.search_fields` | String[] | ❌ Non | Champs à chercher (défaut: tous) |
| `options.boost_filename` | Float | ❌ Non | Poids filename (défaut: 3.0) |
| `options.boost_ocr` | Float | ❌ Non | Poids OCR (défaut: 2.0) |

---

## 5. Réponse Succès

### Cas 1 : Recherche avec Résultats

**Response contient** :
- `success`: true
- `data.results`: Array documents trouvés (0-100)
- `data.total_results`: 3 (nombre total)
- `data.search_metadata`:
  - `query`: "fiche paie octobre" (query soumise)
  - `corrected_query`: null (si pas correction)
  - `search_time_ms`: 45 (temps recherche)
  - `filters_applied`: Objet filtres actifs
  - `search_engine`: "elasticsearch" ou "postgresql"

**Chaque résultat dans `data.results` contient** :
- `document_id`: "DOC-2025-abc123"
- `score`: 95.5 (pertinence 0-100)
- `score_breakdown`: Détail score par champ
  - `filename_score`: 50
  - `ocr_score`: 30
  - `extracted_data_score`: 15.5
- `matched_fields`: ["file_name", "ocr_raw_text"]
- `document_metadata`:
  - `filename`: "fiche_paie_octobre_2024.pdf"
  - `document_type`: "payslip"
  - `file_size`: 1258291
  - `uploaded_at`: "2024-11-15T10:30:00Z"
  - `ocr_status`: "completed"
- `highlights`: Array snippets avec termes surlignés
  - `field`: "file_name"
  - `snippet`: "fiche_**paie**_**octobre**_2024.pdf"
  - `match_count`: 2
- `highlights` (OCR):
  - `field`: "ocr_raw_text"
  - `snippet`: "...bulletin de **paie** du mois d'**octobre** 2024..."
  - `match_count`: 2
- `permissions`: Objets actions (can_view, can_delete)
- `actions_urls`: Links vers endpoints

### Cas 2 : Aucun Résultat - Suggestions

**Response contient** :
- `success`: true
- `data.results`: []
- `data.total_results`: 0
- `data.search_metadata`:
  - `query`: "fisch paye octobr"
  - `corrected_query`: "fiche paie octobre"
  - `correction_confidence`: 0.85
- `data.suggestions`:
  - `did_you_mean`: "fiche paie octobre"
  - `alternative_queries`: [
      "fiche salaire",
      "bulletin paie",
      "payslip"
    ]
  - `tips`: [
      "Try using fewer search terms",
      "Check spelling",
      "Use more general terms"
    ]
- `message`: "No documents found. Did you mean 'fiche paie octobre'?"

### Cas 3 : Auto-Complete Suggestions

**Response contient** :
- `success`: true
- `data.suggestions`: Array de 5-10 suggestions
  - `term`: "declaration_irpf"
  - `display`: "Déclaration IRPF"
  - `count`: 12 (nombre documents)
  - `category`: "document_type"
  - `icon`: "📄"
- `data.suggestions` (autre):
  - `term`: "déclaration fiscale"
  - `display`: "Déclaration fiscale"
  - `count`: 8
  - `category`: "free_text"
  - `icon`: "🔍"
- `data.metadata`:
  - `prefix`: "decla"
  - `suggestions_count`: 5
  - `search_time_ms`: 12

### Cas 4 : Recherche par NIF (Match Exact)

**Response contient** :
- `success`: true
- `data.results`: 1 document
- `data.results[0]`:
  - `score`: 100 (match exact)
  - `match_type`: "exact" (vs "fuzzy")
  - `matched_fields`: ["extracted_data.nif"]
  - `highlights`:
    - `field`: "extracted_data.nif"
    - `snippet`: "**123456789**"
  - `score_breakdown`:
    - `exact_match_bonus`: +50

---

## 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | Query vide | query cannot be empty | Fournir texte |
| 400 | Query trop courte | query must be at least 2 characters | Min 2 caractères |
| 400 | Query trop longue | query exceeds 200 characters limit | Max 200 caractères |
| 400 | limit invalide | limit must be between 1 and 100 | Ajuster limit |
| 401 | Non authentifié | Authorization required | Se connecter |
| 422 | Search engine down | Search service temporarily unavailable | Réessayer |
| 429 | Rate limit | Too many search requests (max 60/min) | Attendre |
| 500 | Erreur indexing | Search index error | Contacter support |
| 503 | Elasticsearch down | Elasticsearch unavailable, using fallback | Fonctionnalité réduite |

---

## 7. Métriques Techniques

### Latence
- **P50** : < 150ms (Elasticsearch)
- **P95** : < 300ms
- **P99** : < 500ms
- **PostgreSQL FTS** : +100-200ms (moins performant)

**Facteurs** :
- Taille index (nombre documents)
- Complexité query (nombre termes)
- Filtres combinés
- Highlighting activé

### Throughput
- **Pics** : ~50-100 recherches/minute
- **Moyenne** : ~20-30 recherches/minute

### Taux Succès Recherche
- **Avec résultats** : 85-90%
- **Sans résultats** : 10-15%
- **Cible** : > 85% avec résultats

### Cache
- **Redis TTL** : 5 minutes (requêtes identiques fréquentes)
- **Hit rate** : ~30-40% (queries variées)

### Search Engine Performance

**Elasticsearch** (recommandé) :
- Latence : 50-150ms
- Scaling : Linéaire
- Fuzzy search : Natif
- Highlight : Natif

**PostgreSQL FTS** (fallback) :
- Latence : 100-300ms
- Scaling : Moins bon
- Fuzzy search : Limité (trigram)
- Highlight : ts_headline (OK)

---

## 8. KPIs Métier

### Taux succès recherche
```
Formule : (Recherches avec résultats / Total recherches) × 100
Cible : > 85%
Insight : Si < 80% → Améliorer indexing ou suggestions
```

### Termes recherchés populaires
```
Top 5 :
1. "fiche paie" (25%)
2. "declaration IRPF" (15%)
3. "NIF" (10%)
4. "octobre" / "2024" (8%)
5. Noms propres (12%)

Action : Optimiser indexing ces termes
```

### Taux utilisation suggestions
```
Formule : (Clics sur suggestions / Suggestions affichées) × 100
Actuel : 35%
Insight : Users utilisent suggestions si pertinentes
```

### Temps moyen avant recherche réussie
```
Formule : AVG(première recherche réussie - première recherche tentée)
Cible : < 30 secondes
Insight : Si > 1 minute → UX recherche à améliorer
```

### Taux correction automatique
```
Formule : (Recherches corrigées / Total recherches) × 100
Actuel : 12%
Insight : 12% queries ont typos/erreurs
```

---

## 9. Instrumentation

**Métriques Prometheus** :

```python
documents_search_total = Counter(
    'documents_search_total',
    'Total search requests',
    ['has_results', 'search_engine']
)

documents_search_duration = Histogram(
    'documents_search_duration_seconds',
    'Search duration',
    ['search_engine', 'has_filters'],
    buckets=[0.05, 0.1, 0.2, 0.3, 0.5, 1.0]
)

documents_search_results_count = Histogram(
    'documents_search_results_count',
    'Number of search results',
    buckets=[0, 1, 5, 10, 20, 50, 100]
)

documents_search_terms = Counter(
    'documents_search_terms_total',
    'Search terms frequency',
    ['term']  # Top 100 termes seulement
)

documents_search_corrections = Counter(
    'documents_search_corrections_total',
    'Auto-corrections applied',
    ['correction_type']  # typo, fuzzy, stemming
)

documents_search_cache_hits = Counter(
    'documents_search_cache_hits_total',
    'Search cache hits'
)

documents_autocomplete_requests = Counter(
    'documents_autocomplete_requests_total',
    'Auto-complete requests'
)
```

---

## 10. Sécurité

### Isolation Données (Critical)

**Search DOIT toujours filtrer** :
```
Base filter :
- user_id = current_user.id
- deleted_at IS NULL

Jamais permettre :
- Recherche cross-users (sauf admin)
- Recherche dans documents supprimés (sauf admin avec flag)
```

### Query Sanitization

**Protection injection** :
```
1. Escape special characters : *, ?, ~, ^, ", :, \
2. Limit query length : 200 caractères max
3. Blacklist queries malveillantes :
   - OR 1=1
   - <script>
   - SQL injection patterns
```

### Rate Limiting
```
User : 60 recherches/minute
Agent : 100 recherches/minute
Admin : 200 recherches/minute

Auto-complete : 10 requêtes/seconde (debounce frontend)
```

### Logging Sensible

**NE PAS logger** :
- Queries contenant potentiellement données perso (NIF, noms)
- Résultats complets (RGPD)

**Logger uniquement** :
- Hash(query) pour analytics
- Nombre résultats
- Temps réponse
- Filtres appliqués

### Protection DDoS Search

Si user fait > 100 recherches identiques/minute :
- Return cached result
- Block après 1000 requêtes/minute
- Alert monitoring

---

## 11. Workflow Récapitulatif

### Workflow Recherche Standard (Elasticsearch)
```
┌──────────────────────────────────────────────┐
│ 1. User Request                              │
│    POST /documents/search                    │
│    Body: { query: "fiche paie octobre" }    │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 2. Auth + Validation                         │
│    - Verify JWT token                        │
│    - Validate query (length, characters)     │
│    - Sanitize input (escape specials)        │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 3. Generate Cache Key                        │
│    key = hash(user_id + query + filters)     │
│    = "search:user-123:hash-abc"              │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 4. Check Redis Cache                         │
│    GET "search:user-123:hash-abc"            │
│    ├─ Cache HIT → Return (skip search)       │
│    └─ Cache MISS → Continue                  │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 5. Parse & Analyze Query                     │
│    a) Tokenization                           │
│       "fiche paie octobre"                   │
│       → ["fiche", "paie", "octobre"]         │
│                                              │
│    b) Stemming (optional)                    │
│       → ["fich", "pay", "octobr"]            │
│                                              │
│    c) Detect patterns                        │
│       - NIF pattern? NO                      │
│       - Date pattern? YES ("octobre")        │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 6. Build Elasticsearch Query DSL             │
│    {                                         │
│      "query": {                              │
│        "bool": {                             │
│          "must": [                           │
│            {                                 │
│              "multi_match": {                │
│                "query": "fiche paie octobre",│
│                "fields": [                   │
│                  "file_name^3",              │
│                  "ocr_raw_text^2",           │
│                  "extracted_data.*"          │
│                ],                            │
│                "fuzziness": "AUTO"           │
│              }                               │
│            }                                 │
│          ],                                  │
│          "filter": [                         │
│            {"term": {"user_id": "user-123"}},│
│            {"term": {"deleted_at": null}}    │
│          ]                                   │
│        }                                     │
│      },                                      │
│      "highlight": {                          │
│        "fields": {                           │
│          "file_name": {},                    │
│          "ocr_raw_text": {}                  │
│        }                                     │
│      },                                      │
│      "size": 20                              │
│    }                                         │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 7. Execute Elasticsearch Search              │
│    → Query sent to ES cluster                │
│    → ES searches index "documents"           │
│    → Returns 3 hits with scores              │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 8. Process ES Results                        │
│    For each hit:                             │
│    a) Extract _score → normalize to 0-100    │
│    b) Extract highlights → format snippets   │
│    c) Identify matched_fields                │
│    d) Calculate score_breakdown              │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 9. Enrich Results                            │
│    For each document:                        │
│    - Add permissions (can_view, can_delete)  │
│    - Add action URLs                         │
│    - Format relative dates                   │
│    - Generate thumbnails URLs                │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 10. Generate Suggestions (if few results)    │
│     IF results < 3:                          │
│       - Try fuzzy search more permissive     │
│       - Suggest alternative queries          │
│       - Detect typos → correction            │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 11. Build Response                           │
│     {                                        │
│       results: [3 documents],                │
│       search_metadata: {                     │
│         query: "fiche paie octobre",         │
│         search_time_ms: 45,                  │
│         total_results: 3                     │
│       }                                      │
│     }                                        │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 12. Cache Response (5 min)                   │
│     SET "search:user-123:hash-abc" = response│
│     EXPIRE 300 seconds                       │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 13. Metrics                                  │
│     - Increment documents_search_total       │
│     - Observe documents_search_duration (45ms)│
│     - Observe documents_search_results_count(3)│
│     - Track search terms                     │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ 14. Return Response                          │
│     200 OK                                   │
│     { success: true, data: {...} }           │
└──────────────────────────────────────────────┘
```

### Indexing Strategy (Background Job)

**Quand un document est uploadé (UC-DOC-001)** :
```
1. Document inserted → uploaded_files table

2. OCR completed → ocr_extraction_results table

3. Trigger indexing job (async Celery) :
   a) Fetch document metadata
   b) Fetch OCR results (raw_text)
   c) Fetch extracted_data (structured fields)
   
4. Build search document :
   {
     "id": "DOC-2025-abc123",
     "user_id": "user-123",
     "file_name": "fiche_paie_octobre_2024.pdf",
     "document_type": "payslip",
     "ocr_raw_text": "...",  // Full OCR text
     "extracted_data": {
       "employee_name": "Jean Dupont",
       "gross_salary": 850000,
       ...
     },
     "uploaded_at": "2025-10-31T14:30:00Z",
     "deleted_at": null
   }

5. Index dans Elasticsearch :
   POST /documents/_doc/DOC-2025-abc123

6. Si PostgreSQL FTS :
   UPDATE uploaded_files 
   SET search_vector = to_tsvector('french', 
       file_name || ' ' || ocr_raw_text)
   WHERE id = 'DOC-2025-abc123'
```

### PostgreSQL FTS Setup (Fallback)

**Index creation** :
```sql
-- Add tsvector column
ALTER TABLE uploaded_files 
ADD COLUMN search_vector tsvector;

-- Create GIN index (fast search)
CREATE INDEX idx_search_vector 
ON uploaded_files 
USING GIN(search_vector);

-- Trigger auto-update search_vector
CREATE TRIGGER tsvector_update 
BEFORE INSERT OR UPDATE ON uploaded_files
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.french', 
                          file_name, ocr_raw_text);
```

---

**FIN UC-DOC-006**

**Taille** : ~700 lignes
**Format** : ✅ Littéral (pas de JSON complet)
**Workflow** : ✅ ASCII diagram 14 étapes + Indexing strategy
**Technologies** : ✅ Elasticsearch (recommandé) + PostgreSQL FTS (fallback)
