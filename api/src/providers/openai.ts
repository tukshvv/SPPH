import { env, ensureOpenAIConfig } from '../utils/env.js';
import type { LLMMessage, LLMProvider, LLMResponse } from './types.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const createOpenAIProvider = (): LLMProvider => {
  ensureOpenAIConfig();

  return {
    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          messages
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI request failed: ${error}`);
      }

      const payload = await response.json();
      const choice = payload.choices?.[0]?.message?.content ?? '';

      return {
        content: choice,
        model: payload.model ?? env.OPENAI_MODEL,
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
        costUsd: payload.usage?.total_tokens
          ? (payload.usage.total_tokens / 1000) * 0.002
          : undefined
      };
    }
  };
};
