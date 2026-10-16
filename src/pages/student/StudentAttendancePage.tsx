import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AttendanceRecord, Course, AttendanceStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Search, Filter, AlertCircle, CheckCircle2, MessageSquarePlus } from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetRecord, setTargetRecord] = useState<AttendanceRecord | null>(null);
  const [corrCourseId, setCorrCourseId] = useState('');
  const [corrDate, setCorrDate] = useState('');
  const [corrCurrentStatus, setCorrCurrentStatus] = useState<AttendanceStatus>('Absent');
  const [corrRequestedStatus, setCorrRequestedStatus] = useState<AttendanceStatus>('Present');
  const [corrReason, setCorrReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(selectedCourse ? { course_id: selectedCourse } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      });
      const res = await api.get<{ success: boolean; records: AttendanceRecord[] }>(
        `/attendance/history?${params.toString()}`
      );
      if (res.success) setRecords(res.records);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedCourse, selectedStatus, startDate, endDate]);

  const openCorrectionForRecord = (r: AttendanceRecord) => {
    setTargetRecord(r);
    setCorrCourseId(r.course_id);
    setCorrDate(r.attendance_date);
    setCorrCurrentStatus(r.status);
    setCorrRequestedStatus('Present');
    setCorrReason('');
    setShowCorrectionModal(true);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/attendance/correction-request', {
        attendance_id: targetRecord?.attendance_id || undefined,
        course_id: corrCourseId,
        attendance_date: corrDate,
        current_status: corrCurrentStatus,
        requested_status: corrRequestedStatus,
        reason: corrReason,
      });
      setFeedback({
        type: 'success',
        message: 'Your attendance correction request has been submitted to your course lecturer for review.',
      });
      setShowCorrectionModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Attendance Records</h1>
          <p className="text-xs text-slate-500">
            Official chronological log of your class attendance, roll call status, and session details.
          </p>
        </div>
        <button
          onClick={() => {
            setTargetRecord(null);
            setCorrCourseId(courses[0]?.course_id || '');
            setCorrDate(new Date().toISOString().split('T')[0]);
            setCorrCurrentStatus('Absent');
            setCorrRequestedStatus('Present');
            setCorrReason('');
            setShowCorrectionModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Request Attendance Correction
        </button>
      </div>

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
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="">All Registered Courses</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code} - {c.course_title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
              title="From Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
              title="To Date"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedCourse('');
            setSelectedStatus('');
            setStartDate('');
            setEndDate('');
          }}
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
                <th className="py-3 px-4">Lecture Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Appeal / Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading your attendance history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.attendance_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.attendance_date}</td>
                    <td className="py-3 px-4 text-slate-600">{r.session_period}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {r.course_code}
                      </span>
                      <span className="text-slate-500 ml-2">{r.course_title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{r.recorded_by_name}</td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'Absent' && (
                        <button
                          onClick={() => openCorrectionForRecord(r)}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          Request Correction
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Request Modal */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Submit Attendance Correction Appeal"
        subtitle="Dispute an absent or late record for lecturer review"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-700">Course</label>
            <select
              value={corrCourseId}
              onChange={(e) => setCorrCourseId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code} - {c.course_title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Lecture Date</label>
              <input
                type="date"
                required
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Requested Status</label>
              <select
                value={corrRequestedStatus}
                onChange={(e) => setCorrRequestedStatus(e.target.value as AttendanceStatus)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1 font-semibold text-emerald-700"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Reason / Justification</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. I attended the class and submitted my assignment slip, but my name was skipped during the roll call..."
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg mt-1"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCorrectionModal(false)}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 shadow-xs"
            >
              Submit Appeal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
