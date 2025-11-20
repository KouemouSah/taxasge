"""Payment API routes"""

from app.modules.payments.api.payment_routes import router as payment_router

__all__ = ["payment_router"]
