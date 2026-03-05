# Architecture des Agents IA — Documentation Complete

> **Version** : 2.0 | **Date** : 2026-03-05 | **Statut** : Production
> **Auteur** : Claude Opus 4.6 | **Plateforme** : Facil (Guinee Equatoriale)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Schema architectural](#2-schema-architectural)
3. [Couche 1 — Endpoint unifie et resolution](#3-couche-1--endpoint-unifie-et-resolution)
4. [Couche 2 — ToolRegistry (Registre des agents)](#4-couche-2--toolregistry)
5. [Couche 3 — DynamicAnalystService (Moteur d'execution)](#5-couche-3--dynamicanalystservice)
6. [Couche 4 — BaseAnalystService (Orchestration Gemini)](#6-couche-4--baseanalystservice)
7. [Couche 5 — Fonctions SQL metier (Tools)](#7-couche-5--fonctions-sql-metier)
8. [Couche 6 — Pipeline NLP et memoire conversationnelle](#8-couche-6--pipeline-nlp)
9. [Couche 7 — Frontend (AgentChatUI)](#9-couche-7--frontend)
10. [Pattern A2A (Agent-to-Agent)](#10-pattern-a2a)
11. [Agents existants — Inventaire](#11-agents-existants)
12. [Guide : Ajouter un nouvel agent](#12-guide-ajouter-un-nouvel-agent)
13. [Securite](#13-securite)
14. [Performance et scalabilite](#14-performance-et-scalabilite)
15. [Tables BD referentes](#15-tables-bd)

---

## 1. Vue d'ensemble

Le systeme d'agents IA de Facil est une architecture **function-calling** multi-agents basee sur
Google Vertex AI (Gemini 2.0 Flash). Chaque agent est un ensemble de **fonctions SQL predefinies**
que le LLM selectionne pour repondre a une question en langage naturel.

**Principe fondamental** : Le LLM ne genere JAMAIS de SQL. Il choisit parmi des fonctions
predefinies, securisees et parametrees. Les donnees sont toujours filtrees par le contexte
d'entite de l'utilisateur connecte.

### Chiffres cles

| Metrique | Valeur |
|----------|--------|
| Agents enregistres | 4 (treasury, admin, supervisor, orchestrator) |
| Fonctions SQL totales | 38 (17 + 11 + 10 + 0 direct) |
| Modele LLM | Gemini 2.0 Flash (Vertex AI) |
| Latence moyenne | 2-5s (1 round), 4-8s (2 rounds) |
| Entites supportees | 12 actives |
| Intents NLP | 11 categories ML |
| Memoire conversationnelle | 6 tours glissants (Redis, TTL 30min) |

---

## 2. Schema architectural

```
                          FRONTEND (Next.js)
                               |
                    AgentChatUI (composant partage)
                    analystApi.ask() / getBriefing()
                               |
                         HTTPS / JWT
                               |
 ========================================================================
                           BACKEND (FastAPI)
 ========================================================================
                               |
              [1] POST /agents/analyst/ask  (endpoint unifie)
                               |
                    +----------+----------+
                    |                     |
          _resolve_agent_context    _resolve_admin_agent
          (agent_profiles + entities)    (role permissions)
                    |                     |
                    +----------+----------+
                               |
                        agent_type resolu
                    (treasury|supervisor|admin)
                               |
              [2] ToolRegistry.get(agent_type)
                               |
                          ToolSet
                  {functions, prompt, artifacts}
                               |
              [3] DynamicAnalystService(agent_type, entity_ctx)
                               |
              [4] BaseAnalystService.process_question()
                               |
                    +----------+----------+
                    |                     |
              NLP Pipeline          Gemini Function Calling
              (intent, slots,       (multi-round, mode=ANY)
               memory, few-shot)         |
                                    +----+----+
                                    |         |
                              Round 1    Round 2..N
                              (tool      (extra tools
                              selection)  si necessaire)
                                    |         |
                                    +----+----+
                                         |
              [5] Fonctions SQL metier (asyncpg, pooled)
                  get_revenue_summary(db, _entity_code=..., days=30)
                  get_request_stats(db, _entity_code=..., workflow_codes=[...])
                                         |
                                    +----+----+
                                    |         |
                               Donnees   Artifacts
                               (dict)    (table, kpi_grid, summary)
                                    |         |
                                    +----+----+
                                         |
              [6] Gemini genere l'analyse textuelle
                                         |
              [7] Reponse JSON au frontend
                  {answer, tools_used, data, artifacts, agent_type}
```

### Flux de donnees detaille

```
 Utilisateur tape une question
       |
       v
 [Frontend] AgentChatUI.handleSubmit()
       |  POST /agents/analyst/ask {question, session_id}
       v
 [Backend] analyst_ask() endpoint
       |
       v
 [Resolution] _resolve_agent_context(db, user_id)
       |  SELECT agent_profiles JOIN entities
       |  → entity_type='treasury' → agent_type='treasury'
       |  → workflow_codes.length>0 → agent_type='supervisor'
       |  → fallback: _resolve_admin_agent (role check)
       v
 [Rate Limit] check_rate_limit(user_id, agent_type)
       |  20/h treasury, 15/min supervisor, 10/min admin
       v
 [Sanitize] _sanitize_question() — anti-injection regex
       v
 [Cache Check] SHA-256(question) + entity_code + location
       |  Hit? → return cached response
       v
 [Factory] create_analyst(agent_type, entity_context)
       |  → DynamicAnalystService(agent_type, ctx)
       |  → ToolRegistry.get(agent_type) → ToolSet
       v
 [NLP] nlp_preprocessor.extract_slots(question)
       |  → IntentCategory (11 classes, TF-IDF + LogReg)
       |  → Slots: entity_codes, time_period, metric, agent_name
       v
 [Memory] conversation_memory.resolve_missing_slots(session_id, slots)
       |  → Herite des parametres des tours precedents (si confidence < 0.6)
       v
 [Few-Shot] get_few_shot_examples(question, agent_type)
       |  → pgvector similarity search sur agent_query_logs
       v
 [Prompt] build_enriched_prompt(question, slots, memory, few_shot)
       v
 [Gemini R1] generate_content(prompt, tools=FUNC_DECLS, mode=ANY)
       |  → function_call: get_revenue_summary(days=30)
       v
 [Execute] _exec_fn("get_revenue_summary", {days: 30})
       |  merged_args = {slot_kwargs} ∪ {gemini_args} ∪ {entity_kwargs}
       |  → SELECT ... WHERE entity_code=$1 AND created_at >= now()-$2
       v
 [Gemini R2] generate_content(history + fn_results, max_tokens=4096)
       |  → Texte d'analyse en espagnol
       v
 [Artifacts] _build_artifacts(tool_results)
       |  → [{type: "table", headers, rows}, {type: "kpi_grid", metrics}]
       v
 [Log] agent_query_logs INSERT (fire-and-forget, async)
       |  ground_truth_intent = FUNCTION_TO_INTENT[fn_name]
       |  embedding = Vertex AI text-embedding
       v
 [Memory] conversation_memory.add_turn(session_id, turn)
       v
 [Response] {answer, tools_used, data, artifacts, agent_type}
       |
       v
 [Frontend] AgentChatUI rend la reponse
       |  → Markdown → ArtifactRenderer (tables, KPI grids, summaries)
```

---

## 3. Couche 1 — Endpoint unifie et resolution

### Fichier : `packages/backend/app/modules/agents/api/analyst_routes.py`

Un seul endpoint pour **tous les types d'agents**. Le type est resolu dynamiquement
a partir du profil utilisateur en BD.

### Endpoints

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/agents/analyst/ask` | Question → reponse IA |
| GET | `/agents/analyst/briefing` | Briefing automatique |

### Resolution d'agent (`_resolve_agent_context`)

La resolution est **100% pilotee par la BD**. Aucun nom d'entite n'est code en dur.

```sql
SELECT ap.entity_id, ap.is_supervisor, ap.entity_location_id,
       e.code AS entity_code, e.name AS entity_name,
       e.workflow_codes, e.entity_type::text AS entity_type,
       el.location_name AS site_name, el.city, el.is_main_office
FROM agent_profiles ap
JOIN entities e ON e.id = ap.entity_id
LEFT JOIN entity_locations el ON el.id = ap.entity_location_id
WHERE ap.user_id = $1 AND ap.is_active = true
LIMIT 1
```

**Algorithme de resolution** :

```
1. entity_type = 'treasury'      → agent_type = "treasury"
2. len(workflow_codes) > 0        → agent_type = "supervisor"
3. Ni l'un ni l'autre             → return None (pas d'agent)
4. Fallback: _resolve_admin_agent → permission 'agent.view' → "admin"
```

**Pourquoi `entity_type` et pas permission** : Le type d'entite est une propriete
**intrinseque** (ce que l'entite EST), pas une derivation de permissions (ce que les
utilisateurs PEUVENT faire). Si demain on reorganise les permissions, le routage
d'agent ne casse pas.

### Rate limiting

| Agent | Limite | Fenetre |
|-------|--------|---------|
| treasury | 20 requetes | 1 heure |
| supervisor | 15 requetes | 1 minute |
| admin | 10 requetes | 1 minute |
| orchestrator | 10 requetes | 1 minute |

### Cache

| Agent | TTL | Cle |
|-------|-----|-----|
| treasury | 300s (5 min) | `analyst:treasury:{entity_code}:{location}:{sha256(question)[:16]}` |
| supervisor | 120s (2 min) | `analyst:supervisor:{entity_code}:{location}:{sha256(question)[:16]}` |
| admin | 0 (pas de cache) | — |

---

## 4. Couche 2 — ToolRegistry

### Fichier : `packages/backend/app/modules/shared/services/tool_registry.py`

Registre **singleton** (process-safe) qui mappe `agent_type → ToolSet`.

### ToolSet (dataclass)

```python
@dataclass
class ToolSet:
    function_declarations: list          # Gemini FunctionDeclaration[]
    function_map: Dict[str, Callable]    # fn_name → async callable(db, **kwargs) → dict
    prompt_template: str                 # Template avec {placeholders}
    prompt_fn: Optional[Callable]        # Generateur dynamique (priorite sur template)
    artifacts_builder: Optional[Callable] # tool_results → List[artifact]
    max_tool_rounds: int                 # 2 par defaut, max 3
    second_call_max_tokens: int          # 2048 par defaut
    agent_type_label: str                # Label humain pour les logs
    sub_agents: Dict[str, SubAgentConfig] # Pour pattern A2A
```

### Enregistrement (lazy)

L'enregistrement est **lazy** : il se produit au premier appel a `tool_registry.get()`.
Cela evite les imports circulaires.

```python
def _register_all_agents(registry: ToolRegistry) -> None:
    _register_treasury(registry)    # 17 fonctions
    _register_admin(registry)       # 11 fonctions
    _register_supervisor(registry)  # 10 fonctions
    _register_orchestrator(registry) # 3 meta-fonctions A2A
```

### Prompt : deux strategies

| Strategie | Quand | Exemple |
|-----------|-------|---------|
| `prompt_fn(ctx) → str` | Logique complexe (date, calculs) | Treasury (injecte date courante) |
| `prompt_template.format(**ctx)` | Template statique avec placeholders | Supervisor (`{entity_name}`, `{workflow_list}`) |

Les placeholders disponibles pour les templates :
`{entity_name}`, `{site_name}`, `{city}`, `{workflow_list}`, `{agent_count}`,
`{available_count}`, `{current_date}`, `{day_of_week}`

---

## 5. Couche 3 — DynamicAnalystService

### Fichier : `packages/backend/app/modules/shared/services/dynamic_analyst_service.py`

Classe **unique** qui remplace N classes hardcodees. Charge sa configuration depuis
le ToolRegistry a l'instanciation.

### Factory

```python
from app.modules.shared.services.dynamic_analyst_service import create_analyst

service = create_analyst("treasury", entity_context)
result = await service.process_question(db, "Ingresos del mes?", context=ctx)
```

### 3 modes de fonctionnement

| Mode | Description | Exemple |
|------|-------------|---------|
| **Direct** | Fonctions SQL directes | treasury (17 fn), admin (11 fn), supervisor (10 fn) |
| **A2A** | Meta-fonctions delegant a des sous-agents | orchestrator (3 meta-fn) |
| **Mixte** | Direct + A2A (futur) | — |

### Interface implementee (herite de BaseAnalystService)

```python
class DynamicAnalystService(BaseAnalystService):
    def _get_system_prompt(self) -> str      # prompt_fn ou template
    def _get_function_declarations(self) -> list  # direct + A2A
    def _get_function_map(self) -> dict      # direct + A2A handlers
    def _get_agent_type(self) -> str         # pour logging/ML
    def _get_service_name(self) -> str       # label humain
    def _get_max_tool_rounds(self) -> int    # depuis ToolSet
    def _get_second_call_max_tokens(self) -> int
    def _build_artifacts(self, tool_results) -> list
```

---

## 6. Couche 4 — BaseAnalystService

### Fichier : `packages/backend/app/modules/shared/services/base_analyst_service.py`

Classe abstraite qui orchestre le **pipeline Gemini multi-round**.

### Pipeline d'execution (process_question)

```
1. _ensure_initialized()          # Lazy init Gemini model + retry
2. NLP pre-processing             # extract_slots → resolve_missing_slots
3. Few-shot retrieval             # pgvector similarity search
4. Build enriched prompt          # question + slots + memory + few-shot
5. Round 1: Gemini → tools        # mode=ANY force l'appel de fonctions
6. Execute tools (parallel)       # asyncio.gather, pooled connections
7. Round 2..N (conditionnel)      # Si Gemini demande plus de donnees
8. Extract answer                 # Texte d'analyse final
9. Build artifacts                # table, kpi_grid, summary
10. Store conversation turn       # Redis (sliding window)
11. Log query (fire-and-forget)   # agent_query_logs + embedding
```

### Execution des fonctions (`_exec_fn`)

```python
# Priorite des arguments (ecrase de gauche a droite):
merged_args = {**slot_kwargs, **fn_args, **entity_kwargs}
#               NLP defaults    Gemini      Auth scope (non overridable)
```

Les `entity_kwargs` (prefixes `_`) ne sont JAMAIS ecrasables par Gemini :
- `_entity_code` : code de l'entite de l'utilisateur
- `_entity_location_id` : UUID du site
- `_is_main_office` : vue globale ou site-scoped
- `_user_id` : UUID de l'utilisateur
- `workflow_codes` : workflows de l'entite

### Constantes

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `GEMINI_TIMEOUT_FIRST_CALL` | 25s | Timeout round 1 |
| `GEMINI_TIMEOUT_SECOND_CALL` | 30s | Timeout round final |
| `GEMINI_TIMEOUT_EXTRA_ROUND` | 20s | Timeout rounds intermediaires |
| `FIRST_CALL_MAX_TOKENS` | 1024 | Budget tokens round 1 |
| `MAX_TOOL_ROUNDS` | 2 (default), 3 (max) | Rounds de function calling |
| `MAX_INIT_RETRIES` | 3 | Tentatives d'init Gemini |

### ToolConfig mode=ANY

Force Gemini a **toujours appeler au moins une fonction** au premier round.
Sans ca, Gemini peut repondre en texte brut sans consulter les donnees.
Degradation gracieuse si le SDK ne le supporte pas.

---

## 7. Couche 5 — Fonctions SQL metier

Chaque agent a ses propres fonctions SQL. Elles suivent toutes le meme contrat :

```python
async def get_xxx(db: asyncpg.Connection, **kwargs) -> Dict[str, Any]:
    """Retourne un dict de donnees structurees."""
```

### Treasury (17 fonctions)

| Fonction | Intent | Description |
|----------|--------|-------------|
| `get_revenue_summary` | revenue | Recapitulatif des recettes |
| `get_pending_payments_sla` | sla | Paiements en attente + SLA |
| `get_agent_performance` | performance | Performance des agents tresor |
| `get_anomaly_report` | anomaly | Detection d'anomalies financieres |
| `get_revenue_trend` | trend | Tendances des recettes |
| `get_entity_comparison` | entity_compare | Comparaison inter-entites |
| `get_rejection_analysis` | performance | Analyse des rejets de paiement |
| `get_payment_reconciliation` | reconciliation | Reconciliation bancaire |
| `get_top_services` | revenue | Services les plus rentables |
| `get_payment_method_breakdown` | revenue | Repartition par methode de paiement |
| `get_hourly_revenue` | trend | Recettes par heure |
| `get_agent_workload` | workload | Charge de travail agents |
| `get_cashflow_forecast` | trend | Prevision de tresorerie |
| `get_weekly_comparison` | trend | Comparaison hebdomadaire |
| `get_payment_anomalies` | anomaly | Anomalies de paiement |
| `get_ministry_revenue` | entity_compare | Recettes par ministere |
| `get_daily_stats` | revenue | Statistiques journalieres |

**Fichier** : `packages/backend/app/modules/service_requests/services/treasury_analyst_service.py`

### Admin (11 fonctions)

| Fonction | Intent | Description |
|----------|--------|-------------|
| `get_agent_availability_snapshot` | agent_availability | Snapshot disponibilite |
| `get_alerts_summary` | anomaly | Resume des alertes |
| `get_agent_summary` | agent_specific | Fiche d'un agent |
| `compare_entity_agents` | entity_compare | Comparaison cross-entite |
| `get_workload_distribution` | workload | Distribution de charge |
| `get_inactive_agents` | agent_availability | Agents inactifs |
| `get_sla_report` | sla | Rapport SLA |
| `analyze_performance_ranking` | performance | Classement performance |
| `detect_anomalies` | anomaly | Detection anomalies |
| `analyze_entity_balance` | entity_compare | Equilibre entites |
| `get_processing_trends` | trend | Tendances de traitement |

**Fichier** : `packages/backend/app/modules/agents/services/admin_assistant_service.py`

### Supervisor (10 fonctions)

| Fonction | Intent | Description |
|----------|--------|-------------|
| `get_request_stats` | revenue | Stats solicitudes par status/workflow |
| `get_request_pipeline` | revenue | Funnel par status avec montants |
| `get_request_sla` | sla | Temps de traitement + retards |
| `get_request_rejections` | performance | Taux de rejet par workflow |
| `get_request_trends` | trend | Tendances quotidiennes |
| `get_entity_agents` | agent_availability | Liste agents + charge |
| `get_agent_ranking` | performance | Classement agents |
| `get_pending_detail` | sla | Detail des solicitudes en attente |
| `get_workflow_config` | entity_compare | Config workflows (docs, etapes) |
| `get_workflow_tariffs` | revenue | Tarifs par workflow |

**Fichier** : `packages/backend/app/modules/shared/services/supervisor_tools.py`

### Signature type d'une fonction

```python
async def get_request_stats(
    db: asyncpg.Connection,
    days: int = 30,
    workflow_code: str = "",
    _entity_code: str = "",           # Injecte par entity_kwargs (auth scope)
    _entity_location_id: str = "",    # Injecte par entity_kwargs
    _is_main_office: bool = True,     # Injecte par entity_kwargs
    **kwargs,                         # Absorbe les extras
) -> Dict[str, Any]:
```

### Artifacts

Chaque agent peut definir un `artifacts_builder` qui transforme les resultats bruts
en structures typees pour le frontend :

| Type | Structure | Rendu frontend |
|------|-----------|----------------|
| `table` | `{headers, rows, alignments}` | Tableau HTML responsive |
| `kpi_grid` | `{metrics: [{label, value, changePct}]}` | Grille de KPI cards |
| `summary` | `{content, severity}` | Bandeau info/warning/critical |

---

## 8. Couche 6 — Pipeline NLP

### Fichiers

| Fichier | Role |
|---------|------|
| `nlp_preprocessor.py` | Intent classification + slot extraction |
| `conversation_memory.py` | Memoire conversationnelle Redis |
| `few_shot_retriever.py` | Recuperation d'exemples similaires (pgvector) |
| `embedding_service.py` | Vertex AI text embeddings |

### Intent Classification (TF-IDF + LogisticRegression)

- **11 categories** : AGENT_AVAILABILITY, AGENT_SPECIFIC, WORKLOAD, SLA,
  PERFORMANCE, ANOMALY, TREND, REVENUE, ENTITY_COMPARE, RECONCILIATION, GENERAL
- **524 exemples** d'entrainement (seed) multilingues (ES/FR/EN)
- **Normalisation** : NFKD unicode, accents, typos courants, abbreviations
- **Confiance** : vraie probabilite calibree (max predict_proba)

### Slot Extraction (regex deterministe, O(1))

| Slot | Exemple | Regex |
|------|---------|-------|
| `entity_codes` | "CNEDOGE_PASAPORTE" | Pattern uppercase + underscore |
| `time_period_days` | "esta semana" → 7 | Dictionnaire temporel ES/FR/EN |
| `agent_name` | "Juan Garcia" | Nom propre apres "agente" |
| `metric` | "tasa de rechazo" | Keywords metiers |
| `amount_threshold` | ">500000" | Nombres + comparateurs |

### Memoire conversationnelle

```
Redis key: "conv:{session_id}"
TTL: 30 minutes (rafraichi a chaque tour)
Fenetre: 6 tours maximum (FIFO)

Heritage de slots:
  - Active seulement si confidence < 0.6 (question de suivi)
  - entity_codes, time_period, metric, agent_name herites independamment
  - Intent herite seulement si actuel = GENERAL
```

### FUNCTION_TO_INTENT (supervision distante)

Quand Gemini appelle une fonction X, le mapping `FUNCTION_TO_INTENT[X]` donne
le "ground truth" de l'intent. Ce label est stocke dans `agent_query_logs` pour
le reentrainement automatique du classificateur ML.

```python
# 38 mappings (17 treasury + 11 admin + 10 supervisor)
FUNCTION_TO_INTENT = {
    "get_revenue_summary": "revenue",
    "get_request_sla": "sla",
    ...
}
```

---

## 9. Couche 7 — Frontend

### Composant partage : AgentChatUI

**Fichier** : `packages/web/src/components/agent-chat/AgentChatUI.tsx`

Composant React **generique** qui rend n'importe quel agent IA. Chaque agent
fournit un `AgentChatConfig` et obtient automatiquement :

- Chat input avec auto-resize
- Quick actions (boutons pre-configures)
- Historique des Q&A
- Rendu Markdown des reponses
- Rendu des artifacts (tables, KPI grids, summaries)
- Briefing automatique (bandeau optionnel)
- Session ID (UUID v4, memoire conversationnelle)
- Export MD des conversations

### AgentChatConfig (interface TypeScript)

```typescript
interface AgentChatConfig {
  title: string;              // "Asistente IA - CNEDOGE"
  description: string;
  placeholder: string;
  quickActions: QuickAction[]; // Boutons pre-configures
  analyzingText: string;
  analyzingDesc: string;
  errorMessage: string;
  emptyStateText: string;
  emptyExamplesText: string;
  labels: { toolsUsed, retry, history, quickActionsMenu, download };
  briefing?: AgentBriefing;    // Briefing auto (optionnel)
  briefingLoading?: boolean;
  mutation: UseMutationResult; // TanStack mutation
  accentColor?: string;        // Tailwind class (ex: "bg-blue-100")
  icon?: LucideIcon;
}
```

### API Client

**Fichier** : `packages/web/src/modules/agent-dashboard/services/analyst-api.ts`

```typescript
analystApi.ask(question, previousContext?, sessionId?)   // POST /agents/analyst/ask
analystApi.getBriefing()                                  // GET /agents/analyst/briefing
```

### Menu sidebar (injection dynamique)

Le menu "Asistente IA" est injecte dynamiquement dans le sidebar si l'utilisateur
a la permission `analyst.ask` :

**Fichier** : `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts`

```typescript
const hasAnalystPermission = context?.permissions?.includes('analyst.ask');
if (hasAnalystPermission) {
  items.splice(dashboardIdx + 1, 0, {
    id: 'assistant',
    titleKey: 'agent.nav.assistant',  // i18n (ES/FR/EN)
    icon: 'Sparkles',
    href: `${dashboardHref}/assistant`,
  });
}
```

### i18n

Les traductions sont dans `messages/{es,en,fr}.json` sous :
- `agent.nav.assistant` : label sidebar
- `agent.assistant.*` : 19 cles (titre, description, quick actions, labels)

---

## 10. Pattern A2A (Agent-to-Agent)

L'orchestrateur est un **meta-agent** qui ne possede pas de fonctions SQL directes.
Il delegue a des sous-agents specialises via des meta-fonctions.

### Pourquoi A2A ?

Gemini degrade au-dela de ~20 fonctions. Avec 38 fonctions totales, on ne peut pas
tout donner a un seul agent. L'orchestrateur en recoit 3, et chacune delegue a un
sous-agent qui a ses propres 10-17 fonctions.

### Meta-fonctions de l'orchestrateur

| Meta-fonction | Sous-agent | Parametre requis |
|---------------|------------|------------------|
| `ask_treasury` | treasury | — |
| `ask_admin` | admin | — |
| `ask_supervisor` | supervisor | `entity_code` (ex: "DGT") |

### Flux A2A

```
Utilisateur: "Compare los ingresos del Tesoro con las solicitudes de CNEDOGE"
       |
       v
 Orchestrator (Gemini)
       |  → appelle ask_treasury("ingresos recientes")
       |  → appelle ask_supervisor("solicitudes recientes", entity_code="CNEDOGE")
       |  (appels paralleles si possible)
       v
 Sub-agent Treasury                Sub-agent Supervisor
       |                                    |
 get_revenue_summary()          get_request_stats(_entity_code="CNEDOGE")
       |                                    |
       v                                    v
 {revenue: 45M XAF}             {total: 234, pending: 12}
       |                                    |
       +------------------------------------+
                        |
                        v
              Orchestrator synthetise
              "Los ingresos del Tesoro fueron 45M XAF.
               CNEDOGE tiene 234 solicitudes, 12 pendientes..."
```

### `_load_entity_context` (A2A helper)

Quand `ask_supervisor` est appele avec un `entity_code`, le systeme charge
dynamiquement le contexte de cette entite depuis la BD :

```python
async def _load_entity_context(db, entity_code: str) -> Optional[Dict[str, Any]]:
    # 1. Charge entity (code, name, workflow_codes)
    # 2. Compte agents actifs + disponibles
    # 3. Retourne le contexte complet pour le prompt supervisor
```

---

## 11. Agents existants — Inventaire

### Treasury (Analista Financiero)

| Propriete | Valeur |
|-----------|--------|
| `agent_type` | `treasury` |
| Resolution | `entities.entity_type = 'treasury'` |
| Fonctions | 17 |
| Prompt | `prompt_fn` (dynamique, injecte date) |
| Artifacts | Oui (tables, KPI, summaries) |
| max_tool_rounds | 3 |
| max_tokens (analyse) | 4096 |
| Cache | 5 minutes |
| Briefing | Oui (generate_briefing) |

### Admin (Asistente de Administracion)

| Propriete | Valeur |
|-----------|--------|
| `agent_type` | `admin` |
| Resolution | Permission `agent.view` (pas d'agent_profile requis) |
| Fonctions | 11 |
| Prompt | `prompt_template` (statique) |
| Artifacts | Non |
| max_tool_rounds | 2 |
| max_tokens (analyse) | 2048 |
| Cache | 0 (temps reel) |
| Briefing | Non (en development) |

### Supervisor (Asistente de Entidad)

| Propriete | Valeur |
|-----------|--------|
| `agent_type` | `supervisor` |
| Resolution | `entities.workflow_codes.length > 0` |
| Fonctions | 10 |
| Prompt | `prompt_template` avec `{entity_name}`, `{workflow_list}`, etc. |
| Artifacts | Oui (7 types) |
| max_tool_rounds | 2 |
| max_tokens (analyse) | 2048 |
| Cache | 2 minutes |
| Briefing | Oui (generate_supervisor_briefing) |

### Orchestrator (Director General)

| Propriete | Valeur |
|-----------|--------|
| `agent_type` | `orchestrator` |
| Resolution | Assigne manuellement (pas de resolution auto) |
| Fonctions | 0 directes, 3 meta-fonctions A2A |
| Prompt | `prompt_template` (description des sous-agents) |
| Artifacts | Non (delegues aux sous-agents) |
| max_tool_rounds | 3 |
| max_tokens (analyse) | 4096 |
| Cache | 2 minutes |
| Briefing | Non |

---

## 12. Guide : Ajouter un nouvel agent

### Prerequis

- Definir le domaine metier de l'agent
- Identifier les requetes SQL necessaires (3-15 fonctions recommandees)
- Rediger le system prompt en espagnol
- Definir les quick actions frontend

### Etape 1 : Creer les fonctions SQL

Creer un fichier `packages/backend/app/modules/{module}/services/{agent}_tools.py` :

```python
from typing import Any, Dict
from vertexai.generative_models import FunctionDeclaration

# ── Fonctions SQL ──────────────────────────────────────────────────

async def get_my_stats(
    db,
    days: int = 30,
    _entity_code: str = "",        # TOUJOURS accepter les entity_kwargs
    _entity_location_id: str = "",
    _is_main_office: bool = True,
    **kwargs,                       # Absorber les extras
) -> Dict[str, Any]:
    """Ma fonction metier."""
    query = """
        SELECT count(*) as total
        FROM my_table
        WHERE entity_code = $1
          AND created_at >= now() - ($2 || ' days')::interval
    """
    row = await db.fetchrow(query, _entity_code, days)
    return {"total": row["total"]}


# Repetez pour chaque fonction (3-15 recommandees)


# ── Declarations Gemini ────────────────────────────────────────────

MY_FUNC_DECLS = [
    FunctionDeclaration(
        name="get_my_stats",
        description="Obtenir les statistiques de mon domaine.",
        parameters={
            "type": "object",
            "properties": {
                "days": {
                    "type": "integer",
                    "description": "Nombre de jours a analyser (defaut: 30).",
                },
            },
        },
    ),
    # ... autres declarations
]

# ── Map fonction ───────────────────────────────────────────────────

MY_FUNCTION_MAP = {
    "get_my_stats": get_my_stats,
    # ... autres fonctions
}

# ── Prompt ─────────────────────────────────────────────────────────

MY_PROMPT_TEMPLATE = """Eres el asistente IA de {entity_name}.
Tu funcion es analizar datos de mi domaine.
Fecha actual: {current_date} ({day_of_week}).
Entidad: {entity_name} | Sitio: {site_name}
REGLAS:
- SIEMPRE usa las funciones disponibles. No inventes datos.
- Responde en espanol. Se factual y conciso.
"""

# ── Artifacts (optionnel) ──────────────────────────────────────────

def my_build_artifacts(tool_results: Dict[str, Any]):
    artifacts = []
    if "get_my_stats" in tool_results:
        data = tool_results["get_my_stats"]
        artifacts.append({
            "type": "kpi_grid",
            "title": "Resumen",
            "metrics": [
                {"label": "Total", "value": str(data.get("total", 0))},
            ],
        })
    return artifacts
```

### Etape 2 : Enregistrer dans ToolRegistry

Ajouter dans `packages/backend/app/modules/shared/services/tool_registry.py` :

```python
def _register_my_agent(registry: ToolRegistry) -> None:
    """Register my new agent."""
    try:
        from app.modules.my_module.services.my_tools import (
            MY_FUNCTION_MAP,
            MY_FUNC_DECLS,
            MY_PROMPT_TEMPLATE,
            my_build_artifacts,
        )

        registry.register("my_agent", ToolSet(
            function_declarations=MY_FUNC_DECLS,
            function_map=MY_FUNCTION_MAP,
            prompt_template=MY_PROMPT_TEMPLATE,
            artifacts_builder=my_build_artifacts,
            max_tool_rounds=2,
            second_call_max_tokens=2048,
            agent_type_label="My Agent Assistant",
        ))
    except ImportError as e:
        logger.warning(f"ToolRegistry: my_agent registration failed: {e}")
```

Ajouter l'appel dans `_register_all_agents` :

```python
def _register_all_agents(registry: ToolRegistry) -> None:
    _register_treasury(registry)
    _register_admin(registry)
    _register_supervisor(registry)
    _register_orchestrator(registry)
    _register_my_agent(registry)       # <-- AJOUTER ICI
```

### Etape 3 : Configurer la resolution d'agent

Deux options selon le type d'agent :

**Option A : Agent lie a une entite (comme supervisor)**

Ajouter une valeur a `entity_type_enum` et configurer `entities.entity_type` :

```sql
-- Migration: ajouter le type d'entite
ALTER TYPE entity_type_enum ADD VALUE 'my_type';

UPDATE entities
SET entity_type = 'my_type'
WHERE code = 'MY_ENTITY_CODE';
```

Puis dans `_resolve_agent_context` (analyst_routes.py), ajouter la condition :

```python
if entity_type == "treasury":
    agent_type = "treasury"
elif entity_type == "my_type":           # <-- AJOUTER
    agent_type = "my_agent"              # <-- AJOUTER
elif len(workflow_codes) > 0:
    agent_type = "supervisor"
else:
    return None
```

**Option B : Agent lie a un role/permission (comme admin)**

Ajouter un fallback dans `analyst_ask()` ou creer un nouveau `_resolve_xxx_agent()` :

```python
if not agent_ctx:
    agent_ctx = await _resolve_admin_agent(db, str(user_id))
if not agent_ctx:
    agent_ctx = await _resolve_my_agent(db, str(user_id))  # <-- AJOUTER
```

### Etape 4 : Ajouter la permission `analyst.ask` au role

```sql
-- Migration: assigner la permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'my_role_code'
  AND p.name = 'analyst.ask'
ON CONFLICT DO NOTHING;
```

### Etape 5 : Ajouter au mapping NLP (FUNCTION_TO_INTENT)

Dans `packages/backend/app/modules/shared/services/nlp_preprocessor.py` :

```python
FUNCTION_TO_INTENT: Dict[str, str] = {
    # ... existants ...
    # ── My Agent (N fonctions) ──
    "get_my_stats": "revenue",
    # ... mappings pour chaque fonction
}
```

### Etape 6 : Rate limit et cache

Dans `analyst_routes.py`, ajouter :

```python
_RATE_LIMITS = {
    # ... existants ...
    "my_agent": {"max_requests": 15, "window_seconds": 60},
}

_CACHE_TTL = {
    # ... existants ...
    "my_agent": 120,  # 2 min
}
```

### Etape 7 : Creer le composant frontend (optionnel)

Si l'agent a besoin d'un composant dedie (quick actions specifiques) :

```typescript
// packages/web/src/modules/agent-dashboard/components/MyAgentTab.tsx

'use client';
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { BarChart3, Sparkles } from 'lucide-react';
import { AgentChatUI } from '@/components/agent-chat';
import type { AgentChatConfig, AgentResponse } from '@/components/agent-chat';
import { analystApi } from '../services/analyst-api';

export function MyAgentTab() {
  const t = useTranslations('agent.myAgent');

  const mutation = useMutation<AgentResponse, Error, {
    question: string;
    previousContext?: { question: string; tools_used: string[] };
    sessionId: string;
  }>({
    mutationFn: async ({ question, previousContext, sessionId }) => {
      const raw = await analystApi.ask(question, previousContext, sessionId);
      return {
        answer: raw.answer,
        tools_used: raw.tools_used,
        data: raw.data,
        artifacts: raw.artifacts as AgentResponse['artifacts'],
      };
    },
  });

  const config: AgentChatConfig = useMemo(() => ({
    title: t('title'),
    description: t('description'),
    placeholder: t('placeholder'),
    // ... etc (voir SupervisorAssistantTab comme modele)
    mutation,
    icon: Sparkles,
  }), [mutation, t]);

  return <AgentChatUI config={config} />;
}
```

### Etape 8 : Traductions i18n

Ajouter dans `messages/{es,en,fr}.json` sous `agent.myAgent.*`.

### Etape 9 : Briefing (optionnel)

Si l'agent a besoin d'un briefing automatique, ajouter dans
`analyst_routes.py` > `analyst_briefing()` :

```python
if agent_type == "my_agent":
    from app.modules.my_module.services.my_tools import generate_my_briefing
    result = await generate_my_briefing(db, agent_ctx)
    await cache.set(cache_key, result, ttl=120)
    return result
```

### Checklist de validation

- [ ] Fonctions SQL securisees (parametres $1, $2 — JAMAIS de string formatting)
- [ ] `_entity_code` / `_entity_location_id` dans toutes les fonctions (scoping)
- [ ] `**kwargs` dans la signature (pour absorber les extras de NLP/entity)
- [ ] FunctionDeclaration avec descriptions claires en espagnol
- [ ] Prompt system en espagnol, factuel, regle "JAMAIS inventer de donnees"
- [ ] Enregistre dans ToolRegistry avec `_register_xxx()`
- [ ] Ajoute dans `_register_all_agents()`
- [ ] Resolution configuree (entity_type ou permission)
- [ ] Permission `analyst.ask` assignee au(x) role(s)
- [ ] FUNCTION_TO_INTENT mapping pour chaque fonction
- [ ] Rate limit et cache configures
- [ ] Frontend : composant + i18n (3 langues)
- [ ] Tests : chaque fonction SQL testable independamment

---

## 13. Securite

### Defense en profondeur

| Couche | Protection |
|--------|------------|
| **Input** | Sanitization anti-injection (5 regex patterns) |
| **Auth** | JWT + permission `analyst.ask` |
| **Scoping** | `_entity_code` injecte cote serveur, non overridable |
| **SQL** | Parametres `$1, $2` — JAMAIS de string formatting |
| **LLM** | Le LLM ne genere JAMAIS de SQL |
| **Rate limit** | Par utilisateur, par type d'agent |
| **Timeout** | 25-30s max par round Gemini |
| **Logging** | `agent_query_logs` pour audit |

### Anti-injection patterns

```python
_INJECTION_PATTERNS = [
    r'(?i)ignore\s+(previous|above|all)\s+(instructions?|prompts?)',
    r'(?i)you\s+are\s+now\s+',
    r'(?i)system\s*:\s*',
    r'(?i)INST\]',
    r'(?i)\[\/INST\]',
]
```

---

## 14. Performance et scalabilite

### Conception pour 100+ agents simultanes

| Strategie | Implementation |
|-----------|---------------|
| Connection pooling | asyncpg pool (chaque fonction SQL utilise une connexion pooled) |
| Execution parallele | `asyncio.gather()` pour les appels multi-fonctions |
| Cache Redis | TTL par agent_type (evite les requetes repetees) |
| Rate limiting | Redis-based, par utilisateur + endpoint |
| Fire-and-forget logging | `asyncio.create_task()` (ne bloque jamais la reponse) |
| Lazy init | ToolRegistry + Gemini model initialises au premier appel |
| Process-safe | Chaque worker uvicorn a son propre ToolRegistry |

### Metriques

| Metrique | Valeur typique |
|----------|---------------|
| Round 1 (tool selection) | 800ms - 2s |
| Execution SQL parallele | 50-200ms |
| Round 2 (analyse) | 1-3s |
| Total (1 round) | 2-4s |
| Total (2 rounds) | 4-8s |
| Cache hit | < 50ms |

---

## 15. Tables BD

### Tables de resolution d'agent

| Table | Usage |
|-------|-------|
| `entities` | `entity_type::text` determine le type d'agent |
| `agent_profiles` | Lie user → entity, contient `is_supervisor`, `entity_location_id` |
| `entity_locations` | Site physique (nom, ville, is_main_office) |
| `roles` / `role_permissions` | Permissions (dont `analyst.ask`) |

### Table de logging ML

| Table | Usage |
|-------|-------|
| `agent_query_logs` | Chaque question → intent detecte, fonctions appelees, ground truth, embedding, latence |

### Enum `entity_type_enum`

```sql
-- Valeurs actuelles :
'entity'     -- Entite standard (DGT, ONRC, etc.)
'department' -- Departement d'une entite (CNEDOGE_PASAPORTE, POLICIA, etc.)
'treasury'   -- Entite tresor (TESORO) — migration 177
```

---

## Annexe : Arbre des fichiers

```
packages/backend/app/modules/
  agents/
    api/
      analyst_routes.py              ← [1] Endpoint unifie + resolution
    services/
      admin_assistant_service.py     ← [5] 11 fonctions admin
  shared/
    services/
      tool_registry.py               ← [2] ToolRegistry singleton
      dynamic_analyst_service.py      ← [3] DynamicAnalystService + A2A
      base_analyst_service.py         ← [4] Pipeline Gemini multi-round
      supervisor_tools.py             ← [5] 10 fonctions supervisor + briefing
      nlp_preprocessor.py             ← [6] Intent classification + slots
      conversation_memory.py          ← [6] Memoire conversationnelle Redis
      few_shot_retriever.py           ← [6] pgvector few-shot examples
      embedding_service.py            ← [6] Vertex AI text embeddings
  service_requests/
    services/
      treasury_analyst_service.py     ← [5] 17 fonctions treasury

packages/web/src/
  components/
    agent-chat/
      AgentChatUI.tsx                 ← [7] Composant chat partage
      types.ts                        ← [7] AgentChatConfig interface
      index.ts                        ← [7] Exports
  modules/
    agent-dashboard/
      components/
        SupervisorAssistantTab.tsx     ← [7] Config supervisor
      hooks/
        useAgentDashboard.ts          ← [7] Injection menu dynamique
      services/
        analyst-api.ts                ← [7] API client

messages/
  es.json                             ← agent.nav.assistant + agent.assistant.*
  en.json                             ← (idem EN)
  fr.json                             ← (idem FR)

database/migrations/
  175_analyst_ask_permission.sql      ← Permission analyst.ask
  176_fix_analyst_ask_missing_roles.sql ← Fix 5 roles manquants
  177_add_treasury_entity_type.sql    ← entity_type='treasury' pour TESORO
  173_agent_query_logs.sql            ← Table de logging ML
```
