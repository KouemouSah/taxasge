"""
CSVImportService — Bulk company import from CSV.

Parse → validate → classify batch → create drafts.
Supports CSV with configurable column mappings.
"""

import csv
import io
import uuid
from typing import Any, Dict, List, Optional, Tuple

import asyncpg
from loguru import logger

from app.modules.companies.services.classification_agent import classification_agent


# Required columns (must be present in CSV header)
REQUIRED_COLUMNS = {"legal_name", "forma_juridica"}

# Optional columns (recognized but not required)
OPTIONAL_COLUMNS = {
    "nif", "tax_id", "registration_number", "trade_name",
    "sector_actividad", "subsector_actividad", "objeto_social",
    "commerce_type", "capital_social", "employee_count",
    "domicilio_fiscal", "address", "phone", "email",
    "representante_legal", "nacionalidad",
}

# Column aliases (user-friendly names → internal field names)
COLUMN_ALIASES = {
    "nombre_empresa": "legal_name",
    "razon_social": "legal_name",
    "actividad_comercial": "objeto_social",
    "capital": "capital_social",
    "numero_empleados": "employee_count",
    "empleados": "employee_count",
    "domicilio": "domicilio_fiscal",
    "direccion": "address",
    "telefono": "phone",
    "correo": "email",
    "representante": "representante_legal",
}


class CSVImportService:
    """Bulk company import from CSV files."""

    async def import_csv(
        self,
        conn: asyncpg.Connection,
        file_content: bytes,
        user_id: str,
        zone_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Parse CSV → validate → classify batch → create drafts.

        Returns import result with counts and errors.
        """
        # 1. Parse CSV
        rows, parse_errors = self._parse_csv(file_content)
        if not rows:
            return {
                "total": 0,
                "imported": 0,
                "errors": parse_errors,
                "batch_id": None,
            }

        batch_id = str(uuid.uuid4())

        # 2. Validate rows
        valid_rows = []
        validation_errors = []
        for i, row in enumerate(rows):
            issues = self._validate_row(row, i + 2)  # +2 for header + 1-indexed
            if issues:
                validation_errors.extend(issues)
            else:
                valid_rows.append(row)

        if not valid_rows:
            return {
                "total": len(rows),
                "imported": 0,
                "errors": parse_errors + validation_errors,
                "batch_id": batch_id,
            }

        # 3. Classify batch
        batch_result = await classification_agent.classify_batch(
            conn, valid_rows, zone_id
        )

        # 4. Create drafts for each classified item
        drafts_created = 0
        for item in batch_result.results:
            try:
                company_data = item.get("company_data", {})
                classification_data = item.get("classification", {})

                from app.modules.companies.models.classification import ClassificationResult
                classification = ClassificationResult(**classification_data)

                await classification_agent.create_draft(
                    conn,
                    company_data=company_data,
                    classification=classification,
                    source_type="csv",
                    batch_id=batch_id,
                    created_by=user_id,
                )
                drafts_created += 1
            except Exception as e:
                validation_errors.append(f"Draft creation error: {e}")
                logger.error(f"CSV import draft creation failed: {e}")

        logger.info(
            f"CSV import complete: {drafts_created}/{len(valid_rows)} drafts created "
            f"(batch={batch_id}, auto_approved={batch_result.auto_approved})"
        )

        return {
            "total": len(rows),
            "imported": drafts_created,
            "auto_approved": batch_result.auto_approved,
            "pending_review": batch_result.pending_review,
            "classification_errors": batch_result.errors,
            "validation_errors": validation_errors,
            "parse_errors": parse_errors,
            "batch_id": batch_id,
        }

    def _parse_csv(
        self, file_content: bytes
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """Parse CSV content into list of dicts.

        Handles encoding detection (UTF-8 with BOM, Latin-1 fallback).
        Returns (rows, errors).
        """
        errors = []
        text = None

        # Try UTF-8 (with BOM), then Latin-1
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                text = file_content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            return [], ["Cannot decode CSV file (tried UTF-8, Latin-1)"]

        # Detect delimiter (comma, semicolon, tab)
        first_line = text.split("\n")[0] if text else ""
        delimiter = ","
        if first_line.count(";") > first_line.count(","):
            delimiter = ";"
        elif first_line.count("\t") > first_line.count(","):
            delimiter = "\t"

        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        if not reader.fieldnames:
            return [], ["CSV has no header row"]

        # Map column aliases
        field_map = {}
        for col in reader.fieldnames:
            clean = col.strip().lower().replace(" ", "_")
            mapped = COLUMN_ALIASES.get(clean, clean)
            field_map[col] = mapped

        # Check required columns
        mapped_cols = set(field_map.values())
        missing = REQUIRED_COLUMNS - mapped_cols
        if missing:
            return [], [f"Missing required columns: {', '.join(missing)}"]

        rows = []
        for i, raw_row in enumerate(reader):
            try:
                row = {}
                row_has_error = False
                for orig_col, mapped_col in field_map.items():
                    val = (raw_row.get(orig_col) or "").strip()
                    if val:
                        # Type coercion for known numeric fields
                        if mapped_col == "capital_social":
                            val = val.replace(".", "").replace(",", ".").replace(" ", "")
                            try:
                                row[mapped_col] = float(val)
                            except ValueError:
                                errors.append(f"Row {i + 2}: invalid capital_social '{val}'")
                                row_has_error = True
                                break
                        elif mapped_col == "employee_count":
                            try:
                                row[mapped_col] = int(val)
                            except ValueError:
                                errors.append(f"Row {i + 2}: invalid employee_count '{val}'")
                                row_has_error = True
                                break
                        else:
                            row[mapped_col] = val

                if row_has_error:
                    continue

                if row.get("legal_name"):
                    rows.append(row)
                else:
                    errors.append(f"Row {i + 2}: missing legal_name")

            except Exception as e:
                errors.append(f"Row {i + 2}: parse error: {e}")

        return rows, errors

    def _validate_row(self, row: Dict[str, Any], row_num: int) -> List[str]:
        """Validate a single row. Returns list of error messages (empty if valid)."""
        issues = []

        legal_name = row.get("legal_name", "")
        if len(legal_name) < 2:
            issues.append(f"Row {row_num}: legal_name too short ('{legal_name}')")

        forma = (row.get("forma_juridica") or "").lower().strip()
        if not forma:
            issues.append(f"Row {row_num}: missing forma_juridica")

        # NIF format check (if provided)
        nif = row.get("nif", "")
        if nif and len(nif) < 5:
            issues.append(f"Row {row_num}: NIF too short ('{nif}')")

        return issues


# ── Module-level singleton ────────────────────────────────────────────────────

csv_import_service = CSVImportService()
