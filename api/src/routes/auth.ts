import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { loginSchema, type LoginBody } from '../schemas/auth.js';
import { login } from '../services/authService.js';
import { logger } from '../utils/logger.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { userId, password } = req.body as LoginBody;
    const session = await login(userId, password);
    logger.info({ requestId: req.requestId, userId, route: 'POST /api/auth/login' }, 'User logged in');
    res.json(session);
  } catch (error) {
    next(error);
  }
});
