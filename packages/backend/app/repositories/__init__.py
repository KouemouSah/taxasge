"""
Repository exports for backwards compatibility

The actual implementations are in their respective modules:
- UserRepository: app.modules.users.repositories.user_repository
- BaseRepository: app.repositories.base
"""

from app.repositories.base import BaseRepository

# Re-export UserRepository for backwards compatibility
# Many modules import from app.repositories.user_repository
try:
    from app.modules.users.repositories.user_repository import UserRepository
except ImportError:
    UserRepository = None  # Will fail at runtime if used

__all__ = ["BaseRepository", "UserRepository"]
