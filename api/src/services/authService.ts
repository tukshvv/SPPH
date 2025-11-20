import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { env } from '../utils/env.js';
import { HttpError } from '../utils/errors.js';
import { recordSessionStart } from './activityService.js';

const TOKEN_EXPIRY = '7d';

interface TokenPayload {
  userId: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const buildToken = (payload: TokenPayload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

export const registerUser = async ({ name, email, password }: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'EMAIL_EXISTS', 'User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      activity: {
        create: {}
      }
    }
  });

  const token = buildToken({ userId: user.id });
  return { token, user };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = buildToken({ userId: user.id });
  await recordSessionStart(user.id);
  return { token, user };
};

export const verifyToken = (token?: string | null): TokenPayload | null => {
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
