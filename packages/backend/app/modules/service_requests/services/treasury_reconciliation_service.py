"""
Treasury Reconciliation Service — Automated matching of bank transactions to payments.

Scoring algorithm:
- 100 pts: Exact reference match (bank_reference == payment_reference)
-  80 pts: Exact amount match (same amount, same currency)
-  60 pts: Amount ±1% AND same day
-  40 pts: Amount ±5% AND ±3 days

Returns top 3 candidates per unreconciled bank transaction, sorted by score.
Auto-match threshold: >= 80 pts (configurable).
"""

from datetime import timedelta
from typing import Any, Dict, List

from loguru import logger

AUTO_MATCH_THRESHOLD = 80


async def get_matching_suggestions(
    db,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    For each unreconciled bank transaction, find the top 3 matching
    service_payments candidates using a scoring algorithm.
    """
    # Get unreconciled bank transactions
    unreconciled = await db.fetch("""
        SELECT id, bank_reference, amount, currency, bank_transaction_date,
               account_holder_name, bank_code
        FROM bank_transactions
        WHERE service_payment_id IS NULL AND status = 'unreconciled'
        ORDER BY bank_transaction_date DESC
        LIMIT $1
    """, limit)

    if not unreconciled:
        return []

    # Get unmatched completed payments (potential matches)
    # Only consider payments not already reconciled to a bank transaction
    candidates = await db.fetch("""
        SELECT sp.id, sp.payment_reference, sp.total_amount, sp.currency,
               sp.created_at, sp.validated_at, sp.payment_method::text,
               u.full_name AS payer_name
        FROM service_payments sp
        JOIN users u ON u.id = sp.user_id
        WHERE sp.workflow_status = 'completed'
          AND NOT EXISTS (
              SELECT 1 FROM bank_transactions bt
              WHERE bt.service_payment_id = sp.id AND bt.status = 'reconciled'
          )
        ORDER BY sp.validated_at DESC
        LIMIT 200
    """)

    if not candidates:
        return []

    results = []
    for tx in unreconciled:
        tx_amount = float(tx["amount"])
        tx_date = tx["bank_transaction_date"]
        tx_ref = (tx["bank_reference"] or "").strip().upper()
        tx_currency = (tx["currency"] or "XAF").upper()

        matches = []
        for payment in candidates:
            score = 0
            reasons = []
            pay_amount = float(payment["total_amount"])
            pay_ref = (payment["payment_reference"] or "").strip().upper()
            pay_currency = (payment["currency"] or "XAF").upper()
            pay_date = payment["validated_at"] or payment["created_at"]

            # Currency must match
            if tx_currency != pay_currency:
                continue

            # Exact reference match
            if tx_ref and pay_ref and tx_ref == pay_ref:
                score += 100
                reasons.append("exact_reference")

            # Amount scoring
            if tx_amount > 0 and pay_amount > 0:
                diff_pct = abs(tx_amount - pay_amount) / max(tx_amount, pay_amount) * 100

                if diff_pct == 0:
                    score += 80
                    reasons.append("exact_amount")
                elif diff_pct <= 1:
                    # Check same day
                    if tx_date and pay_date:
                        day_diff = abs((tx_date.date() if hasattr(tx_date, 'date') else tx_date) -
                                       (pay_date.date() if hasattr(pay_date, 'date') else pay_date))
                        if hasattr(day_diff, 'days'):
                            day_diff = day_diff.days
                        if day_diff == 0:
                            score += 60
                            reasons.append("amount_1pct_same_day")
                        elif day_diff <= 3:
                            score += 40
                            reasons.append("amount_1pct_3days")
                elif diff_pct <= 5:
                    if tx_date and pay_date:
                        day_diff = abs((tx_date.date() if hasattr(tx_date, 'date') else tx_date) -
                                       (pay_date.date() if hasattr(pay_date, 'date') else pay_date))
                        if hasattr(day_diff, 'days'):
                            day_diff = day_diff.days
                        if day_diff <= 3:
                            score += 40
                            reasons.append("amount_5pct_3days")

            if score > 0:
                matches.append({
                    "paymentId": str(payment["id"]),
                    "paymentReference": payment["payment_reference"],
                    "paymentAmount": pay_amount,
                    "payerName": payment["payer_name"],
                    "paymentMethod": payment["payment_method"],
                    "paymentDate": str(pay_date.date()) if pay_date else None,
                    "score": score,
                    "reasons": reasons,
                })

        # Sort by score desc, take top 3
        matches.sort(key=lambda m: m["score"], reverse=True)
        top_matches = matches[:3]

        results.append({
            "transactionId": str(tx["id"]),
            "bankReference": tx["bank_reference"],
            "bankAmount": tx_amount,
            "bankCurrency": tx_currency,
            "bankDate": str(tx_date.date()) if tx_date and hasattr(tx_date, 'date') else str(tx_date),
            "accountHolder": tx["account_holder_name"],
            "bankCode": tx["bank_code"],
            "candidates": top_matches,
            "bestScore": top_matches[0]["score"] if top_matches else 0,
        })

    # Sort by best score descending (highest confidence first)
    results.sort(key=lambda r: r["bestScore"], reverse=True)
    return results


async def auto_match(
    db,
    agent_user_id: str,
    threshold: int = AUTO_MATCH_THRESHOLD,
) -> Dict[str, Any]:
    """
    Automatically reconcile all bank transactions where the best match
    has score >= threshold. Returns summary of what was matched.
    """
    suggestions = await get_matching_suggestions(db, limit=100)
    matched = []
    skipped = []

    for suggestion in suggestions:
        if suggestion["bestScore"] < threshold:
            skipped.append({
                "transactionId": suggestion["transactionId"],
                "bankReference": suggestion["bankReference"],
                "bestScore": suggestion["bestScore"],
                "reason": "below_threshold",
            })
            continue

        best = suggestion["candidates"][0]

        try:
            # Atomic reconcile: updates both bank_transactions AND service_payments
            async with db.transaction():
                await db.execute("""
                    UPDATE bank_transactions
                    SET service_payment_id = $1, status = 'reconciled',
                        reconciled_at = NOW(), reconciled_by = $2
                    WHERE id = $3 AND service_payment_id IS NULL
                """, best["paymentId"], agent_user_id, suggestion["transactionId"])

                # Bidirectional link
                await db.execute("""
                    UPDATE service_payments
                    SET bank_transaction_id = $2, updated_at = NOW()
                    WHERE id = $1
                """, best["paymentId"], suggestion["transactionId"])

            matched.append({
                "transactionId": suggestion["transactionId"],
                "bankReference": suggestion["bankReference"],
                "paymentId": best["paymentId"],
                "paymentReference": best["paymentReference"],
                "score": best["score"],
                "reasons": best["reasons"],
            })
            logger.info(
                f"Auto-reconciled: tx={suggestion['transactionId']} "
                f"→ service_payment={best['paymentId']} (score={best['score']})"
            )
        except Exception as e:
            logger.error(f"Auto-match failed for tx={suggestion['transactionId']}: {e}")
            skipped.append({
                "transactionId": suggestion["transactionId"],
                "bankReference": suggestion["bankReference"],
                "bestScore": suggestion["bestScore"],
                "reason": f"error: {str(e)}",
            })

    return {
        "matched": matched,
        "matchedCount": len(matched),
        "skipped": skipped,
        "skippedCount": len(skipped),
        "threshold": threshold,
    }
