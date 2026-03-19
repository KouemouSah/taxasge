-- Migration 220: License notification templates (email + SMS)
-- Adds LICENSE_GENERATED email template and SMS template for license issuance notifications.
-- Part of Session 1B — License PDF Redesign Phase 4.

BEGIN;

-- ── Email template: LICENSE_GENERATED ────────────────────────────────────────

INSERT INTO email_templates (
    id, template_code,
    subject_es, subject_fr, subject_en,
    body_es, body_fr, body_en,
    description, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'LICENSE_GENERATED',
    'Su licencia comercial {{license_ref}} está disponible',
    'Votre licence commerciale {{license_ref}} est disponible',
    'Your commercial license {{license_ref}} is available',
    -- ES body
    '<h2>Licencia Comercial Generada</h2>
<p>Estimado/a <strong>{{company_name}}</strong>,</p>
<p>Su licencia comercial para el año fiscal <strong>{{fiscal_year}}</strong> ha sido generada correctamente.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Referencia</td><td style="padding:6px 12px;">{{license_ref}}</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">NIF</td><td style="padding:6px 12px;">{{nif}}</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Total Obligaciones</td><td style="padding:6px 12px;">{{total_amount}} XAF</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Estado</td><td style="padding:6px 12px;">{{status}}</td></tr>
</table>
<p>Encontrará el documento PDF adjunto a este correo. También puede descargarlo desde su panel en la plataforma Facil.</p>
<p>Atentamente,<br>Dirección General de Impuestos — Guinea Ecuatorial</p>',
    -- FR body
    '<h2>Licence Commerciale Générée</h2>
<p>Cher/Chère <strong>{{company_name}}</strong>,</p>
<p>Votre licence commerciale pour l''année fiscale <strong>{{fiscal_year}}</strong> a été générée avec succès.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Référence</td><td style="padding:6px 12px;">{{license_ref}}</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">NIF</td><td style="padding:6px 12px;">{{nif}}</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Total Obligations</td><td style="padding:6px 12px;">{{total_amount}} XAF</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Statut</td><td style="padding:6px 12px;">{{status}}</td></tr>
</table>
<p>Vous trouverez le document PDF en pièce jointe. Vous pouvez également le télécharger depuis votre espace sur la plateforme Facil.</p>
<p>Cordialement,<br>Direction Générale des Impôts — Guinée Équatoriale</p>',
    -- EN body
    '<h2>Commercial License Generated</h2>
<p>Dear <strong>{{company_name}}</strong>,</p>
<p>Your commercial license for fiscal year <strong>{{fiscal_year}}</strong> has been successfully generated.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Reference</td><td style="padding:6px 12px;">{{license_ref}}</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">NIF</td><td style="padding:6px 12px;">{{nif}}</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Total Obligations</td><td style="padding:6px 12px;">{{total_amount}} XAF</td></tr>
  <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">Status</td><td style="padding:6px 12px;">{{status}}</td></tr>
</table>
<p>The PDF document is attached to this email. You can also download it from your dashboard on the Facil platform.</p>
<p>Best regards,<br>General Directorate of Taxes — Equatorial Guinea</p>',
    'Email sent when a commercial license is generated, with PDF attachment',
    true,
    NOW(), NOW()
)
ON CONFLICT (template_code) DO NOTHING;


-- ── SMS template: LICENSE_GENERATED ──────────────────────────────────────────

INSERT INTO sms_templates (
    id, template_code,
    content_es, content_fr, content_en,
    description, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'LICENSE_GENERATED',
    'FACIL: Su licencia comercial {{license_ref}} esta disponible en su panel. Total: {{total_amount}} XAF. Descargue el PDF desde facil.gq',
    'FACIL: Votre licence commerciale {{license_ref}} est disponible. Total: {{total_amount}} XAF. Telechargez le PDF sur facil.gq',
    'FACIL: Your commercial license {{license_ref}} is available. Total: {{total_amount}} XAF. Download the PDF at facil.gq',
    'SMS sent when a commercial license is generated',
    true,
    NOW(), NOW()
)
ON CONFLICT (template_code) DO NOTHING;

COMMIT;
