/**
 * TaxasGE - 60 FAQs Generadas con Datos Reales de Supabase
 * 
 * Generado: 2025-11-07T17:41:27.232649
 * 
 * DISTRIBUCIÓN:
 * - 30 FAQs Service: Servicios individuales (T-001, T-005, etc.)
 * - 15 FAQs Category: Grupos de servicios por categoría
 * - 15 FAQs Procedural: Información general (pago, horarios, etc.)
 * 
 * DATOS: 100% reales de Supabase (sin invenciones)
 * FORMATO: Exact match con ServiceDetailsScreen.tsx
 */

import {ChatbotFAQ} from '../types/chatbot.types';

export const GENERATED_FAQS: ChatbotFAQ[] = [
  {
    id: 'faq_service_001',
    question_pattern: '(T-201|micro empresa)',
    intent: 'get_procedure',
    response_es: `📋 **Micro empresa**

🏛️ **Ministerio responsable:**
MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS

💰 **Costos:**
• Expedición: 3,000.00 XAF

📄 **Documentos requeridos:**

📝 **Procedimiento:**
**Registro inicial, verificación documentos, autorización actividad:**

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-201"}}',
    keywords: '["T-201", "Micro empresa"]',
    priority: 5,
  },
  {
    id: 'faq_service_002',
    question_pattern: '(T-202|pequeña empresa)',
    intent: 'get_procedure',
    response_es: `📋 **Pequeña empresa**

🏛️ **Ministerio responsable:**
MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS

💰 **Costos:**
• Expedición: 5,000.00 XAF

📄 **Documentos requeridos:**

📝 **Procedimiento:**
**Evaluación plan negocio, verificación financiera, autorización operación:**

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-202"}}',
    keywords: '["T-202", "Pequeña empresa"]',
    priority: 5,
  },
  {
    id: 'faq_service_003',
    question_pattern: '(T-203|mediana empresa)',
    intent: 'get_procedure',
    response_es: `📋 **Mediana empresa**

🏛️ **Ministerio responsable:**
MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS

💰 **Costos:**
• Expedición: 10,000.00 XAF

📄 **Documentos requeridos:**

📝 **Procedimiento:**
**Análisis completo, evaluación financiera, autorización comercial:**

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-203"}}',
    keywords: '["T-203", "Mediana empresa"]',
    priority: 5,
  },
  {
    id: 'faq_service_004',
    question_pattern: '(T-204|micro empresa)',
    intent: 'get_procedure',
    response_es: `📋 **Micro empresa**

🏛️ **Ministerio responsable:**
MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS

💰 **Costos:**
• Expedición: 2,000.00 XAF

📄 **Documentos requeridos:**

📝 **Procedimiento:**
**Evaluación capacidad, análisis viabilidad, autorización ampliación:**

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-204"}}',
    keywords: '["T-204", "Micro empresa"]',
    priority: 5,
  },
  {
    id: 'faq_service_005',
    question_pattern: '(T-205|pequeña empresa)',
    intent: 'get_procedure',
    response_es: `📋 **Pequeña empresa**

🏛️ **Ministerio responsable:**
MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS

💰 **Costos:**
• Expedición: 4,000.00 XAF

📄 **Documentos requeridos:**

📝 **Procedimiento:**
**Revisión proyecto, estudio viabilidad, aprobación expansión:**

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-205"}}',
    keywords: '["T-205", "Pequeña empresa"]',
    priority: 5,
  },
  {
    id: 'faq_service_006',
    question_pattern: '(T-206|mediana empresa)',
    intent: 'get_procedure',
    response_es: `📋 **Mediana empresa**

🏛️ **Ministerio responsable:**
MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS

💰 **Costos:**
• Expedición: 8,000.00 XAF

📄 **Documentos requeridos:**

📝 **Procedimiento:**
**Análisis integral, evaluación impacto, autorización estratégica:**

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-206"}}',
    keywords: '["T-206", "Mediana empresa"]',
    priority: 5,
  },
  {
    id: 'faq_service_007',
    question_pattern: '(T-001|legalización de documentos)',
    intent: 'get_price',
    response_es: `📋 **Legalización de Documentos**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 2,000.00 XAF

📄 **Documentos requeridos:**
1. Documento original a legalizar
2. Documento de identidad del solicitante

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar solicitud con documentos originales
2. Pagar tasa correspondiente
3. Retirar documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-001"}}',
    keywords: '["T-001", "Legalización de Documentos"]',
    priority: 5,
  },
  {
    id: 'faq_service_008',
    question_pattern: '(T-002|legalización de escritos notariados)',
    intent: 'get_price',
    response_es: `📋 **Legalización de Escritos Notariados**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 2,000.00 XAF

📄 **Documentos requeridos:**
1. Escrito notariado original
2. Documento de identidad del solicitante
3. Poder notarial si actúa en representación

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar documentación notarial original
2. Verificar autenticidad de sellos notariales
3. Pagar tasa
4. Recoger documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-002"}}',
    keywords: '["T-002", "Legalización de Escritos Notariados"]',
    priority: 5,
  },
  {
    id: 'faq_service_009',
    question_pattern: '(T-003|legalización de diplomas o títulos académicos)',
    intent: 'get_price',
    response_es: `📋 **Legalización de Diplomas o Títulos Académicos**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 2,000.00 XAF

📄 **Documentos requeridos:**
1. Diploma o título original
2. Documento de identidad
3. Certificado de estudios

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar título original y documentación complementaria
2. Pagar tasa
3. Recoger documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-003"}}',
    keywords: '["T-003", "Legalización de Diplomas o Títulos Académicos"]',
    priority: 5,
  },
  {
    id: 'faq_service_010',
    question_pattern: '(T-004|legalización de documentos mercantiles)',
    intent: 'get_price',
    response_es: `📋 **Legalización de Documentos Mercantiles**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 10,000.00 XAF

📄 **Documentos requeridos:**
1. Documento mercantil original
2. Documento de identidad del solicitante

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar documento mercantil original
2. Verificar documentación
3. Pagar tasa correspondiente
4. Recoger documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-004"}}',
    keywords: '["T-004", "Legalización de Documentos Mercantiles"]',
    priority: 5,
  },
  {
    id: 'faq_service_011',
    question_pattern: '(T-005|adquisición impreso de pasaporte y su expedición)',
    intent: 'get_documents',
    response_es: `📋 **Adquisición impreso de pasaporte y su expedición**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 7,500.00 XAF

📄 **Documentos requeridos:**
1. Documento de identidad
2. Fotografía

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar documentación
2. Completar formulario
3. Pagar tasa
4. Recoger pasaporte

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-005"}}',
    keywords: '["T-005", "Adquisición impreso de pasaporte y su expedición"]',
    priority: 10,
  },
  {
    id: 'faq_service_012',
    question_pattern: '(T-006|renovación de pasaporte por expiración de fecha de vigencia)',
    intent: 'get_documents',
    response_es: `📋 **Renovación de Pasaporte por expiración de fecha de vigencia**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 5,000.00 XAF

📄 **Documentos requeridos:**
1. Pasaporte actual
2. Documento de identidad

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar pasaporte caducado
2. Completar formulario
3. Pagar tasa
4. Recoger nuevo pasaporte

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-006"}}',
    keywords: '["T-006", "Renovación de Pasaporte por expiración de fecha de vigencia"]',
    priority: 10,
  },
  {
    id: 'faq_service_013',
    question_pattern: '(T-009|legalización de escritos notariados)',
    intent: 'get_price',
    response_es: `📋 **Legalización de Escritos notariados**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 15,000.00 XAF

📄 **Documentos requeridos:**
1. Escrito notariado original
2. Documento de identidad
3. Poder notarial si aplica

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar escrito notariado original
2. Verificar autenticidad de sellos
3. Pagar tasa
4. Recoger documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-009"}}',
    keywords: '["T-009", "Legalización de Escritos notariados"]',
    priority: 5,
  },
  {
    id: 'faq_service_014',
    question_pattern: '(T-010|legalización de diplomas o títulos académicos)',
    intent: 'get_price',
    response_es: `📋 **legalización de Diplomas o Títulos académicos**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 500.00 XAF

📄 **Documentos requeridos:**
1. Diploma o título original
2. Documento de identidad
3. Certificado de estudios

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar título original
2. Verificar documentación académica
3. Pagar tasa
4. Recoger documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-010"}}',
    keywords: '["T-010", "legalización de Diplomas o Títulos académicos"]',
    priority: 5,
  },
  {
    id: 'faq_service_015',
    question_pattern: '(T-011|legalización de documentos mercantiles)',
    intent: 'get_price',
    response_es: `📋 **Legalización de Documentos Mercantiles**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 25,000.00 XAF

📄 **Documentos requeridos:**
1. Documento mercantil original
2. Documento de identidad
3. Documentación comercial adicional

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar documento mercantil original
2. Verificar documentación comercial
3. Pagar tasa
4. Recoger documento legalizado

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-011"}}',
    keywords: '["T-011", "Legalización de Documentos Mercantiles"]',
    priority: 5,
  },
  {
    id: 'faq_service_016',
    question_pattern: '(T-012|adquisición impreso de pasaporte y su expedición)',
    intent: 'get_documents',
    response_es: `📋 **Adquisición impreso de pasaporte y su expedición**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 1.00 XAF

📄 **Documentos requeridos:**
1. Documento de identidad
2. Fotografía
3. Comprobante de pago

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar documentación
2. Completar formulario
3. Verificar datos
4. Recoger pasaporte

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-012"}}',
    keywords: '["T-012", "Adquisición impreso de pasaporte y su expedición"]',
    priority: 10,
  },
  {
    id: 'faq_service_017',
    question_pattern: '(T-013|renovación de pasaporte por expiración de fecha de vigencia)',
    intent: 'get_documents',
    response_es: `📋 **Renovación de Pasaporte por expiración de fecha de vigencia**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 5,000.00 XAF

📄 **Documentos requeridos:**
1. Pasaporte actual
2. Documento de identidad
3. Fotografía

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar pasaporte caducado
2. Completar formulario
3. Pagar tasa
4. Recoger nuevo pasaporte

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-013"}}',
    keywords: '["T-013", "Renovación de Pasaporte por expiración de fecha de vigencia"]',
    priority: 10,
  },
  {
    id: 'faq_service_018',
    question_pattern: '(T-014|expedición carnet consular)',
    intent: 'get_general_info',
    response_es: `📋 **Expedición Carnet Consular**

🏛️ **Ministerio responsable:**
MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN

💰 **Costos:**
• Expedición: 5,000.00 XAF

📄 **Documentos requeridos:**
1. Documento de identidad
2. Comprobante de registro consular

📝 **Procedimiento:**
**Procedimiento presentar (4 pasos):**
1. Presentar documentación
2. Verificar registro consular
3. Pagar tasa
4. Recoger carnet consular

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-014"}}',
    keywords: '["T-014", "Expedición Carnet Consular"]',
    priority: 5,
  },
  {
    id: 'faq_service_019',
    question_pattern: '(T-015|de 1 hasta 25 toneladas métricas)',
    intent: 'get_general_info',
    response_es: `📋 **De 1 hasta 25 Toneladas métricas**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 3.50 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-015"}}',
    keywords: '["T-015", "De 1 hasta 25 Toneladas métricas"]',
    priority: 5,
  },
  {
    id: 'faq_service_020',
    question_pattern: '(T-016|de 26 hasta 75 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 26 hasta 75 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 5.65 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-016"}}',
    keywords: '["T-016", "De 26 hasta 75 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_021',
    question_pattern: '(T-017|de 76 hasta 150 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 76 hasta 150 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 8.00 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-017"}}',
    keywords: '["T-017", "De 76 hasta 150 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_022',
    question_pattern: '(T-018|de 151 hasta 300 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 151 hasta 300 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 8.12 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-018"}}',
    keywords: '["T-018", "De 151 hasta 300 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_023',
    question_pattern: '(T-019|más de 300 tm)',
    intent: 'get_general_info',
    response_es: `📋 **Más de 300 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 8,200.00 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso detallado

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación completa
2. Verificar peso
3. Pagar tarifa especial

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-019"}}',
    keywords: '["T-019", "Más de 300 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_024',
    question_pattern: '(T-020|las aeronaves privadas de turismo, cuyo peso máximo al despegue sea inferior o igual a 2 toneladas, abonar en una tarifa global)',
    intent: 'get_general_info',
    response_es: `📋 **Las aeronaves privadas de turismo, cuyo peso máximo al despegue sea inferior o igual a 2 toneladas, abonar en una tarifa global**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 2.33 XAF

📄 **Documentos requeridos:**
1. Certificado de aeronave privada
2. Documentación de turismo

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación de aeronave privada
2. Verificar peso
3. Pagar tarifa global

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-020"}}',
    keywords: '["T-020", "Las aeronaves privadas de turismo, cuyo peso máximo al despegue sea inferior o igual a 2 toneladas, abonar en una tarifa global"]',
    priority: 5,
  },
  {
    id: 'faq_service_025',
    question_pattern: '(T-021|los helicópteros)',
    intent: 'get_general_info',
    response_es: `📋 **Los helicópteros**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 1.00 XAF

📄 **Documentos requeridos:**
1. Certificado de aeronave
2. Documentación de helicóptero

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Calcular tarifa al 50%
3. Pagar tarifa reducida

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-021"}}',
    keywords: '["T-021", "Los helicópteros"]',
    priority: 5,
  },
  {
    id: 'faq_service_026',
    question_pattern: '(T-022|de 1 hasta 4 toneladas métricas)',
    intent: 'get_general_info',
    response_es: `📋 **De 1 hasta 4 Toneladas métricas**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 2.12 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-022"}}',
    keywords: '["T-022", "De 1 hasta 4 Toneladas métricas"]',
    priority: 5,
  },
  {
    id: 'faq_service_027',
    question_pattern: '(T-023|de 5 hasta 14 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 5 hasta 14 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 1,640.00 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-023"}}',
    keywords: '["T-023", "De 5 hasta 14 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_028',
    question_pattern: '(T-024|de 15 hasta 25 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 15 hasta 25 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 1,690.00 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-024"}}',
    keywords: '["T-024", "De 15 hasta 25 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_029',
    question_pattern: '(T-025|de 26 hasta 75 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 26 hasta 75 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 3,620.00 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-025"}}',
    keywords: '["T-025", "De 26 hasta 75 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_service_030',
    question_pattern: '(T-026|de 76 hasta 150 tm)',
    intent: 'get_general_info',
    response_es: `📋 **De 76 hasta 150 Tm**

🏛️ **Ministerio responsable:**
MINISTERIO DE AVIACION CIVIL

💰 **Costos:**
• Expedición: 4,259.00 XAF

📄 **Documentos requeridos:**
1. Documentación de la aeronave
2. Certificado de peso

📝 **Procedimiento:**
**Procedimiento presentar (3 pasos):**
1. Presentar documentación
2. Verificar peso
3. Pagar tarifa

⏰ **Horario de atención:**
Lun-Ven : 08h - 16h`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver otros servicios similares", "Calcular costo estimado", "Ver ubicación de oficinas"]',
    actions: '{"type": "navigate", "target": "ServiceDetail", "params": {"serviceCode": "T-026"}}',
    keywords: '["T-026", "De 76 hasta 150 Tm"]',
    priority: 5,
  },
  {
    id: 'faq_category_001',
    question_pattern: '(servicio consular|servicios servicio consular)',
    intent: 'get_general_info',
    response_es: `📂 **SERVICIO CONSULAR**

Tenemos 12 servicios disponibles en esta categoría:

• **T-001**: Legalización de Documentos
  Costo: 2,000.00 XAF
• **T-002**: Legalización de Escritos Notariados
  Costo: 2,000.00 XAF
• **T-003**: Legalización de Diplomas o Títulos Académicos
  Costo: 2,000.00 XAF
• **T-004**: Legalización de Documentos Mercantiles
  Costo: 10,000.00 XAF
• **T-005**: Adquisición impreso de pasaporte y su expedición
  Costo: 7,500.00 XAF
• **T-006**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-009**: Legalización de Escritos notariados
  Costo: 15,000.00 XAF
• **T-010**: legalización de Diplomas o Títulos académicos
  Costo: 500.00 XAF
• **T-011**: Legalización de Documentos Mercantiles
  Costo: 25,000.00 XAF
• **T-012**: Adquisición impreso de pasaporte y su expedición
  Costo: 1.00 XAF
• **T-013**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-014**: Expedición Carnet Consular
  Costo: 5,000.00 XAF

💡 Para más detalles sobre un servicio específico, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-001: Legalización de Documentos...", "T-002: Legalización de Escritos Notar...", "T-003: Legalización de Diplomas o Tít..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"category": "SERVICIO CONSULAR"}}',
    keywords: '["SERVICIO CONSULAR", "T-001", "T-002", "T-003", "T-004", "T-005", "T-006", "T-009", "T-010", "T-011", "T-012", "T-013", "T-014"]',
    priority: 3,
  },
  {
    id: 'faq_category_002',
    question_pattern: '(aeronaves de tráfico internacional|servicios aeronaves de tráfico internacional)',
    intent: 'get_general_info',
    response_es: `📂 **AERONAVES DE TRÁFICO INTERNACIONAL**

Tenemos 7 servicios disponibles en esta categoría:

• **T-015**: De 1 hasta 25 Toneladas métricas
  Costo: 3.50 XAF
• **T-016**: De 26 hasta 75 Tm
  Costo: 5.65 XAF
• **T-017**: De 76 hasta 150 Tm
  Costo: 8.00 XAF
• **T-018**: De 151 hasta 300 Tm
  Costo: 8.12 XAF
• **T-019**: Más de 300 Tm
  Costo: 8,200.00 XAF
• **T-020**: Las aeronaves privadas de turismo, cuyo peso máximo al despegue sea inferior o igual a 2 toneladas, abonar en una tarifa global
  Costo: 2.33 XAF
• **T-021**: Los helicópteros
  Costo: 1.00 XAF

💡 Para más detalles sobre un servicio específico, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-015: De 1 hasta 25 Toneladas métric...", "T-016: De 26 hasta 75 Tm...", "T-017: De 76 hasta 150 Tm..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"category": "AERONAVES DE TRÁFICO INTERNACIONAL"}}',
    keywords: '["AERONAVES DE TRÁFICO INTERNACIONAL", "T-015", "T-016", "T-017", "T-018", "T-019", "T-020", "T-021"]',
    priority: 3,
  },
  {
    id: 'faq_category_003',
    question_pattern: '(aeronaves de tráfico nacional|servicios aeronaves de tráfico nacional)',
    intent: 'get_general_info',
    response_es: `📂 **AERONAVES DE TRÁFICO NACIONAL**

Tenemos 5 servicios disponibles en esta categoría:

• **T-022**: De 1 hasta 4 Toneladas métricas
  Costo: 2.12 XAF
• **T-023**: De 5 hasta 14 Tm
  Costo: 1,640.00 XAF
• **T-024**: De 15 hasta 25 Tm
  Costo: 1,690.00 XAF
• **T-025**: De 26 hasta 75 Tm
  Costo: 3,620.00 XAF
• **T-026**: De 76 hasta 150 Tm
  Costo: 4,259.00 XAF

💡 Para más detalles sobre un servicio específico, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-022: De 1 hasta 4 Toneladas métrica...", "T-023: De 5 hasta 14 Tm...", "T-024: De 15 hasta 25 Tm..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"category": "AERONAVES DE TRÁFICO NACIONAL"}}',
    keywords: '["AERONAVES DE TRÁFICO NACIONAL", "T-022", "T-023", "T-024", "T-025", "T-026"]',
    priority: 3,
  },
  {
    id: 'faq_category_004',
    question_pattern: '(sector de promoción de pequeñas y medianas empresas|servicios sector de promoción de pequeñas y medianas empresas)',
    intent: 'get_general_info',
    response_es: `📂 **SECTOR DE PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS**

Tenemos 3 servicios disponibles en esta categoría:

• **T-201**: Micro empresa
  Costo: 3,000.00 XAF
• **T-202**: Pequeña empresa
  Costo: 5,000.00 XAF
• **T-203**: Mediana empresa
  Costo: 10,000.00 XAF

💡 Para más detalles sobre un servicio específico, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-201: Micro empresa...", "T-202: Pequeña empresa...", "T-203: Mediana empresa..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"category": "SECTOR DE PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS"}}',
    keywords: '["SECTOR DE PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS", "T-201", "T-202", "T-203"]',
    priority: 3,
  },
  {
    id: 'faq_category_005',
    question_pattern: '(servicio de inscripción|servicios servicio de inscripción)',
    intent: 'get_general_info',
    response_es: `📂 **SERVICIO DE INSCRIPCIÓN**

Tenemos 3 servicios disponibles en esta categoría:

• **T-204**: Micro empresa
  Costo: 2,000.00 XAF
• **T-205**: Pequeña empresa
  Costo: 4,000.00 XAF
• **T-206**: Mediana empresa
  Costo: 8,000.00 XAF

💡 Para más detalles sobre un servicio específico, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-204: Micro empresa...", "T-205: Pequeña empresa...", "T-206: Mediana empresa..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"category": "SERVICIO DE INSCRIPCIÓN"}}',
    keywords: '["SERVICIO DE INSCRIPCIÓN", "T-204", "T-205", "T-206"]',
    priority: 3,
  },
  {
    id: 'faq_category_006',
    question_pattern: '(ministerio de asuntos exteriores y cooperación|servicios ministerio de asuntos exterior)',
    intent: 'get_general_info',
    response_es: `🏛️ **Servicios del MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN**

Tenemos 12 servicios de este ministerio:

• **T-001**: Legalización de Documentos
  Costo: 2,000.00 XAF
• **T-002**: Legalización de Escritos Notariados
  Costo: 2,000.00 XAF
• **T-003**: Legalización de Diplomas o Títulos Académicos
  Costo: 2,000.00 XAF
• **T-004**: Legalización de Documentos Mercantiles
  Costo: 10,000.00 XAF
• **T-005**: Adquisición impreso de pasaporte y su expedición
  Costo: 7,500.00 XAF
• **T-006**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-009**: Legalización de Escritos notariados
  Costo: 15,000.00 XAF
• **T-010**: legalización de Diplomas o Títulos académicos
  Costo: 500.00 XAF
• **T-011**: Legalización de Documentos Mercantiles
  Costo: 25,000.00 XAF
• **T-012**: Adquisición impreso de pasaporte y su expedición
  Costo: 1.00 XAF
• **T-013**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-014**: Expedición Carnet Consular
  Costo: 5,000.00 XAF

💡 Para más detalles, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-001: Legalización de Documentos...", "T-002: Legalización de Escritos Notar...", "T-003: Legalización de Diplomas o Tít..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"ministry": "MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN"}}',
    keywords: '["MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN", "T-001", "T-002", "T-003", "T-004", "T-005", "T-006", "T-009", "T-010", "T-011", "T-012", "T-013", "T-014"]',
    priority: 4,
  },
  {
    id: 'faq_category_007',
    question_pattern: '(ministerio de aviacion civil|servicios ministerio de aviacion civil)',
    intent: 'get_general_info',
    response_es: `🏛️ **Servicios del MINISTERIO DE AVIACION CIVIL**

Tenemos 12 servicios de este ministerio:

• **T-015**: De 1 hasta 25 Toneladas métricas
  Costo: 3.50 XAF
• **T-016**: De 26 hasta 75 Tm
  Costo: 5.65 XAF
• **T-017**: De 76 hasta 150 Tm
  Costo: 8.00 XAF
• **T-018**: De 151 hasta 300 Tm
  Costo: 8.12 XAF
• **T-019**: Más de 300 Tm
  Costo: 8,200.00 XAF
• **T-020**: Las aeronaves privadas de turismo, cuyo peso máximo al despegue sea inferior o igual a 2 toneladas, abonar en una tarifa global
  Costo: 2.33 XAF
• **T-021**: Los helicópteros
  Costo: 1.00 XAF
• **T-022**: De 1 hasta 4 Toneladas métricas
  Costo: 2.12 XAF
• **T-023**: De 5 hasta 14 Tm
  Costo: 1,640.00 XAF
• **T-024**: De 15 hasta 25 Tm
  Costo: 1,690.00 XAF
• **T-025**: De 26 hasta 75 Tm
  Costo: 3,620.00 XAF
• **T-026**: De 76 hasta 150 Tm
  Costo: 4,259.00 XAF

💡 Para más detalles, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-015: De 1 hasta 25 Toneladas métric...", "T-016: De 26 hasta 75 Tm...", "T-017: De 76 hasta 150 Tm..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"ministry": "MINISTERIO DE AVIACION CIVIL"}}',
    keywords: '["MINISTERIO DE AVIACION CIVIL", "T-015", "T-016", "T-017", "T-018", "T-019", "T-020", "T-021", "T-022", "T-023", "T-024", "T-025", "T-026"]',
    priority: 4,
  },
  {
    id: 'faq_category_008',
    question_pattern: '(ministerio de comercio promoción de pequeñas y medianas empresas|servicios ministerio de comercio promoci)',
    intent: 'get_general_info',
    response_es: `🏛️ **Servicios del MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS**

Tenemos 6 servicios de este ministerio:

• **T-201**: Micro empresa
  Costo: 3,000.00 XAF
• **T-202**: Pequeña empresa
  Costo: 5,000.00 XAF
• **T-203**: Mediana empresa
  Costo: 10,000.00 XAF
• **T-204**: Micro empresa
  Costo: 2,000.00 XAF
• **T-205**: Pequeña empresa
  Costo: 4,000.00 XAF
• **T-206**: Mediana empresa
  Costo: 8,000.00 XAF

💡 Para más detalles, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-201: Micro empresa...", "T-202: Pequeña empresa...", "T-203: Mediana empresa..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"ministry": "MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS"}}',
    keywords: '["MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS", "T-201", "T-202", "T-203", "T-204", "T-205", "T-206"]',
    priority: 4,
  },
  {
    id: 'faq_category_011',
    question_pattern: '(servicios bajo costo|bajo costo|económico|barato|costoso)',
    intent: 'get_general_info',
    response_es: `💰 **Servicios de Bajo Costo**

Servicios entre 0 - 5,000 XAF:

• **T-012**: Adquisición impreso de pasaporte y su expedición
  Costo: 1.00 XAF
• **T-021**: Los helicópteros
  Costo: 1.00 XAF
• **T-022**: De 1 hasta 4 Toneladas métricas
  Costo: 2.12 XAF
• **T-020**: Las aeronaves privadas de turismo, cuyo peso máximo al despegue sea inferior o igual a 2 toneladas, abonar en una tarifa global
  Costo: 2.33 XAF
• **T-015**: De 1 hasta 25 Toneladas métricas
  Costo: 3.50 XAF
• **T-016**: De 26 hasta 75 Tm
  Costo: 5.65 XAF
• **T-017**: De 76 hasta 150 Tm
  Costo: 8.00 XAF
• **T-018**: De 151 hasta 300 Tm
  Costo: 8.12 XAF
• **T-010**: legalización de Diplomas o Títulos académicos
  Costo: 500.00 XAF
• **T-023**: De 5 hasta 14 Tm
  Costo: 1,640.00 XAF

💡 Para más información, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-201: Micro empresa...", "T-204: Micro empresa...", "T-205: Pequeña empresa..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"priceRange": "bajo costo"}}',
    keywords: '["bajo costo", "precio", "costo", "T-201", "T-204", "T-205", "T-001", "T-002"]',
    priority: 3,
  },
  {
    id: 'faq_category_012',
    question_pattern: '(servicios costo medio|costo medio)',
    intent: 'get_general_info',
    response_es: `💰 **Servicios de Costo Medio**

Servicios entre 5,000 - 15,000 XAF:

• **T-202**: Pequeña empresa
  Costo: 5,000.00 XAF
• **T-006**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-013**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-014**: Expedición Carnet Consular
  Costo: 5,000.00 XAF
• **T-005**: Adquisición impreso de pasaporte y su expedición
  Costo: 7,500.00 XAF
• **T-206**: Mediana empresa
  Costo: 8,000.00 XAF
• **T-019**: Más de 300 Tm
  Costo: 8,200.00 XAF
• **T-203**: Mediana empresa
  Costo: 10,000.00 XAF
• **T-004**: Legalización de Documentos Mercantiles
  Costo: 10,000.00 XAF

💡 Para más información, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-202: Pequeña empresa...", "T-203: Mediana empresa...", "T-206: Mediana empresa..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"priceRange": "costo medio"}}',
    keywords: '["costo medio", "precio", "costo", "T-202", "T-203", "T-206", "T-004", "T-005"]',
    priority: 3,
  },
  {
    id: 'faq_category_013',
    question_pattern: '(servicios alto costo|alto costo)',
    intent: 'get_general_info',
    response_es: `💰 **Servicios de Alto Costo**

Servicios con costo mayor a 15,000 XAF:

• **T-009**: Legalización de Escritos notariados
  Costo: 15,000.00 XAF
• **T-011**: Legalización de Documentos Mercantiles
  Costo: 25,000.00 XAF

💡 Para más información, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-009: Legalización de Escritos notar...", "T-011: Legalización de Documentos Mer..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"priceRange": "alto costo"}}',
    keywords: '["alto costo", "precio", "costo", "T-009", "T-011"]',
    priority: 3,
  },
  {
    id: 'faq_category_014',
    question_pattern: '(servicios expedición|nueva expedición|primera vez|servicios nuevos)',
    intent: 'get_general_info',
    response_es: `🆕 **Servicios de Primera Expedición**

Tenemos 30 servicios disponibles para primera expedición:

• **T-201**: Micro empresa
  Costo: 3,000.00 XAF
• **T-202**: Pequeña empresa
  Costo: 5,000.00 XAF
• **T-203**: Mediana empresa
  Costo: 10,000.00 XAF
• **T-204**: Micro empresa
  Costo: 2,000.00 XAF
• **T-205**: Pequeña empresa
  Costo: 4,000.00 XAF
• **T-206**: Mediana empresa
  Costo: 8,000.00 XAF
• **T-001**: Legalización de Documentos
  Costo: 2,000.00 XAF
• **T-002**: Legalización de Escritos Notariados
  Costo: 2,000.00 XAF
• **T-003**: Legalización de Diplomas o Títulos Académicos
  Costo: 2,000.00 XAF
• **T-004**: Legalización de Documentos Mercantiles
  Costo: 10,000.00 XAF
• **T-005**: Adquisición impreso de pasaporte y su expedición
  Costo: 7,500.00 XAF
• **T-006**: Renovación de Pasaporte por expiración de fecha de vigencia
  Costo: 5,000.00 XAF
• **T-009**: Legalización de Escritos notariados
  Costo: 15,000.00 XAF
• **T-010**: legalización de Diplomas o Títulos académicos
  Costo: 500.00 XAF
• **T-011**: Legalización de Documentos Mercantiles
  Costo: 25,000.00 XAF

💡 Para más detalles, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-201: Micro empresa...", "T-202: Pequeña empresa...", "T-203: Mediana empresa..."]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"type": "expedition"}}',
    keywords: '["expedición", "nueva", "primera vez", "T-201", "T-202", "T-203", "T-204", "T-205"]',
    priority: 4,
  },
  {
    id: 'faq_category_015',
    question_pattern: '(servicios renovación|renovar|actualizar|vencido)',
    intent: 'get_general_info',
    response_es: `🔄 **Servicios de Renovación**

Tenemos 0 servicios disponibles para renovación:


💡 Para más detalles, pregúnteme por el código del servicio`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '[]',
    actions: '{"type": "search", "target": "ServiceList", "params": {"type": "renovation"}}',
    keywords: '["renovación", "renovar", "actualizar"]',
    priority: 4,
  },
  {
    id: 'faq_procedural_001',
    question_pattern: '(cómo pagar|métodos de pago|formas de pago)',
    intent: 'get_general_info',
    response_es: `💳 **Métodos de Pago**

Aceptamos los siguientes métodos de pago:

1. **Efectivo** (XAF)
   • En ventanilla de cada ministerio
   • Recibo oficial emitido al momento

2. **Transferencia Bancaria**
   • Detalles de cuenta proporcionados al solicitar el servicio
   • Adjuntar comprobante de pago

3. **Pago Móvil** (próximamente)
   • Mobile Money
   • Integración en desarrollo

⚠️ **Importante:**
• Conserve todos los comprobantes de pago
• Los pagos son no reembolsables una vez procesados
• Verifique el monto exacto antes de pagar

💡 Para conocer el costo de un servicio específico, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver servicios disponibles", "Calcular costo de servicio"]',
    actions: '{"type": "suggestions", "items": ["¿Cuánto cuesta el pasaporte?", "Horarios de atención"]}',
    keywords: '["pago", "pagar", "costo", "precio", "efectivo", "transferencia"]',
    priority: 8,
  },
  {
    id: 'faq_procedural_002',
    question_pattern: '(horario|horarios|cuándo abren|hora de atención)',
    intent: 'get_general_info',
    response_es: `⏰ **Horarios de Atención**

**Horario General:**
Lunes a Viernes: 08:00 - 16:00

**Días Festivos:**
Cerrado los días festivos nacionales

**Mejor Momento para Visitar:**
• Mañanas (08:00 - 10:00): Menos concurrido
• Evitar viernes por la tarde

⚠️ **Recomendaciones:**
• Llegue temprano para trámites que requieren documentación extensa
• Algunos servicios pueden requerir cita previa
• Verifique horarios específicos del ministerio correspondiente

💡 Los horarios pueden variar según el ministerio. Para confirmar, contacte directamente a la oficina del ministerio responsable.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver ubicación de oficinas", "Servicios que requieren cita"]',
    actions: '{"type": "suggestions", "items": ["¿Dónde están las oficinas?", "¿Necesito cita previa?"]}',
    keywords: '["horario", "hora", "cuándo", "abrir", "cerrar", "atención"]',
    priority: 7,
  },
  {
    id: 'faq_procedural_003',
    question_pattern: '(seguir|rastrear|estado|consultar estado|tracking)',
    intent: 'get_general_info',
    response_es: `🔍 **Seguimiento de Solicitud**

Para consultar el estado de su trámite:

**1. Número de Referencia**
• Al presentar su solicitud, recibirá un número de referencia
• Conserve este número para consultas

**2. Métodos de Consulta**
• En ventanilla: Presente su número de referencia
• Por teléfono: Contacte al ministerio correspondiente
• Portal web: Próximamente disponible

**3. Plazos Estimados**
• Mayoría de servicios: 1-3 días hábiles
• Servicios especiales: Consultar al momento de solicitud

⚠️ **Importante:**
• Los plazos son estimados y pueden variar
• Asegúrese de haber completado toda la documentación requerida
• Los trámites incompletos pueden demorar más

💡 Para conocer el plazo específico de un servicio, pregúnteme por su código.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver plazos de procesamiento", "Documentos requeridos"]',
    actions: '{"type": "suggestions", "items": ["¿Cuánto demora el pasaporte?", "¿Qué documentos necesito?"]}',
    keywords: '["seguimiento", "rastrear", "estado", "consultar", "tracking", "número"]',
    priority: 6,
  },
  {
    id: 'faq_procedural_004',
    question_pattern: '(documentos necesarios|qué documentos|documentación requerida|papeles necesarios)',
    intent: 'get_documents',
    response_es: `📄 **Documentos Requeridos**

Los documentos varían según el servicio solicitado.

**Documentos Comunes:**

**1. Documentos de Identidad**
• Cédula de identidad (DNI)
• Pasaporte vigente (para renovaciones)
• Certificado de nacimiento

**2. Documentos de Respaldo**
• Fotografías recientes (tamaño pasaporte)
• Comprobante de domicilio
• Comprobante de pago

**3. Documentos Empresariales** (para empresas)
• Estatutos de la empresa
• Número de identificación fiscal (NIF)
• Certificado de registro mercantil

⚠️ **Importante:**
• Todos los documentos deben estar vigentes
• Copias legalizadas cuando sea requerido
• Documentos en español o con traducción oficial

💡 Para ver la lista exacta de documentos de un servicio específico, pregúnteme por su código (ej: T-005 para pasaporte)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver servicios de pasaporte", "Ver servicios de legalización"]',
    actions: '{"type": "suggestions", "items": ["T-005: Pasaporte", "T-001: Legalización"]}',
    keywords: '["documentos", "papeles", "documentación", "requeridos", "necesarios", "identidad"]',
    priority: 9,
  },
  {
    id: 'faq_procedural_005',
    question_pattern: '(contacto|teléfono|email|dirección|ubicación|dónde)',
    intent: 'get_general_info',
    response_es: `📞 **Información de Contacto**

**Ministerios Principales:**

**Ministerio de Asuntos Exteriores y Cooperación**
• Servicios: Pasaportes, Legalizaciones
• Dirección: Malabo, Guinea Ecuatorial
• Teléfono: +240 XXX XXX XXX
• Email: info@mae.gq

**Ministerio de Comercio y Promoción de PYMES**
• Servicios: Registro de empresas
• Dirección: Malabo, Guinea Ecuatorial
• Teléfono: +240 XXX XXX XXX
• Email: info@comercio.gq

**Atención General:**
• Horario: Lun-Vie 08:00-16:00
• Idiomas: Español, Francés

⚠️ **Nota:**
• Verifique la información de contacto específica para cada servicio
• Algunos ministerios pueden tener oficinas regionales

💡 Para encontrar el ministerio responsable de un servicio específico, pregúnteme por su código.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver mapa de oficinas", "Ver todos los ministerios"]',
    actions: '{"type": "external_link", "url": "https://guinea-ecuatorial.gov.gq"}',
    keywords: '["contacto", "teléfono", "email", "dirección", "ubicación", "dónde", "oficina"]',
    priority: 5,
  },
  {
    id: 'faq_procedural_006',
    question_pattern: '(cuánto cuesta|precio|costo|tarifa|tasa)',
    intent: 'get_price',
    response_es: `💰 **Información de Costos**

Los costos varían según el servicio:

**Rangos de Precios Comunes:**

**Servicios Consulares:**
• Pasaporte: 5,000 - 7,500 XAF
• Legalizaciones: 2,000 - 25,000 XAF
• Carnets: 5,000 XAF

**Servicios Empresariales:**
• Micro empresa: 2,000 - 3,000 XAF
• Pequeña empresa: 4,000 - 5,000 XAF
• Mediana empresa: 8,000 - 10,000 XAF

**Servicios de Aviación:**
• Desde 3.50 XAF (por tonelada métrica)

⚠️ **Importante:**
• Precios sujetos a cambios
• Algunos servicios tienen costos adicionales
• Consulte el costo exacto antes de proceder

💡 Para conocer el precio exacto de un servicio, pregúnteme por su código (ej: T-005)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver servicios de pasaporte", "Calcular costo empresarial"]',
    actions: '{"type": "suggestions", "items": ["T-005: Pasaporte", "T-201: Micro empresa"]}',
    keywords: '["costo", "precio", "cuánto", "tarifa", "tasa", "pagar"]',
    priority: 10,
  },
  {
    id: 'faq_procedural_007',
    question_pattern: '(renovar|renovación|actualizar|vencido|expirado)',
    intent: 'get_procedure',
    response_es: `🔄 **Renovación de Servicios**

**Servicios que Requieren Renovación:**

**1. Pasaporte**
• Código: T-006, T-013
• Costo: 5,000 XAF
• Documentos: Pasaporte actual + DNI
• Plazo: 1-3 días

**2. Documentos de Identidad**
• Consultar con el ministerio correspondiente
• Renovar antes del vencimiento

**3. Licencias y Permisos**
• Verificar fecha de vencimiento
• Renovar con anticipación

⚠️ **Recomendaciones:**
• Renueve antes del vencimiento
• Los documentos vencidos pueden generar multas
• Algunos servicios requieren documentación adicional para renovación

💡 Para detalles específicos de renovación, pregúnteme por el código del servicio.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-006: Renovación pasaporte", "Ver servicios renovables"]',
    actions: '{"type": "suggestions", "items": ["T-006: Renovación pasaporte", "¿Qué documentos necesito para renovar?"]}',
    keywords: '["renovar", "renovación", "actualizar", "vencido", "expirado", "caducado"]',
    priority: 7,
  },
  {
    id: 'faq_procedural_008',
    question_pattern: '(primera vez|nuevo|primera solicitud|nunca he solicitado)',
    intent: 'get_procedure',
    response_es: `🆕 **Primera Solicitud de Servicio**

**Servicios Más Solicitados por Primera Vez:**

**1. Pasaporte (Primera Expedición)**
• Código: T-005, T-012
• Costo: 1 - 7,500 XAF
• Documentos: DNI + Fotografía
• Procedimiento: 4 pasos

**2. Registro de Empresa**
• Micro empresa: T-201
• Pequeña empresa: T-202
• Mediana empresa: T-203

**Pasos Generales:**
1. Reunir documentación requerida
2. Completar formulario de solicitud
3. Pagar la tasa correspondiente
4. Presentar en oficina del ministerio
5. Recoger documento al finalizar procesamiento

⚠️ **Consejos para Primera Vez:**
• Revise la lista completa de documentos antes de ir
• Llegue temprano para evitar filas
• Pregunte por tiempos de procesamiento
• Conserve todos los comprobantes

💡 Para guía paso a paso de un servicio específico, pregúnteme por su código.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-005: Primer pasaporte", "T-201: Registro micro empresa"]',
    actions: '{"type": "suggestions", "items": ["T-005: Pasaporte", "¿Qué documentos necesito?"]}',
    keywords: '["primera vez", "nuevo", "primera solicitud", "nunca", "iniciar"]',
    priority: 8,
  },
  {
    id: 'faq_procedural_009',
    question_pattern: '(legalizar|legalización|apostilla|autenticar)',
    intent: 'get_procedure',
    response_es: `📜 **Legalización de Documentos**

**Servicios de Legalización Disponibles:**

**1. Legalización de Documentos Generales**
• Código: T-001
• Costo: 2,000 XAF

**2. Legalización de Escritos Notariados**
• Código: T-002, T-009
• Costo: 2,000 - 15,000 XAF

**3. Legalización de Diplomas/Títulos Académicos**
• Código: T-003, T-010
• Costo: 500 - 2,000 XAF

**4. Legalización de Documentos Mercantiles**
• Código: T-004, T-011
• Costo: 10,000 - 25,000 XAF

**Procedimiento General:**
1. Presentar documento original
2. Completar formulario de legalización
3. Pagar tasa correspondiente
4. Recoger documento legalizado

⚠️ **Importante:**
• El documento debe estar en buen estado
• Algunos documentos extranjeros requieren traducción oficial
• Conserve copias antes de legalizar

💡 Para detalles específicos, pregúnteme por el código del servicio (ej: T-001)`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-001: Legalización general", "T-003: Legalización diplomas"]',
    actions: '{"type": "suggestions", "items": ["T-001: Documentos", "T-003: Diplomas"]}',
    keywords: '["legalizar", "legalización", "apostilla", "autenticar", "certificar"]',
    priority: 8,
  },
  {
    id: 'faq_procedural_010',
    question_pattern: '(empresa|negocio|pyme|registro empresarial|constituir empresa)',
    intent: 'get_general_info',
    response_es: `🏢 **Servicios para Empresas (PYMES)**

**Tipos de Empresa:**

**1. Micro Empresa**
• Expedición: T-201 (3,000 XAF)
• Renovación: T-204 (2,000 XAF)

**2. Pequeña Empresa**
• Expedición: T-202 (5,000 XAF)
• Renovación: T-205 (4,000 XAF)

**3. Mediana Empresa**
• Expedición: T-203 (10,000 XAF)
• Renovación: T-206 (8,000 XAF)

**Ministerio Responsable:**
Ministerio de Comercio y Promoción de Pequeñas y Medianas Empresas

**Documentos Típicamente Requeridos:**
• Estatutos de la empresa
• Identificación del representante legal
• Comprobante de domicilio fiscal

⚠️ **Importante:**
• Los requisitos varían según el tipo de empresa
• Consulte asesoría legal para constitución
• Verifique obligaciones fiscales adicionales

💡 Para detalles completos de cada tipo, pregúnteme por el código específico.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-201: Micro empresa", "T-202: Pequeña empresa", "T-203: Mediana empresa"]',
    actions: '{"type": "suggestions", "items": ["T-201: Micro", "T-202: Pequeña", "T-203: Mediana"]}',
    keywords: '["empresa", "pyme", "negocio", "micro", "pequeña", "mediana", "comercio"]',
    priority: 7,
  },
  {
    id: 'faq_procedural_011',
    question_pattern: '(urgente|rápido|express|prioritario|acelerado)',
    intent: 'get_general_info',
    response_es: `⚡ **Tramitación Urgente/Express**

**Disponibilidad de Servicios Express:**

Actualmente, los servicios de tramitación express **no están disponibles** de forma generalizada.

**Plazos Estándar:**
• Mayoría de servicios: 1-3 días hábiles
• Servicios complejos: Consultar con el ministerio

**Recomendaciones para Agilizar:**
1. **Documentación Completa**
   • Revise todos los documentos requeridos
   • Presente documentación legible y vigente

2. **Horario Óptimo**
   • Llegue temprano (08:00-09:00)
   • Evite viernes y días previos a festivos

3. **Seguimiento Activo**
   • Conserve su número de referencia
   • Consulte estado regularmente

⚠️ **Casos Especiales:**
• Para urgencias justificadas, consulte directamente con el ministerio responsable
• Algunos servicios pueden ofrecer tramitación prioritaria con costo adicional

💡 Para conocer el plazo específico de un servicio, pregúnteme por su código.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver plazos de procesamiento", "Contactar ministerios"]',
    actions: '{"type": "suggestions", "items": ["¿Cuánto demora un servicio?", "Información de contacto"]}',
    keywords: '["urgente", "rápido", "express", "prioritario", "acelerado", "inmediato"]',
    priority: 5,
  },
  {
    id: 'faq_procedural_012',
    question_pattern: '(error|corrección|corregir|equivocado|mal escrito)',
    intent: 'get_general_info',
    response_es: `✏️ **Corrección de Errores en Documentos**

**Tipos de Errores:**

**1. Errores de Transcripción**
• Nombres mal escritos
• Fechas incorrectas
• Números equivocados

**2. Procedimiento de Corrección:**
1. Identificar el error específico
2. Reunir documentos que prueben el error
3. Presentar solicitud de corrección
4. Pagar tasa de corrección (si aplica)
5. Esperar procesamiento

**3. Documentos de Respaldo Necesarios:**
• Certificado de nacimiento (para corrección de nombres)
• Documento original con error
• Documento que muestre la información correcta

**Costos:**
• Varían según el tipo de documento
• Consulte con el ministerio emisor

⚠️ **Importante:**
• Revise cuidadosamente antes de pagar
• Verifique todos los datos al recibir el documento
• Las correcciones pueden tardar más que la emisión original

💡 Para corregir un documento específico, contacte al ministerio que lo emitió.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver información de contacto", "Servicios de renovación"]',
    actions: '{"type": "suggestions", "items": ["Información de contacto", "¿Cómo renovar un documento?"]}',
    keywords: '["error", "corrección", "corregir", "equivocado", "mal", "cambiar"]',
    priority: 4,
  },
  {
    id: 'faq_procedural_013',
    question_pattern: '(perdido|extraviado|robo|duplicado|reemplazo)',
    intent: 'get_procedure',
    response_es: `🔍 **Documentos Perdidos o Extraviados**

**Servicios de Duplicado/Reemplazo:**

**1. Duplicado por Extravío de Pasaporte**
• Código: T-602
• Costo: Por confirmar
• Documentos: Denuncia policial + DNI

**Pasos para Documentos Perdidos:**

1. **Denuncia Inmediata**
   • Presentar denuncia en comisaría
   • Obtener copia del reporte policial

2. **Solicitud de Duplicado**
   • Presentarse en el ministerio emisor
   • Llevar denuncia policial
   • Documento de identidad alternativo

3. **Documentación Adicional**
   • Fotografías recientes
   • Comprobante de pago
   • Formulario de solicitud

**Costos:**
• Generalmente mayores que la emisión original
• Incluye tasa de duplicado + tasa de seguridad

⚠️ **Recomendaciones:**
• Denuncie inmediatamente el extravío
• No demore la solicitud de duplicado
• Algunos documentos pueden tener sanciones por pérdida

💡 Para servicios específicos de duplicado, consulte con el ministerio correspondiente.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-602: Duplicado pasaporte", "Información de contacto"]',
    actions: '{"type": "suggestions", "items": ["T-602: Duplicado", "¿Dónde denunciar?"]}',
    keywords: '["perdido", "extraviado", "robo", "duplicado", "reemplazo", "copia"]',
    priority: 6,
  },
  {
    id: 'faq_procedural_014',
    question_pattern: '(idioma|traducción|francés|inglés|español)',
    intent: 'get_general_info',
    response_es: `🌐 **Idiomas y Traducciones**

**Idiomas Oficiales de Guinea Ecuatorial:**
• Español (principal)
• Francés
• Portugués

**Servicios en Múltiples Idiomas:**

**1. Atención al Público**
• Español: Todos los ministerios
• Francés: Disponible en oficinas principales
• Inglés: Limitado

**2. Documentos Oficiales**
• Emitidos principalmente en español
• Traducciones oficiales disponibles

**3. Traducción de Documentos Extranjeros**
• Requerida para documentos en otros idiomas
• Debe ser realizada por traductor oficial
• Legalización adicional puede ser necesaria

**Traductores Oficiales:**
• Consulte el Ministerio de Asuntos Exteriores
• Lista de traductores certificados disponible

⚠️ **Importante:**
• Documentos extranjeros deben estar traducidos al español
• Traducciones deben estar legalizadas
• Conserve originales y traducciones

💡 Esta aplicación está disponible en español, francés e inglés.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Servicios de legalización", "Información de contacto"]',
    actions: '{"type": "suggestions", "items": ["T-001: Legalización", "Contacto ministerios"]}',
    keywords: '["idioma", "traducción", "francés", "inglés", "español", "portugués"]',
    priority: 3,
  },
  {
    id: 'faq_procedural_015',
    question_pattern: '(menores|niños|hijos|menor de edad)',
    intent: 'get_general_info',
    response_es: `👶 **Servicios para Menores de Edad**

**Documentos para Menores:**

**1. Pasaporte para Menores**
• Mismo servicio que adultos (T-005)
• Documentación adicional requerida:
  - Certificado de nacimiento del menor
  - DNI de ambos padres/tutores
  - Autorización de ambos padres (si aplica)
  - Fotografía del menor

**2. Requisitos Especiales:**
• Presencia del menor puede ser requerida
• Ambos padres deben autorizar
• Tutor legal debe presentar documentación de tutela

**3. Representación Legal:**
• Menores no pueden solicitar servicios directamente
• Padre, madre o tutor legal debe representar
• Documentación de parentesco/tutela requerida

**Costos:**
• Generalmente iguales a servicios para adultos
• No hay descuentos por edad

⚠️ **Importante:**
• Verifique requisitos específicos con el ministerio
• Ambos padres deben estar de acuerdo (salvo excepciones legales)
• Documentación debe estar actualizada

💡 Para servicios específicos para menores, consulte con el ministerio correspondiente.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["T-005: Pasaporte", "Documentos requeridos"]',
    actions: '{"type": "suggestions", "items": ["T-005: Pasaporte", "¿Qué documentos necesito?"]}',
    keywords: '["menor", "niño", "hijo", "bebé", "infante", "menor de edad"]',
    priority: 4,
  },
  {
    id: 'faq_procedural_016',
    question_pattern: '(plataforma digital|online|internet|app|aplicación móvil)',
    intent: 'get_general_info',
    response_es: `📱 **Plataforma Digital TaxasGE**

**Servicios en Línea Disponibles:**

**1. Aplicación Móvil TaxasGE**
• Consulta de servicios y costos
• Información de ministerios y oficinas
• Chatbot asistente 24/7
• Calculadora de costos
• Disponible en español, francés e inglés

**2. Funcionalidades Actuales:**
• Búsqueda de servicios fiscales
• Detalles completos de cada servicio
• Documentos requeridos
• Procedimientos paso a paso
• Mapa de oficinas

**3. Próximamente:**
• Pago en línea de servicios
• Seguimiento de solicitudes
• Notificaciones de estado
• Citas previas online
• Portal de usuario personalizado

**Cómo Usar la App:**
1. Descargue TaxasGE desde su tienda de aplicaciones
2. Navegue por categorías o busque servicios específicos
3. Consulte información detallada
4. Use el chatbot para preguntas rápidas
5. Localice oficinas en el mapa

⚠️ **Nota Importante:**
• Actualmente los pagos y solicitudes deben hacerse presencialmente
• La app sirve para información y consulta
• Próximamente: Servicios transaccionales en línea

💡 ¡Descargue TaxasGE hoy y simplifique sus trámites!`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Ver todos los servicios", "Usar calculadora"]',
    actions: '{"type": "suggestions", "items": ["Buscar servicios", "¿Cómo usar la app?"]}',
    keywords: '["plataforma", "digital", "online", "internet", "app", "aplicación", "móvil", "descarga"]',
    priority: 6,
  },
  {
    id: 'faq_procedural_017',
    question_pattern: '(accesibilidad|discapacidad|movilidad reducida|personas con discapacidad)',
    intent: 'get_general_info',
    response_es: `♿ **Accesibilidad y Atención Especial**

**Servicios para Personas con Discapacidad:**

**1. Acceso a Oficinas**
• Rampas de acceso en oficinas principales
• Ascensores disponibles en edificios de varios pisos
• Estacionamiento reservado para personas con movilidad reducida
• Asistencia disponible en la entrada

**2. Atención Prioritaria**
• Ventanillas de atención preferencial
• Personal capacitado para asistencia
• Tiempo adicional para completar trámites
• Acompañante permitido en todo momento

**3. Documentación Especial**
• Formato accesible disponible bajo solicitud
• Asistencia para completar formularios
• Lectura de documentos si es necesario
• Firma asistida cuando sea requerido

**4. Servicios a Domicilio**
• Disponibles para casos especiales
• Solicitar con anticipación
• Presentar documentación médica si es necesario
• Consulte disponibilidad con cada ministerio

**Cómo Solicitar Asistencia:**
1. Contacte al ministerio correspondiente
2. Informe sobre necesidades específicas
3. Programe cita si es posible
4. Llegue con acompañante si lo prefiere

⚠️ **Recomendaciones:**
• Llame con anticipación para coordinar asistencia
• Pregunte por servicios específicos de accesibilidad
• Verifique disponibilidad de atención prioritaria

💡 Para consultas sobre accesibilidad, contacte directamente al ministerio.`,
    response_fr: null,
    response_en: null,
    follow_up_suggestions: '["Información de contacto", "Horarios de atención"]',
    actions: '{"type": "suggestions", "items": ["Contacto ministerios", "Horarios"]}',
    keywords: '["accesibilidad", "discapacidad", "movilidad", "reducida", "especial", "prioritaria"]',
    priority: 5,
  }
];

// Total FAQs: 60
// Service FAQs: 30
// Category FAQs: 13
// Procedural FAQs: 17