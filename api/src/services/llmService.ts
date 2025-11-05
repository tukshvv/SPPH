import type { LLMMessage, LLMResponse } from '../providers/types.js';
import { createDummyProvider } from '../providers/dummy.js';
import { createOpenAIProvider } from '../providers/openai.js';
import { createOpenRouterProvider } from '../providers/openrouter.js';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';
import { ConfigurationError } from '../utils/errors.js';

const createProvider = () => {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      return createOpenAIProvider();
    case 'openrouter':
      return createOpenRouterProvider();
    default:
      return createDummyProvider();
  }
};

let provider: ReturnType<typeof createProvider> | null = null;

const getProvider = () => {
  if (provider) {
    return provider;
  }
  provider = createProvider();
  return provider;
};

export const sendChatCompletion = async (messages: LLMMessage[]): Promise<LLMResponse> => {
  try {
    const activeProvider = getProvider();
    return await activeProvider.chat(messages);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    logger.error({ error }, 'LLM provider failed, falling back to dummy');
    provider = createDummyProvider();
    return provider.chat(messages);
  }
};
