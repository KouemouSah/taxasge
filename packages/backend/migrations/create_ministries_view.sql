-- ===================================================================================================
-- Migration: Create materialized view for ministries with statistics
-- ===================================================================================================
-- Purpose: Pre-calculate ministry statistics (categories count, services count) for fast fallback
-- Performance: 2-5ms vs 150-500ms for real-time calculation with multiple JOINs and GROUP BY
-- Refresh: Manual or scheduled (e.g., every 30 minutes via cron)
-- ===================================================================================================

-- Step 1: Create materialized view for ministries with stats
CREATE MATERIALIZED VIEW IF NOT EXISTS ministries_with_stats AS
SELECT
    m.id,
    m.ministry_code,
    m.name_es,
    m.description_es,
    m.website_url,
    m.contact_email,
    m.contact_phone,
    m.is_active,
    COUNT(DISTINCT c.id)::INTEGER as categories_count,
    COUNT(DISTINCT fs.id)::INTEGER as services_count,
    NOW() as last_updated
FROM ministries m
LEFT JOIN categories c ON c.ministry_id = m.id AND c.is_active = true
LEFT JOIN fiscal_services fs ON fs.category_id = c.id AND fs.status = 'active'::service_status_enum
WHERE m.is_active = true
GROUP BY m.id, m.ministry_code, m.name_es, m.description_es,
         m.website_url, m.contact_email, m.contact_phone, m.is_active
ORDER BY services_count DESC, m.name_es ASC;

-- Step 2: Create unique index (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ministries_with_stats_id
ON ministries_with_stats (id);

-- Step 3: Create additional index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ministries_with_stats_services_count
ON ministries_with_stats (services_count DESC);

-- Step 4: Add comment for documentation
COMMENT ON MATERIALIZED VIEW ministries_with_stats IS
'Pre-calculated ministry statistics with categories and services counts. Refresh periodically (e.g., every 30 min) for fast fallback when Redis is unavailable. Acts as a robust second-level cache.';

-- ===================================================================================================
-- Refresh Instructions:
-- ===================================================================================================
-- Manual refresh (locks briefly):
--   REFRESH MATERIALIZED VIEW ministries_with_stats;
--
-- Concurrent refresh (no locks, requires unique index):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats;
--
-- Automated refresh via cron (example):
--   */30 * * * * psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats;"
--
-- Or use pg_cron extension:
--   SELECT cron.schedule('refresh-ministries', '*/30 * * * *',
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats');
-- ===================================================================================================

-- Step 5: Initial population
REFRESH MATERIALIZED VIEW ministries_with_stats;

-- Step 6: Verify creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'ministries_with_stats'
  ) THEN
    RAISE EXCEPTION 'Migration failed: ministries_with_stats materialized view not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Materialized view: ministries_with_stats ✓';
  RAISE NOTICE 'Unique index: idx_ministries_with_stats_id ✓';
  RAISE NOTICE 'Additional index: idx_ministries_with_stats_services_count ✓';
  RAISE NOTICE 'Refresh command: REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats';
END $$;
