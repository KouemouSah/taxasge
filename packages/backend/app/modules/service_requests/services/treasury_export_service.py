"""
Treasury Export Service - Complete Export Generation

Generates actual export files for Treasury module:
- CSV for SAGE X3 integration
- XLSX for Excel reports
- PDF for ministry reports
- XML for BEAC (Central Bank)

Uses pandas for data manipulation, xhtml2pdf for PDF generation.
Files are uploaded to Firebase Storage for persistence.
"""

import csv
import json
import hashlib
import tempfile
from io import BytesIO, StringIO
from pathlib import Path
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional, List
import asyncpg
from loguru import logger
from jinja2 import Environment, FileSystemLoader

# Pandas for data export
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logger.warning("pandas not installed. Export generation limited.")

# xhtml2pdf for PDF generation
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    logger.warning("xhtml2pdf not installed. PDF generation disabled.")

# openpyxl for Excel generation (required by pandas)
try:
    import openpyxl
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False
    logger.warning("openpyxl not installed. Excel generation will fallback to CSV.")

# lxml for XML generation
try:
    from lxml import etree
    LXML_AVAILABLE = True
except ImportError:
    LXML_AVAILABLE = False
    logger.warning("lxml not installed. XML generation disabled.")

# Firebase Storage for cloud persistence
try:
    from app.modules.documents.services.storage_service import firebase_storage_service
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Storage not available. Using local storage only.")


class TreasuryExportService:
    """Service for generating treasury export files."""

    # Export storage directory (configurable via env)
    EXPORT_DIR = Path("/tmp/treasury_exports")

    # SAGE X3 CSV column mapping
    SAGE_X3_COLUMNS = [
        ("completed_at", "DATE", lambda x: x.strftime("%Y%m%d") if x else ""),
        ("payment_reference", "PIECE", lambda x: str(x).upper()[:20] if x else ""),
        ("journal_code", "JOURNAL", lambda x: "TRS"),
        ("account_debit", "COMPTE_D", lambda x: "411000"),  # Client account
        ("account_credit", "COMPTE_C", lambda x: "512000"),  # Bank account
        ("total_amount", "MONTANT", lambda x: f"{float(x):.2f}" if x else "0.00"),
        ("currency", "DEVISE", lambda x: x or "XAF"),
        ("service_name_es", "LIBELLE", lambda x: str(x)[:50] if x else ""),
        ("user_name", "TIERS", lambda x: str(x)[:35] if x else ""),
        ("workflow_code", "PIECE2", lambda x: str(x)[:20] if x else ""),
    ]

    # Reconciliation columns
    RECONCILIATION_COLUMNS = [
        "bank_reference",
        "payment_reference",
        "amount",
        "currency",
        "bank_transaction_date",
        "reconciled_at",
        "bank_code",
        "status",
        "user_name",
    ]

    def __init__(self):
        """Initialize the export service."""
        # Ensure export directory exists
        self.EXPORT_DIR.mkdir(parents=True, exist_ok=True)

        # Template environment for PDF
        template_dir = Path(__file__).parent.parent / "templates"
        if template_dir.exists():
            self.jinja_env = Environment(
                loader=FileSystemLoader(str(template_dir)),
                autoescape=True
            )
        else:
            self.jinja_env = None
            logger.warning(f"Template directory not found: {template_dir}")

    async def _upload_to_firebase(
        self,
        local_path: Path,
        export_id: str,
        mime_type: str,
        admin_user_id: str,
    ) -> str:
        """
        Upload export file to Firebase Storage.

        Args:
            local_path: Path to local file
            export_id: Export ID for naming
            mime_type: File MIME type
            admin_user_id: User who requested the export

        Returns:
            Firebase Storage path (e.g., "treasury-exports/2026/01/export_id.csv")
        """
        if not FIREBASE_AVAILABLE:
            logger.warning("Firebase not available, keeping local path")
            return str(local_path)

        try:
            # Initialize Firebase if needed
            if not firebase_storage_service._initialized:
                await firebase_storage_service.initialize()

            # Read file content
            with open(local_path, "rb") as f:
                content = f.read()

            # Generate storage path with date organization
            now = datetime.now()
            filename = local_path.name
            storage_path = f"treasury-exports/{now.year}/{now.month:02d}/{filename}"

            # Create blob and upload
            blob = firebase_storage_service.bucket.blob(storage_path)

            # Set metadata
            blob.metadata = {
                "uploadedBy": admin_user_id or "system",
                "uploadedAt": now.isoformat(),
                "exportId": export_id,
                "assetType": "treasury-export",
                "file_size": str(len(content)),
            }

            # Upload
            blob.upload_from_string(content, content_type=mime_type, timeout=300)

            logger.info(f"Export uploaded to Firebase: {storage_path}")

            # Clean up local file
            try:
                local_path.unlink()
            except Exception as e:
                logger.warning(f"Could not delete local file: {e}")

            return storage_path

        except Exception as e:
            logger.error(f"Firebase upload failed, keeping local: {e}")
            return str(local_path)

    async def get_download_url(
        self,
        file_path: str,
        expiration_hours: int = 24,
    ) -> str:
        """
        Get signed download URL for an export file.

        Args:
            file_path: Firebase Storage path or local path
            expiration_hours: URL validity in hours

        Returns:
            Signed URL for download
        """
        if not FIREBASE_AVAILABLE or not file_path.startswith("treasury-exports/"):
            # Local file - return as-is (would need different handling)
            return file_path

        try:
            if not firebase_storage_service._initialized:
                await firebase_storage_service.initialize()

            blob = firebase_storage_service.bucket.blob(file_path)

            if not blob.exists():
                raise FileNotFoundError(f"Export file not found: {file_path}")

            # Generate signed URL
            signed_url = firebase_storage_service.generate_signed_url(
                blob,
                expiration=timedelta(hours=expiration_hours),
                method="GET"
            )

            return signed_url

        except Exception as e:
            logger.error(f"Failed to generate download URL: {e}")
            raise

    async def generate_export(
        self,
        db: asyncpg.Connection,
        export_id: str,
        export_type: str,
        export_format: str,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
        requested_by: str = None,
    ) -> Dict[str, Any]:
        """
        Generate an export file.

        Args:
            db: Database connection
            export_id: Export record ID
            export_type: Type of export (sage_x3, ministry_report, etc.)
            export_format: File format (csv, xlsx, pdf)
            period_start: Start date of period
            period_end: End date of period
            filters: Optional filters
            requested_by: User ID who requested

        Returns:
            Dict with file_path, file_size, total_records, total_amount
        """
        try:
            # Update status to processing
            await db.execute("""
                UPDATE treasury_exports
                SET status = 'processing'::export_status_enum,
                    started_at = NOW(),
                    progress_percentage = 10
                WHERE id = $1::uuid
            """, export_id)

            # Fetch payment data based on export type
            if export_type == "sage_x3":
                data = await self._fetch_sage_x3_data(db, period_start, period_end, filters)
                result = await self._generate_sage_x3_export(data, export_format, export_id)
            elif export_type == "ministry_report":
                data = await self._fetch_ministry_data(db, period_start, period_end, filters)
                result = await self._generate_ministry_report(data, export_format, export_id, period_start, period_end)
            elif export_type == "reconciliation":
                data = await self._fetch_reconciliation_data(db, period_start, period_end, filters)
                result = await self._generate_reconciliation_export(data, export_format, export_id)
            elif export_type == "audit_report":
                data = await self._fetch_audit_data(db, period_start, period_end, filters)
                result = await self._generate_audit_report(data, export_format, export_id, period_start, period_end)
            elif export_type == "bank_central":
                data = await self._fetch_beac_data(db, period_start, period_end, filters)
                result = await self._generate_beac_export(data, export_format, export_id, period_start, period_end)
            else:
                # Generic export (custom or unknown type)
                data = await self._fetch_generic_data(db, period_start, period_end, filters)
                result = await self._generate_generic_export(data, export_format, export_id)

            # Update progress
            await db.execute("""
                UPDATE treasury_exports
                SET progress_percentage = 90
                WHERE id = $1::uuid
            """, export_id)

            # Calculate file checksum
            file_path = Path(result["file_path"])
            if file_path.exists():
                with open(file_path, "rb") as f:
                    checksum = hashlib.sha256(f.read()).hexdigest()
                result["file_checksum"] = checksum

            # Upload to Firebase Storage
            firebase_path = await self._upload_to_firebase(
                local_path=file_path,
                export_id=export_id,
                mime_type=result.get("mime_type", "application/octet-stream"),
                admin_user_id=requested_by,
            )
            result["file_path"] = firebase_path

            # Update export record with results
            await db.execute("""
                UPDATE treasury_exports
                SET status = 'completed'::export_status_enum,
                    completed_at = NOW(),
                    progress_percentage = 100,
                    file_path = $2,
                    file_size_bytes = $3,
                    file_checksum = $4,
                    total_records = $5,
                    total_amount = $6,
                    file_mime_type = $7
                WHERE id = $1::uuid
            """, export_id, result["file_path"], result["file_size"],
                result.get("file_checksum"), result["total_records"],
                result["total_amount"], result.get("mime_type"))

            logger.info(f"Export {export_id} completed: {result['total_records']} records")
            return result

        except Exception as e:
            logger.error(f"Export {export_id} failed: {str(e)}")
            # Update with error
            await db.execute("""
                UPDATE treasury_exports
                SET status = 'failed'::export_status_enum,
                    error_message = $2,
                    error_details = $3::jsonb
                WHERE id = $1::uuid
            """, export_id, str(e), json.dumps({"exception": type(e).__name__}))
            raise

    async def _fetch_sage_x3_data(
        self,
        db: asyncpg.Connection,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch payment data formatted for SAGE X3."""
        conditions = ["sp.workflow_status = 'completed'"]
        params = [period_start, period_end]
        param_idx = 3

        conditions.append("sp.paid_at >= $1::date")
        conditions.append("sp.paid_at < $2::date + INTERVAL '1 day'")

        if filters:
            if filters.get("entity_code"):
                conditions.append(f"sp.entity_code = ${param_idx}")
                params.append(filters["entity_code"])
                param_idx += 1
            if filters.get("payment_method"):
                conditions.append(f"sp.payment_method = ${param_idx}")
                params.append(filters["payment_method"])
                param_idx += 1

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT
                sp.payment_reference,
                sp.total_amount,
                sp.currency,
                sp.payment_method,
                sp.paid_at AS completed_at,
                sr.workflow_code,
                sr.reference as service_request_reference,
                fs.name_es as service_name_es,
                u.full_name as user_name,
                e.name as entity_name,
                m.name_es as ministry_name
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
            LEFT JOIN users u ON u.id = sr.user_id
            LEFT JOIN entities e ON e.code = sp.entity_code
            LEFT JOIN ministries m ON m.id = e.ministry_id
            WHERE {where_clause}
            ORDER BY sp.paid_at ASC
        """

        rows = await db.fetch(query, *params)
        return [dict(row) for row in rows]

    async def _fetch_ministry_data(
        self,
        db: asyncpg.Connection,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Fetch aggregated data for ministry report."""
        conditions = ["sp.workflow_status = 'completed'"]
        params = [period_start, period_end]

        conditions.append("sp.paid_at >= $1::date")
        conditions.append("sp.paid_at < $2::date + INTERVAL '1 day'")

        entity_filter = ""
        if filters and filters.get("entity_code"):
            entity_filter = "AND sp.entity_code = $3"
            params.append(filters["entity_code"])

        where_clause = " AND ".join(conditions)

        # Summary by entity (with optional ministry)
        summary_query = f"""
            SELECT
                sp.entity_code,
                e.name as entity_name,
                e.ministry_id,
                m.name_es as ministry_name,
                COUNT(*) as payment_count,
                SUM(sp.total_amount) as total_amount,
                AVG(sp.total_amount) as avg_amount
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN entities e ON e.code = sp.entity_code
            LEFT JOIN ministries m ON m.id = e.ministry_id
            WHERE {where_clause} {entity_filter}
            GROUP BY sp.entity_code, e.name, e.ministry_id, m.name_es
            ORDER BY total_amount DESC
        """

        # Summary by payment method
        method_query = f"""
            SELECT
                sp.payment_method,
                COUNT(*) as payment_count,
                SUM(sp.total_amount) as total_amount
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            WHERE {where_clause} {entity_filter}
            GROUP BY sp.payment_method
            ORDER BY total_amount DESC
        """

        # Summary by service
        service_query = f"""
            SELECT
                fs.code as service_code,
                fs.name_es as service_name,
                COUNT(*) as payment_count,
                SUM(sp.total_amount) as total_amount
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
            WHERE {where_clause} {entity_filter}
            GROUP BY fs.code, fs.name_es
            ORDER BY total_amount DESC
            LIMIT 20
        """

        # Detailed transactions
        detail_query = f"""
            SELECT
                sp.payment_reference,
                sp.total_amount,
                sp.currency,
                sp.payment_method,
                sp.paid_at AS completed_at,
                sr.reference as request_reference,
                fs.name_es as service_name,
                u.full_name as user_name
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
            LEFT JOIN users u ON u.id = sr.user_id
            WHERE {where_clause} {entity_filter}
            ORDER BY sp.paid_at DESC
            LIMIT 100
        """

        by_entity = await db.fetch(summary_query, *params)
        by_method = await db.fetch(method_query, *params)
        by_service = await db.fetch(service_query, *params)
        details = await db.fetch(detail_query, *params)

        # Calculate totals
        total_amount = sum(float(row["total_amount"] or 0) for row in by_entity)
        total_count = sum(row["payment_count"] for row in by_entity)

        return {
            "by_entity": [dict(row) for row in by_entity],
            "by_method": [dict(row) for row in by_method],
            "by_service": [dict(row) for row in by_service],
            "details": [dict(row) for row in details],
            "total_amount": total_amount,
            "total_count": total_count,
        }

    async def _fetch_reconciliation_data(
        self,
        db: asyncpg.Connection,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch reconciliation data."""
        query = """
            SELECT
                bt.bank_reference,
                sp.payment_reference,
                bt.amount,
                bt.currency,
                bt.bank_transaction_date,
                bt.reconciled_at,
                bt.bank_code,
                bt.status::text,
                u.full_name as user_name
            FROM bank_transactions bt
            LEFT JOIN service_payments sp ON sp.id = bt.payment_id
            LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN users u ON u.id = sr.user_id
            WHERE bt.created_at >= $1::date
              AND bt.created_at < $2::date + INTERVAL '1 day'
            ORDER BY bt.created_at DESC
        """
        rows = await db.fetch(query, period_start, period_end)
        return [dict(row) for row in rows]

    async def _fetch_audit_data(
        self,
        db: asyncpg.Connection,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch audit log data."""
        query = """
            SELECT
                pva.payment_id::text,
                sp.payment_reference,
                pva.action::text,
                pva.from_status::text,
                pva.to_status::text,
                pva.comment,
                pva.created_at,
                u.full_name as agent_name
            FROM payment_validation_audit pva
            JOIN service_payments sp ON sp.id = pva.payment_id
            LEFT JOIN users u ON u.id = pva.agent_id
            WHERE pva.created_at >= $1::date
              AND pva.created_at < $2::date + INTERVAL '1 day'
            ORDER BY pva.created_at DESC
        """
        rows = await db.fetch(query, period_start, period_end)
        return [dict(row) for row in rows]

    async def _fetch_generic_data(
        self,
        db: asyncpg.Connection,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch generic payment data."""
        query = """
            SELECT
                sp.payment_reference,
                sp.total_amount,
                sp.currency,
                sp.payment_method,
                sp.workflow_status::text,
                sp.created_at,
                sp.paid_at AS completed_at,
                sr.reference as request_reference,
                sr.workflow_code,
                fs.name_es as service_name,
                u.full_name as user_name,
                e.name as entity_name,
                m.name_es as ministry_name
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
            LEFT JOIN users u ON u.id = sr.user_id
            LEFT JOIN entities e ON e.code = sp.entity_code
            LEFT JOIN ministries m ON m.id = e.ministry_id
            WHERE sp.created_at >= $1::date
              AND sp.created_at < $2::date + INTERVAL '1 day'
            ORDER BY sp.created_at DESC
        """
        rows = await db.fetch(query, period_start, period_end)
        return [dict(row) for row in rows]

    async def _fetch_beac_data(
        self,
        db: asyncpg.Connection,
        period_start: date,
        period_end: date,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Fetch data for BEAC (Banque des États de l'Afrique Centrale) report."""
        # Summary aggregations for central bank reporting
        summary_query = """
            SELECT
                DATE(sp.paid_at) as transaction_date,
                sp.payment_method,
                COUNT(*) as transaction_count,
                SUM(sp.total_amount) as total_amount,
                sp.currency
            FROM service_payments sp
            WHERE sp.workflow_status = 'completed'
              AND sp.paid_at >= $1::date
              AND sp.paid_at < $2::date + INTERVAL '1 day'
            GROUP BY DATE(sp.paid_at), sp.payment_method, sp.currency
            ORDER BY transaction_date, sp.payment_method
        """

        # Detailed transactions for compliance
        detail_query = """
            SELECT
                sp.payment_reference as reference_paiement,
                sp.total_amount as montant,
                sp.currency as devise,
                sp.payment_method as methode_paiement,
                sp.paid_at as date_execution,
                u.full_name as nom_payeur,
                u.phone as telephone_payeur,
                sr.reference as reference_dossier,
                fs.code as code_service,
                fs.name_es as libelle_service,
                sp.entity_code as code_entite,
                e.name as nom_entite,
                m.code as code_ministere
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            LEFT JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
            LEFT JOIN users u ON u.id = sr.user_id
            LEFT JOIN entities e ON e.code = sp.entity_code
            LEFT JOIN ministries m ON m.id = e.ministry_id
            WHERE sp.workflow_status = 'completed'
              AND sp.paid_at >= $1::date
              AND sp.paid_at < $2::date + INTERVAL '1 day'
            ORDER BY sp.paid_at ASC
        """

        summary = await db.fetch(summary_query, period_start, period_end)
        details = await db.fetch(detail_query, period_start, period_end)

        total_amount = sum(float(row["total_amount"] or 0) for row in summary)
        total_count = sum(row["transaction_count"] for row in summary)

        return {
            "summary": [dict(row) for row in summary],
            "details": [dict(row) for row in details],
            "total_amount": total_amount,
            "total_count": total_count,
            "period_start": period_start,
            "period_end": period_end,
        }

    async def _generate_beac_export(
        self,
        data: Dict[str, Any],
        export_format: str,
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Generate BEAC central bank report."""
        if export_format == "xml":
            return await self._write_beac_xml(data, export_id, period_start, period_end)
        elif export_format == "xlsx":
            return await self._write_beac_xlsx(data, export_id, period_start, period_end)
        else:
            # Default to XML for bank_central
            return await self._write_beac_xml(data, export_id, period_start, period_end)

    async def _write_beac_xml(
        self,
        data: Dict[str, Any],
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Write BEAC XML format file."""
        if not LXML_AVAILABLE:
            # Fallback to JSON
            return await self._write_json(data.get("details", []), export_id, data.get("total_amount", 0))

        file_path = self.EXPORT_DIR / f"{export_id}.xml"

        # Build XML structure following BEAC format standards
        root = etree.Element("RapportBEAC")
        root.set("version", "1.0")
        root.set("xmlns", "urn:beac:cemac:treasury:report")

        # Header
        header = etree.SubElement(root, "Entete")
        etree.SubElement(header, "CodePays").text = "GQ"
        etree.SubElement(header, "NomPays").text = "Guinea Ecuatorial"
        etree.SubElement(header, "CodeInstitution").text = "MINHAP"
        etree.SubElement(header, "NomInstitution").text = "Ministerio de Hacienda y Presupuestos"
        etree.SubElement(header, "DateDebut").text = period_start.strftime("%Y-%m-%d")
        etree.SubElement(header, "DateFin").text = period_end.strftime("%Y-%m-%d")
        etree.SubElement(header, "DateGeneration").text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        # Summary
        resume = etree.SubElement(root, "Resume")
        etree.SubElement(resume, "NombreTransactions").text = str(data.get("total_count", 0))
        etree.SubElement(resume, "MontantTotal").text = f"{data.get('total_amount', 0):.2f}"
        etree.SubElement(resume, "Devise").text = "XAF"

        # Daily summary
        synthese_jour = etree.SubElement(root, "SyntheseJournaliere")
        for row in data.get("summary", []):
            jour = etree.SubElement(synthese_jour, "Jour")
            etree.SubElement(jour, "Date").text = row["transaction_date"].strftime("%Y-%m-%d") if row.get("transaction_date") else ""
            etree.SubElement(jour, "MethodePaiement").text = str(row.get("payment_method", ""))
            etree.SubElement(jour, "NombreOperations").text = str(row.get("transaction_count", 0))
            etree.SubElement(jour, "Montant").text = f"{float(row.get('total_amount', 0)):.2f}"
            etree.SubElement(jour, "Devise").text = str(row.get("currency", "XAF"))

        # Transactions detail
        transactions = etree.SubElement(root, "Transactions")
        for row in data.get("details", []):
            tx = etree.SubElement(transactions, "Transaction")
            etree.SubElement(tx, "Reference").text = str(row.get("reference_paiement", ""))
            etree.SubElement(tx, "Montant").text = f"{float(row.get('montant', 0)):.2f}"
            etree.SubElement(tx, "Devise").text = str(row.get("devise", "XAF"))
            etree.SubElement(tx, "MethodePaiement").text = str(row.get("methode_paiement", ""))
            etree.SubElement(tx, "DateExecution").text = row["date_execution"].strftime("%Y-%m-%dT%H:%M:%S") if row.get("date_execution") else ""
            etree.SubElement(tx, "NomPayeur").text = str(row.get("nom_payeur", "") or "")
            etree.SubElement(tx, "ReferenceDossier").text = str(row.get("reference_dossier", ""))
            etree.SubElement(tx, "CodeService").text = str(row.get("code_service", ""))
            etree.SubElement(tx, "LibelleService").text = str(row.get("libelle_service", "") or "")[:100]
            etree.SubElement(tx, "CodeMinistere").text = str(row.get("code_ministere", "") or "")

        # Write file
        tree = etree.ElementTree(root)
        tree.write(str(file_path), encoding="utf-8", xml_declaration=True, pretty_print=True)

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": data.get("total_count", 0),
            "total_amount": float(data.get("total_amount", 0)),
            "mime_type": "application/xml",
        }

    async def _write_beac_xlsx(
        self,
        data: Dict[str, Any],
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Write BEAC report as Excel with multiple sheets."""
        if not PANDAS_AVAILABLE or not OPENPYXL_AVAILABLE:
            return await self._write_json(data.get("details", []), export_id, data.get("total_amount", 0))

        file_path = self.EXPORT_DIR / f"{export_id}.xlsx"

        with pd.ExcelWriter(str(file_path), engine="openpyxl") as writer:
            # Summary sheet
            summary_data = {
                "Indicateur": ["Periodo", "Total Transacciones", "Monto Total", "Divisa"],
                "Valor": [
                    f"{period_start.strftime('%d/%m/%Y')} - {period_end.strftime('%d/%m/%Y')}",
                    data.get("total_count", 0),
                    f"{data.get('total_amount', 0):,.2f}",
                    "XAF"
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name="Resumen", index=False)

            # Daily summary
            if data.get("summary"):
                df_daily = pd.DataFrame(data["summary"])
                df_daily.to_excel(writer, sheet_name="Sintesis Diaria", index=False)

            # Detailed transactions
            if data.get("details"):
                df_details = pd.DataFrame(data["details"])
                df_details.to_excel(writer, sheet_name="Transacciones", index=False)

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": data.get("total_count", 0),
            "total_amount": float(data.get("total_amount", 0)),
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }

    async def _generate_sage_x3_export(
        self,
        data: List[Dict[str, Any]],
        export_format: str,
        export_id: str,
    ) -> Dict[str, Any]:
        """Generate SAGE X3 format export."""
        # Build rows with transformed columns
        rows = []
        total_amount = Decimal("0")

        for record in data:
            row = {}
            for source_col, target_col, transform in self.SAGE_X3_COLUMNS:
                value = record.get(source_col)
                row[target_col] = transform(value)
            rows.append(row)
            total_amount += Decimal(str(record.get("total_amount", 0) or 0))

        # Generate file
        if export_format == "csv":
            return await self._write_csv(rows, export_id, self.SAGE_X3_COLUMNS, total_amount)
        elif export_format == "xlsx":
            return await self._write_xlsx(rows, export_id, [c[1] for c in self.SAGE_X3_COLUMNS], total_amount)
        else:
            return await self._write_csv(rows, export_id, self.SAGE_X3_COLUMNS, total_amount)

    async def _generate_ministry_report(
        self,
        data: Dict[str, Any],
        export_format: str,
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Generate ministry report."""
        if export_format == "pdf":
            return await self._write_ministry_pdf(data, export_id, period_start, period_end)
        elif export_format == "xlsx":
            return await self._write_ministry_xlsx(data, export_id, period_start, period_end)
        else:
            # Default to detailed CSV
            return await self._write_csv(
                data["details"],
                export_id,
                [(k, k, lambda x: x) for k in data["details"][0].keys()] if data["details"] else [],
                data["total_amount"],
            )

    async def _generate_reconciliation_export(
        self,
        data: List[Dict[str, Any]],
        export_format: str,
        export_id: str,
    ) -> Dict[str, Any]:
        """Generate reconciliation export."""
        total_amount = sum(float(r.get("amount", 0) or 0) for r in data)

        if export_format == "xlsx":
            return await self._write_xlsx(
                data, export_id, self.RECONCILIATION_COLUMNS, total_amount
            )
        else:
            return await self._write_csv(
                data, export_id,
                [(c, c, lambda x: x) for c in self.RECONCILIATION_COLUMNS],
                total_amount,
            )

    async def _generate_audit_report(
        self,
        data: List[Dict[str, Any]],
        export_format: str,
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Generate audit report."""
        if not data:
            columns = ["payment_reference", "action", "from_status", "to_status", "comment", "created_at", "agent_name"]
        else:
            columns = list(data[0].keys())

        if export_format == "xlsx":
            return await self._write_xlsx(data, export_id, columns, 0)
        else:
            return await self._write_csv(
                data, export_id, [(c, c, lambda x: x) for c in columns], 0
            )

    async def _generate_generic_export(
        self,
        data: List[Dict[str, Any]],
        export_format: str,
        export_id: str,
    ) -> Dict[str, Any]:
        """Generate generic export."""
        total_amount = sum(float(r.get("total_amount", 0) or 0) for r in data)

        if not data:
            columns = ["payment_reference", "total_amount", "currency", "payment_method", "workflow_status"]
        else:
            columns = list(data[0].keys())

        if export_format == "xlsx":
            return await self._write_xlsx(data, export_id, columns, total_amount)
        elif export_format == "json":
            return await self._write_json(data, export_id, total_amount)
        else:
            return await self._write_csv(
                data, export_id, [(c, c, lambda x: x) for c in columns], total_amount
            )

    async def _write_csv(
        self,
        data: List[Dict[str, Any]],
        export_id: str,
        columns: List[tuple],
        total_amount: float,
    ) -> Dict[str, Any]:
        """Write CSV file."""
        file_path = self.EXPORT_DIR / f"{export_id}.csv"

        with open(file_path, "w", newline="", encoding="utf-8-sig") as f:
            if columns:
                # Extract target column names
                header = [c[1] if isinstance(c, tuple) else c for c in columns]
                writer = csv.DictWriter(f, fieldnames=header, delimiter=";")
                writer.writeheader()

                for row in data:
                    # Transform row if needed
                    if isinstance(columns[0], tuple) and len(columns[0]) == 3:
                        transformed = {}
                        for source, target, transform in columns:
                            transformed[target] = self._format_value(row.get(source))
                        writer.writerow(transformed)
                    else:
                        writer.writerow({k: self._format_value(row.get(k)) for k in header})

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": len(data),
            "total_amount": float(total_amount),
            "mime_type": "text/csv",
        }

    async def _write_xlsx(
        self,
        data: List[Dict[str, Any]],
        export_id: str,
        columns: List[str],
        total_amount: float,
    ) -> Dict[str, Any]:
        """Write XLSX file using pandas."""
        if not PANDAS_AVAILABLE:
            # Fallback to CSV
            return await self._write_csv(
                data, export_id, [(c, c, lambda x: x) for c in columns], total_amount
            )

        file_path = self.EXPORT_DIR / f"{export_id}.xlsx"

        # Create DataFrame
        df = pd.DataFrame(data)

        # Format datetime columns
        for col in df.columns:
            if df[col].dtype == "object":
                try:
                    df[col] = pd.to_datetime(df[col])
                except (ValueError, TypeError):
                    pass

        # Write to Excel
        df.to_excel(str(file_path), index=False, engine="openpyxl")

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": len(data),
            "total_amount": float(total_amount),
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }

    async def _write_json(
        self,
        data: List[Dict[str, Any]],
        export_id: str,
        total_amount: float,
    ) -> Dict[str, Any]:
        """Write JSON file."""
        file_path = self.EXPORT_DIR / f"{export_id}.json"

        # Convert datetime objects
        def json_serializer(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            if isinstance(obj, Decimal):
                return float(obj)
            return str(obj)

        export_data = {
            "generated_at": datetime.now().isoformat(),
            "total_records": len(data),
            "total_amount": float(total_amount),
            "records": data,
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, default=json_serializer, indent=2, ensure_ascii=False)

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": len(data),
            "total_amount": float(total_amount),
            "mime_type": "application/json",
        }

    async def _write_ministry_pdf(
        self,
        data: Dict[str, Any],
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Write ministry report PDF."""
        if not XHTML2PDF_AVAILABLE:
            # Fallback to CSV
            return await self._write_csv(
                data.get("details", []),
                export_id,
                [(k, k, lambda x: x) for k in (data.get("details", [{}])[0].keys() if data.get("details") else [])],
                data.get("total_amount", 0),
            )

        file_path = self.EXPORT_DIR / f"{export_id}.pdf"

        # Generate HTML content
        html_content = self._generate_ministry_html(data, period_start, period_end)

        # Convert to PDF
        with open(file_path, "wb") as f:
            pisa.CreatePDF(BytesIO(html_content.encode("utf-8")), dest=f)

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": data.get("total_count", 0),
            "total_amount": float(data.get("total_amount", 0)),
            "mime_type": "application/pdf",
        }

    async def _write_ministry_xlsx(
        self,
        data: Dict[str, Any],
        export_id: str,
        period_start: date,
        period_end: date,
    ) -> Dict[str, Any]:
        """Write ministry report XLSX with multiple sheets."""
        if not PANDAS_AVAILABLE:
            return await self._write_csv(
                data.get("details", []),
                export_id,
                [(k, k, lambda x: x) for k in (data.get("details", [{}])[0].keys() if data.get("details") else [])],
                data.get("total_amount", 0),
            )

        file_path = self.EXPORT_DIR / f"{export_id}.xlsx"

        with pd.ExcelWriter(str(file_path), engine="openpyxl") as writer:
            # Summary by entity
            if data.get("by_entity"):
                df_entity = pd.DataFrame(data["by_entity"])
                df_entity.to_excel(writer, sheet_name="Por Entidad", index=False)

            # Summary by payment method
            if data.get("by_method"):
                df_method = pd.DataFrame(data["by_method"])
                df_method.to_excel(writer, sheet_name="Por Metodo", index=False)

            # Summary by service
            if data.get("by_service"):
                df_service = pd.DataFrame(data["by_service"])
                df_service.to_excel(writer, sheet_name="Por Servicio", index=False)

            # Detail transactions
            if data.get("details"):
                df_details = pd.DataFrame(data["details"])
                df_details.to_excel(writer, sheet_name="Detalle", index=False)

        file_size = file_path.stat().st_size

        return {
            "file_path": str(file_path),
            "file_size": file_size,
            "total_records": data.get("total_count", 0),
            "total_amount": float(data.get("total_amount", 0)),
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }

    def _generate_ministry_html(
        self,
        data: Dict[str, Any],
        period_start: date,
        period_end: date,
    ) -> str:
        """Generate HTML for ministry PDF report."""
        total_amount = data.get("total_amount", 0)
        total_count = data.get("total_count", 0)

        # Format currency
        def format_xaf(amount):
            return f"{float(amount or 0):,.0f} XAF"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }}
                h1 {{ color: #1a365d; font-size: 18px; text-align: center; }}
                h2 {{ color: #2d3748; font-size: 14px; margin-top: 20px; border-bottom: 1px solid #e2e8f0; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .header img {{ height: 60px; }}
                .period {{ text-align: center; color: #718096; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                th {{ background-color: #edf2f7; padding: 8px; text-align: left; border: 1px solid #e2e8f0; }}
                td {{ padding: 8px; border: 1px solid #e2e8f0; }}
                .total-row {{ background-color: #f7fafc; font-weight: bold; }}
                .amount {{ text-align: right; }}
                .summary-box {{ background-color: #ebf8ff; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .summary-box h3 {{ margin: 0 0 10px 0; color: #2b6cb0; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 10px; color: #a0aec0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MINISTERIO DE HACIENDA Y PRESUPUESTOS</h1>
                <p>Republica de Guinea Ecuatorial</p>
                <h1>INFORME DE RECAUDACION TREASURY</h1>
            </div>

            <div class="period">
                <strong>Periodo:</strong> {period_start.strftime('%d/%m/%Y')} - {period_end.strftime('%d/%m/%Y')}
            </div>

            <div class="summary-box">
                <h3>Resumen General</h3>
                <p><strong>Total Recaudado:</strong> {format_xaf(total_amount)}</p>
                <p><strong>Total Transacciones:</strong> {total_count:,}</p>
            </div>

            <h2>Recaudacion por Entidad</h2>
            <table>
                <thead>
                    <tr>
                        <th>Entidad</th>
                        <th class="amount">Transacciones</th>
                        <th class="amount">Monto Total</th>
                    </tr>
                </thead>
                <tbody>
        """

        for entity in data.get("by_entity", []):
            html += f"""
                    <tr>
                        <td>{entity.get('entity_name', 'N/A')}</td>
                        <td class="amount">{entity.get('payment_count', 0):,}</td>
                        <td class="amount">{format_xaf(entity.get('total_amount', 0))}</td>
                    </tr>
            """

        html += f"""
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td class="amount">{total_count:,}</td>
                        <td class="amount">{format_xaf(total_amount)}</td>
                    </tr>
                </tbody>
            </table>

            <h2>Recaudacion por Metodo de Pago</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metodo</th>
                        <th class="amount">Transacciones</th>
                        <th class="amount">Monto Total</th>
                    </tr>
                </thead>
                <tbody>
        """

        for method in data.get("by_method", []):
            html += f"""
                    <tr>
                        <td>{method.get('payment_method', 'N/A')}</td>
                        <td class="amount">{method.get('payment_count', 0):,}</td>
                        <td class="amount">{format_xaf(method.get('total_amount', 0))}</td>
                    </tr>
            """

        html += """
                </tbody>
            </table>

            <h2>Top 20 Servicios por Recaudacion</h2>
            <table>
                <thead>
                    <tr>
                        <th>Servicio</th>
                        <th class="amount">Transacciones</th>
                        <th class="amount">Monto Total</th>
                    </tr>
                </thead>
                <tbody>
        """

        for service in data.get("by_service", [])[:20]:
            html += f"""
                    <tr>
                        <td>{service.get('service_name', 'N/A')[:50]}</td>
                        <td class="amount">{service.get('payment_count', 0):,}</td>
                        <td class="amount">{format_xaf(service.get('total_amount', 0))}</td>
                    </tr>
            """

        html += f"""
                </tbody>
            </table>

            <div class="footer">
                <p>Generado automaticamente por TaxasGE Treasury - {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            </div>
        </body>
        </html>
        """

        return html

    def _format_value(self, value):
        """Format value for CSV export."""
        if value is None:
            return ""
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, Decimal):
            return str(value)
        return str(value)


# Singleton instance
treasury_export_service = TreasuryExportService()
