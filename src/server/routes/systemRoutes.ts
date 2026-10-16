import { Router, Response } from 'express';
import { db } from '../db/database';
import { AuthRequest, requireRole, logAudit } from '../middleware/auth';
import { runAllTests } from '../../test/testSuite';

const router = Router();

// GET /api/health - Cloud deployment health check
router.get('/health', (_req, res) => {
  return res.json({
    status: 'healthy',
    service: 'EduTrack Attendance Management System',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      users_count: db.getUsers().length,
      courses_count: db.getCourses().length,
      attendance_records: db.getAttendanceRecords().length,
    },
  });
});

// GET /api/system/settings - Get institutional settings
router.get('/settings', (_req, res) => {
  return res.json({
    success: true,
    settings: db.getSettings(),
    departments: db.getDepartments(),
    sessions: db.getAcademicSessions(),
  });
});

// PUT /api/system/settings - Update settings (Admin only)
router.put('/settings', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const {
    institution_name,
    short_name,
    min_attendance_percentage,
    late_arrival_counts_as_present,
    allow_student_corrections,
    current_session,
    current_semester,
  } = req.body;

  try {
    const updated = db.updateSettings({
      ...(institution_name ? { institution_name: institution_name.trim() } : {}),
      ...(short_name ? { short_name: short_name.trim() } : {}),
      ...(min_attendance_percentage !== undefined ? { min_attendance_percentage: Number(min_attendance_percentage) } : {}),
      ...(late_arrival_counts_as_present !== undefined ? { late_arrival_counts_as_present: Boolean(late_arrival_counts_as_present) } : {}),
      ...(allow_student_corrections !== undefined ? { allow_student_corrections: Boolean(allow_student_corrections) } : {}),
      ...(current_session ? { current_session: current_session.trim() } : {}),
      ...(current_semester ? { current_semester } : {}),
    });

    logAudit(req, 'SETTINGS_UPDATED', 'Updated institutional attendance configurations');
    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/system/reset-demo - Reset database to clean demonstration state (Admin only)
router.post('/reset-demo', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  db.resetToSeed();
  logAudit(req, 'DEMO_DATA_RESET', 'Reset system to initial demonstration data');
  return res.json({
    success: true,
    message: 'System database successfully restored to standard demonstration dataset',
  });
});

// GET /api/system/run-tests - Execute automated test suite for evaluation
router.get('/run-tests', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runAllTests();
    logAudit(req, 'SYSTEM_TESTS_EXECUTED', `Executed ${testResults.total} automated tests with ${testResults.passed} passes`);
    return res.json({
      success: true,
      results: testResults,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
