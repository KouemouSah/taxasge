"""
Unit tests for the `suggest_appointment_slots` chatbot tool (Phase 7).

The tool is a read-only Level 2 capability: it resolves a workflow to an
entity, picks the best active location (honouring the user's preferred
city when set), then calls `appointment_service.get_available_slots` to
fetch 6 candidate slots.

We stub `appointment_service` via sys.modules injection (same approach
as the auto_classify tests in Phase 6) because importing the real module
pulls Vertex AI bindings that aren't available offline.
"""
from __future__ import annotations

import sys
import types
from dataclasses import dataclass
from datetime import date, time
from typing import List, Optional
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest


# ---------------------------------------------------------------------------
# sys.modules injection — must happen BEFORE importing the tool module
# ---------------------------------------------------------------------------

@dataclass
class _FakeAvailableSlot:
    slot_date: date
    slot_time: time
    location_name: str
    location_address: str
    city: str
    slots_remaining: int


class _FakeAppointmentService:
    _entity_code_for_workflow: Optional[str] = "CNEDOGE_PASAPORTE"
    _queued_slots: List[_FakeAvailableSlot] = []
    _raises_on_slots: bool = False

    async def get_entity_code_for_workflow(self, db, workflow_code):
        return self._entity_code_for_workflow

    async def get_available_slots(self, db, entity_location_id, from_date=None, limit=6):
        if self._raises_on_slots:
            raise RuntimeError("simulated slot query failure")
        return list(self._queued_slots)


_fake_service = _FakeAppointmentService()

_fake_module = types.ModuleType(
    "app.modules.service_requests.services.appointment_service"
)
_fake_module.appointment_service = _fake_service  # type: ignore[attr-defined]
_fake_module.AppointmentService = _FakeAppointmentService  # type: ignore[attr-defined]
sys.modules[
    "app.modules.service_requests.services.appointment_service"
] = _fake_module

from app.modules.chatbot.services import chatbot_tools_authenticated as tools  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_fake_service():
    _fake_service._entity_code_for_workflow = "CNEDOGE_PASAPORTE"
    _fake_service._queued_slots = []
    _fake_service._raises_on_slots = False
    yield
    _fake_service._entity_code_for_workflow = "CNEDOGE_PASAPORTE"
    _fake_service._queued_slots = []
    _fake_service._raises_on_slots = False


def _make_db(
    *,
    perm_allowed: bool,
    preferred_city: Optional[str] = None,
    location_row: Optional[dict] = None,
    fallback_location_row: Optional[dict] = None,
) -> AsyncMock:
    """Build an AsyncMock conn that threads the query call sequence.

    Sequence of calls inside `suggest_appointment_slots`:
    1. check_tool_level → fetchval(EXISTS ...) → perm_allowed
    2. check_tool_level success path → execute(UPDATE usage_count)
    3. SELECT preferred_city → fetchval
    4. SELECT el.id + ... (preferred_city filter) → fetchrow → location_row
    5. If not location_row: SELECT el.id + ... (fallback) → fetchrow → fallback
    """
    db = AsyncMock()
    db.fetchval = AsyncMock(side_effect=[perm_allowed, preferred_city])
    if fallback_location_row is not None:
        db.fetchrow = AsyncMock(side_effect=[location_row, fallback_location_row])
    else:
        db.fetchrow = AsyncMock(return_value=location_row)
    db.execute = AsyncMock()
    return db


class TestSuggestAppointmentSlots:
    @pytest.mark.asyncio
    async def test_requires_user_id(self):
        db = AsyncMock()
        result = await tools.suggest_appointment_slots(
            db, workflow_code="PASAPORTE_NUEVO"
        )
        assert "error" in result

    @pytest.mark.asyncio
    async def test_requires_workflow_code(self):
        db = AsyncMock()
        result = await tools.suggest_appointment_slots(db, user_id=str(uuid4()))
        assert "error" in result

    @pytest.mark.asyncio
    async def test_permission_denied(self):
        db = _make_db(perm_allowed=False)
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="PASAPORTE_NUEVO"
        )
        assert result["status"] == "permission_required"
        assert result["permission_type"] == "suggest_appointments"
        assert result["level"] == 2

    @pytest.mark.asyncio
    async def test_no_entity_for_workflow(self):
        _fake_service._entity_code_for_workflow = None
        db = _make_db(perm_allowed=True)
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="UNKNOWN_WORKFLOW"
        )
        assert result["status"] == "no_appointments"
        assert result["workflow_code"] == "UNKNOWN_WORKFLOW"

    @pytest.mark.asyncio
    async def test_no_location_returns_no_locations(self):
        db = _make_db(
            perm_allowed=True,
            preferred_city="Malabo",
            location_row=None,
            fallback_location_row=None,
        )
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="PASAPORTE_NUEVO"
        )
        assert result["status"] == "no_locations"
        assert result["entity_code"] == "CNEDOGE_PASAPORTE"

    @pytest.mark.asyncio
    async def test_preferred_city_uses_first_query(self):
        loc_id = uuid4()
        db = _make_db(
            perm_allowed=True,
            preferred_city="Malabo",
            location_row={
                "id": loc_id,
                "location_name": "CNEDOGE Malabo",
                "city": "Malabo",
                "location_address": "Malabo, Bioko Norte",
            },
        )
        _fake_service._queued_slots = [
            _FakeAvailableSlot(
                slot_date=date(2026, 4, 20),
                slot_time=time(9, 0),
                location_name="CNEDOGE Malabo",
                location_address="Malabo, Bioko Norte",
                city="Malabo",
                slots_remaining=5,
            )
        ]
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="PASAPORTE_NUEVO"
        )
        assert result["status"] == "suggested"
        assert result["city"] == "Malabo"
        assert result["count"] == 1
        assert result["suggested_slots"][0]["date"] == "2026-04-20"
        assert db.fetchrow.await_count == 1

    @pytest.mark.asyncio
    async def test_no_preferred_city_uses_fallback_query(self):
        loc_id = uuid4()
        db = _make_db(
            perm_allowed=True,
            preferred_city=None,
            location_row={
                "id": loc_id,
                "location_name": "CNEDOGE Bata",
                "city": "Bata",
                "location_address": "Bata, Litoral",
            },
        )
        _fake_service._queued_slots = [
            _FakeAvailableSlot(
                slot_date=date(2026, 4, 22),
                slot_time=time(10, 30),
                location_name="CNEDOGE Bata",
                location_address="Bata, Litoral",
                city="Bata",
                slots_remaining=3,
            )
        ]
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="PASAPORTE_NUEVO"
        )
        assert result["status"] == "suggested"
        assert result["city"] == "Bata"

    @pytest.mark.asyncio
    async def test_empty_slots_returns_no_slots(self):
        db = _make_db(
            perm_allowed=True,
            preferred_city="Malabo",
            location_row={
                "id": uuid4(),
                "location_name": "CNEDOGE Malabo",
                "city": "Malabo",
                "location_address": "Malabo",
            },
        )
        _fake_service._queued_slots = []
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="PASAPORTE_NUEVO"
        )
        assert result["status"] == "no_slots"
        assert "CNEDOGE Malabo" in result["message"]

    @pytest.mark.asyncio
    async def test_slot_query_exception_returns_error(self):
        db = _make_db(
            perm_allowed=True,
            preferred_city="Malabo",
            location_row={
                "id": uuid4(),
                "location_name": "CNEDOGE Malabo",
                "city": "Malabo",
                "location_address": "Malabo",
            },
        )
        _fake_service._raises_on_slots = True
        result = await tools.suggest_appointment_slots(
            db, user_id=str(uuid4()), workflow_code="PASAPORTE_NUEVO"
        )
        assert result["status"] == "error"
