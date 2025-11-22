"""
Translation API Routes - CRUD operations for system translations

Endpoints:
- GET /translations/categories - List all categories
- GET /translations/stats - Get translation statistics
- GET /translations/export/{category} - Export category as JSON
- GET /translations - Search/list translations
- GET /translations/{translation_id} - Get translation by ID
- POST /translations - Create translation
- POST /translations/batch - Create multiple translations
- PUT /translations/{translation_id} - Update translation
- DELETE /translations/{translation_id} - Delete translation

Module: Translations (System translations for ENUMs, UI, Forms, Messages)

Note: entity_translations (for fiscal services) is in fiscal_services module
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from loguru import logger

from app.modules.translations.models.translation import (
    TranslationCreate,
    TranslationUpdate,
    TranslationResponse,
    TranslationBatchCreate,
    TranslationSearchParams,
    TranslationListResponse,
)
from app.modules.translations.services.translation_service import TranslationService
from app.modules.translations.services.language_service import LanguageService
from app.modules.translations.middleware.language_middleware import detect_language


router = APIRouter(prefix="/translations", tags=["Translations"])


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/categories")
async def list_categories():
    """
    Get list of all translation categories

    Returns:
        List of unique category strings
    """
    service = TranslationService()

    try:
        # TODO: Get connection from dependency
        # categories = await service.get_all_categories(conn)
        # return {"categories": categories}

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_translation_stats():
    """
    Get translation statistics

    Returns:
        Statistics about translations (counts, sources, etc.)
    """
    service = TranslationService()

    try:
        # TODO: Get connection from dependency
        # stats = await service.get_translation_stats(conn)
        # return stats

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/{category}")
async def export_category_json(category: str):
    """
    Export all translations for a category as JSON

    Useful for frontend i18n files

    Args:
        category: Category to export (enum, ui.menu, etc.)

    Returns:
        JSON structure: {key_code: {es: "...", fr: "...", en: "..."}}
    """
    service = TranslationService()

    try:
        # TODO: Get connection from dependency
        # data = await service.export_category_json(conn, category)
        # return data

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except Exception as e:
        logger.error(f"Error exporting category {category}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CRUD ENDPOINTS
# ============================================================================

@router.post("/", response_model=TranslationResponse)
async def create_translation(
    translation: TranslationCreate,
    # conn: asyncpg.Connection = Depends(get_db_connection),  # TODO: Add dependency
    # current_user: User = Depends(get_current_user),  # TODO: Add dependency
):
    """
    Create a single translation

    Args:
        translation: Translation data (category, key_code, es, fr, en)

    Returns:
        Created translation
    """
    service = TranslationService()

    try:
        # TODO: Get connection and user from dependency
        # result = await service.create_translation(conn, translation, current_user.id)
        # return result

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except Exception as e:
        logger.error(f"Error creating translation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def create_translation_batch(
    batch: TranslationBatchCreate,
    # conn: asyncpg.Connection = Depends(get_db_connection),  # TODO: Add dependency
    # current_user: User = Depends(get_current_user),  # TODO: Add dependency
):
    """
    Create multiple translations at once

    Args:
        batch: Batch of translations

    Returns:
        List of created translations with count
    """
    service = TranslationService()

    try:
        # TODO: Get connection and user from dependency
        # results = await service.batch_create(conn, batch, current_user.id)
        # return {"created": len(results), "translations": results}

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating translation batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=TranslationListResponse)
async def search_translations(
    category: Optional[str] = Query(None, description="Filter by category"),
    key_code: Optional[str] = Query(None, description="Search in key_code"),
    context: Optional[str] = Query(None, description="Filter by context"),
    search_term: Optional[str] = Query(None, description="Full-text search"),
    limit: int = Query(100, ge=1, le=500, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    # conn: asyncpg.Connection = Depends(get_db_connection),  # TODO: Add dependency
):
    """
    Search and list translations

    Args:
        category: Optional category filter
        key_code: Optional key_code search (partial match)
        context: Optional context filter
        search_term: Optional full-text search in translations
        limit: Max results
        offset: Pagination offset

    Returns:
        Paginated list of translations
    """
    service = TranslationService()

    try:
        search_params = TranslationSearchParams(
            category=category,
            key_code=key_code,
            context=context,
            search_term=search_term,
            limit=limit,
            offset=offset,
        )

        # TODO: Get connection from dependency
        # translations, total = await service.search_translations(conn, search_params)
        # return {
        #     "translations": translations,
        #     "total": total,
        #     "limit": limit,
        #     "offset": offset,
        # }

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except Exception as e:
        logger.error(f"Error searching translations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{translation_id}", response_model=TranslationResponse)
async def get_translation(
    translation_id: int,
    # conn: asyncpg.Connection = Depends(get_db_connection),  # TODO: Add dependency
):
    """
    Get translation by ID

    Args:
        translation_id: Translation ID

    Returns:
        Translation details
    """
    service = TranslationService()

    try:
        # TODO: Get connection from dependency
        # translation = await service.get_translation_by_id(conn, translation_id)

        # if translation is None:
        #     raise HTTPException(status_code=404, detail="Translation not found")

        # return translation

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching translation {translation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{translation_id}", response_model=TranslationResponse)
async def update_translation(
    translation_id: int,
    update_data: TranslationUpdate,
    # conn: asyncpg.Connection = Depends(get_db_connection),  # TODO: Add dependency
    # current_user: User = Depends(get_current_user),  # TODO: Add dependency
):
    """
    Update translation

    Args:
        translation_id: Translation ID
        update_data: Update data (es, fr, en, description, source)

    Returns:
        Updated translation
    """
    service = TranslationService()

    try:
        # TODO: Get connection and user from dependency
        # result = await service.update_translation(
        #     conn, translation_id, update_data, current_user.id
        # )

        # if result is None:
        #     raise HTTPException(status_code=404, detail="Translation not found")

        # return result

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating translation {translation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{translation_id}")
async def delete_translation(
    translation_id: int,
    # conn: asyncpg.Connection = Depends(get_db_connection),  # TODO: Add dependency
):
    """
    Delete a translation

    Args:
        translation_id: Translation ID

    Returns:
        Success message
    """
    service = TranslationService()

    try:
        # TODO: Get connection from dependency
        # deleted = await service.delete_translation(conn, translation_id)

        # if not deleted:
        #     raise HTTPException(status_code=404, detail="Translation not found")

        # return {"message": "Translation deleted successfully"}

        raise HTTPException(
            status_code=501,
            detail="Database connection dependency not yet implemented"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting translation {translation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LANGUAGE DETECTION (reuse from previous implementation)
# ============================================================================

@router.get("/languages")
async def list_supported_languages():
    """
    Get list of supported languages

    Returns:
        List of language information
    """
    language_service = LanguageService()
    return {
        "languages": language_service.get_language_info(),
        "default": language_service.get_default_language().value,
    }
