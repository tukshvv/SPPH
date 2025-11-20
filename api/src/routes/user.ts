import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { profileQuerySchema, profileUpdateSchema, type ProfileUpdateBody } from '../schemas/profile.js';
import { getUserProfile, updateUserProfile } from '../services/profileService.js';
import { logger } from '../utils/logger.js';
import { HttpError } from '../utils/errors.js';

export const userRouter = Router();

userRouter.get('/profile', validate(profileQuerySchema), async (req, res, next) => {
  try {
    const { userId } = req.query as { userId: string };
    if (req.authUserId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'Недостаточно прав для просмотра профиля');
    }

    const profile = await getUserProfile(userId);
    logger.info({ requestId: req.requestId, userId, route: 'GET /api/user/profile' }, 'Fetched user profile');
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

userRouter.post('/profile', validate(profileUpdateSchema), async (req, res, next) => {
  try {
    const { userId, patch } = req.body as ProfileUpdateBody;
    if (req.authUserId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'Нельзя менять чужой профиль');
    }

    const profile = await updateUserProfile(userId, patch);
    logger.info({ requestId: req.requestId, userId, route: 'POST /api/user/profile' }, 'Updated user profile');
    res.json(profile);
  } catch (error) {
    next(error);
  }
});
