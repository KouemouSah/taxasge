# Phase 5.5 — Plan détaillé : Restauration logique d'exécution N3 + tests

## Contexte

Phase 5 a livré toute l'infrastructure N3 (consent codes Redis + audit log + modal + endpoint) mais les fonctions `_submit_prepared_request_exec` et `_book_appointment_exec` retournent encore des **stubs** (`{status: "executed_stub"}`). Feature flag `FEATURE_EXECUTIVE_TOOLS=OFF`.

**Objectif Phase 5.5** : restaurer la vraie logique métier, ajouter des tests unitaires sur `executive_consent.py` (crypto/sécurité critique), garder le flag OFF jusqu'à validation staging utilisateur.

## Découvertes BD/code (direct)

1. **`wizard_session_service.prepare_for_payment(session_id, user_id, db)`** — signature IDENTIQUE à l'originale ✅ (vérifié ligne 1016)
2. **`wizard_session_service.initiate_payment(session_id, user_id, db, payment_method, ...)`** — signature compatible (params optionnels ajoutés après) ✅ (ligne 1528)
3. **`save_appointment_selection` N'EXISTE PLUS** — renommée en `save_appointment_data(session_id, user_id, appointment_data: Dict)` ligne 806. **Signature différente** : un dict au lieu de params séparés. Le dict contient `location_name`, `appointment_date`, `appointment_time`, `location_id`.
4. Source originale récupérée depuis commit `3b702166` (pre-Phase 4 deletion)

## Architecture de la restauration

### Le redeem-then-execute flow (Phase 5, inchangé)

```
1. First call (no confirmation_code)
   └─> issue_confirmation_code → Redis + audit log 'issued' → return confirmation_required
2. Frontend modal opens → user clicks Confirm → POST /chatbot/execute-confirmed
3. Backend endpoint probe-reads Redis → dispatch via CHATBOT_AUTH_FUNCTION_MAP
4. Tool called with confirmation_code in kwargs
   └─> redeem_confirmation_code → verify args_hash → DELETE Redis → audit 'redeemed'
   └─> call _submit_prepared_request_exec(db, args) ← **PHASE 5.5: restore here**
5. Return executed result → pushed as assistant message (Phase 5 hotfix)
```

### Principes

- **Les stubs retournent déjà `executed_stub`** → je remplace uniquement le corps des `_exec` helpers, pas le flow
- **Pas de check_tool_level dans les _exec** — le redeem l'a déjà fait (single-use)
- **Exception handling** : `record_execution_failure` déjà wired par `submit_prepared_request` / `book_appointment` — propage juste les exceptions
- **Pas de changement côté consent service** (executive_consent.py reste tel quel)

## Fichiers modifiés

### F1. `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py`

**`_submit_prepared_request_exec`** — restauration (code adapté de `3b702166`)

```python
async def _submit_prepared_request_exec(db, args: dict) -> dict:
    """Real execution logic for submit_prepared_request.

    Called from submit_prepared_request AFTER the confirmation_code has
    been redeemed (single-use Redis delete + audit 'redeemed'). This is
    the original pre-Phase 4 logic restored from git commit 3b702166.
    """
    from app.modules.service_requests.services.wizard_session_service import (
        wizard_session_service,
    )
    from uuid import UUID

    user_id = args.get("user_id", "")
    session_id = args.get("session_id", "")
    payment_method = args.get("payment_method", "cash")

    if not user_id or not session_id:
        return {"status": "error", "message": "Se requiere session_id"}

    # Step 1: Prepare for payment (validate + tariff calculation, no DB writes)
    prep_result = await wizard_session_service.prepare_for_payment(
        session_id=session_id,
        user_id=UUID(user_id),
        db=db,
    )

    if not getattr(prep_result, "ready_for_payment", False):
        errors = getattr(prep_result, "errors", [])
        missing = getattr(prep_result, "missing_documents", [])
        return {
            "status": "not_ready",
            "message": (
                f"La solicitud no esta lista para envio. "
                f"{len(errors)} errores, {len(missing)} documentos faltantes."
            ),
            "errors": errors[:5],
            "missing_documents": missing[:5],
        }

    total_amount = getattr(prep_result, "total_amount", 0)

    # Step 2: Atomic persist + payment initiation
    pay_result = await wizard_session_service.initiate_payment(
        session_id=session_id,
        user_id=UUID(user_id),
        db=db,
        payment_method=payment_method,
    )

    if not getattr(pay_result, "success", False):
        return {
            "status": "failed",
            "message": (
                f"Error al enviar: "
                f"{getattr(pay_result, 'error', 'Error desconocido')}"
            ),
        }

    service_request_id = getattr(pay_result, "service_request_id", "")
    reference = getattr(pay_result, "reference", "")
    return {
        "status": "submitted",
        "service_request_id": str(service_request_id),
        "reference": reference,
        "payment_status": getattr(pay_result, "payment_status", ""),
        "total_amount": total_amount,
        "redirect_url": getattr(pay_result, "redirect_url", None),
        "message": (
            f"Solicitud enviada exitosamente. Referencia: {reference or 'N/A'}. "
            f"Monto: {total_amount} XAF."
        ),
    }
```

**`_book_appointment_exec`** — adaptation à la nouvelle API `save_appointment_data`

```python
async def _book_appointment_exec(db, args: dict) -> dict:
    """Real execution logic for book_appointment.

    Adapted from the pre-Phase 4 code to use the current service API:
    `save_appointment_data(session_id, user_id, appointment_data_dict)`
    instead of the obsolete `save_appointment_selection(...)` signature.

    Note: this saves the user's appointment CHOICE in the wizard session
    cache. The actual slot hold is created atomically during payment
    (initiate_payment), per the current appointment architecture. If the
    user then submits the request via submit_prepared_request, the slot
    is locked there.
    """
    from app.modules.service_requests.services.wizard_session_service import (
        wizard_session_service,
    )
    from uuid import UUID
    from datetime import date as date_type, time as time_type

    user_id = args.get("user_id", "")
    session_id = args.get("session_id", "")
    location_id = args.get("location_id", "")
    appointment_date_str = args.get("appointment_date", "")
    appointment_time_str = args.get("appointment_time", "")
    location_name = args.get("location_name", "")

    if not user_id or not session_id or not location_id or not appointment_date_str:
        return {
            "status": "error",
            "message": "Se requiere session_id, location_id y appointment_date",
        }

    try:
        appt_date = date_type.fromisoformat(appointment_date_str)
        appt_time = (
            time_type.fromisoformat(appointment_time_str)
            if appointment_time_str
            else time_type(8, 0)
        )
    except ValueError as exc:
        return {
            "status": "error",
            "message": f"Formato de fecha/hora invalido: {exc}",
        }

    appointment_data = {
        "location_id": location_id,
        "location_name": location_name,
        "appointment_date": str(appt_date),
        "appointment_time": str(appt_time),
    }

    await wizard_session_service.save_appointment_data(
        session_id=session_id,
        user_id=UUID(user_id),
        appointment_data=appointment_data,
    )

    return {
        "status": "booked",
        "appointment_date": str(appt_date),
        "appointment_time": str(appt_time),
        "location_id": location_id,
        "message": (
            f"Cita seleccionada para el {appt_date} a las {appt_time}. "
            "El cupo se confirmará atómicamente al iniciar el pago."
        ),
    }
```

### F2. `packages/backend/tests/unit/chatbot/test_executive_consent.py` — NOUVEAU

Tests unitaires **critiques** (sécurité crypto) :

```python
"""
Unit tests for executive_consent service — crypto/security critical.

Tests cover:
- Canonicalization stability (same input → same hash)
- Canonicalization excludes user_id + confirmation_code correctly
- Hash code SHA-256 round-trip
- Single-use redemption (double-redeem fails)
- Args hash tamper detection (modify args between issue and redeem)
- Rate limit enforcement (6th pending code rejected)
- Tool allowlist (unknown tools rejected at issuance)
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.modules.chatbot.services import executive_consent


class TestCanonicalizeArgs:
    def test_excludes_user_id_and_confirmation_code(self):
        args = {
            "user_id": "abc",
            "confirmation_code": "xyz",
            "session_id": "s1",
            "payment_method": "cash",
        }
        canon = executive_consent.canonicalize_args(args)
        assert "user_id" not in canon
        assert "confirmation_code" not in canon
        assert "session_id" in canon
        assert "payment_method" in canon

    def test_deterministic(self):
        args1 = {"b": 1, "a": 2, "session_id": "s"}
        args2 = {"a": 2, "session_id": "s", "b": 1}
        assert executive_consent.canonicalize_args(args1) == executive_consent.canonicalize_args(args2)

    def test_hash_stability(self):
        args = {"session_id": "s1", "payment_method": "cash"}
        h1 = executive_consent.hash_args(args)
        h2 = executive_consent.hash_args(args)
        assert h1 == h2
        assert len(h1) == 64  # SHA-256 hex digest

    def test_different_args_produce_different_hashes(self):
        a = executive_consent.hash_args({"session_id": "s1"})
        b = executive_consent.hash_args({"session_id": "s2"})
        assert a != b


class TestHashCode:
    def test_sha256_hex_length(self):
        h = executive_consent.hash_code("some-random-code")
        assert len(h) == 64


class TestIssueRedeem:
    @pytest.mark.asyncio
    async def test_unknown_tool_rejected(self):
        db = AsyncMock()
        code, err = await executive_consent.issue_confirmation_code(
            db, "user-1", "malicious_tool", {}, "summary"
        )
        assert code is None
        assert err == "executive.tool_not_allowed"

    @pytest.mark.asyncio
    async def test_issue_stores_payload_in_cache(self):
        db = AsyncMock()
        with patch(
            "app.modules.chatbot.services.executive_consent.check_rate_limit",
            new=AsyncMock(return_value=(True, 10)),
        ), patch(
            "app.modules.chatbot.services.executive_consent.get_cache"
        ) as mock_cache_fn:
            cache = MagicMock()
            cache.set = AsyncMock()
            mock_cache_fn.return_value = cache
            code, err = await executive_consent.issue_confirmation_code(
                db, "user-1", "submit_prepared_request", {"session_id": "s1"}, "sum"
            )
            assert err is None
            assert code is not None and len(code) > 20  # token_urlsafe(24)
            cache.set.assert_awaited_once()
            # Extract the stored payload and verify args_hash matches
            stored_key, stored_value = cache.set.call_args.args[:2]
            assert stored_key.startswith("agent:exec_consent:user-1:")
            assert stored_value["tool"] == "submit_prepared_request"
            assert stored_value["args_hash"] == executive_consent.hash_args(
                {"session_id": "s1"}
            )

    @pytest.mark.asyncio
    async def test_redeem_deletes_key_on_success(self):
        db = AsyncMock()
        args = {"session_id": "s1"}
        cache = MagicMock()
        cache.get = AsyncMock(
            return_value={
                "tool": "submit_prepared_request",
                "args": args,
                "args_hash": executive_consent.hash_args(args),
                "summary": "sum",
            }
        )
        cache.delete = AsyncMock()
        with patch(
            "app.modules.chatbot.services.executive_consent.get_cache",
            return_value=cache,
        ):
            payload, err = await executive_consent.redeem_confirmation_code(
                db, "user-1", "some-code"
            )
            assert err is None
            assert payload is not None
            cache.delete.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_redeem_fails_on_missing_key(self):
        db = AsyncMock()
        cache = MagicMock()
        cache.get = AsyncMock(return_value=None)
        with patch(
            "app.modules.chatbot.services.executive_consent.get_cache",
            return_value=cache,
        ):
            payload, err = await executive_consent.redeem_confirmation_code(
                db, "user-1", "some-code"
            )
            assert payload is None
            assert err == "executive.code_expired_or_invalid"

    @pytest.mark.asyncio
    async def test_redeem_detects_args_tampering(self):
        """If the cached args have been tampered with (hash mismatch),
        redemption must fail with invalid_args."""
        db = AsyncMock()
        # Store args with a WRONG pre-computed hash (simulates tampering)
        tampered_payload = {
            "tool": "submit_prepared_request",
            "args": {"session_id": "s1"},
            "args_hash": "wrong_hash_does_not_match_args",
            "summary": "sum",
        }
        cache = MagicMock()
        cache.get = AsyncMock(return_value=tampered_payload)
        cache.delete = AsyncMock()
        with patch(
            "app.modules.chatbot.services.executive_consent.get_cache",
            return_value=cache,
        ):
            payload, err = await executive_consent.redeem_confirmation_code(
                db, "user-1", "some-code"
            )
            assert payload is None
            assert err == "executive.invalid_args"
            # Tampered case must NOT delete the key (not consumed)
            cache.delete.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_rate_limit_blocks_issuance(self):
        db = AsyncMock()
        with patch(
            "app.modules.chatbot.services.executive_consent.check_rate_limit",
            new=AsyncMock(return_value=(False, 0)),
        ):
            code, err = await executive_consent.issue_confirmation_code(
                db, "user-1", "submit_prepared_request", {}, "sum"
            )
            assert code is None
            assert err == "executive.rate_limited"
```

### Feature flag

Reste **OFF par défaut**. L'utilisateur flippe `FEATURE_EXECUTIVE_TOOLS=true` en staging pour tester, puis valide, puis prod. Cette phase ne touche pas le flag.

## Checklist Phase 5.5

### Backend restoration
- [x] `_submit_prepared_request_exec` : logique complète restaurée depuis 3b702166
- [x] `_book_appointment_exec` : adaptée à `save_appointment_data` (API actuelle, nouveau signature dict)
- [x] Imports locaux dans les fonctions (évite circular imports)
- [x] Python syntax OK (`py_compile`)
- [x] Bonus : fix `LanguageCode.ES` → `LanguageCode.SPANISH` dans `chatbot_routes.py` (erreur Phase 5 repérée par les tests)

### Tests unitaires
- [x] `tests/unit/chatbot/__init__.py` créé
- [x] `tests/unit/chatbot/test_executive_consent.py` avec **15 tests**
- [x] Canonicalize : exclude user_id/code, deterministic, serializes dates/UUIDs
- [x] Hash stability : deterministic, SHA-256 length, user_id excluded from hash
- [x] Issue : unknown tool rejected, rate limit blocks, stores payload + args_hash
- [x] Redeem : missing key fails, success deletes, tamper detection (args_hash mismatch NO delete), double-redeem impossible
- [x] `pytest tests/unit/chatbot/test_executive_consent.py -v` → **15 passed**

### Validation
- [x] Python syntax OK sur 2 fichiers backend
- [x] Frontend type-check passe (sanity check post-changes)
- [x] Critique post-implémentation : tests unitaires couvrent les 4 scénarios d'attaque (unknown tool, rate limit, tamper, replay). Happy path validé par structure payload. Flag reste OFF — aucune exécution réelle déclenchée sans staging.
- [ ] Commit local
- [ ] **Flag reste OFF** — activation par user en staging

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| API `prepare_for_payment` a dérivé silencieusement depuis 3b702166 | Grep direct confirme la signature identique |
| `save_appointment_data` dict keys diffèrent de ce qu'attend `_persist_session_data` | Dict keys alignées sur ce que le service existant utilise (location_id, location_name, appointment_date, appointment_time) |
| Tests async nécessitent `pytest-asyncio` | À vérifier dans `requirements.txt` — sinon ajouter `pytest.mark.asyncio` markers via plugin |
| Circular imports wizard_session_service → chatbot_tools | Imports locaux dans les fonctions, pas au top-level |
| `WizardPreparePaymentResponse` / `WizardInitiatePaymentResponse` attributs changés | `getattr` avec default → défensif contre drift |

## Ce qui N'EST PAS dans Phase 5.5

- Activation du flag (user-driven en staging)
- UI historique exécutions dans `AgentSettingsPanel` (décoration, pas critique)
- Test E2E Playwright du flow complet (manuel staging)
- Monitoring/métriques Grafana

## Estimation

- Restore `_submit_prepared_request_exec` : 10 min
- Adapt `_book_appointment_exec` : 10 min
- Tests unitaires executive_consent : 30 min
- pytest + fixups : 10 min
- Commit : 2 min
- **Total : ~1h**
