# Supervisor Dashboard Feature Command

Create features for the Supervisor Dashboard to manage agent workload and escalations.

## Context

**Supervisor Dashboard** is for supervisors (SUPERVISOR role) who:
- **MUST be attached to a ministry** (ministry_id required)
- **MUST have matricule** (employee number)
- Manage teams of DGI agents
- Handle escalated declarations
- Monitor agent workload and performance
- Configure assignment rules
- Review agent performance metrics

## User Profile Requirements

```sql
-- Supervisor account constraints
users:
  - role = 'supervisor'
  - matricule VARCHAR(50) UNIQUE NOT NULL  ✅ REQUIRED

ministry_agents:
  - user_id UUID (supervisor)
  - ministry_id INTEGER NOT NULL            ✅ REQUIRED
  - UNIQUE(user_id, ministry_id)
```

**Creation Workflow:**
1. Admin creates user with role='supervisor'
2. System ENFORCES: matricule must be provided
3. System ENFORCES: must assign to ministry (INSERT into ministry_agents)
4. Validation fails if either is missing

## Existing Implementation

**Backend module exists:** `packages/backend/app/modules/assignment/`

**Key files:**
- `api/supervisor_routes.py` - Dashboard, team management, rules (supervisor_router)
- `models/agent_workload.py` - Workload metrics
- `models/assignment_rule.py` - Assignment rules
- `repositories/workload_repository.py` - Workload data access

## Instructions

### Step 1: Read Existing Implementation

```bash
# Main supervisor module
Read packages/backend/app/modules/assignment/api/supervisor_routes.py
Read packages/backend/app/modules/assignment/models/
Read .github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
```

### Step 2: Understand Workflows

**PHASE 4: VALIDATION FINALE** (from FISCAL_DECLARATIONS_ARCHITECTURE.md)
- Supervisors handle escalations from agents
- Manage high-priority declarations (>1M XAF)
- Resolve agent conflicts
- Override agent decisions when needed

### Step 3: Use Subagents for Complex Features

Launch 3 subagents in parallel for comprehensive development:

#### Subagent 1: Dashboard API Enhancement
```markdown
Task: Enhance supervisor dashboard API with real-time metrics

Read: packages/backend/app/modules/assignment/api/supervisor_routes.py
Implement:
1. GET /api/v1/supervisor/dashboard
   - Summary stats (pending escalations, team workload, SLA compliance)
   - Recent activity feed
   - Alerts (overdue escalations, overloaded agents)

2. GET /api/v1/supervisor/team
   - List all agents in supervisor's ministry
   - Workload metrics per agent
   - Performance stats (avg processing time, success rate)

3. Add real-time updates (polling or WebSocket)
4. Add caching (Redis) for dashboard stats

Return: Enhanced endpoints and performance notes
```

#### Subagent 2: Assignment Rules UI
```markdown
Task: Create UI for managing assignment rules

Read: packages/backend/app/modules/assignment/models/assignment_rule.py
Create components in packages/web/src/modules/supervisor/:
1. RuleList.tsx - List all rules with priority order
2. RuleEditor.tsx - Create/edit rules with conditions
3. RuleSimulator.tsx - Test rules before activating
4. RulePriorityDrag.tsx - Drag-and-drop priority ordering

Features:
- Condition builder (declaration type, amount, urgency, agent specialization)
- Preview matched declarations
- Activate/deactivate rules
- Rule effectiveness metrics

Return: Components created and UX decisions
```

#### Subagent 3: Escalation Management
```markdown
Task: Create escalation management system

Implement:
1. Backend:
   - POST /api/v1/supervisor/escalations/{id}/reassign
   - POST /api/v1/supervisor/escalations/{id}/resolve
   - GET /api/v1/supervisor/escalations (with filtering)

2. Frontend:
   - EscalationQueue.tsx (sorted by priority/age)
   - EscalationDetail.tsx (full declaration context)
   - ReassignDialog.tsx (select new agent with workload)

3. Workflows:
   - Agent → Supervisor escalation
   - Supervisor → Agent reassignment
   - Supervisor resolution (direct validation)

Return: Full escalation system implementation
```

## Key Features

### 1. Ministry-Scoped Management
- Supervisors only see agents/declarations from their ministry
- Filter queries by: `ministry_agents.ministry_id = supervisor.ministry_id`
- Cross-ministry escalations require special permission

### 2. Workload Balancing
- Auto-assign based on agent capacity
- Manual rebalancing tools
- Workload visualization (charts/heatmaps)

### 3. Assignment Rules Engine
- Priority-ordered rules (1-100)
- Conditions: type, amount, urgency, agent skills
- Actions: assign to specific agent, round-robin, load-balanced
- Rule effectiveness tracking

### 4. Performance Monitoring
- Agent KPIs: avg processing time, success rate, SLA compliance
- Team metrics: total workload, overdue count, escalation rate
- Historical trends and forecasting

## Checklist

- [ ] Read existing supervisor module
- [ ] Verify ministry constraint in database
- [ ] Understand workload calculation logic
- [ ] Create/enhance dashboard API
- [ ] Build assignment rules UI
- [ ] Implement escalation management
- [ ] Add real-time updates
- [ ] Test with multiple ministries
- [ ] Verify RBAC permissions
