import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Percent,
  Clock,
  ArrowRight,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  FlaskConical,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface AdminDashboardData {
  stats: {
    total_students: number;
    total_lecturers: number;
    total_courses: number;
    total_attendance_records: number;
    overall_attendance_rate: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    pending_corrections: number;
  };
  trends: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  }>;
  departments: Array<{
    name: string;
    students: number;
    courses: number;
  }>;
  recent_logs: Array<{
    log_id: string;
    username: string;
    role: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const AdminDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({
  setActiveTab,
}) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get<{ success: boolean } & AdminDashboardData>('/dashboard/admin');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-sm text-slate-500 animate-pulse">
          Loading institutional analytics...
        </div>
      </div>
    );
  }

  const { stats, trends, departments, recent_logs } = data;

  const pieData = [
    { name: 'Present', value: stats.present_count },
    { name: 'Late', value: stats.late_count },
    { name: 'Absent', value: stats.absent_count },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Administration</h1>
          <p className="text-xs text-slate-500">
            Real-time attendance intelligence, academic compliance, and cloud system oversight.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add User
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
            Add Course
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors shadow-2xs"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Run Evaluation Tests
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Students"
          value={stats.total_students}
          subtitle="Enrolled across active faculties"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Active Lecturers"
          value={stats.total_lecturers}
          subtitle="Facilitating course registers"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Accredited Courses"
          value={stats.total_courses}
          subtitle="Academic curriculum 2025/2026"
          icon={BookOpen}
          color="slate"
        />
        <StatCard
          title="Overall Attendance Rate"
          value={`${stats.overall_attendance_rate}%`}
          subtitle={`${stats.total_attendance_records} total verified records`}
          icon={Percent}
          color={stats.overall_attendance_rate >= 75 ? 'emerald' : 'amber'}
          badge={{
            text: stats.overall_attendance_rate >= 75 ? 'Optimal' : 'Low Warning',
            variant: stats.overall_attendance_rate >= 75 ? 'positive' : 'warning',
          }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Volume & Trends</h2>
              <p className="text-xs text-slate-500">Recorded attendance rates across recent lecture dates</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Avg: {stats.overall_attendance_rate}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present Students"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Roll Call Distribution</h2>
            <p className="text-xs text-slate-500">Aggregate Present, Late, and Absent tallies</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Present</p>
              <p className="text-xs font-bold text-emerald-700">{stats.present_count}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Late</p>
              <p className="text-xs font-bold text-amber-700">{stats.late_count}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Absent</p>
              <p className="text-xs font-bold text-rose-700">{stats.absent_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Distribution & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department Enrollment</h2>
              <p className="text-xs text-slate-500">Students and courses per department</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" name="Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="courses" name="Courses" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Institutional Activity</h2>
              <p className="text-xs text-slate-500">Immutable audit log of administrative and attendance events</p>
            </div>
            <button
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              View All Logs <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden">
            {recent_logs.slice(0, 5).map((log) => (
              <div key={log.log_id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <Badge variant={log.role as any} size="sm">{log.role}</Badge>
                    <span className="text-[11px] text-slate-400">by {log.username}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-[11px]">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
