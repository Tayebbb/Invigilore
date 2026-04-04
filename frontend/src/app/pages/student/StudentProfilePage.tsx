import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Calendar, Clock, Save, Settings, Trophy, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import api from '../../api';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: Calendar },
  { label: 'My Results', icon: Trophy },
  { label: 'Submission History', icon: Clock },
  { label: 'Profile', icon: User },
  { label: 'Account Settings', icon: Settings },
  { label: 'Help & Support', icon: Bell },
];

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function load() {
      const response = await api.get('/me');
      const user = response.data;
      setName(user?.name ?? '');
      setEmail(user?.email ?? '');
      setRole(user?.role?.name ?? 'student');
    }

    load().catch(() => setStatus('Unable to load profile'));
  }, []);

  const handleNav = (label: string) => {
    if (label === 'Dashboard') navigate('/student/dashboard');
    if (label === 'My Results') navigate('/student/results');
    if (label === 'Submission History') navigate('/student/submissions');
    if (label === 'Profile') navigate('/student/profile');
    if (label === 'Account Settings') navigate('/student/account-settings');
    if (label === 'Help & Support') navigate('/student/help-support');
  };

  const canSave = useMemo(() => name.trim().length >= 2, [name]);

  const save = async () => {
    setStatus('');
    try {
      await api.put('/me', {
        name: name.trim(),
        ...(password ? { password } : {}),
      });
      setPassword('');
      setStatus('Profile updated successfully');
    } catch {
      setStatus('Profile update failed');
    }
  };

  const notifications = [
    {
      id: 'account-security',
      title: 'Account Security',
      message: 'Use a strong password and avoid shared devices for exams.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={NAV_ITEMS}
      activeItem="Profile"
      onNavChange={handleNav}
      user={{ name: name || 'Student', email: email || 'student@invigilore.com', initial: 'S', role: 'Student' }}
      notifications={notifications}
      pageTitle="My Profile"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-5 text-xl font-semibold text-white">Student Profile</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-gray-400">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-400">Email</span>
            <input value={email} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-400">Role</span>
            <input value={role} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-400">New Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-400">Restricted fields like role remain immutable.</p>
          <button
            type="button"
            disabled={!canSave}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>

        {status && <p className="mt-3 text-sm text-gray-300">{status}</p>}
      </div>
    </DashboardLayout>
  );
}
