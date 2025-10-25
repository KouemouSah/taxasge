#!/usr/bin/env python3
"""
Analyse et correction des doublons dans service_procedures.csv
Contrainte unique: (fiscal_service_id, step_number, applies_to)
"""

import csv
from pathlib import Path
from collections import Counter

def analyze_duplicates():
    """Analyse les doublons dans service_procedures.csv"""
    print("ANALYSE DES DOUBLONS service_procedures")
    print("=" * 50)
    print("Contrainte: UNIQUE(fiscal_service_id, step_number, applies_to)")
    print()

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_procedures.csv"

    # Lire le CSV
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        procedures = list(reader)
        fieldnames = reader.fieldnames

    print(f"Total procédures: {len(procedures)}")

    # Analyser les combinaisons uniques
    combinations = []
    procedures_by_combination = {}

    for proc in procedures:
        # Clé unique selon la contrainte
        key = (
            proc['fiscal_service_id'],
            proc['step_number'],
            proc['applies_to']
        )
        combinations.append(key)

        if key not in procedures_by_combination:
            procedures_by_combination[key] = []
        procedures_by_combination[key].append(proc)

    # Compter les doublons
    combo_counts = Counter(combinations)
    duplicates = {combo: count for combo, count in combo_counts.items() if count > 1}

    print(f"Combinaisons uniques: {len(combo_counts)}")
    print(f"Doublons détectés: {len(duplicates)}")

    if duplicates:
        print("\nDOUBLONS TROUVÉS:")
        print("-" * 40)
        for i, (combo, count) in enumerate(list(duplicates.items())[:10], 1):
            service_id, step_num, applies = combo
            print(f"{i}. Service={service_id}, Step={step_num}, Applies={applies}: {count} occurrences")

    return procedures, fieldnames, procedures_by_combination, duplicates

def fix_duplicates(procedures, fieldnames, procedures_by_combination, duplicates):
    """Corrige les doublons en ajustant les step_number"""
    print("\nCORRECTION DES DOUBLONS")
    print("=" * 40)

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_procedures.csv"

    # Backup
    backup_file = csv_dir / "service_procedures.csv.backup-before-dedup"
    import shutil
    shutil.copy2(csv_file, backup_file)
    print(f"Backup créé: {backup_file.name}")

    # Stratégie de correction
    fixed_procedures = []
    corrections = 0

    # Tracker pour les step_numbers utilisés par service
    used_steps_by_service = {}

    for proc in procedures:
        service_id = proc['fiscal_service_id']
        step_num = int(proc['step_number'])
        applies = proc['applies_to']

        # Initialiser le tracker pour ce service
        if service_id not in used_steps_by_service:
            used_steps_by_service[service_id] = {}
        if applies not in used_steps_by_service[service_id]:
            used_steps_by_service[service_id][applies] = set()

        # Vérifier si cette combinaison est déjà utilisée
        original_step = step_num
        while step_num in used_steps_by_service[service_id][applies]:
            step_num += 1
            corrections += 1

        # Marquer comme utilisé
        used_steps_by_service[service_id][applies].add(step_num)

        # Créer la procédure corrigée
        fixed_proc = proc.copy()
        fixed_proc['step_number'] = str(step_num)

        if step_num != original_step:
            print(f"  Corrige: {service_id} step {original_step} -> {step_num} ({applies})")

        fixed_procedures.append(fixed_proc)

    print(f"\nCorrections appliquées: {corrections}")

    # Sauvegarder le CSV corrigé
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(fixed_procedures)

    print(f"CSV corrigé sauvegardé: {len(fixed_procedures)} procédures")

    return fixed_procedures

def validate_uniqueness(procedures):
    """Valide qu'il n'y a plus de doublons"""
    print("\nVALIDATION UNICITÉ")
    print("=" * 30)

    combinations = []
    for proc in procedures:
        key = (
            proc['fiscal_service_id'],
            proc['step_number'],
            proc['applies_to']
        )
        combinations.append(key)

    combo_counts = Counter(combinations)
    duplicates = {combo: count for combo, count in combo_counts.items() if count > 1}

    print(f"Total procédures: {len(procedures)}")
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

def analyze_data_patterns():
    """Analyse les patterns de données pour comprendre les doublons"""
    print("\nANALYSE DES PATTERNS")
    print("=" * 35)

    csv_dir = Path(__file__).parent / "csv_output"
    csv_file = csv_dir / "service_procedures.csv"

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        procedures = list(reader)

    # Analyser par service
    services_stats = {}
    for proc in procedures:
        service_id = proc['fiscal_service_id']
        if service_id not in services_stats:
            services_stats[service_id] = {
                'total': 0,
                'steps': set(),
                'applies_to': Counter()
            }
        services_stats[service_id]['total'] += 1
        services_stats[service_id]['steps'].add(int(proc['step_number']))
        services_stats[service_id]['applies_to'][proc['applies_to']] += 1

    # Afficher les services avec le plus de procédures
    sorted_services = sorted(services_stats.items(), key=lambda x: x[1]['total'], reverse=True)

    print("TOP 5 SERVICES PAR NOMBRE DE PROCÉDURES:")
    for service_id, stats in sorted_services[:5]:
        print(f"  {service_id}: {stats['total']} procédures")
        print(f"    Steps: {min(stats['steps'])} à {max(stats['steps'])}")
        print(f"    Applies: {dict(stats['applies_to'])}")

    # Services avec des doublons potentiels
    print("\nSERVICES SUSPECTS (trop de procédures):")
    for service_id, stats in sorted_services[:10]:
        if stats['total'] > 10:  # Plus de 10 procédures est suspect
            print(f"  {service_id}: {stats['total']} procédures")

def main():
    print("CORRECTION DOUBLONS SERVICE_PROCEDURES")
    print("=" * 60)

    # 1. Analyser
    procedures, fieldnames, procedures_by_combination, duplicates = analyze_duplicates()

    if duplicates:
        # 2. Corriger
        fixed_procedures = fix_duplicates(procedures, fieldnames, procedures_by_combination, duplicates)

        # 3. Valider
        is_valid = validate_uniqueness(fixed_procedures)

        # 4. Analyser les patterns
        analyze_data_patterns()

        print("\n" + "=" * 60)
        print("RÉSUMÉ")
        print("=" * 60)
        print(f"Doublons corrigés: {len(duplicates)}")
        print(f"Résultat: {'SUCCÈS - Prêt pour import' if is_valid else 'ÉCHEC - Vérifier manuellement'}")
    else:
        print("\nAucun doublon détecté - CSV déjà prêt pour import!")

if __name__ == "__main__":
    main()