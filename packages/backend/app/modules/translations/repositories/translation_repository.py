"""
Translation Repository - Data access layer for translations

Handles:
- translations table (entity translations for multilingual content)
- entity_translations table (if exists)

Schema reference: docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from loguru import logger
import asyncpg


class TranslationRepository:
    """Repository for translation CRUD operations"""

    async def create(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        language_code: str,
        content: str,
    ) -> Dict[str, Any]:
        """
        Create a single translation

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID
            field_name: Field being translated
            language_code: Language code (es/fr/en)
            content: Translated content

        Returns:
            Created translation dict
        """
        query = """
            INSERT INTO translations (entity_type, entity_id, field_name, language_code, content, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
        """

        result = await conn.fetchrow(
            query,
            entity_type,
            str(entity_id),
            field_name,
            language_code,
            content,
        )

        logger.info(
            f"Created translation: {entity_type}.{entity_id}.{field_name} [{language_code}]"
        )
        return dict(result)

    async def upsert(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        language_code: str,
        content: str,
    ) -> Dict[str, Any]:
        """
        Create or update translation (upsert)

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID
            field_name: Field being translated
            language_code: Language code
            content: Translated content

        Returns:
            Translation dict
        """
        query = """
            INSERT INTO translations (entity_type, entity_id, field_name, language_code, content, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (entity_type, entity_id, field_name, language_code)
            DO UPDATE SET
                content = EXCLUDED.content,
                updated_at = NOW()
            RETURNING *
        """

        result = await conn.fetchrow(
            query,
            entity_type,
            str(entity_id),
            field_name,
            language_code,
            content,
        )

        return dict(result)

    async def get_by_id(
        self,
        conn: asyncpg.Connection,
        translation_id: UUID,
    ) -> Optional[Dict[str, Any]]:
        """
        Get translation by ID

        Args:
            conn: Database connection
            translation_id: Translation UUID

        Returns:
            Translation dict or None
        """
        query = "SELECT * FROM translations WHERE id = $1"
        result = await conn.fetchrow(query, str(translation_id))
        return dict(result) if result else None

    async def get_translation(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        language_code: str,
    ) -> Optional[str]:
        """
        Get specific translation content

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID
            field_name: Field name
            language_code: Language code

        Returns:
            Translated content or None
        """
        query = """
            SELECT content FROM translations
            WHERE entity_type = $1
              AND entity_id = $2
              AND field_name = $3
              AND language_code = $4
        """

        result = await conn.fetchval(
            query,
            entity_type,
            str(entity_id),
            field_name,
            language_code,
        )

        return result

    async def get_entity_translations(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        entity_id: UUID,
        language_code: str,
    ) -> Dict[str, str]:
        """
        Get all translations for an entity in a specific language

        Args:
            conn: Database connection
            entity_type: Type of entity
            entity_id: Entity UUID
            language_code: Language code

        Returns:
            Dict {field_name: content}
        """
        query = """
            SELECT field_name, content
            FROM translations
            WHERE entity_type = $1
              AND entity_id = $2
              AND language_code = $3
        """

        results = await conn.fetch(query, entity_type, str(entity_id), language_code)

        return {row["field_name"]: row["content"] for row in results}

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
        query = """
            SELECT field_name, language_code, content
            FROM translations
            WHERE entity_type = $1
              AND entity_id = $2
            ORDER BY field_name, language_code
        """

        results = await conn.fetch(query, entity_type, str(entity_id))

        # Build nested dict
        translations: Dict[str, Dict[str, str]] = {}
        for row in results:
            field_name = row["field_name"]
            language_code = row["language_code"]
            content = row["content"]

            if field_name not in translations:
                translations[field_name] = {}

            translations[field_name][language_code] = content

        return translations

    async def update(
        self,
        conn: asyncpg.Connection,
        translation_id: UUID,
        content: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Update translation content

        Args:
            conn: Database connection
            translation_id: Translation UUID
            content: New content

        Returns:
            Updated translation or None
        """
        query = """
            UPDATE translations
            SET content = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """

        result = await conn.fetchrow(query, str(translation_id), content)
        return dict(result) if result else None

    async def delete(
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
            True if deleted, False if not found
        """
        query = "DELETE FROM translations WHERE id = $1"
        result = await conn.execute(query, str(translation_id))

        # Result is like "DELETE 1" or "DELETE 0"
        return result.split()[-1] != "0"

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
        query = """
            DELETE FROM translations
            WHERE entity_type = $1 AND entity_id = $2
        """

        result = await conn.execute(query, entity_type, str(entity_id))

        count = int(result.split()[-1])
        logger.info(f"Deleted {count} translations for {entity_type} {entity_id}")
        return count

    async def list_by_entity_type(
        self,
        conn: asyncpg.Connection,
        entity_type: str,
        language_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List translations for an entity type

        Args:
            conn: Database connection
            entity_type: Type of entity
            language_code: Optional language filter
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (translations list, total count)
        """
        # Build WHERE clause
        where_conditions = ["entity_type = $1"]
        params = [entity_type]

        if language_code:
            where_conditions.append(f"language_code = ${len(params) + 1}")
            params.append(language_code)

        where_clause = " AND ".join(where_conditions)

        # Count query
        count_query = f"""
            SELECT COUNT(*) FROM translations
            WHERE {where_clause}
        """
        total = await conn.fetchval(count_query, *params)

        # Data query
        params.extend([limit, offset])
        data_query = f"""
            SELECT * FROM translations
            WHERE {where_clause}
            ORDER BY entity_id, field_name, language_code
            LIMIT ${len(params) - 1} OFFSET ${len(params)}
        """

        results = await conn.fetch(data_query, *params)
        translations = [dict(r) for r in results]

        return translations, total
