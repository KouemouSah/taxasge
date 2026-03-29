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
