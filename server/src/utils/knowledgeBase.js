// ============================================
// KNOWLEDGE BASE
// Location: server/src/utils/knowledgeBase.js
// Purpose: Curated tech knowledge for the AI
// ============================================

export const KNOWLEDGE_BASE = {
  // FAQ Database
  faqs: [
    {
      id: 'faq_001',
      question: 'How do I reset my password?',
      category: 'account',
      answer: 'You can reset your password by clicking "Forgot Password" on the login page. Check your email for the reset link.',
    },
    {
      id: 'faq_002',
      question: 'Why is my computer slow?',
      category: 'software',
      answer: 'Your computer might be slow due to: too many programs running, insufficient storage, outdated drivers, or malware.',
    },
    {
      id: 'faq_003',
      question: 'How do I connect to WiFi?',
      category: 'network',
      answer: 'Go to Settings > Network > WiFi, select your network, enter the password.',
    },
  ],

  // Common solutions
  solutions: [
    {
      id: 'sol_001',
      issue: 'computer_not_starting',
      solutions: [
        'Check power cable',
        'Check outlet',
        'Hold power button 10 seconds',
        'Hard reset (unplug 30 seconds)',
      ],
    },
  ],

  // Escalation criteria
  escalationRules: [
    {
      indicator: 'user says "i dont know"',
      score: 0.7,
      action: 'offer_escalation',
    },
    {
      indicator: 'confidence < 0.5',
      score: 0.5,
      action: 'ask_for_clarification',
    },
    {
      indicator: 'same_issue_3_times',
      score: 0.8,
      action: 'escalate_immediately',
    },
  ],

  // Tech topics (what chatbot CAN answer)
  allowedTopics: [
    'hardware',
    'software',
    'network',
    'account',
    'security',
    'peripherals',
    'operating_system',
    'applications',
    'cloud',
    'storage',
  ],

  // Topics (what chatbot CANNOT answer)
  prohibitedTopics: [
    'politics',
    'religion',
    'personal',
    'financial_advice',
    'medical',
    'legal',
    'dating',
  ],
};

export default KNOWLEDGE_BASE;