"""
Homepage Module - Pydantic Models
Defines request/response models for homepage statistics and category directory
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class HomepageStats(BaseModel):
    """Dynamic homepage statistics calculated from database"""
    total_services: int = Field(..., description="Total number of active fiscal services")
    total_ministries: int = Field(..., description="Total number of active ministries")
    total_categories: int = Field(..., description="Total number of active categories")
    total_sectors: int = Field(..., description="Total number of active sectors")
    last_updated: str = Field(..., description="ISO timestamp of when stats were calculated")


class CategoryWithServices(BaseModel):
    """Category with service count and translations"""
    id: int = Field(..., description="Category ID")
    category_code: str = Field(..., description="Category code")
    name: str = Field(..., description="Category name (translated)")
    description: Optional[str] = Field(None, description="Category description (translated)")
    icon: Optional[str] = Field(None, description="Category icon")
    color: Optional[str] = Field(None, description="Category color")
    service_count: int = Field(..., description="Number of active services in this category")
    ministry_name: Optional[str] = Field(None, description="Associated ministry name")
    sector_name: Optional[str] = Field(None, description="Associated sector name")


class CategoryDirectory(BaseModel):
    """Category directory response"""
    total_categories: int = Field(..., description="Total number of categories")
    total_services: int = Field(..., description="Total number of services across all categories")
    categories: List[CategoryWithServices] = Field(..., description="List of categories with service counts")
    last_updated: str = Field(..., description="ISO timestamp")


class ServiceByType(BaseModel):
    """Service details for services-by-type endpoint"""
    id: int = Field(..., description="Service ID")
    service_code: str = Field(..., description="Service code")
    name_es: str = Field(..., description="Service name (Spanish)")
    name_fr: Optional[str] = Field(None, description="Service name (French)")
    name_en: Optional[str] = Field(None, description="Service name (English)")
    tasa_expedicion: Optional[float] = Field(None, description="Expedition fee in GNF")


class ServicesByTypeResponse(BaseModel):
    """Response for services grouped by type and letter"""
    type: str = Field(..., description="Service type filter")
    letter: Optional[str] = Field(None, description="First letter filter (A-Z)")
    services: List[ServiceByType] = Field(..., description="List of services")
    total: int = Field(..., description="Total services for this type/letter")
    has_more: bool = Field(..., description="Whether there are more services beyond limit")


# ============================================================================
# MINISTRY MODELS
# ============================================================================

class MinistryItem(BaseModel):
    """Ministry item with service count"""
    id: int = Field(..., description="Ministry ID")
    ministry_code: str = Field(..., description="Ministry code")
    name: str = Field(..., description="Ministry name (translated)")
    description: Optional[str] = Field(None, description="Ministry description (translated)")
    icon: Optional[str] = Field(None, description="Ministry icon")
    color: Optional[str] = Field(None, description="Ministry color")
    is_active: bool = Field(True, description="Whether ministry is active")
    service_count: int = Field(0, description="Number of services under this ministry")
    sector_count: int = Field(0, description="Number of sectors under this ministry")
    category_count: int = Field(0, description="Number of categories under this ministry")


class MinistryDirectory(BaseModel):
    """Ministry directory response"""
    total_ministries: int = Field(..., description="Total number of ministries")
    total_services: int = Field(..., description="Total number of services across all ministries")
    ministries: List[MinistryItem] = Field(..., description="List of ministries with service counts")


class MinistryServiceItem(BaseModel):
    """Service item for ministry details"""
    id: int = Field(..., description="Service ID")
    service_code: str = Field(..., description="Service code")
    name: str = Field(..., description="Service name (translated)")
    description: Optional[str] = Field(None, description="Service description (translated)")
    expedition_price: float = Field(0, description="Expedition price")
    renewal_price: float = Field(0, description="Renewal price")
    category_name: Optional[str] = Field(None, description="Category name")
    sector_name: Optional[str] = Field(None, description="Sector name")
    service_type: str = Field(..., description="Service type")


class MinistryDetails(BaseModel):
    """Complete ministry details with services"""
    id: int = Field(..., description="Ministry ID")
    ministry_code: str = Field(..., description="Ministry code")
    name: str = Field(..., description="Ministry name (translated)")
    description: Optional[str] = Field(None, description="Ministry description (translated)")
    icon: Optional[str] = Field(None, description="Ministry icon")
    color: Optional[str] = Field(None, description="Ministry color")
    is_active: bool = Field(True, description="Whether ministry is active")
    service_count: int = Field(0, description="Total services")
    sector_count: int = Field(0, description="Total sectors")
    category_count: int = Field(0, description="Total categories")
    services: List[MinistryServiceItem] = Field([], description="Services list (paginated)")
    total_pages: int = Field(1, description="Total pages")
    current_page: int = Field(1, description="Current page")
