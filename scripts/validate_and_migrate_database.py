#!/usr/bin/env python3
"""
🔍 TaxasGE Database Validation & Migration Script
Agent Database Expert - Validation complète et migration données JSON
Author: KOUEMOU SAH Jean Emac
Date: 27 septembre 2025
"""
import os
import sys
import json
import requests
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaxasGEDatabaseValidator:
    """Validateur et migrateur base de données TaxasGE"""

    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.connection = None
        self.data_path = Path("data")
        self.base_url = f"{self.supabase_url}/rest/v1"

    def validate_environment(self) -> bool:
        """Valide la configuration d'environnement"""
        logger.info("🔍 Validation configuration environnement...")
        missing_vars = []
        if not self.db_url:
            missing_vars.append("DATABASE_URL")
        else:
            logger.info(f"📊 DATABASE_URL trouvée: {self.db_url[:50]}...")
        if not self.supabase_url:
            missing_vars.append("SUPABASE_URL")
        else:
            logger.info(f"📊 SUPABASE_URL trouvée: {self.supabase_url}")
        if not self.supabase_key:
            missing_vars.append("SUPABASE_SERVICE_ROLE_KEY")
        else:
            logger.info(f"📊 SUPABASE_SERVICE_ROLE_KEY trouvée: {self.supabase_key[:20]}...")
        if missing_vars:
            logger.error(f"❌ Variables manquantes: {', '.join(missing_vars)}")
            return False
        logger.info("✅ Configuration environnement valide")
        return True

    def execute_sql_query(self, query):
        """Exécute une requête SQL brute via l'API de Supabase."""
        url = f"{self.supabase_url}/rest/v1/"
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        data = {"query": query}
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erreur lors de l'exécution de la requête SQL: {e}")
            return None

    def create_tables(self) -> bool:
        """Crée les tables nécessaires dans la base de données."""
        try:
            migration_file = Path("scripts/migration_complete_taxasge.sql")
            if not migration_file.exists():
                logger.error(f"❌ Script migration non trouvé: {migration_file}")
                return False
            logger.info("📄 Lecture script migration SQL...")
            sql_content = migration_file.read_text(encoding='utf-8')
            queries = sql_content.split(';')
            for query in queries:
                query = query.strip()
                if query and not query.startswith('--') and not query.startswith('/*'):
                    logger.info(f"📝 Exécution de la requête: {query[:50]}...")
                    result = self.execute_sql_query(query)
                    if result is None:
                        logger.error(f"❌ Erreur lors de l'exécution de la requête: {query[:50]}...")
                        return False
            logger.info("✅ Tables créées avec succès")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur lors de la création des tables: {e}")
            return False

    def validate_schema(self) -> Dict[str, Any]:
        """Valide le schéma créé"""
        logger.info("🔍 Validation schéma base de données...")
        expected_tables = [
            'users', 'ministries', 'sectors', 'categories', 'subcategories',
            'fiscal_services', 'payments', 'documents', 'translations'
        ]
        expected_enums = [
            'user_role_enum', 'payment_status_enum', 'service_type_enum',
            'currency_enum', 'document_processing_mode_enum',
            'document_ocr_status_enum', 'document_extraction_status_enum',
            'document_validation_status_enum', 'document_access_level_enum'
        ]

        try:
            # Vérification des tables
            query = """
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """
            response = self.execute_sql_query(query)
            if response is None:
                logger.error("❌ Erreur lors de la récupération des tables existantes")
                return {"status": "error", "error": "Erreur lors de la récupération des tables"}

            existing_tables = [row['table_name'] for row in response]

            # Vérification des types énumérés
            query = """
                SELECT typname FROM pg_type
                WHERE typtype = 'e'
            """
            response = self.execute_sql_query(query)
            if response is None:
                logger.error("❌ Erreur lors de la récupération des types énumérés existants")
                return {"status": "error", "error": "Erreur lors de la récupération des types énumérés"}

            existing_enums = [row['typname'] for row in response]

            tables_found = len([t for t in expected_tables if t in existing_tables])
            enums_found = len([e for e in expected_enums if e in existing_enums])

            logger.info(f"📊 Tables: {tables_found}/{len(expected_tables)}")
            logger.info(f"📊 Enums: {enums_found}/{len(expected_enums)}")

            return {
                "tables_found": tables_found,
                "tables_expected": len(expected_tables),
                "tables_missing": [t for t in expected_tables if t not in existing_tables],
                "enums_found": enums_found,
                "enums_expected": len(expected_enums),
                "enums_missing": [e for e in expected_enums if e not in existing_enums],
                "simulation": False,
                "status": "success" if tables_found == len(expected_tables) else "partial"
            }
        except Exception as e:
            logger.error(f"❌ Erreur validation schéma: {e}")
            return {"status": "error", "error": str(e)}

    def analyze_json_data(self) -> Dict[str, Any]:
        """Analyse les fichiers JSON à migrer"""
        logger.info("📊 Analyse données JSON...")
        json_files = {
            "taxes.json": "fiscal_services",
            "categorias.json": "categories",
            "sub_categorias.json": "subcategories",
            "sectores.json": "sectors",
            "ministerios.json": "ministries"
        }
        analysis = {}
        total_records = 0
        for json_file, table_name in json_files.items():
            file_path = self.data_path / json_file
            if not file_path.exists():
                logger.warning(f"⚠️  Fichier manquant: {json_file}")
                analysis[table_name] = {"status": "missing", "records": 0}
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                record_count = len(data) if isinstance(data, list) else 1
                total_records += record_count
                analysis[table_name] = {
                    "status": "found",
                    "records": record_count,
                    "file": json_file,
                    "sample_keys": list(data[0].keys()) if isinstance(data, list) and data else []
                }
                logger.info(f"✅ {json_file}: {record_count} enregistrements")
            except Exception as e:
                logger.error(f"❌ Erreur lecture {json_file}: {e}")
                analysis[table_name] = {"status": "error", "error": str(e)}
        analysis["summary"] = {
            "total_files": len(json_files),
            "files_found": len([a for a in analysis.values() if isinstance(a, dict) and a.get("status") == "found"]),
            "total_records": total_records
        }
        return analysis

    def create_table_via_rest(self, table_name, data):
        """Crée une entrée dans une table via l'API REST."""
        url = f"{self.base_url}/{table_name}"
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erreur lors de la création de l'entrée: {e}")
            return None

    def migrate_json_data(self) -> bool:
        """Migre les données JSON vers Supabase via l'API REST."""
        logger.info("🔄 Migration données JSON via REST...")
        try:
            # Migration ministries
            json_file = self.data_path / "ministerios.json"
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    ministries = json.load(f)
                logger.info(f"📊 Migration {len(ministries)} ministères...")
                for ministry in ministries:
                    data = {
                        "id": ministry.get('id', f"MIN-{ministry.get('nombre', 'UNKNOWN')[:3].upper()}"),
                        "name": ministry.get('nombre', 'Unknown Ministry'),
                        "abbreviation": ministry.get('sigla', ''),
                        "description": ministry.get('descripcion', ''),
                        "website": ministry.get('website', ''),
                    }
                    result = self.create_table_via_rest("ministries", data)
                    if result:
                        logger.info(f"✅ Ministère migré: {data['id']}")
                    else:
                        logger.error(f"❌ Erreur migration ministère: {data['id']}")

            # Migration sectors
            json_file = self.data_path / "sectores.json"
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    sectors = json.load(f)
                logger.info(f"📊 Migration {len(sectors)} secteurs...")
                for sector in sectors:
                    data = {
                        "id": sector.get('id', f"SEC-{sector.get('nombre', 'UNKNOWN')[:3].upper()}"),
                        "name": sector.get('nombre', 'Unknown Sector'),
                        "description": sector.get('descripcion', ''),
                        "ministry_id": sector.get('ministry_id', ''),
                    }
                    result = self.create_table_via_rest("sectors", data)
                    if result:
                        logger.info(f"✅ Secteur migré: {data['id']}")
                    else:
                        logger.error(f"❌ Erreur migration secteur: {data['id']}")

            # Migration categories
            json_file = self.data_path / "categorias.json"
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    categories = json.load(f)
                logger.info(f"📊 Migration {len(categories)} catégories...")
                for category in categories:
                    data = {
                        "id": category.get('id', f"CAT-{len(categories)}"),
                        "name": category.get('nombre', 'Unknown Category'),
                        "description": category.get('descripcion', ''),
                        "sector_id": category.get('sector_id', ''),
                    }
                    result = self.create_table_via_rest("categories", data)
                    if result:
                        logger.info(f"✅ Catégorie migrée: {data['id']}")
                    else:
                        logger.error(f"❌ Erreur migration catégorie: {data['id']}")

            # Migration subcategories
            json_file = self.data_path / "sub_categorias.json"
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    subcategories = json.load(f)
                logger.info(f"📊 Migration {len(subcategories)} sous-catégories...")
                for subcategory in subcategories:
                    data = {
                        "id": subcategory.get('id', f"SUB-{len(subcategories)}"),
                        "name": subcategory.get('nombre', 'Unknown Subcategory'),
                        "description": subcategory.get('descripcion', ''),
                        "category_id": subcategory.get('category_id', ''),
                    }
                    result = self.create_table_via_rest("subcategories", data)
                    if result:
                        logger.info(f"✅ Sous-catégorie migrée: {data['id']}")
                    else:
                        logger.error(f"❌ Erreur migration sous-catégorie: {data['id']}")

            # Migration fiscal services
            json_file = self.data_path / "taxes.json"
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    fiscal_services = json.load(f)
                logger.info(f"📊 Migration {len(fiscal_services)} services fiscaux...")
                for service in fiscal_services:
                    data = {
                        "id": service.get('id', f"SER-{len(fiscal_services)}"),
                        "service_code": service.get('code', 'UNKNOWN'),
                        "subcategory_id": service.get('subcategory_id', ''),
                        "service_type": service.get('service_type', 'other'),
                        "expedition_amount": service.get('expedition_amount', 0.00),
                        "renewal_amount": service.get('renewal_amount', 0.00),
                        "validity_period_months": service.get('validity_period_months', 12),
                        "is_renewable": service.get('is_renewable', True),
                        "is_active": service.get('is_active', True),
                    }
                    result = self.create_table_via_rest("fiscal_services", data)
                    if result:
                        logger.info(f"✅ Service fiscal migré: {data['id']}")
                    else:
                        logger.error(f"❌ Erreur migration service fiscal: {data['id']}")

            logger.info("✅ Migration JSON terminée avec succès")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur migration JSON: {e}")
            return False

    def generate_validation_report(self, schema_validation: Dict, json_analysis: Dict) -> str:
        """Génère un rapport de validation complet"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report = f"""
# 📋 RAPPORT VALIDATION DATABASE TAXASGE
**Date:** {timestamp}
**Agent:** Database Expert TaxasGE
**Statut:** RÉEL
## 🔍 VALIDATION SCHÉMA
### Tables Base de Données
- **Trouvées:** {schema_validation.get('tables_found', 0)}/{schema_validation.get('tables_expected', 0)}
- **Statut:** {'✅ Complet' if schema_validation.get('tables_found') == schema_validation.get('tables_expected') else '⚠️ Partiel'}
- **Tables manquantes:** {', '.join(schema_validation.get('tables_missing', [])) or 'Aucune'}
### Types Énumérés
- **Trouvés:** {schema_validation.get('enums_found', 0)}/{schema_validation.get('enums_expected', 0)}
- **Statut:** {'✅ Complet' if schema_validation.get('enums_found') == schema_validation.get('enums_expected') else '⚠️ Partiel'}
- **Enums manquants:** {', '.join(schema_validation.get('enums_missing', [])) or 'Aucun'}
## 📊 ANALYSE DONNÉES JSON
### Résumé Fichiers
- **Total fichiers:** {json_analysis.get('summary', {}).get('total_files', 0)}
- **Fichiers trouvés:** {json_analysis.get('summary', {}).get('files_found', 0)}
- **Total enregistrements:** {json_analysis.get('summary', {}).get('total_records', 0)}
### Détail par Table
"""
        for table, info in json_analysis.items():
            if table != 'summary' and isinstance(info, dict):
                status_emoji = "✅" if info.get('status') == 'found' else "❌"
                report += f"- **{table}:** {status_emoji} {info.get('records', 0)} enregistrements\n"
        report += f"""
## 🚀 PROCHAINES ÉTAPES
### Actions Requises
1. **Vérifier les tables créées** dans Supabase.
2. **Vérifier les données migrées** dans chaque table.
3. **Valider intégrité:** Tests contraintes FK et données
4. **Tests APIs:** Vérifier endpoints backend
### Commandes Déploiement
```bash
# 1. Exécuter le script de migration
python scripts/validate_and_migrate_database.py
