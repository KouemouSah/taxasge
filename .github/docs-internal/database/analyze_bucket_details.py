#!/usr/bin/env python3
"""Analyse détaillée du contenu bucket avant migration"""
import subprocess
import sys

GCLOUD_PATH = r"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
BUCKET_NAME = "taxasge-dev.firebasestorage.app"

def run_gcloud(args):
    """Execute gcloud command"""
    try:
        cmd = [GCLOUD_PATH] + args
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8')
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def analyze_folder(folder_path):
    """Analyse détaillée d'un dossier"""
    print(f"\nAnalyzing: gs://{BUCKET_NAME}/{folder_path}")
    print("-" * 80)

    # Liste récursive
    result = run_gcloud(["storage", "ls", "-r", f"gs://{BUCKET_NAME}/{folder_path}"])

    if not result:
        print(f"  EMPTY or ERROR")
        return 0

    lines = [l.strip() for l in result.split('\n') if l.strip() and not l.endswith(':')]

    # Filtrer seulement les fichiers (pas les dossiers)
    files = [l for l in lines if not l.endswith('/')]

    print(f"  Total files: {len(files)}")

    if files:
        print(f"  Files:")
        for f in files[:10]:  # Afficher max 10 fichiers
            filename = f.split('/')[-1]
            print(f"    - {filename}")
        if len(files) > 10:
            print(f"    ... and {len(files) - 10} more files")

    return len(files)

print("="*80)
print("DETAILED BUCKET ANALYSIS - CRITICAL REVIEW")
print("="*80)

# Analyser chaque dossier déprécié
folders_to_check = ["app-assets/", "tax-attachments/", "user-documents/"]

total_files = {}
for folder in folders_to_check:
    count = analyze_folder(folder)
    total_files[folder] = count

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

for folder, count in total_files.items():
    status = "NEEDS MIGRATION" if folder in ["app-assets/", "tax-attachments/"] else "OK"
    print(f"{folder:25s} {count:5d} files - {status}")

print("\n" + "="*80)
print("NEXT STEPS:")
print("="*80)
print("1. Migrate app-assets/ -> system-assets/ ({} files)".format(total_files.get("app-assets/", 0)))
print("2. Migrate tax-attachments/ -> application-attachments/ ({} files)".format(total_files.get("tax-attachments/", 0)))
print("3. Verify user-documents/ structure ({}files)".format(total_files.get("user-documents/", 0)))
print("4. Create placeholder files in 8 missing folders")
print("="*80)
