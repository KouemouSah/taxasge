# Session 3 — Fix Permissions + OMS Agent Frontend

**Prérequis** : Session 1B complète (classification GE, pagination, sécurité)
**Durée estimée** : 4-5h
**Priorité** : BLOQUANT — Les agents OMS n'ont aucune interface

---

## Phase 0 : Fix permissions OMS (30min)

### 0.1 Migration SQL

```sql
-- Fix: 4 ministry agent roles missing ALL OMS permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('agent_min_agricultura','agent_min_electricidad','agent_min_informacion','agent_min_turismo')
  AND p.name IN ('fiscal_service.process_obligations','fiscal_service.view_bundles',
                  'company.view','company.view_classification')
ON CONFLICT DO NOTHING;

-- Fix: agent_oms_polyvalent missing critical permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'agent_oms_polyvalent'
  AND p.name IN ('fiscal_service.process_obligations','fiscal_service.view_bundles')
ON CONFLICT DO NOTHING;

-- Fix: 4 ministry supervisor roles missing OMS permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('supervisor_min_agricultura','supervisor_min_electricidad',
                 'supervisor_min_informacion','supervisor_min_turismo')
  AND p.name IN ('fiscal_service.manage_bundles','fiscal_service.process_obligations',
                  'fiscal_service.view_bundles')
ON CONFLICT DO NOTHING;
```

### Checklist
- [ ] Créer migration `225_fix_oms_permissions.sql`
- [ ] Exécuter sur la BD
- [ ] Vérifier : `SELECT r.code, COUNT(p.name) FROM role_permissions rp JOIN roles r ... WHERE r.code LIKE 'agent_min_%' GROUP BY r.code`
- [ ] Vérifier : agent_oms_polyvalent a process_obligations + view_bundles

---

## Phase 1 : OMS Agent Frontend (3.5h)

### 1.1 API Client (30min)

**Fichier** : `packages/web/src/modules/oms/services/oms-api.ts`

```typescript
export const omsApi = {
  getQueue: (params: { page?: number; page_size?: number; fee_type?: string; status?: string }) =>
    apiClient.get('/oms/queue', { params }),
  getQueueStats: () =>
    apiClient.get('/oms/queue/stats'),
  getObligation: (id: string) =>
    apiClient.get(`/oms/obligations/${id}`),
  processObligation: (id: string, data: { notes?: string }) =>
    apiClient.post(`/oms/obligations/${id}/process`, data),
  rejectObligation: (id: string, data: { reason: string }) =>
    apiClient.post(`/oms/obligations/${id}/reject`, data),
  batchProcess: (ids: string[], notes?: string) =>
    apiClient.post('/oms/obligations/batch-process', { obligation_ids: ids, notes }),
  getObligationEvents: (id: string) =>
    apiClient.get(`/oms/obligations/${id}/events`),
}
```

### 1.2 Types (15min)

**Fichier** : `packages/web/src/modules/oms/types/index.ts`

```typescript
export interface OmsObligation {
  id: string
  licenseId: string
  companyName: string
  companyNif: string
  feeType: string
  ministryName: string
  amount: number
  penaltyAmount: number
  dueDate: string
  status: string
  paidAt?: string
  fiscalYear: number
}

export interface OmsQueueResponse {
  items: OmsObligation[]
  total: number
  page: number
  pageSize: number
}

export interface OmsQueueStats {
  pending: number
  processing: number
  completedToday: number
  totalPendingAmount: number
  totalCompletedAmount: number
}
```

### 1.3 Page Queue OMS (1.5h)

**Fichier** : `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/[entity]/oms/page.tsx`

**Layout** :
```
┌─────────────────────────────────────────────────────┐
│ Queue OMS — [Entity Name]                           │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                        │
│ │ 25 │ │ 3  │ │ 12 │ │150K│  Stats mini cards      │
│ │Pend│ │Proc│ │Done│ │XAF │                         │
│ └────┘ └────┘ └────┘ └────┘                        │
├─────────────────────────────────────────────────────┤
│ [Search] [Fee Type ▼] [Status ▼] [Batch Process ▼] │
├─────────────────────────────────────────────────────┤
│ ☐ │ Empresa      │ Fee │ Montant │ Échéance │ Actn │
│ ☐ │ Tienda Sol   │ tes │ 50,000  │ 30/04   │ ✅↩ │
│ ☐ │ Bar Tropical │ mun │ 30,000  │ 30/04   │ ✅↩ │
│ ☐ │ Ferreteria   │ tes │ 80,000  │ 15/03   │ ✅↩ │
├─────────────────────────────────────────────────────┤
│ ◄ Page 1/3 ► │ 20 items/page │ Total: 60           │
└─────────────────────────────────────────────────────┘
```

**Features** :
- [x] Server-side pagination 20/page
- [x] Filtres : fee_type (tesoro/municipal/chamber), status (processing/pending)
- [x] Search debounce 400ms (NIF, nom entreprise)
- [x] Sélection multiple + batch process
- [x] Boutons Process (✅) et Reject (↩) par ligne
- [x] Dialog confirmation avant process/reject
- [x] Toast notifications succès/erreur
- [x] Responsive : table sur desktop, cards sur mobile

### 1.4 Page Détail Obligation (1h)

**Fichier** : `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/[entity]/oms/[id]/page.tsx`

**Layout** :
```
┌──────────────────────────────────────┐
│ ← Retour    Obligation #abc123      │
├──────────────────────────────────────┤
│ ENTREPRISE                           │
│ Tienda El Sol │ PE-8253 │ Autónomo  │
│ Zone A1 — Malabo                     │
├──────────────────────────────────────┤
│ OBLIGATION                           │
│ Fee: Tesoro │ Amount: 50,000 XAF    │
│ Pénalité: 5,000 XAF │ Due: 30/04   │
│ Status: processing                   │
├──────────────────────────────────────┤
│ HISTORIQUE                           │
│ • 15/03 — Créée (open_license)      │
│ • 01/04 — Payée (payment_completed) │
│ • 02/04 — Routée (agent_routing)    │
├──────────────────────────────────────┤
│ [✅ Valider]  [↩ Rejeter]           │
└──────────────────────────────────────┘
```

### 1.5 Menu dynamique (30min)

- [ ] Ajouter "OMS" dans le menu agent (workflow_menu_mapping ou menu_config)
- [ ] Icône : FileText ou Briefcase
- [ ] Route : `/dashboard/agent/{entity}/oms`
- [ ] Visible uniquement si permission `fiscal_service.process_obligations`

---

## Validation Session 3

- [ ] 6 rôles agents ont les permissions OMS (SELECT COUNT)
- [ ] Page queue charge les obligations (GET /oms/queue retourne 200)
- [ ] Process obligation fonctionne (POST /oms/obligations/{id}/process retourne 200)
- [ ] Reject obligation fonctionne
- [ ] Batch process fonctionne
- [ ] Pagination server-side 20/page
- [ ] Mobile responsive (cards sur mobile)
- [ ] ESLint 0 erreurs
- [ ] TypeScript 0 erreurs
- [ ] Python syntax OK
- [ ] Push + CI green
