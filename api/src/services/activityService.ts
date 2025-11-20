import { prisma } from '../utils/prisma.js';

const startOfDay = (date: Date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return d;
};

export const normalizeDate = startOfDay;

export const recordSessionStart = async (userId: string): Promise<void> => {
  const now = new Date();
  await prisma.$transaction([
    prisma.userActivity.upsert({
      where: { userId },
      update: { totalSessions: { increment: 1 }, lastActiveAt: now },
      create: { userId, totalSessions: 1, totalMessages: 0, lastActiveAt: now }
    }),
    prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date: startOfDay(now) } },
      update: { sessions: { increment: 1 } },
      create: { userId, date: startOfDay(now), sessions: 1 }
    })
  ]);
};

export const recordMessageActivity = async (userId: string): Promise<void> => {
  const now = new Date();
  await prisma.$transaction([
    prisma.userActivity.upsert({
      where: { userId },
      update: { totalMessages: { increment: 1 }, lastActiveAt: now },
      create: { userId, totalMessages: 1, totalSessions: 1, lastActiveAt: now }
    }),
    prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date: startOfDay(now) } },
      update: { messages: { increment: 1 } },
      create: { userId, date: startOfDay(now), messages: 1 }
    })
  ]);
};

export const getDailyUsage = async (userId: string, from: Date, to: Date) => {
  const days = await prisma.dailyUsage.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay(from),
        lte: startOfDay(to)
      }
    },
    orderBy: { date: 'asc' }
  });

  return days.map((day) => ({
    date: day.date.toISOString().slice(0, 10),
    messages: day.messages,
    sessions: day.sessions
  }));
};
