// ============================================
// LANGUAGE SUPPORT / i18n
// Location: server/src/utils/languageSupport.js
// Purpose: Handle multi-language support
// ============================================

export const TRANSLATIONS = {
  en: {
    welcome: 'Welcome to FixBot! How can I help you today?',
    goodbye: 'Thank you for using FixBot. Have a great day!',
    sorry: 'I\'m sorry, I can only assist with technology-related questions.',
    escalating: 'I\'m connecting you with a support agent...',
    creating_ticket: 'Creating a support ticket for you...',
  },
  sn: {
    welcome: 'Mhoro kuFixBot! Ndingakubatsira sei nhasi?',
    goodbye: 'Ndapota, zvakakodzera.',
    sorry: 'Ndapota, ndinowezvema technology questions chete.',
  },
  nd: {
    welcome: 'Sakubona eFixBot! Angikusize njani namhlanje?',
    goodbye: 'Ngiyabonga.',
    sorry: 'Ngiyaxolisa, ngingakusiza kuphela nemibuzo enetekhnoloji.',
  },
};

/**
 * Get translation for a key in a specific language
 */
export function getTranslation(key, language = 'en') {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
}

/**
 * Detect language from user message (simple implementation)
 */
export function detectLanguage(message) {
  // This is a simple implementation
  // In production, use a library like franc or langdetect

  const shonaKeywords = ['ndapata', 'mhoro', 'zvakakodzera', 'kwete', 'ndinoita'];
  const ndebeleKeywords = ['ngiyabonga', 'sakubona', 'ayoba', 'haibo', 'ngiyazi'];

  if (shonaKeywords.some((word) => message.toLowerCase().includes(word))) {
    return 'sn';
  }

  if (ndebeleKeywords.some((word) => message.toLowerCase().includes(word))) {
    return 'nd';
  }

  return 'en';
}

export default {
  TRANSLATIONS,
  getTranslation,
  detectLanguage,
};