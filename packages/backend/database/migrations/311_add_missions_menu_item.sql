-- Migration 311: Add missions menu item to supervisor inspection menus
--
-- Adds a direct "Missions" entry in the inspection_supervision menu group
-- for all supervisor roles that have inspection.manage_missions permission.

BEGIN;

-- Update supervisor_ayuntamiento and supervisor_camara
UPDATE roles
SET menu_config = jsonb_set(
    menu_config,
    '{items}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'id' = 'inspection_supervision' THEN
                    jsonb_set(
                        item,
                        '{items}',
                        (item->'items') || '[{"id":"missions_hub","href":"/dashboard/supervisor/inspections/missions","icon":"CalendarDays","titleKey":"inspection.nav.missions","permission":"inspection.manage_missions"}]'::jsonb
                    )
                ELSE item
            END
        )
        FROM jsonb_array_elements(menu_config->'items') AS item
    )
)
WHERE code IN (
    'supervisor_ayuntamiento', 'supervisor_camara',
    'supervisor_min_comercio', 'supervisor_min_hacienda',
    'supervisor_min_informacion', 'supervisor_min_turismo',
    'supervisor_min_agricultura', 'supervisor_min_electricidad',
    'supervisor_tesoro'
)
AND menu_config IS NOT NULL
AND menu_config->'items' IS NOT NULL
-- Only if missions_hub not already present
AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(menu_config->'items') AS item,
                  jsonb_array_elements(item->'items') AS sub
    WHERE sub->>'id' = 'missions_hub'
);

COMMIT;
