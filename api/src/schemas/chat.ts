import { z } from 'zod';

export const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(4000)
});

export const chatRequestSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    sessionId: z.string().uuid().optional(),
    messages: z.array(messageSchema).min(1)
  })
});

export type ChatRequestBody = z.infer<typeof chatRequestSchema>['body'];
