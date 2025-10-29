import { env } from '../utils/env.js';
import type { LLMMessage, LLMProvider, LLMResponse } from './types.js';

const DEFAULT_MODEL = 'openrouter/mistral-nemo:latest';

export const createOpenRouterProvider = (): LLMProvider => {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter');
  }

  return {
    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
      const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://spph.local',
          'X-Title': 'SPPH Chat MVP'
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter request failed: ${error}`);
      }

      const payload = await response.json();
      const choice = payload.choices?.[0]?.message?.content ?? '';

      return {
        content: choice,
        model: payload.choices?.[0]?.model ?? DEFAULT_MODEL,
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
        costUsd: payload.usage?.total_cost
      };
    }
  };
};
