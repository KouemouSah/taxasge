"""Data access layer for the enrichment queue. All queries use asyncpg $N params."""

from typing import Any, Dict, List, Optional
from uuid import UUID

from loguru import logger


class EnrichmentRepository:
    """Repository for enrichment_queue table operations."""

    @staticmethod
    async def enqueue(
        conn,
        fiscal_service_id: int,
        task_type: str,
        priority: int = 0,
    ) -> Optional[Dict[str, Any]]:
        """
        Enqueue an enrichment task. Idempotent: skips if a pending/processing
        task already exists for the same (service, task_type).
        """
        row = await conn.fetchrow(
            """
            INSERT INTO enrichment_queue (fiscal_service_id, task_type, priority)
            SELECT $1, $2, $3
            WHERE NOT EXISTS (
                SELECT 1 FROM enrichment_queue
                WHERE fiscal_service_id = $1
                  AND task_type = $2
                  AND status IN ('pending', 'processing')
            )
            RETURNING id, fiscal_service_id, task_type, status, created_at
            """,
            fiscal_service_id,
            task_type,
            priority,
        )
        return dict(row) if row else None

    @staticmethod
    async def fetch_pending_batch(
        conn, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Fetch a batch of pending tasks with FOR UPDATE SKIP LOCKED
        for multi-replica safety (Cloud Run).
        """
        rows = await conn.fetch(
            """
            SELECT id, fiscal_service_id, task_type, status, priority,
                   attempts, max_attempts, input_data
            FROM enrichment_queue
            WHERE status = 'pending'
            ORDER BY priority DESC, created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
            """,
            limit,
        )
        return [dict(r) for r in rows]

    @staticmethod
    async def mark_processing(conn, task_id: UUID) -> None:
        """Mark a task as processing and increment attempt counter."""
        await conn.execute(
            """
            UPDATE enrichment_queue
            SET status = 'processing', attempts = attempts + 1
            WHERE id = $1
            """,
            task_id,
        )

    @staticmethod
    async def mark_completed(
        conn,
        task_id: UUID,
        output_data: Optional[Dict[str, Any]] = None,
        tokens_used: Optional[int] = None,
    ) -> None:
        """Mark a task as completed with output data."""
        await conn.execute(
            """
            UPDATE enrichment_queue
            SET status = 'completed',
                output_data = $2,
                tokens_used = $3,
                processed_at = NOW()
            WHERE id = $1
            """,
            task_id,
            output_data,
            tokens_used,
        )

    @staticmethod
    async def mark_failed(
        conn, task_id: UUID, error_message: str
    ) -> None:
        """
        Mark a task as failed. If attempts < max_attempts, reset to 'pending'
        for automatic retry. Otherwise mark 'failed' permanently.
        """
        await conn.execute(
            """
            UPDATE enrichment_queue
            SET status = CASE
                    WHEN attempts < max_attempts THEN 'pending'
                    ELSE 'failed'
                END,
                error_message = $2,
                processed_at = NOW()
            WHERE id = $1
            """,
            task_id,
            error_message,
        )

    @staticmethod
    async def get_service_context(
        conn, fiscal_service_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch full context for a service to build Gemini prompts.
        Single query with JOINs — no N+1.
        """
        row = await conn.fetchrow(
            """
            SELECT
                fs.id,
                fs.service_code,
                fs.name_es,
                fs.description_es,
                fs.description_source,
                fs.service_type::TEXT as service_type,
                fs.calculation_method::TEXT as calculation_method,
                COALESCE(fs.tasa_expedicion, 0) as tasa_expedicion,
                COALESCE(fs.tasa_renovacion, 0) as tasa_renovacion,
                c.name as category_name,
                m.name as ministry_name,
                (
                    SELECT string_agg(DISTINCT sk.keyword, ', ')
                    FROM service_keywords sk
                    WHERE sk.fiscal_service_id = fs.id
                      AND sk.language_code = 'es'
                ) as keywords_es,
                (
                    SELECT string_agg(DISTINCT dt.document_name_es, ', ')
                    FROM service_document_assignments sda
                    JOIN document_templates dt ON dt.id = sda.document_template_id
                    WHERE sda.fiscal_service_id = fs.id
                ) as documents_es
            FROM fiscal_services fs
            LEFT JOIN categories c ON c.id = fs.category_id
            LEFT JOIN ministries m ON m.id = (
                SELECT s.ministry_id FROM sectors s WHERE s.id = c.sector_id LIMIT 1
            )
            WHERE fs.id = $1
            """,
            fiscal_service_id,
        )
        return dict(row) if row else None

    @staticmethod
    async def get_stats(conn) -> Dict[str, Any]:
        """Aggregate queue stats + service description coverage."""
        # Queue breakdown
        queue_rows = await conn.fetch(
            """
            SELECT task_type, status, COUNT(*) as cnt
            FROM enrichment_queue
            GROUP BY task_type, status
            ORDER BY task_type, status
            """
        )

        # Service coverage
        coverage = await conn.fetchrow(
            """
            SELECT
                COUNT(*) FILTER (WHERE status = 'active') as total_services,
                COUNT(*) FILTER (WHERE status = 'active' AND description_es IS NOT NULL AND description_es != '') as with_description,
                COUNT(*) FILTER (WHERE status = 'active' AND id IN (
                    SELECT DISTINCT fiscal_service_id FROM service_keywords
                )) as with_keywords
            FROM fiscal_services
            """
        )

        # Translation coverage
        translations = await conn.fetchrow(
            """
            SELECT
                COUNT(DISTINCT entity_code) FILTER (WHERE language_code = 'fr') as with_fr,
                COUNT(DISTINCT entity_code) FILTER (WHERE language_code = 'en') as with_en
            FROM entity_translations
            WHERE entity_type = 'service' AND field_name = 'description'
            """
        )

        total = coverage["total_services"] if coverage else 0
        with_desc = coverage["with_description"] if coverage else 0
        with_kw = coverage["with_keywords"] if coverage else 0

        # Sum queue statuses
        queue_totals: Dict[str, int] = {
            "pending": 0, "processing": 0, "completed": 0, "failed": 0
        }
        for r in queue_rows:
            s = r["status"]
            if s in queue_totals:
                queue_totals[s] += r["cnt"]

        return {
            "total_services": total,
            "with_description": with_desc,
            "with_description_pct": round(with_desc / total * 100, 1) if total else 0,
            "with_keywords": with_kw,
            "with_keywords_pct": round(with_kw / total * 100, 1) if total else 0,
            "with_translations_fr": translations["with_fr"] if translations else 0,
            "with_translations_en": translations["with_en"] if translations else 0,
            "queue_pending": queue_totals["pending"],
            "queue_processing": queue_totals["processing"],
            "queue_completed": queue_totals["completed"],
            "queue_failed": queue_totals["failed"],
            "breakdown": [dict(r) for r in queue_rows],
        }

    @staticmethod
    async def seed_descriptions(conn) -> Dict[str, int]:
        """
        Enqueue generate_description for all active services missing descriptions.
        Returns count of enqueued tasks.
        """
        result = await conn.execute(
            """
            INSERT INTO enrichment_queue (fiscal_service_id, task_type, priority)
            SELECT id, 'generate_description', 1
            FROM fiscal_services
            WHERE status = 'active'
              AND (description_es IS NULL OR description_es = '')
              AND NOT EXISTS (
                  SELECT 1 FROM enrichment_queue eq
                  WHERE eq.fiscal_service_id = fiscal_services.id
                    AND eq.task_type = 'generate_description'
                    AND eq.status IN ('pending', 'processing')
              )
            """
        )
        desc_count = int(result.split()[-1]) if result else 0

        # Also enqueue translations for services WITH descriptions but no translations
        result_tr = await conn.execute(
            """
            INSERT INTO enrichment_queue (fiscal_service_id, task_type, priority)
            SELECT fs.id, lang.task_type, 0
            FROM fiscal_services fs
            CROSS JOIN (VALUES ('translate_fr'), ('translate_en')) AS lang(task_type)
            WHERE fs.status = 'active'
              AND fs.description_es IS NOT NULL AND fs.description_es != ''
              AND NOT EXISTS (
                  SELECT 1 FROM enrichment_queue eq
                  WHERE eq.fiscal_service_id = fs.id
                    AND eq.task_type = lang.task_type
                    AND eq.status IN ('pending', 'processing')
              )
              AND NOT EXISTS (
                  SELECT 1 FROM entity_translations et
                  WHERE et.entity_type = 'service'
                    AND et.entity_code = fs.service_code
                    AND et.field_name = 'description'
                    AND et.language_code = REPLACE(lang.task_type, 'translate_', '')
              )
            """
        )
        tr_count = int(result_tr.split()[-1]) if result_tr else 0

        logger.info(f"Enrichment seed: {desc_count} descriptions, {tr_count} translations enqueued")
        return {"descriptions": desc_count, "translations": tr_count}
