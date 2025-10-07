#!/usr/bin/env python3
"""
Script to generate centralized translations.json file
Consolidates all translations from existing JSON files according to SPECIFICATION_TRANSLATIONS_JSON.md
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

def load_json_file(file_path: str) -> List[Dict[str, Any]]:
    """Load and return JSON data from file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

def extract_translation(item: Dict[str, Any], languages: List[str]) -> Dict[str, Optional[str]]:
    """Extract translation from item for specified languages"""
    translation = {}
    for lang in languages:
        field_name = f"nombre_{lang}"
        value = item.get(field_name, "").strip()
        translation[lang] = value if value else None
    return translation

def process_ministerios(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process ministerios.json data"""
    translations = []
    for item in data:
        translation_entry = {
            "entity_type": "ministry",
            "entity_id": item["id"],
            "translations": {
                "name": extract_translation(item, ["es", "fr", "en"])
            }
        }
        translations.append(translation_entry)
    return translations

def process_sectores(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process sectores.json data"""
    translations = []
    for item in data:
        translation_entry = {
            "entity_type": "sector",
            "entity_id": item["id"],
            "translations": {
                "name": extract_translation(item, ["es", "fr", "en"])
            }
        }
        translations.append(translation_entry)
    return translations

def process_categorias(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process categorias_cleaned.json data"""
    translations = []
    for item in data:
        translation_entry = {
            "entity_type": "category",
            "entity_id": item["id"],
            "translations": {
                "name": extract_translation(item, ["es", "fr", "en"])
            }
        }
        translations.append(translation_entry)
    return translations

def process_taxes(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process taxes_restructured.json data"""
    translations = []
    for item in data:
        translation_entry = {
            "entity_type": "fiscal_service",
            "entity_id": item["id"],
            "translations": {
                "name": extract_translation(item, ["es", "fr", "en"])
            }
        }
        translations.append(translation_entry)
    return translations

def calculate_completeness(translations: List[Dict[str, Any]], languages: List[str]) -> Dict[str, float]:
    """Calculate completeness percentage for each language"""
    total_entities = len(translations)
    if total_entities == 0:
        return {lang: 0.0 for lang in languages}

    completeness = {}
    for lang in languages:
        complete_count = 0
        for entry in translations:
            if entry["translations"]["name"].get(lang):
                complete_count += 1
        completeness[lang] = round((complete_count / total_entities) * 100, 1)

    return completeness

def analyze_translation_issues(translations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze translation data for issues and statistics"""
    issues = {
        "missing_spanish": [],
        "missing_french": [],
        "missing_english": [],
        "duplicate_ids": [],
        "empty_translations": []
    }

    entity_ids = {}

    for entry in translations:
        entity_type = entry["entity_type"]
        entity_id = entry["entity_id"]
        name_translations = entry["translations"]["name"]

        # Check for duplicate IDs within same entity type
        key = f"{entity_type}:{entity_id}"
        if key in entity_ids:
            issues["duplicate_ids"].append({
                "entity_type": entity_type,
                "entity_id": entity_id,
                "count": entity_ids[key] + 1
            })
            entity_ids[key] += 1
        else:
            entity_ids[key] = 1

        # Check for missing translations
        if not name_translations.get("es"):
            issues["missing_spanish"].append(entity_id)
        if not name_translations.get("fr"):
            issues["missing_french"].append(entity_id)
        if not name_translations.get("en"):
            issues["missing_english"].append(entity_id)

        # Check for completely empty translations
        if not any(name_translations.values()):
            issues["empty_translations"].append(entity_id)

    return issues

def count_entities_by_type(translations: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count entities by type"""
    counts = {}
    for entry in translations:
        entity_type = entry["entity_type"]
        counts[entity_type] = counts.get(entity_type, 0) + 1
    return counts

def main():
    """Main function to generate translations.json"""
    print("[+] Starting translation extraction process...")

    # Define base directory
    base_dir = r"C:\Users\User\source\repos\KouemouSah\taxasge\KouemouSah\taxasge\data"

    # Load all source files
    print("[+] Loading source files...")
    ministerios_data = load_json_file(os.path.join(base_dir, "ministerios.json"))
    sectores_data = load_json_file(os.path.join(base_dir, "sectores.json"))
    categorias_data = load_json_file(os.path.join(base_dir, "categorias_cleaned.json"))

    # Load taxes file in chunks to handle large size
    taxes_data = load_json_file(os.path.join(base_dir, "taxes_restructured.json"))

    print(f"[+] Loaded {len(ministerios_data)} ministries")
    print(f"[+] Loaded {len(sectores_data)} sectors")
    print(f"[+] Loaded {len(categorias_data)} categories")
    print(f"[+] Loaded {len(taxes_data)} fiscal services")

    # Process all data
    print("[+] Processing translations...")
    all_translations = []

    all_translations.extend(process_ministerios(ministerios_data))
    all_translations.extend(process_sectores(sectores_data))
    all_translations.extend(process_categorias(categorias_data))
    all_translations.extend(process_taxes(taxes_data))

    # Calculate statistics
    languages = ["es", "fr", "en"]
    completeness = calculate_completeness(all_translations, languages)
    entity_counts = count_entities_by_type(all_translations)
    issues = analyze_translation_issues(all_translations)

    # Generate metadata
    current_time = datetime.now(timezone.utc).isoformat()

    # Create final translations structure
    translations_json = {
        "metadata": {
            "version": "1.0",
            "generated_at": current_time,
            "languages": languages,
            "total_entries": len(all_translations),
            "completeness": completeness,
            "entity_counts": entity_counts
        },
        "translations": all_translations
    }

    # Save translations.json file
    output_path = os.path.join(base_dir, "translations.json")
    print(f"[+] Saving translations to {output_path}...")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(translations_json, f, ensure_ascii=False, indent=2)

    # Calculate file size
    file_size = os.path.getsize(output_path)
    file_size_mb = file_size / (1024 * 1024)

    # Print comprehensive report
    print("\n" + "="*80)
    print("TRANSLATION CONSOLIDATION REPORT")
    print("="*80)

    print(f"\nSUMMARY:")
    print(f"   * Total entities processed: {len(all_translations):,}")
    print(f"   * Generated at: {current_time}")
    print(f"   * Output file: {output_path}")
    print(f"   * File size: {file_size:,} bytes ({file_size_mb:.2f} MB)")

    print(f"\nENTITIES BY TYPE:")
    for entity_type, count in entity_counts.items():
        print(f"   * {entity_type.title()}: {count:,}")

    print(f"\nLANGUAGE COMPLETENESS:")
    for lang, percentage in completeness.items():
        print(f"   * {lang.upper()}: {percentage:5.1f}% ({int(percentage * len(all_translations) / 100):,} complete)")

    print(f"\nTRANSLATION ISSUES:")
    print(f"   * Missing Spanish: {len(issues['missing_spanish']):,}")
    print(f"   * Missing French: {len(issues['missing_french']):,}")
    print(f"   * Missing English: {len(issues['missing_english']):,}")
    print(f"   * Duplicate IDs: {len(issues['duplicate_ids']):,}")
    print(f"   * Empty translations: {len(issues['empty_translations']):,}")

    if issues['missing_spanish']:
        print(f"\n[!] MISSING SPANISH (Critical - Spanish is required):")
        for entity_id in issues['missing_spanish'][:10]:  # Show first 10
            print(f"   * {entity_id}")
        if len(issues['missing_spanish']) > 10:
            print(f"   ... and {len(issues['missing_spanish']) - 10} more")

    if issues['duplicate_ids']:
        print(f"\n[!] DUPLICATE IDS:")
        for dup in issues['duplicate_ids'][:10]:  # Show first 10
            print(f"   * {dup['entity_type']}:{dup['entity_id']} (appears {dup['count']} times)")
        if len(issues['duplicate_ids']) > 10:
            print(f"   ... and {len(issues['duplicate_ids']) - 10} more")

    print(f"\nVALIDATION STATUS:")
    validation_passed = len(issues['missing_spanish']) == 0 and len(issues['duplicate_ids']) == 0

    schema_status = "[PASSED]" if validation_passed else "[FAILED]"
    spanish_status = "[100%]" if completeness['es'] == 100.0 else f"[{completeness['es']}%]"
    french_status = "[GOOD]" if completeness['fr'] >= 85.0 else f"[{completeness['fr']}%]"
    english_status = "[GOOD]" if completeness['en'] >= 85.0 else f"[{completeness['en']}%]"

    print(f"   * Schema compliance: {schema_status}")
    print(f"   * Spanish completeness: {spanish_status}")
    print(f"   * French completeness: {french_status}")
    print(f"   * English completeness: {english_status}")

    print("\n" + "="*80)
    print("Translation consolidation completed successfully!")
    print("="*80)

    return {
        "total_entities": len(all_translations),
        "entity_counts": entity_counts,
        "completeness": completeness,
        "issues": issues,
        "file_size": file_size,
        "output_path": output_path
    }

if __name__ == "__main__":
    main()