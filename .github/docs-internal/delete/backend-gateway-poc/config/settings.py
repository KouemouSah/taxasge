"""
Configuration centralisée du gateway
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Configuration principale du gateway"""

    model_config = {"env_file": ".env", "extra": "ignore"}

    # Environment
    environment: str = Field(default="development", description="Environment (development, staging, production)")
    debug: bool = Field(default=True, description="Mode debug")

    # Database
    database_url: str = Field(
        default="postgresql://user:pass@localhost:5432/taxasge",
        description="URL de connexion PostgreSQL"
    )

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="URL de connexion Redis"
    )

    # Security
    secret_key: str = Field(
        default="taxasge-gateway-secret-key-change-in-production",
        description="Clé secrète pour JWT"
    )

    # API Configuration
    api_version: str = Field(default="2.0.0", description="Version de l'API")
    max_request_size: int = Field(default=10_000_000, description="Taille max requête (10MB)")
    request_timeout: int = Field(default=30, description="Timeout requête en secondes")

    # Rate Limiting
    default_rate_limit: int = Field(default=1000, description="Limite par défaut (req/heure)")
    auth_rate_limit: int = Field(default=10, description="Limite auth (req/5min)")
    admin_rate_limit: int = Field(default=5000, description="Limite admin (req/heure)")

    # Cache
    default_cache_ttl: int = Field(default=3600, description="TTL cache par défaut (secondes)")
    max_cache_size: int = Field(default=1000, description="Taille max cache (MB)")

    # Security Headers
    security_headers: bool = Field(default=True, description="Activer headers sécurité")

    # Monitoring
    enable_metrics: bool = Field(default=True, description="Activer métriques Prometheus")
    metrics_endpoint: str = Field(default="/gateway/metrics", description="Endpoint métriques")

    # External Services
    firebase_project_id: Optional[str] = Field(default=None, description="ID projet Firebase")
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN pour monitoring")

    @property
    def is_production(self) -> bool:
        """Vérifie si on est en production"""
        return self.environment.lower() == "production"

    @property
    def cors_origins(self) -> List[str]:
        """Origines CORS autorisées"""
        if self.debug:
            return ["*"]
        return [
            "https://taxasge-dev.web.app",
            "https://taxasge-pro.web.app",
            "https://taxasge-dev.firebaseapp.com",
            "https://taxasge-pro.firebaseapp.com"
        ]

    @property
    def allowed_hosts(self) -> List[str]:
        """Hosts autorisés"""
        if self.debug:
            return ["*"]
        return [
            "taxasge-dev.web.app",
            "taxasge-pro.web.app",
            "taxasge-dev.firebaseapp.com",
            "taxasge-pro.firebaseapp.com",
            "localhost",
            "127.0.0.1"
        ]

    class Config:
        env_file = ".env"
        case_sensitive = False