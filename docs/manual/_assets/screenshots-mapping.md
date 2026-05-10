# Mapeo de capturas de pantalla — Manual de usuario Facil

> **Generado en Phase 0** mediante análisis multimodal de las 295 capturas presentes en `Documentations/Mobile/images/`.
> **Uso**: este documento sirve de referencia para los redactores (technical-writer) en las phases 2-8 que insertan las imágenes en las páginas del manual.

---

## 1. Estructura del directorio destino

```
docs/manual/_assets/screenshots/
├── web/
│   ├── public/                    ← Páginas públicas (sin sesión)
│   ├── citizen/                   ← Dashboard citoyen (workflow_user)
│   ├── business/                  ← Dashboard empresa (workflow_user/Empresas)
│   ├── agent-cnedoge/             ← Validación pasaportes
│   ├── agent-dgt/                 ← Validación licencias conducir (trafico)
│   ├── agent-oms/                 ← Inspecciones OMS
│   ├── agent-tesoro/              ← Validación pagos Tesoro
│   ├── agent-ayuntamiento/        ← Validación licencias comerciales
│   ├── supervisor-tesoro/         ← Supervisor Tesoro
│   ├── supervisor-ayu-camara/     ← Supervisor Ayuntamiento+Cámara
│   └── admin/                     ← Configuración sistema
└── mobile/
    ├── public/                    ← Carrousel inicio + servicios + calc
    ├── auth/                      ← Login + signup
    ├── onboarding/                ← 3 slides primer arranque
    ├── citizen/                   ← Dashboard logged-in
    ├── service/                   ← Wizard solicitudes
    ├── chat/                      ← Asistente IA
    ├── document/                  ← Mis documentos
    ├── empresa/                   ← Mis empresas mobile
    ├── support/                   ← Mis tickets
    ├── guide/                     ← Guía pasos / FAQ / formularios
    └── payment/                   ← PDF recibo (sample)
```

---

## 2. Mapeo MOBILE — Versión FR (24 capturas en `mobile/FR/`)

| Origen | Destino propuesto | Pantalla | Sección manual |
|---|---|---|---|
| `0.jpg` | `mobile/public/home-carousel-1.jpg` | Home pública (slide 1) | page31 |
| `1.jpg` | `mobile/public/home-carousel-2.jpg` | Home pública (slide 2 - banner IA) | page31 |
| `2.jpg` | `mobile/public/services-grid.jpg` | Catálogo servicios (vista grilla) | page51 |
| `3.jpg` | `mobile/public/services-list.jpg` | Catálogo servicios (vista lista) | page51 |
| `4.jpg` | `mobile/public/services-by-org.jpg` | Lista servicios de un ministerio | page51 |
| `5.jpg` | `mobile/service/service-detail.jpg` | Detalle de un servicio (Pasaporte) | page51 |
| `6.jpg` | `mobile/chat/empty-state.jpg` | Asistente IA (pantalla vacía) | page37 |
| `7.jpg` | `mobile/chat/loading.jpg` | Asistente IA (cargando respuesta) | page37 |
| `8.jpg` | `mobile/chat/response.jpg` | Asistente IA (respuesta completa) | page37 |
| `9.jpg` | `mobile/chat/response-scroll.jpg` | Asistente IA (continuación + acciones) | page37 |
| `10.jpg` | `mobile/guide/steps-tab.jpg` | Guía - pestaña Etapas | page56 |
| `11.jpg` | `mobile/guide/faq-tab.jpg` | Guía - pestaña Preguntas (FAQ) | page56 |
| `12.jpg` | `mobile/guide/forms-tab.jpg` | Guía - pestaña Formularios | page56 |
| `13.jpg` | `mobile/auth/account-tab-logged-out.jpg` | Tab cuenta (sin sesión) | page12 |
| `14.jpg` | `mobile/auth/signup-step1.jpg` | Inscripción etapa 1/2 (verificación email) | page11 |
| `15.jpg` | `mobile/auth/login.jpg` | Pantalla de login | page12 |
| `16.jpg` | `mobile/citizen/dashboard-home.jpg` | Dashboard citoyen connecté | page31 |
| `17.jpg` | `mobile/empresa/companies-list.jpg` | Mis empresas (lista) | page36 |
| `18.jpg` | `mobile/empresa/company-detail.jpg` | Detalle empresa (obligaciones) | page36 |
| `19.jpg` | `mobile/public/license-sim-step1.jpg` | Simulador licencias - tipo comercio | page54 |
| `20.jpg` | `mobile/public/license-sim-step2.jpg` | Simulador licencias - zona | page54 |
| `21.jpg` | `mobile/public/license-sim-step3-d.jpg` | Resultado simulador (caso D simple) | page54 |
| `22.jpg` | `mobile/public/license-sim-step3-c.jpg` | Resultado simulador (caso C con Cámara) | page54 |
| `23.jpg` | `mobile/document/my-documents.jpg` | Mis documentos | page35 |

## 3. Mapeo MOBILE — Versión ES (24 + 4 capturas en `mobile/es/`)

| Origen | Destino propuesto | Pantalla | Sección manual |
|---|---|---|---|
| `0.jpg` | `mobile/public/home-carousel-es.jpg` | Home pública (slide 1) ES | page31 |
| `1.jpg` | `mobile/public/services-grid-es.jpg` | Catálogo servicios | page51 |
| `2.jpg` | `mobile/service/service-detail-duplicados.jpg` | Detalle servicio "Duplicados" | page51 |
| `3.jpg` | `mobile/public/license-sim-step1-es.jpg` | Simulador - tipo comercio | page54 |
| `4.jpg` | `mobile/public/license-sim-step2-es.jpg` | Simulador - zona comercial | page54 |
| `5.jpg` | `mobile/public/license-sim-step3-es.jpg` | Resultado simulador | page54 |
| `6.jpg` | `mobile/public/business-directory.jpg` | Directorio empresas | page53 |
| `7.jpg` | `mobile/public/calculator.jpg` | Calculadora impuestos (4 pestañas) | page52 |
| `8.jpg` | `mobile/chat/empty-state-es.jpg` | Asistente IA pantalla vacía | page37 |
| `9.jpg` | `mobile/guide/steps-tab-es.jpg` | Guía - pasos | page56 |
| `10.jpg` | `mobile/guide/forms-tab-es.jpg` | Guía - formularios | page56 |
| `11.jpg` | `mobile/auth/signup-step1-es.jpg` | Inscripción 1/2 | page11 |
| `12.jpg` | `mobile/auth/login-es.jpg` | Pantalla de login | page12 |
| `13.jpg` | `mobile/citizen/dashboard-home-es.jpg` | Dashboard citoyen (5 acciones) | page31 |
| `14.jpg` | `mobile/citizen/dashboard-payments-tab.jpg` | Dashboard - pestaña Pagos | page34 |
| `15.jpg` | `mobile/citizen/my-requests.jpg` | Mis solicitudes (lista) | page33 |
| `16.jpg` | `mobile/service/start-request-categories.jpg` | Iniciar trámite (categorías) | page32 |
| `17.jpg` | `mobile/empresa/companies-list-es.jpg` | Mis empresas | page36 |
| `18.jpg` | `mobile/service/wizard-step2-upload.jpg` | Wizard step 2/6 (subida documento) | page32 |
| `20.jpg` | `mobile/support/my-tickets.jpg` | Mis tickets soporte | page38 |
| `o1.jpg` | `mobile/onboarding/slide-1.jpg` | Onboarding slide 1 (bienvenida) | page31 |
| `o2.jpg` | `mobile/onboarding/slide-2.jpg` | Onboarding slide 2 (IA + seguridad) | page31 |
| `o3.jpg` | `mobile/onboarding/slide-3.jpg` | Onboarding slide 3 (final) | page31 |
| `f2.png` | `mobile/payment/receipt-sample.png` | Recibo de pago PDF generado | page34 |

⚠️ **Bug i18n a señalar en la doc**: las capturas `o1`, `o2`, `o3` se encuentran en el dossier `es/` pero contienen texto en francés. Mencionar este caso en la página `page31` cuando se documente el onboarding.

---

## 4. Mapeo WEB

Los 247 ficheros web ya están bien organizados en `Documentations/Mobile/images/web/`. Se copiarán a `docs/manual/_assets/screenshots/web/{persona}/` conservando los nombres descriptivos existentes.

### 4.1 `web/public/` (17 capturas → `screenshots/web/public/`)
Páginas públicas (homepage, services, calc, directory, license sim, verify) — descripción detallada cuando se redacten las páginas 51-58.

### 4.2 `web/admin/` (89 capturas → `screenshots/web/admin/`)
- `Config/BANCO/` → page86 (configuración bancos)
- `Config/COMMUNICATION/` → page84 (comunicaciones email/SMS/push/USSD/WhatsApp)
- `Config/FLUJO_DE_TRABAJO/` → page89 (configuración flujos)
- `Config/MENU/` → page89 (configuración menus)
- `Config/SISTEMA/` → page86 (configuración sistema)
- `Empresas/` → page85 (empresas admin)
- `RBAC/` → page82 (usuarios y roles)
- `Servicios/` → page83 (catálogo servicios)
- raíz `0.png`, `1.png` → page81 (overview admin)

### 4.3 `web/Agents_Entidades/` (37 capturas → `screenshots/web/agent-*/`)
- `Agent_MIN_OMS/` (10 fichiers : dash, conf, lic, insp, ob) → page66
- `Ayuntamiento&Camara/` (8 fichiers : A1-A4, C1-C4) → page64
- `tesoro/` (9 fichiers : 0-8.png) → page65
- `trafico/` (10 fichiers : 1-10.png) → page63

### 4.4 `web/supervisor_entidades/` (37 capturas → `screenshots/web/supervisor-*/`)
- `ayu-camara/` (10 fichiers) → page73
- `tesoro/` (27 fichiers : 0-26) → page72

### 4.5 `web/workflow_user/` (75 capturas) — IDENTIFIÉ Phase 1 par agent multimodal

**Mapping détaillé** ci-dessous (issu d'agent multimodal lancé en Phase 1 pour préparer Phase 4) :

#### web/citizen/ (racine, 10 PNG) → pages 11-12 (auth) + 21 (dashboard) + 15-16 (perfil)
| Fichier | Écran | Page cible |
|---|---|---|
| `01.png` | Login (email pré-rempli) | page12 (sign in) |
| `1.png` | Login (état vide) | page12 |
| `2.png` | Registro (sélecteur Citoyen/Empresa) | page11 (create account) |
| `3.png` | **Dashboard citoyen Resumen** (stats + acciones req + recientes) | page21 |
| `4.png` | Configuración Seguridad (password + 2FA toggle) | page16 |
| `5.png` | Modal activation 2FA (QR + code manuel) | page14 (2FA) |
| `6.png` | Mi Perfil tab "Informaciones personales" | page15 |
| `7.png` | Mi Perfil tab "Informaciones de la cuenta" | page15 |
| `8.png` | Mi Perfil tab "Notificaciones" (préférences langue + toggles) | page15 ou page28 |
| `9.png` | Mi Perfil tab "Verificación Funcionario" | page15 (avancée) |

#### web/citizen/chat/ (7 PNG) → page 29 (chat asistente)
| Fichier | Écran | Détail |
|---|---|---|
| `1.png` | Chat état initial (4 sugerencias + Mi Cofre Digital) | Welcome |
| `2.png` | Popover "Sugerencias" (icône +) | 9 sugerencias classées |
| `3.png` | Popover "Iniciar un trámite" (fusée) | 6 quick-start workflows |
| `4.png` | Drawer "Historial" (sidebar gauche) | Liste conversations |
| `5.png` | Conversation : statistiques cofre digital | Réponse bot riche |
| `6.png` | Conversation : pagar obligación + loading | Indicateur "Preparando..." |
| `7.png` | Conversation : Apertura Restaurante (paquete fiscal 855k XAF) | Breakdown détaillé |

#### web/citizen/solicitud/ (22 PNG) — **WIZARD COMPLET 10 ÉTAPES** → page 22 (iniciar-tramite-web)
| Fichier | Écran | Étape | Détail clé |
|---|---|---|---|
| `1.png` | Dashboard contexte | (avant wizard) | État vide |
| `2.png` | Sélection servicio | `/service-requests/new` | 6 catégories repliables |
| `3.png` | **Step 1/10** | Tipo de Solicitud | Renovación 25 000 XAF sélectionné |
| `4.png` | **Step 2/10** | Tipo de Solicitante | Residente Extranjero (NIE) |
| `5.png` | **Step 3/10** | Clase(s) de Permiso | Class E sélectionnée |
| `6.png` | **Step 4/10** initial | Documentos Requeridos | 3 zones drag-drop vides |
| `7.png` | **Step 4/10** complet | Documentos OCR extraits | 77/87/100% conf |
| `8.png` | **Step 5/10** | Verificar Datos 1/3 | Datos personales OCR readonly |
| `9.png` | **Step 6/10** | Verificar Datos 2/3 | Datos solicitud (Tipo + Clase) |
| `10.png` | **Step 7/10** | Verificar Datos 3/3 | Certificado actual |
| `11.png` | **Step 8/10** | Cita - Selecciona Ubicación | MALABO II Oficina Principal |
| `12.png` | **Step 8/10** | Cita - Calendario Avril 2026 | Jours surbrillance |
| `13.png` | **Step 8/10** | Cita - Horarios | 28 avril sélectionné |
| `14.png` | **Step 9/10** | Pago - Dinero Móvil | 5 méthodes, +240 input |
| `15.png` | **Step 9/10** | Pago - Efectivo | Select oficina Tesoro |
| `16.png` | **Step 10/10** | Confirmación | Ref CON-2026-00001 + CTAs PDF/Imprimir |
| `17.png` | Détail solicitud post-création | `/service-requests/{id}` | Stepper 88%, Pago=Pendiente |
| `18.png` | Détail solicitud (scroll) | même page | Datos personales avec photo |
| `19.png` | **PDF généré** | `solicitud_CON-2026-00001.pdf` | Photo + datos + cita + pago + QR |
| `20.png` | Page **Verify publique ES** | `/es/verify/CON-2026-00001?t=...` | Page 57 (verify) |
| `21.png` | PDF (zoom) | même PDF | Détail desglose pago |
| `22.png` | Page **Verify publique FR** | `/fr/verify/...` | Page 57 multilangue |

#### web/citizen/documents/ (5 PNG) → page 25 (mis documentos web)
| Fichier | Écran |
|---|---|
| `0.png` | Modal onboarding "Bienvenido a Mis Documentos" |
| `1.png` | Tab "Personales" (16 docs grille + menu contextuel) |
| `2.png` | Tab "Generados" (Recibos, Resúmenes) |
| `3.png` | Tab "Preparación" (checklist préparation trámite) |
| `4.png` | Drawer "Configuración del asistente" IA |

#### web/citizen/notifications/ (6 JPG) → page 28 (notificaciones — emails reçus)
**NB**: ce sont des screenshots Gmail mobile, pas des écrans Facil. Illustrent les emails reçus par le citoyen.
| Fichier | Email | Détail |
|---|---|---|
| `N0.jpg` | Inbox Gmail mobile | 3 emails TaxasGE Platform listés |
| `N1.jpg` | Email "Pago en Efectivo Pendiente" | 4 étapes prochaines |
| `N2.jpg` | Email "Pago en Efectivo Validado" (header vert) | Datos paiement complets |
| `N3.jpg` | Email "Pago Validado" scroll | Lien verify + PJ recibo PDF |
| `N5.jpg` | Email "Solicitud Recibida" | Référence CON-2026-00001 |
| `N6.jpg` | Page web verify recibo (REC-...) | Navigateur tablette mobile |

#### web/citizen/post-validation/ (4 PNG) → page 24 (mis pagos web)
**NB**: état solicitud après validation paiement Efectivo par agent
| Fichier | Écran |
|---|---|
| `1.png` | Détail solicitud Completada (stepper 100% vert) |
| `2.png` | Détail solicitud Completada (scroll) |
| `11.png` | Liste solicitudes (17 lignes) |
| `12.png` | Détail solicitud Enviada (post-pago, pre-validation agent) |

#### web/citizen/support/ (3 PNG) → page 29 (soporte web)
| Fichier | Écran |
|---|---|
| `1.png` | Liste tickets (3 SUP-* + FAQ) |
| `2.png` | Formulaire "Nuevo Ticket" |
| `3.png` | Détail Ticket "Second test" + conversation |

#### web/business/ (16 PNG) → page 27 (mis empresas web) — **À identifier en Phase 4**
Aucune analyse multimodale faite. À déléguer début Phase 4 si nécessaire.

---

## 5. Archivos PDF samples ya copiados

| Origen | Destino | Uso en manual |
|---|---|---|
| `web/public/Facil_Bundle.pdf` | `_assets/samples/facil_bundle_sample.pdf` | Ejemplo de bundle bancario |
| `web/workflow_user/Empresas/solicitud_LIC-2026-00001.pdf` | `_assets/samples/solicitud_LIC-2026-00001.pdf` | Ejemplo solicitud licencia |
| `web/workflow_user/solicitud/solicitud_CON-2026-00001.pdf` | `_assets/samples/solicitud_CON-2026-00001.pdf` | Ejemplo solicitud conducir |
| `web/workflow_user/document_generes/solicitud_CON-2026-00001.pdf` | `_assets/samples/solicitud_CON-2026-00001-generated.pdf` | Documento generado tras validación |

---

## 6. Funciones SIN captura (documentación textual obligatoria)

Estas funciones no tienen captura disponible y deben ser documentadas mediante:
- Tabla input/output
- Diagrama ASCII del flujo
- Lista de permisos requeridos
- Mensajes de error posibles

| Función | Página manual | Razón ausencia captura |
|---|---|---|
| Página Verify pública | page57, page68 | Función backend, sin UI específica capturada |
| Validación pago Tesoro | page68 | Pantalla agente sin captura proporcionada |
| Validación pasaporte CNEDOGE | page62, page68 | Pantalla agente sin captura proporcionada |
| OMS Field Operations (scan/inspect/reconcile) | page69 | App separada (inspector), sin capturas |
| Audit logs admin | page87 | Pantalla técnica sin captura |
| Cálculos RBC (formulas IRPF/IVA/IS) | page52 | Lógica backend, parcialmente visible en `mobile/es/7.jpg` |
| 2FA TOTP setup mobile | page14 | Sin captura del scan QR / código |
| Settings mobile completos | page15, page16, page39 | Capturas parciales |
| Wizard mobile completo (steps 1, 3, 4, 5, 6) | page32 | Solo step 2/6 visible |
| Checkout pago mobile (BANGE/cash/transferencia) | page34 | Sin capturas del flow completo |

**Total**: 10 áreas que requieren documentación textual + diagrama ASCII (cf. CLAUDE.md regla "ne rien inventer" : marcar `[A COMPLÉTER]` con contexto preciso si información insuficiente).

---

## 7. Archivos a IGNORAR (ruido)

| Origen | Razón |
|---|---|
| `Documentations/Mobile/images/Nouveau dossier/` | Fotos de identidad de prueba (Recto/verso/profil), uso desconocido |
| `Documentations/Mobile/images/web/PROJET_CV/` | 5 .md de portfolio personal, fuera de tema |
| `Documentations/Mobile/images/web/workflow_user/data_test/` | Datos de prueba (foto.jpg, permiso.pdf, residencia.jpg), no son capturas |

---

## 8. Estado de la copia

| Sección | Estado | Notas |
|---|---|---|
| Iconos / logos | ✅ Phase 0 | logo.png, icon_facil.png, feature-graphic.png |
| Samples PDF | ✅ Phase 0 | 4 PDFs copiados |
| Mobile FR | ⏳ Phase 0 (script) | 24 archivos a copiar+renombrar |
| Mobile ES | ⏳ Phase 0 (script) | 24+4 archivos a copiar+renombrar |
| Web public | ⏳ Phase 0 (script) | 17 archivos copiados directos |
| Web admin | ⏳ Phase 0 (script) | 89 archivos copiados directos |
| Web Agents_Entidades | ⏳ Phase 0 (script) | 37 archivos copiados directos |
| Web supervisor_entidades | ⏳ Phase 0 (script) | 37 archivos copiados directos |
| Web workflow_user | ⏳ Phase 0 (script) | 75 archivos copiados directos |

Total copia previsto: **~290 imágenes**.
