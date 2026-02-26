"""
⚙️ TaxasGE Backend Configuration
Gestion des configurations par environnement (dev/prod)
Compatible: Local Development, Firebase Functions, CI/CD

Author: KOUEMOU SAH Jean Emac
"""

import os
import secrets
from typing import List, Optional, Dict, Any
from functools import lru_cache
from loguru import logger

from pydantic_settings import BaseSettings
from pydantic import validator, Field
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# BASE CONFIGURATION CLASS
# ============================================================================

class Settings(BaseSettings):
    """
    Configuration de base pour TaxasGE Backend
    Utilise Pydantic pour validation et gestion des types
    """

    def __init__(self, **kwargs):
        """Initialize settings and load secrets from Google Cloud Secret Manager"""
        super().__init__(**kwargs)

        # Load SMTP_PASSWORD from Secret Manager (secret: smtp-password)
        if not self.SMTP_PASSWORD:
            try:
                from app.core.secrets import get_smtp_password
                secret_pass = get_smtp_password()
                if secret_pass:
                    self.SMTP_PASSWORD = secret_pass
                    logger.info("✅ SMTP password loaded from Secret Manager")
                else:
                    # Fallback to env var
                    self.SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
                    if self.SMTP_PASSWORD:
                        logger.warning("⚠️ SMTP password loaded from env var (local dev)")
                    else:
                        logger.error("❌ SMTP_PASSWORD not configured (emails will fail)")
            except Exception as e:
                logger.error(f"❌ Failed to load SMTP password from Secret Manager: {e}")
                self.SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
        
        # Load Firebase Admin Keys from Secret Manager
        try:
            from app.core.secrets import get_secret
            
            # Load Dev Firebase Key
            firebase_key_dev = get_secret("firebase-admin-key-dev")
            if firebase_key_dev:
                self.FIREBASE_ADMIN_KEY_DEV = firebase_key_dev
                logger.info("✅ Firebase Admin Key (DEV) loaded from Secret Manager")
            else:
                logger.warning("⚠️ Firebase Admin Key (DEV) not found in Secret Manager")
            
            # Load Pro Firebase Key
            firebase_key_pro = get_secret("firebase-admin-key-pro")
            if firebase_key_pro:
                self.FIREBASE_ADMIN_KEY_PRO = firebase_key_pro
                logger.info("✅ Firebase Admin Key (PRO) loaded from Secret Manager")
            else:
                logger.warning("⚠️ Firebase Admin Key (PRO) not found in Secret Manager")
                
        except Exception as e:
            logger.error(f"❌ Failed to load Firebase Admin Keys from Secret Manager: {e}")

    # ========================================================================
    # APPLICATION SETTINGS
    # ========================================================================
    
    PROJECT_NAME: str = "TaxasGE API"
    PROJECT_DESCRIPTION: str = "API de gestion fiscale pour la Guinée Équatoriale"
    VERSION: str = "1.0.0"
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="PORT")

    # Frontend URL (for email links, password reset, etc.)
    # Production domain: taxasge.emacsah.com
    FRONTEND_URL: str = Field(default="https://taxasge.emacsah.com", env="FRONTEND_URL")

    # Backend API Base URL (for webhooks callbacks)
    # Cloud Run URL or custom domain
    API_BASE_URL: str = Field(default="https://taxasge-backend-staging-677954753182.europe-west1.run.app", env="API_BASE_URL")
    
    # ========================================================================
    # SECURITY SETTINGS
    # ========================================================================
    
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32), env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32), env="JWT_SECRET_KEY")
    
    # Password hashing
    BCRYPT_ROUNDS: int = 12

    # Receipt verification (HMAC key for QR code security)
    RECEIPT_VERIFICATION_SECRET: str = Field(
        default="",
        env="RECEIPT_VERIFICATION_SECRET"
    )

    # ========================================================================
    # DATABASE SETTINGS
    # ========================================================================
    
    # Supabase Configuration (Optional for local development)
    SUPABASE_URL: Optional[str] = Field(default=None, env="SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None, env="SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_ANON_KEY: Optional[str] = Field(default=None, env="SUPABASE_ANON_KEY")
    
    # PostgreSQL Direct Connection (backup)
    DATABASE_URL: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # Database Pool Settings
    DB_POOL_SIZE: int = Field(default=5, env="DB_POOL_SIZE")
    DB_MAX_OVERFLOW: int = Field(default=10, env="DB_MAX_OVERFLOW")
    DB_POOL_TIMEOUT: int = Field(default=30, env="DB_POOL_TIMEOUT")

    # Connection Pool Settings (for asyncpg)
    # CRITICAL: Supabase free tier has ~60 total connections limit
    # Cloud Run can scale to multiple instances, so keep pool size SMALL
    DATABASE_MIN_CONNECTIONS: int = Field(default=2, env="DATABASE_MIN_CONNECTIONS")
    DATABASE_MAX_CONNECTIONS: int = Field(default=5, env="DATABASE_MAX_CONNECTIONS")
    
    # ========================================================================
    # FIREBASE SETTINGS (Using actual GitHub Secrets names)
    # ========================================================================
    
    # Firebase Project Configuration
    FIREBASE_PROJECT_ID: str = Field(default="taxasge-dev", env="FIREBASE_PROJECT_ID")
    FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV: Optional[str] = Field(default=None, env="FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV")
    
    # Firebase Android App Configuration
    FIREBASE_ANDROID_APP_ID: Optional[str] = Field(default=None, env="FIREBASE_ANDROID_APP_ID")
    
    # Firebase Storage
    FIREBASE_STORAGE_BUCKET: Optional[str] = Field(default=None, env="FIREBASE_STORAGE_BUCKET")
    
    # ========================================================================
    # MONITORING & NOTIFICATIONS (Using actual GitHub Secrets names)
    # ========================================================================
    
    # SonarQube Integration
    SONAR_TOKEN: Optional[str] = Field(default=None, env="SONAR_TOKEN")
    
    # Slack Notifications
    SLACK_WEBHOOK_URL: Optional[str] = Field(default=None, env="SLACK_WEBHOOK_URL")
    
    # ========================================================================
    # CORS SETTINGS
    # ========================================================================
    
    ALLOWED_HOSTS: List[str] = Field(default=["*"])
    CORS_ORIGINS: List[str] = Field(default=[])
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # ========================================================================
    # LOGGING SETTINGS
    # ========================================================================
    
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = Field(default=None, env="LOG_FILE")
    
    # Structured logging
    ENABLE_STRUCTURED_LOGGING: bool = Field(default=True, env="ENABLE_STRUCTURED_LOGGING")
    
    # ========================================================================
    # AI/ML SETTINGS
    # ========================================================================

    # TensorFlow Lite Model (Legacy - deprecated)
    #AI_MODEL_PATH: str = Field(default="assets/ml/taxasge_model.tflite", env="AI_MODEL_PATH")
    #AI_TOKENIZER_PATH: str = Field(default="assets/ml/tokenizer.json", env="AI_TOKENIZER_PATH")
    #AI_INTENTS_PATH: str = Field(default="assets/ml/intents.json", env="AI_INTENTS_PATH")

    # AI Configuration
    AI_MAX_TOKENS: int = Field(default=512, env="AI_MAX_TOKENS")
    AI_CONFIDENCE_THRESHOLD: float = Field(default=0.7, env="AI_CONFIDENCE_THRESHOLD")

    # ========================================================================
    # GOOGLE CLOUD AI / VERTEX AI SETTINGS
    # ========================================================================

    # Google Cloud Project (inherited from Cloud Run environment)
    GOOGLE_CLOUD_PROJECT: str = Field(
        default="taxasge-dev",
        env="GOOGLE_CLOUD_PROJECT"
    )
    GOOGLE_CLOUD_LOCATION: str = Field(
        default="us-central1",
        env="GOOGLE_CLOUD_LOCATION"
    )

    # Gemini Models Configuration
    # Note: Gemini 1.5 models are retired. Using Gemini 2.0 Flash.
    # See: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions
    GEMINI_CHAT_MODEL: str = Field(
        default="gemini-2.0-flash",
        env="GEMINI_CHAT_MODEL"
    )
    GEMINI_PRO_MODEL: str = Field(
        default="gemini-2.0-flash",
        env="GEMINI_PRO_MODEL"
    )
    GEMINI_EMBEDDING_MODEL: str = Field(
        default="text-embedding-004",
        env="GEMINI_EMBEDDING_MODEL"
    )

    # Gemini Generation Configuration
    GEMINI_MAX_OUTPUT_TOKENS: int = Field(default=2048, env="GEMINI_MAX_OUTPUT_TOKENS")
    GEMINI_TEMPERATURE: float = Field(default=0.3, env="GEMINI_TEMPERATURE")
    GEMINI_TOP_P: float = Field(default=0.95, env="GEMINI_TOP_P")
    GEMINI_TOP_K: int = Field(default=40, env="GEMINI_TOP_K")

    # Embedding Configuration
    EMBEDDING_DIMENSIONS: int = Field(default=768, env="EMBEDDING_DIMENSIONS")
    EMBEDDING_BATCH_SIZE: int = Field(default=250, env="EMBEDDING_BATCH_SIZE")

    # Semantic Search Configuration
    SEMANTIC_SEARCH_TOP_K: int = Field(default=5, env="SEMANTIC_SEARCH_TOP_K")
    # Low threshold (0.1) to accept results - text-embedding-004 gives low similarities
    # for cross-language queries (fr/en -> es). Adjust via env var if needed.
    SEMANTIC_SEARCH_SIMILARITY_THRESHOLD: float = Field(
        default=0.1,
        env="SEMANTIC_SEARCH_SIMILARITY_THRESHOLD"
    )

    # RAG Configuration
    RAG_MAX_CONTEXT_SERVICES: int = Field(default=5, env="RAG_MAX_CONTEXT_SERVICES")
    RAG_MAX_CONTEXT_DOCUMENTS: int = Field(default=5, env="RAG_MAX_CONTEXT_DOCUMENTS")
    RAG_CONVERSATION_HISTORY_LENGTH: int = Field(default=5, env="RAG_CONVERSATION_HISTORY_LENGTH")
    MAX_CONTEXT_TOKENS: int = Field(default=3000, env="MAX_CONTEXT_TOKENS")
    PDF_CHUNK_SIZE: int = Field(default=1000, env="PDF_CHUNK_SIZE")
    PDF_CHUNK_OVERLAP: int = Field(default=100, env="PDF_CHUNK_OVERLAP")
    SUGGESTION_SIMILARITY_THRESHOLD: float = Field(default=0.4, env="SUGGESTION_SIMILARITY_THRESHOLD")
    RAG_EXTENDED_SEARCH_TOP_K: int = Field(default=10, env="RAG_EXTENDED_SEARCH_TOP_K")
    RAG_MIN_CONTEXT_LENGTH: int = Field(default=100, env="RAG_MIN_CONTEXT_LENGTH")
    
    # ========================================================================
    # EXTERNAL SERVICES
    # ========================================================================
    
    # Bange Payment Integration
    BANGE_API_URL: Optional[str] = Field(default=None, env="BANGE_API_URL")
    BANGE_API_KEY: Optional[str] = Field(default=None, env="BANGE_API_KEY")
    BANGE_MERCHANT_ID: Optional[str] = Field(default=None, env="BANGE_MERCHANT_ID")
    BANGE_WEBHOOK_SECRET: Optional[str] = Field(default=None, env="BANGE_WEBHOOK_SECRET")
    
    # Email Service (MODULE_02)
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    SMTP_FROM_EMAIL: Optional[str] = Field(default=None, env="SMTP_FROM_EMAIL")
    SMTP_FROM_NAME: str = Field(default="TaxasGE Platform", env="SMTP_FROM_NAME")

    # SMTP_PASSWORD: Load from Secret Manager at startup
    # Will be set by __init__ method below
    SMTP_PASSWORD: Optional[str] = None
    
    # ========================================================================
    # FIREBASE ADMIN SDK
    # ========================================================================
    
    # Firebase Admin SDK Keys: Load from Secret Manager at startup
    # Will be set by __init__ method below
    FIREBASE_ADMIN_KEY_DEV: Optional[str] = None
    FIREBASE_ADMIN_KEY_PRO: Optional[str] = None
    
    # ========================================================================
    # CACHE SETTINGS
    # ========================================================================
    
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    CACHE_TTL: int = Field(default=3600, env="CACHE_TTL")  # 1 hour
    
    # ========================================================================
    # ASSIGNMENT OUTBOX
    # ========================================================================

    OUTBOX_BATCH_SIZE: int = Field(default=50, env="OUTBOX_BATCH_SIZE")
    OUTBOX_ORPHAN_THRESHOLD_MINUTES: int = Field(default=10, env="OUTBOX_ORPHAN_THRESHOLD_MINUTES")
    OUTBOX_STALE_PROCESSING_MINUTES: int = Field(default=5, env="OUTBOX_STALE_PROCESSING_MINUTES")
    OUTBOX_RETRY_DELAYS: str = Field(default="30,60,120,300,600", env="OUTBOX_RETRY_DELAYS")

    # ========================================================================
    # AGENT QUEUE
    # ========================================================================

    QUEUE_DEFAULT_SLA_HOURS: int = Field(default=48, env="QUEUE_DEFAULT_SLA_HOURS")
    QUEUE_ESCALATION_BOOST: int = Field(default=50, env="QUEUE_ESCALATION_BOOST")
    QUEUE_SLA_WARNING_HOURS: int = Field(default=6, env="QUEUE_SLA_WARNING_HOURS")
    QUEUE_MAX_WORKLOAD_PCT: float = Field(default=80.0, env="QUEUE_MAX_WORKLOAD_PCT")
    QUEUE_AGE_BOOST_24H: int = Field(default=10, env="QUEUE_AGE_BOOST_24H")
    QUEUE_AGE_BOOST_48H: int = Field(default=15, env="QUEUE_AGE_BOOST_48H")
    QUEUE_AGE_BOOST_72H: int = Field(default=25, env="QUEUE_AGE_BOOST_72H")

    # ========================================================================
    # ASSIGNMENT ESCALATION
    # ========================================================================

    ESCALATION_SLA_CRITICAL_HOURS: int = Field(default=0, env="ESCALATION_SLA_CRITICAL_HOURS")
    ESCALATION_SLA_HIGH_HOURS: int = Field(default=6, env="ESCALATION_SLA_HIGH_HOURS")
    ESCALATION_PROCESSING_MAX_HOURS: int = Field(default=24, env="ESCALATION_PROCESSING_MAX_HOURS")
    ESCALATION_PENDING_REVIEW_MAX_HOURS: int = Field(default=12, env="ESCALATION_PENDING_REVIEW_MAX_HOURS")
    REASSIGNMENT_COOLDOWN_HOURS: float = Field(default=1.0, env="REASSIGNMENT_COOLDOWN_HOURS")

    # ========================================================================
    # CRON SECURITY
    # ========================================================================

    CRON_SECRET: Optional[str] = Field(default=None, env="CRON_SECRET")

    # ========================================================================
    # RATE LIMITING
    # ========================================================================
    
    RATE_LIMIT_ENABLED: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # ========================================================================
    # MONITORING & METRICS
    # ========================================================================
    
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    # ========================================================================
    # VALIDATORS
    # ========================================================================
    
    @validator("API_PORT", pre=True)
    def validate_api_port(cls, v):
        """Convert API_PORT to integer if string"""
        if isinstance(v, str):
            return int(v)
        return v

    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Validate environment value"""
        allowed_envs = ["development", "testing", "staging", "production"]
        if v not in allowed_envs:
            raise ValueError(f"Environment must be one of: {allowed_envs}")
        return v
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level"""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v):
        """Parse allowed hosts from string or list"""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",") if host.strip()]
        return v
    
    # ========================================================================
    # COMPUTED PROPERTIES
    # ========================================================================
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode"""
        return self.ENVIRONMENT == "testing"
    
    @property
    def database_config(self) -> Dict[str, Any]:
        """Get database configuration"""
        return {
            "supabase_url": self.SUPABASE_URL,
            "supabase_key": self.SUPABASE_SERVICE_ROLE_KEY,
            "database_url": self.DATABASE_URL,
            "pool_size": self.DB_POOL_SIZE,
            "max_overflow": self.DB_MAX_OVERFLOW,
            "pool_timeout": self.DB_POOL_TIMEOUT
        }
    
    @property
    def firebase_config(self) -> Dict[str, Any]:
        """Get Firebase configuration using actual secret names"""
        return {
            "project_id": self.FIREBASE_PROJECT_ID,
            "service_account": self.FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV,
            "android_app_id": self.FIREBASE_ANDROID_APP_ID,
            "storage_bucket": self.FIREBASE_STORAGE_BUCKET
        }
    
    @property
    def monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring and notification configuration"""
        return {
            "sonar_token": self.SONAR_TOKEN,
            "slack_webhook": self.SLACK_WEBHOOK_URL
        }
    
    @property
    def ai_config(self) -> Dict[str, Any]:
        """Get AI/ML configuration (legacy - deprecated, using Gemini now)"""
        return {
            "max_tokens": self.AI_MAX_TOKENS,
            "confidence_threshold": self.AI_CONFIDENCE_THRESHOLD
        }

    @property
    def gemini_config(self) -> Dict[str, Any]:
        """Get Gemini AI configuration"""
        return {
            "project": self.GOOGLE_CLOUD_PROJECT,
            "location": self.GOOGLE_CLOUD_LOCATION,
            "chat_model": self.GEMINI_CHAT_MODEL,
            "pro_model": self.GEMINI_PRO_MODEL,
            "embedding_model": self.GEMINI_EMBEDDING_MODEL,
            "max_output_tokens": self.GEMINI_MAX_OUTPUT_TOKENS,
            "temperature": self.GEMINI_TEMPERATURE,
            "top_p": self.GEMINI_TOP_P,
            "top_k": self.GEMINI_TOP_K,
        }

    @property
    def rag_config(self) -> Dict[str, Any]:
        """Get RAG configuration"""
        return {
            "embedding_dimensions": self.EMBEDDING_DIMENSIONS,
            "embedding_batch_size": self.EMBEDDING_BATCH_SIZE,
            "search_top_k": self.SEMANTIC_SEARCH_TOP_K,
            "similarity_threshold": self.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD,
            "max_context_services": self.RAG_MAX_CONTEXT_SERVICES,
            "max_context_documents": self.RAG_MAX_CONTEXT_DOCUMENTS, # New
            "conversation_history_length": self.RAG_CONVERSATION_HISTORY_LENGTH,
            "max_context_tokens": self.MAX_CONTEXT_TOKENS, # New
            "pdf_chunk_size": self.PDF_CHUNK_SIZE,
            "pdf_chunk_overlap": self.PDF_CHUNK_OVERLAP,
            "suggestion_similarity_threshold": self.SUGGESTION_SIMILARITY_THRESHOLD,
            "extended_search_top_k": self.RAG_EXTENDED_SEARCH_TOP_K,
            "min_context_length": self.RAG_MIN_CONTEXT_LENGTH,
        }
    
    # ========================================================================
    # ENVIRONMENT-SPECIFIC CONFIGURATIONS
    # ========================================================================
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins based on environment"""
        if self.CORS_ORIGINS:
            return self.CORS_ORIGINS
        
        default_origins = {
            "development": [
                "http://localhost:3000",
                "http://localhost:8000",
                "http://localhost:8081",
                "https://taxasge-dev.web.app"
            ],
            "production": [
                "https://taxasge.app",
                "https://taxasge-prod.web.app"
            ],
            "testing": ["http://localhost:8000"]
        }
        
        return default_origins.get(self.ENVIRONMENT, default_origins["development"])
    
    def get_firebase_project_id(self) -> str:
        """Get Firebase project ID based on environment"""
        if self.FIREBASE_PROJECT_ID:
            return self.FIREBASE_PROJECT_ID
        
        project_ids = {
            "development": "taxasge-dev",
            "production": "taxasge-prod",
            "testing": "taxasge-test"
        }
        
        return project_ids.get(self.ENVIRONMENT, "taxasge-dev")
    
    # ========================================================================
    # PYDANTIC CONFIG
    # ========================================================================
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"  # ✅ CORRECTION: Permettre les champs supplémentaires
        
        # Custom environment variable parsing
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str) -> Any:
            """Custom environment variable parsing"""
            if field_name in ["DEBUG", "CORS_ALLOW_CREDENTIALS", "SMTP_USE_TLS", "RATE_LIMIT_ENABLED", "ENABLE_METRICS"]:
                return raw_val.lower() in ("true", "1", "yes", "on")
            return raw_val

# ============================================================================
# CONFIGURATION FACTORY
# ============================================================================

@lru_cache()
def get_settings() -> Settings:
    """
    Get settings instance (cached)
    This function is cached to ensure singleton behavior
    """
    return Settings()

# ============================================================================
# ENVIRONMENT-SPECIFIC SETTINGS
# ============================================================================

class DevelopmentSettings(Settings):
    """Development environment settings"""
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

class ProductionSettings(Settings):
    """Production environment settings"""
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

class TestingSettings(Settings):
    """Testing environment settings"""
    ENVIRONMENT: str = "testing"
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

# ============================================================================
# SETTINGS FACTORY
# ============================================================================

def get_settings_by_environment(environment: str) -> Settings:
    """Get settings based on environment"""
    settings_map = {
        "development": DevelopmentSettings,
        "production": ProductionSettings,
        "testing": TestingSettings
    }
    
    settings_class = settings_map.get(environment, DevelopmentSettings)
    return settings_class()

# ============================================================================
# EXPORT DEFAULT SETTINGS
# ============================================================================

# Default settings instance
settings = get_settings()

# ============================================================================