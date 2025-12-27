# Auto-Assignment Module Command

Implement or enhance the intelligent auto-assignment system for distributing declarations to agents.

## Context

**Assignment Module** automatically assigns declarations to the best-suited agent:
- **Rules Engine** (configure assignment logic)
- **Multi-Criteria Scoring** (6 factors: workload, speed, success rate, specialization, pending duration, availability)
- **Workload Management** (track agent capacity, pending count, in-progress count)
- **Assignment History** (audit trail, reassignment tracking)
- **Manual Override** (supervisor can manually assign/reassign)
- **Lock Mechanism** (prevent concurrent assignments)

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/assignment/`

**Key Files:**
- `services/auto_assignment_service.py` - Auto-assignment algorithm
- `services/assignment_service.py` - Manual assignment operations
- `services/rules_engine.py` - Rule evaluation
- `api/assignment_routes.py` - Endpoints (manual, auto, reassign)
- `api/supervisor_routes.py` - Supervisor dashboard
- `repositories/assignment_repository.py` - Data access
- `repositories/workload_repository.py` - Workload metrics

**Database Schema:**
```sql
assignment_history:
  - id UUID PRIMARY KEY
  - declaration_id UUID FK → tax_declarations.id
  - declaration_type VARCHAR(50) -- "tax_declaration", "fiscal_service"
  - agent_id UUID FK → users.id
  - assigned_by UUID FK → users.id (supervisor for manual, system for auto)
  - assigned_at TIMESTAMP
  - status VARCHAR(50) -- "assigned", "in_progress", "completed", "cancelled", "reassigned"
  - started_at TIMESTAMP
  - completed_at TIMESTAMP
  - processing_duration_hours DECIMAL(10,2) -- Auto-calculated via trigger
  - validation_status VARCHAR(50) -- "approved", "rejected" (agent's decision)
  - quality_score DECIMAL(3,1) -- 0-10 (supervisor review)
  - priority_level VARCHAR(20) -- "low", "medium", "high", "urgent"
  - deadline_date DATE
  - notes TEXT
  - auto_assignment_score DECIMAL(5,2) -- 0-100 (algorithm confidence)
  - reassignment_count INTEGER DEFAULT 0
  - previous_assignment_id UUID -- Track reassignment chain

agent_workload:
  - user_id UUID FK → users.id PRIMARY KEY
  - pending_declarations INTEGER DEFAULT 0
  - in_progress_declarations INTEGER DEFAULT 0
  - total_completed INTEGER DEFAULT 0
  - total_approved INTEGER DEFAULT 0
  - total_rejected INTEGER DEFAULT 0
  - avg_processing_hours DECIMAL(10,2)
  - success_rate DECIMAL(5,2) -- (approved / total_completed) * 100
  - specialization_types TEXT[] -- ["IVA", "IRPF"] (preferred declaration types)
  - is_available BOOLEAN DEFAULT true
  - max_concurrent_assignments INTEGER DEFAULT 10
  - last_assignment_at TIMESTAMP

assignment_rules:
  - id SERIAL PRIMARY KEY
  - name VARCHAR(100)
  - description TEXT
  - entity_type VARCHAR(50) -- "DGI", "Ministry"
  - entity_id VARCHAR(50) -- ministry_id for ministry-scoped rules
  - priority INTEGER -- 1-100 (higher = evaluated first)
  - is_active BOOLEAN
  - conditions JSONB -- Rule conditions (e.g., {"declaration_type": "IVA", "amount": {">": 100000}})
  - filters JSONB -- Agent filters (e.g., {"specialization": ["IVA"], "max_workload": 5})
  - created_at TIMESTAMP
```

## Architecture

### Auto-Assignment Algorithm (6-Criteria Scoring)

**Input:** Declaration data (type, amount, complexity, urgency)
**Output:** Best agent + confidence score (0-100)

**Step 1: Apply Rules**
- Find matching assignment rules (by declaration type, amount, entity)
- Get filters from rules (specialization, max workload, etc.)
- If no rules match: Use default filters

**Step 2: Get Eligible Agents**
- Filter by ministry (if ministry-scoped)
- Filter by role (dgi_agent or ministry_agent)
- Filter by availability (is_available = true)
- Filter by capacity (pending + in_progress < max_concurrent)
- Apply rule filters (specialization, workload thresholds)

**Step 3: Score Each Agent** (6 criteria, weighted):

1. **Workload Score (30%)** - Lower is better
   ```python
   current_load = pending + in_progress
   workload_score = max(0, (max_concurrent - current_load) / max_concurrent) * 100
   ```

2. **Speed Score (20%)** - Faster is better
   ```python
   if avg_processing_hours == 0:
       speed_score = 50  # No history
   else:
       # Lower hours = higher score (inverse relationship)
       speed_score = max(0, 100 - (avg_processing_hours * 5))
   ```

3. **Success Rate Score (25%)** - Higher is better
   ```python
   success_rate_score = success_rate  # Already 0-100
   ```

4. **Specialization Score (15%)** - Bonus for matching type
   ```python
   if declaration_type in agent.specialization_types:
       specialization_score = 100
   else:
       specialization_score = 50  # Generalist
   ```

5. **Pending Duration Score (10%)** - Prefer agents with older pending
   ```python
   # Time since last assignment (days)
   days_since_last = (now - last_assignment_at).days
   pending_duration_score = min(100, days_since_last * 10)
   ```

6. **Availability Bonus** - Extra points for immediately available
   ```python
   if current_load == 0:
       availability_bonus = 10
   ```

**Final Score:**
```python
total_score = (
    workload_score * 0.30 +
    speed_score * 0.20 +
    success_rate_score * 0.25 +
    specialization_score * 0.15 +
    pending_duration_score * 0.10 +
    availability_bonus
)
```

**Step 4: Select Best Agent**
- Sort agents by total_score (descending)
- Pick agent with highest score
- If tie: Random selection

**Step 5: Create Assignment**
- Insert into assignment_history
- Update agent_workload.pending_declarations += 1
- Set auto_assignment_score = total_score
- Return assignment

### Assignment Lifecycle

```
[Submitted] → [Assigned] → [In Progress] → [Completed]
                ↓                              ↓
         [Reassigned]                    [Closed]
```

**States:**
- **assigned** - Declaration assigned to agent (not yet started)
- **in_progress** - Agent actively working on it
- **completed** - Agent finished validation (approved/rejected)
- **reassigned** - Moved to different agent
- **cancelled** - Assignment cancelled (declaration withdrawn)

**State Transitions:**
- assigned → in_progress: Agent clicks "Start Processing"
- in_progress → completed: Agent clicks "Approve" or "Reject"
- assigned → reassigned: Supervisor reassigns
- in_progress → reassigned: Supervisor reassigns (requires critical permission)

### Rules Engine

**Rule Structure:**
```json
{
  "name": "High-Value IVA Declarations",
  "priority": 90,
  "entity_type": "DGI",
  "conditions": {
    "declaration_type": "IVA_REAL",
    "amount": {">=": 1000000}  // >= 1M XAF
  },
  "filters": {
    "specialization": ["IVA"],
    "min_success_rate": 85,
    "max_workload": 5,
    "min_experience_months": 12
  }
}
```

**Rule Evaluation:**
1. Sort rules by priority (descending)
2. For each rule:
   - Check conditions against declaration_data
   - If ALL conditions match: Apply filters
   - Return first matching rule
3. If no rules match: Use default filters

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/assignment/services/auto_assignment_service.py
Read packages/backend/app/modules/assignment/services/assignment_service.py
Read packages/backend/app/modules/assignment/services/rules_engine.py
Read packages/backend/app/modules/assignment/api/assignment_routes.py
Read packages/backend/app/modules/assignment/api/supervisor_routes.py
```

### Step 2: Understand Current Features

**Implemented:**
- [x] Auto-assignment with 6-criteria scoring
- [x] Manual assignment (supervisor)
- [x] Reassignment (with reason tracking)
- [x] Workload management
- [x] Assignment rules engine
- [x] Lock mechanism (prevent conflicts)
- [x] Audit trail (all assignments logged)

**Potential Enhancements:**
- [ ] Machine learning scoring (learn from historical data)
- [ ] Deadline prediction (estimate completion time)
- [ ] Load balancing alerts (overloaded agents)
- [ ] Assignment analytics dashboard
- [ ] A/B testing (compare manual vs. auto)

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for enhancements:

#### Subagent 1: ML-Based Assignment Scoring
```markdown
Task: Enhance auto-assignment with machine learning predictions

Implement in packages/backend/app/modules/assignment/ml/:

1. Feature Engineering:
   - Declaration features:
     - type (IVA, IRPF, etc.)
     - amount (normalized)
     - complexity_score (based on form fields)
     - has_supporting_docs (boolean)
     - citizen_history_count (previous declarations)
   - Agent features:
     - current_workload (pending + in_progress)
     - avg_processing_hours
     - success_rate
     - specialization_match (boolean)
     - experience_months
   - Historical features:
     - agent_declaration_type_count (how many of this type agent processed)
     - agent_avg_quality_score
     - time_of_day, day_of_week (seasonality)

2. Training Data Collection:
   - Extract from assignment_history + tax_declarations
   - Target variable: processing_duration_hours (regression)
   - Labels: validation_status (approved/rejected) (classification)
   - Train/test split: 80/20

3. Model:
   - Algorithm: LightGBM (fast, accurate for tabular data)
   - Train 2 models:
     - Duration predictor: Predict how long agent will take
     - Success predictor: Predict if agent will approve/reject correctly
   - Combine predictions into confidence score

4. Integration:
   ```python
   async def ml_score_agent(
       agent_id: UUID,
       declaration_data: dict
   ) -> dict:
       # Extract features
       features = extract_features(agent_id, declaration_data)

       # Predict duration
       predicted_duration = duration_model.predict(features)

       # Predict success probability
       success_prob = success_model.predict_proba(features)[1]

       # Combined score (faster + higher success = better)
       ml_score = (
           (100 - predicted_duration * 2) * 0.5 +  # Duration component
           success_prob * 100 * 0.5  # Success component
       )

       return {
           "ml_score": ml_score,
           "predicted_duration_hours": predicted_duration,
           "success_probability": success_prob
       }
   ```

5. Hybrid Scoring:
   - Combine rule-based score + ML score
   - final_score = rule_score * 0.6 + ml_score * 0.4
   - Gradually increase ML weight as model improves

6. Model Retraining:
   - Retrain weekly with new completed assignments
   - Track model performance (MAE for duration, AUC for success)
   - Alert if performance degrades

Return: ML-based scoring, training pipeline, hybrid scoring
```

#### Subagent 2: Workload Balancing & Alerts
```markdown
Task: Create intelligent workload balancing and alerting system

Implement in packages/backend/app/modules/assignment/:

1. Workload Metrics:
   - Calculate per agent:
     - current_load_percentage = (pending + in_progress) / max_concurrent * 100
     - overdue_count (assignments past deadline)
     - avg_pending_age_hours (how long pending assignments wait)
     - burnout_risk_score (high workload + long hours + low success rate)
   - Calculate per team (ministry):
     - total_pending
     - total_in_progress
     - average_load_percentage
     - agents_at_capacity_count

2. Load Balancing Strategies:
   - **Reactive Balancing** (triggered by event):
     - When agent reaches 90% capacity: Pause new assignments
     - When agent overloaded: Suggest reassignment to supervisor
   - **Proactive Balancing** (scheduled job, every 6 hours):
     - Find overloaded agents (>80% capacity)
     - Find underloaded agents (<30% capacity)
     - Suggest reassignments to balance load
   - **Emergency Balancing** (manual trigger):
     - Supervisor clicks "Balance Workload"
     - Algorithm reassigns pending declarations to equalize load

3. Alerts & Notifications:
   - Agent Alerts:
     - "You have 3 assignments due tomorrow"
     - "Assignment #123 is overdue"
   - Supervisor Alerts:
     - "Agent Alice is at 95% capacity"
     - "Agent Bob has 5 overdue assignments"
     - "Team average load: 78% (high)"
   - Admin Alerts:
     - "DGI ministry has 50 pending assignments (bottleneck)"
     - "Average processing time increased by 20% this week"

4. Dashboard Visualizations:
   - Workload heatmap (grid: agents × days, color by load percentage)
   - Pending age distribution (histogram)
   - Processing time trends (line chart)
   - Success rate by agent (bar chart)
   - Bottleneck analysis (top 5 slowest agents)

5. API Endpoints:
   - GET /api/v1/supervisor/workload/overview
   - GET /api/v1/supervisor/workload/agents
   - POST /api/v1/supervisor/workload/balance (trigger rebalancing)
   - GET /api/v1/supervisor/alerts

Return: Workload metrics, balancing strategies, alert system, dashboard API
```

#### Subagent 3: Assignment Analytics & Optimization
```markdown
Task: Create analytics dashboard for assignment performance optimization

Create in packages/web/src/modules/supervisor/analytics/:

1. Components:
   - AssignmentMetrics.tsx (KPI cards)
   - AgentPerformance.tsx (agent comparison table)
   - AssignmentTrends.tsx (time-series charts)
   - RuleEffectiveness.tsx (rule performance metrics)
   - OptimizationSuggestions.tsx (AI-powered recommendations)

2. KPI Metrics (AssignmentMetrics.tsx):
   - Total assignments (today, this week, this month)
   - Average processing time (trend vs. last period)
   - Success rate (% approved on first try)
   - Reassignment rate (% of assignments reassigned)
   - SLA compliance (% completed before deadline)
   - Manual vs. auto ratio (how often supervisors override)

3. Agent Performance (AgentPerformance.tsx):
   - Sortable table: Agent | Workload | Avg Time | Success Rate | Quality Score
   - Color-coded cells:
     - Green: Top performer (>90% success, <24h avg time)
     - Yellow: Average
     - Red: Needs improvement (<70% success or >48h avg time)
   - Click agent → Drill-down to individual assignments
   - Export to CSV for reporting

4. Assignment Trends (AssignmentTrends.tsx):
   - Line chart: Assignments over time (daily, weekly, monthly)
   - Stacked area chart: Status breakdown (assigned, in progress, completed)
   - Heatmap: Assignments by hour of day + day of week
   - Seasonality detection (busy periods)

5. Rule Effectiveness (RuleEffectiveness.tsx):
   - Table: Rule | Matched Count | Avg Assignment Score | Success Rate
   - Identify ineffective rules (low success rate)
   - Suggest rule adjustments:
     - "Rule 'High-Value IVA' has 60% success rate. Consider adjusting filters."
     - "Rule 'Urgent Declarations' rarely matches (3 in last month). Simplify conditions?"

6. Optimization Suggestions (OptimizationSuggestions.tsx):
   - AI-generated recommendations:
     - "Agent Alice has 85% success rate with IVA_REAL. Add 'IVA_REAL' to her specialization."
     - "Agent Bob's avg time increased from 18h to 36h. Check if overloaded."
     - "Ministry of Commerce has no pending assignments. Consider cross-ministry assignments."
   - Action buttons: "Apply Suggestion" (automatically update agent profile or rules)

7. A/B Testing (AssignmentABTest.tsx):
   - Compare manual vs. auto assignments:
     - Processing time: Manual avg vs. auto avg
     - Success rate: Manual vs. auto
     - Agent satisfaction (survey)
   - Statistical significance test (t-test)
   - Recommendation: "Auto-assignment is 15% faster with same success rate. Increase auto %."

8. Hooks:
   - useAssignmentMetrics() - Fetch KPIs
   - useAgentPerformance() - Fetch agent stats
   - useAssignmentTrends(dateRange) - Time-series data
   - useRuleEffectiveness() - Rule performance
   - useOptimizationSuggestions() - AI recommendations

Return: Analytics dashboard, KPIs, performance tracking, optimization suggestions
```

## Key Features

### 1. Multi-Criteria Scoring Algorithm
- 6 factors with configurable weights
- Workload, speed, success rate, specialization, pending duration, availability
- Score 0-100 (higher = better match)

### 2. Rules Engine
- Priority-ordered rules (1-100)
- Flexible conditions (declaration type, amount, entity)
- Agent filters (specialization, workload, success rate)
- Entity-scoped (DGI vs. ministry)

### 3. Workload Management
- Real-time capacity tracking
- Prevent overloading (max_concurrent limit)
- Pending vs. in-progress separation
- Performance metrics (avg time, success rate)

### 4. Reassignment Handling
- Track reassignment chain (previous_assignment_id)
- Reason tracking (workload_rebalance, agent_unavailable, etc.)
- Critical permission for in-progress reassignment
- Audit trail (who reassigned, when, why)

### 5. Lock Mechanism
- Pessimistic lock (2 hours)
- Prevent concurrent assignments to same declaration
- Auto-release if no action taken
- Other supervisors see "Locked by X"

### 6. Deadline Management
- Configurable deadline_days per assignment
- SLA tracking
- Overdue alerts
- Deadline extension (supervisor approval)

## Use Cases

### Auto-Assignment (Happy Path)
1. Citizen submits IVA declaration (amount: 500,000 XAF)
2. System triggers auto-assignment
3. Algorithm evaluates 10 eligible DGI agents
4. Scores each agent (Alice: 87, Bob: 72, Carol: 65)
5. Assigns to Alice (highest score)
6. Alice notified: "New assignment: IVA #12345"

### Manual Override
1. Supervisor views pending declarations
2. Sees IVA #12345 auto-assigned to Alice
3. Knows Bob specializes in IVA for this company
4. Manually reassigns to Bob (reason: "specialization_mismatch")
5. Alice notified: "Assignment #12345 reassigned"
6. Bob notified: "New assignment: IVA #12345 (reassigned from Alice)"

### Load Balancing
1. Alice has 9 pending assignments (90% capacity)
2. Bob has 2 pending assignments (20% capacity)
3. Supervisor clicks "Balance Workload"
4. System suggests: Move 3 pending assignments from Alice to Bob
5. Supervisor confirms
6. Assignments reassigned, Alice now at 60% capacity

### Deadline Alert
1. Assignment #12345 due tomorrow
2. Agent Alice receives alert: "Assignment due in 24 hours"
3. Alice starts processing
4. Completes 2 hours before deadline
5. No escalation needed

## Checklist

- [ ] Read existing assignment module
- [ ] Understand 6-criteria scoring algorithm
- [ ] Test auto-assignment with sample declarations
- [ ] Create assignment rules for different scenarios
- [ ] Verify workload tracking accuracy
- [ ] Test reassignment workflow
- [ ] Implement ML-based scoring (optional)
- [ ] Add workload balancing logic
- [ ] Create assignment analytics dashboard
- [ ] Test with multiple agents and declarations
- [ ] Verify rule effectiveness
- [ ] Measure auto-assignment accuracy (compare to manual)
- [ ] Optimize scoring weights based on results
