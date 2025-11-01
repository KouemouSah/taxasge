# SOP 4 : DEPLOYMENT PROCESS

**Fréquence** : Par release (sprint de 2 semaines)  
**Durée** : 30 min (automatique via CI/CD)  
**Participants** : Orchestrateur + Agent DEV (on-call)

---

## OBJECTIF

Déployer nouvelles versions de manière sûre et prévisible :
- ✅ Zero downtime
- ✅ Rollback rapide si problème
- ✅ Validation automatisée
- ✅ Communication claire

---

## ENVIRONNEMENTS

### 1. Development (Local)
- **URL** : http://localhost:8000
- **Database** : PostgreSQL local
- **Purpose** : Développement quotidien
- **Deploy** : Manuel (pas de CI/CD)

### 2. Staging
- **URL** : https://api-staging.taxasge.com
- **Database** : PostgreSQL Cloud (replica prod)
- **Purpose** : Tests QA et intégration
- **Deploy** : Automatique (push vers `develop` branch)

### 3. Production
- **URL** : https://api.taxasge.com
- **Database** : PostgreSQL Cloud (production)
- **Purpose** : Users réels
- **Deploy** : Semi-automatique (push vers `main` + approval)

---

## PROCÉDURE DÉPLOIEMENT STAGING

### Auto-déploiement (branch `develop`)

**Trigger** : Push vers branch `develop`

**Workflow GitHub Actions** :
```yaml
# Automatique, pas d'intervention manuelle nécessaire

1. Tests (pytest, linters) ✅
2. Build Docker image ✅
3. Push image to registry ✅
4. Deploy to Staging K8s ✅
5. Run smoke tests ✅
6. Notify Slack ✅
```

**Commandes DEV** :
```bash
# Merge feature branch to develop
git checkout develop
git merge feature/new-endpoint
git push origin develop

# GitHub Actions prend le relai automatiquement
# Voir progress : https://github.com/taxasge/backend/actions
```

**Notifications Slack** :
```
🚀 Deployment to STAGING started
Branch: develop
Commit: abc123 - "feat: Add new endpoint"
Author: Agent DEV

✅ Tests passed
✅ Image built
✅ Deployed to staging
✅ Smoke tests passed

Staging URL: https://api-staging.taxasge.com
Time: 3m 24s
```

**Verification** :
```bash
# Health check
curl https://api-staging.taxasge.com/health

# Test new endpoint
curl https://api-staging.taxasge.com/api/v1/new-endpoint
```

---

## PROCÉDURE DÉPLOIEMENT PRODUCTION

### Pre-Deployment Checklist

**Orchestrateur** vérifie AVANT déploiement :

```markdown
## PRE-DEPLOYMENT CHECKLIST

### Code Quality ✅
- [ ] Tous tests passants (coverage >85%)
- [ ] Code review approuvée
- [ ] Linters passants (black, flake8, mypy)
- [ ] Security scan passé (Bandit, no secrets)

### Testing ✅
- [ ] Staging déployé et stable (>24h)
- [ ] Tests E2E passants sur staging
- [ ] Performance tests passants (Locust)
- [ ] No P0/P1 bugs open

### Documentation ✅
- [ ] CHANGELOG mis à jour
- [ ] API documentation mise à jour (Swagger)
- [ ] Release notes préparées
- [ ] Runbook mis à jour (si nécessaire)

### Infrastructure ✅
- [ ] Database migrations testées en staging
- [ ] Secrets/ConfigMaps mis à jour (si nécessaire)
- [ ] Backup database récent (<24h)
- [ ] Monitoring dashboards à jour

### Communication ✅
- [ ] Notification users (si maintenance nécessaire)
- [ ] Team Dev/Ops informée
- [ ] On-call défini (qui répond si problème)
- [ ] Rollback plan documenté

### Timing ✅
- [ ] Déploiement prévu hors heures peak (ex: 22h-23h GMT+1)
- [ ] Team disponible pendant 1h post-déploiement
- [ ] Pas de déploiement le vendredi (si possible)
```

---

### Déploiement Production (Step by Step)

**Étape 1 : Créer Pull Request vers `main`**
```bash
# Create PR: develop → main
git checkout develop
git pull origin develop
gh pr create --base main --head develop \
  --title "Release v1.1.0" \
  --body "$(cat CHANGELOG.md)"
```

**Étape 2 : Code Review & Approbation**
```
- Reviewer 1 (Agent DEV) : Approve ✅
- Reviewer 2 (Orchestrateur) : Approve ✅

→ PR ready to merge
```

**Étape 3 : Merge PR**
```bash
# Orchestrateur merge PR
gh pr merge --squash --delete-branch
```

**Étape 4 : GitHub Actions Deploy**
```yaml
# Workflow automatique
1. Run all tests ✅
2. Build Docker image ✅
3. Push image to registry ✅
4. Wait for manual approval ⏸️ (protection)
5. Run database migrations ✅
6. Deploy to Production (Blue-Green) ✅
7. Run smoke tests ✅
8. Switch traffic Blue → Green ✅
9. Notify PagerDuty & Slack ✅
```

**Étape 5 : Manual Approval (GitHub Environment)**
```
GitHub UI affiche :
"Deployment to production requires approval"

Orchestrateur click : [Approve and deploy]

→ Deployment continue
```

**Étape 6 : Monitoring (30 min post-deploy)**
```bash
# Orchestrateur + Agent DEV monitor dashboards

# 1. Check Grafana dashboards
open https://grafana.taxasge.com/d/api-overview

# 2. Check metrics
- Requests/sec : Normal (~1000 rps)
- Error rate : <1%
- P95 latency : <500ms
- No alerts triggered

# 3. Check logs
kubectl logs -l app=backend --tail=100 | grep ERROR

# 4. Manual smoke tests
curl https://api.taxasge.com/health
curl https://api.taxasge.com/api/v1/fiscal-services?limit=1
```

**Étape 7 : Communication Success**
```markdown
🎉 **PRODUCTION DEPLOYMENT SUCCESSFUL**

**Version** : v1.1.0
**Deployed** : 2025-10-20 22:15 GMT+1
**Duration** : 4m 32s

**Changes** :
- Added POST /declarations/create endpoint
- Fixed webhook signature validation (BUG-123)
- Performance improvements (P95 latency -15%)

**Verification** :
✅ All smoke tests passed
✅ Monitoring stable (30 min)
✅ No errors detected

**Release Notes** : https://github.com/taxasge/backend/releases/v1.1.0

**Team** : Great job everyone! 🚀
```

---

## BLUE-GREEN DEPLOYMENT

**Concept** : 2 versions production en parallèle

### Setup
```yaml
# Kubernetes
# Blue deployment (version actuelle)
deployment: backend-blue
  replicas: 3
  image: backend:v1.0.0
  selector: version=blue

# Green deployment (nouvelle version)
deployment: backend-green
  replicas: 3
  image: backend:v1.1.0
  selector: version=green

# Service (trafic)
service: backend
  selector: version=blue  # Pointe vers blue initialement
```

### Workflow Déploiement
```bash
# 1. Deploy green (nouvelle version)
kubectl set image deployment/backend-green \
  backend=ghcr.io/taxasge/backend:v1.1.0

kubectl rollout status deployment/backend-green

# 2. Vérifier green healthy
kubectl get pods -l version=green
# → All pods Running

# 3. Test green (sans trafic user)
kubectl port-forward deployment/backend-green 8080:8000
curl http://localhost:8080/health
# → OK

# 4. Switch traffic : blue → green
kubectl patch service backend \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor (5-10 min)
# Watch Grafana dashboards
# No alerts

# 6. Scale down blue (garde en backup 15 min)
# Ne pas supprimer immédiatement (au cas où rollback)

# 7. Si tout OK après 15 min → delete blue
kubectl scale deployment/backend-blue --replicas=0
```

**Avantages** :
- ✅ Zero downtime
- ✅ Rollback instantané (switch back to blue)
- ✅ Safe testing (green isolé avant switch)

---

## ROLLBACK PROCEDURE

**Quand rollback** :
- Error rate >5% après déploiement
- P0 alert triggered
- Critical bug détecté
- Performance dégradée (P95 >1s)

### Rollback Automatique (si smoke tests fail)
```yaml
# GitHub Actions workflow
- name: Run smoke tests
  run: ./scripts/smoke_tests.sh
  
- name: Rollback if failed
  if: failure()
  run: |
    kubectl patch service backend \
      -p '{"spec":{"selector":{"version":"blue"}}}'
    
    # Notify
    curl -X POST $SLACK_WEBHOOK \
      -d '{"text":"❌ Deployment failed - Auto rollback to blue"}'
```

### Rollback Manuel (après déploiement)
```bash
# Option 1 : Switch back to blue (si blue encore up)
kubectl patch service backend \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Verify
curl https://api.taxasge.com/health
# → Old version

# Option 2 : Rollback Kubernetes deployment
kubectl rollout undo deployment/backend

# Option 3 : Deploy previous version
kubectl set image deployment/backend \
  backend=ghcr.io/taxasge/backend:v1.0.0

# Monitor rollback
kubectl rollout status deployment/backend
```

**Communication Rollback** :
```markdown
⚠️ **PRODUCTION ROLLBACK**

**Reason** : High error rate (12%) detected after v1.1.0 deployment
**Action** : Rolled back to v1.0.0
**Time** : 22:45 GMT+1 (30 min after deployment)

**Status** :
✅ Rollback completed
✅ Error rate back to normal (<1%)
✅ System stable

**Next Steps** :
- Root cause analysis (BUG-124 created)
- Fix in staging
- Redeploy v1.1.1 with fix

**Incident** : INC-2025-10-20-001
```

---

## DATABASE MIGRATIONS

**Alembic Migrations** :

### Create Migration
```bash
# Auto-generate migration from models
alembic revision --autogenerate -m "Add webhooks table"

# Fichier créé : alembic/versions/001_add_webhooks_table.py
```

### Test Migration (Staging)
```bash
# Staging database
export DATABASE_URL=$DATABASE_URL_STAGING

# Run migration
alembic upgrade head

# Verify
psql $DATABASE_URL_STAGING -c "\dt webhook_events"
# → Table existe

# Test rollback
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### Production Migration (Automated in CI/CD)
```yaml
# Dans GitHub Actions workflow
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
  run: |
    alembic upgrade head
```

**Safety** :
- ✅ Migrations testées en staging AVANT prod
- ✅ Rollback possible (downgrade)
- ✅ Backup database avant migration (automatique)

---

## HOTFIX PROCESS (Urgent bug en production)

**Quand utiliser** : P0 ou P1 bug en production

### Fast-Track Deployment

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug-123

# 2. Fix bug
# ... code changes ...

# 3. Tests
pytest

# 4. Commit
git commit -m "hotfix: Fix critical webhook bug"

# 5. Push and create PR
git push origin hotfix/critical-bug-123
gh pr create --base main --head hotfix/critical-bug-123

# 6. Fast review (<30 min)
# Reviewer approve ASAP

# 7. Merge to main
gh pr merge --squash

# 8. Deploy (same process but faster approval)
# Orchestrateur approve immédiatement

# 9. Verify in production
curl https://api.taxasge.com/health

# 10. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

**Timeline Hotfix** :
- Detection : T+0
- Investigation : T+15 min
- Fix : T+30 min
- Review : T+45 min
- Deploy : T+1h
- Verify : T+1h15

**Total** : <1h30 from detection to production fix

---

## MONITORING POST-DEPLOYMENT

**Dashboard Grafana : Post-Deploy Monitoring**

**Métriques à surveiller (30 min)** :
```
1. Error Rate
   - Target : <1%
   - Alert if >5%

2. P95 Latency
   - Target : <500ms
   - Alert if >1s

3. Requests/sec
   - Compare with baseline
   - Alert if drop >30%

4. Database connections
   - Should be stable
   - Alert if all consumed

5. Memory usage
   - Should not spike
   - Alert if >80%
```

**Alertes PagerDuty** :
- Actives pendant 1h post-déploiement
- On-call : Orchestrateur + Agent DEV

---

## RELEASE NOTES TEMPLATE

```markdown
# Release v1.1.0 - 2025-10-20

## 🚀 New Features
- Added POST /declarations/create endpoint ([#156](link))
- Added agent queue with priority scoring ([#158](link))

## 🐛 Bug Fixes
- Fixed webhook signature validation ([#157](link)) - BUG-123
- Fixed declaration status not updating ([#159](link)) - BUG-124

## ⚡ Performance
- Reduced P95 latency by 15% (580ms → 490ms)
- Optimized database queries (added indexes)

## 📚 Documentation
- Updated API documentation (Swagger)
- Added deployment runbook

## 🔧 Internal
- Upgraded Python 3.10 → 3.11
- Updated dependencies (security patches)

## 🗄️ Database Migrations
- Added `webhook_events` table
- Added index on `declarations(user_id)`

## ⚠️ Breaking Changes
None

## 📦 Upgrade Notes
No manual steps required. Automatic deployment.

---

**Full Changelog** : [v1.0.0...v1.1.0](link)
```

---

## ANTI-PATTERNS

❌ **Deploy vendredi soir** → Pas de support weekend
✅ Solution : Deploy mardi-jeudi, hors weekend

❌ **Pas de backup database** → Risk perte données
✅ Solution : Backup automatique avant chaque déploiement

❌ **Skip staging** → Bugs en production
✅ Solution : TOUJOURS tester en staging d'abord

❌ **Pas de rollback plan** → Panique si problème
✅ Solution : Documenter rollback AVANT déploiement

❌ **Deploy sans monitoring** → Blind deployment
✅ Solution : Team on-call monitor 30 min minimum

---

## METRICS & KPIs

| Métrique | Target | Actuel |
|----------|--------|--------|
| Deploy frequency | 2x/mois | 2x/mois ✅ |
| Deploy duration | <5 min | 4m 32s ✅ |
| Deploy success rate | >95% | 98% ✅ |
| Rollback frequency | <5% | 2% ✅ |
| Mean Time To Deploy | <30 min | 25 min ✅ |

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-10-20  
**Propriétaire** : Orchestrateur
