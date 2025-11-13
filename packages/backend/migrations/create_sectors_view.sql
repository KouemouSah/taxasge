-- ===================================================================================================
-- Migration: Create materialized view for sectors with statistics
-- ===================================================================================================
-- Purpose: Pre-calculate sector statistics (categories count, services count) for fast fallback
-- Performance: 2-5ms vs 150-500ms for real-time calculation with multiple JOINs and GROUP BY
-- Refresh: Manual or scheduled (e.g., every 30 minutes via cron)
-- ===================================================================================================

-- Step 1: Create materialized view for sectors with stats
CREATE MATERIALIZED VIEW IF NOT EXISTS sectors_with_stats AS
SELECT
    s.id,
    s.sector_code,
    s.ministry_id,
    s.name_es,
    s.description_es,
    s.is_active,
    COUNT(DISTINCT c.id)::INTEGER as categories_count,
    COUNT(DISTINCT fs.id)::INTEGER as services_count,
    NOW() as last_updated
FROM sectors s
LEFT JOIN categories c ON c.sector_id = s.id AND c.is_active = true
LEFT JOIN fiscal_services fs ON fs.category_id = c.id AND fs.status = 'active'::service_status_enum
WHERE s.is_active = true
GROUP BY s.id, s.sector_code, s.ministry_id, s.name_es, s.description_es,
         s.is_active
ORDER BY services_count DESC, s.name_es ASC;

-- Step 2: Create unique index (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sectors_with_stats_id
ON sectors_with_stats (id);

-- Step 3: Create additional index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sectors_with_stats_services_count
ON sectors_with_stats (services_count DESC);

-- Step 4: Add comment for documentation
COMMENT ON MATERIALIZED VIEW sectors_with_stats IS
'Pre-calculated sector statistics with categories and services counts. Refresh periodically (e.g., every 30 min) for fast fallback when Redis is unavailable. Acts as a robust second-level cache.';

-- ===================================================================================================
-- Refresh Instructions:
-- ===================================================================================================
-- Manual refresh (locks briefly):
--   REFRESH MATERIALIZED VIEW sectors_with_stats;
--
-- Concurrent refresh (no locks, requires unique index):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats;
--
-- Automated refresh via cron (example):
--   */30 * * * * psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats;"
--
-- Or use pg_cron extension:
--   SELECT cron.schedule('refresh-sectors', '*/30 * * * *',
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats');
-- ===================================================================================================

-- Step 5: Initial population
REFRESH MATERIALIZED VIEW sectors_with_stats;

-- Step 6: Verify creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'sectors_with_stats'
  ) THEN
    RAISE EXCEPTION 'Migration failed: sectors_with_stats materialized view not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Materialized view: sectors_with_stats ✓';
  RAISE NOTICE 'Unique index: idx_sectors_with_stats_id ✓';
  RAISE NOTICE 'Additional index: idx_sectors_with_stats_services_count ✓';
  RAISE NOTICE 'Refresh command: REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats';
END $$;
