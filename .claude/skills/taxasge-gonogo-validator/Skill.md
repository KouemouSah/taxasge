---
name: TaxasGE Go/No-Go Validator
description: Orchestre agents TEST/DOC pour validation tâche, calcule score /100, génère 3 rapports, commit auto
version: 2.0.0
---

# TaxasGE Go/No-Go Validator Skill

## Overview

Ce skill **orchestre** les agents pour valider une tâche complétée. Il ne fait **aucune exécution directe** mais délègue aux agents spécialisés (TEST_AGENT, DOC_AGENT), agrège leurs résultats, calcule un score /100, et génère 3 rapports dans différentes destinations.

**Principe fondamental** : Zéro redondance - Le skill référence, n'exécute pas.

---

## When to Use This Skill

Claude invoquera automatiquement ce skill quand vous dites :
- "Valide TASK-P2-{XXX}"
- "Go/No-Go TASK-P2-{XXX}"
- "Check qualité TASK-P2-{XXX}"
- "Termine TASK-P2-{XXX}"

---

## Core Responsibilities

### 1. Orchestration Agents

**Agents invoqués** :
- **TEST_AGENT** : Tests backend/frontend, lint, coverage
- **DOC_AGENT** : Vérification documentation, README, Swagger

**Référence workflows** :
- `.claude/.agent/SOP/TEST_WORKFLOW.md`
- `.claude/.agent/SOP/DOC_WORKFLOW.md`

### 2. Agrégation Résultats

**Sources** :
- `.claude/.agent/Reports/PHASE_X/TASK_PX_XXX_TESTS_REPORT.md`
- `.claude/.agent/Reports/PHASE_X/TASK_PX_XXX_DOC_REPORT.md`

**Calcul score** : Selon `.claude/.agent/Tasks/GONOGO_CHECKLIST.md`

### 3. Génération 3 Rapports

**Rapport 1 - Validation** :
- Destination : `.github/docs-internal/ias/04_VALIDATION/GONOGO_TASK_PX_XXX.md`
- Template : `.claude/skills/taxasge-gonogo-validator/templates/GONOGO_REPORT.md`

**Rapport 2 - Agent** :
- Destination : `.claude/.agent/Reports/PHASE_X/TASK_PX_XXX_REPORT.md`
- Template : `.claude/.agent/Reports/TASK_REPORT_TEMPLATE.md`

**Rapport 3 - Orchestration** :
- Destination : `.github/docs-internal/ias/03_PHASES/MODULE_XX_NOM/RAPPORT_ORCHESTRATION_{DD_MM_YYYY}_TASK_PX_XXX.md`
- Template : `.claude/skills/taxasge-gonogo-validator/templates/ORCHESTRATION_TASK_REPORT.md`

### 4. Git Automatique

**Actions** :
1. Commit 3 rapports générés
2. Push branche distante
3. **⚠️ PAUSE** : Attente validation utilisateur

---

## Workflow Complet (6 Étapes)

### Étape 1 : Charger Critères Validation

**Fichier** : `.claude/.agent/Tasks/GONOGO_CHECKLIST.md`

**Action** :
```markdown
Lire checklist complète :
- Backend : 40 points (endpoints 224, tests 10, qualité 10)
- Frontend : 30 points (pages 15, tests 10, qualité 5)
- Integration : 15 points (API 10, staging 5)
- Accessibilité : 10 points (lighthouse 5, ARIA 5)
- Documentation : 5 points (README 2, doc backend 2, rapport 1)

TOTAL : /100 points
```

**Référence** : Ne PAS dupliquer les critères, juste les charger.

---

### Étape 2 : Invoquer Agent Test

**Agent** : `.claude/.agent/Tasks/TEST_AGENT.md`  
**Workflow** : `.claude/.agent/SOP/TEST_WORKFLOW.md`

**Commande d'invocation** :
```markdown
> Agent Test, exécute validation complète TASK-P2-{XXX} :
>
> **Backend** :
> - Tests unitaires (pytest)
> - Coverage report (>85% requis)
> - Lint (flake8)
> - Type check (mypy)
>
> **Frontend** (si applicable) :
> - Tests unitaires (jest)
> - Coverage report (>75% requis)
> - Lint (eslint)
> - Type check (tsc)
> - Build (npm run build)
>
> **Génère rapport** :
> `.claude/.agent/Reports/PHASE_2/TASK_P2_{XXX}_TESTS_REPORT.md`
>
> **Format rapport** :
> - Tests passés : X/Y
> - Coverage backend : Z%
> - Coverage frontend : W%
> - Erreurs lint : N
> - Erreurs type : M
> - Build : ✅ SUCCESS / ❌ FAILED
```

**Récupération résultats** :
```markdown
Lire rapport généré :
- `tests_passed` : Booléen
- `coverage_backend` : Pourcentage
- `coverage_frontend` : Pourcentage
- `lint_errors` : Nombre
- `type_errors` : Nombre
- `build_success` : Booléen
```

---

### Étape 3 : Invoquer Agent Doc

**Agent** : `.claude/.agent/Tasks/DOC_AGENT.md`  
**Workflow** : `.claude/.agent/SOP/DOC_WORKFLOW.md`

**Commande d'invocation** :
```markdown
> Agent Doc, vérifie documentation TASK-P2-{XXX} :
>
> **Vérifications** :
> - README module existe et complet
> - Documentation backend dans `.github/docs-internal/Documentations/Backend/` à jour
> - Swagger endpoints documentés
> - Docstrings fonctions publiques
>
> **Génère rapport** :
> `.claude/.agent/Reports/PHASE_2/TASK_P2_{XXX}_DOC_REPORT.md`
>
> **Format rapport** :
> - README : ✅ / ❌
> - Documentation backend : ✅ / ⚠️ / ❌
> - Swagger : ✅ / ❌
> - Docstrings : X% complètes
```

**Récupération résultats** :
```markdown
Lire rapport généré :
- `readme_exists` : Booléen
- `backend_doc_complete` : Booléen
- `swagger_complete` : Booléen
- `docstrings_coverage` : Pourcentage
```

---

### Étape 4 : Calculer Score /100

**Référence** : `.claude/.agent/Tasks/GONOGO_CHECKLIST.md`

**Formule agrégation** :
```markdown
## Backend (40 points)

### Endpoints (20 points)
- Si tous implémentés : 20 pts
- Sinon : (endpoints_réalisés / endpoints_planifiés) * 20

### Tests Backend (10 points)
- Coverage ≥90% : 10 pts
- Coverage 85-90% : 9 pts
- Coverage 80-85% : 8 pts
- Coverage <80% : 0 pts (blocage)

### Qualité Backend (10 points)
- Lint errors = 0 : 4 pts
- Type errors = 0 : 3 pts
- Docstrings ≥90% : 2 pts
- Code dupliqué <10 lignes : 1 pt

## Frontend (30 points)
[Même logique si applicable]

## Integration (15 points)
- API calls OK : 10 pts
- Staging déployé : 5 pts

## Accessibilité (10 points)
- Lighthouse Accessibility >85 : 5 pts
- ARIA labels complets : 5 pts

## Documentation (5 points)
- README : 2 pts
- Documentation backend complète : 2 pts
- Rapport tâche : 1 pt

TOTAL = backend_score + frontend_score + integration_score + accessibility_score + doc_score
```

**Décision automatique** :
```markdown
if total_score >= 80:
    decision = "GO ✅"
elif total_score >= 70:
    decision = "GO CONDITIONNEL ⚠️"
else:
    decision = "NO-GO ❌"
```

---

### Étape 5 : Générer 3 Rapports

#### **Rapport 1 : Go/No-Go (Validation)**

**Template** : `.claude/skills/taxasge-gonogo-validator/templates/GONOGO_REPORT.md`  
**Destination** : `.github/docs-internal/ias/04_VALIDATION/GONOGO_TASK_P2_{XXX}.md`

**Contenu** :
```markdown
# GO/NO-GO TASK-P2-{XXX} - {DESCRIPTION}

**Date** : {DD/MM/YYYY}
**Score** : {X}/100 ({Y%})
**Décision** : {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}

## Détails Évaluation

### Backend ({X}/40)
- Endpoints : {score}/20
- Tests : {score}/10
- Qualité : {score}/10

### Frontend ({X}/30)
[Si applicable]

### Integration ({X}/15)
- API : {score}/10
- Staging : {score}/5

### Accessibilité ({X}/10)
- Lighthouse : {score}/5
- ARIA : {score}/5

### Documentation ({X}/5)
- README : {score}/2
- Backend doc : {score}/2
- Rapport : {score}/1

## Bugs Critiques
- [ ] Aucun ✅ / Liste bugs P0

## Métriques Finales
- Coverage Backend : {X%}
- Coverage Frontend : {Y%}
- Lint Errors : {N}
- Type Errors : {M}

## Prochaines Étapes
[Si GO] TASK-P2-{XXX+1} peut démarrer après validation utilisateur
[Si NO-GO] Corrections requises : [Liste]
```

---

#### **Rapport 2 : Agent (Traçabilité)**

**Template** : `.claude/.agent/Reports/TASK_REPORT_TEMPLATE.md`  
**Destination** : `.claude/.agent/Reports/PHASE_2/TASK_P2_{XXX}_REPORT.md`

**Contenu** :
```markdown
# RAPPORT TÂCHE P2-{XXX} - {DESCRIPTION}

**Agent** : DEV_AGENT
**Date** : {DD/MM/YYYY}
**Durée** : {X} jours
**Statut** : ✅ COMPLÉTÉ

## Implémentation

### Fichiers Créés
- `app/api/v1/{module}.py` : {X} lignes
- `app/services/{module}_service.py` : {Y} lignes
- `app/database/repositories/{module}_repository.py` : {Z} lignes

### Fichiers Modifiés
- `{fichier}` : +{X}/-{Y} lignes

## Tests

### Tests Écrits
- `tests/use_cases/test_uc_{module}.py` : {N} tests
- Coverage : {X%}

## Sources Vérifiées (Règle 0)
1. `database/schema.sql` ligne {X} : Vérification types
2. `.env` ligne {Y} : Configuration
3. `.github/docs-internal/Documentations/Backend/{module}.md` : Référence

## Difficultés Rencontrées
- Aucune ✅ / Liste difficultés

## Prochaines Étapes
Validation Go/No-Go
```

---

#### **Rapport 3 : Orchestration Tâche**

**Template** : `.claude/skills/taxasge-gonogo-validator/templates/ORCHESTRATION_TASK_REPORT.md`  
**Destination** : `.github/docs-internal/ias/03_PHASES/MODULE_02_CORE_BACKEND/RAPPORT_ORCHESTRATION_{DD_MM_YYYY}_TASK_P2_{XXX}.md`

**Contenu** :
```markdown
# RAPPORT ORCHESTRATION - TASK-P2-{XXX}

**Date validation** : {DD/MM/YYYY HH:MM}
**Durée totale** : {X} jours
**Statut** : {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}

## Workflow Exécuté

### 1. Développement
**Agent** : DEV_AGENT
**Workflow** : DEV_WORKFLOW.md
**Durée** : {X} jours
**Résultat** : ✅ Implémentation complète

### 2. Tests
**Agent** : TEST_AGENT
**Workflow** : TEST_WORKFLOW.md
**Durée** : {Y} heures
**Résultat** :
- Tests passés : {X}/{Y}
- Coverage : {Z%}

### 3. Documentation
**Agent** : DOC_AGENT
**Workflow** : DOC_WORKFLOW.md
**Durée** : {W} heures
**Résultat** : ✅ Documentation complète

### 4. Validation Go/No-Go
**Score** : {X}/100
**Décision** : {GO/NO-GO}

## Métriques Agrégées

| Métrique | Planifié | Réalisé | Écart |
|----------|----------|---------|-------|
| Durée | {X}j | {Y}j | {+/-}Z% |
| Endpoints | {A} | {B} | {+/-}C |
| Tests | {D} | {E} | {+/-}F |
| Coverage | {G%} | {H%} | {+/-}I% |

## Décisions Techniques

### Décision 1 : {Titre}
**Contexte** : {Description}
**Choix** : {Option retenue}
**Justification** : {Raison}
**Référence** : `.github/docs-internal/ias/01_DECISIONS/DECISION_{NNN}.md`

## Blockers Rencontrés
- Aucun ✅ / Liste blockers résolus

## Leçons Apprises
**Positives** :
- {Leçon 1}

**Améliorations** :
- {Amélioration 1}

## Prochaine Tâche
**TASK-P2-{XXX+1}** : {Description}
**Assigné à** : {Agent}
**Début prévu** : {Date} (après validation utilisateur)
```

---

### Étape 6 : Git Commit + Push Automatique

**Script** : `.claude/skills/taxasge-gonogo-validator/scripts/invoke_validation.sh`

**Actions automatiques** :
```bash
#!/bin/bash
# Invoqué automatiquement après génération rapports

TASK_ID=$1
PHASE=$2
MODULE=$3
DATE=$(date +%d_%m_%Y)

# 1. Commit rapport Go/No-Go
git add .github/docs-internal/ias/04_VALIDATION/GONOGO_${TASK_ID}.md
git commit -m "docs(validation): Add Go/No-Go ${TASK_ID} - Score: {X}/100 - Decision: {GO/NO-GO}"

# 2. Commit rapport agent
git add .claude/.agent/Reports/${PHASE}/${TASK_ID}_REPORT.md
git add .claude/.agent/Reports/${PHASE}/${TASK_ID}_TESTS_REPORT.md
git add .claude/.agent/Reports/${PHASE}/${TASK_ID}_DOC_REPORT.md
git commit -m "docs(agent): Add ${TASK_ID} reports (dev + tests + doc)"

# 3. Commit rapport orchestration
git add .github/docs-internal/ias/03_PHASES/${MODULE}/RAPPORT_ORCHESTRATION_${DATE}_${TASK_ID}.md
git commit -m "docs(orchestration): Add ${TASK_ID} orchestration report"

# 4. Push branche distante
CURRENT_BRANCH=$(git branch --show-current)
git push origin ${CURRENT_BRANCH}

echo "✅ Git commit + push automatique réussi"
echo "📊 Rapports générés :"
echo "  - .github/docs-internal/ias/04_VALIDATION/GONOGO_${TASK_ID}.md"
echo "  - .claude/.agent/Reports/${PHASE}/${TASK_ID}_*.md"
echo "  - .github/docs-internal/ias/03_PHASES/${MODULE}/RAPPORT_ORCHESTRATION_${DATE}_${TASK_ID}.md"
echo ""
echo "⚠️ ATTENTE VALIDATION UTILISATEUR"
echo "Commandes disponibles :"
echo "  - 'GO TASK suivante' : Continue workflow"
echo "  - 'NO-GO corrections' : Liste corrections à faire"
```

**⚠️ PAUSE WORKFLOW** :
```markdown
Après push automatique, le workflow s'arrête et affiche :

┌─────────────────────────────────────────────────────────┐
│ ✅ TASK-P2-{XXX} VALIDÉE                                │
│                                                          │
│ Score : {X}/100 ({Y%})                                  │
│ Décision : {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}      │
│                                                          │
│ Rapports générés :                                      │
│ - Go/No-Go : ias/04_VALIDATION/GONOGO_TASK_P2_{XXX}.md │
│ - Agent : .agent/Reports/PHASE_2/TASK_P2_{XXX}_*.md    │
│ - Orchestration : ias/03_PHASES/MODULE_02/RAPPORT_...  │
│                                                          │
│ ⚠️ VALIDATION REQUISE POUR CONTINUER                    │
│                                                          │
│ Que voulez-vous faire ?                                 │
│ 1. GO → Continue avec TASK-P2-{XXX+1}                  │
│ 2. NO-GO → Liste corrections à faire                   │
│ 3. Voir rapports détaillés                             │
└─────────────────────────────────────────────────────────┘
```

---

## References

### Agents
- `.claude/.agent/Tasks/TEST_AGENT.md` - Agent tests
- `.claude/.agent/Tasks/DOC_AGENT.md` - Agent documentation

### Workflows
- `.claude/.agent/SOP/TEST_WORKFLOW.md` - Processus tests
- `.claude/.agent/SOP/DOC_WORKFLOW.md` - Processus documentation

### Critères Validation
- `.claude/.agent/Tasks/GONOGO_CHECKLIST.md` - Checklist complète avec scoring

### Templates Rapports
- `.claude/skills/taxasge-gonogo-validator/templates/GONOGO_REPORT.md`
- `.claude/skills/taxasge-gonogo-validator/templates/ORCHESTRATION_TASK_REPORT.md`
- `.claude/.agent/Reports/TASK_REPORT_TEMPLATE.md`

### Scripts
- `.claude/skills/taxasge-gonogo-validator/scripts/invoke_validation.sh`

---

## Success Criteria

Une validation Go/No-Go est réussie si :
- ✅ TEST_AGENT invoqué (pas exécution directe)
- ✅ DOC_AGENT invoqué (pas exécution directe)
- ✅ Score calculé depuis rapports agents
- ✅ 3 rapports générés (validation, agent, orchestration)
- ✅ Rapports dans bonnes destinations
- ✅ Git commit + push automatique réussi
- ✅ Workflow pause pour validation utilisateur

---

## Example Usage

**User says:** "Valide TASK-P2-007"

**Skill actions:**
1. Charge `.claude/.agent/Tasks/GONOGO_CHECKLIST.md`
2. Invoque TEST_AGENT
   - Exécute tests backend/frontend
   - Génère `.claude/.agent/Reports/PHASE_2/TASK_P2_007_TESTS_REPORT.md`
3. Invoque DOC_AGENT
   - Vérifie documentation
   - Génère `.claude/.agent/Reports/PHASE_2/TASK_P2_007_DOC_REPORT.md`
4. Calcule score : 87/100
5. Décision : GO ✅
6. Génère 3 rapports :
   - `ias/04_VALIDATION/GONOGO_TASK_P2_007.md`
   - `.agent/Reports/PHASE_2/TASK_P2_007_REPORT.md`
   - `ias/03_PHASES/MODULE_02_CORE_BACKEND/RAPPORT_ORCHESTRATION_31_10_2025_TASK_P2_007.md`
7. Git commit + push automatique
8. Affiche message validation et PAUSE

**User says:** "GO TASK suivante"

**Skill actions:**
9. Démarre TASK-P2-008

---

**Skill created by:** TaxasGE Backend Team  
**Date:** 2025-10-31  
**Version:** 2.0.0  
**Status:** ✅ READY FOR USE
