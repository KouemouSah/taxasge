
====================================================================================================
TAXASGE DATABASE SCHEMA - COMPLETE REFERENCE
====================================================================================================

Extracted on: 2026-01-15 16:03:33
Database: Supabase PostgreSQL
Project: taxasge-dev

====================================================================================================
1. ALL TABLES IN PUBLIC SCHEMA
====================================================================================================

  - _migration_agent_map                     No description
  - adjustment_reasons                       Catalogue des raisons prédéfinies pour ajustements de montants
  - agent_performance_stats                  Agent performance statistics. Migration 054: agent_profile_id is now the primary identifier. agent_id (int PK) is deprecated.
  - agent_profiles                           Agent configuration profiles - separates agent data from users table
  - agent_work_queue                         Work queue for agent load balancing with dynamic priority calculation based on SLA, amount, and complexity
  - agent_workloads                          Agent workload tracking. Migration 054: agent_profile_id is now the primary identifier. agent_id is deprecated.
  - anomaly_actions                          Historique des actions effectuees sur les anomalies (audit trail)
  - appointment_blocked_dates                Holidays and blocked dates when appointments cannot be scheduled
  - appointment_delay_rules                  Configurable delay (in business days) between validation and appointment
  - appointment_holds                        No description
  - appointment_reservations                 Booked appointments for service requests
  - appointment_slot_configs                 Available appointment time slots by entity and day of week
  - assignment_rules                         Règles configurables pour l'auto-assignation intelligente
  - assignments                              Unified assignments table for all modules (tax_declarations, service_requests, etc.). Uses item_id + item_type for polymorphic references. Migration 053: Renamed declaration_id→item_id, declaration_type→item_type. Removed deprecated columns (agent_id, assigned_by, reassigned_to).
  - audit_logs                               No description
  - bank_configurations                      Configuration des intégrations bancaires (API, webhooks, comptes)
  - bank_transactions                        Transactions bancaires reçues des banques (webhooks ou réconciliation manuelle)
  - calculation_history                      No description
  - categories                               No description
  - cities                                   No description
  - communication_provider_settings          Configuration settings for communication providers (SMS, Email, Push, WhatsApp)
  - companies                                No description
  - declaration_amount_adjustments           Audit trail de tous les ajustements de montants (historique complet)
  - declaration_corrections                  Audit trail des corrections apportées aux déclarations (rectificatives)
  - declaration_irpf_data                    NIVEAU 1 - Données structurées IRPF (5% volume) - Impôt sur le Revenu
  - declaration_iva_details                  NIVEAU 1 - Données structurées IVA (90% volume) - Après validation OCR Tesseract ou saisie manuelle
  - declaration_other_details                NIVEAU 2 - Données JSONB génériques pour 7 autres types de déclarations (<1% volume)
  - declaration_petroliferos_details         NIVEAU 1 - Données structurées Pétrolifères (4% volume, GROS MONTANTS) - 6 sous-types
  - declaration_retencion_details            Détails des déclarations de Retención a la Fuente (3%, 5%, 10%) - Structure avec array fournisseurs en JSONB
  - document_processing_queue                Async processing queue for OCR with retry logic, exponential backoff, and Cloud Vision→Tesseract fallback
  - document_templates                       Templates documents - Avec validity_duration_months (v4.1 fix)
  - document_templates_backup_20251017       No description
  - document_verification_config             Configurable mapping: document_code -> identifier_type -> extraction paths
  - email_templates                          Email templates with multilingual support. HTML content stored in separate files.
  - entities                                 No description
  - entity_locations                         Master table of physical locations for each government entity. Single source of truth for location data.
  - entity_translations                      Traductions optimisées - ENUM strict + codes courts (-40%% storage)
  - export_templates                         Templates predefinies pour les exports (colonnes, format, mapping)
  - extraction_schemas                       Mapping entre catégories de documents et schemas JSON d'extraction
  - fiscal_service_data                      NIVEAU 3 - Données fiscal services avec support OCR Tesseract (ex: Nota de Ingreso)
  - fiscal_services                          Services fiscaux - NO instructions_es denormalization (v4.1 user feedback)
  - form_templates                           Templates de formulaires pour extraction OCR Tesseract (coordonnées des champs) - 14 types total
  - gemini_processing_logs                   Audit trail de tous les traitements Gemini (classification, extraction, risk)
  - import_batch_items                       Lignes individuelles d'un import Excel (une ligne = une ligne du fichier)
  - import_batches                           Métadonnées des imports Excel en masse (un fichier = un batch)
  - ministries                               Ministères - Espagnol en DB, FR/EN via entity_translations optimisée
  - ministry_validation_config               No description
  - notification_log                         Historique de toutes les notifications envoyées (audit et traçabilité)
  - notification_templates                   In-app notification templates with multilingual support.
  - ocr_extraction_results                   Résultats bruts de l'extraction OCR Tesseract (JSONB temporaire avant validation)
  - payment_anomalies                        Anomalies detectees sur les paiements Treasury - tracking et workflow de resolution
  - payment_installments                     Acomptes individuels d'un plan de paiement
  - payment_lock_history                     No description
  - payment_method_configurations            Payment method configurations. Translations for labels are managed via entity_translations table with entity_type=payment_method
  - payment_plans                            Plans de paiement (échéanciers) pour les déclarations fiscales
  - payment_receipts                         Reçus de paiement générés au format PDF
  - payment_validation_audit                 No description
  - payments                                 Table centrale polymorphe pour TOUS les paiements (services fiscaux et déclarations)
  - pending_registrations                    Stores email verification codes. Expires after 15 minutes. Minimal by design.
  - permission_audit_log                     Historique complet de tous les changements de permissions (audit trail)
  - permissions                              Catalogue centralisé de toutes les permissions de l'application
  - procedure_template_steps                 No description
  - procedure_template_steps_backup_20251017 No description
  - procedure_templates                      Templates procédures - Architecture radicale 58.7%% économie
  - push_templates                           Push notification templates for mobile and web platforms.
  - refresh_tokens                           Refresh tokens for JWT authentication with revocation support
  - role_permissions                         Permissions associées à chaque rôle
  - roles                                    Rôles personnalisables pour attribution de permissions groupées
  - sectors                                  No description
  - service_document_assignments             No description
  - service_keywords                         No description
  - service_payments                         Paiements avec workflow agents - Verrouillage pessimiste
  - service_procedure_assignments            No description
  - service_procedure_assignments_backup_20251017 No description
  - service_request_documents                Documents uploadés pour une demande de service
  - service_request_history                  Historique des changements (audit trail)
  - service_requests                         Demandes de service (passeport, résidence, carnet, etc.)
  - sessions                                 User authentication sessions with JWT tokens
  - sms_templates                            SMS templates with multilingual support. Content limited to 160 chars per segment.
  - steps_count                              No description
  - support_attachments                      File attachments for support messages
  - support_categories                       Support ticket categories with multilingual support
  - support_messages                         Messages within support tickets
  - support_tickets                          Support tickets for user help requests and agent technical support
  - system_rules                             Configuration dynamique des règles métier (sans redéploiement)
  - tariff_supplements                       Suppléments (cédulas, pólizas, timbres)
  - tax_declarations                         Déclarations fiscales - 20 types GE-specific
  - translations                             Table unifiée pour toutes les traductions du système (ENUMs, UI, Forms, Messages système)
  - treasury_exports                         Journal des exports comptables Treasury - tracabilite complete.
Les exports incluent les donnees de service_payments JOINees avec service_requests
pour obtenir workflow_code, solicitud_type et reference.
  - uploaded_files                           Métadonnées des fichiers uploadés (stockés dans Supabase Storage)
  - user_company_roles                       No description
  - user_favorites                           No description
  - user_permissions                         Permissions spécifiques par utilisateur (override du rôle)
  - users                                    No description
  - ussd_configurations                      USSD menu configurations for operators: Getesa, Muni, Other API SMS.
  - verificacion_fraud_log                   Log des tentatives suspectes de verification funcionario
  - verificacion_funcionario                 Demandes de verification du statut funcionario
  - verification_queue                       Durable queue for verification processing with retry support
  - verified_identifiers                     Cache securise d'identifiants verifies par des systemes externes
  - verified_identifiers_audit               Log de toutes les operations sur verified_identifiers
  - webhook_configurations                   Webhook configurations for WhatsApp Business API and custom integrations.
  - webhook_logs                             Audit log for webhook executions.
  - workflow_document_requirements           Documents requis par workflow avec logique conditionnelle
  - workflow_supplement_config               Configuration: quels suppléments s'appliquent à quels workflows
  - workflow_tariffs                         Tarifs de base des workflows (administrables via interface)
  - workflow_transitions                     No description
  - workflows                                Workflow definitions - determines how service requests are processed

====================================================================================================
2. ENUM TYPES
====================================================================================================


agent_action_type:
  - lock_for_review
  - approve
  - reject
  - request_documents
  - add_comment
  - escalate
  - unlock_release
  - assign_to_colleague

agent_availability_enum:
  - available
  - on_leave
  - sick_leave
  - training
  - mission
  - temporarily_unavailable

anomaly_severity_enum:
  - low
  - medium
  - high
  - critical

anomaly_status_enum:
  - open
  - investigating
  - resolved
  - false_positive
  - escalated

anomaly_type_enum:
  - amount_mismatch
  - duplicate_suspected
  - reconciliation_failed
  - validated_not_received
  - sla_breached
  - high_amount
  - suspicious_pattern
  - manual_flag
  - duplicate_payment
  - late_validation
  - orphan_transaction
  - reference_missing

appointment_hold_status:
  - held
  - confirmed
  - expired
  - released
  - fallback

assignment_method_enum:
  - auto
  - manual
  - self_assigned
  - escalated

assignment_status_enum:
  - assigned
  - in_progress
  - pending_review
  - completed
  - reassigned
  - cancelled
  - rejected

attachment_type_enum:
  - declaration_form
  - supporting_document
  - payment_proof
  - identity_document
  - fiscal_service_receipt
  - other

calculation_method_enum:
  - fixed_expedition
  - fixed_renewal
  - fixed_both
  - percentage_based
  - unit_based
  - tiered_rates
  - formula_based
  - fixed_plus_unit

communication_provider_type:
  - sms
  - email
  - push
  - whatsapp

company_role_enum:
  - company_owner
  - company_admin
  - company_accountant
  - company_member

declaration_status_enum:
  - draft
  - submitted
  - processing
  - accepted
  - rejected
  - amended

declaration_type_enum:
  - income_tax
  - corporate_tax
  - vat_declaration
  - social_contribution
  - property_tax
  - other_tax
  - settlement_voucher
  - minimum_fiscal_contribution
  - withheld_vat
  - actual_vat
  - petroleum_products_tax
  - petroleum_products_tax_ivs
  - wages_tax_oil_mining
  - wages_tax_common_sector
  - common_voucher
  - withholding_3pct_oil_mining_residents
  - withholding_10pct_common_residents
  - withholding_5pct_oil_mining_residents
  - minimum_fiscal_oil_mining
  - withholding_10pct_oil_mining_nonresidents
  - iva_destajo
  - iva_real
  - retencion_3pct_petrolero
  - retencion_5pct_petrolero
  - retencion_10pct_no_residentes_petrolero
  - retencion_10pct_no_residentes_comun
  - imp_prod_petroleros_ivs
  - imp_prod_petroleros_fmi
  - imp_sueldos_petrolero
  - imp_sueldos_comun
  - cuota_min_petrolera
  - cuota_min_comun
  - impreso_comun
  - impreso_liquidacion

document_condition_type_enum:
  - always
  - age_less_than
  - age_greater_than
  - is_renewal
  - is_new
  - is_duplicate
  - has_previous
  - is_minor
  - is_adult
  - is_foreign
  - is_national
  - custom

entity_type_enum:
  - entity
  - department

escalation_level:
  - low
  - medium
  - high
  - critical

export_status_enum:
  - pending
  - processing
  - completed
  - failed

export_type_enum:
  - sage_x3
  - ministry_report
  - bank_central
  - audit_report
  - reconciliation
  - custom

identifier_type_enum:
  - dni
  - pasaporte
  - permiso_residencia
  - certificado_conducir
  - matricula_vehiculo
  - nif
  - contrato_ornc
  - registro_civil
  - cuve
  - permiso_circulacion
  - matricula_funcionario
  - numero_nombramiento
  - carnet_funcionario

ocr_engine_enum:
  - tesseract
  - manual

payment_method_enum:
  - bank_transfer
  - card
  - mobile_money
  - cash
  - bange_wallet
  - check

payment_status_enum:
  - pending
  - processing
  - completed
  - failed
  - refunded
  - cancelled

payment_type_enum:
  - full
  - partial
  - installment
  - complementary

payment_workflow_status:
  - submitted
  - auto_processing
  - auto_approved
  - pending_agent_review
  - locked_by_agent
  - agent_reviewing
  - requires_documents
  - docs_resubmitted
  - approved_by_agent
  - rejected_by_agent
  - escalated_supervisor
  - supervisor_reviewing
  - completed
  - cancelled_by_user
  - cancelled_by_agent
  - expired

reassignment_reason_enum:
  - workload_imbalance
  - agent_unavailable
  - specialization_mismatch
  - quality_issue
  - deadline_missed
  - agent_request
  - supervisor_decision
  - complexity_change

rule_status_enum:
  - active
  - inactive
  - draft
  - archived

service_request_priority_enum:
  - LOW
  - NORMAL
  - HIGH
  - URGENT

service_request_status_enum:
  - DRAFT
  - TIMBRES_PENDING
  - TIMBRES_PAID
  - SUBMITTED
  - DOCUMENTS_REQUIRED
  - UNDER_REVIEW
  - DOSSIER_VALIDE
  - REJECTED
  - PENDING_NOTA_INGRESO
  - NOTA_UPLOADED
  - PAYMENT_PENDING
  - PAYMENT_PROCESSING
  - PAID
  - PAYMENT_FAILED
  - CITA_SCHEDULED
  - IN_PROGRESS
  - COMPLETED
  - CANCELLED
  - EXPIRED

service_status_enum:
  - active
  - inactive
  - draft
  - deprecated

service_type_enum:
  - document_processing
  - license_permit
  - residence_permit
  - registration_fee
  - inspection_fee
  - administrative_tax
  - customs_duty
  - declaration_tax

translatable_entity_type:
  - ministry
  - sector
  - category
  - service
  - procedure_template
  - procedure_step
  - document_template

type_compte_enum:
  - cuenta_propia
  - cuenta_empresa

user_role_enum:
  - citizen
  - business
  - accountant
  - admin
  - agent
  - funcionario

user_status_enum:
  - active
  - suspended
  - pending_verification
  - deactivated

verification_source_enum:
  - cnedoge
  - trafico
  - hacienda
  - ornc
  - registro_civil
  - registro_vehiculos
  - ministerio_funcion_publica
  - agent_manual
  - api_integration

verification_status_enum:
  - pending
  - in_progress
  - verified
  - partial_verification
  - not_found
  - verified_manually
  - verification_failed

workload_status_enum:
  - available
  - normal
  - busy
  - overloaded
  - unavailable

====================================================================================================
3. DETAILED TABLE SCHEMAS
====================================================================================================


----------------------------------------------------------------------------------------------------
Table: _MIGRATION_AGENT_MAP
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
ministry_agent_id                   integer                   YES                                      
agent_profile_id                    uuid                      YES                                      

Indexes:
  - idx_migration_map_ma_id
    CREATE INDEX idx_migration_map_ma_id ON public._migration_agent_map USING btree (ministry_agent_id)

----------------------------------------------------------------------------------------------------
Table: ADJUSTMENT_REASONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('adjustment_reasons_id
reason_code                         varchar(50)               NO                                       
  └─ Description: Code unique (ex: EXONERATION_SECTEUR_PUBLIC, REDUCTION_PME)
name_es                             text                      NO                                       
name_fr                             text                      YES                                      
name_en                             text                      YES                                      
description                         text                      YES                                      
category                            varchar(30)               NO                                       
requires_supervisor_approval        boolean                   YES        false                         
  └─ Description: TRUE si cette raison nécessite validation superviseur
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Unique Constraints:
  - adjustment_reasons_reason_code_key: (reason_code)

Indexes:
  - adjustment_reasons_reason_code_key
    CREATE UNIQUE INDEX adjustment_reasons_reason_code_key ON public.adjustment_reasons USING btree (reason_code)

----------------------------------------------------------------------------------------------------
Table: AGENT_PERFORMANCE_STATS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
agent_id                            integer                   NO                                       
  └─ Description: DEPRECATED: Use agent_profile_id. Legacy integer ID kept as PK for backward compatibility.
ministry_id                         integer                   NO                                       
current_month_processed             integer                   YES        0                             
current_month_approved              integer                   YES        0                             
current_month_rejected              integer                   YES        0                             
current_month_escalated             integer                   YES        0                             
avg_processing_minutes              numeric                   YES                                      
avg_lock_duration_minutes           numeric                   YES                                      
sla_respected_count                 integer                   YES        0                             
sla_missed_count                    integer                   YES        0                             
sla_respect_percentage              numeric                   YES                                      
current_active_locks                integer                   YES        0                             
max_concurrent_locks                integer                   YES        0                             
last_action_at                      timestamp with time zone  YES                                      
last_login_at                       timestamp with time zone  YES                                      
stats_period_start                  date                      YES        CURRENT_DATE                  
stats_period_end                    date                      YES                                      
updated_at                          timestamp with time zone  YES        now()                         
agent_profile_id                    uuid                      NO                                       

Primary Key: agent_id

Foreign Keys:
  - agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - agent_performance_stats_agent_profile_id_key: (agent_profile_id)

Indexes:
  - agent_performance_stats_agent_profile_id_key
    CREATE UNIQUE INDEX agent_performance_stats_agent_profile_id_key ON public.agent_performance_stats USING btree (agent_profile_id)
  - idx_agent_perf_stats_profile
    CREATE INDEX idx_agent_perf_stats_profile ON public.agent_performance_stats USING btree (agent_profile_id)

----------------------------------------------------------------------------------------------------
Table: AGENT_PROFILES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      NO                                       
agent_type                          varchar(30)               NO                                       
  └─ Description: ministry_agent = works for a ministry (DGI, Treasury, etc.), entity_agent = works for an independent entity (CNEDOGE, ONRC, etc.)
entity_id                           uuid                      YES                                      
  └─ Description: The entity/department this agent belongs to
ministry_id                         integer                   YES                                      
  └─ Description: Legacy: direct ministry assignment (prefer entity_id going forward)
agent_role                          varchar(50)               NO         'validator'::character varying
can_approve_unlimited               boolean                   YES        false                         
max_approval_amount                 numeric                   YES                                      
can_escalate                        boolean                   YES        true                          
can_assign_tasks                    boolean                   YES        false                         
can_reassign                        boolean                   YES        false                         
specializations                     jsonb                     YES        '[]'::jsonb                   
  └─ Description: JSONB array of declaration_type_enum values or workflow_codes
working_hours_start                 time without time zone    YES        '08:00:00'::time without time 
working_hours_end                   time without time zone    YES        '17:00:00'::time without time 
working_days                        ARRAY                     YES        ARRAY[1, 2, 3, 4, 5]          
is_active                           boolean                   YES        true                          
is_backup_agent                     boolean                   YES        false                         
backup_for_profile_id               uuid                      YES                                      
assigned_at                         timestamp with time zone  YES        now()                         
assigned_by                         uuid                      YES                                      
deactivated_at                      timestamp with time zone  YES                                      
deactivated_by                      uuid                      YES                                      
deactivation_reason                 text                      YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
is_supervisor                       boolean                   YES        false                         
  └─ Description: TRUE if agent can supervise other agents. Supervisors must still belong to a ministry or entity.

Primary Key: id

Foreign Keys:
  - assigned_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - backup_for_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - deactivated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - entity_id → entities.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - agent_profiles_user_id_key: (user_id)

Indexes:
  - idx_agent_profiles_is_supervisor
    CREATE INDEX idx_agent_profiles_is_supervisor ON public.agent_profiles USING btree (is_supervisor) WHERE (is_supervisor = true)
  - agent_profiles_user_id_key
    CREATE UNIQUE INDEX agent_profiles_user_id_key ON public.agent_profiles USING btree (user_id)
  - idx_agent_profiles_user_id
    CREATE INDEX idx_agent_profiles_user_id ON public.agent_profiles USING btree (user_id)
  - idx_agent_profiles_entity_id
    CREATE INDEX idx_agent_profiles_entity_id ON public.agent_profiles USING btree (entity_id)
  - idx_agent_profiles_ministry_id
    CREATE INDEX idx_agent_profiles_ministry_id ON public.agent_profiles USING btree (ministry_id)
  - idx_agent_profiles_agent_type
    CREATE INDEX idx_agent_profiles_agent_type ON public.agent_profiles USING btree (agent_type)
  - idx_agent_profiles_is_active
    CREATE INDEX idx_agent_profiles_is_active ON public.agent_profiles USING btree (is_active) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: AGENT_WORK_QUEUE
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
item_type                           varchar(20)               NO                                       
item_id                             uuid                      NO                                       
ministry_id                         integer                   NO                                       
amount                              numeric                   YES                                      
declaration_type                    varchar(50)               YES                                      
priority_score                      integer                   NO         0                             
  └─ Description: Dynamic priority score (0-100): +30 if amount>1M, +20 if SLA<6h, +15 if retry>=2, +10 if IVA, +10 if escalated
sla_deadline                        timestamp with time zone  NO                                       
  └─ Description: Service Level Agreement deadline: 48h for declarations, 24h for payments
sla_status                          varchar(20)               YES        'on_time'::character varying  
assigned_to                         uuid                      YES                                      
assigned_at                         timestamp with time zone  YES                                      
locked_until                        timestamp with time zone  YES                                      
escalated                           boolean                   YES        false                         
escalated_at                        timestamp with time zone  YES                                      
escalated_by                        uuid                      YES                                      
escalation_reason                   text                      YES                                      
status                              varchar(20)               NO         'pending'::character varying  
completed_at                        timestamp with time zone  YES                                      
completed_by                        uuid                      YES                                      
retry_count                         integer                   YES        0                             
max_retries                         integer                   YES        3                             
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - assigned_to → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - completed_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - escalated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - unique_queue_item: (item_type, item_id)

Indexes:
  - unique_queue_item
    CREATE UNIQUE INDEX unique_queue_item ON public.agent_work_queue USING btree (item_type, item_id)
  - idx_queue_status_priority
    CREATE INDEX idx_queue_status_priority ON public.agent_work_queue USING btree (status, priority_score DESC, sla_deadline) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'assigned'::character varying])::text[]))
  - idx_queue_ministry_pending
    CREATE INDEX idx_queue_ministry_pending ON public.agent_work_queue USING btree (ministry_id, status, priority_score DESC) WHERE ((status)::text = 'pending'::text)
  - idx_queue_assigned_agent
    CREATE INDEX idx_queue_assigned_agent ON public.agent_work_queue USING btree (assigned_to, status) WHERE ((assigned_to IS NOT NULL) AND ((status)::text = ANY ((ARRAY['assigned'::character varying, 'in_progress'::character varying])::text[])))
  - idx_queue_sla_critical
    CREATE INDEX idx_queue_sla_critical ON public.agent_work_queue USING btree (sla_status, sla_deadline) WHERE (((sla_status)::text = ANY ((ARRAY['warning'::character varying, 'critical'::character varying, 'breached'::character varying])::text[])) AND ((status)::text <> 'completed'::text))
  - idx_queue_escalated
    CREATE INDEX idx_queue_escalated ON public.agent_work_queue USING btree (escalated, escalated_at DESC) WHERE (escalated = true)

----------------------------------------------------------------------------------------------------
Table: AGENT_WORKLOADS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
agent_id                            uuid                      YES                                      
  └─ Description: DEPRECATED: Use agent_profile_id. Kept for backward compatibility.
current_assignments                 integer                   YES        0                             
pending_declarations                integer                   YES        0                             
in_progress_declarations            integer                   YES        0                             
max_concurrent_assignments          integer                   YES        20                            
capacity_percentage                 numeric                   YES        0.00                          
workload_status                     workload_status_enum      YES        'available'::workload_status_e
availability                        agent_availability_enum   YES        'available'::agent_availabilit
availability_reason                 text                      YES                                      
unavailable_until                   timestamp with time zone  YES                                      
avg_processing_time_hours           numeric                   YES                                      
avg_daily_completions               numeric                   YES        0.00                          
completion_rate_7d                  numeric                   YES        0.00                          
quality_score_avg                   numeric                   YES        0.00                          
success_rate                        numeric                   YES        0.0000                        
deadline_compliance_rate            numeric                   YES        0.0000                        
active_specializations              jsonb                     YES        '[]'::jsonb                   
preferred_declaration_types         jsonb                     YES        '[]'::jsonb                   
oldest_pending_assignment_date      timestamp with time zone  YES                                      
avg_pending_duration_hours          numeric                   YES                                      
last_assignment_at                  timestamp with time zone  YES                                      
last_completion_at                  timestamp with time zone  YES                                      
last_updated_at                     timestamp with time zone  YES        now()                         
agent_profile_id                    uuid                      NO                                       
  └─ Description: New: reference to agent_profiles. Transition period: both agent_id (users) and agent_profile_id can be used.

Primary Key: id

Foreign Keys:
  - agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - agent_workloads_agent_id_key: (agent_id)
  - agent_workloads_agent_profile_id_key: (agent_profile_id)

Indexes:
  - agent_workloads_agent_profile_id_key
    CREATE UNIQUE INDEX agent_workloads_agent_profile_id_key ON public.agent_workloads USING btree (agent_profile_id)
  - idx_agent_workloads_ministry_availability
    CREATE INDEX idx_agent_workloads_ministry_availability ON public.agent_workloads USING btree (agent_profile_id, workload_status, availability)
  - agent_workloads_agent_id_key
    CREATE UNIQUE INDEX agent_workloads_agent_id_key ON public.agent_workloads USING btree (agent_id)
  - idx_agent_workloads_agent_id
    CREATE INDEX idx_agent_workloads_agent_id ON public.agent_workloads USING btree (agent_id)
  - idx_agent_workloads_status
    CREATE INDEX idx_agent_workloads_status ON public.agent_workloads USING btree (workload_status)
  - idx_agent_workloads_availability
    CREATE INDEX idx_agent_workloads_availability ON public.agent_workloads USING btree (availability)
  - idx_agent_workloads_capacity
    CREATE INDEX idx_agent_workloads_capacity ON public.agent_workloads USING btree (capacity_percentage)
  - idx_agent_workloads_specializations
    CREATE INDEX idx_agent_workloads_specializations ON public.agent_workloads USING gin (active_specializations)
  - idx_agent_workloads_last_assignment
    CREATE INDEX idx_agent_workloads_last_assignment ON public.agent_workloads USING btree (last_assignment_at) WHERE (last_assignment_at IS NOT NULL)
  - idx_agent_workloads_profile_id
    CREATE INDEX idx_agent_workloads_profile_id ON public.agent_workloads USING btree (agent_profile_id)

----------------------------------------------------------------------------------------------------
Table: ANOMALY_ACTIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
anomaly_id                          uuid                      NO                                       
action                              varchar(50)               NO                                       
from_status                         anomaly_status_enum       YES                                      
to_status                           anomaly_status_enum       YES                                      
comment                             text                      YES                                      
performed_by                        uuid                      YES                                      
performed_at                        timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - anomaly_id → payment_anomalies.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - performed_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_anomaly_actions_anomaly
    CREATE INDEX idx_anomaly_actions_anomaly ON public.anomaly_actions USING btree (anomaly_id, performed_at DESC)

----------------------------------------------------------------------------------------------------
Table: APPOINTMENT_BLOCKED_DATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
entity_code                         varchar(50)               YES                                      
  └─ Description: NULL = applies to all entities
blocked_date                        date                      NO                                       
reason                              varchar(255)              YES                                      
is_recurring                        boolean                   NO         false                         
  └─ Description: TRUE = same date every year (annual holidays)
created_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - unique_blocked_date: (entity_code, blocked_date)

Indexes:
  - unique_blocked_date
    CREATE UNIQUE INDEX unique_blocked_date ON public.appointment_blocked_dates USING btree (entity_code, blocked_date)
  - idx_abd_entity
    CREATE INDEX idx_abd_entity ON public.appointment_blocked_dates USING btree (entity_code)
  - idx_abd_date
    CREATE INDEX idx_abd_date ON public.appointment_blocked_dates USING btree (blocked_date)
  - idx_abd_lookup
    CREATE INDEX idx_abd_lookup ON public.appointment_blocked_dates USING btree (entity_code, blocked_date)

----------------------------------------------------------------------------------------------------
Table: APPOINTMENT_DELAY_RULES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
workflow_code                       varchar(100)              YES                                      
  └─ Description: NULL = default rule for all workflows without specific rule
priority                            service_request_priority_enum NO                                       
delay_business_days                 integer                   NO         3                             
  └─ Description: Number of business days to wait after validation
is_active                           boolean                   NO         true                          
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - workflow_code → workflows.code (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - unique_delay_rule: (workflow_code, priority)

Indexes:
  - unique_delay_rule
    CREATE UNIQUE INDEX unique_delay_rule ON public.appointment_delay_rules USING btree (workflow_code, priority)
  - idx_adr_workflow
    CREATE INDEX idx_adr_workflow ON public.appointment_delay_rules USING btree (workflow_code)
  - idx_adr_priority
    CREATE INDEX idx_adr_priority ON public.appointment_delay_rules USING btree (priority)
  - idx_adr_lookup
    CREATE INDEX idx_adr_lookup ON public.appointment_delay_rules USING btree (workflow_code, priority, is_active) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: APPOINTMENT_HOLDS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      NO                                       
slot_config_id                      uuid                      YES                                      
appointment_date                    date                      NO                                       
appointment_time                    time without time zone    NO                                       
status                              appointment_hold_status   NO         'held'::appointment_hold_statu
held_at                             timestamp with time zone  NO         now()                         
expires_at                          timestamp with time zone  NO         (now() + '00:15:00'::interval)
confirmed_at                        timestamp with time zone  YES                                      
released_at                         timestamp with time zone  YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
entity_location_id                  uuid                      YES                                      
  └─ Description: FK to entity_locations - the location for this appointment hold

Primary Key: id

Foreign Keys:
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - slot_config_id → appointment_slot_configs.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - entity_location_id → entity_locations.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - unique_active_hold_per_request: (service_request_id)

Indexes:
  - unique_active_hold_per_request
    CREATE UNIQUE INDEX unique_active_hold_per_request ON public.appointment_holds USING btree (service_request_id)
  - idx_appointment_holds_status
    CREATE INDEX idx_appointment_holds_status ON public.appointment_holds USING btree (status) WHERE (status = 'held'::appointment_hold_status)
  - idx_appointment_holds_expires
    CREATE INDEX idx_appointment_holds_expires ON public.appointment_holds USING btree (expires_at) WHERE (status = 'held'::appointment_hold_status)

----------------------------------------------------------------------------------------------------
Table: APPOINTMENT_RESERVATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      NO                                       
appointment_date                    date                      NO                                       
appointment_time                    time without time zone    NO                                       
status                              varchar(20)               NO         'scheduled'::character varying
  └─ Description: scheduled, confirmed, completed, cancelled, no_show, rescheduled
reminder_sent_at                    timestamp with time zone  YES                                      
confirmation_sent_at                timestamp with time zone  YES                                      
rescheduled_from                    uuid                      YES                                      
rescheduled_reason                  text                      YES                                      
completed_at                        timestamp with time zone  YES                                      
completed_by                        uuid                      YES                                      
completion_notes                    text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
cancelled_at                        timestamp with time zone  YES                                      
cancelled_by                        uuid                      YES                                      
cancellation_reason                 text                      YES                                      
entity_location_id                  uuid                      YES                                      
  └─ Description: FK to entity_locations - the location for this reservation

Primary Key: id

Foreign Keys:
  - cancelled_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - completed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - rescheduled_from → appointment_reservations.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - entity_location_id → entity_locations.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_ar_service_request
    CREATE INDEX idx_ar_service_request ON public.appointment_reservations USING btree (service_request_id)
  - idx_ar_status
    CREATE INDEX idx_ar_status ON public.appointment_reservations USING btree (status)
  - idx_ar_pending_reminders
    CREATE INDEX idx_ar_pending_reminders ON public.appointment_reservations USING btree (appointment_date) WHERE (((status)::text = 'scheduled'::text) AND (reminder_sent_at IS NULL))

----------------------------------------------------------------------------------------------------
Table: APPOINTMENT_SLOT_CONFIGS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
entity_code                         varchar(50)               NO                                       
day_of_week                         integer                   NO                                       
  └─ Description: 0=Monday, 1=Tuesday, ..., 6=Sunday
start_time                          time without time zone    NO                                       
end_time                            time without time zone    NO                                       
slot_duration_minutes               integer                   NO         30                            
max_appointments_per_slot           integer                   NO         10                            
is_active                           boolean                   NO         true                          
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      
entity_location_id                  uuid                      NO                                       
  └─ Description: FK to entity_locations - the physical location for this slot

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - entity_location_id → entity_locations.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_asc_day
    CREATE INDEX idx_asc_day ON public.appointment_slot_configs USING btree (day_of_week)
  - idx_asc_active
    CREATE INDEX idx_asc_active ON public.appointment_slot_configs USING btree (entity_code, is_active) WHERE (is_active = true)
  - unique_slot_v2
    CREATE UNIQUE INDEX unique_slot_v2 ON public.appointment_slot_configs USING btree (entity_location_id, day_of_week, start_time)
  - idx_slot_entity_location
    CREATE INDEX idx_slot_entity_location ON public.appointment_slot_configs USING btree (entity_location_id)

----------------------------------------------------------------------------------------------------
Table: ASSIGNMENT_RULES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
name                                varchar(200)              NO                                       
description                         text                      YES                                      
priority                            integer                   YES        50                            
entity_type                         varchar(50)               NO                                       
entity_id                           varchar(100)              YES                                      
conditions                          jsonb                     NO                                       
actions                             jsonb                     NO                                       
status                              rule_status_enum          YES        'draft'::rule_status_enum     
times_applied                       integer                   YES        0                             
times_matched                       integer                   YES        0                             
successful_assignments              integer                   YES        0                             
failed_assignments                  integer                   YES        0                             
success_rate                        numeric                   YES        0.0000                        
last_applied_at                     timestamp with time zone  YES                                      
created_by                          uuid                      NO                                       
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
updated_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_assignment_rules_status
    CREATE INDEX idx_assignment_rules_status ON public.assignment_rules USING btree (status)
  - idx_assignment_rules_priority
    CREATE INDEX idx_assignment_rules_priority ON public.assignment_rules USING btree (priority) WHERE (status = 'active'::rule_status_enum)
  - idx_assignment_rules_entity
    CREATE INDEX idx_assignment_rules_entity ON public.assignment_rules USING btree (entity_type, entity_id)
  - idx_assignment_rules_conditions
    CREATE INDEX idx_assignment_rules_conditions ON public.assignment_rules USING gin (conditions)
  - idx_assignment_rules_created_by
    CREATE INDEX idx_assignment_rules_created_by ON public.assignment_rules USING btree (created_by)

----------------------------------------------------------------------------------------------------
Table: ASSIGNMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
item_id                             uuid                      NO                                       
  └─ Description: UUID of the assigned item (tax_declarations.id, service_requests.id, etc.)
item_type                           varchar(50)               NO                                       
  └─ Description: Type of the assigned item: declaration types (iva_declaration, income_tax) or workflow codes (pasaporte_nuevo, residencia)
assignment_method                   assignment_method_enum    YES        'manual'::assignment_method_en
status                              assignment_status_enum    YES        'assigned'::assignment_status_
notes                               text                      YES                                      
auto_assignment_score               numeric                   YES                                      
score_breakdown                     jsonb                     YES                                      
rule_applied_id                     uuid                      YES                                      
assigned_at                         timestamp with time zone  YES        now()                         
started_at                          timestamp with time zone  YES                                      
completed_at                        timestamp with time zone  YES                                      
processing_duration_hours           numeric                   YES                                      
deadline                            timestamp with time zone  YES                                      
deadline_met                        boolean                   YES                                      
priority_level                      integer                   YES        5                             
reassigned_at                       timestamp with time zone  YES                                      
reassignment_reason                 reassignment_reason_enum  YES                                      
reassignment_notes                  text                      YES                                      
validation_status                   varchar(20)               YES                                      
quality_score                       numeric                   YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
agent_profile_id                    uuid                      NO                                       
  └─ Description: NEW: Reference to agent_profiles. The agent assigned to process this task.
assigned_by_profile_id              uuid                      YES                                      
  └─ Description: NEW: Reference to agent_profiles for the supervisor who assigned this task.
reassigned_to_profile_id            uuid                      YES                                      
  └─ Description: NEW: Reference to agent_profiles for the agent after reassignment.

Primary Key: id

Foreign Keys:
  - rule_applied_id → assignment_rules.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - assigned_by_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - reassigned_to_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_assignments_status
    CREATE INDEX idx_assignments_status ON public.assignments USING btree (status)
  - idx_assignments_assignment_method
    CREATE INDEX idx_assignments_assignment_method ON public.assignments USING btree (assignment_method)
  - idx_assignments_deadline
    CREATE INDEX idx_assignments_deadline ON public.assignments USING btree (deadline) WHERE (deadline IS NOT NULL)
  - idx_assignments_priority
    CREATE INDEX idx_assignments_priority ON public.assignments USING btree (priority_level DESC)
  - idx_assignments_rule_applied
    CREATE INDEX idx_assignments_rule_applied ON public.assignments USING btree (rule_applied_id) WHERE (rule_applied_id IS NOT NULL)
  - idx_assignments_created_at
    CREATE INDEX idx_assignments_created_at ON public.assignments USING btree (created_at DESC)
  - idx_assignments_item
    CREATE INDEX idx_assignments_item ON public.assignments USING btree (item_id, item_type)
  - idx_assignments_agent_profile_status
    CREATE INDEX idx_assignments_agent_profile_status ON public.assignments USING btree (agent_profile_id, status)
  - idx_assignments_agent_profile_id
    CREATE INDEX idx_assignments_agent_profile_id ON public.assignments USING btree (agent_profile_id)
  - idx_assignments_assigned_by_profile_id
    CREATE INDEX idx_assignments_assigned_by_profile_id ON public.assignments USING btree (assigned_by_profile_id)
  - idx_assignments_reassigned_to_profile_id
    CREATE INDEX idx_assignments_reassigned_to_profile_id ON public.assignments USING btree (reassigned_to_profile_id)

----------------------------------------------------------------------------------------------------
Table: AUDIT_LOGS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      YES                                      
entity_type                         varchar(50)               NO                                       
entity_id                           varchar(50)               NO                                       
action                              varchar(50)               NO                                       
old_values                          jsonb                     YES                                      
new_values                          jsonb                     YES                                      
ip_address                          inet                      YES                                      
user_agent                          text                      YES                                      
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

----------------------------------------------------------------------------------------------------
Table: BANK_CONFIGURATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('bank_configurations_i
bank_code                           varchar(20)               NO                                       
bank_name                           text                      NO                                       
api_endpoint                        text                      YES                                      
api_version                         varchar(10)               YES                                      
api_key_encrypted                   text                      YES                                      
  └─ Description: Clé API chiffrée (à déchiffrer en production)
webhook_secret                      text                      YES                                      
treasury_account_number             varchar(50)               NO                                       
  └─ Description: Numéro de compte du Trésor Public à cette banque
is_active                           boolean                   YES        true                          
supports_webhooks                   boolean                   YES        false                         
supports_direct_integration         boolean                   YES        false                         
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Unique Constraints:
  - bank_configurations_bank_code_key: (bank_code)

Indexes:
  - bank_configurations_bank_code_key
    CREATE UNIQUE INDEX bank_configurations_bank_code_key ON public.bank_configurations USING btree (bank_code)

----------------------------------------------------------------------------------------------------
Table: BANK_TRANSACTIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
bank_code                           varchar(20)               NO                                       
  └─ Description: Code de la banque (BANGE, BGFI, CCEIBANK, SGBGE, ECOBANK)
bank_reference                      varchar(255)              NO                                       
  └─ Description: Référence unique fournie par la banque
bank_transaction_date               timestamp with time zone  NO                                       
amount                              numeric                   NO                                       
currency                            varchar(3)                NO         'XAF'::character varying      
account_number                      varchar(50)               YES                                      
account_holder_name                 text                      YES                                      
payment_id                          uuid                      YES                                      
status                              varchar(20)               NO         'unreconciled'::character vary
raw_data                            jsonb                     YES                                      
  └─ Description: Payload JSON complet reçu de la banque (pour debug et audit)
reconciled_at                       timestamp with time zone  YES                                      
  └─ Description: Date de réconciliation avec un payment_id (NULL si pas encore réconcilié)
reconciled_by                       uuid                      YES                                      
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - reconciled_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - payment_id → payments.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - bank_transactions_bank_code_bank_reference_key: (bank_code, bank_reference)

Indexes:
  - bank_transactions_bank_code_bank_reference_key
    CREATE UNIQUE INDEX bank_transactions_bank_code_bank_reference_key ON public.bank_transactions USING btree (bank_code, bank_reference)
  - idx_bank_transactions_bank_code
    CREATE INDEX idx_bank_transactions_bank_code ON public.bank_transactions USING btree (bank_code)
  - idx_bank_transactions_status
    CREATE INDEX idx_bank_transactions_status ON public.bank_transactions USING btree (status)
  - idx_bank_transactions_payment_id
    CREATE INDEX idx_bank_transactions_payment_id ON public.bank_transactions USING btree (payment_id) WHERE (payment_id IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: CALCULATION_HISTORY
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      NO                                       
fiscal_service_code                 varchar(10)               NO                                       
calculation_type                    varchar(20)               NO                                       
input_parameters                    jsonb                     NO                                       
calculated_amount                   numeric                   NO                                       
calculation_details                 jsonb                     YES        '{}'::jsonb                   
saved_for_later                     boolean                   YES        false                         
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - fiscal_service_code → fiscal_services.service_code (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

----------------------------------------------------------------------------------------------------
Table: CATEGORIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('categories_id_seq'::r
category_code                       varchar(10)               NO                                       
sector_id                           integer                   YES                                      
ministry_id                         integer                   YES                                      
service_type                        service_type_enum         YES                                      
name_es                             varchar(255)              NO                                       
description_es                      text                      YES                                      
display_order                       integer                   YES        0                             
icon                                varchar(100)              YES                                      
color                               varchar(7)                YES                                      
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - sector_id → sectors.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - categories_category_code_key: (category_code)

Indexes:
  - categories_category_code_key
    CREATE UNIQUE INDEX categories_category_code_key ON public.categories USING btree (category_code)
  - idx_categories_code
    CREATE INDEX idx_categories_code ON public.categories USING btree (category_code)
  - idx_categories_sector
    CREATE INDEX idx_categories_sector ON public.categories USING btree (sector_id) WHERE (sector_id IS NOT NULL)
  - idx_categories_ministry_direct
    CREATE INDEX idx_categories_ministry_direct ON public.categories USING btree (ministry_id) WHERE (ministry_id IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: CITIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
name                                varchar(100)              NO                                       
region                              varchar(50)               NO                                       
description                         text                      YES                                      
is_capital                          boolean                   YES        false                         
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - cities_name_key: (name)

Indexes:
  - cities_name_key
    CREATE UNIQUE INDEX cities_name_key ON public.cities USING btree (name)
  - idx_cities_active
    CREATE INDEX idx_cities_active ON public.cities USING btree (is_active) WHERE (is_active = true)
  - idx_cities_region
    CREATE INDEX idx_cities_region ON public.cities USING btree (region)
  - idx_cities_name
    CREATE INDEX idx_cities_name ON public.cities USING btree (name)

----------------------------------------------------------------------------------------------------
Table: COMMUNICATION_PROVIDER_SETTINGS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('communication_provide
provider_type                       communication_provider_type NO                                       
provider_name                       varchar(100)              NO                                       
provider_code                       varchar(50)               NO                                       
api_base_url                        varchar(500)              YES                                      
api_key_encrypted                   varchar(500)              YES                                      
  └─ Description: Encrypted API key - decrypt at runtime using app secret
api_secret_encrypted                varchar(500)              YES                                      
config                              jsonb                     YES        '{}'::jsonb                   
  └─ Description: Provider-specific configuration in JSONB format
is_active                           boolean                   YES        true                          
is_default                          boolean                   YES        false                         
rate_limit_per_minute               integer                   YES        100                           
retry_attempts                      integer                   YES        3                             
timeout_seconds                     integer                   YES        30                            
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - communication_provider_settings_provider_code_key: (provider_code)

Indexes:
  - communication_provider_settings_provider_code_key
    CREATE UNIQUE INDEX communication_provider_settings_provider_code_key ON public.communication_provider_settings USING btree (provider_code)
  - idx_comm_provider_type
    CREATE INDEX idx_comm_provider_type ON public.communication_provider_settings USING btree (provider_type)
  - idx_comm_provider_active
    CREATE INDEX idx_comm_provider_active ON public.communication_provider_settings USING btree (is_active)
  - idx_comm_provider_default
    CREATE INDEX idx_comm_provider_default ON public.communication_provider_settings USING btree (is_default) WHERE (is_default = true)
  - idx_comm_provider_unique_default_per_type
    CREATE UNIQUE INDEX idx_comm_provider_unique_default_per_type ON public.communication_provider_settings USING btree (provider_type) WHERE (is_default = true)

----------------------------------------------------------------------------------------------------
Table: COMPANIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_id                              varchar(100)              NO                                       
legal_name                          varchar(255)              NO                                       
trade_name                          varchar(255)              YES                                      
primary_sector_id                   integer                   YES                                      
address                             text                      YES                                      
city                                varchar(100)              YES                                      
phone                               varchar(20)               YES                                      
email                               varchar(255)              YES                                      
is_active                           boolean                   YES        true                          
is_verified                         boolean                   YES        false                         
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - primary_sector_id → sectors.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - companies_tax_id_key: (tax_id)

Indexes:
  - companies_tax_id_key
    CREATE UNIQUE INDEX companies_tax_id_key ON public.companies USING btree (tax_id)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_AMOUNT_ADJUSTMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
original_amount                     numeric                   NO                                       
adjusted_amount                     numeric                   NO                                       
difference                          numeric                   YES                                      
percentage_change                   numeric                   YES                                      
  └─ Description: Pourcentage de changement (GENERATED: ABS(difference / original_amount * 100))
requires_supervisor_approval        boolean                   YES                                      
  └─ Description: TRUE si changement > 20% (GENERATED automatiquement)
adjustment_reason_id                integer                   YES                                      
adjustment_reason_custom            text                      YES                                      
status                              varchar(20)               NO         'pending'::character varying  
adjusted_by                         uuid                      NO                                       
approved_by                         uuid                      YES                                      
approved_at                         timestamp with time zone  YES                                      
approval_notes                      text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - adjusted_by → users.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - adjustment_reason_id → adjustment_reasons.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - approved_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_declaration_amount_adjustments_tax_declaration_id
    CREATE INDEX idx_declaration_amount_adjustments_tax_declaration_id ON public.declaration_amount_adjustments USING btree (tax_declaration_id)
  - idx_declaration_amount_adjustments_adjusted_by
    CREATE INDEX idx_declaration_amount_adjustments_adjusted_by ON public.declaration_amount_adjustments USING btree (adjusted_by)
  - idx_declaration_amount_adjustments_status
    CREATE INDEX idx_declaration_amount_adjustments_status ON public.declaration_amount_adjustments USING btree (status)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_CORRECTIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
original_declaration_id             uuid                      NO                                       
rectificative_declaration_id        uuid                      NO                                       
correction_type                     varchar(30)               NO                                       
original_amount                     numeric                   YES                                      
rectified_amount                    numeric                   YES                                      
difference                          numeric                   YES                                      
  └─ Description: Différence de montant (GENERATED: rectified_amount - original_amount)
changes_detail                      jsonb                     NO                                       
  └─ Description: Détail JSON des changements (field_name: {old: X, new: Y})
correction_reason                   text                      NO                                       
supporting_documents                ARRAY                     YES                                      
  └─ Description: Array de FK vers uploaded_files (documents justificatifs)
status                              varchar(20)               NO         'pending'::character varying  
approved_by                         uuid                      YES                                      
approved_at                         timestamp with time zone  YES                                      
approval_notes                      text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - approved_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - original_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - rectificative_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_declaration_corrections_original_id
    CREATE INDEX idx_declaration_corrections_original_id ON public.declaration_corrections USING btree (original_declaration_id)
  - idx_declaration_corrections_rectificative_id
    CREATE INDEX idx_declaration_corrections_rectificative_id ON public.declaration_corrections USING btree (rectificative_declaration_id)
  - idx_declaration_corrections_status
    CREATE INDEX idx_declaration_corrections_status ON public.declaration_corrections USING btree (status)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_IRPF_DATA
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
revenus_salaires                    numeric                   YES        0                             
revenus_activites_professionnelles  numeric                   YES        0                             
revenus_capitaux_mobiliers          numeric                   YES        0                             
revenus_capitaux_immobiliers        numeric                   YES        0                             
revenus_autres                      numeric                   YES        0                             
total_revenus_bruts                 numeric                   YES                                      
deductions_charges_famille          numeric                   YES        0                             
deductions_cotisations_sociales     numeric                   YES        0                             
deductions_dons                     numeric                   YES        0                             
deductions_autres                   numeric                   YES        0                             
total_deductions                    numeric                   YES                                      
base_liquidable                     numeric                   YES                                      
  └─ Description: Base liquidable (revenus - déductions)
tipo_gravamen                       numeric                   YES        0                             
calculated_amount                   numeric                   YES                                      
adjusted_amount                     numeric                   YES                                      
adjustment_reason_id                integer                   YES                                      
adjustment_reason_custom            text                      YES                                      
adjusted_by                         uuid                      YES                                      
adjusted_at                         timestamp with time zone  YES                                      
final_amount                        numeric                   YES                                      
retenues_a_la_source                numeric                   YES        0                             
acomptes_verses                     numeric                   YES        0                             
interes_demora                      numeric                   YES        0                             
recargos                            numeric                   YES        0                             
sanciones                           numeric                   YES        0                             
total_a_ingresar                    numeric                   YES                                      
  └─ Description: Montant total à payer (ou négatif si remboursement dû)
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - adjusted_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - adjustment_reason_id → adjustment_reasons.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - declaration_irpf_data_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_irpf_data_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_irpf_data_tax_declaration_id_key ON public.declaration_irpf_data USING btree (tax_declaration_id)
  - idx_declaration_irpf_data_tax_declaration_id
    CREATE INDEX idx_declaration_irpf_data_tax_declaration_id ON public.declaration_irpf_data USING btree (tax_declaration_id)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_IVA_DETAILS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
iva_dev_01_base                     numeric                   YES        0                             
iva_dev_02_tipo                     numeric                   YES        15.00                         
iva_dev_03_cuota                    numeric                   YES                                      
iva_dev_04_base                     numeric                   YES        0                             
iva_dev_05_tipo                     numeric                   YES        5.00                          
  └─ Description: Tipo IVA pour tranche 5% (campo 05) - PDFs officiels
iva_dev_06_cuota                    numeric                   YES                                      
iva_dev_07_base                     numeric                   YES        0                             
iva_dev_08_tipo                     numeric                   YES        0.00                          
  └─ Description: Tipo IVA pour tranche 0% (campo 08) - PDFs officiels
iva_dev_09_cuota                    numeric                   YES                                      
iva_dev_10_base                     numeric                   YES        0                             
iva_dev_11_tipo                     numeric                   YES        15.00                         
iva_dev_12_cuota                    numeric                   YES                                      
iva_dev_13_base_exonerada           numeric                   YES        0                             
iva_dev_014_total                   numeric                   YES                                      
iva_ded_01_operaciones_interiores   numeric                   YES        0                             
iva_ded_02_importaciones            numeric                   YES        0                             
iva_ded_03_adquisiciones_intracomunitarias numeric                   YES        0                             
iva_ded_04_bienes_inversion         numeric                   YES        0                             
iva_ded_05_regularizacion_inversiones numeric                   YES        0                             
iva_ded_06_creditos_periodos_anteriores numeric                   YES        0                             
iva_ded_07_total                    numeric                   YES                                      
calculated_amount                   numeric                   YES                                      
  └─ Description: Montant calculé automatiquement (IMMUTABLE, GENERATED)
adjusted_amount                     numeric                   YES                                      
  └─ Description: Montant ajusté par agent (NULLABLE, pour exonérations/corrections)
adjustment_reason_id                integer                   YES                                      
adjustment_reason_custom            text                      YES                                      
adjusted_by                         uuid                      YES                                      
adjusted_at                         timestamp with time zone  YES                                      
final_amount                        numeric                   YES                                      
  └─ Description: Montant final (GENERATED: COALESCE(adjusted_amount, calculated_amount))
interes_demora                      numeric                   YES        0                             
recargos                            numeric                   YES        0                             
sanciones                           numeric                   YES        0                             
total_a_ingresar                    numeric                   YES                                      
  └─ Description: Montant total à payer (final_amount + pénalités)
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
iva_dev_19_base                     numeric                   YES        0                             
  └─ Description: Campo 19: Base imponible Adquisiciones Intracomunitarias (IVA REAL uniquement)
iva_dev_19_tipo                     numeric                   YES                                      
  └─ Description: Campo 19: Tipo % Adquisiciones Intracomunitarias (IVA REAL uniquement)
iva_dev_020_cuota                   numeric                   YES                                      
  └─ Description: Campo 020: Cuota Adquisiciones Intracomunitarias = campo_19_base × campo_19_tipo / 100 (IVA REAL uniquement)
iva_subtype                         varchar(20)               YES        'destajo'::character varying  
  └─ Description: Sous-type IVA: destajo (simplifié) ou real (complet avec déductions)

Primary Key: id

Foreign Keys:
  - adjusted_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - adjustment_reason_id → adjustment_reasons.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - declaration_iva_details_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_iva_details_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_iva_details_tax_declaration_id_key ON public.declaration_iva_details USING btree (tax_declaration_id)
  - idx_declaration_iva_details_tax_declaration_id
    CREATE INDEX idx_declaration_iva_details_tax_declaration_id ON public.declaration_iva_details USING btree (tax_declaration_id)
  - idx_iva_details_subtype
    CREATE INDEX idx_iva_details_subtype ON public.declaration_iva_details USING btree (iva_subtype)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_OTHER_DETAILS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
form_template_id                    uuid                      YES                                      
form_code                           varchar(100)              NO                                       
  └─ Description: Type: iva_destajo, cuota_min_comun, sueldos_petrolero, sueldos_comun, residentes_comun_10, impreso_comun, impreso_liquidacion
form_data                           jsonb                     NO                                       
  └─ Description: Données complètes en JSONB (structure flexible selon sous-type)
calculated_amount                   numeric                   YES                                      
adjusted_amount                     numeric                   YES                                      
adjustment_reason_id                integer                   YES                                      
adjustment_reason_custom            text                      YES                                      
adjusted_by                         uuid                      YES                                      
adjusted_at                         timestamp with time zone  YES                                      
final_amount                        numeric                   YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - adjusted_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - adjustment_reason_id → adjustment_reasons.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - form_template_id → form_templates.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - declaration_other_details_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_other_details_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_other_details_tax_declaration_id_key ON public.declaration_other_details USING btree (tax_declaration_id)
  - idx_declaration_data_generic_tax_declaration_id
    CREATE INDEX idx_declaration_data_generic_tax_declaration_id ON public.declaration_other_details USING btree (tax_declaration_id)
  - idx_declaration_data_generic_subtype
    CREATE INDEX idx_declaration_data_generic_subtype ON public.declaration_other_details USING btree (form_code)
  - idx_other_details_form_data_gin
    CREATE INDEX idx_other_details_form_data_gin ON public.declaration_other_details USING gin (form_data)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_PETROLIFEROS_DETAILS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
petroleum_declaration_subtype       varchar(50)               NO                                       
  └─ Description: Sous-type: imp_prod_fmi, imp_prod_ivs, residentes_3, residentes_5, no_residentes_10, cuota_min_petrolera
base_imponible                      numeric                   YES        0                             
tipo_gravamen                       numeric                   YES        0                             
cantidad_producto                   numeric                   YES                                      
unidad_medida                       varchar(20)               YES                                      
precio_unitario                     numeric                   YES                                      
calculated_amount                   numeric                   YES                                      
adjusted_amount                     numeric                   YES                                      
adjustment_reason_id                integer                   YES                                      
adjustment_reason_custom            text                      YES                                      
adjusted_by                         uuid                      YES                                      
adjusted_at                         timestamp with time zone  YES                                      
final_amount                        numeric                   YES                                      
interes_demora                      numeric                   YES        0                             
recargos                            numeric                   YES        0                             
sanciones                           numeric                   YES        0                             
total_a_ingresar                    numeric                   YES                                      
subtype_specific_data               jsonb                     YES                                      
  └─ Description: Données spécifiques au sous-type (JSONB pour flexibilité entre les 6 types)
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - adjusted_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - adjustment_reason_id → adjustment_reasons.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - declaration_petroliferos_details_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_petroliferos_details_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_petroliferos_details_tax_declaration_id_key ON public.declaration_petroliferos_details USING btree (tax_declaration_id)
  - idx_declaration_petroliferos_data_tax_declaration_id
    CREATE INDEX idx_declaration_petroliferos_data_tax_declaration_id ON public.declaration_petroliferos_details USING btree (tax_declaration_id)
  - idx_declaration_petroliferos_data_subtype
    CREATE INDEX idx_declaration_petroliferos_data_subtype ON public.declaration_petroliferos_details USING btree (petroleum_declaration_subtype)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_RETENCION_DETAILS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
retencion_subtype                   varchar(50)               NO                                       
  └─ Description: Sous-type de rétention: 3pct_petrolero, 5pct_petrolero, 10pct_no_residentes_petrolero, 10pct_no_residentes_comun
tasa_retencion                      numeric                   NO                                       
  └─ Description: Taux de rétention: 3, 5, ou 10%
proveedores                         jsonb                     NO         '[]'::jsonb                   
  └─ Description: Array JSONB de fournisseurs: [{nombre, nif, actividad, monto_bruto}, ...] (max 7)
total_servicios_sujetos             numeric                   NO         0                             
  └─ Description: Campo 01: Somme des monto_bruto (services sujets à rétention)
total_gastos_reembolsados           numeric                   YES        0                             
  └─ Description: Campo 02: Gastos reembolsados 0% (non soumis à rétention)
sub_total                           numeric                   NO         0                             
  └─ Description: Campo 03: total_servicios_sujetos × tasa_retencion / 100
recargo_base                        numeric                   YES        0                             
recargo_tipo                        numeric                   YES        0                             
recargo_cuota                       numeric                   YES        0                             
  └─ Description: Campo 04: Pénalité recargo Art. 315.1
interes_demora_base                 numeric                   YES        0                             
interes_demora_tipo                 numeric                   YES        0                             
interes_demora_cuota                numeric                   YES        0                             
  └─ Description: Campo 05: Intérêt de retard Art. 315.5
total_a_ingresar                    numeric                   NO         0                             
  └─ Description: Campo 06: sub_total + recargo_cuota + interes_demora_cuota
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - declaration_retencion_details_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_retencion_details_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_retencion_details_tax_declaration_id_key ON public.declaration_retencion_details USING btree (tax_declaration_id)
  - idx_retencion_details_tax_declaration
    CREATE INDEX idx_retencion_details_tax_declaration ON public.declaration_retencion_details USING btree (tax_declaration_id)
  - idx_retencion_details_subtype
    CREATE INDEX idx_retencion_details_subtype ON public.declaration_retencion_details USING btree (retencion_subtype)
  - idx_retencion_details_tasa
    CREATE INDEX idx_retencion_details_tasa ON public.declaration_retencion_details USING btree (tasa_retencion)
  - idx_retencion_proveedores_gin
    CREATE INDEX idx_retencion_proveedores_gin ON public.declaration_retencion_details USING gin (proveedores)
  - idx_retencion_details_total
    CREATE INDEX idx_retencion_details_total ON public.declaration_retencion_details USING btree (total_a_ingresar)

----------------------------------------------------------------------------------------------------
Table: DOCUMENT_PROCESSING_QUEUE
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
uploaded_file_id                    uuid                      NO                                       
form_template_id                    uuid                      YES                                      
processing_type                     varchar(30)               NO         'ocr_extraction'::character va
ocr_engine_primary                  varchar(30)               YES        'cloud_vision'::character vary
ocr_engine_fallback                 varchar(30)               YES        'tesseract'::character varying
status                              varchar(20)               NO         'pending'::character varying  
retry_count                         integer                   YES        0                             
max_retries                         integer                   YES        5                             
next_retry_at                       timestamp with time zone  YES                                      
  └─ Description: Next retry timestamp with exponential backoff: NOW() + (10s * 3^retry_count)
result_data                         jsonb                     YES                                      
error_message                       text                      YES                                      
error_code                          varchar(50)               YES                                      
error_count                         integer                   YES        0                             
processing_started_at               timestamp with time zone  YES                                      
processing_completed_at             timestamp with time zone  YES                                      
processing_duration_ms              integer                   YES                                      
priority                            varchar(10)               YES        'normal'::character varying   
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
metadata                            jsonb                     YES        '{}'::jsonb                   

Primary Key: id

Foreign Keys:
  - form_template_id → form_templates.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - uploaded_file_id → uploaded_files.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_doc_queue_status_priority
    CREATE INDEX idx_doc_queue_status_priority ON public.document_processing_queue USING btree (status, priority DESC, next_retry_at) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'failed'::character varying])::text[]))
  - idx_doc_queue_retry
    CREATE INDEX idx_doc_queue_retry ON public.document_processing_queue USING btree (next_retry_at) WHERE (((status)::text = 'failed'::text) AND (retry_count < max_retries))
  - idx_doc_queue_uploaded_file
    CREATE INDEX idx_doc_queue_uploaded_file ON public.document_processing_queue USING btree (uploaded_file_id)
  - idx_doc_queue_dead_letter
    CREATE INDEX idx_doc_queue_dead_letter ON public.document_processing_queue USING btree (status, error_code) WHERE ((status)::text = 'dead_letter'::text)

----------------------------------------------------------------------------------------------------
Table: DOCUMENT_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('document_templates_id
template_code                       varchar(100)              NO                                       
document_name_es                    varchar(255)              NO                                       
description_es                      text                      YES                                      
category                            varchar(50)               YES                                      
validity_duration_months            integer                   YES                                      
validity_notes                      text                      YES                                      
usage_count                         integer                   NO         0                             
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          integer                   YES                                      

Primary Key: id

Unique Constraints:
  - document_templates_template_code_key: (template_code)

Indexes:
  - document_templates_template_code_key
    CREATE UNIQUE INDEX document_templates_template_code_key ON public.document_templates USING btree (template_code)
  - idx_document_templates_code
    CREATE INDEX idx_document_templates_code ON public.document_templates USING btree (template_code)
  - idx_document_templates_category
    CREATE INDEX idx_document_templates_category ON public.document_templates USING btree (category)

----------------------------------------------------------------------------------------------------
Table: DOCUMENT_TEMPLATES_BACKUP_20251017
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   YES                                      
template_code                       varchar(100)              YES                                      
document_name_es                    varchar(255)              YES                                      
description_es                      text                      YES                                      
category                            varchar(50)               YES                                      
validity_duration_months            integer                   YES                                      
validity_notes                      text                      YES                                      
usage_count                         integer                   YES                                      
is_active                           boolean                   YES                                      
created_at                          timestamp with time zone  YES                                      
updated_at                          timestamp with time zone  YES                                      
created_by                          integer                   YES                                      

----------------------------------------------------------------------------------------------------
Table: DOCUMENT_VERIFICATION_CONFIG
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
document_code                       varchar(50)               NO                                       
  └─ Description: Document code from service_request_documents (e.g., dip_gq, pasaporte_gq)
identifier_type                     identifier_type_enum      NO                                       
  └─ Description: Type of identifier to verify (dni, pasaporte, etc.)
extraction_paths                    ARRAY                     NO                                       
  └─ Description: JSON paths to extract identifier from extraction_data
source                              verification_source_enum  NO                                       
is_required                         boolean                   YES        true                          
  └─ Description: If true, verification failure affects overall status
normalization_regex                 varchar(100)              YES                                      
  └─ Description: Regex pattern for validating/normalizing identifier format
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Unique Constraints:
  - document_verification_config_document_code_identifier_type_key: (document_code, identifier_type)

Indexes:
  - document_verification_config_document_code_identifier_type_key
    CREATE UNIQUE INDEX document_verification_config_document_code_identifier_type_key ON public.document_verification_config USING btree (document_code, identifier_type)
  - idx_dvc_active
    CREATE INDEX idx_dvc_active ON public.document_verification_config USING btree (document_code) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: EMAIL_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('email_templates_id_se
template_code                       varchar(100)              NO                                       
name_es                             varchar(255)              NO                                       
name_fr                             varchar(255)              YES                                      
name_en                             varchar(255)              YES                                      
subject_es                          varchar(500)              NO                                       
subject_fr                          varchar(500)              YES                                      
subject_en                          varchar(500)              YES                                      
description_es                      text                      YES                                      
description_fr                      text                      YES                                      
description_en                      text                      YES                                      
html_file_path                      varchar(500)              YES                                      
  └─ Description: DEPRECATED: Path to HTML file. Use html_content instead.
variables                           jsonb                     YES        '[]'::jsonb                   
category                            varchar(100)              YES                                      
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      
html_content                        text                      YES                                      
  └─ Description: HTML content stored directly (preferred). Contains multilingual sections.

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - email_templates_template_code_key: (template_code)

Indexes:
  - email_templates_template_code_key
    CREATE UNIQUE INDEX email_templates_template_code_key ON public.email_templates USING btree (template_code)
  - idx_email_templates_code
    CREATE INDEX idx_email_templates_code ON public.email_templates USING btree (template_code)
  - idx_email_templates_category
    CREATE INDEX idx_email_templates_category ON public.email_templates USING btree (category)
  - idx_email_templates_active
    CREATE INDEX idx_email_templates_active ON public.email_templates USING btree (is_active)

----------------------------------------------------------------------------------------------------
Table: ENTITIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
code                                varchar(50)               NO                                       
name                                varchar(255)              NO                                       
description                         text                      YES                                      
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      
ministry_id                         integer                   YES                                      
  └─ Description: Optional ministry link. Entities can be independent (NULL) or linked to a ministry.
parent_entity_id                    uuid                      YES                                      
  └─ Description: For departments: the parent entity. NULL for top-level entities.
entity_type                         entity_type_enum          NO         'entity'::entity_type_enum    
  └─ Description: entity = top-level (can be independent or ministry-linked), department = must have parent

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - parent_entity_id → entities.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - entities_code_key: (code)

Indexes:
  - idx_entities_ministry_id
    CREATE INDEX idx_entities_ministry_id ON public.entities USING btree (ministry_id)
  - idx_entities_parent_entity_id
    CREATE INDEX idx_entities_parent_entity_id ON public.entities USING btree (parent_entity_id)
  - idx_entities_entity_type
    CREATE INDEX idx_entities_entity_type ON public.entities USING btree (entity_type)
  - entities_code_key
    CREATE UNIQUE INDEX entities_code_key ON public.entities USING btree (code)
  - idx_entities_active
    CREATE INDEX idx_entities_active ON public.entities USING btree (is_active) WHERE (is_active = true)
  - idx_entities_code
    CREATE INDEX idx_entities_code ON public.entities USING btree (code)

----------------------------------------------------------------------------------------------------
Table: ENTITY_LOCATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
entity_code                         varchar(50)               NO                                       
  └─ Description: Entity code (CNEDOGE, DGT, EXTRANJERIA, MINFP, ONRC, MINHV)
city                                varchar(100)              NO                                       
  └─ Description: City: Malabo (Insular) or Bata/Mongomo/Evinayong/Ebebiyin (Continental)
region                              varchar(50)               NO                                       
  └─ Description: Region: Insular (Bioko island) or Continental (mainland)
location_name                       varchar(255)              NO                                       
location_address                    text                      YES                                      
phone                               varchar(50)               YES                                      
email                               varchar(255)              YES                                      
is_main_office                      boolean                   NO         false                         
  └─ Description: True for main office (typically in Malabo, the capital)
is_active                           boolean                   NO         true                          
operating_hours                     jsonb                     YES        '{"friday": {"open": "08:00", 
  └─ Description: Operating hours per day as JSONB: {"monday": {"open": "08:00", "close": "16:00"}, ...}
notes                               text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      
city_id                             uuid                      YES                                      
entity_id                           uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - city_id → cities.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - entity_id → entities.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - unique_entity_city: (entity_code, city)

Indexes:
  - unique_entity_city
    CREATE UNIQUE INDEX unique_entity_city ON public.entity_locations USING btree (entity_code, city)
  - idx_entity_locations_entity
    CREATE INDEX idx_entity_locations_entity ON public.entity_locations USING btree (entity_code)
  - idx_entity_locations_city
    CREATE INDEX idx_entity_locations_city ON public.entity_locations USING btree (city)
  - idx_entity_locations_region
    CREATE INDEX idx_entity_locations_region ON public.entity_locations USING btree (region)
  - idx_entity_locations_active
    CREATE INDEX idx_entity_locations_active ON public.entity_locations USING btree (is_active) WHERE (is_active = true)
  - idx_entity_locations_entity_active
    CREATE INDEX idx_entity_locations_entity_active ON public.entity_locations USING btree (entity_code, is_active) WHERE (is_active = true)
  - idx_entity_locations_city_id
    CREATE INDEX idx_entity_locations_city_id ON public.entity_locations USING btree (city_id)
  - idx_entity_locations_entity_id
    CREATE INDEX idx_entity_locations_entity_id ON public.entity_locations USING btree (entity_id)

----------------------------------------------------------------------------------------------------
Table: ENTITY_TRANSLATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
entity_type                         translatable_entity_type  NO                                       
entity_code                         varchar(100)              NO                                       
language_code                       varchar(5)                NO                                       
field_name                          varchar(30)               NO                                       
translation_text                    text                      NO                                       
translation_source                  varchar(20)               YES        'manual'::character varying   
translation_quality                 numeric                   YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: entity_type, entity_code, language_code, field_name

----------------------------------------------------------------------------------------------------
Table: EXPORT_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('export_templates_id_s
code                                varchar(50)               NO                                       
name_es                             varchar(100)              NO                                       
export_type                         export_type_enum          NO                                       
export_format                       varchar(20)               NO         'csv'::character varying      
config                              jsonb                     NO         '{}'::jsonb                   
columns_config                      jsonb                     NO                                       
  └─ Description: Configuration des colonnes: [{source, target, transform, format}]
description_es                      text                      YES                                      
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Unique Constraints:
  - export_templates_code_key: (code)

Indexes:
  - export_templates_code_key
    CREATE UNIQUE INDEX export_templates_code_key ON public.export_templates USING btree (code)

----------------------------------------------------------------------------------------------------
Table: EXTRACTION_SCHEMAS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('extraction_schemas_id
category                            varchar(50)               NO                                       
  └─ Description: Catégorie du schema (identity, medical, contract, etc.)
schema_filename                     varchar(100)              NO                                       
description                         text                      YES                                      
document_types                      ARRAY                     YES        '{}'::text[]                  
workflow_codes                      ARRAY                     YES        '{}'::text[]                  
default_tarification                jsonb                     YES                                      
  └─ Description: Règles de tarification par défaut définies dans le schema
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Unique Constraints:
  - extraction_schemas_category_key: (category)

Indexes:
  - extraction_schemas_category_key
    CREATE UNIQUE INDEX extraction_schemas_category_key ON public.extraction_schemas USING btree (category)

----------------------------------------------------------------------------------------------------
Table: FISCAL_SERVICE_DATA
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      NO                                       
fiscal_service_id                   integer                   NO                                       
uploaded_file_id                    uuid                      YES                                      
  └─ Description: Lien vers le fichier scanné (si OCR Tesseract utilisé)
ocr_extraction_id                   uuid                      YES                                      
  └─ Description: Lien vers les résultats OCR Tesseract bruts
status                              varchar(20)               NO         'draft'::character varying    
numero_nota                         varchar(50)               YES                                      
nom_demandeur                       text                      YES                                      
concepto_pago                       text                      YES                                      
periode                             varchar(50)               YES                                      
montant_chiffre                     numeric                   YES                                      
  └─ Description: Montant en chiffres (extrait par OCR Tesseract ou saisi)
montant_lettre                      text                      YES                                      
  └─ Description: Montant en lettres (pour vérification croisée)
date_expiration                     date                      YES                                      
additional_data                     jsonb                     YES                                      
final_amount                        numeric                   YES                                      
currency                            varchar(3)                YES        'XAF'::character varying      
payment_id                          uuid                      YES                                      
supporting_documents                ARRAY                     YES        '{}'::uuid[]                  
reviewed_by                         uuid                      YES                                      
reviewed_at                         timestamp with time zone  YES                                      
review_notes                        text                      YES                                      
submitted_at                        timestamp with time zone  YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
type_compte                         type_compte_enum          YES                                      
  └─ Description: Type de compte pour le paiement (saisi manuellement par utilisateur): compte_propia (particulier) ou cuenta_empresa (entreprise)
date_emission                       date                      YES                                      
  └─ Description: Date d'émission du document (extraite par OCR, proche du numéro de nota)
organisme_emetteur                  text                      YES                                      
  └─ Description: Organisme émetteur du document (ex: MINISTERIO DE SEGURIDAD NACIONAL)
departement_emetteur                text                      YES                                      
  └─ Description: Département émetteur (ex: DIRECCION GENERAL DE EXTRANJERIA Y FRONTERAS)
compte_destinataire                 text                      YES                                      
  └─ Description: Compte bancaire destinataire (ex: Cuenta de la TESORERIA GENERAL DEL ESTADO)
signataire                          text                      YES                                      
  └─ Description: Nom du signataire du document (ex: EL JEFE DE LA SECCION)
code_reference                      text                      YES                                      
  └─ Description: Code de référence manuscrit (ex: AA0516 visible sur l'image)
tampon_officiel                     boolean                   YES        false                         
  └─ Description: Indicateur de présence du tampon officiel (détecté par OCR image analysis)
dias_validez                        integer                   YES        15                            
  └─ Description: Jours de validité de la nota de ingreso (extrait de "se caduca a los X días"). Default: 15 jours.

Primary Key: id

Foreign Keys:
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - ocr_extraction_id → ocr_extraction_results.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - payment_id → payments.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - reviewed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - uploaded_file_id → uploaded_files.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_fiscal_service_data_user_id
    CREATE INDEX idx_fiscal_service_data_user_id ON public.fiscal_service_data USING btree (user_id)
  - idx_fiscal_service_data_fiscal_service_id
    CREATE INDEX idx_fiscal_service_data_fiscal_service_id ON public.fiscal_service_data USING btree (fiscal_service_id)
  - idx_fiscal_service_data_status
    CREATE INDEX idx_fiscal_service_data_status ON public.fiscal_service_data USING btree (status)
  - idx_fiscal_service_data_payment_id
    CREATE INDEX idx_fiscal_service_data_payment_id ON public.fiscal_service_data USING btree (payment_id) WHERE (payment_id IS NOT NULL)
  - idx_fiscal_service_data_unique_numero_nota
    CREATE UNIQUE INDEX idx_fiscal_service_data_unique_numero_nota ON public.fiscal_service_data USING btree (user_id, numero_nota) WHERE (numero_nota IS NOT NULL)
  - idx_fiscal_service_data_date_emission
    CREATE INDEX idx_fiscal_service_data_date_emission ON public.fiscal_service_data USING btree (date_emission) WHERE (date_emission IS NOT NULL)
  - idx_fiscal_service_data_type_compte
    CREATE INDEX idx_fiscal_service_data_type_compte ON public.fiscal_service_data USING btree (type_compte) WHERE (type_compte IS NOT NULL)
  - idx_fiscal_service_data_organisme
    CREATE INDEX idx_fiscal_service_data_organisme ON public.fiscal_service_data USING btree (organisme_emetteur) WHERE (organisme_emetteur IS NOT NULL)
  - idx_fiscal_service_data_date_expiration
    CREATE INDEX idx_fiscal_service_data_date_expiration ON public.fiscal_service_data USING btree (date_expiration) WHERE (date_expiration IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: FISCAL_SERVICES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('fiscal_services_id_se
service_code                        varchar(10)               NO                                       
category_id                         integer                   NO                                       
name_es                             varchar(255)              NO                                       
description_es                      text                      YES                                      
service_type                        service_type_enum         NO                                       
calculation_method                  calculation_method_enum   NO                                       
tasa_expedicion                     numeric                   YES        0.0                           
expedition_formula                  text                      YES                                      
expedition_unit_measure             varchar(50)               YES                                      
tasa_renovacion                     numeric                   YES        0.0                           
renewal_formula                     text                      YES                                      
renewal_unit_measure                varchar(50)               YES                                      
calculation_config                  jsonb                     YES        '{}'::jsonb                   
rate_tiers                          jsonb                     YES        '[]'::jsonb                   
base_percentage                     numeric                   YES                                      
percentage_of                       varchar(100)              YES                                      
unit_rate                           numeric                   YES                                      
unit_type                           varchar(50)               YES                                      
parent_service_id                   integer                   YES                                      
tier_group_name                     varchar(100)              YES                                      
is_tier_component                   boolean                   YES        false                         
validity_period_months              integer                   YES                                      
renewal_frequency_months            integer                   YES                                      
grace_period_days                   integer                   YES        0                             
late_penalty_percentage             numeric                   YES                                      
late_penalty_fixed                  numeric                   YES                                      
penalty_calculation_rules           jsonb                     YES        '{}'::jsonb                   
eligibility_criteria                jsonb                     YES        '{}'::jsonb                   
exemption_conditions                jsonb                     YES        '[]'::jsonb                   
legal_reference                     text                      YES                                      
regulatory_articles                 ARRAY                     YES                                      
tariff_effective_from               date                      NO         CURRENT_DATE                  
tariff_effective_to                 date                      YES                                      
status                              service_status_enum       YES        'active'::service_status_enum 
priority                            integer                   YES        0                             
complexity_level                    integer                   YES        1                             
processing_time_days                integer                   YES        1                             
view_count                          integer                   YES        0                             
calculation_count                   integer                   YES        0                             
payment_count                       integer                   YES        0                             
favorite_count                      integer                   YES        0                             
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      
search_vector                       tsvector                  YES                                      
  └─ Description: Full-text search vector (Spanish). Auto-updated via trigger. Weight A for name_es, B for description_es.
embedding                           vector                    YES                                      
  └─ Description: Semantic embedding vector for AI search (Gemini text-embedding-004, 768 dimensions)
embedding_generated_at              timestamp with time zone  YES                                      
  └─ Description: Timestamp when the embedding was last generated/updated
embedding_model                     varchar(50)               YES        'text-embedding-004'::characte
  └─ Description: Model used to generate the embedding (e.g., text-embedding-004)
embedding_version                   integer                   YES        1                             
  └─ Description: Version of the embedding (incremented on regeneration)
needs_embedding_update              boolean                   YES        true                          
  └─ Description: Flag indicating if service needs embedding regeneration after content update
workflow_code                       varchar(100)              YES                                      
  └─ Description: Code du workflow associé (ex: pasaporte_nuevo, residencia)

Primary Key: id

Foreign Keys:
  - category_id → categories.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - parent_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - fiscal_services_service_code_key: (service_code)

Indexes:
  - fiscal_services_service_code_key
    CREATE UNIQUE INDEX fiscal_services_service_code_key ON public.fiscal_services USING btree (service_code)
  - idx_fiscal_services_code
    CREATE INDEX idx_fiscal_services_code ON public.fiscal_services USING btree (service_code)
  - idx_fiscal_services_active
    CREATE INDEX idx_fiscal_services_active ON public.fiscal_services USING btree (status, service_type) WHERE (status = 'active'::service_status_enum)
  - idx_fiscal_services_category
    CREATE INDEX idx_fiscal_services_category ON public.fiscal_services USING btree (category_id, status)
  - idx_fiscal_services_search_vector
    CREATE INDEX idx_fiscal_services_search_vector ON public.fiscal_services USING gin (search_vector)
  - idx_fiscal_services_embedding_hnsw
    CREATE INDEX idx_fiscal_services_embedding_hnsw ON public.fiscal_services USING hnsw (embedding vector_cosine_ops) WITH (m='16', ef_construction='64')
  - idx_fiscal_services_workflow_code
    CREATE INDEX idx_fiscal_services_workflow_code ON public.fiscal_services USING btree (workflow_code) WHERE (workflow_code IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: FORM_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
template_category                   varchar(30)               NO                                       
  └─ Description: Catégorie: tax_declaration (13 types) ou fiscal_service (1 type)
template_code                       varchar(100)              NO                                       
  └─ Description: Code unique du template (ex: IVA_REAL_2025, IRPF_2025, NOTA_INGRESO_2025)
name_es                             text                      NO                                       
name_fr                             text                      YES                                      
name_en                             text                      YES                                      
description                         text                      YES                                      
declaration_type                    declaration_type_enum     YES                                      
fiscal_service_id                   integer                   YES                                      
version                             integer                   NO         1                             
  └─ Description: Version du template (permet d'avoir plusieurs versions actives simultanément)
template_schema                     jsonb                     NO                                       
  └─ Description: Schéma JSON définissant les champs et leurs coordonnées pour OCR Tesseract (x, y, w, h, data_type, validation_regex)
is_active                           boolean                   NO         true                          
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - form_templates_template_code_key: (template_code)
  - form_templates_template_code_version_key: (template_code, version)

Indexes:
  - form_templates_template_code_key
    CREATE UNIQUE INDEX form_templates_template_code_key ON public.form_templates USING btree (template_code)
  - form_templates_template_code_version_key
    CREATE UNIQUE INDEX form_templates_template_code_version_key ON public.form_templates USING btree (template_code, version)
  - idx_form_templates_template_code
    CREATE INDEX idx_form_templates_template_code ON public.form_templates USING btree (template_code) WHERE (is_active = true)
  - idx_form_templates_category
    CREATE INDEX idx_form_templates_category ON public.form_templates USING btree (template_category)

----------------------------------------------------------------------------------------------------
Table: GEMINI_PROCESSING_LOGS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      YES                                      
document_id                         uuid                      YES                                      
user_id                             uuid                      YES                                      
document_code                       varchar(100)              YES                                      
document_name                       varchar(255)              YES                                      
mime_type                           varchar(100)              YES                                      
file_size_bytes                     integer                   YES                                      
processor                           varchar(20)               NO         'gemini'::character varying   
  └─ Description: Processeur utilise: gemini, tesseract, hybrid
gemini_model                        varchar(100)              YES                                      
document_type_detected              varchar(100)              YES                                      
document_category                   varchar(50)               YES                                      
  └─ Description: Categorie schema: identity, medical, contract, etc.
classification_confidence           numeric                   YES                                      
extraction_result                   jsonb                     YES        '{}'::jsonb                   
  └─ Description: Resultat extraction structure par blocs JSON
extraction_confidence               numeric                   YES                                      
fields_extracted                    integer                   YES        0                             
fields_missing                      integer                   YES        0                             
required_fields_present             boolean                   YES                                      
risk_score                          numeric                   YES                                      
risk_level                          varchar(20)               YES                                      
risk_factors                        jsonb                     YES        '[]'::jsonb                   
  └─ Description: Liste des facteurs de risque detectes
coherence_valid                     boolean                   YES                                      
  └─ Description: Resultat des verifications de coherence
coherence_checks_passed             ARRAY                     YES                                      
coherence_checks_failed             ARRAY                     YES                                      
recommendation                      varchar(30)               YES                                      
  └─ Description: Recommendation: auto_approve, manual_review, request_documents, reject
is_match                            boolean                   YES                                      
match_confidence                    numeric                   YES                                      
matched_document_code               varchar(100)              YES                                      
processing_time_ms                  integer                   YES                                      
gemini_latency_ms                   integer                   YES                                      
tesseract_latency_ms                integer                   YES                                      
used_fallback                       boolean                   YES        false                         
  └─ Description: TRUE si Tesseract fallback a ete utilise
fallback_reason                     varchar(255)              YES                                      
has_error                           boolean                   YES        false                         
error_type                          varchar(100)              YES                                      
error_message                       text                      YES                                      
error_details                       jsonb                     YES                                      
prompt_template_id                  varchar(100)              YES                                      
prompt_version                      varchar(20)               YES                                      
input_tokens                        integer                   YES                                      
output_tokens                       integer                   YES                                      
total_tokens                        integer                   YES                                      
  └─ Description: Total tokens Gemini utilises (pour monitoring couts)
schema_category                     varchar(50)               YES                                      
schema_filename                     varchar(100)              YES                                      
workflow_code                       varchar(100)              YES                                      
solicitud_type                      varchar(50)               YES                                      
request_metadata                    jsonb                     YES        '{}'::jsonb                   
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - document_id → service_request_documents.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_gpl_service_request
    CREATE INDEX idx_gpl_service_request ON public.gemini_processing_logs USING btree (service_request_id)
  - idx_gpl_document_id
    CREATE INDEX idx_gpl_document_id ON public.gemini_processing_logs USING btree (document_id)
  - idx_gpl_user_id
    CREATE INDEX idx_gpl_user_id ON public.gemini_processing_logs USING btree (user_id)
  - idx_gpl_created_at
    CREATE INDEX idx_gpl_created_at ON public.gemini_processing_logs USING btree (created_at DESC)
  - idx_gpl_document_type
    CREATE INDEX idx_gpl_document_type ON public.gemini_processing_logs USING btree (document_type_detected)
  - idx_gpl_category
    CREATE INDEX idx_gpl_category ON public.gemini_processing_logs USING btree (document_category)
  - idx_gpl_workflow
    CREATE INDEX idx_gpl_workflow ON public.gemini_processing_logs USING btree (workflow_code)
  - idx_gpl_processor
    CREATE INDEX idx_gpl_processor ON public.gemini_processing_logs USING btree (processor)
  - idx_gpl_errors
    CREATE INDEX idx_gpl_errors ON public.gemini_processing_logs USING btree (has_error) WHERE (has_error = true)
  - idx_gpl_recommendation
    CREATE INDEX idx_gpl_recommendation ON public.gemini_processing_logs USING btree (recommendation)
  - idx_gpl_analytics
    CREATE INDEX idx_gpl_analytics ON public.gemini_processing_logs USING btree (created_at DESC, document_category, recommendation)

----------------------------------------------------------------------------------------------------
Table: IMPORT_BATCH_ITEMS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
batch_id                            uuid                      NO                                       
row_number                          integer                   NO                                       
raw_data                            jsonb                     NO                                       
  └─ Description: Données brutes de la ligne Excel (JSONB: {col_name: value})
status                              varchar(20)               NO         'pending'::character varying  
created_entity_id                   uuid                      YES                                      
  └─ Description: FK vers l'entité créée (tax_declaration, payment, etc.)
created_entity_type                 varchar(50)               YES                                      
validation_errors                   jsonb                     YES                                      
  └─ Description: Erreurs de validation (field_name: [error_messages])
error_message                       text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
processed_at                        timestamp with time zone  YES                                      

Primary Key: id

Foreign Keys:
  - batch_id → import_batches.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - import_batch_items_batch_id_row_number_key: (batch_id, row_number)

Indexes:
  - import_batch_items_batch_id_row_number_key
    CREATE UNIQUE INDEX import_batch_items_batch_id_row_number_key ON public.import_batch_items USING btree (batch_id, row_number)
  - idx_import_batch_items_batch_id
    CREATE INDEX idx_import_batch_items_batch_id ON public.import_batch_items USING btree (batch_id)
  - idx_import_batch_items_status
    CREATE INDEX idx_import_batch_items_status ON public.import_batch_items USING btree (status)

----------------------------------------------------------------------------------------------------
Table: IMPORT_BATCHES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
uploaded_by                         uuid                      NO                                       
file_name                           varchar(255)              NO                                       
file_path                           text                      NO                                       
file_size_bytes                     bigint                    YES                                      
import_type                         varchar(50)               NO                                       
  └─ Description: Type d'import: declarations_iva, declarations_irpf, declarations_petroliferos, declarations_generic, payments, companies, users
total_rows                          integer                   NO                                       
rows_processed                      integer                   YES        0                             
rows_success                        integer                   YES        0                             
rows_failed                         integer                   YES        0                             
status                              varchar(20)               NO         'pending'::character varying  
validation_errors                   jsonb                     YES                                      
  └─ Description: Erreurs de validation globales (structure fichier, colonnes manquantes, etc.)
created_at                          timestamp with time zone  NO         now()                         
started_at                          timestamp with time zone  YES                                      
completed_at                        timestamp with time zone  YES                                      

Primary Key: id

Foreign Keys:
  - uploaded_by → users.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)

Indexes:
  - idx_import_batches_uploaded_by
    CREATE INDEX idx_import_batches_uploaded_by ON public.import_batches USING btree (uploaded_by)
  - idx_import_batches_status
    CREATE INDEX idx_import_batches_status ON public.import_batches USING btree (status)
  - idx_import_batches_created_at
    CREATE INDEX idx_import_batches_created_at ON public.import_batches USING btree (created_at DESC)

----------------------------------------------------------------------------------------------------
Table: MINISTRIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('ministries_id_seq'::r
ministry_code                       varchar(10)               NO                                       
name_es                             varchar(255)              NO                                       
description_es                      text                      YES                                      
display_order                       integer                   YES        0                             
icon                                varchar(100)              YES                                      
color                               varchar(7)                YES                                      
website_url                         varchar(255)              YES                                      
contact_email                       varchar(255)              YES                                      
contact_phone                       varchar(50)               YES                                      
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Unique Constraints:
  - ministries_ministry_code_key: (ministry_code)

Indexes:
  - ministries_ministry_code_key
    CREATE UNIQUE INDEX ministries_ministry_code_key ON public.ministries USING btree (ministry_code)
  - idx_ministries_code
    CREATE INDEX idx_ministries_code ON public.ministries USING btree (ministry_code)
  - idx_ministries_active
    CREATE INDEX idx_ministries_active ON public.ministries USING btree (is_active) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: MINISTRY_VALIDATION_CONFIG
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('ministry_validation_c
ministry_id                         integer                   NO                                       
service_type                        service_type_enum         NO                                       
auto_approval_enabled               boolean                   YES        false                         
auto_approval_max_amount            numeric                   YES        0                             
auto_approval_conditions            jsonb                     YES        '{}'::jsonb                   
auto_approval_max_per_day           integer                   YES        10                            
auto_approval_max_per_user_month    integer                   YES        5                             
auto_approval_business_hours_only   boolean                   YES        true                          
target_review_hours                 integer                   YES        24                            
warning_threshold_hours             integer                   YES        18                            
escalation_hours                    integer                   YES        72                            
max_lock_duration_minutes           integer                   YES        120                           
mandatory_document_types            ARRAY                     YES        '{}'::text[]                  
optional_document_types             ARRAY                     YES        '{}'::text[]                  
business_rules                      jsonb                     YES        '{}'::jsonb                   
validation_checklist                jsonb                     YES        '[]'::jsonb                   
notify_on_submission                boolean                   YES        true                          
notify_on_escalation                boolean                   YES        true                          
notification_email                  text                      YES                                      
is_active                           boolean                   YES        true                          
effective_from                      date                      YES        CURRENT_DATE                  
effective_to                        date                      YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - ministry_validation_config_ministry_id_service_type_key: (ministry_id, service_type)

Indexes:
  - ministry_validation_config_ministry_id_service_type_key
    CREATE UNIQUE INDEX ministry_validation_config_ministry_id_service_type_key ON public.ministry_validation_config USING btree (ministry_id, service_type)

----------------------------------------------------------------------------------------------------
Table: NOTIFICATION_LOG
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      YES                                      
user_id                             uuid                      NO                                       
channel                             varchar(20)               NO                                       
  └─ Description: Canal: email, sms, push, in_app, whatsapp
template_code                       varchar(100)              NO                                       
  └─ Description: Code du template utilisé (ex: cita_scheduled)
recipient_email                     varchar(255)              YES                                      
recipient_phone                     varchar(50)               YES                                      
recipient_device_token              text                      YES                                      
subject                             varchar(500)              YES                                      
content_preview                     varchar(500)              YES                                      
template_variables                  jsonb                     YES        '{}'::jsonb                   
status                              varchar(30)               NO         'queued'::character varying   
  └─ Description: Status: queued, sending, sent, delivered, failed, bounced, opened, clicked
external_id                         varchar(255)              YES                                      
  └─ Description: ID du provider externe (SendGrid, Twilio, Firebase)
external_provider                   varchar(50)               YES                                      
queued_at                           timestamp with time zone  NO         now()                         
sent_at                             timestamp with time zone  YES                                      
delivered_at                        timestamp with time zone  YES                                      
opened_at                           timestamp with time zone  YES                                      
clicked_at                          timestamp with time zone  YES                                      
failed_at                           timestamp with time zone  YES                                      
error_code                          varchar(50)               YES                                      
error_message                       text                      YES                                      
retry_count                         integer                   YES        0                             
next_retry_at                       timestamp with time zone  YES                                      
trigger_event                       varchar(100)              YES                                      
  └─ Description: Événement déclencheur (status_change, reminder_3d, etc.)
triggered_by                        varchar(50)               YES        'system'::character varying   
metadata                            jsonb                     YES        '{}'::jsonb                   
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_nl_status
    CREATE INDEX idx_nl_status ON public.notification_log USING btree (status) WHERE ((status)::text = ANY ((ARRAY['queued'::character varying, 'failed'::character varying])::text[]))
  - idx_nl_channel
    CREATE INDEX idx_nl_channel ON public.notification_log USING btree (channel)
  - idx_nl_created_at
    CREATE INDEX idx_nl_created_at ON public.notification_log USING btree (created_at DESC)
  - idx_nl_external_id
    CREATE INDEX idx_nl_external_id ON public.notification_log USING btree (external_id) WHERE (external_id IS NOT NULL)
  - idx_nl_retry
    CREATE INDEX idx_nl_retry ON public.notification_log USING btree (next_retry_at) WHERE (((status)::text = 'failed'::text) AND (next_retry_at IS NOT NULL) AND (retry_count < 3))
  - idx_nl_analytics
    CREATE INDEX idx_nl_analytics ON public.notification_log USING btree (created_at DESC, channel, status)
  - idx_nl_service_request
    CREATE INDEX idx_nl_service_request ON public.notification_log USING btree (service_request_id) WHERE (service_request_id IS NOT NULL)
  - idx_nl_user_id
    CREATE INDEX idx_nl_user_id ON public.notification_log USING btree (user_id)

----------------------------------------------------------------------------------------------------
Table: NOTIFICATION_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('notification_template
template_code                       varchar(100)              NO                                       
name_es                             varchar(255)              NO                                       
name_fr                             varchar(255)              YES                                      
name_en                             varchar(255)              YES                                      
title_es                            varchar(255)              NO                                       
title_fr                            varchar(255)              YES                                      
title_en                            varchar(255)              YES                                      
body_es                             text                      NO                                       
body_fr                             text                      YES                                      
body_en                             text                      YES                                      
icon                                varchar(100)              YES                                      
action_url                          varchar(500)              YES                                      
variables                           jsonb                     YES        '[]'::jsonb                   
notification_type                   varchar(50)               YES                                      
priority                            varchar(20)               YES        'normal'::character varying   
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - notification_templates_template_code_key: (template_code)

Indexes:
  - idx_notification_templates_code
    CREATE INDEX idx_notification_templates_code ON public.notification_templates USING btree (template_code)
  - idx_notification_templates_type
    CREATE INDEX idx_notification_templates_type ON public.notification_templates USING btree (notification_type)
  - idx_notification_templates_active
    CREATE INDEX idx_notification_templates_active ON public.notification_templates USING btree (is_active)
  - notification_templates_template_code_key
    CREATE UNIQUE INDEX notification_templates_template_code_key ON public.notification_templates USING btree (template_code)

----------------------------------------------------------------------------------------------------
Table: OCR_EXTRACTION_RESULTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
uploaded_file_id                    uuid                      NO                                       
ocr_engine                          ocr_engine_enum           NO                                       
extracted_data                      jsonb                     NO                                       
  └─ Description: Données extraites par OCR Tesseract (JSONB: {field_name: value, ...})
confidence_score                    numeric                   YES                                      
  └─ Description: Score de confiance OCR Tesseract (0.0 à 1.0, NULL si manual)
processing_time_ms                  integer                   YES                                      
tesseract_version                   varchar(20)               YES                                      
language_used                       varchar(10)               YES        'spa+fra+eng'::character varyi
  └─ Description: Langues Tesseract utilisées (spa=Espagnol, fra=Français, eng=Anglais)
status                              varchar(20)               NO         'pending_validation'::characte
  └─ Description: Statut de validation: en attente, validé, rejeté ou corrigé
validated_by                        uuid                      YES                                      
validated_at                        timestamp with time zone  YES                                      
validation_notes                    text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - uploaded_file_id → uploaded_files.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - validated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_ocr_extraction_results_uploaded_file_id
    CREATE INDEX idx_ocr_extraction_results_uploaded_file_id ON public.ocr_extraction_results USING btree (uploaded_file_id)
  - idx_ocr_extraction_results_status
    CREATE INDEX idx_ocr_extraction_results_status ON public.ocr_extraction_results USING btree (status)

----------------------------------------------------------------------------------------------------
Table: PAYMENT_ANOMALIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
entity_type                         varchar(50)               NO                                       
  └─ Description: Type d entite concernee: service_payment, bank_transaction, payment
entity_id                           uuid                      NO                                       
payment_reference                   varchar(100)              YES                                      
service_request_id                  uuid                      YES                                      
service_request_reference           varchar(50)               YES                                      
anomaly_type                        anomaly_type_enum         NO                                       
severity                            anomaly_severity_enum     NO         'medium'::anomaly_severity_enu
status                              anomaly_status_enum       NO         'open'::anomaly_status_enum   
title                               varchar(255)              NO                                       
description                         text                      YES                                      
detection_rule                      varchar(100)              YES                                      
  └─ Description: Identifiant de la regle metier qui a detecte l anomalie (ex: RULE_DUPLICATE_24H)
detection_details                   jsonb                     YES                                      
  └─ Description: Donnees JSONB capturees au moment de la detection (contexte, valeurs comparees)
expected_amount                     numeric                   YES                                      
actual_amount                       numeric                   YES                                      
difference_amount                   numeric                   YES                                      
resolution_notes                    text                      YES                                      
resolved_at                         timestamp with time zone  YES                                      
resolved_by                         uuid                      YES                                      
detected_at                         timestamp with time zone  NO         now()                         
detected_by                         varchar(50)               NO         'system'::character varying   
  └─ Description: system pour detection automatique, sinon user_id pour signalement manuel
updated_at                          timestamp with time zone  NO         now()                         
affected_amount                     numeric                   YES                                      
  └─ Description: Monto afectado por la anomalia (ej: monto duplicado, diferencia de reconciliacion)
related_entities                    jsonb                     YES                                      
  └─ Description: Entites liees (ex: {bank_transaction_id, duplicate_count, etc.})
metadata                            jsonb                     YES                                      
  └─ Description: Metadonnees supplementaires (user_id pour suspicious_pattern, etc.)

Primary Key: id

Foreign Keys:
  - resolved_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_anomalies_open
    CREATE INDEX idx_anomalies_open ON public.payment_anomalies USING btree (status, severity DESC, detected_at DESC) WHERE (status = ANY (ARRAY['open'::anomaly_status_enum, 'investigating'::anomaly_status_enum]))
  - idx_anomalies_entity
    CREATE INDEX idx_anomalies_entity ON public.payment_anomalies USING btree (entity_type, entity_id)
  - idx_anomalies_severity_status
    CREATE INDEX idx_anomalies_severity_status ON public.payment_anomalies USING btree (severity, status)
  - idx_anomalies_type
    CREATE INDEX idx_anomalies_type ON public.payment_anomalies USING btree (anomaly_type)
  - idx_anomalies_detected_at
    CREATE INDEX idx_anomalies_detected_at ON public.payment_anomalies USING btree (detected_at DESC)
  - idx_anomalies_payment_ref
    CREATE INDEX idx_anomalies_payment_ref ON public.payment_anomalies USING btree (payment_reference) WHERE (payment_reference IS NOT NULL)
  - idx_anomalies_service_request
    CREATE INDEX idx_anomalies_service_request ON public.payment_anomalies USING btree (service_request_id) WHERE (service_request_id IS NOT NULL)
  - idx_anomalies_metadata_user
    CREATE INDEX idx_anomalies_metadata_user ON public.payment_anomalies USING gin (((metadata -> 'user_id'::text)))

----------------------------------------------------------------------------------------------------
Table: PAYMENT_INSTALLMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
payment_plan_id                     uuid                      NO                                       
installment_number                  integer                   NO                                       
  └─ Description: Numéro de l'acompte dans le plan (1, 2, 3...)
amount_due                          numeric                   NO                                       
  └─ Description: Montant dû pour cet acompte
amount_paid                         numeric                   NO         0                             
remaining_amount                    numeric                   YES                                      
  └─ Description: Montant restant à payer (GENERATED: amount_due - amount_paid)
due_date                            date                      NO                                       
grace_period_days                   integer                   NO         7                             
  └─ Description: Délai de grâce après due_date avant application des pénalités
status                              varchar(20)               NO         'pending'::character varying  
late_fee                            numeric                   NO         0                             
  └─ Description: Pénalité de retard appliquée (calculée par cron job)
late_fee_rate                       numeric                   NO         0.05                          
late_fee_applied_at                 timestamp with time zone  YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
paid_at                             timestamp with time zone  YES                                      

Primary Key: id

Foreign Keys:
  - payment_plan_id → payment_plans.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - payment_installments_payment_plan_id_installment_number_key: (payment_plan_id, installment_number)

Indexes:
  - payment_installments_payment_plan_id_installment_number_key
    CREATE UNIQUE INDEX payment_installments_payment_plan_id_installment_number_key ON public.payment_installments USING btree (payment_plan_id, installment_number)
  - idx_payment_installments_payment_plan_id
    CREATE INDEX idx_payment_installments_payment_plan_id ON public.payment_installments USING btree (payment_plan_id)
  - idx_payment_installments_status
    CREATE INDEX idx_payment_installments_status ON public.payment_installments USING btree (status)
  - idx_payment_installments_due_date
    CREATE INDEX idx_payment_installments_due_date ON public.payment_installments USING btree (due_date) WHERE ((status)::text = 'pending'::text)

----------------------------------------------------------------------------------------------------
Table: PAYMENT_LOCK_HISTORY
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
payment_id                          uuid                      NO                                       
agent_id                            integer                   NO                                       
  └─ Description: DEPRECATED: Use agent_profile_id
locked_at                           timestamp with time zone  NO                                       
unlocked_at                         timestamp with time zone  YES                                      
lock_duration_minutes               integer                   YES                                      
unlock_reason                       varchar(50)               YES                                      
actions_performed                   jsonb                     YES        '[]'::jsonb                   
final_action                        agent_action_type         YES                                      
agent_profile_id                    uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - payment_id → service_payments.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_payment_lock_history_profile
    CREATE INDEX idx_payment_lock_history_profile ON public.payment_lock_history USING btree (agent_profile_id)

----------------------------------------------------------------------------------------------------
Table: PAYMENT_METHOD_CONFIGURATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('payment_method_config
code                                varchar(50)               NO                                       
label_es                            varchar(100)              NO                                       
processor_type                      varchar(50)               NO         'manual'::character varying   
requires_phone                      boolean                   YES        false                         
requires_redirect                   boolean                   YES        false                         
requires_agent_validation           boolean                   YES        false                         
is_active                           boolean                   YES        true                          
display_order                       integer                   YES        0                             
icon                                varchar(50)               YES        'credit-card'::character varyi
min_amount                          numeric                   YES                                      
max_amount                          numeric                   YES                                      
fees_percentage                     numeric                   YES        0                             
fees_fixed                          numeric                   YES        0                             
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Unique Constraints:
  - payment_method_configurations_code_key: (code)

Indexes:
  - payment_method_configurations_code_key
    CREATE UNIQUE INDEX payment_method_configurations_code_key ON public.payment_method_configurations USING btree (code)

----------------------------------------------------------------------------------------------------
Table: PAYMENT_PLANS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
total_amount                        numeric                   NO                                       
  └─ Description: Montant total à payer (somme de tous les acomptes)
currency                            varchar(3)                NO         'XAF'::character varying      
number_of_installments              integer                   NO                                       
installment_amount                  numeric                   NO                                       
  └─ Description: Montant par acompte (peut varier si dernière mensualité ajustée)
first_installment_due_date          date                      NO                                       
  └─ Description: Date d'échéance du premier acompte
installment_frequency               varchar(20)               NO         'monthly'::character varying  
  └─ Description: Fréquence: mensuelle, trimestrielle ou personnalisée
total_paid                          numeric                   NO         0                             
remaining_balance                   numeric                   YES                                      
  └─ Description: Solde restant dû (GENERATED COLUMN: total_amount - total_paid)
status                              varchar(20)               NO         'active'::character varying   
approved_by                         uuid                      YES                                      
approved_at                         timestamp with time zone  YES                                      
approval_notes                      text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
completed_at                        timestamp with time zone  YES                                      

Primary Key: id

Foreign Keys:
  - approved_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - payment_plans_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - payment_plans_tax_declaration_id_key
    CREATE UNIQUE INDEX payment_plans_tax_declaration_id_key ON public.payment_plans USING btree (tax_declaration_id)
  - idx_payment_plans_tax_declaration_id
    CREATE INDEX idx_payment_plans_tax_declaration_id ON public.payment_plans USING btree (tax_declaration_id)
  - idx_payment_plans_status
    CREATE INDEX idx_payment_plans_status ON public.payment_plans USING btree (status)

----------------------------------------------------------------------------------------------------
Table: PAYMENT_RECEIPTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
payment_id                          uuid                      NO                                       
file_path                           text                      NO                                       
file_size_bytes                     bigint                    YES                                      
receipt_number                      varchar(50)               NO                                       
  └─ Description: Numéro unique du reçu (ex: REC-2025-001234)
qr_code_data                        text                      YES                                      
  └─ Description: Données encodées dans le QR code (pour vérification mobile)
generated_at                        timestamp with time zone  NO         now()                         
generated_by                        uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - generated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - payment_id → payments.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - payment_receipts_file_path_key: (file_path)
  - payment_receipts_receipt_number_key: (receipt_number)

Indexes:
  - payment_receipts_file_path_key
    CREATE UNIQUE INDEX payment_receipts_file_path_key ON public.payment_receipts USING btree (file_path)
  - payment_receipts_receipt_number_key
    CREATE UNIQUE INDEX payment_receipts_receipt_number_key ON public.payment_receipts USING btree (receipt_number)

----------------------------------------------------------------------------------------------------
Table: PAYMENT_VALIDATION_AUDIT
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
payment_id                          uuid                      NO                                       
agent_id                            integer                   YES                                      
  └─ Description: DEPRECATED: Use agent_profile_id
agent_user_id                       uuid                      YES                                      
action                              agent_action_type         NO                                       
from_status                         payment_workflow_status   YES                                      
to_status                           payment_workflow_status   YES                                      
comment                             text                      YES                                      
validation_details                  jsonb                     YES                                      
documents_requested                 ARRAY                     YES                                      
rejection_reasons                   ARRAY                     YES                                      
ip_address                          inet                      YES                                      
user_agent                          text                      YES                                      
session_id                          varchar(255)              YES                                      
action_duration_seconds             integer                   YES                                      
created_at                          timestamp with time zone  YES        now()                         
agent_profile_id                    uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - agent_user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - payment_id → service_payments.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_payment_audit_agent_date
    CREATE INDEX idx_payment_audit_agent_date ON public.payment_validation_audit USING btree (agent_id, created_at DESC)
  - idx_payment_audit_payment_action
    CREATE INDEX idx_payment_audit_payment_action ON public.payment_validation_audit USING btree (payment_id, action, created_at)
  - idx_payment_validation_audit_profile
    CREATE INDEX idx_payment_validation_audit_profile ON public.payment_validation_audit USING btree (agent_profile_id)

----------------------------------------------------------------------------------------------------
Table: PAYMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      NO                                       
fiscal_service_id                   integer                   YES                                      
  └─ Description: FK vers fiscal_services (mutuellement exclusif avec tax_declaration_id)
tax_declaration_id                  uuid                      YES                                      
  └─ Description: FK vers tax_declarations (mutuellement exclusif avec fiscal_service_id)
payment_plan_id                     uuid                      YES                                      
  └─ Description: Lien vers un plan de paiement (si paiement partiel)
installment_id                      uuid                      YES                                      
  └─ Description: Lien vers un acompte spécifique (si paiement échelonné)
base_amount                         numeric                   NO                                       
penalties                           numeric                   NO         0                             
interest                            numeric                   NO         0                             
amount                              numeric                   YES                                      
currency                            varchar(3)                NO         'XAF'::character varying      
payment_type                        payment_type_enum         NO         'full'::payment_type_enum     
status                              payment_status_enum       NO         'pending'::payment_status_enum
payment_method                      varchar(30)               NO         'bank_transfer'::character var
bank_reference                      varchar(255)              YES                                      
bank_transaction_id                 uuid                      YES                                      
idempotency_key                     varchar(255)              NO                                       
  └─ Description: Clé d'idempotence générée côté client (empêche les doublons lors de double-click)
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
paid_at                             timestamp with time zone  YES                                      

Primary Key: id

Foreign Keys:
  - bank_transaction_id → bank_transactions.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - installment_id → payment_installments.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - payment_plan_id → payment_plans.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)

Unique Constraints:
  - payments_bank_reference_key: (bank_reference)
  - payments_idempotency_key_key: (idempotency_key)

Indexes:
  - payments_bank_reference_key
    CREATE UNIQUE INDEX payments_bank_reference_key ON public.payments USING btree (bank_reference)
  - payments_idempotency_key_key
    CREATE UNIQUE INDEX payments_idempotency_key_key ON public.payments USING btree (idempotency_key)
  - idx_payments_user_id
    CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id)
  - idx_payments_fiscal_service_id
    CREATE INDEX idx_payments_fiscal_service_id ON public.payments USING btree (fiscal_service_id) WHERE (fiscal_service_id IS NOT NULL)
  - idx_payments_tax_declaration_id
    CREATE INDEX idx_payments_tax_declaration_id ON public.payments USING btree (tax_declaration_id) WHERE (tax_declaration_id IS NOT NULL)
  - idx_payments_status
    CREATE INDEX idx_payments_status ON public.payments USING btree (status)
  - idx_payments_payment_plan_id
    CREATE INDEX idx_payments_payment_plan_id ON public.payments USING btree (payment_plan_id) WHERE (payment_plan_id IS NOT NULL)
  - idx_payments_created_at
    CREATE INDEX idx_payments_created_at ON public.payments USING btree (created_at DESC)
  - idx_payments_user_status
    CREATE INDEX idx_payments_user_status ON public.payments USING btree (user_id, status)
  - idx_payments_declaration
    CREATE INDEX idx_payments_declaration ON public.payments USING btree (tax_declaration_id)

----------------------------------------------------------------------------------------------------
Table: PENDING_REGISTRATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
email                               varchar(255)              NO                                       
verification_code                   varchar(6)                NO                                       
  └─ Description: 6-digit code sent to user email
created_at                          timestamp with time zone  YES        now()                         
expires_at                          timestamp with time zone  NO                                       
  └─ Description: Expires 15 minutes after creation
verification_attempts               integer                   YES        0                             
  └─ Description: Max 5 attempts before deletion

Primary Key: id

Unique Constraints:
  - pending_registrations_email_key: (email)

Indexes:
  - pending_registrations_email_key
    CREATE UNIQUE INDEX pending_registrations_email_key ON public.pending_registrations USING btree (email)
  - idx_pending_registrations_email
    CREATE INDEX idx_pending_registrations_email ON public.pending_registrations USING btree (email)
  - idx_pending_registrations_expires_at
    CREATE INDEX idx_pending_registrations_expires_at ON public.pending_registrations USING btree (expires_at)

----------------------------------------------------------------------------------------------------
Table: PERMISSION_AUDIT_LOG
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         uuid_generate_v4()            
action                              varchar(50)               NO                                       
  └─ Description: Type de modification (INSERT, UPDATE, DELETE)
table_name                          varchar(50)               NO                                       
  └─ Description: Table concernée par la modification
record_id                           text                      YES                                      
user_id                             uuid                      YES                                      
permission_id                       uuid                      YES                                      
old_value                           jsonb                     YES                                      
  └─ Description: Ancienne valeur (JSONB) avant modification
new_value                           jsonb                     YES                                      
  └─ Description: Nouvelle valeur (JSONB) après modification
changed_by                          uuid                      YES                                      
changed_at                          timestamp without time zone YES        now()                         

Primary Key: id

Foreign Keys:
  - changed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - permission_id → permissions.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_permission_audit_log_user
    CREATE INDEX idx_permission_audit_log_user ON public.permission_audit_log USING btree (user_id)
  - idx_permission_audit_log_permission
    CREATE INDEX idx_permission_audit_log_permission ON public.permission_audit_log USING btree (permission_id)
  - idx_permission_audit_log_changed_at
    CREATE INDEX idx_permission_audit_log_changed_at ON public.permission_audit_log USING btree (changed_at)
  - idx_permission_audit_log_table
    CREATE INDEX idx_permission_audit_log_table ON public.permission_audit_log USING btree (table_name)

----------------------------------------------------------------------------------------------------
Table: PERMISSIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         uuid_generate_v4()            
name                                varchar(100)              NO                                       
  └─ Description: Nom unique de la permission (format: resource.action)
resource                            varchar(50)               NO                                       
  └─ Description: Ressource concernée (assignment, declaration, etc.)
action                              varchar(50)               NO                                       
  └─ Description: Action autorisée (view, create, edit, delete, etc.)
description                         text                      YES                                      
is_critical                         boolean                   YES        false                         
  └─ Description: Si TRUE, UI affiche un warning lors de l'attribution
module_name                         varchar(50)               YES                                      
  └─ Description: Nom du module qui a déclaré cette permission
created_at                          timestamp without time zone YES        now()                         
updated_at                          timestamp without time zone YES        now()                         

Primary Key: id

Unique Constraints:
  - permissions_name_key: (name)

Indexes:
  - permissions_name_key
    CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name)
  - idx_permissions_resource
    CREATE INDEX idx_permissions_resource ON public.permissions USING btree (resource)
  - idx_permissions_name
    CREATE INDEX idx_permissions_name ON public.permissions USING btree (name)
  - idx_permissions_module
    CREATE INDEX idx_permissions_module ON public.permissions USING btree (module_name)

----------------------------------------------------------------------------------------------------
Table: PROCEDURE_TEMPLATE_STEPS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('procedure_template_st
template_id                         integer                   YES                                      
step_number                         integer                   NO                                       
description_es                      text                      NO                                       
instructions_es                     text                      YES                                      
estimated_duration_minutes          integer                   YES                                      
location_address                    text                      YES                                      
office_hours                        varchar(100)              YES                                      
requires_appointment                boolean                   YES        false                         
is_optional                         boolean                   YES        false                         
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - template_id → procedure_templates.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - procedure_template_steps_template_id_step_number_key: (template_id, step_number)

Indexes:
  - procedure_template_steps_template_id_step_number_key
    CREATE UNIQUE INDEX procedure_template_steps_template_id_step_number_key ON public.procedure_template_steps USING btree (template_id, step_number)
  - idx_template_steps_template
    CREATE INDEX idx_template_steps_template ON public.procedure_template_steps USING btree (template_id, step_number)

----------------------------------------------------------------------------------------------------
Table: PROCEDURE_TEMPLATE_STEPS_BACKUP_20251017
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   YES                                      
template_id                         integer                   YES                                      
step_number                         integer                   YES                                      
description_es                      text                      YES                                      
instructions_es                     text                      YES                                      
estimated_duration_minutes          integer                   YES                                      
location_address                    text                      YES                                      
office_hours                        varchar(100)              YES                                      
requires_appointment                boolean                   YES                                      
is_optional                         boolean                   YES                                      
created_at                          timestamp with time zone  YES                                      
updated_at                          timestamp with time zone  YES                                      

----------------------------------------------------------------------------------------------------
Table: PROCEDURE_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('procedure_templates_i
template_code                       varchar(100)              NO                                       
name_es                             varchar(255)              NO                                       
description_es                      text                      YES                                      
category                            varchar(50)               YES                                      
usage_count                         integer                   NO         0                             
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          integer                   YES                                      

Primary Key: id

Unique Constraints:
  - procedure_templates_template_code_key: (template_code)

Indexes:
  - procedure_templates_template_code_key
    CREATE UNIQUE INDEX procedure_templates_template_code_key ON public.procedure_templates USING btree (template_code)
  - idx_procedure_templates_code
    CREATE INDEX idx_procedure_templates_code ON public.procedure_templates USING btree (template_code)
  - idx_procedure_templates_category
    CREATE INDEX idx_procedure_templates_category ON public.procedure_templates USING btree (category)

----------------------------------------------------------------------------------------------------
Table: PUSH_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('push_templates_id_seq
template_code                       varchar(100)              NO                                       
name_es                             varchar(255)              NO                                       
name_fr                             varchar(255)              YES                                      
name_en                             varchar(255)              YES                                      
title_es                            varchar(100)              NO                                       
title_fr                            varchar(100)              YES                                      
title_en                            varchar(100)              YES                                      
body_es                             varchar(240)              NO                                       
body_fr                             varchar(240)              YES                                      
body_en                             varchar(240)              YES                                      
image_url                           varchar(500)              YES                                      
icon_url                            varchar(500)              YES                                      
click_action                        varchar(500)              YES                                      
data_payload                        jsonb                     YES        '{}'::jsonb                   
variables                           jsonb                     YES        '[]'::jsonb                   
platform                            varchar(20)               YES        'all'::character varying      
ttl_seconds                         integer                   YES        86400                         
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - push_templates_template_code_key: (template_code)

Indexes:
  - idx_push_templates_code
    CREATE INDEX idx_push_templates_code ON public.push_templates USING btree (template_code)
  - idx_push_templates_platform
    CREATE INDEX idx_push_templates_platform ON public.push_templates USING btree (platform)
  - idx_push_templates_active
    CREATE INDEX idx_push_templates_active ON public.push_templates USING btree (is_active)
  - push_templates_template_code_key
    CREATE UNIQUE INDEX push_templates_template_code_key ON public.push_templates USING btree (template_code)

----------------------------------------------------------------------------------------------------
Table: REFRESH_TOKENS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
  └─ Description: Token unique identifier (UUID)
token                               text                      NO                                       
  └─ Description: Hashed refresh token value (SHA-256)
user_id                             uuid                      NO                                       
  └─ Description: Reference to users table
session_id                          uuid                      NO                                       
  └─ Description: Reference to sessions table
is_revoked                          boolean                   NO         false                         
  └─ Description: Whether the token has been revoked
expires_at                          timestamp with time zone  NO                                       
  └─ Description: Token expiration timestamp
created_at                          timestamp with time zone  YES        now()                         
  └─ Description: Token creation timestamp
revoked_at                          timestamp with time zone  YES                                      
  └─ Description: Token revocation timestamp (if revoked)
last_used_at                        timestamp with time zone  YES                                      
  └─ Description: Last time token was used for refresh
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - session_id → sessions.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - session_id → sessions.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - refresh_tokens_token_key: (token)

Indexes:
  - refresh_tokens_id_key
    CREATE UNIQUE INDEX refresh_tokens_id_key ON public.refresh_tokens USING btree (id)
  - refresh_tokens_token_key
    CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token)
  - idx_refresh_tokens_user_id
    CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id)
  - idx_refresh_tokens_session_id
    CREATE INDEX idx_refresh_tokens_session_id ON public.refresh_tokens USING btree (session_id)
  - idx_refresh_tokens_token
    CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token)
  - idx_refresh_tokens_is_revoked
    CREATE INDEX idx_refresh_tokens_is_revoked ON public.refresh_tokens USING btree (is_revoked)
  - idx_refresh_tokens_expires_at
    CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at)

----------------------------------------------------------------------------------------------------
Table: ROLE_PERMISSIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
role_id                             uuid                      NO                                       
permission_id                       uuid                      NO                                       
granted                             boolean                   YES        true                          
  └─ Description: FALSE permet de refuser explicitement une permission héritée
created_at                          timestamp without time zone YES        now()                         
created_by                          uuid                      YES                                      
  └─ Description: Admin qui a assigné cette permission au rôle

Primary Key: role_id, permission_id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - permission_id → permissions.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - role_id → roles.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_role_permissions_role
    CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id)
  - idx_role_permissions_permission
    CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id)

----------------------------------------------------------------------------------------------------
Table: ROLES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         uuid_generate_v4()            
name                                varchar(100)              NO                                       
code                                varchar(50)               NO                                       
  └─ Description: Code unique du rôle (utilisé dans le code)
entity_type                         varchar(50)               YES                                      
  └─ Description: Type d'entité (DGI, Ministry, NULL pour global)
description                         text                      YES                                      
is_system                           boolean                   YES        false                         
  └─ Description: Rôles système protégés (citizen, admin, etc.) - ne peuvent pas être modifiés/supprimés
created_at                          timestamp without time zone YES        now()                         
updated_at                          timestamp without time zone YES        now()                         
created_by                          uuid                      YES                                      
  └─ Description: Utilisateur qui a créé le rôle (NULL pour rôles système)

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - roles_code_key: (code)
  - roles_name_key: (name)

Indexes:
  - roles_name_key
    CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)
  - roles_code_key
    CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code)
  - idx_roles_code
    CREATE INDEX idx_roles_code ON public.roles USING btree (code)
  - idx_roles_entity_type
    CREATE INDEX idx_roles_entity_type ON public.roles USING btree (entity_type)

----------------------------------------------------------------------------------------------------
Table: SECTORS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('sectors_id_seq'::regc
sector_code                         varchar(10)               NO                                       
ministry_id                         integer                   NO                                       
name_es                             varchar(255)              NO                                       
description_es                      text                      YES                                      
display_order                       integer                   YES        0                             
icon                                varchar(100)              YES                                      
color                               varchar(7)                YES                                      
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - sectors_sector_code_key: (sector_code)

Indexes:
  - sectors_sector_code_key
    CREATE UNIQUE INDEX sectors_sector_code_key ON public.sectors USING btree (sector_code)
  - idx_sectors_code
    CREATE INDEX idx_sectors_code ON public.sectors USING btree (sector_code)
  - idx_sectors_ministry
    CREATE INDEX idx_sectors_ministry ON public.sectors USING btree (ministry_id, is_active)

----------------------------------------------------------------------------------------------------
Table: SERVICE_DOCUMENT_ASSIGNMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('service_document_assi
fiscal_service_id                   integer                   YES                                      
document_template_id                integer                   YES                                      
is_required_expedition              boolean                   YES        true                          
is_required_renewal                 boolean                   YES        false                         
display_order                       integer                   YES        1                             
custom_notes                        text                      YES                                      
assigned_at                         timestamp with time zone  YES        now()                         
assigned_by                         integer                   YES                                      

Primary Key: id

Foreign Keys:
  - document_template_id → document_templates.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - service_document_assignments_fiscal_service_id_document_tem_key: (fiscal_service_id, document_template_id)

Indexes:
  - service_document_assignments_fiscal_service_id_document_tem_key
    CREATE UNIQUE INDEX service_document_assignments_fiscal_service_id_document_tem_key ON public.service_document_assignments USING btree (fiscal_service_id, document_template_id)
  - idx_service_doc_assignments_service
    CREATE INDEX idx_service_doc_assignments_service ON public.service_document_assignments USING btree (fiscal_service_id)
  - idx_service_doc_assignments_template
    CREATE INDEX idx_service_doc_assignments_template ON public.service_document_assignments USING btree (document_template_id)

----------------------------------------------------------------------------------------------------
Table: SERVICE_KEYWORDS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('service_keywords_id_s
fiscal_service_id                   integer                   NO                                       
keyword                             varchar(100)              NO                                       
language_code                       varchar(2)                NO                                       
weight                              integer                   YES        1                             
is_auto_generated                   boolean                   YES        false                         
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - service_keywords_fiscal_service_id_keyword_language_code_key: (fiscal_service_id, keyword, language_code)

Indexes:
  - service_keywords_fiscal_service_id_keyword_language_code_key
    CREATE UNIQUE INDEX service_keywords_fiscal_service_id_keyword_language_code_key ON public.service_keywords USING btree (fiscal_service_id, keyword, language_code)
  - idx_service_keywords_search
    CREATE INDEX idx_service_keywords_search ON public.service_keywords USING gin (keyword gin_trgm_ops)
  - idx_service_keywords_service
    CREATE INDEX idx_service_keywords_service ON public.service_keywords USING btree (fiscal_service_id)
  - idx_service_keywords_language
    CREATE INDEX idx_service_keywords_language ON public.service_keywords USING btree (language_code)

----------------------------------------------------------------------------------------------------
Table: SERVICE_PAYMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
payment_reference                   varchar(100)              NO                                       
user_id                             uuid                      NO                                       
company_id                          uuid                      YES                                      
payment_type                        varchar(20)               NO                                       
calculation_base                    numeric                   YES                                      
calculation_details                 jsonb                     YES        '{}'::jsonb                   
base_amount                         numeric                   NO                                       
penalties                           numeric                   YES        0                             
discounts                           numeric                   YES        0                             
total_amount                        numeric                   NO                                       
payment_method                      payment_method_enum       NO                                       
currency                            varchar(3)                NO         'XAF'::character varying      
bange_transaction_id                varchar(255)              YES                                      
bange_wallet_id                     varchar(255)              YES                                      
status                              payment_status_enum       YES        'pending'::payment_status_enum
workflow_status                     payment_workflow_status   YES        'submitted'::payment_workflow_
paid_at                             timestamp with time zone  YES                                      
expires_at                          timestamp with time zone  YES                                      
locked_by_agent_id                  integer                   YES                                      
  └─ Description: DEPRECATED: Use locked_by_agent_profile_id
locked_at                           timestamp with time zone  YES                                      
lock_expires_at                     timestamp with time zone  YES                                      
assigned_agent_id                   integer                   YES                                      
  └─ Description: DEPRECATED: Use assigned_agent_profile_id
assigned_at                         timestamp with time zone  YES                                      
validated_by_agent_id               integer                   YES                                      
  └─ Description: DEPRECATED: Use validated_by_agent_profile_id
validated_at                        timestamp with time zone  YES                                      
validation_comment                  text                      YES                                      
validation_checklist_completed      jsonb                     YES        '{}'::jsonb                   
escalated_to_agent_id               integer                   YES                                      
  └─ Description: DEPRECATED: Use escalated_to_agent_profile_id
escalated_at                        timestamp with time zone  YES                                      
escalation_reason                   text                      YES                                      
escalation_level                    escalation_level          YES                                      
sla_target_date                     timestamp with time zone  YES                                      
sla_warning_sent                    boolean                   YES        false                         
sla_escalated                       boolean                   YES        false                         
ministry_id                         integer                   YES                                      
requires_agent_validation           boolean                   YES        true                          
auto_approval_eligible              boolean                   YES        false                         
rejection_count                     integer                   YES        0                             
resubmission_count                  integer                   YES        0                             
receipt_number                      varchar(50)               YES                                      
receipt_url                         text                      YES                                      
supporting_documents                jsonb                     YES        '[]'::jsonb                   
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
service_request_id                  uuid                      YES                                      
  └─ Description: FK to service_requests. XOR with fiscal_service_code - one must be set.
assigned_agent_profile_id           uuid                      YES                                      
locked_by_agent_profile_id          uuid                      YES                                      
validated_by_agent_profile_id       uuid                      YES                                      
escalated_to_agent_profile_id       uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - assigned_agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - company_id → companies.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - escalated_to_agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - locked_by_agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - validated_by_agent_profile_id → agent_profiles.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - service_payments_bange_transaction_id_key: (bange_transaction_id)
  - service_payments_payment_reference_key: (payment_reference)
  - service_payments_receipt_number_key: (receipt_number)

Indexes:
  - idx_service_payments_service_request
    CREATE INDEX idx_service_payments_service_request ON public.service_payments USING btree (service_request_id) WHERE (service_request_id IS NOT NULL)
  - service_payments_payment_reference_key
    CREATE UNIQUE INDEX service_payments_payment_reference_key ON public.service_payments USING btree (payment_reference)
  - service_payments_bange_transaction_id_key
    CREATE UNIQUE INDEX service_payments_bange_transaction_id_key ON public.service_payments USING btree (bange_transaction_id)
  - service_payments_receipt_number_key
    CREATE UNIQUE INDEX service_payments_receipt_number_key ON public.service_payments USING btree (receipt_number)
  - idx_service_payments_user
    CREATE INDEX idx_service_payments_user ON public.service_payments USING btree (user_id, status, created_at)
  - idx_service_payments_workflow_ministry
    CREATE INDEX idx_service_payments_workflow_ministry ON public.service_payments USING btree (ministry_id, workflow_status, sla_target_date)
  - idx_service_payments_locked_agent
    CREATE INDEX idx_service_payments_locked_agent ON public.service_payments USING btree (locked_by_agent_id, lock_expires_at) WHERE (locked_by_agent_id IS NOT NULL)
  - idx_service_payments_assigned_agent
    CREATE INDEX idx_service_payments_assigned_agent ON public.service_payments USING btree (assigned_agent_id, workflow_status) WHERE (assigned_agent_id IS NOT NULL)
  - idx_service_payments_expired_locks
    CREATE INDEX idx_service_payments_expired_locks ON public.service_payments USING btree (lock_expires_at) WHERE (locked_by_agent_id IS NOT NULL)
  - idx_service_payments_request_status
    CREATE INDEX idx_service_payments_request_status ON public.service_payments USING btree (service_request_id, status, workflow_status) WHERE (service_request_id IS NOT NULL)
  - idx_service_payments_pending_validation
    CREATE INDEX idx_service_payments_pending_validation ON public.service_payments USING btree (workflow_status, payment_method, created_at) WHERE (workflow_status = 'pending_agent_review'::payment_workflow_status)
  - idx_service_payments_assigned_profile
    CREATE INDEX idx_service_payments_assigned_profile ON public.service_payments USING btree (assigned_agent_profile_id)
  - idx_service_payments_locked_profile
    CREATE INDEX idx_service_payments_locked_profile ON public.service_payments USING btree (locked_by_agent_profile_id)
  - idx_service_payments_validated_profile
    CREATE INDEX idx_service_payments_validated_profile ON public.service_payments USING btree (validated_by_agent_profile_id)
  - idx_service_payments_escalated_profile
    CREATE INDEX idx_service_payments_escalated_profile ON public.service_payments USING btree (escalated_to_agent_profile_id)

----------------------------------------------------------------------------------------------------
Table: SERVICE_PROCEDURE_ASSIGNMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('service_procedure_ass
fiscal_service_id                   integer                   YES                                      
template_id                         integer                   YES                                      
applies_to                          varchar(20)               YES                                      
display_order                       integer                   YES        1                             
custom_notes                        text                      YES                                      
override_steps                      jsonb                     YES                                      
assigned_at                         timestamp with time zone  YES        now()                         
assigned_by                         integer                   YES                                      

Primary Key: id

Foreign Keys:
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - template_id → procedure_templates.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)

Unique Constraints:
  - service_procedure_assignments_fiscal_service_id_template_id_key: (fiscal_service_id, template_id)

Indexes:
  - service_procedure_assignments_fiscal_service_id_template_id_key
    CREATE UNIQUE INDEX service_procedure_assignments_fiscal_service_id_template_id_key ON public.service_procedure_assignments USING btree (fiscal_service_id, template_id)
  - idx_service_proc_assignments_service
    CREATE INDEX idx_service_proc_assignments_service ON public.service_procedure_assignments USING btree (fiscal_service_id)
  - idx_service_proc_assignments_template
    CREATE INDEX idx_service_proc_assignments_template ON public.service_procedure_assignments USING btree (template_id)

----------------------------------------------------------------------------------------------------
Table: SERVICE_PROCEDURE_ASSIGNMENTS_BACKUP_20251017
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   YES                                      
fiscal_service_id                   integer                   YES                                      
template_id                         integer                   YES                                      
applies_to                          varchar(20)               YES                                      
display_order                       integer                   YES                                      
custom_notes                        text                      YES                                      
override_steps                      jsonb                     YES                                      
assigned_at                         timestamp with time zone  YES                                      
assigned_by                         integer                   YES                                      

----------------------------------------------------------------------------------------------------
Table: SERVICE_REQUEST_DOCUMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      NO                                       
document_code                       varchar(100)              NO                                       
document_name                       varchar(255)              NO                                       
file_path                           text                      NO                                       
file_name                           varchar(255)              NO                                       
file_size                           integer                   YES                                      
mime_type                           varchar(100)              YES                                      
extraction_data                     jsonb                     YES        '{}'::jsonb                   
extraction_confidence               numeric                   YES                                      
extraction_status                   varchar(50)               YES        'pending'::character varying  
is_valid                            boolean                   YES                                      
validation_errors                   jsonb                     YES        '[]'::jsonb                   
validated_by                        uuid                      YES                                      
validated_at                        timestamp with time zone  YES                                      
source                              varchar(50)               YES        'user_upload'::character varyi
uploaded_by                         uuid                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - uploaded_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - validated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - unique_document_per_request: (service_request_id, document_code)

Indexes:
  - unique_document_per_request
    CREATE UNIQUE INDEX unique_document_per_request ON public.service_request_documents USING btree (service_request_id, document_code)
  - idx_srd_request_id
    CREATE INDEX idx_srd_request_id ON public.service_request_documents USING btree (service_request_id)
  - idx_srd_document_code
    CREATE INDEX idx_srd_document_code ON public.service_request_documents USING btree (document_code)

----------------------------------------------------------------------------------------------------
Table: SERVICE_REQUEST_HISTORY
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      NO                                       
action                              varchar(100)              NO                                       
previous_status                     service_request_status_enum YES                                      
new_status                          service_request_status_enum YES                                      
details                             jsonb                     YES        '{}'::jsonb                   
comment                             text                      YES                                      
performed_by                        uuid                      YES                                      
performed_at                        timestamp with time zone  NO         now()                         
ip_address                          inet                      YES                                      
user_agent                          text                      YES                                      

Primary Key: id

Foreign Keys:
  - performed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_srh_request_id
    CREATE INDEX idx_srh_request_id ON public.service_request_history USING btree (service_request_id)
  - idx_srh_performed_at
    CREATE INDEX idx_srh_performed_at ON public.service_request_history USING btree (performed_at DESC)

----------------------------------------------------------------------------------------------------
Table: SERVICE_REQUESTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
reference                           varchar(50)               NO                                       
  └─ Description: Référence unique lisible (ex: RES-2025-00001)
user_id                             uuid                      NO                                       
workflow_code                       varchar(100)              NO                                       
  └─ Description: Code du workflow (residencia, pasaporte_nuevo, etc.)
solicitud_type                      varchar(50)               NO         'expedicion'::character varyin
  └─ Description: Type de sollicitation (expedicion, renovacion, duplicado)
fiscal_service_id                   integer                   YES                                      
status                              service_request_status_enum NO         'DRAFT'::service_request_statu
priority                            service_request_priority_enum NO         'NORMAL'::service_request_prio
form_data                           jsonb                     NO         '{}'::jsonb                   
  └─ Description: Données du formulaire (extraction + saisie utilisateur)
extracted_data                      jsonb                     YES        '{}'::jsonb                   
  └─ Description: Données extraites par Gemini (pour traçabilité)
extraction_confidence               numeric                   YES                                      
validations                         jsonb                     YES        '{}'::jsonb                   
assigned_to                         uuid                      YES                                      
assigned_at                         timestamp with time zone  YES                                      
entity_code                         varchar(50)               YES                                      
base_amount                         numeric                   YES                                      
supplements_amount                  numeric                   YES        0                             
penalties_amount                    numeric                   YES        0                             
total_amount                        numeric                   YES                                      
currency                            varchar(3)                YES        'XAF'::character varying      
payment_id                          uuid                      YES                                      
payment_status                      varchar(50)               YES                                      
paid_at                             timestamp with time zone  YES                                      
cita_date                           date                      YES                                      
cita_time                           time without time zone    YES                                      
cita_location                       varchar(255)              YES                                      
submitted_at                        timestamp with time zone  YES                                      
validated_at                        timestamp with time zone  YES                                      
completed_at                        timestamp with time zone  YES                                      
expires_at                          timestamp with time zone  YES                                      
notes                               text                      YES                                      
rejection_reason                    text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      
entity_location_id                  uuid                      YES                                      
  └─ Description: FK to entity_locations - user selected location for appointment (nullable)
verification_status                 verification_status_enum  YES        'pending'::verification_status
  └─ Description: Status of external identifier verification
verification_details                jsonb                     YES        '{}'::jsonb                   
  └─ Description: Details per document type: {dip: {verified: bool, source: string}, ...}

Primary Key: id

Foreign Keys:
  - entity_location_id → entity_locations.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - assigned_to → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - fiscal_service_id → fiscal_services.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE RESTRICT)

Unique Constraints:
  - service_requests_reference_key: (reference)

Indexes:
  - service_requests_reference_key
    CREATE UNIQUE INDEX service_requests_reference_key ON public.service_requests USING btree (reference)
  - idx_sr_user_id
    CREATE INDEX idx_sr_user_id ON public.service_requests USING btree (user_id)
  - idx_sr_workflow_code
    CREATE INDEX idx_sr_workflow_code ON public.service_requests USING btree (workflow_code)
  - idx_sr_status
    CREATE INDEX idx_sr_status ON public.service_requests USING btree (status)
  - idx_sr_assigned_to
    CREATE INDEX idx_sr_assigned_to ON public.service_requests USING btree (assigned_to) WHERE (assigned_to IS NOT NULL)
  - idx_sr_entity_code
    CREATE INDEX idx_sr_entity_code ON public.service_requests USING btree (entity_code) WHERE (entity_code IS NOT NULL)
  - idx_sr_reference
    CREATE INDEX idx_sr_reference ON public.service_requests USING btree (reference)
  - idx_sr_created_at
    CREATE INDEX idx_sr_created_at ON public.service_requests USING btree (created_at DESC)
  - idx_sr_fiscal_service
    CREATE INDEX idx_sr_fiscal_service ON public.service_requests USING btree (fiscal_service_id) WHERE (fiscal_service_id IS NOT NULL)
  - idx_sr_workflow_status
    CREATE INDEX idx_sr_workflow_status ON public.service_requests USING btree (workflow_code, status)
  - idx_sr_entity_location
    CREATE INDEX idx_sr_entity_location ON public.service_requests USING btree (entity_location_id) WHERE (entity_location_id IS NOT NULL)
  - idx_sr_verification_status
    CREATE INDEX idx_sr_verification_status ON public.service_requests USING btree (verification_status) WHERE (verification_status = ANY (ARRAY['not_found'::verification_status_enum, 'partial_verification'::verification_status_enum, 'verification_failed'::verification_status_enum]))

----------------------------------------------------------------------------------------------------
Table: SESSIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
  └─ Description: Session unique identifier (UUID)
user_id                             uuid                      NO                                       
  └─ Description: Reference to users table
access_token                        text                      NO                                       
  └─ Description: JWT access token
refresh_token                       text                      NO                                       
  └─ Description: JWT refresh token
status                              varchar(20)               NO         'active'::character varying   
  └─ Description: Session status: active, expired, or revoked
ip_address                          inet                      YES                                      
  └─ Description: Client IP address
user_agent                          text                      YES                                      
  └─ Description: Client user agent string
device_info                         jsonb                     YES                                      
  └─ Description: Additional device information (JSON)
expires_at                          timestamp with time zone  NO                                       
  └─ Description: Session expiration timestamp
created_at                          timestamp with time zone  YES        now()                         
  └─ Description: Session creation timestamp
last_activity                       timestamp with time zone  YES        now()                         
  └─ Description: Last activity timestamp
revoked_at                          timestamp with time zone  YES                                      
  └─ Description: Session revocation timestamp (if revoked)
updated_at                          timestamp with time zone  YES        now()                         
context_data                        jsonb                     NO         '{}'::jsonb                   
  └─ Description: JSONB storage for user session context (form drafts, payment state, navigation) to resume interrupted workflows
termination_reason                  varchar(50)               YES                                      
  └─ Description: Reason for session termination: logout, timeout, forced, security_breach, device_limit

Primary Key: id

Foreign Keys:
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_sessions_active_user
    CREATE INDEX idx_sessions_active_user ON public.sessions USING btree (user_id, status) WHERE ((status)::text = 'active'::text)
  - idx_sessions_termination
    CREATE INDEX idx_sessions_termination ON public.sessions USING btree (termination_reason, revoked_at) WHERE (termination_reason IS NOT NULL)
  - sessions_id_key
    CREATE UNIQUE INDEX sessions_id_key ON public.sessions USING btree (id)
  - idx_sessions_user_id
    CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id)
  - idx_sessions_access_token
    CREATE INDEX idx_sessions_access_token ON public.sessions USING btree (access_token)
  - idx_sessions_refresh_token
    CREATE INDEX idx_sessions_refresh_token ON public.sessions USING btree (refresh_token)
  - idx_sessions_status
    CREATE INDEX idx_sessions_status ON public.sessions USING btree (status)
  - idx_sessions_expires_at
    CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at)
  - idx_sessions_context_data
    CREATE INDEX idx_sessions_context_data ON public.sessions USING gin (context_data)

----------------------------------------------------------------------------------------------------
Table: SMS_TEMPLATES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('sms_templates_id_seq'
template_code                       varchar(100)              NO                                       
name_es                             varchar(255)              NO                                       
name_fr                             varchar(255)              YES                                      
name_en                             varchar(255)              YES                                      
content_es                          text                      NO                                       
content_fr                          text                      YES                                      
content_en                          text                      YES                                      
variables                           jsonb                     YES        '[]'::jsonb                   
category                            varchar(100)              YES                                      
max_segments                        integer                   YES        1                             
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - sms_templates_template_code_key: (template_code)

Indexes:
  - idx_sms_templates_code
    CREATE INDEX idx_sms_templates_code ON public.sms_templates USING btree (template_code)
  - idx_sms_templates_category
    CREATE INDEX idx_sms_templates_category ON public.sms_templates USING btree (category)
  - idx_sms_templates_active
    CREATE INDEX idx_sms_templates_active ON public.sms_templates USING btree (is_active)
  - idx_sms_templates_is_active
    CREATE INDEX idx_sms_templates_is_active ON public.sms_templates USING btree (is_active)
  - sms_templates_template_code_key
    CREATE UNIQUE INDEX sms_templates_template_code_key ON public.sms_templates USING btree (template_code)

----------------------------------------------------------------------------------------------------
Table: STEPS_COUNT
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
count                               bigint                    YES                                      

----------------------------------------------------------------------------------------------------
Table: SUPPORT_ATTACHMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('support_attachments_i
message_id                          integer                   YES                                      
file_name                           varchar(255)              NO                                       
file_path                           varchar(500)              NO                                       
file_size                           integer                   YES                                      
mime_type                           varchar(100)              YES                                      
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - message_id → support_messages.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_support_attachments_message
    CREATE INDEX idx_support_attachments_message ON public.support_attachments USING btree (message_id)

----------------------------------------------------------------------------------------------------
Table: SUPPORT_CATEGORIES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('support_categories_id
code                                varchar(50)               NO                                       
name_es                             varchar(255)              NO                                       
name_fr                             varchar(255)              YES                                      
name_en                             varchar(255)              YES                                      
description_es                      text                      YES                                      
description_fr                      text                      YES                                      
description_en                      text                      YES                                      
target_role                         varchar(50)               YES        'all'::character varying      
  └─ Description: Target role for this category: admin, agent, or all
icon                                varchar(100)              YES                                      
is_active                           boolean                   YES        true                          
sort_order                          integer                   YES        0                             
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Unique Constraints:
  - support_categories_code_key: (code)

Indexes:
  - support_categories_code_key
    CREATE UNIQUE INDEX support_categories_code_key ON public.support_categories USING btree (code)

----------------------------------------------------------------------------------------------------
Table: SUPPORT_MESSAGES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('support_messages_id_s
ticket_id                           integer                   YES                                      
sender_id                           uuid                      NO                                       
content                             text                      NO                                       
is_internal                         boolean                   YES        false                         
  └─ Description: If true, message is an internal note visible only to admins
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - sender_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - ticket_id → support_tickets.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_support_messages_ticket
    CREATE INDEX idx_support_messages_ticket ON public.support_messages USING btree (ticket_id)
  - idx_support_messages_sender
    CREATE INDEX idx_support_messages_sender ON public.support_messages USING btree (sender_id)

----------------------------------------------------------------------------------------------------
Table: SUPPORT_TICKETS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('support_tickets_id_se
ticket_number                       varchar(20)               NO                                       
  └─ Description: Human-readable ticket number: SUP-YYYYMMDD-XXXX
category_id                         integer                   YES                                      
subject                             varchar(255)              NO                                       
description                         text                      NO                                       
priority                            varchar(20)               YES        'normal'::character varying   
  └─ Description: Ticket priority: low, normal, high, urgent
status                              varchar(30)               YES        'open'::character varying     
  └─ Description: Ticket status: open, in_progress, pending_user, resolved, closed
created_by                          uuid                      NO                                       
assigned_to                         uuid                      YES                                      
resolved_at                         timestamp with time zone  YES                                      
closed_at                           timestamp with time zone  YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - assigned_to → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - category_id → support_categories.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - support_tickets_ticket_number_key: (ticket_number)

Indexes:
  - support_tickets_ticket_number_key
    CREATE UNIQUE INDEX support_tickets_ticket_number_key ON public.support_tickets USING btree (ticket_number)
  - idx_support_tickets_user
    CREATE INDEX idx_support_tickets_user ON public.support_tickets USING btree (created_by)
  - idx_support_tickets_assigned
    CREATE INDEX idx_support_tickets_assigned ON public.support_tickets USING btree (assigned_to)
  - idx_support_tickets_status
    CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status)
  - idx_support_tickets_priority
    CREATE INDEX idx_support_tickets_priority ON public.support_tickets USING btree (priority)
  - idx_support_tickets_number
    CREATE INDEX idx_support_tickets_number ON public.support_tickets USING btree (ticket_number)
  - idx_support_tickets_category
    CREATE INDEX idx_support_tickets_category ON public.support_tickets USING btree (category_id)
  - idx_support_tickets_created_at
    CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC)

----------------------------------------------------------------------------------------------------
Table: SYSTEM_RULES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('system_rules_id_seq':
rule_code                           varchar(100)              NO                                       
  └─ Description: Code unique de la règle (ex: SUPERVISOR_APPROVAL_THRESHOLD, LATE_FEE_RATE)
rule_category                       varchar(50)               NO                                       
name_es                             text                      NO                                       
name_fr                             text                      YES                                      
name_en                             text                      YES                                      
description                         text                      YES                                      
rule_value                          jsonb                     NO                                       
  └─ Description: Valeur JSONB de la règle (ex: {"threshold_percentage": 20})
value_type                          varchar(20)               NO                                       
applies_to                          varchar(50)               YES                                      
effective_from                      date                      NO         CURRENT_DATE                  
  └─ Description: Date de début d'application de la règle
effective_until                     date                      YES                                      
  └─ Description: Date de fin d'application (NULL = indéfini)
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - system_rules_rule_code_key: (rule_code)

Indexes:
  - system_rules_rule_code_key
    CREATE UNIQUE INDEX system_rules_rule_code_key ON public.system_rules USING btree (rule_code)
  - idx_system_rules_rule_code
    CREATE INDEX idx_system_rules_rule_code ON public.system_rules USING btree (rule_code) WHERE (is_active = true)
  - idx_system_rules_category
    CREATE INDEX idx_system_rules_category ON public.system_rules USING btree (rule_category)

----------------------------------------------------------------------------------------------------
Table: TARIFF_SUPPLEMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('tariff_supplements_id
code                                varchar(50)               NO                                       
  └─ Description: Code unique (CEDULA_PERSONAL, POLIZA, etc.)
name_es                             varchar(255)              NO                                       
amount                              numeric                   NO                                       
currency                            varchar(3)                YES        'XAF'::character varying      
legal_reference                     varchar(255)              YES                                      
effective_from                      date                      NO         CURRENT_DATE                  
effective_to                        date                      YES                                      
is_active                           boolean                   YES        true                          
created_by                          uuid                      YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_by                          uuid                      YES                                      
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - tariff_supplements_code_key: (code)

Indexes:
  - tariff_supplements_code_key
    CREATE UNIQUE INDEX tariff_supplements_code_key ON public.tariff_supplements USING btree (code)
  - idx_ts_code
    CREATE INDEX idx_ts_code ON public.tariff_supplements USING btree (code)
  - idx_ts_active
    CREATE INDEX idx_ts_active ON public.tariff_supplements USING btree (code, is_active) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: TAX_DECLARATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
declaration_number                  varchar(50)               NO                                       
user_id                             uuid                      NO                                       
company_id                          uuid                      YES                                      
declaration_type                    declaration_type_enum     NO                                       
fiscal_year                         integer                   NO                                       
fiscal_period                       varchar(20)               YES                                      
declaration_deadline                date                      NO                                       
declared_data                       jsonb                     NO         '{}'::jsonb                   
supporting_documents                jsonb                     YES        '[]'::jsonb                   
taxable_base                        numeric                   YES        0                             
calculated_tax                      numeric                   YES        0                             
deductions                          numeric                   YES        0                             
credits                             numeric                   YES        0                             
net_tax_due                         numeric                   YES        0                             
status                              declaration_status_enum   YES        'draft'::declaration_status_en
submitted_at                        timestamp with time zone  YES                                      
processed_at                        timestamp with time zone  YES                                      
processed_by                        uuid                      YES                                      
taxpayer_notes                      text                      YES                                      
processor_notes                     text                      YES                                      
rejection_reason                    text                      YES                                      
digital_signature                   text                      YES                                      
signature_timestamp                 timestamp with time zone  YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
declaration_nature                  varchar(20)               YES        'original'::character varying 
  └─ Description: Nature de la déclaration: original, rectificative, complémentaire ou annulation
original_declaration_id             uuid                      YES                                      
  └─ Description: Référence vers la déclaration originale (si rectificative/complémentaire)

Primary Key: id

Foreign Keys:
  - company_id → companies.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - original_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - processed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - tax_declarations_declaration_number_key: (declaration_number)

Indexes:
  - tax_declarations_declaration_number_key
    CREATE UNIQUE INDEX tax_declarations_declaration_number_key ON public.tax_declarations USING btree (declaration_number)
  - idx_tax_declarations_user
    CREATE INDEX idx_tax_declarations_user ON public.tax_declarations USING btree (user_id, fiscal_year, status)
  - idx_tax_declarations_type
    CREATE INDEX idx_tax_declarations_type ON public.tax_declarations USING btree (declaration_type, fiscal_year, status)
  - idx_tax_declarations_user_status
    CREATE INDEX idx_tax_declarations_user_status ON public.tax_declarations USING btree (user_id, status)
  - idx_tax_declarations_type_status
    CREATE INDEX idx_tax_declarations_type_status ON public.tax_declarations USING btree (declaration_type, status)

----------------------------------------------------------------------------------------------------
Table: TRANSLATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  bigint                    NO         nextval('translations_id_seq':
category                            varchar(50)               NO                                       
  └─ Description: Catégorie: enum, ui.menu, ui.button, form.label, system.message, fiscal.period, etc.
key_code                            varchar(255)              NO                                       
  └─ Description: Code unique identifiant la traduction (ex: user_role.citizen, dashboard, save)
context                             varchar(100)              YES                                      
  └─ Description: Contexte additionnel optionnel (ex: user_role_enum, navigation, payment)
es                                  text                      NO                                       
  └─ Description: Traduction Espagnol (langue par défaut Guinée Équatoriale)
fr                                  text                      NO                                       
  └─ Description: Traduction Français (langue officielle Guinée Équatoriale)
en                                  text                      NO                                       
  └─ Description: Traduction Anglais (langue internationale)
description                         text                      YES                                      
translation_source                  varchar(50)               YES        'manual'::character varying   
  └─ Description: Source: manual, import, ai_generated
created_at                          timestamp without time zone YES        now()                         
updated_at                          timestamp without time zone YES        now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      
version                             integer                   YES        1                             

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - unique_translation_key: (category, key_code, context)

Indexes:
  - unique_translation_key
    CREATE UNIQUE INDEX unique_translation_key ON public.translations USING btree (category, key_code, context)
  - idx_translations_category
    CREATE INDEX idx_translations_category ON public.translations USING btree (category)
  - idx_translations_key_code
    CREATE INDEX idx_translations_key_code ON public.translations USING btree (key_code)
  - idx_translations_category_key
    CREATE INDEX idx_translations_category_key ON public.translations USING btree (category, key_code)
  - idx_translations_context
    CREATE INDEX idx_translations_context ON public.translations USING btree (context) WHERE (context IS NOT NULL)
  - idx_translations_es_gin
    CREATE INDEX idx_translations_es_gin ON public.translations USING gin (to_tsvector('spanish'::regconfig, es))
  - idx_translations_fr_gin
    CREATE INDEX idx_translations_fr_gin ON public.translations USING gin (to_tsvector('french'::regconfig, fr))
  - idx_translations_en_gin
    CREATE INDEX idx_translations_en_gin ON public.translations USING gin (to_tsvector('english'::regconfig, en))

----------------------------------------------------------------------------------------------------
Table: TREASURY_EXPORTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
export_type                         export_type_enum          NO                                       
export_format                       varchar(20)               NO         'csv'::character varying      
period_start                        date                      NO                                       
period_end                          date                      NO                                       
filters                             jsonb                     YES                                      
  └─ Description: Filtres JSONB appliques: {ministry_id, payment_method, workflow_code, etc.}
status                              export_status_enum        NO         'pending'::export_status_enum 
progress_percentage                 integer                   YES        0                             
total_records                       integer                   YES                                      
total_amount                        numeric                   YES                                      
currency                            varchar(3)                YES        'XAF'::character varying      
file_path                           text                      YES                                      
  └─ Description: Chemin relatif dans le storage (Supabase ou local)
file_name                           varchar(255)              YES                                      
file_size_bytes                     bigint                    YES                                      
file_checksum                       varchar(64)               YES                                      
  └─ Description: SHA-256 du fichier genere pour verification integrite
file_mime_type                      varchar(100)              YES                                      
error_message                       text                      YES                                      
error_details                       jsonb                     YES                                      
requested_by                        uuid                      NO                                       
requested_at                        timestamp with time zone  NO         now()                         
started_at                          timestamp with time zone  YES                                      
completed_at                        timestamp with time zone  YES                                      
downloaded_at                       timestamp with time zone  YES                                      
downloaded_by                       uuid                      YES                                      
download_count                      integer                   YES        0                             

Primary Key: id

Foreign Keys:
  - downloaded_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - requested_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_exports_status
    CREATE INDEX idx_exports_status ON public.treasury_exports USING btree (status) WHERE (status = ANY (ARRAY['pending'::export_status_enum, 'processing'::export_status_enum]))
  - idx_exports_type
    CREATE INDEX idx_exports_type ON public.treasury_exports USING btree (export_type)
  - idx_exports_requested_at
    CREATE INDEX idx_exports_requested_at ON public.treasury_exports USING btree (requested_at DESC)
  - idx_exports_user
    CREATE INDEX idx_exports_user ON public.treasury_exports USING btree (requested_by)
  - idx_exports_period
    CREATE INDEX idx_exports_period ON public.treasury_exports USING btree (period_start, period_end)

----------------------------------------------------------------------------------------------------
Table: UPLOADED_FILES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      NO                                       
tax_declaration_id                  uuid                      YES                                      
payment_id                          uuid                      YES                                      
file_path                           text                      NO                                       
  └─ Description: Chemin dans le bucket (ex: declarations/2025/uuid/form.pdf)
file_name                           text                      NO                                       
file_size_bytes                     bigint                    NO                                       
mime_type                           varchar(100)              NO                                       
file_type                           attachment_type_enum      NO                                       
requires_ocr                        boolean                   NO         false                         
  └─ Description: TRUE si le fichier doit passer par OCR Tesseract (formulaires scannés)
ocr_status                          varchar(20)               YES        'pending'::character varying  
  └─ Description: Statut de l'extraction OCR (pending, processing, completed, failed, skipped)
uploaded_at                         timestamp with time zone  NO         now()                         
original_filename                   varchar(255)              YES                                      
file_url                            text                      YES                                      
file_hash                           varchar(64)               YES                                      
document_type                       varchar(50)               YES                                      
document_subtype                    varchar(50)               YES                                      
description                         text                      YES                                      
processing_mode                     varchar(20)               YES        'server_processing'::character
ocr_text                            text                      YES                                      
ocr_confidence                      numeric                   YES                                      
ocr_provider                        varchar(20)               YES                                      
extraction_status                   varchar(20)               YES        'pending'::character varying  
extracted_data                      jsonb                     YES                                      
extraction_confidence               numeric                   YES                                      
form_mapping                        jsonb                     YES                                      
processing_started_at               timestamp with time zone  YES                                      
processing_completed_at             timestamp with time zone  YES                                      
processing_duration_ms              integer                   YES                                      
access_level                        varchar(20)               YES        'private'::character varying  
validation_status                   varchar(20)               YES        'pending'::character varying  
related_to_type                     varchar(50)               YES                                      
related_to_id                       uuid                      YES                                      
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - payment_id → payments.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - uploaded_files_file_path_key: (file_path)

Indexes:
  - uploaded_files_file_path_key
    CREATE UNIQUE INDEX uploaded_files_file_path_key ON public.uploaded_files USING btree (file_path)
  - idx_uploaded_files_user_id
    CREATE INDEX idx_uploaded_files_user_id ON public.uploaded_files USING btree (user_id)
  - idx_uploaded_files_tax_declaration_id
    CREATE INDEX idx_uploaded_files_tax_declaration_id ON public.uploaded_files USING btree (tax_declaration_id) WHERE (tax_declaration_id IS NOT NULL)
  - idx_uploaded_files_ocr_status
    CREATE INDEX idx_uploaded_files_ocr_status ON public.uploaded_files USING btree (ocr_status) WHERE (requires_ocr = true)
  - idx_uploaded_files_document_type
    CREATE INDEX idx_uploaded_files_document_type ON public.uploaded_files USING btree (document_type) WHERE (document_type IS NOT NULL)
  - idx_uploaded_files_extraction_status
    CREATE INDEX idx_uploaded_files_extraction_status ON public.uploaded_files USING btree (extraction_status)
  - idx_uploaded_files_form_mapping
    CREATE INDEX idx_uploaded_files_form_mapping ON public.uploaded_files USING gin (form_mapping) WHERE (form_mapping IS NOT NULL)
  - idx_uploaded_files_extracted_data
    CREATE INDEX idx_uploaded_files_extracted_data ON public.uploaded_files USING gin (extracted_data) WHERE (extracted_data IS NOT NULL)
  - idx_uploaded_files_user_statuses
    CREATE INDEX idx_uploaded_files_user_statuses ON public.uploaded_files USING btree (user_id, extraction_status, validation_status)
  - idx_uploaded_files_processing_times
    CREATE INDEX idx_uploaded_files_processing_times ON public.uploaded_files USING btree (processing_started_at, processing_completed_at) WHERE (processing_completed_at IS NOT NULL)
  - idx_uploaded_files_document_subtype
    CREATE INDEX idx_uploaded_files_document_subtype ON public.uploaded_files USING btree (document_subtype) WHERE (document_subtype IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: USER_COMPANY_ROLES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
user_id                             uuid                      NO                                       
company_id                          uuid                      NO                                       
role                                company_role_enum         NO                                       
  └─ Description: Company role (company_owner, company_admin, company_accountant, company_member). DISTINCT from users.role (system roles).
is_active                           boolean                   YES        true                          
assigned_at                         timestamp with time zone  YES        now()                         

Primary Key: user_id, company_id

Foreign Keys:
  - company_id → companies.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_user_company_roles_role
    CREATE INDEX idx_user_company_roles_role ON public.user_company_roles USING btree (role)
  - idx_user_company_roles_company_role
    CREATE INDEX idx_user_company_roles_company_role ON public.user_company_roles USING btree (company_id, role)

----------------------------------------------------------------------------------------------------
Table: USER_FAVORITES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
user_id                             uuid                      NO                                       
fiscal_service_code                 varchar(10)               NO                                       
notes                               text                      YES                                      
created_at                          timestamp with time zone  YES        now()                         

Primary Key: user_id, fiscal_service_code

Foreign Keys:
  - fiscal_service_code → fiscal_services.service_code (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

----------------------------------------------------------------------------------------------------
Table: USER_PERMISSIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
user_id                             uuid                      NO                                       
permission_id                       uuid                      NO                                       
granted                             boolean                   YES        true                          
  └─ Description: TRUE = permission accordée, FALSE = permission refusée (override)
granted_by                          uuid                      YES                                      
  └─ Description: Admin qui a accordé/refusé cette permission
granted_at                          timestamp without time zone YES        now()                         
expires_at                          timestamp without time zone YES                                      
  └─ Description: Expiration automatique pour permissions temporaires
reason                              text                      YES                                      
  └─ Description: Raison de l'attribution (pour audit et traçabilité)

Primary Key: user_id, permission_id

Foreign Keys:
  - granted_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - permission_id → permissions.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_user_permissions_user
    CREATE INDEX idx_user_permissions_user ON public.user_permissions USING btree (user_id)
  - idx_user_permissions_permission
    CREATE INDEX idx_user_permissions_permission ON public.user_permissions USING btree (permission_id)
  - idx_user_permissions_expires
    CREATE INDEX idx_user_permissions_expires ON public.user_permissions USING btree (expires_at) WHERE (expires_at IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: USERS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
email                               varchar(255)              NO                                       
password_hash                       varchar(255)              NO                                       
first_name                          varchar(100)              NO                                       
last_name                           varchar(100)              NO                                       
full_name                           varchar(255)              YES                                      
matricule                           varchar(50)               YES                                      
phone_number                        varchar(20)               YES                                      
document_type                       varchar(20)               YES                                      
document_number                     varchar(50)               YES                                      
role                                user_role_enum            NO         'citizen'::user_role_enum     
status                              user_status_enum          YES        'active'::user_status_enum    
preferred_language                  varchar(2)                YES        'es'::character varying       
email_notifications                 boolean                   YES        true                          
push_notifications                  boolean                   YES        true                          
email_verified                      boolean                   YES        false                         
  └─ Description: Flag indicating if user email has been verified
phone_verified                      boolean                   YES        false                         
last_login                          timestamp with time zone  YES                                      
failed_login_attempts               integer                   YES        0                             
  └─ Description: Number of consecutive failed login attempts (resets to 0 on successful login or IP change)
locked_until                        timestamp with time zone  YES                                      
  └─ Description: Timestamp when account lockout expires (NULL if not locked)
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
address                             text                      YES                                      
  └─ Description: User street address
city                                varchar(100)              YES                                      
  └─ Description: User city
avatar_url                          text                      YES                                      
  └─ Description: User profile picture URL
email_verification_code             varchar(6)                YES                                      
  └─ Description: 6-digit code sent by email for verification (expires in 15 min)
email_verification_expires_at       timestamp with time zone  YES                                      
  └─ Description: Expiration timestamp for email verification code
password_reset_token                varchar(255)              YES                                      
  └─ Description: Random token (32 chars) for password reset (expires in 1 hour)
password_reset_expires_at           timestamp with time zone  YES                                      
  └─ Description: Expiration timestamp for password reset token
two_factor_enabled                  boolean                   YES        false                         
  └─ Description: Flag indicating if 2FA is enabled for this user
two_factor_secret                   varchar(64)               YES                                      
  └─ Description: TOTP secret for 2FA authentication
two_factor_backup_codes             jsonb                     YES                                      
  └─ Description: Array of 10 backup codes for 2FA recovery (hashed)
last_failed_ip                      varchar(45)               YES                                      
  └─ Description: IP address of last failed login attempt (used to reset counter if IP changes)
supervisor_id                       uuid                      YES                                      
  └─ Description: DEPRECATED: Use agent_profiles.is_supervisor and backup_for_profile_id
department_id                       varchar(100)              YES                                      
  └─ Description: DEPRECATED: Use agent_profiles.entity_id
specializations                     jsonb                     YES        '[]'::jsonb                   
  └─ Description: DEPRECATED: Use agent_profiles.specializations
max_concurrent_assignments          integer                   YES        20                            
  └─ Description: DEPRECATED: Use agent_workloads.max_concurrent_assignments
role_id                             uuid                      YES                                      
  └─ Description: Référence vers table roles (nouvelle logique granulaire). Si NULL, utilise role VARCHAR.
sms_notifications                   boolean                   YES        false                         
  └─ Description: User preference for receiving SMS notifications
matricula_funcionario               varchar(50)               YES                                      
  └─ Description: Matricula del funcionario verificada por el Ministerio de la Funcion Publica
funcionario_verified_at             timestamp with time zone  YES                                      
  └─ Description: Fecha y hora de verificacion del funcionario
funcionario_verified_by             uuid                      YES                                      
  └─ Description: ID del agente que verifico al funcionario

Primary Key: id

Foreign Keys:
  - funcionario_verified_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - role_id → roles.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - supervisor_id → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - users_email_key: (email)
  - users_matricula_funcionario_key: (matricula_funcionario)
  - users_matricule_key: (matricule)

Indexes:
  - users_email_key
    CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
  - users_matricule_key
    CREATE UNIQUE INDEX users_matricule_key ON public.users USING btree (matricule)
  - idx_users_email
    CREATE INDEX idx_users_email ON public.users USING btree (email) WHERE (status <> 'deactivated'::user_status_enum)
  - idx_users_matricule
    CREATE INDEX idx_users_matricule ON public.users USING btree (matricule) WHERE (matricule IS NOT NULL)
  - idx_users_full_name_trgm
    CREATE INDEX idx_users_full_name_trgm ON public.users USING gin (full_name gin_trgm_ops)
  - idx_users_status
    CREATE INDEX idx_users_status ON public.users USING btree (status)
  - idx_users_city
    CREATE INDEX idx_users_city ON public.users USING btree (city) WHERE (city IS NOT NULL)
  - idx_users_email_verification_code
    CREATE INDEX idx_users_email_verification_code ON public.users USING btree (email_verification_code) WHERE (email_verification_code IS NOT NULL)
  - idx_users_password_reset_token
    CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token) WHERE (password_reset_token IS NOT NULL)
  - idx_users_email_verified
    CREATE INDEX idx_users_email_verified ON public.users USING btree (email_verified) WHERE (email_verified = true)
  - idx_users_locked_until
    CREATE INDEX idx_users_locked_until ON public.users USING btree (locked_until) WHERE (locked_until IS NOT NULL)
  - idx_users_role_id
    CREATE INDEX idx_users_role_id ON public.users USING btree (role_id) WHERE (role_id IS NOT NULL)
  - idx_users_supervisor_id
    CREATE INDEX idx_users_supervisor_id ON public.users USING btree (supervisor_id) WHERE (supervisor_id IS NOT NULL)
  - idx_users_department_id
    CREATE INDEX idx_users_department_id ON public.users USING btree (department_id) WHERE (department_id IS NOT NULL)
  - idx_users_specializations
    CREATE INDEX idx_users_specializations ON public.users USING gin (specializations)
  - users_matricula_funcionario_key
    CREATE UNIQUE INDEX users_matricula_funcionario_key ON public.users USING btree (matricula_funcionario)
  - idx_users_role
    CREATE INDEX idx_users_role ON public.users USING btree (role) WHERE (status = 'active'::user_status_enum)

----------------------------------------------------------------------------------------------------
Table: USSD_CONFIGURATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('ussd_configurations_i
operator_name                       varchar(100)              NO                                       
operator_code                       varchar(50)               NO                                       
short_code                          varchar(20)               NO                                       
api_endpoint                        varchar(500)              YES                                      
auth_config                         jsonb                     YES        '{}'::jsonb                   
menu_structure                      jsonb                     NO                                       
session_timeout_seconds             integer                   YES        180                           
max_input_length                    integer                   YES        160                           
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - ussd_configurations_operator_code_unique: (operator_code)

Indexes:
  - idx_ussd_configs_operator
    CREATE INDEX idx_ussd_configs_operator ON public.ussd_configurations USING btree (operator_code)
  - idx_ussd_configs_active
    CREATE INDEX idx_ussd_configs_active ON public.ussd_configurations USING btree (is_active)
  - ussd_configurations_operator_code_unique
    CREATE UNIQUE INDEX ussd_configurations_operator_code_unique ON public.ussd_configurations USING btree (operator_code)

----------------------------------------------------------------------------------------------------
Table: VERIFICACION_FRAUD_LOG
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      YES                                      
matricula                           varchar(50)               YES                                      
reason                              varchar(100)              NO                                       
ip_address                          inet                      YES                                      
user_agent                          text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_fraud_log_user
    CREATE INDEX idx_fraud_log_user ON public.verificacion_fraud_log USING btree (user_id)
  - idx_fraud_log_created
    CREATE INDEX idx_fraud_log_created ON public.verificacion_fraud_log USING btree (created_at DESC)
  - idx_fraud_log_reason
    CREATE INDEX idx_fraud_log_reason ON public.verificacion_fraud_log USING btree (reason)

----------------------------------------------------------------------------------------------------
Table: VERIFICACION_FUNCIONARIO
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
user_id                             uuid                      NO                                       
matricula                           varchar(50)               NO                                       
status                              varchar(20)               NO         'pendiente'::character varying
processed_by                        uuid                      YES                                      
processed_at                        timestamp with time zone  YES                                      
verificacion_matricula_existe       boolean                   YES        false                         
  └─ Description: Agent a verifie que la matricula existe dans SIGEF
verificacion_nombre_coincide        boolean                   YES        false                         
  └─ Description: Agent a verifie que le nom correspond
verificacion_dip_coincide           boolean                   YES        false                         
rejection_reason                    text                      YES                                      
notes                               text                      YES                                      
ip_address                          inet                      YES                                      
user_agent                          text                      YES                                      
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
verification_data                   jsonb                     NO         '{}'::jsonb                   
  └─ Description: Données complètes: documents (dip, nombramiento/carnet/contrato), extractions OCR, validation croisée

Primary Key: id

Foreign Keys:
  - processed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_verificacion_func_status
    CREATE INDEX idx_verificacion_func_status ON public.verificacion_funcionario USING btree (status)
  - idx_verificacion_func_user
    CREATE INDEX idx_verificacion_func_user ON public.verificacion_funcionario USING btree (user_id)
  - idx_verificacion_func_matricula
    CREATE INDEX idx_verificacion_func_matricula ON public.verificacion_funcionario USING btree (matricula)
  - idx_verificacion_func_created
    CREATE INDEX idx_verificacion_func_created ON public.verificacion_funcionario USING btree (created_at DESC)
  - idx_verificacion_func_pending
    CREATE INDEX idx_verificacion_func_pending ON public.verificacion_funcionario USING btree (user_id) WHERE ((status)::text = 'pendiente'::text)
  - idx_verificacion_data_gin
    CREATE INDEX idx_verificacion_data_gin ON public.verificacion_funcionario USING gin (verification_data)
  - idx_verificacion_data_matricula
    CREATE INDEX idx_verificacion_data_matricula ON public.verificacion_funcionario USING btree (((verification_data ->> 'matricula'::text)))

----------------------------------------------------------------------------------------------------
Table: VERIFICATION_QUEUE
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
service_request_id                  uuid                      NO                                       
status                              varchar(20)               YES        'pending'::character varying  
retry_count                         integer                   YES        0                             
max_retries                         integer                   YES        3                             
next_retry_at                       timestamp with time zone  YES        now()                         
  └─ Description: When to retry failed items (exponential backoff)
error_message                       text                      YES                                      
partial_results                     jsonb                     YES        '{}'::jsonb                   
  └─ Description: Store partial results between retries
created_at                          timestamp with time zone  YES        now()                         
started_at                          timestamp with time zone  YES                                      
completed_at                        timestamp with time zone  YES                                      

Primary Key: id

Foreign Keys:
  - service_request_id → service_requests.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - uq_vq_request: (service_request_id)

Indexes:
  - idx_vq_pending
    CREATE INDEX idx_vq_pending ON public.verification_queue USING btree (next_retry_at) WHERE (((status)::text = ANY ((ARRAY['pending'::character varying, 'failed'::character varying])::text[])) AND (retry_count < max_retries))
  - idx_vq_request
    CREATE INDEX idx_vq_request ON public.verification_queue USING btree (service_request_id)
  - uq_vq_request
    CREATE UNIQUE INDEX uq_vq_request ON public.verification_queue USING btree (service_request_id)

----------------------------------------------------------------------------------------------------
Table: VERIFIED_IDENTIFIERS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
blind_index                         bytea                     NO                                       
  └─ Description: HMAC-SHA256 de la valeur, permet recherche sans exposer la valeur
encrypted_value                     bytea                     NO                                       
  └─ Description: Valeur chiffree AES-256-GCM, seule l'application peut dechiffrer
identifier_type                     identifier_type_enum      NO                                       
  └─ Description: Type d'identifiant (dni, pasaporte, matricula, etc.)
source                              verification_source_enum  NO                                       
  └─ Description: Organisme source de la verification
user_id                             uuid                      YES                                      
verified_at                         timestamp with time zone  NO         now()                         
expires_at                          timestamp with time zone  YES                                      
is_active                           boolean                   YES        true                          
verified_by                         uuid                      YES                                      
verification_request_id             uuid                      YES                                      
encrypted_metadata                  bytea                     YES                                      
  └─ Description: Donnees additionnelles chiffrees (JSON)
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
encryption_key_version              smallint                  YES        1                             
  └─ Description: Version of encryption key used, for future key rotation

Primary Key: id

Foreign Keys:
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - verified_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - unique_identifier_per_type: (blind_index, identifier_type)

Indexes:
  - unique_identifier_per_type
    CREATE UNIQUE INDEX unique_identifier_per_type ON public.verified_identifiers USING btree (blind_index, identifier_type)
  - idx_vi_blind_index
    CREATE INDEX idx_vi_blind_index ON public.verified_identifiers USING btree (blind_index)
  - idx_vi_type
    CREATE INDEX idx_vi_type ON public.verified_identifiers USING btree (identifier_type)
  - idx_vi_blind_type_active
    CREATE INDEX idx_vi_blind_type_active ON public.verified_identifiers USING btree (blind_index, identifier_type) WHERE (is_active = true)
  - idx_vi_user
    CREATE INDEX idx_vi_user ON public.verified_identifiers USING btree (user_id) WHERE (user_id IS NOT NULL)
  - idx_vi_expires
    CREATE INDEX idx_vi_expires ON public.verified_identifiers USING btree (expires_at) WHERE ((expires_at IS NOT NULL) AND (is_active = true))
  - idx_vi_source
    CREATE INDEX idx_vi_source ON public.verified_identifiers USING btree (source)
  - idx_vi_verified_at
    CREATE INDEX idx_vi_verified_at ON public.verified_identifiers USING btree (verified_at DESC)
  - idx_vi_request
    CREATE INDEX idx_vi_request ON public.verified_identifiers USING btree (verification_request_id) WHERE (verification_request_id IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: VERIFIED_IDENTIFIERS_AUDIT
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
identifier_id                       uuid                      YES                                      
blind_index                         bytea                     NO                                       
identifier_type                     identifier_type_enum      NO                                       
operation                           varchar(20)               NO                                       
  └─ Description: Type d'operation: INSERT, UPDATE, DELETE, SEARCH, DEACTIVATE
performed_by                        uuid                      YES                                      
ip_address                          inet                      YES                                      
user_agent                          text                      YES                                      
request_id                          uuid                      YES                                      
search_found                        boolean                   YES                                      
  └─ Description: Resultat de la recherche (TRUE si trouve, FALSE sinon)
created_at                          timestamp with time zone  NO         now()                         

Primary Key: id

Foreign Keys:
  - performed_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_via_blind_index
    CREATE INDEX idx_via_blind_index ON public.verified_identifiers_audit USING btree (blind_index)
  - idx_via_created
    CREATE INDEX idx_via_created ON public.verified_identifiers_audit USING btree (created_at DESC)
  - idx_via_operation
    CREATE INDEX idx_via_operation ON public.verified_identifiers_audit USING btree (operation)
  - idx_via_performed_by
    CREATE INDEX idx_via_performed_by ON public.verified_identifiers_audit USING btree (performed_by) WHERE (performed_by IS NOT NULL)
  - idx_via_identifier_id
    CREATE INDEX idx_via_identifier_id ON public.verified_identifiers_audit USING btree (identifier_id) WHERE (identifier_id IS NOT NULL)

----------------------------------------------------------------------------------------------------
Table: WEBHOOK_CONFIGURATIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('webhook_configuration
name                                varchar(255)              NO                                       
webhook_type                        varchar(50)               NO                                       
endpoint_url                        varchar(1000)             NO                                       
http_method                         varchar(10)               YES        'POST'::character varying     
headers                             jsonb                     YES        '{}'::jsonb                   
auth_type                           varchar(50)               YES                                      
auth_config                         jsonb                     YES        '{}'::jsonb                   
payload_template                    jsonb                     YES                                      
retry_config                        jsonb                     YES        '{"max_retries": 3, "retry_del
timeout_seconds                     integer                   YES        30                            
events                              ARRAY                     YES        '{}'::text[]                  
is_active                           boolean                   YES        true                          
last_triggered_at                   timestamp with time zone  YES                                      
last_status                         varchar(50)               YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_webhook_configs_type
    CREATE INDEX idx_webhook_configs_type ON public.webhook_configurations USING btree (webhook_type)
  - idx_webhook_configs_active
    CREATE INDEX idx_webhook_configs_active ON public.webhook_configurations USING btree (is_active)

----------------------------------------------------------------------------------------------------
Table: WEBHOOK_LOGS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('webhook_logs_id_seq':
webhook_id                          integer                   YES                                      
event_type                          varchar(100)              YES                                      
request_payload                     jsonb                     YES                                      
response_status                     integer                   YES                                      
response_body                       text                      YES                                      
duration_ms                         integer                   YES                                      
error_message                       text                      YES                                      
created_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - webhook_id → webhook_configurations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_webhook_logs_webhook_id
    CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs USING btree (webhook_id)
  - idx_webhook_logs_created_at
    CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs USING btree (created_at)

----------------------------------------------------------------------------------------------------
Table: WORKFLOW_DOCUMENT_REQUIREMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
workflow_code                       varchar(100)              NO                                       
  └─ Description: Code du workflow (ex: pasaporte_nuevo)
document_template_id                integer                   YES                                      
document_code                       varchar(100)              NO                                       
  └─ Description: Code unique du document (ex: dip)
document_name_es                    varchar(255)              NO                                       
condition_type                      document_condition_type_enum NO         'always'::document_condition_t
  └─ Description: Type de condition pour ce document
condition_value                     jsonb                     YES        '{}'::jsonb                   
is_required                         boolean                   YES        true                          
display_order                       integer                   YES        0                             
instructions_es                     text                      YES                                      
extraction_schema_key               varchar(100)              YES                                      
  └─ Description: Clé du schéma JSON pour extraction Gemini
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         
created_by                          uuid                      YES                                      

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - document_template_id → document_templates.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Unique Constraints:
  - unique_workflow_document: (workflow_code, document_code)

Indexes:
  - unique_workflow_document
    CREATE UNIQUE INDEX unique_workflow_document ON public.workflow_document_requirements USING btree (workflow_code, document_code)
  - idx_wdr_workflow_code
    CREATE INDEX idx_wdr_workflow_code ON public.workflow_document_requirements USING btree (workflow_code)
  - idx_wdr_document_code
    CREATE INDEX idx_wdr_document_code ON public.workflow_document_requirements USING btree (document_code)
  - idx_wdr_condition_type
    CREATE INDEX idx_wdr_condition_type ON public.workflow_document_requirements USING btree (condition_type)
  - idx_wdr_display_order
    CREATE INDEX idx_wdr_display_order ON public.workflow_document_requirements USING btree (workflow_code, display_order)
  - idx_wdr_active
    CREATE INDEX idx_wdr_active ON public.workflow_document_requirements USING btree (workflow_code, is_active) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: WORKFLOW_SUPPLEMENT_CONFIG
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('workflow_supplement_c
workflow_code                       varchar(100)              NO                                       
supplement_code                     varchar(50)               NO                                       
quantity_per_request                integer                   NO         1                             
  └─ Description: Nombre de suppléments par demande
is_required                         boolean                   YES        true                          
is_active                           boolean                   YES        true                          
created_at                          timestamp with time zone  YES        now()                         
updated_at                          timestamp with time zone  YES        now()                         

Primary Key: id

Foreign Keys:
  - supplement_code → tariff_supplements.code (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - unique_workflow_supplement: (workflow_code, supplement_code)

Indexes:
  - unique_workflow_supplement
    CREATE UNIQUE INDEX unique_workflow_supplement ON public.workflow_supplement_config USING btree (workflow_code, supplement_code)
  - idx_wsc_workflow
    CREATE INDEX idx_wsc_workflow ON public.workflow_supplement_config USING btree (workflow_code)
  - idx_wsc_active
    CREATE INDEX idx_wsc_active ON public.workflow_supplement_config USING btree (workflow_code, is_active) WHERE (is_active = true)

----------------------------------------------------------------------------------------------------
Table: WORKFLOW_TARIFFS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('workflow_tariffs_id_s
workflow_code                       varchar(100)              NO                                       
  └─ Description: Code du workflow (residencia, pasaporte_nuevo, etc.)
solicitud_type                      varchar(50)               NO         'expedicion'::character varyin
  └─ Description: Type de sollicitation (expedicion, renovacion, duplicado)
amount                              numeric                   NO                                       
currency                            varchar(3)                YES        'XAF'::character varying      
legal_reference                     varchar(255)              YES                                      
effective_from                      date                      NO         CURRENT_DATE                  
  └─ Description: Date de début d'application du tarif
effective_to                        date                      YES                                      
  └─ Description: Date de fin d'application (NULL = toujours actif)
is_active                           boolean                   YES        true                          
created_by                          uuid                      YES                                      
created_at                          timestamp with time zone  YES        now()                         
updated_by                          uuid                      YES                                      
updated_at                          timestamp with time zone  YES        now()                         
tariff_type                         varchar(20)               NO         'FIXED'::character varying    
  └─ Description: Type de tarification: FIXED, PERCENTAGE, NOTA_INGRESO
percentage_rate                     numeric                   YES                                      
  └─ Description: Taux en % (ex: 0.5 = 0.5%) - utilisé si tariff_type = PERCENTAGE

Primary Key: id

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Indexes:
  - idx_wt_tariff_type
    CREATE INDEX idx_wt_tariff_type ON public.workflow_tariffs USING btree (tariff_type)
  - idx_wt_unique_active
    CREATE UNIQUE INDEX idx_wt_unique_active ON public.workflow_tariffs USING btree (workflow_code, solicitud_type) WHERE ((is_active = true) AND (effective_to IS NULL))
  - idx_wt_workflow_code
    CREATE INDEX idx_wt_workflow_code ON public.workflow_tariffs USING btree (workflow_code)
  - idx_wt_lookup
    CREATE INDEX idx_wt_lookup ON public.workflow_tariffs USING btree (workflow_code, solicitud_type, is_active)

----------------------------------------------------------------------------------------------------
Table: WORKFLOW_TRANSITIONS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('workflow_transitions_
from_status                         payment_workflow_status   NO                                       
to_status                           payment_workflow_status   NO                                       
allowed_roles                       ARRAY                     NO                                       
requires_comment                    boolean                   YES        false                         
requires_supervisor_approval        boolean                   YES        false                         
max_transition_hours                integer                   YES                                      
conditions                          jsonb                     YES        '{}'::jsonb                   

Primary Key: id

Unique Constraints:
  - workflow_transitions_from_status_to_status_key: (from_status, to_status)

Indexes:
  - workflow_transitions_from_status_to_status_key
    CREATE UNIQUE INDEX workflow_transitions_from_status_to_status_key ON public.workflow_transitions USING btree (from_status, to_status)

----------------------------------------------------------------------------------------------------
Table: WORKFLOWS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
code                                varchar(100)              NO                                       
name_es                             varchar(255)              NO                                       
description_es                      text                      YES                                      
category                            varchar(50)               NO                                       
entity_code                         varchar(50)               NO                                       
workflow_type                       varchar(30)               NO         'standard'::character varying 
  └─ Description: standard=agent validation before payment, direct_payment=no validation, multi_phase=complex Python logic
requires_agent_validation           boolean                   NO         true                          
requires_appointment                boolean                   NO         false                         
is_generic                          boolean                   NO         false                         
  └─ Description: TRUE=uses GenericWorkflow class, FALSE=has dedicated Python class
appointment_delay_days              integer                   YES                                      
  └─ Description: If set, overrides appointment_delay_rules table
appointment_entity_code             varchar(50)               YES                                      
sla_hours                           integer                   NO         48                            
max_processing_days                 integer                   YES        30                            
display_order                       integer                   YES        0                             
icon                                varchar(50)               YES                                      
color                               varchar(20)               YES                                      
is_active                           boolean                   NO         true                          
config                              jsonb                     NO         '{}'::jsonb                   
created_at                          timestamp with time zone  NO         now()                         
updated_at                          timestamp with time zone  NO         now()                         
created_by                          uuid                      YES                                      
updated_by                          uuid                      YES                                      

Primary Key: code

Foreign Keys:
  - created_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - updated_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)

Indexes:
  - idx_workflows_category
    CREATE INDEX idx_workflows_category ON public.workflows USING btree (category)
  - idx_workflows_entity
    CREATE INDEX idx_workflows_entity ON public.workflows USING btree (entity_code)
  - idx_workflows_type
    CREATE INDEX idx_workflows_type ON public.workflows USING btree (workflow_type)
  - idx_workflows_active
    CREATE INDEX idx_workflows_active ON public.workflows USING btree (is_active) WHERE (is_active = true)

====================================================================================================
4. VIEWS
====================================================================================================


View: v_active_assignments
Definition:  SELECT a.id AS assignment_id,
    a.item_id,
    a.item_type,
    a.agent_profile_id,
    ap.user_id AS agent_user_id,
    u.full_name AS agent_name,
    u.email AS agent_email,
    ap.ministry_id,
 ...

View: v_active_declaration_assignments
Definition:  SELECT a.id AS assignment_id,
    a.item_id AS declaration_id,
    a.item_type AS declaration_type,
    a.agent_profile_id,
    ap.user_id AS agent_user_id,
    u.full_name AS agent_name,
    u.email...

View: v_active_service_request_assignments
Definition:  SELECT a.id AS assignment_id,
    a.item_id AS service_request_id,
    a.item_type AS workflow_code,
    a.agent_profile_id,
    ap.user_id AS agent_user_id,
    u.full_name AS agent_name,
    u.emai...

View: v_agent_assignment_history
Definition:  SELECT a.id AS assignment_id,
    a.item_id,
    a.item_type,
    a.agent_profile_id,
    ap.user_id AS agent_user_id,
    u.full_name AS agent_name,
    ap.ministry_id,
    m.ministry_code,
    ap.e...

View: v_agent_entity_summary
Definition:  SELECT e.id AS entity_id,
    e.code AS entity_code,
    e.name AS entity_name,
    e.entity_type,
    m.id AS ministry_id,
    m.ministry_code,
    m.name_es AS ministry_name,
    count(DISTINCT ap....

View: v_agent_performance_rankings
Definition:  SELECT ap.id AS agent_profile_id,
    ap.user_id,
    u.full_name,
    u.email,
    ap.ministry_id,
    m.ministry_code,
    m.name_es AS ministry_name,
    ap.entity_id,
    e.code AS entity_code,
 ...

View: v_agent_performance_summary
Definition:  SELECT aps.agent_profile_id,
    ap.user_id,
    ap.agent_type,
    ap.agent_role,
    ap.is_supervisor,
    ap.ministry_id,
    u.full_name AS agent_name,
    m.name_es AS ministry_name,
    aps.cur...

View: v_agent_work_queue_priority
Definition:  SELECT awq.id AS queue_id,
    awq.ministry_id,
    m.name_es AS ministry_name,
    awq.item_id AS declaration_id,
    awq.declaration_type,
    awq.amount AS calculated_tax,
    awq.priority_score A...

View: v_agent_workload_summary
Definition:  SELECT aw.id AS workload_id,
    aw.agent_profile_id,
    ap.user_id,
    ap.agent_type,
    ap.agent_role,
    ap.is_supervisor,
    ap.ministry_id,
    ap.entity_id,
    u.full_name AS agent_name,
...

View: v_agents_workload_dashboard
Definition:  SELECT ap.id AS agent_profile_id,
    ap.user_id,
    u.email,
    u.full_name,
    ap.agent_type,
    ap.agent_role,
    ap.is_supervisor,
    ap.ministry_id,
    m.ministry_code,
    m.name_es AS m...

View: v_anomaly_summary
Definition:  SELECT anomaly_type,
    severity,
    status,
    count(*) AS count,
    sum(COALESCE(affected_amount, difference_amount, (0)::numeric)) AS total_affected,
    min(detected_at) AS oldest_detected,
 ...

View: v_appointments_by_city
Definition:  SELECT COALESCE(el.city, 'Non specifie'::character varying) AS city,
    COALESCE(el.region, 'Non specifie'::character varying) AS region,
    count(*) AS total_appointments,
    count(*) FILTER (WHE...

View: v_assignments_with_profiles
Definition:  SELECT a.id,
    a.item_id,
    a.item_type,
    a.agent_profile_id,
    a.assigned_by_profile_id,
    a.assignment_method,
    a.status,
    a.notes,
    a.auto_assignment_score,
    a.score_breakdo...

View: v_available_agents
Definition:  SELECT ap.id AS agent_profile_id,
    ap.user_id,
    u.email,
    u.full_name,
    u.first_name,
    u.last_name,
    u.role AS user_role,
    ap.agent_type,
    ap.agent_role,
    ap.is_supervisor,...

View: v_available_agents_by_ministry
Definition:  SELECT m.id AS ministry_id,
    m.ministry_code,
    m.name_es AS ministry_name,
    count(DISTINCT ap.id) AS total_agents,
    count(DISTINCT ap.id) FILTER (WHERE (ap.is_active = true)) AS active_ag...

View: v_bank_reconciliation_matching
Definition:  SELECT id AS bank_transaction_id,
    bank_code,
    bank_reference,
    bank_transaction_date,
    amount AS bank_amount,
    currency,
    account_number,
    account_holder_name AS bank_account_ho...

View: v_declaration_assignments
Definition:  SELECT a.id AS assignment_id,
    a.item_id AS declaration_id,
    a.item_type AS declaration_type,
    a.agent_profile_id,
    a.assigned_by_profile_id,
    a.assignment_method,
    a.status AS assi...

View: v_declaration_statistics_by_type
Definition:  WITH declaration_payments AS (
         SELECT d.id,
            d.declaration_type,
            d.status,
            d.calculated_tax,
            d.net_tax_due,
            d.processed_at,
       ...

View: v_declarations_pending_review
Definition:  SELECT d.id,
    d.declaration_type,
    d.user_id,
    u.full_name AS user_name,
    u.email AS user_email,
    d.taxable_base,
    d.calculated_tax,
    d.submitted_at,
    d.created_at,
        CA...

View: v_declarations_with_payments
Definition:  SELECT d.id AS declaration_id,
    d.declaration_type,
    d.user_id,
    u.full_name AS user_name,
    d.fiscal_year,
    d.fiscal_period,
    d.calculated_tax,
    d.net_tax_due,
    COALESCE(( SEL...

View: v_embedding_status
Definition:  SELECT count(*) FILTER (WHERE (embedding IS NOT NULL)) AS total_with_embeddings,
    count(*) FILTER (WHERE (embedding IS NULL)) AS total_without_embeddings,
    count(*) FILTER (WHERE (needs_embeddi...

View: v_entity_locations
Definition:  SELECT id,
    entity_code,
    city,
    region,
    location_name,
    location_address,
    phone,
    email,
    is_main_office,
    is_active,
    operating_hours
   FROM entity_locations
  WHER...

View: v_failed_payments_recovery
Definition:  SELECT p.id AS payment_id,
    p.tax_declaration_id,
    p.user_id,
    u.full_name AS user_name,
    u.email AS user_email,
    u.phone_number AS user_phone,
    d.declaration_type,
    d.fiscal_yea...

View: v_gemini_errors
Definition:  SELECT id,
    created_at,
    document_category,
    document_type_detected,
    workflow_code,
    processor,
    error_type,
    error_message,
    error_details,
    processing_time_ms,
    used_...

View: v_gemini_processing_stats
Definition:  SELECT date(created_at) AS date,
    document_category,
    processor,
    count(*) AS total_processings,
    count(*) FILTER (WHERE (is_match = true)) AS successful_matches,
    count(*) FILTER (WHE...

View: v_kpi_summary
Definition:  SELECT 'today'::text AS period,
    sum(mv_treasury_daily_kpis.total_amount) AS total_collected,
    sum(mv_treasury_daily_kpis.completed_count) AS total_transactions,
    avg(mv_treasury_daily_kpis....

View: v_notification_statistics
Definition:  SELECT date(created_at) AS date,
    channel,
    count(*) AS total_sent,
    count(*) FILTER (WHERE ((status)::text = 'delivered'::text)) AS delivered,
    count(*) FILTER (WHERE ((status)::text = '...

View: v_payment_plans_tracking
Definition:  WITH installment_stats AS (
         SELECT payment_installments.payment_plan_id,
            count(*) AS total_installments,
            count(
                CASE
                    WHEN ((paymen...

View: v_payments_lifecycle_dashboard
Definition:  SELECT p.id AS payment_id,
    p.tax_declaration_id,
    p.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    u.phone_number AS user_phone,
    d.declaration_type,
    d.fiscal_yea...

View: v_pending_escalations
Definition:  SELECT sp.id AS payment_id,
    sp.payment_reference,
    sp.service_request_id,
    sr.reference AS service_request_reference,
    sp.total_amount,
    sp.workflow_status,
    sp.escalation_level,
 ...

View: v_pending_payment_validations
Definition:  SELECT sp.id AS payment_id,
    sp.payment_reference,
    sp.service_request_id,
    sr.reference AS request_reference,
    sr.workflow_code,
    sp.user_id,
    u.full_name AS user_name,
    u.email...

View: v_permission_grants_audit
Definition:  SELECT pal.id,
    pal.user_id AS target_user_id,
    u.email AS target_email,
    u.role AS target_role,
    pal.permission_id,
    p.name AS permission_name,
    p.resource AS permission_resource,
...

View: v_permission_usage_analytics
Definition:  SELECT p.id AS permission_id,
    p.name AS permission_name,
    p.resource,
    p.action,
    p.module_name,
    p.is_critical,
    count(DISTINCT up.user_id) FILTER (WHERE (up.granted = true)) AS d...

View: v_recent_exports
Definition:  SELECT te.id,
    te.export_type,
    te.export_format,
    te.period_start,
    te.period_end,
    te.status,
    te.total_records,
    te.total_amount,
    te.file_name,
    te.file_size_bytes,
   ...

View: v_recent_verification_audit
Definition:  SELECT a.id,
    a.identifier_type,
    a.operation,
    a.performed_by,
    u.email AS performed_by_email,
    a.search_found,
    a.ip_address,
    a.created_at
   FROM (verified_identifiers_audit ...

View: v_reconciliation_health_metrics
Definition:  SELECT now() AS snapshot_time,
    ( SELECT count(*) AS count
           FROM bank_transactions
          WHERE (bank_transactions.payment_id IS NULL)) AS unreconciled_transactions,
    ( SELECT coun...

View: v_revenue_analytics
Definition:  SELECT date_trunc('day'::text, p.paid_at) AS payment_date,
    date_trunc('week'::text, p.paid_at) AS payment_week,
    date_trunc('month'::text, p.paid_at) AS payment_month,
    date_trunc('quarter'...

View: v_risk_analysis_trends
Definition:  SELECT date(gemini_processing_logs.created_at) AS date,
    gemini_processing_logs.workflow_code,
    count(*) AS total_analyses,
    avg(gemini_processing_logs.risk_score) AS avg_risk_score,
    cou...

View: v_role_capabilities_summary
Definition:  SELECT r.id AS role_id,
    r.name AS role_name,
    r.code AS role_code,
    r.description AS role_description,
    r.entity_type,
    r.is_system,
    count(DISTINCT rp.permission_id) FILTER (WHERE...

View: v_service_request_assignments
Definition:  SELECT a.id AS assignment_id,
    a.item_id AS service_request_id,
    a.item_type AS workflow_code,
    a.agent_profile_id,
    a.assigned_by_profile_id,
    a.assignment_method,
    a.status AS ass...

View: v_service_request_notifications
Definition:  SELECT nl.id,
    nl.service_request_id,
    sr.reference AS request_reference,
    nl.user_id,
    u.full_name AS user_name,
    nl.channel,
    nl.template_code,
    nl.subject,
    nl.content_prev...

View: v_service_request_payments
Definition:  SELECT sp.id,
    sp.payment_reference,
    sp.service_request_id,
    sr.reference AS request_reference,
    sr.workflow_code,
    sr.solicitud_type,
    sp.user_id,
    u.email AS user_email,
    u...

View: v_service_requests_by_city
Definition:  SELECT COALESCE(el.city, 'Non specifie'::character varying) AS city,
    COALESCE(el.region, 'Non specifie'::character varying) AS region,
    count(*) AS total_requests,
    count(*) FILTER (WHERE (...

View: v_slot_availability_by_location
Definition:  SELECT el.id AS location_id,
    el.entity_code,
    el.city,
    el.region,
    el.location_name,
    count(DISTINCT sc.id) AS slot_configs,
    COALESCE(sum(sc.max_appointments_per_slot), (0)::bigi...

View: v_top_ministries
Definition:  SELECT ministry_id,
    ministry_name,
    sum(completed_count) AS transaction_count,
    sum(total_amount) AS total_amount
   FROM mv_treasury_daily_kpis
  WHERE ((report_date >= date_trunc('month':...

View: v_top_payment_methods
Definition:  SELECT payment_method,
    sum(completed_count) AS transaction_count,
    sum(total_amount) AS total_amount,
    round(((sum(total_amount) / NULLIF(sum(sum(total_amount)) OVER (), (0)::numeric)) * (1...

View: v_top_workflows
Definition:  SELECT workflow_code,
    solicitud_type,
    sum(completed_count) AS transaction_count,
    sum(total_amount) AS total_amount,
    round(((sum(total_amount) / NULLIF(sum(sum(total_amount)) OVER (), ...

View: v_verificacion_stats
Definition:  SELECT count(*) FILTER (WHERE ((status)::text = 'pendiente'::text)) AS pendientes,
    count(*) FILTER (WHERE (((status)::text = 'pendiente'::text) AND ((((verification_data -> 'validacion_cruzada'::...

View: v_verificaciones_pendientes
Definition:  SELECT vf.id,
    vf.matricula,
    vf.created_at,
    COALESCE(((((vf.verification_data -> 'dip'::text) -> 'extraction'::text) -> 'titular'::text) ->> 'apellidos'::text), (((vf.verification_data -> ...

View: v_verification_dashboard
Definition:  SELECT sr.id AS request_id,
    sr.reference AS request_reference,
    sr.workflow_code,
    sr.verification_status,
    sr.verification_details,
    sr.created_at AS request_created_at,
    vq.id AS...

View: v_verification_stats
Definition:  SELECT verification_status,
    count(*) AS count,
    count(*) FILTER (WHERE (created_at >= (now() - '24:00:00'::interval))) AS last_24h,
    count(*) FILTER (WHERE (created_at >= (now() - '7 days':...

View: v_verified_identifiers_admin
Definition:  SELECT id,
    identifier_type,
    source,
    user_id,
    verified_at,
    expires_at,
    is_active,
    verified_by,
    verification_request_id,
    created_at,
    updated_at,
    length(encry...

View: v_verified_identifiers_stats
Definition:  SELECT identifier_type,
    source,
    count(*) AS total,
    count(*) FILTER (WHERE is_active) AS active,
    count(*) FILTER (WHERE (NOT is_active)) AS inactive,
    count(*) FILTER (WHERE ((expir...

View: v_workflow_supplements
Definition:  SELECT wsc.workflow_code,
    ts.code AS supplement_code,
    ts.name_es AS supplement_name,
    ts.amount AS unit_price,
    wsc.quantity_per_request,
    (ts.amount * (wsc.quantity_per_request)::nu...

View: v_workflow_tariffs_summary
Definition:  SELECT wt.workflow_code,
    wt.solicitud_type,
    wt.tariff_type,
    wt.amount AS base_amount,
    wt.percentage_rate,
    COALESCE(supp.supplements_total, (0)::numeric) AS supplements_total,
    ...

View: vw_agents
Definition:  SELECT u.id AS user_id,
    u.email,
    u.full_name,
    u.first_name,
    u.last_name,
    u.phone_number,
    u.role AS user_role,
    ap.id AS agent_profile_id,
    ap.agent_type,
    ap.is_super...

====================================================================================================
5. FUNCTIONS
====================================================================================================


Function: apply_late_fees_to_overdue_installments
Returns: void

Function: array_to_halfvec
Returns: USER-DEFINED

Function: array_to_halfvec
Returns: USER-DEFINED

Function: array_to_halfvec
Returns: USER-DEFINED

Function: array_to_halfvec
Returns: USER-DEFINED

Function: array_to_sparsevec
Returns: USER-DEFINED

Function: array_to_sparsevec
Returns: USER-DEFINED

Function: array_to_sparsevec
Returns: USER-DEFINED

Function: array_to_sparsevec
Returns: USER-DEFINED

Function: array_to_vector
Returns: USER-DEFINED

Function: array_to_vector
Returns: USER-DEFINED

Function: array_to_vector
Returns: USER-DEFINED

Function: array_to_vector
Returns: USER-DEFINED

Function: assign_document_template
Returns: boolean

Function: assign_procedure_template
Returns: boolean

Function: audit_role_permissions
Returns: trigger

Function: audit_user_permissions
Returns: trigger

Function: auto_generate_sr_reference
Returns: trigger

Function: avg
Returns: USER-DEFINED

Function: avg
Returns: USER-DEFINED

Function: batch_approve_verificaciones
Returns: jsonb

Function: binary_quantize
Returns: bit

Function: binary_quantize
Returns: bit

Function: calculate_next_retry
Returns: trigger

Function: calculate_payment_ministry
Returns: trigger

Function: calculate_processing_duration
Returns: trigger

Function: calculate_queue_priority
Returns: trigger

Function: check_department_parent
Returns: trigger

Function: check_duplicate_identifier_usage
Returns: uuid

Function: check_verified_identifier
Returns: record

Function: cleanup_expired_identifiers
Returns: integer

Function: cleanup_expired_locks
Returns: integer

Function: cleanup_expired_permissions
Returns: integer

Function: cleanup_old_gemini_logs
Returns: integer

Function: confirm_appointment_hold
Returns: record

Function: cosine_distance
Returns: double precision

Function: cosine_distance
Returns: double precision

Function: cosine_distance
Returns: double precision

Function: deactivate_verified_identifier
Returns: uuid

Function: detect_duplicate_payments
Returns: record

Function: evaluate_document_condition
Returns: boolean

Function: fiscal_services_search_vector_update
Returns: trigger

Function: flag_embedding_update
Returns: trigger

Function: generate_export_filename
Returns: character varying

Function: generate_idempotency_key
Returns: character varying

Function: generate_payment_installments
Returns: void

Function: generate_service_request_reference
Returns: character varying

Function: get_entity_locations
Returns: record

Function: get_entity_translation
Returns: text

Function: get_next_available_slot
Returns: record

Function: get_pending_notification_retries
Returns: record

Function: get_pending_verifications
Returns: record

Function: get_rule_value
Returns: jsonb

Function: get_translation
Returns: text

Function: get_translation_unified
Returns: text

Function: get_translations
Returns: jsonb

Function: get_workflow_required_documents
Returns: record

Function: get_workflow_tariff_total
Returns: record

Function: gin_btree_consistent
Returns: boolean

Function: gin_compare_prefix_anyenum
Returns: integer

Function: gin_compare_prefix_bit
Returns: integer

Function: gin_compare_prefix_bool
Returns: integer

Function: gin_compare_prefix_bpchar
Returns: integer

Function: gin_compare_prefix_bytea
Returns: integer

Function: gin_compare_prefix_char
Returns: integer

Function: gin_compare_prefix_cidr
Returns: integer

Function: gin_compare_prefix_date
Returns: integer

Function: gin_compare_prefix_float4
Returns: integer

Function: gin_compare_prefix_float8
Returns: integer

Function: gin_compare_prefix_inet
Returns: integer

Function: gin_compare_prefix_int2
Returns: integer

Function: gin_compare_prefix_int4
Returns: integer

Function: gin_compare_prefix_int8
Returns: integer

Function: gin_compare_prefix_interval
Returns: integer

Function: gin_compare_prefix_macaddr
Returns: integer

Function: gin_compare_prefix_macaddr8
Returns: integer

Function: gin_compare_prefix_money
Returns: integer

Function: gin_compare_prefix_name
Returns: integer

Function: gin_compare_prefix_numeric
Returns: integer

Function: gin_compare_prefix_oid
Returns: integer

Function: gin_compare_prefix_text
Returns: integer

Function: gin_compare_prefix_time
Returns: integer

Function: gin_compare_prefix_timestamp
Returns: integer

Function: gin_compare_prefix_timestamptz
Returns: integer

Function: gin_compare_prefix_timetz
Returns: integer

Function: gin_compare_prefix_uuid
Returns: integer

Function: gin_compare_prefix_varbit
Returns: integer

Function: gin_enum_cmp
Returns: integer

Function: gin_extract_query_anyenum
Returns: internal

Function: gin_extract_query_bit
Returns: internal

Function: gin_extract_query_bool
Returns: internal

Function: gin_extract_query_bpchar
Returns: internal

Function: gin_extract_query_bytea
Returns: internal

Function: gin_extract_query_char
Returns: internal

Function: gin_extract_query_cidr
Returns: internal

Function: gin_extract_query_date
Returns: internal

Function: gin_extract_query_float4
Returns: internal

Function: gin_extract_query_float8
Returns: internal

Function: gin_extract_query_inet
Returns: internal

Function: gin_extract_query_int2
Returns: internal

Function: gin_extract_query_int4
Returns: internal

Function: gin_extract_query_int8
Returns: internal

Function: gin_extract_query_interval
Returns: internal

Function: gin_extract_query_macaddr
Returns: internal

Function: gin_extract_query_macaddr8
Returns: internal

Function: gin_extract_query_money
Returns: internal

Function: gin_extract_query_name
Returns: internal

Function: gin_extract_query_numeric
Returns: internal

Function: gin_extract_query_oid
Returns: internal

Function: gin_extract_query_text
Returns: internal

Function: gin_extract_query_time
Returns: internal

Function: gin_extract_query_timestamp
Returns: internal

Function: gin_extract_query_timestamptz
Returns: internal

Function: gin_extract_query_timetz
Returns: internal

Function: gin_extract_query_trgm
Returns: internal

Function: gin_extract_query_uuid
Returns: internal

Function: gin_extract_query_varbit
Returns: internal

Function: gin_extract_value_anyenum
Returns: internal

Function: gin_extract_value_bit
Returns: internal

Function: gin_extract_value_bool
Returns: internal

Function: gin_extract_value_bpchar
Returns: internal

Function: gin_extract_value_bytea
Returns: internal

Function: gin_extract_value_char
Returns: internal

Function: gin_extract_value_cidr
Returns: internal

Function: gin_extract_value_date
Returns: internal

Function: gin_extract_value_float4
Returns: internal

Function: gin_extract_value_float8
Returns: internal

Function: gin_extract_value_inet
Returns: internal

Function: gin_extract_value_int2
Returns: internal

Function: gin_extract_value_int4
Returns: internal

Function: gin_extract_value_int8
Returns: internal

Function: gin_extract_value_interval
Returns: internal

Function: gin_extract_value_macaddr
Returns: internal

Function: gin_extract_value_macaddr8
Returns: internal

Function: gin_extract_value_money
Returns: internal

Function: gin_extract_value_name
Returns: internal

Function: gin_extract_value_numeric
Returns: internal

Function: gin_extract_value_oid
Returns: internal

Function: gin_extract_value_text
Returns: internal

Function: gin_extract_value_time
Returns: internal

Function: gin_extract_value_timestamp
Returns: internal

Function: gin_extract_value_timestamptz
Returns: internal

Function: gin_extract_value_timetz
Returns: internal

Function: gin_extract_value_trgm
Returns: internal

Function: gin_extract_value_uuid
Returns: internal

Function: gin_extract_value_varbit
Returns: internal

Function: gin_numeric_cmp
Returns: integer

Function: gin_trgm_consistent
Returns: boolean

Function: gin_trgm_triconsistent
Returns: "char"

Function: gtrgm_compress
Returns: internal

Function: gtrgm_consistent
Returns: boolean

Function: gtrgm_decompress
Returns: internal

Function: gtrgm_distance
Returns: double precision

Function: gtrgm_in
Returns: USER-DEFINED

Function: gtrgm_options
Returns: void

Function: gtrgm_out
Returns: cstring

Function: gtrgm_penalty
Returns: internal

Function: gtrgm_picksplit
Returns: internal

Function: gtrgm_same
Returns: internal

Function: gtrgm_union
Returns: USER-DEFINED

Function: halfvec
Returns: USER-DEFINED

Function: halfvec_accum
Returns: ARRAY

Function: halfvec_add
Returns: USER-DEFINED

Function: halfvec_avg
Returns: USER-DEFINED

Function: halfvec_cmp
Returns: integer

Function: halfvec_combine
Returns: ARRAY

Function: halfvec_concat
Returns: USER-DEFINED

Function: halfvec_eq
Returns: boolean

Function: halfvec_ge
Returns: boolean

Function: halfvec_gt
Returns: boolean

Function: halfvec_in
Returns: USER-DEFINED

Function: halfvec_l2_squared_distance
Returns: double precision

Function: halfvec_le
Returns: boolean

Function: halfvec_lt
Returns: boolean

Function: halfvec_mul
Returns: USER-DEFINED

Function: halfvec_ne
Returns: boolean

Function: halfvec_negative_inner_product
Returns: double precision

Function: halfvec_out
Returns: cstring

Function: halfvec_recv
Returns: USER-DEFINED

Function: halfvec_send
Returns: bytea

Function: halfvec_spherical_distance
Returns: double precision

Function: halfvec_sub
Returns: USER-DEFINED

Function: halfvec_to_float4
Returns: ARRAY

Function: halfvec_to_sparsevec
Returns: USER-DEFINED

Function: halfvec_to_vector
Returns: USER-DEFINED

Function: halfvec_typmod_in
Returns: integer

Function: hamming_distance
Returns: double precision

Function: hnsw_bit_support
Returns: internal

Function: hnsw_halfvec_support
Returns: internal

Function: hnsw_sparsevec_support
Returns: internal

Function: hnswhandler
Returns: index_am_handler

Function: hold_appointment_slot
Returns: record

Function: increment_retry_count
Returns: trigger

Function: inner_product
Returns: double precision

Function: inner_product
Returns: double precision

Function: inner_product
Returns: double precision

Function: is_appointment_date_blocked
Returns: boolean

Function: ivfflat_bit_support
Returns: internal

Function: ivfflat_halfvec_support
Returns: internal

Function: ivfflathandler
Returns: index_am_handler

Function: jaccard_distance
Returns: double precision

Function: l1_distance
Returns: double precision

Function: l1_distance
Returns: double precision

Function: l1_distance
Returns: double precision

Function: l2_distance
Returns: double precision

Function: l2_distance
Returns: double precision

Function: l2_distance
Returns: double precision

Function: l2_norm
Returns: double precision

Function: l2_norm
Returns: double precision

Function: l2_normalize
Returns: USER-DEFINED

Function: l2_normalize
Returns: USER-DEFINED

Function: l2_normalize
Returns: USER-DEFINED

Function: lock_payment_for_agent
Returns: jsonb

Function: log_gemini_processing
Returns: uuid

Function: log_notification
Returns: uuid

Function: mark_verification_result
Returns: void

Function: prepare_service_text_for_embedding
Returns: text

Function: process_verificacion_funcionario
Returns: jsonb

Function: queue_verification
Returns: uuid

Function: refresh_agent_performance
Returns: void

Function: refresh_all_treasury_views
Returns: void

Function: refresh_reconciliation_stats
Returns: void

Function: refresh_treasury_kpis
Returns: void

Function: release_expired_appointment_holds
Returns: integer

Function: search_fiscal_services_semantic
Returns: record

Function: set_limit
Returns: real

Function: show_limit
Returns: real

Function: show_trgm
Returns: ARRAY

Function: similarity
Returns: real

Function: similarity_dist
Returns: real

Function: similarity_op
Returns: boolean

Function: sparsevec
Returns: USER-DEFINED

Function: sparsevec_cmp
Returns: integer

Function: sparsevec_eq
Returns: boolean

Function: sparsevec_ge
Returns: boolean

Function: sparsevec_gt
Returns: boolean

Function: sparsevec_in
Returns: USER-DEFINED

Function: sparsevec_l2_squared_distance
Returns: double precision

Function: sparsevec_le
Returns: boolean

Function: sparsevec_lt
Returns: boolean

Function: sparsevec_ne
Returns: boolean

Function: sparsevec_negative_inner_product
Returns: double precision

Function: sparsevec_out
Returns: cstring

Function: sparsevec_recv
Returns: USER-DEFINED

Function: sparsevec_send
Returns: bytea

Function: sparsevec_to_halfvec
Returns: USER-DEFINED

Function: sparsevec_to_vector
Returns: USER-DEFINED

Function: sparsevec_typmod_in
Returns: integer

Function: strict_word_similarity
Returns: real

Function: strict_word_similarity_commutator_op
Returns: boolean

Function: strict_word_similarity_dist_commutator_op
Returns: real

Function: strict_word_similarity_dist_op
Returns: real

Function: strict_word_similarity_op
Returns: boolean

Function: submit_without_appointment
Returns: record

Function: subvector
Returns: USER-DEFINED

Function: subvector
Returns: USER-DEFINED

Function: sum
Returns: USER-DEFINED

Function: sum
Returns: USER-DEFINED

Function: trigger_create_ocr_queue
Returns: trigger

Function: trigger_generate_installments
Returns: trigger

Function: trigger_log_amount_adjustment_generic
Returns: trigger

Function: trigger_log_amount_adjustment_irpf
Returns: trigger

Function: trigger_log_amount_adjustment_iva
Returns: trigger

Function: trigger_log_amount_adjustment_petro
Returns: trigger

Function: trigger_set_updated_at
Returns: trigger

Function: unlock_payment_by_agent
Returns: jsonb

Function: update_anomaly_timestamp
Returns: trigger

Function: update_appointment_reservations_updated_at
Returns: trigger

Function: update_capacity_percentage
Returns: trigger

Function: update_dvc_updated_at
Returns: trigger

Function: update_entity_location_timestamp
Returns: trigger

Function: update_export_timestamp
Returns: trigger

Function: update_fiscal_service_data_updated_at
Returns: trigger

Function: update_notification_status
Returns: boolean

Function: update_refresh_tokens_updated_at
Returns: trigger

Function: update_service_request_updated_at
Returns: trigger

Function: update_sessions_updated_at
Returns: trigger

Function: update_sla_status
Returns: trigger

Function: update_support_ticket_updated_at
Returns: trigger

Function: update_tariff_updated_at
Returns: trigger

Function: update_translations_updated_at
Returns: trigger

Function: update_updated_at_column
Returns: trigger

Function: update_verificacion_funcionario_updated_at
Returns: trigger

Function: update_verified_identifiers_updated_at
Returns: trigger

Function: update_wdr_updated_at
Returns: trigger

Function: update_workflows_updated_at
Returns: trigger

Function: upsert_verified_identifier
Returns: record

Function: validate_agent_assignment
Returns: trigger

Function: validate_fiscal_service_montants
Returns: trigger

Function: validate_workflow_documents
Returns: jsonb

Function: vector
Returns: USER-DEFINED

Function: vector_accum
Returns: ARRAY

Function: vector_add
Returns: USER-DEFINED

Function: vector_avg
Returns: USER-DEFINED

Function: vector_cmp
Returns: integer

Function: vector_combine
Returns: ARRAY

Function: vector_concat
Returns: USER-DEFINED

Function: vector_dims
Returns: integer

Function: vector_dims
Returns: integer

Function: vector_eq
Returns: boolean

Function: vector_ge
Returns: boolean

Function: vector_gt
Returns: boolean

Function: vector_in
Returns: USER-DEFINED

Function: vector_l2_squared_distance
Returns: double precision

Function: vector_le
Returns: boolean

Function: vector_lt
Returns: boolean

Function: vector_mul
Returns: USER-DEFINED

Function: vector_ne
Returns: boolean

Function: vector_negative_inner_product
Returns: double precision

Function: vector_norm
Returns: double precision

Function: vector_out
Returns: cstring

Function: vector_recv
Returns: USER-DEFINED

Function: vector_send
Returns: bytea

Function: vector_spherical_distance
Returns: double precision

Function: vector_sub
Returns: USER-DEFINED

Function: vector_to_float4
Returns: ARRAY

Function: vector_to_halfvec
Returns: USER-DEFINED

Function: vector_to_sparsevec
Returns: USER-DEFINED

Function: vector_typmod_in
Returns: integer

Function: word_similarity
Returns: real

Function: word_similarity_commutator_op
Returns: boolean

Function: word_similarity_dist_commutator_op
Returns: real

Function: word_similarity_dist_op
Returns: real

Function: word_similarity_op
Returns: boolean

====================================================================================================
6. TABLE RELATIONSHIPS SUMMARY
====================================================================================================

agent_performance_stats.agent_profile_id → agent_profiles.id
agent_profiles.assigned_by → users.id
agent_profiles.backup_for_profile_id → agent_profiles.id
agent_profiles.deactivated_by → users.id
agent_profiles.entity_id → entities.id
agent_profiles.ministry_id → ministries.id
agent_profiles.user_id → users.id
agent_work_queue.assigned_to → users.id
agent_work_queue.completed_by → users.id
agent_work_queue.escalated_by → users.id
agent_work_queue.ministry_id → ministries.id
agent_workloads.agent_profile_id → agent_profiles.id
anomaly_actions.anomaly_id → payment_anomalies.id
anomaly_actions.performed_by → users.id
appointment_blocked_dates.created_by → users.id
appointment_delay_rules.created_by → users.id
appointment_delay_rules.workflow_code → workflows.code
appointment_holds.entity_location_id → entity_locations.id
appointment_holds.service_request_id → service_requests.id
appointment_holds.slot_config_id → appointment_slot_configs.id
appointment_reservations.cancelled_by → users.id
appointment_reservations.completed_by → users.id
appointment_reservations.entity_location_id → entity_locations.id
appointment_reservations.rescheduled_from → appointment_reservations.id
appointment_reservations.service_request_id → service_requests.id
appointment_slot_configs.created_by → users.id
appointment_slot_configs.entity_location_id → entity_locations.id
assignment_rules.created_by → users.id
assignment_rules.updated_by → users.id
assignments.agent_profile_id → agent_profiles.id
assignments.assigned_by_profile_id → agent_profiles.id
assignments.reassigned_to_profile_id → agent_profiles.id
assignments.rule_applied_id → assignment_rules.id
audit_logs.user_id → users.id
bank_transactions.payment_id → payments.id
bank_transactions.reconciled_by → users.id
calculation_history.fiscal_service_code → fiscal_services.service_code
calculation_history.user_id → users.id
categories.ministry_id → ministries.id
categories.sector_id → sectors.id
cities.created_by → users.id
cities.updated_by → users.id
communication_provider_settings.created_by → users.id
communication_provider_settings.updated_by → users.id
companies.primary_sector_id → sectors.id
declaration_amount_adjustments.adjusted_by → users.id
declaration_amount_adjustments.adjustment_reason_id → adjustment_reasons.id
declaration_amount_adjustments.approved_by → users.id
declaration_amount_adjustments.tax_declaration_id → tax_declarations.id
declaration_corrections.approved_by → users.id
declaration_corrections.original_declaration_id → tax_declarations.id
declaration_corrections.rectificative_declaration_id → tax_declarations.id
declaration_irpf_data.adjusted_by → users.id
declaration_irpf_data.adjustment_reason_id → adjustment_reasons.id
declaration_irpf_data.tax_declaration_id → tax_declarations.id
declaration_iva_details.adjusted_by → users.id
declaration_iva_details.adjustment_reason_id → adjustment_reasons.id
declaration_iva_details.tax_declaration_id → tax_declarations.id
declaration_other_details.adjusted_by → users.id
declaration_other_details.adjustment_reason_id → adjustment_reasons.id
declaration_other_details.form_template_id → form_templates.id
declaration_other_details.tax_declaration_id → tax_declarations.id
declaration_petroliferos_details.adjusted_by → users.id
declaration_petroliferos_details.adjustment_reason_id → adjustment_reasons.id
declaration_petroliferos_details.tax_declaration_id → tax_declarations.id
declaration_retencion_details.tax_declaration_id → tax_declarations.id
document_processing_queue.form_template_id → form_templates.id
document_processing_queue.uploaded_file_id → uploaded_files.id
email_templates.created_by → users.id
email_templates.updated_by → users.id
entities.created_by → users.id
entities.ministry_id → ministries.id
entities.parent_entity_id → entities.id
entities.updated_by → users.id
entity_locations.city_id → cities.id
entity_locations.created_by → users.id
entity_locations.entity_id → entities.id
entity_locations.updated_by → users.id
fiscal_service_data.fiscal_service_id → fiscal_services.id
fiscal_service_data.ocr_extraction_id → ocr_extraction_results.id
fiscal_service_data.payment_id → payments.id
fiscal_service_data.reviewed_by → users.id
fiscal_service_data.uploaded_file_id → uploaded_files.id
fiscal_service_data.user_id → users.id
fiscal_services.category_id → categories.id
fiscal_services.parent_service_id → fiscal_services.id
form_templates.fiscal_service_id → fiscal_services.id
gemini_processing_logs.document_id → service_request_documents.id
gemini_processing_logs.service_request_id → service_requests.id
gemini_processing_logs.user_id → users.id
import_batch_items.batch_id → import_batches.id
import_batches.uploaded_by → users.id
ministry_validation_config.created_by → users.id
ministry_validation_config.ministry_id → ministries.id
ministry_validation_config.updated_by → users.id
notification_log.service_request_id → service_requests.id
notification_log.user_id → users.id
notification_templates.created_by → users.id
ocr_extraction_results.uploaded_file_id → uploaded_files.id
ocr_extraction_results.validated_by → users.id
payment_anomalies.resolved_by → users.id
payment_anomalies.service_request_id → service_requests.id
payment_installments.payment_plan_id → payment_plans.id
payment_lock_history.agent_profile_id → agent_profiles.id
payment_lock_history.payment_id → service_payments.id
payment_plans.approved_by → users.id
payment_plans.tax_declaration_id → tax_declarations.id
payment_receipts.generated_by → users.id
payment_receipts.payment_id → payments.id
payment_validation_audit.agent_profile_id → agent_profiles.id
payment_validation_audit.agent_user_id → users.id
payment_validation_audit.payment_id → service_payments.id
payments.bank_transaction_id → bank_transactions.id
payments.fiscal_service_id → fiscal_services.id
payments.installment_id → payment_installments.id
payments.payment_plan_id → payment_plans.id
payments.tax_declaration_id → tax_declarations.id
payments.user_id → users.id
permission_audit_log.changed_by → users.id
permission_audit_log.permission_id → permissions.id
permission_audit_log.user_id → users.id
procedure_template_steps.template_id → procedure_templates.id
push_templates.created_by → users.id
refresh_tokens.session_id → sessions.id
refresh_tokens.user_id → users.id
role_permissions.created_by → users.id
role_permissions.permission_id → permissions.id
role_permissions.role_id → roles.id
roles.created_by → users.id
sectors.ministry_id → ministries.id
service_document_assignments.document_template_id → document_templates.id
service_document_assignments.fiscal_service_id → fiscal_services.id
service_keywords.fiscal_service_id → fiscal_services.id
service_payments.assigned_agent_profile_id → agent_profiles.id
service_payments.company_id → companies.id
service_payments.escalated_to_agent_profile_id → agent_profiles.id
service_payments.locked_by_agent_profile_id → agent_profiles.id
service_payments.service_request_id → service_requests.id
service_payments.user_id → users.id
service_payments.validated_by_agent_profile_id → agent_profiles.id
service_procedure_assignments.fiscal_service_id → fiscal_services.id
service_procedure_assignments.template_id → procedure_templates.id
service_request_documents.service_request_id → service_requests.id
service_request_documents.uploaded_by → users.id
service_request_documents.validated_by → users.id
service_request_history.performed_by → users.id
service_request_history.service_request_id → service_requests.id
service_requests.assigned_to → users.id
service_requests.created_by → users.id
service_requests.entity_location_id → entity_locations.id
service_requests.fiscal_service_id → fiscal_services.id
service_requests.user_id → users.id
sessions.user_id → users.id
sms_templates.created_by → users.id
sms_templates.updated_by → users.id
support_attachments.message_id → support_messages.id
support_messages.sender_id → users.id
support_messages.ticket_id → support_tickets.id
support_tickets.assigned_to → users.id
support_tickets.category_id → support_categories.id
support_tickets.created_by → users.id
system_rules.created_by → users.id
tariff_supplements.created_by → users.id
tariff_supplements.updated_by → users.id
tax_declarations.company_id → companies.id
tax_declarations.original_declaration_id → tax_declarations.id
tax_declarations.processed_by → users.id
tax_declarations.user_id → users.id
translations.created_by → users.id
translations.updated_by → users.id
treasury_exports.downloaded_by → users.id
treasury_exports.requested_by → users.id
uploaded_files.payment_id → payments.id
uploaded_files.tax_declaration_id → tax_declarations.id
uploaded_files.user_id → users.id
user_company_roles.company_id → companies.id
user_company_roles.user_id → users.id
user_favorites.fiscal_service_code → fiscal_services.service_code
user_favorites.user_id → users.id
user_permissions.granted_by → users.id
user_permissions.permission_id → permissions.id
user_permissions.user_id → users.id
users.funcionario_verified_by → users.id
users.role_id → roles.id
users.supervisor_id → users.id
ussd_configurations.created_by → users.id
verificacion_fraud_log.user_id → users.id
verificacion_funcionario.processed_by → users.id
verificacion_funcionario.user_id → users.id
verification_queue.service_request_id → service_requests.id
verified_identifiers.user_id → users.id
verified_identifiers.verified_by → users.id
verified_identifiers_audit.performed_by → users.id
webhook_configurations.created_by → users.id
webhook_logs.webhook_id → webhook_configurations.id
workflow_document_requirements.created_by → users.id
workflow_document_requirements.document_template_id → document_templates.id
workflow_supplement_config.supplement_code → tariff_supplements.code
workflow_tariffs.created_by → users.id
workflow_tariffs.updated_by → users.id
workflows.created_by → users.id
workflows.updated_by → users.id