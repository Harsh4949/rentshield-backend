import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({
    error: 'internal_server_error',
    message: err.message,
  });
}
