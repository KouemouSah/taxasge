-- ============================================================================
-- Migration 041: Drop fiscal_service_code from service_payments
-- ============================================================================
-- Purpose: Remove unused column. All payments now go through service_requests,
-- so fiscal_service_code is redundant. The workflow info is available via
-- JOIN to service_requests.workflow_code.
--
-- Dependencies handled:
-- 1. mv_treasury_daily_kpis (materialized view)
-- 2. chk_payment_target_xor (CHECK constraint)
-- 3. FK to fiscal_services.service_code
-- 4. idx_service_payments_service_code (index)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Drop materialized view (will be recreated without fiscal_service_code)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_treasury_daily_kpis CASCADE;

-- ============================================================================
-- 2. Drop constraints that reference fiscal_service_code
-- ============================================================================

-- Drop XOR check constraint
ALTER TABLE service_payments
DROP CONSTRAINT IF EXISTS chk_payment_target_xor;

-- Drop FK constraint to fiscal_services
ALTER TABLE service_payments
DROP CONSTRAINT IF EXISTS service_payments_fiscal_service_code_fkey;

-- ============================================================================
-- 3. Drop index on fiscal_service_code
-- ============================================================================

DROP INDEX IF EXISTS idx_service_payments_service_code;

-- ============================================================================
-- 4. Drop the column
-- ============================================================================

ALTER TABLE service_payments
DROP COLUMN IF EXISTS fiscal_service_code;

-- ============================================================================
-- 5. Add new constraint: service_request_id is now required for new payments
-- ============================================================================

-- For new records, service_request_id should be set
-- Legacy records may have NULL (migration tolerance)
ALTER TABLE service_payments
ADD CONSTRAINT chk_service_request_required
CHECK (
    service_request_id IS NOT NULL
    OR created_at < '2026-01-11'::date  -- Legacy tolerance before this migration
);

-- ============================================================================
-- 6. Recreate materialized view without fiscal_service_code
-- ============================================================================

CREATE MATERIALIZED VIEW mv_treasury_daily_kpis AS
SELECT
    -- Dimensions temporelles
    DATE(sp.created_at) as report_date,

    -- Dimensions paiement
    sp.payment_method::text as payment_method,
    sp.ministry_id,
    m.name_es as ministry_name,

    -- Dimensions service (via service_requests only now)
    sr.workflow_code as service_code,
    sr.workflow_code as service_name,

    -- Dimensions service_requests
    sr.workflow_code as workflow_code,
    sr.solicitud_type as solicitud_type,

    -- Metriques de volume
    COUNT(*) as payment_count,
    COUNT(*) FILTER (WHERE sp.workflow_status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE sp.workflow_status IN ('rejected_by_agent', 'cancelled_by_agent')) as rejected_count,
    COUNT(*) FILTER (WHERE sp.workflow_status = 'cancelled_by_user') as cancelled_by_user_count,

    -- Metriques financieres
    SUM(sp.total_amount) FILTER (WHERE sp.workflow_status = 'completed') as total_amount,
    AVG(sp.total_amount) FILTER (WHERE sp.workflow_status = 'completed') as avg_amount,
    MIN(sp.total_amount) FILTER (WHERE sp.workflow_status = 'completed') as min_amount,
    MAX(sp.total_amount) FILTER (WHERE sp.workflow_status = 'completed') as max_amount,

    -- Metriques de temps (en minutes)
    AVG(
        EXTRACT(EPOCH FROM (
            COALESCE(sp.validated_at, sp.paid_at, NOW()) - sp.created_at
        )) / 60
    ) FILTER (
        WHERE sp.workflow_status IN ('completed', 'approved_by_agent')
          AND sp.validated_at IS NOT NULL
    ) as avg_processing_minutes,

    -- Metriques SLA
    COUNT(*) FILTER (WHERE sp.sla_escalated = true) as sla_breached_count,
    COUNT(*) FILTER (WHERE sp.sla_warning_sent = true) as sla_warning_count

FROM service_payments sp
LEFT JOIN ministries m ON m.id = sp.ministry_id
LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
WHERE sp.created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY
    DATE(sp.created_at),
    sp.payment_method,
    sp.ministry_id,
    m.name_es,
    sr.workflow_code,
    sr.solicitud_type;

-- ============================================================================
-- 7. Recreate indexes on materialized view
-- ============================================================================

CREATE UNIQUE INDEX idx_mv_kpis_unique
    ON mv_treasury_daily_kpis(report_date, payment_method, COALESCE(ministry_id, 0), COALESCE(service_code, ''), COALESCE(workflow_code, ''), COALESCE(solicitud_type, ''));

CREATE INDEX idx_mv_kpis_date ON mv_treasury_daily_kpis(report_date DESC);
CREATE INDEX idx_mv_kpis_method ON mv_treasury_daily_kpis(payment_method);
CREATE INDEX idx_mv_kpis_ministry ON mv_treasury_daily_kpis(ministry_id);
CREATE INDEX idx_mv_kpis_workflow ON mv_treasury_daily_kpis(workflow_code) WHERE workflow_code IS NOT NULL;

-- ============================================================================
-- 8. Update comment
-- ============================================================================

COMMENT ON MATERIALIZED VIEW mv_treasury_daily_kpis IS
'KPIs journaliers agreges pour dashboard Treasury.
Utilise service_requests.workflow_code pour identifier le type de service.
Rafraichir via: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_treasury_daily_kpis;';

-- ============================================================================
-- 9. Recreate dependent views
-- ============================================================================

CREATE OR REPLACE VIEW v_kpi_summary AS
SELECT
    'today' as period,
    SUM(total_amount) as total_collected,
    SUM(completed_count) as total_transactions,
    AVG(avg_amount) as avg_transaction,
    SUM(sla_breached_count) as sla_breaches
FROM mv_treasury_daily_kpis
WHERE report_date = CURRENT_DATE

UNION ALL

SELECT
    'week' as period,
    SUM(total_amount),
    SUM(completed_count),
    AVG(avg_amount),
    SUM(sla_breached_count)
FROM mv_treasury_daily_kpis
WHERE report_date >= DATE_TRUNC('week', CURRENT_DATE)

UNION ALL

SELECT
    'month' as period,
    SUM(total_amount),
    SUM(completed_count),
    AVG(avg_amount),
    SUM(sla_breached_count)
FROM mv_treasury_daily_kpis
WHERE report_date >= DATE_TRUNC('month', CURRENT_DATE)

UNION ALL

SELECT
    'year' as period,
    SUM(total_amount),
    SUM(completed_count),
    AVG(avg_amount),
    SUM(sla_breached_count)
FROM mv_treasury_daily_kpis
WHERE report_date >= DATE_TRUNC('year', CURRENT_DATE);

CREATE OR REPLACE VIEW v_top_payment_methods AS
SELECT
    payment_method,
    SUM(completed_count) as transaction_count,
    SUM(total_amount) as total_amount,
    ROUND(
        SUM(total_amount)::numeric /
        NULLIF(SUM(SUM(total_amount)) OVER (), 0)::numeric * 100, 2
    ) as percentage
FROM mv_treasury_daily_kpis
WHERE report_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY payment_method
ORDER BY total_amount DESC;

CREATE OR REPLACE VIEW v_top_workflows AS
SELECT
    workflow_code,
    solicitud_type,
    SUM(completed_count) as transaction_count,
    SUM(total_amount) as total_amount,
    ROUND(
        SUM(total_amount)::numeric /
        NULLIF(SUM(SUM(total_amount)) OVER (), 0)::numeric * 100, 2
    ) as percentage
FROM mv_treasury_daily_kpis
WHERE report_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND workflow_code IS NOT NULL
GROUP BY workflow_code, solicitud_type
ORDER BY total_amount DESC
LIMIT 10;

-- ============================================================================
-- 10. Refresh materialized view
-- ============================================================================

REFRESH MATERIALIZED VIEW mv_treasury_daily_kpis;

COMMIT;
