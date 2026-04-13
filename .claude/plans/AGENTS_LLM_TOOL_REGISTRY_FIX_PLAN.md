# Fix tool_registry.py — `'FunctionDeclaration' object has no attribute 'name'`

## Contexte production (Cloud Run logs)

```
ERROR | app.main:global_exception_handler:357
       Unhandled exception: 'FunctionDeclaration' object has no attribute 'name'
File "/app/app/modules/shared/services/tool_registry.py", line 211, in _register_admin
  admin_merged_decls = list(ADMIN_TOOL_FUNCTIONS) + [d for d in _ADFD if d.name in admin_tools]
AttributeError: 'FunctionDeclaration' object has no attribute 'name'
```

**Endpoint cassé** : `GET /api/v1/agents/analyst/agents` → 500.

**Impact** : tous les registries d'agents échouent. Le frontend ne peut pas lister les agents du superviseur. Le `list_registered_agents` est l'entrée du picker analyst côté UI — sans lui, l'onglet analyst est mort.

## Diagnostic root cause

`DECISION_FUNC_DECLS` (`agent_decision_tools.py:623-668`) est construit avec :

```python
from vertexai.generative_models import FunctionDeclaration as _FD
DECISION_FUNC_DECLS = [
    _FD(name="ai_decision_support", description="...", parameters={...}),
    ...
]
```

Le SDK `vertexai.generative_models.FunctionDeclaration` est un wrapper **proto-plus** : `name` est passé au constructeur mais **n'est pas exposé comme attribut Python lisible** dans certaines versions du SDK. Tentative `.name` → `AttributeError`.

Le log proto string montre bien que la donnée est là (`name: "ai_decision_support"`) mais inaccessible via `.name`.

**3 occurrences identiques** dans `tool_registry.py` :

| Ligne | Méthode | Code buggé |
|---|---|---|
| 211 | `_register_admin` | `[d for d in _ADFD if d.name in admin_tools]` |
| 293 | `_register_supervisor` | `[d for d in _DFD if d.name in sup_tools]` |
| 342 | `_register_entity_agent` | `[d for d in DECISION_FUNC_DECLS if d.name in entity_tools]` |

**Tous les 3** crashent `_register_all_agents` qui crashe `_ensure_initialized` qui crashe TOUS les endpoints `/agents/analyst/*`.

## Architecture du fix

### Principe

Plutôt que d'introspecter `FunctionDeclaration.name` (fragile selon version SDK), **stocker explicitement le mapping `name → FunctionDeclaration`** au moment de la construction, où on a déjà la string `name` sous la main.

Source unique : une liste de tuples `(name, declaration)`. Les 2 collections (liste pour Gemini config, dict pour name lookup) sont dérivées de la même source.

### Fichiers modifiés

| Fichier | Type |
|---|---|
| `packages/backend/app/modules/shared/services/agent_decision_tools.py` | M — refactor exports en source unique |
| `packages/backend/app/modules/shared/services/tool_registry.py` | M — 3 sites de bug fixés |

### Fix 1: `agent_decision_tools.py`

Refactor des exports DECISION_* :

```python
DECISION_FUNCTION_MAP = {
    "ai_decision_support": ai_decision_support,
    ...
}

# Source de vérité unique : tuples (name, FunctionDeclaration) pour
# garantir que les deux collections ne peuvent jamais désynchroniser.
DECISION_FUNC_DECLS_BY_NAME: Dict[str, Any] = {}
DECISION_FUNC_DECLS: List[Any] = []
try:
    from vertexai.generative_models import FunctionDeclaration as _FD
    _DECLS_SOURCE = [
        ("ai_decision_support", _FD(name="ai_decision_support", description="...", parameters=...)),
        ("assess_request_risk", _FD(name="assess_request_risk", description="...", parameters=...)),
        # ... 8 entries total
    ]
    DECISION_FUNC_DECLS_BY_NAME = dict(_DECLS_SOURCE)
    DECISION_FUNC_DECLS = [d for _, d in _DECLS_SOURCE]
except ImportError:
    try:
        from google.generativeai.types import FunctionDeclaration as _FD2
        _DECLS_SOURCE = [
            ("ai_decision_support", _FD2(name=..., description=..., parameters=...)),
            ...
        ]
        DECISION_FUNC_DECLS_BY_NAME = dict(_DECLS_SOURCE)
        DECISION_FUNC_DECLS = [d for _, d in _DECLS_SOURCE]
    except ImportError:
        pass  # Gemini SDK absent — DECISION_FUNC_DECLS reste vide
```

Backward compat : `DECISION_FUNC_DECLS` reste une `list[FunctionDeclaration]` consommée par les configs Gemini.

### Fix 2: `tool_registry.py:211` (_register_admin)

```python
# Avant
from app.modules.shared.services.agent_decision_tools import DECISION_FUNCTION_MAP as _ADFM, DECISION_FUNC_DECLS as _ADFD
admin_tools = ('get_system_health', 'optimize_workload')
admin_merged_map = dict(ADMIN_FUNCTION_MAP)
admin_merged_map.update({k: v for k, v in _ADFM.items() if k in admin_tools})
admin_merged_decls = list(ADMIN_TOOL_FUNCTIONS) + [d for d in _ADFD if d.name in admin_tools]

# Après
from app.modules.shared.services.agent_decision_tools import (
    DECISION_FUNCTION_MAP as _ADFM,
    DECISION_FUNC_DECLS_BY_NAME as _ADFD_BY_NAME,
)
admin_tools = ('get_system_health', 'optimize_workload')
admin_merged_map = dict(ADMIN_FUNCTION_MAP)
admin_merged_map.update({k: v for k, v in _ADFM.items() if k in admin_tools})
admin_merged_decls = list(ADMIN_TOOL_FUNCTIONS) + [
    _ADFD_BY_NAME[name] for name in admin_tools if name in _ADFD_BY_NAME
]
```

### Fix 3: `tool_registry.py:293` (_register_supervisor)

```python
# Avant
from app.modules.shared.services.agent_decision_tools import DECISION_FUNCTION_MAP as _DFM, DECISION_FUNC_DECLS as _DFD
sup_tools = ('predict_sla_risk', 'suggest_reassignment')
all_func_map.update({k: v for k, v in _DFM.items() if k in sup_tools})
all_func_decls = all_func_decls + [d for d in _DFD if d.name in sup_tools]

# Après
from app.modules.shared.services.agent_decision_tools import (
    DECISION_FUNCTION_MAP as _DFM,
    DECISION_FUNC_DECLS_BY_NAME as _DFD_BY_NAME,
)
sup_tools = ('predict_sla_risk', 'suggest_reassignment')
all_func_map.update({k: v for k, v in _DFM.items() if k in sup_tools})
all_func_decls = all_func_decls + [
    _DFD_BY_NAME[name] for name in sup_tools if name in _DFD_BY_NAME
]
```

### Fix 4: `tool_registry.py:342` (_register_entity_agent)

```python
# Avant
from app.modules.shared.services.agent_decision_tools import DECISION_FUNCTION_MAP, DECISION_FUNC_DECLS
entity_tools = ('ai_decision_support', 'assess_request_risk', 'find_similar_cases', 'summarize_request')
merged_map = dict(ENTITY_AGENT_FUNCTION_MAP)
merged_map.update({k: v for k, v in DECISION_FUNCTION_MAP.items() if k in entity_tools})
merged_decls = list(ENTITY_AGENT_FUNC_DECLS) + [d for d in DECISION_FUNC_DECLS if d.name in entity_tools]

# Après
from app.modules.shared.services.agent_decision_tools import (
    DECISION_FUNCTION_MAP,
    DECISION_FUNC_DECLS_BY_NAME,
)
entity_tools = ('ai_decision_support', 'assess_request_risk', 'find_similar_cases', 'summarize_request')
merged_map = dict(ENTITY_AGENT_FUNCTION_MAP)
merged_map.update({k: v for k, v in DECISION_FUNCTION_MAP.items() if k in entity_tools})
merged_decls = list(ENTITY_AGENT_FUNC_DECLS) + [
    DECISION_FUNC_DECLS_BY_NAME[name] for name in entity_tools if name in DECISION_FUNC_DECLS_BY_NAME
]
```

## Pourquoi cette approche est plus robuste

| Aspect | Avant (introspection) | Après (dict explicit) |
|---|---|---|
| **Robustesse SDK** | Cassé sur certaines versions vertexai | Indépendant du SDK — on stocke ce qu'on a passé |
| **Performance** | O(n) iteration par lookup | O(1) hash lookup |
| **Maintenabilité** | Couplage à l'API interne du protobuf wrapper | API stable Python `dict` |
| **Ordre d'évaluation** | `if-name-in-tuple` doit fonctionner avant filtrage | Filtre direct par clé |
| **Synchronisation** | Aucune garantie liste/mapping cohérents | Source unique = tuples |

## Tests

### Unit test (nouveau)

`tests/unit/shared/test_tool_registry_agent_decls.py`:

```python
"""Verify FunctionDeclaration name lookup works regardless of vertexai SDK version."""

def test_decision_func_decls_by_name_exists_and_aligns():
    from app.modules.shared.services.agent_decision_tools import (
        DECISION_FUNCTION_MAP,
        DECISION_FUNC_DECLS,
        DECISION_FUNC_DECLS_BY_NAME,
    )
    # Same set of keys
    assert set(DECISION_FUNC_DECLS_BY_NAME.keys()) == set(DECISION_FUNCTION_MAP.keys())
    # Length matches
    assert len(DECISION_FUNC_DECLS) == len(DECISION_FUNC_DECLS_BY_NAME)
    # Expected names present
    expected = {
        "ai_decision_support", "assess_request_risk", "find_similar_cases",
        "summarize_request", "predict_sla_risk", "suggest_reassignment",
        "get_system_health", "optimize_workload",
    }
    assert set(DECISION_FUNC_DECLS_BY_NAME.keys()) == expected


def test_tool_registry_initializes_without_crash():
    """The bug crashed _register_admin / _register_supervisor / _register_entity_agent."""
    from app.modules.shared.services.tool_registry import ToolRegistry
    registry = ToolRegistry()
    # Force initialization
    registry._ensure_initialized()
    agent_types = registry.list_agent_types()
    # At minimum admin must register without crashing
    assert "admin" in agent_types
```

### Smoke test BD/runtime

```python
from app.modules.shared.services.tool_registry import ToolRegistry
r = ToolRegistry()
print(r.list_agent_types())
# Expected: ['treasury', 'admin', 'supervisor', 'entity_agent', 'orchestrator', ...]
```

## Checklist

### Modifications
- [ ] `agent_decision_tools.py` : refactor en `_DECLS_SOURCE` tuples + export `DECISION_FUNC_DECLS_BY_NAME` (les 2 branches try/except)
- [ ] `tool_registry.py:211` : utilise `_ADFD_BY_NAME`
- [ ] `tool_registry.py:293` : utilise `_DFD_BY_NAME`
- [ ] `tool_registry.py:342` : utilise `DECISION_FUNC_DECLS_BY_NAME`

### Validation
- [ ] `py_compile` sur les 2 fichiers
- [ ] Nouveau test unitaire `test_tool_registry_agent_decls.py` (2 tests)
- [ ] Tests existants ne régressent pas (chatbot, executive_consent, auto_classify, suggest_appointment, proactive_agent)
- [ ] Smoke test direct: `python -c "from app.modules.shared.services.tool_registry import ToolRegistry; r = ToolRegistry(); print(r.list_agent_types())"`

### Push (workflow strict)
- [ ] **Stop après commit local** — afficher diff + résultats tests
- [ ] **Attendre validation explicite "push"** de l'utilisateur
- [ ] Push uniquement après go

## Risques

| Risque | Mitigation |
|---|---|
| Autres consumers de `DECISION_FUNC_DECLS` cassés | List préservée, dict ajouté en parallèle |
| `vertexai.generative_models` indisponible (fallback Gemini SDK) | Les 2 branches try/except modifiées identiquement |
| Tests existants utilisent l'ancien import | Grep préventif avant commit |
| Frontend agent picker reste cassé pour autre raison | Smoke test du registry confirme initialization OK ; UI test à valider en staging |

## Hors scope

- Refactor de `tool_registry.py` global (pas nécessaire pour le fix)
- Migration complète vers une couche d'abstraction FunctionDeclaration (out of scope)
- Tests E2E du picker agent dans le frontend (manuel)
