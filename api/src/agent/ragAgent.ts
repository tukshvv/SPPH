import type { LLMMessage } from '../providers/types.js';
import { sendChatCompletion } from '../services/llmService.js';
import { getEmbeddingsClient } from '../rag/embeddings.js';
import { vectorStore } from '../rag/vectorStore.js';

interface AnswerWithRAGInput {
  message: string;
  systemPrompt: string;
  conversation: LLMMessage[];
  resultsLimit?: number;
}

export interface CitationReference {
  docId: string;
  chunkIdx: number;
}

export interface RAGAnswer {
  text: string;
  citations: CitationReference[];
  usage?: { promptTokens?: number; completionTokens?: number };
  model?: string;
  usedChunks: number;
}

export const answerWithRAG = async ({
  message,
  systemPrompt,
  conversation,
  resultsLimit = 4
}: AnswerWithRAGInput): Promise<RAGAnswer> => {
  const embeddings = getEmbeddingsClient();
  const queryEmbedding = await embeddings.embedQuery(message);

  const similarChunks = vectorStore.similaritySearch(queryEmbedding, resultsLimit);

  if (similarChunks.length === 0) {
    return {
      text:
        'В базе знаний пока нет подходящих документов. Загрузите конспекты через раздел Docs и повторите запрос.',
      citations: [],
      usedChunks: 0
    };
  }

  const contextBlocks = similarChunks
    .map((chunk) => {
      const docId = String((chunk.meta as Record<string, unknown>)?.docId ?? chunk.id);
      const chunkIdx = Number((chunk.meta as Record<string, unknown>)?.chunkIndex ?? 0);
      return `[#${docId}:${chunkIdx}] ${chunk.text}`;
    })
    .join('\n\n');

  const ragSystemPrompt = [
    systemPrompt,
    'Ты отвечаешь, используя только предоставленный контекст из конспектов и документов.',
    'Если информации недостаточно, прямо скажи об этом и предложи, что можно добавить в базу знаний.',
    'В конце ответа добавь список ссылок на использованные источники в формате [docId:chunk].'
  ].join('\n');

  const messages: LLMMessage[] = [
    { role: 'system', content: ragSystemPrompt },
    ...conversation,
    {
      role: 'system',
      content: `Контекст для ответа:\n${contextBlocks}`
    },
    {
      role: 'user',
      content: message
    }
  ];

  const response = await sendChatCompletion(messages);

  const citations: CitationReference[] = similarChunks.map((chunk) => ({
    docId: String((chunk.meta as Record<string, unknown>)?.docId ?? chunk.id),
    chunkIdx: Number((chunk.meta as Record<string, unknown>)?.chunkIndex ?? 0)
  }));

  return {
    text: response.content.trim(),
    citations,
    usage: {
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens
    },
    model: response.model,
    usedChunks: similarChunks.length
  };
};
