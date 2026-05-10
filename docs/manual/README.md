# Manual de usuario Facil — Guía de redacción

> Este documento está destinado a las personas (humanas o agentes IA) que **redactan o mantienen** el manual de usuario. Para usar el manual como lector, vaya a `index.html`.

---

## 1. Pila técnica

| Componente | Tecnología | Por qué |
|---|---|---|
| **Páginas** | HTML estático | Sin compilación, versionable en Git, durable 10+ años |
| **Estilos** | CSS único `styles.css` | Sistema de diseño compartido con la documentación técnica |
| **i18n** | Sistema `data-i18n` con JS runtime | 3 idiomas (ES/FR/EN) sin compilación, fallback grácil |
| **Búsqueda** | [Pagefind](https://pagefind.app/) | Índice estático multilingüe, sin servidor |
| **Exportar PDF** | Print CSS (`@media print`) + `window.print()` | Cero dependencias, soporte universal navegador |

**Sin** Node, sin npm build, sin React. Solo navegador.

---

## 2. Estructura de archivos

```
docs/manual/
├── index.html                 ← Página de inicio (sumario por persona)
├── styles.css                 ← Hoja de estilos única
├── search.html                ← Página de búsqueda Pagefind
├── 404.html                   ← Error
├── sitemap.xml                ← SEO
├── i18n/
│   ├── i18n.js                ← Runtime (no modificar)
│   ├── messages/{es,fr,en}.js ← Traducciones por idioma
│   └── glossary.md            ← Glosario trilingüe
├── _assets/
│   ├── screenshots/           ← Capturas (organizadas por plataforma/persona)
│   ├── samples/               ← PDF de ejemplo
│   ├── icons/                 ← Logos y iconos
│   ├── diagrams/              ← Diagramas ASCII (cuando no hay captura)
│   └── screenshots-mapping.md ← Mapeo descriptivo de capturas
├── _templates/
│   └── page-template.html     ← Plantilla obligatoria para nuevas páginas
└── pagefind/                  ← Índice de búsqueda (generado en Phase 10)
```

---

## 3. Convención de nombres

### Archivos HTML
Formato: `NN-slug.html`, agrupados por centena:

| Rango | Categoría |
|---|---|
| `00-09` | Introducción y navegación |
| `10-19` | Cuenta y autenticación |
| `20-29` | Ciudadano · Web |
| `30-39` | Ciudadano · Móvil |
| `40-49` | Empresa y contables |
| `50-59` | Páginas públicas (sin sesión) |
| `60-69` | Agentes públicos |
| `70-79` | Supervisores |
| `80-89` | Administradores |
| `90-99` | Anexos |

### Claves i18n
Formato: `namespace.subkey.detail` con namespace por página:

```
common.callout.tip        ← Compartido entre todas las páginas
nav.link.home             ← Navegación
page21.title              ← Título de la página 21
page21.section1.h2        ← H2 de la sección 1
page21.section1.fig1.alt  ← Alt-text de la figura 1 sección 1
glossary.tooltip.NIF      ← Tooltip glosario
```

**Regla absoluta**: una página = un namespace `pageNN.*`. **Nunca** modificar `common.*` o `nav.*` excepto en una PR coordinada.

### Capturas de pantalla
Formato: `_assets/screenshots/{plataforma}/{persona-o-sección}/{slug-descriptivo}.{ext}`

Ejemplos:
- ✅ `_assets/screenshots/mobile/citizen/dashboard-home.jpg`
- ✅ `_assets/screenshots/web/agent-tesoro/validation-dashboard.png`
- ❌ `_assets/screenshots/0.jpg` (sin descripción)

---

## 4. Cómo añadir una página

1. **Copiar la plantilla**: `cp _templates/page-template.html NN-mi-pagina.html`
2. **Reemplazar `__PAGEKEY__`** por la clave (`page21`, `page22`, etc.) en TODO el archivo
3. **Añadir las cadenas de texto**:
   - En `i18n/messages/es.js`, dentro del objeto principal, añadir `pageNN: { ... }`
   - Marcar `// TODO: traducir` en `fr.js` y `en.js` (Phase 9 los rellenará)
4. **Añadir el enlace en sidebar**:
   - Editar la sección apropiada del sidebar en CADA archivo HTML existente
   - O usar el plan de actualización masiva (script futuro)
5. **Añadir el enlace prev/next** en las páginas adyacentes
6. **Probar** abriendo en navegador, verificar que:
   - El texto se renderiza
   - El cambio ES → FR → EN funciona (incluso si FR/EN muestran ES como fallback temporal)
   - Las imágenes se cargan
   - No hay errores en la consola

---

## 5. Estilo de redacción

### Voz
- **Imperativo presente**: "Pulse el botón" / "Cliquez" / "Click"
- **Vouvoiement / Tratamiento formal de cortesía**: "vous" en FR, "usted" en ES, "you" en EN
- **Frases cortas**: 15-20 palabras como máximo idealmente
- **Sin jerga técnica** sin definir antes
- **Voz activa**: "El sistema valida la solicitud" no "La solicitud es validada por el sistema"

### Estructura de página
1. **H1 único** = título
2. **Lead paragraph** = qué cubre la página y por qué
3. **TOC** automático con anclas
4. **H2** por sección principal (max 5-7 por página)
5. **H3** para subsecciones
6. **Listas pas-à-pas** para procedimientos (`<ol class="step-list">`)
7. **Captura ilustrativa** después de cada paso clave o sección
8. **Callout** al final de cada sección (tip / info / warning / danger)
9. **Pagination prev/next** al pie

### Callouts (cajas de información)
| Clase | Cuándo usar | Ejemplo |
|---|---|---|
| `callout-info` | Información complementaria | "Esta acción es opcional" |
| `callout-tip` | Consejo práctico | "Para ahorrar tiempo, use..." |
| `callout-warning` | Aviso importante | "Antes de pulsar, verifique que..." |
| `callout-danger` | Acción irreversible | "La eliminación de la cuenta no puede deshacerse" |
| `callout-success` | Confirmación | "Su solicitud ha sido enviada" |

---

## 6. Funcionalidades sin captura (documentación textual)

Algunas funciones no tienen captura disponible (página `verify`, validación de pago Tesoro, validación pasaporte CNEDOGE, OMS field, etc.). **Documentarlas** mediante:

1. **Tabla de entradas/salidas**: qué proporciona el usuario, qué devuelve el sistema
2. **Diagrama ASCII** del flujo:
   ```
   Usuario → [Escanear QR] → Sistema → [Verificar BD] → ┐
                                                         │
   ┌─────────────── Resultado ────────────────────────┐ │
   │ - Servicio: válido / inválido                    │←┘
   │ - Recibo: emitido el / por                       │
   │ - Licencia: vigente hasta / titular              │
   └──────────────────────────────────────────────────┘
   ```
3. **Tabla de casos**: por cada tipo de input (service_request, receipt, license), qué se muestra
4. **Lista de permisos** requeridos
5. **Mensajes de error** posibles

---

## 7. Pruebas (test fin de page)

Cada página debe pasar:

- [ ] Se abre en navegador sin error de consola
- [ ] Las 3 traducciones funcionan (verificar fr.js + en.js cargan, mostrar fallback ES si vacíos)
- [ ] Todas las imágenes referenciadas existen físicamente
- [ ] La navegación sidebar muestra `active` en el enlace correcto
- [ ] Los enlaces prev/next van a las páginas correctas
- [ ] El botón "Imprimir" produce un PDF legible (test rápido en Chrome)
- [ ] La búsqueda Pagefind indexa los textos (después de Phase 10)
- [ ] No hay `__PAGEKEY__` ni `TODO` ni textos en duro

---

## 8. Despliegue

El manual está bajo `docs/manual/`. Servido vía Firebase Hosting (mismo bucket que la documentación técnica).

**No hay build**: simplemente push a `develop` y los archivos estáticos se sincronizan.

### Regenerar el índice de búsqueda Pagefind

Tras añadir o modificar páginas, regenerar el índice:
```bash
cd C:/taxasge
rm -rf docs/manual/pagefind && npx pagefind --site docs/manual --output-path docs/manual/pagefind
```

Tiempo: ~50ms para 5 páginas, escalable. La primera ejecución descarga `pagefind@1.5.2`.

El dossier `pagefind/` está gitignored : se regenera automáticamente. En CI/CD, añadir un step antes del despliegue Firebase.

### Validar las claves i18n

Después de añadir o modificar una página, verificar la coherencia ES/FR/EN :
```bash
bash docs/manual/tools/check-i18n-keys.sh
```

El script muestra :
- Claves usadas en HTML pero no traducidas en `es.js` (a corregir)
- Claves en `es.js` no usadas en HTML (warnings, generalmente aceptable)
- Cobertura FR/EN como porcentaje de ES

### Sidebar (menú lateral)

⚠ **El sidebar está duplicado en cada página HTML** — copia idéntica desde `index.html` (modificar `class="active"` solo del enlace de la página actual).

Cuando modifique el sidebar (añadir/quitar/reorganizar entradas) :
1. Modifique primero `index.html`
2. Propague la modificación a CADA página HTML (`grep -l 'sidebar-nav' docs/manual/*.html`)

En Phase 10 se podrá generar un script `tools/propagate-sidebar.sh` si la cantidad de páginas lo justifica.

---

## 9. Mantenimiento

- **Cada nueva funcionalidad de la app** debe añadirse al manual (idealmente en la misma PR)
- **Capturas obsoletas** (rediseño UI) deben re-tomarse y reemplazar a las antiguas con el mismo nombre de archivo
- **Errores reportados** → abrir un issue, etiquetar `documentation`
- **Glosario evoluciona**: cualquier nuevo término debe añadirse a `glossary.md` Y a las 3 traducciones

---

## 10. Estado del manual

Ver `.claude/plans/USER_DOCUMENTATION_MASTER_PLAN.md` para el plan completo y el progreso por fase.

| Fase | Estado |
|---|---|
| 0. Preparación | 🟢 En curso |
| 1. Foundation | 🔵 Pendiente |
| 2-8. Contenido | 🔵 Pendiente |
| 9. Traducciones FR/EN | 🔵 Pendiente |
| 10. Pulido | 🔵 Pendiente |
