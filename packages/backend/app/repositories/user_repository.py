"""
Legacy User Repository - Backwards Compatibility

This module re-exports UserRepository from its new modular location.
New code should import from app.modules.users.repositories.user_repository
"""

from app.modules.users.repositories.user_repository import UserRepository

# Create singleton instance for backwards compatibility
user_repository = UserRepository()

__all__ = ["UserRepository", "user_repository"]
