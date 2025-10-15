/**
 * TaxasGE Mobile - Chatbot FAQ Seed Data
 * 5 FAQ exemples pour tester le chatbot local (MVP1)
 * Date: 2025-10-13
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
    question_pattern: '^(hola|buenos dias|buenas tardes|hey|hi|hello|salut|bonjour)',
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
      '(cuanto|precio|coste|costo|cost|price|prix|combien|tarifa|tasa)',
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
      '(como|procedimiento|proceso|tramite|pasos|steps|procedure)',
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
      '(documentos|documents|papeles|requisitos|necesito|requiere|require)',
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
    question_pattern: '(gracias|thank|merci|muchas gracias|thanks|thx)',
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
