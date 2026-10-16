import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface LecturerDashboardData {
  stats: {
    assigned_courses_count: number;
    total_enrolled_students: number;
    total_sessions_recorded: number;
    pending_corrections: number;
  };
  courses: Array<{
    course_id: string;
    course_code: string;
    course_title: string;
    enrolled_count: number;
    classes_recorded: number;
    total_records: number;
    attendance_rate: number;
  }>;
  recent_sessions: Array<{
    course_code: string;
    date: string;
    period: string;
    count: number;
  }>;
}

export const LecturerDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({
  setActiveTab,
}) => {
  const [data, setData] = useState<LecturerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get<{ success: boolean } & LecturerDashboardData>('/dashboard/lecturer');
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
        Loading lecturer dashboard...
      </div>
    );
  }

  const { stats, courses, recent_sessions } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lecturer Workspace</h1>
          <p className="text-xs text-slate-500">
            Attendance registers, student rosters, and academic compliance tracking.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('record-attendance')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors shadow-xs"
        >
          <ClipboardCheck className="h-4 w-4" />
          Take Attendance Now
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={stats.assigned_courses_count}
          subtitle="Curriculum teaching load"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Total Enrolled"
          value={stats.total_enrolled_students}
          subtitle="Students across your classes"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Recorded Class Sessions"
          value={stats.total_sessions_recorded}
          subtitle="Official lecture registers filed"
          icon={ClipboardCheck}
          color="emerald"
        />
        <StatCard
          title="Pending Corrections"
          value={stats.pending_corrections}
          subtitle="Student appeals awaiting review"
          icon={AlertTriangle}
          color={stats.pending_corrections > 0 ? 'amber' : 'slate'}
          badge={
            stats.pending_corrections > 0
              ? { text: 'Needs Review', variant: 'warning' }
              : undefined
          }
        />
      </div>

      {/* Courses Overview & Quick Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Assigned Courses & Attendance Rates</h2>
            <button
              onClick={() => setActiveTab('course-reports')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              Detailed Reports <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {course.course_code}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {course.attendance_rate}% Rate
                    </span>
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-slate-900 line-clamp-1">
                    {course.course_title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{course.enrolled_count} Students Enrolled</span>
                    <span>{course.classes_recorded} Classes Held</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        course.attendance_rate >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, course.attendance_rate)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab('record-attendance')}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Open Register →
                  </button>
                  <button
                    onClick={() => setActiveTab('course-reports')}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    View Stats
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Lecture Sessions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Recent Attendance Sessions</h2>
            <p className="text-xs text-slate-500 mb-4">Latest filed attendance registers</p>

            <div className="space-y-3">
              {recent_sessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No sessions recorded yet.</p>
              ) : (
                recent_sessions.map((sess, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{sess.course_code}</span>
                      <p className="text-[11px] text-slate-500">{sess.date} • {sess.period}</p>
                    </div>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                      {sess.count} Records
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveTab('attendance-history')}
              className="w-full py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              View Full Attendance History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
