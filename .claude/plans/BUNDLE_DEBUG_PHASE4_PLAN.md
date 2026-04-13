# PHASE 4 — GLOBAL EXCEPTION HANDLER + DB OBSERVABILITY

**Master plan** : `BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`
**Date** : 2026-04-13
**Priorité** : 🟡 MOYENNE — plus de 500 bruts, DB errors mappées partout
**Temps estimé** : ~1.5 h
**Statut** : 🔵 EN COURS (worktree)

---

## 1. OBSERVATIONS BACKEND

### 1.1 État actuel (`app/main.py`)
- `@app.exception_handler(Exception)` ligne 353 : capture toute exception non gérée, renvoie 500 + `ErrorCode.SERVER_ERROR`. **Pas de traitement asyncpg**.
- `@app.exception_handler(HTTPException)` ligne 373 : gestion i18n + sanitization 5xx (log détail, message générique au client).
- Sanitization 5xx présente (sécurité ✅), **mais** elle masque aussi les codes métier utiles (ex: `BUNDLE_INTEGRITY_ERROR`).
- Aucun `asyncpg.PostgresError` handler → toute exception BD non catchée dans le service layer remonte en generic 500.

### 1.2 Patterns dans le code
- `agent_profile_service.py:876+` catch UniqueViolation/CheckViolation/ForeignKeyViolation manuellement
- `bundle_workflow_service.py:957+` (Phase 1) catch UniqueViolation + CheckViolation
- `license_service.py:146` catch UniqueViolation
- **Beaucoup de repositories** (service_details, search, etc.) catch `asyncpg.PostgresError` générique → probable 500 brut

### 1.3 Risques identifiés
- **R4-1** : une exception PG non catchée dans un handler spécifique remonte en 500 générique sans metier code → frontend Phase 3 verra `HTTP_500` au lieu de `DB_UNIQUE_VIOLATION`.
- **R4-2** : les messages PostgreSQL bruts (ex: `duplicate key value violates unique constraint "foo_pkey"`) peuvent leak côté client — potentiellement exposant des noms de constraints/tables (fuite d'info OWASP A01/A05).
- **R4-3** : pas de metrics / counter dédiés pour suivre le taux de CheckViolation / LockNotAvailable en prod.
- **R4-4** : timeout `statement_timeout` / `lock_timeout` que j'ai ajoutés en Phase 1 lèvent `asyncpg.QueryCanceledError` → non géré → 500 brut.

---

## 2. DESIGN

### 2.1 Nouveaux ErrorCodes (app/core/errors.py)
```python
DB_UNIQUE_VIOLATION = "ERR_DB_UNIQUE_VIOLATION"       # 409
DB_CHECK_VIOLATION = "ERR_DB_CHECK_VIOLATION"         # 422
DB_FK_VIOLATION = "ERR_DB_FK_VIOLATION"               # 422
DB_NOT_NULL_VIOLATION = "ERR_DB_NOT_NULL_VIOLATION"   # 422
DB_SERIALIZATION_FAILURE = "ERR_DB_SERIALIZATION"     # 409 (retry)
DB_DEADLOCK = "ERR_DB_DEADLOCK"                       # 409 (retry)
DB_LOCK_TIMEOUT = "ERR_DB_LOCK_TIMEOUT"               # 409 (retry)
DB_STATEMENT_TIMEOUT = "ERR_DB_STATEMENT_TIMEOUT"     # 504 (retry)
DB_CONNECTION_ERROR = "ERR_DB_CONNECTION"             # 503
```

### 2.2 Nouveau handler global `@app.exception_handler(asyncpg.PostgresError)`
- **Mapping exhaustif** : UniqueViolation, CheckViolation, ForeignKeyViolation, NotNullViolation, SerializationFailure, DeadlockDetected, LockNotAvailable, QueryCanceledError, InterfaceError
- **Log serveur** : loguer le SQLSTATE, le constraint, la table si disponible (sans leaker au client)
- **Réponse client** : code métier + message trilingue générique + aucun nom de table/constraint

### 2.3 Format de réponse structuré
Aligné avec le format déjà utilisé dans `bundle_workflow_routes.py` :
```json
{
  "detail": {
    "code": "DB_UNIQUE_VIOLATION",
    "message_es": "Ya existe un registro con estos datos",
    "message_fr": "Un enregistrement avec ces données existe déjà",
    "message_en": "A record with these data already exists"
  },
  "error_code": "ERR_DB_UNIQUE_VIOLATION"
}
```

Ce format est compatible avec mon `extractApiError` côté frontend Phase 3 → pas de changement client nécessaire.

### 2.4 HTTP status mapping
| SQLSTATE | Classe asyncpg | HTTP | Retryable |
|---|---|---|---|
| 23505 | UniqueViolation | 409 | non |
| 23514 | CheckViolation | 422 | non |
| 23503 | ForeignKeyViolation | 422 | non |
| 23502 | NotNullViolation | 422 | non |
| 40001 | SerializationFailure | 409 | **oui** |
| 40P01 | DeadlockDetected | 409 | **oui** |
| 55P03 | LockNotAvailable | 409 | **oui** (court) |
| 57014 | QueryCanceled | 504 | **oui** (serveur lent) |
| 08xxx | ConnectionError | 503 | **oui** |
| autre | PostgresError | 500 | non |

### 2.5 Non-goals Phase 4
- Pas de réécriture des try/except PostgresError existants (les handlers spécifiques dans agent_profile_service etc. restent — ils fournissent des messages métier plus précis)
- Pas de metrics Prometheus (nécessite infra dédiée — reporté Phase 5 si demandé)
- Pas de refactor de global_exception_handler pour l'i18n générique (déjà OK)

---

## 3. CHECKLIST D'IMPLÉMENTATION

### 3.1 Enrichir `app/core/errors.py`
- [ ] Ajouter les 9 nouveaux `ErrorCode` (DB_*)
- [ ] Ajouter leurs 9 entrées `ERROR_CATALOG` × 3 langues

### 3.2 Créer `app/core/db_error_handler.py`
- [ ] Nouveau fichier isolé pour ne pas alourdir `main.py`
- [ ] Fonction `build_db_error_response(exc, request)` : mapping asyncpg → JSONResponse
- [ ] Log structuré (SQLSTATE, constraint name, table, error message) — serveur uniquement
- [ ] Réponse JSON : `{detail: {code, message_es, message_fr, message_en}, error_code}`

### 3.3 Enregistrer le handler dans `main.py`
- [ ] `@app.exception_handler(asyncpg.PostgresError)` → `build_db_error_response`
- [ ] Placé AVANT `@app.exception_handler(Exception)` pour priorité

### 3.4 Tests
- [ ] Test unitaire `build_db_error_response` avec fake exceptions (UniqueViolation, CheckViolation, QueryCanceled, InterfaceError)
- [ ] Test d'intégration : POST vers un endpoint qui provoque une unique violation → vérifier 409 + code métier

### 3.5 Lint
- [ ] flake8 + mypy sur les 2 fichiers

### 3.6 Auto-critique
- [ ] Vérifier que les messages génériques ne leak pas de constraint name
- [ ] Vérifier que le sanitizer `global_exception_handler` n'écrase plus les réponses DB (le handler asyncpg doit prendre le dessus)
- [ ] Vérifier que le format aligne avec `extractApiError` frontend

### 3.7 Commit local
- [ ] `feat(observability): map asyncpg errors + structured DB error handler`

---

## 4. RISQUES

### R-P4-1 : Ordre des handlers FastAPI
FastAPI exception_handlers prennent en compte MRO. `asyncpg.PostgresError` est un `Exception`, donc les deux handlers matchent. FastAPI va choisir le plus spécifique (PostgresError), mais **à confirmer** en test.

### R-P4-2 : Backward compat des catch locaux
Si un service catch déjà UniqueViolation et raise un `ValueError`, mon handler ne voit jamais l'erreur — c'est OK, les handlers locaux sont plus spécifiques. Mon handler est un **safety net**.

### R-P4-3 : QueryCanceledError distingue statement_timeout vs lock_timeout
Les deux timeouts lèvent `QueryCanceledError`. Pour distinguer, il faut parser le message. **Mitigation** : les traiter comme la même classe (`DB_STATEMENT_TIMEOUT`) et laisser le log serveur enregistrer le détail.

### R-P4-4 : asyncpg.InterfaceError hors hiérarchie PostgresError
`InterfaceError` (connection lost) n'hérite PAS de `PostgresError` — il faut un second handler ou étendre la capture.

---

## 5. FICHIERS IMPACTÉS

- `packages/backend/app/core/errors.py` — +9 codes + catalog
- `packages/backend/app/core/db_error_handler.py` — nouveau
- `packages/backend/app/main.py` — +1 handler enregistré
- `packages/backend/tests/unit/core/test_db_error_handler.py` — nouveau
