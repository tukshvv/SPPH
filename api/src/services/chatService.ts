import { prisma } from '../utils/prisma.js';
import { HttpError } from '../utils/errors.js';
import { generateChatReply, type ChatMessageInput } from './openaiChatService.js';

const buildContextPrompt = async (
  userId: string,
  session: { mode: string; subject: string | null; goal: string | null; dueDate: Date | null },
  notes: { title: string; content: string; subject: string | null }[]
) => {
  const preference = await prisma.userPreference.findUnique({ where: { userId } });
  const notesText =
    notes.length === 0
      ? 'No prior notes provided.'
      : notes
          .map((note, index) => {
            const snippet = note.content.length > 320 ? `${note.content.slice(0, 317)}...` : note.content;
            return `${index + 1}) ${note.title}${note.subject ? ` [${note.subject}]` : ''}: ${snippet}`;
          })
          .join('\n');

  const preferenceText = `User preferences:\n- Preferred language: ${preference?.preferredLanguage ?? 'en'}\n- Response style: ${
    preference?.responseStyle ?? 'balanced'
  } (concise=short, balanced=medium, detailed=expanded).`;

  const meta = `You are SPPH, a study assistant. Mode: ${session.mode}. Subject: ${
    session.subject ?? 'General'
  }. Student goal: ${session.goal ?? 'not specified'}. Due date: ${session.dueDate ?? 'none provided'}.`;

  return `${meta}\n${preferenceText}\nRelevant notes from the student (may be incomplete):\n${notesText}\nPlease keep answers actionable for students.`;
};

export const createSession = async (
  userId: string,
  title: string,
  meta?: { mode?: string; subject?: string | null; goal?: string | null; dueDate?: Date | null }
) => {
  const session = await prisma.chatSession.create({
    data: {
      userId,
      title,
      mode: meta?.mode ?? 'general',
      subject: meta?.subject ?? null,
      goal: meta?.goal ?? null,
      dueDate: meta?.dueDate ?? null
    }
  });

  await prisma.userActivity.upsert({
    where: { userId },
    update: { totalSessions: { increment: 1 }, lastActiveAt: new Date() },
    create: { userId, totalSessions: 1, lastActiveAt: new Date() }
  });

  return session;
};

export const listSessions = (userId: string) =>
  prisma.chatSession.findMany({
    where: { userId },
    orderBy: { lastMessageAt: 'desc' },
    select: {
      id: true,
      title: true,
      mode: true,
      subject: true,
      goal: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      lastMessageAt: true
    }
  });

export const getSession = async (userId: string, sessionId: string) => {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { feedback: true }
      }
    }
  });

  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
  }

  return session;
};

export const appendMessage = async (
  userId: string,
  sessionId: string,
  content: string,
  modelOverride?: string
) => {
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
  }

  const notes = session.subject
    ? await prisma.note.findMany({
        where: { userId, subject: session.subject },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { title: true, content: true, subject: true }
      })
    : [];

  await prisma.chatMessage.create({
    data: {
      chatSessionId: sessionId,
      userId,
      role: 'user',
      content
    }
  });

  const history: ChatMessageInput[] = await prisma.chatMessage.findMany({
    where: { chatSessionId: sessionId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true }
  });

  const context = await buildContextPrompt(userId, session, notes);
  const aiReply = await generateChatReply({
    messages: [{ role: 'system', content: context }, ...history],
    modelOverride
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      chatSessionId: sessionId,
      userId,
      role: 'assistant',
      content: aiReply.reply
    }
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { lastMessageAt: new Date() }
  });

  await prisma.userActivity.upsert({
    where: { userId },
    update: {
      totalMessages: { increment: 2 },
      lastActiveAt: new Date()
    },
    create: {
      userId,
      totalMessages: 2,
      totalSessions: 1,
      lastActiveAt: new Date()
    }
  });

  return { reply: assistantMessage, usage: aiReply.usage };
};

export const getActivity = async (userId: string) => {
  const [activity, sessions] = await Promise.all([
    prisma.userActivity.findUnique({ where: { userId } }),
    listSessions(userId)
  ]);

  const totalMessages = activity?.totalMessages ?? 0;
  const totalSessions = activity?.totalSessions ?? sessions.length;

  return {
    totalMessages,
    totalSessions,
    lastActiveAt: activity?.lastActiveAt ?? null,
    sessions
  };
};

export const saveFeedback = async (userId: string, messageId: string, value: number) => {
  const message = await prisma.chatMessage.findFirst({ where: { id: messageId, userId } });
  if (!message) {
    throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
  }

  const feedback = await prisma.feedback.upsert({
    where: { chatMessageId: messageId },
    update: { value },
    create: { chatMessageId: messageId, value }
  });

  return feedback;
};
