#!/usr/bin/env python3
"""
Migration Script - Firebase Storage Bucket Restructuring
Renomme les dossiers pour aligner avec storage.rules

Author: Claude Code
Date: 2025-11-15
Version: 1.0
"""

import os
import sys
import io
import json
from google.cloud import storage
from google.cloud.exceptions import NotFound, GoogleCloudError
from datetime import datetime

# UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Configuration
BUCKET_NAME = "taxasge-dev.firebasestorage.app"
DRY_RUN = True  # Set to False to actually execute migrations

# Migrations à effectuer
MIGRATIONS = [
    {
        "from": "app-assets/",
        "to": "system-assets/",
        "description": "Renommer app-assets → system-assets (conforme storage.rules ligne 134)"
    },
    {
        "from": "tax-attachments/",
        "to": "application-attachments/",
        "description": "Renommer tax-attachments → application-attachments (conforme storage.rules ligne 117)"
    }
]


def initialize_client():
    """Initialize Google Cloud Storage client"""
    try:
        # Try to load service account from environment
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV")

        if service_account_json:
            service_account_info = json.loads(service_account_json)
            client = storage.Client.from_service_account_info(service_account_info)
            print("OK Client initialized from service account")
        else:
            # Use default credentials
            client = storage.Client()
            print("OK Client initialized with default credentials")

        return client

    except Exception as e:
        print(f"ERROR Failed to initialize client: {e}")
        return None


def list_files(bucket, prefix):
    """List all files with given prefix"""
    try:
        blobs = list(bucket.list_blobs(prefix=prefix))
        return blobs
    except Exception as e:
        print(f"ERROR Failed to list files with prefix '{prefix}': {e}")
        return []


def rename_blob(bucket, old_name, new_name, dry_run=True):
    """Rename a blob (copy + delete)"""
    try:
        if dry_run:
            print(f"   [DRY RUN] Would rename: {old_name} → {new_name}")
            return True

        # Get source blob
        source_blob = bucket.blob(old_name)

        # Check if exists
        if not source_blob.exists():
            print(f"   WARNING Source blob not found: {old_name}")
            return False

        # Copy to new location
        new_blob = bucket.copy_blob(source_blob, bucket, new_name)

        # Copy metadata
        if source_blob.metadata:
            new_blob.metadata = source_blob.metadata
            new_blob.patch()

        # Delete original
        source_blob.delete()

        print(f"   OK Renamed: {old_name} → {new_name}")
        return True

    except Exception as e:
        print(f"   ERROR Failed to rename {old_name}: {e}")
        return False


def migrate_folder(bucket, from_prefix, to_prefix, dry_run=True):
    """Migrate all files from one folder to another"""
    print(f"\n{'=' * 80}")
    print(f"Migrating: {from_prefix} → {to_prefix}")
    print(f"{'=' * 80}")

    # List all files in source folder
    blobs = list_files(bucket, from_prefix)

    if not blobs:
        print(f"   WARNING No files found in {from_prefix}")
        return 0

    print(f"   Found {len(blobs)} files to migrate")

    success_count = 0
    error_count = 0

    for blob in blobs:
        old_name = blob.name
        new_name = old_name.replace(from_prefix, to_prefix, 1)

        if rename_blob(bucket, old_name, new_name, dry_run=dry_run):
            success_count += 1
        else:
            error_count += 1

    print(f"\n   Summary:")
    print(f"   - Total files: {len(blobs)}")
    print(f"   - Success: {success_count}")
    print(f"   - Errors: {error_count}")

    return success_count


def verify_user_documents_structure(bucket):
    """Verify user-documents/ structure is correct"""
    print(f"\n{'=' * 80}")
    print("Verifying user-documents/ structure")
    print(f"{'=' * 80}")

    blobs = list_files(bucket, "user-documents/")

    if not blobs:
        print("   OK user-documents/ is empty (nothing to verify)")
        return True

    print(f"   Found {len(blobs)} files in user-documents/")

    # Expected pattern: user-documents/{userId}/{applicationId}/{fileName}
    incorrect_files = []

    for blob in blobs:
        parts = blob.name.split('/')

        # Expected: ['user-documents', userId, applicationId, fileName]
        if len(parts) != 4:
            incorrect_files.append(blob.name)

    if incorrect_files:
        print(f"\n   WARNING {len(incorrect_files)} files with incorrect structure:")
        for file in incorrect_files[:10]:  # Show first 10
            print(f"   - {file}")

        if len(incorrect_files) > 10:
            print(f"   ... and {len(incorrect_files) - 10} more")

        print(f"\n   ACTION REQUIRED: Manual migration needed for user-documents/")
        return False
    else:
        print(f"   OK All {len(blobs)} files have correct structure")
        return True


def main():
    print("=" * 80)
    print("FIREBASE STORAGE BUCKET MIGRATION")
    print("=" * 80)
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Mode: {'DRY RUN (no changes)' if DRY_RUN else 'LIVE (will modify bucket)'}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # Initialize client
    client = initialize_client()
    if not client:
        return 1

    # Get bucket
    try:
        bucket = client.bucket(BUCKET_NAME)
        bucket.reload()  # Test access
        print(f"\nOK Bucket access verified: {BUCKET_NAME}")
    except NotFound:
        print(f"\nERROR Bucket not found: {BUCKET_NAME}")
        return 1
    except Exception as e:
        print(f"\nERROR Failed to access bucket: {e}")
        return 1

    # Execute migrations
    total_migrated = 0

    for migration in MIGRATIONS:
        from_prefix = migration["from"]
        to_prefix = migration["to"]
        description = migration["description"]

        print(f"\n{description}")

        count = migrate_folder(bucket, from_prefix, to_prefix, dry_run=DRY_RUN)
        total_migrated += count

    # Verify user-documents structure
    user_docs_ok = verify_user_documents_structure(bucket)

    # Summary
    print("\n" + "=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)
    print(f"Total files migrated: {total_migrated}")
    print(f"user-documents/ structure: {'OK' if user_docs_ok else 'NEEDS MANUAL MIGRATION'}")

    if DRY_RUN:
        print("\nWARNING This was a DRY RUN - no changes were made")
        print("Set DRY_RUN = False in the script to execute migrations")
    else:
        print("\nOK Migrations completed successfully")

    print("=" * 80)

    return 0 if user_docs_ok else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nMigration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
