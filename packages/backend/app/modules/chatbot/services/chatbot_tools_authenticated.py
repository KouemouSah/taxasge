"""
Chatbot Authenticated Tools — Personal tools for logged-in users.

These tools give Gemini access to USER-SPECIFIC data on Facil:
service requests, payments, appointments, notifications, profile.

SECURITY: All functions require user_id and ONLY return data belonging
to that user. Cross-user access is impossible by design ($1 = user_id
in every WHERE clause).

8 authenticated tools:
1. get_my_requests      — List user's service requests (with status filter)
2. get_request_detail   — Detailed status + timeline of a specific request
3. get_my_payments      — User's payments (pending, completed)
4. get_my_appointments  — Upcoming appointments
5. get_my_notifications — Recent actions/changes on user's requests
6. get_my_profile       — User's account info + companies
7. get_my_next_actions  — Smart: what should the user do next
8. get_my_documents     — Documents uploaded + missing per request
"""

from typing import Any, Dict
from loguru import logger


# ============================================================================
# 1. GET MY REQUESTS
# ============================================================================

async def get_my_requests(db, **kwargs) -> dict:
    """List the authenticated user's service requests."""
    user_id = kwargs.get("user_id", "")
    status_filter = kwargs.get("status", "")
    limit = min(int(kwargs.get("limit", 10)), 20)

    if not user_id:
        return {"error": "Autenticación requerida para ver sus solicitudes"}

    conditions = ["sr.user_id = $1::uuid"]
    params = [user_id]
    idx = 2

    if status_filter:
        conditions.append(f"sr.status::text ILIKE ${idx}")
        params.append(f"%{status_filter}%")
        idx += 1

    params.append(limit)
    where = " AND ".join(conditions)

    rows = await db.fetch(f"""
        SELECT sr.id, sr.reference, sr.workflow_code, sr.solicitud_type,
               sr.status::text, sr.total_amount, sr.currency,
               sr.submitted_at, sr.created_at, sr.updated_at,
               sr.payment_status, sr.cita_date, sr.cita_time,
               w.name_es as workflow_name
        FROM service_requests sr
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        WHERE {where}
        ORDER BY sr.updated_at DESC NULLS LAST
        LIMIT ${idx}
    """, *params)

    requests = []
    for r in rows:
        req = {
            "reference": r["reference"],
            "workflow": r["workflow_name"] or r["workflow_code"],
            "type": r["solicitud_type"],
            "status": r["status"],
            "amount": f"{r['total_amount']} {r['currency']}" if r["total_amount"] else None,
            "payment_status": r["payment_status"],
            "submitted": str(r["submitted_at"])[:10] if r["submitted_at"] else None,
            "last_update": str(r["updated_at"])[:10] if r["updated_at"] else None,
        }
        if r["cita_date"]:
            req["appointment"] = f"{r['cita_date']} {r['cita_time'] or ''}"
        requests.append(req)

    return {
        "requests": requests,
        "count": len(requests),
        "note": "Mostrando sus solicitudes más recientes" if requests else "No tiene solicitudes registradas",
    }


# ============================================================================
# 2. GET REQUEST DETAIL
# ============================================================================

async def get_request_detail(db, **kwargs) -> dict:
    """Get detailed status and timeline of a specific service request."""
    user_id = kwargs.get("user_id", "")
    reference = kwargs.get("reference", "")

    if not user_id:
        return {"error": "Autenticación requerida"}
    if not reference:
        return {"error": "Indique la referencia de la solicitud (ej: SR-2026-0001)"}

    sr = await db.fetchrow("""
        SELECT sr.id, sr.reference, sr.workflow_code, sr.solicitud_type,
               sr.status::text, sr.total_amount, sr.currency,
               sr.payment_status, sr.submitted_at, sr.validated_at,
               sr.completed_at, sr.rejection_reason, sr.notes,
               sr.cita_date, sr.cita_time, sr.cita_location,
               sr.entity_code, sr.escalated,
               w.name_es as workflow_name
        FROM service_requests sr
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        WHERE sr.user_id = $1::uuid
          AND (sr.reference ILIKE '%' || $2 || '%' OR sr.id::text = $2)
        LIMIT 1
    """, user_id, reference)

    if not sr:
        return {"error": f"Solicitud '{reference}' no encontrada en su cuenta"}

    result = {
        "reference": sr["reference"],
        "workflow": sr["workflow_name"] or sr["workflow_code"],
        "type": sr["solicitud_type"],
        "status": sr["status"],
        "amount": f"{sr['total_amount']} {sr['currency']}" if sr["total_amount"] else None,
        "payment_status": sr["payment_status"],
        "submitted": str(sr["submitted_at"])[:16] if sr["submitted_at"] else None,
        "validated": str(sr["validated_at"])[:16] if sr["validated_at"] else None,
        "completed": str(sr["completed_at"])[:16] if sr["completed_at"] else None,
        "rejection_reason": sr["rejection_reason"],
        "entity": sr["entity_code"],
    }

    if sr["cita_date"]:
        result["appointment"] = {
            "date": str(sr["cita_date"]),
            "time": str(sr["cita_time"]) if sr["cita_time"] else None,
            "location": sr["cita_location"],
        }

    # Timeline from history
    history = await db.fetch("""
        SELECT action, previous_status::text, new_status::text,
               comment, performed_at
        FROM service_request_history
        WHERE service_request_id = $1
        ORDER BY performed_at DESC
        LIMIT 10
    """, sr["id"])

    result["timeline"] = [
        {
            "action": h["action"],
            "from": h["previous_status"],
            "to": h["new_status"],
            "comment": h["comment"],
            "date": str(h["performed_at"])[:16] if h["performed_at"] else None,
        }
        for h in history
    ]

    return result


# ============================================================================
# 3. GET MY PAYMENTS
# ============================================================================

async def get_my_payments(db, **kwargs) -> dict:
    """List the user's payments (pending, completed, failed)."""
    user_id = kwargs.get("user_id", "")
    status_filter = kwargs.get("status", "")

    if not user_id:
        return {"error": "Autenticación requerida"}

    conditions = ["sp.user_id = $1::uuid"]
    params = [user_id]
    idx = 2

    if status_filter:
        conditions.append(f"sp.status::text ILIKE ${idx}")
        params.append(f"%{status_filter}%")
        idx += 1

    where = " AND ".join(conditions)

    rows = await db.fetch(f"""
        SELECT sp.payment_reference, sp.total_amount, sp.currency,
               sp.payment_method::text, sp.status::text,
               sp.workflow_status::text, sp.paid_at, sp.expires_at,
               sp.receipt_number, sp.created_at,
               sr.reference as request_reference, sr.workflow_code
        FROM service_payments sp
        LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
        WHERE {where}
        ORDER BY sp.created_at DESC
        LIMIT 10
    """, *params)

    return {
        "payments": [
            {
                "reference": r["payment_reference"],
                "amount": f"{r['total_amount']} {r['currency']}",
                "method": r["payment_method"],
                "status": r["status"],
                "workflow_status": r["workflow_status"],
                "paid_at": str(r["paid_at"])[:16] if r["paid_at"] else None,
                "expires_at": str(r["expires_at"])[:10] if r["expires_at"] else None,
                "receipt": r["receipt_number"],
                "request": r["request_reference"],
            }
            for r in rows
        ],
        "count": len(rows),
    }


# ============================================================================
# 4. GET MY APPOINTMENTS
# ============================================================================

async def get_my_appointments(db, **kwargs) -> dict:
    """Get user's upcoming and recent appointments."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    rows = await db.fetch("""
        SELECT ar.appointment_date, ar.appointment_time, ar.status,
               ar.completed_at,
               sr.reference as request_reference, sr.workflow_code,
               w.name_es as workflow_name,
               el.location_name, el.city, el.location_address
        FROM appointment_reservations ar
        JOIN service_requests sr ON sr.id = ar.service_request_id
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        LEFT JOIN entity_locations el ON el.id = ar.entity_location_id
        WHERE sr.user_id = $1::uuid
        ORDER BY ar.appointment_date DESC, ar.appointment_time DESC
        LIMIT 5
    """, user_id)

    return {
        "appointments": [
            {
                "date": str(r["appointment_date"]),
                "time": str(r["appointment_time"])[:5] if r["appointment_time"] else None,
                "status": r["status"],
                "workflow": r["workflow_name"] or r["workflow_code"],
                "request": r["request_reference"],
                "location": r["location_name"],
                "city": r["city"],
                "address": r["location_address"],
            }
            for r in rows
        ],
        "count": len(rows),
    }


# ============================================================================
# 5. GET MY NOTIFICATIONS
# ============================================================================

async def get_my_notifications(db, **kwargs) -> dict:
    """Get recent actions/changes on user's service requests."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    rows = await db.fetch("""
        SELECT srh.action, srh.previous_status::text, srh.new_status::text,
               srh.comment, srh.performed_at,
               sr.reference, sr.workflow_code,
               w.name_es as workflow_name
        FROM service_request_history srh
        JOIN service_requests sr ON sr.id = srh.service_request_id
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        WHERE sr.user_id = $1::uuid
        ORDER BY srh.performed_at DESC
        LIMIT 10
    """, user_id)

    return {
        "notifications": [
            {
                "action": r["action"],
                "from_status": r["previous_status"],
                "to_status": r["new_status"],
                "comment": r["comment"],
                "date": str(r["performed_at"])[:16] if r["performed_at"] else None,
                "request": r["reference"],
                "workflow": r["workflow_name"] or r["workflow_code"],
            }
            for r in rows
        ],
        "count": len(rows),
    }


# ============================================================================
# 6. GET MY PROFILE
# ============================================================================

async def get_my_profile(db, **kwargs) -> dict:
    """Get user's account info and associated companies."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    user = await db.fetchrow("""
        SELECT id, full_name, email, phone, role::text, status::text,
               preferred_language, created_at
        FROM users WHERE id = $1::uuid
    """, user_id)

    if not user:
        return {"error": "Usuario no encontrado"}

    result = {
        "name": user["full_name"],
        "email": user["email"],
        "phone": user["phone"],
        "role": user["role"],
        "status": user["status"],
        "language": user["preferred_language"],
        "member_since": str(user["created_at"])[:10] if user["created_at"] else None,
    }

    # Companies
    companies = await db.fetch("""
        SELECT c.company_name, c.nif, ucr.role::text as company_role
        FROM user_company_roles ucr
        JOIN companies c ON c.id = ucr.company_id
        WHERE ucr.user_id = $1::uuid
        LIMIT 5
    """, user_id)

    if companies:
        result["companies"] = [
            {"name": c["company_name"], "nif": c["nif"], "role": c["company_role"]}
            for c in companies
        ]

    return result


# ============================================================================
# 7. GET MY NEXT ACTIONS (Smart assistant)
# ============================================================================

async def get_my_next_actions(db, **kwargs) -> dict:
    """Smart: determine what the user should do next based on pending items."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    actions = []

    # Pending payments
    pending_payments = await db.fetch("""
        SELECT sp.total_amount, sp.currency, sp.expires_at,
               sr.reference, w.name_es as workflow_name
        FROM service_payments sp
        JOIN service_requests sr ON sr.id = sp.service_request_id
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        WHERE sp.user_id = $1::uuid
          AND sp.status::text IN ('pending', 'submitted')
        ORDER BY sp.expires_at ASC NULLS LAST
        LIMIT 5
    """, user_id)

    for p in pending_payments:
        actions.append({
            "type": "payment_pending",
            "priority": "high",
            "message": f"Pago pendiente: {p['total_amount']} {p['currency']} para {p['workflow_name'] or 'trámite'} ({p['reference']})",
            "expires": str(p["expires_at"])[:10] if p["expires_at"] else None,
        })

    # Upcoming appointments (next 7 days)
    upcoming_appts = await db.fetch("""
        SELECT ar.appointment_date, ar.appointment_time,
               sr.reference, w.name_es as workflow_name,
               el.location_name, el.city
        FROM appointment_reservations ar
        JOIN service_requests sr ON sr.id = ar.service_request_id
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        LEFT JOIN entity_locations el ON el.id = ar.entity_location_id
        WHERE sr.user_id = $1::uuid
          AND ar.status = 'confirmed'
          AND ar.appointment_date >= CURRENT_DATE
          AND ar.appointment_date <= CURRENT_DATE + INTERVAL '7 days'
        ORDER BY ar.appointment_date, ar.appointment_time
        LIMIT 3
    """, user_id)

    for a in upcoming_appts:
        actions.append({
            "type": "appointment_upcoming",
            "priority": "high",
            "message": f"Cita: {a['appointment_date']} a las {str(a['appointment_time'])[:5]} en {a['location_name'] or ''} ({a['city'] or ''}) para {a['workflow_name'] or 'trámite'}",
        })

    # Requests needing attention (DOCUMENTS_REQUIRED, REJECTED)
    needs_attention = await db.fetch("""
        SELECT sr.reference, sr.status::text, sr.rejection_reason,
               w.name_es as workflow_name
        FROM service_requests sr
        LEFT JOIN workflows w ON w.code = sr.workflow_code
        WHERE sr.user_id = $1::uuid
          AND sr.status::text IN ('DOCUMENTS_REQUIRED', 'REJECTED', 'DRAFT')
        ORDER BY sr.updated_at DESC
        LIMIT 5
    """, user_id)

    for r in needs_attention:
        if r["status"] == "DOCUMENTS_REQUIRED":
            actions.append({
                "type": "documents_missing",
                "priority": "medium",
                "message": f"Documentos requeridos para {r['workflow_name'] or 'trámite'} ({r['reference']})",
            })
        elif r["status"] == "REJECTED":
            actions.append({
                "type": "request_rejected",
                "priority": "high",
                "message": f"Solicitud rechazada: {r['workflow_name']} ({r['reference']}). Motivo: {r['rejection_reason'] or 'No especificado'}",
            })
        elif r["status"] == "DRAFT":
            actions.append({
                "type": "draft_incomplete",
                "priority": "low",
                "message": f"Solicitud en borrador: {r['workflow_name'] or 'trámite'} ({r['reference']}) — puede completarla",
            })

    # Requests in progress (informational)
    in_progress = await db.fetchval("""
        SELECT COUNT(*) FROM service_requests
        WHERE user_id = $1::uuid
          AND status::text IN ('SUBMITTED', 'UNDER_REVIEW', 'DOSSIER_VALIDE', 'IN_PROGRESS', 'PAYMENT_PROCESSING')
    """, user_id)

    if in_progress:
        actions.append({
            "type": "in_progress",
            "priority": "info",
            "message": f"{in_progress} solicitud(es) en curso de tramitación",
        })

    return {
        "actions": actions,
        "total": len(actions),
        "summary": f"{len(actions)} acción(es) pendiente(s)" if actions else "No tiene acciones pendientes. ¡Todo al día!",
    }


# ============================================================================
# 8. GET MY DOCUMENTS
# ============================================================================

async def get_my_documents(db, **kwargs) -> dict:
    """Get documents uploaded by user, optionally for a specific request."""
    user_id = kwargs.get("user_id", "")
    reference = kwargs.get("reference", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    if reference:
        # Documents for a specific request
        rows = await db.fetch("""
            SELECT uf.file_name, uf.file_type::text, uf.ocr_status,
                   uf.uploaded_at, uf.original_filename
            FROM uploaded_files uf
            JOIN service_requests sr ON sr.payment_id = uf.service_payment_id
                OR sr.user_id = uf.user_id
            WHERE sr.user_id = $1::uuid
              AND (sr.reference ILIKE '%' || $2 || '%')
            ORDER BY uf.uploaded_at DESC
            LIMIT 20
        """, user_id, reference)
    else:
        # All recent documents
        rows = await db.fetch("""
            SELECT uf.file_name, uf.file_type::text, uf.ocr_status,
                   uf.uploaded_at, uf.original_filename
            FROM uploaded_files uf
            WHERE uf.user_id = $1::uuid
            ORDER BY uf.uploaded_at DESC
            LIMIT 10
        """, user_id)

    return {
        "documents": [
            {
                "name": r["original_filename"] or r["file_name"],
                "type": r["file_type"],
                "ocr_status": r["ocr_status"],
                "uploaded": str(r["uploaded_at"])[:16] if r["uploaded_at"] else None,
            }
            for r in rows
        ],
        "count": len(rows),
    }


# ============================================================================
# 9. LIST VAULT DOCUMENTS — Coffre-fort personnel
# ============================================================================

async def list_vault_documents(db, **kwargs) -> dict:
    """List all documents in user's digital vault with filters."""
    user_id = kwargs.get("user_id", "")
    category = kwargs.get("category")
    expiry_status = kwargs.get("expiry_status")
    workflow_code = kwargs.get("workflow_code")
    limit = min(int(kwargs.get("limit", 10)), 20)
    if not user_id:
        return {"error": "Autenticación requerida"}

    filters = ["ud.user_id = $1::uuid", "ud.deleted_at IS NULL", "ud.status != 'deleted'"]
    params = [user_id]
    idx = 2

    if category:
        filters.append(f"ud.document_category = ${idx}")
        params.append(category)
        idx += 1

    if expiry_status == "valid":
        filters.append("(ud.expiry_date IS NULL OR ud.expiry_date > CURRENT_DATE + INTERVAL '90 days')")
    elif expiry_status == "expiring_soon":
        filters.append("ud.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'")
    elif expiry_status == "expired":
        filters.append("ud.expiry_date < CURRENT_DATE")

    if workflow_code:
        filters.append(f"""EXISTS (
            SELECT 1 FROM user_document_workflow_tags t
            WHERE t.user_document_id = ud.id AND t.workflow_code = ${idx}
        )""")
        params.append(workflow_code)
        idx += 1

    where_clause = " AND ".join(filters)
    params.append(limit)

    rows = await db.fetch(f"""
        SELECT ud.id, ud.document_type, ud.document_category,
               ud.file_name, ud.display_name, ud.expiry_date,
               ud.extraction_confidence, ud.status, ud.source,
               ud.is_verified, ud.created_at, ud.holder_name,
               ud.document_number, ud.issue_date,
               array_agg(DISTINCT udwt.workflow_code)
                   FILTER (WHERE udwt.workflow_code IS NOT NULL) as workflow_tags
        FROM user_documents ud
        LEFT JOIN user_document_workflow_tags udwt ON udwt.user_document_id = ud.id
        WHERE {where_clause}
        GROUP BY ud.id
        ORDER BY ud.created_at DESC
        LIMIT ${idx}
    """, *params)

    documents = []
    for row in rows:
        doc = dict(row)
        if doc.get("expiry_date"):
            from datetime import date
            days = (doc["expiry_date"] - date.today()).days
            doc["days_until_expiry"] = days
            doc["expiry_label"] = (
                "expirado" if days < 0
                else "critico" if days < 7
                else "urgente" if days < 30
                else "pronto" if days < 90
                else "vigente"
            )
        doc["expiry_date"] = str(doc["expiry_date"]) if doc.get("expiry_date") else None
        doc["issue_date"] = str(doc["issue_date"]) if doc.get("issue_date") else None
        doc["created_at"] = str(doc["created_at"])[:16] if doc.get("created_at") else None
        doc["id"] = str(doc["id"])
        documents.append(doc)

    return {
        "documents": documents,
        "count": len(documents),
        "summary": f"{len(documents)} documentos en el cofre digital"
            + (f" (categoría: {category})" if category else "")
            + (f" (workflow: {workflow_code})" if workflow_code else ""),
    }


# ============================================================================
# 10. CHECK READINESS — Readiness d'un workflow
# ============================================================================

async def check_readiness(db, **kwargs) -> dict:
    """Check if user has all documents needed for a specific workflow."""
    user_id = kwargs.get("user_id", "")
    workflow_code = kwargs.get("workflow_code", "")
    if not user_id or not workflow_code:
        return {"error": "Se requiere user_id y workflow_code"}

    required = await db.fetch("""
        SELECT wdr.document_code, wdr.document_name_es, wdr.is_required,
               wdr.condition_type
        FROM workflow_document_requirements wdr
        WHERE wdr.workflow_code = $1 AND wdr.is_active = TRUE
        ORDER BY wdr.display_order
    """, workflow_code)

    available = await db.fetch("""
        SELECT ud.id, ud.document_type, ud.expiry_date, ud.status,
               udwt.document_code
        FROM user_documents ud
        JOIN user_document_workflow_tags udwt ON udwt.user_document_id = ud.id
        WHERE ud.user_id = $1::uuid AND udwt.workflow_code = $2
          AND ud.status = 'active' AND ud.deleted_at IS NULL
    """, user_id, workflow_code)

    available_codes = {r["document_code"] for r in available}
    ready, missing, expiring = [], [], []

    for req in required:
        code = req["document_code"]
        name = req["document_name_es"]
        if code in available_codes:
            doc = next((d for d in available if d["document_code"] == code), None)
            if doc and doc.get("expiry_date"):
                from datetime import date
                days = (doc["expiry_date"] - date.today()).days
                if days < 0:
                    expiring.append({"code": code, "name": name, "status": "expirado"})
                elif days < 30:
                    expiring.append({"code": code, "name": name, "status": "por_vencer", "dias": days})
                else:
                    ready.append({"code": code, "name": name})
            else:
                ready.append({"code": code, "name": name})
        elif req["is_required"]:
            missing.append({"code": code, "name": name})

    total = len(required)
    available_count = len(ready) + len(expiring)
    score = round((available_count / total * 100) if total > 0 else 0)

    return {
        "workflow_code": workflow_code,
        "readiness_score": score,
        "total_required": total,
        "available": available_count,
        "missing_count": len(missing),
        "ready": ready,
        "missing": missing,
        "expiring": expiring,
        "can_start": len(missing) == 0 and all(e.get("status") != "expirado" for e in expiring),
        "summary": f"Preparación {score}% — {available_count}/{total} documentos listos"
            + (f". Faltan: {', '.join(m['name'] for m in missing[:3])}" if missing else "")
            + (" ¡Listo para iniciar!" if len(missing) == 0 else ""),
    }


# ============================================================================
# 11. GET EXPIRING DOCUMENTS
# ============================================================================

async def get_expiring_documents(db, **kwargs) -> dict:
    """List documents expiring within N days."""
    user_id = kwargs.get("user_id", "")
    days_ahead = min(int(kwargs.get("days_ahead", 90)), 365)
    if not user_id:
        return {"error": "Autenticación requerida"}

    rows = await db.fetch("""
        SELECT id, document_type, display_name, file_name,
               expiry_date, holder_name, document_category
        FROM user_documents
        WHERE user_id = $1::uuid AND expiry_date IS NOT NULL
          AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2 * INTERVAL '1 day'
          AND status = 'active' AND deleted_at IS NULL
        ORDER BY expiry_date ASC
        LIMIT 20
    """, user_id, days_ahead)

    docs = []
    for row in rows:
        from datetime import date
        days = (row["expiry_date"] - date.today()).days
        docs.append({
            "id": str(row["id"]),
            "type": row["document_type"],
            "name": row["display_name"] or row["file_name"],
            "category": row["document_category"],
            "expiry_date": str(row["expiry_date"]),
            "days_remaining": days,
            "urgency": "critico" if days < 7 else "alto" if days < 30 else "medio" if days < 60 else "bajo",
            "action": f"Renovar {row['display_name'] or row['document_type']}",
        })

    critical = sum(1 for d in docs if d["urgency"] == "critico")
    return {
        "expiring_documents": docs,
        "count": len(docs),
        "critical_count": critical,
        "summary": f"{len(docs)} documentos expiran en los próximos {days_ahead} días"
            + (f" ({critical} urgentes)" if critical else ""),
    }


# ============================================================================
# 12. GET VAULT STATS
# ============================================================================

async def get_vault_stats(db, **kwargs) -> dict:
    """Get vault statistics and quota usage."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    stats = await db.fetchrow("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'active') as total_active,
            COUNT(*) FILTER (WHERE source = 'personal') as personal_count,
            COUNT(*) FILTER (WHERE source = 'wizard_import') as wizard_count,
            COUNT(*) FILTER (WHERE source = 'platform_generated') as generated_count,
            COALESCE(SUM(file_size_bytes) FILTER (WHERE source = 'personal' AND deleted_at IS NULL), 0) as quota_used_bytes,
            COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE AND status = 'active') as expired_count,
            COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' AND status = 'active') as expiring_count
        FROM user_documents
        WHERE user_id = $1::uuid AND deleted_at IS NULL
    """, user_id)

    quota_max = 100 * 1024 * 1024  # 100 Mo
    used = int(stats["quota_used_bytes"])
    pct = round(used / quota_max * 100, 1)

    return {
        "total_active": stats["total_active"],
        "personal": stats["personal_count"],
        "from_wizard": stats["wizard_count"],
        "generated": stats["generated_count"],
        "expired": stats["expired_count"],
        "expiring_soon": stats["expiring_count"],
        "quota_used_mb": round(used / 1024 / 1024, 1),
        "quota_max_mb": 100,
        "quota_percentage": pct,
        "summary": f"Cofre: {stats['total_active']} documentos, {round(used/1024/1024, 1)}/100 Mo"
            + (f" — {stats['expiring_count']} por vencer" if stats["expiring_count"] else ""),
    }


# ============================================================================
# 13. SUGGEST NEXT UPLOADS
# ============================================================================

async def suggest_next_uploads(db, **kwargs) -> dict:
    """Suggest documents to upload for maximum workflow readiness."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    rows = await db.fetch("""
        WITH popular_workflows AS (
            SELECT workflow_code, COUNT(*) as usage_count
            FROM service_requests
            WHERE user_id = $1::uuid AND workflow_code IS NOT NULL
            GROUP BY workflow_code
            ORDER BY usage_count DESC
            LIMIT 5
        ),
        needed_docs AS (
            SELECT pw.workflow_code, wdr.document_code, wdr.document_name_es
            FROM popular_workflows pw
            JOIN workflow_document_requirements wdr ON wdr.workflow_code = pw.workflow_code
            WHERE wdr.is_active = TRUE AND wdr.is_required = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM user_document_workflow_tags udwt
                  JOIN user_documents ud ON ud.id = udwt.user_document_id
                  WHERE udwt.workflow_code = pw.workflow_code
                    AND udwt.document_code = wdr.document_code
                    AND ud.user_id = $1::uuid
                    AND ud.status = 'active' AND ud.deleted_at IS NULL
              )
        )
        SELECT DISTINCT document_code, document_name_es,
               array_agg(DISTINCT workflow_code) as needed_for_workflows
        FROM needed_docs
        GROUP BY document_code, document_name_es
        ORDER BY array_length(array_agg(DISTINCT workflow_code), 1) DESC NULLS LAST
        LIMIT 5
    """, user_id)

    suggestions = [
        {
            "document_code": r["document_code"],
            "name": r["document_name_es"],
            "needed_for": r["needed_for_workflows"] or [],
            "priority": "alta" if len(r["needed_for_workflows"] or []) > 2 else "media",
        }
        for r in rows
    ]

    return {
        "suggestions": suggestions,
        "count": len(suggestions),
        "summary": f"{len(suggestions)} documentos recomendados para subir"
            + (f": {', '.join(s['name'] for s in suggestions[:3])}" if suggestions else "")
            if suggestions else "¡Su cofre está completo para sus trámites habituales!",
    }


# ============================================================================
# 14. PREPARE RENEWAL
# ============================================================================

async def prepare_renewal(db, **kwargs) -> dict:
    """[Level 1+] Prepare document renewal — requires user confirmation."""
    user_id = kwargs.get("user_id", "")
    document_id = kwargs.get("document_id", "")
    if not user_id or not document_id:
        return {"error": "Se requiere user_id y document_id"}

    doc = await db.fetchrow("""
        SELECT id, document_type, display_name, file_name, expiry_date,
               document_category, holder_name
        FROM user_documents
        WHERE id = $1::uuid AND user_id = $2::uuid AND deleted_at IS NULL
    """, document_id, user_id)

    if not doc:
        return {"error": "Documento no encontrado"}

    workflow_map = {
        "dip": "verificacion_funcionario",
        "dip_gq": "verificacion_funcionario",
        "pasaporte": "pasaporte_renovacion",
        "pasaporte_gq": "pasaporte_renovacion",
        "permiso_residencia": "residencia_renovacion",
        "licencia_conducir": "certificado_conducir_renovacion",
        "permiso_conducir": "certificado_conducir_renovacion",
        "carnet_funcionario": "carnet_funcionario",
    }
    doc_type_lower = (doc["document_type"] or "").lower().strip()
    workflow_code = kwargs.get("workflow_code") or workflow_map.get(doc_type_lower)

    if not workflow_code:
        return {
            "status": "no_workflow",
            "message": f"No hay un trámite de renovación automático para '{doc['document_type']}'. Consulte los servicios disponibles.",
        }

    readiness = await check_readiness(db, user_id=user_id, workflow_code=workflow_code)
    name = doc["display_name"] or doc["file_name"]
    expiry = str(doc["expiry_date"]) if doc["expiry_date"] else "sin fecha"

    return {
        "status": "prepared",
        "document_type": doc["document_type"],
        "document_name": name,
        "expiry_date": expiry,
        "workflow_code": workflow_code,
        "readiness": readiness,
        "can_start": readiness.get("can_start", False),
        "requires_confirmation": True,
        "message": (
            f"Renovación de '{name}' (expira: {expiry}). "
            f"Preparación: {readiness.get('readiness_score', 0)}%. "
            + ("¡Todo listo! ¿Confirma para iniciar el trámite?" if readiness.get("can_start") else
               f"Faltan documentos: {', '.join(m['name'] for m in readiness.get('missing', [])[:3])}")
        ),
    }


# ============================================================================
# 15. GET AGENT MEMORY — Transparence
# ============================================================================

async def get_agent_memory(db, **kwargs) -> dict:
    """[Transparency] Show what the assistant has learned about the user."""
    user_id = kwargs.get("user_id", "")
    if not user_id:
        return {"error": "Autenticación requerida"}

    memories = await db.fetch("""
        SELECT id, memory_type, content, confidence,
               confirmation_count, rejection_count,
               created_at, last_used_at
        FROM user_agent_memory
        WHERE user_id = $1::uuid AND is_active = TRUE
        ORDER BY confidence DESC, last_used_at DESC NULLS LAST
        LIMIT 20
    """, user_id)

    permissions = await db.fetch("""
        SELECT permission_type, scope, granted_at, usage_count, level
        FROM user_agent_permissions
        WHERE user_id = $1::uuid AND is_active = TRUE
    """, user_id)

    memory_list = [
        {
            "id": str(m["id"]),
            "type": m["memory_type"],
            "content": m["content"],
            "confidence": float(m["confidence"]),
            "confirmations": m["confirmation_count"],
            "rejections": m["rejection_count"],
        }
        for m in memories
    ]

    perm_list = [
        {
            "type": p["permission_type"],
            "scope": p["scope"],
            "level": p["level"],
            "usage_count": p["usage_count"],
        }
        for p in permissions
    ]

    return {
        "memories": memory_list,
        "permissions": perm_list,
        "memory_count": len(memory_list),
        "permission_count": len(perm_list),
        "summary": (
            f"El asistente ha aprendido {len(memory_list)} cosas sobre sus preferencias"
            + (f" y tiene {len(perm_list)} permisos activos." if perm_list else ".")
        ),
    }


# ============================================================================
# 16. AUTO PREPARE WIZARD — Level 2 Agent Orchestration
# ============================================================================

async def auto_prepare_wizard(db, **kwargs) -> dict:
    """
    [LEVEL 2] Auto-prepare a wizard session from vault documents.

    Creates a wizard session, loads documents from the user's digital vault,
    pre-fills form data, and returns a ready-to-finalize session URL.

    The user saves ~15 minutes by skipping document upload and form filling.
    """
    user_id = kwargs.get("user_id", "")
    workflow_name = kwargs.get("workflow_name", "")
    solicitud_type = kwargs.get("solicitud_type")
    motivo = kwargs.get("motivo")
    skip_missing = kwargs.get("skip_missing_docs", False)

    if not user_id:
        return {"error": "Autenticación requerida"}
    if not workflow_name:
        return {"error": "Indique el trámite que desea preparar (ej: pasaporte, residencia, licencia)"}

    from app.modules.user_documents.services.workflow_orchestrator_service import (
        workflow_orchestrator_service,
    )

    result = await workflow_orchestrator_service.prepare_wizard_from_vault(
        db=db,
        user_id=user_id,
        workflow_name=workflow_name,
        solicitud_type=solicitud_type,
        motivo=motivo,
        skip_missing_docs=skip_missing,
    )

    return result
