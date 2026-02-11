"""
Summary PDF Service - Citizen Summary PDF Generation

Generates PDF documents for service request summaries using Jinja2 + xhtml2pdf.
Includes validation certificate generation with photo and barcode.
"""

from typing import Dict, Any, Optional
from io import BytesIO
from pathlib import Path
from datetime import datetime
import base64
import hashlib
from loguru import logger
from jinja2 import Environment, FileSystemLoader

# QR code generation with logo overlay
try:
    import qrcode
    from qrcode.constants import ERROR_CORRECT_H
    from PIL import Image
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False
    logger.warning("qrcode/Pillow not installed. QR codes will be disabled.")

# xhtml2pdf for HTML to PDF conversion
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    logger.warning("xhtml2pdf not installed. PDF generation will be disabled.")

# httpx for async HTTP requests (photo fetching)
try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    logger.warning("httpx not installed. Photo fetching will be disabled.")

# App config for URLs
from app.config import settings


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
            "date": "Fecha",
            "time": "Hora",
            "location": "Ubicacion",
            "no_appointment": "Sin cita programada",
            "payment_confirmed": "Pago registrado",
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
            "date": "Date",
            "time": "Heure",
            "location": "Lieu",
            "no_appointment": "Sans rendez-vous programme",
            "payment_confirmed": "Paiement enregistre",
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
            "date": "Date",
            "time": "Time",
            "location": "Location",
            "no_appointment": "No appointment scheduled",
            "payment_confirmed": "Payment registered",
        },
    }

    # Translations for Validation Certificate PDF
    CERTIFICATE_TRANSLATIONS = {
        "es": {
            "certificate_title": "Certificado de Validacion",
            "security_text": "Documento generado de forma segura desde la plataforma oficial TaxasGE. Este certificado es valido como comprobante de validacion de su solicitud.",
            "personal_data": "Datos del Solicitante",
            "full_name": "Nombre Completo",
            "dip_number": "Numero DIP",
            "sex": "Sexo",
            "birth_date": "Fecha de Nacimiento",
            "native_of": "Natural de",
            "nationality": "Nacionalidad",
            "address": "Domicilio",
            "profession": "Profesion",
            "marital_status": "Estado Civil",
            "filiation": "Filiacion",
            "father_name": "Nombre del Padre",
            "mother_name": "Nombre de la Madre",
            "verified_documents": "Documentos Verificados",
            "scheduled_appointment": "Cita Programada",
            "date": "Fecha",
            "time": "Hora",
            "location": "Ubicacion",
            "total_paid": "Total Pagado",
            "payment_confirmed": "Pago Confirmado",
            "no_appointment": "Cita pendiente de programacion",
            "validated_by": "Validado por",
            "validated_on": "Validado el",
            "status_validated": "VALIDADO",
            "status_verified": "Verificado",
            "status_pending": "Pendiente",
            "reference": "Referencia",
            "verify_at": "Verificar en",
            "generated_on": "Generado el",
            "no_photo": "Sin foto",
            "important_notice": "Aviso Importante",
            "notice_content": "Presente este certificado junto con su documento de identidad original en la cita programada. Conserve este documento como comprobante de su tramite.",
        },
        "fr": {
            "certificate_title": "Certificat de Validation",
            "security_text": "Document genere de maniere securisee depuis la plateforme officielle TaxasGE. Ce certificat est valide comme justificatif de validation de votre demande.",
            "personal_data": "Donnees du Demandeur",
            "full_name": "Nom Complet",
            "dip_number": "Numero DIP",
            "sex": "Sexe",
            "birth_date": "Date de Naissance",
            "native_of": "Originaire de",
            "nationality": "Nationalite",
            "address": "Adresse",
            "profession": "Profession",
            "marital_status": "Etat Civil",
            "filiation": "Filiation",
            "father_name": "Nom du Pere",
            "mother_name": "Nom de la Mere",
            "verified_documents": "Documents Verifies",
            "scheduled_appointment": "Rendez-vous Programme",
            "date": "Date",
            "time": "Heure",
            "location": "Lieu",
            "total_paid": "Total Paye",
            "payment_confirmed": "Paiement Confirme",
            "no_appointment": "Rendez-vous en attente de programmation",
            "validated_by": "Valide par",
            "validated_on": "Valide le",
            "status_validated": "VALIDE",
            "status_verified": "Verifie",
            "status_pending": "En attente",
            "reference": "Reference",
            "verify_at": "Verifier sur",
            "generated_on": "Genere le",
            "no_photo": "Sans photo",
            "important_notice": "Avis Important",
            "notice_content": "Presentez ce certificat avec votre piece d'identite originale lors du rendez-vous programme. Conservez ce document comme justificatif de votre demarche.",
        },
        "en": {
            "certificate_title": "Validation Certificate",
            "security_text": "Document securely generated from the official TaxasGE platform. This certificate is valid as proof of validation of your application.",
            "personal_data": "Applicant Data",
            "full_name": "Full Name",
            "dip_number": "DIP Number",
            "sex": "Sex",
            "birth_date": "Date of Birth",
            "native_of": "Native of",
            "nationality": "Nationality",
            "address": "Address",
            "profession": "Profession",
            "marital_status": "Marital Status",
            "filiation": "Filiation",
            "father_name": "Father's Name",
            "mother_name": "Mother's Name",
            "verified_documents": "Verified Documents",
            "scheduled_appointment": "Scheduled Appointment",
            "date": "Date",
            "time": "Time",
            "location": "Location",
            "total_paid": "Total Paid",
            "payment_confirmed": "Payment Confirmed",
            "no_appointment": "Appointment pending scheduling",
            "validated_by": "Validated by",
            "validated_on": "Validated on",
            "status_validated": "VALIDATED",
            "status_verified": "Verified",
            "status_pending": "Pending",
            "reference": "Reference",
            "verify_at": "Verify at",
            "generated_on": "Generated on",
            "no_photo": "No photo",
            "important_notice": "Important Notice",
            "notice_content": "Present this certificate along with your original ID document at the scheduled appointment. Keep this document as proof of your application.",
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

    # Logo path for QR code overlay
    LOGO_PATH = Path(__file__).parent.parent / "templates" / "logo.png"

    def __init__(self):
        """Initialize the PDF service with Jinja2 environment"""
        self.env = Environment(
            loader=FileSystemLoader(str(self.TEMPLATES_DIR)),
            autoescape=True
        )

    def _generate_qr_with_logo(self, data: str, size: int = 200) -> Optional[str]:
        """
        Generate a QR code with the TGE logo overlaid in the center.

        Uses ERROR_CORRECT_H (30% redundancy) so the QR remains scannable
        even with ~20% of the center covered by the logo.

        Returns base64-encoded PNG string, or None on failure.
        """
        if not QR_AVAILABLE:
            return None
        try:
            qr = qrcode.QRCode(
                version=None,  # auto-size
                error_correction=ERROR_CORRECT_H,
                box_size=10,
                border=2,
            )
            qr.add_data(data)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
            qr_img = qr_img.resize((size, size), Image.LANCZOS)

            # Overlay logo if available
            if self.LOGO_PATH.exists():
                logo = Image.open(self.LOGO_PATH).convert("RGBA")
                # Logo = 22% of QR size (within 30% error correction budget)
                logo_size = int(size * 0.22)
                logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

                # White circle background behind logo for contrast
                bg_size = logo_size + 8
                bg = Image.new("RGBA", (bg_size, bg_size), (255, 255, 255, 255))
                # Center the background
                bg_pos = ((size - bg_size) // 2, (size - bg_size) // 2)
                qr_img.paste(bg, bg_pos)
                # Center the logo
                logo_pos = ((size - logo_size) // 2, (size - logo_size) // 2)
                qr_img.paste(logo, logo_pos, logo)

            # Convert to base64 PNG
            buffer = BytesIO()
            qr_img.save(buffer, format="PNG")
            buffer.seek(0)
            return base64.b64encode(buffer.read()).decode("ascii")
        except Exception as e:
            logger.warning(f"QR code generation failed: {e}")
            return None

    async def generate_summary_pdf(
        self,
        request_number: str,
        workflow_name: str,
        solicitud_type: str,
        documents: list,
        tariff: Dict[str, Any],
        data_sections: list,
        appointment: Optional[Dict[str, Any]] = None,
        language: str = "es",
        photo_url: Optional[str] = None,
    ) -> bytes:
        """
        Generate a PDF summary for a service request.

        Args:
            request_number: The service request reference number
            workflow_name: Name of the workflow (e.g., "Pasaporte Nuevo")
            solicitud_type: Type of request (expedicion, renovacion, duplicado)
            documents: List of uploaded documents with validation status
            tariff: Dict with tariff breakdown (base_amount, additional_fees, total)
            data_sections: Dynamic data sections from workflow.get_pdf_data_sections().
                           Each: {"title": str, "fields": [{"label": str, "value": str}]}
            appointment: Optional appointment details (date, time, location)
            language: Language for the PDF (es, fr, en)
            photo_url: URL of citizen photo

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

        # Fetch citizen photo as base64 (non-blocking on failure)
        photo_base64 = None
        if photo_url:
            photo_base64 = await self.fetch_photo_as_base64(photo_url)

        # Generate QR code with logo
        verify_url = f"https://taxasge.emacash.com/verify/{request_number}"
        qr_code_b64 = self._generate_qr_with_logo(verify_url, size=200)

        # Render template
        template = self.env.get_template("citizen_summary_pdf.html")
        html_content = template.render(
            title=f"{texts['summary_title']} - {request_number}",
            language=language,
            texts=texts,
            request_number=request_number,
            workflow_name=workflow_name,
            solicitud_type_label=solicitud_type_label,
            data_sections=data_sections,
            documents=prepared_documents,
            has_validation_errors=has_validation_errors,
            tariff=formatted_tariff,
            appointment=formatted_appointment,
            generated_at=datetime.utcnow().strftime("%d/%m/%Y %H:%M UTC"),
            qr_code_b64=qr_code_b64,
            photo_base64=photo_base64,
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

        # Build data_sections from personal_data in summary
        texts = self.TRANSLATIONS.get(language, self.TRANSLATIONS["es"])
        personal_data = summary.get("personal_data", summary.get("personalData", {}))
        data_fields = [
            {"label": k, "value": str(v)}
            for k, v in personal_data.items()
            if v
        ]
        data_sections = [{"title": texts.get("personal_data", "Datos Personales"), "fields": data_fields}] if data_fields else []

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
            documents=documents,
            tariff=tariff,
            data_sections=data_sections,
            appointment=appointment,
            language=language,
        )


    # ========================================================================
    # VALIDATION CERTIFICATE GENERATION
    # ========================================================================

    async def fetch_photo_as_base64(self, photo_url: str) -> Optional[str]:
        """
        Fetch a photo from URL and convert to base64 data URI.

        Args:
            photo_url: URL of the photo to fetch

        Returns:
            Base64 data URI string or None if fetch fails
        """
        if not HTTPX_AVAILABLE:
            logger.warning("httpx not available, cannot fetch photo")
            return None

        if not photo_url:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(photo_url)
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', 'image/jpeg')
                    # Ensure it's an image
                    if not content_type.startswith('image/'):
                        content_type = 'image/jpeg'
                    b64_content = base64.b64encode(response.content).decode('utf-8')
                    return f"data:{content_type};base64,{b64_content}"
                else:
                    logger.warning(f"Failed to fetch photo: HTTP {response.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"Error fetching photo: {e}")
            return None

    def generate_barcode_value(self, request_number: str) -> str:
        """
        Generate a barcode value from request number.
        Uses Code 39 format (alphanumeric).

        Args:
            request_number: The service request reference

        Returns:
            Barcode string value
        """
        # Clean request number for barcode (Code 39 supports A-Z, 0-9, -, ., $, /, +, %, space)
        clean = request_number.upper().replace('REQ-', '').replace('-', '')
        # Limit to 12 characters for readability
        return clean[:12] if len(clean) > 12 else clean

    def get_logo_base64(self) -> Optional[str]:
        """
        Get the TaxasGE logo as base64.
        Reads from the templates directory.

        Returns:
            Base64 data URI string or None
        """
        logo_path = self.TEMPLATES_DIR / "logo.png"
        if logo_path.exists():
            try:
                with open(logo_path, 'rb') as f:
                    b64_content = base64.b64encode(f.read()).decode('utf-8')
                    return f"data:image/png;base64,{b64_content}"
            except Exception as e:
                logger.warning(f"Failed to read logo: {e}")
        return None

    async def generate_validation_certificate(
        self,
        request_number: str,
        workflow_name: str,
        solicitud_type: str,
        personal_data: Dict[str, Any],
        documents: list,
        tariff: Dict[str, Any],
        appointment: Optional[Dict[str, Any]] = None,
        agent_name: Optional[str] = None,
        agent_entity: Optional[str] = None,
        photo_url: Optional[str] = None,
        language: str = "es",
    ) -> bytes:
        """
        Generate a validation certificate PDF.

        Args:
            request_number: The service request reference number
            workflow_name: Name of the workflow
            solicitud_type: Type of request (expedicion, renovacion)
            personal_data: Dict with personal info including new fields:
                - nombres, apellidos, numero_dip, sexo, fecha_nacimiento
                - natural_de, nacionalidad, domicilio, profesion, estado_civil
                - nombre_padre, nombre_madre
            documents: List of verified documents
            tariff: Dict with total_amount
            appointment: Optional appointment details (date, time, location)
            agent_name: Name of the validating agent
            agent_entity: Entity of the agent (e.g., CNEDOGE)
            photo_url: URL to citizen's photo
            language: Language for the PDF (es, fr, en)

        Returns:
            PDF bytes
        """
        if not XHTML2PDF_AVAILABLE:
            raise RuntimeError("xhtml2pdf is not installed. Cannot generate PDF.")

        # Get translations
        texts = self.CERTIFICATE_TRANSLATIONS.get(language, self.CERTIFICATE_TRANSLATIONS["es"])
        solicitud_labels = self.SOLICITUD_TYPE_LABELS.get(language, self.SOLICITUD_TYPE_LABELS["es"])

        # Fetch photo as base64
        photo_base64 = await self.fetch_photo_as_base64(photo_url) if photo_url else None

        # Get logo
        logo_base64 = self.get_logo_base64()

        # Generate barcode value
        barcode_value = self.generate_barcode_value(request_number)

        # Get verify URL from settings
        verify_url = settings.FRONTEND_URL

        # Prepare documents with status
        prepared_documents = []
        for doc in documents:
            validation_status = doc.get("validation_status", doc.get("validationStatus", "verified"))
            if validation_status in ("verified", "valid"):
                status_class = "status-verified"
                status_label = texts["status_verified"]
            else:
                status_class = "status-pending"
                status_label = texts["status_pending"]

            prepared_documents.append({
                "name": doc.get("name", doc.get("document_name", doc.get("document_code", "Unknown"))),
                "status_class": status_class,
                "status_label": status_label,
            })

        # Format tariff
        def format_amount(amount: Any) -> str:
            try:
                num = float(amount) if amount else 0
                return f"{int(num):,}".replace(",", " ")
            except (ValueError, TypeError):
                return "0"

        formatted_tariff = {
            "total_amount": format_amount(tariff.get("total_amount", tariff.get("totalAmount", 0))),
        }

        # Format appointment
        formatted_appointment = None
        if appointment:
            formatted_appointment = {
                "date": appointment.get("date", appointment.get("appointmentDate", "-")),
                "time": appointment.get("time", appointment.get("appointmentTime", "-")),
                "location": appointment.get("location", appointment.get("locationName", "-")),
            }

        # Get solicitud type label
        solicitud_type_label = solicitud_labels.get(
            solicitud_type,
            solicitud_labels.get(solicitud_type.upper() if solicitud_type else "", solicitud_type or "")
        )

        # Render template
        template = self.env.get_template("validation_certificate_pdf.html")
        html_content = template.render(
            title=f"{texts['certificate_title']} - {request_number}",
            language=language,
            texts=texts,
            request_number=request_number,
            workflow_name=workflow_name,
            solicitud_type_label=solicitud_type_label,
            personal_data=personal_data,
            documents=prepared_documents,
            tariff=formatted_tariff,
            appointment=formatted_appointment,
            agent_name=agent_name,
            agent_entity=agent_entity,
            photo_base64=photo_base64,
            logo_base64=logo_base64,
            barcode_value=barcode_value,
            verify_url=verify_url,
            validated_at=datetime.utcnow().strftime("%d/%m/%Y %H:%M UTC"),
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

        logger.info(
            f"Generated validation certificate for {request_number} "
            f"({len(pdf_bytes)} bytes, photo: {'yes' if photo_base64 else 'no'})"
        )

        return pdf_bytes


# Singleton instance
summary_pdf_service = SummaryPDFService()
