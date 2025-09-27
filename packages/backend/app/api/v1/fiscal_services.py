"""
🏛️ TaxasGE Fiscal Services API
Handles the 547 fiscal services catalog with advanced search, calculation, and management
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime, date
from enum import Enum
import json
import os
from loguru import logger

# Create router
router = APIRouter()

# Load fiscal services data
def load_fiscal_services():
    """Load fiscal services from JSON data file"""
    data_path = os.path.join(os.path.dirname(__file__), "../../../../../data/taxes.json")
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except FileNotFoundError:
        logger.warning(f"Fiscal services data file not found: {data_path}")
        return []
    except Exception as e:
        logger.error(f"Error loading fiscal services data: {e}")
        return []

# Global data cache
FISCAL_SERVICES_DATA = load_fiscal_services()

# Enums
class ServiceType(str, Enum):
    administrative = "administrative"
    fiscal = "fiscal"
    legal = "legal"
    customs = "customs"
    mining = "mining"
    commercial = "commercial"
    social = "social"
    transport = "transport"
    agriculture = "agriculture"
    health = "health"
    education = "education"
    other = "other"

class PaymentType(str, Enum):
    expedition = "expedition"
    renewal = "renewal"

class SortOption(str, Enum):
    name_asc = "name_asc"
    name_desc = "name_desc"
    price_asc = "price_asc"
    price_desc = "price_desc"
    relevance = "relevance"
    recent = "recent"

# Request/Response Models
class FiscalServiceQuery(BaseModel):
    """Query parameters for fiscal services search"""
    q: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Category filter")
    subcategory: Optional[str] = Field(None, description="Subcategory filter")
    service_type: Optional[ServiceType] = Field(None, description="Service type filter")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    language: Optional[str] = Field("es", pattern="^(es|fr|en)$", description="Language code")
    sort: Optional[SortOption] = Field(SortOption.relevance, description="Sort option")
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")

class CalculationRequest(BaseModel):
    """Request model for tax calculation"""
    service_id: str = Field(..., description="Fiscal service ID (e.g., T-001)")
    payment_type: PaymentType = Field(..., description="Payment type: expedition or renewal")
    calculation_base: Optional[float] = Field(None, ge=0, description="Base value for percentage calculations")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional calculation parameters")
    user_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User context for personalization")

# Utility functions
def get_service_by_id(service_id: str) -> Optional[Dict[str, Any]]:
    """Get fiscal service by ID"""
    for service in FISCAL_SERVICES_DATA:
        if service.get("id") == service_id:
            return service
    return None

def search_services(query: FiscalServiceQuery) -> List[Dict[str, Any]]:
    """Search fiscal services with filters"""
    results = FISCAL_SERVICES_DATA.copy()

    # Text search
    if query.q:
        search_terms = query.q.lower().split()
        filtered_results = []
        for service in results:
            # Search in name and description
            searchable_text = " ".join([
                service.get("nombre_es", "").lower(),
                service.get("descripcion_es", "").lower(),
                service.get("categoria", "").lower(),
                service.get("subcategoria", "").lower(),
                service.get("id", "").lower()
            ])

            if any(term in searchable_text for term in search_terms):
                # Calculate relevance score
                score = sum(1 for term in search_terms if term in searchable_text)
                service["_relevance_score"] = score
                filtered_results.append(service)

        results = filtered_results

    # Category filter
    if query.category:
        results = [s for s in results if s.get("categoria", "").lower() == query.category.lower()]

    # Subcategory filter
    if query.subcategory:
        results = [s for s in results if s.get("subcategoria", "").lower() == query.subcategory.lower()]

    # Price filters
    if query.min_price is not None:
        results = [s for s in results if s.get("tasa_expedicion", 0) >= query.min_price]

    if query.max_price is not None:
        results = [s for s in results if s.get("tasa_expedicion", 0) <= query.max_price]

    # Sort results
    if query.sort == SortOption.name_asc:
        results.sort(key=lambda x: x.get("nombre_es", "").lower())
    elif query.sort == SortOption.name_desc:
        results.sort(key=lambda x: x.get("nombre_es", "").lower(), reverse=True)
    elif query.sort == SortOption.price_asc:
        results.sort(key=lambda x: x.get("tasa_expedicion", 0))
    elif query.sort == SortOption.price_desc:
        results.sort(key=lambda x: x.get("tasa_expedicion", 0), reverse=True)
    elif query.sort == SortOption.relevance and query.q:
        results.sort(key=lambda x: x.get("_relevance_score", 0), reverse=True)

    return results

def calculate_service_amount(service: Dict[str, Any], request: CalculationRequest) -> Dict[str, Any]:
    """Calculate service amount based on service configuration"""

    if request.payment_type == PaymentType.expedition:
        base_amount = service.get("tasa_expedicion", 0)
    else:
        base_amount = service.get("tasa_renovacion", service.get("tasa_expedicion", 0))

    calculation_details = {
        "method": "fixed_amount",
        "base_rate": base_amount,
        "multipliers": [],
        "deductions": [],
        "penalties": []
    }

    # Handle percentage-based calculations
    if request.calculation_base and service.get("calculation_method") == "percentage_based":
        rate = service.get("percentage_rate", 0.02)  # 2% default
        calculated_amount = request.calculation_base * rate
        calculation_details["method"] = "percentage_based"
        calculation_details["percentage_rate"] = rate
        calculation_details["calculation_base"] = request.calculation_base
    else:
        calculated_amount = base_amount

    # Apply any parameter-based adjustments
    if request.parameters:
        zone_multiplier = request.parameters.get("zone_multiplier", 1.0)
        urgency_multiplier = request.parameters.get("urgency_multiplier", 1.0)
        calculated_amount *= zone_multiplier * urgency_multiplier

        if zone_multiplier != 1.0:
            calculation_details["multipliers"].append({"type": "zone", "factor": zone_multiplier})
        if urgency_multiplier != 1.0:
            calculation_details["multipliers"].append({"type": "urgency", "factor": urgency_multiplier})

    return {
        "calculated_amount": round(calculated_amount, 2),
        "calculation_details": calculation_details,
        "breakdown": [
            {"item": "Base amount", "amount": base_amount},
            {"item": "Final amount", "amount": round(calculated_amount, 2)}
        ]
    }

# API Endpoints

@router.get("/")
async def get_fiscal_services_info():
    """Get fiscal services API information"""
    return {
        "message": "TaxasGE Fiscal Services API",
        "version": "1.0.0",
        "total_services": len(FISCAL_SERVICES_DATA),
        "available_endpoints": {
            "search": "POST /search - Advanced search with filters",
            "list": "GET /list - Paginated list of all services",
            "detail": "GET /{service_id} - Get service details",
            "calculate": "POST /{service_id}/calculate - Calculate service amount",
            "hierarchy": "GET /hierarchy - Get hierarchical structure"
        },
        "supported_languages": ["es", "fr", "en"],
        "features": {
            "advanced_search": "Full-text search with relevance scoring",
            "real_time_calculation": "Dynamic amount calculation",
            "multi_language": "Spanish, French, English support",
            "hierarchical_navigation": "Category-based browsing"
        }
    }

@router.post("/search")
async def search_fiscal_services(query: FiscalServiceQuery):
    """Advanced search for fiscal services with full-text search, filters, and relevance scoring"""

    start_time = datetime.now()

    # Perform search
    search_results = search_services(query)

    # Pagination
    total_results = len(search_results)
    start_idx = (query.page - 1) * query.limit
    end_idx = start_idx + query.limit
    page_results = search_results[start_idx:end_idx]

    # Format results
    formatted_results = []
    for service in page_results:
        formatted_results.append({
            "id": service.get("id"),
            "name": {
                "es": service.get("nombre_es", ""),
                "fr": service.get("nombre_fr", service.get("nombre_es", "")),
                "en": service.get("nombre_en", service.get("nombre_es", ""))
            },
            "description": {
                "es": service.get("descripcion_es", ""),
                "fr": service.get("descripcion_fr", service.get("descripcion_es", "")),
                "en": service.get("descripcion_en", service.get("descripcion_es", ""))
            },
            "category": service.get("categoria"),
            "subcategory": service.get("subcategoria"),
            "service_type": service.get("tipo_servicio", "administrative"),
            "prices": {
                "expedition": service.get("tasa_expedicion", 0),
                "renewal": service.get("tasa_renovacion", service.get("tasa_expedicion", 0))
            },
            "processing_time": service.get("tiempo_procesamiento", "No especificado"),
            "relevance_score": service.get("_relevance_score", 0)
        })

    # Generate search suggestions
    suggestions = []
    if query.q and total_results == 0:
        common_terms = ["permiso", "licencia", "registro", "certificado", "declaracion"]
        suggestions = [term for term in common_terms if term not in query.q.lower()]

    execution_time = (datetime.now() - start_time).total_seconds() * 1000

    return {
        "success": True,
        "query": query.q or "",
        "total_results": total_results,
        "page": query.page,
        "limit": query.limit,
        "total_pages": (total_results + query.limit - 1) // query.limit,
        "results": formatted_results,
        "filters_applied": {
            "category": query.category,
            "subcategory": query.subcategory,
            "service_type": query.service_type,
            "price_range": {"min": query.min_price, "max": query.max_price},
            "language": query.language,
            "sort": query.sort
        },
        "suggestions": suggestions[:3],
        "execution_time_ms": round(execution_time, 2)
    }

@router.get("/hierarchy")
async def get_fiscal_services_hierarchy(
    language: str = Query("es", pattern="^(es|fr|en)$", description="Language code")
):
    """Get hierarchical structure of fiscal services (categories > subcategories > services)"""

    start_time = datetime.now()

    # Build hierarchy
    hierarchy = {}

    for service in FISCAL_SERVICES_DATA:
        category = service.get("categoria", "Other")
        subcategory = service.get("subcategoria", "General")

        if category not in hierarchy:
            hierarchy[category] = {
                "name": category,
                "service_count": 0,
                "subcategories": {}
            }

        if subcategory not in hierarchy[category]["subcategories"]:
            hierarchy[category]["subcategories"][subcategory] = {
                "name": subcategory,
                "service_count": 0,
                "services": []
            }

        # Add service summary
        service_summary = {
            "id": service.get("id"),
            "name": service.get(f"nombre_{language}", service.get("nombre_es", "")),
            "expedition_price": service.get("tasa_expedicion", 0)
        }

        hierarchy[category]["subcategories"][subcategory]["services"].append(service_summary)
        hierarchy[category]["subcategories"][subcategory]["service_count"] += 1
        hierarchy[category]["service_count"] += 1

    # Convert to list format for easier consumption
    formatted_hierarchy = []
    for category_name, category_data in hierarchy.items():
        subcategories = []
        for subcat_name, subcat_data in category_data["subcategories"].items():
            subcategories.append({
                "name": subcat_name,
                "service_count": subcat_data["service_count"],
                "services": subcat_data["services"]
            })

        formatted_hierarchy.append({
            "category": category_name,
            "service_count": category_data["service_count"],
            "subcategories": subcategories
        })

    execution_time = (datetime.now() - start_time).total_seconds() * 1000

    return {
        "success": True,
        "language": language,
        "total_categories": len(formatted_hierarchy),
        "total_services": len(FISCAL_SERVICES_DATA),
        "hierarchy": formatted_hierarchy,
        "execution_time_ms": round(execution_time, 2),
        "cache_ttl": 3600  # 1 hour cache recommendation
    }

@router.get("/{service_id}")
async def get_fiscal_service_detail(
    service_id: str = Path(..., description="Fiscal service ID (e.g., T-001)"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Language code")
):
    """Get detailed information about a specific fiscal service"""

    service = get_service_by_id(service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal service '{service_id}' not found"
        )

    # Format detailed response
    detail = {
        "id": service.get("id"),
        "name": {
            "es": service.get("nombre_es", ""),
            "fr": service.get("nombre_fr", service.get("nombre_es", "")),
            "en": service.get("nombre_en", service.get("nombre_es", ""))
        },
        "description": {
            "es": service.get("descripcion_es", ""),
            "fr": service.get("descripcion_fr", service.get("descripcion_es", "")),
            "en": service.get("descripcion_en", service.get("descripcion_es", ""))
        },
        "category": service.get("categoria"),
        "subcategory": service.get("subcategoria"),
        "service_type": service.get("tipo_servicio", "administrative"),
        "prices": {
            "expedition": service.get("tasa_expedicion", 0),
            "renewal": service.get("tasa_renovacion", service.get("tasa_expedicion", 0)),
            "currency": "GNF"
        },
        "processing_time": service.get("tiempo_procesamiento", "No especificado"),
        "validity_period": service.get("periodo_validez"),
        "required_documents": service.get("documentos_requeridos", []),
        "legal_basis": service.get("base_legal"),
        "contact_info": {
            "ministry": service.get("ministerio"),
            "department": service.get("departamento"),
            "phone": service.get("telefono"),
            "email": service.get("email")
        },
        "metadata": {
            "keywords": service.get("palabras_clave", []),
            "related_services": service.get("servicios_relacionados", [])
        },
        "can_calculate": True,
        "supports_online_payment": service.get("pago_online", False)
    }

    return {
        "success": True,
        "service": detail,
        "language": language
    }

@router.post("/{service_id}/calculate")
async def calculate_service_cost(
    service_id: str = Path(..., description="Fiscal service ID (e.g., T-001)"),
    request: CalculationRequest = None
):
    """Calculate the cost for a specific fiscal service with real-time pricing"""

    if not request:
        request = CalculationRequest(service_id=service_id, payment_type=PaymentType.expedition)

    service = get_service_by_id(service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal service '{service_id}' not found"
        )

    # Perform calculation
    calculation_result = calculate_service_amount(service, request)

    # Generate next steps
    next_steps = [
        "Prepare required documents",
        "Visit the designated office or use online portal",
        "Make payment using approved methods",
        "Receive service confirmation"
    ]

    if request.payment_type == PaymentType.renewal:
        next_steps.insert(0, "Verify current service validity")

    # Payment options
    payment_options = [
        {
            "method": "mobile_money",
            "provider": "BANGE",
            "supported": True,
            "fee_percentage": 1.5
        },
        {
            "method": "bank_transfer",
            "provider": "Banking network",
            "supported": True,
            "fee_percentage": 0.5
        },
        {
            "method": "cash",
            "provider": "Government offices",
            "supported": True,
            "fee_percentage": 0.0
        }
    ]

    return {
        "success": True,
        "service_id": service_id,
        "payment_type": request.payment_type,
        "calculated_amount": calculation_result["calculated_amount"],
        "base_amount": calculation_result["calculation_details"]["base_rate"],
        "applied_rate": calculation_result["calculation_details"].get("percentage_rate"),
        "calculation_details": calculation_result["calculation_details"],
        "breakdown": calculation_result["breakdown"],
        "next_steps": next_steps,
        "payment_options": payment_options,
        "calculated_at": datetime.now().isoformat()
    }