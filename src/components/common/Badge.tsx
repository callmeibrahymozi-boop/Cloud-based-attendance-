import React from 'react';
import { AttendanceStatus, ExamStatus, UserRole, UserStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'present' | 'absent' | 'late' | 'eligible' | 'warning' | 'ineligible' | 'active' | 'inactive' | 'admin' | 'lecturer' | 'student' | 'default';
  status?: AttendanceStatus | ExamStatus | UserRole | UserStatus | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, status, size = 'md' }) => {
  let v = variant;

  if (!v && status) {
    const s = String(status).toLowerCase();
    if (s === 'present') v = 'present';
    else if (s === 'absent') v = 'absent';
    else if (s === 'late') v = 'late';
    else if (s === 'eligible') v = 'eligible';
    else if (s === 'warning' || s === 'pending') v = 'warning';
    else if (s === 'ineligible' || s === 'rejected') v = 'ineligible';
    else if (s === 'active' || s === 'approved') v = 'active';
    else if (s === 'inactive') v = 'inactive';
    else if (s === 'admin') v = 'admin';
    else if (s === 'lecturer') v = 'lecturer';
    else if (s === 'student') v = 'student';
    else v = 'default';
  }

  const styles: Record<string, string> = {
    present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    absent: 'bg-rose-50 text-rose-700 border border-rose-200',
    late: 'bg-amber-50 text-amber-700 border border-amber-200',
    eligible: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
    ineligible: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-200',
    admin: 'bg-purple-50 text-purple-700 border border-purple-200 font-medium',
    lecturer: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    student: 'bg-cyan-50 text-cyan-750 border border-cyan-200 font-medium',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md tracking-wide font-medium ${sizeCls} ${
        styles[v || 'default']
      }`}
    >
      {children || status}
    </span>
  );
};
