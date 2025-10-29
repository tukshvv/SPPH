import { z } from 'zod';

export const userStatsParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid()
  })
});

export const visitEventSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    sessionId: z.string().uuid().optional(),
    event: z.enum(['start', 'stop', 'heartbeat']),
    timestamp: z.string().datetime().optional()
  })
});

export type VisitEventBody = z.infer<typeof visitEventSchema>['body'];
