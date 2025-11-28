"""
Repository package

This package contains:
- base.py: BaseRepository abstract class
- user_repository.py: Backwards-compatible re-export of UserRepository

Note: Import directly from submodules, e.g.:
  from app.repositories.base import BaseRepository
  from app.repositories.user_repository import UserRepository
"""

# Empty __init__.py to avoid circular imports
# All imports should be done from specific submodules
