"""
Enrichment Service — Gemini-powered automatic enrichment for fiscal services.

Generates descriptions (ES), translates to FR/EN, and generates keywords.
Pattern: Same as LLMBriefingService (lazy init, run_in_executor, timeout, graceful fallback).
"""

import asyncio
import json
import time
from typing import Any, Dict, List, Optional
from uuid import UUID

from loguru import logger

from app.config import get_settings
from app.modules.enrichment.repositories.enrichment_repository import (
    EnrichmentRepository,
)

try:
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    import vertexai

    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False
    logger.warning("Vertex AI SDK not available — enrichment LLM disabled")


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

DESCRIPTION_PROMPT = """Eres un experto en servicios fiscales del Gobierno de Guinea Ecuatorial.
Genera una descripción concisa (2-3 frases, máximo 250 caracteres) para el siguiente servicio fiscal.
La descripción debe explicar: qué es el servicio, quién lo necesita, y su propósito.

DATOS DEL SERVICIO:
- Nombre: {name_es}
- Categoría: {category}
- Ministerio: {ministry}
- Tipo de servicio: {service_type}
- Tarifa expedición: {price} XAF
- Documentos requeridos: {documents}
- Palabras clave: {keywords}

REGLAS CRÍTICAS:
1. SOLO información derivable de los datos proporcionados — NO inventar
2. Mencionar el precio si > 0
3. Tono profesional y administrativo
4. En español

Responde SOLO con el texto de la descripción, sin comillas ni prefijos."""

TRANSLATION_PROMPT = """Traduce los siguientes textos del español al {target_language}.
Contexto: servicio fiscal del gobierno de Guinea Ecuatorial.
Conserva los términos técnicos (XAF, nombres de ministerios).
Tono formal administrativo.

Nombre: {name_es}
Descripción: {description_es}

Responde SOLO con JSON válido: {{"name": "traducción del nombre", "description": "traducción de la descripción"}}"""

KEYWORDS_PROMPT = """Genera entre 5 y 8 palabras clave de búsqueda para el siguiente servicio fiscal.
Las palabras clave deben ayudar a los ciudadanos a encontrar este servicio.

Nombre: {name_es}
Descripción: {description_es}
Categoría: {category}

Genera palabras clave en los 3 idiomas:
- ES (español): 5-8 palabras
- FR (français): 5-8 mots
- EN (English): 5-8 words

Responde SOLO con JSON válido:
{{"es": ["palabra1", "palabra2", ...], "fr": ["mot1", "mot2", ...], "en": ["word1", "word2", ...]}}"""


class EnrichmentService:
    """Gemini-powered enrichment for fiscal services."""

    def __init__(self):
        self._model: Optional[GenerativeModel] = None
        self._initialized = False

    def _ensure_initialized(self):
        """Lazy initialization of Gemini model."""
        if self._initialized:
            return

        if not VERTEX_AI_AVAILABLE:
            self._initialized = True
            return

        try:
            settings = get_settings()
            vertexai.init(
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION,
            )
            model_name = getattr(settings, "GEMINI_CHAT_MODEL", "gemini-2.0-flash")
            self._model = GenerativeModel(model_name)
            self._initialized = True
            logger.info(f"EnrichmentService initialized with model {model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize EnrichmentService: {e}")
            self._initialized = True

    # ------------------------------------------------------------------
    # Public static: auto-enqueue hook for fiscal service CRUD
    # ------------------------------------------------------------------

    @staticmethod
    async def auto_enqueue(
        conn,
        service_id: int,
        current_description: Optional[str],
        description_source: Optional[str] = None,
    ) -> int:
        """
        Auto-enqueue enrichment tasks after service create/update.
        Non-blocking: caller wraps in try/except.

        Returns number of tasks enqueued.
        """
        enqueued = 0

        # Generate description if empty AND not manually authored
        if not current_description or current_description.strip() == "":
            if description_source != "manual":
                result = await EnrichmentRepository.enqueue(
                    conn, service_id, "generate_description", priority=1
                )
                if result:
                    enqueued += 1

        # Always enqueue translations (idempotent — skips if already pending)
        for lang in ("translate_fr", "translate_en"):
            result = await EnrichmentRepository.enqueue(
                conn, service_id, lang, priority=0
            )
            if result:
                enqueued += 1

        if enqueued:
            logger.info(
                f"Enrichment: enqueued {enqueued} tasks for service {service_id}"
            )
        return enqueued

    # ------------------------------------------------------------------
    # Cron: process a batch of pending tasks
    # ------------------------------------------------------------------

    async def process_batch(
        self, conn, limit: int = 20
    ) -> Dict[str, Any]:
        """
        Process a batch of pending enrichment tasks.
        Called by cron endpoint every 5 minutes.
        """
        self._ensure_initialized()

        if not self._model:
            logger.warning("Gemini model not available — skipping enrichment batch")
            return {"processed": 0, "failed": 0, "skipped": 0, "tokens_total": 0}

        tasks = await EnrichmentRepository.fetch_pending_batch(conn, limit)
        if not tasks:
            return {"processed": 0, "failed": 0, "skipped": 0, "tokens_total": 0}

        processed = 0
        failed = 0
        skipped = 0
        tokens_total = 0
        details: List[Dict[str, Any]] = []

        for task in tasks:
            task_id = task["id"]
            service_id = task["fiscal_service_id"]
            task_type = task["task_type"]

            try:
                await EnrichmentRepository.mark_processing(conn, task_id)

                # Fetch service context
                context = await EnrichmentRepository.get_service_context(
                    conn, service_id
                )
                if not context:
                    await EnrichmentRepository.mark_failed(
                        conn, task_id, f"Service {service_id} not found"
                    )
                    failed += 1
                    continue

                # Skip translations if no description yet
                if task_type in ("translate_fr", "translate_en"):
                    if not context.get("description_es"):
                        await EnrichmentRepository.mark_failed(
                            conn, task_id,
                            "No description_es to translate — will retry after generation"
                        )
                        skipped += 1
                        continue

                # Dispatch to handler
                start = time.monotonic()
                tokens = 0

                if task_type == "generate_description":
                    tokens = await self._generate_description(conn, task_id, context)
                elif task_type == "generate_keywords":
                    tokens = await self._generate_keywords(conn, task_id, context)
                elif task_type in ("translate_fr", "translate_en"):
                    target = task_type.replace("translate_", "")
                    tokens = await self._translate(conn, task_id, context, target)
                else:
                    await EnrichmentRepository.mark_failed(
                        conn, task_id, f"Unknown task_type: {task_type}"
                    )
                    failed += 1
                    continue

                elapsed = round(time.monotonic() - start, 2)
                tokens_total += tokens
                processed += 1
                details.append({
                    "service_id": service_id,
                    "task_type": task_type,
                    "tokens": tokens,
                    "elapsed_s": elapsed,
                })
                logger.info(
                    f"Enrichment OK: service={service_id} type={task_type} "
                    f"tokens={tokens} elapsed={elapsed}s"
                )

            except Exception as e:
                logger.error(
                    f"Enrichment FAIL: service={service_id} type={task_type} error={e}"
                )
                try:
                    await EnrichmentRepository.mark_failed(conn, task_id, str(e)[:500])
                except Exception:
                    pass
                failed += 1

        return {
            "processed": processed,
            "failed": failed,
            "skipped": skipped,
            "tokens_total": tokens_total,
            "details": details,
        }

    # ------------------------------------------------------------------
    # Handlers
    # ------------------------------------------------------------------

    async def _generate_description(
        self, conn, task_id: UUID, context: Dict[str, Any]
    ) -> int:
        """Generate Spanish description via Gemini Flash."""
        prompt = DESCRIPTION_PROMPT.format(
            name_es=context.get("name_es", ""),
            category=context.get("category_name", "Sin categoría"),
            ministry=context.get("ministry_name", "Sin ministerio"),
            service_type=context.get("service_type", ""),
            price=context.get("tasa_expedicion", 0),
            documents=context.get("documents_es", "No especificados"),
            keywords=context.get("keywords_es", ""),
        )

        text = await self._call_gemini(prompt, max_tokens=300)
        if not text:
            await EnrichmentRepository.mark_failed(conn, task_id, "Empty Gemini response")
            return 0

        # Clean response
        description = text.strip().strip('"').strip("'")
        if len(description) < 10:
            await EnrichmentRepository.mark_failed(
                conn, task_id, f"Description too short: {description}"
            )
            return 0

        # Update fiscal_services — NEVER overwrite manual descriptions
        await conn.execute(
            """
            UPDATE fiscal_services
            SET description_es = $1, description_source = 'ai_generated', updated_at = NOW()
            WHERE id = $2
              AND (description_source IS NULL OR description_source != 'manual')
            """,
            description,
            context["id"],
        )

        tokens = len(prompt.split()) + len(description.split())  # approximate
        await EnrichmentRepository.mark_completed(
            conn, task_id,
            output_data={"description": description},
            tokens_used=tokens,
        )
        return tokens

    async def _translate(
        self, conn, task_id: UUID, context: Dict[str, Any], target_lang: str
    ) -> int:
        """Translate name + description to target language via Gemini Flash."""
        lang_names = {"fr": "francés", "en": "inglés"}
        prompt = TRANSLATION_PROMPT.format(
            target_language=lang_names.get(target_lang, target_lang),
            name_es=context.get("name_es", ""),
            description_es=context.get("description_es", ""),
        )

        text = await self._call_gemini(
            prompt, max_tokens=400, json_mode=True
        )
        if not text:
            await EnrichmentRepository.mark_failed(conn, task_id, "Empty Gemini response")
            return 0

        # Parse JSON response
        try:
            data = json.loads(text)
            translated_name = data.get("name", "")
            translated_desc = data.get("description", "")
        except (json.JSONDecodeError, TypeError) as e:
            await EnrichmentRepository.mark_failed(
                conn, task_id, f"JSON parse error: {e} — raw: {text[:200]}"
            )
            return 0

        if not translated_name:
            await EnrichmentRepository.mark_failed(
                conn, task_id, "Empty translated name"
            )
            return 0

        # UPSERT translations (2 fields: name + description)
        service_code = context["service_code"]
        for field_name, translation_text in [
            ("name", translated_name),
            ("description", translated_desc),
        ]:
            if not translation_text:
                continue
            await conn.execute(
                """
                INSERT INTO entity_translations (
                    entity_type, entity_code, language_code, field_name,
                    translation_text, translation_source, translation_quality,
                    created_at, updated_at
                )
                VALUES ('service'::translatable_entity_type, $1, $2, $3, $4, 'ai_generated', 0.8, NOW(), NOW())
                ON CONFLICT (entity_type, entity_code, language_code, field_name)
                DO UPDATE SET
                    translation_text = EXCLUDED.translation_text,
                    translation_source = EXCLUDED.translation_source,
                    translation_quality = EXCLUDED.translation_quality,
                    updated_at = NOW()
                """,
                service_code,
                target_lang,
                field_name,
                translation_text,
            )

        tokens = len(prompt.split()) + len(text.split())
        await EnrichmentRepository.mark_completed(
            conn, task_id,
            output_data={"name": translated_name, "description": translated_desc},
            tokens_used=tokens,
        )
        return tokens

    async def _generate_keywords(
        self, conn, task_id: UUID, context: Dict[str, Any]
    ) -> int:
        """Generate multilingual keywords via Gemini Flash."""
        prompt = KEYWORDS_PROMPT.format(
            name_es=context.get("name_es", ""),
            description_es=context.get("description_es", ""),
            category=context.get("category_name", ""),
        )

        text = await self._call_gemini(prompt, max_tokens=400, json_mode=True)
        if not text:
            await EnrichmentRepository.mark_failed(conn, task_id, "Empty Gemini response")
            return 0

        try:
            data = json.loads(text)
        except (json.JSONDecodeError, TypeError) as e:
            await EnrichmentRepository.mark_failed(
                conn, task_id, f"JSON parse error: {e} — raw: {text[:200]}"
            )
            return 0

        service_id = context["id"]
        inserted = 0

        for lang_code, keywords in data.items():
            if lang_code not in ("es", "fr", "en") or not isinstance(keywords, list):
                continue
            for kw in keywords[:8]:
                if not isinstance(kw, str) or len(kw) < 2:
                    continue
                await conn.execute(
                    """
                    INSERT INTO service_keywords (
                        fiscal_service_id, keyword, language_code,
                        weight, is_auto_generated, created_at
                    )
                    VALUES ($1, $2, $3, 3, true, NOW())
                    ON CONFLICT (fiscal_service_id, keyword, language_code) DO NOTHING
                    """,
                    service_id,
                    kw.lower().strip(),
                    lang_code,
                )
                inserted += 1

        tokens = len(prompt.split()) + len(text.split())
        await EnrichmentRepository.mark_completed(
            conn, task_id,
            output_data={"keywords": data, "inserted": inserted},
            tokens_used=tokens,
        )
        return tokens

    # ------------------------------------------------------------------
    # Gemini call wrapper
    # ------------------------------------------------------------------

    async def _call_gemini(
        self,
        prompt: str,
        max_tokens: int = 300,
        json_mode: bool = False,
    ) -> Optional[str]:
        """
        Call Gemini Flash with timeout and error handling.
        Uses run_in_executor (Vertex AI SDK is synchronous).
        """
        if not self._model:
            return None

        gen_config_kwargs: Dict[str, Any] = {
            "temperature": 0.2,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            gen_config_kwargs["response_mime_type"] = "application/json"

        config = GenerationConfig(**gen_config_kwargs)

        try:
            loop = asyncio.get_running_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(
                        [prompt],
                        generation_config=config,
                    ),
                ),
                timeout=15.0,
            )

            if not response.candidates:
                logger.warning("Enrichment Gemini: empty candidates")
                return None

            text = response.text
            if not text:
                logger.warning("Enrichment Gemini: empty response text")
                return None

            return text.strip()

        except asyncio.TimeoutError:
            logger.error("Enrichment Gemini: timeout (15s)")
            return None
        except Exception as e:
            logger.error(f"Enrichment Gemini error: {e}")
            return None


# Singleton instance
_enrichment_service: Optional[EnrichmentService] = None


def get_enrichment_service() -> EnrichmentService:
    """Get or create the singleton EnrichmentService."""
    global _enrichment_service
    if _enrichment_service is None:
        _enrichment_service = EnrichmentService()
    return _enrichment_service
