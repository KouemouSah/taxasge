#!/bin/bash

# ===================================================================================================
# Script to create and refresh all materialized views
# ===================================================================================================
# Purpose: Setup and maintain materialized views for robust caching fallback
# Usage:
#   ./run_materialized_views.sh create   - Create all materialized views
#   ./run_materialized_views.sh refresh  - Refresh all materialized views
#   ./run_materialized_views.sh status   - Check status of materialized views
# ===================================================================================================

set -e  # Exit on error

# Database connection (override with environment variables if needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-taxasge}"
DB_USER="${DB_USER:-user}"
DB_PASSWORD="${DB_PASSWORD:-password}"

export PGPASSWORD="$DB_PASSWORD"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
create_views() {
    echo -e "${YELLOW}Creating materialized views...${NC}"

    echo -e "${GREEN}1/4 Creating homepage_stats view...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f create_homepage_stats_view.sql

    echo -e "${GREEN}2/4 Creating categories_with_services view...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f create_categories_view.sql

    echo -e "${GREEN}3/4 Creating ministries_with_stats view...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f create_ministries_view.sql

    echo -e "${GREEN}4/4 Creating sectors_with_stats view...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f create_sectors_view.sql

    echo -e "${GREEN}✓ All materialized views created successfully!${NC}"
}

refresh_views() {
    echo -e "${YELLOW}Refreshing materialized views...${NC}"

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Refresh all views concurrently (non-blocking)
REFRESH MATERIALIZED VIEW CONCURRENTLY homepage_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY categories_with_services;
REFRESH MATERIALIZED VIEW CONCURRENTLY ministries_with_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY sectors_with_stats;

-- Display refresh status
SELECT 'homepage_stats' as view_name, COUNT(*) as rows FROM homepage_stats
UNION ALL
SELECT 'categories_with_services', COUNT(*) FROM categories_with_services
UNION ALL
SELECT 'ministries_with_stats', COUNT(*) FROM ministries_with_stats
UNION ALL
SELECT 'sectors_with_stats', COUNT(*) FROM sectors_with_stats;
EOF

    echo -e "${GREEN}✓ All materialized views refreshed successfully!${NC}"
}

check_status() {
    echo -e "${YELLOW}Checking materialized views status...${NC}"

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- List all materialized views with their sizes
SELECT
    schemaname,
    matviewname as view_name,
    hasindexes as has_indexes,
    ispopulated as is_populated,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE matviewname IN ('homepage_stats', 'categories_with_services', 'ministries_with_stats', 'sectors_with_stats')
ORDER BY matviewname;

-- Show row counts
SELECT 'homepage_stats' as view_name,
       (SELECT COUNT(*) FROM homepage_stats) as rows,
       (SELECT last_updated FROM homepage_stats LIMIT 1) as last_updated
UNION ALL
SELECT 'categories_with_services',
       (SELECT COUNT(*) FROM categories_with_services),
       (SELECT MAX(last_updated) FROM categories_with_services)
UNION ALL
SELECT 'ministries_with_stats',
       (SELECT COUNT(*) FROM ministries_with_stats),
       (SELECT MAX(last_updated) FROM ministries_with_stats)
UNION ALL
SELECT 'sectors_with_stats',
       (SELECT COUNT(*) FROM sectors_with_stats),
       (SELECT MAX(last_updated) FROM sectors_with_stats);
EOF
}

# Main script logic
case "${1:-}" in
    create)
        create_views
        ;;
    refresh)
        refresh_views
        ;;
    status)
        check_status
        ;;
    *)
        echo -e "${RED}Usage: $0 {create|refresh|status}${NC}"
        echo ""
        echo "Commands:"
        echo "  create   - Create all materialized views (run once during setup)"
        echo "  refresh  - Refresh all materialized views (run periodically)"
        echo "  status   - Check status and row counts of materialized views"
        echo ""
        echo "Example:"
        echo "  $0 create    # Initial setup"
        echo "  $0 refresh   # Update data"
        echo "  $0 status    # Check current state"
        exit 1
        ;;
esac
