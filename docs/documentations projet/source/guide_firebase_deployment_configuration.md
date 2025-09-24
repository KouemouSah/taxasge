# 🚀 CONFIGURATION FIREBASE TAXASGE - DEPLOYMENT READY
## Setup Complet avec Services Activés

---

## 📁 STRUCTURE PROJET FIREBASE

```
taxasge/
├── firebase.json          # Configuration principale
├── .firebaserc           # Projets Firebase
├── packages/
│   ├── backend/          # Firebase Functions
│   │   ├── main.py      # Entry point Functions
│   │   ├── requirements.txt
│   │   └── functions/   # Code Functions
│   └── frontend/        # React App pour hosting
│       ├── build/       # Build production
│       └── src/
├── storage.rules        # Firebase Storage rules
└── firestore.rules     # Firestore security rules
```

## 🔧 FIREBASE.JSON CONFIGURATION

```json
{
  "functions": [
    {
      "source": "packages/backend",
      "codebase": "default", 
      "runtime": "python311",
      "predeploy": [
        "cd packages/backend && pip install -r requirements.txt"
      ],
      "env": {
        "PYTHONPATH": "./packages/backend"
      }
    }
  ],
  "hosting": [
    {
      "target": "web-app",
      "public": "packages/frontend/build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "main"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "/api/**",
          "headers": [
            {
              "key": "Access-Control-Allow-Origin",
              "value": "*"
            },
            {
              "key": "Access-Control-Allow-Methods", 
              "value": "GET,HEAD,PUT,PATCH,POST,DELETE"
            },
            {
              "key": "Access-Control-Allow-Headers",
              "value": "Content-Type,Authorization"
            }
          ]
        }
      ]
    }
  ],
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}
```

## 🔧 .FIREBASERC CONFIGURATION  

```json
{
  "projects": {
    "default": "VOTRE-PROJECT-ID",
    "dev": "taxasge-dev", 
    "prod": "taxasge-prod"
  },
  "targets": {
    "VOTRE-PROJECT-ID": {
      "hosting": {
        "web-app": [
          "VOTRE-PROJECT-ID"
        ]
      }
    }
  },
  "etags": {}
}
```

## 🐍 BACKEND FIREBASE FUNCTIONS

### packages/backend/main.py
```python
import functions_framework
import json
import os
from datetime import datetime
from flask import Request
from typing import Any, Dict

@functions_framework.http
def main(request: Request) -> tuple[str, int, Dict[str, str]]:
    """
    Point d'entrée principal Firebase Functions
    Route tous les appels API vers les handlers appropriés
    """
    
    # Headers CORS pour toutes les réponses
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    # Gérer les requêtes OPTIONS (CORS preflight)
    if request.method == 'OPTIONS':
        return '', 204, cors_headers
    
    # Router selon le path
    path = request.path
    method = request.method
    
    try:
        if path == '/' or path == '/api/':
            return handle_root(), 200, cors_headers
            
        elif path == '/health' or path == '/api/health':
            return handle_health(), 200, cors_headers
            
        elif path.startswith('/api/v1/fiscal-services'):
            return handle_fiscal_services(request), 200, cors_headers
            
        elif path.startswith('/api/v1/search'):
            return handle_search(request), 200, cors_headers
            
        elif path.startswith('/api/v1/calculate'):
            return handle_calculate(request), 200, cors_headers
            
        else:
            return handle_not_found(path), 404, cors_headers
            
    except Exception as e:
        return handle_error(str(e)), 500, cors_headers

def handle_root() -> str:
    """Endpoint racine API"""
    response = {
        "message": "🚀 TaxasGE API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/health",
            "fiscal_services": "/api/v1/fiscal-services/",
            "search": "/api/v1/search/",
            "calculate": "/api/v1/calculate/"
        },
        "status": "operational"
    }
    return json.dumps(response, ensure_ascii=False)

def handle_health() -> str:
    """Health check endpoint"""
    response = {
        "status": "healthy",
        "service": "taxasge-backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "checks": {
            "api": "ok",
            "functions": "ok", 
            "firebase": "ok"
        }
    }
    return json.dumps(response)

def handle_fiscal_services(request: Request) -> str:
    """Handler pour les services fiscaux"""
    # TODO: Implémenter logique métier
    response = {
        "message": "Fiscal Services API",
        "method": request.method,
        "path": request.path,
        "available_endpoints": [
            "GET /api/v1/fiscal-services/search",
            "GET /api/v1/fiscal-services/hierarchy", 
            "GET /api/v1/fiscal-services/{id}",
            "POST /api/v1/fiscal-services/{id}/calculate"
        ]
    }
    return json.dumps(response)

def handle_search(request: Request) -> str:
    """Handler pour la recherche"""
    query = request.args.get('q', '')
    language = request.args.get('lang', 'es')
    
    # TODO: Implémenter recherche réelle
    response = {
        "query": query,
        "language": language,
        "results": [],
        "total": 0,
        "message": "Search functionality - coming soon"
    }
    return json.dumps(response)

def handle_calculate(request: Request) -> str:
    """Handler pour les calculs"""
    # TODO: Implémenter calculs fiscaux
    response = {
        "message": "Tax calculation API",
        "supported_calculations": [
            "expedition_amount",
            "renewal_amount", 
            "complex_formulas"
        ]
    }
    return json.dumps(response)

def handle_not_found(path: str) -> str:
    """Handler pour endpoints non trouvés"""
    response = {
        "error": "Not Found",
        "message": f"Endpoint {path} not found",
        "available_endpoints": [
            "/",
            "/health",
            "/api/v1/fiscal-services/",
            "/api/v1/search/",
            "/api/v1/calculate/"
        ]
    }
    return json.dumps(response)

def handle_error(error_message: str) -> str:
    """Handler pour les erreurs"""
    response = {
        "error": "Internal Server Error",
        "message": error_message,
        "timestamp": datetime.now().isoformat()
    }
    return json.dumps(response)
```

### packages/backend/requirements.txt
```txt
functions-framework>=3.5.0
flask>=2.3.0
requests>=2.31.0
python-dotenv>=1.0.0
```

## 🔐 STORAGE.RULES

```javascript
rules_version = '2';

// Firebase Storage Rules pour TaxasGE
service firebase.storage {
  match /b/{bucket}/o {
    // Documents utilisateurs (reçus, déclarations)
    match /user-documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null 
                      && request.auth.uid == userId;
    }
    
    // Fichiers publics (logos, assets)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.auth.token.admin == true;
    }
    
    // Uploads temporaires
    match /temp/{allPaths=**} {
      allow read, write: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

## 🚀 COMMANDES DÉPLOIEMENT IMMÉDIAT

### 1. Configuration Initiale
```bash
# Vérifier Firebase CLI
firebase --version

# Login Firebase (si pas déjà fait)
firebase login

# Initialiser le projet (dans le répertoire racine)
firebase init

# Sélectionner :
# - Functions (Python)
# - Hosting
# - Storage  
# - Authentication (déjà configuré)
```

### 2. Configuration Projet
```bash
# Lister vos projets Firebase
firebase projects:list

# Utiliser votre projet
firebase use [VOTRE-PROJECT-ID]

# Ou créer alias
firebase use --add
# Sélectionner projet et donner alias "prod"
```

### 3. Déploiement Backend
```bash
# Deploy Functions seulement
firebase deploy --only functions

# Deploy avec logs détaillés
firebase deploy --only functions --debug

# Vérifier le déploiement
firebase functions:log --limit 50
```

### 4. Test API Déployée
```bash
# Obtenir l'URL de votre fonction
firebase functions:list

# Tester l'API
curl https://us-central1-VOTRE-PROJECT-ID.cloudfunctions.net/main

# Tester health check
curl https://us-central1-VOTRE-PROJECT-ID.cloudfunctions.net/main/health
```

### 5. Déploiement Hosting (quand frontend prêt)
```bash
# Deploy hosting seulement
firebase deploy --only hosting

# Deploy complet (functions + hosting)
firebase deploy
```

## 📱 URLs FINALES APRÈS DÉPLOIEMENT

Après `firebase deploy`, vous obtiendrez :

**API Backend :**
```
https://us-central1-[VOTRE-PROJECT-ID].cloudfunctions.net/main
├── /                    # Info API
├── /health             # Health check
├── /api/v1/fiscal-services/  # Services fiscaux
├── /api/v1/search/     # Recherche
└── /api/v1/calculate/  # Calculs
```

**Frontend Web App :**
```
https://[VOTRE-PROJECT-ID].web.app
https://[VOTRE-PROJECT-ID].firebaseapp.com
```

## 🔧 CONFIGURATION MOBILE APP

Dans votre app React Native, utiliser l'URL Firebase réelle :

```typescript
// config/api.ts
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5001/VOTRE-PROJECT-ID/us-central1/main'
  : 'https://us-central1-VOTRE-PROJECT-ID.cloudfunctions.net/main';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## 🛠️ DEBUGGING ET MONITORING

### Logs Functions
```bash
# Voir logs en temps réel
firebase functions:log

# Logs spécifiques
firebase functions:log --only main

# Logs avec filtres
firebase functions:log --limit 100 --filter "ERROR"
```

### Monitoring Firebase Console
```
https://console.firebase.google.com/project/[VOTRE-PROJECT-ID]/
├── Functions → Voir métriques et logs
├── Hosting → Voir trafic et performance
├── Storage → Voir usage fichiers
└── Authentication → Gérer utilisateurs
```

## ⚠️ TROUBLESHOOTING COMMUN

### Problème : "Permission denied"
```bash
# Re-authentifier
firebase logout
firebase login
```

### Problème : "Project not found"
```bash
# Vérifier projet actuel
firebase projects:list
firebase use [CORRECT-PROJECT-ID]
```

### Problème : "Functions deployment failed"
```bash
# Vérifier requirements.txt
cd packages/backend && pip install -r requirements.txt

# Deploy avec debug
firebase deploy --only functions --debug
```

Ce setup vous donne une base solide pour déployer immédiatement votre backend sur Firebase avec les URLs réelles que Firebase génère automatiquement. Pas besoin du domaine custom api.taxasge.gq pour commencer - Firebase fournit des URLs fiables et performantes par défaut.
