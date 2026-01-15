"""
Role Repository - Database operations for roles (asyncpg version)
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import asyncpg

from app.modules.permissions.models.role import (
    RoleCreate,
    RoleUpdate,
)


def _serialize_record(record: asyncpg.Record) -> Dict[str, Any]:
    """
    Convert asyncpg Record to dict with JSON-serializable types.

    Converts:
    - UUID objects to strings
    - datetime objects are kept as-is (FastAPI handles serialization)
    """
    if record is None:
        return None
    result = dict(record)
    for key, value in result.items():
        if isinstance(value, UUID):
            result[key] = str(value)
    return result


class RoleRepository:
    """Repository for role CRUD operations using asyncpg"""

    def __init__(self, db_connection: asyncpg.Connection):
        """
        Initialize repository with database connection

        Args:
            db_connection: asyncpg connection object
        """
        self.db = db_connection

    async def get_by_id(self, role_id: str) -> Optional[Dict[str, Any]]:
        """
        Get role by ID

        Args:
            role_id: Role UUID

        Returns:
            Role dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, name, code, entity_type, description, is_system,
                   created_at, updated_at, created_by
            FROM roles
            WHERE id = $1
        """, role_id)

        return _serialize_record(result) if result else None

    async def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Get role by unique code

        Args:
            code: Role code (e.g., "supervisor_dgi_junior")

        Returns:
            Role dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, name, code, entity_type, description, is_system,
                   created_at, updated_at, created_by
            FROM roles
            WHERE code = $1
        """, code)

        return _serialize_record(result) if result else None

    async def get_all(
        self,
        entity_type: Optional[str] = None,
        is_system: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all roles with optional filters

        Args:
            entity_type: Filter by entity type (DGI, Ministry, NULL)
            is_system: Filter by system role flag
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of role dicts
        """
        query = """
            SELECT id, name, code, entity_type, description, is_system,
                   created_at, updated_at, created_by
            FROM roles
            WHERE 1=1
        """
        params = []
        param_count = 0

        if entity_type is not None:
            param_count += 1
            query += f" AND entity_type = ${param_count}"
            params.append(entity_type)

        if is_system is not None:
            param_count += 1
            query += f" AND is_system = ${param_count}"
            params.append(is_system)

        query += f" ORDER BY is_system DESC, entity_type, code LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
        params.extend([limit, offset])

        results = await self.db.fetch(query, *params)
        return [_serialize_record(row) for row in results]

    async def count(
        self,
        entity_type: Optional[str] = None,
        is_system: Optional[bool] = None
    ) -> int:
        """
        Count roles with optional filters

        Args:
            entity_type: Filter by entity type
            is_system: Filter by system role flag

        Returns:
            Total count
        """
        query = "SELECT COUNT(*) FROM roles WHERE 1=1"
        params = []
        param_count = 0

        if entity_type is not None:
            param_count += 1
            query += f" AND entity_type = ${param_count}"
            params.append(entity_type)

        if is_system is not None:
            param_count += 1
            query += f" AND is_system = ${param_count}"
            params.append(is_system)

        result = await self.db.fetchval(query, *params)
        return result or 0

    async def get_system_roles(self) -> List[Dict[str, Any]]:
        """
        Get all system roles

        Returns:
            List of system role dicts
        """
        return await self.get_all(is_system=True, limit=100)

    async def get_custom_roles(self) -> List[Dict[str, Any]]:
        """
        Get all custom (non-system) roles

        Returns:
            List of custom role dicts
        """
        return await self.get_all(is_system=False, limit=1000)

    async def get_agent_rbac_roles(self) -> List[Dict[str, Any]]:
        """
        Get all predefined RBAC roles for agents

        These are system roles with entity_type='agent' that define
        what permissions an agent has.

        Returns:
            List of agent RBAC roles
        """
        results = await self.db.fetch("""
            SELECT id, name, code, entity_type, description, is_system,
                   created_at, updated_at, created_by
            FROM roles
            WHERE entity_type = 'agent'
              AND is_system = TRUE
            ORDER BY name
        """)

        return [_serialize_record(row) for row in results]

    async def get_with_permissions(self, role_id: str) -> Optional[Dict[str, Any]]:
        """
        Get role with associated permissions

        Args:
            role_id: Role UUID

        Returns:
            Role dict with permissions list
        """
        # Get role
        role = await self.db.fetchrow("""
            SELECT id, name, code, entity_type, description, is_system,
                   created_at, updated_at, created_by
            FROM roles
            WHERE id = $1
        """, role_id)

        if not role:
            return None

        role_dict = dict(role)

        # Get permissions
        permissions = await self.db.fetch("""
            SELECT p.id, p.name, p.resource, p.action, p.description,
                   p.is_critical, p.module_name, rp.granted
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            ORDER BY p.module_name, p.resource, p.action
        """, role_id)

        role_dict['permissions'] = [_serialize_record(row) for row in permissions]
        role_dict['permissions_count'] = len(permissions)

        return role_dict

    async def create(self, role: RoleCreate, created_by: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new role

        Args:
            role: Role data
            created_by: User ID who created the role

        Returns:
            Created role dict

        Raises:
            asyncpg.UniqueViolationError: If role code already exists
        """
        result = await self.db.fetchrow("""
            INSERT INTO roles (name, code, entity_type, description, is_system, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, code, entity_type, description, is_system,
                      created_at, updated_at, created_by
        """, role.name, role.code, role.entity_type, role.description, False, created_by)

        return _serialize_record(result)

    async def update(self, role_id: str, role: RoleUpdate) -> Optional[Dict[str, Any]]:
        """
        Update an existing role

        Args:
            role_id: Role UUID
            role: Updated role data

        Returns:
            Updated role dict or None if not found

        Raises:
            ValueError: If trying to update a system role
        """
        # Check if it's a system role
        result = await self.db.fetchrow("SELECT is_system FROM roles WHERE id = $1", role_id)

        if not result:
            return None

        if result['is_system']:
            raise ValueError("Cannot update system roles")

        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 0

        if role.name is not None:
            param_count += 1
            update_fields.append(f"name = ${param_count}")
            params.append(role.name)

        if role.description is not None:
            param_count += 1
            update_fields.append(f"description = ${param_count}")
            params.append(role.description)

        if not update_fields:
            # No fields to update
            return await self.get_by_id(role_id)

        update_fields.append("updated_at = NOW()")
        param_count += 1
        params.append(role_id)

        query = f"""
            UPDATE roles
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, name, code, entity_type, description, is_system,
                      created_at, updated_at, created_by
        """

        result = await self.db.fetchrow(query, *params)
        return _serialize_record(result) if result else None

    async def delete(self, role_id: str) -> bool:
        """
        Delete a role

        Args:
            role_id: Role UUID

        Returns:
            True if deleted, False if not found

        Raises:
            ValueError: If trying to delete a system role
        """
        # Check if it's a system role
        result = await self.db.fetchrow("SELECT is_system FROM roles WHERE id = $1", role_id)

        if not result:
            return False

        if result['is_system']:
            raise ValueError("Cannot delete system roles")

        delete_result = await self.db.execute("DELETE FROM roles WHERE id = $1", role_id)
        return "DELETE 1" in delete_result

    async def exists(self, code: str) -> bool:
        """
        Check if a role exists by code

        Args:
            code: Role code

        Returns:
            True if exists, False otherwise
        """
        result = await self.db.fetchval("""
            SELECT EXISTS(SELECT 1 FROM roles WHERE code = $1)
        """, code)

        return result or False

    async def assign_permission(
        self,
        role_id: str,
        permission_id: str,
        granted: bool = True,
        created_by: Optional[str] = None
    ) -> bool:
        """
        Assign a permission to a role

        Args:
            role_id: Role UUID
            permission_id: Permission UUID
            granted: True to grant, False to deny
            created_by: User ID who made the assignment

        Returns:
            True if assigned
        """
        await self.db.execute("""
            INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (role_id, permission_id) DO UPDATE
            SET granted = EXCLUDED.granted, created_by = EXCLUDED.created_by
        """, role_id, permission_id, granted, created_by)

        return True

    async def remove_permission(self, role_id: str, permission_id: str) -> bool:
        """
        Remove a permission from a role

        Args:
            role_id: Role UUID
            permission_id: Permission UUID

        Returns:
            True if removed, False if not found
        """
        result = await self.db.execute("""
            DELETE FROM role_permissions
            WHERE role_id = $1 AND permission_id = $2
        """, role_id, permission_id)

        return "DELETE 1" in result

    async def get_role_permissions(self, role_id: str) -> List[str]:
        """
        Get list of permission IDs for a role

        Args:
            role_id: Role UUID

        Returns:
            List of permission UUIDs
        """
        results = await self.db.fetch("""
            SELECT permission_id
            FROM role_permissions
            WHERE role_id = $1 AND granted = TRUE
        """, role_id)

        return [str(row['permission_id']) for row in results]
