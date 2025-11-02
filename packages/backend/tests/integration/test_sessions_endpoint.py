"""
Integration tests for Sessions Endpoint (TASK-M01-008)
Tests for GET /auth/sessions endpoint

COVERAGE:
- GET /auth/sessions endpoint
- Authentication required
- Sessions list response
- Current session marking
"""

import pytest
from fastapi import status
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime, timedelta

from app.models.auth_models import SessionResponse, SessionStatus


@pytest.fixture
def mock_user():
    """Fixture: Mock authenticated user"""
    return {
        "sub": str(uuid4()),
        "email": "test@example.com",
        "role": "citizen",
    }


@pytest.fixture
def mock_auth_headers():
    """Fixture: Mock authorization headers"""
    return {"Authorization": "Bearer mock_token_12345"}


@pytest.fixture
def mock_active_sessions():
    """Fixture: Mock active sessions list"""
    user_id = str(uuid4())
    now = datetime.utcnow()

    return [
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "access_token": "mock_token_12345",  # Current session
            "device": "Desktop",
            "browser": "Chrome",
            "location": "192.168.1.1",
            "ip_address": "192.168.1.1",
            "created_at": now - timedelta(hours=2),
            "last_activity": now - timedelta(minutes=5),
            "expires_at": now + timedelta(hours=1),
            "is_current": True,
        },
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "access_token": "other_token_456",
            "device": "Mobile",
            "browser": "Safari",
            "location": "192.168.1.2",
            "ip_address": "192.168.1.2",
            "created_at": now - timedelta(days=1),
            "last_activity": now - timedelta(hours=1),
            "expires_at": now + timedelta(days=6),
            "is_current": False,
        },
    ]


class TestGetSessionsEndpoint:
    """Integration tests for GET /auth/sessions endpoint"""

    @pytest.mark.asyncio
    async def test_get_sessions_success(
        self, mock_user, mock_auth_headers, mock_active_sessions
    ):
        """Test: Successfully retrieve active sessions list"""
        from app.main import app

        # Mock dependencies
        with patch('app.api.v1.auth.get_current_user', return_value=mock_user):
            with patch('app.services.session_service.SessionService.get_active_sessions',
                      new_callable=AsyncMock, return_value=mock_active_sessions):

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(
                        "/api/v1/auth/sessions",
                        headers=mock_auth_headers
                    )

                    assert response.status_code == status.HTTP_200_OK

                    data = response.json()
                    assert "sessions" in data
                    assert "total" in data
                    assert data["total"] == 2
                    assert len(data["sessions"]) == 2

                    # Verify session structure
                    session = data["sessions"][0]
                    assert "id" in session
                    assert "device" in session
                    assert "browser" in session
                    assert "location" in session
                    assert "created_at" in session
                    assert "last_activity" in session
                    assert "expires_at" in session
                    assert "is_current" in session

                    # Verify current session is marked
                    assert data["sessions"][0]["is_current"] is True
                    assert data["sessions"][1]["is_current"] is False

    @pytest.mark.asyncio
    async def test_get_sessions_unauthenticated(self):
        """Test: Unauthenticated request returns 401"""
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/sessions"
                # No auth headers
            )

            # Should fail authentication
            assert response.status_code in [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]

    @pytest.mark.asyncio
    async def test_get_sessions_invalid_token(self):
        """Test: Invalid token returns 401"""
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/sessions",
                headers={"Authorization": "Bearer invalid_token_xyz"}
            )

            # Should fail authentication
            assert response.status_code in [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]

    @pytest.mark.asyncio
    async def test_get_sessions_empty_list(
        self, mock_user, mock_auth_headers
    ):
        """Test: Returns empty list when no active sessions"""
        from app.main import app

        # Mock dependencies
        with patch('app.api.v1.auth.get_current_user', return_value=mock_user):
            with patch('app.services.session_service.SessionService.get_active_sessions',
                      new_callable=AsyncMock, return_value=[]):

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(
                        "/api/v1/auth/sessions",
                        headers=mock_auth_headers
                    )

                    assert response.status_code == status.HTTP_200_OK

                    data = response.json()
                    assert data["sessions"] == []
                    assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_get_sessions_real_db(self):
        """Test: Real database test with valid auth token (SKIP - requires setup)"""
        # This test requires a real authenticated user in Supabase
        pytest.skip(
            "Real DB test - requires valid auth token from test user. "
            "TODO: Setup test user in Supabase with known credentials and active sessions"
        )

    @pytest.mark.asyncio
    async def test_get_sessions_service_error(
        self, mock_user, mock_auth_headers
    ):
        """Test: Service error returns 500"""
        from app.main import app

        # Mock service to raise exception
        with patch('app.api.v1.auth.get_current_user', return_value=mock_user):
            with patch('app.services.session_service.SessionService.get_active_sessions',
                      new_callable=AsyncMock, side_effect=Exception("Database connection error")):

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(
                        "/api/v1/auth/sessions",
                        headers=mock_auth_headers
                    )

                    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
                    assert "failed to retrieve sessions" in response.json()["detail"].lower()


class TestSessionsEndpointMetadata:
    """Integration tests for session metadata enrichment"""

    @pytest.mark.asyncio
    async def test_sessions_device_types(
        self, mock_user, mock_auth_headers
    ):
        """Test: Different device types are correctly identified"""
        from app.main import app

        user_id = mock_user["sub"]
        now = datetime.utcnow()

        mock_sessions = [
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "access_token": "token_1",
                "device": "Desktop",
                "browser": "Chrome",
                "location": "192.168.1.1",
                "ip_address": "192.168.1.1",
                "created_at": now,
                "last_activity": now,
                "expires_at": now + timedelta(hours=1),
                "is_current": False,
            },
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "access_token": "token_2",
                "device": "Mobile",
                "browser": "Safari",
                "location": "192.168.1.2",
                "ip_address": "192.168.1.2",
                "created_at": now,
                "last_activity": now,
                "expires_at": now + timedelta(hours=1),
                "is_current": False,
            },
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "access_token": "token_3",
                "device": "Tablet",
                "browser": "Safari",
                "location": "192.168.1.3",
                "ip_address": "192.168.1.3",
                "created_at": now,
                "last_activity": now,
                "expires_at": now + timedelta(hours=1),
                "is_current": False,
            },
        ]

        with patch('app.api.v1.auth.get_current_user', return_value=mock_user):
            with patch('app.services.session_service.SessionService.get_active_sessions',
                      new_callable=AsyncMock, return_value=mock_sessions):

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(
                        "/api/v1/auth/sessions",
                        headers=mock_auth_headers
                    )

                    assert response.status_code == status.HTTP_200_OK

                    data = response.json()
                    devices = [session["device"] for session in data["sessions"]]

                    assert "Desktop" in devices
                    assert "Mobile" in devices
                    assert "Tablet" in devices

    @pytest.mark.asyncio
    async def test_sessions_browser_types(
        self, mock_user, mock_auth_headers
    ):
        """Test: Different browser types are correctly identified"""
        from app.main import app

        user_id = mock_user["sub"]
        now = datetime.utcnow()

        mock_sessions = [
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "access_token": "token_1",
                "device": "Desktop",
                "browser": "Chrome",
                "location": "192.168.1.1",
                "ip_address": "192.168.1.1",
                "created_at": now,
                "last_activity": now,
                "expires_at": now + timedelta(hours=1),
                "is_current": False,
            },
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "access_token": "token_2",
                "device": "Desktop",
                "browser": "Firefox",
                "location": "192.168.1.2",
                "ip_address": "192.168.1.2",
                "created_at": now,
                "last_activity": now,
                "expires_at": now + timedelta(hours=1),
                "is_current": False,
            },
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "access_token": "token_3",
                "device": "Desktop",
                "browser": "Edge",
                "location": "192.168.1.3",
                "ip_address": "192.168.1.3",
                "created_at": now,
                "last_activity": now,
                "expires_at": now + timedelta(hours=1),
                "is_current": False,
            },
        ]

        with patch('app.api.v1.auth.get_current_user', return_value=mock_user):
            with patch('app.services.session_service.SessionService.get_active_sessions',
                      new_callable=AsyncMock, return_value=mock_sessions):

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(
                        "/api/v1/auth/sessions",
                        headers=mock_auth_headers
                    )

                    assert response.status_code == status.HTTP_200_OK

                    data = response.json()
                    browsers = [session["browser"] for session in data["sessions"]]

                    assert "Chrome" in browsers
                    assert "Firefox" in browsers
                    assert "Edge" in browsers
