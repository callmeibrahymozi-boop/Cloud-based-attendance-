import bcrypt from 'bcryptjs';
import { DatabaseSchema, User, Course, StudentCourse, AttendanceRecord, Department, AcademicSession } from './types';

export function initialSeedData(): DatabaseSchema {
  // Hash passwords:
  // Admin: 'Admin@12345'
  // Lecturer: 'Lecturer@12345'
  // Student: 'Student@12345'
  const adminHash = bcrypt.hashSync('Admin@12345', 10);
  const lecturerHash = bcrypt.hashSync('Lecturer@12345', 10);
  const studentHash = bcrypt.hashSync('Student@12345', 10);

  const now = new Date().toISOString();

  const departments: Department[] = [
    { id: 'dept_csc', name: 'Computer Science', code: 'CSC', faculty: 'School of Computing' },
    { id: 'dept_swe', name: 'Software Engineering', code: 'SEN', faculty: 'School of Computing' },
    { id: 'dept_cys', name: 'Cyber Security', code: 'CYS', faculty: 'School of Computing' },
    { id: 'dept_ift', name: 'Information Technology', code: 'IFT', faculty: 'School of Computing' },
  ];

  const academic_sessions: AcademicSession[] = [
    { id: 'sess_1', session_name: '2024/2025', is_current: false },
    { id: 'sess_2', session_name: '2025/2026', is_current: true },
  ];

  const users: User[] = [
    // 1 Administrator
    {
      user_id: 'usr_admin',
      username: 'admin',
      password_hash: adminHash,
      role: 'admin',
      email: 'admin@edutrack.edu.ng',
      full_name: 'Engr. Dr. Babatunde Balogun',
      matric_no: 'STF/ADM/001',
      department: 'Computer Science',
      phone: '+234 803 123 4567',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    // 2 Lecturers
    {
      user_id: 'usr_lecturer_1',
      username: 'dr_okonkwo',
      password_hash: lecturerHash,
      role: 'lecturer',
      email: 'c.okonkwo@edutrack.edu.ng',
      full_name: 'Dr. Chinua Okonkwo',
      matric_no: 'STF/CSC/042',
      department: 'Computer Science',
      phone: '+234 802 345 6789',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_lecturer_2',
      username: 'prof_adeyemi',
      password_hash: lecturerHash,
      role: 'lecturer',
      email: 'f.adeyemi@edutrack.edu.ng',
      full_name: 'Prof. Folake Adeyemi',
      matric_no: 'STF/SEN/018',
      department: 'Software Engineering',
      phone: '+234 805 678 1234',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    // 10 Students
    {
      user_id: 'usr_std_1',
      username: 'ibrahim_musa',
      password_hash: studentHash,
      role: 'student',
      email: 'i.musa@student.edutrack.edu.ng',
      full_name: 'Ibrahim Musa',
      matric_no: 'SCI/2022/1001',
      department: 'Computer Science',
      phone: '+234 810 111 2233',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_2',
      username: 'ngozi_eze',
      password_hash: studentHash,
      role: 'student',
      email: 'n.eze@student.edutrack.edu.ng',
      full_name: 'Ngozi Eze',
      matric_no: 'SCI/2022/1002',
      department: 'Computer Science',
      phone: '+234 810 222 3344',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_3',
      username: 'babatunde_adeleke',
      password_hash: studentHash,
      role: 'student',
      email: 'b.adeleke@student.edutrack.edu.ng',
      full_name: 'Babatunde Adeleke',
      matric_no: 'SCI/2022/1003',
      department: 'Computer Science',
      phone: '+234 810 333 4455',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_4',
      username: 'fatima_abubakar',
      password_hash: studentHash,
      role: 'student',
      email: 'f.abubakar@student.edutrack.edu.ng',
      full_name: 'Fatima Abubakar',
      matric_no: 'SCI/2022/1004',
      department: 'Software Engineering',
      phone: '+234 810 444 5566',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_5',
      username: 'chinedu_okafor',
      password_hash: studentHash,
      role: 'student',
      email: 'c.okafor@student.edutrack.edu.ng',
      full_name: 'Chinedu Okafor',
      matric_no: 'SCI/2022/1005',
      department: 'Software Engineering',
      phone: '+234 810 555 6677',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_6',
      username: 'zainab_bello',
      password_hash: studentHash,
      role: 'student',
      email: 'z.bello@student.edutrack.edu.ng',
      full_name: 'Zainab Bello',
      matric_no: 'SCI/2022/1006',
      department: 'Computer Science',
      phone: '+234 810 666 7788',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_7',
      username: 'emmanuel_danjuma',
      password_hash: studentHash,
      role: 'student',
      email: 'e.danjuma@student.edutrack.edu.ng',
      full_name: 'Emmanuel Danjuma',
      matric_no: 'SCI/2022/1007',
      department: 'Computer Science',
      phone: '+234 810 777 8899',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_8',
      username: 'aisha_umar',
      password_hash: studentHash,
      role: 'student',
      email: 'a.umar@student.edutrack.edu.ng',
      full_name: 'Aisha Umar',
      matric_no: 'SCI/2022/1008',
      department: 'Software Engineering',
      phone: '+234 810 888 9900',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_9',
      username: 'david_oshodi',
      password_hash: studentHash,
      role: 'student',
      email: 'd.oshodi@student.edutrack.edu.ng',
      full_name: 'David Oshodi',
      matric_no: 'SCI/2022/1009',
      department: 'Computer Science',
      phone: '+234 810 999 0011',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 'usr_std_10',
      username: 'grace_akpan',
      password_hash: studentHash,
      role: 'student',
      email: 'g.akpan@student.edutrack.edu.ng',
      full_name: 'Grace Akpan',
      matric_no: 'SCI/2022/1010',
      department: 'Software Engineering',
      phone: '+234 810 000 1122',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
  ];

  // 3 Courses
  const courses: Course[] = [
    {
      course_id: 'crs_csc401',
      course_code: 'CSC 401',
      course_title: 'Advanced Database Systems',
      credit_unit: 3,
      department: 'Computer Science',
      lecturer_id: 'usr_lecturer_1', // Dr. Okonkwo
      academic_session: '2025/2026',
      semester: 'First',
      created_at: now,
    },
    {
      course_id: 'crs_sen405',
      course_code: 'SEN 405',
      course_title: 'Cloud Computing & Distributed Systems',
      credit_unit: 3,
      department: 'Software Engineering',
      lecturer_id: 'usr_lecturer_2', // Prof. Adeyemi
      academic_session: '2025/2026',
      semester: 'First',
      created_at: now,
    },
    {
      course_id: 'crs_csc303',
      course_code: 'CSC 303',
      course_title: 'Systems Analysis & Design',
      credit_unit: 2,
      department: 'Computer Science',
      lecturer_id: 'usr_lecturer_1', // Dr. Okonkwo
      academic_session: '2025/2026',
      semester: 'First',
      created_at: now,
    },
  ];

  // Student Enrolments
  const student_courses: StudentCourse[] = [];
  // Enroll all 10 students into CSC 401
  for (let i = 1; i <= 10; i++) {
    student_courses.push({
      enrolment_id: `enr_csc401_${i}`,
      student_id: `usr_std_${i}`,
      course_id: 'crs_csc401',
      session: '2025/2026',
      semester: 'First',
      enrolled_at: now,
    });
  }
  // Enroll 7 students into SEN 405 (std 1, 2, 4, 5, 6, 8, 10)
  const senStudents = [1, 2, 4, 5, 6, 8, 10];
  for (const idx of senStudents) {
    student_courses.push({
      enrolment_id: `enr_sen405_${idx}`,
      student_id: `usr_std_${idx}`,
      course_id: 'crs_sen405',
      session: '2025/2026',
      semester: 'First',
      enrolled_at: now,
    });
  }
  // Enroll 6 students into CSC 303 (std 1, 2, 3, 7, 9, 10)
  const csc303Students = [1, 2, 3, 7, 9, 10];
  for (const idx of csc303Students) {
    student_courses.push({
      enrolment_id: `enr_csc303_${idx}`,
      student_id: `usr_std_${idx}`,
      course_id: 'crs_csc303',
      session: '2025/2026',
      semester: 'First',
      enrolled_at: now,
    });
  }

  // Realistic sample attendance records
  // CSC 401 had 4 class sessions across recent weeks
  const attendance: AttendanceRecord[] = [];
  const csc401Dates = [
    { date: '2026-09-18', period: 'Morning' as const },
    { date: '2026-09-25', period: 'Morning' as const },
    { date: '2026-10-02', period: 'Morning' as const },
    { date: '2026-10-09', period: 'Morning' as const },
  ];

  // Specific attendance patterns for CSC 401:
  // std 1: Present, Present, Present, Present (100%)
  // std 2: Present, Late, Present, Present (100% attended, 1 late)
  // std 3: Present, Absent, Present, Present (75% - threshold)
  // std 4: Present, Present, Present, Late (100%)
  // std 5: Absent, Present, Present, Late (75%)
  // std 6: Present, Present, Late, Present (100%)
  // std 7: Present, Absent, Present, Absent (50% - at risk)
  // std 8: Present, Present, Present, Present (100%)
  // std 9: Absent, Absent, Present, Absent (25% - in danger of ineligibility)
  // std 10: Late, Present, Absent, Present (75%)

  const csc401Patterns: Record<number, ('Present' | 'Absent' | 'Late')[]> = {
    1: ['Present', 'Present', 'Present', 'Present'],
    2: ['Present', 'Late', 'Present', 'Present'],
    3: ['Present', 'Absent', 'Present', 'Present'],
    4: ['Present', 'Present', 'Present', 'Late'],
    5: ['Absent', 'Present', 'Present', 'Late'],
    6: ['Present', 'Present', 'Late', 'Present'],
    7: ['Present', 'Absent', 'Present', 'Absent'],
    8: ['Present', 'Present', 'Present', 'Present'],
    9: ['Absent', 'Absent', 'Present', 'Absent'],
    10: ['Late', 'Present', 'Absent', 'Present'],
  };

  csc401Dates.forEach((d, dateIdx) => {
    for (let i = 1; i <= 10; i++) {
      const status = csc401Patterns[i][dateIdx];
      attendance.push({
        attendance_id: `att_csc401_${dateIdx}_${i}`,
        student_id: `usr_std_${i}`,
        course_id: 'crs_csc401',
        attendance_date: d.date,
        status,
        session_period: d.period,
        recorded_by: 'usr_lecturer_1',
        recorded_at: `${d.date}T10:30:00.000Z`,
      });
    }
  });

  // SEN 405 had 3 sessions:
  const senDates = [
    { date: '2026-09-22', period: 'Afternoon' as const },
    { date: '2026-09-29', period: 'Afternoon' as const },
    { date: '2026-10-06', period: 'Afternoon' as const },
  ];

  senDates.forEach((d, dateIdx) => {
    senStudents.forEach((studentNum) => {
      // std 10 missed session 1 and 2 in SEN
      let status: 'Present' | 'Absent' | 'Late' = 'Present';
      if (studentNum === 10 && dateIdx < 2) status = 'Absent';
      else if (studentNum === 5 && dateIdx === 1) status = 'Late';
      else if (studentNum === 6 && dateIdx === 2) status = 'Late';

      attendance.push({
        attendance_id: `att_sen405_${dateIdx}_${studentNum}`,
        student_id: `usr_std_${studentNum}`,
        course_id: 'crs_sen405',
        attendance_date: d.date,
        status,
        session_period: d.period,
        recorded_by: 'usr_lecturer_2',
        recorded_at: `${d.date}T15:15:00.000Z`,
      });
    });
  });

  const audit_logs = [
    {
      log_id: 'log_seed_1',
      user_id: 'usr_admin',
      username: 'admin',
      role: 'admin',
      action: 'SYSTEM_INITIALIZED',
      details: 'EduTrack Cloud attendance database initialized with institutional demo records',
      ip_address: '127.0.0.1',
      timestamp: now,
    },
    {
      log_id: 'log_seed_2',
      user_id: 'usr_lecturer_1',
      username: 'dr_okonkwo',
      role: 'lecturer',
      action: 'ATTENDANCE_RECORDED',
      details: 'Recorded attendance for CSC 401 on 2026-10-09 (Morning) for 10 students',
      ip_address: '192.168.1.45',
      timestamp: '2026-10-09T10:45:00.000Z',
    },
    {
      log_id: 'log_seed_3',
      user_id: 'usr_lecturer_2',
      username: 'prof_adeyemi',
      role: 'lecturer',
      action: 'ATTENDANCE_RECORDED',
      details: 'Recorded attendance for SEN 405 on 2026-10-06 (Afternoon) for 7 students',
      ip_address: '192.168.1.88',
      timestamp: '2026-10-06T15:20:00.000Z',
    },
  ];

  return {
    users,
    departments,
    courses,
    student_courses,
    attendance,
    correction_requests: [
      {
        request_id: 'req_seed_1',
        student_id: 'usr_std_7',
        attendance_id: 'att_csc401_1_7',
        course_id: 'crs_csc401',
        attendance_date: '2026-09-25',
        current_status: 'Absent',
        requested_status: 'Present',
        reason: 'I submitted the in-class assignment slip but was marked absent during initial roll call.',
        status: 'Pending',
        created_at: '2026-09-26T08:30:00.000Z',
      },
    ],
    password_reset_tokens: [],
    audit_logs,
    academic_sessions,
    settings: {
      institution_name: 'Federal University of Technology, Akure',
      short_name: 'EduTrack Higher Ed',
      min_attendance_percentage: 75,
      late_arrival_counts_as_present: true,
      allow_student_corrections: true,
      current_session: '2025/2026',
      current_semester: 'First',
    },
  };
}
