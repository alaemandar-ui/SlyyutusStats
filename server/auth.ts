import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const rawSecret = process.env.SESSION_SECRET;
const JWT_SECRET = (!rawSecret || rawSecret.startsWith('replace_')) 
  ? 'slyyutus_stats_dev_session_secret_key_2026' 
  : rawSecret;

export interface TokenPayload {
  kickUserId: string;
  username: string;
  avatarUrl: string;
  role: 'admin' | 'user';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.auth_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login with Kick.' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }

  const isAdmin = 
    req.user.role === 'admin' || 
    db.isUserAdmin(req.user.kickUserId, req.user.username);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }

  next();
}
