import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: 'Validation failed', issues });
      return;
    }
    req.body = result.data;
    next();
  };
}
