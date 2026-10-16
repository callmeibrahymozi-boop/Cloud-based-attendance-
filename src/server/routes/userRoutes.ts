import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { AuthRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { UserRole, UserStatus } from '../db/types';

const router = Router();

function sanitizeUser(user: any) {
  const { password_hash, ...safe } = user;
  return safe;
}

// GET /api/users - List users (Admin only) with search, filters, pagination
router.get('/', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  let users = db.getUsers().map(sanitizeUser);

  const { search, role, status, department, page = '1', limit = '10' } = req.query as Record<string, string>;

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.matric_no && u.matric_no.toLowerCase().includes(q))
    );
  }

  if (role) {
    users = users.filter((u) => u.role === role);
  }

  if (status) {
    users = users.filter((u) => u.status === status);
  }

  if (department) {
    users = users.filter((u) => u.department.toLowerCase() === department.toLowerCase());
  }

  const total = users.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = users.slice(startIndex, startIndex + limitNum);

  return res.json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    users: paginated,
  });
});

// GET /api/users/lecturers - List active lecturers (authenticated)
router.get('/lecturers', requireAuth, (_req: AuthRequest, res: Response) => {
  const lecturers = db
    .getUsers()
    .filter((u) => u.role === 'lecturer' && u.status === 'active')
    .map(sanitizeUser);
  return res.json({ success: true, lecturers });
});

// GET /api/users/students - List active students (authenticated)
router.get('/students', requireAuth, (_req: AuthRequest, res: Response) => {
  const students = db
    .getUsers()
    .filter((u) => u.role === 'student' && u.status === 'active')
    .map(sanitizeUser);
  return res.json({ success: true, students });
});

// POST /api/users - Create User (Admin only)
router.post('/', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { username, password, role, email, full_name, matric_no, department, phone, status } = req.body;

  if (!username || !password || !role || !email || !full_name || !department) {
    return res.status(400).json({
      success: false,
      message: 'Username, password, role, email, full name, and department are required',
    });
  }

  const validRoles: UserRole[] = ['admin', 'lecturer', 'student'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const password_hash = bcrypt.hashSync(password, 10);
    const newUser = db.createUser({
      user_id: 'usr_' + Math.random().toString(36).substring(2, 10),
      username: username.trim(),
      password_hash,
      role,
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      matric_no: matric_no?.trim() || undefined,
      department: department.trim(),
      phone: phone?.trim(),
      status: (status as UserStatus) || 'active',
    });

    logAudit(req, 'USER_CREATED', `Created user ${newUser.username} as ${newUser.role}`);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id - Update User (Admin only)
router.put('/:id', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { username, role, email, full_name, matric_no, department, phone, status } = req.body;

  try {
    const updated = db.updateUser(id, {
      ...(username ? { username: username.trim() } : {}),
      ...(role ? { role } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(full_name ? { full_name: full_name.trim() } : {}),
      ...(matric_no !== undefined ? { matric_no: matric_no.trim() || undefined } : {}),
      ...(department ? { department: department.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(status ? { status } : {}),
    });

    logAudit(req, 'USER_UPDATED', `Updated details for user ${updated.username}`);

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: sanitizeUser(updated),
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/status - Toggle active/inactive status (Admin only)
router.patch('/:id/status', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'inactive') {
    return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
  }

  try {
    const targetUser = db.getUserById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.username === 'admin' && status === 'inactive') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate primary system administrator' });
    }

    const updated = db.updateUser(id, { status });
    logAudit(req, 'USER_STATUS_CHANGED', `Changed status of ${updated.username} to ${status}`);

    return res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: sanitizeUser(updated),
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/reset-password - Admin resets user password (Admin only)
router.post('/:id/reset-password', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  try {
    const user = db.getUserById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const password_hash = bcrypt.hashSync(new_password, 10);
    db.updateUser(id, { password_hash });

    logAudit(req, 'ADMIN_PASSWORD_RESET', `Admin reset password for user ${user.username}`);

    return res.json({
      success: true,
      message: `Password reset successfully for ${user.username}`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id - Delete User (Admin only)
router.delete('/:id', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = db.getUserById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    db.deleteUser(id);
    logAudit(req, 'USER_DELETED', `Deleted user ${user.username} (${user.role})`);

    return res.json({
      success: true,
      message: `User ${user.username} deleted successfully`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
