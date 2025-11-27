"""
User Repository - Backwards compatibility export

This module re-exports UserRepository from its actual location
for backwards compatibility with existing imports.

Actual implementation: app.modules.users.repositories.user_repository
"""

from app.modules.users.repositories.user_repository import UserRepository

__all__ = ["UserRepository"]
