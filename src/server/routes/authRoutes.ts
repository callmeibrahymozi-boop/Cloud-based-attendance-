import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { AuthRequest, JWT_SECRET, requireAuth, checkLoginRateLimit, logAudit } from '../middleware/auth';

const router = Router();

// Sanitize user object to never leak password hash
function sanitizeUser(user: any) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/login
router.post('/login', (req: AuthRequest, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!checkLoginRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 1 minute before trying again.',
    });
  }

  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username/Email and password are required',
    });
  }

  const user = db.getUserByUsernameOrEmail(identifier);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please verify your username/email and password.',
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Account has been deactivated. Please contact your institutional administrator.',
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please verify your username/email and password.',
    });
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  req.user = user;
  logAudit(req, 'USER_LOGIN', `User ${user.username} (${user.role}) logged in successfully`);

  return res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// POST /api/auth/logout
router.post('/logout', (req: AuthRequest, res: Response) => {
  if (req.user) {
    logAudit(req, 'USER_LOGOUT', `User ${req.user.username} logged out`);
  }
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: AuthRequest, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Username or email is required' });
  }

  const user = db.getUserByUsernameOrEmail(identifier);
  if (!user) {
    // Return standard success message so we do not reveal user enumeration
    return res.json({
      success: true,
      message: 'If an account exists with that identifier, a password reset token has been generated.',
    });
  }

  const resetToken = db.createPasswordResetToken(user.user_id);
  logAudit(req, 'PASSWORD_RESET_REQUESTED', `Password reset requested for ${user.username}`);

  // In production this sends an email. In our system we also return the token for immediate testing.
  return res.json({
    success: true,
    message: 'Password reset token generated. Use this token to reset your password.',
    reset_token: resetToken,
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req: AuthRequest, res: Response) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const validToken = db.verifyPasswordResetToken(token);
  if (!validToken) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset token. Please request a new one.',
    });
  }

  const user = db.getUserById(validToken.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const password_hash = bcrypt.hashSync(new_password, 10);
  db.updateUser(user.user_id, { password_hash });
  db.consumePasswordResetToken(token);

  logAudit(req, 'PASSWORD_RESET_COMPLETED', `Password reset completed for ${user.username}`);

  return res.json({
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = db.getUserById(req.user!.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const isMatch = bcrypt.compareSync(old_password, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Incorrect current password' });
  }

  const password_hash = bcrypt.hashSync(new_password, 10);
  db.updateUser(user.user_id, { password_hash });

  logAudit(req, 'PASSWORD_CHANGED', `User ${user.username} changed their password`);

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { full_name, phone, email } = req.body;
  try {
    const updated = db.updateUser(req.user!.user_id, {
      full_name: full_name?.trim() || req.user!.full_name,
      phone: phone?.trim(),
      email: email?.trim() || req.user!.email,
    });
    logAudit(req, 'PROFILE_UPDATED', `User ${req.user!.username} updated profile details`);
    return res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
