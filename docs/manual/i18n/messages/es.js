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
      "intro": "Cuando abre <strong>Facil</strong> sin haber iniciado sesión — ya sea desde un navegador en <code>facil.gov.gq</code> o desde la aplicación móvil — accede a la pantalla de bienvenida pública. Esta pantalla está disponible <strong>en español, francés e inglés</strong>: el selector de idioma está en la cabecera (ES / FR / EN).",
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
      "step1": "Abra <strong>facil.gov.gq</strong> en su navegador (versión Web) o la aplicación <strong>Facil</strong> en su teléfono (versión Móvil).",
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
      "url": "URL directa: <code>https://facil.gov.gq/dashboard</code> (redirige al inicio de sesión si no está autenticado)."
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
        "body": "Vaya a <code>https://facil.gov.gq/verify/{REFERENCIA}</code> en su navegador. La <code>{REFERENCIA}</code> es el número del documento (ejemplo: <code>REC-2026-000013</code> para un recibo, <code>CON-2026-00001</code> para una solicitud Conducir). El sistema detecta automáticamente el tipo y muestra la información correspondiente."
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
        "code": "URL : https://facil.gov.gq/verify/REC-2026-000013?t=eyJhbGc...\nGET → 200 OK\nRespuesta:\n{\n  \"tipo\": \"recibo\",\n  \"numero\": \"REC-2026-000013\",\n  \"fecha\": \"2026-04-19T15:07:00\",\n  \"importe_xaf\": 25000,\n  \"metodo\": \"Efectivo\",\n  \"pagador_parcial\": \"libre G***\",\n  \"tramite_ref\": \"CON-2026-00001\",\n  \"entidad\": \"Tesoro Público Malabo II\",\n  \"estado\": \"valido\"\n}"
      },
      "ex2": {
        "title": "Ejemplo 2 — Verificación de una solicitud Conducir",
        "code": "URL : https://facil.gov.gq/es/verify/CON-2026-00001?t=...\nGET → 200 OK\nRespuesta:\n{\n  \"tipo\": \"solicitud\",\n  \"subtipo\": \"conducir_renovacion\",\n  \"numero\": \"CON-2026-00001\",\n  \"estado\": \"Completada\",\n  \"entidad\": \"DGT\",\n  \"tipo_expedicion\": \"RENOVACION\",\n  \"cita\": {\n    \"fecha\": \"2026-04-28\",\n    \"hora\": \"09:00\",\n    \"oficina\": \"MALABO II\"\n  },\n  \"importe_pagado_xaf\": 25000\n}"
      },
      "ex3": {
        "title": "Ejemplo 3 — Token inválido",
        "code": "URL : https://facil.gov.gq/verify/REC-2026-000013  ← sin token\nGET → 403 Forbidden\nRespuesta: { \"error\": \"Token requerido para acceso público\" }"
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
        "step2": "Localice el email de <code>noreply@facil.gov.gq</code> con el asunto «Código de verificación Facil».",
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
        "s6": "6. Problemas frecuentes"
      },
      "s1": {
        "title": "1. Acceder a la pantalla de inicio de sesión",
        "intro": "Desde la pantalla de bienvenida, pulse el botón <strong>«Iniciar sesión»</strong> (azul, en la parte inferior). En la versión Web, también puede usar la URL directa <code>https://facil.gov.gq/login</code>.",
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
      "s6": {
        "title": "6. Problemas frecuentes",
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
      "no_capture": "<strong>Esta página describe el flujo paso a paso</strong> sin capturas — la pantalla cambia poco entre versiones (Web/Móvil) y el flujo es lineal. Use el diagrama ASCII de la sección 2 para visualizar el conjunto.",
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
        "step5": "Aparece un mensaje de confirmación: «Si una cuenta existe con este email, recibirá un enlace en pocos minutos». Por seguridad, el sistema no revela si el email está realmente registrado o no."
      },
      "s2": {
        "title": "2. Flujo completo (diagrama)",
        "diagram": "┌─────────────────┐        ┌──────────────────┐\n│   USUARIO       │        │  FRONTEND FACIL  │\n│ Olvidó MDP      ├───────►│  /forgot-password│\n└─────────────────┘        └────────┬─────────┘\n                                    │ POST {email}\n                                    ▼\n                          ┌─────────────────────┐\n                          │   BACKEND           │\n                          │ 1. Verifica email   │\n                          │    en BD            │\n                          │ 2. Genera token     │\n                          │    (24h validez)    │\n                          │ 3. Envía email      │\n                          │    con enlace       │\n                          └─────────┬───────────┘\n                                    │\n                                    ▼\n                          ┌─────────────────────┐\n                          │  EMAIL ENVIADO      │\n                          │  asunto: Recupere su│\n                          │  contraseña Facil   │\n                          │  link: /reset/{token}│\n                          └─────────┬───────────┘\n                                    │\n                       Usuario abre │ enlace\n                                    ▼\n                          ┌─────────────────────┐\n                          │  /reset/{token}     │\n                          │  Form: nueva contraseña │\n                          │  Form: confirmación │\n                          └─────────┬───────────┘\n                                    │ POST {token, nueva}\n                                    ▼\n                          ┌─────────────────────┐\n                          │   BACKEND           │\n                          │ 1. Verifica token   │\n                          │    válido + no usado│\n                          │ 2. Aplica reglas    │\n                          │    contraseña       │\n                          │ 3. Hash + guarda    │\n                          │    bcrypt 12 rounds │\n                          │ 4. Invalida token   │\n                          │ 5. Cierra sesiones  │\n                          │    activas          │\n                          └─────────┬───────────┘\n                                    │\n                                    ▼\n                          ┌─────────────────────┐\n                          │  ✅ Acceso restaurado│\n                          │  Email confirmación │\n                          │  enviado            │\n                          └─────────────────────┘"
      },
      "s3": {
        "title": "3. Recibir y abrir el email",
        "intro": "El email arriba en su buzón en menos de <strong>2 minutos</strong>. Características:",
        "f1": "<strong>Remitente</strong> : <code>noreply@facil.gov.gq</code>",
        "f2": "<strong>Asunto</strong> : «Recupere su contraseña Facil»",
        "f3": "<strong>Enlace de un solo uso</strong>, válido durante <strong>24 horas</strong>",
        "f4": "<strong>Información de seguridad</strong> : IP del solicitante + navegador (para detectar abusos)",
        "warning": "Si el email no llega después de 5 minutos: (1) revise su carpeta de spam; (2) verifique que el email introducido es correcto; (3) puede solicitar un nuevo enlace 30 segundos después del anterior."
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
          "f2": "<strong>Email</strong> : reemplazado por <code>deleted-XXXXX@facil.gov.gq</code>",
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
    }

    // page22-29, page31-39, page41-44, page52-58, page61-69, page71-74, page81-89, page91-95: por crear

};
