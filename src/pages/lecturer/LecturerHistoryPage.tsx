import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AttendanceRecord, Course } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Search, Filter, Calendar, FileText } from 'lucide-react';

export const LecturerHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
        if (res.success) setCourses(res.courses);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(selectedCourse ? { course_id: selectedCourse } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedPeriod ? { session_period: selectedPeriod } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      });

      const res = await api.get<{
        success: boolean;
        total: number;
        records: AttendanceRecord[];
      }>(`/attendance/history?${params.toString()}`);

      if (res.success) {
        setRecords(res.records);
        setTotal(res.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, selectedCourse, selectedStatus, selectedPeriod, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedCourse('');
    setSelectedStatus('');
    setSelectedPeriod('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Attendance Register History</h1>
        <p className="text-xs text-slate-500">
          Search, audit, and inspect individual student attendance records across lecture dates.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code} - {c.course_title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="">All Periods</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
              title="From Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
              title="To Date"
            />
          </div>
        </div>

        <button
          onClick={handleResetFilters}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100"
        >
          Reset Filters
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Class Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Matric No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No attendance records match the selected criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.attendance_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {r.attendance_date}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.session_period}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {r.course_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {r.student_matric || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.student_name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.recorded_by_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with pagination count */}
        <div className="p-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {records.length} of {total} total records</span>
          {total > 20 && (
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
