import { z } from 'zod';

export const profileQuerySchema = z.object({
  query: z.object({
    userId: z.string().uuid()
  })
});

export const profileUpdateSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    patch: z
      .object({
        major: z.string().min(1).max(120).optional(),
        topics: z.array(z.string().min(1).max(120)).optional(),
        level: z.string().min(1).max(120).optional(),
        schedule: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              title: z.string().min(1).max(200),
              day: z.string().min(1).max(40),
              time: z.string().min(1).max(40),
              location: z.string().min(1).max(120).optional(),
              description: z.string().min(1).max(240).optional()
            })
          )
          .optional()
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: 'Patch must not be empty'
      })
  })
});

export type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>['body'];
