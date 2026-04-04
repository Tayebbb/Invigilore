import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Mail,
  Lock,
  User,
  ChevronDown,
} from 'lucide-react';

import DashboardLayout         from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser          from '../../hooks/useCurrentUser';
import api                     from '../../api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard Overview', icon: LayoutDashboard },
  { label: 'User Management',    icon: Users           },
  { label: 'Exam Monitoring',    icon: Activity        },
  { label: 'Exam Management',    icon: ClipboardList   },
  { label: 'Question Bank',      icon: BookOpen        },
  { label: 'System Monitoring',  icon: Activity        },
  { label: 'Reports & Analytics',icon: BarChart3       },
  { label: 'Settings',           icon: Settings        },
];

const ROLE_OPTIONS = ['admin', 'teacher', 'student'] as const;
type RoleOption = typeof ROLE_OPTIONS[number];

const roleColors: Record<string, string> = {
  admin:   'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  teacher: 'bg-blue-500/15   text-blue-400   border border-blue-500/30',
  student: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

// ── Create User Modal ─────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (user: ApiUser) => void;
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'student' as RoleOption });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<ApiUser>('/admin/users', form);
      onCreated(data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors as Record<string, string[]>).flat().join(' ')
        : err.response?.data?.message ?? 'Failed to create user.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl
                   shadow-2xl shadow-black/50 p-6 mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Create New User</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500
                       hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                minLength={2}
                placeholder="Dr. Jane Smith"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                           transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="jane@university.edu"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                           transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                           transition-all"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as RoleOption }))}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg
                           text-white text-sm appearance-none
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                           transition-all cursor-pointer"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300
                         text-sm font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white
                         text-sm font-semibold transition-all cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="w-4 h-4" /> Create User</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const navigate  = useNavigate();
  const [users,      setUsers]      = useState<ApiUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const currentUser = useCurrentUser();
  const adminUser = {
    name:    currentUser.name,
    email:   currentUser.email,
    initial: currentUser.initial,
    role:    'Admin' as const,
  };

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<ApiUser[]>('/admin/users');
      setUsers(data);
    } catch {
      setError('Failed to load users. Make sure you are connected to the backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(user: ApiUser) {
    if (!confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
    setDeleting(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast(`${user.name} deleted.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Delete failed.', 'error');
    } finally {
      setDeleting(null);
    }
  }

  function handleNavChange(label: string) {
    if (label === 'Dashboard Overview') { navigate('/admin/dashboard'); return; }
    if (label === 'Exam Monitoring' || label === 'Exam Management' || label === 'System Monitoring') { navigate('/admin/monitoring'); return; }
    // Stay on this page for User Management
  }

  return (
    <>
      <DashboardLayout
        role="Admin"
        navItems={NAV_ITEMS}
        activeItem="User Management"
        onNavChange={handleNavChange}
        user={adminUser}
        notificationCount={0}
        pageTitle="User Management"
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">User Management</h2>
            <p className="text-gray-400 text-sm">
              Create and manage admin, teacher, and student accounts.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500
                       text-white rounded-xl font-semibold text-sm transition-all duration-200
                       shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40
                       cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            New User
          </button>
        </motion.div>

        {/* ── Table card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
        >
          {/* Table header */}
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              All Users
              {!loading && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({users.length} total)
                </span>
              )}
            </p>
            <button
              onClick={fetchUsers}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className="w-8 h-8 text-gray-600" />
              <p className="text-sm text-gray-500">No users yet. Create the first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Role</th>
                    <th className="text-left px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-800/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center
                                         justify-center text-xs font-bold text-white shrink-0">
                            {user.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5
                                         rounded-full capitalize
                                         ${roleColors[user.role] ?? 'bg-gray-700 text-gray-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deleting === user.id}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5
                                     px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20
                                     text-red-400 text-xs font-medium transition-all cursor-pointer
                                     disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {deleting === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </DashboardLayout>

      {/* ── Create user modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreateUserModal
            onClose={() => setShowCreate(false)}
            onCreated={(u) => {
              setUsers(prev => [u, ...prev]);
              showToast(`${u.name} created as ${u.role}.`, 'success');
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3
                        rounded-xl shadow-xl text-sm font-medium border
                        ${toast.type === 'success'
                          ? 'bg-emerald-950 border-emerald-700/50 text-emerald-300'
                          : 'bg-red-950 border-red-700/50 text-red-300'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
