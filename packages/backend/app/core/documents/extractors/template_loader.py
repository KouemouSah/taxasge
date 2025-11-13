"""
Template Loader for Document Extraction
Loads and caches JSON templates from templates/ directory

Author: Claude Code
Date: 2025-11-13
Version: 2.0 - Optimized template-based extraction
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from loguru import logger

from app.core.documents.templates import DECLARATIONS_DIR, FISCAL_SERVICES_DIR


@dataclass
class FieldConfig:
    """Configuration for a single field in the template"""
    id: str
    label: List[str]
    type: str
    pattern: Optional[str] = None
    required: bool = False
    position_hint: str = "after_label"
    example: Optional[str] = None


@dataclass
class ValidationRule:
    """Validation rule from template"""
    type: str  # calculation, format, range, required_group
    data: Dict[str, Any]


@dataclass
class DocumentTemplate:
    """Parsed document template"""
    name: str
    category: str
    description: str
    version: str
    fields: List[FieldConfig]
    validations: List[ValidationRule]


class TemplateLoader:
    """
    Loads and caches document templates

    Usage:
        loader = TemplateLoader()
        template = loader.load("iva_destajo", "declaration")

        # Access fields
        for field in template.fields:
            print(f"Field {field.id}: {field.label}")
    """

    def __init__(self):
        self._cache: Dict[str, DocumentTemplate] = {}
        self._declarations_path = DECLARATIONS_DIR
        self._fiscal_services_path = FISCAL_SERVICES_DIR

        logger.info(f"TemplateLoader initialized")
        logger.info(f"Declarations path: {self._declarations_path}")
        logger.info(f"Fiscal services path: {self._fiscal_services_path}")

    def load(self, template_name: str, template_type: str = "declaration") -> Optional[DocumentTemplate]:
        """
        Load a template by name and type

        Args:
            template_name: Name of template (e.g., "iva_destajo", "nota_ingreso")
            template_type: Type of template ("declaration" or "fiscal_service")

        Returns:
            DocumentTemplate or None if not found
        """
        cache_key = f"{template_type}:{template_name}"

        # Check cache
        if cache_key in self._cache:
            logger.debug(f"Template {cache_key} loaded from cache")
            return self._cache[cache_key]

        # Determine file path
        if template_type == "declaration":
            file_path = self._declarations_path / f"{template_name}.json"
        elif template_type == "fiscal_service":
            file_path = self._fiscal_services_path / f"{template_name}.json"
        else:
            logger.error(f"Unknown template type: {template_type}")
            return None

        # Load from file
        try:
            if not file_path.exists():
                logger.error(f"Template file not found: {file_path}")
                return None

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Parse template
            template = self._parse_template(data)

            # Cache it
            self._cache[cache_key] = template

            logger.info(f"Template {cache_key} loaded successfully ({len(template.fields)} fields)")
            return template

        except Exception as e:
            logger.error(f"Error loading template {cache_key}: {e}")
            return None

    def _parse_template(self, data: Dict[str, Any]) -> DocumentTemplate:
        """Parse JSON data into DocumentTemplate"""

        # Parse fields
        fields = []
        for field_data in data.get("fields", []):
            field = FieldConfig(
                id=field_data["id"],
                label=field_data["label"],
                type=field_data["type"],
                pattern=field_data.get("pattern"),
                required=field_data.get("required", False),
                position_hint=field_data.get("position_hint", "after_label"),
                example=field_data.get("example")
            )
            fields.append(field)

        # Parse validations
        validations = []
        for val_data in data.get("validations", []):
            validation = ValidationRule(
                type=val_data["type"],
                data=val_data
            )
            validations.append(validation)

        return DocumentTemplate(
            name=data["name"],
            category=data["category"],
            description=data["description"],
            version=data["version"],
            fields=fields,
            validations=validations
        )

    def list_available_templates(self, template_type: str = "declaration") -> List[str]:
        """
        List all available templates

        Args:
            template_type: Type of templates to list

        Returns:
            List of template names (without .json extension)
        """
        if template_type == "declaration":
            path = self._declarations_path
        elif template_type == "fiscal_service":
            path = self._fiscal_services_path
        else:
            return []

        if not path.exists():
            return []

        templates = [f.stem for f in path.glob("*.json")]
        return sorted(templates)

    def get_required_fields(self, template: DocumentTemplate) -> List[str]:
        """Get list of required field IDs"""
        return [f.id for f in template.fields if f.required]

    def get_fields_by_type(self, template: DocumentTemplate, field_type: str) -> List[FieldConfig]:
        """Get all fields of a specific type"""
        return [f for f in template.fields if f.type == field_type]

    def clear_cache(self):
        """Clear the template cache"""
        self._cache.clear()
        logger.info("Template cache cleared")


# Singleton instance
template_loader = TemplateLoader()
