import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  FilePlus,
  BarChart3,
  Bell,
  GraduationCap,
  Activity,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import api from '../../api';

import DashboardLayout             from '../../components/layout/DashboardLayout';
import DashboardCard               from '../../components/dashboard/DashboardCard';
import type { SidebarNavItem }     from '../../components/layout/DashboardSidebar';

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard',       icon: LayoutDashboard },
  { label: 'My Exams',        icon: BookOpen        },
  { label: 'Question Bank',   icon: FileText        },
  { label: 'Create Exam',     icon: FilePlus        },
  { label: 'Student Results', icon: BarChart3       },
  { label: 'Notifications',   icon: Bell, badge: '2' },
];

// ── Placeholder data ──────────────────────────────────────────────────────────

const KPI_CARDS = [
  { icon: FileText,      title: 'Exams Created',         value: '24', subtitle: '+3 this month',    color: 'blue'    },
  { icon: GraduationCap, title: 'Students Enrolled',     value: '320',subtitle: '+18 this week',    color: 'emerald' },
  { icon: Activity,      title: 'Active Exams Running',  value: '3',  subtitle: '2 ending today',   color: 'amber'   },
  { icon: BarChart3,     title: 'Average Student Score', value: '78%',subtitle: '+2.4% vs last month', color: 'purple' },
] as const;

const ASSIGNED_EXAMS = [
  { name: 'Midterm Physics',    subject: 'Physics',     students: 120, date: 'Mar 12', status: 'Active'    },
  { name: 'Math Quiz #3',       subject: 'Mathematics', students: 85,  date: 'Mar 15', status: 'Scheduled' },
  { name: 'Biology Finals',     subject: 'Biology',     students: 200, date: 'Mar 8',  status: 'Completed' },
  { name: 'Chemistry Lab Test', subject: 'Chemistry',   students: 45,  date: 'Mar 20', status: 'Draft'     },
];

const statusConfig: Record<string, string> = {
  Active:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  Scheduled: 'bg-blue-500/10   text-blue-400   border border-blue-500/25',
  Completed: 'bg-gray-500/10   text-gray-400   border border-gray-500/25',
  Draft:     'bg-amber-500/10  text-amber-400  border border-amber-500/25',
};

const UPCOMING = [
  { name: 'Physics Midterm',   time: 'Tomorrow, 10:00 AM', dot: 'bg-blue-400'    },
  { name: 'Math Quiz',         time: 'Friday, 2:00 PM',    dot: 'bg-violet-400'  },
  { name: 'Biology Practical', time: 'Mon, 9:00 AM',       dot: 'bg-emerald-400' },
];

// ── Placeholder user (replace with auth context) ──────────────────────────────
const TEACHER_USER = {
  name:    'Prof. Jane',
  email:   'jane@invigilore.com',
  initial: 'J',
  role:    'Teacher' as const,
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * TeacherDashboardNew — /teacher/dashboard
 *
 * Placeholder dashboard for the Teacher role built on the shared DashboardLayout.
 * TODO: replace static data with real API calls from Laravel backend.
 */
export default function TeacherDashboardNew() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/questions')
      .then(res => setQuestions(res.data))
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      onNavChange={setActiveItem}
      user={TEACHER_USER}
      notificationCount={2}
      pageTitle="Teacher Dashboard"
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
            Welcome back, Prof. Jane 👋
          </h2>
          <p className="text-gray-400 text-sm">
            Create exams, manage students, and monitor results in real time.
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500
                     text-white rounded-xl font-semibold text-sm transition-all duration-200
                     shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40
                     cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap flex-shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          Create New Exam
        </button>
      </motion.div>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((card, i) => (
          <DashboardCard key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Assigned Exams table — 2 cols */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Assigned Exams</h3>
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left px-6 py-3 font-medium">Exam Name</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Students</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ASSIGNED_EXAMS.map((exam) => (
                  <tr
                    key={exam.name}
                    className="border-b border-gray-800 last:border-0
                               hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-gray-200 font-medium">{exam.name}</td>
                    <td className="px-4 py-3.5 text-gray-400">{exam.subject}</td>
                    <td className="px-4 py-3.5 text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {exam.students}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">{exam.date}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full
                                    ${statusConfig[exam.status] ?? ''}`}
                      >
                        {exam.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Upcoming Exams */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Upcoming Exams</h3>
            <div className="space-y-3">
              {UPCOMING.map((item) => (
                <div key={item.name} className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                  <div>
                    <p className="text-sm text-gray-300 font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Quick Create Exam placeholder */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3">Quick Create Exam</h3>
            <p className="text-xs text-gray-500 mb-4">
              {/* Placeholder */}
              Start a new exam in under 2 minutes using templates or the question bank.
            </p>

            <div className="space-y-2">
              {[
                { label: 'Use Question Bank',   icon: BookOpen  },
                { label: 'Upload Document',     icon: FileText  },
                { label: 'Blank Exam',          icon: FilePlus  },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                             text-sm text-gray-400 hover:text-white hover:bg-gray-800
                             transition-all cursor-pointer text-left"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Student Submissions placeholder */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.42 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Student Submissions</h3>
            <div className="space-y-3">
              {[
                { label: 'Pending Review',  value: '14', color: 'text-amber-400'   },
                { label: 'Auto-graded',     value: '89', color: 'text-emerald-400' },
                { label: 'Flagged',         value: '2',  color: 'text-rose-400'    },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Question Bank */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Question Bank</h3>
            {loading && <div>Loading questions...</div>}
            {error && <div>{error}</div>}
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id}>
                    <td>{q.text}</td>
                    <td>{q.type}</td>
                    <td>
                      {/* Add edit/delete buttons here */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Add create question form/modal here */}
          </motion.section>
        </div>
      </div>

    </DashboardLayout>
  );
}

type Question = {
  id: number;
  text: string;
  type: string;
};

function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  // ...existing code...
}
