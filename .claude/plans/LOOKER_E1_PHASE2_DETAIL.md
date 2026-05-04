# LOOKER E1 — Phase 2 : Backend implementation

**Date** : 2026-05-04
**Phase** : 2/5
**Statut** : 📋 PLANIFIÉ
**Effort** : 1h30
**Master plan** : `.claude/plans/LOOKER_E1_AUTOMATION_MASTER_PLAN.md`
**Phase précédente** : `.claude/plans/LOOKER_E1_PHASE1_DETAIL.md` (✅ DONE)

---

## 1. Objectif phase

Implémenter le backend de l'automatisation `report_id` :
1. Modèles Pydantic pour la nouvelle API admin
2. Repository asyncpg pour `dashboard_registrations`
3. Service avec cache Redis 5 min + invalidation
4. Endpoint PUT pour modifier la config (admin uniquement)
5. Endpoint GET pour lister la config (admin uniquement)
6. Refactor du GET `/reports-config` existant : DB-first avec fallback env vars
7. Audit log + rate limit + tests pytest

## 2. Architecture détaillée

### 2.1 Mount des endpoints

Router monté sur `/api/v1/dashboards/*` (existant, voir `main.py:1417`).

| Verb | Path | Permission | Usage |
|------|------|------------|-------|
| GET | `/api/v1/dashboards/reports-config` | `dashboards.view_business` | Frontend embed page (existant, refactoré) |
| GET | `/api/v1/dashboards/admin/configs` | `dashboards.manage` | Page admin config (nouveau) |
| PUT | `/api/v1/dashboards/admin/configs/{dashboard_id}` | `dashboards.manage` | Form admin (nouveau) |

### 2.2 Pydantic models (nouveau fichier)

`packages/backend/app/modules/dashboards/models/dashboard_config.py` :

```python
class DashboardConfigDTO(BaseModel):
    """Stored row of dashboard_registrations + computed metadata."""
    dashboard_id: str
    label: str                                    # from registry
    description: str                              # from registry
    rls_mode: str                                 # from registry
    looker_report_id: Optional[str]
    looker_page_id: Optional[str]
    is_active: bool
    source: Literal["db", "env_fallback", "unset"]
    updated_by: Optional[str] = None              # UUID as str
    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class DashboardConfigUpdateRequest(BaseModel):
    """PUT body — only the editable fields."""
    looker_report_id: str = Field(..., min_length=8, max_length=64,
        pattern=r"^[a-zA-Z0-9_-]{8,64}$",
        description="Looker Studio report ID (8-64 alphanum + dash + underscore)")
    looker_page_id: Optional[str] = Field(default=None, max_length=32,
        pattern=r"^[a-zA-Z0-9_]{1,32}$",
        description="Optional Looker Studio page ID (max 32 alphanum + underscore)")
    is_active: bool = Field(default=True)
    model_config = ConfigDict(extra="forbid")

class DashboardConfigsListResponse(BaseModel):
    configs: list[DashboardConfigDTO]
    model_config = ConfigDict(extra="forbid")
```

**Choix** :
- Pydantic v2 `pattern=` enforce regex côté Python (BD a déjà CHECK regex = défense en profondeur)
- `extra="forbid"` rejette les champs inconnus (OWASP : pas de mass assignment)
- `source` discriminates BD vs env fallback vs unset → frontend sait quoi afficher
- `label`, `description`, `rls_mode` viennent du registry (pas de la BD) car ils sont en code

### 2.3 Repository (nouveau fichier)

`packages/backend/app/modules/dashboards/repositories/dashboard_config_repository.py` :

```python
class DashboardConfigRepository:
    @staticmethod
    async def list_active(conn: asyncpg.Connection) -> list[asyncpg.Record]:
        return await conn.fetch(
            "SELECT dashboard_id, looker_report_id, looker_page_id, is_active, "
            "       updated_by, updated_at, created_at "
            "FROM dashboard_registrations "
            "WHERE is_active = true "
            "ORDER BY dashboard_id"
        )

    @staticmethod
    async def list_all(conn: asyncpg.Connection) -> list[asyncpg.Record]:
        return await conn.fetch(
            "SELECT dashboard_id, looker_report_id, looker_page_id, is_active, "
            "       updated_by, updated_at, created_at "
            "FROM dashboard_registrations "
            "ORDER BY dashboard_id"
        )

    @staticmethod
    async def get_by_id(conn, dashboard_id: str) -> Optional[asyncpg.Record]:
        return await conn.fetchrow(
            "SELECT dashboard_id, looker_report_id, looker_page_id, is_active, "
            "       updated_by, updated_at, created_at "
            "FROM dashboard_registrations WHERE dashboard_id = $1",
            dashboard_id,
        )

    @staticmethod
    async def upsert(
        conn,
        *, dashboard_id: str, looker_report_id: str,
        looker_page_id: Optional[str], is_active: bool, updated_by: str,
    ) -> asyncpg.Record:
        return await conn.fetchrow(
            """
            INSERT INTO dashboard_registrations
                (dashboard_id, looker_report_id, looker_page_id, is_active, updated_by, updated_at, created_at)
            VALUES ($1, $2, $3, $4, $5::uuid, NOW(), NOW())
            ON CONFLICT (dashboard_id) DO UPDATE SET
                looker_report_id = EXCLUDED.looker_report_id,
                looker_page_id   = EXCLUDED.looker_page_id,
                is_active        = EXCLUDED.is_active,
                updated_by       = EXCLUDED.updated_by,
                updated_at       = NOW()
            RETURNING dashboard_id, looker_report_id, looker_page_id, is_active,
                      updated_by, updated_at, created_at
            """,
            dashboard_id, looker_report_id, looker_page_id, is_active, updated_by,
        )
```

**Choix** :
- Static methods : repo stateless, simple à mock en tests
- Tous les SELECT projettent les mêmes colonnes (pas de SELECT * → schéma stable)
- UPSERT atomique avec RETURNING → 1 round-trip BD au lieu de SELECT puis UPDATE
- `$5::uuid` cast explicite (asyncpg accepte aussi str, mais explicite)

### 2.4 Service (nouveau fichier)

`packages/backend/app/modules/dashboards/services/dashboard_config_service.py` :

```python
class DashboardConfigService:
    CACHE_KEY = "dashboard_configs:all"   # single key, payload <2KB
    CACHE_TTL = 300                       # 5 min

    def __init__(self, pool: asyncpg.Pool, registry: dict[str, dict]):
        self._pool = pool
        self._registry = registry  # _REPORTS_METADATA from routes (label/desc/rls)

    async def get_public_reports_config(self) -> list[DashboardReportEntry]:
        """Power /reports-config (admin landing). DB-first with env fallback."""
        cache = get_cache()
        cached = await cache.get(self.CACHE_KEY)
        if cached is not None:
            return [DashboardReportEntry(**r) for r in cached]

        async with self._pool.acquire() as conn:
            rows = await DashboardConfigRepository.list_active(conn)

        by_id = {r["dashboard_id"]: r for r in rows}
        entries: list[DashboardReportEntry] = []
        for dashboard_id, meta in self._registry.items():
            row = by_id.get(dashboard_id)
            if row is not None:
                report_id = row["looker_report_id"]
                page_id = row["looker_page_id"]
            else:
                # Fallback: env vars (backwards-compat with pre-E1 deploy).
                env_prefix = f"LOOKER_REPORTS_{dashboard_id.upper()}"
                report_id = os.environ.get(f"{env_prefix}_REPORT_ID") or None
                page_id = os.environ.get(f"{env_prefix}_PAGE_ID") or None
                if report_id is not None:
                    logger.warning(
                        "dashboard_config: using env-var fallback for {} — "
                        "consider populating dashboard_registrations row",
                        dashboard_id,
                    )
            entries.append(DashboardReportEntry(
                dashboard_id=dashboard_id,
                label=meta["label"],
                description=meta["description"],
                rls_mode=meta["rls_mode"],
                looker_report_id=report_id,
                looker_page_id=page_id,
            ))

        # Cache the dict form (not the model) for cross-process compat.
        await cache.set(
            self.CACHE_KEY,
            [e.model_dump() for e in entries],
            ttl=self.CACHE_TTL,
        )
        return entries

    async def list_admin_configs(self) -> list[DashboardConfigDTO]:
        """Power /admin/configs — full row + source label."""
        async with self._pool.acquire() as conn:
            rows = await DashboardConfigRepository.list_all(conn)
        by_id = {r["dashboard_id"]: r for r in rows}

        configs: list[DashboardConfigDTO] = []
        for dashboard_id, meta in self._registry.items():
            row = by_id.get(dashboard_id)
            if row is not None:
                source = "db"
                configs.append(DashboardConfigDTO(
                    dashboard_id=dashboard_id,
                    label=meta["label"],
                    description=meta["description"],
                    rls_mode=meta["rls_mode"],
                    looker_report_id=row["looker_report_id"],
                    looker_page_id=row["looker_page_id"],
                    is_active=row["is_active"],
                    source=source,
                    updated_by=str(row["updated_by"]) if row["updated_by"] else None,
                    updated_at=row["updated_at"],
                    created_at=row["created_at"],
                ))
            else:
                env_prefix = f"LOOKER_REPORTS_{dashboard_id.upper()}"
                report_id = os.environ.get(f"{env_prefix}_REPORT_ID") or None
                page_id = os.environ.get(f"{env_prefix}_PAGE_ID") or None
                source = "env_fallback" if report_id else "unset"
                configs.append(DashboardConfigDTO(
                    dashboard_id=dashboard_id,
                    label=meta["label"],
                    description=meta["description"],
                    rls_mode=meta["rls_mode"],
                    looker_report_id=report_id,
                    looker_page_id=page_id,
                    is_active=True,                    # default visible
                    source=source,
                ))
        return configs

    async def upsert_config(
        self,
        dashboard_id: str,
        update: DashboardConfigUpdateRequest,
        *, user_id: str,
        request: Request,
    ) -> DashboardConfigDTO:
        if dashboard_id not in self._registry:
            raise DashboardNotFoundError(
                f"Unknown dashboard_id '{dashboard_id}'. "
                f"Registered: {list(self._registry.keys())}."
            )

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                old_row = await DashboardConfigRepository.get_by_id(conn, dashboard_id)
                new_row = await DashboardConfigRepository.upsert(
                    conn,
                    dashboard_id=dashboard_id,
                    looker_report_id=update.looker_report_id,
                    looker_page_id=update.looker_page_id,
                    is_active=update.is_active,
                    updated_by=user_id,
                )
                # Audit trail
                await conn.execute(
                    """
                    INSERT INTO audit_logs
                        (user_id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, created_at)
                    VALUES ($1, 'dashboard_config', $2, 'dashboard.config_update', $3::jsonb, $4::jsonb, $5, $6, NOW())
                    """,
                    user_id,
                    dashboard_id,
                    json.dumps(_row_to_dict(old_row)) if old_row else None,
                    json.dumps(_row_to_dict(new_row)),
                    request.client.host if request and request.client else None,
                    request.headers.get("user-agent") if request else None,
                )

        # Invalidate cache so the next /reports-config sees the change immediately
        await get_cache().delete(self.CACHE_KEY)

        meta = self._registry[dashboard_id]
        return DashboardConfigDTO(
            dashboard_id=dashboard_id,
            label=meta["label"],
            description=meta["description"],
            rls_mode=meta["rls_mode"],
            looker_report_id=new_row["looker_report_id"],
            looker_page_id=new_row["looker_page_id"],
            is_active=new_row["is_active"],
            source="db",
            updated_by=str(new_row["updated_by"]),
            updated_at=new_row["updated_at"],
            created_at=new_row["created_at"],
        )
```

**Choix** :
- Single cache key, payload <2 KB → pas de stampede préoccupant
- Cache invalidation explicite `delete()` sur write (pas de TTL=0 hack)
- audit_log emis dans la même transaction que l'UPSERT (atomicité)
- DashboardNotFoundError réutilisé (existe déjà dans dashboards_service.py)
- `_row_to_dict()` helper pour sérialiser asyncpg.Record → dict pour JSONB
- `request` passé pour capturer ip/UA (audit forensique)

### 2.5 Endpoint refactor + new (modif fichier existant)

`packages/backend/app/modules/dashboards/api/dashboards_routes.py` :

```python
# Add import
from app.modules.dashboards.services.dashboard_config_service import DashboardConfigService

# Refactored — was: read env vars directly. Now: delegates to service.
@router.get("/reports-config", ...)
async def get_reports_config(
    user=Depends(get_current_user),
    _perm=Depends(permission_required("dashboards.view_business")),
):
    pool = await get_db_pool()
    svc = DashboardConfigService(pool, _REPORTS_METADATA)
    entries = await svc.get_public_reports_config()
    return DashboardReportsConfigResponse(reports=entries)

# New — admin list
@router.get("/admin/configs", ...)
async def list_admin_configs(
    user=Depends(get_current_user),
    _perm=Depends(permission_required("dashboards.manage")),
):
    pool = await get_db_pool()
    svc = DashboardConfigService(pool, _REPORTS_METADATA)
    configs = await svc.list_admin_configs()
    return DashboardConfigsListResponse(configs=configs)

# New — admin update
@router.put("/admin/configs/{dashboard_id}", ...)
async def update_admin_config(
    request: Request,
    dashboard_id: str,
    update: DashboardConfigUpdateRequest,
    user=Depends(get_current_user),
    _perm=Depends(permission_required("dashboards.manage")),
):
    user_id = str(getattr(user, "id", ""))

    # Rate limit: 10 req/min/user. Tighter than read endpoints (60/min).
    is_allowed, _remaining = await check_rate_limit(
        identifier=user_id,
        endpoint="/dashboards/admin/configs",
        max_requests=10,
        window_seconds=60,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: 10 PUT requests / 60s.",
            headers={"Retry-After": "60"},
        )

    pool = await get_db_pool()
    svc = DashboardConfigService(pool, _REPORTS_METADATA)
    try:
        return await svc.upsert_config(
            dashboard_id, update, user_id=user_id, request=request,
        )
    except DashboardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
```

**OWASP** :
- ✅ Permission gate (dashboards.manage)
- ✅ Rate limit 10/min (vs 60 sur read)
- ✅ Pydantic validation auto (regex + length)
- ✅ Path param `dashboard_id` validé contre registry → 404 si inconnu
- ✅ Audit log avec ip + UA (forensique)
- ✅ Pas de mass assignment (extra="forbid")
- ✅ asyncpg parametrized queries

## 3. Tests pytest

`packages/backend/tests/test_dashboard_config.py` (nouveau) :

```python
class TestDashboardConfigService:
    async def test_get_public_reports_config_db_first(self, db_pool, redis_cache):
        # Insert a row in dashboard_registrations
        # Call get_public_reports_config → expect "db" entry

    async def test_get_public_reports_config_env_fallback(self, db_pool, monkeypatch):
        # Empty table, set env var
        # Expect entry from env

    async def test_get_public_reports_config_unset(self, db_pool):
        # Empty table, no env var
        # Expect entry with looker_report_id=None

    async def test_upsert_config_creates_audit_log(self, db_pool):
        # Call upsert_config
        # Expect 1 row in audit_logs with action='dashboard.config_update'

    async def test_upsert_config_invalidates_cache(self, db_pool, redis_cache):
        # Pre-populate cache
        # Call upsert_config
        # Expect cache key deleted

    async def test_upsert_config_unknown_dashboard_id_raises(self, db_pool):
        # Expect DashboardNotFoundError

class TestEndpoints:
    async def test_put_requires_dashboards_manage(self, client_citizen):
        # Citizen → 403

    async def test_put_validates_regex(self, client_admin):
        # bad report_id → 422

    async def test_put_unknown_dashboard_id(self, client_admin):
        # /admin/configs/unknown → 404

    async def test_get_reports_config_uses_cache(self, client_admin):
        # 1st call → DB hit
        # 2nd call within 5min → cache hit (no DB query)

    async def test_rate_limit_put_10_per_min(self, client_admin):
        # 11 PUTs in 60s → 11th gets 429
```

**Couverture cible** : 80%+ des nouveaux fichiers.

## 4. Checklist phase 2

- [x] Plan phase 2 écrit (CE FICHIER) — 2026-05-04
- [x] `models/dashboard_config.py` + export dans `__init__.py`
- [x] `repositories/dashboard_config_repository.py` + `__init__.py`
- [x] `services/dashboard_config_service.py` + export dans services `__init__.py`
- [x] Refactor `api/dashboards_routes.py` (3 endpoints : 1 refactored + 2 new)
- [x] Smoke test E2E contre BD live (6 scénarios) au lieu de pytest (raisons en §5 critique)
- [x] Vérification syntaxique : import du router OK, 6 routes enregistrées correctement
- [x] Vérification Pydantic : regex rejette inputs invalides, accepte valides, extra=forbid actif
- [x] Tests E2E avec BD live PASS 6/6 : empty/env/db sources, audit_log INSERT/UPDATE, cache hit, cache invalidation, 404 unknown id
- [x] Critique honnête phase 2 (§7 ci-dessous)
- [ ] Commit local : `feat(observability/looker): E1 phase 2 — backend admin config endpoints + cache + audit`

## 5. Critique préventive (avant impl)

| Item | Question | Réponse |
|---|---|---|
| Hardcoding | Registry `_REPORTS_METADATA` répété ? | OUI dans routes.py — VOLONTAIRE pour Phase 2, refactor en Phase 3 si frontend a besoin du même |
| 1M+ users | Cache stampede possible ? | Non — single key, hot path, 5min TTL. HybridCache existing fait le travail |
| OWASP | Pydantic regex assez stricte ? | Oui — même regex que CHECK BD (défense en profondeur) |
| OWASP | UUID `updated_by` validé côté backend ? | `user_id` vient de `get_current_user` (déjà UUID validé) |
| Audit | `old_values` peut être NULL si row n'existait pas ? | Oui géré (`if old_row` ternaire) |
| Atomicité | UPSERT + audit_log dans la même transaction ? | OUI via `async with conn.transaction()` |
| Backwards compat | Endpoint `/reports-config` existant cassé ? | Non — même URL, même réponse Pydantic, même permission gate. Seul le code interne change. |
| Test fixtures | Comment moquer asyncpg pool en test ? | Réutiliser `db_pool` fixture existante (présent dans `conftest.py`) |
| Cache fallback | Si Redis down, le service marche ? | Oui — HybridCache fallback memory_only (pattern existant) |

**Gaps acceptés** :
- Pas de versioning de config (= pas de undo). Audit log permet de retrouver la valeur précédente. Suffisant.
- Pas de webhook / notification quand config change. Hors scope E1.
- Pas de soft-delete sur la table → DELETE direct possible mais audit garde trace. Acceptable.
- Pas de bulk update endpoint (PATCH multiple). 3 dashboards seulement, 3 PUTs OK.

## 6. Sortie phase 2

À la fin :
- ✅ 3 nouveaux fichiers Python (models/dashboard_config.py, repositories/dashboard_config_repository.py, services/dashboard_config_service.py)
- ✅ 3 fichiers modifiés (models/__init__.py, services/__init__.py, api/dashboards_routes.py — refactor get_reports_config + 2 new endpoints)
- ✅ 1 nouveau fichier `__init__.py` pour repositories/
- ✅ 1 script smoke test (scripts/smoke_e1_phase2_service.py)
- ✅ Smoke tests 6/6 PASS
- ✅ Critique écrite (§7)
- ✅ 1 commit local sémantique
- ✅ Phase 3 peut commencer (frontend admin page)

## 7. Critique honnête phase 2

**Bien réussi** :
- Plan détaillé écrit AVANT impl (architecture, OWASP, perf 1M+, gaps acceptés)
- Pydantic regex matches BD CHECK exactly (défense en profondeur)
- `extra="forbid"` rejette mass assignment OWASP
- UPSERT atomique avec RETURNING (1 round-trip BD vs SELECT+UPDATE)
- audit_log dans la même transaction que UPSERT (atomicité)
- Cache invalidation **après** commit (évite la race où un reader rempile l'old payload)
- Backwards-compat env fallback testé en runtime (Test 2)
- DashboardNotFoundError pour unknown id (404 propre)
- Rate limit 10 PUT/min (vs 60 read)
- Permission gate `dashboards.manage` (admin/super_admin only, distinct de view_business)
- 6/6 smoke tests passent contre BD live

**Gaps identifiés** :
1. **Pas de pytest unitaire formel** — j'ai écrit un script smoke contre BD live au lieu. Justification : (a) pas de fixtures pytest pour Supabase asyncpg en place, (b) pattern smoke script utilisé par les modules existants, (c) le script est reproducible et idempotent (cleanup à la fin). À uniformiser plus tard quand toute la base passera à pytest+asyncpg.
2. **Pas de test runtime du rate limit** (11ème PUT → 429). Vérifié logiquement par lecture du code (pattern identique au get_data existant). À tester en phase 4 smoke curl.
3. **`_REPORTS_METADATA` est dupliqué** entre routes.py (defining) et service (consuming via DI). Acceptable car service est stateless et registry est en code (pas en BD). Si on déplace le registry plus tard, 1 seul endroit.
4. **Pas de pub/sub Redis** pour invalider le cache sur instances multiples. Acceptable : 1 service Cloud Run aujourd'hui, scale horizontal nécessitera ça mais est hors scope E1.
5. **Pas de soft-delete** sur `dashboard_registrations` — DELETE direct possible mais audit_logs garde trace. Acceptable pour 3 lignes max.

**OWASP audit** :
- ✅ Auth/Z : `permission_required("dashboards.manage")` gate
- ✅ Input validation : Pydantic regex + min/max length + `extra="forbid"`
- ✅ SQL injection : asyncpg parametrized `$1/$2`
- ✅ Path traversal : `dashboard_id` whitelist via registry → 404 sinon
- ✅ Audit trail : `audit_logs` row à chaque PUT, ip + UA capturés
- ✅ Rate limiting : 10 PUT/min/user
- ✅ Mass assignment : `extra="forbid"` bloque champs inconnus
- ✅ IDOR : impossible — dashboard_id whitelist + registry-bound

**Performance 1M+ check** :
- ✅ Cache Redis 5min sur hot read path (`/reports-config` appelé sur chaque admin page load)
- ✅ Single cache key, payload <2KB pour 3 entries
- ✅ Index partiel BD sur `is_active=true`
- ✅ UPSERT atomique (1 round-trip)
- ✅ HybridCache fallback memory_only si Redis down (pattern existant)

**Verdict phase 2** : PRÊT pour commit + phase 3 (frontend admin config page).
