"""
🚀 TaxasGE Backend API - Generated for development
Auto-generated by setup-backend.py on 2025-07-26 16:47:26

Environment: development
Features: chatbot_enabled, offline_mode, analytics_enabled, crash_reporting, performance_monitoring, debug_tools
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

# FastAPI Core
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Firebase Functions compatibility
import functions_framework

# Configuration
from dotenv import load_dotenv
from app.config import settings

# Load environment variables
load_dotenv()

# ============================================================================
# ENVIRONMENT-SPECIFIC CONFIGURATION
# ============================================================================

ENVIRONMENT = "development"
DEBUG = True
FEATURES = {
    "chatbot_enabled": True,
    "offline_mode": True,
    "payments_enabled": False,
    "analytics_enabled": True,
    "crash_reporting": True,
    "performance_monitoring": True,
    "debug_tools": True
}

# ============================================================================
# APPLICATION LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for development"""
    # Startup
    logging.info(f"🚀 TaxasGE API starting - Environment: development")
    
    # Environment-specific initialization
    if ENVIRONMENT == "development":
        logging.info("🔧 Development mode: Enabling debug features")
    elif ENVIRONMENT == "production":
        logging.info("🚀 Production mode: Optimized for performance")
    elif ENVIRONMENT == "testing":
        logging.info("🧪 Testing mode: Enhanced logging and validation")
    
    logging.info("✅ TaxasGE API startup completed")
    yield
    
    # Shutdown
    logging.info("🔄 TaxasGE API shutting down...")
    logging.info("✅ TaxasGE API shutdown completed")

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="TaxasGE API (development)",
    description="Environnement de développement local et CI/CD",
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/")
async def root() -> Dict[str, Any]:
    """Point d'entrée racine - development"""
    return {
        "message": "🚀 TaxasGE API",
        "environment": "development",
        "version": "1.0.0",
        "status": "operational",
        "description": "Environnement de développement local et CI/CD",
        "features": FEATURES,
        "docs": "/docs" if DEBUG else "Documentation disponible en développement",
        "generated_at": "2025-07-26T16:47:26.091301"
    }

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check for development"""
    import time
    import sys
    
    return {
        "status": "healthy",
        "service": "taxasge-backend",
        "environment": "development",
        "version": "1.0.0",
        "timestamp": int(time.time()),
        "python_version": sys.version,
        "debug_mode": DEBUG,
        "features": FEATURES,
        "checks": {
            "api": "ok",
            "database": "pending",
            "firebase": "pending"
        }
    }

@app.get("/api/v1/")
async def api_v1_root() -> Dict[str, Any]:
    """API v1 entry point for development"""
    return {
        "message": "TaxasGE API v1",
        "environment": "development",
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
# FIREBASE FUNCTIONS COMPATIBILITY
# ============================================================================

@functions_framework.http
def main(request):
    """Entry point for Firebase Functions - development"""
    return app

# ============================================================================
# LOCAL DEVELOPMENT SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", 8000)),
        "reload": DEBUG,
        "log_level": "debug" if DEBUG else "info",
        "access_log": DEBUG
    }
    
    print(f"""
    🚀 TaxasGE Backend API - DEVELOPMENT
    
    📊 Configuration:
    ├── Environment: development
    ├── Debug: {DEBUG}
    ├── Port: {config['port']}
    └── Features: 6 enabled
    
    📡 Endpoints:
    ├── Root: http://localhost:{config['port']}/
    ├── Health: http://localhost:{config['port']}/health
    ├── API v1: http://localhost:{config['port']}/api/v1/
    └── Docs: http://localhost:{config['port']}/docs
    
    ✅ Optimisé pour development !
    """)
    
    uvicorn.run(**config)

# ============================================================================
