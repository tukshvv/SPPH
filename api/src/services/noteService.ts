import { prisma } from '../utils/prisma.js';
import { HttpError } from '../utils/errors.js';

export const listNotes = (userId: string, subject?: string) =>
  prisma.note.findMany({
    where: { userId, ...(subject ? { subject } : {}) },
    orderBy: { updatedAt: 'desc' }
  });

export const createNote = (userId: string, payload: any) =>
  prisma.note.create({
    data: {
      userId,
      title: payload.title,
      subject: payload.subject ?? null,
      content: payload.content
    }
  });

export const updateNote = async (userId: string, id: string, payload: any) => {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) throw new HttpError(404, 'NOTE_NOT_FOUND', 'Note not found');
  return prisma.note.update({
    where: { id },
    data: {
      ...('title' in payload ? { title: payload.title } : {}),
      ...('subject' in payload ? { subject: payload.subject ?? null } : {}),
      ...('content' in payload ? { content: payload.content } : {})
    }
  });
};

export const deleteNote = async (userId: string, id: string) => {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) throw new HttpError(404, 'NOTE_NOT_FOUND', 'Note not found');
  await prisma.note.delete({ where: { id } });
  return { success: true };
};
