"""
Entity Translation Service - Business logic for entity_translations

Handles:
- CRUD operations for ministry, sector, category translations
- Bulk operations
- Export/Import functionality
"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg

from ..models.entity_translation import (
    EntityTranslationCreate,
    EntityTranslationUpdate,
    EntityTranslationBulkCreate,
    EntityTranslationSearchParams,
)
from ..repositories.entity_translation_repository import EntityTranslationRepository


class EntityTranslationService:
    """Service for entity translation operations"""

    def __init__(self):
        self.repository = EntityTranslationRepository()

    async def create_translation(
        self,
        conn: asyncpg.Connection,
        translation: EntityTranslationCreate,
    ) -> Dict[str, Any]:
        """
        Create a single entity translation

        Args:
            conn: Database connection
            translation: Translation data

        Returns:
            Created translation
        """
        return await self.repository.create(
            conn,
            translation.entity_type.value,
            translation.entity_code,
            translation.language_code.value,
            translation.field_name,
            translation.translation_text,
            translation.translation_source or "manual",
            translation.translation_quality,
        )

    async def upsert_translation(
        self,
        conn: asyncpg.Connection,
        translation: EntityTranslationCreate,
    ) -> Dict[str, Any]:
        """
        Create or update entity translation

        Returns:
            Translation
        """
        return await self.repository.upsert(
            conn,
            translation.entity_type.value,
            translation.entity_code,
            translation.language_code.value,
            translation.field_name,
            translation.translation_text,
            translation.translation_source or "manual",
            translation.translation_quality,
        )

    async def get_translation_by_key(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_code: str,
        language_code: str,
        field_name: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get translation by composite key

        Returns:
            Translation or None
        """
        return await self.repository.get_by_key(
            conn, entity_type, entity_code, language_code, field_name
        )

    async def get_entity_all_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_code: str,
    ) -> Dict[str, Any]:
        """
        Get all translations for an entity, grouped by field

        Returns:
            {entity_type, entity_code, translations: {field: {es, fr, en}}}
        """
        grouped = await self.repository.get_grouped_translations(conn, entity_type, entity_code)
        return {
            "entity_type": entity_type,
            "entity_code": entity_code,
            "translations": grouped,
        }

    async def search_translations(
        self,
        conn: asyncpg.Connection,
        params: EntityTranslationSearchParams,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Search translations with filters

        Returns:
            Tuple of (translations, total count)
        """
        return await self.repository.search(
            conn,
            params.entity_type.value if params.entity_type else None,
            params.entity_code,
            params.language_code.value if params.language_code else None,
            params.field_name,
            params.search_term,
            params.limit,
            params.offset,
        )

    async def update_translation(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_code: str,
        language_code: str,
        field_name: str,
        update_data: EntityTranslationUpdate,
    ) -> Optional[Dict[str, Any]]:
        """
        Update entity translation

        Returns:
            Updated translation or None
        """
        return await self.repository.update(
            conn,
            entity_type,
            entity_code,
            language_code,
            field_name,
            update_data.translation_text,
            update_data.translation_source,
            update_data.translation_quality,
        )

    async def delete_translation(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_code: str,
        language_code: str,
        field_name: str,
    ) -> bool:
        """
        Delete a single translation

        Returns:
            True if deleted
        """
        return await self.repository.delete(
            conn, entity_type, entity_code, language_code, field_name
        )

    async def delete_entity_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_code: str,
    ) -> int:
        """
        Delete all translations for an entity

        Returns:
            Number of deleted translations
        """
        return await self.repository.delete_entity(conn, entity_type, entity_code)

    async def bulk_upsert(
        self,
        conn: asyncpg.Connection,
        batch: EntityTranslationBulkCreate,
    ) -> List[Dict[str, Any]]:
        """
        Bulk upsert translations

        Args:
            batch: Batch with translations list (each has es, fr, en)

        Returns:
            List of upserted translations
        """
        translations_data = []
        for item in batch.translations:
            translations_data.append({
                "entity_type": item.entity_type.value,
                "entity_code": item.entity_code,
                "field_name": item.field_name,
                "es": item.es,
                "fr": item.fr,
                "en": item.en,
                "translation_source": item.translation_source or "import",
            })

        return await self.repository.batch_upsert(conn, translations_data)

    async def get_stats(
        self,
        conn: asyncpg.Connection,
    ) -> Dict[str, Any]:
        """
        Get entity translation statistics

        Returns:
            Statistics dict
        """
        return await self.repository.get_stats(conn)

    async def get_entity_types(self) -> List[str]:
        """
        Get list of supported entity types

        Returns:
            ["ministry", "sector", "category"]
        """
        return ["ministry", "sector", "category"]

    async def list_entities_by_type(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
    ) -> List[str]:
        """
        List distinct entity codes for an entity type

        Returns:
            List of entity codes
        """
        return await self.repository.list_distinct_entities(conn, entity_type)

    async def export_by_type(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
    ) -> List[Dict[str, Any]]:
        """
        Export all translations for an entity type

        Returns:
            List of {entity_code, translations: {field: {es, fr, en}}}
        """
        return await self.repository.export_by_entity_type(conn, entity_type)

    async def import_translations(
        self,
        conn: asyncpg.Connection,
        data: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Import translations from export format

        Args:
            data: List of {entity_type, entity_code, translations: {field: {es, fr, en}}}

        Returns:
            Import result with counts
        """
        created_count = 0
        updated_count = 0
        errors = []

        for item in data:
            entity_type = item.get("entity_type")
            entity_code = item.get("entity_code")
            translations = item.get("translations", {})

            if not entity_type or not entity_code:
                errors.append(f"Missing entity_type or entity_code: {item}")
                continue

            for field_name, langs in translations.items():
                for lang_code, text in langs.items():
                    if lang_code not in ["es", "fr", "en"]:
                        continue
                    if not text:
                        continue

                    try:
                        # Check if exists
                        existing = await self.repository.get_by_key(
                            conn, entity_type, entity_code, lang_code, field_name
                        )

                        await self.repository.upsert(
                            conn,
                            entity_type,
                            entity_code,
                            lang_code,
                            field_name,
                            text,
                            "import",
                        )

                        if existing:
                            updated_count += 1
                        else:
                            created_count += 1

                    except Exception as e:
                        errors.append(f"Error importing {entity_type}.{entity_code}.{lang_code}.{field_name}: {e}")
                        logger.error(f"Import error: {e}")

        return {
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
            "total_processed": created_count + updated_count,
        }
