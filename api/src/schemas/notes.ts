import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    subject: z.string().max(120).optional().nullable(),
    content: z.string().min(1)
  })
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    subject: z.string().max(120).optional().nullable(),
    content: z.string().min(1).optional()
  })
});

export const noteQuerySchema = z.object({
  query: z.object({ subject: z.string().optional() })
});
