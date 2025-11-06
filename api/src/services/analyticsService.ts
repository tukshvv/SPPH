import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

interface RecordInteractionInput {
  userId: string;
  sessionId?: string;
  promptLen: number;
  responseLen: number;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
}

export const ensureUser = async (userId: string) => {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });
};

export const recordInteraction = async ({
  userId,
  sessionId,
  promptLen,
  responseLen,
  model,
  promptTokens,
  completionTokens,
  costUsd
}: RecordInteractionInput) => {
  await ensureUser(userId);

  const interaction = await prisma.interaction.create({
    data: {
      userId,
      sessionId,
      promptLen,
      responseLen,
      model
    }
  });

  if (typeof promptTokens === 'number' || typeof completionTokens === 'number' || typeof costUsd === 'number') {
    await prisma.tokenUsage.create({
      data: {
        interactionId: interaction.id,
        promptTokens: promptTokens ?? 0,
        completionTokens: completionTokens ?? 0,
        costUsd: typeof costUsd === 'number' ? new Prisma.Decimal(costUsd) : undefined
      }
    });
  }

  return interaction;
};

export const recordVisitEvent = async (
  userId: string,
  event: 'start' | 'stop' | 'heartbeat',
  sessionId?: string,
  timestamp?: string
) => {
  await ensureUser(userId);
  const eventTime = timestamp ? new Date(timestamp) : new Date();

  if (event === 'start') {
    const newSessionId = sessionId ?? randomUUID();
    await prisma.session.upsert({
      where: { id: newSessionId },
      update: {
        endedAt: eventTime
      },
      create: {
        id: newSessionId,
        userId,
        startedAt: eventTime,
        endedAt: eventTime
      }
    });
    return { sessionId: newSessionId };
  }

  if (!sessionId) {
    return { sessionId: undefined };
  }

  await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId
    },
    data: {
      endedAt: eventTime
    }
  });

  return { sessionId };
};

export const getUserStats = async (userId: string) => {
  await ensureUser(userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activityWindowStart = new Date(today);
  activityWindowStart.setDate(activityWindowStart.getDate() - 364);

  const [interactionAggregate, sessions, latestInteractions, recentActivity] = await Promise.all([
    prisma.interaction.aggregate({
      where: { userId },
      _count: { _all: true },
      _avg: { promptLen: true, responseLen: true }
    }),
    prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: 'asc' }
    }),
    prisma.interaction.findMany({
      where: { userId },
      include: { tokenUsage: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.interaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: activityWindowStart
        }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  const totalTimeMs = sessions.reduce((acc, session) => {
    const end = session.endedAt ?? new Date();
    return acc + (end.getTime() - session.startedAt.getTime());
  }, 0);

  const activityCounts = new Map<string, number>();
  for (const interaction of recentActivity) {
    const key = interaction.createdAt.toISOString().slice(0, 10);
    activityCounts.set(key, (activityCounts.get(key) ?? 0) + 1);
  }

  const startDate = new Date(activityWindowStart);
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const activity: Array<{ date: string; count: number }> = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    activity.push({ date: key, count: activityCounts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    totalRequests: interactionAggregate._count._all,
    sessionsCount: sessions.length,
    totalTimeMs,
    avgPromptLength: interactionAggregate._avg.promptLen ?? 0,
    avgResponseLength: interactionAggregate._avg.responseLen ?? 0,
    activity,
    recentInteractions: latestInteractions.map((interaction) => ({
      id: interaction.id,
      createdAt: interaction.createdAt,
      promptLen: interaction.promptLen,
      responseLen: interaction.responseLen,
      model: interaction.model,
      promptTokens: interaction.tokenUsage?.promptTokens ?? 0,
      completionTokens: interaction.tokenUsage?.completionTokens ?? 0,
      costUsd: interaction.tokenUsage?.costUsd?.toNumber() ?? 0
    }))
  };
};
