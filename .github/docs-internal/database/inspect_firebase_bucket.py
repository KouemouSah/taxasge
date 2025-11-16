#!/usr/bin/env python3
"""
Inspection Firebase Storage via gcloud SDK
Utilise les commandes gcloud depuis le SDK Google Cloud
"""
import subprocess
import sys
import json

# Chemin vers gcloud SDK
GCLOUD_PATH = r"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
BUCKET_NAME = "taxasge-dev.firebasestorage.app"

def run_gcloud_command(args):
    """Execute gcloud command"""
    try:
        cmd = [GCLOUD_PATH] + args
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            shell=True,
            encoding='utf-8'
        )

        if result.returncode != 0:
            print(f"ERROR: {result.stderr}")
            return None

        return result.stdout.strip()
    except Exception as e:
        print(f"ERROR executing gcloud: {e}")
        return None

def main():
    print("="*80)
    print("FIREBASE STORAGE BUCKET INSPECTION")
    print("="*80)
    print(f"Bucket: {BUCKET_NAME}")
    print("="*80)

    # Test gcloud auth
    print("\n1. Verifying gcloud authentication...")
    auth_result = run_gcloud_command(["auth", "list"])
    if auth_result:
        print("OK Authenticated")
        if "kouemou.sah@gmail.com" in auth_result:
            print("   Account: kouemou.sah@gmail.com")

    # Test project
    print("\n2. Verifying project...")
    project_result = run_gcloud_command(["config", "get-value", "project"])
    if project_result:
        print(f"OK Project: {project_result}")

    # List bucket content
    print(f"\n3. Listing bucket content: gs://{BUCKET_NAME}/")
    print("-"*80)

    list_result = run_gcloud_command([
        "storage", "ls",
        f"gs://{BUCKET_NAME}/"
    ])

    if list_result:
        lines = list_result.split('\n')
        folders = {}

        for line in lines:
            if line.strip():
                # Extract folder name from gs://bucket/folder/
                if line.startswith(f"gs://{BUCKET_NAME}/"):
                    path = line.replace(f"gs://{BUCKET_NAME}/", "").rstrip('/')
                    folder = path.split('/')[0] if '/' in path else path
                    if folder not in folders:
                        folders[folder] = []
                    folders[folder].append(line)

        if not folders:
            print("WARNING: Bucket is EMPTY or no top-level folders")
        else:
            print(f"\nFound {len(folders)} top-level folders:\n")
            for folder in sorted(folders.keys()):
                print(f"  - {folder}/ ({len(folders[folder])} items)")

        # Check compliance with storage.rules
        print("\n" + "="*80)
        print("COMPLIANCE WITH storage.rules")
        print("="*80)

        expected = {
            "user-documents", "profile-pictures", "official-documents",
            "tax-forms", "application-attachments", "system-assets",
            "backups", "temp-uploads", "reports",
            "audit-documents", "notification-attachments"
        }

        deprecated = {
            "app-assets": "RENAME to system-assets",
            "tax-attachments": "RENAME to application-attachments"
        }

        print("\nCurrent folders:")
        for folder in sorted(folders.keys()):
            if folder in expected:
                print(f"  OK {folder}/")
            elif folder in deprecated:
                print(f"  DEPRECATED {folder}/ -> {deprecated[folder]}")
            else:
                print(f"  UNKNOWN {folder}/ (not in storage.rules)")

        print("\nMissing folders (defined in storage.rules):")
        missing = expected - set(folders.keys())
        for folder in sorted(missing):
            print(f"  MISSING {folder}/")

        # Migrations needed
        migrations = []
        for folder in folders.keys():
            if folder in deprecated:
                migrations.append(folder)

        if migrations:
            print(f"\nACTION REQUIRED: {len(migrations)} migrations needed")
            for folder in migrations:
                print(f"  - {folder}/ -> {deprecated[folder]}")
        else:
            print("\nOK No migrations needed")

    print("\n" + "="*80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
