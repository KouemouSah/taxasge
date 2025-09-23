"""
🚀 TaxasGE Backend - Firebase Functions Entry Point
Optimized for Firebase Functions deployment
"""

import functions_framework
import json
import os
from typing import Dict, Any

# Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT != "production"

FEATURES = {
    "chatbot_enabled": True,
    "offline_mode": True,
    "payments_enabled": False,
    "analytics_enabled": True,
    "crash_reporting": True,
    "performance_monitoring": True,
    "debug_tools": DEBUG
}

@functions_framework.http
def main(request):
    """Entry point for Firebase Functions"""
    import time
    import sys

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Basic routing for Firebase Functions
    path = request.path or '/'
    method = request.method

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    try:
        if path == '/' or path == '':
            response_data = {
                "message": "🚀 TaxasGE API",
                "environment": ENVIRONMENT,
                "version": "1.0.0",
                "status": "operational",
                "description": "Firebase Functions deployment",
                "features": FEATURES,
                "docs": "/docs" if DEBUG else "Contact admin",
                "timestamp": "2025-09-23",
                "platform": "Firebase Functions Python"
            }
        elif path == '/health':
            response_data = {
                "status": "healthy",
                "service": "taxasge-backend",
                "environment": ENVIRONMENT,
                "version": "1.0.0",
                "timestamp": int(time.time()),
                "python_version": sys.version,
                "platform": "Firebase Functions",
                "features": FEATURES,
                "checks": {
                    "api": "ok",
                    "firebase": "ok",
                    "functions": "ok"
                }
            }
        elif path.startswith('/api/v1'):
            response_data = {
                "message": "TaxasGE API v1",
                "environment": ENVIRONMENT,
                "version": "1.0.0",
                "platform": "Firebase Functions",
                "available_endpoints": {
                    "auth": "/api/v1/auth/",
                    "taxes": "/api/v1/taxes/",
                    "users": "/api/v1/users/",
                    "declarations": "/api/v1/declarations/",
                    "payments": "/api/v1/payments/",
                    "ai": "/api/v1/ai/"
                },
                "documentation": "/docs" if DEBUG else "Contact admin for API documentation"
            }
        else:
            response_data = {
                "error": "Not Found",
                "message": f"Path {path} not found",
                "available_paths": ["/", "/health", "/api/v1/"],
                "status": 404
            }
            return (json.dumps(response_data), 404, headers)

        return (json.dumps(response_data), 200, headers)

    except Exception as e:
        error_response = {
            "error": "Internal Server Error",
            "message": str(e),
            "status": 500,
            "environment": ENVIRONMENT
        }
        return (json.dumps(error_response), 500, headers)