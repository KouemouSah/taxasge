"""
UserPermission Repository - Database operations for user-specific permissions
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

from app.modules.permissions.models.user_permission import (
    UserPermissionCreate,
    UserPermissionUpdate,
)


class UserPermissionRepository:
    """Repository for user permission CRUD operations"""

    def __init__(self, db_connection):
        """
        Initialize repository with database connection

        Args:
            db_connection: psycopg2 connection object
        """
        self.db = db_connection

    async def get_by_user_and_permission(
        self,
        user_id: str,
        permission_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get user permission by user ID and permission ID

        Args:
            user_id: User UUID
            permission_id: Permission UUID

        Returns:
            UserPermission dict or None if not found
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT user_id, permission_id, granted, granted_by, granted_at,
                       expires_at, reason,
                       CASE
                           WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN TRUE
                           ELSE FALSE
                       END as is_expired
                FROM user_permissions
                WHERE user_id = %s AND permission_id = %s
            """, (user_id, permission_id))

            result = cursor.fetchone()
            return dict(result) if result else None
        finally:
            cursor.close()

    async def get_by_user(
        self,
        user_id: str,
        include_expired: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get all permissions for a user

        Args:
            user_id: User UUID
            include_expired: Whether to include expired permissions

        Returns:
            List of user permission dicts
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            query = """
                SELECT user_id, permission_id, granted, granted_by, granted_at,
                       expires_at, reason,
                       CASE
                           WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN TRUE
                           ELSE FALSE
                       END as is_expired
                FROM user_permissions
                WHERE user_id = %s
            """

            if not include_expired:
                query += " AND (expires_at IS NULL OR expires_at >= NOW())"

            query += " ORDER BY granted_at DESC"

            cursor.execute(query, (user_id,))
            results = cursor.fetchall()
            return [dict(row) for row in results]
        finally:
            cursor.close()

    async def get_by_user_with_details(
        self,
        user_id: str,
        include_expired: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get user permissions with full details (user, permission, granted_by info)

        Args:
            user_id: User UUID
            include_expired: Whether to include expired permissions

        Returns:
            List of detailed user permission dicts
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            query = """
                SELECT
                    up.user_id,
                    u.email as user_email,
                    u.full_name as user_full_name,
                    up.permission_id,
                    p.name as permission_name,
                    p.resource as permission_resource,
                    p.action as permission_action,
                    p.is_critical as permission_is_critical,
                    up.granted,
                    up.granted_by,
                    gb.full_name as granted_by_name,
                    up.granted_at,
                    up.expires_at,
                    up.reason,
                    CASE
                        WHEN up.expires_at IS NOT NULL AND up.expires_at < NOW() THEN TRUE
                        ELSE FALSE
                    END as is_expired
                FROM user_permissions up
                INNER JOIN users u ON up.user_id = u.id
                INNER JOIN permissions p ON up.permission_id = p.id
                LEFT JOIN users gb ON up.granted_by = gb.id
                WHERE up.user_id = %s
            """

            if not include_expired:
                query += " AND (up.expires_at IS NULL OR up.expires_at >= NOW())"

            query += " ORDER BY up.granted_at DESC"

            cursor.execute(query, (user_id,))
            results = cursor.fetchall()
            return [dict(row) for row in results]
        finally:
            cursor.close()

    async def get_expired_permissions(self) -> List[Dict[str, Any]]:
        """
        Get all expired permissions

        Returns:
            List of expired user permission dicts
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                SELECT user_id, permission_id, granted, granted_by, granted_at,
                       expires_at, reason, TRUE as is_expired
                FROM user_permissions
                WHERE expires_at IS NOT NULL AND expires_at < NOW()
                ORDER BY expires_at DESC
            """)

            results = cursor.fetchall()
            return [dict(row) for row in results]
        finally:
            cursor.close()

    async def create(
        self,
        user_permission: UserPermissionCreate,
        granted_by: str
    ) -> Dict[str, Any]:
        """
        Create a new user permission

        Args:
            user_permission: User permission data
            granted_by: User ID who granted the permission

        Returns:
            Created user permission dict
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                INSERT INTO user_permissions (
                    user_id, permission_id, granted, granted_by, expires_at, reason
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, permission_id) DO UPDATE
                SET granted = EXCLUDED.granted,
                    granted_by = EXCLUDED.granted_by,
                    granted_at = NOW(),
                    expires_at = EXCLUDED.expires_at,
                    reason = EXCLUDED.reason
                RETURNING user_id, permission_id, granted, granted_by, granted_at,
                          expires_at, reason,
                          CASE
                              WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN TRUE
                              ELSE FALSE
                          END as is_expired
            """, (
                user_permission.user_id,
                user_permission.permission_id,
                user_permission.granted,
                granted_by,
                user_permission.expires_at,
                user_permission.reason
            ))

            result = cursor.fetchone()
            self.db.commit()
            return dict(result)
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def update(
        self,
        user_id: str,
        permission_id: str,
        user_permission: UserPermissionUpdate
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing user permission

        Args:
            user_id: User UUID
            permission_id: Permission UUID
            user_permission: Updated permission data

        Returns:
            Updated user permission dict or None if not found
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            # Build dynamic update query
            update_fields = []
            params = []

            if user_permission.granted is not None:
                update_fields.append("granted = %s")
                params.append(user_permission.granted)

            if user_permission.expires_at is not None:
                update_fields.append("expires_at = %s")
                params.append(user_permission.expires_at)

            if user_permission.reason is not None:
                update_fields.append("reason = %s")
                params.append(user_permission.reason)

            if not update_fields:
                # No fields to update
                return await self.get_by_user_and_permission(user_id, permission_id)

            params.extend([user_id, permission_id])

            query = f"""
                UPDATE user_permissions
                SET {', '.join(update_fields)}
                WHERE user_id = %s AND permission_id = %s
                RETURNING user_id, permission_id, granted, granted_by, granted_at,
                          expires_at, reason,
                          CASE
                              WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN TRUE
                              ELSE FALSE
                          END as is_expired
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

    async def delete(self, user_id: str, permission_id: str) -> bool:
        """
        Delete a user permission (revoke)

        Args:
            user_id: User UUID
            permission_id: Permission UUID

        Returns:
            True if deleted, False if not found
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                DELETE FROM user_permissions
                WHERE user_id = %s AND permission_id = %s
            """, (user_id, permission_id))

            deleted = cursor.rowcount > 0
            self.db.commit()
            return deleted
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def cleanup_expired(self) -> int:
        """
        Delete all expired permissions

        Returns:
            Number of deleted permissions
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                DELETE FROM user_permissions
                WHERE expires_at IS NOT NULL AND expires_at < NOW()
            """)

            deleted_count = cursor.rowcount
            self.db.commit()
            return deleted_count
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    async def has_permission(
        self,
        user_id: str,
        permission_name: str
    ) -> bool:
        """
        Check if user has a specific permission (via role or override)

        Args:
            user_id: User UUID
            permission_name: Permission name (e.g., "assignment.view")

        Returns:
            True if user has permission, False otherwise
        """
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                -- Check user override first (highest priority)
                SELECT EXISTS (
                    SELECT 1
                    FROM user_permissions up
                    INNER JOIN permissions p ON up.permission_id = p.id
                    WHERE up.user_id = %s
                      AND p.name = %s
                      AND up.granted = TRUE
                      AND (up.expires_at IS NULL OR up.expires_at >= NOW())
                )
                UNION ALL
                -- Check role permissions (if no override)
                SELECT EXISTS (
                    SELECT 1
                    FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    INNER JOIN role_permissions rp ON r.id = rp.role_id
                    INNER JOIN permissions p ON rp.permission_id = p.id
                    WHERE u.id = %s
                      AND p.name = %s
                      AND rp.granted = TRUE
                      AND NOT EXISTS (
                          -- No explicit deny in user overrides
                          SELECT 1
                          FROM user_permissions up2
                          INNER JOIN permissions p2 ON up2.permission_id = p2.id
                          WHERE up2.user_id = u.id
                            AND p2.name = %s
                            AND up2.granted = FALSE
                      )
                )
                LIMIT 1
            """, (user_id, permission_name, user_id, permission_name, permission_name))

            result = cursor.fetchone()
            return result[0] if result else False
        finally:
            cursor.close()

    async def get_user_permissions_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Get summary of user's permissions (role + overrides)

        Args:
            user_id: User UUID

        Returns:
            Summary dict with counts and details
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute("""
                WITH role_perms AS (
                    SELECT COUNT(*) as role_count
                    FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    INNER JOIN role_permissions rp ON r.id = rp.role_id
                    WHERE u.id = %s AND rp.granted = TRUE
                ),
                user_overrides AS (
                    SELECT COUNT(*) as override_count
                    FROM user_permissions
                    WHERE user_id = %s
                      AND (expires_at IS NULL OR expires_at >= NOW())
                ),
                expired_count AS (
                    SELECT COUNT(*) as expired
                    FROM user_permissions
                    WHERE user_id = %s
                      AND expires_at IS NOT NULL
                      AND expires_at < NOW()
                )
                SELECT
                    u.id as user_id,
                    u.email as user_email,
                    r.code as role_code,
                    r.name as role_name,
                    COALESCE(rp.role_count, 0) as role_permissions_count,
                    COALESCE(uo.override_count, 0) as user_overrides_count,
                    COALESCE(rp.role_count, 0) + COALESCE(uo.override_count, 0) as total_permissions,
                    COALESCE(ec.expired, 0) > 0 as has_expired_permissions
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN role_perms rp ON TRUE
                LEFT JOIN user_overrides uo ON TRUE
                LEFT JOIN expired_count ec ON TRUE
                WHERE u.id = %s
            """, (user_id, user_id, user_id, user_id))

            result = cursor.fetchone()
            return dict(result) if result else None
        finally:
            cursor.close()
