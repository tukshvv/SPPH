import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { feedbackSchema, messageSchema, sessionSchema } from '../schemas/chat.js';
import { appendMessage, createSession, getActivity, getSession, listSessions, saveFeedback } from '../services/chatService.js';
import { HttpError } from '../utils/errors.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get('/sessions', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const sessions = await listSessions(userId);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/sessions', validate(sessionSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const { title, mode, subject, goal, dueDate } = req.body;
    const session = await createSession(userId, title ?? 'New Chat', {
      mode,
      subject: subject ?? null,
      goal: goal ?? null,
      dueDate: dueDate ? new Date(dueDate) : null
    });
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/sessions/:id', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const session = await getSession(userId, req.params.id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/sessions/:id/message', validate(messageSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const { content, model } = req.body;
    if (!content) throw new HttpError(400, 'EMPTY_MESSAGE', 'Message content is required');
    const result = await appendMessage(userId, req.params.id, content, model);
    res.json({ reply: result.reply, usage: result.usage });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/activity', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const activity = await getActivity(userId);
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/feedback', validate(feedbackSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const { messageId, value } = req.body;
    const feedback = await saveFeedback(userId, messageId, value);
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});
