{
  "environments": {
    "development": {
      "mode": "fastapi",
      "host": "0.0.0.0",
      "port": 8000,
      "debug": True,
      "reload": True,
      "log_level": "debug",
      "cors_origins": ["*"],
      "database": {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30
      },
      "features": {
        "docs": True,
        "metrics": True,
        "profiler": True
      }
    },
    "testing": {
      "mode": "fastapi",
      "host": "127.0.0.1",
      "port": 8000,
      "debug": False,
      "reload": False,
      "log_level": "warning",
      "cors_origins": ["http://localhost:3000"],
      "database": {
        "pool_size": 2,
        "max_overflow": 5,
        "pool_timeout": 10
      },
      "features": {
        "docs": False,
        "metrics": False,
        "profiler": False
      }
    },
    "firebase_dev": {
      "mode": "firebase_functions",
      "project_id": "taxasge-dev",
      "region": "us-central1",
      "debug": True,
      "log_level": "info",
      "cors_origins": ["https://taxasge-dev.web.app"],
      "database": {
        "pool_size": 3,
        "max_overflow": 7,
        "pool_timeout": 20
      },
      "features": {
        "docs": True,
        "metrics": True,
        "profiler": False
      }
    },
    "firebase_prod": {
      "mode": "firebase_functions",
      "project_id": "taxasge-prod",
      "region": "us-central1",
      "debug": False,
      "log_level": "error",
      "cors_origins": ["https://taxasge-prod.web.app"],
      "database": {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 60
      },
      "features": {
        "docs": False,
        "metrics": True,
        "profiler": False
      }
    }
  },
  "api": {
    "title": "TaxasGE API",
    "description": "API for Equatorial Guinea tax information and payments",
    "version": "0.1.0",
    "contact": {
      "name": "TaxasGE Support",
      "email": "support@taxasge.gq"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    }
  },
  "database": {
    "name": "taxasge-db",
    "provider": "supabase",
    "total_taxes": 547,
    "languages": ["es", "fr", "en"],
    "tables": [
      "ministerios",
      "sectores", 
      "categorias",
      "taxes",
      "documentos_requeridos",
      "procedimientos",
      "palabras_clave"
    ]
  },
  "ai_model": {
    "name": "taxasge_model.tflite",
    "size": "0.41MB",
    "accuracy": "100%",
    "training_questions": 62000,
    "languages": ["es", "fr", "en"]
  }
}
