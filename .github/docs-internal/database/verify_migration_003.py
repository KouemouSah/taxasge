#!/usr/bin/env python3
"""Verify Migration 003 was successful"""
import psycopg2

DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

EXPECTED_COLUMNS = [
    'original_filename', 'file_url', 'file_hash', 'document_type',
    'document_subtype', 'description', 'processing_mode',
    'ocr_text', 'ocr_confidence', 'ocr_provider',
    'extraction_status', 'extracted_data', 'extraction_confidence', 'form_mapping',
    'processing_started_at', 'processing_completed_at', 'processing_duration_ms',
    'access_level', 'validation_status', 'related_to_type', 'related_to_id', 'updated_at'
]

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Get all columns
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'uploaded_files'
        ORDER BY ordinal_position;
    """)
    all_columns = cursor.fetchall()

    print(f"Total columns in uploaded_files: {len(all_columns)}")
    print("\nAll columns:")
    for col in all_columns:
        print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")

    # Check expected columns
    existing_col_names = [col[0] for col in all_columns]
    missing = [col for col in EXPECTED_COLUMNS if col not in existing_col_names]
    found = [col for col in EXPECTED_COLUMNS if col in existing_col_names]

    print(f"\n{'='*60}")
    print(f"Migration 003 Verification:")
    print(f"  Expected new columns: {len(EXPECTED_COLUMNS)}")
    print(f"  Found: {len(found)}")
    print(f"  Missing: {len(missing)}")

    if missing:
        print(f"\nMissing columns:")
        for col in missing:
            print(f"  - {col}")
        print("\n[FAIL] Migration incomplete")
    else:
        print(f"\n[SUCCESS] All 22 columns successfully added!")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
