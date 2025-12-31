-- ============================================================================
-- Migration 030: Entity Locations (Generic Location Management)
-- ============================================================================
-- Purpose:
--   Create a normalized entity_locations table for CRUD management by admins.
--   Replaces hardcoded location strings with proper FK relationships.
--
-- Per user request: "ne peux-tu pas juste créer location tel que on peut
-- ajouter les location aux entité que de créer cnedoge bata, dgt bata?"
--
-- Benefits:
--   - Admins can add/edit/delete locations via UI
--   - Proper foreign key relationships
--   - Additional metadata (coordinates, phone, email, capacity)
--   - Future: can add hours, holidays per location
--
-- Date: 2024-12-31
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENTITY_LOCATIONS TABLE
-- ============================================================================
-- Master table for all entity office locations

CREATE TABLE IF NOT EXISTS entity_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Entity reference
    entity_code VARCHAR(50) NOT NULL,

    -- Location identifiers
    location_code VARCHAR(50) NOT NULL,  -- e.g., 'CNEDOGE_MALABO', 'CNEDOGE_BATA'
    location_name VARCHAR(255) NOT NULL,  -- e.g., 'CNEDOGE Malabo', 'CNEDOGE Bata'

    -- Geographic info
    city VARCHAR(100) NOT NULL,  -- 'Malabo' or 'Bata'
    province VARCHAR(100),  -- 'Bioko Norte' or 'Litoral'
    region VARCHAR(100),  -- 'Insular' or 'Continental'
    address TEXT,

    -- Contact info
    phone VARCHAR(50),
    email VARCHAR(255),

    -- Location attributes
    is_main_office BOOLEAN NOT NULL DEFAULT FALSE,  -- True for capital (Malabo)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Capacity settings (can override appointment_slot_configs)
    default_capacity_per_slot INTEGER,

    -- Geolocation (for future map integration)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Operating hours (optional, can be detailed in appointment_slot_configs)
    operating_hours_notes TEXT,  -- e.g., "Lunes a Viernes: 08:00 - 15:00"

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_entity_location_code UNIQUE (entity_code, location_code),
    CONSTRAINT unique_entity_location_name UNIQUE (entity_code, location_name)
);

-- Indexes
CREATE INDEX idx_el_entity ON entity_locations(entity_code);
CREATE INDEX idx_el_city ON entity_locations(city);
CREATE INDEX idx_el_active ON entity_locations(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE entity_locations IS 'Master table of physical locations for each government entity (CNEDOGE, DGT, etc.)';
COMMENT ON COLUMN entity_locations.entity_code IS 'Entity code (CNEDOGE, DGT, EXTRANJERIA, MINFP, ONRC, etc.)';
COMMENT ON COLUMN entity_locations.location_code IS 'Unique code per entity-location (e.g., CNEDOGE_MALABO)';
COMMENT ON COLUMN entity_locations.is_main_office IS 'True for main office (typically in Malabo, the capital)';
COMMENT ON COLUMN entity_locations.region IS 'Insular (Bioko island) or Continental (mainland)';

-- ============================================================================
-- 2. SEED DATA - INITIAL LOCATIONS
-- ============================================================================
-- Two cities: Malabo (capital, Bioko island) and Bata (continental)

-- CNEDOGE Locations (Pasaportes, DIP)
INSERT INTO entity_locations (entity_code, location_code, location_name, city, province, region, is_main_office, address) VALUES
('CNEDOGE', 'CNEDOGE_MALABO', 'CNEDOGE Malabo', 'Malabo', 'Bioko Norte', 'Insular', TRUE, 'Malabo, Bioko Norte'),
('CNEDOGE', 'CNEDOGE_BATA', 'CNEDOGE Bata', 'Bata', 'Litoral', 'Continental', FALSE, 'Bata, Litoral')
ON CONFLICT (entity_code, location_code) DO NOTHING;

-- DGT Locations (Tráfico, Vehiculos)
INSERT INTO entity_locations (entity_code, location_code, location_name, city, province, region, is_main_office, address) VALUES
('DGT', 'DGT_MALABO', 'DGT Malabo', 'Malabo', 'Bioko Norte', 'Insular', TRUE, 'Malabo, Bioko Norte'),
('DGT', 'DGT_BATA', 'DGT Bata', 'Bata', 'Litoral', 'Continental', FALSE, 'Bata, Litoral')
ON CONFLICT (entity_code, location_code) DO NOTHING;

-- EXTRANJERIA Locations (Residencia, Visados)
INSERT INTO entity_locations (entity_code, location_code, location_name, city, province, region, is_main_office, address) VALUES
('EXTRANJERIA', 'EXTRANJERIA_MALABO', 'Extranjería Malabo', 'Malabo', 'Bioko Norte', 'Insular', TRUE, 'Malabo, Bioko Norte'),
('EXTRANJERIA', 'EXTRANJERIA_BATA', 'Extranjería Bata', 'Bata', 'Litoral', 'Continental', FALSE, 'Bata, Litoral')
ON CONFLICT (entity_code, location_code) DO NOTHING;

-- MINFP Locations (Función Pública, Carnets de funcionario)
INSERT INTO entity_locations (entity_code, location_code, location_name, city, province, region, is_main_office, address) VALUES
('MINFP', 'MINFP_MALABO', 'MINFP Malabo', 'Malabo', 'Bioko Norte', 'Insular', TRUE, 'Malabo, Bioko Norte'),
('MINFP', 'MINFP_BATA', 'MINFP Bata', 'Bata', 'Litoral', 'Continental', FALSE, 'Bata, Litoral')
ON CONFLICT (entity_code, location_code) DO NOTHING;

-- ONRC Locations (Registro Civil)
INSERT INTO entity_locations (entity_code, location_code, location_name, city, province, region, is_main_office, address) VALUES
('ONRC', 'ONRC_MALABO', 'ONRC Malabo', 'Malabo', 'Bioko Norte', 'Insular', TRUE, 'Malabo, Bioko Norte'),
('ONRC', 'ONRC_BATA', 'ONRC Bata', 'Bata', 'Litoral', 'Continental', FALSE, 'Bata, Litoral')
ON CONFLICT (entity_code, location_code) DO NOTHING;

-- MINHV Locations (Ministerio de Hacienda - Tesoro)
INSERT INTO entity_locations (entity_code, location_code, location_name, city, province, region, is_main_office, address) VALUES
('MINHV', 'MINHV_MALABO', 'Tesoro Malabo', 'Malabo', 'Bioko Norte', 'Insular', TRUE, 'Malabo, Bioko Norte'),
('MINHV', 'MINHV_BATA', 'Tesoro Bata', 'Bata', 'Litoral', 'Continental', FALSE, 'Bata, Litoral')
ON CONFLICT (entity_code, location_code) DO NOTHING;

-- ============================================================================
-- 3. ADD FOREIGN KEY TO APPOINTMENT_SLOT_CONFIGS
-- ============================================================================

ALTER TABLE appointment_slot_configs
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES entity_locations(id);

-- Update existing slot configs to reference entity_locations
UPDATE appointment_slot_configs asc
SET location_id = el.id
FROM entity_locations el
WHERE asc.entity_code = el.entity_code
AND asc.location_name = el.location_name
AND asc.location_id IS NULL;

COMMENT ON COLUMN appointment_slot_configs.location_id IS 'FK to entity_locations table for proper location management';

-- ============================================================================
-- 4. ADD FOREIGN KEY TO APPOINTMENT_HOLDS
-- ============================================================================

ALTER TABLE appointment_holds
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES entity_locations(id);

-- Update existing holds to reference entity_locations
UPDATE appointment_holds ah
SET location_id = el.id
FROM entity_locations el
WHERE ah.entity_code = el.entity_code
AND ah.location_name = el.location_name
AND ah.location_id IS NULL;

COMMENT ON COLUMN appointment_holds.location_id IS 'FK to entity_locations table';

-- ============================================================================
-- 5. ADD FOREIGN KEY TO SERVICE_REQUESTS
-- ============================================================================

ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS selected_location_id UUID REFERENCES entity_locations(id);

COMMENT ON COLUMN service_requests.selected_location_id IS 'FK to entity_locations - user selected location for appointment';

-- ============================================================================
-- 6. UPDATE v_entity_locations VIEW
-- ============================================================================
-- Now uses the entity_locations table instead of deriving from slot_configs

DROP VIEW IF EXISTS v_entity_locations;

CREATE VIEW v_entity_locations AS
SELECT
    id,
    entity_code,
    location_code,
    location_name,
    city,
    province,
    region,
    address,
    phone,
    email,
    is_main_office,
    is_active,
    latitude,
    longitude
FROM entity_locations
WHERE is_active = TRUE
ORDER BY entity_code, is_main_office DESC, location_name;

COMMENT ON VIEW v_entity_locations IS 'Active locations per entity for appointment selection';

-- ============================================================================
-- 7. FUNCTION: Get Entity Locations
-- ============================================================================
-- Returns all active locations for an entity

CREATE OR REPLACE FUNCTION get_entity_locations(
    p_entity_code VARCHAR(50)
)
RETURNS TABLE (
    id UUID,
    location_code VARCHAR(50),
    location_name VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    address TEXT,
    is_main_office BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        el.id,
        el.location_code,
        el.location_name,
        el.city,
        el.province,
        el.address,
        el.is_main_office
    FROM entity_locations el
    WHERE el.entity_code = p_entity_code
    AND el.is_active = TRUE
    ORDER BY el.is_main_office DESC, el.location_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_entity_locations IS 'Returns all active locations for an entity (main office first)';

-- ============================================================================
-- 8. UPDATE hold_appointment_slot FUNCTION
-- ============================================================================
-- Now accepts location_id parameter and stores it

CREATE OR REPLACE FUNCTION hold_appointment_slot(
    p_service_request_id UUID,
    p_entity_code VARCHAR(50),
    p_location_name VARCHAR(255),
    p_location_address TEXT,
    p_appointment_date DATE,
    p_appointment_time TIME,
    p_hold_minutes INTEGER DEFAULT 15
) RETURNS appointment_holds AS $$
DECLARE
    v_hold appointment_holds;
    v_expires_at TIMESTAMPTZ;
    v_location_id UUID;
BEGIN
    -- Calculate expiration time
    v_expires_at := NOW() + (p_hold_minutes || ' minutes')::INTERVAL;

    -- Get location_id from entity_locations
    SELECT id INTO v_location_id
    FROM entity_locations
    WHERE entity_code = p_entity_code
    AND location_name = p_location_name
    AND is_active = TRUE
    LIMIT 1;

    -- Release any existing hold for this request
    UPDATE appointment_holds
    SET status = 'released',
        released_at = NOW()
    WHERE service_request_id = p_service_request_id
    AND status = 'held';

    -- Create new hold
    INSERT INTO appointment_holds (
        service_request_id,
        entity_code,
        location_id,
        location_name,
        location_address,
        appointment_date,
        appointment_time,
        expires_at,
        status
    ) VALUES (
        p_service_request_id,
        p_entity_code,
        v_location_id,
        p_location_name,
        p_location_address,
        p_appointment_date,
        p_appointment_time,
        v_expires_at,
        'held'
    )
    ON CONFLICT (service_request_id)
    DO UPDATE SET
        entity_code = EXCLUDED.entity_code,
        location_id = EXCLUDED.location_id,
        location_name = EXCLUDED.location_name,
        location_address = EXCLUDED.location_address,
        appointment_date = EXCLUDED.appointment_date,
        appointment_time = EXCLUDED.appointment_time,
        expires_at = EXCLUDED.expires_at,
        status = 'held',
        released_at = NULL,
        expired_at = NULL,
        confirmed_at = NULL,
        created_at = NOW()
    RETURNING * INTO v_hold;

    -- Update service_request with selected location
    UPDATE service_requests
    SET selected_location = p_location_name,
        selected_location_id = v_location_id,
        updated_at = NOW()
    WHERE id = p_service_request_id;

    RETURN v_hold;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hold_appointment_slot IS 'Creates a temporary hold on an appointment slot. Now stores location_id FK.';

-- ============================================================================
-- 9. APPOINTMENT_ENTITY_MAPPING TABLE
-- ============================================================================
-- Maps workflow codes to their appointment entity
-- e.g., PASAPORTE_NUEVO -> CNEDOGE

CREATE TABLE IF NOT EXISTS appointment_entity_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code VARCHAR(100) NOT NULL UNIQUE,
    entity_code VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO appointment_entity_mapping (workflow_code, entity_code) VALUES
-- Passport workflows -> CNEDOGE
('PASAPORTE_NUEVO', 'CNEDOGE'),
('PASAPORTE_RENOVACION', 'CNEDOGE'),
('PASAPORTE_PERDIDA', 'CNEDOGE'),
('PASAPORTE_ROBO', 'CNEDOGE'),
('PASAPORTE_DETERIORO', 'CNEDOGE'),
-- Residence workflows -> EXTRANJERIA
('RESIDENCIA_EXPEDICION', 'EXTRANJERIA'),
('RESIDENCIA_RENOVACION', 'EXTRANJERIA'),
-- Vehicle workflows -> DGT
('VEHICULO_MATRICULA', 'DGT'),
('VEHICULO_INSPECCION', 'DGT'),
('CONDUCIR_EXPEDICION', 'DGT'),
('CONDUCIR_RENOVACION', 'DGT'),
-- Funcionario workflows -> MINFP
('FUNCIONARIO_VERIFICACION', 'MINFP'),
('FUNCIONARIO_CARNET', 'MINFP'),
('PROMOCION_ADMINISTRATIVA', 'MINFP')
ON CONFLICT (workflow_code) DO NOTHING;

COMMENT ON TABLE appointment_entity_mapping IS 'Maps workflow codes to their appointment entity (CNEDOGE, DGT, etc.)';

-- ============================================================================
-- 10. FUNCTION: Get Entity Code for Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION get_appointment_entity_for_workflow(
    p_workflow_code VARCHAR(100)
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_entity_code VARCHAR(50);
BEGIN
    -- Try exact match first
    SELECT entity_code INTO v_entity_code
    FROM appointment_entity_mapping
    WHERE workflow_code = p_workflow_code
    AND is_active = TRUE;

    IF v_entity_code IS NOT NULL THEN
        RETURN v_entity_code;
    END IF;

    -- Try prefix matching
    IF p_workflow_code LIKE 'PASAPORTE%' THEN RETURN 'CNEDOGE'; END IF;
    IF p_workflow_code LIKE 'DIP%' THEN RETURN 'CNEDOGE'; END IF;
    IF p_workflow_code LIKE 'CONDUCIR%' THEN RETURN 'DGT'; END IF;
    IF p_workflow_code LIKE 'VEHICULO%' THEN RETURN 'DGT'; END IF;
    IF p_workflow_code LIKE 'RESIDENCIA%' THEN RETURN 'EXTRANJERIA'; END IF;
    IF p_workflow_code LIKE 'VISA%' THEN RETURN 'EXTRANJERIA'; END IF;
    IF p_workflow_code LIKE 'FUNCIONARIO%' THEN RETURN 'MINFP'; END IF;
    IF p_workflow_code LIKE 'CARNET%' THEN RETURN 'MINFP'; END IF;

    -- Default to CNEDOGE
    RETURN 'CNEDOGE';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_appointment_entity_for_workflow IS 'Returns the appointment entity code for a given workflow code';

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (run separately if needed)
-- ============================================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS get_appointment_entity_for_workflow;
-- DROP FUNCTION IF EXISTS get_entity_locations;
-- DROP TABLE IF EXISTS appointment_entity_mapping;
-- ALTER TABLE service_requests DROP COLUMN IF EXISTS selected_location_id;
-- ALTER TABLE appointment_holds DROP COLUMN IF EXISTS location_id;
-- ALTER TABLE appointment_slot_configs DROP COLUMN IF EXISTS location_id;
-- DROP VIEW IF EXISTS v_entity_locations;
-- DROP TABLE IF EXISTS entity_locations;
-- COMMIT;
