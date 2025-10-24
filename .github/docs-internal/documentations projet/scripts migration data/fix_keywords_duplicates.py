#!/usr/bin/env python3
"""
Correction des doublons dans service_keywords.csv
Contrainte unique: (fiscal_service_id, keyword, language_code)
"""

import csv
from pathlib import Path
from collections import Counter
import shutil

def fix_service_keywords_duplicates():
    print("CORRECTION DOUBLONS service_keywords")
    print("=" * 50)
    print("Contrainte: UNIQUE(fiscal_service_id, keyword, language_code)")
    print()

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_keywords.csv"

    # Lire le CSV
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        keywords = list(reader)
        fieldnames = reader.fieldnames

    print(f"Total keywords: {len(keywords)}")

    # Analyser les combinaisons uniques
    combinations = []
    seen_combinations = set()

    for kw in keywords:
        key = (
            kw['fiscal_service_id'],
            kw['keyword'],
            kw['language_code']
        )
        combinations.append(key)

    # Compter les doublons
    combo_counts = Counter(combinations)
    duplicates = {combo: count for combo, count in combo_counts.items() if count > 1}

    print(f"Combinaisons uniques: {len(combo_counts)}")
    print(f"Doublons détectés: {len(duplicates)}")

    if duplicates:
        print("\nDOUBLONS TROUVÉS:")
        print("-" * 40)
        for i, (combo, count) in enumerate(list(duplicates.items())[:10], 1):
            service_id, keyword, lang = combo
            print(f'{i}. Service={service_id}, Keyword="{keyword}", Lang={lang}: {count} occurrences')

        # Backup
        backup_file = csv_dir / "service_keywords.csv.backup-before-dedup"
        shutil.copy2(csv_file, backup_file)
        print(f"\nBackup créé: {backup_file.name}")

        # Supprimer les doublons (garder seulement le premier)
        unique_keywords = []
        seen_combinations = set()
        removed_count = 0

        for kw in keywords:
            key = (
                kw['fiscal_service_id'],
                kw['keyword'],
                kw['language_code']
            )

            if key not in seen_combinations:
                unique_keywords.append(kw)
                seen_combinations.add(key)
            else:
                removed_count += 1
                print(f"  Supprime doublon: {kw['fiscal_service_id']} - \"{kw['keyword']}\" ({kw['language_code']})")

        print(f"\nDoublons supprimés: {removed_count}")
        print(f"Keywords uniques conservés: {len(unique_keywords)}")

        # Sauvegarder le CSV corrigé
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unique_keywords)

        print(f"CSV corrigé sauvegardé: {len(unique_keywords)} keywords")
        return unique_keywords
    else:
        print("\nAucun doublon détecté - CSV déjà prêt!")
        return keywords

def validate_uniqueness():
    """Valide qu'il n'y a plus de doublons"""
    print("\nVALIDATION UNICITÉ")
    print("=" * 30)

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_keywords.csv"

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        keywords = list(reader)

    combinations = []
    for kw in keywords:
        key = (
            kw['fiscal_service_id'],
            kw['keyword'],
            kw['language_code']
        )
        combinations.append(key)

    combo_counts = Counter(combinations)
    duplicates = {combo: count for combo, count in combo_counts.items() if count > 1}

    print(f"Total keywords: {len(keywords)}")
    print(f"Combinaisons uniques: {len(combo_counts)}")
    print(f"Doublons restants: {len(duplicates)}")

    if duplicates:
        print("\n⚠️ DOUBLONS RESTANTS:")
        for combo, count in list(duplicates.items())[:5]:
            print(f"  {combo}: {count} occurrences")
        return False
    else:
        print("\n✅ SUCCÈS: Aucun doublon, contrainte respectée!")
        return True

def main():
    print("CORRECTION service_keywords.csv")
    print("=" * 50)

    # Corriger
    unique_keywords = fix_service_keywords_duplicates()

    # Valider
    is_valid = validate_uniqueness()

    print("\n" + "=" * 50)
    print("RÉSUMÉ")
    print("=" * 50)
    print(f"Keywords finaux: {len(unique_keywords) if unique_keywords else 'N/A'}")
    print(f"Résultat: {'SUCCÈS - Prêt pour import' if is_valid else 'ÉCHEC - Vérifier manuellement'}")

if __name__ == "__main__":
    main()