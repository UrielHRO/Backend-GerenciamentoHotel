import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const errorHandler = (
  err: any,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    statusCode,
  });
};
