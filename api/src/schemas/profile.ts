import { z } from 'zod';

export const profileQuerySchema = z.object({
  query: z.object({}).optional()
});

export const profileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100)
  })
});

export type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>['body'];
