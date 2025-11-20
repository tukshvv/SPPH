import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDailyUsage, normalizeDate } from '../services/activityService.js';

export const usageRouter = Router();
usageRouter.use(requireAuth);

usageRouter.get('/daily', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(now.getDate() - 90);

    const from = req.query.from ? new Date(String(req.query.from)) : defaultFrom;
    const to = req.query.to ? new Date(String(req.query.to)) : now;

    const days = await getDailyUsage(userId, from, to);
    res.json({
      from: normalizeDate(from).toISOString().slice(0, 10),
      to: normalizeDate(to).toISOString().slice(0, 10),
      days
    });
  } catch (error) {
    next(error);
  }
});
