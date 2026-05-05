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
  }
}
;
