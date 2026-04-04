import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Bell, Calendar, Clock, PlayCircle, Trophy, User, Settings } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { useStudentExams } from '../../hooks/useStudentExams';
import type { StudentExam } from './studentTypes';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: Calendar },
  { label: 'My Results', icon: Trophy },
  { label: 'Submission History', icon: Clock },
  { label: 'Profile', icon: User },
  { label: 'Account Settings', icon: Settings },
  { label: 'Help & Support', icon: Bell },
];

function computeCountdown(startIso: string): string {
  const diff = new Date(startIso).getTime() - Date.now();

  if (diff <= 0) {
    return 'Starting now';
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function ExamCard({ exam, onEnter }: { exam: StudentExam; onEnter: (examId: number) => void }) {
  const isOngoing = exam.status === 'ongoing';

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{exam.examName}</p>
          <p className="text-xs text-gray-400">{exam.courseName}</p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
            exam.status === 'upcoming'
              ? 'bg-blue-500/20 text-blue-300'
              : exam.status === 'ongoing'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-gray-700/70 text-gray-300'
          }`}
        >
          {exam.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <p>Date: {new Date(exam.startTime).toLocaleDateString()}</p>
        <p>Duration: {exam.durationMinutes} min</p>
        <p>Start: {new Date(exam.startTime).toLocaleTimeString()}</p>
        <p>End: {new Date(exam.endTime).toLocaleTimeString()}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-teal-300">
          {exam.status === 'upcoming' ? `Starts in ${computeCountdown(exam.startTime)}` : 'Exam window active'}
        </p>
        <button
          type="button"
          disabled={!isOngoing}
          onClick={() => onEnter(exam.id)}
          className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          Enter Exam
        </button>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { upcoming, ongoing, completed, loading, error } = useStudentExams();

  const allUpcoming = useMemo(() => [...upcoming, ...ongoing], [upcoming, ongoing]);

  const handleNav = (label: string) => {
    if (label === 'Dashboard') navigate('/student/dashboard');
    if (label === 'My Results') navigate('/student/results');
    if (label === 'Submission History') navigate('/student/submissions');
    if (label === 'Profile') navigate('/student/profile');
      if (label === 'Account Settings') navigate('/student/account-settings');
      if (label === 'Help & Support') navigate('/student/help-support');
  };

  const enterExam = (examId: number) => navigate(`/student/exams/${examId}/attempt`);

  const notifications = [
    {
      id: 'exam-window',
      title: 'Upcoming Exam Window',
      message: 'Your next exam will be accessible only during the official window.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={NAV_ITEMS}
      activeItem="Dashboard"
      onNavChange={handleNav}
      user={{ name: 'Student', email: 'student@invigilore.com', initial: 'S', role: 'Student' }}
      notificationCount={0}
      notifications={notifications}
      pageTitle="Student Dashboard"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Your Exams</h2>
        <p className="text-sm text-gray-400">Upcoming, ongoing, and completed exam visibility with strict access timing.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-44 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-200">Upcoming + Ongoing</h3>
            {allUpcoming.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No active or upcoming exams.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allUpcoming.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} onEnter={enterExam} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-200">Completed</h3>
            {completed.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No completed exams yet.</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/60 text-xs text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Exam</th>
                      <th className="px-4 py-3 text-left">Course</th>
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
