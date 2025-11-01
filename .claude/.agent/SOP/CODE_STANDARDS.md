# 📏 CODE STANDARDS - PYTHON/FASTAPI

**Version** : 1.0  
**Date** : 2025-10-20

---

## 1. STYLE GUIDE (PEP 8)

### Indentation & Formatting
```python
# ✅ BON - 4 espaces
def calculate_tax(income: float) -> float:
    if income < 0:
        raise ValueError("Income cannot be negative")
    return income * 0.15

# ❌ MAUVAIS - Tabs ou 2 espaces
def calculate_tax(income: float) -> float:
  if income < 0:
      raise ValueError("Income cannot be negative")
  return income * 0.15
```

### Naming Conventions
```python
# Classes : PascalCase
class UserService:
    pass

class DeclarationRepository:
    pass

# Functions/Variables : snake_case
def get_user_profile():
    user_email = "test@example.com"
    return user_email

# Constants : UPPER_SNAKE_CASE
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
JWT_ALGORITHM = "HS256"

# Private members : _leading_underscore
class User:
    def __init__(self):
        self._password_hash = None  # Private
    
    def _validate_email(self):  # Private method
        pass
```

### Line Length
```python
# Maximum 88 caractères (Black default)

# ✅ BON - Multi-line arguments
def create_declaration(
    user_id: str,
    service_id: str,
    amount: int,
    metadata: dict
) -> Declaration:
    ...

# ❌ MAUVAIS - Ligne trop longue
def create_declaration(user_id: str, service_id: str, amount: int, metadata: dict) -> Declaration:
    ...
```

---

## 2. TYPE HINTS (OBLIGATOIRE)

### Functions
```python
# ✅ BON - Type hints complets
def get_user(user_id: str) -> User | None:
    """Récupérer utilisateur par ID"""
    ...

def calculate_total(amounts: list[int]) -> int:
    """Calculer somme montants"""
    return sum(amounts)

async def create_declaration(data: DeclarationCreate) -> Declaration:
    """Créer déclaration"""
    ...

# ❌ MAUVAIS - Pas de type hints
def get_user(user_id):
    ...

def calculate_total(amounts):
    return sum(amounts)
```

### Variables
```python
# ✅ BON
user_id: str = "123"
amounts: list[int] = [100, 200, 300]
config: dict[str, Any] = {"key": "value"}

# Type hints complexes
from typing import Optional, Union, List, Dict

def process_payment(
    amount: int,
    user: Optional[User] = None
) -> Union[Payment, None]:
    ...
```

### Generics
```python
from typing import TypeVar, Generic

T = TypeVar('T')

class Repository(Generic[T]):
    def get(self, id: str) -> T | None:
        ...
    
    def list(self) -> list[T]:
        ...
```

---

## 3. DOCSTRINGS (GOOGLE STYLE)

### Functions
```python
def calculate_tax(income: float, rate: float) -> float:
    """
    Calculer le montant de taxe.
    
    Args:
        income: Revenu imposable en XAF
        rate: Taux d'imposition (0.0 à 1.0)
        
    Returns:
        Montant de taxe à payer en XAF
        
    Raises:
        ValueError: Si income négatif ou rate invalide
        
    Examples:
        >>> calculate_tax(1000000, 0.15)
        150000.0
    """
    if income < 0:
        raise ValueError("Income cannot be negative")
    if not 0 <= rate <= 1:
        raise ValueError("Rate must be between 0 and 1")
    
    return income * rate
```

### Classes
```python
class DeclarationService:
    """
    Service de gestion des déclarations fiscales.
    
    Ce service gère le cycle de vie complet des déclarations:
    - Création (draft)
    - Soumission (submitted)
    - Validation (validated)
    - Paiement (paid)
    
    Attributes:
        repository: Repository d'accès DB
        notification_service: Service notifications
    """
    
    def __init__(
        self,
        repository: DeclarationRepository,
        notification_service: NotificationService
    ):
        self.repository = repository
        self.notification_service = notification_service
```

---

## 4. ARCHITECTURE (SEPARATION OF CONCERNS)

### Structure 3-Tier
```
Route (API) → Service (Business Logic) → Repository (Data Access) → Database
```

### Route (API Layer)
```python
# app/api/v1/declarations.py
# RESPONSABILITÉ : Validation input, formatting output UNIQUEMENT

from fastapi import APIRouter, Depends, HTTPException
from app.services.declaration_service import DeclarationService
from app.models.declaration import DeclarationCreate, DeclarationResponse

router = APIRouter()

@router.post("/create", response_model=DeclarationResponse)
async def create_declaration(
    data: DeclarationCreate,
    service: DeclarationService = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Créer nouvelle déclaration"""
    try:
        declaration = await service.create(current_user.id, data)
        return DeclarationResponse(**declaration.dict())
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

### Service (Business Logic Layer)
```python
# app/services/declaration_service.py
# RESPONSABILITÉ : Logique métier, orchestration, validations business

class DeclarationService:
    def __init__(
        self,
        declaration_repo: DeclarationRepository = Depends(),
        user_repo: UserRepository = Depends(),
        notification_service: NotificationService = Depends()
    ):
        self.declaration_repo = declaration_repo
        self.user_repo = user_repo
        self.notification_service = notification_service
    
    async def create(self, user_id: str, data: DeclarationCreate) -> Declaration:
        """
        Créer déclaration avec logique métier.
        
        Business rules:
        - Générer référence unique
        - Calculer montant depuis service
        - Valider user existe
        - Status initial = draft
        """
        # Validation business
        user = await self.user_repo.get(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Génération référence
        reference = await self._generate_reference()
        
        # Calcul montant
        service = await self.service_repo.get(data.service_id)
        amount = service.base_amount
        
        # Création
        declaration = await self.declaration_repo.create(
            user_id=user_id,
            service_id=data.service_id,
            reference=reference,
            amount=amount,
            status="draft"
        )
        
        # Notification
        await self.notification_service.send(
            user_id=user_id,
            notification_type="declaration_created",
            data={"reference": reference}
        )
        
        return declaration
```

### Repository (Data Access Layer)
```python
# app/database/repositories/declaration_repository.py
# RESPONSABILITÉ : Accès DB UNIQUEMENT, pas de logique métier

class DeclarationRepository:
    async def create(
        self,
        user_id: str,
        service_id: str,
        reference: str,
        amount: int,
        status: str
    ) -> Declaration:
        """Créer déclaration en DB"""
        pool = Database.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO declarations (
                    id, user_id, service_id, reference, amount, status, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *
                """,
                str(uuid4()), user_id, service_id, reference, amount, status
            )
            return Declaration(**dict(row))
    
    async def get(self, declaration_id: str) -> Declaration | None:
        """Récupérer déclaration par ID"""
        pool = Database.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM declarations WHERE id = $1",
                declaration_id
            )
            return Declaration(**dict(row)) if row else None
```

---

## 5. DEPENDENCY INJECTION

### FastAPI Depends
```python
# ✅ BON - DI avec Depends
from fastapi import Depends

def get_db() -> Database:
    """Dependency injection database"""
    return Database.get_pool()

@router.get("/users/me")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    return current_user

# ❌ MAUVAIS - Global state
db = Database.get_pool()  # Global

@router.get("/users/me")
async def get_profile():
    # Utilise global db
    user = await db.fetch_user()
    return user
```

### Service Injection
```python
class DeclarationService:
    def __init__(
        self,
        repository: DeclarationRepository = Depends(),
        notification_service: NotificationService = Depends()
    ):
        self.repository = repository
        self.notification_service = notification_service

# Injection automatique dans routes
@router.post("/declarations")
async def create_declaration(
    service: DeclarationService = Depends()
):
    return await service.create(...)
```

---

## 6. ERROR HANDLING (RFC 7807)

### Format Standard
```python
{
  "type": "https://taxasge.com/errors/VALIDATION_ERROR",
  "title": "Validation Error",
  "status": 422,
  "detail": "Invalid input data",
  "instance": "/api/v1/declarations/create",
  "trace_id": "abc123-def456",
  "timestamp": "2025-10-20T14:30:00Z",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Invalid email format"
    }
  ]
}
```

### Custom Exceptions
```python
# app/utils/exceptions.py

class TaxasGEException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: str,
        detail: str,
        errors: list | None = None
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "type": f"https://taxasge.com/errors/{error_code}",
                "title": self._get_title(status_code),
                "status": status_code,
                "detail": detail,
                "errors": errors or []
            }
        )

class ValidationError(TaxasGEException):
    def __init__(self, detail: str, errors: list):
        super().__init__(422, "VALIDATION_ERROR", detail, errors)

class NotFoundError(TaxasGEException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            404,
            "RESOURCE_NOT_FOUND",
            f"{resource} with id '{identifier}' not found"
        )
```

### Usage
```python
@router.post("/declarations")
async def create_declaration(data: DeclarationCreate):
    try:
        declaration = await service.create(data)
        return declaration
    except ValueError as e:
        raise ValidationError(str(e), [])
    except KeyError:
        raise NotFoundError("Service", data.service_id)
```

---

## 7. PYDANTIC MODELS

### Request/Response Models
```python
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime

class UserCreate(BaseModel):
    """Requête création utilisateur"""
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=8, example="password123")
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^\+237\d{9}$")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Valider force mot de passe"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v

class UserResponse(BaseModel):
    """Réponse utilisateur (pas de secrets)"""
    id: str
    email: EmailStr
    full_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # For ORM compatibility
```

### Nested Models
```python
class AddressCreate(BaseModel):
    street: str
    city: str
    postal_code: str
    country: str = "Cameroun"

class UserProfileCreate(BaseModel):
    full_name: str
    date_of_birth: date
    address: AddressCreate  # Nested
    national_id: str
```

---

## 8. ASYNC/AWAIT

### Async DB Calls
```python
# ✅ BON - Async non-blocking
async def get_user(user_id: str) -> User:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            user_id
        )
        return User(**dict(row))

# ❌ MAUVAIS - Synchronous blocking
def get_user(user_id: str) -> User:
    conn = psycopg2.connect(...)  # Blocking
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    return cursor.fetchone()
```

### Async External APIs
```python
import httpx

# ✅ BON - Async HTTP
async def call_bange_api(transaction_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.bange.cm/transactions/{transaction_id}"
        )
        return response.json()

# ❌ MAUVAIS - Synchronous HTTP
import requests

def call_bange_api(transaction_id: str) -> dict:
    response = requests.get(...)  # Blocking
    return response.json()
```

---

## 9. SECURITY

### Password Hashing
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password avec bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Vérifier password"""
    return pwd_context.verify(plain, hashed)

# Usage
hashed = hash_password("password123")
is_valid = verify_password("password123", hashed)
```

### JWT Tokens
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Créer JWT token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Vérifier et decoder JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Input Validation
```python
# Pydantic auto-validation
class DeclarationCreate(BaseModel):
    amount: int = Field(..., gt=0, lt=100_000_000)  # 0 < amount < 100M
    service_id: str = Field(..., min_length=1)
    
    @validator('amount')
    def validate_amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v
```

---

## 10. LOGGING

### Standard Logging
```python
import logging

logger = logging.getLogger(__name__)

@router.post("/users")
async def create_user(data: UserCreate):
    try:
        logger.info(f"Creating user: {data.email}")
        user = await user_service.create(data)
        logger.info(f"User created: {user.id}")
        return user
    except Exception as e:
        logger.exception(f"Failed to create user: {e}")
        raise
```

### Structured Logging
```python
import structlog

logger = structlog.get_logger()

await logger.info(
    "user.created",
    user_id=user.id,
    email=user.email,
    timestamp=datetime.utcnow().isoformat()
)
```

---

## 11. TESTING

### Test Structure (AAA)
```python
@pytest.mark.asyncio
async def test_create_user():
    # Arrange
    user_data = {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    
    # Act
    response = await client.post("/api/v1/auth/register", json=user_data)
    
    # Assert
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]
    assert "password" not in response.json()
```

### Fixtures
```python
@pytest.fixture
async def client():
    """HTTP client fixture"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def test_user():
    """User data fixture"""
    return {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
```

---

## 12. GIT COMMITS (CONVENTIONAL COMMITS)

### Format
```
type(scope): message

Types:
- feat: Nouvelle fonctionnalité
- fix: Correction bug
- refactor: Refactoring (pas de changement fonctionnel)
- test: Ajout/modification tests
- docs: Documentation
- chore: Tâches maintenance (deps, config)
- perf: Amélioration performance
- style: Formatage code
```

### Exemples
```bash
feat(auth): implement register endpoint
fix(payments): correct BANGE webhook signature validation
refactor(repos): merge duplicate repositories
test(declarations): add workflow integration tests
docs(api): update Swagger authentication endpoints
chore(deps): upgrade fastapi to 0.104.1
perf(db): add index on users.email
style(format): run black on entire codebase
```

---

## ✅ CHECKLIST CODE REVIEW

Avant de soumettre PR, vérifier :

**Style** :
- [ ] Black formatté (88 chars)
- [ ] Flake8 passant
- [ ] isort passant
- [ ] mypy type check OK

**Quality** :
- [ ] Type hints complets
- [ ] Docstrings présentes
- [ ] Pas de code commenté
- [ ] Variables nommées clairement

**Architecture** :
- [ ] Séparation routes/services/repositories
- [ ] Dependency injection utilisée
- [ ] Pas de logique métier dans routes

**Security** :
- [ ] Pas de secrets hardcodés
- [ ] Input validation (Pydantic)
- [ ] Authentication vérifiée
- [ ] RBAC implémenté si requis

**Tests** :
- [ ] Tests écrits (nominal + erreurs)
- [ ] Coverage >85%
- [ ] Tests passants

**Git** :
- [ ] Commit message Conventional Commits
- [ ] Commits atomiques
- [ ] Pas de fichiers non suivis

---

**Voir aussi** :
- `.agent/SOP/DEV_WORKFLOW.md` - Workflow implémentation
- `.agent/SOP/ERROR_HANDLING.md` - Gestion erreurs détaillée
- `.agent/SOP/GIT_CONVENTIONS.md` - Conventions Git complètes
