import type { RequestHandler } from 'express';
import { HttpError } from '../utils/errors.js';
import { resolveToken } from '../services/authService.js';

const extractToken = (header?: string | null) => {
  if (!header) return null;
  const [type, value] = header.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !value) return null;
  return value.trim();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  const userId = resolveToken(token);

  if (!userId) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Для запроса требуется вход'));
  }

  req.authUserId = userId;
  return next();
};
