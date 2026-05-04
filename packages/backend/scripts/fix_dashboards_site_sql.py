"""Inject site filter SQL into dashboards that have a Site variable.

For dashboards using:
- mv_treasury_daily_kpis (entity_code) → AND entity_code IN (SELECT entity_code FROM v_entity_locations_browse WHERE city IN (${site:sqlstring}))
- mv_obligation_stats_by_ministry (no entity_code, has zone_code only) → no site filter needed (zone is already there)
- v_service_payments_enriched (entity_code) → AND COALESCE(entity_code, sp_entity_code, '?') IN (...) via subquery
- v_active_service_requests_enriched (has location_city directly) → AND COALESCE(location_city, 'unassigned') IN (${site:sqlstring})
- v_agent_workload_enriched (has location_city directly) → already filtered

Strategy: for queries that already have `entity_code IN (${entity:sqlstring})`,
append `AND entity_code IN (SELECT entity_code FROM v_entity_locations_browse WHERE city IN (${site:sqlstring}))`.
For queries on v_active_service_requests_enriched, append filter on location_city.
"""
import json
import re
from pathlib import Path

ROOT = Path('infra/grafana/dashboards')

# Site sub-filter: "entity is at one of the selected sites"
SITE_VIA_ENTITY = (
    " AND entity_code IN (SELECT entity_code FROM v_entity_locations_browse "
    "WHERE city IN (${site:sqlstring}))"
)
# Direct location_city filter (when the view has the column)
SITE_DIRECT = " AND COALESCE(location_city, 'unassigned') IN (${site:sqlstring})"


def patch_treasury(sql: str) -> str:
    # Already filters by entity_code IN (${entity:sqlstring}) → append site sub-filter once
    if 'entity_code IN (${entity:sqlstring})' in sql and '${site:sqlstring}' not in sql:
        # Append before final clauses (GROUP BY / ORDER BY / LIMIT)
        # Find end of WHERE clause = before GROUP BY / ORDER BY / LIMIT
        for marker in [' GROUP BY ', ' ORDER BY ', ' LIMIT ']:
            if marker in sql:
                head, tail = sql.split(marker, 1)
                return head + SITE_VIA_ENTITY + marker + tail
        return sql + SITE_VIA_ENTITY
    return sql


def patch_payments(sql: str) -> str:
    """Payments dashboard SQL: add entity + site filters where missing."""
    if 'v_service_payments_enriched' not in sql:
        return sql
    # Add entity filter if not present
    has_entity = '${entity:sqlstring}' in sql
    has_site = '${site:sqlstring}' in sql
    extras = ''
    if not has_entity:
        extras += " AND COALESCE(entity_code, '?') IN (${entity:sqlstring})"
    if not has_site:
        extras += " AND COALESCE(entity_code, '?') IN (SELECT entity_code FROM v_entity_locations_browse WHERE city IN (${site:sqlstring}))"
    if not extras:
        return sql
    for marker in [' GROUP BY ', ' ORDER BY ', ' LIMIT ']:
        if marker in sql:
            head, tail = sql.split(marker, 1)
            return head + extras + marker + tail
    return sql + extras


def patch_service_requests(sql: str) -> str:
    """SRs already use v_active_service_requests_enriched (has location_city)."""
    if 'v_active_service_requests_enriched' not in sql:
        return sql
    if '${site:sqlstring}' in sql:
        return sql
    for marker in [' GROUP BY ', ' ORDER BY ', ' LIMIT ']:
        if marker in sql:
            head, tail = sql.split(marker, 1)
            return head + SITE_DIRECT + marker + tail
    return sql + SITE_DIRECT


PATCHERS = {
    '01_treasury.json': patch_treasury,
    '05_payments.json': patch_payments,
    '06_service_requests.json': patch_service_requests,
}


def walk_rawsql(node, patcher):
    """Yield (parent, key) for every rawSql, allow in-place mutation via patcher."""
    n = 0
    if isinstance(node, dict):
        for k, v in list(node.items()):
            if k == 'rawSql' and isinstance(v, str):
                new_sql = patcher(v)
                if new_sql != v:
                    node[k] = new_sql
                    n += 1
            elif isinstance(v, (dict, list)):
                n += walk_rawsql(v, patcher)
    elif isinstance(node, list):
        for item in node:
            n += walk_rawsql(item, patcher)
    return n


for filename, patcher in PATCHERS.items():
    f = ROOT / filename
    d = json.loads(f.read_text(encoding='utf-8'))
    n = walk_rawsql(d, patcher)
    if n:
        f.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f'  {filename}: {n} rawSql patched')
    else:
        print(f'  {filename}: no change')
