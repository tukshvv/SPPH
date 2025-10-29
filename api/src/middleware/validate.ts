import type { RequestHandler } from 'express';
import type { AnyZodObject, ZodEffects } from 'zod';

export const validate = (schema: AnyZodObject | ZodEffects<any>): RequestHandler =>
  async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      });
      req.body = parsed.body ?? req.body;
      req.params = parsed.params ?? req.params;
      req.query = parsed.query ?? req.query;
      next();
    } catch (error) {
      next(error);
    }
  };
