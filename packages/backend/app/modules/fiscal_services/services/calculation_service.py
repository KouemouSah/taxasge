"""Calculation Service - Calculate fiscal service amounts"""

from typing import Dict, Any, Optional
from loguru import logger
import asyncpg

from app.modules.fiscal_services.models import CalculationType


class CalculationService:
    """Service for calculating fiscal service amounts"""

    async def calculate(
        self,
        conn: asyncpg.Connection,
        service_id: str,
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Calculate amount for fiscal service

        Args:
            conn: Database connection
            service_id: Fiscal service ID
            input_data: Input values for calculation

        Returns:
            Dict with calculation result and breakdown
        """
        # Get service
        service = await conn.fetchrow(
            "SELECT * FROM fiscal_services WHERE id = $1", service_id
        )
        if not service:
            raise ValueError(f"Service {service_id} not found")

        service_dict = dict(service)
        calculation_type = service_dict["calculation_type"]
        base_amount = service_dict.get("base_amount") or 0

        # NOTE: fiscal_service_data → MODULE DECLARATIONS (user declarations)
        # Calculation uses service configuration (base_amount, calculation_type)
        # NOT user declaration data

        result = {
            "fiscal_service_id": service_id,
            "service_name": service_dict["name_fr"],
            "base_amount": base_amount,
            "calculation_type": calculation_type,
            "breakdown": {},
        }

        # Calculate based on type
        if calculation_type == CalculationType.FIXED.value:
            result["calculated_amount"] = base_amount
            result["breakdown"]["type"] = "fixed"
            result["breakdown"]["amount"] = base_amount

        elif calculation_type == CalculationType.PERCENTAGE.value:
            # Percentage of a base value
            base_value = input_data.get("base_value", 0)
            percentage = base_amount  # base_amount stores the percentage
            calculated = (base_value * percentage) / 100

            result["calculated_amount"] = calculated
            result["breakdown"]["type"] = "percentage"
            result["breakdown"]["base_value"] = base_value
            result["breakdown"]["percentage"] = percentage
            result["breakdown"]["formula"] = f"{base_value} × {percentage}% = {calculated}"

        elif calculation_type == CalculationType.PROGRESSIVE.value:
            # Progressive rates (like income tax)
            total_amount = input_data.get("total_amount", 0)
            calculated = await self._calculate_progressive(conn, service_id, total_amount)

            result["calculated_amount"] = calculated
            result["breakdown"]["type"] = "progressive"
            result["breakdown"]["total_amount"] = total_amount
            result["breakdown"]["calculated"] = calculated

        elif calculation_type == CalculationType.CUSTOM.value:
            # Custom calculation based on multiple fields
            calculated = await self._calculate_custom(conn, service_id, input_data)

            result["calculated_amount"] = calculated
            result["breakdown"]["type"] = "custom"
            result["breakdown"]["input_data"] = input_data
            result["breakdown"]["calculated"] = calculated

        else:
            result["calculated_amount"] = base_amount
            result["breakdown"]["type"] = "default"

        logger.info(f"Calculated {calculation_type} for service {service_id}: {result['calculated_amount']}")
        return result

    async def _calculate_progressive(
        self, conn: asyncpg.Connection, service_id: str, total_amount: float
    ) -> float:
        """
        Calculate progressive rates
        Simple progressive tax example
        """
        # Simple progressive brackets (Guinea tax system example)
        if total_amount <= 1000000:
            return total_amount * 0.05  # 5%
        elif total_amount <= 5000000:
            return 50000 + ((total_amount - 1000000) * 0.10)  # 10% above 1M
        else:
            return 450000 + ((total_amount - 5000000) * 0.15)  # 15% above 5M

    async def _calculate_custom(
        self,
        conn: asyncpg.Connection,
        service_id: str,
        input_data: Dict[str, Any],
    ) -> float:
        """
        Calculate custom formula based on service configuration
        Uses input_data provided by user
        """
        # Simple custom calculation based on input data
        # Real implementation depends on service-specific logic
        total = 0

        # Sum all numeric values in input_data
        for key, value in input_data.items():
            if isinstance(value, (int, float)):
                total += value

        return total
