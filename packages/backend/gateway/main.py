"""
🚀 TaxasGE API Gateway - Point d'entrée unique centralisé
Gestion de tous les endpoints avec sécurité, monitoring et cache
Architecture pour 547 services fiscaux + endpoints admin complets
"""

from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
import asyncio
import time
import json
from datetime import datetime, timedelta
import uvicorn
import redis.asyncio as redis
import asyncpg
from loguru import logger

# Configuration
from gateway.config.settings import Settings
from gateway.config.routing_config import RoutingConfig
from gateway.config.security_config import SecurityConfig

# Middleware
from gateway.middleware.authentication import AuthenticationMiddleware
from gateway.middleware.authorization import AuthorizationMiddleware
from gateway.middleware.rate_limiting import RateLimitingMiddleware
from gateway.middleware.logging import LoggingMiddleware
from gateway.middleware.monitoring import MonitoringMiddleware
from gateway.middleware.cors import CORSMiddleware as CustomCORSMiddleware

# Services
from gateway.services.discovery import ServiceDiscovery
from gateway.services.health_check import HealthChecker
from gateway.services.load_balancer import LoadBalancer
from gateway.services.circuit_breaker import CircuitBreaker

# Security
from gateway.security.jwt_manager import JWTManager
from gateway.security.api_keys import APIKeyManager
from gateway.security.permissions import PermissionManager

# Utils
from gateway.utils.response_formatter import ResponseFormatter
from gateway.utils.error_handler import ErrorHandler
from gateway.utils.cache_manager import CacheManager
from gateway.utils.validators import RequestValidator

# Routes
from gateway.routes.v1.registry import APIRegistry

# Configuration globale
settings = Settings()
routing_config = RoutingConfig()
security_config = SecurityConfig()

# Services globaux
jwt_manager = JWTManager()
api_key_manager = APIKeyManager()
permission_manager = PermissionManager()
service_discovery = ServiceDiscovery()
health_checker = HealthChecker()
load_balancer = LoadBalancer()
circuit_breaker = CircuitBreaker()
cache_manager = CacheManager()
response_formatter = ResponseFormatter()
error_handler = ErrorHandler()
request_validator = RequestValidator()

# Connexions globales
db_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[redis.Redis] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie du gateway"""
    global db_pool, redis_client

    try:
        # Initialize database pool
        db_pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=20,
            max_size=100,
            command_timeout=60,
            server_settings={"application_name": "taxasge_gateway"}
        )
        logger.info("✅ Database pool initialized")

        # Initialize Redis
        redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            max_connections=50
        )
        await redis_client.ping()
        logger.info("✅ Redis connection initialized")

        # Initialize services
        await cache_manager.initialize(redis_client)
        await service_discovery.initialize(db_pool)
        await health_checker.start_monitoring()
        await circuit_breaker.initialize()

        # Register all routes
        api_registry = APIRegistry()
        await api_registry.register_all_services()
        logger.info(f"✅ {api_registry.get_services_count()} services registered")

        # Initialize security managers
        await jwt_manager.initialize(settings.secret_key)
        await api_key_manager.initialize(db_pool)
        await permission_manager.initialize(db_pool)

        logger.info("🚀 TaxasGE API Gateway initialized successfully")

    except Exception as e:
        logger.error(f"❌ Failed to initialize gateway: {e}")
        raise

    yield

    # Shutdown cleanup
    try:
        if db_pool:
            await db_pool.close()
            logger.info("🔄 Database pool closed")
        if redis_client:
            await redis_client.close()
            logger.info("🔄 Redis connection closed")
        await health_checker.stop_monitoring()
        await circuit_breaker.close()
        logger.info("🔄 Gateway shutdown completed")
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")

# Application FastAPI Gateway
app = FastAPI(
    title="TaxasGE API Gateway",
    description="🏛️ Centralized API Gateway for Guinea's fiscal services platform",
    version="2.0.0",
    docs_url="/gateway/docs" if settings.debug else None,
    redoc_url="/gateway/redoc" if settings.debug else None,
    openapi_url="/gateway/openapi.json" if settings.debug else None,
    lifespan=lifespan,
    default_response_class=JSONResponse
)

# Middleware stack (ordre d'exécution important)
app.add_middleware(MonitoringMiddleware)          # Métriques (premier)
app.add_middleware(LoggingMiddleware)             # Logging
app.add_middleware(RateLimitingMiddleware)        # Rate limiting
app.add_middleware(AuthorizationMiddleware)       # Autorisation
app.add_middleware(AuthenticationMiddleware)      # Authentification

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=security_config.allowed_hosts
)

# CORS middleware (dernier)
app.add_middleware(
    CustomCORSMiddleware,
    allow_origins=security_config.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Remaining", "X-RateLimit-Reset"]
)

# Dependency providers
async def get_db():
    """Fournir une connexion database"""
    if db_pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    async with db_pool.acquire() as connection:
        yield connection

async def get_redis():
    """Fournir une connexion Redis"""
    if redis_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cache not available"
        )
    return redis_client

async def get_current_user(request: Request):
    """Obtenir l'utilisateur authentifié"""
    if hasattr(request.state, "user"):
        return request.state.user
    return None

# === ENDPOINTS GATEWAY ===

@app.get("/gateway/health")
async def gateway_health():
    """Health check complet du gateway et des services"""
    start_time = time.time()

    # Check gateway components
    gateway_status = {
        "gateway": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "uptime_seconds": time.time() - start_time
    }

    # Check external dependencies
    checks = {}

    # Database check
    try:
        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            checks["database"] = {"status": "healthy", "response_time_ms": round((time.time() - start_time) * 1000, 2)}
        else:
            checks["database"] = {"status": "unavailable"}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "error": str(e)}

    # Redis check
    try:
        if redis_client:
            await redis_client.ping()
            checks["redis"] = {"status": "healthy", "response_time_ms": round((time.time() - start_time) * 1000, 2)}
        else:
            checks["redis"] = {"status": "unavailable"}
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "error": str(e)}

    # Services health
    services_status = await health_checker.check_all_services()
    checks["services"] = services_status

    # Overall status
    overall_status = "healthy"
    if any(check.get("status") == "unhealthy" for check in checks.values() if isinstance(check, dict)):
        overall_status = "unhealthy"
    elif any(check.get("status") == "unavailable" for check in checks.values() if isinstance(check, dict)):
        overall_status = "degraded"

    return response_formatter.success({
        **gateway_status,
        "status": overall_status,
        "checks": checks
    })

@app.get("/gateway/metrics")
async def gateway_metrics():
    """Métriques détaillées du gateway"""
    monitoring = MonitoringMiddleware()
    metrics = await monitoring.get_detailed_metrics()

    return response_formatter.success({
        "metrics": metrics,
        "collection_time": datetime.utcnow().isoformat()
    })

@app.get("/gateway/routes")
async def list_all_routes():
    """Liste complète des routes enregistrées"""
    api_registry = APIRegistry()
    routes = api_registry.get_all_routes()

    # Grouper par service
    routes_by_service = {}
    for route_key, route_config in routes.items():
        service_name = route_key.split()[1].split('/')[3] if len(route_key.split()[1].split('/')) > 3 else "root"
        if service_name not in routes_by_service:
            routes_by_service[service_name] = []

        routes_by_service[service_name].append({
            "method": route_config.method,
            "path": route_config.path,
            "route_type": route_config.route_type.value,
            "permissions": route_config.permissions or [],
            "rate_limit": route_config.rate_limit,
            "cache_ttl": route_config.cache_ttl,
            "description": route_config.description
        })

    return response_formatter.success({
        "total_routes": len(routes),
        "services_count": api_registry.get_services_count(),
        "routes_by_service": routes_by_service,
        "gateway_version": "2.0.0"
    })

@app.get("/gateway/stats")
async def gateway_statistics():
    """Statistiques d'utilisation du gateway"""
    monitoring = MonitoringMiddleware()

    stats = {
        "requests_today": await monitoring.get_requests_count_today(),
        "top_endpoints": await monitoring.get_top_endpoints(limit=10),
        "response_times": await monitoring.get_avg_response_times(),
        "error_rates": await monitoring.get_error_rates(),
        "active_users": await monitoring.get_active_users_count(),
        "cache_hit_rate": await cache_manager.get_hit_rate(),
        "circuit_breaker_stats": circuit_breaker.get_stats()
    }

    return response_formatter.success(stats)

@app.get("/gateway/config")
async def gateway_configuration(current_user = Depends(get_current_user)):
    """Configuration actuelle du gateway (admin only)"""
    if not current_user or not permission_manager.has_permission(current_user, "admin:gateway:read"):
        raise HTTPException(status_code=403, detail="Permissions insuffisantes")

    config = {
        "environment": settings.environment,
        "debug": settings.debug,
        "rate_limits": routing_config.rate_limits,
        "cache_config": routing_config.cache_config,
        "security_config": {
            "jwt_expiry": security_config.jwt_expiry_hours,
            "allowed_hosts": security_config.allowed_hosts,
            "cors_origins": security_config.cors_origins
        },
        "services_registered": service_discovery.get_registered_services()
    }

    return response_formatter.success(config)

# === ROUTES DYNAMIQUES ===

# Importer et enregistrer tous les routers
from gateway.routes.v1.public import public_router
from gateway.routes.v1.authenticated import authenticated_router
from gateway.routes.v1.admin import admin_router

# Routes publiques (sans authentification)
app.include_router(
    public_router,
    prefix="/api/v1/public",
    tags=["Public"]
)

# Routes authentifiées
app.include_router(
    authenticated_router,
    prefix="/api/v1",
    tags=["Authenticated"],
    dependencies=[Depends(jwt_manager.verify_token)]
)

# Routes admin
app.include_router(
    admin_router,
    prefix="/api/v1/admin",
    tags=["Administration"],
    dependencies=[Depends(jwt_manager.verify_admin_token)]
)

# === ERROR HANDLERS ===

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Gestionnaire d'erreurs HTTP standardisé"""
    return await error_handler.handle_http_error(request, exc)

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Gestionnaire d'erreurs générales"""
    return await error_handler.handle_general_error(request, exc)

# === STARTUP EVENTS ===

@app.on_event("startup")
async def startup_event():
    """Événements au démarrage"""
    logger.info("🚀 TaxasGE API Gateway starting...")

@app.on_event("shutdown")
async def shutdown_event():
    """Événements à l'arrêt"""
    logger.info("🔄 TaxasGE API Gateway shutting down...")

# === ROOT ENDPOINT ===

@app.get("/")
async def gateway_root():
    """Point d'entrée racine du gateway"""
    return response_formatter.success({
        "service": "TaxasGE API Gateway",
        "version": "2.0.0",
        "description": "🏛️ Centralized gateway for Guinea's fiscal services",
        "features": {
            "fiscal_services": "547 services available",
            "languages": ["Spanish", "French", "English"],
            "admin_endpoints": "Complete CRUD + Analytics",
            "ai_assistant": "Conversational support",
            "payments": "BANGE integration",
            "security": "JWT + API Keys + RBAC"
        },
        "endpoints": {
            "health": "/gateway/health",
            "metrics": "/gateway/metrics",
            "routes": "/gateway/routes",
            "stats": "/gateway/stats",
            "docs": "/gateway/docs" if settings.debug else "restricted",
            "api_v1": "/api/v1/"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment
    })

# === DEVELOPMENT SERVER ===

if __name__ == "__main__":
    uvicorn.run(
        "gateway.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        access_log=settings.debug,
        log_level="info" if settings.debug else "warning",
        workers=1 if settings.debug else 4
    )