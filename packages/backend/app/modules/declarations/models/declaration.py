"""
Declaration Models - Pydantic schemas for tax declarations

Aligned with DATABASE_SCHEMA_REFERENCE.md:
- Table: tax_declarations (main table)
- Enums: declaration_status_enum, declaration_type_enum (28 types)
- Related: declaration_iva_details, declaration_irpf_data, declaration_petroliferos_details,
           declaration_retencion_details, declaration_other_details
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class DeclarationStatus(str, Enum):
    """
    Status enum for tax declarations
    Source: DATABASE_SCHEMA_REFERENCE.md declaration_status_enum
    """
    DRAFT = "draft"                    # En cours de rédaction
    SUBMITTED = "submitted"            # Soumise (envoyée)
    PROCESSING = "processing"          # En traitement par agent
    ACCEPTED = "accepted"              # Acceptée/Approuvée
    REJECTED = "rejected"              # Rejetée
    AMENDED = "amended"                # Amendée/Corrigée


class DeclarationType(str, Enum):
    """
    Type enum for tax declarations (28 types)
    Source: DATABASE_SCHEMA_REFERENCE.md declaration_type_enum

    Répartition:
    - IVA: 90% volume (iva_destajo, iva_real)
    - IRPF: 5% volume (income tax)
    - Pétrolifères: 4% volume, GROS MONTANTS (6 sous-types)
    - Retenciones: 1% volume (3%, 5%, 10%)
    - Autres: <1% volume (7 autres types)
    """
    # IVA (Impuesto al Valor Agregado) - 90% volume
    IVA_DESTAJO = "iva_destajo"                    # IVA au coup par coup
    IVA_REAL = "iva_real"                          # IVA régime réel

    # IRPF (Impuesto sobre la Renta de las Personas Físicas) - 5% volume
    INCOME_TAX = "income_tax"                      # Impôt sur le revenu
    CORPORATE_TAX = "corporate_tax"                # Impôt sociétés

    # Pétrolifères - 4% volume, GROS MONTANTS
    RETENCION_3PCT_PETROLERO = "retencion_3pct_petrolero"       # Retenue 3% pétrole
    RETENCION_5PCT_PETROLERO = "retencion_5pct_petrolero"       # Retenue 5% pétrole
    RETENCION_10PCT_PETROLERO = "retencion_10pct_petrolero"     # Retenue 10% pétrole
    PETROLEO_GAS = "petroleo_gas"                  # Pétrole et gaz
    PETROLEO_DIESEL = "petroleo_diesel"            # Diesel
    PETROLEO_ESSENCE = "petroleo_essence"          # Essence

    # Retenciones (Retenues à la source) - 1% volume
    RETENCION_3PCT = "retencion_3pct"              # Retenue 3% générale
    RETENCION_5PCT = "retencion_5pct"              # Retenue 5% générale
    RETENCION_10PCT = "retencion_10pct"            # Retenue 10% générale

    # Autres types (<1% volume) - Stockés dans declaration_other_details
    VAT_DECLARATION = "vat_declaration"            # Déclaration TVA
    SALES_TAX = "sales_tax"                        # Taxe sur les ventes
    PROPERTY_TAX = "property_tax"                  # Taxe foncière
    PAYROLL_TAX = "payroll_tax"                    # Taxe sur salaires
    EXCISE_TAX = "excise_tax"                      # Taxe d'accise
    CUSTOMS_DECLARATION = "customs_declaration"    # Déclaration douanière
    SPECIAL_TAX = "special_tax"                    # Taxe spéciale

    # Types additionnels
    QUARTERLY_RETURN = "quarterly_return"          # Déclaration trimestrielle
    ANNUAL_RETURN = "annual_return"                # Déclaration annuelle
    AMENDED_RETURN = "amended_return"              # Déclaration rectificative
    ESTIMATED_TAX = "estimated_tax"                # Impôt estimé
    WITHHOLDING_TAX = "withholding_tax"            # Retenue à la source générique
    CAPITAL_GAINS = "capital_gains"                # Plus-values
    INHERITANCE_TAX = "inheritance_tax"            # Droits de succession


class DeclarationBase(BaseModel):
    """
    Base model for tax declaration

    ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md table: tax_declarations
    """

    # Identifiers
    user_id: str = Field(..., description="User UUID owning the declaration")
    company_id: Optional[str] = Field(None, description="Company UUID (for business users)")

    # Declaration metadata - ALIGNED WITH DB
    declaration_type: DeclarationType = Field(..., description="Type of declaration (28 types)")
    fiscal_year: int = Field(..., ge=2000, le=2100, description="Fiscal year (YYYY) - DB: fiscal_year")
    fiscal_period: Optional[str] = Field(None, max_length=20, description="Fiscal period (varchar) - DB: fiscal_period")
    declaration_deadline: Optional[date] = Field(None, description="Declaration deadline - DB: declaration_deadline")

    # Financial data - ALIGNED WITH DB
    taxable_base: Optional[Decimal] = Field(None, ge=0, description="Taxable base - DB: taxable_base")
    calculated_tax: Optional[Decimal] = Field(None, ge=0, description="Calculated tax - DB: calculated_tax")
    deductions: Optional[Decimal] = Field(None, ge=0, description="Deductions - DB: deductions")
    credits: Optional[Decimal] = Field(None, ge=0, description="Credits - DB: credits")
    net_tax_due: Optional[Decimal] = Field(None, ge=0, description="Net tax due - DB: net_tax_due")

    # Status and validation - ALIGNED WITH DB
    status: DeclarationStatus = Field(default=DeclarationStatus.DRAFT, description="Declaration status - DB: status")

    # Additional data (JSONB) - ALIGNED WITH DB
    declared_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Declared data (JSONB) - DB: declared_data")
    supporting_documents: Optional[List[str]] = Field(default_factory=list, description="Supporting documents (JSONB array) - DB: supporting_documents")

    # Agent/Processor notes - ALIGNED WITH DB
    taxpayer_notes: Optional[str] = Field(None, description="Taxpayer notes - DB: taxpayer_notes")
    processor_notes: Optional[str] = Field(None, description="Processor notes - DB: processor_notes")
    rejection_reason: Optional[str] = Field(None, description="Rejection reason - DB: rejection_reason")

    # Digital signature - ALIGNED WITH DB
    digital_signature: Optional[str] = Field(None, description="Digital signature - DB: digital_signature")

    # Declaration nature - ALIGNED WITH DB
    declaration_nature: Optional[str] = Field("original", max_length=20, description="Nature: original, rectificative, complementaire, annulation - DB: declaration_nature")
    original_declaration_id: Optional[str] = Field(None, description="Reference to original declaration if rectificative - DB: original_declaration_id")


class DeclarationCreate(DeclarationBase):
    """Schema for creating a new declaration"""

    # Optional fields for draft creation
    taxable_base: Optional[Decimal] = Field(None, ge=0)
    fiscal_period: Optional[str] = None

    @validator('fiscal_year', pre=True, always=True)
    def set_default_fiscal_year(cls, v):
        """Default to current year if not provided"""
        return v or datetime.now().year


class DeclarationUpdate(BaseModel):
    """Schema for updating an existing declaration - ALIGNED WITH DB"""

    # Financial data (all optional for partial updates) - ALIGNED WITH DB
    taxable_base: Optional[Decimal] = Field(None, ge=0)
    calculated_tax: Optional[Decimal] = Field(None, ge=0)
    deductions: Optional[Decimal] = Field(None, ge=0)
    credits: Optional[Decimal] = Field(None, ge=0)
    net_tax_due: Optional[Decimal] = Field(None, ge=0)

    # Status updates - ALIGNED WITH DB
    status: Optional[DeclarationStatus] = None
    taxpayer_notes: Optional[str] = Field(None)
    processor_notes: Optional[str] = Field(None)
    rejection_reason: Optional[str] = Field(None)

    # Data updates - ALIGNED WITH DB
    declared_data: Optional[Dict[str, Any]] = None
    supporting_documents: Optional[List[str]] = None


class DeclarationResponse(DeclarationBase):
    """Schema for declaration response - ALIGNED WITH DB"""

    # Database fields - ALIGNED WITH DB
    id: str = Field(..., description="Declaration UUID - DB: id")
    declaration_number: str = Field(..., description="Declaration number (unique) - DB: declaration_number")
    created_at: datetime = Field(..., description="Creation timestamp - DB: created_at")
    updated_at: datetime = Field(..., description="Last update timestamp - DB: updated_at")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp - DB: submitted_at")
    processed_at: Optional[datetime] = Field(None, description="Processing timestamp - DB: processed_at")

    # Processor info - ALIGNED WITH DB
    processed_by: Optional[str] = Field(None, description="Processor/Agent UUID - DB: processed_by")

    # Signature - ALIGNED WITH DB
    signature_timestamp: Optional[datetime] = Field(None, description="Signature timestamp - DB: signature_timestamp")

    # Related entities (populated by joins)
    user_email: Optional[str] = Field(None, description="User email (from join)")
    company_name: Optional[str] = Field(None, description="Company name (from join)")
    processor_name: Optional[str] = Field(None, description="Processor name (from join)")

    class Config:
        from_attributes = True


class DeclarationListResponse(BaseModel):
    """Schema for paginated declaration list"""

    declarations: List[DeclarationResponse] = Field(..., description="List of declarations")
    total: int = Field(..., description="Total count")
    page: int = Field(..., ge=1, description="Current page")
    page_size: int = Field(..., ge=1, le=100, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total pages")


class WorkflowStage(BaseModel):
    """Single workflow stage"""
    stage: str = Field(..., description="Stage identifier")
    name: str = Field(..., description="Stage display name")
    completed: bool = Field(..., description="Whether this stage is completed")


class DeclarationWorkflowStatus(BaseModel):
    """
    Workflow status for a declaration
    Business logic for tracking declaration progress through stages
    """
    declaration_id: str = Field(..., description="Declaration UUID")
    current_stage: str = Field(..., description="Current workflow stage")
    stages: List[WorkflowStage] = Field(..., description="All workflow stages with completion status")
    next_actions: List[str] = Field(..., description="Available actions for current stage")

    # Additional context
    status: DeclarationStatus = Field(..., description="Current declaration status")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")
    processed_at: Optional[datetime] = Field(None, description="Processing timestamp")
    processed_by: Optional[str] = Field(None, description="Processor UUID")
