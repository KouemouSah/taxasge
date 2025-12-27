"""
Schema Loader for document extraction.
Loads JSON schemas from the schemas/ directory.
"""
import json
from pathlib import Path
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)

SCHEMAS_DIR = Path(__file__).parent.parent / "schemas"


class SchemaLoader:
    """Load and manage extraction schemas from JSON files"""

    def __init__(self):
        self._schemas: Dict[str, Dict] = {}
        self._load_all()

    def _load_all(self):
        """Load all JSON schemas from directory"""
        if not SCHEMAS_DIR.exists():
            logger.warning(f"Schemas directory not found: {SCHEMAS_DIR}")
            return

        for filepath in SCHEMAS_DIR.glob("*.json"):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    schema = json.load(f)
                    # Use filename without extension as key
                    key = filepath.stem
                    self._schemas[key] = schema
                    logger.info(f"Loaded schema: {key}")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in {filepath}: {e}")
            except Exception as e:
                logger.error(f"Error loading {filepath}: {e}")

        logger.info(f"Loaded {len(self._schemas)} schemas")

    def get_schema(self, schema_key: str) -> Optional[Dict]:
        """
        Get schema by key (e.g., 'dip_gq', 'pasaporte_gq').

        Args:
            schema_key: The schema key (filename without .json)

        Returns:
            The schema dictionary or None if not found
        """
        return self._schemas.get(schema_key)

    def get_schema_for_document(self, document_code: str) -> Optional[Dict]:
        """
        Get schema matching a document code.
        Tries exact match first, then partial match.

        Args:
            document_code: The document code to match

        Returns:
            Matching schema or None
        """
        # Normalize document code
        code_lower = document_code.lower().replace(" ", "_").replace("-", "_")

        # Try exact match first
        if code_lower in self._schemas:
            return self._schemas[code_lower]

        # Try partial match
        for key, schema in self._schemas.items():
            if code_lower in key.lower() or key.lower() in code_lower:
                return schema

        return None

    def get_all_schemas(self) -> Dict[str, Dict]:
        """Get all loaded schemas"""
        return self._schemas.copy()

    def get_schema_keys(self) -> List[str]:
        """Get list of all schema keys"""
        return list(self._schemas.keys())

    def get_extraction_fields(self, schema_key: str) -> Dict[str, Dict]:
        """
        Get all extraction fields from a schema, flattened.

        Args:
            schema_key: The schema key

        Returns:
            Dict of field_name -> field_config with bloc info
        """
        schema = self.get_schema(schema_key)
        if not schema:
            return {}

        fields = {}
        for bloc_name, bloc in schema.get("blocs", {}).items():
            for field_name, field_config in bloc.get("fields", {}).items():
                fields[field_name] = {
                    **field_config,
                    "bloc": bloc_name
                }
        return fields

    def get_required_fields(self, schema_key: str) -> List[str]:
        """Get list of required field names for a schema"""
        fields = self.get_extraction_fields(schema_key)
        return [
            name for name, config in fields.items()
            if config.get("required", False)
        ]

    def build_gemini_prompt(self, schema_key: str) -> str:
        """
        Build extraction prompt from schema for Gemini.

        Args:
            schema_key: The schema key

        Returns:
            Formatted prompt string with extraction instructions
        """
        schema = self.get_schema(schema_key)
        if not schema:
            return ""

        lines = [
            f"## Document: {schema.get('description', schema_key)}",
            "",
            "Extraire les informations suivantes en JSON:",
            ""
        ]

        for bloc_name, bloc in schema.get("blocs", {}).items():
            bloc_title = bloc_name.replace("_", " ").title()
            lines.append(f"### {bloc_title}")
            lines.append(f"{bloc.get('description', '')}")
            lines.append("")

            for field_name, config in bloc.get("fields", {}).items():
                required = "OBLIGATOIRE" if config.get("required") else "optionnel"
                hint = config.get("gemini_hint", "")
                field_type = config.get("type", "string")
                lines.append(f"- **{field_name}** ({field_type}, {required}): {hint}")

            lines.append("")

        return "\n".join(lines)

    def get_tesseract_patterns(self, schema_key: str) -> Dict[str, List[str]]:
        """
        Get regex patterns for Tesseract fallback extraction.

        Args:
            schema_key: The schema key

        Returns:
            Dict of field_name -> list of regex patterns
        """
        schema = self.get_schema(schema_key)
        if not schema:
            return {}
        return schema.get("tesseract_patterns", {})

    def get_validation_rules(self, schema_key: str) -> Dict[str, Dict]:
        """
        Get validation rules from schema.

        Args:
            schema_key: The schema key

        Returns:
            Dict of field_name -> validation config
        """
        fields = self.get_extraction_fields(schema_key)
        rules = {}

        for field_name, config in fields.items():
            rule = {}
            if config.get("required"):
                rule["required"] = True
            if config.get("pattern"):
                rule["pattern"] = config["pattern"]
            if config.get("type") == "date":
                rule["type"] = "date"
                rule["format"] = config.get("format", "YYYY-MM-DD")
            if config.get("type") == "enum":
                rule["type"] = "enum"
                rule["values"] = config.get("values", [])
            if rule:
                rules[field_name] = rule

        return rules


# Singleton instance
schema_loader = SchemaLoader()
