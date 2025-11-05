import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { isHttpError } from '../utils/errors.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        issues: err.issues
      }
    });
  }

  if (err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({
      error: {
        code: 'CORS_NOT_ALLOWED',
        message: 'Origin not allowed'
      }
    });
  }

  const status = isHttpError(err) ? err.status : err.status ?? 500;
  const code = isHttpError(err) ? err.code : err.code ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'Unexpected error';

  if (status >= 500) {
    logger.error({ err, path: req.path, requestId: req.requestId }, 'Unhandled server error');
  } else {
    logger.warn({ err, path: req.path, requestId: req.requestId }, 'Request failed');
  }

  return res.status(status).json({
    error: {
      code,
      message
    }
  });
};
