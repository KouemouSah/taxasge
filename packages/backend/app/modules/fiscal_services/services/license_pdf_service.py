"""
License PDF Service — Generate commercial license dossier PDFs.

Generates A4 PDFs for commercial licenses with:
- Company details (legal_name, NIF/PE, zone, activity)
- License details (bundle, commerce_type, compliance score)
- Obligations table (fee_type, ministry, amount, penalty, status)
- Totals (amount, penalties, paid, balance)
- QR code with HMAC verification

Reuses the existing PDF infrastructure (xhtml2pdf + Jinja2 + qrcode).
"""

import base64
import hashlib
import hmac
import io
import os
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional

import asyncpg
from loguru import logger

try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    logger.warning("xhtml2pdf not available — PDF generation disabled")

try:
    import qrcode
    from qrcode.constants import ERROR_CORRECT_H
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False

try:
    from jinja2 import Environment, FileSystemLoader
    JINJA2_AVAILABLE = True
except ImportError:
    JINJA2_AVAILABLE = False

# ── Translations ─────────────────────────────────────────────────────────────

TRANSLATIONS = {
    "es": {
        "title": "Dossier de Licencia Comercial",
        "subtitle": "República de Guinea Ecuatorial — Sistema Facil",
        "fiscal_year": "Año Fiscal",
        "printed": "Impreso",
        "company_info": "INFORMACIÓN DE LA EMPRESA",
        "company_name": "Razón Social",
        "reg_number": "Nº Registro",
        "forma_juridica": "Forma Jurídica",
        "regime": "Régimen Fiscal",
        "zone": "Zona Comercial",
        "activity": "Actividad",
        "license_details": "DETALLES DE LA LICENCIA",
        "bundle": "Paquete",
        "commerce_type": "Tipo de Comercio",
        "deadline": "Fecha Límite",
        "compliance_score": "Score de Cumplimiento",
        "obligations": "OBLIGACIONES FISCALES",
        "fee_type": "Tipo de Tasa",
        "ministry": "Ministerio",
        "due_date": "Vencimiento",
        "amount": "Monto",
        "penalty": "Penalidad",
        "status": "Estado",
        "total_amount": "Total Obligaciones",
        "penalties": "Penalidades",
        "paid": "Pagado",
        "balance": "Saldo Pendiente",
        "qr_caption": "Escanee para verificar la autenticidad de este documento",
        "footer_line1": "Documento generado por el sistema Facil — Gobierno de Guinea Ecuatorial",
        "footer_line2": "Este documento tiene carácter informativo. Para trámites oficiales, acuda a la oficina correspondiente.",
        "status_paid": "Pagado",
        "status_pending": "Pendiente",
        "status_overdue": "Vencido",
        "status_processing": "En Proceso",
        "status_completed": "Completado",
        "status_waived": "Exonerado",
        "status_cancelled": "Cancelado",
    },
    "fr": {
        "title": "Dossier de Licence Commerciale",
        "subtitle": "République de Guinée Équatoriale — Système Facil",
        "fiscal_year": "Année Fiscale",
        "printed": "Imprimé",
        "company_info": "INFORMATIONS DE L'ENTREPRISE",
        "company_name": "Raison Sociale",
        "reg_number": "N° Registre",
        "forma_juridica": "Forme Juridique",
        "regime": "Régime Fiscal",
        "zone": "Zone Commerciale",
        "activity": "Activité",
        "license_details": "DÉTAILS DE LA LICENCE",
        "bundle": "Forfait",
        "commerce_type": "Type de Commerce",
        "deadline": "Date Limite",
        "compliance_score": "Score de Conformité",
        "obligations": "OBLIGATIONS FISCALES",
        "fee_type": "Type de Taxe",
        "ministry": "Ministère",
        "due_date": "Échéance",
        "amount": "Montant",
        "penalty": "Pénalité",
        "status": "Statut",
        "total_amount": "Total Obligations",
        "penalties": "Pénalités",
        "paid": "Payé",
        "balance": "Solde Restant",
        "qr_caption": "Scannez pour vérifier l'authenticité de ce document",
        "footer_line1": "Document généré par le système Facil — Gouvernement de Guinée Équatoriale",
        "footer_line2": "Ce document est à titre informatif. Pour les démarches officielles, rendez-vous au bureau compétent.",
        "status_paid": "Payé",
        "status_pending": "En attente",
        "status_overdue": "En retard",
        "status_processing": "En cours",
        "status_completed": "Terminé",
        "status_waived": "Exonéré",
        "status_cancelled": "Annulé",
    },
    "en": {
        "title": "Commercial License Dossier",
        "subtitle": "Republic of Equatorial Guinea — Facil System",
        "fiscal_year": "Fiscal Year",
        "printed": "Printed",
        "company_info": "COMPANY INFORMATION",
        "company_name": "Legal Name",
        "reg_number": "Registration Number",
        "forma_juridica": "Legal Form",
        "regime": "Tax Regime",
        "zone": "Commerce Zone",
        "activity": "Activity",
        "license_details": "LICENSE DETAILS",
        "bundle": "Bundle",
        "commerce_type": "Commerce Type",
        "deadline": "Deadline",
        "compliance_score": "Compliance Score",
        "obligations": "TAX OBLIGATIONS",
        "fee_type": "Fee Type",
        "ministry": "Ministry",
        "due_date": "Due Date",
        "amount": "Amount",
        "penalty": "Penalty",
        "status": "Status",
        "total_amount": "Total Obligations",
        "penalties": "Penalties",
        "paid": "Paid",
        "balance": "Outstanding Balance",
        "qr_caption": "Scan to verify the authenticity of this document",
        "footer_line1": "Document generated by the Facil system — Government of Equatorial Guinea",
        "footer_line2": "This document is for informational purposes. For official procedures, visit the corresponding office.",
        "status_paid": "Paid",
        "status_pending": "Pending",
        "status_overdue": "Overdue",
        "status_processing": "Processing",
        "status_completed": "Completed",
        "status_waived": "Waived",
        "status_cancelled": "Cancelled",
    },
}

STATUS_CLASS_MAP = {
    "open": "open",
    "partial": "open",
    "complete": "complete",
    "overdue": "overdue",
    "suspended": "suspended",
    "closed": "complete",
}


def _format_amount(amount) -> str:
    """Format amount as XAF with space thousands separator."""
    try:
        val = Decimal(str(amount or 0))
        formatted = f"{val:,.0f}".replace(",", " ")
        return f"{formatted} XAF"
    except Exception:
        return "0 XAF"


class LicensePDFService:
    """Generate PDF dossiers for commercial licenses."""

    def __init__(self):
        self._template = None
        self._logo_base64 = None
        templates_dir = Path(__file__).parent.parent / "templates"
        if JINJA2_AVAILABLE and templates_dir.exists():
            self._env = Environment(loader=FileSystemLoader(str(templates_dir)))
        else:
            self._env = None

    def _get_template(self):
        if self._template is None and self._env:
            self._template = self._env.get_template("license_dossier_pdf.html")
        return self._template

    def _get_logo_base64(self) -> str:
        if self._logo_base64 is None:
            # Try multiple logo paths
            for logo_path in [
                Path(__file__).parent.parent.parent / "service_requests" / "templates" / "logo.png",
                Path(__file__).parent.parent.parent.parent.parent.parent / "packages" / "web" / "public" / "logo.png",
            ]:
                if logo_path.exists():
                    self._logo_base64 = base64.b64encode(logo_path.read_bytes()).decode()
                    break
            if self._logo_base64 is None:
                self._logo_base64 = ""
        return self._logo_base64

    def _generate_qr(self, verification_url: str) -> str:
        """Generate QR code as base64 PNG."""
        if not QRCODE_AVAILABLE:
            return ""
        try:
            qr = qrcode.QRCode(
                version=1, error_correction=ERROR_CORRECT_H,
                box_size=6, border=2,
            )
            qr.add_data(verification_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode()
        except Exception as e:
            logger.warning(f"QR generation failed: {e}")
            return ""

    def _generate_verification_token(self, license_id: str, amount: str) -> str:
        """HMAC-SHA256 verification token."""
        from app.config import get_settings
        settings = get_settings()
        secret = getattr(settings, 'secret_key', 'facil-default')
        message = f"license-verify|{license_id}|{amount}"
        return hmac.new(
            secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()[:16]

    async def generate_license_pdf(
        self,
        db: asyncpg.Connection,
        license_id: str,
        language: str = "es",
    ) -> bytes:
        """Generate a complete license dossier PDF.

        Fetches all data from DB and renders the HTML template → PDF.
        """
        if not XHTML2PDF_AVAILABLE:
            raise RuntimeError("xhtml2pdf not installed")

        from uuid import UUID

        texts = TRANSLATIONS.get(language, TRANSLATIONS["es"])

        # Fetch license with company + bundle info
        license_row = await db.fetchrow("""
            SELECT cl.*, c.legal_name, c.nif, c.registration_number,
                   c.forma_juridica, c.regimen_fiscal, c.objeto_social,
                   ct.name AS city_name, cz.zone_code,
                   sb.name_es AS bundle_name, sb.commerce_type
            FROM commercial_licenses cl
            JOIN companies c ON cl.company_id = c.id
            LEFT JOIN cities ct ON cl.city_id = ct.id
            LEFT JOIN commerce_zones cz ON cl.zone_id = cz.id
            LEFT JOIN service_bundles sb ON cl.bundle_id = sb.id
            WHERE cl.id = $1
        """, UUID(license_id))

        if not license_row:
            raise ValueError(f"License {license_id} not found")

        lic = dict(license_row)

        # Fetch obligations
        obligations_rows = await db.fetch("""
            SELECT lo.*, m.name AS ministry_name
            FROM license_obligations lo
            LEFT JOIN ministries m ON lo.ministry_id = m.id
            WHERE lo.license_id = $1
            ORDER BY lo.fee_type, lo.due_date
        """, UUID(license_id))

        # Prepare obligations data
        obligations = []
        total_amount = Decimal("0")
        total_penalties = Decimal("0")
        total_paid = Decimal("0")

        for ob in obligations_rows:
            amt = Decimal(str(ob["amount"] or 0))
            pen = Decimal(str(ob["penalty_amount"] or 0))
            total_amount += amt
            total_penalties += pen
            if ob["status"] in ("paid", "completed"):
                total_paid += amt

            status_key = f"status_{ob['status']}" if f"status_{ob['status']}" in texts else "status_pending"
            status_class = "paid" if ob["status"] in ("paid", "completed") else (
                "overdue" if ob["status"] == "overdue" else "pending"
            )

            obligations.append({
                "fee_type": ob["fee_type"] or "-",
                "ministry_name": ob["ministry_name"] or "-",
                "due_date": str(ob["due_date"]) if ob["due_date"] else "-",
                "amount_formatted": _format_amount(amt),
                "penalty_formatted": _format_amount(pen) if pen > 0 else "-",
                "status_label": texts.get(status_key, ob["status"]),
                "status_class": status_class,
            })

        balance = total_amount - total_paid

        # QR code
        from app.config import get_settings
        settings = get_settings()
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://facil.gq')
        token = self._generate_verification_token(license_id, str(total_amount))
        verification_url = f"{frontend_url}/verify/license?id={license_id}&token={token}"
        qr_base64 = self._generate_qr(verification_url)

        # Status
        status = lic.get("status", "open")
        status_class = STATUS_CLASS_MAP.get(status, "open")
        status_labels = {
            "open": texts.get("status_pending", "Open"),
            "partial": texts.get("status_processing", "Partial"),
            "complete": texts.get("status_paid", "Complete"),
            "overdue": texts.get("status_overdue", "Overdue"),
            "suspended": texts.get("status_cancelled", "Suspended"),
            "closed": texts.get("status_completed", "Closed"),
        }

        # Render template
        template = self._get_template()
        if not template:
            raise RuntimeError("License PDF template not found")

        html = template.render(
            title=texts["title"],
            texts=texts,
            language=language,
            logo_base64=self._get_logo_base64(),
            license_ref=f"LIC-{lic.get('fiscal_year', '')}-{str(license_id)[:8].upper()}",
            fiscal_year=lic.get("fiscal_year", ""),
            print_date=datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
            status_label=status_labels.get(status, status),
            status_class=status_class,
            company={
                "legal_name": lic.get("legal_name", ""),
                "nif": lic.get("nif"),
                "registration_number": lic.get("registration_number"),
                "forma_juridica": lic.get("forma_juridica"),
                "regimen_fiscal": lic.get("regimen_fiscal"),
                "zone_code": lic.get("zone_code"),
                "city_name": lic.get("city_name"),
                "objeto_social": lic.get("objeto_social"),
            },
            bundle_name=lic.get("bundle_name", "-"),
            commerce_type=lic.get("commerce_type", "-"),
            deadline=str(lic.get("deadline", "-")) if lic.get("deadline") else "-",
            compliance_score=lic.get("compliance_score", 0),
            obligations=obligations,
            total_amount_formatted=_format_amount(total_amount),
            total_penalties_formatted=_format_amount(total_penalties),
            total_penalties=total_penalties,
            paid_amount_formatted=_format_amount(total_paid),
            balance_formatted=_format_amount(balance),
            qr_base64=qr_base64,
        )

        # HTML → PDF
        result = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.BytesIO(html.encode("utf-8")), dest=result)
        if pisa_status.err:
            raise RuntimeError(f"PDF generation failed: {pisa_status.err}")

        pdf_bytes = result.getvalue()
        logger.info(f"License PDF generated: {license_id} ({len(pdf_bytes)} bytes)")
        return pdf_bytes


# Singleton
license_pdf_service = LicensePDFService()
