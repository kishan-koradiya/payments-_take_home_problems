import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Generic validation middleware factory
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  property: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[property];
      const validated = schema.parse(data);
      
      // Replace the original data with validated data
      (req as any)[property] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        res.status(400).json({
          error: 'Validation failed',
          details: errorMessages,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // For non-Zod errors, pass to error handler
      next(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return validateRequest(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return validateRequest(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return validateRequest(schema, 'params');
}

/**
 * Error handler middleware for validation and other errors
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  // Handle different types of errors
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error response
  const statusCode = (error as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    if (logLevel === 'ERROR') {
      console.log(`Request body:`, req.body);
      console.log(`Response status:`, res.statusCode);
    }
  });
  
  next();
}