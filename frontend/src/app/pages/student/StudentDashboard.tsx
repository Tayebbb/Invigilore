import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle, BookOpenText, CalendarClock, ClipboardList,
  PlayCircle, Clock, CheckCircle2, BookOpen, Zap,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import { useStudentAccess } from '../../context/StudentAccessContext';
import type { StudentExam, StudentSubject } from './studentTypes';
import useCurrentUser from '../../hooks/useCurrentUser';

function computeCountdown(startIso: string): string {
  const diff = new Date(startIso).getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function isWithinExamWindow(exam: StudentExam): boolean {
  const now = Date.now();
  const start = new Date(exam.startTime).getTime();
  const end   = new Date(exam.endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return now >= start && now <= end;
}

function EmptyAccessState() {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
        <BookOpenText className="h-7 w-7 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">No subjects or exams available yet</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">
        Your dashboard will populate once authorized staff publish subjects and assign exams to your account.
      </p>
    </section>
  );
}

const SUBJECT_COLORS = ['from-blue-500 to-cyan-500', 'from-violet-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'];

function SubjectCard({ subject, index }: { subject: StudentSubject; index: number }) {
  const grad = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-2xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
          {subject.subjectCode}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-white mb-1">{subject.subjectName}</h4>
      <p className="text-xs text-gray-400">
        {subject.department ? `${subject.department}` : 'Department not specified'}
      </p>
      <p className="mt-1 text-xs text-gray-600">
        {typeof subject.creditHours === 'number' ? `${subject.creditHours} credit hours` : ''}
      </p>
    </motion.article>
  );
}

const EXAM_STATUS_STYLE: Record<string, string> = {
  upcoming:  'bg-blue-500/10 border-blue-500/20 text-blue-300',
  ongoing:   'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  completed: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
};

function ExamCard({ exam, onEnter, index }: { exam: StudentExam; onEnter: (id: number) => void; index: number }) {
  const canEnter = exam.status !== 'completed' && isWithinExamWindow(exam);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="rounded-2xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{exam.examName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{exam.courseName}</p>
        </div>
        <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${EXAM_STATUS_STYLE[exam.status] ?? EXAM_STATUS_STYLE.upcoming}`}>
          {exam.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          {new Date(exam.startTime).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {exam.durationMinutes} min
        </div>
        <div className="text-gray-600">{new Date(exam.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        <div className="text-gray-600">{new Date(exam.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 pt-3">
        <p className={`text-xs font-medium flex items-center gap-1.5 ${canEnter ? 'text-emerald-400' : 'text-gray-500'}`}>
          {canEnter
            ? <><Zap className="w-3.5 h-3.5" /> Exam window active</>
            : exam.status === 'upcoming'
              ? <><Clock className="w-3.5 h-3.5" /> Starts in {computeCountdown(exam.startTime)}</>
              : <><CheckCircle2 className="w-3.5 h-3.5" /> Completed</>
          }
        </p>
        <button
          type="button"
          disabled={!canEnter}
          onClick={() => onEnter(exam.id)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 shadow-sm shadow-blue-500/20"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Enter Exam
        </button>
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const currentUser  = useCurrentUser();
  const { subjects, upcoming, ongoing, completed, loading, error, warnings: accessWarnings = [] } = useStudentAccess();
  const hasAnyAccessData = useMemo(
    () => subjects.length > 0 || upcoming.length > 0 || ongoing.length > 0 || completed.length > 0,
    [subjects.length, upcoming.length, ongoing.length, completed.length],
  );

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) window.location.href = route;
  };

  const enterExam = (examId: number) => {
    window.location.href = `/student/exams/${examId}/attempt`;
  };

  const studentUser = {
    name:    currentUser.name,
    email:   currentUser.email,
    initial: currentUser.initial,
    role:    'Student' as const,
  };

  const stats = [
    { label: 'Upcoming', value: upcoming.length, color: 'from-blue-500 to-cyan-500', icon: CalendarClock },
    { label: 'Ongoing',  value: ongoing.length,  color: 'from-emerald-500 to-teal-500', icon: Zap },
    { label: 'Completed', value: completed.length, color: 'from-violet-500 to-blue-500', icon: CheckCircle2 },
    { label: 'Subjects', value: subjects.length,  color: 'from-amber-500 to-orange-500', icon: BookOpen },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Dashboard"
      onNavChange={handleNav}
      user={studentUser}
      notificationCount={0}
      pageTitle="Student Dashboard"
    >
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Student Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {currentUser.firstName}
            </span>
          </h2>
          <p className="text-sm text-gray-400">View your subjects, upcoming exams, and published results.</p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
          onClick={() => handleNav('Available Exams')}
        >
          <ClipboardList className="h-4 w-4" />
          View Available Exams
        </button>
      </motion.div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {accessWarnings.map((warning) => (
        <div key={warning} className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {warning}
        </div>
      ))}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-24 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-44 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
            ))}
          </div>
        </div>
      ) : !hasAnyAccessData ? (
        <EmptyAccessState />
      ) : (
        <div className="space-y-8">

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Subjects */}
          {subjects.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">Available Subjects</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject, i) => (
                  <SubjectCard key={`${subject.id}-${subject.subjectCode}`} subject={subject} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <CalendarClock className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Upcoming Exams</h3>
            </div>
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/50 p-6 text-sm text-gray-500 text-center">No upcoming exams scheduled.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((exam, i) => <ExamCard key={exam.id} exam={exam} onEnter={enterExam} index={i} />)}
              </div>
            )}
          </section>

          {/* Ongoing */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Ongoing Exams</h3>
            </div>
            {ongoing.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/50 p-6 text-sm text-gray-500 text-center">No ongoing exams right now.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ongoing.map((exam, i) => <ExamCard key={exam.id} exam={exam} onEnter={enterExam} index={i} />)}
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Completed Exams</h3>
            </div>
            {completed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/50 p-6 text-sm text-gray-500 text-center">No completed exams yet.</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
                <table className="w-full text-sm">
                  <thead className="bg-gray-950/60 text-xs text-gray-500 border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Exam</th>
                      <th className="px-4 py-3 text-left font-medium">Subject</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map((exam) => (
                      <tr key={exam.id} className="border-t border-gray-800 hover:bg-gray-950/40 transition-colors">
                        <td className="px-4 py-3 text-gray-200 font-medium">{exam.examName}</td>
                        <td className="px-4 py-3 text-gray-400">{exam.courseName}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(exam.startTime).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg bg-gray-700/40 border border-gray-700/50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-400">COMPLETED</span>
                        </td>
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
