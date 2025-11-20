import 'dotenv/config';
import { z } from 'zod';
import { ConfigurationError } from '../utils/errors.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5050),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-me'),
  FRONTEND_ORIGIN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  OPENAI_PROJECT: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

export const ensureOpenAIConfig = () => {
  if (!env.OPENAI_API_KEY) {
    throw new ConfigurationError('OPENAI_API_KEY_MISSING', 'OpenAI API key is not configured');
  }
};

export type AppEnv = typeof env;
