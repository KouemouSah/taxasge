# DGI Agent Dashboard Feature Command

Create features for the DGI Agent Dashboard to validate tax declarations.

## Context

**DGI Agent Dashboard** is for Direction Générale des Impôts (DGI) agents who:
- **MUST be attached to a ministry** (ministry_id required)
- **MUST have matricule** (employee number)
- Validate tax declarations submitted by citizens/companies
- Review declaration data, calculations, and supporting documents
- Approve, reject, or request corrections
- Close declarations after payment confirmation (treasury agent validates payment)
- Manage declaration queue with SLA deadlines

## User Profile Requirements

```sql
-- DGI Agent account constraints
users:
  - role = 'dgi_agent'
  - matricule VARCHAR(50) UNIQUE NOT NULL  ✅ REQUIRED

ministry_agents:
  - user_id UUID (dgi_agent)
  - ministry_id INTEGER NOT NULL            ✅ REQUIRED
  - UNIQUE(user_id, ministry_id)
```

## Workflow (from FISCAL_DECLARATIONS_ARCHITECTURE.md)

### PHASE 2: VALIDATION AGENT DGI (BEFORE Payment)
**Étapes 5-9:**
1. Dashboard shows pending declarations (filter: status='submitted')
2. Agent **locks** declaration (status → 'under_review')
3. Agent reviews:
   - Calculation accuracy
   - Supporting documents (factures)
   - Historical patterns
   - Comparison with previous periods
4. Agent actions:
   - **APPROVE** → status='approved' (citizen can pay)
   - **REQUEST CORRECTIONS** → status='requires_modification'
   - **REJECT** → status='rejected'
5. Audit trail logged

### PHASE 4: CLÔTURE (AFTER Treasury validates payment)
**Étape 16:**
- After treasury agent confirms payment
- DGI agent **closes declaration** (status='closed')
- Generate official certificate PDF with QR code
- Email sent to citizen

**Key Point:** DGI validates DECLARATION, Treasury validates PAYMENT

## Existing Implementation

Check if module exists:
```bash
Glob packages/backend/app/modules/declarations/api/*routes*.py
```

## Instructions

### Step 1: Read Existing Code
```bash
Read packages/backend/app/modules/declarations/
Read packages/backend/app/modules/assignment/  # Queue management
Read .github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
```

### Step 2: Use Subagents for Development

Launch 3 subagents in parallel:

#### Subagent 1: Declaration Queue API
```markdown
Task: Create DGI agent declaration queue with assignment system

Implement in packages/backend/app/modules/declarations/api/:

1. GET /api/v1/dgi-agent/queue
   - Filter: status IN ('submitted', 'resubmitted')
   - Filter by ministry (agent's ministry only)
   - Sort: due_date ASC, amount DESC, priority
   - Include: company info, declaration type, documents count, days until due
   - Pagination + summary stats

2. POST /api/v1/dgi-agent/declarations/{id}/assign-to-me
   - Lock declaration (pessimistic lock 2 hours)
   - Check: not already locked by other agent
   - Update: locked_by_agent_id, locked_at, status='under_review'
   - Return: full declaration data + documents

3. POST /api/v1/dgi-agent/declarations/{id}/release
   - Unlock declaration (returns to queue)
   - Reset: locked_by_agent_id=NULL, status='submitted'

**Ministry Filter:**
```sql
WHERE declarations.company_id IN (
  SELECT company_id FROM companies
  WHERE primary_sector_id IN (
    SELECT id FROM sectors WHERE ministry_id = agent.ministry_id
  )
)
```

Return: API endpoints created, queue filtering logic
```

#### Subagent 2: Validation Actions API
```markdown
Task: Create declaration validation actions (approve/reject/request corrections)

Implement in packages/backend/app/modules/declarations/api/:

1. POST /api/v1/dgi-agent/declarations/{id}/approve
   - Validate: agent is assigned, status='under_review'
   - Update: status='approved', validated_by=agent_id, validated_at=NOW()
   - Calculate: amount_to_pay from declaration_data
   - Audit: log approval with notes
   - Notify: citizen (email "declaration approved, proceed to payment")
   - Return: updated declaration

2. POST /api/v1/dgi-agent/declarations/{id}/reject
   - Require: rejection_reason (min 20 chars)
   - Update: status='rejected', rejected_by=agent_id, rejection_reason
   - Notify: citizen (email with reason)
   - Return: updated declaration

3. POST /api/v1/dgi-agent/declarations/{id}/request-corrections
   - Require: list of fields to correct + instructions
   - Update: status='requires_modification', correction_notes
   - Unlock: locked_by_agent_id=NULL (return to citizen)
   - Notify: citizen (email with correction instructions)
   - Return: updated declaration

4. POST /api/v1/dgi-agent/declarations/{id}/close
   - Validate: status='approved' AND payment confirmed by treasury
   - Update: status='closed', closed_by=agent_id, closed_at=NOW()
   - Generate: official certificate PDF with QR code
   - Upload: certificate to storage (get URL)
   - Notify: citizen (email "declaration closed, certificate ready")
   - Return: declaration + certificate_url

Return: Validation endpoints, business rules implemented
```

#### Subagent 3: Agent Dashboard UI
```markdown
Task: Create DGI agent dashboard frontend

Create in packages/web/src/modules/dgi-agent/:

1. Components:
   - DeclarationQueue.tsx (table with filters, SLA indicators)
   - DeclarationReview.tsx (full review page with tabs)
   - ValidationActions.tsx (approve/reject/request buttons)
   - DocumentViewer.tsx (view uploaded PDFs/images)
   - CalculationChecker.tsx (verify tax calculations)
   - ComparisonPanel.tsx (compare with previous period)

2. Hooks:
   - useDeclarationQueue() - fetch queue with React Query
   - useAssignDeclaration() - assign declaration to current agent
   - useApproveDeclaration() - approve with optimistic update
   - useRejectDeclaration() - reject with validation
   - useRequestCorrections() - request corrections
   - useCloseDeclaration() - close after payment

3. Features:
   - SLA deadline countdown (red if <24h, orange if <48h)
   - Priority badges (urgent/high/medium/low)
   - Document preview inline
   - Calculation breakdown table
   - Historical comparison chart
   - Quick actions toolbar

Return: Components created, UX flow, performance notes
```

## Key Features

### 1. Ministry-Scoped Queue
- Agents only see declarations from companies in their ministry's sectors
- Cross-ministry declarations require escalation to supervisor

### 2. Lock Mechanism (Prevent Conflicts)
- Pessimistic lock (2 hours)
- Other agents see "Locked by Agent X"
- Auto-release if no action taken

### 3. Calculation Verification
- Auto-calculate expected tax from declaration_data
- Compare with citizen's declared amount
- Flag discrepancies >5%

### 4. Document Requirements
- Check all required documents uploaded
- Warn if missing critical documents
- OCR extraction for verification

### 5. Historical Analysis
- Compare with previous period (N-1)
- Flag unusual variations (>30% change)
- Show trend chart

### 6. SLA Management
- Due date based on declaration type
- Countdown timer in queue
- Alerts for approaching deadlines

## Separation of Duties

| Actor | Validates | Table | Status Change |
|-------|-----------|-------|---------------|
| **DGI Agent** | Declaration content (calculations, documents) | tax_declarations | submitted → approved |
| **Treasury Agent** | Payment confirmation (bank transaction) | declaration_payments | paid → confirmed |
| **DGI Agent** | Final closure | tax_declarations | approved → closed |

## Checklist

- [ ] Read existing declarations module
- [ ] Verify ministry filtering logic
- [ ] Understand lock mechanism
- [ ] Create declaration queue API
- [ ] Implement validation actions (approve/reject/request)
- [ ] Create closure endpoint (after treasury validation)
- [ ] Build agent dashboard UI
- [ ] Test lock conflicts (2 agents same declaration)
- [ ] Verify SLA calculations
- [ ] Test ministry filtering
- [ ] Add audit trail logging
