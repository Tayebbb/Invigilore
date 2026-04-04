import { useState, useEffect } from 'react';
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
import api from '../../api';

import DashboardLayout             from '../../components/layout/DashboardLayout';
import DashboardCard               from '../../components/dashboard/DashboardCard';
import type { SidebarNavItem }     from '../../components/layout/DashboardSidebar';
import useCurrentUser              from '../../hooks/useCurrentUser';

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

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * StudentDashboard — /student/dashboard
 *
 * Placeholder dashboard for the Student role built on the shared DashboardLayout.
 * TODO: replace static data with real API calls from Laravel backend.
 */
export default function StudentDashboard() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const currentUser = useCurrentUser();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const studentUser = {
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Student' as const,
  };

  useEffect(() => {
    setLoading(true);
    api.get('/exams')
      .then(res => setExams(res.data))
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
    api.get('/results')
      .then(res => setResults(res.data))
      .catch(() => setError('Failed to load results'));
  }, []);

  return (
    <DashboardLayout
      role="Student"
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      onNavChange={setActiveItem}
      user={studentUser}
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
            Welcome back, {currentUser.firstName} 👋
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

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {warnings.map((warning) => (
        <div key={warning} className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertCircle className="h-4 w-4" />
          {warning}
        </div>
      ))}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-44 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
            ))}
          </div>
        </div>
      ) : !hasAnyAccessData ? (
        <EmptyAccessState />
      ) : (
        <div className="space-y-8">
          {subjects.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-300" />
                <h3 className="text-sm font-semibold text-gray-200">Available Subjects</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject) => (
                  <SubjectCard key={`${subject.id}-${subject.subjectCode}`} subject={subject} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-200">Upcoming Exams</h3>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No upcoming exams scheduled.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} onEnter={enterExam} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-200">Ongoing Exams</h3>
            {ongoing.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No ongoing exams right now.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ongoing.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} onEnter={enterExam} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-200">Completed Exams</h3>
            {completed.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No completed exams yet.</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/60 text-xs text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Exam</th>
                      <th className="px-4 py-3 text-left">Subject</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map((exam) => (
                      <tr key={exam.id} className="border-t border-gray-800">
                        <td className="px-4 py-3 text-gray-200">{exam.examName}</td>
                        <td className="px-4 py-3 text-gray-400">{exam.courseName}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(exam.startTime).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-300">COMPLETED</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
