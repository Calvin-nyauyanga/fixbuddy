// ============================================
// CHATBOT PROMPTS & INSTRUCTIONS
// Location: server/src/utils/chatbotPrompts.js
// Purpose: Define AI behavior and responses
// ============================================

export const SYSTEM_PROMPTS = {
  en: {
    initial: `You are a friendly IT support assistant named "FixBot". Your role is to help users solve technical issues.

IMPORTANT GUIDELINES:
1. You ONLY answer technology and computer-related questions
2. If a question is not tech-related, politely say: "I'm sorry, I can only assist with technology-related questions."
3. Always be patient and friendly
4. Explain things simply - avoid technical jargon
5. Give step-by-step instructions when needed
6. Ask clarifying questions if you don't understand the issue
7. If you're confused or the issue is complex, offer to create a support ticket

REMEMBER: Your goal is to help non-technical users solve problems easily.`,

    welcomeBack: `Welcome back {userName}! 👋 I see you previously had issues with {previousCategory}. How can I help you today?`,

    technicalJargon: `Let me explain that in simpler terms: `,

    escalationWarning: `I'm having trouble solving this completely. Would you like me to create a support ticket so our team can help further?`,

    ticketCreated: `Great! I've created ticket #{ticketId} for you. Our support team will help shortly.`,

    notTechRelated: `I'm sorry, I can only assist with technology-related questions. Is there anything tech-related I can help you with?`,
  },

  sn: {
    // Shona translations
    initial: `Mhoro! Ndi FixBot, mupi wenyu weIT support. Ndinonogona kuzokubatsira nezvemavheti etechnology.`,
    notTechRelated: `Ndapota, ndinowezvema technology-related questions chete.`,
  },

  nd: {
    // Ndebele translations
    initial: `Sakubona! Ngu FixBot, umuntu wakho we-IT support. Angikusize ezintwazindlela.`,
    notTechRelated: `Ngiyaxolisa, ngingakusiza kuphela nemibuzo enetekhnoloji.`,
  },
};

/**
 * Decision tree for categorizing issues
 */
export const ISSUE_CATEGORIES = {
  HARDWARE: {
    keywords: [
      'computer not turning on',
      'desktop wont start',
      'laptop freezing',
      'keyboard not working',
      'mouse not working',
      'monitor not displaying',
      'printer not printing',
      'screen black',
    ],
    subcategories: ['power', 'display', 'peripherals', 'storage'],
  },

  SOFTWARE: {
    keywords: [
      'application crashing',
      'software error',
      'program not opening',
      'windows update',
      'installation problem',
      'slow performance',
      'virus warning',
      'driver issue',
    ],
    subcategories: ['application', 'os', 'driver', 'performance'],
  },

  NETWORK: {
    keywords: [
      'wifi not connecting',
      'no internet',
      'internet slow',
      'ethernet not working',
      'connection unstable',
      'network error',
      'vpn issue',
      'router problem',
    ],
    subcategories: ['wifi', 'ethernet', 'internet', 'vpn'],
  },

  ACCOUNT: {
    keywords: [
      'password reset',
      'forgot password',
      'login issue',
      'account locked',
      'permission denied',
      'access denied',
      'two factor authentication',
    ],
    subcategories: ['password', 'authentication', 'permissions'],
  },

  SECURITY: {
    keywords: [
      'virus',
      'malware',
      'ransomware',
      'security warning',
      'suspicious activity',
      'data breach',
      'scam',
    ],
    subcategories: ['malware', 'phishing', 'breach'],
  },
};

/**
 * Get troubleshooting steps for common issues
 */
export const TROUBLESHOOTING_STEPS = {
  'computer_not_turning_on': [
    '1️⃣ Check if the power cable is firmly connected to both the computer and the wall outlet',
    '2️⃣ Try a different wall outlet to rule out electrical issues',
    '3️⃣ Look for indicator lights on the computer - are any LEDs lit?',
    '4️⃣ Press the power button on the computer and hold it for 10 seconds',
    '5️⃣ If nothing happens, unplug the computer for 30 seconds, then plug it back in',
    '6️⃣ Try turning it on again',
    '❓ If it still doesn\'t work, we may need to check the power supply. Would you like me to create a support ticket?',
  ],

  'wifi_not_connecting': [
    '1️⃣ Check if WiFi is turned on on your device',
    '2️⃣ Look for your network in the available networks list',
    '3️⃣ Verify you\'re entering the correct password',
    '4️⃣ Restart your router (unplug for 30 seconds)',
    '5️⃣ Restart your device',
    '6️⃣ Move closer to the router to check signal strength',
    '❓ Still having issues? I can create a ticket for our team to investigate.',
  ],

  'computer_slow': [
    '1️⃣ Close unnecessary programs running in the background',
    '2️⃣ Check if your storage is full (open File Explorer → right-click drive → Properties)',
    '3️⃣ Restart your computer',
    '4️⃣ Open Task Manager (Ctrl + Shift + Esc) and check CPU/Memory usage',
    '5️⃣ If something is using too much, you can close it',
    '6️⃣ Consider uninstalling programs you don\'t use',
    '❓ If still slow, it might need professional maintenance. Shall I create a ticket?',
  ],

  'password_reset': [
    '1️⃣ Go to the login page',
    '2️⃣ Click "Forgot Password"',
    '3️⃣ Enter your email address',
    '4️⃣ Check your email for a reset link',
    '5️⃣ Click the link and create a new password',
    '6️⃣ Your password is now changed - you can log in with the new one',
  ],
};

export default {
  SYSTEM_PROMPTS,
  ISSUE_CATEGORIES,
  TROUBLESHOOTING_STEPS,
};