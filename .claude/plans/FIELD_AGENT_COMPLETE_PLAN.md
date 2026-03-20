# Plan détaillé — Module Inspection Terrain + OMS Migration + Supervisor Dashboard

**Date** : 2026-03-20
**Prérequis analysé** : OMS backend (complet), frontend OMS agent (ABSENT), supervisor OMS (ABSENT)

---

## RAPPORT CRITIQUE — ÉTAT ACTUEL

### Gaps critiques découverts

| # | Gap | Sévérité | Impact |
|---|-----|----------|--------|
| **G1** | Frontend OMS agent = ZÉRO pages | **BLOQUANT** | Les 7 endpoints backend OMS n'ont aucune interface. Agents ne peuvent pas travailler. |
| **G2** | 4 rôles agent ministry sans permissions | **BLOQUANT** | agent_min_agricultura/electricidad/informacion/turismo = 0 permissions |
| **G3** | agent_oms_polyvalent manque process_obligations | **BLOQUANT** | Polyvalent ne peut pas accéder à la queue OMS |
| **G4** | Supervisor dashboard = zéro OMS | **MAJEUR** | Le supervisor voit SEULEMENT service_requests, PAS les licences/obligations |
| **G5** | license_compliance_events = 0 rows | **MAJEUR** | Aucun événement de compliance jamais loggé |
| **G6** | compliance_score jamais calculé | **MODÉRÉ** | Colonne existe mais jamais écrite |
| **G7** | Deux systèmes de queue parallèles | **DESIGN** | agent_work_queue (SR) vs OMS implicit queue (obligations) — jamais unifiés |

### Ce qui DOIT être fait AVANT les inspections terrain

L'inspection terrain repose sur l'OMS. Si l'OMS n'a pas de frontend et que les agents ne peuvent pas traiter les obligations, l'inspection est inutile. **Ordre obligatoire** :

```
Phase 0 : OMS Permissions Fix (30min)
Phase 1 : OMS Agent Frontend (4h) ← CRITIQUE, jamais fait
Phase 2 : Supervisor OMS Dashboard (3h)
Phase 3 : Inspection Terrain Backend (4h)
Phase 4 : Inspection Terrain Frontend (4h)
Phase 5 : Scellé + Mise en demeure (3h)
Phase 6 : Encaissement terrain (3h)
Phase 7 : Dashboard Superviseur Inspections (2h)
Phase 8 : Mobile optimization + offline (3h)
```

---

## PHASE 0 : OMS Permissions Fix (30min)

### Migration SQL

```sql
-- Fix: 4 ministry agent roles missing ALL OMS permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('agent_min_agricultura','agent_min_electricidad','agent_min_informacion','agent_min_turismo')
  AND p.name IN ('fiscal_service.process_obligations','fiscal_service.view_bundles','company.view','company.view_classification')
ON CONFLICT DO NOTHING;

-- Fix: agent_oms_polyvalent missing process_obligations + view_bundles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'agent_oms_polyvalent'
  AND p.name IN ('fiscal_service.process_obligations','fiscal_service.view_bundles')
ON CONFLICT DO NOTHING;

-- Fix: 4 ministry supervisor roles missing OMS permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('supervisor_min_agricultura','supervisor_min_electricidad','supervisor_min_informacion','supervisor_min_turismo')
  AND p.name IN ('fiscal_service.manage_bundles','fiscal_service.process_obligations','fiscal_service.view_bundles')
ON CONFLICT DO NOTHING;
```

### Checklist
- [ ] Exécuter migration permissions
- [ ] Vérifier : tous les agent_min_* ont 4+ permissions OMS
- [ ] Vérifier : agent_oms_polyvalent a process_obligations

---

## PHASE 1 : OMS Agent Frontend (4h)

**Objectif** : Donner aux agents OMS une interface pour traiter leur queue d'obligations.

### Pages à créer

```
/dashboard/agent/{entity}/oms/
├── page.tsx              — Queue OMS (obligations à traiter)
├── stats/page.tsx        — Stats agent OMS (completed today, montants)
└── [obligation_id]/
    └── page.tsx          — Détail obligation + actions (process/reject)
```

### Page Queue OMS (`page.tsx`)

| Section | Détail |
|---|---|
| **Header** | Titre + stats mini (pending count, completed today, total amount pending) |
| **Filtres** | fee_type, status, search (NIF/nom entreprise), date range |
| **Table** | Empresa, NIF, Fee Type, Montant, Due Date, Pénalité, Status, Actions |
| **Actions** | Process (✅), Reject (↩), View Detail (👁) |
| **Batch** | Sélection multiple + batch process |
| **Pagination** | Server-side 20/page |

### Backend wiring

L'API `/oms/queue` existe déjà. Frontend doit :
1. Appeler `GET /oms/queue?page=1&page_size=20`
2. Afficher les résultats dans un DataTable
3. `POST /oms/obligations/{id}/process` pour valider
4. `POST /oms/obligations/{id}/reject` pour rejeter

### API client à créer

```typescript
// packages/web/src/modules/oms/services/oms-api.ts
export const omsApi = {
  getQueue: (params) => apiClient.get('/oms/queue', { params }),
  getQueueStats: () => apiClient.get('/oms/queue/stats'),
  getObligation: (id) => apiClient.get(`/oms/obligations/${id}`),
  processObligation: (id, data) => apiClient.post(`/oms/obligations/${id}/process`, data),
  rejectObligation: (id, data) => apiClient.post(`/oms/obligations/${id}/reject`, data),
  batchProcess: (ids) => apiClient.post('/oms/obligations/batch-process', { obligation_ids: ids }),
}
```

---

## PHASE 2 : Supervisor OMS Dashboard (3h)

**Objectif** : Le superviseur voit l'état des licences, obligations, et performance agents OMS.

### Backend — Nouveau endpoint

```
GET /api/v1/licenses/supervisor/dashboard
```

Retourne :
- Licences par statut (open/partial/complete/overdue) pour l'entité du superviseur
- Obligations par statut (pending/processing/paid/overdue)
- Top 10 entreprises avec dette
- Performance agents OMS (completed/rejected par agent cette semaine)
- Tendance mensuelle (obligations payées vs overdue)
- Compliance score moyen (à implémenter)

### Frontend — Nouvelles pages

```
/dashboard/supervisor/oms/
├── page.tsx              — Dashboard OMS superviseur
├── licenses/page.tsx     — Liste licences de l'entité
├── agents/page.tsx       — Performance agents OMS
└── overdue/page.tsx      — Obligations en retard (à escalader)
```

### Dashboard layout (desktop + responsive)

| Widget | Contenu |
|---|---|
| 4 KPI cards | Licences actives, Obligations pending, Taux recouvrement, Montant overdue |
| Donut | Obligations par statut |
| Bar chart | Performance agents (obligations traitées par agent) |
| Table | Top 10 entreprises en retard (NIF, nom, montant dû, jours retard) |
| Timeline | Événements récents (paiements reçus, scellés, etc.) |

---

## PHASE 3 : Inspection Terrain Backend (4h)

### Migration BD

Table `field_inspections` (comme défini dans FIELD_AGENT_MOBILE_ANALYSIS.md) + permissions + index + notifications templates.

### Endpoints

```
POST   /api/v1/inspections/                     — Créer inspection
GET    /api/v1/inspections/                     — Liste inspections (agent)
GET    /api/v1/inspections/{id}                 — Détail inspection
PUT    /api/v1/inspections/{id}                 — MAJ inspection (photos, notes)
POST   /api/v1/inspections/{id}/complete        — Compléter inspection (conforme)
POST   /api/v1/inspections/{id}/mise-en-demeure — Émettre mise en demeure
POST   /api/v1/inspections/{id}/seal            — Proposer scellé
POST   /api/v1/inspections/{id}/seal/approve    — Approuver scellé (supervisor)
POST   /api/v1/inspections/{id}/collect         — Encaisser paiement terrain
GET    /api/v1/inspections/stats                — Stats inspections agent
GET    /api/v1/inspections/reconcile            — Réconciliation cash
```

### Endpoint enrichi pour agents

```
GET /api/v1/verify/license/{ref}?t={hmac}&lid={uuid}&agent_mode=true
```

Quand `agent_mode=true` + agent authentifié → retourne :
- Tout ce que retourne le mode public
- PLUS : obligations détaillées par entité agent (filtrées)
- PLUS : historique paiements
- PLUS : inspections précédentes
- PLUS : mise en demeure en cours

---

## PHASE 4 : Inspection Terrain Frontend (4h)

### Pages (desktop + mobile responsive)

```
/dashboard/agent/{entity}/field/
├── page.tsx                    — Dashboard terrain (inspections du jour)
├── scan/page.tsx               — Scanner QR + saisie manuelle
├── inspect/[id]/page.tsx       — Formulaire inspection
└── reports/page.tsx            — Historique inspections
```

### Page Scan (`scan/page.tsx`)

**Mobile** :
- Caméra QR plein écran (html5-qrcode)
- Bouton "Saisir manuellement" → champ texte NIF/Reg
- Résultat : card entreprise + obligations filtrées entité

**Desktop** :
- Split view : QR scanner à gauche, saisie texte à droite
- Résultat en dessous avec tableau obligations

### Page Inspection (`inspect/[id]/page.tsx`)

**Formulaire** :
1. **Infos entreprise** (readonly) : nom, NIF, activité déclarée, zone
2. **Conformité activité** : radio (conforme/non conforme) + champ "activité constatée"
3. **État paiement** (readonly) : tableau obligations avec statuts
4. **Photos** : upload min 1 photo façade (Firebase Storage)
5. **GPS** : capture auto au chargement (navigator.geolocation)
6. **Notes** : textarea libre
7. **Actions** :
   - ✅ Valider (si tout conforme + payé)
   - ⚠️ Mise en demeure (si impayé, première visite)
   - 💰 Encaisser (si impayé, propriétaire veut payer)
   - 🔒 Sceller (si impayé après mise en demeure)

---

## PHASE 5 : Scellé + Mise en demeure (3h)

### Mise en demeure
- L'agent émet un avertissement formel
- Délai : 72h par défaut (configurable par entité)
- Notification email + SMS au propriétaire
- PDF mise en demeure généré avec QR
- Après 72h : l'agent peut revenir et sceller si toujours impayé

### Scellé
- L'agent propose → `status: pending_supervisor`
- Le superviseur approuve → `status: sealed`
- Notification proprio + MAJ `companies.is_active = false`
- MAJ `commercial_licenses.status = 'suspended'`
- PDF PV de scellé généré
- **Auto-approve** : si le superviseur ne répond pas sous 24h, auto-validé (configurable)

### Levée de scellé
- Le propriétaire paie toutes les obligations + pénalités
- L'agent constate le paiement
- Le superviseur approuve la levée
- `companies.is_active = true`, `commercial_licenses.status = 'open'`

---

## PHASE 6 : Encaissement terrain (3h)

### Flow cash

```
Agent sélectionne obligations à encaisser
→ Montant calculé automatiquement
→ Agent clique "Encaisser cash"
→ Backend crée service_payment (type: field_cash, status: pending_agent_review)
→ Reçu PDF généré avec numéro séquentiel + QR
→ Agent remet le reçu au propriétaire
→ L'encaissement apparaît dans la réconciliation du trésor
→ Treasury agent confirme la réception du cash
```

### Flow mobile money

```
Agent initie le paiement mobile
→ Backend crée la transaction BANGE
→ Propriétaire reçoit la demande sur son téléphone
→ Propriétaire valide sur son app BANGE
→ Webhook confirme → obligation auto-payée
→ Agent voit le statut mis à jour en temps réel
```

### Réconciliation quotidienne

Page `/dashboard/agent/{entity}/field/reconcile` :
- Liste des encaissements cash de la journée
- Total à reverser au trésor
- Bouton "Reverser" → crée un batch de reversement
- SLA : alerte si non-reversé sous 48h

---

## PHASE 7 : Dashboard Superviseur Inspections (2h)

### Nouvelles pages superviseur

```
/dashboard/supervisor/inspections/
├── page.tsx              — Dashboard inspections (stats, carte, alertes)
├── pending-seals/        — Scellés en attente d'approbation
├── agents/page.tsx       — Performance agents terrain
└── reports/page.tsx      — Rapports consolidés
```

### Widgets dashboard

| Widget | Contenu |
|---|---|
| Stats cards | Inspections aujourd'hui, conformes, non-conformes, scellés |
| Carte | Points GPS des inspections du jour (si connecté) |
| Alertes | Scellés pending > 12h, cash non-reversé > 48h, mises en demeure expirées |
| Performance | Inspections par agent (bar chart), taux conformité |
| Table | Dernières inspections avec filtre rapide |

---

## PHASE 8 : Mobile optimization + offline (3h)

### PWA Configuration
- `manifest.json` pour installation sur écran d'accueil
- Service Worker pour cache static assets
- Barre de statut réseau (online/offline indicator)

### Offline Queue
- Inspections créées offline stockées en IndexedDB
- Sync automatique quand réseau revient
- Indicateur "N inspections en attente de sync"
- Photos compressées avant upload (<500KB)

### Touch UX
- Bottom sheet pour les actions (valider/sceller/encaisser)
- Boutons 44px minimum (WCAG touch target)
- Pull-to-refresh sur les listes
- Haptic feedback sur les actions critiques (scellé)

---

## CALENDRIER PROPOSÉ

| Session | Phases | Effort | Livrable |
|---|---|---|---|
| **Session 3** | Phase 0 + Phase 1 | 4.5h | OMS Agent frontend fonctionnel |
| **Session 4** | Phase 2 + Phase 3 | 7h | Supervisor OMS + Inspection backend |
| **Session 5** | Phase 4 + Phase 5 | 7h | Inspection frontend + Scellé |
| **Session 6** | Phase 6 + Phase 7 | 5h | Encaissement + Dashboard superviseur |
| **Session 7** | Phase 8 | 3h | Mobile + offline |

**Total : 5 sessions, ~26h de développement**

---

## RISQUES ET MITIGATIONS

| Risque | Impact | Mitigation |
|---|---|---|
| html5-qrcode incompatible avec certains navigateurs mobiles GE | Scan impossible | Fallback saisie manuelle toujours disponible |
| GPS imprécis en zone rurale | Vérification localisation faussée | Accepter précision > 100m mais flaguer dans le rapport |
| Offline sync conflict (2 agents inspectent la même entreprise offline) | Doublon d'inspection | Constraint unique (agent, license, date) + résolution au sync |
| Cash non-reversé par agent | Perte financière | SLA strict + notifications superviseur + audit trail |
| Scellé abusif | Risque juridique | Mise en demeure obligatoire + validation superviseur |
