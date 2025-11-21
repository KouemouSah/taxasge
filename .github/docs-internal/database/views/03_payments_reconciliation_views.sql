-- =====================================================================
-- PAYMENTS & RECONCILIATION VIEWS - TaxasGE Database
-- =====================================================================
-- Created: 2025-11-21
-- Purpose: Optimized views for payment processing and bank reconciliation
-- =====================================================================

-- =====================================================================
-- View 1: v_payments_lifecycle_dashboard
-- Purpose: Complete payment lifecycle tracking with declaration details
-- Usage: Payment dashboard, user payment history, admin monitoring
-- =====================================================================
CREATE OR REPLACE VIEW v_payments_lifecycle_dashboard AS
SELECT
    p.id as payment_id,
    p.tax_declaration_id,
    p.user_id,

    -- User info
    u.email as user_email,
    u.full_name as user_name,
    u.phone_number as user_phone,

    -- Declaration info
    d.declaration_type,
    d.fiscal_year,
    d.fiscal_period,
    d.calculated_tax as total_tax_amount,
    d.status as declaration_status,

    -- Payment details
    p.amount as payment_amount,
    p.payment_method,
    p.status as payment_status,
    p.bank_reference,
    p.bank_transaction_id,
    p.created_at as payment_created,
    p.paid_at,
    p.updated_at as payment_updated,

    -- Bank reconciliation status
    CASE
        WHEN p.bank_transaction_id IS NOT NULL THEN 'RECONCILED'
        WHEN p.status = 'completed' THEN 'AWAITING_RECONCILIATION'
        WHEN p.status = 'pending' THEN 'PAYMENT_PENDING'
        WHEN p.status = 'failed' THEN 'FAILED'
        ELSE 'UNKNOWN'
    END as reconciliation_status,

    -- Bank transaction info (if reconciled)
    bt.id as bank_tx_id,
    bt.bank_code,
    bt.bank_reference as bank_confirmed_reference,
    bt.bank_transaction_date,
    bt.reconciled_at,
    bt.reconciled_by,

    -- Timing metrics
    EXTRACT(EPOCH FROM (p.paid_at - p.created_at)) / 3600 as hours_to_payment,
    EXTRACT(EPOCH FROM (bt.reconciled_at - p.paid_at)) / 3600 as hours_to_reconciliation,

    -- Payment plan info (if applicable)
    pp.id as payment_plan_id,
    pp.number_of_installments,
    pp.status as plan_status,
    pp.total_paid,
    pp.remaining_balance

FROM payments p
JOIN users u ON p.user_id = u.id
JOIN tax_declarations d ON p.tax_declaration_id = d.id
LEFT JOIN bank_transactions bt ON p.bank_transaction_id = bt.id
LEFT JOIN payment_plans pp ON d.id = pp.tax_declaration_id
ORDER BY p.created_at DESC;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_status
    ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_declaration
    ON payments(tax_declaration_id);

COMMENT ON VIEW v_payments_lifecycle_dashboard IS
'Complete payment lifecycle tracking with declaration, bank reconciliation, and payment plan info.
Used for payment dashboards, user history, and admin monitoring.';


-- =====================================================================
-- View 2: v_bank_reconciliation_matching
-- Purpose: Unreconciled bank transactions with intelligent matching suggestions
-- Usage: Reconciliation UI, automated matching algorithms
-- =====================================================================
CREATE OR REPLACE VIEW v_bank_reconciliation_matching AS
SELECT
    bt.id as bank_transaction_id,
    bt.bank_code,
    bt.bank_reference,
    bt.bank_transaction_date,
    bt.amount as bank_amount,
    bt.currency,
    bt.account_number,
    bt.account_holder_name as bank_account_holder,
    bt.raw_data as bank_raw_data,
    bt.created_at as received_at,

    -- Days unreconciled
    EXTRACT(DAY FROM NOW() - bt.created_at) as days_unreconciled,

    -- Urgency level
    CASE
        WHEN EXTRACT(DAY FROM NOW() - bt.created_at) > 7 THEN 'HIGH'
        WHEN EXTRACT(DAY FROM NOW() - bt.created_at) > 3 THEN 'MEDIUM'
        ELSE 'LOW'
    END as urgency_level,

    -- Suggested matches: payments with same amount and similar timing
    (
        SELECT json_agg(
            json_build_object(
                'payment_id', matches.payment_id,
                'user_name', matches.user_name,
                'user_email', matches.user_email,
                'amount', matches.amount,
                'bank_reference', matches.bank_reference,
                'paid_at', matches.paid_at,
                'declaration_type', matches.declaration_type,
                'match_score', matches.match_score
            )
        )
        FROM (
            SELECT
                p.id as payment_id,
                u.full_name as user_name,
                u.email as user_email,
                p.amount,
                p.bank_reference,
                p.paid_at,
                d.declaration_type,
                CASE
                    WHEN p.bank_reference = bt.bank_reference THEN 100
                    WHEN p.amount = bt.amount THEN 80
                    WHEN ABS(p.amount - bt.amount) < 100 THEN 60
                    ELSE 40
                END as match_score
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN tax_declarations d ON p.tax_declaration_id = d.id
            WHERE p.bank_transaction_id IS NULL
            AND p.status = 'completed'
            AND ABS(p.amount - bt.amount) < 1000  -- Within 1000 CFA tolerance
            AND ABS(EXTRACT(EPOCH FROM (p.paid_at - bt.bank_transaction_date))) < 86400 * 3  -- Within 3 days
            ORDER BY
                CASE
                    WHEN p.bank_reference = bt.bank_reference THEN 1
                    WHEN p.amount = bt.amount THEN 2
                    ELSE 3
                END
            LIMIT 5
        ) matches
    ) as suggested_matches,

    -- Match count
    (
        SELECT COUNT(*)
        FROM payments p
        WHERE p.bank_transaction_id IS NULL
        AND p.status = 'completed'
        AND ABS(p.amount - bt.amount) < 1000
        AND ABS(EXTRACT(EPOCH FROM (p.paid_at - bt.bank_transaction_date))) < 86400 * 3
    ) as potential_matches_count

FROM bank_transactions bt
WHERE bt.payment_id IS NULL  -- Unreconciled
ORDER BY
    CASE
        WHEN EXTRACT(DAY FROM NOW() - bt.created_at) > 7 THEN 1
        WHEN EXTRACT(DAY FROM NOW() - bt.created_at) > 3 THEN 2
        ELSE 3
    END,
    bt.created_at ASC;

COMMENT ON VIEW v_bank_reconciliation_matching IS
'Unreconciled bank transactions with intelligent matching suggestions.
Uses amount, reference, and timing to suggest payment matches with confidence scores.';


-- =====================================================================
-- View 3: v_payment_plans_tracking
-- Purpose: Payment plan schedules with installment status
-- Usage: Payment plan dashboard, reminder scheduling
-- =====================================================================
CREATE OR REPLACE VIEW v_payment_plans_tracking AS
WITH installment_stats AS (
    SELECT
        payment_plan_id,
        COUNT(*) as total_installments,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as installments_paid,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as remaining_installments,
        MIN(CASE WHEN status = 'pending' THEN due_date END) as next_due_date
    FROM payment_installments
    GROUP BY payment_plan_id
)
SELECT
    pp.id as plan_id,
    pp.tax_declaration_id,

    -- User info (from declaration)
    d.user_id,
    u.full_name as user_name,
    u.email as user_email,
    u.phone_number as user_phone,

    -- Declaration info
    d.declaration_type,
    d.fiscal_year,
    d.calculated_tax as total_tax,

    -- Plan details
    pp.total_amount,
    pp.number_of_installments as total_installments,
    ist.installments_paid,
    ist.remaining_installments,
    pp.installment_amount,
    pp.first_installment_due_date as start_date,
    ist.next_due_date,
    pp.status as plan_status,
    pp.created_at as plan_created,

    -- Progress metrics
    ROUND(
        (ist.installments_paid::numeric / NULLIF(pp.number_of_installments, 0)) * 100,
        2
    ) as completion_percentage,

    -- Amount tracking
    pp.total_paid as amount_paid_so_far,
    pp.remaining_balance as amount_remaining,

    -- Status calculations
    CASE
        WHEN pp.status = 'completed' THEN 'COMPLETED'
        WHEN pp.status = 'cancelled' THEN 'CANCELLED'
        WHEN ist.next_due_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN ist.next_due_date = CURRENT_DATE THEN 'DUE_TODAY'
        WHEN ist.next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_SOON'
        ELSE 'ACTIVE'
    END as payment_status,

    -- Days until next payment
    EXTRACT(DAY FROM (ist.next_due_date - CURRENT_DATE)) as days_until_next_payment,

    -- Get last 3 installment payments
    (
        SELECT json_agg(
            json_build_object(
                'installment_number', i.installment_number,
                'amount', i.amount,
                'due_date', i.due_date,
                'paid_at', i.paid_at,
                'status', i.status
            )
            ORDER BY i.installment_number DESC
        )
        FROM payment_installments i
        WHERE i.payment_plan_id = pp.id
        AND i.status = 'paid'
        ORDER BY i.installment_number DESC
        LIMIT 3
    ) as recent_payments,

    -- Get upcoming installments
    (
        SELECT json_agg(
            json_build_object(
                'installment_number', i.installment_number,
                'amount', i.amount,
                'due_date', i.due_date,
                'status', i.status
            )
            ORDER BY i.due_date ASC
        )
        FROM payment_installments i
        WHERE i.payment_plan_id = pp.id
        AND i.status = 'pending'
        ORDER BY i.due_date ASC
        LIMIT 3
    ) as upcoming_installments

FROM payment_plans pp
JOIN installment_stats ist ON pp.id = ist.payment_plan_id
JOIN tax_declarations d ON pp.tax_declaration_id = d.id
JOIN users u ON d.user_id = u.id
WHERE pp.status IN ('active', 'overdue')
ORDER BY
    CASE
        WHEN ist.next_due_date < CURRENT_DATE THEN 1
        WHEN ist.next_due_date = CURRENT_DATE THEN 2
        WHEN ist.next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 3
        ELSE 4
    END,
    ist.next_due_date ASC;

COMMENT ON VIEW v_payment_plans_tracking IS
'Active payment plans with installment tracking, progress metrics, and due date monitoring.
Used for payment reminders, dashboard, and collection management.';


-- =====================================================================
-- View 4: v_revenue_analytics
-- Purpose: Revenue aggregations by period, type, and method
-- Usage: Financial reporting, analytics dashboard
-- =====================================================================
CREATE OR REPLACE VIEW v_revenue_analytics AS
SELECT
    -- Time dimensions
    DATE_TRUNC('day', p.paid_at) as payment_date,
    DATE_TRUNC('week', p.paid_at) as payment_week,
    DATE_TRUNC('month', p.paid_at) as payment_month,
    DATE_TRUNC('quarter', p.paid_at) as payment_quarter,
    DATE_TRUNC('year', p.paid_at) as payment_year,

    -- Declaration type
    d.declaration_type,

    -- Payment method
    p.payment_method,

    -- Aggregated metrics
    COUNT(p.id) as total_payments,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as avg_payment_amount,
    MIN(p.amount) as min_payment,
    MAX(p.amount) as max_payment,

    -- Reconciliation status
    COUNT(CASE WHEN p.bank_transaction_id IS NOT NULL THEN 1 END) as reconciled_count,
    COUNT(CASE WHEN p.bank_transaction_id IS NULL THEN 1 END) as unreconciled_count,
    SUM(CASE WHEN p.bank_transaction_id IS NOT NULL THEN p.amount ELSE 0 END) as reconciled_amount,
    SUM(CASE WHEN p.bank_transaction_id IS NULL THEN p.amount ELSE 0 END) as unreconciled_amount,

    -- Reconciliation rate
    ROUND(
        (COUNT(CASE WHEN p.bank_transaction_id IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(p.id), 0)) * 100,
        2
    ) as reconciliation_rate_percentage,

    -- Payment timing
    AVG(EXTRACT(EPOCH FROM (p.paid_at - p.created_at)) / 3600) as avg_hours_to_payment,

    -- Unique users
    COUNT(DISTINCT p.user_id) as unique_payers

FROM payments p
JOIN tax_declarations d ON p.tax_declaration_id = d.id
WHERE p.status = 'completed'
AND p.paid_at IS NOT NULL
GROUP BY
    DATE_TRUNC('day', p.paid_at),
    DATE_TRUNC('week', p.paid_at),
    DATE_TRUNC('month', p.paid_at),
    DATE_TRUNC('quarter', p.paid_at),
    DATE_TRUNC('year', p.paid_at),
    d.declaration_type,
    p.payment_method
ORDER BY payment_date DESC;

COMMENT ON VIEW v_revenue_analytics IS
'Revenue analytics with time-series aggregations by declaration type and payment method.
Used for financial reporting, trends analysis, and reconciliation monitoring.';


-- =====================================================================
-- View 5: v_failed_payments_recovery
-- Purpose: Failed payments with retry recommendations
-- Usage: Payment recovery queue, retry scheduling
-- =====================================================================
CREATE OR REPLACE VIEW v_failed_payments_recovery AS
SELECT
    p.id as payment_id,
    p.tax_declaration_id,
    p.user_id,

    -- User info
    u.full_name as user_name,
    u.email as user_email,
    u.phone_number as user_phone,

    -- Declaration info
    d.declaration_type,
    d.fiscal_year,
    d.calculated_tax as total_tax,
    d.status as declaration_status,

    -- Payment details
    p.amount as payment_amount,
    p.payment_method,
    p.bank_reference,
    p.created_at as payment_created,
    p.updated_at as last_attempt,

    -- Failure analysis
    EXTRACT(DAY FROM NOW() - p.created_at) as days_since_failure,

    -- Priority calculation
    CASE
        WHEN p.amount >= 10000000 THEN 'CRITICAL'  -- >= 10M CFA
        WHEN p.amount >= 1000000 THEN 'HIGH'       -- >= 1M CFA
        WHEN p.amount >= 100000 THEN 'MEDIUM'      -- >= 100K CFA
        ELSE 'LOW'
    END as recovery_priority,

    -- Retry recommendation
    CASE
        WHEN EXTRACT(DAY FROM NOW() - p.created_at) > 30 THEN 'ESCALATE_TO_COLLECTION'
        WHEN EXTRACT(DAY FROM NOW() - p.updated_at) > 7 THEN 'RETRY_NOW'
        WHEN EXTRACT(DAY FROM NOW() - p.updated_at) > 3 THEN 'SCHEDULE_RETRY'
        ELSE 'MONITOR'
    END as recommended_action,

    -- User payment history
    (
        SELECT json_build_object(
            'total_payments', COUNT(*),
            'successful_payments', COUNT(CASE WHEN status = 'completed' THEN 1 END),
            'failed_payments', COUNT(CASE WHEN status = 'failed' THEN 1 END),
            'success_rate', ROUND(
                (COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
                2
            ),
            'total_amount_paid', SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END),
            'preferred_method', MODE() WITHIN GROUP (ORDER BY payment_method)
        )
        FROM payments p2
        WHERE p2.user_id = p.user_id
    ) as user_payment_profile,

    -- Contact attempts
    EXTRACT(DAY FROM NOW() - p.updated_at) as days_since_last_contact

FROM payments p
JOIN users u ON p.user_id = u.id
JOIN tax_declarations d ON p.tax_declaration_id = d.id
WHERE p.status = 'failed'
ORDER BY
    CASE
        WHEN p.amount >= 10000000 THEN 1
        WHEN p.amount >= 1000000 THEN 2
        WHEN p.amount >= 100000 THEN 3
        ELSE 4
    END,
    p.created_at ASC;

COMMENT ON VIEW v_failed_payments_recovery IS
'Failed payments with recovery priority, retry recommendations, and user payment history.
Used for payment recovery operations and collection management.';


-- =====================================================================
-- View 6: v_reconciliation_health_metrics
-- Purpose: Overall reconciliation health monitoring
-- Usage: Finance dashboard, system monitoring
-- =====================================================================
CREATE OR REPLACE VIEW v_reconciliation_health_metrics AS
SELECT
    -- Current snapshot
    NOW() as snapshot_time,

    -- Bank transactions metrics
    (SELECT COUNT(*) FROM bank_transactions WHERE payment_id IS NULL) as unreconciled_transactions,
    (SELECT COUNT(*) FROM bank_transactions WHERE payment_id IS NOT NULL) as reconciled_transactions,
    (SELECT SUM(amount) FROM bank_transactions WHERE payment_id IS NULL) as unreconciled_amount,
    (SELECT SUM(amount) FROM bank_transactions WHERE payment_id IS NOT NULL) as reconciled_amount,

    -- Payments metrics
    (SELECT COUNT(*) FROM payments WHERE status = 'completed' AND bank_transaction_id IS NULL) as unmatched_payments,
    (SELECT COUNT(*) FROM payments WHERE status = 'completed' AND bank_transaction_id IS NOT NULL) as matched_payments,
    (SELECT SUM(amount) FROM payments WHERE status = 'completed' AND bank_transaction_id IS NULL) as unmatched_payment_amount,

    -- Aging analysis
    (SELECT COUNT(*) FROM bank_transactions
     WHERE payment_id IS NULL
     AND EXTRACT(DAY FROM NOW() - created_at) > 7) as unreconciled_over_7_days,

    (SELECT COUNT(*) FROM bank_transactions
     WHERE payment_id IS NULL
     AND EXTRACT(DAY FROM NOW() - created_at) > 30) as unreconciled_over_30_days,

    -- Reconciliation rate (last 30 days)
    (
        SELECT ROUND(
            (COUNT(CASE WHEN payment_id IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
            2
        )
        FROM bank_transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
    ) as reconciliation_rate_30d,

    -- Average reconciliation time (hours)
    (
        SELECT AVG(EXTRACT(EPOCH FROM (reconciled_at - created_at)) / 3600)
        FROM bank_transactions
        WHERE reconciled_at IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
    ) as avg_reconciliation_hours_30d,

    -- Today's activity
    (SELECT COUNT(*) FROM bank_transactions WHERE DATE(created_at) = CURRENT_DATE) as transactions_today,
    (SELECT COUNT(*) FROM bank_transactions WHERE DATE(reconciled_at) = CURRENT_DATE) as reconciled_today;

COMMENT ON VIEW v_reconciliation_health_metrics IS
'Real-time reconciliation health metrics for monitoring and alerting.
Single-row view providing comprehensive reconciliation status snapshot.';
