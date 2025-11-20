import OpenAI from 'openai';
import { ensureOpenAIConfig, env } from '../utils/env.js';
import { HttpError } from '../utils/errors.js';

export interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateChatReplyInput {
  messages: ChatMessageInput[];
  modelOverride?: string;
}

const getClient = () => {
  ensureOpenAIConfig();

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_PROJECT,
    project: env.OPENAI_PROJECT
  });
};

export const generateChatReply = async ({ messages, modelOverride }: GenerateChatReplyInput) => {
  if (!messages?.length) {
    throw new HttpError(400, 'EMPTY_MESSAGES', 'Messages are required');
  }

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: modelOverride ?? env.OPENAI_MODEL,
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      temperature: 0.7
    });

    const choice = completion.choices[0];
    const reply = choice?.message?.content ?? '';
    return {
      reply,
      usage: completion.usage
    };
  } catch (error: any) {
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      throw new HttpError(500, 'OPENAI_AUTH_ERROR', 'OpenAI API key is invalid or missing');
    }
    throw new HttpError(500, 'OPENAI_ERROR', error?.message ?? 'Failed to generate response');
  }
};

export type GenerateChatReplyResult = Awaited<ReturnType<typeof generateChatReply>>;

export const generateTasksFromText = async (text: string) => {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'Extract study tasks from the user text. Respond ONLY with JSON matching {"tasks":[{"title":"","description?":"","dueDate?":"YYYY-MM-DD"}]} and keep titles short.'
      },
      { role: 'user', content: text }
    ]
  });

  try {
    const raw = completion.choices[0]?.message?.content ?? '{}';
    return JSON.parse(raw);
  } catch (error) {
    throw new HttpError(500, 'TASK_PARSE_ERROR', 'Failed to parse tasks from AI response');
  }
};
