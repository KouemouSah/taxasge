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
  }
}
;
