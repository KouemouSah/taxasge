"""
Routes Admin - Gestion des Services Fiscaux
CRUD complet pour les 547 services fiscaux
"""

from fastapi import APIRouter, Request, Depends, HTTPException, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from typing import Optional, List
from pathlib import Path

# Services métier
from ...app.services.fiscal_service import FiscalServiceService
from ...app.models.fiscal_service import FiscalServiceCreate, FiscalServiceUpdate

# Templates
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

admin_fiscal_router = APIRouter()

# === PAGES PRINCIPALES ===

@admin_fiscal_router.get("/", response_class=HTMLResponse)
async def fiscal_services_list(
    request: Request,
    page: int = Query(1, ge=1),
    search: Optional[str] = Query(None),
    ministry: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """Liste paginée des services fiscaux avec filtres"""

    # Récupération des services avec pagination
    fiscal_service = FiscalServiceService()

    filters = {
        "search": search,
        "ministry_id": ministry,
        "sector_id": sector,
        "category_id": category
    }

    services, total_count = await fiscal_service.get_paginated_services(
        page=page,
        per_page=25,
        filters=filters
    )

    # Calcul pagination
    total_pages = (total_count + 24) // 25

    # Données pour les filtres
    ministries = await fiscal_service.get_all_ministries()
    sectors = await fiscal_service.get_all_sectors()
    categories = await fiscal_service.get_all_categories()

    context = {
        "request": request,
        "page_title": "Services Fiscaux",
        "services": services,
        "current_page": page,
        "total_pages": total_pages,
        "total_count": total_count,
        "search": search or "",
        "ministries": ministries,
        "sectors": sectors,
        "categories": categories,
        "active_filters": {
            "ministry": ministry,
            "sector": sector,
            "category": category
        }
    }

    return templates.TemplateResponse("fiscal_services/list.html", context)

@admin_fiscal_router.get("/create", response_class=HTMLResponse)
async def fiscal_service_create_form(request: Request):
    """Formulaire de création d'un nouveau service fiscal"""

    fiscal_service = FiscalServiceService()

    # Données pour les select
    ministries = await fiscal_service.get_all_ministries()
    sectors = await fiscal_service.get_all_sectors()
    categories = await fiscal_service.get_all_categories()

    context = {
        "request": request,
        "page_title": "Nouveau Service Fiscal",
        "ministries": ministries,
        "sectors": sectors,
        "categories": categories,
        "service_types": ["Certificate", "License", "Permit", "Registration", "Declaration", "Other"],
        "calculation_methods": ["Fixed", "Formula-based", "Both"]
    }

    return templates.TemplateResponse("fiscal_services/create.html", context)

@admin_fiscal_router.post("/create")
async def fiscal_service_create(
    request: Request,
    name_es: str = Form(...),
    name_fr: str = Form(...),
    name_en: str = Form(...),
    description_es: str = Form(...),
    description_fr: str = Form(...),
    description_en: str = Form(...),
    ministry_id: str = Form(...),
    sector_id: str = Form(...),
    category_id: str = Form(...),
    service_type: str = Form(...),
    base_cost: float = Form(...),
    calculation_method: str = Form(...),
    processing_time_days: int = Form(...),
    is_online_available: bool = Form(False),
    is_active: bool = Form(True)
):
    """Traitement création d'un service fiscal"""

    try:
        fiscal_service = FiscalServiceService()

        service_data = FiscalServiceCreate(
            name_es=name_es,
            name_fr=name_fr,
            name_en=name_en,
            description_es=description_es,
            description_fr=description_fr,
            description_en=description_en,
            ministry_id=ministry_id,
            sector_id=sector_id,
            category_id=category_id,
            service_type=service_type,
            base_cost=base_cost,
            calculation_method=calculation_method,
            processing_time_days=processing_time_days,
            is_online_available=is_online_available,
            is_active=is_active
        )

        new_service = await fiscal_service.create_service(service_data)

        return RedirectResponse(
            url=f"/admin/fiscal-services/{new_service.id}",
            status_code=302
        )

    except Exception as e:
        # Recharger le formulaire avec erreur
        ministries = await fiscal_service.get_all_ministries()
        sectors = await fiscal_service.get_all_sectors()
        categories = await fiscal_service.get_all_categories()

        context = {
            "request": request,
            "page_title": "Nouveau Service Fiscal",
            "ministries": ministries,
            "sectors": sectors,
            "categories": categories,
            "service_types": ["Certificate", "License", "Permit", "Registration", "Declaration", "Other"],
            "calculation_methods": ["Fixed", "Formula-based", "Both"],
            "error": f"Erreur lors de la création: {str(e)}",
            "form_data": {
                "name_es": name_es,
                "name_fr": name_fr,
                "name_en": name_en,
                "description_es": description_es,
                "description_fr": description_fr,
                "description_en": description_en,
                "ministry_id": ministry_id,
                "sector_id": sector_id,
                "category_id": category_id,
                "service_type": service_type,
                "base_cost": base_cost,
                "calculation_method": calculation_method,
                "processing_time_days": processing_time_days,
                "is_online_available": is_online_available,
                "is_active": is_active
            }
        }

        return templates.TemplateResponse("fiscal_services/create.html", context)

@admin_fiscal_router.get("/{service_id}", response_class=HTMLResponse)
async def fiscal_service_detail(request: Request, service_id: str):
    """Détail d'un service fiscal"""

    fiscal_service = FiscalServiceService()

    try:
        service = await fiscal_service.get_service_by_id(service_id)

        if not service:
            raise HTTPException(status_code=404, detail="Service non trouvé")

        # Récupération des documents requis et procédures
        required_documents = await fiscal_service.get_service_documents(service_id)
        procedures = await fiscal_service.get_service_procedures(service_id)
        keywords = await fiscal_service.get_service_keywords(service_id)

        context = {
            "request": request,
            "page_title": f"Service: {service.name_es}",
            "service": service,
            "required_documents": required_documents,
            "procedures": procedures,
            "keywords": keywords
        }

        return templates.TemplateResponse("fiscal_services/detail.html", context)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_fiscal_router.get("/{service_id}/edit", response_class=HTMLResponse)
async def fiscal_service_edit_form(request: Request, service_id: str):
    """Formulaire d'édition d'un service fiscal"""

    fiscal_service = FiscalServiceService()

    try:
        service = await fiscal_service.get_service_by_id(service_id)

        if not service:
            raise HTTPException(status_code=404, detail="Service non trouvé")

        # Données pour les select
        ministries = await fiscal_service.get_all_ministries()
        sectors = await fiscal_service.get_all_sectors()
        categories = await fiscal_service.get_all_categories()

        context = {
            "request": request,
            "page_title": f"Éditer: {service.name_es}",
            "service": service,
            "ministries": ministries,
            "sectors": sectors,
            "categories": categories,
            "service_types": ["Certificate", "License", "Permit", "Registration", "Declaration", "Other"],
            "calculation_methods": ["Fixed", "Formula-based", "Both"]
        }

        return templates.TemplateResponse("fiscal_services/edit.html", context)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_fiscal_router.post("/{service_id}/edit")
async def fiscal_service_update(
    request: Request,
    service_id: str,
    name_es: str = Form(...),
    name_fr: str = Form(...),
    name_en: str = Form(...),
    description_es: str = Form(...),
    description_fr: str = Form(...),
    description_en: str = Form(...),
    ministry_id: str = Form(...),
    sector_id: str = Form(...),
    category_id: str = Form(...),
    service_type: str = Form(...),
    base_cost: float = Form(...),
    calculation_method: str = Form(...),
    processing_time_days: int = Form(...),
    is_online_available: bool = Form(False),
    is_active: bool = Form(True)
):
    """Traitement mise à jour d'un service fiscal"""

    fiscal_service = FiscalServiceService()

    try:
        update_data = FiscalServiceUpdate(
            name_es=name_es,
            name_fr=name_fr,
            name_en=name_en,
            description_es=description_es,
            description_fr=description_fr,
            description_en=description_en,
            ministry_id=ministry_id,
            sector_id=sector_id,
            category_id=category_id,
            service_type=service_type,
            base_cost=base_cost,
            calculation_method=calculation_method,
            processing_time_days=processing_time_days,
            is_online_available=is_online_available,
            is_active=is_active
        )

        updated_service = await fiscal_service.update_service(service_id, update_data)

        return RedirectResponse(
            url=f"/admin/fiscal-services/{service_id}",
            status_code=302
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_fiscal_router.post("/{service_id}/delete")
async def fiscal_service_delete(service_id: str):
    """Suppression d'un service fiscal"""

    fiscal_service = FiscalServiceService()

    try:
        await fiscal_service.delete_service(service_id)

        return RedirectResponse(
            url="/admin/fiscal-services/",
            status_code=302
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === API ENDPOINTS POUR AJAX ===

@admin_fiscal_router.get("/api/sectors/{ministry_id}")
async def get_sectors_by_ministry(ministry_id: str):
    """API: Récupérer les secteurs d'un ministère"""

    fiscal_service = FiscalServiceService()
    sectors = await fiscal_service.get_sectors_by_ministry(ministry_id)

    return {"sectors": sectors}

@admin_fiscal_router.get("/api/categories/{sector_id}")
async def get_categories_by_sector(sector_id: str):
    """API: Récupérer les catégories d'un secteur"""

    fiscal_service = FiscalServiceService()
    categories = await fiscal_service.get_categories_by_sector(sector_id)

    return {"categories": categories}