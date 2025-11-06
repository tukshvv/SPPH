import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { prisma } from '../utils/prisma.js';
import { HttpError } from '../utils/errors.js';

export interface UserProfile {
  major?: string;
  level?: string;
  topics: string[];
}

export interface RegistrationMeta {
  name: string;
  email: string;
  registeredAt: string;
}

interface UserRecord {
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt: Date;
  major?: string | null;
  level?: string | null;
  topicsJson: string;
}

const parseTopics = (topicsJson: string | null | undefined): string[] => {
  if (!topicsJson) return [];
  try {
    const parsed = JSON.parse(topicsJson);
    if (Array.isArray(parsed)) {
      return parsed.filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0);
    }
    return [];
  } catch {
    return [];
  }
};

const scrypt = promisify(scryptCallback);

const serializeTopics = (topics: string[]): string => {
  const unique = Array.from(new Set(topics.map((topic) => topic.trim()).filter((topic) => topic.length > 0)));
  return JSON.stringify(unique);
};

const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};

const verifyPassword = async (password: string, storedHash: string) => {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(key, 'hex');
  if (stored.length !== derived.length) {
    return false;
  }
  return timingSafeEqual(stored, derived);
};

const buildProfile = (user: UserRecord | null): UserProfile => {
  if (!user) {
    return { topics: [] };
  }
  return {
    major: user.major ?? undefined,
    level: user.level ?? undefined,
    topics: parseTopics(user.topicsJson)
  };
};

const buildRegistration = (user: UserRecord | null): RegistrationMeta | null => {
  if (!user?.email || !user.name) {
    return null;
  }
  return {
    name: user.name,
    email: user.email,
    registeredAt: user.createdAt.toISOString()
  };
};

export const createUserAccount = async ({
  name,
  email,
  password,
  major,
  level,
  topics
}: {
  name: string;
  email: string;
  password: string;
  major?: string;
  level?: string;
  topics?: string[];
}): Promise<{ userId: string; profile: UserProfile; registration: RegistrationMeta }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new HttpError(409, 'USER_EXISTS', 'Пользователь с таким e-mail уже зарегистрирован');
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      major: major?.trim() || undefined,
      level: level?.trim() || undefined,
      topicsJson: serializeTopics(topics ?? [])
    }
  });

  const registration = buildRegistration(user);
  if (!registration) {
    throw new HttpError(500, 'REGISTRATION_FAILED', 'Не удалось сохранить данные регистрации');
  }

  return {
    userId: user.id,
    profile: buildProfile(user),
    registration
  };
};

export const authenticateUser = async ({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<{ userId: string; profile: UserProfile; registration: RegistrationMeta | null }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Неверный e-mail или пароль');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Неверный e-mail или пароль');
  }

  return {
    userId: user.id,
    profile: buildProfile(user),
    registration: buildRegistration(user)
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return buildProfile(user);
};

export const updateUserProfile = async (
  userId: string,
  patch: Partial<Pick<UserProfile, 'major' | 'level'>> & { topics?: string[] }
): Promise<UserProfile> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Пользователь не найден');
  }

  const data: { major?: string | null; level?: string | null; topicsJson?: string } = {};
  if (typeof patch.major === 'string') {
    const trimmed = patch.major.trim();
    data.major = trimmed.length > 0 ? trimmed : null;
  }
  if (typeof patch.level === 'string') {
    const trimmed = patch.level.trim();
    data.level = trimmed.length > 0 ? trimmed : null;
  }
  if (patch.topics) {
    data.topicsJson = serializeTopics(patch.topics);
  }

  if (Object.keys(data).length === 0) {
    return buildProfile(user);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data
  });

  return buildProfile(updated);
};

export const updateAccountDetails = async (
  userId: string,
  payload: { name: string; email: string }
): Promise<RegistrationMeta> => {
  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Пользователь не найден');
  }

  const conflict = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: userId }
    }
  });
  if (conflict) {
    throw new HttpError(409, 'EMAIL_IN_USE', 'Указанный e-mail уже используется другим аккаунтом');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email
    }
  });

  const registration = buildRegistration(updated);
  if (!registration) {
    throw new HttpError(500, 'ACCOUNT_INCOMPLETE', 'Не удалось обновить данные аккаунта');
  }
  return registration;
};
