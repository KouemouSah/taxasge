"""
Translation Service for TaxasGE Backend
Centralized translation management system aligned with PostgreSQL schema
"""

from typing import Dict, List, Optional, Union
from uuid import UUID, uuid4
from datetime import datetime
from loguru import logger

from app.core.database import database_manager
from app.models.tax import Translation


class TranslationService:
    """Centralized translation service for multilingual content"""

    def __init__(self):
        self.db = database_manager

    async def create_translation_set(
        self,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        translations: Dict[str, str]
    ) -> UUID:
        """
        Create a complete set of translations for an entity field

        Args:
            entity_type: Type of entity (ministry, sector, category, etc.)
            entity_id: UUID of the entity
            field_name: Field name (name, description)
            translations: Dict with language codes as keys (es, fr, en)

        Returns:
            UUID of the primary translation (usually Spanish)
        """
        try:
            translation_id = uuid4()

            # Create translations for each language
            for lang_code, content in translations.items():
                if content and content.strip():  # Only create non-empty translations
                    translation = Translation(
                        id=translation_id if lang_code == "es" else uuid4(),
                        entity_type=entity_type,
                        entity_id=entity_id,
                        field_name=field_name,
                        language_code=lang_code,
                        content=content.strip()
                    )

                    # Save to database
                    if self.db.use_postgresql:
                        await self._save_translation_postgresql(translation)
                    else:
                        await self._save_translation_supabase(translation)

            logger.info(f"Created translation set for {entity_type} {entity_id}.{field_name}")
            return translation_id

        except Exception as e:
            logger.error(f"Error creating translation set: {e}")
            raise

    async def get_translation(
        self,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        language_code: str = "es"
    ) -> Optional[str]:
        """
        Get translation for specific entity field and language

        Args:
            entity_type: Type of entity
            entity_id: UUID of the entity
            field_name: Field name
            language_code: Language code (es, fr, en)

        Returns:
            Translated content or None if not found
        """
        try:
            if self.db.use_postgresql:
                return await self._get_translation_postgresql(
                    entity_type, entity_id, field_name, language_code
                )
            else:
                return await self._get_translation_supabase(
                    entity_type, entity_id, field_name, language_code
                )

        except Exception as e:
            logger.error(f"Error getting translation: {e}")
            return None

    async def get_translations_for_entity(
        self,
        entity_type: str,
        entity_id: UUID,
        language_code: str = "es"
    ) -> Dict[str, str]:
        """
        Get all translations for an entity in specified language

        Args:
            entity_type: Type of entity
            entity_id: UUID of the entity
            language_code: Language code

        Returns:
            Dict with field names as keys and translations as values
        """
        try:
            if self.db.use_postgresql:
                return await self._get_entity_translations_postgresql(
                    entity_type, entity_id, language_code
                )
            else:
                return await self._get_entity_translations_supabase(
                    entity_type, entity_id, language_code
                )

        except Exception as e:
            logger.error(f"Error getting entity translations: {e}")
            return {}

    async def update_translation(
        self,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        language_code: str,
        content: str
    ) -> bool:
        """
        Update or create a specific translation

        Args:
            entity_type: Type of entity
            entity_id: UUID of the entity
            field_name: Field name
            language_code: Language code
            content: New translation content

        Returns:
            True if successful, False otherwise
        """
        try:
            if self.db.use_postgresql:
                return await self._update_translation_postgresql(
                    entity_type, entity_id, field_name, language_code, content
                )
            else:
                return await self._update_translation_supabase(
                    entity_type, entity_id, field_name, language_code, content
                )

        except Exception as e:
            logger.error(f"Error updating translation: {e}")
            return False

    async def delete_translations_for_entity(self, entity_type: str, entity_id: UUID) -> bool:
        """
        Delete all translations for an entity

        Args:
            entity_type: Type of entity
            entity_id: UUID of the entity

        Returns:
            True if successful, False otherwise
        """
        try:
            if self.db.use_postgresql:
                return await self._delete_entity_translations_postgresql(entity_type, entity_id)
            else:
                return await self._delete_entity_translations_supabase(entity_type, entity_id)

        except Exception as e:
            logger.error(f"Error deleting entity translations: {e}")
            return False

    # PostgreSQL implementation methods

    async def _save_translation_postgresql(self, translation: Translation) -> bool:
        """Save translation to PostgreSQL"""
        query = """
            INSERT INTO translations (
                id, entity_type, entity_id, field_name, language_code, content, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (entity_type, entity_id, field_name, language_code)
            DO UPDATE SET content = $6, updated_at = $8
        """
        await self.db.connection.execute(
            query,
            translation.id,
            translation.entity_type,
            translation.entity_id,
            translation.field_name,
            translation.language_code,
            translation.content,
            translation.created_at,
            translation.updated_at
        )
        return True

    async def _get_translation_postgresql(
        self, entity_type: str, entity_id: UUID, field_name: str, language_code: str
    ) -> Optional[str]:
        """Get translation from PostgreSQL"""
        query = """
            SELECT content FROM translations
            WHERE entity_type = $1 AND entity_id = $2 AND field_name = $3 AND language_code = $4
        """
        result = await self.db.connection.fetchval(
            query, entity_type, entity_id, field_name, language_code
        )
        return result

    async def _get_entity_translations_postgresql(
        self, entity_type: str, entity_id: UUID, language_code: str
    ) -> Dict[str, str]:
        """Get all translations for entity from PostgreSQL"""
        query = """
            SELECT field_name, content FROM translations
            WHERE entity_type = $1 AND entity_id = $2 AND language_code = $3
        """
        results = await self.db.connection.fetch(query, entity_type, entity_id, language_code)
        return {row['field_name']: row['content'] for row in results}

    async def _update_translation_postgresql(
        self, entity_type: str, entity_id: UUID, field_name: str, language_code: str, content: str
    ) -> bool:
        """Update translation in PostgreSQL"""
        query = """
            INSERT INTO translations (
                id, entity_type, entity_id, field_name, language_code, content, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (entity_type, entity_id, field_name, language_code)
            DO UPDATE SET content = $6, updated_at = NOW()
        """
        await self.db.connection.execute(
            query, uuid4(), entity_type, entity_id, field_name, language_code, content
        )
        return True

    async def _delete_entity_translations_postgresql(self, entity_type: str, entity_id: UUID) -> bool:
        """Delete entity translations from PostgreSQL"""
        query = "DELETE FROM translations WHERE entity_type = $1 AND entity_id = $2"
        await self.db.connection.execute(query, entity_type, entity_id)
        return True

    # Supabase implementation methods

    async def _save_translation_supabase(self, translation: Translation) -> bool:
        """Save translation to Supabase"""
        data = {
            "id": str(translation.id),
            "entity_type": translation.entity_type,
            "entity_id": str(translation.entity_id),
            "field_name": translation.field_name,
            "language_code": translation.language_code,
            "content": translation.content,
            "created_at": translation.created_at.isoformat(),
            "updated_at": translation.updated_at.isoformat()
        }

        response = await self.db.supabase.table("translations").upsert(data).execute()
        return response.data is not None

    async def _get_translation_supabase(
        self, entity_type: str, entity_id: UUID, field_name: str, language_code: str
    ) -> Optional[str]:
        """Get translation from Supabase"""
        response = await self.db.supabase.table("translations").select("content").eq(
            "entity_type", entity_type
        ).eq("entity_id", str(entity_id)).eq("field_name", field_name).eq(
            "language_code", language_code
        ).execute()

        if response.data:
            return response.data[0]["content"]
        return None

    async def _get_entity_translations_supabase(
        self, entity_type: str, entity_id: UUID, language_code: str
    ) -> Dict[str, str]:
        """Get all translations for entity from Supabase"""
        response = await self.db.supabase.table("translations").select(
            "field_name, content"
        ).eq("entity_type", entity_type).eq("entity_id", str(entity_id)).eq(
            "language_code", language_code
        ).execute()

        if response.data:
            return {row["field_name"]: row["content"] for row in response.data}
        return {}

    async def _update_translation_supabase(
        self, entity_type: str, entity_id: UUID, field_name: str, language_code: str, content: str
    ) -> bool:
        """Update translation in Supabase"""
        data = {
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "field_name": field_name,
            "language_code": language_code,
            "content": content,
            "updated_at": datetime.utcnow().isoformat()
        }

        response = await self.db.supabase.table("translations").upsert(data).execute()
        return response.data is not None

    async def _delete_entity_translations_supabase(self, entity_type: str, entity_id: UUID) -> bool:
        """Delete entity translations from Supabase"""
        response = await self.db.supabase.table("translations").delete().eq(
            "entity_type", entity_type
        ).eq("entity_id", str(entity_id)).execute()
        return True


# Global translation service instance
translation_service = TranslationService()