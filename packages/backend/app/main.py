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
# Note: functions_framework import moved to bottom of file (conditional)
# to avoid interference with Cloud Run uvicorn deployment
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from pydantic import ValidationError
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
    api_version: str = "1.1.7"  # v1.1.7: Remove functions-framework from requirements

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
            # Import permissions module - triggers auto-discovery of all module_permissions
            # This import chain:
            #   1. permissions/__init__.py imports module_permissions
            #   2. module_permissions/__init__.py runs discover_and_register_permissions()
            #   3. All *_permissions.py files are loaded and registered
            from app.modules.permissions import initialize_permissions

            # Sync permissions, role_permissions, and cleanup obsolete
            async with db_manager.get_connection() as conn:
                sync_result = await initialize_permissions(
                    conn,
                    sync_role_permissions=True,
                    cleanup_obsolete=True  # Remove obsolete permissions from DB
                )
                logger.info(
                    f"✅ Permissions initialized: {sync_result['created_count']} new, "
                    f"{sync_result['skipped_count']} existing, "
                    f"{sync_result['total_count']} total"
                )
                # Log role_permissions sync if available
                if 'role_permissions' in sync_result:
                    rp = sync_result['role_permissions']
                    if 'error' not in rp:
                        logger.info(
                            f"✅ Role permissions synced: {rp.get('roles_updated', 0)} roles, "
                            f"{rp.get('permissions_assigned', 0)} assignments"
                        )
                # Log cleanup results if any obsolete permissions were removed
                if 'cleanup' in sync_result:
                    cleanup = sync_result['cleanup']
                    if 'error' not in cleanup and cleanup.get('deleted_count', 0) > 0:
                        logger.info(
                            f"🧹 Cleanup: {cleanup['deleted_count']} obsolete permissions removed"
                        )
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize permissions (non-blocking): {e}")

        # Initialize Event Bus and register handlers
        try:
            from app.core.events import EventBus
            from app.modules.communications.handlers import register_notification_handlers
            from app.modules.admin.handlers import register_audit_handlers
            from app.modules.service_requests.handlers import register_agent_queue_handlers
            from app.modules.payments.handlers import register_payment_assignment_handlers

            # Initialize the EventBus
            EventBus.initialize()

            # Register event handlers
            notification_handler = register_notification_handlers()
            audit_handler = register_audit_handlers()
            agent_queue_handler = register_agent_queue_handlers()
            logger.info("✅ Agent queue event handlers registered")

            # Register payment assignment handler (auto-assign manual payments to Treasury)
            payment_assignment_handler = register_payment_assignment_handlers()
            logger.info("✅ Payment assignment event handlers registered")

            # Register verification event handlers (external document verification)
            try:
                from app.modules.verified_identifiers.handlers import setup_verification_handlers
                await setup_verification_handlers()
                logger.info("✅ Verification event handlers registered")
            except Exception as ve:
                logger.warning(f"⚠️ Failed to register verification handlers: {ve}")

            logger.info(
                f"✅ EventBus initialized with {EventBus.handler_count()} handlers "
                f"for {len(EventBus.get_subscribed_events())} event types"
            )
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize EventBus (non-blocking): {e}")

        # Initialize Cache System (Upstash Redis with in-memory fallback)
        try:
            from app.core.cache import initialize_cache, get_cache_health
            await initialize_cache()
            cache_health = await get_cache_health()
            if cache_health["redis_enabled"] and cache_health["redis_status"] == "connected":
                logger.info("✅ Cache system initialized (Upstash Redis)")
            else:
                logger.info("ℹ️ Cache system initialized (in-memory fallback)")
        except Exception as cache_error:
            logger.warning(f"⚠️ Cache initialization failed (continuing without cache): {cache_error}")

        # Initialize legacy Redis connection (for backwards compatibility)
        if settings.redis_url and settings.redis_url != "redis://localhost:6379":
            try:
                redis_client = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                await redis_client.ping()
                logger.info("✅ Legacy Redis client connected")
            except Exception as redis_error:
                logger.warning(f"⚠️ Legacy Redis unavailable: {redis_error}")
                redis_client = None
        else:
            logger.info("ℹ️ Legacy Redis client not configured")

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
        # Shutdown cache system
        from app.core.cache import shutdown_cache
        await shutdown_cache()
        logger.info("🔄 Cache system shutdown")

        await db_manager.disconnect()
        logger.info("🔄 Database pool closed")
        if redis_client:
            await redis_client.close()
            logger.info("🔄 Legacy Redis connection closed")
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

# Security middleware - Based on Cloud Run + Firebase Hosting configuration
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else [
        "taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app",  # Cloud Run backend staging
        "taxasge-backend-staging-392159428433.us-central1.run.app",  # Cloud Run backend alt
        "taxasge.emacsah.com",          # Custom domain frontend
        "taxasge-dev.web.app",          # Firebase Hosting dev
        "taxasge-pro.web.app",          # Firebase Hosting prod
        "taxasge-dev.firebaseapp.com",  # Firebase domain dev
        "taxasge-pro.firebaseapp.com",  # Firebase domain prod
        "localhost",                     # Local development
        "127.0.0.1"                     # Local IP
    ]
)

# CORS middleware - Aligned with Cloud Run deployments
# Note: Firebase Hosting staging channels use pattern: https://PROJECT--CHANNEL-ID.web.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [
        "https://taxasge.emacsah.com",           # Custom domain (Cloud Run frontend)
        "https://taxasge-frontend-staging-xrlbgdr5eq-uc.a.run.app",  # Cloud Run direct URL
        "https://taxasge-dev.web.app",
        "https://taxasge-pro.web.app",
        "https://taxasge-dev.firebaseapp.com",
        "https://taxasge-pro.firebaseapp.com"
    ],
    allow_origin_regex=r"https://taxasge-(dev|frontend-staging)--[\w-]+\.(web\.app|run\.app)",  # Allow staging channels
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"]
)

# Global exception handlers to ensure CORS headers are set on all error responses
# Import TreasuryError for specific handling
try:
    from app.modules.treasury.errors import TreasuryError
except ImportError:
    TreasuryError = None

def get_cors_headers(request: Request) -> dict:
    """Get CORS headers based on request origin."""
    origin = request.headers.get("origin", "")
    allowed_origins = [
        "https://taxasge.emacsah.com",
        "https://taxasge-frontend-staging-xrlbgdr5eq-uc.a.run.app",
        "https://taxasge-dev.web.app",
        "https://taxasge-pro.web.app",
    ]
    # Check if origin is allowed or matches staging pattern
    import re
    if origin in allowed_origins or re.match(r"https://taxasge-(dev|frontend-staging)--[\w-]+\.(web\.app|run\.app)", origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
        }
    return {}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions and return JSON with proper status code and CORS headers."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "message_es": "Error interno del servidor. Por favor intente de nuevo."
        },
        headers=get_cors_headers(request)
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions and return JSON response with CORS headers."""
    # Handle structured detail (dict) vs string detail
    if isinstance(exc.detail, dict):
        content = exc.detail
        if "error_code" not in content:
            content["error_code"] = f"HTTP_{exc.status_code}"
    else:
        content = {
            "detail": exc.detail,
            "error_code": f"HTTP_{exc.status_code}"
        }
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=get_cors_headers(request)
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with CORS headers."""
    logger.warning(f"Request validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "error_code": "VALIDATION_ERROR",
            "message_es": "Error de validación en los datos enviados."
        },
        headers=get_cors_headers(request)
    )


@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request: Request, exc: ResponseValidationError):
    """Handle response validation errors with CORS headers."""
    logger.error(f"Response validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Response validation error",
            "error_code": "RESPONSE_VALIDATION_ERROR",
            "message_es": "Error de validación en la respuesta del servidor.",
            "validation_errors": str(exc.errors())[:500]  # Truncate for safety
        },
        headers=get_cors_headers(request)
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors with CORS headers."""
    logger.error(f"Pydantic validation error: {exc.errors()}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Data validation error",
            "error_code": "PYDANTIC_VALIDATION_ERROR",
            "message_es": "Error de validación de datos.",
            "validation_errors": str(exc.errors())[:500]
        },
        headers=get_cors_headers(request)
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
        if db_manager.pool:
            async with db_manager.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            health_status["checks"]["database"] = "ok"
    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Test Cache System (Upstash Redis)
    try:
        from app.core.cache import get_cache_health
        cache_health = await get_cache_health()
        health_status["checks"]["cache"] = cache_health
        if cache_health["redis_enabled"]:
            if cache_health["redis_status"] == "connected":
                health_status["checks"]["redis"] = "ok (Upstash)"
            else:
                health_status["checks"]["redis"] = cache_health["redis_status"]
                health_status["status"] = "degraded"
        else:
            health_status["checks"]["redis"] = "disabled (in-memory fallback)"
    except Exception as e:
        health_status["checks"]["cache"] = f"error: {str(e)}"
        health_status["checks"]["redis"] = f"error: {str(e)}"

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
            "fiscal_services": "850+ services available",
            "multi_language": "Spanish, French, English",
            "ai_assistant": "Conversational AI support",
            "mobile_payments": "BANGE integration",
            "enterprise_support": "B2B declarations"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "platform": "FastAPI + Firebase Functions"
    }

# Debug endpoint to check loaded routers (helps diagnose 404 issues)
@app.get("/api/v1/debug/routers")
async def debug_routers():
    """Debug endpoint to check which routers are loaded"""
    return {
        "status": "diagnostic",
        "routers_loaded": routers_loaded,
        "routers_count": len(routers_loaded),
        "auth_loaded": "auth" in routers_loaded,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment
    }


@app.get("/api/v1/debug/communications-import")
async def debug_communications_import():
    """Debug endpoint to diagnose communications router import errors"""
    import_errors = []
    import_success = []

    # Test each import in the communications chain
    try:
        from app.modules.communications.models.communication import EmailTemplate
        import_success.append("models.communication.EmailTemplate")
    except Exception as e:
        import_errors.append({"module": "models.communication", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.communications.services.template_service import get_template_service
        import_success.append("services.template_service")
    except Exception as e:
        import_errors.append({"module": "services.template_service", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.communications.services.email_service import EmailService
        import_success.append("services.email_service.EmailService")
    except Exception as e:
        import_errors.append({"module": "services.email_service", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.communications.services.communication_service import CommunicationService
        import_success.append("services.communication_service.CommunicationService")
    except Exception as e:
        import_errors.append({"module": "services.communication_service", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.communications.api.communication_routes import router
        import_success.append("api.communication_routes.router")
    except Exception as e:
        import_errors.append({"module": "api.communication_routes", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.communications.api import router as main_router
        import_success.append("api.router (main)")
    except Exception as e:
        import_errors.append({"module": "api (main router)", "error": str(e), "type": type(e).__name__})

    return {
        "status": "diagnostic",
        "communications_loaded": "communications" in routers_loaded,
        "import_success": import_success,
        "import_errors": import_errors,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/v1/debug/enum-import")
async def debug_enum_import():
    """Debug endpoint to diagnose enum router import errors"""
    import_errors = []
    import_success = []

    # Test each import in the chain
    try:
        from app.modules.translations.repositories.translation_repository import TranslationRepository
        import_success.append("translation_repository.TranslationRepository")
    except Exception as e:
        import_errors.append({"module": "translation_repository.TranslationRepository", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.translations.repositories.enum_repository import EnumRepository, MODIFIABLE_ENUMS
        import_success.append("enum_repository.EnumRepository")
        import_success.append(f"MODIFIABLE_ENUMS: {MODIFIABLE_ENUMS}")
    except Exception as e:
        import_errors.append({"module": "enum_repository.EnumRepository", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.translations.services.enum_service import EnumService
        import_success.append("enum_service.EnumService")
    except Exception as e:
        import_errors.append({"module": "enum_service.EnumService", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.auth.middleware.auth_middleware import get_current_user, get_current_admin_user
        import_success.append("auth_middleware.get_current_user")
        import_success.append("auth_middleware.get_current_admin_user")
    except Exception as e:
        import_errors.append({"module": "auth_middleware", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.translations.api.enum_routes import router as enum_router
        import_success.append("enum_routes.router")
    except Exception as e:
        import_errors.append({"module": "enum_routes.router", "error": str(e), "type": type(e).__name__})

    return {
        "status": "diagnostic",
        "enum_router_loaded": "enums" in routers_loaded,
        "import_success": import_success,
        "import_errors": import_errors,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/v1/debug/support-import")
async def debug_support_import():
    """Debug endpoint to diagnose support router import errors"""
    import_errors = []
    import_success = []

    # Test each import in the support module chain
    try:
        from app.modules.support.models.support import SupportCategoryCreate
        import_success.append("models.support.SupportCategoryCreate")
    except Exception as e:
        import_errors.append({"module": "models.support.SupportCategoryCreate", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.support.repositories.support_repository import SupportRepository
        import_success.append("repositories.support_repository.SupportRepository")
    except Exception as e:
        import_errors.append({"module": "repositories.support_repository", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.support.services.support_service import SupportService
        import_success.append("services.support_service.SupportService")
    except Exception as e:
        import_errors.append({"module": "services.support_service", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.support.api.support_routes import router as support_router
        import_success.append("api.support_routes.router")
    except Exception as e:
        import_errors.append({"module": "api.support_routes.router", "error": str(e), "type": type(e).__name__})

    try:
        from app.modules.support.api import router
        import_success.append("api.__init__.router")
    except Exception as e:
        import_errors.append({"module": "api.__init__.router", "error": str(e), "type": type(e).__name__})

    return {
        "status": "diagnostic",
        "support_router_loaded": "support" in routers_loaded,
        "import_success": import_success,
        "import_errors": import_errors,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/v1/debug/service-requests-import")
async def debug_service_requests_import():
    """Debug endpoint to diagnose service_requests router import errors"""
    import_errors = []
    import_success = []

    # Test each import in the service_requests module chain
    try:
        from app.modules.service_requests.models.enums import WorkflowCode, WorkflowCategory, EntityCode
        import_success.append("models.enums (WorkflowCode, WorkflowCategory, EntityCode)")
    except Exception as e:
        import traceback
        import_errors.append({"module": "models.enums", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.service_requests.workflows.base_workflow import BaseWorkflow
        import_success.append("workflows.base_workflow.BaseWorkflow")
    except Exception as e:
        import traceback
        import_errors.append({"module": "workflows.base_workflow", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.service_requests.workflows.generic_workflow import GenericWorkflowStandard
        import_success.append("workflows.generic_workflow.GenericWorkflowStandard")
    except Exception as e:
        import traceback
        import_errors.append({"module": "workflows.generic_workflow", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.service_requests.services.workflow_engine import WorkflowEngine
        import_success.append("services.workflow_engine.WorkflowEngine")
    except Exception as e:
        import traceback
        import_errors.append({"module": "services.workflow_engine", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.service_requests.services.service_request_service import service_request_service
        import_success.append("services.service_request_service")
    except Exception as e:
        import traceback
        import_errors.append({"module": "services.service_request_service", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.service_requests.api.admin_routes import router as admin_router
        import_success.append("api.admin_routes.router")
    except Exception as e:
        import traceback
        import_errors.append({"module": "api.admin_routes", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.service_requests.api import router, agent_router, admin_router
        import_success.append("api.__init__ (router, agent_router, admin_router)")
    except Exception as e:
        import traceback
        import_errors.append({"module": "api.__init__", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    return {
        "status": "diagnostic",
        "service_requests_loaded": "service_requests" in routers_loaded,
        "documents_loaded": "documents" in routers_loaded,
        "import_success": import_success,
        "import_errors": import_errors,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/v1/debug/entity-locations-import")
async def debug_entity_locations_import():
    """Debug endpoint to diagnose entity_locations router import errors"""
    import_errors = []
    import_success = []

    # Test each import in the entity_locations module chain
    try:
        from app.modules.entity_locations.models.entity_location import (
            EntityLocationCreate,
            EntityLocationResponse,
            VALID_ENTITY_CODES,
            VALID_CITIES,
        )
        import_success.append(f"models.entity_location (VALID_ENTITY_CODES={VALID_ENTITY_CODES})")
    except Exception as e:
        import traceback
        import_errors.append({"module": "models.entity_location", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.entity_locations.repositories.entity_location_repository import EntityLocationRepository
        import_success.append("repositories.entity_location_repository.EntityLocationRepository")
    except Exception as e:
        import traceback
        import_errors.append({"module": "repositories.entity_location_repository", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.entity_locations.services.entity_location_service import EntityLocationService
        import_success.append("services.entity_location_service.EntityLocationService")
    except Exception as e:
        import traceback
        import_errors.append({"module": "services.entity_location_service", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.entity_locations.api.entity_location_routes import router
        import_success.append("api.entity_location_routes.router")
    except Exception as e:
        import traceback
        import_errors.append({"module": "api.entity_location_routes", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.entity_locations.api import router as entity_locations_router
        import_success.append("api.__init__.router")
    except Exception as e:
        import traceback
        import_errors.append({"module": "api.__init__", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    return {
        "status": "diagnostic",
        "entity_locations_loaded": "entity-locations" in routers_loaded,
        "import_success": import_success,
        "import_errors": import_errors,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/v1/debug/funcionario-import")
async def debug_funcionario_import():
    """Debug endpoint to diagnose funcionario router import errors"""
    import_errors = []
    import_success = []

    # Test each import in the funcionario module chain
    try:
        from app.modules.auth.dependencies import get_current_user
        import_success.append("auth.dependencies.get_current_user")
    except Exception as e:
        import traceback
        import_errors.append({"module": "auth.dependencies.get_current_user", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.auth.dependencies import require_permissions
        import_success.append("auth.dependencies.require_permissions")
    except Exception as e:
        import traceback
        import_errors.append({"module": "auth.dependencies.require_permissions", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.funcionario.models.verificacion import VerificacionCreate
        import_success.append("funcionario.models.verificacion.VerificacionCreate")
    except Exception as e:
        import traceback
        import_errors.append({"module": "funcionario.models.verificacion", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.funcionario.services.verificacion_service import verificacion_service
        import_success.append("funcionario.services.verificacion_service")
    except Exception as e:
        import traceback
        import_errors.append({"module": "funcionario.services.verificacion_service", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.funcionario.api.verificacion_routes import router
        import_success.append("funcionario.api.verificacion_routes.router")
    except Exception as e:
        import traceback
        import_errors.append({"module": "funcionario.api.verificacion_routes", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    try:
        from app.modules.funcionario.api import router as funcionario_router
        import_success.append("funcionario.api.__init__.router")
    except Exception as e:
        import traceback
        import_errors.append({"module": "funcionario.api.__init__", "error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()})

    return {
        "status": "diagnostic",
        "funcionario_loaded": "funcionario" in routers_loaded,
        "import_success": import_success,
        "import_errors": import_errors,
        "timestamp": datetime.utcnow().isoformat()
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
            "fiscal_services": "/api/v1/fiscal-services/ - 850+ fiscal services catalog",
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
            "notifications": "/api/v1/notifications/ - Multi-channel notifications",
            "accountant": "/api/v1/accountant/ - Accountant deadline tracking across client companies"
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
import traceback

# Try to load auth router (Module 1 - Critical)
try:
    logger.debug("🔄 Loading auth router...")
    from app.modules.auth.api import auth_router, _auth_import_error
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])

    # Check if we got the real router or the fallback dummy router
    if _auth_import_error:
        logger.error(f"⚠️ WARNING: Auth router loaded but with FALLBACK endpoints!")
        logger.error(f"⚠️ Original import error: {_auth_import_error}")
        logger.error("⚠️ Login/Register will return 503 instead of 404, but still NOT functional!")
        routers_loaded.append("auth_FALLBACK")
    else:
        # Verify the router has the expected routes
        route_count = len(auth_router.routes)
        if route_count < 5:
            logger.warning(f"⚠️ Auth router has only {route_count} routes - may be incomplete")
            routers_loaded.append("auth_PARTIAL")
        else:
            routers_loaded.append("auth")
            logger.info(f"✅ Auth router loaded successfully ({route_count} routes)")
except Exception as e:
    logger.error(f"❌ CRITICAL: Failed to load auth router: {e}")
    logger.error(f"❌ Auth router traceback:\n{traceback.format_exc()}")
    logger.error("❌ Login/Register endpoints will NOT be available!")

# Try to load fiscal_services router (Module - Fiscal Services - Phase 3)
try:
    from app.modules.fiscal_services.api import fiscal_service_router
    app.include_router(fiscal_service_router, prefix="/api/v1/fiscal-services", tags=["fiscal-services"])
    routers_loaded.append("fiscal_services")
    logger.info("✅ Fiscal services router loaded (850 services catalog)")
except Exception as e:
    logger.error(f"❌ Fiscal services router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load users router (Module - Users System)
try:
    from app.modules.users.api import user_routes
    app.include_router(user_routes, prefix="/api/v1/users", tags=["users"])
    routers_loaded.append("users")
    logger.info("✅ Users router loaded (profile management)")
except Exception as e:
    logger.error(f"❌ Users router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load admin routers (Module - Admin System)
try:
    from app.modules.admin.api import admin_router, user_management_router
    app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin-diagnostics"])
    app.include_router(user_management_router, prefix="/api/v1/admin/users", tags=["admin-user-management"])
    routers_loaded.extend(["admin", "admin_users"])
    logger.info("✅ Admin routers loaded (diagnostics + user management)")
except Exception as e:
    logger.error(f"❌ Admin routers failed: {e}")
    logger.error(traceback.format_exc())

# Try to load two_factor router (TASK-M01-011)
try:
    from app.modules.auth.api import two_factor_router
    app.include_router(two_factor_router, prefix="/api/v1/auth", tags=["two-factor-authentication"])
    routers_loaded.append("two_factor")
    logger.info("✅ Two-Factor Authentication router loaded")
except Exception as e:
    logger.error(f"❌ Two-Factor router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load homepage router (Module - Homepage Statistics & Category Directory)
try:
    from app.modules.homepage import homepage_router
    app.include_router(homepage_router, prefix="/api/v1/homepage", tags=["homepage"])
    routers_loaded.append("homepage")
    logger.info("✅ Homepage router loaded (v2.0 - optimized 3-tier architecture)")
except Exception as e:
    logger.error(f"❌ Homepage router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load permissions routers (Module 04 - RBAC Permissions System)
try:
    from app.modules.permissions import permission_router, role_router, user_permission_router
    app.include_router(permission_router, prefix="/api/v1", tags=["permissions"])
    app.include_router(role_router, prefix="/api/v1", tags=["roles"])
    app.include_router(user_permission_router, prefix="/api/v1", tags=["user-permissions"])
    routers_loaded.extend(["permissions", "roles", "user_permissions"])
    logger.info("✅ Permissions routers loaded (RBAC system)")
except Exception as e:
    logger.error(f"❌ Permissions routers failed: {e}")
    logger.error(traceback.format_exc())

# Try to load assignment router (Module - Assignment System)
logger.info("🔄 Loading assignment router...")
try:
    from app.modules.assignment.api.assignment_routes import router as assignment_router
    logger.info(f"📦 Assignment router imported, routes: {len(assignment_router.routes)}")
    # Note: assignment_routes already has prefix="/api/v1/assignments" defined in the router
    app.include_router(assignment_router, tags=["assignments"])
    routers_loaded.append("assignments")
    logger.info("✅ Assignment router loaded successfully")
except Exception as e:
    logger.error(f"❌ Assignment router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load supervisor router (Module - Supervisor Dashboard & Team Management)
try:
    from app.modules.assignment.api.supervisor_routes import router as supervisor_router
    # Note: supervisor_routes already has prefix="/api/v1/supervisor" defined
    app.include_router(supervisor_router, tags=["supervisor"])
    routers_loaded.append("supervisor")
    logger.info("✅ Supervisor router loaded (dashboard, team management, rules)")
except Exception as e:
    logger.error(f"❌ Supervisor router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load statistics router (Module - Analytics & Reporting)
try:
    from app.modules.assignment.api.statistics_routes import router as statistics_router
    # Note: statistics_routes already has prefix="/api/v1/statistics" defined
    app.include_router(statistics_router, tags=["statistics"])
    routers_loaded.append("statistics")
    logger.info("✅ Statistics router loaded (analytics, performance metrics)")
except Exception as e:
    logger.error(f"❌ Statistics router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load agent profile router (Module - Agent Profiles v2)
try:
    from app.modules.agents.api.profile_routes import router as agent_profile_router
    app.include_router(agent_profile_router, prefix="/api/v1/agents", tags=["agent-profiles"])
    routers_loaded.append("agent-profiles")
    logger.info("✅ Agent profile router loaded")
except Exception as e:
    logger.error(f"❌ Agent profile router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load documents router (Module - Documents System)
try:
    from app.modules.documents.api import document_routes
    app.include_router(document_routes, prefix="/api/v1/documents", tags=["documents"])
    routers_loaded.append("documents")
    logger.info("✅ Documents router loaded (OCR, extraction, validation)")
except Exception as e:
    logger.error(f"❌ Documents router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load service requests router (Module - Service Requests Workflow)
try:
    from app.modules.service_requests.api import router as service_requests_router
    from app.modules.service_requests.api import agent_router as service_requests_agent_router
    from app.modules.service_requests.api import admin_router as service_requests_admin_router
    from app.modules.service_requests.api.appointment_routes import router as service_requests_appointment_router
    from app.modules.service_requests.api.cron_routes import router as service_requests_cron_router
    app.include_router(service_requests_router, prefix="/api/v1", tags=["service-requests"])
    app.include_router(service_requests_agent_router, prefix="/api/v1", tags=["service-requests-agent"])
    app.include_router(service_requests_admin_router, prefix="/api/v1", tags=["service-requests-admin"])
    app.include_router(service_requests_appointment_router, prefix="/api/v1", tags=["service-requests-appointments"])
    app.include_router(service_requests_cron_router, prefix="/api/v1/internal", tags=["cron-jobs"])
    routers_loaded.append("service_requests")
    routers_loaded.append("service_requests_agent")
    routers_loaded.append("service_requests_admin")
    routers_loaded.append("service_requests_appointments")
    routers_loaded.append("service_requests_cron")
    logger.info("✅ Service Requests router loaded (citizen, agent, admin, appointments, cron)")
except Exception as e:
    logger.error(f"❌ Service Requests router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load verified identifiers router (Module - External Document Verification)
try:
    from app.modules.verified_identifiers.api import router as verified_identifiers_router
    app.include_router(verified_identifiers_router, prefix="/api/v1", tags=["verified-identifiers"])
    routers_loaded.append("verified_identifiers")
    logger.info("✅ Verified Identifiers router loaded (external document verification)")
except Exception as e:
    logger.error(f"❌ Verified Identifiers router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load declarations router (Module - Declarations System - Phase 3)
try:
    from app.modules.declarations.api import declaration_router
    app.include_router(declaration_router, prefix="/api/v1/declarations", tags=["declarations"])
    routers_loaded.append("declarations")
    logger.info("✅ Declarations router loaded (28 types, MVP Phase 3.1)")
except Exception as e:
    logger.error(f"❌ Declarations router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load accountant batch operations router (Module - Batch Operations)
try:
    from app.modules.declarations.api.accountant_batch_routes import router as accountant_batch_router
    app.include_router(accountant_batch_router, prefix="/api/v1/accountant", tags=["accountant-batch"])
    routers_loaded.append("accountant_batch")
    logger.info("✅ Accountant batch operations router loaded (batch create, submit, reports)")
except Exception as e:
    logger.error(f"❌ Accountant batch operations router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load companies router (Module - Companies System - Phase 3)
try:
    from app.modules.companies.api import company_router
    app.include_router(company_router, prefix="/api/v1/companies", tags=["companies"])
    routers_loaded.append("companies")
    logger.info("✅ Companies router loaded (business management)")
except Exception as e:
    logger.error(f"❌ Companies router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load payments router (Module - Payments System - Phase 3 - BANGE Integration)
try:
    from app.modules.payments.api import payment_router
    app.include_router(payment_router, prefix="/api/v1/payments", tags=["payments"])
    routers_loaded.append("payments")
    logger.info("✅ Payments router loaded (BANGE mobile payments)")
except Exception as e:
    logger.error(f"❌ Payments router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load receipt verification router (PUBLIC - no auth required)
try:
    from app.modules.payments.api import verify_router
    app.include_router(verify_router, prefix="/api/v1/verify", tags=["verification"])
    routers_loaded.append("verify")
    logger.info("✅ Verification router loaded (receipt authenticity)")
except Exception as e:
    logger.error(f"❌ Verification router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load webhooks router (Module - Webhooks System - Phase 3 - BANGE Callbacks)
try:
    from app.modules.webhooks.api import webhook_router
    app.include_router(webhook_router, prefix="/api/v1/webhooks", tags=["webhooks"])
    routers_loaded.append("webhooks")
    logger.info("✅ Webhooks router loaded (BANGE callbacks + reconciliation)")
except Exception as e:
    logger.error(f"❌ Webhooks router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load entity translations router FIRST (Admin CRUD for ministry/sector/category translations)
# IMPORTANT: Must be loaded BEFORE translation_router to avoid /{translation_id} route conflict
try:
    from app.modules.translations.api.entity_translation_routes import router as entity_translation_router
    app.include_router(entity_translation_router, prefix="/api/v1", tags=["entity-translations"])
    routers_loaded.append("entity-translations")
    logger.info("✅ Entity translations router loaded (Ministries, Sectors, Categories)")
except Exception as e:
    logger.error(f"❌ Entity translations router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load frontend translations router SECOND (Admin CRUD for frontend UI JSON translations)
# IMPORTANT: Must be loaded BEFORE translation_router to avoid /{translation_id} route conflict
try:
    from app.modules.translations.api.frontend_translation_routes import router as frontend_translation_router
    app.include_router(frontend_translation_router, prefix="/api/v1", tags=["frontend-translations"])
    routers_loaded.append("frontend-translations")
    logger.info("✅ Frontend translations router loaded (UI JSON sync)")
except Exception as e:
    logger.error(f"❌ Frontend translations router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load translations router LAST (Module - Translations System - System translations)
# IMPORTANT: Must be loaded AFTER entity/frontend routers because it has /{translation_id} route
try:
    from app.modules.translations.api.translation_routes import router as translation_router
    app.include_router(translation_router, prefix="/api/v1", tags=["translations"])
    routers_loaded.append("translations")
    logger.info("✅ Translations router loaded (ENUMs, UI, Forms, Messages)")
except Exception as e:
    logger.error(f"❌ Translations router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load ENUM management router (Module - Translations System - ENUM value management)
try:
    from app.modules.translations.api.enum_routes import router as enum_router
    app.include_router(enum_router, prefix="/api/v1", tags=["enum-management"])
    routers_loaded.append("enums")
    logger.info("✅ ENUM management router loaded (add/modify/archive ENUM values)")
except Exception as e:
    logger.error(f"❌ ENUM management router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load communications router (Module - Communications System - Email/SMS/Push)
try:
    from app.modules.communications.api import router as communication_router, email_templates_router, push_templates_router
    app.include_router(communication_router, prefix="/api/v1", tags=["communications"])
    app.include_router(email_templates_router, prefix="/api/v1", tags=["email-templates"])
    app.include_router(push_templates_router, prefix="/api/v1", tags=["push-templates"])
    routers_loaded.append("communications")
    routers_loaded.append("email_templates")
    routers_loaded.append("push_templates")
    logger.info("✅ Communications router loaded (Email, SMS, Push notifications)")
    logger.info("✅ Email Templates router loaded (Template management)")
    logger.info("✅ Push Templates router loaded (Push notification template management)")
except Exception as e:
    logger.error(f"❌ Communications router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load chatbot router (Module - AI-powered assistance)
try:
    from app.modules.chatbot import chatbot_router
    app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["chatbot"])
    routers_loaded.append("chatbot")
    logger.info("✅ Chatbot router loaded (AI assistance, search, recommendations)")
except Exception as e:
    logger.error(f"❌ Chatbot router failed: {e}")
    logger.error(traceback.format_exc())

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
except Exception as e:
    logger.error(f"❌ Template routers failed: {e}")
    logger.error(traceback.format_exc())

# Try to load audit logs router (Admin - Audit Trail)
try:
    from app.modules.admin.api.audit_routes import router as audit_router, user_audit_router
    app.include_router(audit_router, prefix="/api/v1/audit-logs", tags=["audit-logs"])
    app.include_router(user_audit_router, prefix="/api/v1/users", tags=["user-audit-logs"])
    routers_loaded.append("audit_logs")
    logger.info("✅ Audit logs router loaded (audit trail)")
except Exception as e:
    logger.error(f"❌ Audit logs router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load accountant router (Accountant - Deadline Tracking)
try:
    from app.modules.accountant import accountant_router
    app.include_router(accountant_router, prefix="/api/v1/accountant", tags=["accountant-deadline-tracking"])
    routers_loaded.append("accountant")
    logger.info("✅ Accountant router loaded (deadline tracking for client companies)")
except Exception as e:
    logger.error(f"❌ Accountant router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load support router (Module - Support Ticketing System)
try:
    from app.modules.support.api import router as support_router
    app.include_router(support_router, prefix="/api/v1", tags=["support"])
    routers_loaded.append("support")
    logger.info("✅ Support router loaded (ticketing system)")
except Exception as e:
    logger.error(f"❌ Support router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load entity locations router (Module - Entity Locations Management)
try:
    from app.modules.entity_locations.api import router as entity_locations_router
    app.include_router(entity_locations_router, prefix="/api/v1", tags=["entity-locations"])
    routers_loaded.append("entity-locations")
    logger.info("✅ Entity locations router loaded")
except Exception as e:
    logger.error(f"❌ Entity locations router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load cities router (Module - Cities and Entities Management)
try:
    from app.modules.cities.api import router as cities_router
    app.include_router(cities_router, prefix="/api/v1", tags=["cities"])
    routers_loaded.append("cities")
    logger.info("✅ Cities router loaded")
except Exception as e:
    logger.error(f"❌ Cities router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load funcionario verification router (Module - Civil Servant Verification)
try:
    from app.modules.funcionario.api import router as funcionario_router
    app.include_router(funcionario_router, prefix="/api/v1", tags=["funcionario-verification"])
    routers_loaded.append("funcionario")
    logger.info("✅ Funcionario verification router loaded")
except Exception as e:
    logger.error(f"❌ Funcionario verification router failed: {e}")
    logger.error(traceback.format_exc())

# Try to load menu config router (Module - Dynamic Menu Configuration)
try:
    from app.modules.menu_config.api import router as menu_config_router
    app.include_router(menu_config_router, prefix="/api/v1", tags=["menu-configuration"])
    routers_loaded.append("menu-config")
    logger.info("✅ Menu configuration router loaded")
except Exception as e:
    logger.error(f"❌ Menu configuration router failed: {e}")
    logger.error(traceback.format_exc())

if routers_loaded:
    logger.info(f"✅ {len(routers_loaded)} API routers loaded: {', '.join(routers_loaded)}")
else:
    logger.error("❌ No API routers could be loaded!")

# Firebase Functions wrapper - Only loaded when running as Firebase Function
# This is NOT used by Cloud Run (which uses uvicorn directly with app.main:app)
# The functions_framework import and decorator are kept here for Firebase Functions compatibility
# but isolated to prevent interference with Cloud Run deployment
try:
    import functions_framework

    @functions_framework.http
    def main(request):
        """Firebase Functions entry point - wraps FastAPI"""
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

except ImportError:
    # functions_framework not installed - running in Cloud Run or local dev
    logger.debug("functions_framework not available - using uvicorn directly")

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