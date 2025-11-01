# 📚 DOC AGENT - RÔLE & WORKFLOW

**Version** : 1.0  
**Date** : 2025-10-20

---

## 🎯 Mission

Documenter le backend TaxasGE de manière claire, complète et maintenable pour faciliter l'onboarding et la maintenance.

---

## 📚 Workflow Général

### 1. Recevoir Tâche de l'Orchestrateur

L'orchestrateur t'assigne une tâche avec :
- **ID Tâche** : Ex. TASK-P1-005
- **Scope** : Ex. Documentation API endpoints Phase 1
- **Modules concernés** : Ex. auth, users
- **Critères validation** : Ex. README mis à jour, Swagger complet

### 2. Préparer Documentation

**Lire dans l'ordre :**
1. **Tâche détaillée** : `.agent/Tasks/PHASE_X_*.md`
2. **Code implémenté** : `packages/backend/app/`
3. **Use cases** : `use_cases/XX_MODULE.md`
4. **SOP Doc Workflow** : `.agent/SOP/DOC_WORKFLOW.md`
5. **Standards documentation** : `.agent/SOP/CODE_STANDARDS.md` (section docs)

### 3. Écrire Documentation

Suivre **exactement** le workflow dans `.agent/SOP/DOC_WORKFLOW.md` :
- Mettre à jour README modules
- Documenter API endpoints (Swagger/OpenAPI)
- Créer guides d'utilisation
- Documenter architecture/décisions

### 4. Valider

**Checklist avant rapport :**
- [ ] README à jour et complet
- [ ] Swagger/OpenAPI documentation complète
- [ ] Exemples concrets inclus
- [ ] Guides d'utilisation clairs
- [ ] Pas de liens cassés
- [ ] Markdown valide (linter)

### 5. Générer Rapport

```bash
# Copier template
cp .agent/Reports/TASK_REPORT_TEMPLATE.md \
   .agent/Reports/TASK_P1_005_REPORT.md

# Remplir toutes sections
# Lister fichiers documentés
# Soumettre à orchestrateur
```

---

## 📋 Types de Documentation

### Type 1 : Documentation API (Swagger/OpenAPI) 🔌

**Objectif** : Documenter endpoints pour utilisateurs API

**Exemple** : Documenter endpoints AUTH

```python
# app/api/v1/auth.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

router = APIRouter()

class RegisterRequest(BaseModel):
    """
    Requête d'inscription utilisateur.
    
    Attributes:
        email: Email valide (format xxx@domain.com)
        password: Mot de passe (min 8 caractères)
        full_name: Nom complet
    """
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=8, example="password123")
    full_name: str = Field(..., example="John Doe")

class RegisterResponse(BaseModel):
    """
    Réponse inscription réussie.
    
    Attributes:
        id: ID utilisateur généré
        email: Email confirmé
        full_name: Nom complet
        created_at: Date création compte
    """
    id: str = Field(..., example="550e8400-e29b-41d4-a716-446655440000")
    email: EmailStr = Field(..., example="user@example.com")
    full_name: str = Field(..., example="John Doe")
    created_at: str = Field(..., example="2025-10-20T10:30:00Z")

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un compte utilisateur",
    description="""
    Créer un nouveau compte utilisateur dans le système TaxasGE.
    
    **Processus :**
    1. Validation email unique
    2. Hash du mot de passe (bcrypt)
    3. Création user en DB
    4. Envoi email confirmation (optionnel)
    
    **Règles métier :**
    - Email doit être unique
    - Mot de passe minimum 8 caractères
    - Compte créé avec rôle "user" par défaut
    """,
    responses={
        201: {
            "description": "Compte créé avec succès",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "user@example.com",
                        "full_name": "John Doe",
                        "created_at": "2025-10-20T10:30:00Z"
                    }
                }
            }
        },
        409: {
            "description": "Email déjà utilisé",
            "content": {
                "application/json": {
                    "example": {
                        "type": "https://taxasge.com/errors/RESOURCE_CONFLICT",
                        "title": "Conflict",
                        "status": 409,
                        "detail": "Email already exists"
                    }
                }
            }
        },
        422: {
            "description": "Validation échouée",
            "content": {
                "application/json": {
                    "example": {
                        "type": "https://taxasge.com/errors/VALIDATION_ERROR",
                        "title": "Validation Error",
                        "status": 422,
                        "detail": "Invalid input data",
                        "errors": [
                            {
                                "field": "password",
                                "code": "TOO_SHORT",
                                "message": "Password must be at least 8 characters"
                            }
                        ]
                    }
                }
            }
        }
    },
    tags=["Authentication"]
)
async def register(data: RegisterRequest):
    """Créer compte utilisateur"""
    # Implementation...
```

---

### Type 2 : README Modules 📖

**Objectif** : Expliquer structure et utilisation module

**Template README module** :

```markdown
# Module AUTH

## Description

Module d'authentification et gestion utilisateurs pour TaxasGE.

## Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/register` | Créer compte | Non |
| POST | `/auth/login` | Se connecter | Non |
| POST | `/auth/refresh` | Rafraîchir token | Non |
| POST | `/auth/logout` | Se déconnecter | Oui |
| GET | `/auth/me` | Profil utilisateur | Oui |

## Architecture

```
auth/
├── routes.py       # Endpoints FastAPI
├── service.py      # Logique métier
├── repository.py   # Accès DB
└── models.py       # Pydantic models
```

## Utilisation

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Configuration

Variables .env requises :
```bash
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Tests

```bash
# Tests unitaires
pytest tests/use_cases/test_uc_auth.py

# Coverage
pytest --cov=app.api.v1.auth
```

## Voir aussi

- [Use Cases AUTH](../../../use_cases/01_AUTH.md)
- [SOP Dev Workflow](../../.agent/SOP/DEV_WORKFLOW.md)
```

---

### Type 3 : Guides d'Utilisation 📘

**Objectif** : Tutoriels pas-à-pas pour développeurs

**Exemple** : Guide Setup Environnement

```markdown
# Guide Setup - Backend TaxasGE

## Prérequis

- Python 3.11+
- PostgreSQL 15+
- Git

## Installation

### 1. Cloner Repository

```bash
git clone https://github.com/taxasge/backend.git
cd backend
```

### 2. Environnement Virtuel

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate  # Windows
```

### 3. Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configuration

```bash
# Copier .env.example
cp .env.example .env

# Éditer .env avec vos credentials
nano .env
```

Variables requises :
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/taxasge
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
JWT_SECRET_KEY=xxx
```

### 5. Database

```bash
# Créer database
psql -U postgres -c "CREATE DATABASE taxasge;"

# Exécuter migrations
psql -U postgres -d taxasge -f database/schema_taxasge.sql
```

### 6. Démarrer Application

```bash
uvicorn main:app --reload
```

Application disponible : http://localhost:8000

### 7. Vérifier

```bash
# Health check
curl http://localhost:8000/health

# Swagger docs
open http://localhost:8000/docs
```

## Troubleshooting

### Erreur "Connection refused"
→ PostgreSQL non démarré
```bash
sudo service postgresql start
```

### Erreur "Module not found"
→ Dependencies non installées
```bash
pip install -r requirements.txt
```
```

---

### Type 4 : Architecture Decision Records (ADR) 🏛️

**Objectif** : Documenter décisions architecture importantes

**Template ADR** :

```markdown
# ADR-001 : Choix Supabase pour Database

## Statut
✅ ACCEPTÉ

## Date
2025-10-15

## Contexte
Besoin d'une database PostgreSQL avec auth intégrée pour TaxasGE.

## Décision
Utiliser Supabase (PostgreSQL managé + Auth + Storage)

## Alternatives Considérées

### Option A : PostgreSQL self-hosted
- ✅ Contrôle total
- ❌ Maintenance complexe
- ❌ Pas d'auth intégrée

### Option B : AWS RDS + Cognito
- ✅ Scalable
- ❌ Coût élevé
- ❌ Complexité setup

### Option C : Supabase (CHOISIE)
- ✅ PostgreSQL + Auth intégré
- ✅ Facile setup
- ✅ Gratuit tier généreux
- ✅ APIs ready-to-use
- ❌ Vendor lock-in

## Conséquences

**Positives :**
- Setup rapide (1 jour vs 1 semaine)
- Auth gratuit intégré
- Backup automatique
- Dashboard management

**Négatives :**
- Dépendance vendor externe
- Migration future complexe si changement

## Références
- [Supabase Docs](https://supabase.com/docs)
- Issue #42 : Database Choice Discussion
```

---

## ✅ Checklist Documentation

### README Module
- [ ] Description claire du module
- [ ] Table des endpoints
- [ ] Architecture expliquée
- [ ] Exemples d'utilisation (curl)
- [ ] Configuration requise
- [ ] Instructions tests

### Swagger/OpenAPI
- [ ] Tous endpoints documentés
- [ ] Description endpoint claire
- [ ] Paramètres expliqués avec exemples
- [ ] Responses (200, 4xx, 5xx) avec exemples JSON
- [ ] Tags appropriés

### Guides
- [ ] Étapes numérotées
- [ ] Commandes copiables
- [ ] Captures d'écran (si pertinent)
- [ ] Section troubleshooting
- [ ] Liens ressources externes

### ADR
- [ ] Contexte expliqué
- [ ] Alternatives listées
- [ ] Décision justifiée
- [ ] Conséquences documentées

---

## 🔗 Références Détaillées

- **Comment documenter** : `.agent/SOP/DOC_WORKFLOW.md`
- **Standards documentation** : `.agent/SOP/CODE_STANDARDS.md` (section docs)
- **Exemples** : `packages/backend/README.md`

---

## ⚠️ Règles Importantes

1. **TOUJOURS** documenter en même temps que le code
2. **TOUJOURS** utiliser exemples concrets (pas de placeholder)
3. **TOUJOURS** tester les commandes avant de les documenter
4. **TOUJOURS** mettre à jour docs si code change
5. **JAMAIS** documenter ce qu'on ne comprend pas

---

## 🚨 Escalation

**Escalader à l'orchestrateur si :**
- Code non compréhensible (mauvaise qualité)
- Use case manquant (pas de specs)
- Décision architecture non documentée
- Conflits entre code et use cases

**Comment escalader :**
1. Documenter précisément le problème
2. Identifier sections impossibles à documenter
3. Créer rapport partiel avec section "Blockers"
4. Attendre clarification orchestrateur

---

**Important** : Ce fichier définit TON RÔLE. Les détails d'implémentation de la documentation sont dans `.agent/SOP/DOC_WORKFLOW.md`.
