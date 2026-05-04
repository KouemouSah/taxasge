"""Diagnose why Grafana panels show 'No data' — test the Postgres datasource."""
import json
import os
import sys
import urllib.request
import urllib.error

GRAFANA_BASE_URL = os.getenv("GRAFANA_BASE_URL", "https://kouemousah.grafana.net").rstrip("/")
GRAFANA_API_TOKEN = os.getenv("GRAFANA_API_TOKEN", "")
TOKEN = GRAFANA_API_TOKEN

if not TOKEN:
    print("ERR: GRAFANA_API_TOKEN env var missing")
    sys.exit(1)


def api(method: str, path: str, body=None):
    url = f"{GRAFANA_BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


# 1. Get datasource info
print("=== Step 1: Datasource info ===")
status, body = api("GET", "/api/datasources/uid/facil-postgres")
print(f"  HTTP {status}")
if status == 200:
    ds = json.loads(body)
    print(f"  id={ds.get('id')} name={ds.get('name')} type={ds.get('type')}")
    print(f"  url={ds.get('url')} db={ds.get('database')} user={ds.get('user')}")
    print(f"  jsonData={json.dumps(ds.get('jsonData', {}), indent=2)}")
    ds_id = ds["id"]
    ds_uid = ds["uid"]
else:
    print(body[:500])
    sys.exit(1)

# 2. Test connection — Grafana exposes /api/datasources/uid/<uid>/health
print()
print("=== Step 2: Health probe ===")
status, body = api("GET", f"/api/datasources/uid/{ds_uid}/health")
print(f"  HTTP {status}")
print(f"  {body[:1000]}")

# 3. Try a trivial query through the datasource proxy
print()
print("=== Step 3: SELECT 1 via datasource proxy /query ===")
query_payload = {
    "queries": [
        {
            "refId": "A",
            "datasource": {"type": "postgres", "uid": ds_uid},
            "rawSql": "SELECT 1 AS v",
            "format": "table",
            "datasourceId": ds_id,
        }
    ],
    "from": "now-1h",
    "to": "now",
}
status, body = api("POST", "/api/ds/query", query_payload)
print(f"  HTTP {status}")
print(f"  {body[:1500]}")

# 4. Try the actual query that Empresas dashboard uses
print()
print("=== Step 4: SELECT FROM vw_company_global_stats ===")
query_payload2 = {
    "queries": [
        {
            "refId": "A",
            "datasource": {"type": "postgres", "uid": ds_uid},
            "rawSql": "SELECT total_companies, active_companies, total_debt FROM vw_company_global_stats",
            "format": "table",
            "datasourceId": ds_id,
        }
    ],
    "from": "now-1h",
    "to": "now",
}
status, body = api("POST", "/api/ds/query", query_payload2)
print(f"  HTTP {status}")
print(f"  {body[:1500]}")
