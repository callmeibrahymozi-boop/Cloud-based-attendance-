import { Router, Response } from 'express';
import { db } from '../db/database';
import { AuthRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { AttendanceStatus, SessionPeriod } from '../db/types';

const router = Router();

// GET /api/attendance/register - Fetch enrolled students and existing records for course, date, period
router.get('/register', requireRole(['admin', 'lecturer']), (req: AuthRequest, res: Response) => {
  const { course_id, attendance_date, session_period } = req.query as Record<string, string>;

  if (!course_id || !attendance_date || !session_period) {
    return res.status(400).json({
      success: false,
      message: 'Course ID, attendance date, and session period are required',
    });
  }

  const course = db.getCourseById(course_id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  // If lecturer, must be assigned to this course
  if (req.user!.role === 'lecturer' && course.lecturer_id !== req.user!.user_id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are not assigned to record attendance for this course',
    });
  }

  const enrolledStudents = db.getStudentsInCourse(course_id);

  // Check if attendance already recorded for this slot
  const existingRecords = db.getAttendanceRecords({
    course_id,
    attendance_date,
    session_period: session_period as SessionPeriod,
  });

  const recordMap = new Map<string, AttendanceStatus>();
  existingRecords.forEach((r) => recordMap.set(r.student_id, r.status));

  const registerItems = enrolledStudents.map((s) => ({
    student_id: s.user_id,
    matric_no: s.matric_no,
    full_name: s.full_name,
    department: s.department,
    status: recordMap.get(s.user_id) || null, // null if not yet marked
  }));

  const isRecorded = existingRecords.length > 0;
  const recordedBy = isRecorded ? db.getUserById(existingRecords[0].recorded_by)?.full_name : undefined;
  const recordedAt = isRecorded ? existingRecords[0].recorded_at : undefined;

  return res.json({
    success: true,
    course,
    attendance_date,
    session_period,
    is_recorded: isRecorded,
    recorded_by: recordedBy,
    recorded_at: recordedAt,
    students: registerItems,
  });
});

// POST /api/attendance/submit - Submit or update attendance records (Transactional)
router.post('/submit', requireRole(['admin', 'lecturer']), (req: AuthRequest, res: Response) => {
  const { course_id, attendance_date, session_period, records, is_update } = req.body;

  if (!course_id || !attendance_date || !session_period || !records || !Array.isArray(records)) {
    return res.status(400).json({
      success: false,
      message: 'course_id, attendance_date, session_period, and records array are required',
    });
  }

  const course = db.getCourseById(course_id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  if (req.user!.role === 'lecturer' && course.lecturer_id !== req.user!.user_id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are not assigned to record attendance for this course',
    });
  }

  // Validate status values
  const validStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Late'];
  for (const r of records) {
    if (!validStatuses.includes(r.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid attendance status "${r.status}" for student ${r.student_id}`,
      });
    }
  }

  try {
    const result = db.submitAttendanceTransaction({
      course_id,
      attendance_date,
      session_period: session_period as SessionPeriod,
      recorded_by: req.user!.user_id,
      records,
      is_update: Boolean(is_update),
    });

    const actionType = result.updated ? 'ATTENDANCE_UPDATED' : 'ATTENDANCE_RECORDED';
    logAudit(
      req,
      actionType,
      `${result.updated ? 'Updated' : 'Recorded'} attendance for ${course.course_code} on ${attendance_date} (${session_period}) - ${result.count} students`
    );

    return res.json({
      success: true,
      message: `Attendance for ${course.course_code} on ${attendance_date} (${session_period}) successfully saved.`,
      records_count: result.count,
      is_update: result.updated,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// GET /api/attendance/history - Filterable attendance records
router.get('/history', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const {
    course_id,
    student_id,
    attendance_date,
    session_period,
    status,
    start_date,
    end_date,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  // Security: Students can ONLY access their own attendance records
  let targetStudentId = student_id;
  if (user.role === 'student') {
    targetStudentId = user.user_id;
  }

  let records = db.getAttendanceRecords({
    course_id,
    student_id: targetStudentId,
    attendance_date,
    session_period: session_period as SessionPeriod,
    status: status as AttendanceStatus,
    start_date,
    end_date,
  });

  // If lecturer, restrict to courses assigned to them if no specific course provided
  if (user.role === 'lecturer' && !course_id) {
    const assignedCourses = new Set(
      db.getCourses().filter((c) => c.lecturer_id === user.user_id).map((c) => c.course_id)
    );
    records = records.filter((r) => assignedCourses.has(r.course_id));
  } else if (user.role === 'lecturer' && course_id) {
    const course = db.getCourseById(course_id);
    if (course && course.lecturer_id !== user.user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Course not assigned to you' });
    }
  }

  // Sort by date descending
  records = [...records].sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));

  // Join student & course info
  const enriched = records.map((r) => {
    const student = db.getUserById(r.student_id);
    const course = db.getCourseById(r.course_id);
    const recorder = db.getUserById(r.recorded_by);
    return {
      ...r,
      student_name: student?.full_name || 'Unknown',
      student_matric: student?.matric_no || 'N/A',
      course_code: course?.course_code || 'N/A',
      course_title: course?.course_title || 'N/A',
      recorded_by_name: recorder?.full_name || 'N/A',
    };
  });

  const total = enriched.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    records: paginated,
  });
});

// GET /api/attendance/correction-requests
router.get('/correction-requests', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let requests = db.getCorrectionRequests(user.role === 'student' ? user.user_id : undefined);

  // If lecturer, filter to requests for courses they teach
  if (user.role === 'lecturer') {
    const assignedCourseIds = new Set(
      db.getCourses().filter((c) => c.lecturer_id === user.user_id).map((c) => c.course_id)
    );
    requests = requests.filter((r) => assignedCourseIds.has(r.course_id));
  }

  const enriched = requests.map((r) => {
    const student = db.getUserById(r.student_id);
    const course = db.getCourseById(r.course_id);
    const reviewer = r.reviewed_by ? db.getUserById(r.reviewed_by) : undefined;
    return {
      ...r,
      student_name: student?.full_name || 'Unknown',
      student_matric: student?.matric_no || 'N/A',
      course_code: course?.course_code || 'N/A',
      course_title: course?.course_title || 'N/A',
      reviewer_name: reviewer?.full_name,
    };
  });

  return res.json({
    success: true,
    requests: enriched.sort((a, b) => b.created_at.localeCompare(a.created_at)),
  });
});

// POST /api/attendance/correction-request - Student submits correction request
router.post('/correction-request', requireRole(['student']), (req: AuthRequest, res: Response) => {
  const { attendance_id, course_id, attendance_date, current_status, requested_status, reason } = req.body;

  if (!course_id || !attendance_date || !requested_status || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Course ID, attendance date, requested status, and reason are required',
    });
  }

  try {
    const request = db.createCorrectionRequest({
      student_id: req.user!.user_id,
      attendance_id: attendance_id || undefined,
      course_id,
      attendance_date,
      current_status: (current_status as AttendanceStatus) || 'Absent',
      requested_status: requested_status as AttendanceStatus,
      reason: reason.trim(),
    });

    logAudit(req, 'CORRECTION_REQUESTED', `Student ${req.user!.username} requested correction for ${attendance_date}`);

    return res.status(201).json({
      success: true,
      message: 'Correction request submitted successfully and forwarded for review',
      request,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/attendance/correction-requests/:id - Review correction request (Admin or assigned Lecturer)
router.patch('/correction-requests/:id', requireRole(['admin', 'lecturer']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { decision, admin_note } = req.body;

  if (decision !== 'Approved' && decision !== 'Rejected') {
    return res.status(400).json({ success: false, message: 'Decision must be Approved or Rejected' });
  }

  try {
    const updated = db.reviewCorrectionRequest(id, decision, req.user!.user_id, admin_note);
    logAudit(
      req,
      'CORRECTION_REVIEWED',
      `${decision} correction request ${id} for student ${updated.student_id}`
    );

    return res.json({
      success: true,
      message: `Correction request has been ${decision.toLowerCase()}`,
      request: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
