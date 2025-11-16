#!/usr/bin/env python3
"""
Création structure finale Firebase Storage
Conforme à storage.rules - 11 dossiers
"""
import subprocess
import sys
import os
import tempfile

GCLOUD_PATH = r"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
BUCKET_NAME = "taxasge-dev.firebasestorage.app"

# Structure FINALE définie dans storage.rules
FOLDERS_STRUCTURE = {
    "user-documents": {
        "description": "Documents utilisateurs liés aux déclarations",
        "path_example": "user-documents/{userId}/{applicationId}/{fileName}",
        "placeholder_path": "user-documents/_placeholder/.keep"
    },
    "profile-pictures": {
        "description": "Photos de profil utilisateurs",
        "path_example": "profile-pictures/{userId}/{fileName}",
        "placeholder_path": "profile-pictures/_placeholder/.keep"
    },
    "official-documents": {
        "description": "Documents officiels et formulaires (lecture seule users)",
        "path_example": "official-documents/{category}/{fileName}",
        "placeholder_path": "official-documents/_placeholder/.keep"
    },
    "tax-forms": {
        "description": "Templates formulaires fiscaux",
        "path_example": "tax-forms/{formId}/{fileName}",
        "placeholder_path": "tax-forms/_placeholder/.keep"
    },
    "application-attachments": {
        "description": "Pièces jointes déclarations fiscales",
        "path_example": "application-attachments/{applicationId}/{fileName}",
        "placeholder_path": "application-attachments/_placeholder/.keep"
    },
    "system-assets": {
        "description": "Assets système (logos, templates, banners)",
        "path_example": "system-assets/{assetType}/{fileName}",
        "placeholder_path": "system-assets/_placeholder/.keep"
    },
    "backups": {
        "description": "Backups - admin only",
        "path_example": "backups/{backupId}/{fileName}",
        "placeholder_path": "backups/_placeholder/.keep"
    },
    "temp-uploads": {
        "description": "Uploads temporaires (auto-suppression 15min)",
        "path_example": "temp-uploads/{userId}/{sessionId}/{fileName}",
        "placeholder_path": "temp-uploads/_placeholder/.keep"
    },
    "reports": {
        "description": "Rapports et exports analytics - officials only",
        "path_example": "reports/{reportType}/{fileName}",
        "placeholder_path": "reports/_placeholder/.keep"
    },
    "audit-documents": {
        "description": "Documents audit - admin only",
        "path_example": "audit-documents/{year}/{month}/{fileName}",
        "placeholder_path": "audit-documents/_placeholder/.keep"
    },
    "notification-attachments": {
        "description": "Pièces jointes notifications",
        "path_example": "notification-attachments/{notificationId}/{fileName}",
        "placeholder_path": "notification-attachments/_placeholder/.keep"
    }
}

def run_gcloud(args):
    """Execute gcloud command"""
    try:
        cmd = [GCLOUD_PATH] + args
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8')

        if result.returncode != 0:
            print(f"  ERROR: {result.stderr}")
            return False

        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def create_placeholder_file(folder_name, description):
    """Crée un fichier .keep local temporaire"""
    content = f"""# {folder_name}/

{description}

Structure: Voir storage.rules
Ce fichier .keep est créé pour initialiser le dossier dans Firebase Storage.

Date création: 2025-11-15
"""
    return content

def main():
    print("="*80)
    print("CREATION STRUCTURE FIREBASE STORAGE FINALE")
    print("="*80)
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Folders to create: {len(FOLDERS_STRUCTURE)}")
    print("="*80)

    # Créer temp directory pour les placeholders
    temp_dir = tempfile.mkdtemp()
    print(f"\nUsing temp directory: {temp_dir}")

    created_count = 0
    failed_count = 0

    for folder_name, config in FOLDERS_STRUCTURE.items():
        print(f"\n[{created_count + failed_count + 1}/{len(FOLDERS_STRUCTURE)}] Creating: {folder_name}/")
        print(f"    Description: {config['description']}")
        print(f"    Path example: {config['path_example']}")

        # Créer fichier .keep local
        placeholder_content = create_placeholder_file(folder_name, config['description'])
        local_file = os.path.join(temp_dir, f"{folder_name}_keep.txt")

        try:
            with open(local_file, 'w', encoding='utf-8') as f:
                f.write(placeholder_content)

            # Upload vers Firebase Storage
            remote_path = f"gs://{BUCKET_NAME}/{config['placeholder_path']}"
            print(f"    Uploading .keep to: {remote_path}")

            success = run_gcloud([
                "storage", "cp",
                local_file,
                remote_path
            ])

            if success:
                print(f"    OK Created {folder_name}/")
                created_count += 1
            else:
                print(f"    FAILED to create {folder_name}/")
                failed_count += 1

        except Exception as e:
            print(f"    ERROR: {e}")
            failed_count += 1

    # Cleanup temp files
    try:
        import shutil
        shutil.rmtree(temp_dir)
    except:
        pass

    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total folders: {len(FOLDERS_STRUCTURE)}")
    print(f"Created successfully: {created_count}")
    print(f"Failed: {failed_count}")

    if created_count == len(FOLDERS_STRUCTURE):
        print("\nOK Structure Firebase Storage créée avec succès!")
    else:
        print(f"\nWARNING {failed_count} folders failed to create")

    print("="*80)

    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
