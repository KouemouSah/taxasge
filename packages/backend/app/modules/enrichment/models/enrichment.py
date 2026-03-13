"""Pydantic v2 models for the enrichment queue."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EnrichmentTask(BaseModel):
    """Single enrichment queue task."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    fiscal_service_id: int
    task_type: str
    status: str
    priority: int = 0
    attempts: int = 0
    max_attempts: int = 3
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    tokens_used: Optional[int] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None


class EnrichmentStats(BaseModel):
    """Aggregated enrichment statistics."""

    total_services: int = 0
    with_description: int = 0
    with_description_pct: float = 0.0
    desc_manual: int = 0
    desc_ai_generated: int = 0
    with_keywords: int = 0
    with_keywords_pct: float = 0.0
    with_translations_fr: int = 0
    with_translations_en: int = 0
    queue_pending: int = 0
    queue_processing: int = 0
    queue_completed: int = 0
    queue_failed: int = 0
    breakdown: List[Dict[str, Any]] = Field(default_factory=list)


class EnrichmentProcessResult(BaseModel):
    """Result of a cron batch processing run."""

    processed: int = 0
    failed: int = 0
    skipped: int = 0
    tokens_total: int = 0
    details: List[Dict[str, Any]] = Field(default_factory=list)


class EnrichmentSeedResult(BaseModel):
    """Result of seed-batch operation."""

    enqueued_descriptions: int = 0
    enqueued_translations: int = 0
    enqueued_keywords: int = 0
