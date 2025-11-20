# 🚀 TaxasGE API Gateway

## 🎯 **Vue d'Ensemble**

Le **TaxasGE API Gateway** est le point d'entrée centralisé pour toutes les API de la plateforme fiscale de Guinée Équatoriale. Il gère **8507 services fiscaux**, les **endpoints admin complets**, l'**authentification**, le **rate limiting**, le **monitoring** et la **sécurité**.

### ✨ **Fonctionnalités Principales**

- 🔐 **Authentification centralisée** (JWT + API Keys)
- 🛡️ **Autorisation granulaire** (RBAC avec permissions)
- ⚡ **Rate limiting intelligent** par utilisateur/endpoint
- 📊 **Monitoring temps réel** (Prometheus + métriques custom)
- 🗄️ **Cache Redis** intelligent avec TTL configurables
- 🔄 **Circuit breaker** pour resilience
- 📝 **Logging unifié** avec tracing
- 🌐 **Support multilingue** (ES/FR/EN)

---

## 🏗️ **Architecture**

```
gateway/
├── main.py                 # Point d'entrée principal
├── config/                 # Configuration centralisée
│   ├── settings.py         # Settings globaux
│   ├── routing_config.py   # Configuration routes
│   └── security_config.py  # Configuration sécurité
├── middleware/             # Middleware stack
│   ├── authentication.py   # Authentification JWT
│   ├── authorization.py    # Autorisation RBAC
│   ├── rate_limiting.py    # Limitation de taux
│   ├── logging.py          # Logging unifié
│   ├── monitoring.py       # Métriques Prometheus
│   └── cors.py             # CORS personnalisé
├── routes/                 # Routage centralisé
│   └── v1/
│       ├── registry.py     # Registre central
│       ├── public.py       # Routes publiques
│       ├── authenticated.py # Routes authentifiées
│       └── admin.py        # Routes admin
├── security/               # Gestion sécurité
│   ├── jwt_manager.py      # Gestion JWT
│   ├── api_keys.py         # Gestion API keys
│   ├── permissions.py      # Système permissions
│   └── encryption.py       # Chiffrement
├── services/               # Services infrastructure
│   ├── discovery.py        # Service discovery
│   ├── health_check.py     # Health monitoring
│   ├── load_balancer.py    # Load balancing
│   └── circuit_breaker.py  # Circuit breaker
└── utils/                  # Utilitaires
    ├── response_formatter.py # Formatage réponses
    ├── error_handler.py    # Gestion erreurs
    ├── validators.py       # Validation requests
    └── cache_manager.py    # Gestion cache
```

---

## 🚀 **Démarrage Rapide**

### 1. **Installation**

```bash
cd packages/backend/gateway
pip install -r requirements.txt
```

### 2. **Configuration**

Créer un fichier `.env` :

```env
# Environment
ENVIRONMENT=development
DEBUG=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/taxasge

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
JWT_EXPIRY_HOURS=24

# Rate Limiting
DEFAULT_RATE_LIMIT=1000
AUTH_RATE_LIMIT=10
ADMIN_RATE_LIMIT=5000
```

### 3. **Lancement**

```bash
# Mode développement
python main.py

# Mode production avec Gunicorn
gunicorn gateway.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 4. **Vérification**

```bash
# Health check
curl http://localhost:8000/gateway/health

# Routes disponibles
curl http://localhost:8000/gateway/routes

# Métriques
curl http://localhost:8000/gateway/metrics
```

---

## 📊 **Endpoints Disponibles**

### **🔓 Routes Publiques**
- `GET /api/v1/public/services` - 846 services fiscaux
- `GET /api/v1/public/services/search` - Recherche (19,388 procédures)
- `GET /api/v1/public/hierarchy` - Hiérarchie (14→16→86→547)
- `POST /api/v1/public/auth/login` - Authentification

### **🔐 Routes Authentifiées**
- `GET /api/v1/users/profile` - Profil utilisateur
- `POST /api/v1/services/{id}/calculate` - Calculs fiscaux
- `GET /api/v1/users/favorites` - Services favoris
- `POST /api/v1/declarations` - Déclarations fiscales
- `POST /api/v1/payments/initiate` - Paiements BANGE
- `POST /api/v1/ai/chat` - Assistant IA

### **🛡️ Routes Admin**
- `GET /api/v1/admin/services` - CRUD 547 services
- `POST /api/v1/admin/services/bulk-update` - Mise à jour masse
- `GET /api/v1/admin/declarations` - Suivi déclarations
- `GET /api/v1/admin/analytics/revenue` - Analytics paiements
- `GET /api/v1/admin/users` - Gestion utilisateurs
- `GET /api/v1/admin/audit/logs` - Logs audit

---

## 🔐 **Authentification**

### **JWT Tokens**

```python
# Structure token JWT
{
  "sub": "user_uuid",
  "email": "user@example.gq",
  "role": "citizen|business|admin|dgi_agent",
  "permissions": ["services:read", "declarations:write"],
  "exp": 1640995200
}
```

### **API Keys** (pour développeurs)

```bash
# Header requis pour certains endpoints
X-API-Key: your-api-key-here
```

### **Permissions RBAC**

| Rôle | Permissions | Description |
|------|-------------|-------------|
| `citizen` | `services:read`, `declarations:write` | Citoyen standard |
| `business` | `citizen` + `bulk:operations` | Entreprise/comptable |
| `dgi_agent` | `business` + `admin:declarations` | Agent DGI |
| `admin` | `all:permissions` | Administrateur |

---

## ⚡ **Rate Limiting**

### **Limites par Défaut**

```yaml
Authentification: 10 requêtes/5min
Services fiscaux: 1000 requêtes/heure
Admin endpoints: 5000 requêtes/heure
IA Assistant: 100 requêtes/heure
Paiements: 50 transactions/heure
```

### **Headers de Réponse**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 📊 **Monitoring**

### **Métriques Prometheus**

- `api_requests_total` - Nombre total de requêtes
- `api_request_duration_seconds` - Durée des requêtes
- `api_active_requests` - Requêtes actives
- `cache_hit_rate` - Taux de cache hit
- `circuit_breaker_state` - État circuit breaker

### **Health Checks**

```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "services": "healthy"
  },
  "uptime_seconds": 3600
}
```

---

## 🗄️ **Cache Strategy**

### **TTL par Type d'Endpoint**

| Endpoint | TTL | Justification |
|----------|-----|---------------|
| Services fiscaux | 1h | Données stables |
| Hiérarchie | 2h | Structure administrative |
| Analytics | 30min | Données business |
| Profils utilisateur | 5min | Données personnelles |

### **Clés de Cache**

```
service:{service_id}
hierarchy:ministries
user:profile:{user_id}
analytics:revenue:{date}
```

---

## 🛡️ **Sécurité**

### **Headers de Sécurité**

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### **Validation des Requêtes**

- Validation Pydantic des schemas
- Sanitization des entrées
- Rate limiting par IP et utilisateur
- Protection CSRF pour modifications

---

## 📝 **Logging**

### **Format des Logs**

```json
{
  "timestamp": "2025-09-29T10:30:00Z",
  "level": "INFO",
  "method": "GET",
  "path": "/api/v1/services",
  "status_code": 200,
  "response_time_ms": 45,
  "user_id": "uuid",
  "ip_address": "1.2.3.4",
  "user_agent": "TaxasGE Mobile/2.0"
}
```

### **Niveaux de Log**

- `DEBUG` - Détails techniques (dev only)
- `INFO` - Requêtes normales
- `WARNING` - Problèmes non critiques
- `ERROR` - Erreurs applicatives
- `CRITICAL` - Erreurs système

---

## 🔧 **Configuration Avancée**

### **Variables d'Environnement**

```env
# Performance
MAX_REQUEST_SIZE=10000000
REQUEST_TIMEOUT=30

# Cache
DEFAULT_CACHE_TTL=3600
MAX_CACHE_SIZE=1000

# Security
SECURITY_HEADERS=true
CORS_ORIGINS=https://taxasge.gq

# Monitoring
ENABLE_METRICS=true
METRICS_ENDPOINT=/gateway/metrics

# External Services
FIREBASE_PROJECT_ID=taxasge-pro
SENTRY_DSN=https://...
```

### **Configuration Routes**

```python
# gateway/config/routing_config.py
ROUTE_CONFIG = {
    "rate_limits": {
        "/api/v1/auth/": {"requests": 10, "window": 300},
        "/api/v1/services/": {"requests": 1000, "window": 3600},
        "/api/v1/admin/": {"requests": 5000, "window": 3600}
    },
    "cache_config": {
        "/api/v1/services": {"ttl": 3600},
        "/api/v1/hierarchy": {"ttl": 7200}
    }
}
```

---

## 🚀 **Déploiement**

### **Docker**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "gateway.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### **Kubernetes**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taxasge-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: taxasge-gateway
  template:
    spec:
      containers:
      - name: gateway
        image: taxasge/gateway:2.0.0
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
```

### **Firebase Functions**

```python
# Déploiement Firebase Functions
from firebase_functions import https_fn
from gateway.main import app

@https_fn.on_request(cors=True)
def main(req: https_fn.Request) -> https_fn.Response:
    return app(req)
```

---

## 📈 **Performance**

### **Benchmarks**

- **Latence**: <100ms (p95)
- **Throughput**: 1000+ req/s
- **Concurrence**: 10,000 utilisateurs simultanés
- **Disponibilité**: 99.9% SLA

### **Optimisations**

- Connection pooling PostgreSQL (50 connections)
- Redis cluster pour cache distribué
- Compression gzip/brotli
- CDN pour assets statiques
- Load balancing avec health checks

---

## 🐛 **Debugging**

### **Logs Utiles**

```bash
# Logs temps réel
tail -f logs/gateway.log

# Erreurs seulement
tail -f logs/gateway.log | grep ERROR

# Requêtes lentes
tail -f logs/gateway.log | grep "response_time_ms\":[5-9][0-9][0-9]"
```

### **Métriques Debug**

```bash
# Requêtes par endpoint
curl http://localhost:8000/gateway/metrics | grep api_requests_total

# Taux d'erreur
curl http://localhost:8000/gateway/metrics | grep error_rate

# État circuit breaker
curl http://localhost:8000/gateway/stats | jq '.circuit_breaker_stats'
```

---

## 🤝 **Contribution**

### **Structure du Code**

- **PEP 8** pour le style Python
- **Type hints** obligatoires
- **Docstrings** pour toutes les fonctions publiques
- **Tests unitaires** minimum 80% coverage

### **Ajout d'Endpoints**

1. Définir route dans `registry.py`
2. Créer handler dans `app/handlers/`
3. Ajouter permissions si nécessaire
4. Configurer rate limiting
5. Ajouter tests

---

## 📞 **Support**

- **Documentation**: `/gateway/docs`
- **Health Check**: `/gateway/health`
- **Métriques**: `/gateway/metrics`
- **Issues**: GitHub Issues
- **Contact**: libressai@gmail.com

---

**🏛️ TaxasGE API Gateway - Powered by FastAPI + Firebase Functions**
*Version 2.0.0 - Production Ready*