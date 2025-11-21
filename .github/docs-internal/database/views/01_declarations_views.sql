-- =====================================================================
-- DECLARATIONS VIEWS - TaxasGE Database
-- =====================================================================
-- Created: 2025-11-21
-- Purpose: Optimized views for tax declarations with complete details
-- =====================================================================

-- =====================================================================
-- View 1: v_declarations_complete
-- Purpose: Complete declaration details with type-specific data
-- Usage: Main dashboard, declaration listing with all info
-- =====================================================================
CREATE OR REPLACE VIEW v_declarations_complete AS
SELECT
    d.id,
    d.user_id,
    d.declaration_type,
    d.fiscal_year,
    d.fiscal_period,
    d.status,
    d.taxable_base,
    d.calculated_tax,
    d.net_tax_due,

    -- Payment aggregation from payments table
    COALESCE(
        (SELECT SUM(p2.amount)
         FROM payments p2
         WHERE p2.tax_declaration_id = d.id AND p2.status = 'completed'),
        0
    ) as amount_paid,

    -- Calculate remaining amount due
    (d.net_tax_due - COALESCE(
        (SELECT SUM(p2.amount)
         FROM payments p2
         WHERE p2.tax_declaration_id = d.id AND p2.status = 'completed'),
        0
    )) as amount_due,
    d.submitted_at,
    d.processed_at,
    d.created_at,
    d.updated_at,

    -- User info
    u.email as user_email,
    u.full_name as user_name,
    u.phone_number as user_phone,

    -- IVA details (if applicable)
    iva.iva_dev_014_total as iva_total_devengado,
    iva.iva_ded_07_total as iva_total_deducible,
    iva.calculated_amount as iva_calculated_amount,
    iva.final_amount as iva_final_amount,
    iva.total_a_ingresar as iva_total_a_ingresar,
    iva.iva_subtype,

    -- IRPF details (if applicable)
    irpf.total_revenus_bruts as irpf_gross_income,
    irpf.total_deductions as irpf_deductions,
    irpf.base_liquidable as irpf_taxable_income,
    irpf.tipo_gravamen as irpf_tax_rate,
    irpf.retenues_a_la_source as irpf_tax_withheld,
    irpf.calculated_amount as irpf_calculated_amount,
    irpf.final_amount as irpf_final_amount,
    irpf.total_a_ingresar as irpf_total_a_ingresar,

    -- Petroliferos details (if applicable)
    petro.petroleum_declaration_subtype as petro_subtype,
    petro.cantidad_producto as petro_quantity,
    petro.unidad_medida as petro_unit,
    petro.precio_unitario as petro_unit_price,
    petro.calculated_amount as petro_calculated_amount,
    petro.final_amount as petro_final_amount,
    petro.total_a_ingresar as petro_total_a_ingresar,

    -- Retencion details (if applicable)
    ret.retencion_subtype,
    ret.tasa_retencion as retencion_rate,
    ret.total_servicios_sujetos as retencion_services_subject,
    ret.sub_total as retencion_subtotal,
    ret.total_a_ingresar as retencion_total_a_ingresar,

    -- Payment info
    p.id as payment_id,
    p.payment_method,
    p.paid_at,
    p.bank_reference,

    -- Agent assignment
    a.id as assignment_id,
    a.agent_id,
    u_agent.full_name as agent_name,
    a.assigned_at,
    a.status as assignment_status

FROM tax_declarations d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN declaration_iva_details iva ON d.id = iva.tax_declaration_id
LEFT JOIN declaration_irpf_data irpf ON d.id = irpf.tax_declaration_id
LEFT JOIN declaration_petroliferos_details petro ON d.id = petro.tax_declaration_id
LEFT JOIN declaration_retencion_details ret ON d.id = ret.tax_declaration_id
LEFT JOIN payments p ON d.id = p.tax_declaration_id
LEFT JOIN assignments a ON d.id = a.declaration_id AND a.status IN ('assigned', 'in_progress')
LEFT JOIN ministry_agents ma ON a.agent_id = ma.user_id
LEFT JOIN users u_agent ON ma.user_id = u_agent.id;

-- Index recommendations for performance
CREATE INDEX IF NOT EXISTS idx_tax_declarations_user_status
    ON tax_declarations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_type_status
    ON tax_declarations(declaration_type, status);

COMMENT ON VIEW v_declarations_complete IS
'Complete declaration view with all type-specific details, user info, payments, and agent assignments.
Optimized for dashboard and listing pages. Use with WHERE clauses to filter by user_id or status.';


-- =====================================================================
-- View 2: v_declarations_pending_review
-- Purpose: Declarations waiting for agent review with priority
-- Usage: Agent assignment queue, admin dashboard
-- =====================================================================
CREATE OR REPLACE VIEW v_declarations_pending_review AS
SELECT
    d.id,
    d.declaration_type,
    d.user_id,
    u.full_name as user_name,
    u.email as user_email,
    d.taxable_base,
    d.calculated_tax,
    d.submitted_at,
    d.created_at,

    -- Priority calculation (higher amount = higher priority)
    CASE
        WHEN d.calculated_tax >= 10000000 THEN 'HIGH'
        WHEN d.calculated_tax >= 1000000 THEN 'MEDIUM'
        ELSE 'LOW'
    END as priority,

    -- Days waiting
    EXTRACT(DAY FROM NOW() - d.submitted_at) as days_waiting,

    -- SLA status
    CASE
        WHEN EXTRACT(HOUR FROM NOW() - d.submitted_at) > 24 THEN 'OVERDUE'
        WHEN EXTRACT(HOUR FROM NOW() - d.submitted_at) > 20 THEN 'AT_RISK'
        ELSE 'ON_TIME'
    END as sla_status,

    -- Assignment check
    CASE
        WHEN EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.declaration_id = d.id AND a.status IN ('pending', 'in_progress')
        ) THEN TRUE
        ELSE FALSE
    END as has_active_assignment

FROM tax_declarations d
JOIN users u ON d.user_id = u.id
WHERE d.status IN ('submitted', 'processing')
ORDER BY
    CASE
        WHEN d.calculated_tax >= 10000000 THEN 1
        WHEN d.calculated_tax >= 1000000 THEN 2
        ELSE 3
    END,
    d.submitted_at ASC;

COMMENT ON VIEW v_declarations_pending_review IS
'Declarations pending agent review with priority and SLA tracking.
Used for intelligent agent assignment and workload distribution.';


-- =====================================================================
-- View 3: v_declarations_with_payments
-- Purpose: Declarations with payment status and reconciliation info
-- Usage: Finance dashboard, payment reconciliation
-- =====================================================================
CREATE OR REPLACE VIEW v_declarations_with_payments AS
SELECT
    d.id as declaration_id,
    d.declaration_type,
    d.user_id,
    u.full_name as user_name,
    d.fiscal_year,
    d.fiscal_period,
    d.calculated_tax,
    d.net_tax_due,

    -- Payment aggregation
    COALESCE(
        (SELECT SUM(p2.amount)
         FROM payments p2
         WHERE p2.tax_declaration_id = d.id AND p2.status = 'completed'),
        0
    ) as amount_paid,

    -- Calculate remaining amount due
    (d.net_tax_due - COALESCE(
        (SELECT SUM(p2.amount)
         FROM payments p2
         WHERE p2.tax_declaration_id = d.id AND p2.status = 'completed'),
        0
    )) as amount_due,

    -- Payment status
    CASE
        WHEN (d.net_tax_due - COALESCE(
            (SELECT SUM(p2.amount)
             FROM payments p2
             WHERE p2.tax_declaration_id = d.id AND p2.status = 'completed'),
            0
        )) <= 0 THEN 'FULLY_PAID'
        WHEN COALESCE(
            (SELECT SUM(p2.amount)
             FROM payments p2
             WHERE p2.tax_declaration_id = d.id AND p2.status = 'completed'),
            0
        ) > 0 THEN 'PARTIALLY_PAID'
        ELSE 'UNPAID'
    END as payment_status,

    -- Payment details
    p.id as payment_id,
    p.payment_method,
    p.amount as payment_amount,
    p.bank_reference,
    p.paid_at,
    p.status as payment_status_detail,

    -- Bank reconciliation
    bt.id as bank_transaction_id,
    bt.bank_code,
    bt.bank_reference as bank_confirmed_reference,
    bt.bank_transaction_date,
    bt.reconciled_at,
    bt.reconciled_by_user_id,

    -- Payment plan info
    pp.id as payment_plan_id,
    pp.number_of_installments,
    pp.status as payment_plan_status,

    -- Calculate installments paid from payment_installments
    (SELECT COUNT(*)
     FROM payment_installments pi
     WHERE pi.payment_plan_id = pp.id AND pi.paid_at IS NOT NULL) as installments_paid,

    -- Get next due date from payment_installments
    (SELECT MIN(pi.due_date)
     FROM payment_installments pi
     WHERE pi.payment_plan_id = pp.id AND pi.paid_at IS NULL) as next_due_date

FROM tax_declarations d
JOIN users u ON d.user_id = u.id
LEFT JOIN payments p ON d.id = p.tax_declaration_id
LEFT JOIN bank_transactions bt ON p.bank_transaction_id = bt.id
LEFT JOIN payment_plans pp ON d.id = pp.tax_declaration_id
WHERE d.calculated_tax > 0
ORDER BY d.created_at DESC;

COMMENT ON VIEW v_declarations_with_payments IS
'Declarations with complete payment and reconciliation information.
Includes bank transaction details and payment plan status. Used for finance operations.';


-- =====================================================================
-- View 4: v_declaration_statistics_by_type
-- Purpose: Aggregated statistics by declaration type
-- Usage: Analytics dashboard, reporting
-- =====================================================================
CREATE OR REPLACE VIEW v_declaration_statistics_by_type AS
WITH declaration_payments AS (
    SELECT
        d.id,
        d.declaration_type,
        d.status,
        d.calculated_tax,
        d.net_tax_due,
        d.processed_at,
        d.submitted_at,
        d.created_at,
        COALESCE(
            (SELECT SUM(p.amount)
             FROM payments p
             WHERE p.tax_declaration_id = d.id AND p.status = 'completed'),
            0
        ) as amount_paid
    FROM tax_declarations d
)
SELECT
    declaration_type,

    -- Counts
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,

    -- Amounts
    SUM(calculated_tax) as total_tax_calculated,
    SUM(net_tax_due) as total_net_tax_due,
    SUM(amount_paid) as total_amount_paid,
    SUM(net_tax_due - amount_paid) as total_amount_due,
    AVG(calculated_tax) as avg_tax_per_declaration,

    -- Timing
    AVG(EXTRACT(EPOCH FROM (processed_at - submitted_at)) / 3600) as avg_processing_hours,

    -- Current month
    COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN 1 END) as count_current_month,
    SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN calculated_tax ELSE 0 END) as revenue_current_month

FROM declaration_payments
GROUP BY declaration_type
ORDER BY total_count DESC;

COMMENT ON VIEW v_declaration_statistics_by_type IS
'Aggregated statistics by declaration type for analytics and reporting.
Updated in real-time as declarations are created/processed.';
