import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  adminId?: number;
}

export const generateToken = (adminId: number): string => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRE || '24h';

  return jwt.sign({ adminId }, secret, {
    expiresIn: expiresIn as any,
  });
};

export const verifyToken = (token: string): { adminId: number } | null => {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { adminId: number };
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Erro ao verificar token' });
  }
};
