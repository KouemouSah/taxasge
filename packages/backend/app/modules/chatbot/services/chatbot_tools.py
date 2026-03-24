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

    # No guard — allow listing popular services without filters
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

    companies = [
        {k: str(v) if v is not None else None for k, v in dict(r).items()}
        for r in rows
    ]

    return {
        "companies": companies,
        "count": len(companies),
        "display_hint": "tabla" if len(companies) >= 2 else "lista",
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
        conditions.append(f"(el.entity_code ILIKE '%' || ${idx} || '%' OR e.name ILIKE '%' || ${idx} || '%')")
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
               e.name AS entity_name,
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
    """Get a complete tutorial-style guide for an administrative procedure."""
    workflow_code = kwargs.get("workflow_code", "")
    workflow_name = kwargs.get("workflow_name", "")

    if not workflow_code and not workflow_name:
        # List all available workflows grouped by category
        rows = await db.fetch("""
            SELECT w.code, w.name_es, w.description_es, w.category,
                   w.requires_appointment, w.requires_agent_validation,
                   w.sla_hours, w.max_processing_days
            FROM workflows w
            WHERE w.is_active = true AND w.parent_workflow_code IS NULL
            ORDER BY w.category, w.name_es
        """)
        return {
            "available_workflows": [
                {k: str(v) if v is not None else None for k, v in dict(r).items()}
                for r in rows
            ],
            "count": len(rows),
            "hint": "Usa workflow_code para obtener la guía detallada de un trámite específico",
        }

    # Find workflow — search by code or name
    if workflow_code:
        wf = await db.fetchrow("""
            SELECT w.code, w.name_es, w.description_es, w.category,
                   w.requires_appointment, w.requires_agent_validation,
                   w.sla_hours, w.max_processing_days,
                   w.appointment_delay_days, w.appointment_entity_code
            FROM workflows w WHERE w.code = $1
        """, workflow_code)
    else:
        wf = await db.fetchrow("""
            SELECT w.code, w.name_es, w.description_es, w.category,
                   w.requires_appointment, w.requires_agent_validation,
                   w.sla_hours, w.max_processing_days,
                   w.appointment_delay_days, w.appointment_entity_code
            FROM workflows w
            WHERE w.name_es ILIKE '%' || $1 || '%' AND w.is_active = true
            LIMIT 1
        """, workflow_name)

    if not wf:
        return {"error": f"Trámite no encontrado: {workflow_code or workflow_name}"}

    result = {k: str(v) if v is not None else None for k, v in dict(wf).items()}

    # Sub-workflows (e.g., PASAPORTE → NUEVO, RENOVACION, PERDIDA, ROBO)
    sub_workflows = await db.fetch("""
        SELECT code, name_es, description_es
        FROM workflows
        WHERE parent_workflow_code = $1 AND is_active = true
        ORDER BY display_order, name_es
    """, wf["code"])
    if sub_workflows:
        result["sub_types"] = [
            {k: str(v) if v is not None else None for k, v in dict(s).items()}
            for s in sub_workflows
        ]

    # Required documents with instructions
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

    # Tariffs with details
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

    # Also get tariffs for sub-workflows
    if sub_workflows:
        sub_codes = [s["code"] for s in sub_workflows]
        sub_tariffs = await db.fetch("""
            SELECT wt.workflow_code, wt.solicitud_type, wt.amount, wt.currency
            FROM workflow_tariffs wt
            WHERE wt.workflow_code = ANY($1) AND wt.is_active = true
            ORDER BY wt.workflow_code
        """, sub_codes)
        result["sub_type_tariffs"] = [
            {k: str(v) if v is not None else None for k, v in dict(t).items()}
            for t in sub_tariffs
        ]

    # Entities that handle this workflow
    entities = await db.fetch("""
        SELECT e.code, e.name, e.entity_type
        FROM entities e
        WHERE e.workflow_codes @> $1::jsonb AND e.is_active = true
    """, f'["{wf["code"]}"]')
    result["handling_entities"] = [
        {k: str(v) if v is not None else None for k, v in dict(e).items()}
        for e in entities
    ]

    # Office locations for handling entities
    if entities:
        entity_codes = [e["code"] for e in entities]
        locations = await db.fetch("""
            SELECT el.entity_code, el.location_name, el.city, el.region,
                   el.location_address, el.phone, el.operating_hours
            FROM entity_locations el
            WHERE el.entity_code = ANY($1) AND el.is_active = true
            ORDER BY el.entity_code, el.city
        """, entity_codes)
        result["office_locations"] = [
            {k: str(v) if v is not None else None for k, v in dict(l).items()}
            for l in locations
        ]

    # Build tutorial steps — clear, simple, for anyone
    step_num = 1
    tutorial = []

    tutorial.append(
        f"{step_num}. **Accede a la plataforma Facil** → Entra en facil.gq, "
        f"crea una cuenta si no tienes, e inicia sesión"
    )
    step_num += 1

    tutorial.append(
        f"{step_num}. **Selecciona el trámite** → Busca '{wf['name_es']}' "
        f"en el catálogo de servicios"
    )
    step_num += 1

    doc_count = len(docs)
    if doc_count > 0:
        doc_names = ", ".join(d["document_name_es"] for d in docs[:3] if d.get("document_name_es"))
        extra = f" y {doc_count - 3} más" if doc_count > 3 else ""
        tutorial.append(
            f"{step_num}. **Prepara tus documentos** → Necesitas {doc_count} documentos: "
            f"{doc_names}{extra}. Escanéalos o toma fotos claras"
        )
        step_num += 1

    tutorial.append(
        f"{step_num}. **Sube los documentos** → Adjunta los archivos escaneados "
        f"en la plataforma, uno por uno"
    )
    step_num += 1

    if wf["requires_appointment"]:
        delay = wf.get("appointment_delay_days") or 3
        tutorial.append(
            f"{step_num}. **Reserva tu cita** → Elige una fecha disponible "
            f"(a partir de {delay} días desde hoy) y un horario"
        )
        step_num += 1

    tariff_amount = tariffs[0]["amount"] if tariffs else "0"
    tariff_currency = tariffs[0]["currency"] if tariffs else "XAF"
    tutorial.append(
        f"{step_num}. **Realiza el pago** → Paga **{tariff_amount} {tariff_currency}** "
        f"por BANGE Mobile Money, tarjeta, transferencia o efectivo en ventanilla"
    )
    step_num += 1

    if wf["requires_appointment"]:
        tutorial.append(
            f"{step_num}. **Acude a tu cita** → Lleva los documentos ORIGINALES "
            f"el día y hora reservados"
        )
        step_num += 1

    if wf["requires_agent_validation"]:
        sla = wf.get("sla_hours") or 48
        tutorial.append(
            f"{step_num}. **Espera la revisión** → Un agente verificará tu solicitud "
            f"en un plazo máximo de {sla} horas"
        )
        step_num += 1

    tutorial.append(
        f"{step_num}. **Recoge tu documento** → Recibirás una notificación "
        f"cuando esté listo. Acude a la oficina indicada con tu DIP"
    )

    processing = wf.get("max_processing_days")
    if processing:
        tutorial.append(f"\n**Tiempo total estimado:** {processing} días hábiles")

    result["tutorial_steps"] = tutorial

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
            description="Buscar en el directorio de empresas registradas en Guinea Ecuatorial. SIEMPRE llamar esta función cuando el usuario mencione empresas, directorio empresarial, NIF, o actividad comercial. Si no se especifica filtro, llamar SIN parámetros para listar las empresas registradas.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Opcional: nombre de empresa, NIF, o número de registro. Dejar vacío para listar todas."},
                    "zone": {"type": "string", "description": "Opcional: zona comercial (ej: 'Malabo', 'Bata')"},
                    "sector": {"type": "string", "description": "Opcional: sector de actividad (ej: 'Comercio')"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_ministry_directory",
            description="Obtener información sobre los ministerios del gobierno de Guinea Ecuatorial. SIEMPRE llamar cuando el usuario mencione ministerios, gobierno, o organización gubernamental. Sin parámetros = listar todos los ministerios.",
            parameters={
                "type": "object",
                "properties": {
                    "ministry_code": {"type": "string", "description": "Código o nombre del ministerio (dejar vacío para listar todos)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_office_locations",
            description="Obtener direcciones, horarios y contacto de oficinas gubernamentales. SIEMPRE llamar cuando el usuario pregunte dónde, horarios, ubicación, o dirección de oficinas. Sin parámetros = listar todas.",
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
            description="Obtener guía tutorial completa de un trámite administrativo. SIEMPRE llamar cuando el usuario pregunte cómo hacer un trámite, pasos, documentos necesarios, o procedimiento. Sin parámetros = listar todos los trámites disponibles.",
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
            description="Explorar el catálogo de servicios por categoría. SIEMPRE llamar cuando el usuario pregunte qué servicios hay, categorías, o quiera explorar el catálogo. Sin parámetros = listar todas las categorías.",
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
