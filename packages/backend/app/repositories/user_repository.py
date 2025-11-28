"""
User Repository - Backwards compatibility export

This module re-exports UserRepository class and user_repository instance
from their actual location for backwards compatibility with existing imports.

Actual implementation: app.modules.users.repositories.user_repository

Uses lazy loading to avoid circular import issues during module initialization.
"""

# Lazy import to avoid import-time side effects
_UserRepository = None
_user_repository = None


def __getattr__(name):
    """Lazy loading for UserRepository and user_repository"""
    global _UserRepository, _user_repository

    if name == "UserRepository":
        if _UserRepository is None:
            from app.modules.users.repositories.user_repository import UserRepository
            _UserRepository = UserRepository
        return _UserRepository

    if name == "user_repository":
        if _user_repository is None:
            from app.modules.users.repositories.user_repository import user_repository
            _user_repository = user_repository
        return _user_repository

    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["UserRepository", "user_repository"]
