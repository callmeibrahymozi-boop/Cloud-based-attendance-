import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Course, RegisterStudentItem, AttendanceStatus, SessionPeriod, SemesterType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
} from 'lucide-react';

export const RecordAttendancePage: React.FC<{ setActiveTab?: (tab: string) => void }> = ({
  setActiveTab,
}) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionPeriod, setSessionPeriod] = useState<SessionPeriod>('Morning');

  // Register state
  const [registerStudents, setRegisterStudents] = useState<RegisterStudentItem[]>([]);
  const [isRecorded, setIsRecorded] = useState(false);
  const [recordedByName, setRecordedByName] = useState<string | undefined>();
  const [recordedAt, setRecordedAt] = useState<string | undefined>();
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const isLecturer = user?.role === 'lecturer';
        const res = await api.get<{ success: boolean; courses: Course[] }>(
          `/courses?${isLecturer ? 'assignedOnly=true' : ''}`
        );
        if (res.success && res.courses.length > 0) {
          setCourses(res.courses);
          setSelectedCourseId(res.courses[0].course_id);
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [user]);

  // Fetch register whenever course, date, or period changes
  const fetchRegister = async () => {
    if (!selectedCourseId || !attendanceDate || !sessionPeriod) return;
    setLoadingRegister(true);
    setErrorMsg(null);
    setSubmissionSuccess(null);
    setIsUpdateMode(false);
    try {
      const res = await api.get<{
        success: boolean;
        course: Course;
        is_recorded: boolean;
        recorded_by?: string;
        recorded_at?: string;
        students: RegisterStudentItem[];
      }>(
        `/attendance/register?course_id=${selectedCourseId}&attendance_date=${attendanceDate}&session_period=${sessionPeriod}`
      );
      if (res.success) {
        setRegisterStudents(res.students);
        setIsRecorded(res.is_recorded);
        setRecordedByName(res.recorded_by);
        setRecordedAt(res.recorded_at);
        if (res.is_recorded) {
          setIsUpdateMode(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setRegisterStudents([]);
    } finally {
      setLoadingRegister(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, [selectedCourseId, attendanceDate, sessionPeriod]);

  // Set student status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setRegisterStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  // Bulk actions
  const handleBulkMark = (status: AttendanceStatus) => {
    setRegisterStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleClearAll = () => {
    setRegisterStudents((prev) => prev.map((s) => ({ ...s, status: null })));
  };

  // Metrics
  const totalStudents = registerStudents.length;
  const presentCount = registerStudents.filter((s) => s.status === 'Present').length;
  const lateCount = registerStudents.filter((s) => s.status === 'Late').length;
  const absentCount = registerStudents.filter((s) => s.status === 'Absent').length;
  const unmarkedCount = registerStudents.filter((s) => s.status === null).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSubmissionSuccess(null);
    try {
      const records = registerStudents.map((s) => ({
        student_id: s.student_id,
        status: s.status as AttendanceStatus,
      }));

      const res = await api.post<{
        success: boolean;
        message: string;
        records_count: number;
        is_update: boolean;
      }>('/attendance/submit', {
        course_id: selectedCourseId,
        attendance_date: attendanceDate,
        session_period: sessionPeriod,
        records,
        is_update: isUpdateMode,
      });

      setShowConfirmModal(false);
      setSubmissionSuccess(res.message);
      fetchRegister();
    } catch (err: any) {
      setErrorMsg(err.message);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourse = courses.find((c) => c.course_id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Roll Call & Register</h1>
          <p className="text-xs text-slate-500">
            Open, mark, verify, and submit official cloud attendance registers.
          </p>
        </div>
        {selectedCourse && (
          <div className="text-right">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {selectedCourse.course_code}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">{selectedCourse.course_title}</p>
          </div>
        )}
      </div>

      {/* Notifications */}
      {submissionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{submissionSuccess}</span>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('course-reports')}
              className="font-bold underline text-emerald-800 hover:text-emerald-950"
            >
              View Reports →
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Session Selection Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Step 1: Configure Lecture Session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={loadingCourses}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 font-medium"
            >
              {loadingCourses ? (
                <option>Loading courses...</option>
              ) : courses.length === 0 ? (
                <option>No assigned courses available</option>
              ) : (
                courses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_code} - {c.course_title} ({c.academic_session})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Class Lecture Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Session Period
            </label>
            <select
              value={sessionPeriod}
              onChange={(e) => setSessionPeriod(e.target.value as SessionPeriod)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="Morning">Morning Lecture (8:00 AM - 12:00 PM)</option>
              <option value="Afternoon">Afternoon Lecture (12:00 PM - 4:00 PM)</option>
              <option value="Evening">Evening Lecture (4:00 PM - 7:00 PM)</option>
            </select>
          </div>
        </div>

        {/* Existing Record Notice */}
        {isRecorded && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                An official register already exists for this date and period.
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Originally recorded by {recordedByName || 'Authorized Lecturer'} on{' '}
                {recordedAt ? new Date(recordedAt).toLocaleString() : 'N/A'}. Changes made will update
                the existing records.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Register Marking Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls and Counters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Attendance Register ({registerStudents.length} Enrolled Students)
            </h3>
            <p className="text-xs text-slate-500">
              Mark each student roll call status accurately. All students must be marked before submission.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkMark('Present')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleBulkMark('Absent')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300"
            >
              Mark All Absent
            </button>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 border border-slate-300"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-100 text-center py-2.5 px-4 bg-white text-xs divide-x divide-slate-100">
          <div>
            <span className="text-slate-400 text-[11px]">Enrolled</span>
            <div className="font-bold text-slate-800 text-sm">{totalStudents}</div>
          </div>
          <div>
            <span className="text-emerald-600 text-[11px] font-semibold">Present</span>
            <div className="font-bold text-emerald-700 text-sm">{presentCount}</div>
          </div>
          <div>
            <span className="text-amber-600 text-[11px] font-semibold">Late</span>
            <div className="font-bold text-amber-700 text-sm">{lateCount}</div>
          </div>
          <div>
            <span className="text-rose-600 text-[11px] font-semibold">Absent</span>
            <div className="font-bold text-rose-700 text-sm">{absentCount}</div>
          </div>
          <div className={`${unmarkedCount > 0 ? 'bg-amber-50/80 rounded' : ''}`}>
            <span className={`text-[11px] font-semibold ${unmarkedCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              Unmarked
            </span>
            <div className={`font-bold text-sm ${unmarkedCount > 0 ? 'text-amber-700 font-extrabold' : 'text-slate-500'}`}>
              {unmarkedCount}
            </div>
          </div>
        </div>

        {/* Register Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Matric No</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Mark Roll Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingRegister ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading student register...
                  </td>
                </tr>
              ) : registerStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No enrolled students found for this course. Please contact administrator to enroll students.
                  </td>
                </tr>
              ) : (
                registerStudents.map((student, idx) => (
                  <tr
                    key={student.student_id}
                    className={`hover:bg-slate-50 transition-colors ${
                      student.status === null ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.full_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {student.matric_no || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{student.department}</td>
                    <td className="py-3 px-4 text-center">
                      {student.status ? (
                        <Badge status={student.status} />
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold italic">
                          ● Unmarked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.student_id, 'Present')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                            student.status === 'Present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.student_id, 'Late')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                            student.status === 'Late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.student_id, 'Absent')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                            student.status === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Submit Register Footer */}
        {registerStudents.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              {unmarkedCount > 0 ? (
                <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Warning: {unmarkedCount} student{unmarkedCount > 1 ? 's' : ''} still unmarked.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  All {totalStudents} students verified and marked.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={unmarkedCount > 0 || submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isUpdateMode ? 'Update Attendance Register' : 'Submit Attendance Register'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Attendance Submission"
        subtitle={`Session: ${selectedCourse?.course_code} • ${attendanceDate} (${sessionPeriod})`}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            You are about to commit the attendance register to the institutional cloud database:
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Course:</span>
              <span className="font-bold text-slate-900">
                {selectedCourse?.course_code}: {selectedCourse?.course_title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Period:</span>
              <span>
                {attendanceDate} ({sessionPeriod})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Enrolled:</span>
              <span>{totalStudents} students</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Present:</span>
              <span className="font-bold">{presentCount}</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>Late:</span>
              <span className="font-bold">{lateCount}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>Absent:</span>
              <span className="font-bold">{absentCount}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            This operation will be recorded in the system audit trail. An atomic database transaction will prevent duplicate submissions.
          </p>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Back to Review
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 shadow-xs"
            >
              {submitting ? 'Saving Register...' : 'Yes, Commit Records'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
