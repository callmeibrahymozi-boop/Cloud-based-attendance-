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

// POST /api/courses/:id/enrol - Enrol a student into course (Admin only)
router.post('/:id/enrol', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const courseId = req.params.id;
  const { student_id, session, semester } = req.body;

  if (!student_id) {
    return res.status(400).json({ success: false, message: 'Student ID is required' });
  }

  const course = db.getCourseById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  try {
    const enrolment = db.enrolStudent(
      student_id,
      courseId,
      session || course.academic_session,
      semester || course.semester
    );

    const student = db.getUserById(student_id);
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

// DELETE /api/courses/:id/enrol/:enrolmentId - Remove enrolment (Admin only)
router.delete('/:id/enrol/:enrolmentId', requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { enrolmentId } = req.params;
  const removed = db.removeEnrolment(enrolmentId);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Enrolment record not found' });
  }

  logAudit(req, 'ENROLMENT_REMOVED', `Removed enrolment ID ${enrolmentId}`);
  return res.json({ success: true, message: 'Student enrolment removed successfully' });
});

export default router;
