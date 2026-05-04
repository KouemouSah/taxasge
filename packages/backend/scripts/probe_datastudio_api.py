"""Empirical probe of the Data Studio API capabilities.

Goal: list ALL methods exposed by the API the user activated, identify
those that could create or modify report content (charts, layout, dimensions).
Bypasses doc-trust by reading the live discovery document.
"""
import json
import urllib.request
import urllib.error

import google.auth
from google.auth.transport.requests import Request


def get_token() -> str:
    creds, _ = google.auth.default()
    creds.refresh(Request())
    return creds.token


def fetch(url: str, token: str, method: str = "GET", body=None):
    headers = {"Authorization": f"Bearer {token}"}
    if body is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(body).encode()
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def walk(node, prefix=""):
    if "methods" in node:
        for name, m in node["methods"].items():
            full = f"{prefix}.{name}" if prefix else name
            yield (full, m.get("httpMethod", "?"), m.get("path", ""), m.get("description", ""))
    if "resources" in node:
        for rname, r in node["resources"].items():
            new_prefix = f"{prefix}.{rname}" if prefix else rname
            yield from walk(r, new_prefix)


def main():
    print("=== Step 1: Auth ===")
    token = get_token()
    print(f"Got bearer token, length={len(token)}, prefix={token[:25]}...")

    print()
    print("=== Step 2: Search discovery service for datastudio API ===")
    list_url = "https://www.googleapis.com/discovery/v1/apis?name=datastudio"
    req = urllib.request.Request(list_url)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            listing = json.loads(resp.read().decode("utf-8"))
        items = listing.get("items", [])
        print(f"Datastudio APIs found in public discovery: {len(items)}")
        for it in items:
            print(f"  - {it.get('name')} v{it.get('version')}: {it.get('discoveryRestUrl')}")
            print(f"    title: {it.get('title')}")
            print(f"    description: {it.get('description','')[:200]}")
    except urllib.error.HTTPError as e:
        print(f"discovery list failed HTTP {e.code}: {e.read().decode()[:300]}")
        items = []

    if items:
        # Use the FIRST one returned
        disco_url = items[0].get("discoveryRestUrl")
        print(f"\nFetching discovery from {disco_url}")
        req = urllib.request.Request(disco_url)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                d = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            print(f"discovery fetch failed HTTP {e.code}")
            d = {"methods": {}, "resources": {}, "schemas": {}}
    else:
        print("\n=> Datastudio API is NOT in the public Discovery Service — it has no public API contract.")
        d = {"methods": {}, "resources": {}, "schemas": {}}
    print(f"API: {d.get('title')} (v{d.get('version')})")
    print(f"Description: {d.get('description')}")
    print(f"Base URL: {d.get('baseUrl')}")

    print()
    print("=== Step 3: ALL methods exposed ===")
    methods = list(walk(d))
    print(f"Total methods: {len(methods)}")
    for name, verb, path, desc in methods:
        print(f"  {verb:6s} {name:50s} {path}")
        if desc:
            print(f"           {desc[:160]}")

    print()
    print("=== Step 4: Schemas relevant to content creation ===")
    schemas = d.get("schemas", {})
    print(f"Total schemas defined: {len(schemas)}")
    keywords = ["chart", "report", "component", "widget", "dashboard",
                "page", "layout", "filter", "control", "datasource", "source"]
    found = [s for s in schemas if any(k in s.lower() for k in keywords)]
    if found:
        print(f"Schemas matching content-creation keywords: {len(found)}")
        for s in found:
            sch = schemas[s]
            props = list(sch.get('properties', {}).keys())[:8]
            print(f"  - {s}: {props}")
    else:
        print("(no schema matches keywords)")

    print()
    print("=== Step 5: List assets accessible to the user ===")
    list_url = "https://datastudio.googleapis.com/v1/assets:search?assetTypes=REPORT"
    status, body = fetch(list_url, token)
    print(f"GET /v1/assets:search -> HTTP {status}")
    if status == 200:
        payload = json.loads(body)
        assets = payload.get("assets", [])
        print(f"Found {len(assets)} REPORT(s)")
        for a in assets[:5]:
            print(f"  - {a.get('name','?')}  title={a.get('title','?')}")
    else:
        print(f"Body: {body[:400]}")

    print()
    print("=== Step 6: Try CREATE a report (POST /v1/assets) ===")
    create_url = "https://datastudio.googleapis.com/v1/assets"
    status, body = fetch(
        create_url, token, method="POST",
        body={"title": "Probe — created by API 2026-05-04", "assetType": "REPORT"},
    )
    print(f"POST /v1/assets -> HTTP {status}")
    print(f"Body: {body[:600]}")

    print()
    print("=== Step 7: Try via reports endpoint (POST /v1/reports) ===")
    status, body = fetch(
        "https://datastudio.googleapis.com/v1/reports", token, method="POST",
        body={"title": "Probe report"},
    )
    print(f"POST /v1/reports -> HTTP {status}")
    print(f"Body: {body[:400]}")

    print()
    print("=== Step 8: Discovery for related APIs (drive.googleapis.com Data Studio mime?) ===")
    # Looker Studio reports are stored in Google Drive as a special MIME type.
    # See if we can list them via Drive API (which DOES have CRUD).
    drive_url = (
        "https://www.googleapis.com/drive/v3/files"
        "?q=mimeType%3D%27application%2Fvnd.google-apps.studio%27"
        "&fields=files(id%2Cname%2CmimeType%2CcreatedTime)"
        "&pageSize=5"
    )
    status, body = fetch(drive_url, token)
    print(f"GET drive.files (Data Studio mime) -> HTTP {status}")
    if status == 200:
        files = json.loads(body).get("files", [])
        print(f"Found {len(files)} Data Studio files in Drive")
        for f in files:
            print(f"  - {f}")
    else:
        print(f"Body: {body[:300]}")

    print()
    print("=== Step 9: Try Drive copy of a Data Studio report (templating?) ===")
    # Drive supports POST /files/{id}/copy. If Data Studio reports are first-
    # class Drive files, this should work. We need a source ID though.
    print("(Skipped — would need a source report ID to copy)")

    print()
    print("=== Step 10: Try every plausible report-creation URL ===")
    candidates = [
        ("POST", "/v1/reports", {"title": "Probe"}),
        ("POST", "/v1/reports:create", {"title": "Probe"}),
        ("POST", "/v1/reports/create", {"title": "Probe"}),
        ("POST", "/v1/assets:create", {"title": "Probe", "assetType": "REPORT"}),
        ("POST", "/v1/assets:batchCreate", {"reports": [{"title": "Probe"}]}),
        ("POST", "/v1beta/reports", {"title": "Probe"}),
        ("POST", "/v2/reports", {"title": "Probe"}),
        ("POST", "/v1/dashboards", {"title": "Probe"}),
        # Linking API / clone-from-template style
        ("POST", "/v1/reports:clone", {"sourceReport": "fake/id"}),
        ("POST", "/v1/reports/copy", {"source": "fake/id"}),
    ]
    print(f"Trying {len(candidates)} URL variants...")
    interesting = []
    for verb, path, body in candidates:
        url = f"https://datastudio.googleapis.com{path}"
        status, resp = fetch(url, token, method=verb, body=body)
        flag = ""
        if status == 405:
            flag = "MethodNotAllowed (URL exists but verb wrong)"
        elif status == 404:
            flag = "NOT_FOUND (no such endpoint)"
        elif status == 403:
            flag = "FORBIDDEN (could be quota or perm)"
        elif status == 200:
            flag = "*** SUCCESS ***"
        elif status == 400:
            flag = "BadRequest (URL exists but body wrong)"
            interesting.append((verb, path, status, resp[:200]))
        elif status == 401:
            flag = "Unauthorized"
        else:
            flag = "OTHER"
        print(f"  {verb:6s} {path:35s} HTTP {status} - {flag}")
    if interesting:
        print()
        print("Endpoints that returned 400 (might exist with different body):")
        for v, p, s, r in interesting:
            print(f"  {v} {p}: {r}")

    print()
    print("=== CONCLUSION ===")
    create_methods = [m for m in methods if m[1] in ("POST", "PUT")
                      and any(k in m[0].lower() for k in ["create", "report", "asset"])
                      and "permission" not in m[0].lower()
                      and "member" not in m[0].lower()]
    print(f"Methods that look like content creation: {len(create_methods)}")
    for m in create_methods:
        print(f"  {m[0]} ({m[1]} {m[2]})")
    if not create_methods:
        print("  (none — confirmed: API does NOT expose programmatic report creation)")


if __name__ == "__main__":
    main()
