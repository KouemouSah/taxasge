"""
Receipt Service - PDF Receipt Generation

Generacion de recibos PDF para pagos completados.
Soporta recibos detallados con desglose de tarifas (TariffBreakdown).

Table: payment_receipts
"""

from typing import Dict, Any, Optional, List
from loguru import logger
from datetime import datetime
from decimal import Decimal
import uuid


class ReceiptService:
    """
    Service for payment receipt generation.

    Supports itemized receipts with tariff breakdown:
    - Base amount (tarifa base)
    - Supplements (timbres, cedulas, etc.)
    - Penalties (if any)
    - Total amount
    """

    async def generate_receipt(
        self,
        payment_id: str,
        payment_data: Dict[str, Any],
        user_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate PDF receipt for completed payment."""
        receipt_number = self._generate_receipt_number(payment_data.get("created_at"))
        receipt_id = str(uuid.uuid4())
        logger.info(f"Generated receipt {receipt_number} for payment {payment_id}")
        return {
            "receipt_id": receipt_id,
            "receipt_number": receipt_number,
            "payment_id": payment_id,
            "pdf_url": f"/receipts/{receipt_id}.pdf",
            "generated_at": datetime.utcnow(),
            "status": "generated",
        }

    def _generate_receipt_number(self, payment_date: datetime = None) -> str:
        """Generate unique receipt number. Format: REC-YYYYMMDD-XXXXX"""
        date = payment_date or datetime.utcnow()
        date_str = date.strftime("%Y%m%d")
        import random
        suffix = str(random.randint(1, 99999)).zfill(5)
        return f"REC-{date_str}-{suffix}"

    def _parse_calculation_details(
        self,
        calculation_details: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Parse calculation_details (TariffBreakdown) for receipt display."""
        if not calculation_details:
            return {
                "has_breakdown": False,
                "base_amount": 0,
                "base_description": "",
                "supplements": [],
                "supplements_total": 0,
                "penalties_amount": 0,
                "penalty_reason": None,
                "total_amount": 0,
                "currency": "XAF",
            }

        supplements = calculation_details.get("supplements", [])
        return {
            "has_breakdown": True,
            "base_amount": calculation_details.get("base_amount", 0),
            "base_description": calculation_details.get("base_description", ""),
            "supplements": [
                {
                    "code": s.get("code", ""),
                    "name_es": s.get("name_es", s.get("name", "")),
                    "unit_price": s.get("unit_price", 0),
                    "quantity": s.get("quantity", 1),
                    "subtotal": s.get("subtotal", 0),
                }
                for s in supplements
            ],
            "supplements_total": calculation_details.get("supplements_total", 0),
            "penalties_amount": calculation_details.get("penalties_amount", 0),
            "penalty_reason": calculation_details.get("penalty_reason"),
            "total_amount": calculation_details.get("total_amount", 0),
            "currency": calculation_details.get("currency", "XAF"),
            "tariff_type": calculation_details.get("tariff_type", "FIXED"),
            "workflow_code": calculation_details.get("workflow_code"),
            "solicitud_type": calculation_details.get("solicitud_type"),
        }

    def _format_amount(self, amount: float, currency: str = "XAF") -> str:
        """Format amount for display (e.g., 7,500 XAF)."""
        return f"{amount:,.0f} {currency}"

    async def get_receipt_data(
        self,
        payment_id: str,
        payment_data: Dict[str, Any],
        user_data: Dict[str, Any],
        company_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Prepare receipt data for PDF generation with itemized breakdown."""
        calculation_details = payment_data.get("calculation_details")
        breakdown = self._parse_calculation_details(calculation_details)
        currency = breakdown.get("currency", "XAF")

        first_name = user_data.get("first_name", "")
        last_name = user_data.get("last_name", "")
        payer_name = f"{first_name} {last_name}".strip()

        return {
            "receipt_number": self._generate_receipt_number(payment_data.get("created_at")),
            "payment_reference": payment_data.get("payment_reference") or payment_data.get("bank_reference"),
            "payment_date": payment_data.get("paid_at") or payment_data.get("created_at"),
            "payer": {
                "name": payer_name,
                "email": user_data.get("email"),
                "phone": user_data.get("phone"),
                "dni": user_data.get("dni"),
            },
            "company": company_data,
            "breakdown": {
                "has_breakdown": breakdown["has_breakdown"],
                "base_amount": breakdown["base_amount"],
                "base_description": breakdown["base_description"],
                "base_amount_formatted": self._format_amount(breakdown["base_amount"], currency),
                "supplements": [
                    {
                        "code": s["code"],
                        "name_es": s["name_es"],
                        "unit_price": s["unit_price"],
                        "quantity": s["quantity"],
                        "subtotal": s["subtotal"],
                        "unit_price_formatted": self._format_amount(s["unit_price"], currency),
                        "subtotal_formatted": self._format_amount(s["subtotal"], currency),
                    }
                    for s in breakdown["supplements"]
                ],
                "supplements_total": breakdown["supplements_total"],
                "supplements_total_formatted": self._format_amount(breakdown["supplements_total"], currency),
                "penalties_amount": breakdown["penalties_amount"],
                "penalty_reason": breakdown["penalty_reason"],
                "penalties_formatted": self._format_amount(breakdown["penalties_amount"], currency),
                "total_amount": breakdown["total_amount"],
                "total_formatted": self._format_amount(breakdown["total_amount"], currency),
                "currency": currency,
            },
            "amount": {
                "base": payment_data.get("base_amount") or breakdown["base_amount"],
                "penalties": payment_data.get("penalties", 0) or breakdown["penalties_amount"],
                "interest": payment_data.get("interest", 0),
                "total": payment_data.get("total_amount") or breakdown["total_amount"],
                "currency": currency,
            },
            "payment_type": payment_data.get("payment_type"),
            "payment_method": payment_data.get("payment_method"),
            "workflow_code": breakdown.get("workflow_code") or payment_data.get("workflow_code"),
            "solicitud_type": breakdown.get("solicitud_type"),
            "tariff_type": breakdown.get("tariff_type"),
            "service_request_id": payment_data.get("service_request_id"),
            "declaration_type": payment_data.get("declaration_type"),
            "fiscal_service_name": payment_data.get("fiscal_service_name"),
            "treasury": {
                "name": "Tesoro Publico de la Republica de Guinea Ecuatorial",
                "ministry": "Ministerio de Hacienda, Economia y Planificacion",
                "address": "Malabo, Guinea Ecuatorial",
                "phone": "+240 333 09 XX XX",
                "nif": "GE-XXXX-XXXX",
            },
            "generated_at": datetime.utcnow(),
            "valid": True,
        }

    def format_receipt_lines(
        self,
        breakdown: Dict[str, Any],
        locale: str = "es"
    ) -> List[Dict[str, Any]]:
        """Format breakdown as receipt lines for display/printing."""
        lines = []
        currency = breakdown.get("currency", "XAF")
        labels = {
            "es": {"base": "Tarifa Base", "penalties": "Recargos", "total": "TOTAL A PAGAR"},
            "fr": {"base": "Tarif de Base", "penalties": "Penalites", "total": "TOTAL A PAYER"},
            "en": {"base": "Base Fee", "penalties": "Penalties", "total": "TOTAL DUE"},
        }
        label = labels.get(locale, labels["es"])

        # Base amount
        base_desc = breakdown.get("base_description") or label["base"]
        lines.append({
            "type": "base",
            "description": base_desc,
            "quantity": 1,
            "unit_price": breakdown["base_amount"],
            "amount": breakdown["base_amount"],
            "amount_formatted": self._format_amount(breakdown["base_amount"], currency),
        })

        # Supplements
        for s in breakdown.get("supplements", []):
            lines.append({
                "type": "supplement",
                "code": s["code"],
                "description": s["name_es"],
                "quantity": s["quantity"],
                "unit_price": s["unit_price"],
                "amount": s["subtotal"],
                "amount_formatted": self._format_amount(s["subtotal"], currency),
            })

        # Penalties
        if breakdown.get("penalties_amount", 0) > 0:
            penalty_desc = breakdown.get("penalty_reason") or label["penalties"]
            lines.append({
                "type": "penalty",
                "description": penalty_desc,
                "quantity": 1,
                "unit_price": breakdown["penalties_amount"],
                "amount": breakdown["penalties_amount"],
                "amount_formatted": self._format_amount(breakdown["penalties_amount"], currency),
            })

        # Total
        lines.append({
            "type": "total",
            "description": label["total"],
            "quantity": None,
            "unit_price": None,
            "amount": breakdown["total_amount"],
            "amount_formatted": self._format_amount(breakdown["total_amount"], currency),
            "is_total": True,
        })
        return lines

    async def send_receipt_email(
        self,
        user_email: str,
        receipt_url: str,
        receipt_data: Dict[str, Any],
    ) -> bool:
        """Send receipt PDF via email."""
        logger.info(f"Would send receipt to {user_email}: {receipt_url}")
        return True
