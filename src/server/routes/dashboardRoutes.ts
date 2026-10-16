import { Router, Response } from 'express';
import { db } from '../db/database';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/admin
router.get('/admin', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const students = users.filter((u) => u.role === 'student' && u.status === 'active');
  const lecturers = users.filter((u) => u.role === 'lecturer' && u.status === 'active');
  const courses = db.getCourses();
  const allRecords = db.getAttendanceRecords();
  const settings = db.getSettings();

  const totalRecords = allRecords.length;
  const present = allRecords.filter((r) => r.status === 'Present').length;
  const late = allRecords.filter((r) => r.status === 'Late').length;
  const absent = allRecords.filter((r) => r.status === 'Absent').length;
  const attended = settings.late_arrival_counts_as_present ? present + late : present;
  const overallRate = totalRecords > 0 ? Math.round((attended / totalRecords) * 100 * 10) / 10 : 0;

  // Attendance trend aggregated by date
  const dateMap = new Map<string, { date: string; present: number; absent: number; late: number; total: number }>();
  allRecords.forEach((r) => {
    const existing = dateMap.get(r.attendance_date) || {
      date: r.attendance_date,
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    };
    if (r.status === 'Present') existing.present += 1;
    else if (r.status === 'Absent') existing.absent += 1;
    else if (r.status === 'Late') existing.late += 1;
    existing.total += 1;
    dateMap.set(r.attendance_date, existing);
  });

  const trends = Array.from(dateMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      rate: item.total > 0 ? Math.round(((item.present + item.late) / item.total) * 100) : 0,
    }));

  // Department distribution
  const deptMap = new Map<string, { name: string; students: number; courses: number }>();
  db.getDepartments().forEach((d) => {
    deptMap.set(d.name, { name: d.name, students: 0, courses: 0 });
  });

  students.forEach((s) => {
    const entry = deptMap.get(s.department) || { name: s.department, students: 0, courses: 0 };
    entry.students += 1;
    deptMap.set(s.department, entry);
  });

  courses.forEach((c) => {
    const entry = deptMap.get(c.department) || { name: c.department, students: 0, courses: 0 };
    entry.courses += 1;
    deptMap.set(c.department, entry);
  });

  const recentLogs = db.getAuditLogs(10);
  const pendingCorrections = db.getCorrectionRequests().filter((r) => r.status === 'Pending').length;

  return res.json({
    success: true,
    stats: {
      total_students: students.length,
      total_lecturers: lecturers.length,
      total_courses: courses.length,
      total_attendance_records: totalRecords,
      overall_attendance_rate: overallRate,
      present_count: present,
      late_count: late,
      absent_count: absent,
      pending_corrections: pendingCorrections,
    },
    trends,
    departments: Array.from(deptMap.values()),
    recent_logs: recentLogs,
  });
});

// GET /api/dashboard/lecturer
router.get('/lecturer', requireRole(['lecturer']), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const assignedCourses = db.getCourses().filter((c) => c.lecturer_id === user.user_id);
  const assignedIds = new Set(assignedCourses.map((c) => c.course_id));

  let totalEnrolled = 0;
  const courseCards = assignedCourses.map((c) => {
    const enrolled = db.getStudentsInCourse(c.course_id);
    totalEnrolled += enrolled.length;
    const records = db.getAttendanceRecords({ course_id: c.course_id });
    const uniqueDates = new Set(records.map((r) => r.attendance_date)).size;

    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const total = records.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100 * 10) / 10 : 0;

    return {
      course_id: c.course_id,
      course_code: c.course_code,
      course_title: c.course_title,
      enrolled_count: enrolled.length,
      classes_recorded: uniqueDates,
      total_records: total,
      attendance_rate: rate,
    };
  });

  // Recent attendance sessions recorded
  const allRecords = db.getAttendanceRecords();
  const lecturerRecords = allRecords.filter((r) => assignedIds.has(r.course_id));

  // Group by (course_id, attendance_date, session_period)
  const sessionMap = new Map<string, { course_code: string; date: string; period: string; count: number }>();
  lecturerRecords.forEach((r) => {
    const key = `${r.course_id}_${r.attendance_date}_${r.session_period}`;
    const course = db.getCourseById(r.course_id);
    const existing = sessionMap.get(key) || {
      course_code: course?.course_code || '',
      date: r.attendance_date,
      period: r.session_period,
      count: 0,
    };
    existing.count += 1;
    sessionMap.set(key, existing);
  });

  const recentSessions = Array.from(sessionMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const pendingCorrections = db
    .getCorrectionRequests()
    .filter((r) => assignedIds.has(r.course_id) && r.status === 'Pending').length;

  return res.json({
    success: true,
    stats: {
      assigned_courses_count: assignedCourses.length,
      total_enrolled_students: totalEnrolled,
      total_sessions_recorded: sessionMap.size,
      pending_corrections: pendingCorrections,
    },
    courses: courseCards,
    recent_sessions: recentSessions,
  });
});

// GET /api/dashboard/student
router.get('/student', requireRole(['student']), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const enrolledCourses = db.getCoursesForStudent(user.user_id);
  const settings = db.getSettings();

  const userRecords = db.getAttendanceRecords({ student_id: user.user_id });
  const totalClassesRecorded = userRecords.length;
  const presentCount = userRecords.filter((r) => r.status === 'Present').length;
  const lateCount = userRecords.filter((r) => r.status === 'Late').length;
  const absentCount = userRecords.filter((r) => r.status === 'Absent').length;

  const attendedCount = settings.late_arrival_counts_as_present ? presentCount + lateCount : presentCount;
  const overallPercentage =
    totalClassesRecorded > 0 ? Math.round((attendedCount / totalClassesRecorded) * 100 * 10) / 10 : 0;

  // Course breakdown
  const courseBreakdown = enrolledCourses.map((c) => {
    const courseRecords = userRecords.filter((r) => r.course_id === c.course_id);
    const crsRecorded = courseRecords.length;
    const crsPresent = courseRecords.filter((r) => r.status === 'Present').length;
    const crsLate = courseRecords.filter((r) => r.status === 'Late').length;
    const crsAbsent = courseRecords.filter((r) => r.status === 'Absent').length;
    const crsAttended = settings.late_arrival_counts_as_present ? crsPresent + crsLate : crsPresent;
    const crsPercentage = crsRecorded > 0 ? Math.round((crsAttended / crsRecorded) * 100 * 10) / 10 : 0;

    let examStatus: 'Eligible' | 'Warning' | 'Ineligible' = 'Ineligible';
    if (crsRecorded === 0) {
      examStatus = 'Ineligible';
    } else if (crsPercentage >= settings.min_attendance_percentage) {
      examStatus = 'Eligible';
    } else if (crsPercentage >= settings.min_attendance_percentage - 10) {
      examStatus = 'Warning';
    } else {
      examStatus = 'Ineligible';
    }

    return {
      course_id: c.course_id,
      course_code: c.course_code,
      course_title: c.course_title,
      credit_unit: c.credit_unit,
      lecturer_name: c.lecturer_name,
      total_recorded: crsRecorded,
      present: crsPresent,
      late: crsLate,
      absent: crsAbsent,
      percentage: crsPercentage,
      exam_status: examStatus,
    };
  });

  // Low attendance warning list
  const lowAttendanceCourses = courseBreakdown.filter(
    (c) => c.total_recorded > 0 && c.percentage < settings.min_attendance_percentage
  );

  // Recent 10 attendance events
  const recentHistory = [...userRecords]
    .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
    .slice(0, 10)
    .map((r) => {
      const course = db.getCourseById(r.course_id);
      return {
        ...r,
        course_code: course?.course_code || 'N/A',
        course_title: course?.course_title || 'N/A',
      };
    });

  const myCorrections = db.getCorrectionRequests(user.user_id);

  return res.json({
    success: true,
    stats: {
      total_enrolled_courses: enrolledCourses.length,
      total_classes_recorded: totalClassesRecorded,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      attended_count: attendedCount,
      overall_percentage: overallPercentage,
      min_threshold: settings.min_attendance_percentage,
      is_eligible_overall: overallPercentage >= settings.min_attendance_percentage,
    },
    courses: courseBreakdown,
    low_attendance_warnings: lowAttendanceCourses,
    recent_history: recentHistory,
    corrections: myCorrections,
  });
});

export default router;
