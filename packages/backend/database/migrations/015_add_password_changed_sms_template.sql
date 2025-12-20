-- Migration: Add Password Changed SMS Template
-- Date: 2025-12-20
-- Description: Add SMS template for password change security notification

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
