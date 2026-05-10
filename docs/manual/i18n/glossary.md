# Glosario trilingüe — Manual de usuario Facil

Este glosario define los términos clave utilizados en el manual, en español, francés e inglés.
**Fuente única**: cualquier modificación de un término aquí debe propagarse a las 3 traducciones (`messages/es.js`, `fr.js`, `en.js`) y a la documentación técnica (`docs/documentation/`).

| Término ES | Término FR | Término EN | Definición ES | Notas |
|---|---|---|---|---|
| **Facil** | Facil | Facil | Plataforma digital de la Función Pública en Guinea Ecuatorial | Marca, no traducir |
| **Trámite** | Démarche | Procedure | Procedimiento administrativo (pasaporte, licencia, etc.) | Sinónimos ES: solicitud, gestión |
| **Solicitud** | Demande | Request | Instancia concreta de un trámite iniciado por un usuario | Estado: borrador, enviada, en proceso, validada, rechazada |
| **Servicio fiscal** | Service fiscal | Fiscal service | Procedimiento del catálogo (873 disponibles) | Cada uno tiene tarifa, documentos requeridos, procedimientos |
| **Tasa** | Taxe | Fee | Cantidad a pagar al Estado por un trámite | Calculada según tipo de comercio, zona, etc. |
| **CNEDOGE** | CNEDOGE | CNEDOGE | Centro Nacional de Documentos Generales | Organismo emisor de pasaportes |
| **DGT** | DGT | DGT | Dirección General de Tráfico | Organismo emisor de permisos de conducir |
| **Tesoro Público** | Trésor public | Public Treasury | Organismo central de cobro y validación de pagos | Acrónimo: TESORO |
| **Extranjería** | Extranjería | Extranjería | Servicio de inmigración y permisos de residencia | No traducir oficialmente |
| **Ayuntamiento** | Mairie | Town Hall | Municipalidad emisora de licencias comerciales | Niveles A/B/C/D según zona |
| **Cámara de Comercio** | Chambre de Commerce | Chamber of Commerce | Organismo emisor de cuotas comerciales | Acrónimo: CAMARA_COMERCIO |
| **MIN OMS** | MIN OMS | MIN OMS | Ministerio + Organización Mundial de la Salud (entidad mixta) | Inspecciones sanitarias |
| **DGI** | DGI | DGI | Dirección General de Impuestos | Tributos (IRPF, IVA, IS) |
| **NIF** | NIF | Tax ID | Número de Identificación Fiscal | Identificador único de empresa |
| **Bono BANGE Mobile Money** | Bon BANGE Mobile Money | BANGE Mobile Money voucher | Método de pago móvil del banco BANGE | Para citoyens sin cuenta bancaria |
| **XAF** | XAF | XAF | Franco CFA Central (moneda) | Símbolo monetario oficial Guinea Ecuatorial |
| **2FA / TOTP** | 2FA / TOTP | 2FA / TOTP | Autenticación de dos factores con contraseña temporal | Apps recomendadas: Google Authenticator, Authy |
| **JWT** | JWT | JWT | JSON Web Token (sesión segura) | Acceso 30 min, refresh 30 días |
| **RBAC** | RBAC | RBAC | Control de acceso basado en roles | 47 roles, 337 permisos |
| **OCR** | OCR | OCR | Reconocimiento óptico de caracteres | Extracción automática de datos de documentos |
| **Verify / Verificar** | Vérifier | Verify | Función de validación pública de recibos vía QR | Sin necesidad de iniciar sesión |
| **IRPF** | IRPP | Income tax | Impuesto sobre la renta de las personas físicas | 6 tramos (0% a 35%) |
| **IVA** | TVA | VAT | Impuesto sobre el valor añadido | 15% estándar Guinea Ecuatorial |
| **IS** | IS | Corporate tax | Impuesto de sociedades | 35% tarifa única |
| **Bundle (paiement groupé)** | Paiement groupé | Bundle payment | Pago de múltiples obligaciones en una sola transacción | Reduce comisiones bancarias |
| **Wizard** | Assistant pas-à-pas | Wizard | Asistente de creación de solicitud paso a paso | 6 etapas típicas |
| **Cuenta de usuario** | Compte utilisateur | User account | Identidad personal en Facil | Contiene perfil, sesiones, documentos |
| **Empresa** | Entreprise | Company | Entidad jurídica registrada | Puede tener múltiples miembros con roles distintos |
| **Agente público** | Agent public | Public agent | Funcionario que valida solicitudes en Facil | 47 roles distintos según entidad |
| **Supervisor** | Superviseur | Supervisor | Agente con permisos extendidos sobre su equipo | Gestiona escaladas, reparto, KPI |
| **Administrador** | Administrateur | Administrator | Gestor técnico de la plataforma Facil | Acceso a configuraciones, RBAC, logs |
| **Recibo / comprobante** | Reçu / justificatif | Receipt | Documento PDF generado tras pago validado | Lleva QR de verificación pública |
| **Notificación push** | Notification push | Push notification | Alerta enviada a la aplicación móvil del usuario | Requiere permiso del sistema |
| **Biometría** | Biométrie | Biometrics | Autenticación por huella o reconocimiento facial | Solo móvil |
| **App Lock** | Verrouillage de l'app | App Lock | Bloqueo local de la aplicación con PIN o biometría | Solo móvil |
| **Modo sin conexión** | Mode hors-ligne | Offline mode | Funcionalidades disponibles sin red | Solo móvil — sincroniza al reconectar |

## Notas para traductores

- **No traducir** los acrónimos oficiales (CNEDOGE, DGT, DGI, NIF, JWT, OCR, RBAC).
- **Adaptar culturalmente** los términos genéricos (ej: "town hall" más que "ayuntamiento" en EN).
- **Conservar** en sus 3 idiomas los términos legales con valor jurídico (Tesoro Público, Extranjería).
- En caso de duda, **preferir el término oficial gubernamental** sobre la traducción literal.
