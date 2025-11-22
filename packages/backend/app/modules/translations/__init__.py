"""
Translations Module - Centralized multilingual content management

Handles all application translations:
- Entity translations (ministries, sectors, categories, etc.)
- Dynamic content localization
- Language detection and management
- Translation caching (future)

Supported languages:
- Spanish (es) - Default
- French (fr)
- English (en)

Architecture: 3-tier (Routes → Services → Repositories)
"""

from app.modules.translations.models.language import Language, get_default_language, get_supported_languages
from app.modules.translations.services.translation_service import TranslationService
from app.modules.translations.services.language_service import LanguageService

__all__ = [
    "Language",
    "get_default_language",
    "get_supported_languages",
    "TranslationService",
    "LanguageService",
]
