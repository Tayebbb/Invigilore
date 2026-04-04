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
  ShieldAlert,
  FileText,
} from 'lucide-react';

import DashboardLayout         from '../../components/layout/DashboardLayout.tsx';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import useCurrentUser          from '../../hooks/useCurrentUser';
import api                     from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';

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
  // { label: 'Role Assignment',   icon: UserPlus      }, // Add if role assignment UI exists
  { label: 'System Settings',    icon: Settings        },
  { label: 'Security Policies',  icon: ShieldAlert     },
  { label: 'System Backups',     icon: FileText        },
  { label: 'Audit Logs',         icon: BarChart3       },
  { label: 'System Incidents',   icon: AlertCircle     },
];

const ROLE_OPTIONS = ['teacher', 'student', 'admin'] as const;
type RoleOption = typeof ROLE_OPTIONS[number];

const roleColors: Record<string, string> = {
  teacher: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  student: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  admin: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
};

// ── Create User Modal ─────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (user: ApiUser) => void;
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'teacher' as RoleOption });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post<ApiUser>('/admin/users', form);
      const user = extractApiData(response);
      if (!user) throw new Error('No user returned from API.');
      onCreated(user);
      onClose();
    } catch (err: any) {
      setError(extractApiError(err));
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
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 p-6 mx-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Create New User</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Create user failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                minLength={2}
                placeholder="Dr. Jane Smith"
                className="w-full pl-9 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="jane@university.edu"
                className="w-full pl-9 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full pl-9 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as RoleOption }))}
                className="w-full px-3 py-2.5 bg-input-background border border-input rounded-lg text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all cursor-pointer"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 py-2.5 h-auto text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 h-auto text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="w-4 h-4" /> Create User</>
              )}
            </Button>
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
    role:    'System Administrator' as const,
  };

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiUser[]>('/admin/users');
      const users = extractApiData(response);
      setUsers(Array.isArray(users) ? users : []);
    } catch (err: any) {
      setError(extractApiError(err));
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
      showToast(extractApiError(err), 'error');
    } finally {
      setDeleting(null);
    }
  }

  function handleNavChange(label: string) {
    if (label === 'Dashboard Overview') { navigate('/admin/dashboard'); return; }
    // Add navigation for other allowed features as implemented
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
            <h2 className="text-2xl font-bold text-foreground mb-1">User Management</h2>
            <p className="text-muted-foreground text-sm">
              Create and manage teacher, student, and admin accounts.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 h-auto font-semibold text-sm whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            New User
          </Button>
        </motion.div>

        {/* ── Table card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Table header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              All Users
              {!loading && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({users.length} total)
                </span>
              )}
            </p>
            <button
              onClick={fetchUsers}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-accent text-sm text-foreground cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No users yet. Create the first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Role</th>
                    <th className="text-left px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-accent/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                            {user.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${roleColors[user.role] ?? 'bg-muted text-muted-foreground'}`} variant="secondary">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
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
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'}`}
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
