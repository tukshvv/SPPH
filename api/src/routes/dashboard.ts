import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../services/dashboardService.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/me', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const data = await getDashboard(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});
