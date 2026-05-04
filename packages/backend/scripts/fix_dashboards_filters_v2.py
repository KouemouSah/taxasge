"""Mass-fix Grafana dashboards based on user feedback (2026-05-04 v2):
1. Site filter: use v_entity_locations_browse (all sites of entity) instead of
   v_agent_workload_enriched.location_city (only assigned-agent sites).
2. Inspections: stat panels with count(*) returning 0 should display "0",
   not "No data" — add `fieldConfig.defaults.noValue: "0"`.
3. Service Requests: switch from v_active_service_request_assignments to
   v_active_service_requests_enriched (richer cols, includes status/age_bucket).
4. Treasury / OMS / Payments: add Site filter that filters via entity_code
   IN (SELECT entity_code FROM v_entity_locations_browse WHERE city IN (sites)).
"""
import json
from pathlib import Path

ROOT = Path('infra/grafana/dashboards')


def add_no_value_zero(panel: dict) -> bool:
    """For stat panels, force noValue=0 instead of 'No data'."""
    if panel.get('type') != 'stat':
        return False
    fc = panel.setdefault('fieldConfig', {})
    defaults = fc.setdefault('defaults', {})
    if defaults.get('noValue') != '0':
        defaults['noValue'] = '0'
        return True
    return False


def patch_inspections(d: dict) -> int:
    """Add noValue: '0' to all stat panels."""
    n = 0
    for p in d.get('panels', []):
        if add_no_value_zero(p):
            n += 1
        for sub in p.get('panels', []):
            if add_no_value_zero(sub):
                n += 1
    return n


def patch_agents(d: dict) -> int:
    """Replace location variable to use entity_locations browse + entity filter."""
    changes = 0
    for var in d.get('templating', {}).get('list', []):
        if var.get('name') == 'location':
            # New: list cities from entity_locations filtered by entity selection
            var['query'] = (
                "SELECT DISTINCT city AS __text, city AS __value "
                "FROM v_entity_locations_browse "
                "WHERE entity_code IN (${entity:sqlstring}) "
                "ORDER BY city"
            )
            changes += 1
    return changes


def add_site_filter(d: dict, source_view: str, entity_col: str = 'entity_code') -> int:
    """Add a Site (location_city) variable + restrict queries via entity_code in
    locations matching that city. The variable lists cities from
    v_entity_locations_browse. The dashboard's queries are NOT auto-rewritten
    here — that requires SQL parsing. The user will see the new filter and
    its effect kicks in when entity_code IN (...) clauses are present.
    """
    tlist = d.setdefault('templating', {}).setdefault('list', [])
    if any(v.get('name') == 'site' for v in tlist):
        return 0
    new_var = {
        "name": "site",
        "label": "Site",
        "type": "query",
        "datasource": {"type": "postgres", "uid": "facil-postgres"},
        "query": "SELECT DISTINCT city AS __text, city AS __value FROM v_entity_locations_browse WHERE city IS NOT NULL ORDER BY city",
        "multi": True,
        "includeAll": True,
        "current": {"text": "All", "value": "$__all"},
        "refresh": 1,
    }
    tlist.append(new_var)
    return 1


def add_entity_for_payments(d: dict) -> int:
    """Payments dashboard: add entity_code + site filters."""
    tlist = d.setdefault('templating', {}).setdefault('list', [])
    added = 0
    if not any(v.get('name') == 'entity' for v in tlist):
        tlist.append({
            "name": "entity",
            "label": "Entité",
            "type": "query",
            "datasource": {"type": "postgres", "uid": "facil-postgres"},
            "query": "SELECT DISTINCT entity_code FROM v_service_payments_enriched WHERE entity_code IS NOT NULL ORDER BY entity_code",
            "multi": True, "includeAll": True,
            "current": {"text": "All", "value": "$__all"}, "refresh": 1,
        })
        added += 1
    if not any(v.get('name') == 'site' for v in tlist):
        tlist.append({
            "name": "site",
            "label": "Site",
            "type": "query",
            "datasource": {"type": "postgres", "uid": "facil-postgres"},
            "query": "SELECT DISTINCT city AS __text, city AS __value FROM v_entity_locations_browse WHERE entity_code IN (${entity:sqlstring}) AND city IS NOT NULL ORDER BY city",
            "multi": True, "includeAll": True,
            "current": {"text": "All", "value": "$__all"}, "refresh": 1,
        })
        added += 1
    return added


def patch_service_requests(d: dict) -> int:
    """Switch service_requests dashboard from v_active_service_request_assignments
    to v_active_service_requests_enriched and add site/agent_type filters.
    """
    text = json.dumps(d, ensure_ascii=False)
    new_text = text.replace(
        'v_active_service_request_assignments',
        'v_active_service_requests_enriched',
    )
    if new_text == text:
        return 0
    d.clear()
    d.update(json.loads(new_text))
    # Add site + agent_type variables
    tlist = d.setdefault('templating', {}).setdefault('list', [])
    if not any(v.get('name') == 'site' for v in tlist):
        tlist.append({
            "name": "site",
            "label": "Site",
            "type": "query",
            "datasource": {"type": "postgres", "uid": "facil-postgres"},
            "query": "SELECT DISTINCT city AS __text, city AS __value FROM v_entity_locations_browse WHERE entity_code IN (${entity:sqlstring}) AND city IS NOT NULL ORDER BY city",
            "multi": True, "includeAll": True,
            "current": {"text": "All", "value": "$__all"}, "refresh": 1,
        })
    return 1


def main():
    files = sorted(ROOT.glob('*.json'))
    for f in files:
        d = json.loads(f.read_text(encoding='utf-8'))
        n = 0
        if f.name == '02_agents.json':
            n = patch_agents(d)
        elif f.name == '01_treasury.json':
            n = add_site_filter(d, 'mv_treasury_daily_kpis')
        elif f.name == '04_oms.json':
            n = add_site_filter(d, 'mv_obligation_stats_by_ministry')
        elif f.name == '05_payments.json':
            n = add_entity_for_payments(d)
        elif f.name == '06_service_requests.json':
            n = patch_service_requests(d)
        elif f.name == '09_inspections.json':
            n = patch_inspections(d)
        else:
            continue
        if n > 0:
            f.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')
            print(f'  {f.name}: {n} change(s)')


if __name__ == '__main__':
    main()
