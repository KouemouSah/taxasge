# Architecture des Modules - Standards et Middleware

## État Actuel de la Structure

### Modules avec Middleware
1. **auth/** ✅ `middleware/`
   - `auth_middleware.py` - Authentication (get_current_user, require_admin)
2. **permissions/** ✅ `middleware/`
   - `permission_middleware.py` - Authorization (@require_permission decorators)

### Modules sans Middleware
3. **admin/** ❌ Pas de middleware
4. **agents/** ❌ Pas de middleware
5. **companies/** ❌ Pas de middleware
6. **declarations/** ❌ Pas de middleware
7. **documents/** ❌ Pas de middleware
8. **fiscal_services/** ❌ Pas de middleware
9. **payments/** ❌ Pas de middleware
10. **users/** ❌ Pas de middleware
11. **webhooks/** ❌ Pas de middleware

## Question: Pourquoi certains modules ont middleware et d'autres pas?

### Réponse: C'est une question de **RESPONSABILITÉ** et de **CROSS-CUTTING CONCERNS**

## Qu'est-ce qu'un Middleware?

Un middleware est une **couche transversale** qui:
- S'exécute **AVANT** la logique métier
- Est **réutilisable** entre plusieurs routes/modules
- Gère des **préoccupations transversales** (cross-cutting concerns)

### Exemples de Middleware Légitime:
- ✅ **Authentication** - Vérifier qui est l'utilisateur
- ✅ **Authorization** - Vérifier ce que l'utilisateur peut faire
- ✅ **Rate Limiting** - Limiter les requêtes
- ✅ **Logging** - Logger toutes les requêtes
- ✅ **Validation** - Valider les données entrantes
- ✅ **CORS** - Gérer les cross-origin requests
- ✅ **Error Handling** - Gérer les erreurs globalement

### Ce qui NE devrait PAS être un Middleware:
- ❌ **Business Logic** - Logique métier spécifique (→ services/)
- ❌ **Data Access** - Accès base de données (→ repositories/)
- ❌ **Data Transformation** - Transformation données (→ services/)

## Architecture Actuelle: CORRECTE ✅

### 1. **auth/middleware/** - ✅ CORRECT

**Pourquoi?** Authentication est une préoccupation **TRANSVERSALE**

```python
# auth/middleware/auth_middleware.py
async def get_current_user(credentials: HTTPAuthorizationCredentials):
    """Utilisé par TOUS les modules pour vérifier l'utilisateur"""
    # Valide JWT token
    # Récupère user de la BD
    # Retourne UserResponse
```

**Usage dans TOUS les modules:**
```python
# admin/api/routes.py
from app.modules.auth.middleware import get_current_user

@router.get("/users")
async def list_users(current_user = Depends(get_current_user)):
    ...

# fiscal_services/api/routes.py
from app.modules.auth.middleware import get_current_user

@router.get("/services")
async def list_services(current_user = Depends(get_current_user)):
    ...
```

**✅ Justification:** Utilisé par 10+ modules, logique identique partout

### 2. **permissions/middleware/** - ✅ CORRECT

**Pourquoi?** Authorization est une préoccupation **TRANSVERSALE**

```python
# permissions/middleware/permission_middleware.py
def require_permission(permission: str):
    """Décorateur utilisé par TOUS les modules pour vérifier permissions"""
    async def dependency(current_user = Depends(get_current_user)):
        # Vérifie si admin (auto-approval)
        # Sinon vérifie permission granulaire
        # Raise 403 si non autorisé
```

**Usage dans TOUS les modules:**
```python
# agents/api/routes.py
from app.modules.permissions.middleware import require_permission

@router.delete("/agents/{id}")
@require_permission("agents.delete")
async def delete_agent(id: int):
    ...

# declarations/api/routes.py
from app.modules.permissions.middleware import require_permission

@router.post("/declarations")
@require_permission("declarations.create")
async def create_declaration():
    ...
```

**✅ Justification:** Utilisé par 10+ modules, logique identique partout

### 3. **Autres Modules SANS middleware** - ✅ CORRECT AUSSI!

**Pourquoi?** Leur logique est **SPÉCIFIQUE** à leur domaine

**Exemple: fiscal_services/**
```
fiscal_services/
├── models/          - Modèles Pydantic spécifiques
├── repositories/    - Accès BD spécifique
├── services/        - Logique métier spécifique
└── api/             - Routes spécifiques
```

**Pas de middleware car:**
- La logique de `FiscalServiceService` est **unique** à fiscal_services
- Pas réutilisée par d'autres modules
- Pas une préoccupation transversale

**Si on mettait la logique en middleware:**
```python
# ❌ MAUVAIS - Ne devrait PAS être un middleware
# fiscal_services/middleware/calculation_middleware.py
def calculate_service_amount():
    """Calcule montant fiscal service"""
    # Logique spécifique aux services fiscaux
    # Pas utilisée par declarations, payments, etc.
```

**Au lieu de ça (CORRECT):**
```python
# ✅ BON - Service layer
# fiscal_services/services/calculation_service.py
class CalculationService:
    async def calculate(...):
        """Logique métier spécifique"""
```

## Règle de Décision: Quand créer un middleware?

### ✅ CRÉER un middleware SI:

1. **Réutilisé par 3+ modules différents**
   - Exemple: `get_current_user` → utilisé partout

2. **S'exécute AVANT la logique métier**
   - Exemple: Vérifier permissions avant d'exécuter action

3. **Préoccupation transversale (cross-cutting)**
   - Exemples: auth, authorization, logging, rate limiting

4. **Logique identique partout**
   - Exemple: Validation JWT toujours pareille

### ❌ NE PAS créer middleware SI:

1. **Spécifique à UN module**
   - Solution: Utiliser services/

2. **Logique métier complexe**
   - Solution: Utiliser services/

3. **Accès base de données**
   - Solution: Utiliser repositories/

4. **Transformation de données**
   - Solution: Utiliser services/

## Structure Standard d'un Module

### Module Type 1: DOMAINE MÉTIER (sans middleware)
```
fiscal_services/
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── fiscal_service.py
│   └── templates.py
├── repositories/
│   ├── __init__.py
│   └── fiscal_service_repository.py
├── services/
│   ├── __init__.py
│   ├── fiscal_service_service.py
│   └── calculation_service.py
└── api/
    ├── __init__.py
    └── fiscal_service_routes.py
```

### Module Type 2: INFRASTRUCTURE (avec middleware)
```
auth/
├── __init__.py
├── models/
│   ├── __init__.py
│   └── auth.py
├── repositories/
│   ├── __init__.py
│   └── auth_repository.py
├── services/
│   ├── __init__.py
│   └── auth_service.py
├── middleware/          ← Préoccupation transversale
│   ├── __init__.py
│   └── auth_middleware.py
└── api/
    ├── __init__.py
    └── auth_routes.py
```

## Modules TaxasGE: Classification

### Infrastructure Modules (peuvent avoir middleware)
1. **auth** ✅ - Authentication transversale
2. **permissions** ✅ - Authorization transversale

### Domain Modules (PAS de middleware)
3. **admin** - Gestion utilisateurs
4. **agents** - Agents ministériels
5. **companies** - Entreprises
6. **declarations** - Déclarations fiscales
7. **documents** - Gestion documents
8. **fiscal_services** - Catalogue services
9. **payments** - Paiements
10. **users** - Utilisateurs
11. **webhooks** - Webhooks

## Cas Limite: Rate Limiting

**Question:** Devrait-on ajouter rate limiting middleware?

**Réponse:** OUI, si besoin, mais GLOBAL (pas par module)

**Option 1:** Middleware global application
```python
# app/middleware/rate_limit.py (global, pas dans modules/)
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    ...
```

**Option 2:** Middleware dans module infrastructure
```python
# modules/security/middleware/rate_limit.py
def require_rate_limit(limit: str):
    """Décorateur réutilisable"""
```

## Recommandations pour TaxasGE

### ✅ GARDER l'architecture actuelle (CORRECT)

**Pourquoi:**
- Séparation claire infrastructure vs domaine
- Middleware uniquement pour préoccupations transversales
- Services pour logique métier

### ✅ NE PAS ajouter middleware aux modules domaine

**Raisons:**
- Complexité inutile
- Confusion des responsabilités
- Plus difficile à tester

### ✅ Utiliser les decorators FastAPI

**Au lieu de créer middleware:**
```python
# ❌ Mauvais - Créer middleware spécifique
# fiscal_services/middleware/validation_middleware.py

# ✅ Bon - Utiliser dependency injection FastAPI
from fastapi import Depends

async def validate_service_code(code: str):
    if not code.startswith("FS-"):
        raise HTTPException(400, "Invalid code")
    return code

@router.get("/services/{code}")
async def get_service(
    code: str = Depends(validate_service_code)
):
    ...
```

## Résumé

| Aspect | Middleware | Services |
|--------|------------|----------|
| **Portée** | Transversale (3+ modules) | Spécifique (1 module) |
| **Quand** | Avant logique métier | Pendant logique métier |
| **Exemples** | Auth, permissions, logging | Calculs, validation métier |
| **Localisation** | `middleware/` | `services/` |
| **Réutilisation** | Haute | Moyenne/Faible |

## Conclusion

**L'architecture actuelle de TaxasGE est CORRECTE:**
- ✅ Middleware uniquement pour auth et permissions (transversal)
- ✅ Pas de middleware dans modules domaine (logique spécifique)
- ✅ Services layer pour logique métier

**Tous les modules N'ONT PAS BESOIN de la même structure exacte.**

**Ce qui compte:**
- Cohérence dans la RESPONSABILITÉ
- Séparation claire des préoccupations
- Réutilisabilité appropriée
