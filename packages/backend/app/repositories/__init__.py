"""
Repository exports

BaseRepository is the only export from this package.
UserRepository should be imported from:
  - app.repositories.user_repository (backwards compat module)
  - app.modules.users.repositories.user_repository (actual location)
"""

from app.repositories.base import BaseRepository

__all__ = ["BaseRepository"]
