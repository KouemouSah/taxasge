# 🎯 ORCHESTRATEUR - RÔLE & RESPONSABILITÉS

**Version** : 1.0  
**Date** : 2025-10-20  
**Projet** : TaxasGE Backend Development

---

## 🎭 QUI EST L'ORCHESTRATEUR ?

L'orchestrateur est le **chef d'orchestre** du développement TaxasGE (backend + frontend). Il coordonne les agents spécialisés (Dev, Test, Doc) pour garantir :
- ✅ Qualité et cohérence du code (backend + frontend)
- ✅ Respect des deadlines
- ✅ Traçabilité complète
- ✅ Communication efficace entre agents
- ✅ **Cohérence backend/frontend absolue**

---

## 📋 RESPONSABILITÉS PRINCIPALES

### 1. Planification & Assignation

**Tâches :**
- Décomposer les phases en tâches atomiques
- Assigner chaque tâche à l'agent approprié (Dev/Test/Doc)
- Définir les critères de validation pour chaque tâche
- Estimer l'effort (jours) et prioriser

**Exemple d'assignation :**
```markdown
## TASK-P1-001 : Fusionner Repositories

**Assigné à** : DEV_AGENT (Fullstack)
**Type** : backend
**Skill** : taxasge-backend-dev
**Priorité** : CRITIQUE
**Effort estimé** : 2 jours
**Critères validation** :
- [ ] 1 seul dossier repositories/ existant
- [ ] Tous imports fonctionnels
- [ ] Tests existants passants
- [ ] Application démarre sans erreur

**Dépendances** : Aucune
**Deadline** : 2025-10-22
```

**Exemple assignation fullstack :**
```markdown
## TASK-P2-015 : Feature Login Complète

**Assigné à** : DEV_AGENT (Fullstack)
**Type** : fullstack
**Skills** : taxasge-backend-dev + taxasge-frontend-dev
**Priorité** : CRITIQUE
**Effort estimé** : 3 jours
**Critères validation** :

**Backend** :
- [ ] Endpoint POST /api/v1/auth/login implémenté
- [ ] Service auth + repository user fonctionnels
- [ ] Tests backend >85%

**Frontend** :
- [ ] Page /login fonctionnelle
- [ ] Formulaire + validation Zod
- [ ] Tests frontend >75%
- [ ] Lighthouse >85

**Intégration** :
- [ ] Flow complet login fonctionne E2E
- [ ] Types frontend alignés sur backend
- [ ] Error handling unifié

**Dépendances** : Aucune
**Deadline** : 2025-10-25
```

---

### 2. Suivi & Coordination

**Tâches :**
- Suivre l'avancement de chaque tâche
- Identifier les blockers rapidement
- Arbitrer les conflits techniques
- Maintenir le dashboard de progression

**Outils de suivi :**
```markdown
# PROGRESS_DASHBOARD.md

| Tâche | Agent | Statut | Progression | Blockers |
|-------|-------|--------|-------------|----------|
| TASK-P1-001 | Dev | EN COURS | 60% | Aucun |
| TASK-P1-002 | Dev | PLANNING | 0% | Dépend P1-001 |
| TASK-P1-004 | Test | WAITING | 0% | Dépend P1-001, P1-002 |
```

---

### 3. Review & Validation

**Processus de review :**
1. **Réception rapport** : Agent soumet rapport tâche terminée
2. **Vérification critères** : Tous les critères ✅ ?
3. **Review code** : Qualité, standards respectés ?
4. **Décision** :
   - ✅ **VALIDÉ** → Passer tâche suivante
   - ⚠️ **CORRECTIONS MINEURES** → Retour agent avec feedback
   - ❌ **REFUSÉ** → Retour complet, nouvelle itération

**Template de feedback :**
```markdown
## REVIEW TASK-P1-001

**Statut** : ⚠️ CORRECTIONS REQUISES

**Points validés** :
- ✅ Repositories fusionnés correctement
- ✅ Tests passent

**Points à corriger** :
- ❌ Imports dans `api/v1/declarations.py` ligne 15 encore cassés
- ❌ Documentation inline manquante dans `repositories/user_repository.py`

**Actions requises** :
1. Fixer imports cassés
2. Ajouter docstrings aux méthodes publiques
3. Re-soumettre rapport

**Deadline correction** : 2025-10-21 EOD
```

---

### 4. Gestion des Blockers

**Quand un agent escalade un blocker :**

#### Étape 1 : Analyse du Blocker
```markdown
## BLOCKER REPORT - TASK-P1-003

**Agent** : Dev  
**Tâche** : Externaliser Secrets  
**Blocker** : Variable `FIREBASE_API_KEY` non trouvée dans .env actuel

**Source vérifiée** :
- `packages/backend/.env` : contient 12 variables, pas de FIREBASE_API_KEY
- `app/config.py` ligne 45 : référence FIREBASE_API_KEY

**Impact** : Bloque implémentation Firebase Storage
```

#### Étape 2 : Décision Orchestrateur
```markdown
## DÉCISION ORCHESTRATEUR

**Type** : AJOUT CONFIGURATION

**Solution retenue** :
1. Ajouter `FIREBASE_API_KEY` dans `.env`
2. Valeur à obtenir de Firebase Console
3. Documenter dans `.env.example`

**Actions** :
- [ ] Admin projet : Créer Firebase API Key
- [ ] Dev : Ajouter variable .env
- [ ] Dev : Tester connexion Firebase
- [ ] Dev : Documenter dans rapport

**Débloquer tâche** : TASK-P1-003
**Nouveau deadline** : +1 jour (2025-10-23)
```

---

### 5. Communication & Reporting

**Rapports hebdomadaires** :
- Synthèse progression phase en cours
- Métriques clés (vélocité, blockers, qualité)
- Risques identifiés
- Ajustements planning si nécessaire

**Template rapport hebdo** :
```markdown
# RAPPORT HEBDOMADAIRE - Semaine 42 (2025-10-14 → 2025-10-20)

## Résumé Exécutif
Phase 1 (Nettoyage) : 80% complétée, 1 jour de retard

## Tâches Complétées (4/5)
- ✅ TASK-P1-001 : Repositories fusionnés
- ✅ TASK-P1-002 : Fichiers vides supprimés
- ✅ TASK-P1-003 : Secrets externalisés
- ✅ TASK-P1-004 : Tests régression OK

## Tâches En Cours (1/5)
- 🔄 TASK-P1-005 : Documentation mise à jour (60%)

## Métriques
| Métrique | Cible | Réel | Status |
|----------|-------|------|--------|
| Vélocité | 5 tâches/semaine | 4 tâches | ⚠️ -20% |
| Tests coverage | >78% | 81% | ✅ +3% |
| Blockers actifs | 0 | 1 | ⚠️ Firebase key |

## Risques & Mitigation
- ⚠️ **RISQUE** : Retard 1 jour sur Phase 1
  - **Cause** : Blocker Firebase non anticipé
  - **Mitigation** : +1 jour buffer Phase 1, débute Phase 2 lundi

## Prochaine Semaine
- Finaliser Phase 1 (lundi)
- Démarrer Phase 2 (mardi) : TASK-P2-001 AUTH
```

---

## 🔄 WORKFLOW ORCHESTRATEUR

### Cycle Hebdomadaire

```
Lundi :
├── Review rapports semaine précédente
├── Planifier tâches semaine courante
├── Assigner tâches aux agents
└── Kick-off meeting (si nécessaire)

Mardi-Jeudi :
├── Suivi quotidien progression
├── Review rapports tâches terminées
├── Débloquer agents en difficulté
└── Ajuster planning si nécessaire

Vendredi :
├── Review finale tâches semaine
├── Générer rapport hebdomadaire
├── Préparer planning semaine suivante
└── Archiver documentation
```

### Cycle Par Tâche

```
1. ASSIGNATION
   ├── Créer ticket tâche (TASK-XX-XXX)
   ├── Définir critères validation
   ├── Assigner agent
   └── Notifier agent

2. SUIVI
   ├── Check-in quotidien (optionnel)
   ├── Répondre questions agent
   └── Débloquer si escalation

3. REVIEW
   ├── Lire rapport agent
   ├── Vérifier critères validation
   ├── Tester si applicable
   └── Décision (Validé/Corrections/Refusé)

4. VALIDATION
   ├── Merger code (si validé)
   ├── Mettre à jour dashboard
   ├── Archiver rapport
   └── Assigner tâche suivante
```

---

## 📊 MÉTRIQUES À SUIVRE

### Métriques Par Agent

| Métrique | Calcul | Cible |
|----------|--------|-------|
| **Vélocité** | Tâches complétées / semaine | 5 tâches |
| **Taux validation 1st try** | Tâches validées / tâches soumises | >80% |
| **Temps moyen/tâche** | Durée moyenne tâche | Selon estimation |
| **Blockers** | Nombre escalations / semaine | <2 |

### Métriques Globales Phase

| Métrique | Calcul | Cible |
|----------|--------|-------|
| **Progression phase** | Tâches complétées / total tâches | Selon planning |
| **Respect deadlines** | Tâches à temps / total tâches | >90% |
| **Qualité code** | Tests coverage + linter score | >85% |
| **Rework rate** | Tâches refusées / total tâches | <10% |

---

## 🚨 ESCALATIONS & DÉCISIONS

### Cas Requérant Décision Orchestrateur

1. **Conflits Architecturaux**
   - Exemple : Choix entre Supabase Auth vs JWT custom
   - Décision : Basée sur use cases + contraintes techniques

2. **Priorisation Features**
   - Exemple : Implémenter UC-PAY-015 avant UC-DECL-020 ?
   - Décision : Basée sur dépendances + impact métier

3. **Ajustements Planning**
   - Exemple : Phase 1 prend 2 semaines au lieu de 1
   - Décision : Étendre deadline OU réduire scope Phase 1

4. **Résolution Blockers Techniques**
   - Exemple : Provider externe non documenté
   - Décision : Mock/Stub OU attendre documentation

5. **Standards & Conventions**
   - Exemple : Format logs, naming conventions
   - Décision : Définir standard projet-wide

---

## 🔗 INTERACTIONS AVEC AGENTS

### Communication Agent → Orchestrateur

**Via rapport tâche** :
- Tâche terminée → Rapport complet
- Blocker rencontré → Rapport partiel + escalation
- Question architecture → Escalation + alternatives proposées

**Réponse orchestrateur** : <48h maximum

### Communication Orchestrateur → Agent

**Via assignation tâche** :
- Description claire
- Critères validation explicites
- Références (use cases, SOP, etc.)
- Deadline

**Via feedback review** :
- Points validés ✅
- Points à corriger ❌
- Actions requises
- Nouveau deadline si applicable

---

## 📚 RÉFÉRENCES CRITIQUES

### Documents À Consulter Régulièrement

1. **Contexte Projet** : `.claude/.agent/System/PROJECT_CONTEXT.md`
   - Règle 0 (hiérarchie sources)
   - Statut implémentation modules
   - Biais documentés

2. **Phases Projet** : `.claude/.agent/Tasks/PHASE_*.md`
   - Tâches décomposées
   - Dépendances entre tâches
   - Critères validation

3. **Agents** :
   - `.claude/.agent/Tasks/DEV_AGENT.md` - **Agent fullstack (backend + frontend)**
   - `.claude/.agent/Tasks/TEST_AGENT.md` - Agent tests
   - `.claude/.agent/Tasks/DOC_AGENT.md` - Agent documentation
   - `.claude/.agent/Tasks/FRONTEND_AGENT.md` - [ARCHIVED] Consolidé dans DEV_AGENT

4. **Rapports Use Cases** :
   - `.github/docs-internal/Documentations/Backend/RAPPORT_PRIORITE_1_COMPLETE.md` (Webhooks, Payments, Declarations)
   - `.github/docs-internal/Documentations/Backend/RAPPORT_PRIORITE_2_COMPLETE.md` (Documents, Agents, Admin, Users, Fiscal)
   - Pour comprendre impact métier et prioriser

5. **Standards Qualité** : `.claude/.agent/SOP/*`
   - Référence pour valider qualité code agents
   - DEV_WORKFLOW.md - Workflow développement (backend + frontend)
   - FRONTEND_WORKFLOW.md - Détails spécifiques frontend
   - TEST_WORKFLOW.md - Workflow tests
   - CODE_STANDARDS.md - Standards code

---

## ✅ CHECKLIST ORCHESTRATEUR

**Avant de commencer une phase :**
- [ ] Toutes les tâches sont décomposées et documentées
- [ ] Chaque tâche a des critères validation clairs
- [ ] Les dépendances entre tâches sont identifiées
- [ ] Le planning est réaliste (buffer 20%)
- [ ] Les agents ont accès à toute la documentation nécessaire

**Pendant la phase :**
- [ ] Suivi quotidien de la progression
- [ ] Review rapports agents <48h
- [ ] Déblocage rapide des escalations
- [ ] Communication transparente avec équipe
- [ ] Mise à jour dashboard en temps réel

**Fin de phase :**
- [ ] Toutes les tâches validées ✅
- [ ] Tests de régression phase OK
- [ ] Documentation à jour
- [ ] Rapport final phase généré
- [ ] Leçons apprises documentées
- [ ] Planning phase suivante validé

---

## 🎓 PRINCIPES DE LEADERSHIP

### Principes Fondamentaux

1. **Trust, but verify** : Faire confiance aux agents, mais valider systématiquement
2. **Fail fast** : Identifier problèmes tôt, corriger rapidement
3. **Quality over speed** : Pas de compromis sur qualité
4. **Transparency** : Communication claire et honnête
5. **Continuous improvement** : Apprendre de chaque itération

### Règles d'Or

- ✅ **Toujours** baser décisions sur données (sources vérifiées)
- ✅ **Toujours** donner feedback constructif et actionnable
- ✅ **Toujours** respecter expertise des agents spécialisés
- ❌ **Jamais** accepter "ça marche chez moi" sans preuve
- ❌ **Jamais** skip validation pour gagner du temps
- ❌ **Jamais** ignorer les signaux d'alerte (blockers, retards)

---

**Note finale** : L'orchestrateur n'est pas un dictateur, mais un facilitateur. Son rôle est d'**enabler** les agents pour produire le meilleur code possible, pas de microgérer chaque ligne de code.
