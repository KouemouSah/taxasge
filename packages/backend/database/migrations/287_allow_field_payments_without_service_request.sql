-- Migration 287: Add FIELD_INSPECTION workflow code for field payment audit trail
--
-- Architecture: field inspections create service_payments through a lightweight
-- service_request (workflow_code = 'FIELD_INSPECTION'). This preserves:
--   - Full audit trail (inspection → service_request → service_payment)
--   - chk_service_request_required constraint (unchanged)
--   - fk_sr_valid_workflow_code constraint (satisfied)
--
-- The inspection report serves as the "document" — no wizard steps needed.

-- 1. Register FIELD_INSPECTION as a valid workflow code
INSERT INTO valid_workflow_codes (code, base_code, resolution_key, is_active)
VALUES ('FIELD_INSPECTION', NULL, 'FIELD', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Add to workflows table for completeness
INSERT INTO workflows (code, name_es, is_active, requires_appointment, requires_payment)
VALUES ('FIELD_INSPECTION', 'Inspeccion de Campo', TRUE, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;
