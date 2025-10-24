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
db_pool = None
redis_client = None

# Lifespan management for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_pool, redis_client

    try:
        # Initialize database connection pool
        db_pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=10,
            max_size=50,
            command_timeout=60
        )
        logger.info("✅ Database connection pool initialized")

        # Initialize Redis connection (optional in staging)
        if settings.environment != "staging":
            redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            await redis_client.ping()
            logger.info("✅ Redis connection initialized")
        else:
            logger.warning("⚠️ Redis disabled for staging environment")

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
        if db_pool:
            await db_pool.close()
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [
        "https://taxasge-dev.web.app",
        "https://taxasge-pro.web.app",
        "https://taxasge-dev.firebaseapp.com",
        "https://taxasge-pro.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"]
)

# Dependency to get database connection
async def get_db():
    if db_pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    async with db_pool.acquire() as connection:
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
            "users": "/api/v1/users/ - User management and profiles (CRUD)",
            "taxes": "/api/v1/taxes/ - Tax service management (administrative)",
            "declarations": "/api/v1/declarations/ - Tax declarations workflow",
            "payments": "/api/v1/payments/ - BANGE mobile payments integration",
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

# Include API routers
try:
    from app.api.v1 import auth, fiscal_services, users, taxes
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
    app.include_router(fiscal_services.router, prefix="/api/v1/fiscal-services", tags=["fiscal-services"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["user-management"])
    app.include_router(taxes.router, prefix="/api/v1/taxes", tags=["tax-management"])
    logger.info("✅ API routers loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ Some API routers not available: {e}")
    if settings.environment == "development":
        logger.info("🔄 Continuing in development mode with limited endpoints")

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