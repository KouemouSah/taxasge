# Plan : Workflow Post-Validation + Dashboard Agent Cleanup

**Date** : 2026-04-20
**Contexte** : Après la session de debug assignment (fix root cause assigned_to), l'audit révèle des gaps architecturaux dans le workflow post-validation et les widgets dashboard.

---

## 1. État actuel — Ce qui existe vs ce qui manque

### Flux actuel après validation agent

```
Agent clique "Aprobar"
  → status = DOSSIER_VALIDE
  → auto-advance CITA_SCHEDULED (si cita + paiement existent)
  → auto-advance IN_PROGRESS (si paiement + pas de cita requise)
  → background: génère certificat PDF + email citoyen avec next_steps
  → FIN (le système s'arrête ici)
```

### Ce qui manque pour un flux complet

```
DOSSIER_VALIDE
  → CITA_SCHEDULED (citoyen informé de son RDV)
  → [Agent] mark-arrived (citoyen se présente au RDV)
  → IN_PROGRESS (traitement en cours)
  → [Agent] mark-delivered (document délivré au citoyen)
  → COMPLETED (dossier clos)
  → [Auto] cleanup assignments + agent_work_queue
```

---

## 2. Bugs immédiats à corriger

### B1 — Appointment default site (CNEDOGE split view)
**Problème** : `useAgentDashboard()` retourne `null` dans `AppointmentSection` → fallback au premier site de la liste.
**Root cause probable** : le composant est rendu hors du `AgentDashboardProvider`, OU le context n'est pas encore chargé quand `loadSlots` s'exécute.
**Investigation** : vérifier le Provider tree de la page Pendientes. Alternative : passer `agentLocationId` en prop depuis `RequestPreview` (qui a accès au context).
**Fichier** : `packages/web/src/modules/agent-dashboard/components/pending/sections/AppointmentSection.tsx`

### B2 — Alertas/Urgentes montrent des dossiers DOSSIER_VALIDE
**Problème** : le dashboard CNEDOGE affiche 9 alertas "SLA Vencido" pour des dossiers déjà validés.
**Root cause** : la query `alertas` filtre sur `agent_work_queue` SLA mais ne vérifie pas `service_request.status`.
**Fix** : exclure `sr.status IN ('DOSSIER_VALIDE', 'COMPLETED', 'REJECTED', 'CANCELLED')` des alertas.

**Widgets affectés** (confirmé par audit) :
| Widget | Endpoint | Bug ? |
|---|---|---|
| Queue Stats | `/queue/stats` line 548 | ⚠️ DOSSIER_VALIDE compté dans "completed_today" |
| Urgent | `/widgets/urgent` | ✅ OK (exclut DOSSIER_VALIDE) |
| Alerts | `/widgets/alerts` | ❌ **NE filtre PAS** par SR status |
| Appointments | `/widgets/appointments` | ✅ OK |
| Distribution | `/widgets/distribution` | ✅ OK |
| Personal Stats | `/widgets/personal-stats` | ✅ OK |

**NOTE** : l'audit montre que Urgentes EXCLUT correctement DOSSIER_VALIDE (`sr.status NOT IN ('COMPLETED','REJECTED',...)`). Le bug visible dans le screenshot est dans **Alertas** (SLA Vencido qui ne filtre pas par SR status) et dans le widget **Solicitudes Urgentes** du dashboard principal (qui est DIFFÉRENT de `/widgets/urgent`).

### B3 — Completadas Hoy: 0 malgré des validations
**Root cause** : le compteur utilise `sr.updated_at > NOW() - INTERVAL '24 hours'` avec `sr.status IN ('COMPLETED', 'DOSSIER_VALIDE')`. Les dossiers ont été validés hier (backfill).
**Pas un bug** pour les FUTURS dossiers — le compteur fonctionnera correctement pour les nouvelles validations.

---

## 3. Features manquantes — Workflow complet

### Phase 1 — Endpoints de progression post-validation (CRITIQUE)

#### P1.1 — `POST /{request_id}/mark-arrived`
**Existe déjà** (agent_routes.py lignes 2397-2462). Sets `appointment_status = 'arrived'`.
**Manquant** : ne change PAS le status SR vers `IN_PROGRESS`. Doit aussi :
- UPDATE `service_requests.status = 'IN_PROGRESS'`
- INSERT history `'appointment_attended'`
- Notifier le citoyen "Votre rendez-vous est confirmé, traitement en cours"

#### P1.2 — `POST /{request_id}/mark-delivered` (NOUVEAU)
**N'existe PAS**. Doit :
- UPDATE `service_requests.status = 'COMPLETED', completed_at = NOW()`
- INSERT history `'document_delivered'`
- Générer certificat final (si applicable)
- Notifier citoyen "Votre document est prêt / a été délivré"
- Cleanup : `assignments.status = 'completed'`, `agent_work_queue.status = 'completed'`
- Mettre à jour workload agent

#### P1.3 — `POST /{request_id}/complete` (NOUVEAU)
Pour les workflows SANS rendez-vous (matriculacion, duplicado vehiculo, etc.) :
- Directement `DOSSIER_VALIDE → COMPLETED`
- Mêmes effets que mark-delivered

### Phase 2 — Dashboard agent cleanup

#### P2.1 — Fix Alertas widget
Ajouter `AND sr.status::text NOT IN ('DOSSIER_VALIDE','COMPLETED','REJECTED','CANCELLED','EXPIRED')` dans la query SLA alertas.

#### P2.2 — Fix Solicitudes Urgentes (dashboard principal)
Identifier la query du widget "Solicitudes Urgentes" dans le dashboard principal (pas le widget `/widgets/urgent` qui est correct) et appliquer le même filtre.

#### P2.3 — Fix Queue Stats "completed_today"
Retirer `DOSSIER_VALIDE` du count completed : `DOSSIER_VALIDE` = validation agent, PAS completion du dossier. Seul `COMPLETED` = dossier clos.

#### P2.4 — Fix AppointmentSection default site
Passer `agentLocationId` en prop au lieu d'utiliser `useAgentDashboard()` dans le composant enfant.

### Phase 3 — Notifications post-validation

#### P3.1 — Notification CITA_SCHEDULED
Template email + SMS + in-app :
- "Votre dossier CON-2026-00001 a été validé"
- "Rendez-vous le 21/04/2026 à 11:00 - MALABO II"
- "Documents à apporter : [liste]"

#### P3.2 — Notification IN_PROGRESS
Template : "Votre document est en cours de préparation"

#### P3.3 — Notification COMPLETED
Template : "Votre document est prêt. Récupérez-le au bureau [location]."

### Phase 4 — Gestion des cas limites

#### P4.1 — No-show auto-rescheduling
CRON job : si `cita_date < NOW()` et `appointment_status IS NULL` → marquer `no_show` + notifier citoyen + proposer reprogrammation.

#### P4.2 — Expired requests cleanup
CRON job : si `status = 'CITA_SCHEDULED'` et `cita_date < NOW() - INTERVAL '30 days'` → auto-cancel avec notification.

#### P4.3 — Recours dossier rejeté
`POST /{request_id}/appeal` : permet au citoyen de contester un rejet avec une raison. Crée un lien entre la demande originale et l'appel. L'agent superviseur examine l'appel.

### Phase 5 — Qualité production

#### P5.1 — Certificat de validation persisté dans Firebase
Le certificat PDF généré dans `_bg_approve_pdf_and_notify` est envoyé par email mais PAS stocké en Firebase. Doit être :
- Uploadé dans Firebase Storage
- Enregistré dans `user_documents` (comme fait pour le reçu et la solicitud)
- Accessible depuis le dashboard citoyen "Documents > Générés"

#### P5.2 — SLA étendu post-validation
Le SLA actuel s'arrête à DOSSIER_VALIDE. Il devrait couvrir :
- DOSSIER_VALIDE → CITA_SCHEDULED : délai cible 24h
- CITA_SCHEDULED → IN_PROGRESS : délai = date cita
- IN_PROGRESS → COMPLETED : délai cible 48h après cita
- Alertes SLA si ces délais sont dépassés

#### P5.3 — Archivage agent_work_queue
Les entrées `completed` s'accumulent. CRON job mensuel : déplacer vers `agent_work_queue_archive` ou DELETE les entrées > 90 jours.

#### P5.4 — Tests E2E automatisés
Pytest fixtures pour le flux complet :
```
soumission → paiement → cita → assignation → validation → CITA_SCHEDULED
→ mark-arrived → IN_PROGRESS → mark-delivered → COMPLETED
→ vérifier: widgets dashboard vides, notifications envoyées, documents stockés
```

---

## 4. Ordre d'exécution recommandé

```
B1 + B2 + B4 (bugs dashboard) ............ 2-3h
P1.1 + P1.2 + P1.3 (endpoints post-val) .. 3-4h
P2.1..P2.4 (dashboard cleanup) ........... 2h
P3.1..P3.3 (notifications) ............... 2h
P5.1 (certificat Firebase) ............... 1h
P4.1..P4.3 (cas limites) ................. 3-4h
P5.2..P5.4 (qualité production) .......... 4-6h
```

**Total estimé** : 2-3 sessions de travail

---

## 5. Résumé — Ce que le système ne gère PAS aujourd'hui

| Étape workflow | Implémenté | Manquant |
|---|---|---|
| Citoyen soumet demande | ✅ | — |
| Paiement | ✅ | — |
| Cita programmée | ✅ | — |
| Assignation agent | ✅ (fix root cause) | — |
| Agent valide (DOSSIER_VALIDE) | ✅ | — |
| Auto-advance → CITA_SCHEDULED | ✅ (fix cette session) | — |
| next_steps notification | ✅ (fix cette session) | Template dédié par workflow |
| Citoyen se présente au RDV | ⚠️ Endpoint existe | Ne change pas SR status |
| Agent délivre le document | ❌ | Pas d'endpoint |
| Dossier COMPLETED | ❌ | Pas de trigger agent |
| Notification "document prêt" | ❌ | Pas de template |
| Certificat stocké Firebase | ❌ | PDF en mémoire seulement |
| Recours rejet | ❌ | Pas d'endpoint |
| No-show auto-reschedule | ❌ | Pas de CRON |
| SLA post-validation | ❌ | S'arrête à DOSSIER_VALIDE |
| Cleanup agent_work_queue | ❌ | Accumulation infinie |
| Dashboard exclut DOSSIER_VALIDE | ❌ | Alertas/Urgentes buggés |
