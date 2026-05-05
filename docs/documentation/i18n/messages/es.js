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
  }
}
;
