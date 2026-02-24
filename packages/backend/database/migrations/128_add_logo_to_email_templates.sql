-- Migration 128: Add logo image to all email templates
-- Date: 2026-02-24
-- Description:
--   Adds the Facil logo image above the colored header in all email templates.
--   The logo sits on a white background bar, above the colored gradient header.
--   Uses a single REPLACE since all templates share the same HTML structure.
--   Logo URL: Frontend public folder (Firebase Hosting)

BEGIN;

-- Add logo bar above the colored header in ALL email templates
-- Pattern: <div class="container"><div class="header">
-- Becomes: <div class="container"><div style="logo bar"><img></div><div class="header">
UPDATE email_templates SET
    html_content = REPLACE(
        html_content,
        '<div class="container"><div class="header">',
        '<div class="container"><div style="background:#ffffff;padding:20px 20px 10px;text-align:center;border-bottom:1px solid #e5e7eb"><img src="https://taxasge.emacsah.com/logo.png" alt="Facil" width="160" style="display:block;margin:0 auto;max-width:160px"></div><div class="header">'
    ),
    updated_at = NOW()
WHERE html_content LIKE '%<div class="container"><div class="header">%'
  AND html_content NOT LIKE '%taxasge.emacsah.com/logo.png%';  -- Idempotent: skip if already has logo

COMMIT;
