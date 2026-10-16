import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/auth/LoginPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { CourseManagement } from './pages/admin/CourseManagement';
import { InstitutionalReports } from './pages/admin/InstitutionalReports';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SystemEvaluationPage } from './pages/admin/SystemEvaluationPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Lecturer Pages
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { RecordAttendancePage } from './pages/lecturer/RecordAttendancePage';
import { LecturerHistoryPage } from './pages/lecturer/LecturerHistoryPage';
import { LecturerReportsPage } from './pages/lecturer/LecturerReportsPage';
import { CorrectionReviewsPage } from './pages/lecturer/CorrectionReviewsPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage';
import { StudentCorrectionsPage } from './pages/student/StudentCorrectionsPage';

// Shared
import { ProfilePage } from './pages/shared/ProfilePage';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Initializing EduTrack Cloud...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Render content based on active tab & role
  const renderContent = () => {
    // Shared tabs
    if (activeTab === 'profile') return <ProfilePage />;

    // Role-specific routing
    if (user.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard setActiveTab={setActiveTab} />;
        case 'users':
          return <UserManagement />;
        case 'courses':
          return <CourseManagement />;
        case 'attendance-history':
          return <LecturerHistoryPage />;
        case 'reports':
          return <InstitutionalReports />;
        case 'audit-logs':
          return <AuditLogsPage />;
        case 'evaluation':
          return <SystemEvaluationPage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <AdminDashboard setActiveTab={setActiveTab} />;
      }
    }

    if (user.role === 'lecturer') {
      switch (activeTab) {
        case 'dashboard':
          return <LecturerDashboard setActiveTab={setActiveTab} />;
        case 'record-attendance':
          return <RecordAttendancePage setActiveTab={setActiveTab} />;
        case 'my-courses':
          return <CourseManagement />;
        case 'attendance-history':
          return <LecturerHistoryPage />;
        case 'course-reports':
          return <LecturerReportsPage />;
        case 'corrections':
          return <CorrectionReviewsPage />;
        default:
          return <LecturerDashboard setActiveTab={setActiveTab} />;
      }
    }

    if (user.role === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard setActiveTab={setActiveTab} />;
        case 'my-attendance':
          return <StudentAttendancePage />;
        case 'student-courses':
          return <StudentCoursesPage />;
        case 'student-corrections':
          return <StudentCorrectionsPage />;
        default:
          return <StudentDashboard setActiveTab={setActiveTab} />;
      }
    }

    return <div className="p-8 text-center text-slate-500">Select a navigation tab</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
