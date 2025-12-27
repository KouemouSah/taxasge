# Declaration Escalation Workflow Command

Implement the escalation workflow for handling complex or problematic declarations.

## Context

**Escalation Workflow** allows agents to escalate declarations to supervisors when:
- **Complex Calculations** (agent unsure about tax calculations)
- **Missing Documents** (critical documents missing or invalid)
- **Unusual Amounts** (declaration amount significantly different from historical average)
- **Fraud Suspicion** (indicators of fraud or manipulation)
- **Policy Questions** (unclear tax regulation interpretation)
- **High-Value Declarations** (above threshold, e.g., >1M XAF)
- **Citizen Disputes** (citizen disagrees with agent's decision)

## Workflow Architecture

### Escalation States
```
[Assigned] → [Under Review (Agent)]
                    ↓
            [Escalated to Supervisor]
                    ↓
     ┌──────────────┴──────────────┐
     ↓                             ↓
[Supervisor Reviews]        [Reassign to Specialist]
     ↓                             ↓
[Supervisor Decides]        [Specialist Reviews]
     ↓                             ↓
[Resolved] ────────────────> [Returned to Agent]
```

### Escalation Lifecycle

**Step 1: Agent Escalates**
- Agent reviewing declaration
- Identifies issue requiring supervisor input
- Clicks "Escalate to Supervisor"
- Fills escalation form:
  - Reason (select from predefined list)
  - Description (detailed explanation)
  - Urgency (low/medium/high/urgent)
  - Suggested action (optional)

**Step 2: Supervisor Notified**
- Supervisor receives notification (email + in-app)
- Escalation appears in supervisor dashboard
- Priority sorted (urgent first, then by deadline)

**Step 3: Supervisor Reviews**
- Supervisor views escalation details:
  - Agent's reason and notes
  - Declaration data
  - Supporting documents
  - Historical context
- Supervisor options:
  - **Provide Guidance** → Return to agent with instructions
  - **Approve/Reject** → Make decision directly
  - **Reassign** → Assign to specialist agent
  - **Request More Info** → Ask agent for additional details

**Step 4: Resolution**
- If approved/rejected: Declaration moves to next phase
- If guidance provided: Agent completes validation with supervisor's instructions
- If reassigned: New agent takes over
- Escalation marked as "resolved"

**Step 5: Audit Trail**
- All escalation actions logged
- Track: who escalated, when, why, supervisor decision, resolution time

## Database Schema

```sql
escalations:
  - id UUID PRIMARY KEY
  - declaration_id UUID FK → tax_declarations.id
  - assignment_id UUID FK → assignment_history.id
  - escalated_by UUID FK → users.id (agent)
  - escalated_to UUID FK → users.id (supervisor)
  - escalated_at TIMESTAMP
  - reason VARCHAR(100) -- "complex_calculation", "fraud_suspicion", etc.
  - description TEXT -- Agent's detailed explanation
  - urgency VARCHAR(20) -- "low", "medium", "high", "urgent"
  - status VARCHAR(50) -- "pending", "under_review", "resolved", "returned"
  - resolved_by UUID FK → users.id
  - resolved_at TIMESTAMP
  - resolution_action VARCHAR(50) -- "approved", "rejected", "guidance_provided", "reassigned"
  - resolution_notes TEXT -- Supervisor's decision/guidance
  - response_time_hours DECIMAL(10,2) -- Auto-calculated

escalation_history:
  - id UUID PRIMARY KEY
  - escalation_id UUID FK → escalations.id
  - action VARCHAR(50) -- "escalated", "reviewed", "guidance_provided", "resolved"
  - performed_by UUID FK → users.id
  - performed_at TIMESTAMP
  - notes TEXT
```

## Escalation Reasons (Predefined)

### Technical Reasons
- `complex_calculation` - Complex tax calculation requiring expert review
- `unclear_regulation` - Unclear tax regulation interpretation
- `missing_documents` - Critical documents missing
- `invalid_documents` - Documents don't meet requirements
- `data_inconsistency` - Declaration data inconsistent with documents

### Risk Reasons
- `fraud_suspicion` - Suspected fraudulent declaration
- `unusual_amount` - Amount significantly different from historical average
- `high_value` - High-value declaration requiring supervisor approval
- `multiple_rejections` - Citizen re-submitted after multiple rejections
- `suspicious_pattern` - Unusual submission pattern

### Dispute Reasons
- `citizen_dispute` - Citizen disagrees with agent's assessment
- `prior_approval_conflict` - Conflicts with previously approved declaration
- `penalty_calculation` - Dispute over penalty amount

### Administrative Reasons
- `deadline_risk` - May miss SLA deadline, needs priority handling
- `policy_change` - Recent policy change, unclear application
- `other` - Other reason (requires detailed description)

## Instructions

### Step 1: Read Related Modules
```bash
Read packages/backend/app/modules/assignment/api/supervisor_routes.py
Read packages/backend/app/modules/declarations/
Read .github/docs-internal/FISCAL_DECLARATIONS_ARCHITECTURE.md
```

### Step 2: Use Subagents for Development

Launch 3 subagents in parallel:

#### Subagent 1: Escalation Backend API
```markdown
Task: Create escalation management API

Implement in packages/backend/app/modules/escalations/:

1. Create Module Structure:
   ```
   escalations/
   ├── __init__.py
   ├── api/
   │   └── escalation_routes.py
   ├── services/
   │   └── escalation_service.py
   ├── repositories/
   │   └── escalation_repository.py
   └── models/
       └── escalation.py
   ```

2. API Endpoints (api/escalation_routes.py):

   **Agent Endpoints:**
   - POST /api/v1/escalations
     - Create escalation
     - Require: agent assigned to declaration
     - Body: {declaration_id, assignment_id, reason, description, urgency, suggested_action}
     - Auto-set: escalated_by = current_user, escalated_to = supervisor
     - Update assignment: add escalation flag
     - Send notification to supervisor
     - Return: escalation_id

   **Supervisor Endpoints:**
   - GET /api/v1/escalations/queue
     - List pending escalations (status = "pending", "under_review")
     - Filter by: urgency, reason, agent, date range
     - Sort: urgency DESC, escalated_at ASC
     - Include: declaration summary, agent info, escalation details

   - GET /api/v1/escalations/{id}
     - Get escalation details
     - Include: full declaration data, documents, agent notes, history

   - POST /api/v1/escalations/{id}/start-review
     - Start reviewing escalation
     - Update: status = "under_review", reviewed_by = current_user
     - Prevent other supervisors from reviewing (lock)

   - POST /api/v1/escalations/{id}/provide-guidance
     - Provide guidance to agent
     - Body: {guidance_notes}
     - Update: status = "returned", resolution_action = "guidance_provided"
     - Notify agent
     - Return declaration to agent's queue

   - POST /api/v1/escalations/{id}/approve
     - Supervisor approves declaration directly
     - Body: {approval_notes}
     - Update declaration: status = "approved", validated_by = supervisor
     - Update escalation: status = "resolved", resolution_action = "approved"
     - Notify agent and citizen

   - POST /api/v1/escalations/{id}/reject
     - Supervisor rejects declaration directly
     - Body: {rejection_reason, rejection_notes}
     - Update declaration: status = "rejected"
     - Update escalation: status = "resolved", resolution_action = "rejected"
     - Notify agent and citizen

   - POST /api/v1/escalations/{id}/reassign
     - Reassign to specialist agent
     - Body: {new_agent_id, reassignment_notes}
     - Create new assignment
     - Update escalation: status = "resolved", resolution_action = "reassigned"
     - Notify old agent, new agent

   - POST /api/v1/escalations/{id}/request-info
     - Request more info from agent
     - Body: {questions}
     - Update: status = "returned"
     - Notify agent
     - Add to escalation history

   **Analytics Endpoints:**
   - GET /api/v1/escalations/stats
     - Total escalations (by period)
     - Avg response time
     - Escalation reasons breakdown
     - Resolution actions breakdown
     - Top escalating agents
     - Top resolving supervisors

3. Business Logic (services/escalation_service.py):
   - Auto-escalation rules (e.g., declarations >1M XAF)
   - SLA tracking (escalations must be resolved within 24 hours)
   - Notification management
   - Escalation routing (which supervisor to assign)

4. Permissions:
   - @require_permission("escalation.create") - Agents only
   - @require_permission("escalation.review") - Supervisors only
   - @require_permission("escalation.resolve") - Supervisors only

Return: Complete escalation API, service layer, permissions
```

#### Subagent 2: Auto-Escalation Rules Engine
```markdown
Task: Create automatic escalation rules for high-risk declarations

Implement in packages/backend/app/modules/escalations/:

1. Auto-Escalation Triggers (services/auto_escalation_service.py):
   ```python
   class AutoEscalationService:
       async def check_escalation_criteria(
           self,
           declaration_id: UUID
       ) -> Optional[EscalationTrigger]:
           # Check all auto-escalation rules
           # Return trigger if any rule matches

           # Rule 1: High-value declarations
           if declaration.amount > 1_000_000:  # 1M XAF
               return EscalationTrigger(
                   reason="high_value",
                   description=f"Declaration amount {declaration.amount} XAF exceeds threshold",
                   urgency="high",
                   auto_escalated=True
               )

           # Rule 2: Unusual amount (>3 standard deviations from company average)
           avg, std = await self.get_company_declaration_stats(declaration.company_id)
           z_score = (declaration.amount - avg) / std
           if abs(z_score) > 3:
               return EscalationTrigger(
                   reason="unusual_amount",
                   description=f"Amount {declaration.amount} is {z_score:.2f} std deviations from average {avg}",
                   urgency="medium"
               )

           # Rule 3: Multiple rejections (citizen re-submitted >3 times)
           rejection_count = await self.count_previous_rejections(declaration.company_id)
           if rejection_count >= 3:
               return EscalationTrigger(
                   reason="multiple_rejections",
                   description=f"Company has {rejection_count} prior rejections",
                   urgency="high"
               )

           # Rule 4: Missing critical documents
           required_docs = await self.get_required_documents(declaration.type)
           uploaded_docs = await self.get_uploaded_documents(declaration_id)
           missing = set(required_docs) - set(uploaded_docs)
           if missing:
               return EscalationTrigger(
                   reason="missing_documents",
                   description=f"Missing documents: {', '.join(missing)}",
                   urgency="medium"
               )

           # Rule 5: Fraud indicators (ML model prediction)
           fraud_score = await self.fraud_detection_model.predict(declaration)
           if fraud_score > 0.7:  # 70% fraud probability
               return EscalationTrigger(
                   reason="fraud_suspicion",
                   description=f"Fraud detection score: {fraud_score:.2%}",
                   urgency="urgent",
                   requires_immediate_review=True
               )

           return None  # No escalation needed
   ```

2. Integration with Assignment:
   - When declaration assigned to agent
   - Run auto-escalation check
   - If triggered: Create escalation automatically
   - Notify supervisor immediately

3. Rule Configuration UI (for admins):
   - Enable/disable rules
   - Adjust thresholds (e.g., high-value threshold)
   - Configure notification recipients
   - Set SLA deadlines per urgency level

Return: Auto-escalation engine, rule configuration
```

#### Subagent 3: Escalation UI Components
```markdown
Task: Create escalation UI for agents and supervisors

Create in packages/web/src/modules/escalations/:

1. Agent Components:
   - EscalateDeclarationButton.tsx (button in declaration review page)
   - EscalationForm.tsx (modal form to create escalation)
   - EscalationStatus.tsx (show escalation status badge)
   - SupervisorGuidance.tsx (display supervisor's guidance)

2. Supervisor Components:
   - EscalationQueue.tsx (list pending escalations)
   - EscalationDetail.tsx (full escalation review page)
   - EscalationActions.tsx (action buttons: approve, reject, guide, reassign)
   - EscalationHistory.tsx (timeline of escalation events)
   - EscalationStats.tsx (dashboard metrics)

3. Escalate Declaration Flow (Agent):
   - Agent clicks "Escalate" button
   - Modal opens with form:
     - Reason (dropdown with common reasons)
     - Description (textarea, required, min 50 chars)
     - Urgency (select: low/medium/high/urgent)
     - Suggested action (optional textarea)
   - Submit → Confirmation: "Escalation sent to Supervisor X"
   - Declaration locked (agent cannot proceed until supervisor responds)
   - Show escalation status: "⏳ Escalated to Supervisor (pending)"

4. Supervisor Escalation Queue (EscalationQueue.tsx):
   - Table columns:
     - Urgency (colored badge: 🔴 urgent, 🟠 high, 🟡 medium, 🟢 low)
     - Declaration ID (clickable)
     - Company name
     - Agent (who escalated)
     - Reason (badge)
     - Escalated at (time ago, e.g., "2 hours ago")
     - SLA deadline (countdown, red if <2 hours remaining)
     - Actions (review button)
   - Sort: Urgent first, then by escalated_at ASC
   - Filter by: urgency, reason, agent, date range
   - Quick stats: Pending (15), Under Review (3), Resolved Today (8)

5. Escalation Detail Page (EscalationDetail.tsx):
   - Split view:
     - Left: Declaration details (summary, documents, calculations)
     - Right: Escalation info (reason, agent notes, history)
   - Action panel (bottom):
     - "Provide Guidance" (textarea + send button)
     - "Approve" (confirmation dialog)
     - "Reject" (reason + notes)
     - "Reassign" (select agent)
     - "Request More Info" (list questions)
   - History timeline:
     - Escalated by Agent Alice at 10:00
     - Supervisor Bob started review at 10:30
     - Supervisor Bob requested more info at 10:45
     - Agent Alice responded at 11:00
     - Supervisor Bob approved at 11:15

6. Hooks:
   - useEscalate() - Create escalation
   - useEscalationQueue() - Fetch supervisor queue
   - useEscalationDetail(id) - Get escalation details
   - useProvideGuidance() - Provide guidance
   - useApproveEscalation() - Approve directly
   - useRejectEscalation() - Reject directly
   - useReassignEscalation() - Reassign to specialist
   - useEscalationStats() - Fetch metrics

Return: Complete escalation UI for agents and supervisors
```

## Key Features

### 1. Multi-Level Escalation
- Agent → Supervisor (normal escalation)
- Supervisor → Senior Supervisor (complex cases)
- Auto-escalation (high-risk declarations)

### 2. Escalation Routing
- Auto-assign to agent's direct supervisor
- Fallback to ministry supervisor
- Round-robin for load balancing

### 3. SLA Tracking
- Urgent: 2 hours
- High: 8 hours
- Medium: 24 hours
- Low: 48 hours
- Alerts when deadline approaching

### 4. Guidance System
- Supervisor provides written guidance
- Agent reviews and completes validation
- Two-way communication (request more info)

### 5. Analytics
- Escalation rate per agent
- Most common escalation reasons
- Avg resolution time per supervisor
- Escalation trends over time

## Use Cases

### Agent Escalates Complex Declaration
1. Agent reviewing IVA declaration
2. Calculation involves unusual deductions
3. Agent unsure about regulation interpretation
4. Clicks "Escalate to Supervisor"
5. Selects reason: "Unclear Regulation"
6. Describes: "Company claims deduction under Article 15-B, unclear if applicable"
7. Escalation sent to Supervisor Alice
8. Alice reviews, provides guidance: "Article 15-B applies only to manufacturing. Reject deduction."
9. Agent receives guidance, completes validation

### Auto-Escalation: High-Value Declaration
1. Company submits declaration: 2,500,000 XAF
2. System auto-checks: Amount > 1M XAF threshold
3. Auto-escalation triggered
4. Supervisor notified: "High-value declaration requires review"
5. Supervisor reviews, approves
6. Declaration proceeds to payment phase

### Fraud Suspicion
1. Agent notices suspicious patterns:
   - Company declared 10x normal amount
   - Supporting documents look altered
2. Agent escalates: Reason = "Fraud Suspicion", Urgency = "Urgent"
3. Supervisor investigates:
   - Reviews documents carefully
   - Compares with historical data
   - Contacts company for clarification
4. Supervisor rejects declaration, flags company for investigation

### Citizen Dispute
1. Declaration rejected by agent
2. Citizen appeals to supervisor
3. Agent escalates: Reason = "Citizen Dispute"
4. Supervisor reviews both sides
5. Supervisor overrides agent's decision, approves
6. Citizen notified: "Your appeal was successful"

## Checklist

- [ ] Read assignment and supervisor modules
- [ ] Design escalation database schema
- [ ] Create escalation API endpoints
- [ ] Implement auto-escalation rules engine
- [ ] Add escalation button to agent UI
- [ ] Create escalation form for agents
- [ ] Build supervisor escalation queue
- [ ] Create escalation detail page
- [ ] Add guidance provision feature
- [ ] Implement reassignment from escalation
- [ ] Add SLA deadline tracking
- [ ] Create escalation analytics dashboard
- [ ] Test agent escalation flow
- [ ] Test supervisor resolution flow
- [ ] Test auto-escalation triggers
- [ ] Verify notifications sent correctly
