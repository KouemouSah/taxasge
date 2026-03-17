"""Company API routes"""

from app.modules.companies.api.company_routes import router as company_router
from app.modules.companies.api.company_classification_routes import router as classification_router

# Include classification sub-router under the company router
company_router.include_router(classification_router)

__all__ = ["company_router"]
