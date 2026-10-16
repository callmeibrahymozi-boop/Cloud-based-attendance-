export type UserRole = 'admin' | 'lecturer' | 'student';
export type UserStatus = 'active' | 'inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type SessionPeriod = 'Morning' | 'Afternoon' | 'Evening';
export type SemesterType = 'First' | 'Second';
export type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected';
export type ExamStatus = 'Eligible' | 'Warning' | 'Ineligible';

export interface User {
  user_id: string;
  username: string;
  role: UserRole;
  email: string;
  full_name: string;
  matric_no?: string;
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
  lecturer_id?: string;
  lecturer_name?: string;
  lecturer_email?: string;
  academic_session: string;
  semester: SemesterType;
  enrolled_count?: number;
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
  student_name?: string;
  student_matric?: string;
  course_id: string;
  course_code?: string;
  course_title?: string;
  attendance_date: string;
  status: AttendanceStatus;
  session_period: SessionPeriod;
  recorded_by: string;
  recorded_by_name?: string;
  recorded_at: string;
}

export interface RegisterStudentItem {
  student_id: string;
  matric_no?: string;
  full_name: string;
  department: string;
  status: AttendanceStatus | null;
}

export interface AttendanceCorrectionRequest {
  request_id: string;
  student_id: string;
  student_name?: string;
  student_matric?: string;
  attendance_id?: string;
  course_id: string;
  course_code?: string;
  course_title?: string;
  attendance_date: string;
  current_status: AttendanceStatus;
  requested_status: AttendanceStatus;
  reason: string;
  status: CorrectionStatus;
  reviewed_by?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  admin_note?: string;
  created_at: string;
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

export interface SystemSettings {
  institution_name: string;
  short_name: string;
  min_attendance_percentage: number;
  late_arrival_counts_as_present: boolean;
  allow_student_corrections: boolean;
  current_session: string;
  current_semester: SemesterType;
}

export interface CourseReportStudent {
  student_id: string;
  matric_no: string;
  full_name: string;
  department: string;
  total_recorded: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attended_count: number;
  percentage: number;
  exam_status: ExamStatus;
}

export interface CourseReportMeta {
  generated_at: string;
  institution: string;
  course_id: string;
  course_code: string;
  course_title: string;
  credit_unit: number;
  department: string;
  lecturer_name: string;
  session: string;
  semester: SemesterType;
  min_required_percentage: number;
  total_classes_held: number;
  total_enrolled: number;
  average_attendance: number;
  eligible_count: number;
  at_risk_count: number;
  applied_filters: { start_date: string; end_date: string };
}
