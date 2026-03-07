import { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  Bell,
  User,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react';

import DashboardLayout             from '../../components/layout/DashboardLayout';
import DashboardCard               from '../../components/dashboard/DashboardCard';
import type { SidebarNavItem }     from '../../components/layout/DashboardSidebar';

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard',        icon: LayoutDashboard               },
  { label: 'Available Exams',  icon: ClipboardList                 },
  { label: 'My Results',       icon: TrendingUp                    },
  { label: 'Notifications',    icon: Bell, badge: '1'              },
  { label: 'Profile',          icon: User                          },
];

// ── Placeholder data ──────────────────────────────────────────────────────────

const KPI_CARDS = [
  { icon: ClipboardList, title: 'Upcoming Exams',  value: '3',   subtitle: 'Next 7 days',      color: 'blue'    },
  { icon: CheckCircle,   title: 'Exams Completed', value: '12',  subtitle: 'This semester',     color: 'emerald' },
  { icon: TrendingUp,    title: 'Average Score',   value: '81%', subtitle: '+4% vs last month', color: 'purple'  },
  { icon: Star,          title: 'Best Score',      value: '96%', subtitle: 'Advanced Physics',  color: 'amber'   },
] as const;

const UPCOMING_EXAMS = [
  {
    name:     'Midterm Physics',
    subject:  'Physics',
    datetime: 'Mar 12 — 10:00 AM',
    duration: '90 min',
    dot:      'bg-blue-400',
    status:   'Scheduled',
  },
  {
    name:     'Math Quiz #3',
    subject:  'Mathematics',
    datetime: 'Mar 15 — 2:00 PM',
    duration: '45 min',
    dot:      'bg-violet-400',
    status:   'Scheduled',
  },
  {
    name:     'Biology Practical',
    subject:  'Biology',
    datetime: 'Mar 18 — 9:00 AM',
    duration: '60 min',
    dot:      'bg-emerald-400',
    status:   'Scheduled',
  },
];

const RECENT_RESULTS = [
  { name: 'Chemistry Lab Test', score: '88%', grade: 'A',  color: 'text-emerald-400' },
  { name: 'History Essay',      score: '74%', grade: 'B',  color: 'text-blue-400'    },
  { name: 'English Literature', score: '91%', grade: 'A+', color: 'text-emerald-400' },
  { name: 'Statistics Quiz',    score: '65%', grade: 'C+', color: 'text-amber-400'   },
];

const ACTIVE_NOTIFICATIONS = [
  {
    type:  'exam',
    text:  'Midterm Physics starts in 2 days — make sure you are prepared.',
    time:  '1 hr ago',
    dot:   'bg-blue-400',
  },
  {
    type:  'result',
    text:  'Your Chemistry Lab Test result is now available.',
    time:  '3 hr ago',
    dot:   'bg-emerald-400',
  },
  {
    type:  'alert',
    text:  'Exam window for Math Quiz #3 opens Friday at 1:30 PM.',
    time:  'Yesterday',
    dot:   'bg-amber-400',
  },
];

// ── Placeholder user (replace with auth context) ──────────────────────────────
const STUDENT_USER = {
  name:    'Alex Johnson',
  email:   'alex@invigilore.com',
  initial: 'A',
  role:    'Student' as const,
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * StudentDashboard — /student/dashboard
 *
 * Placeholder dashboard for the Student role built on the shared DashboardLayout.
 * TODO: replace static data with real API calls from Laravel backend.
 */
export default function StudentDashboard() {
  const [activeItem, setActiveItem] = useState('Dashboard');

  return (
    <DashboardLayout
      role="Student"
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      onNavChange={setActiveItem}
      user={STUDENT_USER}
      notificationCount={1}
      pageTitle="Student Dashboard"
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
            Welcome back, Alex 👋
          </h2>
          <p className="text-gray-400 text-sm">
            View your upcoming exams, track results, and stay on top of notifications.
          </p>
        </div>

        {/* Quick action — go to available exams */}
        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500
                     text-white rounded-xl font-semibold text-sm transition-all duration-200
                     shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40
                     cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap flex-shrink-0"
          onClick={() => setActiveItem('Available Exams')}
        >
          <ClipboardList className="w-4 h-4" />
          View Available Exams
        </button>
      </motion.div>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((card, i) => (
          <DashboardCard key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* ── Main three-column content ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Upcoming Exams — 2 cols */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Upcoming Exams</h3>
            <button
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              onClick={() => setActiveItem('Available Exams')}
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {UPCOMING_EXAMS.map((exam) => (
              <div
                key={exam.name}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/40
                           hover:bg-gray-800/80 transition-colors group cursor-default"
              >
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${exam.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium">{exam.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{exam.subject}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{exam.datetime}</p>
                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-500">{exam.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Active Exam Notifications — 1 col */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <span className="text-[10px] font-bold bg-blue-500 text-white
                              px-1.5 py-0.5 rounded-full leading-none">
              {ACTIVE_NOTIFICATIONS.length}
            </span>
          </div>

          <div className="space-y-4">
            {ACTIVE_NOTIFICATIONS.map((n, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                <div>
                  <p className="text-xs text-gray-300 leading-snug">{n.text}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* ── Recent Results ────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Recent Results</h3>
          <button
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            onClick={() => setActiveItem('My Results')}
          >
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">Exam</th>
                <th className="text-left px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_RESULTS.map((result) => (
                <tr
                  key={result.name}
                  className="border-b border-gray-800 last:border-0
                             hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{result.name}</td>
                  <td className="px-4 py-3.5 text-gray-400">{result.score}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-bold ${result.color}`}>{result.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

    </DashboardLayout>
  );
}
