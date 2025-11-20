import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    password: z.string().min(6)
  })
});

export type LoginBody = z.infer<typeof loginSchema>['body'];
