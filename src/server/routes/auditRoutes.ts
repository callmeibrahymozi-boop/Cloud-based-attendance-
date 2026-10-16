import { Router, Response } from 'express';
import { db } from '../db/database';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs - View audit logs (Admin only)
router.get('/', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { search, action, page = '1', limit = '20' } = req.query as Record<string, string>;

  let logs = db.getAuditLogs(1000);

  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        (l.username && l.username.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }

  if (action) {
    logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }

  const total = logs.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const paginated = logs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    logs: paginated,
  });
});

export default router;
