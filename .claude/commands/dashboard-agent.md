# Agent Dashboard Feature Command

Create a new feature for the Agent (Fiscal Officer) Dashboard following TaxasGE patterns.

## Context

**Agent Dashboard** is for service request officers to:
- Review pending service_request (validation queue)
- Validate or reject service request/declarations
- Request additional documents from citizens
- Assign/escalate service request/declarations to supervisors
- Track their workload and performance metrics
- Communicate with citizens

## Instructions

1. **Read DATABASE_SCHEMA_REFERENCE.md** for data structure
2. **Check existing agent components** in `packages/web/src/modules/agent/`
3. **Implement real-time updates** for queue changes (optional: polling or WebSocket)
4. **Follow workflow states**: pending → under_review → validated/rejected → completed

## Requirements

### Backend
- Create API endpoint in `packages/backend/app/api/v1/agents.py`
- Add `@require_role("agent")` decorator
- Implement **assignment logic** (auto-assign or manual)
- Add **workload balancing** (track agent capacity)
- Include **audit trail** for all actions

### Frontend
- Create page in `packages/web/src/app/(dashboard)/agent/{feature}/page.tsx`
- Implement **kanban board** or **list view** for queue
- Add **quick actions** (validate, reject, request docs)
- Show **declaration timeline** and history
- Display **citizen information** and contact details

### Key Features
```typescript
// Agent-specific features
1. Declaration Queue
   - Filter by status, type, priority
   - Sort by date, amount, urgency
   - Bulk actions support

2. Service requests Review
   - View all documents
   - See calculation details
   - Access citizen history
   - Add notes and comments

3. Actions
   - Validate (with optional notes)
   - Reject (with required reason)
   - Request documents (specify what's needed)
   - Escalate to supervisor
   - Contact citizen

4. Performance Metrics
   - service request/Declarations processed today/week/month
   - Average processing time
   - Validation rate
   - Pending queue size
```

## UI/UX Guidelines

- Use **status badges** for service request/declaration states (pending, under_review, etc.)
- Show **priority indicators** (urgent, normal, low)
- Display **countdown timers** for SLA deadlines
- Add **quick filters** in sidebar
- Implement **keyboard shortcuts** for common actions
- Use **drawer/modal** for service request/declaration details
- Show **citizen risk score** (if available)

## Workflow Example

```typescript
// Declaration validation workflow
1. Agent selects pending service request/declaration from queue
2. System marks it as "under_review" and assigns to agent
3. Agent reviews:
   - Documents uploaded
   - Calculation accuracy
   - Compliance with regulations
4. Agent takes action:
   - ✅ Validate → Move to "validated" → Generate receipt
   - ❌ Reject → Require reason → Notify citizen
   - 📄 Request docs → Specify missing items → Return to "pending"
   - ⬆️ Escalate → Notify supervisor → Transfer ownership
```

## Checklist

- [ ] Backend API endpoints created
- [ ] Agent permission check added
- [ ] Assignment logic implemented
- [ ] Frontend queue view created
- [ ] Service request/Declaration detail view implemented
- [ ] Quick actions (validate/reject/request) added
- [ ] Audit trail logging added
- [ ] Real-time updates implemented (optional)
- [ ] Performance metrics dashboard created
- [ ] Notifications for new assignments
- [ ] SLA deadline indicators added
- [ ] Tests written (unit + E2E)
- [ ] Mobile responsive design verified
