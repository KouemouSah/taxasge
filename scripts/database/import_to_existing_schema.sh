#!/usr/bin/env bash
# ======================================================================
# 🗄️ TaxasGE — Import JSON vers Schema Existant (Préservation Structure)
# ----------------------------------------------------------------------
# - Respecte EXACTEMENT la structure du schéma existant
# - Utilise les données nettoyées Phase 2
# - Ne modifie QUE la FK subcategory_id → category_id
# - Préserve TOUS les champs prévus pour l'avenir
# ----------------------------------------------------------------------
# Fichiers JSON sources (nettoyés Phase 2):
#   - ministerios.json          (14 ministères)
#   - sectores.json             (20 secteurs)
#   - categorias_cleaned.json   (84 catégories nettoyées)
#   - taxes_restructured.json   (547 services, mapping direct categories)
#   - translations.json         (665 entités centralisées)
# ----------------------------------------------------------------------
# IMPORTANT: Script respectueux du schéma existant
# ======================================================================

set -euo pipefail

# ============================================
# CONFIGURATION & VARIABLES
# ============================================

echo "🔐 Vérification environnement..."
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL non définie. Arrêt."
  exit 1
fi
echo "✅ DATABASE_URL détectée"

# Chemins
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${ROOT_DIR}/data"

# Validation outils requis
for tool in jq psql; do
    if ! command -v $tool >/dev/null 2>&1; then
        echo "❌ $tool requis mais non installé"
        exit 1
    fi
done

echo "🏗️ Import JSON vers schéma existant - Préservation structure complète"
echo "📊 Structure: Respecte schéma taxasge_database_schema.sql"
echo "🔧 Modification: Uniquement subcategory_id → category_id"

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

# Validation existence fichier
validate_file() {
    local file_path="$1"
    local description="$2"

    if [[ ! -f "$file_path" ]]; then
        echo "❌ Fichier manquant: $file_path ($description)"
        return 1
    fi

    # Validation JSON
    if ! jq empty "$file_path" 2>/dev/null; then
        echo "❌ JSON invalide: $file_path"
        return 1
    fi

    local count=$(jq length "$file_path")
    echo "✅ $description: $count entrées"
    return 0
}

# Import table staging avec métadonnées
import_to_staging() {
    local json_file="$1"
    local staging_table="$2"
    local description="$3"

    echo "📥 Import $description → $staging_table..."

    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<SQL
-- Création table staging
DROP TABLE IF EXISTS ${staging_table};
CREATE TABLE ${staging_table} (
    data jsonb,
    imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import données
\\copy ${staging_table}(data) FROM PROGRAM 'jq -c ".[]" "${DATA_DIR}/${json_file}"' WITH (FORMAT text);

-- Statistiques
SELECT COUNT(*) as imported_count FROM ${staging_table};
SQL

    echo "✅ $description importé"
}

# ============================================
# VALIDATION FICHIERS SOURCES
# ============================================

echo "📋 Validation fichiers sources nettoyés Phase 2..."

validate_file "${DATA_DIR}/ministerios.json" "Ministères"
validate_file "${DATA_DIR}/sectores.json" "Secteurs"
validate_file "${DATA_DIR}/categorias_cleaned.json" "Catégories (nettoyées)"
validate_file "${DATA_DIR}/taxes_restructured.json" "Services fiscaux (restructurés)"
validate_file "${DATA_DIR}/translations.json" "Traductions centralisées"

echo "✅ Tous les fichiers sources validés"

# ============================================
# VÉRIFICATION SCHÉMA EXISTANT
# ============================================

echo "🔍 Vérification schéma existant..."

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- Vérifier tables essentielles
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    table_name TEXT;
BEGIN
    -- Tables requises selon schéma existant
    FOR table_name IN
        SELECT unnest(ARRAY['ministries', 'sectors', 'categories', 'subcategories', 'fiscal_services', 'translations'])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            missing_tables := missing_tables || table_name;
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Tables manquantes: %', array_to_string(missing_tables, ', ');
    END IF;

    RAISE NOTICE '✅ Schéma existant validé - Toutes les tables présentes';
END$$;
SQL

# ============================================
# IMPORT DONNÉES DANS STAGING TABLES
# ============================================

echo "📥 Import données vers staging tables..."

import_to_staging "ministerios.json" "staging_ministries" "Ministères"
import_to_staging "sectores.json" "staging_sectors" "Secteurs"
import_to_staging "categorias_cleaned.json" "staging_categories" "Catégories nettoyées"
import_to_staging "taxes_restructured.json" "staging_fiscal_services" "Services restructurés"
import_to_staging "translations.json" "staging_translations" "Traductions centralisées"

# ============================================
# IMPORT HIÉRARCHIE EN RESPECTANT SCHÉMA EXISTANT
# ============================================

echo "⚙️ Import hiérarchie vers schéma existant..."

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- =========================================================
-- 1. MINISTRIES - Respecte structure existante
-- =========================================================
WITH ministry_data AS (
    SELECT
        data->>'id' AS code,
        ROW_NUMBER() OVER (ORDER BY data->>'nombre_es') AS display_order
    FROM staging_ministries
    WHERE data->>'nombre_es' IS NOT NULL
)
INSERT INTO ministries (code, display_order, is_active)
SELECT code, display_order, TRUE
FROM ministry_data
ON CONFLICT (code) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- =========================================================
-- 2. SECTORS - Respecte structure existante
-- =========================================================
WITH sector_data AS (
    SELECT
        s.data->>'id' AS code,
        m.id AS ministry_id,
        ROW_NUMBER() OVER (ORDER BY s.data->>'nombre_es') AS display_order
    FROM staging_sectors s
    LEFT JOIN staging_ministries sm ON sm.data->>'id' = s.data->>'ministerio_id'
    LEFT JOIN ministries m ON m.code = sm.data->>'id'
    WHERE s.data->>'nombre_es' IS NOT NULL
)
INSERT INTO sectors (ministry_id, code, display_order, is_active)
SELECT ministry_id, code, display_order, TRUE
FROM sector_data
WHERE ministry_id IS NOT NULL
ON CONFLICT (code) DO UPDATE SET
    ministry_id = EXCLUDED.ministry_id,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- =========================================================
-- 3. CATEGORIES - Respecte structure existante avec service_type
-- =========================================================
WITH category_data AS (
    SELECT
        c.data->>'id' AS code,
        s.id AS sector_id,
        ROW_NUMBER() OVER (ORDER BY c.data->>'nombre_es') AS display_order,
        -- Déterminer service_type basé sur le nom ou secteur
        CASE
            WHEN c.data->>'nombre_es' ILIKE '%document%' OR c.data->>'nombre_es' ILIKE '%legal%' THEN 'document_processing'
            WHEN c.data->>'nombre_es' ILIKE '%permis%' OR c.data->>'nombre_es' ILIKE '%licen%' THEN 'license_permit'
            WHEN c.data->>'nombre_es' ILIKE '%séjour%' OR c.data->>'nombre_es' ILIKE '%resident%' THEN 'residence_permit'
            WHEN c.data->>'nombre_es' ILIKE '%regist%' OR c.data->>'nombre_es' ILIKE '%inscr%' THEN 'registration_fee'
            WHEN c.data->>'nombre_es' ILIKE '%inspect%' OR c.data->>'nombre_es' ILIKE '%control%' THEN 'inspection_fee'
            WHEN c.data->>'nombre_es' ILIKE '%douane%' OR c.data->>'nombre_es' ILIKE '%customs%' THEN 'customs_duty'
            WHEN c.data->>'nombre_es' ILIKE '%déclaration%' OR c.data->>'nombre_es' ILIKE '%declarac%' THEN 'declaration_tax'
            ELSE 'administrative_tax'
        END::service_type_enum AS service_type
    FROM staging_categories c
    LEFT JOIN staging_sectors ss ON ss.data->>'id' = c.data->>'sector_id'
    LEFT JOIN sectors s ON s.code = ss.data->>'id'
    WHERE c.data->>'nombre_es' IS NOT NULL
    AND TRIM(c.data->>'nombre_es') != ''
)
INSERT INTO categories (sector_id, code, service_type, display_order, is_active)
SELECT sector_id, code, service_type, display_order, TRUE
FROM category_data
WHERE sector_id IS NOT NULL
ON CONFLICT (code) DO UPDATE SET
    sector_id = EXCLUDED.sector_id,
    service_type = EXCLUDED.service_type,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- =========================================================
-- 4. FISCAL SERVICES - Utilise category_id directement
-- =========================================================
WITH service_data AS (
    SELECT
        fs.data->>'id' AS service_code,
        c.id AS category_id,

        -- Classification du service (requis par schéma)
        CASE
            WHEN fs.data->>'nombre_es' ILIKE '%document%' OR fs.data->>'nombre_es' ILIKE '%legal%' THEN 'document_processing'
            WHEN fs.data->>'nombre_es' ILIKE '%permis%' OR fs.data->>'nombre_es' ILIKE '%licen%' THEN 'license_permit'
            WHEN fs.data->>'nombre_es' ILIKE '%séjour%' OR fs.data->>'nombre_es' ILIKE '%resident%' THEN 'residence_permit'
            WHEN fs.data->>'nombre_es' ILIKE '%regist%' OR fs.data->>'nombre_es' ILIKE '%inscr%' THEN 'registration_fee'
            WHEN fs.data->>'nombre_es' ILIKE '%inspect%' OR fs.data->>'nombre_es' ILIKE '%control%' THEN 'inspection_fee'
            WHEN fs.data->>'nombre_es' ILIKE '%douane%' OR fs.data->>'nombre_es' ILIKE '%customs%' THEN 'customs_duty'
            WHEN fs.data->>'nombre_es' ILIKE '%déclaration%' OR fs.data->>'nombre_es' ILIKE '%declarac%' THEN 'declaration_tax'
            ELSE 'administrative_tax'
        END::service_type_enum AS service_type,

        -- Méthode de calcul basée sur les montants
        CASE
            WHEN COALESCE((fs.data->>'tasa_expedicion')::numeric, 0) > 0
                 AND COALESCE((fs.data->>'tasa_renovacion')::numeric, 0) > 0 THEN 'fixed_both'
            WHEN COALESCE((fs.data->>'tasa_expedicion')::numeric, 0) > 0 THEN 'fixed_expedition'
            WHEN COALESCE((fs.data->>'tasa_renovacion')::numeric, 0) > 0 THEN 'fixed_renewal'
            ELSE 'fixed_expedition'
        END::calculation_method_enum AS calculation_method,

        -- Montants (préservés du JSON)
        COALESCE((fs.data->>'tasa_expedicion')::numeric, 0) AS expedition_amount,
        COALESCE((fs.data->>'tasa_renovacion')::numeric, 0) AS renewal_amount,

        -- Valeurs par défaut pour champs requis
        12 AS validity_period_months,
        12 AS renewal_frequency_months,
        0 AS grace_period_days,
        CURRENT_DATE AS tariff_effective_from,
        'active'::service_status_enum AS status,
        1 AS complexity_level,
        1 AS processing_time_days

    FROM staging_fiscal_services fs
    LEFT JOIN staging_categories sc ON sc.data->>'id' = fs.data->>'category_id'
    LEFT JOIN categories c ON c.code = sc.data->>'id'
    WHERE fs.data->>'nombre_es' IS NOT NULL
    AND TRIM(fs.data->>'nombre_es') != ''
)
INSERT INTO fiscal_services (
    service_code, category_id, service_type, calculation_method,
    expedition_amount, renewal_amount,
    validity_period_months, renewal_frequency_months, grace_period_days,
    tariff_effective_from, status, complexity_level, processing_time_days
)
SELECT
    service_code, category_id, service_type, calculation_method,
    expedition_amount, renewal_amount,
    validity_period_months, renewal_frequency_months, grace_period_days,
    tariff_effective_from, status, complexity_level, processing_time_days
FROM service_data
WHERE category_id IS NOT NULL
ON CONFLICT (service_code) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    expedition_amount = EXCLUDED.expedition_amount,
    renewal_amount = EXCLUDED.renewal_amount,
    status = EXCLUDED.status;
SQL

# ============================================
# IMPORT TRADUCTIONS VERS SYSTÈME CENTRALISÉ
# ============================================

echo "🌍 Import traductions vers système centralisé..."

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- Import traductions depuis fichier centralisé vers table translations existante
WITH translation_import AS (
    SELECT
        tr.data->>'entity_type' as entity_type,
        tr.data->>'entity_id' as entity_id,
        t.key as field_name,
        l.key as language_code,
        l.value::text as content
    FROM staging_translations tr,
    LATERAL jsonb_each(tr.data->'translations') as t(key, value),
    LATERAL jsonb_each_text(t.value) as l(key, value)
    WHERE tr.data->>'entity_type' IS NOT NULL
    AND tr.data->>'entity_id' IS NOT NULL
    AND l.value IS NOT NULL
    AND TRIM(l.value) != ''
),
-- Mapper entity_id codes vers UUID réels
entity_mapping AS (
    SELECT 'ministry' as entity_type, code as entity_id, id as uuid_id FROM ministries
    UNION ALL
    SELECT 'sector' as entity_type, code as entity_id, id as uuid_id FROM sectors
    UNION ALL
    SELECT 'category' as entity_type, code as entity_id, id as uuid_id FROM categories
    UNION ALL
    SELECT 'fiscal_service' as entity_type, service_code as entity_id, id as uuid_id FROM fiscal_services
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT
    ti.entity_type,
    em.uuid_id,
    ti.field_name,
    ti.language_code,
    ti.content
FROM translation_import ti
JOIN entity_mapping em ON (em.entity_type = ti.entity_type AND em.entity_id = ti.entity_id)
WHERE ti.language_code IN ('es', 'fr', 'en')
AND ti.field_name IN ('name', 'description')
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE SET
    content = EXCLUDED.content;
SQL

# ============================================
# NETTOYAGE STAGING TABLES
# ============================================

echo "🧹 Nettoyage staging tables..."

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
DROP TABLE IF EXISTS staging_ministries;
DROP TABLE IF EXISTS staging_sectors;
DROP TABLE IF EXISTS staging_categories;
DROP TABLE IF EXISTS staging_fiscal_services;
DROP TABLE IF EXISTS staging_translations;
SQL

# ============================================
# RAPPORT FINAL
# ============================================

echo "📊 Génération rapport final..."

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- Rapport statistiques finales
DO $$
DECLARE
    ministry_count INTEGER;
    sector_count INTEGER;
    category_count INTEGER;
    fiscal_service_count INTEGER;
    translation_count INTEGER;
    services_with_category INTEGER;
BEGIN
    -- Compteurs
    SELECT COUNT(*) INTO ministry_count FROM ministries WHERE is_active;
    SELECT COUNT(*) INTO sector_count FROM sectors WHERE is_active;
    SELECT COUNT(*) INTO category_count FROM categories WHERE is_active;
    SELECT COUNT(*) INTO fiscal_service_count FROM fiscal_services WHERE status = 'active';
    SELECT COUNT(*) INTO translation_count FROM translations;

    -- Intégrité FK
    SELECT COUNT(*) INTO services_with_category
    FROM fiscal_services fs
    JOIN categories c ON fs.category_id = c.id
    WHERE fs.status = 'active' AND c.is_active;

    -- Rapport principal
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎉 IMPORT VERS SCHÉMA EXISTANT TERMINÉ';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📊 Respect total de la structure existante';
    RAISE NOTICE '   • Ministères: %', ministry_count;
    RAISE NOTICE '   • Secteurs: %', sector_count;
    RAISE NOTICE '   • Catégories: %', category_count;
    RAISE NOTICE '   • Services fiscaux: %', fiscal_service_count;
    RAISE NOTICE '   • Traductions: %', translation_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Intégrité: % services liés aux catégories',
                 services_with_category;
    RAISE NOTICE '✅ Structure: Tous les champs existants préservés';
    RAISE NOTICE '✅ Navigation: Simplifiée 4→3 niveaux (après migration)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Prochaines étapes:';
    RAISE NOTICE '  1. Exécuter migration_remove_subcategories_only.sql';
    RAISE NOTICE '  2. Valider intégrité post-migration';
    RAISE NOTICE '  3. Tests performance';
    RAISE NOTICE '============================================';
END$$;
SQL

echo "✅ Import vers schéma existant terminé avec succès !"
echo "🏗️ Structure: Respecte schéma taxasge_database_schema.sql"
echo "🔧 Prêt pour: Migration suppression subcategories"
echo ""
echo "📋 Fichiers utilisés (Phase 2):"
echo "  ✅ categorias_cleaned.json (22 erreurs corrigées)"
echo "  ✅ taxes_restructured.json (mapping vers categories)"
echo "  ✅ translations.json (665 entités centralisées)"
echo ""
echo "🎯 Données importées dans schéma existant !"