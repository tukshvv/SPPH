import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';

export const requestContext: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
