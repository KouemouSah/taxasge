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

### 4.5 `web/workflow_user/` (75 capturas → `screenshots/web/citizen/` o `business/`)
- `Chat/` (7 fichiers : 1-7) → page29 (chat web)
- `Documents/` (5 fichiers : 0-4) → page25 (mis documentos web)
- `Empresas/` (16 fichiers : 1-16) → page27 (mis empresas web)
- `Notification_user/` (6 JPG : N0-N6) → page28 (notificaciones web)
- `Soporte/` (3 fichiers) → page29 (soporte web)
- `user/` (10 fichiers : 01, 1-9) → page21 (dashboard web)
- `solicitud/` (22 fichiers : 1-22) → page22 (iniciar trámite + wizard)
- `después validación pago/` (4 fichiers) → page24 (mis pagos web)

⚠️ **Web `workflow_user/` también requiere identificación multimodal** (similar al mobile) en Phase 4 antes de redactar las páginas 21-29 — agendado para sub-plan Phase 4.

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
