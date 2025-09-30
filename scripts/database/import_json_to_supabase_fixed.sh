#!/usr/bin/env bash
# ======================================================================
# 🗄️ TaxasGE — Import JSON → Supabase (CORRIGÉ)
# ----------------------------------------------------------------------
# - Mapping corrigé basé sur la structure JSON réelle
# - Ordre hiérarchique: ministries → sectors → categories → subcategories → fiscal_services
# - Gestion des traductions multilingues (ES/FR/EN)
# - Idempotent (UPSERT) avec codes déterministes
# ----------------------------------------------------------------------
# Fichiers JSON attendus dans ./data :
#   - ministerios.json    ( [{ id, nombre_es, nombre_fr, nombre_en }, ...] )
#   - sectores.json       ( [{ id, ministerio_id, nombre_es, nombre_fr, nombre_en }, ...] )
#   - categorias.json     ( [{ id, sector_id, nombre_es, nombre_fr, nombre_en }, ...] )
#   - sub_categorias.json ( [{ id, categoria_id, nombre_es, nombre_fr, nombre_en }, ...] )
#   - taxes.json          ( [{ id, sub_categoria_id, nombre_es, tasa_expedicion, tasa_renovacion }, ...] )
# ======================================================================

set -euo pipefail

echo "🔐 Checking DATABASE_URL…"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Aborting."
  exit 1
fi
echo "✅ DATABASE_URL detected"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${ROOT_DIR}/data"

# Vérifie jq et psql
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "❌ psql is required"; exit 1; }

# Helper: copie JSON array → table staging(data jsonb)
copy_json_array() {
  local json_file="$1"
  local staging_tbl="$2"

  if [[ ! -f "${DATA_DIR}/${json_file}" ]]; then
    echo "⚠️  Missing ${json_file} — skipping ${staging_tbl}"
    return 0
  fi

  echo "📥 Loading ${json_file} into ${staging_tbl}…"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<SQL
CREATE TABLE IF NOT EXISTS ${staging_tbl} (data jsonb);
TRUNCATE ${staging_tbl};
\copy ${staging_tbl}(data) FROM PROGRAM 'jq -c ".[]" "${DATA_DIR}/${json_file}"' WITH (FORMAT text);
SQL
}

# 1) Charger les fichiers JSON dans les staging tables
copy_json_array "ministerios.json"   "staging_ministries"
copy_json_array "sectores.json"      "staging_sectors"
copy_json_array "categorias.json"    "staging_categories"
copy_json_array "sub_categorias.json" "staging_subcategories"
copy_json_array "taxes.json"         "staging_fiscal_services"

echo "⚙️  Running corrected UPSERTs…"

# 2) UPSERT corrigé avec la vraie structure JSON
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- =========================================================
-- Helper: code déterministe à partir du nom + préfixe
-- =========================================================
CREATE OR REPLACE FUNCTION _mk_code(prefix text, name text, explicit text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(NULLIF(TRIM(explicit), ''), prefix || '-' || SUBSTR(md5(COALESCE(name,'')),1,8));
$$;

-- =========================================================
-- 2.1) MINISTRIES (CORRIGÉ)
-- - Utilise nombre_es comme nom principal
-- =========================================================
WITH src AS (
  SELECT
    data->>'id'        AS original_id,
    data->>'nombre_es' AS nombre_es,
    data->>'nombre_fr' AS nombre_fr,
    data->>'nombre_en' AS nombre_en
  FROM staging_ministries
  WHERE data->>'nombre_es' IS NOT NULL
),
ins AS (
  INSERT INTO ministries (ministry_code, is_active)
  SELECT DISTINCT
         _mk_code('MIN', s.nombre_es, s.original_id) AS ministry_code,
         TRUE
  FROM src s
  ON CONFLICT (ministry_code) DO NOTHING
  RETURNING id, ministry_code
),
-- Map de correspondance original_id → ministry_id
map AS (
  SELECT
    s.original_id,
    m.id AS ministry_id
  FROM src s
  JOIN ministries m
    ON m.ministry_code = _mk_code('MIN', s.nombre_es, s.original_id)
)
-- Traductions pour toutes les langues
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'ministry', m.ministry_id, 'name', 'es', s.nombre_es
FROM src s
JOIN map m ON m.original_id = s.original_id
WHERE s.nombre_es IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'ministry', m.ministry_id, 'name', 'fr', s.nombre_fr
FROM src s
JOIN map m ON m.original_id = s.original_id
WHERE s.nombre_fr IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'ministry', m.ministry_id, 'name', 'en', s.nombre_en
FROM src s
JOIN map m ON m.original_id = s.original_id
WHERE s.nombre_en IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.2) SECTORS (CORRIGÉ)
-- - FK vers ministry_id résolue via mapping précédent
-- - Utilise ministerio_id (pas ministry_id)
-- =========================================================
WITH src AS (
  SELECT
    data->>'id'           AS original_id,
    data->>'nombre_es'    AS nombre_es,
    data->>'nombre_fr'    AS nombre_fr,
    data->>'nombre_en'    AS nombre_en,
    data->>'ministerio_id' AS ministerio_id  -- CORRIGÉ
  FROM staging_sectors
  WHERE data->>'nombre_es' IS NOT NULL
),
map_min AS (
  SELECT s0.data->>'id' AS original_id, m.id AS ministry_id
  FROM staging_ministries s0
  JOIN ministries m
    ON m.ministry_code = _mk_code('MIN', s0.data->>'nombre_es', s0.data->>'id')
),
prep AS (
  SELECT
    s.original_id,
    _mk_code('SEC', s.nombre_es, s.original_id) AS sector_code,
    mm.ministry_id,
    s.nombre_es,
    s.nombre_fr,
    s.nombre_en
  FROM src s
  LEFT JOIN map_min mm ON mm.original_id = s.ministerio_id  -- CORRIGÉ
  WHERE s.nombre_es IS NOT NULL
)
INSERT INTO sectors (sector_code, ministry_id, is_active)
SELECT DISTINCT p.sector_code, p.ministry_id, TRUE
FROM prep p
WHERE p.ministry_id IS NOT NULL
ON CONFLICT (sector_code) DO NOTHING;

-- Traductions sectors
WITH src AS (
  SELECT
    data->>'id'        AS original_id,
    data->>'nombre_es' AS nombre_es,
    data->>'nombre_fr' AS nombre_fr,
    data->>'nombre_en' AS nombre_en
  FROM staging_sectors
  WHERE data->>'nombre_es' IS NOT NULL
),
map_sec AS (
  SELECT s.original_id, sec.id AS sector_id
  FROM src s
  JOIN sectors sec
    ON sec.sector_code = _mk_code('SEC', s.nombre_es, s.original_id)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'sector', m.sector_id, 'name', 'es', s.nombre_es
FROM src s
JOIN map_sec m ON m.original_id = s.original_id
WHERE s.nombre_es IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'sector', m.sector_id, 'name', 'fr', s.nombre_fr
FROM src s
JOIN map_sec m ON m.original_id = s.original_id
WHERE s.nombre_fr IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'sector', m.sector_id, 'name', 'en', s.nombre_en
FROM src s
JOIN map_sec m ON m.original_id = s.original_id
WHERE s.nombre_en IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.3) CATEGORIES (CORRIGÉ)
-- =========================================================
WITH src AS (
  SELECT
    data->>'id'        AS original_id,
    data->>'nombre_es' AS nombre_es,
    data->>'nombre_fr' AS nombre_fr,
    data->>'nombre_en' AS nombre_en,
    data->>'sector_id' AS sector_id
  FROM staging_categories
  WHERE data->>'nombre_es' IS NOT NULL
),
map_sec AS (
  SELECT
    s.data->>'id' AS sector_original_id,
    sec.id        AS sector_id
  FROM staging_sectors s
  JOIN sectors sec
    ON sec.sector_code = _mk_code('SEC', s.data->>'nombre_es', s.data->>'id')
),
prep AS (
  SELECT
    s.original_id,
    _mk_code('CAT', s.nombre_es, s.original_id) AS category_code,
    ms.sector_id,
    s.nombre_es,
    s.nombre_fr,
    s.nombre_en
  FROM src s
  LEFT JOIN map_sec ms ON ms.sector_original_id = s.sector_id
  WHERE s.nombre_es IS NOT NULL
)
INSERT INTO categories (category_code, sector_id, is_active)
SELECT DISTINCT p.category_code, p.sector_id, TRUE
FROM prep p
WHERE p.sector_id IS NOT NULL
ON CONFLICT (category_code) DO NOTHING;

-- Traductions categories
WITH src AS (
  SELECT
    data->>'id'        AS original_id,
    data->>'nombre_es' AS nombre_es,
    data->>'nombre_fr' AS nombre_fr,
    data->>'nombre_en' AS nombre_en
  FROM staging_categories
  WHERE data->>'nombre_es' IS NOT NULL
),
map_cat AS (
  SELECT s.original_id, c.id AS category_id
  FROM src s
  JOIN categories c
    ON c.category_code = _mk_code('CAT', s.nombre_es, s.original_id)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'category', m.category_id, 'name', 'es', s.nombre_es
FROM src s
JOIN map_cat m ON m.original_id = s.original_id
WHERE s.nombre_es IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'category', m.category_id, 'name', 'fr', s.nombre_fr
FROM src s
JOIN map_cat m ON m.original_id = s.original_id
WHERE s.nombre_fr IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'category', m.category_id, 'name', 'en', s.nombre_en
FROM src s
JOIN map_cat m ON m.original_id = s.original_id
WHERE s.nombre_en IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.4) SUBCATEGORIES (CORRIGÉ - gestion des null)
-- =========================================================
WITH src AS (
  SELECT
    data->>'id'          AS original_id,
    COALESCE(NULLIF(data->>'nombre_es', 'null'), NULLIF(data->>'nombre_es', ''), 'Subcategoria ' || data->>'id') AS nombre_es,
    NULLIF(data->>'nombre_fr', 'null') AS nombre_fr,
    NULLIF(data->>'nombre_en', 'null') AS nombre_en,
    data->>'categoria_id' AS categoria_id  -- CORRIGÉ
  FROM staging_subcategories
),
map_cat AS (
  SELECT
    c.data->>'id' AS category_original_id,
    cat.id        AS category_id
  FROM staging_categories c
  JOIN categories cat
    ON cat.category_code = _mk_code('CAT', c.data->>'nombre_es', c.data->>'id')
),
prep AS (
  SELECT
    s.original_id,
    _mk_code('SUB', s.nombre_es, s.original_id) AS subcategory_code,
    mc.category_id,
    s.nombre_es,
    s.nombre_fr,
    s.nombre_en
  FROM src s
  LEFT JOIN map_cat mc ON mc.category_original_id = s.categoria_id  -- CORRIGÉ
  WHERE s.nombre_es IS NOT NULL
)
INSERT INTO subcategories (subcategory_code, category_id, is_active)
SELECT DISTINCT p.subcategory_code, p.category_id, TRUE
FROM prep p
WHERE p.category_id IS NOT NULL
ON CONFLICT (subcategory_code) DO NOTHING;

-- Traductions subcategories (seulement si non null)
WITH src AS (
  SELECT
    data->>'id' AS original_id,
    COALESCE(NULLIF(data->>'nombre_es', 'null'), NULLIF(data->>'nombre_es', ''), 'Subcategoria ' || data->>'id') AS nombre_es,
    NULLIF(data->>'nombre_fr', 'null') AS nombre_fr,
    NULLIF(data->>'nombre_en', 'null') AS nombre_en
  FROM staging_subcategories
),
map_sub AS (
  SELECT s.original_id, sc.id AS subcategory_id
  FROM src s
  JOIN subcategories sc
    ON sc.subcategory_code = _mk_code('SUB', s.nombre_es, s.original_id)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'subcategory', m.subcategory_id, 'name', 'es', s.nombre_es
FROM src s
JOIN map_sub m ON m.original_id = s.original_id
WHERE s.nombre_es IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'subcategory', m.subcategory_id, 'name', 'fr', s.nombre_fr
FROM src s
JOIN map_sub m ON m.original_id = s.original_id
WHERE s.nombre_fr IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'subcategory', m.subcategory_id, 'name', 'en', s.nombre_en
FROM src s
JOIN map_sub m ON m.original_id = s.original_id
WHERE s.nombre_en IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.5) FISCAL SERVICES (CORRIGÉ - mapping taxes.json)
-- =========================================================
WITH src AS (
  SELECT
    data->>'id'              AS original_id,
    data->>'sub_categoria_id' AS sub_categoria_id,  -- CORRIGÉ
    data->>'nombre_es'       AS nombre_es,
    data->>'nombre_fr'       AS nombre_fr,
    data->>'nombre_en'       AS nombre_en,
    COALESCE((data->>'tasa_expedicion')::numeric, 0)  AS expedition_amount,  -- CORRIGÉ
    COALESCE((data->>'tasa_renovacion')::numeric, 0)  AS renewal_amount,     -- CORRIGÉ
    12 AS validity_period_months,  -- Défaut
    TRUE AS is_renewable,          -- Défaut
    TRUE AS is_active             -- Défaut
  FROM staging_fiscal_services
  WHERE data->>'nombre_es' IS NOT NULL
),
map_sub AS (
  SELECT
    s.data->>'id' AS subcategory_original_id,
    sc.id         AS subcategory_id
  FROM staging_subcategories s
  JOIN subcategories sc
    ON sc.subcategory_code = _mk_code('SUB',
         COALESCE(NULLIF(s.data->>'nombre_es', 'null'), NULLIF(s.data->>'nombre_es', ''), 'Subcategoria ' || s.data->>'id'),
         s.data->>'id')
),
prep AS (
  SELECT
    _mk_code('SER', s.nombre_es, s.original_id) AS service_code,
    ms.subcategory_id,
    'other'::service_type_enum AS service_type,  -- Défaut
    s.expedition_amount,
    s.renewal_amount,
    s.validity_period_months,
    s.is_renewable,
    s.is_active,
    s.nombre_es,
    s.nombre_fr,
    s.nombre_en,
    s.original_id
  FROM src s
  LEFT JOIN map_sub ms ON ms.subcategory_original_id = s.sub_categoria_id  -- CORRIGÉ
)
INSERT INTO fiscal_services (
  service_code, subcategory_id, service_type, expedition_amount,
  renewal_amount, validity_period_months, is_renewable, is_active
)
SELECT DISTINCT
  p.service_code, p.subcategory_id, p.service_type, p.expedition_amount,
  p.renewal_amount, p.validity_period_months, p.is_renewable, p.is_active
FROM prep p
WHERE p.service_code IS NOT NULL
ON CONFLICT (service_code) DO UPDATE
SET subcategory_id = EXCLUDED.subcategory_id,
    expedition_amount = EXCLUDED.expedition_amount,
    renewal_amount = EXCLUDED.renewal_amount,
    is_active = EXCLUDED.is_active;

-- Traductions fiscal_services
WITH src AS (
  SELECT
    data->>'id'        AS original_id,
    data->>'nombre_es' AS nombre_es,
    data->>'nombre_fr' AS nombre_fr,
    data->>'nombre_en' AS nombre_en
  FROM staging_fiscal_services
  WHERE data->>'nombre_es' IS NOT NULL
),
map_fs AS (
  SELECT s.original_id, fs.id AS fiscal_service_id
  FROM src s
  JOIN fiscal_services fs
    ON fs.service_code = _mk_code('SER', s.nombre_es, s.original_id)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'fiscal_service', m.fiscal_service_id, 'name', 'es', s.nombre_es
FROM src s
JOIN map_fs m ON m.original_id = s.original_id
WHERE s.nombre_es IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'fiscal_service', m.fiscal_service_id, 'name', 'fr', s.nombre_fr
FROM src s
JOIN map_fs m ON m.original_id = s.original_id
WHERE s.nombre_fr IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'fiscal_service', m.fiscal_service_id, 'name', 'en', s.nombre_en
FROM src s
JOIN map_fs m ON m.original_id = s.original_id
WHERE s.nombre_en IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- NETTOYAGE
-- =========================================================
DROP TABLE IF EXISTS staging_ministries;
DROP TABLE IF EXISTS staging_sectors;
DROP TABLE IF EXISTS staging_categories;
DROP TABLE IF EXISTS staging_subcategories;
DROP TABLE IF EXISTS staging_fiscal_services;
DROP FUNCTION IF EXISTS _mk_code(text, text, text);

-- =========================================================
-- RAPPORT FINAL
-- =========================================================
DO $$
DECLARE
    ministry_count INTEGER;
    sector_count INTEGER;
    category_count INTEGER;
    subcategory_count INTEGER;
    fiscal_service_count INTEGER;
    translation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ministry_count FROM ministries;
    SELECT COUNT(*) INTO sector_count FROM sectors;
    SELECT COUNT(*) INTO category_count FROM categories;
    SELECT COUNT(*) INTO subcategory_count FROM subcategories;
    SELECT COUNT(*) INTO fiscal_service_count FROM fiscal_services;
    SELECT COUNT(*) INTO translation_count FROM translations;

    RAISE NOTICE '🎉 Import réussi:';
    RAISE NOTICE '   • Ministères: %', ministry_count;
    RAISE NOTICE '   • Secteurs: %', sector_count;
    RAISE NOTICE '   • Catégories: %', category_count;
    RAISE NOTICE '   • Sous-catégories: %', subcategory_count;
    RAISE NOTICE '   • Services fiscaux: %', fiscal_service_count;
    RAISE NOTICE '   • Traductions: %', translation_count;
END$$;
SQL

echo "✅ JSON import completed successfully!"