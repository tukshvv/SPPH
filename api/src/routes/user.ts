import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  profileQuerySchema,
  profileUpdateSchema,
  type ProfileUpdateBody
} from '../schemas/profile.js';
import { getUserProfile, updateUserProfile } from '../agent/memory.js';
import { logger } from '../utils/logger.js';

export const userRouter = Router();

userRouter.get('/profile', validate(profileQuerySchema), (req, res) => {
  const { userId } = req.query as { userId: string };
  const profile = getUserProfile(userId);
  logger.info({ requestId: req.requestId, userId, route: 'GET /api/user/profile' }, 'Fetched user profile');
  res.json(profile);
});

userRouter.post('/profile', validate(profileUpdateSchema), (req, res) => {
  const { userId, patch } = req.body as ProfileUpdateBody;
  const profile = updateUserProfile(userId, patch);
  logger.info({ requestId: req.requestId, userId, route: 'POST /api/user/profile' }, 'Updated user profile');
  res.json(profile);
});
