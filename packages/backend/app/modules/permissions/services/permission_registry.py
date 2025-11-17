"""
Permission Registry - Central registry for module permissions
"""
from typing import List, Dict, Tuple, Optional
import logging

from app.modules.permissions.repositories.permission_repository import PermissionRepository
from app.modules.permissions.models.permission import PermissionCreate

logger = logging.getLogger(__name__)


class PermissionRegistry:
    """
    Central registry for permissions

    Modules can register their permissions at startup using this registry.
    The registry will then sync permissions to the database.
    """

    # Class-level storage for registered permissions
    _registered_permissions: Dict[str, List[Tuple]] = {}

    @classmethod
    def register_module_permissions(
        cls,
        module_name: str,
        permissions: List[Tuple[str, str, str, str, bool]]
    ):
        """
        Register permissions for a module

        This should be called in the module's __init__.py file.

        Args:
            module_name: Name of the module (e.g., "assignment", "declarations")
            permissions: List of tuples (name, resource, action, description, is_critical)

        Example:
            ```python
            # In app/modules/assignment/__init__.py
            from app.modules.permissions.services.permission_registry import PermissionRegistry

            ASSIGNMENT_PERMISSIONS = [
                ("assignment.view", "assignment", "view", "Ver asignaciones", False),
                ("assignment.create", "assignment", "create", "Crear asignación", False),
                ("assignment.reassign_in_progress", "assignment", "reassign_in_progress",
                 "Reasignar tarea EN CURSO", True),
            ]

            PermissionRegistry.register_module_permissions("assignment", ASSIGNMENT_PERMISSIONS)
            ```
        """
        if module_name in cls._registered_permissions:
            logger.warning(f"Module '{module_name}' permissions already registered, overwriting")

        cls._registered_permissions[module_name] = permissions
        logger.info(f"Registered {len(permissions)} permissions for module '{module_name}'")

    @classmethod
    def get_registered_permissions(cls) -> Dict[str, List[Tuple]]:
        """
        Get all registered permissions

        Returns:
            Dict with module names as keys and permission lists as values
        """
        return cls._registered_permissions.copy()

    @classmethod
    def get_module_permissions(cls, module_name: str) -> List[Tuple]:
        """
        Get permissions for a specific module

        Args:
            module_name: Module name

        Returns:
            List of permission tuples or empty list if not found
        """
        return cls._registered_permissions.get(module_name, [])

    @classmethod
    def get_all_permission_names(cls) -> List[str]:
        """
        Get all registered permission names

        Returns:
            List of permission names (e.g., ["assignment.view", "assignment.create", ...])
        """
        names = []
        for permissions in cls._registered_permissions.values():
            for perm in permissions:
                names.append(perm[0])  # perm[0] is the name
        return names

    @classmethod
    async def sync_to_database(cls, db_connection) -> Dict[str, int]:
        """
        Sync all registered permissions to the database

        This should be called at application startup to ensure all permissions
        are present in the database.

        Args:
            db_connection: Database connection

        Returns:
            Dict with sync statistics (created_count, skipped_count, total_count)
        """
        permission_repo = PermissionRepository(db_connection)

        permission_objects = []
        for module_name, permissions in cls._registered_permissions.items():
            for perm in permissions:
                name, resource, action, description, is_critical = perm
                permission_objects.append(
                    PermissionCreate(
                        name=name,
                        resource=resource,
                        action=action,
                        description=description,
                        is_critical=is_critical,
                        module_name=module_name
                    )
                )

        # Bulk create (skips duplicates)
        created = await permission_repo.bulk_create(permission_objects)

        total_count = len(permission_objects)
        created_count = len(created)
        skipped_count = total_count - created_count

        logger.info(
            f"Permission sync completed: {created_count} created, "
            f"{skipped_count} skipped, {total_count} total"
        )

        return {
            "created_count": created_count,
            "skipped_count": skipped_count,
            "total_count": total_count
        }

    @classmethod
    def clear_registry(cls):
        """
        Clear all registered permissions

        This is mainly useful for testing.
        """
        cls._registered_permissions.clear()
        logger.info("Permission registry cleared")

    @classmethod
    def get_stats(cls) -> Dict[str, int]:
        """
        Get statistics about registered permissions

        Returns:
            Dict with module_count and permission_count
        """
        module_count = len(cls._registered_permissions)
        permission_count = sum(
            len(perms) for perms in cls._registered_permissions.values()
        )

        return {
            "module_count": module_count,
            "permission_count": permission_count
        }


# Convenience function for checking if a permission is registered
def is_permission_registered(permission_name: str) -> bool:
    """
    Check if a permission name is registered

    Args:
        permission_name: Permission name to check

    Returns:
        True if registered, False otherwise
    """
    return permission_name in PermissionRegistry.get_all_permission_names()


# Function to be called at application startup
async def initialize_permissions(db_connection):
    """
    Initialize permissions at application startup

    This function:
    1. Loads all module permissions from the registry
    2. Syncs them to the database

    Args:
        db_connection: Database connection

    Returns:
        Dict with sync statistics
    """
    logger.info("Initializing permissions...")

    stats = PermissionRegistry.get_stats()
    logger.info(
        f"Found {stats['permission_count']} permissions "
        f"across {stats['module_count']} modules"
    )

    sync_result = await PermissionRegistry.sync_to_database(db_connection)

    logger.info(
        f"Permissions initialized: {sync_result['created_count']} new, "
        f"{sync_result['skipped_count']} existing, "
        f"{sync_result['total_count']} total"
    )

    return sync_result
