import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../lib/security.ts';

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

/** Require a valid Bearer access token; attaches `req.user`. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }
  try {
    req.user = verifyAccessToken(header.slice('Bearer '.length));
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

/** Require an authenticated admin. Use after requireAuth. */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }
  next();
}
