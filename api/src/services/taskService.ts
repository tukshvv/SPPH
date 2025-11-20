import { prisma } from '../utils/prisma.js';
import { generateTasksFromText } from './openaiChatService.js';
import { HttpError } from '../utils/errors.js';

export const listTasks = (userId: string, status?: string) =>
  prisma.task.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
  });

export const createTask = (userId: string, payload: any) =>
  prisma.task.create({
    data: {
      userId,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? 'todo',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      chatSessionId: payload.chatSessionId ?? null
    }
  });

export const updateTask = async (userId: string, id: string, payload: any) => {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
  return prisma.task.update({
    where: { id },
    data: {
      ...('title' in payload ? { title: payload.title } : {}),
      ...('description' in payload ? { description: payload.description ?? null } : {}),
      ...('status' in payload ? { status: payload.status } : {}),
      ...('dueDate' in payload ? { dueDate: payload.dueDate ? new Date(payload.dueDate) : null } : {})
    }
  });
};

export const deleteTask = async (userId: string, id: string) => {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
  await prisma.task.delete({ where: { id } });
  return { success: true };
};

export const createTasksFromText = async (userId: string, text: string, chatSessionId?: string | null) => {
  const parsed = await generateTasksFromText(text);
  if (!parsed?.tasks?.length) return [];
  const tasks = await prisma.$transaction(
    parsed.tasks.map((task) =>
      prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description ?? null,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          status: 'todo',
          chatSessionId: chatSessionId ?? null
        }
      })
    )
  );
  return tasks;
};
