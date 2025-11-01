# TEST WORKFLOW - AGENT TEST

## 1. Types de Tests

### Tests Unitaires
- Routes API (mocking repositories)
- Services (mocking external APIs)
- Repositories (mocking database)

### Tests Intégration
- Workflows complets
- Base de données réelle (test DB)

### Tests E2E
- Scénarios utilisateur complets
- Browser automation (si frontend)

## 2. Fixtures Pytest

### Fixtures Standard
```python
# conftest.py
@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def db():
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

@pytest.fixture
async def auth_token(client, test_user):
    # Register
    await client.post("/api/v1/auth/register", json=test_user)
    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    return response.json()["access_token"]
```

## 3. Patterns de Tests

### Pattern : Test Endpoint Success
```python
@pytest.mark.asyncio
async def test_get_user_profile_success(client, auth_token):
    """Test récupération profil utilisateur authentifié"""
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "password" not in data  # Security check
```

### Pattern : Test Validation Error
```python
@pytest.mark.asyncio
async def test_register_invalid_email(client):
    """Test création user avec email invalide"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "password123",
            "full_name": "Test User"
        }
    )
    
    assert response.status_code == 422
    data = response.json()
    assert data["type"] == "https://taxasge.com/errors/VALIDATION_ERROR"
```

### Pattern : Test RBAC
```python
@pytest.mark.security
@pytest.mark.asyncio
async def test_admin_endpoint_requires_admin_role(client, user_token):
    """Test qu'un user normal ne peut pas accéder à /admin"""
    response = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "INSUFFICIENT_PERMISSIONS"
```

## 4. Coverage

### Mesurer Coverage
```bash
# Coverage module spécifique
pytest --cov=app.api.v1.auth --cov-report=html

# Coverage global
pytest --cov=app --cov-report=term --cov-report=html

# Minimum coverage requis
pytest --cov=app --cov-fail-under=85
```

### Identifier Gaps
```bash
# Voir rapport détaillé
open htmlcov/index.html

# Lignes non couvertes (rouge) = tests à écrire
```

## 5. Checklist Test Complet

- [ ] Test cas nominal (200/201)
- [ ] Tests erreurs 4xx (400, 401, 403, 404, 409, 422)
- [ ] Tests erreurs 5xx (500)
- [ ] Tests sécurité (auth, RBAC)
- [ ] Tests edge cases
- [ ] Coverage >85%
- [ ] Pas de tests flaky