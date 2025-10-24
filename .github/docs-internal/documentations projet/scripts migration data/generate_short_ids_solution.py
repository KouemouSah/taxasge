#!/usr/bin/env python3
"""
SOLUTION: Générer IDs courts pour required_documents
Format: RD-XXXXX (max 8 chars) compatible VARCHAR(10)
Stratégie: Pas de modification schéma, update des CSV
"""

import csv
import uuid
from pathlib import Path
from datetime import datetime

def generate_short_ids_mapping():
    """Génère un mapping UUID -> ID court pour required_documents"""
    print("GENERATION IDs COURTS POUR REQUIRED_DOCUMENTS")
    print("=" * 55)

    csv_dir = Path(__file__).parent / "csv_output"

    # Lire le fichier required_documents avec UUID
    docs_file = csv_dir / "required_documents.csv"
    with open(docs_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        docs = list(reader)
        fieldnames = reader.fieldnames

    print(f"Documents avec UUID: {len(docs)}")

    # Générer mapping UUID -> ID court
    uuid_to_short = {}
    short_to_uuid = {}

    for i, doc in enumerate(docs, 1):
        original_uuid = doc['id']
        short_id = f"RD-{i:05d}"  # RD-00001, RD-00002...

        uuid_to_short[original_uuid] = short_id
        short_to_uuid[short_id] = original_uuid

    print(f"IDs courts générés: {len(uuid_to_short)}")
    print(f"Format: RD-XXXXX (8 chars max)")
    print(f"Exemples: {list(uuid_to_short.values())[:5]}")

    return uuid_to_short, short_to_uuid, docs, fieldnames

def update_required_documents_csv(uuid_to_short, docs, fieldnames):
    """Met à jour required_documents.csv avec IDs courts"""
    print("\nMISE A JOUR REQUIRED_DOCUMENTS.CSV")
    print("=" * 40)

    csv_dir = Path(__file__).parent / "csv_output"

    # Backup original
    original_file = csv_dir / "required_documents.csv"
    backup_file = csv_dir / "required_documents.csv.backup-before-short-ids"

    import shutil
    shutil.copy2(original_file, backup_file)
    print(f"Backup créé: {backup_file.name}")

    # Générer nouveau CSV avec IDs courts
    updated_docs = []
    for doc in docs:
        new_doc = doc.copy()
        new_doc['id'] = uuid_to_short[doc['id']]  # Remplacer UUID par ID court
        updated_docs.append(new_doc)

    # Sauvegarder
    with open(original_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_docs)

    print(f"required_documents.csv mis à jour: {len(updated_docs)} documents")
    print("IDs remplacés: UUID (36 chars) -> RD-XXXXX (8 chars)")

    return updated_docs

def update_translations_documents_csv(uuid_to_short):
    """Met à jour translations_documents_only.csv avec IDs courts"""
    print("\nMISE A JOUR TRANSLATIONS_DOCUMENTS_ONLY.CSV")
    print("=" * 50)

    csv_dir = Path(__file__).parent / "csv_output"

    # Lire translations avec UUID
    translations_file = csv_dir / "translations_documents_only.csv"
    with open(translations_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        translations = list(reader)
        fieldnames = reader.fieldnames

    print(f"Translations avec UUID: {len(translations)}")

    # Backup original
    backup_file = csv_dir / "translations_documents_only.csv.backup-before-short-ids"
    import shutil
    shutil.copy2(translations_file, backup_file)
    print(f"Backup créé: {backup_file.name}")

    # Mettre à jour entity_id
    updated_translations = []
    mapping_errors = 0

    for trans in translations:
        new_trans = trans.copy()
        original_entity_id = trans['entity_id']

        if original_entity_id in uuid_to_short:
            new_trans['entity_id'] = uuid_to_short[original_entity_id]
            updated_translations.append(new_trans)
        else:
            print(f"ATTENTION: UUID non trouvé dans mapping: {original_entity_id[:20]}...")
            mapping_errors += 1

    # Sauvegarder
    with open(translations_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_translations)

    print(f"translations_documents_only.csv mis à jour: {len(updated_translations)} translations")
    print(f"entity_id remplacés: UUID -> RD-XXXXX")
    if mapping_errors > 0:
        print(f"ATTENTION: {mapping_errors} erreurs de mapping")

    return updated_translations

def validate_short_ids():
    """Valide que les IDs courts sont compatibles VARCHAR(10)"""
    print("\nVALIDATION COMPATIBILITE VARCHAR(10)")
    print("=" * 40)

    csv_dir = Path(__file__).parent / "csv_output"

    # Vérifier required_documents
    docs_file = csv_dir / "required_documents.csv"
    with open(docs_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        doc_ids = [row['id'] for row in reader]

    # Vérifier translations
    trans_file = csv_dir / "translations_documents_only.csv"
    with open(trans_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        entity_ids = [row['entity_id'] for row in reader]

    # Analyser longueurs
    doc_lengths = [len(id_val) for id_val in doc_ids]
    trans_lengths = [len(id_val) for id_val in entity_ids]

    print(f"required_documents.csv:")
    print(f"  Total IDs: {len(doc_ids)}")
    print(f"  Longueur max: {max(doc_lengths)} chars")
    print(f"  Longueur moy: {sum(doc_lengths)/len(doc_lengths):.1f} chars")
    print(f"  Exemples: {doc_ids[:3]}")

    print(f"\ntranslations_documents_only.csv:")
    print(f"  Total entity_ids: {len(entity_ids)}")
    print(f"  Longueur max: {max(trans_lengths)} chars")
    print(f"  Longueur moy: {sum(trans_lengths)/len(trans_lengths):.1f} chars")
    print(f"  Exemples: {entity_ids[:3]}")

    # Vérifier compatibilité
    max_length = max(max(doc_lengths), max(trans_lengths))
    is_compatible = max_length <= 10

    print(f"\nCOMPATIBILITE VARCHAR(10):")
    print(f"  Longueur maximum: {max_length} chars")
    print(f"  Status: {'COMPATIBLE' if is_compatible else 'INCOMPATIBLE'}")

    if is_compatible:
        print("  SUCCESS: Prêt pour import sans modification schéma!")
    else:
        print("  ERREUR: IDs encore trop longs")

    return is_compatible

def generate_import_instructions():
    """Génère les instructions d'import finales"""
    print("\n" + "=" * 50)
    print("INSTRUCTIONS IMPORT FINAL")
    print("=" * 50)

    print("FICHIERS PRÊTS POUR IMPORT:")
    print("1. required_documents.csv (avec IDs courts RD-XXXXX)")
    print("2. translations_documents_only.csv (avec entity_id courts)")
    print()
    print("ORDRE D'IMPORT SUPABASE:")
    print("1. Importer required_documents.csv")
    print("   - Aucune modification schéma nécessaire")
    print("   - IDs compatibles VARCHAR(10)")
    print("2. Importer translations_documents_only.csv")
    print("   - entity_id compatibles VARCHAR(10)")
    print("   - Jointures fonctionneront parfaitement")
    print()
    print("AVANTAGES DE CETTE SOLUTION:")
    print("+ Aucune modification schéma translations")
    print("+ Aucune suppression/recréation vue")
    print("+ Compatible avec pattern existant")
    print("+ Réversible (backups créés)")
    print("+ Import immédiat possible")
    print()
    print("REQUÊTE TEST POST-IMPORT:")
    print("SELECT rd.document_code, rd.document_name,")
    print("       t_fr.content as nom_fr, t_en.content as nom_en")
    print("FROM required_documents rd")
    print("LEFT JOIN translations t_fr ON (")
    print("    t_fr.entity_type = 'required_documents'")
    print("    AND t_fr.entity_id = rd.id")
    print("    AND t_fr.language_code = 'fr'")
    print(")")
    print("WHERE rd.fiscal_service_id = 'T-001' LIMIT 3;")

def main():
    print("SOLUTION IDs COURTS - ÉVITER MODIFICATION SCHÉMA")
    print("=" * 60)

    try:
        # 1. Générer mapping UUID -> ID court
        uuid_to_short, short_to_uuid, docs, fieldnames = generate_short_ids_mapping()

        # 2. Mettre à jour required_documents.csv
        updated_docs = update_required_documents_csv(uuid_to_short, docs, fieldnames)

        # 3. Mettre à jour translations_documents_only.csv
        updated_translations = update_translations_documents_csv(uuid_to_short)

        # 4. Valider compatibilité
        is_compatible = validate_short_ids()

        # 5. Instructions finales
        generate_import_instructions()

        print(f"\n" + "=" * 60)
        print("SUCCÈS - SOLUTION IDs COURTS APPLIQUÉE")
        print("=" * 60)
        print(f"Documents mis à jour: {len(updated_docs)}")
        print(f"Translations mises à jour: {len(updated_translations)}")
        print(f"Compatible VARCHAR(10): {'OUI' if is_compatible else 'NON'}")
        print("Backups créés pour sécurité")
        print("PRÊT POUR IMPORT SUPABASE!")

    except Exception as e:
        print(f"ERREUR: {e}")
        print("Vérifier les fichiers CSV et réessayer")

if __name__ == "__main__":
    main()