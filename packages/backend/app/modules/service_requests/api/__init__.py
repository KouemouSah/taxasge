# API exports
from .routes import router
from .agent_routes import router as agent_router
from .admin_routes import router as admin_router
from .appointment_routes import router as appointment_router

__all__ = ["router", "agent_router", "admin_router", "appointment_router"]
