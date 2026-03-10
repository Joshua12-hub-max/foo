import { Request, Response, NextFunction } from 'express';
import { toCamelCase } from '../utils/caseUtils.js';

type JsonValue = string | number | boolean | null | undefined | { [key: string]: JsonValue } | JsonValue[];

export const namingMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    // Cast to JsonValue for toCamelCase then back to req.body's type
    const camelBody = toCamelCase(req.body as JsonValue);
    req.body = camelBody as typeof req.body;
  }
  
  if (req.query && typeof req.query === 'object') {
    // Cast to JsonValue for toCamelCase then back to req.query's type
    const camelQuery = toCamelCase(req.query as unknown as JsonValue);
    req.query = camelQuery as typeof req.query;
  }

  next();
};
