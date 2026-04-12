import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../api';
import type { StudentAttemptPayload } from './studentTypes';
import { getServerNow, syncWithServer } from '../../utils/timeSync';

type SubmissionResultSummary = {
  examName?: string;
  isPublished?: boolean;
  resultsAvailableAt?: string;
};

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getQuestionOptions(options: StudentAttemptPayload['questions'][number]['options']): string[] {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0);
  }

  return Object.entries(options)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, value]) => value)
    .filter((option): option is string => typeof option === 'string' && option.trim().length > 0);
}

export default function StudentExamAttemptPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<StudentAttemptPayload | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 5;

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<number, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState<SubmissionResultSummary | null>(null);

  const submissionKeyRef = useRef(`exam-${examId ?? 'unknown'}-${Date.now()}`);

  useEffect(() => {
    async function start() {
      if (!examId) return;
      setLoading(true);
      setError('');

      try {
        await syncWithServer();
        const response = await api.post(`/student/exams/${examId}/start`);
        const payload: StudentAttemptPayload = response.data.data;
        setAttempt(payload);
        setRemaining(payload.remainingSeconds);

        const initialAnswers: Record<number, string> = {};
        const initialStatus: Record<number, 'saved'> = {};
        payload.questions.forEach((q) => {
          if (q.selectedAnswer) {
            initialAnswers[q.id] = q.selectedAnswer;
            initialStatus[q.id] = 'saved';
          }
        });
        setAnswers(initialAnswers);
        setSavingStatus(initialStatus as any);

        if (document.fullscreenEnabled && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => undefined);
        }
      } catch (e: any) {
        const message = e?.response?.data?.message ?? 'Unable to enter exam.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    start();
  }, [examId]);

  useEffect(() => {
    if (!attempt || autoSubmitted) return;

    const timer = window.setInterval(() => {
      const now = getServerNow();
      const startTime = new Date(attempt.startTime!).getTime();
      const durationMs = attempt.durationMinutes * 60 * 1000;
      const expiry = startTime + durationMs;
      
      const rem = Math.max(0, Math.floor((expiry - now.getTime()) / 1000));
      setRemaining(rem);

      if (rem <= 0) {
        setAutoSubmitted(true);
        handleAutoSubmit();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attempt, autoSubmitted]);

  const saveAnswerToServer = async (questionId: number, value: string) => {
    if (!attempt) return;
    
    setSavingStatus(prev => ({ ...prev, [questionId]: 'saving' }));
    try {
      const normalized = value ?? '';
      await api.post(`/student/attempts/${attempt.attemptId}/answers`, {
        question_id: questionId,
        selected_answer: normalized,
        selected_option: normalized,
      });
      setSavingStatus(prev => ({ ...prev, [questionId]: 'saved' }));
    } catch (err) {
      console.error('Failed to save answer:', err);
      setSavingStatus(prev => ({ ...prev, [questionId]: 'error' }));
    }
  };

  const flushAnswersBeforeSubmit = async () => {
    if (!attempt) return;

    const pending = attempt.questions
      .map((question) => ({
        questionId: question.id,
        value: answers[question.id] ?? '',
      }))
      .filter((entry) => entry.value.trim().length > 0);

    if (pending.length === 0) return;

    await Promise.all(pending.map((entry) => saveAnswerToServer(entry.questionId, entry.value)));
  };

  const handleAutoSubmit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      await flushAnswersBeforeSubmit();

      const payload = {
        exam_id: attempt.examId,
        idempotency_key: submissionKeyRef.current,
        answers: attempt.questions.map((question) => ({
          question_id: question.id,
          submitted_answer: answers[question.id] ?? null,
        })),
      };

      const response = await api.post('/submissions', payload);
      const data = response?.data?.data ?? {};
      setSubmissionSummary({
        examName: data?.exam?.title ?? attempt.examName,
        isPublished: Boolean(data?.is_published ?? false),
        resultsAvailableAt: data?.results_available_at ?? data?.resultsAvailableAt,
      });
      setShowSubmitSuccess(true);
    } catch {
      setError('Exam was auto-submitted due to timeout, but an error occurred. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!attempt) return;

    const onBlur = () => {
      api.post(`/student/attempts/${attempt.attemptId}/telemetry`, { eventType: 'window_blur', meta: { at: new Date().toISOString() } }).catch(() => undefined);
    };

    const onVisibility = () => {
      if (document.hidden) {
        api.post(`/student/attempts/${attempt.attemptId}/telemetry`, { eventType: 'tab_switch', meta: { at: new Date().toISOString() } }).catch(() => undefined);
      }
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [attempt]);

  const totalPages = attempt ? Math.ceil(attempt.questions.length / questionsPerPage) : 0;
  
  const currentQuestions = useMemo(() => {
    if (!attempt) return [];
    const start = currentPage * questionsPerPage;
    return attempt.questions.slice(start, start + questionsPerPage);
  }, [attempt, currentPage]);

  const handleAnswerChange = (questionId: number, value: string, immediate: boolean = false) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (immediate) {
      saveAnswerToServer(questionId, value);
    }
  };

  const submitExam = async () => {
    if (!attempt) return;
    const confirmed = window.confirm('Submit exam now? You cannot change answers after submission.');
    if (!confirmed) return;

    setSubmitting(true);
    setError('');

    try {
      await flushAnswersBeforeSubmit();

      const response = await api.post(`/student/attempts/${attempt.attemptId}/submit`, {
        idempotency_key: submissionKeyRef.current,
      });
      const data = response?.data?.data ?? response?.data ?? {};
      setSubmissionSummary({
        examName: data?.exam?.title ?? attempt.examName,
        isPublished: Boolean(data?.summary?.isPublished ?? false),
        resultsAvailableAt: data?.summary?.resultsAvailableAt,
      });
      setShowSubmitSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 p-8 text-gray-200">Loading secure exam session...</div>;
  }

  if (showSubmitSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-gray-100">
        <div className="mx-auto max-w-2xl rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 flex flex-col items-center text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Exam Submitted</h2>
          <p className="mb-6 text-gray-400">
            {autoSubmitted
              ? 'Your exam was automatically submitted because the time limit expired.'
              : 'Thank you for completing your exam. Your responses have been recorded.'}
          </p>
          {submissionSummary && (
            <div className="mb-8 w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-xl">
              <div className="text-center text-sm text-gray-300">
                Final marks are hidden until the exam window closes.
              </div>
              <div className="mt-3 text-center text-xs text-gray-500">
                {submissionSummary.resultsAvailableAt
                  ? `Results will be available after ${new Date(submissionSummary.resultsAvailableAt).toLocaleString()}.`
                  : 'Results will appear on the Published Results page once released by the system.'}
              </div>
            </div>
          )}
          <button 
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3 font-semibold text-white transition-colors"
            onClick={() => navigate('/student/submissions')}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-gray-100">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-200">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error || 'Exam unavailable'}</span>
          </div>
          <button className="mt-4 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{attempt.examName}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Live Secure Session · ID: {attempt.attemptId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
              remaining < 300 ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
            }`}>
              <Clock className={`h-4 w-4 ${remaining < 300 ? 'animate-pulse' : ''}`} />
              {formatTimer(remaining)}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Quick-Nav Sub-header */}
      <div className="sticky top-[73px] z-20 border-b border-gray-800/50 bg-gray-950/80 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {attempt.questions.map((question, idx) => {
              const isAnswered = Boolean(answers[question.id]);
              const isCurrentPage = idx >= currentPage * questionsPerPage && idx < (currentPage + 1) * questionsPerPage;
              const status = savingStatus[question.id];

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                     setCurrentPage(Math.floor(idx / questionsPerPage));
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    isCurrentPage
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : isAnswered
                        ? 'border border-gray-700 bg-gray-800/50 text-gray-300'
                        : 'border border-gray-800 text-gray-600 hover:border-gray-700'
                  }`}
                >
                  {idx + 1}
                  {isAnswered && !isCurrentPage && (
                    <span className={`absolute mt-6 w-1 h-1 rounded-full ${
                      status === 'saving' ? 'bg-amber-400 animate-pulse' : 
                      status === 'error' ? 'bg-red-500' : 'bg-emerald-500/60'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-gray-800 ml-4">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                {Object.keys(answers).length} / {attempt.questions.length} Complete
             </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-6">
        <main className="space-y-8">
          <div className="flex items-center justify-between px-2 mb-2">
             <div className="flex flex-col">
                <h3 className="text-xl font-bold text-white">Page {currentPage + 1} of {totalPages}</h3>
                <span className="text-xs text-gray-500 font-medium">Showing questions {currentPage * questionsPerPage + 1} to {Math.min((currentPage + 1) * questionsPerPage, attempt.questions.length)}</span>
             </div>
             <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(0, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 0}
                  className="p-3 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 disabled:opacity-20 hover:text-white transition-colors"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages - 1}
                  className="p-3 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 disabled:opacity-20 hover:text-white transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
             </div>
          </div>

          <div className="space-y-6">
            {currentQuestions.map((question, idx) => {
              const globalIndex = currentPage * questionsPerPage + idx;
              const isTextual = question.type === 'descriptive' || question.type === 'short_answer';
              
              return (
                <section key={question.id} className="rounded-3xl border border-gray-800 bg-gray-900/40 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-gray-700/50">
                  <div className="flex items-start justify-between gap-6 mb-8">
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-sm font-bold text-gray-100 shadow-inner">
                        {globalIndex + 1}
                      </span>
                      <h2 className="text-lg font-bold text-gray-100 leading-snug pt-1">{question.questionText}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                        {question.marks} Points
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isTextual ? (
                      <div className="relative">
                        <textarea
                          value={answers[question.id] ?? ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          onBlur={(e) => saveAnswerToServer(question.id, e.target.value)}
                          className="min-h-[200px] w-full rounded-2xl border border-gray-800 bg-gray-950/80 p-5 text-base text-gray-200 outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-gray-800 transition-all resize-none"
                          placeholder="Type your response here..."
                        />
                        <div className="absolute top-4 right-4">
                           {savingStatus[question.id] === 'saving' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {getQuestionOptions(question.options).map((option) => (
                          <label 
                            key={option} 
                            className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition-all ${
                              answers[question.id] === option 
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100 shadow-lg shadow-emerald-500/5' 
                                : 'border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:bg-gray-950/60'
                            }`}
                          >
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                               answers[question.id] === option 
                                ? 'border-emerald-500 bg-emerald-500' 
                                : 'border-gray-700 group-hover:border-gray-500'
                            }`}>
                               {answers[question.id] === option && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                               <input
                                type="radio"
                                name={`q-${question.id}`}
                                checked={answers[question.id] === option}
                                onChange={() => handleAnswerChange(question.id, option, true)}
                                className="sr-only"
                              />
                            </div>
                            <span className="text-base font-medium">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-800/50 pt-5">
                    <div className="flex items-center gap-3">
                      {savingStatus[question.id] === 'saving' ? (
                        <span className="text-[10px] text-amber-500 flex items-center gap-2 font-bold uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Syncing
                        </span>
                      ) : savingStatus[question.id] === 'saved' ? (
                        <span className="text-[10px] text-emerald-500/60 flex items-center gap-2 font-bold uppercase tracking-widest">
                          <CheckCircle className="w-3 h-3" />
                          Saved
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Awaiting Answer</span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{question.type?.replace('_', ' ')}</span>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setCurrentPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl border border-gray-800 bg-gray-900 px-8 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-20 transition-all"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Previous
            </button>

            {currentPage < totalPages - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-10 py-4 text-sm font-bold text-white transition-all shadow-xl shadow-emerald-500/20"
              >
                Next Page
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={submitExam}
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-12 py-4 text-sm font-bold text-white shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-40"
              >
                <CheckCircle className="h-5 w-5" />
                {submitting ? 'Submitting...' : 'Complete Exam'}
              </button>
            )}
          </div>
        </main>

        <footer className="mt-20 pb-10 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">Secure Invigilation Active · System 2.0</p>
        </footer>
      </div>
    </div>
  );
}

