"""Fiscal Services Models"""

from app.modules.fiscal_services.models.fiscal_service import (
    # ENUMs
    ServiceTypeEnum,
    CalculationMethodEnum,
    ServiceStatusEnum,

    # Hierarchy Models
    MinistryResponse,
    SectorResponse,

    # Categories
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,

    # Fiscal Services
    FiscalServiceBase,
    FiscalServiceCreate,
    FiscalServiceUpdate,
    FiscalServiceResponse,
    FiscalServiceWithCategory,

    # Calculation Models
    CalculationInput,
    RateTier,
    CalculationBreakdown,
    CalculationResult,

    # Search and Filtering
    FiscalServiceFilter,
    FiscalServiceListResponse,
    FiscalServiceSearchRequest,  # Alias for FiscalServiceFilter
    CalculateServiceRequest,      # Alias for CalculationInput
    CalculateServiceResponse,     # Alias for CalculationResult

    # Statistics
    FiscalServiceStats,

    # Complete Models
    FiscalServiceCreateComplete,
    FiscalServiceUpdateComplete,
    FiscalServiceCompleteResponse,
)

from app.modules.fiscal_services.models.templates import (
    # ENUMs
    TranslatableEntityType,

    # Document Templates
    DocumentTemplateBase,
    DocumentTemplateCreate,
    DocumentTemplateUpdate,
    DocumentTemplateResponse,
    DocumentTemplateListResponse,

    # Procedure Templates
    ProcedureTemplateBase,
    ProcedureTemplateCreate,
    ProcedureTemplateUpdate,
    ProcedureTemplateResponse,
    ProcedureTemplateListResponse,
    ProcedureTemplateWithSteps,

    # Procedure Steps
    ProcedureStepBase,
    ProcedureStepCreate,
    ProcedureStepUpdate,
    ProcedureStepResponse,

    # Service Document Assignments
    ServiceDocumentAssignmentBase,
    ServiceDocumentAssignmentCreate,
    ServiceDocumentAssignmentUpdate,
    ServiceDocumentAssignmentResponse,

    # Service Procedure Assignments
    ServiceProcedureAssignmentBase,
    ServiceProcedureAssignmentCreate,
    ServiceProcedureAssignmentUpdate,
    ServiceProcedureAssignmentResponse,

    # Service Keywords
    ServiceKeywordBase,
    ServiceKeywordCreate,
    ServiceKeywordUpdate,
    ServiceKeywordResponse,
    ServiceKeywordBulkCreate,

    # Entity Translations
    EntityTranslationBase,
    EntityTranslationCreate,
    EntityTranslationUpdate,
    EntityTranslationResponse,
    EntityTranslationBulk,
)

__all__ = [
    # ENUMs
    "ServiceTypeEnum",
    "CalculationMethodEnum",
    "ServiceStatusEnum",
    "TranslatableEntityType",

    # Hierarchy Models
    "MinistryResponse",
    "SectorResponse",

    # Categories
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",

    # Fiscal Services
    "FiscalServiceBase",
    "FiscalServiceCreate",
    "FiscalServiceUpdate",
    "FiscalServiceResponse",
    "FiscalServiceWithCategory",

    # Calculation Models
    "CalculationInput",
    "RateTier",
    "CalculationBreakdown",
    "CalculationResult",

    # Search and Filtering
    "FiscalServiceFilter",
    "FiscalServiceListResponse",
    "FiscalServiceSearchRequest",  # Alias
    "CalculateServiceRequest",      # Alias
    "CalculateServiceResponse",     # Alias

    # Statistics
    "FiscalServiceStats",

    # Complete Models
    "FiscalServiceCreateComplete",
    "FiscalServiceUpdateComplete",
    "FiscalServiceCompleteResponse",

    # Document Templates
    "DocumentTemplateBase",
    "DocumentTemplateCreate",
    "DocumentTemplateUpdate",
    "DocumentTemplateResponse",
    "DocumentTemplateListResponse",

    # Procedure Templates
    "ProcedureTemplateBase",
    "ProcedureTemplateCreate",
    "ProcedureTemplateUpdate",
    "ProcedureTemplateResponse",
    "ProcedureTemplateListResponse",
    "ProcedureTemplateWithSteps",

    # Procedure Steps
    "ProcedureStepBase",
    "ProcedureStepCreate",
    "ProcedureStepUpdate",
    "ProcedureStepResponse",

    # Service Document Assignments
    "ServiceDocumentAssignmentBase",
    "ServiceDocumentAssignmentCreate",
    "ServiceDocumentAssignmentUpdate",
    "ServiceDocumentAssignmentResponse",

    # Service Procedure Assignments
    "ServiceProcedureAssignmentBase",
    "ServiceProcedureAssignmentCreate",
    "ServiceProcedureAssignmentUpdate",
    "ServiceProcedureAssignmentResponse",

    # Service Keywords
    "ServiceKeywordBase",
    "ServiceKeywordCreate",
    "ServiceKeywordUpdate",
    "ServiceKeywordResponse",
    "ServiceKeywordBulkCreate",

    # Entity Translations
    "EntityTranslationBase",
    "EntityTranslationCreate",
    "EntityTranslationUpdate",
    "EntityTranslationResponse",
    "EntityTranslationBulk",
]
