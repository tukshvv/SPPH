import { detectIntent } from './intent.js';
import { getRecentConversation, saveMessage } from './memory.js';
import type { LLMMessage } from '../providers/types.js';
import { sendChatCompletion } from '../services/llmService.js';
import type { AgentIntent } from './intent.js';
import { answerWithRAG, type CitationReference } from './ragAgent.js';
import { type UserProfilePayload, getUserProfile } from '../services/profileService.js';

type ResponseMode = 'basic' | 'rag';

const ragTriggerPhrases = ['по лекции', 'найди в конспекте', 'цитируй'];

const shouldUseRAG = (mode: ResponseMode | 'auto', message: string) => {
  if (mode === 'rag') return true;
  if (mode === 'basic') return false;

  const normalized = message.toLowerCase();
  return ragTriggerPhrases.some((phrase) => normalized.includes(phrase));
};

const buildPersonaPrompt = (profile: UserProfilePayload, intent: AgentIntent) => {
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

const buildProfileHint = (profile: UserProfilePayload) => {
  if (!profile.major || profile.topics.length === 0) {
    return 'Заполните профиль (специализация и интересующие темы), чтобы ответы стали точнее.';
  }
  return undefined;
};

interface ProcessMessageInput {
  userId: string;
  message: string;
  mode?: 'auto' | ResponseMode;
}

interface ProcessMessageResult {
  text: string;
  intent: AgentIntent;
  usedProfile: UserProfilePayload;
  usedContextSize: number;
  usage?: { promptTokens?: number; completionTokens?: number };
  model?: string;
  profileHint?: string;
  citations?: CitationReference[];
  mode: ResponseMode;
}

export const processMessage = async ({
  userId,
  message,
  mode = 'auto'
}: ProcessMessageInput): Promise<ProcessMessageResult> => {
  const intent = detectIntent(message);
  const profile = await getUserProfile(userId);
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

  let responseText: string;
  let responseMode: ResponseMode = 'basic';
  let citations: CitationReference[] | undefined;
  let usage: { promptTokens?: number; completionTokens?: number } | undefined;
  let model: string | undefined;
  let usedContextSize = contextMessages.length;

  if (shouldUseRAG(mode, message)) {
    const ragResult = await answerWithRAG({
      message,
      systemPrompt,
      conversation: contextMessages
    });
    responseText = ragResult.text;
    responseMode = 'rag';
    citations = ragResult.citations.length > 0 ? ragResult.citations : undefined;
    usage = ragResult.usage;
    model = ragResult.model;
    usedContextSize = ragResult.usedChunks;
  } else {
    const llmResponse = await sendChatCompletion(messages);
    responseText = llmResponse.content.trim();
    usage = {
      promptTokens: llmResponse.promptTokens,
      completionTokens: llmResponse.completionTokens
    };
    model = llmResponse.model;
  }

  saveMessage({ userId, role: 'user', text: message });
  saveMessage({ userId, role: 'assistant', text: responseText });

  const profileHint = buildProfileHint(profile);

  return {
    text: responseText,
    intent,
    usedProfile: profile,
    usedContextSize,
    usage,
    model,
    profileHint,
    citations,
    mode: responseMode
  };
};
