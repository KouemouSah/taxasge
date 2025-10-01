"""
JSON to PostgreSQL Migration Script for TaxasGE
Intelligent migration with data inference and validation
"""

import json
import asyncio
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from uuid import uuid4, UUID
from decimal import Decimal
from datetime import datetime
from loguru import logger

# Add the backend directory to Python path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.core.database import database_manager
from app.services.translation_service import translation_service
from app.models.tax import (
    ServiceTypeEnum, CalculationMethodEnum, Ministry, Sector, Category,
    Subcategory, FiscalService, RequiredDocument, Procedure, Keyword
)


class TaxasGEMigrator:
    """Intelligent migrator for TaxasGE JSON data to PostgreSQL"""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.db = database_manager
        self.translation_service = translation_service

        # Mapping dictionaries for UUID resolution
        self.ministry_mapping: Dict[str, UUID] = {}
        self.sector_mapping: Dict[str, UUID] = {}
        self.category_mapping: Dict[str, UUID] = {}
        self.subcategory_mapping: Dict[str, UUID] = {}
        self.fiscal_service_mapping: Dict[str, UUID] = {}

        # Statistics
        self.stats = {
            "ministries": {"created": 0, "errors": 0},
            "sectors": {"created": 0, "errors": 0},
            "categories": {"created": 0, "errors": 0},
            "subcategories": {"created": 0, "errors": 0, "inferred": 0},
            "fiscal_services": {"created": 0, "errors": 0},
            "documents": {"created": 0, "errors": 0},
            "procedures": {"created": 0, "errors": 0},
            "keywords": {"created": 0, "errors": 0}
        }

    async def migrate(self) -> bool:
        """Execute complete migration process"""
        try:
            logger.info("🚀 Starting TaxasGE JSON to PostgreSQL migration")

            # Initialize database connection
            await self.db.initialize()

            # Step 1: Load and validate JSON data
            logger.info("📂 Loading JSON data files")
            json_data = await self._load_json_data()

            # Step 2: Migrate hierarchical entities
            logger.info("🏛️ Migrating ministries")
            await self._migrate_ministries(json_data["ministerios"])

            logger.info("🏢 Migrating sectors")
            await self._migrate_sectors(json_data["sectores"])

            logger.info("📁 Migrating categories")
            await self._migrate_categories(json_data["categorias"])

            logger.info("🗂️ Migrating subcategories")
            await self._migrate_subcategories(json_data["sub_categorias"])

            # Step 3: Migrate fiscal services
            logger.info("💼 Migrating fiscal services")
            await self._migrate_fiscal_services(json_data["taxes"])

            # Step 4: Migrate supporting data
            logger.info("📄 Migrating required documents")
            await self._migrate_documents(json_data["documentos_requeridos"])

            logger.info("📋 Migrating procedures")
            await self._migrate_procedures(json_data["procedimientos"])

            logger.info("🔍 Migrating keywords")
            await self._migrate_keywords(json_data["palabras_clave"])

            # Step 5: Generate migration report
            self._generate_migration_report()

            logger.success("✅ Migration completed successfully!")
            return True

        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False
        finally:
            await self.db.close()

    async def _load_json_data(self) -> Dict[str, List[Dict]]:
        """Load all JSON data files"""
        json_files = {
            "ministerios": "ministerios.json",
            "sectores": "sectores.json",
            "categorias": "categorias.json",
            "sub_categorias": "sub_categorias.json",
            "taxes": "taxes.json",
            "documentos_requeridos": "documentos_requeridos.json",
            "procedimientos": "procedimientos.json",
            "palabras_clave": "palabras_clave.json"
        }

        data = {}
        for key, filename in json_files.items():
            file_path = self.data_dir / filename
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    data[key] = json.load(f)
                logger.info(f"✅ Loaded {len(data[key])} entries from {filename}")
            else:
                logger.warning(f"⚠️ File not found: {filename}")
                data[key] = []

        return data

    async def _migrate_ministries(self, ministries_data: List[Dict]) -> None:
        """Migrate ministries with translations"""
        for ministry_data in ministries_data:
            try:
                ministry_id = uuid4()
                ministry_code = ministry_data["id"]

                # Create ministry record
                ministry = Ministry(
                    id=ministry_id,
                    ministry_code=ministry_code,
                    is_active=True
                )

                # Save ministry
                await self._save_ministry(ministry)

                # Create translations
                translations = {
                    "es": ministry_data.get("nombre_es", ""),
                    "fr": ministry_data.get("nombre_fr", ""),
                    "en": ministry_data.get("nombre_en", "")
                }

                name_translation_id = await self.translation_service.create_translation_set(
                    entity_type="ministry",
                    entity_id=ministry_id,
                    field_name="name",
                    translations=translations
                )

                # Update ministry with translation reference
                await self._update_ministry_translation_id(ministry_id, name_translation_id)

                # Store mapping
                self.ministry_mapping[ministry_code] = ministry_id
                self.stats["ministries"]["created"] += 1

            except Exception as e:
                logger.error(f"Error migrating ministry {ministry_data.get('id', 'unknown')}: {e}")
                self.stats["ministries"]["errors"] += 1

    async def _migrate_sectors(self, sectors_data: List[Dict]) -> None:
        """Migrate sectors with special handling for anomalies"""
        for sector_data in sectors_data:
            try:
                sector_id = uuid4()
                sector_code = sector_data["id"]
                ministry_code = sector_data["ministerio_id"]

                # Handle anomalous entries (categories in sectors file)
                if sector_code.startswith("C-"):
                    logger.warning(f"⚠️ Found category {sector_code} in sectors file, treating as special category")
                    await self._handle_anomalous_category(sector_data)
                    continue

                # Get ministry UUID
                ministry_id = self.ministry_mapping.get(ministry_code)
                if not ministry_id:
                    logger.error(f"Ministry {ministry_code} not found for sector {sector_code}")
                    self.stats["sectors"]["errors"] += 1
                    continue

                # Create sector
                sector = Sector(
                    id=sector_id,
                    sector_code=sector_code,
                    ministry_id=ministry_id,
                    is_active=True
                )

                await self._save_sector(sector)

                # Create translations
                translations = {
                    "es": sector_data.get("nombre_es", ""),
                    "fr": sector_data.get("nombre_fr", ""),
                    "en": sector_data.get("nombre_en", "")
                }

                name_translation_id = await self.translation_service.create_translation_set(
                    entity_type="sector",
                    entity_id=sector_id,
                    field_name="name",
                    translations=translations
                )

                await self._update_sector_translation_id(sector_id, name_translation_id)

                self.sector_mapping[sector_code] = sector_id
                self.stats["sectors"]["created"] += 1

            except Exception as e:
                logger.error(f"Error migrating sector {sector_data.get('id', 'unknown')}: {e}")
                self.stats["sectors"]["errors"] += 1

    async def _migrate_categories(self, categories_data: List[Dict]) -> None:
        """Migrate categories"""
        for category_data in categories_data:
            try:
                category_id = uuid4()
                category_code = category_data["id"]
                sector_code = category_data["sector_id"]

                # Get sector UUID
                sector_id = self.sector_mapping.get(sector_code)
                if not sector_id:
                    logger.error(f"Sector {sector_code} not found for category {category_code}")
                    self.stats["categories"]["errors"] += 1
                    continue

                # Create category
                category = Category(
                    id=category_id,
                    category_code=category_code,
                    sector_id=sector_id,
                    is_active=True
                )

                await self._save_category(category)

                # Create translations
                translations = {
                    "es": category_data.get("nombre_es", ""),
                    "fr": category_data.get("nombre_fr", ""),
                    "en": category_data.get("nombre_en", "")
                }

                name_translation_id = await self.translation_service.create_translation_set(
                    entity_type="category",
                    entity_id=category_id,
                    field_name="name",
                    translations=translations
                )

                await self._update_category_translation_id(category_id, name_translation_id)

                self.category_mapping[category_code] = category_id
                self.stats["categories"]["created"] += 1

            except Exception as e:
                logger.error(f"Error migrating category {category_data.get('id', 'unknown')}: {e}")
                self.stats["categories"]["errors"] += 1

    async def _migrate_subcategories(self, subcategories_data: List[Dict]) -> None:
        """Migrate subcategories with intelligent inference for missing data"""
        for subcategory_data in subcategories_data:
            try:
                subcategory_id = uuid4()
                subcategory_code = subcategory_data["id"]
                category_code = subcategory_data.get("categoria_id", "")

                # Check if category exists
                category_id = self.category_mapping.get(category_code)
                if not category_id:
                    # Intelligent inference: try to infer category from subcategory code
                    inferred_category_code = self._infer_category_from_subcategory(subcategory_code)
                    category_id = self.category_mapping.get(inferred_category_code)

                    if not category_id:
                        logger.error(f"Category {category_code} not found for subcategory {subcategory_code}")
                        self.stats["subcategories"]["errors"] += 1
                        continue
                    else:
                        logger.info(f"📝 Inferred category {inferred_category_code} for subcategory {subcategory_code}")
                        self.stats["subcategories"]["inferred"] += 1

                # Create subcategory
                subcategory = Subcategory(
                    id=subcategory_id,
                    subcategory_code=subcategory_code,
                    category_id=category_id,
                    is_active=True
                )

                await self._save_subcategory(subcategory)

                # Handle translations (many entries have null names)
                translations = {}
                if subcategory_data.get("nombre_es"):
                    translations["es"] = subcategory_data["nombre_es"]
                if subcategory_data.get("nombre_fr"):
                    translations["fr"] = subcategory_data["nombre_fr"]
                if subcategory_data.get("nombre_en"):
                    translations["en"] = subcategory_data["nombre_en"]

                # If no translations exist, infer from subcategory code
                if not translations:
                    inferred_name = self._infer_subcategory_name(subcategory_code)
                    translations = {
                        "es": inferred_name,
                        "fr": inferred_name,
                        "en": inferred_name
                    }
                    logger.info(f"📝 Inferred name '{inferred_name}' for subcategory {subcategory_code}")
                    self.stats["subcategories"]["inferred"] += 1

                name_translation_id = await self.translation_service.create_translation_set(
                    entity_type="subcategory",
                    entity_id=subcategory_id,
                    field_name="name",
                    translations=translations
                )

                await self._update_subcategory_translation_id(subcategory_id, name_translation_id)

                self.subcategory_mapping[subcategory_code] = subcategory_id
                self.stats["subcategories"]["created"] += 1

            except Exception as e:
                logger.error(f"Error migrating subcategory {subcategory_data.get('id', 'unknown')}: {e}")
                self.stats["subcategories"]["errors"] += 1

    async def _migrate_fiscal_services(self, services_data: List[Dict]) -> None:
        """Migrate fiscal services with intelligent type and method inference"""
        for service_data in services_data:
            try:
                service_id = uuid4()
                service_code = service_data["id"]
                subcategory_code = service_data.get("sub_categoria_id", "")

                # Get subcategory UUID (optional)
                subcategory_id = self.subcategory_mapping.get(subcategory_code) if subcategory_code else None

                # Infer service type from name
                service_type = self._infer_service_type(service_data)

                # Determine calculation method
                calculation_method = self._infer_calculation_method(service_data)

                # Create fiscal service
                fiscal_service = FiscalService(
                    id=service_id,
                    service_code=service_code,
                    subcategory_id=subcategory_id,
                    service_type=service_type,
                    expedition_amount=Decimal(str(service_data.get("tasa_expedicion", 0))),
                    renewal_amount=Decimal(str(service_data.get("tasa_renovacion", 0))),
                    calculation_method=calculation_method,
                    is_online_available=True,
                    is_urgent_available=False,
                    is_active=True
                )

                await self._save_fiscal_service(fiscal_service)

                # Create translations
                translations = {
                    "es": service_data.get("nombre_es", ""),
                    "fr": service_data.get("nombre_fr", ""),
                    "en": service_data.get("nombre_en", "")
                }

                name_translation_id = await self.translation_service.create_translation_set(
                    entity_type="fiscal_service",
                    entity_id=service_id,
                    field_name="name",
                    translations=translations
                )

                await self._update_fiscal_service_translation_id(service_id, name_translation_id)

                self.fiscal_service_mapping[service_code] = service_id
                self.stats["fiscal_services"]["created"] += 1

            except Exception as e:
                logger.error(f"Error migrating fiscal service {service_data.get('id', 'unknown')}: {e}")
                self.stats["fiscal_services"]["errors"] += 1

    def _infer_service_type(self, service_data: Dict) -> ServiceTypeEnum:
        """Infer service type from service name and context"""
        name = (service_data.get("nombre_es", "") + " " + service_data.get("nombre_fr", "") + " " + service_data.get("nombre_en", "")).lower()

        if any(word in name for word in ["licencia", "license", "licence"]):
            return ServiceTypeEnum.license
        elif any(word in name for word in ["certificado", "certificate", "certificat"]):
            return ServiceTypeEnum.certificate
        elif any(word in name for word in ["registro", "registration", "enregistrement"]):
            return ServiceTypeEnum.registration
        elif any(word in name for word in ["autorización", "authorization", "autorisation"]):
            return ServiceTypeEnum.authorization
        elif any(word in name for word in ["validación", "validation"]):
            return ServiceTypeEnum.validation
        elif any(word in name for word in ["inspección", "inspection"]):
            return ServiceTypeEnum.inspection
        elif any(word in name for word in ["consulta", "consultation"]):
            return ServiceTypeEnum.consultation
        elif any(word in name for word in ["permiso", "permit"]):
            return ServiceTypeEnum.permit
        else:
            return ServiceTypeEnum.other

    def _infer_calculation_method(self, service_data: Dict) -> CalculationMethodEnum:
        """Infer calculation method from pricing structure"""
        expedition = float(service_data.get("tasa_expedicion", 0))
        renewal = float(service_data.get("tasa_renovacion", 0))

        # If both are 0, it might be a consultation or free service
        if expedition == 0 and renewal == 0:
            return CalculationMethodEnum.custom

        # Most services have fixed pricing
        return CalculationMethodEnum.fixed

    def _infer_category_from_subcategory(self, subcategory_code: str) -> Optional[str]:
        """Infer category code from subcategory code patterns"""
        # Simple heuristic: if subcategory starts with similar pattern
        if subcategory_code.startswith("SC-"):
            # Try to map to existing categories
            number_part = subcategory_code.replace("SC-", "")
            return f"C-{number_part[:3]}"
        return None

    def _infer_subcategory_name(self, subcategory_code: str) -> str:
        """Generate a reasonable name for subcategories with missing data"""
        return f"Subcategoría {subcategory_code}"

    async def _handle_anomalous_category(self, category_data: Dict) -> None:
        """Handle categories found in sectors file"""
        # This would create a category in the default sector or create a special handling
        logger.info(f"Handling anomalous category: {category_data['id']}")
        # Implementation depends on business rules

    # Database save methods would go here...
    # (Implementing the actual database operations)

    async def _save_ministry(self, ministry: Ministry) -> None:
        """Save ministry to database"""
        if self.db.use_postgresql:
            query = """
                INSERT INTO ministries (id, ministry_code, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5)
            """
            await self.db.connection.execute(
                query, ministry.id, ministry.ministry_code, ministry.is_active,
                ministry.created_at, ministry.updated_at
            )

    # ... (implement other save methods)

    def _generate_migration_report(self) -> None:
        """Generate comprehensive migration report"""
        logger.info("📊 Migration Statistics:")
        for entity, stats in self.stats.items():
            logger.info(f"  {entity.title()}: {stats['created']} created, {stats['errors']} errors" +
                       (f", {stats['inferred']} inferred" if 'inferred' in stats else ""))


async def main():
    """Main migration function"""
    migrator = TaxasGEMigrator()
    success = await migrator.migrate()

    if success:
        logger.success("🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        logger.error("💥 Migration failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())