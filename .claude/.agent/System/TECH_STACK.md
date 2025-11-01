# 🛠️ TECH STACK - TAXASGE BACKEND

**Version** : 1.0  
**Date** : 2025-10-20  
**Projet** : TaxasGE Backend (FastAPI + PostgreSQL)

---

## 📋 VUE D'ENSEMBLE

```
TaxasGE Backend Stack
├── Language : Python 3.11+
├── Framework : FastAPI 0.104+
├── Database : PostgreSQL 15+ (via Supabase)
├── Auth : JWT + Supabase Auth
├── Storage : Firebase Storage
├── Payments : BANGE API (Mobile Money Cameroun)
├── OCR : Tesseract + Google Vision API
├── AI : TensorFlow Lite (assistant fiscal)
└── Monitoring : Prometheus + Grafana (Phase 6)
```

---

## 🐍 PYTHON & DEPENDENCIES

### Version Python
```
Python 3.11+
```

**Pourquoi 3.11+ ?**
- Performance améliorée (10-60% plus rapide vs 3.10)
- Meilleure gestion erreurs (PEP 654)
- Type hints améliorés
- Support async/await optimal

### Core Dependencies

**Source** : D'après `PROJECT_CONTEXT.md` et code existant dans `packages/backend/`

```python
# requirements.txt (core)
fastapi==0.104.1           # Framework web
uvicorn==0.24.0            # ASGI server
pydantic==2.5.0            # Validation données
pydantic-settings==2.1.0   # Configuration
python-jose[cryptography]  # JWT
passlib[bcrypt]            # Hashing passwords
python-multipart           # Upload fichiers
```

### Database & ORM

```python
# Database
asyncpg==0.29.0            # Driver PostgreSQL async
supabase==2.3.0            # Client Supabase (Auth + Database)

# Pas d'ORM pour l'instant
# Note : Utilisation queries SQL directes via asyncpg + Supabase
```

**Pourquoi pas d'ORM ?**
- Plus de contrôle sur les requêtes
- Performances optimales
- Moins d'abstraction = moins de bugs cachés
- Schéma database déjà défini dans `database/schema_taxasge.sql`

### External Services

```python
# Firebase
firebase-admin==6.3.0      # Firebase Storage

# BANGE Payments
httpx==0.25.0              # HTTP client async
cryptography==41.0.7       # HMAC signature validation

# OCR
pytesseract==0.3.10        # Tesseract wrapper
Pillow==10.1.0             # Image processing
google-cloud-vision==3.5.0 # Google Vision API

# AI (Phase future)
tensorflow-lite==2.15.0    # TF Lite pour inférence
```

### Dev & Testing

```python
# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.0              # Test client HTTP

# Linting & Formatting
black==23.11.0             # Code formatter
flake8==6.1.0              # Linter
mypy==1.7.1                # Type checker
isort==5.12.0              # Import sorting

# Development
python-dotenv==1.0.0       # .env loading
```

---

## ⚡ FASTAPI FRAMEWORK

### Architecture FastAPI

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TaxasGE API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
from app.api.v1 import auth, users, declarations, payments, ...
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
# ...
```

### Structure Application

**Source** : D'après `PROJECT_CONTEXT.md`

```
packages/backend/
├── main.py (328 lignes)          # Application principale
├── app/
│   ├── config.py (389 lignes)    # Configuration Pydantic Settings
│   ├── api/v1/                   # Routes API (11 fichiers, 4,187 lignes)
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── declarations.py
│   │   ├── payments.py
│   │   ├── documents.py
│   │   ├── fiscal_services.py
│   │   ├── agents.py
│   │   ├── admin.py
│   │   ├── notifications.py
│   │   └── webhooks.py
│   ├── services/                 # Services métier (11 fichiers, 2,703 lignes)
│   │   ├── auth_service.py
│   │   ├── payment_service.py
│   │   ├── ocr_service.py
│   │   ├── ai_services.py
│   │   └── ...
│   ├── database/
│   │   └── repositories/         # ✅ UTILISER CE DOSSIER
│   │       ├── user_repository.py
│   │       ├── declaration_repository.py
│   │       ├── payment_repository.py
│   │       └── ...
│   ├── models/                   # Pydantic models
│   │   ├── user.py
│   │   ├── declaration.py
│   │   ├── payment.py
│   │   └── ...
│   └── utils/                    # Utilitaires
│       ├── security.py
│       ├── validators.py
│       └── ...
└── tests/                        # Tests pytest
    ├── conftest.py               # Fixtures
    ├── use_cases/                # Tests use cases
    └── e2e/                      # Tests E2E
```

### Patterns FastAPI Utilisés

**1. Dependency Injection**
```python
from fastapi import Depends, HTTPException
from app.database.repositories.user_repository import UserRepository

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends()
) -> User:
    # Validation JWT + récupération user
    pass

@router.get("/me")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user
```

**2. Pydantic Models**
```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    phone: str | None = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # Pour ORM compatibility
```

**3. Error Handling (RFC 7807)**
```python
from fastapi import HTTPException, status

class TaxasGEException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str,
        errors: list | None = None
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "type": f"https://taxasge.com/errors/{error_code}",
                "title": detail,
                "status": status_code,
                "detail": detail,
                "errors": errors or []
            }
        )
```

---

## 🗄️ DATABASE - POSTGRESQL + SUPABASE

### Configuration

**Source** : D'après `PROJECT_CONTEXT.md` - fichier .env existe déjà

```bash
# .env (packages/backend/.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
DATABASE_URL=postgresql://user:pass@host:5432/taxasge
```

### Connexion Database

```python
# app/database/connection.py
import asyncpg
from app.config import settings

class Database:
    _pool: asyncpg.Pool | None = None
    
    @classmethod
    async def connect(cls):
        cls._pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
    
    @classmethod
    async def disconnect(cls):
        if cls._pool:
            await cls._pool.close()
    
    @classmethod
    def get_pool(cls) -> asyncpg.Pool:
        if not cls._pool:
            raise RuntimeError("Database not connected")
        return cls._pool
```

### Schéma Database

**Source** : `database/schema_taxasge.sql`

**Tables principales** (d'après `PROJECT_CONTEXT.md` et rapports) :

```sql
-- Users & Auth
users (id, email, password_hash, role, ...)
user_profiles (user_id, full_name, phone, tax_id, ...)
user_sessions (id, user_id, token, expires_at, ...)

-- Declarations
declarations (id, user_id, service_id, reference, status, amount, ...)
declaration_documents (id, declaration_id, document_id, ...)
declaration_events (id, declaration_id, event_type, metadata, ...)

-- Payments
payments (id, declaration_id, amount, status, provider, ...)
payment_transactions (id, payment_id, external_id, status, ...)

-- Documents
documents (id, user_id, filename, file_url, ocr_status, ...)
document_extractions (id, document_id, extracted_data, confidence, ...)

-- Fiscal Services
fiscal_services (id, code, name, category, base_amount, ...)

-- Admin & Agents
agents (id, user_id, specialization, status, ...)
agent_assignments (id, agent_id, declaration_id, assigned_at, ...)

-- Notifications
notifications (id, user_id, type, title, message, read, ...)

-- Audits
audit_logs (id, user_id, action, resource, metadata, ...)
```

### Repository Pattern

**Exemple** : `app/database/repositories/user_repository.py`

```python
import asyncpg
from app.database.connection import Database
from app.models.user import User, UserCreate

class UserRepository:
    async def create(self, user_data: UserCreate) -> User:
        pool = Database.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO users (email, password_hash, role)
                VALUES ($1, $2, $3)
                RETURNING *
                """,
                user_data.email,
                user_data.password_hash,
                "user"
            )
            return User(**dict(row))
    
    async def get_by_email(self, email: str) -> User | None:
        pool = Database.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1",
                email
            )
            return User(**dict(row)) if row else None
```

---

## 🔐 AUTHENTICATION - JWT + SUPABASE

### JWT Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### JWT Utils

```python
# app/utils/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import settings

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Supabase Auth (Optionnel)

```python
# Alternative : Utiliser Supabase Auth au lieu de JWT custom
from supabase import create_client
from app.config import settings

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

# Sign up
response = supabase.auth.sign_up({
    "email": "user@example.com",
    "password": "password123"
})

# Sign in
response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "password123"
})
```

---

## 🔥 FIREBASE STORAGE

### Configuration

```bash
# .env
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_STORAGE_BUCKET=taxasge-documents
```

### Firebase Admin SDK

```python
# app/services/storage_service.py
import firebase_admin
from firebase_admin import credentials, storage
from app.config import settings

# Initialize
cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
firebase_admin.initialize_app(cred, {
    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
})

bucket = storage.bucket()

async def upload_file(file: UploadFile, path: str) -> str:
    """Upload file to Firebase Storage"""
    blob = bucket.blob(path)
    blob.upload_from_file(file.file, content_type=file.content_type)
    blob.make_public()
    return blob.public_url

async def delete_file(path: str):
    """Delete file from Firebase Storage"""
    blob = bucket.blob(path)
    blob.delete()
```

---

## 💳 BANGE PAYMENTS API

**Source** : D'après `RAPPORT_PRIORITE_1_COMPLETE.md` (UC-WEBHOOK-001 à UC-WEBHOOK-010)

### Configuration

```bash
# .env
BANGE_API_URL=https://api.bange.cm
BANGE_API_KEY=xxx
BANGE_WEBHOOK_SECRET=xxx
BANGE_MERCHANT_ID=xxx
```

### BANGE Client

```python
# app/services/payment_service.py
import httpx
import hmac
import hashlib
from app.config import settings

class BANGEClient:
    def __init__(self):
        self.base_url = settings.BANGE_API_URL
        self.api_key = settings.BANGE_API_KEY
        self.merchant_id = settings.BANGE_MERCHANT_ID
    
    async def initiate_payment(
        self,
        amount: float,
        phone: str,
        reference: str
    ) -> dict:
        """Initiate Mobile Money payment"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payments/initiate",
                json={
                    "merchant_id": self.merchant_id,
                    "amount": amount,
                    "phone": phone,
                    "reference": reference,
                    "callback_url": f"{settings.BASE_URL}/api/v1/webhooks/bange"
                },
                headers={"X-API-Key": self.api_key}
            )
            return response.json()
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> bool:
        """Verify BANGE webhook HMAC signature"""
        expected = hmac.new(
            settings.BANGE_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
```

### Webhook Handler

```python
# app/api/v1/webhooks.py
from fastapi import APIRouter, Request, HTTPException

router = APIRouter()

@router.post("/bange")
async def bange_webhook(request: Request):
    # Get signature from header
    signature = request.headers.get("X-BANGE-Signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    # Get raw body
    payload = await request.body()
    
    # Verify signature
    if not BANGEClient.verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Process webhook
    data = await request.json()
    # Handle payment status update...
    
    return {"status": "received"}
```

---

## 🔍 OCR - TESSERACT + GOOGLE VISION

**Source** : D'après `RAPPORT_PRIORITE_2_COMPLETE.md` (UC-DOC-001, UC-DOC-007)

### Configuration

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
TESSERACT_CMD=/usr/bin/tesseract
```

### OCR Service

```python
# app/services/ocr_service.py
import pytesseract
from PIL import Image
from google.cloud import vision

class OCRService:
    def __init__(self):
        self.vision_client = vision.ImageAnnotatorClient()
    
    async def extract_text_tesseract(self, image_path: str) -> str:
        """Extract text using Tesseract (local)"""
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang='fra')
        return text
    
    async def extract_text_vision(self, image_path: str) -> dict:
        """Extract text using Google Vision API"""
        with open(image_path, 'rb') as f:
            content = f.read()
        
        image = vision.Image(content=content)
        response = self.vision_client.text_detection(image=image)
        
        return {
            "text": response.full_text_annotation.text,
            "confidence": self._calculate_confidence(response),
            "blocks": [
                {
                    "text": block.description,
                    "confidence": block.confidence,
                    "bounding_box": block.bounding_poly
                }
                for block in response.text_annotations[1:]
            ]
        }
    
    def _calculate_confidence(self, response) -> float:
        """Calculate average confidence score"""
        confidences = [
            block.confidence
            for block in response.text_annotations[1:]
            if block.confidence
        ]
        return sum(confidences) / len(confidences) if confidences else 0.0
```

---

## 📊 MONITORING - PROMETHEUS + GRAFANA

**Phase 6** : À implémenter lors du déploiement

### Configuration Prometheus

```python
# app/monitoring.py
from prometheus_client import Counter, Histogram, Gauge
from fastapi import FastAPI

# Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)

# Middleware
async def prometheus_middleware(request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

---

## 🧪 TESTING STACK

### Pytest Configuration

```python
# conftest.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def db():
    # Setup test database
    await Database.connect()
    yield Database.get_pool()
    await Database.disconnect()

@pytest.fixture
def test_user():
    return {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
```

### Coverage Configuration

```ini
# .coveragerc
[run]
source = app
omit = 
    */tests/*
    */conftest.py
    */__init__.py

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
```

---

## 🔧 DEVELOPMENT TOOLS

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.11.0
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/pycqa/flake8
    rev: 6.1.0
    hooks:
      - id: flake8

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.1
    hooks:
      - id: mypy
        additional_dependencies: [pydantic]
```

### VS Code Configuration

```json
// .vscode/settings.json
{
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "[python]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
```

---

## 📚 RESSOURCES & DOCUMENTATION

### Documentation Officielle

- **FastAPI** : https://fastapi.tiangolo.com/
- **Pydantic** : https://docs.pydantic.dev/
- **PostgreSQL** : https://www.postgresql.org/docs/
- **Supabase** : https://supabase.com/docs
- **Firebase Admin** : https://firebase.google.com/docs/admin/setup
- **Pytest** : https://docs.pytest.org/

### Standards Industrie

- **PEP 8** : Style Guide for Python Code
- **RFC 7807** : Problem Details for HTTP APIs
- **OpenAPI 3.0** : API Documentation Standard

---

## ✅ CHECKLIST SETUP ENVIRONNEMENT

**Pour démarrer le développement :**

- [ ] Python 3.11+ installé
- [ ] Virtual environment créé (`python -m venv venv`)
- [ ] Dependencies installées (`pip install -r requirements.txt`)
- [ ] Fichier `.env` configuré (basé sur `.env.example`)
- [ ] PostgreSQL accessible (Supabase configuré)
- [ ] Firebase credentials configurées
- [ ] Tesseract installé (`sudo apt-get install tesseract-ocr`)
- [ ] Pre-commit hooks installés (`pre-commit install`)
- [ ] Tests passent (`pytest`)
- [ ] Application démarre (`uvicorn main:app --reload`)

---

**Note** : Ce document est la source de vérité pour la stack technique. En cas de conflit avec d'autres documents, référencer ce fichier.
