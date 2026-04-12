import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  Clock,
  FilePlus,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import api from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardCard from '../../components/dashboard/DashboardCard';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser from '../../hooks/useCurrentUser';
import { Pagination } from '../../components/ui/pagination';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Question Bank', icon: FileText },
  { label: 'Create Exam', icon: FilePlus },
  { label: 'Student Results', icon: BarChart3 },
  { label: 'Notifications', icon: Bell, badge: '2' },
];

const STATUS_OPTIONS = ['All statuses', 'Scheduled', 'Active', 'Completed', 'Draft'] as const;
const ROLE_OPTIONS = ['All roles', 'Created by me', 'Controller', 'Question Setter', 'Moderator', 'Invigilator'] as const;

type ExamStatus = (typeof STATUS_OPTIONS)[number];
type ExamRoleFilter = (typeof ROLE_OPTIONS)[number];

type ExamUser = { email?: string } | null | undefined;

type ApiExam = {
  id: number;
  title?: string;
  name?: string;
  subject?: { name?: string; title?: string } | string | null;
  teacher?: ExamUser;
  controller?: ExamUser;
  questionSetter?: ExamUser;
  question_setter?: ExamUser;
  moderator?: ExamUser;
  invigilator?: ExamUser;
  duration?: number | string | null;
  total_marks?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  local_status?: 'Draft';
  created_at?: string;
};

type ExamCard = {
  id: number;
  title: string;
  subject: string;
  status: ExamStatus;
  scheduleDetail: string;
  durationLabel: string;
  marksLabel: string;
  roles: string[];
  isCreatedByMe: boolean;
  hasAccess: boolean;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function getTitle(exam: ApiExam): string {
  return exam.title ?? exam.name ?? 'Untitled exam';
}

function getSubject(exam: ApiExam): string {
  if (typeof exam.subject === 'string') {
    return exam.subject;
  }

  return exam.subject?.title ?? exam.subject?.name ?? 'Uncategorized';
}

function getStatus(exam: ApiExam): ExamStatus {
  if (exam.local_status === 'Draft') {
    return 'Draft';
  }

  const now = new Date();
  const start = exam.start_time ? new Date(exam.start_time) : null;
  const end = exam.end_time ? new Date(exam.end_time) : null;

  if (start && end) {
    if (now >= start && now <= end) return 'Active';
    if (now > end) return 'Completed';
    return 'Scheduled';
  }

  if (start || end) return 'Scheduled';
  return 'Draft';
}

function formatSchedule(exam: ApiExam): string {
  const start = exam.start_time ? new Date(exam.start_time) : null;
  const end = exam.end_time ? new Date(exam.end_time) : null;

  if (!start && !end) {
    return 'No schedule set';
  }

  if (start && end) {
    const date = start.toLocaleDateString();
    const from = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const to = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${date} · ${from} - ${to}`;
  }

  return (start ?? end)?.toLocaleString() ?? 'No schedule set';
}

function formatDuration(exam: ApiExam): string {
  return exam.duration == null || exam.duration === '' ? 'Duration not set' : `${exam.duration} min`;
}

function formatMarks(exam: ApiExam): string {
  return exam.total_marks == null || exam.total_marks === '' ? 'Marks not set' : `${exam.total_marks} marks`;
}

function isSameUser(user: ExamUser, email: string): boolean {
  return normalizeText(user?.email) === email;
}

function getQuestionSetter(exam: ApiExam): ExamUser {
  return exam.questionSetter ?? exam.question_setter;
}

function buildCard(exam: ApiExam, currentEmail: string): ExamCard {
  const roles: string[] = [];
  const createdByMe = isSameUser(exam.teacher, currentEmail) || isSameUser(exam.controller, currentEmail);

  if (createdByMe) roles.push('Created by me');
  if (isSameUser(exam.controller, currentEmail)) roles.push('Controller');
  if (isSameUser(getQuestionSetter(exam), currentEmail)) roles.push('Question Setter');
  if (isSameUser(exam.moderator, currentEmail)) roles.push('Moderator');
  if (isSameUser(exam.invigilator, currentEmail)) roles.push('Invigilator');
  const hasAccess = roles.length > 0;

  return {
    id: exam.id,
    title: getTitle(exam),
    subject: getSubject(exam),
    status: getStatus(exam),
    scheduleDetail: formatSchedule(exam),
    durationLabel: formatDuration(exam),
    marksLabel: formatMarks(exam),
    roles,
    isCreatedByMe: createdByMe,
    hasAccess,
  };
}

const STATUS_CLASS: Record<ExamStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Completed: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  Draft: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'All statuses': 'bg-gray-700/40 text-gray-300 border border-gray-700',
};

const UPCOMING = [
  { name: 'Physics Midterm', time: 'Tomorrow, 10:00 AM', dot: 'bg-blue-400' },
  { name: 'Math Quiz', time: 'Friday, 2:00 PM', dot: 'bg-violet-400' },
  { name: 'Biology Practical', time: 'Mon, 9:00 AM', dot: 'bg-emerald-400' },
];

export default function MyExamsDashboard() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus>('All statuses');
  const [roleFilter, setRoleFilter] = useState<ExamRoleFilter>('All roles');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const teacherUser = {
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Teacher' as const,
  };

  useEffect(() => {
    setLoading(true);
    api.get('/exams')
      .then((response) => {
        const data = extractApiData(response) ?? response.data;
        const apiExams = Array.isArray(data) ? data : [];
        setExams(apiExams);
      })
      .catch((err) => setError(extractApiError(err) || 'Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const currentEmail = normalizeText(currentUser.email);

  const visibleExams = useMemo(() => {
    return exams
      .map((exam) => buildCard(exam, currentEmail))
      .filter((exam) => exam.hasAccess);
  }, [currentEmail, exams]);

  const subjectOptions = useMemo(() => {
    const subjects = visibleExams.map((exam) => exam.subject).filter(Boolean);
    return ['All subjects', ...Array.from(new Set(subjects))];
  }, [visibleExams]);

  const filteredExams = useMemo(() => {
    const query = normalizeText(searchTerm);

    return visibleExams.filter((exam) => {
      const matchesSearch = !query || normalizeText([exam.title, exam.subject, exam.scheduleDetail, exam.roles.join(' ')].join(' ')).includes(query);
      const matchesStatus = statusFilter === 'All statuses' || exam.status === statusFilter;
      const matchesRole =
        roleFilter === 'All roles' ||
        exam.roles.includes(roleFilter);
      const matchesSubject = subjectFilter === 'All subjects' || exam.subject === subjectFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesSubject;
    });
  }, [roleFilter, searchTerm, statusFilter, subjectFilter, visibleExams]);

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExams.slice(start, start + itemsPerPage);
  }, [filteredExams, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, subjectFilter]);

  const createdCount = visibleExams.filter((exam) => exam.isCreatedByMe).length;
  const accessibleCount = visibleExams.filter((exam) => exam.hasAccess).length;
  const noAccessCount = visibleExams.filter((exam) => !exam.hasAccess).length;
  const activeCount = visibleExams.filter((exam) => exam.status === 'Active').length;
  const upcomingCount = visibleExams.filter((exam) => exam.status === 'Scheduled').length;

  const cards = [
    { icon: FileText, title: 'My Accessible Exams', value: String(visibleExams.length), subtitle: 'Matched to your assigned roles', color: 'blue' as const },
    { icon: GraduationCap, title: 'Created by You', value: String(createdCount), subtitle: 'Controller-owned exams', color: 'emerald' as const },
    { icon: ShieldCheck, title: 'Accessible Exams', value: String(accessibleCount), subtitle: 'You can open these', color: 'amber' as const },
    { icon: Activity, title: 'No Access', value: String(noAccessCount), subtitle: 'Hidden from dashboard', color: 'purple' as const },
  ];

  function openCreateExam(examId?: number) {
    if (!examId) {
      navigate('/teacher/exams/new');
      return;
    }

    const selectedExam = visibleExams.find((exam) => exam.id === examId);
    if (selectedExam?.roles.includes('Invigilator')) {
      navigate(`/exam/${examId}/invigilator`);
      return;
    }
    if (selectedExam?.roles.includes('Moderator')) {
      navigate(`/exam/${examId}/moderator`);
      return;
    }
    if (selectedExam?.roles.includes('Question Setter')) {
      navigate(`/exam/${examId}/questions`);
      return;
    }

    navigate(`/teacher/exams/new?examId=${examId}`);
  }

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      onNavChange={(label) => {
        if (label === 'Create Exam') {
          navigate('/teacher/exams/new');
          return;
        }
        if (label === 'Student Results') {
          navigate('/teacher/results');
          return;
        }
        if (label === 'Notifications') {
          navigate('/teacher/notifications');
          return;
        }
        setActiveItem(label);
      }}
      user={teacherUser}
      pageTitle="Teacher Dashboard"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">Teacher Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {currentUser.firstName} 👋
            </span>
          </h2>
          <p className="text-gray-400 text-sm">
            Review only the exams assigned to you by role (controller, question setter, moderator, or invigilator).
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/exams/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap flex-shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          Create New Exam
        </button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card, index) => (
          <DashboardCard key={card.title} {...card} index={index} />
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-col gap-4 px-6 py-5 border-b border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">My Exams</h3>
              <p className="text-sm text-gray-400 mt-1">Only exams you can access based on your role assignments.</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <button
                onClick={() => setActiveItem('Dashboard')}
                className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Focus view
              </button>
              <button
                onClick={() => navigate('/teacher/exams/new')}
                className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
              >
                New exam
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3">
            <label className="relative block">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exams, subjects, or roles"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </label>

            <label className="relative block">
              <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ExamStatus)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="relative block">
              <ShieldCheck className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as ExamRoleFilter)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="relative block">
              <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-48 rounded-2xl border border-gray-800 bg-gray-950/60 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && filteredExams.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-950/50 px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-gray-400">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-white">No exams match your filters</h4>
              <p className="mt-1 text-sm text-gray-400">Clear a filter or create a new exam to populate this list.</p>
            </div>
          )}

          {!loading && !error && filteredExams.length > 0 && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {paginatedExams.map((exam) => (
                  <article
                    key={exam.id}
                    onClick={() => {
                      if (exam.hasAccess) {
                        openCreateExam(exam.id);
                      }
                    }}
                    className={`group rounded-2xl border bg-gray-950/60 p-5 transition-all duration-200 ${
                      exam.hasAccess
                        ? 'border-gray-800 hover:border-blue-500/30 hover:bg-gray-900 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer'
                        : 'border-gray-800/70 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[exam.status]}`}>
                            {exam.status}
                          </span>
                          {exam.isCreatedByMe && (
                            <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                              Created by you
                            </span>
                          )}
                          {!exam.hasAccess && (
                            <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                              No access
                            </span>
                          )}
                        </div>
                        <h4 className="truncate text-lg font-semibold text-white">{exam.title}</h4>
                        <p className="mt-1 text-sm text-gray-400">{exam.subject}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                        <p className="mt-1 text-sm font-medium text-gray-200">{exam.status}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-400">
                      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Timing</p>
                        <p className="mt-1 text-gray-200">{exam.scheduleDetail}</p>
                      </div>
                      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Duration / Marks</p>
                        <p className="mt-1 text-gray-200">{exam.durationLabel} · {exam.marksLabel}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(exam.roles.length > 0 ? exam.roles : ['No assigned role']).map((role) => (
                        <span key={role} className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-gray-300">
                          {role}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-800 pt-4 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.scheduleDetail}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {exam.roles.length} role{exam.roles.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (exam.hasAccess) {
                            openCreateExam(exam.id);
                          }
                        }}
                        disabled={!exam.hasAccess}
                        className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        {exam.hasAccess ? 'Open exam' : 'Access restricted'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={loading}
              />
            </>
          )}

        </div>
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className="xl:col-span-2 bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white">Role Access Summary</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Created by me', value: createdCount, color: 'text-emerald-400' },
              { label: 'You can access', value: accessibleCount, color: 'text-cyan-400' },
              { label: 'No access', value: noAccessCount, color: 'text-rose-400' },
              { label: 'Assigned as controller', value: visibleExams.filter((exam) => exam.roles.includes('Controller')).length, color: 'text-blue-400' },
              { label: 'Assigned as moderator', value: visibleExams.filter((exam) => exam.roles.includes('Moderator')).length, color: 'text-violet-400' },
              { label: 'Assigned as invigilator', value: visibleExams.filter((exam) => exam.roles.includes('Invigilator')).length, color: 'text-amber-400' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950/50 px-4 py-3">
                <span className="text-sm text-gray-300">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white">Upcoming Exams</h3>
          </div>
          <div className="space-y-3">
            {UPCOMING.map((item) => (
              <div key={item.name} className="flex items-start gap-3 p-3 rounded-xl border border-gray-800 bg-gray-950/50 hover:border-gray-700 transition-colors">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                <div>
                  <p className="text-sm text-gray-200 font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
