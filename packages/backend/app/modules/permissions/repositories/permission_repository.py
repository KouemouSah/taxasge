"""
Permission Repository - Database operations for permissions
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

from app.modules.permissions.models.permission import (
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
)


class PermissionRepository:
    """Repository for permission CRUD operations"""

    def __init__(self, db_connection):
        """
        Initialize repository with database connection

        Args:
            db_connection: psycopg2 connection object
        """
        self.db = db_connection

    async def get_by_id(self, permission_id: str) -> Optional[Dict[str, Any]]:
        """
        Get permission by ID

        Args:
            permission_id: Permission UUID

        Returns:
            Permission dict or None if not found
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT id, name, resource, action, description, is_critical,
                       module_name, created_at, updated_at
                FROM permissions
                WHERE id = %s
            """, (permission_id,))

            result = cursor.fetchone()
            return dict(result) if result else None
        finally:
            cursor.close()

    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get permission by unique name

        Args:
            name: Permission name (e.g., "assignment.reassign_in_progress")

        Returns:
            Permission dict or None if not found
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT id, name, resource, action, description, is_critical,
                       module_name, created_at, updated_at
                FROM permissions
                WHERE name = %s
            """, (name,))

            result = cursor.fetchone()
            return dict(result) if result else None
        finally:
            cursor.close()

    async def get_all(
        self,
        module_name: Optional[str] = None,
        resource: Optional[str] = None,
        is_critical: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all permissions with optional filters

        Args:
            module_name: Filter by module name
            resource: Filter by resource
            is_critical: Filter by critical flag
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of permission dicts
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            query = """
                SELECT id, name, resource, action, description, is_critical,
                       module_name, created_at, updated_at
                FROM permissions
                WHERE 1=1
            """
            params = []

            if module_name is not None:
                query += " AND module_name = %s"
                params.append(module_name)

            if resource is not None:
                query += " AND resource = %s"
                params.append(resource)

            if is_critical is not None:
                query += " AND is_critical = %s"
                params.append(is_critical)

            query += " ORDER BY module_name, resource, action LIMIT %s OFFSET %s"
            params.extend([limit, offset])

            cursor.execute(query, params)
            results = cursor.fetchall()
            return [dict(row) for row in results]
        finally:
            cursor.close()

    async def count(
        self,
        module_name: Optional[str] = None,
        resource: Optional[str] = None,
        is_critical: Optional[bool] = None
    ) -> int:
        """
        Count permissions with optional filters

        Args:
            module_name: Filter by module name
            resource: Filter by resource
            is_critical: Filter by critical flag

        Returns:
            Total count
        """
        cursor = self.db.cursor()
        try:
            query = "SELECT COUNT(*) FROM permissions WHERE 1=1"
            params = []

            if module_name is not None:
                query += " AND module_name = %s"
                params.append(module_name)

            if resource is not None:
                query += " AND resource = %s"
                params.append(resource)

            if is_critical is not None:
                query += " AND is_critical = %s"
                params.append(is_critical)

            cursor.execute(query, params)
            return cursor.fetchone()[0]
        finally:
            cursor.close()

    async def get_by_module(self, module_name: str) -> List[Dict[str, Any]]:
        """
        Get all permissions for a specific module

        Args:
            module_name: Module name

        Returns:
            List of permission dicts
        """
        return await self.get_all(module_name=module_name, limit=1000)

    async def get_grouped_by_module(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all permissions grouped by module

        Returns:
            Dict with module names as keys and permission lists as values
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT id, name, resource, action, description, is_critical,
                       module_name, created_at, updated_at
                FROM permissions
                ORDER BY module_name, resource, action
            """)

            results = cursor.fetchall()
            grouped = {}

            for row in results:
                module = row['module_name'] or 'unknown'
                if module not in grouped:
                    grouped[module] = []
                grouped[module].append(dict(row))

            return grouped
        finally:
            cursor.close()

    async def create(self, permission: PermissionCreate) -> Dict[str, Any]:
        """
        Create a new permission

        Args:
            permission: Permission data

        Returns:
            Created permission dict

        Raises:
            psycopg2.IntegrityError: If permission name already exists
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                INSERT INTO permissions (name, resource, action, description, is_critical, module_name)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, name, resource, action, description, is_critical,
                          module_name, created_at, updated_at
            """, (
                permission.name,
                permission.resource,
                permission.action,
                permission.description,
                permission.is_critical,
                permission.module_name
            ))

            result = cursor.fetchone()
            self.db.commit()
            return dict(result)
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def bulk_create(self, permissions: List[PermissionCreate]) -> List[Dict[str, Any]]:
        """
        Create multiple permissions at once

        Args:
            permissions: List of permission data

        Returns:
            List of created permission dicts
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            created_permissions = []

            for permission in permissions:
                cursor.execute("""
                    INSERT INTO permissions (name, resource, action, description, is_critical, module_name)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name) DO NOTHING
                    RETURNING id, name, resource, action, description, is_critical,
                              module_name, created_at, updated_at
                """, (
                    permission.name,
                    permission.resource,
                    permission.action,
                    permission.description,
                    permission.is_critical,
                    permission.module_name
                ))

                result = cursor.fetchone()
                if result:
                    created_permissions.append(dict(result))

            self.db.commit()
            return created_permissions
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def update(self, permission_id: str, permission: PermissionUpdate) -> Optional[Dict[str, Any]]:
        """
        Update an existing permission

        Args:
            permission_id: Permission UUID
            permission: Updated permission data

        Returns:
            Updated permission dict or None if not found
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            # Build dynamic update query
            update_fields = []
            params = []

            if permission.description is not None:
                update_fields.append("description = %s")
                params.append(permission.description)

            if permission.is_critical is not None:
                update_fields.append("is_critical = %s")
                params.append(permission.is_critical)

            if permission.module_name is not None:
                update_fields.append("module_name = %s")
                params.append(permission.module_name)

            if not update_fields:
                # No fields to update
                return await self.get_by_id(permission_id)

            update_fields.append("updated_at = NOW()")
            params.append(permission_id)

            query = f"""
                UPDATE permissions
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, name, resource, action, description, is_critical,
                          module_name, created_at, updated_at
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

    async def delete(self, permission_id: str) -> bool:
        """
        Delete a permission

        Args:
            permission_id: Permission UUID

        Returns:
            True if deleted, False if not found
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                DELETE FROM permissions
                WHERE id = %s
            """, (permission_id,))

            deleted = cursor.rowcount > 0
            self.db.commit()
            return deleted
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def exists(self, name: str) -> bool:
        """
        Check if a permission exists by name

        Args:
            name: Permission name

        Returns:
            True if exists, False otherwise
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                SELECT EXISTS(SELECT 1 FROM permissions WHERE name = %s)
            """, (name,))

            return cursor.fetchone()[0]
        finally:
            cursor.close()

    async def get_critical_permissions(self) -> List[Dict[str, Any]]:
        """
        Get all critical permissions

        Returns:
            List of critical permission dicts
        """
        return await self.get_all(is_critical=True, limit=1000)
