#!/usr/bin/env python3
"""
Analyse des services fiscaux sans montants
Identifie et analyse les services avec montants à zéro
Author: Claude
Date: 2025-09-29
"""

import csv
import json
from pathlib import Path
from typing import Dict, List, Tuple

class ZeroAmountAnalyzer:
    def __init__(self):
        self.base_path = Path(".")
        self.csv_path = self.base_path / "data" / "csv" / "csv_output"
        self.json_path = self.base_path / "data"
        self.zero_services = []
        self.analysis_results = {}

    def analyze_fiscal_services(self):
        """Analyse les services fiscaux pour identifier ceux sans montants"""
        csv_file = self.csv_path / "fiscal_services.csv"

        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            all_services = list(reader)

        # Identifier les services avec montants à 0
        for idx, service in enumerate(all_services, 1):
            tasa_exp = float(service.get('tasa_expedicion', 0))
            tasa_ren = float(service.get('tasa_renovacion', 0))

            if tasa_exp == 0 and tasa_ren == 0:
                self.zero_services.append({
                    'line': idx,
                    'id': service['id'],
                    'category_id': service['category_id'],
                    'service_code': service['service_code'],
                    'calculation_method': service['calculation_method']
                })

        return len(self.zero_services), len(all_services)

    def load_translations(self):
        """Charge les traductions pour identifier les noms des services"""
        translations_file = self.csv_path / "translations.csv"
        translations = {}

        with open(translations_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['entity_type'] == 'fiscal_service' and row['field_name'] == 'name':
                    key = row['entity_id']
                    if key not in translations:
                        translations[key] = {}
                    translations[key][row['language_code']] = row['content']

        return translations

    def load_original_json(self):
        """Charge les données JSON originales pour comparaison"""
        json_file = self.json_path / "taxes_restructured.json"

        with open(json_file, 'r', encoding='utf-8') as f:
            return {item['id']: item for item in json.load(f)}

    def categorize_zero_services(self, translations: Dict, original_data: Dict):
        """Catégorise les services à montant zéro par type"""
        categories = {
            'tiered_rates': [],      # Tarifs par tranches
            'percentage_based': [],  # Basés sur pourcentage
            'unit_based': [],        # Par unité (tonne, passager)
            'formula_based': [],     # Formule complexe
            'truly_zero': [],        # Vraiment à zéro
            'data_error': []         # Erreur de données probable
        }

        for service in self.zero_services:
            service_id = service['id']
            service_name = translations.get(service_id, {}).get('es', 'Unknown')
            original = original_data.get(service_id, {})

            # Analyser le nom du service pour déterminer le type
            service_info = {
                'id': service_id,
                'name': service_name[:80] + ('...' if len(service_name) > 80 else ''),
                'category': service['category_id'],
                'method': service['calculation_method']
            }

            # Détection basée sur mots-clés dans le nom
            name_lower = service_name.lower()

            if any(word in name_lower for word in ['tonelada', 'ton', 'kg', 'litro', 'metro']):
                categories['unit_based'].append(service_info)
            elif any(word in name_lower for word in ['%', 'porcentaje', 'percentage', 'proporcion']):
                categories['percentage_based'].append(service_info)
            elif any(word in name_lower for word in ['tramo', 'escalon', 'rango', 'tier']):
                categories['tiered_rates'].append(service_info)
            elif any(word in name_lower for word in ['formula', 'calculo', 'computation']):
                categories['formula_based'].append(service_info)
            elif 'exento' in name_lower or 'gratis' in name_lower or 'sin costo' in name_lower:
                categories['truly_zero'].append(service_info)
            else:
                # Vérifier si c'est une erreur de données
                if original and (original.get('tasa_expedicion', 0) > 0 or original.get('tasa_renovacion', 0) > 0):
                    categories['data_error'].append(service_info)
                else:
                    categories['truly_zero'].append(service_info)

        return categories

    def generate_report(self):
        """Génère un rapport détaillé"""
        print("=" * 80)
        print("ANALYSE DES SERVICES FISCAUX SANS MONTANTS")
        print("=" * 80)
        print()

        # Analyse de base
        zero_count, total_count = self.analyze_fiscal_services()
        percentage = (zero_count / total_count) * 100 if total_count > 0 else 0

        print(f"Statistiques Générales:")
        print(f"  - Total services fiscaux: {total_count}")
        print(f"  - Services AVEC montants: {total_count - zero_count}")
        print(f"  - Services SANS montants: {zero_count} ({percentage:.1f}%)")
        print()

        # Charger les données supplémentaires
        translations = self.load_translations()
        original_data = self.load_original_json()

        # Catégoriser les services
        categories = self.categorize_zero_services(translations, original_data)

        print("Classification des Services Sans Montants:")
        print("-" * 40)

        # 1. Services basés sur unités
        if categories['unit_based']:
            print(f"\n1. SERVICES BASÉS SUR UNITÉS ({len(categories['unit_based'])} services)")
            print("   Ces services sont probablement calculés par unité (tonne, passager, litre, etc.)")
            for svc in categories['unit_based'][:5]:
                print(f"   - {svc['id']}: {svc['name']}")
            if len(categories['unit_based']) > 5:
                print(f"   ... et {len(categories['unit_based']) - 5} autres")

        # 2. Services basés sur pourcentage
        if categories['percentage_based']:
            print(f"\n2. SERVICES BASÉS SUR POURCENTAGE ({len(categories['percentage_based'])} services)")
            print("   Ces services sont calculés comme % d'une base (valeur déclarée, etc.)")
            for svc in categories['percentage_based'][:5]:
                print(f"   - {svc['id']}: {svc['name']}")

        # 3. Services avec tarifs par tranches
        if categories['tiered_rates']:
            print(f"\n3. SERVICES AVEC TARIFS PAR TRANCHES ({len(categories['tiered_rates'])} services)")
            print("   Ces services ont des tarifs progressifs selon des tranches")
            for svc in categories['tiered_rates'][:5]:
                print(f"   - {svc['id']}: {svc['name']}")

        # 4. Services avec formule complexe
        if categories['formula_based']:
            print(f"\n4. SERVICES AVEC FORMULE COMPLEXE ({len(categories['formula_based'])} services)")
            print("   Ces services utilisent une formule de calcul spécifique")
            for svc in categories['formula_based'][:5]:
                print(f"   - {svc['id']}: {svc['name']}")

        # 5. Services vraiment gratuits ou exempts
        if categories['truly_zero']:
            print(f"\n5. SERVICES GRATUITS/EXEMPTS ({len(categories['truly_zero'])} services)")
            print("   Ces services semblent être vraiment gratuits ou exempts de taxes")
            for svc in categories['truly_zero'][:5]:
                print(f"   - {svc['id']}: {svc['name']}")

        # 6. Erreurs potentielles de données
        if categories['data_error']:
            print(f"\n6. ERREURS POTENTIELLES DE DONNÉES ({len(categories['data_error'])} services)")
            print("   Ces services avaient des montants dans les données originales")
            for svc in categories['data_error']:
                print(f"   - {svc['id']}: {svc['name']}")

        # Exemples détaillés
        print("\n" + "=" * 80)
        print("EXEMPLES DÉTAILLÉS DE SERVICES SANS MONTANTS")
        print("=" * 80)

        # Montrer quelques exemples avec plus de détails
        examples_to_show = min(10, len(self.zero_services))
        for i in range(examples_to_show):
            service = self.zero_services[i]
            service_name = translations.get(service['id'], {})

            print(f"\n{i+1}. Service ID: {service['id']}")
            print(f"   Catégorie: {service['category_id']}")
            print(f"   Méthode de calcul: {service['calculation_method']}")
            if service_name:
                print(f"   Nom ES: {service_name.get('es', 'N/A')}")
                print(f"   Nom FR: {service_name.get('fr', 'N/A')}")

        # Recommandations
        print("\n" + "=" * 80)
        print("RECOMMANDATIONS")
        print("=" * 80)

        print("\n1. SERVICES CALCULÉS (Unit/Percentage/Tiered):")
        calculated_count = len(categories['unit_based']) + len(categories['percentage_based']) + len(categories['tiered_rates'])
        print(f"   - {calculated_count} services nécessitent des paramètres de calcul")
        print("   - Action: Ajouter les configurations dans 'calculation_config' JSONB")
        print("   - Exemple: rate_per_ton, percentage_rate, tier_brackets")

        print("\n2. SERVICES GRATUITS:")
        print(f"   - {len(categories['truly_zero'])} services semblent légitimes à 0")
        print("   - Action: Marquer avec un flag 'is_free' pour clarifier")

        print("\n3. ERREURS DE DONNÉES:")
        if categories['data_error']:
            print(f"   - {len(categories['data_error'])} services ont perdu leurs montants")
            print("   - Action: Vérifier les données sources et corriger")

        print("\n4. AMÉLIORATION DU MODÈLE:")
        print("   - Ajouter un champ 'pricing_type' ENUM")
        print("   - Types: fixed, percentage, unit_based, tiered, formula, free")
        print("   - Permettra de mieux gérer les différents types de tarification")

        # Sauvegarder le rapport
        self.save_detailed_report(categories, translations)

    def save_detailed_report(self, categories: Dict, translations: Dict):
        """Sauvegarde un rapport détaillé en CSV"""
        report_path = self.base_path / "ZERO_AMOUNT_SERVICES_REPORT.csv"

        with open(report_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Service ID', 'Category ID', 'Type', 'Name (ES)', 'Name (FR)', 'Calculation Method', 'Recommendation'])

            for category_type, services in categories.items():
                for service in services:
                    service_trans = translations.get(service['id'], {})

                    if category_type == 'unit_based':
                        recommendation = "Ajouter config: rate_per_unit, unit_measure"
                    elif category_type == 'percentage_based':
                        recommendation = "Ajouter config: percentage_rate, base_field"
                    elif category_type == 'tiered_rates':
                        recommendation = "Ajouter config: tier_brackets JSON"
                    elif category_type == 'formula_based':
                        recommendation = "Ajouter config: formula_expression"
                    elif category_type == 'truly_zero':
                        recommendation = "Marquer comme gratuit (is_free=true)"
                    else:
                        recommendation = "Vérifier données source et corriger"

                    writer.writerow([
                        service['id'],
                        service['category'],
                        category_type,
                        service_trans.get('es', ''),
                        service_trans.get('fr', ''),
                        service['method'],
                        recommendation
                    ])

        print(f"\nRapport CSV sauvegardé: {report_path}")

def main():
    analyzer = ZeroAmountAnalyzer()
    analyzer.generate_report()

if __name__ == "__main__":
    main()