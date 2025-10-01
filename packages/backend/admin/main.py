"""
TaxasGE Admin Dashboard - Integrated FastAPI Application
Dashboard administratif intégré dans le backend principal
"""

from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pathlib import Path
import os
from typing import Optional

# Import admin routes
from .routes.fiscal_services import admin_fiscal_router
from .routes.users import admin_users_router
from .routes.analytics import admin_analytics_router
from .routes.settings import admin_settings_router

# Security
from ..gateway.security.jwt_manager import JWTManager
from ..gateway.security.permissions import PermissionManager

# Base paths
ADMIN_DIR = Path(__file__).parent
TEMPLATES_DIR = ADMIN_DIR / "templates"
STATIC_DIR = ADMIN_DIR / "static"

# FastAPI Admin App
admin_app = FastAPI(
    title="TaxasGE Admin Dashboard",
    description="🏛️ Dashboard administratif intégré pour TaxasGE",
    version="1.0.0",
    docs_url="/admin/docs",
    redoc_url="/admin/redoc",
    openapi_url="/admin/openapi.json"
)

# Static files and templates
admin_app.mount("/admin/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Security dependencies
security = HTTPBearer()
jwt_manager = JWTManager()
permission_manager = PermissionManager()

async def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Vérifier que l'utilisateur est admin authentifié"""
    try:
        payload = jwt_manager.verify_token(credentials.credentials)
        user = payload.get("user")

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide"
            )

        # Vérifier permissions admin
        if not permission_manager.has_permission(user, "admin:access"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès administrateur requis"
            )

        return user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification échouée"
        )

# === ROUTES PRINCIPALES ADMIN ===

@admin_app.get("/admin", response_class=HTMLResponse)
@admin_app.get("/admin/", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    current_user: dict = Depends(get_current_admin_user)
):
    """Page principale du dashboard admin"""
    context = {
        "request": request,
        "user": current_user,
        "page_title": "Dashboard",
        "stats": {
            "total_services": 547,
            "total_users": 1250,
            "monthly_transactions": 3420,
            "revenue_current_month": 125_000_000  # XAF
        }
    }
    return templates.TemplateResponse("dashboard.html", context)

@admin_app.get("/admin/login", response_class=HTMLResponse)
async def admin_login_page(request: Request):
    """Page de connexion admin"""
    return templates.TemplateResponse("login.html", {"request": request})

@admin_app.post("/admin/login")
async def admin_login(request: Request):
    """Traitement connexion admin"""
    # Logic will be handled by main gateway auth
    return RedirectResponse(url="/admin/", status_code=302)

@admin_app.get("/admin/logout")
async def admin_logout():
    """Déconnexion admin"""
    response = RedirectResponse(url="/admin/login", status_code=302)
    response.delete_cookie("access_token")
    return response

# === INCLUSION DES SOUS-ROUTERS ===

# Services fiscaux
admin_app.include_router(
    admin_fiscal_router,
    prefix="/admin/fiscal-services",
    tags=["Admin - Services Fiscaux"],
    dependencies=[Depends(get_current_admin_user)]
)

# Gestion utilisateurs
admin_app.include_router(
    admin_users_router,
    prefix="/admin/users",
    tags=["Admin - Utilisateurs"],
    dependencies=[Depends(get_current_admin_user)]
)

# Analytics et rapports
admin_app.include_router(
    admin_analytics_router,
    prefix="/admin/analytics",
    tags=["Admin - Analytics"],
    dependencies=[Depends(get_current_admin_user)]
)

# Configuration système
admin_app.include_router(
    admin_settings_router,
    prefix="/admin/settings",
    tags=["Admin - Configuration"],
    dependencies=[Depends(get_current_admin_user)]
)

# === ERROR HANDLERS ===

@admin_app.exception_handler(HTTPException)
async def admin_http_exception_handler(request: Request, exc: HTTPException):
    """Gestionnaire d'erreurs admin avec templates"""
    if exc.status_code == 401:
        return RedirectResponse(url="/admin/login")

    return templates.TemplateResponse(
        "error.html",
        {
            "request": request,
            "error_code": exc.status_code,
            "error_message": exc.detail
        },
        status_code=exc.status_code
    )

@admin_app.exception_handler(Exception)
async def admin_general_exception_handler(request: Request, exc: Exception):
    """Gestionnaire d'erreurs générales admin"""
    return templates.TemplateResponse(
        "error.html",
        {
            "request": request,
            "error_code": 500,
            "error_message": "Erreur interne du serveur"
        },
        status_code=500
    )

# === MIDDLEWARE ADMIN ===

@admin_app.middleware("http")
async def admin_security_middleware(request: Request, call_next):
    """Middleware de sécurité spécifique admin"""
    # Ajouter headers de sécurité
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response