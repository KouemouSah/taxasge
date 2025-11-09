/**
 * TaxasGE Mobile - Chatbot Service
 * Service pour gérer le chatbot FAQ local (MVP1)
 * Date: 2025-10-13
 * Updated: 2025-11-06 - Fixed SQL queries to use TranslationService
 * Updated: 2025-11-07 - Added conversation context, spell correction, and synonyms
 *
 * CRITICAL FIXES:
 * - fiscal_services only has name_es (Spanish) - name_fr/name_en DON'T EXIST
 * - FR/EN translations are in entity_translations table
 * - Use TranslationService for all multilingual content
 * - Use proper JOINs for related data (ministries, categories, etc.)
 *
 * NEW FEATURES:
 * - Conversation context tracking (remembers last intent/service)
 * - Spell correction with Levenshtein distance
 * - Synonym handling for better query understanding
 *
 * Stratégie:
 * - Matching par regex patterns (rapide, 10-50ms)
 * - Recherche FTS5 en fallback (si aucun pattern match)
 * - Spell correction + synonym expansion before search
 * - Context-aware responses
 * - Support multilingue (ES/FR/EN via TranslationService)
 */

import { db } from '../database/DatabaseManager';
import { QUERIES, TABLE_NAMES } from '../database/schema';
import TranslationService from './TranslationService';
import { enhanceQuery, FISCAL_KEYWORDS } from '../utils/textUtils';
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
import {
  getRandomIntro,
  getSuggestion,
  getError,
  getServiceLabel,
  buildDynamicResponse,
  CHATBOT_I18N,
} from './chatbot/chatbot.i18n';

// ============================================
// TYPES
// ============================================

/**
 * Contexte de conversation pour tracking
 */
interface ConversationContext {
  lastIntent: ChatbotIntent;
  lastServiceCode?: string;
  lastServiceName?: string;
  lastCategoryId?: number;
  lastMinistryId?: number;
  lastEntities: Record<string, any>;
  messageCount: number;
  timestamp: number;
}

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
 * Convert suggestion keys to localized text
 * Uses CHATBOT_I18N for translations
 */
function localizeSuggestions(
  suggestionKeys: string[],
  language: ChatbotLanguage
): string[] {
  const suggestionMap: Record<string, keyof typeof CHATBOT_I18N.suggestions> = {
    'Buscar servicios': 'searchServices',
    'Ver servicios populares': 'viewPopular',
    'Usar calculadora': 'useCalculator',
    '¿Cuánto cuesta un servicio?': 'getPrice',
    '¿Qué documentos necesito?': 'getDocuments',
    'Ver procedimientos': 'viewProcedures',
    'Ver documentos requeridos': 'viewDocuments',
    '¿Cuánto tiempo toma?': 'getProcessingTime',
    'Documentos comunes': 'commonDocuments',
    'Buscar otro servicio': 'searchAnother',
    'Ver favoritos': 'viewFavorites',
  };

  return suggestionKeys.map((key) => {
    const mappedKey = suggestionMap[key];
    if (mappedKey) {
      return getSuggestion(mappedKey, language);
    }
    // If no mapping, return as-is (for custom suggestions)
    return key;
  });
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
  private context: ConversationContext | null = null;
  private readonly CONTEXT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Définit la langue du chatbot
   */
  setLanguage(language: ChatbotLanguage): void {
    this.language = language;
  }

  /**
   * Réinitialise le contexte de conversation
   */
  resetContext(): void {
    this.context = null;
  }

  /**
   * Vérifie si le contexte est encore valide
   */
  private isContextValid(): boolean {
    if (!this.context) return false;
    const now = Date.now();
    return (now - this.context.timestamp) < this.CONTEXT_EXPIRY_MS;
  }

  /**
   * Met à jour le contexte de conversation
   */
  private updateContext(
    intent: ChatbotIntent,
    entities: Record<string, any>,
    serviceCode?: string,
    serviceName?: string
  ): void {
    this.context = {
      lastIntent: intent,
      lastServiceCode: serviceCode,
      lastServiceName: serviceName,
      lastCategoryId: entities.categoryId,
      lastMinistryId: entities.ministryId,
      lastEntities: entities,
      messageCount: (this.context?.messageCount || 0) + 1,
      timestamp: Date.now(),
    };
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
      // 1. Améliorer la query (correction orthographique + synonymes)
      const enhancedQuery = enhanceQuery(userMessage);
      console.log('[ChatbotService] Enhanced query:', {
        original: userMessage,
        corrected: enhancedQuery.corrected,
        variantsCount: enhancedQuery.variants.length,
        keywords: enhancedQuery.keywords,
      });

      // 2. Détecter l'intention (avec contexte si disponible)
      const detectedIntent = await this.detectIntent(enhancedQuery.corrected, language);

      // 3. Extraire entités
      const entities = extractEntities(enhancedQuery.corrected, detectedIntent.intent);

      // 4. Enrichir les entités avec le contexte
      if (this.isContextValid() && this.context) {
        // Si l'utilisateur pose une question de suivi sans mentionner le service
        if (!entities.serviceKeyword && !entities.serviceCode && this.context.lastServiceCode) {
          console.log('[ChatbotService] Using context:', {
            lastIntent: this.context.lastIntent,
            lastService: this.context.lastServiceCode,
          });

          entities.contextServiceCode = this.context.lastServiceCode;
          entities.contextServiceName = this.context.lastServiceName;
          entities.usingContext = true;
        }
      }

      // 5. Générer la réponse (passer userMessage + enhanced query)
      const response = await this.generateResponse(
        detectedIntent,
        entities,
        language,
        enhancedQuery.corrected,
        enhancedQuery.variants
      );

      // 6. Mettre à jour le contexte
      const serviceCode = entities.serviceCode || entities.contextServiceCode;
      const serviceName = entities.serviceName || entities.contextServiceName;
      this.updateContext(detectedIntent.intent, entities, serviceCode, serviceName);

      // 7. Calculer le temps de traitement
      const processingTime = Date.now() - startTime;
      response.message.metadata = {
        ...response.message.metadata,
        language,
        processingTime,
        matchScore: detectedIntent.confidence,
        fallback: detectedIntent.confidence < 0.5,
        entities,
        spellingCorrected: enhancedQuery.corrected !== userMessage,
        synonymsExpanded: enhancedQuery.variants.length > 1,
        contextUsed: entities.usingContext || false,
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
    userMessage?: string,
    queryVariants?: string[]
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

      // Chercher d'abord avec la query corrigée
      let services = await this.searchServicesInDB(userMessage, language, 5);

      // Si aucun résultat et on a des variantes, essayer avec les variantes
      if (services.length === 0 && queryVariants && queryVariants.length > 1) {
        console.log('[ChatbotService] Trying with synonym variants...');
        for (const variant of queryVariants.slice(0, 3)) {
          // Max 3 variantes
          services = await this.searchServicesInDB(variant, language, 5);
          if (services.length > 0) {
            console.log(`[ChatbotService] Found ${services.length} services with variant: ${variant}`);
            break;
          }
        }
      }

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

    // Localiser les suggestions vers la langue cible
    const localizedSuggestions = localizeSuggestions(faq.follow_up_suggestions, language);

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: fullResponse,
      timestamp: new Date(),
      intent: faq.intent as ChatbotIntent,
      faqId: faq.id,
      suggestions: localizedSuggestions,
      actions: faq.actions || undefined,
    };

    return {
      message,
      suggestions: localizedSuggestions,
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

    // Suggestions génériques utilisant i18n
    const genericSuggestions = [
      getSuggestion('searchServices', language),
      getSuggestion('viewPopular', language),
      getSuggestion('useCalculator', language),
    ];

    return {
      message,
      suggestions: genericSuggestions,
    };
  }

  /**
   * Génère réponse d'erreur
   */
  private generateErrorResponse(language: ChatbotLanguage): ChatResponse {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: getError('general', language),
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

      // Recherche LIKE dans les noms de services (Spanish only) + keywords
      const likePattern = `%${normalizedQuery}%`;

      // CORRECTED QUERY: Only select columns that actually exist
      // fiscal_services has: id, service_code, name_es, description_es, tasa_expedicion, tasa_renovacion
      // Related data comes from JOINs
      const services = await db.query(
        `SELECT
          fs.id,
          fs.service_code,
          fs.name_es,
          fs.description_es,
          fs.tasa_expedicion,
          fs.tasa_renovacion,
          fs.processing_time_days,
          fs.service_type,
          c.name_es as category_name,
          c.category_code,
          m.name_es as ministry_name,
          m.ministry_code
        FROM fiscal_services fs
        LEFT JOIN categories c ON fs.category_id = c.id
        LEFT JOIN sectors s ON c.sector_id = s.id
        LEFT JOIN ministries m ON (s.ministry_id = m.id OR c.ministry_id = m.id)
        WHERE fs.status = 'active'
          AND (
            fs.name_es LIKE ? OR
            fs.description_es LIKE ? OR
            fs.service_code LIKE ? OR
            c.name_es LIKE ? OR
            m.name_es LIKE ? OR
            fs.id IN (
              SELECT fiscal_service_id
              FROM service_keywords
              WHERE keyword LIKE ?
              LIMIT 50
            )
          )
        LIMIT ?`,
        [likePattern, likePattern, likePattern, likePattern, likePattern, likePattern, limit]
      );

      return services;
    } catch (error) {
      console.error('[ChatbotService] Error searching services in DB:', error);
      return [];
    }
  }

  /**
   * Génère une réponse dynamique à partir des services trouvés en BD
   * UPDATED: 2025-11-06 - Uses TranslationService for multilingual support
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

    // Translate all service names in parallel for performance
    const translatedServices = await Promise.all(
      services.map(async (svc) => {
        const serviceName = await TranslationService.translate(
          'service',
          svc.service_code,
          'name',
          language,
          svc.name_es
        );

        const ministryName = svc.ministry_name
          ? await TranslationService.translate(
              'ministry',
              svc.ministry_code,
              'name',
              language,
              svc.ministry_name
            )
          : '';

        const categoryName = svc.category_name
          ? await TranslationService.translate(
              'category',
              svc.category_code,
              'name',
              language,
              svc.category_name
            )
          : '';

        return {
          ...svc,
          translatedName: serviceName,
          translatedMinistry: ministryName,
          translatedCategory: categoryName,
        };
      })
    );

    // Build response text using i18n system
    let responseText = '';

    const servicesFoundText = buildDynamicResponse(
      CHATBOT_I18N.dynamicResponses.servicesFound[language],
      { count: services.length }
    );

    responseText = `${intro}\n\n🔍 **${servicesFoundText}**\n\n`;

    translatedServices.forEach((svc, idx) => {
      // Service name with link
      responseText += `**${idx + 1}. ${svc.translatedName}**\n`;

      // Costs (use correct field names: tasa_expedicion/tasa_renovacion)
      if (svc.tasa_expedicion !== null && svc.tasa_expedicion !== undefined) {
        const expeditionLabel = getServiceLabel('expedition', language);
        const consultLabel = getServiceLabel('consult', language);
        responseText += `💰 ${expeditionLabel}: ${svc.tasa_expedicion > 0 ? svc.tasa_expedicion + ' XAF' : consultLabel}\n`;
      }

      if (svc.tasa_renovacion && svc.tasa_renovacion > 0) {
        const renewalLabel = getServiceLabel('renewal', language);
        responseText += `🔄 ${renewalLabel}: ${svc.tasa_renovacion} XAF\n`;
      }

      // Ministry and Category
      if (svc.translatedMinistry) {
        responseText += `🏛️ ${svc.translatedMinistry}\n`;
      }

      if (svc.translatedCategory) {
        const categoryLabel = getServiceLabel('category', language);
        responseText += `📂 ${categoryLabel}: ${svc.translatedCategory}\n`;
      }

      // Processing time
      if (svc.processing_time_days && svc.processing_time_days > 0) {
        const processingLabel = getServiceLabel('processing', language);
        const daysLabel = getServiceLabel('days', language);
        responseText += `⏱️ ${processingLabel}: ${svc.processing_time_days} ${daysLabel}\n`;
      }

      // Navigation link (clickable in UI)
      const viewDetailsLabel = getServiceLabel('viewDetails', language);
      responseText += `🔗 [${viewDetailsLabel}](/service/${svc.service_code})\n`;

      responseText += '\n';
    });

    if (services.length === 5) {
      const moreResultsText = CHATBOT_I18N.dynamicResponses.moreResults[language];
      responseText += `💡 _${moreResultsText}_`;
    }

    // Suggestions using i18n
    const suggestions = [
      getSuggestion('searchAnother', language),
      getSuggestion('viewPopular', language),
      getSuggestion('useCalculator', language),
    ];

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: responseText,
      timestamp: new Date(),
      intent: 'search_service',
      metadata: {
        language,
        fallback: false,
        entities: {
          source: 'dynamic_db_search',
          servicesFound: services.length,
          serviceIds: services.map((s) => s.id),
        },
      },
    };

    return {
      message,
      suggestions,
    };
  }

  /**
   * Génère réponse quand aucun service trouvé
   */
  private generateNoResultsResponse(query: string, language: ChatbotLanguage): ChatResponse {
    const noResultsHeader = getError('noResults', language, { query });
    const suggestionsTips = CHATBOT_I18N.noResultsSuggestions[language];
    const fullMessage = `❌ **${noResultsHeader}**\n\n${suggestionsTips}`;

    // Suggestions using i18n
    const suggestions = [
      getSuggestion('searchServices', language),
      getSuggestion('viewPopular', language),
      getSuggestion('getDocuments', language),
    ];

    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'bot',
      content: fullMessage,
      timestamp: new Date(),
      intent: 'unknown',
    };

    return {
      message,
      suggestions,
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
