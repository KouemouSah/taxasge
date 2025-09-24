# CAHIER DES CHARGES BACKEND
# PROJET TAXASGE - SERVICES BACKEND

**Version**: 4.0  
**Date**: 23 juillet 2025  
**Classification**: Spécifications Backend pour Agents IA

---

## 1. ARCHITECTURE GÉNÉRALE BACKEND

### 1.1 Vue d'Ensemble

Le backend TaxasGE est construit sur une architecture de microservices, permettant une scalabilité horizontale et une maintenance modulaire. Chaque service est indépendant et communique via API REST.

### 1.2 Technologies Principales

- **Langage**: Python 3.11+
- **Framework**: FastAPI
- **Base de données**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ (pour phase 2+)
- **Conteneurisation**: Docker
- **Orchestration**: Kubernetes (production)

### 1.3 Principes Architecturaux

1. **API First**: Toutes les fonctionnalités exposées via API REST
2. **Stateless**: Aucun état stocké dans les services
3. **Idempotence**: Toutes les opérations critiques sont idempotentes
4. **Versioning**: API versionnée (v1, v2, etc.)
5. **Documentation**: OpenAPI/Swagger auto-générée

---

## 2. SERVICES MICROSERVICES DÉTAILLÉS

### 2.1 Auth Service (Port 3001)

#### 2.1.1 Responsabilités
- Authentification des utilisateurs
- Gestion des tokens JWT
- Gestion des sessions
- Réinitialisation de mots de passe
- Vérification email/téléphone

#### 2.1.2 Endpoints Principaux

**POST /api/v1/auth/register**
```yaml
description: Enregistrement d'un nouvel utilisateur
request:
  body:
    email: string (required, email format)
    password: string (required, min 8 chars)
    full_name: string (required)
    phone_number: string (optional)
    document_type: enum [dni, pasaporte, nie]
    document_number: string (required)
    language_preference: enum [es, fr, en] (default: es)
response:
  201:
    user_id: uuid
    access_token: string
    refresh_token: string
    expires_in: integer
  400:
    error: string (email déjà existant, validation échouée)
```

**POST /api/v1/auth/login**
```yaml
description: Connexion utilisateur
request:
  body:
    email: string (required)
    password: string (required)
    device_info:
      device_id: string
      device_type: string
      device_name: string
response:
  200:
    access_token: string
    refresh_token: string
    expires_in: integer
    user:
      id: uuid
      email: string
      full_name: string
      role: string
  401:
    error: string (credentials invalides)
  423:
    error: string (compte verrouillé)
    locked_until: timestamp
```

**POST /api/v1/auth/refresh**
```yaml
description: Rafraîchir le token d'accès
request:
  body:
    refresh_token: string (required)
response:
  200:
    access_token: string
    expires_in: integer
  401:
    error: string (refresh token invalide)
```

**POST /api/v1/auth/logout**
```yaml
description: Déconnexion
request:
  headers:
    Authorization: Bearer {access_token}
response:
  200:
    message: string
```

#### 2.1.3 Logique Métier

**Gestion des Tokens**
```python
# Configuration
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
TOKEN_ALGORITHM = "HS256"

# Structure du JWT payload
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "citizen",
  "session_id": "uuid",
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "access|refresh"
}
```

**Sécurité des Mots de Passe**
```python
# Règles de validation
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (optionnel pour MVP)

# Hachage
- Algorithme: bcrypt
- Work factor: 12
```

**Gestion des Sessions**
```python
# Stockage Redis
Key: session:{session_id}
Value: {
  "user_id": "uuid",
  "device_id": "string",
  "created_at": "timestamp",
  "last_activity": "timestamp",
  "ip_address": "string"
}
TTL: 7 jours (aligné avec refresh token)
```

### 2.2 Tax Service (Port 3002)

#### 2.2.1 Responsabilités
- Fournir les informations fiscales
- Recherche de taxes
- Calcul des montants
- Export PDF
- Gestion des favoris

#### 2.2.2 Endpoints Principaux

**GET /api/v1/taxes**
```yaml
description: Liste paginée des taxes
parameters:
  - page: integer (default: 1, min: 1)
  - limit: integer (default: 20, max: 100)
  - ministerio_id: uuid (optional)
  - sector_id: uuid (optional)
  - categoria_id: uuid (optional)
  - sub_categoria_id: uuid (optional)
  - lang: enum [es, fr, en] (default: es)
  - sort_by: enum [code, name, popularity] (default: code)
  - sort_order: enum [asc, desc] (default: asc)
response:
  200:
    data: array
      - id: uuid
        tax_code: string
        nombre: object {es, fr, en}
        monto_expedicion: number (nullable)
        monto_renovacion: number (nullable)
        categoria_path: string
        has_formula: boolean
    meta:
      total: integer
      page: integer
      limit: integer
      pages: integer
    links:
      first: string
      last: string
      next: string (nullable)
      prev: string (nullable)
```

**GET /api/v1/taxes/{tax_code}**
```yaml
description: Détails complets d'une taxe
parameters:
  - tax_code: string (required, path)
  - lang: enum [es, fr, en] (default: es)
response:
  200:
    tax:
      id: uuid
      tax_code: string
      nombre: object {es, fr, en}
      # Montants (données actuelles)
      monto_expedicion: number (nullable)
      monto_renovacion: number (nullable)
      # Calcul (pour quelques taxes)
      formula_calculo: object (nullable)
      # Hiérarchie
      categoria_path: string
      ministerio: object {id, nombre}
      sector: object {id, nombre}
      categoria: object {id, nombre}
      sub_categoria: object {id, nombre}
      # Documents et procédures
      documentos_requeridos: array
        - id: uuid
          nombre: object {es, fr, en}
          obligatorio: boolean
          tipo_archivo: string
      procedimientos: array
        - id: uuid
          step_number: integer
          descripcion: object {es, fr, en}
      # Métadonnées
      periodicidad: string (default: anual)
      base_legal: string (nullable)
      # Statistiques
      vistas_contador: integer
      favoritos_contador: integer
  404:
    error: string (taxe non trouvée)
```

**GET /api/v1/taxes/search**
```yaml
description: Recherche de taxes
parameters:
  - q: string (required, min: 3 chars)
  - lang: enum [es, fr, en] (default: es)
  - limit: integer (default: 10, max: 50)
  - search_in: array [name, code, keywords, description] (default: all)
response:
  200:
    query: string
    results: array
      - tax_code: string
        nombre: string (dans la langue demandée)
        match_type: enum [exact, partial, keyword]
        relevance_score: float (0-1)
        highlight: string (extrait avec termes surlignés)
    total: integer
    took_ms: integer
```

**POST /api/v1/taxes/{tax_code}/calculate**
```yaml
description: Calculer le montant d'une taxe
parameters:
  - tax_code: string (required, path)
request:
  body:
    type: enum [expedicion, renovacion] (required)
    base_amount: number (optional, pour taxes calculées)
    parameters: object (optional, paramètres additionnels)
response:
  200:
    calculation:
      type: string
      method: enum [fixed, percentage, formula]
      base_amount: number (si applicable)
      calculated_amount: number
      currency: string (XAF)
      details:
        rate: number (si percentage)
        formula: string (si formula)
        breakdown: array (détail du calcul)
  400:
    error: string (paramètres manquants pour le calcul)
```

**POST /api/v1/taxes/{tax_code}/favorite**
```yaml
description: Ajouter/retirer des favoris
parameters:
  - tax_code: string (required, path)
request:
  headers:
    Authorization: Bearer {token}
  body:
    action: enum [add, remove]
response:
  200:
    favorited: boolean
    message: string
```

**GET /api/v1/taxes/{tax_code}/export/pdf**
```yaml
description: Exporter les infos d'une taxe en PDF
parameters:
  - tax_code: string (required, path)
  - lang: enum [es, fr, en] (default: es)
  - include_docs: boolean (default: true)
  - include_procedures: boolean (default: true)
response:
  200:
    content-type: application/pdf
    content-disposition: attachment; filename="{tax_code}_info.pdf"
    body: binary (PDF file)
```

#### 2.2.3 Logique de Calcul

**Algorithme de Calcul des Taxes**
```python
def calculate_tax_amount(tax, calc_type, base_amount=None):
    """
    Priorité de calcul:
    1. Montant fixe (monto_expedicion/renovacion)
    2. Formule de calcul (si existe)
    3. Erreur si aucune méthode disponible
    """
    
    if calc_type == 'expedicion':
        if tax.monto_expedicion is not None:
            return {
                'method': 'fixed',
                'amount': tax.monto_expedicion,
                'currency': 'XAF'
            }
    elif calc_type == 'renovacion':
        if tax.monto_renovacion is not None:
            return {
                'method': 'fixed',
                'amount': tax.monto_renovacion,
                'currency': 'XAF'
            }
    
    # Si pas de montant fixe, vérifier la formule
    if tax.formula_calculo and base_amount:
        return apply_formula(tax.formula_calculo, base_amount)
    
    raise CalculationError("Impossible de calculer le montant")
```

**Parsing des Montants depuis les Données Actuelles**
```python
def parse_amount_string(amount_str):
    """
    Convertit "1000 XAF" → 1000.00
    Gère différents formats possibles
    """
    if not amount_str:
        return None
    
    # Patterns à détecter
    patterns = [
        r'(\d+(?:\.\d+)?)\s*XAF',
        r'(\d+(?:\.\d+)?)\s*FCFA',
        r'(\d+(?:\.\d+)?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, amount_str)
        if match:
            return float(match.group(1))
    
    return None
```

### 2.3 Sync Service (Port 3003)

#### 2.3.1 Responsabilités
- Synchronisation PostgreSQL → SQLite (mobile)
- Gestion des versions de données
- Compression et optimisation
- Résolution des conflits
- Synchronisation différentielle

#### 2.3.2 Endpoints Principaux

**GET /api/v1/sync/check**
```yaml
description: Vérifier les mises à jour disponibles
parameters:
  - client_version: integer (required)
  - tables: array (optional, default: all)
request:
  headers:
    Authorization: Bearer {token}
response:
  200:
    has_updates: boolean
    current_version: integer
    updates_available:
      taxes: boolean
      documentos: boolean
      procedimientos: boolean
      categorias: boolean
    estimated_size_kb: integer
```

**GET /api/v1/sync/data**
```yaml
description: Télécharger les données pour synchronisation
parameters:
  - since_version: integer (required)
  - tables: array (optional)
  - compressed: boolean (default: true)
request:
  headers:
    Authorization: Bearer {token}
response:
  200:
    version: integer
    timestamp: datetime
    data:
      taxes: array (seulement les modifiées)
      documentos_requeridos: array
      procedimientos: array
      # etc...
    deleted:
      taxes: array (IDs supprimés)
      # etc...
    checksum: string (MD5 des données)
```

**POST /api/v1/sync/acknowledge**
```yaml
description: Confirmer la réception des données
request:
  headers:
    Authorization: Bearer {token}
  body:
    version: integer
    checksum: string
    device_id: string
response:
  200:
    acknowledged: boolean
    next_sync: datetime (suggestion)
```

#### 2.3.3 Stratégies de Synchronisation

**Compression des Données**
```python
def compress_for_mobile(data):
    """
    Optimise les données pour le stockage mobile
    """
    compressed = {}
    
    for key, value in data.items():
        # Supprimer les champs NULL
        if value is not None:
            # Supprimer les champs vides
            if isinstance(value, str) and value.strip():
                compressed[key] = value
            elif not isinstance(value, str):
                compressed[key] = value
    
    return compressed
```

**Gestion des Versions**
```python
# Structure de versioning
sync_versions = {
    "version": 1234,
    "timestamp": "2025-07-23T10:00:00Z",
    "tables": {
        "taxes": 1234,
        "ministerios": 1200,
        "sectores": 1200,
        # etc...
    }
}
```

### 2.4 Analytics Service (Port 3004)

#### 2.4.1 Responsabilités
- Collecte des métriques d'usage
- Agrégation des statistiques
- Génération de rapports DGI
- Export de données anonymisées

#### 2.4.2 Endpoints Principaux

**POST /api/v1/analytics/events**
```yaml
description: Enregistrer des événements utilisateur
request:
  headers:
    Authorization: Bearer {token}
  body:
    events: array
      - event_type: string (tax_view, search, calculate, etc.)
        tax_code: string (optional)
        timestamp: datetime
        context:
          screen: string
          action: string
          duration_ms: integer
response:
  202:
    accepted: boolean
    count: integer
```

**GET /api/v1/analytics/dashboard**
```yaml
description: Données pour dashboard DGI (phase 3)
parameters:
  - date_from: date (required)
  - date_to: date (required)
  - metrics: array (optional)
request:
  headers:
    Authorization: Bearer {token} (role: dgi_agent)
response:
  200:
    period:
      from: date
      to: date
    metrics:
      total_users: integer
      active_users: integer
      total_searches: integer
      total_calculations: integer
      most_viewed_taxes: array
        - tax_code: string
          views: integer
          calculations: integer
      search_terms: array
        - term: string
          count: integer
          language: string
```

**GET /api/v1/analytics/reports/usage**
```yaml
description: Rapport d'utilisation détaillé
parameters:
  - period: enum [daily, weekly, monthly]
  - format: enum [json, csv, excel]
request:
  headers:
    Authorization: Bearer {token} (role: dgi_agent)
response:
  200:
    # Si JSON
    report:
      summary: object
      details: array
    # Si CSV/Excel
    content-type: text/csv ou application/vnd.ms-excel
    body: binary
```

---

## 3. ARCHITECTURE DE DONNÉES

### 3.1 Modèles de Données

#### 3.1.1 Règles de Sérialisation

```python
class SerializationRules:
    # Champs toujours inclus (jamais NULL dans nos données)
    ALWAYS_INCLUDE = [
        'id', 'tax_code', 'nombre_es', 'nombre_fr', 'nombre_en',
        'monto_expedicion', 'monto_renovacion', 'documentos_requeridos',
        'procedimientos'
    ]
    
    # Champs conditionnels (inclure si non NULL)
    INCLUDE_IF_NOT_NULL = [
        'descripcion_es', 'descripcion_fr', 'descripcion_en',
        'formula_calculo', 'base_legal', 'periodicidad',
        'fecha_limite_es', 'fecha_limite_fr', 'fecha_limite_en'
    ]
    
    # Champs à exclure si NULL (éviter confusion)
    EXCLUDE_IF_NULL = [
        'penalidad_retraso_porcentaje', 'penalidad_retraso_fija',
        'exenciones', 'requisitos_exencion_es'
    ]
```

#### 3.1.2 Validation des Données

```python
class DataValidators:
    @staticmethod
    def validate_tax_for_api(tax_data):
        """Valide qu'une taxe a les données minimales"""
        required = ['tax_code', 'nombre_es', 'nombre_fr', 'nombre_en']
        
        # Vérifier les champs requis
        for field in required:
            if not tax_data.get(field):
                raise ValidationError(f"Champ requis manquant: {field}")
        
        # Au moins un montant doit exister
        has_amount = any([
            tax_data.get('monto_expedicion'),
            tax_data.get('monto_renovacion'),
            tax_data.get('formula_calculo')
        ])
        
        if not has_amount:
            raise ValidationError("Aucun montant disponible pour cette taxe")
        
        return True
```

### 3.2 Cache Strategy

#### 3.2.1 Redis Cache Configuration

```python
CACHE_CONFIG = {
    'taxes': {
        'ttl': 3600,  # 1 heure
        'key_pattern': 'tax:{tax_code}:{lang}',
        'invalidate_on': ['tax_update', 'sync_complete']
    },
    'search': {
        'ttl': 900,  # 15 minutes
        'key_pattern': 'search:{query_hash}:{lang}',
        'max_entries': 1000
    },
    'calculations': {
        'ttl': 86400,  # 24 heures
        'key_pattern': 'calc:{tax_code}:{type}:{amount}',
        'max_entries': 5000
    }
}
```

#### 3.2.2 Cache Invalidation

```python
def invalidate_tax_cache(tax_code):
    """Invalide le cache pour une taxe modifiée"""
    patterns = [
        f'tax:{tax_code}:*',
        f'calc:{tax_code}:*',
        'search:*'  # Invalider toutes les recherches
    ]
    
    for pattern in patterns:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
```

---

## 4. INTÉGRATION ET COMMUNICATION

### 4.1 Communication Inter-Services

#### 4.1.1 Protocole
- **Format**: JSON
- **Encoding**: UTF-8
- **Compression**: gzip pour payloads > 1KB
- **Timeout**: 30 secondes par défaut

#### 4.1.2 Headers Standards
```http
Content-Type: application/json
Accept: application/json
Accept-Language: es|fr|en
X-Request-ID: uuid
X-Client-Version: 1.0.0
X-Device-ID: string (mobile uniquement)
Authorization: Bearer {token}
```

### 4.2 Gestion des Erreurs

#### 4.2.1 Format Standard des Erreurs
```json
{
  "error": {
    "code": "TAX_NOT_FOUND",
    "message": "La taxe demandée n'existe pas",
    "details": {
      "tax_code": "T-999",
      "suggestion": "Vérifiez le code de la taxe"
    },
    "timestamp": "2025-07-23T10:00:00Z",
    "request_id": "uuid"
  }
}
```

#### 4.2.2 Codes d'Erreur Standards
```python
ERROR_CODES = {
    # Auth Service (AUTH_*)
    'AUTH_INVALID_CREDENTIALS': 401,
    'AUTH_TOKEN_EXPIRED': 401,
    'AUTH_ACCOUNT_LOCKED': 423,
    'AUTH_EMAIL_EXISTS': 409,
    
    # Tax Service (TAX_*)
    'TAX_NOT_FOUND': 404,
    'TAX_CALCULATION_ERROR': 400,
    'TAX_INVALID_PARAMETERS': 400,
    
    # Sync Service (SYNC_*)
    'SYNC_VERSION_MISMATCH': 409,
    'SYNC_CHECKSUM_ERROR': 400,
    
    # Général
    'VALIDATION_ERROR': 400,
    'SERVER_ERROR': 500,
    'RATE_LIMIT_EXCEEDED': 429
}
```

---

## 5. PERFORMANCE ET OPTIMISATION

### 5.1 Objectifs de Performance

- **Latence API**: < 200ms (P95)
- **Throughput**: 1000 req/s par service
- **Disponibilité**: 99.9% uptime
- **Taille réponse**: < 100KB (compressé)

### 5.2 Stratégies d'Optimisation

#### 5.2.1 Database
```sql
-- Index essentiels
CREATE INDEX idx_taxes_code ON taxes(tax_code);
CREATE INDEX idx_taxes_search ON taxes USING gin(
    to_tsvector('spanish', nombre_es) || 
    to_tsvector('french', nombre_fr) || 
    to_tsvector('english', nombre_en)
);
CREATE INDEX idx_documentos_tax ON documentos_requeridos(tax_id);
CREATE INDEX idx_procedimientos_tax ON procedimientos(tax_id, step_number);
```

#### 5.2.2 Pagination
```python
class PaginationParams:
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 100
    
    @staticmethod
    def validate(page, limit):
        page = max(1, page)
        limit = min(max(1, limit), PaginationParams.MAX_LIMIT)
        offset = (page - 1) * limit
        return page, limit, offset
```

### 5.3 Monitoring

#### 5.3.1 Métriques Clés
```python
METRICS = {
    'api_request_duration': Histogram,
    'api_request_count': Counter,
    'api_error_count': Counter,
    'db_query_duration': Histogram,
    'cache_hit_rate': Gauge,
    'active_users': Gauge
}
```

#### 5.3.2 Health Checks
```python
@app.get("/health")
async def health_check():
    checks = {
        'database': check_database(),
        'redis': check_redis(),
        'disk_space': check_disk_space(),
        'memory': check_memory()
    }
    
    status = 'healthy' if all(checks.values()) else 'unhealthy'
    
    return {
        'status': status,
        'timestamp': datetime.utcnow().isoformat(),
        'checks': checks,
        'version': APP_VERSION
    }
```

---

## 6. DÉPLOIEMENT ET ENVIRONNEMENTS

### 6.1 Configuration par Environnement

```yaml
environments:
  development:
    database_url: postgresql://dev_user:pass@localhost/taxasge_dev
    redis_url: redis://localhost:6379/0
    log_level: DEBUG
    debug_mode: true
    
  staging:
    database_url: ${STAGING_DB_URL}
    redis_url: ${STAGING_REDIS_URL}
    log_level: INFO
    debug_mode: false
    
  production:
    database_url: ${PROD_DB_URL}
    redis_url: ${PROD_REDIS_URL}
    log_level: WARNING
    debug_mode: false
    enable_metrics: true
```

### 6.2 Variables d'Environnement Requises

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Redis
REDIS_URL=redis://host:6379/0
REDIS_MAX_CONNECTIONS=50

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256

# API
API_VERSION=v1
API_RATE_LIMIT=100
API_TIMEOUT=30

# Services URLs (pour inter-communication)
AUTH_SERVICE_URL=http://auth-service:3001
TAX_SERVICE_URL=http://tax-service:3002
SYNC_SERVICE_URL=http://sync-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:3004

# Monitoring
PROMETHEUS_PORT=9090
LOG_LEVEL=INFO
```

---

## 7. TESTS ET QUALITÉ

### 7.1 Stratégie de Tests

#### 7.1.1 Types de Tests
1. **Unit Tests**: Couverture minimale 80%
2. **Integration Tests**: Tous les endpoints
3. **Load Tests**: 1000 req/s minimum
4. **Security Tests**: OWASP Top 10

#### 7.1.2 Données de Test
```python
TEST_DATA = {
    'taxes': [
        {
            'tax_code': 'T-TEST-001',
            'nombre_es': 'Impuesto de Prueba',
            'monto_expedicion': 1000.0,
            'monto_renovacion': 500.0
        }
    ],
    'users': [
        {
            'email': 'test@taxasge.gq',
            'password': 'Test123!',
            'role': 'citizen'
        }
    ]
}
```

### 7.2 Standards de Code

#### 7.2.1 Python
- **Style**: PEP 8
- **Docstrings**: Google style
- **Type hints**: Obligatoires
- **Linting**: flake8, black, mypy

#### 7.2.2 API
- **Naming**: snake_case pour JSON
- **Dates**: ISO 8601
- **Pagination**: Standard (page, limit)
- **Versioning**: URL path (/api/v1/)

---

**FIN DU CAHIER DES CHARGES BACKEND**

Ce document définit toutes les spécifications backend nécessaires aux agents IA pour implémenter les services. Il doit être utilisé conjointement avec les autres cahiers des charges du projet TaxasGE.
