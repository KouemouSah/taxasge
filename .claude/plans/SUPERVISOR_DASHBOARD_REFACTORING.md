# PLAN : Refactoring Dashboard Superviseur — Scope par Entité

## Contexte

Le dashboard superviseur (`/supervisor/page.tsx`) est construit autour du module **treasury** avec des endpoints admin hardcodés pour TESORO. Les superviseurs non-TESORO n'ont pas de dashboard adapté.

**Objectif** : Chaque catégorie de superviseur doit avoir un dashboard adapté à son métier.

## CRITIQUE : 3 catégories de superviseurs (PAS un seul type)

| Catégorie | Rôles | Métier | Dashboard cible |
|---|---|---|---|
| **Treasury** | supervisor_tesoro | Validation paiements globaux | Dashboard treasury EXISTANT (inchangé) |
| **OMS** | supervisor_camara, supervisor_ayuntamiento, supervisor_min_* (8 rôles) | Gestion obligations/licences commerciales | NOUVEAU dashboard OMS superviseur |
| **Service Requests** | supervisor_cnedoge_*, supervisor_dgt, supervisor_extranjeria, supervisor_itv, supervisor_minfp, supervisor_ofive, supervisor_onrc, supervisor_policia (9 rôles) | Supervision demandes de services (passeports, résidences, permis) | Dashboard agent générique EXISTANT (GenericEntityDashboard) |

### Routing conditionnel corrigé

```
/supervisor →
  entity_type === 'treasury' (TESORO)     → dashboard treasury (inchangé)
  entity has workflow_codes OMS           → /supervisor/entity-dashboard (NOUVEAU)
  entity has workflow_codes service_req   → /agent/{entitySlug} (GenericEntityDashboard EXISTANT)
```

### RISQUE identifié et évité
Les superviseurs Service Requests (CNEDOGE, DGT, etc.) ne doivent PAS être redirigés vers un dashboard OMS — ils n'ont pas d'obligations/licences. Leurs endpoints sont les mêmes que ceux des agents de leur entité via le GenericEntityDashboard.

---

## Diagnostic — 5 problèmes

| # | Problème | Impact |
|---|----------|--------|
| D1 | `/supervisor/page.tsx` appelle 2 endpoints treasury admin (`/admin/.../treasury/stats/dashboard` et `supervisor-overview`) | CAMARA/AYUNTAMIENTO → 403 |
| D2 | `/supervisor/team/workload` utilise `useWorkloadDashboard` du module treasury → 403 | Workload inaccessible pour non-TESORO |
| D3 | Le sidebar DashboardSidebar est hardcodé, pas de menu superviseur | Superviseurs naviguent uniquement par URL |
| D4 | Pas de page dashboard complète pour superviseurs OMS (stats + queue + team + compliance en 1 vue) | Vue fragmentée |
| D5 | `ap.availability` bug SQL dans `get_team_performance` | 500 sur OMS team performance |

---

## Architecture cible

### Routing conditionnel

```
/supervisor →
  if entity_code === 'TESORO' → dashboard treasury (inchangé)
  else → /supervisor/entity-dashboard (NOUVEAU)
```

### Pages à créer

| Page | Widgets | Endpoints OMS scoped |
|------|---------|---------------------|
| `/supervisor/entity-dashboard` | Stats + Queue + Team + Compliance | Voir ci-dessous |

### Endpoints OMS déjà scoped (AUCUN changement backend)

| Widget | Endpoint | Scope auto |
|--------|----------|-----------|
| Stats obligations | `GET /licenses/stats?fiscal_year=` | city_id + fee_type + ministry_id via AgentScope |
| Queue stats | `GET /oms/queue/stats` | entity + city_id via OmsAgentService |
| Team performance | `GET /oms/team/performance` | entity + fee_type + city_id |
| Compliance summary | `GET /licenses/compliance-summary?fiscal_year=` | city_id + fee_type via AgentScope |
| Workload (déjà scoped) | `GET /agent/service-requests/dashboard/widgets/team-workload?entity_code=X` | entity_code via v_agents_workload_dashboard |

### Endpoint à ajouter (optionnel, pour les graphiques)

| Widget | Endpoint actuel (treasury) | Alternative scoped |
|--------|---------------------------|-------------------|
| CashFlow chart | `/admin/.../treasury/stats/supervisor-overview` | Créer `GET /oms/supervisor/payment-flow` OU réutiliser compliance-summary |
| Agent workload | idem | `GET /agent/service-requests/dashboard/widgets/team-workload?entity_code=X` (existe) |
| SLA alerts | idem | Créer `GET /oms/supervisor/sla-alerts` OU calculer côté frontend depuis queue stats |

---

## Plan d'implémentation — 4 Phases

### Phase 1 : Fix immédiat `ap.availability` + workload (D5, D2) — FAIT

- [x] D5 : `ap.availability` → `aw.availability` via LEFT JOIN agent_workloads
- [ ] D2 : `/supervisor/team/workload` — changer pour utiliser `GET /agent/service-requests/dashboard/widgets/team-workload?entity_code=X` au lieu de l'endpoint treasury admin

**Fichiers :**
- `packages/web/src/app/[locale]/(dashboard)/dashboard/supervisor/team/workload/page.tsx` — remplacer `useWorkloadDashboard` par appel scoped

### Phase 2 : Créer `/supervisor/entity-dashboard` (D1, D4)

**Objectif** : page dashboard complète pour CAMARA/AYUNTAMIENTO/MIN_* avec 5 widgets.

**Layout** (identique au treasury) :
```
Row 1: 6 StatCells (licences, obligations, team, queue)
Row 2: Quick action buttons
Row 3: Compliance chart (2/3) + Queue distribution (1/3)
Row 4: Team workload + Recent activity
```

**Fichiers à créer :**
- `packages/web/src/app/[locale]/(dashboard)/dashboard/supervisor/entity-dashboard/page.tsx`
- Ou modifier `/supervisor/page.tsx` avec un switch sur entity_code

**API calls :**
```typescript
// Tous scoped automatiquement par le JWT de l'agent
const [licenseStats, queueStats, teamPerf, compliance] = await Promise.all([
  omsLicensesApi.getStats(currentYear),
  omsQueueApi.getStats(),
  omsQueueApi.getTeamPerformance({ period_days: 30 }),
  omsLicensesApi.getComplianceSummary(currentYear),
])
```

**Checklist :**
- [ ] 2.1 Créer page `/supervisor/entity-dashboard/page.tsx`
- [ ] 2.2 Row 1 : StatCells depuis licenseStats + queueStats
- [ ] 2.3 Row 2 : Quick actions (Équipe, Licences, Inspections, Escalades)
- [ ] 2.4 Row 3 : Compliance chart réutilisé depuis `/agent/oms/compliance`
- [ ] 2.5 Row 4 : Team workload scoped + recent activity
- [ ] 2.6 Modifier redirect dans `/supervisor/page.tsx` : non-TESORO → `/supervisor/entity-dashboard`

### Phase 3 : Menu sidebar superviseur (D3)

**Objectif** : les superviseurs voient un menu dédié dans le sidebar.

**Options :**
- A) Modifier `DashboardSidebar.tsx` pour détecter le rôle superviseur et afficher un menu dédié
- B) Utiliser le menu dynamique `GenericAgentSidebar` déjà existant pour les agents (piloté par menu_config)

**Recommandation** : Option B — le `GenericAgentSidebar` est déjà entity-aware et utilise le menu_config de la BD. Les superviseurs ont déjà un `menu_config` dans leur rôle.

**Checklist :**
- [ ] 3.1 Vérifier que les rôles superviseurs OMS ont un `menu_config` dans la BD
- [ ] 3.2 Si non, créer les menu_config pour supervisor_camara, supervisor_ayuntamiento
- [ ] 3.3 Modifier le layout dashboard pour utiliser GenericAgentSidebar quand user est superviseur

### Phase 4 : Tests et validation

- [ ] 4.1 supervisor_tesoro : dashboard treasury inchangé
- [ ] 4.2 supervisor_camara : dashboard entity avec données CAMARA uniquement
- [ ] 4.3 supervisor_ayuntamiento : dashboard entity avec données AYUNTAMIENTO uniquement
- [ ] 4.4 supervisor_min_* : redirect vers OMS team (pas de obligations propres)
- [ ] 4.5 Workload page accessible pour tous les superviseurs
- [ ] 4.6 Aucune donnée cross-entité visible

---

## Fichiers critiques

| Fichier | Rôle | Action |
|---------|------|--------|
| `supervisor/page.tsx` | Dashboard principal | Modifier redirect |
| `supervisor/entity-dashboard/page.tsx` | NOUVEAU — Dashboard OMS scoped | Créer |
| `supervisor/team/workload/page.tsx` | Workload page | Changer hook treasury → OMS scoped |
| `supervisor/oms/page.tsx` | Redirect OMS | Pointer vers entity-dashboard |
| `supervisor/oms/[...slug]/page.tsx` | Catch-all | Pointer vers entity-dashboard |
| `components/layout/DashboardSidebar.tsx` | Menu sidebar | Ajouter condition superviseur |
| `modules/oms/services/api.ts` | API OMS | Aucun changement (déjà scoped) |
| `license_repository.py` | Team performance SQL | FAIT — fix ap.availability |

---

## Estimation

| Phase | Complexité | Lignes | Dépendances |
|-------|-----------|--------|------------|
| Phase 1 | Simple | ~20 lignes | Aucune |
| Phase 2 | Moyenne | ~200 lignes | Phase 1 |
| Phase 3 | Moyenne | ~50 lignes | Phase 2 |
| Phase 4 | Tests | 0 lignes | Phase 3 |
| **Total** | | **~270 lignes** | |
