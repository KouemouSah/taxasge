# GO/NO-GO TASK-{TASK_ID} - {DESCRIPTION}

**Task ID :** {TASK_ID} (ex: TASK-P2-007)
**Description :** {Description courte tâche}
**Date validation :** {DD/MM/YYYY HH:MM}
**Évaluateur :** Go/No-Go Validator Skill
**Agent Dev :** {DEV_AGENT / FRONTEND_AGENT}

---

## 🎯 SCORE FINAL

```
┌─────────────────────────────────────┐
│  SCORE : {XX}/100 ({YY%})           │
│  DÉCISION : {DECISION}              │
│  ✅ GO                              │
│  ⚠️ GO CONDITIONNEL                 │
│  ❌ NO-GO                           │
└─────────────────────────────────────┘
```

**Décision :** {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}

**Justification :** {Raison décision basée sur score}

---

## 📊 DÉTAILS ÉVALUATION

### 1. BACKEND ({XX}/40 points)

#### Endpoints ({XX}/20 points)
- **Implémentés :** {X}/{Y} endpoints ({Z%})
- **Validation Pydantic :** {✅ Complète / ⚠️ Partielle / ❌ Manquante}
- **Error handling RFC 7807 :** {✅ Tous endpoints / ⚠️ Partiel / ❌ Manquant}
- **Documentation Swagger :** {✅ Complète / ⚠️ Partielle / ❌ Manquante}

**Score Endpoints :** {XX}/20

#### Tests Backend ({XX}/10 points)
- **Coverage pytest :** {XX%} (cible : >85%)
- **Tests unitaires :** {X}/{Y} passés ({Z%})
- **Tests intégration :** {✅ Passent / ❌ Échec}

**Score Tests Backend :** {XX}/10

#### Qualité Code Backend ({XX}/10 points)
- **Lint (flake8) :** {X} erreurs ({✅ 0 / ❌ >0})
- **Type check (mypy) :** {X} erreurs ({✅ 0 / ❌ >0})
- **Docstrings :** {XX%} complètes (cible : 100%)
- **Code dupliqué :** {✅ Aucun >10 lignes / ⚠️ Détecté}

**Score Qualité Backend :** {XX}/10

---

### 2. FRONTEND ({XX}/30 points)

#### Pages/Composants ({XX}/15 points)
- **Implémentés :** {X}/{Y} pages ({Z%})
- **Responsive :** {✅ Mobile/Tablet/Desktop / ⚠️ Partiel / ❌ Non}
- **Loading states :** {✅ Gérés (Skeleton) / ❌ Manquants}

**Score Frontend Pages :** {XX}/15

#### Tests Frontend ({XX}/10 points)
- **Coverage Jest :** {XX%} (cible : >75%)
- **Tests unitaires :** {X}/{Y} passés ({Z%})
- **Tests E2E Playwright :** {✅ Passent / ⚠️ Partiels / ❌ Échec}

**Score Tests Frontend :** {XX}/10

#### Qualité Frontend ({XX}/5 points)
- **ESLint :** {X} erreurs ({✅ 0 / ❌ >0})
- **TypeScript strict :** {X} erreurs ({✅ 0 / ❌ >0})
- **Build Next.js :** {✅ Réussi / ❌ Échec}

**Score Qualité Frontend :** {XX}/5

---

### 3. INTEGRATION ({XX}/15 points)

#### Communication Backend ↔ Frontend ({XX}/10 points)
- **API calls :** {X}/{Y} fonctionnent ({Z%})
- **CORS :** {✅ Configuré / ❌ Erreurs}
- **Authentication/Authorization :** {✅ OK / ❌ Problème}

**Score Integration :** {XX}/10

#### Staging ({XX}/5 points)
- **Backend staging :** {✅ Déployé et accessible / ❌ Indisponible}
- **Frontend staging :** {✅ Déployé et accessible / ❌ Indisponible}

**Score Staging :** {XX}/5

---

### 4. ACCESSIBILITÉ & PERFORMANCE ({XX}/10 points)

#### Accessibility ({XX}/5 points)
- **Lighthouse Accessibility :** {XX}/100 (cible : >85)
- **ARIA labels :** {✅ Complets / ⚠️ Partiels / ❌ Manquants}

**Score Accessibilité :** {XX}/5

#### Performance ({XX}/5 points)
- **Lighthouse Performance :** {XX}/100 (cible : >85)
- **Latency API P95 :** {XX}ms (cible : <500ms)

**Score Performance :** {XX}/5

---

### 5. DOCUMENTATION ({XX}/5 points)

- **README module :** {✅ À jour / ⚠️ Partiel / ❌ Manquant} → {X}/2 pts
- **Documentation backend :** {✅ Complète / ⚠️ Partielle / ❌ Manquante} → {X}/2 pts
  - Localisation : `.github/docs-internal/Documentations/Backend/`
- **Rapport tâche :** {✅ Créé / ❌ Manquant} → {X}/1 pt

**Score Documentation :** {XX}/5

---

## 🎯 RÉCAPITULATIF SCORE

```
Backend :              {XX}/40  ({YY%})
Frontend :             {XX}/30  ({YY%})
Integration :          {XX}/15  ({YY%})
Accessibilité & Perf : {XX}/10  ({YY%})
Documentation :        {XX}/5   ({YY%})
─────────────────────────────────────
TOTAL :                {XX}/100 ({YY%})
```

---

## 🚨 BUGS & BLOCKERS

### Bugs Critiques (P0)
{Si aucun}
- [x] **Aucun bug critique** ✅

{Si existants}
- [ ] **BUG-P0-{XXX}** : {Description}
  - **Impact :** {Description impact - ex: Bloque feature X}
  - **Solution proposée :** {Plan correction}
  - **Deadline fix :** {Date}
  - **Assigné à :** {Agent/Personne}

### Bugs Majeurs (P1)
{Si aucun}
- [x] **Aucun bug majeur** ✅

{Si existants}
- [ ] **BUG-P1-{XXX}** : {Description}
  - **Impact :** {Description impact - ex: Dégrade UX}
  - **Solution proposée :** {Plan correction}
  - **Deadline fix :** {Date}
  - **Assigné à :** {Agent/Personne}

### Bugs Mineurs (P2)
{Si aucun}
- [x] **Aucun bug mineur** ✅

{Si existants}
- [ ] **BUG-P2-{XXX}** : {Description}
  - **Impact :** {Mineur - ex: Esthétique}
  - **Solution proposée :** {Plan correction ou "Non bloquant"}

### Blockers
{Si aucun}
- [x] **Aucun blocker** ✅

{Si existants}
- [ ] **BLOCKER-{XXX}** : {Description}
  - **Raison :** {Pourquoi bloqué}
  - **Escalation à :** {Qui peut débloquer}
  - **Décision requise :** {Quelle décision nécessaire}

---

## 📈 MÉTRIQUES FINALES

### Code Quality
- **Backend Coverage :** {XX%}
- **Frontend Coverage :** {XX%}
- **Lint Errors (total) :** {X}
- **Type Errors (total) :** {X}

### Performance
- **Lighthouse Performance :** {XX}/100
- **Lighthouse Accessibility :** {XX}/100
- **API Latency P95 :** {XX}ms
- **Build Time Backend :** {XX}s
- **Build Time Frontend :** {XX}s

### Tests
- **Tests Backend Passés :** {X}/{Y} ({Z%})
- **Tests Frontend Passés :** {X}/{Y} ({Z%})
- **Tests E2E Passés :** {X}/{Y} ({Z%})

---

## 📋 ACTIONS CORRECTIVES (Si GO CONDITIONNEL)

{Si score ≥80 : Section vide ou "Aucune action requise"}

{Si score 70-79 : Liste actions}

**Score : {XX}/100 - GO CONDITIONNEL ⚠️**

**Actions requises avant tâche suivante :**

| Action | Responsable | Deadline | Priorité |
|--------|-------------|----------|----------|
| {Action 1 - ex: Compléter tests manquants} | {Agent} | {Date} | {P0/P1/P2} |
| {Action 2 - ex: Corriger lint errors} | {Agent} | {Date} | {P0/P1/P2} |
| {Action 3 - ex: Documenter endpoint X} | {Agent} | {Date} | {P0/P1/P2} |

**Re-validation prévue :** {Date}

**Conditions re-validation :**
- [ ] Toutes actions complétées
- [ ] Tests re-exécutés avec succès
- [ ] Score final ≥80/100

---

## 📋 ACTIONS CORRECTES (Si NO-GO)

{Si score ≥70 : Section vide}

{Si score <70 : Plan correction majeur}

**Score : {XX}/100 - NO-GO ❌**

**Plan de correction majeur requis :**

### Problèmes Critiques Identifiés
1. **{Problème 1}** : {Description}
   - **Impact :** {Critique}
   - **Correction :** {Plan détaillé}
   - **Durée estimée :** {X} jours

2. **{Problème 2}** : {Description}
   - **Impact :** {Bloquant}
   - **Correction :** {Plan détaillé}
   - **Durée estimée :** {X} jours

### Timeline Impact
- **Retard estimé :** {X} jours
- **Nouvelle date fin :** {Date}
- **Impact module :** {Description impact sur timeline module}

### Validation Requise
- [ ] Problèmes critiques corrigés
- [ ] Tests re-exécutés (100% succès)
- [ ] Coverage ≥ cibles
- [ ] Re-validation Go/No-Go

**Re-validation prévue :** {Date}

---

## ✅ VALIDATION FORMELLE

### Rapports Agents Consultés
- **Rapport Tests :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_TESTS_REPORT.md`
- **Rapport Doc :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_DOC_REPORT.md`
- **Rapport Dev :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_REPORT.md`

### Checklist Utilisée
- **Référence :** `.claude/.agent/Tasks/GONOGO_CHECKLIST.md`
- **Version :** 1.0

### Validé Par
- **Skill :** Go/No-Go Validator v2.0.0
- **Date :** {DD/MM/YYYY HH:MM}
- **Méthode :** Invocation TEST_AGENT + DOC_AGENT + Agrégation

---

## 🎯 PROCHAINES ÉTAPES

### Si GO ✅ (Score ≥80)

**Tâche suivante :** {TASK_ID+1} - {Description}

**Prêt à démarrer :** {✅ OUI / ⚠️ Après validation utilisateur}

**Actions automatiques effectuées :**
- [x] Rapports générés (validation, agent, orchestration)
- [x] Git commit + push automatique
- [x] Workflow en pause

**⚠️ ATTENTE VALIDATION UTILISATEUR**

Commandes disponibles :
```
"GO TASK suivante"     → Démarre {TASK_ID+1}
"Review rapport"       → Affiche détails rapport
"Corrections requises" → Liste corrections manuelles
```

---

### Si GO CONDITIONNEL ⚠️ (Score 70-79)

**Actions avant tâche suivante :**
- [ ] {Action 1}
- [ ] {Action 2}
- [ ] {Action 3}

**Re-validation :** {Date}

**Deadline corrections :** +48h maximum

**⚠️ ATTENTE CORRECTIONS + VALIDATION**

---

### Si NO-GO ❌ (Score <70)

**Plan correction majeur requis**

**Blockers critiques :**
- {Blocker 1}
- {Blocker 2}

**Durée correction estimée :** {X} jours

**Impact timeline module :** +{X} jours

**Re-validation :** {Date}

**⚠️ ATTENTE CORRECTIONS MAJEURES**

---

## 📚 LEÇONS APPRISES (Si pertinent)

### Points Positifs
{Si éléments remarquables}
- {Élément 1 - ex: Excellente couverture tests}
- {Élément 2 - ex: Architecture propre}

### Points d'Amélioration
{Si éléments à améliorer}
- {Élément 1 - ex: Documentation pourrait être plus détaillée}
- {Élément 2 - ex: Tests E2E à renforcer}

### Suggestions Process
{Si suggestions}
- {Suggestion 1 - ex: Automatiser génération Swagger}
- {Suggestion 2 - ex: Template README pour nouveaux modules}

---

## 🔗 RÉFÉRENCES

### Documentation Technique
- **Backend Documentation :** `.github/docs-internal/Documentations/Backend/`
- **Database Schema :** `database/schema.sql`
- **Définition Phase :** `.claude/.agent/Tasks/PHASE_X.md`

### Rapports Associés
- **Rapport Agent Dev :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_REPORT.md`
- **Rapport Tests :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_TESTS_REPORT.md`
- **Rapport Doc :** `.claude/.agent/Reports/PHASE_X/{TASK_ID}_DOC_REPORT.md`
- **Rapport Orchestration :** `.github/docs-internal/ias/03_PHASES/MODULE_XX/RAPPORT_ORCHESTRATION_{DATE}_{TASK_ID}.md`

### Staging URLs
- **Backend Staging :** https://taxasge-backend-staging.run.app
- **Frontend Staging :** https://staging.taxasge.com

### Code Source
- **Backend :** `packages/backend/app/api/v1/{module}.py`
- **Frontend :** `packages/web/src/app/(dashboard)/{module}/`
- **Tests Backend :** `packages/backend/tests/`
- **Tests Frontend :** `packages/web/tests/`

---

**Rapport généré par :** Go/No-Go Validator Skill v2.0.0  
**Template version :** 1.0  
**Date génération :** {DD/MM/YYYY HH:MM}  
**Statut :** {GO ✅ / GO CONDITIONNEL ⚠️ / NO-GO ❌}
