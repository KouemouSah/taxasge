"""
Translation Service - Business logic for translations

Handles:
- Creating and managing translations
- Translation sets (all languages for entity)
- Fallback to default language
- Caching (future)

Module: Translations
Architecture: 3-tier (Routes → Services → Repositories)
"""

from typing import Dict, Optional, List
from uuid import UUID
from loguru import logger
import asyncpg

from app.modules.translations.repositories.translation_repository import TranslationRepository
from app.modules.translations.models.language import Language, get_default_language
from app.modules.translations.models.translation import (
    TranslationCreate,
    TranslationUpdate,
    TranslationSetCreate,
)


class TranslationService:
    """Service for translation business logic"""

    def __init__(self):
        """Initialize translation service"""
        self.repo = TranslationRepository()
        logger.info("TranslationService initialized")

    async def create_translation(
        self,
        conn: asyncpg.Connection,
        translation: TranslationCreate,
    ) -> Dict:
        """
        Create a single translation

        Args:
            conn: Database connection
            translation: Translation data

        Returns:
            Created translation
        """
        return await self.repo.create(
            conn,
            translation.entity_type,
            translation.entity_id,
            translation.field_name,
            translation.language_code.value,
            translation.content,
        )

    async def create_translation_set(
        self,
        conn: asyncpg.Connection,
        translation_set: TranslationSetCreate,
    ) -> List[Dict]:
        """
        Create a complete set of translations (all languages for one field)

        Args:
            conn: Database connection
            translation_set: Translation set data

        Returns:
            List of created translations
        """
        # Validate translations
        translation_set.validate_translations()

        created = []
        for lang_code, content in translation_set.translations.items():
            if content and content.strip():  # Skip empty translations
                result = await self.repo.upsert(
                    conn,
                    translation_set.entity_type,
                    translation_set.entity_id,
                    translation_set.field_name,
                    lang_code,
                    content.strip(),
                )
                created.append(result)

        logger.info(
            f"Created {len(created)} translations for "
            f"{translation_set.entity_type} {translation_set.entity_id}.{translation_set.field_name}"
        )

        return created

    async def get_translation(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        language: Language = None,
        fallback: bool = True,
    ) -> Optional[str]:
        """
        Get translation for entity field

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID
            field_name: Field name
            language: Desired language (default: Spanish)
            fallback: If True, fallback to default language if not found

        Returns:
            Translated content or None
        """
        if language is None:
            language = get_default_language()

        # Try requested language
        content = await self.repo.get_translation(
            conn,
            entity_type,
            entity_id,
            field_name,
            language.value,
        )

        # Fallback to default language if not found
        if content is None and fallback and language != get_default_language():
            content = await self.repo.get_translation(
                conn,
                entity_type,
                entity_id,
                field_name,
                get_default_language().value,
            )

        return content

    async def get_entity_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
        language: Language = None,
    ) -> Dict[str, str]:
        """
        Get all translations for an entity in a language

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID
            language: Language (default: Spanish)

        Returns:
            Dict {field_name: content}
        """
        if language is None:
            language = get_default_language()

        return await self.repo.get_entity_translations(
            conn,
            entity_type,
            entity_id,
            language.value,
        )

    async def get_all_entity_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
    ) -> Dict[str, Dict[str, str]]:
        """
        Get all translations for an entity (all fields, all languages)

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID

        Returns:
            Nested dict {field_name: {language_code: content}}
        """
        return await self.repo.get_all_entity_translations(
            conn,
            entity_type,
            entity_id,
        )

    async def update_translation(
        self,
        conn: asyncpg.Connection,
        translation_id: UUID,
        update_data: TranslationUpdate,
    ) -> Optional[Dict]:
        """
        Update translation content

        Args:
            conn: Database connection
            translation_id: Translation UUID
            update_data: Update data

        Returns:
            Updated translation or None
        """
        if update_data.content is None:
            # No update
            return await self.repo.get_by_id(conn, translation_id)

        return await self.repo.update(
            conn,
            translation_id,
            update_data.content,
        )

    async def delete_translation(
        self,
        conn: asyncpg.Connection,
        translation_id: UUID,
    ) -> bool:
        """
        Delete a translation

        Args:
            conn: Database connection
            translation_id: Translation UUID

        Returns:
            True if deleted
        """
        return await self.repo.delete(conn, translation_id)

    async def delete_entity_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
    ) -> int:
        """
        Delete all translations for an entity

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID

        Returns:
            Number of deleted translations
        """
        return await self.repo.delete_entity_translations(
            conn,
            entity_type,
            entity_id,
        )

    async def list_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        language: Optional[Language] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[List[Dict], int]:
        """
        List translations for an entity type

        Args:
            conn: Database connection
            entity_type: Type of entity
            language: Optional language filter
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (translations list, total count)
        """
        language_code = language.value if language else None

        return await self.repo.list_by_entity_type(
            conn,
            entity_type,
            language_code,
            limit,
            offset,
        )
