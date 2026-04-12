# PLAN DÉTAILLÉ — Phase 3 : Reprise dossier citoyen + Idempotency-Key + permissions fee_type

**Date** : 2026-04-11
**Parent plan** : `.claude/plans/INSPECTION_BUNDLE_PAYMENT_FIX_PLAN.md` (plan général)
**Prérequis** : P1 + P2 terminées et déployées en staging (commits `c34f9c52`, `f72c00f5`, CI ✅)
**Statut** : À VALIDER avant implémentation

---

## 0. ÉTAT ACTUEL (vérifié 2026-04-11, post-P1/P2)

### 0.1 Infrastructure existante réutilisable

**Endpoint `/inspections/verify`** — `inspection_routes.py:340-377`
- Rate-limité 30/min par `check_rate_limit`
- Appelle `InspectionService.verify_license_for_agent(conn, user_id, license_id, nif)`
- Le service **résout déjà** le `agent_fee_type` via `OmsAgentService.resolve_agent_context` (ligne 754-763) puis filtre les obligations par `fee_type`
- **Manque** : les nouveaux champs `existing_dossier`, `restricted_obligations`, `has_pending_citizen_payment`

**`OmsAgentService.resolve_agent_context`** — `oms_agent_service.py:64-151`
- Retourne déjà `role_code`, `is_polyvalent`, `is_independent`, `is_supervisor`, `ministry_id`, `queue_fee_type`
- 3 constantes :
  - `INDEPENDENT_FEE_ROLES = {agent_ayuntamiento: 'municipal', agent_camara: 'chamber', + supervisors}`
  - `POLYVALENT_ROLES = {agent_oms_polyvalent, supervisor_tesoro}`
  - `OMS_PROCESSOR_ROLES` : tous les rôles OMS autorisés (19 rôles)
- **Prêt à l'emploi** pour P3.C (fee_type check côté `CollectionService`)

**`get_cache()` — HybridCache Upstash Redis**
- `packages/backend/app/core/cache.py:534`
- `.get(key)` + `.set(key, value, ttl)` + `.delete(key)` + fallback in-memory
- **Prêt pour Idempotency** (P3.B)

### 0.2 BD prod — état fee_type

| fee_type | # obligations | ministries |
|----------|--------------|-----------|
| `tesoro` | 55 | 87, 91, 92, 103, 104 (MIN_COMERCIO, HACIENDA, INFORMACION, TURISMO, AGRICULTURA) |
| `chamber` | 11 | 108 (CAMARA_COMERCIO) |
| `municipal` | 4 | 107 (AYUNTAMIENTO) |

**Agents test** (vérifiés) :
- 6× `agent_min_*` avec ministry_id défini (87, 91, 92, 103, 104, 105) — MIN_ELECTRICIDAD n'a aucune obligation en BD (edge case)
- 1× `agent_oms_polyvalent` (ministry_id=91 mais queue_fee_type=None → tous fee_types)
- 1× `agent_camara` (ministry_id=108)
- 3× `agent_ayuntamiento` (doivent être liés à ministry 107 via entities)

### 0.3 P1/P2 en prod staging

- Migration 291 appliquée (colonnes `source`, `commercial_license_id`, `fiscal_year`, triggers, UNIQUE index)
- Migration 293 appliquée (`BUNDLE_PAYMENT` dans `valid_workflow_codes`)
- `CollectionService.collect_field_payment` refactoré + `_find_or_create_bundle_dossier`
- `cleanup_abandoned_requests` avec triple exclusion + safety check

---

## 1. OBJECTIFS P3

1. **Enrichir `/inspections/verify`** : afficher à l'agent mobile le dossier existant (si citoyen a déjà créé un SR via wizard), les obligations qu'il n'a pas le droit de collecter, et les paiements en cours
2. **Idempotency-Key** sur `POST /inspections/{id}/collect` et `POST /inspections/` — retry HTTP réseau terrain instable = zéro doublon (OWASP A04 défense en profondeur)
3. **Permissions `fee_type`** strictes dans `CollectionService` — un agent MIN_AGRICULTURA ne peut pas collecter une obligation `chamber` ou `municipal` (séparation des pouvoirs fiscaux)
4. **Tests regression** : aucune rupture P1/P2 + nouveaux tests P3

---

## 2. DÉCISIONS EXPERT VALIDÉES

### D1 — Idempotency : helpers explicites (pas décorateur magique)

**Justification** : FastAPI decorators pour Idempotency-Key sont complexes (parse body/headers 2 fois, conflits avec Pydantic validation). L'approche standard Stripe est de faire **2 helpers explicites** appelés au début et à la fin du handler :

```python
# app/core/idempotency.py
async def check_idempotency_or_replay(
    request: Request,
    user_id: UUID,
    endpoint_key: str,
    ttl_seconds: int = 86400,  # 24h
) -> Optional[dict]:
    """Returns the cached response if Idempotency-Key was used before.

    - If header absent → returns None (no idempotency, proceed normally)
    - If header present + cache hit → returns the original response dict
    - If header present + cache miss → returns None (proceed, store after)
    """
    idem_key = request.headers.get("Idempotency-Key")
    if not idem_key:
        return None
    cache_key = _build_cache_key(endpoint_key, user_id, idem_key)
    cache = get_cache()
    cached = await cache.get(cache_key)
    if cached is not None:
        logger.info("Idempotency REPLAY for %s (user=%s, key=%s)",
                    endpoint_key, user_id, idem_key)
    return cached  # may be None if miss

async def store_idempotency_result(
    request: Request,
    user_id: UUID,
    endpoint_key: str,
    result: dict,
    ttl_seconds: int = 86400,
) -> None:
    """Store the handler result for future replay within ttl_seconds."""
    idem_key = request.headers.get("Idempotency-Key")
    if not idem_key:
        return
    cache_key = _build_cache_key(endpoint_key, user_id, idem_key)
    cache = get_cache()
    await cache.set(cache_key, result, ttl_seconds)
```

Usage dans les routes :

```python
@router.post("/{inspection_id}/collect")
async def collect_payment(
    inspection_id: UUID,
    request: Request,
    payload: FieldCollectRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.collect_payment")),
):
    # Idempotency check (replay guard)
    cached = await check_idempotency_or_replay(
        request, UUID(current_user.id),
        endpoint_key="collect_payment",
    )
    if cached is not None:
        return JSONResponse(
            content=cached,
            headers={"Idempotency-Replay": "true"},
        )

    # Normal handler logic
    result = await CollectionService.collect_field_payment(...)

    # Store for future replay
    await store_idempotency_result(
        request, UUID(current_user.id),
        endpoint_key="collect_payment",
        result=result,
    )
    return result
```

**Avantages** :
- Explicite et debuggable
- Pas de magie FastAPI
- Clé composite : `idem:{endpoint_key}:{user_id}:{idempotency_key_header}` — scope correct (même user, même endpoint, même key)
- TTL 24h = suffisant pour retry offline mobile sync

### D2 — fee_type check dans `CollectionService` (OWASP A04)

Utilise **`OmsAgentService.resolve_agent_context`** (déjà existant) pour résoudre le scope agent, puis vérifie chaque obligation :

```python
# Inside collect_field_payment, after validating obligations
try:
    oms_ctx = await OmsAgentService.resolve_agent_context(conn, user_id)
except ValueError:
    raise PermissionError(
        "User is not an OMS agent — cannot collect bundle payments"
    )

allowed_fee_types, required_ministry = _compute_agent_scope(oms_ctx)
forbidden = _check_obligations_in_scope(obls, allowed_fee_types, required_ministry)
if forbidden:
    raise PermissionError(
        f"Agent (role={oms_ctx['role_code']}) cannot collect these obligations "
        f"(out of fee_type/ministry scope): {forbidden}"
    )
```

**Fonction de scope** :

```python
def _compute_agent_scope(oms_ctx: Dict) -> Tuple[Optional[Set[str]], Optional[int]]:
    """
    Returns (allowed_fee_types, required_ministry_id).

    Rules:
      - is_polyvalent → (None, None) = no restriction (all fee_types, all ministries)
      - is_independent → ({queue_fee_type}, None) = only 'municipal' or 'chamber'
      - ministry agent → ({'tesoro'}, ministry_id) = tesoro + same ministry
      - supervisor ministry → same as ministry agent
      - supervisor tesoro → polyvalent (already handled)
    """
    if oms_ctx["is_polyvalent"]:
        return (None, None)
    if oms_ctx["is_independent"]:
        return ({oms_ctx["queue_fee_type"]}, None)
    # Ministry agent OR supervisor ministry
    return ({"tesoro"}, oms_ctx["ministry_id"])

def _check_obligations_in_scope(obls, allowed_fee_types, required_ministry):
    forbidden = []
    for o in obls:
        # fee_type check
        if allowed_fee_types is not None and o["fee_type"] not in allowed_fee_types:
            forbidden.append({
                "id": str(o["id"]),
                "reason": f"fee_type '{o['fee_type']}' not in agent scope",
            })
            continue
        # ministry check (only for tesoro-scoped agents with required_ministry)
        if required_ministry is not None and o["ministry_id"] != required_ministry:
            forbidden.append({
                "id": str(o["id"]),
                "reason": f"ministry_id {o['ministry_id']} != agent ministry {required_ministry}",
            })
    return forbidden
```

**Edge cases** :
- Agent `agent_tesoro` (plain, pas polyvalent) avec `ministry_id=None` → required_ministry=None → accepte tous les tesoro sans filtre ministry. Cas légitime pour l'ancien rôle treasury.
- Agent `agent_oms_polyvalent` → None/None → accepte tout (incluant municipal+chamber). **Challenge** : est-ce qu'un agent polyvalent TESORO doit pouvoir collecter des obligations municipal/chamber ? Réponse : **NON**, Addendum 3 dit que municipal/chamber sont toujours indépendants. Donc polyvalent = uniquement tesoro. Correction : `allowed_fee_types = {"tesoro"}` pour polyvalent aussi.
- Supervisor ministry → traité comme ministry agent (même scope)

### D3 — Enrichir `/inspections/verify` avec `existing_dossier` + `restricted_obligations`

**Payload de réponse** (retours ajoutés en plus des champs existants) :

```python
{
    # ... existing fields (company_name, obligations, ...) ...

    # NEW (P3.D3)
    "existing_dossier": {
        "service_request_id": "uuid",
        "reference": "LIC-2026-00001",  # or FLD-2026-00001
        "source": "citizen_wizard",      # or field_inspection
        "status": "SUBMITTED",
        "created_at": "2026-04-11T10:30:00Z",
    } or None,

    "has_pending_citizen_payment": false,  # bool — a service_payment exists
                                           # with workflow_status NOT IN
                                           # ('completed', 'rejected', 'expired')
    "pending_payment_info": {              # optional, only if has_pending_citizen_payment
        "payment_reference": "ONL-2026-...",
        "payment_method": "mobile_money",
        "total_amount": 12500.00,
        "workflow_status": "processing",
    } or None,

    "restricted_obligations": ["uuid1", "uuid2"],  # list of obligation IDs
                                                    # the agent CANNOT collect
    "agent_can_collect_all": true,  # bool derived: len(restricted_obligations) == 0
    "agent_scope": {                # info tooltip pour UI
        "allowed_fee_types": ["tesoro"],  # or null if polyvalent
        "ministry_id": 91,                 # or null
        "is_polyvalent": false,
        "is_independent": false,
    }
}
```

**Point subtil** : `verify_license_for_agent` filtre déjà les obligations par `fee_type` dans `get_license_for_verification` (ligne 765-767). Donc les obligations hors scope sont **invisibles** à l'agent aujourd'hui. Pour P3, on doit :
- **Soit** retourner TOUTES les obligations mais marquer celles restricted → plus d'info pour l'agent mobile
- **Soit** garder le filtrage actuel + juste exposer `agent_scope` pour info

**Décision** : garder le filtre existant (ne pas tout exposer) MAIS calculer `restricted_obligations` depuis les obligations visibles en cas de **mismatch ministry** (un agent MIN_AGRICULTURA voit les tesoro MIN_AGRICULTURA et MIN_COMERCIO — on doit lui signaler ceux non-MIN_AGRICULTURA comme restricted). C'est cohérent avec D2 dans le `collect_field_payment`.

Actually, mieux : **appliquer le filtre ministry dans la query** aussi, comme pour fee_type. Cela simplifie la UI : l'agent ne voit QUE ce qu'il peut collecter. Mais alors `restricted_obligations` sera toujours vide → pas utile.

**Meilleure approche** : modifier `get_license_for_verification` pour :
- Continuer à retourner **toutes** les obligations de la licence (vue d'ensemble)
- Ajouter un champ `agent_restricted` (bool) sur chaque obligation pour indiquer si l'agent peut la collecter
- Calculer `restricted_obligations` = liste des IDs avec `agent_restricted=true`
- Calculer `agent_can_collect_all` = bool

### D4 — Existing dossier : requête minimale

```sql
SELECT sr.id, sr.reference, sr.source, sr.status, sr.created_at
FROM commercial_licenses cl
JOIN service_requests sr ON sr.id = cl.service_request_id
WHERE cl.id = $1
  AND cl.service_request_id IS NOT NULL
```

Si NULL, `existing_dossier = None` — pas d'erreur.

### D5 — has_pending_citizen_payment : requête

```sql
SELECT sp.payment_reference, sp.payment_method, sp.total_amount, sp.workflow_status
FROM service_payments sp
JOIN service_requests sr ON sr.id = sp.service_request_id
JOIN commercial_licenses cl ON cl.service_request_id = sr.id
WHERE cl.id = $1
  AND sp.workflow_status NOT IN ('completed', 'rejected_by_agent', 'expired')
ORDER BY sp.created_at DESC
LIMIT 1
```

Si résultat → `has_pending_citizen_payment = true` + `pending_payment_info`.

---

## 3. CHECKLIST P3

### P3.A — Helper `OmsAgentService.compute_collection_scope`

- [x] P3.A.1 : Ajouter fonction static `compute_collection_scope(oms_ctx)` dans `OmsAgentService` retournant `(allowed_fee_types: Optional[Set[str]], required_ministry: Optional[int])`
- [x] P3.A.2 : Ajouter `check_obligations_in_scope(obligations, allowed_fee_types, required_ministry)` retournant la liste des obligations hors scope avec raison
- [x] P3.A.3 : **Correction Addendum 3** : `polyvalent` → `allowed_fee_types = {'tesoro'}` (pas None). Municipal/chamber toujours indépendants.
- [x] P3.A.4 : Tests unitaires `test_compute_agent_scope_*` pour tous les rôles

### P3.B — Idempotency helpers

- [x] P3.B.1 : Créer `packages/backend/app/core/idempotency.py`
- [x] P3.B.2 : Fonction `_build_cache_key(endpoint_key, user_id, idempotency_key)` → `f"idem:{endpoint_key}:{user_id}:{idempotency_key}"`
- [x] P3.B.3 : Fonction `check_idempotency_or_replay(request, user_id, endpoint_key, ttl_seconds=86400)` → `Optional[dict]`
- [x] P3.B.4 : Fonction `store_idempotency_result(request, user_id, endpoint_key, result, ttl_seconds=86400)` → `None`
- [x] P3.B.5 : Le helper ignore proprement si `Idempotency-Key` absent (pass-through)
- [x] P3.B.6 : Utilise `get_cache()` (HybridCache) — fallback in-memory automatique
- [x] P3.B.7 : Logger INFO "REPLAY" si cache hit
- [x] P3.B.8 : Logger DEBUG "STORE" si cache set
- [x] P3.B.9 : Key validation : header value doit être entre 8 et 128 chars, raise HTTPException(400) sinon (anti-abuse)

### P3.C — Integration Idempotency dans inspection_routes

- [x] P3.C.1 : Importer `check_idempotency_or_replay` + `store_idempotency_result` dans `inspection_routes.py`
- [x] P3.C.2 : Modifier `POST /inspections/{inspection_id}/collect` :
  - [ ] Ajouter param `request: Request`
  - [ ] Early check via `check_idempotency_or_replay(request, user_id, "collect_payment")`
  - [ ] Si cached → return `JSONResponse(content=cached, headers={"Idempotency-Replay": "true"})`
  - [ ] Après handler normal, `store_idempotency_result(...)`
- [x] P3.C.3 : Idem sur `POST /inspections/` (create inspection) avec endpoint_key="create_inspection"

### P3.D — fee_type check dans `CollectionService.collect_field_payment`

- [x] P3.D.1 : Importer `OmsAgentService` + helpers P3.A
- [x] P3.D.2 : Après validation des obligations (§2 du plan P1), avant le FOR UPDATE licence :
  ```python
  try:
      oms_ctx = await OmsAgentService.resolve_agent_context(conn, user_id)
  except ValueError:
      raise PermissionError(
          f"User {user_id} is not an OMS agent, cannot collect bundle payments"
      )

  allowed_fee_types, required_ministry = OmsAgentService.compute_collection_scope(oms_ctx)
  forbidden = OmsAgentService.check_obligations_in_scope(obls, allowed_fee_types, required_ministry)
  if forbidden:
      forbidden_ids = [f["id"] for f in forbidden]
      raise PermissionError(
          f"Agent (role={oms_ctx['role_code']}) cannot collect obligations "
          f"out of fee_type/ministry scope: {forbidden_ids}"
      )
  ```
- [x] P3.D.3 : Adapter les routes inspection pour catcher `PermissionError` → `HTTPException(403)`
- [x] P3.D.4 : Logger INFO avec `forbidden_ids` pour audit

### P3.E — Enrichir `InspectionService.verify_license_for_agent`

- [x] P3.E.1 : Ajouter query `existing_dossier` (D4)
- [x] P3.E.2 : Ajouter query `has_pending_citizen_payment` + `pending_payment_info` (D5)
- [x] P3.E.3 : Calculer `agent_scope` depuis `oms_ctx` via P3.A helpers
- [x] P3.E.4 : Marquer chaque obligation avec `agent_restricted: bool` basé sur scope
- [x] P3.E.5 : Calculer `restricted_obligations: List[UUID]` depuis les flags
- [x] P3.E.6 : Calculer `agent_can_collect_all: bool = len(restricted_obligations) == 0`
- [x] P3.E.7 : Inclure tous ces champs dans le retour du service
- [x] P3.E.8 : **Choix design** : garder le filtre `fee_type` existant dans `get_license_for_verification` OU retourner toutes les obligations + flag `agent_restricted`. **Décision** : retourner toutes les obligations de la licence + flag (plus d'info pour l'UI, l'agent mobile décide quoi afficher/griser).

### P3.F — Tests P3 unitaires + intégration

Fichier : `packages/backend/tests/unit/inspections/test_permissions_fee_type.py`

- [x] P3.F.1 : Fixture `conn` transaction rollback
- [x] P3.F.2 : `test_compute_scope_polyvalent` → `({'tesoro'}, None)` (Addendum 3 corrigé)
- [x] P3.F.3 : `test_compute_scope_ayuntamiento` → `({'municipal'}, None)`
- [x] P3.F.4 : `test_compute_scope_camara` → `({'chamber'}, None)`
- [x] P3.F.5 : `test_compute_scope_ministry_agricultura` → `({'tesoro'}, 104)`
- [x] P3.F.6 : `test_check_obligations_all_allowed` → forbidden = []
- [x] P3.F.7 : `test_check_obligations_wrong_fee_type` → forbidden non-vide
- [x] P3.F.8 : `test_check_obligations_wrong_ministry_for_ministry_agent` → forbidden non-vide
- [x] P3.F.9 : `test_collect_field_payment_blocks_wrong_fee_type` (E2E via _make_inspection + obligation chamber avec agent MIN) → `PermissionError`
- [x] P3.F.10 : `test_collect_field_payment_allows_ayuntamiento_municipal` (happy path independent)
- [x] P3.F.11 : `test_collect_field_payment_polyvalent_tesoro_ok` (polyvalent collecte tesoro OK)
- [x] P3.F.12 : `test_collect_field_payment_polyvalent_municipal_rejected` (polyvalent ne collecte PAS municipal — Addendum 3)

Fichier : `packages/backend/tests/unit/core/test_idempotency.py`

- [x] P3.F.13 : `test_check_idempotency_no_header_returns_none`
- [x] P3.F.14 : `test_store_then_replay_returns_cached`
- [x] P3.F.15 : `test_different_users_dont_collide` (même key, 2 users → miss)
- [x] P3.F.16 : `test_different_endpoints_dont_collide`
- [x] P3.F.17 : `test_key_too_short_raises_400`
- [x] P3.F.18 : `test_key_too_long_raises_400`

Fichier : `packages/backend/tests/unit/inspections/test_verify_enriched.py`

- [x] P3.F.19 : `test_verify_returns_existing_dossier_when_linked` — SR lié → `existing_dossier` populé
- [x] P3.F.20 : `test_verify_returns_null_dossier_when_not_linked` — licence orpheline → `existing_dossier = None`
- [x] P3.F.21 : `test_verify_has_pending_payment_when_workflow_active` — service_payment non-completed → `has_pending_citizen_payment = True`
- [x] P3.F.22 : `test_verify_restricted_obligations_for_ministry_agent` — obligations hors ministry → restricted populated
- [x] P3.F.23 : `test_verify_agent_can_collect_all_for_polyvalent_on_tesoro` — polyvalent + obligations tesoro → `agent_can_collect_all = true`

### P3.G — Validation & auto-critique

- [x] P3.G.1 : Relire diff complet
- [x] P3.G.2 : Grep `_compute_agent_scope` / `check_idempotency` pour cohérence
- [x] P3.G.3 : Lancer tous les tests : `pytest tests/unit/inspections/ tests/unit/service_requests/test_cleanup_abandoned.py tests/unit/core/test_idempotency.py`
- [x] P3.G.4 : Objectif : ≥ **45 passed** (P1: 19 + P2: 10 + P3: ~16)
- [x] P3.G.5 : Vérifier aucune régression P1/P2
- [x] P3.G.6 : Rédiger auto-critique dans `.claude/plans/INSPECTION_BUNDLE_P3_RETRO.md`
- [x] P3.G.7 : Commit local avec message structuré
- [x] P3.G.8 : **NE PAS PUSH** — on push après validation globale

---

## 4. MATRICE DE RISQUES P3

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| `resolve_agent_context` lève ValueError pour agent non-OMS mais légitime (ex: ancien agent_tesoro) | Faible | 🟠 Haut | Catch explicite + message d'erreur clair "cannot collect bundle payments" (pas un 500) |
| Addendum 3 mal interprété : polyvalent peut ou ne peut pas collecter municipal/chamber ? | Moyenne | 🟠 Haut | Décision : polyvalent = tesoro only. À confirmer avec user. Tests explicites. |
| Idempotency cache déborde avec 100+ agents × 24h retention | Faible | 🟡 Moyen | Upstash Redis a de la marge. Monitor via métriques P5. TTL 24h + clé par user |
| Key Idempotency attaquée (enum brute force) | Faible | 🟡 Moyen | Validation 8-128 chars + rate limit existant 30/min sur l'endpoint verify |
| `existing_dossier` query N+1 | Faible | 🟢 Bas | Query unique JOIN, déjà en 1 round-trip |
| L'UI mobile ignore `restricted_obligations` et essaye de collecter → 403 | Certaine | 🟡 Moyen | Le 403 est le fallback. L'UI doit griser côté client (à faire en P4 mobile) |
| Breaking change sur format `/verify` → ancien client mobile casse | Moyenne | 🟠 Haut | Additif only (nouveaux champs), pas de suppression de champs existants → backward compatible |
| Clé Idempotency invalide (pas UUID v4) | Moyenne | 🟢 Bas | Validation soft : longueur 8-128 chars, pas de format imposé (Stripe permet tout hash hex) |

---

## 5. CRITÈRES DE PASSAGE EN P4

P3 est **DONE** quand :

- ✅ `OmsAgentService.compute_collection_scope` implémenté + testé
- ✅ `app/core/idempotency.py` créé + testé (6 tests)
- ✅ `POST /collect` + `POST /inspections/` utilisent les helpers Idempotency
- ✅ `CollectionService.collect_field_payment` vérifie fee_type/ministry (raise PermissionError)
- ✅ `verify_license_for_agent` retourne les 5 nouveaux champs
- ✅ Tests P3 passent (16 minimum)
- ✅ Tests P1/P2 passent (29)
- ✅ **Total ≥ 45 tests passed**
- ✅ `flake8` + `mypy --strict` OK
- ✅ Plan P3 cochée à 100%
- ✅ Auto-critique rédigée
- ✅ Commit local créé

---

## 6. LIVRABLES

| Livrable | Fichier |
|----------|---------|
| Scope helpers | `packages/backend/app/modules/fiscal_services/services/oms_agent_service.py` (ajout 2 fonctions) |
| Idempotency helpers | `packages/backend/app/core/idempotency.py` (nouveau) |
| Routes Idempotency integration | `packages/backend/app/modules/inspections/api/inspection_routes.py` |
| fee_type check | `packages/backend/app/modules/inspections/services/collection_service.py` (+ import) |
| Verify enrichi | `packages/backend/app/modules/inspections/services/inspection_service.py` |
| Verify enriched query | `packages/backend/app/modules/inspections/repositories/inspection_repository.py` (possiblement) |
| Tests scope | `packages/backend/tests/unit/inspections/test_permissions_fee_type.py` (nouveau) |
| Tests idempotency | `packages/backend/tests/unit/core/test_idempotency.py` (nouveau) |
| Tests verify enrichi | `packages/backend/tests/unit/inspections/test_verify_enriched.py` (nouveau) |
| Rétro | `.claude/plans/INSPECTION_BUNDLE_P3_RETRO.md` |

---

## 7. POINTS DE DÉCISION À CONFIRMER AVANT IMPL

### Q1 — `agent_oms_polyvalent` scope : tesoro only OU tous fee_types ?

**Mon analyse** : L'Addendum 3 dit que municipal et chamber sont **toujours indépendants** (ayuntamiento + camara). Donc un agent polyvalent ne devrait PAS pouvoir collecter municipal/chamber (ils relèvent strictement de ayuntamiento/camara).

**Recommandation** : `polyvalent → {"tesoro"}, required_ministry=None` (pas de filtre ministry car polyvalent voit tous les ministères tesoro).

### Q2 — `verify` backwards-compatible ?

**Oui** : on ajoute 5 nouveaux champs (`existing_dossier`, `has_pending_citizen_payment`, `pending_payment_info`, `restricted_obligations`, `agent_can_collect_all`, `agent_scope`) sans retirer aucun champ existant.

### Q3 — Idempotency `POST /inspections/` (create) aussi ?

Le plan général l'indique. Ma recommandation : **OUI**, car réseau terrain instable = retry possible au moment de la création aussi. Coût : quelques lignes par endpoint.

### Q4 — Rate limit sur `POST /collect` ?

Actuellement pas de rate limit explicite sur `/collect`. Je **n'ajoute pas** de rate limit (l'Idempotency-Key + le check `payment_collected` déjà implémenté suffisent). À revoir en P5 si DoS devient un problème.

### Q5 — Format `Idempotency-Key` : strict UUID ou libre ?

Stripe permet n'importe quelle string 8-128 chars. **Recommandation** : idem, libre avec validation de longueur. Le client mobile peut utiliser `uuid.v4()` par simplicité.

---

## 8. NOTES HORS SCOPE P3 (reporté)

- **Métriques Prometheus** `idempotency_replay_total`, `collect_forbidden_total` → P5
- **Alerte** si `forbidden` > 10/h → signe qu'un agent attaque OOC → P5
- **Mobile** : UI grise les obligations `agent_restricted=true` → P4 Mobile Inspector
- **Soft-delete `Idempotency-Key`** : pas nécessaire, TTL Redis gère l'auto-expiration

---

**FIN DU PLAN DÉTAILLÉ P3**

Statut : **À VALIDER** — réponds :
- **"GO IMPL P3"** pour démarrer P3.A
- **"Q1=tesoro_only"** ou **"Q1=all"** si désaccord sur le scope polyvalent
- **"MODIFIE X"** pour ajustements
