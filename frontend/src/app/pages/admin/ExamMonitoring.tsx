import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Clock3,
  LayoutDashboard,
  Monitor,
  Settings,
  ShieldAlert,
  Users,
  ClipboardList,
  BookOpen,
  BarChart3,
} from 'lucide-react';

import api from '../../api';
import DashboardCard from '../../components/dashboard/DashboardCard';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { getStoredUser } from '../../auth/ProtectedRoute';

type MonitorResponse = {
  status?: string;
  details?: string[];
};

type ExamSession = {
  id: number;
  status: string;
  started_at?: string | null;
  created_at?: string;
  exam?: {
    title?: string;
    name?: string;
  };
  user?: {
    name?: string;
  };
};

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard Overview', icon: LayoutDashboard },
  { label: 'User Management', icon: Users },
  { label: 'Exam Monitoring', icon: Monitor },
  { label: 'Exam Management', icon: ClipboardList },
  { label: 'Question Bank', icon: BookOpen },
  { label: 'System Monitoring', icon: Activity },
  { label: 'Reports & Analytics', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

export default function ExamMonitoring() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [monitor, setMonitor] = useState<MonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const storedUser = getStoredUser();
  const adminUser = {
    name: storedUser?.name ?? 'Admin',
    email: storedUser?.email ?? '',
    initial: (storedUser?.name?.[0] ?? 'A').toUpperCase(),
    role: 'Admin' as const,
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [sessionRes, monitorRes] = await Promise.allSettled([
        api.get<ExamSession[]>('/exam_sessions'),
        api.get<MonitorResponse>('/proctoring'),
      ]);

      if (sessionRes.status === 'fulfilled') {
        setSessions(sessionRes.value.data ?? []);
      } else {
        setSessions([]);
      }

      if (monitorRes.status === 'fulfilled') {
        setMonitor(monitorRes.value.data);
      } else {
        setMonitor(null);
      }

      setLoading(false);
    }

    void loadData();
  }, []);

  const liveSessions = useMemo(
    () => sessions.filter((s) => ['active', 'ongoing', 'running', 'in_progress'].includes((s.status ?? '').toLowerCase())),
    [sessions],
  );

  const flaggedCount = useMemo(
    () => sessions.filter((s) => ['flagged', 'suspicious'].includes((s.status ?? '').toLowerCase())).length,
    [sessions],
  );

  const endedToday = useMemo(
    () =>
      sessions.filter((s) => {
        const ts = s.started_at ?? s.created_at;
        if (!ts) return false;
        const day = new Date(ts).toDateString();
        return day === new Date().toDateString();
      }).length,
    [sessions],
  );

  function handleNavChange(label: string) {
    if (label === 'Dashboard Overview') {
      navigate('/admin/dashboard');
      return;
    }
    if (label === 'User Management') {
      navigate('/admin/users');
      return;
    }
  }

  return (
    <DashboardLayout
      role="Admin"
      navItems={NAV_ITEMS}
      activeItem="Exam Monitoring"
      onNavChange={handleNavChange}
      user={adminUser}
      notificationCount={flaggedCount}
      pageTitle="Exam Monitoring"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Exam Monitoring</h2>
          <p className="text-sm text-gray-400">
            Track live exam sessions, suspicious activity, and proctoring health.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <DashboardCard icon={BookOpenCheck} title="Total Sessions" value={String(sessions.length)} subtitle="All recorded sessions" color="blue" index={0} />
        <DashboardCard icon={Activity} title="Live Right Now" value={String(liveSessions.length)} subtitle="Currently active exams" color="emerald" index={1} />
        <DashboardCard icon={ShieldAlert} title="Flagged Sessions" value={String(flaggedCount)} subtitle="Needs review" color="amber" index={2} />
        <DashboardCard icon={Clock3} title="Started Today" value={String(endedToday)} subtitle="Across all exams" color="purple" index={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Live Session Feed</h3>
            <span className="text-xs text-gray-500">{loading ? 'Loading...' : `${sessions.length} sessions`}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left px-6 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {!loading && sessions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No session data available.
                    </td>
                  </tr>
                )}
                {sessions.map((session) => {
                  const examName = session.exam?.title ?? session.exam?.name ?? `Exam #${session.id}`;
                  const studentName = session.user?.name ?? 'Unknown student';
                  const startedAt = session.started_at ?? session.created_at;
                  const status = session.status ?? 'unknown';
                  const lower = status.toLowerCase();

                  const statusClass =
                    lower === 'active' || lower === 'running' || lower === 'ongoing'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : lower === 'flagged' || lower === 'suspicious'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-gray-700 text-gray-200 border border-gray-600';

                  return (
                    <tr key={session.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3.5 text-gray-200 font-medium">{examName}</td>
                      <td className="px-4 py-3.5 text-gray-400">{studentName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{startedAt ? new Date(startedAt).toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Proctoring Health</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-800">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-xs text-emerald-300 font-semibold capitalize">
                {monitor?.status ?? 'unknown'}
              </span>
            </div>

            {(monitor?.details ?? []).slice(0, 4).map((detail) => (
              <div key={detail} className="flex items-start gap-2.5 text-xs text-gray-300">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-400" />
                <span>{detail}</span>
              </div>
            ))}

            {(monitor?.details?.length ?? 0) === 0 && (
              <p className="text-xs text-gray-500">No proctoring alerts reported.</p>
            )}
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
