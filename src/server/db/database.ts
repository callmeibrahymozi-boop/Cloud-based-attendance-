import fs from 'fs';
import path from 'path';
import {
  DatabaseSchema,
  User,
  Course,
  StudentCourse,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  PasswordResetToken,
  AuditLog,
  Department,
  AcademicSession,
  SystemSettings,
  AttendanceStatus,
  SessionPeriod,
  SemesterType,
} from './types';
import { initialSeedData } from './seed';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'edutrack-db.json');

class Database {
  private data: DatabaseSchema;
  private isLoaded = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.getDefaultSchema();
    this.init();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      departments: [],
      courses: [],
      student_courses: [],
      attendance: [],
      correction_requests: [],
      password_reset_tokens: [],
      audit_logs: [],
      academic_sessions: [],
      settings: {
        institution_name: 'Federal University of Technology, Akure',
        short_name: 'FUTA / EduTrack',
        min_attendance_percentage: 75,
        late_arrival_counts_as_present: true,
        allow_student_corrections: true,
        current_session: '2025/2026',
        current_semester: 'First',
      },
    };
  }

  public init() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // If users empty, seed
        if (!this.data.users || this.data.users.length === 0) {
          this.seed();
        }
      } else {
        this.seed();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing database, seeding fallback:', err);
      this.seed();
      this.isLoaded = true;
    }
  }

  public seed() {
    this.data = initialSeedData();
    this.persistSync();
  }

  public resetToSeed() {
    this.seed();
  }

  private persistSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public save() {
    this.persistSync();
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // --- Departments & Sessions ---
  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public getAcademicSessions(): AcademicSession[] {
    return this.data.academic_sessions;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.user_id === id);
  }

  public getUserByUsernameOrEmail(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        (u.matric_no && u.matric_no.toLowerCase() === clean)
    );
  }

  public createUser(user: Omit<User, 'created_at' | 'updated_at'>): User {
    const existing = this.getUserByUsernameOrEmail(user.username);
    if (existing) {
      throw new Error(`Username "${user.username}" is already taken`);
    }
    const existingEmail = this.data.users.find(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingEmail) {
      throw new Error(`Email "${user.email}" is already in use`);
    }

    if (user.matric_no) {
      const existingMatric = this.data.users.find(
        (u) => u.matric_no && u.matric_no.toLowerCase() === user.matric_no!.toLowerCase()
      );
      if (existingMatric) {
        throw new Error(`Matric / Staff ID "${user.matric_no}" is already registered`);
      }
    }

    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      created_at: now,
      updated_at: now,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const userIndex = this.data.users.findIndex((u) => u.user_id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    if (updates.username) {
      const conflict = this.data.users.find(
        (u) => u.user_id !== id && u.username.toLowerCase() === updates.username!.toLowerCase()
      );
      if (conflict) throw new Error(`Username "${updates.username}" is already taken`);
    }

    if (updates.email) {
      const conflict = this.data.users.find(
        (u) => u.user_id !== id && u.email.toLowerCase() === updates.email!.toLowerCase()
      );
      if (conflict) throw new Error(`Email "${updates.email}" is already in use`);
    }

    const updatedUser = {
      ...this.data.users[userIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.data.users[userIndex] = updatedUser;
    this.save();
    return updatedUser;
  }

  public deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;
    // Don't delete main admin
    if (user.username === 'admin') {
      throw new Error('Cannot delete primary system administrator');
    }
    this.data.users = this.data.users.filter((u) => u.user_id !== id);
    // Remove related enrolments
    this.data.student_courses = this.data.student_courses.filter((sc) => sc.student_id !== id);
    // Unassign lecturer from courses
    this.data.courses.forEach((c) => {
      if (c.lecturer_id === id) {
        c.lecturer_id = undefined;
      }
    });
    this.save();
    return true;
  }

  // --- Courses ---
  public getCourses(): Course[] {
    return this.data.courses;
  }

  public getCourseById(id: string): Course | undefined {
    return this.data.courses.find((c) => c.course_id === id);
  }

  public getCourseByCode(code: string): Course | undefined {
    return this.data.courses.find((c) => c.course_code.toUpperCase() === code.toUpperCase());
  }

  public createCourse(course: Omit<Course, 'created_at'>): Course {
    const existing = this.getCourseByCode(course.course_code);
    if (existing) {
      throw new Error(`Course code "${course.course_code}" already exists`);
    }
    const newCourse: Course = {
      ...course,
      created_at: new Date().toISOString(),
    };
    this.data.courses.push(newCourse);
    this.save();
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<Course>): Course {
    const index = this.data.courses.findIndex((c) => c.course_id === id);
    if (index === -1) throw new Error('Course not found');

    if (updates.course_code) {
      const conflict = this.data.courses.find(
        (c) => c.course_id !== id && c.course_code.toUpperCase() === updates.course_code!.toUpperCase()
      );
      if (conflict) throw new Error(`Course code "${updates.course_code}" already exists`);
    }

    const updated = { ...this.data.courses[index], ...updates };
    this.data.courses[index] = updated;
    this.save();
    return updated;
  }

  public deleteCourse(id: string): boolean {
    this.data.courses = this.data.courses.filter((c) => c.course_id !== id);
    this.data.student_courses = this.data.student_courses.filter((sc) => sc.course_id !== id);
    this.data.attendance = this.data.attendance.filter((a) => a.course_id !== id);
    this.save();
    return true;
  }

  // --- Enrolments ---
  public getEnrolments(): StudentCourse[] {
    return this.data.student_courses;
  }

  public getStudentsInCourse(courseId: string): (User & { enrolment_id: string; enrolled_at: string })[] {
    const enrolments = this.data.student_courses.filter((sc) => sc.course_id === courseId);
    const results: (User & { enrolment_id: string; enrolled_at: string })[] = [];
    for (const enr of enrolments) {
      const student = this.getUserById(enr.student_id);
      if (student && student.status === 'active') {
        results.push({
          ...student,
          enrolment_id: enr.enrolment_id,
          enrolled_at: enr.enrolled_at,
        });
      }
    }
    // Sort by matric_no or full_name
    return results.sort((a, b) => (a.matric_no || a.full_name).localeCompare(b.matric_no || b.full_name));
  }

  public getCoursesForStudent(studentId: string): (Course & { enrolment_id: string; lecturer_name?: string })[] {
    const enrolments = this.data.student_courses.filter((sc) => sc.student_id === studentId);
    const results: (Course & { enrolment_id: string; lecturer_name?: string })[] = [];
    for (const enr of enrolments) {
      const course = this.getCourseById(enr.course_id);
      if (course) {
        const lecturer = course.lecturer_id ? this.getUserById(course.lecturer_id) : undefined;
        results.push({
          ...course,
          enrolment_id: enr.enrolment_id,
          lecturer_name: lecturer ? lecturer.full_name : 'Unassigned',
        });
      }
    }
    return results;
  }

  public enrolStudent(studentId: string, courseId: string, session: string, semester: SemesterType): StudentCourse {
    const student = this.getUserById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Valid active student is required for enrolment');
    }
    const course = this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const existing = this.data.student_courses.find(
      (sc) =>
        sc.student_id === studentId &&
        sc.course_id === courseId &&
        sc.session === session &&
        sc.semester === semester
    );
    if (existing) {
      throw new Error('Student is already enrolled in this course for this session and semester');
    }

    const enrolment: StudentCourse = {
      enrolment_id: 'enr_' + Math.random().toString(36).substring(2, 10),
      student_id: studentId,
      course_id: courseId,
      session,
      semester,
      enrolled_at: new Date().toISOString(),
    };
    this.data.student_courses.push(enrolment);
    this.save();
    return enrolment;
  }

  public removeEnrolment(enrolmentId: string): boolean {
    const initialLen = this.data.student_courses.length;
    this.data.student_courses = this.data.student_courses.filter((sc) => sc.enrolment_id !== enrolmentId);
    const removed = this.data.student_courses.length < initialLen;
    if (removed) this.save();
    return removed;
  }

  // --- Attendance ---
  public getAttendanceRecords(filters?: {
    course_id?: string;
    student_id?: string;
    attendance_date?: string;
    session_period?: SessionPeriod;
    status?: AttendanceStatus;
    start_date?: string;
    end_date?: string;
  }): AttendanceRecord[] {
    let list = this.data.attendance;
    if (!filters) return list;

    if (filters.course_id) {
      list = list.filter((a) => a.course_id === filters.course_id);
    }
    if (filters.student_id) {
      list = list.filter((a) => a.student_id === filters.student_id);
    }
    if (filters.attendance_date) {
      list = list.filter((a) => a.attendance_date === filters.attendance_date);
    }
    if (filters.session_period) {
      list = list.filter((a) => a.session_period === filters.session_period);
    }
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.start_date) {
      list = list.filter((a) => a.attendance_date >= filters.start_date!);
    }
    if (filters.end_date) {
      list = list.filter((a) => a.attendance_date <= filters.end_date!);
    }
    return list;
  }

  /**
   * Submit Attendance Transaction:
   * Validates all students are enrolled in the course.
   * If records already exist for (student, course, date, session_period), updates them (or replaces register).
   * Ensures atomic save.
   */
  public submitAttendanceTransaction(params: {
    course_id: string;
    attendance_date: string;
    session_period: SessionPeriod;
    recorded_by: string;
    records: { student_id: string; status: AttendanceStatus }[];
    is_update?: boolean;
  }): { count: number; updated: boolean } {
    const { course_id, attendance_date, session_period, recorded_by, records, is_update } = params;

    const course = this.getCourseById(course_id);
    if (!course) throw new Error('Course not found');

    const enrolledStudents = this.getStudentsInCourse(course_id);
    const enrolledIds = new Set(enrolledStudents.map((s) => s.user_id));

    // Check duplicate check if not in update mode
    const existingForSession = this.data.attendance.filter(
      (a) =>
        a.course_id === course_id &&
        a.attendance_date === attendance_date &&
        a.session_period === session_period
    );

    if (existingForSession.length > 0 && !is_update) {
      throw new Error(
        `Attendance has already been recorded for this course on ${attendance_date} (${session_period}). Please use authorized update mode to edit.`
      );
    }

    // Validate every student is enrolled
    for (const r of records) {
      if (!enrolledIds.has(r.student_id)) {
        throw new Error(`Student ${r.student_id} is not enrolled in this course`);
      }
    }

    const now = new Date().toISOString();

    // In update mode, remove existing records for this session slot
    if (existingForSession.length > 0) {
      this.data.attendance = this.data.attendance.filter(
        (a) =>
          !(
            a.course_id === course_id &&
            a.attendance_date === attendance_date &&
            a.session_period === session_period
          )
      );
    }

    // Insert new records
    for (const r of records) {
      const newRec: AttendanceRecord = {
        attendance_id: 'att_' + Math.random().toString(36).substring(2, 11),
        student_id: r.student_id,
        course_id,
        attendance_date,
        status: r.status,
        session_period,
        recorded_by,
        recorded_at: now,
      };
      this.data.attendance.push(newRec);
    }

    this.save();
    return {
      count: records.length,
      updated: existingForSession.length > 0,
    };
  }

  // --- Correction Requests ---
  public getCorrectionRequests(studentId?: string): AttendanceCorrectionRequest[] {
    if (studentId) {
      return this.data.correction_requests.filter((r) => r.student_id === studentId);
    }
    return this.data.correction_requests;
  }

  public createCorrectionRequest(req: Omit<AttendanceCorrectionRequest, 'request_id' | 'status' | 'created_at'>): AttendanceCorrectionRequest {
    const newReq: AttendanceCorrectionRequest = {
      ...req,
      request_id: 'req_' + Math.random().toString(36).substring(2, 10),
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    this.data.correction_requests.push(newReq);
    this.save();
    return newReq;
  }

  public reviewCorrectionRequest(
    requestId: string,
    decision: 'Approved' | 'Rejected',
    reviewedBy: string,
    adminNote?: string
  ): AttendanceCorrectionRequest {
    const item = this.data.correction_requests.find((r) => r.request_id === requestId);
    if (!item) throw new Error('Correction request not found');
    if (item.status !== 'Pending') throw new Error('Request has already been reviewed');

    item.status = decision;
    item.reviewed_by = reviewedBy;
    item.reviewed_at = new Date().toISOString();
    item.admin_note = adminNote;

    // If approved, update the attendance record!
    if (decision === 'Approved' && item.attendance_id) {
      const att = this.data.attendance.find((a) => a.attendance_id === item.attendance_id);
      if (att) {
        att.status = item.requested_status;
        att.recorded_at = new Date().toISOString();
      }
    }

    this.save();
    return item;
  }

  // --- Password Reset Tokens ---
  public createPasswordResetToken(userId: string): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    this.data.password_reset_tokens.push({
      token_id: 'tok_' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      token,
      expires_at: expires,
      used: false,
    });
    this.save();
    return token;
  }

  public verifyPasswordResetToken(token: string): PasswordResetToken | null {
    const t = this.data.password_reset_tokens.find(
      (tok) => tok.token === token && !tok.used && new Date(tok.expires_at) > new Date()
    );
    return t || null;
  }

  public consumePasswordResetToken(token: string): boolean {
    const t = this.data.password_reset_tokens.find((tok) => tok.token === token);
    if (!t) return false;
    t.used = true;
    this.save();
    return true;
  }

  // --- Audit Logs ---
  public addAuditLog(log: Omit<AuditLog, 'log_id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      log_id: 'log_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(newLog);
    // keep latest 1000 logs
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 1000);
    }
    this.save();
    return newLog;
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }
}

export const db = new Database();
