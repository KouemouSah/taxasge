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
