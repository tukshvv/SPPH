import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    preferredLanguage: z.string().max(10).optional(),
    responseStyle: z.string().max(20).optional()
  })
});
