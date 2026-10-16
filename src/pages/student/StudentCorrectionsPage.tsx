import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AttendanceCorrectionRequest } from '../../types';
import { Badge } from '../../components/common/Badge';

export const StudentCorrectionsPage: React.FC = () => {
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get<{
          success: boolean;
          requests: AttendanceCorrectionRequest[];
        }>('/attendance/correction-requests');
        if (res.success) setRequests(res.requests);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">My Correction Appeals</h1>
        <p className="text-xs text-slate-500">
          Track the status of your attendance disputes submitted to lecturers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Class Date</th>
                <th className="py-3 px-4">Transition</th>
                <th className="py-3 px-4">Reason Given</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Lecturer Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading your requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    You have not submitted any attendance correction requests.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {r.course_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.attendance_date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Badge status={r.current_status} size="sm" />
                        <span className="text-slate-400">→</span>
                        <Badge status={r.requested_status} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{r.reason}</td>
                    <td className="py-3 px-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">
                      {r.admin_note || (r.status === 'Pending' ? 'Awaiting lecturer review' : 'No remarks')}
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
