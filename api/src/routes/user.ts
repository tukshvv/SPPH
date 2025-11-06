import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  profileQuerySchema,
  profileUpdateSchema,
  type ProfileUpdateBody
} from '../schemas/profile.js';
import { logger } from '../utils/logger.js';
import {
  accountUpdateSchema,
  loginSchema,
  registerSchema,
  type AccountUpdateBody,
  type LoginBody,
  type RegisterBody
} from '../schemas/auth.js';
import {
  authenticateUser,
  createUserAccount,
  getUserProfile,
  updateAccountDetails,
  updateUserProfile
} from '../services/userService.js';

export const userRouter = Router();

userRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const body = req.body as RegisterBody;
    const result = await createUserAccount(body);
    logger.info(
      { requestId: req.requestId, userId: result.userId, route: 'POST /api/user/register' },
      'Created user account'
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

userRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const body = req.body as LoginBody;
    const result = await authenticateUser(body);
    logger.info(
      { requestId: req.requestId, userId: result.userId, route: 'POST /api/user/login' },
      'Authenticated user'
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

userRouter.get('/profile', validate(profileQuerySchema), async (req, res, next) => {
  try {
    const { userId } = req.query as { userId: string };
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
    const profile = await updateUserProfile(userId, patch);
    logger.info({ requestId: req.requestId, userId, route: 'POST /api/user/profile' }, 'Updated user profile');
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

userRouter.post('/account', validate(accountUpdateSchema), async (req, res, next) => {
  try {
    const { userId, name, email } = req.body as AccountUpdateBody;
    const registration = await updateAccountDetails(userId, { name, email });
    logger.info({ requestId: req.requestId, userId, route: 'POST /api/user/account' }, 'Updated account details');
    res.json(registration);
  } catch (error) {
    next(error);
  }
});
