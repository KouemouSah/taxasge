/**
 * Manual de usuario Facil — Traducciones ES (idioma fuente)
 * ----------------------------------------------------------
 * Convenciones:
 *   - Idioma fuente: español. Phase 9 traduce a FR y EN desde aquí.
 *   - Estructura: namespaces (common, nav, glossary, pageNN.*).
 *   - Cada página añade UN bloque pageNN.* — NO modifica common.*
 *     (común a todas las páginas, edición coordinada).
 *   - Cadenas con HTML (links, <strong>, <code>) van con `data-i18n-html`
 *     desde HTML.
 */
window.__I18N__ = window.__I18N__ || {};
window.__I18N__.es = {

  // ====================================================================
  // COMÚN — usado en TODAS las páginas. Editar con cuidado.
  // ====================================================================
  "common": {
    "brand": "Facil",
    "tagline": "La plataforma digital de la Función Pública en Guinea Ecuatorial",
    "sidebar": {
      "subtitle": "Manual de usuario",
      "toggle_label": "Alternar navegación",
      "footer": "Facil v1.1.8 · Manual mayo 2026"
    },
    "toc": {
      "title": "En esta página"
    },
    "callout": {
      "tip": "Consejo",
      "info": "Información",
      "warning": "Atención",
      "danger": "Importante",
      "success": "Bien hecho"
    },
    "platform": {
      "web": "Web",
      "mobile": "Móvil"
    },
    "persona": {
      "label": "Para:",
      "citizen": "Ciudadano",
      "business": "Empresa",
      "accountant": "Contable",
      "agent": "Agente",
      "supervisor": "Supervisor",
      "admin": "Administrador",
      "public": "Público (sin sesión)"
    },
    "nav": {
      "previous": "← Anterior",
      "next": "Siguiente →",
      "back_to_top": "Volver arriba",
      "home": "Inicio"
    },
    "print": {
      "button": "Imprimir",
      "label": "Imprimir o exportar a PDF"
    },
    "footer": {
      "copyright": "Plataforma Facil · © 2026"
    },
    "search": {
      "placeholder": "Buscar en el manual...",
      "no_results": "No se encontraron resultados",
      "results_count": "resultados"
    }
  },

  // ====================================================================
  // NAVEGACIÓN — sidebar links, agrupados por persona / sección
  // ====================================================================
  "nav": {
    "section": {
      "intro": "Introducción",
      "public": "Acceso público",
      "account": "Su cuenta",
      "citizen_web": "Ciudadano · Web",
      "citizen_mobile": "Ciudadano · Móvil",
      "business": "Empresas y contables",
      "agent": "Agentes públicos",
      "supervisor": "Supervisores",
      "admin": "Administradores",
      "annexes": "Anexos"
    },
    "link": {
      "home": "Inicio",
      "welcome": "Bienvenida",
      "quick_start": "Acceso rápido",
      "navigation": "Navegación",
      "create_account": "Crear cuenta",
      "sign_in": "Iniciar sesión",
      "recover_password": "Recuperar contraseña",
      "two_factor": "Autenticación 2FA",
      "profile": "Su perfil",
      "security": "Seguridad",
      "delete_account": "Eliminar cuenta",
      "explore_services": "Explorar servicios",
      "calculator": "Calculadora fiscal",
      "directory": "Directorio de empresas",
      "license_simulator": "Simulador de licencias",
      "ai_assistant_public": "Asistente IA (público)",
      "guide": "Guía",
      "verify": "Verificar un recibo",
      "legal": "Información legal",
      "contact": "Contacto",
      "dashboard_web": "Panel principal (Web)",
      "start_request_web": "Iniciar trámite (Web)",
      "my_requests_web": "Mis solicitudes (Web)",
      "my_payments_web": "Mis pagos (Web)",
      "my_documents_web": "Mis documentos (Web)",
      "bundle_payment": "Pago agrupado",
      "my_companies_web": "Mis empresas (Web)",
      "notifications_web": "Notificaciones (Web)",
      "support_web": "Soporte (Web)",
      "dashboard_mobile": "Panel principal (Móvil)",
      "start_request_mobile": "Iniciar trámite (Móvil)",
      "my_requests_mobile": "Mis solicitudes (Móvil)",
      "my_payments_mobile": "Mis pagos (Móvil)",
      "my_documents_mobile": "Mis documentos (Móvil)",
      "my_companies_mobile": "Mis empresas (Móvil)",
      "ai_assistant_mobile": "Asistente IA (Móvil)",
      "support_mobile": "Soporte (Móvil)",
      "mobile_exclusive": "Funciones exclusivas móvil",
      "business_role": "Rol Empresa",
      "manage_companies": "Gestionar empresas",
      "batch_requests": "Solicitudes en lote",
      "accountant_role": "Rol Contable",
      "agent_role": "Rol Agente",
      "agent_cnedoge": "Agente CNEDOGE",
      "agent_dgt": "Agente DGT",
      "agent_ayuntamiento": "Agente Ayuntamiento y Cámara",
      "agent_tesoro": "Agente Tesoro",
      "agent_oms": "Agente MIN OMS",
      "agent_extranjeria": "Agente Extranjería",
      "verify_functions": "Funciones de verificación",
      "field_work": "Trabajo de campo OMS",
      "ai_assistant_agent": "Asistente IA agente",
      "supervisor_role": "Rol Supervisor",
      "supervisor_tesoro": "Supervisor Tesoro",
      "supervisor_ayu_camara": "Supervisor Ayuntamiento+Cámara",
      "supervisor_inspections": "Supervisión de inspecciones",
      "admin_role": "Rol Administrador",
      "admin_users_roles": "Usuarios y roles",
      "admin_services": "Catálogo de servicios",
      "admin_communications": "Comunicaciones",
      "admin_companies": "Empresas (admin)",
      "admin_system_config": "Configuración del sistema",
      "admin_audit_logs": "Registros de auditoría",
      "admin_translations": "Traducciones",
      "admin_workflow_config": "Configuración de flujos",
      "glossary": "Glosario",
      "faq": "Preguntas frecuentes",
      "troubleshooting": "Resolución de problemas",
      "changelog": "Historial de cambios"
    },
    "breadcrumb": {
      "home": "Inicio",
      "section": "Sección",
      "current": "Esta página"
    }
  },

  // ====================================================================
  // INDEX — landing page
  // ====================================================================
  "indexpage": {
    "html_title": "Manual de usuario Facil",
    "title": "Manual de usuario Facil",
    "description": "Guía completa de uso de la plataforma Facil — versiones Web y Móvil, para todos los perfiles de usuario.",
    "hero": {
      "subtitle": "Versión 1.1.8 · Mayo 2026",
      "lead": "Encuentre rápidamente la sección que le concierne según su perfil y la plataforma que utiliza.",
      "cta_explore": "Explorar secciones",
      "cta_search": "Buscar en el manual"
    },
    "stats": {
      "pages": "Páginas",
      "languages": "Idiomas",
      "personas": "Perfiles",
      "platforms": "Plataformas"
    },
    "personas": {
      "title": "Encontrar mi perfil",
      "intro": "Cada perfil tiene un recorrido distinto en Facil. Seleccione el suyo para ir directamente a las páginas que le conciernen.",
      "citizen": {
        "title": "Ciudadano",
        "description": "Particular que realiza trámites administrativos para sí mismo (pasaporte, conducir, residencia, IRPF...)."
      },
      "business": {
        "title": "Representante de empresa",
        "description": "Persona que representa o gestiona una o más empresas (licencias comerciales, IVA, IS, obligaciones)."
      },
      "accountant": {
        "title": "Contable",
        "description": "Profesional contable que gestiona declaraciones fiscales y trámites para múltiples clientes."
      },
      "agent": {
        "title": "Agente público",
        "description": "Funcionario o agente de un ministerio (CNEDOGE, DGT, Tesoro, Extranjería, Ayuntamiento, Cámara, MIN OMS) que valida solicitudes."
      },
      "supervisor": {
        "title": "Supervisor",
        "description": "Responsable de un equipo de agentes, gestiona escaladas, reparto de trabajo y desempeño."
      },
      "admin": {
        "title": "Administrador",
        "description": "Administrador técnico de la plataforma — usuarios, roles, catálogo, comunicaciones, configuración."
      },
      "public": {
        "title": "Visitante (sin cuenta)",
        "description": "Persona sin cuenta que solo consulta servicios, calculadora, simulador o verifica un recibo."
      }
    },
    "platforms": {
      "title": "Web vs Móvil",
      "intro": "Facil se utiliza tanto en navegador como en aplicación móvil Android/iOS. Cada plataforma cubre casos de uso ligeramente diferentes.",
      "web": {
        "title": "Versión Web",
        "description": "Acceso completo: ciudadanos, empresas, contables, agentes, supervisores, administradores. Pantalla completa, dashboards detallados.",
        "url": "https://facil.gov.gq"
      },
      "mobile": {
        "title": "Aplicación Móvil",
        "description": "Optimizada para ciudadanos y empresas en movilidad. Notificaciones push, biometría, modo sin conexión, escaneo QR.",
        "url": "Google Play / App Store"
      }
    },
    "quick_start": {
      "title": "Acceso rápido",
      "intro": "¿Primera vez con Facil? Aquí están las páginas esenciales para empezar:",
      "items": {
        "create": "Crear su cuenta",
        "first_request": "Realizar su primera solicitud",
        "first_payment": "Pagar de manera segura",
        "track": "Hacer seguimiento de sus expedientes",
        "verify": "Verificar la autenticidad de un recibo"
      }
    },
    "footer": "Plataforma Facil · Manual de usuario v1.1.8 · © 2026 República de Guinea Ecuatorial"
  },

  // ====================================================================
  // PÁGINAS DE SECCIONES — añadidas en cada Phase. Espacio reservado:
  // ====================================================================
  // page01: Welcome (Phase 1)
  // page11-17: Account & auth (Phase 3)
  // page21-29: Citizen Web (Phase 4)
  // page31-39: Citizen Mobile (Phase 5)
  // page41-44: Business & Accountant (Phase 6)
  // page51-58: Public pages (Phase 2)
  // page61-69: Agents (Phase 7)
  // page71-74: Supervisors (Phase 8)
  // page81-89: Admin (Phase 8)
  // page91-95: Annexes (Phase 10)

};
