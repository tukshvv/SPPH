import { prisma } from '../utils/prisma.js';
import { HttpError } from '../utils/errors.js';
import { generateChatReply, type ChatMessageInput } from './openaiChatService.js';

export const createSession = async (userId: string, title: string) => {
  const session = await prisma.chatSession.create({
    data: {
      userId,
      title
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

  const aiReply = await generateChatReply({ messages: history, modelOverride });

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
