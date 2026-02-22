# RAPPORT ARCHITECTURAL TESORO — Agents & Superviseurs

**Date**: 2026-02-22
**Auteur**: Claude Opus 4.6 (audit automatisé)

## 1. ARCHITECTURE ACTUELLE

### Rôles & Permissions

| Rôle | Permissions | Menu Items | Widgets | Utilisateurs actifs |
|------|------------|------------|---------|-------------------|
| `agent_tesoro` | 38 | 5 groupes (13 items) | 5 | **1** (tesoreria.ge@outlook.fr) |
| `supervisor_tesoro` | 42 (+`view_all`) | 6 groupes (14 items) | 5 | **0** (rôle existe, aucun profil) |

### Menu Config — agent_tesoro

```
Dashboard          → /dashboard/agent/treasury
Payments (3)       → validation, reconciliation, transactions
Reports (6)        → stats, analytics, audit, SLA, anomalies, exports
Escalations (2)    → create, my_escalations
Settings (2)       → banks, payment-methods
```

### Menu Config — supervisor_tesoro

```
Dashboard          → /dashboard/supervisor
Treasury Overview  → /dashboard/agent/treasury
Team (4)           → agents, workload, performance, agent_stats
Escalations (1)    → pending
Assignments (3)    → list, manual, rules
Reports (3)        → SLA, analytics, anomalies
```

### Dashboard Widgets

| agent_tesoro | supervisor_tesoro |
|-------------|------------------|
| pending_payments | pending_payments |
| in_progress_payments | team_workload |
| completed_payments | escalations |
| my_escalations | anomaly_summary |
| recent_activity | alerts |

### Infrastructure

| Composant | Quantité |
|-----------|----------|
| Pages frontend | 14 |
| Hooks frontend | 19 |
| Endpoints backend admin | 23+ |
| Endpoints widgets | 4 |
| Views SQL | 5 |
| Locations TESORO | 1 (Malabo II) |
| Service payments | 11 (TOUS pending_agent_review) |
| Assignments | 8 (TOUS assigned, 0 completed) |

### Pages Frontend (14)

| Page | Chemin relatif | Fonctionnalité |
|------|---------------|----------------|
| Dashboard | `/treasury/page.tsx` | Stats + quick actions dynamiques + widgets |
| Validation | `/treasury/validation/page.tsx` | Liste paiements avec batch validate/reject |
| Validation Detail | `/treasury/validation/[paymentId]/page.tsx` | Détail paiement + nav prev/next |
| Transactions | `/treasury/transactions/page.tsx` | Historique complet paiements |
| Reconciliation | `/treasury/reconciliation/page.tsx` | Matching transactions bancaires |
| Anomalies | `/treasury/anomalies/page.tsx` | Investigation anomalies |
| Audit | `/treasury/audit/page.tsx` | Trail d'audit |
| Exports | `/treasury/exports/page.tsx` | SAGE X3 / ministry / reconciliation |
| Stats KPI | `/treasury/stats/page.tsx` | KPIs + charts |
| Stats Agents | `/treasury/stats/agents/page.tsx` | Performance agents |
| Stats SLA | `/treasury/stats/sla/page.tsx` | Métriques SLA |
| Analytics | `/treasury/analytics/page.tsx` | Analyse statistique |
| Settings Banks | `/treasury/settings/banks/page.tsx` | Config banques CRUD |
| Settings Methods | `/treasury/settings/payment-methods/page.tsx` | Config méthodes paiement |

### Flux Paiement

```
Citoyen: initiate-payment (cash/check)
  → EventBus: PAYMENT_MANUAL_PENDING
    → PaymentAssignmentHandler: auto_assign_item(entity_code='TESORO', entity_location_id)
      → AutoAssignmentService: site exact → floating → entity-wide
        → service_payments.assigned_agent_id = agent_profile_id
          → Agent: validation page → approve/reject
            → SLA cron (48h warn → 5d escalate → 15d expire)
```

### SLA Tiers

| Tier | Seuil | Action | Destinataire |
|------|-------|--------|-------------|
| Warning | 48h | Email HTML consolidé | Agents TESORO |
| Escalation | 5 jours | Status → escalated_supervisor + email | Superviseurs TESORO |
| Expiration | 15 jours | Payment cancelled + request expired + email | Citoyen (es/fr/en) |

---

## 2. PROBLÈMES IDENTIFIÉS

### P0 — Bloquants

| # | Problème | Impact |
|---|----------|--------|
| C1 | 0 superviseur TESORO — rôle existe mais aucun agent_profile is_supervisor=true | Escalation SLA fallback aux agents |
| C2 | 11 paiements bloqués, 0 complétés — tout stuck en pending_agent_review | Agent n'a jamais traité |
| C3 | 3 paiements orphelins — 11 payments mais 8 assignments | Auto-assignment raté |
| C4 | Permission inconsistency — treasury.validate_payment vs treasury:validate_payments | Endpoints potentiellement cassés |

### P1 — Importants

| # | Problème |
|---|----------|
| C5 | ~80+ strings espagnol hardcodées dans 14 pages (pas de t()) |
| C6 | WORKFLOW_NAMES dupliqué dans 2 fichiers |
| C7 | SLA thresholds hardcodés (48h/5d/15d) — pas de config dynamique |
| C8 | Emails SLA en espagnol uniquement pour agents |
| C9 | AnomalySummaryWidget — 12 labels anomalies hardcodés espagnol |
| C10 | WidgetRegistry titres hardcodés espagnol |
| C11 | Receipt TREASURY_INFO statique (Malabo uniquement) |
| C12 | 2 clés i18n manquantes (recentActivity) |

### P2 — Améliorations

| # | Problème |
|---|----------|
| C13 | formatAmount() hardcode locale es-GQ |
| C14 | formatTimeAgo() non-locale-aware |
| C15 | PaymentStatusBadge — 15 labels hardcodés |
| C16 | SLABadge — 5 labels hardcodés |
| C17 | Pas d'enum Python PaymentWorkflowStatus |
| C18 | TREASURY_ENTITY_CODE hardcodé dans 3 fichiers |

---

## 3. CORRECTIONS APPLIQUÉES (session 2026-02-22)

### Phase Critique (7 bugs)
- P0: Count query JOIN manquant dans get_pending_payments
- P1: Backend endpoint recent-activity créé
- P1: statusFilter chain pour in_progress/completed widgets
- P2: entityCode optionnel, loc_idx simplifié, titleKey namespace, double filtre supprimé

### Phase i18n (en cours)
- B1: WORKFLOW_NAMES → treasury.workflowNames.* (es/fr/en)
- B2-B3: PaymentStatusBadge + SLABadge → treasury.statusLabels/slaLabels
- B4: AnomalySummaryWidget → agent.widgets.anomalyTypes.*
- B5: WidgetRegistry → titleKey i18n
- B6: ~80 strings validation pages → t()
- C4: Permission names standardisés (dot notation)
- C12: Missing i18n keys ajoutés

---

## 4. OPTIMISATIONS PROPOSÉES (futur)

| # | Proposition | Effort | Impact |
|---|------------|--------|--------|
| A1 | Widget "Paiements > 48h" avec countdown + bouton traiter | 2h | UX agent |
| A2 | Cron retry pour paiements orphelins | 1h | 0 paiements perdus |
| A3 | SLA thresholds en BD (system_config) | 2h | Admin sans redeploy |
| A4 | Batch auto-validate < seuil XAF | 3h | Réduire charge agent |
| C-A | Créer superviseur TESORO (agent_profile) | 15min | Escalation fonctionnelle |
| C-B | Fixer 3 paiements orphelins (migration) | 30min | Data integrity |
