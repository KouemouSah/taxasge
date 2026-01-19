"""
Menu Configuration Models - Pydantic schemas

These models define the structure for dynamic menu and dashboard configuration
for agents. Supports both workflow-based (auto-generated) and module-based
(explicitly configured) menu systems.
"""
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator


# =============================================================================
# MENU ITEM MODELS
# =============================================================================

class MenuBadgeConfig(BaseModel):
    """Configuration for menu item badge"""
    type: Literal["count", "status"] = Field(..., description="Badge type")
    source: str = Field(..., description="Data source for badge (endpoint or key)")


class SubMenuItemBase(BaseModel):
    """Base model for sub-menu items"""
    id: str = Field(..., min_length=1, max_length=50, description="Unique sub-menu ID")
    titleKey: str = Field(..., min_length=1, description="i18n key for title")
    href: str = Field(..., description="Navigation URL")
    icon: str = Field(..., description="Lucide icon name")
    permission: Optional[str] = Field(None, description="Required permission")


class SubMenuItemWithBadge(SubMenuItemBase):
    """Sub-menu item with optional badge"""
    badge: Optional[MenuBadgeConfig] = Field(None, description="Badge configuration")


class MenuItemBase(BaseModel):
    """Base model for menu items"""
    id: str = Field(..., min_length=1, max_length=50, description="Unique menu ID")
    titleKey: str = Field(..., min_length=1, description="i18n key for title")
    icon: str = Field(..., description="Lucide icon name")
    href: Optional[str] = Field(None, description="Direct navigation URL (if no sub-items)")
    permission: Optional[str] = Field(None, description="Required permission for group")
    items: Optional[List[SubMenuItemWithBadge]] = Field(None, description="Sub-menu items")

    @model_validator(mode='after')
    def validate_href_or_items(self):
        """Ensure menu has either href or items, not both with content"""
        if self.items and len(self.items) > 0 and self.href:
            raise ValueError('Menu item cannot have both href and items')
        return self


# =============================================================================
# MENU CONFIG MODELS
# =============================================================================

class MenuConfigBase(BaseModel):
    """Base menu configuration"""
    version: str = Field("1.0", description="Config version")
    source: Literal["workflow", "role", "custom"] = Field(..., description="Config source type")
    menus: List[MenuItemBase] = Field(..., description="Menu items")


class MenuConfigCreate(MenuConfigBase):
    """Schema for creating menu config"""
    pass


class MenuConfigResponse(MenuConfigBase):
    """Schema for menu config response"""
    pass


# =============================================================================
# DASHBOARD CONFIG MODELS
# =============================================================================

class WidgetConfigBase(BaseModel):
    """Base widget configuration"""
    id: str = Field(..., description="Widget identifier")
    visible: bool = Field(True, description="Is widget visible")
    position: int = Field(..., ge=1, description="Display position")
    size: Literal["small", "medium", "large", "full"] = Field("medium", description="Widget size")
    customConfig: Optional[Dict[str, Any]] = Field(None, description="Custom widget config")


class DashboardConfigBase(BaseModel):
    """Base dashboard configuration"""
    version: str = Field("1.0", description="Config version")
    layout: Literal["grid", "list", "custom"] = Field("grid", description="Layout type")
    widgets: List[WidgetConfigBase] = Field(..., description="Widget configurations")


class DashboardConfigCreate(DashboardConfigBase):
    """Schema for creating dashboard config"""
    pass


class DashboardConfigResponse(DashboardConfigBase):
    """Schema for dashboard config response"""
    pass


# =============================================================================
# MENU TEMPLATE MODELS
# =============================================================================

class MenuTemplateBase(BaseModel):
    """Base menu template"""
    code: str = Field(..., min_length=2, max_length=50, description="Unique template code")
    name: str = Field(..., min_length=2, max_length=100, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    template_type: Literal["workflow", "module", "custom"] = Field(..., description="Template type")
    entity_code: Optional[str] = Field(None, max_length=50, description="Entity scope (NULL=global)")
    menu_structure: Dict[str, Any] = Field(..., description="Menu structure JSON")
    dashboard_widgets: Optional[Dict[str, Any]] = Field(None, description="Dashboard widgets JSON")


class MenuTemplateCreate(MenuTemplateBase):
    """Schema for creating menu template"""
    pass


class MenuTemplateUpdate(BaseModel):
    """Schema for updating menu template"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    menu_structure: Optional[Dict[str, Any]] = None
    dashboard_widgets: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class MenuTemplateResponse(MenuTemplateBase):
    """Schema for menu template response"""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True


class MenuTemplateListResponse(BaseModel):
    """Schema for paginated menu template list"""
    items: List[MenuTemplateResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# WORKFLOW MENU MAPPING MODELS
# =============================================================================

class WorkflowMenuMappingBase(BaseModel):
    """Base workflow menu mapping"""
    workflow_pattern: str = Field(
        ..., min_length=1, max_length=100,
        description="Workflow pattern (e.g., PASAPORTE_%)"
    )
    menu_group_id: str = Field(
        ..., min_length=1, max_length=50,
        description="Menu group ID"
    )
    menu_title_key: str = Field(
        ..., min_length=1, max_length=100,
        description="i18n key for menu title"
    )
    menu_icon: str = Field(
        ..., min_length=1, max_length=50,
        description="Lucide icon name"
    )
    display_order: int = Field(0, ge=0, description="Display order")
    include_pending: bool = Field(True, description="Include pending sub-menu")
    include_validation: bool = Field(True, description="Include validation sub-menu")
    include_appointments: bool = Field(False, description="Include appointments sub-menu")
    include_history: bool = Field(True, description="Include history sub-menu")
    permission_prefix: Optional[str] = Field(None, max_length=50, description="Permission prefix")


class WorkflowMenuMappingCreate(WorkflowMenuMappingBase):
    """Schema for creating mapping"""
    pass


class WorkflowMenuMappingUpdate(BaseModel):
    """Schema for updating mapping"""
    menu_title_key: Optional[str] = None
    menu_icon: Optional[str] = None
    display_order: Optional[int] = None
    include_pending: Optional[bool] = None
    include_validation: Optional[bool] = None
    include_appointments: Optional[bool] = None
    include_history: Optional[bool] = None
    permission_prefix: Optional[str] = None
    is_active: Optional[bool] = None


class WorkflowMenuMappingResponse(WorkflowMenuMappingBase):
    """Schema for mapping response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowMenuMappingListResponse(BaseModel):
    """Schema for paginated mapping list"""
    items: List[WorkflowMenuMappingResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# AGENT MENU CONFIG RESPONSE (Combined)
# =============================================================================

class AgentMenuConfigResponse(BaseModel):
    """Complete menu configuration for an agent"""
    # Agent info
    agent_profile_id: UUID
    entity_code: Optional[str] = None
    entity_type: Literal["workflow", "module"]
    role_code: Optional[str] = None

    # Workflows (for workflow-based agents)
    available_workflows: List[str] = Field(default_factory=list)

    # Menu configuration
    menu_config: MenuConfigResponse

    # Dashboard configuration
    dashboard_config: DashboardConfigResponse

    # Permissions (for frontend filtering)
    permissions: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True
