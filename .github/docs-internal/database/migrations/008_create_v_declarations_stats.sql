-- ============================================================================================================
-- Migration 008: Create v_declarations_stats View
-- ============================================================================================================
-- Description: Vue statistiques déclarations par type (dépend de table payments)
-- Date: 2025-01-12
-- Dépendances: REQUIRES schema_taxage2.sql + schema_declarations_v2.sql
-- ============================================================================================================

-- Vue: Statistiques Declarations par Type
CREATE MATERIALIZED VIEW IF NOT EXISTS v_declarations_stats AS
SELECT
    td.declaration_type,
    COUNT(DISTINCT td.id) as declarations_count,
    COUNT(DISTINCT p.id) as payments_count,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as avg_amount,
    MIN(td.created_at) as first_declaration,
    MAX(td.created_at) as last_declaration,
    COUNT(DISTINCT td.user_id) as unique_users,
    COUNT(DISTINCT td.company_id) as unique_companies
FROM tax_declarations td
LEFT JOIN payments p ON p.tax_declaration_id = td.id
GROUP BY td.declaration_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_declarations_type ON v_declarations_stats(declaration_type);

COMMENT ON MATERIALIZED VIEW v_declarations_stats IS 'Stats déclarations fiscales - Par type';
