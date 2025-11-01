# RAPPORT ORCHESTRATION - {TASK_ID}

**Task ID :** {TASK_ID} (ex: TASK-P2-007)
**Description :** {Description courte tâche}
**Module :** {MODULE_ID} - {MODULE_NAME}
**Date début :** {DD/MM/YYYY}
**Date fin :** {DD/MM/YYYY}
**Durée totale :** {X} jours (planifié : {Y} jours)
**Statut final :** {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}

---

## 📊 SYNTHÈSE EXÉCUTION

```
┌────────────────────────────────────────────┐
│  TÂCHE : {TASK_ID}                         │
│  DURÉE : {X} jours                         │
│  SCORE : {XX}/100                          │
│  DÉCISION : {GO/NO-GO}                     │
│  AGENTS : {N} invoqués                     │
└────────────────────────────────────────────┘
```

**Score Go/No-Go :** {XX}/100 ({YY%})  
**Décision :** {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}  
**Prochaine tâche :** {TASK_ID+1} - {Description}

---

## 🔄 WORKFLOW EXÉCUTÉ

### Phase 1 : Développement
**Agent :** DEV_AGENT  
**Workflow :** `.claude/.agent/SOP/DEV_WORKFLOW.md`  
**Début :** {DD/MM/YYYY HH:MM}  
**Fin :** {DD/MM/YYYY HH:MM}  
**Durée :** {X} jours / {Y} heures

**Actions réalisées :**
1. ✅ Lecture sources (Règle 0)
   - Schema database : `database/schema_*.sql` ligne {X}
   - Documentation backend : `.github/docs-internal/Documentations/Backend/{module}.md`
   - Code existant : `packages/backend/app/api/v1/{module}.py`

2. ✅ Implémentation
   - **Fichiers créés :** {N} fichiers
     - `app/api/v1/{module}.py` : {X} lignes
     - `app/services/{module}_service.py` : {Y} lignes
     - `app/database/repositories/{module}_repository.py` : {Z} lignes
   
   - **Fichiers modifiés :** {M} fichiers
     - `{fichier}` : +{X}/-{Y} lignes

3. ✅ Tests unitaires
   - Tests écrits : {N} tests
   - Tests passés : {X}/{N} ({Z%})

4. ✅ Documentation
   - Docstrings : {XX%} complètes
   - README : {✅ Créé / ⚠️ Mis à jour}

**Résultat :** ✅ Implémentation complète

**Rapport généré :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_REPORT.md`

---

### Phase 2 : Validation Tests
**Agent :** TEST_AGENT (invoqué par Go/No-Go Validator)  
**Workflow :** `.claude/.agent/SOP/TEST_WORKFLOW.md`  
**Début :** {DD/MM/YYYY HH:MM}  
**Fin :** {DD/MM/YYYY HH:MM}  
**Durée :** {X} heures

**Tests exécutés :**

#### Backend
- **Tests unitaires (pytest) :**
  - Tests passés : {X}/{Y} ({Z%})
  - Coverage : {XX%}
  
- **Lint (flake8) :**
  - Erreurs : {X}
  - Warnings : {Y}
  
- **Type check (mypy) :**
  - Erreurs : {X}
  - Warnings : {Y}

#### Frontend (si applicable)
- **Tests unitaires (jest) :**
  - Tests passés : {X}/{Y} ({Z%})
  - Coverage : {XX%}
  
- **Lint (eslint) :**
  - Erreurs : {X}
  - Warnings : {Y}
  
- **Type check (tsc) :**
  - Erreurs : {X}
  
- **Build (npm run build) :**
  - Statut : {✅ SUCCESS / ❌ FAILED}
  - Durée : {XX}s

**Résultat :** {✅ Tous tests OK / ⚠️ Quelques échecs / ❌ Échecs critiques}

**Rapport généré :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_TESTS_REPORT.md`

---

### Phase 3 : Validation Documentation
**Agent :** DOC_AGENT (invoqué par Go/No-Go Validator)  
**Workflow :** `.claude/.agent/SOP/DOC_WORKFLOW.md`  
**Début :** {DD/MM/YYYY HH:MM}  
**Fin :** {DD/MM/YYYY HH:MM}  
**Durée :** {X} heures

**Vérifications effectuées :**

1. **README module :**
   - Existe : {✅ OUI / ❌ NON}
   - Complet : {✅ OUI / ⚠️ PARTIEL / ❌ NON}
   - Sections requises : {X}/{Y}

2. **Documentation backend :**
   - Localisation : `.github/docs-internal/Documentations/Backend/`
   - État : {✅ À jour / ⚠️ Partiel / ❌ Obsolète}
   
3. **Swagger API :**
   - Endpoints documentés : {X}/{Y} ({Z%})
   - Exemples requis : {✅ Présents / ❌ Manquants}
   
4. **Docstrings code :**
   - Fonctions documentées : {X}/{Y} ({Z%})
   - Qualité : {✅ Bonne / ⚠️ Moyenne / ❌ Insuffisante}

**Résultat :** {✅ Documentation complète / ⚠️ Améliorations mineures / ❌ Documentation insuffisante}

**Rapport généré :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_DOC_REPORT.md`

---

### Phase 4 : Validation Go/No-Go
**Skill :** Go/No-Go Validator v2.0.0  
**Checklist :** `.claude/.agent/Tasks/GONOGO_CHECKLIST.md`  
**Date :** {DD/MM/YYYY HH:MM}  
**Durée :** {X} minutes

**Calcul score :**
- Backend : {XX}/40 pts
- Frontend : {XX}/30 pts
- Integration : {XX}/15 pts
- Accessibilité & Performance : {XX}/10 pts
- Documentation : {XX}/5 pts

**Score total :** {XX}/100 ({YY%})

**Décision automatique :**
```
if score >= 80:
    decision = "GO ✅"
elif score >= 70:
    decision = "GO CONDITIONNEL ⚠️"
else:
    decision = "NO-GO ❌"
```

**Résultat :** {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}

**Rapport généré :** `.github/docs-internal/ias/04_VALIDATION/GONOGO_{TASK_ID}.md`

---

## 📈 MÉTRIQUES AGRÉGÉES

### Durée & Timeline
| Métrique | Planifié | Réalisé | Écart | Statut |
|----------|----------|---------|-------|--------|
| Durée développement | {X}j | {Y}j | {+/-Z}j | {✅/⚠️/❌} |
| Durée tests | {X}h | {Y}h | {+/-Z}h | {✅/⚠️/❌} |
| Durée documentation | {X}h | {Y}h | {+/-Z}h | {✅/⚠️/❌} |
| **Durée totale** | **{X}j** | **{Y}j** | **{+/-Z}j** | **{✅/⚠️/❌}** |

### Code Quality
| Métrique | Cible | Réalisé | Écart | Statut |
|----------|-------|---------|-------|--------|
| Coverage Backend | ≥85% | {XX%} | {+/-Y%} | {✅/⚠️/❌} |
| Coverage Frontend | ≥75% | {XX%} | {+/-Y%} | {✅/⚠️/❌} |
| Lint Errors | 0 | {X} | {+/-Y} | {✅/⚠️/❌} |
| Type Errors | 0 | {X} | {+/-Y} | {✅/⚠️/❌} |

### Performance
| Métrique | Cible | Réalisé | Écart | Statut |
|----------|-------|---------|-------|--------|
| Build Time Backend | <120s | {XX}s | {+/-Y}s | {✅/⚠️/❌} |
| Build Time Frontend | <180s | {XX}s | {+/-Y}s | {✅/⚠️/❌} |
| API Latency P95 | <500ms | {XX}ms | {+/-Y}ms | {✅/⚠️/❌} |
| Lighthouse Perf | >85 | {XX} | {+/-Y} | {✅/⚠️/❌} |

### Fichiers & Code
| Métrique | Valeur |
|----------|--------|
| Fichiers créés | {N} |
| Fichiers modifiés | {M} |
| Lignes code ajoutées | {X} |
| Lignes code supprimées | {Y} |
| Tests écrits | {Z} |

---

## 🔄 DÉCISIONS TECHNIQUES

{Si aucune décision}
**Aucune décision technique majeure** prise durant cette tâche.

{Si décisions prises}

### Décision 1 : {Titre}
**Date :** {DD/MM/YYYY}  
**Contexte :** {Description problème/besoin}

**Options considérées :**
- **Option A :** {Description}
  - Avantages : {Liste}
  - Inconvénients : {Liste}
  
- **Option B :** {Description}
  - Avantages : {Liste}
  - Inconvénients : {Liste}

**Choix retenu :** Option {A/B}

**Justification :** {Raison détaillée du choix}

**Impact :**
- Performance : {Impact}
- Maintenabilité : {Impact}
- Complexité : {Impact}

**Référence décision formelle :** `.github/docs-internal/ias/01_DECISIONS/DECISION_{NNN}.md`

---

## ⚠️ DIFFICULTÉS RENCONTRÉES

{Si aucune difficulté}
**Aucune difficulté majeure** rencontrée durant cette tâche. ✅

{Si difficultés}

### Difficulté 1 : {Titre}
**Date :** {DD/MM/YYYY}  
**Type :** {Technique / Blocage / Dépendance / Autre}  
**Gravité :** {Faible / Moyenne / Élevée}

**Description :**
{Description détaillée du problème}

**Impact :**
- Temps perdu : {X} heures
- Retard : {Y} jours
- Qualité affectée : {OUI/NON}

**Solution appliquée :**
{Description solution mise en place}

**Résultat :**
{✅ Résolu complètement / ⚠️ Contournement / ❌ Non résolu}

**Leçon apprise :**
{Leçon pour éviter problème futur}

---

## 🚨 INCIDENTS

{Si aucun incident}
**Aucun incident** durant l'exécution de cette tâche. ✅

{Si incidents}

### Incident 1 : {Titre}
**ID Incident :** INCIDENT_{XXX}  
**Date :** {DD/MM/YYYY HH:MM}  
**Gravité :** {P0 Critique / P1 Majeure / P2 Mineure}

**Description :**
{Description incident}

**Impact :**
- Service affecté : {Service}
- Durée interruption : {X} heures
- Utilisateurs impactés : {N} / {% si connu}

**Cause racine :**
{Analyse cause}

**Résolution :**
{Actions prises pour résoudre}

**Prévention future :**
{Actions pour éviter récurrence}

**Référence postmortem :** `.github/docs-internal/ias/05_INCIDENTS/INCIDENT_{XXX}.md`

---

## 🐛 BUGS IDENTIFIÉS

{Si aucun bug}
**Aucun bug** identifié durant validation. ✅

{Si bugs}

### Bugs Critiques (P0)
{Liste bugs P0 ou "Aucun ✅"}

### Bugs Majeurs (P1)
1. **BUG-P1-{XXX}** : {Description courte}
   - Impact : {Description}
   - Statut : {✅ Corrigé / ⚠️ En cours / ❌ Non traité}
   - Assigné à : {Agent/Personne}

### Bugs Mineurs (P2)
1. **BUG-P2-{XXX}** : {Description courte}
   - Impact : {Description}
   - Statut : {✅ Corrigé / ⚠️ En cours / ❌ Non traité}

---

## 📋 ACTIONS POST-VALIDATION

### Git Operations
**Branches :**
- Branche travail : `{branch_name}`
- Commit principal : `{commit_hash}`

**Commits effectués :**
```bash
# Commit 1 : Implémentation
{commit_hash_1} - "feat(TASK_ID): {description}"

# Commit 2 : Tests
{commit_hash_2} - "test(TASK_ID): {description}"

# Commit 3 : Documentation
{commit_hash_3} - "docs(TASK_ID): {description}"

# Commit 4 : Rapports validation
{commit_hash_4} - "docs(validation): Add Go/No-Go TASK_ID - Score: {XX}/100"
```

**Push automatique :**
```bash
git push origin {branch_name}
```

**Statut :** ✅ Push réussi

---

### Rapports Générés

**3 rapports créés :**

1. **Rapport Go/No-Go :**
   - Destination : `.github/docs-internal/ias/04_VALIDATION/GONOGO_{TASK_ID}.md`
   - Contenu : Score, décision, métriques
   - Commit : {commit_hash}

2. **Rapport Agent Dev :**
   - Destination : `.claude/.agent/Reports/PHASE_X/{TASK_ID}_REPORT.md`
   - Contenu : Implémentation, tests, sources
   - Commit : {commit_hash}

3. **Rapport Orchestration :**
   - Destination : `.github/docs-internal/ias/03_PHASES/MODULE_XX/RAPPORT_ORCHESTRATION_{DATE}_{TASK_ID}.md`
   - Contenu : Workflow, agents, métriques
   - Commit : {commit_hash}

**Statut :** ✅ Tous rapports générés et committés

---

## 📚 LEÇONS APPRISES

### Points Positifs
{Si éléments remarquables}
1. {Élément 1 - ex: Architecture 3-tiers bien respectée}
2. {Élément 2 - ex: Tests exhaustifs ont permis d'identifier bugs tôt}
3. {Élément 3 - ex: Documentation claire facilite maintenance}

{Si aucun}
Tâche standard sans élément particulièrement remarquable.

### Points d'Amélioration
{Si éléments à améliorer}
1. {Élément 1 - ex: Documentation aurait pu être rédigée en parallèle du dev}
2. {Élément 2 - ex: Tests E2E auraient pu être plus nombreux}

{Si aucun}
Aucun point d'amélioration identifié. ✅

### Recommandations Futures
{Si recommandations}
1. {Recommandation 1 - ex: Systématiser validation expert métier pour calculs}
2. {Recommandation 2 - ex: Augmenter buffer temps pour modules complexes}

{Si aucune}
Processus standard appliqué avec succès.

---

## 🎯 ÉTAT PROGRESSION MODULE

### Tâches Module
- **Tâches totales module :** {N} (ex: 25 pour PHASE_2)
- **Tâches complétées :** {X} (incluant {TASK_ID})
- **Progression module :** {XX%}
- **Tâches restantes :** {Y}

### Timeline Module
- **Début module :** {DD/MM/YYYY}
- **Fin prévue module :** {DD/MM/YYYY}
- **Jours écoulés :** {X}
- **Jours restants :** {Y}
- **Avance/Retard :** {+/-Z} jours

### Métriques Cumulées Module
- **Coverage backend moyen :** {XX%}
- **Coverage frontend moyen :** {XX%}
- **Score Go/No-Go moyen :** {XX}/100
- **Bugs actifs :** {P0: X, P1: Y, P2: Z}

---

## ✅ VALIDATION & PROCHAINES ÉTAPES

### Validation Tâche
**Statut validation :** {✅ VALIDÉ / ⚠️ CONDITIONNEL / ❌ REFUSÉ}

{Si GO ✅}
**Tâche suivante :** {TASK_ID+1} - {Description}  
**Prêt à démarrer :** {✅ OUI / ⚠️ Après validation utilisateur}

**⚠️ ATTENTE VALIDATION UTILISATEUR**

Commandes disponibles :
```
"GO TASK suivante"     → Démarre {TASK_ID+1}
"Review rapport"       → Affiche détails
"Pause projet"         → Met workflow en pause
```

{Si GO CONDITIONNEL ⚠️}
**Actions requises :**
- [ ] {Action 1}
- [ ] {Action 2}

**Re-validation :** {Date}  
**Deadline :** +48h

{Si NO-GO ❌}
**Corrections majeures requises**

**Durée correction :** {X} jours  
**Re-validation :** {Date}  
**Impact module :** +{X} jours retard

---

## 🔗 RÉFÉRENCES

### Agents & Workflows
- **DEV_AGENT :** `.claude/.agent/Tasks/DEV_AGENT.md`
- **TEST_AGENT :** `.claude/.agent/Tasks/TEST_AGENT.md`
- **DOC_AGENT :** `.claude/.agent/Tasks/DOC_AGENT.md`
- **DEV_WORKFLOW :** `.claude/.agent/SOP/DEV_WORKFLOW.md`
- **TEST_WORKFLOW :** `.claude/.agent/SOP/TEST_WORKFLOW.md`

### Rapports Associés
- **Go/No-Go :** `.github/docs-internal/ias/04_VALIDATION/GONOGO_{TASK_ID}.md`
- **Agent Dev :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_REPORT.md`
- **Agent Tests :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_TESTS_REPORT.md`
- **Agent Doc :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_DOC_REPORT.md`

### Documentation Technique
- **Backend Doc :** `.github/docs-internal/Documentations/Backend/`
- **Database Schema :** `database/schema.sql`
- **Phase Definition :** `.claude/.agent/Tasks/PHASE_X.md`

### Code Source
- **Backend :** `packages/backend/app/api/v1/{module}.py`
- **Frontend :** `packages/web/src/app/(dashboard)/{module}/`
- **Tests :** `packages/backend/tests/` & `packages/web/tests/`

---

**Rapport généré par :** Go/No-Go Validator Skill v2.0.0  
**Template version :** 1.0  
**Date génération :** {DD/MM/YYYY HH:MM}  
**Statut final :** {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}
