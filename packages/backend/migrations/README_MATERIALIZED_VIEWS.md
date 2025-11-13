# Materialized Views for TaxasGE

## 📋 Overview

This directory contains SQL migrations for creating **materialized views** that act as a robust second-level cache for the TaxasGE application.

## 🏗️ Architecture: 3-Layer Caching System

```
┌──────────────────────────────────────────────────────────────┐
│                    Request Flow                               │
└──────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │   Client Request    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  Layer 1: Redis     │  ⚡ ~5ms
    │  (Primary Cache)    │
    └──────────┬──────────┘
               │ Cache Miss or Redis Down
               ▼
    ┌─────────────────────┐
    │  Layer 2: MV        │  🚀 ~2-5ms
    │  (Fallback Cache)   │
    └──────────┬──────────┘
               │ View unavailable
               ▼
    ┌─────────────────────┐
    │  Layer 3: Direct    │  🐌 ~150-500ms
    │  (Last Resort)      │
    └─────────────────────┘
```

## 📊 Materialized Views

### 1. `homepage_stats`
**File:** `create_homepage_stats_view.sql`

**Purpose:** Pre-calculate homepage statistics (total services, ministries, categories, sectors)

**Refresh Frequency:** Every 30 minutes

**Performance:** 2-5ms vs 150-500ms for direct calculation

### 2. `categories_with_services`
**File:** `create_categories_view.sql`

**Purpose:** Pre-calculate category directory with service counts, ministry and sector names

**Refresh Frequency:** Every 30 minutes

**Performance:** 2-5ms vs 150-500ms for JOINs and GROUP BY

**Indexes:**
- `idx_categories_with_services_id` (unique, for concurrent refresh)
- `idx_categories_with_services_code` (for fast lookups by code)
- `idx_categories_with_services_ministry` (for ministry filtering)
- `idx_categories_with_services_sector` (for sector filtering)

### 3. `ministries_with_stats`
**File:** `create_ministries_view.sql`

**Purpose:** Pre-calculate ministry statistics (categories count, services count)

**Refresh Frequency:** Every 30 minutes

**Performance:** 2-5ms vs 150-500ms for multiple JOINs

**Indexes:**
- `idx_ministries_with_stats_id` (unique, for concurrent refresh)
- `idx_ministries_with_stats_services_count` (for sorting by popularity)

### 4. `sectors_with_stats`
**File:** `create_sectors_view.sql`

**Purpose:** Pre-calculate sector statistics (categories count, services count)

**Refresh Frequency:** Every 30 minutes

**Performance:** 2-5ms vs 150-500ms for multiple JOINs

**Indexes:**
- `idx_sectors_with_stats_id` (unique, for concurrent refresh)
- `idx_sectors_with_stats_services_count` (for sorting by popularity)

## 🚀 Quick Start

### Initial Setup (Run Once)

```bash
cd packages/backend/migrations
./run_materialized_views.sh create
```

This will:
1. Create all 4 materialized views
2. Create all necessary indexes
3. Perform initial data population

### Manual Refresh

```bash
./run_materialized_views.sh refresh
```

This will refresh all views **concurrently** (non-blocking) with the latest data.

### Check Status

```bash
./run_materialized_views.sh status
```

Shows:
- View sizes
- Row counts
- Last update timestamps
- Index status

## 🔄 Automated Refresh

### Option 1: Using Cron

Add to your crontab:

```bash
# Refresh materialized views every 30 minutes
*/30 * * * * cd /path/to/taxasge/packages/backend/migrations && ./run_materialized_views.sh refresh >> /var/log/taxasge/mv_refresh.log 2>&1
```

### Option 2: Using pg_cron (PostgreSQL Extension)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule automatic refresh every 30 minutes
SELECT cron.schedule('refresh-homepage-stats', '*/30 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats');

SELECT cron.schedule('refresh-categories', '*/30 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services');

SELECT cron.schedule('refresh-ministries', '*/30 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats');

SELECT cron.schedule('refresh-sectors', '*/30 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats');

-- View scheduled jobs
SELECT * FROM cron.job;
```

### Option 3: Using Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: refresh-materialized-views
spec:
  schedule: "*/30 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: refresh-views
            image: postgres:15
            command:
            - /bin/sh
            - -c
            - |
              psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats;"
              psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services;"
              psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats;"
              psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats;"
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: taxasge-secrets
                  key: database-url
          restartPolicy: OnFailure
```

## 🔍 Monitoring

### Check Last Refresh Time

```sql
SELECT
    'homepage_stats' as view_name,
    last_updated
FROM homepage_stats
UNION ALL
SELECT
    'categories_with_services',
    MAX(last_updated)
FROM categories_with_services
UNION ALL
SELECT
    'ministries_with_stats',
    MAX(last_updated)
FROM ministries_with_stats
UNION ALL
SELECT
    'sectors_with_stats',
    MAX(last_updated)
FROM sectors_with_stats;
```

### Check View Sizes

```sql
SELECT
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE matviewname IN (
    'homepage_stats',
    'categories_with_services',
    'ministries_with_stats',
    'sectors_with_stats'
)
ORDER BY pg_total_relation_size(schemaname||'.'||matviewname) DESC;
```

## 🛡️ Benefits

### 1. **High Availability**
- Application remains fast even when Redis is down
- Automatic fallback to materialized views

### 2. **Performance**
- 2-5ms response time for complex queries
- No expensive JOINs or GROUP BY operations at request time

### 3. **Data Consistency**
- Scheduled refresh ensures data freshness
- CONCURRENT refresh prevents query blocking

### 4. **Scalability**
- Reduces database load by pre-calculating expensive queries
- Multiple app instances can benefit from same materialized views

### 5. **Cost Efficiency**
- Lower database CPU usage
- Fewer read replicas needed

## 🔧 Maintenance

### Rebuild Views (if schema changes)

```bash
# Drop and recreate all views
cd packages/backend/migrations

psql $DATABASE_URL -c "DROP MATERIALIZED VIEW IF EXISTS homepage_stats CASCADE;"
psql $DATABASE_URL -c "DROP MATERIALIZED VIEW IF EXISTS categories_with_services CASCADE;"
psql $DATABASE_URL -c "DROP MATERIALIZED VIEW IF EXISTS ministries_with_stats CASCADE;"
psql $DATABASE_URL -c "DROP MATERIALIZED VIEW IF EXISTS sectors_with_stats CASCADE;"

./run_materialized_views.sh create
```

### Analyze Query Performance

```sql
EXPLAIN ANALYZE SELECT * FROM homepage_stats;
EXPLAIN ANALYZE SELECT * FROM categories_with_services ORDER BY service_count DESC;
```

## 📝 Notes

- All views use `CONCURRENTLY` refresh to avoid locking
- Views include `last_updated` timestamp for monitoring
- Unique indexes are required for concurrent refresh
- Views automatically handle NULL values and edge cases

## 🐛 Troubleshooting

### View Not Found Error

```bash
# Check if views exist
psql $DATABASE_URL -c "\dm"

# Recreate if missing
./run_materialized_views.sh create
```

### Refresh Taking Too Long

```sql
-- Check for locks
SELECT * FROM pg_locks WHERE relation = 'categories_with_services'::regclass;

-- Check current refresh operations
SELECT * FROM pg_stat_progress_create_index;
```

### Data Seems Stale

```bash
# Force immediate refresh
./run_materialized_views.sh refresh

# Check last update time
./run_materialized_views.sh status
```

## 📚 References

- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)
- [Concurrent Refresh](https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)
