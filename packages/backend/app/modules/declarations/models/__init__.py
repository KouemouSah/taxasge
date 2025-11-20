"""
Declarations Models - Pydantic schemas for tax declarations

Export all declaration-related models for easy imports.
"""

from app.modules.declarations.models.declaration import (
    DeclarationBase,
    DeclarationCreate,
    DeclarationUpdate,
    DeclarationResponse,
    DeclarationListResponse,
    DeclarationStatus,
    DeclarationType,
)

__all__ = [
    "DeclarationBase",
    "DeclarationCreate",
    "DeclarationUpdate",
    "DeclarationResponse",
    "DeclarationListResponse",
    "DeclarationStatus",
    "DeclarationType",
]
