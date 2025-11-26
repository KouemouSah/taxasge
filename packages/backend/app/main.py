"""
🚀 TaxasGE Backend - Production FastAPI Application
Optimized for Firebase Functions + Direct FastAPI deployment
"""

import os
import sys
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import uvicorn
import functions_framework
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from loguru import logger
import asyncpg
import redis.asyncio as redis
from pydantic_settings import BaseSettings
import json

# Configuration
class Settings(BaseSettings):
    model_config = {"env_file": ".env", "extra": "ignore"}

    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("ENVIRONMENT", "development") != "production"
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/taxasge")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    secret_key: str = os.getenv("SECRET_KEY", "taxasge-secret-key-change-in-production")
    api_version: str = "1.0.0"

    # SMTP Configuration using secured secrets
    smtp_password: str = os.getenv("SMTP_PASSWORD_GMAIL", os.getenv("SMTP_PASSWORD", ""))
    smtp_username: str = os.getenv("SMTP_USERNAME", "libressai@gmail.com")

settings = Settings()
security = HTTPBearer()

# Global connections
from app.database.connection import db_manager  # Use centralized DB manager
redis_client = None

# Lifespan management for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global redis_client

    try:
        # Initialize database connection pool (using centralized db_manager)
        await db_manager.connect()
        logger.info("✅ Database connection pool initialized")

        # Initialize permissions system (RBAC)
        try:
            # Import and register permissions from all modules
            from app.modules.permissions.services import initialize_permissions
            from app.modules.assignment.permissions import register_assignment_permissions
            from app.modules.declarations.permissions import register_declarations_permissions

            # Register all module permissions
            register_assignment_permissions()
            register_declarations_permissions()

            # Sync to database
            async with db_manager.get_connection() as conn:
                sync_result = await initialize_permissions(conn)
                logger.info(
                    f"✅ Permissions initialized: {sync_result['created_count']} new, "
                    f"{sync_result['skipped_count']} existing, "
                    f"{sync_result['total_count']} total"
                )
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize permissions (non-blocking): {e}")

        # Initialize Redis connection (optional - graceful fallback if unavailable)
        if settings.redis_url and settings.redis_url != "redis://localhost:6379":
            try:
                redis_client = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                await redis_client.ping()
                logger.info("✅ Redis connection initialized (caching enabled)")
            except Exception as redis_error:
                logger.warning(f"⚠️ Redis unavailable (continuing without cache): {redis_error}")
                redis_client = None
        else:
            logger.info("ℹ️ Redis not configured (caching disabled - direct DB queries)")

    except Exception as e:
        logger.error(f"❌ Failed to initialize connections: {e}")
        # For development, continue without external dependencies
        if settings.environment == "development":
            logger.warning("🔄 Continuing in development mode without external dependencies")
        else:
            raise

    yield

    # Shutdown
    try:
        await db_manager.disconnect()
        logger.info("🔄 Database pool closed")
        if redis_client:
            await redis_client.close()
            logger.info("🔄 Redis connection closed")
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")

# FastAPI application
app = FastAPI(
    title="TaxasGE API",
    description="Production-ready fiscal services platform for Guinea",
    version=settings.api_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Security middleware - Based on Firebase Hosting configuration
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else [
        "taxasge-dev.web.app",          # Firebase Hosting dev
        "taxasge-pro.web.app",          # Firebase Hosting prod
        "taxasge-dev.firebaseapp.com",  # Firebase domain dev
        "taxasge-pro.firebaseapp.com",  # Firebase domain prod
        "localhost",                     # Local development
        "127.0.0.1"                     # Local IP
    ]
)

# CORS middleware - Aligned with firebase.json configuration
# Note: Firebase Hosting staging channels use pattern: https://PROJECT--CHANNEL-ID.web.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [
        "https://taxasge-dev.web.app",
        "https://taxasge-pro.web.app",
        "https://taxasge-dev.firebaseapp.com",
        "https://taxasge-pro.firebaseapp.com"
    ],
    allow_origin_regex=r"https://taxasge-dev--[\w-]+\.web\.app",  # Allow staging channels
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"]
)

# Language detection middleware - Detects user language from headers/query
try:
    from app.modules.translations.middleware.language_middleware import language_middleware
    app.middleware("http")(language_middleware)
    logger.info("✅ Language detection middleware configured")
except ImportError as e:
    logger.warning(f"⚠️ Language detection middleware not available: {e}")

# Dependency to get database connection
async def get_db():
    if db_manager.pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    async with db_manager.pool.acquire() as connection:
        yield connection

# Dependency to get Redis connection
async def get_redis():
    if redis_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis connection not available"
        )
    return redis_client

# Health check endpoint
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    health_status = {
        "status": "healthy",
        "service": "taxasge-backend",
        "environment": settings.environment,
        "version": settings.api_version,
        "timestamp": datetime.utcnow().isoformat(),
        "python_version": sys.version,
        "platform": "FastAPI + Firebase Functions",
        "checks": {
            "api": "ok",
            "database": "unknown",
            "redis": "unknown",
            "firebase": "ok"
        }
    }

    # Test database connection
    try:
        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            health_status["checks"]["database"] = "ok"
    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Test Redis connection
    try:
        if redis_client:
            await redis_client.ping()
            health_status["checks"]["redis"] = "ok"
    except Exception as e:
        health_status["checks"]["redis"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    return health_status

# Root endpoint
@app.get("/")
async def root():
    """API root information"""
    return {
        "message": "🚀 TaxasGE API",
        "environment": settings.environment,
        "version": settings.api_version,
        "status": "operational",
        "description": "Production-ready fiscal services platform",
        "endpoints": {
            "health": "/health",
            "docs": "/docs" if settings.debug else "restricted",
            "api": "/api/v1/"
        },
        "features": {
            "fiscal_services": "547 services available",
            "multi_language": "Spanish, French, English",
            "ai_assistant": "Conversational AI support",
            "mobile_payments": "BANGE integration",
            "enterprise_support": "B2B declarations"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "platform": "FastAPI + Firebase Functions"
    }

# API v1 info endpoint
@app.get("/api/v1/")
async def api_v1_info():
    """API v1 information and available endpoints"""
    return {
        "message": "TaxasGE API v1",
        "version": settings.api_version,
        "environment": settings.environment,
        "available_endpoints": {
            "auth": "/api/v1/auth/ - Authentication and authorization",
            "fiscal_services": "/api/v1/fiscal-services/ - 547 fiscal services catalog",
            "users": "/api/v1/users/ - User profile management (self-service)",
            "admin": "/api/v1/admin/ - Admin diagnostics and migrations (RESTRICTED)",
            "admin_users": "/api/v1/admin/users/ - Admin user management (CRUD, RESTRICTED)",
            "documents": "/api/v1/documents/ - Document upload, OCR, extraction, validation",
            "taxes": "/api/v1/taxes/ - Tax service management (administrative)",
            "declarations": "/api/v1/declarations/ - Tax declarations workflow",
            "payments": "/api/v1/payments/ - BANGE mobile payments integration",
            "translations": "/api/v1/translations/ - System translations (ENUMs, UI, Forms, Messages)",
            "communications": "/api/v1/communications/ - Email, SMS, Push notification services",
            "ai": "/api/v1/ai/ - AI assistant conversations",
            "notifications": "/api/v1/notifications/ - Multi-channel notifications"
        },
        "documentation": "/docs" if settings.debug else "Contact admin for API documentation",
        "support": {
            "languages": ["es", "fr", "en"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "authentication": "JWT Bearer token",
            "rate_limiting": "1000 requests/hour per user"
        }
    }

# Include API routers - Import individually to handle partial failures
routers_loaded = []

# Try to load auth router (Module 1 - Critical)
try:
    from app.modules.auth.api import auth_router
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
    routers_loaded.append("auth")
    logger.info("✅ Auth router loaded")
except ImportError as e:
    logger.error(f"❌ Failed to load auth router: {e}")

# Try to load fiscal_services router (Module - Fiscal Services - Phase 3)
try:
    from app.modules.fiscal_services.api import fiscal_service_router
    app.include_router(fiscal_service_router, prefix="/api/v1/fiscal-services", tags=["fiscal-services"])
    routers_loaded.append("fiscal_services")
    logger.info("✅ Fiscal services router loaded (850 services catalog)")
except ImportError as e:
    logger.warning(f"⚠️ Fiscal services router not available: {e}")

# Try to load users router (Module - Users System)
try:
    from app.modules.users.api import user_routes
    app.include_router(user_routes, prefix="/api/v1/users", tags=["users"])
    routers_loaded.append("users")
    logger.info("✅ Users router loaded (profile management)")
except ImportError as e:
    logger.warning(f"⚠️ Users router not available: {e}")

# Try to load admin routers (Module - Admin System)
try:
    from app.modules.admin.api import admin_router, user_management_router
    app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin-diagnostics"])
    app.include_router(user_management_router, prefix="/api/v1/admin/users", tags=["admin-user-management"])
    routers_loaded.extend(["admin", "admin_users"])
    logger.info("✅ Admin routers loaded (diagnostics + user management)")
except ImportError as e:
    logger.warning(f"⚠️ Admin routers not available: {e}")

# Try to load two_factor router (TASK-M01-011)
try:
    from app.modules.auth.api import two_factor_router
    app.include_router(two_factor_router, prefix="/api/v1/auth", tags=["two-factor-authentication"])
    routers_loaded.append("two_factor")
    logger.info("✅ Two-Factor Authentication router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Two-Factor Authentication router not available: {e}")

# Try to load homepage router (Module - Homepage Statistics & Category Directory)
try:
    from app.modules.homepage import homepage_router
    app.include_router(homepage_router, prefix="/api/v1/homepage", tags=["homepage"])
    routers_loaded.append("homepage")
    logger.info("✅ Homepage router loaded (v2.0 - optimized 3-tier architecture)")
except ImportError as e:
    logger.warning(f"⚠️ Homepage router not available: {e}")

# Try to load permissions routers (Module 04 - RBAC Permissions System)
try:
    from app.modules.permissions import permission_router, role_router, user_permission_router
    app.include_router(permission_router, prefix="/api/v1", tags=["permissions"])
    app.include_router(role_router, prefix="/api/v1", tags=["roles"])
    app.include_router(user_permission_router, prefix="/api/v1", tags=["user-permissions"])
    routers_loaded.extend(["permissions", "roles", "user_permissions"])
    logger.info("✅ Permissions routers loaded (RBAC system)")
except ImportError as e:
    logger.warning(f"⚠️ Permissions routers not available: {e}")

# Try to load assignment router (Module - Assignment System)
try:
    from app.modules.assignment.api.assignment_routes import router as assignment_router
    app.include_router(assignment_router, prefix="/api/v1/assignments", tags=["assignments"])
    routers_loaded.append("assignments")
    logger.info("✅ Assignment router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Assignment router not available: {e}")

# Try to load documents router (Module - Documents System)
try:
    from app.modules.documents.api import document_routes
    app.include_router(document_routes, prefix="/api/v1/documents", tags=["documents"])
    routers_loaded.append("documents")
    logger.info("✅ Documents router loaded (OCR, extraction, validation)")
except ImportError as e:
    logger.warning(f"⚠️ Documents router not available: {e}")

# Try to load declarations router (Module - Declarations System - Phase 3)
try:
    from app.modules.declarations.api import declaration_router
    app.include_router(declaration_router, prefix="/api/v1/declarations", tags=["declarations"])
    routers_loaded.append("declarations")
    logger.info("✅ Declarations router loaded (28 types, MVP Phase 3.1)")
except ImportError as e:
    logger.warning(f"⚠️ Declarations router not available: {e}")

# Try to load companies router (Module - Companies System - Phase 3)
try:
    from app.modules.companies.api import company_router
    app.include_router(company_router, prefix="/api/v1/companies", tags=["companies"])
    routers_loaded.append("companies")
    logger.info("✅ Companies router loaded (business management)")
except ImportError as e:
    logger.warning(f"⚠️ Companies router not available: {e}")

# Try to load payments router (Module - Payments System - Phase 3 - BANGE Integration)
try:
    from app.modules.payments.api import payment_router
    app.include_router(payment_router, prefix="/api/v1/payments", tags=["payments"])
    routers_loaded.append("payments")
    logger.info("✅ Payments router loaded (BANGE mobile payments)")
except ImportError as e:
    logger.warning(f"⚠️ Payments router not available: {e}")

# Try to load webhooks router (Module - Webhooks System - Phase 3 - BANGE Callbacks)
try:
    from app.modules.webhooks.api import webhook_router
    app.include_router(webhook_router, prefix="/api/v1/webhooks", tags=["webhooks"])
    routers_loaded.append("webhooks")
    logger.info("✅ Webhooks router loaded (BANGE callbacks + reconciliation)")
except ImportError as e:
    logger.warning(f"⚠️ Webhooks router not available: {e}")

# Try to load translations router (Module - Translations System - System translations)
try:
    from app.modules.translations.api.translation_routes import router as translation_router
    app.include_router(translation_router, prefix="/api/v1", tags=["translations"])
    routers_loaded.append("translations")
    logger.info("✅ Translations router loaded (ENUMs, UI, Forms, Messages)")
except ImportError as e:
    logger.warning(f"⚠️ Translations router not available: {e}")

# Try to load communications router (Module - Communications System - Email/SMS/Push)
try:
    from app.modules.communications.api import router as communication_router
    app.include_router(communication_router, prefix="/api/v1", tags=["communications"])
    routers_loaded.append("communications")
    logger.info("✅ Communications router loaded (Email, SMS, Push notifications)")
except ImportError as e:
    logger.warning(f"⚠️ Communications router not available: {e}")

# Try to load chatbot router (Module - AI-powered assistance)
try:
    from app.modules.chatbot import chatbot_router
    app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["chatbot"])
    routers_loaded.append("chatbot")
    logger.info("✅ Chatbot router loaded (AI assistance, search, recommendations)")
except ImportError as e:
    logger.warning(f"⚠️ Chatbot router not available: {e}")

# Try to load template routers (Document and Procedure Templates)
try:
    from app.modules.fiscal_services.api.template_routes import (
        document_template_router,
        procedure_template_router,
    )
    app.include_router(document_template_router, prefix="/api/v1/document-templates", tags=["document-templates"])
    app.include_router(procedure_template_router, prefix="/api/v1/procedure-templates", tags=["procedure-templates"])
    routers_loaded.extend(["document_templates", "procedure_templates"])
    logger.info("✅ Template routers loaded (document + procedure templates)")
except ImportError as e:
    logger.warning(f"⚠️ Template routers not available: {e}")

# Try to load audit logs router (Admin - Audit Trail)
try:
    from app.modules.admin.api.audit_routes import router as audit_router, user_audit_router
    app.include_router(audit_router, prefix="/api/v1/audit-logs", tags=["audit-logs"])
    app.include_router(user_audit_router, prefix="/api/v1/users", tags=["user-audit-logs"])
    routers_loaded.append("audit_logs")
    logger.info("✅ Audit logs router loaded (audit trail)")
except ImportError as e:
    logger.warning(f"⚠️ Audit logs router not available: {e}")

if routers_loaded:
    logger.info(f"✅ {len(routers_loaded)} API routers loaded: {', '.join(routers_loaded)}")
else:
    logger.error("❌ No API routers could be loaded!")

# Firebase Functions wrapper
@functions_framework.http
def main(request):
    """Firebase Functions entry point - wraps FastAPI"""
    import asyncio
    from fastapi.testclient import TestClient

    # Handle CORS preflight for Firebase Functions
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Create test client for Firebase Functions
    with TestClient(app) as client:
        # Extract path and handle Firebase Functions routing
        path = request.path or '/'

        # Forward request to FastAPI
        try:
            if request.method == 'GET':
                response = client.get(path, headers=dict(request.headers))
            elif request.method == 'POST':
                response = client.post(
                    path,
                    json=request.get_json(silent=True),
                    headers=dict(request.headers)
                )
            elif request.method == 'PUT':
                response = client.put(
                    path,
                    json=request.get_json(silent=True),
                    headers=dict(request.headers)
                )
            elif request.method == 'DELETE':
                response = client.delete(path, headers=dict(request.headers))
            else:
                response = client.get(path, headers=dict(request.headers))

            headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }

            return (response.content, response.status_code, headers)

        except Exception as e:
            error_response = {
                "error": "Internal Server Error",
                "message": str(e),
                "status": 500,
                "environment": settings.environment
            }
            headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
            return (json.dumps(error_response), 500, headers)

# Direct FastAPI server (for local development)
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        access_log=settings.debug,
        log_level="info" if settings.debug else "warning"
    )