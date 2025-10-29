import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { userStatsParamsSchema, visitEventSchema } from '../schemas/analytics.js';
import { getUserStats, recordVisitEvent } from '../services/analyticsService.js';

export const analyticsRouter = Router();

analyticsRouter.get('/users/:userId/stats', validate(userStatsParamsSchema), async (req, res, next) => {
  try {
    const stats = await getUserStats(req.params.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

analyticsRouter.post('/metrics/visit', validate(visitEventSchema), async (req, res, next) => {
  try {
    const { userId, event, sessionId, timestamp } = req.body;
    const result = await recordVisitEvent(userId, event, sessionId, timestamp);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
