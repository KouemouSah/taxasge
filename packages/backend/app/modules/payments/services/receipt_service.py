"""
Receipt Service - PDF Receipt Generation

Génération de reçus PDF pour paiements complétés
Table: payment_receipts
"""

from typing import Dict, Any, Optional
from loguru import logger
from datetime import datetime
import uuid


class ReceiptService:
    """Service for payment receipt generation"""

    async def generate_receipt(
        self,
        payment_id: str,
        payment_data: Dict[str, Any],
        user_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate PDF receipt for completed payment

        Args:
            payment_id: Payment UUID
            payment_data: Payment details (amount, date, reference, etc.)
            user_data: User details (name, email, etc.)

        Returns:
            {
                "receipt_id": str,
                "pdf_url": str,
                "receipt_number": str,
                "generated_at": datetime
            }
        """
        # Generate unique receipt number
        receipt_number = self._generate_receipt_number(payment_data.get("created_at"))

        # TODO: Implement actual PDF generation
        # Options:
        # 1. ReportLab (Python PDF library)
        # 2. WeasyPrint (HTML to PDF)
        # 3. External service (DocRaptor, PDFShift, etc.)

        # For now, return mock receipt data
        receipt_id = str(uuid.uuid4())

        logger.info(f"Generated receipt {receipt_number} for payment {payment_id}")

        return {
            "receipt_id": receipt_id,
            "receipt_number": receipt_number,
            "payment_id": payment_id,
            "pdf_url": f"/receipts/{receipt_id}.pdf",  # TODO: actual URL after generation
            "generated_at": datetime.utcnow(),
            "status": "generated",
        }

    def _generate_receipt_number(self, payment_date: datetime = None) -> str:
        """
        Generate unique receipt number

        Format: REC-YYYYMMDD-XXXXX
        Example: REC-20250120-00123
        """
        date = payment_date or datetime.utcnow()
        date_str = date.strftime("%Y%m%d")

        # TODO: Get sequential number from database
        # For now, use random suffix
        import random
        suffix = str(random.randint(1, 99999)).zfill(5)

        return f"REC-{date_str}-{suffix}"

    async def get_receipt_data(
        self,
        payment_id: str,
        payment_data: Dict[str, Any],
        user_data: Dict[str, Any],
        company_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Prepare receipt data for PDF generation

        Returns structured data for receipt template
        """
        receipt_data = {
            "receipt_number": self._generate_receipt_number(payment_data.get("created_at")),
            "payment_reference": payment_data.get("bank_reference"),
            "payment_date": payment_data.get("paid_at") or payment_data.get("created_at"),

            # Payer information
            "payer": {
                "name": user_data.get("first_name", "") + " " + user_data.get("last_name", ""),
                "email": user_data.get("email"),
                "phone": user_data.get("phone"),
            },

            # Company information (if business payment)
            "company": company_data if company_data else None,

            # Payment details
            "amount": {
                "base": payment_data.get("base_amount"),
                "penalties": payment_data.get("penalties", 0),
                "interest": payment_data.get("interest", 0),
                "total": payment_data.get("amount"),
                "currency": payment_data.get("currency", "XAF"),
            },

            # Payment type
            "payment_type": payment_data.get("payment_type"),
            "payment_method": payment_data.get("payment_method"),

            # Related declaration/service
            "declaration_type": payment_data.get("declaration_type"),
            "fiscal_service_name": payment_data.get("fiscal_service_name"),

            # Government details
            "treasury": {
                "name": "Trésor Public de la République de Guinée",
                "address": "Conakry, Guinée",
                "phone": "+224 XXX XXX XXX",
            },

            # Generation metadata
            "generated_at": datetime.utcnow(),
            "valid": True,
        }

        return receipt_data

    async def send_receipt_email(
        self,
        user_email: str,
        receipt_url: str,
        receipt_data: Dict[str, Any],
    ) -> bool:
        """
        Send receipt PDF via email

        Args:
            user_email: Recipient email
            receipt_url: URL to PDF receipt
            receipt_data: Receipt details

        Returns:
            True if sent successfully
        """
        # TODO: Implement email sending
        # Integration with email service (SendGrid, AWS SES, etc.)

        logger.info(f"Would send receipt to {user_email}: {receipt_url}")

        return True
