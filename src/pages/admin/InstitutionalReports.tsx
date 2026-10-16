import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { generateInstitutionalReportPDF, InstitutionalFilterState } from '../../utils/pdfGenerator';
import {
  FileText,
  Percent,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Download,
  Search,
  Filter,
  RotateCcw,
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
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Filter States
  const [deptFilter, setDeptFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant' | 'risk'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInstitutionalReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (deptFilter) params.append('department', deptFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get<{ success: boolean } & InstitutionalReportData>(
        `/reports/institutional?${params.toString()}`
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
  }, [deptFilter, startDate, endDate]);

  // Client-side filtering for search & compliance thresholds
  const filteredCourses = useMemo(() => {
    if (!data?.courses) return [];
    let list = data.courses;

    if (complianceFilter === 'compliant') {
      list = list.filter((c) => c.attendance_rate >= 75);
    } else if (complianceFilter === 'risk') {
      list = list.filter((c) => c.attendance_rate < 75);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.course_code.toLowerCase().includes(q) ||
          c.course_title.toLowerCase().includes(q) ||
          c.lecturer_name.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, complianceFilter, searchQuery]);

  const handleResetFilters = () => {
    setDeptFilter('');
    setStartDate('');
    setEndDate('');
    setComplianceFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(
    deptFilter || startDate || endDate || complianceFilter !== 'all' || searchQuery
  );

  const handleDownloadPdf = () => {
    if (!data) return;
    setGeneratingPdf(true);
    try {
      const activeFilters: InstitutionalFilterState = {
        department: deptFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        compliance:
          complianceFilter === 'compliant'
            ? 'Compliant Only (>= 75%)'
            : complianceFilter === 'risk'
            ? 'Below Minimum Threshold (< 75%)'
            : 'All Courses',
        search: searchQuery.trim() || undefined,
      };

      generateInstitutionalReportPDF(data.summary, filteredCourses, activeFilters);
    } catch (err) {
      console.error('Error generating Institutional PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-400">
        Aggregating university attendance data...
      </div>
    );
  }

  const summary = data?.summary;

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

        {/* Download as PDF Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf || filteredCourses.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            title="Download formatted institutional attendance document as PDF based on active filters"
          >
            <Download className="h-4 w-4" />
            <FileText className="h-4 w-4" />
            <span>{generatingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
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
      )}

      {/* Comprehensive Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-blue-600" />
            Filter Attendance Audit Records
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Department Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          {/* Compliance Status */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Compliance Threshold
            </label>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="all">All Courses</option>
              <option value="compliant">Compliant (&gt;= 75%)</option>
              <option value="risk">Below Threshold (&lt; 75%)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Lecture Date Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                title="End Date"
              />
            </div>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Search Course / Lecturer
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Course code, title, lecturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Filter State Status Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Displaying <strong>{filteredCourses.length}</strong> matching course{filteredCourses.length === 1 ? '' : 's'} based on current filter state.
          </span>
          <span className="text-[11px] text-blue-700 font-medium">
            PDF report will precisely reflect this filtered selection.
          </span>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Course-Level Attendance Audit</h3>
            <p className="text-xs text-slate-500">
              Attendance benchmarks across academic offerings in {summary?.institution || 'the institution'}
            </p>
          </div>
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
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No courses match the active filter criteria. Try adjusting or resetting your filters.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
