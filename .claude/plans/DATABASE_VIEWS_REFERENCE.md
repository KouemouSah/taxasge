# Database Views Reference for Dashboard Widgets

**Extracted on:** 2026-01-26
**Source:** Direct database query (Supabase PostgreSQL)

---

## Summary

| Type | Count |
|------|-------|
| Views | 60 |
| Materialized Views | 21 |

---

## Views for Agent Widgets

### v_agent_performance_summary
Performance metrics for individual agents.

| Column | Type | Description |
|--------|------|-------------|
| agent_profile_id | uuid | Agent profile ID |
| user_id | uuid | User ID |
| agent_type | varchar | Agent type |
| agent_role | varchar | Agent role |
| is_supervisor | boolean | Is supervisor |
| ministry_id | integer | Ministry ID |
| agent_name | varchar | Agent name |
| ministry_name | varchar | Ministry name |
| current_month_processed | integer | Processed this month |
| current_month_approved | integer | Approved this month |
| current_month_rejected | integer | Rejected this month |
| current_month_escalated | integer | Escalated this month |
| avg_processing_minutes | numeric | Avg processing time |
| sla_respected_count | integer | SLA respected count |
| sla_missed_count | integer | SLA missed count |
| sla_respect_percentage | numeric | SLA compliance % |
| approval_rate | numeric | Approval rate % |
| rejection_rate | numeric | Rejection rate % |
| escalation_rate | numeric | Escalation rate % |
| stats_period_start | date | Period start |
| stats_period_end | date | Period end |
| last_action_at | timestamptz | Last action |
| updated_at | timestamptz | Updated at |

**Widget Use:** `personal_stats`, `performance_chart`

---

### v_agent_workload_summary
Current workload status for agents.

| Column | Type | Description |
|--------|------|-------------|
| workload_id | uuid | Workload ID |
| agent_profile_id | uuid | Agent profile ID |
| user_id | uuid | User ID |
| agent_type | varchar | Agent type |
| agent_role | varchar | Agent role |
| is_supervisor | boolean | Is supervisor |
| ministry_id | integer | Ministry ID |
| entity_id | uuid | Entity ID |
| agent_name | varchar | Agent name |
| agent_email | varchar | Agent email |
| ministry_name | varchar | Ministry name |
| current_assignments | integer | Current active assignments |
| pending_declarations | integer | Pending declarations |
| in_progress_declarations | integer | In progress declarations |
| max_concurrent_assignments | integer | Max concurrent |
| capacity_percentage | numeric | Capacity % used |
| workload_status | enum | available/normal/busy/overloaded |
| availability | enum | available/on_leave/sick_leave/etc |
| availability_reason | text | Reason if unavailable |
| unavailable_until | timestamptz | Unavailable until |
| avg_processing_time_hours | numeric | Avg processing hours |
| avg_daily_completions | numeric | Avg daily completions |
| completion_rate_7d | numeric | 7-day completion rate |
| quality_score_avg | numeric | Quality score avg |
| success_rate | numeric | Success rate % |
| deadline_compliance_rate | numeric | Deadline compliance % |
| last_assignment_at | timestamptz | Last assignment |
| last_completion_at | timestamptz | Last completion |
| last_updated_at | timestamptz | Last updated |
| load_level | text | low/normal/high/critical |
| available_capacity | integer | Available capacity |

**Widget Use:** `team_workload`, `capacity_chart`

---

### v_agents_workload_dashboard
Combined agent info for supervisor dashboard.

| Column | Type | Description |
|--------|------|-------------|
| agent_profile_id | uuid | Agent profile ID |
| user_id | uuid | User ID |
| email | varchar | Email |
| full_name | varchar | Full name |
| agent_type | varchar | Agent type |
| agent_role | varchar | Agent role |
| is_supervisor | boolean | Is supervisor |
| ministry_id | integer | Ministry ID |
| ministry_code | varchar | Ministry code |
| ministry_name | varchar | Ministry name |
| entity_id | uuid | Entity ID |
| entity_code | varchar | Entity code |
| entity_name | varchar | Entity name |
| is_active | boolean | Is active |
| current_assignments | integer | Current assignments |
| pending_declarations | integer | Pending |
| in_progress_declarations | integer | In progress |
| max_concurrent_assignments | integer | Max concurrent |
| capacity_percentage | numeric | Capacity % |
| workload_status | text | Workload status |
| availability | text | Availability |
| quality_score_avg | numeric | Quality score |
| success_rate | numeric | Success rate |
| avg_daily_completions | numeric | Avg daily |
| last_assignment_at | timestamptz | Last assignment |
| last_completion_at | timestamptz | Last completion |
| load_level | text | Load level |
| current_month_processed | integer | Processed this month |
| current_month_approved | integer | Approved this month |
| current_month_rejected | integer | Rejected this month |
| sla_respect_percentage | numeric | SLA compliance |
| agent_category | text | Agent category |

**Widget Use:** `team_workload`, `supervisor_overview`

---

### v_active_assignments
Current active assignments.

| Column | Type | Description |
|--------|------|-------------|
| assignment_id | uuid | Assignment ID |
| item_id | uuid | Item ID (declaration/request) |
| item_type | varchar | Item type |
| agent_profile_id | uuid | Agent profile ID |
| agent_user_id | uuid | Agent user ID |
| agent_name | varchar | Agent name |
| agent_email | varchar | Agent email |
| ministry_id | integer | Ministry ID |
| ministry_code | varchar | Ministry code |
| entity_id | uuid | Entity ID |
| entity_code | varchar | Entity code |
| assignment_status | enum | Status |
| priority_level | integer | Priority (1-10) |
| assigned_at | timestamptz | Assigned at |
| deadline | timestamptz | Deadline |
| hours_since_assigned | numeric | Hours since assigned |
| is_overdue | boolean | Is overdue |
| hours_until_deadline | numeric | Hours until deadline |

**Widget Use:** `my_assignments`, `overdue_alerts`

---

### v_pending_escalations
Pending escalations for supervisors.

| Column | Type | Description |
|--------|------|-------------|
| payment_id | uuid | Payment ID |
| payment_reference | varchar | Payment reference |
| service_request_id | uuid | Service request ID |
| service_request_reference | varchar | Request reference |
| total_amount | numeric | Amount |
| workflow_status | enum | Workflow status |
| escalation_level | enum | low/medium/high/critical |
| escalation_reason | text | Reason |
| escalated_at | timestamptz | Escalated at |
| escalated_to_agent_profile_id | uuid | Escalated to agent |
| escalated_to_name | varchar | Escalated to name |
| escalated_to_email | varchar | Escalated to email |
| original_agent_profile_id | uuid | Original agent |
| original_agent_name | varchar | Original agent name |
| ministry_id | integer | Ministry ID |
| ministry_code | varchar | Ministry code |
| ministry_name | varchar | Ministry name |
| hours_since_escalation | numeric | Hours since escalation |
| priority_order | integer | Priority order |

**Widget Use:** `escalations`, `supervisor_alerts`

---

## Views for Treasury Widgets

### mv_treasury_daily_kpis (Materialized)
Daily treasury KPIs aggregated.

| Column | Type | Description |
|--------|------|-------------|
| report_date | date | Report date |
| payment_method | text | Payment method |
| ministry_id | integer | Ministry ID |
| ministry_name | varchar | Ministry name |
| service_code | varchar | Service code |
| service_name | varchar | Service name |
| workflow_code | varchar | Workflow code |
| solicitud_type | varchar | Solicitud type |
| payment_count | bigint | Payment count |
| completed_count | bigint | Completed count |
| rejected_count | bigint | Rejected count |
| cancelled_by_user_count | bigint | Cancelled by user |
| total_amount | numeric | Total amount |
| avg_amount | numeric | Average amount |
| min_amount | numeric | Min amount |
| max_amount | numeric | Max amount |
| avg_processing_minutes | numeric | Avg processing time |
| sla_breached_count | bigint | SLA breached |
| sla_warning_count | bigint | SLA warning |

**Widget Use:** `treasury_kpis`, `payment_summary`, `sla_compliance`

---

### v_pending_payment_validations
Payments awaiting agent validation.

| Column | Type | Description |
|--------|------|-------------|
| payment_id | uuid | Payment ID |
| payment_reference | varchar | Payment reference |
| service_request_id | uuid | Service request ID |
| request_reference | varchar | Request reference |
| workflow_code | varchar | Workflow code |
| user_id | uuid | User ID |
| user_name | varchar | User name |
| user_email | varchar | User email |
| payment_method | enum | Payment method |
| total_amount | numeric | Total amount |
| currency | varchar | Currency |
| workflow_status | enum | Workflow status |
| assigned_agent_profile_id | uuid | Assigned agent |
| assigned_to_user_id | uuid | Assigned to user |
| assigned_to_name | varchar | Assigned to name |
| created_at | timestamptz | Created at |
| hours_waiting | numeric | Hours waiting |

**Widget Use:** `pending_payments`, `validation_queue`

---

### v_anomaly_summary
Payment anomalies summary.

| Column | Type | Description |
|--------|------|-------------|
| anomaly_type | enum | Anomaly type |
| severity | enum | low/medium/high/critical |
| status | enum | open/investigating/resolved/etc |
| count | bigint | Count |
| total_affected | numeric | Total amount affected |
| oldest_detected | timestamptz | Oldest detected |
| newest_detected | timestamptz | Newest detected |

**Widget Use:** `anomaly_alerts`, `treasury_health`

---

### v_reconciliation_health_metrics
Reconciliation health status.

| Column | Type | Description |
|--------|------|-------------|
| snapshot_time | timestamptz | Snapshot time |
| unreconciled_transactions | bigint | Unreconciled count |
| reconciled_transactions | bigint | Reconciled count |
| unreconciled_amount | numeric | Unreconciled amount |
| reconciled_amount | numeric | Reconciled amount |
| unmatched_payments | bigint | Unmatched payments |
| matched_payments | bigint | Matched payments |
| unmatched_payment_amount | numeric | Unmatched amount |
| unreconciled_over_7_days | bigint | Unreconciled >7 days |
| unreconciled_over_30_days | bigint | Unreconciled >30 days |
| reconciliation_rate_30d | numeric | 30-day rate % |
| avg_reconciliation_hours_30d | numeric | Avg hours to reconcile |
| transactions_today | bigint | Today's transactions |
| reconciled_today | bigint | Reconciled today |

**Widget Use:** `reconciliation_status`, `treasury_alerts`

---

### v_kpi_summary
Quick KPI summary.

| Column | Type | Description |
|--------|------|-------------|
| period | text | Period (today/week/month) |
| total_collected | numeric | Total collected |
| total_transactions | numeric | Total transactions |
| avg_transaction | numeric | Average transaction |
| sla_breaches | numeric | SLA breaches |

**Widget Use:** `quick_stats`, `kpi_cards`

---

### v_top_workflows
Top workflows by volume/amount.

| Column | Type | Description |
|--------|------|-------------|
| workflow_code | varchar | Workflow code |
| solicitud_type | varchar | Solicitud type |
| transaction_count | numeric | Transaction count |
| total_amount | numeric | Total amount |
| percentage | numeric | Percentage of total |

**Widget Use:** `top_workflows`, `workflow_distribution`

---

### v_top_ministries
Top ministries by volume/amount.

| Column | Type | Description |
|--------|------|-------------|
| ministry_id | integer | Ministry ID |
| ministry_name | varchar | Ministry name |
| transaction_count | numeric | Transaction count |
| total_amount | numeric | Total amount |

**Widget Use:** `ministry_ranking`, `revenue_by_ministry`

---

## Views for Verification Widgets

### v_verificacion_stats
Verification statistics.

| Column | Type | Description |
|--------|------|-------------|
| pendientes | bigint | Pending count |
| pendientes_auto_validables | bigint | Auto-validable pending |
| aprobadas | bigint | Approved count |
| rechazadas | bigint | Rejected count |
| total | bigint | Total count |
| avg_processing_hours | numeric | Avg processing hours |
| con_nombramiento | bigint | With nombramiento |
| con_carnet | bigint | With carnet |
| con_contrato | bigint | With contrato |

**Widget Use:** `verification_stats`, `funcionario_queue`

---

### v_verification_dashboard
Verification requests dashboard.

| Column | Type | Description |
|--------|------|-------------|
| request_id | uuid | Request ID |
| request_reference | varchar | Reference |
| workflow_code | varchar | Workflow code |
| verification_status | enum | Verification status |
| verification_details | jsonb | Details |
| request_created_at | timestamptz | Created at |
| queue_id | uuid | Queue ID |
| queue_status | varchar | Queue status |
| retry_count | integer | Retry count |
| error_message | text | Error message |
| next_retry_at | timestamptz | Next retry |
| user_name | varchar | User name |
| user_email | varchar | User email |

**Widget Use:** `verification_queue`, `verification_errors`

---

## All Views List

### Standard Views (60)
- v_active_assignments
- v_active_declaration_assignments
- v_active_service_request_assignments
- v_agent_assignment_history
- v_agent_entity_summary
- v_agent_performance_rankings
- v_agent_performance_summary
- v_agent_work_queue_priority
- v_agent_workload_summary
- v_agents_workload_dashboard
- v_anomaly_summary
- v_appointments_by_city
- v_assignments_with_profiles
- v_available_agents
- v_available_agents_by_ministry
- v_available_workflow_codes
- v_bank_reconciliation_matching
- v_declaration_assignments
- v_declaration_statistics_by_type
- v_declarations_pending_review
- v_declarations_with_payments
- v_embedding_status
- v_entities_with_workflows
- v_entity_default_roles
- v_entity_locations
- v_failed_payments_recovery
- v_gemini_errors
- v_gemini_processing_stats
- v_kpi_summary
- v_notification_statistics
- v_payment_plans_tracking
- v_payments_lifecycle_dashboard
- v_pending_escalations
- v_pending_payment_validations
- v_permission_grants_audit
- v_permission_usage_analytics
- v_recent_exports
- v_recent_verification_audit
- v_reconciliation_health_metrics
- v_revenue_analytics
- v_risk_analysis_trends
- v_role_capabilities_summary
- v_service_request_assignments
- v_service_request_notifications
- v_service_request_payments
- v_service_requests_by_city
- v_slot_availability_by_location
- v_top_ministries
- v_top_payment_methods
- v_top_workflows
- v_verificacion_stats
- v_verificaciones_pendientes
- v_verification_dashboard
- v_verification_stats
- v_verified_identifiers_admin
- v_verified_identifiers_stats
- v_workflow_supplements
- v_workflow_tariffs_summary
- v_workflows_hierarchy
- vw_agent_rbac_roles
- vw_agents

### Materialized Views (21)
- categories_with_services
- homepage_stats
- ministries_with_stats
- mv_reconciliation_stats
- mv_treasury_daily_kpis
- sectors_with_stats
- translations_export
- v_amount_adjustments_audit
- v_declarations_dashboard
- v_declarations_stats
- v_declarations_stats_by_type
- v_document_templates_stats
- v_import_batches_summary
- v_ocr_extraction_stats
- v_payment_plans_monitoring
- v_payments_dashboard
- v_service_procedures_denormalized
- v_services_by_ministry
- v_services_with_preview
- v_templates_usage_stats
- v_translations_coverage

---

## Widget Implementation Priority

### Phase 1 - Personal Agent Widgets
| Widget ID | View Source | Priority |
|-----------|-------------|----------|
| personal_stats | v_agent_performance_summary | HIGH |
| my_assignments | v_active_assignments | HIGH |
| sla_compliance | v_agent_performance_summary | MEDIUM |

### Phase 2 - Supervisor Widgets
| Widget ID | View Source | Priority |
|-----------|-------------|----------|
| team_workload | v_agents_workload_dashboard | HIGH |
| escalations | v_pending_escalations | HIGH |
| team_performance | v_agent_performance_rankings | MEDIUM |

### Phase 3 - Treasury Widgets
| Widget ID | View Source | Priority |
|-----------|-------------|----------|
| pending_payments | v_pending_payment_validations | HIGH |
| payment_summary | mv_treasury_daily_kpis | HIGH |
| anomaly_alerts | v_anomaly_summary | HIGH |
| reconciliation_status | v_reconciliation_health_metrics | MEDIUM |

### Phase 4 - Verification Widgets
| Widget ID | View Source | Priority |
|-----------|-------------|----------|
| verification_stats | v_verificacion_stats | HIGH |
| verification_queue | v_verification_dashboard | MEDIUM |
