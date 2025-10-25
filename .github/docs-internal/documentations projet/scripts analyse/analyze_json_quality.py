#!/usr/bin/env python3
"""
Script d'analyse de la qualité des données JSON
Analyse les fichiers JSON dans le dossier data/ pour identifier les problèmes de qualité
"""

import json
import os
from collections import defaultdict, Counter
from typing import Dict, List, Any, Set, Tuple
import re

class JSONQualityAnalyzer:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.files = {
            'ministerios': 'ministerios.json',
            'sectores': 'sectores.json',
            'categorias': 'categorias.json',
            'sub_categorias': 'sub_categorias.json',
            'taxes': 'taxes.json'
        }
        self.data = {}
        self.analysis_results = {}

    def load_data(self):
        """Charge tous les fichiers JSON"""
        for name, filename in self.files.items():
            filepath = os.path.join(self.data_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    self.data[name] = json.load(f)
                print(f"[OK] Charge {filename}: {len(self.data[name])} entrees")
            except Exception as e:
                print(f"[ERREUR] Erreur lors du chargement de {filename}: {e}")
                self.data[name] = []

    def analyze_basic_stats(self, dataset_name: str, data: List[Dict]) -> Dict:
        """Analyse les statistiques de base d'un dataset"""
        if not data:
            return {"error": "Dataset vide"}

        stats = {
            "total_entries": len(data),
            "fields": set(),
            "null_fields": defaultdict(int),
            "empty_fields": defaultdict(int),
            "field_types": defaultdict(Counter),
            "duplicates": {
                "by_id": [],
                "by_content": []
            }
        }

        # Analyse des champs et types
        ids_seen = set()
        content_hashes = set()

        for i, entry in enumerate(data):
            if not isinstance(entry, dict):
                continue

            # Collecte des champs
            for field, value in entry.items():
                stats["fields"].add(field)

                # Vérification des valeurs null/empty
                if value is None:
                    stats["null_fields"][field] += 1
                elif isinstance(value, str) and value.strip() == "":
                    stats["empty_fields"][field] += 1

                # Type de données
                stats["field_types"][field][type(value).__name__] += 1

            # Vérification des doublons par ID
            if "id" in entry:
                if entry["id"] in ids_seen:
                    stats["duplicates"]["by_id"].append({
                        "id": entry["id"],
                        "positions": [i for j, e in enumerate(data) if e.get("id") == entry["id"]]
                    })
                ids_seen.add(entry["id"])

            # Vérification des doublons par contenu
            content_str = json.dumps(entry, sort_keys=True)
            content_hash = hash(content_str)
            if content_hash in content_hashes:
                stats["duplicates"]["by_content"].append({
                    "entry": entry,
                    "positions": [j for j, e in enumerate(data) if hash(json.dumps(e, sort_keys=True)) == content_hash]
                })
            content_hashes.add(content_hash)

        stats["fields"] = list(stats["fields"])
        return stats

    def analyze_translations(self, dataset_name: str, data: List[Dict]) -> Dict:
        """Analyse la cohérence des traductions"""
        translation_issues = {
            "missing_translations": [],
            "inconsistent_translations": [],
            "incomplete_sets": []
        }

        lang_fields = ["nombre_es", "nombre_fr", "nombre_en"]

        for i, entry in enumerate(data):
            if not isinstance(entry, dict):
                continue

            # Vérification des traductions manquantes
            translations = {}
            for lang in lang_fields:
                if lang in entry:
                    value = entry[lang]
                    if value is None or (isinstance(value, str) and value.strip() == ""):
                        translations[lang] = None
                    else:
                        translations[lang] = value.strip()

            # Identification des ensembles incomplets
            non_null_translations = {k: v for k, v in translations.items() if v is not None}
            if len(non_null_translations) > 0 and len(non_null_translations) < len(lang_fields):
                translation_issues["incomplete_sets"].append({
                    "id": entry.get("id", f"index_{i}"),
                    "missing_languages": [lang for lang in lang_fields if translations.get(lang) is None],
                    "available_languages": list(non_null_translations.keys())
                })

        return translation_issues

    def analyze_foreign_keys(self) -> Dict:
        """Analyse la cohérence des clés étrangères"""
        fk_issues = {
            "broken_references": [],
            "orphaned_records": []
        }

        # Mapping des relations
        relations = [
            ("sectores", "ministerio_id", "ministerios", "id"),
            ("categorias", "sector_id", "sectores", "id"),
            ("sub_categorias", "categoria_id", "categorias", "id"),
            ("taxes", "sub_categoria_id", "sub_categorias", "id")
        ]

        for child_table, fk_field, parent_table, pk_field in relations:
            if child_table not in self.data or parent_table not in self.data:
                continue

            # Obtenir les IDs valides de la table parent
            parent_ids = {entry.get(pk_field) for entry in self.data[parent_table] if entry.get(pk_field)}

            # Vérifier les références dans la table enfant
            for entry in self.data[child_table]:
                fk_value = entry.get(fk_field)
                if fk_value and fk_value not in parent_ids:
                    fk_issues["broken_references"].append({
                        "table": child_table,
                        "record_id": entry.get("id", "unknown"),
                        "foreign_key_field": fk_field,
                        "foreign_key_value": fk_value,
                        "parent_table": parent_table
                    })

        return fk_issues

    def find_translation_errors(self, dataset_name: str, data: List[Dict]) -> List[Dict]:
        """Trouve les erreurs spécifiques de traduction"""
        errors = []

        for i, entry in enumerate(data):
            if not isinstance(entry, dict):
                continue

            # Exemple spécifique trouvé dans categorias.json
            es_text = entry.get("nombre_es", "")
            fr_text = entry.get("nombre_fr", "")
            en_text = entry.get("nombre_en", "")

            # Vérifier si les traductions françaises et anglaises sont incorrectes
            if (es_text and isinstance(es_text, str) and
                fr_text == "SERVICE D'ÉTAT CIVIL" and
                en_text == "CIVIL REGISTRY SERVICE" and
                "CIVIL" not in es_text.upper()):

                errors.append({
                    "id": entry.get("id"),
                    "position": i,
                    "error_type": "wrong_translation_template",
                    "spanish": es_text,
                    "french": fr_text,
                    "english": en_text,
                    "description": "Traductions FR/EN ne correspondent pas au texte espagnol"
                })

        return errors

    def analyze_id_consistency(self) -> Dict:
        """Analyse la cohérence des schémas d'ID"""
        id_analysis = {}

        expected_patterns = {
            "ministerios": r"^M-\d{3}$",
            "sectores": r"^S-\d{3}$",
            "categorias": r"^C-\d{3}$",
            "sub_categorias": r"^SC-\d{3}$|^S-\d{3}$",  # Certains ont S- au lieu de SC-
            "taxes": r"^T-\d{3}$"
        }

        for dataset_name, pattern in expected_patterns.items():
            if dataset_name not in self.data:
                continue

            data = self.data[dataset_name]
            analysis = {
                "total_records": len(data),
                "valid_ids": 0,
                "invalid_ids": [],
                "missing_ids": 0,
                "duplicate_ids": []
            }

            ids_seen = set()

            for i, entry in enumerate(data):
                entry_id = entry.get("id")

                if not entry_id:
                    analysis["missing_ids"] += 1
                    continue

                # Vérifier le pattern
                if re.match(pattern, str(entry_id)):
                    analysis["valid_ids"] += 1
                else:
                    analysis["invalid_ids"].append({
                        "position": i,
                        "id": entry_id,
                        "expected_pattern": pattern
                    })

                # Vérifier les doublons
                if entry_id in ids_seen:
                    analysis["duplicate_ids"].append(entry_id)
                ids_seen.add(entry_id)

            id_analysis[dataset_name] = analysis

        return id_analysis

    def run_analysis(self):
        """Lance l'analyse complète"""
        print("=== ANALYSE DE LA QUALITÉ DES DONNÉES JSON ===\n")

        self.load_data()

        # Analyse de base pour chaque fichier
        for name, data in self.data.items():
            print(f"\n--- ANALYSE DE {name.upper()} ---")
            stats = self.analyze_basic_stats(name, data)
            self.analysis_results[name] = stats

            print(f"Nombre d'entrées: {stats['total_entries']}")
            print(f"Champs détectés: {', '.join(stats['fields'])}")

            if stats.get("null_fields"):
                print("Champs avec valeurs NULL:")
                for field, count in stats["null_fields"].items():
                    print(f"  - {field}: {count} null(s)")

            if stats.get("empty_fields"):
                print("Champs avec valeurs vides:")
                for field, count in stats["empty_fields"].items():
                    print(f"  - {field}: {count} vide(s)")

            if stats["duplicates"]["by_id"]:
                print(f"IDs dupliqués: {len(stats['duplicates']['by_id'])}")
                for dup in stats["duplicates"]["by_id"][:3]:  # Afficher les 3 premiers
                    print(f"  - ID '{dup['id']}' aux positions {dup['positions']}")

            # Analyse des traductions
            translation_issues = self.analyze_translations(name, data)
            if translation_issues["incomplete_sets"]:
                print(f"Ensembles de traductions incomplets: {len(translation_issues['incomplete_sets'])}")
                for issue in translation_issues["incomplete_sets"][:3]:
                    print(f"  - {issue['id']}: manque {', '.join(issue['missing_languages'])}")

            # Erreurs de traduction spécifiques
            translation_errors = self.find_translation_errors(name, data)
            if translation_errors:
                print(f"Erreurs de traduction détectées: {len(translation_errors)}")
                for error in translation_errors[:3]:
                    print(f"  - {error['id']}: {error['description']}")

        # Analyse des clés étrangères
        print(f"\n--- ANALYSE DES CLÉS ÉTRANGÈRES ---")
        fk_issues = self.analyze_foreign_keys()
        if fk_issues["broken_references"]:
            print(f"Références cassées: {len(fk_issues['broken_references'])}")
            for ref in fk_issues["broken_references"][:5]:
                print(f"  - {ref['table']}.{ref['record_id']}: {ref['foreign_key_field']}='{ref['foreign_key_value']}' -> {ref['parent_table']}")

        # Analyse de la cohérence des IDs
        print(f"\n--- ANALYSE DE LA COHÉRENCE DES IDs ---")
        id_analysis = self.analyze_id_consistency()
        for dataset, analysis in id_analysis.items():
            print(f"\n{dataset}:")
            print(f"  Total: {analysis['total_records']}")
            print(f"  IDs valides: {analysis['valid_ids']}")
            print(f"  IDs invalides: {len(analysis['invalid_ids'])}")
            print(f"  IDs manquants: {analysis['missing_ids']}")
            print(f"  IDs dupliqués: {len(analysis['duplicate_ids'])}")

            if analysis['invalid_ids']:
                print("  Exemples d'IDs invalides:")
                for invalid in analysis['invalid_ids'][:3]:
                    print(f"    - Position {invalid['position']}: '{invalid['id']}' (attendu: {invalid['expected_pattern']})")

    def generate_summary_report(self):
        """Génère un rapport de synthèse"""
        print(f"\n{'='*60}")
        print("RAPPORT DE SYNTHÈSE - QUALITÉ DES DONNÉES")
        print(f"{'='*60}")

        total_records = sum(len(data) for data in self.data.values())
        print(f"Total des enregistrements analysés: {total_records}")

        # Résumé des problèmes critiques
        critical_issues = []

        # Compter les traductions manquantes
        total_incomplete_translations = 0
        for name, data in self.data.items():
            translation_issues = self.analyze_translations(name, data)
            total_incomplete_translations += len(translation_issues["incomplete_sets"])

        if total_incomplete_translations > 0:
            critical_issues.append(f"Traductions incomplètes: {total_incomplete_translations}")

        # Compter les références cassées
        fk_issues = self.analyze_foreign_keys()
        broken_refs = len(fk_issues["broken_references"])
        if broken_refs > 0:
            critical_issues.append(f"Références cassées: {broken_refs}")

        # Compter les erreurs de traduction
        total_translation_errors = 0
        for name, data in self.data.items():
            total_translation_errors += len(self.find_translation_errors(name, data))

        if total_translation_errors > 0:
            critical_issues.append(f"Erreurs de traduction: {total_translation_errors}")

        if critical_issues:
            print("\nPROBLEMES CRITIQUES IDENTIFIES:")
            for issue in critical_issues:
                print(f"  [!] {issue}")
        else:
            print("\n[OK] Aucun probleme critique detecte")

        # Recommandations
        print(f"\nRECOMMANDANTIONS:")
        print(f"1. Completer les traductions manquantes dans sub_categorias.json")
        print(f"2. Corriger les traductions incorrectes dans categorias.json")
        print(f"3. Valider et corriger les references de cles etrangeres")
        print(f"4. Standardiser les formats d'IDs")
        print(f"5. Eliminer les doublons identifies")

if __name__ == "__main__":
    # Chemin vers le dossier data
    data_directory = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"

    # Créer et lancer l'analyseur
    analyzer = JSONQualityAnalyzer(data_directory)
    analyzer.run_analysis()
    analyzer.generate_summary_report()