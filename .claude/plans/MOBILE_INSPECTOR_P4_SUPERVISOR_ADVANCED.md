# P4 — Supervisor Advanced (Facil Inspector)

**Date**: 2026-04-01
**Status**: PLAN VALIDE — EN ATTENTE IMPLEMENTATION
**Pre-requis**: P1-P3 valides (build EAS OK, corrections Plan B terminees)
**Objectif**: Outils de supervision complets (seals, reconciliation, agents, analytics, missions)

---

## Etat des lieux — Ce qui existe deja

### Infrastructure prete (aucun travail requis)
| Element | Fichier | Status |
|---------|---------|--------|
| Types SupervisorDashboard | `inspection.types.ts` | Complet |
| Types PendingSealItem | `inspection.types.ts` | Complet |
| Types LiveStatusResponse/AgentLiveStatus | `inspection.types.ts` | Complet |
| Types ReconciliationItem | `inspections-api.ts` | Complet |
| Hook useSupervisorDashboard | `dashboard-hooks.ts` | Complet |
| Hook useLiveStatus (30s refresh) | `dashboard-hooks.ts` | Complet |
| Hook useApproveSeal | `inspections-hooks.ts` | Complet |
| API getReconciliation | `inspections-api.ts` | Existe, pas de hook |
| Endpoints supervisor (5) | `endpoints.ts` | Complet |
| Endpoints missions (9) | `endpoints.ts` | Complet |
| Endpoints analytics (6) | `endpoints.ts` | Complet |
| Endpoints export (3) | `endpoints.ts` | Complet |
| Endpoints filterPresets (4) | `endpoints.ts` | Complet |
| Dashboard supervisor view | `(tabs)/index.tsx` | Complet |
| LiveCounters component | `live-counters.tsx` | Complet |
| SupervisorAlerts component | `supervisor-alerts.tsx` | Complet |
| Seal review screen | `[id]/seal-review.tsx` | Complet |
| Supervisor layout | `supervisor/_layout.tsx` | Stack basique |
| i18n supervisor keys (3 langues) | `locales/*.json` | Partiel (a completer) |

### A creer dans P4
| Screen/Module | Priority | Backend |
|---------------|----------|---------|
| Pending Seals list | HAUTE | `GET /supervisor/dashboard` (pending_seals[]) |
| Cash Reconciliation | HAUTE | `GET/POST /reconcile/supervisor` |
| Agent Live Status detail | MOYENNE | `GET /supervisor/live-status` |
| Agent Performance | MOYENNE | `GET /analytics/agents` |
| Analytics (trends, zones) | MOYENNE | `GET /analytics/*` |
| Mission Planning | BASSE | `GET/POST /missions/*` |
| Export (CSV/PDF) | BASSE | `GET /export/*` |

---

## Architecture des ecrans

```
/(tabs)/index.tsx ← Dashboard (supervisor auto-detected)
    ↓ [Alert: Pending Seals]          ↓ [Alert: Cash]           ↓ [LiveCounters tap]
    /supervisor/pending-seals    /supervisor/reconciliation   /supervisor/agents
         ↓ [tap item]
    /inspection/[id]/seal-review  (deja existant)

/(tabs)/index.tsx
    ↓ [Navigation menu ou quick action]
    /supervisor/
         ├── index.tsx         ← Hub menu (remplace Coming Soon)
         ├── pending-seals.tsx ← Liste seals a approuver
         ├── reconciliation.tsx← Cash reconciliation
         ├── agents.tsx        ← Agent monitoring live
         ├── agent/[id].tsx    ← Agent performance detail
         ├── analytics.tsx     ← Trends, zones, comparisons
         ├── missions.tsx      ← Mission planning
         └── missions/[id].tsx ← Mission detail
```

---

## PHASE 4.1 — Screens critiques (Seals + Reconciliation)

### 4.1.1 — Supervisor Hub (remplacer Coming Soon)
**Fichier**: `app/supervisor/index.tsx`
**Design**: Grid de cartes avec badges numeriques (like Settings app)

```
┌─────────────────────────────────┐
│ Outils Superviseur              │
│                                 │
│ ┌──────────┐  ┌──────────┐     │
│ │ 🛡️  3    │  │ 💰  5    │     │
│ │ Precintos│  │ Efectivo │     │
│ │ Pendiente│  │ Pendiente│     │
│ └──────────┘  └──────────┘     │
│ ┌──────────┐  ┌──────────┐     │
│ │ 👥       │  │ 📊       │     │
│ │ Agentes  │  │ Analytics│     │
│ │ En linea │  │          │     │
│ └──────────┘  └──────────┘     │
│ ┌──────────┐  ┌──────────┐     │
│ │ 📋       │  │ 📤       │     │
│ │ Misiones │  │ Exportar │     │
│ └──────────┘  └──────────┘     │
└─────────────────────────────────┘
```

- [ ] Remplacer Coming Soon par grid de navigation
- [ ] Badges live (pending_seals.length, unreconciled_cash_count)
- [ ] Pull-to-refresh pour actualiser les badges
- [ ] Navigation vers chaque sous-ecran

### 4.1.2 — Pending Seals Screen
**Fichier**: `app/supervisor/pending-seals.tsx`
**Source data**: `useSupervisorDashboard().pending_seals[]`
**Design**: Flat list Android, cards avec urgence

```
┌─────────────────────────────────┐
│ ← Precintos Pendientes (3)      │
├─────────────────────────────────┤
│ ⚠️ Distribuidora del Litoral   │
│ GE12345 · Malabo · Zone C3      │
│ Motivo: Impago despues de MED   │
│ Agent: Juan Perez · hace 22h    │
│ 🔴 Urgente (>20h)              │
│ [Ver detalle →]                  │
├─────────────────────────────────┤
│ Empresa ABC Internacional       │
│ GE67890 · Bata · Zone B1        │
│ Motivo: Actividad no autorizada  │
│ Agent: Maria Lopez · hace 4h    │
│ [Ver detalle →]                  │
└─────────────────────────────────┘
```

- [ ] Flat list triee par anciennete (plus vieux = plus urgent)
- [ ] Badge urgence rouge si >20h sans decision
- [ ] Calcul heures depuis `seal_proposed_at`
- [ ] Affichage: company_name, NIF, seal_reason traduit, agent_name, temps ecoule
- [ ] Tap → navigation `/inspection/[id]/seal-review`
- [ ] Pull-to-refresh
- [ ] Empty state si aucun seal pending
- [ ] Snackbar retour apres approbation/rejet

### 4.1.3 — Cash Reconciliation Screen
**Fichier**: `app/supervisor/reconciliation.tsx`
**Hooks a creer**: `useReconciliationList()`, `useValidateReconciliation()`
**Design**: Liste + swipe-to-validate ou bouton

```
┌─────────────────────────────────┐
│ ← Reconciliation Efectivo       │
│ Total pendiente: 450,000 XAF    │
├─────────────────────────────────┤
│ Distribuidora del Litoral       │
│ Agent: Juan · 150,000 XAF       │
│ Efectivo · 30/03/2026 14:30     │
│ Recibo: REC-2026-001            │
│               [Validar ✓]       │
├─────────────────────────────────┤
│ Tienda El Sol                   │
│ Agent: Maria · 300,000 XAF      │
│ Mobile Money · 30/03/2026 16:45 │
│ Recibo: REC-2026-002            │
│               [Validar ✓]       │
└─────────────────────────────────┘
```

- [ ] Creer `useReconciliationList()` hook dans inspections-hooks.ts
- [ ] Creer `useValidateReconciliation()` mutation hook
- [ ] Header avec total montant + total count
- [ ] Flat list triee par date
- [ ] Chaque item: company, agent, amount, method, date, receipt
- [ ] Bouton "Validar" par item (pas swipe — action critique)
- [ ] Confirmation dialog avant validation
- [ ] Invalidation cache supervisor dashboard apres validation
- [ ] Pull-to-refresh
- [ ] Empty state "Tout est reconcilie"

### 4.1.4 — i18n Phase 4.1
- [ ] Ajouter cles `supervisor.hub.*`, `supervisor.seals.*`, `supervisor.reconciliation.*`
- [ ] 3 langues (es, fr, en)

### 4.1.5 — Tests Phase 4.1
- [ ] TypeScript zero erreurs
- [ ] Navigation dashboard → pending seals → seal review → retour
- [ ] Navigation dashboard → reconciliation → validate → retour
- [ ] Pull-to-refresh fonctionne sur les 3 ecrans
- [ ] Empty states affiches correctement

---

## PHASE 4.2 — Agent Monitoring

### 4.2.1 — Agent Live Status Screen
**Fichier**: `app/supervisor/agents.tsx`
**Source data**: `useLiveStatus()` (30s auto-refresh)
**Design**: Liste agents avec indicateurs live

```
┌─────────────────────────────────┐
│ ← Agentes (12)                  │
│ 🟢 5 activos  🟡 3 inactivos  🔴 4 │
├─────────────────────────────────┤
│ 🟢 Juan Perez            14:32 │
│    3 inspections · 150K XAF     │
│    📍 Inspeccion en curso       │
├─────────────────────────────────┤
│ 🟢 Maria Lopez           14:28 │
│    5 inspections · 280K XAF     │
├─────────────────────────────────┤
│ 🟡 Pedro Garcia      hace 25m  │
│    2 inspections · 80K XAF      │
├─────────────────────────────────┤
│ 🔴 Ana Martinez    desconectado │
│    0 inspections                │
└─────────────────────────────────┘
```

- [ ] Header: compteurs (active/idle/offline) depuis `counters`
- [ ] Flat list agents triee: active first, puis idle, puis offline
- [ ] Dot colore selon status (green/yellow/red)
- [ ] Affichage: name, inspections_today, cash_collected_today
- [ ] Si current_inspection_id: afficher "Inspeccion en curso"
- [ ] Temps ecoule depuis last_activity_at
- [ ] Tap → navigation `/supervisor/agent/[id]`
- [ ] Auto-refresh 30s (deja dans useLiveStatus)
- [ ] Indicateur "Derniere MAJ: il y a Xs"

### 4.2.2 — Agent Performance Detail
**Fichier**: `app/supervisor/agent/[id].tsx`
**Hook a creer**: `useAgentPerformance(agentId)`
**Endpoint**: `GET /inspections/analytics/agents/{agent_id}`

```
┌─────────────────────────────────┐
│ ← Juan Perez                    │
│ Agent Ayuntamiento · Malabo     │
├─────────────────────────────────┤
│ Ce mois                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│ │ 45 │ │82% │ │12M │ │ 35m│   │
│ │Insp│ │Conf│ │XAF │ │Moy │   │
│ └────┘ └────┘ └────┘ └────┘   │
├─────────────────────────────────┤
│ Historique                      │
│ Mars: 45 insp · 82% · 12M XAF  │
│ Fevr: 38 insp · 79% · 9M XAF   │
│ Janv: 42 insp · 85% · 11M XAF  │
├─────────────────────────────────┤
│ Actions recentes                │
│ Inspeccion #234 · Conforme      │
│ Inspeccion #233 · Precinto      │
└─────────────────────────────────┘
```

- [ ] Creer `useAgentPerformance(agentId)` hook
- [ ] Creer `modules/supervisor/services/supervisor-api.ts`
- [ ] Creer `modules/supervisor/services/supervisor-hooks.ts`
- [ ] KPIs cards: inspections, taux conformite, montant collecte, duree moyenne
- [ ] Historique mensuel (derniers 3 mois)
- [ ] Liste dernières inspections de cet agent

### 4.2.3 — Tests Phase 4.2
- [ ] TypeScript zero erreurs
- [ ] Agent list affiche statuts corrects
- [ ] Auto-refresh 30s visible
- [ ] Navigation vers detail agent fonctionne
- [ ] Retour dashboard correct

---

## PHASE 4.3 — Analytics & Export

### 4.3.1 — Analytics Dashboard Screen
**Fichier**: `app/supervisor/analytics.tsx`
**Hooks**: `useAnalyticsTrends()`, `useZoneAnalytics()`, `usePriorityZones()`
**Design**: Scrollable avec sections

- [ ] Creer hooks analytics (trends, zones, priority-zones, compare)
- [ ] Section "Tendances" : stats par jour/semaine/mois (texte, pas graphiques — eviter deps lourdes)
- [ ] Section "Zones" : zones triees par taux conformite
- [ ] Section "Zones Prioritaires" : top 5 zones a inspecter en priorite
- [ ] Filtre periode (cette semaine / ce mois / 3 mois)
- [ ] Chiffres clairs avec variation (↑ ou ↓ vs periode precedente)

### 4.3.2 — Export Functionality
**Integration dans analytics.tsx**

- [ ] Bouton "Exporter CSV" → telecharge via `Sharing.shareAsync()`
- [ ] Bouton "Exporter PDF" → telecharge + partage
- [ ] Utiliser `expo-file-system` pour sauvegarder temporairement
- [ ] Utiliser `expo-sharing` pour partager le fichier

### 4.3.3 — Tests Phase 4.3
- [ ] TypeScript zero erreurs
- [ ] Analytics affiche donnees (meme vides avec empty state)
- [ ] Export CSV telecharge et ouvre le partage
- [ ] Export PDF telecharge et ouvre le partage

---

## PHASE 4.4 — Mission Planning

### 4.4.1 — Missions List Screen
**Fichier**: `app/supervisor/missions.tsx`
**Hooks**: `useMissionList()`, `useCreateMission()`, `useSuggestZones()`

- [ ] Creer module `modules/missions/` (services, types, hooks)
- [ ] Liste des missions (actives, completees)
- [ ] FAB "+" pour creer une mission
- [ ] Chaque mission: date, zone, agents assignes, statut

### 4.4.2 — Mission Detail + Assignment
**Fichier**: `app/supervisor/missions/[id].tsx`

- [ ] Detail mission: date, zone, objectif, agents
- [ ] Bouton "Assigner agents" → bottom sheet avec liste agents disponibles
- [ ] Suggestions de zones (endpoint suggest-zones)
- [ ] Bouton "Completer mission" avec notes
- [ ] Retirer agent de la mission

### 4.4.3 — Tests Phase 4.4
- [ ] TypeScript zero erreurs
- [ ] CRUD missions fonctionne
- [ ] Assignment/deassignment agents
- [ ] Suggestions zones affichees

---

## PHASE 4.5 — Auto-critique & Validation finale

- [ ] Revue complete de tous les ecrans P4
- [ ] Verification i18n (aucune string hardcodee)
- [ ] Verification Zod validation sur formulaires (create mission, validate reconciliation)
- [ ] Verification securite: IDOR (supervisor ne voit que son entite)
- [ ] Verification performance: pas de re-render inutile, caches React Query
- [ ] TypeScript `npx tsc --noEmit` = 0 erreurs
- [ ] Build EAS preview → test sur device
- [ ] Mettre a jour plan avec checklist cochee

---

## Ordre d'execution recommande

| Phase | Effort | Priorite | Bloque par |
|-------|--------|----------|------------|
| 4.1 Seals + Reconciliation | 4h | CRITIQUE | Rien |
| 4.2 Agent Monitoring | 3h | HAUTE | Rien |
| 4.3 Analytics + Export | 3h | MOYENNE | Rien |
| 4.4 Mission Planning | 4h | BASSE | Rien |
| 4.5 Auto-critique | 1h | HAUTE | 4.1-4.4 |

**Total estime**: ~15h de travail

---

## Fichiers a creer (inventaire)

### Screens (7 nouveaux)
1. `app/supervisor/index.tsx` — Hub menu (REMPLACER existant)
2. `app/supervisor/pending-seals.tsx` — Seals list
3. `app/supervisor/reconciliation.tsx` — Cash reconciliation
4. `app/supervisor/agents.tsx` — Agent live monitoring
5. `app/supervisor/agent/[id].tsx` — Agent performance detail
6. `app/supervisor/analytics.tsx` — Analytics + export
7. `app/supervisor/missions.tsx` — Mission planning

### Modules (services + hooks)
8. `modules/supervisor/services/supervisor-api.ts` — API calls (analytics, reconciliation, missions)
9. `modules/supervisor/services/supervisor-hooks.ts` — React Query hooks
10. `modules/supervisor/types/supervisor.types.ts` — Types additionnels (si necessaire)
11. `modules/missions/services/missions-api.ts` — Mission CRUD
12. `modules/missions/services/missions-hooks.ts` — Mission hooks
13. `modules/missions/types/mission.types.ts` — Mission types

### Components (5 nouveaux)
14. `modules/supervisor/components/seal-card.tsx` — Carte seal pending
15. `modules/supervisor/components/reconciliation-item.tsx` — Item reconciliation
16. `modules/supervisor/components/agent-status-row.tsx` — Ligne agent live
17. `modules/supervisor/components/stat-card.tsx` — Carte KPI analytics
18. `modules/supervisor/components/hub-card.tsx` — Carte menu hub

### i18n (~40 nouvelles cles x 3 langues)
19. Mise a jour `es.json`, `fr.json`, `en.json`

**Total**: ~19 fichiers nouveaux + 3 fichiers i18n mis a jour
