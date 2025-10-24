#!/usr/bin/env python3
"""
Rapport détaillé de qualité des données JSON
Génère un rapport complet avec métriques et exemples spécifiques
"""

import json
import os
from collections import defaultdict, Counter
from typing import Dict, List, Any
import re

def load_json_file(filepath: str) -> List[Dict]:
    """Charge un fichier JSON et retourne les données"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lors du chargement de {filepath}: {e}")
        return []

def analyze_detailed_issues(data_dir: str):
    """Analyse détaillée des problèmes dans les données"""

    # Charger les données
    files = {
        'ministerios': load_json_file(os.path.join(data_dir, 'ministerios.json')),
        'sectores': load_json_file(os.path.join(data_dir, 'sectores.json')),
        'categorias': load_json_file(os.path.join(data_dir, 'categorias.json')),
        'sub_categorias': load_json_file(os.path.join(data_dir, 'sub_categorias.json')),
        'taxes': load_json_file(os.path.join(data_dir, 'taxes.json'))
    }

    print("=" * 80)
    print("RAPPORT DETAILLE DE QUALITE DES DONNEES JSON - TAXASGE")
    print("=" * 80)

    # 1. METRIQUES GENERALES
    print("\n1. METRIQUES GENERALES")
    print("-" * 40)

    total_records = sum(len(data) for data in files.values())
    print(f"Total des enregistrements: {total_records}")

    for name, data in files.items():
        print(f"{name:15}: {len(data):4} enregistrements")

    # 2. PROBLEMES DE COMPLETUDE DES DONNEES
    print("\n2. PROBLEMES DE COMPLETUDE DES DONNEES")
    print("-" * 40)

    for name, data in files.items():
        null_count = 0
        empty_count = 0
        total_fields = 0

        for entry in data:
            for field, value in entry.items():
                total_fields += 1
                if value is None:
                    null_count += 1
                elif isinstance(value, str) and value.strip() == "":
                    empty_count += 1

        if null_count > 0 or empty_count > 0:
            completude = ((total_fields - null_count - empty_count) / total_fields) * 100 if total_fields > 0 else 0
            print(f"{name}:")
            print(f"  Completude: {completude:.1f}%")
            print(f"  Champs NULL: {null_count}")
            print(f"  Champs vides: {empty_count}")

    # 3. PROBLEMES SPECIFIQUES PAR FICHIER
    print("\n3. PROBLEMES SPECIFIQUES PAR FICHIER")
    print("-" * 40)

    # SECTORES - IDs incorrects
    print("\nsectores.json:")
    sectores_issues = []
    for i, entry in enumerate(files['sectores']):
        if not re.match(r"^S-\d{3}$", entry.get('id', '')):
            sectores_issues.append({
                'position': i,
                'id': entry.get('id'),
                'problem': 'Format ID incorrect (attendu: S-XXX)'
            })

    print(f"  Problemes d'ID: {len(sectores_issues)}")
    for issue in sectores_issues:
        print(f"    - Position {issue['position']}: '{issue['id']}' - {issue['problem']}")

    # Doublons dans sectores
    ids_seen = {}
    duplicates = []
    for i, entry in enumerate(files['sectores']):
        entry_id = entry.get('id')
        if entry_id in ids_seen:
            duplicates.append(f"ID '{entry_id}' aux positions {ids_seen[entry_id]} et {i}")
        else:
            ids_seen[entry_id] = i

    if duplicates:
        print(f"  Doublons: {len(duplicates)}")
        for dup in duplicates:
            print(f"    - {dup}")

    # CATEGORIAS - Traductions incorrectes
    print("\ncategorias.json:")
    translation_errors = []
    for i, entry in enumerate(files['categorias']):
        es_text = entry.get("nombre_es", "")
        fr_text = entry.get("nombre_fr", "")
        en_text = entry.get("nombre_en", "")

        # Detecter les traductions template incorrectes
        if (es_text and isinstance(es_text, str) and
            fr_text == "SERVICE D'ETAT CIVIL" and
            en_text == "CIVIL REGISTRY SERVICE" and
            "CIVIL" not in es_text.upper() and
            "ESTADO CIVIL" not in es_text.upper()):

            translation_errors.append({
                'id': entry.get('id'),
                'position': i,
                'spanish': es_text,
                'problem': 'Traduction FR/EN ne correspond pas au texte ES'
            })

    print(f"  Erreurs de traduction: {len(translation_errors)}")
    for error in translation_errors[:5]:  # Afficher les 5 premiers
        print(f"    - {error['id']}: '{error['spanish'][:50]}...' -> Traduction incorrecte")

    # IDs incorrects dans categorias
    categorias_id_issues = []
    for i, entry in enumerate(files['categorias']):
        entry_id = entry.get('id', '')
        if not re.match(r"^C-\d{3}$", entry_id):
            categorias_id_issues.append({
                'position': i,
                'id': entry_id,
                'problem': 'Format ID incorrect (attendu: C-XXX)'
            })

    if categorias_id_issues:
        print(f"  Problemes d'ID: {len(categorias_id_issues)}")
        for issue in categorias_id_issues[:3]:
            print(f"    - Position {issue['position']}: '{issue['id']}' - {issue['problem']}")

    # SUB_CATEGORIAS - Traductions manquantes massives
    print("\nsub_categorias.json:")
    missing_translations = 0
    for entry in files['sub_categorias']:
        if (entry.get('nombre_es') is None and
            entry.get('nombre_fr') is None and
            entry.get('nombre_en') is None):
            missing_translations += 1

    print(f"  Enregistrements sans traductions: {missing_translations}")
    print(f"  Pourcentage incomplet: {(missing_translations/len(files['sub_categorias']))*100:.1f}%")

    # TAXES - Doublons
    print("\ntaxes.json:")
    taxes_ids = {}
    taxes_duplicates = []
    for i, entry in enumerate(files['taxes']):
        entry_id = entry.get('id')
        if entry_id in taxes_ids:
            taxes_duplicates.append(f"ID '{entry_id}' aux positions {taxes_ids[entry_id]} et {i}")
        else:
            taxes_ids[entry_id] = i

    if taxes_duplicates:
        print(f"  Doublons detectes: {len(taxes_duplicates)}")
        for dup in taxes_duplicates:
            print(f"    - {dup}")

    # 4. COHERENCE DES CLES ETRANGERES
    print("\n4. COHERENCE DES CLES ETRANGERES")
    print("-" * 40)

    # Secteurs -> Ministères
    ministerio_ids = {entry.get('id') for entry in files['ministerios']}
    broken_sectores = []
    for entry in files['sectores']:
        if entry.get('ministerio_id') not in ministerio_ids:
            broken_sectores.append(f"{entry.get('id')} -> ministerio_id: {entry.get('ministerio_id')}")

    if broken_sectores:
        print(f"sectores -> ministerios: {len(broken_sectores)} references cassees")
        for ref in broken_sectores[:3]:
            print(f"  - {ref}")

    # Catégories -> Secteurs
    sector_ids = {entry.get('id') for entry in files['sectores']}
    broken_categorias = []
    for entry in files['categorias']:
        if entry.get('sector_id') not in sector_ids:
            broken_categorias.append(f"{entry.get('id')} -> sector_id: {entry.get('sector_id')}")

    if broken_categorias:
        print(f"categorias -> sectores: {len(broken_categorias)} references cassees")
        for ref in broken_categorias[:3]:
            print(f"  - {ref}")

    # Sous-catégories -> Catégories
    categoria_ids = {entry.get('id') for entry in files['categorias']}
    broken_subcategorias = []
    for entry in files['sub_categorias']:
        if entry.get('categoria_id') not in categoria_ids:
            broken_subcategorias.append(f"{entry.get('id')} -> categoria_id: {entry.get('categoria_id')}")

    if broken_subcategorias:
        print(f"sub_categorias -> categorias: {len(broken_subcategorias)} references cassees")
        for ref in broken_subcategorias[:3]:
            print(f"  - {ref}")

    # Taxes -> Sous-catégories
    subcategoria_ids = {entry.get('id') for entry in files['sub_categorias']}
    broken_taxes = []
    for entry in files['taxes']:
        if entry.get('sub_categoria_id') not in subcategoria_ids:
            broken_taxes.append(f"{entry.get('id')} -> sub_categoria_id: {entry.get('sub_categoria_id')}")

    if broken_taxes:
        print(f"taxes -> sub_categorias: {len(broken_taxes)} references cassees")
        for ref in broken_taxes[:5]:
            print(f"  - {ref}")

    # 5. ANALYSE DES TARIFS
    print("\n5. ANALYSE DES TARIFS (taxes.json)")
    print("-" * 40)

    tarifs_expedicion = [entry.get('tasa_expedicion', 0) for entry in files['taxes'] if entry.get('tasa_expedicion') is not None]
    tarifs_renovacion = [entry.get('tasa_renovacion', 0) for entry in files['taxes'] if entry.get('tasa_renovacion') is not None]

    print(f"Tarifs d'expedition:")
    print(f"  Minimum: {min(tarifs_expedicion) if tarifs_expedicion else 'N/A'}")
    print(f"  Maximum: {max(tarifs_expedicion) if tarifs_expedicion else 'N/A'}")
    print(f"  Moyenne: {sum(tarifs_expedicion)/len(tarifs_expedicion):.2f}" if tarifs_expedicion else "N/A")

    print(f"Tarifs de renovation:")
    print(f"  Minimum: {min(tarifs_renovacion) if tarifs_renovacion else 'N/A'}")
    print(f"  Maximum: {max(tarifs_renovacion) if tarifs_renovacion else 'N/A'}")
    print(f"  Moyenne: {sum(tarifs_renovacion)/len(tarifs_renovacion):.2f}" if tarifs_renovacion else "N/A")

    # Taxes gratuites
    free_taxes = [entry for entry in files['taxes'] if entry.get('tasa_expedicion') == 0]
    print(f"Taxes gratuites: {len(free_taxes)}")

    # 6. RESUME ET PRIORITES
    print("\n6. RESUME ET PRIORITES D'ACTION")
    print("-" * 40)

    critical_count = len(translation_errors) + missing_translations + len(taxes_duplicates) + len(broken_taxes)

    print(f"SCORE DE QUALITE GLOBAL:")
    print(f"  Problemes critiques detectes: {critical_count}")
    print(f"  Qualite estimee: {max(0, 100 - (critical_count/total_records)*100):.1f}%")

    print(f"\nPRIORITES D'ACTION:")
    print(f"1. URGENT - Completer {missing_translations} traductions manquantes dans sub_categorias.json")
    print(f"2. URGENT - Corriger {len(translation_errors)} traductions incorrectes dans categorias.json")
    print(f"3. IMPORTANT - Eliminer {len(taxes_duplicates)} doublons dans taxes.json")
    print(f"4. IMPORTANT - Corriger {len(broken_taxes)} references cassees taxes -> sub_categorias")
    print(f"5. MOYEN - Standardiser les formats d'ID dans sectores.json et categorias.json")

if __name__ == "__main__":
    data_directory = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"
    analyze_detailed_issues(data_directory)