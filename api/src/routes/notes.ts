import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, noteQuerySchema, updateNoteSchema } from '../schemas/notes.js';
import { createNote, deleteNote, listNotes, updateNote } from '../services/noteService.js';

export const noteRouter = Router();

noteRouter.use(requireAuth);

noteRouter.get('/', validate(noteQuerySchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const notes = await listNotes(userId, req.query.subject as string | undefined);
    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

noteRouter.post('/', validate(createNoteSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const note = await createNote(userId, req.body);
    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
});

noteRouter.patch('/:id', validate(updateNoteSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const note = await updateNote(userId, req.params.id, req.body);
    res.json({ note });
  } catch (error) {
    next(error);
  }
});

noteRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const result = await deleteNote(userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
