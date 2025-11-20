import { prisma } from '../utils/prisma.js';

export const getDashboard = async (userId: string) => {
  const [activity, chatCounts, tasks, recentChats, recentNotes, usage] = await Promise.all([
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
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, select: { subject: true }, take: 5 }),
    prisma.dailyUsage.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 120 })
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

  const totalDaysActive = usage.filter((u) => (u.messages ?? 0) + (u.sessions ?? 0) > 0).length;

  const sortedUsage = [...usage].sort((a, b) => a.date.getTime() - b.date.getTime());
  let streakCurrent = 0;
  let streakLongest = 0;
  let prevDate: Date | null = null;
  for (const day of sortedUsage) {
    const active = (day.messages ?? 0) + (day.sessions ?? 0) > 0;
    if (!active) continue;
    if (prevDate) {
      const diff = (day.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1.1) {
        streakCurrent += 1;
      } else {
        streakCurrent = 1;
      }
    } else {
      streakCurrent = 1;
    }
    streakLongest = Math.max(streakLongest, streakCurrent);
    prevDate = day.date;
  }

  return {
    totalMessages,
    totalSessions,
    totalChats: await prisma.chatSession.count({ where: { userId } }),
    tasksDone: tasksMap['done'] ?? 0,
    tasksTodo: tasksMap['todo'] ?? 0,
    mostUsedMode,
    recentSubjects,
    totalDaysActive,
    streakCurrent,
    streakLongest
  };
};
