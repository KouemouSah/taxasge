-- =====================================================================
-- AGENTS & WORKLOAD VIEWS - TaxasGE Database
-- =====================================================================
-- Created: 2025-11-21
-- Purpose: Optimized views for agent workload and performance tracking
-- =====================================================================

-- =====================================================================
-- View 1: v_agents_workload_dashboard
-- Purpose: Real-time agent workload with capacity and performance metrics
-- Usage: Agent management dashboard, assignment algorithm
-- =====================================================================
CREATE OR REPLACE VIEW v_agents_workload_dashboard AS
SELECT
    ma.id as agent_id,
    ma.user_id,
    ma.full_name as agent_name,
    ma.email as agent_email,
    ma.ministry_id,
    m.name_es as ministry_name,
    ma.sectors_of_competence,
    ma.is_active,
    ma.availability_status,

    -- Workload metrics
    aw.current_assignments,
    aw.max_concurrent_assignments,
    aw.assignments_in_progress,
    aw.assignments_pending,
    aw.total_completed,

    -- Capacity calculation
    ROUND(
        (aw.current_assignments::numeric / NULLIF(aw.max_concurrent_assignments, 0)) * 100,
        2
    ) as capacity_percentage,

    CASE
        WHEN aw.current_assignments >= aw.max_concurrent_assignments THEN 'FULL'
        WHEN aw.current_assignments >= (aw.max_concurrent_assignments * 0.8) THEN 'HIGH'
        WHEN aw.current_assignments >= (aw.max_concurrent_assignments * 0.5) THEN 'MEDIUM'
        ELSE 'LOW'
    END as load_level,

    -- Availability for new assignments
    (aw.max_concurrent_assignments - aw.current_assignments) as available_capacity,
    CASE
        WHEN ma.is_active = false THEN FALSE
        WHEN ma.availability_status != 'available' THEN FALSE
        WHEN aw.current_assignments >= aw.max_concurrent_assignments THEN FALSE
        ELSE TRUE
    END as can_accept_new_assignments,

    -- Performance metrics
    aps.total_assignments_completed,
    aps.total_processing_time_hours,
    aps.avg_processing_time_hours,
    aps.approval_rate,
    aps.rejection_rate,
    aps.quality_score,

    -- Time metrics
    EXTRACT(EPOCH FROM (NOW() - aw.updated_at)) / 3600 as hours_since_last_update,
    aw.updated_at as last_workload_update

FROM ministry_agents ma
JOIN ministries m ON ma.ministry_id = m.id
LEFT JOIN agent_workloads aw ON ma.id = aw.agent_id
LEFT JOIN agent_performance_stats aps ON ma.id = aps.agent_id
ORDER BY capacity_percentage ASC, ma.is_active DESC;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_agents_active_availability
    ON ministry_agents(is_active, availability_status)
    WHERE is_active = TRUE;

COMMENT ON VIEW v_agents_workload_dashboard IS
'Real-time agent workload dashboard with capacity, performance metrics, and assignment availability.
Used for intelligent load balancing and agent selection algorithms.';


-- =====================================================================
-- View 2: v_available_agents_by_ministry
-- Purpose: Available agents grouped by ministry with capacity details
-- Usage: Assignment algorithm, agent selection UI
-- =====================================================================
CREATE OR REPLACE VIEW v_available_agents_by_ministry AS
SELECT
    m.id as ministry_id,
    m.code as ministry_code,
    m.name_es as ministry_name,

    -- Agent counts
    COUNT(ma.id) as total_agents,
    COUNT(CASE WHEN ma.is_active = TRUE THEN 1 END) as active_agents,
    COUNT(CASE
        WHEN ma.is_active = TRUE
        AND ma.availability_status = 'available'
        AND aw.current_assignments < aw.max_concurrent_assignments
        THEN 1
    END) as available_agents,

    -- Capacity metrics
    SUM(aw.max_concurrent_assignments) as total_capacity,
    SUM(aw.current_assignments) as current_load,
    SUM(aw.max_concurrent_assignments - aw.current_assignments) as available_capacity,

    -- Load percentage
    ROUND(
        (SUM(aw.current_assignments)::numeric / NULLIF(SUM(aw.max_concurrent_assignments), 0)) * 100,
        2
    ) as ministry_load_percentage,

    -- Performance average
    AVG(aps.quality_score) as avg_quality_score,
    AVG(aps.avg_processing_time_hours) as avg_processing_hours

FROM ministries m
LEFT JOIN ministry_agents ma ON m.id = ma.ministry_id
LEFT JOIN agent_workloads aw ON ma.id = aw.agent_id
LEFT JOIN agent_performance_stats aps ON ma.id = aps.agent_id
WHERE m.is_active = TRUE
GROUP BY m.id, m.code, m.name_es
ORDER BY available_capacity DESC;

COMMENT ON VIEW v_available_agents_by_ministry IS
'Aggregated view of agent availability by ministry.
Used for cross-ministry workload balancing and capacity planning.';


-- =====================================================================
-- View 3: v_agent_assignment_history
-- Purpose: Complete assignment history with timing and outcomes
-- Usage: Agent performance reviews, audit trail
-- =====================================================================
CREATE OR REPLACE VIEW v_agent_assignment_history AS
SELECT
    a.id as assignment_id,
    a.declaration_id,
    a.agent_id,
    ma.full_name as agent_name,
    ma.ministry_id,
    m.name_es as ministry_name,

    -- Declaration info
    d.declaration_type,
    d.calculated_tax as declaration_amount,
    d.status as declaration_status,

    -- Assignment details
    a.status as assignment_status,
    a.assigned_at,
    a.started_at,
    a.completed_at,
    a.assigned_by_user_id,
    a.priority,
    a.notes,

    -- Timing metrics
    EXTRACT(EPOCH FROM (a.started_at - a.assigned_at)) / 3600 as hours_to_start,
    EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) / 3600 as hours_to_complete,
    EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600 as total_hours,

    -- Outcome
    CASE
        WHEN d.status = 'accepted' THEN 'APPROVED'
        WHEN d.status = 'rejected' THEN 'REJECTED'
        WHEN a.status = 'completed' THEN 'COMPLETED'
        WHEN a.status = 'reassigned' THEN 'REASSIGNED'
        ELSE 'IN_PROGRESS'
    END as outcome,

    -- SLA compliance
    CASE
        WHEN a.completed_at IS NOT NULL AND
             EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600 <= 24
        THEN TRUE
        ELSE FALSE
    END as met_sla

FROM assignments a
JOIN ministry_agents ma ON a.agent_id = ma.id
JOIN ministries m ON ma.ministry_id = m.id
JOIN tax_declarations d ON a.declaration_id = d.id
ORDER BY a.assigned_at DESC;

COMMENT ON VIEW v_agent_assignment_history IS
'Complete assignment history with timing, outcomes, and SLA compliance.
Used for performance reviews and process optimization.';


-- =====================================================================
-- View 4: v_agent_performance_rankings
-- Purpose: Agent rankings by performance metrics
-- Usage: Performance reviews, bonuses, gamification
-- =====================================================================
CREATE OR REPLACE VIEW v_agent_performance_rankings AS
WITH agent_stats AS (
    SELECT
        ma.id as agent_id,
        ma.full_name,
        ma.ministry_id,
        m.name_es as ministry_name,

        -- Performance metrics
        aps.total_assignments_completed,
        aps.approval_rate,
        aps.avg_processing_time_hours,
        aps.quality_score,

        -- Calculate composite score (0-100)
        (
            (aps.quality_score * 0.4) +
            (aps.approval_rate * 0.3) +
            (CASE
                WHEN aps.avg_processing_time_hours <= 12 THEN 30
                WHEN aps.avg_processing_time_hours <= 18 THEN 20
                WHEN aps.avg_processing_time_hours <= 24 THEN 10
                ELSE 0
            END)
        ) as performance_score

    FROM ministry_agents ma
    JOIN ministries m ON ma.ministry_id = m.ministry_id
    LEFT JOIN agent_performance_stats aps ON ma.id = aps.agent_id
    WHERE ma.is_active = TRUE
    AND aps.total_assignments_completed > 0
)
SELECT
    agent_id,
    full_name,
    ministry_id,
    ministry_name,
    total_assignments_completed,
    approval_rate,
    avg_processing_time_hours,
    quality_score,
    ROUND(performance_score, 2) as performance_score,

    -- Rankings
    ROW_NUMBER() OVER (ORDER BY performance_score DESC) as overall_rank,
    ROW_NUMBER() OVER (
        PARTITION BY ministry_id
        ORDER BY performance_score DESC
    ) as ministry_rank,

    -- Performance tier
    CASE
        WHEN performance_score >= 80 THEN 'EXCELLENT'
        WHEN performance_score >= 60 THEN 'GOOD'
        WHEN performance_score >= 40 THEN 'AVERAGE'
        ELSE 'NEEDS_IMPROVEMENT'
    END as performance_tier

FROM agent_stats
ORDER BY performance_score DESC;

COMMENT ON VIEW v_agent_performance_rankings IS
'Agent performance rankings with composite scoring across quality, approval rate, and speed.
Used for performance reviews, bonuses, and agent development programs.';


-- =====================================================================
-- View 5: v_agent_work_queue_priority
-- Purpose: Prioritized work queue for agent assignment
-- Usage: Auto-assignment algorithm, work distribution
-- =====================================================================
CREATE OR REPLACE VIEW v_agent_work_queue_priority AS
SELECT
    awq.id as queue_id,
    awq.ministry_id,
    m.name_es as ministry_name,
    awq.declaration_id,
    d.declaration_type,
    d.calculated_tax,

    -- Priority calculation
    awq.calculated_priority,
    awq.complexity_score,
    awq.amount_score,
    awq.sla_score,

    -- Time metrics
    awq.created_at as queued_at,
    EXTRACT(EPOCH FROM (NOW() - awq.created_at)) / 3600 as hours_in_queue,

    -- Recommended agent (if locked)
    awq.locked_for_agent_id,
    ma.full_name as locked_agent_name,
    awq.locked_until,

    -- Status
    CASE
        WHEN awq.locked_for_agent_id IS NOT NULL AND awq.locked_until > NOW()
        THEN 'LOCKED'
        WHEN awq.locked_for_agent_id IS NOT NULL AND awq.locked_until <= NOW()
        THEN 'LOCK_EXPIRED'
        ELSE 'AVAILABLE'
    END as queue_status,

    -- Available agents for this ministry
    (
        SELECT COUNT(*)
        FROM ministry_agents ma2
        JOIN agent_workloads aw2 ON ma2.id = aw2.agent_id
        WHERE ma2.ministry_id = awq.ministry_id
        AND ma2.is_active = TRUE
        AND ma2.availability_status = 'available'
        AND aw2.current_assignments < aw2.max_concurrent_assignments
    ) as available_agents_count

FROM agent_work_queue awq
JOIN ministries m ON awq.ministry_id = m.ministry_id
JOIN tax_declarations d ON awq.declaration_id = d.id
LEFT JOIN ministry_agents ma ON awq.locked_for_agent_id = ma.id
WHERE awq.status = 'pending'
ORDER BY awq.calculated_priority DESC, awq.created_at ASC;

COMMENT ON VIEW v_agent_work_queue_priority IS
'Prioritized work queue with smart assignment recommendations and agent availability.
Used by auto-assignment algorithm for optimal work distribution.';
