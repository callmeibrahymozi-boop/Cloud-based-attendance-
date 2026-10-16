import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import { Course, CourseReportStudent, CourseReportMeta } from '../../types';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { generateCourseAttendanceReportPDF, CourseFilterState } from '../../utils/pdfGenerator';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Percent,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';

export const LecturerReportsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [reportMeta, setReportMeta] = useState<CourseReportMeta | null>(null);
  const [students, setStudents] = useState<CourseReportStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'Eligible' | 'Warning' | 'Ineligible'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
        if (res.success && res.courses.length > 0) {
          setCourses(res.courses);
          setSelectedCourseId(res.courses[0].course_id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const fetchReport = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ course_id: selectedCourseId });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get<{
        success: boolean;
        meta: CourseReportMeta;
        students: CourseReportStudent[];
      }>(`/reports/course?${params.toString()}`);

      if (res.success) {
        setReportMeta(res.meta);
        setStudents(res.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedCourseId, startDate, endDate]);

  // Client-side filter for student search and eligibility status
  const filteredStudents = useMemo(() => {
    let list = students;

    if (eligibilityFilter !== 'all') {
      list = list.filter((s) => s.exam_status === eligibilityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.matric_no.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }

    return list;
  }, [students, eligibilityFilter, searchQuery]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setEligibilityFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(
    startDate || endDate || eligibilityFilter !== 'all' || searchQuery
  );

  const handleDownloadPdf = () => {
    if (!selectedCourseId || !reportMeta || filteredStudents.length === 0) return;
    setExporting('pdf');
    try {
      const activeFilters: CourseFilterState = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        eligibility:
          eligibilityFilter === 'Eligible'
            ? 'Eligible (>= 75%)'
            : eligibilityFilter === 'Warning'
            ? 'Warning (65% - 74%)'
            : eligibilityFilter === 'Ineligible'
            ? 'Ineligible (< 65%)'
            : 'All Enrolled Students',
        search: searchQuery.trim() || undefined,
      };

      generateCourseAttendanceReportPDF(reportMeta, filteredStudents, activeFilters);
    } catch (err: any) {
      console.error('jsPDF generation error:', err);
      // Fallback
      api.downloadBlob(
        `/reports/export/pdf?course_id=${selectedCourseId}`,
        `${reportMeta.course_code}_Attendance_Report.pdf`
      ).catch((fetchErr) => {
        alert(`Export error: ${fetchErr.message}`);
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedCourseId || !reportMeta) return;
    setExporting('excel');
    try {
      await api.downloadBlob(
        `/reports/export/excel?course_id=${selectedCourseId}`,
        `${reportMeta.course_code}_Attendance_Report.xlsx`
      );
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  // Recalculated metrics for the currently filtered roster
  const filteredAverage =
    filteredStudents.length > 0
      ? Math.round(
          (filteredStudents.reduce((acc, s) => acc + s.percentage, 0) / filteredStudents.length) * 10
        ) / 10
      : 0;
  const filteredEligibleCount = filteredStudents.filter((s) => s.exam_status === 'Eligible').length;
  const filteredAtRiskCount = filteredStudents.filter((s) => s.exam_status !== 'Eligible').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Course Attendance Reports</h1>
          <p className="text-xs text-slate-500">
            Official class registers, exam eligibility compliance, and formatted PDF/Excel document generation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!reportMeta || exporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exporting === 'excel' ? 'Exporting...' : 'Export Excel (.xlsx)'}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!reportMeta || exporting !== null || filteredStudents.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            title="Download formatted course attendance document as PDF based on current filter state"
          >
            <Download className="h-4 w-4" />
            <FileText className="h-4 w-4" />
            <span>{exporting === 'pdf' ? 'Generating PDF...' : 'Download as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-blue-600" />
            Report Parameters & Attendance Filters
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
          {/* Course Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Select Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code} - {c.course_title}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Eligibility Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Exam Eligibility
            </label>
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="all">All Enrolled Students</option>
              <option value="Eligible">Eligible (&gt;= 75%)</option>
              <option value="Warning">Warning (65% - 74%)</option>
              <option value="Ineligible">Ineligible (&lt; 65%)</option>
            </select>
          </div>

          {/* Lecture Date Range */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Class Date Range
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

          {/* Student Search */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Name, matric number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of {students.length} students enrolled in {reportMeta?.course_code}.
          </span>
          <span className="text-[11px] text-blue-700 font-medium">
            PDF report will format this filtered student roster.
          </span>
        </div>
      </div>

      {reportMeta && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Lectures Recorded"
              value={reportMeta.total_classes_held}
              subtitle="Distinct roll calls taken"
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Filtered Avg Attendance"
              value={`${filteredAverage}%`}
              subtitle={`Required: ${reportMeta.min_required_percentage}%`}
              icon={Percent}
              color={filteredAverage >= 75 ? 'emerald' : 'amber'}
            />
            <StatCard
              title="Eligible for Exam"
              value={`${filteredEligibleCount}/${filteredStudents.length}`}
              subtitle="Met >= 75% criterion"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Students at Risk"
              value={filteredAtRiskCount}
              subtitle="Below 75% threshold"
              icon={AlertTriangle}
              color={filteredAtRiskCount > 0 ? 'rose' : 'slate'}
            />
          </div>

          {/* Detailed Student Roster & Percentages */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {reportMeta.course_code}: {reportMeta.course_title}
                </h3>
                <p className="text-xs text-slate-500">
                  Lecturer: {reportMeta.lecturer_name} • Session: {reportMeta.session} ({reportMeta.semester} Sem)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Matric No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Classes</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Late</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-center">Attendance Rate</th>
                    <th className="py-3 px-4 text-right">Exam Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        Calculating course metrics...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No students match the active filter criteria. Try adjusting your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {st.matric_no}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{st.full_name}</td>
                        <td className="py-3 px-4 text-slate-500">{st.department}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {st.total_recorded}
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                          {st.present_count}
                        </td>
                        <td className="py-3 px-4 text-center text-amber-700 font-semibold">
                          {st.late_count}
                        </td>
                        <td className="py-3 px-4 text-center text-rose-700 font-semibold">
                          {st.absent_count}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold text-xs ${
                              st.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {st.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge status={st.exam_status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
