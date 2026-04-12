# Phase 6 — Plan détaillé : auto_classify feature

## Objectif

Quand l'utilisateur uploade un document sans spécifier `document_type_hint` ET qu'il a la permission `auto_classify` activée, le backend lance **en fire-and-forget** une classification Gemini qui tague automatiquement le document (`document_type`, `document_category`, `classification_method='gemini'`, `classification_confidence`).

Le flag `coming_soon` du catalog passe à `available` pour `auto_classify`, ce qui active le toggle dans `AgentSettingsPanel`.

## Contexte (exploration directe)

- **Upload endpoint** : `user_documents_routes.py:218-441`. Accepte `document_type_hint: Optional[str]`. Si `None`, défaut `"unknown"` (ligne 363). Aucun hook de classification existant.
- **Classifier existant** : `BatchDocumentClassifier.classify_documents(documents, workflow_code)` → `List[ClassificationResult]`. Retourne `document_type`, `confidence`, `person_name`, `identifier`. Utilise Gemini Flash.
- **`_get_known_document_types(workflow_code)`** : fallback vers `schema_loader.get_schema_keys()` si workflow inconnu — parfait pour vault générique.
- **BD `user_documents`** a déjà les colonnes `document_type`, `document_category`, `classification_method`, `classification_confidence`.
- **Permission check** : query simple `SELECT EXISTS FROM user_agent_permissions WHERE user_id=$1 AND permission_type='auto_classify' AND is_active=TRUE`.
- **Fire-and-forget pattern** : `asyncio.create_task(...)` + `db_pool = await get_db_pool()` (exemple lignes 1761-1772).
- **Audit** : `user_documents_repository.log_access()` avec `access_type='reclassify'` ou nouveau `auto_classify`.

## Architecture

### Flow

```
POST /user-documents/upload (document_type_hint=None)
   ↓
 Existing flow: validate, upload to Firebase, DB insert (doc_type='unknown'), log access
   ↓
 [NEW] check user_agent_permissions for auto_classify active
   ↓ (if yes)
 [NEW] asyncio.create_task(_auto_classify_background(doc_id, file_content, mime_type, file_name, user_id, pool))
   ↓
 Return 201 immediately
                                 ↓ (background task)
                            pool.acquire()
                                 ↓
                            BatchDocumentClassifier.classify_documents([{content, ...}], "VAULT")
                                 ↓
                            UPDATE user_documents SET document_type=..., document_category=..., 
                                                        classification_method='gemini',
                                                        classification_confidence=X
                                 WHERE id=$1 AND user_id=$2
                                 ↓
                            log_access(access_type='auto_classify')
```

### Principes
- **Opt-in strict** : pas de classification sans toggle actif (évite coûts Gemini 1M users)
- **Fire-and-forget** : l'utilisateur n'attend jamais Gemini (3-10s de latence)
- **OWASP A01** : check `user_id` dans l'UPDATE pour éviter cross-tenant write
- **Idempotency** : si le document a déjà un type non-`unknown`, le background task skip
- **Timeout** : task global 30s max (sinon Gemini stall → skip silencieux)
- **Coût** : 1 call Gemini Flash par upload opt-in → ~$0.0001/call, acceptable
- **Circuit breaker** : si classifier `enabled=False` (Vertex AI down), skip sans erreur

### Fichiers modifiés

| Fichier | Type |
|---|---|
| `packages/backend/app/modules/user_documents/services/auto_classify_service.py` | NOUVEAU — background task |
| `packages/backend/app/modules/user_documents/api/user_documents_routes.py` | M — hook dans upload endpoint |
| `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py` | M — catalog `auto_classify.status = 'available'` |
| `packages/backend/tests/unit/user_documents/test_auto_classify_service.py` | NOUVEAU — tests |

## Implémentation

### F1. `auto_classify_service.py` (nouveau)

```python
"""
Auto-classify background service (Phase 6).

When a user uploads a document to their vault WITHOUT specifying a
document_type_hint AND they have the `auto_classify` agent permission
active, the upload endpoint spawns a fire-and-forget background task
that calls the existing BatchDocumentClassifier (Gemini Flash vision)
to identify the document type and update the DB row.

Safety rails:
- Opt-in: requires explicit user_agent_permissions grant → no runaway
  Gemini costs at 1M users scale.
- OWASP A01: UPDATE is scoped by (id, user_id) to prevent cross-tenant
  writes if the background context is ever abused.
- Idempotent: if the document was re-classified or manually set before
  the task runs, we skip (don't overwrite user intent).
- Timeouts + error swallowing: the task must never crash the upload
  endpoint — all exceptions are logged and dropped.
"""
from __future__ import annotations
import asyncio
from typing import Optional
from uuid import UUID
from loguru import logger
import asyncpg


AUTO_CLASSIFY_TIMEOUT_SECONDS = 30


async def has_auto_classify_permission(db: asyncpg.Connection, user_id: UUID) -> bool:
    """Check if user has auto_classify permission granted and active."""
    return await db.fetchval(
        """
        SELECT EXISTS (
            SELECT 1 FROM user_agent_permissions
            WHERE user_id = $1::uuid
              AND permission_type = 'auto_classify'
              AND is_active = TRUE
        )
        """,
        user_id,
    )


async def auto_classify_background(
    doc_id: UUID,
    user_id: UUID,
    content: bytes,
    mime_type: str,
    file_name: str,
    db_pool: asyncpg.Pool,
) -> None:
    """Run Gemini classification on an uploaded document and persist result.

    This function is invoked via asyncio.create_task after a vault upload
    completes. It acquires its own DB connection from the pool because
    the request-scoped connection is gone by the time the task runs.

    Guarantees:
    - Never raises (all exceptions logged + swallowed).
    - Bounded by AUTO_CLASSIFY_TIMEOUT_SECONDS (hard cap via asyncio.wait_for).
    - Idempotent: skips if the document_type was changed between the
      upload completion and the task execution (user manually tagged it).
    """
    try:
        await asyncio.wait_for(
            _auto_classify_impl(doc_id, user_id, content, mime_type, file_name, db_pool),
            timeout=AUTO_CLASSIFY_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning(
            f"[AutoClassify] Timeout classifying doc={doc_id} after "
            f"{AUTO_CLASSIFY_TIMEOUT_SECONDS}s — skipping"
        )
    except Exception as exc:
        logger.warning(f"[AutoClassify] Background task failed for doc={doc_id}: {exc}")


async def _auto_classify_impl(
    doc_id: UUID,
    user_id: UUID,
    content: bytes,
    mime_type: str,
    file_name: str,
    db_pool: asyncpg.Pool,
) -> None:
    from app.modules.batch_requests.services.document_classifier import (
        batch_document_classifier,
    )

    if not getattr(batch_document_classifier, "enabled", False):
        logger.info(
            f"[AutoClassify] Classifier disabled (Vertex AI down) — skipping doc={doc_id}"
        )
        return

    # Call the existing classifier. "VAULT" triggers the fallback to
    # schema_loader.get_schema_keys() inside _get_known_document_types,
    # which returns ALL known document types (no workflow constraint).
    results = await batch_document_classifier.classify_documents(
        documents=[{
            "content": content,
            "mime_type": mime_type,
            "file_path": file_name,  # placeholder — not persisted
            "file_name": file_name,
        }],
        workflow_code="VAULT",
    )
    if not results:
        logger.warning(f"[AutoClassify] Empty result for doc={doc_id}")
        return

    result = results[0]
    if result.error or not result.document_type:
        logger.info(
            f"[AutoClassify] Classification failed or empty for doc={doc_id}: "
            f"error={result.error}"
        )
        return

    # Persist the classification — scoped by user_id for tenant safety.
    # Idempotency: only overwrite if the row is still marked 'unknown'
    # (user hasn't manually tagged it between upload and task execution).
    async with db_pool.acquire() as conn:
        category = _infer_category(result.document_type)
        updated = await conn.fetchval(
            """
            UPDATE user_documents
            SET document_type = $3,
                document_category = COALESCE($4, document_category),
                classification_method = 'gemini',
                classification_confidence = $5,
                updated_at = NOW()
            WHERE id = $1
              AND user_id = $2
              AND document_type = 'unknown'
            RETURNING id
            """,
            doc_id, user_id, result.document_type, category, result.confidence,
        )
        if not updated:
            logger.info(
                f"[AutoClassify] doc={doc_id} already tagged by user — skip overwrite"
            )
            return

        # Audit log
        try:
            await conn.execute(
                """
                INSERT INTO user_document_access_log
                    (document_id, accessed_by, access_type, access_context)
                VALUES ($1, $2, 'reclassify', 'auto_classify_agent')
                """,
                doc_id, user_id,
            )
        except Exception as audit_exc:
            logger.debug(f"[AutoClassify] Audit log failed (non-critical): {audit_exc}")

    logger.info(
        f"[AutoClassify] doc={doc_id} classified as '{result.document_type}' "
        f"(confidence={result.confidence:.2f})"
    )


def _infer_category(doc_type: str) -> Optional[str]:
    """Map a Gemini-classified document_type to a coarse category enum.

    Mirrors the `_infer_category` helper in user_documents_routes but kept
    private here to avoid a circular import from the routes module.
    """
    t = (doc_type or "").lower()
    if any(k in t for k in ("pasaporte", "dip", "nie", "nif", "identidad", "cedula")):
        return "identity"
    if any(k in t for k in ("vehicul", "carnet_conducir", "permis", "itv", "matric")):
        return "vehicle"
    if any(k in t for k in ("contrato", "acta", "certificado", "legaliza")):
        return "legal"
    if any(k in t for k in ("factura", "recibo", "nota_ingreso", "solvencia")):
        return "financial"
    return None
```

### F2. `user_documents_routes.py` — hook dans upload endpoint

Après le log d'accès (ligne 428) et avant le `return UploadResult(...)` :

```python
# --- Auto-classify hook (Phase 6) ---
# If the user uploaded without a type hint AND has the auto_classify
# permission active, spawn a fire-and-forget background task that calls
# Gemini to classify the document. Never blocks the upload response.
if not document_type_hint:
    try:
        from app.modules.user_documents.services.auto_classify_service import (
            has_auto_classify_permission,
            auto_classify_background,
        )
        if await has_auto_classify_permission(db, current_user.id):
            pool = await get_db_pool()
            asyncio.create_task(
                auto_classify_background(
                    doc_id=doc_id,
                    user_id=current_user.id,
                    content=file_content,
                    mime_type=mime_type,
                    file_name=file_name,
                    db_pool=pool,
                )
            )
            logger.info(
                f"[UserDocuments] Auto-classify task spawned for doc={doc_id}"
            )
    except Exception as exc:
        logger.debug(f"[UserDocuments] Auto-classify spawn failed (non-critical): {exc}")
```

Nécessite d'importer `asyncio` au top du fichier s'il n'y est pas déjà (vérifier avec `grep`).

### F3. `chatbot_tools_authenticated.py` — catalog update

Modifier l'entrée `auto_classify` dans `AGENT_PERMISSION_CATALOG` :

```python
{
    "key": "auto_classify",
    "status": "available",  # ← was "coming_soon"
    "tool_name": "auto_classify_on_upload",  # non-chat; upload-time hook
    "max_level": 2,
    "icon": "FolderOpen",
    "always_on": False,
},
```

### F4. Tests unitaires

`tests/unit/user_documents/test_auto_classify_service.py` :

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from app.modules.user_documents.services import auto_classify_service


class TestHasPermission:
    @pytest.mark.asyncio
    async def test_returns_true_when_row_exists(self):
        db = AsyncMock()
        db.fetchval = AsyncMock(return_value=True)
        result = await auto_classify_service.has_auto_classify_permission(db, uuid4())
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_missing(self):
        db = AsyncMock()
        db.fetchval = AsyncMock(return_value=False)
        result = await auto_classify_service.has_auto_classify_permission(db, uuid4())
        assert result is False


class TestInferCategory:
    def test_identity_documents(self):
        assert auto_classify_service._infer_category("pasaporte") == "identity"
        assert auto_classify_service._infer_category("DIP") == "identity"
        assert auto_classify_service._infer_category("nie_extranjero") == "identity"

    def test_vehicle_documents(self):
        assert auto_classify_service._infer_category("carnet_conducir") == "vehicle"
        assert auto_classify_service._infer_category("itv_certificate") == "vehicle"

    def test_legal_documents(self):
        assert auto_classify_service._infer_category("contrato_onrc") == "legal"
        assert auto_classify_service._infer_category("certificado_residencia") == "legal"

    def test_financial_documents(self):
        assert auto_classify_service._infer_category("solvencia") == "financial"
        assert auto_classify_service._infer_category("nota_ingreso") == "financial"

    def test_unknown_returns_none(self):
        assert auto_classify_service._infer_category("random_type") is None
        assert auto_classify_service._infer_category("") is None


class TestAutoClassifyBackground:
    @pytest.mark.asyncio
    async def test_classifier_disabled_skips(self):
        """If the classifier service is down, the task should skip silently."""
        pool = MagicMock()
        with patch(
            "app.modules.batch_requests.services.document_classifier.batch_document_classifier"
        ) as mock_cls:
            mock_cls.enabled = False
            # Should NOT raise
            await auto_classify_service.auto_classify_background(
                doc_id=uuid4(),
                user_id=uuid4(),
                content=b"dummy",
                mime_type="image/jpeg",
                file_name="test.jpg",
                db_pool=pool,
            )
            # classify_documents should NOT have been called
            mock_cls.classify_documents.assert_not_called()

    @pytest.mark.asyncio
    async def test_empty_result_is_swallowed(self):
        pool = MagicMock()
        with patch(
            "app.modules.batch_requests.services.document_classifier.batch_document_classifier"
        ) as mock_cls:
            mock_cls.enabled = True
            mock_cls.classify_documents = AsyncMock(return_value=[])
            await auto_classify_service.auto_classify_background(
                doc_id=uuid4(),
                user_id=uuid4(),
                content=b"dummy",
                mime_type="image/jpeg",
                file_name="test.jpg",
                db_pool=pool,
            )

    @pytest.mark.asyncio
    async def test_error_result_does_not_persist(self):
        pool = MagicMock()
        conn = AsyncMock()
        pool_ctx = MagicMock()
        pool_ctx.__aenter__ = AsyncMock(return_value=conn)
        pool_ctx.__aexit__ = AsyncMock(return_value=None)
        pool.acquire = MagicMock(return_value=pool_ctx)
        with patch(
            "app.modules.batch_requests.services.document_classifier.batch_document_classifier"
        ) as mock_cls:
            from app.modules.batch_requests.services.document_classifier import (
                ClassificationResult,
            )
            mock_cls.enabled = True
            mock_cls.classify_documents = AsyncMock(
                return_value=[
                    ClassificationResult(
                        file_path="x", file_name="x", mime_type="image/jpeg",
                        error="gemini_rate_limited",
                    )
                ]
            )
            await auto_classify_service.auto_classify_background(
                doc_id=uuid4(),
                user_id=uuid4(),
                content=b"dummy",
                mime_type="image/jpeg",
                file_name="test.jpg",
                db_pool=pool,
            )
            conn.execute.assert_not_awaited()
            conn.fetchval.assert_not_awaited()
```

## Checklist Phase 6

### Backend
- [ ] `auto_classify_service.py` créé
- [ ] `has_auto_classify_permission` query SELECT EXISTS
- [ ] `auto_classify_background` avec asyncio.wait_for timeout 30s
- [ ] `_auto_classify_impl` : classifier + UPDATE scoped par user_id + idempotency (WHERE document_type='unknown')
- [ ] `_infer_category` local helper (évite circular import)
- [ ] Audit via `user_document_access_log` access_type='reclassify'
- [ ] Upload endpoint : hook après log_access, spawn task seulement si hint absent + perm active
- [ ] `asyncio` import vérifié en top-level
- [ ] Catalog : `auto_classify.status = "available"`
- [ ] Python syntax OK

### Tests
- [ ] `tests/unit/user_documents/test_auto_classify_service.py` créé
- [ ] Test : permission true/false
- [ ] Test : _infer_category pour 4 catégories + fallback None
- [ ] Test : classifier disabled → skip
- [ ] Test : empty result → skip
- [ ] Test : error result → no persist
- [ ] `pytest tests/unit/user_documents/test_auto_classify_service.py -v` passe

### Test BD directe (règle apprise de P4 bug)
- [ ] INSERT manual dans user_agent_permissions avec auto_classify → SELECT confirme
- [ ] Simuler l'update UPDATE user_documents WHERE id=X AND user_id=Y AND document_type='unknown' → doit marcher

### Validation
- [ ] Python syntax OK (py_compile)
- [ ] Pytest passe
- [ ] Self-critique et fix
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| Gemini down/rate-limited | Circuit breaker via `enabled` flag + error swallowing dans background |
| Coût Gemini runaway | Opt-in strict (permission gate) + pas de retry automatique |
| Race condition : user tag manuellement pendant le task | Idempotency `WHERE document_type='unknown'` |
| Background task orphelin (serveur crash) | Task best-effort — pas de retry, cohérent avec le modèle fire-and-forget |
| Cross-tenant write via doc_id manipulation | UPDATE scopé `id=$1 AND user_id=$2` |
| Circular import classifier ↔ routes | Imports locaux dans les fonctions |
| File_content size in memory for large docs | Max 10 MB déjà validé dans l'upload endpoint |

## Ce qui N'EST PAS dans Phase 6

- Re-classification d'anciens documents (batch) — simple script à part
- UI notification "document classé automatiquement" — pas critique MVP
- Métriques Grafana des classifications — future
- Rate limit spécifique classifier (on s'appuie sur le rate limit upload 10/min/user)
