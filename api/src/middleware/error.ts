import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.issues
    });
  }

  if (err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  const status = err.status ?? 500;
  const message = err.message ?? 'Unexpected error';

  if (status >= 500) {
    logger.error({ err, path: req.path }, 'Unhandled server error');
  } else {
    logger.warn({ err, path: req.path }, 'Request failed');
  }

  return res.status(status).json({ message });
};
