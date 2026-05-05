window.__I18N__ = window.__I18N__ || {};
window.__I18N__.es =
{
  "common": {
    "sidebar": {
      "subtitle": "Referencia técnica",
      "toggle_label": "Alternar navegación",
      "footer": "Facil v1.1.8 · Actualizado mayo 2026",
      "section": {
        "getting_started": "Primeros pasos",
        "architecture": "Arquitectura",
        "reference": "Referencia",
        "features": "Características",
        "observability": "Observabilidad",
        "operations": "Operaciones"
      },
      "link": {
        "home": "Inicio",
        "architecture": "Arquitectura del sistema",
        "database": "Esquema de base de datos",
        "workflows": "Motor de flujos de trabajo",
        "api_reference": "Referencia API",
        "modules": "Catálogo de módulos",
        "agents": "IA & Inteligencia",
        "payments": "Pagos",
        "grafana": "Paneles Grafana",
        "logrocket": "Observabilidad LogRocket",
        "security": "Seguridad",
        "deployment": "Despliegue",
        "i18n": "Internacionalización"
      }
    },
    "breadcrumb": {
      "docs": "Docs"
    },
    "toc": {
      "title": "En esta página"
    },
    "footer": {
      "copyright": "Plataforma Facil v1.1.8 · © 2026 Sah Kouemou",
      "link": {
        "api": "API"
      }
    }
  },

  "modules": {
    "html_title": "Catálogo de módulos - Documentación Facil",
    "title": "Catálogo de módulos",
    "description": "Inventario completo de los 30 módulos backend y los 41+ módulos frontend, organizados por dominio. Cada módulo sigue una estructura interna estándar (API/servicios/repositorios para el backend; componentes/hooks/servicios/tipos para el frontend).",
    "toc": {
      "backend": "Módulos backend (30)",
      "frontend": "Módulos frontend (41+)",
      "core": "Núcleo & Identidad",
      "services": "Servicios & Flujos",
      "financial": "Financiero",
      "agents": "Operaciones de agentes",
      "intelligence": "Inteligencia",
      "platform": "Plataforma"
    },
    "backend": {
      "intro": "Ubicados en <code>packages/backend/app/modules/</code>. Cada módulo es un paquete Python con subpaquetes para rutas API, modelos, repositorios y servicios."
    },
    "frontend": {
      "intro": "Ubicados en <code>packages/web/src/modules/</code>. Cada módulo contiene componentes, hooks, servicios y tipos."
    },
    "table": {
      "module": "Módulo",
      "purpose": "Función",
      "endpoints": "Endpoints clave",
      "tables": "Tablas",
      "domain": "Dominio"
    },
    "row": {
      "auth": { "purpose": "Autenticación: inicio de sesión, registro, JWT, 2FA, restablecimiento de contraseña", "endpoints_count": "9 endpoints" },
      "users": { "purpose": "Gestión de perfil de usuario, subida de avatar" },
      "permissions": { "purpose": "RBAC: roles, permisos, anulaciones por usuario, sincronización automática" },
      "companies": { "purpose": "Gestión de empresas, roles de miembros, clasificación, directorio público", "routers_count": "5 routers" },
      "funcionario": { "purpose": "Verificación de funcionarios públicos", "tables_note": "campos de funcionario" },
      "fiscal_services": { "purpose": "Catálogo de 873 servicios fiscales, paquetes, plantillas, reglas de configuración, licencias, OMS", "routers_count": "7 routers" },
      "service_requests": { "purpose": "Ciclo de vida de las solicitudes, sesiones del wizard, citas, procesamiento por agentes, vistas admin", "routers_count": "6 routers" },
      "declarations": { "purpose": "Declaraciones fiscales (34 tipos), operaciones por lotes" },
      "documents": { "purpose": "Subida/descarga de documentos, cola de procesamiento OCR" },
      "user_documents": { "purpose": "Caja fuerte documental del usuario" },
      "batch_requests": { "purpose": "Operaciones masivas de solicitudes de servicio" },
      "verified_identifiers": { "purpose": "Verificación de documentos externos" },
      "inspections": { "purpose": "Inspecciones de campo: misiones, analítica, recolección, exportación", "routers_count": "4 routers, 44+ endpoints" },
      "payments": { "purpose": "Procesamiento de pagos, integración con BANGE, verificación" },
      "treasury": { "purpose": "Panel de tesorería, seguimiento de ingresos, conciliación", "endpoints": "Endpoints con alcance de tesorería" },
      "accountant": { "purpose": "Herramientas para contables: seguimiento de plazos, declaraciones por lotes" },
      "webhooks": { "purpose": "Webhooks de pago BANGE, callbacks de sistemas externos" },
      "agents": { "purpose": "Perfiles de agentes, herramientas de análisis" },
      "assignment": { "purpose": "Asignación de tareas, vistas de supervisor, estadísticas" },
      "admin": { "purpose": "Diagnósticos admin, gestión de usuarios, monitorización, registros de auditoría" },
      "menu_config": { "purpose": "Configuración dinámica del menú de agente (basada en flujo + basada en módulos)" },
      "chatbot": { "purpose": "Chatbot RAG con Gemini 2.5 Flash, 35 herramientas, 5 roles de agente" },
      "enrichment": { "purpose": "Enriquecimiento por IA de las descripciones de servicio (600 caracteres, 3 párrafos)", "tables_note": "descriptions" },
      "communications": { "purpose": "Email, SMS, push, USSD, plantillas y envíos WhatsApp", "routers_count": "6 routers" },
      "translations": { "purpose": "Traducciones trilingües, traducciones de entidades, gestión de enums, claves frontend", "routers_count": "4 routers" },
      "support": { "purpose": "Sistema de tickets de soporte" },
      "homepage": { "purpose": "Estadísticas y datos de la página de inicio pública", "tables": "vista homepage_stats" },
      "cities": { "purpose": "Gestión de ciudades/ubicaciones" },
      "entity_locations": { "purpose": "Gestión de sedes físicas de las entidades" },
      "shared": { "purpose": "Utilidades compartidas y clases base" }
    },
    "fe": {
      "domain": {
        "core": "Núcleo",
        "public": "Público",
        "services": "Servicios",
        "financial": "Financiero",
        "business": "Empresa",
        "intelligence": "Inteligencia",
        "agent_ops": "Ops agentes",
        "admin": "Admin",
        "platform": "Plataforma"
      },
      "row": {
        "auth": "Formularios de inicio de sesión, registro, restablecimiento",
        "users": "Visualización y edición del perfil de usuario",
        "dashboard": "Diseño principal del panel y widgets",
        "homepage": "Sección hero, características, estadísticas",
        "fiscal_services": "Catálogo de servicios, búsqueda, filtrado",
        "service_requests": "Lista de solicitudes, detalle, recorrido del wizard",
        "declarations": "Formularios de declaración, fichas, operaciones por lotes",
        "payments": "Fichas de pago, interfaz de procesamiento",
        "documents": "Subida, vista previa, gestión de documentos",
        "user_documents": "Caja fuerte documental del usuario",
        "companies": "Gestión de empresas, lista de miembros, invitaciones",
        "accountant": "Calendario de plazos, cola de tareas",
        "chatbot": "Interfaz de chat, ajustes, sugerencias, error boundary",
        "agents": "Componentes y herramientas de agentes",
        "agent_dashboard": "Vistas específicas del panel de agente",
        "assignment": "Componentes de gestión de asignaciones",
        "assignments_admin": "Administración de asignaciones",
        "bundle_workflow": "Interfaz de pago agrupado multi-entidad",
        "inspections": "Gestión de inspecciones de campo",
        "oms": "Vistas del sistema de gestión de pedidos",
        "treasury": "Panel del agente de tesorería",
        "permissions": "Componentes de visualización de permisos",
        "permissions_admin": "Selector de roles, insignias de permisos",
        "user_permissions_admin": "Anulaciones de permisos por usuario",
        "roles_admin": "Gestión de roles, diálogos de permisos",
        "users_admin": "Panel de administración de usuarios",
        "agents_admin": "Administración de perfiles de agentes",
        "audit_logs_admin": "Visor de registros de auditoría con filtros",
        "admin": "Cabecera admin, alerta backend, componentes admin centrales",
        "service_requests_admin": "Vistas admin de solicitudes de servicio",
        "batch_requests": "Operaciones masivas de solicitudes",
        "support": "Interfaz de tickets de soporte",
        "communications": "Gestión de comunicaciones",
        "translations": "Interfaz de gestión de traducciones",
        "enrichment": "Gestión del enriquecimiento por IA",
        "templates": "Gestión de plantillas de documentos y procedimientos",
        "webhooks": "Configuración de webhooks",
        "cities": "Gestión de ciudades",
        "entity_locations": "Gestión de sedes de entidades",
        "verified_identifiers": "Gestión de identificadores verificados",
        "funcionario": "Verificación de funcionarios públicos"
      }
    }
  },

  "deployment": {
    "html_title": "Despliegue & Operaciones - Documentación Facil",
    "title": "Despliegue & Operaciones",
    "description": "CI/CD automatizado mediante GitHub Actions. El backend se despliega en Google Cloud Run (autoescalado de contenedores), el frontend en Firebase Hosting (CDN). Las apps móviles se compilan con Expo y se distribuyen por las tiendas.",
    "toc": {
      "cicd": "Pipeline CI/CD",
      "workflows": "Flujos de GitHub Actions",
      "cloud_run": "Google Cloud Run",
      "firebase": "Firebase Hosting",
      "environments": "Gestión de entornos",
      "migrations": "Migraciones BD",
      "mobile": "Distribución móvil",
      "monitoring": "Monitorización & Alertas"
    },
    "callout": {
      "no_manual": {
        "title": "Regla crítica: nada de builds manuales",
        "body": "<strong>Nunca compiles manualmente con <code>gcloud</code>.</strong> Todos los despliegues deben pasar por GitHub Actions. Empuja a la rama remota y deja que el pipeline CI/CD se encargue de compilar y desplegar."
      },
      "safety": {
        "title": "Seguridad de las migraciones",
        "body": "Verifica siempre el estado de la base antes de escribir una migración: <code>SELECT code FROM roles</code>, <code>SELECT column_name FROM information_schema.columns</code>, etc. Los códigos de roles y los valores de enums cambian con el tiempo y deben validarse contra la base real."
      }
    },
    "diagram": {
      "title": "Pipeline de despliegue",
      "workflows_count": "8 archivos de workflow",
      "ci_tests": "Tests CI",
      "ci_subtitle": "Lint, type-check, tests unitarios",
      "build_containers": "Build de contenedores",
      "build_frontend": "Build del frontend",
      "backend_api": "API backend",
      "frontend_cdn": "CDN del frontend"
    },
    "workflows": {
      "col_file": "Archivo de workflow",
      "col_trigger": "Disparador",
      "col_purpose": "Función",
      "ci": { "trigger": "Push a main, develop, feature/**", "purpose": "Linting, comprobación de tipos y tests unitarios" },
      "backend": { "trigger": "Push a develop (cambios en packages/backend/)", "purpose": "Build de la imagen Docker, despliegue Cloud Run staging" },
      "frontend": { "trigger": "Push a develop (cambios en packages/web/)", "purpose": "Build Next.js, despliegue Firebase Hosting staging" },
      "codeql": { "trigger": "Programado + PR", "purpose": "Análisis de seguridad CodeQL" },
      "mobile": { "trigger": "Push (cambios en packages/mobile/)", "purpose": "Build de la app ciudadano Expo" },
      "inspector": { "trigger": "Push (cambios en packages/inspector/)", "purpose": "Build de la app inspector Expo" },
      "inspector_ci": { "purpose": "Tests CI para la app inspector" },
      "dashboard": { "trigger": "Manual / Programado", "purpose": "Actualización del panel de documentación" }
    },
    "cloudrun": {
      "col_config": "Configuración",
      "col_value": "Valor",
      "row": {
        "service": "Nombre del servicio",
        "region": "Región",
        "runtime": "Runtime",
        "runtime_value": "Python 3.11 (contenedor)",
        "entry": "Punto de entrada",
        "min": "Instancias mín.",
        "min_value": "0 (escala a cero)",
        "max": "Instancias máx.",
        "max_value": "Auto-escaladas",
        "memory": "Memoria",
        "memory_value": "512 MB–1 GB por instancia",
        "timeout": "Timeout",
        "timeout_value": "300 segundos",
        "concurrency": "Concurrencia",
        "concurrency_value": "80 solicitudes por instancia"
      }
    },
    "firebase": {
      "col_property": "Propiedad",
      "col_dev": "Dev",
      "col_prod": "Producción",
      "row": {
        "project": "Proyecto",
        "url": "URL",
        "domain": "Dominio personalizado",
        "cdn": "CDN",
        "global": "Global",
        "ssl": "SSL",
        "automatic": "Automático",
        "staging": "Canales staging",
        "staging_value": "Patrón: <code>taxasge-dev--{channel}.web.app</code>"
      }
    },
    "envs": {
      "col_env": "Entorno",
      "col_branch": "Rama",
      "col_backend": "Backend",
      "col_frontend": "Frontend",
      "col_database": "Base de datos",
      "row": {
        "dev": "Desarrollo",
        "dev_db": "Local / Supabase dev",
        "staging": "Staging",
        "staging_backend": "Cloud Run staging",
        "staging_frontend": "Firebase dev",
        "staging_db": "Supabase staging",
        "prod": "Producción",
        "prod_backend": "Cloud Run prod",
        "prod_frontend": "Firebase prod",
        "prod_db": "Supabase prod"
      },
      "vars_title": "Variables de entorno",
      "vars_intro": "Variables de entorno clave configuradas en <code>packages/backend/.env</code>:"
    },
    "migrations": {
      "intro": "Las migraciones están en <code>packages/backend/migrations/</code> como archivos SQL y Python. Incluyen cambios de esquema, seeds de datos y definiciones de vistas.",
      "col_category": "Categoría",
      "col_count": "Cantidad",
      "col_examples": "Ejemplos",
      "row": {
        "schema": "Migraciones de esquema",
        "schema_count": "~10 numeradas",
        "views": "Definiciones de vistas",
        "seeds": "Datos seed",
        "runners": "Runners Python",
        "hotfixes": "Hotfixes",
        "various": "Variadas"
      }
    },
    "mobile": {
      "col_app": "Aplicación",
      "col_id": "Identificador del paquete",
      "col_dist": "Distribución",
      "row": {
        "citizen": "Facil (ciudadano)",
        "citizen_dist": "Builds Expo.dev, GitHub Releases, Google Play Store",
        "inspector_dist": "Builds Expo.dev, distribución interna"
      }
    },
    "monitoring": {
      "health_title": "Endpoint de health check",
      "endpoints_title": "Endpoints de monitorización",
      "health_desc": "Health check básico (público)",
      "admin_desc": "Salud detallada del sistema (admin)",
      "logging_title": "Logs",
      "logging_body": "Logging estructurado mediante <strong>Loguru</strong> con contexto. Cloud Run captura stdout/stderr y los reenvía a Google Cloud Logging para una monitorización centralizada."
    }
  },

  "security": {
    "html_title": "Arquitectura de seguridad - Documentación Facil",
    "title": "Arquitectura de seguridad",
    "description": "Seguridad multicapa que cubre autenticación (JWT + 2FA), autorización (RBAC con 47 roles y 335 permisos), protección de datos, conformidad OWASP y registro de auditoría completo.",
    "toc": {
      "request_flow": "Flujo de seguridad de una solicitud",
      "authentication": "Autenticación",
      "rbac": "Autorización RBAC",
      "owasp": "Conformidad OWASP",
      "data_protection": "Protección de datos",
      "file_security": "Seguridad de archivos",
      "ai_security": "Seguridad IA",
      "audit": "Registro de auditoría",
      "headers": "Cabeceras de seguridad"
    },
    "flow": {
      "incoming": "Solicitud entrante",
      "cors": "Verificación CORS",
      "rate": "Rate limiter",
      "headers": "Cabeceras de seguridad",
      "jwt": "Verificación JWT",
      "rbac": "Comprobación de permisos RBAC",
      "handler": "Handler",
      "audit": "Registro de auditoría"
    },
    "auth": {
      "col_feature": "Característica",
      "col_impl": "Implementación",
      "col_details": "Detalles",
      "row": {
        "password": "Hash de contraseña",
        "password_details": "12 rondas, sal por contraseña",
        "access": "Token de acceso",
        "access_details": "Vida útil 30 minutos",
        "refresh": "Token de refresco",
        "refresh_details": "Vida útil 30 días, revocable",
        "2fa_details": "OTP basado en tiempo, opcional por usuario",
        "lockout": "Bloqueo de inicio de sesión",
        "lockout_impl": "Retraso progresivo",
        "lockout_details": "La cuenta se bloquea tras varios intentos fallidos",
        "session": "Gestión de sesiones",
        "session_impl": "Respaldada por la base de datos",
        "session_details": "Tablas <code>sessions</code> + <code>refresh_tokens</code>",
        "email": "Verificación de email",
        "email_impl": "Mediante token",
        "email_details": "Tabla <code>pending_registrations</code>, expira en 15 min"
      }
    },
    "stats": {
      "roles": "Roles",
      "permissions": "Permisos",
      "audit": "Entradas de auditoría"
    },
    "rbac": {
      "model_title": "Modelo de permisos",
      "diagram_title": "Arquitectura RBAC",
      "user": "Usuario",
      "has_role": "▼ tiene rol",
      "role": "Rol",
      "role_subtitle": "47 roles (específicos por entidad)",
      "grants": "▼ otorga",
      "role_perms": "Permisos del rol",
      "role_perms_subtitle": "Tabla de mapeo role_permissions",
      "permissions_count": "335 permisos",
      "permissions_subtitle": "Permisos granulares resource.action",
      "overrides": "Además, las <strong>anulaciones de permisos por usuario</strong> permiten otorgar o revocar permisos específicos a usuarios individuales sin tocar su rol, almacenadas en la tabla <code>user_permissions</code>.",
      "naming_title": "Convención de nombres de permisos",
      "autosync_title": "Sincronización automática de permisos",
      "autosync_body": "Al arrancar, el sistema de permisos descubre automáticamente todos los archivos <code>*_permissions.py</code> de los módulos, los sincroniza con la base, los asigna a roles según los mapeos predefinidos y limpia los permisos obsoletos.",
      "realtime_title": "Invalidación en tiempo real",
      "realtime_body": "El <code>rbac_listener</code> se suscribe a un canal PostgreSQL NOTIFY. Cuando un rol o permiso cambia en la base, la caché se invalida inmediatamente (sin esperar al TTL)."
    },
    "owasp": {
      "col_top10": "OWASP Top 10",
      "col_mitigation": "Mitigación",
      "row": {
        "a01": "A01: Control de acceso roto",
        "a01_mitigation": "RBAC con 335 permisos, <code>@permission_required</code> por endpoint",
        "a02": "A02: Fallos criptográficos",
        "a02_mitigation": "bcrypt (12 rondas), TLS en todas partes, sin secretos en claro",
        "a03": "A03: Inyección",
        "a03_mitigation": "Consultas asyncpg parametrizadas ($1, $2), nunca concatenación",
        "a04": "A04: Diseño inseguro",
        "a04_mitigation": "Arquitectura de 3 capas, validación de entrada (Pydantic v2), defensa en profundidad",
        "a05": "A05: Configuración incorrecta",
        "a05_mitigation": "Middleware de cabeceras de seguridad, lista blanca CORS, configuraciones por entorno",
        "a06": "A06: Componentes vulnerables",
        "a06_mitigation": "GitHub Dependabot, análisis CodeQL",
        "a07": "A07: Fallos de autenticación",
        "a07_mitigation": "JWT con TTL corto, bloqueo progresivo, 2FA TOTP",
        "a08": "A08: Integridad de datos",
        "a08_mitigation": "Validación Pydantic en todas las entradas, Zod en frontend, restricciones BD",
        "a09": "A09: Logs & Monitorización",
        "a09_mitigation": "Logging estructurado Loguru, tabla audit_logs, 2800+ entradas",
        "a10": "A10: SSRF",
        "a10_mitigation": "Validación de URL en configuraciones webhook, sin fetch de URLs controladas por el usuario"
      }
    },
    "data": {
      "sql": "<strong>Prevención de inyecciones SQL:</strong> 100 % consultas parametrizadas vía asyncpg (placeholders <code>$1, $2</code>)",
      "xss": "<strong>Prevención XSS:</strong> DOMPurify en frontend, cabeceras CSP, sin dangerouslySetInnerHTML",
      "csrf": "<strong>CSRF:</strong> cookies SameSite, lista blanca de orígenes CORS",
      "5xx": "<strong>Saneamiento de errores 5xx:</strong> los detalles internos no se exponen al cliente (se devuelve un mensaje genérico traducido)",
      "secrets": "<strong>Gestión de secretos:</strong> Google Cloud Secret Manager para credenciales de producción"
    },
    "file": {
      "col_control": "Control",
      "col_details": "Detalles",
      "row": {
        "mime": "Validación MIME",
        "mime_details": "Verificado contra el contenido real del archivo, no solo la extensión",
        "ext": "Lista negra de extensiones",
        "ext_details": "Archivos ejecutables (.exe, .bat, .sh, etc.) bloqueados",
        "size": "Límites de tamaño",
        "size_details": "Límites por archivo y por solicitud aplicados",
        "storage": "Almacenamiento",
        "storage_details": "Supabase Storage con URLs firmadas (acceso limitado en tiempo)",
        "access": "Control de acceso",
        "access_details": "Archivos restringidos al propietario (user_id) o agentes asignados"
      }
    },
    "ai": {
      "intro": "El chatbot implementa detección de inyección de prompt con 30+ reglas para impedir la explotación adversaria del LLM.",
      "col_protection": "Protección",
      "col_impl": "Implementación",
      "row": {
        "injection": "Detección de inyección de prompt",
        "injection_impl": "30+ patrones regex para técnicas de inyección comunes",
        "tools": "Acceso a herramientas por rol",
        "tools_impl": "Herramientas filtradas por rol antes de invocar a Gemini",
        "boundary": "Aplicación de fronteras de datos",
        "boundary_impl": "El agente ciudadano no puede acceder a datos internos del agente",
        "output": "Saneamiento de salida",
        "output_impl": "Salida del LLM saneada antes de renderizar en frontend",
        "rate": "Rate limiting",
        "rate_impl": "30 mensajes/minuto por usuario",
        "consent": "Consentimiento explícito",
        "consent_impl": "Las operaciones privilegiadas requieren confirmación explícita del usuario"
      }
    },
    "audit": {
      "intro": "La tabla <code>audit_logs</code> captura todas las operaciones críticas del sistema mediante el handler de auditoría del EventBus. Los registros incluyen actor, acción, recurso, marca temporal y metadatos.",
      "ops_title": "Operaciones auditadas",
      "ops": {
        "login": "Inicio/cierre de sesión, intentos de autenticación fallidos",
        "roles": "Cambios de roles y permisos",
        "requests": "Creación de solicitudes de servicio, transiciones de estado",
        "payments": "Decisiones de procesamiento de pagos (aprobar/rechazar)",
        "assignments": "Cambios de asignación de agentes",
        "admin": "Operaciones admin de gestión de usuarios",
        "documents": "Subida/descarga/eliminación de documentos",
        "config": "Cambios de configuración del sistema"
      }
    },
    "headers": {
      "intro": "Aplicadas mediante middleware ASGI puro (<code>SecurityHeadersMiddleware</code>) para evitar conflictos con CORSMiddleware:"
    },
    "callout": {
      "csp": {
        "title": "Cabeceras CSP",
        "body": "Las cabeceras Content Security Policy (CSP) las establece el middleware Next.js del frontend (<code>middleware.ts</code>), no el backend. Esto evita cabeceras CSP duplicadas/conflictivas que harían que el navegador aplique su intersección (la más restrictiva)."
      }
    }
  },

  "payments": {
    "html_title": "Sistemas de pago - Documentación Facil",
    "title": "Sistemas de pago & finanzas",
    "breadcrumb": "Sistemas de pago",
    "description": "Procesamiento de pagos para todos los servicios de Facil, incluyendo pagos de servicio mono-entidad y pagos agrupados multi-entidad para licencias comerciales. Integrado con el banco BANGE para mobile money, tarjetas y transferencias bancarias.",
    "toc": {
      "architecture": "Arquitectura de pagos",
      "methods": "Métodos de pago",
      "workflow": "Flujo de pago (17 estados)",
      "atomic": "Pipeline de pago atómico",
      "bundle": "Flujo de pago agrupado",
      "lock": "Orden de bloqueo (concurrencia)",
      "receipts": "Generación de recibos",
      "security": "Seguridad de recibos y verificación QR",
      "reporting": "Informes financieros",
      "bange": "Integración BANGE"
    },
    "diagram": {
      "title": "Flujo de procesamiento de pagos",
      "wizard": "Sesión wizard",
      "wizard_sub": "Caché primero (Redis)",
      "initiate": "▼ initiate-payment",
      "atomic": "Transacción atómica",
      "atomic_sub": "Persistencia + pago en una sola transacción BD",
      "bange_proc": "Procesador BANGE",
      "bange_sub": "mobile_money / card / bank_transfer",
      "manual_proc": "Procesador manual",
      "manual_sub": "efectivo / cheque (validación del agente)",
      "redirect": "URL de redirección / confirmación",
      "webhook": "▼ Callback webhook",
      "completed": "Pago completado",
      "completed_sub": "EventBus: auto-asignación a los agentes de la entidad"
    },
    "methods": {
      "col_method": "Método",
      "col_enum": "Valor enum",
      "col_processor": "Procesador",
      "col_flow": "Flujo",
      "row": {
        "mobile": "Mobile money",
        "mobile_flow": "Redirección a BANGE, callback webhook",
        "card": "Tarjeta de crédito/débito",
        "card_flow": "Redirección a la página de pago BANGE",
        "transfer": "Transferencia bancaria",
        "transfer_flow": "Redirección al portal del banco",
        "wallet": "Wallet BANGE",
        "wallet_flow": "Débito directo del wallet",
        "cash": "Efectivo",
        "manual": "Manual",
        "cash_flow": "El agente valida en persona"
      }
    },
    "workflow": {
      "summary": "Los 17 estados del flujo de pago",
      "col_state": "Estado",
      "col_desc": "Descripción",
      "row": {
        "submitted": "Pago creado, en espera de procesamiento",
        "auto": "Procesamiento automático del sistema (redirección BANGE)",
        "pending": "Pago manual a la espera de revisión por un agente",
        "locked": "El agente ha bloqueado el pago para revisión",
        "approved": "El agente aprobó el pago",
        "rejected": "El agente rechazó el pago",
        "completed": "Pago totalmente procesado y confirmado",
        "docs": "Documentos adicionales solicitados",
        "escalated": "Escalado al supervisor",
        "cancelled": "Pago cancelado",
        "refund_req": "Reembolso iniciado",
        "refund_app": "Reembolso aprobado por el supervisor",
        "refund_done": "Reembolso procesado",
        "hold": "Pago temporalmente en pausa",
        "expired": "Ventana de pago expirada",
        "partial": "Importe parcial recibido",
        "bank": "A la espera del callback BANGE"
      }
    },
    "atomic": {
      "intro": "El endpoint <code>POST /wizard-sessions/{id}/initiate-payment</code> ejecuta todas las operaciones en una sola transacción de BD. Si algún paso falla, todo se revierte.",
      "step1": "1. Leer la sesión Redis",
      "step2": "2. Validar los datos",
      "step3": "3. BEGIN TX",
      "step4": "4. INSERT service_request",
      "step5": "5. Subir documentos a Firebase",
      "step6": "6. INSERT service_payment",
      "step7": "7. Confirmar la cita",
      "step8": "8. COMMIT",
      "callout_title": "Sin registros huérfanos",
      "callout_body": "El pipeline atómico garantiza que una solicitud de servicio nunca se cree sin su pago asociado, y viceversa. El fallo en la subida de un documento dispara una reversión completa."
    },
    "bundle": {
      "intro": "Los pagos agrupados manejan obligaciones de licencias comerciales que abarcan múltiples entidades gubernamentales. Una sola licencia comercial puede generar obligaciones hacia TESORO, AYUNTAMIENTO, CAMARA_COMERCIO y diversos ministerios MIN_*.",
      "step1": "Licencia comercial",
      "step2": "Clasificación",
      "step3": "Resolución de zona",
      "step4": "Generación de obligaciones",
      "step5": "Validación multi-entidad",
      "step6": "Pago",
      "step7": "Recibo",
      "multi_title": "Validación multi-entidad",
      "multi_body": "Cada entidad valida independientemente su parte del paquete. La entidad TESORO valida la conformidad financiera global, AYUNTAMIENTO valida los requisitos municipales y CAMARA_COMERCIO verifica el estado de registro comercial."
    },
    "lock": {
      "callout_title": "Prevención de deadlocks",
      "callout_body": "Para cualquier transacción que toque licencias comerciales Y pagos de campo, se DEBE seguir el siguiente orden canónico de bloqueo. Violarlo provoca deadlocks con 100+ agentes concurrentes.",
      "step1": "<strong><code>commercial_licenses</code></strong> &mdash; <code>SELECT ... FOR UPDATE</code> (el único bloqueo explícito &mdash; entidad raíz)",
      "step2": "<strong><code>service_requests</code></strong> &mdash; solo <code>INSERT</code> (optimista mediante índice UNIQUE parcial, sin <code>FOR UPDATE</code>)",
      "step3": "<strong><code>license_obligations</code></strong> &mdash; <code>UPDATE</code> por lote (los bloqueos se adquieren automáticamente)",
      "step4": "<strong><code>service_payments</code></strong> &mdash; <code>INSERT</code> final",
      "warn_title": "Nunca FOR UPDATE en service_requests",
      "warn_body": "La concurrencia en <code>service_requests</code> se gestiona mediante el índice único parcial <code>idx_sr_commercial_license_unique</code> + recuperación <code>try/except asyncpg.UniqueViolationError</code> (SELECT determinista por <code>commercial_license_id</code>)."
    },
    "receipts": {
      "intro": "Los recibos PDF se generan mediante <code>SummaryPDFService</code> con la plantilla <code>citizen_summary_pdf.html</code> (490 líneas). Los recibos incluyen:",
      "item1": "Nombre de la entidad y ciudad en el encabezado",
      "item2": "Detalles del servicio fiscal por obligación",
      "item3": "Importes calculados con desglose",
      "item4": "Referencia y marca temporal del pago",
      "item5": "Código QR para verificación del recibo"
    },
    "security": {
      "title": "Seguridad de recibos y verificación QR",
      "intro": "Cada recibo, licencia, certificado y PDF de solicitud de servicio generado por Facil está <strong>firmado criptográficamente</strong> y <strong>verificable públicamente vía código QR</strong>. El QR codifica un deep-link a un endpoint público de verificación; el enlace lleva un token <strong>HMAC-SHA256</strong> imposible de falsificar sin el secreto del lado del servidor. Manipular el número de recibo, el importe o la fecha rompe la firma &mdash; el endpoint de verificación rechaza entonces el documento.",
      "diagram_title": "Arquitectura &mdash; Flujo Firmar y Verificar",
      "diagram_caption": "Generación (servidor) → QR (PDF) → Verificación pública (cualquier dispositivo)",
      "box": {
        "gen": "1. Recibo PDF generado", "gen_sub": "pago validado → PDF renderizado con WeasyPrint",
        "sign": "2. Firma HMAC-SHA256", "sign_sub": "mensaje: numero_recibo | importe | AAAAMMDD<br>secreto: RECEIPT_VERIFICATION_SECRET<br>salida: digest hex 16 caracteres",
        "qr": "3. QR codificado", "qr_sub": "URL: https://app/verify/{ref}?t={token}<br>incrustado como PNG base64 en el PDF",
        "store": "4. Almacenado en bóveda", "store_sub": "URL firmada Firebase Storage + fila de auditoría + entrada en bóveda del usuario",
        "scan": "5. Cualquiera escanea el QR", "scan_sub": "el navegador abre<br>GET /api/v1/verify/{ref}?t=...<br>(sin autenticación)",
        "verify": "6. El servidor recalcula el HMAC", "verify_sub": "hmac.compare_digest() — tiempo constante<br>match → 200 + datos del pago<br>mismatch → 404"
      },
      "tech_title": "Lo que hace al documento infalsificable",
      "col_control": "Control de seguridad", "col_impl": "Implementación", "col_why": "Por qué importa",
      "row": {
        "algo": "Algoritmo criptográfico",
        "algo_why": "Digest autenticado estándar. Falsificar un token válido requiere el secreto del servidor — computacionalmente inviable sin él.",
        "secret": "Secreto de firma",
        "secret_why": "Secreto permanente cargado desde el entorno / Secret Manager. Nunca SECRET_KEY (que rotaría en cada arranque en frío de Cloud Run e invalidaría QRs antiguos).",
        "payload": "Mensaje firmado",
        "payload_why": "Liga el token al recibo exacto, importe exacto y día del pago. Editar cualquier campo del PDF → la firma se rompe → la verificación falla.",
        "compare": "Comparación",
        "compare_why": "Comparación a tiempo constante — inmune a ataques de canal lateral temporal que de otro modo podrían filtrar el token byte por byte.",
        "token": "Formato del token",
        "token_val": "16 caracteres hex (los primeros 64 bits del HMAC)",
        "token_why": "Suficientemente compacto para un QR pequeño (ERROR_CORRECT_M sigue siendo escaneable en un teléfono), suficientemente grande para hacer la búsqueda por fuerza bruta inviable (2^64).",
        "endpoint": "Endpoints públicos",
        "endpoint_why": "Sin autenticación requerida — cualquiera (tercero, cajero, agente aduanero) puede escanear y verificar en un toque. La privacidad se preserva: la respuesta solo confirma validez + datos mínimos.",
        "vault": "Almacenamiento y bóveda",
        "vault_why": "PDF persistido en Firebase Storage con URL firmada y registrado en la bóveda ciudadana. El QR se verifica contra el estado BD en vivo, así un pago revocado / reembolsado puede señalarse al escanear."
      },
      "threat_title": "Modelo de amenazas",
      "threat": {
        "edit": "<strong>Editar el PDF impreso</strong> (cambiar importe, nombre o fecha en un editor PDF) → el token QR ya no coincide con el nuevo contenido → el endpoint devuelve 404. Detectado al primer escaneo.",
        "replay": "<strong>Reutilizar un QR para otro recibo</strong> → el endpoint carga el recibo por su número, no por el token; un token robado no puede emparejarse con otro número de recibo.",
        "brute": "<strong>Fuerza bruta sobre un token</strong> → espacio de búsqueda 2<sup>64</sup>, endpoint público con rate-limit. Estadísticamente inviable.",
        "timing": "<strong>Canal lateral temporal</strong> → mitigado por <code>hmac.compare_digest()</code>.",
        "secret": "<strong>Fuga del secreto</strong> → rotar <code>RECEIPT_VERIFICATION_SECRET</code> en Secret Manager — los recibos antiguos deben entonces resignarse si se requiere verificación continua (compromiso aceptable ante incidentes de seguridad)."
      }
    },
    "reporting": {
      "col_report": "Informe",
      "col_scope": "Ámbito",
      "col_desc": "Descripción",
      "scope": { "entity": "Entidad", "system": "Sistema", "agent": "Agente", "bank": "Banco", "ministry": "Ministerio" },
      "row": {
        "revenue": "Ingresos por entidad",
        "revenue_desc": "Ingresos totales por entidad gubernamental y por periodo",
        "bank": "Conciliación bancaria",
        "bank_desc": "Cotejo de transacciones bancarias con registros de pago",
        "audit": "Auditoría de validación de pagos",
        "audit_desc": "Pista de auditoría de todas las decisiones de validación de pago",
        "collection": "Analítica de cobranzas",
        "collection_desc": "Rendimiento de cobranza por configuración bancaria",
        "ministry": "Resumen ministerial",
        "ministry_desc": "Resumen financiero por ministerio/entidad"
      }
    },
    "bange": {
      "intro": "BANGE es el procesador de pagos principal para Guinea Ecuatorial. La integración utiliza callbacks webhook para confirmar el estado de los pagos.",
      "col_feature": "Característica",
      "col_details": "Detalles",
      "row": {
        "webhook": "Endpoint webhook",
        "callback": "Verificación de callback",
        "callback_val": "Validación de firma HMAC",
        "currencies": "Monedas soportadas",
        "logging": "Registro de transacciones",
        "logging_val": "Tabla <code>bank_transactions</code>",
        "config": "Configuración",
        "config_val": "Tabla <code>bank_configurations</code> (claves API, URLs webhook)"
      }
    }
  },

  "i18npage": {
    "html_title": "Internacionalización - Documentación Facil",
    "title": "Guía de internacionalización",
    "description": "Facil es totalmente trilingüe: español (idioma principal), francés e inglés. El sistema i18n abarca el frontend (11.400+ claves por locale), el backend (traducciones de entidades + mensajes de error), las apps móviles y las plantillas de comunicación.",
    "toc": {
      "overview": "Resumen del soporte de idiomas",
      "frontend": "i18n frontend (next-intl)",
      "backend": "i18n backend",
      "db": "Traducciones BD",
      "mobile": "i18n móvil",
      "communications": "Plantillas de comunicación",
      "adding": "Añadir nuevas claves"
    },
    "stats": {
      "languages": "Idiomas",
      "keys": "Claves por locale",
      "savings": "Ahorro de almacenamiento (entity_translations)"
    },
    "langs": {
      "col_lang": "Idioma",
      "col_code": "Código",
      "col_status": "Estado",
      "col_notes": "Notas",
      "row": {
        "es": "Español",
        "es_status": "Principal",
        "es_notes": "Idioma oficial de Guinea Ecuatorial. Todo el contenido de la BD se almacena en español.",
        "fr": "Francés",
        "fr_notes": "Idioma oficial de Guinea Ecuatorial. UI + traducciones de entidades completas.",
        "en": "Inglés",
        "en_notes": "Soporte internacional. UI + traducciones de entidades completas.",
        "complete": "Completo"
      }
    },
    "fe": {
      "arch_title": "Arquitectura",
      "arch_body": "El frontend utiliza <code>next-intl</code> con el segmento <code>[locale]</code> del App Router de Next.js. Todas las páginas están anidadas bajo <code>/[locale]/</code>, que detecta y aplica el idioma automáticamente.",
      "usage_title": "Uso en componentes",
      "keys_title": "Estructura de las claves de traducción",
      "keys_body": "Las claves se organizan jerárquicamente por módulo/página:"
    },
    "be": {
      "middleware_title": "Middleware de detección de idioma",
      "middleware_body": "El <code>language_middleware</code> detecta el idioma del usuario a partir de la cabecera <code>Accept-Language</code> y lo almacena en <code>request.state.language</code> para su uso durante todo el ciclo de vida de la solicitud.",
      "errors_title": "Traducción de mensajes de error",
      "errors_body": "Los mensajes de error se traducen automáticamente según el idioma detectado. La clase <code>TranslatedException</code> lleva un <code>error_code</code> que se mapea a mensajes trilingües. La concordancia de patrones gestiona las excepciones HTTP heredadas."
    },
    "db": {
      "tables_title": "Dos tablas de traducción",
      "col_table": "Tabla",
      "col_purpose": "Función",
      "col_storage": "Modelo de almacenamiento",
      "row": {
        "translations_purpose": "Traducciones unificadas para ENUMs, etiquetas UI, campos de formulario, mensajes del sistema",
        "translations_storage": "Clave-valor con columna de locale",
        "entity_purpose": "Traducciones específicas de entidades (nombres de ministerios, nombres de servicios, etc.)",
        "entity_storage": "Estructura optimizada (40 % de reducción de almacenamiento vs columnas inline)"
      },
      "convention_title": "Convención de contenido BD",
      "convention_callout_title": "Español en BD, traducido en tiempo de ejecución",
      "convention_callout_body": "Todo el contenido de la BD (nombres de ministerios, nombres de servicios, categorías) se almacena en español (idioma principal). Las traducciones al francés y al inglés se almacenan en la tabla <code>entity_translations</code> y se resuelven en tiempo de consulta.",
      "pattern_title": "Patrón de traducción de entidad",
      "cache_title": "Caché de traducciones",
      "cache_body": "Las traducciones se cachean durante 1 hora mediante <code>get_translations_cache()</code> para minimizar las consultas a BD. La invalidación del caché se dispara cuando se actualizan las traducciones vía la API de admin."
    },
    "mobile": {
      "body": "Ambas aplicaciones móviles (Facil ciudadano y Facil Inspector) soportan los mismos 3 idiomas. Las traducciones se almacenan como archivos JSON empaquetados con la app y se cargan en tiempo de ejecución según la preferencia del usuario."
    },
    "comm": {
      "body": "Las plantillas de email, SMS, notificación push y notificación in-app se almacenan en sus respectivas tablas (<code>email_templates</code>, <code>sms_templates</code>, <code>push_templates</code>, <code>notification_templates</code>) con contenido para los 3 idiomas.",
      "col_type": "Tipo de plantilla",
      "col_table": "Tabla",
      "col_render": "Renderizado",
      "row": {
        "email": "Email",
        "email_render": "Jinja2 con asunto + cuerpo trilingües",
        "sms_render": "Texto plano, segmentos de 160 caracteres",
        "push": "Notificación push",
        "push_render": "Título + cuerpo por locale",
        "inapp": "In-app",
        "inapp_render": "Notificación estructurada por locale"
      }
    },
    "add": {
      "intro": "Para añadir una nueva clave de traducción:",
      "step1": "Añade la clave a los <strong>3 archivos JSON</strong> (<code>es.json</code>, <code>fr.json</code>, <code>en.json</code>)",
      "step2": "Sigue la estructura jerárquica existente: <code>module.section.key</code>",
      "step3": "Proporciona traducciones reales (sin placeholders auto-traducidos)",
      "step4": "Usa la clave en tu componente con <code>useTranslations('module')</code>",
      "step5": "Para cadenas parametrizadas, usa el formato ICU: <code>\"count\": \"{count} servicios\"</code>",
      "endpoints_title": "Endpoints API de traducción",
      "ep1": "Listar traducciones por categoría/locale",
      "ep2": "Crear una nueva entrada de traducción",
      "ep3": "Actualizar una traducción",
      "ep4": "Obtener traducciones de entidad",
      "ep5": "Recuperación masiva para hidratación frontend",
      "ep6": "Obtener valores de enum con sus traducciones"
    }
  },

  "agents": {
    "html_title": "IA & Inteligencia - Documentación Facil",
    "description": "Facil integra IA en cuatro dominios: un chatbot RAG con 35 herramientas, inteligencia documental OCR con 40 esquemas, asignación inteligente de agentes y enriquecimiento de contenido. Todo impulsado por Google Vertex AI (Gemini 2.5 Flash) y embeddings pgvector.",
    "toc": {
      "rag": "Arquitectura del chatbot RAG",
      "hybrid": "Pipeline de búsqueda híbrida",
      "tools": "35 herramientas especializadas",
      "roles": "5 agentes por rol",
      "reflection": "Bucle de auto-reflexión",
      "ocr": "Inteligencia documental OCR",
      "assignment": "Motor de asignación inteligente",
      "enrichment": "Enriquecimiento de contenido",
      "security": "Seguridad IA (OWASP)"
    },
    "rag": {
      "diagram_title": "Pipeline RAG",
      "user_msg": "Mensaje del usuario",
      "preprocessor": "Preprocesador de consulta",
      "preprocessor_sub": "query_preprocessor.py: detección de idioma, clasificación de intención, expansión de consulta",
      "embedding": "Embedding",
      "hybrid": "Búsqueda híbrida",
      "hybrid_sub": "70 % coseno pgvector + 30 % búsqueda full-text tsvector",
      "context": "Ensamblado de contexto",
      "context_sub": "chatbot_service_rag.py: docs + contexto de usuario + selección de herramientas",
      "gemini_sub": "gemini_service.py: prompt estructurado + 35 herramientas",
      "reflection": "Auto-reflexión",
      "reflection_sub": "Score < 5/10 dispara una regeneración",
      "response": "Respuesta",
      "response_sub": "15 formatos de salida + servicios relacionados",
      "services_title": "Servicios backend",
      "col_file": "Archivo",
      "col_resp": "Responsabilidad",
      "row": {
        "main": "Orquestador principal: búsqueda, ensamblado de contexto, construcción de prompt, formateo de respuesta",
        "gemini": "Cliente API de Gemini: inicialización del modelo, ejecución de herramientas, streaming",
        "embedding": "Embedding de texto vía Vertex AI text-embedding-004 (768 dimensiones)",
        "preprocessor": "Análisis de consulta: detección de idioma, clasificación de intención, expansión",
        "tools_pub": "19 definiciones de herramientas públicas para usuarios no autenticados",
        "tools_auth": "16 herramientas autenticadas (8 auth-required + 8 deep reasoning)",
        "consent": "Gestión del consentimiento explícito para operaciones privilegiadas"
      }
    },
    "hybrid": {
      "intro": "La búsqueda combina enfoques semántico (vectorial) y léxico (full-text) con pesos configurables:",
      "col_component": "Componente",
      "col_weight": "Peso",
      "col_tech": "Tecnología",
      "col_index": "Índice",
      "row": {
        "semantic": "Búsqueda semántica",
        "semantic_tech": "Similitud coseno pgvector (operador <code>&lt;=&gt;</code>)",
        "semantic_index": "Índice IVFFlat sobre la columna embedding",
        "fulltext": "Búsqueda full-text",
        "fulltext_tech": "tsvector/tsquery PostgreSQL (<code>ts_rank</code>)",
        "fulltext_index": "Índice GIN sobre la columna tsvector"
      }
    },
    "tools": {
      "public_summary": "19 herramientas públicas (no autenticadas)",
      "public_intro": "Disponibles para todos los usuarios (incluyendo visitantes anónimos):",
      "public": {
        "search": "<strong>search_services</strong> &mdash; Búsqueda en el catálogo de servicios fiscales",
        "details": "<strong>get_service_details</strong> &mdash; Detalles completos de un servicio",
        "ministry": "<strong>get_ministry_services</strong> &mdash; Servicios por ministerio",
        "requirements": "<strong>get_service_requirements</strong> &mdash; Documentos requeridos para un servicio",
        "procedure": "<strong>get_service_procedure</strong> &mdash; Procedimiento paso a paso",
        "fee": "<strong>calculate_fee</strong> &mdash; Calculadora de tasas",
        "offices": "<strong>get_office_locations</strong> &mdash; Sedes de las entidades",
        "faq": "<strong>get_faq</strong> &mdash; Preguntas frecuentes",
        "more": "Más 11 herramientas adicionales de recuperación de información"
      },
      "auth_summary": "8 herramientas autenticadas",
      "auth_intro": "Disponibles solo para usuarios conectados (datos personales en alcance):",
      "auth": {
        "requests": "<strong>get_my_requests</strong> &mdash; Solicitudes de servicio del usuario",
        "status": "<strong>get_request_status</strong> &mdash; Estado de una solicitud específica",
        "payments": "<strong>get_my_payments</strong> &mdash; Historial de pagos del usuario",
        "declarations": "<strong>get_my_declarations</strong> &mdash; Declaraciones fiscales del usuario",
        "appointments": "<strong>get_my_appointments</strong> &mdash; Citas del usuario",
        "documents": "<strong>get_my_documents</strong> &mdash; Documentos subidos por el usuario",
        "company": "<strong>get_my_company</strong> &mdash; Información de la empresa",
        "support": "<strong>create_support_ticket</strong> &mdash; Crear ticket de soporte"
      },
      "deep_summary": "8 herramientas de razonamiento avanzado (agentes privilegiados)",
      "deep_intro": "Disponibles para agentes Tesorería, Supervisor y Admin con acceso de alcance entidad:",
      "deep": {
        "revenue": "<strong>analyze_revenue</strong> &mdash; Análisis de ingresos por entidad/período",
        "team": "<strong>get_team_metrics</strong> &mdash; Métricas de rendimiento del equipo",
        "sla": "<strong>get_sla_compliance</strong> &mdash; Informes de cumplimiento SLA",
        "workload": "<strong>get_workload_distribution</strong> &mdash; Análisis de carga de los agentes",
        "escalation": "<strong>get_escalation_history</strong> &mdash; Historial de escaladas",
        "times": "<strong>analyze_processing_times</strong> &mdash; Estadísticas de tiempo de procesamiento",
        "perf": "<strong>get_agent_performance</strong> &mdash; Rendimiento individual de un agente",
        "audit": "<strong>get_audit_trail</strong> &mdash; Consultas sobre el registro de auditoría"
      }
    },
    "roles": {
      "col_agent": "Agente",
      "col_users": "Usuarios",
      "col_tools": "Herramientas",
      "col_data": "Acceso a datos",
      "col_capability": "Capacidad clave",
      "row": {
        "citizen": { "name": "<strong>Agente ciudadano</strong>", "users": "Visitantes anónimos", "tools": "19 públicas", "data": "Solo catálogo público", "cap": "Información de servicios, cálculo de tasas" },
        "auth": { "name": "<strong>Agente autenticado</strong>", "users": "Ciudadanos/empresas conectados", "tools": "19 + 8 auth", "data": "Solo datos personales", "cap": "Seguimiento de solicitudes, historial de pagos" },
        "treasury": { "name": "<strong>Agente tesorería</strong>", "users": "Personal de tesorería", "tools": "19 + 8 + 8 deep", "data": "Financiero con alcance entidad", "cap": "Análisis de ingresos, conciliación" },
        "supervisor": { "name": "<strong>Agente supervisor</strong>", "users": "Supervisores de equipo", "tools": "19 + 8 + 8 deep", "data": "Métricas con alcance equipo", "cap": "Gestión de carga, monitoreo SLA" },
        "admin": { "name": "<strong>Agente admin</strong>", "users": "Administradores de sistema", "tools": "Las 35", "data": "Total (con pista de auditoría)", "cap": "Diagnósticos del sistema, acceso completo" }
      },
      "callout_title": "Fronteras de confidencialidad",
      "callout_body": "Cada rol de agente tiene fronteras estrictas de acceso a datos aplicadas a nivel de herramienta. Un agente ciudadano <strong>no puede</strong> acceder a datos internos, ni siquiera si el prompt intenta engañarlo. Los agentes tesorería solo ven datos de su entidad asignada."
    },
    "reflection": {
      "intro": "Tras generar una respuesta, el chatbot evalúa por sí mismo la calidad de su respuesta en una escala de 1 a 10. Si la puntuación es inferior a 5, regenera con un contexto ajustado. Esto garantiza una calidad de respuesta consistentemente alta.",
      "step1": "Generar respuesta",
      "step2": "Auto-puntuación (1-10)",
      "step3": "¿Score ≥ 5?",
      "return": "Devolver",
      "low": "Score < 5",
      "regen": "Regenerar",
      "retry": "Devolver (máx 1 reintento)",
      "formats_title": "15 formatos de respuesta",
      "formats_body": "El chatbot produce respuestas en formatos estructurados apropiados al tipo de consulta, incluyendo tarjetas de servicio, listas de procedimientos, desglose de tasas, actualizaciones de estado, listas de documentos, información de citas y bloques de información general."
    },
    "ocr": {
      "schemas_title": "40 esquemas de documentos",
      "schemas_body": "Cada tipo de documento tiene un esquema JSON que define los campos de extracción, las coordenadas de bounding box y las reglas de validación. Los esquemas se almacenan en <code>packages/backend/app/modules/service_requests/schemas/</code>.",
      "pipeline_title": "Pipeline de extracción",
      "step1": "Subir documento",
      "step2": "Validación MIME",
      "step3": "Coincidencia de plantilla",
      "step4": "Extracción OCR",
      "step5": "Validación de esquema",
      "step6": "Datos estructurados",
      "engines_title": "Motores de validación",
      "col_engine": "Motor",
      "col_rules": "Reglas",
      "col_purpose": "Función",
      "row": {
        "schema": "<strong>SchemaValidationEngine</strong>",
        "schema_rules": "70+ reglas JSON",
        "schema_purpose": "Validez documental: formato, firmas, campos requeridos, validez temporal",
        "risk": "<strong>RiskAnalyzer</strong>",
        "risk_rules": "Pipeline de 12 pasos",
        "risk_purpose": "Detección de fraude: incoherencias, indicadores de manipulación, comprobaciones cruzadas",
        "mrz": "<strong>Validador MRZ</strong>",
        "mrz_rules": "Norma ICAO 9303",
        "mrz_purpose": "Validación de la zona legible por máquina para pasaportes y DNI",
        "hash": "<strong>Registro de hash de documentos</strong>",
        "hash_rules": "Basado en PostgreSQL",
        "hash_purpose": "Detección de duplicados y huella digital documental",
        "lev": "<strong>Comparador Levenshtein</strong>",
        "lev_rules": "Comparación difusa",
        "lev_purpose": "Comparación de nombres entre documentos con umbral configurable"
      },
      "callout_title": "Regla de acceso a datos OCR",
      "callout_body": "Los campos extraídos por OCR deben usar <code>context.get_extracted_field(doc, path)</code>. Los campos enviados por formulario usan <code>form_data.get()</code>. Nunca mezclar estos dos modos de acceso."
    },
    "assignment": {
      "intro": "El motor de asignación distribuye automáticamente los elementos de trabajo a los agentes según múltiples factores. Utiliza la tabla <code>agent_work_queue</code> con puntuación de prioridad dinámica.",
      "factors_title": "Factores de asignación",
      "col_factor": "Factor",
      "col_weight": "Peso",
      "col_desc": "Descripción",
      "weight": { "high": "Alto", "medium": "Medio", "low": "Bajo", "critical": "Crítico" },
      "row": {
        "capacity": "Capacidad",
        "capacity_desc": "Carga actual vs capacidad máxima por agente",
        "spec": "Especialización",
        "spec_desc": "Coincidencia de experiencia agente con tipo de flujo",
        "sla": "Prioridad SLA",
        "sla_desc": "Tiempo restante hasta el plazo SLA",
        "amount": "Importe",
        "amount_desc": "Importe del pago (los importes altos pueden enrutar a agentes senior)",
        "complex": "Complejidad",
        "complex_desc": "Puntuación de complejidad del flujo",
        "avail": "Disponibilidad",
        "avail_desc": "El agente debe estar disponible (no en permiso, baja, formación, etc.)"
      },
      "states_title": "Estados de disponibilidad de los agentes"
    },
    "security": {
      "body": "El chatbot implementa las mitigaciones OWASP LLM Top 10 incluyendo detección de inyección de prompt con 30+ patrones. Ver <a href=\"security.html#ai-security\">Arquitectura de seguridad</a> para los detalles."
    },
    "enrichment": {
      "body": "El módulo de enriquecimiento utiliza Gemini para generar automáticamente descripciones ricas para servicios fiscales. Cada descripción tiene 600 caracteres, estructurada en 3 párrafos, con una puntuación de auto-evaluación y ejemplos few-shot para una calidad consistente."
    }
  },

  "database": {
    "html_title": "Esquema de base de datos - Documentación Facil",
    "title": "Referencia del esquema de base de datos",
    "description": "Base de datos PostgreSQL alojada en Supabase con 145 tablas organizadas en 10 dominios, 50 enums personalizados y la extensión pgvector para embeddings de IA. Todo el acceso vía asyncpg con consultas parametrizadas.",
    "toc": {
      "overview": "Resumen del esquema",
      "core": "Negocio central (14 tablas)",
      "declarations": "Declaraciones & Flujo (12 tablas)",
      "agents": "Agentes & Carga de trabajo (7 tablas)",
      "payments": "Pagos (10 tablas)",
      "documents": "Documentos & OCR (5 tablas)",
      "auth": "Autenticación & RBAC (9 tablas)",
      "communications": "Comunicaciones (9 tablas)",
      "support": "Soporte (4 tablas)",
      "translations": "Traducciones (3 tablas)",
      "inspections": "Inspecciones & Bundle (15+ tablas)",
      "enums": "Enums clave",
      "conventions": "Convenciones de nombres",
      "migrations": "Sistema de migraciones"
    },
    "stats": { "tables": "Tablas", "enums": "Enums personalizados", "domains": "Dominios", "permissions": "Permisos" },
    "callout": {
      "sot": { "title": "Fuente de verdad", "body": "Consulta siempre directamente la base de datos para obtener el esquema actual. Usa <code>information_schema.columns</code> y <code>pg_type</code> en lugar de fiarte solo de la documentación, ya que el esquema evoluciona con frecuencia." },
      "safety": { "title": "Regla de seguridad de migraciones", "body": "Verifica siempre el estado de la BD antes de escribir una migración. Usa <code>SELECT code FROM roles</code> antes de insertar en <code>role_permissions</code>. Códigos de roles como <code>dgi_agent</code> o <code>ministry_agent</code> pueden ya no existir &mdash; los códigos reales son específicos de la entidad (ej. <code>agent_cnedoge_pasaporte</code>, <code>agent_dgt</code>, <code>agent_extranjeria</code>)." }
    },
    "col": { "table": "Tabla", "description": "Descripción", "keys": "Columnas clave", "volume": "Volumen" },
    "row": {
      "users": "Cuentas de usuario con roles",
      "fiscal_services": "Catálogo de 873 servicios fiscales",
      "tax_decl": "Declaraciones fiscales (20 tipos)",
      "companies": "Gestión de empresas",
      "ucr": "Roles de usuarios dentro de las empresas",
      "ministries": "Ministerios gubernamentales",
      "sectors": "Sectores ministeriales",
      "categories": "Categorías de servicios",
      "keywords": "Palabras clave de búsqueda para servicios",
      "sda": "Documentos requeridos por servicio",
      "spa": "Procedimientos por servicio",
      "proc_tmpl": "Plantillas de procedimiento",
      "proc_steps": "Pasos dentro de los procedimientos",
      "doc_tmpl": "Plantillas de documentos con validez",
      "iva": "Declaraciones IVA",
      "iva_vol": "~90 % de las declaraciones",
      "irpf": "Datos IRPF / impuesto sobre la renta",
      "petrol": "Declaraciones del sector petrolífero",
      "petrol_vol": "~4 % (importes grandes)",
      "retencion": "Retenciones",
      "other": "JSONB genérico para 7 tipos más",
      "adj": "Pista de auditoría de ajustes de importes",
      "corr": "Historial de correcciones / enmiendas",
      "transitions": "Transiciones de estados del flujo",
      "assignments": "Asignaciones de tareas a agentes",
      "assignment_rules": "Reglas de auto-asignación",
      "adj_reasons": "Catálogo predefinido de motivos de ajuste",
      "calc_hist": "Historial de cálculos fiscales",
      "min_agents": "Agentes ministeriales con estado de flujo completo",
      "workloads": "Seguimiento de carga de los agentes en tiempo real",
      "queue": "Cola de prioridad dinámica (puntuación SLA, importe, complejidad)",
      "perf_stats": "Métricas de rendimiento mensuales",
      "uma": "Mapeos usuario-ministerio",
      "val_config": "Ajustes de validación por ministerio",
      "sys_rules": "Reglas de negocio dinámicas (sin redespliegue)",
      "payments": "Tabla polimórfica central de pagos",
      "svc_pay": "Pagos con flujo de agente (bloqueo pesimista)",
      "pay_plans": "Planes de pago a plazos",
      "installments": "Cuotas individuales",
      "receipts": "Recibos PDF generados",
      "lock_hist": "Auditoría de bloqueos de pago",
      "val_audit": "Pista de auditoría de validaciones",
      "bank_cfg": "Configuraciones API/webhook bancarias",
      "bank_tx": "Transacciones webhook bancarias",
      "fsd": "Datos de pago de los servicios fiscales",
      "uploaded": "Metadatos de archivo (Supabase Storage)",
      "doc_queue": "Cola OCR asíncrona con retry/fallback",
      "ocr_results": "Extracción OCR cruda (JSONB)",
      "form_tmpl": "Coordenadas de campos OCR (14 tipos de formulario)",
      "import": "Seguimiento de importaciones masivas Excel",
      "sessions": "Sesiones JWT",
      "refresh": "Tokens de refresco con revocación",
      "pending": "Verificación de email (expira en 15 min)",
      "roles": "47 roles personalizados (con menu_config, dashboard_config JSONB)",
      "permissions": "335 entradas de permisos",
      "role_perms": "Mapeos rol-permiso",
      "user_perms": "Anulaciones de permisos por usuario",
      "perm_log": "Historial de cambios de permisos",
      "audit_logs": "Pista de auditoría a nivel de sistema (2800+ entradas)",
      "cps": "Configuraciones de proveedores (SMS, Email, Push, WhatsApp)",
      "email_tmpl": "Plantillas de email multilingües",
      "sms_tmpl": "Plantillas SMS (segmentos de 160 caracteres)",
      "push_tmpl": "Plantillas push móvil/web",
      "notif_tmpl": "Plantillas de notificaciones in-app",
      "ussd": "Configuraciones de menús USSD (Getesa, Muni)",
      "webhook_cfg": "Webhooks WhatsApp Business API",
      "webhook_logs": "Auditoría de ejecución de webhooks",
      "tickets": "Tickets de soporte usuario/agente",
      "sup_msg": "Mensajes del ticket",
      "sup_att": "Adjuntos de los mensajes",
      "sup_cat": "Categorías multilingües de tickets",
      "translations": "Traducciones unificadas (ENUMs, UI, formularios, mensajes del sistema)",
      "ent_tr": "Traducciones de entidades optimizadas (40 % de reducción de almacenamiento)",
      "favs": "Servicios favoritos del usuario",
      "cl": "Entidad raíz del flujo bundle (SELECT FOR UPDATE)",
      "sr": "Seguimiento de solicitudes de servicio (índice único parcial)",
      "lo": "Obligaciones por entidad para una licencia",
      "entities": "Entidades gubernamentales con workflow_codes JSONB",
      "ent_loc": "Sedes físicas por entidad",
      "pw": "Definiciones de flujos sincronizadas desde clases Python",
      "wt": "Grillas tarifarias por flujo",
      "wd": "Documentos requeridos por flujo",
      "wmm": "Mapeo flujo a estructura de menú",
      "ap": "Perfiles de agente con menu_overrides",
      "fi": "Registros de inspección de campo",
      "ah": "Reservas temporales de 15 min",
      "ar": "Reservas confirmadas permanentes",
      "asc": "Configuración de capacidad de slots",
      "ws": "Datos de sesión wizard cache-first"
    },
    "inspections": { "intro": "Tablas de flujo bundle e inspecciones de campo que cubren licencias comerciales, obligaciones, solicitudes de servicio y operaciones de campo." },
    "enums": {
      "and_more": "y más",
      "user_role": { "summary": "user_role_enum (7 valores)" },
      "decl_type": { "summary": "declaration_type_enum (34 tipos)" },
      "pay_status": {
        "summary": "payment_workflow_status (17 estados)",
        "extra": "Estados adicionales: <code>pending_documents</code>, <code>escalated</code>, <code>cancelled</code>, <code>refund_requested</code>, <code>refund_approved</code>, <code>refund_completed</code>, <code>on_hold</code>, <code>expired</code>, <code>partial_payment</code>, <code>awaiting_bank_confirmation</code>, <code>manual_review</code>"
      },
      "pay_method": { "summary": "payment_method_enum (5 valores)" },
      "agent_action": { "summary": "agent_action_type (7 valores)" },
      "svc_type": { "summary": "service_type_enum (8 valores)" },
      "calc_method": { "summary": "calculation_method_enum (7 valores)" }
    },
    "conv": {
      "col_element": "Elemento",
      "col_convention": "Convención",
      "col_example": "Ejemplo",
      "tables": "Tablas",
      "tables_conv": "<code>snake_case</code> en plural",
      "columns": "Columnas",
      "fk": "Claves foráneas",
      "timestamps": "Marcas temporales",
      "timestamps_ex": "Presentes en todas las tablas",
      "soft": "Borrados lógicos",
      "soft_ex": "Marca temporal anulable",
      "enums": "Enums",
      "indexes": "Índices"
    },
    "migrations": {
      "intro": "Las migraciones BD se almacenan en <code>packages/backend/migrations/</code> como archivos SQL y scripts Python. Las migraciones se numeran secuencialmente y se aplican mediante un runner personalizado.",
      "verif_title": "Patrón de verificación"
    }
  },

  "workflows": {
    "html_title": "Motor de flujos - Documentación Facil",
    "title": "Referencia del motor de flujos",
    "description": "El motor de flujos impulsa 36 flujos de solicitud de servicio a través de 8 dominios. Cada flujo define los pasos del wizard, los documentos requeridos, los cálculos de tasas, los esquemas OCR y las reglas de enrutamiento por entidad.",
    "yes": "Sí",
    "no": "No",
    "varies": "variable",
    "toc": {
      "wizard": "Flujo del wizard",
      "state": "Máquina de estados de solicitudes",
      "catalog": "Los 36 flujos",
      "condition": "ConditionEvaluator",
      "fees": "Métodos de cálculo de tasas",
      "routing": "Enrutamiento por entidad",
      "ocr": "Integración de esquemas OCR",
      "appointments": "Gestión de citas",
      "validation": "Validación a 2 capas"
    },
    "wizard": {
      "intro": "Toda solicitud de servicio sigue un wizard con pasos configurables. El flujo estándar es:",
      "step": { "selection": "Selección", "upload": "Subida", "form": "Revisión de formulario 1..N", "appointment": "Cita", "payment": "Pago", "confirmation": "Confirmación" },
      "col_step": "Paso", "col_purpose": "Función", "col_optional": "¿Opcional?",
      "row": {
        "selection": { "name": "<strong>Selección</strong>", "purpose": "Elegir el sub-tipo, tipo de persona, motivo. Impulsa la visibilidad dinámica del formulario.", "opt": "No (siempre presente)" },
        "upload": { "name": "<strong>Subida</strong>", "purpose": "Subir los documentos requeridos (la extracción OCR se ejecuta aquí). Los documentos varían por flujo.", "opt": "No" },
        "form": { "name": "<strong>Revisión de formulario 1..N</strong>", "purpose": "Revisar los datos extraídos por OCR, rellenar campos manuales, validar reglas de negocio.", "opt": "Cantidad variable (1-3)" },
        "appt": { "name": "<strong>Cita</strong>", "purpose": "Reservar un slot de cita (holds + reservations). Solo para flujos que requieran visita presencial.", "opt": "Sí" },
        "pay": { "name": "<strong>Pago</strong>", "purpose": "Calcular la tasa e iniciar el pago (BANGE o manual).", "opt": "No" },
        "conf": { "name": "<strong>Confirmación</strong>", "purpose": "Mostrar resumen, descarga PDF, email con recibo.", "opt": "No" }
      },
      "cache_title": "Wizard cache-first",
      "cache_body": "El wizard usa un enfoque <strong>cache-first</strong>: los datos de paso se almacenan en Redis durante el flujo del wizard (sin escrituras a BD hasta el pago). El endpoint <code>POST /wizard-sessions/{id}/initiate-payment</code> ejecuta una operación atómica de persistir-y-pagar en una sola transacción de BD."
    },
    "state": {
      "diagram_title": "Ciclo de vida de una solicitud de servicio",
      "draft": "Borrador", "submit": "▼ Enviar", "submitted": "Enviada", "auto_assign": "▼ Auto-asignación a agentes de la entidad",
      "processing": "En proceso", "decision": "▼ Decisión del agente", "accepted": "Aceptada", "rejected": "Rechazada",
      "amended": "Enmendada", "completed": "Completada"
    },
    "cat": {
      "identity": "Identidad & Civil (CNEDOGE) — 1 flujo",
      "immigration": "Inmigración (Extranjeria) — 2 flujos",
      "traffic": "Tráfico (DGT) — 3 flujos",
      "driving": "Conducción (Conducir) — 1 flujo",
      "contracts": "Contratos (Contrato) — 1 flujo",
      "civil": "Función pública (Funcion Publica) — 5 flujos",
      "bundle": "Bundle / Comercial (multi-entidad) — 1 flujo",
      "generic": "Genérico — 2 flujos",
      "col_workflow": "Flujo", "col_file": "Archivo", "col_minor": "¿Menor?", "col_motivo": "¿Motivo?",
      "col_docs": "Docs", "col_forms": "Páginas de formulario", "col_rdv": "Cita", "col_subtypes": "Sub-tipos",
      "col_entities": "Entidades", "col_description": "Descripción",
      "row": {
        "pasaporte_motivo": "Sí (4)",
        "visado": "Tramites Visado (4 sub-tipos)",
        "conducir_motivo": "Sí (3: PERDIDA, ROBO, DETERIORO para DUPLICADO)",
        "contrato_docs": "3 requeridos + 10 opcionales",
        "promo_sub": "3 sub-tipos",
        "bundle_desc": "Obligaciones multi-entidad para licencias comerciales",
        "generic_desc": "Catch-all para servicios no categorizados"
      }
    },
    "cond": {
      "intro": "El <code>ConditionEvaluator</code> controla dinámicamente la visibilidad de pasos y secciones según los datos del formulario recopilados en pasos anteriores. Las condiciones se definen como objetos JSON en la configuración del flujo.",
      "callout_title": "Regla crítica: las condiciones son siempre cadenas",
      "callout_body": "Las condiciones deben usar valores string: <code>{\"is_minor\": \"true\"}</code>, <strong>no</strong> <code>{\"is_minor\": true}</code>. El RadioGroup del frontend almacena cadenas, y el ConditionEvaluator realiza comparación <code>==</code> estricta."
    },
    "fees": {
      "col_method": "Método", "col_enum": "Valor enum", "col_desc": "Descripción", "col_example": "Ejemplo",
      "row": {
        "fixed_exp": "Expedición fija",
        "fixed_exp_desc": "Precio fijo para nuevas solicitudes",
        "fixed_exp_ex": "Pasaporte: 35 000 FCFA",
        "fixed_ren": "Renovación fija",
        "fixed_ren_desc": "Precio fijo para renovaciones",
        "fixed_ren_ex": "Renovación Conducir: 15 000 FCFA",
        "percent": "Basado en porcentaje",
        "percent_desc": "Porcentaje de un importe base",
        "percent_ex": "IVA: 15 % de la base imponible",
        "unit": "Basado en unidades",
        "unit_desc": "Precio por unidad (páginas, ítems)",
        "unit_ex": "Contrato: precio por página",
        "tiered": "Tasas por tramos",
        "tiered_desc": "Tasas que cambian según umbrales",
        "tiered_ex": "Visa Alternativo: tramos 3/6/12/24 meses",
        "formula": "Basado en fórmula",
        "formula_desc": "Evaluación de fórmula personalizada",
        "formula_ex": "Cálculos fiscales complejos",
        "fixed_unit": "Fijo + unitario",
        "fixed_unit_desc": "Tasa base más cargo unitario",
        "fixed_unit_ex": "Base + cargo por empleado"
      }
    },
    "routing": {
      "intro": "El enrutamiento por entidad está totalmente <strong>impulsado por la BD</strong>. La columna JSONB <code>entities.workflow_codes</code> determina qué entidad maneja qué flujo. Esto se gestiona vía la UI de admin, sin cambios de código.",
      "callout_title": "Sin enrutamiento en código",
      "callout_body": "Nunca crear funciones <code>get_issuing_entities()</code> en código. El campo <code>entity_code</code> en <code>PredefinedWorkflow</code> es puramente declarativo/de auditoría. El enrutamiento real se resuelve desde <code>entities.workflow_codes</code> en runtime."
    },
    "ocr": {
      "intro": "40 archivos de esquemas JSON definen las plantillas de extracción OCR para los tipos de documentos usados en los flujos. Almacenados en <code>packages/backend/app/modules/service_requests/schemas/</code>.",
      "summary": "Los 40 esquemas OCR",
      "col_file": "Archivo de esquema",
      "col_doctype": "Tipo de documento",
      "doc": {
        "dip": "Documento de identidad nacional (DIP) - Guinea Ecuatorial",
        "pasaporte_gq": "Pasaporte - Guinea Ecuatorial",
        "pasaporte_int": "Pasaporte - Internacional",
        "nacimiento": "Certificado de nacimiento",
        "medico": "Certificado médico",
        "conducta": "Certificado de buena conducta",
        "conducir": "Permiso de conducir",
        "defuncion": "Certificado de defunción",
        "nif": "Número fiscal (NIF)",
        "padron": "Certificado de empadronamiento",
        "solvencia": "Certificado de solvencia fiscal",
        "onrc": "Contrato ONRC",
        "compraventa": "Contrato de compraventa",
        "contrato_func": "Contrato de funcionario",
        "residencia": "Permiso de residencia",
        "trabajo": "Permiso de trabajo",
        "circulacion": "Permiso de circulación de vehículo",
        "visado": "Visado",
        "sello": "Sello de entrada/salida",
        "itv": "Inspección de vehículo (ITV)",
        "reco_veh": "Certificado de reconocimiento de vehículo",
        "carnet_func": "Carnet de funcionario",
        "nombramiento": "Nombramiento oficial",
        "dgi_note": "Nota de ingreso DGI",
        "res_note": "Nota de ingreso de residencia",
        "escritura": "Escritura de constitución de empresa",
        "cuve": "Documento CUVE",
        "licencia_muni": "Licencia comercial municipal",
        "reg_comercio": "Registro mercantil",
        "reg_emp": "Registro empresarial",
        "reg_vue": "Registro VUE",
        "conciso": "Certificado mercantil conciso",
        "actualizacion": "Certificado de actualización empresarial",
        "atestacion": "Atestación bancaria",
        "antecedentes": "Antecedentes penales",
        "gubernativa": "Autorización gubernativa",
        "parental": "Autorización parental",
        "cert_nac": "Certificación de nacimiento",
        "decl_nac": "Declaración de nacimiento",
        "casier": "Extracto de antecedentes penales internacional"
      }
    },
    "appt": {
      "intro": "Los flujos con cita usan un sistema de 2 tablas para evitar dobles reservas:",
      "col_table": "Tabla", "col_purpose": "Función", "col_lifetime": "Vida útil",
      "row": {
        "holds": "Reserva temporal durante el flujo del wizard",
        "holds_ttl": "TTL 15 minutos",
        "reservations": "Reserva confirmada permanente",
        "reservations_ttl": "Permanente"
      },
      "fns_intro": "Tres funciones SQL gestionan el ciclo de vida de una cita:",
      "fn1": "<code>hold_appointment_slot()</code> &mdash; Crea una reserva temporal, cuenta holds+confirmadas",
      "fn2": "<code>confirm_appointment_hold()</code> &mdash; Convierte una reserva en confirmada + INSERT reservation",
      "fn3": "<code>get_available_slots_v3()</code> &mdash; Devuelve los slots disponibles (cuenta reservations + holds)"
    },
    "val": {
      "diagram_title": "Arquitectura de validación",
      "layer1": "Capa 1: paso de Subida",
      "layer1_sub": "SchemaValidationEngine (70+ reglas JSON) + RiskAnalyzer (12 pasos)",
      "layer2": "Capa 2: paso de Revisión de formulario",
      "layer2_sub": "Solo overrides de validate_step() (Python real)",
      "point1": "<strong>Schema</strong> (capa 1) = validez documental (formato, firmas, campos requeridos, validez temporal)",
      "point2": "<strong>validate_step</strong> (capa 2) = decisión de negocio (qué significa el resultado para ESTE flujo)",
      "point3": "<strong>Nunca duplicar reglas entre capas.</strong> Si el esquema tiene <code>certificado_vigente</code>, no recrear en validate_step."
    }
  },

  "indexpage": {
    "html_title": "Documentación de la Plataforma Facil",
    "title": "Documentación de la plataforma Facil",
    "breadcrumb": "Inicio de la documentación",
    "description": "Referencia técnica completa de la plataforma de servicios gubernamentales digitales Facil. Construida para la República de Guinea Ecuatorial para procesar servicios fiscales, gestionar trámites civiles y soportar 100+ agentes gubernamentales concurrentes en múltiples ministerios.",
    "stats": {
      "fiscal": "Servicios fiscales",
      "tables": "Tablas de base de datos",
      "workflows": "Flujos",
      "roles": "Roles",
      "backend": "Módulos backend",
      "frontend": "Módulos frontend",
      "routers": "Routers API",
      "ocr": "Esquemas OCR"
    },
    "docmap": {
      "title": "Mapa de la documentación",
      "architecture": "— Estructura del monorepo, backend 3-tier, módulos frontend, caché, pipeline IA",
      "api": "— 62 routers, autenticación, formatos solicitud/respuesta, rate limiting",
      "database": "— 145 tablas en 10 dominios, 50 enums, convenciones de nombres, migraciones",
      "workflows": "— 36 flujos, pasos del wizard, condition evaluator, cálculo de tasas, enrutamiento por entidad",
      "modules": "— 30 módulos backend, 41+ módulos frontend, organizados por dominio",
      "agents": "— Chatbot RAG, 5 agentes por rol, extracción OCR, asignación inteligente",
      "payments_title": "Sistemas de pago",
      "payments": "— Integración BANGE, pagos atómicos, flujos agrupados, informes financieros",
      "security_title": "Arquitectura de seguridad",
      "security": "— JWT + 2FA, RBAC con 335 permisos, conformidad OWASP, registro de auditoría",
      "deployment_title": "Despliegue & Operaciones",
      "deployment": "— Pipeline CI/CD, Cloud Run, Firebase Hosting, monitorización",
      "i18n": "— Soporte trilingüe (ES/FR/EN), 11.400+ claves, arquitectura de traducción",
      "grafana": "— 10 paneles producción, ingeniería analítica, capa semántica de datos, KPIs orientados a decisión",
      "logrocket": "— Reproducción de sesión (web + móvil + inspector), censura PII ante todo, bridge Sentry, flujos de uso diarios"
    },
    "overview": {
      "title": "Resumen de la plataforma",
      "body1": "<strong>Facil</strong> es un framework full-stack potenciado por IA para digitalizar trámites administrativos gubernamentales y procesos relacionados con empresas. Se entrega como una plataforma completa &mdash; <strong>API backend, panel web, app móvil ciudadana y app de inspección de campo</strong> &mdash; que cualquier gobierno puede configurar para operar sus propios servicios fiscales, flujos de trabajo, procesamiento documental e interacciones ciudadanas, de extremo a extremo.",
      "body2": "El framework es <strong>independiente de país por diseño</strong>: flujos de trabajo, servicios fiscales, entidades, roles, traducciones y reglas de negocio están todos <em>orientados por datos</em> y configurables a través de la base de datos y el panel admin &mdash; nada está cableado en código. Desplegar Facil en un nuevo país significa <em>configurar</em> servicios, entidades y flujos, no reescribir código. La IA integrada (Gemini 2.5 Flash vía Vertex AI + RAG pgvector) impulsa el chatbot, OCR/IDP inteligente, scoring de riesgo automatizado y soporte a la decisión de los agentes.",
      "body3": "<strong>Despliegue actual &mdash; República de Guinea Ecuatorial</strong>: 873 servicios fiscales en 20 entidades gubernamentales (DGI, CNEDOGE, DGT, Extranjer&iacute;a, Ayuntamiento, C&aacute;mara de Comercio, Tesoro P&uacute;blico, MINFP, ITV, ONRC, OFIVE, más 8 entidades ministeriales), directorio de 21 ministerios, 34 sedes en 17 ciudades, 36 flujos de trabajo de negocio, 47 roles con 337 permisos granulares, interfaz totalmente trilingüe (español, francés, inglés)."
    },
    "stack": {
      "title": "Pila tecnológica",
      "col_layer": "Capa", "col_tech": "Tecnología", "col_version": "Versión", "col_purpose": "Función",
      "row": {
        "api": "API backend", "api_purpose": "API REST con docs OpenAPI automáticos",
        "runtime": "Runtime", "runtime_purpose": "Async-first con asyncio/asyncpg",
        "db": "Base de datos", "db_purpose": "Almacén principal con pgvector",
        "cache": "Caché", "cache_purpose": "Caché con fallback en memoria",
        "frontend": "Frontend", "frontend_purpose": "App Router con SSR e i18n",
        "ui": "Framework UI", "ui_purpose": "Biblioteca de componentes con Tailwind CSS",
        "mobile": "Móvil", "mobile_purpose": "Apps Android/iOS ciudadano e inspector",
        "ai": "IA", "ai_purpose": "Chatbot RAG, análisis documental, scoring de riesgo",
        "cloud": "Cloud", "cloud_purpose": "Despliegue de contenedores serverless",
        "hosting": "Hosting", "hosting_purpose": "CDN frontend con canales staging",
        "storage": "Almacenamiento", "storage_purpose": "Almacenamiento de documentos y archivos con URLs firmadas",
        "cicd": "CI/CD", "cicd_purpose": "8 archivos workflow (CI, deploy, build)",
        "errors": "Seguimiento de errores", "errors_purpose": "Excepciones backend + web + móvil + inspector, releases, source maps",
        "replay": "Reproducción de sesión", "replay_purpose": "Reproducciones web + móvil + inspector con censura PII, bridge Sentry",
        "metrics": "Métricas y alertas", "metrics_purpose": "10 dashboards operacionales, Postgres dual-provider, alertas de guardia",
        "bi": "Dashboards de negocio", "bi_purpose": "BI embebida con report IDs gestionados por admin (sin redespliegue)",
        "audit": "Auditoría y registros", "audit_purpose": "Logs estructurados, traza audit_logs en BD, permission_audit_log"
      }
    },
    "monorepo": { "title": "Estructura del monorepo" },
    "qs": {
      "title": "Inicio rápido",
      "backend_title": "Desarrollo backend",
      "frontend_title": "Desarrollo frontend",
      "callout_title": "Importante",
      "callout_body": "Nunca compiles manualmente con <code>gcloud</code>. Todos los despliegues deben pasar por GitHub Actions. Empuja a la rama <code>develop</code> y el pipeline CI/CD compilará y desplegará automáticamente el backend (Cloud Run) y el frontend (Firebase Hosting)."
    },
    "pages": { "title": "Páginas de documentación" },
    "cards": {
      "architecture": "Diseño backend 3-tier, estructura modular frontend, capas de caché, pipeline IA, apps móviles y topología de despliegue.",
      "api": "Los 62 routers API, flujos de autenticación, formatos solicitud/respuesta, manejo de errores, rate limiting y paginación.",
      "database": "145 tablas en 10 dominios, 50 enums con todos sus valores, convenciones de nombres y relaciones clave.",
      "workflows": "36 definiciones de flujo, flujo del wizard, condiciones dinámicas, cálculo de tasas, integración OCR y enrutamiento por entidad.",
      "modules": "30 módulos backend y 41+ módulos frontend organizados por dominio, con endpoints clave, tablas y dependencias.",
      "agents": "Chatbot RAG con Gemini 2.5 Flash, 5 agentes por rol, procesamiento OCR de documentos y motor de asignación inteligente.",
      "payments": "Integración BANGE, pipeline de pago atómico, flujos multi-entidad, informes financieros y generación de recibos.",
      "security": "Autenticación JWT + 2FA, RBAC con 47 roles y 335 permisos, conformidad OWASP, cabeceras CSP y registro de auditoría.",
      "deployment_title": "Despliegue & Ops",
      "deployment": "8 workflows GitHub Actions, contenedores Cloud Run, Firebase Hosting, gestión de entornos y monitorización.",
      "i18n": "Soporte trilingüe (español, francés, inglés), 11.400+ claves de traducción, traducciones de entidades backend y renderizado de plantillas.",
      "grafana": "10 paneles producción, arquitectura de datos semántica de 4 capas, resolución multi-fuente y KPIs orientados a decisión para tesorería, agentes e inspectores.",
      "logrocket": "Reproducción de sesión en web + móvil + inspector con censura PII de 4 capas, aplicación de la política de identificación y bridge Sentry para debug forense."
    },
    "dec": {
      "title": "Decisiones de arquitectura clave",
      "col_decision": "Decisión", "col_choice": "Elección", "col_rationale": "Justificación",
      "row": {
        "api": "Framework API", "api_choice": "FastAPI (async)", "api_rationale": "Async nativo, docs OpenAPI automáticos, validación Pydantic v2, alto rendimiento",
        "driver": "Driver BD", "driver_choice": "asyncpg (sin ORM)", "driver_rationale": "SQL parametrizado en bruto para máximo control, rendimiento y seguridad",
        "routing": "Enrutamiento frontend", "routing_choice": "Next.js App Router con [locale]", "routing_rationale": "Renderizado del lado del servidor, i18n integrado, route groups para auth/dashboard/public",
        "state": "Gestión de estado", "state_choice": "React Query + Zustand", "state_rationale": "Separación estado servidor (Query) vs estado cliente (Zustand)",
        "deploy": "Despliegue", "deploy_choice": "Cloud Run + Firebase Hosting", "deploy_rationale": "Escalado serverless, cero gestión de infraestructura, distribución CDN",
        "entity": "Enrutamiento por entidad", "entity_choice": "Impulsado por BD (entities.workflow_codes)", "entity_rationale": "Sin cambios de código para asignar flujos a entidades, gestionado vía UI admin",
        "cache": "Estrategia de caché", "cache_choice": "HybridCache (Redis + fallback en memoria)", "cache_rationale": "Degradación elegante si Redis no está disponible, TTLs específicos por dominio",
        "ai": "Modelo IA", "ai_choice": "Gemini 2.5 Flash vía Vertex AI", "ai_rationale": "Inferencia rápida, soporte tool-use, rentable para cargas gubernamentales"
      }
    },
    "ent": {
      "title": "Entidades gubernamentales",
      "intro": "Facil sirve a múltiples entidades gubernamentales de Guinea Ecuatorial, cada una gestionando servicios fiscales y flujos específicos:",
      "col_entity": "Entidad", "col_code": "Código", "col_domain": "Dominio",
      "row": {
        "dgi": "Declaraciones fiscales, servicios fiscales",
        "cnedoge": "Servicios de pasaporte",
        "dgt": "Matriculación de vehículos, permisos de conducir",
        "extranjeria": "Permisos de residencia, trámites de visado",
        "ayuntamiento": "Servicios municipales, licencias comerciales",
        "camara": "Registro de empresas, certificados comerciales",
        "tesoro": "Tesorería, procesamiento de pagos",
        "funcion": "Función pública, verificación de empleados",
        "various": "Diversos ministerios",
        "min": "Inspecciones y permisos sectoriales"
      }
    },
    "footer": "Plataforma Facil v1.1.8 · República de Guinea Ecuatorial · © 2026 Sah Kouemou",
    "footer.dashboards": "Paneles"
  },

  "api": {
    "html_title": "Referencia API - Documentación Facil",
    "title": "Referencia API",
    "description": "El backend Facil expone 62 routers API vía FastAPI, todos montados bajo el prefijo <code>/api/v1</code>. Esta referencia cubre autenticación, convenciones de solicitud y endpoints clave por dominio.",
    "toc": {
      "base_url": "URL base & convenciones",
      "auth": "Autenticación",
      "errors": "Manejo de errores",
      "rate": "Rate limiting",
      "routers": "Los 62 routers API",
      "auth_ep": "Endpoints de Auth",
      "user_ep": "Endpoints de Usuario",
      "fiscal_ep": "Endpoints de Servicios fiscales",
      "sr_ep": "Endpoints de Solicitudes de servicio",
      "pay_ep": "Endpoints de Pagos",
      "chat_ep": "Endpoints de Chatbot",
      "admin_ep": "Endpoints de Admin"
    },
    "base": {
      "col_env": "Entorno", "col_url": "URL base",
      "row": { "prod": "Producción", "local": "Dev local" }
    },
    "headers": { "title": "Cabeceras de solicitud" },
    "pag": { "title": "Paginación", "intro": "Los endpoints de listado aceptan los parámetros de paginación estándar:", "meta": "La respuesta incluye metadatos de paginación:" },
    "auth": {
      "flow_title": "Flujo de autenticación",
      "step1": "Inicio de sesión (email+contraseña)",
      "step2": "Verificación de credenciales",
      "step3": "Verificación 2FA (si está activada)",
      "step4": "Emisión del par JWT",
      "col_token": "Token", "col_lifetime": "Vida útil", "col_purpose": "Función",
      "row": {
        "access": "Token de acceso", "access_life": "30 minutos", "access_purpose": "Autorización API (cabecera Bearer)",
        "refresh": "Token de refresco", "refresh_life": "30 días", "refresh_purpose": "Obtener nuevos tokens de acceso sin re-login"
      },
      "jwt_title": "Payload JWT",
      "2fa_title": "Autenticación de dos factores (2FA)",
      "2fa_body": "2FA TOTP opcional vía <code>pyotp</code>. Cuando está activado, el inicio de sesión devuelve un flag <code>2fa_required</code> y el cliente debe enviar el código TOTP para completar la autenticación."
    },
    "err": {
      "intro": "Todos los errores siguen un esquema de respuesta consistente con soporte trilingüe:",
      "col_status": "Estado HTTP", "col_code": "Código de error", "col_desc": "Descripción",
      "row": {
        "400": "Parámetros de solicitud inválidos",
        "401": "Token JWT ausente o inválido",
        "403": "Permisos insuficientes (RBAC)",
        "404": "Recurso no encontrado",
        "409": "Conflicto de recurso (duplicado, desajuste de versión)",
        "422": "Fallo de validación Pydantic (errores de campo detallados)",
        "429": "Límite de tasa excedido",
        "500": "Error interno (detalles saneados para los clientes)"
      },
      "callout_title": "Nota de seguridad",
      "callout_body": "Para los errores 5xx, el backend sanea el campo <code>detail</code> para impedir fugas de mensajes de excepciones internas. Los stack traces completos se registran del lado del servidor vía Loguru."
    },
    "rate": {
      "intro": "El rate limiting se aplica por usuario (o por IP para endpoints no autenticados) mediante la función Redis <code>check_rate_limit()</code>.",
      "col_cat": "Categoría de endpoint", "col_limit": "Límite", "col_window": "Ventana",
      "row": {
        "auth": "Autenticación (login/registro)", "auth_limit": "10 solicitudes",
        "chat": "Mensajes de chatbot", "chat_limit": "30 solicitudes",
        "general": "API general (autenticada)", "general_limit": "100 solicitudes",
        "upload": "Subida de archivos", "upload_limit": "20 solicitudes",
        "window": "60 segundos"
      }
    },
    "routers": {
      "auth": "Autenticación & Usuarios (5 routers)",
      "fiscal": "Servicios fiscales & Bundles (7 routers)",
      "sr": "Solicitudes de servicio (6 routers)",
      "pay": "Pagos & Verificación (3 routers)",
      "agents": "Agentes & Asignaciones (5 routers)",
      "admin": "Admin & Permisos (7 routers)",
      "tr": "Traducciones & i18n (4 routers)",
      "comm": "Comunicaciones (6 routers)",
      "companies": "Empresas (5 routers)",
      "insp": "Inspecciones (4 routers)",
      "other": "Otros (10 routers)",
      "col_router": "Router", "col_prefix": "Prefijo", "col_tags": "Tags"
    },
    "ep": {
      "auth": {
        "login": "Inicio de sesión por email + contraseña, devuelve el par JWT",
        "register": "Crear una nueva cuenta de usuario",
        "refresh": "Intercambiar el token de refresco por un nuevo token de acceso",
        "verify": "Enviar código de verificación por email",
        "reset": "Solicitar email de restablecimiento de contraseña",
        "change": "Cambiar contraseña (autenticado)",
        "2fa_setup": "Inicializar la configuración 2FA TOTP",
        "2fa_verify": "Verificar el código TOTP durante el inicio de sesión",
        "logout": "Revocar el token de refresco"
      },
      "user": {
        "me": "Obtener el perfil del usuario actual",
        "update": "Actualizar el perfil del usuario actual",
        "byid": "Obtener usuario por ID (admin)"
      },
      "fs": {
        "list": "Listar todos los servicios fiscales (873 en total, paginado)",
        "detail": "Obtener detalles del servicio con información de tasas",
        "search": "Búsqueda full-text (tsvector)",
        "ministry": "Servicios filtrados por ministerio"
      },
      "sr": {
        "create": "Crear nueva solicitud de servicio",
        "list": "Listar las solicitudes de servicio del usuario",
        "detail": "Obtener detalles de la solicitud",
        "wizard_create": "Crear sesión wizard (flujo cache-first)",
        "wizard_update": "Actualizar datos de paso del wizard",
        "initiate": "Persistencia + pago atómico"
      },
      "pay": {
        "initiate": "Iniciar pago (BANGE o manual)",
        "detail": "Obtener detalles del pago",
        "webhook": "Callback de pago BANGE",
        "verify": "Verificar recibo de pago"
      },
      "chat": {
        "message": "Enviar mensaje al chatbot IA",
        "list": "Listar el historial de conversaciones",
        "detail": "Obtener los mensajes de una conversación"
      },
      "admin": {
        "health": "Panel de salud del sistema",
        "users": "Listar todos los usuarios (solo admin)",
        "audit": "Consultar registros de auditoría (2800+ entradas)",
        "menu_me": "Obtener el menú de agente para el usuario actual",
        "menu_map": "Listar mapeos flujo-a-menú"
      }
    }
  },

  "arch": {
    "html_title": "Arquitectura del sistema - Documentación Facil",
    "description": "Facil es una plataforma basada en monorepo con 4 paquetes: un backend Python/FastAPI, un frontend Next.js y dos aplicaciones móviles Expo React Native. Este documento detalla la arquitectura de cada capa.",
    "toc": {
      "overview": "Resumen del sistema",
      "backend": "Arquitectura backend 3-tier",
      "frontend": "Arquitectura frontend",
      "mobile": "Arquitectura móvil",
      "db": "Arquitectura base de datos",
      "caching": "Arquitectura de caché",
      "ai": "Arquitectura IA",
      "event": "Event Bus & procesamiento en segundo plano"
    },
    "overview": {
      "diagram_title": "Arquitectura del sistema de alto nivel",
      "citizens": "Ciudadanos / Empresas", "citizens_sub": "Navegador web + App móvil",
      "gov_agents": "Agentes gubernamentales", "gov_agents_sub": "Panel de agente",
      "inspectors": "Inspectores", "inspectors_sub": "App móvil de inspector",
      "firebase_sub": "CDN + canales staging",
      "nextjs_sub": "SSR + App Router + i18n (ES/FR/EN)",
      "https": "▼ HTTPS / API REST",
      "cloudrun_sub": "Contenedores con auto-escalado",
      "fastapi_sub": "Python 3.11+ / asyncio",
      "pg_sub": "145 tablas + pgvector",
      "redis_sub": "Caché + rate limits",
      "storage_sub": "Documentos + archivos",
      "body": "La plataforma sigue una estricta separación de responsabilidades: el backend actúa como una API REST sin estado consumida por múltiples clientes (frontend web, dos apps móviles). Todo el estado se almacena en PostgreSQL con Redis como capa de caché de rendimiento. Los servicios externos incluyen Vertex AI para funcionalidades de inteligencia y BANGE para procesamiento de pagos."
    },
    "backend": {
      "intro": "El backend sigue una arquitectura estricta 3-tier en capas dentro de cada uno de sus 30 módulos funcionales. Cada capa tiene una responsabilidad única y se comunica solo con su capa adyacente.",
      "diagram_title": "Arquitectura en capas del backend",
      "api_layer": "Capa API", "api_layer_sub": "Routers FastAPI + middleware + auth guards",
      "connector1": "Modelos Request/Response Pydantic v2",
      "svc_layer": "Capa de servicios", "svc_layer_sub": "Lógica de negocio + validación + motor de reglas",
      "connector2": "Objetos de dominio / dicts",
      "repo_layer": "Capa de repositorio", "repo_layer_sub": "asyncpg + SQL parametrizado + pool de conexiones",
      "connector3": "Records asyncpg",
      "pg_sub": "Alojado en Supabase",
      "api_title": "Capa API",
      "api_intro": "La capa API consta de 62 routers FastAPI registrados en <code>app/main.py</code>. Cada router:",
      "api": {
        "bullet1": "Define endpoints HTTP con parámetros tipados",
        "bullet2": "Aplica decoradores de autenticación y permiso (<code>@permission_required</code>)",
        "bullet3": "Valida la entrada vía modelos Pydantic v2",
        "bullet4": "Delega a la capa de servicios para la lógica de negocio",
        "bullet5": "Devuelve respuestas JSON estructuradas con códigos de error"
      },
      "svc_title": "Capa de servicios",
      "svc_body": "Los servicios contienen toda la lógica de negocio, validación y coordinación entre repositorios. Manejan la gestión de transacciones, la publicación de eventos y la orquestación entre módulos.",
      "repo_title": "Capa de repositorio",
      "repo_body": "Los repositorios son la <strong>única</strong> capa que interactúa con la base. Todas las consultas usan <strong>SQL parametrizado</strong> con placeholders <code>$1, $2</code> (nunca concatenación) para la prevención de inyecciones SQL.",
      "modstruct_title": "Estructura de archivos de un módulo",
      "startup_title": "Secuencia de arranque de la aplicación",
      "startup_intro": "La aplicación FastAPI se inicializa en este orden al arrancar (definido en el lifespan de <code>main.py</code>):",
      "startup": {
        "s1": "<strong>Pool BD</strong> &mdash; pool de conexiones asyncpg (5-20 conexiones)",
        "s2": "<strong>Sync de permisos</strong> &mdash; auto-descubrimiento RBAC, sync de roles, limpieza obsoleta",
        "s3": "<strong>Sync de flujos</strong> &mdash; clases Python de flujos sincronizadas a la BD (tarifas, docs, menús)",
        "s4": "<strong>Event Bus</strong> &mdash; registra los handlers notification, audit, agent queue, payment assignment y verification",
        "s5": "<strong>Reparación de huérfanos</strong> &mdash; auto-reparación de solicitudes PAID no asignadas a agentes",
        "s6": "<strong>Sistema de caché</strong> &mdash; Upstash Redis con fallback en memoria",
        "s7": "<strong>RBAC listener</strong> &mdash; PostgreSQL NOTIFY para invalidación de permisos en tiempo real",
        "s8": "<strong>Scheduler interno</strong> &mdash; trabajos cron (reemplaza Cloud Scheduler)"
      }
    },
    "frontend": {
      "diagram_title": "Arquitectura modular del frontend",
      "modules": "41+ módulos funcionales", "modules_sub": "components / hooks / services / types",
      "core": "Capa Core", "core_sub": "api/client.ts, auth, providers",
      "shadcn_sub": "Estilo Tailwind CSS",
      "rq_sub": "Estado servidor",
      "zustand_sub": "Estado cliente",
      "routes_title": "Grupos de rutas",
      "col_group": "Grupo", "col_path": "Ruta", "col_purpose": "Función", "col_auth": "Auth requerida",
      "no": "No", "yes_jwt": "Sí (JWT)",
      "row": {
        "auth_path": "<code>/[locale]/login</code>, <code>/register</code>, etc.",
        "auth_purpose": "Páginas de autenticación",
        "public_path": "<code>/[locale]/services</code>, <code>/about</code>",
        "public_purpose": "Información pública",
        "dash_purpose": "Área protegida usuario/agente"
      },
      "modpat_title": "Patrón de módulo frontend"
    },
    "mobile": {
      "intro": "Dos aplicaciones Expo (React Native) separadas sirven a distintos grupos de usuarios:",
      "col_app": "Aplicación", "col_pkg": "Paquete", "col_users": "Usuarios", "col_status": "Estado",
      "row": {
        "citizen": "Facil (ciudadano)",
        "citizen_users": "Ciudadanos, empresas",
        "citizen_status": "P2 completo (panel, listados, servicios)",
        "inspector_users": "Agentes de inspección de campo",
        "inspector_status": "Arquitectura P0 lista"
      },
      "stack_title": "Pila tecnológica móvil",
      "stack": {
        "framework": "<strong>Framework:</strong> Expo SDK 54 con Expo Router (routing por archivos)",
        "ui": "<strong>UI:</strong> React Native Paper (Material Design 3)",
        "state": "<strong>Estado:</strong> React Query (servidor) + Zustand (cliente)",
        "validation": "<strong>Validación:</strong> Esquemas Zod en todos los formularios",
        "i18n": "<strong>Internacionalización:</strong> 3 idiomas (ES/FR/EN)",
        "design": "<strong>Principio de diseño:</strong> Patrones nativos Android (listas planas, divisores, efectos ripple)"
      }
    },
    "db": {
      "intro": "PostgreSQL alojado en Supabase actúa como almacén de datos primario. El esquema incluye 145 tablas organizadas en 10 dominios, con la extensión pgvector para almacenamiento de embeddings IA.",
      "diagram_title": "Arquitectura de conexión BD",
      "fastapi": "Aplicación FastAPI",
      "pool_sub": "min=5, max=20 conexiones",
      "pg_sub": "145 tablas + 50 enums + pgvector",
      "features_intro": "Características clave de la BD:",
      "feat": {
        "pool": "<strong>Pooling de conexiones:</strong> pool asyncpg con 5-20 conexiones, auto-reconexión",
        "lock": "<strong>Orden de bloqueos:</strong> secuencia canónica de bloqueo para pagos bundle para prevenir deadlocks",
        "soft": "<strong>Borrados lógicos:</strong> patrón timestamp <code>deleted_at</code> en tablas aplicables",
        "audit": "<strong>Pista de auditoría:</strong> <code>created_at</code>, <code>updated_at</code> en todas las tablas",
        "pgvector": "<strong>pgvector:</strong> para almacenamiento de embeddings del chatbot RAG y búsqueda por similitud",
        "tsvector": "<strong>tsvector:</strong> búsqueda full-text en el catálogo de servicios fiscales"
      },
      "see_also": "Ver <a href=\"database.html\">Referencia del esquema BD</a> para el catálogo completo de tablas."
    },
    "cache": {
      "intro": "El sistema <code>HybridCache</code> (<code>app/core/cache.py</code>) provee Redis (Upstash TLS) como caché primaria con fallback automático en memoria cuando Redis no está disponible.",
      "col_instance": "Instancia de caché", "col_factory": "Función factory", "col_ttl": "TTL", "col_purpose": "Función",
      "5min": "5 min", "10min": "10 min", "30min": "30 min", "1h": "1 hora",
      "row": {
        "default": "Por defecto", "default_purpose": "Caché de propósito general",
        "menu": "Menú", "menu_purpose": "Configuraciones de menú por rol",
        "perm": "Permisos", "perm_purpose": "Conjuntos de permisos RBAC por usuario",
        "svc": "Servicios", "svc_purpose": "Catálogo de servicios fiscales (873 items)",
        "tr": "Traducciones", "tr_purpose": "Traducciones UI y de entidades",
        "wm": "Mapeos de flujo", "wm_purpose": "Reglas de mapeo flujo a menú",
        "sess": "Sesiones", "sess_purpose": "Datos de sesión de usuario"
      },
      "features_intro": "Características adicionales del caché:",
      "feat": {
        "rate": "<strong>Rate limiting:</strong> <code>check_rate_limit(identifier, endpoint, max_requests, window_seconds)</code>",
        "invalidate": "<strong>Invalidación de caché:</strong> <code>invalidate_user_permissions_cache(user_id)</code> disparada por PostgreSQL NOTIFY",
        "listener": "<strong>RBAC listener:</strong> invalidación de caché en tiempo real vía <code>app/core/rbac_listener.py</code> suscrito al canal PostgreSQL NOTIFY",
        "dec": "<strong>Decoradores:</strong> <code>@cached(cache_getter, ttl)</code> para caché transparente de resultados"
      }
    },
    "ai": {
      "diagram_title": "Pipeline IA / RAG",
      "user_query": "Consulta del usuario",
      "preproc": "Preprocesador de consulta", "preproc_sub": "Detección de idioma, clasificación de intención",
      "hybrid": "Búsqueda híbrida", "hybrid_sub": "70 % coseno pgvector + 30 % tsvector",
      "context": "Ensamblado del contexto", "context_sub": "Docs relevantes + contexto de usuario + herramientas",
      "gemini_sub": "35 herramientas + bucle de auto-reflexión",
      "response": "Respuesta", "response_sub": "15 formatos + verificación de score (regenera si <5/10)",
      "body": "El sistema IA usa Gemini 2.5 Flash vía Google Vertex AI con un pipeline Retrieval-Augmented Generation (RAG). Soporta 35 herramientas especializadas (19 públicas, 8 autenticadas, 8 razonamiento avanzado) y 5 configuraciones de agente por rol. El bucle de auto-reflexión puntúa cada respuesta y la regenera si la calidad es inferior a 5/10.",
      "see_also": "Ver <a href=\"agents.html\">IA &amp; Inteligencia</a> para la referencia IA completa."
    },
    "event": {
      "intro": "El <code>EventBus</code> (<code>app/core/events.py</code>) provee un sistema publish/subscribe in-process para la comunicación entre módulos desacoplada.",
      "handlers_title": "Handlers de eventos registrados",
      "col_handler": "Handler", "col_module": "Módulo", "col_events": "Eventos",
      "row": {
        "notif": "Handler de notificación", "notif_events": "Cambios de estado de solicitud, eventos de pago",
        "audit": "Handler de auditoría", "audit_events": "Todas las operaciones críticas (tabla audit_logs)",
        "queue": "Handler de cola de agente", "queue_events": "Pago completado, solicitud enviada",
        "pay": "Handler de asignación de pago", "pay_events": "Auto-asignación de pagos manuales a Tesorería",
        "verif": "Handler de verificación", "verif_events": "Eventos de verificación de documentos externos"
      },
      "sched_title": "Scheduler interno",
      "sched_intro": "El <code>internal_scheduler</code> (<code>app/core/scheduler.py</code>) ejecuta tareas periódicas dentro del proceso de la aplicación, reemplazando la necesidad de un Cloud Scheduler externo:",
      "sched": {
        "appt": "Expiración de holds de citas (limpieza TTL 15 minutos)",
        "sla": "Monitorización de plazos SLA y escalada",
        "workload": "Rebalanceo de carga de agentes",
        "warm": "Pre-calentamiento de caché para datos accedidos frecuentemente"
      }
    }
  },

  "lr": {
    "html_title": "Observabilidad LogRocket - Documentación Facil",
    "title": "LogRocket — Reproducción de sesión & observabilidad privacidad ante todo",
    "description": "LogRocket está cableado en <strong>3 superficies</strong> (web, móvil, inspector) como la « CCTV » de la plataforma Facil. Mientras que Sentry captura los fallos cuando ocurren, LogRocket registra <em>lo que el usuario hizo</em> antes, durante y después — haciendo reproducibles los bugs reportados por ciudadanos y las fricciones UX sin pedir nunca al usuario que repita los pasos.",
    "toc": {
      "why": "1. Por qué LogRocket (y no solo Sentry)",
      "architecture": "2. Arquitectura — 3 superficies, 1 familia de SDK",
      "privacy": "3. Diseño privacidad ante todo (censura PII)",
      "wiring": "4. Cableado del repositorio (archivo por archivo)",
      "secrets": "5. Topología de secretos",
      "flows": "6. Flujos de uso diario",
      "tour": "7. Recorrido del panel LogRocket",
      "bridge": "8. El bridge Sentry",
      "limits": "9. Límites, trampas, roadmap"
    },
    "why": {
      "intro": "LogRocket y Sentry parecen similares al principio — ambos « capturan errores » — pero resuelven problemas distintos. Elegir el adecuado bajo presión es la mitad del arte de la guardia.",
      "both_title": "Por qué usamos ambos",
      "both1": "<strong>La fuerza de Sentry es alerting + agrupamiento</strong>. Cuando la tasa de errores se dispara, Sentry avisa a la guardia y deduplica por fingerprint de stack-trace. Ligero, bajo volumen.",
      "both2": "<strong>La fuerza de LogRocket es el contexto</strong>. Cuando un ciudadano dice « la app falló cuando hice clic en enviar », reproduces esa sesión exacta y <em>ves</em> el bug, no solo el síntoma.",
      "both3": "<strong>Se complementan</strong>: Sentry detecta → LogRocket explica. El bridge (<code>bridgeLogRocketToSentry()</code>) adjunta la URL de sesión LogRocket a cada evento Sentry, así un Issue en Sentry enlaza directamente a su reproducción en un clic.",
      "pitfall_title": "Trampa común",
      "pitfall_body": "« Tengo Sentry, no necesito LogRocket » — <strong>incorrecto</strong>. Los bugs UX (UI bloqueada, navegación errónea, formulario confuso) no dejan rastro en Sentry porque no se lanza ninguna excepción. LogRocket es la única herramienta que captura <em>sesiones sin error</em>, exactamente lo que necesitas para diagnosticar una queja ciudadana sobre el wizard."
    },
    "compare": {
      "cadence": "Cadencia de captura", "cadence_sentry": "Solo en el momento del error", "cadence_lr": "<strong>Continuamente</strong>, como una CCTV",
      "stored": "Lo que se almacena", "stored_sentry": "Stack trace + 60 s de breadcrumbs", "stored_lr": "<strong>Vídeo de sesión completo</strong> — clics, scrolls, red, consola, redux/zustand",
      "pricing": "Modelo de precio", "pricing_sentry": "Por evento de error", "pricing_lr": "Por <strong>sesión</strong> (una visita de usuario = una sesión)",
      "tier": "Free tier", "tier_sentry": "5K errores / mes", "tier_lr": "1K sesiones / mes",
      "best": "Ideal para", "best_sentry": "« ¿Por qué falló esto? » — root-cause", "best_lr": "« ¿Qué hizo el usuario antes de X? » — reproducir un recorrido",
      "trigger": "Disparador", "trigger_sentry": "<code>captureException(err)</code> o auto-uncaught", "trigger_lr": "Init SDK al arranque → captura hasta el fin de la sesión",
      "ui": "UI principal", "ui_sentry": "Lista Issues / Errors", "ui_lr": "Lista de sesiones con vídeo de reproducción"
    },
    "arch": {
      "diagram_title": "Matriz de cobertura LogRocket",
      "web": "Web (Next.js 14)",
      "mobile": "App móvil ciudadano (Expo SDK 54)",
      "inspector": "App inspector (Expo SDK 54)",
      "single": "Proyecto LogRocket único",
      "single_sub": "app.logrocket.com/0eqns2/facil — cuota compartida 1K sesiones/mes",
      "pii": "Censura PII (defensa de 3 capas)",
      "pii_sub": "Opciones SDK + sanitizers + opt-in DOM/JSX",
      "bridge": "Bridge Sentry (web hoy)",
      "bridge_sub": "extra.logrocketURL en cada evento Sentry",
      "policy_title": "Política de inicialización por superficie",
      "col_surface": "Superficie", "col_init": "Ubicación de la inicialización", "col_noop": "Auto no-op cuando", "col_default": "Captura por defecto",
      "row": {
        "web": { "name": "<strong>Web</strong>", "init": "<code>&lt;LogRocketProvider&gt;</code> montado en <code>Providers.tsx</code>", "noop": "<code>NODE_ENV=development</code> O <code>NEXT_PUBLIC_LOGROCKET_APP_ID</code> vacío O SSR (<code>!window</code>)", "default": "Capturar todo el texto visible; <strong>opt-out</strong> vía <code>data-private=\"redact\"</code>" },
        "mobile": { "name": "<strong>Móvil</strong>", "init": "<code>initLogRocket()</code> en <code>&lt;DeferredEffects&gt;</code> de <code>_layout.tsx</code>", "noop": "<code>__DEV__=true</code> O <code>EXPO_PUBLIC_LOGROCKET_APP_ID</code> vacío", "default": "Censurar todo el texto; <strong>opt-in</strong> vía <code>&lt;LRAllow&gt;</code>" },
        "insp": { "name": "<strong>Inspector</strong>", "init": "Igual que móvil", "default": "Igual que móvil (censura RN por defecto)" }
      },
      "opposite_title": "¿Por qué defaults opuestos (web vs móvil)?",
      "opposite_body": "El web es escritorio, a menudo usado por agentes en máquinas compartidas — capturar es más útil para triage y el navegador desktop normalmente no contiene la misma intensidad de PII que un dispositivo personal. El móvil es un dispositivo personal con formularios sensibles (pasaporte, NIF, dirección) — censurar por defecto es más seguro. Coste del compromiso: las reproducciones son menos informativas en móvil hasta que auditas cada pantalla y envuelves las zonas no-PII con <code>&lt;LRAllow&gt;</code>."
    },
    "priv": {
      "intro": "Facil procesa pasaportes ciudadanos, NIFs, declaraciones, recibos de pago. La fuga de PII a un SaaS de terceros es un riesgo regulatorio. Los wrappers SDK aplican <strong>4 capas de defensa</strong>, cada una independientemente suficiente (defensa en profundidad):",
      "l1": "<strong>L1 — Opciones SDK</strong>: <code>inputSanitizer: true</code> (web) / <code>textSanitizer: 'excluded'</code> (móvil) enmascara la entrada cruda del usuario antes de que abandone el dispositivo.",
      "l2": "<strong>L2 — Sanitizers de red</strong>: cada solicitud elimina las cabeceras <code>Authorization</code> + <code>Cookie</code>; los cuerpos se eliminan en <code>/auth/login</code>, <code>/auth/register</code>, <code>/auth/password-reset</code>, <code>/auth/2fa</code>; los cuerpos de respuesta se eliminan en endpoints emisores de tokens (<code>/auth/login</code>, <code>/auth/refresh</code>, <code>/auth/2fa</code>).",
      "l3": "<strong>L3 — Opt-in DOM / JSX</strong>: responsabilidad del equipo de la app — etiquetar campos PII explícitamente. <code>data-private=\"redact\"</code> en web; <code>&lt;LRAllow&gt;</code> envolviendo contenido no-PII en móvil (inverso: cualquier cosa no envuelta queda enmascarada).",
      "l4": "<strong>L4 — Política de identificación</strong>: solo <code>id + role + locale</code> se envían vía <code>LogRocket.identify()</code>. <strong>Nunca</strong> email, teléfono, NIF, dirección. Aplicado vía la signatura TypeScript del wrapper.",
      "other_title": "Otros defaults relevantes para la privacidad",
      "other": {
        "ip": "<code>shouldCaptureIP: false</code> (web) / <code>enableIPCapture: false</code> (móvil) — nunca geolocalizar usuarios.",
        "console": "<code>console.isEnabled = { warn: true, error: true, log: false }</code> — eliminar logs de desarrollador que puedan llevar contexto sensible.",
        "release": "<code>release: NEXT_PUBLIC_BUILD_VERSION</code> — atribución de sesión por build para la caza de regresiones."
      }
    },
    "wiring": {
      "web_title": "Web (<code>packages/web/</code>)",
      "web": {
        "wrapper": "<code>src/core/observability/logrocket.ts</code> — wrapper SDK (init, identify, track, capture, bridge sentry).",
        "provider": "<code>src/components/observability/LogRocketProvider.tsx</code> — componente cliente montado en <code>Providers.tsx</code>.",
        "storage": "<code>src/core/auth/storage.ts</code> — <code>identifyLogRocket</code> conectado en <code>setAuthData/clearAuthData</code>.",
        "env": "<code>.env.example</code> — <code>NEXT_PUBLIC_LOGROCKET_APP_ID</code>, <code>NEXT_PUBLIC_BUILD_VERSION</code>.",
        "docker": "<code>Dockerfile</code> — línea <code>ARG NEXT_PUBLIC_LOGROCKET_APP_ID</code> + <code>ENV</code>.",
        "gha": "<code>.github/workflows/deploy-frontend-staging.yml</code> — pasa <code>_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}</code> a Cloud Build."
      },
      "mobile_title": "Móvil (<code>packages/mobile/</code>)",
      "mobile": {
        "wrapper": "<code>src/core/observability/logrocket.ts</code> — wrapper LogRocket RN.",
        "sentry": "<code>src/core/observability/sentry.ts</code> — wrapper Sentry RN compañero.",
        "layout": "<code>src/app/_layout.tsx</code> — <code>initSentry()</code> + <code>initLogRocket()</code> dentro de <code>&lt;DeferredEffects&gt;</code>.",
        "auth": "<code>src/core/auth/auth-provider.tsx</code> — <code>setSentryUser</code> + <code>identifyLogRocket</code> co-localizados.",
        "appjson": "<code>app.json</code> — plugin <code>expo-build-properties</code>: <code>minSdkVersion: 25</code> + <code>extraMavenRepos</code> (informativo en modo non-CNG).",
        "gradle": "<code>android/build.gradle</code> — <code>ext.minSdkVersion = 25</code> + entrada Maven repo (canónico en modo non-CNG — nativos commiteados).",
        "eas": "<code>eas.json</code> — <code>EXPO_PUBLIC_LOGROCKET_APP_ID</code> en bloques env <code>preview</code> + <code>production</code>.",
        "easignore": "<code>.easignore</code> — sobrescribe <code>.gitignore</code> para que <code>/android</code> se envíe a EAS (sin él: <code>ENOENT gradlew</code> en la fase FIX_GRADLEW)."
      },
      "insp_title": "Inspector (<code>packages/inspector/</code>)",
      "insp_body": "Mismos archivos que móvil. Sin Sentry RN aún — <code>bridgeLogRocketToSentry()</code> es un stub no-op a la espera de la integración Sentry inspector."
    },
    "secrets": {
      "intro": "Fuente de verdad: <strong>Google Cloud Secret Manager</strong> (proyecto <code>taxasge-dev</code>). El secreto <code>logrocket-app-id</code> se replica a los secretos de repositorio GitHub y a las variables de entorno EAS, almacenado como <strong>plaintext</strong> deliberadamente — el App ID está bakeado en el bundle del cliente y visible en las solicitudes de red de DevTools de todas formas. La replicación mantiene un punto único de rotación.",
      "web_diagram": "Flujo del secreto (web)",
      "web_step1": "▼ replicado manualmente una vez",
      "gh_secrets": "Secretos de repositorio GitHub",
      "docker": "Stage Docker BUILDER (bake Next.js)",
      "docker_sub": "NEXT_PUBLIC_* embebido en el bundle del cliente",
      "browser": "Navegador del usuario final",
      "browser_sub": "Init SDK al cargar la página",
      "mobile_diagram": "Flujo del secreto (Móvil / Inspector vía EAS)",
      "eas_env": "Env EAS Cloud (preview + production)",
      "eas_worker": "Worker EAS Build (bake Expo CLI)",
      "eas_worker_sub": "EXPO_PUBLIC_* embebido en el bundle JS",
      "artifact": "Artefacto APK / IPA / AAB",
      "artifact_sub": "Distribuido vía Play / App Store / directo",
      "full_topology": "Topología completa de secretos + migración multi-cloud (AWS / Azure / VPS): ver <code>.claude/plans/OBSERVABILITY_STACK.md §2 / §5</code>."
    },
    "flow1": {
      "title": "Flujo 1 — Un usuario reporta un bug (« La app falló cuando hice clic en enviar »)",
      "s1": "Abrir el panel LogRocket → <strong>Session Replay</strong>.",
      "s2": "Filtrar por <code>user_id</code> (el valor enviado vía <code>LogRocket.identify()</code> — <strong>no email</strong>, por diseño, ya que el email es PII). Si solo tienes un email, busca el user_id en la UI admin del backend primero.",
      "s3": "Hacer clic en la sesión más reciente en la lista de resultados.",
      "s4": "El vídeo de reproducción muestra el recorrido exacto: clics, scrolls, el formulario que rellenaron, el momento del fallo.",
      "s5": "El panel derecho refleja una vista DevTools, alineada temporalmente con el vídeo — errores de consola, solicitudes de red, estado redux/zustand.",
      "s6": "Hacer clic en la solicitud fallida en el panel de red → ver cuerpo de solicitud + respuesta → diagnosticar la causa sin reproducir nunca el bug.",
      "note": "<strong>Por qué no Sentry primero</strong>: Sentry solo se dispara si el bug lanza una excepción real. Los bugs UX (UI bloqueada, navegación errónea, formulario confuso) no dejan rastro en Sentry. LogRocket captura todo eso."
    },
    "flow2": {
      "title": "Flujo 2 — Un pico de errores en producción",
      "intro": "Alerta Sentry: « TypeError: Cannot read property 'name' of undefined — 12 ocurrencias en 5 minutos ».",
      "s1": "Sentry <strong>Issues</strong> → hacer clic en la alerta → ver stack trace + frecuencia en el tiempo + qué release la introdujo.",
      "s2": "Abrir una de las sesiones afectadas en LogRocket vía <code>event.extra.logrocketURL</code> (el enlace del bridge).",
      "s3": "La reproducción LogRocket muestra la secuencia: el usuario navegó a <code>/services</code>, hizo clic en buscar, escribió « passport », hizo clic en un resultado. El panel de red revela que <code>GET /api/services/12345</code> devolvió <code>null</code> en lugar del objeto esperado.",
      "s4": "Ahora sabes: regresión backend, no un bug frontend.",
      "s5": "Rollback de la release backend O escribir un null-check defensivo en frontend."
    },
    "flow3": {
      "title": "Flujo 3 — Optimizar un drop-off de embudo",
      "intro": "« ¿Por qué el 80 % de los usuarios abandonan en el paso 3 del wizard? »",
      "s1": "Encontrar un evento custom ya cableado vía <code>trackLogRocket()</code> — p. ej. <code>wizard_step_completed</code> con <code>{ step: number }</code>.",
      "s2": "LogRocket <strong>Dashboards</strong> → crear un embudo: <code>wizard_step_completed</code> (step:1) → step:2 → step:3 → <code>wizard_submitted</code>.",
      "s3": "El embudo muestra: 100 % → 95 % → 85 % → <strong>15 %</strong>. Caída masiva en el paso 3.",
      "s4": "Filtrar sesiones: las que llegaron a step:3 pero nunca <code>wizard_submitted</code>. Muestrear 10 reproducciones.",
      "s5": "Observas un patrón: 6 de 10 usuarios miran fijamente el campo « NIF » > 30 s, y luego abandonan. La etiqueta es demasiado técnica.",
      "s6": "Lanzar una etiqueta más clara + un tooltip. Re-medir el embudo una semana después.",
      "note": "<strong>Por qué no Sentry</strong>: nada falló. No hay excepción. Esto es un diagnóstico UX puro y duro."
    },
    "tour": {
      "intro": "La UI LogRocket en <code>app.logrocket.com/0eqns2/facil</code> expone 5 secciones principales:",
      "col_section": "Sección", "col_purpose": "Función", "col_when": "Cuándo usar",
      "row": {
        "replay": { "name": "<strong>Session Replay</strong>", "purpose": "Reproducciones por visita de usuario con timeline de consola + red", "when": "Queja ciudadana, bug UX, fallo intermitente" },
        "issues": { "name": "<strong>Issues</strong>", "purpose": "Errores JS auto-detectados, similares a Sentry pero con una sesión adjunta", "when": "Triage de errores no alertados por Sentry" },
        "dashboards": { "name": "<strong>Dashboards</strong>", "purpose": "Agregaciones de eventos custom (contadores, embudos, tasas de conversión)", "when": "Drop-off de embudo, comparación A/B" },
        "surveys": { "name": "<strong>Surveys / Feedback</strong>", "purpose": "Encuestas NPS + widgets de feedback in-app (no usados hoy)", "when": "Investigación UX, sentimiento post-lanzamiento" },
        "settings": { "name": "<strong>Settings → Integrations</strong>", "purpose": "Hooks Slack / Jira / Linear (free tier limitado)", "when": "Empujar issues críticos al chat del equipo" }
      }
    },
    "bridge": {
      "intro": "Activado el 2026-04-30 una vez <code>@sentry/nextjs</code> fue cableado (lado web). El bridge adjunta la URL de sesión LogRocket a cada evento Sentry para que un Issue en Sentry enlace directamente a su reproducción en un clic — eliminando el coste de cambio de contexto entre las dos herramientas.",
      "ordering": "<strong>Por qué este orden</strong>: <code>getSessionURL()</code> se dispara <em>después</em> del primer flush de red (~2-5 s en la sesión). Los eventos Sentry pueden capturarse inmediatamente al cargar la página. Inicializar LogRocket primero y registrar el bridge dentro de su <code>init()</code> significa: cuando el bridge se conecta, Sentry ya está escuchando; el sitio de llamada del bridge vive junto al init LogRocket del que depende; sin dependencia circular.",
      "mobile": "<strong>Bridge móvil</strong>: stub hoy. Se activa el día en que los eventos Sentry RN en móvil/inspector deban llevar una URL de sesión LogRocket. Misma edición de 4 líneas que el web una vez ambos SDKs estén confirmados en vivo."
    },
    "limits": {
      "title": "Límites conocidos (honestos)",
      "tier": "<strong>Free tier 1K sesiones / mes</strong> — compartido entre web + móvil + inspector. A la escala actual (~20 usuarios staging) margen amplio; el escalado a producción requiere el plan Team.",
      "sourcemap": "<strong>Subida de sourcemaps no cableada</strong> — los stack traces de LogRocket están minificados. Plan: reutilizar la subida de sourcemaps Sentry CLI (<code>@sentry/cli</code>) en build time. <em>Seguimiento: OBSERVABILITY_STACK.md §8</em>.",
      "redact": "<strong>Censura por defecto en móvil</strong> — reproducciones informativas solo en pantallas auditadas y envueltas con <code>&lt;LRAllow&gt;</code>. Cadencia de auditoría: por feature lanzada.",
      "onprem": "<strong>Sin free tier on-prem</strong> — los despliegues air-gapped deben desactivar LogRocket totalmente."
    },
    "traps": {
      "title": "Trampas conocidas",
      "col_symptom": "Síntoma", "col_cause": "Causa raíz", "col_fix": "Fix",
      "row": {
        "minsdk_cause": "LogRocket RN requiere Android API 25+",
        "minsdk_fix": "Subir <code>ext.minSdkVersion</code> a 25 en <code>android/build.gradle</code> + <code>app.json</code> (cf. <code>OBSERVABILITY_STACK.md §7.6</code>)",
        "gradlew_cause": "<code>/android</code> en <code>.gitignore</code> retira los nativos del upload EAS",
        "gradlew_fix": "Añadir <code>.easignore</code> que sobrescribe <code>.gitignore</code> para los uploads EAS (cf. <code>OBSERVABILITY_STACK.md §7.2</code>)",
        "bundle_symptom": "El frontend carece de <code>LOGROCKET_APP_ID</code> en el bundle",
        "bundle_cause": "<code>--build-arg</code> no pasado al build Docker",
        "bundle_fix": "El YAML Cloud Build debe pasar <code>_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}</code> como sustitución (cf. <code>OBSERVABILITY_STACK.md §7.5</code>)",
        "anon_symptom": "Sesiones móvil todas anónimas",
        "anon_cause": "<code>identifyLogRocket()</code> no llamado en el auth provider",
        "anon_fix": "Cablear en <code>auth-provider.tsx</code> junto a <code>setSentryUser</code>",
        "blank_symptom": "Las reproducciones solo muestran campos en blanco en móvil",
        "blank_cause": "Default <code>textSanitizer: 'excluded'</code> + sin envoltorio <code>&lt;LRAllow&gt;</code>",
        "blank_fix": "Auditar pantallas; envolver el texto no-PII con <code>&lt;LRAllow&gt;</code>"
      }
    },
    "roadmap": {
      "title": "Roadmap",
      "s1": "<strong>Sentry RN en inspector</strong> — activar el cuerpo de <code>bridgeLogRocketToSentry()</code> en el wrapper inspector.",
      "s2": "<strong>Subida de sourcemaps</strong> — vía reutilización de Sentry CLI en CI para web y móvil.",
      "s3": "<strong>Cron de auto-rotación</strong> para <code>logrocket-app-id</code> (cadencia baja — público de todas formas).",
      "s4": "<strong>Plantillas de embudo</strong> — embudos preconstruidos para los 4 recorridos de usuario críticos (signup, pago, wizard, subida de documento) con umbrales de conversión objetivo + alertas."
    },
    "agent": {
      "title": "Agente reutilizable para otros proyectos",
      "body": "Destilado en <code>infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md</code> — un agente reproducible de 7 fases invocable vía la slash-command <code>/logrocket-observability</code>. Funciona en cualquier proyecto web (Next.js / Vite / CRA), móvil (Expo / bare RN) o híbrido. Aplica 8 salvaguardas activas (censura PII, gating, política de identificación, topología de secretos, drift de sourcemap, etc.)."
    },
    "related": {
      "title": "Documentación relacionada",
      "stack": "<code>.claude/plans/OBSERVABILITY_STACK.md</code> — referencia completa (~750 líneas): topología de secretos, migración multi-cloud, catálogo de trampas.",
      "quickstart": "<code>.claude/plans/OBSERVABILITY_QUICKSTART.md</code> — tutorial paso a paso para nuevos contribuidores.",
      "dashboards": "<code>.claude/plans/OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md</code> — doc compañero del lado Sentry (8 dashboards, reglas de alerta).",
      "grafana": "<a href=\"grafana-dashboards.html\">Paneles Grafana</a> — la capa analítica (KPIs orientados a decisión), complementaria a LogRocket (reproducción forense)."
    }
  },

  "gr": {
    "html_title": "Paneles Grafana - Documentación Facil",
    "title": "Paneles Grafana — Ingeniería analítica",
    "description": "10 paneles Grafana production-grade construidos sobre una arquitectura de datos semántica de 4 capas, que permiten a los responsables de decisión gubernamentales (tesorería, agentes ministeriales, supervisores, inspectores) responder preguntas de negocio en menos de 30 segundos. Esta página documenta el <em>por qué</em>, el <em>cómo</em> y las <em>decisiones</em> impulsadas por cada panel.",
    "toc": {
      "why": "1. Por qué & contexto de negocio",
      "ae": "2. Ingeniería analítica — la capa semántica",
      "personas": "3. Personas & mapa de decisiones",
      "dashboards": "4. Los 10 paneles",
      "patterns": "5. Patrones de ingeniería",
      "stack": "6. Stack & provisioning",
      "admin": "7. Auto-servicio admin (mig 323)",
      "limits": "8. Límites, linaje & roadmap"
    },
    "admin": {
      "intro": "La migración 323 (2026-05-05) hace que el registro de paneles esté totalmente dirigido por la BD. Los administradores con permiso <code>dashboards.manage</code> pueden añadir, editar, eliminar e importar en lote paneles vía la UI web &mdash; <strong>sin cambio de código, sin redespliegue</strong>. De los 10 paneles Grafana activos en <code>kouemousah.grafana.net</code>, los 10 son seedados automáticamente por la mig 323 más 1 catálogo Looker (Catálogo de Servicios) para un total de 11 filas en <code>dashboard_registrations</code>.",
      "where_title": "Dónde gestionar los paneles",
      "where": {
        "list": "<code>/admin/dashboards</code> &mdash; landing pública, agrupada por categoría (ejecutivo / finanzas / operaciones / negocio / producto / seguridad)",
        "config": "<code>/admin/dashboards/config</code> &mdash; CRUD admin: lista (11 filas) + edición + soft-delete + botón de importación",
        "detail": "<code>/admin/dashboards/{slug}</code> &mdash; embed pantalla completa (modo kiosk) con breadcrumb de retorno"
      },
      "add_title": "Añadir un nuevo panel Grafana (3 clics)",
      "add": {
        "s1": "<strong>Empuja el JSON del panel</strong> a <code>infra/grafana/dashboards/NN_nombre.json</code> vía el agente <code>/grafana-dashboards</code> existente o por aprovisionamiento manual. Anota el campo <code>uid</code> (ej: <code>facil-new-kpi</code>).",
        "s2": "<strong>Abre la página admin</strong> <code>/admin/dashboards/config</code>. Haz clic en el botón <strong>«Importar desde Grafana»</strong> (arriba a la derecha).",
        "s3": "<strong>Se abre el modal</strong> con todos los paneles del workspace. Los ya importados se filtran. Marca la(s) fila(s) deseada(s), edita el slug + títulos i18n + categoría inline, luego haz clic en <strong>«Importar»</strong>. La lista se refresca automáticamente."
      },
      "add_hint": "El slug se convierte en el segmento de URL (<code>/admin/dashboards/{slug}</code>) y la clave del audit log &mdash; una vez fijado, es inmutable. Mantén minúsculas, con guiones, 3-40 caracteres.",
      "where_get_title": "Dónde encontrar el UID y Organization ID de Grafana",
      "where_get": {
        "uid": "<strong>UID del panel</strong>: en Grafana, abre el panel. La URL es <code>https://&lt;workspace&gt;.grafana.net/d/&lt;UID&gt;/&lt;slug&gt;</code> &mdash; el segmento <code>&lt;UID&gt;</code> es lo que necesitas (4&ndash;40 caracteres alfanuméricos + guiones/guiones bajos). También visible en <em>Configuración del panel &rarr; JSON Model &rarr; <code>uid</code></em>.",
        "org": "<strong>Organization ID</strong>: <code>1</code> para cualquier workspace Grafana Cloud single-org (el predeterminado, incluyendo <code>kouemousah.grafana.net</code>). Visible en cualquier URL como <code>?orgId=1</code>, o en <em>Admin &rarr; Organizaciones</em>. Solo cambia esto si realmente operas múltiples orgs Grafana."
      },
      "config_title": "Configuración requerida",
      "config_intro": "El endpoint de importación Grafana llama a la API HTTP de Grafana del lado del servidor; requiere dos variables de entorno en Cloud Run / Secret Manager:",
      "col_var": "Variable", "col_value": "Valor", "col_purpose": "Función",
      "row": {
        "base": "URL base del workspace — usada para construir la URL del iframe <em>y</em> la llamada API discover. Variable de entorno simple (no sensible).",
        "token_v": "<strong>Vinculación con Secret Manager</strong>: <code>grafana-sa-token:latest</code> — enlazada vía <code>--set-secrets=</code> en el workflow de despliegue, NO como variable de entorno simple.",
        "token_p": "Autentica <code>/api/v1/dashboards/admin/grafana/discover</code> contra <code>/api/search</code> de Grafana. El token nunca aparece en el descriptor del servicio Cloud Run; la rotación = un solo <code>gcloud secrets versions add</code> sin editar el workflow."
      },
      "config_token_hint": "Para crear el token: Grafana &rarr; <em>Administration &rarr; Service Accounts &rarr; Add new</em> &rarr; rol <code>Viewer</code> (o scope más fino <code>dashboards:read</code>) &rarr; <em>Add token</em>. Luego aprovisionar en GCP:",
      "csp_hint": "<strong>Requisito CSP del frontend</strong>: el middleware Next.js emite una cabecera <code>Content-Security-Policy</code> con <code>frame-src</code>. El dominio Grafana DEBE estar en la lista blanca o el navegador bloquea el iframe con <em>«Framing 'https://kouemousah.grafana.net/' violates the following Content Security Policy directive»</em>. La lista actual incluye <code>https://*.grafana.net</code> y <code>https://lookerstudio.google.com</code> &mdash; definida en <code>packages/web/src/middleware.ts</code> y <code>packages/web/next.config.mjs</code>. Añadir un nuevo proveedor de embed requiere actualizar ambos.",
      "api_title": "Endpoints del backend",
      "col_method": "Método", "col_path": "Ruta", "col_perm": "Permiso", "col_desc": "Descripción",
      "api": {
        "list": "Listado público — el admin ve filas admin_only, los demás no (RLS).",
        "adm_list": "Listado admin — todas las filas, activas e inactivas.",
        "create": "Crear un nuevo panel desde cero (409 si conflicto de slug).",
        "put": "Actualizar provider/UID/estado activo.",
        "patch": "Actualización parcial de metadatos i18n + presentación.",
        "delete": "Soft-delete (pone is_active=false, preserva traza de auditoría).",
        "discover": "Listar paneles del workspace vía /api/search de Grafana (cache 5 min).",
        "import": "Importación en lote de paneles seleccionados (TX aislada por ítem)."
      },
      "security_title": "Seguridad & salvaguardas",
      "security": {
        "rate": "<strong>Rate-limit 10 escrituras/min/usuario</strong> en POST/PUT/PATCH/DELETE/import.",
        "regex": "<strong>Regex de 3 capas</strong> sobre slug + UID Grafana + IDs Looker (Zod &rarr; Pydantic &rarr; CHECK BD).",
        "audit": "<strong>Audit log</strong>: cada escritura inserta una fila en <code>audit_logs</code> en la misma transacción BD (memoria regla #24: <code>json.dumps</code> para JSONB).",
        "boot": "<strong>Boot no destructivo</strong>: el permiso <code>dashboards.manage</code> se preserva al boot incluso si no hay espejo en <code>dashboards_permissions.py</code> (memoria regla #37).",
        "rls": "<strong>Filtrado RLS</strong>: los paneles <code>admin_only</code> (ej: <em>User Activity audit</em>) ocultos a los callers no-admin a nivel SQL, no solo en la UI.",
        "token": "<strong>El SA token nunca llega al navegador</strong>: discover/import son solo del lado servidor; el frontend nunca ve <code>GRAFANA_SA_TOKEN</code>."
      }
    },
    "why": {
      "problem_title": "El problema",
      "problem_body": "Antes de esta iniciativa, los responsables de decisión en las 20 entidades gubernamentales de Facil operaban sin una vista analítica unificada. Cada ministerio tenía informes aislados, la conciliación de tesorería se hacía manualmente en hojas de cálculo, el rendimiento de los agentes se evaluaba de forma anecdótica y los inspectores no tenían analítica de campo. La plataforma generaba <strong>3.342+ eventos de auditoría</strong>, procesaba pagos en XAF y asignaba solicitudes de servicio en <strong>5 ciudades</strong> — pero ninguno de estos datos era accionable en tiempo real.",
      "need_title": "La necesidad",
      "need": {
        "treasury": "<strong>Tesorería</strong> necesita seguimiento diario de ingresos por ministerio, entidad, método de pago y sede, con el estado de conciliación visible de un vistazo.",
        "agents": "<strong>Agentes ministeriales</strong> necesitan conocer su carga, presión SLA y obligaciones pendientes.",
        "supervisors": "<strong>Supervisores</strong> necesitan comparaciones de rendimiento entre equipos y adopción de módulos OMS (One-Stop-Shop).",
        "inspectors": "<strong>Inspectores</strong> necesitan seguimiento de actividad de campo con GPS, fotos y contadores de precintos.",
        "execs": "<strong>Directivos</strong> necesitan un Overview único para ver el pulso de la plataforma."
      },
      "choice_title": "Por qué Grafana (y Looker Studio en paralelo)",
      "choice_body": "Evaluamos tres opciones: una suite de paneles React custom, Looker Studio y Grafana Cloud. La decisión fue ejecutar <strong>Grafana y Looker Studio en paralelo</strong>, con un toggle en runtime en <code>/admin/dashboards/config</code> impulsado por la columna <code>dashboard_provider_enum</code> de <code>dashboard_registrations</code>. Este diseño dual-provider nos permite comparar A/B en producción y evitar el vendor lock-in.",
      "col_criterion": "Criterio", "col_custom": "React custom",
      "row": {
        "ttfd": "Time-to-first-dashboard", "ttfd_g": "< 1 día", "ttfd_l": "~2 días (solo UI)", "ttfd_c": "2-3 semanas por panel",
        "dac": "Dashboards-as-code (versionados en Git)", "dac_g": "JSON vía API", "dac_l": "Solo UI, sin API para contenido", "dac_c": "React + manual",
        "sql": "SQL-first (Postgres nativo)", "sql_l": "JDBC, ciego a MV por defecto",
        "embed": "Embed en admin (iframe + auth)", "embed_g": "&#9989; <code>d-solo</code> + kiosk=tv", "embed_l": "&#9989; embed token",
        "cost": "Coste (10 paneles, 100+ agentes)", "cost_g": "Free tier suficiente", "cost_c": "~3 dev-meses",
        "refresh": "Auto-refresh + alerting", "refresh_g": "&#9989; nativo", "refresh_l": "&#9888; limitado", "refresh_c": "Por construir"
      },
      "choice_summary": "Grafana ganó en time-to-value y dashboards-as-code. Looker Studio quedó como fallback / opción para partes interesadas no-tech. Ambos consumen la misma capa semántica (Sección 2).",
      "goals_title": "Objetivos de negocio",
      "goal1": "<strong>Reducir el time-to-decision</strong>: de días (solicitud manual de informe) a segundos (panel en vivo).",
      "goal2": "<strong>Fuente única de verdad</strong>: cada KPI rastreable a una vista SQL, con pista de auditoría (columna <code>location_source</code>).",
      "goal3": "<strong>Drill-down multidimensional</strong>: cada panel soporta cadenas de filtros (ministerio → entidad → sede → período).",
      "goal4": "<strong>Granularidad por sede</strong>: ingresos, agentes, inspecciones todos atribuibles a ciudades específicas (Malabo, Bata, Mongomo, …).",
      "goal5": "<strong>Seguimiento de adopción OMS</strong>: clasificador dinámico (<code>workflow_codes ? 'BUNDLE_PAYMENT'</code>) para medir el despliegue progresivo."
    },
    "ae": {
      "intro": "Nota terminológica: este trabajo es <strong>Ingeniería analítica</strong>, no análisis de datos de negocio. Un Business Data Analyst <em>consume</em> los paneles para encontrar insights; un Analytics Engineer <em>construye la capa semántica</em> que hace esos insights fiables, rápidos y consistentes entre los consumidores (Grafana, Looker, apps custom). El trabajo abajo es lo segundo.",
      "diagram_title": "Arquitectura de datos de 4 capas",
      "l1": "Capa 1 — Agregaciones", "l1_sub": "Vistas materializadas (cron 15 min)",
      "l2": "Capa 2 — Vistas enriquecidas", "l2_sub": "v_*_enriched (JOIN entidades + sedes + agentes + clasificadores)",
      "l3": "Capa 3 — Wrappers automáticos", "l3_sub": "vw_* (sincronizados al arranque para visibilidad Looker JDBC)",
      "l4": "Capa 4 — Consumidores", "l4_sub": "Grafana Cloud + Looker Studio + futuras herramientas BI",
      "l1_title": "Capa 1 — Agregaciones (MVs)",
      "l1_body": "Las vistas materializadas pre-calculan agregaciones pesadas (sum, count, group by) en un cron de 15 minutos. Son la fuente <em>backup</em> e <em>histórica</em>. <strong>Las consultas en vivo sobre vistas enriquecidas son el camino primario</strong> para los paneles que necesitan datos en tiempo real — las MVs se leen solo cuando se necesitan agregaciones históricas (cf. regla de memoria #22).",
      "l2_title": "Capa 2 — Vistas enriquecidas (el corazón)",
      "l2_intro": "Esta es la <strong>capa semántica</strong> — el lugar canónico donde vive la lógica de negocio:",
      "l2": {
        "joins": "<strong>JOINs resueltos una vez</strong>: entidades, sedes, agentes, ministerios se unen aquí para que los paneles nunca reinventen el JOIN.",
        "classifiers": "<strong>Clasificadores calculados</strong>: <code>is_oms = workflow_codes ? 'BUNDLE_PAYMENT'</code>, <code>is_supervisor = role_code ILIKE '%supervisor%'</code>, etc.",
        "multi": "<strong>Resolución multi-fuente</strong> (la funcionalidad killer): la sede canónica de un pago se resuelve como una cadena <code>COALESCE</code> de 4 pasos (inspección de campo → solicitud de servicio → agente recolector → agente validador), con una columna de auditoría <code>location_source</code> para que los consumidores puedan confiar en el dato.",
        "granted": "<strong>Concedido a <code>looker_readonly</code></strong>: un rol dedicado de solo lectura sin privilegios de escritura, aislando el acceso BI del acceso aplicativo."
      },
      "l3_title": "Capa 3 — Wrappers automáticos",
      "l3_body": "El driver JDBC de Looker Studio oculta las vistas materializadas (<code>relkind='m'</code>). Para hacer las MVs visibles en el picker sin escribir wrappers manuales, el arranque del backend ejecuta <code>sync_looker_view_wrappers()</code> que crea automáticamente una vista <code>vw_*</code> de <code>relkind='v'</code> sobre cada MV concedida a <code>looker_readonly</code>. Grafana no necesita esta capa (su driver Postgres ve las MVs nativamente), así que los paneles referencian <code>v_*</code> y <code>mv_*</code> directamente.",
      "l4_title": "Capa 4 — Consumidores (Grafana + Looker)",
      "l4_body": "Ambos providers consumen las mismas vistas de la Capa 2. La tabla <code>dashboard_registrations</code> almacena una columna <code>provider</code> (<code>'looker' | 'grafana'</code>) para que cada panel registrado sepa cómo embeberse."
    },
    "personas": {
      "intro": "Cada panel debe responder al menos a una decisión concreta. El mapeo abajo es el <em>contrato</em>: si una parte interesada no puede responder a sus preguntas listadas en menos de 30 segundos, el panel está roto y se rehace.",
      "col_persona": "Persona", "col_dash": "Paneles principales", "col_decisions": "Decisiones impulsadas",
      "row": {
        "treasury": { "name": "<strong>Responsable de tesorería</strong>", "dash": "Recaudación Fiscal, Payments Operations, Overview", "dec": "Alertas de ingresos diarias, brechas de conciliación, drift de método de pago, contribución por ministerio" },
        "agent": { "name": "<strong>Agente ministerial (CNEDOGE, MIN_TRABAJO, …)</strong>", "dash": "Performance Agentes, Service Requests", "dec": "Profundidad de mi cola, mi presión SLA, benchmarking entre pares" },
        "oms": { "name": "<strong>Supervisor OMS (AYUNTAMIENTO, CAMARA_COMERCIO)</strong>", "dash": "OMS Modules, Empresas, Inspections", "dec": "Tasa de finalización de obligaciones bundle, velocidad de emisión de licencias, calidad de inspecciones de campo" },
        "insp": { "name": "<strong>Inspector jefe</strong>", "dash": "Inspections, Mobile vs Web vs Inspector", "dec": "Actividad de campo por zona/ciudad, tasa de evidencia fotográfica, uso de precintos, adopción de la app móvil por los inspectores" },
        "dir": { "name": "<strong>Director de servicios al ciudadano</strong>", "dash": "Empresas, Service Requests, User Activity", "dec": "Cohorte de empresas activas por zona, backlog de solicitudes, pista de auditoría ciudadana" },
        "exec": { "name": "<strong>Dirección (DG / Ministro)</strong>", "dash": "Solo Overview", "dec": "Pulso de salud de la plataforma, comparación entre ministerios, velocidad de adopción móvil" }
      }
    },
    "dash": {
      "intro": "Cada panel abajo documenta: <strong>captura de pantalla</strong>, <strong>KPIs principales</strong> con su fórmula SQL, <strong>filtros</strong>, la <strong>vista fuente</strong> y las <strong>decisiones concretas</strong> que permite. Todos los paneles comparten una etiqueta (<code>facil</code>) y se enlazan entre sí vía el menú desplegable de navegación.",
      "col_kpi": "KPI", "col_formula": "Fórmula (simplificada)", "col_formula_short": "Fórmula", "col_source": "Fuente", "col_decision": "Decisión",
      "overview": {
        "title": "00 — Overview",
        "meta": "<strong>UID</strong>: <code>facil-overview</code> · <strong>Audiencia</strong>: Dirección · <strong>Filtros</strong>: solo período",
        "body": "El pulso de la plataforma. 4-7 stat cards arriba (ingresos, empresas activas, agentes en línea, eventos de auditoría), 1-2 timeseries mostrando tendencia, y un menú desplegable de navegación a los otros 9 paneles.",
        "kpi": {
          "revenue": "Recaudación total (XAF)", "revenue_dec": "Alerta de ingresos diarios si < umbral",
          "empresas": "Empresas activas", "empresas_dec": "Velocidad de onboarding",
          "agents": "Agentes activos (24h)", "agents_dec": "Planificación de capacidad",
          "audit": "Eventos de auditoría", "audit_dec": "Detección de anomalías"
        }
      },
      "treasury": {
        "title": "01 — Recaudación Fiscal",
        "meta": "<strong>UID</strong>: <code>facil-treasury</code> · <strong>Audiencia</strong>: Responsable de tesorería · <strong>Filtros</strong>: Ministerio, Entidad, Flujo, Método, <strong>Sede (multi-fuente)</strong>",
        "body": "El panel insignia. Resuelve los ingresos por <strong>sede física</strong> (ciudad) usando la cadena COALESCE de 4 pasos para que un pago recogido por un inspector en Bata se atribuya a Bata, no al agente validador en Malabo. El donut <code>location_source</code> muestra el desglose de la resolución.",
        "kpi": {
          "total": "Recaudación total", "total_dec": "Seguimiento de ingresos",
          "recovery_dec": "Brecha de conciliación",
          "persite": "Desglose por sede", "persite_dec": "Rendimiento por sede",
          "method": "Mix de métodos", "method_dec": "Adopción BANGE",
          "attribution": "Atribución de fuente", "attribution_dec": "Auditoría de calidad de datos"
        }
      },
      "agents": {
        "title": "02 — Performance Agentes",
        "meta": "<strong>UID</strong>: <code>facil-agents</code> · <strong>Audiencia</strong>: Agente + Supervisor ministerial · <strong>Filtros</strong>: toggle OMS, Entidad, Sede, Tipo de agente",
        "body": "El toggle OMS (variable custom) permite a los supervisores comparar los equipos bundle-payment (AYUNTAMIENTO, CAMARA_COMERCIO) vs los equipos ministeriales tradicionales. Drill: ministerio → entidad → sede → agente.",
        "kpi": {
          "active": "Agentes activos", "active_dec": "Asignación de recursos",
          "queue": "Profundidad media de cola", "queue_dec": "Señal de contratación / rebalanceo",
          "sla": "Presión SLA", "sla_dec": "Alerta de escalada",
          "top": "Top performers", "top_dec": "Reconocimiento / formación"
        }
      },
      "companies": {
        "title": "03 — Empresas",
        "meta": "<strong>UID</strong>: <code>facil-companies</code> · <strong>Audiencia</strong>: Director de servicios al ciudadano · <strong>Filtros</strong>: Zona, <strong>Ciudad (drill JSONB)</strong>",
        "body": "El filtro Ciudad usa drill JSONB en <code>mv_company_global_stats.by_city</code> — una columna analítica pre-agregada. Consulta JSONB single-row → múltiples filas expandidas vía <code>jsonb_array_elements()</code>.",
        "kpi": {
          "regis": "Empresas registradas", "regis_dec": "Penetración de mercado",
          "zone": "Por zona (12 zonas)", "zone_dec": "Outreach regional",
          "city": "Por ciudad (16 ciudades)", "city_dec": "Despacho de agente local",
          "debt": "Deuda por ciudad", "debt_src": "Drill JSONB", "debt_dec": "Prioridad de cobro"
        }
      },
      "oms": {
        "title": "04 — OMS Modules",
        "meta": "<strong>UID</strong>: <code>facil-oms</code> · <strong>Audiencia</strong>: Supervisor OMS · <strong>Filtros</strong>: Ministerio, Fee_type, Zona, Sede",
        "body": "OMS = One-Stop-Shop. Sigue el despliegue del flujo bundle-payment: una entidad es OMS si su array JSONB <code>workflow_codes</code> contiene <code>'BUNDLE_PAYMENT'</code>. Este clasificador es <strong>gestionado por admin vía UI</strong> (sin redespliegue de código) y consumido vía el operador JSONB <code>?</code>.",
        "kpi": {
          "entities": "Entidades OMS", "entities_dec": "Progreso de despliegue",
          "obli": "Obligaciones emitidas", "obli_dec": "Adopción bundle",
          "fees": "Tasas medias por bundle", "fees_dec": "Benchmark de precios",
          "compl": "Tasa de finalización", "compl_dec": "Diagnóstico de fricción"
        }
      },
      "payments": {
        "title": "05 — Payments Operations",
        "meta": "<strong>UID</strong>: <code>facil-payments</code> · <strong>Audiencia</strong>: Operaciones de tesorería · <strong>Filtros</strong>: Estado, Entidad, Sede",
        "note": "Captura no tomada en el momento de la redacción — estructura de datos idéntica a <code>v_treasury_payments_by_site</code>; visual idéntico al panel 01 con énfasis en el estado operativo.",
        "kpi": {
          "pending": "Validación pendiente", "pending_dec": "Alerta de backlog",
          "gap": "Brecha de conciliación", "gap_dec": "Seguimiento de auditoría",
          "failed": "Pagos fallidos", "failed_dec": "Seguimiento de problemas del proveedor"
        }
      },
      "sr": {
        "title": "06 — Service Requests",
        "meta": "<strong>UID</strong>: <code>facil-service-requests</code> · <strong>Audiencia</strong>: Agente ministerial · <strong>Filtros</strong>: Flujo, Entidad, Sede",
        "body": "Solicitudes de servicio activas con <strong>buckets de edad</strong> (0-24h, 24-72h, 3-7d, 7d+) para seguimiento SLA. El desglose de estado muestra la etapa cuello de botella del flujo.",
        "kpi": {
          "active": "SR activas", "active_dec": "Volumen de backlog",
          "age": "Buckets de edad", "age_dec": "Disparador de escalada SLA",
          "status": "Mix de estados", "status_dec": "Identificación de cuello de botella"
        }
      },
      "ua": {
        "title": "07 — User Activity (Auditoría)",
        "meta": "<strong>UID</strong>: <code>facil-user-activity</code> · <strong>Audiencia</strong>: Seguridad & Dirección · <strong>Filtros</strong>: Canal, Rol, Categoría de acción",
        "body": "Construido sobre <code>v_user_activity_audit</code> que canonicaliza 3.342+ eventos de audit_logs con detección de canal (móvil/web/inspector) vía regex de user-agent y mapeo de action_category."
      },
      "channel": {
        "title": "08 — Móvil vs Web vs Inspector",
        "meta": "<strong>UID</strong>: <code>facil-channel</code> · <strong>Audiencia</strong>: Dirección & Producto · <strong>Filtros</strong>: Flujo, Entidad",
        "body": "Sigue la adopción de la app móvil ciudadano y la app inspector vs el acceso web tradicional. Clave para la estrategia de producto: dónde invertir el esfuerzo UX."
      },
      "insp": {
        "title": "09 — Inspecciones (campo)",
        "meta": "<strong>UID</strong>: <code>facil-inspections</code> · <strong>Audiencia</strong>: Inspector jefe · <strong>Filtros</strong>: Entidad, Ciudad, Resultado",
        "body": "Actualmente muestra « No data » en la mayoría de tarjetas porque <code>field_inspections</code> está vacía en producción hasta que la app móvil inspector capture sus primeros informes. El esquema está listo, todos los KPIs y filtros están cableados, y <code>noValue: \"0\"</code> garantiza que no haya errores parásitos."
      }
    },
    "patterns": {
      "A_title": "Patrón A — Resolución multi-fuente (COALESCE de 4 pasos)",
      "A_body": "Cuando una dimensión puede derivarse de múltiples fuentes con prioridad, nunca elegir una arbitrariamente — fallback en orden de prioridad con pista de auditoría. Este patrón resolvió el problema « todos los agentes en Malabo » donde los ingresos de inspecciones de campo en Bata se atribuían erróneamente a la sede del agente validador.",
      "B_title": "Patrón B — Clasificador JSONB (gestionado por admin, sin redespliegue)",
      "B_body": "El clasificador OMS (<code>workflow_codes ? 'BUNDLE_PAYMENT'</code>) vive en la tabla <code>entities</code> como un array JSONB. Los admins toggle el estado OMS desde la UI; los paneles recalculan instantáneamente. Sin cambio de código, sin migración. Fuente única de verdad.",
      "C_title": "Patrón C — Variables de plantilla encadenadas",
      "C_body": "Los filtros se encadenan vía <code>refresh: 1</code> en cada variable: ministerio → entidad → sede las consultas de población dependen de la selección upstream. La <strong>consulta de población</strong> para el filtro Sede debe ser el catálogo (<code>v_entity_locations_browse</code>), no la tabla de hechos — de lo contrario las sedes sin datos se vuelven invisibles.",
      "D_title": "Patrón D — Primitivas Grafana engine-agnostic",
      "D_body": "Tres primitivas del lado Grafana aparecen en los 10 paneles y funcionarían en MySQL / BigQuery / Snowflake / SQL Server sin cambios (verificado en nuestro <code>GRAFANA_DASHBOARDS_AGENT.md</code> v1.1 reutilizable):",
      "D": {
        "sqlstring": "<code>${var:sqlstring}</code> — la <em>única</em> forma de manejar multi-select « All ». Nunca <code>'$var' = 'All' OR ...</code>.",
        "currency": "<code>\"unit\": \"currency:XAF\"</code> — el prefijo <code>currency:</code> dispara la visualización ISO. Sin él, obtienes un literal « currencyXAF ».",
        "novalue": "<code>\"noValue\": \"0\"</code> — en paneles stat, NULL se vuelve « No data ». Esto fuerza un 0 limpio."
      }
    },
    "stack": {
      "row": {
        "hosting": "Hosting", "hosting_val": "Grafana Cloud Free Tier (<code>kouemousah.grafana.net</code>)",
        "datasource": "Datasource", "datasource_val": "Pooler Postgres IPv4 (<code>aws-0-eu-west-3.pooler.supabase.com:6543</code>)",
        "bi": "Rol BI", "bi_val": "<code>looker_readonly</code> (solo lectura en vistas enriquecidas + MVs)",
        "dac": "Dashboards-as-code", "dac_val": "10 archivos JSON en <code>infra/grafana/dashboards/</code>",
        "push": "Script de push", "push_val": "<code>packages/backend/scripts/push_grafana_dashboards.py</code> (push API idempotente)",
        "prov": "YAML de provisioning", "prov_val": "<code>infra/grafana/provisioning/{datasources,dashboards}/</code> (para self-hosted)",
        "refresh": "Auto-refresh", "refresh_val": "5 min por defecto por panel",
        "embed": "Embed en admin Facil", "embed_val": "URL <code>d-solo</code> + <code>kiosk=tv</code> vía <code>DashboardConfigService._build_grafana_embed_url()</code>",
        "token": "Rotación de token", "token_val": "Expiración de 7 días en la cuenta de servicio <code>facil-deployer</code>"
      },
      "agent_title": "Agente reutilizable",
      "agent_body": "El trabajo se destiló en <code>infra/grafana/GRAFANA_DASHBOARDS_AGENT.md</code> — un agente reproducible de 8 fases invocable vía la slash-command <code>/grafana-dashboards</code>. La v1.1 añadió un adapter multi-engine (Postgres / MySQL / BigQuery / Snowflake / SQL Server) para que el mismo agente funcione en cualquier proyecto. 10 salvaguardas activas neutralizan las debilidades conocidas (trampa del pooler IPv4, formato de moneda, variables de plantilla, fuga de token, rollback faltante, etc.)."
    },
    "limits": {
      "title": "Límites conocidos (honestos)",
      "rls": "<strong>Sin seguridad a nivel de fila (RLS) en Grafana</strong> — cualquiera con la URL embed puede ver el panel. Mitigación: gate de permiso en la capa wrapper aplicativo (<code>dashboards.view_business</code>). Para RLS real, conector comunitario OAUTH2 planificado (Fase B.2).",
      "seed": "<strong>Los datos seed tienen todos los agentes en Malabo</strong> — la distribución por sede depende de los perfiles de agentes en producción poblando <code>entity_location_id</code>.",
      "empty": "<strong>Panel Inspecciones vacío</strong> — legítimamente, hasta que la app móvil inspector capture informes de campo.",
      "token": "<strong>Rotación de token</strong> — manual cada 7 días. Automatizar vía Cloud Scheduler + API service account.",
      "screenshot": "<strong>Captura 05 Payments faltante</strong> al momento de redactar este doc — el panel está en vivo; captura pendiente."
    },
    "lineage": {
      "title": "Linaje de datos (audit-ready)",
      "intro": "Cada panel puede rastrearse a través del stack:"
    },
    "roadmap": {
      "title": "Roadmap",
      "s1": "<strong>Q3 2026</strong>: conector comunitario OAUTH2 para verdadero RLS multi-tenant.",
      "s2": "<strong>Q3 2026</strong>: alertas en umbral de ingresos + breach SLA (Grafana nativo, push a Slack).",
      "s3": "<strong>Q4 2026</strong>: paneles deep-dive por ministerio (1 por ministerio, actualmente agregado).",
      "s4": "<strong>Q4 2026</strong>: detección de anomalías en actividad de usuario (audit log) vía plugin Grafana ML."
    },
    "related": {
      "title": "Documentación relacionada",
      "arch": "<a href=\"architecture.html\">Arquitectura del sistema</a> — visión general backend / capa de datos",
      "db": "<a href=\"database.html\">Esquema de base de datos</a> — referencia completa de tablas (145 tablas)",
      "readme": "<code>infra/grafana/README.md</code> — referencia provisioning + script de push",
      "agent": "<code>infra/grafana/GRAFANA_DASHBOARDS_AGENT.md</code> — agente reutilizable de 8 fases"
    }
  }
}
;
