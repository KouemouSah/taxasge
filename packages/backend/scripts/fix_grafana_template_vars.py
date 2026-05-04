"""Fix broken template variable substitution in dashboard JSONs.

Replaces:
  ('$entity' = 'All' OR entity_code IN ($entity))
with:
  entity_code IN (${entity:sqlstring})

Same for $method, $workflow, $agent, $status. Does so for each rawSql
recursively in panels[].targets[].rawSql.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent.parent / "infra" / "grafana" / "dashboards"

# (var_name, column_in_sql, raw_pattern_to_replace, replacement)
PATCHES = [
    ("entity", "entity_code"),
    ("method", "payment_method"),
    ("workflow", "workflow_code"),
    ("agent", "agent_name"),
    ("status", "payment_status::text"),
]


def fix_sql(sql: str) -> str:
    out = sql
    for var, col in PATCHES:
        # Match: ('$var' = 'All' OR <col> IN ($var))
        # Allow whitespace variations.
        pattern = re.compile(
            r"\(\s*'\$" + re.escape(var) + r"'\s*=\s*'All'\s+OR\s+"
            + re.escape(col) + r"\s+IN\s*\(\$" + re.escape(var) + r"\)\s*\)",
            re.IGNORECASE,
        )
        replacement = f"{col} IN (${{{var}:sqlstring}})"
        out = pattern.sub(replacement, out)
    return out


def walk(obj, path=""):
    """Yield (parent_dict, key) for every leaf 'rawSql' in nested structure."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "rawSql" and isinstance(v, str):
                yield obj, k
            else:
                yield from walk(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            yield from walk(item, f"{path}[{i}]")


def main() -> int:
    files = sorted(ROOT.glob("*.json"))
    total_fixed = 0
    for f in files:
        text = f.read_text(encoding="utf-8")
        d = json.loads(text)
        n_fixed_in_file = 0
        for parent, key in walk(d):
            old = parent[key]
            new = fix_sql(old)
            if new != old:
                parent[key] = new
                n_fixed_in_file += 1
        if n_fixed_in_file > 0:
            f.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"  {f.name}: fixed {n_fixed_in_file} rawSql occurrence(s)")
            total_fixed += n_fixed_in_file
        else:
            print(f"  {f.name}: no change")
    print()
    print(f"Total fixed: {total_fixed} rawSql across {len(files)} dashboard JSONs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
