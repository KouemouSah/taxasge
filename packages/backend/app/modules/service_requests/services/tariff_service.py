"""
Tariff Service for calculating workflow costs.
Uses workflow_tariffs and tariff_supplements tables from migration 022.
"""
import asyncpg
from typing import Dict, Optional, List
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class TariffService:
    """
    Calculate tariffs using workflow_tariffs and tariff_supplements.
    Leverages the get_workflow_tariff_total() database function.
    """

    async def calculate(
        self,
        db: asyncpg.Connection,
        workflow_code: str,
        solicitud_type: str = "expedicion",
        extracted_data: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate total tariff for a workflow.

        Args:
            db: Database connection
            workflow_code: The workflow code (e.g., "residencia", "pasaporte_nuevo")
            solicitud_type: Type of request (expedicion, renovacion, duplicado)
            extracted_data: Optional extracted data for dynamic calculations

        Returns:
            Tariff breakdown with base, supplements, and total
        """
        try:
            # Use the database function created in migration 022
            query = "SELECT * FROM get_workflow_tariff_total($1, $2)"
            row = await db.fetchrow(query, workflow_code, solicitud_type)

            if not row:
                logger.warning(f"No tariff found for workflow: {workflow_code}/{solicitud_type}")
                return self._empty_tariff()

            return {
                "base_amount": float(row["base_amount"]),
                "supplements": row["supplements"] or [],
                "supplements_total": float(row["supplements_total"]),
                "penalties_amount": 0.0,  # Calculated separately if needed
                "total_amount": float(row["total_amount"]),
                "currency": row["currency"] or "XAF"
            }

        except Exception as e:
            logger.error(f"Error calculating tariff: {e}")
            return self._empty_tariff()

    async def get_base_tariff(
        self,
        db: asyncpg.Connection,
        workflow_code: str,
        solicitud_type: str = "expedicion"
    ) -> Optional[Dict]:
        """
        Get only the base tariff (without supplements).

        Args:
            db: Database connection
            workflow_code: The workflow code
            solicitud_type: Type of request

        Returns:
            Base tariff info or None
        """
        query = """
            SELECT amount, currency, legal_reference, effective_from
            FROM workflow_tariffs
            WHERE workflow_code = $1
              AND solicitud_type = $2
              AND is_active = TRUE
              AND effective_from <= CURRENT_DATE
              AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
            ORDER BY effective_from DESC
            LIMIT 1
        """
        row = await db.fetchrow(query, workflow_code, solicitud_type)

        if not row:
            return None

        return {
            "amount": float(row["amount"]),
            "currency": row["currency"],
            "legal_reference": row["legal_reference"],
            "effective_from": row["effective_from"]
        }

    async def get_supplements(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> List[Dict]:
        """
        Get configured supplements for a workflow.

        Args:
            db: Database connection
            workflow_code: The workflow code

        Returns:
            List of supplement configurations
        """
        query = """
            SELECT
                ts.code,
                ts.name_es,
                ts.amount,
                wsc.quantity_per_request,
                ts.amount * wsc.quantity_per_request as subtotal,
                wsc.is_required
            FROM workflow_supplement_config wsc
            JOIN tariff_supplements ts ON ts.code = wsc.supplement_code
            WHERE wsc.workflow_code = $1
              AND wsc.is_active = TRUE
              AND ts.is_active = TRUE
              AND ts.effective_from <= CURRENT_DATE
              AND (ts.effective_to IS NULL OR ts.effective_to > CURRENT_DATE)
            ORDER BY ts.name_es
        """
        rows = await db.fetch(query, workflow_code)

        return [
            {
                "code": row["code"],
                "name": row["name_es"],
                "unit_price": float(row["amount"]),
                "quantity": row["quantity_per_request"],
                "subtotal": float(row["subtotal"]),
                "is_required": row["is_required"]
            }
            for row in rows
        ]

    async def calculate_with_penalties(
        self,
        db: asyncpg.Connection,
        workflow_code: str,
        solicitud_type: str = "expedicion",
        days_late: int = 0
    ) -> Dict:
        """
        Calculate tariff including late penalties.

        Args:
            db: Database connection
            workflow_code: The workflow code
            solicitud_type: Type of request
            days_late: Number of days late (for renewals)

        Returns:
            Full tariff breakdown with penalties
        """
        # Get base calculation
        tariff = await self.calculate(db, workflow_code, solicitud_type)

        # Calculate penalties if applicable
        if days_late > 0 and solicitud_type == "renovacion":
            penalty_info = self._calculate_penalty(
                tariff["base_amount"],
                days_late
            )
            tariff["penalties_amount"] = penalty_info["amount"]
            tariff["penalty_details"] = penalty_info
            tariff["total_amount"] = (
                tariff["base_amount"] +
                tariff["supplements_total"] +
                tariff["penalties_amount"]
            )

        return tariff

    def _calculate_penalty(
        self,
        base_amount: float,
        days_late: int
    ) -> Dict:
        """
        Calculate penalty based on days late.
        Penalty tiers:
        - 1-30 days: 10% of base
        - 31-60 days: 20% of base
        - 61-90 days: 30% of base
        - 90+ days: 50% of base
        """
        if days_late <= 0:
            return {"amount": 0.0, "rate": 0, "tier": "none"}

        if days_late <= 30:
            rate = 10
            tier = "1-30 days"
        elif days_late <= 60:
            rate = 20
            tier = "31-60 days"
        elif days_late <= 90:
            rate = 30
            tier = "61-90 days"
        else:
            rate = 50
            tier = "90+ days"

        amount = base_amount * (rate / 100)

        return {
            "amount": round(amount, 2),
            "rate": rate,
            "tier": tier,
            "days_late": days_late
        }

    def _empty_tariff(self) -> Dict:
        """Return empty tariff structure"""
        return {
            "base_amount": 0.0,
            "supplements": [],
            "supplements_total": 0.0,
            "penalties_amount": 0.0,
            "total_amount": 0.0,
            "currency": "XAF"
        }


# Singleton instance
tariff_service = TariffService()
