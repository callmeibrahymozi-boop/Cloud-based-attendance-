import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Sparkles,
  UserPlus,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerStudent, quickLogin } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Student registration state
  const [regFullName, setRegFullName] = useState('');
  const [regMatricNo, setRegMatricNo] = useState('');
  const [regDept, setRegDept] = useState('Computer Science');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);

  // Forgot password flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName.trim() || !regMatricNo.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        full_name: regFullName.trim(),
        matric_no: regMatricNo.trim().toUpperCase(),
        department: regDept,
        email: regEmail.trim().toLowerCase(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Student registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    setResetError(null);
    try {
      const data = await api.post<{ success: boolean; message: string; reset_token?: string }>(
        '/auth/forgot-password',
        { identifier: forgotIdentifier }
      );
      setForgotMsg(data.message);
      if (data.reset_token) {
        setGeneratedToken(data.reset_token);
        setResetToken(data.reset_token);
      }
    } catch (err: any) {
      setResetError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    try {
      const data = await api.post<{ success: boolean; message: string }>('/auth/reset-password', {
        token: resetToken,
        new_password: newPassword,
      });
      setResetSuccess(data.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(null);
        setGeneratedToken(null);
      }, 2500);
    } catch (err: any) {
      setResetError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md mb-3">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          EduTrack Cloud
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Attendance Management System for Higher Institutions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200/80 sm:px-10">
          {/* Auth Mode Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              New Student Registration
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN VIEW */}
          {authMode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username, Email, or Matric No.
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. admin or ibrahim_musa"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-blue-700 hover:text-blue-800"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  New student without an account? Register here →
                </button>
              </div>
            </form>
          ) : (
            /* STUDENT REGISTRATION VIEW */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-xs text-blue-900 mb-2">
                <p className="font-semibold flex items-center gap-1.5 text-blue-950">
                  <BookOpen className="h-3.5 w-3.5 text-blue-700" />
                  Student Self-Registration
                </p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Create your institutional student account to register for semester courses and track lecture attendance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Surname First)
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Samuel Olawale Adekunle"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matric / Reg No.
                  </label>
                  <input
                    type="text"
                    required
                    value={regMatricNo}
                    onChange={(e) => setRegMatricNo(e.target.value)}
                    placeholder="e.g. SCI/2025/1105"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. s.adekunle@student.edutrack.edu.ng"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. samuel_adekunle"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg lowercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (min 6)
                  </label>
                  <div className="relative">
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-2 pr-7 border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="absolute right-2 top-2.5 text-slate-400"
                    >
                      {regShowPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg shadow-xs text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>{loading ? 'Registering Account...' : 'Register Account & Proceed'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Already registered? Sign In instead
                </button>
              </div>
            </form>
          )}

          {/* Demonstration Quick Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                One-Click Demonstration Logins:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="p-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-900 text-left transition-colors"
              >
                <div className="font-semibold">Administrator</div>
                <div className="text-[10px] text-purple-700">Dr. Balogun</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('dr_okonkwo')}
                className="p-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-900 text-left transition-colors"
              >
                <div className="font-semibold">Lecturer (CSC)</div>
                <div className="text-[10px] text-blue-700">Dr. Okonkwo</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('prof_adeyemi')}
                className="p-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-900 text-left transition-colors"
              >
                <div className="font-semibold">Lecturer (SEN)</div>
                <div className="text-[10px] text-blue-700">Prof. Adeyemi</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('ibrahim_musa')}
                className="p-2 border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-cyan-900 text-left transition-colors"
              >
                <div className="font-semibold">Student (100%)</div>
                <div className="text-[10px] text-cyan-700">Ibrahim Musa</div>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-center text-slate-400">
              Default password for all demo accounts: <code className="text-slate-600 font-mono">Role@12345</code>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Self-Service Password Reset</h3>
                <p className="text-xs text-slate-500">Reset your institutional access credentials</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {!generatedToken ? (
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Enter your username or email address. A secure token will be generated to authorize the password change.
                    </p>
                    <input
                      type="text"
                      required
                      placeholder="Username or email address"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                    {resetError && <p className="text-xs text-rose-600">{resetError}</p>}
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                    >
                      Generate Reset Token
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    {forgotMsg && (
                      <div className="p-2.5 rounded-lg bg-blue-50 text-blue-800 text-[11px]">
                        {forgotMsg}
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Reset Token</label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="w-full font-mono text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">New Password (min 6 chars)</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    {resetError && <p className="text-xs text-rose-600">{resetError}</p>}
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      Confirm Password Reset
                    </button>
                  </form>
                )}

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setGeneratedToken(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
