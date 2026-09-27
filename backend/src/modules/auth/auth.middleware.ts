import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'sinergia-super-secret-jwt-key-2026';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Acesso negado. Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; name: string };
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name
    };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; name: string };
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name
      };
    } catch (err) {}
  }
  return next();
}
