import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import {
  Menu,
  GraduationCap,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  setActiveTab,
}) => {
  const { user, logout, quickLogin } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleQuickSwitch = async (
    key: 'admin' | 'dr_okonkwo' | 'prof_adeyemi' | 'ibrahim_musa' | 'ngozi_eze'
  ) => {
    setShowDemoMenu(false);
    await quickLogin(key);
    setActiveTab('dashboard');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                EduTrack Cloud
              </span>
              <span className="hidden sm:inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                2025/2026 First Sem
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">
              Attendance Management System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDemoMenu(!showDemoMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
            title="Switch demo role instantly"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Switch Role</span>
            <ChevronDown className="h-3 w-3 text-indigo-500" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-700">Quick Switch Demo Accounts</p>
                <p className="text-[11px] text-slate-400">Simulate different institutional roles</p>
              </div>
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => handleQuickSwitch('admin')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.role === 'admin' ? 'bg-purple-50 font-semibold text-purple-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">Administrator</p>
                    <p className="text-[10px] text-slate-500">Dr. Balogun (Full Access)</p>
                  </div>
                  <Badge variant="admin" size="sm">Admin</Badge>
                </button>

                <button
                  onClick={() => handleQuickSwitch('dr_okonkwo')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.username === 'dr_okonkwo' ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">Dr. C. Okonkwo</p>
                    <p className="text-[10px] text-slate-500">Lecturer (CSC 401 & 303)</p>
                  </div>
                  <Badge variant="lecturer" size="sm">Lecturer</Badge>
                </button>

                <button
                  onClick={() => handleQuickSwitch('prof_adeyemi')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.username === 'prof_adeyemi' ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">Prof. F. Adeyemi</p>
                    <p className="text-[10px] text-slate-500">Lecturer (SEN 405)</p>
                  </div>
                  <Badge variant="lecturer" size="sm">Lecturer</Badge>
                </button>

                <button
                  onClick={() => handleQuickSwitch('ibrahim_musa')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.username === 'ibrahim_musa' ? 'bg-cyan-50 font-semibold text-cyan-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">Ibrahim Musa</p>
                    <p className="text-[10px] text-slate-500">Student (SCI/2022/1001)</p>
                  </div>
                  <Badge variant="student" size="sm">Student</Badge>
                </button>

                <button
                  onClick={() => handleQuickSwitch('ngozi_eze')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.username === 'ngozi_eze' ? 'bg-cyan-50 font-semibold text-cyan-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">Ngozi Eze</p>
                    <p className="text-[10px] text-slate-500">Student (SCI/2022/1002)</p>
                  </div>
                  <Badge variant="student" size="sm">Student</Badge>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowDemoMenu(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
                {user.full_name.charAt(0)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                  {user.full_name}
                </p>
                <div className="flex items-center gap-1">
                  <Badge status={user.role} size="sm" />
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{user.department}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  My Profile & Password
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
