-- Migration 099: Update valid_city CHECK constraint to include Baney
-- The old constraint only allowed: Malabo, Bata, Mongomo, Evinayong, Ebebiyin
-- Baney was added to the cities table but not to the CHECK constraint

ALTER TABLE entity_locations DROP CONSTRAINT IF EXISTS valid_city;

ALTER TABLE entity_locations ADD CONSTRAINT valid_city
    CHECK (city IN ('Malabo', 'Bata', 'Mongomo', 'Evinayong', 'Ebebiyin', 'Baney'));
