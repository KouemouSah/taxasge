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
      "web_public_view": "Vista Web del sitio público",
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
      "agent_oms": "Agente OMS (Obligaciones)",
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
        "url": "https://taxasge.emacsah.com"
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
    "footer": "Plataforma Facil · Manual de usuario v1.1.8 · © 2026 República de Guinea Ecuatorial",
    "footer_links": {
      "tech_docs": "Documentación técnica"
    }
  },

  // ====================================================================
  // SEARCH PAGE
  // ====================================================================
  "searchpage": {
    "html_title": "Buscar — Manual Facil",
    "title": "Buscar en el manual",
    "description": "Encuentre rápidamente la información que necesita en las 62 páginas del manual.",
    "breadcrumb": "Buscar",
    "info": "La búsqueda funciona en las 3 idiomas. Si no encuentra una página, intente navegar mediante el menú lateral o el sumario de la página de inicio."
  },

  // ====================================================================
  // 404 PAGE
  // ====================================================================
  "errorpage": {
    "html_title": "404 — Manual Facil",
    "message": "Página no encontrada",
    "description": "La página que busca no existe o ha sido movida. Vuelva al inicio o utilice la búsqueda.",
    "back_home": "Volver al inicio",
    "search": "Buscar"
  },

  // ====================================================================
  // PÁGINAS DE SECCIONES
  // ====================================================================

  // ---- page01 — Bienvenida + Onboarding (Phase 1 fix) ----
  "page01": {
    "html_title": "Bienvenida — Manual Facil",
    "title": "Bienvenida a Facil",
    "description": "La primera pantalla que ve cuando abre Facil — versión Web o aplicación Móvil. Esta página describe cada elemento de la bienvenida, los pasos del onboarding (primera instalación móvil) y las acciones disponibles sin necesidad de iniciar sesión.",
    "next": "Siguiente: Explorar servicios →",
    "prev": "← Anterior: Inicio del manual",
    "toc": {
      "s1": "2. La pantalla de inicio",
      "s2": "3. El carrusel de novedades",
      "s3": "4. Las 4 acciones principales",
      "s4": "1. Onboarding móvil (primera instalación)",
      "s5": "5. Explorar sin cuenta o iniciar sesión",
      "s6": "6. Diferencias Web vs Móvil"
    },
    "s1": {
      "title": "2. La pantalla de inicio",
      "intro": "Cuando abre <strong>Facil</strong> sin haber iniciado sesión — ya sea desde un navegador en <code>taxasge.emacsah.com</code> o desde la aplicación móvil — accede a la pantalla de bienvenida pública. Esta pantalla está disponible <strong>en español, francés e inglés</strong>: el selector de idioma está en la cabecera (ES / FR / EN).",
      "body": "La pantalla está estructurada en 4 zonas principales:",
      "zone1": "<strong>Banner principal (hero)</strong> — eslogan «Nada más fácil para servirle», con el logo Facil y el escudo de la República de Guinea Ecuatorial.",
      "zone2": "<strong>4 tarjetas de acción</strong> — accesos rápidos a Servicios, Licencias, Empresas y Calculadora. Cada tarjeta lleva directamente a su sección.",
      "zone3": "<strong>Cabecera con menú</strong> — selector de idioma, accesos rápidos (Servicios, Licencias, Directorio, Ministerios, Calculadora, Guía, Asistente IA).",
      "zone4": "<strong>Botones de cuenta</strong> — «Crear cuenta» (rojo) e «Iniciar sesión» (azul) en la parte inferior, claramente visibles.",
      "fig1": {
        "alt": "Pantalla de bienvenida en español",
        "caption": "Pantalla de inicio en versión móvil (idioma español). Selector ES/FR/EN arriba, banner hero, 4 tarjetas de acceso rápido, botones Crear cuenta / Iniciar sesión abajo."
      }
    },
    "s2": {
      "title": "3. El carrusel de novedades",
      "intro": "La pantalla de bienvenida incluye un <strong>carrusel</strong> de varias diapositivas que destaca las funcionalidades clave de Facil. Las diapositivas pasan automáticamente cada 5 segundos, o usted puede pasar manualmente con un deslizamiento.",
      "slide1": {
        "title": "Diapositiva 1 — Bienvenida general",
        "body": "Presentación principal con eslogan «Nada más fácil para servirle» y las 4 tarjetas de acción."
      },
      "slide2": {
        "title": "Diapositiva 2 — Asistente IA",
        "body": "Banner azul que destaca el <strong>Asistente IA fiscal</strong>: «Pregunte a nuestro asistente IA sobre los trámites en Guinea Ecuatorial — disponible 24/7». Las 4 tarjetas de acción siguen visibles debajo."
      },
      "fig1": {
        "alt": "Carrusel diapositiva 2 - Asistente IA",
        "caption": "Diapositiva 2 del carrusel — banner del Asistente IA fiscal disponible 24/7 (capturada en versión francesa, comportamiento idéntico en español)."
      }
    },
    "s3": {
      "title": "4. Las 4 acciones principales",
      "intro": "Desde la pantalla de bienvenida, 4 tarjetas le dan acceso directo a las funciones más utilizadas — sin necesidad de iniciar sesión:",
      "table": {
        "col1": "Tarjeta", "col2": "Para qué sirve", "col3": "Página manual",
        "r1": { "c1": "Servicios", "c2": "Catálogo completo de los 873 servicios fiscales y administrativos disponibles, agrupados por entidad." },
        "r2": { "c1": "Licencias", "c2": "Simulador de tarifas para licencias comerciales (3 etapas: tipo de comercio, zona, resultado)." },
        "r3": { "c1": "Empresas", "c2": "Directorio público de empresas registradas con su clasificación tier (A1, B2, C1, D1...)." },
        "r4": { "c1": "Calculadora", "c2": "Calculadora fiscal con 4 pestañas: IRPF (impuesto sobre la renta), IVA (impuesto sobre el valor añadido), IS (impuesto de sociedades), Servicios fiscales." }
      },
      "tip": "Pulse cualquier tarjeta para descubrir la sección. Puede regresar a la pantalla de bienvenida en cualquier momento desde el botón «Inicio» de la cabecera."
    },
    "s4": {
      "title": "1. Onboarding móvil (primera instalación)",
      "intro": "La <strong>primera vez</strong> que abre la aplicación móvil Facil después de instalarla, accede a una pantalla de presentación en 3 diapositivas (onboarding) antes de ver la pantalla de bienvenida estándar. Estas diapositivas explican rápidamente las ventajas de Facil.",
      "slide1": {
        "title": "Diapositiva 1 — Bienvenida",
        "body": "Ilustración de un robot conversacional, mensaje «Bienvenido a FACIL — La plataforma digital de los procedimientos administrativos». Botones <strong>«Saltar»</strong> y <strong>flecha siguiente»</strong> en la parte inferior."
      },
      "fig1": {
        "alt": "Onboarding diapositiva 1",
        "caption": "Onboarding diapositiva 1/3 — Bienvenida con ilustración del asistente."
      },
      "slide2": {
        "title": "Diapositiva 2 — Inteligente y seguro",
        "body": "Fondo rojo con ilustración de una mujer y un smartphone, mensaje «Inteligente y Seguro — Asistente IA + Seguridad reforzada». Mención de la <strong>autenticación 2FA</strong> y del <strong>cifrado de datos</strong>."
      },
      "fig2": {
        "alt": "Onboarding diapositiva 2",
        "caption": "Onboarding diapositiva 2/3 — Mensaje sobre la inteligencia (IA) y la seguridad (2FA, cifrado)."
      },
      "slide3": {
        "title": "Diapositiva 3 — Final con elección",
        "body": "Fondo naranja con ilustración de un cohete, mensaje «Comience ahora — Todo en un solo lugar». 3 enlaces para elegir su próxima acción :",
        "option1": "<strong>Explorar sin cuenta</strong> — accede directamente a la pantalla de bienvenida estándar (servicios, licencias, calculadora) sin iniciar sesión.",
        "option2": "<strong>Crear una cuenta</strong> — si es la primera vez en Facil.",
        "option3": "<strong>Iniciar sesión</strong> — si ya tiene una cuenta."
      },
      "fig3": {
        "alt": "Onboarding diapositiva 3",
        "caption": "Onboarding diapositiva 3/3 — Pantalla final con 3 opciones de inicio."
      },
      "warning": "<strong>Limitación conocida</strong>: actualmente las 3 diapositivas de onboarding muestran el texto en francés incluso si su teléfono está configurado en español o inglés. Es un bug de internacionalización conocido (la pantalla cargaba siempre el archivo francés). El comportamiento de los botones es idéntico en todos los idiomas. Esto se corregirá en una versión futura.",
      "info": "El onboarding solo se muestra en la primera apertura de la aplicación móvil. Después, la aplicación abre directamente la pantalla de bienvenida estándar (Sección 1). Para volver a ver el onboarding, hay que desinstalar y reinstalar la aplicación."
    },
    "s5": {
      "title": "5. Explorar sin cuenta o iniciar sesión",
      "intro": "Desde la pantalla de bienvenida, tiene 3 opciones:",
      "table": {
        "col1": "Opción", "col2": "Cuándo elegirla", "col3": "Limitaciones",
        "r1": { "c1": "Explorar sin cuenta", "c2": "Quiere consultar los servicios, simular una tarifa, usar la calculadora o verificar un recibo — sin compromiso.", "c3": "No puede iniciar trámites, no puede subir documentos, no recibe notificaciones." },
        "r2": { "c1": "Crear una cuenta", "c2": "Es la primera vez que utiliza Facil y quiere realizar un trámite real.", "c3": "Necesita una dirección de correo electrónico válida y un teléfono móvil para verificación." },
        "r3": { "c1": "Iniciar sesión", "c2": "Ya tiene una cuenta Facil.", "c3": "Si olvidó su contraseña, use el enlace «¿Contraseña olvidada?» en la pantalla de inicio de sesión." }
      },
      "cta": "Las páginas dedicadas: <a href=\"11-crear-cuenta.html\" class=\"coming-soon\">Crear cuenta</a>, <a href=\"12-iniciar-sesion.html\" class=\"coming-soon\">Iniciar sesión</a>."
    },
    "s6": {
      "title": "6. Diferencias Web vs Móvil en la bienvenida",
      "intro": "Las dos versiones ofrecen acceso al mismo contenido pero presentan algunas diferencias en la pantalla de bienvenida:",
      "table": {
        "col1": "Elemento", "col2": "Web (navegador)", "col3": "Aplicación Móvil",
        "r1": { "c1": "Pantalla de bienvenida con carrusel" },
        "r2": { "c1": "4 tarjetas de acción" },
        "r3": { "c1": "Selector ES / FR / EN" },
        "r4": { "c1": "Onboarding 3 diapositivas (primera vez)" },
        "r5": { "c1": "Notificaciones push", "c3": "✅ (después del inicio de sesión)" },
        "r6": { "c1": "Identificación biométrica", "c3": "✅ (después del inicio de sesión)" },
        "r7": { "c1": "Modo sin conexión", "c3": "✅ (caché de las últimas páginas vistas)" }
      },
      "success": "Ya conoce la pantalla de bienvenida. Para profundizar, consulte las páginas <a href=\"51-explorar-servicios.html\">Explorar servicios</a> o <a href=\"11-crear-cuenta.html\" class=\"coming-soon\">Crear cuenta</a> según lo que quiera hacer a continuación."
    }
  },

  // ---- page51 — Explorar servicios (Phase 1 pilote) ----
  "page51": {
    "html_title": "Explorar servicios — Manual Facil",
    "title": "Explorar el catálogo de servicios",
    "description": "Descubra los 873 servicios fiscales y administrativos disponibles en Facil — sin necesidad de iniciar sesión. Filtre por ministerio, busque por palabra clave y consulte los detalles de cada trámite.",
    "next": "Siguiente: Calculadora fiscal →",
    "toc": {
      "s1": "1. ¿Qué es el catálogo de servicios?",
      "s2": "2. Acceder al catálogo",
      "s3": "3. Buscar y filtrar",
      "s4": "4. Detalle de un servicio",
      "s5": "5. Iniciar el trámite",
      "s6": "6. Diferencias Web y Móvil"
    },
    "s1": {
      "title": "1. ¿Qué es el catálogo de servicios?",
      "intro": "Facil reúne en un solo lugar <strong>873 servicios fiscales y administrativos</strong> ofrecidos por <strong>20 entidades gubernamentales</strong> de la República de Guinea Ecuatorial. Cada servicio incluye la información completa que necesita: documentos requeridos, procedimientos, tarifas oficiales, plazos y entidad emisora.",
      "callout": "No es necesario crear una cuenta para explorar el catálogo. Solo deberá iniciar sesión cuando quiera realizar un trámite real.",
      "stats": {
        "services": "Servicios",
        "entities": "Entidades",
        "ministries": "Ministerios",
        "languages": "Idiomas"
      }
    },
    "s2": {
      "title": "2. Acceder al catálogo",
      "intro": "El acceso al catálogo es público y se hace en pocos pasos:",
      "step1": "Abra <strong>taxasge.emacsah.com</strong> en su navegador (versión Web) o la aplicación <strong>Facil</strong> en su teléfono (versión Móvil).",
      "step2": "En la pantalla de inicio, pulse la tarjeta <strong>«Servicios»</strong>.",
      "step3": "Se mostrará la lista completa de los 873 servicios disponibles, agrupados por entidad.",
      "fig1": {
        "alt": "Catálogo de servicios en vista cuadrícula",
        "caption": "Catálogo en vista cuadrícula — pantalla de bienvenida con las 20 entidades disponibles."
      }
    },
    "s3": {
      "title": "3. Buscar y filtrar",
      "intro": "Para encontrar rápidamente un servicio entre los 873 disponibles, dispone de tres herramientas combinables:",
      "search": {
        "title": "Búsqueda por palabra clave",
        "body": "En la barra superior, escriba el nombre del trámite que busca (ejemplo: <em>«pasaporte»</em>, <em>«licencia comercial»</em>, <em>«IRPF»</em>). La búsqueda funciona por sinónimos: <em>«conducir»</em> también encontrará <em>«permis de conduire»</em>."
      },
      "org": {
        "title": "Filtro por entidad",
        "body": "Pulse el nombre de una entidad (CNEDOGE, DGT, Tesoro, Extranjería, Ayuntamiento, Cámara, etc.) para mostrar únicamente los servicios que ofrece."
      },
      "view": {
        "title": "Vista en cuadrícula o en lista",
        "body": "Puede alternar entre vista en cuadrícula (más visual) y vista en lista (más compacta) mediante los botones de la esquina superior derecha."
      },
      "fig1": {
        "alt": "Filtro por ministerio activo",
        "caption": "Filtro «Ministerio de Asuntos Exteriores» activo — solo se muestran los 14 servicios de esta entidad."
      },
      "fig2": {
        "alt": "Vista en lista compacta",
        "caption": "Vista en lista — más servicios visibles por pantalla, ideal cuando ya conoce el nombre del trámite."
      }
    },
    "s4": {
      "title": "4. Detalle de un servicio",
      "intro": "Pulse cualquier servicio en la lista para abrir su ficha detallada. Cada ficha contiene 5 secciones:",
      "table": {
        "col1": "Sección",
        "col2": "Contenido",
        "r1": { "c1": "Título y entidad", "c2": "Nombre oficial del servicio + ministerio o entidad emisora" },
        "r2": { "c1": "Descripción", "c2": "Para qué sirve el trámite, en qué casos solicitarlo" },
        "r3": { "c1": "Documentos requeridos", "c2": "Lista exhaustiva de los documentos a aportar (originales y copias)" },
        "r4": { "c1": "Procedimientos", "c2": "Pasos a seguir, en orden, con indicación del lugar y plazo de cada uno" },
        "r5": { "c1": "Tarifa", "c2": "Coste oficial en XAF (Franco CFA), incluyendo desglose si procede" },
        "r6": { "c1": "Servicios relacionados", "c2": "Otros trámites complementarios que podría necesitar al mismo tiempo" }
      },
      "fig1": {
        "alt": "Detalle del servicio Pasaporte",
        "caption": "Ejemplo: ficha de «Adquisición formulario pasaporte» — documentos, procedimiento en 4 pasos, servicios asociados, botón «Iniciar la demanda»."
      },
      "tip": "Antes de iniciar un trámite, lea cuidadosamente la sección <strong>«Documentos requeridos»</strong>: tener todos los documentos preparados desde el principio le ahorrará viajes y demoras."
    },
    "s5": {
      "title": "5. Iniciar el trámite",
      "intro": "Una vez consultada la ficha, puede iniciar el trámite pulsando el botón <strong>«Iniciar la demanda»</strong>. Este botón requiere haber iniciado sesión: si aún no tiene cuenta, consulte la página <a href=\"11-crear-cuenta.html\" class=\"coming-soon\">Crear cuenta</a>.",
      "body": "El proceso completo de creación de una solicitud (asistente paso a paso, subida de documentos, pago) se describe detalladamente en las páginas <a href=\"22-iniciar-tramite-web.html\" class=\"coming-soon\">Iniciar trámite (Web)</a> y <a href=\"32-iniciar-tramite-mobile.html\" class=\"coming-soon\">Iniciar trámite (Móvil)</a>."
    },
    "s6": {
      "title": "6. Diferencias Web y Móvil",
      "intro": "Tanto la versión Web como la aplicación Móvil ofrecen acceso completo al catálogo. Los matices:",
      "table": {
        "col1": "Función",
        "col2": "Versión Web",
        "col3": "Versión Móvil",
        "r1": { "c1": "Vista cuadrícula" },
        "r2": { "c1": "Vista lista" },
        "r3": { "c1": "Filtro por entidad" },
        "r4": { "c1": "Búsqueda por palabra clave" },
        "r5": { "c1": "Tabla comparativa de varios servicios" },
        "r6": { "c1": "Compartir un servicio", "c2": "URL copiable", "c3": "Compartir nativo (WhatsApp, SMS...)" },
        "r7": { "c1": "Funcionamiento sin conexión", "c3": "Caché últimos servicios consultados" }
      },
      "success": "Ya conoce las bases para explorar el catálogo. Las páginas siguientes muestran las funciones específicas: calculadora, simulador de licencias, asistente IA."
    }
  },

  // ---- page21 — Dashboard ciudadano Web (Phase 1 pilote) ----
  "page21": {
    "html_title": "Panel principal Web — Manual Facil",
    "title": "Su panel principal en Facil Web",
    "description": "Después de iniciar sesión, llega a su panel principal: el centro neurálgico desde el cual sigue todas sus solicitudes, gestiona sus documentos y accede a los servicios. Esta página describe cada elemento de la pantalla.",
    "next": "Siguiente: Iniciar trámite (Web) →",
    "prev": "← Anterior: Eliminar cuenta",
    "toc": {
      "s1": "1. Acceder al panel",
      "s2": "2. Estructura general",
      "s3": "3. Cartas de estadísticas",
      "s4": "4. Acciones requeridas",
      "s5": "5. Pestañas (Solicitudes, Pagos, Alertas)",
      "s6": "6. Acciones rápidas (sidebar)",
      "s7": "7. Versión móvil equivalente"
    },
    "s1": {
      "title": "1. Acceder al panel",
      "intro": "El panel principal se muestra automáticamente después de <a href=\"12-iniciar-sesion.html\" class=\"coming-soon\">iniciar sesión</a>. Si aún no tiene cuenta, consulte la página <a href=\"11-crear-cuenta.html\" class=\"coming-soon\">Crear cuenta</a>.",
      "url": "URL directa: <code>https://taxasge.emacsah.com/dashboard</code> (redirige al inicio de sesión si no está autenticado)."
    },
    "s2": {
      "title": "2. Estructura general de la pantalla",
      "intro": "El panel se divide en 3 zonas principales:",
      "zone1": "<strong>Menú lateral izquierdo</strong> — todas las secciones disponibles para usted (Resumen, Solicitudes, Documentos, Chat, Soporte, Perfil, Configuración). Se mantiene visible en todas las páginas.",
      "zone2": "<strong>Cabecera superior</strong> — contiene el ícono de notificaciones (con un punto rojo si tiene mensajes no leídos), el selector de idioma, y el menú de su perfil.",
      "zone3": "<strong>Zona principal</strong> — muestra el contenido de la sección actual (por defecto: el «Resumen» con sus estadísticas y solicitudes recientes).",
      "fig1": {
        "alt": "Panel principal del ciudadano",
        "caption": "Panel principal — vista «Resumen». Menú lateral a la izquierda, cabecera con notificación arriba, zona central con cartas de estadísticas, banner de acciones requeridas, y pestañas (Solicitudes Recientes / Pagos / Alertas)."
      }
    },
    "s3": {
      "title": "3. Cartas de estadísticas",
      "intro": "En la parte superior de la zona principal, cuatro cartas resumen el estado de su cuenta:",
      "table": {
        "col1": "Carta", "col2": "Significado", "col3": "Acción al pulsarla",
        "r1": { "c1": "Solicitudes activas", "c2": "Trámites iniciados, aún no finalizados (en cualquier estado : borrador, enviada, en proceso, en revisión, en pago, esperando cita).", "c3": "Va a la pestaña «Mis Solicitudes» filtrada en activas." },
        "r2": { "c1": "Solicitudes completadas", "c2": "Trámites finalizados con éxito.", "c3": "Va a «Mis Solicitudes» filtrada en completadas." },
        "r3": { "c1": "Pendientes de acción", "c2": "Solicitudes que esperan algo de usted (pago, documento, confirmación de cita, respuesta a una pregunta del agente).", "c3": "Va a «Mis Solicitudes» filtrada en pendientes — corresponde al banner naranja de «Acciones requeridas»." },
        "r4": { "c1": "Total pagado (XAF)", "c2": "Suma de todos los pagos validados durante el año en curso.", "c3": "Va a «Mis Pagos» con el desglose detallado." }
      },
      "tip": "Las cartas se actualizan en tiempo real. Si paga una solicitud o un agente valida un trámite, el contador se incrementa al instante (puede que necesite recargar la página después de una validación de agente lenta)."
    },
    "s4": {
      "title": "4. Banner «Acciones requeridas»",
      "intro": "Si tiene solicitudes esperando una acción de su parte, un <strong>banner naranja</strong> aparece arriba del panel. Lista cada solicitud bloqueada con su número de referencia (ej : <code>SRV-2026-00001</code>) y el motivo del bloqueo.",
      "types": {
        "title": "Tipos de acciones requeridas",
        "payment": "<strong>Pago pendiente</strong> — debe pagar la tasa antes de que la solicitud pueda procesarse.",
        "docs": "<strong>Documentos faltantes</strong> — el agente le pidió aportar un documento adicional.",
        "appointment": "<strong>Cita por confirmar</strong> — debe seleccionar una fecha de cita.",
        "question": "<strong>Pregunta del agente</strong> — el agente le pidió una aclaración o documento."
      },
      "warning": "Las solicitudes con acciones requeridas pueden tener un plazo. Si no responde en el tiempo establecido, la solicitud puede ser rechazada automáticamente y deberá iniciarla de nuevo (con pérdida del pago si ya estaba realizado en algunos casos)."
    },
    "s5": {
      "title": "5. Pestañas (Solicitudes, Pagos, Alertas)",
      "intro": "Debajo de las cartas de estadísticas, tres pestañas le permiten alternar entre vistas:",
      "req": { "title": "Pestaña «Solicitudes Recientes»", "body": "Muestra sus 10 solicitudes más recientes con: referencia, tipo, estado, fecha de creación, progreso (barra de %). Pulsando una línea, accede al detalle. Para ver todas, vaya a <a href=\"23-mis-solicitudes-web.html\" class=\"coming-soon\">Mis Solicitudes</a>." },
      "pay": { "title": "Pestaña «Pagos»", "body": "Lista los pagos realizados o pendientes, con estado, importe en XAF, método (Dinero Móvil, Tarjeta, Transferencia, Efectivo, Cheque) y referencia. Detalle completo en <a href=\"24-mis-pagos-web.html\" class=\"coming-soon\">Mis Pagos</a>." },
      "alerts": { "title": "Pestaña «Alertas»", "body": "Notificaciones recientes (cambios de estado, mensajes de agentes, alertas de vencimiento de documentos). Pulsando una alerta, accede al elemento concernido." }
    },
    "s6": {
      "title": "6. Acciones rápidas (sidebar)",
      "intro": "El menú lateral izquierdo contiene 8 entradas principales:",
      "table": {
        "col1": "Entrada", "col2": "Función", "col3": "Página manual",
        "r1": { "c1": "Resumen", "c2": "Vista actual (este panel)" },
        "r2": { "c1": "Solicitudes Servicios", "c2": "Lista completa de sus solicitudes" },
        "r3": { "c1": "Solicitudes en Lote", "c2": "Crear varias solicitudes a la vez (Excel)" },
        "r4": { "c1": "Mis Documentos", "c2": "Caja fuerte digital de sus documentos" },
        "r5": { "c1": "Chat Asistente", "c2": "Asistente IA conversacional" },
        "r6": { "c1": "Ayuda / Soporte", "c2": "Crear y consultar tickets de soporte" },
        "r7": { "c1": "Perfil", "c2": "Sus informaciones personales" },
        "r8": { "c1": "Configuración", "c2": "Seguridad (contraseña, 2FA), notificaciones" }
      }
    },
    "s7": {
      "title": "7. Versión móvil equivalente",
      "intro": "La aplicación móvil ofrece un panel similar pero adaptado a la pantalla pequeña. Detalle completo en la página <a href=\"31-dashboard-mobile.html\" class=\"coming-soon\">Panel principal Móvil</a>.",
      "table": {
        "col1": "Función", "col2": "Web", "col3": "Móvil",
        "r1": { "c1": "Cartas de estadísticas (4)" },
        "r2": { "c1": "Banner acciones requeridas" },
        "r3": { "c1": "Pestañas (Solicitudes/Pagos/Alertas)" },
        "r4": { "c1": "Menú lateral persistente", "c3": "❌ (menú hamburguesa)" },
        "r5": { "c1": "Notificaciones push", "c2": "❌ (web push solo)" },
        "r6": { "c1": "Acceso biométrico (huella/cara)" }
      },
      "success": "Ya conoce su panel principal. La siguiente página explica cómo iniciar un nuevo trámite paso a paso."
    }
  },

  "page52": {
    "html_title": "Calculadora fiscal — Manual Facil",
    "title": "Calculadora fiscal",
    "description": "Simule sus impuestos antes de declararlos. La calculadora cubre 4 categorías: IRPF (impuesto sobre la renta de personas físicas), IVA (impuesto sobre el valor añadido), IS (impuesto de sociedades) y servicios fiscales específicos. Sin necesidad de iniciar sesión.",
    "toc": {
      "s1": "1. Acceder a la calculadora",
      "s2": "2. IRPF — Impuesto sobre la renta",
      "s3": "3. IVA — Impuesto sobre el valor añadido",
      "s4": "4. IS — Impuesto de sociedades",
      "s5": "5. Servicios fiscales (formulas)",
      "s6": "6. Limitaciones de la calculadora"
    },
    "s1": {
      "title": "1. Acceder a la calculadora",
      "intro": "Desde la pantalla de bienvenida, pulse la tarjeta <strong>«Calculadora»</strong>. La calculadora se compone de 4 pestañas: IRPF, IVA, IS, Servicios. Cada pestaña le pide los datos necesarios y muestra el cálculo automáticamente.",
      "fig1": {
        "alt": "Calculadora fiscal con 4 pestañas",
        "caption": "Calculadora en versión móvil (idioma español) — pestaña IRPF activa con ingreso ejemplo 200 000 XAF y desglose por tramos."
      }
    },
    "s2": {
      "title": "2. IRPF — Impuesto sobre la renta de personas físicas",
      "intro": "El IRPF se calcula con <strong>6 tramos progresivos</strong>: cuanto mayor es su renta anual, mayor es el tipo aplicable a la parte que supera cada umbral. Solo las cantidades dentro de cada tramo soportan el tipo correspondiente.",
      "brackets": {
        "title": "Tabla oficial de tramos IRPF (Guinea Ecuatorial)",
        "col1": "Tramo",
        "col2": "Renta anual (XAF)",
        "col3": "Tipo",
        "r1": "0 – 1 000 000",
        "r2": "1 000 001 – 3 000 000",
        "r3": "3 000 001 – 5 000 000",
        "r4": "5 000 001 – 10 000 000",
        "r5": "10 000 001 – 15 000 000",
        "r6": "> 15 000 000"
      },
      "example": {
        "title": "Ejemplo de cálculo",
        "intro": "Para una renta anual de <strong>4 000 000 XAF</strong>:",
        "calc": "Tramo 1 (0–1M)         : 1 000 000 × 0%  =       0 XAF\nTramo 2 (1M–3M)        : 2 000 000 × 10% = 200 000 XAF\nTramo 3 (3M–4M parcial):  1 000 000 × 15% = 150 000 XAF\n                                           ─────────\nTOTAL IRPF anual                          = 350 000 XAF\nTipo efectivo                             = 8,75%"
      },
      "tip": "Indique su renta <strong>anual</strong> bruta (no mensual). La calculadora hace automáticamente el cálculo por tramos y le muestra el desglose detallado."
    },
    "s3": {
      "title": "3. IVA — Impuesto sobre el valor añadido",
      "intro": "El IVA es un impuesto <strong>flat al 15%</strong> sobre la mayoría de los bienes y servicios en Guinea Ecuatorial. La calculadora ofrece 2 modos:",
      "mode1": "<strong>Añadir IVA</strong> (precio sin IVA → precio con IVA): <code>precio_con_iva = precio_sin_iva × 1,15</code>",
      "mode2": "<strong>Extraer IVA</strong> (precio con IVA → precio sin IVA): <code>precio_sin_iva = precio_con_iva / 1,15</code>",
      "example": {
        "title": "Ejemplos",
        "calc": "Añadir IVA :  1 000 000 XAF (sin IVA) → 1 150 000 XAF (con IVA), IVA = 150 000\nExtraer IVA : 1 150 000 XAF (con IVA) → 1 000 000 XAF (sin IVA), IVA = 150 000"
      },
      "info": "Algunos productos están <strong>exentos</strong> (productos básicos alimentarios, salud, educación). La calculadora aplica el 15% por defecto — verifique con su contable si su producto/servicio está exento."
    },
    "s4": {
      "title": "4. IS — Impuesto de sociedades",
      "intro": "El IS se aplica al <strong>beneficio neto</strong> de las sociedades a un tipo único de <strong>35%</strong>. Fórmula:",
      "formula": "IS = (Ingresos − Gastos deducibles) × 35%",
      "example": {
        "title": "Ejemplo",
        "calc": "Ingresos          : 50 000 000 XAF\nGastos deducibles : 35 000 000 XAF\n                    ─────────────\nBeneficio neto    : 15 000 000 XAF\nIS (35%)          :  5 250 000 XAF"
      },
      "warning": "La calculadora estima un IS aproximado. La declaración real requiere la contabilidad oficial certificada por un contable autorizado. Existe una <strong>cuota mínima</strong> aplicable incluso en caso de pérdida — consulte con un experto contable."
    },
    "s5": {
      "title": "5. Servicios fiscales (formulas específicas)",
      "intro": "Algunos trámites se calculan con fórmulas específicas, no con un tipo único. Categorías principales:",
      "table": {
        "col1": "Tipo de servicio",
        "col2": "Fórmula",
        "col3": "Ejemplo",
        "r1": { "c1": "Expedición fija", "c3": "Pasaporte = 50 000 XAF" },
        "r2": { "c1": "Renovación fija", "c3": "Renovación carnet = 25 000 XAF" },
        "r3": { "c1": "Porcentaje sobre base", "c3": "Inspección 1% sobre el valor declarado" },
        "r4": { "c1": "Por unidad", "c3": "U folios × 5 000 XAF/folio" },
        "r5": { "c1": "Tarifas escalonadas", "c3": "Licencia comercial según tier (A/B/C/D)" },
        "r6": { "c1": "Fórmula avanzada", "c3": "Canon = Royalty fijo + porcentaje sobre la cifra de negocio" },
        "r7": { "c1": "Fijo + por unidad", "c3": "Tasa base + folios suplementarios" }
      },
      "body": "La calculadora le pregunta los datos según el tipo de servicio elegido. Los cálculos siguen la misma lógica que las facturas oficiales del Tesoro Público — el resultado es indicativo y se confirma cuando inicia la solicitud (ver <a href=\"22-iniciar-tramite-web.html\" class=\"coming-soon\">Iniciar trámite</a>)."
    },
    "s6": {
      "title": "6. Limitaciones de la calculadora",
      "limit1": "<strong>Indicativa</strong> — el resultado es una estimación basada en las tarifas oficiales vigentes. Las cantidades reales pueden incluir tasas suplementarias (timbres, servicios urgentes, suplementos por trámite a distancia).",
      "limit2": "<strong>Sin descuentos personales</strong> — la calculadora no tiene en cuenta deducciones individuales (familia numerosa, primera vivienda, donaciones a entidades reconocidas).",
      "limit3": "<strong>Sin garantía legal</strong> — los cálculos no constituyen un cálculo oficial. Para una declaración legal, consulte con un contable autorizado o utilice el formulario oficial.",
      "success": "Ahora sabe estimar sus impuestos. Si necesita ayuda específica, consulte el <a href=\"55-asistente-ia-publica.html\">Asistente IA</a> o contacte con un contable autorizado."
    },
    "prev": "← Anterior: Explorar servicios",
    "next": "Siguiente: Directorio de empresas →"
  },
  "page53": {
    "html_title": "Directorio de empresas — Manual Facil",
    "title": "Directorio de empresas",
    "description": "Consulte el directorio público de las empresas registradas en Guinea Ecuatorial. Para cada empresa: nombre comercial, NIF, sector, tier (A/B/C/D), ciudad y representante legal. Acceso totalmente público — útil para verificar la existencia legal de un proveedor antes de firmar un contrato.",
    "toc": {
      "s1": "1. Acceder al directorio",
      "s2": "2. Buscar y filtrar",
      "s3": "3. Sistema de tier (A/B/C/D)",
      "s4": "4. Detalle de una empresa",
      "s5": "5. Usos prácticos"
    },
    "s1": {
      "title": "1. Acceder al directorio",
      "intro": "Desde la pantalla de bienvenida, pulse la tarjeta <strong>«Empresas»</strong>. Se muestra el directorio con un contador del total de empresas registradas (ejemplo: «20/49 empresas» en pantalla, paginación abajo).",
      "fig1": {
        "alt": "Directorio de empresas",
        "caption": "Directorio de empresas en versión móvil — listado con búsqueda, badge de tier por empresa (A1/C1/C2/D1), 20 resultados por página."
      }
    },
    "s2": {
      "title": "2. Buscar y filtrar",
      "intro": "Tres herramientas para localizar una empresa:",
      "search": "<strong>Búsqueda por nombre</strong> — escriba el nombre comercial total o parcial. La búsqueda funciona por mejor coincidencia (no necesita escritura exacta).",
      "nif": "<strong>Búsqueda por NIF</strong> — el Número de Identificación Fiscal único de la empresa. Útil cuando ya tiene una factura.",
      "filter": "<strong>Filtros</strong> — por tier (A/B/C/D), sector (comercio, servicios, industria...), ciudad (Malabo, Bata, Mongomo...)."
    },
    "s3": {
      "title": "3. Sistema de tier (A / B / C / D)",
      "intro": "Cada empresa tiene un <strong>tier</strong> (categoría de tamaño y zona) que determina el régimen fiscal aplicable y las tarifas de licencias. El tier se asigna a la creación y se revisa anualmente.",
      "table": {
        "col1": "Tier",
        "col2": "Zona",
        "col3": "Tipo de comercio típico",
        "col4": "Ejemplo de licencia",
        "r1": { "c2": "Capitales de región (Malabo, Bata)", "c3": "Grandes empresas, supermercados" },
        "r2": { "c2": "Capitales de provincia", "c3": "Mediana empresa, restaurantes" },
        "r3": { "c2": "Capitales de distrito", "c3": "Pequeña empresa, abacerías" },
        "r4": { "c2": "Pueblos y zona rural", "c3": "Comercio local, talleres" }
      }
    },
    "s4": {
      "title": "4. Detalle de una empresa",
      "intro": "Pulse una empresa para abrir su ficha pública. Información mostrada:",
      "info1": "<strong>Identidad</strong>: nombre comercial, forma jurídica, NIF, fecha de registro",
      "info2": "<strong>Localización</strong>: ciudad, dirección de la sede social",
      "info3": "<strong>Clasificación</strong>: tier asignado, sector de actividad principal",
      "info4": "<strong>Representante legal</strong>: nombre del director o gerente declarado oficialmente",
      "info5": "<strong>Estado</strong>: activa, suspendida, en liquidación",
      "info_callout": "Los datos sensibles (cifra de negocios, deudas fiscales, sanciones) NO son públicos. Solo el representante legal y los agentes autorizados pueden acceder a ellos tras autenticación."
    },
    "s5": {
      "title": "5. Usos prácticos",
      "use1": "<strong>Verificar un proveedor</strong> antes de firmar un contrato — consulte que la empresa esté activa y declarada en el sector adecuado.",
      "use2": "<strong>Encontrar el NIF de una empresa</strong> a partir de su nombre comercial (útil para emitir una factura).",
      "use3": "<strong>Verificar un cambio de representante</strong> — la fecha de actualización del representante legal indica si está correctamente identificado.",
      "use4": "<strong>Estudiar el mercado</strong> — visualizar las empresas activas por sector y por ciudad antes de crear una nueva actividad.",
      "success": "El directorio es accesible 24/7 sin necesidad de cuenta. Para registrar su propia empresa, consulte la página <a href=\"42-gestion-empresas.html\" class=\"coming-soon\">Gestionar empresas</a>."
    },
    "prev": "← Anterior: Calculadora fiscal",
    "next": "Siguiente: Simulador de licencias →"
  },
  "page54": {
    "html_title": "Simulador de licencias comerciales — Manual Facil",
    "title": "Simulador de licencias comerciales",
    "description": "Antes de abrir un comercio en Guinea Ecuatorial, conozca con precisión la tarifa de su licencia comercial. El simulador le guía en 3 etapas: tipo de comercio, zona geográfica, resultado detallado. Sin necesidad de cuenta.",
    "toc": {
      "s1": "1. Acceder al simulador",
      "s2": "2. Etapa 1/3 — Tipo de comercio",
      "s3": "3. Etapa 2/3 — Zona comercial",
      "s4": "4. Etapa 3/3 — Resultado",
      "s5": "5. Variantes según el tier",
      "s6": "6. Después de la simulación"
    },
    "s1": {
      "title": "1. Acceder al simulador",
      "intro": "Desde la pantalla de bienvenida, pulse la tarjeta <strong>«Licencias»</strong>. El simulador se abre en la etapa 1/3 con la lista de tipos de comercio disponibles."
    },
    "s2": {
      "title": "2. Etapa 1/3 — Tipo de comercio",
      "intro": "Elija su tipo de comercio entre las 10+ categorías disponibles:",
      "cat1": "Abacerías (alimentación)",
      "cat2": "Bares y restaurantes",
      "cat3": "Cafeterías",
      "cat4": "Carpinterías y talleres",
      "cat5": "Clínicas y farmacias",
      "cat6": "Hostelería (hoteles)",
      "cat7": "Comercio textil y vestuario",
      "cat8": "Servicios profesionales",
      "cat9": "Y otras categorías específicas",
      "fig1": {
        "alt": "Etapa 1/3 selección tipo de comercio",
        "caption": "Etapa 1/3 — Lista de tipos de comercio en versión española."
      }
    },
    "s3": {
      "title": "3. Etapa 2/3 — Zona comercial",
      "intro": "Elija la zona geográfica donde estará situado su comercio. Las zonas se agrupan en 4 niveles (tier) con sub-zonas:",
      "table": {
        "col1": "Tier",
        "col2": "Sub-zonas",
        "col3": "Ejemplos",
        "r1": { "c3": "Centro Malabo, Centro Bata" },
        "r2": { "c3": "Periferia Malabo/Bata, ciudades de provincia" },
        "r3": { "c3": "Capitales de distrito (Mongomo, Niefang...)" },
        "r4": { "c3": "Pueblos y zona rural" }
      },
      "fig1": {
        "alt": "Etapa 2/3 selección zona",
        "caption": "Etapa 2/3 — Selector de zona con 3 niveles desplegables."
      }
    },
    "s4": {
      "title": "4. Etapa 3/3 — Resultado detallado",
      "intro": "El simulador calcula automáticamente la tarifa según las dos selecciones y muestra:",
      "r1": "<strong>Importe total</strong> a pagar (ejemplo: 204 000 XAF)",
      "r2": "<strong>Desglose</strong>: tasa de Tesoro Público, suplementos eventuales (Cámara de Comercio para tier C+, etc.)",
      "r3": "<strong>Documentos requeridos</strong>: lista de documentos a aportar para la solicitud real",
      "r4": "<strong>Plazo</strong> de tratamiento estimado",
      "r5": "<strong>Botones de acción</strong>: Copiar el resumen, Descargar PDF, Compartir (WhatsApp, SMS...)",
      "fig1": {
        "alt": "Etapa 3/3 resultado simulador",
        "caption": "Etapa 3/3 — Resultado para una clínica/farmacia, tier D, total 114 000 XAF, documentos requeridos y CTAs Copiar / Descargar / Compartir."
      }
    },
    "s5": {
      "title": "5. Variantes según el tier",
      "intro": "Según el tier, el desglose puede incluir <strong>cuotas adicionales</strong>. Ejemplo concreto con cafeterías:",
      "fig1": {
        "alt": "Resultado tier D simple",
        "caption": "Cafetería tier D — Total 204 000 XAF (solo Tesoro Público). Captura en versión francesa."
      },
      "fig2": {
        "alt": "Resultado tier C con Cámara",
        "caption": "Cafetería tier C — Total 242 000 XAF (Tesoro Público + Cámara de Comercio). Captura en versión francesa."
      },
      "info": "A partir del tier C, la <strong>Cámara de Comercio</strong> añade una cuota anual obligatoria. Los tiers A y B requieren además un certificado de inspección sanitaria para algunas categorías (restaurantes, clínicas)."
    },
    "s6": {
      "title": "6. Después de la simulación",
      "intro": "El resultado del simulador es <strong>indicativo</strong>. Para presentar la solicitud real:",
      "step1": "Pulse <strong>«Iniciar la solicitud»</strong> al final del simulador (necesita iniciar sesión).",
      "step2": "Aporte los <strong>documentos requeridos</strong> indicados en la etapa 3/3.",
      "step3": "Programe una <strong>cita</strong> en el ayuntamiento competente (paso integrado en el wizard).",
      "step4": "Pague la tasa (Dinero Móvil, transferencia, efectivo en oficina del Tesoro).",
      "step5": "Reciba la confirmación y el recibo. La licencia se emite en 5-15 días según el tier.",
      "success": "Para más detalles sobre el proceso completo, consulte la página <a href=\"22-iniciar-tramite-web.html\" class=\"coming-soon\">Iniciar trámite (Web)</a> o <a href=\"32-iniciar-tramite-mobile.html\" class=\"coming-soon\">Iniciar trámite (Móvil)</a>."
    },
    "prev": "← Anterior: Directorio",
    "next": "Siguiente: Asistente IA →"
  },
  "page55": {
    "html_title": "Asistente IA público — Manual Facil",
    "title": "Asistente IA público",
    "description": "Facil incluye un asistente conversacional alimentado por IA (Gemini 2.5 Flash) que responde a sus preguntas sobre los trámites administrativos en Guinea Ecuatorial: documentos requeridos, costes estimados, plazos, procedimientos paso a paso. Disponible 24/7 sin necesidad de cuenta.",
    "toc": {
      "s1": "1. Acceder al asistente",
      "s2": "2. Capacidades del asistente público",
      "s3": "3. Sugerencias de preguntas",
      "s4_new": "4. Ejemplo de conversación completa",
      "s4": "5. Limitaciones sin sesión",
      "s5": "6. Privacidad y datos"
    },
    "s1": {
      "title": "1. Acceder al asistente",
      "intro": "Desde la pantalla de bienvenida, pulse el botón <strong>«Asistente IA»</strong> en la cabecera o el banner del carrusel. El asistente abre con un mensaje de bienvenida y 4 sugerencias de preguntas pulsables.",
      "fig1": {
        "alt": "Asistente IA estado vacío",
        "caption": "Asistente IA en versión móvil — pantalla de inicio con título, mensaje de bienvenida y 4 sugerencias (servicios, documentos, pago, verificar demanda)."
      }
    },
    "s2": {
      "title": "2. Capacidades del asistente público",
      "intro": "El asistente puede responder a preguntas sobre:",
      "cap1": "<strong>Trámites administrativos</strong>: pasaporte, conducir, residencia, IRPF, IVA, IS, licencias comerciales, certificados, etc. (catálogo de 873 servicios)",
      "cap2": "<strong>Documentos requeridos</strong>: lista detallada por trámite, originales y copias",
      "cap3": "<strong>Costes</strong>: tarifas oficiales con desglose (impuestos, suplementos eventuales)",
      "cap4": "<strong>Plazos</strong>: tiempo de tratamiento estimado por categoría",
      "cap5": "<strong>Procedimientos paso a paso</strong>: secuencia de etapas a seguir, lugar de cada cita",
      "cap6": "<strong>Comparaciones</strong>: ej. «¿Cuánto cuesta abrir un restaurante en Malabo vs Bata?»",
      "tip": "El asistente entiende preguntas en español, francés e inglés — incluso si las mezcla en una misma frase. Use el lenguaje natural sin necesidad de palabras clave técnicas."
    },
    "s3": {
      "title": "3. Sugerencias de preguntas (para empezar)",
      "intro": "Si no sabe por dónde empezar, pulse una de las sugerencias proporcionadas:",
      "q1": "<em>«¿Qué servicios están disponibles para mi DIP?»</em>",
      "q2": "<em>«¿Cuáles son los documentos para el pasaporte?»</em>",
      "q3": "<em>«¿Cuánto cuesta una licencia comercial en Bata?»</em>",
      "q4": "<em>«¿Cómo verificar mi solicitud?»</em>",
      "q5": "<em>«¿Cuál es el plazo para una renovación de carnet de conducir?»</em>",
      "body": "El asistente responde con texto estructurado: subtítulos, listas numeradas, tablas si procede, enlaces directos al catálogo. Puede pulsar los enlaces para ir directamente al servicio mencionado."
    },
    "s4_new": {
      "title": "4. Ejemplo de conversación completa",
      "intro": "A continuación, una conversación tipo en 3 etapas — desde la pregunta hasta la respuesta detallada. Las capturas siguientes están en versión francesa (versión española visualmente idéntica salvo el texto traducido) :",
      "stage1": {
        "title": "Etapa 1 — Envío de la pregunta y carga",
        "body": "Tras escribir su pregunta (ejemplo: <em>«Procédure de passeport»</em>), aparece la burbuja del usuario seguida de un indicador de escritura («typing») mientras el asistente prepara la respuesta. El tiempo de respuesta varía según la complejidad : 1-2 segundos para una pregunta simple, 4-6 segundos para una pregunta compleja con cálculos."
      },
      "fig1": {
        "alt": "Asistente IA cargando respuesta",
        "caption": "Etapa 1 — Burbuja del usuario «Procédure de passeport» seguida del indicador de escritura del asistente. (Captura en versión francesa)"
      },
      "stage2": {
        "title": "Etapa 2 — Respuesta estructurada",
        "body": "El asistente entrega una respuesta <strong>completa y estructurada</strong>: título de la sección («Pasaporte Biométrico»), información clave (coste, plazo, documentos requeridos), seguida de la lista de etapas numeradas. La presentación facilita el escaneo visual rápido."
      },
      "fig2": {
        "alt": "Asistente IA respuesta completa estructurada",
        "caption": "Etapa 2 — Respuesta detallada con coste, plazo, documentos requeridos, etapas numeradas. (Captura en versión francesa)"
      },
      "stage3": {
        "title": "Etapa 3 — Continuación + acciones de feedback",
        "body": "Si la respuesta es larga, puede desplazarse para ver las últimas etapas + una <strong>nota</strong> contextual + 4 acciones disponibles al final de cada respuesta:",
        "action1": "<strong>👍 Pulgar arriba</strong> — la respuesta es útil. Mejora el modelo.",
        "action2": "<strong>👎 Pulgar abajo</strong> — la respuesta es incorrecta o incompleta. Le permite a las equipos mejorar el asistente.",
        "action3": "<strong>📋 Copiar</strong> — copia el texto completo en el portapapeles.",
        "action4": "<strong>📤 Compartir</strong> — comparte la respuesta vía WhatsApp, SMS, email u otra aplicación instalada."
      },
      "fig3": {
        "alt": "Asistente IA continuación respuesta y acciones",
        "caption": "Etapa 3 — Final de la respuesta (etapas 7-9), nota contextual y 4 acciones de feedback (👍 / 👎 / copiar / compartir). (Captura en versión francesa)"
      },
      "tip": "Use el <strong>👎 Pulgar abajo</strong> sin dudar si la respuesta es errónea o desfasada — es el mecanismo principal para mejorar la calidad del asistente. Su feedback se trata anonymizado."
    },
    "s4": {
      "title": "5. Limitaciones sin sesión",
      "intro": "Sin cuenta iniciada, el asistente <strong>no puede</strong>:",
      "limit1": "<strong>Acceder a sus datos personales</strong> (no conoce su nombre, sus solicitudes, su histórico)",
      "limit2": "<strong>Iniciar un trámite por usted</strong> — solo describe el procedimiento, no actúa",
      "limit3": "<strong>Verificar el estado de su solicitud</strong> — para eso, inicie sesión o use la página <a href=\"57-verificar.html\">Verificar un recibo</a>",
      "limit4": "<strong>Acceder a sus documentos</strong> guardados — solo en el modo conectado",
      "body": "Para esas funciones avanzadas (asistente personalizado, gestión de su caja fuerte digital, sugerencias proactivas), <a href=\"11-crear-cuenta.html\" class=\"coming-soon\">cree una cuenta</a> y consulte la página <a href=\"29-soporte-web.html\" class=\"coming-soon\">Asistente IA conectado</a>."
    },
    "s5": {
      "title": "6. Privacidad y datos",
      "priv1": "<strong>Sin grabación personal</strong> — sus preguntas no se asocian a ningún identificador (sin sesión)",
      "priv2": "<strong>Estadísticas anónimas</strong> — solo se recolectan estadísticas globales (volumen, temas frecuentes) para mejorar el servicio",
      "priv3": "<strong>No proporcione datos sensibles</strong> — número DIP, teléfono, dirección no son necesarios para responder a una pregunta general. Si los proporciona, no se almacenan.",
      "priv4": "<strong>Conformidad RGPD</strong> — ver <a href=\"58-legal.html\">página legal</a> para detalles sobre el tratamiento de datos",
      "success": "El asistente está disponible 24/7 para responder a sus preguntas. Si necesita actuar (presentar una solicitud, pagar, descargar un documento), inicie sesión."
    },
    "prev": "← Anterior: Simulador de licencias",
    "next": "Siguiente: Guía →"
  },
  "page56": {
    "html_title": "Guía — Manual Facil",
    "title": "Guía rápida de Facil",
    "description": "La guía integrada en Facil le acompaña en sus primeros pasos. Tres pestañas: pasos a seguir para iniciar un trámite, preguntas frecuentes (FAQ), formularios oficiales descargables. Acceso público sin sesión.",
    "toc": {
      "s1": "1. Pestaña «Pasos»",
      "s2": "2. Pestaña «Preguntas frecuentes»",
      "s3": "3. Pestaña «Formularios»"
    },
    "s1": {
      "title": "1. Pestaña «Pasos» — guía paso a paso",
      "intro": "La pestaña «Pasos» enumera los 6 pasos genéricos para realizar cualquier trámite en Facil:",
      "step1": "<strong>Crear su cuenta</strong> — verificación por email + opción de añadir 2FA",
      "step2": "<strong>Iniciar sesión</strong> — con email y contraseña, opcionalmente con biometría en móvil",
      "step3": "<strong>Elegir su trámite</strong> — desde el catálogo, las sugerencias del asistente IA o la búsqueda",
      "step4": "<strong>Subir los documentos requeridos</strong> — foto desde el móvil o subida de archivos PDF/JPG. El OCR extrae automáticamente los datos.",
      "step5": "<strong>Rellenar el formulario</strong> — la mayoría de los campos están prerellenados con los datos OCR. Verifique y complete.",
      "step6": "<strong>Programar la cita</strong> — elija oficina, fecha y hora entre los disponibles, luego pague.",
      "fig1": {
        "alt": "Pestaña Pasos en versión española",
        "caption": "Pestaña «Pasos» en la versión española — los 6 pasos numerados con iconos."
      }
    },
    "s2": {
      "title": "2. Pestaña «Preguntas frecuentes»",
      "intro": "La FAQ contiene 6 preguntas cuya respuesta se despliega al pulsarlas. Las preguntas tratan los temas más frecuentes:",
      "q1": "<strong>¿Necesito una cuenta para todo?</strong> — No, los servicios públicos (catálogo, calculadora, simulador, asistente IA, verificación) son accesibles sin sesión.",
      "q2": "<strong>¿Cómo cambio de idioma?</strong> — Selector ES/FR/EN en la cabecera, en cualquier momento.",
      "q3": "<strong>¿Puedo pagar en efectivo?</strong> — Sí, en la oficina del Tesoro Público. La solicitud genera una referencia que presenta en caja.",
      "q4": "<strong>¿Cuánto tiempo dura el tratamiento?</strong> — Variable según el trámite (de 24h para una verificación a 15 días para una licencia compleja). El plazo está indicado en la ficha de cada servicio.",
      "q5": "<strong>¿Mis datos están seguros?</strong> — Sí, conforme RGPD. Cifrado en tránsito (HTTPS) y en reposo. Ver <a href=\"58-legal.html\">página legal</a> y <a href=\"16-seguridad.html\" class=\"coming-soon\">página seguridad</a>.",
      "q6": "<strong>¿Qué pasa si pierdo mi cuenta?</strong> — Use «Contraseña olvidada» en la pantalla de inicio de sesión. Si pierde acceso al email también, contacte con soporte."
    },
    "s3": {
      "title": "3. Pestaña «Formularios» — descargas oficiales",
      "intro": "La pestaña Formularios da acceso a los <strong>formularios fiscales oficiales en PDF</strong> que puede descargar, rellenar y luego subir en su solicitud. Lista de formularios disponibles:",
      "f1": "<strong>Retención 3%, 5%, 10%</strong> — formularios de retención fiscal para empleadores",
      "f2": "<strong>Cuota mínima</strong> — declaración de la cuota mínima IS",
      "f3": "<strong>IVA Forfaitaire / IVA Real</strong> — declaraciones IVA según el régimen",
      "f4": "<strong>IRPF</strong> — declaración anual del impuesto sobre la renta",
      "f5": "<strong>Otros formularios sectoriales</strong> — petrolero, mineros, agrícolas",
      "fig1": {
        "alt": "Pestaña Formularios",
        "caption": "Pestaña «Formularios» en versión española — lista de PDF descargables agrupados por tipo de declaración."
      },
      "info": "Los formularios son los <strong>oficiales del Ministerio de Hacienda</strong>. Si los rellena en papel, escanéelos en buena calidad antes de subirlos. La calculadora <a href=\"52-calculadora.html\">Calculadora fiscal</a> le ayuda a calcular las cantidades antes de rellenar el formulario.",
      "success": "Ahora conoce los recursos públicos disponibles. Si tiene una pregunta no cubierta por la FAQ, use el asistente IA o contacte con soporte una vez iniciada la sesión."
    },
    "prev": "← Anterior: Asistente IA",
    "next": "Siguiente: Verificar un recibo →"
  },
  "page57": {
    "html_title": "Verificar un recibo — Manual Facil",
    "title": "Verificar la autenticidad de un recibo",
    "description": "Cualquiera puede verificar la autenticidad de un recibo, una solicitud o una licencia comercial emitidos por Facil — sin necesidad de cuenta. La verificación funciona mediante código QR (escaneado desde la app móvil o desde un PDF) o por número de referencia. Útil para los agentes de campo, los proveedores y los ciudadanos que reciben un documento.",
    "no_capture": "<strong>Esta página combina texto, diagramas en ASCII y capturas reales</strong> del sistema de verificación. Las capturas (sección 4) muestran los 3 casos típicos : recibo válido, solicitud verificada y errores. La descripción técnica del flujo (sección 2) usa un diagrama ASCII para representar el intercambio entre frontend y backend.",
    "toc": {
      "s1": "1. Cómo acceder a la verificación",
      "s2": "2. Flujo de la verificación (diagrama)",
      "s3": "3. Las 3 variantes de verificación",
      "s_visual": "4. Ejemplos visuales del sistema",
      "s4": "5. Ejemplos concretos (JSON)",
      "s5": "6. Seguridad y firma",
      "s6": "7. Mensajes de error posibles"
    },
    "s1": {
      "title": "1. Cómo acceder a la verificación",
      "intro": "Hay dos formas de iniciar una verificación:",
      "qr": {
        "title": "A. Escanear el QR código",
        "body": "Cada documento generado por Facil (recibo PDF, solicitud, certificado) lleva un <strong>QR código</strong> en una esquina. Escanee este QR con la cámara de su teléfono o con la aplicación Facil — abre directamente la página de verificación con todos los datos rellenados."
      },
      "url": {
        "title": "B. Introducir manualmente el número",
        "body": "Vaya a <code>https://taxasge.emacsah.com/verify/{REFERENCIA}</code> en su navegador. La <code>{REFERENCIA}</code> es el número del documento (ejemplo: <code>REC-2026-000013</code> para un recibo, <code>CON-2026-00001</code> para una solicitud Conducir). El sistema detecta automáticamente el tipo y muestra la información correspondiente."
      },
      "warning": "La URL de verificación incluye un <strong>token firmado</strong> (parámetro <code>?t=...</code>) que prueba la autenticidad. Sin este token, la verificación falla — incluso si conoce la referencia exacta. El token se genera automáticamente cuando Facil emite el documento."
    },
    "s2": {
      "title": "2. Flujo de la verificación",
      "intro": "Diagrama del flujo desde el escaneo hasta la respuesta del servidor:",
      "diagram": "┌────────────────┐    Escanea QR /                ┌──────────────────┐\n│   USUARIO      │   abre URL                     │  FRONTEND FACIL  │\n│ (Agente / pub.)├──────────────────────────────► │  /verify/{ref}    │\n└────────────────┘                                └────────┬─────────┘\n                                                           │\n                                                           ▼\n                                              ┌────────────────────────┐\n                                              │  GET /api/v1/verify/   │\n                                              │  {ref}?t={token}       │\n                                              └────────┬───────────────┘\n                                                       │\n                                                       ▼\n                                            ┌─────────────────────────┐\n                                            │   BACKEND VERIFICACIÓN  │\n                                            │                         │\n                                            │  1. Detecta tipo según  │\n                                            │     prefijo ref:        │\n                                            │       REC- → recibo     │\n                                            │       CON-/PAS-/LIC- →  │\n                                            │           solicitud     │\n                                            │       LIC- (sólo) →     │\n                                            │           licencia      │\n                                            │  2. Verifica el token   │\n                                            │     firmado (HMAC)      │\n                                            │  3. Carga el documento  │\n                                            │     desde la BD         │\n                                            │  4. Devuelve datos      │\n                                            │     públicos (sin info  │\n                                            │     personal sensible)  │\n                                            └────────┬────────────────┘\n                                                     │\n                                                     ▼\n                                          ┌──────────────────────────┐\n                                          │   RESULTADO MOSTRADO     │\n                                          │                          │\n                                          │   ✅ Documento válido    │\n                                          │   - Número                │\n                                          │   - Fecha de emisión      │\n                                          │   - Importe (si aplica)   │\n                                          │   - Entidad emisora       │\n                                          │   - Estado actual         │\n                                          │                          │\n                                          │   ❌ Documento inválido  │\n                                          │   - Token incorrecto     │\n                                          │   - Documento revocado   │\n                                          │   - Referencia inexistente│\n                                          └──────────────────────────┘",
      "body": "Toda la operación dura <strong>menos de 200 ms</strong> en condiciones normales. La página de verificación está optimizada para los móviles con conexión lenta (cache CDN, payload comprimido)."
    },
    "s3": {
      "title": "3. Las 3 variantes de verificación",
      "intro": "Facil distingue 3 tipos de documentos verificables. El sistema detecta automáticamente la variante a partir del prefijo de la referencia:",
      "table": {
        "col1": "Campo",
        "col2": "Detalle"
      },
      "v1": {
        "title": "Variante 1 — Recibo de pago (prefijo REC-)",
        "field1": "Identificador",
        "field2": "Datos mostrados",
        "detail2": "Número, fecha, hora, importe XAF, método de pago, entidad emisora (Tesoro), nombre del pagador (parcial), código del trámite asociado, estado del recibo (válido / revocado).",
        "field3": "Permisos",
        "detail3": "Acceso público total con token. Sin token: error 403.",
        "field4": "Caso de uso",
        "detail4": "Un agente comprueba que un ciudadano ha pagado bien antes de procesar la siguiente etapa de su expediente."
      },
      "v2": {
        "title": "Variante 2 — Solicitud (prefijos CON-, PAS-, LIC-, etc.)",
        "field1": "Identificador",
        "field2": "Datos mostrados",
        "detail2": "Tipo de trámite, estado de la solicitud (Borrador, Enviada, En proceso, Completada, Rechazada), entidad gestora (DGT, CNEDOGE, Ayuntamiento...), fecha de creación, fecha y lugar de la cita programada (si aplica), importe pagado (si aplica).",
        "field3": "Permisos",
        "detail3": "Público con token. Los datos personales sensibles (DIP completo, número permiso) se muestran parcialmente.",
        "field4": "Caso de uso",
        "detail4": "Un ciudadano comparte el QR de su solicitud con su empleador, su banco o un tercero que necesita probar la existencia del trámite oficial."
      },
      "v3": {
        "title": "Variante 3 — Licencia comercial activa (prefijo LIC- después validación final)",
        "field1": "Identificador",
        "field2": "Datos mostrados",
        "detail2": "Nombre comercial titular, NIF de la empresa, sector, tier (A1/B2/C1/D), validez (fecha de inicio + caducidad), obligaciones pendientes (cantidades pendientes), última inspección registrada.",
        "field3": "Permisos",
        "detail3": "Acceso público total. Útil para los agentes de inspección de campo (OMS) que verifican la conformidad de un comercio antes de la inspección.",
        "field4": "Caso de uso",
        "detail4": "Un agente OMS escanea el QR pegado en la fachada del comercio durante una inspección de campo — comprueba inmediatamente la validez de la licencia y las eventuales obligaciones pendientes."
      }
    },
    "s_visual": {
      "title": "4. Ejemplos visuales del sistema en producción",
      "intro": "Esta sección muestra <strong>capturas reales</strong> del sistema de verificación tal como se presenta al usuario después del escaneo de un QR o la apertura de la URL. Las capturas en versión española se priorizan; las versiones francesas se incluyen como referencia para usuarios francófonos.",
      "loading": {
        "title": "Estado de carga (verificación en curso)",
        "body": "Inmediatamente después de abrir la URL de verificación, el sistema muestra un <strong>spinner</strong> azul con la referencia que se está verificando. La operación dura típicamente menos de 200 ms — este estado solo es visible si la conexión es lenta.",
        "fig": {
          "alt": "Verificación en curso — estado de carga",
          "caption": "Estado de carga durante la verificación de REC-2026-000002 — spinner azul con referencia visible. (Captura en versión francesa, comportamiento idéntico en español)"
        }
      },
      "recibo": {
        "title": "Caso 1 — Recibo válido",
        "body": "Cuando el recibo es auténtico, la pantalla muestra un <strong>icono verde</strong> de validación con el badge «Recibo Válido» y todos los detalles del pago: número, fecha, importe en XAF, método, pagador (parcialmente anónimo), código del trámite asociado, entidad emisora, tipo de solicitud y referencia.",
        "fig1": {
          "alt": "Recibo válido vista superior",
          "caption": "Vista superior — header con logo Facil, título «Verificación de Recibo», badge verde «Recibo Válido» y primeros campos (Número, Fecha, Monto, Método, Pagador, Código)."
        },
        "fig2": {
          "alt": "Recibo válido detalles",
          "caption": "Vista de detalles — sección inferior con Entidad emisora (DGT), Tipo de solicitud (expedición), Referencia de solicitud asociada (CON-2026-00001) y disclaimer del Tesoro Público."
        }
      },
      "solicitud": {
        "title": "Caso 2 — Solicitud verificada",
        "body": "Cuando la referencia es una solicitud (PAS-, CON-, LIC-, etc.), la pantalla muestra «Solicitud Verificada» con los detalles del trámite : tipo, estado (Enviada / En proceso / Completada), entidad gestora, fecha de creación, cita programada (fecha + hora + lugar) e importe pagado.",
        "fig1": {
          "alt": "Solicitud verificada vista superior",
          "caption": "Vista superior — «Verificación de Solicitud» con badge verde «Solicitud Verificada», Referencia (PAS-2026-00001), Trámite (Solicitud de Pasaporte), Estado (Completada), Tipo (Renovación), Fecha, Entidad (CNEDOGE_PASAPORTE)."
        },
        "fig2": {
          "alt": "Solicitud verificada detalles",
          "caption": "Vista de detalles — Cita Programada (Fecha 28/04/2026, Hora 09:00, Ubicación MOSTOLES) + Monto 7 500 XAF + Estado del Pago (Pagado)."
        }
      },
      "errores": {
        "title": "Caso 3 — Documento no válido (errores)",
        "body": "Si el documento no existe, ha sido revocado, o el token es inválido, la pantalla muestra un <strong>icono rojo/naranja</strong> con un mensaje claro y la referencia introducida. Dos ejemplos típicos:",
        "fig1": {
          "alt": "Licencia comercial no válida",
          "caption": "Caso licencia comercial inexistente — «Verificación de Licencia Comercial» con icono rojo de error, badge naranja «Licencia No Válida» y la referencia (LIC-2026-2982F468) que no se ha encontrado en la base de datos."
        },
        "fig2": {
          "alt": "Recibo no válido (versión francesa)",
          "caption": "Caso recibo inexistente — «Verification du Reçu» con icono rojo, badge «Recu Non Valide», y mensaje bilingüe «Recibo no encontrado / Receipt not found». (Captura en versión francesa)"
        }
      },
      "info": "El <strong>botón flotante «Asistente Facil»</strong> visible en todas las capturas permite acceder al chatbot IA público sin abandonar la página de verificación — útil si el verificador necesita contexto adicional sobre un trámite o un error.",
      "fr": {
        "title": "Versiones francesas (referencia)",
        "body": "Para usuarios francófonos, las mismas pantallas en versión francesa están disponibles vía la URL <code>/fr/verify/{ref}</code> o el selector ES/FR/EN en la cabecera. La estructura es idéntica:",
        "recu": {
          "title": "Recibo válido — versión francesa («Verification du Recu»)"
        },
        "fig1": {
          "alt": "Reçu valide vue supérieure FR",
          "caption": "Vista superior FR — header completo (logo + título + sub-título «Systeme de Verification des Paiements du Tresor Public»), badge «Recu Valide» y primeros campos (Numero de Recu, Date de Paiement, Montant, Mode de Paiement, Payeur, Code de Procedure)."
        },
        "fig2": {
          "alt": "Reçu valide détails FR",
          "caption": "Vista de detalles FR — sección inferior con Entité (DGT), Type de demande (expedicion), Reference de la demande (CON-2026-00001) y disclaimer «Ce systeme de verification est fourni par la plateforme Facil pour authentifier les requetes»."
        },
        "demande": {
          "title": "Solicitud verificada — versión francesa («Verification de la Demande»)"
        },
        "fig3": {
          "alt": "Demande Verifiée FR vue supérieure",
          "caption": "Vista superior FR — badge «Demande Verifiee», sub-título trilingüe «Solicitud verificada / Request verified» y campos Reference (PAS-2026-00001), Procedure (Solicitud de Pasaporte), Statut (Completada), Type (Renovacion), Date (23/04/2026), Entité (CNEDOGE_PASAPORTE)."
        },
        "fig4": {
          "alt": "Demande Verifiée FR détails",
          "caption": "Vista de detalles FR — Rendez-vous Programme (Date 28/04/2026, Heure 09:00, Lieu MOSTOLES) + Montant 7 500 XAF + Statut du paiement (Paye)."
        }
      }
    },
    "s4": {
      "title": "5. Ejemplos concretos (JSON)",
      "ex1": {
        "title": "Ejemplo 1 — Verificación pública de un recibo",
        "code": "URL : https://taxasge.emacsah.com/verify/REC-2026-000013?t=eyJhbGc...\nGET → 200 OK\nRespuesta:\n{\n  \"tipo\": \"recibo\",\n  \"numero\": \"REC-2026-000013\",\n  \"fecha\": \"2026-04-19T15:07:00\",\n  \"importe_xaf\": 25000,\n  \"metodo\": \"Efectivo\",\n  \"pagador_parcial\": \"libre G***\",\n  \"tramite_ref\": \"CON-2026-00001\",\n  \"entidad\": \"Tesoro Público Malabo II\",\n  \"estado\": \"valido\"\n}"
      },
      "ex2": {
        "title": "Ejemplo 2 — Verificación de una solicitud Conducir",
        "code": "URL : https://taxasge.emacsah.com/es/verify/CON-2026-00001?t=...\nGET → 200 OK\nRespuesta:\n{\n  \"tipo\": \"solicitud\",\n  \"subtipo\": \"conducir_renovacion\",\n  \"numero\": \"CON-2026-00001\",\n  \"estado\": \"Completada\",\n  \"entidad\": \"DGT\",\n  \"tipo_expedicion\": \"RENOVACION\",\n  \"cita\": {\n    \"fecha\": \"2026-04-28\",\n    \"hora\": \"09:00\",\n    \"oficina\": \"MALABO II\"\n  },\n  \"importe_pagado_xaf\": 25000\n}"
      },
      "ex3": {
        "title": "Ejemplo 3 — Token inválido",
        "code": "URL : https://taxasge.emacsah.com/verify/REC-2026-000013  ← sin token\nGET → 403 Forbidden\nRespuesta: { \"error\": \"Token requerido para acceso público\" }"
      }
    },
    "s5": {
      "title": "6. Seguridad y firma",
      "sec1": "<strong>Token HMAC-SHA256</strong> — el parámetro <code>?t=...</code> es una firma HMAC del identificador. Sin la clave del Tesoro Público, es imposible falsificar.",
      "sec2": "<strong>Sin caducidad por defecto</strong> — los tokens son válidos mientras el documento existe. Para los documentos sensibles (recibos), un token puede ser revocado por un agente.",
      "sec3": "<strong>Datos sensibles protegidos</strong> — el DIP completo, el teléfono, la dirección postal NUNCA se devuelven en la verificación pública. Solo los datos visibles en el documento PDF original se muestran.",
      "sec4": "<strong>Audit log</strong> — todas las verificaciones se registran (IP, fecha, referencia). Útil para detectar fraudes (escaneo masivo).",
      "sec5": "<strong>Rate limiting</strong> — máximo 60 verificaciones / minuto / IP para evitar abusos."
    },
    "s6": {
      "title": "7. Mensajes de error posibles",
      "table": {
        "col1": "Mensaje",
        "col2": "Causa",
        "col3": "Acción"
      },
      "err1": {
        "cause": "Falta el parámetro ?t=...",
        "action": "Re-escanee el QR original o solicite un nuevo enlace al emisor."
      },
      "err2": {
        "cause": "Token modificado o caducado",
        "action": "El documento ha sido alterado. No fíarse, contactar al emisor."
      },
      "err3": {
        "cause": "Referencia inexistente",
        "action": "Verifique la ortografía. Los identificadores son case-sensitive (REC, CON, LIC, PAS)."
      },
      "err4": {
        "cause": "El documento ha sido invalidado por un agente (fraude, error de tratamiento)",
        "action": "El documento ya no es válido. Contactar al emisor."
      },
      "err5": {
        "cause": "Rate limit (60/min/IP) superado",
        "action": "Espere 1 minuto y vuelva a intentarlo. Si persiste, contactar soporte."
      },
      "success": "La verificación pública es una de las funciones más críticas de Facil — permite a la administración garantizar la autenticidad de los documentos sin necesidad de cuenta. Los agentes públicos disponen de funciones avanzadas de verificación documentadas en la página <a href=\"68-funciones-verify-agente.html\" class=\"coming-soon\">Funciones de verificación (agentes)</a>."
    },
    "prev": "← Anterior: Guía",
    "next": "Siguiente: Información legal →"
  },
  "page58": {
    "html_title": "Información legal — Manual Facil",
    "title": "Información legal",
    "description": "Resumen de los términos de uso, la política de privacidad RGPD, la gestión de cookies y el procedimiento de eliminación de cuenta para Facil. Esta página remite a los textos oficiales completos disponibles en la aplicación.",
    "disclaimer": "<strong>Esta página es un resumen del manual</strong>. Los textos legales oficiales están disponibles en la aplicación bajo «Configuración → Información legal» (Términos, Privacidad, Cookies, Eliminación cuenta) y prevalecen en caso de divergencia.",
    "toc": {
      "s1": "1. Términos de uso",
      "s2": "2. Política de privacidad (RGPD)",
      "s3": "3. Gestión de cookies",
      "s4": "4. Eliminación de cuenta",
      "s5": "5. Contacto y reclamaciones"
    },
    "s1": {
      "title": "1. Términos de uso",
      "intro": "Al utilizar Facil, usted acepta los términos siguientes:",
      "t1": "<strong>Servicio independiente</strong>: Facil es una herramienta de asistencia digital que facilita el acceso a los procedimientos administrativos. Las decisiones administrativas finales corresponden a las entidades competentes (DGI, CNEDOGE, DGT, etc.).",
      "t2": "<strong>Veracidad de los datos</strong>: usted se compromete a proporcionar información exacta y veraz. Las falsas declaraciones pueden llevar a sanciones legales.",
      "t3": "<strong>Uso personal</strong>: su cuenta es personal e intransmisible. No comparta sus credenciales.",
      "t4": "<strong>Comportamiento aceptable</strong>: no use Facil para actividades ilegales, intentar comprometer la seguridad del sistema o sobrecargar los servidores.",
      "t5": "<strong>Disponibilidad</strong>: Facil se esfuerza por garantizar una disponibilidad de 99,5% pero no puede garantizar un acceso ininterrumpido (mantenimiento, incidentes).",
      "t6": "<strong>Modificaciones</strong>: los términos pueden evolucionar. Le notificaremos los cambios sustanciales por email."
    },
    "s2": {
      "title": "2. Política de privacidad (RGPD)",
      "collected": {
        "title": "Datos recopilados",
        "d1": "<strong>Identidad</strong>: nombre, apellidos, fecha de nacimiento, DIP/NIE, nacionalidad",
        "d2": "<strong>Contacto</strong>: email, teléfono, dirección postal",
        "d3": "<strong>Documentos subidos</strong>: fotografías, copias de identidad, formularios fiscales",
        "d4": "<strong>Datos de uso</strong>: solicitudes presentadas, pagos efectuados, sesiones",
        "d5": "<strong>Datos técnicos</strong>: dirección IP, tipo de navegador/dispositivo, idioma preferido"
      },
      "use": {
        "title": "Finalidades del tratamiento",
        "u1": "Prestar el servicio (gestión de su cuenta, tratamiento de las solicitudes, generación de recibos)",
        "u2": "Cumplir con las obligaciones legales (audit log, conservación legal)",
        "u3": "Mejorar el servicio (estadísticas anónimas, detección de fraude)",
        "u4": "Comunicación con el usuario (notificaciones de estado, alertas de plazo, soporte)"
      },
      "rights": {
        "title": "Sus derechos RGPD",
        "r1": "<strong>Acceso</strong>: ver todos sus datos personales en cualquier momento (sección «Mi perfil»)",
        "r2": "<strong>Rectificación</strong>: corregir las informaciones incorrectas (sección «Mi perfil»)",
        "r3": "<strong>Portabilidad</strong>: exportar sus datos en formato JSON o PDF (sección «Configuración → Exportar datos»)",
        "r4": "<strong>Supresión</strong>: solicitar la eliminación completa de su cuenta y de sus datos (ver Sección 4)",
        "r5": "<strong>Oposición</strong>: oponerse a un tratamiento específico (notificaciones marketing, etc.)",
        "r6": "<strong>Limitación</strong>: limitar el tratamiento en caso de litigio"
      },
      "retention": {
        "title": "Duración de conservación",
        "body": "Los datos se conservan según las obligaciones legales :",
        "r1": "<strong>Cuenta activa</strong>: datos conservados mientras la cuenta esté activa",
        "r2": "<strong>Solicitudes y recibos</strong>: 10 años (obligación fiscal y administrativa)",
        "r3": "<strong>Audit log</strong>: 10 años (obligación legal de trazabilidad)",
        "r4": "<strong>Datos técnicos (logs)</strong>: 12 meses"
      }
    },
    "s3": {
      "title": "3. Gestión de cookies",
      "intro": "Facil utiliza cookies para asegurar el funcionamiento de la aplicación y mejorar su experiencia. Tres categorías:",
      "table": {
        "col1": "Categoría",
        "col2": "Uso",
        "col3": "Consentimiento",
        "r1": { "c1": "Esenciales", "c2": "Sesión, autenticación, idioma preferido", "c3": "Obligatorias (sin consentimiento)" },
        "r2": { "c1": "Funcionales", "c2": "Recordar últimas búsquedas, dimensiones de pantalla", "c3": "Opt-in" },
        "r3": { "c1": "Análisis", "c2": "Estadísticas de uso anónimas", "c3": "Opt-in" }
      },
      "body": "Puede gestionar sus preferencias en cualquier momento desde el banner de cookies (al primer acceso) o desde «Configuración → Cookies». No utilizamos cookies de seguimiento publicitario."
    },
    "s4": {
      "title": "4. Eliminación de cuenta",
      "intro": "Puede solicitar la eliminación completa de su cuenta en cualquier momento. El procedimiento incluye un período de gracia para evitar las eliminaciones accidentales:",
      "step1": "<strong>Solicitar la eliminación</strong> desde «Configuración → Cuenta → Eliminar mi cuenta». Una confirmación por email es necesaria.",
      "step2": "<strong>Período de gracia de 30 días</strong>: durante este tiempo, su cuenta es <em>desactivada</em> pero no eliminada. Puede revertir la solicitud iniciando sesión.",
      "step3": "<strong>Eliminación efectiva</strong> después de 30 días: sus datos personales se borran salvo las informaciones legales obligatorias (recibos, audit logs).",
      "danger": "<strong>La eliminación es irreversible</strong> después del período de gracia. Sus solicitudes en curso, sus documentos y su histórico se borran. Algunos datos legalmente conservados (recibos, audit logs) se mantienen durante 10 años pero se anonimizan.",
      "body": "Detalles completos en la página dedicada <a href=\"17-eliminar-cuenta.html\" class=\"coming-soon\">Eliminar cuenta</a>."
    },
    "s5": {
      "title": "5. Contacto y reclamaciones",
      "intro": "Para toda pregunta o reclamación relativa a sus datos personales o al uso de Facil:",
      "c1": "<strong>Soporte general</strong>: tickets en la sección «Soporte» (después de iniciar sesión)",
      "c2": "<strong>Email contacto</strong>: <code>facilege26@gmail.com</code>",
      "c3": "<strong>Reclamaciones RGPD</strong>: especifique «RGPD» en el asunto del email",
      "c4": "<strong>Autoridad de control</strong>: si su reclamación no ha recibido respuesta satisfactoria, puede contactar con la autoridad nacional de protección de datos.",
      "success": "Si tiene una pregunta no cubierta aquí, el asistente IA público puede ayudarle a navegar entre los textos legales o redirigirle al canal apropiado."
    },
    "prev": "← Anterior: Verificar un recibo",
    "next": "Siguiente: Crear cuenta →"
  },

  // ---- page11 — Crear cuenta ----
    "page11": {
      "html_title": "Crear cuenta — Manual Facil",
      "title": "Crear su cuenta Facil",
      "description": "Para realizar trámites administrativos en Facil (presentar una solicitud, pagar una tasa, descargar un recibo) necesita una cuenta personal. La creación es gratuita, en línea, y le toma 3-5 minutos.",
      "next": "Siguiente: Iniciar sesión →",
      "prev": "← Anterior: Información legal",
      "toc": {
        "s1": "1. Elegir el tipo de cuenta",
        "s2": "2. Rellenar los datos personales",
        "s3": "3. Verificar el correo electrónico",
        "s4": "4. Crear la contraseña",
        "s5": "5. Diferencias Web vs Móvil",
        "s6": "6. Errores frecuentes"
      },
      "s1": {
        "title": "1. Elegir el tipo de cuenta",
        "intro": "Al iniciar la creación, debe elegir entre 2 tipos de cuenta — la elección determina los campos a rellenar y los servicios disponibles después de la conexión:",
        "table": {
          "col1": "Tipo", "col2": "Para quién", "col3": "Documentos requeridos",
          "r1": { "c1": "Ciudadano", "c2": "Particular que realiza trámites para sí mismo o su familia", "c3": "DIP (nacionales) o NIE (residentes extranjeros)" },
          "r2": { "c1": "Empresa", "c2": "Representante legal de una empresa registrada en Guinea Ecuatorial", "c3": "NIF de la empresa + DIP/NIE del representante" }
        },
        "fig1": {
          "alt": "Pantalla de registro con selector tipo de cuenta",
          "caption": "Pantalla de registro Web — selector «Tipo de cuenta» (Ciudadano seleccionado por defecto / Empresa) seguido de los campos Nombre, Apellido, Correo, Teléfono, Contraseña, y CTA «Crear una cuenta»."
        },
        "info": "Si gestiona varias empresas, comience por crear su cuenta personal (tipo Ciudadano) y luego añada las empresas mediante <a href=\"42-gestion-empresas.html\" class=\"coming-soon\">Gestionar empresas</a>. Esto le permite cambiar entre sus diferentes roles desde el mismo inicio de sesión."
      },
      "s2": {
        "title": "2. Rellenar los datos personales",
        "intro": "Los campos varían según el tipo de cuenta elegido:",
        "citizen": {
          "title": "Cuenta Ciudadano",
          "f1": "<strong>Nombre y apellidos</strong> — exactamente como aparecen en su DIP/NIE (acentos, mayúsculas)",
          "f2": "<strong>Correo electrónico</strong> — un email personal al que tenga acceso (no uno desactivado, no un email temporal)",
          "f3": "<strong>Teléfono</strong> — número móvil con prefijo internacional (+240 para Guinea Ecuatorial)"
        },
        "business": {
          "title": "Cuenta Empresa",
          "f1": "<strong>NIF de la empresa</strong> — Número de Identificación Fiscal único, exactamente como aparece en el certificado de registro",
          "f2": "<strong>Nombre comercial</strong> — denominación oficial registrada",
          "f3": "<strong>Datos del representante legal</strong> — nombre, DIP/NIE, email profesional, teléfono"
        },
        "fig1": {
          "alt": "Pantalla móvil registro etapa 1/2",
          "caption": "Pantalla móvil — etapa 1/2 «Crea tu cuenta Facil» con el campo email y el botón «Enviar código» de verificación."
        }
      },
      "s3": {
        "title": "3. Verificar el correo electrónico",
        "intro": "Después de validar la etapa 1, Facil envía un <strong>código de verificación de 6 cifras</strong> a su correo electrónico. Este código tiene una validez de <strong>15 minutos</strong>.",
        "step1": "Abra su buzón de correo (incluya la carpeta de spam si no aparece).",
        "step2": "Localice el email de <code>noreply@taxasge.emacsah.com</code> con el asunto «Código de verificación Facil».",
        "step3": "Copie el código de 6 cifras y pegelo en el campo correspondiente en la pantalla.",
        "step4": "Pulse <strong>«Verificar»</strong>. Si el código es correcto, accede a la etapa siguiente.",
        "warning": "Si no recibe el email después de <strong>5 minutos</strong>: (1) verifique la ortografía de la dirección email introducida, (2) consulte el spam/correo no deseado, (3) pulse «Reenviar el código» (límite : 3 reenvíos en 15 minutos)."
      },
      "s4": {
        "title": "4. Crear la contraseña",
        "intro": "La contraseña debe respetar las siguientes reglas de seguridad:",
        "r1": "<strong>Mínimo 8 caracteres</strong>",
        "r2": "<strong>Al menos 1 mayúscula</strong> (A-Z)",
        "r3": "<strong>Al menos 1 minúscula</strong> (a-z)",
        "r4": "<strong>Al menos 1 cifra</strong> (0-9)",
        "r5": "<strong>Recomendado: 1 carácter especial</strong> (!@#$%^&* etc.)",
        "r6": "No debe contener su nombre, apellido o fecha de nacimiento",
        "tip": "Use un <strong>gestor de contraseñas</strong> (Bitwarden, 1Password, o el integrado en su navegador) para generar una contraseña fuerte y guardarla. Active la <a href=\"14-2fa.html\">autenticación 2FA</a> después de crear su cuenta para una seguridad reforzada."
      },
      "s5": {
        "title": "5. Diferencias Web vs Móvil",
        "intro": "El proceso es idéntico en sustancia pero presenta algunas diferencias visuales:",
        "table": {
          "col1": "Aspecto", "col2": "Web", "col3": "Móvil",
          "r1": { "c1": "Pantalla todo-en-uno", "c3": "2 etapas separadas (email → datos)" },
          "r2": { "c1": "Selector tipo cuenta", "c2": "Botones grandes lado a lado", "c3": "Lista vertical" },
          "r3": { "c1": "Permisos cámara/contactos", "c3": "✅ (opcional, para foto perfil)" }
        }
      },
      "s6": {
        "title": "6. Errores frecuentes",
        "table": {
          "col1": "Mensaje", "col2": "Causa", "col3": "Solución"
        },
        "r1": { "c1": "«Email ya registrado»", "c2": "Una cuenta existe con este email", "c3": "Inicie sesión o use «Contraseña olvidada»" },
        "r2": { "c1": "«DIP/NIF ya registrado»", "c2": "Su identidad ya está vinculada a una cuenta", "c3": "Recupere la cuenta original o contacte al soporte" },
        "r3": { "c1": "«Código incorrecto»", "c2": "Código mal copiado o caducado (>15 min)", "c3": "Solicite un nuevo código mediante «Reenviar»" },
        "r4": { "c1": "«Contraseña demasiado débil»", "c2": "No cumple las reglas de la sección 4", "c3": "Añada mayúscula + cifra + carácter especial" },
        "success": "Su cuenta está creada. Ya puede <a href=\"12-iniciar-sesion.html\">iniciar sesión</a> y comenzar sus trámites. Le recomendamos activar la <a href=\"14-2fa.html\">autenticación 2FA</a> de inmediato para proteger su cuenta."
      }
    },
  
    // ---- page12 — Iniciar sesión ----
    "page12": {
      "html_title": "Iniciar sesión — Manual Facil",
      "title": "Iniciar sesión en Facil",
      "description": "Acceda a su cuenta personal con su email y contraseña. Si tiene la autenticación 2FA activada, deberá introducir además un código TOTP. La aplicación móvil ofrece adicionalmente acceso por biometría (huella o reconocimiento facial).",
      "next": "Siguiente: Recuperar contraseña →",
      "prev": "← Anterior: Crear cuenta",
      "toc": {
        "s1": "1. Acceder a la pantalla de inicio de sesión",
        "s2": "2. Introducir email y contraseña",
        "s3": "3. Código 2FA (si está activado)",
        "s4": "4. Acceso biométrico (móvil)",
        "s5": "5. Recordar la sesión",
        "s_valid": "6. Validación de campos en tiempo real",
        "s6": "7. Problemas frecuentes"
      },
      "s1": {
        "title": "1. Acceder a la pantalla de inicio de sesión",
        "intro": "Desde la pantalla de bienvenida, pulse el botón <strong>«Iniciar sesión»</strong> (azul, en la parte inferior). En la versión Web, también puede usar la URL directa <code>https://taxasge.emacsah.com/login</code>.",
        "fig1": {
          "alt": "Pantalla móvil login en español",
          "caption": "Pantalla móvil de inicio de sesión (versión española) — logo Facil, mensaje «Bienvenido de nuevo», campos email + contraseña, enlace «¿Contraseña olvidada?»."
        },
        "fig2": {
          "alt": "Pantalla web login estado vacío",
          "caption": "Pantalla web de inicio de sesión — pestaña «Iniciar Sesión» activa, campos vacíos con placeholders <code>su@correo.com</code>, header público accesible (Servicios, Licencias, Calculadora...)."
        }
      },
      "s2": {
        "title": "2. Introducir email y contraseña",
        "step1": "Escriba el <strong>email</strong> con el que se registró (no use un alias o apodo).",
        "step2": "Introduzca la <strong>contraseña</strong>. El icono de ojo le permite verificar lo que escribe (útil si tiene dudas).",
        "step3": "Pulse <strong>«Iniciar sesión»</strong>.",
        "fig1": {
          "alt": "Pantalla web login con email pre-rellenado",
          "caption": "Ejemplo Web con email pre-rellenado por el navegador (función de autocompletar) — gana tiempo al volver a conectarse."
        },
        "warning": "Después de <strong>5 intentos fallidos</strong>, su cuenta es <strong>bloqueada durante 15 minutos</strong> por seguridad. Después de <strong>10 intentos fallidos en 24h</strong>, recibirá un email de alerta y un bloqueo más largo (1h). Si recibe esta alerta sin intentar conectarse, alguien intenta acceder a su cuenta — cambie su contraseña inmediatamente."
      },
      "s3": {
        "title": "3. Código 2FA (si está activado)",
        "intro": "Si ha activado la <a href=\"14-2fa.html\">autenticación de dos factores</a>, una segunda pantalla aparece después de la contraseña. Tiene <strong>30 segundos</strong> para introducir el código TOTP de 6 cifras de su aplicación de autenticación (Google Authenticator, Authy, Microsoft Authenticator).",
        "body": "Si pierde acceso a su aplicación 2FA (teléfono perdido o destruido), use uno de los <strong>10 códigos de respaldo</strong> que le entregamos al activar el 2FA. Si los ha perdido también, contacte al soporte presentando una prueba de identidad."
      },
      "s4": {
        "title": "4. Acceso biométrico (solo móvil)",
        "intro": "Después de iniciar sesión por primera vez en la aplicación móvil, Facil le propone activar el <strong>desbloqueo biométrico</strong> (huella digital o reconocimiento facial según su teléfono).",
        "body": "Una vez activado, las próximas conexiones se hacen con un simple gesto biométrico — sin necesidad de reescribir su email, contraseña o código 2FA. La biometría es local a su teléfono (los datos no salen del aparato), conforme a las normas de seguridad iOS Secure Enclave / Android StrongBox.",
        "info": "La biometría puede desactivarse en cualquier momento desde <a href=\"16-seguridad.html\">Seguridad</a>. En caso de fallo (huella sucia, gafas que perturban Face ID), siempre puede volver al inicio de sesión clásico email + contraseña."
      },
      "s5": {
        "title": "5. Recordar la sesión",
        "intro": "La opción <strong>«Recordarme»</strong> (visible bajo el campo contraseña) le mantiene conectado durante <strong>30 días</strong> en este dispositivo, incluso después de cerrar el navegador o la aplicación. Útil en su teléfono personal — desaconsejado en un ordenador público o compartido.",
        "body": "Si no la marca, su sesión expira al cerrar el navegador (web) o al pasar 30 minutos de inactividad (móvil), por seguridad."
      },
      "s_valid": {
        "title": "6. Validación de campos en tiempo real",
        "intro": "La aplicación valida sus entradas <strong>en tiempo real</strong> mientras escribe — sin necesidad de pulsar «Iniciar sesión» para ver los errores. Útil para detectar errores tipográficos antes de enviar el formulario.",
        "email": {
          "title": "Validación del formato de email",
          "body": "Si introduce un email mal formado (ej. «yy» sin <code>@</code>, falta del dominio), el campo se enmarca en <strong>rojo</strong> y el mensaje «Invalid email address» / «Dirección de correo inválida» aparece debajo. La contraseña se enmarca en <strong>verde</strong> si está rellenada correctamente, lo que permite ver de un vistazo qué campo necesita corrección."
        },
        "fig1": {
          "alt": "Validación email inválido",
          "caption": "Pantalla móvil — campo email enmarcado en rojo con mensaje «Invalid email address» (ejemplo entrada «yy»). Campo password enmarcado en verde porque está correctamente rellenado. Teclado abierto. (Captura en versión inglesa, comportamiento idéntico en español)"
        },
        "form": {
          "title": "Formulario completo válido",
          "body": "Cuando los 2 campos son válidos, el formulario muestra el botón <strong>«Sign In» / «Iniciar sesión»</strong> activo (verde lleno). El enlace <strong>«Forgot your password?»</strong> es siempre visible debajo del campo password. La parte inferior contiene la pregunta <strong>«Don't have an account? Create Account»</strong> hacia la página <a href=\"11-crear-cuenta.html\">Crear cuenta</a>."
        },
        "fig2": {
          "alt": "Formulario login completo",
          "caption": "Pantalla móvil completa con los 2 campos rellenados, botón «Sign In» activo en verde, enlace «Forgot your password?» y CTA «Don't have an account? Create Account» abajo. (Captura en versión inglesa)"
        },
        "tip": "El icono de ojo en el campo password permite mostrar/ocultar la contraseña — útil si tiene dudas sobre lo que ha escrito antes de validar."
      },
      "s6": {
        "title": "7. Problemas frecuentes",
        "table": {
          "col1": "Síntoma", "col2": "Solución"
        },
        "r1": { "c1": "«Email o contraseña incorrectos»", "c2": "Verifique mayúsculas/minúsculas. Si la duda persiste, use <a href=\"13-recuperar-contrasena.html\">Recuperar contraseña</a>." },
        "r2": { "c1": "«Cuenta bloqueada»", "c2": "Espere 15 minutos (5 intentos fallidos) o 1 hora (10 intentos en 24h)." },
        "r3": { "c1": "«Código 2FA inválido»", "c2": "Sincronice el reloj de su teléfono (los códigos TOTP dependen de la hora). Use un código de respaldo si su teléfono está desincronizado." },
        "r4": { "c1": "No recibe email de alerta", "c2": "Verifique el spam. La dirección email registrada puede ser obsoleta — contacte al soporte." },
        "success": "Está conectado. Ya puede acceder a su panel principal y realizar sus trámites."
      }
    },
  
    // ---- page13 — Recuperar contraseña ----
    "page13": {
      "html_title": "Recuperar contraseña — Manual Facil",
      "title": "Recuperar su contraseña",
      "description": "Si ha olvidado su contraseña, no necesita crear una nueva cuenta. El procedimiento de recuperación restablece su acceso en menos de 5 minutos vía un enlace seguro enviado a su email.",
      "next": "Siguiente: Autenticación 2FA →",
      "prev": "← Anterior: Iniciar sesión",
      "captures_intro": "<strong>Esta página combina el flujo textual con capturas reales</strong> de las pantallas Web y Móvil. El diagrama ASCII de la sección 2 sigue siendo útil para visualizar el conjunto del intercambio frontend ↔ backend.",
      "toc": {
        "s1": "1. Solicitar el enlace de recuperación",
        "s2": "2. Flujo completo (diagrama)",
        "s3": "3. Recibir y abrir el email",
        "s4": "4. Definir una nueva contraseña",
        "s5": "5. Notas de seguridad",
        "s6": "6. Sin acceso al email registrado"
      },
      "s1": {
        "title": "1. Solicitar el enlace de recuperación",
        "step1": "Vaya a la pantalla de <a href=\"12-iniciar-sesion.html\">inicio de sesión</a>.",
        "step2": "Pulse el enlace <strong>«¿Contraseña olvidada?»</strong> situado bajo el campo contraseña.",
        "step3": "Introduzca el <strong>email</strong> asociado a su cuenta. Use exactamente el mismo email con el que se registró (sensible a mayúsculas).",
        "step4": "Pulse <strong>«Enviar el enlace»</strong>.",
        "step5": "Aparece un mensaje de confirmación: «Si una cuenta existe con este email, recibirá un enlace en pocos minutos». Por seguridad, el sistema no revela si el email está realmente registrado o no.",
        "web": {
          "title": "Versión Web — «¿Olvidó su contraseña?»",
          "body": "En la versión Web, la URL directa es <code>https://taxasge.emacsah.com/es/auth/forgot-password</code>. La pantalla muestra el título «¿Olvidó su contraseña?» con la tarjeta «Restablecer contraseña», un campo email + botón <strong>«Enviar enlace de restablecimiento»</strong>, y un enlace «← Volver al inicio de sesión».",
          "fig": {
            "alt": "Página web ¿Olvidó su contraseña?",
            "caption": "Página web «¿Olvidó su contraseña?» (URL <code>taxasge.emacsah.com/es/auth/forgot-password</code>) — header con menú de navegación, tarjeta central con campo email + botón verde «Enviar enlace de restablecimiento» + enlace «Volver al inicio de sesión»."
          }
        },
        "mobile": {
          "title": "Versión Móvil — «Reset password»",
          "body": "En la aplicación móvil, una pantalla simple presenta el icono de cadena con flecha de actualización, el título <strong>«Reset password»</strong>, una breve explicación, el campo email + botón verde <strong>«Send reset link»</strong>. Botón «← Back» arriba a la izquierda para regresar al login.",
          "fig": {
            "alt": "Pantalla móvil reset password",
            "caption": "Pantalla móvil «Reset password» — icono cerradura+flecha verde, título centrado, instrucción «Enter your email address and we'll send you a link to reset your password», campo email pre-rellenado + botón verde «Send reset link» abajo. (Captura en versión inglesa)"
          }
        }
      },
      "s2": {
        "title": "2. Flujo completo (diagrama)",
        "diagram": "┌─────────────────┐        ┌──────────────────┐\n│   USUARIO       │        │  FRONTEND FACIL  │\n│ Olvidó MDP      ├───────►│  /forgot-password│\n└─────────────────┘        └────────┬─────────┘\n                                    │ POST {email}\n                                    ▼\n                          ┌─────────────────────┐\n                          │   BACKEND           │\n                          │ 1. Verifica email   │\n                          │    en BD            │\n                          │ 2. Genera token     │\n                          │    (24h validez)    │\n                          │ 3. Envía email      │\n                          │    con enlace       │\n                          └─────────┬───────────┘\n                                    │\n                                    ▼\n                          ┌─────────────────────┐\n                          │  EMAIL ENVIADO      │\n                          │  asunto: Recupere su│\n                          │  contraseña Facil   │\n                          │  link: /reset/{token}│\n                          └─────────┬───────────┘\n                                    │\n                       Usuario abre │ enlace\n                                    ▼\n                          ┌─────────────────────┐\n                          │  /reset/{token}     │\n                          │  Form: nueva contraseña │\n                          │  Form: confirmación │\n                          └─────────┬───────────┘\n                                    │ POST {token, nueva}\n                                    ▼\n                          ┌─────────────────────┐\n                          │   BACKEND           │\n                          │ 1. Verifica token   │\n                          │    válido + no usado│\n                          │ 2. Aplica reglas    │\n                          │    contraseña       │\n                          │ 3. Hash + guarda    │\n                          │    bcrypt 12 rounds │\n                          │ 4. Invalida token   │\n                          │ 5. Cierra sesiones  │\n                          │    activas          │\n                          └─────────┬───────────┘\n                                    │\n                                    ▼\n                          ┌─────────────────────┐\n                          │  ✅ Acceso restaurado│\n                          │  Email confirmación │\n                          │  enviado            │\n                          └─────────────────────┘"
      },
      "s3": {
        "title": "3. Recibir y abrir el email",
        "intro": "El email arriba en su buzón en menos de <strong>2 minutos</strong>. Características:",
        "f1": "<strong>Remitente</strong> : <code>noreply@taxasge.emacsah.com</code>",
        "f2": "<strong>Asunto</strong> : «Recupere su contraseña Facil»",
        "f3": "<strong>Enlace de un solo uso</strong>, válido durante <strong>24 horas</strong>",
        "f4": "<strong>Información de seguridad</strong> : IP del solicitante + navegador (para detectar abusos)",
        "warning": "Si el email no llega después de 5 minutos: (1) revise su carpeta de spam; (2) verifique que el email introducido es correcto; (3) puede solicitar un nuevo enlace 30 segundos después del anterior.",
        "confirm": {
          "title": "Pantalla de confirmación móvil",
          "body": "Tras pulsar «Send reset link» en móvil, una pantalla de confirmación aparece con icono email validado, título <strong>«Reset password»</strong>, mensaje «If your email is registered, you'll receive a link to reset your password», un enlace <strong>«Resend code»</strong> (reutilizable después de 30 segundos) y un botón <strong>«Back to sign in»</strong>.",
          "fig": {
            "alt": "Pantalla móvil confirmación envío",
            "caption": "Pantalla móvil de confirmación — icono email verificado verde, título, mensaje informativo, enlace «Resend code» y botón verde «Back to sign in». (Captura en versión inglesa)"
          }
        }
      },
      "s4": {
        "title": "4. Definir una nueva contraseña",
        "step1": "Pulse el enlace en el email — abre la página <code>/reset/{token}</code> en su navegador.",
        "step2": "Introduzca su <strong>nueva contraseña</strong> (mismas reglas que en <a href=\"11-crear-cuenta.html\">creación de cuenta</a>: mín. 8 caracteres, mayúscula, cifra).",
        "step3": "Confírmela en el segundo campo.",
        "step4": "Pulse <strong>«Guardar la nueva contraseña»</strong>.",
        "step5": "Será redirigido automáticamente a la pantalla de inicio de sesión. Conéctese con su nueva contraseña.",
        "tip": "No reutilice una contraseña ya usada en otro sitio. Use un <strong>gestor de contraseñas</strong> para generar y almacenar una contraseña aleatoria fuerte. Si tiene 2FA activado, sigue activo después del cambio (no necesita reconfigurarlo)."
      },
      "s5": {
        "title": "5. Notas de seguridad",
        "f1": "<strong>Cierre automático de sesiones</strong>: al cambiar la contraseña, todas sus sesiones activas se cierran automáticamente (todos los dispositivos donde estaba conectado). Deberá conectarse de nuevo en cada uno.",
        "f2": "<strong>Email de confirmación</strong>: recibirá un email confirmando el cambio. Si no es usted quien lo ha hecho, contacte al soporte y bloquee su cuenta inmediatamente.",
        "f3": "<strong>Token de un solo uso</strong>: el enlace recibido por email no puede ser reutilizado. Una vez cambiada la contraseña, el enlace queda inválido.",
        "f4": "<strong>Caducidad 24h</strong>: si no usa el enlace en las 24 horas, expira. Solicite uno nuevo."
      },
      "s6": {
        "title": "6. Si ya no tiene acceso al email registrado",
        "intro": "El procedimiento estándar requiere acceso al email. Si lo ha perdido (cuenta cerrada, email del trabajo desactivado, etc.), <strong>contacte directamente al soporte Facil</strong>:",
        "step1": "Envíe un email a <code>facilege26@gmail.com</code> con el asunto «Recuperación de cuenta - email perdido».",
        "step2": "Adjunte una <strong>copia de su DIP/NIE</strong> (foto clara, frente y dorso).",
        "step3": "Indique su <strong>nuevo email</strong> al que desea asociar la cuenta.",
        "step4": "El equipo de soporte verifica su identidad y le contesta en <strong>48-72 horas hábiles</strong>.",
        "success": "Su acceso ha sido restablecido. Considere activar la autenticación 2FA para una protección adicional."
      }
    },
  
    // ---- page14 — Autenticación 2FA ----
    "page14": {
      "html_title": "Autenticación 2FA — Manual Facil",
      "title": "Autenticación de dos factores (2FA)",
      "description": "La autenticación de dos factores (2FA) basada en TOTP es la protección más fuerte contra el robo de su cuenta. Activarla añade un código de 6 cifras generado por una aplicación de autenticación cada vez que inicia sesión — incluso si alguien obtiene su contraseña, no puede entrar sin su teléfono.",
      "next": "Siguiente: Su perfil →",
      "prev": "← Anterior: Recuperar contraseña",
      "toc": {
        "s1": "1. ¿Por qué activar el 2FA?",
        "s2": "2. Aplicaciones recomendadas",
        "s3": "3. Activar el 2FA paso a paso",
        "s4": "4. Códigos de respaldo",
        "s5": "5. Uso diario",
        "s6": "6. Desactivar el 2FA"
      },
      "s1": {
        "title": "1. ¿Por qué activar el 2FA?",
        "intro": "El 2FA protege su cuenta incluso si su contraseña es comprometida (filtración, phishing, ataque de fuerza bruta). Cifras concretas:",
        "f1": "Sin 2FA, una cuenta con contraseña filtrada es comprometida en <strong>menos de 24 horas</strong> en promedio.",
        "f2": "Con 2FA, el atacante necesitaría además su teléfono — riesgo casi nulo a distancia.",
        "f3": "El 2FA es <strong>obligatorio</strong> para los agentes públicos y administradores. <strong>Recomendado fuertemente</strong> para todos."
      },
      "s2": {
        "title": "2. Aplicaciones recomendadas",
        "intro": "Necesita una aplicación de autenticación TOTP (Time-based One-Time Password) en su teléfono. Las más usadas:",
        "table": {
          "col1": "Aplicación", "col2": "Plataformas", "col3": "Ventajas",
          "r1": { "c3": "Simple, gratuito, soporte exportación entre teléfonos" },
          "r2": { "c3": "Sincronización multi-dispositivo, copia de seguridad cifrada en la nube" },
          "r3": { "c3": "Notificaciones push, integración con cuentas Microsoft" },
          "r4": { "c2": "Multiplataforma", "c3": "Integrado con su gestor de contraseñas (rellena códigos automáticamente)" }
        },
        "info": "<strong>Evite los SMS para 2FA</strong> — son interceptables (ataques SIM swap). El TOTP funciona offline, no depende de la red móvil, y es mucho más seguro."
      },
      "s3": {
        "title": "3. Activar el 2FA paso a paso",
        "step1": "Conéctese a su cuenta y vaya a <strong>Configuración → Seguridad</strong>.",
        "step2": "En la tarjeta «Autenticación 2FA», pulse el <strong>conmutador para activarlo</strong>.",
        "step3": "Aparece un modal con un <strong>QR código</strong> y un código manual alfanumérico.",
        "step4": "Abra su aplicación de autenticación → «Añadir cuenta» → «Escanear QR código» → apunte la cámara hacia el QR de la pantalla. La cuenta «Facil» se añade automáticamente con un código que cambia cada 30 segundos.",
        "step5": "Si no puede escanear (problema cámara), copie el código manual y peguelo en su aplicación («Añadir cuenta» → «Manualmente»).",
        "step6": "Pulse <strong>«He escaneado el QR»</strong> en Facil. Una pantalla le pide introducir el código actual de su aplicación (6 cifras) para validar la activación.",
        "step7": "Tras la validación, recibirá <strong>10 códigos de respaldo</strong> a un solo uso (sección 4).",
        "fig1": {
          "alt": "Modal activación 2FA con QR code",
          "caption": "Modal de activación 2FA — Pantalla con el QR código (centro) + código manual alfanumérico (ejemplo: <code>NC7BEZNWYTNDF53VQURQ2LA6MLYZGHPB</code>) + lista de aplicaciones recomendadas (Google/Authy/Microsoft) + botón «J'ai scanné le QR code» (capturado en versión francesa)."
        }
      },
      "s4": {
        "title": "4. Códigos de respaldo (10 únicos)",
        "intro": "Tras activar el 2FA, Facil le entrega <strong>10 códigos de respaldo</strong> alfanuméricos a un solo uso. Estos códigos le permiten conectarse si pierde acceso a su aplicación de autenticación (teléfono perdido, robado, destruido).",
        "guarda": {
          "title": "Cómo guardarlos correctamente",
          "f1": "<strong>Imprimirlos</strong> y guardarlos en un lugar seguro (caja fuerte, archivos personales)",
          "f2": "<strong>Guardarlos en su gestor de contraseñas</strong> (Bitwarden, 1Password) cifrados",
          "f3": "<strong>NO</strong> guardarlos en notas no cifradas en su teléfono o como captura de pantalla",
          "f4": "<strong>NO</strong> compartirlos con nadie"
        },
        "uso": {
          "title": "Cómo usarlos",
          "body": "En la pantalla de inicio de sesión 2FA, pulse el enlace <strong>«Usar un código de respaldo»</strong> en lugar de introducir el código TOTP. Introduzca uno de los 10 códigos. Tras uso, ese código se invalida — quedan 9. Si los gasta todos, deberá regenerar nuevos códigos desde Configuración → Seguridad."
        },
        "danger": "Si pierde su teléfono <strong>Y</strong> sus códigos de respaldo, deberá contactar al <a href=\"29-soporte-web.html\" class=\"coming-soon\">soporte</a> presentando una prueba de identidad (DIP/NIE) — el plazo de tratamiento es de 5-10 días hábiles. Es la peor situación posible — siempre conserve sus códigos de respaldo."
      },
      "s5": {
        "title": "5. Uso diario con 2FA activo",
        "intro": "Tras activar el 2FA, su flujo de inicio de sesión cambia ligeramente:",
        "step1": "Email + contraseña como de costumbre.",
        "step2": "Una segunda pantalla aparece pidiendo el <strong>código TOTP</strong> de su aplicación.",
        "step3": "Abra su aplicación → encuentre la entrada «Facil» → copie el código de 6 cifras (renueva cada 30 segundos).",
        "step4": "Pegue el código en Facil → conexión completada.",
        "body": "Tiempo total ~10 segundos suplementarios. Si activa el <strong>«Recordar este dispositivo»</strong> después de la validación, no se le pedirá el código 2FA durante 30 días en este dispositivo (a usar con prudencia, solo en su teléfono personal)."
      },
      "s6": {
        "title": "6. Desactivar el 2FA",
        "intro": "No recomendado, pero posible si tiene problemas con su aplicación de autenticación:",
        "step1": "Conéctese y vaya a <strong>Configuración → Seguridad</strong>.",
        "step2": "Pulse el conmutador 2FA para desactivarlo.",
        "step3": "Confirme con su contraseña + un código TOTP válido (o un código de respaldo).",
        "step4": "El 2FA está desactivado. Su cuenta solo está protegida por la contraseña.",
        "warning": "Recibirá un email de confirmación. Si no es usted quien lo ha desactivado, su cuenta está comprometida — cambie su contraseña inmediatamente y reactive el 2FA.",
        "success": "El 2FA es la mejor protección que puede activar en menos de 5 minutos. Si aún no lo ha hecho, hágalo ahora — su cuenta lo agradecerá."
      }
    },
  
    // ---- page15 — Su perfil ----
    "page15": {
      "html_title": "Su perfil — Manual Facil",
      "title": "Su perfil personal",
      "description": "El perfil reúne todos sus datos personales en Facil, organizados en 4 pestañas: información personal, información de cuenta, preferencias de notificaciones, y verificación de funcionario (si aplicable). Acceda desde el menú lateral «Perfil».",
      "next": "Siguiente: Seguridad →",
      "prev": "← Anterior: Autenticación 2FA",
      "toc": {
        "s1": "1. Pestaña «Información personal»",
        "s2": "2. Pestaña «Información de cuenta»",
        "s3": "3. Pestaña «Notificaciones»",
        "s4": "4. Pestaña «Verificación funcionario»"
      },
      "s1": {
        "title": "1. Pestaña «Información personal»",
        "intro": "Por defecto cuando abre su perfil. Contiene los datos personales declarados en la creación de cuenta. Pulse <strong>«Modificar»</strong> abajo para entrar en modo edición.",
        "editable": {
          "title": "Campos modificables",
          "f1": "<strong>Nombre y apellidos</strong> — corregir errores ortográficos",
          "f2": "<strong>Email</strong> — requiere una nueva verificación por email",
          "f3": "<strong>Teléfono</strong> — requiere una verificación por SMS",
          "f4": "<strong>Tipo y número de documento</strong> (DIP/NIE) — atención: si se equivoca aquí, la mayoría de sus solicitudes futuras serán rechazadas",
          "f5": "<strong>Dirección postal y ciudad</strong> — útil para los envíos físicos (carnets, certificados)"
        },
        "fig1": {
          "alt": "Pestaña Información personal",
          "caption": "Pestaña «Informaciones personales» — campos Nombre, Apellido, Email (verificado), Teléfono, Tipo+Número de documento, Dirección, Ciudad. Botón «Modificar» abajo a la derecha."
        },
        "warning": "Si modifica el <strong>nombre, apellidos o número DIP</strong>, las solicitudes activas pueden ser rechazadas porque los datos OCR de los documentos subidos ya no coinciden. Mejor terminar las solicitudes en curso antes de modificar estos campos."
      },
      "s2": {
        "title": "2. Pestaña «Información de cuenta»",
        "intro": "Información <strong>técnica de su cuenta</strong>, no modificable directamente. Útil para soporte y para tener una visión general de su perfil:",
        "f1": "<strong>Rol</strong> : Ciudadano / Empresa / Comptable / Agente / Administrador (definido a la creación)",
        "f2": "<strong>Estado</strong> : Activo / Suspendido / Pendiente verificación / Desactivado",
        "f3": "<strong>Fecha de creación</strong> de la cuenta",
        "f4": "<strong>2FA</strong> : Activado / Desactivado (con enlace directo a <a href=\"14-2fa.html\">la página 2FA</a>)",
        "f5": "<strong>Última conexión</strong> : fecha + hora de su último login (verifique aquí si detecta una conexión sospechosa)",
        "f6": "<strong>Enlace «Configuración de seguridad»</strong> hacia la página <a href=\"16-seguridad.html\">Seguridad</a>",
        "fig1": {
          "alt": "Pestaña Información de cuenta",
          "caption": "Pestaña «Informaciones de la cuenta» — Rol=Ciudadano, Estado=Activo, fechas, 2FA Desactivada, última conexión, enlace «Configuración de seguridad»."
        }
      },
      "s3": {
        "title": "3. Pestaña «Notificaciones»",
        "intro": "Configure cómo Facil le contacta. 2 grupos de preferencias:",
        "idioma": {
          "title": "Idioma preferido",
          "body": "Elija el idioma de los emails, SMS, push y la interfaz: <strong>Español</strong> (por defecto), <strong>Francés</strong> o <strong>Inglés</strong>. Le aconsejamos elegir el idioma que utiliza con sus interlocutores administrativos para evitar errores de comprensión."
        },
        "canales": {
          "title": "Canales de notificación",
          "f1": "<strong>Email</strong> (activo por defecto) — actualizaciones de estado, alertas de plazo, recibos PDF",
          "f2": "<strong>Push notifications</strong> (activo por defecto, solo móvil) — alertas instantáneas",
          "f3": "<strong>SMS</strong> (desactivado por defecto) — útil sin internet, pero coste para el operador"
        },
        "fig1": {
          "alt": "Pestaña Notificaciones",
          "caption": "Pestaña «Notificaciones» — selector de idioma (FR seleccionado en este ejemplo), 3 conmutadores (Email ON, Push ON, SMS OFF), botón «Guardar las preferencias»."
        },
        "info": "Algunas notificaciones son <strong>obligatorias</strong> y no pueden desactivarse: alertas de seguridad (cambio de contraseña, conexión sospechosa, activación 2FA), validaciones de pago. Solo las notificaciones marketing y promocionales son opcionales."
      },
      "s4": {
        "title": "4. Pestaña «Verificación funcionario» (si aplicable)",
        "intro": "Solo para los <strong>funcionarios públicos</strong> que desean acceder a servicios reservados a su categoría (descuentos en ciertas tasas, procedimientos prioritarios). La verificación es opcional pero da acceso a beneficios.",
        "proc": {
          "title": "Procedimiento",
          "step1": "Introduzca su <strong>número de matrícula</strong> de funcionario (formato <code>FP-XXXXX</code>).",
          "step2": "Adjunte una <strong>copia del carnet de funcionario</strong> (foto frente y dorso).",
          "step3": "Tiene <strong>30 minutos</strong> para completar el formulario tras iniciarlo (cronómetro visible).",
          "step4": "Pulse <strong>«Continuar»</strong>.",
          "step5": "El equipo Función Pública verifica su matrícula en su base de datos central — el plazo es de <strong>2-5 días hábiles</strong>.",
          "step6": "Recibirá una notificación cuando la verificación esté validada (o rechazada con motivo)."
        },
        "fig1": {
          "alt": "Pestaña Verificación Funcionario",
          "caption": "Pestaña «Verificación Funcionario» — campo «Número de Matrícula» (Ej: FP-12345), aviso «Tiene 30 minutos para completar» con icono cronómetro, botón «Continuar» (deshabilitado hasta rellenar el campo)."
        },
        "success": "Tras la validación, su rol se actualiza a <strong>Funcionario</strong> y se desbloquean los descuentos y procedimientos correspondientes en su próximo trámite."
      }
    },
  
    // ---- page16 — Seguridad ----
    "page16": {
      "html_title": "Seguridad — Manual Facil",
      "title": "Configurar la seguridad de su cuenta",
      "description": "La página Seguridad agrupa todas las opciones que protegen su cuenta: contraseña, 2FA, sesiones activas, exportación RGPD. En la versión móvil añade biometría y bloqueo local de la aplicación. Acceso : Configuración → Seguridad.",
      "next": "Siguiente: Eliminar cuenta →",
      "prev": "← Anterior: Su perfil",
      "toc": {
        "s1": "1. Cambiar la contraseña",
        "s2": "2. Autenticación 2FA",
        "s3": "3. Biometría (solo móvil)",
        "s4": "4. App lock — bloqueo local (solo móvil)",
        "s5": "5. Sesiones activas",
        "s6": "6. Exportar mis datos (RGPD)"
      },
      "s1": {
        "title": "1. Cambiar la contraseña",
        "intro": "Recomendado cada <strong>6-12 meses</strong> o tras cualquier sospecha de filtración. El formulario contiene 3 campos:",
        "step1": "<strong>Contraseña actual</strong> (requisito de seguridad)",
        "step2": "<strong>Nueva contraseña</strong> (mismas reglas que en creación: 8+ chars, mayúscula, cifra)",
        "step3": "<strong>Confirmación de la nueva contraseña</strong>",
        "step4": "Pulse <strong>«Cambiar la contraseña»</strong>. Todas sus sesiones activas (web + móvil) se cierran automáticamente — deberá conectarse de nuevo en cada dispositivo.",
        "fig1": {
          "alt": "Página Configuración Seguridad",
          "caption": "Página «Configuración Seguridad» — 2 tarjetas principales: Contraseña (3 campos + botón «Cambiar la contraseña») y Autenticación 2FA (conmutador OFF/ON)."
        }
      },
      "s2": {
        "title": "2. Autenticación 2FA",
        "intro": "El conmutador 2FA en esta página activa o desactiva la autenticación de dos factores. Detalle completo del setup, códigos de respaldo y uso diario en la <a href=\"14-2fa.html\">página dedicada 2FA</a>.",
        "body": "Tras activación, podrá:",
        "f1": "<strong>Regenerar nuevos códigos de respaldo</strong> (si ha gastado los 10 originales)",
        "f2": "<strong>Cambiar de aplicación de autenticación</strong> (re-escanear un nuevo QR código)",
        "f3": "<strong>Desactivar el 2FA</strong> (no recomendado, requiere contraseña + código TOTP válido)"
      },
      "s3": {
        "title": "3. Biometría (solo móvil)",
        "intro": "En la aplicación móvil, puede activar el desbloqueo por <strong>huella digital</strong> (Touch ID, fingerprint Android) o <strong>reconocimiento facial</strong> (Face ID, reconocimiento Android). Tras la activación:",
        "f1": "Las próximas conexiones se hacen con un simple gesto biométrico (sin email + contraseña + 2FA)",
        "f2": "Los datos biométricos <strong>nunca salen de su teléfono</strong> — usan los chips seguros iOS Secure Enclave / Android StrongBox",
        "f3": "En caso de fallo (huella sucia, gafas que perturban Face ID), siempre puede volver al inicio de sesión clásico",
        "f4": "Después de <strong>5 fallos consecutivos</strong>, la biometría se desactiva temporalmente y se pide la contraseña",
        "info": "Si presta su teléfono a alguien que tiene su huella digital o cara registrada en el aparato, esa persona podrá conectarse a su cuenta Facil. Tenga cuidado con los teléfonos compartidos — desactive la biometría en este caso."
      },
      "s4": {
        "title": "4. App lock — bloqueo local (solo móvil)",
        "intro": "El App Lock añade una capa adicional <strong>al abrir la aplicación móvil</strong> (incluso sin cerrar sesión). Útil si presta su teléfono o lo deja desbloqueado.",
        "f1": "<strong>PIN local de 4-6 cifras</strong> a introducir al abrir la aplicación",
        "f2": "<strong>O biometría</strong> si está activa (más rápido)",
        "f3": "<strong>Tiempo de espera configurable</strong> : aplicar el bloqueo después de 0 segundos / 30 segundos / 1 minuto / 5 minutos / al apagar la pantalla",
        "f4": "El App Lock <strong>no reemplaza el login Facil</strong> — es solamente local al teléfono"
      },
      "s5": {
        "title": "5. Sesiones activas",
        "intro": "Lista de todos los dispositivos donde está conectado actualmente. Para cada sesión:",
        "f1": "<strong>Tipo de dispositivo</strong> (Android, iOS, Web Chrome/Firefox/Safari)",
        "f2": "<strong>Localización aproximada</strong> (ciudad, basada en la IP)",
        "f3": "<strong>Última actividad</strong> (hace 5 min, hace 2 horas, hace 3 días, etc.)",
        "f4": "<strong>Botón «Cerrar esta sesión»</strong> para desconectar este dispositivo a distancia",
        "f5": "<strong>Botón «Cerrar todas las sesiones»</strong> útil si pierde su teléfono — desconecta todo, incluida su sesión actual",
        "warning": "Si ve una sesión <strong>desconocida</strong> (tipo de dispositivo extraño, ciudad lejana, fecha sospechosa) — su cuenta está comprometida. Cierre esta sesión inmediatamente, cambie su contraseña, y active el 2FA si aún no está hecho."
      },
      "s6": {
        "title": "6. Exportar mis datos (RGPD)",
        "intro": "Conforme al RGPD, puede exportar todos sus datos personales en cualquier momento. Pulse <strong>«Exportar mis datos»</strong> y elija el formato:",
        "f1": "<strong>JSON</strong> — formato técnico, completo, importable en otras herramientas",
        "f2": "<strong>PDF</strong> — formato legible por humanos, presentable como prueba",
        "body": "El archivo se genera en algunos minutos y se descarga directamente. Contiene: datos personales, lista de solicitudes, lista de pagos, documentos subidos, audit log de las acciones, preferencias.",
        "info": "La exportación es <strong>gratuita</strong> y posible <strong>sin límite</strong> de frecuencia. Sus datos no salen de la plataforma — la exportación es para usted solamente. Para más detalles RGPD, consulte la página <a href=\"58-legal.html\">Legal</a>.",
        "success": "Su cuenta es ahora segura. Si quiere ir más lejos, considere usar un gestor de contraseñas y verificar regularmente sus sesiones activas."
      }
    },
  
    // ---- page17 — Eliminar cuenta ----
    "page17": {
      "html_title": "Eliminar cuenta — Manual Facil",
      "title": "Eliminar su cuenta Facil",
      "description": "Si ya no desea usar Facil, puede solicitar la eliminación de su cuenta. El procedimiento incluye un período de gracia de 30 días para protegerle contra las eliminaciones accidentales. Algunos datos se conservan legalmente (10 años) por obligación fiscal y administrativa.",
      "next": "Siguiente: Panel principal Web →",
      "prev": "← Anterior: Seguridad",
      "danger": "<strong>La eliminación es irreversible</strong> después del período de gracia de 30 días. Lea atentamente la sección 3 «Qué se borra realmente» antes de iniciar el procedimiento.",
      "toc": {
        "s1": "1. Alternativas antes de eliminar",
        "s2": "2. Timeline 30 días (diagrama)",
        "s3": "3. Qué se borra realmente",
        "s4": "4. Procedimiento paso a paso",
        "s5": "5. Cancelar la solicitud (durante los 30 días)",
        "s6": "6. Después de la eliminación"
      },
      "s1": {
        "title": "1. Alternativas antes de eliminar",
        "intro": "Antes de eliminar definitivamente, considere estas opciones menos drásticas:",
        "table": {
          "col1": "Si su problema es...", "col2": "Considere...",
          "r1": { "c1": "Demasiados emails de Facil", "c2": "Modificar las preferencias en <a href=\"15-perfil.html\">Perfil → Notificaciones</a> (desactivar push, SMS, mantener solo emails críticos)" },
          "r2": { "c1": "Cuenta comprometida (alguien ha robado su contraseña)", "c2": "Cambie su contraseña, active el 2FA, cierre las sesiones sospechosas — la eliminación no es necesaria" },
          "r3": { "c1": "Pausa temporal (no usa la cuenta durante varios meses)", "c2": "No es necesario eliminar — la cuenta puede permanecer inactiva indefinidamente" },
          "r4": { "c1": "Quiere descargar sus datos antes de irse", "c2": "Use «Exportar mis datos» en <a href=\"16-seguridad.html\">Seguridad</a> antes de eliminar" }
        }
      },
      "s2": {
        "title": "2. Timeline 30 días (diagrama)",
        "diagram": "DÍA 0                  DÍA 1-29              DÍA 30                DÍA 30+\n═══════               ════════════           ══════════           ══════════════\nSolicitud              Período de gracia     Eliminación          Conservación legal\nde eliminación        (cuenta desactivada)   efectiva             (10 años)\n   │                          │                  │                      │\n   │ 1. Pide eliminación      │ • Cuenta         │ • Datos personales   │ • Recibos\n   │    desde Configuración   │   inaccesible    │   borrados           │   PDF\n   │                          │   públicamente   │ • Documentos         │ • Audit log\n   │ 2. Confirma con          │ • Notificacion   │   subidos            │ • Solicitudes\n   │    contraseña + email    │   email cada     │   borrados           │ • Pagos\n   │                          │   semana         │ • Email anonimizado  │\n   │ 3. Email de confirmación │ • POSIBILIDAD    │ • Email confirmación │ Anonimizados\n   │    enviado               │   de cancelar    │   final enviado      │ (su nombre +\n   │                          │   en cualquier   │                      │ DIP están\n   │                          │   momento        │                      │ borrados,\n   │                          │                  │                      │ pero las\n   │                          │                  │                      │ referencias\n   │                          │                  │                      │ legales\n   │                          │                  │                      │ permanecen)"
      },
      "s3": {
        "title": "3. Qué se borra realmente",
        "borrado": {
          "title": "✅ Borrado al día 30",
          "f1": "<strong>Datos personales</strong> : nombre, apellidos, fecha de nacimiento, DIP/NIE, dirección, teléfono",
          "f2": "<strong>Email</strong> : reemplazado por <code>deleted-XXXXX@taxasge.emacsah.com</code>",
          "f3": "<strong>Contraseña</strong> : hash borrado",
          "f4": "<strong>Documentos subidos</strong> : copias DIP, fotos identidad, archivos personales",
          "f5": "<strong>Solicitudes en borrador</strong> (no enviadas) o canceladas",
          "f6": "<strong>Sesiones, tokens 2FA, códigos de respaldo</strong>",
          "f7": "<strong>Preferencias y notificaciones</strong>"
        },
        "conservado": {
          "title": "📦 Conservado 10 años (anonimizado)",
          "intro": "Algunos datos se conservan por <strong>obligación legal fiscal y administrativa</strong>, pero anonimizados (su nombre + identificadores son borrados, queda solo la referencia técnica) :",
          "f1": "<strong>Recibos PDF</strong> de pagos efectuados (obligación contable 10 años)",
          "f2": "<strong>Audit log</strong> de las acciones (creación de solicitud, validación de pago) — para trazabilidad legal",
          "f3": "<strong>Solicitudes completadas</strong> con su número de referencia (sin sus datos personales)",
          "f4": "<strong>Pagos validados</strong> con importe + entidad emisora (sin pagador identificado)"
        },
        "info": "Esta conservación es <strong>obligatoria por ley</strong> — no podemos borrar más, ni siquiera a su demanda explícita. Después de los 10 años, todos los datos restantes son destruidos automáticamente."
      },
      "s4": {
        "title": "4. Procedimiento paso a paso",
        "step1": "Conéctese a su cuenta y vaya a <strong>Configuración → Cuenta</strong>.",
        "step2": "Desplácese hasta abajo a la sección <strong>«Zona peligrosa»</strong> (fondo rojo).",
        "step3": "Pulse el botón <strong>«Eliminar mi cuenta»</strong>.",
        "step4": "Una pantalla de confirmación lista <strong>las consecuencias</strong> (sección 3) y le pide confirmar leyendo cada punto.",
        "step5": "Introduzca su <strong>contraseña</strong> + razón opcional (encuesta de feedback).",
        "step6": "Validar — recibe un email de confirmación con el enlace de cancelación válido durante los 30 días.",
        "step7": "Su cuenta es <strong>desactivada inmediatamente</strong>. No puede conectarse durante el período de gracia."
      },
      "s5": {
        "title": "5. Cancelar la solicitud (durante los 30 días)",
        "intro": "Durante el período de gracia, puede <strong>cancelar la eliminación</strong> de 2 formas:",
        "f1": "Pulse el enlace <strong>«Cancelar la eliminación»</strong> en el email de confirmación recibido al día 0",
        "f2": "O conéctese normalmente con sus credenciales — el sistema le propondrá automáticamente cancelar la eliminación e reactivar la cuenta",
        "body": "Tras cancelación, su cuenta se reactiva inmediatamente con todos sus datos intactos. Recibirá un email de confirmación.",
        "tip": "Recibirá un <strong>email semanal</strong> durante el período de gracia, recordándole la solicitud y el plazo restante. Estos emails contienen también el enlace de cancelación — útil si ha perdido el primer email."
      },
      "s6": {
        "title": "6. Después de la eliminación efectiva (día 30+)",
        "f1": "<strong>Email final</strong> enviado al día 30 confirmando la eliminación efectiva",
        "f2": "<strong>Su email original es liberado</strong> — puede reusarlo para crear una nueva cuenta si quiere volver a Facil",
        "f3": "<strong>Sus referencias de solicitudes pasadas</strong> permanecen verificables vía la <a href=\"57-verificar.html\">página Verify</a> con el número original (sin sus datos personales)",
        "f4": "<strong>Sus pagos pasados</strong> permanecen históricamente trazables al Tesoro Público (sin nombre)",
        "success": "Su cuenta ha sido eliminada conforme al RGPD. Si decide volver más tarde, su email queda disponible para crear una nueva cuenta."
      }
    },

  "page22": {
      "html_title": "Iniciar trámite (Web) — Manual Facil",
      "title": "Iniciar un trámite (Web) — wizard 10 etapas",
      "description": "El asistente de creación de solicitud (wizard) le guía paso a paso desde la selección del trámite hasta el pago final, en 10 etapas estructuradas. Esta página recorre el flujo completo con un ejemplo concreto: «Renovación de Certificado para Conducir» (CON-2026-00001).",
      "next": "Siguiente: Mis solicitudes →",
      "prev": "← Anterior: Panel principal",
      "toc": {
        "s1": "1. Acceder al wizard",
        "s2": "2. Seleccionar el servicio",
        "s3": "3. Wizard — 10 etapas detalladas",
        "s4": "4. Después de la creación",
        "s5": "5. Documentos generados (PDF + verificación)",
        "s6": "6. Diferencias Web vs Móvil"
      },
      "s1": {
        "title": "1. Acceder al wizard",
        "intro": "Hay 3 formas de iniciar una nueva solicitud:",
        "f1": "Desde el <a href=\"21-dashboard-web.html\">panel principal</a> → tarjeta «Nueva solicitud»",
        "f2": "Desde el menú lateral → «Solicitudes Servicios» → botón <strong>«Nueva solicitud»</strong>",
        "f3": "Desde el <a href=\"55-asistente-ia-publica.html\">asistente IA</a> → popover «Iniciar un trámite» → quick-start (Pasaporte, Conducir, Residencia, etc.)"
      },
      "s2": {
        "title": "2. Seleccionar el servicio",
        "intro": "La pantalla muestra <strong>6 categorías repliables</strong> (Identidad, Conducción, Contratos, Vehículos, Extranjería, Comercio) cada una con los servicios disponibles. Use la búsqueda en la parte superior si conoce el nombre del trámite.",
        "fig1": {
          "alt": "Pantalla de selección de servicio",
          "caption": "Pantalla «Nueva solicitud» — categorías repliables con detalle al expandir (ejemplo: Conducción → «Solicitud de Certificado para Conducir», entidad DGT, modo «Revisión de agente», requiere cita)."
        },
        "body": "Para cada servicio, ve : el <strong>nombre completo</strong>, la <strong>entidad gestora</strong> (DGT, CNEDOGE, Tesoro, etc.), el <strong>modo de tratamiento</strong> (auto-validación o revisión por agente), y si <strong>requiere cita</strong> presencial. Pulse el servicio para iniciar el wizard."
      },
      "s3": {
        "title": "3. Wizard — 10 etapas detalladas",
        "intro": "El stepper horizontal en la parte superior indica su progreso. Un <strong>cronómetro</strong> en la cabecera (29:34 al inicio) limita la sesión a 30 minutos para proteger sus datos en caso de inactividad.",
        "s1": {
          "title": "Etapa 1/10 — Tipo de Solicitud",
          "body": "Elija el tipo entre las opciones del trámite. Ejemplo Conducir : Primer Certificado (30 000 XAF), Canje Permiso Extranjero (35 000), <strong>Renovación (25 000)</strong>, Duplicado (20 000), Extensión Clases (15 000). Cada opción muestra su tarifa.",
          "fig": {
            "alt": "Etapa 1 wizard",
            "caption": "Etapa 1/10 con 5 opciones radio. Renovación 25 000 XAF seleccionado."
          }
        },
        "s2": {
          "title": "Etapa 2/10 — Tipo de Solicitante",
          "body": "Indique si es <strong>Ciudadano</strong> nacional (con DIP) o <strong>Residente Extranjero</strong> (con NIE). El sistema adapta los documentos requeridos según la elección.",
          "fig": {
            "alt": "Etapa 2 wizard",
            "caption": "Etapa 2/10 con Residente Extranjero (NIE) seleccionado. Botones Anterior / Siguiente abajo."
          }
        },
        "s3": {
          "title": "Etapa 3/10 — Clase(s) de Permiso",
          "body": "7 clases marcables (puede elegir varias) : <strong>A</strong> Motos, <strong>B</strong> Ligeros, <strong>B+</strong> Remolque, <strong>C</strong> Camiones, <strong>D</strong> Autobuses, <strong>E</strong> Articulados, <strong>F</strong> Especiales. Cada clase indica la edad mínima.",
          "fig": {
            "alt": "Etapa 3 wizard",
            "caption": "Etapa 3/10 con 7 clases. Clase E (articulados) seleccionada en este ejemplo."
          }
        },
        "s4": {
          "title": "Etapa 4/10 — Documentos requeridos (subida + OCR)",
          "body": "Lista de los documentos a aportar según las elecciones anteriores. Puede arrastrar y soltar archivos (drag-drop) o pulsar para seleccionar. Cada documento subido pasa por <strong>OCR automática</strong> que extrae los datos clave con un porcentaje de confianza visible (ej. 77%, 87%, 100%).",
          "fig1": {
            "alt": "Etapa 4 estado inicial",
            "caption": "Etapa 4/10 estado inicial — 3 zonas drag-drop vacías : Permiso de Residencia (Extranjeros) *, Certificado para Conducir Actual *, Fotografía tipo carnet."
          },
          "fig2": {
            "alt": "Etapa 4 con docs subidos",
            "caption": "Etapa 4/10 con 3 documentos subidos y procesados por OCR (residencia.jpg 77%, permiso.pdf 87%, foto.jpg 100% conf). Badges «Extraído con IA» visibles."
          }
        },
        "s5": {
          "title": "Etapas 5-7/10 — Verificar Datos (3 sub-pantallas)",
          "body": "El sistema muestra los <strong>datos extraídos por OCR</strong> agrupados en 3 sub-pantallas. Verifique cada campo. Los campos OCR son <strong>readonly</strong> — para modificarlos, regrese a la etapa 4 y reuploader el documento corregido.",
          "f1": "<strong>Etapa 5 — Datos Personales</strong> : NIE/DIP, nombre, apellidos, fecha de nacimiento, nacionalidad, dirección. Extraídos del documento de identidad.",
          "f2": "<strong>Etapa 6 — Datos de la Solicitud</strong> : tipo (Renovación), clases (E). Resumen de las elecciones de las etapas 1-3.",
          "f3": "<strong>Etapa 7 — Certificado Conducir Actual</strong> : número de registro, clases existentes, fecha de expedición, validez, antigüedad. Extraídos del certificado actual.",
          "fig1": {
            "alt": "Etapa 5 datos personales",
            "caption": "Etapa 5/10 — Datos personales OCR readonly (NIE E12495738, KOUEMOU SAH, JEAN EMAC, fecha nac, nacionalidad CMR, dirección Bioko Norte Malabo)."
          },
          "fig2": {
            "alt": "Etapa 6 datos solicitud",
            "caption": "Etapa 6/10 — Datos solicitud (Tipo=RENOVACION, Clase=E) en readonly."
          },
          "fig3": {
            "alt": "Etapa 7 certificado actual",
            "caption": "Etapa 7/10 — Certificado conducir actual : N°Registro 2700, Clases A,B,C,D,E,F, expedido 14/01/2021, válido hasta 14/01/2022, antigüedad 15/03/2010."
          }
        },
        "s6": {
          "title": "Etapa 8/10 — Programar Cita (3 sub-pantallas)",
          "body": "Si el trámite requiere una cita presencial (caso típico Conducir), 3 sub-pantallas se suceden para elegir la cita:",
          "fig1": {
            "alt": "Cita selección ubicación",
            "caption": "Sub-pantalla A — Selección de ubicación : 1 oficina disponible para este trámite (MALABO II - Oficina Principal, Malabo Insular)."
          },
          "fig2": {
            "alt": "Cita calendario",
            "caption": "Sub-pantalla B — Calendario abril 2026 con días disponibles resaltados (27, 28, 29, 30) y plazas restantes (16 espacios cada uno)."
          },
          "fig3": {
            "alt": "Cita horarios",
            "caption": "Sub-pantalla C — Selección de horario para el día 28 abril : grilla de slots 08h00-15h30 con plazas disponibles (2 espacios cada slot)."
          }
        },
        "s7": {
          "title": "Etapa 9/10 — Pago de Tasas (5 métodos)",
          "body": "Pantalla de pago con 5 métodos disponibles. Total visible arriba (25 000 XAF en este ejemplo). Pulse un método para ver los campos correspondientes.",
          "m1": "<strong>Dinero Móvil</strong> : campo número de teléfono +240 — pago instantáneo",
          "m2": "<strong>Tarjeta</strong> : Visa/Mastercard, redirige a pasarela bancaria segura",
          "m3": "<strong>Transferencia bancaria</strong> : datos IBAN del Tesoro + referencia única",
          "m4": "<strong>Efectivo</strong> : seleccionar oficina del Tesoro Público — requiere validación de agente posterior",
          "m5": "<strong>Cheque</strong> : igual que efectivo, requiere validación de agente",
          "fig1": {
            "alt": "Pago Dinero Móvil",
            "caption": "Etapa 9/10 — Dinero Móvil seleccionado : campo «Número de teléfono +240» visible. CTA «Pagar 25 000 XAF»."
          },
          "fig2": {
            "alt": "Pago Efectivo",
            "caption": "Etapa 9/10 — Efectivo seleccionado : aparece el selector «Oficina de pago» con la lista de oficinas Tesoro disponibles."
          }
        },
        "s8": {
          "title": "Etapa 10/10 — Confirmación",
          "body": "Pantalla final con el <strong>número de referencia</strong> de su solicitud (ej. CON-2026-00001), el estado actual («Solicitud registrada - Pago pendiente de validación» en el caso Efectivo), la cita programada, y 2 botones: <strong>«Descargar PDF»</strong> e <strong>«Imprimir»</strong>.",
          "fig": {
            "alt": "Confirmación final",
            "caption": "Etapa 10/10 — Referencia CON-2026-00001, ref pago CSH-..., monto 25 000 XAF, estado «Pendiente validación», cita 28/04/2026 09:00 MALABO II."
          }
        }
      },
      "s4": {
        "title": "4. Después de la creación",
        "intro": "Su solicitud aparece automáticamente en <a href=\"23-mis-solicitudes-web.html\">Mis solicitudes</a> con un <strong>stepper horizontal</strong> que muestra el progreso (88% en este ejemplo : 8 etapas verdes / 1 azul activa «Pago de Tasas»).",
        "fig1": {
          "alt": "Detalle solicitud creada",
          "caption": "Vista detalle CON-2026-00001 — stepper 88%, tabs Resumen/Documentos, tarjetas Pago (Pendiente 25 000 XAF) y Cita (28/04/26 09h MALABO II)."
        },
        "fig2": {
          "alt": "Detalle scroll",
          "caption": "Detalle (scroll abajo) — Datos personales con foto + NIE/nombre, Datos solicitud, Certificado actual, CTAs Volver / PDF."
        }
      },
      "s5": {
        "title": "5. Documentos generados",
        "intro": "El wizard genera automáticamente <strong>2 documentos PDF</strong>:",
        "d1": "<strong>Resumen de la solicitud</strong> (<a href=\"_assets/samples/solicitud_CON-2026-00001.pdf\" target=\"_blank\">ejemplo: solicitud_CON-2026-00001.pdf</a>) : foto, datos personales, datos solicitud, certificado actual, cita programada, desglose pago, QR de verificación.",
        "d2": "<strong>Recibo de pago</strong> (después de validación) : número REC-2026-XXXXX, fecha, importe, método, pagador, código del trámite, QR de verificación pública.",
        "fig1": {
          "alt": "PDF generado",
          "caption": "PDF generado solicitud_CON-2026-00001.pdf — header con logo Facil, foto, datos personales, datos solicitud, certificado actual, cita, desglose pago + QR + URL verify."
        },
        "verify": {
          "title": "Verificación pública vía QR",
          "body": "Cada PDF lleva un QR enlazando a la <a href=\"57-verificar.html\">página de verificación pública</a>. Disponible en español y francés. Útil para presentar el documento a un tercero (banco, empleador, embajada)."
        },
        "fig2": {
          "alt": "Verify ES",
          "caption": "Página verify ES (URL <code>/es/verify/CON-2026-00001?t=...</code>) — badge verde «Solicitud Verificada» con detalles ref/tipo/expedición/DGT/cita."
        },
        "fig3": {
          "alt": "Verify FR",
          "caption": "Página verify FR (mismo QR) — versión francesa «Demande Verifiee» — escaneable por interlocutores francófonos."
        },
        "fig4": {
          "alt": "PDF zoom",
          "caption": "PDF zoom — bloc Cita Programada + Desglose Pago 25 000 XAF «Pendiente validación» + QR + URL verify."
        },
        "info": "Los documentos generados se guardan automáticamente en su <a href=\"25-mis-documentos-web.html\">caja fuerte digital</a> (sección «Generados»). Recibirá también un email con los PDF como adjuntos."
      },
      "s6": {
        "title": "6. Diferencias Web vs Móvil",
        "intro": "El wizard funciona de manera idéntica en ambas plataformas, con algunas diferencias UX:",
        "table": {
          "col1": "Aspecto", "col2": "Web", "col3": "Móvil",
          "r1": { "c1": "Stepper horizontal visible siempre", "c3": "⚠ Compacto (icono ronde)" },
          "r2": { "c1": "Subida de documentos", "c2": "Drag-drop o selección archivos", "c3": "Cámara directa o galería" },
          "r3": { "c1": "Tiempo de sesión" },
          "r4": { "c1": "Pago Dinero Móvil", "c2": "Manual (introducir tel)", "c3": "Auto-detección del SIM" }
        },
        "body": "Para el detalle del wizard en versión móvil, consulte la <a href=\"32-iniciar-tramite-mobile.html\" class=\"coming-soon\">página móvil dedicada</a>.",
        "success": "Ya conoce el flujo completo. La siguiente página explica cómo seguir sus solicitudes en curso después de la creación."
      }
    },
  
    "page23": {
      "html_title": "Mis solicitudes (Web) — Manual Facil",
      "title": "Mis solicitudes de servicio",
      "description": "Centralice todas sus solicitudes en una sola pantalla con filtros, KPIs y acceso al detalle. Consulte el progreso vía un stepper visual, descargue los documentos PDF, y siga la validación por las entidades emisoras.",
      "next": "Siguiente: Mis pagos →",
      "prev": "← Anterior: Iniciar trámite",
      "toc": {
        "s1": "1. Acceder a la lista",
        "s2": "2. KPIs y filtros",
        "s3": "3. Tabla de solicitudes",
        "s4": "4. Detalle de una solicitud (stepper)",
        "s5": "5. Estados posibles"
      },
      "s1": {
        "title": "1. Acceder a la lista",
        "intro": "Desde el menú lateral → <strong>«Solicitudes Servicios»</strong>. URL directa : <code>https://taxasge.emacsah.com/dashboard/service-requests</code>. La página agrupa <strong>todas sus solicitudes</strong> activas e históricas (citoyen + empresas si tiene varios roles)."
      },
      "s2": {
        "title": "2. KPIs y filtros",
        "intro": "3 tarjetas KPI en la parte superior:",
        "f1": "<strong>Nueva Solicitud</strong> (botón) — atajo hacia el <a href=\"22-iniciar-tramite-web.html\">wizard</a>",
        "f2": "<strong>Mis Solicitudes</strong> — total de solicitudes con paginación (ej. «3, Página 1 de 1»)",
        "f3": "<strong>Pendientes</strong> — número de solicitudes que esperan una acción de su parte",
        "body": "Filtros disponibles encima de la tabla : <strong>buscar por referencia</strong>, <strong>todas las categorías</strong> (Identidad, Conducción, Comercio, etc.), <strong>todos los estados</strong> (Borrador, Enviada, Procesando, Completada, Rechazada).",
        "fig1": {
          "alt": "Lista solicitudes con KPIs",
          "caption": "Página «Solicitudes de Servicio» con 3 KPI (Nueva Solicitud, Mis Solicitudes 3 — Página 1 de 1, Pendientes). Filtros activos. Tabla 1-3 de 3."
        }
      },
      "s3": {
        "title": "3. Tabla de solicitudes",
        "intro": "Cada línea de la tabla muestra : <strong>Referencia</strong> (LIC-/CON-/PAS-), <strong>Tipo</strong>, <strong>Monto</strong> en XAF, <strong>Estado actual</strong> con barra de progreso (% completado). Pulse cualquier línea para abrir el detalle.",
        "body": "Las solicitudes están ordenadas por defecto del más reciente al más antiguo. Use los filtros para encontrar rápidamente una solicitud específica."
      },
      "s4": {
        "title": "4. Detalle de una solicitud — stepper visual",
        "intro": "La pantalla de detalle de una solicitud muestra el progreso de manera muy visual con un <strong>stepper horizontal</strong> indicando las etapas validadas (verde) y la etapa en curso (azul). El % de progreso global está visible (ejemplo: 75% — 4/5 etapas validadas).",
        "head": {
          "title": "Cabecera del detalle",
          "f1": "<strong>Número de referencia</strong> (LIC-2026-00001)",
          "f2": "<strong>Título del trámite</strong> (Pago de Obligaciones Fiscales)",
          "f3": "<strong>Badge estado</strong> (Procesando Pago, en color)",
          "f4": "<strong>Stepper</strong> con las 5 etapas y el % global"
        },
        "fig1": {
          "alt": "Detalle solicitud LIC stepper",
          "caption": "Detalle LIC-2026-00001 «Pago de Obligaciones Fiscales» con stepper a 75% (4 etapas verdes : Identificación, Documentos, Formulario, Pago actif) + tabs Resumen/Documentos + tarjeta empresa Gas Natural Ecuatorial avec 3 KPI Total/Pagado/Restante."
        },
        "tabs": {
          "title": "Pestañas del detalle",
          "f1": "<strong>Resumen</strong> : datos principales del trámite, fechas creación/actualización, importe total",
          "f2": "<strong>Documentos</strong> : todos los documentos subidos por usted + documentos generados (PDFs, recibos)"
        },
        "empresa": {
          "title": "Para solicitudes de empresa (LIC-)",
          "body": "Si la solicitud concierne a una empresa, el detalle muestra <strong>3 sub-tarjetas por entidad emisora</strong> con el estado de cada sub-pago : Ayuntamiento, Cámara de Comercio, Tesoro Público. Cada sub-tarjeta enlaza al recibo correspondiente (REC-2026-XXXXX)."
        },
        "fig2": {
          "alt": "Detalle LIC scroll obligaciones",
          "caption": "Scroll abajo del detalle LIC — sección «2 obligaciones pagadas» (Cuota Cámara 50k, Tasa Municipal 163.350) y «5 obligaciones pendientes» (Tesoro Público : CMF, Rotulos, Libreta, Ficha, Certificado)."
        }
      },
      "s5": {
        "title": "5. Estados posibles de una solicitud",
        "table": {
          "col1": "Estado", "col2": "Significado", "col3": "Acción esperada"
        },
        "r1": { "c1": "Borrador", "c2": "Wizard interrumpido antes del pago", "c3": "Reanudar el wizard" },
        "r2": { "c1": "Enviada", "c2": "Solicitud completa, esperando validación de pago", "c3": "Esperar (1-3 días) o pagar" },
        "r3": { "c1": "Procesando", "c2": "Pago validado, agente en revisión", "c3": "Esperar (5-15 días según trámite)" },
        "r4": { "c1": "En revisión", "c2": "Agente solicita información adicional", "c3": "Aportar documentos solicitados" },
        "r5": { "c1": "Completada", "c2": "Trámite finalizado con éxito", "c3": "Descargar el documento final" },
        "r6": { "c1": "Rechazada", "c2": "Solicitud rechazada con motivo", "c3": "Leer el motivo y reiniciar si procede" },
        "success": "Para detalles sobre los pagos asociados (recibos, validación), consulte <a href=\"24-mis-pagos-web.html\">Mis pagos</a>. Para los documentos generados (PDFs), consulte <a href=\"25-mis-documentos-web.html\">Mis documentos</a>."
      }
    },
  
    "page24": {
      "html_title": "Mis pagos (Web) — Manual Facil",
      "title": "Mis pagos",
      "description": "Vista centralizada de todos sus pagos efectuados en Facil — independiente del trámite asociado. Consulte el método utilizado, el estado de validación, descargue el recibo PDF con su QR de verificación pública.",
      "next": "Siguiente: Mis documentos →",
      "prev": "← Anterior: Mis solicitudes",
      "toc": {
        "s1": "1. Los 5 métodos de pago",
        "s2": "2. Estados de un pago",
        "s3": "3. Después de la validación por agente",
        "s4": "4. Recibo PDF y verificación pública",
        "s5": "5. Problemas frecuentes"
      },
      "s1": {
        "title": "1. Los 5 métodos de pago",
        "table": {
          "col1": "Método", "col2": "Validación", "col3": "Plazo", "col4": "Recibo"
        },
        "r1": { "c1": "Dinero Móvil", "c2": "Automática vía webhook BANGE", "c3": "< 1 minuto", "c4": "Inmediato" },
        "r2": { "c1": "Tarjeta", "c2": "Pasarela bancaria segura", "c3": "< 1 minuto", "c4": "Inmediato" },
        "r3": { "c1": "Transferencia bancaria", "c2": "Manual (verificación cuenta Tesoro)", "c3": "1-2 días hábiles", "c4": "Tras validación" },
        "r4": { "c1": "Efectivo", "c2": "Manual por agente Tesoro presencial", "c3": "Mismo día (oficina abierta)", "c4": "Tras validación" },
        "r5": { "c1": "Cheque", "c2": "Manual por agente + verificación bancaria", "c3": "3-7 días hábiles", "c4": "Tras compensación" }
      },
      "s2": {
        "title": "2. Estados de un pago",
        "f1": "<strong>Pendiente</strong> — pago iniciado pero no recibido (DM, tarjeta) o no validado (efectivo, cheque)",
        "f2": "<strong>Procesando</strong> — pago recibido en curso de validación por sistema o agente",
        "f3": "<strong>Validado</strong> — pago confirmado, recibo generado y disponible",
        "f4": "<strong>Rechazado</strong> — pago no aceptado (cheque sin fondo, transferencia errónea, etc.)",
        "f5": "<strong>Reembolsado</strong> — pago previamente validado y luego cancelado/devuelto"
      },
      "s3": {
        "title": "3. Después de la validación por agente",
        "intro": "Para los pagos en efectivo o cheque, un <strong>agente del Tesoro</strong> debe validar el pago manualmente. Los efectos en su cuenta son inmediatos tras esta validación:",
        "fig1": {
          "alt": "Solicitud Enviada post-pago",
          "caption": "Estado «Enviada» (post-pago, pre-validación) — Banner azul «Tu solicitud ha sido enviada y está en espera de revisión». Recibo generado REC-2026-000013, cita programada."
        },
        "fig2": {
          "alt": "Solicitud Completada",
          "caption": "Estado «Completada» (tras validación final) — Stepper 100% verde. Banner verde «¡Completado! Tu documento está listo para recoger.» Pago=Completado con Recibo REC-2026-000002."
        },
        "notif": {
          "title": "Notificaciones automáticas",
          "body": "A cada cambio de estado, recibirá una notificación por email (y push si está activado) con el detalle del cambio + un enlace directo a la solicitud. Para más detalles, consulte la página <a href=\"28-notificaciones-web.html\">Notificaciones</a>."
        }
      },
      "s4": {
        "title": "4. Recibo PDF y verificación pública",
        "intro": "Tras validación, un <strong>recibo PDF</strong> se genera automáticamente con número único <code>REC-2026-XXXXXX</code>. Contiene:",
        "f1": "Número de recibo + fecha + hora del pago",
        "f2": "Importe + método utilizado",
        "f3": "Pagador (su nombre parcial por privacidad)",
        "f4": "Código del trámite asociado + entidad emisora",
        "f5": "<strong>QR código</strong> que enlaza a la <a href=\"57-verificar.html\">página de verificación pública</a>",
        "f6": "Sello «VALIDADO» del Tesoro Público",
        "body": "El recibo se almacena automáticamente en su <a href=\"25-mis-documentos-web.html\">caja fuerte digital</a> bajo «Generados → Recibos». Es válido como prueba ante cualquier administración. Su QR es escaneable por cualquier persona para verificar la autenticidad sin necesidad de cuenta."
      },
      "s5": {
        "title": "5. Problemas frecuentes",
        "table": {
          "col1": "Síntoma", "col2": "Solución"
        },
        "r1": { "c1": "Pago Dinero Móvil falla", "c2": "Verifique el saldo de su cuenta BANGE Mobile Money. Reintente o use otro método." },
        "r2": { "c1": "Pago efectivo «Pendiente» después de varios días", "c2": "Pase por la oficina Tesoro elegida con el código <code>CSH-...</code> recibido por email. Un agente lo validará." },
        "r3": { "c1": "Recibo no descargable", "c2": "El recibo se genera tras la validación. Si está «Procesando» todavía, espere algunas horas/días según el método." },
        "r4": { "c1": "Importe incorrecto facturado", "c2": "Contacte al <a href=\"29-soporte-web.html\">soporte</a> con la referencia del pago. La diferencia se reembolsa o se imputa al próximo pago." },
        "success": "Para los pagos consolidados de varias obligaciones de empresa, consulte la página dedicada Pago agrupado (siguiente)."
      }
    },
  
    "page25": {
      "html_title": "Mis documentos (Web) — Manual Facil",
      "title": "Mis documentos — caja fuerte digital",
      "description": "Su caja fuerte digital centraliza todos los documentos vinculados a sus trámites Facil — documentos personales subidos por usted, documentos generados automáticamente (recibos, certificados), preparación pre-trámite asistida por IA. 4 pestañas dedicadas + un asistente IA configurable.",
      "next": "Siguiente: Pago agrupado →",
      "prev": "← Anterior: Mis pagos",
      "toc": {
        "s1": "1. Primer acceso (onboarding)",
        "s2": "2. Pestaña «Personales»",
        "s3": "3. Pestaña «Generados»",
        "s4": "4. Pestaña «Preparación»",
        "s5": "5. Asistente IA configurable"
      },
      "s1": {
        "title": "1. Primer acceso — modal de bienvenida",
        "intro": "La primera vez que abre «Mis Documentos», un <strong>modal de onboarding</strong> presenta las 4 promesas del módulo: almacenamiento seguro, clasificación IA automática, alertas de vencimiento, verificación pública vía QR.",
        "fig1": {
          "alt": "Modal onboarding documentos",
          "caption": "Modal «Bienvenido a Mis Documentos» con 4 bullets explicativos + CTA «Comenzar». Stats de fondo: 36 documentos totales, 0 personales, 0 generados, 0 por vencer, 11.3 MB / 100 MB cuota."
        },
        "body": "La <strong>cuota</strong> de almacenamiento es de <strong>100 MB</strong> por cuenta. Los archivos pueden estar en formato PDF, JPG, PNG (máx. 10 MB por archivo). El modal solo se muestra una vez — pulse «Comenzar» para acceder a las pestañas."
      },
      "s2": {
        "title": "2. Pestaña «Personales»",
        "intro": "Sus documentos subidos manualmente : DIP/NIE, certificados de residencia, fotos tipo carnet, documentos de identidad, etc. Visualización en grid de tarjetas con el icono de tipo de archivo y el nombre.",
        "actions": {
          "title": "Acciones por documento (menú contextual)",
          "f1": "<strong>Ver</strong> — abrir el documento en una pestaña nueva",
          "f2": "<strong>Descargar</strong> — guardar en su computadora",
          "f3": "<strong>Reclasificar</strong> — corregir la categoría asignada por la IA si es errónea",
          "f4": "<strong>Archivar</strong> — ocultar de la vista activa (puede recuperarse)",
          "f5": "<strong>Eliminar</strong> — borrado definitivo (con confirmación)"
        },
        "cat": {
          "title": "Categorías IA",
          "body": "Filtros disponibles : <strong>Identidad</strong>, <strong>Vehículo</strong>, <strong>Legal</strong>, <strong>Financiero</strong>, <strong>Administrativo</strong>, <strong>Médico</strong>, <strong>Educación</strong>, <strong>Foto</strong>, <strong>Empresa</strong>, <strong>Empleo</strong>, <strong>Otro</strong>. La IA clasifica automáticamente cada documento subido, con posibilidad de corregir."
        },
        "fig1": {
          "alt": "Pestaña Personales con menú",
          "caption": "Pestaña «Personales» con 16 documentos en grid. Filtros de categoría visibles. Menú contextual abierto sobre un documento (Ver/Descargar/Reclasificar/Archivar/Eliminar). CTA «Agregar un documento» en la parte superior derecha."
        }
      },
      "s3": {
        "title": "3. Pestaña «Generados»",
        "intro": "Los documentos generados automáticamente por Facil al validar sus trámites. Sub-categorías filtradas:",
        "f1": "<strong>Recibos</strong> — pruebas de pago (REC-2026-XXXXXX)",
        "f2": "<strong>Resúmenes de solicitud</strong> — documento PDF que lista los datos de cada solicitud (CON-, PAS-, LIC-)",
        "f3": "<strong>Certificaciones</strong> — documentos oficiales finales (carnet de conducir, certificado de residencia, etc.)",
        "f4": "<strong>Resúmenes de bundle</strong> — pago consolidado multi-entidad",
        "body": "Todos estos documentos llevan el <strong>QR de verificación pública</strong> y pueden ser presentados como prueba ante cualquier administración o tercero. Vea la página <a href=\"57-verificar.html\">Verificar un recibo</a>.",
        "fig1": {
          "alt": "Pestaña Generados",
          "caption": "Pestaña «Generados» con sub-pestañas (Todos / Certificados / Recibos / Resúmenes / Certificaciones). Grid de tarjetas «Recibo de pago» y «Resumen de solicitud» con fechas (23 abr 2026) y referencias (#REC-2026-..., #PAS-2026-...)."
        }
      },
      "s4": {
        "title": "4. Pestaña «Preparación»",
        "intro": "Funcionalidad <strong>asistida por IA</strong>: prepare documentos antes de iniciar un trámite. La IA analiza sus documentos personales existentes, identifica los que cumplen con los requisitos de los trámites más comunes, y muestra el porcentaje de preparación.",
        "cards": {
          "title": "Tarjetas «Iniciar un trámite»",
          "body": "Tarjetas de los trámites populares (Pasaporte, Residencia, Carnet Funcionario) con el % de preparación y la lista de documentos faltantes. Pulse para iniciar el trámite directamente."
        },
        "fig1": {
          "alt": "Pestaña Preparación",
          "caption": "Pestaña «Preparación» — tarjetas Pasaporte/Residencia/Carnet Funcionario, sección «Preparación para X» con checklist documentos requeridos + barras de progreso (100%, 75%)."
        }
      },
      "s5": {
        "title": "5. Asistente IA configurable (drawer)",
        "intro": "Un drawer (panel lateral derecho) permite configurar el comportamiento del asistente IA en relación con sus documentos. 3 secciones:",
        "f1": "<strong>PERMISOS</strong> — 5 conmutadores : preparar solicitudes, preparar renovaciones, clasificar documentos, sugerir citas, alertas proactivas. Cada uno con modo Proactivo (la IA actúa sin pedir) o Preparatorio (la IA propone)",
        "f2": "<strong>MEMORIAS APRENDIDAS</strong> — lista de las preferencias aprendidas (con porcentaje de confianza, ej. 100% «prefiere ciudad X»)",
        "f3": "<strong>STATS</strong> — número de conversaciones, permisos activos, memorias guardadas",
        "fig1": {
          "alt": "Drawer Configuración asistente",
          "caption": "Drawer «Configuración del asistente» — 5 toggles ON (preparar/clasificar/sugerir/alertas), 2 memorias aprendidas (100% confianza), stats (4 conversaciones, 5 permisos, 2 memorias)."
        },
        "success": "El asistente IA mejora cada vez que rectifica una clasificación o confirma una sugerencia. Más lo usa, más relevante se vuelve."
      }
    },
  
    "page26": {
      "html_title": "Pago agrupado (Web) — Manual Facil",
      "title": "Pago agrupado de obligaciones fiscales",
      "description": "El pago agrupado (bundle) le permite pagar múltiples obligaciones fiscales de su empresa en una sola transacción, repartida automáticamente entre las entidades emisoras (Tesoro Público, Ayuntamiento, Cámara de Comercio). Optimiza el tiempo administrativo y reduce las comisiones bancarias.",
      "next": "Siguiente: Mis empresas →",
      "prev": "← Anterior: Mis documentos",
      "toc": {
        "s1": "1. Concepto y ventajas",
        "s2": "2. Wizard 4 etapas",
        "s3": "3. Modo A vs Modo B",
        "s4": "4. Confirmación y seguimiento",
        "s5": "5. Lock ordering técnico (diagrama)"
      },
      "s1": {
        "title": "1. Concepto y ventajas",
        "intro": "Una empresa típica tiene varias obligaciones fiscales anuales : <strong>CMF</strong> (Tesoro), <strong>Tasa Municipal</strong> (Ayuntamiento), <strong>Cuota Cámara</strong> (Cámara de Comercio), <strong>Licencia comercial</strong>, <strong>Certificados de Comercio</strong>, etc. En lugar de pagar cada una por separado (varias visitas, múltiples comisiones), el bundle permite agruparlas.",
        "benefits": {
          "title": "Ventajas",
          "f1": "<strong>Una sola transacción</strong> bancaria — reducción de comisiones",
          "f2": "<strong>Reparto automático</strong> entre las 3 entidades emisoras (sin manipulación de su parte)",
          "f3": "<strong>Solicitud única LIC-2026-XXXXX</strong> con seguimiento centralizado",
          "f4": "<strong>3 recibos automáticos</strong> generados (uno por entidad: REC para Tesoro, REC para Ayuntamiento, REC para Cámara)",
          "f5": "<strong>Selección flexible</strong> — pague solo las obligaciones que desea, las demás quedan pendientes"
        }
      },
      "s2": {
        "title": "2. Wizard 4 etapas",
        "intro": "El wizard del bundle se accede desde <a href=\"27-mis-empresas-web.html\">Mis empresas</a> → botón <strong>«Pagar Obligaciones»</strong> en una empresa. Comprende 4 etapas:",
        "s1": {
          "title": "Etapa 1/4 — Identificación de la empresa",
          "body": "Buscar o seleccionar la empresa concernida. Si tiene varias empresas, se muestran como cards con búsqueda por NIF, PE-XXXX o nombre.",
          "fig1": {
            "alt": "Wizard etapa 1 selección",
            "caption": "Etapa 1/4 — Pantalla «Identificación de la Empresa» con search NIF/PE-XXXX/nombre + lista de las 5 empresas con CTA «Pagar →»."
          },
          "fig2": {
            "alt": "Wizard etapa 1 sélectionnée",
            "caption": "Etapa 1/4 con empresa seleccionada (Gas Natural Ecuatorial PE-1022, Bar Restaurante, Zona A1, Verificada). CTA Anterior / Siguiente."
          }
        },
        "s2": {
          "title": "Etapa 2/4 — Selección de obligaciones (Modo A vs B)",
          "body": "La pantalla muestra todas las obligaciones fiscales 2026 de la empresa, agrupadas por entidad. Antes de seleccionar, escoja el modo:",
          "f1": "<strong>Modo A — Por línea</strong> : seleccione individualmente cada obligación que quiere pagar (con checkbox)",
          "f2": "<strong>Modo B — Pago consolidado</strong> : pago único de TODAS las obligaciones en una sola transacción"
        },
        "s3": {
          "title": "Etapa 3/4 — Pago",
          "body": "Pantalla de pago con resumen de las obligaciones seleccionadas, total a pagar, y selector del método de pago (Mobile Money, efectivo en agencia, transferencia, tarjeta, cheque). Mismo flujo que el <a href=\"22-iniciar-tramite-web.html\">wizard estándar</a>.",
          "fig": {
            "alt": "Wizard etapa 3 pago",
            "caption": "Etapa 3/4 — Resumen «Por línea · 7 obligaciones seleccionadas» + tabla recap + Total 723 350 XAF + métodos de pago (Mobile Money, efectivo en agencia seleccionado)."
          }
        },
        "s4": {
          "title": "Etapa 4/4 — Confirmación",
          "body": "Pantalla final con check verde, número de referencia LIC-2026-XXXXX, monto total, número de obligaciones cubiertas, modo elegido, y los próximos pasos (validación 1-3 días, procesamiento, recepción licencia por email).",
          "fig": {
            "alt": "Wizard etapa 4 confirmación",
            "caption": "Etapa 4/4 — Confirmación con icono verde, ref 39ca9893-..., 723 350 XAF, 7 obligaciones, modo «Por línea». Box «Próximos pasos» 3 etapas. CTAs «Ver mis solicitudes» y «Volver al Dashboard»."
          }
        }
      },
      "s3": {
        "title": "3. Modo A vs Modo B — comparación detallada",
        "fig1": {
          "alt": "Modo A — sélection par ligne",
          "caption": "Modo A — Cada obligación tiene un checkbox individual. Botón «Seleccionar todo / Deseleccionar todo». Lista agrupada por entidad (TESORO, AYUNTAMIENTO, CAMARA)."
        },
        "fig2": {
          "alt": "Modo B — consolidado",
          "caption": "Modo B — Sin checkboxes. Todas las obligaciones se incluyen automáticamente. La lista detalla los items que serán pagados consolidados."
        },
        "fig3": {
          "alt": "Total con todo seleccionado",
          "caption": "Modo A con todo seleccionado (10 obligaciones) — Total 855 350 XAF (TESORO + AYUNTAMIENTO + CAMARA)."
        },
        "fig4": {
          "alt": "Selección parcial con warning",
          "caption": "Modo A sélection parcial (7 sur 10) — Total 723 350 XAF + alerta amarilla «Las obligaciones no seleccionadas quedarán pendientes. Podrá pagarlas en otro momento.»"
        },
        "tip": "Use el <strong>Modo A</strong> si quiere pagar prioritariamente las obligaciones más urgentes (próxima a vencer) o si su flujo de caja no permite pagar todo. Use el <strong>Modo B</strong> si tiene fondos disponibles para finalizar todas las obligaciones de un golpe (más rápido, menos comisiones)."
      },
      "s4": {
        "title": "4. Confirmación y seguimiento",
        "intro": "Después del pago, su solicitud LIC-2026-XXXXX aparece en <a href=\"23-mis-solicitudes-web.html\">Mis solicitudes</a> con un stepper visual y 3 sub-tarjetas (una por entidad emisora) mostrando el estado individual de cada validación.",
        "body": "Cada entidad valida su parte por separado : Ayuntamiento puede validar antes que la Cámara, etc. Por lo tanto, recibirá <strong>3 emails progresivos</strong> con el recibo correspondiente cada vez que una entidad valida.",
        "fig": {
          "alt": "PDF récapitulatif bundle",
          "caption": "PDF generado del bundle (LIC-2026-00001) con tabla de obligaciones, status por entidad (2 «Pagada», 5 «Pago pendiente»), desglose por entidad (Ayuntamiento 163 350 Pagada, Cámara 50 000 Pagada, Tesoro 510 000 escalated_supervisor), QR de verificación."
        }
      },
      "s5": {
        "title": "5. Lock ordering técnico (info técnica)",
        "note": "Esta sección es informativa para los curiosos. No necesita comprenderla para usar la función.",
        "intro": "El bundle implementa una lógica transaccional <strong>multi-tabla con lock ordering canónico</strong> para evitar deadlocks cuando 100+ agentes simultáneos validan operaciones similares. El orden estricto:",
        "diagram": "┌─────────────────────────────────────────────────────────────────┐\n│  ORDEN DE LOCK CANÓNICO PARA BUNDLE PAYMENT                     │\n│  (a respetar siempre para evitar deadlocks)                     │\n└─────────────────────────────────────────────────────────────────┘\n\n   1. commercial_licenses        ← SELECT FOR UPDATE (lock racine)\n              │\n              │  Lock obtenido — la licencia comercial se reserva\n              ▼\n   2. service_requests           ← INSERT (sin FOR UPDATE)\n              │                    Concurrencia gestionada por\n              │                    índice único partial idx_sr_commercial_license_unique\n              │\n              ▼\n   3. license_obligations        ← UPDATE batch (locks auto)\n              │                    Las obligaciones se marcan\n              │                    pagadas o pendientes\n              │\n              ▼\n   4. service_payments           ← INSERT final\n              │                    Registra el pago efectivo\n              │\n              ▼\n   ✅ Commit transaction         (todo o nada — atómico)\n\n   Configuración de la transacción:\n       SET LOCAL lock_timeout = '3s';\n       SET LOCAL statement_timeout = '5s';\n\n   En caso de UniqueViolationError sobre service_requests:\n       deterministic SELECT por commercial_license_id (no retry)",
        "body": "Este diseño asegura que <strong>1000+ pagos simultáneos</strong> sobre la misma empresa nunca terminen en deadlock. La latencia de bloqueo está limitada a 3 segundos máximo para no penalizar la experiencia usuario.",
        "success": "El bundle es la opción recomendada para empresas con varias obligaciones. Centraliza el seguimiento y reduce el tiempo administrativo."
      }
    },
  
    "page27": {
      "html_title": "Mis empresas (Web) — Manual Facil",
      "title": "Mis empresas",
      "description": "Si representa una o varias empresas registradas en Guinea Ecuatorial, esta página le permite gestionar su información, ver sus obligaciones fiscales, su historial de pagos, sus inspecciones, y descargar la licencia comercial PDF. Para ciudadanos sin empresa, esta sección no es relevante.",
      "next": "Siguiente: Notificaciones →",
      "prev": "← Anterior: Pago agrupado",
      "toc": {
        "s1": "1. Lista de empresas",
        "s2": "2. Detalle de una empresa",
        "s3": "3. Pestaña «Obligaciones Fiscales»",
        "s4": "4. Pestaña «Historial de Pagos»",
        "s5": "5. Pestaña «Inspecciones»"
      },
      "s1": {
        "title": "1. Lista de empresas",
        "intro": "Acceso : menú lateral → <strong>«Mis Empresas»</strong>. Pantalla con sus empresas en grid de tarjetas. Cada tarjeta muestra :",
        "f1": "Nombre comercial + número PE-XXXX (identificador único)",
        "f2": "Badge estado (Abierta, Cerrada, Suspendida)",
        "f3": "Tag sector (abacería, bar/restaurante, cafetería, carpintería, etc.)",
        "f4": "Zona (A1/A2/A3/B1/B2/B3/C1/C2/C3/D) + ciudad",
        "f5": "Año fiscal en curso + número de obligaciones pendientes",
        "f6": "Fecha de vencimiento de la licencia (31/12/2026 típicamente)",
        "f7": "2 botones : <strong>«Ver detalle»</strong> y <strong>«Pagar Obligaciones»</strong> (atajo al wizard <a href=\"26-bundle-payment.html\">bundle</a>)",
        "actions": {
          "title": "Acciones globales",
          "body": "Botones en la parte superior : exportar a Excel, refrescar, <strong>«Nueva Empresa»</strong> para registrar una empresa adicional (requiere documentos legales)."
        },
        "fig1": {
          "alt": "Lista mis empresas",
          "caption": "«Mis Empresas — Gestione sus empresas, licencias comerciales y obligaciones fiscales». Grid de 5 cards (Carpinteria, Gas Natural, Librería, Tienda El Sol, Supermercado) con badges Abierta, zona, sector, vencimiento, CTAs Ver detalle / Pagar Obligaciones."
        }
      },
      "s2": {
        "title": "2. Detalle de una empresa",
        "intro": "Pulse «Ver detalle» o el card de la empresa para abrir su pantalla detallada. URL : <code>/dashboard/empresas/{uuid}</code>. La cabecera muestra :",
        "f1": "Nombre comercial + PE-XXXX + tag sector + zona + ciudad",
        "f2": "5 KPIs : <strong>Total</strong> (obligaciones del año), <strong>Pagado</strong>, <strong>Pendiente</strong>, <strong>Recuperación %</strong>, <strong>Vencimiento</strong>",
        "f3": "3 CTAs : Ver documentos, <strong>Descargar Licencia PDF</strong>, Pagar Obligaciones",
        "f4": "3 pestañas : <strong>Obligaciones Fiscales</strong>, <strong>Historial de Pagos</strong>, <strong>Inspecciones</strong>"
      },
      "s3": {
        "title": "3. Pestaña «Obligaciones Fiscales»",
        "intro": "Pestaña por defecto. Lista todas las obligaciones del año fiscal con :",
        "f1": "<strong>Servicio</strong> : nombre de la obligación (Cuota Anual Comercial, CMF, Tasa Municipal, Cuota Cámara, etc.)",
        "f2": "<strong>Tipo</strong> : badge entité (chamber, municipal, tesoro)",
        "f3": "<strong>Monto</strong> en XAF",
        "f4": "<strong>Vencimiento</strong> : fecha límite",
        "f5": "<strong>Estado</strong> : pendiente, pagada, vencida",
        "body": "Filtros disponibles (Todos / Pendientes / Pagadas) y exportación a Excel. Pulse una obligación específica para ver su detalle (cálculo, fundamento legal).",
        "fig1": {
          "alt": "Detalle obligaciones fiscales",
          "caption": "Pestaña «Obligaciones Fiscales (10)» — Carpintería Hermanos PE-1011 con 5 KPIs (Total 491 250, Pagado 0, Pendiente 491 250, Recuperación 0%, Vence 31/12/2026). Tabla de 7 obligaciones visibles (Servicio, Tipo, Monto, Vencimiento, Estado pending)."
        }
      },
      "s4": {
        "title": "4. Pestaña «Historial de Pagos»",
        "intro": "Lista de todos los pagos efectuados para esta empresa (incluyendo bundles). Columnas : <strong>Referencia</strong> (REC-2026-XXXXX), <strong>Método</strong>, <strong>Monto</strong>, <strong>Fecha</strong>, <strong>Estado</strong> (Pagado/Procesando/Rechazado), <strong>Recibo</strong> (descarga PDF).",
        "body": "Si la empresa no tiene historial todavía, aparece un estado vacío «Sin pagos registrados».",
        "fig1": {
          "alt": "Historial de pagos vacío",
          "caption": "Pestaña «Historial» — empresa sin pagos todavía, mostrando el estado vacío con tabla de columnas (Referencia, Método, Monto, Fecha, Estado, Recibo)."
        }
      },
      "s5": {
        "title": "5. Pestaña «Inspecciones»",
        "intro": "Lista de las inspecciones realizadas por agentes públicos (OMS, salud, conformidad). Contiene la fecha, el tipo, el inspector, el resultado (conforme / no conforme con recomendaciones / sanción).",
        "body": "Esta pestaña es <strong>solo informativa</strong> — los resultados de las inspecciones son determinados por las entidades emisoras y no pueden modificarse desde Facil. Solo recibirá notificaciones cuando una inspección se programe o se complete.",
        "fig1": {
          "alt": "Inspecciones empty state",
          "caption": "Pestaña «Inspecciones (0)» — empresa sin inspecciones registradas, icono ojo + «Sin inspecciones realizadas»."
        },
        "info": "Las inspecciones de campo OMS son detalladas en el manual <a href=\"69-trabajo-terreno-oms.html\" class=\"coming-soon\">Trabajo de campo OMS</a> (lado agente). Lado empresa, solo recibe los resultados.",
        "success": "Para registrar una nueva empresa o gestionar los miembros de su empresa actual (añadir socios, accountants), consulte la página <a href=\"42-gestion-empresas.html\" class=\"coming-soon\">Gestionar empresas</a>."
      }
    },
  
    "page28": {
      "html_title": "Notificaciones (Web) — Manual Facil",
      "title": "Notificaciones — recibir las actualizaciones",
      "description": "Facil le mantiene informado por email a cada cambio de estado de sus solicitudes : recepción, pago pendiente, validación, finalización. Los recibos PDF son adjuntos directamente en los emails para acceso inmediato.",
      "next": "Siguiente: Asistente IA y Soporte →",
      "prev": "← Anterior: Mis empresas",
      "toc": {
        "s1": "1. Tipos de notificaciones email",
        "s2": "2. Email «Solicitud Recibida»",
        "s3": "3. Email «Pago Pendiente»",
        "s4": "4. Email «Pago Validado»",
        "s5": "5. Verificación pública desde el email",
        "s6": "6. Configurar las preferencias"
      },
      "s1": {
        "title": "1. Tipos de notificaciones email",
        "intro": "Cada email de Facil tiene un <strong>color de header</strong> según el tipo de evento — para identificar al instante:",
        "f1": "<span style=\"color:#FFA500\">🟠</span> <strong>Naranja</strong> — Acción requerida (pago pendiente, documento solicitado por agente)",
        "f2": "<span style=\"color:#0062A5\">🔵</span> <strong>Azul</strong> — Información (solicitud recibida, cita programada, cambio de estado)",
        "f3": "<span style=\"color:#009A44\">🟢</span> <strong>Verde</strong> — Validación / éxito (pago validado, trámite completado, documento listo)",
        "f4": "<span style=\"color:#D22630\">🔴</span> <strong>Rojo</strong> — Alerta de seguridad (cambio de contraseña, conexión sospechosa) o rechazo",
        "body": "El remitente es siempre <code>noreply@taxasge.emacsah.com</code>. Si recibe un email de Facil con otro remitente, es <strong>phishing</strong> — no pulse en los enlaces."
      },
      "s2": {
        "title": "2. Email «Solicitud Recibida»",
        "intro": "Enviado inmediatamente después de la creación de su solicitud. Header verde, mensaje «Solicitud Recibida», nombre + referencia + lista de los próximos pasos.",
        "fig1": {
          "alt": "Email Solicitud Recibida",
          "caption": "Email «Solicitud Recibida» — header «Solicitud Recibida», «Hola libre Gmil», Referencia CON-2026-00001, próximos pasos (revisada / notificaremos / contactaremos), PJ <code>solicitud_CON-...00001.pdf</code> con preview visible."
        }
      },
      "s3": {
        "title": "3. Email «Pago Pendiente»",
        "intro": "Enviado en caso de pago efectivo o cheque después de la creación de la solicitud. Le da las instrucciones para finalizar el pago en oficina.",
        "fig1": {
          "alt": "Inbox Gmail con 3 emails",
          "caption": "Inbox Gmail — 3 emails TaxasGE Platform : «Paiement en espèces validé» 17:07, «Solicitud recibida» 15:05, «Pago en efectivo pendiente» 15:05."
        },
        "fig2": {
          "alt": "Email Pago Pendiente",
          "caption": "Email «Pago en Efectivo Pendiente» (header naranja) — detalles (Ref CSH-..., 25 000 XAF, Efectivo) + sección «Próximos pasos» en 4 etapas (Acude oficina / Presenta ref / Realiza pago / Agente valida)."
        }
      },
      "s4": {
        "title": "4. Email «Pago Validado»",
        "intro": "Enviado tras validación del agente. Header verde, recibo PDF como adjunto, enlace de verificación pública.",
        "fig1": {
          "alt": "Email Pago Validado split",
          "caption": "Email «Pago en Efectivo Validado» (header verde) — detalles (Solicitud CON-2026-00001, Ref CSH-..., 25 000 XAF, Efectivo, Recibo REC-2026-000013, Fecha 2026-04-19)."
        },
        "fig2": {
          "alt": "Email scroll bas",
          "caption": "Suite del email «Pago Validado» — sección Próximos pasos «Tu solicitud continuará procesada», enlace «Verificar autenticidad del recibo» → URL verify, PJ <code>recibo_REC-...000013.pdf</code> con preview Recibo Tesoro Público Malabo."
        }
      },
      "s5": {
        "title": "5. Verificación pública desde el email",
        "intro": "Cada email contiene un <strong>enlace «Verificar autenticidad del recibo»</strong> que abre directamente la <a href=\"57-verificar.html\">página de verificación pública</a> con la referencia y el token correspondiente. Útil cuando un tercero (banco, embajada) le pide la prueba — basta con compartir el enlace.",
        "fig1": {
          "alt": "Página verify recibo desde email",
          "caption": "Página verify recibo (URL <code>/es/verify/REC-2026-...</code>) abierta desde el enlace email — badge verde «Recibo Válido», Numero REC-2026-000013, fecha, monto 25 000 XAF Efectivo, pagador, código CONDUCIR_RENOVACION, entidad DGT, ref CON-2026-00001."
        }
      },
      "s6": {
        "title": "6. Configurar las preferencias",
        "intro": "Las preferencias de notificaciones se configuran desde su <a href=\"15-perfil.html\">Perfil</a> → pestaña «Notificaciones». 3 canales modulables :",
        "f1": "<strong>Email</strong> (activo por defecto, no se puede desactivar para alertas críticas)",
        "f2": "<strong>Push notifications</strong> (móvil únicamente)",
        "f3": "<strong>SMS</strong> (opcional, coste para el operador)",
        "body": "El idioma de las notificaciones (ES/FR/EN) se basa en la preferencia configurada en su perfil. Si cambia su idioma preferido, las próximas notificaciones se enviarán en el nuevo idioma.",
        "tip": "Si no recibe los emails, <strong>verifique siempre la carpeta de spam</strong> primero. Añada <code>noreply@taxasge.emacsah.com</code> a sus contactos para evitar el filtrado. Para problemas persistentes, contacte al <a href=\"29-soporte-web.html\">soporte</a>.",
        "success": "Las notificaciones email son la columna vertebral de la comunicación con Facil — los datos están siempre disponibles también en el dashboard, los emails son una vía complementaria."
      }
    },
  
    "page29": {
      "html_title": "Asistente IA y Soporte (Web) — Manual Facil",
      "title": "Asistente IA conectado y Soporte",
      "description": "Esta página combina 2 funciones complementarias para usuarios conectados : el asistente IA conectado (acceso a su contexto personal — coffre digital, empresas, solicitudes) y el sistema de tickets de soporte (problemas técnicos o administrativos).",
      "next": "Siguiente: Panel principal Móvil →",
      "prev": "← Anterior: Notificaciones",
      "toc": {
        "s1": "1. Asistente IA — pantalla inicial",
        "s2": "2. Acciones rápidas (sugerencias y trámites)",
        "s3": "3. Conversaciones — ejemplos reales",
        "s4": "4. Sistema de tickets de soporte",
        "s5": "5. Crear un ticket",
        "s6": "6. Conversación en un ticket"
      },
      "s1": {
        "title": "1. Asistente IA — pantalla inicial",
        "intro": "Acceso : menú lateral → <strong>«Chat Asistente»</strong>. Al abrir, ve un mensaje de bienvenida personalizado y <strong>4 sugerencias contextuales</strong> + una sección <strong>«Mi Cofre Digital»</strong> con 5 quick actions:",
        "f1": "<strong>Documentos</strong> — análisis automático de documentos faltantes",
        "f2": "<strong>¿Cuánto cuesta?</strong> — simulación de costes",
        "f3": "<strong>Pasos</strong> — guía paso a paso de un trámite",
        "f4": "<strong>Servicios fiscales</strong> — info detallada por servicio",
        "f5": "<strong>Cofre digital</strong> — vencimientos, preparados, estadísticas, faltan, pagar obligaciones",
        "fig1": {
          "alt": "Asistente IA estado inicial",
          "caption": "Pantalla «Chat Asistente» con welcome «¿En qué puedo ayudarle?», 4 sugerencias contextuales y la sección «Mi Cofre Digital» con 5 quick actions."
        }
      },
      "s2": {
        "title": "2. Acciones rápidas (popovers)",
        "intro": "Dos popovers ofrecen acceso rápido a las acciones populares:",
        "fig1": {
          "alt": "Popover Sugerencias",
          "caption": "Popover «Sugerencias» (icono +) — lista 9 sugerencias clasificadas (documentos, ¿cuánto cuesta?, pasos, servicios, vencer, preparado, estadísticas, faltan, pagar obligaciones)."
        },
        "fig2": {
          "alt": "Popover Iniciar trámite",
          "caption": "Popover «Iniciar un trámite» (icono cohete) — 6 quick-start : Pasaporte Nueva expedición, Pasaporte Renovación, Residencia Primera vez, Licencia Conducir, Carnet Funcionario, Contrato ONRC."
        }
      },
      "s3": {
        "title": "3. Conversaciones — ejemplos reales",
        "intro": "El asistente conectado responde con <strong>contexto personal</strong> : conoce sus empresas, sus solicitudes, sus documentos, y puede hacer cálculos personalizados (paquetes fiscales para una empresa específica).",
        "fig1": {
          "alt": "Drawer Historial",
          "caption": "Drawer «Historial» (sidebar izquierda) — lista «Conversación actual (Activa)», mensaje «El historial estará disponible próximamente» (función futura)."
        },
        "ex1": {
          "title": "Ejemplo 1 — Estadísticas del cofre digital"
        },
        "fig2": {
          "alt": "Stats coffre digital",
          "caption": "Conversación 1 — pregunta «Estadísticas de mi cofre digital» → respuesta bot estructurada (14 docs activos, 0 personales, 6 asistente, 8 generados...)."
        },
        "ex2": {
          "title": "Ejemplo 2 — Pago de obligación de empresa"
        },
        "fig3": {
          "alt": "Pago obligación loading",
          "caption": "Conversación 2 — pregunta «¿Cómo puedo pagar una obligación de mi empresa?» + indicador «Preparando respuesta...» mientras la IA prepara una respuesta personalizada."
        },
        "ex3": {
          "title": "Ejemplo 3 — Paquete fiscal personalizado"
        },
        "fig4": {
          "alt": "Paquete fiscal restaurante",
          "caption": "Conversación 3 — respuesta «Apertura de Restaurante en Malabo — Paquete Fiscal» con desglose detallado (Tasa Municipal 163 350, Cámara Comercio 50 000, CMF 480 000...) TOTAL 855 350 XAF + chips sugerencias (documentos restaurante, cuánto cuesta restaurante)."
        },
        "tip": "El asistente puede <strong>iniciar trámites</strong> desde la conversación. Pulse cualquier respuesta con un CTA «Iniciar este trámite» para abrir directamente el wizard sin volver al menú."
      },
      "s4": {
        "title": "4. Sistema de tickets de soporte",
        "intro": "Para problemas técnicos o administrativos no resolubles por el asistente IA, use el sistema de tickets. Acceso : menú lateral → <strong>«Ayuda / Soporte»</strong>. Lista de sus tickets con :",
        "f1": "<strong>Identificador</strong> SUP-YYYYMMDD-XXXX",
        "f2": "<strong>Asunto</strong> + estado (Abierto / En proceso / Resuelto / Cerrado)",
        "f3": "<strong>Prioridad</strong> (Baja / Normal / Alta / Urgente)",
        "f4": "<strong>Categoría</strong> (Cuenta / Pago / Trámite / Documentos / Técnico)",
        "fig1": {
          "alt": "Lista tickets soporte",
          "caption": "Página «Soporte y Asistencia» — lista de 3 tickets (SUP-20251218-0002, SUP-20251218-0001, SUP-20251217-0001) con asuntos, estados Cerrado/Abierto, prioridad Normal. CTA «+ Nuevo Ticket». Sección «Preguntas Frecuentes» en la parte inferior."
        }
      },
      "s5": {
        "title": "5. Crear un ticket",
        "intro": "Pulse <strong>«+ Nuevo Ticket»</strong>. Formulario sencillo:",
        "f1": "<strong>Categoría</strong> — selector entre las 5 categorías disponibles",
        "f2": "<strong>Asunto</strong> — descripción corta (máx 100 caracteres)",
        "f3": "<strong>Descripción</strong> — texto detallado del problema (con posibilidad de adjuntar archivos)",
        "f4": "<strong>Prioridad</strong> — selector entre 4 niveles (Normal por defecto)",
        "fig1": {
          "alt": "Formulario nuevo ticket",
          "caption": "Página «Crear ticket» con campos Categoría (select), Asunto, Descripción (textarea), Prioridad (select Normal por defecto). CTAs Cancelar / Enviar ticket."
        },
        "body": "Tras enviar, el ticket recibe un identificador SUP-YYYYMMDD-XXXX y aparece en su lista. El equipo de soporte responde en <strong>24-72 horas hábiles</strong> según la prioridad."
      },
      "s6": {
        "title": "6. Conversación en un ticket",
        "intro": "Pulse un ticket en la lista para abrir su detalle. La página muestra:",
        "f1": "<strong>Cabecera</strong> con asunto + identificador + badges (estado + prioridad)",
        "f2": "<strong>Detalles</strong> : descripción, fecha de creación, creador, categoría",
        "f3": "<strong>Conversación</strong> : intercambio de mensajes con el agente de soporte",
        "f4": "<strong>Adjuntos</strong> : capturas, documentos compartidos en la conversación",
        "f5": "<strong>Botones</strong> : responder, marcar como resuelto, cerrar (definitivo)",
        "fig1": {
          "alt": "Detalle ticket conversación",
          "caption": "Detalle ticket «Second test / SUP-20251218-0001» con badge Abierto + Normal. Bloc Detalles (Descripción «Verifier la vue du ticket par l'administrateur», Creado 18/12/2025 10:40, Categoría Mi Cuenta). Sección «Ver conversación» con 1 mensaje."
        },
        "warning": "Una vez cerrado, un ticket NO puede ser reabierto. Si su problema no está resuelto, mejor responda al ticket existente en lugar de cerrarlo. Si necesita escalar al supervisor, indíquelo en el mensaje.",
        "success": "Para problemas urgentes (cuenta comprometida, pago erróneo crítico), use prioridad Urgente y mencione la urgencia en el asunto. El plazo de respuesta es entonces de <strong>4-12 horas hábiles</strong>."
      }
    },

  "page59": {
    "html_title": "Vista Web del sitio público — Manual Facil",
    "title": "Vista Web del sitio público (desktop)",
    "description": "Panorama completo de la versión Web (desktop) del sitio público Facil. Las páginas dedicadas (51-58) cubren cada función en detalle con un enfoque mobile-first ; esta página agrupa las capturas Web desktop para tener una visión global del recorrido del visitante en navegador.",
    "toc": {
      "s1": "1. Acceder al sitio web",
      "s2": "2. Homepage (página de inicio)",
      "s3": "3. Catálogo de Servicios Fiscales",
      "s4": "4. Calculadora de Impuestos",
      "s5": "5. Directorio de Empresas",
      "s6": "6. Simulador de Licencias Comerciales",
      "s7": "7. Asistente IA (modo chat completo + widget)",
      "s8": "8. Guía Fiscal",
      "s9": "9. Catálogo de Ministerios",
      "s10": "10. Diferencias Web vs Móvil"
    },
    "s1": {
      "title": "1. Acceder al sitio web",
      "intro": "Abra <code>https://taxasge.emacsah.com/</code> en cualquier navegador moderno (Chrome, Firefox, Safari, Edge). El sitio se redirige automáticamente al idioma de su navegador (ES por defecto). El header global con menú de navegación es presente en todas las páginas: <strong>Servicios, Licencias, Directorio, Ministerios, Calculadora, Guía, Asistente IA</strong>, además del selector de idioma y el botón <strong>«Iniciar sesión»</strong>."
    },
    "s2": {
      "title": "2. Homepage (página de inicio)",
      "intro": "La homepage acoge al visitante con un hero verde «Simplifica tus trámites», un badge «Trámites Digitales AI de Guinea Ecuatorial» y una <strong>barra de búsqueda principal</strong>. Debajo, 3 cards clave (Calculadora, Documentos, Guía).",
      "fig1": {
        "alt": "Homepage Facil hero",
        "caption": "Homepage <code>taxasge.emacsah.com/es</code> — header con nav (Servicios, Licencias, Directorio, Ministerios, Calculadora, Guía, Asistente IA), hero verde con eslogan + barra de búsqueda + 3 cards de acceso rápido."
      },
      "footer": {
        "title": "Footer + widget chat flotante",
        "body": "Al desplazarse hacia abajo, encuentra una <strong>grilla de servicios tarifados</strong> (legalización 1/8 página, tarifas variables) y el footer con enlaces rápidos (Servicios / Legal). Un widget flotante <strong>«Asistente Facil – En línea»</strong> (esquina inferior derecha) se abre permanentemente para preguntas rápidas."
      },
      "fig2": {
        "alt": "Footer + widget chat flotante",
        "caption": "Parte inferior de la homepage — grilla de servicios tarifados arriba (legalización, formato A3/A4...) + widget chat flotante «Asistente Facil – En línea» abierto a la derecha."
      }
    },
    "s3": {
      "title": "3. Catálogo de Servicios Fiscales",
      "intro": "URL <code>/es/services</code>. Título «Servicios Fiscales – 869 servicios encontrados». Toggle <strong>Cuadrícula / Lista</strong>, 4 dropdowns de filtros (sector, ministerio, tipo, orden) + barra de búsqueda. Cada card muestra el título del servicio, su tarifa en XAF, y la entidad gestora.",
      "fig1": {
        "alt": "Catálogo servicios fiscales cuadrícula",
        "caption": "Catálogo en vista cuadrícula — Legalización Documentos 2 000 XAF, Certificado matrícula 60 000 XAF, etc. Filtros activos visibles arriba."
      },
      "detail": {
        "title": "Detalle de un servicio"
      },
      "fig2": {
        "alt": "Detalle servicio Legalización",
        "caption": "Detalle servicio (URL <code>/es/services/8</code>) — «Legalización de Documentos», tarifa 2 000 XAF, plazo 1 día, ministerio MAE/Diáspora. Cards «Documentos requeridos» (2) + «Procedimientos» (3 etapas)."
      },
      "body": "Para más detalles funcionales (filtros, búsqueda por palabra clave, comparación de servicios), consulte la <a href=\"51-explorar-servicios.html\">página dedicada Explorar servicios</a>."
    },
    "s4": {
      "title": "4. Calculadora de Impuestos",
      "intro": "URL <code>/es/calculateur</code>. 4 pestañas: <strong>IRPF, IVA, Sociedades, Servicios Fiscales</strong>. Introducción del monto en XAF + visualización de los tramos progresivos + resultado calculado en tiempo real.",
      "fig1": {
        "alt": "Calculadora de impuestos web",
        "caption": "Calculadora de Impuestos en versión Web — IRPF activa con ingreso 5 000 000 XAF, tramos 0/10/15/20/25/35% mostrados, panel resultado vacío en espera del cálculo. Disclaimer «cálculos solo indicativos» abajo."
      },
      "body": "Detalles de las fórmulas y reglas en la <a href=\"52-calculadora.html\">página Calculadora fiscal</a>."
    },
    "s5": {
      "title": "5. Directorio de Empresas",
      "intro": "URL <code>/es/annuaire</code>. Listado público de empresas registradas con búsqueda + filtros por sector y forma jurídica (S.L., Autónomo, S.A., ONG). Cada card muestra NIF, sector, ciudad, badge tier.",
      "fig1": {
        "alt": "Directorio empresas web",
        "caption": "Directorio de Empresas — barra de búsqueda + filtros (Todos los sectores, Forma jurídica, S.L. 23, Autónomo 14, S.A. 8, ONG 3) + 48 resultados. Cards Aceite Palma SA, Agroexport SA, Bar Tropical, etc."
      },
      "body": "Más detalles en la <a href=\"53-directorio.html\">página Directorio de empresas</a>."
    },
    "s6": {
      "title": "6. Simulador de Licencias Comerciales",
      "intro": "URL <code>/es/licencias-comerciales</code>. Wizard de 3 etapas con stepper visible siempre. La versión web muestra una <strong>grilla iconada</strong> de los tipos de comercio (más visual que móvil).",
      "s1": {
        "title": "Etapa 1 — Tipo de Comercio"
      },
      "fig1": {
        "alt": "Licencias etapa 1",
        "caption": "Stepper «1 Tipo de Comercio» activa. Grilla de 10 cards iconadas (Abacerías, Bares y Restaurantes, Cafeterías-Pastelerías, Carpinterías, Clínicas/Farmacias, Discotecas, Ferreterías, Talleres, Video Clubs...)."
      },
      "s2": {
        "title": "Etapa 2 — Zona Geográfica"
      },
      "fig2": {
        "alt": "Licencias etapa 2 zona",
        "caption": "Stepper etapa 2. Pills «Cambiar tipo» + tipo seleccionado. 3 secciones color-codadas: Capitales de Regiones (A1/A2/A3 rojas), Capitales de Provincias (B1/B2/B3 naranjas), Capitales Distritales y Municipales (C1/C2/C3 azules)."
      },
      "s3": {
        "title": "Etapa 3 — Ficha Tarifaria",
        "body": "Resultado completo con desglose detallado por entidad emisora, total general, documentos requeridos y botón <strong>«Imprimir»</strong> para generar un PDF oficial."
      },
      "fig3": {
        "alt": "Ficha tarifaria parte superior",
        "caption": "Ficha tarifaria parte superior — pills selección + referencia legal «Decreto Presidencial» + tabla Tesoro Público (MinHacienda CMF 45 000, MinComercio Cuota Anual 30 000, etc.)."
      },
      "fig4": {
        "alt": "Ficha tarifaria total",
        "caption": "Ficha tarifaria parte inferior — Sub-Total Tesoro 144 000, Cámara de Comercio 20 000, <strong>TOTAL GENERAL 164 000 XAF</strong> + Documentos Requeridos (2 obligatorios) + botón «Imprimir»."
      },
      "print": {
        "title": "Generación e impresión del PDF",
        "body": "El botón «Imprimir» abre el diálogo nativo del navegador (Chrome aquí). Puede elegir <strong>«Guardar como PDF»</strong> para guardar el documento en su computadora antes de presentarlo a la administración."
      },
      "fig5": {
        "alt": "Diálogo impresión Chrome",
        "caption": "Diálogo de impresión Chrome con vista previa PDF — Destino «Guardar como PDF», Páginas Todas, Color. Vista previa del documento Ficha Tarifaria a la derecha."
      },
      "fig6": {
        "alt": "PDF Ficha Tarifaria final",
        "caption": "PDF Ficha Tarifaria generado — header logo Facil + título, tabla completa Tesoro+Cámara, TOTAL 164 000 XAF, Documentos Requeridos, footer «FACIL — Plataforma de Servicios Fiscales / República de Guinea Ecuatorial / 19 de abril de 2026» + QR «Verificar en línea»."
      },
      "body": "Para los detalles del cálculo y los tipos de comercio, consulte la <a href=\"54-licencias-comerciales.html\">página Simulador de licencias</a>."
    },
    "s7": {
      "title": "7. Asistente IA — modo chat completo + widget flotante",
      "intro": "El asistente IA está accesible de 2 maneras en la versión Web:",
      "full": {
        "title": "Modo full-page (URL dedicada)"
      },
      "fig1": {
        "alt": "Asistente IA full page",
        "caption": "URL <code>/es/chat</code> — sidebar izquierda (Página Web, Licencias Comerciales, Directorio Empresas, Ministerios, Guía, Iniciar sesión), título «¡Hola! Soy tu asistente Facil», input chat 0/2000 chars, 5 quick-prompts (pasaporte, licencia comercial, residencia, empresas registradas, ministerios, ¿Qué es Facil?)."
      },
      "widget": {
        "title": "Modo widget flotante (en cualquier página)",
        "body": "En cualquier página del sitio (homepage, catálogo, etc.), un <strong>widget flotante</strong> en la esquina inferior derecha permite abrir el asistente sin abandonar la navegación actual. Útil para preguntas contextuales mientras explora un servicio."
      },
      "body": "Consulte la imagen <code>2.png</code> de la sección 2 «Homepage» para ver el widget flotante en acción.",
      "more": "Más detalles funcionales en la <a href=\"55-asistente-ia-publica.html\">página Asistente IA público</a>."
    },
    "s8": {
      "title": "8. Guía Fiscal — recursos y formularios",
      "intro": "URL <code>/es/guide</code>. 4 pestañas: <strong>Declaración, Legislación, Descargas, FAQ</strong>. La versión Web ofrece una experiencia más rica que la móvil con vista previa integrada de los PDFs.",
      "declaracion": {
        "title": "Pestaña Declaración"
      },
      "fig1": {
        "alt": "Guía Declaración",
        "caption": "Pestaña «Declaración» activa — sección «Cómo Hacer una Declaración» con 2 etapas detalladas (Reúne tus documentos, Calcula tus impuestos) + consejos prácticos + acciones plataforma."
      },
      "descargas": {
        "title": "Pestaña Descargas (con vista previa PDF)"
      },
      "fig2": {
        "alt": "Guía Descargas con vista previa",
        "caption": "Pestaña «Descargas» — columna izquierda «Formularios Descargables» (Retención 3% Sector Petrolero seleccionado, 5%, 10% No Residentes, Cuota Mínima Petrolero) + columna derecha «Vista Previa PDF» con vista previa inline del formulario «AUTOLIQUIDACION RETENCIÓN A LA FUENTE DEL 3%» (Cod. Impuesto 0320)."
      },
      "body": "Detalles de cada pestaña en la <a href=\"56-guia.html\">página Guía rápida</a>."
    },
    "s9": {
      "title": "9. Catálogo de Ministerios",
      "intro": "URL <code>/es/ministere</code>. Vista panorámica de los 21 ministerios de Guinea Ecuatorial con sus servicios fiscales asociados. Toggle Kanban / Lista. Cada card ministerio muestra el número de servicios disponibles.",
      "list": {
        "title": "Vista catálogo"
      },
      "fig1": {
        "alt": "Catálogo Ministerios",
        "caption": "Catálogo Ministerios en vista Kanban — MIN. TRANSPORTE/TIC 292 servicios, AVIACIÓN CIVIL 155, COMERCIO/PYMES 80, IGUALDAD 76, INFORMACIÓN 52, INTERIOR 39, etc."
      },
      "detail": {
        "title": "Detalle de un ministerio"
      },
      "fig2": {
        "alt": "Detalle Ministerio Transporte",
        "caption": "Detalle ministerio (URL <code>/es/ministere/97</code>) — «MINISTERIO DE TRANSPORTE, TELECOMUNICACIONES Y SISTEMAS DE INTELIGENCIA ARTIFICIAL», descripción institucional, 3 stats (292 servicios, 8 categorías, 1 sectores)."
      }
    },
    "s10": {
      "title": "10. Diferencias Web vs Móvil",
      "table": {
        "col1": "Característica",
        "col2": "Web (desktop)",
        "col3": "Móvil",
        "r1": {
          "c1": "Header con menú permanente",
          "c3": "Menú hamburguesa"
        },
        "r2": {
          "c1": "Asistente IA",
          "c2": "Modo full-page + widget flotante",
          "c3": "Pantalla dedicada solamente"
        },
        "r3": {
          "c1": "Catálogo de Ministerios",
          "c3": "Lista solamente"
        },
        "r4": {
          "c1": "Vista previa PDF de formularios"
        },
        "r5": {
          "c1": "Generación PDF Ficha Tarifaria",
          "c2": "Diálogo Chrome nativo",
          "c3": "Compartir nativo (WhatsApp...)"
        },
        "r6": {
          "c1": "Vista cuadrícula vs lista",
          "c3": "Auto-adapta según tamaño"
        }
      },
      "info": "La versión Web es la <strong>más completa</strong> en términos de funcionalidades visuales (vista previa PDF, kanban, diálogo de impresión nativo). La versión Móvil compensa con funcionalidades exclusivas (compartir nativo, modo offline, biometría tras login).",
      "success": "Ya conoce la vista panorámica del sitio web público. Para los detalles funcionales de cada función, consulte las páginas dedicadas (51-58)."
    },
    "prev": "← Anterior: Información legal",
    "next": "Siguiente: Crear cuenta →"
  },

  "page31": {
    "html_title": "Panel principal Móvil — Manual Facil",
    "title": "Panel principal en la aplicación móvil",
    "description": "Tras iniciar sesión en la app móvil Facil, accede a su panel principal — versión compacta y optimizada del dashboard Web. Ofrece las mismas funcionalidades clave (KPIs, acciones rápidas, solicitudes recientes, pagos, alertas) pero adaptadas a una pantalla pequeña con menú hamburguesa.",
    "toc": {
      "s1": "1. Acceso al panel móvil",
      "s2": "2. Estructura general",
      "s3": "3. 5 acciones rápidas",
      "s4": "4. Stats KPIs",
      "s5": "5. Pestañas (Solicitudes / Pagos / Alertas)",
      "s6": "6. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Acceso al panel móvil",
      "intro": "Después de <a href=\"12-iniciar-sesion.html\">iniciar sesión</a> en la app, el panel principal aparece automáticamente. Si la biometría está activada (cf. <a href=\"16-seguridad.html\">Seguridad</a>), el desbloqueo es instantáneo."
    },
    "s2": {
      "title": "2. Estructura general de la pantalla",
      "intro": "3 zonas verticales:",
      "zone1": "<strong>Cabecera (top)</strong> — saludo personalizado «Hola, [su nombre]», icono notificaciones (campanita con badge rojo si tiene mensajes no leídos), avatar/inicial.",
      "zone2": "<strong>4 KPIs en cards</strong> — Solicitudes activas, Solicitudes completadas, Pendientes de acción, Total pagado XAF.",
      "zone3": "<strong>5 acciones rápidas</strong> — Nueva Solicitud, Mis Solicitudes, Mis Documentos, Mis Empresas, Soporte. Iconos grandes en grid 2x3.",
      "zone4": "<strong>Pestañas inferiores</strong> — Solicitudes recientes / Pagos / Alertas. Lista paginada de los 10 elementos más recientes.",
      "fig1": {
        "alt": "Panel principal móvil ES",
        "caption": "Pantalla del panel principal en versión española — saludo «Hola, libre», campanita notificaciones, 4 KPIs (Solicitudes activas, Completadas, Pendientes, Total pagado), 5 acciones rápidas (Nueva Solicitud, Mis Solicitudes, Mis Documentos, Mis Empresas, Soporte), pestañas inferiores Solicitudes/Pagos/Alertas."
      }
    },
    "s3": {
      "title": "3. Las 5 acciones rápidas",
      "table": {
        "col1": "Acción",
        "col2": "Función",
        "col3": "Página manual"
      },
      "r1": {
        "c1": "Nueva Solicitud",
        "c2": "Lanza el wizard de creación de solicitud"
      },
      "r2": {
        "c1": "Mis Solicitudes",
        "c2": "Lista completa de sus solicitudes"
      },
      "r3": {
        "c1": "Mis Documentos",
        "c2": "Caja fuerte digital"
      },
      "r4": {
        "c1": "Mis Empresas",
        "c2": "Sólo si tiene un rol Empresa"
      },
      "r5": {
        "c1": "Soporte",
        "c2": "Tickets + asistente IA"
      }
    },
    "s4": {
      "title": "4. Stats KPIs en cabecera",
      "intro": "Las 4 cards en cabecera dan una visión instantánea del estado de su cuenta. Idéntico a la versión Web (cf. <a href=\"21-dashboard-web.html\">Panel principal Web</a> §3) salvo que están dispuestas en grid 2x2 en lugar de 1x4 horizontal.",
      "fig1": {
        "alt": "Dashboard mobile FR",
        "caption": "Versión francesa del dashboard móvil — mismas KPIs (1 active, 2 terminées, 0 action, 245 850 XAF), grid 2x3 de 5 acciones rápidas. (Captura en versión francesa)"
      }
    },
    "s5": {
      "title": "5. Pestañas en la parte inferior",
      "intro": "3 pestañas conmutables, cada una mostrando los <strong>10 elementos más recientes</strong> con scroll infinito al deslizarse hacia abajo:",
      "req": {
        "title": "Pestaña «Solicitudes»",
        "body": "Sus solicitudes recientes con badge de estado (Borrador, Enviada, Procesando, Completada, Rechazada) y barra de progreso. Pulse una línea para abrir el detalle."
      },
      "pay": {
        "title": "Pestaña «Pagos»",
        "body": "Lista de pagos con método (badge «Efectivo», «Mobile Money», etc.), monto, estado validación. Pulse para descargar el recibo PDF."
      },
      "fig1": {
        "alt": "Pestaña Pagos móvil",
        "caption": "Pestaña «Pagos» activa con 5 pagos visibles, cada uno con badge «Efectivo», monto en XAF, fecha."
      },
      "alerts": {
        "title": "Pestaña «Alertas»",
        "body": "Notificaciones recientes (cambios de estado, mensajes de agentes, alertas de vencimiento). Las alertas críticas tienen un punto rojo. Toca una alerta para abrir el elemento concernido."
      }
    },
    "s6": {
      "title": "6. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "Menú lateral",
        "c2": "Persistente a la izquierda",
        "c3": "Hamburguesa (icono ☰)"
      },
      "r2": {
        "c1": "KPIs disposición"
      },
      "r3": {
        "c1": "Acciones rápidas",
        "c2": "3 cards superiores",
        "c3": "Grid 2x3 con iconos grandes"
      },
      "r4": {
        "c1": "Notificaciones push"
      },
      "r5": {
        "c1": "Biometría desbloqueo"
      },
      "r6": {
        "c1": "Modo offline"
      },
      "success": "Para las funcionalidades exclusivas mobile (biometría, app lock, scan QR, partage natif), consulte la página <a href=\"39-mobile-exclusivos.html\">Funciones exclusivas móvil</a>."
    },
    "prev": "← Anterior: Soporte (Web)",
    "next": "Siguiente: Iniciar trámite (Móvil) →"
  },
  "page32": {
    "html_title": "Iniciar trámite (Móvil) — Manual Facil",
    "title": "Iniciar un trámite (Móvil)",
    "description": "El wizard móvil sigue las mismas 10 etapas que la versión Web (cf. <a href=\"22-iniciar-tramite-web.html\">page 22</a>) pero adaptadas al formato móvil : categorías colapsables, cámara directa para subir documentos, claviers numériques específicos para los campos numéricos, validación tactile.",
    "toc": {
      "s1": "1. Acceder al wizard",
      "s2": "2. Selección por categorías colapsables",
      "s3": "3. Detalle del servicio antes del wizard",
      "s4": "4. Wizard 10 etapas (visto en versión móvil)",
      "s5": "5. Subida con cámara directa",
      "s6": "6. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Acceder al wizard",
      "intro": "3 puntos de entrada en la app móvil:",
      "f1": "Desde el <a href=\"31-dashboard-mobile.html\">panel principal</a> → tarjeta «Nueva Solicitud»",
      "f2": "Desde el menú hamburguesa → «Iniciar trámite»",
      "f3": "Desde el <a href=\"37-asistente-ia-mobile.html\">asistente IA</a> → quick-start «Iniciar un trámite»"
    },
    "s2": {
      "title": "2. Selección por categorías colapsables",
      "intro": "Para optimizar el espacio en pantalla pequeña, los servicios se agrupan en <strong>6 categorías colapsables</strong> en lugar del tableau étendu de la versión Web :",
      "c1": "Identidad (DIP, NIE)",
      "c2": "Extranjería (residencia, visados)",
      "c3": "Vehículos (matriculación, ITV)",
      "c4": "Conducción (carnet)",
      "c5": "Contratos (contratos comerciales, ONRC)",
      "c6": "Comercio (licencias)",
      "body": "Pulse una categoría para desplegar los servicios disponibles. Pulse de nuevo para colapsar.",
      "fig1": {
        "alt": "Iniciar trámite categorías colapsables",
        "caption": "Pantalla «Iniciar un trámite» — 6 categorías colapsables. Categoría «Vehículos» desplegada (3 sub-opciones visibles), las otras 5 categorías cerradas."
      }
    },
    "s3": {
      "title": "3. Detalle del servicio antes de iniciar el wizard",
      "intro": "Antes de pulsar «Iniciar», la pantalla de detalle del servicio muestra todos los datos clave : ministerio emisor, tarifa en XAF, lista de documentos requeridos, procedimiento en pasos, servicios relacionados.",
      "fig1": {
        "alt": "Detalle servicio Duplicados",
        "caption": "Detalle servicio «Duplicados» — MINISTERIO DE INTERIOR Y ADMIN LOCAL, expedición 15 000 XAF, 5 documentos requeridos, procedimiento 5 pasos, servicios relacionados."
      }
    },
    "s4": {
      "title": "4. Wizard de 10 etapas — versión móvil",
      "intro": "Las mismas 10 etapas que en versión Web, pero adaptadas:",
      "f1": "<strong>Stepper compacto</strong> (icono rond) en lugar del horizontal completo",
      "f2": "<strong>Una pantalla por etapa</strong> (no scroll continu) — más fácil de seguir",
      "f3": "<strong>Botones grandes táctiles</strong> en la parte inferior (Anterior / Siguiente)",
      "f4": "<strong>Validación táctil</strong> — chips, switches, radio cards adaptados al touch",
      "body": "El detalle completo de las 10 etapas (Tipo Solicitud, Tipo Solicitante, Clases, Documentos OCR, Verificar Datos 1/2/3, Programar Cita, Pago Tasas, Confirmación) está en la <a href=\"22-iniciar-tramite-web.html\">página versión Web</a>.",
      "fig1": {
        "alt": "Wizard step 2/6 upload",
        "caption": "Etapa de subida de documento (Step 2/6 visible aquí — el wizard puede tener menos etapas para algunos servicios) — «Pago Obligaciones - Documentos (2/6)», sube «Certificado Actualización Padrón Empresarial», botones <strong>«Tomar foto»</strong> y <strong>«Elegir archivo»</strong>."
      }
    },
    "s5": {
      "title": "5. Subida con cámara directa",
      "intro": "Funcionalidad <strong>exclusivamente móvil</strong> : el botón «Tomar foto» abre directamente la cámara del teléfono sin pasar por la galería. Útil para los documentos físicos (DIP, factura papel, certificado en mano).",
      "step1": "Pulse <strong>«Tomar foto»</strong> en la zona de subida",
      "step2": "El sistema solicita el permiso cámara la primera vez (autorize una sola vez)",
      "step3": "Encuadre el documento con la cámara, pulse el obturador",
      "step4": "La foto se previsualiza con opción «Reutilizar» o «Reanudar» antes de validar",
      "step5": "Pulse <strong>«Aceptar»</strong> — el OCR comienza inmediatamente y los datos extraídos se muestran con su porcentaje de confianza",
      "tip": "Para una OCR óptima : luz uniforme, documento plat (sin pliegues), enmarcar todo el documento con un margen de ~5 mm, evite las sombras de su cuerpo."
    },
    "s6": {
      "title": "6. Diferencias con la versión Web",
      "table": {
        "col1": "Aspecto",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "Selección servicio"
      },
      "r2": {
        "c1": "Stepper"
      },
      "r3": {
        "c1": "Subida documentos"
      },
      "r4": {
        "c1": "Pago Mobile Money"
      },
      "r5": {
        "c1": "Tiempo de sesión"
      },
      "r6": {
        "c1": "Compartir resultado"
      },
      "success": "Tras la creación, su solicitud aparece en «Mis solicitudes» — ver siguiente página."
    },
    "prev": "← Anterior: Panel principal",
    "next": "Siguiente: Mis solicitudes (Móvil) →"
  },
  "page33": {
    "html_title": "Mis solicitudes (Móvil) — Manual Facil",
    "title": "Mis solicitudes (Móvil)",
    "description": "Lista de todas sus solicitudes con filtros táctiles, FAB (Floating Action Button) para crear una nueva, y acceso al detalle por simple toque. Versión simplificada y optimizada del dashboard de seguimiento.",
    "toc": {
      "s1": "1. Acceder a la lista",
      "s2": "2. Filtros y FAB",
      "s3": "3. Lista de solicitudes",
      "s4": "4. Detalle de una solicitud",
      "s5": "5. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Acceder a la lista",
      "intro": "2 caminos: <strong>Panel principal → tarjeta «Mis Solicitudes»</strong> o <strong>menú hamburguesa → «Mis Solicitudes»</strong>."
    },
    "s2": {
      "title": "2. Filtros y FAB",
      "intro": "En la parte superior, una <strong>barra de filtros horizontales</strong> (chips) permite alternar entre estados:",
      "f1": "<strong>Ver todo</strong> — muestra todas las solicitudes",
      "f2": "<strong>Enviada</strong> — esperando validación",
      "f3": "<strong>En proceso</strong> — agente revisando",
      "f4": "<strong>En revisión</strong> — agente solicita info adicional",
      "body": "En la parte inferior derecha, un <strong>FAB (Floating Action Button)</strong> verde con el icono <strong>«+ Nueva Solicitud»</strong> permite lanzar el wizard directamente sin volver al panel.",
      "fig1": {
        "alt": "Mis solicitudes lista",
        "caption": "Pantalla «Mis Solicitudes» — chips de filtros (Ver todo / Enviada / En proceso / En revisión), 3 solicitudes listadas (Bundle Payment, Conducir Renovacion, Pasaporte Deterioro), FAB «+ Nueva Solicitud» abajo a la derecha."
      }
    },
    "s3": {
      "title": "3. Lista de solicitudes",
      "intro": "Cada línea muestra:",
      "f1": "<strong>Icono del trámite</strong> a la izquierda (passeport, conducir, etc.)",
      "f2": "<strong>Título corto</strong> + referencia (ex. CON-2026-00001)",
      "f3": "<strong>Badge estado</strong> con color (azul=Enviada, naranja=Procesando, verde=Completada, rojo=Rechazada)",
      "f4": "<strong>Fecha</strong> de última actualización",
      "f5": "Pulse la línea para abrir el detalle"
    },
    "s4": {
      "title": "4. Detalle de una solicitud (vista móvil)",
      "intro": "La pantalla de detalle muestra los mismos elementos que la versión Web (cf. <a href=\"23-mis-solicitudes-web.html\">page 23</a>) con adaptaciones móviles:",
      "f1": "<strong>Stepper vertical</strong> (en lugar de horizontal) — más fácil de leer en pantalla pequeña",
      "f2": "<strong>Tabs deslizables</strong> entre Resumen / Documentos / Pagos",
      "f3": "<strong>CTA «Compartir»</strong> nativo (WhatsApp, SMS, email)",
      "f4": "<strong>CTA «Descargar PDF»</strong> con guardado en la galería del teléfono",
      "f5": "<strong>Pull-to-refresh</strong> — desliza hacia abajo para refrescar el estado"
    },
    "s5": {
      "title": "5. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "KPIs cabecera"
      },
      "r2": {
        "c1": "Filtros"
      },
      "r3": {
        "c1": "Stepper detalle"
      },
      "r4": {
        "c1": "Acciones rápidas"
      },
      "r5": {
        "c1": "Pull-to-refresh"
      },
      "r6": {
        "c1": "Compartir"
      },
      "success": "Para los pagos asociados a las solicitudes, ver siguiente página."
    },
    "prev": "← Anterior: Iniciar trámite",
    "next": "Siguiente: Mis pagos (Móvil) →"
  },
  "page34": {
    "html_title": "Mis pagos (Móvil) — Manual Facil",
    "title": "Mis pagos (Móvil)",
    "description": "Vista rápida de todos sus pagos efectuados en la app móvil — los métodos, los estados de validación, los recibos PDF descargables o compartibles vía partage nativo (WhatsApp, SMS, email).",
    "toc": {
      "s1": "1. Pestaña «Pagos» en el dashboard",
      "s2": "2. BANGE Mobile Money auto-detect (móvil)",
      "s3": "3. Recibo PDF — descarga y partage",
      "s4": "4. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Pestaña «Pagos» en el dashboard",
      "intro": "Acceso : Panel principal → pestaña <strong>«Pagos»</strong> en la parte inferior. Lista de pagos con badge método (Efectivo, Mobile Money, Tarjeta, Transferencia, Cheque), monto, fecha, estado.",
      "fig1": {
        "alt": "Pestaña Pagos móvil",
        "caption": "Pestaña «Pagos» activa en el panel principal — 5 pagos visibles con badge «Efectivo», montos en XAF, fechas. Pulse un pago para ver el recibo."
      }
    },
    "s2": {
      "title": "2. BANGE Mobile Money — auto-detección del SIM",
      "intro": "Funcionalidad <strong>exclusivamente móvil</strong>: la app detecta automáticamente el número de teléfono asociado al SIM activo y pre-rellena el campo «Número de teléfono» en el formulario de pago Mobile Money. No es necesario re-introducirlo cada vez.",
      "body": "El permiso «Lecture du téléphone» es solicitado la primera vez (puede rechazarlo y rellenar manualmente el número).",
      "tip": "El pago Mobile Money es el más rápido (validación automática vía webhook BANGE en menos de 1 minuto). Recomendado para los pagos urgentes."
    },
    "s3": {
      "title": "3. Recibo PDF — descarga y partage nativo",
      "intro": "Tras la validación del pago, el recibo PDF se genera automáticamente. En la app móvil :",
      "f1": "<strong>Descargar</strong> — guarda el PDF en la galería del teléfono (carpeta «Documentos» o «Imágenes»)",
      "f2": "<strong>Compartir nativo</strong> — abre el sheet de partage de iOS/Android (WhatsApp, SMS, email, AirDrop, etc.)",
      "f3": "<strong>Imprimir</strong> — vía AirPrint (iOS) o Cloud Print (Android) en una impresora compatible Wi-Fi",
      "fig1": {
        "alt": "Recibo PDF generado",
        "caption": "Ejemplo de recibo PDF generado «Recibo de Pago» REC-2026-000011 — Tesoro Público Malabo II, desglose 5 líneas 99 000 XAF, QR code de verificación + sello «VALIDADO»."
      }
    },
    "s4": {
      "title": "4. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "BANGE Mobile Money",
        "c2": "Manual (introducir tel)",
        "c3": "Auto-detección SIM"
      },
      "r2": {
        "c1": "Compartir recibo"
      },
      "r3": {
        "c1": "Impresión",
        "c2": "Diálogo Chrome",
        "c3": "AirPrint / Cloud Print"
      },
      "success": "Detalles completos sobre los métodos, validación y verificación pública en la <a href=\"24-mis-pagos-web.html\">página versión Web</a>."
    },
    "prev": "← Anterior: Mis solicitudes",
    "next": "Siguiente: Mis documentos →"
  },
  "page35": {
    "html_title": "Mis documentos (Móvil) — Manual Facil",
    "title": "Mis documentos (Móvil)",
    "description": "Su caja fuerte digital en la app móvil — gestión de archivos personales subidos y documentos generados (recibos, certificados). Quota 100 MB, filtros tactiles, partage natif, scan QR para verificar la autenticidad.",
    "toc": {
      "s1": "1. Acceso a la caja fuerte",
      "s2": "2. Las 3 pestañas + filtros",
      "s3": "3. Scan QR de un documento (verificación)",
      "s4": "4. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Acceso a la caja fuerte",
      "intro": "Acceso vía dashboard → tarjeta «Mis Documentos» o menú hamburguesa. La pantalla muestra el <strong>contador de cuota usada</strong> en la cabecera (ejemplo: «2 / 100 Mo»).",
      "fig1": {
        "alt": "Mis documentos móvil",
        "caption": "Pantalla «Mis Documentos» — quota 2/100 Mo en cabecera, 3 pestañas (Mes fichiers / Generados / Alertas), filtros (Tous/Recibos/Certificados/Atestaciones), lista de PDFs (Recibo Pago, Solicitud Trámite)."
      }
    },
    "s2": {
      "title": "2. Las 3 pestañas + filtros",
      "f1": "<strong>Mes fichiers</strong> — sus documentos personales subidos manualmente (DIP, foto carnet, certificados, etc.)",
      "f2": "<strong>Generados</strong> — recibos, resúmenes de solicitud, certificaciones generadas automáticamente por Facil tras validación",
      "f3": "<strong>Alertas</strong> — notificaciones de vencimiento de documentos (DIP cerca a expirar, etc.)",
      "body": "Filtros disponibles en cada pestaña: Todos, Recibos, Certificados, Atestaciones. Toque un documento para abrir el preview (PDF/imagen)."
    },
    "s3": {
      "title": "3. Scan QR de un documento (verificación)",
      "intro": "Funcionalidad <strong>exclusivamente móvil</strong> : un botón de <strong>scan QR</strong> permite verificar la autenticidad de un documento que ha recibido (papel o capturado en otra pantalla). El sistema escanea el QR, abre la <a href=\"57-verificar.html\">página de verificación pública</a> y muestra el estado (válido / inválido).",
      "body": "Útil para los agentes terreno o los citoyens que reciben un recibo PDF y quieren verificarlo sin escribir manualmente la URL."
    },
    "s4": {
      "title": "4. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "Subida documento",
        "c3": "Cámara directa / galería / fichero"
      },
      "r2": {
        "c1": "Tabs",
        "c2": "4 (Personales/Generados/Preparación/Asistente)",
        "c3": "3 (simplificado)"
      },
      "r3": {
        "c1": "Scan QR"
      },
      "r4": {
        "c1": "Compartir documento"
      },
      "success": "Detalles del asistente IA (modo proactivo, memorias aprendidas) en la <a href=\"25-mis-documentos-web.html\">página versión Web</a>."
    },
    "prev": "← Anterior: Mis pagos",
    "next": "Siguiente: Mis empresas →"
  },
  "page36": {
    "html_title": "Mis empresas (Móvil) — Manual Facil",
    "title": "Mis empresas (Móvil)",
    "description": "Gestione sus empresas desde la app móvil — vista compacta de las obligaciones fiscales, botón directo «Pagar» en cada empresa, FAB para añadir una nueva, detalle vertical optimizado para pantalla pequeña.",
    "toc": {
      "s1": "1. Lista de empresas",
      "s2": "2. Detalle de una empresa",
      "s3": "3. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Lista de empresas",
      "intro": "Acceso vía menú hamburguesa → «Mis Empresas». Lista vertical de cards compactas, una por empresa. Cada card muestra:",
      "f1": "Nombre comercial + tag sector (Carpintería, Bar/Restaurante, Cafetería, etc.)",
      "f2": "Zona (A1/B2/C1/D) + ciudad",
      "f3": "Indicador <strong>«N obligaciones pendientes»</strong> (con punto rojo si hay alguna)",
      "f4": "Botón <strong>«Pagar»</strong> directo (atajo al wizard bundle)",
      "body": "Un <strong>FAB (+)</strong> en la parte inferior derecha permite añadir una nueva empresa (require documents legales).",
      "fig1": {
        "alt": "Mis empresas ES",
        "caption": "Versión española «Mis Empresas» — 5 empresas (Carpinteria, Libreria Nacional, Tienda El Sol, Supermercado, Gas Natural) con obligaciones pendientes + botón «Pagar» + FAB añadir."
      },
      "fig2": {
        "alt": "Mes entreprises FR",
        "caption": "Versión francesa «Mes Entreprises» — mismas 5 empresas, traducción «Payer les obligations», icono FAB ajouter en la parte inferior. (Captura en versión francesa)"
      }
    },
    "s2": {
      "title": "2. Detalle de una empresa",
      "intro": "Toque una empresa para abrir su pantalla detallada. Versión móvil simplificada con scroll vertical:",
      "f1": "Lista de obligaciones (Cuota Anual, Certificado Comercio, etc.) con monto y vencimiento",
      "f2": "Botón principal <strong>«Pagar las obligaciones»</strong> (verde, ancho completo)",
      "f3": "Sección Historial pagos (los últimos 5)",
      "f4": "Sección Informaciones (NIF, representante, forma jurídica, ciudad)",
      "fig1": {
        "alt": "Detalle empresa móvil",
        "caption": "Detalle empresa «Tienda El Sol» — lista de obligaciones (Cuota Anual, Certificado Comercio, etc.), botón «Payer les obligations», sección Historial paiements + Informaciones (NIF, representante, forma jurídica, ciudad). (Captura en versión francesa)"
      }
    },
    "s3": {
      "title": "3. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "Vista lista"
      },
      "r2": {
        "c1": "KPIs detalle",
        "c3": "Compactados en 1 línea"
      },
      "r3": {
        "c1": "Tabs detalle",
        "c3": "Scroll vertical único"
      },
      "r4": {
        "c1": "Add empresa"
      },
      "success": "Detalles complete sobre las 3 pestañas (Obligaciones/Historial/Inspecciones), KPIs y Bundle Payment en la <a href=\"27-mis-empresas-web.html\">página versión Web</a> + <a href=\"26-bundle-payment.html\">Pago agrupado</a>."
    },
    "prev": "← Anterior: Mis documentos",
    "next": "Siguiente: Asistente IA →"
  },
  "page37": {
    "html_title": "Asistente IA (Móvil) — Manual Facil",
    "title": "Asistente IA (Móvil)",
    "description": "El asistente IA en la app móvil ofrece la misma potencia que la versión Web (cf. <a href=\"29-soporte-web.html\">page 29</a>) pero adaptada al touch + funcionalidades exclusivas móvil : voz-a-texto, contexto SIM auto-detect, integración con cofre digital local.",
    "toc": {
      "s1": "1. Acceder al asistente",
      "s2": "2. Voz-a-texto (exclusivo móvil)",
      "s3": "3. Contexto personal automático",
      "s4": "4. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Acceder al asistente",
      "intro": "Acceso : Panel principal → tarjeta «Asistente IA» o menú hamburguesa. La pantalla de chat ocupa toda la pantalla (modo full-screen, único en móvil — el widget flotante es solo Web).",
      "body": "Pantalla de inicio idéntica a la versión Web : 4 sugerencias contextuales + sección «Mi Cofre Digital» con 5 quick actions. Detalles en la <a href=\"29-soporte-web.html\">página versión Web</a>."
    },
    "s2": {
      "title": "2. Voz-a-texto (exclusivo móvil)",
      "intro": "Funcionalidad <strong>exclusivamente móvil</strong> : un icono de <strong>micrófono</strong> en el campo de entrada permite dictar su pregunta en lugar de escribir. Útil cuando se desplaza o quiere ahorrar tiempo.",
      "step1": "Pulse el icono micrófono en el campo de entrada",
      "step2": "El sistema solicita el permiso micrófono la primera vez",
      "step3": "Dicte su pregunta en el idioma seleccionado (ES/FR/EN)",
      "step4": "El texto se rellena automáticamente — verifique antes de validar",
      "step5": "Pulse «Enviar»",
      "tip": "El reconocimiento vocal funciona offline en los teléfonos modernos (iOS 13+/Android 11+). Use un entorno silencioso para mejorar la precisión."
    },
    "s3": {
      "title": "3. Contexto personal automático",
      "intro": "El asistente conectado dispone del mismo contexto personal que la versión Web (sus empresas, solicitudes, documentos). En móvil además :",
      "f1": "<strong>SIM auto-detect</strong> — el número de teléfono asociado al SIM activo es conocido automáticamente para los pagos Mobile Money",
      "f2": "<strong>Localización GPS</strong> (opt-in) — el asistente puede sugerir la oficina más próxima si está activado",
      "f3": "<strong>Cofre digital local</strong> — los documentos descargados están disponibles offline, el asistente los conoce"
    },
    "s4": {
      "title": "4. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "Modo full-screen"
      },
      "r2": {
        "c1": "Widget flotante"
      },
      "r3": {
        "c1": "Voz-a-texto"
      },
      "r4": {
        "c1": "SIM auto-detect"
      },
      "r5": {
        "c1": "Localización GPS"
      },
      "r6": {
        "c1": "Funcionamiento offline"
      },
      "success": "La aplicación móvil enriquece el asistente IA con funcionalidades exclusivas. Para los detalles del prompt + sugerencias + paquetes fiscales, consulte la versión Web."
    },
    "prev": "← Anterior: Mis empresas",
    "next": "Siguiente: Soporte (Móvil) →"
  },
  "page38": {
    "html_title": "Soporte (Móvil) — Manual Facil",
    "title": "Soporte (Móvil)",
    "description": "Sistema de tickets de soporte en la app móvil — lista compacta de sus tickets con badge estado/prioridad, FAB para crear un nuevo, notifications push automáticas a cada respuesta del agente de soporte.",
    "toc": {
      "s1": "1. Lista de tickets",
      "s2": "2. Filtros + FAB nuevo ticket",
      "s3": "3. Detalle del ticket + push notifications",
      "s4": "4. Diferencias con la versión Web"
    },
    "s1": {
      "title": "1. Lista de tickets",
      "intro": "Acceso : Panel principal → tarjeta «Soporte» o menú hamburguesa → «Soporte». La pantalla muestra una lista vertical de cards con vos tickets.",
      "fig1": {
        "alt": "Mis tickets soporte móvil",
        "caption": "Pantalla «Mis Tickets» — chips de filtros (Todos/Abiertos/Resueltos/Cerrados), 4 tickets visibles (Vérification test mobile, 3eme test, Second test, Tests) con badge estado + FAB «Nuevo ticket» en la parte inferior derecha."
      }
    },
    "s2": {
      "title": "2. Filtros + FAB nuevo ticket",
      "intro": "Chips horizontales en la parte superior:",
      "f1": "<strong>Todos</strong> — todos sus tickets",
      "f2": "<strong>Abiertos</strong> — tickets esperando respuesta",
      "f3": "<strong>Resueltos</strong> — agente respondió, espera confirmación",
      "f4": "<strong>Cerrados</strong> — definitivos, no reabribles",
      "body": "El <strong>FAB (+ Nuevo ticket)</strong> abre el formulario simplificado para crear un ticket: categoría, asunto, descripción, prioridad. Posibilidad de adjuntar capturas de pantalla directamente desde la galería."
    },
    "s3": {
      "title": "3. Detalle del ticket + push notifications",
      "intro": "Toque un ticket para abrir su detalle. Vista de tipo «conversación» (similar à WhatsApp) con sus mensajes y los del agente alternándose. Posibilidad de adjuntar nuevas capturas en cada respuesta.",
      "body": "A cada respuesta del agente, recibe una <strong>push notification</strong> en su teléfono (icono Facil + extracto del mensaje). Toque la notificación para abrir directamente el ticket concernido.",
      "warning": "Los tickets cerrados <strong>no son reabribles</strong>. Si su problema persiste, cree un nuevo ticket haciendo referencia al SUP- anterior en la descripción para conservar el contexto."
    },
    "s4": {
      "title": "4. Diferencias con la versión Web",
      "table": {
        "col1": "Función",
        "col2": "Web",
        "col3": "Móvil"
      },
      "r1": {
        "c1": "Vista detalle",
        "c2": "2 colonnes (info + conversación)",
        "c3": "Conversación pleine page"
      },
      "r2": {
        "c1": "Crear ticket"
      },
      "r3": {
        "c1": "Adjuntar archivos",
        "c3": "Cámara directa o galería"
      },
      "r4": {
        "c1": "Notificaciones"
      },
      "success": "Detalles complete sobre el sistema de tickets (estados, prioridad, plazos respuesta) en la <a href=\"29-soporte-web.html\">página versión Web</a>."
    },
    "prev": "← Anterior: Asistente IA",
    "next": "Siguiente: Funciones exclusivas móvil →"
  },
  "page39": {
    "html_title": "Funciones exclusivas móvil — Manual Facil",
    "title": "Funciones exclusivamente móvil",
    "description": "Esta página agrupa las 7 funcionalidades exclusivas de la aplicación móvil Facil que la versión Web no puede ofrecer. Estas funcionalidades son una de las razones principales para usar la app móvil además del navegador, especialmente para los citoyens en movilidad.",
    "no_capture": "<strong>Esta página no incluye capturas</strong> — las funcionalidades descritas están integradas dentro de las otras pantallas (capturas en sus páginas dedicadas). Use los enlaces para acceder a las capturas y ejemplos contextuales.",
    "toc": {
      "s1": "1. Biometría (Touch ID / Face ID)",
      "s2": "2. App Lock (PIN local)",
      "s3": "3. Modo offline (caché MMKV)",
      "s4": "4. Push notifications (FCM/APNs)",
      "s5": "5. Scan QR de documentos",
      "s6": "6. Partage natif (WhatsApp, SMS, etc.)",
      "s7": "7. Voz-a-texto (asistente IA)",
      "s8": "8. SIM auto-detect (BANGE Mobile Money)",
      "s9": "9. Cámara directa (subida documentos)"
    },
    "s1": {
      "title": "1. Biometría — Touch ID / Face ID",
      "intro": "Desbloqueo por <strong>huella digital</strong> o <strong>reconocimiento facial</strong> en lugar de email + contraseña + 2FA. Activación desde <a href=\"16-seguridad.html\">Seguridad → Biometría</a>. Datos biométricos nunca salen del teléfono (chips iOS Secure Enclave / Android StrongBox)."
    },
    "s2": {
      "title": "2. App Lock — bloqueo local con PIN",
      "intro": "Capa adicional <strong>al abrir la app</strong> incluso sin cerrar sesión. PIN local de 4-6 cifras o biometría. Útil si presta su teléfono o lo deja desbloqueado. Tiempo de espera configurable (0s / 30s / 1min / 5min / al apagar la pantalla). Detalles en <a href=\"16-seguridad.html#applock\">Seguridad §4</a>."
    },
    "s3": {
      "title": "3. Modo offline — caché MMKV",
      "intro": "La app móvil utiliza <strong>MMKV</strong> (caché local key-value ultra-rápida, ~50KB de overhead) para almacenar:",
      "f1": "<strong>Lista de sus solicitudes</strong> recientes (últimas 30)",
      "f2": "<strong>Documentos descargados</strong> (recibos, certificados)",
      "f3": "<strong>Conversación asistente IA</strong> en curso",
      "f4": "<strong>Catálogo servicios</strong> (los 873 servicios cacheados localmente)",
      "body": "Sin conexión, puede consultar estos datos. Las acciones (crear, pagar, validar) requieren conexión. La sincronización se hace automáticamente al recobrar la red."
    },
    "s4": {
      "title": "4. Push notifications — FCM (Android) / APNs (iOS)",
      "intro": "Notificaciones temps réel sobre los eventos importantes:",
      "f1": "Validación de pago (icono verde + extracto)",
      "f2": "Estado de solicitud que cambia (En proceso → Completada)",
      "f3": "Mensaje de un agente (soporte, validador)",
      "f4": "Alerta de vencimiento de documento (DIP cerca a expirar)",
      "body": "Las notifications llaman directamente al backend FCM/APNs, sin proxy externe (Expo Push). Latencia &lt; 5 segundos."
    },
    "s5": {
      "title": "5. Scan QR de documentos (verificación)",
      "intro": "Botón <strong>«Scan QR»</strong> en la app móvil para verificar la autenticidad de un recibo, una solicitud o una licencia comercial. Apunte la cámara al QR del documento, el sistema abre automáticamente la <a href=\"57-verificar.html\">página verificación pública</a>. Detalles : <a href=\"57-verificar.html\">page Verify</a>."
    },
    "s6": {
      "title": "6. Partage natif (sheet de partage iOS/Android)",
      "intro": "Botón <strong>«Compartir»</strong> en cada solicitud, recibo, documento generado : abre el sheet de partage natif del sistema:",
      "f1": "WhatsApp / WhatsApp Business",
      "f2": "SMS / iMessage",
      "f3": "Email (Gmail, Outlook, otros)",
      "f4": "AirDrop (iOS) / Nearby Share (Android)",
      "f5": "Bluetooth, Drive, Notes, otras apps instaladas",
      "body": "Útil para compartir un recibo con su contable, un certificado con un empleador, etc."
    },
    "s7": {
      "title": "7. Voz-a-texto en el asistente IA",
      "intro": "Icono <strong>micrófono</strong> en el campo de entrada del asistente IA. Dicte su pregunta en lugar de escribir. Detalles en <a href=\"37-asistente-ia-mobile.html#voz\">page Asistente IA Móvil §2</a>."
    },
    "s8": {
      "title": "8. SIM auto-detect (BANGE Mobile Money)",
      "intro": "Detección automática del número asociado al SIM activo para los pagos Mobile Money. Pre-rellena el formulario de pago. Detalles en <a href=\"34-mis-pagos-mobile.html#bange\">page Mis pagos Móvil §2</a>."
    },
    "s9": {
      "title": "9. Cámara directa (subida de documentos)",
      "intro": "Botón <strong>«Tomar foto»</strong> en cada zona de subida de documento — abre directamente la cámara sin pasar por la galería. Útil para los documentos físicos (DIP, factura papel). Detalles en <a href=\"32-iniciar-tramite-mobile.html#camara\">page Iniciar trámite Móvil §5</a>.",
      "success": "Estas 9 funcionalidades hacen de la app móvil la opción privilegiada para los usuarios en movilidad. La aplicación Web sigue siendo recomendada para las tareas administrativas profundas (multi-empresa, lots de documentos, dashboards detallados)."
    },
    "prev": "← Anterior: Soporte (Móvil)",
    "next": "Siguiente: Rol Empresa →"
  },

  "page41": {
    "html_title": "Rol Empresa — Manual Facil",
    "title": "Rol Empresa: trabajar a nombre de una entidad jurídica",
    "subtitle": "Las empresas (sociedades, asociaciones, fundaciones, sucursales) operan en Facil con un identificador propio (NIF de entidad), una ficha en el Registro Nacional Tributario (RNT) y la posibilidad de tener varios miembros con distintos roles. Esta página recorre las diferencias clave frente al rol Ciudadano y los puntos de entrada a las funciones específicas.",
    "prev": "← Anterior: Funciones exclusivas Móvil",
    "next": "Siguiente: Gestionar empresas →",
    "s1": {
      "title": "1. ¿Cuándo se utiliza el rol Empresa?",
      "body": "El rol Empresa es para personas que actúan en nombre de una entidad jurídica registrada en Guinea Ecuatorial: una sociedad anónima, una sucursal, una asociación, una fundación o cualquier forma jurídica reconocida por el RNT. La diferencia con el rol Ciudadano no es el tipo de servicios disponibles —ambos pueden iniciar trámites, pagar y descargar documentos— sino el propietario del expediente fiscal y los flujos de obligaciones específicas (IVA, retenciones, declaraciones consolidadas, licencias comerciales).",
      "callout": {
        "title": "Casos típicos del rol Empresa",
        "l1": "Una empresa renueva su licencia comercial anual para uno o varios establecimientos.",
        "l2": "Una sociedad declara el IVA mensual o trimestral.",
        "l3": "Una sucursal solicita pasaportes o autorizaciones de trabajo para varios empleados a la vez (solicitudes en lote — página 43).",
        "l4": "Un grupo paga de forma consolidada todas sus obligaciones del trimestre con un único recibo (pago agrupado — página 26)."
      }
    },
    "s2": {
      "title": "2. Diferencias con el rol Ciudadano",
      "intro": "La tabla siguiente resume las cinco diferencias estructurales entre los dos roles. Todo el resto (Asistente IA, soporte, notificaciones, validación de recibos) funciona igual.",
      "table": {
        "h1": "Aspecto",
        "h2": "Rol Ciudadano",
        "h3": "Rol Empresa",
        "r1": {
          "c1": "<strong>Identificador fiscal</strong>",
          "c2": "DIP del titular (persona física)",
          "c3": "NIF de la entidad jurídica (asignado por la DGI al registrar la empresa)"
        },
        "r2": {
          "c1": "<strong>Propietario de los trámites</strong>",
          "c2": "El usuario conectado",
          "c3": "La empresa (cualquier miembro autorizado puede acceder al expediente)"
        },
        "r3": {
          "c1": "<strong>Equipo</strong>",
          "c2": "Una sola persona",
          "c3": "Hasta varios miembros con roles (propietario, administrador, contable, miembro)"
        },
        "r4": {
          "c1": "<strong>Obligaciones específicas</strong>",
          "c2": "IRPF, pasaportes, residencia, conducir",
          "c3": "IVA, retenciones, IS, licencias comerciales, declaraciones consolidadas"
        },
        "r5": {
          "c1": "<strong>Flujos típicos</strong>",
          "c2": "Trámites individuales",
          "c3": "Solicitudes en lote (página 43) y pago agrupado multi-obligación (página 26)"
        }
      }
    },
    "s3": {
      "title": "3. El selector de empresa (sticky)",
      "body": "Si su cuenta tiene acceso a varias empresas (caso del contable o del propietario de un grupo), el panel principal muestra un selector de empresa siempre visible en la parte superior. El selector indica qué entidad está activa en el contexto: todos los KPI, listas y acciones rápidas se filtran por la empresa seleccionada. Cambiar de empresa se hace en un clic; las pantallas se recargan automáticamente con los datos de la nueva entidad.",
      "tip": {
        "title": "Buena práctica",
        "body": "Verifique siempre el nombre de la empresa activa en el selector antes de iniciar un trámite o realizar un pago. Una solicitud creada en la empresa equivocada se queda asociada a esa empresa y, aunque corregible (transferencia administrativa por la DGI), genera trabajo de soporte adicional."
      },
      "body2": "Para añadir una empresa al selector (porque es nueva en Facil o porque se le ha invitado a un equipo existente), consulte la página <a href=\"42-gestion-empresas.html\" data-i18n=\"page41.s3.link.42\">Gestionar empresas</a>. Para ver la lista completa de las empresas de su cuenta con sus licencias y obligaciones, vaya a <a href=\"27-mis-empresas-web.html\" data-i18n=\"page41.s3.link.27\">Mis empresas (Web)</a> o <a href=\"36-mis-empresas-mobile.html\" data-i18n=\"page41.s3.link.36\">Mis empresas (Móvil)</a>.",
      "link": {
        "42": "Gestionar empresas",
        "27": "Mis empresas (Web)",
        "36": "Mis empresas (Móvil)"
      }
    },
    "s4": {
      "title": "4. Puntos de entrada específicos del rol Empresa",
      "intro": "Una vez seleccionada una empresa, encontrará estas funciones que no aparecen en el rol Ciudadano:",
      "l1": "<strong>Pago agrupado</strong> — saldar de una vez varias obligaciones (Tesoro Público, Ayuntamiento, Cámara de Comercio) con un solo recibo. Detallado en <a href=\"26-bundle-payment.html\">Pago agrupado</a>.",
      "l2": "<strong>Solicitudes en lote</strong> — crear varias solicitudes del mismo tipo en una operación (por ejemplo, 50 pasaportes para empleados). Detallado en <a href=\"43-batch-requests.html\">Solicitudes en lote</a>.",
      "l3": "<strong>Gestión de miembros y roles</strong> — invitar a un colaborador, atribuirle un rol, retirar un acceso. Detallado en <a href=\"42-gestion-empresas.html\">Gestionar empresas</a>.",
      "l4": "<strong>Vista contable consolidada</strong> — para los contables que gestionan varias empresas a la vez, ver <a href=\"44-rol-contable.html\">Rol Contable</a>."
    },
    "s5": {
      "title": "5. Cómo añadir una empresa a su cuenta",
      "body": "Hay dos vías para que una empresa aparezca en su cuenta Facil:",
      "l1": "<strong>Crear la empresa</strong> — desde <a href=\"27-mis-empresas-web.html\">Mis empresas</a>, botón <em>«Añadir empresa»</em>. Necesita el NIF de la entidad y prueba de su rol (acta de nombramiento, poder, certificado registral). La empresa entra en estado <em>«verificación pendiente»</em> hasta que la DGI valida los justificantes (24-72 h hábiles).",
      "l2": "<strong>Aceptar una invitación</strong> — si otro miembro le ha enviado una invitación por email, recibirá un enlace para unirse al equipo en un rol específico (administrador, contable o miembro). El acceso es inmediato tras aceptar; no necesita aportar justificantes adicionales."
    },
    "s6": {
      "title": "6. Mismos servicios, mismo asistente IA",
      "body": "Aparte de las funciones propias mencionadas arriba, todo lo demás es idéntico al rol Ciudadano: el catálogo de los 850+ servicios fiscales (página 51), la calculadora (página 52), el directorio (página 53), el asistente IA (página 55), la verificación de recibos (página 57). El asistente IA conectado (página 29) tiene además acceso al contexto de la empresa activa: si pregunta «¿cuál es mi obligación de IVA del próximo mes?», responde con los datos reales de la empresa seleccionada en el selector."
    }
  },
  "page42": {
    "html_title": "Gestionar empresas — Manual Facil",
    "title": "Gestionar miembros, roles y permisos",
    "subtitle": "En Facil, una empresa puede tener varios miembros con distintos niveles de responsabilidad. Hay cuatro roles predefinidos (propietario, administrador, contable, miembro), una matriz de permisos clara y un sistema de invitación por email. Esta página explica cómo invitar a un colaborador, qué puede hacer cada rol, cómo retirar un acceso y cómo transferir la titularidad cuando un propietario se va.",
    "prev": "← Anterior: Rol Empresa",
    "next": "Siguiente: Solicitudes en lote →",
    "s1": {
      "title": "1. Los cuatro roles de empresa",
      "intro": "Cada miembro tiene exactamente un rol en una empresa dada. Una persona puede ser propietaria de la empresa A y simple miembro de la empresa B sin conflicto. Los roles son acumulables a través de varias empresas, no dentro de una misma empresa.",
      "t": {
        "h1": "Rol",
        "h2": "Para quién",
        "h3": "Acciones clave",
        "r1": {
          "c1": "<strong>Propietario</strong> <span class=\"badge-role\">owner</span>",
          "c2": "Representante legal de la empresa, único e intransferible salvo procedimiento explícito",
          "c3": "Todo: invitar/retirar miembros, cambiar roles, autorizar pagos, cerrar la cuenta empresa, transferir la titularidad"
        },
        "r2": {
          "c1": "<strong>Administrador</strong> <span class=\"badge-role\">admin</span>",
          "c2": "Director, responsable administrativo de confianza",
          "c3": "Iniciar y validar trámites, autorizar pagos, invitar/retirar miembros (excepto al propietario), gestionar licencias"
        },
        "r3": {
          "c1": "<strong>Contable</strong> <span class=\"badge-role\">accountant</span>",
          "c2": "Contable interno o externo (gabinete contable)",
          "c3": "Iniciar declaraciones (IVA, retenciones, IS), preparar pagos, descargar histórico fiscal, NO puede invitar a otros miembros"
        },
        "r4": {
          "c1": "<strong>Miembro</strong> <span class=\"badge-role\">member</span>",
          "c2": "Empleado autorizado a iniciar trámites operativos puntuales",
          "c3": "Crear borrador de solicitud, subir documentos, ver el estado del expediente. NO puede pagar ni firmar declaraciones"
        }
      }
    },
    "s2": {
      "title": "2. Matriz detallada de permisos",
      "intro": "El siguiente cuadro lista las acciones más sensibles y qué rol puede ejecutarlas. Una marca <code>✓</code> indica acceso, <code>—</code> indica que la acción está bloqueada (botón gris o ausente).",
      "t": {
        "h1": "Acción",
        "h2": "Owner",
        "h3": "Admin",
        "h4": "Accountant",
        "h5": "Member",
        "r1": "Crear borrador de solicitud",
        "r2": "Subir documentos",
        "r3": "Validar y enviar la solicitud",
        "r4": "Iniciar declaración fiscal (IVA, IS, retenciones)",
        "r5": "Autorizar pago BANGE Mobile Money",
        "r6": "Iniciar pago agrupado (multi-obligación)",
        "r7": "Iniciar solicitudes en lote (Excel)",
        "r8": "Invitar a un nuevo miembro",
        "r9": "Cambiar el rol de un miembro",
        "r10": "Retirar a un miembro",
        "r11": "Transferir la titularidad (cambiar de owner)",
        "r12": "Cerrar la cuenta empresa"
      }
    },
    "s3": {
      "title": "3. Invitar a un nuevo miembro",
      "intro": "El propietario o un administrador pueden invitar a otra persona a la empresa. La invitación se hace por email; el destinatario no necesita tener una cuenta Facil previa: el flujo le propondrá crearla durante la aceptación.",
      "steps": {
        "title": "Pasos",
        "l1": "Vaya a <a href=\"27-mis-empresas-web.html\">Mis empresas</a> y abra la ficha de la empresa concernida.",
        "l2": "Pestaña «Miembros», botón «Invitar miembro».",
        "l3": "Introduzca el email del invitado y elija el rol (administrador, contable o miembro). Solo el propietario puede transferir su rol; no es invitable directamente.",
        "l4": "Opcional: añada un mensaje personal (recomendable, mejora la tasa de aceptación).",
        "l5": "Confirme. El invitado recibe un email con un enlace válido durante 7 días.",
        "l6": "Mientras espera, el invitado aparece en la lista con la mención «invitación pendiente». Puede reenviar el email o cancelar la invitación si fue un error."
      },
      "warn": {
        "title": "Email correcto, persona correcta",
        "body": "Verifique el email antes de enviar. Una invitación con dominio incorrecto (typo) se quedará pendiente sin alerta hasta que expire (7 días). Si el destinatario tiene varios emails, prefiera el profesional vinculado a la empresa."
      }
    },
    "s4": {
      "title": "4. Cambiar el rol de un miembro",
      "body": "Desde la lista de miembros, junto a cada nombre, hay un menú desplegable con el rol actual. Cambiar el valor aplica el nuevo rol inmediatamente; el miembro afectado recibe una notificación y un email. Las acciones en curso no se interrumpen, pero las próximas se rigen por el nuevo nivel de permiso.",
      "body2": "Limitación importante: un administrador no puede ascender a un miembro al rol de propietario, ni degradar al propietario actual. Estas dos operaciones requieren un procedimiento de transferencia de titularidad descrito en la sección 6."
    },
    "s5": {
      "title": "5. Retirar a un miembro",
      "body": "Junto al menú de rol hay un botón «Retirar acceso». La operación es inmediata: el miembro pierde el acceso a la empresa en el siguiente intento de carga (la sesión activa caduca en menos de 60 segundos). Las solicitudes que él haya iniciado y que estén en curso continúan su flujo, pero ya no podrá verlas ni intervenir. El historial de sus acciones (creación, modificación) permanece en el log de auditoría con su nombre, no se borra.",
      "body2": "Caso particular: si retira a un contable que firmó declaraciones recientes, le recomendamos verificar antes que las próximas declaraciones tengan otro firmante autorizado para evitar bloqueos en cierre de mes."
    },
    "s6": {
      "title": "6. Transferir la titularidad (cambio de propietario)",
      "body": "El propietario es único en una empresa. Para transferir su rol a otra persona (por jubilación, salida, sucesión), el propietario actual debe iniciar un procedimiento explícito:",
      "diagram": "┌─────────────────────────────────────────────────────────────┐\n│ Procedimiento de transferencia de titularidad               │\n├─────────────────────────────────────────────────────────────┤\n│                                                             │\n│  1. Owner actual → menú empresa → \"Transferir titularidad\"  │\n│         │                                                   │\n│         ▼                                                   │\n│  2. Selección del nuevo owner entre los administradores     │\n│     (sólo un admin existente puede convertirse en owner)    │\n│         │                                                   │\n│         ▼                                                   │\n│  3. Subir acta/poder/certificado registral justificando     │\n│     el cambio (PDF, máx. 10 MB)                             │\n│         │                                                   │\n│         ▼                                                   │\n│  4. Confirmación 2FA del owner actual                       │\n│         │                                                   │\n│         ▼                                                   │\n│  5. Validación DGI (24-72 h hábiles)                        │\n│         │                                                   │\n│         ▼                                                   │\n│  6. Email + notificación al nuevo owner; el antiguo         │\n│     queda como administrador (no se le retira solo)         │\n│                                                             │\n└─────────────────────────────────────────────────────────────┘",
      "info": {
        "title": "¿Por qué tan formal?",
        "body": "Cambiar el propietario es equivalente, en derecho, a un cambio de representante legal. La DGI verifica los justificantes para evitar tomas de control fraudulentas de cuentas empresa. La duración (24-72 h) corresponde al tiempo de instrucción del expediente, no a un lapso técnico."
      }
    },
    "s7": {
      "title": "7. Audit log de las acciones del equipo",
      "body": "Todas las acciones sensibles (invitación, cambio de rol, retiro, pago autorizado, transferencia) se registran en un log de auditoría visible al propietario y a los administradores. Para cada entrada se conserva: <em>quién</em> (email del autor), <em>cuándo</em> (timestamp UTC), <em>qué</em> (acción), <em>resultado</em> (éxito/error), <em>IP</em> y <em>user-agent</em>. Este log está disponible durante 7 años (obligación contable) y es exportable en CSV desde la pestaña «Auditoría» de la ficha empresa."
    }
  },
  "page43": {
    "html_title": "Solicitudes en lote — Manual Facil",
    "title": "Depositar varias solicitudes del mismo tipo en una sola operación",
    "subtitle": "El módulo de solicitudes en lote está pensado para empresas y contables que tienen que crear el mismo tipo de trámite para varias personas o varios establecimientos a la vez: 50 pasaportes para empleados, 30 declaraciones IRPF de clientes, 20 renovaciones de licencia comercial. La ventaja: un único pago consolidado, una clasificación IA de los documentos subidos, un seguimiento agrupado.",
    "prev": "← Anterior: Gestionar empresas",
    "next": "Siguiente: Rol Contable →",
    "s1": {
      "title": "1. Diferencia con el pago agrupado (página 26)",
      "body": "Estos dos flujos son complementarios y a menudo confundidos. El siguiente cuadro aclara cuándo usar cada uno.",
      "t": {
        "h1": "Aspecto",
        "h2": "Solicitudes en lote (esta página)",
        "h3": "Pago agrupado (página 26)",
        "r1": {
          "c1": "<strong>Objetivo</strong>",
          "c2": "Crear varias <em>nuevas</em> solicitudes del mismo tipo",
          "c3": "Pagar varias obligaciones <em>existentes</em> de la empresa"
        },
        "r2": {
          "c1": "<strong>Tipo</strong>",
          "c2": "Mismo workflow para todos (ej. todos pasaportes)",
          "c3": "Cualquier mezcla (licencia + IVA + Cámara)"
        },
        "r3": {
          "c1": "<strong>Beneficiarios</strong>",
          "c2": "Varias personas o establecimientos",
          "c3": "Una sola entidad (la empresa activa)"
        },
        "r4": {
          "c1": "<strong>Ejemplo</strong>",
          "c2": "50 pasaportes para empleados",
          "c3": "Saldar todas las obligaciones del 2T 2026"
        }
      }
    },
    "s2": {
      "title": "2. Workflow del lote: 8 estados",
      "intro": "Una solicitud en lote pasa por una secuencia de estados claramente definidos. Conocerlos ayuda a saber dónde se está bloqueado y qué falta.",
      "diagram": "┌─────────────────────────────────────────────────────────────────────────┐\n│                                                                         │\n│   DRAFT  ──▶  UPLOADING  ──▶  CLASSIFYING  ──▶  REVIEW                  │\n│     │           ▲                  │              │                     │\n│     │           └──────────────────┘              ▼                     │\n│     │       (volver a UPLOADING                PAYMENT_PENDING          │\n│     │        para añadir docs)                    │                     │\n│     │                                              ▼                    │\n│     │                                            PAID                   │\n│     │                                              │                    │\n│     │                                              ▼                    │\n│     │                                          IN_PROGRESS              │\n│     │                                              │                    │\n│     ▼                                              ▼                    │\n│   (eliminable)                                  COMPLETED               │\n│                                                                         │\n└─────────────────────────────────────────────────────────────────────────┘",
      "t": {
        "h1": "Estado",
        "h2": "Significado",
        "h3": "Qué puede hacer",
        "r1": {
          "c2": "Lote creado, nada aún cargado",
          "c3": "Añadir beneficiarios, modificar metadatos, eliminar el lote"
        },
        "r2": {
          "c2": "Subiendo documentos (uno por beneficiario)",
          "c3": "Subir más documentos, sustituir, retirar uno"
        },
        "r3": {
          "c2": "El IA está identificando cada documento (DIP, foto, antecedentes…)",
          "c3": "Esperar (1-3 minutos típicos)"
        },
        "r4": {
          "c2": "Documentos clasificados, lista listo a verificar",
          "c3": "Validar las atribuciones IA, corregir si necesario, excluir un beneficiario incompleto, volver a UPLOADING para añadir docs"
        },
        "r5": {
          "c2": "Lote validado, esperando pago consolidado",
          "c3": "Iniciar el pago BANGE Mobile Money con el importe total del lote"
        },
        "r6": {
          "c2": "Pago confirmado, lote enviado a tratamiento",
          "c3": "Descargar el recibo consolidado, esperar instrucción"
        },
        "r7": {
          "c2": "Los agentes públicos están tratando los expedientes individuales",
          "c3": "Seguir el estado por beneficiario, recibir notificaciones por cada uno"
        },
        "r8": {
          "c2": "Todos los expedientes individuales están finalizados",
          "c3": "Descargar los documentos oficiales (uno por beneficiario)"
        }
      }
    },
    "s3": {
      "title": "3. Crear un lote: paso a paso",
      "step1": {
        "title": "Paso 1 — Iniciar",
        "body": "Desde el panel principal de su empresa, abra «Iniciar trámite» y elija el tipo de servicio (ej. «Pasaporte ordinario - Expedición»). En la primera pantalla, en lugar de elegir «Una solicitud», marque «Solicitud en lote». Esta opción aparece sólo si su rol lo permite (administrador o contable, no miembro simple) y si el tipo de servicio admite el modo lote (la mayoría sí)."
      },
      "step2": {
        "title": "Paso 2 — Añadir los beneficiarios",
        "body": "Hay dos vías: añadir uno por uno con el formulario integrado, o importar una lista CSV. Para cada beneficiario se necesita como mínimo:",
        "l1": "<strong>Nombre completo</strong> — tal como aparecerá en el documento oficial.",
        "l2": "<strong>Identificador</strong> (opcional pero recomendado) — DIP, NIF, número de empleado interno, según el tipo de trámite.",
        "l3": "<strong>Email</strong> (opcional) — si lo facilita, el beneficiario recibirá una notificación cuando su documento esté disponible.",
        "csv": {
          "title": "Formato CSV de importación",
          "body": "beneficiary_name,beneficiary_identifier,beneficiary_identifier_type,beneficiary_email\nJuan Pérez Esono,12345678,DIP,juan.perez@example.gq\nMaría Ndong Obama,87654321,DIP,maria.ndong@example.gq\nRicardo Mba Nguema,EMP-2024-042,internal,ricardo.mba@example.gq\n...",
          "note": "El encabezado debe estar en inglés (compatibilidad backend). Los campos <code>beneficiary_identifier_type</code> aceptados son: <code>DIP</code>, <code>NIF</code>, <code>passport</code>, <code>internal</code>, <code>other</code>. Cada línea = un beneficiario = una solicitud."
        }
      },
      "step3": {
        "title": "Paso 3 — Subir los documentos",
        "body": "Una vez añadidos los beneficiarios, suba todos los documentos sin preocuparse del orden ni de a quién pertenecen. El IA se encarga de la clasificación: identifica el tipo de cada documento (DIP, foto carnet, certificado de empleo…) y lo asigna automáticamente al beneficiario correcto en función del nombre y de la identificación. Esta etapa dura 1-3 minutos para 50 documentos."
      },
      "tip": {
        "title": "Trucos para mejorar la clasificación IA",
        "l1": "Nombrar los archivos con el nombre del beneficiario (ej. <code>juan_perez_dip.jpg</code>) — aumenta la precisión al 99%.",
        "l2": "Subir documentos legibles (300 dpi mínimo, no fotos en penumbra). El IA pide reescaneo si la calidad es insuficiente.",
        "l3": "Subir todos los documentos del mismo tipo juntos (todos los DIP, luego todas las fotos). Útil cuando los archivos vienen del scaner del fotocopiador."
      },
      "step4": {
        "title": "Paso 4 — Verificar y excluir incompletos",
        "body": "En el estado REVIEW, cada beneficiario tiene una marca verde (✓ documentos completos) o ámbar (— faltan documentos). Para los ámbar, hay dos opciones: volver a UPLOADING para añadir los documentos que faltan, o excluir al beneficiario del lote (estado EXCLUDED). Los excluidos no entran en el pago final y se podrán retomar más tarde en otro lote."
      },
      "step5": {
        "title": "Paso 5 — Pago consolidado",
        "body": "El sistema calcula el coste total: tasa por solicitud × número de beneficiarios incluidos. El propietario o un administrador autoriza el pago BANGE Mobile Money — un único PIN, un único reçu. Detallado en la página <a href=\"34-mis-pagos-mobile.html\">Mis pagos</a> para el flujo BANGE."
      },
      "step6": {
        "title": "Paso 6 — Seguimiento por beneficiario",
        "body": "Una vez en IN_PROGRESS, cada solicitud individual se trata por separado en el lado de los agentes públicos. Su estado evoluciona independientemente (uno puede estar en validación documentaria mientras otro está esperando un control biométrico). La página de detalle del lote muestra una lista con un mini-stepper por beneficiario, lo que permite ver de un vistazo dónde están los retrasos."
      }
    },
    "s4": {
      "title": "4. Limitaciones y buenas prácticas",
      "l1": "<strong>Tamaño máximo</strong> — 200 beneficiarios por lote. Más allá, divida en varios lotes (la plataforma admite varios lotes simultáneos para la misma empresa).",
      "l2": "<strong>Mismo workflow</strong> — un lote = un único tipo de trámite. Para mezclar pasaportes y residencia para los mismos empleados, créelos en dos lotes separados.",
      "l3": "<strong>Pago todo o nada</strong> — el pago consolidado cubre todos los beneficiarios incluidos. Si quiere pagar a algunos más tarde, excluya antes y créelos en otro lote.",
      "l4": "<strong>Tiempo de tratamiento</strong> — el SLA por solicitud individual no cambia (depende del tipo). El lote no es más rápido por solicitud, pero ahorra horas de carga manual.",
      "l5": "<strong>Confidencialidad</strong> — los documentos de un beneficiario sólo son visibles para los miembros de la empresa autorizados, nunca para los demás beneficiarios."
    }
  },
  "page44": {
    "html_title": "Rol Contable — Manual Facil",
    "title": "Rol Contable: gestionar varios clientes desde una sola cuenta",
    "subtitle": "Los contables (internos o gabinetes) tienen necesidades distintas a las de un simple miembro: hay que pasar rápidamente de una empresa a otra, preparar declaraciones por cuenta del cliente, ver consolidados multi-cliente, justificar los movimientos en caso de control. El rol Contable de Facil cubre estos casos sin necesidad de varias sesiones ni de cuentas técnicas, gracias al mandato DGI y a una vista contable dedicada.",
    "prev": "← Anterior: Solicitudes en lote",
    "next": "Siguiente: Rol Agente →",
    "s1": {
      "title": "1. Quién puede ser contable en Facil",
      "body": "Cualquier titular de una cuenta personal Facil puede ser invitado al rol Contable de una empresa. La invitación se envía desde la página <a href=\"42-gestion-empresas.html\" data-i18n=\"page44.s1.link\">Gestionar empresas</a> por el propietario o un administrador. Una sola persona física puede ser contable de tantas empresas como quiera; cada una aparecerá en su selector de empresa con la mención <em>«rol contable»</em>.",
      "link": "Gestionar empresas",
      "info": {
        "title": "Caso típico: gabinete contable",
        "body": "Un gabinete con 30 clientes puede invitar al mismo contable como rol contable en las 30 empresas. Desde su única cuenta personal, ve la lista completa, navega de un cliente al otro y prepara las declaraciones. Las acciones quedan trazadas con su email; el cliente sabe quién hizo qué."
      }
    },
    "s2": {
      "title": "2. Permisos del rol Contable",
      "intro": "El rol Contable está diseñado para preparar el trabajo, no para autorizar pagos ni cambiar la estructura del equipo. La matriz completa está en la página <a href=\"42-gestion-empresas.html#sec-2\" data-i18n=\"page44.s2.link\">Gestionar empresas — sección 2</a>; aquí están las acciones clave:",
      "link": "Gestionar empresas — sección 2",
      "l1": "<strong>Puede</strong> — crear borradores de declaración (IVA, retenciones, IS), subir libros contables, calcular importes, preparar pagos, generar documentos justificativos, descargar el histórico fiscal completo.",
      "l2": "<strong>No puede</strong> — autorizar el pago BANGE Mobile Money (es siempre el propietario o un administrador), invitar/retirar miembros, cambiar el régimen fiscal, cerrar la cuenta empresa.",
      "body": "Esta separación entre <em>preparación</em> (contable) y <em>autorización</em> (administrador/propietario) corresponde a un principio contable básico: la persona que prepara la declaración no es la que la firma. En Facil, esa firma es el clic en «Validar y pagar», reservado a los administradores."
    },
    "s3": {
      "title": "3. Vista consolidada multi-cliente",
      "intro": "Cuando el contable inicia la sesión, además del selector clásico de empresa, dispone de una vista «Mis clientes» que cruza todas las empresas donde tiene rol contable. Esta vista presenta:",
      "diagram": "┌──────────────────────────────────────────────────────────────────────┐\n│ Mis clientes (vista contable consolidada)                            │\n├──────────────────────────────────────────────────────────────────────┤\n│                                                                      │\n│ Buscar:  [______________]      Filtrar:  [Todos] [Atrasados] [Hoy]   │\n│                                                                      │\n│ ┌────────────────────┬──────────────┬──────────────┬─────────────┐   │\n│ │ Empresa            │ Próx. plazo  │ Pendiente    │ Atrasados   │   │\n│ ├────────────────────┼──────────────┼──────────────┼─────────────┤   │\n│ │ ACME GE SARL       │ IVA 15/06    │ 1 borrador   │ 0           │   │\n│ │ Industrias Bata    │ IRPF 30/06   │ 0            │ 1 (IVA Mai) │   │\n│ │ Hotelera del Mar   │ Lic. 30/06   │ 2 borradores │ 0           │   │\n│ │ Pesquera Bioko     │ IS 30/09     │ 0            │ 0           │   │\n│ │ ... (26 más)       │ ...          │ ...          │ ...         │   │\n│ └────────────────────┴──────────────┴──────────────┴─────────────┘   │\n│                                                                      │\n│ [Exportar Excel]    [Calendario fiscal]    [Notificaciones globales] │\n│                                                                      │\n└──────────────────────────────────────────────────────────────────────┘",
      "body": "Hacer clic en una línea entra en la empresa correspondiente con el contexto activado (selector posicionado, KPIs filtrados). El botón «Atrasados» arriba permite ver de un vistazo qué clientes tienen una declaración fuera de plazo o un pago pendiente, lo que se vuelve crítico el día 15 o 30 del mes (vencimientos típicos)."
    },
    "s4": {
      "title": "4. Preparar una declaración por cuenta del cliente",
      "intro": "El proceso es idéntico a una declaración hecha por la propia empresa, salvo que el contable no puede pagar. El flujo típico:",
      "l1": "Desde «Mis clientes», el contable entra en el cliente concernido.",
      "l2": "Selector de empresa correctamente posicionado, abre «Iniciar trámite» → tipo de declaración.",
      "l3": "Rellena los campos, importa libros contables (CSV/Excel), revisa los importes calculados.",
      "l4": "Guarda en estado «Borrador validado por contable» — un estado intermedio específico al rol Contable.",
      "l5": "Notifica al propietario/administrador (botón «Solicitar autorización»): éste recibe un email + push con un enlace directo a la declaración.",
      "l6": "El propietario/administrador autoriza el pago BANGE Mobile Money. La declaración se envía a la DGI con la mención «preparada por [contable] / firmada por [propietario]».",
      "l7": "El recibo y el certificado de depósito quedan accesibles a los dos: contable (para su archivo) y propietario (para su contabilidad oficial)."
    },
    "s5": {
      "title": "5. Mandato DGI y trazabilidad",
      "body": "Aunque la cuenta del contable no es una cuenta técnica, sus acciones se registran como las de un mandatario reconocido. El log de auditoría de la empresa muestra para cada operación: <em>«preparado por [email del contable]»</em> y <em>«autorizado por [email del propietario]»</em>. En caso de control fiscal por parte de la DGI, esta trazabilidad permite acreditar quién ha preparado y firmado cada declaración. La DGI puede contactar directamente al contable para preguntas técnicas, sin necesidad de pasar por el cliente, gracias a un mandato implícito vinculado al rol.",
      "warn": {
        "title": "Cambio de gabinete contable",
        "body": "Cuando una empresa cambia de gabinete, el propietario debe retirar el rol Contable al antiguo contable (página 42, sección 5). El historial de las declaraciones que el antiguo contable ha preparado permanece accesible (logs de auditoría conservados 7 años) pero ya no podrá ver ni modificar nada nuevo. El nuevo contable comienza con una vista limpia, sin acceso a los borradores en curso del anterior."
      }
    },
    "s6": {
      "title": "6. Funciones específicas del contable",
      "intro": "Además de la vista «Mis clientes», el rol Contable habilita estas funciones que no aparecen para los demás roles:",
      "l1": "<strong>Calendario fiscal multi-cliente</strong> — un calendario único que cruza los plazos de todas las empresas gestionadas; útil para planificar la carga de trabajo del mes.",
      "l2": "<strong>Notificaciones globales</strong> — el contable recibe los recordatorios de plazos de todos sus clientes en una única bandeja, con filtros (atrasados, este mes, etiquetadas urgentes).",
      "l3": "<strong>Exportación Excel consolidada</strong> — exportar en una sola hoja todas las declaraciones presentadas en un período para todos sus clientes (útil para informes anuales del gabinete).",
      "l4": "<strong>Solicitudes en lote</strong> — preparar IRPFs o retenciones para varios clientes en una sola operación (página <a href=\"43-batch-requests.html\">Solicitudes en lote</a>).",
      "l5": "<strong>Asistente IA enriquecido</strong> — el contexto del IA incluye los datos contables de la empresa activa; preguntas como «¿cuál es la diferencia entre la cifra de negocio del 1T y del 2T?» reciben respuestas concretas con datos."
    },
    "s7": {
      "title": "7. Honorarios y facturación",
      "body": "Facil no factura al contable por el uso de la plataforma; las tasas fiscales se cobran a la empresa cliente directamente (BANGE Mobile Money del propietario o administrador). Los honorarios del contable hacia su cliente están fuera del ámbito de Facil: se gestionan por el contrato comercial entre el gabinete y la empresa. La plataforma sí provee informes mensuales de actividad (número de declaraciones preparadas, tipos, fechas) que el contable puede usar para justificar su facturación al cliente."
    }
  },

  "page60": {
    "html_title": "Asistente IA Agente — Manual Facil",
    "title": "Asistente IA dedicado a los agentes públicos",
    "description": "Los agentes públicos disponen de su propio asistente IA, distinto de la versión pública (página 55) y de la versión ciudadano conectado (página 29). Esta variante está alimentada con un contexto específico al rol agente: workflows internos, jurisprudencia administrativa de Guinea Ecuatorial, casos similares pasados, modelos de motivos de rechazo. Su objetivo es acelerar la toma de decisión y reducir las disparidades entre agentes para casos comparables.",
    "s1": {
      "title": "1. Diferencias con las otras variantes IA",
      "t": {
        "h1": "Aspecto",
        "h2": "IA pública (p. 55)",
        "h3": "IA ciudadano (p. 29)",
        "h4": "IA agente (esta página)",
        "r1": {
          "c1": "<strong>Acceso</strong>",
          "c2": "Sin login",
          "c3": "Login + contexto personal",
          "c4": "Login agente + contexto profesional"
        },
        "r2": {
          "c1": "<strong>Datos accesibles</strong>",
          "c2": "Solo catálogo público",
          "c3": "Catálogo + datos del usuario",
          "c4": "Catálogo + jurisprudencia + casos pasados (anonimizados)"
        },
        "r3": {
          "c1": "<strong>Idiomas</strong>",
          "c2": "ES / FR / EN",
          "c3": "ES / FR / EN",
          "c4": "ES (lengua oficial administrativa) por defecto"
        },
        "r4": {
          "c1": "<strong>Limit de queries</strong>",
          "c2": "10 / hora / IP",
          "c3": "100 / día",
          "c4": "Sin límite (uso profesional)"
        },
        "r5": {
          "c1": "<strong>Audit log</strong>",
          "c2": "Mínimo",
          "c3": "Estándar",
          "c4": "Completo + retention 7 años"
        }
      }
    },
    "s2": {
      "title": "2. Casos de uso típicos para un agente",
      "uc1": {
        "title": "Buscar casos similares pasados",
        "body": "Antes de tomar una decisión sobre un caso ambiguo, el agente puede preguntar al IA: «¿Cuántos casos similares han sido tratados los últimos 12 meses? ¿Qué decisión se tomó en mayoría?». El IA busca en la base anonimizada de casos pasados (sin datos personales identificables) y retorna la decisión mayoritaria con porcentaje de coincidencia. Esto reduce las disparidades entre agentes."
      },
      "uc2": {
        "title": "Generar un motivo de rechazo",
        "body": "Cuando el agente decide rechazar (acción <code>reject</code>, ver <a href=\"61-rol-agente.html\">página 61</a>), el motivo es obligatorio (mínimo 50 caracteres, redacción precisa). El IA puede generar un primer borrador del motivo basado en los puntos no conformes detectados durante la verificación documental. El agente revisa, corrige, valida. Esto ahorra 2-3 minutos por rechazo y mejora la calidad redactional."
      },
      "uc3": {
        "title": "Consultar la jurisprudencia interna",
        "body": "Para los casos complejos (interpretación de un texto legal, conflicto de jurisprudencia entre dos circulares), el IA tiene acceso al corpus de circulares ministeriales y consultas jurídicas pasadas. Pregunta tipo: «¿Cómo interpreta la circular del 12 de marzo 2024 sobre las solicitudes de pasaporte de menores?». El IA cita las fuentes (circular CN-2024-042, p. 3) lo que permite al agente verificar."
      },
      "uc4": {
        "title": "Detectar patterns de fraude",
        "body": "Si el agente nota anomalías (NIF que no coincide con el nombre, mismo tutor para muchos menores, dirección sospechosa) puede pedir al IA: «¿Hay otros casos con esta dirección o este NIF en los últimos 6 meses?». Si el IA detecta clusters anómalos, alerta al agente que escala (acción <code>escalate</code>) hacia el supervisor con el reporte adjunto."
      }
    },
    "s3": {
      "title": "3. Ejemplos de prompts útiles",
      "intro": "Algunos prompts de partida que los nuevos agentes pueden adaptar:",
      "l1": "<code>«¿Cuál es el plazo legal de tratamiento para una renovación de pasaporte?»</code> — respuesta inmediata con la circular fuente",
      "l2": "<code>«Encuéntrame los 5 últimos rechazos de tipo passport_renewal con motivo \"DIP caducado\", para inspirarme la redacción»</code> — el IA muestra los motivos anonimizados",
      "l3": "<code>«¿Esta solicitud presenta un riesgo elevado de fraude basado en el historial?»</code> — el IA aplica las reglas de detección al caso concreto",
      "l4": "<code>«Genera un email de notificación para pedirle al ciudadano que vuelva a enviar una foto carnet conforme»</code> — el IA propone el texto, el agente revisa antes del envío"
    },
    "s4": {
      "title": "4. Limitaciones importantes",
      "warn1": {
        "title": "El IA no toma la decisión",
        "body": "El asistente IA es una <em>ayuda a la decisión</em>, no un decisor. La decisión final (validar, rechazar, escalar) corresponde al agente y solo al agente. La firma del agente es la única que cuenta legalmente. Si el agente sigue ciegamente la sugerencia del IA sin verificar, asume la responsabilidad de cualquier error."
      },
      "warn2": {
        "title": "El IA no accede a datos personales identificables",
        "body": "Los casos similares retornados por el IA están anonimizados (nombre reemplazado por «Ciudadano X», datos sensibles enmascarados). El IA no puede recuperar el expediente completo de otro ciudadano para «comparar», porque eso violaría la confidencialidad. Esta limitación es un freno aceptado para preservar el secreto profesional."
      },
      "warn3": {
        "title": "No usar para preguntas externas al trabajo",
        "body": "El IA agente está limitado a preguntas profesionales relativas al rol del agente. Las preguntas personales (vacaciones, salario, pregunta general no profesional) son rechazadas con un mensaje explicativo. Cada query es loggeada en el audit log con su contenido."
      }
    },
    "s5": {
      "title": "5. Acceso a la interfaz",
      "body": "El asistente IA agente está accesible desde una pequeña burbuja de chat siempre visible en la esquina inferior derecha del back-office (todas las páginas de los agentes 61-69). Al hacer clic se abre el panel de chat. La conversación se conserva durante la sesión; al fin de sesión, el historial es archivado en el log de auditoría y un nuevo chat empieza en la próxima sesión."
    },
    "prev": "← Anterior: Trabajo terreno OMS",
    "next": "Siguiente: Rol Supervisor →"
  },
  "page61": {
    "html_title": "Rol Agente — Manual Facil",
    "title": "Rol Agente: concepto común a todos los agentes públicos",
    "description": "Los agentes públicos son los funcionarios autorizados que tratan las solicitudes de los ciudadanos y empresas en Facil. Aunque cada entidad (CNEDOGE, DGT, Ayuntamiento, Cámara, Tesoro Público, OMS — Obligation Management System, Extranjería) tiene su workflow específico, todos comparten un mismo modelo de trabajo: una cola de tareas, un mecanismo de bloqueo pesimista (lock_for_review) que evita que dos agentes traten la misma solicitud, y un conjunto fijo de acciones (validar, rechazar, pedir documentos, escalar). Esta página describe ese tronco común. Las pantallas y los detalles propios de cada entidad están en las páginas 62 a 67.",
    "s1": {
      "title": "1. Las 7 entidades de tratamiento",
      "intro": "Facil reparte las solicitudes entre 7 entidades públicas, cada una con sus agentes. La asignación es automática: cuando un ciudadano deposita una solicitud, el sistema la dirige a la entidad competente según el tipo de servicio (workflow_code). Los agentes nunca eligen su lote; reciben las solicitudes asignadas a su entidad por orden de prioridad SLA.",
      "t": {
        "h1": "Entidad",
        "h2": "Sigla",
        "h3": "Servicios tratados",
        "h4": "Página dedicada",
        "r1": {
          "c1": "Centro Nacional de Documentación Ecuatoguineana",
          "c3": "Pasaportes (expedición, renovación)",
          "c4": "Página 62"
        },
        "r2": {
          "c1": "Dirección General de Tráfico",
          "c3": "Permisos de conducir",
          "c4": "Página 63"
        },
        "r3": {
          "c1": "Ayuntamiento + Cámara de Comercio",
          "c3": "Licencias comerciales municipales, registro empresarial, tasas",
          "c4": "Página 64"
        },
        "r4": {
          "c1": "Tesoro Público",
          "c3": "Validación de pagos bancarios (reconciliación BANGE)",
          "c4": "Página 65"
        },
        "r5": {
          "c1": "OMS — Obligation Management System",
          "c3": "Procesamiento post-pago de obligaciones bundle (licencias comerciales): distribución de obligaciones tesoro/municipal/chamber en Modo A (per-line por ministerio) o Modo B (consolidado polivalente)",
          "c4": "Página 66"
        },
        "r6": {
          "c1": "Dirección de Extranjería",
          "c3": "Permisos de residencia, autorizaciones de trabajo",
          "c4": "Página 67"
        },
        "r7": {
          "c1": "DGI — Dirección General de Impuestos",
          "c3": "Declaraciones fiscales (IVA, IRPF, IS, retenciones)",
          "c4": "Cubierto en agentes Tesoro + supervisores DGI"
        }
      }
    },
    "s2": {
      "title": "2. La cola de trabajo (queue)",
      "body": "El primer pantalla de cualquier agente es su cola de trabajo: la lista de solicitudes asignadas a su entidad, ordenadas por una prioridad calculada automáticamente. La fórmula combina tres factores:",
      "l1": "<strong>SLA restante</strong> — cuánto tiempo queda antes de que la solicitud incumpla el plazo legal. Cuanto menos tiempo, mayor prioridad.",
      "l2": "<strong>Importe</strong> — los pagos elevados (más de 1 millón XAF) suben en la cola para reducir el riesgo financiero.",
      "l3": "<strong>Complejidad</strong> — las solicitudes con muchas piezas justificativas o flagged por la IA (anomalías documentales, mismatch nombre, etc.) tienen un score más alto.",
      "body2": "El agente no puede saltar manualmente una entrada de la cola; debe tratar las solicitudes en el orden propuesto. Si una solicitud necesita un especialista (por ejemplo un caso médico complejo en OMS), la opción <em>«asignar a un colega»</em> permite transferirla con un mensaje justificativo (ver sección 4)."
    },
    "s3": {
      "title": "3. El bloqueo pesimista: lock_for_review",
      "intro": "Cuando dos agentes trabajan en la misma entidad, el riesgo es que ambos abran la misma solicitud y emitan decisiones contradictorias. Facil resuelve este problema con un bloqueo pesimista: solo un agente puede tener una solicitud en estado <em>«locked_by_agent»</em> a la vez.",
      "diagram": "\n┌─────────────────────────────────────────────────────────────────────────┐\n│ Workflow lock_for_review (3 agentes en paralelo)                        │\n├─────────────────────────────────────────────────────────────────────────┤\n│                                                                         │\n│   Cola común                                                            │\n│   ┌────────┬────────┬────────┬────────┐                                 │\n│   │ #1234  │ #1235  │ #1236  │ #1237  │  ← solicitudes pending_agent    │\n│   └────┬───┴────┬───┴────┬───┴────────┘                                 │\n│        │        │        │                                              │\n│   Agente A    Agente B  Agente C                                        │\n│   click       click     click                                           │\n│   #1234       #1235     #1234 ← bloqueado por A                         │\n│   ✓ lock      ✓ lock    ✗ \"Solicitud ya está siendo tratada por A\"      │\n│                                                                         │\n│   ▶ Tras lock por A : #1234 desaparece de la cola de B y C              │\n│   ▶ Tras decisión final A : #1234 entra en approved/rejected/etc.       │\n│   ▶ Si A se aleja sin liberar : timeout 30 min → unlock automático      │\n│                                                                         │\n└─────────────────────────────────────────────────────────────────────────┘\n",
      "body": "El timeout de 30 minutos es importante: si un agente abre una solicitud y se va a comer, la solicitud se desbloquea automáticamente y vuelve a la cola común. Esto evita que las solicitudes queden indefinidamente bloqueadas si un agente cierra el navegador sin terminar. El agente que tenía el bloqueo recibe una notificación de pérdida."
    },
    "s4": {
      "title": "4. Las 7 acciones del agente",
      "intro": "Una vez bloqueada una solicitud, el agente dispone de 7 acciones (definidas en el enum <code>agent_action_type</code> del backend). No todas son aplicables a la vez; el botón está activo solo si el contexto lo permite.",
      "t": {
        "h1": "Acción",
        "h2": "Cuándo se usa",
        "h3": "Resultado",
        "r1": {
          "c2": "Al hacer clic en una solicitud de la cola",
          "c3": "La solicitud cambia a <code>locked_by_agent</code>, ningún otro agente puede abrirla"
        },
        "r2": {
          "c2": "Documentación correcta, control validado",
          "c3": "Genera el documento oficial (PDF), firma del agente, envío al ciudadano + al vault"
        },
        "r3": {
          "c2": "Documento falsificado, datos inverificables, fraude detectado",
          "c3": "Solicitud marcada rechazada con motivo obligatorio (mín. 50 caracteres). Notificación al ciudadano, posibilidad de recurso"
        },
        "r4": {
          "c2": "Falta una pieza, foto borrosa, fecha caducada",
          "c3": "Estado <code>requires_documents</code>. Notificación al ciudadano con la lista exacta de lo que falta. Plazo 30 días, luego rechazo automático"
        },
        "r5": {
          "c2": "Caso ambiguo, sospecha de fraude organizado, decisión más allá del nivel",
          "c3": "Estado <code>escalated_supervisor</code>. La solicitud sale de la cola del agente y entra en la del supervisor de la entidad"
        },
        "r6": {
          "c2": "Antes de irse a comer / fin de jornada / interrupción",
          "c3": "La solicitud vuelve a la cola común sin decisión. No es un rechazo, es una pausa"
        },
        "r7": {
          "c2": "Necesidad de un especialista (ej. caso médico complejo en OMS)",
          "c3": "La solicitud va directamente a la cola del colega designado, con un mensaje justificativo"
        }
      }
    },
    "s5": {
      "title": "5. Audit log: cada acción es trazada",
      "body": "Toda acción del agente queda registrada en un log de auditoría con: <em>quién</em> (email del agente), <em>cuándo</em> (timestamp UTC), <em>qué</em> (acción), <em>antes/después</em> (estado anterior y nuevo), <em>motivo</em> (campo obligatorio en rechazo y escalación), <em>IP + user-agent</em>. Este log está visible para el supervisor de la entidad y para el administrador. Se conserva 7 años (obligación legal de archivo administrativo). El ciudadano puede solicitar una copia del log de su solicitud en virtud del derecho de acceso (página 58 — Legal)."
    },
    "s6": {
      "title": "6. Estados del workflow (los 17 estados)",
      "intro": "El workflow completo de una solicitud cuenta 17 estados (definidos en el enum <code>payment_workflow_status</code> del backend). Un agente trabaja típicamente sobre los estados marcados con ★.",
      "t": {
        "h1": "Estado",
        "h2": "Significado",
        "h3": "Agente actúa",
        "r1": {"c2": "Solicitud depositada por el ciudadano"},
        "r2": {"c2": "El sistema verifica datos automáticamente"},
        "r3": {"c2": "Validación 100% automática (caso simple)"},
        "r4": {"c2": "En cola del agente"},
        "r5": {"c2": "Bloqueada por un agente para tratamiento"},
        "r6": {"c2": "Esperando docs adicionales del ciudadano"},
        "r7": {"c2": "El ciudadano ha enviado los nuevos docs"},
        "r8": {"c2": "Validada por el agente, decisión final"},
        "r9": {"c2": "Rechazada por el agente"},
        "r10": {"c2": "Escalada al supervisor de la entidad"},
        "r11": {"c2": "Bloqueada por el supervisor"},
        "r12": {"c2": "Documento oficial generado y entregado"},
        "r13": {"c2": "Cancelada por el ciudadano"},
        "r14": {"c2": "Cancelada por el agente (caso administrativo)"},
        "r15": {"c2": "Plazo de aporte de documentos vencido"}
      }
    },
    "s7": {
      "title": "7. Indicadores de carga (workload)",
      "body": "Cada agente tiene una marca de carga en tiempo real: número de solicitudes en su cola, edad de la más antigua, tasa SLA respetada en los últimos 30 días. Estos indicadores son visibles para el supervisor para detectar agentes saturados o desocupados. La asignación automática toma este indicador en cuenta: las nuevas solicitudes van preferentemente a los agentes con menor carga, lo que equilibra el flujo."
    },
    "prev": "← Anterior: Rol Contable",
    "next": "Siguiente: Agente CNEDOGE →"
  },
  "page62": {
    "html_title": "Patrón agentes workflows simples — Manual Facil",
    "title": "Patrón común agentes workflows simples (CNEDOGE / DGT / Extranjería)",
    "description": "Los agentes de las entidades CNEDOGE (pasaporte), DGT (licencia de conducir) y Extranjería (residencia y visado) comparten <strong>exactamente las mismas acciones, la misma UI y los mismos endpoints</strong> backend (<code>app/modules/service_requests/api/agent_routes.py</code>). La única diferencia es el workflow Python concreto ejecutado (<code>pasaporte_workflow_v2.py</code> vs <code>conducir_workflow.py</code> vs <code>residencia_workflow.py</code> / <code>tramites_visado_workflow.py</code>) qui determina los documentos requeridos, las validaciones específicas y los pasos del wizard ciudadano. Esta página describe el <strong>patrón común</strong>, ilustrado con el ejemplo detallado de la licencia de conducir (DGT), y proporciona 3 mini-fichas de especificidad por entidad al final.",
    "s1": {
      "title": "1. El patrón común: estados y ciclo de vida",
      "body": "Toda solicitud workflow simple sigue el mismo ciclo. El agente actúa sobre las solicitudes en estado <code>pending_agent_review</code> de su cola (filtrado por <code>entity_code</code> + <code>workflow_code</code> de los workflows que la entidad maneja, ver <a href=\"89-admin-workflow-config.html\">página 89</a>). Estados clave :",
      "diagram": "┌─────────────────────────────────────────────────────────────────────┐\n│  Patrón común agente workflows simples                              │\n├─────────────────────────────────────────────────────────────────────┤\n│                                                                     │\n│  pending_agent_review (cola entidad)                                │\n│         │                                                           │\n│         ▼  lock_for_review                                          │\n│  locked_by_agent                                                    │\n│         │                                                           │\n│         │  El agente revisa la solicitud :                          │\n│         │  - documentos OCR-extraídos (schemas correspondientes)    │\n│         │  - resultados validate_step del workflow                  │\n│         │  - cita programada (si requires_appointment)              │\n│         │                                                           │\n│         ├─ request_documents → waiting_documents                    │\n│         │  (ciudadano completa el dossier)                          │\n│         │                                                           │\n│         ├─ escalate → escalated_supervisor                          │\n│         │  (caso ambiguo o monto sensible)                          │\n│         │                                                           │\n│         ├─ reject → rejected (motivo obligatorio)                   │\n│         │                                                           │\n│         └─ approve → approved_by_agent                              │\n│                  → (workflow continúa: payment, cita, completado)   │\n│                                                                     │\n└─────────────────────────────────────────────────────────────────────┘"
    },
    "s2": {
      "title": "2. Las 5 acciones disponibles del agente",
      "body": "El campo <code>decision</code> del payload acepta exactamente uno de los tres valores: <code>approve</code>, <code>reject</code> o <code>request_documents</code> (regex backend : <code>^(approve|reject|request_documents)$</code>). El endpoint <code>escalate</code> está separado para tracking distinto.",
      "t": {
        "h1": "Acción",
        "h2": "Endpoint backend",
        "h3": "Permiso",
        "h4": "Efecto",
        "r1": { "c4": "Estado → <code>locked_by_agent</code>; previene que otro agente trabaje en paralelo" },
        "r2": { "c4": "Estado → <code>approved_by_agent</code>; el workflow avanza al paso siguiente (típicamente pago o cita)" },
        "r3": { "c4": "Estado → <code>rejected</code>; <code>rejection_reason</code> obligatorio (max 500 chars). Notificación al ciudadano." },
        "r4": { "c4": "Estado → <code>waiting_documents</code>; lista de documentos faltantes ; el ciudadano puede recargar y resoumettre" },
        "r5": { "c4": "Estado → <code>escalated_supervisor</code>; el supervisor de la entidad toma el relais (ver <a href=\"71-rol-supervisor.html\">página 71</a>)" }
      }
    },
    "s3": {
      "title": "3. Ejemplo detallado: ConducirWorkflow (DGT)",
      "intro": "La licencia de conducir DGT es un buen exemplo car ses étapes sont representativas de tous los workflows simples. Workflow class : <code>ConducirWorkflow</code> en <code>app/modules/service_requests/workflows/conducir_workflow.py</code>. Entidad : <code>DGT</code> (Dirección General de Tráfico Rodado y Seguridad Vial). <code>requires_appointment=True</code> (examen práctico ou retrait), <code>requires_nota_ingreso=False</code> (pago directo Mobile Money).",
      "codes": {
        "title": "5 códigos workflow (1 clase Python, 5 workflow_codes)",
        "h1": "workflow_code",
        "h2": "Caso de uso",
        "h3": "Solicitud type",
        "r1": { "c2": "Primera solicitud (incluye examen práctico)" },
        "r2": { "c2": "Conversión de licencia extranjera (solo RESIDENT)" },
        "r3": { "c2": "Renovación de certificado caducado o por caducar" },
        "r4": { "c2": "Duplicado por pérdida, robo o deterioro (motivo obligatorio)" },
        "r5": { "c2": "Extensión a una nueva clase (no requiere nuevo examen)" }
      },
      "classes": {
        "title": "7 clases de licencia con edad mínima",
        "body": "Definidas en el enum <code>LicenseClass</code>: <code>A</code> motos (18+), <code>B</code> vehículos ligeros &lt;3.5T (18+), <code>B+</code> ligeros + remolque (18+), <code>C</code> pesados &gt;3.5T (21+), <code>D</code> pasajeros &gt;9 plazas (21+), <code>E</code> articulados (21+), <code>F</code> especiales/agrícolas (18+). La clase AM (16+) está diferida a Phase 2. La clase COPIA_ADICIONAL no es gestionada por DGT (gestión Comisaría Policía)."
      },
      "steps": {
        "title": "Steps del wizard (visibles también para el agente)",
        "l1": "<strong>Step 0 selection</strong> — tipo de solicitud (NUEVO/CANJE/RENOVACION/DUPLICADO/EXTENSION) + applicant_type (CITIZEN_GQ con DIP o RESIDENT con NIE) + clases solicitadas.",
        "l2": "<strong>Step 1 upload_documents</strong> — documentos según el tipo: DIP/NIE, foto carnet, certificado médico, eventualmente licencia anterior (renovación/duplicado), certificado país origen (canje).",
        "l3": "<strong>Step 2 form_review_1</strong> — datos personales extraídos del DIP/NIE por OCR; el ciudadano verifica y corrige.",
        "l4": "<strong>Step 3 form_review_2</strong> — datos de la solicitud: tipo, clases, motivo (duplicado), país de origen (canje).",
        "l5": "<strong>Step 4 form_review_3</strong> — verificación de documentos justificativos (secciones condicionales). Cross-validation del nombre para canje (matching licencia extranjera ↔ DIP/NIE).",
        "l6": "<strong>Step 5 appointment</strong> — RDV para examen práctico (NUEVO) o retrait (otros).",
        "l7": "<strong>Step 6 payment</strong> — pago directo Mobile Money BANGE (no hay Nota de Ingreso intermedia para DGT). Tarifa según tipo + clases.",
        "l8": "<strong>Step 7 confirmation</strong> — resumen + agent_checklist. El agente revisa antes de aprobar."
      }
    },
    "s4": {
      "title": "4. Especificidades por entidad (mini-fichas)",
      "cnedoge": {
        "title": "4.1 CNEDOGE — pasaporte",
        "body": "Workflow class : <code>PasaporteWorkflow</code> (4 códigos : <code>PASAPORTE_EXPEDICION</code>, <code>PASAPORTE_RENOVACION</code>, <code>PASAPORTE_PERDIDA</code>, <code>PASAPORTE_DETERIORO</code>). Documentos típicos : DIP, foto carnet, certificado de nacimiento, eventualmente declaración policía (pérdida/robo). Especificidad clave : <code>requires_appointment=True</code> + <strong>cita biométrica presencial</strong> obligatoria en oficina CNEDOGE — el ciudadano se presenta físicamente para captura de huellas y foto biométricas (datos directos para producción del pasaporte). <strong>No hay matching facial automatizado por algoritmo</strong> — la verificación de identidad es visual y firmada por el agente. El PDF del pasaporte se genera tras el RDV. <code>requires_nota_ingreso=True</code> para algunos sub_types (validación OCR del Nota antes del pago principal)."
      },
      "dgt": {
        "title": "4.2 DGT — licencia de conducir",
        "body": "Cubierta en detalle en la sección 3 más arriba. Especificidad clave : <strong>examen práctico obligatorio</strong> para <code>CONDUCIR_NUEVO</code> (paso real fuera de la plataforma, programado vía el step appointment). 7 clases (A-F, sin AM/COPIA_ADICIONAL). Pago directo Mobile Money (sin Nota de Ingreso intermedia)."
      },
      "extranjeria": {
        "title": "4.3 Extranjería — residencia + visado",
        "body": "Detalle completo : <a href=\"67-agente-extranjeria.html\">página 67</a>. Especificidad clave : <strong>dos workflows distintos</strong>. <code>ResidenciaWorkflow</code> (2 códigos : <code>RESIDENCIA_PRIMERA_VEZ</code> + <code>RESIDENCIA_RENOVACION</code>) en <strong>2 phases</strong> (Phase 1 dossier + stamps 2 500 XAF → Nota de Ingreso oficial papier → Phase 2 nota + pago 200K/100K + cita CNEDOGE para entrega física). <code>TramitesVisadoWorkflow</code> (4 sub_types : Prórroga 20K, Alternativo 20-600K tiered selon durée, Permanencia 50K/mes, Salida Vencido 30K/mes auto-calculado). Validation CEMAC (6 países sin visa) + 12 schemas OCR + 11 reglas validate_step."
      }
    },
    "s5": {
      "title": "5. Permissions del rol agente",
      "intro": "Las permissions del agente se rattachent au rôle (<code>agent_cnedoge_pasaporte</code>, <code>agent_dgt</code>, <code>agent_extranjeria</code>, etc.), no a la entidad directamente. Permisos comunes :",
      "l1": "<code>service_request.view_assigned</code> — ver la cola de solicitudes asignadas",
      "l2": "<code>service_request.lock</code> — lock_for_review",
      "l3": "<code>service_request.approve</code> — decisión approve/reject/request_documents",
      "l4": "<code>service_request.escalate</code> — escalada al supervisor",
      "l5": "<code>service_request.verify_manually</code> — verificar identificadores (DIP, NIF) — usado por <a href=\"68-funciones-verify-agente.html\">Verify identidad</a>"
    },
    "s6": {
      "title": "6. Aviso honestidad documental",
      "info": {
        "title": "Lo que NO existe en el código (mayo 2026)",
        "body": "A diferencia de descripciones genéricas previas en este manual, el patrón agentes workflows simples <strong>no incluye actualmente</strong>: reconocimiento facial automatizado o matching biométrico foto-DIP por algoritmo (la captura biométrica CNEDOGE es física, sin scoring auto), verificación INTERPOL automatizada, anulación automática de cita tras N ausencias del ciudadano (no hay lógica de tracking de absences en el código), naturalización gestionada por Facil (decreto presidencial hors scope). El patrón es genérico y simple : revisión documental + decisión humana + acciones backend estándar."
      }
    },
    "prev": "← Anterior: Rol Agente",
    "next": "Siguiente: Agente DGT →"
  },
  "page63": {
    "html_title": "Agente DGT — Manual Facil",
    "title": "Agente DGT: validación de permisos de conducir",
    "description": "Los agentes de la Dirección General de Tráfico (DGT) tratan los permisos de conducir: expedición primera vez, renovación, duplicados, conversión de permisos extranjeros. Trabajan con un calendario de citas para los exámenes prácticos y emiten el carnet definitivo tras validación. Esta página describe la pantalla concreta de un agente DGT con capturas reales del back-office.",
    "s1": {
      "title": "1. Dashboard del agente DGT",
      "body": "La pantalla de inicio del agente DGT muestra los KPI clave de su jornada: número de solicitudes en cola, citas del día, tasa SLA respetada de los últimos 30 días, y horarios de cita disponibles. El submenu lateral <em>«Permisos de Conducir»</em> da acceso directo a las acciones específicas (Validación rápida, Citas, Historial)."
    },
    "fig1": {
      "alt": "Dashboard DGT con submenu Permisos de Conducir expandido",
      "caption": "Dashboard DGT con KPIs (solicitudes pendientes, citas hoy, tasa SLA) y menú lateral expandido."
    },
    "s2": {
      "title": "2. Cola de solicitudes pendientes",
      "body": "La cola lista todas las solicitudes asignadas a la entidad DGT, ordenadas por prioridad SLA. Al hacer clic en una entrada, se abre el panel lateral derecho con un resumen y un botón <em>«Validación rápida»</em> que activa el lock_for_review (ver <a href=\"61-rol-agente.html\">página 61</a>)."
    },
    "fig2": {
      "alt": "Lista dossiers pendientes con detalle CON-2026-00001",
      "caption": "Cola de solicitudes con panel lateral de detalle y botón <em>Validación rápida</em>."
    },
    "s3": {
      "title": "3. Detalle de una solicitud (3 pestañas)",
      "intro": "Tras hacer lock, el agente accede a la pantalla de detalle dividida en 3 pestañas: Resumen (datos personales y tipo de permiso), Documentos (verificación de los archivos subidos) e Historial (timeline cronológico de las acciones).",
      "sub1": {
        "title": "Pestaña Resumen — datos del solicitante"
      },
      "sub2": {
        "title": "Pestaña Documentos — verificación documental",
        "body": "Cada documento se previsualiza in situ (zoom, rotación, descarga). El agente marca explícitamente <em>«Conforme»</em> o <em>«No conforme»</em>. Si un documento está marcado <em>«No conforme»</em>, debe especificar el motivo (foto borrosa, fecha caducada, sello ilegible) — esta información se transmite al ciudadano si la decisión final es <code>request_documents</code>."
      },
      "sub3": {
        "title": "Pestaña Historial — timeline cronológico"
      }
    },
    "fig3": {
      "alt": "Detalle solicitud renovación licencia con datos personales",
      "caption": "Resumen del expediente: tipo de servicio, datos del solicitante, importe, estado, plazo SLA restante."
    },
    "fig4": {
      "alt": "Pestaña Documentos con permiso residencia y carnet",
      "caption": "Verificación documental: previsualización de cada archivo + botones Conforme/No conforme + campo motivo."
    },
    "fig5": {
      "alt": "Timeline con cambios de estado y asignaciones",
      "caption": "Timeline de acciones: depósito, asignación, lock, decisión. Cada evento con timestamp + autor."
    },
    "s4": {
      "title": "4. Historial de solicitudes (vista global)",
      "body": "Para auditar su propia actividad y consultar casos pasados, el agente dispone de una pantalla <em>«Historial de Solicitudes»</em> con todos los expedientes que ha tratado, filtrable por fecha, estado, tipo de servicio. El panel lateral derecho muestra el timeline detallado del expediente seleccionado y permite exportarlo en PDF para archivos."
    },
    "fig6": {
      "alt": "Página Historial de Solicitudes con tabla acciones",
      "caption": "Vista global del historial filtrable."
    },
    "fig7": {
      "alt": "Timeline detallado solicitud panel lateral exportable",
      "caption": "Panel lateral con timeline detallado + botón <em>Exportar PDF</em>."
    },
    "s5": {
      "title": "5. Gestión de citas para examen práctico",
      "body": "A diferencia de la mayoría de los agentes, el DGT necesita organizar exámenes prácticos en pista o en circuito real para los nuevos permisos. La gestión de citas se hace desde un calendario semanal donde el agente:",
      "l1": "Visualiza los slots ya reservados (verde: confirmados, naranja: pendientes confirmación)",
      "l2": "Hace clic en un slot ocupado para abrir el panel lateral con datos del ciudadano",
      "l3": "Reagenda con un drag-and-drop o botón <em>«Reprogramar»</em>",
      "l4": "Marca el resultado tras el examen: aprobado (genera el carnet) o suspendido (puede volver a presentarse en 30 días)"
    },
    "fig8": {
      "alt": "Calendario semanal de citas con cita confirmada",
      "caption": "Calendario semanal: slots disponibles, ocupados, bloqueados."
    },
    "fig9": {
      "alt": "Detalle cita lateral con datos ciudadano y reprogramar",
      "caption": "Detalle de una cita con datos completos del ciudadano + botón Reprogramar."
    },
    "s6": {
      "title": "6. Tipos de permisos tratados",
      "t": {
        "h1": "Categoría",
        "h2": "Vehículos autorizados",
        "h3": "Edad mínima",
        "r1": { "c2": "Motocicletas hasta 125 cc" },
        "r2": { "c2": "Motocicletas sin restricción" },
        "r3": { "c2": "Vehículos turismos hasta 3.500 kg" },
        "r4": { "c2": "Camiones más de 3.500 kg" },
        "r5": { "c2": "Autobuses, transporte de pasajeros" },
        "r6": { "c2": "Combinaciones con remolque pesado" }
      }
    },
    "prev": "← Anterior: Agente CNEDOGE",
    "next": "Siguiente: Agente Ayuntamiento + Cámara →"
  },
  "page64": {
    "html_title": "Agente Ayuntamiento + Cámara — Manual Facil",
    "title": "Agentes Ayuntamiento + Cámara: validación pagos comerciales",
    "description": "Los agentes del Ayuntamiento (municipalidad de Malabo, Bata, Mongomo…) y de la Cámara de Comercio comparten un mismo back-office aunque tratan tasas distintas. El Ayuntamiento valida las tasas municipales (licencia comercial de bares, restaurantes, tiendas) mientras que la Cámara cobra las cuotas anuales de inscripción al registro mercantil. El workflow es simétrico: cola de pagos pendientes, validación con justificantes, generación del recibo PDF firmado.",
    "s1": {
      "title": "1. Las dos entidades en paralelo",
      "t": {
        "h1": "Entidad",
        "h2": "Tasas tratadas",
        "h3": "Periodicidad",
        "r1": {
          "c1": "Ayuntamiento (Malabo, Bata, Mongomo, Ebebiyín…)",
          "c2": "Licencia comercial de bares y restaurantes, tasa de mercado, tasa de cementerio, tasa de obras, ocupación vía pública",
          "c3": "Anual o por evento"
        },
        "r2": {
          "c1": "Cámara de Comercio",
          "c2": "Cuota anual de inscripción al registro mercantil, tasa de actualización de los estatutos, certificado de registro",
          "c3": "Anual"
        }
      }
    },
    "s2": {
      "title": "2. Dashboard y cola de pagos",
      "body": "Cada agente ve únicamente las tasas de su entidad. El dashboard muestra los pagos pendientes, los validados del día y los en escalación. Los pagos consolidados (bundle, ver <a href=\"26-bundle-payment.html\">página 26</a>) aparecen como una entrada única con el detalle del desglose por entidad."
    },
    "fig1": {
      "alt": "Dashboard Ayuntamiento con pagos bundle pendientes",
      "caption": "Dashboard Ayuntamiento Malabo con pagos bundle en cola."
    },
    "fig2": {
      "alt": "Dashboard Cámara Comercio con pago pendiente",
      "caption": "Dashboard Cámara Comercio Malabo con cuotas pendientes."
    },
    "s3": {
      "title": "3. Validación de un pago: el flujo simétrico",
      "intro": "El agente abre un pago pendiente desde su cola. La pantalla de validación muestra: datos del comerciante (nombre, NIF, dirección), tipo de tasa, importe esperado, importe pagado, modo de pago (efectivo, transferencia BANGE, mobile money), justificante (foto del recibo bancario o de la nota de caja).",
      "body": "Cuando el agente confirma, el sistema genera el recibo PDF oficial con un número único de la forma <code>REC-2026-NNNNNN</code>, sello de la entidad, firma del agente y QR de verificación. Una notificación es enviada inmediatamente al comerciante (email + push)."
    },
    "fig3": {
      "alt": "Validación pago efectivo Tasa Municipal Bares",
      "caption": "Validación de un pago en efectivo de la Tasa Municipal de Bares y Restaurantes."
    },
    "fig4": {
      "alt": "Validación pago Cuota Cámara Comercio",
      "caption": "Validación de un pago de Cuota Cámara Comercio (50.000 XAF)."
    },
    "s4": {
      "title": "4. Confirmación: el recibo generado",
      "body": "Tras la validación, un modal de confirmación recapitula el recibo emitido y propone descargarlo o enviarlo por email a una dirección personalizada (caso útil cuando el comerciante quiere transmitir el recibo a su contable directamente)."
    },
    "fig5": {
      "alt": "Modal éxito recibo REC-2026-000003 generado",
      "caption": "Modal éxito tras validación: número de recibo, fecha, opciones descargar/enviar."
    },
    "fig6": {
      "alt": "Modal éxito recibo REC-2026-000004 generado",
      "caption": "Modal idéntico para Cámara — diseño común."
    },
    "s5": {
      "title": "5. Historial de validaciones",
      "body": "Como los agentes DGT, los agentes Ayuntamiento/Cámara disponen de un historial completo de sus validaciones, con filtros por fecha, importe, tipo de tasa, modo de pago. El panel lateral derecho permite reabrir un recibo emitido para reenvío al comerciante o para auditoría interna."
    },
    "fig7": {
      "alt": "Historial validaciones Ayuntamiento con panel lateral",
      "caption": "Historial Ayuntamiento con panel lateral de detalle."
    },
    "fig8": {
      "alt": "Historial validaciones Cámara con detalle lateral",
      "caption": "Historial Cámara: misma estructura, datos propios a la entidad."
    },
    "s6": {
      "title": "6. Particularidades del workflow comercial",
      "info": {
        "title": "Inspección terreno (OMS)",
        "body": "Cuando un agente OMS (Obligation Management System — sin relación con la salud) realiza una inspección comercial bundle en el terreno (ver <a href=\"69-trabajo-terreno-oms.html\">página 69</a>) y collectó una obligación en efectivo en el local, esa obligación entra en el flujo Ayuntamiento o Cámara según su <code>fee_type</code> (municipal o chamber). El agente OMS escanea el QR de la licencia, registra el cobro, y un evento se crea automáticamente en la cola del agente Ayuntamiento/Cámara para reconciliación al final del día."
      },
      "warn": {
        "title": "Pagos en efectivo: declaración obligatoria",
        "body": "Para los pagos en efectivo superiores a 1.000.000 XAF, el agente debe pedir un justificante de origen de fondos (extracto bancario, justificante de venta, etc.) y adjuntarlo al expediente. Esta obligación viene de la regulación CEMAC contra el blanqueo de capitales. Si el cliente no puede justificar, la decisión obliga a <code>escalate</code> al supervisor."
      }
    },
    "prev": "← Anterior: Agente DGT",
    "next": "Siguiente: Agente Tesoro →"
  },
  "page65": {
    "html_title": "Agente Tesoro — Manual Facil",
    "title": "Agente Tesoro Público: validación de pagos y reconciliación BANGE",
    "description": "Los agentes del Tesoro Público son los validadores finales de todos los pagos que pasan por Facil. A diferencia de los agentes Ayuntamiento o Cámara que validan tasas concretas, el Tesoro centraliza la reconciliación bancaria: confirma que el dinero ha entrado realmente en las cuentas del Estado vía BANGE Mobile Money, transferencia bancaria o ingreso en efectivo. Cada validación genera el recibo oficial firmado del Tesoro Público.",
    "s1": {
      "title": "1. Autenticación reforzada (2FA obligatorio)",
      "body": "Por la sensibilidad de las operaciones (validación de millones de XAF al día), los agentes del Tesoro tienen una autenticación 2FA obligatoria a cada inicio de sesión, sin excepción posible. La pantalla de configuración de la cuenta permite generar códigos de respaldo en caso de pérdida del teléfono."
    },
    "fig1": {
      "alt": "Configuración seguridad 2FA con códigos respaldo",
      "caption": "Configuración de seguridad 2FA con códigos de respaldo."
    },
    "fig2": {
      "alt": "Pantalla login portal de agente Facil",
      "caption": "Pantalla de login común a todos los agentes Facil."
    },
    "fig3": {
      "alt": "Pantalla verificación 2FA código seis dígitos",
      "caption": "Verificación 2FA: 6 dígitos generados por la app autenticadora del agente."
    },
    "s2": {
      "title": "2. Dashboard del Tesoro Público",
      "body": "El dashboard agrupa los pagos según su estado: pendientes de validación (cola de trabajo), completados del día (auditoría rápida), escalados al supervisor (casos ambiguos). Los KPI muestran el importe total pendiente, el importe validado en el día, la tasa de validación automática (pagos auto_approved sin intervención humana, gracias a los webhooks BANGE)."
    },
    "fig4": {
      "alt": "Dashboard Tesoro Público con pagos pendientes y completados",
      "caption": "Dashboard Tesoro: pagos pendientes en la parte superior, completados en la parte inferior."
    },
    "s3": {
      "title": "3. Validación de un pago: lista + detalle lateral",
      "body": "El agente abre la lista de pagos pendientes. Al hacer clic en una entrada, el panel lateral muestra los datos esenciales: tipo de servicio (CONDUCIR_RENOVACION, PASAPORTE_NUEVO, etc.), importe, modo de pago, identificador de transacción BANGE, justificante (extracto bancario o capture del SMS de confirmación BANGE)."
    },
    "fig5": {
      "alt": "Lista pagos pendientes con detalle CONDUCIR_RENOVACION",
      "caption": "Cola de pagos pendientes con panel lateral de detalle."
    },
    "s4": {
      "title": "4. Vista completa de un pago + 3 acciones disponibles",
      "body": "Si la información del panel lateral es insuficiente, el agente abre la vista completa con el botón <em>«Ver detalle»</em>. La pantalla muestra todos los datos: histórico de transacciones BANGE para esa cuenta, capturas del recibo de pago, datos del ciudadano. Tres botones: <em>«Validar»</em> (apruebe el pago, genere el recibo), <em>«Rechazar»</em> (motivo obligatorio: importe incorrecto, fraude, doble pago), <em>«Escalar»</em> (caso ambiguo, transmite al supervisor del Tesoro)."
    },
    "fig6": {
      "alt": "Detalle pago con acciones validar rechazar escalar",
      "caption": "Vista detallada con los 3 botones de acción y todos los datos del pago."
    },
    "s5": {
      "title": "5. Generación del recibo Tesoro Público",
      "body": "Tras la validación, el sistema genera el recibo oficial del Tesoro Público (formato distinto del Ayuntamiento o Cámara). Este recibo es legalmente vinculante: prueba que el ciudadano ha pagado las tasas debidas al Estado. Lleva el número único <code>REC-2026-NNNNNN</code>, la firma electrónica del Tesoro, un QR de verificación (página 57) y la mención <em>«Recibo válido para todas las administraciones de Guinea Ecuatorial»</em>."
    },
    "fig7": {
      "alt": "Modal éxito recibo REC-2026-000013 generado",
      "caption": "Modal éxito tras validación: número de recibo + descargar."
    },
    "fig8": {
      "alt": "Recibo PDF generado con QR verificación firma Tesoro",
      "caption": "Recibo PDF oficial del Tesoro con QR + firma electrónica."
    },
    "s6": {
      "title": "6. Mis transacciones (auditoría agente)",
      "body": "El menu <em>«Mis Transacciones»</em> reúne todos los pagos que el agente ha tratado, con filtros (fecha, tipo de servicio, importe, modo de pago) y métricas agregadas: importe total validado del mes, número medio de validaciones por día, tasa de rechazo. Útil para el cierre semanal de actividad del agente."
    },
    "fig9": {
      "alt": "Historial de Transacciones con filtros y métricas",
      "caption": "Historial transacciones del agente Tesoro con filtros y métricas agregadas."
    },
    "s7": {
      "title": "7. Reconciliación bancaria automática",
      "body": "La mayoría de los pagos vía BANGE Mobile Money son validados automáticamente por el sistema gracias al webhook BANGE: cuando un ciudadano confirma su pago con el PIN, BANGE envía una notificación a Facil que valida el pago en menos de 5 segundos. Estos pagos pasan directamente al estado <code>auto_approved</code> sin intervención del agente. El agente Tesoro interviene solo en los casos no automáticos: pagos en efectivo en la oficina, transferencias clásicas con extracto bancario, casos donde el webhook ha fallado y debe ser reconciliado manualmente.",
      "body2": "Las funciones <em>Verify Treasury</em> permiten al agente buscar manualmente una transacción por su identificador BANGE para resolver discrepancias (ver <a href=\"68-funciones-verify-agente.html\">página 68</a>)."
    },
    "prev": "← Anterior: Agente Ayuntamiento + Cámara",
    "next": "Siguiente: Agente Ministerio Sanidad →"
  },
  "page66": {
    "html_title": "Agente OMS — Manual Facil",
    "title": "Agente OMS: procesamiento post-pago de obligaciones bundle",
    "description": "OMS (<em>Obligation Management System</em>) es el módulo interno de Facil que trata las obligaciones de licencias comerciales bundle <strong>después</strong> del pago. No tiene relación con la salud — el acrónimo coincide pero refiere al sistema de gestión de obligaciones definido en <code>licenses.py</code>. Cuando un comerciante paga su bundle (página 26), las obligaciones individuales (impuestos Tesoro, tasas Ayuntamiento, cotizaciones Cámara, impuestos sectoriales por ministerio) se distribuyen entre agentes según el modo de procesamiento configurado: <strong>Mode A — per_line</strong> (cada obligación va al ministerio competente) o <strong>Mode B — consolidated</strong> (un agente polyvalent <code>agent_oms_polyvalent</code> trata todo agregado).",
    "s1": {
      "title": "1. Dashboard del agente OMS",
      "body": "El dashboard muestra los KPIs específicos del procesamiento bundle: número de obligaciones en cola, conformidad por <code>fee_type</code> (TESORO / MUNICIPAL / CHAMBER), licencias comerciales activas, tiempo medio de procesamiento. Las acciones rápidas dan acceso directo a las funciones más frecuentes: nueva inspección terreno, consulta de empresa por NIF, lista de licencias, conformidad por tipo de tasa."
    },
    "fig1": {
      "alt": "Dashboard agente OMS con KPIs obligaciones bundle",
      "caption": "Dashboard agente OMS con KPIs licencias, obligaciones, conformidad."
    },
    "s2": {
      "title": "2. Consulta de empresas",
      "body": "El menú <em>«Consulta empresas»</em> permite buscar una empresa por NIF, número de registro mercantil o nombre comercial. Útil cuando el agente recibe una llamada del comerciante o necesita auditar el historial bundle de un establecimiento antes de una inspección terreno."
    },
    "fig2": {
      "alt": "Consulta empresas búsqueda por NIF/registro/nombre",
      "caption": "Búsqueda de empresa con campos NIF, registro mercantil, nombre comercial."
    },
    "s3": {
      "title": "3. Licencias comerciales bundle",
      "body": "La pantalla <em>«Licencias comerciales»</em> lista todas las licencias gestionadas por el módulo OMS, con sus identificadores, su empresa propietaria, su saldo de obligaciones (número de obligaciones bundle no pagadas) y su estado (en validez, vencida, en renovación, suspendida).",
      "body2": "Hacer clic en una licencia abre la vista detallada con el desglose por obligación (tasa Tesoro, tasa Ayuntamiento, cotización Cámara, impuesto sectorial ministerial) y la opción de regenerar el certificado PDF de la licencia."
    },
    "fig3": {
      "alt": "Lista licencias comerciales con identificadores y saldos",
      "caption": "Vista global de las licencias bundle con identificadores y saldos pendientes."
    },
    "fig4": {
      "alt": "Detalle licencia bundle con obligaciones desglosadas",
      "caption": "Detalle de una licencia con desglose de obligaciones bundle pendientes (tesoro / municipal / chamber / ministerial)."
    },
    "s4": {
      "title": "4. Tablero de inspecciones del día",
      "body": "El menú <em>«Inspecciones»</em> abre el tablero de control terreno con todas las inspecciones del día (programadas y efectuadas). Las inspecciones OMS no son sanitarias — son <strong>visitas comerciales</strong> para verificar que el comerciante está al día de sus obligaciones bundle y eventualmente collectar los pagos pendientes en el terreno (Mobile Money o cash). Cada inspección muestra: empresa visitada, dirección, hora prevista, conformidad observada (si ya hecha), tasas collectadas (si aplicable)."
    },
    "fig5": {
      "alt": "Tablero Control Terreno inspecciones bundle del día",
      "caption": "Tablero de control terreno con inspecciones comerciales bundle del día."
    },
    "s5": {
      "title": "5. Iniciar una nueva inspección comercial",
      "body": "Para empezar una inspección, el agente puede escanear el QR de la licencia comercial pegado en el establecimiento (caso típico cuando llega al local) o buscar el NIF manualmente desde la oficina. El sistema valida el QR contra la base de datos y abre la ficha de inspección preparada con los datos pre-rellenados (obligaciones pendientes, importes esperados, historial bundle del comerciante)."
    },
    "fig6": {
      "alt": "Nueva Inspección escanear QR o buscar NIF manual",
      "caption": "Pantalla de inicio de inspección: escanear QR de licencia o buscar NIF manual."
    },
    "s6": {
      "title": "6. Reconciliación de cobros del día",
      "body": "Al final de la jornada, el agente que ha collectado obligaciones en efectivo durante las inspecciones terreno debe reconciliar su caja: la suma de los cobros registrados en cada inspección bundle debe coincidir con el efectivo en su poder. La pantalla de reconciliación muestra las diferencias y permite generar un recibo agregado a depositar al cajero. Esto es crítico para evitar discrepancias entre el sistema OMS y el flujo Tesoro (página 65)."
    },
    "fig7": {
      "alt": "Reconciliación cobros bundle del día cash collectado",
      "caption": "Reconciliación de cobros bundle terreno : importes cobrados vs efectivo en caja."
    },
    "s7": {
      "title": "7. Conformidad por tipo de obligación (fee_type)",
      "body": "La pantalla <em>«Conformidad»</em> muestra el porcentaje de conformidad de las empresas por <code>fee_type</code> (campo del modelo bundle en <code>bundles.py</code>): <strong>CHAMBER</strong> (cotizaciones Cámara de Comercio), <strong>MUNICIPAL</strong> (tasas Ayuntamiento), <strong>TESORO</strong> (impuestos Tesoro Público). Útil para detectar las categorías con mayor índice de retraso de pago y orientar las acciones de control."
    },
    "fig8": {
      "alt": "Conformidad por fee_type CHAMBER MUNICIPAL TESORO",
      "caption": "Tasa de conformidad por <code>fee_type</code> (CHAMBER, MUNICIPAL, TESORO)."
    },
    "s8": {
      "title": "8. Cola de obligaciones",
      "body": "Las obligaciones bundle entran en la cola OMS tras el pago. La cola muestra las obligaciones « en curso » (en espera de procesamiento por un agente) y las « terminadas » (procesadas, validadas, archivadas). Cada obligación tiene una prioridad calculada según el fee_type, el importe y el tiempo de espera. Importante : la asignación a un agente respeta el <strong>Mode A</strong> (per_line — cada fee_type va a su ministerio) o el <strong>Mode B</strong> (consolidated — todo va al <code>agent_oms_polyvalent</code>), configurado al nivel del bundle."
    },
    "fig9": {
      "alt": "Cola obligaciones bundle en curso",
      "caption": "Cola de obligaciones en curso de procesamiento."
    },
    "fig10": {
      "alt": "Obligaciones terminadas historial",
      "caption": "Pestaña <em>Obligaciones terminadas</em> con historial."
    },
    "s9": {
      "title": "9. Roles asociados al módulo OMS",
      "info": {
        "title": "Diferenciación de los roles OMS",
        "body": "Varios roles intervienen en el procesamiento OMS según el modo configurado (<code>OMS_PROCESSOR_ROLES</code> en <code>oms_agent_service.py</code>):",
        "l1": "<strong><code>agent_tesoro</code></strong> + <strong><code>supervisor_tesoro</code></strong> — obligaciones fee_type=tesoro (página 65)",
        "l2": "<strong><code>agent_ayuntamiento</code></strong> + <strong><code>supervisor_ayuntamiento</code></strong> — obligaciones fee_type=municipal (página 64)",
        "l3": "<strong><code>agent_camara</code></strong> + <strong><code>supervisor_camara</code></strong> — obligaciones fee_type=chamber (página 64)",
        "l4": "<strong>6 ministerios sectoriales</strong> (<code>agent_min_comercio</code>, <code>agent_min_hacienda</code>, <code>agent_min_informacion</code>, <code>agent_min_turismo</code>, <code>agent_min_agricultura</code>, <code>agent_min_electricidad</code>) — Mode A per_line ministerial",
        "l5": "<strong><code>agent_oms_polyvalent</code></strong> — Mode B consolidated (esta página describe principalmente este rol). <code>supervisor_tesoro</code> también ve esta cola."
      }
    },
    "prev": "← Anterior: Agente Tesoro",
    "next": "Siguiente: Agente Extranjería →"
  },
  "page67": {
    "html_title": "Agente Extranjería — Manual Facil",
    "title": "Agente Extranjería: workflows reales residencia y trámites de visado",
    "description": "La Dirección General de Extranjería y Fronteras (entidad <code>EXTRANJERIA</code>) gestiona dos familias de trámites en Facil, basadas en la Orden Ministerial 01/2021: <strong>Permisos de Residencia para Extranjeros</strong> (Art. 3 Sección A — 2 sub_types: Primera Vez y Renovación) y <strong>Trámites de Visado</strong> (Art. 3 Sección B — 4 sub_types: Prórroga, Alternativo, Permanencia, Salida con visado vencido). El sistema NO emite el permiso físico (carnet de residencia o sello de visa), ese paso es presencial en la oficina; Facil genera el <em>comprobante de validación de la solicitud</em> y, para residencia, programa la cita en CNEDOGE para la entrega física.",
    "s1": {
      "title": "1. Workflows reales gestionados por EXTRANJERIA",
      "intro": "Dos clases Python concretas implementan estos trámites, registradas en <code>app/modules/service_requests/workflows/extranjeria/</code>:",
      "t": {
        "h1": "Workflow",
        "h2": "sub_types / códigos",
        "h3": "Documentos",
        "h4": "Tarifa principal",
        "h5": "Cita requerida",
        "r1": {
          "c1": "<code>ResidenciaWorkflow</code> (Primera Vez)",
          "c3": "13-14 documentos (varía persona física/jurídica)",
          "c4": "200 000 XAF (Fase 2, vía Nota de Ingreso) + 2 500 XAF stamps (Fase 1: Cédula 1 500 + Póliza 1 000)",
          "c5": "Sí (CNEDOGE)"
        },
        "r2": {
          "c1": "<code>ResidenciaWorkflow</code> (Renovación)",
          "c3": "11-12 documentos",
          "c4": "100 000 XAF × años (1, 2 o 5) + 2 500 XAF stamps",
          "c5": "Sí (CNEDOGE)"
        },
        "r3": {
          "c1": "<code>TramitesVisadoWorkflow</code> — Prórroga",
          "c3": "4 documentos (instancia + 3 páginas pasaporte)",
          "c4": "20 000 XAF (1 mes fijo, solo visa LIMITADO en vigor)",
          "c5": "No"
        },
        "r4": {
          "c1": "<code>TramitesVisadoWorkflow</code> — Alternativo",
          "c3": "4 documentos",
          "c4": "20 000 / 40 000 / 80 000 / 600 000 XAF según 3/6/12/24 meses",
          "c5": "No"
        },
        "r5": {
          "c1": "<code>TramitesVisadoWorkflow</code> — Permanencia",
          "c3": "4 documentos",
          "c4": "50 000 XAF × número de meses (máx. 12)",
          "c5": "No"
        },
        "r6": {
          "c1": "<code>TramitesVisadoWorkflow</code> — Salida Vencido",
          "c3": "4 documentos",
          "c4": "30 000 XAF × mes de estancia irregular (auto-calculado, penalidad)",
          "c5": "No"
        }
      }
    },
    "s2": {
      "title": "2. ResidenciaWorkflow: las 2 fases reales",
      "intro": "El workflow de residencia se divide en dos fases consecutivas, separadas por el control administrativo en Extranjería. El campo <code>con_nota_ingreso</code> (definido en el step 0 SELECTION) determina la fase activa. La Nota de Ingreso es el documento oficial emitido por Extranjería <strong>tras validar la Fase 1</strong>, que autoriza el pago principal en Fase 2.",
      "diagram": "┌─────────────────────────────────────────────────────────────────────────┐\n│ ResidenciaWorkflow — flujo real (2 fases, vérifié contra residencia_*) │\n├─────────────────────────────────────────────────────────────────────────┤\n│                                                                         │\n│  FASE 1 (con_nota_ingreso=false): Dossier completo → stamps             │\n│                                                                         │\n│  Step 0  selection: solicitud_type (EXPEDICION/RENOVACION) +            │\n│                     persona_type (física/jurídica) + con_nota=false     │\n│  Step 1  upload_documents: 13-14 docs (CEMAC condition aplicada)        │\n│  Step 2  form_review_1: pasaporte + sello entrada o residencia previa   │\n│  Step 3  form_review_2: datos profesionales/empresa (persona jurídica)  │\n│  Step 4  form_review_3: buena_conducta, antecedentes, NIF/autorización  │\n│  Step 5  appointment: cita en Extranjería                               │\n│  Step 6  stamp_payment: Cédula Personal 1 500 + Póliza 1 000 = 2 500    │\n│  Step 7  payment: Fase 1 stamps payment                                 │\n│                       │                                                 │\n│                       ▼                                                 │\n│              Validación Extranjería (off-platform)                      │\n│                       │                                                 │\n│                       ▼                                                 │\n│              Emisión de la Nota de Ingreso (papel oficial)              │\n│                                                                         │\n│  ─────────────────────────────────────────────────────                  │\n│                                                                         │\n│  FASE 2 (con_nota_ingreso=true): Nota + identidad → pago CNEDOGE        │\n│                                                                         │\n│  Step 8   upload_nota: Nota de Ingreso (scan) + documento identidad     │\n│  Step 9   form_review_nota: verificación OCR del importe Nota           │\n│  Step 10  appointment_cnedoge: cita CNEDOGE (entrega presencial)        │\n│  Step 11  payment_phase2: 200 000 XAF (EXPEDICION) o                    │\n│                          100 000 × años (RENOVACION)                    │\n│  Step 12  confirmation: resumen + agent_checklist                       │\n│                       │                                                 │\n│                       ▼                                                 │\n│              Comprobante de validación de solicitud (PDF Facil)         │\n│                       │                                                 │\n│                       ▼                                                 │\n│              Cita presencial CNEDOGE → entrega física del permiso       │\n│                                                                         │\n└─────────────────────────────────────────────────────────────────────────┘"
    },
    "s3": {
      "title": "3. Reglas CEMAC: documentos exigibles según nacionalidad",
      "intro": "La constante <code>CEMAC_COUNTRY_CODES</code> del workflow contiene 6 países (Comunidad Económica y Monetaria de África Central): Camerún (CMR), República Centroafricana (CAF), Congo Brazzaville (COG), Gabón (GAB), Guinea Ecuatorial (GNQ — excluido por regla <code>nacionalidad_extranjero</code>) y Chad (TCD). Sus nacionales <strong>no necesitan visado</strong> pero su entrada debe ser inferior a 90 días (regla <code>cemac_90_dias</code>, warning si excede). Los no-CEMAC <strong>deben aportar un visado válido</strong> (<code>VISADO_GQ_V1</code>) — solo aplicable para EXPEDICION (primera vez).",
      "info": {
        "title": "Validaciones del workflow (11 reglas reales)",
        "body": "Las reglas verifican: <code>entrada_legal_fecha</code> (fecha extraída del sello), <code>cemac_90_dias</code>, <code>visado_requerido</code> (no-CEMAC), <code>nacionalidad_extranjero</code>, <code>residencia_renovable</code> (vence en &lt;90 días para RENOVACION), <code>nombres_coherentes</code> (matching pasaporte vs residencia anterior, distancia Levenshtein), <code>solvencia_resultado</code> (warning si NO_SOLVENTE), <code>buena_conducta_resultado</code>, <code>antecedentes_resultado</code> (error si POSITIVO/HAS_CONVICTIONS), <code>nota_amount_coherent</code> (Fase 2), <code>nota_expired</code>."
      }
    },
    "s4": {
      "title": "4. Schemas OCR utilizados (12 documentos vérifiables)",
      "body": "Los documentos del expediente se validan con schemas OCR en <code>app/modules/service_requests/schemas/</code>: <code>PASAPORTE_INTERNATIONAL_V1</code>, <code>SELLO_ENTRADA_GQ_V1</code> (página de sello con fecha y aeropuerto), <code>PERMISO_RESIDENCIA_GQ_V1</code> (renovación), <code>CERTIFICADO_NIF_GQ_V1</code> (persona jurídica), <code>AUTORIZACION_GUBERNATIVA_GQ_V1</code>, <code>CERTIFICADO_BUENA_CONDUCTA_GQ_V1</code>, <code>EXTRAIT_CASIER_JUDICIAIRE_INTERNATIONAL_V1</code> (primera vez), <code>ANTECEDENTES_PENALES_GQ_V1</code> (renovación), <code>SOLVENCIA_TRIBUTARIA_GQ_V1</code>, <code>ATESTACION_BANCARIA_GQ_V1</code>, <code>PERMISO_TRABAJO_GQ_V1</code>, <code>VISADO_GQ_V1</code> (no-CEMAC)."
    },
    "s5": {
      "title": "5. Lo que Facil genera (y lo que NO genera)",
      "warn": {
        "title": "Facil NO emite el permiso físico",
        "body": "Contrariamente a una impresión frecuente, el sistema <strong>no genera el carnet de residencia</strong> ni el sello físico del visado. Esos documentos se entregan presencialmente en la oficina de Extranjería o CNEDOGE el día de la cita programada. Lo que Facil emite son <em>comprobantes electrónicos de trámite</em> que el solicitante presenta en su cita (y conserva como prueba del depósito)."
      },
      "body": "Documentos generados automáticamente por Facil (vía <code>summary_pdf_service.py</code>):",
      "l1": "<strong>Comprobante de validación de la solicitud</strong> (PDF) — al final del workflow, contiene número de solicitud (<code>SRV-2026-XXXXX</code>), datos del solicitante, sub_type, documentos depositados, fecha y código de verificación QR. Sirve como <em>justificante de depósito</em>.",
      "l2": "<strong>Recibo del pago de stamps</strong> (Fase 1 residencia, 2 500 XAF) — formato <code>REC-2026-XXXXX</code>, generado tras el pago BANGE Mobile Money o cash.",
      "l3": "<strong>Recibo del pago principal</strong> (Fase 2 residencia 200K/100K, o trámite de visado) — mismo formato, separado del stamps.",
      "l4": "<strong>Convocatoria de cita</strong> (residencia: Fase 1 en Extranjería, Fase 2 en CNEDOGE) — email + SMS automáticos con fecha, hora y dirección."
    },
    "s6": {
      "title": "6. Acciones disponibles para el agente Extranjería",
      "intro": "El agente Extranjería accede a la cola de solicitudes en estado <code>pending_agent_review</code> de los workflows mencionados. Las acciones genéricas (<code>lock_for_review</code>, <code>approve</code>, <code>reject</code>, <code>request_documents</code>, <code>escalate</code>) están documentadas en la <a href=\"61-rol-agente.html\">página 61</a>. Las particularidades de Extranjería:",
      "l1": "<strong>Validación condicional</strong> — antes de <code>approve</code>, el agente revisa los resultados OCR de los 12 schemas (algunos opcionales según persona física/jurídica y CEMAC/no-CEMAC).",
      "l2": "<strong>Rechazo motivado</strong> — los motivos válidos (campo <code>rejection_reason</code>) son: documento ilegible, datos incoherentes, antecedentes positivos, solvencia negativa (persona jurídica), nota de ingreso expirada, importe nota incoherente con tarifa.",
      "l3": "<strong>Doble cita (residencia)</strong> — Fase 1 implica una primera cita en Extranjería para validación de originales y entrega de la Nota; Fase 2 implica una segunda cita en CNEDOGE para entrega del carnet.",
      "l4": "<strong>Trámites de visado sin cita</strong> — los 4 sub_types de <code>TramitesVisadoWorkflow</code> (<code>requires_appointment=False</code>) no requieren cita presencial; la regularización ocurre por correspondencia con la entidad."
    },
    "s7": {
      "title": "7. Aviso honestidad documental",
      "info": {
        "title": "Lo que NO existe en el código (mayo 2026)",
        "body": "A diferencia de descripciones genéricas circulando sobre la plataforma, el workflow real de Extranjería <strong>no contempla actualmente</strong>: verificación INTERPOL automatizada, naturalización (decreto presidencial fuera del scope Facil), categorías «residencia temporal» vs «residencia permanente» (el código solo distingue PRIMERA_VEZ y RENOVACION según Art. 3.A.1 y Art. 3.A.2), reagrupación familiar como sub_type distinto, ni lista de países sancionados gestionada por Facil. Si alguno de estos puntos se añade en una versión futura, esta página será actualizada conforme al código."
      }
    },
    "prev": "← Anterior: Agente Ministerio OMS",
    "next": "Siguiente: Funciones Verify (3 variantes) →"
  },
  "page68": {
    "html_title": "Funciones Verify — Manual Facil",
    "title": "Funciones Verify: 4 endpoints públicos HMAC + Verify agentes",
    "description": "Facil expone 4 endpoints de verificación <strong>públicos</strong> (sin autenticación, protegidos por token HMAC-SHA256 incrustado en el código QR) más 2 funciones de verificación reservadas a agentes autenticados. Esta página describe la realidad del módulo <code>app/modules/payments/api/verify_routes.py</code> (públicos) y de los endpoints agente en <code>inspections/api/inspection_routes.py</code> y <code>verified_identifiers/api/verified_identifiers_routes.py</code>. Cada endpoint tiene su propio scope, su propio formato de input y su propia respuesta — todos están listados a continuación.",
    "s1": {
      "title": "1. Los 4 endpoints públicos de verificación HMAC",
      "intro": "Los 4 endpoints comparten el mismo principio : una entrada (número de recibo, referencia de solicitud, ID de licencia, número de certificado) + un token HMAC <code>t</code> que viene del código QR impreso en el documento original. Sin token válido, la verificación falla. El HMAC se calcula con el secret <code>RECEIPT_VERIFICATION_SECRET</code> (o <code>JWT_SECRET_KEY</code> en fallback), nunca con <code>SECRET_KEY</code> (que se regenera en cada deploy).",
      "t": {
        "h1": "Endpoint",
        "h2": "Para qué",
        "h3": "Input",
        "h4": "Output principal",
        "r1": {
          "c2": "Verificar una solicitud (estado, cita, importe)",
          "c3": "<code>reference</code> tipo <code>SRV-2026-XXXXX</code> + token HMAC (16 hex)",
          "c4": "workflow_name, status, status_label, cita_date, cita_time, appointment_location, payment_amount, currency"
        },
        "r2": {
          "c2": "Verificar un recibo de pago (anti-fraude)",
          "c3": "<code>receipt_number</code> tipo <code>REC-2025-XXXXX</code> + token HMAC",
          "c4": "amount, currency, payment_method, paid_at, payer_name, workflow_code, entity_code, validated_by, validated_at"
        },
        "r3": {
          "c2": "Verificar una licencia comercial bundle",
          "c3": "<code>license_ref</code> tipo <code>LIC-2026-A1B2C3D4</code> + token + UUID de licencia",
          "c4": "company_name, nif, regimen_fiscal, bundle_name, commerce_type, fiscal_year, status, obligations_total/paid, compliance_score"
        },
        "r4": {
          "c2": "Verificar un certificado de licencia (HMAC reforzado, solo si <code>status='complete'</code>)",
          "c3": "<code>certificate_number</code> + token (24 hex) + UUID de licencia",
          "c4": "company_name, representante_legal, registration_number, commerce_type, zone_code, city_name, fiscal_year, total_amount, completed_at"
        }
      },
      "info": {
        "title": "Sin autenticación: cómo se protege la confidencialidad",
        "body": "Como los 4 endpoints son públicos, su único contrôle es el token HMAC del QR. Sin QR (o sin un token correcto), la respuesta es siempre <code>valid: false</code>. Esto previene la enumeración: un atacante no puede iterar <code>REC-2026-00001</code>, <code>00002</code>... para descubrir recibos válidos, porque cada uno requiere su propio token específico calculado con el secret servidor."
      }
    },
    "s2": {
      "title": "2. Página pública /verify para los ciudadanos",
      "body": "El frontend expone una página pública en <code>/verify/{receiptNumber}?t=...</code> que llama a estos endpoints. Cuando un ciudadano escanea el QR de su recibo (o de la licencia bundle de un comerciante), el navegador carga directamente esta página con el token preinscrito. Detalle completo en la <a href=\"57-verificar.html\">página 57</a>. Esta variante es la única <strong>pensada para los ciudadanos</strong> y los terceros (comerciantes, bancos) que quieren verificar la autenticidad de un documento."
    },
    "s3": {
      "title": "3. Verify agente terreno OMS: scan QR + búsqueda NIF",
      "intro": "El agente OMS sobre el terreno (ver <a href=\"69-trabajo-terreno-oms.html\">página 69</a>) dispone de un endpoint distinto, NO público : <code>GET /api/v1/inspections/verify</code>. Este endpoint requiere autenticación + permiso <code>inspection.create</code> + rate-limit (30 req/min/agente, OWASP A04, anti-enumeración NIF).",
      "input": {
        "title": "Input",
        "body": "El agente fournit <strong>uno</strong> de los tres identificadores (mutuamente exclusivos): <code>license_id</code> (UUID, lectura QR licencia), <code>nif</code> (formato <code>GExxxxx</code>) o <code>registration_number</code> (formato <code>PE-xxxxxx</code>). Es así cuando el QR del establecimiento está deteriorado, el agente puede buscar manualmente por NIF."
      },
      "output": {
        "title": "Output",
        "body": "Datos enriquecidos de la licencia bundle: la empresa, su tier de obligaciones (Tesoro/Municipal/Cámara/Sectorial), todas las obligaciones de la licencia (incluso las ya pagadas), los importes calculados, y para cada obligación: si el agente puede collectarla en el terreno o no (regla controlada por <code>verify_license_for_agent</code>)."
      }
    },
    "s4": {
      "title": "4. Verify identidad de un DIP (agentes verified_identifiers)",
      "intro": "El módulo <code>verified_identifiers</code> expone un conjunto de endpoints reservados a los agentes con permiso <code>service_request.verify_manually</code>. Estos endpoints sirven para <strong>marcar como verificado</strong> un identificador (DIP, registro mercantil, NIF, etc.) tras haber controlado el documento original presentado por el ciudadano.",
      "body": "La verificación es <em>declarativa</em> : el agente afirma haber controlado el documento físico (o el scan certificado), y firma la decisión en el sistema. Esta firma incluye el identificador del agente, la fecha, una nota opcional y eventualmente una foto-prueba. <strong>No hay matching biométrico automatizado</strong> entre la foto del ciudadano presente y la foto biométrica de la base: el control de identidad es responsabilidad del agente, no del algoritmo.",
      "info": {
        "title": "Captura biométrica vs reconocimiento facial",
        "body": "Los workflows de pasaporte o carnet de funcionario incluyen un step «cita biométrica» en una oficina CNEDOGE (ver <code>carnet_workflow.py</code>, step 4 «Appointment (biometric capture)»). Este step significa que el ciudadano debe presentarse físicamente para que su pasaporte/carnet sea producido con sus datos biométricos reales (huellas + foto). <strong>No es un control de identidad por reconocimiento facial automatizado</strong> en el momento de un trámite Facil. La validación de la identidad permanece manual y presencial."
      }
    },
    "s5": {
      "title": "5. Por qué esta separación pública/agente",
      "body": "Los 4 endpoints públicos permiten a un ciudadano o tercero <strong>auto-verificar</strong> un documento (un recibo, una licencia, un certificado) sin pasar por un funcionario. Esto evita los falsos documentos y reduce el flujo en las oficinas. Los endpoints agente, por su parte, permiten <strong>aumentar el contexto operativo</strong> (un agente OMS sobre el terreno necesita ver el detalle bundle completo de una licencia, no solo «¿es válido?»). La separación previene también que un atacante con un endpoint público acceda a datos personales sensibles: el endpoint <code>request</code> público no expone el nombre del solicitante, mientras que la consulta agente de una solicitud expone los datos completos."
    },
    "s6": {
      "title": "6. Errores comunes y cómo evitarlos",
      "warn": {
        "title": "Tickets de soporte recurrentes",
        "l1": "<strong>«El comerciante me dice que mi recibo no es válido»</strong> — verifique que escanea el código QR completo (no solo el número de recibo). El token HMAC <code>t</code> está en el QR, sin él la verificación falla siempre.",
        "l2": "<strong>«El agente OMS no encuentra mi licencia con el NIF»</strong> — el NIF debe ser exactamente el formato <code>GExxxxx</code> o el registro <code>PE-xxxxxx</code>. Espacios o errores de tipeo causan «not found». Pedir al ciudadano que muestre su QR de licencia o que confirme el formato exacto.",
        "l3": "<strong>«El agente CNEDOGE quiere comparar mi foto presente con la foto del DIP»</strong> — esto es un <em>control visual humano</em>, no un algoritmo automatizado. El agente compara directamente las dos imágenes (la del DIP escaneado/presentado y la del ciudadano presente), y firma su decisión. Es responsabilidad del agente, no del sistema.",
        "l4": "<strong>«¿Por qué la verificación pública no me muestra el nombre del comprador?»</strong> — protección de la privacidad. Los endpoints públicos retornan el mínimo necesario para constatar la autenticidad (importe, fecha, servicio). Los datos personales solo aparecen vía agente autenticado."
      }
    },
    "s7": {
      "title": "7. Aviso honestidad documental",
      "info": {
        "title": "Lo que NO existe en el código (mayo 2026)",
        "body": "A diferencia de descripciones genéricas previas, el módulo Verify de Facil <strong>no incluye actualmente</strong> : reconocimiento facial automatizado (no hay <code>facial_recognition</code> en el código), matching biométrico foto-DIP por algoritmo, scoring de similarity en % entre dos fotos, permission <code>validate_passport_biometric</code> (inventada, no registrada), permission <code>validate_payment</code> (inventada, las verdaderas son <code>service_request.verify_manually</code> y <code>inspection.create</code>), variante «Verify Treasury» con 2FA específica (la 2FA está al nivel del login del agente, no del endpoint), retention obligatoria 7 años distinta de la política general de audit_logs. Las verificaciones biométricas reales (toma de huellas + foto) ocurren en presencial sobre la cita CNEDOGE de los workflows pasaporte/carnet, no vía un endpoint Verify dedicado."
      }
    },
    "prev": "← Anterior: Agente Extranjería",
    "next": "Siguiente: Trabajo terreno OMS →"
  },
  "page69": {
    "html_title": "Trabajo terreno OMS — Manual Facil",
    "title": "Trabajo terreno OMS: inspección comercial bundle + collection de paiements + mode offline",
    "description": "Los agentes OMS (Obligation Management System) realizan inspecciones <strong>comerciales</strong> en los establecimientos titulares de licencias bundle. El objetivo no es sanitario — es verificar que el comerciante está al día de sus <strong>obligaciones</strong> bundle (tasas Tesoro, Ayuntamiento, Cámara, impuestos sectoriales) y eventualmente collectar los pagos pendientes directamente en el terreno (Mobile Money via BANGE o cash). Estas inspecciones se hacen sobre el terreno, a menudo en zonas con mala conectividad, donde el back-office Web (página 66) no es utilizable directamente. Facil propone un mode terreno específico con sus propias funciones: scan QR de licencia, verificación obligations, collection Mobile Money/cash, mode offline MMKV cifrado con sincronización al regreso. La implementación técnica está en <code>packages/backend/app/modules/inspections/services/collection_service.py</code>.",
    "s1": {
      "title": "1. Preparación de la jornada (oficina, antes de salir)",
      "body": "Antes de salir, el agente prepara su jornada desde el back-office (ver <a href=\"66-agente-min-oms.html\">página 66</a>) :",
      "l1": "Selecciona los establecimientos a visitar (programación previa, ruta del día, o empresas con obligaciones vencidas detectadas por el sistema)",
      "l2": "Pre-descarga los datos de las licencias bundle en su tablet/smartphone (modo offline activado, cifrado MMKV)",
      "l3": "Verifica que la batería del terminal está al máximo (los días de inspección son largos)",
      "l4": "Imprime las hojas de checklist en papel como respaldo en caso de fallo total del terminal",
      "fig": {
        "alt": "Dashboard mobile inspecciones del día",
        "caption": "Dashboard mobile del agente con las inspecciones del día (programadas + en curso)."
      }
    },
    "s2": {
      "title": "2. Llegada al establecimiento: escaneo del QR de la licencia",
      "body": "Cada establecimiento titular de una licencia comercial bundle tiene su QR code único pegado en una pared visible. El agente abre la app Facil terreno y escanea este QR. La app abre directamente la ficha de inspección preparada con los datos del establecimiento: nombre comercial, NIF, historial bundle, <strong>obligaciones pendientes y sus importes</strong>, observaciones precedentes.",
      "info": {
        "title": "Si el QR está deteriorado o ausente",
        "body": "El agente puede buscar manualmente el establecimiento por NIF o por nombre comercial. La ausencia o ilegibilidad del QR en sí misma constituye una infracción registrable en el rapport de inspección."
      },
      "fig": {
        "alt": "Iniciar una inspección scan QR o búsqueda NIF",
        "caption": "Pantalla mobile iniciar inspección: scan QR licencia o búsqueda NIF manual."
      },
      "security": {
        "title": "Protección capture d'écran",
        "body": "La aplicación mobile activa <code>FLAG_SECURE</code> (Android) et l'équivalent iOS en los écrans sensibles : tomar una capture d'écran o un enregistrement vidéo affichera un écran noir. Implémenté via le hook <code>useScreenProtection</code> dans <code>packages/mobile/src/core/security/use-screen-protection.ts</code>, basé sur <code>expo-screen-capture</code>. Raison : éviter la fuite de données personnelles des commerçants (DIP, montants obligaciones, photos d'identité) si le téléphone d'un agente est compromis o photographié à l'insu de l'agente."
      }
    },
    "s3": {
      "title": "3. Checklist comercial bundle",
      "intro": "A diferencia de un control sanitario, la checklist OMS verifica la conformidad <strong>comercial y fiscal</strong> del establecimiento:",
      "t": {
        "h1": "N°",
        "h2": "Punto a verificar",
        "h3": "Criterio",
        "h4": "Acción si fallo",
        "r1": {
          "c1": "Licencia comercial visible",
          "c2": "QR pegado en pared accesible al público",
          "c3": "Sanción 50.000 XAF (registrada como obligación adicional)"
        },
        "r2": {
          "c1": "Obligaciones Tesoro al día",
          "c2": "No obligaciones <code>fee_type=tesoro</code> vencidas sin pagar",
          "c3": "Collection inmediata Mobile Money o cash"
        },
        "r3": {
          "c1": "Obligaciones Municipal al día",
          "c2": "No obligaciones <code>fee_type=municipal</code> vencidas (tasas Ayuntamiento)",
          "c3": "Collection inmediata o convocatoria oficial"
        },
        "r4": {
          "c1": "Obligaciones Chamber al día",
          "c2": "Cuotas anuales Cámara <code>fee_type=chamber</code> al día",
          "c3": "Collection o pénalité según el caso"
        },
        "r5": {
          "c1": "Actividad declarada = actividad real",
          "c2": "El tipo de comercio observado in situ coincide con la categoría declarada en la licencia",
          "c3": "Re-clasificación de la licencia + ajuste tarifa"
        },
        "r6": {
          "c1": "Registro mercantil válido",
          "c2": "Empresa registrada en el registro Cámara, NIF activo",
          "c3": "Escalación al supervisor para verificación"
        },
        "r7": {
          "c1": "Tasas anuales sectoriales",
          "c2": "Impuesto sectorial específico (ministerio competente) al día",
          "c3": "Notificación al ministerio sectorial"
        }
      },
      "body": "El agente recorre la checklist marcando cada punto: <em>conforme / no conforme / no aplicable</em>. Para los <em>no conforme</em>, puede tomar fotos directamente desde la app (las fotos se geo-localizan automáticamente y se cifran).",
      "fig1": {
        "alt": "Rellenar la ficha de inspección mobile",
        "caption": "Rellenar la ficha de inspección: checklist + observaciones."
      },
      "fig2": {
        "alt": "Acciones disponibles tras la ficha",
        "caption": "Acciones disponibles tras la ficha (collectar paiement, emitir MED, proponer scellement)."
      }
    },
    "s4": {
      "title": "4. Collection de obligaciones en el terreno",
      "body": "Si la inspección revela obligaciones bundle no pagadas, el agente puede collectar inmediatamente en el lugar. La app calcula automáticamente el total a cobrar (suma de las obligaciones vencidas + eventual penalité) y propide 2 opciones de paiement :",
      "l1": "<strong>Mobile Money via BANGE</strong> — el comerciante saisit su número de teléfono, recibe un PIN SMS BANGE, confirma. Webhook BANGE notifica Facil inmediatamente. Solución preferida (trazabilité totale, sin manipulación de cash).",
      "l2": "<strong>Cash en el lugar</strong> — el agente collectó el efectivo, imprime un recibo provisional via mini-impresora Bluetooth (si dispone). Este recibo será sustituido por el recibo oficial <code>REC-2026-NNNNNN</code> tras la reconciliación al regreso al servicio (ver página 66 §6).",
      "warn": {
        "title": "Lock ordering strict (CLAUDE.md)",
        "body": "La transaction de collection terrain sigue el lock ordering canónico para evitar deadlocks bajo carga (100+ agents simultáneos) : <code>commercial_licenses</code> (FOR UPDATE) → <code>service_requests</code> (INSERT optimista via partial UNIQUE index) → <code>license_obligations</code> (UPDATE batch) → <code>service_payments</code> (INSERT). Timeouts : <code>lock_timeout=3s</code>, <code>statement_timeout=5s</code>. Implementación en <code>collection_service.py::CollectionService.collect_field_payment</code>."
      },
      "fig": {
        "alt": "Encaissement du paiement mobile",
        "caption": "Pantalla collectar paiement: Mobile Money BANGE o cash, importe pre-calculado."
      }
    },
    "s4b": {
      "title": "4 bis. Si obligaciones vencidas sin paiement: emitir MED (Mise en Demeure)",
      "body": "Si el comerciante <strong>refuse de payer</strong> o no tiene los fonds nécessaires, el agente emite una <strong>Mise en Demeure</strong> (MED) con un délai légal de 72h por défaut. Endpoint backend : <code>POST /inspections/{id}/mise-en-demeure</code>, permission <code>inspection.mise_en_demeure</code>. Una MED génère :",
      "l1": "Cambio de estado de la inspección : <code>in_progress</code> → <code>mise_en_demeure</code>",
      "l2": "Génération d'un PDF MED firmado oficialmente",
      "l3": "Upload Firebase Storage + registro en el vault de la empresa",
      "l4": "Email + push al <em>owner</em> de la empresa via EventBus",
      "l5": "Listado de las obligaciones señaladas (<code>mise_en_demeure_obligations</code> JSONB)",
      "l6": "Deadline TIMESTAMPTZ stockée (<code>mise_en_demeure_deadline</code>)",
      "fig": {
        "alt": "Emitir MED mobile",
        "caption": "Pantalla emitir MED: seleccionar obligaciones vencidas, fijar deadline (72h por défaut), notas justificativas."
      }
    },
    "s4c": {
      "title": "4 ter. Si la MED expire sin paiement: proponer scellement",
      "body": "72h après l'émission de la MED, si le commerçant n'a toujours pas réglé, l'agent peut <strong>proposer le scellement</strong> du commerce (<code>POST /inspections/{id}/seal</code>, permission <code>inspection.seal_propose</code>). Cette acción <strong>requiere validation supervisor</strong> — l'agent ne peut PAS sceller seul. Le backend vérifie automatiquement la condition « MED expirée » avant d'accepter la proposition (raison <code>non_paiement_apres_med</code>).",
      "body2": "8 razones légales de scellement disponibles (enum <code>SealReason</code>) : <code>non_paiement_apres_med</code>, <code>activite_non_autorisee</code>, <code>fraude_fiscale</code>, <code>faux_documents</code>, <code>refus_controle</code>, <code>non_conformite_grave</code>, <code>decision_judiciaire</code>, <code>ordre_ministeriel</code>. Détail complet et workflow supervisor en <a href=\"74-supervisor-inspecciones.html\">página 74 §2-§3</a>.",
      "fig": {
        "alt": "Proponer scellement mobile",
        "caption": "Pantalla proponer scellement: seleccionar razón (8 enum), foto obligatoria, notas. Estado pasa a <code>seal_proposed</code> en espera de aprobación supervisor."
      }
    },
    "s4d": {
      "title": "4 quater. Finalizar la ficha y firmar",
      "body": "Una vez completadas todas las acciones (checklist, collection ou MED, scellement éventuel), el agente <strong>firma electrónicamente</strong> la ficha y la finaliza. Endpoint <code>POST /inspections/{id}/complete</code>. La firma est horodatée et stockée comme preuve juridique.",
      "fig": {
        "alt": "Finalizar y firmar ficha de inspección mobile",
        "caption": "Pantalla finalizar y firmar: el agente trace su firma + valide."
      }
    },
    "s5": {
      "title": "5. Mode offline: cómo trabaja la sincronización",
      "diagram": "┌───────────────────────────────────────────────────────────────────────┐\n│ Mode offline OMS — sincronización al regreso                          │\n├───────────────────────────────────────────────────────────────────────┤\n│                                                                       │\n│  En la oficina (con red)                                              │\n│        │                                                              │\n│        │ Pre-download datos: licencias bundle, obligations,           │\n│        │  checklists, fotos. Cifrado MMKV AES-256                     │\n│        ▼                                                              │\n│  En el terreno (sin red)                                              │\n│        │                                                              │\n│        ├─ Scan QR licencia            → leer desde cache              │\n│        ├─ Marcar checklist             → escribir en cache (queue)    │\n│        ├─ Tomar fotos                  → cifradas + queue local       │\n│        ├─ Collectar obligaciones cash  → eventos en queue             │\n│        ▼                                                              │\n│  Regreso a la oficina (red recuperada)                                │\n│        │                                                              │\n│        │ Detección automática de conexión                             │\n│        │ Sincronización automática de la queue:                       │\n│        │  • Inspecciones realizadas → service_requests                │\n│        │  • Fotos → Firebase Storage cifrado                          │\n│        │  • Collections cash → bank_transactions con flag «field»     │\n│        │  • Eventos audit → audit_logs                                │\n│        ▼                                                              │\n│  Reconciliación caja                                                  │\n│        │                                                              │\n│        │ Comparación: total eventos collection = efectivo en caja      │\n│        │  • Si igual: validación auto + recibos oficiales generados   │\n│        │  • Si diferencia: alerta supervisor + bloqueo de la sync     │\n│        ▼                                                              │\n│  Estado final: jornada cerrada, recibos oficiales emitidos             │\n│                                                                       │\n└───────────────────────────────────────────────────────────────────────┘"
    },
    "s6": {
      "title": "6. Reconciliación al regreso (procedimiento administrativo)",
      "body": "Una vez de vuelta al servicio, el agente debe completar la reconciliación administrativa en menos de 24 h. La pantalla de reconciliación (capturada en la <a href=\"66-agente-min-oms.html\">página 66 § 6</a>) lista todos los collections realizados en el día, agrupados por establecimiento, y propide un total esperado. El agente cuenta su efectivo y registra el importe; si coincide, el sistema valida automáticamente y genera los recibos oficiales para cada collection. Si difiere, una explicación obligatoria es solicitada y el supervisor es notificado."
    },
    "s7": {
      "title": "7. Buenas prácticas terreno",
      "l1": "<strong>Llegar de improviso</strong> — para que el establecimiento no tenga tiempo de prepararse. Las inspecciones programadas con aviso pierden eficacia.",
      "l2": "<strong>Trabajar en pareja</strong> — un agente con el otro como testigo, sobre todo cuando hay collection cash, para evitar acusaciones de corrupción.",
      "l3": "<strong>Preferir Mobile Money</strong> — incluso si el comerciante propone cash, pedirle el Mobile Money primero (trazabilité, BANGE webhook, sin manipulación física de efectivo).",
      "l4": "<strong>Sincronizar al regreso al servicio</strong> — antes del fin de la jornada. La memoria del cache MMKV es limitada (~1 GB) y se llena rápido si se acumulan inspecciones.",
      "l5": "<strong>Mantener carga el terminal</strong> — un terminal apagado durante una sincronización pendiente puede perder eventos. Power bank obligatorio."
    },
    "prev": "← Anterior: Funciones Verify",
    "next": "Siguiente: Asistente IA Agente →"
  },

  "page71": {
      "html_title": "Rol Supervisor — Manual Facil",
      "title": "Rol Supervisor: encadrar los agentes y validar las escalaciones",
      "description": "Los supervisores son funcionarios de rango superior dentro de cada entidad (Tesoro, Ayuntamiento, Cámara, OMS, CNEDOGE, DGT, Extranjería). Su misión es triple: encadrar a los agentes (asignación, formación, evaluación), tratar las escalaciones que los agentes les transmiten (casos ambiguos, fraude, decisiones complejas), monitorear los indicadores de la entidad (SLA, carga, conformidad). Esta página describe el rol común — las pantallas específicas Tesoro y Ayuntamiento+Cámara están en las páginas 72 y 73.",
      "s1": {
        "title": "1. Las 5 responsabilidades del supervisor",
        "t": {
          "h1": "Responsabilidad",
          "h2": "Acciones concretas en Facil",
          "h3": "Frecuencia",
          "r1": {
            "c1": "<strong>Tratar escalaciones</strong>",
            "c2": "Revisar las solicitudes que los agentes han escalado (acción <code>escalate</code>); validar, rechazar o asignar a un colega especializado",
            "c3": "Diaria (varias por día en Tesoro)"
          },
          "r2": {
            "c1": "<strong>Encadrar los agentes</strong>",
            "c2": "Asignar solicitudes manualmente cuando un agente está saturado, formar a un nuevo agente, evaluar el rendimiento individual",
            "c3": "Semanal"
          },
          "r3": {
            "c1": "<strong>Monitorear los KPI</strong>",
            "c2": "SLA tasa respetada, carga moyenne agente, tasa de rechazo, importes tratados",
            "c3": "Diaria (dashboard) + reporting mensual"
          },
          "r4": {
            "c1": "<strong>Auditar las decisiones</strong>",
            "c2": "Consultar el audit log, revisar muestreo de decisiones de los agentes, detectar disparidades",
            "c3": "Mensual"
          },
          "r5": {
            "c1": "<strong>Reportar al directorio</strong>",
            "c2": "Exportar informes (Excel/PDF) para el director de la entidad, alertar sobre anomalías",
            "c3": "Mensual + ad hoc"
          }
        }
      },
      "s2": {
        "title": "2. Workflow de tratamiento de una escalación",
        "intro": "Cuando un agente escala una solicitud (acción <code>escalate</code>, ver <a href=\"61-rol-agente.html\">página 61 §4</a>), entra en la cola del supervisor con el motivo explicitado. El supervisor dispone entonces de las mismas 7 acciones que el agente, pero con un nivel adicional: la decisión final no es escalable a otra instancia (excepto al directorio para casos exceptionnels).",
        "diagram": "\n┌─────────────────────────────────────────────────────────────────────────┐\n│ Flujo escalación agente → supervisor                                    │\n├─────────────────────────────────────────────────────────────────────────┤\n│                                                                         │\n│  Agente: locked_by_agent → escalate(motivo)                             │\n│         │                                                               │\n│         ▼                                                               │\n│  Solicitud: state=escalated_supervisor                                  │\n│         │                                                               │\n│         │ Notificación push + email al supervisor                       │\n│         ▼                                                               │\n│  Supervisor: ve la entrada en su cola \"Escalaciones\"                    │\n│         │                                                               │\n│         │ Click → lock_for_review (estado: supervisor_reviewing)        │\n│         ▼                                                               │\n│  Análisis del expediente con visibilidad completa :                     │\n│   • Histórico completo de las acciones del agente                        │\n│   • Motivo de la escalación                                              │\n│   • Casos similares pasados (vía IA agente, ver página 60)              │\n│   • Audit log de todas las modificaciones                                │\n│         │                                                               │\n│         ▼                                                               │\n│  Decisión del supervisor                                                │\n│   ├─ approve → genera el documento oficial, completo                    │\n│   ├─ reject → motivo obligatorio, posibilidad de recurso del ciudadano   │\n│   ├─ request_documents → como un agente                                  │\n│   ├─ assign_to_agent → re-asigna a un agente experto                    │\n│   └─ escalate_director → caso exceptionnel, decisión directorio          │\n│         │                                                               │\n│         ▼                                                               │\n│  Estado final + audit log con doble firma                                │\n│  (firma agente + firma supervisor)                                      │\n│                                                                         │\n└─────────────────────────────────────────────────────────────────────────┘\n"
      },
      "s3": {
        "title": "3. Dashboard supervisor: las 4 vistas clave",
        "intro": "El dashboard del supervisor está dividido en 4 secciones que cubren el conjunto de sus responsabilidades operativas:",
        "l1": "<strong>Cola escalaciones</strong> — solicitudes en estado <code>escalated_supervisor</code> esperando su decisión. Ordenadas por SLA restante (descendiente, las más urgentes primero).",
        "l2": "<strong>Vista carga agentes</strong> — para cada agente de la entidad: nombre, número de solicitudes en cola, edad de la más antigua, indicador de saturación (verde &lt;15 / naranja 15-30 / rojo &gt;30).",
        "l3": "<strong>KPI semana en curso</strong> — SLA respetado %, número de validaciones, número de rechazos, importe total tratado. Comparación con la semana anterior (delta %).",
        "l4": "<strong>Alertas</strong> — eventos anormales detectados automáticamente: agente offline desde X horas, solicitud bloqueada hace más de 30 minutos, pico de rechazos sobre un mismo motivo, etc."
      },
      "s4": {
        "title": "4. Re-asignación manual de una solicitud",
        "body": "Cuando el supervisor observa que un agente está saturado (cola &gt; 30 solicitudes, edad media &gt; 48h), puede re-asignar manualmente algunas solicitudes a otros agentes menos cargados. Esta acción no requiere la aprobación del agente concerné; es una decisión jerárquica. El audit log conserva la fecha, el supervisor que ha decidido, las solicitudes movidas, y los agentes implicados (antes/después).",
        "tip": {
          "title": "Buena práctica",
          "body": "Privilegiar la asignación automática (basada en la carga calculada por el sistema) sobre la asignación manual. La manual debe quedarse reservada a casos excepcionales (formación, especialización, ausencia). El uso excesivo de la asignación manual sugiere que la regla automática no está bien calibrada y debe ser revisada con el administrador (página 89)."
        }
      },
      "s5": {
        "title": "5. Audit log: ver y exportar",
        "body": "El supervisor tiene acceso de lectura al audit log completo de su entidad (todas las acciones de sus agentes y de sí mismo). Filtros disponibles: período, agente, acción, tipo de servicio, decisión final. Exportación en CSV (Excel) o PDF (informe formaté). Estos exports son la base para los rapports mensuales al directorio."
      },
      "s6": {
        "title": "6. Diferencias con el rol Admin",
        "info": {
          "title": "Supervisor vs Admin",
          "body": "El supervisor opera <em>dentro</em> de una entidad concreta (Tesoro, OMS, etc.); el admin opera <em>encima</em> de todas las entidades. El supervisor no puede crear nuevos servicios fiscales, modificar el workflow de un trámite, configurar los providers SMS/email, ni cambiar los roles del sistema. Estas acciones requieren el rol Admin (páginas 81-89). En cambio, el supervisor tiene una vista operativa de su entidad que el admin no necesita en el día a día."
        }
      },
      "prev": "← Anterior: Asistente IA Agente",
      "next": "Siguiente: Supervisor Tesoro →"
    },
    "page72": {
      "html_title": "Supervisor Tesoro — Manual Facil",
      "title": "Supervisor Tesoro Público : el back-office más denso",
      "description": "El supervisor del Tesoro Público dispone del back-office más completo de Facil. Su rol cubre 7 grandes secciones : dashboard ejecutivo, gestión del equipo de agentes, reconciliación bancaria BANGE, informes y analítica (incluido un asistente IA financiero), escalaciones, vista estratégica de las empresas por zona, supervisión de las inspecciones terreno. Esta página presenta cada sección con sus capturas reales.",
      "s1": {
        "title": "1. Dashboard ejecutivo",
        "body": "La pantalla de entrada muestra el flujo de ingresos del día, la distribución por servicios, la carga de los agentes en tiempo real y las alertas SLA. Una sola vista permite saber dónde focaliser la atención."
      },
      "s2": {
        "title": "2. Gestión del equipo",
        "body": "Dos pestañas : <em>Agentes</em> (lista con capacidad, disponibilidad, tasa de éxito) y <em>Carga de trabajo</em> (estadísticas por agente con validados, rechazos, score performance)."
      },
      "s3": {
        "title": "3. Reconciliación bancaria BANGE",
        "body": "La sección clave del Tesoro : reconciliar los pagos efectivos con los importes esperados. Las transacciones se filtran por fecha, estado, importe, identificador BANGE."
      },
      "s4": {
        "title": "4. Informes y analítica",
        "intro": "5 vistas complementarias : Dashboard ejecutivo (KPIs), Estadísticas Agentes, SLA, Analítica predictiva, Asistente IA financiero. Las 5 cubren el reporting mensual al directorio."
      },
      "s5": {
        "title": "5. Exportaciones contables",
        "body": "El Tesoro debe transmitir periódicamente sus datos a otros sistemas contables nacionales o internacionales : Auditoría interna, BEAC (Banque des États de l'Afrique Centrale), Ministerial, SAGE X3. Una pantalla dedicada lista las plantillas y permite generar un export en CSV / Excel formaté."
      },
      "s6": {
        "title": "6. Escalaciones pendientes",
        "body": "La cola de escalaciones lista las solicitudes que los agentes Tesoro han transmitido al supervisor. Filtros por prioridad y motivo. Una entrada vacía es señal de un equipo bien organizado."
      },
      "s7": {
        "title": "7. Vista estratégica de las empresas por zona",
        "intro": "El supervisor Tesoro tiene una vista panorámica de las empresas registradas por zona geográfica. Cuatro pestañas (Estratégico, Operacional, Control, Tabular) ofrecen distintos ángulos de análisis."
      },
      "s8": {
        "title": "8. Panel ministerial multi-vista",
        "body": "Para el reporting al ministerio, 4 vistas complementarias muestran las obligaciones de las empresas a nivel nacional : Estratégico (donut por zona), Pilotaje (tabular), Operacional (top deudores), Control (compliance + recovery rate)."
      },
      "s9": {
        "title": "9. Catálogo y deuda empresarial",
        "body": "Una pantalla list 23 empresas registradas en la zona del supervisor, con NIF, estado de verificación, estado fiscal. Búsqueda directa por nombre/NIF para acceder al detalle de la deuda con timeline débito/pagado."
      },
      "s10": {
        "title": "10. Supervisión de las inspecciones terreno",
        "body": "El supervisor Tesoro también monitorea las inspecciones realizadas por los agentes OMS (ver <a href=\"74-supervisor-inspecciones.html\">página 74</a>), pero desde una vista financiera : cash cobrado, MED (Misiones En curso de Desarrollo), zonas que requieren atención."
      },
      "fig0": {
        "alt": "Dashboard supervisor Tesoro con flujo ingresos y carga",
        "caption": "Dashboard principal con flujo ingresos, distribución por servicios, carga agentes, alertas SLA."
      },
      "fig1": {
        "alt": "Equipo Agentes Tesoro",
        "caption": "Agentes Tesoro con capacidad/disponibilidad/tasa éxito."
      },
      "fig2": {
        "alt": "Carga trabajo agentes estadísticas",
        "caption": "Carga de trabajo : validados, rechazos, puntuación por agente."
      },
      "fig3": {
        "alt": "Reconciliación bancaria BANGE",
        "caption": "245.850 XAF a reconciliar — lista de pagos en curso."
      },
      "fig4": {
        "alt": "Historial transacciones procesadas",
        "caption": "Historial de transacciones procesadas con filtros."
      },
      "fig5": {
        "alt": "Dashboard ejecutivo KPIs",
        "caption": "Dashboard Ejecutivo : recaudado, SLA 100%, otros KPIs."
      },
      "fig6": {
        "alt": "Estadísticas por agente",
        "caption": "Velocidad, SLA y carga por agente."
      },
      "fig7": {
        "alt": "Métricas SLA",
        "caption": "Tasa de cumplimiento SLA, distribución estados, umbrales."
      },
      "fig8": {
        "alt": "Analítica predictiva con estadísticas",
        "caption": "Análisis estadístico (media, mediana, percentiles)."
      },
      "fig9": {
        "alt": "Plantillas de exports contables",
        "caption": "Plantillas : Auditoría, BEAC, Ministerial, SAGE X3."
      },
      "fig10": {
        "alt": "Historial exports completados",
        "caption": "Historial de exports con estado completado/error."
      },
      "fig11": {
        "alt": "Modal nuevo export SAGE X3 con fechas",
        "caption": "Modal <em>«Nuevo Export»</em> SAGE X3 con rango de fechas."
      },
      "fig12": {
        "alt": "Asistente IA financiero chat",
        "caption": "Analista IA : chat de análisis financiero con comparación entidades."
      },
      "fig13": {
        "alt": "Cola escalaciones pendientes",
        "caption": "Escalaciones pendientes con filtros prioridad/motivo."
      },
      "fig14": {
        "alt": "Vista estratégica zona mapa tendencias",
        "caption": "Vista estratégica : mapa, tendencias, régimen fiscal."
      },
      "fig15": {
        "alt": "Vista operacional empresas deudoras",
        "caption": "Vista operacional : deudores con score de riesgo."
      },
      "fig16": {
        "alt": "Vista control KPIs verificación",
        "caption": "Vista control : KPIs verificación, tasa de cobro, anomalías detectadas."
      },
      "fig17": {
        "alt": "Panel ministerial estratégico donut zona",
        "caption": "Estratégico : obligaciones por zona en donut."
      },
      "fig18": {
        "alt": "Panel ministerial pilotaje tabular",
        "caption": "Pilotaje : desglose tabular por zona."
      },
      "fig19": {
        "alt": "Panel ministerial top deudores",
        "caption": "Operacional : top empresas deudoras con scoring."
      },
      "fig20": {
        "alt": "Panel ministerial control compliance",
        "caption": "Control : compliance por zona, tasa de recuperación."
      },
      "fig21": {
        "alt": "Catálogo empresas zona 23 registradas",
        "caption": "Catálogo de las 23 empresas registradas en la zona."
      },
      "fig22": {
        "alt": "Búsqueda deuda Tienda El Sol",
        "caption": "Búsqueda de deuda — ejemplo «Tienda El Sol» bundle."
      },
      "fig23": {
        "alt": "Detalle deuda timeline débito pagado",
        "caption": "Detalle deuda 216k XAF con timeline débito / pagado."
      },
      "fig24": {
        "alt": "Supervisión inspecciones agentes terreno cash",
        "caption": "Vista supervisión : agentes terreno, cash cobrado, MED."
      },
      "fig25": {
        "alt": "Dashboard misiones KPIs zonas atención",
        "caption": "Dashboard misiones con KPIs y zonas a focaliser."
      },
      "fig26": {
        "alt": "Modal crear modelo misión recurrente",
        "caption": "Modal <em>«Nuevo Modelo»</em> de misión recurrente."
      },
      "prev": "← Anterior: Rol Supervisor",
      "next": "Siguiente: Supervisor Ayuntamiento + Cámara →"
    },
    "page73": {
      "html_title": "Supervisor Ayuntamiento + Cámara — Manual Facil",
      "title": "Supervisor Ayuntamiento + Cámara : back-office local",
      "description": "Los supervisores municipales (Ayuntamiento) y los de la Cámara de Comercio comparten un back-office común con los KPI propios a su entidad : licencias comerciales gestionadas, empresas registradas, obligaciones por tipo, inspecciones locales. La vista es más sencilla que la del Tesoro porque el ámbito geográfico es local (un municipio) y los volúmenes son menores.",
      "s1": {
        "title": "1. Dashboard supervisor local",
        "body": "Las pantallas principales agrupan KPIs municipales : número de empresas activas, licencias en curso, vencimientos próximos, recaudación del mes."
      },
      "s2": {
        "title": "2. Empresas registradas en el municipio",
        "body": "La sección <em>Empresas</em> lista todas las entidades comerciales registradas en el ámbito municipal con su NIF, su licencia comercial activa, su estado de pago de las obligaciones locales."
      },
      "s3": {
        "title": "3. Inspecciones municipales",
        "body": "A diferencia del Tesoro o de OMS, las inspecciones municipales son más ligeras (control de actividad comercial declarada vs realidad terrain). El supervisor las programa, las asigna a un inspector municipal, y valida los resultados."
      },
      "s4": {
        "title": "4. Licencias comerciales locales",
        "intro": "Tres pantallas dedicadas a la gestión de las licencias comerciales : lista global, detalle de una licencia, vista por categoría/sector."
      },
      "s5": {
        "title": "5. Obligaciones locales (tasas + cuotas)",
        "body": "Las obligaciones agrupan las tasas municipales (mercado, cementerio, obras, ocupación vía pública) y las cuotas Cámara (inscripción anual, actualizaciones estatutos). El supervisor monitorea los vencidos y planifica relances ou inspecciones."
      },
      "s6": {
        "title": "6. Comparación con el supervisor Tesoro",
        "body": "El supervisor municipal tiene un periodo de validez más corto y un ámbito más restringido :",
        "t": {
          "h1": "Aspecto",
          "h2": "Supervisor Tesoro",
          "h3": "Supervisor Ayu/Cám",
          "r1": {
            "c1": "Ámbito",
            "c2": "Nacional, todas zonas",
            "c3": "Local (un municipio o una Cámara)"
          },
          "r2": {
            "c1": "Volumen típico",
            "c2": "~500 transacciones/día",
            "c3": "~50 transacciones/día"
          },
          "r3": {
            "c1": "Vista panorámica",
            "c2": "7 secciones, IA financiero, exports BEAC/SAGE",
            "c3": "5 secciones, vista municipal sencilla"
          },
          "r4": {
            "c1": "Reporting",
            "c2": "Ministerio + BEAC + DGI",
            "c3": "Ayuntamiento + Cámara local"
          }
        }
      },
      "fig0": {
        "alt": "Dashboard Ayuntamiento KPIs",
        "caption": "Dashboard supervisor — vista resumen del municipio."
      },
      "fig1": {
        "alt": "Dashboard segunda vista",
        "caption": "Vista complementaria con métricas operacionales."
      },
      "fig2": {
        "alt": "Dashboard tercera vista",
        "caption": "Tercera pestaña del dashboard con detalles agregados."
      },
      "fig3": {
        "alt": "Lista empresas municipio",
        "caption": "Empresas registradas con NIF, estado licencia, obligaciones."
      },
      "fig4": {
        "alt": "Dashboard inspecciones municipales",
        "caption": "Dashboard inspecciones municipales con KPIs y planning."
      },
      "fig5": {
        "alt": "Lista licencias comerciales",
        "caption": "Vista global de las licencias del municipio."
      },
      "fig6": {
        "alt": "Detalle licencia comercial",
        "caption": "Detalle de una licencia : empresa, importe, vencimiento, historial."
      },
      "fig7": {
        "alt": "Vista por categoría sector",
        "caption": "Vista de licencias agrupadas por categoría o sector económico."
      },
      "fig8": {
        "alt": "Obligaciones en curso",
        "caption": "Cola de obligaciones en curso con prioridad."
      },
      "fig9": {
        "alt": "Detalle obligaciones por entidad",
        "caption": "Desglose detallado de obligaciones por entidad/categoría."
      },
      "prev": "← Anterior: Supervisor Tesoro",
      "next": "Siguiente: Supervisor Inspecciones →"
    },
    "page74": {
    "html_title": "Supervisor Inspecciones — Manual Facil",
    "title": "Supervisor Inspecciones OMS: MED, scellement et validación de paiements terreno",
    "description": "El supervisor de Inspecciones OMS (Obligation Management System) encadre los agentes que realizan inspecciones <strong>comerciales bundle</strong> en el terreno (ver <a href=\"69-trabajo-terreno-oms.html\">página 69</a>) y trata tres workflows críticos definidos en el backend <code>app/modules/inspections/</code>: aprobar/rechazar las <strong>propuestas de scellement</strong> emitidas por los agentes (<code>approve_seal</code>), validar las <strong>reconciliaciones de paiements</strong> collectados en el terreno (<code>/reconcile/supervisor/{payment_id}/validate</code>), monitorear el live-status de los agentes en mission. <em>OMS no tiene relación con la salud — refiere al sistema de gestión de obligaciones bundle.</em>",
    "s1": {
      "title": "1. Estados reales del flujo inspección (InspectionStatus)",
      "body": "El backend define 7 estados (<code>InspectionStatus</code> enum en <code>inspection.py</code>). El supervisor interviene principalmente sobre <code>seal_proposed</code> et <code>reconcile</code>.",
      "t": {
        "h1": "Estado",
        "h2": "Significado",
        "h3": "Quién interviene",
        "r1": {
          "c2": "Inspección iniciada por el agente en el terreno",
          "c3": "Agente"
        },
        "r2": {
          "c2": "Inspección finalizada sin acción correctiva",
          "c3": "Agente"
        },
        "r3": {
          "c2": "MED emitida (deadline 72h por defecto)",
          "c3": "Agente (con permiso <code>inspection.mise_en_demeure</code>)"
        },
        "r4": {
          "c2": "Agente propide el scellement del comercio",
          "c3": "Agente propose, <strong>Supervisor valida</strong>"
        },
        "r5": {
          "c2": "Scellement aprobado por el supervisor",
          "c3": "Supervisor"
        },
        "r6": {
          "c2": "Scellement rechazado por el supervisor (decisión motivada)",
          "c3": "Supervisor"
        },
        "r7": {
          "c2": "Inspección cancelada (error agente, doble enregistrement)",
          "c3": "Agente o Supervisor"
        }
      }
    },
    "s2": {
      "title": "2. Las 8 razones legales de scellement",
      "intro": "Cuando el agente propide un scellement (<code>propose_seal</code>), debe elegir UNA de las 8 razones legales definidas en <code>SealReason</code> enum (<code>inspection.py</code>). Esta liste cerrada garantiza el cadre juridique de la décision.",
      "t": {
        "h1": "Código",
        "h2": "Cuándo se aplica",
        "h3": "Condición particular",
        "r1": {
          "c2": "Comerciante no ha pagado las obligaciones señaladas en la MED después del deadline",
          "c3": "MED expirada obligatoria (controlado por el backend)"
        },
        "r2": {
          "c2": "Actividad observada en el terreno no coincide con la licencia (ej: bar declarado en boutique)",
          "c3": "Foto obligatoria"
        },
        "r3": {
          "c2": "Fraude fiscal detectado (importes minorés, registres falseados)",
          "c3": "Justificantes obligatorios + escalation potentielle Tesoro"
        },
        "r4": {
          "c2": "Licencia, NIF, o autorisations présentés son falsos",
          "c3": "Foto obligatoria + transmisión Extranjería si aplicable"
        },
        "r5": {
          "c2": "Comerciante rechaza la inspección o impide el acceso al local",
          "c3": "Notes obligatorias (descripción del incidente)"
        },
        "r6": {
          "c2": "Incumplimiento grave detectado (acumulación obligaciones, faltas reiteradas)",
          "c3": "Histórico de la empresa adjunto"
        },
        "r7": {
          "c2": "Decisión judicial ordena el scellement (sentence, mandato)",
          "c3": "Référence du jugement obligatoire"
        },
        "r8": {
          "c2": "Orden ministerial directa (decreto, circular ad hoc)",
          "c3": "Référence du décret obligatoria"
        }
      }
    },
    "s3": {
      "title": "3. Flujo real Mise en demeure → Scellement → Aprobación supervisor",
      "diagram": "┌──────────────────────────────────────────────────────────────────────────┐\n│ Workflow real inspection (vérifié contre app/modules/inspections/)       │\n├──────────────────────────────────────────────────────────────────────────┤\n│                                                                          │\n│  AGENTE (mobile terreno)                                                 │\n│    │                                                                     │\n│    ▼                                                                     │\n│  1. POST /inspections/  →  inspection.status = in_progress               │\n│    │   Foto, GPS, NIF, licencia, obligaciones                            │\n│    ▼                                                                     │\n│  2. Marca checklist + actividad declarada vs observada                   │\n│    │                                                                     │\n│    ▼                                                                     │\n│  3. POST /inspections/{id}/collect (opcional)                            │\n│    │   Collectar paiement Mobile Money ou cash                           │\n│    │   permission: inspection.collect_payment                            │\n│    │                                                                     │\n│    ▼                                                                     │\n│  4. POST /inspections/{id}/mise-en-demeure (si obligaciones vencidas)    │\n│    │   deadline_hours = 72 por défaut (configurable)                     │\n│    │   permission: inspection.mise_en_demeure                            │\n│    │   → status = mise_en_demeure                                        │\n│    │   → genera MED PDF + email a owner empresa via EventBus             │\n│    ▼                                                                     │\n│  ── 72h écoulées sans paiement ──                                        │\n│    │                                                                     │\n│    ▼                                                                     │\n│  5. POST /inspections/{id}/seal (propuesta scellement)                   │\n│    │   reason: una de las 8 (ver §2)                                     │\n│    │   notes + photo obligatorios                                        │\n│    │   permission: inspection.seal_propose                               │\n│    │   → status = seal_proposed                                          │\n│    │   → notificación a TODOS los supervisores de la entidad (EventBus)  │\n│    ▼                                                                     │\n│  ─────────────────────────────────────────────────                        │\n│                                                                          │\n│  SUPERVISOR (web back-office)                                            │\n│    │                                                                     │\n│    ▼                                                                     │\n│  6. Recibe notification email + push                                     │\n│    │   Abre /supervisor/dashboard → panel pending_seals                  │\n│    ▼                                                                     │\n│  7. Revisa el dossier completo                                           │\n│    │   • Histórico de la empresa (obligaciones, MED, audit)              │\n│    │   • Foto del agente                                                 │\n│    │   • Razón invoquée + notes                                          │\n│    │   • Si non_paiement_apres_med: verifica MED expirée                 │\n│    ▼                                                                     │\n│  8. POST /inspections/{id}/seal/approve  (approved: true/false)          │\n│    │   permission: inspection.seal_approve                               │\n│    │   ┌─ approved=true  → status = seal_approved                        │\n│    │   │   • Cierre temporal officiel del comercio                       │\n│    │   │   • Notification owner + commerce association                   │\n│    │   └─ approved=false → status = seal_rejected                        │\n│    │       • notes obligatorias (motivo)                                 │\n│    │       • Agente debe reabrir la inspección si necesario              │\n│    ▼                                                                     │\n│  9. AUTO-FALLBACK: si supervisor inactivo > 24h sur seal_proposed        │\n│    │   POST /inspections/cron/auto-approve-seals (cron daily)            │\n│    │   → status passe à seal_approved automáticamente                    │\n│    │   → notification renforcée à toda la chaîne hiérarchique            │\n│                                                                          │\n└──────────────────────────────────────────────────────────────────────────┘"
    },
    "s4": {
      "title": "4. Endpoints supervisor (back-office web)",
      "t": {
        "h1": "Endpoint",
        "h2": "Función",
        "h3": "Permiso",
        "r1": {
          "c2": "KPIs, alertas, pending seals, live agents"
        },
        "r2": {
          "c2": "Status temps réel de los agentes en mission (GPS, batterie, dernière action)"
        },
        "r3": {
          "c2": "Aprobar o rechazar un seal_proposed"
        },
        "r4": {
          "c2": "Listar reconciliaciones de paiements terreno en espera de validación"
        },
        "r5": {
          "c2": "Validar (o rechazar) la reconciliación de un paiement collected en cash terreno"
        },
        "r6": {
          "c2": "Cron interne — auto-aprueba seals_proposed sans action supervisor > 24h",
          "c3": "Sistema (no human-callable)"
        }
      }
    },
    "s5": {
      "title": "5. Decisión seal/approve: las 4 alternativas del supervisor",
      "intro": "Al examinar un <code>seal_proposed</code>, el supervisor dispone de 4 acciones concretas (implementadas en <code>approve_seal</code>):",
      "l1": "<strong>Aprobar (approved=true)</strong> — el scellement entra en vigor. El comercio queda cerrado oficialmente hasta levée. Owner notificado.",
      "l2": "<strong>Rechazar (approved=false)</strong> — el supervisor estima que el caso no justifica el scellement. Devuelve al agente con notes motivadas. La inspección queda en <code>seal_rejected</code>; el agente puede emitir une nueva MED o cerrar el dossier.",
      "l3": "<strong>Ne rien faire</strong> — si más de 24h passent sin acción, el cron <code>auto-approve-seals</code> aprouve automáticamente (filet de sécurité para évitar el blocage des dossiers).",
      "l4": "<strong>Escalar al director</strong> (informal, hors backend) — para los cas complexes (decisión judicial, ordre ministériel), el supervisor consulte el director avant d'aprouver. La trazabilité se hace via les notes de l'inspection."
    },
    "s6": {
      "title": "6. Validación de la reconciliación de paiements terreno",
      "body": "Cuando un agente collectó un paiement en cash sur le terrain (<code>collect_field_payment</code>), el paiement entra en una cola de reconciliación pour validation par le supervisor. La pantalla <code>/reconcile/supervisor</code> liste los paiements en espera, agrupados por agente, con el importe declarado vs el efectivo presentado. El supervisor verifica los <strong>recibos firmados</strong> del comerçant, recompte el efectivo en présence del agente, valida o rechaza. La trazabilité respecte el lock ordering canónico (commercial_licenses FOR UPDATE → service_payments INSERT) implémenté dans <code>collection_service.py</code>."
    },
    "s7": {
      "title": "7. Protección capture d'écran sobre l'app mobile agente",
      "warn": {
        "title": "FLAG_SECURE activé en los écrans sensibles",
        "body": "La aplicación mobile de los agentes (utilizada para las inspecciones terreno, ver <a href=\"69-trabajo-terreno-oms.html\">página 69</a>) activa <code>FLAG_SECURE</code> sobre Android (et l'équivalent iOS) en tous les écrans sensibles : profil, détail des solicitudes, settings, wizard, app-lock. Ce mécanisme bloque les screenshots et l'enregistrement vidéo de l'écran. Raison : éviter la fuite de données personnelles des commerçants (DIP, NIF, photos d'identité, montants des obligations) si le téléphone d'un agent est compromis ou photographié à l'insu de l'agent. Implémentation : hook <code>useScreenProtection</code> dans <code>packages/mobile/src/core/security/use-screen-protection.ts</code>, base sur <code>expo-screen-capture</code>."
      }
    },
    "s8": {
      "title": "8. Por qué pas de captures dédiées",
      "info": {
        "title": "Réutilisation des écrans agents OMS",
        "body": "El supervisor utilise les mêmes écrans que les agents OMS (page 66) con permissions étendues. Pas de back-office dédié distinct — la différenciation est par permission. Les écrans <em>«Validaciones supervisor»</em>, <em>«Aprobar seals»</em>, <em>«Reconcile pending»</em> ne apparaissent que si le rol contient le permiso correspondant. Las pantallas básicas (dashboard, licences, détail inspection) sont visuellement identiques à celles de la page 66 mais con datos étendus et botones d'acción adicionales."
      }
    },
    "prev": "← Anterior: Supervisor Ayuntamiento+Cámara",
    "next": "Siguiente: Rol Admin →"
  },
    "page81": {
      "html_title": "Rol Admin — Manual Facil",
      "title": "Rol Admin : configuración global de la plataforma",
      "description": "Los administradores son responsables de la configuración técnica y funcional global de Facil. A diferencia de los supervisores (que operan dentro de una entidad), los admin operan a nivel plataforma : RBAC global, catálogo de servicios fiscales, providers de comunicación, configuración del sistema, workflows, traducciones. Esta página da una vista panorámica de las 9 secciones admin disponibles. Cada sección tiene su propia página dedicada (82-89).",
      "s1": {
        "title": "1. Dashboard global admin",
        "body": "La pantalla de inicio del admin reúne los indicadores clave de la plataforma : número de usuarios actifs, número de solicitudes en curso, importes tratados del mes, salud de los providers (verde / naranja / rojo), número de alertas no tratadas, etat de los crons."
      },
      "s2": {
        "title": "2. Las 9 secciones del back-office admin",
        "t": {
          "h1": "Sección",
          "h2": "Contenido",
          "h3": "Página dedicada",
          "r1": {
            "c1": "Usuarios + RBAC",
            "c2": "Gestión de usuarios, asignación de roles, creación de roles personalizados, permisos granulaires (50+ permisos disponibles)",
            "c3": "Página 82"
          },
          "r2": {
            "c1": "Servicios fiscales",
            "c2": "Catálogo de los 850+ servicios, templates de documentos, templates de procédures, tarification",
            "c3": "Página 83"
          },
          "r3": {
            "c1": "Comunicaciones",
            "c2": "5 providers (Email SMTP/SendGrid, SMS Twilio/Africa's Talking, Push FCM/APNs, USSD Getesa/Muni, WhatsApp Business)",
            "c3": "Página 84"
          },
          "r4": {
            "c1": "Empresas",
            "c2": "Validación de nuevas empresas, fusión de duplicados, suspensión administrativa, registro mercantil",
            "c3": "Página 85"
          },
          "r5": {
            "c1": "Config Sistema",
            "c2": "Configuraciones globales (umbrales SLA, tasas BANGE, paramètres email, mode mantenimiento), conexiones BANCO",
            "c3": "Página 86"
          },
          "r6": {
            "c1": "Audit Logs",
            "c2": "Trazabilidad completa (7 colonnes, retention 7 ans, chain_hash, alertes configurables, export RGPD)",
            "c3": "Página 87"
          },
          "r7": {
            "c1": "Traducciones",
            "c2": "Gestión ES/FR/EN — 5.000+ claves UI + 1.100+ entidades, import/export CSV, cache Redis 1h",
            "c3": "Página 88"
          },
          "r8": {
            "c1": "Workflow Designer",
            "c2": "Creación visual de workflows para servicios nuevos, modificación de los existantes, validación par règles métiers",
            "c3": "Página 89"
          },
          "r9": {
            "c1": "Menu Config",
            "c2": "Configuración dinámica de los menús por rol (workflow_menu_mapping + menu_config explicite)",
            "c3": "Página 89 §3"
          }
        }
      },
      "s3": {
        "title": "3. Sépration des pouvoirs : admin vs admin-técnico",
        "body": "En las grandes organizaciones (ministerio DGI, Tesoro), el rol Admin se divide en dos sub-roles para respetar el principio de separación de poderes :",
        "l1": "<strong>Admin funcional</strong> — gestión de los usuarios, servicios, traducciones, audit logs operacionales. No tiene acceso al config sistema, ni a los workflows, ni a los providers.",
        "l2": "<strong>Admin técnico</strong> — config sistema, workflows, providers, monitoring infrastructura. No puede crear/modificar usuarios ni revisar audit logs personales.",
        "body2": "Esta separación evita que una sola persona puede a la vez modificar la configuración técnica y borrar el audit log que prouvería la modificación. Las dos funciones son intencionalmente incompatibles. Solo el director del ministerio puede asignar/retirar los roles Admin."
      },
      "s4": {
        "title": "4. Audit log especial admin : doble registro",
        "warn": {
          "title": "Acciones admin = trazabilidad renforcée",
          "body": "Toda acción admin (creación de un usuario, modificación de un workflow, suppresión de un service, cambio de role) está registrada DOS veces : en el audit log general (página 87) Y en una tabla dedicada <code>admin_actions_log</code> con retención permanente (jamás purgée, contrariamente a los 7 años del log general). Esta redondancia garantiza que las acciones admin queden trazables incluso si una manipulación maliciosa logra borrar el log general."
        }
      },
      "fig1": {
        "alt": "Dashboard admin overview",
        "caption": "Vista global del dashboard admin con todos los KPIs plataforma."
      },
      "fig2": {
        "alt": "Dashboard admin sections",
        "caption": "Acceso a las 9 secciones de configuración admin."
      },
      "prev": "← Anterior: Supervisor Inspecciones",
      "next": "Siguiente: Admin Usuarios + Roles →"
    },
    "page82": {
      "html_title": "Admin Usuarios + RBAC — Manual Facil",
      "title": "Admin Usuarios + RBAC : roles y permisos granulares",
      "description": "El RBAC (Role-Based Access Control) de Facil dispone de 50+ permisos granulares organizados en familias (usuarios, servicios, pagos, comunicaciones, audit, etc.). El admin puede crear roles personalizados combinando permisos según las necesidades específicas de una entidad. Las acciones cubren : crear/modificar/suspender usuarios, atribuir roles (estándar o personalizados), reset MFA, ver el historial de conexiones por usuario.",
      "s1": {
        "title": "1. Las 10 pantallas de gestión RBAC",
        "body": "El módulo RBAC se compone de 10 vistas complementarias que cubren todo el ciclo de vida de los usuarios y de los roles."
      },
      "s2": {
        "title": "2. Roles estándar del sistema",
        "intro": "Facil viene con varios roles preconfigurados que cubren la mayoría de los casos. Los roles personalizados se crean solo para necesidades excepcionales.",
        "t": {
          "h1": "Rol estándar",
          "h2": "Permisos clave",
          "h3": "Modificable",
          "r1": {
            "c2": "Crear solicitudes propias, pagar, ver mis documentos, recibos",
            "c3": "No (sistema)"
          },
          "r2": {
            "c2": "Idéntico citizen + gestión empresas + bundle payment + batch requests",
            "c3": "No (sistema)"
          },
          "r3": {
            "c2": "Acceso multi-clientes, vista consolidada, sin autorizar pagos",
            "c3": "No (sistema)"
          },
          "r4": {
            "c2": "Validación de solicitudes según entidad (CNEDOGE, DGT, etc.)",
            "c3": "Parcial (permisos granulares)"
          },
          "r5": {
            "c2": "Encadrar agentes + tratar escalaciones + KPIs entidad",
            "c3": "Parcial"
          },
          "r6": {
            "c2": "Configuración global plataforma + RBAC",
            "c3": "No (sistema)"
          },
          "r7": {
            "c2": "Config sistema + workflows + providers (sin RBAC ni audit)",
            "c3": "No (sistema)"
          }
        }
      },
      "s3": {
        "title": "3. Familias de permisos (50+ permisos)",
        "intro": "Los permisos están agrupados en 8 familias para facilitar la asignación :",
        "l1": "<strong>users.*</strong> — view, create, update, suspend, delete, view_own, view_team (7 permisos)",
        "l2": "<strong>roles.*</strong> — view, create, update, delete, assign, view_audit (6 permisos)",
        "l3": "<strong>service_requests.*</strong> — view_own, view_team, view_all, lock, approve, reject, escalate, request_documents, assign (9 permisos)",
        "l4": "<strong>payments.*</strong> — view, validate, reconcile, refund, escalate (5 permisos)",
        "l5": "<strong>companies.*</strong> — view, create, verify, suspend, merge_duplicates (5 permisos)",
        "l6": "<strong>config.*</strong> — view, update_communications, update_workflow, update_system, update_translations (5 permisos)",
        "l7": "<strong>audit.*</strong> — view_own, view_team, view_all, export (4 permisos)",
        "l8": "<strong>special.*</strong> — verify_treasury, verify_biometric, ai_agent, field_collection (9 permisos)"
      },
      "s4": {
        "title": "4. Acciones administrativas críticas",
        "warn": {
          "title": "Reset MFA",
          "body": "El admin puede resetear el 2FA de un usuario que ha perdido su dispositivo. Esta acción está logueada de forma especial : la próxima conexión del usuario forzará la reconfiguración del 2FA, con un email + SMS de notificación al usuario para confirmar que el reset es legítimo. Si el usuario no reconoce el reset, debe contactar inmediatamente el soporte."
        },
        "warn2": {
          "title": "Suspensión de cuenta",
          "body": "Una cuenta suspendida no puede acceder a Facil pero sus datos quedan preservados. La suspensión se hace con motivo obligatorio (sospecha de fraude, decisión jerárquica, demanda judicial). El usuario es notificado por email. La reactivación requiere una acción admin explícita."
        }
      },
      "fig0": {
        "alt": "Vista RBAC inicial",
        "caption": "Pantalla principal RBAC con accesos a usuarios, roles, permisos."
      },
      "fig1": {
        "alt": "Lista usuarios",
        "caption": "Lista de usuarios con filtros (rol, entidad, estado)."
      },
      "fig2": {
        "alt": "Detalle usuario",
        "caption": "Ficha detallada de un usuario : datos, roles, sesiones activas, audit."
      },
      "fig3": {
        "alt": "Creación usuario",
        "caption": "Formulario de creación de un nuevo usuario con asignación de rol inicial."
      },
      "fig4": {
        "alt": "Lista roles",
        "caption": "Catálogo de roles estándar y personalizados."
      },
      "fig5": {
        "alt": "Detalle rol con permisos",
        "caption": "Detalle de un rol con su matriz de permisos atribuidos."
      },
      "fig6": {
        "alt": "Creación rol personalizado",
        "caption": "Creación de un rol personalizado : nombre + sélection des permisos."
      },
      "fig7": {
        "alt": "Catálogo de permisos",
        "caption": "Catálogo de los 50+ permisos disponibles agrupados por familia."
      },
      "fig8": {
        "alt": "Asignación permisos a un rol",
        "caption": "Atribución granular : marcar/desmarcar permisos por familia."
      },
      "fig9": {
        "alt": "Audit de cambios RBAC",
        "caption": "Historial RBAC : todos los cambios de roles/permisos con autor."
      },
      "prev": "← Anterior: Rol Admin",
      "next": "Siguiente: Admin Servicios →"
    },
    "page83": {
      "html_title": "Admin Servicios — Manual Facil",
      "title": "Admin Servicios : catálogo de los 873 servicios fiscales",
      "description": "El catálogo de servicios fiscales es el corazón funcional de Facil. 873 servicios actuales, organizados en jerarquía Ministerio → Sector → Categoría → Servicio. Cada servicio tiene su tarificación, sus documentos requeridos, sus procedimientos, sus referencias legales. El admin gestiona el ciclo de vida completo : creación (asistente 7 tabs), modificación, plantillas de documentos/procedimientos, enriquecimiento IA para las descripciones.",
      "s1": {
        "title": "1. Catálogo principal",
        "body": "La pantalla de inicio lista los 873 servicios con búsqueda, filtros (ministerio, sector, tipo, estado), tri por columna. Cada línea : código único, nombre ES/FR/EN, ministerio, tasa, estado (activo, inactivo, borrador, deprecated)."
      },
      "s2": {
        "title": "2. Asistente de creación de servicio (7 tabs)",
        "intro": "Crear un nuevo servicio requiere completar 7 pestañas. El asistente guía el admin paso a paso, con validación cada vez antes de pasar a la siguiente.",
        "t1": {
          "title": "Tab 1 — Información básica"
        },
        "t2": {
          "title": "Tab 2 — Jerarquía"
        },
        "t3": {
          "title": "Tab 3 — Cálculo"
        },
        "t4": {
          "title": "Tab 4 — Validez"
        },
        "t5": {
          "title": "Tab 5 — Legal"
        },
        "t6": {
          "title": "Tab 6 — Asignaciones"
        },
        "t7": {
          "title": "Tab 7 — Avanzado"
        }
      },
      "s3": {
        "title": "3. Gestión de la jerarquía : Ministerios, Sectores, Categorías",
        "intro": "Tres pantallas dedicadas para gestionar los niveles supérieurs de la taxonomía. La jerarquía debe ser configurada ANTES de crear los servicios."
      },
      "s4": {
        "title": "4. Plantillas de documentos",
        "body": "Cada servicio genera un documento oficial (pasaporte, licencia, certificado, recibo). Las plantillas reusables están centralizadas con código, nombre, descripción, validez en meses."
      },
      "s5": {
        "title": "5. Plantillas de procedimientos",
        "body": "Cada procedimiento describe los pasos administrativos a seguir (orden, condiciones, validaciones, agentes implicados). 11 plantillas disponibles, reutilizables para varios servicios similares."
      },
      "s6": {
        "title": "6. Enriquecimiento IA : generación masiva de descripciones",
        "intro": "Para acelerar la documentación de los 873 servicios, Facil propone un módulo IA que genera descripciones ES/FR/EN basadas en los datos estructurados (jerarquía, tarificación, referencia legal). El admin revisa, aprueba o rechaza individualmente cada borrador."
      },
      "fig0": {
        "alt": "Catálogo servicios fiscales 873 entradas",
        "caption": "Catálogo completo de los 873 servicios fiscales con filtros y búsqueda."
      },
      "fig1": {
        "alt": "Crear servicio tab Información básica",
        "caption": "Código único, nombre ES/FR/EN, tipo de servicio."
      },
      "fig2": {
        "alt": "Crear servicio tab Jerarquía",
        "caption": "Asignación a ministerio + sector + categoría."
      },
      "fig3": {
        "alt": "Crear servicio tab Cálculo",
        "caption": "Método de cálculo, tasa de expedición/renovación, soportes adicionales."
      },
      "fig4": {
        "alt": "Crear servicio tab Validez",
        "caption": "Período de validez del documento generado, frecuencia de renovación, penalización por retraso."
      },
      "fig5": {
        "alt": "Crear servicio tab Legal",
        "caption": "Referencia legal (decreto, ley, circular), artículos específicos, fecha de vigencia."
      },
      "fig6": {
        "alt": "Crear servicio tab Asignaciones",
        "caption": "Documentos requeridos del ciudadano + procedimientos administrativos asociados."
      },
      "fig7": {
        "alt": "Crear servicio tab Avanzado",
        "caption": "Prioridad SLA, complejidad estimada, servicio padre (para los servicios dérivés)."
      },
      "fig8": {
        "alt": "Gestión ministerios 21 entradas",
        "caption": "21 ministerios con código y estado."
      },
      "fig9": {
        "alt": "Modal crear ministerio editor enriquecido",
        "caption": "Modal de creación de ministerio con editor enriquecido."
      },
      "fig10": {
        "alt": "Gestión sectores 17 entradas",
        "caption": "17 sectores organizados por ministerio."
      },
      "fig11": {
        "alt": "Modal crear sector con color",
        "caption": "Modal crear sector : código, ministerio, nombre, color."
      },
      "fig12": {
        "alt": "Gestión categorías 100 entradas",
        "caption": "100 categorías de servicios fiscales."
      },
      "fig13": {
        "alt": "Modal crear categoría con tipo",
        "caption": "Modal crear categoría : código, tipo, ministerio, sector."
      },
      "fig14": {
        "alt": "Plantillas documentos lista",
        "caption": "Catálogo de las plantillas de documentos disponibles."
      },
      "fig15": {
        "alt": "Crear plantilla documento",
        "caption": "Crear plantilla : código, nombre, descripción, validez (en meses)."
      },
      "fig16": {
        "alt": "Plantillas procedimientos 11 entradas",
        "caption": "Las 11 plantillas de procedimientos con número de pasos."
      },
      "fig17": {
        "alt": "Crear plantilla procedimiento con pasos",
        "caption": "Crear plantilla : información + sección dedicada a los pasos."
      },
      "fig18": {
        "alt": "IA enriquecimiento Revisión sin borradores",
        "caption": "Pestaña Revisión : lista los borradores en espera de validación."
      },
      "fig19": {
        "alt": "IA enriquecimiento Acciones masivas",
        "caption": "Acciones : generar descripciones en masa, cambiar visibilidad."
      },
      "fig20": {
        "alt": "IA enriquecimiento Ministerios aprobar borradores",
        "caption": "Aprobar/rechazar descripciones generadas para los ministerios."
      },
      "prev": "← Anterior: Admin Usuarios + RBAC",
      "next": "Siguiente: Admin Comunicaciones →"
    },
    "page84": {
      "html_title": "Admin Comunicaciones — Manual Facil",
      "title": "Admin Comunicaciones : 5 canales multi-providers",
      "description": "Facil envía mensajes a sus usuarios por 5 canales : Email, SMS, Push (móvil/web), USSD (operadores telefónicos), WhatsApp Business. Para cada canal, el admin gestiona los providers técnicos (Gmail SMTP, Infobip, FCM/APNs, Getesa/Muni, Meta WhatsApp) y las plantillas de mensajes ES/FR/EN. Los webhooks permiten integrar respuestas entrantes (WhatsApp principalmente).",
      "s1": {
        "title": "1. Plantillas Email",
        "body": "32 plantillas Email gestionadas con variables interpoladas ({nombre}, {número_recibo}, {monto}), asunto, contenido HTML enriquecido, versión texto plano (fallback)."
      },
      "s2": {
        "title": "2. Plantillas SMS",
        "body": "Los SMS están limitados a 160 caracteres por segmento (estándar GSM-7). La interfaz cuenta los segmentos en tiempo real durante la edición, lo que importa porque cada segmento adicional aumenta el coste de envío."
      },
      "s3": {
        "title": "3. Proveedores SMS",
        "body": "Los proveedores SMS son configurables : Infobip (primario internacional), operadores locales (Getesa, Muni para SMS techos prioritarios en GE). Cada proveedor define la URL API, la clave secreta, los límites por minuto, el coste por SMS."
      },
      "s4": {
        "title": "4. Plantillas Push (móvil + web)",
        "body": "12 plantillas push multi-plataforma (iOS, Android, Web). El admin define el título, el cuerpo, el icono, el deep-link (ouvre la app sur la page correspondante), la categoría (estado solicitud, alerta SLA, notificación general)."
      },
      "s5": {
        "title": "5. Configuración USSD",
        "body": "USSD permite a los usuarios acceder a servicios desde un teléfono sin internet (ej. consultar el estado de una solicitud). Dos operadores configurados : Getesa (<code>*123#</code>) y Muni (<code>*456#</code>)."
      },
      "s6": {
        "title": "6. Proveedor WhatsApp Business",
        "body": "WhatsApp Business via Meta API permite enviar notificaciones y recibir mensajes entrantes. La configuración requiere el Phone Number ID, el Business Account ID, y un Verify Token para el webhook entrante."
      },
      "s7": {
        "title": "7. Notificaciones in-app",
        "body": "Aparte de los canales externos, Facil tiene su propio sistema de notificaciones in-app (la campana en la barra superior). Plantillas tipées con prioridad (info/warning/error), tipos (estado solicitud, alerta admin, mensaje sistema)."
      },
      "s8": {
        "title": "8. Webhooks (mensajes entrantes)",
        "body": "Los webhooks permiten a Facil recibir mensajes entrantes (WhatsApp principalmente) y reaccionar : crear tickets de soporte, actualizar el estado de una solicitud, responder automáticamente vía chatbot. El admin configura el endpoint, el timeout, los métodos de autenticación."
      },
      "fig0": {
        "alt": "Plantillas Email lista 32 entradas",
        "caption": "Lista de las 32 plantillas Email con variables, asunto, estado."
      },
      "fig1": {
        "alt": "Plantillas Email predefinidas 8 templates",
        "caption": "8 plantillas predefinidas (bienvenida, alerta SLA, recibo, etc.)."
      },
      "fig2": {
        "alt": "Proveedores Email Gmail SMTP SendGrid",
        "caption": "Proveedores Email : Gmail SMTP (primario) + SendGrid (respaldo)."
      },
      "fig3": {
        "alt": "Plantillas SMS lista con segmentos",
        "caption": "Plantillas SMS con segmentos contados, preview del contenido."
      },
      "fig4": {
        "alt": "Crear plantilla SMS multilingüe",
        "caption": "Crear plantilla SMS : código, categoría, contenido ES/FR/EN."
      },
      "fig5": {
        "alt": "Plantilla SMS inglés con variables segmentos",
        "caption": "Variables interpoladas + indicador de segmentos por lengua."
      },
      "fig6": {
        "alt": "Proveedores SMS Infobip configurado",
        "caption": "Lista proveedores SMS con Infobip configurado."
      },
      "fig7": {
        "alt": "Agregar proveedor SMS URL API clave",
        "caption": "Modal de agregación de un nuevo proveedor SMS."
      },
      "fig8": {
        "alt": "Plantillas Push 12 templates multi-plataforma",
        "caption": "12 plantillas push multi-plataforma (iOS/Android/Web)."
      },
      "fig9": {
        "alt": "Configuración USSD Getesa Muni operadores",
        "caption": "Configuraciones USSD : Getesa y Muni con sus shortcodes."
      },
      "fig10": {
        "alt": "Proveedor WhatsApp Business Meta configurado",
        "caption": "Configuración WhatsApp Business via Meta API."
      },
      "fig11": {
        "alt": "Editar configuración WhatsApp Phone Business ID",
        "caption": "Editar : Phone ID, Business ID, Verify Token."
      },
      "fig12": {
        "alt": "Plantillas notificaciones in-app",
        "caption": "Plantillas notificaciones in-app con tipo/prioridad."
      },
      "fig13": {
        "alt": "Crear notificación información básica multilingüe",
        "caption": "Crear notificación : información básica + multilingüe."
      },
      "fig14": {
        "alt": "Crear notificación contenido variables",
        "caption": "Contenido multilingüe + variables interpoladas."
      },
      "fig15": {
        "alt": "Crear webhook URL endpoint timeout auth",
        "caption": "Crear webhook : URL endpoint, timeout, autenticación."
      },
      "prev": "← Anterior: Admin Servicios",
      "next": "Siguiente: Admin Empresas →"
    },
    "page85": {
      "html_title": "Admin Empresas — Manual Facil",
      "title": "Admin Empresas : gestión global del registro",
      "description": "El admin gestiona el conjunto de las empresas registradas en Facil : validación de nuevos registros (con justificantes legales), fusión de duplicados (mismo NIF declarado varias veces), suspensión administrativa (decisión judicial o sanción), gestión del registro mercantil (en sinergia con la Cámara de Comercio).",
      "s1": {
        "title": "1. Catálogo global de empresas",
        "body": "La pantalla principal lista todas las empresas registradas con filtros : NIF, nombre, estado (verificada, pendiente, suspendida, archivada), ministerio de tutelle, sector económico. Búsqueda directa por NIF o nombre."
      },
      "s2": {
        "title": "2. Ficha detallada de una empresa",
        "body": "Hacer clic en una empresa abre su ficha detallada con todas sus informaciones : datos administrativos, registro mercantil, licencias comerciales, miembros (con sus roles), histórico de declaraciones fiscales, obligaciones pendientes, audit log de las acciones."
      },
      "s3": {
        "title": "3. Validación de nuevos registros",
        "body": "Cuando un nuevo registro de empresa entra en Facil (vía el flujo « Añadir empresa » desde la cuenta de un usuario), entra en estado <em>«verificación pendiente»</em>. El admin (o un delegado de la DGI) revisa los justificantes (acta constitutiva, NIF, certificado registro mercantil, identidad del representante legal) y valida o rechaza con motivo."
      },
      "s4": {
        "title": "4. Detección y fusión de duplicados",
        "body": "Una empresa puede tener varias entradas erroneas (nombre escrito diferentemente, NIF mal capturado). Facil detecta automáticamente los duplicados sospechosos (mismo NIF, o nombres similares, o misma dirección + responsable legal) y propide su fusión. La fusión preserva los datos de la empresa principal y migra los miembros, licencias, declaraciones del duplicado."
      },
      "s5": {
        "title": "5. Suspensión administrativa",
        "body": "El admin puede suspender una empresa en caso de decisión judicial, sanción fiscal mayor o fraude detectado. La suspensión bloquea todas las acciones de la empresa (no puede iniciar solicitudes, no puede pagar) pero preserva los datos."
      },
      "s6": {
        "title": "6. Histórico y archivos",
        "body": "Cada empresa tiene un histórico detallado de todas las acciones administrativas que la conciernen : verificaciones, suspensiones, reactivaciones, fusiones, cambios de propietario. Útil para auditorías ministeriales o para reconstituir la cronología de un caso litigieux."
      },
      "fig0": {
        "alt": "Catálogo empresas vista principal",
        "caption": "Catálogo global con filtros y búsqueda."
      },
      "fig1": {
        "alt": "Catálogo empresas segunda vista",
        "caption": "Vista complementaria con más detalles agregados."
      },
      "fig2": {
        "alt": "Ficha empresa datos administrativos",
        "caption": "Ficha empresa : datos administrativos, NIF, dirección, ministerio tutelle."
      },
      "fig3": {
        "alt": "Ficha empresa licencias miembros",
        "caption": "Licencias activas + miembros con sus roles + histórico fiscal."
      },
      "fig4": {
        "alt": "Cola verificaciones pendientes",
        "caption": "Cola de empresas en verificación pendiente."
      },
      "fig5": {
        "alt": "Validar empresa justificantes",
        "caption": "Validar empresa con justificantes adjuntos."
      },
      "fig6": {
        "alt": "Aprobar empresa modal confirmación",
        "caption": "Modal de aprobación con resumen + firma electrónica admin."
      },
      "fig7": {
        "alt": "Detección duplicados sospechosos",
        "caption": "Lista de duplicados sospechosos detectados automáticamente."
      },
      "fig8": {
        "alt": "Fusión empresas asistente",
        "caption": "Asistente de fusión : empresa principal vs duplicado a integrar."
      },
      "fig9": {
        "alt": "Suspensión empresa motivo",
        "caption": "Suspensión administrativa con motivo obligatorio."
      },
      "fig10": {
        "alt": "Empresa suspendida banner",
        "caption": "Banner « Empresa suspendida » visible para los miembros."
      },
      "fig11": {
        "alt": "Histórico empresa timeline",
        "caption": "Timeline cronológico de todas las acciones admin sobre la empresa."
      },
      "fig12": {
        "alt": "Archivos empresa documentos legales",
        "caption": "Archivos legales asociados : acta, NIF, certificados, decisiones."
      },
      "fig13": {
        "alt": "Exportar histórico empresa PDF",
        "caption": "Exportación PDF del histórico completo para auditoría externa."
      },
      "prev": "← Anterior: Admin Comunicaciones",
      "next": "Siguiente: Admin Config Sistema →"
    },
    "page86": {
      "html_title": "Admin Config Sistema — Manual Facil",
      "title": "Admin Config Sistema : configuración técnica global",
      "description": "La sección Config Sistema reúne las configuraciones técnicas que tocan al funcionamiento profundo de Facil : agentes IA (Gemini contexto + parámetros), centro operativo (monitoring infrastructura), logs sistema (debug, performance, errores), traducciones técnicas (claves no UI), conexiones bancarias (BANCO). Solo el rol Admin técnico tiene acceso a estas pantallas (separación de poderes — ver página 81 §3).",
      "s1": {
        "title": "1. Configuración de los AI Agents",
        "body": "Facil utiliza Gemini 2.0 Flash para varias funcionalidades : asistente IA público (página 55), IA ciudadano conectado (página 29), IA agente (página 60), enriquecimiento de servicios (página 83). El admin técnico configura los parámetros : modelo activo, temperatura, max tokens, contexto sistema por uso, fallback en caso de falla."
      },
      "s2": {
        "title": "2. Centro operativo (monitoring infrastructura)",
        "body": "El Centro Operativo da una vista en tiempo real de la salud de la infraestructura : servidor backend (CPU/RAM/disco), base de datos PostgreSQL (conexiones activas, queries lentas, replicación), Redis (hit rate, memoria), proveedores externos (BANGE, FCM, SMS). Alertas automáticas si un indicador pasa un umbral."
      },
      "s3": {
        "title": "3. Logs sistema (debug + performance + errores)",
        "body": "A diferencia del audit log (página 87, que registra las acciones funcionales), los logs sistema registran los eventos técnicos : queries lentas, errores 500, timeouts, deadlocks PostgreSQL. Filtros por nivel (DEBUG / INFO / WARNING / ERROR / CRITICAL), por componente (auth, payments, ocr, ai), por período."
      },
      "s4": {
        "title": "4. Traducciones técnicas (no UI)",
        "body": "A diferencia de las traducciones UI (página 88), estas traducciones técnicas conciernen los textos generados dinámicamente por el código (mensajes de error sistema, plantillas de emails generados automáticamente con variables, libellés de PDF oficiales). Edición delicada porque algunas variables son indispensables."
      },
      "s5": {
        "title": "5. Configuración bancaria (BANCO)",
        "body": "Las conexiones con los bancos partenaires son configurables : BANGE (principal — Mobile Money), Banco Nacional de Guinea Ecuatorial (transferencias), BGFI (transferencias internacionales). El admin define la URL API, la clave secreta, los certificados TLS, los webhooks de respuesta."
      },
      "s6": {
        "title": "6. Modo de mantenimiento",
        "warn": {
          "title": "Activar el modo mantenimiento",
          "body": "Antes de una migración importante o de una actualización backend, el admin técnico puede activar el modo mantenimiento. Los usuarios ven una página explicativa (« Sistema en mantenimiento, vuelva en X minutos »). Las solicitudes en curso son preservadas; las nuevas son temporalmente bloqueadas. La duración prevista es comunicada por email a todos los usuarios afectados por el modo (típicamente solo los agentes; los ciudadanos pueden generalmente continuar a depositar en cola)."
        }
      },
      "fig0": {
        "alt": "Configuración AI Agents Gemini parámetros",
        "caption": "Configuración de los AI Agents : modelo, temperatura, max tokens, contexto sistema."
      },
      "fig1": {
        "alt": "Centro operativo monitoring infraestructura",
        "caption": "Centro Operativo : estado backend, BD, Redis, proveedores externos."
      },
      "fig2": {
        "alt": "Logs sistema vista principal",
        "caption": "Vista principal de los logs sistema con filtros por nivel."
      },
      "fig3": {
        "alt": "Logs sistema detalle entrada",
        "caption": "Detalle de una entrada log : stack trace, contexto, timestamp."
      },
      "fig4": {
        "alt": "Traducciones técnicas vista principal",
        "caption": "Vista principal de las traducciones técnicas."
      },
      "fig5": {
        "alt": "Traducciones técnicas edición clave",
        "caption": "Edición de una clave técnica con variables interpoladas."
      },
      "fig6": {
        "alt": "Configuración BANCO listo proveedores",
        "caption": "Lista de los proveedores bancarios configurados."
      },
      "fig7": {
        "alt": "Editar conexión bancaria detalle",
        "caption": "Editar conexión bancaria : URL, claves, webhooks, TLS."
      },
      "prev": "← Anterior: Admin Empresas",
      "next": "Siguiente: Audit Logs →"
    },
    "page87": {
      "html_title": "Admin Audit Logs — Manual Facil",
      "title": "Audit Logs : trazabilidad completa y conservación 7 años",
      "description": "Toda acción sensible en Facil (login, decisión agente, modificación de configuración, acceso a datos personales, validación de pago) está registrada en un audit log dedicado. La retención legal es de 7 años (obligación de archivo administrativo en Guinea Ecuatorial) y la integridad está garantizada por una cadena de hash inalterable. Solo el rol Admin tiene acceso completo al log; los supervisores ven los logs de su entidad; los agentes ven sus propios logs.",
      "s1": {
        "title": "1. Schema de las entradas (7 columnas obligatorias)",
        "t": {
          "h1": "Columna",
          "h2": "Tipo",
          "h3": "Descripción",
          "r1": {
            "c3": "Identificador único de la entrada"
          },
          "r2": {
            "c3": "Fecha + hora precisa al milisegundo, en UTC"
          },
          "r3": {
            "c3": "Email del usuario que realizó la acción (o «system» para acciones automáticas)"
          },
          "r4": {
            "c3": "Tipo de acción : login, logout, approve, reject, escalate, role_change, config_update, etc."
          },
          "r5": {
            "c3": "Objeto modificado : service_request, user, payment, role, config_key, etc."
          },
          "r6": {
            "c3": "Snapshot antes y después de la modificación (para acciones de update)"
          },
          "r7": {
            "c3": "Para trazabilidad técnica y detección de uso fraudulento (IP no habitual)"
          }
        }
      },
      "s2": {
        "title": "2. Cadena de hash : integridad infalsificable",
        "body": "Cada entrada del log lleva un campo adicional <code>chain_hash</code> calculado como : <code>SHA-256(prev_chain_hash || row_data)</code>. La primera entrada usa un hash de génesis. Esta cadena garantiza la integridad : si una entrada es modificada o suprimida posteriormente, todas las entradas siguientes tienen un hash incoherente, lo que se detecta automáticamente.",
        "diagram": "\n┌─────────────────────────────────────────────────────────────────┐\n│ Cadena de hash de los audit logs                                │\n├─────────────────────────────────────────────────────────────────┤\n│                                                                 │\n│  Entrada 1 :                                                    │\n│   prev_chain_hash = GENESIS                                     │\n│   chain_hash = SHA256(GENESIS || timestamp:..., actor:..., ...) │\n│                                                                 │\n│  Entrada 2 :                                                    │\n│   prev_chain_hash = chain_hash[1]                                │\n│   chain_hash = SHA256(chain_hash[1] || timestamp:..., ...)      │\n│                                                                 │\n│  Entrada N :                                                    │\n│   prev_chain_hash = chain_hash[N-1]                              │\n│   chain_hash = SHA256(chain_hash[N-1] || timestamp:..., ...)    │\n│                                                                 │\n│  Verificación :                                                  │\n│   • Recalcular toda la cadena desde GENESIS                     │\n│   • Comparar con los chain_hash almacenados                     │\n│   • Discrepancia = entrada manipulada (con índice exacto)       │\n│                                                                 │\n└─────────────────────────────────────────────────────────────────┘\n"
      },
      "s3": {
        "title": "3. Búsqueda y filtrado",
        "intro": "La interfaz admin propone una pantalla de búsqueda con los filtros siguientes :",
        "l1": "<strong>Período</strong> — hoy / esta semana / este mes / personalizado (rango de fechas)",
        "l2": "<strong>Actor</strong> — email exacto o pattern (ej. <code>*@dgi.gov.gq</code>)",
        "l3": "<strong>Acción</strong> — drop-down con todas las acciones disponibles",
        "l4": "<strong>Tipo de entidad</strong> — service_request / user / payment / etc.",
        "l5": "<strong>IP</strong> — dirección exacta o subred CIDR",
        "l6": "<strong>Búsqueda libre</strong> — full-text sobre <code>before</code>/<code>after</code> JSONB (usa GIN index PostgreSQL)"
      },
      "s4": {
        "title": "4. Alertas automáticas configurables",
        "body": "El admin puede definir reglas de alerta sobre patrones detectados en el log. Ejemplos típicos :",
        "t": {
          "h1": "Pattern",
          "h2": "Trigger",
          "h3": "Acción",
          "r1": {
            "c1": "Login fallido repetido",
            "c2": "&gt; 10 fallos en 10 min sobre la misma cuenta",
            "c3": "Bloqueo temporal + email admin"
          },
          "r2": {
            "c1": "Login geo anormal",
            "c2": "IP de otro país que la habitual",
            "c3": "Push usuario + email admin + 2FA forzada"
          },
          "r3": {
            "c1": "Rechazos en bloque",
            "c2": "Un agente rechaza &gt; 10 solicitudes en 1h con el mismo motivo",
            "c3": "Email supervisor para auditoría"
          },
          "r4": {
            "c1": "Importe sospechoso",
            "c2": "Validación de pago &gt; 5M XAF por un mismo agente en una jornada",
            "c3": "Email director Tesoro + obligación reporting hebdomadario"
          },
          "r5": {
            "c1": "Modificación config crítica",
            "c2": "Cambio role admin, modificación workflow_engine, suppression endpoint",
            "c3": "Email todos los admin + log doble (en log + en table dedicada)"
          }
        }
      },
      "s5": {
        "title": "5. Export y conformidad RGPD",
        "body": "Ciudadanos y empresas pueden solicitar (en virtud del derecho de acceso) un export de las acciones que les conciernen. El admin tramita la solicitud desde la pantalla Audit Logs con el filtro <em>«entity_id = [identificador del solicitante]»</em>. El export se genera en formato JSON estructurado + PDF lisible. Plazo máximo: 30 días (obligación legal). El export queda registrado en el log lui-même (méta-action : <code>data_access_request</code>)."
      },
      "s6": {
        "title": "6. Retención : 7 años + archivado",
        "body": "Las entradas activas se mantienen en la BD principal durante 12 meses (acceso rápido para auditoría operacional). Después de 12 meses, las entradas son archivadas en cold storage (Google Cloud Storage, encriptado AES-256, con replicación geográfica). El acceso a los archivos requiere una solicitud al equipo técnico (delay típico : 24-48h). La duración total de retención es de 7 años desde la fecha de la acción. Después de 7 años, las entradas son destruidas con una opération auditable (méta-entry «retention_purge»)."
      },
      "prev": "← Anterior: Config Sistema",
      "next": "Siguiente: Admin Traducciones →"
    },
    "page88": {
      "html_title": "Admin Traducciones — Manual Facil",
      "title": "Admin Traducciones : ES / FR / EN trilingue",
      "description": "Facil es trilingue : español (lengua oficial), francés (segunda lengua), inglés (internacional). El admin gestiona todas las traducciones desde una interfaz dedicada que cubre 4 dominios : ENUMs (estados de workflow, tipos de pago, roles), UI (textos de la app), Forms (etiquetas de formularios), System messages (mensajes de error, notificaciones). Una table separada <code>entity_translations</code> almacena las traducciones de las entidades (ministerios, sectores, servicios) con un 40% de economía de almacenamiento gracias a una estructura key-value.",
      "s1": {
        "title": "1. Las 2 tablas de traducciones",
        "t": {
          "h1": "Tabla",
          "h2": "Contenido",
          "h3": "Volumen estimado",
          "r1": {
            "c2": "ENUMs (estados, roles, tipos), UI (etiquetas, botones, menús), Forms (campos, placeholders, validaciones), System (errores, notificaciones, emails)",
            "c3": "~5.000 claves × 3 lenguas = 15.000 entradas"
          },
          "r2": {
            "c2": "Ministerios (28), sectores (160+), categorías servicios (50+), nombres y descripciones de servicios fiscales (850+)",
            "c3": "~1.100 entidades × 3 lenguas = 3.300 entradas"
          }
        }
      },
      "s2": {
        "title": "2. Interfaz de administración",
        "body": "La pantalla principal lista las claves en una tabla con :",
        "l1": "Filtro por dominio (ENUM / UI / Forms / System / Entity)",
        "l2": "Filtro por estado de traducción (completas / parciales / faltantes)",
        "l3": "Búsqueda libre sobre la clave y los valores",
        "l4": "Edición inline (clic en una celda → editor inline → ENTER para validar)",
        "l5": "Indicador de completitud por lengua (porcentaje ES / FR / EN)"
      },
      "s3": {
        "title": "3. Workflow de traducción",
        "diagram": "\n┌─────────────────────────────────────────────────────────────────────┐\n│ Workflow para añadir / modificar una traducción                     │\n├─────────────────────────────────────────────────────────────────────┤\n│                                                                     │\n│  Caso 1 : nueva clave necesaria (desarrollo de una nueva feature)   │\n│                                                                     │\n│  Desarrollador agrega la clave en el código (Backend o Frontend)     │\n│       │                                                             │\n│       │ Migration alimenta translations con valor ES                  │\n│       │ FR y EN quedan NULL                                          │\n│       ▼                                                             │\n│  Admin Translations : alerta \"claves nuevas FR/EN faltantes\"        │\n│       │                                                             │\n│       │ Admin asigna a un traductor profesional (opción email)       │\n│       │ Traductor entra, llena FR y EN, valida                       │\n│       ▼                                                             │\n│  Sistema : marca FR/EN como completas, cache invalidación auto      │\n│                                                                     │\n│  Caso 2 : corrección de una traducción existente                    │\n│                                                                     │\n│  Usuario reporta error vía soporte (página 29) ou directamente       │\n│       │                                                             │\n│       ▼                                                             │\n│  Admin recibe el report, abre la pantalla translations, busca clave │\n│       │                                                             │\n│       │ Edita el valor, valida                                       │\n│       │ El sistema invalida el cache (TTL Redis = 1h)                │\n│       ▼                                                             │\n│  Usuarios ven la nueva traducción en su próximo refresh             │\n│                                                                     │\n└─────────────────────────────────────────────────────────────────────┘\n"
      },
      "s4": {
        "title": "4. Import / Export CSV",
        "body": "Para grandes lotes de traducción, el admin puede exportar todas las claves no traducidas en un CSV (3 columnas : clave, español, francés/inglés vacío), entregárselo a un prestatario externo, y reimportar el CSV una vez completado. El sistema detecta automáticamente las claves no modificadas y las omite. Conflictos potenciales (clave modificada por dos personas) son señalados antes del commit.",
        "format": "Formato CSV esperado :",
        "example": "\nkey,es,fr,en\n\"common.button.save\",\"Guardar\",\"Enregistrer\",\"Save\"\n\"common.button.cancel\",\"Cancelar\",\"Annuler\",\"Cancel\"\n\"page27.s2.title\",\"Sus empresas\",\"Vos entreprises\",\"Your companies\"\n...\n"
      },
      "s5": {
        "title": "5. Buenas prácticas",
        "tip": {
          "title": "Recomendaciones",
          "l1": "<strong>ES es la lengua de referencia</strong> — toda nueva clave nace en ES, las otras lenguas son traducciones de la ES. Nunca traducir desde el FR/EN porque genera derivas.",
          "l2": "<strong>Términos GE específicos</strong> — XAF, NIF, DIP, Tesoro Público, BANGE Mobile Money, etc. quedan en la lengua original, no traducidos.",
          "l3": "<strong>Espacios y puntuación</strong> — el FR usa una espacio insécable antes de los signos doubles (« : », « ; », « ! », « ? »). El ES y EN no. El sistema valida automáticamente la consistencia.",
          "l4": "<strong>Variables interpoladas</strong> — las variables del tipo <code>{{count}}</code> o <code>{name}</code> deben aparecer en cada lengua. El sistema detecta las variables manquantes.",
          "l5": "<strong>HTML inline</strong> — las claves <code>data-i18n-html</code> pueden contener balises (<code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;a href=\"...\"&gt;</code>). El sistema valida que las balises están bien fermées en cada lengua."
        }
      },
      "s6": {
        "title": "6. Cache Redis : invalidación automática",
        "body": "Las traducciones están cacheadas en Redis con un TTL de 1h (para minimizar las consultas BD en una app a millones de usuarios). Cuando una traducción es modificada vía la UI admin, el sistema invalida automáticamente las claves cache concernidas. La propagación es immediate para los nuevos requêtes; los usuarios con la app abierta ven el cambio en su próximo refresh de la pantalla."
      },
      "prev": "← Anterior: Audit Logs",
      "next": "Siguiente: Workflow + Menu Config →"
    },
    "page89": {
      "html_title": "Admin Workflows + Citas + Entidades — Manual Facil",
      "title": "Configuración Workflows, Citas, Entidades y Menús",
      "description": "Esta sección agrupa la configuración alrededor del flujo operacional de los servicios. Importante : los workflows en Facil son <strong>predefinidos en el código</strong> (no hay designer visuel drag-drop) — 36 workflows cubren todos los casos actuales (pasaportes, residencia, vehículos, etc.). El admin configura aquí los parámetros : tarifas suplementarias, citas (horarios y reglas), entidades administrativas, ciudades y ubicaciones, además del menú dinámico por rol.",
      "s1": {
        "title": "1. Catálogo de los 36 workflows predefinidos",
        "body": "Los workflows están definidos por el código backend (<code>workflow_engine</code>) y representan el ciclo de vida completo de cada tipo de servicio fiscal. El admin los visualiza en lectura sola; las modificaciones requieren un release backend."
      },
      "s2": {
        "title": "2. Configuración de las tarifas suplementarias",
        "body": "Sobre la tarifa de base de un servicio, el admin puede definir suplementos (timbre fiscal, póliza, cédula complementaria). Estos suplementos están atribuidos por workflow."
      },
      "s3": {
        "title": "3. Gestión de las citas (horarios + slots)",
        "intro": "Para los servicios que requieren una cita en persona (CNEDOGE biométrico, DGT examen pratico, Extranjería retiro de carnet), el admin configura los horarios de oficina por entidad + ciudad, define los slots, las fechas bloqueadas (feriados), las reglas de espera (prioridad/workflow)."
      },
      "s4": {
        "title": "4. Entidades administrativas",
        "body": "Las entidades son las 20+ administraciones públicas que operan en Facil : AYUNTAMIENTO, CNEDOGE, DGT, etc. Cada entidad tiene un código, un nombre, un tipo padre (ministerio o municipio), y los workflows que gestiona."
      },
      "s5": {
        "title": "5. Ciudades y ubicaciones",
        "body": "17 ciudades de Guinea Ecuatorial registradas (Bata, Ebebiyín, Malabo, Mongomo, …). Cada ubicación física (oficina, sede) está vinculada a una entidad y a una ciudad con su dirección y mención de sede principal."
      },
      "s6": {
        "title": "6. Configuración dinámica de los menús (Menu Config)",
        "body": "Cada rol tiene su menú propio adaptado a sus permisos. Dos modos de configuración disponibles : <strong>workflow-based</strong> (automático, basado en los <code>workflow_codes</code> de la entidad) o <strong>module-based</strong> (manuel, JSON explícito en <code>roles.menu_config</code>). El admin gestiona el mapping workflow → menu desde la pantalla dedicada."
      },
      "s7": {
        "title": "7. ¿Por qué no hay Workflow Designer drag-drop?",
        "info": {
          "title": "Workflows predefinidos por seguridad",
          "body": "Los workflows en Facil cubren los servicios fiscales oficiales de Guinea Ecuatorial. Una modificación visual ad-hoc desde la UI introduciría riesgos importantes : un workflow mal configurado podría dejar pasar fraudes, perder solicitudes, o generar inconsistencias con la legislación. Por eso, los workflows están definidos por el código (testés, audités, versionados) y solo los parámetros (tarifas, horarios, citas, entidades) son configurables por el admin. Si una nueva ley introduce un nuevo tipo de servicio, el equipo técnico desarrolla el workflow correspondiente y lo despliega con un release."
        }
      },
      "fig0": {
        "alt": "Catálogo 36 workflows agrupados",
        "caption": "36 workflows agrupados por familia (Pasaportes, Residencia, Vehículos, …)."
      },
      "fig1": {
        "alt": "Detalle workflow Solicitud Pasaporte info tarifas docs citas",
        "caption": "Detalle de un workflow («Solicitud de Pasaporte») : info + tarifas + documentos requeridos + citas."
      },
      "fig2": {
        "alt": "Lista suplementos tarifas",
        "caption": "Lista de suplementos tarifas con código, nombre, monto."
      },
      "fig3": {
        "alt": "Crear suplemento código nombre monto",
        "caption": "Crear suplemento : código, nombre, monto XAF, vigencia."
      },
      "fig4": {
        "alt": "Configuración horarios entidad ciudad",
        "caption": "Horarios por entidad + ciudad con duración de slot."
      },
      "fig5": {
        "alt": "Crear horario cita días hora duración",
        "caption": "Crear horario : ciudad, días de la semana, hora inicio/fin, duración slot."
      },
      "fig6": {
        "alt": "Fechas bloqueadas feriados nacionales",
        "caption": "Fechas bloqueadas : feriados nacionales (Año Nuevo, etc.)."
      },
      "fig7": {
        "alt": "Reglas espera días hábiles prioridad",
        "caption": "Reglas de espera : días hábiles por prioridad/workflow."
      },
      "fig8": {
        "alt": "Estadísticas citas KPIs horarios",
        "caption": "Estadísticas citas : KPIs horarios, ubicaciones, capacidad diaria."
      },
      "fig9": {
        "alt": "Desglose por entidad reglas demora",
        "caption": "Desglose por entidad + reglas de demora."
      },
      "fig10": {
        "alt": "Lista entidades 20 administraciones",
        "caption": "Lista de las 20 entidades administrativas registradas."
      },
      "fig11": {
        "alt": "Crear entidad código nombre workflows",
        "caption": "Crear entidad : código, nombre, tipo padre, workflows asignados."
      },
      "fig12": {
        "alt": "Lista 17 ciudades Bata Malabo Mongomo",
        "caption": "17 ciudades con su región (Insular/Continental)."
      },
      "fig13": {
        "alt": "Crear ciudad nombre región capital",
        "caption": "Modal añadir ciudad : nombre, región, capital."
      },
      "fig14": {
        "alt": "34 ubicaciones físicas entidad ciudad",
        "caption": "34 ubicaciones físicas por entidad/ciudad."
      },
      "fig15": {
        "alt": "Crear ubicación ciudad entidad dirección sede",
        "caption": "Modal crear ubicación : ciudad, entidad, dirección, sede principal."
      },
      "fig16": {
        "alt": "Menu config workflow mapping",
        "caption": "Mapping workflow → estructura menu (icono, sub-menus)."
      },
      "fig17": {
        "alt": "Editar mapping workflow menu",
        "caption": "Editar un mapping con pattern workflow + sub-entries."
      },
      "prev": "← Anterior: Admin Traducciones",
      "next": "Volver al inicio →"
    }

  // page52-58, page91-95: por crear

};
