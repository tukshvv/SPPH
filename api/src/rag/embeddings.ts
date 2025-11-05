import { OpenAIEmbeddings } from '@langchain/openai';
import { ensureEmbeddingConfig, env } from '../utils/env.js';

let embeddingsInstance: OpenAIEmbeddings | null = null;

export const getEmbeddingsClient = () => {
  ensureEmbeddingConfig();

  if (!embeddingsInstance) {
    embeddingsInstance = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY!,
      model: env.OPENAI_EMBEDDING_MODEL!
    });
  }

  return embeddingsInstance;
};
