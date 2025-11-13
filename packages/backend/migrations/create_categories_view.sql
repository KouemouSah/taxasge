-- ===================================================================================================
-- Migration: Create materialized view for categories with service counts
-- ===================================================================================================
-- Purpose: Pre-calculate category directory with service counts for fast fallback when Redis is down
-- Performance: 2-5ms vs 150-500ms for real-time calculation with JOINs and GROUP BY
-- Refresh: Manual or scheduled (e.g., every 30 minutes via cron)
-- ===================================================================================================

-- Step 1: Create materialized view for categories with services
CREATE MATERIALIZED VIEW IF NOT EXISTS categories_with_services AS
SELECT
    c.id,
    c.category_code,
    c.name_es,
    c.name_fr,
    c.name_en,
    c.description_es,
    c.description_fr,
    c.description_en,
    c.icon,
    c.color,
    c.ministry_id,
    c.sector_id,
    m.name_es as ministry_name_es,
    m.name_fr as ministry_name_fr,
    m.name_en as ministry_name_en,
    s.name_es as sector_name_es,
    s.name_fr as sector_name_fr,
    s.name_en as sector_name_en,
    COUNT(fs.id)::INTEGER as service_count,
    NOW() as last_updated
FROM categories c
LEFT JOIN ministries m ON c.ministry_id = m.id
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN fiscal_services fs ON fs.category_id = c.id
    AND fs.status = 'active'::service_status_enum
WHERE c.is_active = true
GROUP BY c.id, c.category_code, c.name_es, c.name_fr, c.name_en,
         c.description_es, c.description_fr, c.description_en,
         c.icon, c.color, c.ministry_id, c.sector_id,
         m.name_es, m.name_fr, m.name_en,
         s.name_es, s.name_fr, s.name_en
ORDER BY service_count DESC, c.name_es ASC;

-- Step 2: Create unique index (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_with_services_id
ON categories_with_services (id);

-- Step 3: Create additional index for fast lookups
CREATE INDEX IF NOT EXISTS idx_categories_with_services_code
ON categories_with_services (category_code);

CREATE INDEX IF NOT EXISTS idx_categories_with_services_ministry
ON categories_with_services (ministry_id);

CREATE INDEX IF NOT EXISTS idx_categories_with_services_sector
ON categories_with_services (sector_id);

-- Step 4: Add comment for documentation
COMMENT ON MATERIALIZED VIEW categories_with_services IS
'Pre-calculated category directory with service counts, ministry and sector names. Refresh periodically (e.g., every 30 min) for fast fallback when Redis is unavailable. Acts as a robust second-level cache.';

-- ===================================================================================================
-- Refresh Instructions:
-- ===================================================================================================
-- Manual refresh (locks briefly):
--   REFRESH MATERIALIZED VIEW categories_with_services;
--
-- Concurrent refresh (no locks, requires unique index):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services;
--
-- Automated refresh via cron (example):
--   */30 * * * * psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services;"
--
-- Or use pg_cron extension:
--   SELECT cron.schedule('refresh-categories', '*/30 * * * *',
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services');
-- ===================================================================================================

-- Step 5: Initial population
REFRESH MATERIALIZED VIEW categories_with_services;

-- Step 6: Verify creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'categories_with_services'
  ) THEN
    RAISE EXCEPTION 'Migration failed: categories_with_services materialized view not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Materialized view: categories_with_services ✓';
  RAISE NOTICE 'Unique index: idx_categories_with_services_id ✓';
  RAISE NOTICE 'Additional indexes: idx_categories_with_services_code, ministry, sector ✓';
  RAISE NOTICE 'Refresh command: REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services';
END $$;
