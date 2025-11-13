# Database Migrations

## Migration: Add ts_vector Full-Text Search

### File: `add_tsvector_to_fiscal_services.sql`

This migration adds PostgreSQL full-text search capabilities to the `fiscal_services` table using `tsvector` and GIN indexing.

### Performance Impact
- **Before**: ILIKE-based search (~50-200ms for 10K rows)
- **After**: ts_vector indexed search (~2-10ms for 10K rows)
- **Improvement**: 10-100x faster search queries

### What This Migration Does

1. **Adds `search_vector` column** (tsvector type)
2. **Creates trigger function** to auto-update search_vector on INSERT/UPDATE
3. **Creates GIN index** for fast full-text search
4. **Populates existing rows** with search_vector data
5. **Verifies migration** completed successfully

### How to Run

#### Option 1: Via psql (Recommended)

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i packages/backend/migrations/add_tsvector_to_fiscal_services.sql

# Verify it worked
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fiscal_services' AND column_name = 'search_vector';
```

#### Option 2: Via Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `add_tsvector_to_fiscal_services.sql`
3. Paste and execute
4. Check for success message: "Migration completed successfully!"

#### Option 3: Via Command Line

```bash
# From project root
psql $DATABASE_URL -f packages/backend/migrations/add_tsvector_to_fiscal_services.sql
```

### Verification

After running the migration, verify:

```sql
-- Check column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'fiscal_services' AND column_name = 'search_vector';

-- Check index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'fiscal_services' AND indexname = 'idx_fiscal_services_search_vector';

-- Check trigger exists
SELECT tgname FROM pg_trigger
WHERE tgname = 'fiscal_services_search_vector_trigger';

-- Test search performance
EXPLAIN ANALYZE
SELECT * FROM fiscal_services
WHERE search_vector @@ plainto_tsquery('spanish', 'permiso construccion');
```

### Backward Compatibility

**Important**: The API code has been designed with backward compatibility:

- If migration NOT run: Uses ILIKE fallback (slower but works)
- If migration IS run: Uses ts_vector (10-100x faster)

This means the API will work **before** and **after** running the migration.

### Rollback

If needed, you can rollback:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS fiscal_services_search_vector_trigger ON fiscal_services;

-- Remove function
DROP FUNCTION IF EXISTS fiscal_services_search_vector_update();

-- Remove index
DROP INDEX IF EXISTS idx_fiscal_services_search_vector;

-- Remove column
ALTER TABLE fiscal_services DROP COLUMN IF EXISTS search_vector;
```

### Language Configuration

This migration uses **Spanish** language configuration:

```sql
to_tsvector('spanish', text)
plainto_tsquery('spanish', query)
```

If you need multi-language support, you would need:
- Separate tsvector columns for each language
- Or use a different language stemmer

### Performance Tips

1. **Analyze the table** after migration:
   ```sql
   ANALYZE fiscal_services;
   ```

2. **Monitor query performance**:
   ```sql
   -- Check index usage
   SELECT * FROM pg_stat_user_indexes
   WHERE indexrelname = 'idx_fiscal_services_search_vector';
   ```

3. **Update statistics regularly**:
   ```sql
   -- Run weekly or after bulk inserts
   ANALYZE fiscal_services;
   ```

### Search Examples

After migration, you can use advanced search:

```sql
-- Simple search
SELECT * FROM fiscal_services
WHERE search_vector @@ plainto_tsquery('spanish', 'permiso');

-- Multiple words (AND)
SELECT * FROM fiscal_services
WHERE search_vector @@ plainto_tsquery('spanish', 'permiso construccion');

-- With ranking
SELECT id, name_es, ts_rank(search_vector, query) AS rank
FROM fiscal_services, plainto_tsquery('spanish', 'permiso construccion') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Phrase search
SELECT * FROM fiscal_services
WHERE search_vector @@ phraseto_tsquery('spanish', 'permiso de construccion');
```

### Troubleshooting

**Error: "column search_vector does not exist"**
- Migration not run yet
- API will use ILIKE fallback (works but slower)

**Error: "function fiscal_services_search_vector_update already exists"**
- Migration already run
- Safe to ignore or use `DROP FUNCTION IF EXISTS` first

**Slow searches after migration**
- Run `ANALYZE fiscal_services;`
- Check index exists: `\d fiscal_services`
- Verify GIN index is being used: `EXPLAIN ANALYZE SELECT ...`

### Maintenance

- **No maintenance required** - trigger auto-updates search_vector
- Optional: Run `ANALYZE fiscal_services` weekly
- Monitor index size: `SELECT pg_size_pretty(pg_relation_size('idx_fiscal_services_search_vector'));`

### Questions?

See PostgreSQL documentation on full-text search:
- https://www.postgresql.org/docs/current/textsearch.html
- https://www.postgresql.org/docs/current/textsearch-indexes.html
