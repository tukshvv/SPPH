import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    major: z.string().min(1).max(120).optional(),
    level: z.string().min(1).max(120).optional(),
    topics: z.array(z.string().min(1).max(120)).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const accountUpdateSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    name: z.string().min(1).max(120),
    email: z.string().email()
  })
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type AccountUpdateBody = z.infer<typeof accountUpdateSchema>['body'];
