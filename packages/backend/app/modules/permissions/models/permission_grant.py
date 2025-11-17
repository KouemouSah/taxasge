"""
PermissionGrant Models - Audit trail for permission changes
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class PermissionAuditLogBase(BaseModel):
    """Base audit log model"""
    action: str = Field(..., description="Action type: INSERT, UPDATE, DELETE, CLEANUP")
    table_name: str = Field(..., description="Table name: role_permissions, user_permissions")
    record_id: Optional[str] = Field(None, description="Record identifier")
    user_id: Optional[str] = Field(None, description="Affected user ID (for user_permissions)")
    permission_id: Optional[str] = Field(None, description="Affected permission ID")
    old_value: Optional[Dict[str, Any]] = Field(None, description="Old value (JSON) before change")
    new_value: Optional[Dict[str, Any]] = Field(None, description="New value (JSON) after change")


class PermissionAuditLogResponse(PermissionAuditLogBase):
    """Schema for audit log response"""
    id: str = Field(..., description="Audit log UUID")
    changed_by: Optional[str] = Field(None, description="User ID who made the change")
    changed_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "audit-uuid-123",
                "action": "INSERT",
                "table_name": "user_permissions",
                "record_id": "user-uuid-123-perm-uuid-456",
                "user_id": "user-uuid-123",
                "permission_id": "perm-uuid-456",
                "old_value": None,
                "new_value": {
                    "user_id": "user-uuid-123",
                    "permission_id": "perm-uuid-456",
                    "granted": True,
                    "expires_at": "2025-11-24T10:00:00Z",
                    "reason": "Permiso temporal"
                },
                "changed_by": "admin-uuid-789",
                "changed_at": "2025-11-17T10:00:00Z"
            }
        }


class PermissionAuditLogWithDetails(BaseModel):
    """Schema for audit log with human-readable details"""
    id: str
    action: str
    table_name: str
    user_id: Optional[str]
    user_email: Optional[str]
    user_full_name: Optional[str]
    permission_id: Optional[str]
    permission_name: Optional[str]
    old_value: Optional[Dict[str, Any]]
    new_value: Optional[Dict[str, Any]]
    changed_by: Optional[str]
    changed_by_name: Optional[str]
    changed_at: datetime
    action_description: str = Field(..., description="Human-readable description of the change")

    class Config:
        from_attributes = True


class PermissionAuditLogListResponse(BaseModel):
    """Schema for paginated audit log list"""
    logs: list[PermissionAuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PermissionAuditLogFilters(BaseModel):
    """Filters for querying audit logs"""
    user_id: Optional[str] = None
    permission_id: Optional[str] = None
    action: Optional[str] = None
    table_name: Optional[str] = None
    changed_by: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class PermissionGrantSummary(BaseModel):
    """Summary of permission grants/revokes for a user"""
    user_id: str
    user_email: str
    total_grants: int = 0
    total_revokes: int = 0
    total_updates: int = 0
    last_grant_at: Optional[datetime] = None
    last_revoke_at: Optional[datetime] = None
    granted_by_users: list[str] = Field(default_factory=list, description="List of admin user IDs who granted permissions")
