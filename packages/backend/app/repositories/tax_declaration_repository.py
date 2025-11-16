"""
Tax Declaration Repository
Handles database operations for tax declarations (IVA, IRPF, Pétrolifères, etc.)
Uses Phase 2 template-based extraction architecture
"""

from typing import Optional, Dict, Any
from uuid import UUID
import json
from loguru import logger

from app.database.connection import get_database
from app.services.firebase_storage_service import firebase_storage_service
from app.services.ocr_service import ocr_service
from app.core.documents.extractors.template_loader import template_loader


class TaxDeclarationRepository:
    """Repository for tax declaration operations"""

    def __init__(self):
        self.db_manager = None

    async def process_uploaded_declaration_document(
        self,
        declaration_id: str,
        document_file_path: str,
        declaration_type: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Process uploaded tax declaration document using Phase 2 template-based extraction

        Pipeline: Download → OCR → Extract → Map → Save

        Args:
            declaration_id: UUID of the tax declaration record
            document_file_path: Firebase Storage path to document
            declaration_type: Type of declaration (iva_real, irpf, etc.)
            user_id: User ID who uploaded the document

        Returns:
            Dict with processing results including declaration_data_id
        """
        try:
            logger.info(f"Processing declaration document: {declaration_type} for user {user_id}")

            # Step 1: Download from Firebase Storage
            download_result = await firebase_storage_service.download_file(
                file_path=document_file_path,
                user_id=user_id
            )

            if not download_result.success:
                raise Exception(f"Failed to download file: {download_result.error}")

            # Step 2: OCR Extraction
            ocr_result = await ocr_service.extract_text(
                file_content=download_result.content,
                file_type=download_result.mime_type,
                language="spa",  # Spanish for Guinea fiscal forms
                document_type=declaration_type
            )

            if not ocr_result.success:
                raise Exception(f"OCR failed: {ocr_result.errors}")

            # Step 3: Load Template
            template = template_loader.load(
                template_name=declaration_type,
                template_type="declaration"  # CRITICAL: Use "declaration" template type
            )

            if not template:
                raise Exception(f"Template not found: {declaration_type}")

            # Step 4: Extract using TemplateBasedExtractor
            from app.core.documents.extractors.declarations import TemplateBasedExtractor

            extractor = TemplateBasedExtractor(template)
            extraction_result = await extractor.extract(
                ocr_text=ocr_result.text,
                metadata={
                    "ocr_confidence": ocr_result.confidence,
                    "ocr_provider": ocr_result.provider
                }
            )

            if not extraction_result.success:
                raise Exception(f"Extraction failed: {extraction_result.errors}")

            # Step 5: Map to database using DeclarationDatabaseMapper
            from app.core.documents.extractors.declarations import DeclarationDatabaseMapper

            mapper = DeclarationDatabaseMapper(declaration_type)
            mapped_data = mapper.map_to_database(
                extraction_result=extraction_result,
                user_id=UUID(user_id),
                declaration_id=UUID(declaration_id)
            )

            # Step 6: Determine target table and save
            db_table = mapped_data.pop("db_table")  # Remove meta field
            record_id = mapped_data.pop("id")  # Extract UUID

            # Build INSERT query based on table
            if db_table == "declaration_iva_data":
                insert_query = self._build_iva_insert_query()
            elif db_table == "declaration_irpf_data":
                insert_query = self._build_irpf_insert_query()
            elif db_table == "declaration_petroliferos_data":
                insert_query = self._build_petroliferos_insert_query()
            elif db_table == "declaration_other_data":
                insert_query = self._build_other_insert_query()
            else:
                raise Exception(f"Unknown declaration table: {db_table}")

            # Execute INSERT
            async with get_database() as db:
                # Convert mapped_data to list of values in correct order
                values = self._prepare_insert_values(db_table, mapped_data)

                result = await db.execute(insert_query, *values)

            logger.info(f"Declaration data saved to {db_table}: {record_id}")

            return {
                "success": True,
                "declaration_data_id": str(record_id),
                "db_table": db_table,
                "extraction_confidence": extraction_result.confidence,
                "fields_extracted": len(extraction_result.data),
                "warnings": extraction_result.warnings,
                "metadata": {
                    "ocr_confidence": ocr_result.confidence,
                    "ocr_provider": ocr_result.provider,
                    "template_used": declaration_type,
                    "processing_pipeline": "Phase 2 Template-Based"
                }
            }

        except Exception as e:
            logger.error(f"Failed to process declaration document: {e}")
            return {
                "success": False,
                "error": str(e),
                "declaration_data_id": None
            }

    def _build_iva_insert_query(self) -> str:
        """Build INSERT query for declaration_iva_data"""
        return """
            INSERT INTO declaration_iva_data (
                id, user_id, declaration_id,
                periodo_fiscal, ejercicio, numero_formulario,
                nif_contribuyente, razon_social,
                base_imponible_15, cuota_15,
                base_imponible_10, cuota_10,
                base_imponible_6, cuota_6,
                total_iva_devengado, total_iva_deducible,
                total_a_pagar, total_a_favor,
                additional_data, review_notes, status,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23
            )
            RETURNING id
        """

    def _build_irpf_insert_query(self) -> str:
        """Build INSERT query for declaration_irpf_data"""
        return """
            INSERT INTO declaration_irpf_data (
                id, user_id, declaration_id,
                periodo_fiscal, ejercicio, numero_formulario,
                nif_contribuyente, razon_social,
                base_retencion, tasa_retencion, total_retenido,
                additional_data, review_notes, status,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15, $16
            )
            RETURNING id
        """

    def _build_petroliferos_insert_query(self) -> str:
        """Build INSERT query for declaration_petroliferos_data"""
        return """
            INSERT INTO declaration_petroliferos_data (
                id, user_id, declaration_id,
                periodo_fiscal, ejercicio, numero_formulario,
                nif_contribuyente, razon_social,
                volumen_petroleo, precio_unitario, total_importe,
                additional_data, review_notes, status,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15, $16
            )
            RETURNING id
        """

    def _build_other_insert_query(self) -> str:
        """Build INSERT query for declaration_other_data (generic JSONB)"""
        return """
            INSERT INTO declaration_other_data (
                id, user_id, declaration_id,
                declaration_type, periodo_fiscal, ejercicio,
                extracted_fields, additional_data,
                review_notes, status,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING id
        """

    def _prepare_insert_values(self, db_table: str, mapped_data: Dict) -> list:
        """
        Prepare values for INSERT query in correct order

        Args:
            db_table: Target database table
            mapped_data: Mapped data from DeclarationDatabaseMapper

        Returns:
            List of values in correct order for INSERT
        """
        # Common fields
        values = [
            mapped_data["id"],
            mapped_data["user_id"],
            mapped_data["declaration_id"]
        ]

        if db_table == "declaration_iva_data":
            values.extend([
                mapped_data.get("periodo_fiscal"),
                mapped_data.get("ejercicio"),
                mapped_data.get("numero_formulario"),
                mapped_data.get("nif_contribuyente"),
                mapped_data.get("razon_social"),
                mapped_data.get("base_imponible_15"),
                mapped_data.get("cuota_15"),
                mapped_data.get("base_imponible_10"),
                mapped_data.get("cuota_10"),
                mapped_data.get("base_imponible_6"),
                mapped_data.get("cuota_6"),
                mapped_data.get("total_iva_devengado"),
                mapped_data.get("total_iva_deducible"),
                mapped_data.get("total_a_pagar"),
                mapped_data.get("total_a_favor"),
                json.dumps(mapped_data.get("additional_data", {})),
                mapped_data.get("review_notes"),
                mapped_data.get("status", "pending"),
                mapped_data.get("created_at"),
                mapped_data.get("updated_at")
            ])

        elif db_table == "declaration_irpf_data":
            values.extend([
                mapped_data.get("periodo_fiscal"),
                mapped_data.get("ejercicio"),
                mapped_data.get("numero_formulario"),
                mapped_data.get("nif_contribuyente"),
                mapped_data.get("razon_social"),
                mapped_data.get("base_retencion"),
                mapped_data.get("tasa_retencion"),
                mapped_data.get("total_retenido"),
                json.dumps(mapped_data.get("additional_data", {})),
                mapped_data.get("review_notes"),
                mapped_data.get("status", "pending"),
                mapped_data.get("created_at"),
                mapped_data.get("updated_at")
            ])

        elif db_table == "declaration_petroliferos_data":
            values.extend([
                mapped_data.get("periodo_fiscal"),
                mapped_data.get("ejercicio"),
                mapped_data.get("numero_formulario"),
                mapped_data.get("nif_contribuyente"),
                mapped_data.get("razon_social"),
                mapped_data.get("volumen_petroleo"),
                mapped_data.get("precio_unitario"),
                mapped_data.get("total_importe"),
                json.dumps(mapped_data.get("additional_data", {})),
                mapped_data.get("review_notes"),
                mapped_data.get("status", "pending"),
                mapped_data.get("created_at"),
                mapped_data.get("updated_at")
            ])

        elif db_table == "declaration_other_data":
            values.extend([
                mapped_data.get("declaration_type"),
                mapped_data.get("periodo_fiscal"),
                mapped_data.get("ejercicio"),
                json.dumps(mapped_data.get("extracted_fields", {})),
                json.dumps(mapped_data.get("additional_data", {})),
                mapped_data.get("review_notes"),
                mapped_data.get("status", "pending"),
                mapped_data.get("created_at"),
                mapped_data.get("updated_at")
            ])

        return values


# Singleton instance
tax_declaration_repository = TaxDeclarationRepository()
