#!/usr/bin/env python3
"""Liste le contenu du bucket Firebase Storage"""
import sys
from google.cloud import storage

BUCKET_NAME = "taxasge-dev.firebasestorage.app"

try:
    # Utilise les credentials par défaut de gcloud
    client = storage.Client(project="taxasge-dev")
    bucket = client.bucket(BUCKET_NAME)

    print(f"=== Contenu de gs://{BUCKET_NAME}/ ===\n")

    # Liste tous les fichiers
    blobs = list(bucket.list_blobs())

    if not blobs:
        print("Bucket VIDE")
        sys.exit(0)

    # Grouper par dossier racine
    folders = {}
    for blob in blobs:
        parts = blob.name.split('/')
        root = parts[0] if len(parts) > 1 else "<root>"
        if root not in folders:
            folders[root] = []
        folders[root].append(blob.name)

    # Afficher
    for folder, files in sorted(folders.items()):
        print(f"\n{folder}/ ({len(files)} fichiers)")
        for f in files[:3]:  # Afficher 3 premiers fichiers
            print(f"  - {f}")
        if len(files) > 3:
            print(f"  ... et {len(files)-3} autres fichiers")

    print(f"\n=== Total: {len(blobs)} fichiers dans {len(folders)} dossiers ===")

except Exception as e:
    print(f"ERREUR: {e}")
    sys.exit(1)
