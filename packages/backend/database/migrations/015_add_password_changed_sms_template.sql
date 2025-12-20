-- Migration: Add Password Changed SMS and Email Templates
-- Date: 2025-12-20
-- Description: Add templates for password change security notifications (SMS + Email)

-- =============================================================================
-- SMS TEMPLATE - Security: Password Changed
-- =============================================================================

INSERT INTO sms_templates (
    template_code, name_es, name_fr, name_en,
    content_es, content_fr, content_en,
    category, max_segments, variables, is_active
) VALUES
(
    'SECURITY_PASSWORD_CHANGED',
    'Contraseña Modificada',
    'Mot de Passe Modifié',
    'Password Changed',
    'TaxasGE SEGURIDAD: Tu contraseña fue cambiada el {{date}} a las {{time}}. Si no fuiste tu, contacta soporte: +240222000000',
    'TaxasGE SECURITE: Votre mot de passe a ete modifie le {{date}} a {{time}}. Si ce n''etait pas vous, contactez le support: +240222000000',
    'TaxasGE SECURITY: Your password was changed on {{date}} at {{time}}. If this wasn''t you, contact support: +240222000000',
    'alerts',
    1,
    '["date", "time"]'::jsonb,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name_es = EXCLUDED.name_es,
    name_fr = EXCLUDED.name_fr,
    name_en = EXCLUDED.name_en,
    content_es = EXCLUDED.content_es,
    content_fr = EXCLUDED.content_fr,
    content_en = EXCLUDED.content_en,
    updated_at = NOW();

-- =============================================================================
-- EMAIL TEMPLATE - Security: Password Changed
-- =============================================================================

INSERT INTO email_templates (
    template_code,
    name_es, name_fr, name_en,
    subject_es, subject_fr, subject_en,
    description_es, description_fr, description_en,
    html_file_path,
    variables,
    category,
    is_active
) VALUES
(
    'SECURITY_PASSWORD_CHANGED',
    'Alerta de Seguridad - Contraseña Modificada',
    'Alerte de Sécurité - Mot de Passe Modifié',
    'Security Alert - Password Changed',
    'TaxasGE - Alerta de Seguridad: Tu contraseña fue modificada',
    'TaxasGE - Alerte de Sécurité: Votre mot de passe a été modifié',
    'TaxasGE - Security Alert: Your password was changed',
    'Notificación enviada cuando el usuario cambia su contraseña',
    'Notification envoyée lorsque l''utilisateur change son mot de passe',
    'Notification sent when the user changes their password',
    'templates/emails/SECURITY_PASSWORD_CHANGED.html',
    '[
        {"name": "user_name", "description": "Nombre del usuario", "example": "John Doe", "required": true},
        {"name": "date", "description": "Fecha del cambio", "example": "20/12/2025", "required": true},
        {"name": "time", "description": "Hora del cambio", "example": "15:30", "required": true}
    ]'::jsonb,
    'security',
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name_es = EXCLUDED.name_es,
    name_fr = EXCLUDED.name_fr,
    name_en = EXCLUDED.name_en,
    subject_es = EXCLUDED.subject_es,
    subject_fr = EXCLUDED.subject_fr,
    subject_en = EXCLUDED.subject_en,
    description_es = EXCLUDED.description_es,
    description_fr = EXCLUDED.description_fr,
    description_en = EXCLUDED.description_en,
    variables = EXCLUDED.variables,
    updated_at = NOW();
