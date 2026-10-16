import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { User, UserRole } from '../db/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_attendance_jwt_secure_secret_2026';

export interface AuthRequest extends Request {
  user?: User;
}

// Simple in-memory rate limiter for brute-force protection
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60 * 1000 }); // 1 min window
    return true;
  }
  if (record.count >= 10) {
    return false; // exceeded 10 attempts per min
  }
  record.count += 1;
  return true;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string; role: UserRole };
    const user = db.getUserById(decoded.user_id);
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch (err) {
    // Token invalid or expired
  }

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`,
      });
    }

    next();
  };
}

export function logAudit(
  req: AuthRequest,
  action: string,
  details: string
) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  db.addAuditLog({
    user_id: req.user?.user_id,
    username: req.user?.username || 'anonymous',
    role: req.user?.role || 'guest',
    action,
    details,
    ip_address: ip,
  });
}
