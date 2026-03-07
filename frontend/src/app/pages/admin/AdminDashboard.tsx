import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
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
import { getStoredUser }           from '../../auth/ProtectedRoute';

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard Overview', icon: LayoutDashboard },
  { label: 'User Management',    icon: Users           },
  { label: 'Exam Management',    icon: ClipboardList   },
  { label: 'Question Bank',      icon: BookOpen        },
  { label: 'System Monitoring',  icon: Activity        },
  { label: 'Reports & Analytics',icon: BarChart3       },
  { label: 'Settings',           icon: Settings        },
];

// ── Placeholder data ──────────────────────────────────────────────────────────

const KPI_CARDS = [
  { icon: GraduationCap, title: 'Total Students',  value: '1 240', subtitle: '+32 this week',  color: 'blue'    },
  { icon: Users,         title: 'Total Teachers',  value: '86',    subtitle: '+4 this month',  color: 'emerald' },
  { icon: Activity,      title: 'Active Exams',    value: '12',    subtitle: '3 ending today', color: 'amber'   },
  { icon: Clock,         title: 'Upcoming Exams',  value: '28',    subtitle: 'Next 7 days',    color: 'purple'  },
] as const;

const RECENT_ACTIVITY = [
  { text: 'New teacher account created — Dr. Amara Wells',     time: '2 min ago',  dot: 'bg-blue-400'    },
  { text: 'Exam "Chemistry Midterm" published',                time: '14 min ago', dot: 'bg-emerald-400' },
  { text: 'Student account flagged for suspicious activity',   time: '1 hr ago',   dot: 'bg-rose-400'    },
  { text: '42 students enrolled in "Advanced Physics"',        time: '3 hr ago',   dot: 'bg-purple-400'  },
  { text: 'System backup completed successfully',              time: 'Yesterday',  dot: 'bg-gray-500'    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Dashboard Overview');

  const storedUser = getStoredUser();
  const adminUser = {
    name:    storedUser?.name    ?? 'Admin',
    email:   storedUser?.email   ?? '',
    initial: (storedUser?.name?.[0] ?? 'A').toUpperCase(),
    role:    'Admin' as const,
  };

  function handleNavChange(label: string) {
    if (label === 'User Management') {
      navigate('/admin/users');
      return;
    }
    setActiveItem(label);
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

      {/* ── Welcome banner ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back, Admin 👋
          </h2>
          <p className="text-gray-400 text-sm">
            Manage users, monitor exams, and review system health from one place.
          </p>
        </div>

        {/* Quick action */}
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

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((card, i) => (
          <DashboardCard key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* ── Two-column content area ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Activity — 2 cols */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
              View all
            </button>
          </div>

          <div className="space-y-4">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-300 leading-snug">{item.text}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* System Monitoring placeholder — 1 col */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col"
        >
          <h3 className="text-sm font-semibold text-white mb-5">System Monitoring</h3>

          {/* Placeholder status rows */}
          {[
            { label: 'API Server',      status: 'Operational', color: 'text-emerald-400' },
            { label: 'Database',        status: 'Operational', color: 'text-emerald-400' },
            { label: 'Storage',         status: 'Operational', color: 'text-emerald-400' },
            { label: 'Email Service',   status: 'Degraded',    color: 'text-amber-400'   },
            { label: 'Exam AI Engine',  status: 'Offline',     color: 'text-rose-400'    },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0"
            >
              <span className="text-sm text-gray-400">{row.label}</span>
              <span className={`text-xs font-semibold ${row.color}`}>{row.status}</span>
            </div>
          ))}

          {/* Placeholder CTA */}
          <button
            className="mt-5 text-xs text-gray-500 hover:text-gray-300 transition-colors
                       text-center cursor-pointer"
          >
            View full system report →
          </button>
        </motion.section>
      </div>

      {/* ── Reports & User Management placeholders ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">

        {/* User Management placeholder */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.34 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">User Management</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {/* Placeholder description */}
            Create, edit, and deactivate student and teacher accounts.
            Assign roles and manage institutional access.
          </p>
          <button
            className="text-xs font-medium text-blue-400 hover:text-blue-300
                       transition-colors cursor-pointer flex items-center gap-1"
          >
            Manage users <span aria-hidden>→</span>
          </button>
        </motion.section>

        {/* Reports placeholder */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Reports &amp; Analytics</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {/* Placeholder description */}
            View institution-wide exam performance, pass rates,
            and engagement analytics across all departments.
          </p>
          <button
            className="text-xs font-medium text-purple-400 hover:text-purple-300
                       transition-colors cursor-pointer flex items-center gap-1"
          >
            View reports <span aria-hidden>→</span>
          </button>
        </motion.section>
      </div>

    </DashboardLayout>
  );
}
