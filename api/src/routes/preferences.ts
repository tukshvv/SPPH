import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updatePreferencesSchema } from '../schemas/preferences.js';
import { getPreferences, updatePreferences } from '../services/preferencesService.js';

export const preferenceRouter = Router();

preferenceRouter.use(requireAuth);

preferenceRouter.get('/me', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const prefs = await getPreferences(userId);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

preferenceRouter.patch('/me', validate(updatePreferencesSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const prefs = await updatePreferences(userId, req.body);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});
