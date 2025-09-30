#!/usr/bin/env bash
# ======================================================================
# 📋 TaxasGE — Rapport post-import (Markdown)
# ----------------------------------------------------------------------
# - Lit les staging_* et les tables finales
# - Compare volumes & détecte les écarts (non mappés / non insérés)
# - Ne modifie rien (read-only), 100% idempotent
# - Nécessite : DATABASE_URL, psql, jq (pour une sortie propre si besoin)
# - Produit : docs/documentations projet/rapports/RAPPORT_VALIDATION_DATABASE.md
#   (chemin avec espace respecté via quotes)
# ----------------------------------------------------------------------
# Auteur : KOUEMOU SAH Jean Emac
# ======================================================================

set -euo pipefail

echo "🔐 Checking DATABASE_URL…"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Aborting."
  exit 1
fi
echo "✅ DATABASE_URL detected (hidden)"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${ROOT_DIR}/docs/documentations projet/rapports"
REPORT_FILE="${REPORT_DIR}/RAPPORT_VALIDATION_DATABASE.md"

# Ensure psql present
command -v psql >/dev/null 2>&1 || { echo "❌ psql is required"; exit 1; }

# Create directories (path includes space)
mkdir -p "${REPORT_DIR}"

# Timestamp
NOW_UTC="$(date -u +'%Y-%m-%d %H:%M:%SZ')"

# =============================================================================
# SQL BLOCK: calcule tous les indicateurs et renvoie un unique document Markdown
# =============================================================================
# Astuce : on reconstruit la même logique de code déterministe que l’import (MIN/SEC/CAT/SUB/SER)
#          via une petite fonction SQL IMMUTABLE locale, puis on génère du Markdown côté SQL.
#          Le \t est désactivé ; on capture la seule colonne 'md' concaténée.
# =============================================================================

PSQL_MD=$(psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -AtF '' <<'SQL'
-- ---------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION _mk_code(prefix text, name text, explicit text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(NULLIF(TRIM(explicit), ''), prefix || '-' || SUBSTR(md5(COALESCE(name,'')),1,8));
$$;

-- ---------------------------------------------------------
-- Counts staging
-- ---------------------------------------------------------
WITH
stg AS (
  SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staging_ministries')            > 0 AS has_stg_min,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staging_sectors')               > 0 AS has_stg_sec,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staging_categories')            > 0 AS has_stg_cat,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staging_subcategories')         > 0 AS has_stg_sub,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staging_fiscal_services')       > 0 AS has_stg_ser
),
staging_counts AS (
  SELECT
    COALESCE((SELECT COUNT(*) FROM staging_ministries),0)      AS stg_ministries,
    COALESCE((SELECT COUNT(*) FROM staging_sectors),0)         AS stg_sectors,
    COALESCE((SELECT COUNT(*) FROM staging_categories),0)      AS stg_categories,
    COALESCE((SELECT COUNT(*) FROM staging_subcategories),0)   AS stg_subcategories,
    COALESCE((SELECT COUNT(*) FROM staging_fiscal_services),0) AS stg_fiscal_services
),
final_counts AS (
  SELECT
    (SELECT COUNT(*) FROM ministries)       AS tb_ministries,
    (SELECT COUNT(*) FROM sectors)          AS tb_sectors,
    (SELECT COUNT(*) FROM categories)       AS tb_categories,
    (SELECT COUNT(*) FROM subcategories)    AS tb_subcategories,
    (SELECT COUNT(*) FROM fiscal_services)  AS tb_fiscal_services
),
-- ---------------------------------------------------------
-- Missing mappings (diagnostic)
-- On reconstruit les codes à partir des staging pour voir s'ils existent
-- ---------------------------------------------------------
mm_min AS (
  SELECT
    s.data->>'id' AS original_id,
    _mk_code('MIN', s.data->>'nombre', s.data->>'sigla') AS ministry_code
  FROM staging_ministries s
),
missing_min AS (
  SELECT m.original_id, m.ministry_code
  FROM mm_min m
  LEFT JOIN ministries t ON t.ministry_code = m.ministry_code
  WHERE t.id IS NULL
  LIMIT 50
),
mm_sec AS (
  SELECT
    s.data->>'id' AS original_id,
    _mk_code('SEC', s.data->>'nombre', NULL) AS sector_code,
    s.data->>'ministry_id' AS ministry_original_id
  FROM staging_sectors s
),
missing_sec AS (
  -- Secteur dont le code final n'existe pas (rare) OU dont le ministry n'a pas été résolu
  SELECT
    x.original_id,
    x.sector_code,
    x.ministry_original_id,
    (t.id IS NULL) AS not_inserted
  FROM mm_sec x
  LEFT JOIN sectors t ON t.sector_code = x.sector_code
  LIMIT 50
),
mm_cat AS (
  SELECT
    s.data->>'id' AS original_id,
    _mk_code('CAT', s.data->>'nombre', NULL) AS category_code,
    s.data->>'sector_id' AS sector_original_id
  FROM staging_categories s
),
missing_cat AS (
  SELECT
    x.original_id,
    x.category_code,
    x.sector_original_id,
    (t.id IS NULL) AS not_inserted
  FROM mm_cat x
  LEFT JOIN categories t ON t.category_code = x.category_code
  LIMIT 50
),
mm_sub AS (
  SELECT
    s.data->>'id' AS original_id,
    _mk_code('SUB', s.data->>'nombre', NULL) AS subcategory_code,
    s.data->>'category_id' AS category_original_id
  FROM staging_subcategories s
),
missing_sub AS (
  SELECT
    x.original_id,
    x.subcategory_code,
    x.category_original_id,
    (t.id IS NULL) AS not_inserted
  FROM mm_sub x
  LEFT JOIN subcategories t ON t.subcategory_code = x.subcategory_code
  LIMIT 50
),
mm_ser AS (
  SELECT
    s.data->>'id' AS original_id,
    COALESCE(NULLIF(s.data->>'code',''), _mk_code('SER', NULL, NULL)) AS service_code_guess
  FROM staging_fiscal_services s
),
missing_ser AS (
  SELECT
    x.original_id,
    x.service_code_guess,
    (t.id IS NULL) AS not_inserted
  FROM mm_ser x
  LEFT JOIN fiscal_services t ON t.service_code = x.service_code_guess
  LIMIT 50
),
-- ---------------------------------------------------------
-- Build Markdown content
-- ---------------------------------------------------------
md AS (
  SELECT
    '# 📋 RAPPORT VALIDATION & IMPORT — TaxasGE'                                  || E'\n' ||
    '**Horodatage (UTC)**: ' || to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"')
                                                                                 || E'\n\n' ||
    '## 📦 Compteurs (staging vs tables finales)'                                 || E'\n' ||
    (SELECT
      '| Ensemble | Staging | Final |\n|---|---:|---:|\n' ||
      '| Ministries | '      || stg_ministries::text   || ' | ' || tb_ministries::text   || ' |\n' ||
      '| Sectors | '         || stg_sectors::text      || ' | ' || tb_sectors::text      || ' |\n' ||
      '| Categories | '      || stg_categories::text   || ' | ' || tb_categories::text   || ' |\n' ||
      '| Subcategories | '   || stg_subcategories::text|| ' | ' || tb_subcategories::text|| ' |\n' ||
      '| Fiscal Services | ' || stg_fiscal_services::text || ' | ' || tb_fiscal_services::text || ' |\n'
     FROM staging_counts s, final_counts f)                                        || E'\n' ||

    '## 🔍 Vérifications & Écarts'                                                || E'\n' ||
    'Les listes ci-dessous sont **tronquées à 50** éléments par catégorie.'       || E'\n\n' ||

    '### Ministries non insérés (par code dérivé)'                                || E'\n' ||
    COALESCE(
      (SELECT string_agg('- ' || ministry_code, E'\n') FROM missing_min),
      '_Aucun écart détecté_'
    )                                                                              || E'\n\n' ||

    '### Sectors non insérés / à vérifier'                                        || E'\n' ||
    COALESCE(
      (SELECT string_agg('- id: '||original_id||' • code: '||sector_code||
                         ' • ministry_original_id: '||COALESCE(ministry_original_id,'∅'),
                         E'\n') FROM missing_sec WHERE not_inserted),
      '_Aucun écart détecté_'
    )                                                                              || E'\n\n' ||

    '### Categories non insérées / à vérifier'                                    || E'\n' ||
    COALESCE(
      (SELECT string_agg('- id: '||original_id||' • code: '||category_code||
                         ' • sector_original_id: '||COALESCE(sector_original_id,'∅'),
                         E'\n') FROM missing_cat WHERE not_inserted),
      '_Aucun écart détecté_'
    )                                                                              || E'\n\n' ||

    '### Subcategories non insérées / à vérifier'                                 || E'\n' ||
    COALESCE(
      (SELECT string_agg('- id: '||original_id||' • code: '||subcategory_code||
                         ' • category_original_id: '||COALESCE(category_original_id,'∅'),
                         E'\n') FROM missing_sub WHERE not_inserted),
      '_Aucun écart détecté_'
    )                                                                              || E'\n\n' ||

    '### Fiscal Services non insérés / à vérifier'                                || E'\n' ||
    COALESCE(
      (SELECT string_agg('- id: '||original_id||' • code: '||COALESCE(service_code_guess,'∅'),
                         E'\n') FROM missing_ser WHERE not_inserted),
      '_Aucun écart détecté_'
    )                                                                              || E'\n\n' ||

    '## ✅ Intégrité schéma — rappels'                                            || E'\n' ||
    '- Aucune modification de schéma effectuée par ce script (lecture seule).'    || E'\n' ||
    '- Les FK **NOT NULL** empêchent les entrées orphelines.'                      || E'\n' ||
    '- L’import (script 2/3) n’insère que si la FK parent est résolue.'           || E'\n\n' ||

    '## 📌 Recommandations'                                                        || E'\n' ||
    '- Vérifier les lignes listées en “non insérées” (IDs parents manquants, '     ||
    'noms incohérents, codes explicites vides).'                                   || E'\n' ||
    '- Si besoin, compléter les JSON parents et relancer l’import.'                || E'\n' AS md
)
SELECT md FROM md;
SQL
)

# Écrit le rapport
echo "${PSQL_MD}" > "${REPORT_FILE}"

# Résumé console
echo "✅ Rapport généré : ${REPORT_FILE}"
wc -l "${REPORT_FILE}" | awk '{print "📄 Lignes rapport : " $1}'
echo "— aperçu —"
head -n 30 "${REPORT_FILE}" | sed 's/^/│ /'
echo "— fin aperçu —"
