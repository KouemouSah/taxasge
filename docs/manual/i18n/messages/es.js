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
  }

  // page01, page11-17, page22-29, page31-39, page41-44, page52-58, page61-69, page71-74, page81-89, page91-95: por crear

};
