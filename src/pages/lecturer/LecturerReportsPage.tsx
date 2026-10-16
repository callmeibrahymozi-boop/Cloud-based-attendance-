import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Course, CourseReportStudent, CourseReportMeta } from '../../types';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { generateCourseAttendanceReportPDF } from '../../utils/pdfGenerator';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Percent,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

export const LecturerReportsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [reportMeta, setReportMeta] = useState<CourseReportMeta | null>(null);
  const [students, setStudents] = useState<CourseReportStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

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
      const res = await api.get<{
        success: boolean;
        meta: CourseReportMeta;
        students: CourseReportStudent[];
      }>(`/reports/course?course_id=${selectedCourseId}`);
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
  }, [selectedCourseId]);

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

  const handleDownloadPdf = () => {
    if (!selectedCourseId || !reportMeta || students.length === 0) return;
    setExporting('pdf');
    try {
      generateCourseAttendanceReportPDF(reportMeta, students);
    } catch (err: any) {
      console.error('jsPDF generation error:', err);
      // Fallback to server endpoint if needed
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Course Attendance Reports</h1>
          <p className="text-xs text-slate-500">
            Official class registers, exam eligibility compliance, and genuine PDF/Excel generation.
          </p>
        </div>

        {/* Export Buttons */}
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
            disabled={!reportMeta || exporting !== null || students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            title="Download official course attendance document as PDF"
          >
            <Download className="h-4 w-4" />
            <FileText className="h-4 w-4" />
            <span>{exporting === 'pdf' ? 'Generating PDF...' : 'Download as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Course Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <label className="text-xs font-bold text-slate-700 shrink-0">Select Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg p-2 bg-white max-w-md focus:ring-2 focus:ring-blue-600 font-medium"
        >
          {courses.map((c) => (
            <option key={c.course_id} value={c.course_id}>
              {c.course_code} - {c.course_title} ({c.academic_session})
            </option>
          ))}
        </select>
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
              title="Average Attendance"
              value={`${reportMeta.average_attendance}%`}
              subtitle={`Threshold: ${reportMeta.min_required_percentage}%`}
              icon={Percent}
              color={reportMeta.average_attendance >= 75 ? 'emerald' : 'amber'}
            />
            <StatCard
              title="Eligible for Exam"
              value={reportMeta.eligible_count}
              subtitle="Met >= 75% attendance criterion"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Students at Risk"
              value={reportMeta.at_risk_count}
              subtitle="Below minimum requirement"
              icon={AlertTriangle}
              color={reportMeta.at_risk_count > 0 ? 'rose' : 'slate'}
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
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No students enrolled in this course.
                      </td>
                    </tr>
                  ) : (
                    students.map((st, idx) => (
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
