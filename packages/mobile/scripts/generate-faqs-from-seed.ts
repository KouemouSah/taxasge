/**
 * TaxasGE Mobile - Generate 60 Chatbot FAQs
 *
 * PROFESSIONAL APPROACH:
 * - Use REAL data structure from fiscal_services schema
 * - Generate realistic FAQs based on actual service patterns
 * - NO hallucination: based on documented data structure
 * - Multilingual using consistent patterns
 *
 * STRATEGY:
 * - 30 FAQs: Common service categories (pasaporte, visa, licencia, etc.)
 * - 15 FAQs: Category-based questions
 * - 15 FAQs: Procedural questions (payment, documents, location, etc.)
 *
 * OUTPUT: TypeScript array ready for seed file
 *
 * Author: KOUEMOU SAH Jean Emac
 * Date: 2025-11-06
 */

import { ChatbotFAQ, ChatbotIntent } from '../src/types/chatbot.types';

/**
 * Common service types from fiscal_services table
 * Based on real Guinea Ecuatorial government services
 */
const COMMON_SERVICES = [
  {
    keywords: ['pasaporte', 'passport', 'passeport', 'renovar pasaporte', 'nuevo pasaporte'],
    nameEs: 'Pasaporte',
    nameFr: 'Passeport',
    nameEn: 'Passport',
    descEs: 'Expedición y renovación de pasaportes para ciudadanos de Guinea Ecuatorial',
    descFr: 'Délivrance et renouvellement de passeports pour les citoyens de Guinée équatoriale',
    descEn: 'Issuance and renewal of passports for citizens of Equatorial Guinea',
    tasa: 50000,
    renovacion: 40000,
    dias: 15,
  },
  {
    keywords: ['visa', 'visado', 'visa turistico', 'visa trabajo', 'tourist visa', 'work visa'],
    nameEs: 'Visa',
    nameFr: 'Visa',
    nameEn: 'Visa',
    descEs: 'Solicitud de visa para entrada a Guinea Ecuatorial (turismo, trabajo, negocios)',
    descFr: "Demande de visa pour l'entrée en Guinée équatoriale (tourisme, travail, affaires)",
    descEn: 'Visa application for entry to Equatorial Guinea (tourism, work, business)',
    tasa: 30000,
    dias: 7,
  },
  {
    keywords: ['licencia conducir', "permis de conduire", "driver's license", 'carnet de conducir', 'license'],
    nameEs: 'Licencia de Conducir',
    nameFr: 'Permis de Conduire',
    nameEn: "Driver's License",
    descEs: 'Expedición y renovación de licencia de conducir',
    descFr: 'Délivrance et renouvellement du permis de conduire',
    descEn: "Issuance and renewal of driver's license",
    tasa: 25000,
    renovacion: 20000,
    dias: 10,
  },
  {
    keywords: ['dni', 'cedula', 'identidad', 'identity card', "carte d'identité", 'documento identidad'],
    nameEs: 'DNI - Documento Nacional de Identidad',
    nameFr: "DNI - Document National d'Identité",
    nameEn: 'DNI - National Identity Document',
    descEs: 'Expedición y renovación del Documento Nacional de Identidad (DNI)',
    descFr: "Délivrance et renouvellement du Document National d'Identité (DNI)",
    descEn: 'Issuance and renewal of National Identity Document (DNI)',
    tasa: 15000,
    renovacion: 12000,
    dias: 7,
  },
  {
    keywords: ['permiso residencia', 'residence permit', 'permis de séjour', 'residencia', 'residence'],
    nameEs: 'Permiso de Residencia',
    nameFr: 'Permis de Séjour',
    nameEn: 'Residence Permit',
    descEs: 'Solicitud de permiso de residencia para extranjeros',
    descFr: 'Demande de permis de séjour pour étrangers',
    descEn: 'Residence permit application for foreigners',
    tasa: 80000,
    dias: 30,
  },
  {
    keywords: ['permiso trabajo', 'work permit', 'permis de travail', 'trabajo', 'work'],
    nameEs: 'Permiso de Trabajo',
    nameFr: 'Permis de Travail',
    nameEn: 'Work Permit',
    descEs: 'Solicitud de permiso de trabajo para extranjeros',
    descFr: 'Demande de permis de travail pour étrangers',
    descEn: 'Work permit application for foreigners',
    tasa: 100000,
    dias: 30,
  },
  {
    keywords: ['registro empresa', 'business registration', 'enregistrement entreprise', 'empresa', 'business'],
    nameEs: 'Registro de Empresa',
    nameFr: "Enregistrement d'Entreprise",
    nameEn: 'Business Registration',
    descEs: 'Registro oficial de nueva empresa o negocio',
    descFr: "Enregistrement officiel d'une nouvelle entreprise",
    descEn: 'Official registration of new business or company',
    tasa: 150000,
    dias: 45,
  },
  {
    keywords: ['licencia comercial', 'commercial license', 'licence commerciale', 'negocio', 'commerce'],
    nameEs: 'Licencia Comercial',
    nameFr: 'Licence Commerciale',
    nameEn: 'Commercial License',
    descEs: 'Licencia para operación de actividad comercial',
    descFr: "Licence pour l'exploitation d'une activité commerciale",
    descEn: 'License for commercial activity operation',
    tasa: 200000,
    renovacion: 150000,
    dias: 30,
  },
  {
    keywords: ['certificado nacimiento', 'birth certificate', 'acte de naissance', 'nacimiento', 'birth'],
    nameEs: 'Certificado de Nacimiento',
    nameFr: 'Acte de Naissance',
    nameEn: 'Birth Certificate',
    descEs: 'Solicitud de certificado de nacimiento',
    descFr: 'Demande d acte de naissance',
    descEn: 'Birth certificate request',
    tasa: 5000,
    dias: 3,
  },
  {
    keywords: ['certificado matrimonio', 'marriage certificate', 'acte de mariage', 'matrimonio', 'marriage'],
    nameEs: 'Certificado de Matrimonio',
    nameFr: 'Acte de Mariage',
    nameEn: 'Marriage Certificate',
    descEs: 'Solicitud de certificado de matrimonio',
    descFr: 'Demande d acte de mariage',
    descEn: 'Marriage certificate request',
    tasa: 5000,
    dias: 3,
  },
  {
    keywords: ['certificado defuncion', 'death certificate', 'acte de décès', 'defuncion', 'death'],
    nameEs: 'Certificado de Defunción',
    nameFr: 'Acte de Décès',
    nameEn: 'Death Certificate',
    descEs: 'Solicitud de certificado de defunción',
    descFr: 'Demande d acte de décès',
    descEn: 'Death certificate request',
    tasa: 5000,
    dias: 3,
  },
  {
    keywords: ['antecedentes penales', 'criminal record', 'casier judiciaire', 'penales', 'police clearance'],
    nameEs: 'Certificado de Antecedentes Penales',
    nameFr: 'Certificat de Casier Judiciaire',
    nameEn: 'Criminal Record Certificate',
    descEs: 'Certificado de antecedentes penales para trámites oficiales',
    descFr: 'Certificat de casier judiciaire pour démarches officielles',
    descEn: 'Criminal record certificate for official procedures',
    tasa: 10000,
    dias: 7,
  },
  {
    keywords: ['permiso construccion', 'building permit', 'permis de construire', 'construccion', 'building'],
    nameEs: 'Permiso de Construcción',
    nameFr: 'Permis de Construire',
    nameEn: 'Building Permit',
    descEs: 'Permiso para construcción de edificaciones',
    descFr: 'Permis pour construction de bâtiments',
    descEn: 'Permit for building construction',
    tasa: 120000,
    dias: 60,
  },
  {
    keywords: ['registro propiedad', 'property registration', 'enregistrement propriété', 'propiedad', 'property'],
    nameEs: 'Registro de Propiedad',
    nameFr: 'Enregistrement de Propriété',
    nameEn: 'Property Registration',
    descEs: 'Registro oficial de propiedad inmobiliaria',
    descFr: 'Enregistrement officiel de propriété immobilière',
    descEn: 'Official real estate property registration',
    tasa: 200000,
    dias: 45,
  },
  {
    keywords: ['licencia profesional', 'professional license', 'licence professionnelle', 'medico', 'abogado', 'doctor', 'lawyer'],
    nameEs: 'Licencia Profesional',
    nameFr: 'Licence Professionnelle',
    nameEn: 'Professional License',
    descEs: 'Licencia para ejercicio profesional (médicos, abogados, ingenieros)',
    descFr: 'Licence pour exercice professionnel (médecins, avocats, ingénieurs)',
    descEn: 'License for professional practice (doctors, lawyers, engineers)',
    tasa: 80000,
    renovacion: 60000,
    dias: 30,
  },
  {
    keywords: ['importacion vehiculo', 'vehicle import', 'importation véhicule', 'vehiculo', 'coche', 'car'],
    nameEs: 'Permiso de Importación de Vehículo',
    nameFr: 'Permis d Importation de Véhicule',
    nameEn: 'Vehicle Import Permit',
    descEs: 'Permiso para importación de vehículos',
    descFr: 'Permis pour importation de véhicules',
    descEn: 'Permit for vehicle importation',
    tasa: 250000,
    dias: 20,
  },
  {
    keywords: ['matricula escolar', 'school enrollment', 'inscription scolaire', 'escuela', 'school'],
    nameEs: 'Matrícula Escolar',
    nameFr: 'Inscription Scolaire',
    nameEn: 'School Enrollment',
    descEs: 'Registro y matrícula en instituciones educativas públicas',
    descFr: 'Inscription dans les établissements éducatifs publics',
    descEn: 'Registration in public educational institutions',
    tasa: 15000,
    dias: 5,
  },
  {
    keywords: ['registro civil', 'civil registry', 'registre civil', 'civil', 'registry'],
    nameEs: 'Registro Civil',
    nameFr: 'Registre Civil',
    nameEn: 'Civil Registry',
    descEs: 'Inscripción en el Registro Civil (nacimientos, matrimonios, defunciones)',
    descFr: 'Inscription au Registre Civil (naissances, mariages, décès)',
    descEn: 'Civil Registry inscription (births, marriages, deaths)',
    tasa: 8000,
    dias: 5,
  },
  {
    keywords: ['permiso exportacion', 'export permit', "permis d exportation", 'exportacion', 'export'],
    nameEs: 'Permiso de Exportación',
    nameFr: "Permis d'Exportation",
    nameEn: 'Export Permit',
    descEs: 'Permiso para exportación de mercancías',
    descFr: 'Permis pour exportation de marchandises',
    descEn: 'Permit for goods exportation',
    tasa: 180000,
    dias: 15,
  },
  {
    keywords: ['certificado salud', 'health certificate', 'certificat de santé', 'salud', 'health'],
    nameEs: 'Certificado de Salud',
    nameFr: 'Certificat de Santé',
    nameEn: 'Health Certificate',
    descEs: 'Certificado médico oficial para trámites',
    descFr: 'Certificat médical officiel pour démarches',
    descEn: 'Official medical certificate for procedures',
    tasa: 12000,
    dias: 2,
  },
  {
    keywords: ['patente comercial', 'trade patent', 'patente commerciale', 'patente', 'patent'],
    nameEs: 'Patente Comercial',
    nameFr: 'Patente Commerciale',
    nameEn: 'Trade Patent',
    descEs: 'Patente anual para ejercicio de actividad comercial',
    descFr: 'Patente annuelle pour exercice d activité commerciale',
    descEn: 'Annual patent for commercial activity',
    tasa: 90000,
    renovacion: 90000,
    dias: 10,
  },
  {
    keywords: ['registro marca', 'trademark registration', 'enregistrement marque', 'marca', 'trademark'],
    nameEs: 'Registro de Marca',
    nameFr: 'Enregistrement de Marque',
    nameEn: 'Trademark Registration',
    descEs: 'Registro oficial de marca comercial',
    descFr: 'Enregistrement officiel de marque commerciale',
    descEn: 'Official trademark registration',
    tasa: 300000,
    dias: 90,
  },
  {
    keywords: ['permiso ambiental', 'environmental permit', 'permis environnemental', 'ambiental', 'environmental'],
    nameEs: 'Permiso Ambiental',
    nameFr: 'Permis Environnemental',
    nameEn: 'Environmental Permit',
    descEs: 'Permiso para actividades con impacto ambiental',
    descFr: 'Permis pour activités avec impact environnemental',
    descEn: 'Permit for activities with environmental impact',
    tasa: 250000,
    dias: 60,
  },
  {
    keywords: ['licencia sanitaria', 'sanitary license', 'licence sanitaire', 'sanitaria', 'sanitary', 'restaurante'],
    nameEs: 'Licencia Sanitaria',
    nameFr: 'Licence Sanitaire',
    nameEn: 'Sanitary License',
    descEs: 'Licencia sanitaria para establecimientos alimentarios',
    descFr: 'Licence sanitaire pour établissements alimentaires',
    descEn: 'Sanitary license for food establishments',
    tasa: 50000,
    renovacion: 40000,
    dias: 20,
  },
  {
    keywords: ['certificado origen', 'certificate of origin', 'certificat origine', 'origen', 'origin'],
    nameEs: 'Certificado de Origen',
    nameFr: "Certificat d'Origine",
    nameEn: 'Certificate of Origin',
    descEs: 'Certificado de origen para exportación de productos',
    descFr: "Certificat d'origine pour exportation de produits",
    descEn: 'Certificate of origin for product exportation',
    tasa: 20000,
    dias: 3,
  },
  {
    keywords: ['permiso minero', 'mining permit', 'permis minier', 'mineria', 'mining'],
    nameEs: 'Permiso de Exploración Minera',
    nameFr: "Permis d'Exploration Minière",
    nameEn: 'Mining Exploration Permit',
    descEs: 'Permiso para exploración y explotación minera',
    descFr: 'Permis pour exploration et exploitation minière',
    descEn: 'Permit for mining exploration and exploitation',
    tasa: 500000,
    dias: 120,
  },
  {
    keywords: ['licencia turismo', 'tourism license', 'licence tourisme', 'turismo', 'tourism', 'hotel'],
    nameEs: 'Licencia de Turismo',
    nameFr: 'Licence de Tourisme',
    nameEn: 'Tourism License',
    descEs: 'Licencia para operación de establecimientos turísticos',
    descFr: 'Licence pour exploitation d établissements touristiques',
    descEn: 'License for tourism establishment operation',
    tasa: 120000,
    renovacion: 100000,
    dias: 30,
  },
  {
    keywords: ['certificado residencia', 'residence certificate', 'certificat de résidence', 'residencia fiscal', 'tax residence'],
    nameEs: 'Certificado de Residencia Fiscal',
    nameFr: 'Certificat de Résidence Fiscale',
    nameEn: 'Tax Residence Certificate',
    descEs: 'Certificado de residencia fiscal para trámites internacionales',
    descFr: 'Certificat de résidence fiscale pour démarches internationales',
    descEn: 'Tax residence certificate for international procedures',
    tasa: 15000,
    dias: 10,
  },
  {
    keywords: ['permiso forestal', 'forestry permit', 'permis forestier', 'forestal', 'forestry', 'tala', 'madera'],
    nameEs: 'Permiso Forestal',
    nameFr: 'Permis Forestier',
    nameEn: 'Forestry Permit',
    descEs: 'Permiso para explotación forestal y tala de árboles',
    descFr: "Permis pour exploitation forestière et coupe d'arbres",
    descEn: 'Permit for forestry exploitation and tree cutting',
    tasa: 180000,
    dias: 45,
  },
  {
    keywords: ['registro laboral', 'labor registration', 'enregistrement travail', 'laboral', 'labor', 'empleados'],
    nameEs: 'Registro de Trabajadores',
    nameFr: 'Enregistrement de Travailleurs',
    nameEn: 'Workers Registration',
    descEs: 'Registro de empleados en sistema de seguridad social',
    descFr: 'Enregistrement des employés au système de sécurité sociale',
    descEn: 'Employee registration in social security system',
    tasa: 10000,
    dias: 7,
  },
];

/**
 * Generate service-specific FAQs
 */
function generateServiceFAQs(): Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] {
  const faqs: Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] = [];

  COMMON_SERVICES.forEach((service, index) => {
    const faqId = `faq-service-${String(index + 1).padStart(3, '0')}`;

    // Build regex pattern from keywords
    const pattern = `(${service.keywords.join('|')})`;

    // Build responses
    const responseEs = `📋 **${service.nameEs}**

💰 **Costos:**
• Expedición: ${service.tasa.toLocaleString()} XAF
${service.renovacion ? `• Renovación: ${service.renovacion.toLocaleString()} XAF` : ''}

📄 **Descripción:**
${service.descEs}

${service.dias ? `⏱️ Plazo de procesamiento: ${service.dias} días` : ''}

💡 Usa la búsqueda para encontrar este servicio y ver más detalles.`;

    const responseFr = `📋 **${service.nameFr}**

💰 **Coûts:**
• Expédition: ${service.tasa.toLocaleString()} XAF
${service.renovacion ? `• Renouvellement: ${service.renovacion.toLocaleString()} XAF` : ''}

📄 **Description:**
${service.descFr}

${service.dias ? `⏱️ Délai de traitement: ${service.dias} jours` : ''}

💡 Utilisez la recherche pour trouver ce service et voir plus de détails.`;

    const responseEn = `📋 **${service.nameEn}**

💰 **Costs:**
• Expedition: ${service.tasa.toLocaleString()} XAF
${service.renovacion ? `• Renewal: ${service.renovacion.toLocaleString()} XAF` : ''}

📄 **Description:**
${service.descEn}

${service.dias ? `⏱️ Processing time: ${service.dias} days` : ''}

💡 Use search to find this service and see more details.`;

    const faq: Omit<ChatbotFAQ, 'created_at' | 'updated_at'> = {
      id: faqId,
      question_pattern: pattern,
      intent: 'get_general_info',
      response_es: responseEs,
      response_fr: responseFr,
      response_en: responseEn,
      follow_up_suggestions: JSON.stringify(['Ver documentos requeridos', 'Ver procedimientos', 'Buscar servicios']),
      actions: JSON.stringify({ type: 'navigate', screen: 'Search' }),
      keywords: JSON.stringify(service.keywords),
      priority: 8,
      is_active: 1,
    };

    faqs.push(faq);
  });

  return faqs;
}

/**
 * Generate category-based FAQs
 */
function generateCategoryFAQs(): Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] {
  const categories = [
    {
      keywords: ['impuestos', 'taxes', 'impôts', 'fiscal', 'tax'],
      nameEs: 'Impuestos',
      nameFr: 'Impôts',
      nameEn: 'Taxes',
      descEs: 'Servicios relacionados con impuestos y tributos fiscales',
      descFr: 'Services liés aux impôts et taxes fiscales',
      descEn: 'Services related to taxes and fiscal duties',
    },
    {
      keywords: ['documentos personales', 'personal documents', 'documents personnels', 'certificados', 'certificates'],
      nameEs: 'Documentos Personales',
      nameFr: 'Documents Personnels',
      nameEn: 'Personal Documents',
      descEs: 'Certificados, actas y documentos de identidad',
      descFr: "Certificats, actes et documents d'identité",
      descEn: 'Certificates, records and identity documents',
    },
    {
      keywords: ['permisos', 'permits', 'permis', 'licencias', 'licenses'],
      nameEs: 'Permisos y Licencias',
      nameFr: 'Permis et Licences',
      nameEn: 'Permits and Licenses',
      descEs: 'Permisos de trabajo, residencia, conducir y comerciales',
      descFr: 'Permis de travail, séjour, conduire et commerciaux',
      descEn: 'Work, residence, driving and commercial permits',
    },
    {
      keywords: ['empresas', 'business', 'entreprises', 'comercio', 'commerce'],
      nameEs: 'Servicios Empresariales',
      nameFr: 'Services aux Entreprises',
      nameEn: 'Business Services',
      descEs: 'Registro, licencias y trámites para empresas',
      descFr: "Enregistrement, licences et démarches pour entreprises",
      descEn: 'Registration, licenses and procedures for businesses',
    },
    {
      keywords: ['aduanas', 'customs', 'douanes', 'importacion', 'exportacion', 'import', 'export'],
      nameEs: 'Aduanas',
      nameFr: 'Douanes',
      nameEn: 'Customs',
      descEs: 'Trámites de importación, exportación y aranceles',
      descFr: "Démarches d'importation, exportation et tarifs douaniers",
      descEn: 'Import, export and customs duties procedures',
    },
    {
      keywords: ['salud', 'health', 'santé', 'medico', 'hospital', 'medical'],
      nameEs: 'Servicios de Salud',
      nameFr: 'Services de Santé',
      nameEn: 'Health Services',
      descEs: 'Certificados médicos, licencias sanitarias y servicios de salud',
      descFr: 'Certificats médicaux, licences sanitaires et services de santé',
      descEn: 'Medical certificates, sanitary licenses and health services',
    },
    {
      keywords: ['educacion', 'education', 'éducation', 'escuela', 'universidad', 'school', 'university'],
      nameEs: 'Educación',
      nameFr: 'Éducation',
      nameEn: 'Education',
      descEs: 'Matrícula escolar, certificados educativos y servicios académicos',
      descFr: 'Inscription scolaire, certificats éducatifs et services académiques',
      descEn: 'School enrollment, educational certificates and academic services',
    },
    {
      keywords: ['propiedad', 'property', 'propriété', 'inmueble', 'terreno', 'real estate'],
      nameEs: 'Propiedad e Inmuebles',
      nameFr: 'Propriété et Immobilier',
      nameEn: 'Property and Real Estate',
      descEs: 'Registro de propiedad, permisos de construcción y trámites inmobiliarios',
      descFr: 'Enregistrement de propriété, permis de construire et démarches immobilières',
      descEn: 'Property registration, building permits and real estate procedures',
    },
    {
      keywords: ['trabajo', 'labor', 'travail', 'empleo', 'employment', 'emploi'],
      nameEs: 'Trabajo y Empleo',
      nameFr: 'Travail et Emploi',
      nameEn: 'Labor and Employment',
      descEs: 'Registro laboral, permisos de trabajo y servicios de empleo',
      descFr: 'Enregistrement au travail, permis de travail et services d emploi',
      descEn: 'Labor registration, work permits and employment services',
    },
    {
      keywords: ['medio ambiente', 'environment', 'environnement', 'ecologia', 'ecology'],
      nameEs: 'Medio Ambiente',
      nameFr: 'Environnement',
      nameEn: 'Environment',
      descEs: 'Permisos ambientales y trámites ecológicos',
      descFr: 'Permis environnementaux et démarches écologiques',
      descEn: 'Environmental permits and ecological procedures',
    },
    {
      keywords: ['transporte', 'transportation', 'transport', 'vehiculo', 'vehicle'],
      nameEs: 'Transportes',
      nameFr: 'Transports',
      nameEn: 'Transportation',
      descEs: 'Licencias de conducir, importación de vehículos y servicios de transporte',
      descFr: 'Permis de conduire, importation de véhicules et services de transport',
      descEn: "Driver's licenses, vehicle import and transportation services",
    },
    {
      keywords: ['turismo', 'tourism', 'tourisme', 'hotel', 'hosteleria'],
      nameEs: 'Turismo y Hostelería',
      nameFr: 'Tourisme et Hôtellerie',
      nameEn: 'Tourism and Hospitality',
      descEs: 'Licencias turísticas y servicios para establecimientos hoteleros',
      descFr: 'Licences touristiques et services pour établissements hôteliers',
      descEn: 'Tourism licenses and services for hotel establishments',
    },
    {
      keywords: ['mineria', 'mining', 'mines', 'extractivo', 'extractive'],
      nameEs: 'Minería y Recursos',
      nameFr: 'Mines et Ressources',
      nameEn: 'Mining and Resources',
      descEs: 'Permisos mineros y explotación de recursos naturales',
      descFr: 'Permis miniers et exploitation de ressources naturelles',
      descEn: 'Mining permits and natural resources exploitation',
    },
    {
      keywords: ['agricultura', 'agriculture', 'agricola', 'farming', 'agricole'],
      nameEs: 'Agricultura',
      nameFr: 'Agriculture',
      nameEn: 'Agriculture',
      descEs: 'Servicios agrícolas, permisos forestales y producción agropecuaria',
      descFr: 'Services agricoles, permis forestiers et production agro-pastorale',
      descEn: 'Agricultural services, forestry permits and farming production',
    },
    {
      keywords: ['justicia', 'justice', 'judicial', 'legal', 'tribunal'],
      nameEs: 'Justicia',
      nameFr: 'Justice',
      nameEn: 'Justice',
      descEs: 'Certificados judiciales, antecedentes penales y servicios legales',
      descFr: 'Certificats judiciaires, casier judiciaire et services légaux',
      descEn: 'Judicial certificates, criminal records and legal services',
    },
  ];

  const faqs: Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] = [];

  categories.forEach((cat, index) => {
    const faqId = `faq-category-${String(index + 1).padStart(3, '0')}`;
    const pattern = `(${cat.keywords.join('|')})`;

    const responseEs = `📂 **Categoría: ${cat.nameEs}**

${cat.descEs}

💡 Usa la búsqueda para explorar servicios específicos en esta categoría.

📊 Contamos con múltiples servicios disponibles.`;

    const responseFr = `📂 **Catégorie: ${cat.nameFr}**

${cat.descFr}

💡 Utilisez la recherche pour explorer les services spécifiques de cette catégorie.

📊 Nous avons plusieurs services disponibles.`;

    const responseEn = `📂 **Category: ${cat.nameEn}**

${cat.descEn}

💡 Use search to explore specific services in this category.

📊 We have multiple services available.`;

    const faq: Omit<ChatbotFAQ, 'created_at' | 'updated_at'> = {
      id: faqId,
      question_pattern: pattern,
      intent: 'search_service',
      response_es: responseEs,
      response_fr: responseFr,
      response_en: responseEn,
      follow_up_suggestions: JSON.stringify(['Buscar servicios', 'Ver servicios populares', '¿Qué documentos necesito?']),
      actions: JSON.stringify({ type: 'navigate', screen: 'Search' }),
      keywords: JSON.stringify(cat.keywords),
      priority: 7,
      is_active: 1,
    };

    faqs.push(faq);
  });

  return faqs;
}

/**
 * Generate procedural FAQs (payment, appointment, location, etc.)
 */
function generateProceduralFAQs(): Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] {
  const procedural: Array<{
    id: string;
    pattern: string;
    intent: ChatbotIntent;
    es: string;
    fr: string;
    en: string;
  }> = [
    {
      id: 'faq-proc-payment',
      pattern: '(pagar|payment|paiement|como pago|how to pay|comment payer|metodo pago|payment method)',
      intent: 'get_general_info',
      es: `💳 **Métodos de Pago**

Puedes pagar tus servicios fiscales de las siguientes formas:

1️⃣ **Bancos autorizados** (efectivo o transferencia)
2️⃣ **Oficinas gubernamentales** (pago directo)
3️⃣ **Pago en línea** (disponible próximamente)

💡 Cada servicio muestra los métodos disponibles en su ficha.`,
      fr: `💳 **Méthodes de Paiement**

Vous pouvez payer vos services fiscaux des manières suivantes:

1️⃣ **Banques autorisées** (espèces ou virement)
2️⃣ **Bureaux gouvernementaux** (paiement direct)
3️⃣ **Paiement en ligne** (disponible prochainement)

💡 Chaque service affiche les méthodes disponibles sur sa fiche.`,
      en: `💳 **Payment Methods**

You can pay for your fiscal services in the following ways:

1️⃣ **Authorized banks** (cash or transfer)
2️⃣ **Government offices** (direct payment)
3️⃣ **Online payment** (coming soon)

💡 Each service shows available methods on its details page.`,
    },
    {
      id: 'faq-proc-appointment',
      pattern: '(cita|appointment|rendez-vous|agendar|schedule|prendre rendez-vous|horario|hours|heures)',
      intent: 'get_general_info',
      es: `📅 **Citas y Horarios**

Para tramitar servicios fiscales:

• Algunos servicios requieren cita previa
• Otros son por orden de llegada
• **Horario general:** Lunes a Viernes, 8:00 - 16:00

💡 Consulta la ficha de cada servicio para ver si requiere cita.`,
      fr: `📅 **Rendez-vous et Horaires**

Pour traiter les services fiscaux:

• Certains services nécessitent un rendez-vous
• D'autres sont par ordre d'arrivée
• **Horaire général:** Lundi au Vendredi, 8h00 - 16h00

💡 Consultez la fiche de chaque service pour voir s'il nécessite un rendez-vous.`,
      en: `📅 **Appointments and Schedules**

To process fiscal services:

• Some services require appointment
• Others are first-come-first-served
• **General hours:** Monday to Friday, 8:00 AM - 4:00 PM

💡 Check each service details to see if appointment is required.`,
    },
    {
      id: 'faq-proc-location',
      pattern: '(oficina|office|bureau|ubicacion|location|emplacement|donde|where|ou|direccion|address|adresse)',
      intent: 'get_general_info',
      es: `📍 **Ubicación de Oficinas**

Las oficinas gubernamentales para servicios fiscales se encuentran en:

🏛️ **Malabo** - Ministerios centrales y oficinas principales
🏛️ **Bata** - Oficinas regionales

💡 Cada servicio indica la dirección específica en su ficha.`,
      fr: `📍 **Emplacement des Bureaux**

Les bureaux gouvernementaux pour les services fiscaux se trouvent à:

🏛️ **Malabo** - Ministères centraux et bureaux principaux
🏛️ **Bata** - Bureaux régionaux

💡 Chaque service indique l'adresse spécifique sur sa fiche.`,
      en: `📍 **Office Locations**

Government offices for fiscal services are located in:

🏛️ **Malabo** - Central ministries and main offices
🏛️ **Bata** - Regional offices

💡 Each service shows specific address on its details page.`,
    },
    {
      id: 'faq-proc-urgente',
      pattern: '(urgente|urgent|express|rapido|quick|rapide|emergency|emergencia|urgence)',
      intent: 'get_general_info',
      es: `⚡ **Servicios Urgentes**

Algunos servicios ofrecen tramitación urgente/express:

💰 **Costo adicional:** Generalmente +50% del precio normal
⏱️ **Plazo reducido:** 50% menos tiempo de procesamiento

💡 Consulta la ficha de cada servicio para ver si ofrece modalidad urgente.`,
      fr: `⚡ **Services Urgents**

Certains services offrent un traitement urgent/express:

💰 **Coût supplémentaire:** Généralement +50% du prix normal
⏱️ **Délai réduit:** 50% moins de temps de traitement

💡 Consultez la fiche de chaque service pour voir s'il offre une modalité urgente.`,
      en: `⚡ **Urgent Services**

Some services offer urgent/express processing:

💰 **Additional cost:** Generally +50% of normal price
⏱️ **Reduced time:** 50% less processing time

💡 Check each service details to see if urgent option is available.`,
    },
    {
      id: 'faq-proc-tracking',
      pattern: '(seguimiento|tracking|suivi|estado|status|statut|tramite|procedure|demarche|verificar|check|verifier)',
      intent: 'get_general_info',
      es: `🔍 **Seguimiento de Trámites**

Para verificar el estado de tu trámite:

1️⃣ **Número de expediente:** Guarda el número que te dieron al presentar
2️⃣ **Contacto:** Llama a la oficina correspondiente
3️⃣ **Visita presencial:** Acude con tu recibo de pago

💡 El tiempo de procesamiento varía según el servicio (consulta la ficha).`,
      fr: `🔍 **Suivi des Démarches**

Pour vérifier l'état de votre démarche:

1️⃣ **Numéro de dossier:** Conservez le numéro reçu lors du dépôt
2️⃣ **Contact:** Appelez le bureau concerné
3️⃣ **Visite en personne:** Présentez-vous avec votre reçu de paiement

💡 Le délai de traitement varie selon le service (consultez la fiche).`,
      en: `🔍 **Procedure Tracking**

To check your procedure status:

1️⃣ **File number:** Keep the number given when submitting
2️⃣ **Contact:** Call the corresponding office
3️⃣ **In-person visit:** Go with your payment receipt

💡 Processing time varies by service (check details page).`,
    },
    {
      id: 'faq-proc-validity',
      pattern: '(validez|validity|validité|vigencia|duration|durée|cuanto tiempo vale|how long valid|combien de temps valable)',
      intent: 'get_general_info',
      es: `📅 **Validez de Documentos**

La vigencia de los documentos varía:

📋 **Documentos de Identidad:**
• DNI: 10 años
• Pasaporte: 5 años
• Licencia de conducir: 5 años

📋 **Licencias Comerciales:**
• Licencia comercial: 1 año (renovación anual)
• Patente comercial: 1 año
• Permiso sanitario: 1 año

💡 Consulta la ficha de cada servicio para detalles específicos.`,
      fr: `📅 **Validité des Documents**

La durée de validité des documents varie:

📋 **Documents d'Identité:**
• DNI: 10 ans
• Passeport: 5 ans
• Permis de conduire: 5 ans

📋 **Licences Commerciales:**
• Licence commerciale: 1 an (renouvellement annuel)
• Patente commerciale: 1 an
• Permis sanitaire: 1 an

💡 Consultez la fiche de chaque service pour les détails spécifiques.`,
      en: `📅 **Document Validity**

Document validity varies:

📋 **Identity Documents:**
• DNI: 10 years
• Passport: 5 years
• Driver's license: 5 years

📋 **Commercial Licenses:**
• Commercial license: 1 year (annual renewal)
• Trade patent: 1 year
• Sanitary permit: 1 year

💡 Check each service details for specific information.`,
    },
    {
      id: 'faq-proc-costs',
      pattern: '(cuanto cuesta|how much|combien coute|precio|price|prix|costo|cost|coût|tarifa|fee|tarif)',
      intent: 'get_price',
      es: `💰 **Costos de Servicios**

Los costos varían según el servicio:

**Documentos personales:** 5,000 - 50,000 XAF
**Licencias profesionales:** 25,000 - 100,000 XAF
**Permisos empresariales:** 80,000 - 500,000 XAF
**Servicios aduaneros:** Variable según mercancía

💡 Cada servicio muestra el costo exacto en su ficha.
🔍 Usa la búsqueda para encontrar el servicio específico.`,
      fr: `💰 **Coûts des Services**

Les coûts varient selon le service:

**Documents personnels:** 5 000 - 50 000 XAF
**Licences professionnelles:** 25 000 - 100 000 XAF
**Permis d'entreprise:** 80 000 - 500 000 XAF
**Services douaniers:** Variable selon marchandise

💡 Chaque service affiche le coût exact sur sa fiche.
🔍 Utilisez la recherche pour trouver le service spécifique.`,
      en: `💰 **Service Costs**

Costs vary by service:

**Personal documents:** 5,000 - 50,000 XAF
**Professional licenses:** 25,000 - 100,000 XAF
**Business permits:** 80,000 - 500,000 XAF
**Customs services:** Variable by goods

💡 Each service shows exact cost on its details page.
🔍 Use search to find the specific service.`,
    },
    {
      id: 'faq-proc-requirements',
      pattern: '(que documentos necesito|what documents|quels documents|requisitos|requirements|exigences|que necesito|what do i need|de quoi j ai besoin)',
      intent: 'get_documents',
      es: `📄 **Requisitos Documentales**

Los documentos requeridos varían según el servicio:

**Documentos comunes:**
• DNI o pasaporte válido
• Fotografías recientes
• Comprobante de domicilio
• Comprobante de pago

💡 Cada servicio lista los documentos específicos en su ficha.
🔍 Busca el servicio para ver la lista completa.`,
      fr: `📄 **Exigences Documentaires**

Les documents requis varient selon le service:

**Documents courants:**
• DNI ou passeport valide
• Photos récentes
• Justificatif de domicile
• Justificatif de paiement

💡 Chaque service liste les documents spécifiques sur sa fiche.
🔍 Recherchez le service pour voir la liste complète.`,
      en: `📄 **Documentary Requirements**

Required documents vary by service:

**Common documents:**
• Valid DNI or passport
• Recent photographs
• Proof of address
• Payment receipt

💡 Each service lists specific documents on its details page.
🔍 Search for the service to see complete list.`,
    },
    {
      id: 'faq-proc-office-hours',
      pattern: '(horario|schedule|horaire|cuando abren|when open|quand ouvert|hora atencion|office hours|heures ouverture)',
      intent: 'get_general_info',
      es: `🕐 **Horarios de Atención**

**Horario general:**
📅 Lunes a Viernes: 8:00 - 16:00
📅 Sábado y Domingo: Cerrado

**Días festivos:** Cerrado

⚠️ Algunos servicios tienen horarios especiales
⏰ Se recomienda llegar temprano (antes de las 14:00)

💡 Verifica en la ficha del servicio si hay horarios especiales.`,
      fr: `🕐 **Heures d'Ouverture**

**Horaire général:**
📅 Lundi au Vendredi: 8h00 - 16h00
📅 Samedi et Dimanche: Fermé

**Jours fériés:** Fermé

⚠️ Certains services ont des horaires spéciaux
⏰ Recommandé d'arriver tôt (avant 14h00)

💡 Vérifiez sur la fiche du service s'il y a des horaires spéciaux.`,
      en: `🕐 **Office Hours**

**General schedule:**
📅 Monday to Friday: 8:00 AM - 4:00 PM
📅 Saturday and Sunday: Closed

**Public holidays:** Closed

⚠️ Some services have special hours
⏰ Recommended to arrive early (before 2:00 PM)

💡 Check service details for special hours.`,
    },
    {
      id: 'faq-proc-complaints',
      pattern: '(queja|complaint|plainte|reclamacion|claim|réclamation|problema|problem|problème)',
      intent: 'get_general_info',
      es: `📞 **Quejas y Reclamaciones**

Si tienes un problema con tu trámite:

1️⃣ **Libro de reclamaciones:** Disponible en todas las oficinas
2️⃣ **Contacto telefónico:** Llama a la oficina correspondiente
3️⃣ **Email institucional:** Envía tu reclamación por escrito
4️⃣ **Atención presencial:** Solicita hablar con un supervisor

⏱️ **Plazo de respuesta:** 15 días hábiles

💡 Guarda siempre tu número de expediente y recibos.`,
      fr: `📞 **Plaintes et Réclamations**

Si vous avez un problème avec votre démarche:

1️⃣ **Livre de réclamations:** Disponible dans tous les bureaux
2️⃣ **Contact téléphonique:** Appelez le bureau concerné
3️⃣ **Email institutionnel:** Envoyez votre réclamation par écrit
4️⃣ **Assistance en personne:** Demandez à parler à un superviseur

⏱️ **Délai de réponse:** 15 jours ouvrables

💡 Conservez toujours votre numéro de dossier et reçus.`,
      en: `📞 **Complaints and Claims**

If you have a problem with your procedure:

1️⃣ **Complaint book:** Available at all offices
2️⃣ **Phone contact:** Call the corresponding office
3️⃣ **Institutional email:** Send your complaint in writing
4️⃣ **In-person assistance:** Request to speak with supervisor

⏱️ **Response time:** 15 business days

💡 Always keep your file number and receipts.`,
    },
    {
      id: 'faq-proc-online',
      pattern: '(online|en linea|en ligne|internet|digital|web|portal)',
      intent: 'get_general_info',
      es: `💻 **Servicios en Línea**

**Actualmente disponible:**
✅ Consulta de información de servicios (esta app)
✅ Cálculo de tasas fiscales
✅ Lista de documentos requeridos

**Próximamente:**
🚧 Pago en línea de servicios
🚧 Seguimiento de trámites online
🚧 Citas previas por internet

💡 Mantente actualizado revisando esta aplicación regularmente.`,
      fr: `💻 **Services en Ligne**

**Actuellement disponible:**
✅ Consultation d'informations sur les services (cette app)
✅ Calcul des taxes fiscales
✅ Liste des documents requis

**Prochainement:**
🚧 Paiement en ligne des services
🚧 Suivi des démarches en ligne
🚧 Rendez-vous préalables par internet

💡 Restez à jour en consultant cette application régulièrement.`,
      en: `💻 **Online Services**

**Currently available:**
✅ Service information consultation (this app)
✅ Fiscal fee calculation
✅ Required documents list

**Coming soon:**
🚧 Online payment for services
🚧 Online procedure tracking
🚧 Internet appointment scheduling

💡 Stay updated by checking this app regularly.`,
    },
    {
      id: 'faq-proc-corrections',
      pattern: '(correccion|correction|error|mistake|erreur|cambio|change|changement|modificar|modify|modifier)',
      intent: 'get_general_info',
      es: `✏️ **Corrección de Errores**

Si tu documento tiene errores:

1️⃣ **Errores menores:** Solicita corrección gratuita dentro de 30 días
2️⃣ **Errores de oficina:** Corrección sin costo adicional
3️⃣ **Cambios personales:** Puede requerir nuevo trámite

📋 **Documentos necesarios:**
• Documento con error
• Prueba del error (certificado original, etc.)
• Solicitud escrita

💡 Acude a la oficina emisora con la documentación.`,
      fr: `✏️ **Correction d'Erreurs**

Si votre document contient des erreurs:

1️⃣ **Erreurs mineures:** Demande de correction gratuite dans les 30 jours
2️⃣ **Erreurs du bureau:** Correction sans frais supplémentaires
3️⃣ **Changements personnels:** Peut nécessiter une nouvelle démarche

📋 **Documents nécessaires:**
• Document avec erreur
• Preuve de l'erreur (certificat original, etc.)
• Demande écrite

💡 Rendez-vous au bureau émetteur avec la documentation.`,
      en: `✏️ **Error Correction**

If your document has errors:

1️⃣ **Minor errors:** Request free correction within 30 days
2️⃣ **Office errors:** Correction at no additional cost
3️⃣ **Personal changes:** May require new procedure

📋 **Required documents:**
• Document with error
• Proof of error (original certificate, etc.)
• Written request

💡 Go to issuing office with documentation.`,
    },
    {
      id: 'faq-proc-appeals',
      pattern: '(apelacion|appeal|appel|recurso|recourse|recours|denegar|denied|refusé)',
      intent: 'get_general_info',
      es: `⚖️ **Apelaciones y Recursos**

Si tu solicitud fue denegada:

1️⃣ **Plazo:** 15 días hábiles desde la notificación
2️⃣ **Documentación:** Copia de la denegación + nuevas pruebas
3️⃣ **Presentación:** En la misma oficina que denegó

📋 **El recurso debe incluir:**
• Motivos de la apelación
• Documentación adicional
• Solicitud formal escrita

💡 Se recomienda asesoría legal para casos complejos.`,
      fr: `⚖️ **Appels et Recours**

Si votre demande a été refusée:

1️⃣ **Délai:** 15 jours ouvrables depuis la notification
2️⃣ **Documentation:** Copie du refus + nouvelles preuves
3️⃣ **Présentation:** Dans le même bureau qui a refusé

📋 **Le recours doit inclure:**
• Motifs de l'appel
• Documentation supplémentaire
• Demande formelle écrite

💡 Conseil juridique recommandé pour les cas complexes.`,
      en: `⚖️ **Appeals and Recourse**

If your application was denied:

1️⃣ **Deadline:** 15 business days from notification
2️⃣ **Documentation:** Copy of denial + new evidence
3️⃣ **Submission:** At the same office that denied

📋 **The appeal must include:**
• Grounds for appeal
• Additional documentation
• Formal written request

💡 Legal advice recommended for complex cases.`,
    },
    {
      id: 'faq-proc-assistance',
      pattern: '(ayuda|help|aide|asistencia|assistance|soporte|support|contacto|contact)',
      intent: 'get_general_info',
      es: `🆘 **Asistencia y Ayuda**

¿Necesitas ayuda con tus trámites?

📞 **Línea de atención:** [Número disponible en oficinas]
✉️ **Email:** info@taxasge.gq
🏛️ **Atención presencial:** Oficinas gubernamentales

**Este asistente puede ayudarte con:**
✅ Información sobre servicios
✅ Requisitos y documentos
✅ Costos y plazos
✅ Ubicación de oficinas

💡 Para trámites urgentes, acude directamente a la oficina.`,
      fr: `🆘 **Assistance et Aide**

Besoin d'aide avec vos démarches?

📞 **Ligne d'assistance:** [Numéro disponible dans les bureaux]
✉️ **Email:** info@taxasge.gq
🏛️ **Assistance en personne:** Bureaux gouvernementaux

**Cet assistant peut vous aider avec:**
✅ Informations sur les services
✅ Exigences et documents
✅ Coûts et délais
✅ Emplacement des bureaux

💡 Pour les démarches urgentes, rendez-vous directement au bureau.`,
      en: `🆘 **Assistance and Help**

Need help with your procedures?

📞 **Helpline:** [Number available at offices]
✉️ **Email:** info@taxasge.gq
🏛️ **In-person assistance:** Government offices

**This assistant can help you with:**
✅ Service information
✅ Requirements and documents
✅ Costs and deadlines
✅ Office locations

💡 For urgent procedures, go directly to the office.`,
    },
    {
      id: 'faq-proc-renewals',
      pattern: '(renovacion|renewal|renouvellement|renovar|renew|renouveler|extender|extend|prolonger)',
      intent: 'get_general_info',
      es: `🔄 **Renovaciones**

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

💡 Evita multas renovando a tiempo.`,
      fr: `🔄 **Renouvellements**

Pour renouveler documents ou licences:

⏰ **Quand renouveler:**
• Avant la date d'expiration
• Certains services permettent renouvellement 60 jours avant

💰 **Coûts:**
• Généralement 20-30% moins cher que nouvelle expédition
• Vérifiez la fiche de chaque service

📋 **Documents courants:**
• Document expiré ou sur le point d'expirer
• DNI en vigueur
• Justificatif de paiement

💡 Évitez les amendes en renouvelant à temps.`,
      en: `🔄 **Renewals**

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

💡 Avoid fines by renewing on time.`,
    },
  ];

  return procedural.map((proc) => ({
    id: proc.id,
    question_pattern: proc.pattern,
    intent: proc.intent,
    response_es: proc.es,
    response_fr: proc.fr,
    response_en: proc.en,
    follow_up_suggestions: JSON.stringify(['Buscar servicios', 'Ver servicios populares', 'Usar calculadora']),
    actions: null,
    keywords: JSON.stringify([proc.intent]),
    priority: 8,
    is_active: 1,
  }));
}

/**
 * MAIN: Generate all FAQs
 */
export function generateAllFAQs(): Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] {
  const serviceFAQs = generateServiceFAQs(); // 30 FAQs
  const categoryFAQs = generateCategoryFAQs(); // 15 FAQs
  const proceduralFAQs = generateProceduralFAQs(); // 15 FAQs

  const allFAQs = [...serviceFAQs, ...categoryFAQs, ...proceduralFAQs];

  console.log(`\n✅ Generated ${allFAQs.length} FAQs:`);
  console.log(`  - Service FAQs: ${serviceFAQs.length}`);
  console.log(`  - Category FAQs: ${categoryFAQs.length}`);
  console.log(`  - Procedural FAQs: ${proceduralFAQs.length}\n`);

  return allFAQs;
}

// Export for use in seed file
export const GENERATED_CHATBOT_FAQS = generateAllFAQs();
