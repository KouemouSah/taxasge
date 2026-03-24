"""Inspection Export Service — CSV and PDF export for field inspections.

Pattern: Same architecture as TreasuryExportService / HistoryExportService.
CSV uses io.StringIO + csv.writer with UTF-8 BOM for Excel compatibility.
PDF uses xhtml2pdf (pisa) with inline HTML.
"""

import csv
import io
import logging
from datetime import date, datetime
from decimal import Decimal
from html import escape as html_escape
from typing import Dict, List, Optional
from uuid import UUID

logger = logging.getLogger(__name__)

# xhtml2pdf for PDF generation (graceful degradation)
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    pisa = None
    XHTML2PDF_AVAILABLE = False
    logger.warning("xhtml2pdf not available — PDF export disabled")


class InspectionExportService:
    """Export inspections data as CSV or PDF."""

    # ============================================================
    # CSV — Inspections list
    # ============================================================

    @staticmethod
    async def export_inspections_csv(
        conn,
        entity_id: UUID,
        filters: Dict,
    ) -> bytes:
        """Export filtered inspections as CSV.

        Args:
            conn: asyncpg connection
            entity_id: Entity to scope the export
            filters: Dict with optional keys: date_from, date_to, agent_id,
                     zone_code, result, status, has_payment, has_med,
                     has_seal, search

        Returns:
            CSV file bytes with UTF-8 BOM for Excel compatibility
        """
        conditions = ["fi.entity_id = $1"]
        params: list = [entity_id]
        idx = 2

        # --- Date range ---
        if filters.get("date_from"):
            conditions.append(f"fi.inspection_date >= ${idx}")
            params.append(filters["date_from"])
            idx += 1

        if filters.get("date_to"):
            conditions.append(f"fi.inspection_date <= ${idx}")
            params.append(filters["date_to"])
            idx += 1

        # --- Agent ---
        if filters.get("agent_id"):
            conditions.append(f"fi.agent_id = ${idx}")
            params.append(filters["agent_id"])
            idx += 1

        # --- Zone ---
        if filters.get("zone_code"):
            conditions.append(f"cz.zone_code = ${idx}")
            params.append(filters["zone_code"])
            idx += 1

        # --- Result ---
        if filters.get("result"):
            conditions.append(f"fi.result = ${idx}")
            params.append(filters["result"])
            idx += 1

        # --- Status ---
        if filters.get("status"):
            conditions.append(f"fi.status = ${idx}")
            params.append(filters["status"])
            idx += 1

        # --- Boolean flags ---
        if filters.get("has_payment") is not None:
            conditions.append(f"fi.payment_collected = ${idx}")
            params.append(bool(filters["has_payment"]))
            idx += 1

        if filters.get("has_med") is not None:
            conditions.append(f"fi.mise_en_demeure_issued = ${idx}")
            params.append(bool(filters["has_med"]))
            idx += 1

        if filters.get("has_seal") is not None:
            conditions.append(f"fi.seal_applied = ${idx}")
            params.append(bool(filters["has_seal"]))
            idx += 1

        # --- Free-text search (company name or NIF) ---
        if filters.get("search"):
            conditions.append(
                f"(c.legal_name ILIKE ${idx} "
                f"OR COALESCE(c.nif, c.registration_number) ILIKE ${idx})"
            )
            params.append(f"%{filters['search']}%")
            idx += 1

        where = " AND ".join(conditions)

        rows = await conn.fetch(f"""
            SELECT
                fi.inspection_date,
                u.full_name AS agent_name,
                c.legal_name AS company_name,
                COALESCE(c.nif, c.registration_number) AS company_nif,
                cz.zone_code,
                fi.result,
                fi.status,
                COALESCE(fi.payment_amount, 0) AS payment_amount,
                fi.mise_en_demeure_issued,
                fi.seal_applied,
                fi.duration_minutes,
                fi.notes
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            JOIN users u ON u.id = fi.agent_id
            JOIN entities e ON e.id = fi.entity_id
            LEFT JOIN commerce_zones cz ON cz.id = fi.zone_id
            WHERE {where}
            ORDER BY fi.inspection_date DESC, fi.created_at DESC
            LIMIT 10000
        """, *params)

        # Build CSV
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)

        # Header row
        writer.writerow([
            "Fecha", "Agente", "Empresa", "NIF", "Zona",
            "Resultado", "Estado", "Monto Cobrado",
            "MED", "Scellé", "Duración (min)", "Notas",
        ])

        for r in rows:
            writer.writerow([
                r["inspection_date"].isoformat() if r["inspection_date"] else "",
                r["agent_name"] or "",
                r["company_name"] or "",
                r["company_nif"] or "",
                r["zone_code"] or "",
                r["result"] or "",
                r["status"] or "",
                f"{float(r['payment_amount']):.0f}" if r["payment_amount"] else "0",
                "Sí" if r["mise_en_demeure_issued"] else "No",
                "Sí" if r["seal_applied"] else "No",
                str(r["duration_minutes"]) if r["duration_minutes"] else "",
                (r["notes"] or "").replace("\n", " "),
            ])

        content = output.getvalue()
        return b'\xef\xbb\xbf' + content.encode("utf-8")

    # ============================================================
    # CSV — Agent performance
    # ============================================================

    @staticmethod
    async def export_agents_csv(
        conn,
        entity_id: UUID,
        date_from: date,
        date_to: date,
    ) -> bytes:
        """Export agent performance aggregates as CSV.

        Args:
            conn: asyncpg connection
            entity_id: Entity scope
            date_from: Start of period (inclusive)
            date_to: End of period (inclusive)

        Returns:
            CSV file bytes with UTF-8 BOM
        """
        rows = await conn.fetch("""
            SELECT
                u.full_name AS agent_name,
                COUNT(*) AS total_inspections,
                COUNT(*) FILTER (WHERE fi.result = 'conforme') AS conforme,
                COUNT(*) FILTER (WHERE fi.result = 'non_conforme') AS non_conforme,
                CASE
                    WHEN COUNT(*) > 0
                    THEN ROUND(
                        COUNT(*) FILTER (WHERE fi.result = 'conforme') * 100.0
                        / COUNT(*), 1
                    )
                    ELSE 0
                END AS tasa_conformidad,
                COUNT(*) FILTER (WHERE fi.payment_collected = true) AS cobros,
                COALESCE(
                    SUM(fi.payment_amount) FILTER (WHERE fi.payment_collected = true),
                    0
                ) AS monto_cobrado,
                COUNT(*) FILTER (WHERE fi.mise_en_demeure_issued = true) AS med_count,
                COUNT(*) FILTER (WHERE fi.seal_applied = true) AS seal_count,
                COALESCE(
                    ROUND(AVG(fi.duration_minutes) FILTER (WHERE fi.duration_minutes IS NOT NULL)),
                    0
                ) AS duracion_prom,
                COUNT(DISTINCT cz.zone_code)
                    FILTER (WHERE cz.zone_code IS NOT NULL) AS zonas,
                COUNT(DISTINCT fi.inspection_date) AS dias_activos
            FROM field_inspections fi
            JOIN users u ON u.id = fi.agent_id
            LEFT JOIN commerce_zones cz ON cz.id = fi.zone_id
            WHERE fi.entity_id = $1
              AND fi.inspection_date >= $2
              AND fi.inspection_date <= $3
            GROUP BY u.id, u.full_name
            ORDER BY total_inspections DESC
        """, entity_id, date_from, date_to)

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)

        writer.writerow([
            "Agente", "Inspecciones Total", "Conformes", "No Conformes",
            "Tasa Conformidad", "Cobros", "Monto Cobrado",
            "MED", "Scellés", "Duración Prom",
            "Zonas", "Días Activos",
        ])

        for r in rows:
            writer.writerow([
                r["agent_name"] or "",
                r["total_inspections"],
                r["conforme"],
                r["non_conforme"],
                f"{float(r['tasa_conformidad']):.1f}%",
                r["cobros"],
                f"{float(r['monto_cobrado']):.0f}",
                r["med_count"],
                r["seal_count"],
                r["duracion_prom"],
                r["zonas"],
                r["dias_activos"],
            ])

        content = output.getvalue()
        return b'\xef\xbb\xbf' + content.encode("utf-8")

    # ============================================================
    # PDF — Inspections report
    # ============================================================

    @staticmethod
    async def export_inspections_pdf(
        conn,
        entity_id: UUID,
        filters: Dict,
        entity_code: str,
    ) -> bytes:
        """Export inspections as a formatted PDF report.

        Args:
            conn: asyncpg connection
            entity_id: Entity scope
            filters: Same filter dict as export_inspections_csv
            entity_code: Entity code for the report header

        Returns:
            PDF file bytes

        Raises:
            RuntimeError: If xhtml2pdf is not installed
        """
        if not XHTML2PDF_AVAILABLE:
            logger.error("xhtml2pdf not available for PDF generation")
            raise RuntimeError("PDF generation not available — xhtml2pdf not installed")

        # -- Build dynamic WHERE clause (same logic as CSV) --
        conditions = ["fi.entity_id = $1"]
        params: list = [entity_id]
        idx = 2

        if filters.get("date_from"):
            conditions.append(f"fi.inspection_date >= ${idx}")
            params.append(filters["date_from"])
            idx += 1

        if filters.get("date_to"):
            conditions.append(f"fi.inspection_date <= ${idx}")
            params.append(filters["date_to"])
            idx += 1

        if filters.get("agent_id"):
            conditions.append(f"fi.agent_id = ${idx}")
            params.append(filters["agent_id"])
            idx += 1

        if filters.get("zone_code"):
            conditions.append(f"cz.zone_code = ${idx}")
            params.append(filters["zone_code"])
            idx += 1

        if filters.get("result"):
            conditions.append(f"fi.result = ${idx}")
            params.append(filters["result"])
            idx += 1

        if filters.get("status"):
            conditions.append(f"fi.status = ${idx}")
            params.append(filters["status"])
            idx += 1

        if filters.get("has_payment") is not None:
            conditions.append(f"fi.payment_collected = ${idx}")
            params.append(bool(filters["has_payment"]))
            idx += 1

        if filters.get("has_med") is not None:
            conditions.append(f"fi.mise_en_demeure_issued = ${idx}")
            params.append(bool(filters["has_med"]))
            idx += 1

        if filters.get("has_seal") is not None:
            conditions.append(f"fi.seal_applied = ${idx}")
            params.append(bool(filters["has_seal"]))
            idx += 1

        if filters.get("search"):
            conditions.append(
                f"(c.legal_name ILIKE ${idx} "
                f"OR COALESCE(c.nif, c.registration_number) ILIKE ${idx})"
            )
            params.append(f"%{filters['search']}%")
            idx += 1

        where = " AND ".join(conditions)

        # -- Fetch data --
        rows = await conn.fetch(f"""
            SELECT
                fi.inspection_date,
                u.full_name AS agent_name,
                c.legal_name AS company_name,
                COALESCE(c.nif, c.registration_number) AS company_nif,
                cz.zone_code,
                fi.result,
                fi.status,
                COALESCE(fi.payment_amount, 0) AS payment_amount,
                fi.mise_en_demeure_issued,
                fi.seal_applied,
                fi.duration_minutes,
                fi.notes
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            JOIN users u ON u.id = fi.agent_id
            JOIN entities e ON e.id = fi.entity_id
            LEFT JOIN commerce_zones cz ON cz.id = fi.zone_id
            WHERE {where}
            ORDER BY fi.inspection_date DESC, fi.created_at DESC
            LIMIT 10000
        """, *params)

        # -- Compute summary stats --
        total = len(rows)
        conforme = sum(1 for r in rows if r["result"] == "conforme")
        non_conforme = sum(1 for r in rows if r["result"] == "non_conforme")
        total_collected = sum(
            float(r["payment_amount"]) for r in rows if r["payment_amount"]
        )

        date_range_label = ""
        if filters.get("date_from") or filters.get("date_to"):
            d_from = filters.get("date_from", "...")
            d_to = filters.get("date_to", "...")
            date_range_label = f"{d_from} — {d_to}"
        else:
            date_range_label = "Todas las fechas"

        # -- Build HTML --
        html = _build_inspections_pdf_html(
            entity_code=entity_code,
            date_range=date_range_label,
            total=total,
            conforme=conforme,
            non_conforme=non_conforme,
            total_collected=total_collected,
            rows=rows,
        )

        # -- Convert to PDF --
        output = io.BytesIO()
        pisa.CreatePDF(
            io.BytesIO(html.encode("utf-8")),
            dest=output,
        )
        return output.getvalue()


# ================================================================
# Private helper — HTML template for PDF
# ================================================================

def _build_inspections_pdf_html(
    entity_code: str,
    date_range: str,
    total: int,
    conforme: int,
    non_conforme: int,
    total_collected: float,
    rows: List,
) -> str:
    """Build the HTML string for the inspections PDF report."""

    # Table rows
    table_rows = ""
    for r in rows:
        insp_date = (
            r["inspection_date"].isoformat() if r["inspection_date"] else ""
        )
        med_label = "Sí" if r["mise_en_demeure_issued"] else "No"
        seal_label = "Sí" if r["seal_applied"] else "No"
        amount = f"{float(r['payment_amount']):,.0f}" if r["payment_amount"] else "0"
        duration = str(r["duration_minutes"]) if r["duration_minutes"] else "-"
        notes = (r["notes"] or "")[:80].replace("\n", " ")

        # Result colour
        result_val = r["result"] or ""
        if result_val == "conforme":
            result_style = "color: #16a34a; font-weight: bold;"
        elif result_val == "non_conforme":
            result_style = "color: #dc2626; font-weight: bold;"
        else:
            result_style = ""

        table_rows += f"""
            <tr>
                <td>{html_escape(insp_date)}</td>
                <td>{html_escape(r['agent_name'] or '')}</td>
                <td>{html_escape(r['company_name'] or '')}</td>
                <td>{html_escape(r['company_nif'] or '')}</td>
                <td>{html_escape(r['zone_code'] or '')}</td>
                <td style="{result_style}">{html_escape(result_val)}</td>
                <td>{html_escape(r['status'] or '')}</td>
                <td style="text-align:right;">{html_escape(amount)}</td>
                <td>{html_escape(med_label)}</td>
                <td>{html_escape(seal_label)}</td>
                <td style="text-align:right;">{html_escape(duration)}</td>
                <td>{html_escape(notes)}</td>
            </tr>
        """

    conformity_rate = f"{conforme * 100 / total:.1f}" if total > 0 else "0.0"
    generated_at = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: A4 landscape;
                margin: 1cm;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 8px;
                line-height: 1.3;
                color: #333;
            }}
            .header {{
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
            }}
            .header h1 {{
                color: #1e40af;
                font-size: 14px;
                margin: 0 0 3px 0;
            }}
            .header h2 {{
                color: #3b82f6;
                font-size: 10px;
                margin: 0;
                font-weight: normal;
            }}
            .summary {{
                display: flex;
                margin-bottom: 12px;
            }}
            .summary-box {{
                background: #f1f5f9;
                padding: 6px 10px;
                border-radius: 4px;
                margin-right: 8px;
                text-align: center;
            }}
            .summary-box .label {{
                font-size: 7px;
                color: #64748b;
                text-transform: uppercase;
            }}
            .summary-box .value {{
                font-size: 12px;
                font-weight: bold;
                color: #1e293b;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
            }}
            th {{
                background: #1e40af;
                color: #fff;
                padding: 4px 3px;
                font-size: 7px;
                text-align: left;
                text-transform: uppercase;
            }}
            td {{
                padding: 3px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 7px;
            }}
            tr:nth-child(even) {{
                background: #f8fafc;
            }}
            .footer {{
                text-align: center;
                margin-top: 15px;
                padding-top: 8px;
                border-top: 1px solid #e2e8f0;
                color: #94a3b8;
                font-size: 7px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Rapport d'Inspections &mdash; {html_escape(entity_code)}</h1>
            <h2>{date_range}</h2>
        </div>

        <table style="width:auto; margin-bottom:12px;">
            <tr>
                <td style="border:none; padding:4px 12px 4px 0;">
                    <span style="color:#64748b; font-size:7px;">TOTAL</span><br/>
                    <span style="font-size:12px; font-weight:bold;">{total}</span>
                </td>
                <td style="border:none; padding:4px 12px;">
                    <span style="color:#64748b; font-size:7px;">CONFORME</span><br/>
                    <span style="font-size:12px; font-weight:bold; color:#16a34a;">{conforme}</span>
                </td>
                <td style="border:none; padding:4px 12px;">
                    <span style="color:#64748b; font-size:7px;">NON CONFORME</span><br/>
                    <span style="font-size:12px; font-weight:bold; color:#dc2626;">{non_conforme}</span>
                </td>
                <td style="border:none; padding:4px 12px;">
                    <span style="color:#64748b; font-size:7px;">TAUX CONFORM.</span><br/>
                    <span style="font-size:12px; font-weight:bold;">{conformity_rate}%</span>
                </td>
                <td style="border:none; padding:4px 12px;">
                    <span style="color:#64748b; font-size:7px;">MONTANT COLLECT&Eacute;</span><br/>
                    <span style="font-size:12px; font-weight:bold; color:#1e40af;">{total_collected:,.0f} XAF</span>
                </td>
            </tr>
        </table>

        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Agente</th>
                    <th>Empresa</th>
                    <th>NIF</th>
                    <th>Zona</th>
                    <th>Resultado</th>
                    <th>Estado</th>
                    <th>Monto Cobrado</th>
                    <th>MED</th>
                    <th>Scell&eacute;</th>
                    <th>Dur. (min)</th>
                    <th>Notas</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>

        <div class="footer">
            G&eacute;n&eacute;r&eacute; par TaxasGE &mdash; {generated_at}
        </div>
    </body>
    </html>
    """
