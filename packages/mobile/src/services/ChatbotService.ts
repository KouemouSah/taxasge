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

      // 3. Générer la réponse
      const response = await this.generateResponse(detectedIntent, entities, language);

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

      console.log(`[ChatbotService] matchByPattern - normalizedMessage: "${normalizedMessage}"`);
      console.log(`[ChatbotService] matchByPattern - Found ${allFAQs.length} FAQs`);

      const matches: FAQSearchResult[] = [];

      for (const faq of allFAQs) {
        try {
          console.log(`[ChatbotService] Testing FAQ ${faq.id} with pattern: "${faq.question_pattern}"`);
          const regex = new RegExp(faq.question_pattern, 'i');
          const isMatch = regex.test(normalizedMessage);
          console.log(`[ChatbotService] Pattern match result: ${isMatch}`);

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

      console.log(`[ChatbotService] matchByPattern - Total matches: ${matches.length}`);

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
    language: ChatbotLanguage
  ): Promise<ChatResponse> {
    const { intent, matchedFAQs } = detectedIntent;

    // Si on a un match FAQ, utiliser sa réponse
    if (matchedFAQs.length > 0) {
      const bestFAQ = matchedFAQs[0].faq;
      return this.generateResponseFromFAQ(bestFAQ, language);
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

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: responseText,
      timestamp: new Date(),
      intent: faq.intent as ChatbotIntent,
      faqId: faq.id,
      suggestions: faq.follow_up_suggestions,
      actions: faq.actions || undefined,
    };

    return {
      message,
      suggestions: faq.follow_up_suggestions,
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
   * Recherche des services fiscaux liés à une query
   * (pour réponses enrichies avec suggestions de services)
   */
  async searchRelatedServices(query: string, limit: number = 3) {
    try {
      // Cette méthode sera utilisée pour enrichir les réponses
      // avec des services fiscaux pertinents
      // Pour l'instant, on retourne un array vide
      // TODO: Intégrer avec FiscalServicesService
      return [];
    } catch (error) {
      console.error('[ChatbotService] Error searching related services:', error);
      return [];
    }
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
