"""
Declaration Correction Models - Audit trail for corrections/amendments

Table: declaration_corrections
Audit trail des corrections apportées aux déclarations (déclarations rectificatives)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum


class CorrectionType(str, Enum):
    """Type de correction"""
    AMOUNT_CORRECTION = "amount_correction"          # Correction de montant
    DATA_CORRECTION = "data_correction"              # Correction de données
    PERIOD_CORRECTION = "period_correction"          # Correction de période
    TAX_RATE_CORRECTION = "tax_rate_correction"      # Correction de taux
    DEDUCTION_CORRECTION = "deduction_correction"    # Correction de déductions
    FULL_RECTIFICATION = "full_rectification"        # Rectification complète
    PARTIAL_RECTIFICATION = "partial_rectification"  # Rectification partielle
    ADMINISTRATIVE_CORRECTION = "administrative_correction"  # Correction administrative


class CorrectionStatus(str, Enum):
    """Status de la correction"""
    PENDING = "pending"        # En attente
    APPROVED = "approved"      # Approuvée
    REJECTED = "rejected"      # Rejetée
    CANCELLED = "cancelled"    # Annulée


class DeclarationCorrectionBase(BaseModel):
    """Base model for declaration correction"""

    original_declaration_id: str = Field(..., description="UUID déclaration originale")
    rectificative_declaration_id: str = Field(..., description="UUID déclaration rectificative")

    correction_type: CorrectionType = Field(..., description="Type de correction")
    correction_reason: str = Field(..., description="Raison de la correction")

    # Amounts
    original_amount: Optional[Decimal] = Field(None, description="Montant original")
    rectified_amount: Optional[Decimal] = Field(None, description="Montant rectifié")
    # difference is GENERATED in DB: rectified_amount - original_amount

    # Changes detail (JSONB)
    changes_detail: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Détail JSON des changements: {field_name: {old: X, new: Y}}"
    )

    # Supporting documents
    supporting_documents: List[str] = Field(
        default=[],
        description="Array de FK vers uploaded_files (justificatifs)"
    )


class DeclarationCorrectionCreate(DeclarationCorrectionBase):
    """Create declaration correction"""
    status: CorrectionStatus = Field(default=CorrectionStatus.PENDING)


class DeclarationCorrectionUpdate(BaseModel):
    """Update declaration correction"""
    status: Optional[CorrectionStatus] = None
    correction_reason: Optional[str] = None
    changes_detail: Optional[Dict[str, Dict[str, Any]]] = None
    supporting_documents: Optional[List[str]] = None
    approval_notes: Optional[str] = None


class DeclarationCorrectionResponse(DeclarationCorrectionBase):
    """Response model for declaration correction"""
    id: str

    # Calculated difference
    difference: Optional[Decimal] = Field(None, description="Différence (GENERATED)")

    # Approval tracking
    status: CorrectionStatus
    approved_by: Optional[str] = Field(None, description="UUID approbateur")
    approved_at: Optional[datetime] = Field(None, description="Date approbation")
    approval_notes: Optional[str] = Field(None, description="Notes approbation")

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Related data (populated by joins)
    original_declaration_type: Optional[str] = None
    rectificative_declaration_type: Optional[str] = None
    original_user_email: Optional[str] = None


class DeclarationCorrectionListResponse(BaseModel):
    """List of declaration corrections"""
    corrections: List[DeclarationCorrectionResponse]
    total: int
    page: int
    page_size: int
