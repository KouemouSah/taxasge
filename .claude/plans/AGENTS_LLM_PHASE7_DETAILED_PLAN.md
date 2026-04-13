# Phase 7 — Plan détaillé : suggest_appointment_slots tool

## Objectif

Nouveau tool Gemini Level 2 `suggest_appointment_slots(workflow_code)` qui permet à l'agent, dans la conversation chat, de proposer proactivement des créneaux RDV disponibles pour un workflow donné (ex: "je vais t'aider à préparer ton passeport, voici 6 créneaux libres cette semaine").

## Contexte (exploration directe)

- `AppointmentService.get_available_slots(db, entity_location_id, from_date, limit)` existe déjà → `appointment_service.py:173`
- `AppointmentService.get_entity_code_for_workflow(db, workflow_code)` résout `workflow_code` → `entity_code` avec 3 niveaux de priorité → ligne 617
- `entity_locations` + `appointment_slot_configs` joignables pour trouver la bonne location
- `chatbot_user_preferences.preferred_city` stocke la ville préférée de l'utilisateur (migration 282)
- Tool registration : 4 endroits (`TOOL_LEVELS`, `_TOOL_PERMISSION_MAP`, `CHATBOT_AUTH_FUNCTION_MAP`, `CHATBOT_AUTH_FUNC_DECLS`)
- Permission `suggest_appointments` existe déjà dans la BD CHECK constraint (migration 287)
- Gated par Level 2 → `check_tool_level` + permission `suggest_appointments` dans `user_agent_permissions`

## Architecture

```
Gemini function call: suggest_appointment_slots(workflow_code='PASAPORTE_NUEVO')
                ↓
 check_tool_level → user_agent_permissions WHERE permission_type='suggest_appointments' AND level>=2
                ↓ allowed
 appointment_service.get_entity_code_for_workflow(db, 'PASAPORTE_NUEVO') → 'CNEDOGE_PASAPORTE'
                ↓
 SELECT preferred_city FROM chatbot_user_preferences WHERE user_id=$1
                ↓
 SELECT el.id, el.location_name, el.city FROM entity_locations el
   JOIN appointment_slot_configs sc ON sc.entity_location_id = el.id
   WHERE el.entity_code = 'CNEDOGE_PASAPORTE' AND el.is_active AND sc.is_active
     AND (preferred_city IS NULL OR el.city = preferred_city)
   LIMIT 1
                ↓ fallback: any active location
 appointment_service.get_available_slots(db, entity_location_id, limit=6)
                ↓
 Format suggestions as list → return dict with status='suggested' + workflow_code + location + 6 slots
```

### Principes
- **Read-only** : aucun INSERT/UPDATE → pas de concurrency risk
- **Opt-in Level 2** : nécessite grant explicit de `suggest_appointments`
- **User preference aware** : priorise la ville préférée
- **Fallback gracieux** : si pas de location match → première active; si pas de slots → message clair
- **Stateless** : no DB writes, just fetches
- **Cost-safe** : 0 Gemini calls, seulement SQL reads

## Fichiers modifiés

| Fichier | Type |
|---|---|
| `chatbot_tools_authenticated.py` | M — ajout `suggest_appointment_slots` fonction, TOOL_LEVELS, _TOOL_PERMISSION_MAP, catalog flip |
| `chatbot_tools.py` | M — import, CHATBOT_AUTH_FUNCTION_MAP, CHATBOT_AUTH_FUNC_DECLS |
| `tests/unit/chatbot/test_suggest_appointment_slots.py` | NOUVEAU — tests |

## Implémentation (essentiel)

### Function dans `chatbot_tools_authenticated.py`

```python
async def suggest_appointment_slots(db, **kwargs) -> dict:
    """[LEVEL 2] Suggest available appointment slots for a workflow.

    Read-only tool — never writes to DB, just fetches from
    appointment_service.get_available_slots + filters by the user's
    preferred city from chatbot_user_preferences.
    """
    user_id = kwargs.get("user_id", "")
    workflow_code = kwargs.get("workflow_code", "")

    if not user_id:
        return {"error": "Autenticación requerida para esta acción."}
    if not workflow_code:
        return {"error": "Se requiere workflow_code"}

    # Level 2 permission check
    allowed, msg = await check_tool_level(db, user_id, "suggest_appointment_slots")
    if not allowed:
        return {
            "status": "permission_required",
            "message": msg,
            "permission_type": "suggest_appointments",
            "level": 2,
        }

    from app.modules.service_requests.services.appointment_service import (
        appointment_service,
    )

    # Step 1: Resolve workflow → entity_code
    entity_code = await appointment_service.get_entity_code_for_workflow(db, workflow_code)
    if not entity_code:
        return {
            "status": "no_appointments",
            "message": f"El trámite {workflow_code} no requiere cita.",
            "workflow_code": workflow_code,
        }

    # Step 2: User preference (best-effort, can be null)
    preferred_city = await db.fetchval(
        "SELECT preferred_city FROM chatbot_user_preferences WHERE user_id = $1::uuid",
        user_id,
    )

    # Step 3: Pick the best location (preferred city first, then any active)
    location = None
    if preferred_city:
        location = await db.fetchrow(
            """
            SELECT el.id, el.location_name, el.city, el.location_address
            FROM entity_locations el
            INNER JOIN appointment_slot_configs sc ON sc.entity_location_id = el.id
            WHERE el.entity_code = $1
              AND el.city = $2
              AND el.is_active = TRUE
              AND sc.is_active = TRUE
            LIMIT 1
            """,
            entity_code, preferred_city,
        )
    if not location:
        location = await db.fetchrow(
            """
            SELECT el.id, el.location_name, el.city, el.location_address
            FROM entity_locations el
            INNER JOIN appointment_slot_configs sc ON sc.entity_location_id = el.id
            WHERE el.entity_code = $1
              AND el.is_active = TRUE
              AND sc.is_active = TRUE
            ORDER BY el.city, el.location_name
            LIMIT 1
            """,
            entity_code,
        )
    if not location:
        return {
            "status": "no_locations",
            "message": f"No hay oficinas activas para {entity_code}.",
            "entity_code": entity_code,
            "workflow_code": workflow_code,
        }

    # Step 4: Fetch slots via existing service
    slots = await appointment_service.get_available_slots(
        db=db,
        entity_location_id=location["id"],
        limit=6,
    )

    if not slots:
        return {
            "status": "no_slots",
            "message": (
                f"No hay citas disponibles en los próximos días en "
                f"{location['location_name']}. Intenta más tarde."
            ),
            "workflow_code": workflow_code,
            "location_id": str(location["id"]),
            "location_name": location["location_name"],
            "city": location["city"],
        }

    return {
        "status": "suggested",
        "workflow_code": workflow_code,
        "entity_code": entity_code,
        "location_id": str(location["id"]),
        "location_name": location["location_name"],
        "location_address": location["location_address"],
        "city": location["city"],
        "suggested_slots": [
            {
                "date": str(s.slot_date),
                "time": str(s.slot_time),
                "slots_remaining": s.slots_remaining,
            }
            for s in slots
        ],
        "count": len(slots),
        "message": (
            f"Tengo {len(slots)} citas disponibles para {workflow_code} "
            f"en {location['location_name']}."
        ),
    }
```

### TOOL_LEVELS + _TOOL_PERMISSION_MAP

```python
TOOL_LEVELS = {
    # ... existing ...
    "suggest_appointment_slots": 2,  # NEW
    # ...
}

_TOOL_PERMISSION_MAP = {
    "prepare_renewal": "prepare_renewal",
    "auto_prepare_wizard": "prepare_request",
    "suggest_appointment_slots": "suggest_appointments",  # NEW
}
```

### Catalog flip

```python
{
    "key": "suggest_appointments",
    "status": "available",  # ← was "coming_soon"
    "tool_name": "suggest_appointment_slots",
    "max_level": 2,
    "icon": "CalendarDays",
    "always_on": False,
},
```

### chatbot_tools.py wiring

- Import `suggest_appointment_slots` from chatbot_tools_authenticated
- Add to `CHATBOT_AUTH_FUNCTION_MAP`
- Add `FunctionDeclaration` near `auto_prepare_wizard` (line 1182+)

## Tests (tests/unit/chatbot/test_suggest_appointment_slots.py)

Couvrir :
1. Permission denied → `permission_required`
2. No entity for workflow → `no_appointments`
3. User has preferred_city → location filtered by city
4. User has no pref → first active location
5. Location found but no slots → `no_slots`
6. Happy path → 6 slots returned

Utiliser sys.modules injection pour stub `appointment_service` (mêmes problèmes Vertex AI que P6).

## Checklist Phase 7

- [ ] `suggest_appointment_slots` fonction ajoutée
- [ ] Import + CHATBOT_AUTH_FUNCTION_MAP + FunctionDeclaration
- [ ] TOOL_LEVELS + _TOOL_PERMISSION_MAP
- [ ] AGENT_PERMISSION_CATALOG : suggest_appointments → status='available'
- [ ] Unit tests (6+)
- [ ] Python syntax OK
- [ ] Test BD direct : requête location query + slot query
- [ ] Self-critique
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| Vertex AI import dans test | sys.modules injection (pattern P6) |
| `chatbot_user_preferences` row missing | Fetchval retourne None → fallback sans filter |
| Aucune location active | Graceful `no_locations` status |
| Workflow sans entité | Graceful `no_appointments` status |
| Slots query crash (function get_available_slots_v3 down) | Remonté par exception → logged, retourné comme `error` |
