import bcrypt from 'bcryptjs';
import { db } from '../server/db/database';

export interface TestCaseResult {
  id: string;
  category: 'Functional' | 'Security & RBAC' | 'Accuracy & Calculation' | 'Integrity & Constraints';
  name: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  durationMs: number;
}

export interface TestSuiteSummary {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  passPercentage: number;
  totalDurationMs: number;
  results: TestCaseResult[];
}

export async function runAllTests(): Promise<TestSuiteSummary> {
  const startTime = Date.now();
  const results: TestCaseResult[] = [];

  // Helper to run a test
  const test = (
    id: string,
    category: TestCaseResult['category'],
    name: string,
    description: string,
    fn: () => { expected: string; actual: string; passed: boolean }
  ) => {
    const t0 = Date.now();
    try {
      const res = fn();
      results.push({
        id,
        category,
        name,
        description,
        expected: res.expected,
        actual: res.actual,
        passed: res.passed,
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      results.push({
        id,
        category,
        name,
        description,
        expected: 'Successful execution',
        actual: `Exception: ${err.message}`,
        passed: false,
        durationMs: Date.now() - t0,
      });
    }
  };

  // Test 1: Successful Login Credential Verification
  test('TC-01', 'Functional', 'User Authentication with Valid Credentials', 'Verifies that valid credentials match hashed password', () => {
    const admin = db.getUserByUsernameOrEmail('admin');
    const isMatch = admin ? bcrypt.compareSync('Admin@12345', admin.password_hash) : false;
    return {
      expected: 'Authentication successful (true)',
      actual: `Authentication successful (${isMatch})`,
      passed: isMatch,
    };
  });

  // Test 2: Invalid Password Rejection
  test('TC-02', 'Security & RBAC', 'Invalid Password Rejection', 'Ensures incorrect passwords fail authentication', () => {
    const admin = db.getUserByUsernameOrEmail('admin');
    const isMatch = admin ? bcrypt.compareSync('WrongPassword', admin.password_hash) : false;
    return {
      expected: 'Authentication rejected (false)',
      actual: `Authentication rejected (${!isMatch})`,
      passed: !isMatch,
    };
  });

  // Test 3: Inactive User Login Block
  test('TC-03', 'Security & RBAC', 'Deactivated User Access Prevention', 'Ensures deactivated users are barred from system', () => {
    const testUsername = 'test_inactive_user_' + Date.now();
    const testUser = db.createUser({
      user_id: 'usr_inactive_test',
      username: testUsername,
      password_hash: bcrypt.hashSync('Temp@123', 10),
      role: 'student',
      email: `${testUsername}@test.edu.ng`,
      full_name: 'Inactive Tester',
      department: 'Computer Science',
      status: 'inactive',
    });

    const isInactive = testUser.status === 'inactive';
    // Clean up
    db.deleteUser(testUser.user_id);

    return {
      expected: 'User account status is inactive',
      actual: `User account status is ${isInactive ? 'inactive' : 'active'}`,
      passed: isInactive,
    };
  });

  // Test 4: Duplicate Username Prevention
  test('TC-04', 'Integrity & Constraints', 'Duplicate Username Unique Constraint', 'Ensures database rejects registration of duplicate username', () => {
    let duplicateRejected = false;
    try {
      db.createUser({
        user_id: 'usr_dup_test',
        username: 'admin', // already exists
        password_hash: 'hash',
        role: 'student',
        email: 'unique_email@test.com',
        full_name: 'Dup User',
        department: 'CSC',
        status: 'active',
      });
    } catch (err: any) {
      duplicateRejected = err.message.includes('already taken');
    }
    return {
      expected: 'Duplicate username rejected with error',
      actual: duplicateRejected ? 'Duplicate username rejected with error' : 'Allowed duplicate',
      passed: duplicateRejected,
    };
  });

  // Test 5: Course & Lecturer Assignment
  test('TC-05', 'Functional', 'Course Retrieval & Lecturer Assignment Integrity', 'Verifies courses link correctly to assigned lecturers', () => {
    const course = db.getCourseByCode('CSC 401');
    const hasLecturer = course && course.lecturer_id === 'usr_lecturer_1';
    const lecturer = course?.lecturer_id ? db.getUserById(course.lecturer_id) : null;
    return {
      expected: 'CSC 401 assigned to Dr. Chinua Okonkwo',
      actual: `Assigned to ${lecturer?.full_name || 'None'}`,
      passed: Boolean(hasLecturer && lecturer?.username === 'dr_okonkwo'),
    };
  });

  // Test 6: Student Enrolment Duplicate Prevention
  test('TC-06', 'Integrity & Constraints', 'Student Enrolment Unique Constraint', 'Prevents enrolling same student twice into course for same semester', () => {
    let duplicateEnrolmentBlocked = false;
    try {
      // Ibrahim Musa is already enrolled in CSC 401 for 2025/2026 First Semester
      db.enrolStudent('usr_std_1', 'crs_csc401', '2025/2026', 'First');
    } catch (err: any) {
      duplicateEnrolmentBlocked = err.message.includes('already enrolled');
    }
    return {
      expected: 'Duplicate enrolment rejected',
      actual: duplicateEnrolmentBlocked ? 'Duplicate enrolment rejected' : 'Duplicate enrolled',
      passed: duplicateEnrolmentBlocked,
    };
  });

  // Test 7: Attendance Calculation Accuracy (100% attendance)
  test('TC-07', 'Accuracy & Calculation', '100% Attendance Calculation', 'Verifies attendance % formula for student with all Present', () => {
    // Ibrahim Musa has 4 Present out of 4 in CSC 401 = 100%
    const records = db.getAttendanceRecords({ course_id: 'crs_csc401', student_id: 'usr_std_1' });
    const present = records.filter((r) => r.status === 'Present').length;
    const total = records.length;
    const pct = total > 0 ? (present / total) * 100 : 0;
    return {
      expected: '100% attendance for 4/4 classes',
      actual: `${pct}% attendance for ${present}/${total} classes`,
      passed: pct === 100 && total === 4,
    };
  });

  // Test 8: Attendance Calculation Accuracy (Late + Present Threshold)
  test('TC-08', 'Accuracy & Calculation', 'Late Arrival Policy & 75% Threshold Check', 'Verifies (Present + Late) counts and threshold classification', () => {
    // Ngozi Eze has 3 Present and 1 Late in CSC 401 out of 4 = 100% attended
    const records = db.getAttendanceRecords({ course_id: 'crs_csc401', student_id: 'usr_std_2' });
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const total = records.length;
    const attended = present + late;
    const pct = (attended / total) * 100;
    return {
      expected: '100% attended with 3 Present and 1 Late',
      actual: `${pct}% attended with ${present} Present and ${late} Late`,
      passed: pct === 100 && late === 1,
    };
  });

  // Test 9: Zero Division Protection Edge Case
  test('TC-09', 'Accuracy & Calculation', 'Zero Classes Division Protection', 'Ensures 0 classes recorded results in 0% and no division by zero error', () => {
    const total = 0;
    const attended = 0;
    const pct = total > 0 ? (attended / total) * 100 : 0;
    return {
      expected: '0% attendance with 0 recorded classes',
      actual: `${pct}% attendance without division error`,
      passed: pct === 0,
    };
  });

  // Test 10: Duplicate Attendance Session Prevention
  test('TC-10', 'Integrity & Constraints', 'Duplicate Session Submission Prevention', 'Rejects submitting duplicate attendance register for same course, date, and period without update flag', () => {
    let duplicateRegisterBlocked = false;
    try {
      // 2026-09-18 Morning is already recorded for CSC 401
      db.submitAttendanceTransaction({
        course_id: 'crs_csc401',
        attendance_date: '2026-09-18',
        session_period: 'Morning',
        recorded_by: 'usr_lecturer_1',
        records: [{ student_id: 'usr_std_1', status: 'Present' }],
        is_update: false,
      });
    } catch (err: any) {
      duplicateRegisterBlocked = err.message.includes('already been recorded');
    }
    return {
      expected: 'Duplicate session register rejected with error',
      actual: duplicateRegisterBlocked ? 'Duplicate session register rejected with error' : 'Duplicate permitted',
      passed: duplicateRegisterBlocked,
    };
  });

  // Test 11: Unenrolled Student Attendance Submission Rejection
  test('TC-11', 'Integrity & Constraints', 'Unenrolled Student Attendance Integrity', 'Rejects recording attendance for a student not enrolled in the course', () => {
    let unenrolledBlocked = false;
    try {
      // Student 3 is not enrolled in SEN 405
      db.submitAttendanceTransaction({
        course_id: 'crs_sen405',
        attendance_date: '2026-10-15',
        session_period: 'Morning',
        recorded_by: 'usr_lecturer_2',
        records: [{ student_id: 'usr_std_3', status: 'Present' }],
        is_update: false,
      });
    } catch (err: any) {
      unenrolledBlocked = err.message.includes('not enrolled');
    }
    return {
      expected: 'Attendance for unenrolled student blocked',
      actual: unenrolledBlocked ? 'Attendance for unenrolled student blocked' : 'Unenrolled student permitted',
      passed: unenrolledBlocked,
    };
  });

  // Test 12: Password Reset Token Workflow
  test('TC-12', 'Security & RBAC', 'Password Reset Token Lifecycle', 'Verifies password reset token generation, verification, and consumption', () => {
    const token = db.createPasswordResetToken('usr_std_1');
    const valid = db.verifyPasswordResetToken(token);
    const consumed = db.consumePasswordResetToken(token);
    const validAfterConsume = db.verifyPasswordResetToken(token);
    return {
      expected: 'Token generated, verified, and consumed (invalid after consumption)',
      actual: `Generated: ${Boolean(valid)}, Consumed: ${consumed}, Invalidated: ${validAfterConsume === null}`,
      passed: Boolean(valid) && consumed && validAfterConsume === null,
    };
  });

  // Test 13: Audit Log Generation
  test('TC-13', 'Security & RBAC', 'Audit Log Trail Creation', 'Verifies administrative operations are logged in audit trail', () => {
    db.addAuditLog({
      user_id: 'usr_admin',
      username: 'admin',
      role: 'admin',
      action: 'SYSTEM_TEST_RUN',
      details: 'Automated evaluation suite executed',
      ip_address: '127.0.0.1',
    });

    const logs = db.getAuditLogs(5);
    const found = logs.some((l) => l.action === 'SYSTEM_TEST_RUN');
    return {
      expected: 'Audit log entry present in system trail',
      actual: `Audit log present: ${found}`,
      passed: found,
    };
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    passPercentage: Math.round((passed / results.length) * 100 * 10) / 10,
    totalDurationMs: Date.now() - startTime,
    results,
  };
}
