import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  Plus,
  SlidersHorizontal,
  CircleHelp,
  ChevronLeft,
  ArrowRight,
  Search,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  User,
  MoreVertical,
  ShieldCheck,
} from 'lucide-react';

import api from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser from '../../hooks/useCurrentUser';
import { Pagination } from '../../components/ui/pagination';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Question Bank', icon: FileText },
  { label: 'Create Exam', icon: Plus },
  { label: 'Student Results', icon: SlidersHorizontal },
  { label: 'Notifications', icon: CircleHelp, badge: '2' },
];

interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

const DEFAULT_META: PaginationMeta = {
  total: 0,
  perPage: 20,
  currentPage: 1,
  lastPage: 1
};

interface ExamResult {
  id: number;
  testName: string;
  firstName: string;
  lastName: string;
  email: string;
  scorePercent: number;
  scoreLabel: string;
  endDate: string;
  timeTaken: string;
  status: string;
}

interface ActiveRespondent {
  attemptId: number;
  testName: string;
  name: string;
  email: string;
  startedAt: string;
  status: string;
}

interface ExamInfo {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  resultCount: number;
  averageScore: number;
}

export default function TeacherResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const examId = searchParams.get('examId');

  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeRespondents, setActiveRespondents] = useState<ActiveRespondent[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'respondents'>('results');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [examMeta, setExamMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [resultMeta, setResultMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [respondentMeta, setRespondentMeta] = useState<PaginationMeta>(DEFAULT_META);

  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);

  const teacherUser = {
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Teacher' as const,
  };

  useEffect(() => {
    if (!examId) {
      loadExams(1, searchTerm);
    } else {
      loadResults(Number(examId), 1, searchTerm);
    }
  }, [examId, activeTab]);

  // Handle search with debounce or simple effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!examId) {
        loadExams(1, searchTerm);
      } else {
        loadResults(Number(examId), 1, searchTerm);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  async function loadExams(page: number = 1, search: string = '') {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/portal/tests?page=${page}&search=${search}`);
      setExams(res.data?.data || []);
      if (res.data?.meta) setExamMeta(res.data.meta);
    } catch (err) {
      setError('Failed to load exams.');
    } finally {
      setLoading(false);
    }
  }

  async function loadResults(id: number, page: number = 1, search: string = '') {
    setLoading(true);
    try {
      const endpoint = activeTab === 'results' 
        ? `/teacher/portal/results-database?exam_id=${id}&page=${page}&search=${searchTerm}`
        : `/teacher/portal/respondents?page=${page}&search=${searchTerm}`;

      const res = await api.get(endpoint);
      
      if (activeTab === 'results') {
        setResults(res.data?.data || []);
        if (res.data?.meta) setResultMeta(res.data.meta);
      } else {
        setActiveRespondents(res.data?.data || []);
        if (res.data?.meta) setRespondentMeta(res.data.meta);
      }
    } catch (err) {
      setError('Failed to load student data.');
    } finally {
      setLoading(false);
    }
  }

  function handleNavChange(label: string) {
    if (label === 'Dashboard') navigate('/teacher/dashboard');
    if (label === 'Create Exam') navigate('/teacher/exams/new');
    if (label === 'Notifications') navigate('/teacher/notifications');
    if (label === 'Student Results') {
      setSearchParams({});
      setSearchTerm('');
    }
  }

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="Student Results"
      onNavChange={handleNavChange}
      user={teacherUser}
      pageTitle="Results Database"
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {examId ? (
              <button 
                onClick={() => setSearchParams({})}
                className="p-1.5 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 hover:text-white hover:border-gray-700 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {examId ? 'Exam Performance' : 'Student Results'}
              </h1>
              <p className="text-sm text-gray-500">
                {examId ? 'Detailed student performance for the selected exam' : 'Select an exam to view detailed student results and analytics'}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={examId ? "Search students..." : "Search exams..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
            </div>
            {examId && (
              <div className="flex p-1 bg-gray-950/80 border border-gray-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'results' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Results ({resultMeta.total})
                </button>
                <button
                  onClick={() => setActiveTab('respondents')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'respondents' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  In Progress ({respondentMeta.total})
                </button>
              </div>
            )}
          </div>
          
          {examId && (
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-700 transition-all cursor-pointer">
              <Download className="w-4 h-4" />
              Export {activeTab === 'results' ? 'Results' : 'List'}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-40 rounded-2xl bg-gray-900/40 border border-gray-800 animate-pulse" />
              ))}
            </motion.div>
          ) : !loading && !error && !examId && (
            <div className="space-y-6">
              <motion.div
                key="exams-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => setSearchParams({ examId: exam.id.toString() })}
                    className="group relative flex flex-col p-6 rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-gray-800 hover:border-emerald-500/30 hover:bg-gray-900/60 transition-all text-left cursor-pointer overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-emerald-500" />
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{exam.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        <span className={`w-1.5 h-1.5 rounded-full ${exam.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        {exam.status.replace(/_/g, ' ')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Respondents</span>
                        <span className="text-lg font-bold text-white">{exam.resultCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Avg. Score</span>
                        <span className="text-lg font-bold text-emerald-400">{exam.averageScore}%</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {exam.createdAt}
                      </div>
                      <span className="text-emerald-500 font-semibold group-hover:underline">View Results</span>
                    </div>
                  </button>
                ))}

                {exams.length === 0 && (
                  <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-gray-800 bg-gray-900/20">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">No exams found</h3>
                    <p className="text-gray-500 mt-1">Try a different search term or create a new exam.</p>
                  </div>
                )}
              </motion.div>
              
              <Pagination 
                currentPage={examMeta.currentPage}
                totalPages={examMeta.lastPage}
                onPageChange={(p) => loadExams(p, searchTerm)}
                isLoading={loading}
              />
            </div>
          )}

          {!loading && !error && examId && (
            <motion.div
              key="results-table-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-950/50 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student Info</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                        {activeTab === 'results' ? (
                          <>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Score</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Percentage</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Time Taken</th>
                          </>
                        ) : (
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Started At</th>
                        )}
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                          {activeTab === 'results' ? 'Submission Date' : 'Last Active'}
                        </th>
                        <th className="px-6 py-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {activeTab === 'results' ? (
                        results.map((result) => (
                          <tr 
                            key={result.id} 
                            onClick={() => setSelectedResultId(result.id)}
                            className="hover:bg-emerald-500/[0.03] transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all duration-300">
                                  {result.firstName?.[0]}{result.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{result.firstName} {result.lastName}</div>
                                  <div className="text-[10px] text-gray-500 tracking-tight font-medium opacity-70">{result.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                                {result.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-bold text-white bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800 shadow-inner group-hover:border-emerald-500/20 transition-colors">
                                {result.scoreLabel}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className={`text-xs font-bold ${result.scorePercent >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {result.scorePercent}%
                                </span>
                                <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden border border-gray-800/50">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.scorePercent}%` }}
                                    className={`h-full ${result.scorePercent >= 50 ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-rose-600 to-red-500'}`}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
                                <Clock className="w-3.5 h-3.5 text-gray-600" />
                                {result.timeTaken}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{result.endDate}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="p-2 rounded-lg text-gray-600 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        activeRespondents.map((respondent) => (
                          <tr 
                            key={respondent.attemptId} 
                            className="hover:bg-gray-900/40 transition-colors group border-l-2 border-transparent hover:border-amber-500/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-all duration-300">
                                  {respondent.name?.[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-white">{respondent.name}</div>
                                  <div className="text-[10px] text-gray-500 tracking-tight font-medium">{respondent.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
                                <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping" />
                                {respondent.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-[11px] text-gray-400 font-medium">
                              <div className="flex items-center justify-center gap-1.5 bg-gray-900 border border-gray-800 py-1 px-2.5 rounded-lg inline-flex">
                                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                {new Date(respondent.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                              In Progress
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="p-2 rounded-lg text-gray-600 opacity-20">
                                <MoreVertical className="w-4 h-4" />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {(activeTab === 'results' ? results.length : activeRespondents.length) === 0 && (
                  <div className="py-24 text-center bg-gray-950/20">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800/50 flex items-center justify-center mb-6 text-gray-700">
                      <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No data recorded</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">No exam sessions have been recorded in this category yet.</p>
                  </div>
                )}
              </div>
              
              <Pagination 
                currentPage={activeTab === 'results' ? resultMeta.currentPage : respondentMeta.currentPage}
                totalPages={activeTab === 'results' ? resultMeta.lastPage : respondentMeta.lastPage}
                onPageChange={(p) => loadResults(Number(examId), p, searchTerm)}
                isLoading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedResultId && (
            <ResultDetailModal 
              resultId={selectedResultId} 
              onClose={() => setSelectedResultId(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function ResultDetailModal({ resultId, onClose }: { resultId: number; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/teacher/portal/results/${resultId}`)
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resultId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Result Review</h2>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-0.5">
              {loading ? 'Loading performance data...' : `${data?.student} · ${data?.examTitle}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-800 bg-gray-950 text-gray-500 hover:text-white hover:border-gray-700 transition-all cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 rounded-2xl bg-gray-800/40 animate-pulse border border-gray-800" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Final Score</p>
                  <p className="text-2xl font-bold text-emerald-400">{data?.score} / {data?.total}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Percentage</p>
                  <p className="text-2xl font-bold text-white">{Math.round((data?.score / data?.total) * 100)}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Student</p>
                  <p className="text-sm font-bold text-white truncate">{data?.student}</p>
                  <p className="text-[10px] text-gray-500 truncate">{data?.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Answer Breakdown
                </h3>
                
                {data?.answers.map((answer: any, idx: number) => (
                  <div key={idx} className="group relative p-6 rounded-2xl bg-gray-950 border border-gray-800 hover:border-gray-700 transition-all">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1 block">Question {idx + 1} · {answer.type.toUpperCase()}</span>
                        <p className="text-white font-medium leading-relaxed">{answer.question}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${answer.isCorrect ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                          {answer.awarded} / {answer.marks} Marks
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Student's Response</p>
                          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-200 min-h-[60px]">
                            {answer.studentAnswer || <span className="text-gray-600 italic">No answer provided</span>}
                          </div>
                        </div>
                        {answer.correctAnswer && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Correct/Reference Answer</p>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-sm text-emerald-200/70">
                              {answer.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        {answer.feedback && (
                          <div className="h-full flex flex-col">
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">AI Evaluation Feedback</p>
                            <div className="flex-1 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-sm text-blue-300 italic flex items-start gap-3">
                              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                              {answer.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-700 transition-all cursor-pointer"
          >
            Close Review
          </button>
        </div>
      </motion.div>
    </div>
  );
}
