import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { SystemSettings } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form states
  const [instName, setInstName] = useState('');
  const [shortName, setShortName] = useState('');
  const [minPercentage, setMinPercentage] = useState(75);
  const [lateCounts, setLateCounts] = useState(true);
  const [allowCorrections, setAllowCorrections] = useState(true);
  const [sessionName, setSessionName] = useState('2025/2026');
  const [semesterName, setSemesterName] = useState<'First' | 'Second'>('First');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; settings: SystemSettings }>('/system/settings');
      if (res.success) {
        setSettings(res.settings);
        setInstName(res.settings.institution_name);
        setShortName(res.settings.short_name);
        setMinPercentage(res.settings.min_attendance_percentage);
        setLateCounts(res.settings.late_arrival_counts_as_present);
        setAllowCorrections(res.settings.allow_student_corrections);
        setSessionName(res.settings.current_session);
        setSemesterName(res.settings.current_semester);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/system/settings', {
        institution_name: instName,
        short_name: shortName,
        min_attendance_percentage: minPercentage,
        late_arrival_counts_as_present: lateCounts,
        allow_student_corrections: allowCorrections,
        current_session: sessionName,
        current_semester: semesterName,
      });
      setFeedback({ type: 'success', message: 'Institutional configurations updated successfully!' });
      fetchSettings();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleResetDemoData = async () => {
    setResetting(true);
    try {
      await api.post('/system/reset-demo');
      setShowResetModal(false);
      setFeedback({
        type: 'success',
        message: 'Database has been restored to standard academic demonstration records.',
      });
      fetchSettings();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setResetting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-400">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Institutional Settings & Policies</h1>
        <p className="text-xs text-slate-500">
          Configure academic calendar, minimum exam thresholds, late arrival rules, and database resets.
        </p>
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

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Institution Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-5 w-5 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">Institutional Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Institution Name
              </label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Short Name / Acronym
              </label>
              <input
                type="text"
                required
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Academic Calendar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="h-5 w-5 text-purple-700" />
            <h2 className="text-sm font-bold text-slate-900">Academic Calendar & Attendance Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Active Academic Session
              </label>
              <input
                type="text"
                required
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Active Semester
              </label>
              <select
                value={semesterName}
                onChange={(e) => setSemesterName(e.target.value as 'First' | 'Second')}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="First">First Semester</option>
                <option value="Second">Second Semester</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Minimum Exam Attendance Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={minPercentage}
                onChange={(e) => setMinPercentage(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Students below this percentage will be marked Ineligible for examinations.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={lateCounts}
                  onChange={(e) => setLateCounts(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Count Late arrivals as Present towards attendance rate</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allowCorrections}
                  onChange={(e) => setAllowCorrections(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Allow enrolled students to submit attendance correction appeals</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 shadow-xs"
            >
              <Save className="h-4 w-4" />
              Save Configurations
            </button>
          </div>
        </div>
      </form>

      {/* Dangerous Operations Zone */}
      <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-700">
          <ShieldAlert className="h-5 w-5" />
          <h2 className="text-sm font-bold">Demonstration Database Reset</h2>
        </div>
        <p className="text-xs text-slate-600">
          Reset all system records (users, courses, enrolments, attendance history) back to the pristine demonstration state defined in Section 20.
        </p>
        <button
          onClick={() => setShowResetModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 shadow-2xs"
        >
          <RotateCcw className="h-4 w-4" />
          Restore Demonstration Dataset
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirm Demonstration Reset"
        subtitle="This action will restore all tables to their seed state"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            Are you sure you want to restore the demonstration database? All newly registered users, courses, and attendance records created since initialization will be reset to the original sample dataset.
          </p>
          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              onClick={() => setShowResetModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="px-4 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
            >
              {resetting ? 'Resetting...' : 'Yes, Reset to Seed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
