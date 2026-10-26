import { Router, Response } from 'express';
import { db } from '../db/database';
import { AuthRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { SemesterType } from '../db/types';

const router = Router();

// GET /api/courses - List courses with lecturer details & enrolment count
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let courses = db.getCourses();

  // If lecturer, they can see all courses or filter to their own
  const { assignedOnly } = req.query;
  if (user.role === 'lecturer' && assignedOnly === 'true') {
    courses = courses.filter((c) => c.lecturer_id === user.user_id);
  }

  // Enrich course data
  const enriched = courses.map((course) => {
    const lecturer = course.lecturer_id ? db.getUserById(course.lecturer_id) : undefined;
    const enrolledStudents = db.getStudentsInCourse(course.course_id);
    return {
      ...course,
      lecturer_name: lecturer ? lecturer.full_name : 'Unassigned',
      lecturer_email: lecturer?.email,
      enrolled_count: enrolledStudents.length,
    };
  });

  return res.json({ success: true, courses: enriched });
});

// ==========================================
// STUDENT SELF-REGISTRATION ENDPOINTS
// (Must be defined before parameterized /:id)
// ==========================================

// GET /api/courses/student/available - List all courses with registration status for the logged-in student
router.get('/student/available', requireRole(['student']), (req: AuthRequest, res: Response) => {
  const studentId = req.user!.user_id;
  const allCourses = db.getCourses();
  const studentEnrolments = db.getEnrolments().filter((e) => e.student_id === studentId);
  const enrolledCourseMap = new Map<string, string>();
  studentEnrolments.forEach((e) => enrolledCourseMap.set(e.course_id, e.enrolment_id));

  const enriched = allCourses.map((c) => {
    const lecturer = c.lecturer_id ? db.getUserById(c.lecturer_id) : undefined;
    const isRegistered = enrolledCourseMap.has(c.course_id);
    return {
      ...c,
      lecturer_name: lecturer ? lecturer.full_name : 'Unassigned',
      is_registered: isRegistered,
      enrolment_id: enrolledCourseMap.get(c.course_id),
    };
  });

  return res.json({
    success: true,
    courses: enriched,
    available_courses: enriched,
    total_registered: studentEnrolments.length,
  });
});

// GET /api/courses/student/enrolled - List enrolled courses for the logged-in student
router.get(['/student/enrolled', '/student/my-courses'], requireRole(['student']), (req: AuthRequest, res: Response) => {
  const studentId = req.user!.user_id;
  const enrolledCourses = db.getCoursesForStudent(studentId);
  return res.json({
    success: true,
    courses: enrolledCourses,
    enrolled_courses: enrolledCourses,
    total_enrolled: enrolledCourses.length,
  });
});

// POST /api/courses/student/register - Student self-registration for a course
router.post('/student/register', requireRole(['student']), (req: AuthRequest, res: Response) => {
  const studentId = req.user!.user_id;
  const { course_id, course_code } = req.body;

  if (!course_id && !course_code) {
    return res.status(400).json({ success: false, message: 'Course ID or Course Code is required' });
  }

  let course = course_id ? db.getCourseById(course_id) : undefined;
  if (!course && course_code) {
    course = db.getCourseByCode(course_code);
  }

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course offering not found' });
  }

  try {
    const enrolment = db.enrolStudent(
      studentId,
      course.course_id,
      course.academic_session,
      course.semester
    );

    logAudit(
      req,
      'STUDENT_SELF_REGISTRATION',
      `Student ${req.user!.full_name} (${req.user!.matric_no || req.user!.username}) registered for ${course.course_code}: ${course.course_title}`
    );

    return res.status(201).json({
      success: true,
      message: `Successfully registered for ${course.course_code}: ${course.course_title}`,
      enrolment,
      course,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/courses/student/register-all - Student self-registers for all available courses or department courses
router.post('/student/register-all', requireRole(['student']), (req: AuthRequest, res: Response) => {
  const studentId = req.user!.user_id;
  const student = req.user!;
  const allCourses = db.getCourses();
  const existingEnrolments = new Set(
    db.getEnrolments().filter((e) => e.student_id === studentId).map((e) => e.course_id)
  );

  // Filter courses for student's department or all if department matches
  let targetCourses = allCourses.filter((c) => !existingEnrolments.has(c.course_id));
  
  // If specific course_ids provided, use those
  const { course_ids } = req.body;
  if (Array.isArray(course_ids) && course_ids.length > 0) {
    targetCourses = allCourses.filter((c) => course_ids.includes(c.course_id) && !existingEnrolments.has(c.course_id));
  }

  if (targetCourses.length === 0) {
    return res.json({
      success: true,
      message: 'You are already registered for all available courses.',
      registered_count: 0,
    });
  }

  const newlyEnrolled = [];
  for (const c of targetCourses) {
    try {
      const enr = db.enrolStudent(studentId, c.course_id, c.academic_session, c.semester);
      newlyEnrolled.push(c.course_code);
    } catch {
      // Continue to next course if one fails
    }
  }

  logAudit(
    req,
    'STUDENT_BULK_REGISTRATION',
    `Student ${student.full_name} bulk-registered for ${newlyEnrolled.length} courses: ${newlyEnrolled.join(', ')}`
  );

  return res.json({
    success: true,
    message: `Successfully registered for ${newlyEnrolled.length} course(s): ${newlyEnrolled.join(', ')}`,
    registered_count: newlyEnrolled.length,
    registered_courses: newlyEnrolled,
  });
});

// POST /api/courses/student/drop - Student drops an enrolled course
router.post('/student/drop', requireRole(['student']), (req: AuthRequest, res: Response) => {
  const studentId = req.user!.user_id;
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({ success: false, message: 'Course ID is required' });
  }

  const course = db.getCourseById(course_id);
  const enrolments = db.getEnrolments().filter(
    (e) => e.student_id === studentId && e.course_id === course_id
  );

  if (enrolments.length === 0) {
    return res.status(404).json({ success: false, message: 'You are not enrolled in this course' });
  }

  const enrolmentId = enrolments[0].enrolment_id;
  const removed = db.removeEnrolment(enrolmentId);

  if (!removed) {
    return res.status(400).json({ success: false, message: 'Unable to drop course enrolment' });
  }

  logAudit(
    req,
    'STUDENT_DROPPED_COURSE',
    `Student ${req.user!.username} dropped course ${course?.course_code || course_id}`
  );

  return res.json({
    success: true,
    message: `Successfully dropped course ${course?.course_code || ''}`,
  });
});

// ==========================================
// COURSE DETAILS & MANAGEMENT (ADMIN / LECTURER)
// ==========================================

// GET /api/courses/:id - Course detail
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const lecturer = course.lecturer_id ? db.getUserById(course.lecturer_id) : undefined;
  const enrolledStudents = db.getStudentsInCourse(course.course_id);

  return res.json({
    success: true,
    course: {
      ...course,
      lecturer_name: lecturer ? lecturer.full_name : 'Unassigned',
      enrolled_count: enrolledStudents.length,
    },
  });
});

// POST /api/courses - Create course (Admin only)
router.post('/', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { course_code, course_title, credit_unit, department, lecturer_id, academic_session, semester } = req.body;

  if (!course_code || !course_title || !credit_unit || !department || !academic_session || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Course code, title, credit unit, department, academic session, and semester are required',
    });
  }

  try {
    const newCourse = db.createCourse({
      course_id: 'crs_' + Math.random().toString(36).substring(2, 9),
      course_code: course_code.trim().toUpperCase(),
      course_title: course_title.trim(),
      credit_unit: Number(credit_unit),
      department: department.trim(),
      lecturer_id: lecturer_id || undefined,
      academic_session: academic_session.trim(),
      semester: semester as SemesterType,
    });

    logAudit(req, 'COURSE_CREATED', `Created course ${newCourse.course_code}: ${newCourse.course_title}`);

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: newCourse,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/courses/:id - Update course (Admin only)
router.put('/:id', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { course_code, course_title, credit_unit, department, lecturer_id, academic_session, semester } = req.body;

  try {
    const updated = db.updateCourse(id, {
      ...(course_code ? { course_code: course_code.trim().toUpperCase() } : {}),
      ...(course_title ? { course_title: course_title.trim() } : {}),
      ...(credit_unit !== undefined ? { credit_unit: Number(credit_unit) } : {}),
      ...(department ? { department: department.trim() } : {}),
      ...(lecturer_id !== undefined ? { lecturer_id: lecturer_id || undefined } : {}),
      ...(academic_session ? { academic_session: academic_session.trim() } : {}),
      ...(semester ? { semester: semester as SemesterType } : {}),
    });

    logAudit(req, 'COURSE_UPDATED', `Updated course ${updated.course_code}`);

    return res.json({
      success: true,
      message: 'Course updated successfully',
      course: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/courses/:id - Delete course (Admin only)
router.delete('/:id', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const course = db.getCourseById(id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  db.deleteCourse(id);
  logAudit(req, 'COURSE_DELETED', `Deleted course ${course.course_code}`);

  return res.json({
    success: true,
    message: `Course ${course.course_code} and associated records deleted successfully`,
  });
});

// GET /api/courses/:id/students - List enrolled students (Admin or assigned Lecturer)
router.get('/:id/students', requireAuth, (req: AuthRequest, res: Response) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  if (req.user!.role === 'lecturer' && course.lecturer_id !== req.user!.user_id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are not assigned to this course',
    });
  }

  const students = db.getStudentsInCourse(req.params.id);
  return res.json({
    success: true,
    course,
    students,
  });
});

// POST /api/courses/:id/enrol - Enrol a student into course (Admin or Student self-enrolment)
router.post('/:id/enrol', requireAuth, (req: AuthRequest, res: Response) => {
  const courseId = req.params.id;
  const { student_id, session, semester } = req.body;

  const targetStudentId = student_id || req.user!.user_id;

  // Security: Only admins can enrol other students; students can only enrol themselves
  if (req.user!.role !== 'admin' && req.user!.user_id !== targetStudentId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Students may only register themselves into courses',
    });
  }

  const course = db.getCourseById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  try {
    const enrolment = db.enrolStudent(
      targetStudentId,
      courseId,
      session || course.academic_session,
      semester || course.semester
    );

    const student = db.getUserById(targetStudentId);
    logAudit(
      req,
      'STUDENT_ENROLLED',
      `Enrolled student ${student?.matric_no || student?.username} into ${course.course_code}`
    );

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      enrolment,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/courses/:id/enrol/:enrolmentId - Remove enrolment (Admin or Student self-drop)
router.delete('/:id/enrol/:enrolmentId', requireAuth, (req: AuthRequest, res: Response) => {
  const { enrolmentId } = req.params;
  const enrolment = db.getEnrolments().find((e) => e.enrolment_id === enrolmentId);

  if (!enrolment) {
    return res.status(404).json({ success: false, message: 'Enrolment record not found' });
  }

  // Security: Admin can remove any enrolment; students can only remove their own
  if (req.user!.role !== 'admin' && req.user!.user_id !== enrolment.student_id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only drop your own course enrolments',
    });
  }

  const removed = db.removeEnrolment(enrolmentId);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Enrolment record not found' });
  }

  logAudit(req, 'ENROLMENT_REMOVED', `Removed enrolment ID ${enrolmentId}`);
  return res.json({ success: true, message: 'Student enrolment removed successfully' });
});

export default router;
