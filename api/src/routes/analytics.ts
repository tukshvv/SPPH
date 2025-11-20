import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { userStatsParamsSchema, visitEventSchema } from '../schemas/analytics.js';
import { getUserStats, recordVisitEvent } from '../services/analyticsService.js';
import { HttpError } from '../utils/errors.js';

export const analyticsRouter = Router();

analyticsRouter.get('/users/:userId/stats', validate(userStatsParamsSchema), async (req, res, next) => {
  try {
    if (req.authUserId !== req.params.userId) {
      throw new HttpError(403, 'FORBIDDEN', 'Недостаточно прав для получения статистики');
    }
    const stats = await getUserStats(req.params.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

analyticsRouter.post('/metrics/visit', validate(visitEventSchema), async (req, res, next) => {
  try {
    const { userId, event, sessionId, timestamp } = req.body;
    if (req.authUserId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'Нельзя отправлять метрики от другого пользователя');
    }
    const result = await recordVisitEvent(userId, event, sessionId, timestamp);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
