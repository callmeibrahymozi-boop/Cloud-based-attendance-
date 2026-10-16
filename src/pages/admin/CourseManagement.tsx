import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Course, User, SemesterType } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  BookOpen,
  PlusCircle,
  Users,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  X,
  UserPlus,
} from 'lucide-react';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Enrolment view
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [studentToEnrol, setStudentToEnrol] = useState('');

  // Course Form
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [creditUnit, setCreditUnit] = useState(3);
  const [department, setDepartment] = useState('Computer Science');
  const [lecturerId, setLecturerId] = useState('');
  const [academicSession, setAcademicSession] = useState('2025/2026');
  const [semester, setSemester] = useState<SemesterType>('First');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [crsRes, lecRes, stdRes] = await Promise.all([
        api.get<{ success: boolean; courses: Course[] }>('/courses'),
        api.get<{ success: boolean; lecturers: User[] }>('/users/lecturers'),
        api.get<{ success: boolean; students: User[] }>('/users/students'),
      ]);
      if (crsRes.success) setCourses(crsRes.courses);
      if (lecRes.success) setLecturers(lecRes.lecturers);
      if (stdRes.success) setStudents(stdRes.students);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/courses', {
        course_code: courseCode,
        course_title: courseTitle,
        credit_unit: creditUnit,
        department,
        lecturer_id: lecturerId || undefined,
        academic_session: academicSession,
        semester,
      });
      setFeedback({ type: 'success', message: `Course ${courseCode} created successfully!` });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.put(`/courses/${selectedCourse.course_id}`, {
        course_code: courseCode,
        course_title: courseTitle,
        credit_unit: creditUnit,
        department,
        lecturer_id: lecturerId || undefined,
        academic_session: academicSession,
        semester,
      });
      setFeedback({ type: 'success', message: `Course ${courseCode} updated successfully!` });
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm(`Delete course "${course.course_code}: ${course.course_title}"? Associated records will be removed.`)) return;
    try {
      await api.delete(`/courses/${course.course_id}`);
      setFeedback({ type: 'success', message: `Course ${course.course_code} deleted.` });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const openEnrolmentManager = async (course: Course) => {
    setSelectedCourse(course);
    setLoadingEnrolled(true);
    setShowEnrolModal(true);
    setStudentToEnrol('');
    try {
      const res = await api.get<{ success: boolean; students: any[] }>(`/courses/${course.course_id}/students`);
      if (res.success) setEnrolledStudents(res.students);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const handleEnrolStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !studentToEnrol) return;
    try {
      await api.post(`/courses/${selectedCourse.course_id}/enrol`, {
        student_id: studentToEnrol,
        session: selectedCourse.academic_session,
        semester: selectedCourse.semester,
      });
      setFeedback({ type: 'success', message: 'Student successfully enrolled in course.' });
      // refresh enrolled list
      const res = await api.get<{ success: boolean; students: any[] }>(`/courses/${selectedCourse.course_id}/students`);
      if (res.success) setEnrolledStudents(res.students);
      setStudentToEnrol('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRemoveEnrolment = async (enrolmentId: string) => {
    if (!selectedCourse) return;
    try {
      await api.delete(`/courses/${selectedCourse.course_id}/enrol/${enrolmentId}`);
      setEnrolledStudents(enrolledStudents.filter((s) => s.enrolment_id !== enrolmentId));
      setFeedback({ type: 'success', message: 'Enrolment removed.' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const openEditModal = (c: Course) => {
    setSelectedCourse(c);
    setCourseCode(c.course_code);
    setCourseTitle(c.course_title);
    setCreditUnit(c.credit_unit);
    setDepartment(c.department);
    setLecturerId(c.lecturer_id || '');
    setAcademicSession(c.academic_session);
    setSemester(c.semester);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setCourseCode('');
    setCourseTitle('');
    setCreditUnit(3);
    setDepartment('Computer Science');
    setLecturerId('');
    setAcademicSession('2025/2026');
    setSemester('First');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Course Management</h1>
          <p className="text-xs text-slate-500">
            Define curriculum courses, assign subject lecturers, and manage student enrolments.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Course
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            No courses found. Create one above.
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.course_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {course.course_code}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {course.credit_unit} Units
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                  {course.course_title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{course.department}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lecturer:</span>
                    <span className="font-semibold text-slate-800">
                      {course.lecturer_name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Session/Semester:</span>
                    <span className="text-slate-700">
                      {course.academic_session} ({course.semester})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Enrolled Students:</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                      {course.enrolled_count || 0} enrolled
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openEnrolmentManager(course)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200"
                >
                  <Users className="h-3.5 w-3.5" />
                  Manage Enrolments
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(course)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                    title="Edit Course"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                    title="Delete Course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Academic Course"
        subtitle="Establish a new curriculum offering for attendance tracking"
      >
        <form onSubmit={handleCreateCourse} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Course Code</label>
              <input
                type="text"
                required
                placeholder="e.g. CSC 401"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Credit Units</label>
              <input
                type="number"
                min={1}
                max={6}
                required
                value={creditUnit}
                onChange={(e) => setCreditUnit(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Database Systems"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Assigned Lecturer</label>
            <select
              value={lecturerId}
              onChange={(e) => setLecturerId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            >
              <option value="">-- Leave Unassigned for now --</option>
              {lecturers.map((lec) => (
                <option key={lec.user_id} value={lec.user_id}>
                  {lec.full_name} ({lec.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Academic Session</label>
              <input
                type="text"
                required
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterType)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="First">First Semester</option>
                <option value="Second">Second Semester</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Course: ${selectedCourse?.course_code}`}
        subtitle="Modify curriculum parameters and lecturer assignment"
      >
        <form onSubmit={handleUpdateCourse} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Course Code</label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Credit Units</label>
              <input
                type="number"
                min={1}
                max={6}
                required
                value={creditUnit}
                onChange={(e) => setCreditUnit(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Course Title</label>
            <input
              type="text"
              required
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Assigned Lecturer</label>
            <select
              value={lecturerId}
              onChange={(e) => setLecturerId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            >
              <option value="">-- Unassigned --</option>
              {lecturers.map((lec) => (
                <option key={lec.user_id} value={lec.user_id}>
                  {lec.full_name} ({lec.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Academic Session</label>
              <input
                type="text"
                required
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterType)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="First">First Semester</option>
                <option value="Second">Second Semester</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              Save Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrolment Manager Modal */}
      <Modal
        isOpen={showEnrolModal}
        onClose={() => setShowEnrolModal(false)}
        title={`Student Enrolments: ${selectedCourse?.course_code}`}
        subtitle={`${selectedCourse?.course_title} • Session ${selectedCourse?.academic_session}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Enrol new student form */}
          <form onSubmit={handleEnrolStudent} className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <select
              value={studentToEnrol}
              onChange={(e) => setStudentToEnrol(e.target.value)}
              className="flex-1 text-xs p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Select a registered student to enrol --</option>
              {students
                .filter((st) => !enrolledStudents.some((e) => e.user_id === st.user_id))
                .map((st) => (
                  <option key={st.user_id} value={st.user_id}>
                    {st.full_name} ({st.matric_no || st.username}) - {st.department}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={!studentToEnrol}
              className="px-3 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1 shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Enrol Student
            </button>
          </form>

          {/* Enrolled students list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingEnrolled ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Loading enrolments...
                    </td>
                  </tr>
                ) : enrolledStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No students currently enrolled in this course.
                    </td>
                  </tr>
                ) : (
                  enrolledStudents.map((st, idx) => (
                    <tr key={st.enrolment_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-700">
                        {st.matric_no || '—'}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{st.full_name}</td>
                      <td className="py-2 px-3 text-slate-500">{st.department}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleRemoveEnrolment(st.enrolment_id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Remove student from course"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
