import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/shared/errors';
import { logger } from '@/config/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    requestId: req.headers['x-request-id'],
  }, 'Error handling request');

  // Zod validation error
  if (error instanceof ZodError) {
    const errors = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      error: 'Validation error',
      details: errors,
    });
    return;
  }

  // App errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
  });
}