import type { LLMMessage, LLMResponse } from '../providers/types.js';
import { generateChatReply } from './openaiChatService.js';

export const sendChatCompletion = async (messages: LLMMessage[]): Promise<LLMResponse> => {
  const result = await generateChatReply({ messages });
  return {
    content: result.reply,
    model: 'openai',
    promptTokens: result.usage?.prompt_tokens ?? result.usage?.promptTokens,
    completionTokens: result.usage?.completion_tokens ?? result.usage?.completionTokens
  };
};
