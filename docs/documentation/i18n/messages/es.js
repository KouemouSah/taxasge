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
  }
}
;
