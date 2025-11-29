"""
Legacy Repository Exports - Backwards Compatibility Layer

This module re-exports repositories from their new modular locations
to maintain backwards compatibility with existing imports.

New code should import directly from app.modules.<module>.repositories
"""

# Re-export repositories for backwards compatibility
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.auth.repositories.pending_registration_repository import PendingRegistrationRepository
from app.modules.auth.repositories.refresh_token_repository import RefreshTokenRepository
from app.modules.fiscal_services.repositories.fiscal_service_repository import FiscalServiceRepository
from app.modules.declarations.repositories.declaration_repository import DeclarationRepository

# Create singleton instances for backwards compatibility
user_repository = UserRepository()
fiscal_service_repository = FiscalServiceRepository()
tax_declaration_repository = DeclarationRepository()

# Export all for easy access
__all__ = [
    "UserRepository",
    "user_repository",
    "PendingRegistrationRepository",
    "RefreshTokenRepository",
    "FiscalServiceRepository",
    "fiscal_service_repository",
    "DeclarationRepository",
    "tax_declaration_repository",
]
