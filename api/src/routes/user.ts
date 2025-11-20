import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileQuerySchema, profileUpdateSchema } from '../schemas/profile.js';
import { getUserProfile, updateUserProfile } from '../services/profileService.js';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/profile', validate(profileQuerySchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const profile = await getUserProfile(userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

userRouter.post('/profile', validate(profileUpdateSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const profile = await updateUserProfile(userId, req.body);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});
