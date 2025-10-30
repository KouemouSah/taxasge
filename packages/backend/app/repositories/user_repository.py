"""
User repository for TaxasGE Backend
Handles user data persistence with PostgreSQL and Supabase
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from loguru import logger

from app.repositories.base import BaseRepository
from app.models.user import (
    UserResponse, UserCreate, UserUpdate, UserSearchFilter,
    UserStats, UserActivity, UserNotificationPreferences,
    UserRole, UserStatus
)


class UserRepository(BaseRepository[UserResponse]):
    """Repository for user management operations"""

    def __init__(self):
        super().__init__("users")

    def _map_to_model(self, data: Dict[str, Any]) -> UserResponse:
        """Map database row to UserResponse model"""
        return UserResponse(
            id=str(data["id"]),  # Convert UUID to string
            email=data["email"],
            role=UserRole(data["role"]),
            status=UserStatus(data["status"]),
            first_name=data["first_name"],
            last_name=data["last_name"],
            phone=data.get("phone_number"),  # Note: DB column is phone_number
            address=data.get("address"),
            city=data.get("city"),
            language=data.get("preferred_language", "es"),  # Note: DB column is preferred_language
            avatar_url=data.get("avatar_url"),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            last_login=data.get("last_login"),
            citizen_profile=data.get("citizen_profile"),
            business_profile=data.get("business_profile")
        )

    def _map_from_model(self, model: UserResponse) -> Dict[str, Any]:
        """Map UserResponse model to database row"""
        return {
            "id": model.id,
            "email": model.email,
            "role": model.role.value,
            "status": model.status.value,
            "first_name": model.first_name,
            "last_name": model.last_name,
            "phone": model.phone,
            "address": model.address,
            "city": model.city,
            "country": model.country,
            "language": model.language,
            "avatar_url": model.avatar_url,
            "created_at": model.created_at,
            "updated_at": model.updated_at,
            "last_login": model.last_login,
            "citizen_profile": model.citizen_profile.dict() if model.citizen_profile else None,
            "business_profile": model.business_profile.dict() if model.business_profile else None
        }

    async def find_by_email(self, email: str, use_supabase: bool = True) -> Optional[UserResponse]:
        """Find user by email address"""
        try:
            if use_supabase and self.supabase.enabled:
                results = await self.supabase.select(
                    self.table_name,
                    filters={"email": email}
                )
                if results:
                    return self._map_to_model(results[0])
            else:
                query = f"SELECT * FROM {self.table_name} WHERE email = $1"
                result = await self.db_manager.execute_single(query, email)
                if result:
                    return self._map_to_model(dict(result))

        except Exception as e:
            logger.error(f"❌ Error finding user by email {email}: {e}")

        return None

    async def create_user(self, user_data: UserCreate, password_hash: str) -> Optional[UserResponse]:
        """Create new user with password hash"""
        try:
            from uuid import uuid4
            from datetime import datetime

            # Generate ID and timestamps
            user_id = str(uuid4())
            now = datetime.utcnow()

            # Prepare data for insertion (using REAL Supabase columns)
            data = {
                "id": user_id,
                "email": user_data.email,
                "password_hash": password_hash,
                "first_name": user_data.profile.first_name,
                "last_name": user_data.profile.last_name,
                # full_name is a GENERATED column in Supabase, don't insert
                "phone_number": user_data.profile.phone,  # Note: phone -> phone_number
                "address": user_data.profile.address,  # Profile field
                "city": user_data.profile.city,  # Profile field
                "avatar_url": user_data.profile.avatar_url,  # Profile field
                "role": user_data.role.value,
                "status": UserStatus.active.value,
                "preferred_language": user_data.profile.language if user_data.profile.language else "es",  # Note: language -> preferred_language
                # created_at, updated_at have DB defaults, no need to insert
            }

            # Insert user directly using db_manager
            columns = list(data.keys())
            placeholders = [f"${i+1}" for i in range(len(columns))]
            values = list(data.values())

            query = f"""
                INSERT INTO {self.table_name} ({', '.join(columns)})
                VALUES ({', '.join(placeholders)})
                RETURNING *
            """

            result = await self.db_manager.execute_single(query, *values)
            if result:
                return self._map_to_model(dict(result))

            return None

        except Exception as e:
            logger.error(f"❌ Error creating user: {e}")
            return None

    async def update_password(self, user_id: str, password_hash: str) -> bool:
        """Update user password hash"""
        try:
            updates = {
                "password_hash": password_hash,
                "updated_at": datetime.utcnow()
            }

            if self.supabase.enabled:
                results = await self.supabase.update(
                    self.table_name,
                    filters={"id": user_id},
                    data=updates
                )
                return len(results) > 0
            else:
                query = """
                    UPDATE users
                    SET password_hash = $1, updated_at = $2
                    WHERE id = $3
                """
                result = await self.db_manager.execute_command(
                    query, password_hash, updates["updated_at"], user_id
                )
                return "UPDATE 1" in result

        except Exception as e:
            logger.error(f"❌ Error updating password for user {user_id}: {e}")
            return False

    async def update_last_login(self, user_id: str) -> bool:
        """Update user's last login timestamp"""
        try:
            now = datetime.utcnow()
            updates = {
                "last_login": now,
                "updated_at": now
            }

            return await self.update(user_id, updates) is not None

        except Exception as e:
            logger.error(f"❌ Error updating last login for user {user_id}: {e}")
            return False

    async def search_users(self, search_filter: UserSearchFilter) -> List[UserResponse]:
        """Search users with advanced filtering"""
        try:
            filters = {}

            # Build filters
            if search_filter.role:
                filters["role"] = search_filter.role.value
            if search_filter.status:
                filters["status"] = search_filter.status.value
            if search_filter.country:
                filters["country"] = search_filter.country
            if search_filter.city:
                filters["city"] = search_filter.city
            if search_filter.language:
                filters["language"] = search_filter.language

            # Text search
            if search_filter.search_query:
                search_columns = ["first_name", "last_name", "email"]
                return await self.search(
                    search_filter.search_query,
                    search_columns,
                    filters
                )

            # Email filter (partial match)
            if search_filter.email:
                if self.supabase.enabled:
                    # Use Supabase ILIKE operator
                    results = await self.supabase.select(
                        self.table_name,
                        filters={**filters, "email": {"operator": "ilike", "value": f"%{search_filter.email}%"}}
                    )
                    return [self._map_to_model(row) for row in results]
                else:
                    # Use PostgreSQL ILIKE
                    query_parts = [f"SELECT * FROM {self.table_name}"]
                    conditions = ["email ILIKE $1"]
                    params = [f"%{search_filter.email}%"]
                    param_count = 1

                    for key, value in filters.items():
                        param_count += 1
                        conditions.append(f"{key} = ${param_count}")
                        params.append(value)

                    query_parts.append(f"WHERE {' AND '.join(conditions)}")
                    query = " ".join(query_parts)

                    results = await self.db_manager.execute_query(query, *params)
                    return [self._map_to_model(dict(row)) for row in results]

            # Standard filtering
            return await self.find_all(filters=filters)

        except Exception as e:
            logger.error(f"❌ Error searching users: {e}")
            return []

    async def get_user_stats(self) -> UserStats:
        """Get user statistics"""
        try:
            total_users = await self.count()
            active_users = await self.count({"status": UserStatus.active.value})

            # New users this month
            start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            new_users_query = """
                SELECT COUNT(*) FROM users
                WHERE created_at >= $1
            """
            new_users_this_month = await self.db_manager.execute_scalar(
                new_users_query, start_of_month
            ) or 0

            # Users by role
            role_stats_query = """
                SELECT role, COUNT(*) as count
                FROM users
                GROUP BY role
            """
            role_results = await self.db_manager.execute_query(role_stats_query)
            users_by_role = {row["role"]: row["count"] for row in role_results}

            # Users by status
            status_stats_query = """
                SELECT status, COUNT(*) as count
                FROM users
                GROUP BY status
            """
            status_results = await self.db_manager.execute_query(status_stats_query)
            users_by_status = {row["status"]: row["count"] for row in status_results}

            # Users by country
            country_stats_query = """
                SELECT country, COUNT(*) as count
                FROM users
                GROUP BY country
                ORDER BY count DESC
                LIMIT 10
            """
            country_results = await self.db_manager.execute_query(country_stats_query)
            users_by_country = {row["country"]: row["count"] for row in country_results}

            return UserStats(
                total_users=total_users,
                active_users=active_users,
                new_users_this_month=new_users_this_month,
                users_by_role=users_by_role,
                users_by_status=users_by_status,
                users_by_country=users_by_country
            )

        except Exception as e:
            logger.error(f"❌ Error getting user stats: {e}")
            return UserStats(
                total_users=0,
                active_users=0,
                new_users_this_month=0,
                users_by_role={},
                users_by_status={},
                users_by_country={}
            )

    async def log_user_activity(self, activity: UserActivity) -> bool:
        """Log user activity"""
        try:
            if self.supabase.enabled:
                data = {
                    "user_id": activity.user_id,
                    "action": activity.action,
                    "resource": activity.resource,
                    "ip_address": activity.ip_address,
                    "user_agent": activity.user_agent,
                    "metadata": activity.metadata,
                    "timestamp": activity.timestamp
                }
                result = await self.supabase.insert("user_activities", data)
                return result is not None
            else:
                query = """
                    INSERT INTO user_activities
                    (user_id, action, resource, ip_address, user_agent, metadata, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """
                result = await self.db_manager.execute_command(
                    query,
                    activity.user_id,
                    activity.action,
                    activity.resource,
                    activity.ip_address,
                    activity.user_agent,
                    activity.metadata,
                    activity.timestamp
                )
                return "INSERT" in result

        except Exception as e:
            logger.error(f"❌ Error logging user activity: {e}")
            return False

    async def get_user_activities(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[UserActivity]:
        """Get user activity history"""
        try:
            if self.supabase.enabled:
                results = await self.supabase.select(
                    "user_activities",
                    filters={"user_id": user_id},
                    order="timestamp.desc",
                    limit=limit
                )
                return [
                    UserActivity(
                        user_id=row["user_id"],
                        action=row["action"],
                        resource=row.get("resource"),
                        ip_address=row.get("ip_address"),
                        user_agent=row.get("user_agent"),
                        metadata=row.get("metadata"),
                        timestamp=row["timestamp"]
                    )
                    for row in results
                ]
            else:
                query = """
                    SELECT * FROM user_activities
                    WHERE user_id = $1
                    ORDER BY timestamp DESC
                    LIMIT $2
                """
                results = await self.db_manager.execute_query(query, user_id, limit)
                return [
                    UserActivity(
                        user_id=row["user_id"],
                        action=row["action"],
                        resource=row.get("resource"),
                        ip_address=row.get("ip_address"),
                        user_agent=row.get("user_agent"),
                        metadata=row.get("metadata"),
                        timestamp=row["timestamp"]
                    )
                    for row in results
                ]

        except Exception as e:
            logger.error(f"❌ Error getting user activities for {user_id}: {e}")
            return []


# Global user repository instance
user_repository = UserRepository()