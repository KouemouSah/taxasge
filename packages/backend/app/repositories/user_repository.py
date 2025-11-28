"""
User Repository - Backwards compatibility export

This module re-exports UserRepository class and user_repository instance
from their actual location for backwards compatibility with existing imports.

Actual implementation: app.modules.users.repositories.user_repository
"""

from app.modules.users.repositories.user_repository import UserRepository, user_repository

__all__ = ["UserRepository", "user_repository"]
