#!/usr/bin/env python3
"""
Correction de service_procedures.csv
Supprime la colonne description_es qui n'existe pas dans le schéma
Les descriptions doivent aller dans translations
"""

import csv
from pathlib import Path

def fix_service_procedures_csv():
    print("CORRECTION service_procedures.csv")
    print("=" * 45)

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_procedures.csv"

    # Lire le CSV actuel
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        procedures = list(reader)
        original_fieldnames = reader.fieldnames

    print(f"Procédures à corriger: {len(procedures)}")
    print(f"Colonnes originales: {original_fieldnames}")

    # Nouvelles colonnes SANS description_es
    new_fieldnames = [
        'id',                              # VARCHAR(10) PRIMARY KEY
        'fiscal_service_id',               # VARCHAR(10) REFERENCES fiscal_services(id)
        'step_number',                     # INTEGER NOT NULL
        'applies_to',                      # VARCHAR(20) CHECK ('expedition', 'renewal', 'both')
        'estimated_duration_minutes',      # INTEGER
        'location_address',               # TEXT
        'office_hours',                   # VARCHAR(100)
        'requires_appointment',           # BOOLEAN DEFAULT false
        'can_be_done_online',            # BOOLEAN DEFAULT false
        'additional_cost',               # DECIMAL(12,2) DEFAULT 0
        'required_documents',            # VARCHAR(10)[]
        'created_at'                     # TIMESTAMPTZ DEFAULT NOW()
    ]

    # Backup
    backup_file = csv_dir / "service_procedures.csv.backup-with-description"
    import shutil
    shutil.copy2(csv_file, backup_file)
    print(f"Backup créé: {backup_file.name}")

    # Réécrire sans description_es
    descriptions_for_translations = []

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames)
        writer.writeheader()

        for proc in procedures:
            # Sauvegarder la description pour translations
            if proc.get('description_es'):
                descriptions_for_translations.append({
                    'entity_id': proc['id'],
                    'description': proc['description_es']
                })

            # Créer nouvelle ligne sans description_es
            new_row = {}
            for field in new_fieldnames:
                new_row[field] = proc.get(field, '')

            writer.writerow(new_row)

    print(f"CSV corrigé: {len(procedures)} procédures")
    print(f"Colonne description_es supprimée")
    print(f"Descriptions sauvegardées pour translations: {len(descriptions_for_translations)}")

    # Optionnel: Créer un CSV de translations pour les descriptions
    if descriptions_for_translations:
        trans_file = csv_dir / "service_procedures_descriptions_for_translations.csv"
        trans_fieldnames = ['id', 'entity_type', 'entity_id', 'language_code', 'field_name', 'content', 'is_primary', 'created_at', 'updated_at']

        from datetime import datetime
        current_time = datetime.utcnow().isoformat() + "Z"

        with open(trans_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=trans_fieldnames)
            writer.writeheader()

            for i, item in enumerate(descriptions_for_translations, 1):
                row = {
                    'id': f"ST-{i:05d}",  # Service Translation
                    'entity_type': 'service_procedure',
                    'entity_id': item['entity_id'],
                    'language_code': 'es',
                    'field_name': 'description',
                    'content': item['description'],
                    'is_primary': False,
                    'created_at': current_time,
                    'updated_at': current_time
                }
                writer.writerow(row)

        print(f"\nCréé: {trans_file.name}")
        print(f"Contient: {len(descriptions_for_translations)} descriptions")
        print("Peut être importé dans translations si nécessaire")

    return len(procedures)

def validate_csv():
    """Valide le CSV corrigé"""
    print("\nVALIDATION CSV CORRIGÉ")
    print("=" * 30)

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_procedures.csv"

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        procedures = list(reader)

    print(f"Colonnes finales: {fieldnames}")
    print(f"Total procédures: {len(procedures)}")

    # Vérifier qu'il n'y a plus de description_es
    if 'description_es' in fieldnames:
        print("❌ ERREUR: description_es encore présente!")
    else:
        print("✅ SUCCESS: description_es supprimée")

    # Vérifier quelques exemples
    if procedures:
        print("\nExemples:")
        for i, proc in enumerate(procedures[:3], 1):
            print(f"  {i}. ID={proc['id']}, Service={proc['fiscal_service_id']}, Step={proc['step_number']}")

def main():
    print("CORRECTION service_procedures.csv")
    print("=" * 50)

    fix_service_procedures_csv()
    validate_csv()

    print("\n" + "=" * 50)
    print("CORRECTION TERMINÉE")
    print("=" * 50)
    print("service_procedures.csv prêt pour import!")
    print("Structure conforme au schéma database")

if __name__ == "__main__":
    main()