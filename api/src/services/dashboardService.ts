import { prisma } from '../utils/prisma.js';

export const getDashboard = async (userId: string) => {
  const [activity, chatCounts, tasks, recentChats, recentNotes] = await Promise.all([
    prisma.userActivity.findUnique({ where: { userId } }),
    prisma.chatSession.groupBy({
      by: ['mode'],
      where: { userId },
      _count: true
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: true
    }),
    prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { subject: true, mode: true },
      take: 5
    }),
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, select: { subject: true }, take: 5 })
  ]);

  const totalSessions = activity?.totalSessions ?? (await prisma.chatSession.count({ where: { userId } }));
  const totalMessages = activity?.totalMessages ?? (await prisma.chatMessage.count({ where: { userId } }));
  const tasksMap = tasks.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
    }, {});

  const mostUsedMode = chatCounts.sort((a, b) => b._count - a._count)[0]?.mode ?? 'general';
  const recentSubjects = [
    ...new Set([
      ...recentChats.map((c) => c.subject).filter(Boolean),
      ...recentNotes.map((n) => n.subject).filter(Boolean)
    ])
  ].slice(0, 5);

  return {
    totalMessages,
    totalSessions,
    totalChats: await prisma.chatSession.count({ where: { userId } }),
    tasksDone: tasksMap['done'] ?? 0,
    tasksTodo: tasksMap['todo'] ?? 0,
    mostUsedMode,
    recentSubjects
  };
};
