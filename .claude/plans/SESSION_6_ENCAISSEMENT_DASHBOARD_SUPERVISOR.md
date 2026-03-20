# Session 6 — Encaissement Terrain + Dashboard Superviseur Inspections

**Prérequis** : Session 5 (Frontend inspection + scellé fonctionnel)
**Durée estimée** : 5h

---

## Phase 6 : Encaissement terrain (3h)

### 6.1 Flow cash (1.5h)

**Backend** : `POST /inspections/{id}/collect`

```json
{
  "obligations": ["uuid1", "uuid2"],
  "method": "cash",
  "amount": 70000,
  "notes": "Paiement en espèces sur place"
}
```

**Logique** :
1. Vérifie que l'inspection existe et appartient à l'agent
2. Vérifie que les obligations sont dans un statut encaissable (pending/overdue)
3. Crée `service_payment` avec :
   - `payment_method: 'cash'`
   - `workflow_status: 'pending_agent_review'`
   - `collected_by: agent_id`
   - `collected_at: NOW()`
   - `collection_type: 'field'` (nouveau champ)
4. Génère reçu PDF numéroté (SEQUENCE advisory lock — même pattern que receipt_service)
5. Lie le reçu à l'inspection (`payment_receipt_number`)
6. EventBus → `PAYMENT_MANUAL_PENDING` (entre dans le flow trésorerie existant)
7. Retourne le reçu PDF pour download/impression

**Migration** : Ajouter à `service_payments` :
```sql
ALTER TABLE service_payments ADD COLUMN IF NOT EXISTS collection_type VARCHAR(20);
-- 'office' (default), 'field', 'online'
ALTER TABLE service_payments ADD COLUMN IF NOT EXISTS collected_by UUID REFERENCES users(id);
ALTER TABLE service_payments ADD COLUMN IF NOT EXISTS field_inspection_id UUID REFERENCES field_inspections(id);
```

### 6.2 Flow mobile money (1h)

**Backend** : `POST /inspections/{id}/collect`

```json
{
  "obligations": ["uuid1", "uuid2"],
  "method": "mobile_money",
  "amount": 70000,
  "phone_number": "+240222123456"
}
```

**Logique** :
1. Crée la transaction BANGE via `BangeProcessor`
2. Retourne `redirect_url` ou `ussd_code` pour le paiement
3. Webhook BANGE confirme → auto-update obligations
4. L'agent voit le statut en temps réel (polling ou WebSocket)

### 6.3 Réconciliation cash (30min)

**Page** : `/dashboard/agent/{entity}/field/reconcile`

**Layout** :
```
┌────────────────────────────────────────────┐
│ Réconciliation — 19/03/2026               │
├────────────────────────────────────────────┤
│ Cash collecté aujourd'hui : 350,000 XAF   │
│ Reversé au trésor : 0 XAF                 │
│ Restant : 350,000 XAF  ⚠️                │
├────────────────────────────────────────────┤
│ # │ Heure │ Empresa       │ Montant │ Reçu│
│ 1 │ 09:15 │ Tienda Sol    │  70,000 │ R-01│
│ 2 │ 10:30 │ Bar Tropical  │ 120,000 │ R-02│
│ 3 │ 14:00 │ Ferreteria    │ 160,000 │ R-03│
├────────────────────────────────────────────┤
│ [Confirmer reversement au Trésor]          │
└────────────────────────────────────────────┘
```

**SLA** : Si cash non-reversé après 48h → alerte superviseur automatique.

---

## Phase 7 : Dashboard Superviseur Inspections (2h)

### 7.1 Backend endpoint

```
GET /api/v1/inspections/supervisor/dashboard
```

Retourne (filtré par entité) :
- `today`: {total, conforme, non_conforme, seals_proposed, seals_approved, payments_collected}
- `week`: mêmes stats sur 7 jours
- `pending_seals`: liste des scellés en attente d'approbation
- `overdue_med`: mises en demeure expirées (action requise)
- `agent_performance`: par agent → {inspections, conformity_rate, avg_duration}
- `unreconciledCash`: montant cash non-reversé par agent
- `recent_inspections`: 10 dernières (timeline)

### 7.2 Frontend pages

```
/dashboard/supervisor/inspections/
├── page.tsx              — Dashboard (KPIs, alertes, timeline)
├── pending-seals/page.tsx — Scellés à approuver
├── agents/page.tsx       — Performance agents terrain
└── reports/page.tsx      — Rapports exportables
```

### 7.3 Dashboard layout

```
┌──────┬──────┬──────┬──────┬──────┐
│Today │Conf. │Non-C │Scell.│Cash  │  KPI cards
│  12  │  8   │  3   │  1   │ 250K │
└──────┴──────┴──────┴──────┴──────┘

┌────────────────┬─────────────────┐
│ 🚨 ALERTES     │ 📊 PERFORMANCE │
│                │                 │
│ 2 scellés      │ Agent 1: 8 insp│
│   en attente   │ Agent 2: 4 insp│
│                │ Agent 3: 6 insp│
│ 1 cash > 48h   │                │
│   non-reversé  │ Taux conf: 75% │
│                │                 │
│ 3 MED expirées │ Avg: 15min/insp│
└────────────────┴─────────────────┘

┌─────────────────────────────────┐
│ TIMELINE RÉCENTE                │
│ 14:30 — Agent X scellé Bar ABC │
│ 14:15 — Agent Y conforme Tienda│
│ 13:00 — Agent X cash 120K XAF  │
│ 11:30 — Agent Z MED Ferreteria │
└─────────────────────────────────┘
```

### 7.4 Page approbation scellés

- Liste des scellés `pending_supervisor`
- Pour chaque scellé : photos agent, GPS, motif, entreprise, obligations
- Boutons : Approuver / Rejeter (avec notes)
- Auto-approve countdown (24h restantes affiché)

---

## Validation Session 6

- [ ] Encaissement cash → reçu PDF numéroté + QR
- [ ] Encaissement mobile money → redirect BANGE
- [ ] Réconciliation : liste cash du jour + total
- [ ] Dashboard superviseur : 5 widgets
- [ ] Page pending seals : approve/reject fonctionne
- [ ] SLA alerts : cash > 48h, MED expirée
- [ ] Responsive desktop + mobile
- [ ] ESLint 0 erreurs, TypeScript 0 erreurs
- [ ] Push + CI green
