"""
Role Models - Pydantic schemas for roles
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator


class RoleBase(BaseModel):
    """Base role model with common fields"""
    name: str = Field(..., min_length=2, max_length=100, description="Role display name")
    code: str = Field(..., min_length=2, max_length=50, description="Unique role code (used in code)")
    entity_type: Optional[str] = Field(None, max_length=50, description="Entity type: DGI, Ministry, or NULL for global")
    description: Optional[str] = Field(None, description="Role description")


class RoleCreate(RoleBase):
    """Schema for creating a new role"""

    @validator('code')
    def validate_code_format(cls, v):
        """Validate role code format: lowercase with underscores only (for creation only)"""
        if not v.replace('_', '').isalnum():
            raise ValueError('Role code must contain only alphanumeric characters and underscores')
        if v != v.lower():
            raise ValueError('Role code must be lowercase')
        return v

    @validator('entity_type')
    def validate_entity_type(cls, v):
        """Validate entity_type is one of allowed values"""
        if v is not None and v not in ['DGI', 'Ministry', 'agent']:
            raise ValueError('entity_type must be one of: DGI, Ministry, agent, or NULL')
        return v


class RoleUpdate(BaseModel):
    """Schema for updating an existing role"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class RoleResponse(RoleBase):
    """Schema for role responses"""
    id: str = Field(..., description="Role UUID")
    is_system: bool = Field(..., description="System roles cannot be modified/deleted")
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = Field(None, description="User ID who created this role (NULL for system roles)")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Supervisor DGI Junior",
                "code": "supervisor_dgi_junior",
                "entity_type": "DGI",
                "description": "Supervisor junior con permisos limitados",
                "is_system": False,
                "created_at": "2025-11-17T10:00:00Z",
                "updated_at": "2025-11-17T10:00:00Z",
                "created_by": "admin-user-id"
            }
        }


class RoleWithPermissionsResponse(RoleResponse):
    """Schema for role with associated permissions"""
    permissions: List[str] = Field(default_factory=list, description="List of permission names")
    permissions_count: int = Field(0, description="Total number of permissions")


class RoleListResponse(BaseModel):
    """Schema for paginated role list"""
    roles: List[RoleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AssignPermissionsToRoleRequest(BaseModel):
    """Schema for assigning multiple permissions to a role"""
    permission_ids: List[str] = Field(..., min_length=1, description="List of permission UUIDs to assign")
    granted: bool = Field(True, description="True to grant, False to deny")

    @validator('permission_ids')
    def validate_permission_ids(cls, v):
        """Ensure permission IDs are unique"""
        if len(v) != len(set(v)):
            raise ValueError('Duplicate permission IDs found')
        return v


class RemovePermissionsFromRoleRequest(BaseModel):
    """Schema for removing permissions from a role"""
    permission_ids: List[str] = Field(..., min_length=1, description="List of permission UUIDs to remove")

    @validator('permission_ids')
    def validate_permission_ids(cls, v):
        """Ensure permission IDs are unique"""
        if len(v) != len(set(v)):
            raise ValueError('Duplicate permission IDs found')
        return v
