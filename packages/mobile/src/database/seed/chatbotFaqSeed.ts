/**
 * TaxasGE Mobile - Chatbot FAQ Seed Data
 * 7 FAQ exemples pour tester le chatbot local (MVP1)
 * Date: 2025-10-13
 * Updated: 2025-10-15 (Added calculate & search_service FAQs)
 */

import { ChatbotFAQ } from '../../types/chatbot.types';

/**
 * FAQ Seed Data (version TypeScript pour insertion programmatique)
 */
export const CHATBOT_FAQ_SEED_DATA: Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] = [
  // ============================================
  // 1. GREETING (Salutations)
  // ============================================
  {
    id: 'faq-greeting-001',
    question_pattern: '^(hola|buenos dias|buenas tardes|buenas noches|hey|hi|hello|salut|bonjour|bonsoir|good morning|good afternoon|good evening)',
    intent: 'greeting',
    response_es:
      '¡Hola! Soy TaxasBot, tu asistente fiscal para Guinea Ecuatorial. 👋\n\nPuedo ayudarte con:\n• Consultar precios de servicios fiscales\n• Ver procedimientos paso a paso\n• Conocer documentos requeridos\n• Calcular montos exactos\n\n¿En qué puedo ayudarte hoy?',
    response_fr:
      "Bonjour ! Je suis TaxasBot, votre assistant fiscal pour la Guinée équatoriale. 👋\n\nJe peux vous aider avec :\n• Consulter les prix des services fiscaux\n• Voir les procédures étape par étape\n• Connaître les documents requis\n• Calculer les montants exacts\n\nComment puis-je vous aider aujourd'hui ?",
    response_en:
      "Hello! I'm TaxasBot, your tax assistant for Equatorial Guinea. 👋\n\nI can help you with:\n• Check fiscal service prices\n• View step-by-step procedures\n• Know required documents\n• Calculate exact amounts\n\nHow can I help you today?",
    follow_up_suggestions: JSON.stringify([
      '¿Cuánto cuesta un servicio?',
      '¿Qué documentos necesito?',
      'Ver servicios populares',
    ]),
    actions: JSON.stringify({
      type: 'suggestions',
      items: [{ text: 'Ver servicios', action: 'navigate', screen: 'Services' }],
    }),
    keywords: JSON.stringify([
      'hola',
      'buenos días',
      'buenas tardes',
      'hey',
      'hi',
      'hello',
      'salut',
      'bonjour',
      'saludo',
      'greeting',
    ]),
    priority: 10,
    is_active: 1,
  },

  // ============================================
  // 2. GET_PRICE (Consulta de precios)
  // ============================================
  {
    id: 'faq-price-001',
    question_pattern:
      '(cuanto|precio|coste|costo|cost|price|prix|combien|tarifa|tasa|vale|valor|pagar|pago|payment|montant|importe)',
    intent: 'get_price',
    response_es:
      'Para consultar el precio de un servicio fiscal, puedes:\n\n1️⃣ **Buscar por nombre**: Usa la búsqueda principal para encontrar el servicio que necesitas.\n\n2️⃣ **Navegar por categorías**: Explora los servicios organizados por ministerio y sector.\n\n3️⃣ **Usar la calculadora**: Para servicios con cálculo dinámico (porcentajes, tarifas escalonadas).\n\n📊 Contamos con **547 servicios fiscales** en nuestra base de datos.\n\n¿Qué servicio te interesa?',
    response_fr:
      "Pour consulter le prix d'un service fiscal, vous pouvez :\n\n1️⃣ **Rechercher par nom** : Utilisez la recherche principale pour trouver le service dont vous avez besoin.\n\n2️⃣ **Naviguer par catégories** : Explorez les services organisés par ministère et secteur.\n\n3️⃣ **Utiliser la calculatrice** : Pour les services avec calcul dynamique (pourcentages, tarifs échelonnés).\n\n📊 Nous avons **547 services fiscaux** dans notre base de données.\n\nQuel service vous intéresse ?",
    response_en:
      'To check the price of a fiscal service, you can:\n\n1️⃣ **Search by name**: Use the main search to find the service you need.\n\n2️⃣ **Browse by categories**: Explore services organized by ministry and sector.\n\n3️⃣ **Use the calculator**: For services with dynamic calculation (percentages, tiered rates).\n\n📊 We have **547 fiscal services** in our database.\n\nWhich service are you interested in?',
    follow_up_suggestions: JSON.stringify([
      'Buscar servicios',
      'Ver servicios populares',
      'Usar calculadora',
    ]),
    actions: JSON.stringify({ type: 'navigate', screen: 'Search' }),
    keywords: JSON.stringify([
      'cuánto',
      'cuanto',
      'precio',
      'coste',
      'costo',
      'cost',
      'price',
      'prix',
      'combien',
      'tarifa',
      'tasa',
      'monto',
      'importe',
    ]),
    priority: 8,
    is_active: 1,
  },

  // ============================================
  // 3. GET_PROCEDURE (Consulta de procedimientos)
  // ============================================
  {
    id: 'faq-procedure-001',
    question_pattern:
      '(como|procedimiento|proceso|tramite|pasos|steps|procedure|etapas|hacer|obtener|sacar|solicitar|renovar|que hacer|how to|comment faire)',
    intent: 'get_procedure',
    response_es:
      '📋 **Procedimientos Fiscales**\n\nPara ver los pasos detallados de un trámite:\n\n1. Busca el servicio fiscal que necesitas\n2. Accede a la ficha del servicio\n3. Consulta la sección "Procedimiento"\n\nAllí encontrarás:\n✅ Pasos numerados y detallados\n⏱️ Tiempo estimado por paso\n📍 Ubicación de las oficinas\n💰 Costos adicionales (si aplican)\n\nTambién puedes ver procedimientos para:\n• Expedición (primera vez)\n• Renovación (actualización)\n\n¿Qué trámite necesitas realizar?',
    response_fr:
      "📋 **Procédures Fiscales**\n\nPour voir les étapes détaillées d'une démarche :\n\n1. Recherchez le service fiscal dont vous avez besoin\n2. Accédez à la fiche du service\n3. Consultez la section \"Procédure\"\n\nVous y trouverez :\n✅ Étapes numérotées et détaillées\n⏱️ Temps estimé par étape\n📍 Emplacement des bureaux\n💰 Coûts supplémentaires (le cas échéant)\n\nVous pouvez également voir les procédures pour :\n• Expédition (première fois)\n• Renouvellement (mise à jour)\n\nQuelle démarche devez-vous effectuer ?",
    response_en:
      '📋 **Fiscal Procedures**\n\nTo see detailed steps for a procedure:\n\n1. Search for the fiscal service you need\n2. Access the service details\n3. Check the "Procedure" section\n\nThere you will find:\n✅ Numbered and detailed steps\n⏱️ Estimated time per step\n📍 Office locations\n💰 Additional costs (if applicable)\n\nYou can also see procedures for:\n• Expedition (first time)\n• Renewal (update)\n\nWhat procedure do you need to do?',
    follow_up_suggestions: JSON.stringify([
      'Buscar servicios',
      'Ver documentos requeridos',
      '¿Cuánto tiempo toma?',
    ]),
    actions: JSON.stringify({ type: 'navigate', screen: 'Services' }),
    keywords: JSON.stringify([
      'cómo',
      'como',
      'procedimiento',
      'proceso',
      'trámite',
      'tramite',
      'pasos',
      'steps',
      'procédure',
      'procedure',
      'etapas',
      'hacer',
    ]),
    priority: 8,
    is_active: 1,
  },

  // ============================================
  // 4. GET_DOCUMENTS (Consulta de documentos)
  // ============================================
  {
    id: 'faq-documents-001',
    question_pattern:
      '(documentos|documents|papeles|requisitos|necesito|requiere|require|que documentos|que papeles|what documents|quels documents|exigences|requirement)',
    intent: 'get_documents',
    response_es:
      '📄 **Documentos Requeridos**\n\nPara cada servicio fiscal, puedes consultar:\n\n✅ **Documentos obligatorios**\n📋 Cantidad de copias necesarias\n🔄 Vigencia del documento\n💾 Formatos aceptados (digital/físico)\n\n**Cómo consultarlos:**\n1. Busca el servicio fiscal\n2. Ve a "Documentos requeridos"\n3. Filtra por: Expedición o Renovación\n\n💡 **Tip**: Algunos documentos son comunes para varios servicios (DNI, certificado de empadronamiento).\n\n¿Para qué servicio necesitas saber los documentos?',
    response_fr:
      '📄 **Documents Requis**\n\nPour chaque service fiscal, vous pouvez consulter :\n\n✅ **Documents obligatoires**\n📋 Nombre de copies nécessaires\n🔄 Validité du document\n💾 Formats acceptés (numérique/physique)\n\n**Comment les consulter :**\n1. Recherchez le service fiscal\n2. Allez à "Documents requis"\n3. Filtrez par : Expédition ou Renouvellement\n\n💡 **Astuce** : Certains documents sont communs à plusieurs services (DNI, certificat de résidence).\n\nPour quel service avez-vous besoin de connaître les documents ?',
    response_en:
      '📄 **Required Documents**\n\nFor each fiscal service, you can check:\n\n✅ **Mandatory documents**\n📋 Number of copies needed\n🔄 Document validity\n💾 Accepted formats (digital/physical)\n\n**How to check them:**\n1. Search for the fiscal service\n2. Go to "Required documents"\n3. Filter by: Expedition or Renewal\n\n💡 **Tip**: Some documents are common for several services (ID, residence certificate).\n\nFor which service do you need to know the documents?',
    follow_up_suggestions: JSON.stringify([
      'Buscar servicios',
      'Ver procedimientos',
      'Documentos comunes',
    ]),
    actions: JSON.stringify({ type: 'navigate', screen: 'Services' }),
    keywords: JSON.stringify([
      'documentos',
      'documents',
      'papeles',
      'requisitos',
      'necesito',
      'requiere',
      'require',
      'necesarios',
      'obligatorios',
    ]),
    priority: 8,
    is_active: 1,
  },

  // ============================================
  // 5. THANKS (Agradecimientos)
  // ============================================
  {
    id: 'faq-thanks-001',
    question_pattern: '(gracias|thank|merci|muchas gracias|thanks|thx|thank you|grazie|obrigado|excelente|perfecto|genial|muy bien)',
    intent: 'thanks',
    response_es:
      '¡De nada! 😊\n\nEstoy aquí para ayudarte con cualquier consulta fiscal.\n\nSi necesitas más información:\n• Explora los servicios por categoría\n• Usa la calculadora para montos exactos\n• Guarda tus servicios favoritos\n\n¿Hay algo más en lo que pueda ayudarte?',
    response_fr:
      "De rien ! 😊\n\nJe suis là pour vous aider avec toute question fiscale.\n\nSi vous avez besoin de plus d'informations :\n• Explorez les services par catégorie\n• Utilisez la calculatrice pour les montants exacts\n• Enregistrez vos services favoris\n\nPuis-je vous aider avec autre chose ?",
    response_en:
      "You're welcome! 😊\n\nI'm here to help you with any tax query.\n\nIf you need more information:\n• Explore services by category\n• Use the calculator for exact amounts\n• Save your favorite services\n\nIs there anything else I can help you with?",
    follow_up_suggestions: JSON.stringify([
      'Buscar otro servicio',
      'Usar calculadora',
      'Ver favoritos',
    ]),
    actions: null,
    keywords: JSON.stringify([
      'gracias',
      'thank',
      'merci',
      'muchas gracias',
      'thanks',
      'thx',
      'agradecimiento',
    ]),
    priority: 5,
    is_active: 1,
  },

  // ============================================
  // 6. CALCULATE (Calculadora)
  // ============================================
  {
    id: 'faq-calculate-001',
    question_pattern:
      '(calcul|calculadora|calculatrice|calculator|usar calculadora|utiliser calculatrice|use calculator)',
    intent: 'calculate',
    response_es:
      '🧮 **Calculadora Fiscal**\n\nLa calculadora te permite calcular montos exactos para servicios con:\n\n📊 **Tarifas dinámicas:**\n• Porcentajes (ej: 2% del valor declarado)\n• Tarifas escalonadas (según rangos)\n• Cálculos combinados\n\n**Cómo usarla:**\n1. Busca el servicio que necesitas\n2. Si tiene calculadora disponible, verás el botón "Calcular"\n3. Ingresa los valores solicitados\n4. Obtén el monto exacto a pagar\n\n💡 No todos los servicios tienen calculadora - algunos tienen precio fijo.\n\n¿Qué servicio quieres calcular?',
    response_fr:
      "🧮 **Calculatrice Fiscale**\n\nLa calculatrice vous permet de calculer les montants exacts pour les services avec :\n\n📊 **Tarifs dynamiques :**\n• Pourcentages (ex : 2% de la valeur déclarée)\n• Tarifs échelonnés (selon les tranches)\n• Calculs combinés\n\n**Comment l'utiliser :**\n1. Recherchez le service dont vous avez besoin\n2. Si la calculatrice est disponible, vous verrez le bouton \"Calculer\"\n3. Saisissez les valeurs demandées\n4. Obtenez le montant exact à payer\n\n💡 Tous les services n'ont pas de calculatrice - certains ont un prix fixe.\n\nQuel service voulez-vous calculer ?",
    response_en:
      '🧮 **Fiscal Calculator**\n\nThe calculator allows you to calculate exact amounts for services with:\n\n📊 **Dynamic rates:**\n• Percentages (eg: 2% of declared value)\n• Tiered rates (by ranges)\n• Combined calculations\n\n**How to use it:**\n1. Search for the service you need\n2. If calculator available, you will see "Calculate" button\n3. Enter requested values\n4. Get exact amount to pay\n\n💡 Not all services have calculator - some have fixed price.\n\nWhich service do you want to calculate?',
    follow_up_suggestions: JSON.stringify([
      'Buscar servicios',
      'Ver servicios populares',
      '¿Cuánto cuesta un servicio?',
    ]),
    actions: JSON.stringify({ type: 'navigate', screen: 'Services' }),
    keywords: JSON.stringify([
      'calcular',
      'calculadora',
      'calculator',
      'calculatrice',
      'calcul',
      'monto',
      'montant',
      'amount',
      'cuanto',
      'combien',
      'how much',
    ]),
    priority: 7,
    is_active: 1,
  },

  // ============================================
  // 7. SEARCH_SERVICE (Buscar servicios)
  // ============================================
  {
    id: 'faq-search-001',
    question_pattern:
      '(buscar|search|recherch|encontrar|find|trouver|servicios|services)',
    intent: 'search_service',
    response_es:
      '🔍 **Buscar Servicios Fiscales**\n\nPuedes encontrar servicios de varias formas:\n\n**1️⃣ Búsqueda directa:**\n• Usa la barra de búsqueda principal\n• Escribe palabras clave (pasaporte, licencia, etc.)\n• Resultados instantáneos mientras escribes\n\n**2️⃣ Navegación por categorías:**\n• Explora por Ministerio\n• Filtra por Sector\n• Ordenar por popularidad o precio\n\n**3️⃣ Servicios populares:**\n• Acceso rápido a los más consultados\n• Basado en búsquedas recientes\n\n📊 **547 servicios disponibles** en la base de datos.\n\n¿Qué servicio estás buscando?',
    response_fr:
      '🔍 **Rechercher Services Fiscaux**\n\nVous pouvez trouver des services de plusieurs façons :\n\n**1️⃣ Recherche directe :**\n• Utilisez la barre de recherche principale\n• Tapez des mots-clés (passeport, licence, etc.)\n• Résultats instantanés pendant la saisie\n\n**2️⃣ Navigation par catégories :**\n• Explorez par Ministère\n• Filtrez par Secteur\n• Triez par popularité ou prix\n\n**3️⃣ Services populaires :**\n• Accès rapide aux plus consultés\n• Basé sur les recherches récentes\n\n📊 **547 services disponibles** dans la base de données.\n\nQuel service cherchez-vous ?',
    response_en:
      '🔍 **Search Fiscal Services**\n\nYou can find services in several ways:\n\n**1️⃣ Direct search:**\n• Use the main search bar\n• Type keywords (passport, license, etc.)\n• Instant results while typing\n\n**2️⃣ Browse by categories:**\n• Explore by Ministry\n• Filter by Sector\n• Sort by popularity or price\n\n**3️⃣ Popular services:**\n• Quick access to most consulted\n• Based on recent searches\n\n📊 **547 services available** in the database.\n\nWhich service are you looking for?',
    follow_up_suggestions: JSON.stringify([
      'Ver servicios populares',
      '¿Cuánto cuesta un servicio?',
      'Ver documentos requeridos',
    ]),
    actions: JSON.stringify({ type: 'navigate', screen: 'Search' }),
    keywords: JSON.stringify([
      'buscar',
      'search',
      'rechercher',
      'encontrar',
      'find',
      'trouver',
      'servicios',
      'services',
      'explorar',
      'explore',
      'navegar',
    ]),
    priority: 7,
    is_active: 1,
  },
];

/**
 * Helper function to load FAQ seed data into database
 */
export async function loadChatbotFAQSeed(db: any): Promise<void> {
  console.log('[Seed] Loading chatbot FAQ seed data...');

  try {
    // Check if FAQ already loaded
    const existing = await db.query('SELECT COUNT(*) as count FROM chatbot_faq');
    const currentCount = existing[0]?.count || 0;

    console.log(`[Seed] Found ${currentCount} existing FAQs, expected ${CHATBOT_FAQ_SEED_DATA.length}`);

    // Si on a moins de 5 FAQs, vider et recharger
    if (currentCount < CHATBOT_FAQ_SEED_DATA.length) {
      console.log('[Seed] Incomplete FAQ data, clearing and reloading...');
      await db.execute('DELETE FROM chatbot_faq');

      // Insert FAQ seed data one by one (insertBatch has issues)
      for (const faq of CHATBOT_FAQ_SEED_DATA) {
        try {
          await db.execute(
            `INSERT INTO chatbot_faq (id, question_pattern, intent, response_es, response_fr, response_en,
             follow_up_suggestions, actions, keywords, priority, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              faq.id,
              faq.question_pattern,
              faq.intent,
              faq.response_es,
              faq.response_fr,
              faq.response_en,
              faq.follow_up_suggestions,
              faq.actions,
              faq.keywords,
              faq.priority,
              faq.is_active,
            ]
          );
          console.log(`[Seed] Inserted FAQ: ${faq.id}`);
        } catch (error) {
          console.error(`[Seed] Error inserting FAQ ${faq.id}:`, error);
        }
      }

      console.log(`[Seed] Loaded ${CHATBOT_FAQ_SEED_DATA.length} chatbot FAQs`);
    } else {
      console.log('[Seed] Chatbot FAQ already loaded, skipping...');
    }
  } catch (error) {
    console.error('[Seed] Error loading chatbot FAQ seed:', error);
    throw error;
  }
}
