#!/usr/bin/env bash
# ======================================================================
# 🗄️ TaxasGE — Import JSON → Supabase (via psql)
# ----------------------------------------------------------------------
# - Idempotent (UPSERT)
# - Sans nouveaux secrets (utilise DATABASE_URL)
# - Respect de l’ordre hiérarchique et des FKs:
#     ministries → sectors → categories → subcategories → fiscal_services
# - Stage JSON dans des tables d’atterrissage, puis UPSERT dans le schéma
# - Génération de codes déterministes (MIN-/SEC-/CAT-/SUB-/SER- + md5)
# - Ajoute des traductions (ES) pour les libellés (name/description)
# ----------------------------------------------------------------------
# Fichiers JSON attendus dans ./data :
#   - ministerios.json         ( [{ id, nombre, sigla, descripcion, website? }, ...] )
#   - sectores.json            ( [{ id, nombre, descripcion, ministry_id }, ...] )
#   - categorias.json          ( [{ id, nombre, descripcion, sector_id }, ...] )
#   - sub_categorias.json      ( [{ id, nombre, descripcion, category_id }, ...] )
#   - taxes.json               ( [{ id, code, subcategory_id, service_type, ... }, ...] )
# ----------------------------------------------------------------------
# Sortie : messages de progression + compte des lignes insérées/ignorées
# ======================================================================

set -euo pipefail

echo "🔐 Checking DATABASE_URL…"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Aborting."
  exit 1
fi
echo "✅ DATABASE_URL detected (hidden)"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${ROOT_DIR}/data"

# Vérifie jq et psql (le workflow peut aussi les installer avant)
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "❌ psql is required"; exit 1; }

# Helper: copie JSON array -> table staging(data jsonb)
copy_json_array() {
  local json_file="$1"
  local staging_tbl="$2"

  if [[ ! -f "${DATA_DIR}/${json_file}" ]]; then
    echo "⚠️  Missing ${json_file} — skipping ${staging_tbl}"
    return 0
  fi

  echo "📥 Loading ${json_file} into ${staging_tbl}…"
  # On transforme l’array JSON en NDJSON (une ligne = un objet) pour COPY
  # jq -c '.[]' => items compacts, un par ligne
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<SQL
CREATE TABLE IF NOT EXISTS ${staging_tbl} (
  data jsonb
);
TRUNCATE ${staging_tbl};
\copy ${staging_tbl}(data) FROM PROGRAM 'jq -c ".[]" "${DATA_DIR}/${json_file}"' WITH (FORMAT text);
SQL
}

# 1) Charger les fichiers JSON (si présents) dans les staging tables
copy_json_array "ministerios.json"   "staging_ministries"
copy_json_array "sectores.json"      "staging_sectors"
copy_json_array "categorias.json"    "staging_categories"
copy_json_array "sub_categorias.json" "staging_subcategories"
copy_json_array "taxes.json"         "staging_fiscal_services"

echo "⚙️  Running UPSERTs (deterministic codes + translations)…"

# 2) UPSERT en respectant l’ordre et en résolvant les FKs
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- =========================================================
-- Helpers: code déterministe à partir du nom + préfixe
-- =========================================================
CREATE OR REPLACE FUNCTION _mk_code(prefix text, name text, explicit text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(NULLIF(TRIM(explicit), ''), prefix || '-' || SUBSTR(md5(COALESCE(name,'')),1,8));
$$;

-- =========================================================
-- 2.1) MINISTRIES
-- - ministry_code unique, autres métadonnées via translations
-- =========================================================
WITH src AS (
  SELECT
    data->>'id'            AS original_id,
    data->>'nombre'        AS nombre,
    data->>'sigla'         AS sigla,
    data->>'descripcion'   AS descripcion,
    data->>'website'       AS website
  FROM staging_ministries
),
ins AS (
  INSERT INTO ministries (ministry_code, is_active)
  SELECT DISTINCT
         _mk_code('MIN', s.nombre, s.sigla) AS ministry_code,
         TRUE
  FROM src s
  WHERE s.nombre IS NOT NULL
  ON CONFLICT (ministry_code) DO NOTHING
  RETURNING id, ministry_code
),
-- Map de correspondance original_id -> ministry_id (via même logique de code)
map AS (
  SELECT
    s.original_id,
    m.id AS ministry_id
  FROM src s
  JOIN ministries m
    ON m.ministry_code = _mk_code('MIN', s.nombre, s.sigla)
)
-- Traductions (ES) pour name/description
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'ministry', m.ministry_id, 'name', 'es', s.nombre
FROM src s
JOIN map m ON m.original_id = s.original_id
WHERE s.nombre IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'ministry', m.ministry_id, 'description', 'es', s.descripcion
FROM src s
JOIN map m ON m.original_id = s.original_id
WHERE s.descripcion IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.2) SECTORS
-- - FK vers ministry_id résolue via mapping précédent
-- =========================================================
WITH src AS (
  SELECT
    (data->>'id')::text        AS original_id,
    data->>'nombre'            AS nombre,
    data->>'descripcion'       AS descripcion,
    (data->>'ministry_id')::text AS ministry_original_id
  FROM staging_sectors
),
map_min AS (
  SELECT s.original_id, m.id AS ministry_id
  FROM staging_ministries s0
  JOIN ministries m
    ON m.ministry_code = _mk_code('MIN', s0.data->>'nombre', s0.data->>'sigla')
  -- on expose la correspondance original_id -> ministry_id
  RIGHT JOIN (SELECT DISTINCT (data->>'id')::text AS original_id FROM staging_ministries) s
    ON s.original_id = s0.data->>'id'
),
prep AS (
  SELECT
    s.original_id,
    _mk_code('SEC', s.nombre, NULL)      AS sector_code,
    mm.ministry_id,
    s.nombre,
    s.descripcion
  FROM src s
  LEFT JOIN map_min mm ON mm.original_id = s.ministry_original_id
  WHERE s.nombre IS NOT NULL
)
INSERT INTO sectors (sector_code, ministry_id, is_active)
SELECT DISTINCT p.sector_code, p.ministry_id, TRUE
FROM prep p
WHERE p.ministry_id IS NOT NULL  -- on insère seulement si la FK est résolue
ON CONFLICT (sector_code) DO NOTHING;

-- Traductions (ES)
WITH src AS (
  SELECT
    (data->>'id')::text AS original_id,
    data->>'nombre'     AS nombre,
    data->>'descripcion' AS descripcion
  FROM staging_sectors
),
map_sec AS (
  SELECT s.original_id, sec.id AS sector_id
  FROM src s
  JOIN sectors sec
    ON sec.sector_code = _mk_code('SEC', s.nombre, NULL)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'sector', m.sector_id, 'name', 'es', s.nombre
FROM src s
JOIN map_sec m ON m.original_id = s.original_id
WHERE s.nombre IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'sector', m.sector_id, 'description', 'es', s.descripcion
FROM src s
JOIN map_sec m ON m.original_id = s.original_id
WHERE s.descripcion IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.3) CATEGORIES (FK → sector)
-- =========================================================
WITH src AS (
  SELECT
    (data->>'id')::text      AS original_id,
    data->>'nombre'          AS nombre,
    data->>'descripcion'     AS descripcion,
    (data->>'sector_id')::text AS sector_original_id
  FROM staging_categories
),
map_sec AS (
  -- On reconstitue la clé sector_code à partir du nom de la catégorie ? Non :
  -- On part du secteur source (staging_sectors) pour retrouver le bon sector_code
  SELECT
    (s.data->>'id')::text AS sector_original_id,
    sec.id                AS sector_id
  FROM staging_sectors s
  JOIN sectors sec
    ON sec.sector_code = _mk_code('SEC', s.data->>'nombre', NULL)
),
prep AS (
  SELECT
    s.original_id,
    _mk_code('CAT', s.nombre, NULL) AS category_code,
    ms.sector_id,
    s.nombre,
    s.descripcion
  FROM src s
  LEFT JOIN map_sec ms ON ms.sector_original_id = s.sector_original_id
  WHERE s.nombre IS NOT NULL
)
INSERT INTO categories (category_code, sector_id, is_active)
SELECT DISTINCT p.category_code, p.sector_id, TRUE
FROM prep p
WHERE p.sector_id IS NOT NULL
ON CONFLICT (category_code) DO NOTHING;

-- Traductions (ES)
WITH src AS (
  SELECT
    (data->>'id')::text AS original_id,
    data->>'nombre'     AS nombre,
    data->>'descripcion' AS descripcion
  FROM staging_categories
),
map_cat AS (
  SELECT s.original_id, c.id AS category_id
  FROM src s
  JOIN categories c
    ON c.category_code = _mk_code('CAT', s.nombre, NULL)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'category', m.category_id, 'name', 'es', s.nombre
FROM src s
JOIN map_cat m ON m.original_id = s.original_id
WHERE s.nombre IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'category', m.category_id, 'description', 'es', s.descripcion
FROM src s
JOIN map_cat m ON m.original_id = s.original_id
WHERE s.descripcion IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.4) SUBCATEGORIES (FK → category)
-- =========================================================
WITH src AS (
  SELECT
    (data->>'id')::text        AS original_id,
    data->>'nombre'            AS nombre,
    data->>'descripcion'       AS descripcion,
    (data->>'category_id')::text AS category_original_id
  FROM staging_subcategories
),
map_cat AS (
  SELECT
    (c.data->>'id')::text AS category_original_id,
    cat.id                AS category_id
  FROM staging_categories c
  JOIN categories cat
    ON cat.category_code = _mk_code('CAT', c.data->>'nombre', NULL)
),
prep AS (
  SELECT
    s.original_id,
    _mk_code('SUB', s.nombre, NULL) AS subcategory_code,
    mc.category_id,
    s.nombre,
    s.descripcion
  FROM src s
  LEFT JOIN map_cat mc ON mc.category_original_id = s.category_original_id
  WHERE s.nombre IS NOT NULL
)
INSERT INTO subcategories (subcategory_code, category_id, is_active)
SELECT DISTINCT p.subcategory_code, p.category_id, TRUE
FROM prep p
WHERE p.category_id IS NOT NULL
ON CONFLICT (subcategory_code) DO NOTHING;

-- Traductions (ES)
WITH src AS (
  SELECT
    (data->>'id')::text AS original_id,
    data->>'nombre'     AS nombre,
    data->>'descripcion' AS descripcion
  FROM staging_subcategories
),
map_sub AS (
  SELECT s.original_id, sc.id AS subcategory_id
  FROM src s
  JOIN subcategories sc
    ON sc.subcategory_code = _mk_code('SUB', s.nombre, NULL)
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'subcategory', m.subcategory_id, 'name', 'es', s.nombre
FROM src s
JOIN map_sub m ON m.original_id = s.original_id
WHERE s.nombre IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT 'subcategory', m.subcategory_id, 'description', 'es', s.descripcion
FROM src s
JOIN map_sub m ON m.original_id = s.original_id
WHERE s.descripcion IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO NOTHING;

-- =========================================================
-- 2.5) FISCAL SERVICES (FK → subcategory)
-- =========================================================
WITH src AS (
  SELECT
    (data->>'id')::text          AS original_id,
    NULLIF(data->>'code','')     AS raw_code,
    (data->>'subcategory_id')::text AS subcategory_original_id,
    COALESCE(NULLIF(data->>'service_type',''), 'other') AS service_type,
    COALESCE((data->>'expedition_amount')::numeric, 0)  AS expedition_amount,
    COALESCE((data->>'renewal_amount')::numeric, 0)     AS renewal_amount,
    COALESCE((data->>'validity_period_months')::int, 12) AS validity_period_months,
    COALESCE((data->>'is_renewable')::boolean, true)    AS is_renewable,
    COALESCE((data->>'is_active')::boolean, true)       AS is_active
  FROM staging_fiscal_services
),
map_sub AS (
  SELECT
    (s.data->>'id')::text AS subcategory_original_id,
    sc.id                 AS subcategory_id
  FROM staging_subcategories s
  JOIN subcategories sc
    ON sc.subcategory_code = _mk_code('SUB', s.data->>'nombre', NULL)
),
prep AS (
  SELECT
    _mk_code('SER', NULL, s.raw_code) AS service_code,
    ms.subcategory_id,
    s.service_type::service_type_enum AS service_type,
    s.expedition_amount,
    s.renewal_amount,
    s.validity_period_months,
    s.is_renewable,
    s.is_active
  FROM src s
  LEFT JOIN map_sub ms ON ms.subcategory_original_id = s.subcategory_original_id
)
INSERT INTO fiscal_services (
  service_code, subcategory_id, service_type, expedition_amount,
  renewal_amount, validity_period_months, is_renewable, is_active
)
SELECT DISTINCT
  p.service_code, p.subcategory_id, p.service_type, p.expedition_amount,
  p.renewal_amount, p.validity_period_months, p.is_renewable, p.is_active
FROM prep p
WHERE p.service_code IS NOT NULL  -- requis (unique)
  AND (p.subcategory_id IS NOT NULL OR TRUE)  -- FK optionnelle (schema: ON DELETE SET NULL)
ON CONFLICT (service_code) DO UPDATE
SET subcategory_id = EXCLUDED.subcategory_id,
    service_type = EXCLUDED.service_type,
    expedition_amount = EXCLUDED.expedition_amount,
    renewal_amount = EXCLUDED.renewal_amount,
    validity_period_months = EXCLUDED.validity_period_months,
    is_renewable = EXCLUDED.is_renewable,
    is_active = EXCLUDED.is_active;
SQL

echo "✅ JSON import completed (idempotent)."
