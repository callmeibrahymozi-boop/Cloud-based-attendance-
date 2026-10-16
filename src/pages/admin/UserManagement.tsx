import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { User, UserRole, UserStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('student');
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formMatricNo, setFormMatricNo] = useState('');
  const [formDept, setFormDept] = useState('Computer Science');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');

  // Reset pass form
  const [newTempPassword, setNewTempPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(deptFilter ? { department: deptFilter } : {}),
      });
      const data = await api.get<{
        success: boolean;
        total: number;
        users: User[];
      }>(`/users?${params.toString()}`);
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, deptFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        username: formUsername,
        password: formPassword,
        role: formRole,
        email: formEmail,
        full_name: formFullName,
        matric_no: formMatricNo || undefined,
        department: formDept,
        phone: formPhone || undefined,
        status: formStatus,
      });
      setFeedback({ type: 'success', message: `User "${formUsername}" registered successfully!` });
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.user_id}`, {
        full_name: formFullName,
        email: formEmail,
        role: formRole,
        matric_no: formMatricNo || undefined,
        department: formDept,
        phone: formPhone || undefined,
        status: formStatus,
      });
      setFeedback({ type: 'success', message: `User "${selectedUser.username}" updated successfully!` });
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/users/${user.user_id}/status`, { status: nextStatus });
      setFeedback({
        type: 'success',
        message: `User ${user.username} is now ${nextStatus}.`,
      });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.post(`/users/${selectedUser.user_id}/reset-password`, {
        new_password: newTempPassword,
      });
      setFeedback({
        type: 'success',
        message: `Password reset successfully for ${selectedUser.username}.`,
      });
      setShowResetModal(false);
      setNewTempPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete account "${user.username}"?`)) return;
    try {
      await api.delete(`/users/${user.user_id}`);
      setFeedback({ type: 'success', message: `User ${user.username} deleted.` });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormUsername(user.username);
    setFormFullName(user.full_name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormMatricNo(user.matric_no || '');
    setFormDept(user.department);
    setFormPhone(user.phone || '');
    setFormStatus(user.status);
    setShowEditModal(true);
  };

  const openResetModal = (user: User) => {
    setSelectedUser(user);
    setNewTempPassword('');
    setShowResetModal(true);
  };

  const resetForm = () => {
    setFormUsername('');
    setFormPassword('');
    setFormRole('student');
    setFormEmail('');
    setFormFullName('');
    setFormMatricNo('');
    setFormDept('Computer Science');
    setFormPhone('');
    setFormStatus('active');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500">
            Provision, audit, and manage institutional administrators, lecturers, and students.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          Register New User
        </button>
      </div>

      {/* Feedback Banner */}
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
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="lecturer">Lecturers</option>
            <option value="student">Students</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Matric / Staff ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500">
                        @{u.username} • {u.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {u.matric_no || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{u.department}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.status}>{u.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={`Toggle status to ${u.status === 'active' ? 'inactive' : 'active'}`}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                        >
                          {u.status === 'active' ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => openResetModal(u)}
                          title="Reset Password"
                          className="p-1 text-amber-600 hover:text-amber-800 rounded hover:bg-amber-50"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                            className="p-1 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {users.length} of {total} registered institutional accounts</span>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register Institutional User"
        subtitle="Create an Administrator, Lecturer, or Student account"
      >
        <form onSubmit={handleCreateUser} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Account Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Jane Doe or Chukwudi Obi"
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <input
                type="text"
                required
                placeholder="e.g. jane_doe"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Matric / Staff ID</label>
              <input
                type="text"
                placeholder={formRole === 'student' ? 'e.g. SCI/2022/1045' : 'e.g. STF/CSC/088'}
                value={formMatricNo}
                onChange={(e) => setFormMatricNo(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                placeholder="user@edutrack.edu.ng"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Initial Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Department</label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Phone (Optional)</label>
              <input
                type="text"
                placeholder="+234..."
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              Register User
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit User: ${selectedUser?.username}`}
        subtitle="Modify profile fields and permissions"
      >
        <form onSubmit={handleUpdateUser} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Matric / Staff ID</label>
              <input
                type="text"
                value={formMatricNo}
                onChange={(e) => setFormMatricNo(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Department</label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={`Reset Password for ${selectedUser?.username}`}
        subtitle="Specify a new temporary password for this user"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-600">
            As an institutional administrator, you can set a new password. The user will be required to authenticate with this new password. Plaintext passwords are never revealed.
          </p>
          <div>
            <label className="text-xs font-semibold text-slate-700">New Password (min 6 characters)</label>
            <input
              type="password"
              required
              placeholder="Enter new password"
              value={newTempPassword}
              onChange={(e) => setNewTempPassword(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg mt-1"
            />
          </div>
          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
            >
              Confirm Password Reset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
