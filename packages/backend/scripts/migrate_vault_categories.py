"""
One-shot script to update document categories and workflow tags
for documents migrated from service_request_documents.

Run after migration 288:
    python scripts/migrate_vault_categories.py

This script:
1. Finds all wizard_import documents with category='other'
2. Maps document_type -> proper category (same map as GeminiDocumentProcessor)
3. Creates workflow tags from workflow_document_requirements
"""
import asyncio
import os
import sys

import asyncpg

# Database URL — read from environment or fallback
DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres",
)

# Category map (aligned with GeminiDocumentProcessor classification)
DOCUMENT_CATEGORY_MAP = {
    # Identity documents
    "dip": "identity",
    "dip_gq": "identity",
    "pasaporte": "identity",
    "pasaporte_antiguo": "identity",
    "pasaporte_danado": "identity",
    "pasaporte_entrada": "identity",
    "permiso_residencia": "identity",
    "certificado_nacimiento": "identity",
    "certificacion_nacimiento": "identity",
    "carnet_funcionario": "identity",
    # Photos
    "photo_carnet": "photo",
    "foto_carnet": "photo",
    "foto_biometrica": "photo",
    # Medical
    "certificado_medico": "medical",
    # Legal
    "denuncia_policial": "legal",
    "contrato": "legal",
    # Employment
    "contrato_trabajo": "employment",
    # Vehicle
    "certificado_conducir": "vehicle",
    "licencia_conducir": "vehicle",
    "permiso_conducir": "vehicle",
    "permiso_actual": "vehicle",
    "certificado_actual": "vehicle",
    "certificado_reconocimiento_vehiculo": "vehicle",
    # Financial
    "nota_ingreso": "financial",
    "certificado_nif": "financial",
    "solvencia_tributaria": "financial",
    # Administrative
    "sello_entrada": "administrative",
    "autorizacion_trabajo": "administrative",
    "certificado_empadronamiento": "administrative",
}


async def main():
    print(f"Connecting to database...")
    conn = await asyncpg.connect(DB_URL, ssl="require")

    try:
        # Get all migrated docs without proper category
        docs = await conn.fetch("""
            SELECT id, document_type, source_request_id
            FROM user_documents
            WHERE source = 'wizard_import' AND document_category = 'other'
        """)

        print(f"Found {len(docs)} documents to categorize")

        if not docs:
            print("Nothing to do.")
            return

        categorized = 0
        tagged = 0

        for doc in docs:
            doc_type = doc["document_type"]
            doc_type_lower = (doc_type or "").lower().strip()
            category = DOCUMENT_CATEGORY_MAP.get(doc_type_lower, "other")

            # Update category
            await conn.execute("""
                UPDATE user_documents SET document_category = $2, updated_at = NOW()
                WHERE id = $1
            """, doc["id"], category)

            if category != "other":
                categorized += 1

            # Create workflow tags from workflow_document_requirements
            tags = await conn.fetch("""
                SELECT DISTINCT workflow_code, document_code
                FROM workflow_document_requirements
                WHERE is_active = TRUE AND document_code = $1
            """, doc_type)

            for tag in tags:
                await conn.execute("""
                    INSERT INTO user_document_workflow_tags
                        (user_document_id, workflow_code, document_code, is_auto_tagged, relevance_score)
                    VALUES ($1, $2, $3, TRUE, 1.0)
                    ON CONFLICT (user_document_id, workflow_code, document_code) DO NOTHING
                """, doc["id"], tag["workflow_code"], tag["document_code"])
                tagged += 1

            tag_count = len(tags)
            print(f"  {doc_type:30s} -> {category:15s} ({tag_count} workflow tags)")

        print(f"\nDone. {len(docs)} documents processed:")
        print(f"  - {categorized} categorized (non-'other')")
        print(f"  - {len(docs) - categorized} remain as 'other' (unknown type)")
        print(f"  - {tagged} workflow tags created")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
