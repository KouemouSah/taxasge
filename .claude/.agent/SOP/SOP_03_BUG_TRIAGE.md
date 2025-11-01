# SOP 3 : BUG TRIAGE & RESOLUTION

**Fréquence** : Daily (après standup) + À la détection  
**Durée** : 15-30 min selon nombre bugs  
**Participants** : Orchestrateur + Agent DEV + Agent TEST

---

## OBJECTIF

Traiter tous bugs rapidement et efficacement :
- ✅ Classifier bugs par sévérité
- ✅ Assigner à bon agent
- ✅ Résoudre dans SLA défini
- ✅ Prévenir récurrence

---

## CLASSIFICATION SÉVÉRITÉ

### 🔴 P0 - CRITIQUE (SLA: <2h)
**Critères** :
- Application down ou inaccessible
- Perte de données
- Faille sécurité critique
- Revenus bloqués (webhooks BANGE down)

**Exemples** :
- "API retourne 500 sur tous endpoints"
- "Database connexion perdue"
- "Webhooks BANGE ne sont plus reçus"
- "JWT tokens tous invalidés"

**Action** : Drop everything, fix immédiatement

---

### 🟠 P1 - BLOQUANT (SLA: <24h)
**Critères** :
- Feature critique non fonctionnelle
- Workflow bloqué pour users
- Performance dégradée (P95 >2s)
- Bug affectant >50% users

**Exemples** :
- "Impossible de créer déclaration"
- "Upload documents échoue à 100%"
- "Login échoue pour users Gmail"
- "Agents ne voient pas la queue"

**Action** : Priorité haute, fix dans la journée

---

### 🟡 P2 - MAJEUR (SLA: <1 semaine)
**Critères** :
- Feature non-critique bugguée
- Workaround existe
- Affecte <20% users
- UX dégradée mais utilisable

**Exemples** :
- "Bouton 'Download Receipt' ne fonctionne pas"
- "Notification email envoyée 2x"
- "Dashboard admin stats incorrectes"
- "OCR rate faible (60% au lieu de 80%)"

**Action** : Fix dans sprint actuel

---

### 🟢 P3 - MINEUR (SLA: <2 semaines)
**Critères** :
- Bug cosmétique
- Affecte <5% users
- Impact minimal
- Nice to fix mais pas urgent

**Exemples** :
- "Typo dans message erreur"
- "Tooltip ne s'affiche pas toujours"
- "Couleur bouton incorrecte (design)"
- "Log verbeux (trop d'infos)"

**Action** : Backlog, fix quand temps dispo

---

### 🔵 P4 - SUGGESTION (SLA: Best effort)
**Critères** :
- Amélioration (pas vraiment un bug)
- Feature request
- Optimization

**Exemples** :
- "Ajouter filtre par date sur dashboard"
- "Export CSV devrait inclure champ X"
- "API devrait supporter pagination cursor"

**Action** : Backlog, prioriser avec roadmap

---

## PROCÉDURE TRIAGE

### 1. RÉCEPTION BUG

**Sources** :
- Production monitoring (Grafana/PagerDuty alerts)
- User reports (support tickets)
- Tests QA (Agent TEST)
- Code review (reviewers)

**Template Bug Report** :
```markdown
## 🐛 Bug Report

**Titre** : [Concis et descriptif]

**Sévérité** : [P0/P1/P2/P3/P4]

**Environnement** :
- Environment: [Production/Staging/Dev]
- Version: [v1.0.0]
- Date détection: [2025-10-20 10:30]

**Description** :
[Description claire du bug]

**Steps to Reproduce** :
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior** :
[Ce qui devrait se passer]

**Actual Behavior** :
[Ce qui se passe réellement]

**Screenshots/Logs** :
```
[Logs ou screenshots]
```

**Impact** :
- Users affectés: [Nombre ou %]
- Modules affectés: [AUTH, PAYMENTS, etc.]
- Workaround disponible: [Oui/Non]

**Contexte additionnel** :
[Infos utiles pour debug]
```

---

### 2. TRIAGE MEETING (Daily, 9h15 après standup)

**Orchestrateur** présente nouveaux bugs :

#### 2.1 Pour chaque bug :

**Étape 1 : Classifier sévérité**
```
Q1: Application down ou données perdues ? → P0
Q2: Feature critique bloquée ? → P1
Q3: Workaround existe ? → P2
Q4: Impact cosmétique ? → P3
Q5: Amélioration, pas vraiment bug ? → P4
```

**Étape 2 : Vérifier duplication**
```bash
# Rechercher bugs similaires
jira query "summary ~ 'webhook' AND status != Closed"
```

**Étape 3 : Assigner**
```
- Bug backend → Agent DEV
- Bug tests/quality → Agent TEST
- Bug documentation → Agent DOC
- Bug infrastructure → Orchestrateur (ou DevOps)
```

**Étape 4 : Définir SLA**
```
P0 → Fix < 2h
P1 → Fix < 24h
P2 → Fix < 1 semaine
P3 → Fix < 2 semaines
P4 → Backlog
```

---

### 3. INVESTIGATION (Assignee)

**Agent assigné** investigue :

#### 3.1 Reproduire bug
```bash
# Setup environment identique
export ENVIRONMENT=production-replica

# Execute steps to reproduce
python scripts/reproduce_bug.py --bug-id=BUG-123
```

#### 3.2 Identifier root cause
```python
# Exemples techniques investigation

# 1. Check logs
kubectl logs -l app=backend --since=1h | grep ERROR

# 2. Check database
psql -c "SELECT * FROM webhook_events WHERE processed=false LIMIT 10"

# 3. Check external APIs
curl -X POST https://api.bange.com/test -H "Authorization: Bearer $TOKEN"

# 4. Profile code (si performance issue)
python -m cProfile -o profile.stats main.py
```

#### 3.3 Documenter findings
```markdown
## Investigation BUG-123

**Root Cause** :
Webhook signature validation échoue car secret mal configuré en production.

**Technical Details** :
```python
# Code actuel (incorrect)
secret = settings.BANGE_WEBHOOK_SECRET  # Vide en prod

# Devrait être
secret = os.getenv("BANGE_WEBHOOK_SECRET")  # Lit depuis env var
```

**Files affected** :
- `app/services/webhook_service.py` (line 45)

**Solution proposée** :
1. Fix code pour lire env var correctement
2. Ajouter validation secret au startup (fail fast si manquant)
3. Update secrets K8s avec bon token
```

---

### 4. RÉSOLUTION

#### 4.1 Créer fix
```bash
# Create hotfix branch
git checkout -b hotfix/webhook-signature-validation

# Fix code
# ... code changes ...

# Tests
pytest tests/test_webhook.py -v

# Commit
git commit -m "fix(webhooks): Fix signature validation using env var"

# Create PR
gh pr create --title "fix: Webhook signature validation" --body "Fixes BUG-123"
```

#### 4.2 Hotfix Process (P0/P1)

**Si P0 ou P1** :
```bash
# Fast-track PR review (< 30 min)
# Deploy ASAP to production

# 1. Merge to main
git checkout main
git merge hotfix/webhook-signature-validation

# 2. Deploy
kubectl set image deployment/backend backend=ghcr.io/taxasge/backend:hotfix-123

# 3. Verify fix
curl https://api.taxasge.com/health
# Test webhook manually
```

**Si P2/P3/P4** :
```bash
# Standard PR process
# Include in next regular release
```

---

### 5. VERIFICATION

**Agent TEST** vérifie fix :

#### 5.1 Tests
```python
@pytest.mark.bug_regression
def test_bug_123_webhook_signature_validation():
    """
    Regression test for BUG-123
    
    Bug: Webhook signature validation failing in production
    Fix: Use env var instead of settings
    """
    # Setup
    webhook_payload = {...}
    signature = generate_valid_signature(webhook_payload)
    
    # Test
    response = client.post(
        "/webhooks/bange",
        json=webhook_payload,
        headers={"X-BANGE-Signature": signature}
    )
    
    # Assert
    assert response.status_code == 200
    assert response.json()["status"] == "processed"
```

#### 5.2 Vérification production
```bash
# Après déploiement, vérifier logs production
kubectl logs -l app=backend --tail=100 | grep "webhook"

# Vérifier métriques
# → webhook_errors_total should decrease
```

---

### 6. DOCUMENTATION & CLOSURE

**Orchestrateur** :

#### 6.1 Update bug ticket
```markdown
## BUG-123 RESOLVED ✅

**Status** : Closed
**Resolution** : Fixed
**Fix Version** : v1.0.1

**Root Cause** :
Webhook secret not loaded from env var

**Solution** :
- Fixed code to read BANGE_WEBHOOK_SECRET from environment
- Added validation at startup
- Updated K8s secrets

**PR** : #156
**Deployed** : 2025-10-20 14:30
**Verified** : 2025-10-20 15:00

**Regression Test** : `test_bug_123_webhook_signature_validation()`

**Lessons Learned** :
- Always validate env vars at startup (fail fast)
- Add alerts for missing critical config
```

#### 6.2 Post-mortem (si P0)
```markdown
# POST-MORTEM : BUG-123 Webhook Signature Validation

**Date** : 2025-10-20
**Severity** : P0
**Duration** : 1h 30min (10:00 - 11:30)
**Impact** : 100% webhooks rejected → 0 payments confirmed

## Timeline
- 10:00 : Alert PagerDuty "Webhook processing failures"
- 10:05 : Investigation started
- 10:20 : Root cause identified (missing env var)
- 10:30 : Fix deployed to staging
- 10:45 : Fix tested and verified
- 11:00 : Fix deployed to production
- 11:30 : Monitoring confirms resolution

## Root Cause
Config refactor moved secrets to env vars but webhook service still read from settings (empty).

## Resolution
- Fixed code to read env var
- Deployed hotfix
- Manually retried failed webhooks (238 webhooks)

## Prevention
1. Add startup validation for all critical env vars
2. Add integration test for webhook end-to-end
3. Add alert if webhook_errors_total > 10/5min
4. Document all env vars in README

## Action Items
- [x] Fix deployed (Agent DEV)
- [x] Regression test added (Agent TEST)
- [x] Alerts configured (Orchestrateur)
- [ ] Documentation updated (Agent DOC) - DUE: 2025-10-21
```

---

## TEMPLATES JIRA/TRELLO

### Bug Card Template
```markdown
**BUG-123** : Webhook signature validation failing

**Type** : Bug 🐛
**Severity** : P0 🔴
**Status** : In Progress
**Assignee** : Agent DEV
**Reporter** : Orchestrateur
**Created** : 2025-10-20 10:00
**SLA Due** : 2025-10-20 12:00 (2h)

**Labels** : bug, p0, webhooks, hotfix

**Description** :
Webhooks BANGE rejected with "Invalid signature" error.

**Impact** :
- 100% webhooks failing
- 0 payments confirmed
- Revenue collection stopped

**Steps to Reproduce** :
1. Send webhook to /webhooks/bange
2. Observe 401 Unauthorized response

**Root Cause** :
Missing env var BANGE_WEBHOOK_SECRET

**Solution** :
Fix code + update K8s secrets

**Verification** :
Regression test added
```

---

## ANTI-PATTERNS

❌ **Ignorer P0/P1 bugs** → Production down
✅ Solution : Drop everything pour P0, fix P1 dans 24h

❌ **Pas de regression tests** → Bug revient
✅ Solution : Toujours ajouter test pour chaque bug

❌ **Fix sans post-mortem (P0)** → Repeat mistakes
✅ Solution : Post-mortem obligatoire pour tous P0

❌ **Déployer fix sans vérification** → Nouveau bug
✅ Solution : Toujours tester fix en staging avant prod

❌ **Documentation manquante** → Connaissance perdue
✅ Solution : Update ticket + add lessons learned

---

## METRICS & DASHBOARD

**Grafana Dashboard : Bug Metrics**
```
- Total bugs (par sévérité)
- Mean Time To Resolve (MTTR)
  - P0: <2h
  - P1: <24h
  - P2: <1w
- Bug reopen rate (<5%)
- Bugs créés vs resolved (trend)
```

---

## KPIs

| Métrique | Target | Actuel |
|----------|--------|--------|
| P0 MTTR | <2h | 1.5h ✅ |
| P1 MTTR | <24h | 18h ✅ |
| P2 MTTR | <1w | 4d ✅ |
| Bugs production/mois | <5 | 3 ✅ |
| Regression rate | <5% | 2% ✅ |

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-10-20  
**Propriétaire** : Orchestrateur
