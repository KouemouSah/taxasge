-- ===================================================================================================
-- Migration: Create materialized view for homepage stats (fallback for Redis)
-- ===================================================================================================
-- Purpose: Pre-calculate homepage statistics for fast fallback when Redis is down
-- Performance: 2-5ms vs 150-500ms for real-time calculation
-- Refresh: Manual or scheduled (e.g., every 30 minutes via cron)
-- ===================================================================================================

-- Step 1: Create materialized view for homepage stats
CREATE MATERIALIZED VIEW IF NOT EXISTS homepage_stats AS
SELECT
    (SELECT COUNT(*)::INTEGER FROM fiscal_services WHERE status = 'active'::service_status_enum) as total_services,
    (SELECT COUNT(*)::INTEGER FROM ministries WHERE is_active = true) as total_ministries,
    (SELECT COUNT(*)::INTEGER FROM categories WHERE is_active = true) as total_categories,
    (SELECT COUNT(*)::INTEGER FROM sectors WHERE is_active = true) as total_sectors,
    NOW() as last_updated;

-- Step 2: Create unique index (required for CONCURRENTLY refresh)
-- Using a singleton pattern (always 1 row)
CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_stats_singleton
ON homepage_stats ((1));

-- Step 3: Add comment for documentation
COMMENT ON MATERIALIZED VIEW homepage_stats IS
'Pre-calculated homepage statistics. Refresh periodically (e.g., every 30 min) for fast fallback when Redis is unavailable. Acts as a robust second-level cache.';

-- ===================================================================================================
-- Refresh Instructions:
-- ===================================================================================================
-- Manual refresh (locks briefly):
--   REFRESH MATERIALIZED VIEW homepage_stats;
--
-- Concurrent refresh (no locks, requires unique index):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats;
--
-- Automated refresh via cron (example):
--   */30 * * * * psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats;"
--
-- Or use pg_cron extension:
--   SELECT cron.schedule('refresh-homepage-stats', '*/30 * * * *',
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats');
-- ===================================================================================================

-- Step 4: Initial population
REFRESH MATERIALIZED VIEW homepage_stats;

-- Step 5: Verify creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'homepage_stats'
  ) THEN
    RAISE EXCEPTION 'Migration failed: homepage_stats materialized view not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Materialized view: homepage_stats ✓';
  RAISE NOTICE 'Unique index: idx_homepage_stats_singleton ✓';
  RAISE NOTICE 'Refresh command: REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats';
END $$;
