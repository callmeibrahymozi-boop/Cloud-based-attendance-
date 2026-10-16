export type UserRole = 'admin' | 'lecturer' | 'student';
export type UserStatus = 'active' | 'inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type SessionPeriod = 'Morning' | 'Afternoon' | 'Evening';
export type SemesterType = 'First' | 'Second';
export type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface User {
  user_id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  email: string;
  full_name: string;
  matric_no?: string; // Student matric number or staff ID
  department: string;
  phone?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  faculty: string;
}

export interface Course {
  course_id: string;
  course_code: string;
  course_title: string;
  credit_unit: number;
  department: string;
  lecturer_id?: string; // Assigned lecturer
  academic_session: string; // e.g. "2025/2026"
  semester: SemesterType;
  created_at: string;
}

export interface StudentCourse {
  enrolment_id: string;
  student_id: string;
  course_id: string;
  session: string;
  semester: SemesterType;
  enrolled_at: string;
}

export interface AttendanceRecord {
  attendance_id: string;
  student_id: string;
  course_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  session_period: SessionPeriod;
  recorded_by: string; // Lecturer user_id
  recorded_at: string;
}

export interface AttendanceCorrectionRequest {
  request_id: string;
  student_id: string;
  attendance_id?: string;
  course_id: string;
  attendance_date: string;
  current_status: AttendanceStatus;
  requested_status: AttendanceStatus;
  reason: string;
  status: CorrectionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_note?: string;
  created_at: string;
}

export interface PasswordResetToken {
  token_id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
}

export interface AuditLog {
  log_id: string;
  user_id?: string;
  username?: string;
  role?: string;
  action: string;
  details: string;
  ip_address?: string;
  timestamp: string;
}

export interface AcademicSession {
  id: string;
  session_name: string; // "2024/2025", "2025/2026"
  is_current: boolean;
}

export interface SystemSettings {
  institution_name: string;
  short_name: string;
  min_attendance_percentage: number; // e.g. 75% for exam eligibility
  late_arrival_counts_as_present: boolean;
  allow_student_corrections: boolean;
  current_session: string;
  current_semester: SemesterType;
}

export interface DatabaseSchema {
  users: User[];
  departments: Department[];
  courses: Course[];
  student_courses: StudentCourse[];
  attendance: AttendanceRecord[];
  correction_requests: AttendanceCorrectionRequest[];
  password_reset_tokens: PasswordResetToken[];
  audit_logs: AuditLog[];
  academic_sessions: AcademicSession[];
  settings: SystemSettings;
}
