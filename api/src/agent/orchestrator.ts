import { detectIntent } from './intent.js';
import {
  getRecentConversation,
  getUserProfile,
  saveMessage,
  type UserProfile
} from './memory.js';
import type { LLMMessage } from '../providers/types.js';
import { sendChatCompletion } from '../services/llmService.js';
import type { AgentIntent } from './intent.js';

const buildPersonaPrompt = (profile: UserProfile, intent: AgentIntent) => {
  const persona = [
    'Ты — SPPH ассистент, дружелюбный и практичный наставник для студентов и исследователей.',
    'Отвечай на русском языке, структурируй информацию, делай выводы и предлагай следующие шаги.'
  ];

  if (profile.major) {
    persona.push(`У пользователя специализация: ${profile.major}. Учитывай это в ответе.`);
  }

  if (profile.level) {
    persona.push(`Уровень подготовки пользователя: ${profile.level}.`);
  }

  if (profile.topics.length > 0) {
    persona.push(`Недавние интересы пользователя: ${profile.topics.join(', ')}.`);
  }

  switch (intent) {
    case 'search':
      persona.push('Если нужны внешние источники, предложи, где искать, и какие ключевые слова использовать.');
      break;
    case 'explain':
      persona.push('Давай подробные объяснения с примерами, уточняй непонятные моменты.');
      break;
    default:
      persona.push('Отвечай кратко и по делу, проверяй понимание пользователя.');
  }

  persona.push(
    'Всегда проверяй, что информация актуальна для команды SPPH, и предлагай идеи для дальнейших действий.'
  );

  return persona.join('\n');
};

const buildProfileHint = (profile: UserProfile) => {
  if (!profile.major || profile.topics.length === 0) {
    return 'Заполните профиль (специализация и интересующие темы), чтобы ответы стали точнее.';
  }
  return undefined;
};

interface ProcessMessageInput {
  userId: string;
  message: string;
}

interface ProcessMessageResult {
  text: string;
  intent: AgentIntent;
  usedProfile: UserProfile;
  usedContextSize: number;
  usage?: { promptTokens?: number; completionTokens?: number };
  model?: string;
  profileHint?: string;
}

export const processMessage = async ({ userId, message }: ProcessMessageInput): Promise<ProcessMessageResult> => {
  const intent = detectIntent(message);
  const profile = getUserProfile(userId);
  const context = getRecentConversation(userId, 12);
  const systemPrompt = buildPersonaPrompt(profile, intent);

  const contextMessages: LLMMessage[] = context.map((item) => ({
    role: item.role,
    content: item.text
  }));

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...contextMessages,
    { role: 'user', content: message }
  ];

  const llmResponse = await sendChatCompletion(messages);
  const text = llmResponse.content.trim();

  saveMessage({ userId, role: 'user', text: message });
  saveMessage({ userId, role: 'assistant', text });

  const profileHint = buildProfileHint(profile);

  return {
    text,
    intent,
    usedProfile: profile,
    usedContextSize: contextMessages.length,
    usage: {
      promptTokens: llmResponse.promptTokens,
      completionTokens: llmResponse.completionTokens
    },
    model: llmResponse.model,
    profileHint
  };
};
