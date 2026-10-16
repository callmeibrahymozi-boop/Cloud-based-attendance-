import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface StudentDashboardData {
  stats: {
    total_enrolled_courses: number;
    total_classes_recorded: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    attended_count: number;
    overall_percentage: number;
    min_threshold: number;
    is_eligible_overall: boolean;
  };
  courses: Array<{
    course_id: string;
    course_code: string;
    course_title: string;
    credit_unit: number;
    lecturer_name?: string;
    total_recorded: number;
    present: number;
    late: number;
    absent: number;
    percentage: number;
    exam_status: string;
  }>;
  low_attendance_warnings: Array<{
    course_id: string;
    course_code: string;
    course_title: string;
    percentage: number;
    total_recorded: number;
  }>;
  recent_history: Array<{
    attendance_id: string;
    course_code: string;
    course_title: string;
    attendance_date: string;
    session_period: string;
    status: string;
  }>;
}

export const StudentDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({
  setActiveTab,
}) => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get<{ success: boolean } & StudentDashboardData>('/dashboard/student');
        if (res.success) setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading personalized student dashboard...
      </div>
    );
  }

  const { stats, courses, low_attendance_warnings, recent_history } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Attendance Portal</h1>
          <p className="text-xs text-slate-500">
            Personal academic attendance performance, exam eligibility compliance, and lecture history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.is_eligible_overall ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Eligible for Semester Examinations ({stats.overall_percentage}%)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              At Risk: Below 75% Minimum Requirement
            </div>
          )}
        </div>
      </div>

      {/* New Student Onboarding Alert Banner */}
      {courses.length === 0 && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-950 text-sm">Course Registration Required</h4>
              <p className="mt-0.5 text-blue-800">
                You are not registered in any course registers for the current semester. Please register your curriculum courses to appear on your lecturers' class roll call registers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('student-courses')}
            className="shrink-0 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Register Courses Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Low Attendance Warning Alert Banner */}
      {low_attendance_warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900">Low Attendance Advisory</h4>
            <p className="mt-0.5 text-amber-800">
              Your attendance is currently below the mandatory institutional threshold ({stats.min_threshold}%) in the following courses:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {low_attendance_warnings.map((c) => (
                <span
                  key={c.course_id}
                  className="bg-white border border-amber-300 px-2 py-1 rounded font-semibold text-[11px] text-amber-900"
                >
                  {c.course_code}: {c.percentage}% ({c.total_recorded} classes)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${stats.overall_percentage}%`}
          subtitle={`Required for exam: ${stats.min_threshold}%`}
          icon={Percent}
          color={stats.overall_percentage >= 75 ? 'emerald' : 'rose'}
          badge={{
            text: stats.overall_percentage >= 75 ? 'Eligible' : 'Ineligible',
            variant: stats.overall_percentage >= 75 ? 'positive' : 'negative',
          }}
        />
        <StatCard
          title="Classes Attended"
          value={stats.attended_count}
          subtitle={`${stats.present_count} on-time, ${stats.late_count} late`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Classes Missed"
          value={stats.absent_count}
          subtitle="Unexcused absence records"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Registered Courses"
          value={stats.total_enrolled_courses}
          subtitle="Enrolled this semester"
          icon={BookOpen}
          color="blue"
        />
      </div>

      {/* Course-by-Course Attendance Progress */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Course-by-Course Attendance Breakdown</h2>
            <p className="text-xs text-slate-500">Track your standing against the 75% threshold in every course</p>
          </div>
          <button
            onClick={() => setActiveTab('my-attendance')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            Attendance Logs <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
            <BookOpen className="h-8 w-8 text-blue-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No Courses Registered Yet</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              You are not yet registered for any courses this semester. Register now to be included in attendance records and track your examination eligibility.
            </p>
            <button
              onClick={() => setActiveTab('student-courses')}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Browse & Register Courses</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {course.course_code}
                    </span>
                    <Badge status={course.exam_status} size="sm" />
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-slate-900 line-clamp-1">
                    {course.course_title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{course.lecturer_name || 'Unassigned'}</p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Attendance:</span>
                      <span className={course.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'}>
                        {course.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          course.percentage >= 75 ? 'bg-emerald-600' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, course.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 text-center text-[11px] pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400">Recorded</span>
                      <p className="font-bold text-slate-700">{course.total_recorded}</p>
                    </div>
                    <div>
                      <span className="text-emerald-600">Present</span>
                      <p className="font-bold text-emerald-700">{course.present + course.late}</p>
                    </div>
                    <div>
                      <span className="text-rose-600">Absent</span>
                      <p className="font-bold text-rose-700">{course.absent}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Roll Call Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Attendance History</h2>
            <p className="text-xs text-slate-500">Your most recent attendance entries</p>
          </div>
          <button
            onClick={() => setActiveTab('my-attendance')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            View All →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recent_history.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No attendance entries recorded yet.</p>
          ) : (
            recent_history.map((item) => (
              <div key={item.attendance_id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    {item.course_code}
                  </span>
                  <div>
                    <span className="font-medium text-slate-800">{item.course_title}</span>
                    <p className="text-[11px] text-slate-400">
                      {item.attendance_date} • {item.session_period}
                    </p>
                  </div>
                </div>
                <Badge status={item.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
