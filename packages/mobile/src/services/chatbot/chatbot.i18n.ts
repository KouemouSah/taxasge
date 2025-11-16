/**
 * TaxasGE Mobile - Chatbot i18n
 * Centralized internationalization for chatbot UI strings
 *
 * Purpose:
 * - Remove hardcoded strings from ChatbotService
 * - Professional i18n structure following industry standards
 * - Easy maintenance and extensibility
 *
 * Created: 2025-11-06
 * Author: KOUEMOU SAH Jean Emac
 */

export type ChatbotLanguage = 'es' | 'fr' | 'en';

/**
 * Chatbot UI strings organized by category
 */
export const CHATBOT_I18N = {
  /**
   * Response introductions (randomized for human-like effect)
   */
  responseIntros: {
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
  },

  /**
   * Error messages
   */
  errors: {
    general: {
      es: 'Disculpa, ocurrió un error. Por favor, intenta de nuevo.',
      fr: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      en: 'Sorry, an error occurred. Please try again.',
    },
    noResults: {
      es: 'No encontré servicios para "{query}"',
      fr: 'Aucun service trouvé pour "{query}"',
      en: 'No services found for "{query}"',
    },
  },

  /**
   * Common suggestions (follow-up actions)
   */
  suggestions: {
    searchServices: {
      es: 'Buscar servicios',
      fr: 'Rechercher services',
      en: 'Search services',
    },
    viewPopular: {
      es: 'Ver servicios populares',
      fr: 'Voir services populaires',
      en: 'View popular services',
    },
    useCalculator: {
      es: 'Usar calculadora',
      fr: 'Utiliser calculatrice',
      en: 'Use calculator',
    },
    getPrice: {
      es: '¿Cuánto cuesta un servicio?',
      fr: 'Combien coûte un service ?',
      en: 'How much does a service cost?',
    },
    getDocuments: {
      es: '¿Qué documentos necesito?',
      fr: 'Quels documents ai-je besoin ?',
      en: 'What documents do I need?',
    },
    viewProcedures: {
      es: 'Ver procedimientos',
      fr: 'Voir procédures',
      en: 'View procedures',
    },
    viewDocuments: {
      es: 'Ver documentos requeridos',
      fr: 'Voir documents requis',
      en: 'View required documents',
    },
    getProcessingTime: {
      es: '¿Cuánto tiempo toma?',
      fr: 'Combien de temps cela prend-il ?',
      en: 'How long does it take?',
    },
    commonDocuments: {
      es: 'Documentos comunes',
      fr: 'Documents communs',
      en: 'Common documents',
    },
    searchAnother: {
      es: 'Buscar otro servicio',
      fr: 'Rechercher un autre service',
      en: 'Search another service',
    },
    viewFavorites: {
      es: 'Ver favoritos',
      fr: 'Voir favoris',
      en: 'View favorites',
    },
  },

  /**
   * Dynamic response templates
   */
  dynamicResponses: {
    servicesFound: {
      es: 'Encontré {count} servicio(s) fiscal(es):',
      fr: 'Trouvé {count} service(s) fiscal(aux):',
      en: 'Found {count} fiscal service(s):',
    },
    serviceLabels: {
      expedition: {
        es: 'Expedición',
        fr: 'Expédition',
        en: 'Expedition',
      },
      renewal: {
        es: 'Renovación',
        fr: 'Renouvellement',
        en: 'Renewal',
      },
      consult: {
        es: 'Consultar',
        fr: 'Consulter',
        en: 'Consult',
      },
      processing: {
        es: 'Plazo',
        fr: 'Délai',
        en: 'Processing',
      },
      days: {
        es: 'días',
        fr: 'jours',
        en: 'days',
      },
      category: {
        es: 'Categoría',
        fr: 'Catégorie',
        en: 'Category',
      },
      viewDetails: {
        es: 'Ver detalles',
        fr: 'Voir détails',
        en: 'View details',
      },
    },
    moreResults: {
      es: 'Hay más resultados disponibles. Refina tu búsqueda para ver servicios específicos.',
      fr: 'Il y a plus de résultats disponibles. Affinez votre recherche pour voir des services spécifiques.',
      en: 'There are more results available. Refine your search to see specific services.',
    },
  },

  /**
   * No results message
   */
  noResultsSuggestions: {
    es: `💡 **Sugerencias:**
• Intenta con palabras más generales (ej: "pasaporte" en lugar de "pasaporte biométrico")
• Verifica la ortografía
• Usa sinónimos (ej: "licencia" o "permiso")
• Explora por categorías en el menú principal

📊 Contamos con **850 servicios fiscales** disponibles.`,
    fr: `💡 **Suggestions:**
• Essayez avec des mots plus généraux (ex: "passeport" au lieu de "passeport biométrique")
• Vérifiez l'orthographe
• Utilisez des synonymes (ex: "licence" ou "permis")
• Explorez par catégories dans le menu principal

📊 Nous avons **850 services fiscaux** disponibles.`,
    en: `💡 **Suggestions:**
• Try more general words (eg: "passport" instead of "biometric passport")
• Check spelling
• Use synonyms (eg: "license" or "permit")
• Browse by categories in main menu

📊 We have **850 fiscal services** available.`,
  },
} as const;

/**
 * Helper: Get random intro for response
 */
export function getRandomIntro(language: ChatbotLanguage): string {
  const intros = CHATBOT_I18N.responseIntros[language];
  return intros[Math.floor(Math.random() * intros.length)];
}

/**
 * Helper: Get suggestion text
 */
export function getSuggestion(
  key: keyof typeof CHATBOT_I18N.suggestions,
  language: ChatbotLanguage
): string {
  return CHATBOT_I18N.suggestions[key][language];
}

/**
 * Helper: Get error message
 */
export function getError(
  key: keyof typeof CHATBOT_I18N.errors,
  language: ChatbotLanguage,
  replacements?: Record<string, string>
): string {
  const errorObj = CHATBOT_I18N.errors[key] as Record<ChatbotLanguage, string>;
  let message: string = errorObj[language];

  // Replace placeholders like {query}
  if (replacements) {
    Object.entries(replacements).forEach(([k, value]) => {
      message = message.replace(`{${k}}`, value);
    });
  }

  return message;
}

/**
 * Helper: Get service label
 */
export function getServiceLabel(
  key: keyof typeof CHATBOT_I18N.dynamicResponses.serviceLabels,
  language: ChatbotLanguage
): string {
  return CHATBOT_I18N.dynamicResponses.serviceLabels[key][language];
}

/**
 * Helper: Build dynamic response with replacements
 */
export function buildDynamicResponse(
  template: string,
  replacements: Record<string, string | number>
): string {
  let result = template;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
}
