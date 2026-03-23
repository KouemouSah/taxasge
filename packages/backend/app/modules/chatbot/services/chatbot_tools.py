"""
Chatbot Public Tools — Business tools for the public-facing RAG chatbot.

These tools give Gemini access to ALL public data on the Facil platform:
fiscal services, companies, ministries, office locations, workflow guides,
service categories, and platform information.

IMPORTANT: All functions accept (db, **kwargs) pattern.
  - db is the asyncpg connection
  - Gemini provides function-specific parameters via kwargs
  - No entity scoping (these are public, citizen-facing tools)

8 function-calling tools for Gemini:
1. search_fiscal_services  — Search services by keyword, category, or ministry
2. get_service_details     — Full details of a service (docs, procedures, tariffs)
3. search_companies        — Company directory (by name, NIF, zone, sector)
4. get_ministry_directory  — Ministry info with sectors and service counts
5. get_office_locations    — Office addresses, hours, and contact info
6. get_workflow_guide      — Complete guide for an administrative procedure
7. get_service_categories  — Browse service catalog by category
8. get_platform_info       — General platform information and FAQ
"""

from typing import Any, Dict, List
from loguru import logger

try:
    from vertexai.generative_models import FunctionDeclaration
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False


# ============================================================================
# SQL FUNCTIONS — All use (db, **kwargs), citizen-facing (no entity scoping)
# ============================================================================

async def search_fiscal_services(db, **kwargs) -> dict:
    """Search fiscal services by keyword, category, or ministry."""
    query = kwargs.get("query", "")
    category = kwargs.get("category", "")
    ministry = kwargs.get("ministry", "")
    limit = min(int(kwargs.get("limit", 10)), 20)

    if not query and not category and not ministry:
        return {"error": "Provide at least one search parameter: query, category, or ministry"}

    conditions = ["fs.status = 'active'"]
    params = []
    idx = 1

    if query:
        conditions.append(f"""(
            fs.search_vector @@ plainto_tsquery('spanish', ${idx})
            OR fs.name_es ILIKE '%' || ${idx} || '%'
            OR EXISTS (SELECT 1 FROM service_keywords sk
                       WHERE sk.fiscal_service_id = fs.id
                       AND sk.keyword ILIKE '%' || ${idx} || '%')
        )""")
        params.append(query)
        idx += 1

    if category:
        conditions.append(f"c.name_es ILIKE '%' || ${idx} || '%'")
        params.append(category)
        idx += 1

    if ministry:
        conditions.append(f"m.name_es ILIKE '%' || ${idx} || '%'")
        params.append(ministry)
        idx += 1

    where = " AND ".join(conditions)
    params.append(limit)

    rows = await db.fetch(f"""
        SELECT fs.service_code, fs.name_es, fs.description_es,
               fs.service_type, fs.tasa_expedicion, fs.tasa_renovacion,
               fs.processing_time_days, fs.validity_period_months,
               c.name_es AS category_name,
               m.name_es AS ministry_name
        FROM fiscal_services fs
        LEFT JOIN categories c ON c.id = fs.category_id
        LEFT JOIN sectors s ON s.id = c.sector_id
        LEFT JOIN ministries m ON m.id = s.ministry_id
        WHERE {where}
        ORDER BY fs.calculation_count DESC NULLS LAST
        LIMIT ${idx}
    """, *params)

    return {
        "services": [
            {k: str(v) if v is not None else None for k, v in dict(r).items()}
            for r in rows
        ],
        "count": len(rows),
    }


async def get_service_details(db, **kwargs) -> dict:
    """Get full details of a fiscal service including documents, procedures, and tariffs."""
    service_code = kwargs.get("service_code", "")
    service_name = kwargs.get("service_name", "")

    if not service_code and not service_name:
        return {"error": "Provide service_code or service_name"}

    # Find service
    if service_code:
        svc = await db.fetchrow("""
            SELECT fs.id, fs.service_code, fs.name_es, fs.description_es,
                   fs.service_type, fs.calculation_method,
                   fs.tasa_expedicion, fs.tasa_renovacion,
                   fs.processing_time_days, fs.validity_period_months,
                   fs.legal_reference,
                   c.name_es AS category_name,
                   m.name_es AS ministry_name
            FROM fiscal_services fs
            LEFT JOIN categories c ON c.id = fs.category_id
            LEFT JOIN sectors s ON s.id = c.sector_id
            LEFT JOIN ministries m ON m.id = s.ministry_id
            WHERE fs.service_code = $1
        """, service_code)
    else:
        svc = await db.fetchrow("""
            SELECT fs.id, fs.service_code, fs.name_es, fs.description_es,
                   fs.service_type, fs.calculation_method,
                   fs.tasa_expedicion, fs.tasa_renovacion,
                   fs.processing_time_days, fs.validity_period_months,
                   fs.legal_reference,
                   c.name_es AS category_name,
                   m.name_es AS ministry_name
            FROM fiscal_services fs
            LEFT JOIN categories c ON c.id = fs.category_id
            LEFT JOIN sectors s ON s.id = c.sector_id
            LEFT JOIN ministries m ON m.id = s.ministry_id
            WHERE fs.name_es ILIKE '%' || $1 || '%' AND fs.status = 'active'
            ORDER BY fs.calculation_count DESC NULLS LAST
            LIMIT 1
        """, service_name)

    if not svc:
        return {"error": f"Service not found: {service_code or service_name}"}

    service_id = svc["id"]
    result = {k: str(v) if v is not None else None for k, v in dict(svc).items()}

    # Get required documents
    docs = await db.fetch("""
        SELECT dt.template_code, dt.document_name_es,
               sda.is_required_expedition, sda.is_required_renewal,
               dt.validity_duration_months
        FROM service_document_assignments sda
        JOIN document_templates dt ON dt.id = sda.document_template_id
        WHERE sda.fiscal_service_id = $1
        ORDER BY sda.display_order
    """, service_id)
    result["required_documents"] = [
        {k: str(v) if v is not None else None for k, v in dict(d).items()}
        for d in docs
    ]

    # Get procedures with steps
    procs = await db.fetch("""
        SELECT pt.id, pt.template_code, pt.name_es, pt.description_es
        FROM service_procedure_assignments spa
        JOIN procedure_templates pt ON pt.id = spa.procedure_template_id
        WHERE spa.fiscal_service_id = $1
        ORDER BY spa.display_order
    """, service_id)

    procedures = []
    for proc in procs:
        steps = await db.fetch("""
            SELECT step_number, description_es, instructions_es,
                   estimated_duration_minutes
            FROM procedure_template_steps
            WHERE template_id = $1
            ORDER BY step_number
        """, proc["id"])
        procedures.append({
            "name": proc["name_es"],
            "description": proc["description_es"],
            "steps": [
                {k: str(v) if v is not None else None for k, v in dict(s).items()}
                for s in steps
            ],
        })
    result["procedures"] = procedures

    return result


async def search_companies(db, **kwargs) -> dict:
    """Search the company directory by name, NIF, zone, or sector."""
    query = kwargs.get("query", "")
    zone = kwargs.get("zone", "")
    sector = kwargs.get("sector", "")
    limit = min(int(kwargs.get("limit", 10)), 20)

    conditions = ["c.is_verified = true"]
    params = []
    idx = 1

    if query:
        conditions.append(f"""(
            c.legal_name ILIKE '%' || ${idx} || '%'
            OR c.nif ILIKE '%' || ${idx} || '%'
            OR c.registration_number ILIKE '%' || ${idx} || '%'
        )""")
        params.append(query)
        idx += 1

    if zone:
        conditions.append(f"cz.name_es ILIKE '%' || ${idx} || '%'")
        params.append(zone)
        idx += 1

    if sector:
        conditions.append(f"c.sector_actividad ILIKE '%' || ${idx} || '%'")
        params.append(sector)
        idx += 1

    where = " AND ".join(conditions)
    params.append(limit)

    rows = await db.fetch(f"""
        SELECT c.legal_name, c.nif, c.registration_number,
               c.forma_juridica, c.sector_actividad, c.objeto_social,
               c.address, ci.name AS city_name, ci.provincia,
               cz.name_es AS zone_name
        FROM companies c
        LEFT JOIN cities ci ON ci.id = c.city_id
        LEFT JOIN commerce_zones cz ON cz.id = c.zone_id
        WHERE {where}
        ORDER BY c.legal_name
        LIMIT ${idx}
    """, *params)

    return {
        "companies": [
            {k: str(v) if v is not None else None for k, v in dict(r).items()}
            for r in rows
        ],
        "count": len(rows),
    }


async def get_ministry_directory(db, **kwargs) -> dict:
    """Get information about government ministries, their sectors and services."""
    ministry_code = kwargs.get("ministry_code", "")

    if ministry_code:
        row = await db.fetchrow("""
            SELECT m.id, m.ministry_code, m.name_es, m.description_es,
                   m.contact_email, m.contact_phone, m.website_url,
                   (SELECT COUNT(*) FROM sectors s WHERE s.ministry_id = m.id) AS sector_count,
                   (SELECT COUNT(*) FROM fiscal_services fs
                    JOIN categories c ON c.id = fs.category_id
                    JOIN sectors s ON s.id = c.sector_id
                    WHERE s.ministry_id = m.id AND fs.status = 'active') AS service_count
            FROM ministries m
            WHERE m.ministry_code = $1 OR m.name_es ILIKE '%' || $1 || '%'
            LIMIT 1
        """, ministry_code)
        if not row:
            return {"error": f"Ministry not found: {ministry_code}"}

        # Get sectors for this ministry
        sectors = await db.fetch("""
            SELECT s.sector_code, s.name_es, s.description_es
            FROM sectors s WHERE s.ministry_id = $1 ORDER BY s.display_order
        """, row["id"])

        result = {k: str(v) if v is not None else None for k, v in dict(row).items()}
        result["sectors"] = [
            {k: str(v) if v is not None else None for k, v in dict(s).items()}
            for s in sectors
        ]
        return result
    else:
        # List all ministries
        rows = await db.fetch("""
            SELECT m.ministry_code, m.name_es,
                   m.contact_email, m.contact_phone,
                   (SELECT COUNT(*) FROM sectors s WHERE s.ministry_id = m.id) AS sector_count,
                   (SELECT COUNT(*) FROM fiscal_services fs
                    JOIN categories c ON c.id = fs.category_id
                    JOIN sectors s ON s.id = c.sector_id
                    WHERE s.ministry_id = m.id AND fs.status = 'active') AS service_count
            FROM ministries m
            WHERE m.is_active = true
            ORDER BY m.display_order, m.name_es
        """)
        return {
            "ministries": [
                {k: str(v) if v is not None else None for k, v in dict(r).items()}
                for r in rows
            ],
            "count": len(rows),
        }


async def get_office_locations(db, **kwargs) -> dict:
    """Get office locations, addresses, hours, and contact information."""
    entity_code = kwargs.get("entity_code", "")
    city = kwargs.get("city", "")

    conditions = ["el.is_active = true"]
    params = []
    idx = 1

    if entity_code:
        conditions.append(f"(el.entity_code ILIKE '%' || ${idx} || '%' OR e.name_es ILIKE '%' || ${idx} || '%')")
        params.append(entity_code)
        idx += 1

    if city:
        conditions.append(f"(el.city ILIKE '%' || ${idx} || '%' OR ci.name ILIKE '%' || ${idx} || '%')")
        params.append(city)
        idx += 1

    where = " AND ".join(conditions)

    rows = await db.fetch(f"""
        SELECT el.entity_code, el.location_name, el.city, el.region,
               el.location_address, el.phone, el.email,
               el.operating_hours,
               e.name_es AS entity_name,
               ci.name AS city_name
        FROM entity_locations el
        LEFT JOIN entities e ON e.code = el.entity_code
        LEFT JOIN cities ci ON ci.id = el.city_id
        WHERE {where}
        ORDER BY el.entity_code, el.city
    """, *params)

    return {
        "locations": [
            {k: str(v) if v is not None else None for k, v in dict(r).items()}
            for r in rows
        ],
        "count": len(rows),
    }


async def get_workflow_guide(db, **kwargs) -> dict:
    """Get a complete guide for an administrative procedure (workflow)."""
    workflow_code = kwargs.get("workflow_code", "")
    workflow_name = kwargs.get("workflow_name", "")

    if not workflow_code and not workflow_name:
        # List available workflows
        rows = await db.fetch("""
            SELECT w.code, w.name_es, w.description_es, w.category,
                   w.is_active
            FROM workflows w
            WHERE w.is_active = true AND w.parent_workflow_id IS NULL
            ORDER BY w.name_es
        """)
        return {
            "available_workflows": [
                {k: str(v) if v is not None else None for k, v in dict(r).items()}
                for r in rows
            ],
            "count": len(rows),
            "hint": "Use workflow_code to get detailed guide for a specific workflow",
        }

    # Find workflow
    if workflow_code:
        wf = await db.fetchrow("""
            SELECT w.id, w.code, w.name_es, w.description_es, w.category
            FROM workflows w WHERE w.code = $1
        """, workflow_code)
    else:
        wf = await db.fetchrow("""
            SELECT w.id, w.code, w.name_es, w.description_es, w.category
            FROM workflows w WHERE w.name_es ILIKE '%' || $1 || '%' AND w.is_active = true
            LIMIT 1
        """, workflow_name)

    if not wf:
        return {"error": f"Workflow not found: {workflow_code or workflow_name}"}

    result = {k: str(v) if v is not None else None for k, v in dict(wf).items()}

    # Get required documents
    docs = await db.fetch("""
        SELECT wdr.document_code, wdr.document_name_es, wdr.is_required,
               wdr.condition_type, wdr.instructions_es
        FROM workflow_document_requirements wdr
        WHERE wdr.workflow_code = $1 AND wdr.is_active = true
        ORDER BY wdr.display_order
    """, wf["code"])
    result["required_documents"] = [
        {k: str(v) if v is not None else None for k, v in dict(d).items()}
        for d in docs
    ]

    # Get tariffs
    tariffs = await db.fetch("""
        SELECT wt.solicitud_type, wt.tariff_type, wt.amount,
               wt.currency, wt.legal_reference
        FROM workflow_tariffs wt
        WHERE wt.workflow_code = $1 AND wt.is_active = true
        ORDER BY wt.solicitud_type
    """, wf["code"])
    result["tariffs"] = [
        {k: str(v) if v is not None else None for k, v in dict(t).items()}
        for t in tariffs
    ]

    # Get entities that handle this workflow
    entities = await db.fetch("""
        SELECT e.code, e.name_es, e.entity_type
        FROM entities e
        WHERE e.workflow_codes @> $1::jsonb AND e.is_active = true
    """, f'["{wf["code"]}"]')
    result["handling_entities"] = [
        {k: str(v) if v is not None else None for k, v in dict(e).items()}
        for e in entities
    ]

    return result


async def get_service_categories(db, **kwargs) -> dict:
    """Browse the service catalog by category, with service counts."""
    sector = kwargs.get("sector", "")

    conditions = ["c.is_active = true"]
    params = []
    idx = 1

    if sector:
        conditions.append(f"s.name_es ILIKE '%' || ${idx} || '%'")
        params.append(sector)
        idx += 1

    where = " AND ".join(conditions)

    rows = await db.fetch(f"""
        SELECT c.category_code, c.name_es AS category_name,
               c.description_es,
               s.name_es AS sector_name,
               m.name_es AS ministry_name,
               (SELECT COUNT(*) FROM fiscal_services fs
                WHERE fs.category_id = c.id AND fs.status = 'active') AS service_count
        FROM categories c
        LEFT JOIN sectors s ON s.id = c.sector_id
        LEFT JOIN ministries m ON m.id = s.ministry_id
        WHERE {where}
        ORDER BY m.name_es, s.name_es, c.name_es
    """, *params)

    return {
        "categories": [
            {k: str(v) if v is not None else None for k, v in dict(r).items()}
            for r in rows
        ],
        "count": len(rows),
    }


async def get_platform_info(db, **kwargs) -> dict:
    """Get general information about the Facil platform."""
    topic = kwargs.get("topic", "about")

    info = {
        "about": {
            "name": "Facil (TaxasGE)",
            "description": "Plataforma oficial de servicios fiscales y administrativos de Guinea Ecuatorial. Facilita los trámites gubernamentales para ciudadanos y empresas.",
            "services": "Más de 850 servicios fiscales disponibles en línea",
            "languages": "Español (principal), Francés, Inglés",
            "coverage": "Todo el territorio de Guinea Ecuatorial (Región Insular y Continental)",
        },
        "hours": {
            "online_platform": "Disponible 24/7",
            "office_hours": "Lunes a Viernes, 08:00 - 15:00 (hora local GMT+1)",
            "note": "Los horarios pueden variar según la oficina. Use la función 'get_office_locations' para horarios específicos.",
        },
        "contact": {
            "website": "https://facil.gq",
            "support": "Disponible a través del sistema de tickets de soporte en la plataforma",
            "note": "Para consultas específicas sobre un trámite, contacte la entidad correspondiente.",
        },
        "faq": {
            "how_to_start": "1. Registrarse en la plataforma, 2. Seleccionar el servicio deseado, 3. Subir los documentos requeridos, 4. Realizar el pago, 5. Seguir el estado de su solicitud",
            "payment_methods": "BANGE Mobile Money, transferencia bancaria, tarjeta, efectivo (en ventanilla)",
            "processing_time": "Varía según el servicio. Consulte los detalles de cada servicio para tiempos estimados.",
            "documents": "Los documentos requeridos varían por servicio. Use la función 'get_service_details' para ver la lista completa.",
        },
    }

    return info.get(topic, info["about"])


# ============================================================================
# FUNCTION MAP — Maps function names to async callables
# ============================================================================

CHATBOT_FUNCTION_MAP = {
    "search_fiscal_services": search_fiscal_services,
    "get_service_details": get_service_details,
    "search_companies": search_companies,
    "get_ministry_directory": get_ministry_directory,
    "get_office_locations": get_office_locations,
    "get_workflow_guide": get_workflow_guide,
    "get_service_categories": get_service_categories,
    "get_platform_info": get_platform_info,
}


# ============================================================================
# FUNCTION DECLARATIONS — Gemini tool definitions
# ============================================================================

CHATBOT_FUNC_DECLS = []

if VERTEX_AVAILABLE:
    CHATBOT_FUNC_DECLS = [
        FunctionDeclaration(
            name="search_fiscal_services",
            description="Buscar servicios fiscales por palabra clave, categoría o ministerio. Usar cuando el usuario pregunta sobre un servicio específico, precios, o tipos de trámites disponibles.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Palabra clave de búsqueda (ej: 'pasaporte', 'licencia', 'residencia')"},
                    "category": {"type": "string", "description": "Filtrar por nombre de categoría (opcional)"},
                    "ministry": {"type": "string", "description": "Filtrar por nombre de ministerio (opcional)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_service_details",
            description="Obtener detalles completos de un servicio fiscal: documentos requeridos, procedimiento paso a paso, tarifas, tiempo de procesamiento y validez. Usar cuando el usuario pide información detallada sobre un servicio específico.",
            parameters={
                "type": "object",
                "properties": {
                    "service_code": {"type": "string", "description": "Código del servicio (ej: 'PAT-001')"},
                    "service_name": {"type": "string", "description": "Nombre parcial del servicio (si no se conoce el código)"},
                },
            },
        ),
        FunctionDeclaration(
            name="search_companies",
            description="Buscar en el directorio de empresas registradas en Guinea Ecuatorial. Usar cuando el usuario pregunta sobre empresas, directorio empresarial, NIF, o actividad comercial.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Nombre de empresa, NIF, o número de registro"},
                    "zone": {"type": "string", "description": "Zona comercial (ej: 'Malabo', 'Bata', 'Continental')"},
                    "sector": {"type": "string", "description": "Sector de actividad (ej: 'Comercio', 'Construcción')"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_ministry_directory",
            description="Obtener información sobre los ministerios del gobierno de Guinea Ecuatorial: sectores, cantidad de servicios, contacto. Usar cuando el usuario pregunta sobre ministerios, organización gubernamental, o qué ministerio gestiona qué.",
            parameters={
                "type": "object",
                "properties": {
                    "ministry_code": {"type": "string", "description": "Código o nombre del ministerio (dejar vacío para listar todos)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_office_locations",
            description="Obtener direcciones, horarios y contacto de las oficinas gubernamentales. Usar cuando el usuario pregunta dónde realizar un trámite, horarios de atención, o ubicación de oficinas.",
            parameters={
                "type": "object",
                "properties": {
                    "entity_code": {"type": "string", "description": "Código o nombre de la entidad (ej: 'CNEDOGE', 'DGT', 'Extranjería')"},
                    "city": {"type": "string", "description": "Ciudad (ej: 'Malabo', 'Bata')"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_workflow_guide",
            description="Obtener guía completa de un trámite administrativo: documentos, tarifas, entidades responsables. Usar cuando el usuario pregunta cómo hacer un trámite, qué necesita, o los pasos a seguir.",
            parameters={
                "type": "object",
                "properties": {
                    "workflow_code": {"type": "string", "description": "Código del workflow (ej: 'PASAPORTE', 'RESIDENCIA', 'CONDUCIR')"},
                    "workflow_name": {"type": "string", "description": "Nombre parcial del trámite (si no se conoce el código)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_service_categories",
            description="Explorar el catálogo de servicios por categoría. Usar cuando el usuario quiere saber qué servicios hay disponibles, explorar por sector, o entender la organización del catálogo.",
            parameters={
                "type": "object",
                "properties": {
                    "sector": {"type": "string", "description": "Filtrar por sector (opcional, ej: 'Hacienda', 'Seguridad')"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_platform_info",
            description="Información general sobre la plataforma Facil: qué es, horarios, contacto, preguntas frecuentes. Usar cuando el usuario pregunta sobre la plataforma, cómo funciona, o necesita ayuda general.",
            parameters={
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Tema de información",
                        "enum": ["about", "hours", "contact", "faq"],
                    },
                },
            },
        ),
    ]
