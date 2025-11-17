"""
Role Repository - Database operations for roles
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
import psycopg2
from psycopg2.extras import RealDictCursor

from app.modules.permissions.models.role import (
    RoleCreate,
    RoleUpdate,
)


class RoleRepository:
    """Repository for role CRUD operations"""

    def __init__(self, db_connection):
        """
        Initialize repository with database connection

        Args:
            db_connection: psycopg2 connection object
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
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT id, name, code, entity_type, description, is_system,
                       created_at, updated_at, created_by
                FROM roles
                WHERE id = %s
            """, (role_id,))

            result = cursor.fetchone()
            return dict(result) if result else None
        finally:
            cursor.close()

    async def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Get role by unique code

        Args:
            code: Role code (e.g., "supervisor_dgi_junior")

        Returns:
            Role dict or None if not found
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT id, name, code, entity_type, description, is_system,
                       created_at, updated_at, created_by
                FROM roles
                WHERE code = %s
            """, (code,))

            result = cursor.fetchone()
            return dict(result) if result else None
        finally:
            cursor.close()

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
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            query = """
                SELECT id, name, code, entity_type, description, is_system,
                       created_at, updated_at, created_by
                FROM roles
                WHERE 1=1
            """
            params = []

            if entity_type is not None:
                query += " AND entity_type = %s"
                params.append(entity_type)

            if is_system is not None:
                query += " AND is_system = %s"
                params.append(is_system)

            query += " ORDER BY is_system DESC, entity_type, code LIMIT %s OFFSET %s"
            params.extend([limit, offset])

            cursor.execute(query, params)
            results = cursor.fetchall()
            return [dict(row) for row in results]
        finally:
            cursor.close()

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
        cursor = self.db.cursor()
        try:
            query = "SELECT COUNT(*) FROM roles WHERE 1=1"
            params = []

            if entity_type is not None:
                query += " AND entity_type = %s"
                params.append(entity_type)

            if is_system is not None:
                query += " AND is_system = %s"
                params.append(is_system)

            cursor.execute(query, params)
            return cursor.fetchone()[0]
        finally:
            cursor.close()

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

    async def get_with_permissions(self, role_id: str) -> Optional[Dict[str, Any]]:
        """
        Get role with associated permissions

        Args:
            role_id: Role UUID

        Returns:
            Role dict with permissions list
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            # Get role
            cursor.execute("""
                SELECT id, name, code, entity_type, description, is_system,
                       created_at, updated_at, created_by
                FROM roles
                WHERE id = %s
            """, (role_id,))

            role = cursor.fetchone()
            if not role:
                return None

            role_dict = dict(role)

            # Get permissions
            cursor.execute("""
                SELECT p.id, p.name, p.resource, p.action, p.description,
                       p.is_critical, p.module_name, rp.granted
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = %s
                ORDER BY p.module_name, p.resource, p.action
            """, (role_id,))

            permissions = [dict(row) for row in cursor.fetchall()]
            role_dict['permissions'] = permissions
            role_dict['permissions_count'] = len(permissions)

            return role_dict
        finally:
            cursor.close()

    async def create(self, role: RoleCreate, created_by: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new role

        Args:
            role: Role data
            created_by: User ID who created the role

        Returns:
            Created role dict

        Raises:
            psycopg2.IntegrityError: If role code already exists
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                INSERT INTO roles (name, code, entity_type, description, is_system, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, name, code, entity_type, description, is_system,
                          created_at, updated_at, created_by
            """, (
                role.name,
                role.code,
                role.entity_type,
                role.description,
                False,  # Custom roles are never system roles
                created_by
            ))

            result = cursor.fetchone()
            self.db.commit()
            return dict(result)
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

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
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            # Check if it's a system role
            cursor.execute("SELECT is_system FROM roles WHERE id = %s", (role_id,))
            result = cursor.fetchone()

            if not result:
                return None

            if result['is_system']:
                raise ValueError("Cannot update system roles")

            # Build dynamic update query
            update_fields = []
            params = []

            if role.name is not None:
                update_fields.append("name = %s")
                params.append(role.name)

            if role.description is not None:
                update_fields.append("description = %s")
                params.append(role.description)

            if not update_fields:
                # No fields to update
                return await self.get_by_id(role_id)

            update_fields.append("updated_at = NOW()")
            params.append(role_id)

            query = f"""
                UPDATE roles
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, name, code, entity_type, description, is_system,
                          created_at, updated_at, created_by
            """

            cursor.execute(query, params)
            result = cursor.fetchone()
            self.db.commit()

            return dict(result) if result else None
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

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
        cursor = self.db.cursor()
        try:
            # Check if it's a system role
            cursor.execute("SELECT is_system FROM roles WHERE id = %s", (role_id,))
            result = cursor.fetchone()

            if not result:
                return False

            if result[0]:  # is_system
                raise ValueError("Cannot delete system roles")

            cursor.execute("DELETE FROM roles WHERE id = %s", (role_id,))
            deleted = cursor.rowcount > 0
            self.db.commit()
            return deleted
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def exists(self, code: str) -> bool:
        """
        Check if a role exists by code

        Args:
            code: Role code

        Returns:
            True if exists, False otherwise
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                SELECT EXISTS(SELECT 1 FROM roles WHERE code = %s)
            """, (code,))

            return cursor.fetchone()[0]
        finally:
            cursor.close()

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
            True if assigned, False if already exists
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (role_id, permission_id) DO UPDATE
                SET granted = EXCLUDED.granted, created_by = EXCLUDED.created_by
            """, (role_id, permission_id, granted, created_by))

            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def remove_permission(self, role_id: str, permission_id: str) -> bool:
        """
        Remove a permission from a role

        Args:
            role_id: Role UUID
            permission_id: Permission UUID

        Returns:
            True if removed, False if not found
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                DELETE FROM role_permissions
                WHERE role_id = %s AND permission_id = %s
            """, (role_id, permission_id))

            deleted = cursor.rowcount > 0
            self.db.commit()
            return deleted
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def get_role_permissions(self, role_id: str) -> List[str]:
        """
        Get list of permission IDs for a role

        Args:
            role_id: Role UUID

        Returns:
            List of permission UUIDs
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                SELECT permission_id
                FROM role_permissions
                WHERE role_id = %s AND granted = TRUE
            """, (role_id,))

            return [row[0] for row in cursor.fetchall()]
        finally:
            cursor.close()
