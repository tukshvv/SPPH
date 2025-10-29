import type { LLMMessage } from '../providers/types.js';
import { createDummyProvider } from '../providers/dummy.js';
import { createOpenAIProvider } from '../providers/openai.js';
import { createOpenRouterProvider } from '../providers/openrouter.js';
import { env } from '../utils/env.js';
import type { LLMResponse } from '../providers/types.js';
import { logger } from '../utils/logger.js';

let provider = (() => {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      return createOpenAIProvider();
    case 'openrouter':
      return createOpenRouterProvider();
    default:
      return createDummyProvider();
  }
})();

export const sendChatCompletion = async (messages: LLMMessage[]): Promise<LLMResponse> => {
  try {
    return await provider.chat(messages);
  } catch (error) {
    logger.error({ error }, 'LLM provider failed, falling back to dummy');
    provider = createDummyProvider();
    return provider.chat(messages);
  }
};
