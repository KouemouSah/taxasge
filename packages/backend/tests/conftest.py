# -*- coding: utf-8 -*-
"""
Pytest Configuration and Fixtures
Phase 3 - Infrastructure Testing
"""
import pytest
import sys
from pathlib import Path

# Add backend root to path
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from app.config import get_settings


@pytest.fixture(scope="session")
def settings():
    """
    Fixture pour acceder aux settings de l'application
    Scope session = une seule fois pour tous les tests
    """
    return get_settings()


@pytest.fixture(scope="session")
def supabase_client(settings):
    """
    Fixture client Supabase avec credentials restaures Phase 3
    Utilise les variables d'environnement du .env restaure
    """
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        return client
    except ImportError:
        pytest.skip("supabase-py not installed")
    except Exception as e:
        pytest.fail(f"Failed to create Supabase client: {e}")


@pytest.fixture(scope="session")
def supabase_admin_client(settings):
    """
    Fixture client Supabase avec service role key (admin)
    Pour tests necessitant privileges eleves
    """
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        return client
    except ImportError:
        pytest.skip("supabase-py not installed")
    except Exception as e:
        pytest.fail(f"Failed to create Supabase admin client: {e}")


@pytest.fixture(scope="function")
def mock_env(monkeypatch):
    """
    Fixture pour mocker les variables d'environnement dans les tests
    Scope function = reset apres chaque test
    """
    def _set_env(key, value):
        monkeypatch.setenv(key, value)
    return _set_env


@pytest.fixture(scope="session")
def backend_root_path():
    """Retourne le chemin racine du backend"""
    return backend_root
