-- Migration: Seed USSD Configurations
-- Date: 2025-12-19
-- Description: Create default USSD configurations for GETESA and MUNI operators

-- =============================================================================
-- GETESA Configuration
-- =============================================================================

INSERT INTO ussd_configs (
    operator_name,
    operator_code,
    short_code,
    api_endpoint,
    auth_config,
    menu_structure,
    session_timeout_seconds,
    max_input_length,
    is_active,
    created_at
) VALUES (
    'getesa',
    'GETESA_GQ',
    '*123#',
    'https://api.getesa.gq/ussd/v1',
    '{"type": "api_key", "header": "X-API-Key"}'::jsonb,
    '[
        {
            "id": "main",
            "titleEs": "Bienvenido a TaxasGE",
            "titleFr": "Bienvenue sur TaxasGE",
            "titleEn": "Welcome to TaxasGE",
            "isRoot": true,
            "options": [
                {"key": "1", "labelEs": "Consultar Saldo Fiscal", "labelFr": "Consulter Solde Fiscal", "labelEn": "Check Tax Balance", "action": "balance"},
                {"key": "2", "labelEs": "Estado de Declaracion", "labelFr": "Statut Declaration", "labelEn": "Declaration Status", "action": "declaration_status"},
                {"key": "3", "labelEs": "Pagar Impuesto", "labelFr": "Payer Impot", "labelEn": "Pay Tax", "nextMenu": "payment_menu"},
                {"key": "4", "labelEs": "Buscar Servicio", "labelFr": "Rechercher Service", "labelEn": "Search Service", "action": "service_search"},
                {"key": "5", "labelEs": "Soporte", "labelFr": "Support", "labelEn": "Support", "nextMenu": "support_menu"}
            ]
        },
        {
            "id": "payment_menu",
            "titleEs": "Seleccione tipo de pago",
            "titleFr": "Selectionnez le type de paiement",
            "titleEn": "Select payment type",
            "parentMenu": "main",
            "options": [
                {"key": "1", "labelEs": "MTN Mobile Money", "labelFr": "MTN Mobile Money", "labelEn": "MTN Mobile Money", "action": "payment", "actionParams": {"method": "mtn_mobile_money"}},
                {"key": "2", "labelEs": "BANGE", "labelFr": "BANGE", "labelEn": "BANGE", "action": "payment", "actionParams": {"method": "bange"}},
                {"key": "0", "labelEs": "Volver", "labelFr": "Retour", "labelEn": "Back", "nextMenu": "main"}
            ]
        },
        {
            "id": "support_menu",
            "titleEs": "Centro de Soporte",
            "titleFr": "Centre de Support",
            "titleEn": "Support Center",
            "parentMenu": "main",
            "options": [
                {"key": "1", "labelEs": "Llamar al Soporte", "labelFr": "Appeler le Support", "labelEn": "Call Support", "action": "support", "actionParams": {"type": "call", "number": "+240222123456"}},
                {"key": "2", "labelEs": "Enviar SMS", "labelFr": "Envoyer SMS", "labelEn": "Send SMS", "action": "support", "actionParams": {"type": "sms"}},
                {"key": "0", "labelEs": "Volver", "labelFr": "Retour", "labelEn": "Back", "nextMenu": "main"}
            ]
        }
    ]'::jsonb,
    180,
    160,
    true,
    NOW()
) ON CONFLICT (operator_code) DO UPDATE SET
    menu_structure = EXCLUDED.menu_structure,
    updated_at = NOW();

-- =============================================================================
-- MUNI Configuration
-- =============================================================================

INSERT INTO ussd_configs (
    operator_name,
    operator_code,
    short_code,
    api_endpoint,
    auth_config,
    menu_structure,
    session_timeout_seconds,
    max_input_length,
    is_active,
    created_at
) VALUES (
    'muni',
    'MUNI_GQ',
    '*456#',
    'https://api.muni.gq/ussd/v1',
    '{"type": "bearer", "token_endpoint": "/auth/token"}'::jsonb,
    '[
        {
            "id": "main",
            "titleEs": "TaxasGE - Servicios Fiscales",
            "titleFr": "TaxasGE - Services Fiscaux",
            "titleEn": "TaxasGE - Tax Services",
            "isRoot": true,
            "options": [
                {"key": "1", "labelEs": "Mi Saldo", "labelFr": "Mon Solde", "labelEn": "My Balance", "action": "balance"},
                {"key": "2", "labelEs": "Mis Declaraciones", "labelFr": "Mes Declarations", "labelEn": "My Declarations", "nextMenu": "declarations_menu"},
                {"key": "3", "labelEs": "Realizar Pago", "labelFr": "Effectuer Paiement", "labelEn": "Make Payment", "action": "payment"},
                {"key": "4", "labelEs": "Servicios Disponibles", "labelFr": "Services Disponibles", "labelEn": "Available Services", "action": "service_search"},
                {"key": "5", "labelEs": "Ayuda", "labelFr": "Aide", "labelEn": "Help", "action": "support"}
            ]
        },
        {
            "id": "declarations_menu",
            "titleEs": "Mis Declaraciones",
            "titleFr": "Mes Declarations",
            "titleEn": "My Declarations",
            "parentMenu": "main",
            "options": [
                {"key": "1", "labelEs": "Declaraciones Pendientes", "labelFr": "Declarations en Attente", "labelEn": "Pending Declarations", "action": "declaration_status", "actionParams": {"filter": "pending"}},
                {"key": "2", "labelEs": "Declaraciones Aprobadas", "labelFr": "Declarations Approuvees", "labelEn": "Approved Declarations", "action": "declaration_status", "actionParams": {"filter": "approved"}},
                {"key": "3", "labelEs": "Todas las Declaraciones", "labelFr": "Toutes les Declarations", "labelEn": "All Declarations", "action": "declaration_status", "actionParams": {"filter": "all"}},
                {"key": "0", "labelEs": "Volver", "labelFr": "Retour", "labelEn": "Back", "nextMenu": "main"}
            ]
        }
    ]'::jsonb,
    180,
    160,
    true,
    NOW()
) ON CONFLICT (operator_code) DO UPDATE SET
    menu_structure = EXCLUDED.menu_structure,
    updated_at = NOW();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ussd_configs_operator_code ON ussd_configs(operator_code);
CREATE INDEX IF NOT EXISTS idx_ussd_configs_is_active ON ussd_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_ussd_configs_short_code ON ussd_configs(short_code);
