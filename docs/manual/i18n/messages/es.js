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
      "s1": "1. La pantalla de inicio",
      "s2": "2. El carrusel de novedades",
      "s3": "3. Las 4 acciones principales",
      "s4": "4. Onboarding móvil (primera instalación)",
      "s5": "5. Explorar sin cuenta o iniciar sesión",
      "s6": "6. Diferencias Web vs Móvil"
    },
    "s1": {
      "title": "1. La pantalla de inicio",
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
      "title": "2. El carrusel de novedades",
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
      "title": "3. Las 4 acciones principales",
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
      "title": "4. Onboarding móvil (primera instalación)",
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
    "no_capture": "<strong>Esta página no incluye capturas</strong>: la verificación es una función de backend que devuelve datos estructurados según el tipo de identificador. La descripción es por lo tanto textual con diagramas en ASCII y tablas detalladas para cada variante.",
    "toc": {
      "s1": "1. Cómo acceder a la verificación",
      "s2": "2. Flujo de la verificación (diagrama)",
      "s3": "3. Las 3 variantes de verificación",
      "s4": "4. Ejemplos concretos",
      "s5": "5. Seguridad y firma",
      "s6": "6. Mensajes de error posibles"
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
    "s4": {
      "title": "4. Ejemplos concretos",
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
      "title": "5. Seguridad y firma",
      "sec1": "<strong>Token HMAC-SHA256</strong> — el parámetro <code>?t=...</code> es una firma HMAC del identificador. Sin la clave del Tesoro Público, es imposible falsificar.",
      "sec2": "<strong>Sin caducidad por defecto</strong> — los tokens son válidos mientras el documento existe. Para los documentos sensibles (recibos), un token puede ser revocado por un agente.",
      "sec3": "<strong>Datos sensibles protegidos</strong> — el DIP completo, el teléfono, la dirección postal NUNCA se devuelven en la verificación pública. Solo los datos visibles en el documento PDF original se muestran.",
      "sec4": "<strong>Audit log</strong> — todas las verificaciones se registran (IP, fecha, referencia). Útil para detectar fraudes (escaneo masivo).",
      "sec5": "<strong>Rate limiting</strong> — máximo 60 verificaciones / minuto / IP para evitar abusos."
    },
    "s6": {
      "title": "6. Mensajes de error posibles",
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
  }

  // page01, page11-17, page22-29, page31-39, page41-44, page52-58, page61-69, page71-74, page81-89, page91-95: por crear

};
