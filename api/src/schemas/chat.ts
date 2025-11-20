import { z } from 'zod';

export const sessionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).optional()
  })
});

export const messageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(4000),
    model: z.string().optional()
  })
});

export const feedbackSchema = z.object({
  body: z.object({
    messageId: z.string().uuid(),
    value: z.number().min(-1).max(1)
  })
});
