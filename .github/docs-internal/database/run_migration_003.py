#!/usr/bin/env python3
"""
Run Migration 003: Add Document Extraction Columns
Adds OCR and extraction columns to uploaded_files table
"""
import psycopg2
import sys
from pathlib import Path

# Supabase connection
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

def main():
    migration_file = Path(__file__).parent / "migrations" / "003_add_document_extraction_columns.sql"

    if not migration_file.exists():
        print(f"[ERROR] Migration file not found: {migration_file}")
        return 1

    try:
        print("=" * 80)
        print("MIGRATION 003: Add Document Extraction Columns")
        print("=" * 80)

        # Read migration SQL
        print(f"\n[1/4] Reading migration file: {migration_file.name}")
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print(f"[OK] Migration SQL loaded ({len(migration_sql)} characters)")

        # Connect to database
        print("\n[2/4] Connecting to Supabase database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("[OK] Connected successfully")

        # Check current state
        print("\n[3/4] Checking current uploaded_files schema...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'uploaded_files'
            ORDER BY ordinal_position;
        """)
        current_columns = cursor.fetchall()
        print(f"[OK] Current schema has {len(current_columns)} columns")

        # Show existing columns
        print("\nExisting columns:")
        for col in current_columns[:10]:  # Show first 10
            print(f"  - {col[0]}: {col[1]}")
        if len(current_columns) > 10:
            print(f"  ... and {len(current_columns) - 10} more")

        # Execute migration
        print("\n[4/4] Executing migration...")
        print("[INFO] This may take a few seconds...")

        cursor.execute(migration_sql)
        conn.commit()

        print("[OK] Migration executed successfully!")

        # Verify new columns
        print("\n[VERIFY] Checking new schema...")
        cursor.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'uploaded_files'
            AND column_name IN (
                'original_filename', 'file_url', 'file_hash', 'document_type',
                'document_subtype', 'description', 'processing_mode',
                'ocr_text', 'ocr_confidence', 'ocr_provider',
                'extraction_status', 'extracted_data', 'extraction_confidence', 'form_mapping',
                'processing_started_at', 'processing_completed_at', 'processing_duration_ms',
                'access_level', 'validation_status', 'related_to_type', 'related_to_id', 'updated_at'
            )
            ORDER BY column_name;
        """)
        new_columns = cursor.fetchall()

        print(f"\n[SUCCESS] Added {len(new_columns)} new columns:")
        for col in new_columns:
            print(f"  ✓ {col[0]}: {col[1]}")

        # Show statistics
        cursor.execute("SELECT COUNT(*) FROM uploaded_files;")
        total = cursor.fetchone()[0]
        print(f"\n[STATS] Total files in uploaded_files: {total}")

        # Check indexes
        cursor.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'uploaded_files'
            AND indexname LIKE 'idx_uploaded_files_%';
        """)
        indexes = cursor.fetchall()
        print(f"\n[INDEXES] Created {len(indexes)} performance indexes:")
        for idx in indexes:
            print(f"  ✓ {idx[0]}")

        cursor.close()
        conn.close()

        print("\n" + "=" * 80)
        print("MIGRATION 003 COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print("\nNext steps:")
        print("  1. Implement OCRService (Google Cloud Vision + Tesseract)")
        print("  2. Implement DocumentService (orchestration)")
        print("  3. Create API endpoints for document upload/extraction")
        print("\nDocumentRepository methods are now ready to use:")
        print("  - document_repository.update_ocr_results()")
        print("  - document_repository.update_extracted_data()")
        print("  - document_repository.update_extraction_failed()")
        print("=" * 80)

        return 0

    except psycopg2.Error as e:
        print(f"\n[ERROR] Database error: {e}")
        print(f"[ERROR] SQL State: {e.pgcode}")
        print(f"[ERROR] Details: {e.pgerror}")
        if conn:
            conn.rollback()
            conn.close()
        return 1
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
            conn.close()
        return 1

if __name__ == "__main__":
    sys.exit(main())
