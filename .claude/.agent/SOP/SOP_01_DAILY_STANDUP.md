# SOP 1 : DAILY STANDUP

**Fréquence** : Tous les jours (9h00 GMT+1)  
**Durée** : 15 minutes max  
**Participants** : Orchestrateur + Tous Agents actifs

---

## OBJECTIF

Synchronisation quotidienne de l'équipe pour :
- ✅ Partager le progrès des tâches
- ✅ Identifier blocages rapidement
- ✅ Ajuster planning si nécessaire

---

## PROCÉDURE

### 1. PRÉPARATION (Avant le standup)

**Orchestrateur** :
```markdown
- [ ] Vérifier board Trello/Jira (colonnes TODO, IN PROGRESS, BLOCKED, DONE)
- [ ] Identifier tâches avec flag "BLOCKED" ou "HIGH PRIORITY"
- [ ] Préparer agenda (focus sur blocages)
```

**Chaque Agent** :
```markdown
- [ ] Mettre à jour statut tâches dans Trello/Jira
- [ ] Préparer 3 points (What I did, What I'll do, Blockers)
```

---

### 2. DÉROULEMENT (15 min)

**Format Tour de Table** (2-3 min/agent) :

#### Agent DEV :
```
✅ HIER :
- [TASK-P2-003] Endpoint POST /declarations/create complété
- Tests unitaires déclarations (12 tests passants)

🎯 AUJOURD'HUI :
- [TASK-P2-004] Endpoint GET /declarations/{id}
- Upload documents (Firebase integration)

⚠️ BLOCAGES :
- Firebase credentials manquantes (besoin config)
```

#### Agent TEST :
```
✅ HIER :
- Tests UC-AUTH-001 à UC-AUTH-005 complétés
- Coverage module AUTH : 92%

🎯 AUJOURD'HUI :
- Tests intégration workflow login → create declaration
- Setup pytest fixtures pour mocks

⚠️ BLOCAGES :
- Aucun
```

#### Agent DOC :
```
✅ HIER :
- Documentation Swagger AUTH endpoints complétée
- README setup local environment

🎯 AUJOURD'HUI :
- Documentation DECLARATIONS endpoints
- Architecture diagram (mermaid)

⚠️ BLOCAGES :
- Aucun
```

---

### 3. RÉSOLUTION BLOCAGES

**Orchestrateur** note tous blocages et décide :

**Exemple Blocage 1** : Firebase credentials manquantes
```
DÉCISION : 
- Orchestrateur crée Firebase project et génère service account key
- Partage credentials via 1Password
- ETA : Dans 30 min
- Agent DEV peut continuer autres tâches en attendant
```

**Exemple Blocage 2** : Dépendance entre tâches (Dev attend Test)
```
DÉCISION :
- Prioriser tâche Test pour débloquer Dev
- Agent Test focus sur cette tâche ce matin
- Daily check-in à 14h pour vérifier déblocage
```

---

### 4. AJUSTEMENT PLANNING

**Si nécessaire** :
- Réassigner tâches (si agent surchargé)
- Repousser deadlines (si blocage critique)
- Ajouter tâches urgentes (bug production)

**Orchestrateur met à jour** :
```markdown
- Trello/Jira : Déplacer cartes, update deadlines
- Google Calendar : Créer events si nécessaire (ex: "Pair programming session 14h")
- Slack : Post résumé standup dans #taxasge-dev
```

---

### 5. POST-STANDUP

**Orchestrateur** :
```markdown
- [ ] Publier résumé standup dans Slack
- [ ] Créer tickets pour résoudre blocages
- [ ] Suivre résolution blocages (check-in si nécessaire)
```

**Template Résumé Slack** :
```
📋 DAILY STANDUP - 20 Oct 2025

✅ PROGRESS :
- AUTH module : 92% coverage
- DECLARATIONS endpoints : 3/8 complétés
- Documentation : Swagger 50% complété

⚠️ BLOCAGES RÉSOLUS :
- Firebase credentials → Partagé via 1Password
- Database migration erreur → Fixed (missing column)

🎯 FOCUS AUJOURD'HUI :
- DEV : Compléter 3 endpoints déclarations
- TEST : Tests intégration login flow
- DOC : Architecture diagram + API docs

👥 TEAM MOOD : 😊😊😎
```

---

## TEMPLATE NOTES STANDUP

```markdown
# Daily Standup - [DATE]

## 👤 Agent DEV
✅ Hier : 
🎯 Aujourd'hui : 
⚠️ Blocages : 

## 🧪 Agent TEST
✅ Hier : 
🎯 Aujourd'hui : 
⚠️ Blocages : 

## 📝 Agent DOC
✅ Hier : 
🎯 Aujourd'hui : 
⚠️ Blocages : 

---

## 🚧 BLOCAGES IDENTIFIÉS
1. [Blocage 1] - Propriétaire : [Agent] - ETA résolution : [Date]
2. [Blocage 2] - Propriétaire : [Agent] - ETA résolution : [Date]

## 📊 MÉTRIQUES
- Tâches complétées hier : X
- Tâches en cours : Y
- Tâches bloquées : Z
- Vélocité : [On track / Behind / Ahead]

## 🎯 DÉCISIONS
- [Décision 1]
- [Décision 2]

---
**Prochain Standup** : [Date] 9h00
```

---

## ANTI-PATTERNS (À ÉVITER)

❌ **Standup >20 min** → Trop long, perte de focus
✅ Solution : Timeboxer chaque agent (3 min max)

❌ **Discussions techniques détaillées** → Pas le moment
✅ Solution : Noter et programmer meeting technique après

❌ **Agent absent sans notification** → Bloque équipe
✅ Solution : Notification obligatoire 24h avant (sauf urgence)

❌ **Status update par email/Slack** → Pas de synchronisation
✅ Solution : Standup TOUJOURS en visio/audio (synchrone)

❌ **Pas de suivi blocages** → Blocages persistent
✅ Solution : Orchestrateur check résolution avant fin journée

---

## CHECKLIST ORCHESTRATEUR

**Avant Standup** :
- [ ] Board Trello/Jira à jour
- [ ] Agenda préparé
- [ ] Salle meeting réservée (ou lien Zoom ready)

**Pendant Standup** :
- [ ] Timer lancé (15 min countdown visible)
- [ ] Noter tous blocages
- [ ] Prendre décisions rapides

**Après Standup** :
- [ ] Publier résumé Slack
- [ ] Créer tickets résolution blocages
- [ ] Update planning si ajustements

---

## KPIs

| Métrique | Target | Mesure |
|----------|--------|--------|
| Durée standup | <15 min | Timer |
| Participation | 100% | Attendance |
| Blocages résolus | >80% même jour | Suivi Jira |
| Satisfaction équipe | >4/5 | Survey hebdo |

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-10-20  
**Propriétaire** : Orchestrateur
