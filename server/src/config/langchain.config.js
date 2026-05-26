// ============================================
// LANGCHAIN CONFIGURATION
// Location: server/src/config/langchain.config.js
// Purpose: Configure LangChain for context management
// ============================================

import { OpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';

export const initializeLangChain = () => {
  const llm = new OpenAI({
    openaiApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: 0.7,
    streaming: true,
  });

  return { llm };
};

/**
 * Create conversation memory for a session
 * This keeps track of conversation history
 */
export const createConversationMemory = (sessionId) => {
  return new BufferMemory({
    memoryKey: 'chat_history',
    returnMessages: true,
    k: 10, // Keep last 10 messages
  });
};

export default {
  initializeLangChain,
  createConversationMemory,
};