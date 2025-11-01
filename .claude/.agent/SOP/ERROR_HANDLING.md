# ⚠️ ERROR HANDLING - RFC 7807

**Version** : 1.0  
**Date** : 2025-10-20  
**Standard** : RFC 7807 (Problem Details for HTTP APIs)

---

## 1. STANDARD RFC 7807

### Format JSON
```json
{
  "type": "https://taxasge.com/errors/VALIDATION_ERROR",
  "title": "Validation Error",
  "status": 422,
  "detail": "Invalid input data provided",
  "instance": "/api/v1/declarations/create",
  "trace_id": "abc123-def456-ghi789",
  "timestamp": "2025-10-20T14:30:00Z",
  "errors": [
    {
      "field": "amount",
      "code": "TOO_LOW",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

### Champs
- **type** : URI identifiant type erreur (https://taxasge.com/errors/{CODE})
- **title** : Titre court lisible humain
- **status** : Code HTTP (400, 401, 403, 404, 409, 422, 500)
- **detail** : Description détaillée erreur
- **instance** : URI endpoint qui a généré l'erreur
- **trace_id** : ID unique pour tracer erreur (logs, monitoring)
- **timestamp** : Date/heure erreur (ISO 8601)
- **errors** : Array erreurs validation (optionnel)

---

## 2. HIÉRARCHIE EXCEPTIONS

```python
# app/utils/exceptions.py

from fastapi import HTTPException, Request
from datetime import datetime
import uuid

class TaxasGEException(HTTPException):
    """
    Exception de base TaxasGE (RFC 7807).
    
    Toutes exceptions custom héritent de cette classe.
    """
    
    def __init__(
        self,
        status_code: int,
        error_code: str,
        detail: str,
        errors: list[dict] | None = None,
        request: Request | None = None
    ):
        self.error_code = error_code
        self.trace_id = str(uuid.uuid4())
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        
        super().__init__(
            status_code=status_code,
            detail={
                "type": f"https://taxasge.com/errors/{error_code}",
                "title": self._get_title(status_code),
                "status": status_code,
                "detail": detail,
                "instance": request.url.path if request else None,
                "trace_id": self.trace_id,
                "timestamp": self.timestamp,
                "errors": errors or []
            }
        )
    
    def _get_title(self, status_code: int) -> str:
        """Mapper status code vers title"""
        titles = {
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            409: "Conflict",
            422: "Validation Error",
            500: "Internal Server Error",
            503: "Service Unavailable"
        }
        return titles.get(status_code, "Error")


# ========== 4xx Client Errors ==========

class ValidationError(TaxasGEException):
    """422 - Erreur validation (Pydantic, business rules)"""
    def __init__(self, detail: str, errors: list[dict], request: Request | None = None):
        super().__init__(422, "VALIDATION_ERROR", detail, errors, request)


class UnauthorizedError(TaxasGEException):
    """401 - Authentication manquante ou invalide"""
    def __init__(self, detail: str = "Authentication required", request: Request | None = None):
        super().__init__(401, "UNAUTHORIZED", detail, None, request)


class ForbiddenError(TaxasGEException):
    """403 - Authorization insuffisante (RBAC)"""
    def __init__(self, detail: str = "Insufficient permissions", request: Request | None = None):
        super().__init__(403, "FORBIDDEN", detail, None, request)


class NotFoundError(TaxasGEException):
    """404 - Ressource introuvable"""
    def __init__(self, resource: str, identifier: str, request: Request | None = None):
        detail = f"{resource} with identifier '{identifier}' not found"
        super().__init__(404, "RESOURCE_NOT_FOUND", detail, None, request)


class ConflictError(TaxasGEException):
    """409 - Conflit (duplicate, state conflict)"""
    def __init__(self, detail: str, request: Request | None = None):
        super().__init__(409, "RESOURCE_CONFLICT", detail, None, request)


class BadRequestError(TaxasGEException):
    """400 - Requête invalide (hors validation)"""
    def __init__(self, detail: str, request: Request | None = None):
        super().__init__(400, "BAD_REQUEST", detail, None, request)


# ========== 5xx Server Errors ==========

class InternalServerError(TaxasGEException):
    """500 - Erreur serveur interne"""
    def __init__(self, detail: str = "An internal error occurred", request: Request | None = None):
        super().__init__(500, "INTERNAL_ERROR", detail, None, request)


class ServiceUnavailableError(TaxasGEException):
    """503 - Service externe indisponible"""
    def __init__(self, service: str, request: Request | None = None):
        detail = f"External service '{service}' is currently unavailable"
        super().__init__(503, "SERVICE_UNAVAILABLE", detail, None, request)


# ========== Business-Specific Errors ==========

class PaymentError(TaxasGEException):
    """Payment processing error"""
    def __init__(self, detail: str, request: Request | None = None):
        super().__init__(422, "PAYMENT_ERROR", detail, None, request)


class WebhookError(TaxasGEException):
    """Webhook validation error"""
    def __init__(self, detail: str, request: Request | None = None):
        super().__init__(400, "WEBHOOK_ERROR", detail, None, request)
```

---

## 3. UTILISATION DANS ROUTES

### Exemple Route Complète
```python
# app/api/v1/declarations.py

from fastapi import APIRouter, Depends, Request
from app.services.declaration_service import DeclarationService
from app.utils.exceptions import (
    ValidationError,
    NotFoundError,
    ForbiddenError,
    InternalServerError
)

router = APIRouter()

@router.post("/create")
async def create_declaration(
    request: Request,
    data: DeclarationCreate,
    service: DeclarationService = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Créer nouvelle déclaration.
    
    Errors:
    - 401: Token invalide/manquant
    - 403: User suspendu
    - 404: Service fiscal introuvable
    - 422: Validation failed (amount, service_id)
    - 500: Database error
    """
    try:
        # Business logic
        declaration = await service.create(current_user.id, data)
        return DeclarationResponse(**declaration.dict())
        
    except ValueError as e:
        # Validation métier
        raise ValidationError(
            detail=str(e),
            errors=[{"field": "amount", "code": "INVALID", "message": str(e)}],
            request=request
        )
    
    except KeyError:
        # Service fiscal pas trouvé
        raise NotFoundError("FiscalService", data.service_id, request)
    
    except PermissionError:
        # User suspendu
        raise ForbiddenError("User account is suspended", request)
    
    except Exception as e:
        # Erreur non gérée
        logger.exception(f"Unexpected error in create_declaration: {e}")
        raise InternalServerError(request=request)
```

---

## 4. ERREURS PAR CODE HTTP

### 400 - Bad Request
**Quand** : Requête malformée (hors validation Pydantic)

```python
# Exemples :
raise BadRequestError("Invalid date range: start date must be before end date")
raise BadRequestError("Missing required query parameter 'service_id'")
```

---

### 401 - Unauthorized
**Quand** : Authentication manquante ou invalide

```python
# app/utils/auth.py

async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get authenticated user from JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload", request)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token", request)
    
    user = await user_service.get(user_id)
    if not user:
        raise UnauthorizedError("User not found", request)
    
    return user
```

**Response** :
```json
{
  "type": "https://taxasge.com/errors/UNAUTHORIZED",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired token",
  "instance": "/api/v1/users/me",
  "trace_id": "abc-123",
  "timestamp": "2025-10-20T14:30:00Z",
  "errors": []
}
```

---

### 403 - Forbidden
**Quand** : Authorization insuffisante (RBAC)

```python
# app/utils/rbac.py

def require_role(*allowed_roles: str):
    """
    Dependency pour vérifier rôle utilisateur.
    
    Usage:
        @router.delete("/users/{user_id}")
        async def delete_user(
            user_id: str,
            current_user: User = Depends(require_role("admin"))
        ):
            ...
    """
    async def check_role(
        request: Request,
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"Required role: {' or '.join(allowed_roles)}. Your role: {current_user.role}",
                request
            )
        return current_user
    
    return check_role
```

**Response** :
```json
{
  "type": "https://taxasge.com/errors/FORBIDDEN",
  "title": "Forbidden",
  "status": 403,
  "detail": "Required role: admin. Your role: user",
  "instance": "/api/v1/admin/users",
  "trace_id": "def-456",
  "timestamp": "2025-10-20T14:35:00Z",
  "errors": []
}
```

---

### 404 - Not Found
**Quand** : Ressource introuvable

```python
@router.get("/declarations/{declaration_id}")
async def get_declaration(
    request: Request,
    declaration_id: str,
    service: DeclarationService = Depends()
):
    """Get declaration by ID"""
    declaration = await service.get(declaration_id)
    
    if not declaration:
        raise NotFoundError("Declaration", declaration_id, request)
    
    return declaration
```

**Response** :
```json
{
  "type": "https://taxasge.com/errors/RESOURCE_NOT_FOUND",
  "title": "Not Found",
  "status": 404,
  "detail": "Declaration with identifier 'DECL-2025-999999' not found",
  "instance": "/api/v1/declarations/DECL-2025-999999",
  "trace_id": "ghi-789",
  "timestamp": "2025-10-20T14:40:00Z",
  "errors": []
}
```

---

### 409 - Conflict
**Quand** : Conflit ressource (duplicate, state conflict)

```python
# Duplicate email
@router.post("/register")
async def register(request: Request, data: UserCreate):
    """Register new user"""
    
    # Check email exists
    existing = await user_service.get_by_email(data.email)
    if existing:
        raise ConflictError(f"Email '{data.email}' already registered", request)
    
    user = await user_service.create(data)
    return user

# State conflict
@router.post("/declarations/{id}/submit")
async def submit_declaration(request: Request, id: str):
    """Submit declaration for validation"""
    
    declaration = await service.get(id)
    
    if declaration.status != "draft":
        raise ConflictError(
            f"Cannot submit declaration in status '{declaration.status}'. Must be 'draft'.",
            request
        )
    
    await service.submit(id)
    return {"status": "submitted"}
```

**Response** :
```json
{
  "type": "https://taxasge.com/errors/RESOURCE_CONFLICT",
  "title": "Conflict",
  "status": 409,
  "detail": "Email 'user@example.com' already registered",
  "instance": "/api/v1/auth/register",
  "trace_id": "jkl-012",
  "timestamp": "2025-10-20T14:45:00Z",
  "errors": []
}
```

---

### 422 - Validation Error
**Quand** : Validation Pydantic ou business rules

```python
# Pydantic validation automatique
class DeclarationCreate(BaseModel):
    service_id: str = Field(..., min_length=1)
    amount: int = Field(..., gt=0, lt=100_000_000)  # 0 < amount < 100M
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < 1000:
            raise ValueError('Minimum amount is 1,000 XAF')
        return v

# FastAPI catch Pydantic errors automatiquement et format RFC 7807

# Business validation manuelle
@router.post("/declarations/create")
async def create_declaration(request: Request, data: DeclarationCreate):
    """Create declaration"""
    
    # Business rule validation
    if data.amount > 10_000_000 and data.service_id == "SIMPLE_SERVICE":
        raise ValidationError(
            detail="High amount declarations require complex service",
            errors=[
                {
                    "field": "amount",
                    "code": "AMOUNT_TOO_HIGH_FOR_SERVICE",
                    "message": "Amount exceeds 10M XAF. Use complex service instead."
                }
            ],
            request=request
        )
    
    return await service.create(data)
```

**Response** :
```json
{
  "type": "https://taxasge.com/errors/VALIDATION_ERROR",
  "title": "Validation Error",
  "status": 422,
  "detail": "High amount declarations require complex service",
  "instance": "/api/v1/declarations/create",
  "trace_id": "mno-345",
  "timestamp": "2025-10-20T14:50:00Z",
  "errors": [
    {
      "field": "amount",
      "code": "AMOUNT_TOO_HIGH_FOR_SERVICE",
      "message": "Amount exceeds 10M XAF. Use complex service instead."
    }
  ]
}
```

---

### 500 - Internal Server Error
**Quand** : Erreur non gérée, database, externe

```python
@router.post("/declarations/create")
async def create_declaration(request: Request, data: DeclarationCreate):
    """Create declaration"""
    try:
        declaration = await service.create(data)
        return declaration
    
    except ValidationError:
        raise  # Re-raise pour garder 422
    
    except asyncpg.PostgresError as e:
        # Database error
        logger.exception(f"Database error in create_declaration: {e}")
        raise InternalServerError(
            detail="Database operation failed. Please try again.",
            request=request
        )
    
    except httpx.TimeoutException:
        # External API timeout
        raise ServiceUnavailableError("BANGE API", request)
    
    except Exception as e:
        # Unhandled error
        logger.exception(f"Unexpected error in create_declaration: {e}")
        raise InternalServerError(request=request)
```

**Response** :
```json
{
  "type": "https://taxasge.com/errors/INTERNAL_ERROR",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An internal error occurred",
  "instance": "/api/v1/declarations/create",
  "trace_id": "pqr-678",
  "timestamp": "2025-10-20T14:55:00Z",
  "errors": []
}
```

**IMPORTANT** : JAMAIS exposer détails erreurs internes en production (stack traces, SQL queries, etc.)

---

## 5. EXCEPTION HANDLER GLOBAL

```python
# app/main.py

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.utils.exceptions import TaxasGEException
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

@app.exception_handler(TaxasGEException)
async def taxasge_exception_handler(request: Request, exc: TaxasGEException):
    """
    Handler pour toutes exceptions TaxasGE.
    
    Déjà au format RFC 7807, donc juste retourner.
    """
    # Log erreur
    logger.error(
        f"TaxasGE exception: {exc.error_code}",
        extra={
            "trace_id": exc.trace_id,
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handler pour exceptions non gérées.
    
    Convertir en InternalServerError RFC 7807.
    """
    # Log exception complète
    logger.exception(
        f"Unhandled exception: {exc}",
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Retourner 500 RFC 7807
    error = InternalServerError(request=request)
    
    return JSONResponse(
        status_code=500,
        content=error.detail
    )
```

---

## 6. LOGGING ERREURS

### Structured Logging
```python
import structlog

logger = structlog.get_logger()

try:
    user = await service.get(user_id)
except Exception as e:
    await logger.error(
        "user.get.failed",
        user_id=user_id,
        error_type=type(e).__name__,
        error_message=str(e),
        trace_id=trace_id,
        timestamp=datetime.utcnow().isoformat()
    )
    raise InternalServerError()
```

### Monitoring (Prometheus)
```python
from prometheus_client import Counter

errors_total = Counter(
    'http_errors_total',
    'Total HTTP errors',
    ['status_code', 'error_code', 'endpoint']
)

@app.exception_handler(TaxasGEException)
async def taxasge_exception_handler(request: Request, exc: TaxasGEException):
    # Increment Prometheus counter
    errors_total.labels(
        status_code=exc.status_code,
        error_code=exc.error_code,
        endpoint=request.url.path
    ).inc()
    
    return JSONResponse(...)
```

---

## 7. TESTS ERREURS

```python
# tests/use_cases/test_errors.py

@pytest.mark.asyncio
async def test_create_declaration_not_found_service():
    """Test 404 si service fiscal introuvable"""
    response = await client.post(
        "/api/v1/declarations/create",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "service_id": "INVALID_SERVICE_ID",
            "amount": 100000
        }
    )
    
    assert response.status_code == 404
    data = response.json()
    
    # Vérifier RFC 7807
    assert data["type"] == "https://taxasge.com/errors/RESOURCE_NOT_FOUND"
    assert data["title"] == "Not Found"
    assert data["status"] == 404
    assert "FiscalService" in data["detail"]
    assert "trace_id" in data
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_register_duplicate_email_conflict():
    """Test 409 si email déjà existant"""
    # Register user
    await client.post("/api/v1/auth/register", json={...})
    
    # Try register same email
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",  # Duplicate
        "password": "password123"
    })
    
    assert response.status_code == 409
    data = response.json()
    
    assert data["type"] == "https://taxasge.com/errors/RESOURCE_CONFLICT"
    assert "already registered" in data["detail"]
```

---

## ✅ CHECKLIST ERROR HANDLING

Avant de soumettre code :
- [ ] Tous cas d'erreur identifiés (4xx, 5xx)
- [ ] Exceptions RFC 7807 utilisées
- [ ] Pas de leak détails internes (stack traces, SQL)
- [ ] Logging structuré configuré
- [ ] Tests erreurs écrits (nominal + erreurs)
- [ ] Monitoring Prometheus instrumenté

---

**Voir aussi** :
- `.agent/SOP/CODE_STANDARDS.md` - Standards code
- `.agent/SOP/DEV_WORKFLOW.md` - Workflow implémentation
