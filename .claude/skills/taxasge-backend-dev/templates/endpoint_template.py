"""
Template Route FastAPI - Architecture 3-tiers
==============================================

Usage:
1. Copier ce fichier vers app/api/v1/{module}.py
2. Remplacer {MODULE} par nom module (ex: declarations)
3. Remplacer {Module} par nom classe (ex: Declaration)
4. Adapter schémas Pydantic selon besoins
5. Configurer RBAC roles appropriés

Source: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.services.{module}_service import {Module}Service
from app.core.auth import require_role, get_current_user
from app.schemas.{module} import (
    {Module}Create,
    {Module}Update,
    {Module}Response,
    {Module}ListResponse
)
from app.models.user import User

# Router configuration
router = APIRouter(
    prefix="/{module}s",
    tags=["{Module}s"]
)


@router.post(
    "/",
    response_model={Module}Response,
    status_code=status.HTTP_201_CREATED,
    summary="Créer {module}",
    description="Crée un nouveau {module} avec validation complète",
    responses={
        201: {"description": "{Module} créé avec succès"},
        400: {"description": "Erreur validation"},
        401: {"description": "Non authentifié"},
        403: {"description": "Non autorisé"},
    }
)
@require_role("citizen")
async def create_{module}(
    data: {Module}Create,
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Créer {module}.
    
    **Source**: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    
    **Validation automatique**:
    - Pydantic {Module}Create (champs requis, formats, longueurs)
    - RBAC: Rôle "citizen" minimum requis
    
    **Business Rules**:
    - [Règle métier 1]
    - [Règle métier 2]
    
    **Errors**:
    - 400: Validation error (champs invalides)
    - 401: Token JWT manquant ou invalide
    - 403: Utilisateur non autorisé (mauvais rôle)
    
    **Example**:
    ```json
    {
        "field1": "value1",
        "field2": "value2"
    }
    ```
    """
    return await service.create(data, user_id=current_user.id)


@router.get(
    "/",
    response_model={Module}ListResponse,
    summary="Lister {module}s",
    description="Récupère liste {module}s avec pagination et filtres",
    responses={
        200: {"description": "Liste récupérée avec succès"},
        401: {"description": "Non authentifié"},
    }
)
@require_role("citizen")
async def list_{module}s(
    skip: int = Query(0, ge=0, description="Nombre éléments à sauter"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre éléments max"),
    status: Optional[str] = Query(None, description="Filtrer par status"),
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Lister {module}s avec pagination.
    
    **Source**: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    
    **Pagination**:
    - skip: Offset (défaut: 0)
    - limit: Limite (défaut: 100, max: 1000)
    
    **Filtres**:
    - status: Filtrer par status (optionnel)
    
    **RBAC**:
    - citizen: Voit seulement ses propres {module}s
    - agent: Voit {module}s assignés
    - admin: Voit tous {module}s
    """
    filters = {}
    if status:
        filters["status"] = status
    
    # RBAC: Filtrer par user_id si pas admin
    if current_user.role not in ["admin", "agent"]:
        filters["user_id"] = current_user.id
    
    items = await service.list(
        filters=filters,
        skip=skip,
        limit=limit
    )
    
    total = await service.count(filters=filters)
    
    return {Module}ListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{id}",
    response_model={Module}Response,
    summary="Récupérer {module}",
    description="Récupère {module} par ID",
    responses={
        200: {"description": "{Module} trouvé"},
        401: {"description": "Non authentifié"},
        403: {"description": "Non autorisé (pas propriétaire)"},
        404: {"description": "{Module} non trouvé"},
    }
)
@require_role("citizen")
async def get_{module}(
    id: int,
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Récupérer {module} par ID.
    
    **Source**: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    
    **RBAC**:
    - citizen: Peut voir seulement son propre {module}
    - agent/admin: Peuvent voir tous {module}s
    
    **Errors**:
    - 403: Utilisateur pas propriétaire et pas agent/admin
    - 404: {Module} avec cet ID n'existe pas
    """
    {module} = await service.get_by_id(id)
    
    # RBAC: Vérifier ownership si pas admin/agent
    if current_user.role not in ["admin", "agent"]:
        if {module}.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this {module}"
            )
    
    return {module}


@router.put(
    "/{id}",
    response_model={Module}Response,
    summary="Mettre à jour {module}",
    description="Met à jour {module} existant",
    responses={
        200: {"description": "{Module} mis à jour"},
        400: {"description": "Erreur validation"},
        401: {"description": "Non authentifié"},
        403: {"description": "Non autorisé"},
        404: {"description": "{Module} non trouvé"},
    }
)
@require_role("citizen")
async def update_{module}(
    id: int,
    data: {Module}Update,
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Mettre à jour {module}.
    
    **Source**: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    
    **Validation**:
    - Seuls champs fournis sont mis à jour (partial update)
    - Pydantic {Module}Update valide formats
    
    **RBAC**:
    - citizen: Peut modifier seulement son propre {module}
    - agent: Peut modifier {module}s assignés
    - admin: Peut modifier tous {module}s
    
    **Business Rules**:
    - Certains champs non modifiables après soumission
    - [Autres règles métier]
    """
    # Vérifier existence + ownership
    existing = await service.get_by_id(id)
    
    if current_user.role not in ["admin", "agent"]:
        if existing.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this {module}"
            )
    
    return await service.update(id, data, user_id=current_user.id)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer {module}",
    description="Supprime {module} (soft delete)",
    responses={
        204: {"description": "{Module} supprimé"},
        401: {"description": "Non authentifié"},
        403: {"description": "Non autorisé"},
        404: {"description": "{Module} non trouvé"},
    }
)
@require_role("admin", "agent")
async def delete_{module}(
    id: int,
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Supprimer {module} (soft delete).
    
    **Source**: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    
    **RBAC**:
    - admin/agent UNIQUEMENT
    - citizen NE PEUT PAS supprimer
    
    **Soft Delete**:
    - {Module} marqué deleted_at = now()
    - Pas de suppression physique DB
    - Peut être restauré par admin
    
    **Business Rules**:
    - Suppression uniquement si status != "approved"
    - [Autres règles métier]
    """
    await service.delete(id, user_id=current_user.id)
    return None


# ========================================
# ENDPOINTS ADDITIONNELS (Si nécessaire)
# ========================================

@router.post(
    "/{id}/submit",
    response_model={Module}Response,
    summary="Soumettre {module}",
    description="Soumet {module} pour validation",
)
@require_role("citizen")
async def submit_{module}(
    id: int,
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Soumettre {module} pour validation.
    
    **Workflow**:
    draft → submitted → approved/rejected
    
    **Business Rules**:
    - Tous champs requis doivent être remplis
    - Status doit être "draft"
    - Génère notification agent
    """
    return await service.submit(id, user_id=current_user.id)


@router.post(
    "/{id}/approve",
    response_model={Module}Response,
    summary="Approuver {module}",
    description="Approuve {module} (agent/admin uniquement)",
)
@require_role("admin", "agent")
async def approve_{module}(
    id: int,
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Approuver {module}.
    
    **RBAC**: agent/admin uniquement
    
    **Workflow**:
    submitted → approved
    
    **Actions**:
    - Status = "approved"
    - Notification utilisateur
    - [Autres actions métier]
    """
    return await service.approve(id, approver_id=current_user.id)


@router.post(
    "/{id}/reject",
    response_model={Module}Response,
    summary="Rejeter {module}",
    description="Rejette {module} avec raison",
)
@require_role("admin", "agent")
async def reject_{module}(
    id: int,
    reason: str = Query(..., min_length=10, description="Raison du rejet"),
    current_user: User = Depends(get_current_user),
    service: {Module}Service = Depends()
):
    """
    Rejeter {module}.
    
    **RBAC**: agent/admin uniquement
    
    **Workflow**:
    submitted → rejected
    
    **Actions**:
    - Status = "rejected"
    - Enregistre raison
    - Notification utilisateur
    """
    return await service.reject(
        id,
        reason=reason,
        rejector_id=current_user.id
    )
