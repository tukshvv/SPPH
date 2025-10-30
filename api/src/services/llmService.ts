import type { LLMMessage } from '../providers/types.js';
import { createOpenAIProvider } from '../providers/openai.js';
import type { LLMResponse } from '../providers/types.js';
import { logger } from '../utils/logger.js';

const provider = createOpenAIProvider();

export const sendChatCompletion = async (messages: LLMMessage[]): Promise<LLMResponse> => {
  try {
    return await provider.chat(messages);
  } catch (error) {
    logger.error({ error }, 'OpenAI provider failed');
    throw error;
  }
};
