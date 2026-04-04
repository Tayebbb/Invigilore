import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import api from '../../api';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  Activity,
  BarChart3,
  Settings,
  GraduationCap,
  FileText,
  Zap,
  Clock,
  AlertCircle,
} from 'lucide-react';

import DashboardLayout             from '../../components/layout/DashboardLayout';
import DashboardCard               from '../../components/dashboard/DashboardCard';
import type { SidebarNavItem }     from '../../components/layout/DashboardSidebar';
import useCurrentUser              from '../../hooks/useCurrentUser';

// ── Sidebar nav ───────────────────────────────────────────────────────────────


const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard Overview', icon: LayoutDashboard },
  { label: 'User Management',    icon: Users           },
  { label: 'System Settings',    icon: Settings        },
  { label: 'Security Policies',  icon: ShieldAlert     },
  { label: 'System Backups',     icon: FileText        },
  { label: 'Audit Logs',         icon: BarChart3       },
  { label: 'System Incidents',   icon: AlertCircle     },
];

// ── Component ─────────────────────────────────────────────────────────────────


export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Dashboard Overview');
  const currentUser = useCurrentUser();

  const adminUser = {
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Admin' as const,
  };

  // Dashboard data state
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalAdmins: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/dashboard')
      .then(res => {
        setStats(res.data.stats);
        setRecentActivity(res.data.recentActivity);
        setSystemHealth(res.data.systemHealth);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  function handleNavChange(label: string) {
    if (label === 'User Management') {
      navigate('/admin/users');
      return;
    }
    if (label === 'System Settings') {
      navigate('/admin/system-settings');
      return;
    }
    if (label === 'Security Policies') {
      navigate('/admin/security-policies');
      return;
    }
    if (label === 'System Backups') {
      navigate('/admin/system-backups');
      return;
    }
    if (label === 'Audit Logs') {
      navigate('/admin/audit-logs');
      return;
    }
    if (label === 'System Incidents') {
      navigate('/admin/system-incidents');
      return;
    }
    setActiveItem(label);
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <DashboardLayout
      role="Admin"
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      onNavChange={handleNavChange}
      user={adminUser}
      notificationCount={3}
      pageTitle="Admin Dashboard"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back, {currentUser.firstName} 👋
          </h2>
          <p className="text-gray-400 text-sm">
            Manage users, roles, system settings, security, backups, audit logs, and incidents from one place.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500
                     text-white rounded-xl font-semibold text-sm transition-all duration-200
                     shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40
                     cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0"
        >
          <Users className="w-4 h-4" />
          Add New User
        </button>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Students" value={stats.totalStudents} subtitle="" icon={GraduationCap} color="blue" />
        <DashboardCard title="Total Teachers" value={stats.totalTeachers} subtitle="" icon={Users} color="emerald" />
        <DashboardCard title="Total Admins" value={stats.totalAdmins} subtitle="" icon={Settings} color="purple" />
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
        <ul className="divide-y divide-gray-800 bg-gray-900 rounded-xl">
          {recentActivity.length === 0 && <li className="p-4 text-gray-500">No recent activity.</li>}
          {recentActivity.map((item: any, idx: number) => (
            <li key={idx} className="p-4 flex items-center justify-between">
              <span>{item.description}</span>
              <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* System Health */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">System Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemHealth.map((service: any, idx: number) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <span className="font-medium text-white w-40">{service.service}</span>
              <span className={
                service.status === 'Operational' ? 'text-green-400' :
                service.status === 'Degraded' ? 'text-yellow-400' :
                'text-red-400'
              }>{service.status}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
