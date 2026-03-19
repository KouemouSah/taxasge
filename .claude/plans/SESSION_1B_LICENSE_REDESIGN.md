# License PDF Redesign — 4 Phases

## Source: Documentations/workflow/empresa/classification/license0.png

## Phase 1: Template HTML/CSS (layout 1 page) ✅
- Compact margins (1cm/1.2cm), reduced font sizes (7.5-8pt)
- Company info in 2-column grid (was 1 column)
- Obligations grouped by ministry (sub-lines instead of repeating)
- Badge PAGADO/PENDIENTE/VENCIDO at bottom as validation seal
- Compliance score as progress bar next to seal
- Page numbering via xhtml2pdf `<pdf:pagenumber>/<pdf:pagecount>`

## Phase 2: Logique conditionnelle ✅
- `is_bundle_regime`: bundle/commerce_type shown only if `regimen_fiscal = 'bundle'` AND `commerce_type` exists
- `is_fully_paid`: hides "Fecha límite" / "Due date" column when balance = 0
- Penalty column: always visible, "--" when inactive, red when active
- Obligations sorted by ministry name (NULLS LAST), then fee_type, then due_date
- `has_any_penalty`: totals row only shown if any obligation has penalty > 0

## Phase 3: QR Code Verification ✅
- **Secret key fix**: uses `_get_verification_secret()` (RECEIPT_VERIFICATION_SECRET/JWT_SECRET_KEY) instead of ephemeral `settings.secret_key`
- **Backend endpoint**: `GET /api/v1/verify/license/{license_ref}?t={token}&lid={uuid}` in verify_routes.py
- **Static method**: `verify_license_token()` on LicensePDFService for HMAC comparison
- **Frontend**: verify page handles `LIC-*` prefix → calls license endpoint → renders company details, amounts, obligations, compliance bar
- **URL format**: `/verify/LIC-{year}-{id8}?t={hmac16}&lid={uuid}`

## Phase 4: Email + SMS Notification ✅
- **Migration 220**: `LICENSE_GENERATED` email template (es/fr/en) with variables (license_ref, company_name, nif, fiscal_year, total_amount, status)
- **Migration 220**: `LICENSE_GENERATED` SMS template (es/fr/en) — short format for 160 chars
- **Pattern**: email with PDF attachment via `context["attachments"]` → CommunicationService pipeline

## Files Modified

### Backend (3 files + 1 migration)
| File | Change |
|------|--------|
| `fiscal_services/services/license_pdf_service.py` | Complete rewrite: grouped obligations, conditional logic, permanent HMAC secret |
| `fiscal_services/templates/license_dossier_pdf.html` | Complete rewrite: compact 1-page layout, ministry groups, seal section |
| `payments/api/verify_routes.py` | +LicenseVerificationResponse + verify_license endpoint |
| `database/migrations/220_license_notification_templates.sql` | Email + SMS templates |

### Frontend (1 file)
| File | Change |
|------|--------|
| `verify/[receiptNumber]/page.tsx` | +LicenseResult type, +isLicense routing, +license result rendering |
