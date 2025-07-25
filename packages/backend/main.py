"""
🚀 TaxasGE Backend API - Point d'entrée principal
FastAPI application avec intégration Firebase Functions et Supabase
Guinée Équatoriale - Gestion Fiscale

Author: KOUEMOU SAH Jean Emac
Compatible: Local Development, Firebase Functions, CI/CD
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

# FastAPI Core
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# Firebase Functions compatibility
import functions_framework

# Configuration
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================================
# CONFIGURATION & SETUP
# ============================================================================

# Environment detection
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# CORS origins based on environment
CORS_ORIGINS = {
    "development": [
        "http://localhost:3000",      # React Native Metro
        "http://localhost:8000",      # FastAPI local
        "http://localhost:8081",      # Expo Go
        "https://taxasge-dev.web.app" # Firebase dev
    ],
    "production": [
        "https://taxasge.app",        # Production domain
        "https://taxasge-prod.web.app" # Firebase prod
    ]
}

# ============================================================================
# APPLICATION LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logging.info(f"🚀 TaxasGE API starting up - Environment: {ENVIRONMENT}")
    
    # Initialize services here (database, Firebase, etc.)
    # await initialize_database()
    # await initialize_firebase()
    
    logging.info("✅ TaxasGE API startup completed")
    
    yield
    
    # Shutdown
    logging.info("🔄 TaxasGE API shutting down...")
    
    # Cleanup services here
    # await cleanup_database()
    # await cleanup_firebase()
    
    logging.info("✅ TaxasGE API shutdown completed")

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="TaxasGE API",
    description="API Backend pour l'application TaxasGE - Gestion fiscale Guinée Équatoriale",
    version="1.0.0",
    debug=DEBUG,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
    openapi_url="/openapi.json" if DEBUG else None,
    lifespan=lifespan
)

# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.get(ENVIRONMENT, CORS_ORIGINS["development"]),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/")
async def root() -> Dict[str, Any]:
    """
    Point d'entrée racine de l'API
    Returns basic API information
    """
    return {
        "message": "🚀 TaxasGE API",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "status": "operational",
        "description": "API de gestion fiscale pour la Guinée Équatoriale",
        "docs": "/docs" if DEBUG else "Documentation disponible en développement",
        "endpoints": {
            "health": "/health",
            "api_v1": "/api/v1/",
            "docs": "/docs" if DEBUG else None
        }
    }

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Endpoint de vérification de santé de l'API
    Used by monitoring systems and load balancers
    """
    import time
    import sys
    
    return {
        "status": "healthy",
        "service": "taxasge-backend",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "timestamp": int(time.time()),
        "python_version": sys.version,
        "debug_mode": DEBUG,
        "checks": {
            "api": "ok",
            "database": "pending",  # Will be updated when DB is connected
            "firebase": "pending"   # Will be updated when Firebase is connected
        }
    }

@app.get("/api/v1/")
async def api_v1_root() -> Dict[str, Any]:
    """
    API v1 entry point
    """
    return {
        "message": "TaxasGE API v1",
        "version": "1.0.0",
        "available_endpoints": {
            "auth": "/api/v1/auth/",
            "taxes": "/api/v1/taxes/",
            "users": "/api/v1/users/",
            "declarations": "/api/v1/declarations/",
            "payments": "/api/v1/payments/",
            "ai": "/api/v1/ai/"
        },
        "documentation": "/docs" if DEBUG else "Contact admin for API documentation"
    }

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "L'endpoint demandé n'existe pas",
            "suggestion": "Consultez /docs pour voir les endpoints disponibles" if DEBUG else "Contactez l'administrateur",
            "available_endpoints": ["/", "/health", "/api/v1/"]
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    logging.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "Une erreur interne s'est produite",
            "environment": ENVIRONMENT,
            "debug_info": str(exc) if DEBUG else "Contactez l'administrateur"
        }
    )

# ============================================================================
# FIREBASE FUNCTIONS COMPATIBILITY
# ============================================================================

@functions_framework.http
def main(request):
    """
    Entry point for Firebase Functions
    This function wraps the FastAPI app for Firebase deployment
    """
    import asyncio
    from fastapi import Request
    from asgiref.wsgi import WsgiToAsgi
    
    # Import ASGI handler for Firebase Functions
    try:
        from uvicorn.main import run
        # Note: This is a simplified version for Firebase Functions
        # In production, use the proper ASGI handler
        return app
    except ImportError:
        # Fallback for Firebase Functions environment
        return {
            "statusCode": 200,
            "body": '{"message": "TaxasGE API running on Firebase Functions", "status": "ok"}'
        }

# ============================================================================
# LOCAL DEVELOPMENT SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Configuration for local development
    config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", 8000)),
        "reload": DEBUG,
        "log_level": "debug" if DEBUG else "info",
        "access_log": DEBUG
    }
    
    print(f"""
    🚀 Démarrage TaxasGE Backend API
    
    📊 Configuration:
    ├── Environment: {ENVIRONMENT}
    ├── Debug: {DEBUG}
    ├── Port: {config['port']}
    └── Host: {config['host']}
    
    📡 Endpoints disponibles:
    ├── API Root: http://localhost:{config['port']}/
    ├── Health: http://localhost:{config['port']}/health
    ├── API v1: http://localhost:{config['port']}/api/v1/
    └── Docs: http://localhost:{config['port']}/docs
    
    🌍 CORS autorisé pour:
    """)
    
    for origin in CORS_ORIGINS.get(ENVIRONMENT, []):
        print(f"    ├── {origin}")
    
    print("\n    ✅ Prêt pour le développement !")
    
    # Start the server
    uvicorn.run(**config)

# ============================================================================
# API ROUTER PLACEHOLDER
# ============================================================================

# TODO: Import and include API routers when they are created
# from app.api.router import api_router
# app.include_router(api_router, prefix="/api/v1")

# Example of how routers will be included:
"""
from app.api.v1 import auth, taxes, users, declarations, payments, ai

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(taxes.router, prefix="/api/v1/taxes", tags=["Taxes"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(declarations.router, prefix="/api/v1/declarations", tags=["Declarations"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Chatbot"])
"""

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        # logging.FileHandler("logs/taxasge-api.log") if not DEBUG else logging.StreamHandler()
    ]
)

logger = logging.getLogger("taxasge-api")
logger.info(f"🚀 TaxasGE API initialized - Environment: {ENVIRONMENT}")

# ============================================================================