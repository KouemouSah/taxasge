# Declaration Workflow Command

Implement or enhance a declaration workflow following TaxasGE business rules.

## Context

**Declaration Workflow** is the core business process:
1. Citizen creates draft declaration
2. Citizen submits declaration (status: pending)
3. Agent reviews declaration (status: under_review)
4. Agent validates or rejects (status: validated/rejected)
5. If validated: Citizen makes payment
6. System confirms payment (status: completed)

## Workflow States

```
draft → pending → under_review → validated → payment_pending → completed
                               ↓
                           rejected → (citizen can resubmit)
```

## Instructions

1. **Read DATABASE_SCHEMA_REFERENCE.md** for `declarations` table schema
2. **Check existing implementation** in `packages/backend/app/api/v1/declarations.py`
3. **Understand state transitions** and business rules
4. **Implement state machine** pattern for transitions

## Backend Requirements

### Database Schema
```sql
-- Key fields in declarations table
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
fiscal_service_id UUID REFERENCES fiscal_services(id)
declaration_type VARCHAR(50)
status VARCHAR(20) -- draft, pending, under_review, validated, rejected, payment_pending, completed
amount DECIMAL(10,2)
created_at TIMESTAMP
submitted_at TIMESTAMP
validated_at TIMESTAMP
validated_by UUID REFERENCES users(id)
rejection_reason TEXT
```

### State Transitions
```python
# Valid state transitions (enforce in code)
VALID_TRANSITIONS = {
    "draft": ["pending"],
    "pending": ["under_review", "rejected"],
    "under_review": ["validated", "rejected", "pending"],  # pending if docs requested
    "validated": ["payment_pending"],
    "rejected": ["draft"],  # citizen can resubmit
    "payment_pending": ["completed"],
    "completed": []  # terminal state
}

# Example validation
def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in VALID_TRANSITIONS.get(from_status, [])
```

### Business Rules

1. **Draft → Pending (Submit)**
   - Required: all mandatory fields filled
   - Required: all required documents uploaded
   - Set: submitted_at timestamp
   - Action: notify agents (queue assignment)

2. **Pending → Under Review (Assign)**
   - Required: agent role
   - Set: assigned_to agent_id
   - Set: assignment_date
   - Action: send email to agent

3. **Under Review → Validated (Approve)**
   - Required: agent role
   - Required: assigned to this agent
   - Set: validated_at timestamp
   - Set: validated_by agent_id
   - Action: notify citizen, create payment invoice

4. **Under Review → Rejected (Reject)**
   - Required: agent role
   - Required: rejection_reason (mandatory)
   - Set: rejected_at timestamp
   - Set: rejected_by agent_id
   - Action: notify citizen with reason

5. **Under Review → Pending (Request Docs)**
   - Required: agent role
   - Required: specify missing documents
   - Action: notify citizen, unassign agent

6. **Validated → Payment Pending (Payment Link)**
   - Automatic transition after validation
   - Action: generate BANGE payment link

7. **Payment Pending → Completed (Webhook)**
   - Triggered by: BANGE webhook callback
   - Required: payment confirmation
   - Set: payment_confirmed_at
   - Action: generate official receipt, notify citizen

## Frontend Requirements

### Citizen View
```typescript
// Declaration status display
const statusConfig = {
  draft: {
    label: "Borrador",
    color: "gray",
    icon: FileEdit,
    action: "Completar y enviar"
  },
  pending: {
    label: "Pendiente de revisión",
    color: "yellow",
    icon: Clock,
    action: "Esperando asignación"
  },
  under_review: {
    label: "En revisión",
    color: "blue",
    icon: Eye,
    action: "Siendo revisado por un agente"
  },
  validated: {
    label: "Validada",
    color: "green",
    icon: CheckCircle,
    action: "Proceder al pago"
  },
  rejected: {
    label: "Rechazada",
    color: "red",
    icon: XCircle,
    action: "Ver razón y corregir"
  },
  payment_pending: {
    label: "Pago pendiente",
    color: "orange",
    icon: CreditCard,
    action: "Completar pago"
  },
  completed: {
    label: "Completada",
    color: "green",
    icon: CheckCircle2,
    action: "Descargar recibo"
  }
}
```

### Agent View
```typescript
// Agent actions based on status
const agentActions = {
  pending: ["assign_to_me"],
  under_review: [
    "validate",
    "reject",
    "request_documents",
    "escalate"
  ],
  validated: ["view_only"],
  rejected: ["view_only"],
  completed: ["view_only"]
}
```

## Notifications

### Email Notifications
- **On Submit**: Notify agents pool (new declaration in queue)
- **On Assign**: Notify assigned agent
- **On Validate**: Notify citizen (with payment link)
- **On Reject**: Notify citizen (with rejection reason)
- **On Request Docs**: Notify citizen (with document list)
- **On Payment**: Notify citizen (receipt ready)

### In-App Notifications
- Real-time updates on status changes
- Badge count on dashboard
- Toast notifications for actions

## Audit Trail

Log all state transitions:
```python
# audit_logs table
{
  "declaration_id": "uuid",
  "action": "status_change",
  "from_status": "pending",
  "to_status": "under_review",
  "performed_by": "agent_uuid",
  "timestamp": "2025-12-03T10:30:00Z",
  "metadata": {
    "reason": "...",
    "notes": "..."
  }
}
```

## Checklist

- [ ] Database schema reviewed
- [ ] State machine implemented
- [ ] All valid transitions handled
- [ ] Business rules enforced
- [ ] Permissions checked for each action
- [ ] Notifications sent on state changes
- [ ] Audit trail logging added
- [ ] Frontend status display implemented
- [ ] Agent action buttons added
- [ ] Citizen action buttons added
- [ ] Error handling for invalid transitions
- [ ] Tests for all workflows written
- [ ] SLA deadlines tracked (optional)
