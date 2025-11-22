-- ============================================================================
-- Migration: Add pgvector extension and embeddings for AI chatbot
-- ============================================================================
-- Description: Adds vector search capabilities for RAG-based chatbot
-- Author: Claude Code
-- Date: 2025-01-22
-- Dependencies: PostgreSQL 12+, pgvector extension
-- ============================================================================

-- Step 1: Enable pgvector extension
-- NOTE: Requires superuser or extension creation privileges
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        RAISE EXCEPTION 'pgvector extension not installed. Please install it first:
            apt-get install postgresql-15-pgvector (Debian/Ubuntu)
            or follow https://github.com/pgvector/pgvector';
    END IF;
    RAISE NOTICE 'pgvector extension verified successfully';
END $$;

-- ============================================================================
-- Step 2: Add embedding column to fiscal_services
-- ============================================================================

-- Add vector column (768 dimensions for Gemini text-embedding-004)
ALTER TABLE fiscal_services
ADD COLUMN IF NOT EXISTS embedding vector(768);

COMMENT ON COLUMN fiscal_services.embedding IS
'Semantic embedding vector for AI search (Gemini text-embedding-004, 768 dimensions)';

-- ============================================================================
-- Step 3: Create vector similarity search indexes
-- ============================================================================

-- HNSW index for fast approximate nearest neighbor search
-- Parameters:
--   m = 16 (max connections per layer, higher = better recall but slower build)
--   ef_construction = 64 (size of dynamic candidate list, higher = better recall)
CREATE INDEX IF NOT EXISTS idx_fiscal_services_embedding_hnsw
ON fiscal_services
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX idx_fiscal_services_embedding_hnsw IS
'HNSW index for fast vector similarity search using cosine distance';

-- IVFFlat index as alternative (faster build, slower query for large datasets)
-- Uncomment if you prefer IVFFlat:
-- CREATE INDEX idx_fiscal_services_embedding_ivfflat
-- ON fiscal_services
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- ============================================================================
-- Step 4: Add metadata columns for embedding management
-- ============================================================================

-- Track when embeddings were generated/updated
ALTER TABLE fiscal_services
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'text-embedding-004',
ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 1;

COMMENT ON COLUMN fiscal_services.embedding_generated_at IS
'Timestamp when the embedding was last generated/updated';

COMMENT ON COLUMN fiscal_services.embedding_model IS
'Model used to generate the embedding (e.g., text-embedding-004)';

COMMENT ON COLUMN fiscal_services.embedding_version IS
'Version of the embedding (incremented on regeneration)';

-- ============================================================================
-- Step 5: Create function to prepare text for embedding
-- ============================================================================

CREATE OR REPLACE FUNCTION prepare_service_text_for_embedding(
    p_service_id INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_text TEXT;
    v_keywords TEXT;
    v_category TEXT;
    v_sector TEXT;
    v_ministry TEXT;
BEGIN
    -- Build comprehensive text combining all relevant fields
    SELECT
        format('Servicio: %s | Código: %s | Descripción: %s | Categoría: %s | Sector: %s | Ministerio: %s | Palabras clave: %s',
            fs.name_es,
            fs.service_code,
            COALESCE(fs.description_es, ''),
            COALESCE(c.name_es, ''),
            COALESCE(s.name_es, ''),
            COALESCE(m.name_es, ''),
            COALESCE(
                (
                    SELECT string_agg(sk.keyword, ', ' ORDER BY sk.weight DESC)
                    FROM service_keywords sk
                    WHERE sk.fiscal_service_id = fs.id
                      AND sk.language_code = 'es'
                ),
                ''
            )
        )
    INTO v_text
    FROM fiscal_services fs
    LEFT JOIN categories c ON fs.category_id = c.id
    LEFT JOIN sectors s ON c.sector_id = s.id
    LEFT JOIN ministries m ON c.ministry_id = m.id
    WHERE fs.id = p_service_id;

    RETURN v_text;
END;
$$;

COMMENT ON FUNCTION prepare_service_text_for_embedding IS
'Prepares comprehensive text from fiscal service for embedding generation';

-- ============================================================================
-- Step 6: Create helper function for semantic search
-- ============================================================================

CREATE OR REPLACE FUNCTION search_fiscal_services_semantic(
    p_query_embedding vector(768),
    p_limit INTEGER DEFAULT 10,
    p_similarity_threshold FLOAT DEFAULT 0.7,
    p_category_id INTEGER DEFAULT NULL,
    p_service_type service_type_enum DEFAULT NULL
)
RETURNS TABLE (
    service_id INTEGER,
    service_code VARCHAR(10),
    name_es VARCHAR(255),
    description_es TEXT,
    category_name VARCHAR(255),
    sector_name VARCHAR(255),
    ministry_name VARCHAR(255),
    similarity_score FLOAT,
    tasa_expedicion NUMERIC,
    processing_time_days INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fs.id,
        fs.service_code,
        fs.name_es,
        fs.description_es,
        c.name_es as category_name,
        s.name_es as sector_name,
        m.name_es as ministry_name,
        (1 - (fs.embedding <-> p_query_embedding))::FLOAT as similarity_score,
        fs.tasa_expedicion,
        fs.processing_time_days
    FROM fiscal_services fs
    LEFT JOIN categories c ON fs.category_id = c.id
    LEFT JOIN sectors s ON c.sector_id = s.id
    LEFT JOIN ministries m ON c.ministry_id = m.id
    WHERE fs.status = 'active'
      AND fs.embedding IS NOT NULL
      AND (1 - (fs.embedding <-> p_query_embedding)) >= p_similarity_threshold
      AND (p_category_id IS NULL OR fs.category_id = p_category_id)
      AND (p_service_type IS NULL OR fs.service_type = p_service_type)
    ORDER BY fs.embedding <-> p_query_embedding
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION search_fiscal_services_semantic IS
'Search fiscal services using vector similarity with optional filters';

-- ============================================================================
-- Step 7: Create trigger to flag services needing embedding update
-- ============================================================================

-- Add flag column
ALTER TABLE fiscal_services
ADD COLUMN IF NOT EXISTS needs_embedding_update BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN fiscal_services.needs_embedding_update IS
'Flag indicating if service needs embedding regeneration after content update';

-- Trigger function
CREATE OR REPLACE FUNCTION flag_embedding_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Flag for update if relevant fields changed
    IF (TG_OP = 'INSERT') OR
       (OLD.name_es IS DISTINCT FROM NEW.name_es) OR
       (OLD.description_es IS DISTINCT FROM NEW.description_es) OR
       (OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
        NEW.needs_embedding_update = TRUE;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_flag_embedding_update ON fiscal_services;
CREATE TRIGGER trg_flag_embedding_update
    BEFORE INSERT OR UPDATE ON fiscal_services
    FOR EACH ROW
    EXECUTE FUNCTION flag_embedding_update();

COMMENT ON TRIGGER trg_flag_embedding_update ON fiscal_services IS
'Flags services needing embedding regeneration when content changes';

-- ============================================================================
-- Step 8: Create view for monitoring embedding status
-- ============================================================================

CREATE OR REPLACE VIEW v_embedding_status AS
SELECT
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as total_with_embeddings,
    COUNT(*) FILTER (WHERE embedding IS NULL) as total_without_embeddings,
    COUNT(*) FILTER (WHERE needs_embedding_update = TRUE) as total_needs_update,
    COUNT(*) as total_services,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0),
        2
    ) as coverage_percentage,
    MAX(embedding_generated_at) as last_embedding_generated,
    MIN(embedding_generated_at) FILTER (WHERE embedding IS NOT NULL) as first_embedding_generated
FROM fiscal_services
WHERE status = 'active';

COMMENT ON VIEW v_embedding_status IS
'Monitoring view showing embedding generation status across fiscal services';

-- ============================================================================
-- Step 9: Grant necessary permissions
-- ============================================================================

-- Grant usage on vector type to application role
-- Note: Adjust role name based on your application setup
DO $$
BEGIN
    -- Check if app role exists (common names)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taxasge_app') THEN
        GRANT SELECT, UPDATE ON fiscal_services TO taxasge_app;
    END IF;
END $$;

-- ============================================================================
-- Step 10: Verification and summary
-- ============================================================================

DO $$
DECLARE
    v_total_services INTEGER;
    v_with_embeddings INTEGER;
    v_needs_update INTEGER;
BEGIN
    SELECT
        total_services,
        total_with_embeddings,
        total_needs_update
    INTO v_total_services, v_with_embeddings, v_needs_update
    FROM v_embedding_status;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Migration 009: pgvector embeddings - COMPLETED';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Total active services: %', v_total_services;
    RAISE NOTICE 'Services with embeddings: %', v_with_embeddings;
    RAISE NOTICE 'Services needing embedding generation: %', v_needs_update;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run embedding generation script to populate embeddings';
    RAISE NOTICE '2. Monitor progress with: SELECT * FROM v_embedding_status;';
    RAISE NOTICE '3. Test semantic search with search_fiscal_services_semantic()';
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- Rollback script (save for reference)
-- ============================================================================
/*
-- To rollback this migration, execute:

DROP VIEW IF EXISTS v_embedding_status;
DROP TRIGGER IF EXISTS trg_flag_embedding_update ON fiscal_services;
DROP FUNCTION IF EXISTS flag_embedding_update();
DROP FUNCTION IF EXISTS search_fiscal_services_semantic(vector, INTEGER, FLOAT, INTEGER, service_type_enum);
DROP FUNCTION IF EXISTS prepare_service_text_for_embedding(INTEGER);

ALTER TABLE fiscal_services
    DROP COLUMN IF EXISTS needs_embedding_update,
    DROP COLUMN IF EXISTS embedding_version,
    DROP COLUMN IF EXISTS embedding_model,
    DROP COLUMN IF EXISTS embedding_generated_at,
    DROP COLUMN IF EXISTS embedding;

DROP EXTENSION IF EXISTS vector;
*/
