# tests/test_config.py
import pytest
from app.config import settings

def test_config_import():
    """Test que la configuration peut être importée"""
    assert settings.PROJECT_NAME == "TaxasGE API"
    assert settings.VERSION == "1.0.0"

def test_environment_validation():
    """Test que l'environnement est valide"""
    assert settings.ENVIRONMENT in ["development", "testing", "production"]
    assert isinstance(settings.DEBUG, bool)

def test_basic_structure():
    """Test que la structure de base fonctionne"""
    import main  # Assurez-vous que le module peut être importé
    assert hasattr(main, 'app'), "Le module main n'a pas l'attribut 'app'"

    # Vérifiez que l'attribut app est une instance de FastAPI
    from fastapi import FastAPI
    assert isinstance(main.app, FastAPI), "L'attribut 'app' n'est pas une instance de FastAPI"

    # Test import config
    from app.config import get_settings
    config = get_settings()
    assert config.PROJECT_NAME == "TaxasGE API"
