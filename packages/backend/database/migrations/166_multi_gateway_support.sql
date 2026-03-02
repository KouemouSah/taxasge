-- ============================================================================
-- Migration 166: Multi-Gateway Payment Support
--
-- Adds gateway_type, supported_payment_methods, and is_primary columns
-- to bank_configurations table for multi-gateway routing.
--
-- BANGE remains the primary gateway for all electronic methods.
-- ECOBANK seeded as available (not primary) — can be activated by admin.
-- ============================================================================

-- Add new columns for multi-gateway support
ALTER TABLE bank_configurations
    ADD COLUMN IF NOT EXISTS gateway_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS supported_payment_methods JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Seed BANGE as primary gateway for all electronic methods
UPDATE bank_configurations
SET gateway_type = 'bange',
    supported_payment_methods = '["mobile_money", "card", "bank_transfer"]'::jsonb,
    is_primary = true,
    supports_direct_integration = true
WHERE bank_code = 'BANGE';

-- Seed ECOBANK as available (not primary)
UPDATE bank_configurations
SET gateway_type = 'ecobank',
    supported_payment_methods = '["mobile_money", "card", "bank_transfer"]'::jsonb,
    is_primary = false
WHERE bank_code = 'ECOBANK';

-- Other banks: mark as manual/not integrated
UPDATE bank_configurations
SET gateway_type = NULL,
    supported_payment_methods = '[]'::jsonb,
    is_primary = false
WHERE bank_code NOT IN ('BANGE', 'ECOBANK')
  AND gateway_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN bank_configurations.gateway_type IS 'Gateway implementation type: bange, ecobank, null (not integrated)';
COMMENT ON COLUMN bank_configurations.supported_payment_methods IS 'JSON array of payment methods: mobile_money, card, bank_transfer';
COMMENT ON COLUMN bank_configurations.is_primary IS 'If true, this gateway is the primary processor for its supported methods';
