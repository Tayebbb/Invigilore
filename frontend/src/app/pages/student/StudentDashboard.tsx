import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, BookOpenText, CalendarClock, PlayCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import { useStudentAccess } from '../../context/StudentAccessContext';
import type { StudentExam, StudentSubject } from './studentTypes';

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

function isWithinExamWindow(exam: StudentExam): boolean {
  const now = Date.now();
  const start = new Date(exam.startTime).getTime();
  const end = new Date(exam.endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return now >= start && now <= end;
}

function examStatusTone(status: StudentExam['status']) {
  if (status === 'upcoming') return 'bg-blue-500/20 text-blue-300';
  if (status === 'ongoing') return 'bg-emerald-500/20 text-emerald-300';
  return 'bg-gray-700/70 text-gray-300';
}

function EmptyAccessState() {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-8 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
        <BookOpenText className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">No subjects or exams available yet</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">
        Your dashboard will automatically populate once authorized staff create subjects and publish exam schedules for your account.
      </p>
    </section>
  );
}

function SubjectCard({ subject }: { subject: StudentSubject }) {
  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{subject.subjectName}</h4>
        <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[11px] font-semibold text-blue-300">
          {subject.subjectCode}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {subject.department ? `Department: ${subject.department}` : 'Department not specified'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {typeof subject.creditHours === 'number' ? `${subject.creditHours} credit hours` : 'Credit hours not specified'}
      </p>
    </article>
  );
}

function ExamCard({ exam, onEnter }: { exam: StudentExam; onEnter: (examId: number) => void }) {
  const canEnter = exam.status !== 'completed' && isWithinExamWindow(exam);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{exam.examName}</p>
          <p className="text-xs text-gray-400">{exam.courseName}</p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${examStatusTone(exam.status)}`}
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
          {exam.status === 'upcoming'
            ? `Starts in ${computeCountdown(exam.startTime)}`
            : canEnter
              ? 'Exam window active'
              : 'Outside allowed exam window'}
        </p>
        <button
          type="button"
          disabled={!canEnter}
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
  const {
    subjects,
    upcoming,
    ongoing,
    completed,
    loading,
    error,
    warnings,
  } = useStudentAccess();

  const hasAnyAccessData = useMemo(
    () => subjects.length > 0 || upcoming.length > 0 || ongoing.length > 0 || completed.length > 0,
    [subjects.length, upcoming.length, ongoing.length, completed.length],
  );

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) {
      navigate(route);
    }
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
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Dashboard"
      onNavChange={handleNav}
      user={{ name: 'Student', email: 'student@invigilore.com', initial: 'S', role: 'Student' }}
      notificationCount={0}
      notifications={notifications}
      pageTitle="Student Dashboard"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Academic Access Overview</h2>
        <p className="text-sm text-gray-400">Your subjects and exams appear as soon as they are configured by authorized roles.</p>
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
