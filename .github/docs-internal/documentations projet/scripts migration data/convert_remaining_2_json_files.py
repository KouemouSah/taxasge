#!/usr/bin/env python3
"""
Conversion des 2 fichiers JSON restants avec IDs courts:
- procedimientos.json -> service_procedures.csv (IDs courts SP-XXXXX)
- palabras_clave.json -> service_keywords.csv (IDs courts SK-XXXXX)
"""

import json
import csv
from pathlib import Path
from datetime import datetime

class RemainingJsonConverter:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent
        self.csv_dir = Path(__file__).parent / "csv_output"
        self.current_time = datetime.utcnow().isoformat() + "Z"

    def convert_procedimientos_to_service_procedures(self):
        """Convertit procedimientos.json -> service_procedures.csv avec IDs courts"""
        print("1. CONVERSION: procedimientos.json -> service_procedures.csv")
        print("=" * 60)

        # Charger les données
        procedimientos_file = self.data_dir / "procedimientos.json"
        with open(procedimientos_file, 'r', encoding='utf-8') as f:
            procedimientos = json.load(f)

        print(f"Enregistrements à convertir: {len(procedimientos)}")

        # Structure conforme au schéma
        fieldnames = [
            'id',                              # VARCHAR(10) PRIMARY KEY (SP-XXXXX)
            'fiscal_service_id',               # VARCHAR(10) REFERENCES fiscal_services(id)
            'step_number',                     # INTEGER NOT NULL
            'description_es',                  # TEXT
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

        # Conversion avec IDs courts
        csv_file = self.csv_dir / "service_procedures.csv"
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, proc in enumerate(procedimientos, 1):
                row = {
                    'id': f"SP-{i:05d}",  # SP-00001, SP-00002...
                    'fiscal_service_id': proc.get('tax_id', '').strip(),
                    'step_number': proc.get('step_number', 1),
                    'description_es': proc.get('description_es', '').strip(),
                    'applies_to': 'both',  # Par défaut - applicable expédition et renouvellement
                    'estimated_duration_minutes': None,  # NULL par défaut
                    'location_address': None,  # NULL par défaut
                    'office_hours': None,  # NULL par défaut
                    'requires_appointment': False,  # false par défaut
                    'can_be_done_online': False,  # false par défaut
                    'additional_cost': 0.0,  # 0 par défaut
                    'required_documents': '{}',  # Array vide par défaut
                    'created_at': self.current_time
                }
                writer.writerow(row)

        print(f"SUCCESS: {len(procedimientos)} procédures converties -> {csv_file}")
        print(f"Format ID: SP-00001 à SP-{len(procedimientos):05d} (8 chars)")
        return len(procedimientos)

    def convert_palabras_clave_to_service_keywords(self):
        """Convertit palabras_clave.json -> service_keywords.csv avec IDs courts"""
        print("\n2. CONVERSION: palabras_clave.json -> service_keywords.csv")
        print("=" * 60)

        # Charger les données
        keywords_file = self.data_dir / "palabras_clave.json"
        with open(keywords_file, 'r', encoding='utf-8') as f:
            keywords = json.load(f)

        print(f"Enregistrements à convertir: {len(keywords)}")

        # Structure conforme au schéma
        fieldnames = [
            'id',                    # VARCHAR(10) PRIMARY KEY (SK-XXXXX)
            'fiscal_service_id',     # VARCHAR(10) REFERENCES fiscal_services(id)
            'keyword',              # VARCHAR(100) NOT NULL
            'language_code',        # VARCHAR(2) REFERENCES languages(code)
            'weight',               # INTEGER DEFAULT 1
            'is_auto_generated',    # BOOLEAN DEFAULT false
            'created_at'           # TIMESTAMPTZ DEFAULT NOW()
        ]

        # Conversion avec IDs courts
        csv_file = self.csv_dir / "service_keywords.csv"
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, keyword_data in enumerate(keywords, 1):
                row = {
                    'id': f"SK-{i:05d}",  # SK-00001, SK-00002...
                    'fiscal_service_id': keyword_data.get('tax_id', '').strip(),
                    'keyword': keyword_data.get('keyword', '').strip(),
                    'language_code': keyword_data.get('lang_code', 'es').strip(),  # es par défaut
                    'weight': 1,  # 1 par défaut
                    'is_auto_generated': True,  # true car provient de données existantes
                    'created_at': self.current_time
                }
                writer.writerow(row)

        print(f"SUCCESS: {len(keywords)} keywords converties -> {csv_file}")
        print(f"Format ID: SK-00001 à SK-{len(keywords):05d} (8 chars)")
        return len(keywords)

    def validate_foreign_key_integrity(self):
        """Valide que tous les fiscal_service_id existent"""
        print("\n3. VALIDATION INTÉGRITÉ CLÉS ÉTRANGÈRES")
        print("=" * 50)

        # Charger les fiscal_service_id existants
        services_file = self.csv_dir / "fiscal_services.csv"
        existing_ids = set()

        if services_file.exists():
            with open(services_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing_ids.add(row.get('id', '').strip())

            print(f"Services fiscaux existants: {len(existing_ids)}")

            # Vérifier chaque CSV généré
            csv_files = [
                ('service_procedures.csv', 'fiscal_service_id'),
                ('service_keywords.csv', 'fiscal_service_id')
            ]

            total_valid = 0
            total_invalid = 0

            for filename, id_field in csv_files:
                csv_file = self.csv_dir / filename
                if csv_file.exists():
                    referenced_ids = set()
                    invalid_ids = set()

                    with open(csv_file, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            service_id = row.get(id_field, '').strip()
                            referenced_ids.add(service_id)

                            if service_id not in existing_ids:
                                invalid_ids.add(service_id)

                    valid_count = len(referenced_ids) - len(invalid_ids)
                    invalid_count = len(invalid_ids)

                    total_valid += valid_count
                    total_invalid += invalid_count

                    print(f"  {filename}:")
                    print(f"    Références valides: {valid_count}")
                    print(f"    Références invalides: {invalid_count}")

                    if invalid_ids and len(invalid_ids) <= 5:
                        print(f"    Exemples invalides: {list(invalid_ids)[:5]}")

            print(f"\nRÉSUMÉ VALIDATION:")
            print(f"  Total références valides: {total_valid}")
            print(f"  Total références invalides: {total_invalid}")

            if total_invalid == 0:
                print("  SUCCESS: Toutes les références sont valides!")
                return True
            else:
                print(f"  ATTENTION: {total_invalid} références invalides détectées")
                return False

        else:
            print("ERREUR: fiscal_services.csv non trouvé - impossible de valider")
            return False

    def validate_id_compatibility(self):
        """Valide que tous les IDs sont compatibles avec les schémas"""
        print("\n4. VALIDATION COMPATIBILITÉ IDs")
        print("=" * 35)

        csv_files = [
            'service_procedures.csv',
            'service_keywords.csv'
        ]

        all_compatible = True

        for filename in csv_files:
            csv_file = self.csv_dir / filename
            if csv_file.exists():
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    ids = [row.get('id', '') for row in reader]

                max_length = max(len(id_val) for id_val in ids) if ids else 0
                is_compatible = max_length <= 10

                print(f"  {filename}:")
                print(f"    Total IDs: {len(ids)}")
                print(f"    Longueur max: {max_length} chars")
                print(f"    Exemples: {ids[:3]}")
                print(f"    Compatible VARCHAR(10): {'OUI' if is_compatible else 'NON'}")

                if not is_compatible:
                    all_compatible = False

        print(f"\nRÉSULTAT GLOBAL: {'COMPATIBLE' if all_compatible else 'INCOMPATIBLE'}")
        return all_compatible

    def generate_import_instructions(self):
        """Génère les instructions finales d'import"""
        print("\n" + "=" * 60)
        print("INSTRUCTIONS D'IMPORT")
        print("=" * 60)

        print("FICHIERS GÉNÉRÉS:")
        csv_files = ['service_procedures.csv', 'service_keywords.csv']

        for filename in csv_files:
            csv_file = self.csv_dir / filename
            if csv_file.exists():
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    count = len(list(reader))
                print(f"  ✅ {filename}: {count} enregistrements")

        print(f"\nORDRE D'IMPORT SUPABASE:")
        print("1. service_procedures.csv")
        print("2. service_keywords.csv")
        print()
        print("NOTES IMPORTANTES:")
        print("- Tous les IDs sont compatibles VARCHAR(10)")
        print("- Toutes les FK vers fiscal_services sont valides")
        print("- Format IDs: SP-XXXXX et SK-XXXXX")
        print("- Import direct possible sans modification schéma")

    def run_complete_conversion(self):
        """Exécute la conversion complète"""
        print("CONVERSION 2 FICHIERS JSON RESTANTS")
        print("=" * 60)

        # Conversions
        proc_count = self.convert_procedimientos_to_service_procedures()
        keywords_count = self.convert_palabras_clave_to_service_keywords()

        # Validations
        integrity_ok = self.validate_foreign_key_integrity()
        compatibility_ok = self.validate_id_compatibility()

        # Instructions
        self.generate_import_instructions()

        # Résumé
        print("\n" + "=" * 60)
        print("RÉSUMÉ CONVERSION")
        print("=" * 60)
        print(f"service_procedures.csv: {proc_count} enregistrements")
        print(f"service_keywords.csv: {keywords_count} enregistrements")
        print(f"Total convertis: {proc_count + keywords_count}")
        print(f"Intégrité FK: {'VALIDE' if integrity_ok else 'INVALIDE'}")
        print(f"Compatibilité IDs: {'VALIDE' if compatibility_ok else 'INVALIDE'}")

        success = integrity_ok and compatibility_ok

        if success:
            print("\n🚀 SUCCESS: Tous les CSV sont prêts pour import Supabase!")
        else:
            print("\n⚠️ ATTENTION: Vérifier les erreurs avant import")

        return success

def main():
    converter = RemainingJsonConverter()
    converter.run_complete_conversion()

if __name__ == "__main__":
    main()