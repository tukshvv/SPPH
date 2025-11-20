import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    status: z.string().optional(),
    dueDate: z.string().datetime().optional().nullable(),
    chatSessionId: z.string().uuid().optional()
  })
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    status: z.string().optional(),
    dueDate: z.string().datetime().optional().nullable()
  })
});

export const taskQuerySchema = z.object({
  query: z.object({ status: z.string().optional() })
});

export const tasksFromTextSchema = z.object({
  body: z.object({ text: z.string().min(10), chatSessionId: z.string().uuid().optional() })
});
