#!/usr/bin/env python3
"""
🐍 TaxasGE Backend Setup - Script de génération automatique
Génère et configure automatiquement le backend selon l'environnement détecté

Author: KOUEMOU SAH Jean Emac
Compatible: Local Development, CI/CD, Firebase Functions
"""

import os
import sys
import json
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import argparse

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "packages" / "backend"
CONFIG_DIR = PROJECT_ROOT / "config"

# Environment detection
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CI_ENVIRONMENT = os.getenv("CI", "false").lower() == "true"
GITHUB_ACTIONS = os.getenv("GITHUB_ACTIONS", "false").lower() == "true"

# ============================================================================
# LOGGING SETUP
# ============================================================================

def log_info(message: str) -> None:
    """Log info message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] ℹ️  {message}")

def log_success(message: str) -> None:
    """Log success message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] ✅ {message}")

def log_warning(message: str) -> None:
    """Log warning message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] ⚠️  {message}")

def log_error(message: str) -> None:
    """Log error message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] ❌ {message}")

# ============================================================================
# ENVIRONMENT DETECTION
# ============================================================================

def detect_environment() -> str:
    """
    Détecte automatiquement l'environnement d'exécution
    Ordre de priorité: ENV var > Git branch > Default
    """
    # 1. Variable d'environnement explicite
    if os.getenv("ENVIRONMENT"):
        env = os.getenv("ENVIRONMENT")
        log_info(f"Environment détecté via variable: {env}")
        return env
    
    # 2. Détection GitHub Actions
    if GITHUB_ACTIONS:
        github_ref = os.getenv("GITHUB_REF", "")
        if "refs/heads/main" in github_ref:
            log_info("Environment détecté via GitHub Actions: production (main branch)")
            return "production"
        elif "refs/heads/develop" in github_ref:
            log_info("Environment détecté via GitHub Actions: development (develop branch)")
            return "development"
        else:
            log_info("Environment détecté via GitHub Actions: testing (autre branch)")
            return "testing"
    
    # 3. Détection Git local
    try:
        import subprocess
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )
        if result.returncode == 0:
            branch = result.stdout.strip()
            if branch == "main":
                log_info(f"Environment détecté via Git branch: production ({branch})")
                return "production"
            elif branch == "develop":
                log_info(f"Environment détecté via Git branch: development ({branch})")
                return "development"
            else:
                log_info(f"Environment détecté via Git branch: testing ({branch})")
                return "testing"
    except Exception as e:
        log_warning(f"Impossible de détecter la branche Git: {e}")
    
    # 4. Default fallback
    log_info("Environment par défaut: development")
    return "development"

# ============================================================================
# CONFIGURATION LOADING
# ============================================================================

def load_environments_config() -> Dict[str, Any]:
    """Charge la configuration des environnements"""
    config_file = CONFIG_DIR / "environments.json"
    
    if not config_file.exists():
        log_error(f"Fichier de configuration non trouvé: {config_file}")
        sys.exit(1)
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        log_success(f"Configuration chargée: {config_file}")
        return config
    except Exception as e:
        log_error(f"Erreur lors du chargement de la configuration: {e}")
        sys.exit(1)

def get_environment_config(config: Dict[str, Any], environment: str) -> Dict[str, Any]:
    """Récupère la configuration pour un environnement spécifique"""
    if environment not in config.get("environments", {}):
        log_error(f"Environment '{environment}' non trouvé dans la configuration")
        available_envs = list(config.get("environments", {}).keys())
        log_info(f"Environments disponibles: {available_envs}")
        sys.exit(1)
    
    env_config = config["environments"][environment]
    shared_config = config.get("shared", {})
    
    # Merge shared config with environment-specific config
    merged_config = {
        "environment": environment,
        "shared": shared_config,
        **env_config
    }
    
    log_success(f"Configuration '{environment}' chargée")
    return merged_config

# ============================================================================
# BACKEND CONFIGURATION GENERATION
# ============================================================================

def generate_backend_config(env_config: Dict[str, Any]) -> Dict[str, Any]:
    """Génère la configuration backend pour l'environnement"""
    backend_config = {
        "environment": env_config["environment"],
        "name": env_config["name"],
        "description": env_config["description"],
        "generated_at": datetime.now().isoformat(),
        "generator": "setup-backend.py",
        "version": env_config.get("shared", {}).get("app_info", {}).get("version", "1.0.0"),
        
        # API Configuration
        "api": {
            "base_url": env_config["api"]["base_url"],
            "version": env_config["api"]["version"],
            "timeout": env_config["api"]["timeout"],
            "rate_limit": env_config["api"]["rate_limit"]
        },
        
        # Database Configuration
        "database": {
            "supabase": env_config["supabase"],
            "connection_pool": {
                "min_size": 1,
                "max_size": 10 if env_config["environment"] == "production" else 5,
                "timeout": 30
            }
        },
        
        # Firebase Configuration
        "firebase": env_config["firebase"],
        
        # AI Configuration
        "ai": env_config["ai"],
        
        # Features
        "features": env_config["features"],
        
        # Logging
        "logging": env_config["logging"],
        
        # Security
        "security": env_config["security"]
    }
    
    return backend_config

def write_backend_config(backend_config: Dict[str, Any]) -> None:
    """Écrit la configuration backend dans un fichier JSON"""
    config_file = BACKEND_DIR / ".env.backend.json"
    
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(backend_config, f, indent=2, ensure_ascii=False)
        log_success(f"Configuration backend écrite: {config_file}")
    except Exception as e:
        log_error(f"Erreur lors de l'écriture de la configuration: {e}")
        sys.exit(1)

# ============================================================================
# DYNAMIC MAIN.PY GENERATION
# ============================================================================

def generate_dynamic_main_py(env_config: Dict[str, Any]) -> str:
    """Génère le contenu du main.py adapté à l'environnement"""
    
    environment = env_config["environment"]
    features = env_config["features"]
    api_config = env_config["api"]
    
    # Template main.py dynamique
    main_py_content = f'''"""
🚀 TaxasGE Backend API - Generated for {environment}
Auto-generated by setup-backend.py on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

Environment: {environment}
Features: {", ".join([k for k, v in features.items() if v])}
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

ENVIRONMENT = "{environment}"
DEBUG = {str(features.get("debug_tools", False)).lower()}
FEATURES = {json.dumps(features, indent=4)}

# ============================================================================
# APPLICATION LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for {environment}"""
    # Startup
    logging.info(f"🚀 TaxasGE API starting - Environment: {environment}")
    
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
    title="TaxasGE API ({environment})",
    description="{env_config['description']}",
    version="{env_config.get('shared', {}).get('app_info', {}).get('version', '1.0.0')}",
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
    allow_origins={json.dumps(env_config.get("cors_origins", ["*"]))},
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/")
async def root() -> Dict[str, Any]:
    """Point d'entrée racine - {environment}"""
    return {{
        "message": "🚀 TaxasGE API",
        "environment": "{environment}",
        "version": "{env_config.get('shared', {}).get('app_info', {}).get('version', '1.0.0')}",
        "status": "operational",
        "description": "{env_config['description']}",
        "features": FEATURES,
        "docs": "/docs" if DEBUG else "Documentation disponible en développement",
        "generated_at": "{datetime.now().isoformat()}"
    }}

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check for {environment}"""
    import time
    import sys
    
    return {{
        "status": "healthy",
        "service": "taxasge-backend",
        "environment": "{environment}",
        "version": "{env_config.get('shared', {}).get('app_info', {}).get('version', '1.0.0')}",
        "timestamp": int(time.time()),
        "python_version": sys.version,
        "debug_mode": DEBUG,
        "features": FEATURES,
        "checks": {{
            "api": "ok",
            "database": "pending",
            "firebase": "pending"
        }}
    }}

@app.get("/api/v1/")
async def api_v1_root() -> Dict[str, Any]:
    """API v1 entry point for {environment}"""
    return {{
        "message": "TaxasGE API v1",
        "environment": "{environment}",
        "version": "{env_config.get('shared', {}).get('app_info', {}).get('version', '1.0.0')}",
        "available_endpoints": {{
            "auth": "/api/v1/auth/",
            "taxes": "/api/v1/taxes/",
            "users": "/api/v1/users/",
            "declarations": "/api/v1/declarations/",
            "payments": "/api/v1/payments/",
            "ai": "/api/v1/ai/"
        }},
        "documentation": "/docs" if DEBUG else "Contact admin for API documentation"
    }}

# ============================================================================
# FIREBASE FUNCTIONS COMPATIBILITY
# ============================================================================

@functions_framework.http
def main(request):
    """Entry point for Firebase Functions - {environment}"""
    return app

# ============================================================================
# LOCAL DEVELOPMENT SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    config = {{
        "app": "main:app",
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", 8000)),
        "reload": DEBUG,
        "log_level": "debug" if DEBUG else "info",
        "access_log": DEBUG
    }}
    
    print(f"""
    🚀 TaxasGE Backend API - {environment.upper()}
    
    📊 Configuration:
    ├── Environment: {environment}
    ├── Debug: {{DEBUG}}
    ├── Port: {{config['port']}}
    └── Features: {len([k for k, v in features.items() if v])} enabled
    
    📡 Endpoints:
    ├── Root: http://localhost:{{config['port']}}/
    ├── Health: http://localhost:{{config['port']}}/health
    ├── API v1: http://localhost:{{config['port']}}/api/v1/
    └── Docs: http://localhost:{{config['port']}}/docs
    
    ✅ Optimisé pour {environment} !
    """)
    
    uvicorn.run(**config)

# ============================================================================
'''
    
    return main_py_content

def write_dynamic_main_py(content: str) -> None:
    """Écrit le main.py généré dynamiquement"""
    main_py_file = BACKEND_DIR / "main.py"
    
    # Backup existing main.py
    if main_py_file.exists():
        backup_file = BACKEND_DIR / f"main.py.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(main_py_file, backup_file)
        log_info(f"Backup créé: {backup_file}")
    
    try:
        with open(main_py_file, 'w', encoding='utf-8') as f:
            f.write(content)
        log_success(f"main.py généré pour l'environnement: {main_py_file}")
    except Exception as e:
        log_error(f"Erreur lors de l'écriture de main.py: {e}")
        sys.exit(1)

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Fonction principale du script"""
    parser = argparse.ArgumentParser(description="TaxasGE Backend Setup Script")
    parser.add_argument(
        "--environment", 
        choices=["development", "testing", "production"],
        help="Force l'environnement (sinon auto-détecté)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mode simulation (n'écrit pas les fichiers)"
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        default=True,
        help="Créer des backups des fichiers existants"
    )
    
    args = parser.parse_args()
    
    print("🐍 TaxasGE Backend Setup - Configuration dynamique")
    print("=" * 60)
    
    # 1. Détection environnement
    environment = args.environment or detect_environment()
    log_info(f"Environment sélectionné: {environment}")
    
    # 2. Chargement configuration
    log_info("Chargement de la configuration...")
    config = load_environments_config()
    env_config = get_environment_config(config, environment)
    
    # 3. Génération configuration backend
    log_info("Génération de la configuration backend...")
    backend_config = generate_backend_config(env_config)
    
    # 4. Génération main.py dynamique
    log_info("Génération du main.py dynamique...")
    main_py_content = generate_dynamic_main_py(env_config)
    
    # 5. Écriture des fichiers (si pas en mode dry-run)
    if args.dry_run:
        log_warning("Mode dry-run: aucun fichier ne sera écrit")
        print("\\n📄 Configuration backend qui serait générée:")
        print(json.dumps(backend_config, indent=2, ensure_ascii=False)[:500] + "...")
        print("\\n📄 main.py qui serait généré:")
        print(main_py_content[:500] + "...")
    else:
        log_info("Écriture des fichiers...")
        write_backend_config(backend_config)
        write_dynamic_main_py(main_py_content)
        
        log_success("🎉 Configuration backend terminée avec succès !")
        print(f"""
📊 Résumé:
├── Environment: {environment}
├── Configuration: .env.backend.json
├── Main.py: Généré dynamiquement
├── Features activées: {len([k for k, v in env_config['features'].items() if v])}
└── Prêt pour: {env_config['description']}

🚀 Prochaines étapes:
1. cd packages/backend
2. python main.py
3. Tester: http://localhost:8000/
        """)

if __name__ == "__main__":
    main()

# ============================================================================