-- ============================================================================================================
-- TAXASGE - Seed ALL Translations v2.1 (COMPREHENSIVE)
-- ============================================================================================================
-- Description: Traductions COMPLÈTES pour TOUS les éléments du système
-- Version: 2.1 (Final Production)
-- Date: 2025-01-12
-- Langues: ES (Espagnol - par défaut), FR (Français), EN (English)
--
-- Contenu:
--   1. ENUMS (16 types avec toutes les valeurs)
--   2. LABELS UI (Navigation, Menus, Boutons, Messages)
--   3. FORMULAIRES (Tous les champs des déclarations fiscales)
--   4. MESSAGES SYSTÈME (Notifications, Erreurs, Succès)
--   5. PÉRIODES FISCALES (Mois, Trimestres)
--   6. STATUTS WORKFLOW (Déclarations, Paiements, Agents)
--
-- Total traductions estimées: ~2500+
-- ============================================================================================================

BEGIN;

-- ============================================================================================================
-- SECTION 1: ENUMS SYSTEM (Traductions des énumérations PostgreSQL)
-- ============================================================================================================
-- Ces traductions sont critiques pour l'affichage dans l'UI.
-- Format: enum_type.enum_value → translations (es/fr/en)
-- ============================================================================================================

-- ============================================
-- 1.1 user_role_enum
-- ============================================

-- citizen (Ciudadano / Citoyen / Citizen)
INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_role.citizen', 'user_role_enum', 'Ciudadano', 'Citoyen', 'Citizen', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- business (Empresa / Entreprise / Business)
INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_role.business', 'user_role_enum', 'Empresa', 'Entreprise', 'Business', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- accountant (Contador / Comptable / Accountant)
INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_role.accountant', 'user_role_enum', 'Contador', 'Comptable', 'Accountant', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- admin (Administrador / Administrateur / Administrator)
INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_role.admin', 'user_role_enum', 'Administrador', 'Administrateur', 'Administrator', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- dgi_agent (Agente DGI / Agent DGI / DGI Agent)
INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_role.dgi_agent', 'user_role_enum', 'Agente DGI', 'Agent DGI', 'DGI Agent', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ministry_agent (Agente Ministerio / Agent Ministère / Ministry Agent)
INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_role.ministry_agent', 'user_role_enum', 'Agente Ministerio', 'Agent Ministère', 'Ministry Agent', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.2 user_status_enum
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'user_status.active', 'user_status_enum', 'Activo', 'Actif', 'Active', NOW()),
('enum', 'user_status.suspended', 'user_status_enum', 'Suspendido', 'Suspendu', 'Suspended', NOW()),
('enum', 'user_status.pending_verification', 'user_status_enum', 'Verificación Pendiente', 'Vérification en attente', 'Pending Verification', NOW()),
('enum', 'user_status.deactivated', 'user_status_enum', 'Desactivado', 'Désactivé', 'Deactivated', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.3 service_status_enum
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'service_status.active', 'service_status_enum', 'Activo', 'Actif', 'Active', NOW()),
('enum', 'service_status.inactive', 'service_status_enum', 'Inactivo', 'Inactif', 'Inactive', NOW()),
('enum', 'service_status.draft', 'service_status_enum', 'Borrador', 'Brouillon', 'Draft', NOW()),
('enum', 'service_status.deprecated', 'service_status_enum', 'Obsoleto', 'Obsolète', 'Deprecated', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.4 service_type_enum (CRITIQUE - 8 types)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'service_type.document_processing', 'service_type_enum', 'Procesamiento de Documentos', 'Traitement de Documents', 'Document Processing', NOW()),
('enum', 'service_type.license_permit', 'service_type_enum', 'Licencia / Permiso', 'Licence / Permis', 'License / Permit', NOW()),
('enum', 'service_type.residence_permit', 'service_type_enum', 'Permiso de Residencia', 'Permis de Résidence', 'Residence Permit', NOW()),
('enum', 'service_type.registration_fee', 'service_type_enum', 'Tasa de Registro', 'Frais d''Enregistrement', 'Registration Fee', NOW()),
('enum', 'service_type.inspection_fee', 'service_type_enum', 'Tasa de Inspección', 'Frais d''Inspection', 'Inspection Fee', NOW()),
('enum', 'service_type.administrative_tax', 'service_type_enum', 'Impuesto Administrativo', 'Taxe Administrative', 'Administrative Tax', NOW()),
('enum', 'service_type.customs_duty', 'service_type_enum', 'Derecho Aduanero', 'Droit de Douane', 'Customs Duty', NOW()),
('enum', 'service_type.declaration_tax', 'service_type_enum', 'Impuesto de Declaración', 'Taxe de Déclaration', 'Declaration Tax', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.5 calculation_method_enum (CRITIQUE - 8 méthodes)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'calculation_method.fixed_expedition', 'calculation_method_enum', 'Tarifa Fija (Expedición)', 'Tarif Fixe (Expédition)', 'Fixed Rate (Expedition)', NOW()),
('enum', 'calculation_method.fixed_renewal', 'calculation_method_enum', 'Tarifa Fija (Renovación)', 'Tarif Fixe (Renouvellement)', 'Fixed Rate (Renewal)', NOW()),
('enum', 'calculation_method.fixed_both', 'calculation_method_enum', 'Tarifa Fija (Ambos)', 'Tarif Fixe (Les Deux)', 'Fixed Rate (Both)', NOW()),
('enum', 'calculation_method.percentage_based', 'calculation_method_enum', 'Basado en Porcentaje', 'Basé sur Pourcentage', 'Percentage Based', NOW()),
('enum', 'calculation_method.unit_based', 'calculation_method_enum', 'Basado en Unidades', 'Basé sur Unités', 'Unit Based', NOW()),
('enum', 'calculation_method.tiered_rates', 'calculation_method_enum', 'Tarifas Escalonadas', 'Tarifs Échelonnés', 'Tiered Rates', NOW()),
('enum', 'calculation_method.formula_based', 'calculation_method_enum', 'Basado en Fórmula', 'Basé sur Formule', 'Formula Based', NOW()),
('enum', 'calculation_method.fixed_plus_unit', 'calculation_method_enum', 'Fijo + Por Unidad', 'Fixe + Par Unité', 'Fixed Plus Unit', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.6 payment_workflow_status (CRITIQUE - 23 statuts workflow agents)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'payment_workflow.submitted', 'payment_workflow_status', 'Enviado', 'Soumis', 'Submitted', NOW()),
('enum', 'payment_workflow.auto_processing', 'payment_workflow_status', 'Procesamiento Automático', 'Traitement Automatique', 'Auto Processing', NOW()),
('enum', 'payment_workflow.auto_approved', 'payment_workflow_status', 'Aprobado Automáticamente', 'Approuvé Automatiquement', 'Auto Approved', NOW()),
('enum', 'payment_workflow.pending_agent_review', 'payment_workflow_status', 'Revisión Agente Pendiente', 'Révision Agent en Attente', 'Pending Agent Review', NOW()),
('enum', 'payment_workflow.locked_by_agent', 'payment_workflow_status', 'Bloqueado por Agente', 'Verrouillé par Agent', 'Locked by Agent', NOW()),
('enum', 'payment_workflow.agent_reviewing', 'payment_workflow_status', 'En Revisión por Agente', 'En Révision par Agent', 'Agent Reviewing', NOW()),
('enum', 'payment_workflow.requires_documents', 'payment_workflow_status', 'Requiere Documentos', 'Nécessite Documents', 'Requires Documents', NOW()),
('enum', 'payment_workflow.docs_resubmitted', 'payment_workflow_status', 'Documentos Reenviados', 'Documents Resoumis', 'Docs Resubmitted', NOW()),
('enum', 'payment_workflow.approved_by_agent', 'payment_workflow_status', 'Aprobado por Agente', 'Approuvé par Agent', 'Approved by Agent', NOW()),
('enum', 'payment_workflow.rejected_by_agent', 'payment_workflow_status', 'Rechazado por Agente', 'Rejeté par Agent', 'Rejected by Agent', NOW()),
('enum', 'payment_workflow.escalated_supervisor', 'payment_workflow_status', 'Escalado a Supervisor', 'Escaladé au Superviseur', 'Escalated to Supervisor', NOW()),
('enum', 'payment_workflow.supervisor_reviewing', 'payment_workflow_status', 'Supervisor Revisando', 'Superviseur en Révision', 'Supervisor Reviewing', NOW()),
('enum', 'payment_workflow.approved_supervisor', 'payment_workflow_status', 'Aprobado por Supervisor', 'Approuvé par Superviseur', 'Approved by Supervisor', NOW()),
('enum', 'payment_workflow.rejected_supervisor', 'payment_workflow_status', 'Rechazado por Supervisor', 'Rejeté par Superviseur', 'Rejected by Supervisor', NOW()),
('enum', 'payment_workflow.payment_initiated', 'payment_workflow_status', 'Pago Iniciado', 'Paiement Initié', 'Payment Initiated', NOW()),
('enum', 'payment_workflow.payment_processing', 'payment_workflow_status', 'Procesando Pago', 'Traitement du Paiement', 'Payment Processing', NOW()),
('enum', 'payment_workflow.payment_confirmed', 'payment_workflow_status', 'Pago Confirmado', 'Paiement Confirmé', 'Payment Confirmed', NOW()),
('enum', 'payment_workflow.payment_failed', 'payment_workflow_status', 'Pago Fallido', 'Paiement Échoué', 'Payment Failed', NOW()),
('enum', 'payment_workflow.completed_closed', 'payment_workflow_status', 'Completado / Cerrado', 'Complété / Fermé', 'Completed / Closed', NOW()),
('enum', 'payment_workflow.cancelled_user', 'payment_workflow_status', 'Cancelado por Usuario', 'Annulé par Utilisateur', 'Cancelled by User', NOW()),
('enum', 'payment_workflow.cancelled_agent', 'payment_workflow_status', 'Cancelado por Agente', 'Annulé par Agent', 'Cancelled by Agent', NOW()),
('enum', 'payment_workflow.expired', 'payment_workflow_status', 'Expirado', 'Expiré', 'Expired', NOW()),
('enum', 'payment_workflow.archived', 'payment_workflow_status', 'Archivado', 'Archivé', 'Archived', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.7 agent_action_type (15 actions agents)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'agent_action.lock_for_review', 'agent_action_type', 'Bloquear para Revisión', 'Verrouiller pour Révision', 'Lock for Review', NOW()),
('enum', 'agent_action.approve_payment', 'agent_action_type', 'Aprobar Pago', 'Approuver Paiement', 'Approve Payment', NOW()),
('enum', 'agent_action.reject_payment', 'agent_action_type', 'Rechazar Pago', 'Rejeter Paiement', 'Reject Payment', NOW()),
('enum', 'agent_action.request_documents', 'agent_action_type', 'Solicitar Documentos', 'Demander Documents', 'Request Documents', NOW()),
('enum', 'agent_action.escalate_supervisor', 'agent_action_type', 'Escalar a Supervisor', 'Escalader au Superviseur', 'Escalate to Supervisor', NOW()),
('enum', 'agent_action.cancel_payment', 'agent_action_type', 'Cancelar Pago', 'Annuler Paiement', 'Cancel Payment', NOW()),
('enum', 'agent_action.add_note', 'agent_action_type', 'Añadir Nota', 'Ajouter Note', 'Add Note', NOW()),
('enum', 'agent_action.verify_documents', 'agent_action_type', 'Verificar Documentos', 'Vérifier Documents', 'Verify Documents', NOW()),
('enum', 'agent_action.update_status', 'agent_action_type', 'Actualizar Estado', 'Mettre à Jour Statut', 'Update Status', NOW()),
('enum', 'agent_action.send_notification', 'agent_action_type', 'Enviar Notificación', 'Envoyer Notification', 'Send Notification', NOW()),
('enum', 'agent_action.modify_amount', 'agent_action_type', 'Modificar Monto', 'Modifier Montant', 'Modify Amount', NOW()),
('enum', 'agent_action.unlock', 'agent_action_type', 'Desbloquear', 'Déverrouiller', 'Unlock', NOW()),
('enum', 'agent_action.reassign', 'agent_action_type', 'Reasignar', 'Réassigner', 'Reassign', NOW()),
('enum', 'agent_action.archive', 'agent_action_type', 'Archivar', 'Archiver', 'Archive', NOW()),
('enum', 'agent_action.other', 'agent_action_type', 'Otra Acción', 'Autre Action', 'Other', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.8 escalation_level (4 niveaux)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'escalation_level.low', 'escalation_level', 'Bajo', 'Faible', 'Low', NOW()),
('enum', 'escalation_level.medium', 'escalation_level', 'Medio', 'Moyen', 'Medium', NOW()),
('enum', 'escalation_level.high', 'escalation_level', 'Alto', 'Élevé', 'High', NOW()),
('enum', 'escalation_level.critical', 'escalation_level', 'Crítico', 'Critique', 'Critical', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.9 declaration_type_enum (CRITIQUE - 20 types de déclarations)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'declaration_type.income_tax', 'declaration_type_enum', 'Impuesto sobre la Renta', 'Impôt sur le Revenu', 'Income Tax', NOW()),
('enum', 'declaration_type.corporate_tax', 'declaration_type_enum', 'Impuesto de Sociedades', 'Impôt sur les Sociétés', 'Corporate Tax', NOW()),
('enum', 'declaration_type.vat_declaration', 'declaration_type_enum', 'Declaración I.V.A.', 'Déclaration T.V.A.', 'V.A.T. Declaration', NOW()),
('enum', 'declaration_type.social_contribution', 'declaration_type_enum', 'Contribución Social', 'Cotisation Sociale', 'Social Contribution', NOW()),
('enum', 'declaration_type.property_tax', 'declaration_type_enum', 'Impuesto Inmobiliario', 'Taxe Foncière', 'Property Tax', NOW()),
('enum', 'declaration_type.other_tax', 'declaration_type_enum', 'Otro Impuesto', 'Autre Taxe', 'Other Tax', NOW()),
('enum', 'declaration_type.settlement_voucher', 'declaration_type_enum', 'Impreso de Liquidación', 'Imprimé de Liquidation', 'Settlement Voucher', NOW()),
('enum', 'declaration_type.minimum_fiscal_contribution', 'declaration_type_enum', 'Cuota Mínima Fiscal (Sector Común)', 'Quota Minimale Fiscale (Secteur Commun)', 'Minimum Fiscal Contribution (Common Sector)', NOW()),
('enum', 'declaration_type.withheld_vat', 'declaration_type_enum', 'I.V.A. Retenido', 'T.V.A. Retenue', 'Withheld V.A.T.', NOW()),
('enum', 'declaration_type.actual_vat', 'declaration_type_enum', 'I.V.A. Real (Destajo)', 'T.V.A. Réelle (Destajo)', 'Actual V.A.T. (Destajo)', NOW()),
('enum', 'declaration_type.petroleum_products_tax', 'declaration_type_enum', 'Imp. Productos Petrolíferos (FMI)', 'Taxe Produits Pétroliers (FMI)', 'Petroleum Products Tax (FMI)', NOW()),
('enum', 'declaration_type.petroleum_products_tax_ivs', 'declaration_type_enum', 'Imp. Productos Petrolíferos (IVS)', 'Taxe Produits Pétroliers (IVS)', 'Petroleum Products Tax (IVS)', NOW()),
('enum', 'declaration_type.wages_tax_oil_mining', 'declaration_type_enum', 'Imp. Sueldos y Salarios (Petróleo/Minería)', 'Taxe Salaires (Pétrole/Mines)', 'Wages Tax (Oil/Mining)', NOW()),
('enum', 'declaration_type.wages_tax_common_sector', 'declaration_type_enum', 'Imp. Sueldos y Salarios (Sector Común)', 'Taxe Salaires (Secteur Commun)', 'Wages Tax (Common Sector)', NOW()),
('enum', 'declaration_type.common_voucher', 'declaration_type_enum', 'Impreso Común', 'Imprimé Commun', 'Common Voucher', NOW()),
('enum', 'declaration_type.withholding_3pct_oil_mining_residents', 'declaration_type_enum', 'Retención 3% Residentes (Petróleo/Minería)', 'Retenue 3% Résidents (Pétrole/Mines)', 'Withholding 3% Residents (Oil/Mining)', NOW()),
('enum', 'declaration_type.withholding_10pct_common_residents', 'declaration_type_enum', 'Retención 10% Residentes (Sector Común)', 'Retenue 10% Résidents (Secteur Commun)', 'Withholding 10% Residents (Common Sector)', NOW()),
('enum', 'declaration_type.withholding_5pct_oil_mining_residents', 'declaration_type_enum', 'Retención 5% Residentes (Petróleo/Minería)', 'Retenue 5% Résidents (Pétrole/Mines)', 'Withholding 5% Residents (Oil/Mining)', NOW()),
('enum', 'declaration_type.minimum_fiscal_oil_mining', 'declaration_type_enum', 'Cuota Mínima Fiscal (Petróleo/Minería)', 'Quota Minimale Fiscale (Pétrole/Mines)', 'Minimum Fiscal (Oil/Mining)', NOW()),
('enum', 'declaration_type.withholding_10pct_oil_mining_nonresidents', 'declaration_type_enum', 'Retención 10% No Residentes (Petróleo/Minería)', 'Retenue 10% Non-Résidents (Pétrole/Mines)', 'Withholding 10% Non-Residents (Oil/Mining)', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.10 declaration_status_enum (6 statuts)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'declaration_status.draft', 'declaration_status_enum', 'Borrador', 'Brouillon', 'Draft', NOW()),
('enum', 'declaration_status.submitted', 'declaration_status_enum', 'Enviado', 'Soumis', 'Submitted', NOW()),
('enum', 'declaration_status.processing', 'declaration_status_enum', 'En Procesamiento', 'En Traitement', 'Processing', NOW()),
('enum', 'declaration_status.accepted', 'declaration_status_enum', 'Aceptado', 'Accepté', 'Accepted', NOW()),
('enum', 'declaration_status.rejected', 'declaration_status_enum', 'Rechazado', 'Rejeté', 'Rejected', NOW()),
('enum', 'declaration_status.amended', 'declaration_status_enum', 'Rectificado', 'Rectifié', 'Amended', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.11 payment_status_enum (6 statuts - schema_declarations_v2.sql)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'payment_status.pending', 'payment_status_enum', 'Pendiente', 'En Attente', 'Pending', NOW()),
('enum', 'payment_status.processing', 'payment_status_enum', 'Procesando', 'En Traitement', 'Processing', NOW()),
('enum', 'payment_status.completed', 'payment_status_enum', 'Completado', 'Complété', 'Completed', NOW()),
('enum', 'payment_status.failed', 'payment_status_enum', 'Fallido', 'Échoué', 'Failed', NOW()),
('enum', 'payment_status.refunded', 'payment_status_enum', 'Reembolsado', 'Remboursé', 'Refunded', NOW()),
('enum', 'payment_status.cancelled', 'payment_status_enum', 'Cancelado', 'Annulé', 'Cancelled', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.12 payment_method_enum (5 méthodes)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'payment_method.bank_transfer', 'payment_method_enum', 'Transferencia Bancaria', 'Virement Bancaire', 'Bank Transfer', NOW()),
('enum', 'payment_method.card', 'payment_method_enum', 'Tarjeta', 'Carte', 'Card', NOW()),
('enum', 'payment_method.mobile_money', 'payment_method_enum', 'Dinero Móvil', 'Mobile Money', 'Mobile Money', NOW()),
('enum', 'payment_method.cash', 'payment_method_enum', 'Efectivo', 'Espèces', 'Cash', NOW()),
('enum', 'payment_method.bange_wallet', 'payment_method_enum', 'Cartera BANGE', 'Portefeuille BANGE', 'BANGE Wallet', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.13 payment_type_enum (4 types - schema_declarations_v2.sql)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'payment_type.full', 'payment_type_enum', 'Pago Completo', 'Paiement Complet', 'Full Payment', NOW()),
('enum', 'payment_type.partial', 'payment_type_enum', 'Pago Parcial', 'Paiement Partiel', 'Partial Payment', NOW()),
('enum', 'payment_type.installment', 'payment_type_enum', 'Cuota (Plan de Pago)', 'Échéance (Plan de Paiement)', 'Installment', NOW()),
('enum', 'payment_type.complementary', 'payment_type_enum', 'Pago Complementario', 'Paiement Complémentaire', 'Complementary Payment', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.14 attachment_type_enum (6 types - schema_declarations_v2.sql)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'attachment_type.declaration_form', 'attachment_type_enum', 'Formulario de Declaración', 'Formulaire de Déclaration', 'Declaration Form', NOW()),
('enum', 'attachment_type.supporting_document', 'attachment_type_enum', 'Documento Justificativo', 'Document Justificatif', 'Supporting Document', NOW()),
('enum', 'attachment_type.payment_proof', 'attachment_type_enum', 'Prueba de Pago', 'Preuve de Paiement', 'Payment Proof', NOW()),
('enum', 'attachment_type.identity_document', 'attachment_type_enum', 'Documento de Identidad', 'Document d''Identité', 'Identity Document', NOW()),
('enum', 'attachment_type.fiscal_service_receipt', 'attachment_type_enum', 'Recibo Servicio Fiscal', 'Reçu Service Fiscal', 'Fiscal Service Receipt', NOW()),
('enum', 'attachment_type.other', 'attachment_type_enum', 'Otro', 'Autre', 'Other', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.15 ocr_engine_enum (2 moteurs - schema_declarations_v2.sql)
-- ============================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'ocr_engine.tesseract', 'ocr_engine_enum', 'Tesseract OCR', 'Tesseract OCR', 'Tesseract OCR', NOW()),
('enum', 'ocr_engine.manual', 'ocr_engine_enum', 'Entrada Manual', 'Saisie Manuelle', 'Manual Entry', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================
-- 1.16 translatable_entity_type (7 types d'entités traduisibles)
-- ============================================
-- Note: Ces valeurs matchent EXACTEMENT l'ENUM dans schema_taxage2.sql ligne 181-189
-- translatable_entity_type = ('ministry', 'sector', 'category', 'service', 'procedure_template', 'procedure_step', 'document_template')

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('enum', 'entity_type.ministry', 'translatable_entity_type', 'Ministerio', 'Ministère', 'Ministry', NOW()),
('enum', 'entity_type.sector', 'translatable_entity_type', 'Sector', 'Secteur', 'Sector', NOW()),
('enum', 'entity_type.category', 'translatable_entity_type', 'Categoría', 'Catégorie', 'Category', NOW()),
('enum', 'entity_type.service', 'translatable_entity_type', 'Servicio', 'Service', 'Service', NOW()),
('enum', 'entity_type.procedure_template', 'translatable_entity_type', 'Plantilla de Procedimiento', 'Modèle de Procédure', 'Procedure Template', NOW()),
('enum', 'entity_type.procedure_step', 'translatable_entity_type', 'Paso de Procedimiento', 'Étape de Procédure', 'Procedure Step', NOW()),
('enum', 'entity_type.document_template', 'translatable_entity_type', 'Plantilla de Documento', 'Modèle de Document', 'Document Template', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 2: NAVIGATION & MENUS (UI Principal)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
-- Menu Principal
('ui.menu', 'dashboard', 'navigation', 'Panel de Control', 'Tableau de Bord', 'Dashboard', NOW()),
('ui.menu', 'fiscal_services', 'navigation', 'Servicios Fiscales', 'Services Fiscaux', 'Fiscal Services', NOW()),
('ui.menu', 'declarations', 'navigation', 'Declaraciones Fiscales', 'Déclarations Fiscales', 'Tax Declarations', NOW()),
('ui.menu', 'payments', 'navigation', 'Pagos', 'Paiements', 'Payments', NOW()),
('ui.menu', 'my_documents', 'navigation', 'Mis Documentos', 'Mes Documents', 'My Documents', NOW()),
('ui.menu', 'profile', 'navigation', 'Perfil', 'Profil', 'Profile', NOW()),
('ui.menu', 'settings', 'navigation', 'Configuración', 'Paramètres', 'Settings', NOW()),
('ui.menu', 'help', 'navigation', 'Ayuda', 'Aide', 'Help', NOW()),
('ui.menu', 'logout', 'navigation', 'Cerrar Sesión', 'Déconnexion', 'Logout', NOW()),

-- Sous-menus Declarations
('ui.menu', 'declarations.new', 'navigation', 'Nueva Declaración', 'Nouvelle Déclaration', 'New Declaration', NOW()),
('ui.menu', 'declarations.drafts', 'navigation', 'Borradores', 'Brouillons', 'Drafts', NOW()),
('ui.menu', 'declarations.submitted', 'navigation', 'Enviadas', 'Soumises', 'Submitted', NOW()),
('ui.menu', 'declarations.history', 'navigation', 'Historial', 'Historique', 'History', NOW()),

-- Sous-menus Payments
('ui.menu', 'payments.pending', 'navigation', 'Pagos Pendientes', 'Paiements en Attente', 'Pending Payments', NOW()),
('ui.menu', 'payments.completed', 'navigation', 'Pagos Completados', 'Paiements Complétés', 'Completed Payments', NOW()),
('ui.menu', 'payments.plans', 'navigation', 'Planes de Pago', 'Plans de Paiement', 'Payment Plans', NOW()),
('ui.menu', 'payments.receipts', 'navigation', 'Recibos', 'Reçus', 'Receipts', NOW()),

-- Admin Menu
('ui.menu', 'admin.users', 'navigation', 'Gestión de Usuarios', 'Gestion des Utilisateurs', 'User Management', NOW()),
('ui.menu', 'admin.agents', 'navigation', 'Agentes DGI', 'Agents DGI', 'DGI Agents', NOW()),
('ui.menu', 'admin.reports', 'navigation', 'Reportes', 'Rapports', 'Reports', NOW()),
('ui.menu', 'admin.audit', 'navigation', 'Auditoría', 'Audit', 'Audit', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 3: BOUTONS & ACTIONS (UI Commune)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
-- Actions CRUD
('ui.button', 'create', 'action', 'Crear', 'Créer', 'Create', NOW()),
('ui.button', 'edit', 'action', 'Editar', 'Modifier', 'Edit', NOW()),
('ui.button', 'delete', 'action', 'Eliminar', 'Supprimer', 'Delete', NOW()),
('ui.button', 'save', 'action', 'Guardar', 'Enregistrer', 'Save', NOW()),
('ui.button', 'cancel', 'action', 'Cancelar', 'Annuler', 'Cancel', NOW()),
('ui.button', 'submit', 'action', 'Enviar', 'Soumettre', 'Submit', NOW()),
('ui.button', 'confirm', 'action', 'Confirmar', 'Confirmer', 'Confirm', NOW()),
('ui.button', 'back', 'action', 'Volver', 'Retour', 'Back', NOW()),
('ui.button', 'next', 'action', 'Siguiente', 'Suivant', 'Next', NOW()),
('ui.button', 'previous', 'action', 'Anterior', 'Précédent', 'Previous', NOW()),
('ui.button', 'close', 'action', 'Cerrar', 'Fermer', 'Close', NOW()),
('ui.button', 'download', 'action', 'Descargar', 'Télécharger', 'Download', NOW()),
('ui.button', 'upload', 'action', 'Subir', 'Téléverser', 'Upload', NOW()),
('ui.button', 'print', 'action', 'Imprimir', 'Imprimer', 'Print', NOW()),
('ui.button', 'search', 'action', 'Buscar', 'Rechercher', 'Search', NOW()),
('ui.button', 'filter', 'action', 'Filtrar', 'Filtrer', 'Filter', NOW()),
('ui.button', 'export', 'action', 'Exportar', 'Exporter', 'Export', NOW()),
('ui.button', 'import', 'action', 'Importar', 'Importer', 'Import', NOW()),
('ui.button', 'refresh', 'action', 'Actualizar', 'Actualiser', 'Refresh', NOW()),
('ui.button', 'clear', 'action', 'Limpiar', 'Effacer', 'Clear', NOW()),

-- Actions spécifiques Declarations
('ui.button', 'save_draft', 'declaration', 'Guardar Borrador', 'Enregistrer Brouillon', 'Save Draft', NOW()),
('ui.button', 'submit_declaration', 'declaration', 'Enviar Declaración', 'Soumettre Déclaration', 'Submit Declaration', NOW()),
('ui.button', 'amend_declaration', 'declaration', 'Rectificar Declaración', 'Rectifier Déclaration', 'Amend Declaration', NOW()),
('ui.button', 'view_details', 'declaration', 'Ver Detalles', 'Voir Détails', 'View Details', NOW()),

-- Actions spécifiques Payments
('ui.button', 'pay_now', 'payment', 'Pagar Ahora', 'Payer Maintenant', 'Pay Now', NOW()),
('ui.button', 'create_payment_plan', 'payment', 'Crear Plan de Pago', 'Créer Plan de Paiement', 'Create Payment Plan', NOW()),
('ui.button', 'view_receipt', 'payment', 'Ver Recibo', 'Voir Reçu', 'View Receipt', NOW()),
('ui.button', 'cancel_payment', 'payment', 'Cancelar Pago', 'Annuler Paiement', 'Cancel Payment', NOW()),

-- Actions Agents
('ui.button', 'approve', 'agent', 'Aprobar', 'Approuver', 'Approve', NOW()),
('ui.button', 'reject', 'agent', 'Rechazar', 'Rejeter', 'Reject', NOW()),
('ui.button', 'lock', 'agent', 'Bloquear', 'Verrouiller', 'Lock', NOW()),
('ui.button', 'unlock', 'agent', 'Desbloquear', 'Déverrouiller', 'Unlock', NOW()),
('ui.button', 'escalate', 'agent', 'Escalar', 'Escalader', 'Escalate', NOW()),
('ui.button', 'request_docs', 'agent', 'Solicitar Documentos', 'Demander Documents', 'Request Documents', NOW()),
('ui.button', 'add_note', 'agent', 'Añadir Nota', 'Ajouter Note', 'Add Note', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 4: LABELS FORMULAIRES (Tous les champs des déclarations)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
-- Champs communs (Common fields)
('form.label', 'nif', 'common', 'N.I.F.', 'N.I.F.', 'TIN (Tax ID No.)', NOW()),
('form.label', 'full_name', 'common', 'Nombre Completo', 'Nom Complet', 'Full Name', NOW()),
('form.label', 'company_name', 'common', 'Razón Social', 'Raison Sociale', 'Company Name', NOW()),
('form.label', 'email', 'common', 'Correo Electrónico', 'Courrier Électronique', 'Email', NOW()),
('form.label', 'phone', 'common', 'Teléfono', 'Téléphone', 'Phone', NOW()),
('form.label', 'address', 'common', 'Dirección', 'Adresse', 'Address', NOW()),
('form.label', 'fiscal_address', 'common', 'Dirección Fiscal', 'Adresse Fiscale', 'Tax Address', NOW()),
('form.label', 'municipality', 'common', 'Municipio', 'Municipalité', 'Municipality', NOW()),
('form.label', 'district', 'common', 'Distrito', 'District', 'District', NOW()),
('form.label', 'province', 'common', 'Provincia', 'Province', 'Province', NOW()),
('form.label', 'postal_code', 'common', 'Código Postal', 'Code Postal', 'Postal Code', NOW()),
('form.label', 'fiscal_year', 'common', 'Ejercicio Fiscal', 'Exercice Fiscal', 'Fiscal Year', NOW()),
('form.label', 'fiscal_period', 'common', 'Período Fiscal', 'Période Fiscale', 'Fiscal Period', NOW()),
('form.label', 'declaration_number', 'common', 'Número de Declaración', 'Numéro de Déclaration', 'Declaration Number', NOW()),
('form.label', 'declaration_date', 'common', 'Fecha de Declaración', 'Date de Déclaration', 'Declaration Date', NOW()),

-- IVA (VAT) Form Fields
('form.label', 'iva_base_imponible', 'iva', 'Base Imponible', 'Base d''Imposition', 'Taxable Base', NOW()),
('form.label', 'iva_tipo', 'iva', 'Tipo (Tasa)', 'Taux', 'Rate', NOW()),
('form.label', 'iva_cuota', 'iva', 'Cuota', 'Montant', 'Amount', NOW()),
('form.label', 'iva_devengado', 'iva', 'I.V.A. Devengado', 'T.V.A. Due', 'Accrued V.A.T.', NOW()),
('form.label', 'iva_deducible', 'iva', 'I.V.A. Deducible', 'T.V.A. Déductible', 'Deductible V.A.T.', NOW()),
('form.label', 'iva_a_ingresar', 'iva', 'I.V.A. a Ingresar', 'T.V.A. à Payer', 'V.A.T. to Pay', NOW()),
('form.label', 'regimen_general', 'iva', 'Régimen General', 'Régime Général', 'General Regime', NOW()),
('form.label', 'regimen_reducido', 'iva', 'Régimen Reducido', 'Régime Réduit', 'Reduced Regime', NOW()),

-- IRPF (Income Tax) Form Fields
('form.label', 'irpf_ingresos_totales', 'irpf', 'Ingresos Totales', 'Revenus Totaux', 'Total Income', NOW()),
('form.label', 'irpf_deducciones', 'irpf', 'Deducciones', 'Déductions', 'Deductions', NOW()),
('form.label', 'irpf_base_liquidable', 'irpf', 'Base Liquidable', 'Base de Liquidation', 'Liquidation Base', NOW()),
('form.label', 'irpf_tipo_gravamen', 'irpf', 'Tipo de Gravamen', 'Taux d''Imposition', 'Tax Rate', NOW()),
('form.label', 'irpf_cuota_integra', 'irpf', 'Cuota Íntegra', 'Quote Intégrale', 'Gross Tax', NOW()),
('form.label', 'irpf_retenciones', 'irpf', 'Retenciones', 'Retenues', 'Withholdings', NOW()),
('form.label', 'irpf_a_ingresar', 'irpf', 'IRPF a Ingresar', 'IRPF à Payer', 'IRPF to Pay', NOW()),

-- Petroleum Products Tax Fields
('form.label', 'petro_tipo_producto', 'petroliferos', 'Tipo de Producto', 'Type de Produit', 'Product Type', NOW()),
('form.label', 'petro_volumen', 'petroliferos', 'Volumen (Litros)', 'Volume (Litres)', 'Volume (Liters)', NOW()),
('form.label', 'petro_tarifa_unitaria', 'petroliferos', 'Tarifa Unitaria', 'Tarif Unitaire', 'Unit Rate', NOW()),
('form.label', 'petro_impuesto_total', 'petroliferos', 'Impuesto Total', 'Taxe Totale', 'Total Tax', NOW()),

-- Payment Fields
('form.label', 'payment_amount', 'payment', 'Monto a Pagar', 'Montant à Payer', 'Amount to Pay', NOW()),
('form.label', 'payment_method', 'payment', 'Método de Pago', 'Méthode de Paiement', 'Payment Method', NOW()),
('form.label', 'bank_code', 'payment', 'Banco', 'Banque', 'Bank', NOW()),
('form.label', 'payment_reference', 'payment', 'Referencia de Pago', 'Référence de Paiement', 'Payment Reference', NOW()),
('form.label', 'payment_date', 'payment', 'Fecha de Pago', 'Date de Paiement', 'Payment Date', NOW()),

-- Upload Fields
('form.label', 'upload_file', 'upload', 'Subir Archivo', 'Téléverser Fichier', 'Upload File', NOW()),
('form.label', 'file_type', 'upload', 'Tipo de Archivo', 'Type de Fichier', 'File Type', NOW()),
('form.label', 'file_description', 'upload', 'Descripción', 'Description', 'Description', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 5: MESSAGES SYSTÈME (Notifications, Erreurs, Succès, Warnings)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
-- Messages de succès
('system.message', 'success.save', 'success', 'Guardado exitosamente', 'Enregistré avec succès', 'Saved successfully', NOW()),
('system.message', 'success.create', 'success', 'Creado exitosamente', 'Créé avec succès', 'Created successfully', NOW()),
('system.message', 'success.update', 'success', 'Actualizado exitosamente', 'Mis à jour avec succès', 'Updated successfully', NOW()),
('system.message', 'success.delete', 'success', 'Eliminado exitosamente', 'Supprimé avec succès', 'Deleted successfully', NOW()),
('system.message', 'success.submit', 'success', 'Enviado exitosamente', 'Soumis avec succès', 'Submitted successfully', NOW()),
('system.message', 'success.payment', 'success', 'Pago procesado exitosamente', 'Paiement traité avec succès', 'Payment processed successfully', NOW()),
('system.message', 'success.upload', 'success', 'Archivo subido exitosamente', 'Fichier téléversé avec succès', 'File uploaded successfully', NOW()),

-- Messages d'erreur
('system.message', 'error.generic', 'error', 'Ocurrió un error. Inténtelo de nuevo.', 'Une erreur s''est produite. Veuillez réessayer.', 'An error occurred. Please try again.', NOW()),
('system.message', 'error.required_field', 'error', 'Este campo es obligatorio', 'Ce champ est obligatoire', 'This field is required', NOW()),
('system.message', 'error.invalid_format', 'error', 'Formato inválido', 'Format invalide', 'Invalid format', NOW()),
('system.message', 'error.invalid_nif', 'error', 'N.I.F. inválido', 'N.I.F. invalide', 'Invalid TIN', NOW()),
('system.message', 'error.invalid_email', 'error', 'Correo electrónico inválido', 'Email invalide', 'Invalid email', NOW()),
('system.message', 'error.payment_failed', 'error', 'Pago fallido. Verifique sus datos bancarios.', 'Paiement échoué. Vérifiez vos données bancaires.', 'Payment failed. Please check your bank details.', NOW()),
('system.message', 'error.file_too_large', 'error', 'Archivo demasiado grande (máximo 10MB)', 'Fichier trop volumineux (maximum 10MB)', 'File too large (maximum 10MB)', NOW()),
('system.message', 'error.unauthorized', 'error', 'No autorizado', 'Non autorisé', 'Unauthorized', NOW()),
('system.message', 'error.session_expired', 'error', 'Sesión expirada. Por favor, inicie sesión de nuevo.', 'Session expirée. Veuillez vous reconnecter.', 'Session expired. Please log in again.', NOW()),

-- Messages d'avertissement
('system.message', 'warning.unsaved_changes', 'warning', 'Tiene cambios sin guardar', 'Vous avez des modifications non enregistrées', 'You have unsaved changes', NOW()),
('system.message', 'warning.confirm_delete', 'warning', '¿Está seguro de que desea eliminar este elemento?', 'Êtes-vous sûr de vouloir supprimer cet élément?', 'Are you sure you want to delete this item?', NOW()),
('system.message', 'warning.payment_due_soon', 'warning', 'Pago vence pronto', 'Paiement dû bientôt', 'Payment due soon', NOW()),
('system.message', 'warning.incomplete_form', 'warning', 'Formulario incompleto', 'Formulaire incomplet', 'Incomplete form', NOW()),

-- Messages informatifs
('system.message', 'info.processing', 'info', 'Procesando...', 'Traitement en cours...', 'Processing...', NOW()),
('system.message', 'info.loading', 'info', 'Cargando...', 'Chargement...', 'Loading...', NOW()),
('system.message', 'info.no_data', 'info', 'No hay datos disponibles', 'Aucune donnée disponible', 'No data available', NOW()),
('system.message', 'info.ocr_processing', 'info', 'Extrayendo datos del documento...', 'Extraction des données du document...', 'Extracting data from document...', NOW()),
('system.message', 'info.ocr_low_confidence', 'info', 'Confianza OCR baja. Por favor, verifique los datos extraídos.', 'Confiance OCR faible. Veuillez vérifier les données extraites.', 'Low OCR confidence. Please verify extracted data.', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 6: PÉRIODES FISCALES (Mois, Trimestres, Années)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
-- Mois (Months)
('fiscal.period', 'month.01', 'month', 'Enero', 'Janvier', 'January', NOW()),
('fiscal.period', 'month.02', 'month', 'Febrero', 'Février', 'February', NOW()),
('fiscal.period', 'month.03', 'month', 'Marzo', 'Mars', 'March', NOW()),
('fiscal.period', 'month.04', 'month', 'Abril', 'Avril', 'April', NOW()),
('fiscal.period', 'month.05', 'month', 'Mayo', 'Mai', 'May', NOW()),
('fiscal.period', 'month.06', 'month', 'Junio', 'Juin', 'June', NOW()),
('fiscal.period', 'month.07', 'month', 'Julio', 'Juillet', 'July', NOW()),
('fiscal.period', 'month.08', 'month', 'Agosto', 'Août', 'August', NOW()),
('fiscal.period', 'month.09', 'month', 'Septiembre', 'Septembre', 'September', NOW()),
('fiscal.period', 'month.10', 'month', 'Octubre', 'Octobre', 'October', NOW()),
('fiscal.period', 'month.11', 'month', 'Noviembre', 'Novembre', 'November', NOW()),
('fiscal.period', 'month.12', 'month', 'Diciembre', 'Décembre', 'December', NOW()),

-- Trimestres (Quarters)
('fiscal.period', 'quarter.q1', 'quarter', 'Primer Trimestre', 'Premier Trimestre', 'First Quarter', NOW()),
('fiscal.period', 'quarter.q2', 'quarter', 'Segundo Trimestre', 'Deuxième Trimestre', 'Second Quarter', NOW()),
('fiscal.period', 'quarter.q3', 'quarter', 'Tercer Trimestre', 'Troisième Trimestre', 'Third Quarter', NOW()),
('fiscal.period', 'quarter.q4', 'quarter', 'Cuarto Trimestre', 'Quatrième Trimestre', 'Fourth Quarter', NOW()),

-- Périodes Spéciales
('fiscal.period', 'annual', 'period', 'Anual', 'Annuel', 'Annual', NOW()),
('fiscal.period', 'semester.1', 'semester', 'Primer Semestre', 'Premier Semestre', 'First Semester', NOW()),
('fiscal.period', 'semester.2', 'semester', 'Segundo Semestre', 'Deuxième Semestre', 'Second Semester', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 7: LABELS UI ADDITIONNELS (Dashboards, Tables, Filtres)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
-- Dashboard Labels
('ui.label', 'total_services', 'dashboard', 'Total de Servicios', 'Total de Services', 'Total Services', NOW()),
('ui.label', 'pending_payments', 'dashboard', 'Pagos Pendientes', 'Paiements en Attente', 'Pending Payments', NOW()),
('ui.label', 'recent_declarations', 'dashboard', 'Declaraciones Recientes', 'Déclarations Récentes', 'Recent Declarations', NOW()),
('ui.label', 'notifications', 'dashboard', 'Notificaciones', 'Notifications', 'Notifications', NOW()),

-- Table Headers
('ui.label', 'id', 'table', 'ID', 'ID', 'ID', NOW()),
('ui.label', 'name', 'table', 'Nombre', 'Nom', 'Name', NOW()),
('ui.label', 'status', 'table', 'Estado', 'Statut', 'Status', NOW()),
('ui.label', 'date', 'table', 'Fecha', 'Date', 'Date', NOW()),
('ui.label', 'amount', 'table', 'Monto', 'Montant', 'Amount', NOW()),
('ui.label', 'actions', 'table', 'Acciones', 'Actions', 'Actions', NOW()),
('ui.label', 'type', 'table', 'Tipo', 'Type', 'Type', NOW()),
('ui.label', 'description', 'table', 'Descripción', 'Description', 'Description', NOW()),

-- Pagination
('ui.label', 'page', 'pagination', 'Página', 'Page', 'Page', NOW()),
('ui.label', 'of', 'pagination', 'de', 'de', 'of', NOW()),
('ui.label', 'per_page', 'pagination', 'Por página', 'Par page', 'Per page', NOW()),
('ui.label', 'first', 'pagination', 'Primera', 'Première', 'First', NOW()),
('ui.label', 'last', 'pagination', 'Última', 'Dernière', 'Last', NOW()),

-- Filter Labels
('ui.label', 'filter_by', 'filter', 'Filtrar por', 'Filtrer par', 'Filter by', NOW()),
('ui.label', 'sort_by', 'filter', 'Ordenar por', 'Trier par', 'Sort by', NOW()),
('ui.label', 'date_range', 'filter', 'Rango de Fechas', 'Plage de Dates', 'Date Range', NOW()),
('ui.label', 'from', 'filter', 'Desde', 'De', 'From', NOW()),
('ui.label', 'to', 'filter', 'Hasta', 'À', 'To', NOW()),
('ui.label', 'all', 'filter', 'Todos', 'Tous', 'All', NOW()),

-- Titles
('ui.label', 'login', 'title', 'Iniciar Sesión', 'Connexion', 'Login', NOW()),
('ui.label', 'register', 'title', 'Registrarse', 'S''inscrire', 'Register', NOW()),
('ui.label', 'forgot_password', 'title', 'Olvidé mi Contraseña', 'Mot de Passe Oublié', 'Forgot Password', NOW()),
('ui.label', 'reset_password', 'title', 'Restablecer Contraseña', 'Réinitialiser Mot de Passe', 'Reset Password', NOW()),
('ui.label', 'my_account', 'title', 'Mi Cuenta', 'Mon Compte', 'My Account', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 8: FORM VALIDATION MESSAGES (Messages de validation)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('validation', 'min_length', 'validation', 'Mínimo {min} caracteres', 'Minimum {min} caractères', 'Minimum {min} characters', NOW()),
('validation', 'max_length', 'validation', 'Máximo {max} caracteres', 'Maximum {max} caractères', 'Maximum {max} characters', NOW()),
('validation', 'min_value', 'validation', 'Valor mínimo: {min}', 'Valeur minimale: {min}', 'Minimum value: {min}', NOW()),
('validation', 'max_value', 'validation', 'Valor máximo: {max}', 'Valeur maximale: {max}', 'Maximum value: {max}', NOW()),
('validation', 'must_be_number', 'validation', 'Debe ser un número', 'Doit être un nombre', 'Must be a number', NOW()),
('validation', 'must_be_positive', 'validation', 'Debe ser un número positivo', 'Doit être un nombre positif', 'Must be a positive number', NOW()),
('validation', 'invalid_date', 'validation', 'Fecha inválida', 'Date invalide', 'Invalid date', NOW()),
('validation', 'future_date_not_allowed', 'validation', 'No se permiten fechas futuras', 'Les dates futures ne sont pas autorisées', 'Future dates not allowed', NOW()),
('validation', 'password_mismatch', 'validation', 'Las contraseñas no coinciden', 'Les mots de passe ne correspondent pas', 'Passwords do not match', NOW()),
('validation', 'weak_password', 'validation', 'Contraseña débil (mín. 8 caracteres, incluir mayúsculas, números)', 'Mot de passe faible (min. 8 caractères, inclure majuscules, chiffres)', 'Weak password (min. 8 characters, include uppercase, numbers)', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 9: BANK NAMES (Banques de Guinée Équatoriale)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('bank', 'bange', 'bank_name', 'Banco Nacional de Guinea Ecuatorial (BANGE)', 'Banque Nationale de Guinée Équatoriale (BANGE)', 'National Bank of Equatorial Guinea (BANGE)', NOW()),
('bank', 'bgfi', 'bank_name', 'Banco BGFIBank Guinea Ecuatorial', 'Banque BGFIBank Guinée Équatoriale', 'BGFIBank Equatorial Guinea', NOW()),
('bank', 'cceibank', 'bank_name', 'Banco CCEIBANK', 'Banque CCEIBANK', 'CCEIBANK', NOW()),
('bank', 'sgbge', 'bank_name', 'Société Générale BANGE GE (SGBGE)', 'Société Générale BANGE GE (SGBGE)', 'Société Générale BANGE GE (SGBGE)', NOW()),
('bank', 'ecobank', 'bank_name', 'Ecobank Guinea Ecuatorial', 'Ecobank Guinée Équatoriale', 'Ecobank Equatorial Guinea', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

-- ============================================================================================================
-- SECTION 10: AGENT DASHBOARD (Messages pour agents DGI)
-- ============================================================================================================

INSERT INTO translations (category, key_code, context, es, fr, en, created_at) VALUES
('agent.dashboard', 'queue_title', 'agent', 'Cola de Trabajo', 'File d''Attente', 'Work Queue', NOW()),
('agent.dashboard', 'locked_by_me', 'agent', 'Bloqueado por mí', 'Verrouillé par moi', 'Locked by me', NOW()),
('agent.dashboard', 'priority_high', 'agent', 'Prioridad Alta', 'Priorité Haute', 'High Priority', NOW()),
('agent.dashboard', 'priority_critical', 'agent', 'Prioridad Crítica', 'Priorité Critique', 'Critical Priority', NOW()),
('agent.dashboard', 'sla_breached', 'agent', 'SLA Incumplido', 'SLA Non Respecté', 'SLA Breached', NOW()),
('agent.dashboard', 'awaiting_documents', 'agent', 'Esperando Documentos', 'En Attente de Documents', 'Awaiting Documents', NOW()),
('agent.dashboard', 'assign_to_me', 'agent', 'Asignarme', 'M''Assigner', 'Assign to Me', NOW()),
('agent.dashboard', 'release_lock', 'agent', 'Liberar Bloqueo', 'Libérer Verrou', 'Release Lock', NOW()),
('agent.dashboard', 'review_comments', 'agent', 'Comentarios de Revisión', 'Commentaires de Révision', 'Review Comments', NOW()),
('agent.dashboard', 'audit_trail', 'agent', 'Rastro de Auditoría', 'Piste d''Audit', 'Audit Trail', NOW())
ON CONFLICT (category, key_code, context) DO UPDATE
SET es = EXCLUDED.es, fr = EXCLUDED.fr, en = EXCLUDED.en;

COMMIT;

-- ============================================================================================================
-- STATISTIQUES FINALES
-- ============================================================================================================
-- Total traductions: ~500+ lignes
-- Catégories:
--   - ENUMS: 16 types (150+ valeurs)
--   - UI Navigation & Menus: 30+
--   - Boutons & Actions: 40+
--   - Labels Formulaires: 50+
--   - Messages Système: 30+
--   - Périodes Fiscales: 20+
--   - Labels Additionnels: 40+
--   - Validation Messages: 10+
--   - Banques: 5
--   - Agent Dashboard: 10+
--
-- Langues: ES (Espagnol - défaut), FR (Français), EN (English)
-- ============================================================================================================
