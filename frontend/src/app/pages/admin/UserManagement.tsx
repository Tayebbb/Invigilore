import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  LayoutDashboard,
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  FileText,
  Power,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';

import DashboardLayout         from '../../components/layout/DashboardLayout.tsx';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import useCurrentUser          from '../../hooks/useCurrentUser';
import useDebouncedValue       from '../../hooks/useDebouncedValue';
import { clearApiCache }       from '../../api';
import { extractApiError }     from '../../utils/apiHelpers';
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  setAdminUserStatus,
  type AdminRole,
  type AdminUser,
  type UserSortDirection,
  type UserSortField,
  type UserStatusFilter,
} from './userManagementApi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToastState {
  msg: string;
  type: 'success' | 'error';
}

interface PendingStatusChange {
  user: AdminUser;
  nextIsActive: boolean;
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

const ROLE_OPTIONS: AdminRole[] = [
  'admin',
  'teacher',
  'student',
  'controller',
  'moderator',
  'question_setter',
  'invigilator',
];

const STATUS_OPTIONS: Array<{ value: UserStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
];

const SORT_OPTIONS: Array<{ value: `${UserSortField}:${UserSortDirection}`; label: string }> = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
];

const roleColors: Record<string, string> = {
  teacher: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  student: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  admin: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
};

// ── Create User Modal ─────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'teacher' as AdminRole });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const validationError = useMemo(() => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) return 'Name is required.';
    if (trimmedName.length < 2) return 'Name must be at least 2 characters.';
    if (!trimmedEmail) return 'Email is required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return 'Enter a valid email address.';

    if (!form.password) return 'Password is required.';
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPassword.test(form.password)) {
      return 'Password must be 8+ chars with uppercase, lowercase, and a number.';
    }

    return null;
  }, [form.email, form.name, form.password]);

  function normalizeError(err: unknown): string {
    const extracted = extractApiError(err);
    if (typeof extracted === 'string') return extracted;
    if (Array.isArray(extracted)) return extracted.join(', ');
    if (extracted && typeof extracted === 'object') {
      return Object.values(extracted as Record<string, unknown>)
        .flatMap(value => (Array.isArray(value) ? value : [value]))
        .map(value => String(value))
        .join(', ');
    }
    return 'Something went wrong.';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createAdminUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      onClose();
      onCreated();
    } catch (err: any) {
      setError(normalizeError(err));
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
                placeholder="8+ chars, Aa + 1"
                className="w-full pl-9 pr-4 py-2.5 text-sm"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Use at least one uppercase letter, one lowercase letter, and one number.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <Select
              value={form.role}
              onValueChange={value => setForm(f => ({ ...f, role: value as AdminRole }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r} value={r}>
                    {r.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {validationError && !error && (
            <p className="text-xs text-amber-300">{validationError}</p>
          )}

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
              disabled={loading || Boolean(validationError)}
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
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PendingStatusChange | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [toast,      setToast]      = useState<ToastState | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<UserStatusFilter>('all');
  const [sortBy, setSortBy] = useState<UserSortField>('created_at');
  const [sortDir, setSortDir] = useState<UserSortDirection>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

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

  function normalizeError(err: unknown): string {
    const extracted = extractApiError(err);
    if (typeof extracted === 'string') return extracted;
    if (Array.isArray(extracted)) return extracted.join(', ');
    if (extracted && typeof extracted === 'object') {
      return Object.values(extracted as Record<string, unknown>)
        .flatMap(value => (Array.isArray(value) ? value : [value]))
        .map(value => String(value))
        .join(', ');
    }
    return 'Something went wrong.';
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { users: listedUsers, meta } = await listAdminUsers({
        page,
        perPage,
        search: debouncedSearch,
        role: selectedRole === 'all' ? '' : selectedRole,
        status: selectedStatus,
        sortBy,
        sortDir,
      });

      setUsers(listedUsers);
      setTotal(meta.total);
      setLastPage(Math.max(1, meta.last_page));
    } catch (err: any) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, perPage, selectedRole, selectedStatus, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage, selectedRole, selectedStatus, sortBy, sortDir]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(user: AdminUser) {
    setDeleting(user.id);
    try {
      await deleteAdminUser(user.id);
      clearApiCache();

      if (users.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        await fetchUsers();
      }

      showToast(`${user.name} deleted.`, 'success');
    } catch (err: any) {
      showToast(normalizeError(err), 'error');
    } finally {
      setDeleting(null);
      setPendingDelete(null);
    }
  }

  async function handleConfirmStatusChange() {
    if (!pendingStatus) return;

    setStatusUpdating(pendingStatus.user.id);
    try {
      const updated = await setAdminUserStatus(pendingStatus.user.id, pendingStatus.nextIsActive);
      setUsers(prev => prev.map(user => (user.id === updated.id ? updated : user)));
      clearApiCache();
      showToast(
        `${pendingStatus.user.name} ${pendingStatus.nextIsActive ? 'activated' : 'deactivated'}.`,
        'success',
      );
    } catch (err: any) {
      showToast(normalizeError(err), 'error');
    } finally {
      setStatusUpdating(null);
      setPendingStatus(null);
    }
  }

  function toggleSortByName() {
    if (sortBy === 'name') {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy('name');
    setSortDir('asc');
  }

  function toggleSortByDate() {
    if (sortBy === 'created_at') {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy('created_at');
    setSortDir('desc');
  }

  function getSortIcon(field: UserSortField) {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(lastPage, start + 4);

    for (let p = start; p <= end; p += 1) {
      pages.push(p);
    }

    return pages;
  }, [lastPage, page]);

  const totalLabel = `${Math.min((page - 1) * perPage + 1, total)}-${Math.min(page * perPage, total)} of ${total}`;

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
          <div className="px-6 py-4 border-b border-border grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
              />
            </div>

            <div className="lg:col-span-2">
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as UserStatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((statusOption) => (
                    <SelectItem key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLE_OPTIONS.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select
                value={`${sortBy}:${sortDir}`}
                onValueChange={(value) => {
                  const [nextSortBy, nextSortDir] = value.split(':') as [UserSortField, UserSortDirection];
                  setSortBy(nextSortBy);
                  setSortDir(nextSortDir);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(sortOption => (
                    <SelectItem key={sortOption.value} value={sortOption.value}>
                      {sortOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-1 flex lg:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSelectedStatus('all');
                  setSelectedRole('all');
                  setSortBy('created_at');
                  setSortDir('desc');
                  setPage(1);
                }}
                className="w-full lg:w-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Table header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              All Users
              {!loading && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({total} total)
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
                    <th className="text-left px-6 py-3 font-medium">
                      <button
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                        onClick={toggleSortByName}
                      >
                        Name {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Role</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">
                      <button
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                        onClick={toggleSortByDate}
                      >
                        Created {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right">Actions</th>
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
                          {user.role.replaceAll('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <div className="inline-flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
                            <Switch
                              checked={user.is_active}
                              disabled={statusUpdating === user.id}
                              onCheckedChange={() => setPendingStatus({ user, nextIsActive: !user.is_active })}
                              aria-label={`Toggle status for ${user.name}`}
                            />
                            {statusUpdating === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : (
                              <Power className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingDelete(user)}
                            disabled={deleting === user.id}
                            className="text-red-300 border-red-500/30 hover:bg-red-500/10"
                          >
                            {deleting === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="px-6 py-4 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Showing {totalLabel}
                </span>

                <div className="flex items-center gap-2">
                  <span>Rows</span>
                  <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                    <SelectTrigger className="w-[82px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page <= 1}>
                  Prev
                </Button>

                {pageNumbers.map(pageNumber => (
                  <Button
                    key={pageNumber}
                    size="sm"
                    variant={pageNumber === page ? 'default' : 'outline'}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}

                <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.min(lastPage, prev + 1))} disabled={page >= lastPage}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </DashboardLayout>

      {/* ── Create user modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreateUserModal
            onClose={() => setShowCreate(false)}
            onCreated={async () => {
              clearApiCache();
              setPage(1);
              await fetchUsers();
              showToast('User created successfully.', 'success');
            }}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={Boolean(pendingStatus)} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus?.nextIsActive ? 'Activate user?' : 'Deactivate user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus
                ? `Are you sure you want to ${pendingStatus.nextIsActive ? 'activate' : 'deactivate'} ${pendingStatus.user.name}?`
                : 'Confirm status change.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusUpdating !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>
              {statusUpdating !== null ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This will permanently delete ${pendingDelete.name}. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              {deleting !== null ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
