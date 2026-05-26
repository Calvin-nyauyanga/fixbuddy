// ============================================
// CHATBOT CONFIGURATION
// Location: server/src/config/chatbot.config.js
// Purpose: Central config for AI chatbot settings
// ============================================

export const CHATBOT_CONFIG = {
  // AI Provider Settings
  aiProvider: process.env.AI_PROVIDER || 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
  },

  // Chatbot Behavior
  behavior: {
    maxTurnsBeforeEscalation: 5,  // Auto-escalate after 5 questions
    responseTimeout: 30000,        // 30 seconds before timeout
    typingSpeed: 40,               // ms per character (for realistic typing)
    enableOfflineMode: false,
  },

  // Languages supported
  languages: {
    en: { name: 'English', flag: '🇬🇧' },
    sn: { name: 'Shona', flag: '🇿🇼' },
    nd: { name: 'Ndebele', flag: '🇿🇼' },
  },

  // Escalation thresholds
  escalation: {
    confidenceThreshold: 0.6,      // Escalate if confidence < 60%
    frustrationThreshold: 0.8,     // Escalate if user is frustrated
    maxRetries: 3,                 // Max times to try before escalation
  },

  // System prompts (instructions for the AI)
  prompts: {
    systemRole: 'You are a friendly, patient IT support chatbot for FixBuddy helpdesk system.',
    toneInstructions: 'Be helpful, clear, and avoid technical jargon. Explain things simply.',
  },

  // Feature flags
  features: {
    enableConversationMemory: true,
    enableTicketAutoCreation: true,
    enableUserPersonalization: true,
    enableAnalytics: true,
    enableMultilanguage: true,
  },
};

export default CHATBOT_CONFIG;