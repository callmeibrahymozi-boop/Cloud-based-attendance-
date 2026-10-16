import { Router, Response } from 'express';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../db/database';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/reports/course - Detailed course attendance report
router.get('/course', requireAuth, (req: AuthRequest, res: Response) => {
  const { course_id, session, semester, start_date, end_date } = req.query as Record<string, string>;

  if (!course_id) {
    return res.status(400).json({ success: false, message: 'Course ID is required' });
  }

  const course = db.getCourseById(course_id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  // If lecturer, verify assignment
  if (req.user!.role === 'lecturer' && course.lecturer_id !== req.user!.user_id) {
    return res.status(403).json({ success: false, message: 'Forbidden: Course not assigned to you' });
  }

  const lecturer = course.lecturer_id ? db.getUserById(course.lecturer_id) : undefined;
  const enrolledStudents = db.getStudentsInCourse(course_id);
  const settings = db.getSettings();

  // Get all attendance records for this course within date range
  let records = db.getAttendanceRecords({
    course_id,
    start_date,
    end_date,
  });

  // Calculate unique class sessions held for this course
  const uniqueSessions = new Set(records.map((r) => `${r.attendance_date}_${r.session_period}`));
  const totalClassesHeld = uniqueSessions.size;

  // Student metrics
  const studentReports = enrolledStudents.map((student) => {
    const studentRecords = records.filter((r) => r.student_id === student.user_id);
    const recordedCount = studentRecords.length;
    const presentCount = studentRecords.filter((r) => r.status === 'Present').length;
    const lateCount = studentRecords.filter((r) => r.status === 'Late').length;
    const absentCount = studentRecords.filter((r) => r.status === 'Absent').length;

    // Attended = Present + Late (if late counts as present, per institutional policy)
    const attendedCount = settings.late_arrival_counts_as_present ? presentCount + lateCount : presentCount;
    const percentage = recordedCount > 0 ? Math.round((attendedCount / recordedCount) * 100 * 10) / 10 : 0;

    let examStatus: 'Eligible' | 'Warning' | 'Ineligible' = 'Ineligible';
    if (recordedCount === 0) {
      examStatus = 'Ineligible';
    } else if (percentage >= settings.min_attendance_percentage) {
      examStatus = 'Eligible';
    } else if (percentage >= settings.min_attendance_percentage - 10) {
      examStatus = 'Warning';
    } else {
      examStatus = 'Ineligible';
    }

    return {
      student_id: student.user_id,
      matric_no: student.matric_no || 'N/A',
      full_name: student.full_name,
      department: student.department,
      total_recorded: recordedCount,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      attended_count: attendedCount,
      percentage,
      exam_status: examStatus,
    };
  });

  const avgAttendance =
    studentReports.length > 0
      ? Math.round((studentReports.reduce((acc, s) => acc + s.percentage, 0) / studentReports.length) * 10) / 10
      : 0;

  const eligibleCount = studentReports.filter((s) => s.exam_status === 'Eligible').length;
  const atRiskCount = studentReports.filter((s) => s.exam_status !== 'Eligible').length;

  return res.json({
    success: true,
    meta: {
      generated_at: new Date().toISOString(),
      institution: settings.institution_name,
      course_id: course.course_id,
      course_code: course.course_code,
      course_title: course.course_title,
      credit_unit: course.credit_unit,
      department: course.department,
      lecturer_name: lecturer ? lecturer.full_name : 'Unassigned',
      session: session || course.academic_session,
      semester: semester || course.semester,
      min_required_percentage: settings.min_attendance_percentage,
      total_classes_held: totalClassesHeld,
      total_enrolled: enrolledStudents.length,
      average_attendance: avgAttendance,
      eligible_count: eligibleCount,
      at_risk_count: atRiskCount,
      applied_filters: { start_date: start_date || 'All', end_date: end_date || 'All' },
    },
    students: studentReports,
  });
});

// GET /api/reports/institutional - Institution-wide analysis (Admin only)
router.get('/institutional', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { department, session, semester, start_date, end_date } = req.query as Record<string, string>;

  let courses = db.getCourses();
  if (department) {
    courses = courses.filter((c) => c.department.toLowerCase() === department.toLowerCase());
  }

  const settings = db.getSettings();
  const allRecords = db.getAttendanceRecords({ start_date, end_date });
  const allUsers = db.getUsers();
  const students = allUsers.filter((u) => u.role === 'student' && u.status === 'active');
  const lecturers = allUsers.filter((u) => u.role === 'lecturer' && u.status === 'active');

  const courseSummaries = courses.map((course) => {
    const courseRecords = allRecords.filter((r) => r.course_id === course.course_id);
    const enrolled = db.getStudentsInCourse(course.course_id);
    const uniqueSessions = new Set(courseRecords.map((r) => `${r.attendance_date}_${r.session_period}`)).size;

    const present = courseRecords.filter((r) => r.status === 'Present').length;
    const late = courseRecords.filter((r) => r.status === 'Late').length;
    const absent = courseRecords.filter((r) => r.status === 'Absent').length;
    const total = courseRecords.length;

    const attended = settings.late_arrival_counts_as_present ? present + late : present;
    const rate = total > 0 ? Math.round((attended / total) * 100 * 10) / 10 : 0;
    const lecturer = course.lecturer_id ? db.getUserById(course.lecturer_id) : undefined;

    return {
      course_id: course.course_id,
      course_code: course.course_code,
      course_title: course.course_title,
      department: course.department,
      lecturer_name: lecturer ? lecturer.full_name : 'Unassigned',
      enrolled_count: enrolled.length,
      classes_held: uniqueSessions,
      total_records: total,
      present_count: present,
      late_count: late,
      absent_count: absent,
      attendance_rate: rate,
    };
  });

  const totalRecordsCount = allRecords.length;
  const totalPresent = allRecords.filter((r) => r.status === 'Present').length;
  const totalLate = allRecords.filter((r) => r.status === 'Late').length;
  const totalAbsent = allRecords.filter((r) => r.status === 'Absent').length;
  const overallAttended = settings.late_arrival_counts_as_present ? totalPresent + totalLate : totalPresent;
  const overallRate = totalRecordsCount > 0 ? Math.round((overallAttended / totalRecordsCount) * 100 * 10) / 10 : 0;

  return res.json({
    success: true,
    summary: {
      generated_at: new Date().toISOString(),
      institution: settings.institution_name,
      total_students: students.length,
      total_lecturers: lecturers.length,
      total_courses: courses.length,
      total_records: totalRecordsCount,
      present_percentage: totalRecordsCount > 0 ? Math.round((totalPresent / totalRecordsCount) * 100 * 10) / 10 : 0,
      late_percentage: totalRecordsCount > 0 ? Math.round((totalLate / totalRecordsCount) * 100 * 10) / 10 : 0,
      absent_percentage: totalRecordsCount > 0 ? Math.round((totalAbsent / totalRecordsCount) * 100 * 10) / 10 : 0,
      overall_attendance_rate: overallRate,
    },
    courses: courseSummaries,
  });
});

// GET /api/reports/export/excel - Server-side Genuine Excel export
router.get('/export/excel', requireAuth, (req: AuthRequest, res: Response) => {
  const { course_id } = req.query as Record<string, string>;

  if (!course_id) {
    return res.status(400).json({ success: false, message: 'Course ID required for export' });
  }

  const course = db.getCourseById(course_id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const enrolled = db.getStudentsInCourse(course_id);
  const records = db.getAttendanceRecords({ course_id });
  const settings = db.getSettings();

  const dataRows = enrolled.map((s, index) => {
    const sRecords = records.filter((r) => r.student_id === s.user_id);
    const present = sRecords.filter((r) => r.status === 'Present').length;
    const late = sRecords.filter((r) => r.status === 'Late').length;
    const absent = sRecords.filter((r) => r.status === 'Absent').length;
    const total = sRecords.length;
    const attended = settings.late_arrival_counts_as_present ? present + late : present;
    const pct = total > 0 ? Math.round((attended / total) * 100 * 10) / 10 : 0;

    return {
      'S/N': index + 1,
      'Matric No': s.matric_no || 'N/A',
      'Student Name': s.full_name,
      'Department': s.department,
      'Total Classes Recorded': total,
      'Present': present,
      'Late': late,
      'Absent': absent,
      'Attendance Rate (%)': `${pct}%`,
      'Exam Eligibility': pct >= settings.min_attendance_percentage ? 'Eligible' : 'Ineligible',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${course.course_code}_Attendance_Report.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
});

// GET /api/reports/export/pdf - Server-side Genuine PDF export
router.get('/export/pdf', requireAuth, (req: AuthRequest, res: Response) => {
  const { course_id } = req.query as Record<string, string>;

  if (!course_id) {
    return res.status(400).json({ success: false, message: 'Course ID required for export' });
  }

  const course = db.getCourseById(course_id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const enrolled = db.getStudentsInCourse(course_id);
  const records = db.getAttendanceRecords({ course_id });
  const settings = db.getSettings();
  const lecturer = course.lecturer_id ? db.getUserById(course.lecturer_id) : undefined;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text(settings.institution_name, 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`Official Attendance Register & Report - ${course.course_code}: ${course.course_title}`, 14, 26);

  doc.setFontSize(10);
  doc.text(`Lecturer: ${lecturer?.full_name || 'Unassigned'}  |  Session: ${course.academic_session} (${course.semester} Semester)`, 14, 33);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  |  Minimum Exam Threshold: ${settings.min_attendance_percentage}%`, 14, 39);

  // Table rows
  const tableData = enrolled.map((s, index) => {
    const sRecords = records.filter((r) => r.student_id === s.user_id);
    const present = sRecords.filter((r) => r.status === 'Present').length;
    const late = sRecords.filter((r) => r.status === 'Late').length;
    const absent = sRecords.filter((r) => r.status === 'Absent').length;
    const total = sRecords.length;
    const attended = settings.late_arrival_counts_as_present ? present + late : present;
    const pct = total > 0 ? Math.round((attended / total) * 100 * 10) / 10 : 0;
    const status = pct >= settings.min_attendance_percentage ? 'Eligible' : 'Ineligible';

    return [
      (index + 1).toString(),
      s.matric_no || 'N/A',
      s.full_name,
      total.toString(),
      present.toString(),
      late.toString(),
      absent.toString(),
      `${pct}%`,
      status,
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Matric No', 'Student Name', 'Total', 'Present', 'Late', 'Absent', 'Rate', 'Exam Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  const pdfOutput = doc.output('arraybuffer');
  res.setHeader('Content-Disposition', `attachment; filename="${course.course_code}_Attendance_Report.pdf"`);
  res.setHeader('Content-Type', 'application/pdf');
  return res.send(Buffer.from(pdfOutput));
});

export default router;
