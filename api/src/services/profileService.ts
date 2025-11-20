import { prisma } from '../utils/prisma.js';
import { HttpError } from '../utils/errors.js';

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { activity: true }
  });

  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    activity: {
      totalMessages: user.activity?.totalMessages ?? 0,
      totalSessions: user.activity?.totalSessions ?? 0,
      lastActiveAt: user.activity?.lastActiveAt ?? null
    }
  };
};

export const updateUserProfile = async (userId: string, patch: { name?: string }) => {
  const user = await prisma.user.update({ where: { id: userId }, data: { name: patch.name } });
  return { id: user.id, name: user.name, email: user.email };
};
