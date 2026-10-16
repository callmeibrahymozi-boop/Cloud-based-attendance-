import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { generateInstitutionalReportPDF } from '../../utils/pdfGenerator';
import {
  FileSpreadsheet,
  FileText,
  Percent,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Download,
} from 'lucide-react';

interface InstitutionalReportData {
  summary: {
    generated_at: string;
    institution: string;
    total_students: number;
    total_lecturers: number;
    total_courses: number;
    total_records: number;
    present_percentage: number;
    late_percentage: number;
    absent_percentage: number;
    overall_attendance_rate: number;
  };
  courses: Array<{
    course_id: string;
    course_code: string;
    course_title: string;
    department: string;
    lecturer_name: string;
    enrolled_count: number;
    classes_held: number;
    total_records: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    attendance_rate: number;
  }>;
}

export const InstitutionalReports: React.FC = () => {
  const [data, setData] = useState<InstitutionalReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchInstitutionalReport = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean } & InstitutionalReportData>(
        `/reports/institutional?${deptFilter ? `department=${deptFilter}` : ''}`
      );
      if (res.success) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutionalReport();
  }, [deptFilter]);

  const handleDownloadPdf = () => {
    if (!data) return;
    setGeneratingPdf(true);
    try {
      generateInstitutionalReportPDF(data.summary, data.courses, deptFilter);
    } catch (err) {
      console.error('Error generating Institutional PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-400">
        Aggregating university attendance data...
      </div>
    );
  }

  const { summary, courses } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Attendance Reports</h1>
          <p className="text-xs text-slate-500">
            Comprehensive institutional analytics, faculty performance, and official audit exports.
          </p>
        </div>

        {/* Download PDF Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf || courses.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            title="Download comprehensive institutional audit document as PDF"
          >
            <Download className="h-4 w-4" />
            <FileText className="h-4 w-4" />
            <span>{generatingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance Rate"
          value={`${summary.overall_attendance_rate}%`}
          subtitle={`${summary.total_records} verified rolls taken`}
          icon={Percent}
          color={summary.overall_attendance_rate >= 75 ? 'emerald' : 'amber'}
        />
        <StatCard
          title="On-Time Attendance"
          value={`${summary.present_percentage}%`}
          subtitle="Marked Present"
          icon={GraduationCap}
          color="emerald"
        />
        <StatCard
          title="Late Arrival Rate"
          value={`${summary.late_percentage}%`}
          subtitle="Marked Late"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Institutional Absenteeism"
          value={`${summary.absent_percentage}%`}
          subtitle="Unexcused absence percentage"
          icon={Users}
          color="rose"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filter by Department:</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg p-2 bg-white"
          >
            <option value="">All Institutional Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Course-Level Attendance Audit</h3>
          <p className="text-xs text-slate-500">
            Attendance benchmarks across all academic offerings in {summary.institution}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Lecturer</th>
                <th className="py-3 px-4 text-center">Enrolled</th>
                <th className="py-3 px-4 text-center">Classes Held</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Late</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-right">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.course_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                      {c.course_code}
                    </span>
                    <span className="font-semibold text-slate-900 ml-2">{c.course_title}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.department}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{c.lecturer_name}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{c.enrolled_count}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{c.classes_held}</td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-semibold">{c.present_count}</td>
                  <td className="py-3 px-4 text-center text-amber-700 font-semibold">{c.late_count}</td>
                  <td className="py-3 px-4 text-center text-rose-700 font-semibold">{c.absent_count}</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-bold text-xs ${
                        c.attendance_rate >= 75 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {c.attendance_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
