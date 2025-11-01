# 👨‍💻 DEV WORKFLOW - COMMENT IMPLÉMENTER

**Version** : 1.0  
**Voir aussi** : `.agent/Tasks/DEV_AGENT.md` (rôle complet)

---

## 🎯 PRINCIPE

**Code = Use Case + Schema DB + Standards**

Ce fichier explique **COMMENT** implémenter. Pour **QUAND/QUOI**, voir DEV_AGENT.md.

---

## 📚 RÈGLE 0 : HIÉRARCHIE DES SOURCES (CRITIQUE)

**En cas de conflit d'information, suivre cette hiérarchie** :

1. **Schema database** (`database/schema*.sql`) → Types, champs, contraintes
2. **Fichier .env** (`packages/backend/.env`) → Configuration réelle
3. **Code existant** (`packages/backend/app/*`) → Implémentation actuelle
4. **Use cases** (`use_cases/*.md`) → Workflows, scénarios
5. **Instructions système** (`.agent/System/system_instructions.md`) → Process

**⚠️ JAMAIS inventer ou supposer**. Si information manquante → Bloquer et demander clarification.

---

## 🔄 WORKFLOW COMPLET (7 ÉTAPES)

### ÉTAPE 1 : RECEVOIR & COMPRENDRE TÂCHE

**Input** : Orchestrateur assigne `TASK-P3-001`

**Actions** :
```bash
# 1. Lire tâche complète
cat .agent/Tasks/PHASE_3_ADMIN_AGENT.md | grep -A 50 "TASK-P3-001"

# 2. Identifier use cases assignés
# Exemple : UC-ADMIN-001 à UC-ADMIN-005

# 3. Lire use cases
cat use_cases/03_ADMIN.md | grep -A 30 "UC-ADMIN-001"
```

**Output** : Compréhension claire de :
- Endpoints à créer (5 endpoints)
- Critères validation (dashboard metrics)
- Délai (2 jours)

---

### ÉTAPE 2 : VÉRIFIER SOURCES (RÈGLE 0)

**Checklist obligatoire** :

```markdown
## ✅ VÉRIFICATION SOURCES

**Avant tout code :**

- [ ] Schema DB consulté pour types (`database/schema.sql`)
- [ ] Fichier .env vérifié pour config (`packages/backend/.env`)
- [ ] Code existant analysé (`app/api/v1/*.py`)
- [ ] Use cases lus (`use_cases/*.md`)
- [ ] Aucune invention/supposition faite

**Sources vérifiées :**
1. `database/schema.sql` (ligne 42) : Type `user_id UUID NOT NULL`
2. `.env` (ligne 15) : `DATABASE_URL=postgresql://...`
3. `app/models/user.py` (ligne 8) : `class User(Base)`
```

**⚠️ Si source manquante ou ambiguë** :
```markdown
## 🚨 BLOCAGE : SOURCE MANQUANTE

**Élément requis** : Type du champ `tax_id`
**Source cherchée** : `database/schema.sql` ligne ~100
**Statut** : NON TROUVÉ

**Options possibles** :
1. UUID (standard système)
2. VARCHAR(50) (alternative)

**Demande clarification** avant de continuer.
```

---

### ÉTAPE 3 : PLANIFIER IMPLÉMENTATION

**Template Plan** :

```markdown
## 📋 PLAN IMPLÉMENTATION TASK-P3-001

### Fichiers à créer
1. `app/api/v1/admin.py` (routes)
2. `app/services/admin_service.py` (business logic)
3. `app/database/repositories/admin_repository.py` (data access)
4. `tests/use_cases/test_uc_admin.py` (tests)

### Fichiers à modifier
1. `app/main.py` (register router)
2. `app/models/__init__.py` (export models si nécessaire)

### Dépendances
- Redis (pour cache metrics)
- PostgreSQL (queries analytics)

### Ordre d'exécution
1. Créer models (si nécessaire)
2. Créer repository (data access)
3. Créer service (business logic)
4. Créer routes (API endpoints)
5. Écrire tests
6. Valider coverage >85%
```

---

### ÉTAPE 4 : IMPLÉMENTER (ARCHITECTURE 3-TIERS)

#### 4.1 Layer 1 : MODELS (si nécessaire)

**Fichier** : `app/models/admin_stats.py`

```python
from sqlalchemy import Column, String, Integer, DateTime, func
from app.models.base import Base

class DailyStats(Base):
    """
    Statistiques journalières système.
    
    Table: daily_stats
    Source: database/schema.sql ligne 245
    """
    __tablename__ = "daily_stats"
    
    id = Column(String, primary_key=True)
    date = Column(DateTime, nullable=False, index=True)
    total_users = Column(Integer, default=0)
    total_declarations = Column(Integer, default=0)
    total_revenue = Column(Integer, default=0)  # XAF
    created_at = Column(DateTime, default=func.now())
    
    class Config:
        from_attributes = True
```

#### 4.2 Layer 2 : REPOSITORY (Data Access)

**Fichier** : `app/database/repositories/admin_repository.py`

```python
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy import select, func
from app.models import User, Declaration, Payment
from app.database.connection import Database

class AdminRepository:
    """
    Repository pour opérations admin.
    
    Source: Use cases UC-ADMIN-001 à UC-ADMIN-005
    """
    
    def __init__(self):
        self.db = Database.get_pool()
    
    async def get_total_users(self) -> int:
        """
        Compter total utilisateurs.
        
        Returns:
            int: Nombre total users
            
        Source: UC-ADMIN-001 (Dashboard metrics)
        """
        query = select(func.count()).select_from(User)
        result = await self.db.fetchval(query)
        return result or 0
    
    async def get_total_declarations(self) -> int:
        """
        Compter total déclarations.
        
        Returns:
            int: Nombre total déclarations
        """
        query = select(func.count()).select_from(Declaration)
        result = await self.db.fetchval(query)
        return result or 0
    
    async def get_revenue_today(self) -> int:
        """
        Calculer revenus du jour.
        
        Returns:
            int: Revenus en XAF
            
        Source: UC-ADMIN-001 (Revenue metric)
        """
        today_start = datetime.now().replace(hour=0, minute=0, second=0)
        
        query = select(func.sum(Payment.amount)).where(
            Payment.status == "completed",
            Payment.paid_at >= today_start
        )
        result = await self.db.fetchval(query)
        return result or 0
    
    async def get_declarations_by_status(self) -> Dict[str, int]:
        """
        Compter déclarations par statut.
        
        Returns:
            dict: {"draft": 10, "submitted": 5, ...}
            
        Source: UC-ADMIN-001 (Status breakdown)
        """
        query = select(
            Declaration.status,
            func.count()
        ).group_by(Declaration.status)
        
        results = await self.db.fetch(query)
        return {row["status"]: row["count"] for row in results}
    
    async def get_recent_users(self, limit: int = 10) -> List[Dict]:
        """
        Récupérer utilisateurs récents.
        
        Args:
            limit: Nombre max résultats
            
        Returns:
            list: Liste users récents
            
        Source: UC-ADMIN-001 (Recent activity)
        """
        query = select(User).order_by(
            User.created_at.desc()
        ).limit(limit)
        
        results = await self.db.fetch(query)
        return [dict(row) for row in results]
```

#### 4.3 Layer 3 : SERVICE (Business Logic)

**Fichier** : `app/services/admin_service.py`

```python
from typing import Dict, List
from datetime import datetime
from app.database.repositories.admin_repository import AdminRepository
from app.core.cache import Cache
from app.core.logger import logger

class AdminService:
    """
    Service métier pour admin.
    
    Source: Use cases UC-ADMIN-001 à UC-ADMIN-005
    """
    
    def __init__(self):
        self.repo = AdminRepository()
        self.cache = Cache()
    
    async def get_dashboard_metrics(self) -> Dict:
        """
        Récupérer métriques dashboard admin.
        
        Returns:
            dict: Métriques dashboard
            
        Cache: 5 minutes
        Source: UC-ADMIN-001
        
        Example:
            {
                "total_users": 1250,
                "total_declarations": 3420,
                "revenue_today": 15000000,
                "declarations_by_status": {...}
            }
        """
        # Check cache (5min TTL)
        cache_key = "admin:dashboard:metrics"
        cached = await self.cache.get(cache_key)
        if cached:
            logger.info("Dashboard metrics served from cache")
            return cached
        
        # Fetch from DB
        metrics = {
            "total_users": await self.repo.get_total_users(),
            "total_declarations": await self.repo.get_total_declarations(),
            "revenue_today": await self.repo.get_revenue_today(),
            "declarations_by_status": await self.repo.get_declarations_by_status(),
            "recent_users": await self.repo.get_recent_users(limit=5),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Cache 5min
        await self.cache.set(cache_key, metrics, ttl=300)
        
        logger.info("Dashboard metrics computed and cached")
        return metrics
    
    async def get_user_stats(self, period: str = "30d") -> Dict:
        """
        Statistiques utilisateurs sur période.
        
        Args:
            period: Période ('7d', '30d', '90d')
            
        Returns:
            dict: Stats utilisateurs
            
        Source: UC-ADMIN-002 (User management)
        """
        # Implementation based on period
        # ...
        pass
```

#### 4.4 Layer 4 : ROUTES (API Endpoints)

**Fichier** : `app/api/v1/admin.py`

```python
from fastapi import APIRouter, Depends, status, Query
from typing import Dict, List
from app.services.admin_service import AdminService
from app.core.auth import get_current_user, require_admin
from app.models.user import User
from app.api.schemas.admin import DashboardResponse, UserStatsResponse
from app.core.errors import handle_errors

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Dashboard administrateur principal",
    description="""
    Récupérer métriques principales du dashboard admin.
    
    **Métriques incluses :**
    - Total utilisateurs
    - Total déclarations
    - Revenus du jour (XAF)
    - Répartition déclarations par statut
    - Utilisateurs récents (5 derniers)
    
    **Cache** : 5 minutes (pour performance)
    
    **Permissions** : Admin uniquement
    
    **Source** : UC-ADMIN-001
    """,
    responses={
        200: {
            "description": "Métriques dashboard",
            "content": {
                "application/json": {
                    "example": {
                        "total_users": 1250,
                        "total_declarations": 3420,
                        "revenue_today": 15000000,
                        "declarations_by_status": {
                            "draft": 120,
                            "submitted": 45,
                            "processing": 23,
                            "validated": 180,
                            "paid": 3052
                        },
                        "recent_users": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "email": "user@example.com",
                                "created_at": "2025-10-20T10:30:00Z"
                            }
                        ],
                        "timestamp": "2025-10-20T14:23:45Z"
                    }
                }
            }
        },
        401: {"description": "Non authentifié"},
        403: {"description": "Non autorisé (admin requis)"}
    }
)
@handle_errors
async def get_dashboard(
    current_user: User = Depends(require_admin)
) -> Dict:
    """
    Endpoint dashboard admin principal.
    
    Permissions: Admin uniquement
    Cache: 5 minutes
    Source: UC-ADMIN-001
    """
    service = AdminService()
    metrics = await service.get_dashboard_metrics()
    return metrics


@router.get(
    "/users/stats",
    response_model=UserStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Statistiques utilisateurs",
    description="""
    Statistiques utilisateurs sur période.
    
    **Périodes disponibles :**
    - 7d : 7 derniers jours
    - 30d : 30 derniers jours (défaut)
    - 90d : 90 derniers jours
    
    **Source** : UC-ADMIN-002
    """,
    responses={
        200: {"description": "Statistiques utilisateurs"},
        401: {"description": "Non authentifié"},
        403: {"description": "Non autorisé"}
    }
)
@handle_errors
async def get_user_stats(
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    current_user: User = Depends(require_admin)
) -> Dict:
    """
    Statistiques utilisateurs.
    
    Source: UC-ADMIN-002
    """
    service = AdminService()
    stats = await service.get_user_stats(period=period)
    return stats
```

#### 4.5 Enregistrer Router

**Fichier** : `app/main.py`

```python
from fastapi import FastAPI
from app.api.v1 import admin, auth, declarations  # Import router

app = FastAPI(title="TaxasGE Backend")

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")  # ← Ajouter
app.include_router(declarations.router, prefix="/api/v1")
```

---

### ÉTAPE 5 : ÉCRIRE TESTS

**Fichier** : `tests/use_cases/test_uc_admin.py`

```python
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_get_dashboard_success(client: AsyncClient, admin_token: str):
    """
    Test UC-ADMIN-001 : GET /admin/dashboard
    
    Given: Admin authentifié
    When: Requête GET /admin/dashboard
    Then: Retourne métriques (200)
    
    Source: UC-ADMIN-001
    """
    response = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Vérifier structure
    assert "total_users" in data
    assert "total_declarations" in data
    assert "revenue_today" in data
    assert "declarations_by_status" in data
    assert "recent_users" in data
    assert "timestamp" in data
    
    # Vérifier types
    assert isinstance(data["total_users"], int)
    assert isinstance(data["revenue_today"], int)
    assert isinstance(data["declarations_by_status"], dict)
    assert isinstance(data["recent_users"], list)


@pytest.mark.asyncio
async def test_get_dashboard_unauthorized(client: AsyncClient):
    """
    Test UC-ADMIN-001 : GET /admin/dashboard sans auth
    
    Given: Aucune authentification
    When: Requête GET /admin/dashboard
    Then: Erreur 401
    
    Source: UC-ADMIN-001 (error case)
    """
    response = await client.get("/api/v1/admin/dashboard")
    
    assert response.status_code == 401
    data = response.json()
    assert data["type"] == "https://taxasge.com/errors/UNAUTHORIZED"


@pytest.mark.asyncio
async def test_get_dashboard_forbidden(client: AsyncClient, user_token: str):
    """
    Test UC-ADMIN-001 : GET /admin/dashboard user non-admin
    
    Given: User normal authentifié (non-admin)
    When: Requête GET /admin/dashboard
    Then: Erreur 403
    
    Source: UC-ADMIN-001 (RBAC)
    """
    response = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == 403
    data = response.json()
    assert data["type"] == "https://taxasge.com/errors/FORBIDDEN"


@pytest.mark.asyncio
@patch('app.services.admin_service.AdminRepository')
async def test_get_dashboard_with_cache(
    mock_repo,
    client: AsyncClient,
    admin_token: str
):
    """
    Test UC-ADMIN-001 : Dashboard avec cache
    
    Given: Admin authentifié, métriques en cache
    When: 2 requêtes GET /admin/dashboard
    Then: Repository appelé 1 seule fois (cache hit)
    
    Source: UC-ADMIN-001 (caching)
    """
    # Mock repository
    mock_repo.return_value.get_total_users = AsyncMock(return_value=1000)
    mock_repo.return_value.get_total_declarations = AsyncMock(return_value=500)
    
    # Première requête (miss cache)
    response1 = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response1.status_code == 200
    
    # Deuxième requête (hit cache)
    response2 = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response2.status_code == 200
    
    # Vérifier repo appelé 1 fois seulement
    mock_repo.return_value.get_total_users.assert_called_once()
```

---

### ÉTAPE 6 : VALIDER COVERAGE

```bash
# 1. Lancer tests
pytest tests/use_cases/test_uc_admin.py -v

# 2. Mesurer coverage
pytest --cov=app.api.v1.admin \
       --cov=app.services.admin_service \
       --cov=app.database.repositories.admin_repository \
       --cov-report=html \
       --cov-report=term

# 3. Vérifier minimum 85%
pytest --cov=app.api.v1.admin --cov-fail-under=85

# 4. Voir rapport détaillé
open htmlcov/index.html
```

**Output attendu** :
```
---------- coverage: platform linux, python 3.11 -----------
Name                                      Stmts   Miss  Cover
-------------------------------------------------------------
app/api/v1/admin.py                          45      2    96%
app/services/admin_service.py                38      3    92%
app/database/repositories/admin_repo.py      52      5    90%
-------------------------------------------------------------
TOTAL                                       135     10    93%

✅ Coverage: 93% (target: 85%)
```

---

### ÉTAPE 7 : GÉNÉRER RAPPORT

**Fichier** : `.agent/Reports/TASK_P3_001_REPORT.md`

```markdown
# RAPPORT TÂCHE : TASK-P3-001

**Phase** : Phase 3 - Admin & Agents  
**Tâche** : Dashboard Admin Principal  
**Agent** : Dev  
**Date** : 2025-10-20  
**Statut** : ✅ COMPLÉTÉ

---

## 1. CONTEXTE

**Objectif** : Implémenter dashboard admin avec 5 métriques principales

**Use Cases traités** :
- UC-ADMIN-001 : GET /admin/dashboard

**Critères validation** :
- [x] 5 endpoints dashboard implémentés
- [x] Cache Redis 5min
- [x] RBAC admin strict
- [x] Tests >85% coverage
- [x] Swagger documentation complète

---

## 2. IMPLÉMENTATION

### Fichiers créés
1. `app/api/v1/admin.py` (45 lignes)
   - Endpoint GET /admin/dashboard
   - Swagger documentation complète
   - Error handling RFC 7807

2. `app/services/admin_service.py` (85 lignes)
   - Business logic dashboard
   - Cache Redis (TTL 5min)
   - Logging

3. `app/database/repositories/admin_repository.py` (120 lignes)
   - 5 méthodes data access
   - Queries optimisées

4. `tests/use_cases/test_uc_admin.py` (95 lignes)
   - 4 tests (nominal + 3 erreurs)
   - Mock repository + cache

### Fichiers modifiés
1. `app/main.py` (ligne 12)
   - Enregistré router admin

---

## 3. TESTS

### Tests écrits (4 tests)
1. ✅ `test_get_dashboard_success` - Nominal (200)
2. ✅ `test_get_dashboard_unauthorized` - Sans auth (401)
3. ✅ `test_get_dashboard_forbidden` - User non-admin (403)
4. ✅ `test_get_dashboard_with_cache` - Cache hit

### Coverage atteint
- `app/api/v1/admin.py` : 96%
- `app/services/admin_service.py` : 92%
- `app/database/repositories/admin_repository.py` : 90%
- **TOTAL** : **93%** ✅ (target: 85%)

### Résultat tests
```bash
tests/use_cases/test_uc_admin.py::test_get_dashboard_success PASSED
tests/use_cases/test_uc_admin.py::test_get_dashboard_unauthorized PASSED
tests/use_cases/test_uc_admin.py::test_get_dashboard_forbidden PASSED
tests/use_cases/test_uc_admin.py::test_get_dashboard_with_cache PASSED

====== 4 passed in 2.34s ======
```

---

## 4. VALIDATION CRITÈRES

| Critère | Cible | Atteint | Statut |
|---------|-------|---------|--------|
| Endpoint dashboard | 1 | 1 | ✅ |
| Cache Redis | 5min | 5min | ✅ |
| RBAC admin | Strict | Strict | ✅ |
| Tests coverage | >85% | 93% | ✅ |
| Swagger docs | Complet | Complet | ✅ |

**Statut global** : ✅ TOUS CRITÈRES VALIDÉS

---

## 5. SOURCES VÉRIFIÉES

**Règle 0 respectée** :
1. ✅ Schema DB : `database/schema.sql` (lignes 100-150)
   - Types: `user_id UUID`, `created_at TIMESTAMP`
2. ✅ Fichier .env : Configuration Redis vérifiée
3. ✅ Code existant : `app/models/user.py` consulté
4. ✅ Use cases : UC-ADMIN-001 suivi exactement

**Aucune invention** : Tous types/champs viennent des sources officielles.

---

## 6. DIFFICULTÉS RENCONTRÉES

### Difficulté 1 : Cache Redis TTL
**Problème** : TTL cache pas clair dans use case  
**Solution** : Décidé 5min (standard dashboards)  
**Source** : Best practices caching

### Difficulté 2 : Type revenue_today
**Problème** : Type `revenue` ambigu (int vs float)  
**Solution** : Vérifié `database/schema.sql` ligne 142 → `INTEGER`  
**Source** : Schema DB (source prioritaire)

---

## 7. PROCHAINES ÉTAPES

**Dépendances pour tâche suivante (TASK-P3-002)** :
- ✅ Router admin enregistré (ready)
- ✅ Auth RBAC fonctionnel (ready)
- ⏳ Besoin endpoint GET /admin/users (TASK-P3-002)

**Suggestions** :
1. Ajouter métriques temps réel (WebSocket)
2. Dashboard PDF export (future)

---

## 8. MÉTRIQUES

- **Temps passé** : 4h (estimation 6h)
- **Lignes code** : 345 lignes
- **Lignes tests** : 95 lignes
- **Ratio tests/code** : 27% ✅
- **Coverage** : 93% ✅

---

**Rapport généré** : 2025-10-20 16:45 UTC  
**Agent Dev** : Claude  
**Validation** : En attente review orchestrateur
```

---

## 📋 STANDARDS CODE (RAPPEL)

### Imports
```python
# Standard library
import os
from typing import Dict, List, Optional
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func

# Local
from app.models import User
from app.services.admin_service import AdminService
```

### Error Handling (RFC 7807)
```python
from app.core.errors import (
    ResourceNotFoundError,
    ValidationError,
    UnauthorizedError
)

@router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await repo.get_by_id(user_id)
    
    if not user:
        raise ResourceNotFoundError(
            resource="User",
            resource_id=user_id,
            message=f"User {user_id} not found"
        )
    
    return user
```

### Logging
```python
from app.core.logger import logger

async def process_payment(payment_id: str):
    logger.info(f"Processing payment {payment_id}")
    
    try:
        result = await service.process(payment_id)
        logger.info(f"Payment {payment_id} processed successfully")
        return result
    
    except Exception as e:
        logger.error(f"Payment {payment_id} failed: {e}", exc_info=True)
        raise
```

### Type Hints
```python
from typing import Dict, List, Optional

async def get_users(
    limit: int = 10,
    offset: int = 0
) -> List[Dict[str, any]]:
    """
    Récupérer liste utilisateurs.
    
    Args:
        limit: Nombre max résultats
        offset: Offset pagination
        
    Returns:
        List[Dict]: Liste users
    """
    pass
```

---

## ✅ CHECKLIST FINALE

Avant de générer rapport :

### Code
- [ ] Architecture 3-tiers respectée (routes → services → repositories)
- [ ] Types vérifiés depuis schema DB
- [ ] Error handling RFC 7807
- [ ] Logging présent
- [ ] Type hints complets
- [ ] Docstrings Google Style

### Tests
- [ ] Test cas nominal (200/201)
- [ ] Tests erreurs (401, 403, 404, 422)
- [ ] Tests edge cases
- [ ] Coverage >85%
- [ ] Mocks pour external APIs
- [ ] Fixtures réutilisables

### Documentation
- [ ] Swagger complet
- [ ] Exemples dans responses
- [ ] Docstrings présentes
- [ ] README module mis à jour

### Validation
- [ ] Tous critères tâche validés
- [ ] Sources vérifiées (Règle 0)
- [ ] Aucune invention/supposition
- [ ] Tests passants
- [ ] Linter OK (`black`, `flake8`, `mypy`)

---

## 🚨 ERREURS FRÉQUENTES À ÉVITER

### ❌ Erreur 1 : Inventer types
```python
# ❌ MAUVAIS (type inventé)
user_id: int  # Pas vérifié dans schema

# ✅ BON (vérifié schema DB)
user_id: UUID  # Source: database/schema.sql ligne 42
```

### ❌ Erreur 2 : Skip validation sources
```python
# ❌ MAUVAIS (supposition)
# "Je suppose que user_id est UUID"

# ✅ BON (vérification)
# cat database/schema.sql | grep user_id
# → user_id UUID NOT NULL (ligne 42)
```

### ❌ Erreur 3 : Tests insuffisants
```python
# ❌ MAUVAIS (seulement nominal)
def test_get_user():
    assert response.status_code == 200

# ✅ BON (nominal + erreurs)
def test_get_user_success(): ...
def test_get_user_not_found(): ...
def test_get_user_unauthorized(): ...
```

### ❌ Erreur 4 : Pas de docstrings
```python
# ❌ MAUVAIS
async def calculate_tax(income, rate):
    return income * rate

# ✅ BON
async def calculate_tax(income: float, rate: float) -> float:
    """
    Calculer montant taxe.
    
    Args:
        income: Revenu (XAF)
        rate: Taux (0.0-1.0)
        
    Returns:
        float: Montant taxe
        
    Source: UC-PAYMENTS-003
    """
    return income * rate
```

---

## 🎯 RÉSUMÉ WORKFLOW

```
1. RECEVOIR TÂCHE
   ↓
2. VÉRIFIER SOURCES (Règle 0)
   ↓
3. PLANIFIER
   ↓
4. IMPLÉMENTER (3-tiers)
   ↓
5. TESTER (coverage >85%)
   ↓
6. VALIDER COVERAGE
   ↓
7. GÉNÉRER RAPPORT
   ↓
✅ SOUMETTRE ORCHESTRATEUR
```

---

**FIN DEV_WORKFLOW.md v1.0**

Pour TEST_WORKFLOW et DOC_WORKFLOW, voir fichiers dédiés.
