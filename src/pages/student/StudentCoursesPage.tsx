import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Course } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  BookOpen,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  Check,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AvailableCourse extends Course {
  is_registered: boolean;
  enrolment_id?: string;
}

export const StudentCoursesPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'registered' | 'catalogue'>('catalogue');
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registeringAll, setRegisteringAll] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Drop modal
  const [courseToDrop, setCourseToDrop] = useState<{ id: string; code: string; title: string } | null>(null);
  const [dropping, setDropping] = useState(false);

  const fetchEnrolledCourses = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: any[] }>('/dashboard/student');
      if (res.success) {
        setMyCourses(res.courses);
        // If already registered in courses, default to registered view
        if (res.courses.length > 0) {
          setActiveView((prev) => prev); // keep current
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: AvailableCourse[] }>('/courses/student/available');
      if (res.success) setAvailableCourses(res.courses);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchEnrolledCourses(), fetchAvailableCourses()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRegisterCourse = async (course: AvailableCourse) => {
    setRegisteringId(course.course_id);
    setFeedback(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/courses/student/register', {
        course_id: course.course_id,
      });
      setFeedback({
        type: 'success',
        message: res.message || `Successfully registered for ${course.course_code}: ${course.course_title}`,
      });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Course registration failed' });
    } finally {
      setRegisteringId(null);
    }
  };

  const handleRegisterAll = async () => {
    setRegisteringAll(true);
    setFeedback(null);
    try {
      const res = await api.post<{ success: boolean; message: string; registered_count: number }>('/courses/student/register-all', {});
      setFeedback({
        type: 'success',
        message: res.message || 'All semester courses registered successfully!',
      });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Bulk course registration failed' });
    } finally {
      setRegisteringAll(false);
    }
  };

  const confirmDropCourse = async () => {
    if (!courseToDrop) return;
    setDropping(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/courses/student/drop', {
        course_id: courseToDrop.id,
      });
      setFeedback({
        type: 'success',
        message: res.message || `Dropped course ${courseToDrop.code}`,
      });
      setCourseToDrop(null);
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to drop course' });
    } finally {
      setDropping(false);
    }
  };

  // Filter available courses in the catalogue
  const filteredCatalogue = availableCourses.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.course_code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      c.course_title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (c.lecturer_name && c.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    const matchesDept = !deptFilter || c.department.toLowerCase() === deptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(availableCourses.map((c) => c.department).filter(Boolean))).sort();
  const unregisteredCount = availableCourses.filter((c) => !c.is_registered).length;
  const totalRegisteredUnits = myCourses.reduce((acc, c) => acc + (c.credit_unit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Course Registration Portal</h1>
          <p className="text-xs text-slate-500">
            Register academic courses for 2025/2026 First Semester to be included on official roll call registers.
          </p>
        </div>

        {/* View Switcher Tabs & Quick Register All */}
        <div className="flex flex-wrap items-center gap-2">
          {unregisteredCount > 0 && (
            <button
              onClick={handleRegisterAll}
              disabled={registeringAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              title="Register for all available curriculum courses at once"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{registeringAll ? 'Enrolling...' : `Register All (${unregisteredCount} courses)`}</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView('catalogue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                activeView === 'catalogue'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Course Catalogue ({availableCourses.length})
            </button>
            <button
              onClick={() => setActiveView('registered')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'registered'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Courses ({myCourses.length})
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
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
          <button onClick={() => setFeedback(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Course Catalogue (Self-Registration) Tab */}
      {activeView === 'catalogue' && (
        <div className="space-y-4">
          {/* Catalogue Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by code, title, lecturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-2 bg-white w-full sm:w-auto"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Courses Catalogue Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                Loading available academic courses...
              </div>
            ) : filteredCatalogue.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                No courses available matching your query.
              </div>
            ) : (
              filteredCatalogue.map((course) => (
                <div
                  key={course.course_id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    course.is_registered
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200/80 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {course.course_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {course.credit_unit} Units
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                      {course.course_title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{course.department}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Lecturer:</span>
                        <span className="font-medium text-slate-800">{course.lecturer_name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Semester:</span>
                        <span className="text-slate-600">{course.academic_session} ({course.semester})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {course.is_registered ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold border border-emerald-300">
                          <Check className="h-3.5 w-3.5" /> Registered
                        </span>
                        <button
                          onClick={() => setCourseToDrop({ id: course.course_id, code: course.course_code, title: course.course_title })}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          Drop
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegisterCourse(course)}
                        disabled={registeringId === course.course_id}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>{registeringId === course.course_id ? 'Registering...' : 'Register Course'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Registered Courses Tab */}
      {activeView === 'registered' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500">
              Total Enrolled Credit Load: <strong className="text-slate-900">{totalRegisteredUnits} Units</strong>
            </span>
            <button
              onClick={() => setActiveView('catalogue')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Browse Catalogue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                Loading enrolled courses...
              </div>
            ) : myCourses.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
                <div className="h-12 w-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Courses Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You are not yet enrolled in any course registers for the current semester. Browse the course catalogue and register to appear on your lecturers' class registers.
                </p>
                <button
                  onClick={() => setActiveView('catalogue')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  Browse & Register Courses
                </button>
              </div>
            ) : (
              myCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {course.course_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {course.credit_unit} Units
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                      {course.course_title}
                    </h3>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Lecturer:</span>
                        <span className="font-medium text-slate-800">{course.lecturer_name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Classes Recorded:</span>
                        <span className="font-bold text-slate-700">{course.total_recorded || 0} sessions</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Attendance Standing:</span>
                        <span className={`font-bold ${(course.percentage || 0) >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {course.percentage || 0}% ({course.exam_status || 'Enrolled'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${(course.percentage || 0) >= 75 ? 'bg-emerald-600' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, course.percentage || 0)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setCourseToDrop({ id: course.course_id, code: course.course_code, title: course.course_title })}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Drop course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Accessible Drop Confirmation Modal */}
      {courseToDrop && (
        <Modal
          isOpen={true}
          onClose={() => setCourseToDrop(null)}
          title="Confirm Dropping Course"
          subtitle={`Are you sure you want to drop ${courseToDrop.code}?`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">{courseToDrop.title}</p>
                <p className="mt-1 text-amber-800">
                  Dropping this course will immediately remove you from the lecturer's roll call attendance register.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCourseToDrop(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Keep Course
              </button>
              <button
                type="button"
                onClick={confirmDropCourse}
                disabled={dropping}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 shadow-xs"
              >
                {dropping ? 'Dropping...' : 'Confirm Drop'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
