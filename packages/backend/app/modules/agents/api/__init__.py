"""Agent API routes"""

from app.modules.agents.api.agent_routes import router
from app.modules.agents.api.profile_routes import router as profile_router

__all__ = ["router", "profile_router"]
