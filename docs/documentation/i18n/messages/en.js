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
  }
}
;
