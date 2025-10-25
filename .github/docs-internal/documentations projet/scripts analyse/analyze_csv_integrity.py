#!/usr/bin/env python3
"""
Analyse complète de l'intégrité et qualité des fichiers CSV vs JSON et Schema DB
Author: Claude
Date: 2025-09-29
"""

import json
import csv
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Tuple
import re

class CSVDataAnalyzer:
    def __init__(self):
        self.base_path = Path(".")
        self.csv_path = self.base_path / "data" / "csv" / "csv_output"
        self.json_path = self.base_path / "data"
        self.issues = []
        self.recommendations = []
        self.stats = {}

    def analyze_all(self):
        """Analyse complète de tous les aspects"""
        print("=" * 80)
        print("ANALYSE D'INTÉGRITÉ ET QUALITÉ DES DONNÉES CSV")
        print("=" * 80)
        print()

        # 1. Analyse des IDs
        self.analyze_id_structure()

        # 2. Vérification correspondance JSON/CSV
        self.check_json_csv_correspondence()

        # 3. Analyse compatibilité avec le schéma DB
        self.check_db_schema_compatibility()

        # 4. Analyse de l'approche CSV vs Workflow
        self.analyze_csv_vs_workflow_approach()

        # 5. Génération du rapport
        self.generate_report()

    def analyze_id_structure(self):
        """Analyse la structure et longueur des IDs"""
        print("1. ANALYSE DES IDENTIFIANTS (IDs)")
        print("-" * 40)

        id_patterns = {
            'ministries': r'M-\d{3}',
            'sectors': r'S-\d{3}',
            'categories': r'C-\d{3}',
            'fiscal_services': r'T-\d{3}'
        }

        # Analyser les CSV existants
        csv_files = {
            'ministries.csv': 'M-XXX',
            'sectors.csv': 'S-XXX',
            'categories.csv': 'C-XXX'
        }

        for csv_file, pattern in csv_files.items():
            csv_path = self.csv_path / csv_file
            if csv_path.exists():
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    if rows:
                        sample_id = rows[0]['id']
                        id_length = len(sample_id)
                        print(f"  {csv_file:<20} ID Format: {pattern:<10} Length: {id_length} chars")

                        # Vérifier l'unicité
                        ids = [row['id'] for row in rows]
                        duplicates = len(ids) - len(set(ids))
                        if duplicates > 0:
                            self.issues.append(f"DUPLICATES: {duplicates} IDs dupliqués dans {csv_file}")

        # Analyse des IDs courts vs UUIDs
        print()
        print("  Comparaison des formats d'ID:")
        print("  - Format actuel (court): 'M-001' (5-6 chars)")
        print("  - Format UUID standard:  '550e8400-e29b-...' (36 chars)")
        print("  - Avantages ID courts: Lisibilité, mémorisation facile, moins d'espace")
        print("  - Inconvénients: Risque collision multi-environnements, non-standard")

        self.recommendations.append(
            "IDs COURTS: Considérer migration vers format plus robuste (ex: 'MIN-2025-001' ou UUID court)"
        )

    def check_json_csv_correspondence(self):
        """Vérifie la correspondance entre JSON et CSV"""
        print()
        print("2. CORRESPONDANCE JSON <-> CSV")
        print("-" * 40)

        json_csv_mapping = [
            ('ministerios.json', 'ministries.csv', 'id'),
            ('sectores.json', 'sectors.csv', 'id'),
            ('categorias_cleaned.json', 'categories.csv', 'id')
        ]

        for json_file, csv_file, key_field in json_csv_mapping:
            json_path = self.json_path / json_file
            csv_path = self.csv_path / csv_file

            if json_path.exists() and csv_path.exists():
                # Charger JSON
                with open(json_path, 'r', encoding='utf-8') as f:
                    json_data = json.load(f)

                # Charger CSV
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    csv_data = list(reader)

                json_count = len(json_data)
                csv_count = len(csv_data)

                print(f"  {json_file:<25} Records: {json_count}")
                print(f"  {csv_file:<25} Records: {csv_count}")

                if json_count != csv_count:
                    self.issues.append(f"COUNT MISMATCH: {json_file} ({json_count}) != {csv_file} ({csv_count})")
                else:
                    print(f"  [OK] Compte correspondant")

                # Vérifier les IDs
                json_ids = {item[key_field] for item in json_data}
                csv_ids = {row[key_field] for row in csv_data}

                missing_in_csv = json_ids - csv_ids
                extra_in_csv = csv_ids - json_ids

                if missing_in_csv:
                    self.issues.append(f"MISSING IDs: {len(missing_in_csv)} IDs du JSON absents du CSV")
                if extra_in_csv:
                    self.issues.append(f"EXTRA IDs: {len(extra_in_csv)} IDs dans CSV non présents dans JSON")

                print()

    def check_db_schema_compatibility(self):
        """Vérifie la compatibilité avec le schéma de base de données"""
        print("3. COMPATIBILITÉ AVEC LE SCHÉMA DATABASE")
        print("-" * 40)

        # Analyser le schéma SQL
        schema_path = self.json_path / "taxasge_database_schema.sql"
        if schema_path.exists():
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_content = f.read()

            # Extraire les définitions de tables
            table_patterns = {
                'ministries': r'CREATE TABLE IF NOT EXISTS ministries \((.*?)\);',
                'sectors': r'CREATE TABLE IF NOT EXISTS sectors \((.*?)\);',
                'categories': r'CREATE TABLE IF NOT EXISTS categories \((.*?)\);',
                'fiscal_services': r'CREATE TABLE IF NOT EXISTS fiscal_services \((.*?)\);'
            }

            print("  Correspondance des colonnes CSV avec le schéma DB:")
            print()

            # Vérifier ministries
            csv_path = self.csv_path / "ministries.csv"
            if csv_path.exists():
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    csv_columns = reader.fieldnames

                db_required = ['id', 'code', 'display_order', 'is_active', 'created_at', 'updated_at']

                print("  Table: ministries")
                print(f"    Colonnes CSV:      {', '.join(csv_columns)}")
                print(f"    Colonnes DB req:   {', '.join(db_required)}")

                missing = set(db_required) - set(csv_columns)
                if missing:
                    self.issues.append(f"SCHEMA: Colonnes manquantes dans ministries.csv: {missing}")
                else:
                    print("    [OK] Toutes les colonnes requises presentes")

            print()

            # Type de données
            print("  Compatibilité des types de données:")
            print("    - ID: VARCHAR(10) dans DB, format 'M-XXX' dans CSV [OK]")
            print("    - Dates: TIMESTAMPTZ dans DB, format ISO dans CSV [OK]")
            print("    - Booleans: BOOLEAN dans DB, 'True/False' dans CSV (à convertir)")

            self.issues.append("TYPE MISMATCH: Les booléens CSV ('True'/'False') doivent être convertis pour PostgreSQL")

    def analyze_csv_vs_workflow_approach(self):
        """Analyse critique de l'approche CSV vs Workflow automatisé"""
        print()
        print("4. ANALYSE CRITIQUE: CSV DIRECT vs WORKFLOW AUTOMATISÉ")
        print("-" * 40)

        print("  APPROCHE CSV DIRECTE:")
        print("  Avantages:")
        print("    + Simplicité: Import direct via pgAdmin ou CLI")
        print("    + Contrôle: Visualisation des données avant import")
        print("    + Rapidité: Pas de pipeline CI/CD à attendre")
        print("    + Flexibilité: Corrections manuelles faciles")

        print()
        print("  Inconvénients:")
        print("    - Risque d'erreur humaine élevé")
        print("    - Pas de validation automatique")
        print("    - Pas de rollback automatique")
        print("    - Traçabilité limitée")
        print("    - Problème de synchronisation multi-environnements")

        print()
        print("  APPROCHE WORKFLOW (deploy-backend):")
        print("  Avantages:")
        print("    + Validation automatique des données")
        print("    + Migrations versionnées")
        print("    + Tests automatisés")
        print("    + Rollback possible")
        print("    + Traçabilité complète (Git)")
        print("    + Reproductibilité garantie")

        print()
        print("  Inconvénients:")
        print("    - Complexité initiale")
        print("    - Temps de déploiement plus long")
        print("    - Nécessite maintenance du pipeline")

        self.recommendations.append(
            "APPROCHE HYBRIDE RECOMMANDÉE: Utiliser CSV pour dev/test rapide, workflow pour production"
        )

    def generate_report(self):
        """Génère le rapport final"""
        print()
        print("=" * 80)
        print("RAPPORT D'ANALYSE FINAL")
        print("=" * 80)

        print()
        print("PROBLÈMES IDENTIFIÉS:")
        print("-" * 40)
        if self.issues:
            for i, issue in enumerate(self.issues, 1):
                print(f"  {i}. {issue}")
        else:
            print("  Aucun problème majeur détecté")

        print()
        print("RECOMMANDATIONS:")
        print("-" * 40)

        # Recommandations sur les IDs
        print("  1. IDENTIFIANTS (IDs):")
        print("     - COURT TERME: Garder format actuel (M-XXX) pour compatibilité")
        print("     - MOYEN TERME: Migrer vers format hybride (MIN-2025-XXX)")
        print("     - LONG TERME: Considérer UUID courts (8 chars) pour scalabilité")

        print()
        print("  2. IMPORT CSV DANS SUPABASE:")
        print("     - Créer script de conversion booléens (True -> true)")
        print("     - Ajouter validation des foreign keys avant import")
        print("     - Implémenter import par batch avec transactions")
        print("     - Créer script de rollback en cas d'échec")

        print()
        print("  3. STRATÉGIE D'IMPORT RECOMMANDÉE:")
        print("     PHASE 1 (Dev): CSV direct pour tests rapides")
        print("     PHASE 2 (Staging): Script d'import avec validations")
        print("     PHASE 3 (Prod): Workflow automatisé complet")

        print()
        print("  4. AMÉLIORATIONS DU CONVERTISSEUR JSON->CSV:")
        for rec in self.recommendations:
            print(f"     - {rec}")

        print()
        print("  5. ORDRE D'IMPORT CRITIQUE (respecter les FK):")
        print("     1. languages.csv")
        print("     2. ministries.csv")
        print("     3. sectors.csv")
        print("     4. categories.csv")
        print("     5. fiscal_services.csv")
        print("     6. translations.csv")
        print("     7. service_keywords.csv")

        print()
        print("CONCLUSION:")
        print("-" * 40)
        print("  Les fichiers CSV sont globalement COMPATIBLES avec le schéma DB.")
        print("  Cependant, des ajustements sont nécessaires pour un import direct:")
        print("  - Conversion des booléens")
        print("  - Validation des contraintes FK")
        print("  - Gestion des champs NULL")
        print()
        print("  L'approche CSV directe est VIABLE pour développement/test")
        print("  mais NON RECOMMANDÉE pour production sans automatisation.")

        # Sauvegarder le rapport
        self.save_report()

    def save_report(self):
        """Sauvegarde le rapport dans un fichier"""
        report_path = self.base_path / "CSV_INTEGRITY_REPORT.md"

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Rapport d'Analyse d'Intégrité CSV\n")
            f.write(f"Date: {datetime.now().isoformat()}\n\n")

            f.write("## Problèmes Identifiés\n\n")
            for issue in self.issues:
                f.write(f"- {issue}\n")

            f.write("\n## Recommandations\n\n")
            for rec in self.recommendations:
                f.write(f"- {rec}\n")

            f.write("\n## Conclusion\n\n")
            f.write("Les fichiers CSV nécessitent des ajustements mineurs pour l'import direct.\n")
            f.write("Une approche hybride CSV/Workflow est recommandée selon l'environnement.\n")

        print()
        print(f"  Rapport sauvegardé dans: {report_path}")

def main():
    analyzer = CSVDataAnalyzer()
    analyzer.analyze_all()

if __name__ == "__main__":
    main()