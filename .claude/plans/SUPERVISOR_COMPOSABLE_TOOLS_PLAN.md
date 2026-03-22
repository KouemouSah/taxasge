# Plan : Supervisor Composable Tools (P4)
## 2026-03-22

## Objectif

Enrichir les tools LLM des superviseurs avec des outils métier spécifiques
par entité. Les superviseurs OMS/ITVE ont besoin de tools inspections/licences,
les CNEDOGE/DGT de tools rendez-vous, etc.

## Architecture : ToolSet Composable

```python
# Principe : base_tools + entity_specific_tools
def _register_supervisor(registry):
    base = SUPERVISOR_BASE_TOOLS          # 10 tools existants (stats, SLA, agents)
    inspection = INSPECTION_TOOLS          # 5 tools (field_inspections, compliance)
    license = LICENSE_TOOLS                # 4 tools (commercial_licenses)
    appointment = APPOINTMENT_TOOLS        # 3 tools (appointment_reservations)

    def dynamic_prompt_fn(ctx):
        # Le prompt liste les tools disponibles pour CETTE entité
        workflow_codes = ctx.get("workflow_codes", [])
        available_tools = base_tools_list
        if has_inspections(workflow_codes):
            available_tools += inspection_tools_list
        ...
        return build_prompt(available_tools)

    # Le ToolSet a TOUS les tools mais le prompt guide Gemini
    # vers les tools pertinents pour l'entité
    registry.register("supervisor", ToolSet(
        function_declarations=base + inspection + license + appointment,
        function_map={**BASE_MAP, **INSPECTION_MAP, **LICENSE_MAP, **APPOINTMENT_MAP},
        prompt_fn=dynamic_prompt_fn,
    ))
```

## Phase 1 — Inspection Tools Superviseur (2h)

### Fichier : `packages/backend/app/modules/shared/services/supervisor_inspection_tools.py`

### 5 Tools

| # | Tool | Description | Tables |
|---|------|-------------|--------|
| 1 | `get_inspection_stats` | Stats inspections (total, en cours, complétées, par période) | `field_inspections` |
| 2 | `get_pending_seals` | Scellés en attente d'approbation superviseur | `field_inspections WHERE seal_approved_by IS NULL` |
| 3 | `get_inspections_by_company` | Inspections d'une entreprise par NIF/nom | `field_inspections JOIN companies` |
| 4 | `get_compliance_summary` | Résumé conformité par zone | `license_compliance_events` |
| 5 | `get_overdue_obligations` | Obligations en retard par priorité | `license_obligations WHERE due_date < NOW()` |

### Pattern (comme supervisor_tools.py)

```python
async def get_inspection_stats(db, **kwargs) -> dict:
    entity_code = kwargs.get("_entity_code", "")
    days = kwargs.get("days", 30)
    row = await db.fetchrow("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed,
            COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
            COUNT(*) FILTER (WHERE seal_approved_by IS NULL AND status = 'completed') AS pending_seals
        FROM field_inspections
        WHERE entity_code = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
    """, entity_code, str(days))
    return dict(row) if row else {}
```

## Phase 2 — License Tools Superviseur (1h)

### 4 Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | `get_license_stats` | Stats licences (actives, expirées, suspendues) |
| 2 | `get_expiring_licenses` | Licences qui expirent dans N jours |
| 3 | `get_license_by_company` | Détail licence + obligations |
| 4 | `get_zone_coverage` | Couverture par zone commerciale |

## Phase 3 — Appointment Tools Superviseur (1h)

### 3 Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | `get_appointment_stats` | Stats rendez-vous (confirmés, no-show, taux) |
| 2 | `get_slot_utilization` | Taux de remplissage par créneau |
| 3 | `get_no_show_patterns` | Patterns de no-show par jour/heure |

## Phase 4 — Intégration Composable (30min)

1. Charger les tools additionnels dans `_register_supervisor()`
2. Modifier le prompt dynamique pour lister les tools par entité
3. Tester avec différents entity_codes

## Checklist Validation

- [ ] Toutes les fonctions utilisent `**kwargs` + `kwargs.get("_entity_code")`
- [ ] Pas de paramètre `entity_code` nommé (éviter CRIT-1 bis)
- [ ] `::text` cast sur les colonnes timestamp/date (éviter sérialisation)
- [ ] Tests avec les données réelles en BD staging
- [ ] Rate limits configurés
- [ ] Prompt superviseur mis à jour avec la table des nouveaux tools

## Estimation : 4.5h total

---

*Plan validé le 2026-03-22*
