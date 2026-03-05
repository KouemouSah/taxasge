"""
ToolRegistry — Dynamic agent tool configuration registry.

Architecture: ToolRegistry holds per-agent-type configurations (functions, prompts,
artifacts builders). DynamicAnalystService loads a ToolSet from the registry
at instantiation time, avoiding N hardcoded service classes.

Supports 3 dispatch patterns:
  1. Direct tools: agent_type -> ToolSet with SQL functions (treasury, admin, supervisor)
  2. Agent-to-Agent (A2A): orchestrator calls sub-agents via meta-functions
  3. Composite: mix of direct tools + sub-agent delegation

Registry is populated at module import time (lazy imports avoid circular deps).
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from loguru import logger


@dataclass
class ToolSet:
    """Configuration for a single agent type.

    Attributes:
        function_declarations: List of Gemini FunctionDeclaration objects.
        function_map: Dict mapping function names to async callables (db, **kwargs) -> dict.
        prompt_template: Static prompt string OR template with {placeholders} for dynamic agents.
        prompt_fn: Optional callable(entity_context) -> str for complex prompt generation.
            If provided, takes precedence over prompt_template.
        artifacts_builder: Optional callable(tool_results) -> List[dict] for rich data viz.
        max_tool_rounds: Maximum Gemini tool-calling rounds (default 2, max 3).
        second_call_max_tokens: Max output tokens for the analysis call.
        agent_type_label: Human-readable label for logging.
        sub_agents: Dict of sub-agent configs for A2A pattern.
            Each key = meta-function name, value = SubAgentConfig.
    """
    function_declarations: list = field(default_factory=list)
    function_map: Dict[str, Callable] = field(default_factory=dict)
    prompt_template: str = ""
    prompt_fn: Optional[Callable] = None
    artifacts_builder: Optional[Callable] = None
    max_tool_rounds: int = 2
    second_call_max_tokens: int = 2048
    agent_type_label: str = ""
    sub_agents: Dict[str, "SubAgentConfig"] = field(default_factory=dict)


@dataclass
class SubAgentConfig:
    """Configuration for a sub-agent in A2A pattern.

    The orchestrator's meta-function delegates to a sub-agent by calling
    DynamicAnalystService(target_agent_type, entity_context).process_question().

    Attributes:
        target_agent_type: The agent_type to delegate to (must be registered).
        description: Description for Gemini FunctionDeclaration (routing hint).
        requires_entity_code: If True, Gemini must provide entity_code parameter.
    """
    target_agent_type: str
    description: str
    requires_entity_code: bool = False


class ToolRegistry:
    """Singleton registry of agent tool configurations.

    Process-safe: each uvicorn worker gets its own registry instance.
    Lazy loading: actual function imports happen on first access.
    Not thread-safe — relies on Python GIL + single-threaded asyncio event loop.
    """

    _instance: Optional["ToolRegistry"] = None
    _registry: Dict[str, ToolSet] = {}
    _initialized: bool = False

    def __new__(cls) -> "ToolRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def register(self, agent_type: str, tool_set: ToolSet) -> None:
        """Register a ToolSet for an agent type. Overwrites if exists."""
        self._registry[agent_type] = tool_set
        logger.debug(
            f"ToolRegistry: registered '{agent_type}' "
            f"({len(tool_set.function_declarations)} functions"
            f"{', ' + str(len(tool_set.sub_agents)) + ' sub-agents' if tool_set.sub_agents else ''})"
        )

    def get(self, agent_type: str) -> ToolSet:
        """Get ToolSet for an agent type. Raises KeyError if not found."""
        self._ensure_initialized()
        if agent_type not in self._registry:
            available = list(self._registry.keys())
            raise KeyError(
                f"Unknown agent_type '{agent_type}'. "
                f"Available: {available}"
            )
        return self._registry[agent_type]

    def list_agent_types(self) -> List[str]:
        """List all registered agent types."""
        self._ensure_initialized()
        return list(self._registry.keys())

    def has(self, agent_type: str) -> bool:
        """Check if an agent type is registered."""
        self._ensure_initialized()
        return agent_type in self._registry

    def _ensure_initialized(self) -> None:
        """Lazy initialization — register all agent types on first access."""
        if self._initialized:
            return
        self._initialized = True
        _register_all_agents(self)


# ── Module-level singleton ────────────────────────────────────────────────────

tool_registry = ToolRegistry()


# ── Lazy registration (avoids circular imports) ──────────────────────────────

def _register_all_agents(registry: ToolRegistry) -> None:
    """Register all known agent types. Called once on first registry access."""
    _register_treasury(registry)
    _register_admin(registry)
    _register_supervisor(registry)
    _register_orchestrator(registry)


def _register_treasury(registry: ToolRegistry) -> None:
    """Register treasury agent from existing TreasuryAnalystService constants."""
    try:
        from app.modules.service_requests.services.treasury_analyst_service import (
            FUNCTION_MAP as TREASURY_FUNCTION_MAP,
            _FUNC_DECLS as TREASURY_FUNC_DECLS,
            SYSTEM_PROMPT_TEMPLATE as TREASURY_PROMPT_TEMPLATE,
        )
        from datetime import datetime, timezone

        def treasury_prompt_fn(_ctx: dict) -> str:
            """Generate treasury prompt with current date (existing behavior)."""
            from app.modules.shared.services.base_analyst_service import DAYS_ES
            now = datetime.now(timezone.utc)
            return TREASURY_PROMPT_TEMPLATE.format(
                current_date=now.strftime("%Y-%m-%d"),
                day_of_week=DAYS_ES[now.weekday()],
            )

        # Import artifacts builder — use unbound method to avoid creating orphan instance
        artifacts_builder = None
        try:
            from app.modules.service_requests.services.treasury_analyst_service import (
                TreasuryAnalystService,
            )
            # _build_artifacts doesn't use self — call as unbound with None
            _unbound = TreasuryAnalystService._build_artifacts
            artifacts_builder = lambda tool_results: _unbound(None, tool_results)
        except Exception:
            pass

        registry.register("treasury", ToolSet(
            function_declarations=TREASURY_FUNC_DECLS,
            function_map=TREASURY_FUNCTION_MAP,
            prompt_fn=treasury_prompt_fn,
            artifacts_builder=artifacts_builder,
            max_tool_rounds=3,
            second_call_max_tokens=4096,
            agent_type_label="Treasury Analyst",
        ))
    except ImportError as e:
        logger.warning(f"ToolRegistry: treasury registration failed: {e}")


def _register_admin(registry: ToolRegistry) -> None:
    """Register admin agent from existing AdminAssistantService constants."""
    try:
        from app.modules.agents.services.admin_assistant_service import (
            FUNCTION_MAP as ADMIN_FUNCTION_MAP,
            TOOL_FUNCTIONS as ADMIN_TOOL_FUNCTIONS,
            SYSTEM_PROMPT as ADMIN_SYSTEM_PROMPT,
        )

        registry.register("admin", ToolSet(
            function_declarations=ADMIN_TOOL_FUNCTIONS,
            function_map=ADMIN_FUNCTION_MAP,
            prompt_template=ADMIN_SYSTEM_PROMPT,
            max_tool_rounds=2,
            second_call_max_tokens=2048,
            agent_type_label="Admin Assistant",
        ))
    except ImportError as e:
        logger.warning(f"ToolRegistry: admin registration failed: {e}")


def _register_supervisor(registry: ToolRegistry) -> None:
    """Register supervisor agent with 8 SQL functions from supervisor_tools."""
    try:
        from app.modules.shared.services.supervisor_tools import (
            SUPERVISOR_FUNCTION_MAP,
            SUPERVISOR_FUNC_DECLS,
            SUPERVISOR_PROMPT_TEMPLATE,
            supervisor_build_artifacts,
        )

        registry.register("supervisor", ToolSet(
            function_declarations=SUPERVISOR_FUNC_DECLS,
            function_map=SUPERVISOR_FUNCTION_MAP,
            prompt_template=SUPERVISOR_PROMPT_TEMPLATE,
            artifacts_builder=supervisor_build_artifacts,
            max_tool_rounds=2,
            second_call_max_tokens=2048,
            agent_type_label="Supervisor Assistant",
        ))
    except ImportError as e:
        logger.warning(f"ToolRegistry: supervisor registration failed: {e}")
        # Fallback: register empty supervisor so KeyError doesn't crash
        registry.register("supervisor", ToolSet(
            function_declarations=[],
            function_map={},
            prompt_template="Supervisor agent tools not available.",
            agent_type_label="Supervisor Assistant (fallback)",
        ))


def _register_orchestrator(registry: ToolRegistry) -> None:
    """Register orchestrator agent (A2A pattern — agent-of-agents).

    The orchestrator has 3 meta-functions that delegate to specialized sub-agents.
    This avoids giving Gemini 36+ functions to choose from (routing degrades >20).

    Instead, Gemini selects which SUB-AGENT to route to, and the sub-agent
    handles the actual data retrieval with its own specialized tools.
    """
    registry.register("orchestrator", ToolSet(
        function_declarations=[],  # Populated dynamically in DynamicAnalystService
        function_map={},           # Populated dynamically (requires DynamicAnalystService ref)
        prompt_template=(
            "Eres el Director General de la plataforma Facil (Gobierno de Guinea Ecuatorial).\n"
            "Tienes acceso a 3 agentes especializados que puedes consultar:\n\n"
            "1. **ask_treasury** — Analista Financiero del Tesoro Público.\n"
            "   Para preguntas sobre: ingresos, pagos, SLA de pagos, reconciliación bancaria,\n"
            "   tendencias financieras, anomalías de pago, previsiones.\n\n"
            "2. **ask_admin** — Asistente de Administración de Agentes.\n"
            "   Para preguntas sobre: disponibilidad de agentes, carga de trabajo,\n"
            "   rendimiento, anomalías cross-entidad, equilibrio de recursos.\n\n"
            "3. **ask_supervisor** — Supervisor de Entidad (requiere entity_code).\n"
            "   Para preguntas sobre: solicitudes de servicio de una entidad específica,\n"
            "   pipeline de workflows, SLA de procesamiento, agentes de la entidad.\n\n"
            "REGLAS:\n"
            "- Delega SIEMPRE a la función correcta. No respondas sin datos.\n"
            "- Para preguntas mixtas (ej: 'ingresos Y solicitudes'), llama AMBAS funciones.\n"
            "- Si el usuario pregunta sobre una entidad específica, usa ask_supervisor con su código.\n"
            "- Sintetiza las respuestas de los sub-agentes en un análisis consolidado.\n"
            "- Responde en español. Sé factual y conciso.\n"
            "- Fecha actual: {current_date} ({day_of_week}).\n"
        ),
        sub_agents={
            "ask_treasury": SubAgentConfig(
                target_agent_type="treasury",
                description=(
                    "Consultar al Analista Financiero del Tesoro sobre ingresos, pagos, "
                    "SLA de pagos, reconciliación bancaria, tendencias, anomalías y previsiones."
                ),
                requires_entity_code=False,
            ),
            "ask_admin": SubAgentConfig(
                target_agent_type="admin",
                description=(
                    "Consultar al Asistente de Administración sobre agentes, carga de trabajo, "
                    "rendimiento, anomalías cross-entidad y equilibrio de recursos."
                ),
                requires_entity_code=False,
            ),
            "ask_supervisor": SubAgentConfig(
                target_agent_type="supervisor",
                description=(
                    "Consultar al Supervisor de una entidad específica sobre solicitudes "
                    "de servicio, pipeline de workflows, SLA de procesamiento y agentes. "
                    "Requiere entity_code (ej: CNEDOGE_PASAPORTE, DGT, MINFP, ONRC)."
                ),
                requires_entity_code=True,
            ),
        },
        max_tool_rounds=3,  # Orchestrator may need multiple sub-agent calls
        second_call_max_tokens=4096,
        agent_type_label="Director General (Orchestrator)",
    ))
