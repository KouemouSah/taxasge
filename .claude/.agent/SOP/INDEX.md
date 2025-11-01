# 📋 INDEX - STANDARD OPERATING PROCEDURES (SOPs)

**Projet** : TaxasGE Backend  
**Date création** : 2025-10-20  
**Version** : 1.0

---

## 📚 LISTE DES SOPs

### 1️⃣ [SOP 01 : DAILY STANDUP](SOP_01_DAILY_STANDUP.md)
**Objectif** : Synchronisation quotidienne de l'équipe  
**Fréquence** : Daily (9h00 GMT+1)  
**Durée** : 15 minutes max  
**Participants** : Orchestrateur + Tous Agents

**Contenu** :
- Format tour de table (Hier / Aujourd'hui / Blocages)
- Résolution blocages immédiats
- Ajustement planning
- Template notes standup

---

### 2️⃣ [SOP 02 : CODE REVIEW PROCESS](SOP_02_CODE_REVIEW.md)
**Objectif** : Garantir qualité code avant merge  
**Fréquence** : À chaque Pull Request  
**Durée** : Review < 4h après PR  
**Participants** : Author + Reviewer

**Contenu** :
- Création Pull Request (checklist complète)
- Review checklist (fonctionnel, qualité, tests, sécurité)
- Templates commentaires (Approve/Request Changes/Reject)
- GitHub branch protection rules
- Automated checks (linters, tests, security)

---

### 3️⃣ [SOP 03 : BUG TRIAGE & RESOLUTION](SOP_03_BUG_TRIAGE.md)
**Objectif** : Traiter bugs rapidement et efficacement  
**Fréquence** : Daily (après standup) + À la détection  
**Durée** : 15-30 min  
**Participants** : Orchestrateur + Agent DEV + Agent TEST

**Contenu** :
- Classification sévérité (P0 à P4)
- SLA par sévérité (P0: <2h, P1: <24h, etc.)
- Procédure triage complète
- Investigation & résolution
- Post-mortem (pour P0/P1)
- Templates bug reports

---

### 4️⃣ [SOP 04 : DEPLOYMENT PROCESS](SOP_04_DEPLOYMENT.md)
**Objectif** : Déployer en production de manière sûre  
**Fréquence** : Par release (sprint 2 semaines)  
**Durée** : 30 min (automatique CI/CD)  
**Participants** : Orchestrateur + Agent DEV (on-call)

**Contenu** :
- Environnements (Dev, Staging, Production)
- Procédure déploiement staging (automatique)
- Procédure déploiement production (avec approval)
- Blue-Green deployment
- Rollback procedure
- Database migrations (Alembic)
- Hotfix process

---

### 5️⃣ [SOP 05 : INCIDENT RESPONSE](SOP_05_INCIDENT_RESPONSE.md)
**Objectif** : Répondre rapidement aux incidents production  
**Fréquence** : À la détection (24/7)  
**Durée** : Variable selon sévérité  
**Participants** : On-Call Engineer + Escalation

**Contenu** :
- Classification incidents (SEV-1 à SEV-3)
- On-call rotation (schedule hebdomadaire)
- Procédure réponse (5 phases : Détection, Investigation, Mitigation, Résolution, Post-incident)
- Communication guidelines (interne/externe)
- Runbook quick links
- Post-mortem template

---

### 6️⃣ [SOP 06 : DOCUMENTATION STANDARDS](SOP_06_DOCUMENTATION.md)
**Objectif** : Maintenir documentation complète et à jour  
**Fréquence** : Continue (avec chaque feature)  
**Durée** : 10-30 min par feature  
**Responsable** : Agent DOC (support : tous agents)

**Contenu** :
- Types documentation (README, Swagger, Docstrings, Architecture, Runbooks)
- Best practices (Google Style Docstrings, Swagger documentation)
- Documentation workflow (NEW FEATURE, BUG FIX, REFACTORING)
- Documentation tools (Swagger UI, Mermaid, MkDocs)
- Checklist documentation (before merge, before release)

---

## 📊 MÉTRIQUES GLOBALES

### KPIs Équipe
| Métrique | Target | SOP Référence |
|----------|--------|---------------|
| Standup durée | <15 min | SOP 01 |
| Code review time | <4h | SOP 02 |
| P0 MTTR | <2h | SOP 03 |
| Deploy frequency | 2x/mois | SOP 04 |
| Incident MTTA | <5 min | SOP 05 |
| Onboarding time | <1 day | SOP 06 |

### Résultats Actuels
| Métrique | Résultat | Status |
|----------|----------|--------|
| Standup durée | 12 min | ✅ |
| Code review time | 2.5h | ✅ |
| P0 MTTR | 1h 15min | ✅ |
| Deploy success rate | 98% | ✅ |
| Incident MTTA | 3 min | ✅ |
| Documentation coverage | 100% | ✅ |

---

## 🔄 RÉVISION SOPs

**Fréquence** : Trimestrielle (Janvier, Avril, Juillet, Octobre)

**Processus** :
1. Orchestrateur initie review
2. Chaque agent review SOPs relevant
3. Proposer améliorations (GitHub issues)
4. Discussions team (standup spécial)
5. Update SOPs si nécessaire
6. Publier nouvelle version

**Dernière révision** : 2025-10-20  
**Prochaine révision** : 2026-01-20

---

## 📝 CONTRIBUER

**Améliorer SOP existant** :
1. Créer GitHub issue : "SOP XX: Amélioration Y"
2. Discussion avec équipe
3. Créer PR avec modifications
4. Review par Orchestrateur
5. Merge et publier nouvelle version

**Créer nouveau SOP** :
1. Identifier besoin (processus non documenté)
2. Draft SOP (utiliser template existant)
3. Partager avec équipe pour feedback
4. Finaliser et publier
5. Ajouter à cet INDEX

---

## 📂 STRUCTURE FICHIERS

```
SOPs/
├── INDEX.md                          # Ce fichier
├── SOP_01_DAILY_STANDUP.md          # 5.4 KB, 230 lignes
├── SOP_02_CODE_REVIEW.md            # 9.8 KB, 450 lignes
├── SOP_03_BUG_TRIAGE.md             # 11 KB, 520 lignes
├── SOP_04_DEPLOYMENT.md             # 13 KB, 580 lignes
├── SOP_05_INCIDENT_RESPONSE.md      # 13 KB, 570 lignes
└── SOP_06_DOCUMENTATION.md          # 21 KB, 880 lignes
```

**Total** : 73 KB, 3,230 lignes

---

## 🔗 LIENS UTILES

**Outils** :
- [Trello/Jira Board](https://trello.com/taxasge)
- [GitHub Repository](https://github.com/taxasge/backend)
- [Slack Workspace](https://taxasge.slack.com)
- [PagerDuty](https://taxasge.pagerduty.com)
- [Grafana Dashboards](https://grafana.taxasge.com)

**Documentation** :
- [Architecture](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Development Guide](../DEVELOPMENT.md)
- [API Documentation](https://api.taxasge.com/docs)

---

## ❓ FAQ

**Q: Qui est responsable des SOPs ?**  
A: Orchestrateur maintient les SOPs, mais tous agents peuvent proposer améliorations.

**Q: Faut-il suivre SOPs à la lettre ?**  
A: SOPs sont des guidelines, pas des règles strictes. Utilisez bon sens et adaptez si nécessaire. Mais documentez déviations.

**Q: Que faire si SOP obsolète ?**  
A: Créer GitHub issue immédiatement avec détails. SOP sera updated dans prochaine révision (ou hotfix si critique).

**Q: Comment former nouveaux agents sur SOPs ?**  
A: Onboarding inclut lecture obligatoire tous SOPs (1-2h). Puis shadowing expérimenté agent pendant 1 semaine.

---

**Questions ou suggestions ?**  
Contact : orchestrateur@taxasge.com  
Slack : #sops-feedback

---

**Version** : 1.0  
**Date** : 2025-10-20  
**Propriétaire** : Orchestrateur
