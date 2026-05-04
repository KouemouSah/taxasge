"""Smoke test: dual-provider DashboardConfigUpdateRequest + URL builders."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.modules.dashboards.models import (
    DashboardConfigUpdateRequest,
)
from app.modules.dashboards.services.dashboard_config_service import (
    _build_grafana_embed_url,
    _build_looker_embed_url,
)


def main() -> int:
    print("=== Smoke G4 — dual provider Pydantic + URL builders ===")
    failures = 0

    # Test 1
    try:
        DashboardConfigUpdateRequest(provider="looker_studio")
        print("[1] FAIL: should require looker_report_id")
        failures += 1
    except Exception as e:
        print(f"[1] OK looker_studio without looker_report_id rejected: {type(e).__name__}")

    # Test 2
    r = DashboardConfigUpdateRequest(
        provider="looker_studio", looker_report_id="abc12345-test-id"
    )
    print(f"[2] OK looker valid: provider={r.provider} report_id={r.looker_report_id}")

    # Test 3
    try:
        DashboardConfigUpdateRequest(provider="grafana")
        print("[3] FAIL: should require grafana_dashboard_uid")
        failures += 1
    except Exception as e:
        print(f"[3] OK grafana without uid rejected: {type(e).__name__}")

    # Test 4
    r = DashboardConfigUpdateRequest(
        provider="grafana", grafana_dashboard_uid="facil-treasury"
    )
    print(
        f"[4] OK grafana valid: provider={r.provider} "
        f"uid={r.grafana_dashboard_uid} org={r.grafana_org_id}"
    )

    # Test 5
    try:
        DashboardConfigUpdateRequest(provider="grafana", grafana_dashboard_uid="abc!")
        print("[5] FAIL: should reject special char in uid")
        failures += 1
    except Exception as e:
        print(f"[5] OK regex rejects bad uid: {type(e).__name__}")

    # Test 6
    try:
        DashboardConfigUpdateRequest(
            provider="looker_studio",
            looker_report_id="abc12345-test",
            evil="x",
        )
        print("[6] FAIL: should reject extra field")
        failures += 1
    except Exception as e:
        print(f"[6] OK extra=forbid: {type(e).__name__}")

    # Test 7 — Grafana URL
    os.environ["GRAFANA_BASE_URL"] = "https://facil.grafana.net"
    g = _build_grafana_embed_url(uid="facil-treasury", org_id=1, slug="treasury")
    print(f"[7] Grafana URL: {g}")
    if g and "facil-treasury" in g and "kiosk=tv" in g:
        print("    OK")
    else:
        print("    FAIL: URL malformed")
        failures += 1

    # Test 8 — Looker URL
    l_url = _build_looker_embed_url(report_id="abc-123-xyz", page_id="p_1")
    print(f"[8] Looker URL: {l_url}")
    if "abc-123-xyz" in l_url and "p_1" in l_url:
        print("    OK")
    else:
        print("    FAIL: URL malformed")
        failures += 1

    # Test 9 — Grafana URL is None when env unset
    os.environ.pop("GRAFANA_BASE_URL", None)
    g_none = _build_grafana_embed_url(uid="x", org_id=1)
    print(f"[9] Grafana URL when env unset: {g_none}")
    if g_none is None:
        print("    OK: returns None (frontend can render 'not configured')")
    else:
        print("    FAIL: should return None when GRAFANA_BASE_URL unset")
        failures += 1

    print()
    if failures:
        print(f"FAILED: {failures} test(s) failed")
        return 1
    print("ALL TESTS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
