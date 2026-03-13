"""
Enrichment Service — Gemini-powered automatic enrichment for fiscal services.

Generates descriptions (ES), translates to FR/EN, and generates keywords.
Pattern: Same as LLMBriefingService (lazy init, run_in_executor, timeout, graceful fallback).
"""

import asyncio
import json
import re
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

MINISTRY_DESCRIPTION_PROMPT = """Eres un experto en la administración pública de Guinea Ecuatorial.
Genera una descripción concisa (2-3 frases, máximo 250 caracteres) para el siguiente ministerio.
La descripción debe explicar: la misión del ministerio y sus competencias principales.

DATOS DEL MINISTERIO:
- Nombre: {name_es}
- Código: {ministry_code}
- Sectores: {sectors}
- Número de servicios fiscales gestionados: {service_count}

REGLAS CRÍTICAS:
1. SOLO información derivable de los datos y del nombre del ministerio — NO inventar
2. Tono formal institucional
3. En español
4. Máximo 250 caracteres

Responde SOLO con el texto de la descripción, sin comillas ni prefijos."""

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

# Max lengths — defense against unusually long LLM output
_MAX_DESCRIPTION_LEN = 500
_MAX_NAME_LEN = 200
_MAX_KEYWORD_LEN = 50

_HTML_TAG_RE = re.compile(r"<[^>]+>")

# Human-readable labels for service_type enum
_SERVICE_TYPE_LABELS = {
    "document_processing": "Procesamiento de documentos",
    "license_permit": "Licencia o permiso",
    "residence_permit": "Permiso de residencia",
    "registration_fee": "Tasa de registro",
    "inspection_fee": "Tasa de inspección",
    "administrative_tax": "Tasa administrativa",
    "customs_duty": "Derecho de aduana",
    "declaration_tax": "Tasa de declaración",
}


def _sanitize_llm_text(text: str, max_len: int = 500) -> str:
    """Strip HTML tags and truncate LLM output. Defense-in-depth against XSS."""
    cleaned = _HTML_TAG_RE.sub("", text).strip()
    return cleaned[:max_len]


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
        has_description = bool(
            current_description and current_description.strip()
        )

        if not has_description:
            # No description → enqueue generation (unless manually cleared)
            if description_source != "manual":
                result = await EnrichmentRepository.enqueue(
                    conn, service_id, "generate_description", priority=1
                )
                if result:
                    enqueued += 1
            # Do NOT enqueue translations — nothing to translate yet.
            # Translations will be enqueued after description is generated
            # (via seed-batch or next CRUD update).
        else:
            # Has description → enqueue translations (idempotent)
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

        Uses atomic claim pattern:
        1. Transaction: SELECT FOR UPDATE SKIP LOCKED + UPDATE status='processing'
        2. Commit (releases locks, but tasks are now 'processing' = safe from other replicas)
        3. Process tasks one by one (Gemini calls, outside transaction)
        """
        self._ensure_initialized()

        if not self._model:
            logger.warning("Gemini model not available — skipping enrichment batch")
            return {"processed": 0, "failed": 0, "skipped": 0, "tokens_total": 0}

        # Phase 1: Atomically claim a batch (fetch + mark processing in 1 TX)
        async with conn.transaction():
            tasks = await EnrichmentRepository.fetch_pending_batch(conn, limit)
            if not tasks:
                return {"processed": 0, "failed": 0, "skipped": 0, "tokens_total": 0}
            # Immediately mark ALL fetched tasks as 'processing' while lock is held
            task_ids = [t["id"] for t in tasks]
            await EnrichmentRepository.mark_processing_batch(conn, task_ids)

        # Phase 2: Process tasks one by one (outside transaction — Gemini calls are slow)
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
                # Ministry tasks use a different context path
                if task_type == "generate_ministry_description":
                    context = None  # handled inside the handler
                else:
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

                    # Defer translations if no description yet (don't waste attempts)
                    if task_type in ("translate_fr", "translate_en"):
                        if not context.get("description_es"):
                            await EnrichmentRepository.mark_deferred(
                                conn, task_id,
                                "No description_es to translate — deferred until description is generated"
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
                elif task_type == "generate_ministry_description":
                    tokens = await self._generate_ministry_description(conn, task_id, service_id)
                else:
                    await EnrichmentRepository.mark_failed(
                        conn, task_id, f"Unknown task_type: {task_type}"
                    )
                    failed += 1
                    continue

                elapsed = round(time.monotonic() - start, 2)

                # tokens == 0 means handler called mark_failed internally
                if tokens == 0:
                    failed += 1
                    continue

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
        raw_type = context.get("service_type", "")
        prompt = DESCRIPTION_PROMPT.format(
            name_es=context.get("name_es", ""),
            category=context.get("category_name", "Sin categoría"),
            ministry=context.get("ministry_name", "Sin ministerio"),
            service_type=_SERVICE_TYPE_LABELS.get(raw_type, raw_type),
            price=context.get("tasa_expedicion", 0),
            documents=context.get("documents_es", "No especificados"),
            keywords=context.get("keywords_es", ""),
        )

        text = await self._call_gemini(prompt, max_tokens=300)
        if not text:
            await EnrichmentRepository.mark_failed(conn, task_id, "Empty Gemini response")
            return 0

        # Clean response — strip HTML tags (defense-in-depth) + quotes
        description = _sanitize_llm_text(text.strip('"').strip("'"), _MAX_DESCRIPTION_LEN)
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

        # Auto-enqueue translations now that we have a description
        for lang_task in ("translate_fr", "translate_en"):
            await EnrichmentRepository.enqueue(
                conn, context["id"], lang_task, priority=0
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

        # Parse JSON response + sanitize
        try:
            data = json.loads(text)
            translated_name = _sanitize_llm_text(data.get("name", ""), _MAX_NAME_LEN)
            translated_desc = _sanitize_llm_text(data.get("description", ""), _MAX_DESCRIPTION_LEN)
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
                WHERE entity_translations.translation_source != 'manual'
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
                clean_kw = _sanitize_llm_text(kw, _MAX_KEYWORD_LEN).lower().strip()
                if len(clean_kw) < 2:
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
                    clean_kw,
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
    # Ministry description generation
    # ------------------------------------------------------------------

    async def _generate_ministry_description(
        self, conn, task_id: UUID, ministry_id: int
    ) -> int:
        """Generate draft description for a ministry via Gemini Flash."""
        context = await EnrichmentRepository.get_ministry_context(conn, ministry_id)
        if not context:
            await EnrichmentRepository.mark_failed(
                conn, task_id, f"Ministry {ministry_id} not found"
            )
            return 0

        prompt = MINISTRY_DESCRIPTION_PROMPT.format(
            name_es=context.get("name_es", ""),
            ministry_code=context.get("ministry_code", ""),
            sectors=context.get("sector_names", "Sin sectores"),
            service_count=context.get("service_count", 0),
        )

        text = await self._call_gemini(prompt, max_tokens=300)
        if not text:
            await EnrichmentRepository.mark_failed(conn, task_id, "Empty Gemini response")
            return 0

        description = _sanitize_llm_text(text.strip('"').strip("'"), _MAX_DESCRIPTION_LEN)
        if len(description) < 10:
            await EnrichmentRepository.mark_failed(
                conn, task_id, f"Description too short: {description}"
            )
            return 0

        # Store as ai_draft — admin must approve before it becomes visible
        await conn.execute(
            """
            UPDATE ministries
            SET description_es = $1, description_source = 'ai_draft', updated_at = NOW()
            WHERE id = $2
              AND (description_source IS NULL OR description_source = 'ai_draft')
            """,
            description,
            ministry_id,
        )

        tokens = len(prompt.split()) + len(description.split())
        await EnrichmentRepository.mark_completed(
            conn, task_id,
            output_data={"description": description, "entity": "ministry"},
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
