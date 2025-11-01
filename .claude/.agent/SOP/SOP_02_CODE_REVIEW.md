# SOP 2 : CODE REVIEW PROCESS

**Fréquence** : À chaque Pull Request  
**Durée** : Review < 4h après PR création  
**Participants** : Agent DEV (author) + Reviewer (autre DEV ou Orchestrateur)

---

## OBJECTIF

Garantir qualité code avant merge vers `develop` ou `main` :
- ✅ Code fonctionnel et testé
- ✅ Conventions respectées
- ✅ Pas de bugs évidents
- ✅ Documentation à jour

---

## PROCÉDURE

### 1. CRÉATION PULL REQUEST

**Agent DEV (Author)** :

#### 1.1 Avant de créer PR
```bash
# 1. Vérifier que tous tests passent
pytest

# 2. Vérifier linters
black app/
flake8 app/
mypy app/

# 3. Vérifier coverage (doit être >85%)
pytest --cov=app --cov-report=term

# 4. Commit et push
git add .
git commit -m "feat: Add POST /declarations/create endpoint"
git push origin feature/declarations-create
```

#### 1.2 Créer PR sur GitHub
```markdown
## Description
Implémentation de l'endpoint POST /declarations/create permettant aux users de créer une déclaration.

## Type de changement
- [x] Nouvelle feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation

## Tâche Liée
- TASK-P2-003
- Use Cases: UC-DECL-001, UC-DECL-002

## Changements
- Ajout endpoint `POST /api/v1/declarations/create`
- Ajout service `DeclarationService.create_declaration()`
- Ajout repository `DeclarationRepository.create()`
- Ajout models Pydantic `DeclarationCreate`, `DeclarationResponse`
- 12 tests unitaires ajoutés

## Checklist
- [x] Tests passants
- [x] Coverage >85% (actuel: 89%)
- [x] Linters passants (black, flake8, mypy)
- [x] Documentation mise à jour (Swagger)
- [x] Pas de secrets en dur dans le code
- [x] Migration DB créée (si applicable)
- [x] Changelog mis à jour

## Screenshots / Exemples
```json
// Request
POST /api/v1/declarations/create
{
  "service_id": "uuid",
  "data": {"revenue": 5000000}
}

// Response 201
{
  "id": "uuid",
  "reference": "DECL-2025-000123",
  "status": "draft",
  "amount": 250000,
  "created_at": "2025-10-20T10:00:00Z"
}
```

## Tests Coverage
- `test_create_declaration_success()`
- `test_create_declaration_invalid_service()`
- `test_create_declaration_missing_data()`
- ... (9 autres tests)

## Points d'attention pour le reviewer
- Vérifier calcul du montant (base_amount + % revenue)
- Vérifier validation des données selon le service fiscal
```

---

### 2. CODE REVIEW (Reviewer)

**Reviewer** (autre Agent DEV ou Orchestrateur) :

#### 2.1 Review Checklist

**Fonctionnel** :
```markdown
- [ ] Code compile et tests passent
- [ ] Logique métier correcte
- [ ] Edge cases gérés
- [ ] Erreurs gérées proprement (try/except)
- [ ] Validation des inputs (Pydantic)
```

**Qualité Code** :
```markdown
- [ ] Code lisible et bien structuré
- [ ] Nommage clair (variables, fonctions)
- [ ] Pas de code dupliqué
- [ ] Fonctions <50 lignes (si possible)
- [ ] Commentaires utiles (pas redondants)
```

**Tests** :
```markdown
- [ ] Coverage >85%
- [ ] Tests unitaires pour nouvelles fonctions
- [ ] Tests cas nominaux ET edge cases
- [ ] Mocks corrects (DB, external APIs)
- [ ] Tests clairs et bien nommés
```

**Sécurité** :
```markdown
- [ ] Pas de secrets en dur (API keys, passwords)
- [ ] Input validation (SQL injection, XSS)
- [ ] Authorization checks (RBAC)
- [ ] Pas de logs sensibles (passwords, tokens)
```

**Performance** :
```markdown
- [ ] Pas de N+1 queries
- [ ] Indexes DB utilisés
- [ ] Pas de boucles lentes
- [ ] Cache utilisé si approprié
```

**Documentation** :
```markdown
- [ ] Docstrings pour fonctions publiques
- [ ] Swagger mis à jour
- [ ] README mis à jour (si nécessaire)
- [ ] CHANGELOG mis à jour
```

#### 2.2 Types de Commentaires

**🟢 APPROUVER (Approve)** :
```
Code looks good! ✅

Petits commentaires non-bloquants :
- nit: Consider renaming `data` to `declaration_data` for clarity
- suggestion: Could extract validation logic to separate function

LGTM (Looks Good To Me) 👍
```

**🟡 DEMANDER CHANGEMENTS (Request Changes)** :
```
Changes required before merge ⚠️

**BLOQUANT** :
1. Line 45: Missing error handling for `db.execute()` 
   - Add try/except with proper logging
   
2. Line 78: Security issue - No authorization check
   - Add `@require_auth()` decorator

**NON-BLOQUANT** :
3. Line 120: Consider adding docstring to `_calculate_amount()`
4. Test coverage only 82% - Target is 85%

Please fix bloquants et repush. Merci !
```

**🔴 REJETER (Reject)** :
```
Cannot approve - Critical issues ❌

**CRITIQUES** :
1. Breaking change sans migration DB
   - Add Alembic migration before merge

2. Tests ne passent pas (3 failures)
   - Fix failing tests

3. Code contient API key en dur (line 56)
   - Use environment variable

Please fix and request review again.
```

---

### 3. ITÉRATIONS

**Agent DEV (Author)** répond aux commentaires :

#### 3.1 Faire les corrections
```bash
# Fix issues
git add .
git commit -m "fix: Add error handling and auth check"
git push origin feature/declarations-create
```

#### 3.2 Répondre aux commentaires
```markdown
> Line 45: Missing error handling for `db.execute()`

✅ Fixed - Added try/except with logging

> Line 78: Security issue - No authorization check

✅ Fixed - Added @require_auth() decorator

> Line 120: Consider adding docstring

✅ Done - Added docstring with examples

> Test coverage only 82%

✅ Fixed - Added 2 more tests, coverage now 87%
```

---

### 4. APPROBATION & MERGE

**Reviewer** approuve :
```
All comments addressed ✅
LGTM - Ready to merge 🚀
```

**Orchestrateur** merge PR :
```bash
# Merge vers develop (squash commits pour historique propre)
git checkout develop
git merge --squash feature/declarations-create
git commit -m "feat: Add POST /declarations/create endpoint (#123)"
git push origin develop

# Delete feature branch
git branch -d feature/declarations-create
git push origin --delete feature/declarations-create
```

---

## TEMPLATES COMMENTAIRES

### Template Approbation
```markdown
✅ **APPROVED**

Great work! Code is clean and well-tested.

**Highlights** :
- Good error handling
- Comprehensive tests (92% coverage)
- Clear docstrings

**Minor suggestions** (non-blocking):
- Consider extracting validation logic to separate service
- Could add integration test for full workflow

LGTM 👍 Ready to merge!
```

### Template Request Changes
```markdown
⚠️ **CHANGES REQUESTED**

Good progress! Few things to address before merge:

**MUST FIX** :
1. [Line 45] Add error handling for DB operations
2. [Line 78] Missing authorization check
3. [Tests] Coverage 82% - target is 85%

**NICE TO HAVE** :
4. [Line 120] Add docstring
5. [Naming] Rename `data` → `declaration_data`

Please fix items 1-3 and repush. Thanks!
```

### Template Rejection
```markdown
❌ **CANNOT APPROVE**

Critical issues found that must be fixed:

**BLOCKERS** :
1. Tests failing (3 failures) - MUST be green
2. Security: API key hardcoded (line 56) - Use env var
3. Breaking change without migration - Add Alembic migration

Please fix these and request review again.
```

---

## ANTI-PATTERNS

❌ **Review after >24h** → Author context perdu
✅ Solution : Review dans 4h max (objectif : 2h)

❌ **Approve sans lire le code** → Bugs en production
✅ Solution : Checklist obligatoire, jamais approve aveugle

❌ **Commentaires vagues** : "This is bad"
✅ Solution : Commentaires spécifiques avec suggestions

❌ **Merge sans approval** → Court-circuite processus qualité
✅ Solution : Branch protection rules (require 1 approval)

❌ **PR >500 lignes** → Impossible à review correctement
✅ Solution : Split en plusieurs PRs plus petites

---

## GITHUB BRANCH PROTECTION RULES

**Configuration `develop` branch** :
```yaml
Branch Protection Rules:
- [x] Require pull request reviews before merging
  - Required approvals: 1
- [x] Require status checks to pass before merging
  - Required checks: CI Tests, Linter, Coverage
- [x] Require branches to be up to date before merging
- [x] Include administrators (même règles pour tous)
- [ ] Allow force pushes (NON - jamais)
- [ ] Allow deletions (NON)
```

**Configuration `main` branch** (production) :
```yaml
Branch Protection Rules:
- [x] Require pull request reviews before merging
  - Required approvals: 2 (DEV + Orchestrateur)
- [x] Require status checks to pass before merging
  - Required checks: CI Tests, Linter, Coverage, Security Scan
- [x] Require branches to be up to date before merging
- [x] Include administrators
- [x] Require signed commits
```

---

## AUTOMATED CHECKS (GitHub Actions)

**PR Check Workflow** :
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    branches: [ develop, main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run black
        run: black --check app/
      - name: Run flake8
        run: flake8 app/
      - name: Run mypy
        run: mypy app/
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: pytest --cov=app --cov-fail-under=85
  
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Bandit
        run: bandit -r app/
```

---

## MÉTRIQUES & KPIs

| Métrique | Target | Mesure |
|----------|--------|--------|
| Temps review | <4h | GitHub PR timestamp |
| PRs approuvées 1er round | >70% | GitHub stats |
| Bugs en production | <2/mois | Incident tracker |
| Code coverage | >85% | Pytest report |
| PR size | <300 lignes | GitHub stats |

---

## ESCALATION

**Si désaccord Author ↔ Reviewer** :
1. Discussion async (commentaires GitHub)
2. Si pas de consensus → Sync call (30 min)
3. Si toujours désaccord → Orchestrateur décide (final)

**Si review bloquée >24h** :
1. Author ping Reviewer (Slack)
2. Si pas de réponse → Orchestrateur reassign à autre reviewer
3. Objectif : Jamais bloquer >48h

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-10-20  
**Propriétaire** : Orchestrateur
