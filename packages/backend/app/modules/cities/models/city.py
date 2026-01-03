"""
City Pydantic models.

Defines the data structures for city and entity management.
"""

from datetime import datetime
from typing import Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# Valid regions (fixed)
VALID_REGIONS = ["Insular", "Continental"]
RegionType = Literal["Insular", "Continental"]


class CityBase(BaseModel):
    """Base model with common city fields."""
    name: str = Field(..., min_length=2, max_length=100)
    region: RegionType
    description: Optional[str] = None
    is_capital: bool = False
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Normalize city name (capitalize first letter)."""
        return v.strip().title()


class CityCreate(CityBase):
    """Model for creating a new city."""
    pass


class CityUpdate(BaseModel):
    """Model for updating a city. All fields optional."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    region: Optional[RegionType] = None
    description: Optional[str] = None
    is_capital: Optional[bool] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip().title()


class City(CityBase):
    """Full city model with all fields."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    model_config = {"from_attributes": True}


class CityResponse(BaseModel):
    """Response model for a single city."""
    id: UUID
    name: str
    region: RegionType
    description: Optional[str] = None
    is_capital: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CitySimple(BaseModel):
    """Simplified city model for dropdowns."""
    id: UUID
    name: str
    region: RegionType
    is_capital: bool

    model_config = {"from_attributes": True}


class CityListResponse(BaseModel):
    """Response model for list of cities."""
    items: List[CityResponse]
    total: int


# Entity models
class EntityBase(BaseModel):
    """Base model with common entity fields."""
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Normalize entity code to uppercase."""
        return v.strip().upper()


class EntityCreate(EntityBase):
    """Model for creating a new entity."""
    pass


class EntityUpdate(BaseModel):
    """Model for updating an entity. All fields optional."""
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip().upper()


class Entity(EntityBase):
    """Full entity model with all fields."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    model_config = {"from_attributes": True}


class EntityResponse(BaseModel):
    """Response model for a single entity."""
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EntitySimple(BaseModel):
    """Simplified entity model for dropdowns."""
    id: UUID
    code: str
    name: str

    model_config = {"from_attributes": True}


class EntityListResponse(BaseModel):
    """Response model for list of entities."""
    items: List[EntityResponse]
    total: int
