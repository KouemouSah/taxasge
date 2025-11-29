"""
Legacy Repository Exports - Backwards Compatibility Layer

This module re-exports repositories from their new modular locations
to maintain backwards compatibility with existing imports.

New code should import directly from app.modules.<module>.repositories

IMPORTANT: Singleton instances are created lazily to avoid import-time
database access which can break module loading.
"""

# Re-export repositories for backwards compatibility
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.auth.repositories.pending_registration_repository import PendingRegistrationRepository
from app.modules.auth.repositories.refresh_token_repository import RefreshTokenRepository
from app.modules.fiscal_services.repositories.fiscal_service_repository import FiscalServiceRepository
from app.modules.declarations.repositories.declaration_repository import DeclarationRepository

# Lazy singleton instances to avoid import-time instantiation
_user_repository = None
_fiscal_service_repository = None
_tax_declaration_repository = None


def get_user_repository() -> UserRepository:
    """Get or create UserRepository singleton"""
    global _user_repository
    if _user_repository is None:
        _user_repository = UserRepository()
    return _user_repository


def get_fiscal_service_repository() -> FiscalServiceRepository:
    """Get or create FiscalServiceRepository singleton"""
    global _fiscal_service_repository
    if _fiscal_service_repository is None:
        _fiscal_service_repository = FiscalServiceRepository()
    return _fiscal_service_repository


def get_tax_declaration_repository() -> DeclarationRepository:
    """Get or create DeclarationRepository singleton"""
    global _tax_declaration_repository
    if _tax_declaration_repository is None:
        _tax_declaration_repository = DeclarationRepository()
    return _tax_declaration_repository


# Lazy proxy classes for backwards compatibility
class _LazyRepo:
    """Proxy class that lazily initializes repository on first access"""

    def __init__(self, getter):
        self._getter = getter

    def __getattr__(self, name):
        return getattr(self._getter(), name)


user_repository = _LazyRepo(get_user_repository)
fiscal_service_repository = _LazyRepo(get_fiscal_service_repository)
tax_declaration_repository = _LazyRepo(get_tax_declaration_repository)

# Export all for easy access
__all__ = [
    "UserRepository",
    "user_repository",
    "get_user_repository",
    "PendingRegistrationRepository",
    "RefreshTokenRepository",
    "FiscalServiceRepository",
    "fiscal_service_repository",
    "get_fiscal_service_repository",
    "DeclarationRepository",
    "tax_declaration_repository",
    "get_tax_declaration_repository",
]
