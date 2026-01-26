# Plan Phase 5: Dashboard Config + Gestion des Rendez-vous

**Date**: 2026-01-26
**Version**: 2.0
**Statut**: En attente d'approbation

---

## 1. Tableau des Rôles et Dashboard Config

### 1.1 Configuration Proposée

| Rôle | Widgets | Justification |
|------|---------|---------------|
| **agent_cnedoge_pasaporte** | `urgent_requests`, `calendar_slots`, `today_appointments`, `workflow_distribution`, `personal_stats`, `alerts` | Gestion passeports avec RDV obligatoires |
| **agent_cnedoge_residencia** | `urgent_requests`, `calendar_slots`, `today_appointments`, `workflow_distribution`, `personal_stats`, `alerts` | Gestion résidences avec RDV |
| **agent_dgt** | `urgent_requests`, `calendar_slots`, `today_appointments`, `workflow_distribution`, `personal_stats`, `alerts` | Permis conduire avec RDV, véhicules sans RDV |
| **agent_onrc** | `urgent_requests`, `workflow_distribution`, `personal_stats`, `alerts` | Contrats - pas de RDV requis |
| **agent_ofive** | `urgent_requests`, `workflow_distribution`, `personal_stats`, `alerts` | Véhicules - pas de RDV requis |
| **agent_tesoro** | `pending_payments`, `anomaly_summary`, `personal_stats`, `workflow_distribution`, `alerts` | Validation paiements treasury |
| **supervisor_tesoro** | `team_workload`, `escalations`, `pending_payments`, `anomaly_summary`, `alerts` | Supervision équipe trésorerie |

### 1.2 Widgets Disponibles (10 implémentés)

| Widget ID | Description | Utilisé par |
|-----------|-------------|-------------|
| `urgent_requests` | Demandes urgentes/prioritaires | Tous agents |
| `today_appointments` | RDV du jour | Agents avec RDV |
| `calendar_week` | Calendrier RDV réservés (hebdo) | Agents avec RDV |
| `calendar_slots` | **NOUVEAU** - Créneaux disponibles | Agents avec RDV |
| `workflow_distribution` | Répartition par workflow | Tous agents |
| `personal_stats` | Stats personnelles | Tous agents |
| `alerts` | Alertes système | Tous |
| `pending_payments` | Paiements en attente | Treasury |
| `anomaly_summary` | Anomalies paiements | Treasury |
| `team_workload` | Charge équipe | Superviseurs |
| `escalations` | Escalations | Superviseurs |

### 1.3 Données Slot Config Actuelles

```
CNEDOGE_PASAPORTE: Lun-Ven 08:00-16:00, 30min, max=1/slot
DGT:               Lun-Ven 08:00-16:00, 30min, max=1/slot
```

**Règle de capacité**:
- Priorité 1: `appointment_slot_configs.max_appointments_per_slot` (configuré)
- Priorité 2: Défaut = 2 si non configuré

---

## 2. Architecture Page Rendez-vous (3 onglets)

### 2.1 Structure Page Unique

```
/dashboard/agent/{entity}/appointments/page.tsx
├── [Tab: Aujourd'hui]     → Liste des RDV du jour avec actions
├── [Tab: Planifier]       → Calendrier créneaux + formulaire réservation
└── [Tab: Calendrier]      → Vue hebdomadaire des RDV existants
```

### 2.2 Composants (selon FRONTEND_CRUD_PATTERNS_REFERENCE.md)

```
modules/agent-dashboard/
├── components/appointments/
│   ├── AppointmentsPage.tsx          # Page principale avec Tabs
│   ├── TodayTab.tsx                  # Onglet Aujourd'hui
│   ├── ScheduleTab.tsx               # Onglet Planifier
│   ├── CalendarTab.tsx               # Onglet Calendrier
│   ├── LocationSelector.tsx          # Sélecteur localisation
│   ├── WeekSlotGrid.tsx              # Grille créneaux hebdo
│   ├── SlotCell.tsx                  # Cellule créneau cliquable
│   ├── AppointmentCard.tsx           # Card RDV existant
│   ├── AppointmentPreviewSheet.tsx   # Sheet aperçu RDV (pas Dialog)
│   └── BookingForm.tsx               # Formulaire inline réservation
├── hooks/
│   └── useAppointments.ts            # Hooks CRUD appointments
└── services/
    └── appointmentService.ts         # API calls
```

### 2.3 Interactions UX

| Action | Comportement |
|--------|--------------|
| Clic créneau disponible | Inline form dans la cellule ou zone latérale |
| Clic RDV existant | Sheet latéral avec aperçu + actions (modifier/annuler) |
| Modifier RDV | Navigation vers onglet Planifier avec pré-sélection |
| Annuler RDV | AlertDialog de confirmation |
| Réservation réussie | Toast + refresh grille |

---

## 3. Phases d'Implémentation

### Phase 5.1: Migration SQL Dashboard Config

**Fichier**: `migrations/075_dashboard_config_per_role.sql`

```sql
-- ═══════════════════════════════════════════════════════════════
-- Migration 075: Configure dashboard_config pour tous les rôles
-- ═══════════════════════════════════════════════════════════════

-- 1. AGENT CNEDOGE PASAPORTE (avec rendez-vous)
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
    {"id": "calendar_slots", "visible": true, "position": 2, "size": "large"},
    {"id": "today_appointments", "visible": true, "position": 3, "size": "medium"},
    {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
    {"id": "personal_stats", "visible": true, "position": 5, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 6, "size": "small"}
  ]
}'::jsonb
WHERE code = 'agent_cnedoge_pasaporte';

-- 2. AGENT CNEDOGE RESIDENCIA (avec rendez-vous)
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
    {"id": "calendar_slots", "visible": true, "position": 2, "size": "large"},
    {"id": "today_appointments", "visible": true, "position": 3, "size": "medium"},
    {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
    {"id": "personal_stats", "visible": true, "position": 5, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 6, "size": "small"}
  ]
}'::jsonb
WHERE code = 'agent_cnedoge_residencia';

-- 3. AGENT DGT (avec rendez-vous pour permis)
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
    {"id": "calendar_slots", "visible": true, "position": 2, "size": "large"},
    {"id": "today_appointments", "visible": true, "position": 3, "size": "medium"},
    {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
    {"id": "personal_stats", "visible": true, "position": 5, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 6, "size": "small"}
  ]
}'::jsonb
WHERE code = 'agent_dgt';

-- 4. AGENT ONRC (sans rendez-vous)
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
    {"id": "workflow_distribution", "visible": true, "position": 2, "size": "medium"},
    {"id": "personal_stats", "visible": true, "position": 3, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 4, "size": "small"}
  ]
}'::jsonb
WHERE code = 'agent_onrc';

-- 5. AGENT OFIVE (sans rendez-vous)
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
    {"id": "workflow_distribution", "visible": true, "position": 2, "size": "medium"},
    {"id": "personal_stats", "visible": true, "position": 3, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 4, "size": "small"}
  ]
}'::jsonb
WHERE code = 'agent_ofive';

-- 6. AGENT TESORO (mise à jour avec nouveaux widgets)
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "pending_payments", "visible": true, "position": 1, "size": "medium"},
    {"id": "anomaly_summary", "visible": true, "position": 2, "size": "medium"},
    {"id": "personal_stats", "visible": true, "position": 3, "size": "medium"},
    {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 5, "size": "small"}
  ]
}'::jsonb
WHERE code = 'agent_tesoro';

-- 7. SUPERVISOR TESORO
UPDATE roles SET dashboard_config = '{
  "version": "1.0",
  "layout": "grid",
  "widgets": [
    {"id": "team_workload", "visible": true, "position": 1, "size": "large"},
    {"id": "escalations", "visible": true, "position": 2, "size": "medium"},
    {"id": "pending_payments", "visible": true, "position": 3, "size": "medium"},
    {"id": "anomaly_summary", "visible": true, "position": 4, "size": "medium"},
    {"id": "alerts", "visible": true, "position": 5, "size": "small"}
  ]
}'::jsonb
WHERE code = 'supervisor_tesoro';
```

### Phase 5.2: CalendarSlotsWidget

**Backend**: Nouvel endpoint

```python
@router.get("/dashboard/widgets/calendar-slots")
async def get_calendar_slots_widget(
    entity_code: str,
    week_offset: int = 0,
    location_id: Optional[UUID] = None
) -> CalendarSlotsWidgetResponse:
    """
    Résumé créneaux disponibles par jour pour widget dashboard.
    Règle capacité: slot_config.max_appointments_per_slot OU défaut 2.
    """
```

**Frontend**: Widget avec grille 7 jours + indicateurs couleur

### Phase 5.3: Page Rendez-vous (3 onglets) - COMPLETED

**Backend**: Endpoints implémentés (/agent/service-requests/)

| Endpoint | Description | Status |
|----------|-------------|--------|
| `GET /appointments/today-list` | Liste RDV du jour | ✅ |
| `GET /appointments/slots-detailed` | Créneaux détaillés par location/semaine | ✅ |
| `POST /appointments/book-for-citizen` | Agent réserve pour citoyen | ✅ |
| `PATCH /appointments/{id}/reschedule` | Modifier RDV existant | ✅ |
| `GET /appointments/{id}` | Détails RDV | ✅ |

**Frontend**: Page avec Tabs (Shadcn)

```tsx
<Tabs defaultValue="today">
  <TabsList>
    <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
    <TabsTrigger value="schedule">Planifier</TabsTrigger>
    <TabsTrigger value="calendar">Calendrier</TabsTrigger>
  </TabsList>
  <TabsContent value="today"><TodayTab /></TabsContent>
  <TabsContent value="schedule"><ScheduleTab /></TabsContent>
  <TabsContent value="calendar"><CalendarTab /></TabsContent>
</Tabs>
```

### Phase 5.4: Menu Rendez-vous

**Migration**: `076_menu_appointments_agents.sql`

```sql
-- Ajouter menu Rendez-vous pour agents avec RDV
UPDATE roles SET menu_config = jsonb_set(
  COALESCE(menu_config, '{"menus": []}'::jsonb),
  '{menus}',
  (COALESCE(menu_config->'menus', '[]'::jsonb) || '[{
    "id": "appointments",
    "icon": "Calendar",
    "href": "/dashboard/agent/{entity}/appointments",
    "titleKey": "agent.nav.appointments"
  }]'::jsonb)
)
WHERE code IN ('agent_cnedoge_pasaporte', 'agent_cnedoge_residencia', 'agent_dgt');
```

### Phase 5.5: Notification sur réservation agent

**Vérification**: Les événements sont déjà implémentés:
- `EventType.APPOINTMENT_BOOKED` → déclenché dans `appointment_routes.py:336`
- Email + SMS + Push configurés

**Action requise**: S'assurer que le nouvel endpoint `book-for-citizen` émet aussi `APPOINTMENT_BOOKED`.

---

## 4. Fichiers à Créer/Modifier

### Backend

| Fichier | Action |
|---------|--------|
| `migrations/075_dashboard_config_per_role.sql` | Créer |
| `migrations/076_menu_appointments_agents.sql` | Créer |
| `agent_routes.py` | Modifier - ajouter 3 endpoints |

### Frontend

| Fichier | Action |
|---------|--------|
| `widgets/CalendarSlotsWidget.tsx` | Créer |
| `widgets/WidgetRegistry.tsx` | Modifier |
| `hooks/useWidgetData.ts` | Modifier |
| `appointments/page.tsx` | Créer |
| `components/appointments/*.tsx` | Créer (8 fichiers) |
| `hooks/useAppointments.ts` | Créer |
| `services/appointmentService.ts` | Créer |

### Traductions

| Fichier | Clés à ajouter |
|---------|----------------|
| `es.json` | `agent.nav.appointments`, `agent.appointments.*` |
| `fr.json` | Idem |
| `en.json` | Idem |

---

## 5. Tests

| Test | Description |
|------|-------------|
| CalendarSlotsWidget | Rendu grille, couleurs, navigation semaine |
| Page Appointments | Navigation tabs, affichage RDV |
| Planification | Sélection créneau, formulaire, validation capacité |
| Modification RDV | Sheet aperçu, modification, confirmation |
| Notification | Vérifier email/SMS envoyé après réservation agent |

---

## 6. Récapitulatif

| Phase | Livrables | Complexité |
|-------|-----------|------------|
| 5.1 | Migration dashboard_config | Faible |
| 5.2 | CalendarSlotsWidget | Moyenne |
| 5.3 | Page Appointments (3 tabs) | Haute |
| 5.4 | Menu Rendez-vous | Faible |
| 5.5 | Notification agent booking | Faible |

---

**Prêt pour approbation et implémentation.**
