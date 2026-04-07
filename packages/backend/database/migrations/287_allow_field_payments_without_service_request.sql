-- Migration 287: Allow field payments without service_request_id
-- Field inspections create service_payments directly (no wizard/workflow).
-- The inspection report serves as proof — no service_request needed.

ALTER TABLE service_payments
DROP CONSTRAINT IF EXISTS chk_service_request_required;

ALTER TABLE service_payments
ADD CONSTRAINT chk_service_request_required
CHECK (
    service_request_id IS NOT NULL
    OR created_at < '2026-01-11'::date
    OR collection_type = 'field'
);

COMMENT ON CONSTRAINT chk_service_request_required ON service_payments IS
'service_request_id required for office/online payments. Field collections (collection_type=field) are exempt — inspection report is the proof.';
