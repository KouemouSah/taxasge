# Session OMS — Pages Agent/Supervisor Obligations & Licences

## Contexte

Le backend OMS est **complet** (2 routers, 15+ endpoints). Les pages frontend **n'existent pas**.
Les menus pointaient vers des URLs mortes — corrigé en supprimant les liens, mais les pages doivent être créées.

## Backend existant (ne pas toucher)

### `/api/v1/oms/` (oms_agent_routes.py)
| Endpoint | Method | Permission | Description |
|----------|--------|-----------|-------------|
| `/queue` | GET | `fiscal_service.process_obligations` | Queue obligations agent (filtré par ministry_id) |
| `/queue/stats` | GET | `fiscal_service.process_obligations` | Stats queue (pending, processing, completed) |
| `/obligations/batch-process` | POST | `fiscal_service.process_obligations` | Batch process obligations |
| `/obligations/{id}` | GET | `fiscal_service.process_obligations` | Détail obligation |
| `/obligations/{id}/process` | POST | `fiscal_service.process_obligations` | Traiter une obligation |
| `/obligations/{id}/reject` | POST | `fiscal_service.process_obligations` | Rejeter une obligation |
| `/obligations/{id}/events` | GET | `fiscal_service.process_obligations` | Historique événements |

### `/api/v1/licenses/` (license_routes.py)
| Endpoint | Method | Permission | Description |
|----------|--------|-----------|-------------|
| `/` | GET | `fiscal_service.view_bundles` | Liste licences (filter: company_id, bundle_id, year, status) |
| `/stats` | GET | `fiscal_service.view_bundles` | Stats licences |
| `/{id}` | GET | `fiscal_service.view_bundles` | Détail licence |
| `/{id}/obligations` | GET | `fiscal_service.view_bundles` | Obligations d'une licence |
| `/{id}/obligations/summary` | GET | `fiscal_service.view_bundles` | Résumé obligations |
| `/{id}/events` | GET | `fiscal_service.view_bundles` | Événements compliance |
| `/{id}/download-pdf` | GET | `fiscal_service.view_bundles` | PDF licence |
| `/{id}/renew` | POST | `fiscal_service.manage_bundles` | Renouveler licence |
| `/{id}/check-previous-year` | POST | `fiscal_service.view_bundles` | Vérifier année N-1 |
| `/cron/flag-overdue` | POST | `fiscal_service.manage_bundles` | Cron: flaguer obligations en retard |
| `/cron/apply-penalties` | POST | `fiscal_service.manage_bundles` | Cron: appliquer pénalités |

## Pages existantes (déjà implémentées — réutiliser)

### Dashboards enrichis (Session 5)
| Page | Path | Données OMS utilisées |
|------|------|----------------------|
| Site Dashboard | `/supervisor/companies/dashboard` | Zone stats + analytics (top_debtors, by_city, monthly_trend) |
| Ministry Dashboard | `/supervisor/companies/ministry-dashboard` | Ministry stats (zone × fee_type × paid/overdue) |
| Company Debt | `/agent/companies/debt` | Company debt detail (obligations, donut, timeline) |
| Company Lookup | `/agent/companies/lookup` | Company search (NIF, name) |

### Admin pages (existantes, admin-only)
| Page | Path | Accès |
|------|------|-------|
| Admin Licenses | `/admin/licenses` | Admin uniquement |
| Admin Bundles | `/admin/service-bundles` | Admin uniquement |
| Admin Fiscal Services | `/admin/fiscal-services` | Admin uniquement |

## Rôles et permissions

### Actuellement assignées
| Rôle | view_bundles | process_obligations | manage_bundles |
|------|-------------|-------------------|---------------|
| agent_ayuntamiento | ✅ | ✅ | — |
| agent_camara | ✅ | ✅ | — |
| agent_min_comercio | ✅ | ✅ | — |
| agent_min_hacienda | ✅ | ✅ | — |
| agent_tesoro | ✅ | ✅ | — |
| agent_onrc | ✅ | ✅ | — |
| supervisor_* (6 ci-dessus) | ✅ | ✅ | ✅ |

### À ajouter (Phase 0)
| Rôle | view_bundles | process_obligations |
|------|-------------|-------------------|
| agent_min_agricultura | ✅ | ✅ |
| agent_min_electricidad | ✅ | ✅ |
| agent_min_informacion | ✅ | ✅ |
| agent_min_turismo | ✅ | ✅ |
| supervisor_min_agricultura | ✅ (+manage) | ✅ |
| supervisor_min_electricidad | ✅ (+manage) | ✅ |
| supervisor_min_informacion | ✅ (+manage) | ✅ |
| supervisor_min_turismo | ✅ (+manage) | ✅ |

## Données seed OMS en BD

| Ministère | Licences | Obligations | Montant total |
|-----------|----------|-------------|--------------|
| Comercio | 12 | 30 | 363K XAF |
| Hacienda | 10 | 10 | 375K XAF |
| Cámara | 10 | 10 | 230K XAF |
| Informacion | 6 | 6 | 92K XAF |
| Ayuntamiento | 3 | 3 | 542K XAF |
| Turismo | 1 | 1 | 90K XAF |

---

## Phases d'implémentation

### Phase 0 : Prérequis (permissions + menus) ✅
- [x] Migration 245: 8 permissions agent + 12 permissions supervisor ajoutées (4 rôles chacun)
- [x] Menus OMS ajoutés à 9 agents + 9 superviseurs (18 total)
- [x] Agent menu: Dashboard + Licenses (2 items)
- [x] Supervisor menu: Dashboard + Licenses + Compliance (3 items)
- [x] Traductions `oms.nav.*` (es/fr/en) ✅

### Phase 1 : Dashboard OMS Agent (`/dashboard/agent/oms`) ✅
- [x] 4 KPI cards: Pendientes, Completados hoy, Monto pendiente, Procesado hoy
- [x] Queue table: entreprise, fee_type, servicio, monto+penalty, vence, status, actions
- [x] Filtres: status dropdown + search debounce (company, fee_type, service)
- [x] Checkbox selection + batch process (Promise.all)
- [x] Actions: Process (CheckCircle) + Reject (XCircle avec prompt motivo)
- [x] Pagination + compteur total
- [x] Skeleton loading + empty state
- [x] Module OMS créé: types/index.ts + services/api.ts (omsQueueApi + omsLicensesApi)

### Phase 2 : Licences Overview (`/dashboard/agent/oms/licenses`) ✅
- [x] 4 KPI cards: total (active), vencidas, deuda XAF, recovery % (progress bar tricolore)
- [x] Table 9 colonnes: empresa, NIF, zona, año, total, pagado, balance, status (badge+icône), acciones
- [x] Badge status avec icône: open=Play, partial=Clock, overdue=AlertTriangle, complete=CheckCircle, cancelled=XCircle
- [x] Click row → détail licence (`/agent/oms/licenses/[id]`)
- [x] Download PDF par licence (`/licenses/{id}/download-pdf`)
- [x] Filtres: status dropdown + search debounce (empresa, NIF, zona)
- [x] Pagination + compteur total

### Phase 3 : Détail Licence (`/dashboard/agent/oms/licenses/[id]`)
Vue détaillée d'une licence avec ses obligations.

- [ ] **Header** : entreprise, NIF, zone, bundle, fiscal_year
- [ ] **KPIs** : total_amount, amount_paid, balance, recovery %
  - Réutiliser GaugeRing SVG de Session 5
- [ ] **Donut** : paid/pending/overdue obligations (réutiliser pattern debt page)
- [ ] **Table obligations** :
  - Source: `GET /licenses/{id}/obligations`
  - Colonnes: fee_type, ministry, amount, penalty, due_date, status, paid_at
  - Actions: Process, Reject (si agent), View events
- [ ] **Timeline événements** :
  - Source: `GET /licenses/{id}/events`
  - Pattern vertical timeline
- [ ] **Actions** : Renouveler (`POST /licenses/{id}/renew`), Check N-1, Download PDF
- [ ] Print layout (réutiliser PrintHeader composant partagé)

### Phase 4 : Compliance / Suivi (`/dashboard/agent/oms/compliance`)
Vue compliance par fee_type — quelles entreprises sont en retard.

- [ ] **Groupé par fee_type** : pour chaque type de taxe du ministère
  - Compteur: paid / total obligations
  - Progress bar recovery
- [ ] **Liste entreprises en retard** par fee_type
  - Colonnes: empresa, montant dû, jours retard, penalty accumulée
- [ ] **Actions** : Envoyer relance (lié CommunicationService existant), marquer processed
- [ ] Lien vers détail licence

### Phase 5 : Dashboard Supervisor OMS (`/dashboard/supervisor/oms`)
Vue superviseur — toute l'activité OMS de son ministère.

- [ ] **KPIs enrichis** : total obligations, recovery %, pending, overdue, penalties total
  - Réutiliser pattern GaugeRing + Sparkline de Session 5
- [ ] **Graphes** :
  - Donut paid/pending/overdue (chart.js)
  - Bar chart par fee_type (montant paid vs overdue)
  - Recovery trend line (si données mensuelles disponibles)
- [ ] **Top 5 licences en retard** (par montant)
- [ ] **Agents activity** : qui a traité combien d'obligations today/week
  - Réutiliser pattern risk scoring (score, badge) de Session 5
- [ ] **Queue overview** : pending par agent
- [ ] Réutiliser l'analytics-engine (projections, risk scoring)

### Phase 6 : Stats OMS (`/dashboard/supervisor/oms/stats`)
Statistiques détaillées avec graphes.

- [ ] **Par zone** : obligations par zone commerce (bar chart)
- [ ] **Par fee_type** : répartition montants
- [ ] **Par agent** : performance (processed/day, avg time)
- [ ] **Tendance mensuelle** : obligations créées vs completed (line chart)
- [ ] **Export** : CSV des stats

### Phase 7 : Menus et Navigation
- [ ] Ajouter bloc menu `oms` aux agents concernés (8 agents)
- [ ] Ajouter bloc menu `oms` aux superviseurs concernés (9 superviseurs)
- [ ] Adapter le menu selon le rôle :
  - Agent: Dashboard + Queue + Licences
  - Supervisor: Dashboard + Queue + Licences + Compliance + Stats
  - Admin: lien vers /admin/licenses (existant)
- [ ] Le sous-menu `config` (/admin/fiscal-services) EXCLUSIVEMENT pour admin
- [ ] Vérifier permissions guard sur chaque page

## Composants réutilisables (déjà créés)

| Composant | Source | Usage OMS |
|-----------|--------|-----------|
| GaugeRing GeoJSON | Session 5 — Site Dashboard | KPI recovery % |
| Sparkline chart.js | Session 3 — Admin Companies | Trend mini |
| PrintHeader/PrintFooter | Shared component | PDF licence, impression |
| GEMapSVG | Session 5 — GeoJSON map | Carte par province (si pertinent) |
| analytics-engine.ts | Session 5 | Risk scoring, projections |
| CompanyCard pattern | Session 2 — Annuaire | Card entreprise compact |

## API Frontend à créer

```typescript
// packages/web/src/modules/oms/services/api.ts
export const omsApi = {
  // Queue
  getQueue(params: { status?, page?, page_size? }): Promise<AgentQueueResponse>
  getQueueStats(): Promise<AgentQueueStats>
  processObligation(id: string, data): Promise<ObligationResponse>
  rejectObligation(id: string, data): Promise<ObligationResponse>
  batchProcess(data): Promise<BatchProcessResponse>
  getObligationDetail(id: string): Promise<ObligationResponse>
  getObligationEvents(id: string): Promise<ComplianceEventListResponse>

  // Licenses
  listLicenses(params: { company_id?, status?, year? }): Promise<LicenseListResponse>
  getLicenseStats(year?): Promise<LicenseStats>
  getLicense(id: string): Promise<LicenseResponse>
  getLicenseObligations(id: string, params): Promise<ObligationListResponse>
  getLicenseSummary(id: string): Promise<ObligationSummary>
  getLicenseEvents(id: string): Promise<ComplianceEventListResponse>
  downloadPDF(id: string, lang?: string): Promise<Blob>
  renewLicense(id: string, data): Promise<LicenseResponse>
}
```

## Validation

- [ ] Chaque page testée avec le compte agent seed du ministère
- [ ] Permissions vérifiées : agent voit son ministère uniquement
- [ ] Supervisor voit tous les agents de son ministère
- [ ] Responsive mobile vérifié
- [ ] ESLint : 0 erreurs
- [ ] TypeScript : 0 erreurs
- [ ] Traductions complètes (es/fr/en) pour toutes les clés
- [ ] Aucun lien mort dans les menus
- [ ] Performance : < 300ms par page
