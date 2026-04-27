#!/usr/bin/env bash
# Re-runnable bundle-size auditor for Facil mobile.
#
# Usage (from packages/mobile/):
#   bash ../../.claude/analyze-mobile-bundle.sh
#
# Steps:
#   1. `npx expo export --platform android` produces the Hermes bytecode + sourcemap
#      under .bundle-analysis/ (gitignored).
#   2. `source-map-explorer` parses the sourcemap and emits a JSON report.
#   3. The Python tail-end groups mapped chunks by package and prints a top-30.
#
# Notes:
#   - Hermes bytecode is sparsely mappable (~92% unmapped). The mapped portion
#     is still informative for spotting large packages or accidental imports.
#   - Vector-icon font weight is NOT in the JS bundle — it ships as separate
#     .ttf assets in the APK. Cross-check `assets/` after build for those.
#
set -euo pipefail

OUT=".bundle-analysis"
mkdir -p "$OUT"

echo "[1/3] expo export (Android)..."
npx --yes expo export --platform android --output-dir "$OUT" --dump-sourcemap >/dev/null 2>&1 || {
  echo "expo export failed — re-run interactively to see the error"
  exit 1
}

JS=$(ls "$OUT"/_expo/static/js/android/*.hbc 2>/dev/null | head -1 || true)
MAP=$(ls "$OUT"/_expo/static/js/android/*.hbc.map 2>/dev/null | head -1 || true)
if [[ -z "$JS" || -z "$MAP" ]]; then
  echo "ERROR: no Hermes bundle found under $OUT/_expo/static/js/android/"
  exit 1
fi

JS_KB=$(du -k "$JS" | cut -f1)
echo "Hermes bundle: $JS_KB KB"

echo "[2/3] source-map-explorer..."
npx --yes source-map-explorer "$JS" "$MAP" --json "$OUT/bundle-report.json" --no-border-checks >/dev/null 2>&1 || true

echo "[3/3] top-30 packages..."
"${PYTHON:-python}" - <<'PY'
import json, os, re
from collections import defaultdict

with open(".bundle-analysis/bundle-report.json", encoding="utf-8") as f:
    data = json.load(f)
files = data["results"][0]["files"]

groups = defaultdict(int)
for path, info in files.items():
    size = info.get("size", 0)
    if path in ("[unmapped]", "[no source]"):
        groups[path] += size
    elif "node_modules" in path:
        # Bucket by package name (handles @scoped/pkg).
        m = re.search(r"node_modules[\\/]((@[^\\/]+[\\/])?[^\\/]+)", path)
        groups[m.group(1) if m else "node_modules/?"] += size
    else:
        groups["app-source"] += size

ranked = sorted(groups.items(), key=lambda x: -x[1])
total = sum(groups.values())
print(f"Mapped total: {total/1024:.1f} KB across {len(files)} files\n")
print(f"{'KB':>9}  {'%':>5}  package")
print(f"{'-'*9}  {'-'*5}  {'-'*40}")
for name, size in ranked[:30]:
    pct = size * 100 / total if total else 0
    print(f"{size/1024:>9.1f}  {pct:>4.1f}  {name}")
PY
