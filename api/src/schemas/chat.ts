import { z } from 'zod';

export const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(4000)
});

export const chatRequestSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid(),
      sessionId: z.string().uuid().optional(),
      message: z.string().min(1).max(4000).optional(),
      messages: z.array(messageSchema).min(1).optional(),
      mode: z.enum(['auto', 'rag', 'basic']).optional()
    })
    .refine((data) => Boolean(data.message?.trim() ?? data.messages?.length), {
      message: 'Either message or messages must be provided',
      path: ['message']
    })
});

export type ChatRequestBody = z.infer<typeof chatRequestSchema>['body'];
