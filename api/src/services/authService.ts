import { randomUUID } from 'crypto';
import { HttpError } from '../utils/errors.js';
import { env } from '../utils/env.js';
import { ensureUser } from './analyticsService.js';

const activeTokens = new Map<string, { userId: string; issuedAt: Date }>();

const sanitize = (value: string) => value.trim();

export const login = async (userId: string, password: string) => {
  const normalizedPassword = sanitize(password);
  if (!normalizedPassword || normalizedPassword !== env.APP_LOGIN_PASSWORD) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Неверный логин или пароль');
  }

  await ensureUser(userId);
  const token = randomUUID();
  activeTokens.set(token, { userId, issuedAt: new Date() });

  return { token, userId };
};

export const resolveToken = (token?: string) => {
  if (!token) return null;
  const session = activeTokens.get(token.trim());
  return session?.userId ?? null;
};

export const revokeToken = (token: string) => {
  activeTokens.delete(token);
};
