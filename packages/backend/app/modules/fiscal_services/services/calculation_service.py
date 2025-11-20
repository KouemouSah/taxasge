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

        # Get calculable fields
        fields = await conn.fetch(
            "SELECT * FROM fiscal_service_data WHERE fiscal_service_id = $1",
            service_id,
        )

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
            calculated = await self._calculate_custom(conn, service_id, input_data, fields)

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
        TODO: Implement progressive tax brackets from fiscal_service_data table
        """
        # For now, simple progressive example
        # Real implementation would use fiscal_service_data for brackets
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
        fields: list,
    ) -> float:
        """
        Calculate custom formula based on multiple fields
        """
        total = 0
        for field in fields:
            field_dict = dict(field)
            field_name = field_dict["field_name"]
            field_type = field_dict["field_type"]

            value = input_data.get(field_name)
            if value is None:
                if field_dict["is_required"]:
                    raise ValueError(f"Required field {field_name} is missing")
                value = field_dict.get("default_value", 0)

            # Add to total based on field type
            if field_type == "number":
                total += float(value)
            elif field_type == "percentage":
                # Assume percentage applies to a base value
                base = input_data.get(f"{field_name}_base", 0)
                total += (float(base) * float(value)) / 100

        return total

    def validate_input_data(
        self, fields: list, input_data: Dict[str, Any]
    ) -> tuple[bool, Optional[str]]:
        """
        Validate input data against required fields

        Returns:
            (is_valid, error_message)
        """
        for field in fields:
            field_dict = dict(field)
            field_name = field_dict["field_name"]
            is_required = field_dict["is_required"]

            if is_required and field_name not in input_data:
                return False, f"Required field {field_name} is missing"

            if field_name in input_data:
                value = input_data[field_name]
                field_type = field_dict["field_type"]

                # Type validation
                if field_type == "number" and not isinstance(value, (int, float)):
                    return False, f"Field {field_name} must be a number"

                # Range validation
                min_value = field_dict.get("min_value")
                max_value = field_dict.get("max_value")

                if min_value is not None and value < min_value:
                    return False, f"Field {field_name} must be >= {min_value}"

                if max_value is not None and value > max_value:
                    return False, f"Field {field_name} must be <= {max_value}"

        return True, None
