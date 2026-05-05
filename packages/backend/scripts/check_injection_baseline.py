#!/usr/bin/env python3
"""Phase B.5 baseline check — decide if AI_SECURITY_BLOCK_HIGH_RISK can be enabled.

Reads the last 7 days of `ai_call_metrics` and computes the high-risk
prompt rate (count(WHERE injection_risk='high') / count(*)). Emits a
recommendation:

  ACTIVATE              high_rate < 0.5%   — safe to enable auto-block
  REVIEW                0.5% <= rate < 2%  — review samples first, may have FPs
  DO_NOT_ACTIVATE       rate >= 2%         — likely false positives, tune patterns

Also samples 10 high-risk prompt_hashes for manual audit (cross-link in
Tempo using `ai_security.matched_rules`).

Usage:
  cd packages/backend
  python scripts/check_injection_baseline.py
  # → exits 0 (ACTIVATE), 1 (REVIEW), 2 (DO_NOT_ACTIVATE)
  # → use exit code in CI to gate auto-activation

Why this exists:
- Activating AI_SECURITY_BLOCK_HIGH_RISK without measuring FP rate first
  can break legitimate user flows (e.g. an agent prompt containing
  "ignore previous and rewrite" matches injection regex).
- Need at least 7d of real prod traffic before flipping the switch.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL missing")
    sys.exit(1)

THRESHOLD_ACTIVATE = 0.005       # 0.5%
THRESHOLD_DO_NOT = 0.02          # 2%
MIN_SAMPLE_SIZE = 1000           # need ≥1k calls for the rate to be statistically meaningful


def main() -> int:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)

    with conn.cursor() as cur:
        # 1. Global rate over the last 7 days
        cur.execute(
            """
            SELECT
                count(*) AS total,
                count(*) FILTER (WHERE injection_risk = 'high') AS high,
                count(*) FILTER (WHERE injection_risk = 'medium') AS medium,
                count(*) FILTER (WHERE injection_risk = 'low') AS low,
                count(*) FILTER (WHERE injection_risk = 'none' OR injection_risk IS NULL) AS none
            FROM ai_call_metrics
            WHERE "timestamp" > now() - interval '7 days'
              AND prompt_hash IS NOT NULL
            """
        )
        total, high, medium, low, none = cur.fetchone()

        if total < MIN_SAMPLE_SIZE:
            logger.warning(
                f"Only {total} calls in last 7d (need ≥{MIN_SAMPLE_SIZE} for "
                "stat. significance). Wait longer before activating."
            )
            print("STATUS=DO_NOT_ACTIVATE_INSUFFICIENT_DATA")
            print(f"TOTAL={total}")
            return 2

        rate_high = high / total if total else 0
        rate_medium = medium / total if total else 0

        logger.info(f"Last 7d distribution ({total} calls):")
        logger.info(f"  high   = {high:>6} ({rate_high * 100:.2f}%)")
        logger.info(f"  medium = {medium:>6} ({rate_medium * 100:.2f}%)")
        logger.info(f"  low    = {low:>6} ({low / total * 100:.2f}%)")
        logger.info(f"  none   = {none:>6} ({none / total * 100:.2f}%)")

        # 2. Per-feature breakdown — features with high rates may need feature-level allowlist
        cur.execute(
            """
            SELECT
                feature,
                count(*) AS total,
                count(*) FILTER (WHERE injection_risk = 'high') AS high,
                ROUND(100.0 * count(*) FILTER (WHERE injection_risk = 'high') / count(*), 2) AS rate_pct
            FROM ai_call_metrics
            WHERE "timestamp" > now() - interval '7 days'
              AND prompt_hash IS NOT NULL
            GROUP BY feature
            HAVING count(*) > 50
            ORDER BY rate_pct DESC
            LIMIT 10
            """
        )
        per_feature = cur.fetchall()
        logger.info("Per-feature high-risk rates (top 10, ≥50 calls):")
        for feat, t, h, r in per_feature:
            logger.info(f"  {feat:<30} {t:>6} calls, {h:>4} high ({r}%)")

        # 3. Sample 10 high-risk prompt_hashes for audit (most-recent first)
        cur.execute(
            """
            SELECT timestamp, feature, prompt_hash, injection_score, injection_rules, model_name
            FROM ai_call_metrics
            WHERE injection_risk = 'high'
              AND "timestamp" > now() - interval '7 days'
            ORDER BY "timestamp" DESC
            LIMIT 10
            """
        )
        samples = cur.fetchall()
        if samples:
            logger.info("10 most-recent high-risk samples (cross-check in Tempo):")
            for ts, feat, ph, score, rules, model in samples:
                rules_str = ",".join(rules[:3]) if rules else "-"
                logger.info(
                    f"  {ts:%Y-%m-%d %H:%M} | {feat:<25} | hash={ph} | score={score} | rules={rules_str}"
                )

    conn.close()

    # 4. Recommendation
    if rate_high < THRESHOLD_ACTIVATE:
        logger.success(
            f"✅ ACTIVATE — high-risk rate {rate_high * 100:.2f}% < "
            f"{THRESHOLD_ACTIVATE * 100:.1f}% threshold"
        )
        print(f"STATUS=ACTIVATE")
        print(f"RATE_HIGH={rate_high:.5f}")
        print(f"TOTAL={total}")
        return 0
    elif rate_high < THRESHOLD_DO_NOT:
        logger.warning(
            f"⚠️  REVIEW — high-risk rate {rate_high * 100:.2f}% in 0.5–2% band. "
            "Review the sampled hashes manually before enabling auto-block."
        )
        print(f"STATUS=REVIEW")
        print(f"RATE_HIGH={rate_high:.5f}")
        print(f"TOTAL={total}")
        return 1
    else:
        logger.error(
            f"🛑 DO_NOT_ACTIVATE — high-risk rate {rate_high * 100:.2f}% >= "
            f"{THRESHOLD_DO_NOT * 100:.0f}%. Likely false positives. "
            "Tune ai_security.py regex patterns before enabling."
        )
        print(f"STATUS=DO_NOT_ACTIVATE")
        print(f"RATE_HIGH={rate_high:.5f}")
        print(f"TOTAL={total}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
