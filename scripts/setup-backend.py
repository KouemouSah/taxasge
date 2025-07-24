#!/usr/bin/env python3
"""
TaxasGE Backend Configuration Setup Script
Génère les fichiers de configuration backend basés sur l'environnement
Version corrigée sans firebase-functions (Node.js only)
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any

def detect_environment() -> str:
    """Détecte l'environnement d'exécution"""
    # Variables d'environnement pour détection
    if os.getenv('FUNCTION_TARGET') or os.getenv('K_SERVICE'):
        # Environment Firebase Functions (détecté via Node.js)
        project_id = os.getenv('GCP_PROJECT', os.getenv('GOOGLE_CLOUD_PROJECT', ''))
        if 'prod' in project_id:
            return 'firebase_prod'
        else:
            return 'firebase_dev'
    
    # Variables GitHub Actions ou environnement explicite
    env = os.getenv('ENVIRONMENT', os.getenv('NODE_ENV', ''))
    if env in ['testing', 'test']:
        return 'testing'
    elif env in ['production', 'prod']:
        return 'firebase_prod'
    elif env in ['development', 'dev']:
        return 'development'
    
    # Détection par défaut
    if os.getenv('CI'):
        return 'testing'
    else:
        return 'development'

def load_backend_config() -> Dict[str, Any]:
    """Charge la configuration backend"""
    config_path = Path('config/backend-config.json')
    
    if not config_path.exists():
        print(f"❌ Configuration file not found: {config_path}")
        sys.exit(1)
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"✅ Loaded backend configuration from {config_path}")
        return config
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {config_path}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error loading {config_path}: {e}")
        sys.exit(1)

def load_environment_config() -> Dict[str, Any]:
    """Charge la configuration des environnements Firebase"""
    env_path = Path('config/environments.json')
    
    if not env_path.exists():
        print(f"❌ Environment config not found: {env_path}")
        return {}
    
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Could not load environment config: {e}")
        return {}

def generate_app_config(environment: str, backend_config: Dict[str, Any], env_config: Dict[str, Any]) -> None:
    """Génère le fichier de configuration de l'application"""
    
    env_settings = backend_config['environments'].get(environment, backend_config['environments']['development'])
    
    # Configuration de l'application
    app_config = {
        "environment": environment,
        "mode": env_settings.get("mode", "fastapi"),
        "debug": env_settings.get("debug", False),
        "api": backend_config.get("api", {}),
        "database": backend_config.get("database", {}),
        "ai_model": backend_config.get("ai_model", {}),
        "settings": env_settings,
        "generated_at": "2025-07-24T19:00:00Z"
    }
    
    # Ajout des informations Firebase si disponibles
    firebase_env = 'dev' if 'dev' in environment else 'prod'
    if firebase_env in env_config:
        app_config["firebase"] = env_config[firebase_env]
    
    # Écriture du fichier de configuration
    config_file = Path('.env.backend.json')
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(app_config, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated {config_file}")

def generate_main_py(environment: str, backend_config: Dict[str, Any]) -> None:
    """Génère le fichier main.py dynamique - VERSION CORRIGÉE"""
    
    env_settings = backend_config['environments'].get(environment, backend_config['environments']['development'])
    api_config = backend_config.get('api', {})
    
    main_py_content = f'''"""
TaxasGE Backend - Dynamic Entry Point
Environment: {environment}
Mode: {env_settings.get("mode", "fastapi")}
Generated automatically by setup-backend.py
CORRECTED VERSION - Compatible with Python Firebase deployment
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

# Configuration de l'environnement
ENVIRONMENT = "{environment}"
MODE = "{env_settings.get("mode", "fastapi")}"
DEBUG = {env_settings.get("debug", False)}

def load_app_config() -> Dict[str, Any]:
    """Charge la configuration de l'application"""
    config_path = Path('.env.backend.json')
    if config_path.exists():
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {{}}

# Chargement de la configuration
app_config = load_app_config()

# Détection de l'environnement Firebase vs FastAPI
IS_FIREBASE_FUNCTIONS = os.getenv('FUNCTION_TARGET') or MODE.startswith('firebase')

if IS_FIREBASE_FUNCTIONS:
    # Mode Firebase Functions - Utilisation de functions-framework
    import functions_framework
    from flask import Request
    import json as json_lib
    
    @functions_framework.http
    def main(request: Request):
        """Firebase Functions entry point via functions-framework"""
        try:
            path = request.path.lower().rstrip('/')
            method = request.method.upper()
            
            # Routing basique
            if path == "" or path == "/" or path == "/api/main":
                response_data = {{
                    "message": "🚀 {api_config.get('title', 'TaxasGE API')}",
                    "version": "{api_config.get('version', '0.1.0')}",
                    "environment": ENVIRONMENT,
                    "mode": MODE,
                    "platform": "Firebase Functions (Python)",
                    "status": "running",
                    "timestamp": datetime.now().isoformat(),
                    "database": app_config.get("database", {{}}).get("provider", "Supabase"),
                    "total_taxes": app_config.get("database", {{}}).get("total_taxes", 547)
                }}
            elif path == "/health" or path == "/api/health":
                response_data = {{
                    "status": "healthy",
                    "environment": ENVIRONMENT,
                    "platform": "Firebase Functions (Python)",
                    "timestamp": datetime.now().isoformat(),
                    "services": {{
                        "database": "configured" if os.getenv("DATABASE_URL") else "not_configured",
                        "supabase": "configured" if os.getenv("SUPABASE_URL") else "not_configured",
                        "firebase": "connected",
                        "ai_model": app_config.get("ai_model", {{}}).get("name", "ready")
                    }}
                }}
            elif path == "/api/taxes" or path.startswith("/api/taxes"):
                response_data = {{
                    "message": "Tax information from Supabase",
                    "total_taxes": app_config.get("database", {{}}).get("total_taxes", 547),
                    "database": app_config.get("database", {{}}).get("provider", "Supabase"),
                    "languages": app_config.get("database", {{}}).get("languages", ["es", "fr", "en"]),
                    "status": "ready_for_import"
                }}
            else:
                response_data = {{
                    "error": "Endpoint not found",
                    "path": path,
                    "available_endpoints": ["/", "/health", "/api/taxes"],
                    "environment": ENVIRONMENT
                }}
            
            return json_lib.dumps(response_data, ensure_ascii=False), 200, {{'Content-Type': 'application/json; charset=utf-8'}}
            
        except Exception as e:
            error_response = {{
                "error": "Internal server error",
                "message": str(e)[:100],
                "environment": ENVIRONMENT,
                "timestamp": datetime.now().isoformat()
            }}
            return json_lib.dumps(error_response), 500, {{'Content-Type': 'application/json'}}

else:
    # Mode FastAPI (développement et tests)
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    
    # Création de l'application FastAPI
    app = FastAPI(
        title="{api_config.get('title', 'TaxasGE API')}",
        description="{api_config.get('description', 'API for Equatorial Guinea tax information')}",
        version="{api_config.get('version', '0.1.0')}",
        debug=DEBUG,
        docs_url="/docs" if {env_settings.get("features", {}).get("docs", True)} else None,
        redoc_url="/redoc" if {env_settings.get("features", {}).get("docs", True)} else None
    )
    
    # Configuration CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins={env_settings.get("cors_origins", ["*"])},
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/")
    async def root():
        """Endpoint racine"""
        return {{
            "message": "🚀 {api_config.get('title', 'TaxasGE API')}",
            "version": "{api_config.get('version', '0.1.0')}",
            "environment": ENVIRONMENT,
            "mode": MODE,
            "platform": "FastAPI",
            "status": "running",
            "timestamp": datetime.now().isoformat(),
            "database": app_config.get("database", {{}}).get("provider", "Supabase"),
            "total_taxes": app_config.get("database", {{}}).get("total_taxes", 547),
            "docs": "/docs" if {env_settings.get("features", {}).get("docs", True)} else "disabled"
        }}
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {{
            "status": "healthy",
            "environment": ENVIRONMENT,
            "platform": "FastAPI",
            "timestamp": datetime.now().isoformat(),
            "services": {{
                "database": "configured" if os.getenv("DATABASE_URL") else "not_configured",
                "supabase": "configured" if os.getenv("SUPABASE_URL") else "not_configured",
                "fastapi": "running",
                "ai_model": app_config.get("ai_model", {{}}).get("name", "ready")
            }},
            "config": {{
                "debug": DEBUG,
                "docs_enabled": {env_settings.get("features", {}).get("docs", True)},
                "metrics_enabled": {env_settings.get("features", {}).get("metrics", False)}
            }}
        }}
    
    @app.get("/api/taxes")
    async def get_taxes():
        """Get tax information"""
        return {{
            "message": "Tax information from Supabase",
            "total_taxes": app_config.get("database", {{}}).get("total_taxes", 547),
            "database": app_config.get("database", {{}}).get("provider", "Supabase"),
            "languages": app_config.get("database", {{}}).get("languages", ["es", "fr", "en"]),
            "status": "ready_for_import",
            "tables": app_config.get("database", {{}}).get("tables", [])
        }}
    
    # Point d'entrée pour uvicorn
    if __name__ == "__main__":
        import uvicorn
        host = "{env_settings.get('host', '0.0.0.0')}"
        port = {env_settings.get('port', 8000)}
        
        print(f"🚀 Starting TaxasGE API on {{host}}:{{port}}")
        print(f"📍 Environment: {{ENVIRONMENT}}")
        print(f"🔧 Mode: {{MODE}}")
        print(f"🐛 Debug: {{DEBUG}}")
        
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload={env_settings.get('reload', False)},
            log_level="{env_settings.get('log_level', 'info')}"
        )
'''
    
    # Écriture du fichier main.py
    main_py_path = Path('main.py')
    with open(main_py_path, 'w', encoding='utf-8') as f:
        f.write(main_py_content)
    
    print(f"✅ Generated {main_py_path} for environment: {environment}")

def main():
    """Fonction principale"""
    print("🔧 TaxasGE Backend Setup - Dynamic Configuration (CORRECTED)")
    
    # Détection de l'environnement
    environment = detect_environment()
    print(f"📍 Detected environment: {environment}")
    
    # Chargement des configurations
    backend_config = load_backend_config()
    env_config = load_environment_config()
    
    # Génération des fichiers
    generate_app_config(environment, backend_config, env_config)
    generate_main_py(environment, backend_config)
    
    print("")
    print("✅ Backend configuration setup completed successfully!")
    print("")
    print("📋 Generated files:")
    print("  - .env.backend.json (application configuration)")
    print("  - main.py (dynamic entry point - CORRECTED)")
    print("")
    print(f"🚀 Ready for environment: {environment}")
    print(f"🔧 Mode: {backend_config['environments'][environment]['mode']}")
    print("")
    print("📝 Note: Using functions-framework for Firebase Functions compatibility")

if __name__ == "__main__":
    main()
