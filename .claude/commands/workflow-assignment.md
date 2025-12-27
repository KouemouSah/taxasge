# Declaration Assignment Workflow Command

Complete guide to the declaration assignment workflow (manual and automatic).

## Context

**Assignment Workflow** distributes tax declarations to agents for validation:
- **Automatic Assignment** (AI-powered, 6-criteria scoring algorithm)
- **Manual Assignment** (supervisor assigns directly)
- **Reassignment** (change agent, with reason tracking)
- **Workload Management** (prevent overload, balance team)
- **Lock Mechanism** (prevent conflicts)
- **SLA Tracking** (deadlines and priorities)

## Workflow Architecture

### Complete Assignment Lifecycle

```
[Declaration Submitted by Citizen]
            ↓
    [Trigger Assignment]
            ↓
    ┌───────┴────────┐
    ↓                ↓
[Auto-Assign]    [Manual Assign]
    ↓                ↓
    └───────┬────────┘
            ↓
    [Agent Assigned]
            ↓
    [Agent Notified]
            ↓
  [Agent Starts Processing]
            ↓
 [In Progress (locked to agent)]
            ↓
      ┌─────┴─────┐
      ↓           ↓
  [Approve]   [Reject]   [Escalate]
      ↓           ↓           ↓
 [Completed] [Completed] [Supervisor Reviews]
                               ↓
                         [Reassign if needed]
```

### Phase Breakdown

**PHASE 1: Declaration Submission**
- Citizen submits declaration
- Status: "submitted"
- Enters assignment queue

**PHASE 2: Assignment**
- **Auto-Assignment Flow:**
  1. System evaluates declaration data
  2. Applies assignment rules
  3. Scores eligible agents (6 criteria)
  4. Selects best agent
  5. Creates assignment record
  6. Updates agent workload
  7. Sends notification

- **Manual Assignment Flow:**
  1. Supervisor views pending queue
  2. Selects declaration
  3. Chooses agent (sees workload, specialization)
  4. Sets priority and deadline
  5. Creates assignment
  6. Agent notified

**PHASE 3: Agent Processing**
- Agent receives notification
- Clicks "Start Processing"
- Assignment status: "assigned" → "in_progress"
- Agent reviews:
  - Declaration data
  - Supporting documents
  - Historical context
  - OCR-extracted fields
- Agent decides: Approve / Reject / Escalate

**PHASE 4: Completion**
- Agent clicks "Approve" or "Reject"
- Assignment status: "completed"
- Validation status recorded
- Processing time calculated (trigger)
- Agent workload decremented
- Declaration moves to next phase

**PHASE 5: Post-Completion**
- If approved: Citizen can make payment
- If rejected: Citizen must correct and resubmit
- Supervisor can review quality (quality_score)

## Database Schema (Recap)

```sql
assignment_history:
  - id UUID PRIMARY KEY
  - declaration_id UUID UNIQUE -- One declaration = one active assignment
  - agent_id UUID FK → users.id
  - assigned_by UUID (supervisor or SYSTEM for auto)
  - assigned_at TIMESTAMP
  - status VARCHAR(50) -- "assigned", "in_progress", "completed", "reassigned", "cancelled"
  - started_at TIMESTAMP
  - completed_at TIMESTAMP
  - processing_duration_hours DECIMAL -- Auto-calculated via trigger
  - validation_status VARCHAR(50) -- "approved", "rejected"
  - priority_level VARCHAR(20) -- "low", "medium", "high", "urgent"
  - deadline_date DATE -- Calculated from priority
  - auto_assignment_score DECIMAL(5,2) -- 0-100 if auto-assigned
  - reassignment_count INTEGER DEFAULT 0

agent_workload:
  - user_id UUID PRIMARY KEY
  - pending_declarations INTEGER DEFAULT 0 -- assigned but not started
  - in_progress_declarations INTEGER DEFAULT 0 -- started but not completed
  - total_completed INTEGER
  - total_approved INTEGER
  - total_rejected INTEGER
  - avg_processing_hours DECIMAL
  - success_rate DECIMAL -- (approved / total_completed) * 100
  - specialization_types TEXT[] -- ["IVA", "IRPF"]
  - is_available BOOLEAN DEFAULT true
  - max_concurrent_assignments INTEGER DEFAULT 10

assignment_rules:
  - id SERIAL PRIMARY KEY
  - name VARCHAR(100)
  - entity_type VARCHAR(50) -- "DGI", "Ministry"
  - priority INTEGER -- 1-100 (higher = evaluated first)
  - is_active BOOLEAN
  - conditions JSONB -- Match criteria (declaration_type, amount, etc.)
  - filters JSONB -- Agent filters (specialization, max_workload, etc.)
```

## Auto-Assignment Algorithm (Detailed)

### Step-by-Step Process

**Step 1: Trigger Event**
- Declaration submitted (status = "submitted")
- OR cron job processes pending queue

**Step 2: Apply Assignment Rules**
```python
# Find matching rules (sorted by priority DESC)
rules = await rules_repo.get_active_rules(entity_type="DGI")

for rule in rules:
    # Check conditions
    if rule.matches(declaration_data):
        filters = rule.filters
        break
else:
    # No rules matched, use default filters
    filters = default_filters
```

**Example Rule:**
```json
{
  "name": "High-Value IVA Declarations",
  "priority": 90,
  "conditions": {
    "declaration_type": "IVA_REAL",
    "amount": {">=": 1000000}
  },
  "filters": {
    "specialization": ["IVA"],
    "min_success_rate": 85,
    "max_workload": 5,
    "min_experience_months": 12
  }
}
```

**Step 3: Get Eligible Agents**
```python
# Base filters (always apply)
agents = await get_agents_where(
    role IN ("dgi_agent", "ministry_agent"),
    is_available = true,
    (pending + in_progress) < max_concurrent
)

# Apply rule filters
if filters.get("specialization"):
    agents = [a for a in agents if declaration_type in a.specialization_types]

if filters.get("min_success_rate"):
    agents = [a for a in agents if a.success_rate >= filters["min_success_rate"]]

if filters.get("max_workload"):
    agents = [a for a in agents if (a.pending + a.in_progress) <= filters["max_workload"]]
```

**Step 4: Score Each Agent (6 Criteria)**
```python
for agent in agents:
    # 1. Workload Score (30%)
    current_load = agent.pending + agent.in_progress
    workload_score = (agent.max_concurrent - current_load) / agent.max_concurrent * 100

    # 2. Speed Score (20%)
    if agent.avg_processing_hours > 0:
        speed_score = max(0, 100 - (agent.avg_processing_hours * 2))
    else:
        speed_score = 50  # No history

    # 3. Success Rate Score (25%)
    success_score = agent.success_rate  # Already 0-100

    # 4. Specialization Score (15%)
    if declaration_type in agent.specialization_types:
        spec_score = 100
    else:
        spec_score = 50

    # 5. Pending Duration Score (10%)
    days_since_last = (now - agent.last_assignment_at).days
    pending_score = min(100, days_since_last * 10)

    # 6. Availability Bonus
    if current_load == 0:
        bonus = 10
    else:
        bonus = 0

    # Weighted total
    total_score = (
        workload_score * 0.30 +
        speed_score * 0.20 +
        success_score * 0.25 +
        spec_score * 0.15 +
        pending_score * 0.10 +
        bonus
    )

    agent.score = total_score
```

**Step 5: Select Best Agent**
```python
# Sort by score DESC
agents_sorted = sorted(agents, key=lambda a: a.score, reverse=True)

# Pick highest score
best_agent = agents_sorted[0]

# Log decision
logger.info(f"Selected agent {best_agent.name} with score {best_agent.score:.2f}")
```

**Step 6: Create Assignment**
```python
assignment = await assignment_repo.create(
    declaration_id=declaration_id,
    agent_id=best_agent.id,
    assigned_by=None,  # SYSTEM
    status="assigned",
    auto_assignment_score=best_agent.score,
    priority_level=calculate_priority(declaration),
    deadline_date=now + timedelta(days=deadline_days)
)

# Update workload
await workload_repo.increment_pending(best_agent.id)

# Send notification
await notify_agent(best_agent.id, declaration_id)
```

## Manual Assignment Process

### Supervisor Dashboard Flow

**Step 1: View Pending Declarations**
- Supervisor opens "Pending Declarations" page
- Table shows:
  - Declaration ID
  - Company name
  - Declaration type
  - Amount
  - Submitted date (time ago)
  - SLA deadline
  - Suggested agent (from auto-assignment algorithm)
- Filter by: type, amount range, urgency

**Step 2: Select Declaration**
- Supervisor clicks declaration row
- Side panel opens:
  - Declaration summary
  - Company history
  - Recommended agents (with scores)

**Step 3: Choose Agent**
- Supervisor views agent list:
  - Name
  - Current workload (X/10)
  - Success rate (85%)
  - Avg processing time (18 hours)
  - Specialization (badges: IVA, IRPF)
  - Auto-assignment score (if available)
- Sort by: score, workload, name
- Select agent

**Step 4: Configure Assignment**
- Set priority: low/medium/high/urgent
- Set deadline (default based on priority)
- Add notes (optional)

**Step 5: Confirm**
- Click "Assign to Agent"
- Assignment created
- Agent notified
- Declaration removed from pending queue

## Reassignment Process

### When Reassignment Needed

**Valid Reasons:**
- `workload_rebalance` - Agent overloaded
- `agent_unavailable` - Agent sick/vacation
- `specialization_mismatch` - Wrong expertise
- `performance_issues` - Agent underperforming
- `agent_request` - Agent requests transfer
- `deadline_risk` - May miss deadline
- `quality_concerns` - Supervisor concerned about quality
- `escalation_resolution` - From escalation

### Reassignment Flow

**Step 1: Supervisor Initiates**
- Views assignment details
- Clicks "Reassign"
- Selects reason (from dropdown)
- Enters notes

**Step 2: Select New Agent**
- System shows eligible agents (same filters as auto-assignment)
- Shows current workload
- Supervisor selects new agent

**Step 3: System Actions**
```python
# Mark current assignment as "reassigned"
await assignment_repo.update(
    assignment_id,
    status="reassigned",
    reassignment_count += 1
)

# Decrement old agent workload
await workload_repo.decrement(old_agent_id, declaration_status)

# Create new assignment
new_assignment = await assignment_repo.create(
    declaration_id=declaration_id,
    agent_id=new_agent_id,
    assigned_by=supervisor_id,
    status="assigned",
    previous_assignment_id=assignment_id,  # Track chain
    reassignment_reason=reason,
    reassignment_notes=notes
)

# Increment new agent workload
await workload_repo.increment_pending(new_agent_id)

# Notifications
await notify_agent(old_agent_id, "reassigned_from")
await notify_agent(new_agent_id, "reassigned_to")
```

**Critical Permission for In-Progress:**
- Reassigning "in_progress" declarations requires: `assignment.reassign_in_progress`
- Disrupts agent work
- Requires explanation
- Logged as critical action

## SLA Management

### Priority-Based Deadlines

**Urgent:** 24 hours
- High-value (>1M XAF)
- Fraud suspicion
- Citizen dispute
- Legal requirement

**High:** 48 hours
- Medium-value (500K-1M XAF)
- Multiple rejections
- Approaching tax deadline

**Medium:** 5 business days (default)
- Standard declarations
- Normal processing

**Low:** 10 business days
- Simple declarations
- Low amount (<100K XAF)

### SLA Alerts

**Agent Alerts:**
- 24 hours before deadline: "Assignment due tomorrow"
- 4 hours before deadline: "Urgent: Assignment due soon"
- Overdue: "Overdue: Assignment past deadline"

**Supervisor Alerts:**
- Daily summary: "5 assignments approaching deadline"
- Critical: "3 assignments overdue"

## Use Cases

### Auto-Assignment Success
1. Citizen submits IVA declaration (500,000 XAF)
2. System triggers auto-assignment
3. Rule matches: "Standard IVA declarations"
4. Filters: specialization=IVA, max_workload=8
5. Eligible agents: Alice (score 87), Bob (score 72), Carol (score 65)
6. Alice selected (highest score)
7. Assignment created, Alice notified
8. Alice completes in 20 hours
9. Success rate updated, avg processing time recalculated

### Manual Override
1. Auto-assignment suggests Alice
2. Supervisor knows Bob specializes in this company's industry
3. Supervisor manually assigns to Bob
4. Reason logged: "Specialization match"
5. Bob completes faster than expected (12 hours)

### Workload Rebalancing
1. Alice has 9 pending assignments (90% capacity)
2. Bob has 2 pending (20% capacity)
3. Supervisor clicks "Balance Workload"
4. System suggests: Move 3 pending from Alice to Bob
5. Supervisor confirms
6. 3 assignments reassigned
7. Alice: 6 pending (60%), Bob: 5 pending (50%)

### Reassignment (In-Progress)
1. Agent Alice working on complex declaration (in_progress)
2. Alice falls sick unexpectedly
3. Supervisor reassigns to Bob
4. Reason: "Agent unavailable"
5. Bob receives full context (Alice's notes)
6. Bob continues from where Alice left off

## Checklist

- [ ] Read assignment module (services, API, repositories)
- [ ] Understand 6-criteria scoring algorithm
- [ ] Review assignment rules engine
- [ ] Test auto-assignment with sample declarations
- [ ] Create assignment rules for different scenarios
- [ ] Test manual assignment from supervisor UI
- [ ] Verify workload updates correctly
- [ ] Test reassignment workflow (pending and in-progress)
- [ ] Add SLA deadline tracking and alerts
- [ ] Test lock mechanism (prevent concurrent assignments)
- [ ] Verify notifications sent correctly
- [ ] Add assignment analytics dashboard
- [ ] Measure auto-assignment accuracy vs. manual
- [ ] Optimize scoring weights based on results
- [ ] Document assignment best practices for supervisors
