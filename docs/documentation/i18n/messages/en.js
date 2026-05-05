window.__I18N__ = window.__I18N__ || {};
window.__I18N__.en =
{
  "common": {
    "sidebar": {
      "subtitle": "Technical Reference",
      "toggle_label": "Toggle navigation",
      "footer": "Facil v1.1.8 · Updated May 2026",
      "section": {
        "getting_started": "Getting Started",
        "architecture": "Architecture",
        "reference": "Reference",
        "features": "Features",
        "observability": "Observability",
        "operations": "Operations"
      },
      "link": {
        "home": "Home",
        "architecture": "System Architecture",
        "database": "Database Schema",
        "workflows": "Workflow Engine",
        "api_reference": "API Reference",
        "modules": "Module Catalog",
        "agents": "AI & Intelligence",
        "payments": "Payments",
        "grafana": "Grafana Dashboards",
        "ai_obs": "AI Observability",
        "logrocket": "LogRocket Observability",
        "security": "Security",
        "deployment": "Deployment",
        "i18n": "Internationalization"
      }
    },
    "breadcrumb": {
      "docs": "Docs"
    },
    "toc": {
      "title": "On This Page"
    },
    "footer": {
      "copyright": "Facil Platform v1.1.8 · © 2026 Sah Kouemou",
      "link": {
        "api": "API"
      }
    }
  },

  "modules": {
    "html_title": "Module Catalog - Facil Documentation",
    "title": "Module Catalog",
    "description": "Complete inventory of all 30 backend modules and 41+ frontend modules, organized by domain. Each module follows a standard internal structure (API/service/repository for backend; components/hooks/services/types for frontend).",
    "toc": {
      "backend": "Backend Modules (30)",
      "frontend": "Frontend Modules (41+)",
      "core": "Core & Identity",
      "services": "Services & Workflows",
      "financial": "Financial",
      "agents": "Agent Operations",
      "intelligence": "Intelligence",
      "platform": "Platform"
    },
    "backend": {
      "intro": "Located in <code>packages/backend/app/modules/</code>. Each module is a Python package with sub-packages for API routes, models, repositories, and services."
    },
    "frontend": {
      "intro": "Located in <code>packages/web/src/modules/</code>. Each module contains components, hooks, services, and types."
    },
    "table": {
      "module": "Module",
      "purpose": "Purpose",
      "endpoints": "Key Endpoints",
      "tables": "Tables",
      "domain": "Domain"
    },
    "row": {
      "auth": { "purpose": "Authentication: login, register, JWT, 2FA, password reset", "endpoints_count": "9 endpoints" },
      "users": { "purpose": "User profile management, avatar upload" },
      "permissions": { "purpose": "RBAC: roles, permissions, user overrides, auto-sync" },
      "companies": { "purpose": "Company management, member roles, classification, public directory", "routers_count": "5 routers" },
      "funcionario": { "purpose": "Civil servant verification", "tables_note": "civil servant fields" },
      "fiscal_services": { "purpose": "873 fiscal services catalog, bundles, templates, config rules, licenses, OMS", "routers_count": "7 routers" },
      "service_requests": { "purpose": "Service request lifecycle, wizard sessions, appointments, agent processing, admin views", "routers_count": "6 routers" },
      "declarations": { "purpose": "Tax declarations (34 types), batch operations" },
      "documents": { "purpose": "Document upload/download, OCR processing queue" },
      "user_documents": { "purpose": "User document vault" },
      "batch_requests": { "purpose": "Bulk service request operations" },
      "verified_identifiers": { "purpose": "External document verification" },
      "inspections": { "purpose": "Field inspections: missions, analytics, collection, export", "routers_count": "4 routers, 44+ endpoints" },
      "payments": { "purpose": "Payment processing, BANGE integration, verification" },
      "treasury": { "purpose": "Treasury agent dashboard, revenue tracking, reconciliation", "endpoints": "Treasury-scoped endpoints" },
      "accountant": { "purpose": "Accountant tools: deadline tracking, batch declarations" },
      "webhooks": { "purpose": "BANGE payment webhooks, external system callbacks" },
      "agents": { "purpose": "Agent profiles, analyst tools" },
      "assignment": { "purpose": "Task assignment, supervisor views, statistics" },
      "admin": { "purpose": "Admin diagnostics, user management, monitoring, audit logs" },
      "menu_config": { "purpose": "Dynamic agent menu configuration (workflow-based + module-based)" },
      "chatbot": { "purpose": "RAG chatbot with Gemini 2.5 Flash, 35 tools, 5 agent roles" },
      "enrichment": { "purpose": "AI-powered service description enrichment (600 char, 3 paragraphs)", "tables_note": "descriptions" },
      "communications": { "purpose": "Email, SMS, push, USSD, WhatsApp templates and sending", "routers_count": "6 routers" },
      "translations": { "purpose": "Trilingual translations, entity translations, enum management, frontend keys", "routers_count": "4 routers" },
      "support": { "purpose": "Support ticket system" },
      "homepage": { "purpose": "Public homepage stats and data", "tables": "homepage_stats view" },
      "cities": { "purpose": "City/location management" },
      "entity_locations": { "purpose": "Entity physical location management" },
      "shared": { "purpose": "Shared utilities and base classes" }
    },
    "fe": {
      "domain": {
        "core": "Core",
        "public": "Public",
        "services": "Services",
        "financial": "Financial",
        "business": "Business",
        "intelligence": "Intelligence",
        "agent_ops": "Agent Ops",
        "admin": "Admin",
        "platform": "Platform"
      },
      "row": {
        "auth": "Login, register, password reset forms",
        "users": "User profile display and editing",
        "dashboard": "Main dashboard layout and widgets",
        "homepage": "Hero section, features, stats",
        "fiscal_services": "Service catalog, search, filtering",
        "service_requests": "Request list, detail, wizard flow",
        "declarations": "Declaration forms, cards, batch operations",
        "payments": "Payment cards, processing UI",
        "documents": "Document upload, preview, management",
        "user_documents": "User document vault",
        "companies": "Company management, member list, invites",
        "accountant": "Deadline calendar, task queue",
        "chatbot": "Chat UI, settings, suggestions, error boundary",
        "agents": "Agent components and tools",
        "agent_dashboard": "Agent-specific dashboard views",
        "assignment": "Assignment management components",
        "assignments_admin": "Assignment administration",
        "bundle_workflow": "Bundle payment multi-entity UI",
        "inspections": "Field inspection management",
        "oms": "Order Management System views",
        "treasury": "Treasury agent dashboard",
        "permissions": "Permission display components",
        "permissions_admin": "Role selector, permission badges",
        "user_permissions_admin": "Per-user permission overrides",
        "roles_admin": "Role management, permission dialogs",
        "users_admin": "User management admin panel",
        "agents_admin": "Agent profile administration",
        "audit_logs_admin": "Audit log viewer with filters",
        "admin": "Admin header, backend alert, core admin components",
        "service_requests_admin": "Admin views for service requests",
        "batch_requests": "Bulk request operations",
        "support": "Support ticket UI",
        "communications": "Communication management",
        "translations": "Translation management UI",
        "enrichment": "AI enrichment management",
        "templates": "Document and procedure template management",
        "webhooks": "Webhook configuration",
        "cities": "City management",
        "entity_locations": "Entity location management",
        "verified_identifiers": "Verified identifier management",
        "funcionario": "Civil servant verification"
      }
    }
  },

  "deployment": {
    "html_title": "Deployment & Operations - Facil Documentation",
    "title": "Deployment & Operations",
    "description": "Automated CI/CD via GitHub Actions. Backend deploys to Google Cloud Run (container auto-scaling), frontend to Firebase Hosting (CDN). Mobile apps built via Expo and distributed through stores.",
    "toc": {
      "cicd": "CI/CD Pipeline",
      "workflows": "GitHub Actions Workflows",
      "cloud_run": "Google Cloud Run",
      "firebase": "Firebase Hosting",
      "environments": "Environment Management",
      "migrations": "Database Migrations",
      "mobile": "Mobile Distribution",
      "monitoring": "Monitoring & Alerting"
    },
    "callout": {
      "no_manual": {
        "title": "Critical Rule: No Manual Builds",
        "body": "<strong>Never build manually with <code>gcloud</code>.</strong> All deployments must go through GitHub Actions. Push to the remote branch and let the CI/CD pipeline handle building and deploying."
      },
      "safety": {
        "title": "Migration Safety",
        "body": "Always verify database state before writing migrations: <code>SELECT code FROM roles</code>, <code>SELECT column_name FROM information_schema.columns</code>, etc. Role codes and enum values change over time and must be verified against the live database."
      }
    },
    "diagram": {
      "title": "Deployment Pipeline",
      "workflows_count": "8 workflow files",
      "ci_tests": "CI Tests",
      "ci_subtitle": "Lint, type-check, unit tests",
      "build_containers": "Build Containers",
      "build_frontend": "Build Frontend",
      "backend_api": "Backend API",
      "frontend_cdn": "Frontend CDN"
    },
    "workflows": {
      "col_file": "Workflow File",
      "col_trigger": "Trigger",
      "col_purpose": "Purpose",
      "ci": { "trigger": "Push to main, develop, feature/**", "purpose": "Run linting, type checking, and unit tests" },
      "backend": { "trigger": "Push to develop (packages/backend/ changes)", "purpose": "Build Docker container, deploy to Cloud Run staging" },
      "frontend": { "trigger": "Push to develop (packages/web/ changes)", "purpose": "Build Next.js, deploy to Firebase Hosting staging" },
      "codeql": { "trigger": "Scheduled + PR", "purpose": "CodeQL security analysis" },
      "mobile": { "trigger": "Push (packages/mobile/ changes)", "purpose": "Build Expo citizen app" },
      "inspector": { "trigger": "Push (packages/inspector/ changes)", "purpose": "Build Expo inspector app" },
      "inspector_ci": { "purpose": "CI tests for inspector app" },
      "dashboard": { "trigger": "Manual / Scheduled", "purpose": "Update documentation dashboard" }
    },
    "cloudrun": {
      "col_config": "Configuration",
      "col_value": "Value",
      "row": {
        "service": "Service name",
        "region": "Region",
        "runtime": "Runtime",
        "runtime_value": "Python 3.11 (container)",
        "entry": "Entry point",
        "min": "Min instances",
        "min_value": "0 (scales to zero)",
        "max": "Max instances",
        "max_value": "Auto-scaled",
        "memory": "Memory",
        "memory_value": "512MB-1GB per instance",
        "timeout": "Timeout",
        "timeout_value": "300 seconds",
        "concurrency": "Concurrency",
        "concurrency_value": "80 requests per instance"
      }
    },
    "firebase": {
      "col_property": "Property",
      "col_dev": "Dev",
      "col_prod": "Production",
      "row": {
        "project": "Project",
        "url": "URL",
        "domain": "Custom domain",
        "cdn": "CDN",
        "global": "Global",
        "ssl": "SSL",
        "automatic": "Automatic",
        "staging": "Staging channels",
        "staging_value": "Pattern: <code>taxasge-dev--{channel}.web.app</code>"
      }
    },
    "envs": {
      "col_env": "Environment",
      "col_branch": "Branch",
      "col_backend": "Backend",
      "col_frontend": "Frontend",
      "col_database": "Database",
      "row": {
        "dev": "Development",
        "dev_db": "Local / Supabase dev",
        "staging": "Staging",
        "staging_backend": "Cloud Run staging",
        "staging_frontend": "Firebase dev",
        "staging_db": "Supabase staging",
        "prod": "Production",
        "prod_backend": "Cloud Run prod",
        "prod_frontend": "Firebase prod",
        "prod_db": "Supabase prod"
      },
      "vars_title": "Environment Variables",
      "vars_intro": "Key environment variables configured in <code>packages/backend/.env</code>:"
    },
    "migrations": {
      "intro": "Migrations are stored in <code>packages/backend/migrations/</code> as SQL and Python files. They include schema changes, data seeds, and view definitions.",
      "col_category": "Category",
      "col_count": "Count",
      "col_examples": "Examples",
      "row": {
        "schema": "Schema migrations",
        "schema_count": "~10 numbered",
        "views": "View definitions",
        "seeds": "Seed data",
        "runners": "Python runners",
        "hotfixes": "Hotfixes",
        "various": "Various"
      }
    },
    "mobile": {
      "col_app": "App",
      "col_id": "Package ID",
      "col_dist": "Distribution",
      "row": {
        "citizen": "Facil (Citizen)",
        "citizen_dist": "Expo.dev builds, GitHub Releases, Google Play Store",
        "inspector_dist": "Expo.dev builds, internal distribution"
      }
    },
    "monitoring": {
      "health_title": "Health Check Endpoint",
      "endpoints_title": "Monitoring Endpoints",
      "health_desc": "Basic health check (public)",
      "admin_desc": "Detailed system health (admin)",
      "logging_title": "Logging",
      "logging_body": "Structured logging via <strong>Loguru</strong> with contextual information. Cloud Run captures stdout/stderr and forwards to Google Cloud Logging for centralized monitoring."
    }
  },

  "security": {
    "html_title": "Security Architecture - Facil Documentation",
    "title": "Security Architecture",
    "description": "Multi-layered security covering authentication (JWT + 2FA), authorization (RBAC with 47 roles and 335 permissions), data protection, OWASP compliance, and comprehensive audit logging.",
    "toc": {
      "request_flow": "Request Security Flow",
      "authentication": "Authentication",
      "rbac": "RBAC Authorization",
      "owasp": "OWASP Compliance",
      "data_protection": "Data Protection",
      "file_security": "File Security",
      "ai_security": "AI Security",
      "audit": "Audit Logging",
      "headers": "Security Headers"
    },
    "flow": {
      "incoming": "Incoming Request",
      "cors": "CORS Check",
      "rate": "Rate Limiter",
      "headers": "Security Headers",
      "jwt": "JWT Verification",
      "rbac": "RBAC Permission Check",
      "handler": "Handler",
      "audit": "Audit Log"
    },
    "auth": {
      "col_feature": "Feature",
      "col_impl": "Implementation",
      "col_details": "Details",
      "row": {
        "password": "Password Hashing",
        "password_details": "12 rounds, salt per password",
        "access": "Access Token",
        "access_details": "30-minute lifetime",
        "refresh": "Refresh Token",
        "refresh_details": "30-day lifetime, revocable",
        "2fa_details": "Time-based OTP, optional per user",
        "lockout": "Login Lockout",
        "lockout_impl": "Progressive delay",
        "lockout_details": "Account locks after failed attempts",
        "session": "Session Management",
        "session_impl": "Database-backed",
        "session_details": "<code>sessions</code> + <code>refresh_tokens</code> tables",
        "email": "Email Verification",
        "email_impl": "Token-based",
        "email_details": "<code>pending_registrations</code> table, 15-min expiry"
      }
    },
    "stats": {
      "roles": "Roles",
      "permissions": "Permissions",
      "audit": "Audit Entries"
    },
    "rbac": {
      "model_title": "Permission Model",
      "diagram_title": "RBAC Architecture",
      "user": "User",
      "has_role": "▼ has role",
      "role": "Role",
      "role_subtitle": "47 roles (entity-specific)",
      "grants": "▼ grants",
      "role_perms": "Role Permissions",
      "role_perms_subtitle": "role_permissions mapping table",
      "permissions_count": "335 Permissions",
      "permissions_subtitle": "Granular resource.action permissions",
      "overrides": "Additionally, <strong>per-user permission overrides</strong> allow granting or revoking specific permissions for individual users without changing their role, stored in the <code>user_permissions</code> table.",
      "naming_title": "Permission Naming Convention",
      "autosync_title": "Permission Auto-Sync",
      "autosync_body": "On application startup, the permissions system auto-discovers all <code>*_permissions.py</code> files across modules, syncs them to the database, assigns them to roles based on predefined mappings, and cleans up obsolete permissions.",
      "realtime_title": "Real-Time Invalidation",
      "realtime_body": "The <code>rbac_listener</code> subscribes to a PostgreSQL NOTIFY channel. When a role or permission changes in the database, the cache is invalidated immediately (not waiting for TTL expiry)."
    },
    "owasp": {
      "col_top10": "OWASP Top 10",
      "col_mitigation": "Mitigation",
      "row": {
        "a01": "A01: Broken Access Control",
        "a01_mitigation": "RBAC with 335 permissions, per-endpoint <code>@permission_required</code>",
        "a02": "A02: Cryptographic Failures",
        "a02_mitigation": "bcrypt (12 rounds), TLS everywhere, no plaintext secrets",
        "a03": "A03: Injection",
        "a03_mitigation": "asyncpg parameterized queries ($1, $2), never string formatting",
        "a04": "A04: Insecure Design",
        "a04_mitigation": "3-tier architecture, input validation (Pydantic v2), defense in depth",
        "a05": "A05: Security Misconfiguration",
        "a05_mitigation": "Security headers middleware, CORS whitelist, environment-specific configs",
        "a06": "A06: Vulnerable Components",
        "a06_mitigation": "GitHub Dependabot, CodeQL analysis",
        "a07": "A07: Auth Failures",
        "a07_mitigation": "JWT with short TTL, progressive lockout, 2FA TOTP",
        "a08": "A08: Data Integrity",
        "a08_mitigation": "Pydantic validation on all inputs, Zod on frontend, database constraints",
        "a09": "A09: Logging & Monitoring",
        "a09_mitigation": "Loguru structured logging, audit_logs table, 2800+ entries",
        "a10": "A10: SSRF",
        "a10_mitigation": "URL validation on webhook configurations, no user-controlled URL fetching"
      }
    },
    "data": {
      "sql": "<strong>SQL injection prevention:</strong> 100% parameterized queries via asyncpg (<code>$1, $2</code> placeholders)",
      "xss": "<strong>XSS prevention:</strong> DOMPurify on frontend, CSP headers, no dangerouslySetInnerHTML",
      "csrf": "<strong>CSRF:</strong> SameSite cookies, CORS origin whitelist",
      "5xx": "<strong>5xx error sanitization:</strong> Internal error details never exposed to clients (generic translated message returned)",
      "secrets": "<strong>Secret management:</strong> Google Cloud Secret Manager for production credentials"
    },
    "file": {
      "col_control": "Control",
      "col_details": "Details",
      "row": {
        "mime": "MIME validation",
        "mime_details": "Verified against actual file content, not just extension",
        "ext": "Extension blacklist",
        "ext_details": "Executable files (.exe, .bat, .sh, etc.) blocked",
        "size": "Size limits",
        "size_details": "Per-file and per-request limits enforced",
        "storage": "Storage",
        "storage_details": "Supabase Storage with signed URLs (time-limited access)",
        "access": "Access control",
        "access_details": "Files scoped to owner (user_id) or assigned agents"
      }
    },
    "ai": {
      "intro": "The chatbot implements prompt injection detection with 30+ pattern rules to prevent adversarial exploitation of the LLM.",
      "col_protection": "Protection",
      "col_impl": "Implementation",
      "row": {
        "injection": "Prompt injection detection",
        "injection_impl": "30+ regex patterns for common injection techniques",
        "tools": "Role-based tool access",
        "tools_impl": "Tools filtered by user role before Gemini invocation",
        "boundary": "Data boundary enforcement",
        "boundary_impl": "Citizen agent cannot access internal agent data",
        "output": "Output sanitization",
        "output_impl": "LLM output sanitized before rendering in frontend",
        "rate": "Rate limiting",
        "rate_impl": "30 messages/minute per user",
        "consent": "Executive consent",
        "consent_impl": "Privileged operations require explicit user confirmation"
      }
    },
    "audit": {
      "intro": "The <code>audit_logs</code> table captures all critical operations across the system via the EventBus audit handler. Logs include actor, action, resource, timestamp, and metadata.",
      "ops_title": "Audited Operations",
      "ops": {
        "login": "User login/logout, failed authentication attempts",
        "roles": "Role and permission changes",
        "requests": "Service request creation, status transitions",
        "payments": "Payment processing decisions (approve/reject)",
        "assignments": "Agent assignment changes",
        "admin": "Admin user management operations",
        "documents": "Document upload/download/deletion",
        "config": "System configuration changes"
      }
    },
    "headers": {
      "intro": "Applied via pure ASGI middleware (<code>SecurityHeadersMiddleware</code>) to avoid conflicts with CORSMiddleware:"
    },
    "callout": {
      "csp": {
        "title": "CSP Headers",
        "body": "Content Security Policy (CSP) headers are set by the Next.js frontend middleware (<code>middleware.ts</code>), not by the backend. This prevents duplicate/conflicting CSP headers which would cause the browser to apply the intersection (most restrictive)."
      }
    }
  },

  "payments": {
    "html_title": "Payment Systems - Facil Documentation",
    "title": "Payment & Financial Systems",
    "breadcrumb": "Payment Systems",
    "description": "Payment processing for all Facil services, including single-entity service payments and multi-entity bundle payments for commercial licenses. Integrated with BANGE bank for mobile money, card, and bank transfer processing.",
    "toc": {
      "architecture": "Payment Architecture",
      "methods": "Payment Methods",
      "workflow": "Payment Workflow (17 States)",
      "atomic": "Atomic Payment Pipeline",
      "bundle": "Bundle Payment Flow",
      "lock": "Lock Ordering (Concurrency)",
      "receipts": "Receipt Generation",
      "security": "Receipt Security & QR Verification",
      "reporting": "Financial Reporting",
      "bange": "BANGE Integration"
    },
    "diagram": {
      "title": "Payment Processing Flow",
      "wizard": "Wizard Session",
      "wizard_sub": "Cache-first (Redis)",
      "initiate": "▼ initiate-payment",
      "atomic": "Atomic Transaction",
      "atomic_sub": "Persist + Payment in single DB transaction",
      "bange_proc": "BANGE Processor",
      "bange_sub": "mobile_money / card / bank_transfer",
      "manual_proc": "Manual Processor",
      "manual_sub": "cash / check (agent validation)",
      "redirect": "Redirect URL / Confirmation",
      "webhook": "▼ Webhook callback",
      "completed": "Payment Completed",
      "completed_sub": "EventBus: auto-assign to entity agents"
    },
    "methods": {
      "col_method": "Method",
      "col_enum": "Enum Value",
      "col_processor": "Processor",
      "col_flow": "Flow",
      "row": {
        "mobile": "Mobile Money",
        "mobile_flow": "Redirect to BANGE, webhook callback",
        "card": "Credit/Debit Card",
        "card_flow": "Redirect to BANGE payment page",
        "transfer": "Bank Transfer",
        "transfer_flow": "Redirect to bank portal",
        "wallet": "BANGE Wallet",
        "wallet_flow": "Direct wallet debit",
        "cash": "Cash",
        "manual": "Manual",
        "cash_flow": "Agent validates in person"
      }
    },
    "workflow": {
      "summary": "All 17 payment workflow states",
      "col_state": "State",
      "col_desc": "Description",
      "row": {
        "submitted": "Payment created, awaiting processing",
        "auto": "System auto-processing (BANGE redirect)",
        "pending": "Manual payment awaiting agent review",
        "locked": "Agent has locked the payment for review",
        "approved": "Agent approved the payment",
        "rejected": "Agent rejected the payment",
        "completed": "Payment fully processed and confirmed",
        "docs": "Additional documents requested",
        "escalated": "Escalated to supervisor",
        "cancelled": "Payment cancelled",
        "refund_req": "Refund initiated",
        "refund_app": "Refund approved by supervisor",
        "refund_done": "Refund processed",
        "hold": "Payment temporarily paused",
        "expired": "Payment window expired",
        "partial": "Partial amount received",
        "bank": "Awaiting BANGE callback"
      }
    },
    "atomic": {
      "intro": "The <code>POST /wizard-sessions/{id}/initiate-payment</code> endpoint performs all operations in a single database transaction. If any step fails, everything rolls back.",
      "step1": "1. Read Redis session",
      "step2": "2. Validate data",
      "step3": "3. BEGIN TX",
      "step4": "4. INSERT service_request",
      "step5": "5. Upload docs to Firebase",
      "step6": "6. INSERT service_payment",
      "step7": "7. Confirm appointment",
      "step8": "8. COMMIT",
      "callout_title": "Zero orphaned records",
      "callout_body": "The atomic pipeline ensures that a service request is never created without its associated payment, and vice versa. Failed document uploads trigger a complete rollback."
    },
    "bundle": {
      "intro": "Bundle payments handle commercial license obligations spanning multiple government entities. A single commercial license may generate obligations to TESORO, AYUNTAMIENTO, CAMARA_COMERCIO, and various MIN_* ministries.",
      "step1": "Commercial License",
      "step2": "Classification",
      "step3": "Zone Resolution",
      "step4": "Obligation Generation",
      "step5": "Multi-Entity Validation",
      "step6": "Payment",
      "step7": "Receipt",
      "multi_title": "Multi-Entity Validation",
      "multi_body": "Each entity validates its portion of the bundle independently. The TESORO entity validates overall financial compliance, AYUNTAMIENTO validates municipal requirements, and CAMARA_COMERCIO verifies commercial registration status."
    },
    "lock": {
      "callout_title": "Deadlock Prevention",
      "callout_body": "For any transaction touching commercial licenses AND field payments, the following canonical lock order MUST be followed. Violating this order causes deadlocks under 100+ concurrent agents.",
      "step1": "<strong><code>commercial_licenses</code></strong> &mdash; <code>SELECT ... FOR UPDATE</code> (the only explicit lock &mdash; root entity)",
      "step2": "<strong><code>service_requests</code></strong> &mdash; <code>INSERT</code> only (optimistic via partial UNIQUE index, no <code>FOR UPDATE</code>)",
      "step3": "<strong><code>license_obligations</code></strong> &mdash; <code>UPDATE</code> batch (locks acquired automatically)",
      "step4": "<strong><code>service_payments</code></strong> &mdash; <code>INSERT</code> final",
      "warn_title": "Never FOR UPDATE on service_requests",
      "warn_body": "Concurrency on <code>service_requests</code> is handled by the partial unique index <code>idx_sr_commercial_license_unique</code> plus <code>try/except asyncpg.UniqueViolationError</code> recovery (deterministic SELECT by <code>commercial_license_id</code>)."
    },
    "receipts": {
      "intro": "PDF receipts are generated using the <code>SummaryPDFService</code> with the <code>citizen_summary_pdf.html</code> template (490 lines). Receipts include:",
      "item1": "Entity name and city in the header",
      "item2": "Fiscal service details per obligation",
      "item3": "Calculated amounts with breakdown",
      "item4": "Payment reference and timestamp",
      "item5": "QR code for receipt verification"
    },
    "security": {
      "title": "Receipt Security & QR Verification",
      "intro": "Every receipt, license, certificate, and service-request PDF generated by Facil is <strong>cryptographically signed</strong> and <strong>publicly verifiable via QR code</strong>. The QR encodes a deep-link to a public verification endpoint; the link carries an <strong>HMAC-SHA256</strong> token that is impossible to forge without the server-side secret. Tampering with the receipt number, the amount, or the date breaks the signature &mdash; the verification endpoint then rejects the document.",
      "diagram_title": "Architecture &mdash; Sign & Verify Flow",
      "diagram_caption": "Generation (server) → QR (PDF) → Public verification (any device)",
      "box": {
        "gen": "1. Receipt PDF generated", "gen_sub": "payment validated → PDF rendered with WeasyPrint",
        "sign": "2. HMAC-SHA256 sign", "sign_sub": "message: receipt_number | amount | YYYYMMDD<br>secret: RECEIPT_VERIFICATION_SECRET<br>output: 16-char hex digest",
        "qr": "3. QR encoded", "qr_sub": "URL: https://app/verify/{ref}?t={token}<br>embedded as base64 PNG in PDF",
        "store": "4. Stored in vault", "store_sub": "Firebase Storage signed URL + audit row + user vault entry",
        "scan": "5. Anyone scans QR", "scan_sub": "browser opens<br>GET /api/v1/verify/{ref}?t=...<br>(no auth required)",
        "verify": "6. Server re-computes HMAC", "verify_sub": "hmac.compare_digest() — constant time<br>match → 200 + payment data<br>mismatch → 404"
      },
      "tech_title": "What makes the document infalsifiable",
      "col_control": "Security Control", "col_impl": "Implementation", "col_why": "Why it matters",
      "row": {
        "algo": "Cryptographic algorithm",
        "algo_why": "Standard authenticated digest. Forging a valid token requires the server secret — computationally infeasible without it.",
        "secret": "Signing secret",
        "secret_why": "Permanent secret loaded from environment / Secret Manager. Never the ephemeral SECRET_KEY (which would rotate on every Cloud Run cold-start and invalidate old QR codes).",
        "payload": "Signed message",
        "payload_why": "Binds the token to the exact receipt, exact amount, and the day of payment. Edit any field on the PDF → signature breaks → verification fails.",
        "compare": "Comparison",
        "compare_why": "Constant-time comparison — immune to timing side-channel attacks that could otherwise leak the token byte-by-byte.",
        "token": "Token format",
        "token_val": "16-character hex (first 64 bits of the HMAC)",
        "token_why": "Compact enough for a small QR code (ERROR_CORRECT_M still scannable on a phone), large enough to make brute-force search infeasible (2^64).",
        "endpoint": "Public endpoints",
        "endpoint_why": "No authentication required — anyone (third party, bank teller, customs officer) can scan and verify in one tap. Privacy is preserved: response only confirms validity + minimal payment data.",
        "vault": "Storage & vault",
        "vault_why": "PDF persisted to Firebase Storage with signed URL and registered in the citizen vault. The QR is verified against live DB state, so a revoked / refunded payment can be flagged at scan time."
      },
      "threat_title": "Threat model",
      "threat": {
        "edit": "<strong>Editing the printed PDF</strong> (changing the amount, name, or date in a PDF editor) → QR token no longer matches the new content → verification endpoint returns 404. Detected on first scan.",
        "replay": "<strong>Reusing a QR for another receipt</strong> → the verification endpoint loads the receipt by its number, not by the token; a stolen token cannot be paired with a different receipt number.",
        "brute": "<strong>Brute-forcing a token</strong> → 2<sup>64</sup> search space, public endpoint behind rate-limit. Statistically infeasible.",
        "timing": "<strong>Timing side-channel</strong> → mitigated by <code>hmac.compare_digest()</code>.",
        "secret": "<strong>Secret leak</strong> → rotate <code>RECEIPT_VERIFICATION_SECRET</code> in Secret Manager — old receipts must then be re-signed if continued verification is required (acceptable trade-off for security incidents)."
      }
    },
    "reporting": {
      "col_report": "Report",
      "col_scope": "Scope",
      "col_desc": "Description",
      "scope": { "entity": "Entity", "system": "System", "agent": "Agent", "bank": "Bank", "ministry": "Ministry" },
      "row": {
        "revenue": "Revenue by Entity",
        "revenue_desc": "Total revenue per government entity per period",
        "bank": "Bank Reconciliation",
        "bank_desc": "Match bank transactions with payment records",
        "audit": "Payment Validation Audit",
        "audit_desc": "Audit trail of all payment validation decisions",
        "collection": "Collection Analytics",
        "collection_desc": "Collection performance per bank configuration",
        "ministry": "Ministry Summary",
        "ministry_desc": "Financial summary per ministry/entity"
      }
    },
    "bange": {
      "intro": "BANGE is the primary payment processor for Equatorial Guinea. Integration uses webhook callbacks to confirm payment status.",
      "col_feature": "Feature",
      "col_details": "Details",
      "row": {
        "webhook": "Webhook endpoint",
        "callback": "Callback verification",
        "callback_val": "HMAC signature validation",
        "currencies": "Supported currencies",
        "logging": "Transaction logging",
        "logging_val": "<code>bank_transactions</code> table",
        "config": "Configuration",
        "config_val": "<code>bank_configurations</code> table (API keys, webhook URLs)"
      }
    }
  },

  "i18npage": {
    "html_title": "Internationalization - Facil Documentation",
    "title": "Internationalization Guide",
    "description": "Facil is fully trilingual: Spanish (primary), French, and English. The i18n system spans the frontend (11,400+ keys per locale), backend (entity translations + error messages), mobile apps, and communication templates.",
    "toc": {
      "overview": "Language Support Overview",
      "frontend": "Frontend i18n (next-intl)",
      "backend": "Backend i18n",
      "db": "Database Translations",
      "mobile": "Mobile i18n",
      "communications": "Communication Templates",
      "adding": "Adding New Keys"
    },
    "stats": {
      "languages": "Languages",
      "keys": "Keys per Locale",
      "savings": "Storage Savings (entity_translations)"
    },
    "langs": {
      "col_lang": "Language",
      "col_code": "Code",
      "col_status": "Status",
      "col_notes": "Notes",
      "row": {
        "es": "Spanish",
        "es_status": "Primary",
        "es_notes": "Official language of Equatorial Guinea. All database content stored in Spanish.",
        "fr": "French",
        "fr_notes": "Official language of Equatorial Guinea. Full UI + entity translations.",
        "en": "English",
        "en_notes": "International support. Full UI + entity translations.",
        "complete": "Complete"
      }
    },
    "fe": {
      "arch_title": "Architecture",
      "arch_body": "The frontend uses <code>next-intl</code> with Next.js App Router's <code>[locale]</code> segment. All pages are nested under <code>/[locale]/</code> which automatically detects and sets the language.",
      "usage_title": "Usage in Components",
      "keys_title": "Translation Key Structure",
      "keys_body": "Keys are organized hierarchically by module/page:"
    },
    "be": {
      "middleware_title": "Language Detection Middleware",
      "middleware_body": "The <code>language_middleware</code> detects the user's language from the <code>Accept-Language</code> header and stores it in <code>request.state.language</code> for use throughout the request lifecycle.",
      "errors_title": "Error Message Translation",
      "errors_body": "Error messages are auto-translated based on the detected language. The <code>TranslatedException</code> class carries an <code>error_code</code> which maps to trilingual messages. Pattern matching handles legacy HTTP exceptions."
    },
    "db": {
      "tables_title": "Two Translation Tables",
      "col_table": "Table",
      "col_purpose": "Purpose",
      "col_storage": "Storage Model",
      "row": {
        "translations_purpose": "Unified translations for ENUMs, UI labels, form fields, system messages",
        "translations_storage": "Key-value with locale column",
        "entity_purpose": "Entity-specific translations (ministry names, service names, etc.)",
        "entity_storage": "Optimized structure (40% storage reduction vs. inline columns)"
      },
      "convention_title": "Database Content Convention",
      "convention_callout_title": "Spanish in Database, Translated at Runtime",
      "convention_callout_body": "All database content (ministry names, service names, categories) is stored in Spanish (the primary language). French and English translations are stored in the <code>entity_translations</code> table and resolved at query time.",
      "pattern_title": "Entity Translation Pattern",
      "cache_title": "Translation Cache",
      "cache_body": "Translations are cached for 1 hour via <code>get_translations_cache()</code> to minimize database queries. Cache invalidation is triggered when translations are updated via the admin API."
    },
    "mobile": {
      "body": "Both mobile apps (Facil citizen and Facil Inspector) support the same 3 languages. Translations are stored as JSON files bundled with the app and loaded at runtime based on the user's language preference."
    },
    "comm": {
      "body": "Email, SMS, push notification, and in-app notification templates are stored in their respective tables (<code>email_templates</code>, <code>sms_templates</code>, <code>push_templates</code>, <code>notification_templates</code>) with content for all 3 languages.",
      "col_type": "Template Type",
      "col_table": "Table",
      "col_render": "Rendering",
      "row": {
        "email": "Email",
        "email_render": "Jinja2 with trilingual subject + body",
        "sms_render": "Plain text, 160 char segments",
        "push": "Push Notification",
        "push_render": "Title + body per locale",
        "inapp": "In-App",
        "inapp_render": "Structured notification per locale"
      }
    },
    "add": {
      "intro": "To add a new translation key:",
      "step1": "Add the key to <strong>all 3 JSON files</strong> (<code>es.json</code>, <code>fr.json</code>, <code>en.json</code>)",
      "step2": "Follow the existing hierarchical structure: <code>module.section.key</code>",
      "step3": "Provide real translations (not machine-translated placeholders)",
      "step4": "Use the key in your component with <code>useTranslations('module')</code>",
      "step5": "For parameterized strings, use ICU message format: <code>\"count\": \"{count} servicios\"</code>",
      "endpoints_title": "Translation API Endpoints",
      "ep1": "List translations by category/locale",
      "ep2": "Create new translation entry",
      "ep3": "Update translation",
      "ep4": "Get entity translations",
      "ep5": "Bulk fetch for frontend hydration",
      "ep6": "Get enum values with translations"
    }
  },

  "agents": {
    "html_title": "AI & Intelligence - Facil Documentation",
    "description": "Facil integrates AI across four domains: a RAG chatbot with 35 tools, OCR document intelligence with 40 schemas, smart agent assignment, and content enrichment. All powered by Google Vertex AI (Gemini 2.5 Flash) and pgvector embeddings.",
    "toc": {
      "rag": "RAG Chatbot Architecture",
      "hybrid": "Hybrid Search Pipeline",
      "tools": "35 Specialized Tools",
      "roles": "5 Role-Based Agents",
      "reflection": "Self-Reflection Loop",
      "ocr": "OCR Document Intelligence",
      "assignment": "Smart Assignment Engine",
      "enrichment": "Content Enrichment",
      "security": "AI Security (OWASP)"
    },
    "rag": {
      "diagram_title": "RAG Pipeline",
      "user_msg": "User Message",
      "preprocessor": "Query Preprocessor",
      "preprocessor_sub": "query_preprocessor.py: language detection, intent classification, query expansion",
      "embedding": "Embedding",
      "hybrid": "Hybrid Search",
      "hybrid_sub": "70% pgvector cosine + 30% tsvector full-text",
      "context": "Context Assembly",
      "context_sub": "chatbot_service_rag.py: docs + user context + tool selection",
      "gemini_sub": "gemini_service.py: structured prompt + 35 tools",
      "reflection": "Self-Reflection",
      "reflection_sub": "Score < 5/10 triggers regeneration",
      "response": "Response",
      "response_sub": "15 output formats + related services",
      "services_title": "Backend Services",
      "col_file": "File",
      "col_resp": "Responsibility",
      "row": {
        "main": "Main orchestrator: search, context assembly, prompt construction, response formatting",
        "gemini": "Gemini API client: model initialization, tool execution, streaming",
        "embedding": "Text embedding via Vertex AI text-embedding-004 (768 dimensions)",
        "preprocessor": "Query analysis: language detection, intent classification, expansion",
        "tools_pub": "19 public tool definitions for unauthenticated users",
        "tools_auth": "16 authenticated tools (8 auth-required + 8 deep reasoning)",
        "consent": "Executive consent management for privileged operations"
      }
    },
    "hybrid": {
      "intro": "Search combines semantic (vector) and lexical (full-text) approaches with configurable weights:",
      "col_component": "Component",
      "col_weight": "Weight",
      "col_tech": "Technology",
      "col_index": "Index",
      "row": {
        "semantic": "Semantic Search",
        "semantic_tech": "pgvector cosine similarity (<code>&lt;=&gt;</code> operator)",
        "semantic_index": "IVFFlat index on embedding column",
        "fulltext": "Full-Text Search",
        "fulltext_tech": "PostgreSQL tsvector/tsquery (<code>ts_rank</code>)",
        "fulltext_index": "GIN index on tsvector column"
      }
    },
    "tools": {
      "public_summary": "19 Public Tools (unauthenticated)",
      "public_intro": "Available to all users (including anonymous visitors):",
      "public": {
        "search": "<strong>search_services</strong> &mdash; Search fiscal services catalog",
        "details": "<strong>get_service_details</strong> &mdash; Get detailed service information",
        "ministry": "<strong>get_ministry_services</strong> &mdash; Services by ministry",
        "requirements": "<strong>get_service_requirements</strong> &mdash; Document requirements for a service",
        "procedure": "<strong>get_service_procedure</strong> &mdash; Step-by-step procedure",
        "fee": "<strong>calculate_fee</strong> &mdash; Fee calculator",
        "offices": "<strong>get_office_locations</strong> &mdash; Entity office locations",
        "faq": "<strong>get_faq</strong> &mdash; Frequently asked questions",
        "more": "Plus 11 additional information retrieval tools"
      },
      "auth_summary": "8 Authenticated Tools",
      "auth_intro": "Available only to logged-in users (personal data scoped):",
      "auth": {
        "requests": "<strong>get_my_requests</strong> &mdash; User's service requests",
        "status": "<strong>get_request_status</strong> &mdash; Status of a specific request",
        "payments": "<strong>get_my_payments</strong> &mdash; User's payment history",
        "declarations": "<strong>get_my_declarations</strong> &mdash; User's tax declarations",
        "appointments": "<strong>get_my_appointments</strong> &mdash; User's appointments",
        "documents": "<strong>get_my_documents</strong> &mdash; User's uploaded documents",
        "company": "<strong>get_my_company</strong> &mdash; Company information",
        "support": "<strong>create_support_ticket</strong> &mdash; Create support ticket"
      },
      "deep_summary": "8 Deep Reasoning Tools (privileged agents)",
      "deep_intro": "Available to Treasury, Supervisor, and Admin agents with entity-scoped access:",
      "deep": {
        "revenue": "<strong>analyze_revenue</strong> &mdash; Revenue analysis by entity/period",
        "team": "<strong>get_team_metrics</strong> &mdash; Team performance metrics",
        "sla": "<strong>get_sla_compliance</strong> &mdash; SLA compliance reports",
        "workload": "<strong>get_workload_distribution</strong> &mdash; Agent workload analysis",
        "escalation": "<strong>get_escalation_history</strong> &mdash; Escalation patterns",
        "times": "<strong>analyze_processing_times</strong> &mdash; Processing time statistics",
        "perf": "<strong>get_agent_performance</strong> &mdash; Individual agent performance",
        "audit": "<strong>get_audit_trail</strong> &mdash; Audit trail queries"
      }
    },
    "roles": {
      "col_agent": "Agent",
      "col_users": "Users",
      "col_tools": "Tools",
      "col_data": "Data Access",
      "col_capability": "Key Capability",
      "row": {
        "citizen": { "name": "<strong>Citizen Agent</strong>", "users": "Anonymous visitors", "tools": "19 public", "data": "Public catalog only", "cap": "Service information, fee calculation" },
        "auth": { "name": "<strong>Authenticated Agent</strong>", "users": "Logged-in citizens/businesses", "tools": "19 + 8 auth", "data": "Personal data only", "cap": "Request tracking, payment history" },
        "treasury": { "name": "<strong>Treasury Agent</strong>", "users": "Treasury staff", "tools": "19 + 8 + 8 deep", "data": "Entity-scoped financial", "cap": "Revenue analysis, reconciliation" },
        "supervisor": { "name": "<strong>Supervisor Agent</strong>", "users": "Team supervisors", "tools": "19 + 8 + 8 deep", "data": "Team-scoped metrics", "cap": "Workload management, SLA monitoring" },
        "admin": { "name": "<strong>Admin Agent</strong>", "users": "System administrators", "tools": "All 35", "data": "Full (with audit trail)", "cap": "System diagnostics, full access" }
      },
      "callout_title": "Confidentiality Boundaries",
      "callout_body": "Each agent role has strict data access boundaries enforced at the tool level. A Citizen Agent <strong>cannot</strong> access any internal data, even if the prompt attempts to trick it. Treasury Agents can only see data for their assigned entity."
    },
    "reflection": {
      "intro": "After generating a response, the chatbot evaluates its own answer quality on a 1-10 scale. If the score is below 5, it regenerates with adjusted context. This ensures response quality remains consistently high.",
      "step1": "Generate Response",
      "step2": "Self-Score (1-10)",
      "step3": "Score ≥ 5?",
      "return": "Return",
      "low": "Score < 5",
      "regen": "Regenerate",
      "retry": "Return (max 1 retry)",
      "formats_title": "15 Response Formats",
      "formats_body": "The chatbot outputs responses in structured formats appropriate to the query type, including service cards, procedure lists, fee breakdowns, status updates, document checklists, appointment information, and general information blocks."
    },
    "ocr": {
      "schemas_title": "40 Document Schemas",
      "schemas_body": "Each document type has a JSON schema defining extraction fields, bounding box coordinates, and validation rules. Schemas are stored in <code>packages/backend/app/modules/service_requests/schemas/</code>.",
      "pipeline_title": "Extraction Pipeline",
      "step1": "Upload Document",
      "step2": "MIME Validation",
      "step3": "Template Matching",
      "step4": "OCR Extraction",
      "step5": "Schema Validation",
      "step6": "Structured Data",
      "engines_title": "Validation Engines",
      "col_engine": "Engine",
      "col_rules": "Rules",
      "col_purpose": "Purpose",
      "row": {
        "schema": "<strong>SchemaValidationEngine</strong>",
        "schema_rules": "70+ JSON rules",
        "schema_purpose": "Document validity: format, signatures, required fields, temporal validity",
        "risk": "<strong>RiskAnalyzer</strong>",
        "risk_rules": "12-step pipeline",
        "risk_purpose": "Fraud detection: inconsistencies, tampering indicators, cross-reference checks",
        "mrz": "<strong>MRZ Validator</strong>",
        "mrz_rules": "ICAO 9303 standard",
        "mrz_purpose": "Machine Readable Zone validation for passports and ID cards",
        "hash": "<strong>Document Hash Registry</strong>",
        "hash_rules": "PostgreSQL-based",
        "hash_purpose": "Duplicate detection and document fingerprinting",
        "lev": "<strong>Levenshtein Matcher</strong>",
        "lev_rules": "Fuzzy matching",
        "lev_purpose": "Name matching across documents with configurable threshold"
      },
      "callout_title": "OCR Data Access Rule",
      "callout_body": "OCR-extracted fields must use <code>context.get_extracted_field(doc, path)</code>. Form-submitted fields use <code>form_data.get()</code>. Never mix these two access patterns."
    },
    "assignment": {
      "intro": "The assignment engine automatically distributes work items to agents based on multiple factors. It uses the <code>agent_work_queue</code> table with dynamic priority scoring.",
      "factors_title": "Assignment Factors",
      "col_factor": "Factor",
      "col_weight": "Weight",
      "col_desc": "Description",
      "weight": { "high": "High", "medium": "Medium", "low": "Low", "critical": "Critical" },
      "row": {
        "capacity": "Capacity",
        "capacity_desc": "Current workload vs. max capacity per agent",
        "spec": "Specialization",
        "spec_desc": "Agent expertise matching for workflow type",
        "sla": "SLA Priority",
        "sla_desc": "Time remaining on SLA deadline",
        "amount": "Amount",
        "amount_desc": "Payment amount (higher amounts may route to senior agents)",
        "complex": "Complexity",
        "complex_desc": "Workflow complexity score",
        "avail": "Availability",
        "avail_desc": "Agent must be available (not on leave, sick, training, etc.)"
      },
      "states_title": "Agent Availability States"
    },
    "security": {
      "body": "The chatbot implements OWASP LLM Top 10 mitigations including prompt injection detection with 30+ pattern rules. See <a href=\"security.html#ai-security\">Security Architecture</a> for details."
    },
    "enrichment": {
      "body": "The enrichment module uses Gemini to automatically generate rich descriptions for fiscal services. Each description is 600 characters, structured in 3 paragraphs, with a self-evaluation score and few-shot examples for consistent quality."
    }
  },

  "database": {
    "html_title": "Database Schema - Facil Documentation",
    "title": "Database Schema Reference",
    "description": "PostgreSQL database hosted on Supabase with 145 tables organized across 10 domains, 50 custom enums, and pgvector extension for AI embeddings. All access via asyncpg with parameterized queries.",
    "toc": {
      "overview": "Schema Overview",
      "core": "Core Business (14 tables)",
      "declarations": "Declarations & Workflow (12 tables)",
      "agents": "Agents & Workload (7 tables)",
      "payments": "Payments (10 tables)",
      "documents": "Documents & OCR (5 tables)",
      "auth": "Authentication & RBAC (9 tables)",
      "communications": "Communications (9 tables)",
      "support": "Support (4 tables)",
      "translations": "Translations (3 tables)",
      "inspections": "Inspections & Bundle (15+ tables)",
      "enums": "Key Enums",
      "conventions": "Naming Conventions",
      "migrations": "Migration System"
    },
    "stats": { "tables": "Tables", "enums": "Custom Enums", "domains": "Domains", "permissions": "Permissions" },
    "callout": {
      "sot": { "title": "Source of Truth", "body": "Always query the database directly for current schema information. Use <code>information_schema.columns</code> and <code>pg_type</code> rather than relying on documentation alone, as the schema evolves frequently." },
      "safety": { "title": "Migration Safety Rule", "body": "Always verify the database state before writing a migration. Use <code>SELECT code FROM roles</code> before inserting into <code>role_permissions</code>. Role codes like <code>dgi_agent</code> or <code>ministry_agent</code> may no longer exist &mdash; the actual codes are entity-specific (e.g., <code>agent_cnedoge_pasaporte</code>, <code>agent_dgt</code>, <code>agent_extranjeria</code>)." }
    },
    "col": { "table": "Table", "description": "Description", "keys": "Key Columns", "volume": "Volume" },
    "row": {
      "users": "User accounts with roles",
      "fiscal_services": "873 fiscal services catalog",
      "tax_decl": "Tax declarations (20 types)",
      "companies": "Company management",
      "ucr": "User roles within companies",
      "ministries": "Government ministries",
      "sectors": "Ministry sectors",
      "categories": "Service categories",
      "keywords": "Search keywords for services",
      "sda": "Required documents per service",
      "spa": "Procedures per service",
      "proc_tmpl": "Procedure templates",
      "proc_steps": "Steps within procedures",
      "doc_tmpl": "Document templates with validity",
      "iva": "IVA declarations",
      "iva_vol": "~90% of declarations",
      "irpf": "IRPF/Income tax data",
      "petrol": "Petroleum sector declarations",
      "petrol_vol": "~4% (large amounts)",
      "retencion": "Withholding tax",
      "other": "Generic JSONB for 7 other types",
      "adj": "Amount adjustment audit trail",
      "corr": "Correction/amendment history",
      "transitions": "Workflow state transitions",
      "assignments": "Agent task assignments",
      "assignment_rules": "Auto-assignment rules",
      "adj_reasons": "Predefined adjustment catalog",
      "calc_hist": "Tax calculation history",
      "min_agents": "Ministry agents with full workflow status",
      "workloads": "Real-time agent workload tracking",
      "queue": "Dynamic priority queue (SLA, amount, complexity scoring)",
      "perf_stats": "Monthly performance metrics",
      "uma": "User-ministry mappings",
      "val_config": "Ministry validation settings",
      "sys_rules": "Dynamic business rules (no redeploy)",
      "payments": "Central polymorphic payments table",
      "svc_pay": "Payments with agent workflow (pessimistic locking)",
      "pay_plans": "Installment payment schedules",
      "installments": "Individual installments",
      "receipts": "Generated PDF receipts",
      "lock_hist": "Payment lock audit",
      "val_audit": "Validation audit trail",
      "bank_cfg": "Bank API/webhook configurations",
      "bank_tx": "Bank webhook transactions",
      "fsd": "Fiscal service payment data",
      "uploaded": "File metadata (Supabase Storage)",
      "doc_queue": "Async OCR queue with retry/fallback",
      "ocr_results": "Raw OCR extraction (JSONB)",
      "form_tmpl": "OCR field coordinates (14 form types)",
      "import": "Excel bulk import tracking",
      "sessions": "JWT sessions",
      "refresh": "Refresh tokens with revocation",
      "pending": "Email verification (15min expiry)",
      "roles": "47 custom roles (with menu_config, dashboard_config JSONB)",
      "permissions": "335 permission entries",
      "role_perms": "Role-permission mappings",
      "user_perms": "Per-user permission overrides",
      "perm_log": "Permission change history",
      "audit_logs": "System-wide audit trail (2800+ entries)",
      "cps": "Provider configs (SMS, Email, Push, WhatsApp)",
      "email_tmpl": "Multilingual email templates",
      "sms_tmpl": "SMS templates (160 char segments)",
      "push_tmpl": "Mobile/web push templates",
      "notif_tmpl": "In-app notification templates",
      "ussd": "USSD menu configs (Getesa, Muni)",
      "webhook_cfg": "WhatsApp Business API webhooks",
      "webhook_logs": "Webhook execution audit",
      "tickets": "User/agent support tickets",
      "sup_msg": "Ticket messages",
      "sup_att": "Message attachments",
      "sup_cat": "Multilingual ticket categories",
      "translations": "Unified translations (ENUMs, UI, Forms, System messages)",
      "ent_tr": "Optimized entity translations (40% storage reduction)",
      "favs": "User service favorites",
      "cl": "Root entity for bundle workflow (SELECT FOR UPDATE)",
      "sr": "Service request tracking (partial unique index)",
      "lo": "Per-entity obligations for a license",
      "entities": "Government entities with workflow_codes JSONB",
      "ent_loc": "Physical locations per entity",
      "pw": "Workflow definitions synced from Python classes",
      "wt": "Fee schedules per workflow",
      "wd": "Required documents per workflow",
      "wmm": "Workflow to menu structure mapping",
      "ap": "Agent profiles with menu_overrides",
      "fi": "Field inspection records",
      "ah": "Temporary 15min holds",
      "ar": "Confirmed permanent reservations",
      "asc": "Slot capacity configuration",
      "ws": "Cache-first wizard session data"
    },
    "inspections": { "intro": "Bundle workflow and field inspection tables covering commercial licenses, obligations, service requests, and field operations." },
    "enums": {
      "and_more": "and more",
      "user_role": { "summary": "user_role_enum (7 values)" },
      "decl_type": { "summary": "declaration_type_enum (34 types)" },
      "pay_status": {
        "summary": "payment_workflow_status (17 states)",
        "extra": "Additional states: <code>pending_documents</code>, <code>escalated</code>, <code>cancelled</code>, <code>refund_requested</code>, <code>refund_approved</code>, <code>refund_completed</code>, <code>on_hold</code>, <code>expired</code>, <code>partial_payment</code>, <code>awaiting_bank_confirmation</code>, <code>manual_review</code>"
      },
      "pay_method": { "summary": "payment_method_enum (5 values)" },
      "agent_action": { "summary": "agent_action_type (7 values)" },
      "svc_type": { "summary": "service_type_enum (8 values)" },
      "calc_method": { "summary": "calculation_method_enum (7 values)" }
    },
    "conv": {
      "col_element": "Element",
      "col_convention": "Convention",
      "col_example": "Example",
      "tables": "Tables",
      "tables_conv": "<code>snake_case</code> plural",
      "columns": "Columns",
      "fk": "Foreign keys",
      "timestamps": "Timestamps",
      "timestamps_ex": "Present on all tables",
      "soft": "Soft deletes",
      "soft_ex": "Nullable timestamp",
      "enums": "Enums",
      "indexes": "Indexes"
    },
    "migrations": {
      "intro": "Database migrations are stored in <code>packages/backend/migrations/</code> as both SQL files and Python scripts. Migrations are numbered sequentially and applied via a custom runner.",
      "verif_title": "Verification Pattern"
    }
  },

  "workflows": {
    "html_title": "Workflow Engine - Facil Documentation",
    "title": "Workflow Engine Reference",
    "description": "The workflow engine powers 36 service request workflows across 8 domains. Each workflow defines wizard steps, document requirements, fee calculations, OCR schemas, and entity routing rules.",
    "yes": "Yes",
    "no": "No",
    "varies": "varies",
    "toc": {
      "wizard": "Wizard Step Flow",
      "state": "Request State Machine",
      "catalog": "All 36 Workflows",
      "condition": "ConditionEvaluator",
      "fees": "Fee Calculation Methods",
      "routing": "Entity Routing",
      "ocr": "OCR Schema Integration",
      "appointments": "Appointment Management",
      "validation": "2-Layer Validation"
    },
    "wizard": {
      "intro": "Every service request follows a wizard with configurable steps. The standard flow is:",
      "step": { "selection": "Selection", "upload": "Upload", "form": "Form Review 1..N", "appointment": "Appointment", "payment": "Payment", "confirmation": "Confirmation" },
      "col_step": "Step", "col_purpose": "Purpose", "col_optional": "Optional?",
      "row": {
        "selection": { "name": "<strong>Selection</strong>", "purpose": "Choose sub-type, person type, motivo (reason). Drives dynamic form visibility.", "opt": "No (always present)" },
        "upload": { "name": "<strong>Upload</strong>", "purpose": "Upload required documents (OCR extraction runs here). Documents vary by workflow.", "opt": "No" },
        "form": { "name": "<strong>Form Review 1..N</strong>", "purpose": "Review OCR-extracted data, fill manual fields, validate business rules.", "opt": "Count varies (1-3)" },
        "appt": { "name": "<strong>Appointment</strong>", "purpose": "Book appointment slot (holds + reservations). Only for workflows requiring in-person visit.", "opt": "Yes" },
        "pay": { "name": "<strong>Payment</strong>", "purpose": "Calculate fee and initiate payment (BANGE or manual).", "opt": "No" },
        "conf": { "name": "<strong>Confirmation</strong>", "purpose": "Summary display, PDF download, email with receipt.", "opt": "No" }
      },
      "cache_title": "Cache-First Wizard",
      "cache_body": "The wizard uses a <strong>cache-first</strong> approach: step data is stored in Redis during the wizard flow (no database writes until payment). The <code>POST /wizard-sessions/{id}/initiate-payment</code> endpoint performs an atomic persist-and-pay operation in a single database transaction."
    },
    "state": {
      "diagram_title": "Service Request Lifecycle",
      "draft": "Draft", "submit": "▼ Submit", "submitted": "Submitted", "auto_assign": "▼ Auto-assign to entity agents",
      "processing": "Processing", "decision": "▼ Agent decision", "accepted": "Accepted", "rejected": "Rejected",
      "amended": "Amended", "completed": "Completed"
    },
    "cat": {
      "identity": "Identity & Civil (CNEDOGE) — 1 workflow",
      "immigration": "Immigration (Extranjeria) — 2 workflows",
      "traffic": "Traffic (DGT) — 3 workflows",
      "driving": "Driving (Conducir) — 1 workflow",
      "contracts": "Contracts (Contrato) — 1 workflow",
      "civil": "Civil Service (Funcion Publica) — 5 workflows",
      "bundle": "Bundle / Commercial (Multi-Entity) — 1 workflow",
      "generic": "Generic — 2 workflows",
      "col_workflow": "Workflow", "col_file": "File", "col_minor": "Minor?", "col_motivo": "Motivo?",
      "col_docs": "Docs", "col_forms": "Form Pages", "col_rdv": "RDV", "col_subtypes": "Sub-types",
      "col_entities": "Entities", "col_description": "Description",
      "row": {
        "pasaporte_motivo": "Yes (4)",
        "visado": "Tramites Visado (4 sub-types)",
        "conducir_motivo": "Yes (3: PERDIDA, ROBO, DETERIORO for DUPLICADO)",
        "contrato_docs": "3 required + 10 optional",
        "promo_sub": "3 sub-types",
        "bundle_desc": "Multi-entity commercial license obligations",
        "generic_desc": "Catch-all for uncategorized services"
      }
    },
    "cond": {
      "intro": "The <code>ConditionEvaluator</code> dynamically controls step and section visibility based on form data collected in earlier steps. Conditions are defined as JSON objects in workflow configurations.",
      "callout_title": "Critical Rule: Conditions Are Always Strings",
      "callout_body": "Conditions must use string values: <code>{\"is_minor\": \"true\"}</code>, <strong>not</strong> <code>{\"is_minor\": true}</code>. The frontend RadioGroup stores strings, and the ConditionEvaluator performs strict <code>==</code> comparison."
    },
    "fees": {
      "col_method": "Method", "col_enum": "Enum Value", "col_desc": "Description", "col_example": "Example",
      "row": {
        "fixed_exp": "Fixed Expedition",
        "fixed_exp_desc": "Fixed price for new applications",
        "fixed_exp_ex": "Pasaporte: 35,000 FCFA",
        "fixed_ren": "Fixed Renewal",
        "fixed_ren_desc": "Fixed price for renewals",
        "fixed_ren_ex": "Conducir renewal: 15,000 FCFA",
        "percent": "Percentage-based",
        "percent_desc": "Percentage of a base amount",
        "percent_ex": "IVA: 15% of taxable base",
        "unit": "Unit-based",
        "unit_desc": "Price per unit (pages, items)",
        "unit_ex": "Contrato: price per page",
        "tiered": "Tiered Rates",
        "tiered_desc": "Rates change based on thresholds",
        "tiered_ex": "Visa Alternativo: 3/6/12/24 month tiers",
        "formula": "Formula-based",
        "formula_desc": "Custom formula evaluation",
        "formula_ex": "Complex tax calculations",
        "fixed_unit": "Fixed + Unit",
        "fixed_unit_desc": "Base fee plus per-unit charge",
        "fixed_unit_ex": "Base + per-employee charge"
      }
    },
    "routing": {
      "intro": "Entity routing is entirely <strong>database-driven</strong>. The <code>entities.workflow_codes</code> JSONB column determines which entity handles which workflow. This is managed via the admin UI, with no code changes required.",
      "callout_title": "No Code Routing",
      "callout_body": "Never create <code>get_issuing_entities()</code> functions in code. The <code>entity_code</code> field on <code>PredefinedWorkflow</code> is declarative/audit only. Actual routing is resolved from <code>entities.workflow_codes</code> at runtime."
    },
    "ocr": {
      "intro": "40 JSON schema files define the OCR extraction templates for document types used across workflows. These are stored in <code>packages/backend/app/modules/service_requests/schemas/</code>.",
      "summary": "All 40 OCR Schemas",
      "col_file": "Schema File",
      "col_doctype": "Document Type",
      "doc": {
        "dip": "National ID (DIP) - Equatorial Guinea",
        "pasaporte_gq": "Passport - Equatorial Guinea",
        "pasaporte_int": "Passport - International",
        "nacimiento": "Birth certificate",
        "medico": "Medical certificate",
        "conducta": "Good conduct certificate",
        "conducir": "Driving license",
        "defuncion": "Death certificate",
        "nif": "Tax ID (NIF)",
        "padron": "Census certificate",
        "solvencia": "Tax solvency certificate",
        "onrc": "ONRC contract",
        "compraventa": "Sale contract",
        "contrato_func": "Civil servant contract",
        "residencia": "Residence permit",
        "trabajo": "Work permit",
        "circulacion": "Vehicle circulation permit",
        "visado": "Visa",
        "sello": "Entry/exit stamp",
        "itv": "Vehicle inspection (ITV)",
        "reco_veh": "Vehicle recognition certificate",
        "carnet_func": "Civil servant ID",
        "nombramiento": "Official appointment",
        "dgi_note": "DGI income note",
        "res_note": "Residence income note",
        "escritura": "Company formation deed",
        "cuve": "CUVE document",
        "licencia_muni": "Municipal commerce license",
        "reg_comercio": "Commerce registry",
        "reg_emp": "Business registry",
        "reg_vue": "VUE registry",
        "conciso": "Concise commercial certificate",
        "actualizacion": "Business update certificate",
        "atestacion": "Bank attestation",
        "antecedentes": "Criminal record",
        "gubernativa": "Government authorization",
        "parental": "Parental authorization",
        "cert_nac": "Birth certification",
        "decl_nac": "Birth declaration",
        "casier": "International criminal record extract"
      }
    },
    "appt": {
      "intro": "Appointment-enabled workflows use a 2-table system to prevent double-booking:",
      "col_table": "Table", "col_purpose": "Purpose", "col_lifetime": "Lifetime",
      "row": {
        "holds": "Temporary hold during wizard flow",
        "holds_ttl": "15 minutes TTL",
        "reservations": "Permanent confirmed reservation",
        "reservations_ttl": "Permanent"
      },
      "fns_intro": "Three SQL functions manage the appointment lifecycle:",
      "fn1": "<code>hold_appointment_slot()</code> &mdash; Creates temporary hold, counts held+confirmed",
      "fn2": "<code>confirm_appointment_hold()</code> &mdash; Converts hold to confirmed + INSERT reservation",
      "fn3": "<code>get_available_slots_v3()</code> &mdash; Returns available slots (counts reservations + holds)"
    },
    "val": {
      "diagram_title": "Validation Architecture",
      "layer1": "Layer 1: Upload Step",
      "layer1_sub": "SchemaValidationEngine (70+ JSON rules) + RiskAnalyzer (12 steps)",
      "layer2": "Layer 2: Form Review Step",
      "layer2_sub": "validate_step() overrides only (real Python)",
      "point1": "<strong>Schema</strong> (Layer 1) = Document validity (format, signatures, required fields, temporal validity)",
      "point2": "<strong>validate_step</strong> (Layer 2) = Business decision (what the result means for THIS workflow)",
      "point3": "<strong>Never duplicate rules between layers.</strong> If schema has <code>certificado_vigente</code>, do not recreate in validate_step."
    }
  },

  "indexpage": {
    "html_title": "Facil Platform Documentation",
    "title": "Facil Platform Documentation",
    "breadcrumb": "Documentation Home",
    "description": "Comprehensive technical reference for the Facil government digital services platform. Built for the Republic of Equatorial Guinea to process fiscal services, manage civil procedures, and support 100+ concurrent government agents across multiple ministries.",
    "stats": {
      "fiscal": "Fiscal Services",
      "tables": "Database Tables",
      "workflows": "Workflows",
      "roles": "Roles",
      "backend": "Backend Modules",
      "frontend": "Frontend Modules",
      "routers": "API Routers",
      "ocr": "OCR Schemas"
    },
    "docmap": {
      "title": "Documentation Map",
      "architecture": "— Monorepo structure, 3-tier backend, frontend modules, caching, AI pipeline",
      "api": "— 62 routers, authentication, request/response formats, rate limiting",
      "database": "— 145 tables across 10 domains, 50 enums, naming conventions, migrations",
      "workflows": "— 36 workflows, wizard steps, condition evaluator, fee calculation, entity routing",
      "modules": "— 30 backend modules, 41+ frontend modules, organized by domain",
      "agents": "— RAG chatbot, 5 role-based agents, OCR extraction, smart assignment",
      "payments_title": "Payment Systems",
      "payments": "— BANGE integration, atomic payments, bundle flows, financial reporting",
      "security_title": "Security Architecture",
      "security": "— JWT + 2FA, RBAC with 335 permissions, OWASP compliance, audit logging",
      "deployment_title": "Deployment & Operations",
      "deployment": "— CI/CD pipeline, Cloud Run, Firebase Hosting, monitoring",
      "i18n": "— Trilingual support (ES/FR/EN), 11,400+ keys, translation architecture",
      "grafana": "— 10 production dashboards, Analytics Engineering, semantic data layer, decision-driven KPIs",
      "logrocket": "— Session replay (web + mobile + inspector), privacy-first PII redaction, Sentry bridge, daily usage flows"
    },
    "overview": {
      "title": "Platform Overview",
      "body1": "<strong>Facil</strong> is a full-stack, AI-powered framework for digitizing government administrative procedures and company-related processes. It ships as a complete platform &mdash; <strong>backend API, web dashboard, citizen mobile app, and field inspection app</strong> &mdash; that any government can configure to run its own fiscal services, workflows, document processing, and citizen interactions, end-to-end.",
      "body2": "The framework is <strong>country-agnostic by design</strong>: workflows, fiscal services, entities, roles, translations, and business rules are all <em>data-driven</em> and configurable through the database and admin UI &mdash; not hardcoded. Deploying Facil to a new country means <em>configuring</em> services, entities, and workflows, not rewriting code. Built-in AI (Gemini 2.5 Flash via Vertex AI + pgvector RAG) powers the chatbot, OCR/IDP document intelligence, automated risk scoring, and agent decision support.",
      "body3": "<strong>Current deployment &mdash; Republic of Equatorial Guinea</strong>: 873 fiscal services across 20 government entities (DGI, CNEDOGE, DGT, Extranjer&iacute;a, Ayuntamiento, C&aacute;mara de Comercio, Tesoro P&uacute;blico, MINFP, ITV, ONRC, OFIVE, plus 8 ministerial entities), 21 ministries directory, 34 sites in 17 cities, 36 business workflows, 47 roles with 337 granular permissions, fully trilingual UI (Spanish, French, English)."
    },
    "stack": {
      "title": "Technology Stack",
      "col_layer": "Layer", "col_tech": "Technology", "col_version": "Version", "col_purpose": "Purpose",
      "row": {
        "api": "Backend API", "api_purpose": "REST API with automatic OpenAPI docs",
        "runtime": "Runtime", "runtime_purpose": "Async-first with asyncio/asyncpg",
        "db": "Database", "db_purpose": "Primary data store with pgvector",
        "cache": "Cache", "cache_purpose": "Caching with in-memory fallback",
        "frontend": "Frontend", "frontend_purpose": "App Router with SSR and i18n",
        "ui": "UI Framework", "ui_purpose": "Component library with Tailwind CSS",
        "mobile": "Mobile", "mobile_purpose": "Android/iOS citizen and inspector apps",
        "ai": "AI", "ai_purpose": "RAG chatbot, document analysis, risk scoring",
        "cloud": "Cloud", "cloud_purpose": "Serverless container deployment",
        "hosting": "Hosting", "hosting_purpose": "Frontend CDN with staging channels",
        "storage": "Storage", "storage_purpose": "Document and file storage with signed URLs",
        "cicd": "CI/CD", "cicd_purpose": "8 workflow files (CI, deploy, build)",
        "errors": "Error Tracking", "errors_purpose": "Backend + web + mobile + inspector exceptions, releases, source maps",
        "replay": "Session Replay", "replay_purpose": "Web + mobile + inspector replays with PII redaction, Sentry bridge",
        "metrics": "Metrics & Alerts", "metrics_purpose": "10 operational dashboards, dual-provider Postgres, on-call alerts",
        "bi": "Business Dashboards", "bi_purpose": "Embedded BI with admin-managed report IDs (no redeploy)",
        "audit": "Audit & Logs", "audit_purpose": "Structured logs, in-DB audit_logs trail, permission_audit_log"
      }
    },
    "monorepo": { "title": "Monorepo Structure" },
    "qs": {
      "title": "Quick Start",
      "backend_title": "Backend Development",
      "frontend_title": "Frontend Development",
      "callout_title": "Important",
      "callout_body": "Never build manually with <code>gcloud</code>. All deployments must go through GitHub Actions. Push to the <code>develop</code> branch and the CI/CD pipeline will handle building and deploying both backend (Cloud Run) and frontend (Firebase Hosting) automatically."
    },
    "pages": { "title": "Documentation Pages" },
    "cards": {
      "architecture": "Backend 3-tier design, frontend module structure, caching layers, AI pipeline, mobile apps, and deployment topology.",
      "api": "All 62 API routers, authentication flows, request/response formats, error handling, rate limiting, and pagination.",
      "database": "145 tables across 10 domains, 50 enums with all values, naming conventions, and key relationships.",
      "workflows": "36 workflow definitions, wizard step flow, dynamic conditions, fee calculation, OCR integration, and entity routing.",
      "modules": "30 backend modules and 41+ frontend modules organized by domain, with key endpoints, tables, and dependencies.",
      "agents": "RAG chatbot with Gemini 2.5 Flash, 5 role-based agents, OCR document processing, and smart assignment engine.",
      "payments": "BANGE integration, atomic payment pipeline, bundle multi-entity flows, financial reporting, and receipt generation.",
      "security": "JWT + 2FA authentication, RBAC with 47 roles and 335 permissions, OWASP compliance, CSP headers, and audit logging.",
      "deployment_title": "Deployment & Ops",
      "deployment": "8 GitHub Actions workflows, Cloud Run containers, Firebase Hosting, environment management, and monitoring.",
      "i18n": "Trilingual support (Spanish, French, English), 11,400+ translation keys, backend entity translations, and template rendering.",
      "grafana": "10 production-grade dashboards, 4-layer semantic data architecture, multi-source site resolution, and decision-driven KPIs for treasury, agents, and inspectors.",
      "logrocket": "Session replay on web + mobile + inspector with 4-layer PII redaction, identify policy enforcement, and Sentry bridge for forensic debugging."
    },
    "dec": {
      "title": "Key Architecture Decisions",
      "col_decision": "Decision", "col_choice": "Choice", "col_rationale": "Rationale",
      "row": {
        "api": "API Framework", "api_choice": "FastAPI (async)", "api_rationale": "Native async, auto OpenAPI docs, Pydantic v2 validation, high throughput",
        "driver": "Database Driver", "driver_choice": "asyncpg (not ORM)", "driver_rationale": "Raw parameterized SQL for maximum control, performance, and security",
        "routing": "Frontend Routing", "routing_choice": "Next.js App Router with [locale]", "routing_rationale": "Server-side rendering, built-in i18n, route groups for auth/dashboard/public",
        "state": "State Management", "state_choice": "React Query + Zustand", "state_rationale": "Server state (Query) vs client state (Zustand) separation",
        "deploy": "Deployment", "deploy_choice": "Cloud Run + Firebase Hosting", "deploy_rationale": "Serverless scaling, zero infra management, CDN distribution",
        "entity": "Entity Routing", "entity_choice": "Database-driven (entities.workflow_codes)", "entity_rationale": "No code changes needed to assign workflows to entities, admin UI managed",
        "cache": "Cache Strategy", "cache_choice": "HybridCache (Redis + in-memory fallback)", "cache_rationale": "Graceful degradation if Redis unavailable, domain-specific TTLs",
        "ai": "AI Model", "ai_choice": "Gemini 2.5 Flash via Vertex AI", "ai_rationale": "Fast inference, tool-use support, cost-effective for government workloads"
      }
    },
    "ent": {
      "title": "Government Entities",
      "intro": "Facil serves multiple government entities across Equatorial Guinea, each managing specific fiscal services and workflows:",
      "col_entity": "Entity", "col_code": "Code", "col_domain": "Domain",
      "row": {
        "dgi": "Tax declarations, fiscal services",
        "cnedoge": "Passport services",
        "dgt": "Vehicle registration, driving permits",
        "extranjeria": "Residence permits, visa procedures",
        "ayuntamiento": "Municipal services, commercial licenses",
        "camara": "Business registration, commercial certificates",
        "tesoro": "Treasury, payment processing",
        "funcion": "Civil service, employee verification",
        "various": "Various Ministries",
        "min": "Sector-specific inspections and permits"
      }
    },
    "footer": "Facil Platform v1.1.8 · Republic of Equatorial Guinea · © 2026 Sah Kouemou",
    "footer.dashboards": "Dashboards"
  },

  "api": {
    "html_title": "API Reference - Facil Documentation",
    "title": "API Reference",
    "description": "The Facil backend exposes 62 API routers via FastAPI, all mounted under the <code>/api/v1</code> prefix. This reference covers authentication, request conventions, and key endpoints by domain.",
    "toc": {
      "base_url": "Base URL & Conventions",
      "auth": "Authentication",
      "errors": "Error Handling",
      "rate": "Rate Limiting",
      "routers": "All 62 API Routers",
      "auth_ep": "Auth Endpoints",
      "user_ep": "User Endpoints",
      "fiscal_ep": "Fiscal Services Endpoints",
      "sr_ep": "Service Requests Endpoints",
      "pay_ep": "Payment Endpoints",
      "chat_ep": "Chatbot Endpoints",
      "admin_ep": "Admin Endpoints"
    },
    "base": {
      "col_env": "Environment", "col_url": "Base URL",
      "row": { "prod": "Production", "local": "Local Dev" }
    },
    "headers": { "title": "Request Headers" },
    "pag": { "title": "Pagination", "intro": "List endpoints accept standard pagination parameters:", "meta": "Response includes pagination metadata:" },
    "auth": {
      "flow_title": "Authentication Flow",
      "step1": "Login (email+password)",
      "step2": "Verify credentials",
      "step3": "2FA check (if enabled)",
      "step4": "Issue JWT pair",
      "col_token": "Token", "col_lifetime": "Lifetime", "col_purpose": "Purpose",
      "row": {
        "access": "Access Token", "access_life": "30 minutes", "access_purpose": "API authorization (Bearer header)",
        "refresh": "Refresh Token", "refresh_life": "30 days", "refresh_purpose": "Obtain new access tokens without re-login"
      },
      "jwt_title": "JWT Payload",
      "2fa_title": "Two-Factor Authentication (2FA)",
      "2fa_body": "Optional TOTP-based 2FA using <code>pyotp</code>. When enabled, login returns a <code>2fa_required</code> flag and the client must submit the TOTP code to complete authentication."
    },
    "err": {
      "intro": "All errors follow a consistent response schema with trilingual support:",
      "col_status": "HTTP Status", "col_code": "Error Code", "col_desc": "Description",
      "row": {
        "400": "Invalid request parameters",
        "401": "Missing or invalid JWT token",
        "403": "Insufficient permissions (RBAC)",
        "404": "Resource not found",
        "409": "Resource conflict (duplicate, version mismatch)",
        "422": "Pydantic validation failure (detailed field errors)",
        "429": "Rate limit exceeded",
        "500": "Internal error (details sanitized for clients)"
      },
      "callout_title": "Security Note",
      "callout_body": "For 5xx errors, the backend sanitizes the <code>detail</code> field to prevent leaking internal exception messages. Full stack traces are logged server-side via Loguru."
    },
    "rate": {
      "intro": "Rate limiting is enforced per user (or IP for unauthenticated endpoints) via the Redis-backed <code>check_rate_limit()</code> function.",
      "col_cat": "Endpoint Category", "col_limit": "Limit", "col_window": "Window",
      "row": {
        "auth": "Authentication (login/register)", "auth_limit": "10 requests",
        "chat": "Chatbot messages", "chat_limit": "30 requests",
        "general": "General API (authenticated)", "general_limit": "100 requests",
        "upload": "File uploads", "upload_limit": "20 requests",
        "window": "60 seconds"
      }
    },
    "routers": {
      "auth": "Authentication & Users (5 routers)",
      "fiscal": "Fiscal Services & Bundles (7 routers)",
      "sr": "Service Requests (6 routers)",
      "pay": "Payments & Verification (3 routers)",
      "agents": "Agents & Assignments (5 routers)",
      "admin": "Admin & Permissions (7 routers)",
      "tr": "Translations & i18n (4 routers)",
      "comm": "Communications (6 routers)",
      "companies": "Companies (5 routers)",
      "insp": "Inspections (4 routers)",
      "other": "Other (10 routers)",
      "col_router": "Router", "col_prefix": "Prefix", "col_tags": "Tags"
    },
    "ep": {
      "auth": {
        "login": "Email + password login, returns JWT pair",
        "register": "Create new user account",
        "refresh": "Exchange refresh token for new access token",
        "verify": "Send email verification code",
        "reset": "Request password reset email",
        "change": "Change password (authenticated)",
        "2fa_setup": "Initialize TOTP 2FA setup",
        "2fa_verify": "Verify TOTP code during login",
        "logout": "Revoke refresh token"
      },
      "user": {
        "me": "Get current user profile",
        "update": "Update current user profile",
        "byid": "Get user by ID (admin)"
      },
      "fs": {
        "list": "List all fiscal services (873 total, paginated)",
        "detail": "Get service details with tariff info",
        "search": "Full-text search (tsvector)",
        "ministry": "Services filtered by ministry"
      },
      "sr": {
        "create": "Create new service request",
        "list": "List user service requests",
        "detail": "Get request details",
        "wizard_create": "Create wizard session (cache-first flow)",
        "wizard_update": "Update wizard step data",
        "initiate": "Atomic persist + payment"
      },
      "pay": {
        "initiate": "Initiate payment (BANGE or manual)",
        "detail": "Get payment details",
        "webhook": "BANGE payment callback",
        "verify": "Verify payment receipt"
      },
      "chat": {
        "message": "Send message to AI chatbot",
        "list": "List conversation history",
        "detail": "Get conversation messages"
      },
      "admin": {
        "health": "System health dashboard",
        "users": "List all users (admin only)",
        "audit": "Query audit logs (2800+ entries)",
        "menu_me": "Get agent menu for current user",
        "menu_map": "List workflow-to-menu mappings"
      }
    }
  },

  "arch": {
    "html_title": "System Architecture - Facil Documentation",
    "description": "Facil is a monorepo-based platform with 4 packages: a Python/FastAPI backend, a Next.js frontend, and two Expo React Native mobile applications. This document details the architecture of each layer.",
    "toc": {
      "overview": "System Overview",
      "backend": "Backend 3-Tier Architecture",
      "frontend": "Frontend Architecture",
      "mobile": "Mobile Architecture",
      "db": "Database Architecture",
      "caching": "Caching Architecture",
      "ai": "AI Architecture",
      "event": "Event Bus & Background Processing"
    },
    "overview": {
      "diagram_title": "High-Level System Architecture",
      "citizens": "Citizens / Businesses", "citizens_sub": "Web Browser + Mobile App",
      "gov_agents": "Government Agents", "gov_agents_sub": "Agent Dashboard",
      "inspectors": "Inspectors", "inspectors_sub": "Inspector Mobile App",
      "firebase_sub": "CDN + Staging Channels",
      "nextjs_sub": "SSR + App Router + i18n (ES/FR/EN)",
      "https": "▼ HTTPS / REST API",
      "cloudrun_sub": "Auto-scaling containers",
      "fastapi_sub": "Python 3.11+ / asyncio",
      "pg_sub": "145 tables + pgvector",
      "redis_sub": "Cache + Rate Limits",
      "storage_sub": "Documents + Files",
      "body": "The platform follows a strict separation of concerns with the backend serving as a stateless REST API consumed by multiple clients (web frontend, two mobile apps). All state is stored in PostgreSQL with Redis as a performance cache layer. External services include Vertex AI for intelligence features and BANGE for payment processing."
    },
    "backend": {
      "intro": "The backend follows a strict 3-tier layered architecture within each of its 30 feature modules. Each layer has a single responsibility and communicates only with its adjacent layer.",
      "diagram_title": "Backend Layer Architecture",
      "api_layer": "API Layer", "api_layer_sub": "FastAPI Routers + Middleware + Auth Guards",
      "connector1": "Pydantic v2 Request/Response Models",
      "svc_layer": "Service Layer", "svc_layer_sub": "Business Logic + Validation + Rules Engine",
      "connector2": "Domain Objects / Dicts",
      "repo_layer": "Repository Layer", "repo_layer_sub": "asyncpg + Parameterized SQL + Connection Pool",
      "connector3": "asyncpg Records",
      "pg_sub": "Supabase-hosted",
      "api_title": "API Layer",
      "api_intro": "The API layer consists of 62 FastAPI routers registered in <code>app/main.py</code>. Each router:",
      "api": {
        "bullet1": "Defines HTTP endpoints with type-annotated parameters",
        "bullet2": "Applies authentication and permission decorators (<code>@permission_required</code>)",
        "bullet3": "Validates input via Pydantic v2 models",
        "bullet4": "Delegates to the service layer for business logic",
        "bullet5": "Returns structured JSON responses with error codes"
      },
      "svc_title": "Service Layer",
      "svc_body": "Services contain all business logic, validation, and coordination between repositories. They handle transaction management, event publishing, and cross-module orchestration.",
      "repo_title": "Repository Layer",
      "repo_body": "Repositories are the <strong>only</strong> layer that interacts with the database. All queries use <strong>parameterized SQL</strong> with <code>$1, $2</code> placeholders (never string formatting) for SQL injection prevention.",
      "modstruct_title": "Module File Structure",
      "startup_title": "Application Startup Sequence",
      "startup_intro": "The FastAPI application initializes in this order during startup (defined in <code>main.py</code> lifespan):",
      "startup": {
        "s1": "<strong>Database pool</strong> &mdash; asyncpg connection pool (5-20 connections)",
        "s2": "<strong>Permissions sync</strong> &mdash; RBAC auto-discovery, role sync, obsolete cleanup",
        "s3": "<strong>Workflow sync</strong> &mdash; Python workflow classes synced to database (tariffs, docs, menus)",
        "s4": "<strong>Event Bus</strong> &mdash; Registers notification, audit, agent queue, payment assignment, and verification handlers",
        "s5": "<strong>Orphan repair</strong> &mdash; Self-healing for PAID requests not assigned to agents",
        "s6": "<strong>Cache system</strong> &mdash; Upstash Redis with in-memory fallback",
        "s7": "<strong>RBAC listener</strong> &mdash; PostgreSQL NOTIFY for real-time permission invalidation",
        "s8": "<strong>Internal scheduler</strong> &mdash; Cron jobs (replaces Cloud Scheduler)"
      }
    },
    "frontend": {
      "diagram_title": "Frontend Module Architecture",
      "modules": "41+ Feature Modules", "modules_sub": "components / hooks / services / types",
      "core": "Core Layer", "core_sub": "api/client.ts, auth, providers",
      "shadcn_sub": "Tailwind CSS styling",
      "rq_sub": "Server state",
      "zustand_sub": "Client state",
      "routes_title": "Route Groups",
      "col_group": "Group", "col_path": "Path", "col_purpose": "Purpose", "col_auth": "Auth Required",
      "no": "No", "yes_jwt": "Yes (JWT)",
      "row": {
        "auth_path": "<code>/[locale]/login</code>, <code>/register</code>, etc.",
        "auth_purpose": "Authentication pages",
        "public_path": "<code>/[locale]/services</code>, <code>/about</code>",
        "public_purpose": "Public information",
        "dash_purpose": "Protected user/agent area"
      },
      "modpat_title": "Frontend Module Pattern"
    },
    "mobile": {
      "intro": "Two separate Expo (React Native) applications serve different user groups:",
      "col_app": "App", "col_pkg": "Package", "col_users": "Users", "col_status": "Status",
      "row": {
        "citizen": "Facil (Citizen)",
        "citizen_users": "Citizens, businesses",
        "citizen_status": "P2 complete (dashboard, listings, services)",
        "inspector_users": "Field inspection agents",
        "inspector_status": "P0 architecture ready"
      },
      "stack_title": "Mobile Technology Stack",
      "stack": {
        "framework": "<strong>Framework:</strong> Expo SDK 54 with Expo Router (file-based routing)",
        "ui": "<strong>UI:</strong> React Native Paper (Material Design 3)",
        "state": "<strong>State:</strong> React Query (server) + Zustand (client)",
        "validation": "<strong>Validation:</strong> Zod schemas on all forms",
        "i18n": "<strong>Internationalization:</strong> 3 languages (ES/FR/EN)",
        "design": "<strong>Design principle:</strong> Native Android patterns (flat lists, dividers, ripple effects)"
      }
    },
    "db": {
      "intro": "PostgreSQL hosted on Supabase serves as the primary data store. The schema includes 145 tables organized across 10 domains, with pgvector extension for AI embedding storage.",
      "diagram_title": "Database Connection Architecture",
      "fastapi": "FastAPI Application",
      "pool_sub": "min=5, max=20 connections",
      "pg_sub": "145 tables + 50 enums + pgvector",
      "features_intro": "Key database features:",
      "feat": {
        "pool": "<strong>Connection pooling:</strong> asyncpg pool with 5-20 connections, auto-reconnect",
        "lock": "<strong>Lock ordering:</strong> Canonical lock sequence for bundle payments to prevent deadlocks",
        "soft": "<strong>Soft deletes:</strong> <code>deleted_at</code> timestamp pattern on applicable tables",
        "audit": "<strong>Audit trail:</strong> <code>created_at</code>, <code>updated_at</code> on all tables",
        "pgvector": "<strong>pgvector:</strong> For RAG chatbot embedding storage and similarity search",
        "tsvector": "<strong>tsvector:</strong> Full-text search on fiscal services catalog"
      },
      "see_also": "See <a href=\"database.html\">Database Schema Reference</a> for the full table catalog."
    },
    "cache": {
      "intro": "The <code>HybridCache</code> system (<code>app/core/cache.py</code>) provides Redis (Upstash TLS) as primary cache with automatic in-memory fallback when Redis is unavailable.",
      "col_instance": "Cache Instance", "col_factory": "Factory Function", "col_ttl": "TTL", "col_purpose": "Purpose",
      "5min": "5 min", "10min": "10 min", "30min": "30 min", "1h": "1 hour",
      "row": {
        "default": "Default", "default_purpose": "General-purpose caching",
        "menu": "Menu", "menu_purpose": "Menu configurations per role",
        "perm": "Permissions", "perm_purpose": "RBAC permission sets per user",
        "svc": "Services", "svc_purpose": "Fiscal services catalog (873 items)",
        "tr": "Translations", "tr_purpose": "UI and entity translations",
        "wm": "Workflow Mappings", "wm_purpose": "Workflow menu mapping rules",
        "sess": "Sessions", "sess_purpose": "User session data"
      },
      "features_intro": "Additional cache features:",
      "feat": {
        "rate": "<strong>Rate limiting:</strong> <code>check_rate_limit(identifier, endpoint, max_requests, window_seconds)</code>",
        "invalidate": "<strong>Cache invalidation:</strong> <code>invalidate_user_permissions_cache(user_id)</code> triggered by PostgreSQL NOTIFY",
        "listener": "<strong>RBAC listener:</strong> Real-time cache invalidation via <code>app/core/rbac_listener.py</code> subscribed to PostgreSQL NOTIFY channel",
        "dec": "<strong>Decorators:</strong> <code>@cached(cache_getter, ttl)</code> for transparent result caching"
      }
    },
    "ai": {
      "diagram_title": "AI / RAG Pipeline",
      "user_query": "User Query",
      "preproc": "Query Preprocessor", "preproc_sub": "Language detection, intent classification",
      "hybrid": "Hybrid Search", "hybrid_sub": "70% pgvector cosine + 30% tsvector",
      "context": "Context Assembly", "context_sub": "Relevant docs + user context + tools",
      "gemini_sub": "35 tools + self-reflection loop",
      "response": "Response", "response_sub": "15 formats + score check (re-gen if <5/10)",
      "body": "The AI system uses Gemini 2.5 Flash via Google Vertex AI with a Retrieval-Augmented Generation (RAG) pipeline. It supports 35 specialized tools (19 public, 8 authenticated, 8 deep reasoning) and 5 role-based agent configurations. The self-reflection loop scores each response and regenerates if quality is below 5/10.",
      "see_also": "See <a href=\"agents.html\">AI &amp; Intelligence</a> for the complete AI reference."
    },
    "event": {
      "intro": "The <code>EventBus</code> (<code>app/core/events.py</code>) provides an in-process publish/subscribe system for decoupled cross-module communication.",
      "handlers_title": "Registered Event Handlers",
      "col_handler": "Handler", "col_module": "Module", "col_events": "Events",
      "row": {
        "notif": "Notification Handler", "notif_events": "Request status changes, payment events",
        "audit": "Audit Handler", "audit_events": "All critical operations (audit_logs table)",
        "queue": "Agent Queue Handler", "queue_events": "Payment completed, request submitted",
        "pay": "Payment Assignment Handler", "pay_events": "Auto-assign manual payments to Treasury",
        "verif": "Verification Handler", "verif_events": "External document verification events"
      },
      "sched_title": "Internal Scheduler",
      "sched_intro": "The <code>internal_scheduler</code> (<code>app/core/scheduler.py</code>) runs periodic tasks within the application process, replacing the need for an external Cloud Scheduler:",
      "sched": {
        "appt": "Appointment hold expiration (15-minute TTL cleanup)",
        "sla": "SLA deadline monitoring and escalation",
        "workload": "Agent workload rebalancing",
        "warm": "Cache warm-up for frequently accessed data"
      }
    }
  },

  "lr": {
    "html_title": "LogRocket Observability - Facil Documentation",
    "title": "LogRocket — Session Replay & Privacy-First Observability",
    "description": "LogRocket is wired across <strong>3 surfaces</strong> (web, mobile, inspector) as the «CCTV» of the Facil platform. While Sentry catches crashes after they happen, LogRocket records <em>what the user did</em> before, during, and after — making citizen-reported bugs and UX frictions reproducible without ever asking the user to repeat steps.",
    "toc": {
      "why": "1. Why LogRocket (and why not just Sentry)",
      "architecture": "2. Architecture — 3 surfaces, 1 SDK family",
      "privacy": "3. Privacy-first design (PII redaction)",
      "wiring": "4. Repository wiring (file-by-file)",
      "secrets": "5. Secret topology",
      "flows": "6. Daily usage flows",
      "tour": "7. LogRocket dashboard tour",
      "bridge": "8. The Sentry bridge",
      "limits": "9. Limits, traps, roadmap"
    },
    "why": {
      "intro": "LogRocket and Sentry look similar at first — both «catch errors» — but they solve different problems. Picking the right one under pressure is half the on-call skill.",
      "both_title": "Why we run both",
      "both1": "<strong>Sentry's strength is alerting + grouping</strong>. When error rate spikes, Sentry pings the on-call and dedupes by stack-trace fingerprint. Cheap, low-volume.",
      "both2": "<strong>LogRocket's strength is context</strong>. When a citizen says \"the app crashed when I clicked submit\", you replay that exact session and <em>see</em> the bug, not just the symptom.",
      "both3": "<strong>They complement each other</strong>: Sentry detects → LogRocket explains. The bridge (<code>bridgeLogRocketToSentry()</code>) attaches the LogRocket session URL to every Sentry event, so an Issue in Sentry deep-links straight to its replay in one click.",
      "pitfall_title": "Common pitfall",
      "pitfall_body": "\"I have Sentry, I don't need LogRocket\" — <strong>wrong</strong>. UX bugs (frozen UI, wrong navigation, confusing form) leave no Sentry trace because no exception is thrown. LogRocket is the only tool that captures <em>non-error sessions</em>, which is exactly what you need to diagnose a citizen complaint about the wizard."
    },
    "compare": {
      "cadence": "Capture cadence", "cadence_sentry": "At error time only", "cadence_lr": "<strong>Continuously</strong>, like a CCTV",
      "stored": "What's stored", "stored_sentry": "Stack trace + 60 s of breadcrumbs", "stored_lr": "<strong>Full session video</strong> — clicks, scrolls, network, console, redux/zustand",
      "pricing": "Pricing model", "pricing_sentry": "Per error event", "pricing_lr": "Per <strong>session</strong> (one user visit = one session)",
      "tier": "Free tier", "tier_sentry": "5K errors / month", "tier_lr": "1K sessions / month",
      "best": "Best for", "best_sentry": "\"Why did this crash?\" — root-cause", "best_lr": "\"What did the user do before X?\" — reproduce a parcours",
      "trigger": "Trigger", "trigger_sentry": "<code>captureException(err)</code> or auto-uncaught", "trigger_lr": "SDK init at boot → captures until session end",
      "ui": "Primary UI", "ui_sentry": "Issues / Errors list", "ui_lr": "Sessions list with replay video"
    },
    "arch": {
      "diagram_title": "LogRocket coverage matrix",
      "web": "Web (Next.js 14)",
      "mobile": "Mobile citizen app (Expo SDK 54)",
      "inspector": "Inspector app (Expo SDK 54)",
      "single": "Single LogRocket project",
      "single_sub": "app.logrocket.com/0eqns2/facil — shared 1K sessions/month quota",
      "pii": "PII redaction (3-layer defense)",
      "pii_sub": "SDK options + sanitizers + DOM/JSX opt-in",
      "bridge": "Sentry bridge (web today)",
      "bridge_sub": "extra.logrocketURL on every Sentry event",
      "policy_title": "Per-surface init policy",
      "col_surface": "Surface", "col_init": "Init location", "col_noop": "Auto no-op when", "col_default": "Default capture",
      "row": {
        "web": { "name": "<strong>Web</strong>", "init": "<code>&lt;LogRocketProvider&gt;</code> mounted in <code>Providers.tsx</code>", "noop": "<code>NODE_ENV=development</code> OR empty <code>NEXT_PUBLIC_LOGROCKET_APP_ID</code> OR SSR (<code>!window</code>)", "default": "Capture all visible text; <strong>opt-out</strong> via <code>data-private=\"redact\"</code>" },
        "mobile": { "name": "<strong>Mobile</strong>", "init": "<code>initLogRocket()</code> in <code>&lt;DeferredEffects&gt;</code> of <code>_layout.tsx</code>", "noop": "<code>__DEV__=true</code> OR empty <code>EXPO_PUBLIC_LOGROCKET_APP_ID</code>", "default": "Redact all text; <strong>opt-in</strong> via <code>&lt;LRAllow&gt;</code>" },
        "insp": { "name": "<strong>Inspector</strong>", "init": "Same as mobile", "default": "Same as mobile (RN-default redact)" }
      },
      "opposite_title": "Why opposite defaults (web vs mobile)?",
      "opposite_body": "Web is desktop, often used by agents on shared machines — capturing is more useful for triage and the desktop browser doesn't usually contain the same intensity of PII as a personal device. Mobile is a personal device with sensitive forms (passport, NIF, address) — redacting by default is safer. The trade-off cost: replays on mobile are less informative until you audit each screen and wrap non-PII zones with <code>&lt;LRAllow&gt;</code>."
    },
    "priv": {
      "intro": "Facil processes citizen passports, NIFs, declarations, payment receipts. PII leakage to a third-party SaaS is a regulatory risk. The SDK wrappers enforce <strong>4 layers of defense</strong>, each independently sufficient (defense-in-depth):",
      "l1": "<strong>L1 — SDK options</strong>: <code>inputSanitizer: true</code> (web) / <code>textSanitizer: 'excluded'</code> (mobile) masks raw user input before it ever leaves the device.",
      "l2": "<strong>L2 — Network sanitizers</strong>: every request strips <code>Authorization</code> + <code>Cookie</code> headers; bodies are dropped on <code>/auth/login</code>, <code>/auth/register</code>, <code>/auth/password-reset</code>, <code>/auth/2fa</code>; response bodies are dropped on token-issuing endpoints (<code>/auth/login</code>, <code>/auth/refresh</code>, <code>/auth/2fa</code>).",
      "l3": "<strong>L3 — DOM / JSX opt-in</strong>: app-team responsibility — tag PII fields explicitly. <code>data-private=\"redact\"</code> on web; <code>&lt;LRAllow&gt;</code> wrapping non-PII content on mobile (inverse: anything not wrapped stays masked).",
      "l4": "<strong>L4 — Identify policy</strong>: only <code>id + role + locale</code> are sent via <code>LogRocket.identify()</code>. <strong>Never</strong> email, phone, NIF, address. Enforced via TypeScript signature on the wrapper.",
      "other_title": "Other privacy-relevant defaults",
      "other": {
        "ip": "<code>shouldCaptureIP: false</code> (web) / <code>enableIPCapture: false</code> (mobile) — never geolocate users.",
        "console": "<code>console.isEnabled = { warn: true, error: true, log: false }</code> — drop developer logs that may carry sensitive context.",
        "release": "<code>release: NEXT_PUBLIC_BUILD_VERSION</code> — per-build session attribution for regression hunting."
      }
    },
    "wiring": {
      "web_title": "Web (<code>packages/web/</code>)",
      "web": {
        "wrapper": "<code>src/core/observability/logrocket.ts</code> — SDK wrapper (init, identify, track, capture, sentry bridge).",
        "provider": "<code>src/components/observability/LogRocketProvider.tsx</code> — client component mounted in <code>Providers.tsx</code>.",
        "storage": "<code>src/core/auth/storage.ts</code> — <code>identifyLogRocket</code> plugged into <code>setAuthData/clearAuthData</code>.",
        "env": "<code>.env.example</code> — <code>NEXT_PUBLIC_LOGROCKET_APP_ID</code>, <code>NEXT_PUBLIC_BUILD_VERSION</code>.",
        "docker": "<code>Dockerfile</code> — <code>ARG NEXT_PUBLIC_LOGROCKET_APP_ID</code> + <code>ENV</code> line.",
        "gha": "<code>.github/workflows/deploy-frontend-staging.yml</code> — passes <code>_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}</code> to Cloud Build."
      },
      "mobile_title": "Mobile (<code>packages/mobile/</code>)",
      "mobile": {
        "wrapper": "<code>src/core/observability/logrocket.ts</code> — LogRocket RN wrapper.",
        "sentry": "<code>src/core/observability/sentry.ts</code> — companion Sentry RN wrapper.",
        "layout": "<code>src/app/_layout.tsx</code> — <code>initSentry()</code> + <code>initLogRocket()</code> inside <code>&lt;DeferredEffects&gt;</code>.",
        "auth": "<code>src/core/auth/auth-provider.tsx</code> — <code>setSentryUser</code> + <code>identifyLogRocket</code> co-located.",
        "appjson": "<code>app.json</code> — <code>expo-build-properties</code> plugin: <code>minSdkVersion: 25</code> + <code>extraMavenRepos</code> (informational in non-CNG mode).",
        "gradle": "<code>android/build.gradle</code> — <code>ext.minSdkVersion = 25</code> + Maven repo entry (canonical in non-CNG mode — committed natives).",
        "eas": "<code>eas.json</code> — <code>EXPO_PUBLIC_LOGROCKET_APP_ID</code> in <code>preview</code> + <code>production</code> env blocks.",
        "easignore": "<code>.easignore</code> — overrides <code>.gitignore</code> so <code>/android</code> ships to EAS (without it: <code>ENOENT gradlew</code> at FIX_GRADLEW phase)."
      },
      "insp_title": "Inspector (<code>packages/inspector/</code>)",
      "insp_body": "Same files as mobile. No Sentry RN yet — <code>bridgeLogRocketToSentry()</code> is a no-op stub awaiting Sentry inspector integration."
    },
    "secrets": {
      "intro": "Origin of truth: <strong>Google Cloud Secret Manager</strong> (project <code>taxasge-dev</code>). The <code>logrocket-app-id</code> secret is mirrored to GitHub repo secrets and EAS env vars, stored as <strong>plaintext</strong> deliberately — the App ID is baked into the client bundle and visible in DevTools network anyway. Mirroring keeps a single rotation point.",
      "web_diagram": "Secret flow (Web)",
      "web_step1": "▼ manually mirrored once",
      "gh_secrets": "GitHub repo secrets",
      "docker": "Docker BUILDER stage (Next.js bake)",
      "docker_sub": "NEXT_PUBLIC_* embedded in client bundle",
      "browser": "End-user browser",
      "browser_sub": "SDK init at page load",
      "mobile_diagram": "Secret flow (Mobile / Inspector via EAS)",
      "eas_env": "EAS Cloud env (preview + production)",
      "eas_worker": "EAS Build worker (Expo CLI bake)",
      "eas_worker_sub": "EXPO_PUBLIC_* embedded in JS bundle",
      "artifact": "APK / IPA / AAB artifact",
      "artifact_sub": "Distributed via Play / App Store / direct",
      "full_topology": "Full secret topology + multi-cloud (AWS / Azure / VPS) migration: see <code>.claude/plans/OBSERVABILITY_STACK.md §2 / §5</code>."
    },
    "flow1": {
      "title": "Flow 1 — A user reports a bug (\"L'app a planté quand j'ai cliqué sur soumettre\")",
      "s1": "Open LogRocket dashboard → <strong>Session Replay</strong>.",
      "s2": "Filter by <code>user_id</code> (the value sent via <code>LogRocket.identify()</code> — <strong>not email</strong>, by design, since email is PII). If you only have an email, look up the user_id in the backend admin UI first.",
      "s3": "Click the most recent session in the result list.",
      "s4": "The replay video shows the exact parcours: clicks, scrolls, the form they filled, the moment of the crash.",
      "s5": "The right-side panel mirrors a DevTools view, time-aligned with the video — console errors, network requests, redux/zustand state.",
      "s6": "Click the failed request in the network panel → see request body + response → diagnose the cause without ever reproducing the bug.",
      "note": "<strong>Why not Sentry first</strong>: Sentry fires only if the bug throws an actual exception. UX bugs (frozen UI, wrong navigation, confusing form) leave no Sentry trace. LogRocket captures all of those."
    },
    "flow2": {
      "title": "Flow 2 — A production error spike",
      "intro": "Sentry alert: \"TypeError: Cannot read property 'name' of undefined — 12 occurrences in 5 minutes\".",
      "s1": "Sentry <strong>Issues</strong> → click the alert → see stack trace + frequency over time + which release introduced it.",
      "s2": "Open one of the affected sessions in LogRocket via <code>event.extra.logrocketURL</code> (the bridge link).",
      "s3": "LogRocket replay shows the sequence: user navigated to <code>/services</code>, clicked search, typed \"passport\", clicked one result. Network panel reveals <code>GET /api/services/12345</code> returned <code>null</code> instead of the expected object.",
      "s4": "You now know: backend regression, not a frontend bug.",
      "s5": "Roll back the backend release OR write a defensive frontend null-check."
    },
    "flow3": {
      "title": "Flow 3 — Optimising a funnel drop-off",
      "intro": "\"Why do 80% of users abandon at step 3 of the wizard?\"",
      "s1": "Find a custom event already wired through <code>trackLogRocket()</code> — e.g. <code>wizard_step_completed</code> with <code>{ step: number }</code>.",
      "s2": "LogRocket <strong>Dashboards</strong> → create a funnel: <code>wizard_step_completed</code> (step:1) → step:2 → step:3 → <code>wizard_submitted</code>.",
      "s3": "Funnel shows: 100% → 95% → 85% → <strong>15%</strong>. Massive drop at step 3.",
      "s4": "Filter sessions: those that hit step:3 but never <code>wizard_submitted</code>. Sample 10 replays.",
      "s5": "You observe a pattern: 6 of the 10 users stare at the \"NIF\" field for > 30 s, then abandon. The label is too technical.",
      "s6": "Ship a clearer label + tooltip. Re-measure the funnel a week later.",
      "note": "<strong>Why not Sentry</strong>: nothing crashed. There's no exception. This is a UX diagnosis pure and simple."
    },
    "tour": {
      "intro": "The LogRocket UI at <code>app.logrocket.com/0eqns2/facil</code> exposes 5 main sections:",
      "col_section": "Section", "col_purpose": "Purpose", "col_when": "When to use",
      "row": {
        "replay": { "name": "<strong>Session Replay</strong>", "purpose": "Per-user visit replays with timeline of console + network", "when": "Citizen complaint, UX bug, intermittent crash" },
        "issues": { "name": "<strong>Issues</strong>", "purpose": "JS errors auto-detected, similar to Sentry but with a session attached", "when": "Triage non-Sentry-alerted errors" },
        "dashboards": { "name": "<strong>Dashboards</strong>", "purpose": "Custom event aggregations (counts, funnels, conversion rates)", "when": "Funnel drop-off, A/B comparison" },
        "surveys": { "name": "<strong>Surveys / Feedback</strong>", "purpose": "NPS surveys + in-app feedback widgets (not used today)", "when": "UX research, post-launch sentiment" },
        "settings": { "name": "<strong>Settings → Integrations</strong>", "purpose": "Slack / Jira / Linear hooks (free tier limited)", "when": "Push critical issues to the team chat" }
      }
    },
    "bridge": {
      "intro": "Activated 2026-04-30 once <code>@sentry/nextjs</code> was wired (web side). The bridge attaches the LogRocket session URL to every Sentry event so an Issue in Sentry deep-links straight to its replay in one click — eliminating the context-switch cost between two tools.",
      "ordering": "<strong>Why this ordering</strong>: <code>getSessionURL()</code> fires <em>after</em> the first network flush (~2-5 s into the session). Sentry events can be captured immediately on page load. Initialising LogRocket first and registering the bridge inside its <code>init()</code> means: by the time the bridge hooks in, Sentry is already listening; the bridge call site lives next to the LogRocket init it depends on; no circular dependency.",
      "mobile": "<strong>Mobile bridge</strong>: stub today. Activates the day Sentry RN events on mobile/inspector should carry a LogRocket session URL. Same 4-line edit as web once both SDKs are confirmed live."
    },
    "limits": {
      "title": "Known limits (honest)",
      "tier": "<strong>Free tier 1K sessions / month</strong> — shared across web + mobile + inspector. At current scale (~20 staging users) ample headroom; production scaling needs Team plan.",
      "sourcemap": "<strong>Source-map upload not wired</strong> — LogRocket stack traces are minified. Plan: reuse Sentry CLI sourcemap upload (<code>@sentry/cli</code>) at build time. <em>Tracked: OBSERVABILITY_STACK.md §8</em>.",
      "redact": "<strong>Mobile redact-by-default</strong> — replays informative only on screens audited and wrapped with <code>&lt;LRAllow&gt;</code>. Audit cadence: per feature shipping.",
      "onprem": "<strong>No on-prem free tier</strong> — air-gapped deployments must disable LogRocket entirely."
    },
    "traps": {
      "title": "Known traps",
      "col_symptom": "Symptom", "col_cause": "Root cause", "col_fix": "Fix",
      "row": {
        "minsdk_cause": "LogRocket RN requires Android API 25+",
        "minsdk_fix": "Bump <code>ext.minSdkVersion</code> to 25 in <code>android/build.gradle</code> + <code>app.json</code> (cf. <code>OBSERVABILITY_STACK.md §7.6</code>)",
        "gradlew_cause": "<code>/android</code> in <code>.gitignore</code> strips natives from EAS upload",
        "gradlew_fix": "Add <code>.easignore</code> overriding <code>.gitignore</code> for EAS uploads (cf. <code>OBSERVABILITY_STACK.md §7.2</code>)",
        "bundle_symptom": "Frontend lacks <code>LOGROCKET_APP_ID</code> in bundle",
        "bundle_cause": "<code>--build-arg</code> not passed at Docker build",
        "bundle_fix": "Cloud Build YAML must pass <code>_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}</code> as substitution (cf. <code>OBSERVABILITY_STACK.md §7.5</code>)",
        "anon_symptom": "Mobile sessions all anonymous",
        "anon_cause": "<code>identifyLogRocket()</code> not called in auth provider",
        "anon_fix": "Wire in <code>auth-provider.tsx</code> alongside <code>setSentryUser</code>",
        "blank_symptom": "Replays show only blank fields on mobile",
        "blank_cause": "Default <code>textSanitizer: 'excluded'</code> + no <code>&lt;LRAllow&gt;</code> wrapping",
        "blank_fix": "Audit screens; wrap non-PII text in <code>&lt;LRAllow&gt;</code>"
      }
    },
    "roadmap": {
      "title": "Roadmap",
      "s1": "<strong>Sentry RN on inspector</strong> — activate <code>bridgeLogRocketToSentry()</code> body in inspector wrapper.",
      "s2": "<strong>Source-map upload</strong> — via reused Sentry CLI in CI for both web and mobile.",
      "s3": "<strong>Auto-rotation cron</strong> for <code>logrocket-app-id</code> (low cadence — public anyway).",
      "s4": "<strong>Funnel templates</strong> — pre-built funnels for the 4 critical user journeys (signup, payment, wizard, document upload) with target conversion thresholds + alerts."
    },
    "agent": {
      "title": "Reusable agent for other projects",
      "body": "Distilled into <code>infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md</code> — a 7-phase reproducible agent invokable via <code>/logrocket-observability</code> slash-command. Works on any web (Next.js / Vite / CRA), mobile (Expo / bare RN), or hybrid project. Enforces 8 active guardrails (PII redaction, gating, identify policy, secret topology, source-map drift, etc.)."
    },
    "related": {
      "title": "Related documentation",
      "stack": "<code>.claude/plans/OBSERVABILITY_STACK.md</code> — full reference (~750 lines): secret topology, multi-cloud migration, traps catalogue.",
      "quickstart": "<code>.claude/plans/OBSERVABILITY_QUICKSTART.md</code> — hands-on tutorial for new contributors.",
      "dashboards": "<code>.claude/plans/OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md</code> — companion doc on the Sentry side (8 dashboards, alert rules).",
      "grafana": "<a href=\"grafana-dashboards.html\">Grafana Dashboards</a> — the analytics layer (decision-driven KPIs), complementary to LogRocket (forensic replay)."
    }
  },

  "aio": {
    "html_title": "AI Observability - Facil Documentation",
    "title": "AI Observability — Gemini cost & latency tracking",
    "description": "Per-call telemetry on every Gemini / Vertex AI request made by the Facil backend. 18 call sites instrumented across 16 features (chatbot RAG, OCR, classification, enrichment, routing, briefing, etc.). Outputs: 1 Grafana dashboard with 12 panels + 3 alert rules + a BD-persisted audit trail (<code>ai_call_metrics</code> table, mig 325). Privacy-safe by design: no raw prompt content stored, only SHA-256 truncated hashes.",
    "toc": {
      "why": "1. Why & Gap analysis",
      "stack": "2. Stack & double-write design",
      "schema": "3. BD schema (mig 325)",
      "wrapper": "4. Wrapper API (traced_generate_sync)",
      "features": "5. Feature labels (16 mappings)",
      "dashboard": "6. Dashboard (12 panels)",
      "alerts": "7. Alerts (3 rules + runbooks)",
      "privacy": "8. Privacy & security",
      "cohabitation": "9. Coexistence with VertexAIManager"
    },
    "why": {
      "intro": "Before this work, the backend made <strong>~17 distinct Gemini call sites</strong> with <strong>zero observability</strong>. We could not answer 4 critical operational questions:",
      "q1": "<strong>Cost</strong>: how much do we spend in tokens per day, per model, per feature?",
      "q2": "<strong>Latency</strong>: what is the p95/p99 by call type (RAG vs OCR vs classification)?",
      "q3": "<strong>Reliability</strong>: what is the failure rate, and what type (rate-limit / timeout / JSON parse / content blocked)?",
      "q4": "<strong>Optimization</strong>: which prompts cost the most? Are there quick wins?"
    },
    "stack": {
      "intro": "Each call goes through a single wrapper <code>traced_generate_sync()</code> that emits <strong>both</strong> an OTEL span (to Grafana Tempo for trace drill-down) <strong>and</strong> a row in the <code>ai_call_metrics</code> BD table.",
      "step1": "Call site", "step1_sub": "e.g. chatbot RAG",
      "step2": "traced_generate_sync", "step2_sub": "app/core/ai_telemetry.py",
      "step3": "model.generate_content()", "step3_sub": "Vertex AI sync via run_in_executor",
      "fanA": "A. OTEL span", "fanA_sub": "→ Grafana Tempo (14d retention)",
      "fanB": "B. asyncio.create_task INSERT", "fanB_sub": "→ ai_call_metrics (BD persistent)",
      "why_double": "Tempo Free tier has 14-day retention — insufficient for monthly cost reports. The BD is the <strong>source of truth for long-term aggregation</strong>; Tempo provides drill-down debug. Both writes are <strong>fire-and-forget</strong> via <code>asyncio.create_task</code> — never block the user-facing call."
    },
    "schema": {
      "intro": "Table <code>ai_call_metrics</code> (20 columns, 8 indexes, 9 CHECK constraints):",
      "col_name": "Column", "col_type": "Type", "col_purpose": "Purpose",
      "row_id": "Primary key + ingestion time",
      "row_trace": "OTEL correlation with Tempo",
      "row_model": "gemini | vertex_embedding × chat | embeddings | completion",
      "row_feature": "Facil context (chatbot_rag / ocr / etc.)",
      "row_tokens": "Usage counters; total_tokens auto-computed",
      "row_cost": "Estimated FCFA cost (input × pricing.input + output × pricing.output)",
      "row_status": "end-start ms + 6-status enum (success / error / rate_limited / timeout / content_blocked / json_parse_error)",
      "row_hash": "SHA-256 truncated — privacy-safe identifier (no reverse mapping)",
      "views": "Two rollup views power the dashboard panels: <code>v_ai_cost_daily</code> (90 days) and <code>v_ai_cost_hourly</code> (7 days). Both granted to <code>looker_readonly</code>."
    },
    "wrapper": {
      "intro": "Module <code>app/core/ai_telemetry.py</code> exposes 4 wrappers:",
      "col_when": "When to use", "col_signature": "Signature shape",
      "row_sync": "Sync <code>model.generate_content()</code> + <code>run_in_executor</code>. <strong>Most common pattern in this codebase.</strong>",
      "row_async": "Async <code>generate_content_async()</code> if SDK supports it",
      "row_emb_sync": "Sync <code>model.get_embeddings()</code>",
      "row_emb_async": "Async embeddings",
      "principles": "Design principles: (1) <strong>soft OTEL import</strong> — module loads without opentelemetry-sdk; spans become no-ops; BD persist still runs. (2) <strong>BD persist never blocks</strong> — <code>asyncio.create_task</code> + try/except; a BD outage cannot crash the chatbot. (3) <strong>privacy by construction</strong> — prompt content never stored, only the 16-char SHA-256 hash. RGPD-safe."
    },
    "features": {
      "intro": "Each call site is tagged with a <code>feature</code> string used for cost/latency segmentation in the dashboard:",
      "col_label": "Feature", "col_module": "Module", "col_volume": "Volume",
      "vol_high": "High", "vol_vhigh": "Very high", "vol_med": "Medium", "vol_low": "Low (cron)"
    },
    "dashboard": {
      "intro": "UID: <code>facil-ai-observability</code>. <strong>12 panels</strong> across 5 row sections. Listed at <code>/admin/dashboards</code> under category \"security\" (rls_mode <code>admin_only</code>).",
      "s1": "<strong>💰 Cost</strong>: today XAF, MTD XAF, total calls today, tokens in/out today (4 stat panels)",
      "s2": "<strong>📈 Trends</strong>: cost stacked by feature per day, p95 latency per feature per hour (2 timeseries)",
      "s3": "<strong>🚨 Errors</strong>: 24h error rate %, errors by status type bar chart, success-vs-error per hour (3 panels)",
      "s4": "<strong>🔝 Top costs</strong>: top features by cost (7d), top prompt_hashes by cost (7d) (2 tables)",
      "s5": "<strong>🤖 Models breakdown</strong> (collapsed): cost share donut + per-model table (2 panels)",
      "screenshot_caption": "Live capture: 5 calls today (3 chatbot_rag + 1 embeddings_rag + 1 intent_classification), 22.4K input tokens, 0% error rate. Cost shows \"XAF0\" because token-volume × pricing rounds to sub-1 XAF — see Phase B note below for fixing the model_name \"publishers/google/models/g…\" truncation."
    },
    "alerts": {
      "col_threshold": "Threshold", "col_severity": "Severity", "col_for": "For",
      "runbook_cost": "Runbook — Cost spike",
      "runbook_error": "Runbook — Error rate spike",
      "runbook_latency": "Runbook — p95 latency degraded",
      "cost_body": "1. Open the dashboard, drill into \"Top features by cost (7d)\". 2. Identify the dominant feature. 3. Check \"Top prompt hashes by cost (7d)\" for duplicate expensive prompts (caching candidate). 4. If routing/briefing/enrichment cron is the culprit, throttle frequency. 5. If chatbot_rag explodes, suspect a bot or agent looping — check audit_logs for rapid-fire requests from one user_id.",
      "error_body": "1. Open \"Errors by status type (last 7d)\". 2. <strong>rate_limited</strong> → Vertex AI quota hit, increase via Google Cloud Console. 3. <strong>timeout</strong> → check Gemini API status page; consider raising <code>asyncio.wait_for</code> timeout. 4. <strong>content_blocked</strong> → SAFETY filter triggered, review prompt template. 5. <strong>json_parse_error</strong> → memory rule #21: ensure <code>response_mime_type=\"application/json\"</code> in GenerationConfig.",
      "latency_body": "1. Check \"p95 latency by feature\" panel. 2. If <code>ocr</code> spikes, suspect large PDFs. 3. If <code>chatbot_rag</code> spikes, check pgvector search latency. 4. If all features spike together, suspect Vertex AI region-wide degradation."
    },
    "privacy": {
      "no_content": "<strong>No raw prompt content</strong> stored anywhere. Only SHA-256 truncated 16-char hash. No reverse-mapping table. RGPD-safe by design.",
      "token_hash": "<strong>prompt_hash format</strong> enforced by BD CHECK <code>chk_aim_prompt_hash_format</code>: <code>^[a-f0-9]{16}$</code>",
      "user_fk": "<strong>user_id FK ON DELETE SET NULL</strong> — user deletion clears the link without deleting the audit row",
      "token_secret": "<strong>OTLP token via Secret Manager</strong> (<code>grafana-otlp-token</code>) — CAP token scoped to <code>traces:write</code> only",
      "iam": "<strong>RLS</strong>: dashboard <code>rls_mode='admin_only'</code> — non-admins don't see cost data even via <code>/api/v1/dashboards/reports-config</code>"
    },
    "cohabitation": {
      "intro": "The existing <code>app/modules/shared/services/vertex_ai_manager.py</code> singleton is INTENTIONALLY preserved. The two systems are complementary, not redundant:",
      "col_concern": "Concern",
      "row_circuit": "Circuit breaker (10 fail/60s cooldown)",
      "row_realtime": "Sub-μs in-memory stats read",
      "row_persist": "BD persistence (cross-worker, survives restart)",
      "row_cost": "Cost in XAF",
      "row_tags": "Per-feature/model/user/trace tags",
      "row_status": "Status enum (6 values)",
      "pattern": "Call site pattern: <code>await traced_generate_sync(...)</code> followed by <code>VertexAIManager().track_usage(response, \"X\")</code> + <code>track_success()</code>. Both calls coexist; neither blocks the other."
    }
  },

  "gr": {
    "html_title": "Grafana Dashboards - Facil Documentation",
    "title": "Grafana Dashboards — Analytics Engineering",
    "description": "10 production-grade Grafana dashboards built on a 4-layer semantic data architecture, enabling government decision-makers (treasury, ministry agents, supervisors, inspectors) to answer business questions in &lt; 30 seconds. This page documents the <em>why</em>, the <em>how</em>, and the <em>decisions</em> driven by each dashboard.",
    "toc": {
      "why": "1. Why & Business Context",
      "ae": "2. Analytics Engineering — the Semantic Layer",
      "personas": "3. Personas & Decision Map",
      "dashboards": "4. The 10 Dashboards",
      "patterns": "5. Engineering Patterns",
      "stack": "6. Stack & Provisioning",
      "admin": "7. Admin Self-Service (mig 323)",
      "limits": "8. Limits, Lineage & Roadmap"
    },
    "admin": {
      "intro": "Migration 323 (2026-05-05) makes the dashboard registry fully BD-driven. Admins with the <code>dashboards.manage</code> permission can add, edit, delete, and bulk-import dashboards via the web UI &mdash; <strong>no code change, no redeploy</strong>. Out of the 10 Grafana dashboards live in <code>kouemousah.grafana.net</code>, all 10 are seeded automatically by mig 323 plus 1 Looker-only catalog (Services Catalog) for a total of 11 rows in <code>dashboard_registrations</code>.",
      "where_title": "Where to manage dashboards",
      "where": {
        "list": "<code>/admin/dashboards</code> &mdash; public landing, grouped by category (executive / finance / operations / business / product / security)",
        "config": "<code>/admin/dashboards/config</code> &mdash; admin CRUD: list (11 rows) + edit + soft-delete + import button",
        "detail": "<code>/admin/dashboards/{slug}</code> &mdash; full-screen embed (kiosk mode) with breadcrumb back to the listing"
      },
      "add_title": "Adding a new Grafana dashboard (3 clicks)",
      "add": {
        "s1": "<strong>Push the dashboard JSON</strong> to <code>infra/grafana/dashboards/NN_name.json</code> via the existing <code>/grafana-dashboards</code> agent or by manual provisioning. Take note of the <code>uid</code> field (e.g. <code>facil-new-kpi</code>).",
        "s2": "<strong>Open the admin page</strong> <code>/admin/dashboards/config</code>. Click the <strong>\"Import from Grafana\"</strong> button (top-right).",
        "s3": "<strong>Modal opens</strong> with all dashboards in the workspace. Already-imported ones are filtered out. Check the row(s) you want, edit the slug + i18n titles + category inline, then click <strong>\"Import\"</strong>. The list refreshes automatically."
      },
      "add_hint": "The slug becomes the URL segment (<code>/admin/dashboards/{slug}</code>) and the audit-log key &mdash; once set, it's immutable. Keep it lowercase, hyphenated, 3-40 chars.",
      "where_get_title": "Where to find the Grafana Dashboard UID and Organization ID",
      "where_get": {
        "uid": "<strong>Dashboard UID</strong>: in Grafana, open the dashboard. The URL is <code>https://&lt;workspace&gt;.grafana.net/d/&lt;UID&gt;/&lt;slug&gt;</code> &mdash; the <code>&lt;UID&gt;</code> segment is what you need (4&ndash;40 alphanumeric chars + dashes/underscores). Also visible in <em>Dashboard settings &rarr; JSON Model &rarr; <code>uid</code></em>.",
        "org": "<strong>Organization ID</strong>: <code>1</code> for any single-org Grafana Cloud workspace (the default, including <code>kouemousah.grafana.net</code>). Visible in any URL as <code>?orgId=1</code>, or in <em>Admin &rarr; Organizations</em>. Only change this if you actually run multiple Grafana orgs."
      },
      "config_title": "Required configuration",
      "config_intro": "The Grafana import endpoint calls the Grafana HTTP API server-side; it requires two env vars in Cloud Run / Secret Manager:",
      "col_var": "Variable", "col_value": "Value", "col_purpose": "Purpose",
      "row": {
        "base": "Workspace base URL — used to build the iframe URL <em>and</em> the discover API call. Plain env var (non-secret).",
        "token_v": "<strong>Secret Manager binding</strong>: <code>grafana-sa-token:latest</code> — bound via <code>--set-secrets=</code> in the deploy workflow, NOT a plain env var.",
        "token_p": "Authenticates <code>/api/v1/dashboards/admin/grafana/discover</code> against Grafana's <code>/api/search</code>. Token never appears in the Cloud Run service descriptor; rotation is a single <code>gcloud secrets versions add</code> with no workflow edit."
      },
      "config_token_hint": "To create the token: Grafana &rarr; <em>Administration &rarr; Service Accounts &rarr; Add new</em> &rarr; role <code>Viewer</code> (or finer scope <code>dashboards:read</code>) &rarr; <em>Add token</em>. Then provision in GCP:",
      "csp_hint": "<strong>Frontend CSP requirement</strong>: the Next.js middleware emits a <code>Content-Security-Policy</code> header with <code>frame-src</code>. Grafana's domain MUST be whitelisted there or the browser blocks the iframe with <em>\"Framing 'https://kouemousah.grafana.net/' violates the following Content Security Policy directive\"</em>. The current allow-list includes <code>https://*.grafana.net</code> and <code>https://lookerstudio.google.com</code> &mdash; defined in <code>packages/web/src/middleware.ts</code> and <code>packages/web/next.config.mjs</code>. Adding a new embed provider requires updating both.",
      "api_title": "Backend endpoints",
      "col_method": "Method", "col_path": "Path", "col_perm": "Permission", "col_desc": "Description",
      "api": {
        "list": "Public listing — admin sees admin_only rows, others don't (RLS).",
        "adm_list": "Admin listing — all rows, both active and inactive.",
        "create": "Create a new dashboard from scratch (409 on slug conflict).",
        "put": "Update provider/UID/active state.",
        "patch": "Partial update of i18n + presentation metadata.",
        "delete": "Soft-delete (sets is_active=false, preserves audit trail).",
        "discover": "List Grafana workspace dashboards via Grafana /api/search (cached 5 min).",
        "import": "Bulk-import selected dashboards (per-item TX isolation)."
      },
      "security_title": "Security & safeguards",
      "security": {
        "rate": "<strong>Rate-limit 10 writes/min/user</strong> on POST/PUT/PATCH/DELETE/import.",
        "regex": "<strong>3-layer regex</strong> on slug + Grafana UID + Looker IDs (Zod &rarr; Pydantic &rarr; BD CHECK).",
        "audit": "<strong>Audit log</strong>: every write inserts a row into <code>audit_logs</code> in the same DB transaction (memory rule #24: <code>json.dumps</code> for JSONB).",
        "boot": "<strong>Non-destructive boot</strong>: <code>dashboards.manage</code> permission is preserved at boot even if not mirrored in <code>dashboards_permissions.py</code> (memory rule #37).",
        "rls": "<strong>RLS filtering</strong>: <code>admin_only</code> dashboards (e.g. <em>User Activity audit</em>) hidden from non-admin callers at the SQL layer, not just the UI.",
        "token": "<strong>SA token never reaches the browser</strong>: discover/import are server-side only; the frontend never sees <code>GRAFANA_SA_TOKEN</code>."
      }
    },
    "why": {
      "problem_title": "The problem",
      "problem_body": "Before this initiative, decision-makers across Facil's 20 government entities operated without a unified analytical view. Each ministry had isolated reports, treasury reconciliation was performed manually in spreadsheets, agent performance was assessed anecdotally, and inspectors had no field analytics. The platform was generating <strong>3,342+ audit events</strong>, processing payments in XAF, and assigning service requests across <strong>5 cities</strong> — but none of this data was actionable in real time.",
      "need_title": "The need",
      "need": {
        "treasury": "<strong>Treasury</strong> needs daily revenue tracking by ministry, entity, payment method, and site, with reconciliation status visible at a glance.",
        "agents": "<strong>Ministry agents</strong> need to know their workload, SLA pressure, and pending obligations.",
        "supervisors": "<strong>Supervisors</strong> need cross-team performance comparisons and OMS (One-Stop-Shop) module adoption.",
        "inspectors": "<strong>Inspectors</strong> need field activity tracking with GPS, photos, and seal counts.",
        "execs": "<strong>Executives</strong> need a single Overview to see the platform's pulse."
      },
      "choice_title": "Why Grafana (and Looker Studio in parallel)",
      "choice_body": "We evaluated three options: a custom React dashboard suite, Looker Studio, and Grafana Cloud. The decision was to run <strong>Grafana and Looker Studio in parallel</strong>, with a runtime toggle in <code>/admin/dashboards/config</code> driven by the <code>dashboard_provider_enum</code> column in <code>dashboard_registrations</code>. This dual-provider design lets us A/B compare in production and avoid vendor lock-in.",
      "col_criterion": "Criterion", "col_custom": "Custom React",
      "row": {
        "ttfd": "Time-to-first-dashboard", "ttfd_g": "< 1 day", "ttfd_l": "~2 days (UI-only)", "ttfd_c": "2-3 weeks per dashboard",
        "dac": "Dashboards-as-code (versioned in Git)", "dac_g": "JSON via API", "dac_l": "UI-only, no API for content", "dac_c": "React + manual",
        "sql": "SQL-first (Postgres native)", "sql_l": "JDBC, MV-blind by default",
        "embed": "Embed in admin (iframe + auth)", "embed_g": "&#9989; <code>d-solo</code> + kiosk=tv", "embed_l": "&#9989; embed token",
        "cost": "Cost (10 dashboards, 100+ agents)", "cost_g": "Free tier sufficient", "cost_c": "~3 dev-months",
        "refresh": "Auto-refresh + alerting", "refresh_g": "&#9989; native", "refresh_l": "&#9888; limited", "refresh_c": "To build"
      },
      "choice_summary": "Grafana won on time-to-value and dashboards-as-code. Looker Studio remained as a fallback / non-tech stakeholder option. Both consume the same semantic layer (Section 2).",
      "goals_title": "Goals (business objectives)",
      "goal1": "<strong>Reduce time-to-decision</strong>: from days (manual report request) to seconds (live dashboard).",
      "goal2": "<strong>Single source of truth</strong>: every KPI traceable to one SQL view, with audit trail (<code>location_source</code> column).",
      "goal3": "<strong>Cross-dimensional drill-down</strong>: every dashboard supports filter chains (ministry → entity → site → period).",
      "goal4": "<strong>Per-site granularity</strong>: revenue, agents, inspections all attributable to specific cities (Malabo, Bata, Mongomo, …).",
      "goal5": "<strong>OMS adoption tracking</strong>: dynamic classifier (<code>workflow_codes ? 'BUNDLE_PAYMENT'</code>) to measure progressive rollout."
    },
    "ae": {
      "intro": "Note on terminology: this work is <strong>Analytics Engineering</strong>, not Business Data Analysis. A Business Data Analyst <em>consumes</em> dashboards to find insights; an Analytics Engineer <em>builds the semantic layer</em> that makes those insights reliable, fast, and consistent across consumers (Grafana, Looker, custom apps). The work below is the latter.",
      "diagram_title": "4-Layer Data Architecture",
      "l1": "Layer 1 — Aggregations", "l1_sub": "Materialized Views (cron 15 min)",
      "l2": "Layer 2 — Enriched Views", "l2_sub": "v_*_enriched (JOIN entities + locations + agents + classifiers)",
      "l3": "Layer 3 — Auto-Wrappers", "l3_sub": "vw_* (boot-synced for Looker JDBC visibility)",
      "l4": "Layer 4 — Consumers", "l4_sub": "Grafana Cloud + Looker Studio + Future BI tools",
      "l1_title": "Layer 1 — Aggregations (MVs)",
      "l1_body": "Materialized Views pre-compute heavy aggregations (sum, count, group by) on a 15-minute cron. They are the <em>backup</em> and <em>historical</em> source. <strong>Live queries on enriched views are the primary path</strong> for dashboards that need real-time data — MVs are read only when historical aggregations are needed (cf. Memory Rule #22).",
      "l2_title": "Layer 2 — Enriched Views (the heart)",
      "l2_intro": "This is the <strong>semantic layer</strong> — the canonical place where business logic lives:",
      "l2": {
        "joins": "<strong>Joins resolved once</strong>: entities, locations, agents, ministries are joined here so dashboards never reinvent the join.",
        "classifiers": "<strong>Classifiers computed</strong>: <code>is_oms = workflow_codes ? 'BUNDLE_PAYMENT'</code>, <code>is_supervisor = role_code ILIKE '%supervisor%'</code>, etc.",
        "multi": "<strong>Multi-source resolution</strong> (the killer feature): the canonical site for a payment is resolved as a 4-step <code>COALESCE</code> chain (field inspection → service request → agent collected → agent validated), with a <code>location_source</code> audit column so consumers can trust the data.",
        "granted": "<strong>Granted to <code>looker_readonly</code></strong>: a dedicated read-only role with no write privileges, isolating BI access from application access."
      },
      "l3_title": "Layer 3 — Auto-Wrappers",
      "l3_body": "Looker Studio's JDBC driver hides Materialized Views (<code>relkind='m'</code>). To make MVs visible in the picker without writing manual wrappers, the backend boots run <code>sync_looker_view_wrappers()</code> which auto-creates a <code>vw_*</code> view of <code>relkind='v'</code> over every MV granted to <code>looker_readonly</code>. Grafana doesn't need this layer (its Postgres driver sees MVs natively), so dashboards reference <code>v_*</code> and <code>mv_*</code> directly.",
      "l4_title": "Layer 4 — Consumers (Grafana + Looker)",
      "l4_body": "Both providers consume the same Layer 2 views. The <code>dashboard_registrations</code> table stores a <code>provider</code> column (<code>'looker' | 'grafana'</code>) so each registered dashboard knows how to be embedded."
    },
    "personas": {
      "intro": "Every dashboard must answer at least one concrete decision. The mapping below is the <em>contract</em>: if a stakeholder can't answer their listed questions in &lt; 30 seconds, the dashboard is broken and gets reworked.",
      "col_persona": "Persona", "col_dash": "Primary dashboards", "col_decisions": "Decisions driven",
      "row": {
        "treasury": { "name": "<strong>Treasury Manager</strong>", "dash": "Recaudación Fiscal, Payments Operations, Overview", "dec": "Daily revenue alerts, reconciliation gaps, payment-method drift, ministry contribution" },
        "agent": { "name": "<strong>Ministry Agent (CNEDOGE, MIN_TRABAJO, …)</strong>", "dash": "Performance Agentes, Service Requests", "dec": "My queue depth, my SLA pressure, peer benchmarking" },
        "oms": { "name": "<strong>OMS Supervisor (AYUNTAMIENTO, CAMARA_COMERCIO)</strong>", "dash": "OMS Modules, Empresas, Inspections", "dec": "Bundle obligation completion rate, license issuance velocity, field inspection quality" },
        "insp": { "name": "<strong>Inspector Chief</strong>", "dash": "Inspections, Mobile vs Web vs Inspector", "dec": "Field activity by zone/city, photo evidence rate, seal usage, inspector adoption of mobile app" },
        "dir": { "name": "<strong>Citizen Services Director</strong>", "dash": "Empresas, Service Requests, User Activity", "dec": "Active company cohort by zone, request backlog, citizen audit trail" },
        "exec": { "name": "<strong>Executive (DG / Minister)</strong>", "dash": "Overview only", "dec": "Platform health pulse, cross-ministry comparison, mobile adoption velocity" }
      }
    },
    "dash": {
      "intro": "Each dashboard below documents: <strong>screenshot</strong>, <strong>primary KPIs</strong> with their SQL formula, <strong>filters</strong>, the <strong>source view</strong>, and the <strong>concrete decisions</strong> it enables. All dashboards share a tag (<code>facil</code>) and link to each other via the navigation dropdown.",
      "col_kpi": "KPI", "col_formula": "Formula (simplified)", "col_formula_short": "Formula", "col_source": "Source", "col_decision": "Decision",
      "overview": {
        "title": "00 — Overview",
        "meta": "<strong>UID</strong>: <code>facil-overview</code> · <strong>Audience</strong>: Executive · <strong>Filters</strong>: period only",
        "body": "The pulse of the platform. 4-7 stat cards on top (revenue, active companies, agents online, audit events), 1-2 timeseries showing trend, and a navigation dropdown to all 9 other dashboards.",
        "kpi": {
          "revenue": "Recaudación total (XAF)", "revenue_dec": "Daily revenue alert if < threshold",
          "empresas": "Empresas activas", "empresas_dec": "Onboarding velocity",
          "agents": "Agentes activos (24h)", "agents_dec": "Capacity planning",
          "audit": "Eventos de auditoría", "audit_dec": "Anomaly detection"
        }
      },
      "treasury": {
        "title": "01 — Recaudación Fiscal",
        "meta": "<strong>UID</strong>: <code>facil-treasury</code> · <strong>Audience</strong>: Treasury Manager · <strong>Filters</strong>: Ministry, Entity, Workflow, Method, <strong>Site (multi-source)</strong>",
        "body": "The flagship dashboard. Resolves revenue per <strong>physical site</strong> (city) using the 4-step COALESCE chain so a payment collected by an inspector in Bata is attributed to Bata, not to the validating agent in Malabo. The <code>location_source</code> donut shows the resolution breakdown.",
        "kpi": {
          "total": "Recaudación total", "total_dec": "Revenue tracking",
          "recovery_dec": "Reconciliation gap",
          "persite": "Per-site breakdown", "persite_dec": "Site performance",
          "method": "Method mix", "method_dec": "BANGE adoption",
          "attribution": "Source attribution", "attribution_dec": "Data quality audit"
        }
      },
      "agents": {
        "title": "02 — Performance Agentes",
        "meta": "<strong>UID</strong>: <code>facil-agents</code> · <strong>Audience</strong>: Agent + Ministry Supervisor · <strong>Filters</strong>: OMS toggle, Entity, Site, Agent Type",
        "body": "OMS toggle (custom variable) lets supervisors compare bundle-payment teams (AYUNTAMIENTO, CAMARA_COMERCIO) vs traditional ministry teams. Drill: ministry → entity → site → agent.",
        "kpi": {
          "active": "Active agents", "active_dec": "Resource allocation",
          "queue": "Avg queue depth", "queue_dec": "Hire / rebalance signal",
          "sla": "SLA pressure", "sla_dec": "Escalation alert",
          "top": "Top performers", "top_dec": "Recognition / training"
        }
      },
      "companies": {
        "title": "03 — Empresas",
        "meta": "<strong>UID</strong>: <code>facil-companies</code> · <strong>Audience</strong>: Citizen Services Director · <strong>Filters</strong>: Zone, <strong>City (JSONB drill)</strong>",
        "body": "City filter uses JSONB drill on <code>mv_company_global_stats.by_city</code> — a pre-aggregated analytics column. Single-row JSONB query → multiple rows expanded via <code>jsonb_array_elements()</code>.",
        "kpi": {
          "regis": "Empresas registradas", "regis_dec": "Market penetration",
          "zone": "Por zona (12 zones)", "zone_dec": "Regional outreach",
          "city": "Por ciudad (16 cities)", "city_dec": "Local agent dispatch",
          "debt": "Deuda por ciudad", "debt_src": "JSONB drill", "debt_dec": "Collection priority"
        }
      },
      "oms": {
        "title": "04 — OMS Modules",
        "meta": "<strong>UID</strong>: <code>facil-oms</code> · <strong>Audience</strong>: OMS Supervisor · <strong>Filters</strong>: Ministry, Fee_type, Zone, Site",
        "body": "OMS = One-Stop-Shop. Tracks the bundle-payment workflow rollout: an entity is OMS if its <code>workflow_codes</code> JSONB array contains <code>'BUNDLE_PAYMENT'</code>. This classifier is <strong>admin-managed via UI</strong> (no code redeploy needed) and consumed via the JSONB <code>?</code> operator.",
        "kpi": {
          "entities": "OMS entities", "entities_dec": "Rollout progress",
          "obli": "Obligations issued", "obli_dec": "Bundle adoption",
          "fees": "Avg fees per bundle", "fees_dec": "Pricing benchmark",
          "compl": "Completion rate", "compl_dec": "Friction diagnosis"
        }
      },
      "payments": {
        "title": "05 — Payments Operations",
        "meta": "<strong>UID</strong>: <code>facil-payments</code> · <strong>Audience</strong>: Treasury Operations · <strong>Filters</strong>: Status, Entity, Site",
        "note": "Screenshot not captured at the time of writing — data structure identical to <code>v_treasury_payments_by_site</code>; visual identical to dashboard 01 with operational status emphasis.",
        "kpi": {
          "pending": "Pending validation", "pending_dec": "Backlog alert",
          "gap": "Reconciliation gap", "gap_dec": "Audit follow-up",
          "failed": "Failed payments", "failed_dec": "Provider issue tracking"
        }
      },
      "sr": {
        "title": "06 — Service Requests",
        "meta": "<strong>UID</strong>: <code>facil-service-requests</code> · <strong>Audience</strong>: Ministry Agent · <strong>Filters</strong>: Workflow, Entity, Site",
        "body": "Active service requests with <strong>age buckets</strong> (0-24h, 24-72h, 3-7d, 7d+) for SLA tracking. Status breakdown shows the bottleneck stage of the workflow.",
        "kpi": {
          "active": "Active SR", "active_dec": "Backlog volume",
          "age": "Age buckets", "age_dec": "SLA escalation trigger",
          "status": "Status mix", "status_dec": "Bottleneck identification"
        }
      },
      "ua": {
        "title": "07 — User Activity (Audit)",
        "meta": "<strong>UID</strong>: <code>facil-user-activity</code> · <strong>Audience</strong>: Security & Director · <strong>Filters</strong>: Channel, Role, Action Category",
        "body": "Built on <code>v_user_activity_audit</code> which canonicalizes 3,342+ audit_logs events with channel detection (mobile/web/inspector) via user-agent regex and action_category mapping."
      },
      "channel": {
        "title": "08 — Mobile vs Web vs Inspector",
        "meta": "<strong>UID</strong>: <code>facil-channel</code> · <strong>Audience</strong>: Director & Product · <strong>Filters</strong>: Workflow, Entity",
        "body": "Tracks the adoption of the mobile citizen app and the inspector app vs traditional web access. Key for product strategy: where to invest UX effort."
      },
      "insp": {
        "title": "09 — Inspections (field)",
        "meta": "<strong>UID</strong>: <code>facil-inspections</code> · <strong>Audience</strong>: Inspector Chief · <strong>Filters</strong>: Entity, City, Result",
        "body": "Currently shows « No data » on most cards because <code>field_inspections</code> is empty in production until the inspector mobile app captures its first reports. The schema is ready, all KPIs and filters are wired, and <code>noValue: \"0\"</code> ensures no parasite errors."
      }
    },
    "patterns": {
      "A_title": "Pattern A — Multi-source resolution (4-step COALESCE)",
      "A_body": "When a dimension can be derived from multiple sources with priority, never pick one arbitrarily — fallback in priority order with audit trail. This pattern resolved the « all agents in Malabo » problem where revenue from field inspections in Bata was wrongly attributed to the validating agent's site.",
      "B_title": "Pattern B — JSONB classifier (admin-managed, no redeploy)",
      "B_body": "The OMS classifier (<code>workflow_codes ? 'BUNDLE_PAYMENT'</code>) lives in the <code>entities</code> table as a JSONB array. Admins toggle OMS status from the UI; dashboards recompute instantly. No code change, no migration. Single source of truth.",
      "C_title": "Pattern C — Chained template variables",
      "C_body": "Filters chain via <code>refresh: 1</code> on each variable: ministry → entity → site population queries depend on the upstream selection. The <strong>population query</strong> for the Site filter must be the catalog (<code>v_entity_locations_browse</code>), not the fact table — otherwise sites without data become invisible.",
      "D_title": "Pattern D — Engine-agnostic Grafana primitives",
      "D_body": "Three Grafana-side primitives appear in all 10 dashboards and would work on MySQL / BigQuery / Snowflake / SQL Server unchanged (verified in our reusable <code>GRAFANA_DASHBOARDS_AGENT.md</code> v1.1):",
      "D": {
        "sqlstring": "<code>${var:sqlstring}</code> — the <em>only</em> way to handle multi-select « All ». Never <code>'$var' = 'All' OR ...</code>.",
        "currency": "<code>\"unit\": \"currency:XAF\"</code> — the <code>currency:</code> prefix triggers ISO display. Without it, you get a literal « currencyXAF ».",
        "novalue": "<code>\"noValue\": \"0\"</code> — on stat panels, NULL becomes « No data ». This forces a clean 0."
      }
    },
    "stack": {
      "row": {
        "hosting": "Hosting", "hosting_val": "Grafana Cloud Free Tier (<code>kouemousah.grafana.net</code>)",
        "datasource": "Datasource", "datasource_val": "Postgres pooler IPv4 (<code>aws-0-eu-west-3.pooler.supabase.com:6543</code>)",
        "bi": "BI role", "bi_val": "<code>looker_readonly</code> (read-only on enriched views + MVs)",
        "dac": "Dashboards-as-code", "dac_val": "10 JSON files in <code>infra/grafana/dashboards/</code>",
        "push": "Push script", "push_val": "<code>packages/backend/scripts/push_grafana_dashboards.py</code> (idempotent API push)",
        "prov": "Provisioning YAML", "prov_val": "<code>infra/grafana/provisioning/{datasources,dashboards}/</code> (for self-hosted)",
        "refresh": "Auto-refresh", "refresh_val": "5 min default per dashboard",
        "embed": "Embed in Facil admin", "embed_val": "<code>d-solo</code> URL + <code>kiosk=tv</code> via <code>DashboardConfigService._build_grafana_embed_url()</code>",
        "token": "Token rotation", "token_val": "7-day expiry on <code>facil-deployer</code> service account"
      },
      "agent_title": "Reusable Agent",
      "agent_body": "The work was distilled into <code>infra/grafana/GRAFANA_DASHBOARDS_AGENT.md</code> — a reproducible 8-phase agent invokable via <code>/grafana-dashboards</code> slash-command. v1.1 added a multi-engine adapter (Postgres / MySQL / BigQuery / Snowflake / SQL Server) so the same agent runs on any project. 10 active guardrails neutralize known weaknesses (IPv4 pooler trap, currency format, template variables, token leak, missing rollback, etc.)."
    },
    "limits": {
      "title": "Known limits (honest)",
      "rls": "<strong>No row-level security (RLS) on Grafana</strong> — anyone with the embed URL can see the dashboard. Mitigation: permission gate at the wrapper application layer (<code>dashboards.view_business</code>). For real RLS, OAUTH2 community connector planned (Phase B.2).",
      "seed": "<strong>Seed data has all agents in Malabo</strong> — per-site distribution depends on production agent profiles populating <code>entity_location_id</code>.",
      "empty": "<strong>Inspections dashboard empty</strong> — legitimately, until the inspector mobile app captures field reports.",
      "token": "<strong>Token rotation</strong> — manual every 7 days. Automate via Cloud Scheduler + service account API.",
      "screenshot": "<strong>05 Payments screenshot missing</strong> at the time of writing this doc — the dashboard is live; capture pending."
    },
    "lineage": {
      "title": "Data lineage (audit-ready)",
      "intro": "Every panel can be traced through the stack:"
    },
    "roadmap": {
      "title": "Roadmap",
      "s1": "<strong>Q3 2026</strong>: OAUTH2 community connector for true multi-tenant RLS.",
      "s2": "<strong>Q3 2026</strong>: Alerts on revenue threshold + SLA breach (Grafana native, push to Slack).",
      "s3": "<strong>Q4 2026</strong>: Per-ministry deep-dive dashboards (1 per ministry, currently aggregated).",
      "s4": "<strong>Q4 2026</strong>: Anomaly detection on user activity (audit log) via Grafana ML plugin."
    },
    "related": {
      "title": "Related documentation",
      "arch": "<a href=\"architecture.html\">System Architecture</a> — backend / data layer overview",
      "db": "<a href=\"database.html\">Database Schema</a> — full table reference (145 tables)",
      "readme": "<code>infra/grafana/README.md</code> — provisioning + push script reference",
      "agent": "<code>infra/grafana/GRAFANA_DASHBOARDS_AGENT.md</code> — reusable 8-phase agent"
    }
  }
}
;
