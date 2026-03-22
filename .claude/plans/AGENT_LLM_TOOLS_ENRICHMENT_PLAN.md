# Plan : Enrichissement Tools LLM Agents & Superviseurs

## État Actuel (post-audit 2026-03-22)

### Architecture LLM — ToolRegistry Pattern

```
ToolRegistry (singleton)
├── treasury        → 17 tools (TreasuryAnalystService)
├── admin           → 11 tools (AdminAssistantService)
├── supervisor      → 10 tools (supervisor_tools.py) ← GÉNÉRIQUE
├── entity_agent    → 10 tools (entity_agent_tools.py) ← NOUVEAU
├── orchestrator    → 3 meta-functions (A2A delegation)
├── chatbot_rag     → RAG process_fn
├── document_processor → Gemini vision
├── batch_classifier → Classification
├── enrichment      → Description generation
├── briefing        → Daily briefing generation
├── routing         → Intent routing
└── company_classifier → Classification 3-layer
```

### Problème

Les **superviseurs** utilisent 10 tools génériques (stats, SLA, agents, trends).
Mais un superviseur OMS a besoin de tools **inspections/licences** et un
superviseur CNEDOGE a besoin de tools **passeport/rendez-vous** — ces tools
n'existent pas encore.

Les **agents terrain** ont maintenant 10 tools basiques (search, detail, queue,
docs, tarif, rdv, historique, steps, stats, SLA). Suffisant pour démarrer
mais certaines entités ont des besoins spécifiques (OMS: licences, inspections).

---

## Phase 1 — Tools Superviseur Conditionnels (4h)

### Principe : ToolSet composable

Au lieu de créer N ToolSets par entité, on **compose** un ToolSet dynamique :

```python
# tool_registry.py
def _register_supervisor(registry):
    base_tools = SUPERVISOR_BASE_TOOLS        # 10 tools existants
    inspection_tools = INSPECTION_TOOLS        # 5 tools inspections
    license_tools = LICENSE_TOOLS              # 4 tools licences
    appointment_tools = APPOINTMENT_TOOLS      # 3 tools rendez-vous

    # Le prompt_fn reçoit entity_context et compose les tools
    def supervisor_prompt_fn(ctx):
        workflow_codes = ctx.get("workflow_codes", [])
        tools = list(base_tools)
        if any("INSPECCION" in w or "MATRICULACION" in w for w in workflow_codes):
            tools += inspection_tools
        if any("LICENCIA" in w for w in workflow_codes):
            tools += license_tools
        return tools
```

### Nouveaux Tools Superviseur

#### 1.1 Inspection Tools (OMS/ITVE)
| Tool | Description | SQL |
|------|-------------|-----|
| `get_inspection_stats` | Stats inspections par période (total, en cours, complétées) | `field_inspections` aggregate |
| `get_pending_seals` | Scellés en attente d'approbation superviseur | `field_inspections WHERE seal_status = 'pending'` |
| `get_inspection_by_company` | Inspections d'une entreprise par NIF | `field_inspections JOIN companies` |
| `get_compliance_summary` | Résumé conformité par zone | `license_compliance_events` aggregate |
| `get_overdue_obligations` | Obligations en retard par priorité | `license_obligations WHERE due_date < NOW()` |

#### 1.2 License Tools (OMS)
| Tool | Description | SQL |
|------|-------------|-----|
| `get_license_stats` | Stats licences (actives, expirées, en attente) | `commercial_licenses` aggregate |
| `get_expiring_licenses` | Licences qui expirent dans N jours | `commercial_licenses WHERE expires < NOW() + N` |
| `get_company_license_detail` | Détail licence + obligations d'une entreprise | `commercial_licenses JOIN companies` |
| `get_zone_coverage` | Couverture par zone commerciale | `commercial_licenses GROUP BY zone_id` |

#### 1.3 Appointment Tools (CNEDOGE/DGT)
| Tool | Description | SQL |
|------|-------------|-----|
| `get_appointment_stats` | Stats rendez-vous (confirmés, no-show, taux) | `appointment_reservations` aggregate |
| `get_slot_utilization` | Taux de remplissage par créneau | `appointment_slot_configs vs reservations` |
| `get_no_show_pattern` | Patterns de no-show par jour/heure | `service_requests WHERE no_show_at IS NOT NULL` |

---

## Phase 2 — Tools Agent Terrain Enrichis (3h)

### Nouveaux Tools par Entité

#### 2.1 Agent OMS — Tools Inspections
| Tool | Description |
|------|-------------|
| `create_inspection_draft` | Pré-remplir un formulaire d'inspection |
| `get_company_obligations` | Voir obligations en cours d'une entreprise |
| `check_license_validity` | Vérifier validité d'une licence commerciale |

#### 2.2 Agent CNEDOGE — Tools Passeport
| Tool | Description |
|------|-------------|
| `verify_mrz_data` | Vérifier cohérence des données MRZ extraites |
| `check_duplicate_request` | Détecter si le citoyen a déjà un passeport en cours |

#### 2.3 Agent DGT — Tools Véhicules
| Tool | Description |
|------|-------------|
| `search_vehicle` | Chercher un véhicule par matricule |
| `get_vehicle_history` | Historique d'immatriculation |

---

## Phase 3 — MCP Integration (Futur, optionnel)

### Quand MCP sera pertinent

MCP deviendrait utile si :
1. On migre vers Claude comme LLM agent (au lieu de Gemini)
2. On veut exposer les tools à des agents externes (n8n, LangChain)
3. On veut un protocole standard pour que des systèmes tiers
   s'intègrent à notre plateforme

### Architecture MCP hypothétique

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Claude Agent │────▶│ MCP Server      │────▶│ PostgreSQL   │
│ (frontend)  │     │ (FastMCP Python) │     │ (Supabase)   │
└─────────────┘     │                 │     └──────────────┘
                    │ Tools:          │
                    │  - search_req   │     ┌──────────────┐
                    │  - get_detail   │────▶│ Firebase     │
                    │  - check_tariff │     │ (Storage)    │
                    │  - ...          │     └──────────────┘
                    └─────────────────┘
```

### Pas prioritaire car :
- Gemini function calling fonctionne déjà en production
- Les coûts sont déjà intégrés au billing GCP
- MCP nécessiterait un serveur séparé (complexité opérationnelle)
- Le ToolRegistry pattern est plus simple et performant (in-process)

---

## Estimation

| Phase | Effort | Priorité |
|-------|--------|----------|
| Phase 1 — Supervisor tools composables | 4h | HAUTE |
| Phase 2 — Agent terrain enrichis | 3h | MOYENNE |
| Phase 3 — MCP (si migration Claude) | 2 sprints | BASSE |

---

*Plan créé le 2026-03-22 — Architecture ToolRegistry + Gemini function calling*
