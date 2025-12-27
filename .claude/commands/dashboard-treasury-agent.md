# Treasury Agent Dashboard Feature Command

Create features for the Treasury Agent Dashboard to validate payment confirmations.

## Context

**Treasury Agent Dashboard** is for treasury department staff (TREASURY_AGENT role) who:
- **MUST be attached to a ministry** (ministry_id required - typically Ministry of Finance/Treasury)
- **MUST have matricule** (employee number)
- **EXCLUSIVELY validate payments** confirmed by banks (PHASE 4, Step 15)
- Verify bank transaction details
- Confirm payment amounts match declarations
- Detect fraud or discrepancies
- Authorize final payment confirmation
- **DO NOT validate declaration content** (that's DGI agent's job)

## User Profile Requirements

```sql
-- Treasury Agent account constraints
users:
  - role = 'treasury_agent'             ✅ NEW ROLE (add to user_role_enum)
  - matricule VARCHAR(50) UNIQUE NOT NULL  ✅ REQUIRED

ministry_agents:
  - user_id UUID (treasury_agent)
  - ministry_id INTEGER NOT NULL            ✅ REQUIRED (Ministry of Finance)
  - UNIQUE(user_id, ministry_id)
```

**CRITICAL: Add to Database Schema**
```sql
-- Step 1: Add to enum
ALTER TYPE user_role_enum ADD VALUE 'treasury_agent';

-- Step 2: Verify ministry exists
SELECT * FROM ministries WHERE ministry_code = 'MIN_FINANCE';
```

## Workflow (from FISCAL_DECLARATIONS_ARCHITECTURE.md)

### PHASE 4: VALIDATION FINALE & CLÔTURE

**Étape 14 - Dashboard Agent (Paiements Déclarations)**
- Filter: `declaration_payments.status = 'paid'` (bank confirmed)
- Shows payments waiting for treasury validation

**Étape 15 - Confirmation Paiement par Agent trésor EXCLUSIVEMENT**
```sql
-- Treasury agent verifies:
✅ Transaction bancaire valide (bank transaction ID valid)
✅ Montant correct (amount paid = amount declared)
✅ Pas de fraude (no fraud indicators)

-- Action: CONFIRMER
UPDATE declaration_payments SET
  status = 'confirmed',
  confirmed_by_agent_id = treasury_agent.id,
  confirmed_at = NOW()
WHERE id = payment_id
  AND status = 'paid';  -- Only confirm bank-paid transactions
```

**Étape 16 - Clôture Déclaration** (DGI agent does this AFTER treasury confirmation)

## Separation of Duties

| Phase | Actor | Validates | Table | Status Field |
|-------|-------|-----------|-------|--------------|
| **PHASE 2** | **DGI Agent** | Declaration content (calculations, docs) | tax_declarations | status='approved' |
| **PHASE 3** | **Citizen** | Makes payment | declaration_payments | status='paid' |
| **PHASE 4 (Étape 15)** | **Treasury Agent** | Payment transaction | declaration_payments | status='confirmed' |
| **PHASE 4 (Étape 16)** | **DGI Agent** | Final closure | tax_declarations | status='closed' |

**Key Point:** Treasury validates PAYMENT ONLY, NOT declaration content.

## Instructions

### Step 1: Add Treasury Agent Role to Database

**CRITICAL MIGRATION REQUIRED:**
```sql
-- File: packages/backend/database/migrations/012_add_treasury_agent.sql

-- Step 1: Add role to enum
ALTER TYPE user_role_enum ADD VALUE 'treasury_agent';

-- Step 2: Verify migration
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'user_role_enum'
);
-- Should include: citizen, business, accountant, admin, supervisor, dgi_agent, ministry_agent, treasury_agent

-- Step 3: Add permission
INSERT INTO permissions (name, resource, action, description, is_critical) VALUES
  ('payments.confirm', 'payments', 'confirm', 'Confirmar pago validado por banco (exclusivo agente trésor)', true);

-- Step 4: Create default treasury role
INSERT INTO roles (name, description, is_system) VALUES
  ('treasury_agent', 'Agent du Trésor Public - Validation paiements bancaires', true);

-- Step 5: Assign permission to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'treasury_agent' AND p.name = 'payments.confirm';
```

### Step 2: Read Existing Payment Module
```bash
Read packages/backend/app/modules/payments/
Read packages/backend/app/modules/webhooks/  # BANGE webhook handling
Read .github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
```

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel:

#### Subagent 1: Payment Validation Queue API
```markdown
Task: Create treasury agent payment validation queue

Implement in packages/backend/app/modules/payments/api/:

1. GET /api/v1/treasury/payments/pending
   - Filter: declaration_payments.status = 'paid' (bank confirmed but not treasury confirmed)
   - Include: declaration details, company info, bank transaction ID
   - Sort: paid_at ASC (oldest first), amount DESC (high value first)
   - Flag: potential fraud indicators (unusual amount, duplicate transaction)
   - Pagination + summary stats
   - **Important:** Only treasury_agent role can access

2. GET /api/v1/treasury/payments/{id}/details
   - Full payment details
   - Bank transaction information (BANGE response)
   - Declaration data (declared amount)
   - Comparison (paid amount vs declared amount)
   - Audit trail (who approved declaration, when paid)
   - Historical payments from same company (fraud detection)

3. POST /api/v1/treasury/payments/{id}/confirm
   - Validate: status = 'paid' (not already confirmed)
   - Validate: treasury agent has permission
   - Verify: amount_paid = amount_declared (within tolerance 0.01 XAF)
   - Update: status='confirmed', confirmed_by=agent_id, confirmed_at=NOW()
   - Audit: log confirmation with notes
   - Notify: DGI agent (can now close declaration)
   - Return: confirmed payment

4. POST /api/v1/treasury/payments/{id}/flag-fraud
   - Require: fraud_reason, severity (low/medium/high/critical)
   - Update: status='flagged_fraud', flagged_by=agent_id
   - Lock: prevent closure until investigation
   - Notify: supervisor + DGI agent + admin
   - Create: investigation record
   - Return: flagged payment

5. POST /api/v1/treasury/payments/{id}/reject
   - Require: rejection_reason
   - Update: status='rejected_treasury', rejected_by=agent_id
   - Refund: initiate refund process (if applicable)
   - Notify: citizen, DGI agent
   - Return: rejected payment

**Permission Decorator:**
```python
@require_permission("payments.confirm")
@require_role("treasury_agent")
async def confirm_payment(...):
    pass
```

Return: API endpoints with treasury-specific logic
```

#### Subagent 2: Fraud Detection System
```markdown
Task: Implement fraud detection checks

Create in packages/backend/app/modules/payments/services/fraud_detection.py:

1. check_amount_discrepancy(payment)
   - Compare paid_amount vs declared_amount
   - Tolerance: ±0.01 XAF
   - Flag: discrepancy > tolerance
   - Return: is_suspicious, discrepancy_amount

2. check_duplicate_transaction(payment)
   - Search: same bank_transaction_id in last 30 days
   - Search: same company + amount in last 24 hours
   - Flag: potential duplicate
   - Return: is_duplicate, similar_payments[]

3. check_unusual_amount(payment)
   - Get: company payment history (last 12 months)
   - Calculate: avg_payment, std_deviation
   - Flag: amount > avg + 3*std_deviation
   - Return: is_unusual, z_score

4. check_rapid_succession(payment)
   - Get: recent payments from company (last 7 days)
   - Flag: >5 payments in 7 days
   - Return: is_rapid, payment_count

5. calculate_risk_score(payment)
   - Aggregate: all checks
   - Score: 0-100 (0=safe, 100=high risk)
   - Threshold: >70 requires manual review
   - Return: risk_score, reasons[]

**Integration in validation queue:**
```python
async def get_pending_payments():
    payments = await payment_repository.get_pending()
    for payment in payments:
        payment.risk_score = await fraud_detection.calculate_risk_score(payment)
    return sorted(payments, key=lambda p: p.risk_score, reverse=True)
```

Return: Fraud detection system
```

#### Subagent 3: Treasury Agent Dashboard UI
```markdown
Task: Create treasury agent dashboard for payment validation

Create in packages/web/src/modules/treasury/:

1. Components:
   - PaymentValidationQueue.tsx (sortable table with risk indicators)
   - PaymentDetail.tsx (full payment review with comparison)
   - TransactionVerifier.tsx (bank transaction verification)
   - FraudIndicators.tsx (visual fraud risk indicators)
   - ConfirmPaymentDialog.tsx (confirmation with notes)
   - FlagFraudDialog.tsx (fraud reporting with severity)

2. Hooks:
   - usePendingPayments() - fetch queue with fraud scores
   - usePaymentDetails(id) - full payment information
   - useConfirmPayment() - confirm with optimistic update
   - useFlagFraud() - flag payment for investigation
   - useRejectPayment() - reject payment

3. Features:
   - Risk score visualization (color-coded: green/yellow/orange/red)
   - Amount comparison (declared vs paid with diff)
   - Bank transaction details viewer
   - Fraud indicators panel (badges for each check)
   - Historical payments chart (company payment pattern)
   - Bulk confirmation (select multiple low-risk payments)
   - Quick filters (high-risk only, large amounts, specific dates)
   - Search by: company, bank transaction ID, amount range

4. Visual Indicators:
   - 🟢 Safe (risk < 30): green badge, auto-confirm option
   - 🟡 Low Risk (30-50): yellow badge, standard review
   - 🟠 Medium Risk (50-70): orange badge, careful review
   - 🔴 High Risk (>70): red badge, requires investigation

5. Dashboard Stats:
   - Pending validation count
   - Average risk score
   - Flagged fraud count
   - Confirmed today/this week
   - Total amounts confirmed

Return: Components, fraud visualization, UX decisions
```

## Key Features

### 1. Ministry Scoping
- Treasury agents typically in Ministry of Finance
- Can view all payments across all ministries (special permission)
- Dashboard filtered by ministry_id unless special permission

### 2. Fraud Detection
- Automated risk scoring (0-100)
- Multiple checks: amount, duplicate, pattern, rapid succession
- Visual risk indicators
- Fraud flag workflow

### 3. Payment Verification
- Compare bank confirmation with declaration
- Verify transaction ID validity
- Check amount accuracy (tolerance ±0.01 XAF)
- Historical payment analysis

### 4. Separation of Concerns
- Treasury ONLY validates payment (not declaration)
- DGI agent closes declaration AFTER treasury confirmation
- Clear handoff between teams

### 5. Audit Trail
- Log every confirmation/rejection/flag
- Track: who, when, why
- Include: notes, risk score, checks performed

## Testing Scenarios

### Happy Path
1. Declaration approved by DGI agent
2. Citizen makes payment via BANGE
3. BANGE webhook: status='paid'
4. Treasury agent reviews: risk_score=15 (low)
5. Treasury agent confirms: status='confirmed'
6. DGI agent closes: status='closed'

### Fraud Detection
1. Payment status='paid'
2. Treasury reviews: risk_score=85 (high)
3. Fraud indicators: duplicate transaction, unusual amount
4. Treasury flags: status='flagged_fraud'
5. Investigation initiated
6. Resolution: confirm or reject

### Amount Discrepancy
1. Declared: 100,000 XAF
2. Paid: 99,500 XAF (discrepancy 500 XAF)
3. Treasury rejects: status='rejected_treasury'
4. Citizen notified: correct amount required

## Checklist

- [ ] **CRITICAL:** Add treasury_agent to user_role_enum
- [ ] Create migration 012_add_treasury_agent.sql
- [ ] Add payments.confirm permission
- [ ] Create treasury agent role with permission
- [ ] Read existing payments module
- [ ] Understand BANGE webhook flow
- [ ] Create payment validation queue API
- [ ] Implement fraud detection system
- [ ] Build treasury dashboard UI
- [ ] Add risk score visualization
- [ ] Test fraud detection accuracy
- [ ] Verify separation of duties (treasury vs DGI)
- [ ] Test with different fraud scenarios
- [ ] Add bulk confirmation for low-risk payments
- [ ] Verify audit trail completeness
