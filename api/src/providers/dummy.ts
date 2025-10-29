import type { LLMMessage, LLMProvider, LLMResponse } from './types.js';

export const createDummyProvider = (): LLMProvider => ({
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const content = lastUserMessage
      ? `🤖 Echo: ${lastUserMessage.content.slice(0, 400)}\n\nAdd more context to go deeper!`
      : '🤖 Echo: (no user message found)';

    return {
      content,
      model: 'spph/dummy-echo',
      promptTokens: lastUserMessage?.content.length ?? 0,
      completionTokens: content.length,
      costUsd: 0
    };
  }
});
