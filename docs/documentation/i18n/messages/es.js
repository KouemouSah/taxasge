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
      "body1": "<strong>Facil</strong> es una plataforma integral de servicios gubernamentales digitales diseñada para la República de Guinea Ecuatorial. Permite a ciudadanos, empresas y contables gestionar sus obligaciones fiscales, solicitar documentos civiles e interactuar con las agencias gubernamentales totalmente en línea.",
      "body2": "La plataforma sirve a múltiples entidades gubernamentales incluyendo la Direccion General de Impuestos (DGI), CNEDOGE (servicios de pasaporte), Direccion General de Trafico (DGT), Extranjeria (inmigración), Ayuntamiento (servicios municipales), Camara de Comercio y diversos ministerios."
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
        "cicd": "CI/CD", "cicd_purpose": "8 archivos workflow (CI, deploy, build)"
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
  }
}
;
