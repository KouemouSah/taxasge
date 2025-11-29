"""
Legacy User Repository - Backwards Compatibility

This module re-exports UserRepository from its new modular location.
New code should import from app.modules.users.repositories.user_repository

IMPORTANT: The singleton is created lazily to avoid import-time database access
which can break module loading if imported before database is initialized.
"""

from app.modules.users.repositories.user_repository import UserRepository

# Lazy singleton pattern to avoid import-time instantiation
_user_repository_instance = None


def get_user_repository() -> UserRepository:
    """Get the singleton UserRepository instance (lazy initialization)"""
    global _user_repository_instance
    if _user_repository_instance is None:
        _user_repository_instance = UserRepository()
    return _user_repository_instance


# For backwards compatibility: create a property-like object
# that behaves like the old singleton but initializes lazily
class _LazyUserRepository:
    """Proxy class that lazily initializes UserRepository on first access"""

    def __getattr__(self, name):
        return getattr(get_user_repository(), name)


user_repository = _LazyUserRepository()

__all__ = ["UserRepository", "user_repository", "get_user_repository"]
