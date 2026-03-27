import { Request, Response, NextFunction } from 'express';
import { toCamelCase } from '../utils/caseUtils.js';
import { JsonValue } from '../types/index.js';

export const namingMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Use structural type assertion to allow mutation of body and query if they are marked readonly in the environment
  if (req.body && typeof req.body === 'object') {
    (req as { body: JsonValue }).body = toCamelCase(req.body as JsonValue);
  }
  
  if (req.query && typeof req.query === 'object') {
    (req as { query: JsonValue }).query = toCamelCase(req.query as JsonValue);
  }

  next();
};
