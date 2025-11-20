import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { chatRouter } from './routes/chat.js';
import { analyticsRouter } from './routes/analytics.js';
import { ingestRouter } from './routes/ingest.js';
import { errorHandler } from './middleware/error.js';
import { env } from './utils/env.js';
import { requestContext } from './middleware/requestContext.js';
import { requestLogger } from './middleware/logger.js';
import { userRouter } from './routes/user.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';

const allowedOrigins = [process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'];

const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}-${(req.body as any)?.userId ?? 'anon'}`
});

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS_NOT_ALLOWED'), false);
      },
      optionsSuccessStatus: 200
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);
  app.use(requestLogger);

  const version = process.env.npm_package_version ?? 'dev';

  app.get('/health', (_req, res) => {
    res.json({ ok: true, version });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, version });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/chat', requireAuth, chatLimiter, chatRouter);
  app.use('/api', requireAuth, ingestRouter);
  app.use('/api', requireAuth, analyticsRouter);
  app.use('/api/user', requireAuth, userRouter);

  app.use(errorHandler);

  return app;
};

export const app = createApp();
export const port = env.PORT;
