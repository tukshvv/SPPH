export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
}

export interface LLMProvider {
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
}
