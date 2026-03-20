"""Bundle Workflow API routes.

Endpoints for the BUNDLE_PAYMENT workflow (citizen-facing):
  GET  /bundle-workflow/my-companies       — User's companies + obligation status
  GET  /bundle-workflow/search-company     — Search eligible companies
  POST /bundle-workflow/initiate           — Verify/create license, return obligations
  POST /bundle-workflow/validate-selection — Validate mode + selection before payment
  POST /bundle-workflow/initiate-payment   — Create SR + payment + link obligations (atomic)
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.database.connection import get_database
from app.modules.auth.dependencies import get_current_user
from app.modules.fiscal_services.services.bundle_workflow_service import (
    BundleWorkflowService,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bundle-workflow", tags=["bundle-workflow"])


# ================================================================
# Pydantic Request/Response Models
# ================================================================


class BundleInitiateRequest(BaseModel):
    company_id: str = Field(..., description="UUID of the company")
    fiscal_year: Optional[int] = Field(None, description="Defaults to current year", ge=2020, le=2050)


class BundleInitiateFromUploadRequest(BaseModel):
    extraction: Dict[str, Any] = Field(
        ..., description="GeminiDocumentProcessor extraction output (nested dict)",
        max_length=100,  # Max 100 top-level keys
    )
    fiscal_year: Optional[int] = Field(None, description="Defaults to current year", ge=2020, le=2050)


class BundleValidateSelectionRequest(BaseModel):
    license_id: str = Field(..., description="UUID of the license")
    processing_mode: str = Field(..., description="per_line or consolidated")
    selected_obligation_ids: Optional[List[str]] = Field(
        None, description="Required for per_line mode"
    )


class BundleInitiatePaymentRequest(BaseModel):
    license_id: str = Field(..., description="UUID of the license")
    processing_mode: str = Field(..., description="per_line or consolidated")
    payment_method: str = Field(..., description="mobile_money, cash, card, etc.")
    selected_obligation_ids: List[str] = Field(
        ..., description="Obligation UUIDs to pay"
    )
    phone_number: Optional[str] = Field(
        None, description="Required for mobile_money"
    )


# ================================================================
# Endpoints
# ================================================================


@router.get("/my-companies")
async def get_my_companies_status(
    fiscal_year: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get user's companies with pending obligation counts.

    Returns max 5 companies sorted by urgency.
    No special permission required — scoped to authenticated user.
    """
    user_id = UUID(current_user["id"])
    result = await BundleWorkflowService.my_companies_status(
        db, user_id, fiscal_year
    )
    return {"companies": result}


@router.get("/search-company")
async def search_eligible_company(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Search companies eligible for bundle payment.

    Filters: regimen_fiscal='bundle', is_active=true.
    No special permission required — any authenticated user can search.
    """
    user_id = UUID(current_user["id"])
    results = await BundleWorkflowService.search_eligible_companies(
        db, q, user_id, limit
    )
    return {"companies": results, "total": len(results)}


@router.post("/initiate")
async def initiate_bundle_workflow(
    body: BundleInitiateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Verify company, find/create license, return obligations for review.

    Main entry point after company selection (Step 0 → Step 2).
    """
    user_id = UUID(current_user["id"])
    try:
        result = await BundleWorkflowService.initiate(
            db,
            company_id=UUID(body.company_id),
            user_id=user_id,
            fiscal_year=body.fiscal_year,
        )
        return result
    except ValueError as e:
        error_code = str(e).split(":")[0]
        raise HTTPException(
            status_code=_error_status(error_code),
            detail=_error_detail(error_code),
        )


@router.post("/initiate-from-upload")
async def initiate_from_upload(
    body: BundleInitiateFromUploadRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Create company from OCR extraction, classify, then initiate workflow.

    Reuses: map_gemini_extraction_to_company_data + CompanyRepository.create
    + ClassificationAgent.classify_company + BundleWorkflowService.initiate.
    """
    user_id = UUID(current_user["id"])
    try:
        result = await BundleWorkflowService.initiate_from_upload(
            db,
            extraction=body.extraction,
            user_id=user_id,
            fiscal_year=body.fiscal_year,
        )
        return result
    except ValueError as e:
        error_code = str(e).split(":")[0]
        raise HTTPException(
            status_code=_error_status(error_code),
            detail=_error_detail(error_code),
        )


@router.post("/validate-selection")
async def validate_bundle_selection(
    body: BundleValidateSelectionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Validate mode + obligation selection before payment."""
    try:
        obligation_uuids = (
            [UUID(oid) for oid in body.selected_obligation_ids]
            if body.selected_obligation_ids
            else None
        )
        result = await BundleWorkflowService.validate_selection(
            db,
            license_id=UUID(body.license_id),
            processing_mode=body.processing_mode,
            selected_obligation_ids=obligation_uuids,
        )
        return result
    except ValueError as e:
        error_code = str(e).split(":")[0]
        raise HTTPException(
            status_code=_error_status(error_code),
            detail=_error_detail(error_code),
        )


@router.post("/initiate-payment")
async def initiate_bundle_payment(
    body: BundleInitiatePaymentRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Create service_request + service_payment + link obligations.

    Atomic transaction — all-or-nothing.
    For mobile_money: returns redirect_url (BANGE).
    For cash: returns payment reference for agent validation.
    """
    user_id = UUID(current_user["id"])

    # Validate phone for mobile_money
    if body.payment_method == "mobile_money" and not body.phone_number:
        raise HTTPException(
            status_code=422,
            detail=_error_detail("PHONE_REQUIRED"),
        )

    try:
        obligation_uuids = [UUID(oid) for oid in body.selected_obligation_ids]

        async with db.transaction():
            result = await BundleWorkflowService.initiate_payment(
                conn=db,
                license_id=UUID(body.license_id),
                processing_mode=body.processing_mode,
                payment_method=body.payment_method,
                selected_obligation_ids=obligation_uuids,
                user_id=user_id,
                phone_number=body.phone_number,
            )

        return result

    except ValueError as e:
        error_code = str(e).split(":")[0]
        raise HTTPException(
            status_code=_error_status(error_code),
            detail=_error_detail(error_code),
        )


# ================================================================
# Error messages (Spanish)
# ================================================================

_error_messages = {
    "COMPANY_NOT_FOUND": {
        "es": "Empresa no encontrada",
        "fr": "Entreprise non trouvée",
        "en": "Company not found",
    },
    "COMPANY_INACTIVE": {
        "es": "La empresa está inactiva",
        "fr": "L'entreprise est inactive",
        "en": "The company is inactive",
    },
    "COMPANY_NOT_AUTONOMO": {
        "es": "Este flujo es solo para empresas autónomas del Padrón Empresarial",
        "fr": "Ce flux est réservé aux entreprises autonomes du Registre des Entreprises",
        "en": "This flow is only for autonomous companies registered in the Business Registry",
    },
    "COMPANY_NO_ZONE": {
        "es": "La empresa no tiene una zona asignada",
        "fr": "L'entreprise n'a pas de zone assignée",
        "en": "The company has no assigned zone",
    },
    "COMPANY_NO_COMMERCE_TYPE": {
        "es": "La empresa no tiene un tipo de comercio asignado. Solicite una reclasificación",
        "fr": "L'entreprise n'a pas de type de commerce assigné. Demandez une reclassification",
        "en": "The company has no commerce type assigned. Request a reclassification",
    },
    "NO_BUNDLE_FOR_COMMERCE_TYPE": {
        "es": "No hay un paquete de obligaciones configurado para este tipo de comercio",
        "fr": "Aucun forfait d'obligations configuré pour ce type de commerce",
        "en": "No obligation bundle configured for this commerce type",
    },
    "LICENSE_NOT_FOUND": {
        "es": "Licencia no encontrada",
        "fr": "Licence non trouvée",
        "en": "License not found",
    },
    "LICENSE_SUSPENDED": {
        "es": "Licencia suspendida — contacte la administración",
        "fr": "Licence suspendue — contactez l'administration",
        "en": "License suspended — contact administration",
    },
    "LICENSE_ALREADY_COMPLETE": {
        "es": "Todas las obligaciones ya están pagadas para este año fiscal",
        "fr": "Toutes les obligations sont déjà payées pour cette année fiscale",
        "en": "All obligations are already paid for this fiscal year",
    },
    "LICENSE_NOT_PAYABLE": {
        "es": "Licencia no disponible para pago",
        "fr": "Licence non disponible pour paiement",
        "en": "License not available for payment",
    },
    "NO_PAYABLE_OBLIGATIONS": {
        "es": "No hay obligaciones pendientes de pago",
        "fr": "Aucune obligation en attente de paiement",
        "en": "No pending obligations to pay",
    },
    "NO_OBLIGATIONS_SELECTED": {
        "es": "Seleccione al menos una obligación en Modo A",
        "fr": "Sélectionnez au moins une obligation en Mode A",
        "en": "Select at least one obligation in Mode A",
    },
    "OBLIGATION_NOT_PAYABLE": {
        "es": "Una o más obligaciones ya no están disponibles",
        "fr": "Une ou plusieurs obligations ne sont plus disponibles",
        "en": "One or more obligations are no longer available",
    },
    "OBLIGATION_RACE_CONDITION": {
        "es": "Una o más obligaciones ya están en proceso de pago por otro usuario",
        "fr": "Une ou plusieurs obligations sont déjà en cours de paiement par un autre utilisateur",
        "en": "One or more obligations are already being paid by another user",
    },
    "INVALID_PROCESSING_MODE": {
        "es": "Modo de pago inválido (per_line o consolidated)",
        "fr": "Mode de paiement invalide (per_line ou consolidated)",
        "en": "Invalid payment mode (per_line or consolidated)",
    },
    "INVALID_PAYMENT_METHOD": {
        "es": "Método de pago no soportado",
        "fr": "Méthode de paiement non supportée",
        "en": "Unsupported payment method",
    },
    "PAYMENT_INITIATION_FAILED": {
        "es": "Error al conectar con la pasarela de pago",
        "fr": "Erreur de connexion avec la passerelle de paiement",
        "en": "Error connecting to payment gateway",
    },
    "PHONE_REQUIRED": {
        "es": "Número de teléfono requerido para Mobile Money",
        "fr": "Numéro de téléphone requis pour Mobile Money",
        "en": "Phone number required for Mobile Money",
    },
    "EXTRACTION_MISSING_LEGAL_NAME": {
        "es": "El documento no contiene el nombre de la empresa",
        "fr": "Le document ne contient pas le nom de l'entreprise",
        "en": "The document does not contain the company name",
    },
    "PAYMENT_ALREADY_IN_PROGRESS": {
        "es": "Ya existe un pago en curso para esta licencia",
        "fr": "Un paiement est déjà en cours pour cette licence",
        "en": "A payment is already in progress for this license",
    },
    "INITIATE_AFTER_UPLOAD_FAILED": {
        "es": "La empresa fue registrada pero no se pudo iniciar el flujo de pago",
        "fr": "L'entreprise a été enregistrée mais le flux de paiement n'a pas pu être initié",
        "en": "The company was registered but the payment flow could not be initiated",
    },
}


def _error_detail(code: str) -> Dict[str, Any]:
    """Build trilingual error detail from error code."""
    msgs = _error_messages.get(code, {
        "es": "Error desconocido",
        "fr": "Erreur inconnue",
        "en": "Unknown error",
    })
    return {
        "code": code,
        "message_es": msgs["es"],
        "message_fr": msgs["fr"],
        "message_en": msgs["en"],
    }


def _error_status(code: str) -> int:
    """Map error code to HTTP status."""
    if code in ("COMPANY_NOT_FOUND", "LICENSE_NOT_FOUND"):
        return 404
    if code in ("LICENSE_SUSPENDED",):
        return 403
    if code.endswith("RACE_CONDITION") or code == "PAYMENT_ALREADY_IN_PROGRESS":
        return 409
    if code in ("LICENSE_ALREADY_COMPLETE",):
        return 409
    if code == "PAYMENT_INITIATION_FAILED":
        return 503
    return 422
