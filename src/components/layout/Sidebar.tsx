import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Settings,
  History,
  CheckSquare,
  UserCheck,
  FolderKanban,
  FileSpreadsheet,
  FlaskConical,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  // Nav configurations based on role
  const adminNav = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'attendance-history', label: 'Attendance Registers', icon: ClipboardCheck },
    { id: 'reports', label: 'Institutional Reports', icon: FileSpreadsheet },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
    { id: 'evaluation', label: 'System Evaluation & Tests', icon: FlaskConical },
    { id: 'settings', label: 'Institutional Settings', icon: Settings },
  ];

  const lecturerNav = [
    { id: 'dashboard', label: 'Lecturer Dashboard', icon: LayoutDashboard },
    { id: 'record-attendance', label: 'Record Attendance', icon: ClipboardCheck },
    { id: 'my-courses', label: 'My Assigned Courses', icon: BookOpen },
    { id: 'attendance-history', label: 'Attendance History', icon: History },
    { id: 'course-reports', label: 'Course Reports', icon: FileText },
    { id: 'corrections', label: 'Correction Requests', icon: CheckSquare },
  ];

  const studentNav = [
    { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'my-attendance', label: 'My Attendance', icon: UserCheck },
    { id: 'student-courses', label: 'Registered Courses', icon: FolderKanban },
    { id: 'student-corrections', label: 'Correction Requests', icon: CheckSquare },
  ];

  const navItems =
    user.role === 'admin'
      ? adminNav
      : user.role === 'lecturer'
      ? lecturerNav
      : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-900">Navigation</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {user.role} Portal
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-semibold shadow-2xs border border-blue-200/60'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-blue-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Institutional footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="rounded-lg bg-white p-3 border border-slate-200/70 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-800 truncate">
              {user.department}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {user.matric_no ? `ID: ${user.matric_no}` : user.email}
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Status: <strong className="text-emerald-600">Active</strong></span>
              <span className="text-blue-600 font-medium">Cloud v1.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
