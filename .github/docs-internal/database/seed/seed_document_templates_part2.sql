BEGIN;

-- ============================================
-- SEED DOCUMENT TEMPLATES - PART 2
-- Inserts: 1442
-- ============================================

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-494' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-495' AND dt.template_code = 'DOC_534_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-495' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-495' AND dt.template_code = 'DOC_535_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-495' AND dt.template_code = 'DOC_450_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-495' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-496' AND dt.template_code = 'DOC_536_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-496' AND dt.template_code = 'DOC_537_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-496' AND dt.template_code = 'DOC_538_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-496' AND dt.template_code = 'DOC_539_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-496' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-497' AND dt.template_code = 'DOC_540_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-497' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-497' AND dt.template_code = 'DOC_541_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-497' AND dt.template_code = 'DOC_466_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-497' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-498' AND dt.template_code = 'DOC_542_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-498' AND dt.template_code = 'DOC_543_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-498' AND dt.template_code = 'DOC_544_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-498' AND dt.template_code = 'DOC_545_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-498' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-499' AND dt.template_code = 'DOC_542_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-499' AND dt.template_code = 'DOC_485_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-499' AND dt.template_code = 'DOC_449_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-499' AND dt.template_code = 'DOC_545_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-499' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-500' AND dt.template_code = 'DOC_473_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-500' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-500' AND dt.template_code = 'DOC_486_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-500' AND dt.template_code = 'DOC_466_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-500' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-501' AND dt.template_code = 'DOC_546_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-502' AND dt.template_code = 'DOC_547_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-503' AND dt.template_code = 'DOC_548_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-504' AND dt.template_code = 'DOC_549_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-505' AND dt.template_code = 'DOC_550_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-506' AND dt.template_code = 'DOC_551_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-507' AND dt.template_code = 'DOC_552_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-508' AND dt.template_code = 'DOC_553_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-509' AND dt.template_code = 'DOC_554_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-510' AND dt.template_code = 'DOC_555_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-511' AND dt.template_code = 'DOC_556_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-512' AND dt.template_code = 'DOC_557_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-513' AND dt.template_code = 'DOC_558_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-514' AND dt.template_code = 'DOC_559_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-515' AND dt.template_code = 'DOC_560_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-516' AND dt.template_code = 'DOC_561_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-517' AND dt.template_code = 'DOC_562_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-518' AND dt.template_code = 'DOC_563_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-519' AND dt.template_code = 'DOC_564_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-520' AND dt.template_code = 'DOC_565_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-521' AND dt.template_code = 'DOC_566_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-522' AND dt.template_code = 'DOC_567_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-523' AND dt.template_code = 'DOC_568_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-524' AND dt.template_code = 'DOC_569_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-525' AND dt.template_code = 'DOC_570_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-526' AND dt.template_code = 'DOC_571_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-527' AND dt.template_code = 'DOC_572_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-528' AND dt.template_code = 'DOC_573_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-552' AND dt.template_code = 'DOC_574_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-553' AND dt.template_code = 'DOC_575_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-554' AND dt.template_code = 'DOC_576_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-555' AND dt.template_code = 'DOC_577_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-556' AND dt.template_code = 'DOC_578_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-557' AND dt.template_code = 'DOC_579_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-558' AND dt.template_code = 'DOC_580_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-559' AND dt.template_code = 'DOC_581_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-560' AND dt.template_code = 'DOC_582_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-561' AND dt.template_code = 'DOC_583_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-562' AND dt.template_code = 'DOC_584_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-563' AND dt.template_code = 'DOC_585_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-564' AND dt.template_code = 'DOC_586_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-565' AND dt.template_code = 'DOC_587_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-566' AND dt.template_code = 'DOC_588_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-567' AND dt.template_code = 'DOC_589_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-568' AND dt.template_code = 'DOC_590_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-569' AND dt.template_code = 'DOC_591_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-570' AND dt.template_code = 'DOC_592_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-571' AND dt.template_code = 'DOC_593_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-572' AND dt.template_code = 'DOC_594_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-573' AND dt.template_code = 'DOC_595_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-574' AND dt.template_code = 'DOC_596_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-575' AND dt.template_code = 'DOC_597_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-576' AND dt.template_code = 'DOC_598_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-577' AND dt.template_code = 'DOC_599_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-578' AND dt.template_code = 'DOC_600_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-579' AND dt.template_code = 'DOC_601_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-580' AND dt.template_code = 'DOC_602_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-581' AND dt.template_code = 'DOC_603_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-582' AND dt.template_code = 'DOC_604_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-583' AND dt.template_code = 'DOC_605_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-584' AND dt.template_code = 'DOC_606_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-585' AND dt.template_code = 'DOC_607_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-586' AND dt.template_code = 'DOC_608_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-587' AND dt.template_code = 'DOC_609_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-588' AND dt.template_code = 'DOC_610_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-589' AND dt.template_code = 'DOC_611_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-590' AND dt.template_code = 'DOC_612_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-591' AND dt.template_code = 'DOC_613_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-592' AND dt.template_code = 'DOC_614_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-593' AND dt.template_code = 'DOC_615_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-594' AND dt.template_code = 'DOC_616_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-595' AND dt.template_code = 'DOC_617_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-596' AND dt.template_code = 'DOC_618_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-599' AND dt.template_code = 'DOC_619_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-600' AND dt.template_code = 'DOC_620_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-601' AND dt.template_code = 'DOC_621_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-602' AND dt.template_code = 'DOC_622_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-603' AND dt.template_code = 'DOC_623_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-604' AND dt.template_code = 'DOC_624_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-605' AND dt.template_code = 'DOC_625_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-610' AND dt.template_code = 'DOC_626_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-611' AND dt.template_code = 'DOC_627_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-612' AND dt.template_code = 'DOC_628_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-613' AND dt.template_code = 'DOC_629_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-614' AND dt.template_code = 'DOC_630_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-615' AND dt.template_code = 'DOC_631_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-616' AND dt.template_code = 'DOC_632_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-617' AND dt.template_code = 'DOC_633_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-618' AND dt.template_code = 'DOC_634_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-619' AND dt.template_code = 'DOC_635_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-620' AND dt.template_code = 'DOC_636_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-621' AND dt.template_code = 'DOC_637_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-622' AND dt.template_code = 'DOC_638_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-623' AND dt.template_code = 'DOC_639_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-624' AND dt.template_code = 'DOC_640_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-625' AND dt.template_code = 'DOC_641_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-626' AND dt.template_code = 'DOC_642_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-627' AND dt.template_code = 'DOC_643_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-628' AND dt.template_code = 'DOC_644_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-909' AND dt.template_code = 'DOC_645_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-910' AND dt.template_code = 'DOC_646_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-911' AND dt.template_code = 'DOC_647_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-912' AND dt.template_code = 'DOC_648_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-913' AND dt.template_code = 'DOC_649_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-914' AND dt.template_code = 'DOC_650_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-915' AND dt.template_code = 'DOC_651_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-916' AND dt.template_code = 'DOC_652_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_1_______________', 'fr', 'name', 'Document original à légaliser, Pièce d''identité du demandeur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_2_______________', 'fr', 'name', 'Document notarié original, Pièce d''identité du demandeur, Procuration notariée si agissant en représentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_3_______________', 'fr', 'name', 'Diplôme ou titre original, Pièce d''identité, Certificat d''études', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_4_______________', 'fr', 'name', 'Document commercial original, Pièce d''identité du demandeur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_5_______________', 'fr', 'name', 'Pièce d''identité, Photographie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_6_______________', 'fr', 'name', 'Passeport actuel, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_7_______________', 'fr', 'name', 'Pièce d''identité, Justification de la nécessité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_8_______________', 'fr', 'name', 'Document original, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_9_______________', 'fr', 'name', 'Acte notarié original, Pièce d''identité, Procuration notariée si nécessaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_10______________', 'fr', 'name', 'Document commercial original, Pièce d''identité, Documentation commerciale complémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_11______________', 'fr', 'name', 'Pièce d''identité, Photographie, Justificatif de paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_12______________', 'fr', 'name', 'Passeport actuel, Pièce d''identité, Photographie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_13______________', 'fr', 'name', 'Pièce d''identité, Justificatif d''inscription consulaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_14______________', 'fr', 'name', 'Documentation de l''aéronef, Certificat de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_15______________', 'fr', 'name', 'Documentation de l''aéronef, Certificat de poids détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_16______________', 'fr', 'name', 'Certificat d''aéronef privé, Documentation de tourisme', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_17______________', 'fr', 'name', 'Certificat d''aéronef, Documentation d''hélicoptère', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_18______________', 'fr', 'name', 'Document d''enregistrement, Certificat de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_19______________', 'fr', 'name', 'Document de propriété, Identification du propriétaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_20______________', 'fr', 'name', 'Demande d''immatriculation temporaire, Documentation provisoire d''aéronef, Preuve de procédure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_21______________', 'fr', 'name', 'Certificat temporaire en cours de validité, Documentation d''aéronef mise à jour, Preuve de paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_22______________', 'fr', 'name', 'Certificat original, Déclaration de perte, Pièce d''identité, Preuve de paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_23______________', 'fr', 'name', 'Document de transfert, Certificat d''immatriculation actuel, Pièce d''identité du nouveau propriétaire, Contrat de vente', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_24______________', 'fr', 'name', 'Document d''hypothèque, Certificat d''immatriculation, Pièce d''identité, Preuve de paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_25______________', 'fr', 'name', 'Document original du registre, Pièce d''identité, Preuve de demande', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_26______________', 'fr', 'name', 'Certificat original de navigabilité, Documentation technique de l''aéronef, Historique de maintenance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_27______________', 'fr', 'name', 'Documentation spéciale de l''aéronef, Rapport technique détaillé, Justification de condition spéciale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_28______________', 'fr', 'name', 'Plan de vol détaillé, Documentation de l''aéronef, Certificats de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_29______________', 'fr', 'name', 'Contrat de location original, Documentation de l''aéronef, Identification des parties', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_30______________', 'fr', 'name', 'Document juridique original, Certificat de propriété d''aéronef, Évaluation de la valeur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_31______________', 'fr', 'name', 'Certificat de navigabilité étranger original, Documentation technique complète, Historique de maintenance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_32______________', 'fr', 'name', 'Documentation technique d''installation radioélectrique, Certificat d''étalonnage, Plan d''installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_33______________', 'fr', 'name', 'Rapport de niveaux de bruit, Documentation technique de l''aéronef, Certificat du fabricant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_34______________', 'fr', 'name', 'Documentation technique de l''aéronef, Certificat de capacités spéciales, Plan de vol détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_35______________', 'fr', 'name', 'Plan du terrain, Documentation de propriété, Certificat d''utilisation du sol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_36______________', 'fr', 'name', 'Plan du terrain, Documentation de propriété, Certificat de zonage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_37______________', 'fr', 'name', 'Plan de vol, Documentation de l''aéronef, Certificat d''opération', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_38______________', 'fr', 'name', 'Plan de route, Documentation de l''aéronef, Assurances de vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_39______________', 'fr', 'name', 'Plans topographiques, Documentation technique, Rapports antérieurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_40______________', 'fr', 'name', 'Documentation de base, Information technique, Certificats de référence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_41______________', 'fr', 'name', 'Documentation spécifique, Certificats connexes, Rapports de support', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_42______________', 'fr', 'name', 'Billet d''entrée, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_43______________', 'fr', 'name', 'Ticket de stationnement, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_44______________', 'fr', 'name', 'Ticket de stationnement original, Preuve de paiement de la première heure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_45______________', 'fr', 'name', 'Ticket de stationnement journalier, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_46______________', 'fr', 'name', 'Documentation officielle de l''aéronef, Certificat de non-commercial, Autorisation étatique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_47______________', 'fr', 'name', 'Documentation officielle gouvernementale, Certificat de non-commercial, Autorisation gouvernementale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_48______________', 'fr', 'name', 'Documentation officielle des services républicains, Certificat de non-commercial, Autorisation officielle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_49______________', 'fr', 'name', 'Documentation officielle d''aéronef militaire/gouvernemental, Certificat de pays ami, Autorisation de vol non commercial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_50______________', 'fr', 'name', 'Documentation technique du moteur, Historique de maintenance, Certificat du fabricant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_51______________', 'fr', 'name', 'Documentation technique de l''hélice, Historique de maintenance, Certificat du fabricant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_52______________', 'fr', 'name', 'Documentation technique de l''aéronef, Historique de vol, Certificat de navigabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_53______________', 'fr', 'name', 'Rapport de réparation, Documentation technique, Certificat d''atelier', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_54______________', 'fr', 'name', 'Rapport de modification, Documentation technique détaillée, Certificat de modification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_55______________', 'fr', 'name', 'Documentation de l''entreprise, Certificat d''opérateur, Plan d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_56______________', 'fr', 'name', 'Dossier complet, Documentation technique, Certificats de catégorisation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_57______________', 'fr', 'name', 'Demande d''inspection, Documentation opérationnelle, Plan d''opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_58______________', 'fr', 'name', 'Demande d''inspection détaillée, Documentation opérationnelle complète, Plan d''opérations étendu', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_59______________', 'fr', 'name', 'Demande d''inspection spéciale, Documentation historique complète, Plan d''opérations rétrospectif', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_60______________', 'fr', 'name', 'Licence d''exploitation étrangère, Certificats de l''aéronef, Documentation d''assurances', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_61______________', 'fr', 'name', 'Documentation mise à jour du transporteur, Certificats renouvelés, Rapports d''opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_62______________', 'fr', 'name', 'Documentation historique complète, Rapports de sécurité, Registres de maintenance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_63______________', 'fr', 'name', 'Demande de licence, Documentation de l''entreprise, Plan d''opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_64______________', 'fr', 'name', 'Documentation mise à jour, Rapports de performance, Modifications du plan d''opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_65______________', 'fr', 'name', 'Documentation historique complète, Rapports d''audit, Évaluation de conformité intégrale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_66______________', 'fr', 'name', 'Demande de certificat, Documentation de flotte, Plan d''opérations de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_67______________', 'fr', 'name', 'Documentation mise à jour, Rapports de performance, Modifications des opérations de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_68______________', 'fr', 'name', 'Documentation historique complète, Rapports de sécurité, Évaluation intégrale des opérations de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_69______________', 'fr', 'name', 'Demande de certificat de fret, Documentation de flotte de fret, Plan d''opérations de fret', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_70______________', 'fr', 'name', 'Documentation mise à jour des opérations de fret, Rapports de performance, Modifications de flotte de fret', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_71______________', 'fr', 'name', 'Documentation historique complète des opérations de fret, Rapports de sécurité, Évaluation intégrale du transport de fret', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_72______________', 'fr', 'name', 'Demande d''autorisation, Documentation des aéronefs d''aviation générale, Plan d''opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_73______________', 'fr', 'name', 'Documentation mise à jour de l''aviation générale, Rapports de performance, Modifications des opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_74______________', 'fr', 'name', 'Documentation historique complète de l''aviation générale, Rapports de sécurité, Évaluation intégrale des opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_75______________', 'fr', 'name', 'Proposition de spécifications, Documentation technique des aéronefs, Plan opérationnel détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_76______________', 'fr', 'name', 'Documentation mise à jour, Rapports de performance opérationnelle, Modifications proposées', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_77______________', 'fr', 'name', 'Documentation historique complète, Rapports de sécurité, Évaluation intégrale des opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_78______________', 'fr', 'name', 'Demande de modification, Documentation mise à jour des aéronefs, Justification des changements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_79______________', 'fr', 'name', 'Documentation supplémentaire, Rapports de performance, Propositions d''amélioration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_80______________', 'fr', 'name', 'Documentation historique complète, Rapports de sécurité, Évaluation intégrale des modifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_81______________', 'fr', 'name', 'Statuts de l''aéroclub, Programmes de formation, Certification des instructeurs, Installations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_82______________', 'fr', 'name', 'Plan d''études professionnel, Certifications des instructeurs, Documentation des installations, Accréditations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_83______________', 'fr', 'name', 'Documentation technique des services, Certifications des systèmes, Plan de contrôle du trafic aérien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_84______________', 'fr', 'name', 'Documentation de contrôle de zone terminale, Systèmes de gestion du trafic, Certifications spécialisées', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_85______________', 'fr', 'name', 'Plans de l''aérodrome, Certifications d''infrastructure, Documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_86______________', 'fr', 'name', 'Étude topographique, Évaluation du terrain, Documentation de propriété', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_87______________', 'fr', 'name', 'Documentation technique complète, Certifications de conformité, Rapports de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_88______________', 'fr', 'name', 'Documentation des exigences AR 5,7, Rapports techniques, Certifications de conformité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_89______________', 'fr', 'name', 'Documentation de poids, Certificat d''aéronef, Rapports techniques de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_90______________', 'fr', 'name', 'Documentation de poids détaillée, Certificat d''aéronef, Rapports techniques de plage de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_91______________', 'fr', 'name', 'Documentation de poids complexe, Certificat d''aéronef de grande envergure, Rapports techniques spécialisés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_92______________', 'fr', 'name', 'Documentation de poids exhaustive, Certificat d''aéronef de très grande envergure, Rapports techniques intégraux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_93______________', 'fr', 'name', 'Documentation de poids ultra-détaillée, Certificat d''aéronef de dimension maximale, Rapports techniques avancés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_94______________', 'fr', 'name', 'Documentation de poids de complexité maximale, Certificat d''aéronef de dimensions exceptionnelles, Rapports techniques spécialisés de haut niveau', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_95______________', 'fr', 'name', 'Historique de maintenance, Registre des inspections précédentes, Documentation technique mise à jour', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_96______________', 'fr', 'name', 'Certification professionnelle, Pièce d''identité, Certificat médical, Preuve de formation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_97______________', 'fr', 'name', 'Certification technique, Pièce d''identité, Certificat médical, Preuve de formation spécialisée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_98______________', 'fr', 'name', 'Certification de compétence, Pièce d''identité, Certificat médical, Preuve de formation spécialisée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_99______________', 'fr', 'name', 'Licence de contrôleur en cours de validité, Documentation de spécialisation, Certificat de formation complémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_100_____________', 'fr', 'name', 'Documentation professionnelle spécifique, Certifications connexes, Preuve de formation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_101_____________', 'fr', 'name', 'Justificatif d''inscription, Pièce d''identité, Photographie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_102_____________', 'fr', 'name', 'Documentation de l''aéronef étranger, Certificat de poids, Autorisation d''opération internationale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_103_____________', 'fr', 'name', 'Contrat de base opérationnelle, Documentation de l''aéronef, Certificat de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_104_____________', 'fr', 'name', 'Documentation de l''aéronef national, Certificat de poids, Registre des opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_105_____________', 'fr', 'name', 'Billet de vol, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_106_____________', 'fr', 'name', 'Billet de vol international, Passeport, Documents de voyage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_107_____________', 'fr', 'name', 'Billet de vol international, Passeport, Visa', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_108_____________', 'fr', 'name', 'Reçu de carburant, Registre de vol, Documentation de l''aéronef', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_109_____________', 'fr', 'name', 'Reçu de carburant international, Registre de vol international, Documentation de l''aéronef', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_110_____________', 'fr', 'name', 'Plan de vol, Certificat d''aéronef, Autorisation d''atterrissage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_111_____________', 'fr', 'name', 'Plan de vol, Documentation d''aéronef local', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_112_____________', 'fr', 'name', 'Plan de vol détaillé, Certificat d''aéronef, Autorisation de vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_113_____________', 'fr', 'name', 'Plan de vol local, Documentation d''aéronef régional', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_114_____________', 'fr', 'name', 'Documentation d''aéronef, Catégorie d''opération, Certificats d''enregistrement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_115_____________', 'fr', 'name', 'Licence de pilote, Documentation d''expérience de vol, Certificat médical', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_116_____________', 'fr', 'name', 'Certification professionnelle, Documentation de formation, Certificat médical', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_117_____________', 'fr', 'name', 'Licence étrangère originale, Certification d''origine, Documentation d''expérience', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_118_____________', 'fr', 'name', 'Licence de pilote en cours de validité, Certification d''expérience d''instruction, Documentation de formation pédagogique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_119_____________', 'fr', 'name', 'Carte d''étudiant en cours de validité, Justificatif d''inscription actuel, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_120_____________', 'fr', 'name', 'Licence en cours de validité, Certification d''activité récente, Certificat médical mis à jour', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_121_____________', 'fr', 'name', 'Licence de base, Documentation de spécialisation, Certificat de formation spécifique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_122_____________', 'fr', 'name', 'Licence originale, Documentation d''habilitations supplémentaires, Certificats complémentaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_123_____________', 'fr', 'name', 'Billet de vol national, Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_124_____________', 'fr', 'name', 'Billet de vol CEMAC, Passeport, Documents de voyage régional', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_125_____________', 'fr', 'name', 'Facture de fret, Manifeste de chargement, Documentation des bagages', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_126_____________', 'fr', 'name', 'Plan de vol, Autorisation d''opération, Documentation de l''aéronef', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_127_____________', 'fr', 'name', 'Justificatif d''extension initiale, Plan de vol mis à jour, Autorisation supplémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_128_____________', 'fr', 'name', 'Demande d''utilisation de passerelle, Information de vol, Documentation de l''aéronef', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_129_____________', 'fr', 'name', 'Extension d''utilisation de passerelle, Justification du retard, Information de vol supplémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_130_____________', 'fr', 'name', 'Justification d''utilisation prolongée, Information détaillée de vol, Autorisation spéciale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_131_____________', 'fr', 'name', 'Certificat de poids de l''aéronef, Documentation technique détaillée, Spécifications d''aéronef de grande envergure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_132_____________', 'fr', 'name', 'Demande d''utilisation d''installations spéciales, Plan de vol détaillé, Documentation d''aéronef de grande envergure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_133_____________', 'fr', 'name', 'Extension d''utilisation d''installations, Justification du retard, Information de vol supplémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_134_____________', 'fr', 'name', 'Plan de vol national, Documentation de l''aéronef, Autorisation de vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_135_____________', 'fr', 'name', 'Plan de vol régional, Documentation de l''aéronef, Autorisation de vol international', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_136_____________', 'fr', 'name', 'Plan de vol international, Documentation complète de l''aéronef, Autorisations de survol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_137_____________', 'fr', 'name', 'Demande de service, Documentation de l''aéronef, Détails d''opération', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_138_____________', 'fr', 'name', 'Reçu de vente, Certificat de qualité du carburant, Registre de fourniture', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_139_____________', 'fr', 'name', 'Billet de vol, Pièce d''identité, Passeport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_140_____________', 'fr', 'name', 'Plan de vol international, Autorisation de vol charter, Documentation de carburant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_141_____________', 'fr', 'name', 'Manifeste de fret, Documentation d''origine nationale, Certificat de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_142_____________', 'fr', 'name', 'Manifeste de fret, Documentation d''origine CEMAC, Certificat de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_143_____________', 'fr', 'name', 'Manifeste de fret international, Documentation d''origine, Certificat de poids', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_144_____________', 'fr', 'name', 'Billet de vol national, Documentation des bagages, Carte d''embarquement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_145_____________', 'fr', 'name', 'Billet de vol international, Documentation des bagages, Carte d''embarquement internationale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_146_____________', 'fr', 'name', 'Certificat de poids, Documentation de l''aéronef, Plan de vol international', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_147_____________', 'fr', 'name', 'Certificat de navigabilité, Manuel d''exploitation, Certification masse et centrage à jour', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_148_____________', 'fr', 'name', 'Certificat de navigabilité spécial, Manuel d''exploitation étendu, Certification masse et centrage renforcée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_149_____________', 'fr', 'name', 'Certificat de navigabilité standard, Manuel d''exploitation de base, Certification masse et centrage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_150_____________', 'fr', 'name', 'Certificat de navigabilité intermédiaire, Manuel d''exploitation complet, Certification masse et centrage détaillée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_151_____________', 'fr', 'name', 'Certificat de navigabilité avancé, Manuel d''exploitation étendu, Certification masse et centrage complète', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_152_____________', 'fr', 'name', 'Registre du commerce, licence d''activité commerciale, attestation fiscale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_153_____________', 'fr', 'name', 'Licence municipale, registre commercial, certificat de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_154_____________', 'fr', 'name', 'Pièce d''identité, certificat de résidence, autorisation municipale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_155_____________', 'fr', 'name', 'Registre du commerce, attestation bancaire, déclaration d''activités commerciales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_156_____________', 'fr', 'name', 'Formulaire d''enregistrement des prix, justification des coûts', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_157_____________', 'fr', 'name', 'Facture commerciale, liste de colisage, certificat d''origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_158_____________', 'fr', 'name', 'Certificat sanitaire, certificat vétérinaire, licence de manipulation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_159_____________', 'fr', 'name', 'Certificat d''authenticité, évaluation artistique, permis culturel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_160_____________', 'fr', 'name', 'Demande de changement, documentation actuelle, justification du changement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_161_____________', 'fr', 'name', 'Acte de modification, registre du commerce actualisé, certification fiscale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_162_____________', 'fr', 'name', 'Demande de changement, licence actuelle, justification du changement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_163_____________', 'fr', 'name', 'Références professionnelles, plan d''activité, documents d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_164_____________', 'fr', 'name', 'Documents de transport, déclaration douanière, certificat d''origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_165_____________', 'fr', 'name', 'Procès-verbal de saisie, rapport d''évaluation, documentation légale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_166_____________', 'fr', 'name', 'Plan d''affaires, états financiers, certificats de conformité légale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_167_____________', 'fr', 'name', 'Demande temporaire, justification du délai, documentation de base', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_168_____________', 'fr', 'name', 'Documentation spécialisée, certifications spécifiques, plan détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_169_____________', 'fr', 'name', 'Plan de distribution, certificats de qualité, licences de produit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_170_____________', 'fr', 'name', 'Certificat forestier, permis d''abattage, documentation environnementale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_171_____________', 'fr', 'name', 'Certificat de transformation, licence industrielle, documentation environnementale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_172_____________', 'fr', 'name', 'Formulaire commercial, données entreprise, registre d''activité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_173_____________', 'fr', 'name', 'Identification commerciale, historique activité, documents entreprise', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_174_____________', 'fr', 'name', 'Licence commerciale, inspection locale, documents constitutifs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_175_____________', 'fr', 'name', 'Demande de recherche, identification documents, justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_176_____________', 'fr', 'name', 'Acte dissolution, bilan final, certificats fiscaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_177_____________', 'fr', 'name', 'Liste marchandises, justification temporaire, garantie retour', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_178_____________', 'fr', 'name', 'Déclaration valeur CAF, documents importation, certificat origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_179_____________', 'fr', 'name', 'Facture commerciale, documents techniques, certificats d''authenticité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_180_____________', 'fr', 'name', 'Facture pro forma, liste de colisage, certificats d''origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_181_____________', 'fr', 'name', 'Facture originale, documents commerciaux, certification consulaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_182_____________', 'fr', 'name', 'Facture commerciale, déclaration justificative, documentation supplémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_183_____________', 'fr', 'name', 'Facture originale, explication non-visa, documentation complémentaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_184_____________', 'fr', 'name', 'Licence internationale, assurance responsabilité civile, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_185_____________', 'fr', 'name', 'Permis international, assurance artistes, programme détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_186_____________', 'fr', 'name', 'Plan sécurité, permis municipaux, assurance responsabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_187_____________', 'fr', 'name', 'Liste participants, assurance groupe, programme représentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_188_____________', 'fr', 'name', 'Liste personnel, assurance collective, plan scène', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_189_____________', 'fr', 'name', 'Plan logistique, assurance étendue, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_190_____________', 'fr', 'name', 'Visas artistes, assurance internationale, programme détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_191_____________', 'fr', 'name', 'Documentation migratoire, assurance collective internationale, plan technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_192_____________', 'fr', 'name', 'Plan logistique international, assurance globale, certifications techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_193_____________', 'fr', 'name', 'Plan gestion massive, assurances spéciales, certification infrastructure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_194_____________', 'fr', 'name', 'Licence projection, plan urgence, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_195_____________', 'fr', 'name', 'Licence distribution, catalogue contenus, droits auteur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_196_____________', 'fr', 'name', 'Licence projection, catalogue autorisé, permis municipal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_197_____________', 'fr', 'name', 'Registre local, inventaire vidéos, permis communal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_198_____________', 'fr', 'name', 'Licence distribution, catalogue produits, droits commerciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_199_____________', 'fr', 'name', 'Accréditation professionnelle, assurance équipement, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_200_____________', 'fr', 'name', 'Permis tournage, plan tournage, assurance production', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_201_____________', 'fr', 'name', 'Licence commerciale, registre produits, certification original', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_202_____________', 'fr', 'name', 'Carte artiste, programme musical, assurance représentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_203_____________', 'fr', 'name', 'Visa artiste, assurance internationale, programme détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_204_____________', 'fr', 'name', 'Licence commerciale, assurance équipements, certification professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_205_____________', 'fr', 'name', 'Identification professionnelle, permis mobile, assurance basique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_206_____________', 'fr', 'name', 'Licence imprimerie, registre commercial, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_207_____________', 'fr', 'name', 'Permis installation, design publicitaire, assurance responsabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_208_____________', 'fr', 'name', 'Plan technique, permis urbanisme, assurance installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_209_____________', 'fr', 'name', 'Spécifications techniques, permis installation, certification sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_210_____________', 'fr', 'name', 'Design panneau, permis basique, fiche technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_211_____________', 'fr', 'name', 'Schéma panneau, autorisation basique, données techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_212_____________', 'fr', 'name', 'Design basique, permis simple, spécifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_213_____________', 'fr', 'name', 'Format panneau, permis réduit, données installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_214_____________', 'fr', 'name', 'Documentation identité, portfolio artistique, certification professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_215_____________', 'fr', 'name', 'Copie film, synopsis détaillé, classification proposée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_216_____________', 'fr', 'name', 'Contrat artistes, plan recettes, registre comptable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_217_____________', 'fr', 'name', 'Document identité, ticket entrée, registre visiteur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_218_____________', 'fr', 'name', 'Licence commerciale, registre artisan, certification local', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_219_____________', 'fr', 'name', 'Plan activité, registre artisan, permis municipal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_220_____________', 'fr', 'name', 'Inventaire œuvres, assurance objets, certification exposition', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_221_____________', 'fr', 'name', 'Design enseigne, permis urbanisme, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_222_____________', 'fr', 'name', 'Licence professionnelle, certification sanitaire, assurance établissement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_223_____________', 'fr', 'name', 'Permis commercial, certificat hygiène, assurance responsabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_224_____________', 'fr', 'name', 'Registre basique, certification hygiène, assurance basique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_225_____________', 'fr', 'name', 'Design signalisation, permis municipal, certification installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_226_____________', 'fr', 'name', 'Demande temporaire, design enseigne, durée prévue', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_227_____________', 'fr', 'name', 'Portfolio artistique, diplôme formation, certification professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_228_____________', 'fr', 'name', 'Licence touristique, assurance responsabilité, garantie financière', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_229_____________', 'fr', 'name', 'Certification luxe, plan opérationnel, licences complètes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_230_____________', 'fr', 'name', 'Certification supérieure, plan services, licences hôtelières', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_231_____________', 'fr', 'name', 'Plan opérations, certification standard, permis basiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_232_____________', 'fr', 'name', 'Licence basique, plan fonctionnement, certification minimale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_233_____________', 'fr', 'name', 'Permis hébergement, normes basiques, assurance responsabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_234_____________', 'fr', 'name', 'Documentation technique, rapport évaluation, standards respectés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_235_____________', 'fr', 'name', 'Licence restauration, certification sanitaire, plan opérationnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_236_____________', 'fr', 'name', 'Permis hôtellerie, certificat hygiène, plan fonctionnement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_237_____________', 'fr', 'name', 'Licence hôtellerie, certification sanitaire, plan qualité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_238_____________', 'fr', 'name', 'Permis commercial, certificat santé, plan opérationnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_239_____________', 'fr', 'name', 'Licence premium, plan sécurité, certification acoustique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_240_____________', 'fr', 'name', 'Permis hôtellerie, normes sécurité, contrôle son', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_241_____________', 'fr', 'name', 'Licence basique, permis locaux, normes minimales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_242_____________', 'fr', 'name', 'Licence spéciale, plan sécurité avancé, certification acoustique premium', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_243_____________', 'fr', 'name', 'Licence nocturne, contrôle son, plan urgence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_244_____________', 'fr', 'name', 'Licence jeu, plan sécurité spécial, garantie financière', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_245_____________', 'fr', 'name', 'Registre machine, certification technique, contrôle fiscal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_246_____________', 'fr', 'name', 'Registre table, licence croupier, contrôle opérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_247_____________', 'fr', 'name', 'Licence jeux hasard, certification machines, plan sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_248_____________', 'fr', 'name', 'Registre machine, contrôle technique, certificat opération', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_249_____________', 'fr', 'name', 'Licence tirages, garantie financière, plan opérationnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_250_____________', 'fr', 'name', 'Déclaration prix, identification gagnant, justificatif paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_251_____________', 'fr', 'name', 'Permis tirage, liste prix, plan organisation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_252_____________', 'fr', 'name', 'Accréditation professionnelle, plan tournage, assurance spécialisée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_253_____________', 'fr', 'name', 'Registre cinéaste, permis safari, plan enregistrement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_254_____________', 'fr', 'name', 'Document identité, justificatif résidence, formulaire visite', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_255_____________', 'fr', 'name', 'Passeport, visa touristique, itinéraire visite', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_256_____________', 'fr', 'name', 'Licence commerciale, garantie financière, plan opérationnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_257_____________', 'fr', 'name', 'Registre commercial, assurance responsabilité, plan ventes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_258_____________', 'fr', 'name', 'Licence opérateur, assurance voyages, certification professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_259_____________', 'fr', 'name', 'Licence double, assurances véhicules, plan commercial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_260_____________', 'fr', 'name', 'Pièce d''identité, casier judiciaire, certificat d''aptitude psychologique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_261_____________', 'fr', 'name', 'Facture d''achat, certificat d''origine, permis d''exportation du pays d''origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_262_____________', 'fr', 'name', 'Permis de chasse, facture d''achat, spécifications techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_263_____________', 'fr', 'name', 'Licence en cours, enregistrement de l''arme, pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_264_____________', 'fr', 'name', 'Registre des armes, identification propriétaire, certificats d''achat', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_265_____________', 'fr', 'name', 'Demande formelle, identification du demandeur, plan de construction', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_266_____________', 'fr', 'name', 'Permis d''abattage, identification du demandeur, plan de construction', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_267_____________', 'fr', 'name', 'Registre pêcheur, spécifications embarcation, licence navigation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_268_____________', 'fr', 'name', 'Certificat navigabilité, registre embarcation, plan mise à l''eau', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_269_____________', 'fr', 'name', 'Demande d''échouage, registre embarcation, plan sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_270_____________', 'fr', 'name', 'Titre propriété, certificat navigabilité, assurance maritime', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_271_____________', 'fr', 'name', 'Spécifications moteur, certificat installation, inspection technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_272_____________', 'fr', 'name', 'Registre moteur/voile, certificat sécurité, documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_273_____________', 'fr', 'name', 'Registre pirogue, spécifications moteur, licence navigation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_274_____________', 'fr', 'name', 'Registre embarcation, certificat propriétaire, inspection basique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_275_____________', 'fr', 'name', 'Certificat tonnage, documentation technique, inspection navale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_276_____________', 'fr', 'name', 'Demande temporaire, documentation basique, garantie financière', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_277_____________', 'fr', 'name', 'Documentation complète, inspection finale, certificats en vigueur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_278_____________', 'fr', 'name', 'Titre propriété, certificat enregistrement, documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_279_____________', 'fr', 'name', 'Identification propriétaire, spécifications équipement, licence pêche', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_280_____________', 'fr', 'name', 'Facture moteur, spécifications techniques, certificat puissance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_281_____________', 'fr', 'name', 'Certificat compétence, examen nautique, documents identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_282_____________', 'fr', 'name', 'Registre embarcation, liste équipage, certificat navigabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_283_____________', 'fr', 'name', 'Liste passagers, plan navigation, certificats sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_284_____________', 'fr', 'name', 'Certificat expérience, examen nautique, documents identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_285_____________', 'fr', 'name', 'Contrat vente, documents identité, ancien registre', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_286_____________', 'fr', 'name', 'Titre propriété, plans terrain, permis municipaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_287_____________', 'fr', 'name', 'Certificat de naissance, pièce d''identité du tuteur légal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_288_____________', 'fr', 'name', 'Carte d''identité de l''étudiant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_289_____________', 'fr', 'name', 'Pièce d''identité avec photo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_290_____________', 'fr', 'name', 'Pièce d''identité, relevé de notes, certificat médical', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_291_____________', 'fr', 'name', 'Projet éducatif, certificats d''éducation et de santé du personnel, permis des locaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_292_____________', 'fr', 'name', 'Pièce d''identité, relevé de notes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_293_____________', 'fr', 'name', 'Pièce d''identité, certificats d''études du pays d''origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_294_____________', 'fr', 'name', 'Pièce d''identité, certificats d''études', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_295_____________', 'fr', 'name', 'Pièce d''identité, justificatif de perte du document original', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_296_____________', 'fr', 'name', 'Pièce d''identité, relevé de notes, paiement des droits d''examen', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_297_____________', 'fr', 'name', 'Carte d''identité de l''étudiant, relevé de notes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_298_____________', 'fr', 'name', 'Pièce d''identité, relevé de notes, paiement des droits d''inscription', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_299_____________', 'fr', 'name', 'Statuts sociaux, acte constitutif, identification actionnaires, plan d''affaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_300_____________', 'fr', 'name', 'Acte de constitution, identification associés, capital social, plan opérationnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_301_____________', 'fr', 'name', 'Plan d''investissement, états financiers, garanties bancaires, projections financières', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_302_____________', 'fr', 'name', 'Identification personnelle, plan d''activité, registre fiscal, déclaration patrimoine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_303_____________', 'fr', 'name', 'Relevés bancaires, historique crédit, bilan financier, certification bancaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_304_____________', 'fr', 'name', 'Identification expéditeur, documentation destination, justification transfert', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_305_____________', 'fr', 'name', 'Formulaire transfert, identification bancaire, justificatif opération', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_306_____________', 'fr', 'name', 'Fiches de paie, déclaration revenus, identification fiscale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_307_____________', 'fr', 'name', 'Justificatifs revenus étrangers, documentation fiscale, certificats bancaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_308_____________', 'fr', 'name', 'Documentation véhicule, identification propriétaire, inspection technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_309_____________', 'fr', 'name', 'Documentation actuelle, justificatif résidence, identification personnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_310_____________', 'fr', 'name', 'Déclarations fiscales, justificatifs paiement, historique fiscal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_311_____________', 'fr', 'name', '- Licence d''importation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_312_____________', 'fr', 'name', '- Registre du commerce', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_313_____________', 'fr', 'name', '- Certificat d''autorisation du fabricant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_314_____________', 'fr', 'name', '- Business plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_315_____________', 'fr', 'name', '- Certificats techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_316_____________', 'fr', 'name', '- Licence d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_317_____________', 'fr', 'name', '- Plan technique du réseau', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_318_____________', 'fr', 'name', '- Contrats avec les fournisseurs de contenu', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_319_____________', 'fr', 'name', '- Étude de faisabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_320_____________', 'fr', 'name', '- Licence commerciale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_321_____________', 'fr', 'name', '- Plan de sécurité informatique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_322_____________', 'fr', 'name', '- Contrat FAI', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_323_____________', 'fr', 'name', '- Certificat d''équipement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_324_____________', 'fr', 'name', '- Plan du local', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_325_____________', 'fr', 'name', '- Licence commerciale de première catégorie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_326_____________', 'fr', 'name', '- Inventaire des équipements professionnels', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_327_____________', 'fr', 'name', '- Certification technique du personnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_328_____________', 'fr', 'name', '- Plan d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_329_____________', 'fr', 'name', '- Assurance professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_330_____________', 'fr', 'name', '- Licence commerciale de deuxième catégorie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_331_____________', 'fr', 'name', '- Liste des équipements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_332_____________', 'fr', 'name', '- Certificats de formation du personnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_333_____________', 'fr', 'name', '- Plan de services', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_334_____________', 'fr', 'name', '- Assurance responsabilité civile', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_335_____________', 'fr', 'name', '- Licence commerciale de base', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_336_____________', 'fr', 'name', '- Inventaire basique des équipements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_337_____________', 'fr', 'name', '- Certificat de formation de base', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_338_____________', 'fr', 'name', '- Plan d''exploitation simplifié', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_339_____________', 'fr', 'name', '- Assurance de base', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_340_____________', 'fr', 'name', '- Design de l''affiche', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_341_____________', 'fr', 'name', '- Autorisation d''emplacement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_342_____________', 'fr', 'name', '- Certificat de sécurité électrique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_343_____________', 'fr', 'name', '- Plan d''installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_344_____________', 'fr', 'name', '- Étude d''impact visuel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_345_____________', 'fr', 'name', '- Plan structurel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_346_____________', 'fr', 'name', '- Design publicitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_347_____________', 'fr', 'name', '- Autorisation du propriétaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_348_____________', 'fr', 'name', '- Certificat de conformité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_349_____________', 'fr', 'name', '- Carte grise du véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_350_____________', 'fr', 'name', '- Photos du véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_351_____________', 'fr', 'name', '- Design de la fresque', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_352_____________', 'fr', 'name', '- Permis municipal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_353_____________', 'fr', 'name', '- Certificat de durabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_354_____________', 'fr', 'name', '- Plan d''entretien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_355_____________', 'fr', 'name', '- Contenu du message', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_356_____________', 'fr', 'name', '- Durée prévue', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_357_____________', 'fr', 'name', '- Plan d''installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_358_____________', 'fr', 'name', '- Certificat de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_359_____________', 'fr', 'name', '- Matériel publicitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_360_____________', 'fr', 'name', '- Contrat de publication', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_361_____________', 'fr', 'name', '- Spécifications techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_362_____________', 'fr', 'name', '- Épreuve de conception', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_363_____________', 'fr', 'name', '- Calendrier de publication', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_364_____________', 'fr', 'name', '- Permis d''installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_365_____________', 'fr', 'name', '- Certificat électrique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_366_____________', 'fr', 'name', '- Spécifications techniques avancées', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_367_____________', 'fr', 'name', '- Permis spécial d''installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_368_____________', 'fr', 'name', '- Certificat électrique renforcé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_369_____________', 'fr', 'name', '- Étude d''impact environnemental', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_370_____________', 'fr', 'name', '- Plan de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_371_____________', 'fr', 'name', '- Plan média', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_372_____________', 'fr', 'name', '- Échantillons de matériel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_373_____________', 'fr', 'name', '- Licence publicitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_374_____________', 'fr', 'name', '- Calendrier de diffusion', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_375_____________', 'fr', 'name', '- Contrat de services', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_376_____________', 'fr', 'name', '- Matériel publicitaire en N/B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_377_____________', 'fr', 'name', '- Formulaire de demande', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_378_____________', 'fr', 'name', '- Preuve de paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_379_____________', 'fr', 'name', '- Autorisation de l''annonceur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_380_____________', 'fr', 'name', '- Matériel publicitaire en couleur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_381_____________', 'fr', 'name', '- Épreuve couleur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_382_____________', 'fr', 'name', '- Matériel publicitaire N/B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_383_____________', 'fr', 'name', '- Spécifications demi-page', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_384_____________', 'fr', 'name', '- Matériel publicitaire quadrichromie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_385_____________', 'fr', 'name', '- Épreuve couleur calibrée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_386_____________', 'fr', 'name', '- Spécifications quart de page', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_387_____________', 'fr', 'name', '- Matériel publicitaire bichromie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_388_____________', 'fr', 'name', '- Spécifications huitième de page', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_389_____________', 'fr', 'name', '- Matériel publicitaire mixte', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_390_____________', 'fr', 'name', '- Fichier numérique de la bannière', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_391_____________', 'fr', 'name', '- Plan de campagne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_392_____________', 'fr', 'name', '- Fichier numérique HD', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_393_____________', 'fr', 'name', '- Plan de visualisation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_394_____________', 'fr', 'name', '- Fichier vidéo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_395_____________', 'fr', 'name', '- Droits d''auteur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_396_____________', 'fr', 'name', '- Fichier numérique premium', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_397_____________', 'fr', 'name', '- Plan d''exposition', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_398_____________', 'fr', 'name', '- Fichier numérique optimisé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_399_____________', 'fr', 'name', '- Plan de visibilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_400_____________', 'fr', 'name', '- Fichier numérique haute résolution', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_401_____________', 'fr', 'name', '- Stratégie d''exposition', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_402_____________', 'fr', 'name', '- Fichier vidéo HD', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_403_____________', 'fr', 'name', '- Droits de reproduction', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_404_____________', 'fr', 'name', '- Licence commerciale premium', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_405_____________', 'fr', 'name', '- Inventaire détaillé', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_406_____________', 'fr', 'name', '- Licence commerciale standard', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_407_____________', 'fr', 'name', '- Assurance minimale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_408_____________', 'fr', 'name', '- Texte de la dédicace', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_409_____________', 'fr', 'name', '- Identification du demandeur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_410_____________', 'fr', 'name', '- Horaire souhaité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_411_____________', 'fr', 'name', '- Texte du communiqué', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_412_____________', 'fr', 'name', '- Identification de l''émetteur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_413_____________', 'fr', 'name', '- Autorisation de diffusion', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_414_____________', 'fr', 'name', '- Durée exacte', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_415_____________', 'fr', 'name', '- Préférences horaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_416_____________', 'fr', 'name', '- Texte du message', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_417_____________', 'fr', 'name', '- Date de diffusion', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_418_____________', 'fr', 'name', '- Photo numérique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_419_____________', 'fr', 'name', '- Texte de l''annonce', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_420_____________', 'fr', 'name', '- Autorisation d''utilisation d''image', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_421_____________', 'fr', 'name', '- Texte de l''annonce', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_422_____________', 'fr', 'name', '- Décompte des mots', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_423_____________', 'fr', 'name', '- Préférence horaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_424_____________', 'fr', 'name', '- Plan de diffusion', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_425_____________', 'fr', 'name', '- Texte pour défilement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_426_____________', 'fr', 'name', '- Design graphique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_427_____________', 'fr', 'name', '- Durée demandée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_428_____________', 'fr', 'name', '- Plan publicitaire annuel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_429_____________', 'fr', 'name', '- Contrat annuel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_430_____________', 'fr', 'name', '- Calendrier des diffusions', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_431_____________', 'fr', 'name', '- Licence éditoriale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_432_____________', 'fr', 'name', '- Plan d''affaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_433_____________', 'fr', 'name', '- Échantillon de contenu', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_434_____________', 'fr', 'name', '- Registre commercial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_435_____________', 'fr', 'name', '- Licence de presse', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_436_____________', 'fr', 'name', '- Plan éditorial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_437_____________', 'fr', 'name', '- Structure organisationnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_438_____________', 'fr', 'name', '- Plan du kiosque', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_439_____________', 'fr', 'name', '- Contrat de distribution', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_440_____________', 'fr', 'name', '- Licence de distribution', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_441_____________', 'fr', 'name', '- Plan logistique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_442_____________', 'fr', 'name', '- Contrats éditoriaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_443_____________', 'fr', 'name', '- Registre des véhicules', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_444_____________', 'fr', 'name', '- Licence professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_445_____________', 'fr', 'name', '- Portfolio de services', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_446_____________', 'fr', 'name', '- Registre d''entreprise', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_447_____________', 'fr', 'name', '- Demande d''immatriculation temporaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_448_____________', 'fr', 'name', '- Pièce d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_449_____________', 'fr', 'name', '- Documentation du véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_450_____________', 'fr', 'name', '- Assurance temporaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_451_____________', 'fr', 'name', '- Justificatif de paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_452_____________', 'fr', 'name', '- Demande de permis B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_453_____________', 'fr', 'name', '- Certificat médical', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_454_____________', 'fr', 'name', '- Photos récentes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_455_____________', 'fr', 'name', '- Attestation de formation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_456_____________', 'fr', 'name', '- Demande de permis B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_457_____________', 'fr', 'name', '- Certificat de formation spécifique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_458_____________', 'fr', 'name', '- Demande de permis C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_459_____________', 'fr', 'name', '- Certificat médical spécial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_460_____________', 'fr', 'name', '- Certificat d''aptitude professionnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_461_____________', 'fr', 'name', '- Demande de permis D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_462_____________', 'fr', 'name', '- Certificat médical professionnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_463_____________', 'fr', 'name', '- Certificat d''aptitude au transport de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_464_____________', 'fr', 'name', '- Demande d''immatriculation définitive', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_465_____________', 'fr', 'name', '- Documentation complète du véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_466_____________', 'fr', 'name', '- Assurance en cours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_467_____________', 'fr', 'name', '- Certificat technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_468_____________', 'fr', 'name', '- Demande de permis', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_469_____________', 'fr', 'name', '- Demande de permis E', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_470_____________', 'fr', 'name', '- Certificat de formation remorque', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_471_____________', 'fr', 'name', '- Permis précédent', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_472_____________', 'fr', 'name', '- Certificat médical en cours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_473_____________', 'fr', 'name', '- Déclaration de perte/vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_474_____________', 'fr', 'name', '- Déclaration sur l''honneur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_475_____________', 'fr', 'name', '- Photo récente', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_476_____________', 'fr', 'name', '- Permis précédent (si applicable)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_477_____________', 'fr', 'name', '- Formulaire officiel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_478_____________', 'fr', 'name', '- Justificatif de résidence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_479_____________', 'fr', 'name', '- Documentation supplémentaire selon le cas', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_480_____________', 'fr', 'name', '- Demande d''examen', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_481_____________', 'fr', 'name', '- Certificat de formation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_482_____________', 'fr', 'name', '- Permis expiré', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_483_____________', 'fr', 'name', '- Justificatif du retard', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_484_____________', 'fr', 'name', '- Preuve de paiement avec majoration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_485_____________', 'fr', 'name', '- Justification du retard', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_486_____________', 'fr', 'name', '- Permis original', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_487_____________', 'fr', 'name', '- Traduction officielle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_488_____________', 'fr', 'name', '- Certificat de validité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_489_____________', 'fr', 'name', '- Justificatif de domicile', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_490_____________', 'fr', 'name', '- Permis actuel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_491_____________', 'fr', 'name', '- Formulaire de changement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_492_____________', 'fr', 'name', '- Motif de la certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_493_____________', 'fr', 'name', '- Historique de conduite', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_494_____________', 'fr', 'name', '- Registre des infractions', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_495_____________', 'fr', 'name', '- Certificat de résidence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_496_____________', 'fr', 'name', '- Titre de propriété', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_497_____________', 'fr', 'name', '- Plan du terrain', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_498_____________', 'fr', 'name', '- Demande d''arpentage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_499_____________', 'fr', 'name', '- Identification du propriétaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_500_____________', 'fr', 'name', '- Empreintes digitales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_501_____________', 'fr', 'name', '- Statuts de l''association', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_502_____________', 'fr', 'name', '- Registre des membres', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_503_____________', 'fr', 'name', '- Licences des véhicules', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_504_____________', 'fr', 'name', '- Assurance collective', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_505_____________', 'fr', 'name', '- Licence industrielle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_506_____________', 'fr', 'name', '- Plans d''installation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_507_____________', 'fr', 'name', '- Certificats de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_508_____________', 'fr', 'name', '- Étude environnementale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_509_____________', 'fr', 'name', '- Certificat sanitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_510_____________', 'fr', 'name', '- Plan des installations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_511_____________', 'fr', 'name', '- Registre des fournisseurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_512_____________', 'fr', 'name', '- Système de réfrigération', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_513_____________', 'fr', 'name', '- Licence d''activité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_514_____________', 'fr', 'name', '- Mesures de sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_515_____________', 'fr', 'name', '- Certificat d''habitabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_516_____________', 'fr', 'name', '- Registre fiscal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_517_____________', 'fr', 'name', '- Demande d''emplacement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_518_____________', 'fr', 'name', '- Plan du stand', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_519_____________', 'fr', 'name', '- Liste des produits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_520_____________', 'fr', 'name', '- Certificat de fournisseur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_521_____________', 'fr', 'name', '- Déclaration d''origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_522_____________', 'fr', 'name', '- Certificat de qualité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_523_____________', 'fr', 'name', '- Contrôle sanitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_524_____________', 'fr', 'name', '- Registre de base', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_525_____________', 'fr', 'name', '- Permis de vente', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_526_____________', 'fr', 'name', '- Registre des produits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_527_____________', 'fr', 'name', '- Plan du local', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_528_____________', 'fr', 'name', '- Assurance responsabilité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_529_____________', 'fr', 'name', '- Assurance obligatoire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_530_____________', 'fr', 'name', '- Immatriculation temporaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_531_____________', 'fr', 'name', '- Contrôle technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_532_____________', 'fr', 'name', '- Immatriculation temporaire expirée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_533_____________', 'fr', 'name', '- Documentation actualisée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_534_____________', 'fr', 'name', '- Demande provisoire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_535_____________', 'fr', 'name', '- Justification du besoin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_536_____________', 'fr', 'name', '- Autorisation du fabricant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_537_____________', 'fr', 'name', '- Assurance spéciale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_538_____________', 'fr', 'name', '- Fiche technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_539_____________', 'fr', 'name', '- Plan d''essai', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_540_____________', 'fr', 'name', '- Déclaration de perte', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_541_____________', 'fr', 'name', '- Immatriculation originale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_542_____________', 'fr', 'name', '- Contrat de vente', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_543_____________', 'fr', 'name', '- Pièces d''identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_544_____________', 'fr', 'name', '- Carte grise', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_545_____________', 'fr', 'name', '- Assurance actualisée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_546_____________', 'fr', 'name', 'Licence commerciale, certificat de sécurité, registre fiscal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_547_____________', 'fr', 'name', 'Licence grossiste, certification stockage, permis spéciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_548_____________', 'fr', 'name', 'Documentation navire, certificats sécurité, permis navigation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_549_____________', 'fr', 'name', 'Licence commerciale détaillant, certification stockage, plan sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_550_____________', 'fr', 'name', 'Licence grossiste, certification dépôts, plan distribution', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_551_____________', 'fr', 'name', 'Documents constitutifs, certifications techniques, licences opérationnelles', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_552_____________', 'fr', 'name', 'Demande radiation, liquidation obligations, rapport fermeture', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_553_____________', 'fr', 'name', 'Justification retard, documentation en attente, preuve paiement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_554_____________', 'fr', 'name', 'Licence précédente, inspection installations, certificat sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_555_____________', 'fr', 'name', 'Plan opérationnel, certification stockage, licence commerciale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_556_____________', 'fr', 'name', 'Plan distribution, certification infrastructure, permis spéciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_557_____________', 'fr', 'name', 'Projet technique, étude impact, permis construction', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_558_____________', 'fr', 'name', 'Étude géologique, plan exploitation, évaluation environnementale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_559_____________', 'fr', 'name', 'Plan extraction, étude environnementale, permis locaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_560_____________', 'fr', 'name', 'Registres production, mesures volume, certification technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_561_____________', 'fr', 'name', 'Contrôle production, mesure volume, certificats techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_562_____________', 'fr', 'name', 'Contrat surface, plan exploration, documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_563_____________', 'fr', 'name', 'Plan production, registres opérationnels, certifications techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_564_____________', 'fr', 'name', 'Plan d''ancrage, certification navale, permis maritimes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_565_____________', 'fr', 'name', 'Plan opérationnel étendu, certificats techniques, licences spéciales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_566_____________', 'fr', 'name', 'Plan sismique, certification équipements, permis exploration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_567_____________', 'fr', 'name', 'Programme sismique étendu, certifications avancées, licences spéciales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_568_____________', 'fr', 'name', 'Plan forage, certification sécurité, permis opérationnels', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_569_____________', 'fr', 'name', 'Projet recherche, accréditations techniques, plan travail', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_570_____________', 'fr', 'name', 'Contrat minier, garanties financières, plan exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_571_____________', 'fr', 'name', 'Déclaration ressources, étude technique, rapport évaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_572_____________', 'fr', 'name', 'Contrat location, plans surface, documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_573_____________', 'fr', 'name', 'Plan exploitation, mesure surface, certification activité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_574_____________', 'fr', 'name', 'Documentation du véhicule, CNI propriétaire, assurance en cours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_575_____________', 'fr', 'name', 'Licence commerciale, inspection technique, assurance publique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_576_____________', 'fr', 'name', 'Certification service public, documentation technique, permis spéciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_577_____________', 'fr', 'name', 'Permis spécial transport, inspection poids lourd, certificat professionnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_578_____________', 'fr', 'name', 'Licence touristique, assurance spéciale, documentation véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_579_____________', 'fr', 'name', 'CNI, justificatif domicile, documentation personnelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_580_____________', 'fr', 'name', 'Plan cadastral, titre propriété, demande mesure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_581_____________', 'fr', 'name', 'Titre propriété, plan parcelle, certification cadastrale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_582_____________', 'fr', 'name', 'Documentation propriété, étude topographique, plans détaillés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_583_____________', 'fr', 'name', 'Étude complète propriété, analyse topographique extensive, documentation légale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_584_____________', 'fr', 'name', 'Plan situation, documentation cadastrale, demande implantation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_585_____________', 'fr', 'name', 'Documentation fiscale, plans techniques, certification urbanistique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_586_____________', 'fr', 'name', 'Étude topographique, certification fiscale, documentation urbanistique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_587_____________', 'fr', 'name', 'Étude complète terrain, évaluation fiscale, plans détaillés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_588_____________', 'fr', 'name', 'Étude technique complète, documentation légale, certification fiscale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_589_____________', 'fr', 'name', 'Plan terrain, titre propriété, demande mesure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_590_____________', 'fr', 'name', 'Étude topographique, documentation propriété, plans détaillés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_591_____________', 'fr', 'name', 'Étude complète terrain, documentation légale, analyse technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_592_____________', 'fr', 'name', 'Demande impression, fichier numérique, spécifications format', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_593_____________', 'fr', 'name', 'Demande impression A3, fichier numérique, exigences techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_594_____________', 'fr', 'name', 'Fichier plan, spécifications techniques, format numérique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_595_____________', 'fr', 'name', 'Fichier technique, exigences impression, format numérique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_596_____________', 'fr', 'name', 'Fichier grand format, spécifications techniques, format numérique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_597_____________', 'fr', 'name', 'Documentation propriété, photos biens, identification propriétaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_598_____________', 'fr', 'name', 'Documentation complète, inventaire détaillé, certificats valeur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_599_____________', 'fr', 'name', 'Documentation exhaustive, évaluation préalable, certificats officiels', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_600_____________', 'fr', 'name', 'Documentation complète, audit préalable, certifications spéciales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_601_____________', 'fr', 'name', 'Plans terrain, documentation urbanistique, certificat cadastral', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_602_____________', 'fr', 'name', 'Documentation complète, étude urbanistique, certifications techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_603_____________', 'fr', 'name', 'Passeport valide, formulaire demande, documents justificatifs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_604_____________', 'fr', 'name', 'Passeport, justification séjour, assurance médicale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_605_____________', 'fr', 'name', 'Passeport, plan séjour, documents appui', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_606_____________', 'fr', 'name', 'Passeport valide, justification long séjour, documents économiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_607_____________', 'fr', 'name', 'Visa actuel, justification prolongation, passeport valide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_608_____________', 'fr', 'name', 'Justificatif résidence, document identité, justificatif ressources', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_609_____________', 'fr', 'name', 'Passeport valide, historique résidence, preuve solvabilité économique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_610_____________', 'fr', 'name', 'Document identité, justification entrée, déclaration but', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_611_____________', 'fr', 'name', 'Passeport, visa expiré, justification retard', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_612_____________', 'fr', 'name', 'Demande émigration, documents personnels, plan voyage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_613_____________', 'fr', 'name', 'Document identité, certificat résidence, casier judiciaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_614_____________', 'fr', 'name', 'Passeport, permis séjour, antécédents pays origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_615_____________', 'fr', 'name', 'Déclaration police, identification alternative, déclaration perte', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_616_____________', 'fr', 'name', 'Passeport, visa temporaire, justification demande', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_617_____________', 'fr', 'name', 'Document original, identification demandeur, formulaire demande', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_618_____________', 'fr', 'name', 'Passeport, visa destination, contrat travail international', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_619_____________', 'fr', 'name', 'Certificat naissance, photo identité, empreinte digitale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_620_____________', 'fr', 'name', 'Déclaration perte, identification alternative, photo récente', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_621_____________', 'fr', 'name', 'Document identité, certificat naissance, photos réglementaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_622_____________', 'fr', 'name', 'Déclaration perte, ancien passeport, document identité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_623_____________', 'fr', 'name', 'Ancien passeport, document identité, photos actualisées', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_624_____________', 'fr', 'name', 'Passeport valide, visa résidence, justificatif domicile', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_625_____________', 'fr', 'name', 'Carte précédente, historique résidence, documents actualisation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_626_____________', 'fr', 'name', 'Document identité, description faits, preuves disponibles', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_627_____________', 'fr', 'name', 'Procès-verbal infraction, identification contrevenant, preuves incident', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_628_____________', 'fr', 'name', 'Spécifications techniques, certificats de conformité, documentation du fabricant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_629_____________', 'fr', 'name', 'Documents constitutifs, licences opérationnelles, certificats fiscaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_630_____________', 'fr', 'name', 'Licence importation, registre commercial, documentation douanière', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_631_____________', 'fr', 'name', 'Document identité, inscription fiscale, plan activité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_632_____________', 'fr', 'name', 'Documentation technique, certificats origine, licences exportation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_633_____________', 'fr', 'name', 'Documentation commerciale, licences commerce extérieur, certificats origine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_634_____________', 'fr', 'name', 'Documents modification, identification nouveau titulaire, justificatifs changement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_635_____________', 'fr', 'name', 'Documentation véhicule, fiche technique, permis circulation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_636_____________', 'fr', 'name', 'Documentation véhicule, certificat charge, permis transport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_637_____________', 'fr', 'name', 'Licence transport passagers, inspection technique, assurance voyageurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_638_____________', 'fr', 'name', 'Permis transport collectif, certification technique, assurance obligatoire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_639_____________', 'fr', 'name', 'Licence opérateur, certification capacité, documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_640_____________', 'fr', 'name', 'Certification transport, documentation technique, assurances spéciales', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_641_____________', 'fr', 'name', 'Licence opérateur, certificats sécurité, assurances passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_642_____________', 'fr', 'name', 'Certification cargo, documents marchandises, permis transport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_643_____________', 'fr', 'name', 'Licences multiples, certifications spéciales, assurances combinées', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_644_____________', 'fr', 'name', 'Certification spéciale, permis dangereux, protocoles sécurité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_645_____________', 'fr', 'name', 'Permis circulation, certificat poids, documentation chargement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_646_____________', 'fr', 'name', 'Document identité, permis conduire, carte grise', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_647_____________', 'fr', 'name', 'Permis circulation, certificat technique, documentation véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_648_____________', 'fr', 'name', 'Permis circulation, fiche technique, assurance véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_649_____________', 'fr', 'name', 'Licence transport public, permis circulation, assurance passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_650_____________', 'fr', 'name', 'Permis spécial, certification remorque, documentation technique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_651_____________', 'fr', 'name', 'Documentation conteneur, permis transport, certificat chargement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_652_____________', 'fr', 'name', 'Permis spéciaux, certification technique, assurances spécifiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_1_______________', 'en', 'name', 'Original document to be legalized, Applicant''s ID document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_2_______________', 'en', 'name', 'Original notarized document, Applicant''s ID document, Notarized power of attorney if acting on behalf', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_3_______________', 'en', 'name', 'Original diploma or degree, ID document, Certificate of studies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_4_______________', 'en', 'name', 'Original commercial document, Applicant''s ID document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_5_______________', 'en', 'name', 'ID document, Photograph', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_6_______________', 'en', 'name', 'Current passport, ID document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_7_______________', 'en', 'name', 'ID document, Justification of need', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_8_______________', 'en', 'name', 'Original document, ID document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_9_______________', 'en', 'name', 'Original notarized document, ID document, Notarial power of attorney if applicable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_10______________', 'en', 'name', 'Original commercial document, ID document, Additional commercial documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_11______________', 'en', 'name', 'ID document, Photograph, Payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_12______________', 'en', 'name', 'Current passport, ID document, Photograph', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_13______________', 'en', 'name', 'ID document, Consular registration proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_14______________', 'en', 'name', 'Aircraft documentation, Weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_15______________', 'en', 'name', 'Aircraft documentation, Detailed weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_16______________', 'en', 'name', 'Private aircraft certificate, Tourism documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_17______________', 'en', 'name', 'Aircraft certificate, Helicopter documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_18______________', 'en', 'name', 'Registration document, Weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_19______________', 'en', 'name', 'Ownership documentation, Owner identification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_20______________', 'en', 'name', 'Temporary registration request, Provisional aircraft documentation, Procedure proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_21______________', 'en', 'name', 'Current temporary certificate, Updated aircraft documentation, Payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_22______________', 'en', 'name', 'Original certificate, Loss declaration, Identification document, Payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_23______________', 'en', 'name', 'Transfer document, Current registration certificate, New owner''s identification, Sales contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_24______________', 'en', 'name', 'Mortgage document, Registration certificate, Identification document, Payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_25______________', 'en', 'name', 'Original registry document, Identification document, Request proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_26______________', 'en', 'name', 'Original airworthiness certificate, Aircraft technical documentation, Maintenance history', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_27______________', 'en', 'name', 'Special aircraft documentation, Detailed technical report, Special condition justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_28______________', 'en', 'name', 'Detailed flight plan, Aircraft documentation, Safety certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_29______________', 'en', 'name', 'Original leasing contract, Aircraft documentation, Parties identification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_30______________', 'en', 'name', 'Original legal document, Aircraft ownership certificate, Value appraisal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_31______________', 'en', 'name', 'Original foreign airworthiness certificate, Complete technical documentation, Maintenance history', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_32______________', 'en', 'name', 'Radioelectric installation technical documentation, Calibration certificate, Installation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_33______________', 'en', 'name', 'Noise level report, Aircraft technical documentation, Manufacturer''s certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_34______________', 'en', 'name', 'Aircraft technical documentation, Special capabilities certificate, Detailed flight plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_35______________', 'en', 'name', 'Land plot plan, Ownership documentation, Land use certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_36______________', 'en', 'name', 'Land plot plan, Ownership documentation, Zoning certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_37______________', 'en', 'name', 'Flight plan, Aircraft documentation, Operation certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_38______________', 'en', 'name', 'Route plan, Aircraft documentation, Flight insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_39______________', 'en', 'name', 'Topographic plans, Technical documentation, Previous reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_40______________', 'en', 'name', 'Base documentation, Technical information, Reference certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_41______________', 'en', 'name', 'Specific documentation, Related certificates, Supporting reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_42______________', 'en', 'name', 'Entry ticket, Identification document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_43______________', 'en', 'name', 'Parking ticket, Identification document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_44______________', 'en', 'name', 'Original parking ticket, First hour payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_45______________', 'en', 'name', 'Daily parking ticket, Identification document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_46______________', 'en', 'name', 'Official aircraft documentation, Non-commercial certificate, State authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_47______________', 'en', 'name', 'Official governmental documentation, Non-commercial certificate, Government authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_48______________', 'en', 'name', 'Official republic services documentation, Non-commercial certificate, Official authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_49______________', 'en', 'name', 'Official military/governmental aircraft documentation, Friendly country certificate, Non-commercial flight authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_50______________', 'en', 'name', 'Engine technical documentation, Maintenance history, Manufacturer''s certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_51______________', 'en', 'name', 'Propeller technical documentation, Maintenance history, Manufacturer''s certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_52______________', 'en', 'name', 'Aircraft technical documentation, Flight history, Airworthiness certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_53______________', 'en', 'name', 'Repair report, Technical documentation, Workshop certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_54______________', 'en', 'name', 'Modification report, Detailed technical documentation, Modification certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_55______________', 'en', 'name', 'Company documentation, Operator certificate, Exploitation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_56______________', 'en', 'name', 'Complete file, Technical documentation, Categorization certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_57______________', 'en', 'name', 'Inspection request, Operational documentation, Operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_58______________', 'en', 'name', 'Detailed inspection request, Complete operational documentation, Extended operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_59______________', 'en', 'name', 'Special inspection request, Complete historical documentation, Retrospective operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_60______________', 'en', 'name', 'Foreign operating license, Aircraft certificates, Insurance documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_61______________', 'en', 'name', 'Updated carrier documentation, Renewed certificates, Operations reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_62______________', 'en', 'name', 'Complete historical documentation, Safety reports, Maintenance records', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_63______________', 'en', 'name', 'License application, Company documentation, Operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_64______________', 'en', 'name', 'Updated documentation, Performance reports, Modifications to operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_65______________', 'en', 'name', 'Complete historical documentation, Audit reports, Comprehensive compliance evaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_66______________', 'en', 'name', 'Certificate application, Fleet documentation, Passenger operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_67______________', 'en', 'name', 'Updated documentation, Performance reports, Modifications to passenger operations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_68______________', 'en', 'name', 'Complete historical documentation, Safety reports, Comprehensive passenger operations evaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_69______________', 'en', 'name', 'Cargo certificate application, Cargo fleet documentation, Cargo operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_70______________', 'en', 'name', 'Updated cargo operations documentation, Performance reports, Cargo fleet modifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_71______________', 'en', 'name', 'Complete historical cargo operations documentation, Safety reports, Comprehensive cargo transport evaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_72______________', 'en', 'name', 'Authorization application, General aviation aircraft documentation, Operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_73______________', 'en', 'name', 'Updated general aviation documentation, Performance reports, Operations modifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_74______________', 'en', 'name', 'Complete historical general aviation documentation, Safety reports, Comprehensive operations evaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_75______________', 'en', 'name', 'Specifications proposal, Aircraft technical documentation, Detailed operational plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_76______________', 'en', 'name', 'Updated documentation, Operational performance reports, Proposed modifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_77______________', 'en', 'name', 'Complete historical documentation, Safety reports, Comprehensive operations evaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_78______________', 'en', 'name', 'Modification request, Updated aircraft documentation, Changes justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_79______________', 'en', 'name', 'Additional documentation, Performance reports, Improvement proposals', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_80______________', 'en', 'name', 'Complete historical documentation, Safety reports, Comprehensive modification evaluation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_81______________', 'en', 'name', 'Aeroclub bylaws, Training programs, Instructor certification, Facilities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_82______________', 'en', 'name', 'Professional curriculum, Instructor certifications, Facility documentation, Accreditations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_83______________', 'en', 'name', 'Technical service documentation, System certifications, Air traffic control plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_84______________', 'en', 'name', 'Terminal area control documentation, Traffic management systems, Specialized certifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_85______________', 'en', 'name', 'Aerodrome plans, Infrastructure certifications, Technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_86______________', 'en', 'name', 'Topographic study, Land evaluation, Ownership documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_87______________', 'en', 'name', 'Complete technical documentation, Compliance certifications, Safety reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_88______________', 'en', 'name', 'AR 5.7 requirement documentation, Technical reports, Compliance certifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_89______________', 'en', 'name', 'Weight documentation, Aircraft certificate, Technical weight reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_90______________', 'en', 'name', 'Detailed weight documentation, Aircraft certificate, Technical weight range reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_91______________', 'en', 'name', 'Complex weight documentation, Large aircraft certificate, Specialized technical reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_92______________', 'en', 'name', 'Exhaustive weight documentation, Large-scale aircraft certificate, Comprehensive technical reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_93______________', 'en', 'name', 'Ultra-detailed weight documentation, Maximum scale aircraft certificate, Advanced technical reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_94______________', 'en', 'name', 'Maximum complexity weight documentation, Exceptional scale aircraft certificate, High-level specialized technical reports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_95______________', 'en', 'name', 'Maintenance history, Previous inspection record, Updated technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_96______________', 'en', 'name', 'Professional certification, Identity document, Medical certificate, Training proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_97______________', 'en', 'name', 'Technical certification, Identity document, Medical certificate, Specialized training proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_98______________', 'en', 'name', 'Competency certification, Identity document, Medical certificate, Specialized training proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_99______________', 'en', 'name', 'Valid controller license, Specialization documentation, Additional training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_100_____________', 'en', 'name', 'Specific professional documentation, Related certifications, Training proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_101_____________', 'en', 'name', 'Enrollment proof, Identification document, Photograph', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_102_____________', 'en', 'name', 'Foreign aircraft documentation, Weight certificate, International operation permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_103_____________', 'en', 'name', 'Operational base contract, Aircraft documentation, Weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_104_____________', 'en', 'name', 'National aircraft documentation, Weight certificate, Operations register', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_105_____________', 'en', 'name', 'Flight ticket, Identification document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_106_____________', 'en', 'name', 'International flight ticket, Passport, Travel documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_107_____________', 'en', 'name', 'International flight ticket, Passport, Visa', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_108_____________', 'en', 'name', 'Fuel receipt, Flight register, Aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_109_____________', 'en', 'name', 'International fuel receipt, International flight register, Aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_110_____________', 'en', 'name', 'Flight plan, Aircraft certificate, Landing authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_111_____________', 'en', 'name', 'Flight plan, Local aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_112_____________', 'en', 'name', 'Detailed flight plan, Aircraft certificate, Flight authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_113_____________', 'en', 'name', 'Local flight plan, Regional aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_114_____________', 'en', 'name', 'Aircraft documentation, Operation category, Registration certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_115_____________', 'en', 'name', 'Pilot license, Flight experience documentation, Medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_116_____________', 'en', 'name', 'Professional certification, Training documentation, Medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_117_____________', 'en', 'name', 'Original foreign license, Origin certification, Experience documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_118_____________', 'en', 'name', 'Valid pilot license, Instructional experience certification, Pedagogical training documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_119_____________', 'en', 'name', 'Current student card, Proof of current enrollment, Identification document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_120_____________', 'en', 'name', 'Current license, Recent activity certification, Updated medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_121_____________', 'en', 'name', 'Base license, Specialization documentation, Specific training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_122_____________', 'en', 'name', 'Original license, Additional endorsement documentation, Supplementary certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_123_____________', 'en', 'name', 'National flight ticket, Identification document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_124_____________', 'en', 'name', 'CEMAC flight ticket, Passport, Regional travel documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_125_____________', 'en', 'name', 'Freight invoice, Cargo manifest, Baggage documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_126_____________', 'en', 'name', 'Flight plan, Operation authorization, Aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_127_____________', 'en', 'name', 'Initial extension proof, Updated flight plan, Additional authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_128_____________', 'en', 'name', 'Telescopic bridge usage request, Flight information, Aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_129_____________', 'en', 'name', 'Telescopic bridge usage extension, Delay justification, Additional flight information', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_130_____________', 'en', 'name', 'Prolonged usage justification, Detailed flight information, Special authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_131_____________', 'en', 'name', 'Aircraft weight certificate, Detailed technical documentation, Large-scale aircraft specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_132_____________', 'en', 'name', 'Special facilities usage request, Detailed flight plan, Large-scale aircraft documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_133_____________', 'en', 'name', 'Facilities usage extension, Delay justification, Additional flight information', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_134_____________', 'en', 'name', 'National flight plan, Aircraft documentation, Flight authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_135_____________', 'en', 'name', 'Regional flight plan, Aircraft documentation, International flight authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_136_____________', 'en', 'name', 'International flight plan, Complete aircraft documentation, Overflight permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_137_____________', 'en', 'name', 'Service request, Aircraft documentation, Operation details', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_138_____________', 'en', 'name', 'Sales receipt, Fuel quality certificate, Supply register', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_139_____________', 'en', 'name', 'Flight ticket, Identification document, Passport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_140_____________', 'en', 'name', 'International flight plan, Charter flight authorization, Fuel documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_141_____________', 'en', 'name', 'Cargo manifest, National origin documentation, Weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_142_____________', 'en', 'name', 'Cargo manifest, CEMAC origin documentation, Weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_143_____________', 'en', 'name', 'International cargo manifest, Origin documentation, Weight certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_144_____________', 'en', 'name', 'National flight ticket, Baggage documentation, Boarding pass', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_145_____________', 'en', 'name', 'International flight ticket, Baggage documentation, International boarding pass', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_146_____________', 'en', 'name', 'Weight certificate, Aircraft documentation, International flight plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_147_____________', 'en', 'name', 'Airworthiness certificate, Operations manual, Updated weight and balance certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_148_____________', 'en', 'name', 'Special airworthiness certificate, Extended operations manual, Enhanced weight and balance certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_149_____________', 'en', 'name', 'Standard airworthiness certificate, Basic operations manual, Weight and balance certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_150_____________', 'en', 'name', 'Intermediate airworthiness certificate, Complete operations manual, Detailed weight and balance certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_151_____________', 'en', 'name', 'Advanced airworthiness certificate, Extensive operations manual, Complete weight and balance certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_152_____________', 'en', 'name', 'Commercial registry, business license, tax certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_153_____________', 'en', 'name', 'Municipal license, commercial registry, safety certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_154_____________', 'en', 'name', 'ID document, residence certificate, municipal permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_155_____________', 'en', 'name', 'Commercial registry, bank certification, commercial activities declaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_156_____________', 'en', 'name', 'Price registration form, cost justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_157_____________', 'en', 'name', 'Commercial invoice, packing list, certificate of origin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_158_____________', 'en', 'name', 'Health certificate, veterinary certificate, handling license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_159_____________', 'en', 'name', 'Certificate of authenticity, artistic valuation, cultural permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_160_____________', 'en', 'name', 'Change request, current documentation, change justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_161_____________', 'en', 'name', 'Modification deed, updated commercial registry, tax certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_162_____________', 'en', 'name', 'Change request, current license, change justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_163_____________', 'en', 'name', 'Professional credentials, activity plan, identity documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_164_____________', 'en', 'name', 'Transport documents, customs declaration, certificate of origin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_165_____________', 'en', 'name', 'Seizure report, valuation report, legal documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_166_____________', 'en', 'name', 'Business plan, financial statements, legal compliance certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_167_____________', 'en', 'name', 'Temporary application, term justification, basic documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_168_____________', 'en', 'name', 'Specialized documentation, specific certifications, detailed plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_169_____________', 'en', 'name', 'Distribution plan, quality certificates, product licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_170_____________', 'en', 'name', 'Forest certificate, logging permit, environmental documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_171_____________', 'en', 'name', 'Processing certificate, industrial license, environmental documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_172_____________', 'en', 'name', 'Commercial form, company data, activity registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_173_____________', 'en', 'name', 'Commercial identification, activity history, company documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_174_____________', 'en', 'name', 'Commercial license, local inspection, constitutive documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_175_____________', 'en', 'name', 'Search request, document identification, justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_176_____________', 'en', 'name', 'Dissolution deed, final balance, tax certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_177_____________', 'en', 'name', 'Goods list, temporary justification, return guarantee', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_178_____________', 'en', 'name', 'CIF value declaration, import documents, origin certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_179_____________', 'en', 'name', 'Commercial invoice, technical documents, authenticity certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_180_____________', 'en', 'name', 'Pro forma invoice, packing list, certificates of origin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_181_____________', 'en', 'name', 'Original invoice, commercial documents, consular certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_182_____________', 'en', 'name', 'Commercial invoice, justification statement, additional documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_183_____________', 'en', 'name', 'Original invoice, non-validation explanation, supplementary documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_184_____________', 'en', 'name', 'International license, civil liability insurance, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_185_____________', 'en', 'name', 'International permit, artists insurance, detailed program', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_186_____________', 'en', 'name', 'Security plan, municipal permits, liability insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_187_____________', 'en', 'name', 'Participant list, group insurance, performance program', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_188_____________', 'en', 'name', 'Staff list, collective insurance, stage plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_189_____________', 'en', 'name', 'Logistics plan, extended insurance, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_190_____________', 'en', 'name', 'Artist visas, international insurance, detailed program', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_191_____________', 'en', 'name', 'Migration documentation, international collective insurance, technical plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_192_____________', 'en', 'name', 'International logistics plan, global insurance, technical certifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_193_____________', 'en', 'name', 'Mass management plan, special insurance, infrastructure certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_194_____________', 'en', 'name', 'Exhibition license, emergency plan, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_195_____________', 'en', 'name', 'Distribution license, content catalog, copyright', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_196_____________', 'en', 'name', 'Projection license, authorized catalog, municipal permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_197_____________', 'en', 'name', 'Local registration, video inventory, community permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_198_____________', 'en', 'name', 'Distribution license, product catalog, commercial rights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_199_____________', 'en', 'name', 'Professional accreditation, equipment insurance, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_200_____________', 'en', 'name', 'Shooting permit, filming plan, production insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_201_____________', 'en', 'name', 'Commercial license, product registry, original certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_202_____________', 'en', 'name', 'Artist card, musical program, performance insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_203_____________', 'en', 'name', 'Artist visa, international insurance, detailed program', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_204_____________', 'en', 'name', 'Commercial license, equipment insurance, professional certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_205_____________', 'en', 'name', 'Professional ID, mobile permit, basic insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_206_____________', 'en', 'name', 'Printing license, commercial registry, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_207_____________', 'en', 'name', 'Installation permit, advertising design, liability insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_208_____________', 'en', 'name', 'Technical plan, urban permit, installation insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_209_____________', 'en', 'name', 'Technical specifications, installation permit, safety certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_210_____________', 'en', 'name', 'Panel design, basic permit, technical sheet', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_211_____________', 'en', 'name', 'Panel scheme, basic authorization, technical data', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_212_____________', 'en', 'name', 'Basic design, simple permit, specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_213_____________', 'en', 'name', 'Panel format, reduced permit, installation data', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_214_____________', 'en', 'name', 'Identity documentation, artistic portfolio, professional certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_215_____________', 'en', 'name', 'Movie copy, detailed synopsis, proposed classification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_216_____________', 'en', 'name', 'Artists contract, revenue plan, accounting record', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_217_____________', 'en', 'name', 'Identity document, entry ticket, visitor registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_218_____________', 'en', 'name', 'Commercial license, artisan registry, premises certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_219_____________', 'en', 'name', 'Activity plan, artisan registry, municipal permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_220_____________', 'en', 'name', 'Works inventory, objects insurance, exhibition certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_221_____________', 'en', 'name', 'Sign design, urban permit, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_222_____________', 'en', 'name', 'Professional license, health certification, establishment insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_223_____________', 'en', 'name', 'Commercial permit, hygiene certificate, liability insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_224_____________', 'en', 'name', 'Basic registry, hygiene certification, basic insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_225_____________', 'en', 'name', 'Signage design, municipal permit, installation certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_226_____________', 'en', 'name', 'Temporary request, sign design, planned duration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_227_____________', 'en', 'name', 'Artistic portfolio, training degree, professional certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_228_____________', 'en', 'name', 'Tourism license, liability insurance, financial guarantee', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_229_____________', 'en', 'name', 'Luxury certification, operational plan, complete licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_230_____________', 'en', 'name', 'Superior certification, services plan, hotel licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_231_____________', 'en', 'name', 'Operations plan, standard certification, basic permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_232_____________', 'en', 'name', 'Basic license, operation plan, minimal certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_233_____________', 'en', 'name', 'Accommodation permit, basic standards, liability insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_234_____________', 'en', 'name', 'Technical documentation, evaluation report, standards met', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_235_____________', 'en', 'name', 'Restaurant license, health certification, operational plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_236_____________', 'en', 'name', 'Hospitality permit, hygiene certificate, operation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_237_____________', 'en', 'name', 'Hospitality license, health certification, quality plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_238_____________', 'en', 'name', 'Commercial permit, health certificate, operational plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_239_____________', 'en', 'name', 'Premium license, security plan, acoustic certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_240_____________', 'en', 'name', 'Hospitality permit, safety standards, sound control', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_241_____________', 'en', 'name', 'Basic license, local permits, minimal standards', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_242_____________', 'en', 'name', 'Special license, advanced security plan, premium acoustic certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_243_____________', 'en', 'name', 'Night license, sound control, emergency plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_244_____________', 'en', 'name', 'Gaming license, special security plan, financial guarantee', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_245_____________', 'en', 'name', 'Machine registry, technical certification, fiscal control', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_246_____________', 'en', 'name', 'Table registry, dealer license, operations control', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_247_____________', 'en', 'name', 'Gambling license, machine certification, security plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_248_____________', 'en', 'name', 'Machine registry, technical control, operation certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_249_____________', 'en', 'name', 'Draw license, financial guarantee, operational plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_250_____________', 'en', 'name', 'Prize declaration, winner identification, payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_251_____________', 'en', 'name', 'Raffle permit, prize list, organization plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_252_____________', 'en', 'name', 'Professional accreditation, filming plan, specialized insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_253_____________', 'en', 'name', 'Filmmaker registry, safari permit, recording plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_254_____________', 'en', 'name', 'Identity document, residence proof, visit form', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_255_____________', 'en', 'name', 'Passport, tourist visa, visit itinerary', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_256_____________', 'en', 'name', 'Commercial license, financial guarantee, operational plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_257_____________', 'en', 'name', 'Commercial registry, liability insurance, sales plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_258_____________', 'en', 'name', 'Operator license, travel insurance, professional certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_259_____________', 'en', 'name', 'Dual license, vehicle insurance, business plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_260_____________', 'en', 'name', 'ID document, criminal record certificate, psychological fitness certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_261_____________', 'en', 'name', 'Purchase invoice, certificate of origin, export permit from country of origin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_262_____________', 'en', 'name', 'Hunting license, purchase invoice, technical specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_263_____________', 'en', 'name', 'Current license, weapon registration, ID document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_264_____________', 'en', 'name', 'Weapons registry, owner identification, purchase certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_265_____________', 'en', 'name', 'Formal request, applicant identification, construction plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_266_____________', 'en', 'name', 'Logging permit, applicant identification, construction plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_267_____________', 'en', 'name', 'Fisher registration, vessel specifications, navigation license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_268_____________', 'en', 'name', 'Seaworthiness certificate, vessel registration, launching plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_269_____________', 'en', 'name', 'Beaching request, vessel registration, safety plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_270_____________', 'en', 'name', 'Property title, seaworthiness certificate, marine insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_271_____________', 'en', 'name', 'Engine specifications, installation certificate, technical inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_272_____________', 'en', 'name', 'Engine/sail registration, safety certificate, technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_273_____________', 'en', 'name', 'Dugout registration, motor specifications, navigation license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_274_____________', 'en', 'name', 'Vessel registration, owner certificate, basic inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_275_____________', 'en', 'name', 'Tonnage certificate, technical documentation, naval inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_276_____________', 'en', 'name', 'Temporary application, basic documentation, financial guarantee', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_277_____________', 'en', 'name', 'Complete documentation, final inspection, current certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_278_____________', 'en', 'name', 'Property title, registration certificate, technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_279_____________', 'en', 'name', 'Owner identification, equipment specifications, fishing license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_280_____________', 'en', 'name', 'Engine invoice, technical specifications, power certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_281_____________', 'en', 'name', 'Competency certificate, nautical exam, identity documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_282_____________', 'en', 'name', 'Vessel registration, crew list, seaworthiness certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_283_____________', 'en', 'name', 'Passenger list, navigation plan, safety certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_284_____________', 'en', 'name', 'Experience certificate, nautical exam, identity documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_285_____________', 'en', 'name', 'Sale contract, identity documents, previous registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_286_____________', 'en', 'name', 'Property title, land plans, municipal permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_287_____________', 'en', 'name', 'Birth certificate, legal guardian''s ID', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_288_____________', 'en', 'name', 'Student ID', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_289_____________', 'en', 'name', 'Photo ID', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_290_____________', 'en', 'name', 'ID, transcript, medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_291_____________', 'en', 'name', 'Educational project, staff education and health certificates, premises permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_292_____________', 'en', 'name', 'ID, transcript', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_293_____________', 'en', 'name', 'ID, certificates of studies from country of origin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_294_____________', 'en', 'name', 'ID, certificates of studies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_295_____________', 'en', 'name', 'ID, proof of loss of original document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_296_____________', 'en', 'name', 'ID, transcript, exam fee payment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_297_____________', 'en', 'name', 'Student ID, transcript', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_298_____________', 'en', 'name', 'ID, transcript, tuition fee payment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_299_____________', 'en', 'name', 'Company bylaws, certificate of incorporation, shareholders identification, business plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_300_____________', 'en', 'name', 'Articles of incorporation, partners identification, share capital, operational plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_301_____________', 'en', 'name', 'Investment plan, financial statements, bank guarantees, financial projections', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_302_____________', 'en', 'name', 'Personal identification, activity plan, tax registration, asset declaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_303_____________', 'en', 'name', 'Bank statements, credit history, financial balance, bank certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_304_____________', 'en', 'name', 'Sender identification, destination documentation, transfer justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_305_____________', 'en', 'name', 'Transfer form, bank identification, operation proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_306_____________', 'en', 'name', 'Payslips, income declaration, tax identification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_307_____________', 'en', 'name', 'Foreign income proof, tax documentation, bank certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_308_____________', 'en', 'name', 'Vehicle documentation, owner identification, technical inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_309_____________', 'en', 'name', 'Current documentation, residence proof, personal identification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_310_____________', 'en', 'name', 'Tax declarations, payment proofs, tax history', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_311_____________', 'en', 'name', '- Import license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_312_____________', 'en', 'name', '- Business registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_313_____________', 'en', 'name', '- Manufacturer authorization certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_314_____________', 'en', 'name', '- Business plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_315_____________', 'en', 'name', '- Technical certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_316_____________', 'en', 'name', '- Operating license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_317_____________', 'en', 'name', '- Network technical plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_318_____________', 'en', 'name', '- Content provider contracts', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_319_____________', 'en', 'name', '- Feasibility study', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_320_____________', 'en', 'name', '- Business license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_321_____________', 'en', 'name', '- IT security plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_322_____________', 'en', 'name', '- ISP contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_323_____________', 'en', 'name', '- Equipment certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_324_____________', 'en', 'name', '- Premises layout', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_325_____________', 'en', 'name', '- First category business license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_326_____________', 'en', 'name', '- Professional equipment inventory', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_327_____________', 'en', 'name', '- Staff technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_328_____________', 'en', 'name', '- Operations plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_329_____________', 'en', 'name', '- Professional insurance policy', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_330_____________', 'en', 'name', '- Second category business license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_331_____________', 'en', 'name', '- Equipment list', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_332_____________', 'en', 'name', '- Staff training certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_333_____________', 'en', 'name', '- Service plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_334_____________', 'en', 'name', '- Civil liability insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_335_____________', 'en', 'name', '- Basic business license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_336_____________', 'en', 'name', '- Basic equipment inventory', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_337_____________', 'en', 'name', '- Basic training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_338_____________', 'en', 'name', '- Simplified operation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_339_____________', 'en', 'name', '- Basic insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_340_____________', 'en', 'name', '- Billboard design', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_341_____________', 'en', 'name', '- Location permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_342_____________', 'en', 'name', '- Electrical safety certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_343_____________', 'en', 'name', '- Installation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_344_____________', 'en', 'name', '- Visual impact study', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_345_____________', 'en', 'name', '- Structural plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_346_____________', 'en', 'name', '- Advertising design', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_347_____________', 'en', 'name', '- Owner''s permission', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_348_____________', 'en', 'name', '- Compliance certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_349_____________', 'en', 'name', '- Vehicle registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_350_____________', 'en', 'name', '- Vehicle photographs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_351_____________', 'en', 'name', '- Mural design', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_352_____________', 'en', 'name', '- Municipal authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_353_____________', 'en', 'name', '- Durability certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_354_____________', 'en', 'name', '- Maintenance plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_355_____________', 'en', 'name', '- Message content', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_356_____________', 'en', 'name', '- Planned duration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_357_____________', 'en', 'name', '- Installation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_358_____________', 'en', 'name', '- Safety certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_359_____________', 'en', 'name', '- Advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_360_____________', 'en', 'name', '- Publication contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_361_____________', 'en', 'name', '- Technical specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_362_____________', 'en', 'name', '- Design proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_363_____________', 'en', 'name', '- Publication schedule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_364_____________', 'en', 'name', '- Installation permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_365_____________', 'en', 'name', '- Electrical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_366_____________', 'en', 'name', '- Advanced technical specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_367_____________', 'en', 'name', '- Special installation permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_368_____________', 'en', 'name', '- Enhanced electrical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_369_____________', 'en', 'name', '- Environmental impact study', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_370_____________', 'en', 'name', '- Safety plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_371_____________', 'en', 'name', '- Media plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_372_____________', 'en', 'name', '- Material samples', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_373_____________', 'en', 'name', '- Advertising license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_374_____________', 'en', 'name', '- Distribution schedule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_375_____________', 'en', 'name', '- Service contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_376_____________', 'en', 'name', '- B/W advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_377_____________', 'en', 'name', '- Application form', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_378_____________', 'en', 'name', '- Payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_379_____________', 'en', 'name', '- Advertiser authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_380_____________', 'en', 'name', '- Color advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_381_____________', 'en', 'name', '- Color proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_382_____________', 'en', 'name', '- B/W advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_383_____________', 'en', 'name', '- Half-page specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_384_____________', 'en', 'name', '- Full color advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_385_____________', 'en', 'name', '- Calibrated color proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_386_____________', 'en', 'name', '- Quarter-page specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_387_____________', 'en', 'name', '- Two-color advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_388_____________', 'en', 'name', '- Eighth-page specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_389_____________', 'en', 'name', '- Mixed advertising material', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_390_____________', 'en', 'name', '- Banner digital file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_391_____________', 'en', 'name', '- Campaign plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_392_____________', 'en', 'name', '- HD digital file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_393_____________', 'en', 'name', '- Display plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_394_____________', 'en', 'name', '- Video file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_395_____________', 'en', 'name', '- Copyright clearance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_396_____________', 'en', 'name', '- Premium digital file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_397_____________', 'en', 'name', '- Display plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_398_____________', 'en', 'name', '- Optimized digital file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_399_____________', 'en', 'name', '- Visibility plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_400_____________', 'en', 'name', '- High resolution digital file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_401_____________', 'en', 'name', '- Exposure strategy', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_402_____________', 'en', 'name', '- HD video file', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_403_____________', 'en', 'name', '- Reproduction rights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_404_____________', 'en', 'name', '- Premium business license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_405_____________', 'en', 'name', '- Detailed inventory', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_406_____________', 'en', 'name', '- Standard business license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_407_____________', 'en', 'name', '- Minimum insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_408_____________', 'en', 'name', '- Dedication text', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_409_____________', 'en', 'name', '- Requester ID', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_410_____________', 'en', 'name', '- Preferred schedule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_411_____________', 'en', 'name', '- Announcement text', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_412_____________', 'en', 'name', '- Issuer ID', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_413_____________', 'en', 'name', '- Broadcast authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_414_____________', 'en', 'name', '- Exact duration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_415_____________', 'en', 'name', '- Time preferences', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_416_____________', 'en', 'name', '- Message text', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_417_____________', 'en', 'name', '- Broadcast date', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_418_____________', 'en', 'name', '- Digital photograph', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_419_____________', 'en', 'name', '- Advertisement text', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_420_____________', 'en', 'name', '- Image usage authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_421_____________', 'en', 'name', '- Notice text', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_422_____________', 'en', 'name', '- Word count', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_423_____________', 'en', 'name', '- Time preference', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_424_____________', 'en', 'name', '- Broadcast plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_425_____________', 'en', 'name', '- Scroll text', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_426_____________', 'en', 'name', '- Graphic design', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_427_____________', 'en', 'name', '- Requested duration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_428_____________', 'en', 'name', '- Annual advertising plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_429_____________', 'en', 'name', '- Annual contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_430_____________', 'en', 'name', '- Broadcast schedule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_431_____________', 'en', 'name', '- Editorial license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_432_____________', 'en', 'name', '- Business plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_433_____________', 'en', 'name', '- Content sample', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_434_____________', 'en', 'name', '- Commercial registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_435_____________', 'en', 'name', '- Press license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_436_____________', 'en', 'name', '- Editorial plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_437_____________', 'en', 'name', '- Organizational structure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_438_____________', 'en', 'name', '- Kiosk layout', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_439_____________', 'en', 'name', '- Distribution contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_440_____________', 'en', 'name', '- Distribution license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_441_____________', 'en', 'name', '- Logistics plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_442_____________', 'en', 'name', '- Editorial contracts', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_443_____________', 'en', 'name', '- Vehicle registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_444_____________', 'en', 'name', '- Professional license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_445_____________', 'en', 'name', '- Service portfolio', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_446_____________', 'en', 'name', '- Company registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_447_____________', 'en', 'name', '- Temporary registration application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_448_____________', 'en', 'name', '- ID document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_449_____________', 'en', 'name', '- Vehicle documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_450_____________', 'en', 'name', '- Temporary insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_451_____________', 'en', 'name', '- Payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_452_____________', 'en', 'name', '- B license application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_453_____________', 'en', 'name', '- Medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_454_____________', 'en', 'name', '- Recent photographs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_455_____________', 'en', 'name', '- Training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_456_____________', 'en', 'name', '- B1 license application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_457_____________', 'en', 'name', '- Specific training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_458_____________', 'en', 'name', '- C license application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_459_____________', 'en', 'name', '- Special medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_460_____________', 'en', 'name', '- Professional aptitude certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_461_____________', 'en', 'name', '- D license application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_462_____________', 'en', 'name', '- Professional medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_463_____________', 'en', 'name', '- Passenger transport aptitude certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_464_____________', 'en', 'name', '- Permanent registration application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_465_____________', 'en', 'name', '- Complete vehicle documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_466_____________', 'en', 'name', '- Valid insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_467_____________', 'en', 'name', '- Technical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_468_____________', 'en', 'name', '- License application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_469_____________', 'en', 'name', '- E license application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_470_____________', 'en', 'name', '- Trailer training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_471_____________', 'en', 'name', '- Previous license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_472_____________', 'en', 'name', '- Valid medical certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_473_____________', 'en', 'name', '- Loss/theft report', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_474_____________', 'en', 'name', '- Sworn statement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_475_____________', 'en', 'name', '- Recent photograph', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_476_____________', 'en', 'name', '- Previous license (if applicable)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_477_____________', 'en', 'name', '- Official form', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_478_____________', 'en', 'name', '- Proof of residence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_479_____________', 'en', 'name', '- Additional documentation as required', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_480_____________', 'en', 'name', '- Exam application', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_481_____________', 'en', 'name', '- Training certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_482_____________', 'en', 'name', '- Expired license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_483_____________', 'en', 'name', '- Delay justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_484_____________', 'en', 'name', '- Payment proof with surcharge', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_485_____________', 'en', 'name', '- Delay justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_486_____________', 'en', 'name', '- Original license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_487_____________', 'en', 'name', '- Official translation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_488_____________', 'en', 'name', '- Validity certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_489_____________', 'en', 'name', '- Proof of residence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_490_____________', 'en', 'name', '- Current license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_491_____________', 'en', 'name', '- Change form', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_492_____________', 'en', 'name', '- Certification reason', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_493_____________', 'en', 'name', '- Driving history', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_494_____________', 'en', 'name', '- Infraction record', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_495_____________', 'en', 'name', '- Residence certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_496_____________', 'en', 'name', '- Property title', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_497_____________', 'en', 'name', '- Land plot', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_498_____________', 'en', 'name', '- Measurement request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_499_____________', 'en', 'name', '- Owner identification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_500_____________', 'en', 'name', '- Fingerprints', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_501_____________', 'en', 'name', '- Association bylaws', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_502_____________', 'en', 'name', '- Member registry', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_503_____________', 'en', 'name', '- Vehicle licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_504_____________', 'en', 'name', '- Collective insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_505_____________', 'en', 'name', '- Industrial license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_506_____________', 'en', 'name', '- Installation plans', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_507_____________', 'en', 'name', '- Safety certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_508_____________', 'en', 'name', '- Environmental study', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_509_____________', 'en', 'name', '- Health certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_510_____________', 'en', 'name', '- Facility plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_511_____________', 'en', 'name', '- Supplier registry', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_512_____________', 'en', 'name', '- Refrigeration system', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_513_____________', 'en', 'name', '- Activity license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_514_____________', 'en', 'name', '- Safety measures', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_515_____________', 'en', 'name', '- Habitability certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_516_____________', 'en', 'name', '- Tax registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_517_____________', 'en', 'name', '- Location request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_518_____________', 'en', 'name', '- Stand plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_519_____________', 'en', 'name', '- Product list', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_520_____________', 'en', 'name', '- Supplier certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_521_____________', 'en', 'name', '- Origin declaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_522_____________', 'en', 'name', '- Quality certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_523_____________', 'en', 'name', '- Health control', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_524_____________', 'en', 'name', '- Basic registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_525_____________', 'en', 'name', '- Sales permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_526_____________', 'en', 'name', '- Product registry', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_527_____________', 'en', 'name', '- Premises plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_528_____________', 'en', 'name', '- Liability insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_529_____________', 'en', 'name', '- Mandatory insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_530_____________', 'en', 'name', '- Temporary registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_531_____________', 'en', 'name', '- Technical inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_532_____________', 'en', 'name', '- Expired temporary registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_533_____________', 'en', 'name', '- Updated documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_534_____________', 'en', 'name', '- Provisional request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_535_____________', 'en', 'name', '- Need justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_536_____________', 'en', 'name', '- Manufacturer authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_537_____________', 'en', 'name', '- Special insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_538_____________', 'en', 'name', '- Technical sheet', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_539_____________', 'en', 'name', '- Test plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_540_____________', 'en', 'name', '- Loss report', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_541_____________', 'en', 'name', '- Original registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_542_____________', 'en', 'name', '- Sale contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_543_____________', 'en', 'name', '- ID documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_544_____________', 'en', 'name', '- Vehicle registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_545_____________', 'en', 'name', '- Updated insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_546_____________', 'en', 'name', 'Commercial license, safety certificate, tax registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_547_____________', 'en', 'name', 'Wholesale license, storage certification, special permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_548_____________', 'en', 'name', 'Vessel documentation, safety certificates, navigation permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_549_____________', 'en', 'name', 'Retail commercial license, storage certification, safety plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_550_____________', 'en', 'name', 'Wholesale license, storage certification, distribution plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_551_____________', 'en', 'name', 'Constitutive documents, technical certifications, operational licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_552_____________', 'en', 'name', 'Deregistration request, obligations settlement, closure report', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_553_____________', 'en', 'name', 'Delay justification, pending documentation, payment proof', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_554_____________', 'en', 'name', 'Previous license, facility inspection, safety certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_555_____________', 'en', 'name', 'Operational plan, storage certification, commercial license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_556_____________', 'en', 'name', 'Distribution plan, infrastructure certification, special permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_557_____________', 'en', 'name', 'Technical project, impact study, construction permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_558_____________', 'en', 'name', 'Geological study, exploitation plan, environmental assessment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_559_____________', 'en', 'name', 'Extraction plan, environmental study, local permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_560_____________', 'en', 'name', 'Production records, volume measurements, technical certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_561_____________', 'en', 'name', 'Production control, volume measurement, technical certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_562_____________', 'en', 'name', 'Surface contract, exploration plan, technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_563_____________', 'en', 'name', 'Production plan, operational records, technical certifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_564_____________', 'en', 'name', 'Anchoring plan, naval certification, maritime permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_565_____________', 'en', 'name', 'Extended operational plan, technical certificates, special licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_566_____________', 'en', 'name', 'Seismic plan, equipment certification, exploration permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_567_____________', 'en', 'name', 'Extended seismic program, advanced certifications, special licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_568_____________', 'en', 'name', 'Drilling plan, safety certification, operational permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_569_____________', 'en', 'name', 'Research project, technical credentials, work plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_570_____________', 'en', 'name', 'Mining contract, financial guarantees, exploitation plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_571_____________', 'en', 'name', 'Resource declaration, technical study, evaluation report', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_572_____________', 'en', 'name', 'Lease contract, surface plans, technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_573_____________', 'en', 'name', 'Exploitation plan, surface measurement, activity certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_574_____________', 'en', 'name', 'Vehicle documentation, owner ID, valid insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_575_____________', 'en', 'name', 'Commercial license, technical inspection, public insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_576_____________', 'en', 'name', 'Public service certification, technical documentation, special permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_577_____________', 'en', 'name', 'Special transport permit, heavy vehicle inspection, professional certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_578_____________', 'en', 'name', 'Tourism license, special insurance, vehicle documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_579_____________', 'en', 'name', 'ID, proof of residence, personal documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_580_____________', 'en', 'name', 'Cadastral plan, property title, measurement request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_581_____________', 'en', 'name', 'Property title, plot plan, cadastral certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_582_____________', 'en', 'name', 'Property documentation, topographic study, detailed plans', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_583_____________', 'en', 'name', 'Complete property study, extensive topographic analysis, legal documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_584_____________', 'en', 'name', 'Location plan, cadastral documentation, layout request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_585_____________', 'en', 'name', 'Tax documentation, technical plans, urban certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_586_____________', 'en', 'name', 'Topographic study, tax certification, urban planning documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_587_____________', 'en', 'name', 'Complete land study, tax assessment, detailed plans', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_588_____________', 'en', 'name', 'Complete technical study, legal documentation, tax certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_589_____________', 'en', 'name', 'Land plan, property title, measurement request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_590_____________', 'en', 'name', 'Topographic study, property documentation, detailed plans', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_591_____________', 'en', 'name', 'Complete land study, legal documentation, technical analysis', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_592_____________', 'en', 'name', 'Print request, digital file, format specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_593_____________', 'en', 'name', 'A3 print request, digital file, technical requirements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_594_____________', 'en', 'name', 'Plan file, technical specifications, digital format', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_595_____________', 'en', 'name', 'Technical file, printing requirements, digital format', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_596_____________', 'en', 'name', 'Large format file, technical specifications, digital format', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_597_____________', 'en', 'name', 'Property documentation, asset photos, owner identification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_598_____________', 'en', 'name', 'Complete documentation, detailed inventory, value certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_599_____________', 'en', 'name', 'Exhaustive documentation, preliminary assessment, official certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_600_____________', 'en', 'name', 'Complete documentation, prior audit, special certifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_601_____________', 'en', 'name', 'Land plans, urban planning documentation, cadastral certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_602_____________', 'en', 'name', 'Complete documentation, urban study, technical certifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_603_____________', 'en', 'name', 'Valid passport, application form, supporting documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_604_____________', 'en', 'name', 'Passport, stay justification, medical insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_605_____________', 'en', 'name', 'Passport, stay plan, supporting documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_606_____________', 'en', 'name', 'Valid passport, long-stay justification, financial documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_607_____________', 'en', 'name', 'Current visa, extension justification, valid passport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_608_____________', 'en', 'name', 'Residence proof, identity document, means justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_609_____________', 'en', 'name', 'Valid passport, residence history, proof of financial solvency', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_610_____________', 'en', 'name', 'Identity document, entry justification, purpose declaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_611_____________', 'en', 'name', 'Passport, expired visa, delay justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_612_____________', 'en', 'name', 'Emigration request, personal documents, travel plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_613_____________', 'en', 'name', 'Identity document, residence certificate, police record', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_614_____________', 'en', 'name', 'Passport, residence permit, home country background', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_615_____________', 'en', 'name', 'Police report, alternative identification, loss declaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_616_____________', 'en', 'name', 'Passport, temporary visa, request justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_617_____________', 'en', 'name', 'Original document, applicant identification, request form', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_618_____________', 'en', 'name', 'Passport, destination visa, international work contract', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_619_____________', 'en', 'name', 'Birth certificate, identity photo, fingerprint', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_620_____________', 'en', 'name', 'Loss report, alternative identification, recent photo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_621_____________', 'en', 'name', 'Identity document, birth certificate, regulation photos', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_622_____________', 'en', 'name', 'Loss report, previous passport, identity document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_623_____________', 'en', 'name', 'Previous passport, identity document, updated photos', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_624_____________', 'en', 'name', 'Valid passport, residence visa, proof of address', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_625_____________', 'en', 'name', 'Previous card, residence history, update documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_626_____________', 'en', 'name', 'Identity document, fact description, available evidence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_627_____________', 'en', 'name', 'Infraction report, offender identification, incident evidence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_628_____________', 'en', 'name', 'Technical specifications, conformity certificates, manufacturer documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_629_____________', 'en', 'name', 'Constitutive documents, operating licenses, tax certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_630_____________', 'en', 'name', 'Import license, commercial registry, customs documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_631_____________', 'en', 'name', 'Identity document, tax registration, activity plan', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_632_____________', 'en', 'name', 'Technical documentation, origin certificates, export licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_633_____________', 'en', 'name', 'Commercial documentation, foreign trade licenses, origin certificates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_634_____________', 'en', 'name', 'Modification documents, new owner identification, change justification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_635_____________', 'en', 'name', 'Vehicle documentation, technical sheet, circulation permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_636_____________', 'en', 'name', 'Vehicle documentation, load certificate, transport permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_637_____________', 'en', 'name', 'Passenger transport license, technical inspection, passenger insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_638_____________', 'en', 'name', 'Collective transport permit, technical certification, mandatory insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_639_____________', 'en', 'name', 'Operator license, capacity certification, technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_640_____________', 'en', 'name', 'Transport certification, technical documentation, special insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_641_____________', 'en', 'name', 'Operator license, safety certificates, passenger insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_642_____________', 'en', 'name', 'Cargo certification, goods documentation, transport permits', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_643_____________', 'en', 'name', 'Multiple licenses, special certifications, combined insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_644_____________', 'en', 'name', 'Special certification, hazardous permits, safety protocols', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_645_____________', 'en', 'name', 'Circulation permit, weight certificate, cargo documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_646_____________', 'en', 'name', 'ID document, driving license, vehicle registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_647_____________', 'en', 'name', 'Circulation permit, technical certificate, vehicle documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_648_____________', 'en', 'name', 'Circulation permit, technical sheet, vehicle insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_649_____________', 'en', 'name', 'Public transport license, circulation permit, passenger insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_650_____________', 'en', 'name', 'Special permit, trailer certification, technical documentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_651_____________', 'en', 'name', 'Container documentation, transport permit, load certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('document_template', 'DOC_652_____________', 'en', 'name', 'Special permits, technical certification, specific insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

COMMIT;
