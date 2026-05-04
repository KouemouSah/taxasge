"""Minimal smoke test — Pydantic dual provider only (no service / no Redis)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))


def main() -> int:
    from app.modules.dashboards.models.dashboard_config import (
        DashboardConfigUpdateRequest,
    )
    print("=== G4 minimal smoke (Pydantic only) ===")
    failures = 0

    try:
        DashboardConfigUpdateRequest(provider="looker_studio")
        print("[1] FAIL")
        failures += 1
    except Exception as e:
        print(f"[1] OK rejected: {type(e).__name__}")

    r = DashboardConfigUpdateRequest(
        provider="looker_studio", looker_report_id="abc12345-test-id"
    )
    print(f"[2] OK looker valid: {r.provider}, {r.looker_report_id}")

    try:
        DashboardConfigUpdateRequest(provider="grafana")
        print("[3] FAIL")
        failures += 1
    except Exception as e:
        print(f"[3] OK rejected: {type(e).__name__}")

    r = DashboardConfigUpdateRequest(
        provider="grafana", grafana_dashboard_uid="facil-treasury"
    )
    print(f"[4] OK grafana valid: {r.provider}, {r.grafana_dashboard_uid}, org={r.grafana_org_id}")

    try:
        DashboardConfigUpdateRequest(provider="grafana", grafana_dashboard_uid="abc!")
        print("[5] FAIL")
        failures += 1
    except Exception as e:
        print(f"[5] OK regex rejects: {type(e).__name__}")

    try:
        DashboardConfigUpdateRequest(
            provider="looker_studio", looker_report_id="abc12345-test", evil="x"
        )
        print("[6] FAIL")
        failures += 1
    except Exception as e:
        print(f"[6] OK extra=forbid: {type(e).__name__}")

    print()
    if failures:
        print(f"FAILED ({failures})")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
