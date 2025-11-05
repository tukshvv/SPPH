import 'dotenv/config';
import { z } from 'zod';
import { ConfigurationError } from '../utils/errors.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5050),
  DATABASE_URL: z.string().optional(),
  LLM_PROVIDER: z.enum(['openai', 'openrouter', 'dummy']).default('dummy'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-3.5-turbo'),
  OPENAI_EMBEDDING_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

export const ensureOpenAIConfig = () => {
  if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    throw new ConfigurationError('OPENAI_API_KEY_MISSING', 'OpenAI API key is not configured');
  }
};

export const ensureEmbeddingConfig = () => {
  if (!env.OPENAI_API_KEY) {
    throw new ConfigurationError('OPENAI_API_KEY_MISSING', 'OpenAI API key is required for embeddings');
  }

  if (!env.OPENAI_EMBEDDING_MODEL) {
    throw new ConfigurationError(
      'OPENAI_EMBEDDING_MODEL_MISSING',
      'Embedding model is not configured. Set OPENAI_EMBEDDING_MODEL in environment.'
    );
  }
};

export type AppEnv = typeof env;
