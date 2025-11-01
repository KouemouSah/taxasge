# SOP 5 : INCIDENT RESPONSE

**Fréquence** : À la détection (24/7)  
**Durée** : Variable selon sévérité  
**Participants** : On-Call Engineer + Escalation selon besoin

---

## OBJECTIF

Répondre rapidement aux incidents production pour :
- ✅ Minimiser downtime
- ✅ Réduire impact users
- ✅ Communiquer clairement
- ✅ Apprendre et améliorer

---

## CLASSIFICATION INCIDENTS

### 🔴 SEV-1 (CRITIQUE)
**Critères** :
- Service complètement down (>90% users impactés)
- Perte de données
- Breach sécurité
- Revenus bloqués (>1M XAF/h perdu)

**Exemples** :
- "API retourne 500 sur tous endpoints"
- "Database connexion perdue"
- "Tous webhooks BANGE échouent → 0 paiements"
- "Faille sécurité exploitée activement"

**SLA** : Acknowledge <5 min, Resolve <2h
**Escalation** : Immédiate (CTO + Team entière)

---

### 🟠 SEV-2 (MAJEUR)
**Critères** :
- Feature critique down (20-90% users impactés)
- Performance sévèrement dégradée
- Perte partielle service
- Revenus impactés mais pas bloqués

**Exemples** :
- "Login impossible pour users Gmail"
- "Upload documents échoue à 80%"
- "P95 latency >3s (normal: 500ms)"
- "Agents ne voient pas la queue"

**SLA** : Acknowledge <15 min, Resolve <4h
**Escalation** : Lead Dev + On-call

---

### 🟡 SEV-3 (MINEUR)
**Critères** :
- Feature non-critique impactée (<20% users)
- Performance légèrement dégradée
- Workaround existe
- Impact limité

**Exemples** :
- "Notifications email delayed (1h de retard)"
- "Dashboard admin stats incorrectes"
- "Export CSV ne fonctionne pas"
- "OCR quality faible (60% au lieu de 80%)"

**SLA** : Acknowledge <1h, Resolve <24h
**Escalation** : Standard (pas d'escalation immédiate)

---

## ON-CALL ROTATION

### Schedule (24/7)
```
Week 1 : Agent DEV (primary) + Orchestrateur (backup)
Week 2 : Orchestrateur (primary) + Agent DEV (backup)

Rotation : Lundi 9h → Lundi 9h (1 semaine)
```

### Responsibilities
```markdown
- [ ] Répondre aux alerts PagerDuty (<5 min SEV-1, <15 min SEV-2)
- [ ] Investiguer et diagnostiquer incident
- [ ] Appliquer fix ou workaround
- [ ] Communiquer statut (Slack, status page)
- [ ] Escalate si nécessaire
- [ ] Écrire post-mortem (SEV-1/SEV-2)
```

### Handoff Process
```markdown
## On-Call Handoff - Lundi 9h

**Sortant** (Agent DEV) :
✅ No active incidents
⚠️ Watch items :
- Database replica lag (slight delay, monitoring)
- BANGE API showing intermittent slowness (no impact yet)

📝 Incidents dernière semaine :
- INC-001 : Webhook processing spike (resolved)
- INC-002 : Memory leak pod-3 (restarted)

🎯 Upcoming :
- Maintenance database mercredi 22h (planned)

**Entrant** (Orchestrateur) :
✅ Acknowledge handoff
✅ Verified PagerDuty configured
✅ Verified access to all systems
✅ Read runbook and recent incidents

**Status** : Handoff complete ✅
```

---

## PROCÉDURE RÉPONSE INCIDENT

### PHASE 1 : DÉTECTION & TRIAGE (0-5 min)

#### 1.1 Alert Reçue (PagerDuty)
```
📱 PagerDuty Alert
Severity: SEV-1
Title: "API Down - All endpoints returning 500"
Time: 2025-10-20 22:15
```

#### 1.2 Acknowledge (< 5 min)
```bash
# Click "Acknowledge" dans PagerDuty
# → Stop alarme, assign incident à soi
```

#### 1.3 Évaluer Sévérité
```
Q1: Service down complètement ? → SEV-1
Q2: Feature critique impactée ? → SEV-2
Q3: Impact limité, workaround existe ? → SEV-3
```

#### 1.4 Créer Incident Slack Channel
```
# Créer channel
/create-channel #incident-2025-10-20-001

# Post initial status
📢 INCIDENT DECLARED

**Severity** : SEV-1 🔴
**Title** : API Down - All endpoints returning 500
**Status** : Investigating
**Impact** : 100% users cannot access application
**Started** : 2025-10-20 22:15

**On-Call** : @orchestrateur
**Link** : https://pagerduty.com/incidents/ABC123

Investigation in progress...
```

---

### PHASE 2 : INVESTIGATION (5-30 min)

#### 2.1 Check Health & Logs
```bash
# 1. Check pods status
kubectl get pods -n taxasge-production

# Output example
NAME                    READY   STATUS    RESTARTS   AGE
backend-7d4b8c-abc      0/1     Error     5          10m
backend-7d4b8c-def      0/1     Error     5          10m
backend-7d4b8c-ghi      0/1     Error     5          10m

# 2. Check logs (dernières erreurs)
kubectl logs backend-7d4b8c-abc --tail=50

# Output example
ERROR: Unable to connect to database
psycopg2.OperationalError: could not connect to server
```

#### 2.2 Check External Dependencies
```bash
# Database
psql $DATABASE_URL -c "SELECT 1"
# → Error: Connection refused

# Redis
redis-cli -h redis.taxasge.com ping
# → PONG (OK)

# BANGE API
curl https://api.bange.com/health
# → 200 OK
```

#### 2.3 Check Metrics (Grafana)
```
# Open dashboards
https://grafana.taxasge.com/d/api-overview

Observations:
- Requests/sec: 0 (dropped to 0 at 22:15)
- Error rate: 100%
- Database connections: 0 (normally ~10)
```

#### 2.4 Root Cause Identified
```
🔍 ROOT CAUSE FOUND

Database Cloud SQL instance is down.

Evidence:
- All pods failing database connection
- Cloud SQL status page shows "Incident"
- No changes deployed recently

Action: Escalate to GCP Support
```

---

### PHASE 3 : MITIGATION (30-60 min)

#### 3.1 Apply Workaround (if possible)
```bash
# Example: Switch to failover database
kubectl set env deployment/backend \
  DATABASE_URL=$DATABASE_URL_REPLICA

kubectl rollout restart deployment/backend
```

#### 3.2 Escalate (si nécessaire)
```
SEV-1 → Escalate immédiatement

Escalation List:
1. CTO (@cto-slack)
2. GCP Support (ticket + phone)
3. BANGE Support (si webhook issue)
4. Team Dev complete (via Slack)
```

#### 3.3 Communication Updates (Every 15 min)
```markdown
📢 UPDATE #1 - T+15 min

**Status** : Investigating
**Root Cause** : Database Cloud SQL down
**Action** : 
- Escalated to GCP Support (ticket #123456)
- Attempting failover to replica database
**ETA** : 30 min

100% users still impacted. Working on resolution.
```

```markdown
📢 UPDATE #2 - T+30 min

**Status** : Mitigating
**Progress** :
✅ GCP confirmed incident on their side
✅ Failover to replica database completed
⏳ Testing application

**ETA** : 15 min

Service should be restored shortly.
```

---

### PHASE 4 : RÉSOLUTION (60-120 min)

#### 4.1 Verify Fix
```bash
# 1. Check pods healthy
kubectl get pods -n taxasge-production
# → All Running

# 2. Check health endpoint
curl https://api.taxasge.com/health
# → 200 OK

# 3. Test critical endpoints
curl https://api.taxasge.com/api/v1/fiscal-services?limit=1
# → 200 OK

# 4. Check metrics
# → Requests/sec back to normal (~1000)
# → Error rate <1%
```

#### 4.2 Resolve Incident
```bash
# Mark resolved in PagerDuty
# Status: Resolved
```

#### 4.3 Communication Résolution
```markdown
✅ INCIDENT RESOLVED

**Duration** : 1h 15min (22:15 - 23:30)
**Impact** : 100% users unable to access application
**Root Cause** : GCP Cloud SQL instance failure
**Resolution** : Failover to replica database

**Timeline** :
- 22:15 : Incident detected (PagerDuty alert)
- 22:20 : Root cause identified (database down)
- 22:25 : Escalated to GCP Support
- 22:45 : Failover initiated
- 23:00 : Testing completed
- 23:30 : Service fully restored

**Next Steps** :
- GCP investigating root cause
- Post-mortem scheduled (tomorrow 10h)
- Improve alerting (detect DB issues faster)

Thank you for your patience. Service is now stable.
```

---

### PHASE 5 : POST-INCIDENT

#### 5.1 Monitoring (1h post-resolution)
```
Monitor dashboards for 1h to ensure stability:
- No new alerts
- Metrics stable
- No error spikes
```

#### 5.2 Post-Mortem (SEV-1/SEV-2) - Next Day
```markdown
# POST-MORTEM : INC-2025-10-20-001

**Date** : 2025-10-20
**Severity** : SEV-1 🔴
**Duration** : 1h 15min
**Impact** : 100% users (5,000 active users affected)

## Summary
Complete service outage due to GCP Cloud SQL instance failure.

## Timeline (All times GMT+1)
| Time | Event |
|------|-------|
| 22:15 | PagerDuty alert triggered |
| 22:17 | Incident acknowledged by On-Call |
| 22:20 | Root cause identified (database down) |
| 22:25 | Escalated to GCP Support |
| 22:30 | Attempted automatic failover (failed) |
| 22:45 | Manual failover initiated |
| 23:00 | Testing application on replica |
| 23:30 | Service fully restored |

## Root Cause
GCP Cloud SQL primary instance experienced hardware failure (confirmed by GCP).

## Impact
- **Users** : 100% unable to access application (5,000 users)
- **Duration** : 1h 15min total downtime
- **Revenue** : Estimated 200 declarations delayed (~50M XAF)
- **SLA** : Breached (99.9% → 99.8% monthly uptime)

## Resolution
Manual failover to read replica promoted to primary.

## What Went Well ✅
- Alert triggered immediately (PagerDuty)
- On-Call responded quickly (<5 min)
- Root cause identified fast (5 min)
- Communication clear and frequent (every 15 min)
- Failover process worked as designed

## What Went Wrong ❌
- Automatic failover didn't trigger (should be automatic)
- No early warning (database health deteriorating)
- Replica not fully synced (30s lag, minor data loss possible)
- Documentation incomplete (failover steps not clear)

## Action Items
| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | Fix automatic failover (investigate why failed) | Orchestrateur | 2025-10-22 | 🟡 In Progress |
| 2 | Add database health monitoring alerts | Agent DEV | 2025-10-21 | ✅ Done |
| 3 | Document failover procedure (step-by-step) | Agent DOC | 2025-10-21 | ✅ Done |
| 4 | Setup sync replication (zero lag) | Orchestrateur | 2025-10-25 | 🔴 Planned |
| 5 | Schedule GCP meeting (review incident) | Orchestrateur | 2025-10-23 | 🟡 Scheduled |

## Lessons Learned
1. **Redundancy is critical** : Replica saved us, but automatic failover failed
2. **Monitoring needs improvement** : Should alert before complete failure
3. **Documentation matters** : Clear runbook would have saved 15 min
4. **Communication worked well** : Status updates helped manage expectations

## Prevention
- **Monitoring** : Add alert for database connection pool exhaustion
- **Automation** : Fix automatic failover mechanism
- **Testing** : Schedule quarterly disaster recovery drills
- **Documentation** : Maintain updated runbooks

---

**Reviewed by** : CTO, Lead Dev, On-Call Engineer
**Date** : 2025-10-21
```

---

## COMMUNICATION GUIDELINES

### Internal (Slack #incidents)
```
✅ Frequency : Every 15 min minimum (SEV-1/SEV-2)
✅ Audience : Team Dev, Ops, Management
✅ Content : Technical details, actions, ETA
✅ Format : Structured updates (see templates)
```

### External (Status Page)
```
✅ Frequency : Every 30 min (SEV-1), 1h (SEV-2)
✅ Audience : Users, customers
✅ Content : Impact, status, ETA (no technical jargon)
✅ Format : Simple language, empathetic

Example:
"We're experiencing issues with our service. 
Our team is actively working on a fix. 
We apologize for the inconvenience and will 
provide updates every 30 minutes."
```

### Executive (Email/Phone)
```
✅ Frequency : Initial alert + resolution (SEV-1), daily summary (SEV-2)
✅ Audience : CTO, CEO, Leadership
✅ Content : Business impact, financial impact, resolution plan
✅ Format : Executive summary (1 page max)
```

---

## RUNBOOK QUICK LINKS

**Common Incidents** :
1. [API Down](link-to-runbook-1)
2. [Database Connection Lost](link-to-runbook-2)
3. [High Error Rate](link-to-runbook-3)
4. [Webhook Processing Failures](link-to-runbook-4)
5. [High Latency](link-to-runbook-5)
6. [Memory Leak](link-to-runbook-6)

**Access Links** :
- [PagerDuty](https://taxasge.pagerduty.com)
- [Grafana](https://grafana.taxasge.com)
- [Kubernetes Dashboard](https://k8s.taxasge.com)
- [GCP Console](https://console.cloud.google.com)
- [Slack #incidents](https://taxasge.slack.com/archives/incidents)

---

## INCIDENT SEVERITY MATRIX

| Criteria | SEV-1 | SEV-2 | SEV-3 |
|----------|-------|-------|-------|
| Users Impacted | >90% | 20-90% | <20% |
| Revenue Impact | >1M XAF/h | 100K-1M XAF/h | <100K XAF/h |
| Acknowledge SLA | <5 min | <15 min | <1h |
| Resolve SLA | <2h | <4h | <24h |
| Update Frequency | 15 min | 30 min | 1h |
| Escalation | Immediate | If not resolved 2h | Standard |
| Post-Mortem | Required | Required | Optional |

---

## ANTI-PATTERNS

❌ **Panic & guess** → Rend situation pire
✅ Solution : Follow runbook, methodical investigation

❌ **No communication** → Users/Team dans le noir
✅ Solution : Update every 15 min minimum (SEV-1)

❌ **Fix without understanding** → Problème revient
✅ Solution : Root cause analysis AVANT fix

❌ **Skip post-mortem** → Ne pas apprendre
✅ Solution : Post-mortem obligatoire SEV-1/SEV-2

❌ **Blame culture** → Team afraid to report issues
✅ Solution : Blameless post-mortems, focus on process

---

## METRICS & KPIs

| Métrique | Target | Actuel |
|----------|--------|--------|
| MTTA (Mean Time To Acknowledge) | <5 min (SEV-1) | 3 min ✅ |
| MTTR (Mean Time To Resolve) | <2h (SEV-1) | 1h 15min ✅ |
| Incidents/month | <5 | 2 ✅ |
| SEV-1 incidents/quarter | <3 | 1 ✅ |
| Post-mortem completion | 100% | 100% ✅ |
| Action items closed | >80% in 30 days | 85% ✅ |

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-10-20  
**Propriétaire** : Orchestrateur
