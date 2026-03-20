# Session 4 — Supervisor OMS Dashboard + Inspection Backend

**Prérequis** : Session 3 (OMS Agent Frontend fonctionnel)
**Durée estimée** : 6-7h

---

## Phase 2 : Supervisor OMS Dashboard (3h)

### 2.1 Backend — Endpoint supervisor OMS

**Fichier** : `packages/backend/app/modules/fiscal_services/api/license_routes.py`

```
GET /api/v1/licenses/supervisor/dashboard
```

Retourne (filtré par entité du superviseur) :
- `licenses_by_status`: {open, partial, complete, overdue, suspended}
- `obligations_by_status`: {pending, processing, paid, overdue, completed}
- `total_debt`: somme obligations impayées
- `recovery_rate`: montant payé / montant total (%)
- `top_debtors`: top 10 entreprises + montant dû
- `agent_performance`: par agent → {completed_count, rejected_count, avg_processing_time}
- `monthly_trend`: obligations payées par mois (12 mois)

### 2.2 Frontend — Pages superviseur OMS

```
/dashboard/supervisor/oms/
├── page.tsx              — Dashboard KPIs + charts
├── licenses/page.tsx     — Liste licences entité
├── agents/page.tsx       — Performance agents OMS
└── overdue/page.tsx      — Obligations overdue (action: escalader)
```

### 2.3 Dashboard layout

| Widget | Type | Données |
|---|---|---|
| 4 KPI cards | Stat | Licences actives, Obligations pending, Taux recouvrement, Montant overdue |
| Donut régime | Chart | Obligations par statut (pending/processing/paid/overdue) |
| Bar agents | Chart | Obligations traitées par agent cette semaine |
| Table debtors | Table | Top 10 entreprises en retard + actions |
| Sparkline trend | Chart | Tendance mensuelle paiements |

### Checklist Phase 2
- [ ] Backend endpoint supervisor/dashboard
- [ ] Frontend 4 pages superviseur OMS
- [ ] Charts : donut + bar + sparkline
- [ ] Table debtors avec pagination
- [ ] Responsive desktop + mobile
- [ ] Menu superviseur : ajouter "OMS" dans sidebar

---

## Phase 3 : Inspection Backend (4h)

### 3.1 Migration BD

**Fichier** : `packages/backend/database/migrations/226_field_inspections.sql`

- Table `field_inspections` (30+ colonnes — cf. FIELD_AGENT_MOBILE_ANALYSIS.md)
- Enum `seal_reason_enum` (8 motifs)
- 9 permissions inspection (create, view_own, view_entity, seal_propose, seal_approve, collect_payment, mise_en_demeure, view_reports, export)
- Assignation permissions aux rôles agent_* et supervisor_*
- Index (agent, company, license, entity, unique daily)
- 4 templates notifications (INSPECTION_COMPLETED, SEAL_PROPOSED, SEAL_APPROVED, MISE_EN_DEMEURE)

### 3.2 Module backend

```
packages/backend/app/modules/inspections/
├── __init__.py
├── api/
│   ├── __init__.py
│   └── inspection_routes.py      — 11 endpoints
├── models/
│   ├── __init__.py
│   └── inspection.py             — Pydantic models (create, response, list)
├── repositories/
│   ├── __init__.py
│   └── inspection_repository.py  — Data access (CRUD + stats + reconcile)
├── services/
│   ├── __init__.py
│   ├── inspection_service.py     — Logique métier
│   ├── seal_service.py           — Workflow scellé (propose → approve)
│   └── field_pdf_service.py      — Rapport PDF inspection + PV scellé
└── templates/
    ├── inspection_report.html    — PDF rapport inspection
    └── seal_report.html          — PDF PV scellé
```

### 3.3 Endpoints

| Method | Path | Permission | Description |
|---|---|---|---|
| POST | `/inspections/` | inspection.create | Créer inspection |
| GET | `/inspections/` | inspection.view_own | Mes inspections |
| GET | `/inspections/{id}` | inspection.view_own | Détail inspection |
| PUT | `/inspections/{id}` | inspection.create | MAJ (photos, notes) |
| POST | `/inspections/{id}/complete` | inspection.create | Compléter (conforme) |
| POST | `/inspections/{id}/mise-en-demeure` | inspection.mise_en_demeure | Émettre MED |
| POST | `/inspections/{id}/seal` | inspection.seal_propose | Proposer scellé |
| POST | `/inspections/{id}/seal/approve` | inspection.seal_approve | Approuver scellé |
| POST | `/inspections/{id}/collect` | inspection.collect_payment | Encaisser terrain |
| GET | `/inspections/stats` | inspection.view_own | Stats agent |
| GET | `/inspections/reconcile` | inspection.collect_payment | Réconciliation cash |

### 3.4 Endpoint enrichi verification agent

```
GET /api/v1/verify/license/{ref}?t={hmac}&lid={uuid}&agent_mode=true
Authorization: Bearer {jwt}
```

Retourne (en plus du mode public) :
- `obligations`: liste complète filtrée par entité agent
- `payment_history`: derniers paiements
- `previous_inspections`: inspections précédentes
- `active_mise_en_demeure`: mise en demeure en cours (si existe)
- `seal_history`: scellés précédents

### Checklist Phase 3
- [ ] Migration exécutée
- [ ] Module inspections créé (routes, models, repo, service)
- [ ] 11 endpoints fonctionnels
- [ ] Endpoint verify enrichi (agent_mode=true)
- [ ] Templates notifications créés en BD
- [ ] EventBus wiring (INSPECTION_COMPLETED, SEAL_PROPOSED, SEAL_APPROVED, MISE_EN_DEMEURE)
- [ ] PDF templates (inspection_report + seal_report)
- [ ] Python syntax OK
- [ ] Push + CI green
