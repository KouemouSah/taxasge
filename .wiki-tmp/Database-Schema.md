# Database Schema

## Overview

Facil uses PostgreSQL hosted on Supabase with **145 tables** and **50+ enums** organized across 10 business domains. The database also includes pgvector for RAG (Retrieval Augmented Generation) embeddings used by the AI chatbot.

## Tables by Domain

### Core Business (14 tables)

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles (citizen, business, accountant, admin, supervisor, agent types) |
| `fiscal_services` | 873+ fiscal services catalog with multilingual descriptions |
| `tax_declarations` | Tax declarations (28 GE-specific types) |
| `companies` | Company/business management |
| `user_company_roles` | User roles within companies |
| `ministries` | Government ministries (Spanish in DB, FR/EN via translations) |
| `sectors` | Ministry sectors |
| `categories` | Service categories |
| `service_keywords` | Search keywords for services |
| `service_document_assignments` | Required documents per service |
| `service_procedure_assignments` | Procedures per service |
| `procedure_templates` | Procedure templates |
| `procedure_template_steps` | Steps within procedures |
| `document_templates` | Document templates with validity duration |

### Declarations & Workflow (12 tables)

| Table | Description |
|-------|-------------|
| `declaration_iva_details` | IVA declarations (90% of volume) |
| `declaration_irpf_data` | IRPF/Income tax data (5% volume) |
| `declaration_petroliferos_details` | Petroleum sector declarations (4% volume, large amounts) |
| `declaration_retencion_details` | Withholding tax declarations |
| `declaration_other_details` | Generic JSONB for other declaration types |
| `declaration_amount_adjustments` | Amount adjustment audit trail |
| `declaration_corrections` | Correction/amendment history |
| `workflow_transitions` | Workflow state transitions |
| `assignments` | Agent task assignments |
| `assignment_rules` | Auto-assignment rules |
| `adjustment_reasons` | Predefined adjustment reason catalog |
| `calculation_history` | Tax calculation history |

### Service Requests (8 tables)

| Table | Description |
|-------|-------------|
| `service_requests` | Citizen service requests (passport, residence, license, etc.) |
| `wizard_sessions` | Cache-first wizard session state |
| `workflow_tariffs` | Fee schedules per workflow type |
| `predefined_workflows` | Workflow definitions synced from Python classes |
| `appointment_slot_configs` | Appointment capacity per entity/location |
| `appointment_holds` | Temporary appointment reservations (15 min TTL) |
| `appointment_reservations` | Confirmed appointment reservations |
| `workflow_menu_mapping` | Workflow code to agent menu mapping |

### Agents & Workload (7 tables)

| Table | Description |
|-------|-------------|
| `agent_profiles` | Agent profiles with entity/role assignments |
| `agent_workloads` | Real-time agent workload tracking |
| `agent_work_queue` | Dynamic priority queue (SLA, amount, complexity scoring) |
| `agent_performance_stats` | Monthly performance metrics |
| `user_ministry_assignments` | User-ministry mappings |
| `ministry_validation_config` | Ministry validation settings |
| `system_rules` | Dynamic business rules and feature flags (no redeploy needed) |

### Payments (10 tables)

| Table | Description |
|-------|-------------|
| `payments` | Central polymorphic payments table |
| `service_payments` | Payments with agent workflow (pessimistic locking) |
| `payment_plans` | Installment payment schedules |
| `payment_installments` | Individual installments |
| `payment_receipts` | Generated PDF receipts |
| `payment_lock_history` | Payment lock audit |
| `payment_validation_audit` | Validation audit trail |
| `bank_configurations` | Bank API/webhook configurations |
| `bank_transactions` | Bank webhook transactions |
| `fiscal_service_data` | Fiscal service payment data |

### Documents & OCR (5 tables)

| Table | Description |
|-------|-------------|
| `uploaded_files` | File metadata (Supabase Storage) |
| `document_processing_queue` | Async OCR queue with retry/fallback |
| `ocr_extraction_results` | Raw OCR extraction (JSONB) |
| `form_templates` | OCR field coordinates (14 form types) |
| `import_batches` / `import_batch_items` | Excel bulk import tracking |

### Authentication & RBAC (9 tables)

| Table | Description |
|-------|-------------|
| `sessions` | JWT sessions with device info |
| `refresh_tokens` | Refresh tokens with revocation support |
| `pending_registrations` | Email verification (15 min expiry) |
| `roles` | 47 configurable roles with `menu_config` and `dashboard_config` JSONB |
| `permissions` | 335 permission definitions |
| `role_permissions` | Role-to-permission mappings |
| `user_permissions` | Per-user permission overrides |
| `permission_audit_log` | Permission change history |
| `audit_logs` | System-wide audit trail |

### Communications (9 tables)

| Table | Description |
|-------|-------------|
| `communication_provider_settings` | Provider configs (SMS, Email, Push, WhatsApp) |
| `email_templates` | Multilingual email templates |
| `sms_templates` | SMS templates (160 char segments) |
| `push_templates` | Mobile/web push templates |
| `notification_templates` | In-app notification templates |
| `ussd_configurations` | USSD menu configs (Getesa, Muni) |
| `webhook_configurations` | WhatsApp Business API webhooks |
| `webhook_logs` | Webhook execution audit |

### Support (4 tables)

| Table | Description |
|-------|-------------|
| `support_tickets` | User/agent support tickets |
| `support_messages` | Ticket messages |
| `support_attachments` | Message attachments |
| `support_categories` | Multilingual ticket categories |

### Translations (3 tables)

| Table | Description |
|-------|-------------|
| `translations` | Unified translations (ENUMs, UI, Forms, System messages) |
| `entity_translations` | Optimized entity translations (40% storage reduction) |
| `user_favorites` | User service favorites |

### OMS / Commercial Licenses (additional tables)

| Table | Description |
|-------|-------------|
| `commercial_licenses` | Business commercial licenses |
| `license_obligations` | Obligations per license (multi-entity) |
| `entities` | Government entities with `workflow_codes` JSONB |
| `entity_locations` | Entity office locations per city |
| `cities` | City reference table |
| `field_inspections` | Field inspection records |

## Key Enums (25+)

| Enum | Values |
|------|--------|
| `user_role_enum` | citizen, business, accountant, admin, supervisor, dgi_agent, ministry_agent |
| `user_status_enum` | active, suspended, pending_verification, deactivated |
| `declaration_status_enum` | draft, submitted, processing, accepted, rejected, amended |
| `declaration_type_enum` | 34 types: income_tax, corporate_tax, vat_declaration, iva_destajo, iva_real, retencion_*, imp_*, cuota_min_*, impreso_* |
| `payment_status_enum` | pending, processing, completed, failed, refunded, cancelled |
| `payment_method_enum` | bank_transfer, card, mobile_money, cash, bange_wallet |
| `payment_type_enum` | full, partial, installment, complementary |
| `payment_workflow_status` | 17 states from submitted to completed |
| `service_request_status_enum` | DRAFT, SUBMITTED, UNDER_REVIEW, PAID, COMPLETED, etc. (19 states) |
| `agent_action_type` | lock_for_review, approve, reject, request_documents, escalate, unlock_release, assign_to_colleague |
| `agent_availability_enum` | available, on_leave, sick_leave, training, mission, temporarily_unavailable |
| `workload_status_enum` | available, normal, busy, overloaded, unavailable |
| `assignment_status_enum` | assigned, in_progress, pending_review, completed, reassigned, cancelled, rejected |
| `escalation_level` | low, medium, high, critical |
| `communication_provider_type` | sms, email, push, whatsapp |
| `company_role_enum` | company_owner, company_admin, company_accountant, company_member |
| `service_status_enum` | active, inactive, draft, deprecated |
| `service_type_enum` | document_processing, license_permit, residence_permit, registration_fee, inspection_fee, administrative_tax, customs_duty, declaration_tax |
| `calculation_method_enum` | fixed_expedition, fixed_renewal, percentage_based, unit_based, tiered_rates, formula_based, fixed_plus_unit |
| `document_condition_type_enum` | always, age_less_than, age_greater_than, is_renewal, is_new, is_duplicate, is_minor, is_adult, is_foreign, is_national, custom |

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case` plural | `users`, `fiscal_services` |
| Columns | `snake_case` | `full_name`, `created_at` |
| Foreign keys | `{table_singular}_id` | `user_id`, `ministry_id` |
| Timestamps | Standard names | `created_at`, `updated_at` |
| Soft deletes | Nullable timestamp | `deleted_at` |
| JSONB columns | Descriptive name | `form_data`, `menu_config`, `calculation_details` |
| Enums | `{domain}_{concept}_enum` | `payment_status_enum` |

## Migrations

Database migrations are stored in `migrations/` with 300+ sequential SQL files following the pattern:

```
migrations/
  001_initial_schema.sql
  002_users_table.sql
  ...
  300_latest_change.sql
```

Migrations are applied manually via the admin endpoint or during deployment. Each migration is idempotent where possible.

## Verification Pattern

Before writing any migration or query, always verify the actual schema:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'TABLE_NAME';

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'TABLE_NAME'
ORDER BY ordinal_position;

-- Check enum values
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'enum_name';
```
