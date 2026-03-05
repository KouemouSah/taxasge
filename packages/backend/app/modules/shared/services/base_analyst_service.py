"""
Base Analyst Service — Abstract base for Gemini function-calling agents.

Multi-round Gemini pattern used by TreasuryAnalystService and AdminAssistantService:
  Question → Gemini → tool selection → safe SQL → data
  → (optional round 2 if Gemini requests more tools)
  → Gemini → analysis

Subclasses override:
  - _get_system_prompt()
  - _get_function_declarations()
  - _get_function_map()
  - _get_service_name()  (logging label)

Optional overrides:
  - _get_model_name()          (default: gemini-2.0-flash)
  - _get_vertex_config()       (project/location)
  - _get_second_call_max_tokens()  (default: 2048)
  - _get_max_tool_rounds()     (default: 2, max: 3)

Design: LLM NEVER generates SQL. It routes to predefined safe functions.
Parallel execution uses separate pooled connections (asyncpg requirement).
Entity-scoped: all queries filtered by user's entity context.
"""

import abc
import asyncio
import json
import time
from typing import Any, Callable, Dict, List, Optional

from loguru import logger

from app.config import get_settings

try:
    from vertexai.generative_models import (
        GenerativeModel,
        GenerationConfig,
        Tool,
        FunctionDeclaration,
        Part,
        Content,
    )
    import vertexai

    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False
    logger.warning("Vertex AI SDK not available - analyst services disabled")

# ToolConfig mode=ANY forces Gemini to always call at least one function on the first round.
# Degrades gracefully if the SDK version doesn't support it.
_TOOL_CONFIG_ANY = None
try:
    from vertexai.generative_models import ToolConfig as _ToolConfig  # type: ignore[attr-defined]
    _TOOL_CONFIG_ANY = _ToolConfig(
        function_calling_config=_ToolConfig.FunctionCallingConfig(
            mode=_ToolConfig.FunctionCallingConfig.Mode.ANY,
        )
    )
    logger.info("ToolConfig mode=ANY loaded — Gemini will always call a tool on first round")
except Exception:
    logger.warning("ToolConfig not available — Gemini may bypass function calling (mode=AUTO)")

# Shared constants
GEMINI_TIMEOUT_FIRST_CALL = 25.0
GEMINI_TIMEOUT_SECOND_CALL = 30.0
GEMINI_TIMEOUT_EXTRA_ROUND = 20.0
MAX_INIT_RETRIES = 3
INIT_RETRY_DELAY = 2.0
FIRST_CALL_MAX_TOKENS = 1024  # Increased from 512: multi-tool selection needs more token budget
SECOND_CALL_MAX_TOKENS = 2048
MAX_TOOL_ROUNDS = 2  # Default; subclass can override up to 3


class BaseAnalystService(abc.ABC):
    """Abstract base for Gemini function-calling analyst agents."""

    def __init__(self):
        self._model: Optional[Any] = None
        self._initialized = False
        self._init_failures = 0

    # ---- Abstract interface ----

    @abc.abstractmethod
    def _get_system_prompt(self) -> str:
        """Return the system instruction for Gemini."""
        ...

    @abc.abstractmethod
    def _get_function_declarations(self) -> list:
        """Return list of FunctionDeclaration objects for Gemini tools."""
        ...

    @abc.abstractmethod
    def _get_function_map(self) -> Dict[str, Callable]:
        """Return mapping fn_name -> async callable(db, **kwargs)."""
        ...

    # ---- Optional overrides ----

    def _get_service_name(self) -> str:
        """Human-readable name for logging."""
        return self.__class__.__name__

    def _get_model_name(self) -> str:
        """Gemini model name."""
        settings = get_settings()
        return getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")

    def _get_vertex_config(self) -> Dict[str, str]:
        """Return {project, location} for vertexai.init()."""
        settings = get_settings()
        project = (
            getattr(settings, "VERTEX_AI_PROJECT_ID", None)
            or getattr(settings, "GCP_PROJECT_ID", None)
            or getattr(settings, "GOOGLE_CLOUD_PROJECT", None)
        )
        location = (
            getattr(settings, "VERTEX_AI_LOCATION", None)
            or getattr(settings, "GOOGLE_CLOUD_LOCATION", "us-central1")
        )
        return {"project": project, "location": location}

    def _get_second_call_max_tokens(self) -> int:
        """Max output tokens for the analysis call (second Gemini call)."""
        return SECOND_CALL_MAX_TOKENS

    def _get_max_tool_rounds(self) -> int:
        """Max rounds of tool calling before final analysis. Default 2, max 3.

        Round 1: Initial question → Gemini selects tools → execute
        Round 2+: Gemini sees results, may request MORE tools → execute
        Final: Gemini generates text analysis from all accumulated data
        """
        return MAX_TOOL_ROUNDS

    def _build_artifacts(self, tool_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build typed artifacts from tool results. Override in subclass.

        Returns list of artifacts, each with a 'type' discriminator:
        - table: {"type": "table", "title": str, "headers": [...], "rows": [[...]], "alignments": [...]}
        - kpi_grid: {"type": "kpi_grid", "title": str, "metrics": [{"label": str, "value": str, ...}]}
        - summary: {"type": "summary", "title": str, "content": str, "severity": str|None}
        """
        return []

    # ---- Shared implementation ----

    def _ensure_initialized(self):
        """Lazy initialization with retry. Safe to call multiple times."""
        if self._initialized and self._model is not None:
            return

        if not VERTEX_AI_AVAILABLE:
            self._initialized = True
            return

        if self._init_failures >= MAX_INIT_RETRIES:
            return

        try:
            config = self._get_vertex_config()
            if config.get("project"):
                vertexai.init(
                    project=config["project"],
                    location=config.get("location", "us-central1"),
                )

            func_decls = self._get_function_declarations()
            tools = [Tool(function_declarations=func_decls)] if func_decls else None

            self._model = GenerativeModel(
                self._get_model_name(),
                system_instruction=self._get_system_prompt(),
                tools=tools,
            )
            self._initialized = True
            self._init_failures = 0
            logger.info(f"{self._get_service_name()} initialized successfully")
        except Exception as e:
            self._init_failures += 1
            logger.error(
                f"{self._get_service_name()} init failed "
                f"(attempt {self._init_failures}/{MAX_INIT_RETRIES}): {e}"
            )
            if self._init_failures < MAX_INIT_RETRIES:
                time.sleep(INIT_RETRY_DELAY)
                self._ensure_initialized()

    async def process_question(
        self,
        db,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process a question using multi-round Gemini function-calling.

        Flow:
          Round 1: question → Gemini → tool selection → execute SQL
          Round 2+ (conditional): if Gemini requests MORE tools → execute
          Final: Gemini generates text analysis from all accumulated data

        Args:
            db: Database connection (fallback; parallel calls use pooled connections)
            question: User's natural language question
            context: Optional dict with:
                - entity_code: str — user's entity code (for data scoping)
                - entity_location_id: str — user's site UUID
                - is_supervisor: bool — True = global view, False = site-scoped
                - user_id: str — user UUID
                - previous_context: dict — previous question/tools for drill-down

        Returns:
            {"answer": str, "tools_used": list[str], "data": dict, "artifacts": list[dict]}
        """
        self._ensure_initialized()
        service_name = self._get_service_name()
        start_time = time.monotonic()
        ctx = context or {}

        if not self._model:
            return {
                "answer": "Servicio IA no disponible temporalmente. "
                          "Consulta los paneles de control.",
                "tools_used": [],
                "data": {},
                "artifacts": [],
            }

        tools_used: List[str] = []
        tool_results: Dict[str, Any] = {}
        function_map = self._get_function_map()
        max_rounds = min(self._get_max_tool_rounds(), 3)  # Hard cap at 3

        # Build the initial prompt with optional previous context for drill-down
        prompt_text = question
        prev = ctx.get("previous_context")
        if prev and prev.get("question"):
            prompt_text = (
                f"Contexto previo — Pregunta anterior: \"{prev['question']}\"\n"
                f"Funciones usadas: {', '.join(prev.get('tools_used', []))}\n"
                f"---\n"
                f"Nueva pregunta: {question}"
            )

        try:
            loop = asyncio.get_running_loop()
            from app.database.connection import db_manager

            # Entity-scoped kwargs injected into every SQL function call
            entity_kwargs = self._build_entity_kwargs(ctx)

            async def _exec_fn(fn_name: str, fn_args: dict):
                if fn_name not in function_map:
                    logger.warning(f"{service_name}: unknown function '{fn_name}'")
                    return fn_name, {"error": f"Función desconocida: {fn_name}"}
                try:
                    # Inject entity scope into every function call
                    merged_args = {**fn_args, **entity_kwargs}
                    async with db_manager.get_connection() as conn:
                        result = await function_map[fn_name](conn, **merged_args)
                    return fn_name, result
                except TypeError:
                    # Function doesn't accept entity kwargs — call without them
                    try:
                        async with db_manager.get_connection() as conn:
                            result = await function_map[fn_name](conn, **fn_args)
                        return fn_name, result
                    except Exception as e:
                        logger.error(f"{service_name} function {fn_name} failed: {e}")
                        return fn_name, {"error": str(e)}
                except Exception as e:
                    logger.error(f"{service_name} function {fn_name} failed: {e}")
                    return fn_name, {"error": str(e)}

            # ── Round 1: Initial question → Gemini → function calls ──
            # ToolConfig mode=ANY: forces Gemini to call at least one tool (no text-only escape).
            _r1_kwargs: dict = {
                "generation_config": GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=FIRST_CALL_MAX_TOKENS,
                ),
            }
            if _TOOL_CONFIG_ANY is not None:
                _r1_kwargs["tool_config"] = _TOOL_CONFIG_ANY

            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(prompt_text, **_r1_kwargs),
                ),
                timeout=GEMINI_TIMEOUT_FIRST_CALL,
            )

            if not response.candidates:
                logger.warning(f"{service_name}: empty candidates from Gemini")
                return {
                    "answer": "No se obtuvo respuesta. Reformula tu pregunta.",
                    "tools_used": [],
                    "data": {},
                    "artifacts": [],
                }

            # Extract function calls from response
            function_calls = self._extract_function_calls(response)

            if not function_calls:
                try:
                    text = (response.text or "").strip()
                except (ValueError, AttributeError):
                    text = ""
                return {
                    "answer": text or "No puedo responder sin datos. Sé más específico.",
                    "tools_used": [],
                    "data": {},
                    "artifacts": [],
                }

            # Execute round 1 tools
            tools_used, tool_results = await self._execute_function_calls(
                function_calls, _exec_fn, tools_used, tool_results
            )

            if not tool_results:
                return {
                    "answer": "Error ejecutando las funciones de datos.",
                    "tools_used": tools_used,
                    "data": {},
                    "artifacts": [],
                }

            # Build chat history for multi-round
            chat_history = [
                Content(role="user", parts=[Part.from_text(prompt_text)]),
                response.candidates[0].content,
            ]

            # ── Round 2..N: Conditional extra tool rounds ──
            current_round = 1
            last_response = response

            while current_round < max_rounds:
                # Send accumulated results back to Gemini
                fn_response_parts = self._build_function_response_parts(tool_results)
                chat_history.append(Content(role="user", parts=fn_response_parts))

                next_response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: self._model.generate_content(
                            chat_history,
                            generation_config=GenerationConfig(
                                temperature=0.2,
                                max_output_tokens=(
                                    FIRST_CALL_MAX_TOKENS
                                    if current_round < max_rounds - 1
                                    else self._get_second_call_max_tokens()
                                ),
                            ),
                        ),
                    ),
                    timeout=(
                        GEMINI_TIMEOUT_EXTRA_ROUND
                        if current_round < max_rounds - 1
                        else GEMINI_TIMEOUT_SECOND_CALL
                    ),
                )

                if not next_response.candidates:
                    break

                # Check if Gemini wants MORE tools (chain-of-tools)
                extra_calls = self._extract_function_calls(next_response)

                if extra_calls and current_round < max_rounds - 1:
                    # Gemini wants more data — execute extra tools
                    logger.info(
                        f"{service_name}: round {current_round + 1}, "
                        f"extra tools: {[fc.name for fc in extra_calls]}"
                    )
                    chat_history.append(next_response.candidates[0].content)
                    tools_used, tool_results = await self._execute_function_calls(
                        extra_calls, _exec_fn, tools_used, tool_results
                    )
                    current_round += 1
                    last_response = next_response
                else:
                    # Gemini produced text analysis — we're done
                    last_response = next_response
                    break

            # ── Extract final answer ──
            try:
                answer = (last_response.text or "").strip()
            except (ValueError, AttributeError):
                answer = ""
            if not answer:
                answer = "No se pudo generar el análisis. Consulta los paneles."

            latency = int((time.monotonic() - start_time) * 1000)
            logger.info(
                f"{service_name}: rounds={current_round + 1} tools={tools_used} "
                f"latency={latency}ms q={question[:50]}"
            )

            # Filter out error entries from returned data
            clean_data = {
                k: v
                for k, v in tool_results.items()
                if not isinstance(v, dict) or "error" not in v
            }
            artifacts = self._build_artifacts(clean_data)
            return {
                "answer": answer,
                "tools_used": tools_used,
                "data": clean_data,
                "artifacts": artifacts,
            }

        except asyncio.TimeoutError:
            latency = int((time.monotonic() - start_time) * 1000)
            logger.warning(
                f"{service_name} timed out after {latency}ms, tools={tools_used}"
            )
            if tool_results:
                clean_data = {
                    k: v
                    for k, v in tool_results.items()
                    if not isinstance(v, dict) or "error" not in v
                }
                artifacts = self._build_artifacts(clean_data)
                return {
                    "answer": "El análisis tardó demasiado. Datos parciales obtenidos.",
                    "tools_used": tools_used,
                    "data": clean_data,
                    "artifacts": artifacts,
                }
            return {
                "answer": "Consulta demasiado lenta. Intenta con una pregunta más específica.",
                "tools_used": tools_used,
                "data": {},
                "artifacts": [],
            }
        except Exception as e:
            logger.error(f"{service_name} error: {type(e).__name__}: {e}")
            return {
                "answer": "Error procesando la consulta.",
                "tools_used": tools_used,
                "data": {},
                "artifacts": [],
            }

    # ---- Multi-round helpers ----

    @staticmethod
    def _extract_function_calls(response) -> list:
        """Extract function_call parts from a Gemini response."""
        calls = []
        for candidate in response.candidates:
            if not hasattr(candidate, "content") or not candidate.content:
                continue
            for part in candidate.content.parts:
                if (
                    hasattr(part, "function_call")
                    and part.function_call
                    and part.function_call.name
                ):
                    calls.append(part.function_call)
        return calls

    @staticmethod
    async def _execute_function_calls(
        function_calls: list,
        exec_fn: Callable,
        tools_used: List[str],
        tool_results: Dict[str, Any],
    ) -> tuple:
        """Execute function calls in parallel, accumulating into tools_used and tool_results."""
        tasks = []
        for fc in function_calls:
            fn_name = fc.name
            try:
                fn_args = {k: v for k, v in fc.args.items()} if fc.args else {}
                fn_args = {
                    k: (int(v) if isinstance(v, float) and v == int(v) else v)
                    for k, v in fn_args.items()
                }
            except (TypeError, AttributeError):
                fn_args = {}
            tools_used.append(fn_name)
            tasks.append(exec_fn(fn_name, fn_args))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                logger.error(f"Function execution error: {r}")
                continue
            fn_name, fn_result = r
            tool_results[fn_name] = fn_result
        return tools_used, tool_results

    @staticmethod
    def _build_function_response_parts(tool_results: Dict[str, Any]) -> list:
        """Build Gemini function_response parts from tool results."""
        parts = []
        for fn_name, fn_result in tool_results.items():
            parts.append(
                Part.from_function_response(
                    name=fn_name,
                    response={
                        "result": json.dumps(
                            fn_result, default=str, ensure_ascii=False
                        )
                    },
                )
            )
        return parts

    @staticmethod
    def _build_entity_kwargs(ctx: Dict[str, Any]) -> Dict[str, Any]:
        """Build entity-scoping kwargs from context.

        Returns kwargs to inject into SQL functions:
        - _entity_code: user's entity code
        - _entity_location_id: user's site UUID
        - _is_main_office: whether user's site is the main office (global view)
        - _user_id: current user UUID
        """
        kwargs = {}
        if ctx.get("entity_code"):
            kwargs["_entity_code"] = ctx["entity_code"]
        if ctx.get("entity_location_id"):
            kwargs["_entity_location_id"] = ctx["entity_location_id"]
        if "is_main_office" in ctx:
            kwargs["_is_main_office"] = ctx["is_main_office"]
        if ctx.get("user_id"):
            kwargs["_user_id"] = ctx["user_id"]
        return kwargs
