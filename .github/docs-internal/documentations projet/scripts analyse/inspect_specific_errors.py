#!/usr/bin/env python3
"""
Inspection des erreurs spécifiques dans les données JSON
"""

import json
import os

def inspect_categorias_translation_errors():
    """Examine les erreurs de traduction spécifiques dans categorias.json"""

    data_dir = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"

    with open(os.path.join(data_dir, 'categorias.json'), 'r', encoding='utf-8') as f:
        categorias = json.load(f)

    print("INSPECTION DES ERREURS DE TRADUCTION - categorias.json")
    print("=" * 60)

    civil_registry_errors = []

    for i, entry in enumerate(categorias):
        es_text = entry.get("nombre_es", "").strip()
        fr_text = entry.get("nombre_fr", "").strip()
        en_text = entry.get("nombre_en", "").strip()

        # Chercher les cas où FR/EN = "SERVICE D'ÉTAT CIVIL" mais ES ne correspond pas
        if (fr_text == "SERVICE D'ÉTAT CIVIL" and
            en_text == "CIVIL REGISTRY SERVICE" and
            es_text and
            "CIVIL" not in es_text.upper() and
            "ESTADO CIVIL" not in es_text.upper()):

            civil_registry_errors.append({
                'id': entry.get('id'),
                'position': i,
                'spanish': es_text,
                'french': fr_text,
                'english': en_text
            })

    print(f"Erreurs de traduction detectees: {len(civil_registry_errors)}")
    print("\nExemples d'erreurs (ES != FR/EN):")

    for i, error in enumerate(civil_registry_errors[:10]):  # Afficher les 10 premiers
        print(f"\n{i+1}. ID: {error['id']}")
        print(f"   ES: {error['spanish']}")
        print(f"   FR: {error['french']}")
        print(f"   EN: {error['english']}")
        print(f"   PROBLEME: Le texte espagnol ne correspond pas aux traductions")

def inspect_subcategorias_completeness():
    """Examine la complétude des sous-catégories"""

    data_dir = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"

    with open(os.path.join(data_dir, 'sub_categorias.json'), 'r', encoding='utf-8') as f:
        subcategorias = json.load(f)

    print(f"\n\nINSPECTION DE LA COMPLETUDE - sub_categorias.json")
    print("=" * 60)

    complete_entries = []
    incomplete_entries = []

    for entry in subcategorias:
        es = entry.get('nombre_es')
        fr = entry.get('nombre_fr')
        en = entry.get('nombre_en')

        if es is not None and fr is not None and en is not None:
            complete_entries.append(entry)
        else:
            incomplete_entries.append(entry)

    print(f"Entrees completes: {len(complete_entries)}")
    print(f"Entrees incompletes: {len(incomplete_entries)}")
    print(f"Pourcentage de completude: {(len(complete_entries)/len(subcategorias))*100:.1f}%")

    print(f"\nExemples d'entrees completes:")
    for entry in complete_entries[:3]:
        print(f"  {entry['id']}: {entry['nombre_es']}")

    print(f"\nExemples d'entrees incompletes:")
    for entry in incomplete_entries[:5]:
        print(f"  {entry['id']}: categoria_id={entry.get('categoria_id')} (tous champs NULL)")

def inspect_taxes_duplicates():
    """Examine les doublons dans taxes.json"""

    data_dir = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"

    with open(os.path.join(data_dir, 'taxes.json'), 'r', encoding='utf-8') as f:
        taxes = json.load(f)

    print(f"\n\nINSPECTION DES DOUBLONS - taxes.json")
    print("=" * 60)

    id_positions = {}
    duplicates = []

    for i, entry in enumerate(taxes):
        entry_id = entry.get('id')
        if entry_id in id_positions:
            duplicates.append({
                'id': entry_id,
                'positions': [id_positions[entry_id], i],
                'entries': [taxes[id_positions[entry_id]], entry]
            })
        else:
            id_positions[entry_id] = i

    print(f"Doublons detectes: {len(duplicates)}")

    for dup in duplicates:
        print(f"\nID duplique: {dup['id']}")
        print(f"Positions: {dup['positions']}")
        entry1, entry2 = dup['entries']
        print(f"  Entree 1: {entry1.get('nombre_es', 'N/A')}")
        print(f"  Entree 2: {entry2.get('nombre_es', 'N/A')}")
        print(f"  Identiques? {entry1 == entry2}")

def inspect_id_format_issues():
    """Examine les problèmes de format d'ID"""

    data_dir = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"

    print(f"\n\nINSPECTION DES FORMATS D'ID")
    print("=" * 60)

    # Sectores
    with open(os.path.join(data_dir, 'sectores.json'), 'r', encoding='utf-8') as f:
        sectores = json.load(f)

    print(f"\nsectores.json - IDs incorrects:")
    for i, entry in enumerate(sectores):
        entry_id = entry.get('id', '')
        if not entry_id.startswith('S-'):
            print(f"  Position {i}: '{entry_id}' (attendu S-XXX) - {entry.get('nombre_es', 'N/A')[:50]}")

    # Categorias
    with open(os.path.join(data_dir, 'categorias.json'), 'r', encoding='utf-8') as f:
        categorias = json.load(f)

    print(f"\ncategorias.json - IDs incorrects:")
    for i, entry in enumerate(categorias):
        entry_id = entry.get('id', '')
        if not entry_id.startswith('C-'):
            print(f"  Position {i}: '{entry_id}' (attendu C-XXX) - {entry.get('nombre_es', 'N/A')[:50]}")

if __name__ == "__main__":
    inspect_categorias_translation_errors()
    inspect_subcategorias_completeness()
    inspect_taxes_duplicates()
    inspect_id_format_issues()