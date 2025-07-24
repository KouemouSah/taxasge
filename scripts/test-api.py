#!/usr/bin/env python3
"""
TaxasGE Backend - API Test Script
Tests FastAPI startup and endpoints
"""

import os
import sys
import time
import threading
import requests
from pathlib import Path

def start_server():
    """Start FastAPI server in background"""
    try:
        # Import du main.py généré
        if not Path('main.py').exists():
            print("❌ main.py not found, cannot start server")
            return
        
        import main
        
        # Vérification que c'est bien FastAPI mode
        if not hasattr(main, 'app'):
            print("⚠️  FastAPI app not found in main.py")
            return
        
        import uvicorn
        uvicorn.run(
            main.app, 
            host='127.0.0.1', 
            port=8000, 
            log_level='error'
        )
    except Exception as e:
        print(f"❌ Server startup failed: {e}")

def test_endpoints():
    """Test API endpoints"""
    print("🔄 Testing API endpoints...")
    
    # Attendre que le serveur démarre
    time.sleep(3)
    
    base_url = 'http://127.0.0.1:8000'
    endpoints = [
        ('/', 'Root endpoint'),
        ('/health', 'Health check'),
        ('/api/taxes', 'Taxes endpoint')
    ]
    
    results = []
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f'{base_url}{endpoint}', timeout=5)
            if response.status_code == 200:
                print(f'✅ {description} ({endpoint}): {response.status_code}')
                
                # Affichage des détails pour l'endpoint racine
                if endpoint == '/':
                    try:
                        data = response.json()
                        print(f'   📝 Message: {data.get("message", "N/A")}')
                        print(f'   🌍 Environment: {data.get("environment", "N/A")}')
                        print(f'   🔧 Mode: {data.get("mode", "N/A")}')
                        print(f'   📊 Version: {data.get("version", "N/A")}')
                    except:
                        print('   ⚠️  Response not JSON')
                
                results.append(True)
            else:
                print(f'⚠️  {description} ({endpoint}): {response.status_code}')
                results.append(False)
                
        except requests.exceptions.ConnectionError:
            print(f'❌ {description} ({endpoint}): Connection refused')
            results.append(False)
        except requests.exceptions.Timeout:
            print(f'⚠️  {description} ({endpoint}): Timeout')
            results.append(False)
        except Exception as e:
            print(f'❌ {description} ({endpoint}): {str(e)[:50]}')
            results.append(False)
    
    return results

def main():
    """Fonction principale"""
    print("🚀 TaxasGE Backend - API Startup Test")
    print("=" * 50)
    
    # Vérification des prérequis
    if not Path('main.py').exists():
        print("❌ main.py not found")
        print("Please run 'python scripts/setup-backend.py' first")
        sys.exit(1)
    
    try:
        # Import pour vérifier la validité
        import main
        print("✅ main.py imported successfully")
        
        if hasattr(main, 'app'):
            print("✅ FastAPI app detected")
        else:
            print("⚠️  No FastAPI app found, may be Firebase Functions mode")
            return
            
    except Exception as e:
        print(f"❌ main.py import failed: {e}")
        sys.exit(1)
    
    print("\n🔄 Starting API server in background...")
    
    # Démarrer le serveur dans un thread séparé
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Tester les endpoints
    print("\n🧪 Testing endpoints...")
    results = test_endpoints()
    
    # Résumé des résultats
    success_count = sum(results)
    total_count = len(results)
    
    print(f"\n📊 Test Results: {success_count}/{total_count} endpoints successful")
    
    if success_count == total_count:
        print("🎉 All API endpoint tests passed!")
    elif success_count > 0:
        print("⚠️  Some API endpoints failed (partial success)")
    else:
        print("❌ All API endpoint tests failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
