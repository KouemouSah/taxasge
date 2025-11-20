"""
Payment Models - BANGE Mobile Payment Integration

Table: payments (polymorphe - tax_declarations XOR fiscal_services)
Aligned with DATABASE_SCHEMA_REFERENCE.md
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class PaymentType(str, Enum):
    """Type de paiement"""
    FULL = "full"              # Paiement complet
    PARTIAL = "partial"        # Paiement partiel
    INSTALLMENT = "installment"  # Acompte (échéancier)


class PaymentStatus(str, Enum):
    """Status de paiement"""
    PENDING = "pending"          # En attente
    PROCESSING = "processing"    # En traitement BANGE
    COMPLETED = "completed"      # Complété
    FAILED = "failed"            # Échoué
    CANCELLED = "cancelled"      # Annulé
    REFUNDED = "refunded"        # Remboursé


class PaymentMethod(str, Enum):
    """Méthode de paiement"""
    BANK_TRANSFER = "bank_transfer"  # Virement bancaire
    MOBILE_MONEY = "mobile_money"    # Mobile money (BANGE)
    CASH = "cash"                    # Espèces
    CARD = "card"                    # Carte bancaire
    CHECK = "check"                  # Chèque


class PaymentBase(BaseModel):
    """Base payment model - Polymorphe"""

    user_id: str = Field(..., description="User UUID")

    # Polymorphic: tax_declaration_id XOR fiscal_service_id
    tax_declaration_id: Optional[str] = Field(None, description="FK tax_declarations (XOR fiscal_service_id)")
    fiscal_service_id: Optional[int] = Field(None, description="FK fiscal_services (XOR tax_declaration_id)")

    # Payment plan (optional)
    payment_plan_id: Optional[str] = Field(None, description="FK payment_plans (si paiement partiel)")
    installment_id: Optional[str] = Field(None, description="FK payment_installments (si acompte)")

    # Amounts
    base_amount: Decimal = Field(..., ge=0, description="Montant de base")
    penalties: Decimal = Field(default=Decimal("0"), ge=0, description="Pénalités")
    interest: Decimal = Field(default=Decimal("0"), ge=0, description="Intérêts")
    currency: str = Field(default="XAF", description="Devise")

    # Payment details
    payment_type: PaymentType = Field(default=PaymentType.FULL)
    payment_method: PaymentMethod = Field(..., description="Méthode de paiement")

    # BANGE integration
    bank_reference: Optional[str] = Field(None, description="Référence bancaire (unique)")

    # Idempotency (prevent double-click duplicates)
    idempotency_key: str = Field(..., description="Clé d'idempotence client (unique)")

    @validator('tax_declaration_id', 'fiscal_service_id')
    def validate_polymorphic(cls, v, values):
        """Ensure XOR: exactly one of tax_declaration_id or fiscal_service_id"""
        tax_id = values.get('tax_declaration_id')
        fiscal_id = values.get('fiscal_service_id')

        if tax_id and fiscal_id:
            raise ValueError("Cannot set both tax_declaration_id and fiscal_service_id")
        if not tax_id and not fiscal_id:
            raise ValueError("Must set either tax_declaration_id or fiscal_service_id")

        return v


class PaymentCreate(PaymentBase):
    """Create payment"""
    pass


class PaymentUpdate(BaseModel):
    """Update payment"""
    status: Optional[PaymentStatus] = None
    bank_reference: Optional[str] = None
    paid_at: Optional[datetime] = None


class PaymentResponse(PaymentBase):
    """Payment response"""
    id: str

    # Calculated amount (GENERATED in DB or calculated)
    amount: Decimal = Field(..., description="Total amount (base + penalties + interest)")

    # Status
    status: PaymentStatus

    # BANGE transaction
    bank_transaction_id: Optional[str] = Field(None, description="FK bank_transactions")

    # Timestamps
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime] = None

    # Related data (populated by joins)
    declaration_type: Optional[str] = Field(None, description="Type déclaration (si tax_declaration)")
    fiscal_service_name: Optional[str] = Field(None, description="Nom service (si fiscal_service)")
    user_email: Optional[str] = None


class PaymentListResponse(BaseModel):
    """List of payments"""
    payments: List[PaymentResponse]
    total: int
    page: int
    page_size: int


# ========== PAYMENT PLANS ==========

class PaymentPlanCreate(BaseModel):
    """Create payment plan (échéancier)"""
    payment_id: str = Field(..., description="FK payments")
    number_of_installments: int = Field(..., ge=2, le=12, description="Nombre d'acomptes (2-12)")
    installment_frequency: str = Field(default="monthly", description="Fréquence: monthly, bi_monthly, quarterly")
    first_installment_date: date = Field(..., description="Date 1er acompte")


class InstallmentResponse(BaseModel):
    """Payment installment"""
    id: str
    payment_plan_id: str
    installment_number: int = Field(..., description="Numéro acompte (1, 2, 3...)")
    amount: Decimal = Field(..., ge=0)
    due_date: date
    status: PaymentStatus
    paid_at: Optional[datetime] = None
    created_at: datetime


class PaymentPlanResponse(BaseModel):
    """Payment plan with installments"""
    id: str
    payment_id: str
    total_amount: Decimal
    number_of_installments: int
    installment_frequency: str
    status: str  # active, completed, cancelled
    created_at: datetime

    installments: List[InstallmentResponse] = []
