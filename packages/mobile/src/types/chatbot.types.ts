/**
 * TaxasGE Mobile - Chatbot Types
 * Types pour le chatbot FAQ (MVP1 - Offline)
 * Date: 2025-10-13
 */

// ============================================
// TYPES DE BASE
// ============================================

/**
 * Intentions supportées par le chatbot FAQ
 */
export type ChatbotIntent =
  | 'greeting' // Salutations
  | 'thanks' // Remerciements
  | 'get_price' // Consulter prix
  | 'get_procedure' // Consulter procédure
  | 'get_documents' // Consulter documents
  | 'get_general_info' // Info générale
  | 'calculate' // Utiliser calculatrice
  | 'search_service' // Rechercher service
  | 'unknown'; // Intention non reconnue

/**
 * Langues supportées
 */
export type ChatbotLanguage = 'es' | 'fr' | 'en';

/**
 * Rôle du message dans la conversation
 */
export type MessageRole = 'user' | 'bot' | 'system';

// ============================================
// ENTITÉS FAQ DATABASE
// ============================================

/**
 * Entry FAQ dans la base de données SQLite
 */
export interface ChatbotFAQ {
  id: string;
  question_pattern: string; // Regex pattern
  intent: ChatbotIntent;
  response_es: string;
  response_fr: string | null;
  response_en: string | null;
  follow_up_suggestions: string | null; // JSON array
  actions: string | null; // JSON object
  keywords: string; // JSON array
  priority: number;
  is_active: number; // SQLite boolean (0 or 1)
  created_at: string;
  updated_at: string;
}

/**
 * FAQ parsed (avec JSON parsés)
 */
export interface ChatbotFAQParsed extends Omit<ChatbotFAQ, 'follow_up_suggestions' | 'actions' | 'keywords' | 'is_active'> {
  follow_up_suggestions: string[];
  actions: ChatbotAction | null;
  keywords: string[];
  is_active: boolean;
}

// ============================================
// ACTIONS DU CHATBOT
// ============================================

/**
 * Actions que le chatbot peut suggérer
 */
export type ChatbotActionType =
  | 'navigate' // Naviguer vers un écran
  | 'search' // Effectuer une recherche
  | 'calculate' // Ouvrir la calculatrice
  | 'suggestions' // Afficher des suggestions
  | 'external_link'; // Ouvrir un lien externe

/**
 * Action générique du chatbot
 */
export interface ChatbotAction {
  type: ChatbotActionType;
  screen?: string; // Pour navigate
  params?: Record<string, any>; // Paramètres pour l'action
  items?: ChatbotSuggestion[]; // Pour suggestions
  url?: string; // Pour external_link
}

/**
 * Suggestion de réponse rapide
 */
export interface ChatbotSuggestion {
  text: string;
  action?: ChatbotActionType;
  screen?: string;
  params?: Record<string, any>;
}

// ============================================
// MESSAGES DE CONVERSATION
// ============================================

/**
 * Message dans la conversation
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  intent?: ChatbotIntent;
  faqId?: string; // ID de la FAQ source
  suggestions?: string[];
  actions?: ChatbotAction;
  metadata?: ChatMessageMetadata;
}

/**
 * Métadonnées du message
 */
export interface ChatMessageMetadata {
  language: ChatbotLanguage;
  matchScore?: number; // Score de match avec FAQ (0-1)
  processingTime?: number; // Temps de traitement en ms
  fallback?: boolean; // True si réponse par défaut
  entities?: Record<string, any>; // Entités extraites
}

// ============================================
// RÉPONSES DU SERVICE CHATBOT
// ============================================

/**
 * Réponse du chatbot au message utilisateur
 */
export interface ChatResponse {
  message: ChatMessage;
  suggestions: string[];
  actions?: ChatbotAction;
  relatedServices?: RelatedService[];
}

/**
 * Service fiscal lié à la réponse
 */
export interface RelatedService {
  id: string;
  service_code: string;
  name: string;
  price?: number;
  is_verified: boolean;
}

// ============================================
// ÉTAT DU CHATBOT
// ============================================

/**
 * État de la conversation
 */
export interface ChatbotState {
  messages: ChatMessage[];
  currentLanguage: ChatbotLanguage;
  isTyping: boolean;
  error?: string;
  lastIntent?: ChatbotIntent;
}

/**
 * Configuration du chatbot
 */
export interface ChatbotConfig {
  language: ChatbotLanguage;
  maxMessages: number; // Nombre max de messages en mémoire
  enableFallback: boolean; // Activer réponse par défaut
  enableTypingIndicator: boolean;
  typingDelayMs: number; // Délai avant réponse
  enableSuggestions: boolean;
  maxSuggestions: number;
}

// ============================================
// RÉSULTATS DE RECHERCHE FAQ
// ============================================

/**
 * Résultat de recherche dans FAQ
 */
export interface FAQSearchResult {
  faq: ChatbotFAQParsed;
  score: number; // Score de pertinence (0-1)
  matchType: 'exact' | 'pattern' | 'fuzzy' | 'fts5';
}

/**
 * Intent détecté avec confiance
 */
export interface DetectedIntent {
  intent: ChatbotIntent;
  confidence: number; // 0-1
  entities: Record<string, any>; // Entités extraites
  matchedFAQs: FAQSearchResult[];
}

// ============================================
// ANALYTIQUE (pour futurs stats)
// ============================================

/**
 * Statistiques d'utilisation chatbot
 */
export interface ChatbotStats {
  totalMessages: number;
  intentDistribution: Record<ChatbotIntent, number>;
  averageResponseTime: number;
  fallbackRate: number; // % de réponses par défaut
  popularQueries: string[];
}

// ============================================
// CONSTANTES
// ============================================

/**
 * Messages par défaut par intention
 */
export const DEFAULT_RESPONSES: Record<ChatbotIntent, { es: string; fr: string; en: string }> = {
  greeting: {
    es: '¡Hola! ¿En qué puedo ayudarte?',
    fr: 'Bonjour ! Comment puis-je vous aider ?',
    en: 'Hello! How can I help you?',
  },
  thanks: {
    es: '¡De nada! ¿Algo más?',
    fr: 'De rien ! Autre chose ?',
    en: "You're welcome! Anything else?",
  },
  get_price: {
    es: 'Puedo ayudarte con los precios. ¿Qué servicio te interesa?',
    fr: 'Je peux vous aider avec les prix. Quel service vous intéresse ?',
    en: 'I can help with prices. Which service are you interested in?',
  },
  get_procedure: {
    es: 'Puedo mostrarte los procedimientos. ¿Qué trámite necesitas?',
    fr: 'Je peux vous montrer les procédures. Quelle démarche avez-vous besoin ?',
    en: 'I can show you procedures. Which one do you need?',
  },
  get_documents: {
    es: 'Puedo indicarte los documentos requeridos. ¿Para qué servicio?',
    fr: 'Je peux vous indiquer les documents requis. Pour quel service ?',
    en: 'I can tell you required documents. For which service?',
  },
  get_general_info: {
    es: 'Estoy aquí para ayudarte con información fiscal.',
    fr: "Je suis là pour vous aider avec des informations fiscales.",
    en: 'I\'m here to help with tax information.',
  },
  calculate: {
    es: 'Puedo ayudarte a calcular montos. ¿Qué servicio quieres calcular?',
    fr: 'Je peux vous aider à calculer les montants. Quel service voulez-vous calculer ?',
    en: 'I can help calculate amounts. Which service do you want to calculate?',
  },
  search_service: {
    es: 'Puedo buscar servicios. ¿Qué estás buscando?',
    fr: 'Je peux rechercher des services. Que cherchez-vous ?',
    en: 'I can search services. What are you looking for?',
  },
  unknown: {
    es: 'Disculpa, no entendí. ¿Puedes reformular tu pregunta?',
    fr: "Désolé, je n'ai pas compris. Pouvez-vous reformuler votre question ?",
    en: "Sorry, I didn't understand. Can you rephrase your question?",
  },
};

/**
 * Configuration par défaut
 */
export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  language: 'es',
  maxMessages: 50,
  enableFallback: true,
  enableTypingIndicator: true,
  typingDelayMs: 500,
  enableSuggestions: true,
  maxSuggestions: 3,
};
