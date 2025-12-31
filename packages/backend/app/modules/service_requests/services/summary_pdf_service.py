"""
Summary PDF Service - Citizen Summary PDF Generation

Generates PDF documents for service request summaries using Jinja2 + xhtml2pdf.
"""

from typing import Dict, Any, Optional
from io import BytesIO
from pathlib import Path
from datetime import datetime
from loguru import logger
from jinja2 import Environment, FileSystemLoader

# xhtml2pdf for HTML to PDF conversion
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    logger.warning("xhtml2pdf not installed. PDF generation will be disabled.")


class SummaryPDFService:
    """Service for generating citizen summary PDFs"""

    # Template directory
    TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

    # Translations for PDF content
    TRANSLATIONS = {
        "es": {
            "platform_subtitle": "Plataforma de Servicios Fiscales - Guinea Ecuatorial",
            "summary_title": "Resumen de Solicitud",
            "personal_data": "Datos Personales",
            "full_name": "Nombre Completo",
            "dip_number": "Numero DIP",
            "birth_date": "Fecha de Nacimiento",
            "nationality": "Nacionalidad",
            "birth_place": "Lugar de Nacimiento",
            "address": "Domicilio",
            "profession": "Profesion",
            "marital_status": "Estado Civil",
            "uploaded_documents": "Documentos Subidos",
            "attention": "Atencion",
            "validation_errors_message": "Algunos documentos requieren revision. Por favor verifique los campos marcados.",
            "payment_breakdown": "Desglose de Pago",
            "concept": "Concepto",
            "amount": "Importe",
            "base_tariff": "Tarifa Base",
            "total": "TOTAL A PAGAR",
            "appointment": "Cita",
            "scheduled_appointment": "Cita Programada",
            "reference": "Referencia",
            "generated_on": "Generado el",
            "verification_url": "Verificar en: taxasge.com/verify",
            "qr_code": "Codigo QR",
            "status_verified": "Verificado",
            "status_pending": "Pendiente",
            "status_error": "Error",
        },
        "fr": {
            "platform_subtitle": "Plateforme de Services Fiscaux - Guinee Equatoriale",
            "summary_title": "Resume de la Demande",
            "personal_data": "Donnees Personnelles",
            "full_name": "Nom Complet",
            "dip_number": "Numero DIP",
            "birth_date": "Date de Naissance",
            "nationality": "Nationalite",
            "birth_place": "Lieu de Naissance",
            "address": "Adresse",
            "profession": "Profession",
            "marital_status": "Etat Civil",
            "uploaded_documents": "Documents Telecharges",
            "attention": "Attention",
            "validation_errors_message": "Certains documents necessitent une revision. Veuillez verifier les champs marques.",
            "payment_breakdown": "Detail du Paiement",
            "concept": "Concept",
            "amount": "Montant",
            "base_tariff": "Tarif de Base",
            "total": "TOTAL A PAYER",
            "appointment": "Rendez-vous",
            "scheduled_appointment": "Rendez-vous Programme",
            "reference": "Reference",
            "generated_on": "Genere le",
            "verification_url": "Verifier sur: taxasge.com/verify",
            "qr_code": "Code QR",
            "status_verified": "Verifie",
            "status_pending": "En attente",
            "status_error": "Erreur",
        },
        "en": {
            "platform_subtitle": "Fiscal Services Platform - Equatorial Guinea",
            "summary_title": "Request Summary",
            "personal_data": "Personal Data",
            "full_name": "Full Name",
            "dip_number": "DIP Number",
            "birth_date": "Date of Birth",
            "nationality": "Nationality",
            "birth_place": "Place of Birth",
            "address": "Address",
            "profession": "Profession",
            "marital_status": "Marital Status",
            "uploaded_documents": "Uploaded Documents",
            "attention": "Attention",
            "validation_errors_message": "Some documents require review. Please check the marked fields.",
            "payment_breakdown": "Payment Breakdown",
            "concept": "Concept",
            "amount": "Amount",
            "base_tariff": "Base Tariff",
            "total": "TOTAL TO PAY",
            "appointment": "Appointment",
            "scheduled_appointment": "Scheduled Appointment",
            "reference": "Reference",
            "generated_on": "Generated on",
            "verification_url": "Verify at: taxasge.com/verify",
            "qr_code": "QR Code",
            "status_verified": "Verified",
            "status_pending": "Pending",
            "status_error": "Error",
        },
    }

    # Solicitud type labels
    SOLICITUD_TYPE_LABELS = {
        "es": {
            "expedicion": "Nueva Expedicion",
            "renovacion": "Renovacion",
            "duplicado": "Duplicado",
            "NUEVO": "Nuevo",
            "RENOVACION": "Renovacion",
            "PERDIDA": "Por Perdida",
            "ROBO": "Por Robo",
            "DETERIORO": "Por Deterioro",
        },
        "fr": {
            "expedicion": "Nouvelle Emission",
            "renovacion": "Renouvellement",
            "duplicado": "Duplicata",
            "NUEVO": "Nouveau",
            "RENOVACION": "Renouvellement",
            "PERDIDA": "Pour Perte",
            "ROBO": "Pour Vol",
            "DETERIORO": "Pour Deterioration",
        },
        "en": {
            "expedicion": "New Issuance",
            "renovacion": "Renewal",
            "duplicado": "Duplicate",
            "NUEVO": "New",
            "RENOVACION": "Renewal",
            "PERDIDA": "For Loss",
            "ROBO": "For Theft",
            "DETERIORO": "For Damage",
        },
    }

    def __init__(self):
        """Initialize the PDF service with Jinja2 environment"""
        self.env = Environment(
            loader=FileSystemLoader(str(self.TEMPLATES_DIR)),
            autoescape=True
        )

    async def generate_summary_pdf(
        self,
        request_number: str,
        workflow_name: str,
        solicitud_type: str,
        personal_data: Dict[str, Any],
        documents: list,
        tariff: Dict[str, Any],
        appointment: Optional[Dict[str, Any]] = None,
        language: str = "es",
    ) -> bytes:
        """
        Generate a PDF summary for a service request.

        Args:
            request_number: The service request reference number
            workflow_name: Name of the workflow (e.g., "Pasaporte Nuevo")
            solicitud_type: Type of request (expedicion, renovacion, duplicado)
            personal_data: Dict with personal info (nombres, apellidos, etc.)
            documents: List of uploaded documents with validation status
            tariff: Dict with tariff breakdown (base_amount, additional_fees, total)
            appointment: Optional appointment details (date, time, location)
            language: Language for the PDF (es, fr, en)

        Returns:
            PDF bytes
        """
        if not XHTML2PDF_AVAILABLE:
            raise RuntimeError("xhtml2pdf is not installed. Cannot generate PDF.")

        # Get translations
        texts = self.TRANSLATIONS.get(language, self.TRANSLATIONS["es"])
        solicitud_labels = self.SOLICITUD_TYPE_LABELS.get(language, self.SOLICITUD_TYPE_LABELS["es"])

        # Prepare document list with status classes
        prepared_documents = []
        has_validation_errors = False

        for doc in documents:
            confidence = doc.get("confidence", 0)
            validation_status = doc.get("validation_status", "pending")

            if validation_status == "verified" or confidence >= 90:
                status_class = "status-verified"
                status_label = texts["status_verified"]
            elif validation_status == "error" or confidence < 70:
                status_class = "status-error"
                status_label = texts["status_error"]
                has_validation_errors = True
            else:
                status_class = "status-pending"
                status_label = texts["status_pending"]

            prepared_documents.append({
                "name": doc.get("name", doc.get("document_code", "Unknown")),
                "status_class": status_class,
                "status_label": status_label,
                "confidence": confidence if confidence > 0 else None,
            })

        # Format tariff amounts
        def format_amount(amount: Any) -> str:
            """Format amount with thousands separator"""
            try:
                num = float(amount) if amount else 0
                return f"{int(num):,}".replace(",", " ")
            except (ValueError, TypeError):
                return "0"

        formatted_tariff = {
            "base_amount": format_amount(tariff.get("base_amount", 0)),
            "additional_fees": [
                {
                    "name": fee.get("name", "Suplemento"),
                    "amount": format_amount(fee.get("amount", 0)),
                }
                for fee in tariff.get("additional_fees", [])
            ],
            "total_amount": format_amount(tariff.get("total_amount", 0)),
        }

        # Prepare appointment data
        formatted_appointment = None
        if appointment:
            formatted_appointment = {
                "date": appointment.get("date", "-"),
                "time": appointment.get("time", "-"),
                "location": appointment.get("location", "-"),
            }

        # Get solicitud type label
        solicitud_type_label = solicitud_labels.get(
            solicitud_type,
            solicitud_labels.get(solicitud_type.upper(), solicitud_type)
        )

        # Render template
        template = self.env.get_template("citizen_summary_pdf.html")
        html_content = template.render(
            title=f"{texts['summary_title']} - {request_number}",
            language=language,
            texts=texts,
            request_number=request_number,
            workflow_name=workflow_name,
            solicitud_type_label=solicitud_type_label,
            personal_data=personal_data,
            documents=prepared_documents,
            has_validation_errors=has_validation_errors,
            tariff=formatted_tariff,
            appointment=formatted_appointment,
            generated_at=datetime.utcnow().strftime("%d/%m/%Y %H:%M UTC"),
        )

        # Convert HTML to PDF
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            src=html_content,
            dest=pdf_buffer,
            encoding="utf-8"
        )

        if pisa_status.err:
            logger.error(f"PDF generation error: {pisa_status.err}")
            raise RuntimeError(f"Failed to generate PDF: {pisa_status.err}")

        pdf_buffer.seek(0)
        pdf_bytes = pdf_buffer.read()

        logger.info(f"Generated summary PDF for {request_number} ({len(pdf_bytes)} bytes)")

        return pdf_bytes

    async def generate_from_summary_response(
        self,
        summary: Dict[str, Any],
        language: str = "es",
    ) -> bytes:
        """
        Generate PDF from a CitizenSummaryResponse object.

        Args:
            summary: CitizenSummaryResponse dict from the API
            language: Language for the PDF

        Returns:
            PDF bytes
        """
        # Extract data from summary response
        request_number = summary.get("request_number", summary.get("requestNumber", "-"))
        workflow_name = summary.get("workflow_name", summary.get("workflowName", "Unknown Workflow"))
        solicitud_type = summary.get("solicitud_type", summary.get("solicitidType", "expedicion"))

        # Personal data
        personal_data = summary.get("personal_data", summary.get("personalData", {}))

        # Documents
        raw_documents = summary.get("documents", [])
        documents = [
            {
                "name": doc.get("document_name", doc.get("documentName", doc.get("document_code", "Unknown"))),
                "confidence": doc.get("confidence", 0),
                "validation_status": doc.get("validation_status", doc.get("validationStatus", "pending")),
            }
            for doc in raw_documents
        ]

        # Tariff
        tariff_data = summary.get("tariff", {})
        tariff = {
            "base_amount": tariff_data.get("base_amount", tariff_data.get("baseAmount", 0)),
            "additional_fees": tariff_data.get("additional_fees", tariff_data.get("additionalFees", [])),
            "total_amount": tariff_data.get("total_amount", tariff_data.get("totalAmount", 0)),
        }

        # Appointment
        appointment_data = summary.get("appointment")
        appointment = None
        if appointment_data:
            appointment = {
                "date": appointment_data.get("date", appointment_data.get("appointmentDate", "-")),
                "time": appointment_data.get("time", appointment_data.get("appointmentTime", "-")),
                "location": appointment_data.get("location", appointment_data.get("locationName", "-")),
            }

        return await self.generate_summary_pdf(
            request_number=request_number,
            workflow_name=workflow_name,
            solicitud_type=solicitud_type,
            personal_data=personal_data,
            documents=documents,
            tariff=tariff,
            appointment=appointment,
            language=language,
        )


# Singleton instance
summary_pdf_service = SummaryPDFService()
