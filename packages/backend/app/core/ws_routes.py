"""
WebSocket Routes — Admin real-time notifications

Endpoint: ws://host/ws/admin?token=<jwt>
Only admin/supervisor users can connect. Broadcasts RBAC events in real-time.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from loguru import logger

from app.core.ws_manager import ws_manager

router = APIRouter()


@router.websocket("/ws/admin")
async def ws_admin_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    WebSocket endpoint for admin real-time notifications.

    Query params:
        token: JWT access token (same as Authorization header)

    Events broadcasted:
        - rbac.permission.granted/revoked
        - rbac.role.updated/created/deleted
        - rbac.user.role_changed
        - rbac.agent.deactivated
    """
    # Validate JWT token
    user_id = None
    try:
        from app.modules.auth.services.auth_service import get_auth_service

        auth_service = get_auth_service()
        user = await auth_service.validate_access_token(token)
        if not user:
            await websocket.close(code=4001, reason="invalid_token")
            return

        user_id = str(user.get("id") or user.get("sub", ""))
        role = user.get("role", user.get("role_code", "")) or ""

        # Only admin/supervisor roles can connect
        if not (role.startswith("admin") or role == "supervisor"):
            await websocket.close(code=4003, reason="admin_only")
            return

    except Exception as e:
        logger.warning(f"WS auth failed: {e}")
        await websocket.close(code=4001, reason="auth_error")
        return

    # Accept and manage connection
    await ws_manager.connect(websocket, user_id)

    try:
        # Keep connection alive — client sends pings, we echo pongs
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.debug(f"WS error for {user_id}: {e}")
    finally:
        await ws_manager.disconnect(user_id)
