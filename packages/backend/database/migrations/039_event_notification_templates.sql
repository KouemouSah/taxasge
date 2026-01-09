-- Migration: Event-Based Notification Templates
-- Date: 2026-01-09
-- Description: Seed notification templates for EventBus events (payment, request, appointment)

-- =============================================================================
-- EMAIL TEMPLATES
-- =============================================================================

-- Payment Completed
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'payment_completed',
    'Pago completado',
    'Paiement effectué',
    'Payment completed',
    'Pago completado - TaxasGE',
    'Paiement effectué - TaxasGE',
    'Payment completed - TaxasGE',
    'Notificación enviada cuando un pago se completa exitosamente',
    'templates/payment_completed.html',
    '["user_name", "amount", "currency", "receipt_number", "payment_method"]',
    'payment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Payment Cash Pending
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'payment_cash_pending',
    'Pago en efectivo pendiente',
    'Paiement en espèces en attente',
    'Cash payment pending',
    'Pago en efectivo pendiente de validación - TaxasGE',
    'Paiement en espèces en attente de validation - TaxasGE',
    'Cash payment pending validation - TaxasGE',
    'Notificación enviada cuando un pago en efectivo está pendiente de validación',
    'templates/payment_cash_pending.html',
    '["user_name", "amount", "currency"]',
    'payment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Payment Cash Validated
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'payment_cash_validated',
    'Pago en efectivo validado',
    'Paiement en espèces validé',
    'Cash payment validated',
    'Pago en efectivo validado - TaxasGE',
    'Paiement en espèces validé - TaxasGE',
    'Cash payment validated - TaxasGE',
    'Notificación enviada cuando un pago en efectivo es validado por el agente',
    'templates/payment_cash_validated.html',
    '["user_name", "amount", "currency", "receipt_number"]',
    'payment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Payment Cash Rejected
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'payment_cash_rejected',
    'Pago en efectivo rechazado',
    'Paiement en espèces refusé',
    'Cash payment rejected',
    'Pago en efectivo rechazado - TaxasGE',
    'Paiement en espèces refusé - TaxasGE',
    'Cash payment rejected - TaxasGE',
    'Notificación enviada cuando un pago en efectivo es rechazado',
    'templates/payment_cash_rejected.html',
    '["user_name", "amount", "currency", "reason"]',
    'payment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Submitted
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'request_submitted',
    'Solicitud recibida',
    'Demande reçue',
    'Request received',
    'Solicitud recibida - TaxasGE',
    'Demande reçue - TaxasGE',
    'Request received - TaxasGE',
    'Notificación enviada cuando una solicitud es creada',
    'templates/request_submitted.html',
    '["user_name", "workflow_code", "service_code"]',
    'request',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Approved
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'request_approved',
    'Solicitud aprobada',
    'Demande approuvée',
    'Request approved',
    'Solicitud aprobada - TaxasGE',
    'Demande approuvée - TaxasGE',
    'Request approved - TaxasGE',
    'Notificación enviada cuando una solicitud es aprobada por el agente',
    'templates/request_approved.html',
    '["user_name", "workflow_code", "appointment_date", "appointment_time", "location"]',
    'request',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Rejected
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'request_rejected',
    'Solicitud rechazada',
    'Demande refusée',
    'Request rejected',
    'Solicitud rechazada - TaxasGE',
    'Demande refusée - TaxasGE',
    'Request rejected - TaxasGE',
    'Notificación enviada cuando una solicitud es rechazada',
    'templates/request_rejected.html',
    '["user_name", "workflow_code", "reason"]',
    'request',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Completed
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'request_completed',
    'Solicitud completada',
    'Demande terminée',
    'Request completed',
    'Solicitud completada - TaxasGE',
    'Demande terminée - TaxasGE',
    'Request completed - TaxasGE',
    'Notificación enviada cuando una solicitud se completa exitosamente',
    'templates/request_completed.html',
    '["user_name", "workflow_code"]',
    'request',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Booked
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'appointment_booked',
    'Cita confirmada',
    'Rendez-vous confirmé',
    'Appointment confirmed',
    'Cita confirmada - TaxasGE',
    'Rendez-vous confirmé - TaxasGE',
    'Appointment confirmed - TaxasGE',
    'Notificación enviada cuando una cita es confirmada',
    'templates/appointment_booked.html',
    '["user_name", "appointment_date", "appointment_time", "location"]',
    'appointment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Reminder
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'appointment_reminder',
    'Recordatorio de cita',
    'Rappel de rendez-vous',
    'Appointment reminder',
    'Recordatorio de cita - TaxasGE',
    'Rappel de rendez-vous - TaxasGE',
    'Appointment reminder - TaxasGE',
    'Recordatorio de cita programada',
    'templates/appointment_reminder.html',
    '["user_name", "appointment_date", "appointment_time", "location"]',
    'appointment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Cancelled
INSERT INTO email_templates (template_code, name_es, name_fr, name_en, subject_es, subject_fr, subject_en, description_es, html_file_path, variables, category, is_active)
VALUES (
    'appointment_cancelled',
    'Cita cancelada',
    'Rendez-vous annulé',
    'Appointment cancelled',
    'Cita cancelada - TaxasGE',
    'Rendez-vous annulé - TaxasGE',
    'Appointment cancelled - TaxasGE',
    'Notificación de cancelación de cita',
    'templates/appointment_cancelled.html',
    '["user_name", "appointment_date", "appointment_time", "reason"]',
    'appointment',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- =============================================================================
-- SMS TEMPLATES
-- =============================================================================

-- Payment Completed SMS
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en, content_es, content_fr, content_en, variables, category, max_segments, is_active)
VALUES (
    'payment_completed',
    'Pago completado',
    'Paiement effectué',
    'Payment completed',
    'TaxasGE: Su pago de {amount} {currency} ha sido procesado. Recibo: {receipt_number}',
    'TaxasGE: Votre paiement de {amount} {currency} a été traité. Reçu: {receipt_number}',
    'TaxasGE: Your payment of {amount} {currency} has been processed. Receipt: {receipt_number}',
    '["amount", "currency", "receipt_number"]',
    'payment',
    1,
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Payment Cash Validated SMS
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en, content_es, content_fr, content_en, variables, category, max_segments, is_active)
VALUES (
    'payment_cash_validated',
    'Pago en efectivo validado',
    'Paiement en espèces validé',
    'Cash payment validated',
    'TaxasGE: Su pago en efectivo de {amount} {currency} ha sido validado. Recibo: {receipt_number}',
    'TaxasGE: Votre paiement en espèces de {amount} {currency} a été validé. Reçu: {receipt_number}',
    'TaxasGE: Your cash payment of {amount} {currency} has been validated. Receipt: {receipt_number}',
    '["amount", "currency", "receipt_number"]',
    'payment',
    1,
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Approved SMS
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en, content_es, content_fr, content_en, variables, category, max_segments, is_active)
VALUES (
    'request_approved',
    'Solicitud aprobada',
    'Demande approuvée',
    'Request approved',
    'TaxasGE: Su solicitud ha sido aprobada. Cita: {appointment_date} {appointment_time} en {location}',
    'TaxasGE: Votre demande a été approuvée. RDV: {appointment_date} {appointment_time} à {location}',
    'TaxasGE: Your request has been approved. Appointment: {appointment_date} {appointment_time} at {location}',
    '["appointment_date", "appointment_time", "location"]',
    'request',
    1,
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Rejected SMS
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en, content_es, content_fr, content_en, variables, category, max_segments, is_active)
VALUES (
    'request_rejected',
    'Solicitud rechazada',
    'Demande refusée',
    'Request rejected',
    'TaxasGE: Su solicitud ha sido rechazada. Motivo: {reason}. Consulte su cuenta para más detalles.',
    'TaxasGE: Votre demande a été refusée. Raison: {reason}. Consultez votre compte pour plus de détails.',
    'TaxasGE: Your request has been rejected. Reason: {reason}. Check your account for more details.',
    '["reason"]',
    'request',
    2,
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Booked SMS
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en, content_es, content_fr, content_en, variables, category, max_segments, is_active)
VALUES (
    'appointment_booked',
    'Cita confirmada',
    'Rendez-vous confirmé',
    'Appointment confirmed',
    'TaxasGE: Cita confirmada para {appointment_date} a las {appointment_time} en {location}',
    'TaxasGE: Rendez-vous confirmé pour le {appointment_date} à {appointment_time} à {location}',
    'TaxasGE: Appointment confirmed for {appointment_date} at {appointment_time} at {location}',
    '["appointment_date", "appointment_time", "location"]',
    'appointment',
    1,
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Reminder SMS
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en, content_es, content_fr, content_en, variables, category, max_segments, is_active)
VALUES (
    'appointment_reminder',
    'Recordatorio de cita',
    'Rappel de rendez-vous',
    'Appointment reminder',
    'TaxasGE: Recordatorio - Cita mañana {appointment_date} a las {appointment_time} en {location}',
    'TaxasGE: Rappel - Rendez-vous demain {appointment_date} à {appointment_time} à {location}',
    'TaxasGE: Reminder - Appointment tomorrow {appointment_date} at {appointment_time} at {location}',
    '["appointment_date", "appointment_time", "location"]',
    'appointment',
    1,
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- =============================================================================
-- NOTIFICATION TEMPLATES (In-app)
-- Schema: template_code, name_*, title_*, body_*, icon, action_url, variables, notification_type, priority, is_active
-- =============================================================================

-- Payment Completed Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'payment_completed',
    'Pago completado',
    'Paiement effectué',
    'Payment completed',
    'Pago completado',
    'Paiement effectué',
    'Payment completed',
    'Su pago de {amount} {currency} ha sido procesado exitosamente. Número de recibo: {receipt_number}',
    'Votre paiement de {amount} {currency} a été traité avec succès. Numéro de reçu: {receipt_number}',
    'Your payment of {amount} {currency} has been processed successfully. Receipt number: {receipt_number}',
    'check-circle',
    '/payments/{payment_id}',
    '["amount", "currency", "receipt_number", "payment_id"]',
    'payment',
    'high',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Submitted Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'request_submitted',
    'Solicitud recibida',
    'Demande reçue',
    'Request received',
    'Solicitud recibida',
    'Demande reçue',
    'Request received',
    'Su solicitud ha sido recibida y está siendo procesada.',
    'Votre demande a été reçue et est en cours de traitement.',
    'Your request has been received and is being processed.',
    'file-text',
    '/requests/{request_id}',
    '["request_id"]',
    'request',
    'normal',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Approved Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'request_approved',
    'Solicitud aprobada',
    'Demande approuvée',
    'Request approved',
    'Solicitud aprobada',
    'Demande approuvée',
    'Request approved',
    'Su solicitud ha sido aprobada. Consulte los detalles de su cita.',
    'Votre demande a été approuvée. Consultez les détails de votre rendez-vous.',
    'Your request has been approved. Check your appointment details.',
    'check',
    '/requests/{request_id}',
    '["request_id"]',
    'request',
    'high',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Rejected Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'request_rejected',
    'Solicitud rechazada',
    'Demande refusée',
    'Request rejected',
    'Solicitud rechazada',
    'Demande refusée',
    'Request rejected',
    'Su solicitud ha sido rechazada. Motivo: {reason}',
    'Votre demande a été refusée. Raison: {reason}',
    'Your request has been rejected. Reason: {reason}',
    'x-circle',
    '/requests/{request_id}',
    '["request_id", "reason"]',
    'request',
    'high',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Booked Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'appointment_booked',
    'Cita confirmada',
    'Rendez-vous confirmé',
    'Appointment confirmed',
    'Cita confirmada',
    'Rendez-vous confirmé',
    'Appointment confirmed',
    'Su cita ha sido confirmada para el {appointment_date} a las {appointment_time} en {location}.',
    'Votre rendez-vous a été confirmé pour le {appointment_date} à {appointment_time} à {location}.',
    'Your appointment has been confirmed for {appointment_date} at {appointment_time} at {location}.',
    'calendar-check',
    '/appointments/{request_id}',
    '["request_id", "appointment_date", "appointment_time", "location"]',
    'appointment',
    'high',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Document Validated Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'document_validated',
    'Documento validado',
    'Document validé',
    'Document validated',
    'Documento validado',
    'Document validé',
    'Document validated',
    'Su documento ha sido validado correctamente.',
    'Votre document a été validé avec succès.',
    'Your document has been validated successfully.',
    'file-check',
    '/requests/{request_id}/documents',
    '["request_id"]',
    'document',
    'normal',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Document Rejected Notification
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon, action_url, variables, notification_type, priority, is_active)
VALUES (
    'document_rejected',
    'Documento rechazado',
    'Document refusé',
    'Document rejected',
    'Documento rechazado',
    'Document refusé',
    'Document rejected',
    'Su documento ha sido rechazado. Por favor, suba un nuevo documento.',
    'Votre document a été refusé. Veuillez télécharger un nouveau document.',
    'Your document has been rejected. Please upload a new document.',
    'file-x',
    '/requests/{request_id}/documents',
    '["request_id"]',
    'document',
    'high',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- =============================================================================
-- PUSH TEMPLATES
-- Schema: template_code, name_*, title_*, body_*, image_url, icon_url, click_action, data_payload, variables, platform, ttl_seconds, is_active
-- =============================================================================

-- Payment Completed Push
INSERT INTO push_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon_url, click_action, variables, platform, is_active)
VALUES (
    'payment_completed',
    'Pago completado',
    'Paiement effectué',
    'Payment completed',
    'Pago completado',
    'Paiement effectué',
    'Payment completed',
    'Su pago ha sido procesado exitosamente.',
    'Votre paiement a été traité avec succès.',
    'Your payment has been processed successfully.',
    '/icons/payment_success.png',
    '/payments',
    '["payment_id"]',
    'all',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Request Approved Push
INSERT INTO push_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon_url, click_action, variables, platform, is_active)
VALUES (
    'request_approved',
    'Solicitud aprobada',
    'Demande approuvée',
    'Request approved',
    'Solicitud aprobada',
    'Demande approuvée',
    'Request approved',
    'Su solicitud ha sido aprobada.',
    'Votre demande a été approuvée.',
    'Your request has been approved.',
    '/icons/request_approved.png',
    '/requests',
    '["request_id"]',
    'all',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Reminder Push
INSERT INTO push_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon_url, click_action, variables, platform, is_active)
VALUES (
    'appointment_reminder',
    'Recordatorio de cita',
    'Rappel de rendez-vous',
    'Appointment reminder',
    'Recordatorio de cita',
    'Rappel de rendez-vous',
    'Appointment reminder',
    'Tiene una cita programada para mañana.',
    'Vous avez un rendez-vous prévu pour demain.',
    'You have an appointment scheduled for tomorrow.',
    '/icons/calendar_reminder.png',
    '/appointments',
    '["request_id", "appointment_date"]',
    'all',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();

-- Appointment Booked Push
INSERT INTO push_templates (template_code, name_es, name_fr, name_en, title_es, title_fr, title_en, body_es, body_fr, body_en, icon_url, click_action, variables, platform, is_active)
VALUES (
    'appointment_booked',
    'Cita confirmada',
    'Rendez-vous confirmé',
    'Appointment confirmed',
    'Cita confirmada',
    'Rendez-vous confirmé',
    'Appointment confirmed',
    'Su cita ha sido confirmada.',
    'Votre rendez-vous a été confirmé.',
    'Your appointment has been confirmed.',
    '/icons/calendar_check.png',
    '/appointments',
    '["request_id"]',
    'all',
    true
) ON CONFLICT (template_code) DO UPDATE SET updated_at = NOW();
