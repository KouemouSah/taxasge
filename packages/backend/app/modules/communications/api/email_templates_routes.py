"""
Email Templates API Routes - FastAPI endpoints for email template management

Endpoints:
- GET    /email-templates - List all templates
- GET    /email-templates/search - Search templates
- GET    /email-templates/{id} - Get single template
- GET    /email-templates/{id}/preview - Get HTML content
- POST   /email-templates - Create template
- PUT    /email-templates/{id} - Update template
- DELETE /email-templates/{id} - Delete template
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
import asyncpg
from loguru import logger

from app.database.connection import get_database
from app.modules.auth.dependencies import get_current_user, require_permission
from ..models.email_template import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
    EmailTemplateListResponse,
    EmailTemplatePreview,
)
from ..services.email_template_service import EmailTemplateService

router = APIRouter(prefix="/email-templates", tags=["Email Templates"])
service = EmailTemplateService()


# =============================================================================
# PUBLIC ENDPOINTS (Read-only for authenticated users)
# =============================================================================


@router.get("/", response_model=EmailTemplateListResponse)
async def list_email_templates(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    List all email templates with pagination and filters

    - **page**: Page number (starts at 1)
    - **page_size**: Number of templates per page (max 100)
    - **category**: Optional category filter
    - **is_active**: Optional active status filter
    """
    templates, total = await service.list_templates(
        db, category=category, is_active=is_active, page=page, page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size

    return EmailTemplateListResponse(
        templates=templates,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/search", response_model=EmailTemplateListResponse)
async def search_email_templates(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Search email templates by name or code

    - **q**: Search query (minimum 1 character)
    - **page**: Page number (starts at 1)
    - **page_size**: Number of templates per page (max 100)
    """
    templates, total = await service.search_templates(
        db, search_term=q, page=page, page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size

    return EmailTemplateListResponse(
        templates=templates,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{template_id}", response_model=EmailTemplateResponse)
async def get_email_template(
    template_id: int,
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Get a single email template by ID

    - **template_id**: Template ID
    """
    template = await service.get_template(db, template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with ID {template_id} not found",
        )

    return template


@router.get("/{template_id}/preview", response_model=EmailTemplatePreview)
async def get_email_template_preview(
    template_id: int,
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Get HTML content preview for an email template

    - **template_id**: Template ID
    """
    template = await service.get_template(db, template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with ID {template_id} not found",
        )

    html_content = await service.get_template_html(db, template_id)

    if not html_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HTML file for template {template_id} not found",
        )

    return EmailTemplatePreview(
        template_code=template.template_code,
        html_content=html_content,
        variables=template.variables,
    )


# =============================================================================
# ADMIN ENDPOINTS (Require permissions)
# =============================================================================


@router.post(
    "/",
    response_model=EmailTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_email_template(
    template_data: EmailTemplateCreate,
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission("communications.manage")),
):
    """
    Create a new email template

    Requires permission: communications.manage

    - **template_code**: Unique template code
    - **name_es**: Template name in Spanish (required)
    - **subject_es**: Email subject in Spanish (required)
    - **html_content**: HTML content for the template
    - **variables**: List of template variables
    - **category**: Optional category
    """
    try:
        template = await service.create_template(db, template_data, current_user["id"])
        logger.info(
            f"Email template created: {template.template_code} by user {current_user['id']}"
        )
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create email template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create email template",
        )


@router.put("/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(
    template_id: int,
    template_data: EmailTemplateUpdate,
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission("communications.manage")),
):
    """
    Update an existing email template

    Requires permission: communications.manage

    - **template_id**: Template ID to update
    - All fields are optional
    - If html_content is provided, the HTML file will be updated
    """
    try:
        template = await service.update_template(
            db, template_id, template_data, current_user["id"]
        )

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found",
            )

        logger.info(
            f"Email template updated: ID {template_id} by user {current_user['id']}"
        )
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update email template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update email template",
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_template(
    template_id: int,
    db: asyncpg.Connection = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission("communications.manage")),
):
    """
    Delete an email template

    Requires permission: communications.manage

    - **template_id**: Template ID to delete
    - This will delete both the database record and the HTML file
    """
    try:
        success = await service.delete_template(db, template_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found",
            )

        logger.info(
            f"Email template deleted: ID {template_id} by user {current_user['id']}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete email template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete email template",
        )
