"""Inspection PDF Service — Generate PDF reports for inspections, MED, and seals.

Pattern: Jinja2 HTML template → xhtml2pdf → PDF bytes + QR verification code.
Follows the same architecture as license_pdf_service.py and receipt_service.py.
"""

import base64
import hashlib
import hmac as hmac_mod
import io
import logging
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

logger = logging.getLogger(__name__)

# Optional imports (graceful degradation if not installed)
try:
    from jinja2 import Environment, FileSystemLoader
    JINJA2_AVAILABLE = True
except ImportError:
    JINJA2_AVAILABLE = False
    logger.warning("Jinja2 not available — PDF generation disabled")

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


def _get_verification_secret() -> str:
    try:
        from app.core.secrets import get_secret
        return get_secret("VERIFICATION_SECRET") or "facil-inspection-verify-default"
    except Exception:
        return "facil-inspection-verify-default"


# ============================================================
# Translations (inline — same pattern as license_pdf_service)
# ============================================================

TRANSLATIONS = {
    "es": {
        # Inspection report
        "title": "INFORME DE INSPECCIÓN",
        "subtitle": "Control Terrain — Obligaciones Fiscales",
        "inspection_info": "DATOS DE LA INSPECCIÓN",
        "date": "Fecha",
        "inspector": "Inspector",
        "entity": "Entidad",
        "ref": "Referencia",
        "company_info": "DATOS DE LA EMPRESA",
        "company_name": "Empresa",
        "zone": "Zona",
        "city": "Ciudad",
        "result": "RESULTADO",
        "result_conforme": "CONFORME",
        "result_non_conforme": "NO CONFORME",
        "result_pending": "PENDIENTE",
        "activity_check": "VERIFICACIÓN DE ACTIVIDAD",
        "activity_status": "Estado",
        "conforme": "Conforme",
        "non_conforme": "No conforme",
        "observed": "Actividad constatada",
        "obligations": "OBLIGACIONES FISCALES",
        "service": "Servicio",
        "fee_type": "Tipo tasa",
        "amount": "Monto",
        "penalty": "Penalidad",
        "total": "Total",
        "status": "Estado",
        "total_unpaid": "Total impago",
        "location": "UBICACIÓN",
        "notes": "OBSERVACIONES",
        "digital_stamp": "SELLO DIGITAL",
        "stamp_text": "Este documento ha sido generado electrónicamente por la plataforma Facil.",
        # MED
        "med_title": "MISE EN DEMEURE",
        "med_subtitle": "Aviso Formal de Regularización Fiscal",
        "addressee": "Destinatario",
        "body_1": "Por la presente se le notifica que, tras la inspección realizada en su establecimiento, se han constatado obligaciones fiscales impagadas.",
        "body_2": "Se le requiere formalmente la regularización de las obligaciones detalladas a continuación en el plazo indicado.",
        "unpaid_obligations": "OBLIGACIONES IMPAGADAS",
        "total_due": "TOTAL A PAGAR",
        "deadline_text": "Dispone del siguiente plazo para regularizar su situación:",
        "consequence_title": "CONSECUENCIAS",
        "consequence_text": "En caso de no regularizar en el plazo indicado, su establecimiento será objeto de un procedimiento de scellé (cierre temporal) conforme a la legislación vigente.",
        "signature_text": "Firmado electrónicamente,",
        "qr_label": "Escanee para verificar este documento",
        # Seal
        "seal_title": "PROCESO VERBAL DE SCELLÉ",
        "seal_subtitle": "Cierre Temporal de Establecimiento",
        "seal_declaration": "DECLARACIÓN DE SCELLÉ",
        "seal_statement": "Se declara el cierre temporal del establecimiento {company} por incumplimiento de obligaciones fiscales.",
        "seal_reason_title": "MOTIVO DEL SCELLÉ",
        "reason": "Motivo",
        "observations": "Observaciones",
        "timeline": "CRONOLOGÍA",
        "inspection_date": "Fecha inspección",
        "med_date": "Fecha mise en demeure",
        "seal_proposed": "Scellé propuesto",
        "seal_approved": "Scellé aprobado",
        "supervisor": "Supervisor",
        "auto_approved": "Aprobado automáticamente (24h)",
        "legal_text": "Este scellé ha sido emitido conforme a la legislación fiscal de la República de Guinea Ecuatorial. La levantamiento del scellé se producirá tras la regularización completa de todas las obligaciones fiscales pendientes y sus penalidades.",
    },
    "fr": {
        "title": "RAPPORT D'INSPECTION",
        "subtitle": "Contrôle Terrain — Obligations Fiscales",
        "inspection_info": "DONNÉES DE L'INSPECTION",
        "date": "Date",
        "inspector": "Inspecteur",
        "entity": "Entité",
        "ref": "Référence",
        "company_info": "DONNÉES DE L'ENTREPRISE",
        "company_name": "Entreprise",
        "zone": "Zone",
        "city": "Ville",
        "result": "RÉSULTAT",
        "result_conforme": "CONFORME",
        "result_non_conforme": "NON CONFORME",
        "result_pending": "EN ATTENTE",
        "activity_check": "VÉRIFICATION D'ACTIVITÉ",
        "activity_status": "Statut",
        "conforme": "Conforme",
        "non_conforme": "Non conforme",
        "observed": "Activité constatée",
        "obligations": "OBLIGATIONS FISCALES",
        "service": "Service",
        "fee_type": "Type taxe",
        "amount": "Montant",
        "penalty": "Pénalité",
        "total": "Total",
        "status": "Statut",
        "total_unpaid": "Total impayé",
        "location": "LOCALISATION",
        "notes": "OBSERVATIONS",
        "digital_stamp": "CACHET NUMÉRIQUE",
        "stamp_text": "Ce document a été généré électroniquement par la plateforme Facil.",
        "med_title": "MISE EN DEMEURE",
        "med_subtitle": "Avis Formel de Régularisation Fiscale",
        "addressee": "Destinataire",
        "body_1": "Par la présente, il vous est notifié que, suite à l'inspection réalisée dans votre établissement, des obligations fiscales impayées ont été constatées.",
        "body_2": "Vous êtes formellement requis de régulariser les obligations détaillées ci-dessous dans le délai imparti.",
        "unpaid_obligations": "OBLIGATIONS IMPAYÉES",
        "total_due": "TOTAL À PAYER",
        "deadline_text": "Vous disposez du délai suivant pour régulariser votre situation :",
        "consequence_title": "CONSÉQUENCES",
        "consequence_text": "En cas de non-régularisation dans le délai indiqué, votre établissement fera l'objet d'une procédure de scellé (fermeture temporaire) conformément à la législation en vigueur.",
        "signature_text": "Signé électroniquement,",
        "qr_label": "Scannez pour vérifier ce document",
        "seal_title": "PROCÈS-VERBAL DE SCELLÉ",
        "seal_subtitle": "Fermeture Temporaire d'Établissement",
        "seal_declaration": "DÉCLARATION DE SCELLÉ",
        "seal_statement": "Il est déclaré la fermeture temporaire de l'établissement {company} pour non-respect des obligations fiscales.",
        "seal_reason_title": "MOTIF DU SCELLÉ",
        "reason": "Motif",
        "observations": "Observations",
        "timeline": "CHRONOLOGIE",
        "inspection_date": "Date d'inspection",
        "med_date": "Date de mise en demeure",
        "seal_proposed": "Scellé proposé",
        "seal_approved": "Scellé approuvé",
        "supervisor": "Superviseur",
        "auto_approved": "Approuvé automatiquement (24h)",
        "legal_text": "Ce scellé a été émis conformément à la législation fiscale de la République de Guinée Équatoriale. La levée du scellé interviendra après la régularisation complète de toutes les obligations fiscales en suspens et de leurs pénalités.",
    },
    "en": {
        "title": "INSPECTION REPORT",
        "subtitle": "Field Control — Fiscal Obligations",
        "inspection_info": "INSPECTION DETAILS",
        "date": "Date",
        "inspector": "Inspector",
        "entity": "Entity",
        "ref": "Reference",
        "company_info": "COMPANY INFORMATION",
        "company_name": "Company",
        "zone": "Zone",
        "city": "City",
        "result": "RESULT",
        "result_conforme": "COMPLIANT",
        "result_non_conforme": "NON-COMPLIANT",
        "result_pending": "PENDING",
        "activity_check": "ACTIVITY VERIFICATION",
        "activity_status": "Status",
        "conforme": "Compliant",
        "non_conforme": "Non-compliant",
        "observed": "Observed activity",
        "obligations": "FISCAL OBLIGATIONS",
        "service": "Service",
        "fee_type": "Fee type",
        "amount": "Amount",
        "penalty": "Penalty",
        "total": "Total",
        "status": "Status",
        "total_unpaid": "Total unpaid",
        "location": "LOCATION",
        "notes": "OBSERVATIONS",
        "digital_stamp": "DIGITAL STAMP",
        "stamp_text": "This document was electronically generated by the Facil platform.",
        "med_title": "FORMAL NOTICE",
        "med_subtitle": "Formal Fiscal Regularization Notice",
        "addressee": "Addressee",
        "body_1": "You are hereby notified that, following the inspection carried out at your establishment, unpaid fiscal obligations have been identified.",
        "body_2": "You are formally required to regularize the obligations detailed below within the specified deadline.",
        "unpaid_obligations": "UNPAID OBLIGATIONS",
        "total_due": "TOTAL DUE",
        "deadline_text": "You have the following deadline to regularize your situation:",
        "consequence_title": "CONSEQUENCES",
        "consequence_text": "Failure to regularize within the specified deadline will result in your establishment being subject to a sealing procedure (temporary closure) in accordance with current legislation.",
        "signature_text": "Electronically signed,",
        "qr_label": "Scan to verify this document",
        "seal_title": "SEAL OFFICIAL REPORT",
        "seal_subtitle": "Temporary Establishment Closure",
        "seal_declaration": "SEAL DECLARATION",
        "seal_statement": "The temporary closure of establishment {company} is hereby declared for non-compliance with fiscal obligations.",
        "seal_reason_title": "SEAL REASON",
        "reason": "Reason",
        "observations": "Observations",
        "timeline": "TIMELINE",
        "inspection_date": "Inspection date",
        "med_date": "Formal notice date",
        "seal_proposed": "Seal proposed",
        "seal_approved": "Seal approved",
        "supervisor": "Supervisor",
        "auto_approved": "Auto-approved (24h)",
        "legal_text": "This seal has been issued in accordance with the fiscal legislation of the Republic of Equatorial Guinea. The seal will be lifted upon full regularization of all outstanding fiscal obligations and their penalties.",
    },
}

SEAL_REASON_LABELS = {
    "es": {
        "non_paiement_apres_med": "Impago tras mise en demeure",
        "activite_non_autorisee": "Actividad no autorizada",
        "fraude_fiscale": "Fraude fiscal",
        "faux_documents": "Documentos falsificados",
        "refus_controle": "Rechazo de inspección",
        "non_conformite_grave": "No conformidad grave",
        "decision_judiciaire": "Decisión judicial",
        "ordre_ministeriel": "Orden ministerial",
    },
    "fr": {
        "non_paiement_apres_med": "Impayé après mise en demeure",
        "activite_non_autorisee": "Activité non autorisée",
        "fraude_fiscale": "Fraude fiscale",
        "faux_documents": "Documents falsifiés",
        "refus_controle": "Refus d'inspection",
        "non_conformite_grave": "Non-conformité grave",
        "decision_judiciaire": "Décision judiciaire",
        "ordre_ministeriel": "Ordre ministériel",
    },
    "en": {
        "non_paiement_apres_med": "Non-payment after formal notice",
        "activite_non_autorisee": "Unauthorized activity",
        "fraude_fiscale": "Tax fraud",
        "faux_documents": "Forged documents",
        "refus_controle": "Refused inspection",
        "non_conformite_grave": "Serious non-compliance",
        "decision_judiciaire": "Court order",
        "ordre_ministeriel": "Ministerial order",
    },
}


class InspectionPDFService:
    """Generate PDF reports for inspections, MED, and seals."""

    TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

    def __init__(self):
        self._env = None
        self._logo_base64 = None
        if JINJA2_AVAILABLE and self.TEMPLATES_DIR.exists():
            self._env = Environment(
                loader=FileSystemLoader(str(self.TEMPLATES_DIR)),
                autoescape=True,
            )

    def _get_template(self, name: str):
        if not self._env:
            raise RuntimeError("Jinja2 not available")
        return self._env.get_template(name)

    def _get_logo_base64(self) -> str:
        if self._logo_base64 is None:
            for path in [
                Path(__file__).parent.parent.parent / "service_requests" / "templates" / "logo.png",
                Path(__file__).parent.parent.parent.parent.parent.parent / "packages" / "web" / "public" / "logo.png",
            ]:
                if path.exists():
                    self._logo_base64 = base64.b64encode(path.read_bytes()).decode()
                    break
            if self._logo_base64 is None:
                self._logo_base64 = ""
        return self._logo_base64

    def _generate_qr(self, url: str) -> str:
        if not QRCODE_AVAILABLE:
            return ""
        try:
            qr = qrcode.QRCode(version=1, error_correction=ERROR_CORRECT_H, box_size=5, border=2)
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode()
        except Exception as e:
            logger.warning(f"QR generation failed: {e}")
            return ""

    def _html_to_pdf(self, html: str) -> bytes:
        if not XHTML2PDF_AVAILABLE:
            raise RuntimeError("xhtml2pdf not available")
        buf = io.BytesIO()
        status = pisa.CreatePDF(io.BytesIO(html.encode("utf-8")), dest=buf, encoding="utf-8")
        if status.err:
            raise RuntimeError(f"PDF generation failed: {status.err}")
        return buf.getvalue()

    @staticmethod
    def _generate_verification_token(doc_type: str, doc_id: str) -> str:
        secret = _get_verification_secret()
        msg = f"inspect-verify|{doc_type}|{doc_id}"
        return hmac_mod.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()[:16]

    # ============================================================
    # INSPECTION REPORT PDF
    # ============================================================

    async def generate_inspection_report(
        self, db, inspection_id: str, language: str = "es",
    ) -> bytes:
        """Generate inspection report PDF."""
        from app.modules.inspections.repositories.inspection_repository import InspectionRepository

        inspection = await InspectionRepository.get_by_id(db, UUID(inspection_id))
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        # Get obligations
        obligations = await db.fetch("""
            SELECT lo.fee_type, lo.amount, lo.penalty_amount, lo.status,
                   fs.name_es AS service_name
            FROM license_obligations lo
            LEFT JOIN fiscal_services fs ON fs.id = lo.fiscal_service_id
            WHERE lo.license_id = $1
            ORDER BY lo.fee_type
        """, inspection["license_id"])

        # Get company zone/city
        company_info = await db.fetchrow("""
            SELECT cz.zone_code, ci.name AS city_name
            FROM commercial_licenses cl
            LEFT JOIN commerce_zones cz ON cz.id = cl.zone_id
            LEFT JOIN cities ci ON ci.id = cl.city_id
            WHERE cl.id = $1
        """, inspection["license_id"])

        texts = TRANSLATIONS.get(language, TRANSLATIONS["es"])
        total_unpaid = sum(
            (o["amount"] or 0) + (o["penalty_amount"] or 0)
            for o in obligations
            if o["status"] in ("pending", "overdue")
        )

        token = self._generate_verification_token("inspection", inspection_id)
        qr_url = f"https://taxasge.emacsah.com/verify/inspection/{inspection_id[:8]}?t={token}"

        template = self._get_template("inspection_report.html")
        html = template.render(
            language=language,
            texts=texts,
            logo_base64=self._get_logo_base64(),
            inspection_id=inspection_id,
            inspection_date=str(inspection["inspection_date"]),
            agent_name=inspection.get("agent_name", ""),
            entity_code=inspection.get("entity_code", ""),
            company_name=inspection.get("company_name", ""),
            company_nif=inspection.get("company_nif", ""),
            zone_code=company_info["zone_code"] if company_info else None,
            city_name=company_info["city_name"] if company_info else None,
            result=inspection.get("result", "pending"),
            activity_conforme=inspection.get("activity_conforme"),
            activity_observed=inspection.get("activity_observed"),
            obligations=[dict(o) for o in obligations],
            total_unpaid=total_unpaid,
            gps_latitude=inspection.get("gps_latitude"),
            gps_longitude=inspection.get("gps_longitude"),
            gps_accuracy=inspection.get("gps_accuracy"),
            notes=inspection.get("notes"),
            agent_signature_base64=self._extract_signature_base64(
                inspection.get("agent_signature")
            ),
            qr_base64=self._generate_qr(qr_url),
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        )

        return self._html_to_pdf(html)

    @staticmethod
    def _extract_signature_base64(data_url: Optional[str]) -> str:
        """Extract base64 data from data URL (data:image/png;base64,XXXX)."""
        if not data_url:
            return ""
        if data_url.startswith("data:"):
            parts = data_url.split(",", 1)
            return parts[1] if len(parts) == 2 else ""
        return data_url

    # ============================================================
    # MISE EN DEMEURE PDF
    # ============================================================

    async def generate_med_pdf(
        self, db, inspection_id: str, language: str = "es",
    ) -> bytes:
        """Generate mise en demeure PDF."""
        from app.modules.inspections.repositories.inspection_repository import InspectionRepository

        inspection = await InspectionRepository.get_by_id(db, UUID(inspection_id))
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")
        if not inspection.get("mise_en_demeure_issued"):
            raise ValueError("Inspection has no mise en demeure")

        # Get MED obligations
        med_obl_ids = inspection.get("mise_en_demeure_obligations") or []
        obligations = []
        if med_obl_ids:
            obl_uuids = [UUID(oid) if isinstance(oid, str) else oid for oid in med_obl_ids]
            obligations = await db.fetch("""
                SELECT lo.fee_type, lo.amount, lo.penalty_amount, lo.status,
                       fs.name_es AS service_name
                FROM license_obligations lo
                LEFT JOIN fiscal_services fs ON fs.id = lo.fiscal_service_id
                WHERE lo.id = ANY($1::uuid[])
                ORDER BY lo.fee_type
            """, obl_uuids)

        # Get entity name + company zone/city
        entity = await db.fetchrow(
            "SELECT name FROM entities WHERE id = $1", inspection["entity_id"]
        )
        company_info = await db.fetchrow("""
            SELECT cz.zone_code, ci.name AS city_name
            FROM commercial_licenses cl
            LEFT JOIN commerce_zones cz ON cz.id = cl.zone_id
            LEFT JOIN cities ci ON ci.id = cl.city_id
            WHERE cl.id = $1
        """, inspection["license_id"])

        texts = TRANSLATIONS.get(language, TRANSLATIONS["es"])
        total_amount = sum((o["amount"] or 0) + (o["penalty_amount"] or 0) for o in obligations)
        deadline_dt = inspection.get("mise_en_demeure_deadline")
        deadline_str = deadline_dt.strftime("%d/%m/%Y %H:%M") if deadline_dt else "N/A"

        token = self._generate_verification_token("med", inspection_id)
        qr_url = f"https://taxasge.emacsah.com/verify/med/{inspection_id[:8]}?t={token}"

        template = self._get_template("mise_en_demeure.html")
        html = template.render(
            language=language,
            texts={**texts, "title": texts["med_title"], "subtitle": texts["med_subtitle"]},
            logo_base64=self._get_logo_base64(),
            inspection_id=inspection_id,
            inspection_date=str(inspection["inspection_date"]),
            agent_name=inspection.get("agent_name", ""),
            entity_name=entity["name"] if entity else "",
            company_name=inspection.get("company_name", ""),
            company_nif=inspection.get("company_nif", ""),
            zone_code=company_info["zone_code"] if company_info else None,
            city_name=company_info["city_name"] if company_info else None,
            obligations=[dict(o) for o in obligations],
            total_amount=total_amount,
            deadline_date=deadline_str,
            qr_base64=self._generate_qr(qr_url),
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        )

        return self._html_to_pdf(html)

    # ============================================================
    # SEAL REPORT PDF (PV de scellé)
    # ============================================================

    async def generate_seal_pdf(
        self, db, inspection_id: str, language: str = "es",
    ) -> bytes:
        """Generate seal report (procès-verbal) PDF."""
        from app.modules.inspections.repositories.inspection_repository import InspectionRepository

        inspection = await InspectionRepository.get_by_id(db, UUID(inspection_id))
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")
        if inspection["status"] not in ("seal_approved",):
            raise ValueError("Seal not approved — cannot generate PV")

        # Get obligations
        obligations = await db.fetch("""
            SELECT lo.fee_type, lo.amount, lo.penalty_amount,
                   fs.name_es AS service_name
            FROM license_obligations lo
            LEFT JOIN fiscal_services fs ON fs.id = lo.fiscal_service_id
            WHERE lo.license_id = $1
              AND lo.status IN ('pending', 'overdue')
            ORDER BY lo.fee_type
        """, inspection["license_id"])

        # Entity + supervisor
        entity = await db.fetchrow("SELECT name FROM entities WHERE id = $1", inspection["entity_id"])
        supervisor_name = None
        if inspection.get("seal_approved_by"):
            sup = await db.fetchrow(
                "SELECT full_name FROM users WHERE id = $1", inspection["seal_approved_by"]
            )
            supervisor_name = sup["full_name"] if sup else None

        # Company info
        company_info = await db.fetchrow("""
            SELECT cz.zone_code, ci.name AS city_name
            FROM commercial_licenses cl
            LEFT JOIN commerce_zones cz ON cz.id = cl.zone_id
            LEFT JOIN cities ci ON ci.id = cl.city_id
            WHERE cl.id = $1
        """, inspection["license_id"])

        # Find MED date if any
        med = await db.fetchrow("""
            SELECT inspection_date FROM field_inspections
            WHERE company_id = $1 AND mise_en_demeure_issued = true
            ORDER BY mise_en_demeure_deadline DESC LIMIT 1
        """, inspection["company_id"])

        texts = TRANSLATIONS.get(language, TRANSLATIONS["es"])
        reason_labels = SEAL_REASON_LABELS.get(language, SEAL_REASON_LABELS["es"])
        total_unpaid = sum((o["amount"] or 0) + (o["penalty_amount"] or 0) for o in obligations)

        token = self._generate_verification_token("seal", inspection_id)
        qr_url = f"https://taxasge.emacsah.com/verify/seal/{inspection_id[:8]}?t={token}"

        template = self._get_template("seal_report.html")
        html = template.render(
            language=language,
            texts={**texts, "title": texts["seal_title"], "subtitle": texts["seal_subtitle"]},
            logo_base64=self._get_logo_base64(),
            inspection_id=inspection_id,
            inspection_date=str(inspection["inspection_date"]),
            agent_name=inspection.get("agent_name", ""),
            entity_name=entity["name"] if entity else "",
            company_name=inspection.get("company_name", ""),
            company_nif=inspection.get("company_nif", ""),
            zone_code=company_info["zone_code"] if company_info else None,
            city_name=company_info["city_name"] if company_info else None,
            seal_reason_label=reason_labels.get(inspection.get("seal_reason", ""), inspection.get("seal_reason", "")),
            seal_notes=inspection.get("seal_notes"),
            seal_date=inspection["seal_approved_at"].strftime("%d/%m/%Y") if inspection.get("seal_approved_at") else "",
            seal_proposed_date=inspection["seal_proposed_at"].strftime("%d/%m/%Y") if inspection.get("seal_proposed_at") else "",
            med_date=str(med["inspection_date"]) if med else None,
            supervisor_name=supervisor_name,
            obligations=[dict(o) for o in obligations],
            total_unpaid=total_unpaid,
            qr_base64=self._generate_qr(qr_url),
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        )

        return self._html_to_pdf(html)


# Singleton
inspection_pdf_service = InspectionPDFService()
