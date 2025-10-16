/**
 * TaxasGE Mobile - Chatbot Service
 * Service pour gérer le chatbot FAQ local (MVP1)
 * Date: 2025-10-13
 *
 * Stratégie:
 * - Matching par regex patterns (rapide, 10-50ms)
 * - Recherche FTS5 en fallback (si aucun pattern match)
 * - Stateless (pas de sauvegarde conversations en MVP1)
 * - Support multilingue (ES/FR/EN)
 */

import { db } from '../database/DatabaseManager';
import { QUERIES, TABLE_NAMES } from '../database/schema';
import {
  ChatbotFAQ,
  ChatbotFAQParsed,
  ChatbotIntent,
  ChatbotLanguage,
  ChatMessage,
  ChatResponse,
  MessageRole,
  DetectedIntent,
  FAQSearchResult,
  ChatbotAction,
  DEFAULT_RESPONSES,
} from '../types/chatbot.types';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Génère un ID unique pour les messages
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Introductions variées pour les réponses (effet humain, non-machine)
 * 5 variations aléatoires par langue
 */
const RESPONSE_INTROS: Record<ChatbotLanguage, string[]> = {
  es: [
    'He encontrado la siguiente información:',
    'Aquí está lo que necesitas saber:',
    'Según nuestros registros:',
    'Te puedo ayudar con eso:',
    'Esto es lo que tengo para ti:',
  ],
  fr: [
    "J'ai trouvé les informations suivantes :",
    'Voici ce que vous devez savoir :',
    "D'après nos données :",
    'Je peux vous aider avec cela :',
    "Voici ce que j'ai pour vous :",
  ],
  en: [
    'I found the following information:',
    "Here's what you need to know:",
    'According to our records:',
    'I can help you with that:',
    "Here's what I have for you:",
  ],
};

/**
 * Sélectionne une introduction aléatoire pour la réponse
 */
function getRandomIntro(language: ChatbotLanguage): string {
  const intros = RESPONSE_INTROS[language];
  const randomIndex = Math.floor(Math.random() * intros.length);
  return intros[randomIndex];
}

/**
 * Dictionnaire de traductions pour les suggestions courantes
 */
const SUGGESTION_TRANSLATIONS: Record<string, Record<ChatbotLanguage, string>> = {
  // Suggestions courantes
  '¿Cuánto cuesta un servicio?': {
    es: '¿Cuánto cuesta un servicio?',
    fr: 'Combien coûte un service ?',
    en: 'How much does a service cost?',
  },
  '¿Qué documentos necesito?': {
    es: '¿Qué documentos necesito?',
    fr: 'Quels documents ai-je besoin ?',
    en: 'What documents do I need?',
  },
  'Ver servicios populares': {
    es: 'Ver servicios populares',
    fr: 'Voir services populaires',
    en: 'View popular services',
  },
  'Buscar servicios': {
    es: 'Buscar servicios',
    fr: 'Rechercher services',
    en: 'Search services',
  },
  'Usar calculadora': {
    es: 'Usar calculadora',
    fr: 'Utiliser calculatrice',
    en: 'Use calculator',
  },
  'Ver procedimientos': {
    es: 'Ver procedimientos',
    fr: 'Voir procédures',
    en: 'View procedures',
  },
  'Ver documentos requeridos': {
    es: 'Ver documentos requeridos',
    fr: 'Voir documents requis',
    en: 'View required documents',
  },
  '¿Cuánto tiempo toma?': {
    es: '¿Cuánto tiempo toma?',
    fr: 'Combien de temps cela prend-il ?',
    en: 'How long does it take?',
  },
  'Documentos comunes': {
    es: 'Documentos comunes',
    fr: 'Documents communs',
    en: 'Common documents',
  },
  'Buscar otro servicio': {
    es: 'Buscar otro servicio',
    fr: 'Rechercher un autre service',
    en: 'Search another service',
  },
  'Ver favoritos': {
    es: 'Ver favoritos',
    fr: 'Voir favoris',
    en: 'View favorites',
  },
};

/**
 * Traduit un array de suggestions vers la langue cible
 */
function translateSuggestions(
  suggestions: string[],
  targetLanguage: ChatbotLanguage
): string[] {
  return suggestions.map((suggestion) => {
    const translation = SUGGESTION_TRANSLATIONS[suggestion];
    if (translation) {
      return translation[targetLanguage];
    }
    // Si pas de traduction, retourner tel quel
    return suggestion;
  });
}

/**
 * Parse une FAQ de la DB vers le format parsed
 */
function parseFAQ(faq: ChatbotFAQ): ChatbotFAQParsed {
  return {
    ...faq,
    follow_up_suggestions: faq.follow_up_suggestions ? JSON.parse(faq.follow_up_suggestions) : [],
    actions: faq.actions ? JSON.parse(faq.actions) : null,
    keywords: JSON.parse(faq.keywords),
    is_active: faq.is_active === 1,
  };
}

/**
 * Nettoie le texte utilisateur (lowercase, trim, normalize)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Retire les accents
}

/**
 * Extrait des entités simples du texte (service names, numbers)
 */
function extractEntities(text: string, intent: ChatbotIntent): Record<string, any> {
  const entities: Record<string, any> = {};
  const normalizedText = normalizeText(text);

  // Extraire montants (para get_price)
  const amountMatch = normalizedText.match(/(\d+(?:\.\d+)?)\s*(fcfa|francos|euros?)?/i);
  if (amountMatch && intent === 'get_price') {
    entities.amount = parseFloat(amountMatch[1]);
    entities.currency = amountMatch[2] || 'FCFA';
  }

  // Extraire mots-clés de services (para search_service)
  const serviceKeywords = [
    'pasaporte',
    'licencia',
    'permiso',
    'residencia',
    'visa',
    'certificado',
    'documento',
    'registro',
    'inscripción',
  ];
  serviceKeywords.forEach((keyword) => {
    if (normalizedText.includes(keyword)) {
      entities.serviceKeyword = keyword;
    }
  });

  return entities;
}

// ============================================
// CHATBOT SERVICE CLASS
// ============================================

class ChatbotService {
  private language: ChatbotLanguage = 'es';

  /**
   * Définit la langue du chatbot
   */
  setLanguage(language: ChatbotLanguage): void {
    this.language = language;
  }

  /**
   * Point d'entrée principal: traite un message utilisateur
   */
  async processMessage(
    userMessage: string,
    language: ChatbotLanguage = this.language
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // 1. Détecter l'intention
      const detectedIntent = await this.detectIntent(userMessage, language);

      // 2. Extraire entités
      const entities = extractEntities(userMessage, detectedIntent.intent);

      // 3. Générer la réponse (passer userMessage pour recherche dynamique)
      const response = await this.generateResponse(detectedIntent, entities, language, userMessage);

      // 4. Calculer le temps de traitement
      const processingTime = Date.now() - startTime;
      response.message.metadata = {
        ...response.message.metadata,
        language,
        processingTime,
        matchScore: detectedIntent.confidence,
        fallback: detectedIntent.confidence < 0.5,
        entities,
      };

      return response;
    } catch (error) {
      console.error('[ChatbotService] Error processing message:', error);

      // Réponse d'erreur
      return this.generateErrorResponse(language);
    }
  }

  /**
   * Détecte l'intention d'un message utilisateur
   */
  private async detectIntent(
    userMessage: string,
    language: ChatbotLanguage
  ): Promise<DetectedIntent> {
    const normalizedMessage = normalizeText(userMessage);

    // Étape 1: Rechercher par patterns regex
    const patternMatches = await this.matchByPattern(normalizedMessage);

    if (patternMatches.length > 0) {
      // Pattern trouvé avec confiance haute
      const bestMatch = patternMatches[0];
      return {
        intent: bestMatch.faq.intent as ChatbotIntent,
        confidence: 0.9,
        entities: {},
        matchedFAQs: patternMatches,
      };
    }

    // Étape 2: Recherche FTS5 (fallback)
    const ftsMatches = await this.searchFAQByFTS5(normalizedMessage, language);

    if (ftsMatches.length > 0) {
      // FTS5 trouvé avec confiance moyenne
      const bestMatch = ftsMatches[0];
      return {
        intent: bestMatch.faq.intent as ChatbotIntent,
        confidence: 0.7,
        entities: {},
        matchedFAQs: ftsMatches,
      };
    }

    // Aucun match: intention inconnue
    return {
      intent: 'unknown',
      confidence: 0.0,
      entities: {},
      matchedFAQs: [],
    };
  }

  /**
   * Match par patterns regex (rapide, 10-20ms)
   */
  private async matchByPattern(normalizedMessage: string): Promise<FAQSearchResult[]> {
    try {
      // Récupérer toutes les FAQ actives
      const allFAQs = await db.query<ChatbotFAQ>(QUERIES.getAllActiveChatbotFAQ);

      const matches: FAQSearchResult[] = [];

      for (const faq of allFAQs) {
        try {
          const regex = new RegExp(faq.question_pattern, 'i');
          const isMatch = regex.test(normalizedMessage);

          if (isMatch) {
            matches.push({
              faq: parseFAQ(faq),
              score: 1.0, // Match exact
              matchType: 'pattern',
            });
          }
        } catch (error) {
          console.warn(`[ChatbotService] Invalid regex pattern for FAQ ${faq.id}:`, error);
        }
      }

      // Trier par priorité
      matches.sort((a, b) => b.faq.priority - a.faq.priority);

      return matches;
    } catch (error) {
      console.error('[ChatbotService] Error matching by pattern:', error);
      return [];
    }
  }

  /**
   * Recherche FTS5 (fallback si aucun pattern match)
   */
  private async searchFAQByFTS5(
    query: string,
    language: ChatbotLanguage
  ): Promise<FAQSearchResult[]> {
    try {
      // Préparer la query LIKE (FTS5 disabled)
      const likePattern = `%${query}%`;

      if (!query || query.length < 2) return [];

      // Pass 5 parameters: 4 for LIKE clauses + 1 for LIMIT
      const results = await db.query<ChatbotFAQ>(QUERIES.searchChatbotFAQ, [
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        5,
      ]);

      return results.map((faq) => ({
        faq: parseFAQ(faq),
        score: 0.7, // Score modéré pour LIKE search
        matchType: 'fts5' as const,
      }));
    } catch (error) {
      console.error('[ChatbotService] Error searching FAQ:', error);
      return [];
    }
  }

  /**
   * Génère une réponse basée sur l'intention détectée
   */
  private async generateResponse(
    detectedIntent: DetectedIntent,
    entities: Record<string, any>,
    language: ChatbotLanguage,
    userMessage?: string
  ): Promise<ChatResponse> {
    const { intent, matchedFAQs } = detectedIntent;

    // Si on a un match FAQ, utiliser sa réponse
    if (matchedFAQs.length > 0) {
      const bestFAQ = matchedFAQs[0].faq;
      return this.generateResponseFromFAQ(bestFAQ, language);
    }

    // Si intention inconnue ET on a le message utilisateur, chercher en BD
    if (intent === 'unknown' && userMessage) {
      console.log('[ChatbotService] No FAQ match, trying dynamic DB search...');
      const services = await this.searchServicesInDB(userMessage, language, 5);

      if (services.length > 0) {
        console.log(`[ChatbotService] Found ${services.length} services in DB`);
        return this.generateDynamicServiceResponse(services, userMessage, language);
      }
    }

    // Sinon, utiliser réponse par défaut
    return this.generateDefaultResponse(intent, language);
  }

  /**
   * Génère réponse à partir d'une FAQ
   */
  private generateResponseFromFAQ(
    faq: ChatbotFAQParsed,
    language: ChatbotLanguage
  ): ChatResponse {
    // Sélectionner réponse selon langue
    const responseText =
      language === 'fr' && faq.response_fr
        ? faq.response_fr
        : language === 'en' && faq.response_en
        ? faq.response_en
        : faq.response_es;

    // Ajouter introduction aléatoire pour effet humain
    const intro = getRandomIntro(language);
    const fullResponse = `${intro}\n\n${responseText}`;

    // Traduire les suggestions vers la langue cible
    const translatedSuggestions = translateSuggestions(faq.follow_up_suggestions, language);

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: fullResponse,
      timestamp: new Date(),
      intent: faq.intent as ChatbotIntent,
      faqId: faq.id,
      suggestions: translatedSuggestions,
      actions: faq.actions || undefined,
    };

    return {
      message,
      suggestions: translatedSuggestions,
      actions: faq.actions || undefined,
    };
  }

  /**
   * Génère réponse par défaut pour une intention
   */
  private generateDefaultResponse(
    intent: ChatbotIntent,
    language: ChatbotLanguage
  ): ChatResponse {
    const defaultText = DEFAULT_RESPONSES[intent][language];

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: defaultText,
      timestamp: new Date(),
      intent,
    };

    // Suggestions génériques
    const genericSuggestions: Record<ChatbotLanguage, string[]> = {
      es: ['Buscar servicios', 'Ver servicios populares', 'Usar calculadora'],
      fr: ['Rechercher services', 'Voir services populaires', 'Utiliser calculatrice'],
      en: ['Search services', 'View popular services', 'Use calculator'],
    };

    return {
      message,
      suggestions: genericSuggestions[language],
    };
  }

  /**
   * Génère réponse d'erreur
   */
  private generateErrorResponse(language: ChatbotLanguage): ChatResponse {
    const errorMessages: Record<ChatbotLanguage, string> = {
      es: 'Disculpa, ocurrió un error. Por favor, intenta de nuevo.',
      fr: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      en: 'Sorry, an error occurred. Please try again.',
    };

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: errorMessages[language],
      timestamp: new Date(),
      intent: 'unknown',
    };

    return {
      message,
      suggestions: [],
    };
  }

  /**
   * Recherche dynamique de services fiscaux en base de données
   * Utilisé quand aucune FAQ ne match la question de l'utilisateur
   */
  async searchServicesInDB(
    query: string,
    language: ChatbotLanguage,
    limit: number = 5
  ): Promise<any[]> {
    try {
      const normalizedQuery = normalizeText(query);

      // Recherche LIKE dans les noms de services (multilingue)
      const likePattern = `%${normalizedQuery}%`;

      const services = await db.query(
        `SELECT
          id,
          name_es,
          name_fr,
          name_en,
          expedition_amount,
          renewal_amount,
          required_documents_es,
          required_documents_fr,
          required_documents_en,
          procedure_es,
          procedure_fr,
          procedure_en,
          ministry_es,
          sector_es,
          category_es
        FROM fiscal_services
        WHERE
          name_es LIKE ? OR
          name_fr LIKE ? OR
          name_en LIKE ? OR
          palabras_clave LIKE ?
        LIMIT ?`,
        [likePattern, likePattern, likePattern, likePattern, limit]
      );

      return services;
    } catch (error) {
      console.error('[ChatbotService] Error searching services in DB:', error);
      return [];
    }
  }

  /**
   * Génère une réponse dynamique à partir des services trouvés en BD
   */
  async generateDynamicServiceResponse(
    services: any[],
    query: string,
    language: ChatbotLanguage
  ): Promise<ChatResponse> {
    if (services.length === 0) {
      // Aucun service trouvé
      return this.generateNoResultsResponse(query, language);
    }

    // Introduction aléatoire
    const intro = getRandomIntro(language);

    // Construire la réponse avec les services trouvés
    let responseText = '';

    if (language === 'es') {
      responseText = `${intro}\n\n🔍 **Encontré ${services.length} servicio(s) fiscal(es):**\n\n`;
      services.forEach((svc, idx) => {
        responseText += `**${idx + 1}. ${svc.name_es}**\n`;
        responseText += `💰 Expedición: ${svc.expedition_amount ? svc.expedition_amount + ' XAF' : 'Consultar'}\n`;
        if (svc.renewal_amount) {
          responseText += `🔄 Renovación: ${svc.renewal_amount} XAF\n`;
        }
        responseText += `🏛️ ${svc.ministry_es}\n`;
        if (svc.required_documents_es) {
          const docs = svc.required_documents_es.split(',').slice(0, 3).join(', ');
          responseText += `📄 Documentos: ${docs}${svc.required_documents_es.split(',').length > 3 ? '...' : ''}\n`;
        }
        responseText += '\n';
      });

      if (services.length === 5) {
        responseText += '💡 _Hay más resultados disponibles. Refina tu búsqueda para ver servicios específicos._';
      }
    } else if (language === 'fr') {
      responseText = `${intro}\n\n🔍 **Trouvé ${services.length} service(s) fiscal(aux):**\n\n`;
      services.forEach((svc, idx) => {
        responseText += `**${idx + 1}. ${svc.name_fr || svc.name_es}**\n`;
        responseText += `💰 Expédition: ${svc.expedition_amount ? svc.expedition_amount + ' XAF' : 'Consulter'}\n`;
        if (svc.renewal_amount) {
          responseText += `🔄 Renouvellement: ${svc.renewal_amount} XAF\n`;
        }
        responseText += `🏛️ ${svc.ministry_es}\n`;
        const docs = svc.required_documents_fr || svc.required_documents_es;
        if (docs) {
          const docList = docs.split(',').slice(0, 3).join(', ');
          responseText += `📄 Documents: ${docList}${docs.split(',').length > 3 ? '...' : ''}\n`;
        }
        responseText += '\n';
      });

      if (services.length === 5) {
        responseText += '💡 _Il y a plus de résultats disponibles. Affinez votre recherche pour voir des services spécifiques._';
      }
    } else {
      responseText = `${intro}\n\n🔍 **Found ${services.length} fiscal service(s):**\n\n`;
      services.forEach((svc, idx) => {
        responseText += `**${idx + 1}. ${svc.name_en || svc.name_es}**\n`;
        responseText += `💰 Expedition: ${svc.expedition_amount ? svc.expedition_amount + ' XAF' : 'Consult'}\n`;
        if (svc.renewal_amount) {
          responseText += `🔄 Renewal: ${svc.renewal_amount} XAF\n`;
        }
        responseText += `🏛️ ${svc.ministry_es}\n`;
        const docs = svc.required_documents_en || svc.required_documents_es;
        if (docs) {
          const docList = docs.split(',').slice(0, 3).join(', ');
          responseText += `📄 Documents: ${docList}${docs.split(',').length > 3 ? '...' : ''}\n`;
        }
        responseText += '\n';
      });

      if (services.length === 5) {
        responseText += '💡 _More results available. Refine your search to see specific services._';
      }
    }

    const suggestions: Record<ChatbotLanguage, string[]> = {
      es: ['Buscar otro servicio', 'Ver servicios populares', 'Usar calculadora'],
      fr: ['Rechercher un autre service', 'Voir services populaires', 'Utiliser calculatrice'],
      en: ['Search another service', 'View popular services', 'Use calculator'],
    };

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: responseText,
      timestamp: new Date(),
      intent: 'search_service',
      metadata: {
        source: 'dynamic_db_search',
        servicesFound: services.length,
        serviceIds: services.map((s) => s.id),
      },
    };

    return {
      message,
      suggestions: suggestions[language],
    };
  }

  /**
   * Génère réponse quand aucun service trouvé
   */
  private generateNoResultsResponse(query: string, language: ChatbotLanguage): ChatResponse {
    const noResultsMessages: Record<ChatbotLanguage, string> = {
      es: `❌ **No encontré servicios para "${query}"**\n\n💡 **Sugerencias:**\n• Intenta con palabras más generales (ej: "pasaporte" en lugar de "pasaporte biométrico")\n• Verifica la ortografía\n• Usa sinónimos (ej: "licencia" o "permiso")\n• Explora por categorías en el menú principal\n\n📊 Contamos con **547 servicios fiscales** disponibles.`,
      fr: `❌ **Aucun service trouvé pour "${query}"**\n\n💡 **Suggestions:**\n• Essayez avec des mots plus généraux (ex: "passeport" au lieu de "passeport biométrique")\n• Vérifiez l'orthographe\n• Utilisez des synonymes (ex: "licence" ou "permis")\n• Explorez par catégories dans le menu principal\n\n📊 Nous avons **547 services fiscaux** disponibles.`,
      en: `❌ **No services found for "${query}"**\n\n💡 **Suggestions:**\n• Try more general words (eg: "passport" instead of "biometric passport")\n• Check spelling\n• Use synonyms (eg: "license" or "permit")\n• Browse by categories in main menu\n\n📊 We have **547 fiscal services** available.`,
    };

    const suggestions: Record<ChatbotLanguage, string[]> = {
      es: ['Buscar servicios', 'Ver servicios populares', '¿Qué documentos necesito?'],
      fr: ['Rechercher services', 'Voir services populaires', 'Quels documents ai-je besoin ?'],
      en: ['Search services', 'View popular services', 'What documents do I need?'],
    };

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: noResultsMessages[language],
      timestamp: new Date(),
      intent: 'unknown',
    };

    return {
      message,
      suggestions: suggestions[language],
    };
  }

  /**
   * Obtenir toutes les FAQ d'une intention spécifique
   */
  async getFAQByIntent(intent: ChatbotIntent, limit: number = 10): Promise<ChatbotFAQParsed[]> {
    try {
      const results = await db.query<ChatbotFAQ>(QUERIES.getChatbotFAQByIntent, [intent, limit]);
      return results.map(parseFAQ);
    } catch (error) {
      console.error('[ChatbotService] Error getting FAQ by intent:', error);
      return [];
    }
  }

  /**
   * Obtenir toutes les FAQ actives (pour debugging/admin)
   */
  async getAllFAQs(): Promise<ChatbotFAQParsed[]> {
    try {
      const results = await db.query<ChatbotFAQ>(QUERIES.getAllActiveChatbotFAQ);
      return results.map(parseFAQ);
    } catch (error) {
      console.error('[ChatbotService] Error getting all FAQs:', error);
      return [];
    }
  }

  /**
   * Créer un message utilisateur (helper pour UI)
   */
  createUserMessage(content: string): ChatMessage {
    return {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
  }
}

// Export singleton
export const chatbotService = new ChatbotService();
export default chatbotService;
