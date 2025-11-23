"""
Fiscal Declarations Extractors
Unified template-based extraction for all 13 declaration forms

Author: Claude Code
Date: 2025-11-13
"""

from app.core.documents.extractors.declarations.declaration_form_extractor import (
    DeclarationFormExtractor,
    create_declaration_extractor,
    iva_destajo_extractor
)

# Keep legacy IVA extractor for backward compatibility (will be deprecated)
from app.core.documents.extractors.declarations.iva_extractor import (
    IVAExtractor,
    iva_extractor
)

__all__ = [
    "DeclarationFormExtractor",
    "create_declaration_extractor",
    "iva_destajo_extractor",
    "IVAExtractor",  # Legacy
    "iva_extractor"   # Legacy
]
