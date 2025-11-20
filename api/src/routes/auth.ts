import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';
import { loginUser, registerUser } from '../services/authService.js';
import { HttpError } from '../utils/errors.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const session = await registerUser({ name, email, password });
    res.json({ token: session.token, user: { id: session.user.id, name: session.user.name, email: session.user.email } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const session = await loginUser({ email, password });
    res.json({ token: session.token, user: { id: session.user.id, name: session.user.name, email: session.user.email } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', (req, res, next) => {
  try {
    if (!req.authUserId) throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    res.json({ userId: req.authUserId });
  } catch (error) {
    next(error);
  }
});
