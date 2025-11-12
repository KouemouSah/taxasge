
====================================================================================================
TAXASGE DATABASE SCHEMA - COMPLETE REFERENCE
====================================================================================================

Extracted on: 2025-11-12 02:26:17
Database: Supabase PostgreSQL
Project: taxasge-dev

====================================================================================================
1. ALL TABLES IN PUBLIC SCHEMA
====================================================================================================

  - adjustment_reasons                       Catalogue des raisons prédéfinies pour ajustements de montants
  - agent_performance_stats                  No description
  - audit_logs                               No description
  - bank_configurations                      Configuration des intégrations bancaires (API, webhooks, comptes)
  - bank_transactions                        Transactions bancaires reçues des banques (webhooks ou réconciliation manuelle)
  - calculation_history                      No description
  - categories                               No description
  - companies                                No description
  - declaration_amount_adjustments           Audit trail de tous les ajustements de montants (historique complet)
  - declaration_corrections                  Audit trail des corrections apportées aux déclarations (rectificatives)
  - declaration_data_generic                 NIVEAU 2 - Données JSONB génériques pour 7 autres types de déclarations (<1% volume)
  - declaration_irpf_data                    NIVEAU 1 - Données structurées IRPF (5% volume) - Impôt sur le Revenu
  - declaration_iva_data                     NIVEAU 1 - Données structurées IVA (90% volume) - Après validation OCR Tesseract ou saisie manuelle
  - declaration_petroliferos_data            NIVEAU 1 - Données structurées Pétrolifères (4% volume, GROS MONTANTS) - 6 sous-types
  - document_templates                       Templates documents - Avec validity_duration_months (v4.1 fix)
  - document_templates_backup_20251017       No description
  - entity_translations                      Traductions optimisées - ENUM strict + codes courts (-40%% storage)
  - fiscal_service_data                      NIVEAU 3 - Données fiscal services avec support OCR Tesseract (ex: Nota de Ingreso)
  - fiscal_services                          Services fiscaux - NO instructions_es denormalization (v4.1 user feedback)
  - form_templates                           Templates de formulaires pour extraction OCR Tesseract (coordonnées des champs) - 14 types total
  - import_batch_items                       Lignes individuelles d'un import Excel (une ligne = une ligne du fichier)
  - import_batches                           Métadonnées des imports Excel en masse (un fichier = un batch)
  - ministries                               Ministères - Espagnol en DB, FR/EN via entity_translations optimisée
  - ministry_agents                          Agents ministériels - Workflow complet validation
  - ministry_validation_config               No description
  - ocr_extraction_results                   Résultats bruts de l'extraction OCR Tesseract (JSONB temporaire avant validation)
  - payment_installments                     Acomptes individuels d'un plan de paiement
  - payment_lock_history                     No description
  - payment_plans                            Plans de paiement (échéanciers) pour les déclarations fiscales
  - payment_receipts                         Reçus de paiement générés au format PDF
  - payment_validation_audit                 No description
  - payments                                 Table centrale polymorphe pour TOUS les paiements (services fiscaux et déclarations)
  - pending_registrations                    Stores email verification codes. Expires after 15 minutes. Minimal by design.
  - procedure_template_steps                 No description
  - procedure_template_steps_backup_20251017 No description
  - procedure_templates                      Templates procédures - Architecture radicale 58.7%% économie
  - refresh_tokens                           Refresh tokens for JWT authentication with revocation support
  - sectors                                  No description
  - service_document_assignments             No description
  - service_keywords                         No description
  - service_payments                         Paiements avec workflow agents - Verrouillage pessimiste
  - service_procedure_assignments            No description
  - service_procedure_assignments_backup_20251017 No description
  - sessions                                 User authentication sessions with JWT tokens
  - steps_count                              No description
  - system_rules                             Configuration dynamique des règles métier (sans redéploiement)
  - tax_declarations                         Déclarations fiscales - 20 types GE-specific
  - translations                             Table unifiée pour toutes les traductions du système (ENUMs, UI, Forms, Messages système)
  - uploaded_files                           Métadonnées des fichiers uploadés (stockés dans Supabase Storage)
  - user_company_roles                       No description
  - user_favorites                           No description
  - user_ministry_assignments                No description
  - users                                    No description
  - workflow_transitions                     No description

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

escalation_level:
  - low
  - medium
  - high
  - critical

ocr_engine_enum:
  - tesseract
  - manual

payment_method_enum:
  - bank_transfer
  - card
  - mobile_money
  - cash
  - bange_wallet

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

user_role_enum:
  - citizen
  - business
  - accountant
  - admin
  - dgi_agent
  - ministry_agent

user_status_enum:
  - active
  - suspended
  - pending_verification
  - deactivated

====================================================================================================
3. DETAILED TABLE SCHEMAS
====================================================================================================


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

Primary Key: agent_id

Foreign Keys:
  - agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

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
Table: DECLARATION_DATA_GENERIC
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
form_template_id                    uuid                      YES                                      
declaration_subtype                 varchar(100)              NO                                       
  └─ Description: Type: iva_destajo, cuota_min_comun, sueldos_petrolero, sueldos_comun, residentes_comun_10, impreso_comun, impreso_liquidacion
data                                jsonb                     NO                                       
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
  - declaration_data_generic_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_data_generic_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_data_generic_tax_declaration_id_key ON public.declaration_data_generic USING btree (tax_declaration_id)
  - idx_declaration_data_generic_tax_declaration_id
    CREATE INDEX idx_declaration_data_generic_tax_declaration_id ON public.declaration_data_generic USING btree (tax_declaration_id)
  - idx_declaration_data_generic_subtype
    CREATE INDEX idx_declaration_data_generic_subtype ON public.declaration_data_generic USING btree (declaration_subtype)

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
Table: DECLARATION_IVA_DATA
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  uuid                      NO         gen_random_uuid()             
tax_declaration_id                  uuid                      NO                                       
iva_dev_01_base                     numeric                   YES        0                             
iva_dev_02_tipo                     numeric                   YES        15.00                         
iva_dev_03_cuota                    numeric                   YES                                      
iva_dev_04_base                     numeric                   YES        0                             
iva_dev_05_tipo                     numeric                   YES        6.00                          
iva_dev_06_cuota                    numeric                   YES                                      
iva_dev_07_base                     numeric                   YES        0                             
iva_dev_08_tipo                     numeric                   YES        1.50                          
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

Primary Key: id

Foreign Keys:
  - adjusted_by → users.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - adjustment_reason_id → adjustment_reasons.id (ON UPDATE NO ACTION, ON DELETE SET NULL)
  - tax_declaration_id → tax_declarations.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - declaration_iva_data_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_iva_data_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_iva_data_tax_declaration_id_key ON public.declaration_iva_data USING btree (tax_declaration_id)
  - idx_declaration_iva_data_tax_declaration_id
    CREATE INDEX idx_declaration_iva_data_tax_declaration_id ON public.declaration_iva_data USING btree (tax_declaration_id)

----------------------------------------------------------------------------------------------------
Table: DECLARATION_PETROLIFEROS_DATA
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
  - declaration_petroliferos_data_tax_declaration_id_key: (tax_declaration_id)

Indexes:
  - declaration_petroliferos_data_tax_declaration_id_key
    CREATE UNIQUE INDEX declaration_petroliferos_data_tax_declaration_id_key ON public.declaration_petroliferos_data USING btree (tax_declaration_id)
  - idx_declaration_petroliferos_data_tax_declaration_id
    CREATE INDEX idx_declaration_petroliferos_data_tax_declaration_id ON public.declaration_petroliferos_data USING btree (tax_declaration_id)
  - idx_declaration_petroliferos_data_subtype
    CREATE INDEX idx_declaration_petroliferos_data_subtype ON public.declaration_petroliferos_data USING btree (petroleum_declaration_subtype)

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
Table: MINISTRY_AGENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
id                                  integer                   NO         nextval('ministry_agents_id_se
user_id                             uuid                      NO                                       
ministry_id                         integer                   NO                                       
agent_role                          varchar(50)               NO         'validator'::character varying
can_approve_unlimited               boolean                   YES        false                         
max_approval_amount                 numeric                   YES                                      
can_escalate                        boolean                   YES        true                          
can_assign_tasks                    boolean                   YES        false                         
is_active                           boolean                   YES        true                          
is_backup_agent                     boolean                   YES        false                         
backup_for_agent_id                 integer                   YES                                      
working_hours_start                 time without time zone    YES        '08:00:00'::time without time 
working_hours_end                   time without time zone    YES        '17:00:00'::time without time 
working_days                        ARRAY                     YES        ARRAY[1, 2, 3, 4, 5]          
assigned_at                         timestamp with time zone  YES        now()                         
assigned_by                         uuid                      YES                                      
deactivated_at                      timestamp with time zone  YES                                      
deactivated_by                      uuid                      YES                                      
deactivation_reason                 text                      YES                                      

Primary Key: id

Foreign Keys:
  - assigned_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - backup_for_agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - deactivated_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Unique Constraints:
  - ministry_agents_user_id_ministry_id_key: (user_id, ministry_id)

Indexes:
  - ministry_agents_user_id_ministry_id_key
    CREATE UNIQUE INDEX ministry_agents_user_id_ministry_id_key ON public.ministry_agents USING btree (user_id, ministry_id)
  - idx_ministry_agents_user
    CREATE INDEX idx_ministry_agents_user ON public.ministry_agents USING btree (user_id, is_active)
  - idx_ministry_agents_ministry
    CREATE INDEX idx_ministry_agents_ministry ON public.ministry_agents USING btree (ministry_id, is_active) WHERE (is_active = true)

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
locked_at                           timestamp with time zone  NO                                       
unlocked_at                         timestamp with time zone  YES                                      
lock_duration_minutes               integer                   YES                                      
unlock_reason                       varchar(50)               YES                                      
actions_performed                   jsonb                     YES        '[]'::jsonb                   
final_action                        agent_action_type         YES                                      

Primary Key: id

Foreign Keys:
  - agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - payment_id → service_payments.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

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

Primary Key: id

Foreign Keys:
  - agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - agent_user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - payment_id → service_payments.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_payment_audit_agent_date
    CREATE INDEX idx_payment_audit_agent_date ON public.payment_validation_audit USING btree (agent_id, created_at DESC)
  - idx_payment_audit_payment_action
    CREATE INDEX idx_payment_audit_payment_action ON public.payment_validation_audit USING btree (payment_id, action, created_at)

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
fiscal_service_code                 varchar(10)               NO                                       
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
locked_at                           timestamp with time zone  YES                                      
lock_expires_at                     timestamp with time zone  YES                                      
assigned_agent_id                   integer                   YES                                      
assigned_at                         timestamp with time zone  YES                                      
validated_by_agent_id               integer                   YES                                      
validated_at                        timestamp with time zone  YES                                      
validation_comment                  text                      YES                                      
validation_checklist_completed      jsonb                     YES        '{}'::jsonb                   
escalated_to_agent_id               integer                   YES                                      
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

Primary Key: id

Foreign Keys:
  - assigned_agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - company_id → companies.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - escalated_to_agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - fiscal_service_code → fiscal_services.service_code (ON UPDATE NO ACTION, ON DELETE RESTRICT)
  - locked_by_agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - validated_by_agent_id → ministry_agents.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)

Unique Constraints:
  - service_payments_bange_transaction_id_key: (bange_transaction_id)
  - service_payments_payment_reference_key: (payment_reference)
  - service_payments_receipt_number_key: (receipt_number)

Indexes:
  - service_payments_payment_reference_key
    CREATE UNIQUE INDEX service_payments_payment_reference_key ON public.service_payments USING btree (payment_reference)
  - service_payments_bange_transaction_id_key
    CREATE UNIQUE INDEX service_payments_bange_transaction_id_key ON public.service_payments USING btree (bange_transaction_id)
  - service_payments_receipt_number_key
    CREATE UNIQUE INDEX service_payments_receipt_number_key ON public.service_payments USING btree (receipt_number)
  - idx_service_payments_user
    CREATE INDEX idx_service_payments_user ON public.service_payments USING btree (user_id, status, created_at)
  - idx_service_payments_service_code
    CREATE INDEX idx_service_payments_service_code ON public.service_payments USING btree (fiscal_service_code, payment_type, status)
  - idx_service_payments_workflow_ministry
    CREATE INDEX idx_service_payments_workflow_ministry ON public.service_payments USING btree (ministry_id, workflow_status, sla_target_date)
  - idx_service_payments_locked_agent
    CREATE INDEX idx_service_payments_locked_agent ON public.service_payments USING btree (locked_by_agent_id, lock_expires_at) WHERE (locked_by_agent_id IS NOT NULL)
  - idx_service_payments_assigned_agent
    CREATE INDEX idx_service_payments_assigned_agent ON public.service_payments USING btree (assigned_agent_id, workflow_status) WHERE (assigned_agent_id IS NOT NULL)
  - idx_service_payments_expired_locks
    CREATE INDEX idx_service_payments_expired_locks ON public.service_payments USING btree (lock_expires_at) WHERE (locked_by_agent_id IS NOT NULL)

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
ip_address                          varchar(45)               YES                                      
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

Primary Key: id

Foreign Keys:
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
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

----------------------------------------------------------------------------------------------------
Table: STEPS_COUNT
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
count                               bigint                    YES                                      

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

----------------------------------------------------------------------------------------------------
Table: USER_COMPANY_ROLES
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
user_id                             uuid                      NO                                       
company_id                          uuid                      NO                                       
role                                varchar(50)               NO                                       
is_active                           boolean                   YES        true                          
assigned_at                         timestamp with time zone  YES        now()                         

Primary Key: user_id, company_id

Foreign Keys:
  - company_id → companies.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

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
Table: USER_MINISTRY_ASSIGNMENTS
----------------------------------------------------------------------------------------------------


Column                              Type                      Nullable   Default                       
----------------------------------------------------------------------------------------------------
user_id                             uuid                      NO                                       
ministry_id                         integer                   NO                                       
ministry_role                       varchar(50)               NO                                       
status                              varchar(20)               NO         'pending'::character varying  
approved_by                         uuid                      YES                                      
approved_at                         timestamp with time zone  YES                                      
assigned_at                         timestamp with time zone  NO         now()                         
assigned_by                         uuid                      NO                                       
revoked_at                          timestamp with time zone  YES                                      
revoked_by                          uuid                      YES                                      
revoked_reason                      text                      YES                                      

Primary Key: user_id, ministry_id

Foreign Keys:
  - approved_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - assigned_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - ministry_id → ministries.id (ON UPDATE NO ACTION, ON DELETE CASCADE)
  - revoked_by → users.id (ON UPDATE NO ACTION, ON DELETE NO ACTION)
  - user_id → users.id (ON UPDATE NO ACTION, ON DELETE CASCADE)

Indexes:
  - idx_ministry_assignments_user
    CREATE INDEX idx_ministry_assignments_user ON public.user_ministry_assignments USING btree (user_id, status)
  - idx_ministry_assignments_ministry
    CREATE INDEX idx_ministry_assignments_ministry ON public.user_ministry_assignments USING btree (ministry_id, status)
  - idx_ministry_assignments_pending
    CREATE INDEX idx_ministry_assignments_pending ON public.user_ministry_assignments USING btree (status, assigned_at) WHERE ((status)::text = 'pending'::text)

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

Primary Key: id

Unique Constraints:
  - users_email_key: (email)
  - users_matricule_key: (matricule)

Indexes:
  - users_email_key
    CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
  - users_matricule_key
    CREATE UNIQUE INDEX users_matricule_key ON public.users USING btree (matricule)
  - idx_users_email
    CREATE INDEX idx_users_email ON public.users USING btree (email) WHERE (status <> 'deactivated'::user_status_enum)
  - idx_users_role
    CREATE INDEX idx_users_role ON public.users USING btree (role) WHERE (status = 'active'::user_status_enum)
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

====================================================================================================
4. VIEWS
====================================================================================================


No views found in public schema

====================================================================================================
5. FUNCTIONS
====================================================================================================


Function: apply_late_fees_to_overdue_installments
Returns: void

Function: assign_document_template
Returns: boolean

Function: assign_procedure_template
Returns: boolean

Function: calculate_payment_ministry
Returns: trigger

Function: cleanup_expired_locks
Returns: integer

Function: generate_idempotency_key
Returns: character varying

Function: generate_payment_installments
Returns: void

Function: get_entity_translation
Returns: text

Function: get_rule_value
Returns: jsonb

Function: get_translation
Returns: text

Function: get_translation_unified
Returns: text

Function: get_translations
Returns: jsonb

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

Function: lock_payment_for_agent
Returns: jsonb

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

Function: update_refresh_tokens_updated_at
Returns: trigger

Function: update_sessions_updated_at
Returns: trigger

Function: update_translations_updated_at
Returns: trigger

Function: update_updated_at_column
Returns: trigger

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

agent_performance_stats.agent_id → ministry_agents.id
audit_logs.user_id → users.id
bank_transactions.payment_id → payments.id
bank_transactions.reconciled_by → users.id
calculation_history.fiscal_service_code → fiscal_services.service_code
calculation_history.user_id → users.id
categories.ministry_id → ministries.id
categories.sector_id → sectors.id
companies.primary_sector_id → sectors.id
declaration_amount_adjustments.adjusted_by → users.id
declaration_amount_adjustments.adjustment_reason_id → adjustment_reasons.id
declaration_amount_adjustments.approved_by → users.id
declaration_amount_adjustments.tax_declaration_id → tax_declarations.id
declaration_corrections.approved_by → users.id
declaration_corrections.original_declaration_id → tax_declarations.id
declaration_corrections.rectificative_declaration_id → tax_declarations.id
declaration_data_generic.adjusted_by → users.id
declaration_data_generic.adjustment_reason_id → adjustment_reasons.id
declaration_data_generic.form_template_id → form_templates.id
declaration_data_generic.tax_declaration_id → tax_declarations.id
declaration_irpf_data.adjusted_by → users.id
declaration_irpf_data.adjustment_reason_id → adjustment_reasons.id
declaration_irpf_data.tax_declaration_id → tax_declarations.id
declaration_iva_data.adjusted_by → users.id
declaration_iva_data.adjustment_reason_id → adjustment_reasons.id
declaration_iva_data.tax_declaration_id → tax_declarations.id
declaration_petroliferos_data.adjusted_by → users.id
declaration_petroliferos_data.adjustment_reason_id → adjustment_reasons.id
declaration_petroliferos_data.tax_declaration_id → tax_declarations.id
fiscal_service_data.fiscal_service_id → fiscal_services.id
fiscal_service_data.ocr_extraction_id → ocr_extraction_results.id
fiscal_service_data.payment_id → payments.id
fiscal_service_data.reviewed_by → users.id
fiscal_service_data.uploaded_file_id → uploaded_files.id
fiscal_service_data.user_id → users.id
fiscal_services.category_id → categories.id
fiscal_services.parent_service_id → fiscal_services.id
form_templates.fiscal_service_id → fiscal_services.id
import_batch_items.batch_id → import_batches.id
import_batches.uploaded_by → users.id
ministry_agents.assigned_by → users.id
ministry_agents.backup_for_agent_id → ministry_agents.id
ministry_agents.deactivated_by → users.id
ministry_agents.ministry_id → ministries.id
ministry_agents.user_id → users.id
ministry_validation_config.created_by → users.id
ministry_validation_config.ministry_id → ministries.id
ministry_validation_config.updated_by → users.id
ocr_extraction_results.uploaded_file_id → uploaded_files.id
ocr_extraction_results.validated_by → users.id
payment_installments.payment_plan_id → payment_plans.id
payment_lock_history.agent_id → ministry_agents.id
payment_lock_history.payment_id → service_payments.id
payment_plans.approved_by → users.id
payment_plans.tax_declaration_id → tax_declarations.id
payment_receipts.generated_by → users.id
payment_receipts.payment_id → payments.id
payment_validation_audit.agent_id → ministry_agents.id
payment_validation_audit.agent_user_id → users.id
payment_validation_audit.payment_id → service_payments.id
payments.bank_transaction_id → bank_transactions.id
payments.fiscal_service_id → fiscal_services.id
payments.installment_id → payment_installments.id
payments.payment_plan_id → payment_plans.id
payments.tax_declaration_id → tax_declarations.id
payments.user_id → users.id
procedure_template_steps.template_id → procedure_templates.id
refresh_tokens.session_id → sessions.id
refresh_tokens.user_id → users.id
sectors.ministry_id → ministries.id
service_document_assignments.document_template_id → document_templates.id
service_document_assignments.fiscal_service_id → fiscal_services.id
service_keywords.fiscal_service_id → fiscal_services.id
service_payments.assigned_agent_id → ministry_agents.id
service_payments.company_id → companies.id
service_payments.escalated_to_agent_id → ministry_agents.id
service_payments.fiscal_service_code → fiscal_services.service_code
service_payments.locked_by_agent_id → ministry_agents.id
service_payments.user_id → users.id
service_payments.validated_by_agent_id → ministry_agents.id
service_procedure_assignments.fiscal_service_id → fiscal_services.id
service_procedure_assignments.template_id → procedure_templates.id
sessions.user_id → users.id
system_rules.created_by → users.id
tax_declarations.company_id → companies.id
tax_declarations.original_declaration_id → tax_declarations.id
tax_declarations.processed_by → users.id
tax_declarations.user_id → users.id
translations.created_by → users.id
translations.updated_by → users.id
uploaded_files.payment_id → payments.id
uploaded_files.tax_declaration_id → tax_declarations.id
uploaded_files.user_id → users.id
user_company_roles.company_id → companies.id
user_company_roles.user_id → users.id
user_favorites.fiscal_service_code → fiscal_services.service_code
user_favorites.user_id → users.id
user_ministry_assignments.approved_by → users.id
user_ministry_assignments.assigned_by → users.id
user_ministry_assignments.ministry_id → ministries.id
user_ministry_assignments.revoked_by → users.id
user_ministry_assignments.user_id → users.id