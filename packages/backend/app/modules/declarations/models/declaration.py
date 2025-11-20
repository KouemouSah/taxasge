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
    """Base model for tax declaration"""

    # Identifiers
    user_id: str = Field(..., description="User UUID owning the declaration")
    company_id: Optional[str] = Field(None, description="Company UUID (for business users)")

    # Declaration metadata
    declaration_type: DeclarationType = Field(..., description="Type of declaration (28 types)")
    fiscal_period_start: date = Field(..., description="Start date of fiscal period")
    fiscal_period_end: date = Field(..., description="End date of fiscal period")
    tax_year: int = Field(..., ge=2000, le=2100, description="Tax year (YYYY)")

    # Financial data
    total_income: Optional[Decimal] = Field(None, ge=0, description="Total income/revenue")
    total_deductions: Optional[Decimal] = Field(None, ge=0, description="Total deductions")
    taxable_amount: Optional[Decimal] = Field(None, ge=0, description="Taxable amount (base)")
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Tax rate (%)")
    calculated_tax: Optional[Decimal] = Field(None, ge=0, description="Calculated tax amount")

    # Status and validation
    status: DeclarationStatus = Field(default=DeclarationStatus.DRAFT, description="Declaration status")

    # OCR and documents
    source_document_id: Optional[str] = Field(None, description="Source document UUID (if OCR)")
    ocr_confidence_score: Optional[Decimal] = Field(None, ge=0, le=100, description="OCR confidence (%)")

    # Additional data (JSONB)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

    # Agent comments
    agent_notes: Optional[str] = Field(None, max_length=2000, description="Agent validation notes")
    rejection_reason: Optional[str] = Field(None, max_length=1000, description="Rejection reason")


class DeclarationCreate(DeclarationBase):
    """Schema for creating a new declaration"""

    # Optional fields for draft creation
    total_income: Optional[Decimal] = Field(None, ge=0)
    fiscal_period_start: Optional[date] = None
    fiscal_period_end: Optional[date] = None

    @validator('tax_year', pre=True, always=True)
    def set_default_tax_year(cls, v):
        """Default to current year if not provided"""
        return v or datetime.now().year


class DeclarationUpdate(BaseModel):
    """Schema for updating an existing declaration"""

    # Financial data (all optional for partial updates)
    total_income: Optional[Decimal] = Field(None, ge=0)
    total_deductions: Optional[Decimal] = Field(None, ge=0)
    taxable_amount: Optional[Decimal] = Field(None, ge=0)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    calculated_tax: Optional[Decimal] = Field(None, ge=0)

    # Status updates
    status: Optional[DeclarationStatus] = None
    agent_notes: Optional[str] = Field(None, max_length=2000)
    rejection_reason: Optional[str] = Field(None, max_length=1000)

    # Metadata updates
    metadata: Optional[Dict[str, Any]] = None


class DeclarationResponse(DeclarationBase):
    """Schema for declaration response"""

    # Database fields
    id: str = Field(..., description="Declaration UUID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")
    reviewed_at: Optional[datetime] = Field(None, description="Review timestamp")

    # Reviewer info
    reviewed_by_user_id: Optional[str] = Field(None, description="Agent UUID who reviewed")

    # Payment info
    payment_id: Optional[str] = Field(None, description="Associated payment UUID")
    payment_status: Optional[str] = Field(None, description="Payment status")

    # Related entities (populated by joins)
    user_email: Optional[str] = Field(None, description="User email (from join)")
    company_name: Optional[str] = Field(None, description="Company name (from join)")

    class Config:
        from_attributes = True


class DeclarationListResponse(BaseModel):
    """Schema for paginated declaration list"""

    declarations: List[DeclarationResponse] = Field(..., description="List of declarations")
    total: int = Field(..., description="Total count")
    page: int = Field(..., ge=1, description="Current page")
    page_size: int = Field(..., ge=1, le=100, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total pages")
