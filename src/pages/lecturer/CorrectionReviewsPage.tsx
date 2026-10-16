import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AttendanceCorrectionRequest } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export const CorrectionReviewsPage: React.FC = () => {
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<AttendanceCorrectionRequest | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [adminNote, setAdminNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const openReviewModal = (req: AttendanceCorrectionRequest, dec: 'Approved' | 'Rejected') => {
    setSelectedReq(req);
    setDecision(dec);
    setAdminNote('');
    setShowModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await api.patch(`/attendance/correction-requests/${selectedReq.request_id}`, {
        decision,
        admin_note: adminNote,
      });
      setFeedback(`Correction request successfully ${decision.toLowerCase()}.`);
      setShowModal(false);
      fetchRequests();
    } catch (err: any) {
      alert(`Error reviewing request: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Attendance Correction Appeals</h1>
        <p className="text-xs text-slate-500">
          Review, verify, and adjudicate attendance discrepancy requests filed by enrolled students.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Class Date</th>
                <th className="py-3 px-4">Change Request</th>
                <th className="py-3 px-4">Student's Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading correction appeals...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No attendance correction requests submitted.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.student_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{r.student_matric}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {r.course_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.attendance_date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge status={r.current_status} size="sm" />
                        <span className="text-slate-400">→</span>
                        <Badge status={r.requested_status} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openReviewModal(r, 'Approved')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openReviewModal(r, 'Rejected')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded font-semibold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Reviewed by {r.reviewer_name || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${decision === 'Approved' ? 'Approve' : 'Reject'} Attendance Correction`}
        subtitle={`Student: ${selectedReq?.student_name} • Course: ${selectedReq?.course_code}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p><strong>Reason provided:</strong> {selectedReq?.reason}</p>
            <p>
              <strong>Status transition:</strong> {selectedReq?.current_status} →{' '}
              <span className="text-emerald-700 font-bold">{selectedReq?.requested_status}</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Remarks / Note (Optional)</label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Provide context or explanation for student record..."
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white font-bold rounded-lg shadow-xs ${
                decision === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {decision}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
