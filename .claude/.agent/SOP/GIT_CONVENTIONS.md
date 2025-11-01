# 🌳 GIT CONVENTIONS

**Version** : 1.0  
**Date** : 2025-10-20

---

## 1. CONVENTIONAL COMMITS

### Format
```
type(scope): message

[optional body]

[optional footer]
```

### Types
| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(auth): implement register endpoint` |
| `fix` | Correction bug | `fix(payments): correct BANGE webhook signature` |
| `refactor` | Refactoring (pas de changement fonctionnel) | `refactor(repos): merge duplicate repositories` |
| `test` | Ajout/modification tests | `test(declarations): add workflow integration tests` |
| `docs` | Documentation | `docs(api): update Swagger auth endpoints` |
| `chore` | Tâches maintenance | `chore(deps): upgrade fastapi to 0.104.1` |
| `perf` | Amélioration performance | `perf(db): add index on users.email` |
| `style` | Formatage code | `style(format): run black on codebase` |

### Exemples Complets
```bash
# Feature simple
feat(auth): implement login endpoint

# Feature avec body
feat(declarations): add workflow status transitions

Implemented all 11 status transitions:
- draft → submitted
- submitted → assigned
- assigned → processing
- processing → validated
- validated → paid
- paid → completed

Closes #42

# Bug fix
fix(webhooks): validate HMAC signature correctly

Previous implementation used wrong algorithm.
Now using SHA256 as per BANGE docs.

# Breaking change
feat(api): change declaration status enum

BREAKING CHANGE: Status "pending" renamed to "submitted"
Migration script provided in migrations/002_rename_status.sql

# Multi-scope
feat(auth,users): implement profile completion workflow
```

---

## 2. BRANCHES

### Naming Convention
```
type/identifier-description

Types: feature, bugfix, hotfix, refactor, test, docs

Exemples:
feature/auth-register-endpoint
bugfix/payment-webhook-signature
hotfix/critical-db-connection-leak
refactor/merge-duplicate-repositories
test/add-e2e-declaration-workflow
docs/update-api-readme
```

### Branch Workflow (Git Flow)
```
main (production)
├── develop (staging)
│   ├── feature/auth-register
│   ├── feature/declarations-crud
│   └── bugfix/payment-validation
└── hotfix/critical-security-issue (si bug production)
```

### Rules
- **main** : Production only, protected
- **develop** : Integration branch, protected
- **feature/** : Créer depuis develop
- **bugfix/** : Créer depuis develop
- **hotfix/** : Créer depuis main (urgence production)

---

## 3. WORKFLOW

### Feature Development
```bash
# 1. Créer branche depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/auth-register

# 2. Développer + commits atomiques
git add app/api/v1/auth.py
git commit -m "feat(auth): add register endpoint"

git add tests/use_cases/test_uc_auth.py
git commit -m "test(auth): add register tests"

# 3. Push branche
git push origin feature/auth-register

# 4. Créer Pull Request develop ← feature/auth-register

# 5. Review + merge (squash ou rebase)

# 6. Supprimer branche feature
git branch -d feature/auth-register
```

### Hotfix Critical
```bash
# 1. Créer branche depuis main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-issue

# 2. Fix + commit
git add app/utils/security.py
git commit -m "fix(security): patch JWT signature validation"

# 3. Push + PR main ← hotfix
git push origin hotfix/critical-security-issue

# 4. Merge main + cherry-pick vers develop
git checkout develop
git cherry-pick <commit-hash>
```

---

## 4. COMMITS

### Atomiques
```bash
# ✅ BON - Commits atomiques (1 commit = 1 changement logique)
git commit -m "feat(auth): add User model"
git commit -m "feat(auth): add register endpoint"
git commit -m "test(auth): add register tests"

# ❌ MAUVAIS - Commit fourre-tout
git commit -m "Add auth module with user model, register endpoint, tests, and fix typo in README"
```

### Fréquence
```bash
# Commiter souvent (plusieurs fois par jour)
# Pusher régulièrement (minimum 1x par jour)

# Bon rythme:
10h00 - git commit -m "feat(auth): add User model"
11h30 - git commit -m "feat(auth): add register endpoint"
14h00 - git commit -m "test(auth): add tests"
       - git push origin feature/auth-register
```

### Messages Clairs
```bash
# ✅ BON - Spécifique et actionnable
feat(auth): implement JWT token refresh mechanism
fix(payments): correct BANGE webhook signature validation
refactor(repos): merge user_repository duplicates

# ❌ MAUVAIS - Vague
feat: add stuff
fix: bug
chore: update
```

---

## 5. PULL REQUESTS

### Template PR
```markdown
## Description
Implémentation endpoint register avec validation email unique et hash password bcrypt.

## Type
- [x] Feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Tâche Liée
- TASK-P2-001 : Implémenter UC-AUTH-001 (Register)
- Issue #42

## Changements
### Fichiers Créés
- `app/api/v1/auth.py` - Endpoint register
- `app/services/auth_service.py` - Logique métier auth
- `tests/use_cases/test_uc_auth.py` - Tests register

### Fichiers Modifiés
- `app/main.py` - Include auth router

## Tests
- [x] Tests unitaires écrits (4 tests)
- [x] Tests passants (4/4)
- [x] Coverage >85% (92%)

## Checklist
- [x] Code formatté (black, flake8, isort)
- [x] Type hints complets
- [x] Docstrings présentes
- [x] Pas de secrets hardcodés
- [x] Tests passants
- [x] Documentation mise à jour
```

### Review Process
1. **Author** : Crée PR avec template rempli
2. **Reviewer** : Review code (1-2 jours max)
3. **Author** : Corrige feedback
4. **Reviewer** : Approve PR
5. **Merge** : Squash ou rebase + merge

### Review Checklist Reviewer
- [ ] Code suit standards (PEP 8, type hints, etc.)
- [ ] Architecture correcte (routes → services → repos)
- [ ] Tests présents et passants
- [ ] Coverage >85%
- [ ] Pas de secrets hardcodés
- [ ] Documentation à jour
- [ ] Commit messages Conventional Commits

---

## 6. MERGE STRATEGIES

### Squash Merge (Recommandé)
```bash
# Combine tous commits feature en 1 commit main
# Avantage : Historique main propre
# Usage : Features terminées

git checkout develop
git merge --squash feature/auth-register
git commit -m "feat(auth): implement register endpoint (#42)"
```

### Rebase (Alternative)
```bash
# Rejoue commits feature sur develop
# Avantage : Historique linéaire
# Usage : Synchroniser branche feature avec develop

git checkout feature/auth-register
git rebase develop
git push origin feature/auth-register --force
```

### Merge Commit (Éviter)
```bash
# Crée merge commit
# Désavantage : Historique complexe avec branches
# Usage : Éviter sauf hotfix urgent
```

---

## 7. .GITIGNORE

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
*.egg
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite

# Tests
.pytest_cache/
.coverage
htmlcov/
*.log

# OS
.DS_Store
Thumbs.db

# Project specific
uploads/
temp/
*.tmp
```

---

## 8. GIT HOOKS

### Pre-Commit Hook
```bash
# .git/hooks/pre-commit

#!/bin/bash
set -e

echo "Running pre-commit checks..."

# 1. Linter
echo "1. Running black..."
black --check app/

echo "2. Running flake8..."
flake8 app/

echo "3. Running isort..."
isort --check app/

echo "4. Running mypy..."
mypy app/

# 2. Tests
echo "5. Running tests..."
pytest --cov=app --cov-fail-under=85

echo "✅ All pre-commit checks passed!"
```

### Installation
```bash
# Rendre exécutable
chmod +x .git/hooks/pre-commit

# Ou utiliser pre-commit framework
pip install pre-commit
pre-commit install
```

---

## 9. COMMANDES UTILES

### Historique
```bash
# Voir commits récents
git log --oneline -10

# Voir commits par auteur
git log --author="John Doe" --oneline

# Voir fichiers modifiés
git log --stat

# Voir diff commit
git show <commit-hash>
```

### Annuler Changements
```bash
# Annuler dernier commit (garde changements)
git reset --soft HEAD~1

# Annuler dernier commit (supprime changements)
git reset --hard HEAD~1

# Annuler fichier modifié (pas commité)
git checkout -- <file>

# Annuler tous fichiers modifiés
git checkout .
```

### Stash (Sauvegarder temporairement)
```bash
# Sauvegarder changements
git stash

# Lister stash
git stash list

# Récupérer stash
git stash pop

# Supprimer stash
git stash drop
```

### Rebase Interactif
```bash
# Nettoyer derniers 3 commits
git rebase -i HEAD~3

# Options:
# pick = garder commit
# squash = fusionner avec précédent
# reword = modifier message
# drop = supprimer commit
```

---

## 10. TAGS & RELEASES

### Versioning (Semantic Versioning)
```
v<MAJOR>.<MINOR>.<PATCH>

v1.0.0 - Initial release
v1.1.0 - Nouvelle feature (backward compatible)
v1.1.1 - Bug fix
v2.0.0 - Breaking change
```

### Créer Tag
```bash
# Tag annoté (recommandé)
git tag -a v1.0.0 -m "Release v1.0.0 - Initial MVP"

# Push tag
git push origin v1.0.0

# Push tous tags
git push origin --tags
```

### Release Notes
```markdown
# Release v1.0.0 - Initial MVP

**Date** : 2025-10-20

## Features
- ✅ Module AUTH (15 endpoints)
- ✅ Module USERS (12 endpoints)
- ✅ Module DECLARATIONS (25 endpoints)
- ✅ Module PAYMENTS (18 endpoints)
- ✅ Intégration BANGE webhooks

## Bug Fixes
- fix(auth): JWT refresh token rotation
- fix(webhooks): HMAC signature validation

## Breaking Changes
None

## Known Issues
- OCR confidence <80% on blurry documents

## Contributors
- @dev-team
- @test-team
```

---

## ✅ CHECKLIST GIT WORKFLOW

Avant chaque commit :
- [ ] Code formatté (black, flake8, isort)
- [ ] Tests passants
- [ ] Message commit Conventional Commits
- [ ] Commit atomique (1 changement logique)

Avant chaque push :
- [ ] Branche synchronisée avec develop
- [ ] Tous commits propres
- [ ] Pas de fichiers sensibles (.env, secrets)

Avant chaque PR :
- [ ] Template PR rempli
- [ ] Tests passants
- [ ] Coverage >85%
- [ ] Documentation à jour

---

**Voir aussi** :
- `.agent/SOP/CODE_STANDARDS.md` - Standards code
- `.agent/SOP/DEV_WORKFLOW.md` - Workflow développement
