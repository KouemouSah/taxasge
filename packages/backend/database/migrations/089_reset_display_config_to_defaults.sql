-- Migration 089: Reset workflow_display_config to default system columns
-- Date: 2026-02-02
-- Purpose: Reset existing display configs that have too many columns pre-selected
--          Only system columns should be selected by default
--
-- Problem: Previous configs had 29-35 columns selected (including nested dip.*, pasaporte_antiguo.*)
-- Solution: Reset to only 6 default system columns, admin can re-add columns as needed

-- Default system columns (matches DEFAULT_SELECTED_COLUMNS in frontend)
-- ['reference', 'fullName', 'solicitudType', 'createdAt', 'status', 'priority']

-- First, let's see what we have
DO $$
DECLARE
    config_count INT;
BEGIN
    SELECT COUNT(*) INTO config_count FROM workflow_display_config WHERE deleted_at IS NULL;
    RAISE NOTICE 'Found % active workflow_display_config records to reset', config_count;
END $$;

-- Update all existing configs to use only default system columns
UPDATE workflow_display_config
SET
    list_columns = '["reference", "fullName", "solicitudType", "createdAt", "status", "priority"]'::jsonb,
    updated_at = NOW()
WHERE deleted_at IS NULL;

-- Also ensure preview_sections has sensible defaults
UPDATE workflow_display_config
SET
    preview_sections = '["info", "extractedData", "documents", "contact"]'::jsonb
WHERE preview_sections IS NULL
   OR preview_sections = '[]'::jsonb
   OR preview_sections = 'null'::jsonb;

-- Log the results
DO $$
DECLARE
    updated_count INT;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Reset % workflow_display_config records to default columns', updated_count;
END $$;

-- Verify the update
SELECT
    id,
    workflow_code,
    jsonb_array_length(list_columns) as column_count,
    list_columns
FROM workflow_display_config
WHERE deleted_at IS NULL
ORDER BY workflow_code;
