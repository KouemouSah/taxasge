"""
Translation Models - Pydantic models for translations

For database schema, see: docs-internal/database/DATABASE_SCHEMA_REFERENCE.md
Tables: translations, entity_translations
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, UUID4

from app.modules.translations.models.language import Language


class TranslationCreate(BaseModel):
    """Model for creating a translation"""
    entity_type: str = Field(..., description="Type of entity (ministry, sector, category, etc.)")
    entity_id: UUID4 = Field(..., description="UUID of the entity")
    field_name: str = Field(..., description="Field name (name, description, etc.)")
    language_code: Language = Field(..., description="Language code")
    content: str = Field(..., min_length=1, description="Translated content")

    class Config:
        use_enum_values = True


class TranslationUpdate(BaseModel):
    """Model for updating a translation"""
    content: Optional[str] = Field(None, min_length=1, description="Updated content")

    class Config:
        use_enum_values = True


class TranslationResponse(BaseModel):
    """Model for translation response"""
    id: UUID4
    entity_type: str
    entity_id: UUID4
    field_name: str
    language_code: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranslationSetCreate(BaseModel):
    """Model for creating a complete translation set (all languages)"""
    entity_type: str = Field(..., description="Type of entity")
    entity_id: UUID4 = Field(..., description="UUID of the entity")
    field_name: str = Field(..., description="Field name")
    translations: Dict[str, str] = Field(
        ...,
        description="Dict with language codes as keys and content as values"
    )

    class Config:
        use_enum_values = True

    def validate_translations(self) -> bool:
        """
        Validate that translations dict contains valid language codes

        Returns:
            True if valid

        Raises:
            ValueError: If invalid language code found
        """
        for lang_code in self.translations.keys():
            try:
                Language.from_code(lang_code)
            except ValueError as e:
                raise ValueError(f"Invalid language code in translations: {lang_code}") from e
        return True


class EntityTranslationsResponse(BaseModel):
    """Model for entity translations response (all fields, all languages)"""
    entity_type: str
    entity_id: UUID4
    translations: Dict[str, Dict[str, str]] = Field(
        ...,
        description="Nested dict: {field_name: {language_code: content}}"
    )

    class Config:
        from_attributes = True
