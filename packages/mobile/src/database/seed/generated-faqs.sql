-- TaxasGE Mobile - Generated Chatbot FAQs
-- Auto-generated from generate-faqs-from-seed.ts
-- Generated on: 2025-11-07T00:38:59.173Z
-- Total FAQs: 60

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-001',
  '(pasaporte|passport|passeport|renovar pasaporte|nuevo pasaporte)',
  'get_general_info',
  '📋 **Pasaporte**

💰 **Costos:**
• Expedición: 50,000 XAF
• Renovación: 40,000 XAF

📄 **Descripción:**
Expedición y renovación de pasaportes para ciudadanos de Guinea Ecuatorial

⏱️ Plazo de procesamiento: 15 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Passeport**

💰 **Coûts:**
• Expédition: 50,000 XAF
• Renouvellement: 40,000 XAF

📄 **Description:**
Délivrance et renouvellement de passeports pour les citoyens de Guinée équatoriale

⏱️ Délai de traitement: 15 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Passport**

💰 **Costs:**
• Expedition: 50,000 XAF
• Renewal: 40,000 XAF

📄 **Description:**
Issuance and renewal of passports for citizens of Equatorial Guinea

⏱️ Processing time: 15 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["pasaporte","passport","passeport","renovar pasaporte","nuevo pasaporte"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-002',
  '(visa|visado|visa turistico|visa trabajo|tourist visa|work visa)',
  'get_general_info',
  '📋 **Visa**

💰 **Costos:**
• Expedición: 30,000 XAF


📄 **Descripción:**
Solicitud de visa para entrada a Guinea Ecuatorial (turismo, trabajo, negocios)

⏱️ Plazo de procesamiento: 7 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Visa**

💰 **Coûts:**
• Expédition: 30,000 XAF


📄 **Description:**
Demande de visa pour l''entrée en Guinée équatoriale (tourisme, travail, affaires)

⏱️ Délai de traitement: 7 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Visa**

💰 **Costs:**
• Expedition: 30,000 XAF


📄 **Description:**
Visa application for entry to Equatorial Guinea (tourism, work, business)

⏱️ Processing time: 7 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["visa","visado","visa turistico","visa trabajo","tourist visa","work visa"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-003',
  '(licencia conducir|permis de conduire|driver''s license|carnet de conducir|license)',
  'get_general_info',
  '📋 **Licencia de Conducir**

💰 **Costos:**
• Expedición: 25,000 XAF
• Renovación: 20,000 XAF

📄 **Descripción:**
Expedición y renovación de licencia de conducir

⏱️ Plazo de procesamiento: 10 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis de Conduire**

💰 **Coûts:**
• Expédition: 25,000 XAF
• Renouvellement: 20,000 XAF

📄 **Description:**
Délivrance et renouvellement du permis de conduire

⏱️ Délai de traitement: 10 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Driver''s License**

💰 **Costs:**
• Expedition: 25,000 XAF
• Renewal: 20,000 XAF

📄 **Description:**
Issuance and renewal of driver''s license

⏱️ Processing time: 10 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["licencia conducir","permis de conduire","driver''s license","carnet de conducir","license"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-004',
  '(dni|cedula|identidad|identity card|carte d''identité|documento identidad)',
  'get_general_info',
  '📋 **DNI - Documento Nacional de Identidad**

💰 **Costos:**
• Expedición: 15,000 XAF
• Renovación: 12,000 XAF

📄 **Descripción:**
Expedición y renovación del Documento Nacional de Identidad (DNI)

⏱️ Plazo de procesamiento: 7 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **DNI - Document National d''Identité**

💰 **Coûts:**
• Expédition: 15,000 XAF
• Renouvellement: 12,000 XAF

📄 **Description:**
Délivrance et renouvellement du Document National d''Identité (DNI)

⏱️ Délai de traitement: 7 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **DNI - National Identity Document**

💰 **Costs:**
• Expedition: 15,000 XAF
• Renewal: 12,000 XAF

📄 **Description:**
Issuance and renewal of National Identity Document (DNI)

⏱️ Processing time: 7 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["dni","cedula","identidad","identity card","carte d''identité","documento identidad"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-005',
  '(permiso residencia|residence permit|permis de séjour|residencia|residence)',
  'get_general_info',
  '📋 **Permiso de Residencia**

💰 **Costos:**
• Expedición: 80,000 XAF


📄 **Descripción:**
Solicitud de permiso de residencia para extranjeros

⏱️ Plazo de procesamiento: 30 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis de Séjour**

💰 **Coûts:**
• Expédition: 80,000 XAF


📄 **Description:**
Demande de permis de séjour pour étrangers

⏱️ Délai de traitement: 30 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Residence Permit**

💰 **Costs:**
• Expedition: 80,000 XAF


📄 **Description:**
Residence permit application for foreigners

⏱️ Processing time: 30 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso residencia","residence permit","permis de séjour","residencia","residence"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-006',
  '(permiso trabajo|work permit|permis de travail|trabajo|work)',
  'get_general_info',
  '📋 **Permiso de Trabajo**

💰 **Costos:**
• Expedición: 100,000 XAF


📄 **Descripción:**
Solicitud de permiso de trabajo para extranjeros

⏱️ Plazo de procesamiento: 30 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis de Travail**

💰 **Coûts:**
• Expédition: 100,000 XAF


📄 **Description:**
Demande de permis de travail pour étrangers

⏱️ Délai de traitement: 30 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Work Permit**

💰 **Costs:**
• Expedition: 100,000 XAF


📄 **Description:**
Work permit application for foreigners

⏱️ Processing time: 30 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso trabajo","work permit","permis de travail","trabajo","work"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-007',
  '(registro empresa|business registration|enregistrement entreprise|empresa|business)',
  'get_general_info',
  '📋 **Registro de Empresa**

💰 **Costos:**
• Expedición: 150,000 XAF


📄 **Descripción:**
Registro oficial de nueva empresa o negocio

⏱️ Plazo de procesamiento: 45 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Enregistrement d''Entreprise**

💰 **Coûts:**
• Expédition: 150,000 XAF


📄 **Description:**
Enregistrement officiel d''une nouvelle entreprise

⏱️ Délai de traitement: 45 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Business Registration**

💰 **Costs:**
• Expedition: 150,000 XAF


📄 **Description:**
Official registration of new business or company

⏱️ Processing time: 45 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["registro empresa","business registration","enregistrement entreprise","empresa","business"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-008',
  '(licencia comercial|commercial license|licence commerciale|negocio|commerce)',
  'get_general_info',
  '📋 **Licencia Comercial**

💰 **Costos:**
• Expedición: 200,000 XAF
• Renovación: 150,000 XAF

📄 **Descripción:**
Licencia para operación de actividad comercial

⏱️ Plazo de procesamiento: 30 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Licence Commerciale**

💰 **Coûts:**
• Expédition: 200,000 XAF
• Renouvellement: 150,000 XAF

📄 **Description:**
Licence pour l''exploitation d''une activité commerciale

⏱️ Délai de traitement: 30 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Commercial License**

💰 **Costs:**
• Expedition: 200,000 XAF
• Renewal: 150,000 XAF

📄 **Description:**
License for commercial activity operation

⏱️ Processing time: 30 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["licencia comercial","commercial license","licence commerciale","negocio","commerce"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-009',
  '(certificado nacimiento|birth certificate|acte de naissance|nacimiento|birth)',
  'get_general_info',
  '📋 **Certificado de Nacimiento**

💰 **Costos:**
• Expedición: 5,000 XAF


📄 **Descripción:**
Solicitud de certificado de nacimiento

⏱️ Plazo de procesamiento: 3 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Acte de Naissance**

💰 **Coûts:**
• Expédition: 5,000 XAF


📄 **Description:**
Demande d acte de naissance

⏱️ Délai de traitement: 3 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Birth Certificate**

💰 **Costs:**
• Expedition: 5,000 XAF


📄 **Description:**
Birth certificate request

⏱️ Processing time: 3 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["certificado nacimiento","birth certificate","acte de naissance","nacimiento","birth"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-010',
  '(certificado matrimonio|marriage certificate|acte de mariage|matrimonio|marriage)',
  'get_general_info',
  '📋 **Certificado de Matrimonio**

💰 **Costos:**
• Expedición: 5,000 XAF


📄 **Descripción:**
Solicitud de certificado de matrimonio

⏱️ Plazo de procesamiento: 3 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Acte de Mariage**

💰 **Coûts:**
• Expédition: 5,000 XAF


📄 **Description:**
Demande d acte de mariage

⏱️ Délai de traitement: 3 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Marriage Certificate**

💰 **Costs:**
• Expedition: 5,000 XAF


📄 **Description:**
Marriage certificate request

⏱️ Processing time: 3 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["certificado matrimonio","marriage certificate","acte de mariage","matrimonio","marriage"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-011',
  '(certificado defuncion|death certificate|acte de décès|defuncion|death)',
  'get_general_info',
  '📋 **Certificado de Defunción**

💰 **Costos:**
• Expedición: 5,000 XAF


📄 **Descripción:**
Solicitud de certificado de defunción

⏱️ Plazo de procesamiento: 3 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Acte de Décès**

💰 **Coûts:**
• Expédition: 5,000 XAF


📄 **Description:**
Demande d acte de décès

⏱️ Délai de traitement: 3 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Death Certificate**

💰 **Costs:**
• Expedition: 5,000 XAF


📄 **Description:**
Death certificate request

⏱️ Processing time: 3 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["certificado defuncion","death certificate","acte de décès","defuncion","death"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-012',
  '(antecedentes penales|criminal record|casier judiciaire|penales|police clearance)',
  'get_general_info',
  '📋 **Certificado de Antecedentes Penales**

💰 **Costos:**
• Expedición: 10,000 XAF


📄 **Descripción:**
Certificado de antecedentes penales para trámites oficiales

⏱️ Plazo de procesamiento: 7 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Certificat de Casier Judiciaire**

💰 **Coûts:**
• Expédition: 10,000 XAF


📄 **Description:**
Certificat de casier judiciaire pour démarches officielles

⏱️ Délai de traitement: 7 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Criminal Record Certificate**

💰 **Costs:**
• Expedition: 10,000 XAF


📄 **Description:**
Criminal record certificate for official procedures

⏱️ Processing time: 7 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["antecedentes penales","criminal record","casier judiciaire","penales","police clearance"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-013',
  '(permiso construccion|building permit|permis de construire|construccion|building)',
  'get_general_info',
  '📋 **Permiso de Construcción**

💰 **Costos:**
• Expedición: 120,000 XAF


📄 **Descripción:**
Permiso para construcción de edificaciones

⏱️ Plazo de procesamiento: 60 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis de Construire**

💰 **Coûts:**
• Expédition: 120,000 XAF


📄 **Description:**
Permis pour construction de bâtiments

⏱️ Délai de traitement: 60 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Building Permit**

💰 **Costs:**
• Expedition: 120,000 XAF


📄 **Description:**
Permit for building construction

⏱️ Processing time: 60 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso construccion","building permit","permis de construire","construccion","building"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-014',
  '(registro propiedad|property registration|enregistrement propriété|propiedad|property)',
  'get_general_info',
  '📋 **Registro de Propiedad**

💰 **Costos:**
• Expedición: 200,000 XAF


📄 **Descripción:**
Registro oficial de propiedad inmobiliaria

⏱️ Plazo de procesamiento: 45 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Enregistrement de Propriété**

💰 **Coûts:**
• Expédition: 200,000 XAF


📄 **Description:**
Enregistrement officiel de propriété immobilière

⏱️ Délai de traitement: 45 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Property Registration**

💰 **Costs:**
• Expedition: 200,000 XAF


📄 **Description:**
Official real estate property registration

⏱️ Processing time: 45 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["registro propiedad","property registration","enregistrement propriété","propiedad","property"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-015',
  '(licencia profesional|professional license|licence professionnelle|medico|abogado|doctor|lawyer)',
  'get_general_info',
  '📋 **Licencia Profesional**

💰 **Costos:**
• Expedición: 80,000 XAF
• Renovación: 60,000 XAF

📄 **Descripción:**
Licencia para ejercicio profesional (médicos, abogados, ingenieros)

⏱️ Plazo de procesamiento: 30 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Licence Professionnelle**

💰 **Coûts:**
• Expédition: 80,000 XAF
• Renouvellement: 60,000 XAF

📄 **Description:**
Licence pour exercice professionnel (médecins, avocats, ingénieurs)

⏱️ Délai de traitement: 30 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Professional License**

💰 **Costs:**
• Expedition: 80,000 XAF
• Renewal: 60,000 XAF

📄 **Description:**
License for professional practice (doctors, lawyers, engineers)

⏱️ Processing time: 30 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["licencia profesional","professional license","licence professionnelle","medico","abogado","doctor","lawyer"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-016',
  '(importacion vehiculo|vehicle import|importation véhicule|vehiculo|coche|car)',
  'get_general_info',
  '📋 **Permiso de Importación de Vehículo**

💰 **Costos:**
• Expedición: 250,000 XAF


📄 **Descripción:**
Permiso para importación de vehículos

⏱️ Plazo de procesamiento: 20 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis d Importation de Véhicule**

💰 **Coûts:**
• Expédition: 250,000 XAF


📄 **Description:**
Permis pour importation de véhicules

⏱️ Délai de traitement: 20 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Vehicle Import Permit**

💰 **Costs:**
• Expedition: 250,000 XAF


📄 **Description:**
Permit for vehicle importation

⏱️ Processing time: 20 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["importacion vehiculo","vehicle import","importation véhicule","vehiculo","coche","car"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-017',
  '(matricula escolar|school enrollment|inscription scolaire|escuela|school)',
  'get_general_info',
  '📋 **Matrícula Escolar**

💰 **Costos:**
• Expedición: 15,000 XAF


📄 **Descripción:**
Registro y matrícula en instituciones educativas públicas

⏱️ Plazo de procesamiento: 5 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Inscription Scolaire**

💰 **Coûts:**
• Expédition: 15,000 XAF


📄 **Description:**
Inscription dans les établissements éducatifs publics

⏱️ Délai de traitement: 5 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **School Enrollment**

💰 **Costs:**
• Expedition: 15,000 XAF


📄 **Description:**
Registration in public educational institutions

⏱️ Processing time: 5 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["matricula escolar","school enrollment","inscription scolaire","escuela","school"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-018',
  '(registro civil|civil registry|registre civil|civil|registry)',
  'get_general_info',
  '📋 **Registro Civil**

💰 **Costos:**
• Expedición: 8,000 XAF


📄 **Descripción:**
Inscripción en el Registro Civil (nacimientos, matrimonios, defunciones)

⏱️ Plazo de procesamiento: 5 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Registre Civil**

💰 **Coûts:**
• Expédition: 8,000 XAF


📄 **Description:**
Inscription au Registre Civil (naissances, mariages, décès)

⏱️ Délai de traitement: 5 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Civil Registry**

💰 **Costs:**
• Expedition: 8,000 XAF


📄 **Description:**
Civil Registry inscription (births, marriages, deaths)

⏱️ Processing time: 5 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["registro civil","civil registry","registre civil","civil","registry"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-019',
  '(permiso exportacion|export permit|permis d exportation|exportacion|export)',
  'get_general_info',
  '📋 **Permiso de Exportación**

💰 **Costos:**
• Expedición: 180,000 XAF


📄 **Descripción:**
Permiso para exportación de mercancías

⏱️ Plazo de procesamiento: 15 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis d''Exportation**

💰 **Coûts:**
• Expédition: 180,000 XAF


📄 **Description:**
Permis pour exportation de marchandises

⏱️ Délai de traitement: 15 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Export Permit**

💰 **Costs:**
• Expedition: 180,000 XAF


📄 **Description:**
Permit for goods exportation

⏱️ Processing time: 15 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso exportacion","export permit","permis d exportation","exportacion","export"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-020',
  '(certificado salud|health certificate|certificat de santé|salud|health)',
  'get_general_info',
  '📋 **Certificado de Salud**

💰 **Costos:**
• Expedición: 12,000 XAF


📄 **Descripción:**
Certificado médico oficial para trámites

⏱️ Plazo de procesamiento: 2 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Certificat de Santé**

💰 **Coûts:**
• Expédition: 12,000 XAF


📄 **Description:**
Certificat médical officiel pour démarches

⏱️ Délai de traitement: 2 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Health Certificate**

💰 **Costs:**
• Expedition: 12,000 XAF


📄 **Description:**
Official medical certificate for procedures

⏱️ Processing time: 2 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["certificado salud","health certificate","certificat de santé","salud","health"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-021',
  '(patente comercial|trade patent|patente commerciale|patente|patent)',
  'get_general_info',
  '📋 **Patente Comercial**

💰 **Costos:**
• Expedición: 90,000 XAF
• Renovación: 90,000 XAF

📄 **Descripción:**
Patente anual para ejercicio de actividad comercial

⏱️ Plazo de procesamiento: 10 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Patente Commerciale**

💰 **Coûts:**
• Expédition: 90,000 XAF
• Renouvellement: 90,000 XAF

📄 **Description:**
Patente annuelle pour exercice d activité commerciale

⏱️ Délai de traitement: 10 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Trade Patent**

💰 **Costs:**
• Expedition: 90,000 XAF
• Renewal: 90,000 XAF

📄 **Description:**
Annual patent for commercial activity

⏱️ Processing time: 10 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["patente comercial","trade patent","patente commerciale","patente","patent"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-022',
  '(registro marca|trademark registration|enregistrement marque|marca|trademark)',
  'get_general_info',
  '📋 **Registro de Marca**

💰 **Costos:**
• Expedición: 300,000 XAF


📄 **Descripción:**
Registro oficial de marca comercial

⏱️ Plazo de procesamiento: 90 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Enregistrement de Marque**

💰 **Coûts:**
• Expédition: 300,000 XAF


📄 **Description:**
Enregistrement officiel de marque commerciale

⏱️ Délai de traitement: 90 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Trademark Registration**

💰 **Costs:**
• Expedition: 300,000 XAF


📄 **Description:**
Official trademark registration

⏱️ Processing time: 90 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["registro marca","trademark registration","enregistrement marque","marca","trademark"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-023',
  '(permiso ambiental|environmental permit|permis environnemental|ambiental|environmental)',
  'get_general_info',
  '📋 **Permiso Ambiental**

💰 **Costos:**
• Expedición: 250,000 XAF


📄 **Descripción:**
Permiso para actividades con impacto ambiental

⏱️ Plazo de procesamiento: 60 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis Environnemental**

💰 **Coûts:**
• Expédition: 250,000 XAF


📄 **Description:**
Permis pour activités avec impact environnemental

⏱️ Délai de traitement: 60 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Environmental Permit**

💰 **Costs:**
• Expedition: 250,000 XAF


📄 **Description:**
Permit for activities with environmental impact

⏱️ Processing time: 60 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso ambiental","environmental permit","permis environnemental","ambiental","environmental"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-024',
  '(licencia sanitaria|sanitary license|licence sanitaire|sanitaria|sanitary|restaurante)',
  'get_general_info',
  '📋 **Licencia Sanitaria**

💰 **Costos:**
• Expedición: 50,000 XAF
• Renovación: 40,000 XAF

📄 **Descripción:**
Licencia sanitaria para establecimientos alimentarios

⏱️ Plazo de procesamiento: 20 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Licence Sanitaire**

💰 **Coûts:**
• Expédition: 50,000 XAF
• Renouvellement: 40,000 XAF

📄 **Description:**
Licence sanitaire pour établissements alimentaires

⏱️ Délai de traitement: 20 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Sanitary License**

💰 **Costs:**
• Expedition: 50,000 XAF
• Renewal: 40,000 XAF

📄 **Description:**
Sanitary license for food establishments

⏱️ Processing time: 20 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["licencia sanitaria","sanitary license","licence sanitaire","sanitaria","sanitary","restaurante"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-025',
  '(certificado origen|certificate of origin|certificat origine|origen|origin)',
  'get_general_info',
  '📋 **Certificado de Origen**

💰 **Costos:**
• Expedición: 20,000 XAF


📄 **Descripción:**
Certificado de origen para exportación de productos

⏱️ Plazo de procesamiento: 3 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Certificat d''Origine**

💰 **Coûts:**
• Expédition: 20,000 XAF


📄 **Description:**
Certificat d''origine pour exportation de produits

⏱️ Délai de traitement: 3 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Certificate of Origin**

💰 **Costs:**
• Expedition: 20,000 XAF


📄 **Description:**
Certificate of origin for product exportation

⏱️ Processing time: 3 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["certificado origen","certificate of origin","certificat origine","origen","origin"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-026',
  '(permiso minero|mining permit|permis minier|mineria|mining)',
  'get_general_info',
  '📋 **Permiso de Exploración Minera**

💰 **Costos:**
• Expedición: 500,000 XAF


📄 **Descripción:**
Permiso para exploración y explotación minera

⏱️ Plazo de procesamiento: 120 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis d''Exploration Minière**

💰 **Coûts:**
• Expédition: 500,000 XAF


📄 **Description:**
Permis pour exploration et exploitation minière

⏱️ Délai de traitement: 120 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Mining Exploration Permit**

💰 **Costs:**
• Expedition: 500,000 XAF


📄 **Description:**
Permit for mining exploration and exploitation

⏱️ Processing time: 120 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso minero","mining permit","permis minier","mineria","mining"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-027',
  '(licencia turismo|tourism license|licence tourisme|turismo|tourism|hotel)',
  'get_general_info',
  '📋 **Licencia de Turismo**

💰 **Costos:**
• Expedición: 120,000 XAF
• Renovación: 100,000 XAF

📄 **Descripción:**
Licencia para operación de establecimientos turísticos

⏱️ Plazo de procesamiento: 30 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Licence de Tourisme**

💰 **Coûts:**
• Expédition: 120,000 XAF
• Renouvellement: 100,000 XAF

📄 **Description:**
Licence pour exploitation d établissements touristiques

⏱️ Délai de traitement: 30 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Tourism License**

💰 **Costs:**
• Expedition: 120,000 XAF
• Renewal: 100,000 XAF

📄 **Description:**
License for tourism establishment operation

⏱️ Processing time: 30 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["licencia turismo","tourism license","licence tourisme","turismo","tourism","hotel"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-028',
  '(certificado residencia|residence certificate|certificat de résidence|residencia fiscal|tax residence)',
  'get_general_info',
  '📋 **Certificado de Residencia Fiscal**

💰 **Costos:**
• Expedición: 15,000 XAF


📄 **Descripción:**
Certificado de residencia fiscal para trámites internacionales

⏱️ Plazo de procesamiento: 10 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Certificat de Résidence Fiscale**

💰 **Coûts:**
• Expédition: 15,000 XAF


📄 **Description:**
Certificat de résidence fiscale pour démarches internationales

⏱️ Délai de traitement: 10 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Tax Residence Certificate**

💰 **Costs:**
• Expedition: 15,000 XAF


📄 **Description:**
Tax residence certificate for international procedures

⏱️ Processing time: 10 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["certificado residencia","residence certificate","certificat de résidence","residencia fiscal","tax residence"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-029',
  '(permiso forestal|forestry permit|permis forestier|forestal|forestry|tala|madera)',
  'get_general_info',
  '📋 **Permiso Forestal**

💰 **Costos:**
• Expedición: 180,000 XAF


📄 **Descripción:**
Permiso para explotación forestal y tala de árboles

⏱️ Plazo de procesamiento: 45 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Permis Forestier**

💰 **Coûts:**
• Expédition: 180,000 XAF


📄 **Description:**
Permis pour exploitation forestière et coupe d''arbres

⏱️ Délai de traitement: 45 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Forestry Permit**

💰 **Costs:**
• Expedition: 180,000 XAF


📄 **Description:**
Permit for forestry exploitation and tree cutting

⏱️ Processing time: 45 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["permiso forestal","forestry permit","permis forestier","forestal","forestry","tala","madera"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-service-030',
  '(registro laboral|labor registration|enregistrement travail|laboral|labor|empleados)',
  'get_general_info',
  '📋 **Registro de Trabajadores**

💰 **Costos:**
• Expedición: 10,000 XAF


📄 **Descripción:**
Registro de empleados en sistema de seguridad social

⏱️ Plazo de procesamiento: 7 días

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.',
  '📋 **Enregistrement de Travailleurs**

💰 **Coûts:**
• Expédition: 10,000 XAF


📄 **Description:**
Enregistrement des employés au système de sécurité sociale

⏱️ Délai de traitement: 7 jours

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.',
  '📋 **Workers Registration**

💰 **Costs:**
• Expedition: 10,000 XAF


📄 **Description:**
Employee registration in social security system

⏱️ Processing time: 7 days

💡 Use search to find this service and see more details.',
  '["Ver documentos requeridos","Ver procedimientos","Buscar servicios"]',
  '{"type":"navigate","screen":"Search"}',
  '["registro laboral","labor registration","enregistrement travail","laboral","labor","empleados"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-001',
  '(impuestos|taxes|impôts|fiscal|tax)',
  'search_service',
  '📂 **Categoría: Impuestos**

Servicios relacionados con impuestos y tributos fiscales

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Impôts**

Services liés aux impôts et taxes fiscales

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Taxes**

Services related to taxes and fiscal duties

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["impuestos","taxes","impôts","fiscal","tax"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-002',
  '(documentos personales|personal documents|documents personnels|certificados|certificates)',
  'search_service',
  '📂 **Categoría: Documentos Personales**

Certificados, actas y documentos de identidad

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Documents Personnels**

Certificats, actes et documents d''identité

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Personal Documents**

Certificates, records and identity documents

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["documentos personales","personal documents","documents personnels","certificados","certificates"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-003',
  '(permisos|permits|permis|licencias|licenses)',
  'search_service',
  '📂 **Categoría: Permisos y Licencias**

Permisos de trabajo, residencia, conducir y comerciales

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Permis et Licences**

Permis de travail, séjour, conduire et commerciaux

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Permits and Licenses**

Work, residence, driving and commercial permits

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["permisos","permits","permis","licencias","licenses"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-004',
  '(empresas|business|entreprises|comercio|commerce)',
  'search_service',
  '📂 **Categoría: Servicios Empresariales**

Registro, licencias y trámites para empresas

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Services aux Entreprises**

Enregistrement, licences et démarches pour entreprises

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Business Services**

Registration, licenses and procedures for businesses

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["empresas","business","entreprises","comercio","commerce"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-005',
  '(aduanas|customs|douanes|importacion|exportacion|import|export)',
  'search_service',
  '📂 **Categoría: Aduanas**

Trámites de importación, exportación y aranceles

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Douanes**

Démarches d''importation, exportation et tarifs douaniers

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Customs**

Import, export and customs duties procedures

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["aduanas","customs","douanes","importacion","exportacion","import","export"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-006',
  '(salud|health|santé|medico|hospital|medical)',
  'search_service',
  '📂 **Categoría: Servicios de Salud**

Certificados médicos, licencias sanitarias y servicios de salud

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Services de Santé**

Certificats médicaux, licences sanitaires et services de santé

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Health Services**

Medical certificates, sanitary licenses and health services

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["salud","health","santé","medico","hospital","medical"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-007',
  '(educacion|education|éducation|escuela|universidad|school|university)',
  'search_service',
  '📂 **Categoría: Educación**

Matrícula escolar, certificados educativos y servicios académicos

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Éducation**

Inscription scolaire, certificats éducatifs et services académiques

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Education**

School enrollment, educational certificates and academic services

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["educacion","education","éducation","escuela","universidad","school","university"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-008',
  '(propiedad|property|propriété|inmueble|terreno|real estate)',
  'search_service',
  '📂 **Categoría: Propiedad e Inmuebles**

Registro de propiedad, permisos de construcción y trámites inmobiliarios

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Propriété et Immobilier**

Enregistrement de propriété, permis de construire et démarches immobilières

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Property and Real Estate**

Property registration, building permits and real estate procedures

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["propiedad","property","propriété","inmueble","terreno","real estate"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-009',
  '(trabajo|labor|travail|empleo|employment|emploi)',
  'search_service',
  '📂 **Categoría: Trabajo y Empleo**

Registro laboral, permisos de trabajo y servicios de empleo

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Travail et Emploi**

Enregistrement au travail, permis de travail et services d emploi

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Labor and Employment**

Labor registration, work permits and employment services

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["trabajo","labor","travail","empleo","employment","emploi"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-010',
  '(medio ambiente|environment|environnement|ecologia|ecology)',
  'search_service',
  '📂 **Categoría: Medio Ambiente**

Permisos ambientales y trámites ecológicos

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Environnement**

Permis environnementaux et démarches écologiques

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Environment**

Environmental permits and ecological procedures

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["medio ambiente","environment","environnement","ecologia","ecology"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-011',
  '(transporte|transportation|transport|vehiculo|vehicle)',
  'search_service',
  '📂 **Categoría: Transportes**

Licencias de conducir, importación de vehículos y servicios de transporte

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Transports**

Permis de conduire, importation de véhicules et services de transport

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Transportation**

Driver''s licenses, vehicle import and transportation services

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["transporte","transportation","transport","vehiculo","vehicle"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-012',
  '(turismo|tourism|tourisme|hotel|hosteleria)',
  'search_service',
  '📂 **Categoría: Turismo y Hostelería**

Licencias turísticas y servicios para establecimientos hoteleros

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Tourisme et Hôtellerie**

Licences touristiques et services pour établissements hôteliers

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Tourism and Hospitality**

Tourism licenses and services for hotel establishments

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["turismo","tourism","tourisme","hotel","hosteleria"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-013',
  '(mineria|mining|mines|extractivo|extractive)',
  'search_service',
  '📂 **Categoría: Minería y Recursos**

Permisos mineros y explotación de recursos naturales

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Mines et Ressources**

Permis miniers et exploitation de ressources naturelles

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Mining and Resources**

Mining permits and natural resources exploitation

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["mineria","mining","mines","extractivo","extractive"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-014',
  '(agricultura|agriculture|agricola|farming|agricole)',
  'search_service',
  '📂 **Categoría: Agricultura**

Servicios agrícolas, permisos forestales y producción agropecuaria

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Agriculture**

Services agricoles, permis forestiers et production agro-pastorale

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Agriculture**

Agricultural services, forestry permits and farming production

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["agricultura","agriculture","agricola","farming","agricole"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-category-015',
  '(justicia|justice|judicial|legal|tribunal)',
  'search_service',
  '📂 **Categoría: Justicia**

Certificados judiciales, antecedentes penales y servicios legales

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.',
  '📂 **Catégorie: Justice**

Certificats judiciaires, casier judiciaire et services légaux

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.',
  '📂 **Category: Justice**

Judicial certificates, criminal records and legal services

💡 Use search to explore specific services in this category.

📊 We have multiple services available.',
  '["Buscar servicios","Ver servicios populares","¿Qué documentos necesito?"]',
  '{"type":"navigate","screen":"Search"}',
  '["justicia","justice","judicial","legal","tribunal"]',
  7,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-payment',
  '(pagar|payment|paiement|como pago|how to pay|comment payer|metodo pago|payment method)',
  'get_general_info',
  '💳 **Métodos de Pago**

Puedes pagar tus servicios fiscales de las siguientes formas:

1️⃣ **Bancos autorizados** (efectivo o transferencia)
2️⃣ **Oficinas gubernamentales** (pago directo)
3️⃣ **Pago en línea** (disponible próximamente)

💡 Cada servicio muestra los métodos disponibles en su ficha.',
  '💳 **Méthodes de Paiement**

Vous pouvez payer vos services fiscaux des manières suivantes:

1️⃣ **Banques autorisées** (espèces ou virement)
2️⃣ **Bureaux gouvernementaux** (paiement direct)
3️⃣ **Paiement en ligne** (disponible prochainement)

💡 Chaque service affiche les méthodes disponibles sur sa fiche.',
  '💳 **Payment Methods**

You can pay for your fiscal services in the following ways:

1️⃣ **Authorized banks** (cash or transfer)
2️⃣ **Government offices** (direct payment)
3️⃣ **Online payment** (coming soon)

💡 Each service shows available methods on its details page.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-appointment',
  '(cita|appointment|rendez-vous|agendar|schedule|prendre rendez-vous|horario|hours|heures)',
  'get_general_info',
  '📅 **Citas y Horarios**

Para tramitar servicios fiscales:

• Algunos servicios requieren cita previa
• Otros son por orden de llegada
• **Horario general:** Lunes a Viernes, 8:00 - 16:00

💡 Consulta la ficha de cada servicio para ver si requiere cita.',
  '📅 **Rendez-vous et Horaires**

Pour traiter les services fiscaux:

• Certains services nécessitent un rendez-vous
• D''autres sont par ordre d''arrivée
• **Horaire général:** Lundi au Vendredi, 8h00 - 16h00

💡 Consultez la fiche de chaque service pour voir s''il nécessite un rendez-vous.',
  '📅 **Appointments and Schedules**

To process fiscal services:

• Some services require appointment
• Others are first-come-first-served
• **General hours:** Monday to Friday, 8:00 AM - 4:00 PM

💡 Check each service details to see if appointment is required.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-location',
  '(oficina|office|bureau|ubicacion|location|emplacement|donde|where|ou|direccion|address|adresse)',
  'get_general_info',
  '📍 **Ubicación de Oficinas**

Las oficinas gubernamentales para servicios fiscales se encuentran en:

🏛️ **Malabo** - Ministerios centrales y oficinas principales
🏛️ **Bata** - Oficinas regionales

💡 Cada servicio indica la dirección específica en su ficha.',
  '📍 **Emplacement des Bureaux**

Les bureaux gouvernementaux pour les services fiscaux se trouvent à:

🏛️ **Malabo** - Ministères centraux et bureaux principaux
🏛️ **Bata** - Bureaux régionaux

💡 Chaque service indique l''adresse spécifique sur sa fiche.',
  '📍 **Office Locations**

Government offices for fiscal services are located in:

🏛️ **Malabo** - Central ministries and main offices
🏛️ **Bata** - Regional offices

💡 Each service shows specific address on its details page.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-urgente',
  '(urgente|urgent|express|rapido|quick|rapide|emergency|emergencia|urgence)',
  'get_general_info',
  '⚡ **Servicios Urgentes**

Algunos servicios ofrecen tramitación urgente/express:

💰 **Costo adicional:** Generalmente +50% del precio normal
⏱️ **Plazo reducido:** 50% menos tiempo de procesamiento

💡 Consulta la ficha de cada servicio para ver si ofrece modalidad urgente.',
  '⚡ **Services Urgents**

Certains services offrent un traitement urgent/express:

💰 **Coût supplémentaire:** Généralement +50% du prix normal
⏱️ **Délai réduit:** 50% moins de temps de traitement

💡 Consultez la fiche de chaque service pour voir s''il offre une modalité urgente.',
  '⚡ **Urgent Services**

Some services offer urgent/express processing:

💰 **Additional cost:** Generally +50% of normal price
⏱️ **Reduced time:** 50% less processing time

💡 Check each service details to see if urgent option is available.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-tracking',
  '(seguimiento|tracking|suivi|estado|status|statut|tramite|procedure|demarche|verificar|check|verifier)',
  'get_general_info',
  '🔍 **Seguimiento de Trámites**

Para verificar el estado de tu trámite:

1️⃣ **Número de expediente:** Guarda el número que te dieron al presentar
2️⃣ **Contacto:** Llama a la oficina correspondiente
3️⃣ **Visita presencial:** Acude con tu recibo de pago

💡 El tiempo de procesamiento varía según el servicio (consulta la ficha).',
  '🔍 **Suivi des Démarches**

Pour vérifier l''état de votre démarche:

1️⃣ **Numéro de dossier:** Conservez le numéro reçu lors du dépôt
2️⃣ **Contact:** Appelez le bureau concerné
3️⃣ **Visite en personne:** Présentez-vous avec votre reçu de paiement

💡 Le délai de traitement varie selon le service (consultez la fiche).',
  '🔍 **Procedure Tracking**

To check your procedure status:

1️⃣ **File number:** Keep the number given when submitting
2️⃣ **Contact:** Call the corresponding office
3️⃣ **In-person visit:** Go with your payment receipt

💡 Processing time varies by service (check details page).',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-validity',
  '(validez|validity|validité|vigencia|duration|durée|cuanto tiempo vale|how long valid|combien de temps valable)',
  'get_general_info',
  '📅 **Validez de Documentos**

La vigencia de los documentos varía:

📋 **Documentos de Identidad:**
• DNI: 10 años
• Pasaporte: 5 años
• Licencia de conducir: 5 años

📋 **Licencias Comerciales:**
• Licencia comercial: 1 año (renovación anual)
• Patente comercial: 1 año
• Permiso sanitario: 1 año

💡 Consulta la ficha de cada servicio para detalles específicos.',
  '📅 **Validité des Documents**

La durée de validité des documents varie:

📋 **Documents d''Identité:**
• DNI: 10 ans
• Passeport: 5 ans
• Permis de conduire: 5 ans

📋 **Licences Commerciales:**
• Licence commerciale: 1 an (renouvellement annuel)
• Patente commerciale: 1 an
• Permis sanitaire: 1 an

💡 Consultez la fiche de chaque service pour les détails spécifiques.',
  '📅 **Document Validity**

Document validity varies:

📋 **Identity Documents:**
• DNI: 10 years
• Passport: 5 years
• Driver''s license: 5 years

📋 **Commercial Licenses:**
• Commercial license: 1 year (annual renewal)
• Trade patent: 1 year
• Sanitary permit: 1 year

💡 Check each service details for specific information.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-costs',
  '(cuanto cuesta|how much|combien coute|precio|price|prix|costo|cost|coût|tarifa|fee|tarif)',
  'get_price',
  '💰 **Costos de Servicios**

Los costos varían según el servicio:

**Documentos personales:** 5,000 - 50,000 XAF
**Licencias profesionales:** 25,000 - 100,000 XAF
**Permisos empresariales:** 80,000 - 500,000 XAF
**Servicios aduaneros:** Variable según mercancía

💡 Cada servicio muestra el costo exacto en su ficha.
🔍 Usa la búsqueda para encontrar el servicio específico.',
  '💰 **Coûts des Services**

Les coûts varient selon le service:

**Documents personnels:** 5 000 - 50 000 XAF
**Licences professionnelles:** 25 000 - 100 000 XAF
**Permis d''entreprise:** 80 000 - 500 000 XAF
**Services douaniers:** Variable selon marchandise

💡 Chaque service affiche le coût exact sur sa fiche.
🔍 Utilisez la recherche pour trouver le service spécifique.',
  '💰 **Service Costs**

Costs vary by service:

**Personal documents:** 5,000 - 50,000 XAF
**Professional licenses:** 25,000 - 100,000 XAF
**Business permits:** 80,000 - 500,000 XAF
**Customs services:** Variable by goods

💡 Each service shows exact cost on its details page.
🔍 Use search to find the specific service.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_price"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-requirements',
  '(que documentos necesito|what documents|quels documents|requisitos|requirements|exigences|que necesito|what do i need|de quoi j ai besoin)',
  'get_documents',
  '📄 **Requisitos Documentales**

Los documentos requeridos varían según el servicio:

**Documentos comunes:**
• DNI o pasaporte válido
• Fotografías recientes
• Comprobante de domicilio
• Comprobante de pago

💡 Cada servicio lista los documentos específicos en su ficha.
🔍 Busca el servicio para ver la lista completa.',
  '📄 **Exigences Documentaires**

Les documents requis varient selon le service:

**Documents courants:**
• DNI ou passeport valide
• Photos récentes
• Justificatif de domicile
• Justificatif de paiement

💡 Chaque service liste les documents spécifiques sur sa fiche.
🔍 Recherchez le service pour voir la liste complète.',
  '📄 **Documentary Requirements**

Required documents vary by service:

**Common documents:**
• Valid DNI or passport
• Recent photographs
• Proof of address
• Payment receipt

💡 Each service lists specific documents on its details page.
🔍 Search for the service to see complete list.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_documents"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-office-hours',
  '(horario|schedule|horaire|cuando abren|when open|quand ouvert|hora atencion|office hours|heures ouverture)',
  'get_general_info',
  '🕐 **Horarios de Atención**

**Horario general:**
📅 Lunes a Viernes: 8:00 - 16:00
📅 Sábado y Domingo: Cerrado

**Días festivos:** Cerrado

⚠️ Algunos servicios tienen horarios especiales
⏰ Se recomienda llegar temprano (antes de las 14:00)

💡 Verifica en la ficha del servicio si hay horarios especiales.',
  '🕐 **Heures d''Ouverture**

**Horaire général:**
📅 Lundi au Vendredi: 8h00 - 16h00
📅 Samedi et Dimanche: Fermé

**Jours fériés:** Fermé

⚠️ Certains services ont des horaires spéciaux
⏰ Recommandé d''arriver tôt (avant 14h00)

💡 Vérifiez sur la fiche du service s''il y a des horaires spéciaux.',
  '🕐 **Office Hours**

**General schedule:**
📅 Monday to Friday: 8:00 AM - 4:00 PM
📅 Saturday and Sunday: Closed

**Public holidays:** Closed

⚠️ Some services have special hours
⏰ Recommended to arrive early (before 2:00 PM)

💡 Check service details for special hours.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-complaints',
  '(queja|complaint|plainte|reclamacion|claim|réclamation|problema|problem|problème)',
  'get_general_info',
  '📞 **Quejas y Reclamaciones**

Si tienes un problema con tu trámite:

1️⃣ **Libro de reclamaciones:** Disponible en todas las oficinas
2️⃣ **Contacto telefónico:** Llama a la oficina correspondiente
3️⃣ **Email institucional:** Envía tu reclamación por escrito
4️⃣ **Atención presencial:** Solicita hablar con un supervisor

⏱️ **Plazo de respuesta:** 15 días hábiles

💡 Guarda siempre tu número de expediente y recibos.',
  '📞 **Plaintes et Réclamations**

Si vous avez un problème avec votre démarche:

1️⃣ **Livre de réclamations:** Disponible dans tous les bureaux
2️⃣ **Contact téléphonique:** Appelez le bureau concerné
3️⃣ **Email institutionnel:** Envoyez votre réclamation par écrit
4️⃣ **Assistance en personne:** Demandez à parler à un superviseur

⏱️ **Délai de réponse:** 15 jours ouvrables

💡 Conservez toujours votre numéro de dossier et reçus.',
  '📞 **Complaints and Claims**

If you have a problem with your procedure:

1️⃣ **Complaint book:** Available at all offices
2️⃣ **Phone contact:** Call the corresponding office
3️⃣ **Institutional email:** Send your complaint in writing
4️⃣ **In-person assistance:** Request to speak with supervisor

⏱️ **Response time:** 15 business days

💡 Always keep your file number and receipts.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-online',
  '(online|en linea|en ligne|internet|digital|web|portal)',
  'get_general_info',
  '💻 **Servicios en Línea**

**Actualmente disponible:**
✅ Consulta de información de servicios (esta app)
✅ Cálculo de tasas fiscales
✅ Lista de documentos requeridos

**Próximamente:**
🚧 Pago en línea de servicios
🚧 Seguimiento de trámites online
🚧 Citas previas por internet

💡 Mantente actualizado revisando esta aplicación regularmente.',
  '💻 **Services en Ligne**

**Actuellement disponible:**
✅ Consultation d''informations sur les services (cette app)
✅ Calcul des taxes fiscales
✅ Liste des documents requis

**Prochainement:**
🚧 Paiement en ligne des services
🚧 Suivi des démarches en ligne
🚧 Rendez-vous préalables par internet

💡 Restez à jour en consultant cette application régulièrement.',
  '💻 **Online Services**

**Currently available:**
✅ Service information consultation (this app)
✅ Fiscal fee calculation
✅ Required documents list

**Coming soon:**
🚧 Online payment for services
🚧 Online procedure tracking
🚧 Internet appointment scheduling

💡 Stay updated by checking this app regularly.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-corrections',
  '(correccion|correction|error|mistake|erreur|cambio|change|changement|modificar|modify|modifier)',
  'get_general_info',
  '✏️ **Corrección de Errores**

Si tu documento tiene errores:

1️⃣ **Errores menores:** Solicita corrección gratuita dentro de 30 días
2️⃣ **Errores de oficina:** Corrección sin costo adicional
3️⃣ **Cambios personales:** Puede requerir nuevo trámite

📋 **Documentos necesarios:**
• Documento con error
• Prueba del error (certificado original, etc.)
• Solicitud escrita

💡 Acude a la oficina emisora con la documentación.',
  '✏️ **Correction d''Erreurs**

Si votre document contient des erreurs:

1️⃣ **Erreurs mineures:** Demande de correction gratuite dans les 30 jours
2️⃣ **Erreurs du bureau:** Correction sans frais supplémentaires
3️⃣ **Changements personnels:** Peut nécessiter une nouvelle démarche

📋 **Documents nécessaires:**
• Document avec erreur
• Preuve de l''erreur (certificat original, etc.)
• Demande écrite

💡 Rendez-vous au bureau émetteur avec la documentation.',
  '✏️ **Error Correction**

If your document has errors:

1️⃣ **Minor errors:** Request free correction within 30 days
2️⃣ **Office errors:** Correction at no additional cost
3️⃣ **Personal changes:** May require new procedure

📋 **Required documents:**
• Document with error
• Proof of error (original certificate, etc.)
• Written request

💡 Go to issuing office with documentation.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-appeals',
  '(apelacion|appeal|appel|recurso|recourse|recours|denegar|denied|refusé)',
  'get_general_info',
  '⚖️ **Apelaciones y Recursos**

Si tu solicitud fue denegada:

1️⃣ **Plazo:** 15 días hábiles desde la notificación
2️⃣ **Documentación:** Copia de la denegación + nuevas pruebas
3️⃣ **Presentación:** En la misma oficina que denegó

📋 **El recurso debe incluir:**
• Motivos de la apelación
• Documentación adicional
• Solicitud formal escrita

💡 Se recomienda asesoría legal para casos complejos.',
  '⚖️ **Appels et Recours**

Si votre demande a été refusée:

1️⃣ **Délai:** 15 jours ouvrables depuis la notification
2️⃣ **Documentation:** Copie du refus + nouvelles preuves
3️⃣ **Présentation:** Dans le même bureau qui a refusé

📋 **Le recours doit inclure:**
• Motifs de l''appel
• Documentation supplémentaire
• Demande formelle écrite

💡 Conseil juridique recommandé pour les cas complexes.',
  '⚖️ **Appeals and Recourse**

If your application was denied:

1️⃣ **Deadline:** 15 business days from notification
2️⃣ **Documentation:** Copy of denial + new evidence
3️⃣ **Submission:** At the same office that denied

📋 **The appeal must include:**
• Grounds for appeal
• Additional documentation
• Formal written request

💡 Legal advice recommended for complex cases.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-assistance',
  '(ayuda|help|aide|asistencia|assistance|soporte|support|contacto|contact)',
  'get_general_info',
  '🆘 **Asistencia y Ayuda**

¿Necesitas ayuda con tus trámites?

📞 **Línea de atención:** [Número disponible en oficinas]
✉️ **Email:** info@taxasge.gq
🏛️ **Atención presencial:** Oficinas gubernamentales

**Este asistente puede ayudarte con:**
✅ Información sobre servicios
✅ Requisitos y documentos
✅ Costos y plazos
✅ Ubicación de oficinas

💡 Para trámites urgentes, acude directamente a la oficina.',
  '🆘 **Assistance et Aide**

Besoin d''aide avec vos démarches?

📞 **Ligne d''assistance:** [Numéro disponible dans les bureaux]
✉️ **Email:** info@taxasge.gq
🏛️ **Assistance en personne:** Bureaux gouvernementaux

**Cet assistant peut vous aider avec:**
✅ Informations sur les services
✅ Exigences et documents
✅ Coûts et délais
✅ Emplacement des bureaux

💡 Pour les démarches urgentes, rendez-vous directement au bureau.',
  '🆘 **Assistance and Help**

Need help with your procedures?

📞 **Helpline:** [Number available at offices]
✉️ **Email:** info@taxasge.gq
🏛️ **In-person assistance:** Government offices

**This assistant can help you with:**
✅ Service information
✅ Requirements and documents
✅ Costs and deadlines
✅ Office locations

💡 For urgent procedures, go directly to the office.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);

INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-proc-renewals',
  '(renovacion|renewal|renouvellement|renovar|renew|renouveler|extender|extend|prolonger)',
  'get_general_info',
  '🔄 **Renovaciones**

Para renovar documentos o licencias:

⏰ **Cuándo renovar:**
• Antes de la fecha de vencimiento
• Algunos servicios permiten renovación 60 días antes

💰 **Costos:**
• Generalmente 20-30% menos que expedición nueva
• Verifica la ficha de cada servicio

📋 **Documentos comunes:**
• Documento vencido o por vencer
• DNI vigente
• Comprobante de pago

💡 Evita multas renovando a tiempo.',
  '🔄 **Renouvellements**

Pour renouveler documents ou licences:

⏰ **Quand renouveler:**
• Avant la date d''expiration
• Certains services permettent renouvellement 60 jours avant

💰 **Coûts:**
• Généralement 20-30% moins cher que nouvelle expédition
• Vérifiez la fiche de chaque service

📋 **Documents courants:**
• Document expiré ou sur le point d''expirer
• DNI en vigueur
• Justificatif de paiement

💡 Évitez les amendes en renouvelant à temps.',
  '🔄 **Renewals**

To renew documents or licenses:

⏰ **When to renew:**
• Before expiration date
• Some services allow renewal 60 days early

💰 **Costs:**
• Generally 20-30% less than new issuance
• Check each service details

📋 **Common documents:**
• Expired or expiring document
• Valid DNI
• Payment receipt

💡 Avoid fines by renewing on time.',
  '["Buscar servicios","Ver servicios populares","Usar calculadora"]',
  NULL,
  '["get_general_info"]',
  8,
  1
);
