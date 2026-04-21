# API Reference

## Base URL

| Environment | Base URL |
|-------------|----------|
| Staging | `https://taxasge-backend-staging-392159428433.us-central1.run.app` |
| Local | `http://localhost:8000` |
| Swagger UI | `{BASE_URL}/docs` (staging/development only) |
| ReDoc | `{BASE_URL}/redoc` (staging/development only) |

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Auth Flow

```
1. POST /api/v1/auth/login        -->  { access_token, refresh_token }
2. Use access_token (30 min TTL)  -->  Authorization: Bearer <token>
3. POST /api/v1/auth/refresh      -->  { new_access_token }
4. POST /api/v1/auth/logout       -->  Revoke refresh_token
```

### Two-Factor Authentication (2FA)

```
1. POST /api/v1/auth/2fa/setup    -->  { secret, qr_code_url }
2. POST /api/v1/auth/2fa/verify   -->  { verified: true }
3. Login with 2FA:
   POST /api/v1/auth/login        -->  { requires_2fa: true, temp_token }
   POST /api/v1/auth/2fa/validate -->  { access_token, refresh_token }
```

## Registered API Routers

The backend registers 50+ routers in `main.py`. Below is the complete list grouped by domain.

### Authentication & Users

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `auth_router` | `/api/v1/auth` | authentication | Login, register, verify email, password reset |
| `two_factor_router` | `/api/v1/auth` | two-factor-authentication | 2FA setup, verify, validate |
| `user_routes` | `/api/v1/users` | users | User profile management (self-service) |

### Admin & Monitoring

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `admin_router` | `/api/v1/admin` | admin-diagnostics | System diagnostics, migrations, health |
| `user_management_router` | `/api/v1/admin/users` | admin-user-management | Admin CRUD for all users |
| `monitoring_router` | `/api/v1/admin/monitoring` | admin-monitoring | Real-time system monitoring |
| `audit_router` | `/api/v1/audit-logs` | audit-logs | Audit trail queries |
| `user_audit_router` | `/api/v1/users` | user-audit-logs | Per-user audit history |

### Fiscal Services & OMS

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `fiscal_service_router` | `/api/v1/fiscal-services` | fiscal-services | 873+ services catalog, search, categories |
| `bundle_router` | `/api/v1` | service-bundles | Zone-based bundle pricing |
| `config_rules_router` | `/api/v1` | config-rules | Specificity-based config engine |
| `license_router` | `/api/v1` | commercial-licenses | OMS commercial license management |
| `oms_agent_router` | `/api/v1` | oms-agent-processing | Post-payment agent processing queue |
| `bundle_workflow_router` | `/api/v1` | bundle-workflow | OMS citizen-facing bundle payments |
| `document_template_router` | `/api/v1/document-templates` | document-templates | Document template CRUD |
| `procedure_template_router` | `/api/v1/procedure-templates` | procedure-templates | Procedure template CRUD |

### Service Requests & Workflows

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `service_requests_router` | `/api/v1` | service-requests | Citizen CRUD for service requests |
| `service_requests_agent_router` | `/api/v1` | service-requests-agent | Agent review, decisions, queue |
| `service_requests_admin_router` | `/api/v1` | service-requests-admin | Admin workflow management |
| `wizard_session_router` | `/api/v1` | wizard-sessions | Cache-first wizard sessions |
| `appointment_router` | `/api/v1` | service-requests-appointments | Appointment slots, holds, confirmations |
| `cron_router` | `/api/v1/internal` | cron-jobs | Internal scheduled tasks |

### Assignments & Agents

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `assignment_router` | (self-prefixed) | assignments | Task assignment CRUD |
| `supervisor_router` | (self-prefixed) | supervisor | Supervisor dashboard, team management |
| `statistics_router` | (self-prefixed) | statistics | Analytics, performance metrics |
| `agent_profile_router` | `/api/v1/agents` | agent-profiles | Agent profile management |
| `analyst_router` | `/api/v1/agents` | analyst | AI-powered analyst (POST /agents/analyst/ask) |

### Declarations & Accountant

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `declaration_router` | `/api/v1/declarations` | declarations | Tax declarations (28 types) |
| `accountant_batch_router` | `/api/v1/accountant` | accountant-batch | Batch create, submit, reports |
| `accountant_router` | `/api/v1/accountant` | accountant-deadline-tracking | Deadline tracking across clients |

### Companies

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `company_router` | `/api/v1/companies` | companies | Business management, classification, dashboard |
| `company_public_router` | `/api/v1/public/companies` | public-directory | Public company directory (no auth) |

### Payments & Webhooks

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `payment_router` | `/api/v1/payments` | payments | BANGE mobile payments, receipts |
| `verify_router` | `/api/v1/verify` | verification | Receipt authenticity verification (public) |
| `webhook_router` | `/api/v1/webhooks` | webhooks | BANGE callbacks, reconciliation |

### Documents & OCR

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `document_routes` | `/api/v1/documents` | documents | Upload, OCR, extraction, validation |
| `user_documents_router` | `/api/v1/user-documents` | user-documents | Document vault, AI classification, alerts |
| `funcionario_router` | `/api/v1` | funcionario-verification | Civil servant identity verification |
| `verified_identifiers_router` | `/api/v1` | verified-identifiers | External document verification |

### Translations & i18n

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `entity_translation_router` | `/api/v1` | entity-translations | Ministry, sector, category translations |
| `frontend_translation_router` | `/api/v1` | frontend-translations | UI JSON sync |
| `translation_router` | `/api/v1` | translations | System translations (ENUMs, UI, Forms) |
| `enum_router` | `/api/v1` | enum-management | Add/modify/archive ENUM values |

### Communications & Support

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `communication_router` | `/api/v1` | communications | Email, SMS, Push notifications |
| `email_templates_router` | `/api/v1` | email-templates | Email template management |
| `push_templates_router` | `/api/v1` | push-templates | Push notification templates |
| `support_router` | `/api/v1` | support | Support ticketing system |

### AI & Chatbot

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `chatbot_router` | `/api/v1/chatbot` | chatbot | AI assistance, search, recommendations |
| `enrichment_router` | `/api/v1` | enrichment | Gemini auto-enrichment of service descriptions |

### Infrastructure

| Router | Prefix | Tags | Description |
|--------|--------|------|-------------|
| `homepage_router` | `/api/v1/homepage` | homepage | Homepage statistics, category directory |
| `entity_locations_router` | `/api/v1` | entity-locations | Entity office locations |
| `cities_router` | `/api/v1` | cities | Cities and entities management |
| `menu_config_router` | `/api/v1` | menu-configuration | Dynamic agent menu configuration |
| `batch_requests_router` | `/api/v1` | batch-requests | Bulk service request submission |
| `inspections_router` | `/api/v1` | field-inspections | Field inspection CRUD (44 endpoints) |
| `ws_router` | `/ws/admin` | websocket | Real-time admin WebSocket |

## Common Response Format

### Success

```json
{
  "data": { ... },
  "message": "Operation successful",
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

### Error

```json
{
  "detail": "Translated error message",
  "error_code": "ERR_INVALID_CREDENTIALS"
}
```

### Validation Error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error"
    }
  ],
  "error_code": "VALIDATION_ERROR"
}
```

## Rate Limiting

- 1000 requests/hour per authenticated user
- Rate limiting via Upstash Redis (`check_rate_limit()`)
- Chatbot endpoints have stricter limits

## Language Detection

The API auto-detects language from the `Accept-Language` header:

```
Accept-Language: es  -->  Spanish responses
Accept-Language: fr  -->  French responses
Accept-Language: en  -->  English responses
```

Error messages are automatically translated based on this header.
