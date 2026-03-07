import { AppError } from './errorHandler.js';

/**
 * Express middleware factory for Zod request validation
 * Validates request body, query, or params against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate
 * @returns {import('express').RequestHandler} Express middleware
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(
        new AppError('Validation failed', 422, 'VALIDATION_ERROR', { fields: details })
      );
    }
    req.validated = result.data;
    next();
  };
}
