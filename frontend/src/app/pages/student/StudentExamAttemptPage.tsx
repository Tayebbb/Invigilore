import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import api from '../../api';
import type { StudentAttemptPayload } from './studentTypes';

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function StudentExamAttemptPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<StudentAttemptPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    async function start() {
      if (!examId) return;
      setLoading(true);
      setError('');

      try {
        const response = await api.post(`/student/exams/${examId}/start`);
        const payload: StudentAttemptPayload = response.data.data;
        setAttempt(payload);
        setRemaining(payload.remainingSeconds);

        const initialAnswers: Record<number, string> = {};
        payload.questions.forEach((q) => {
          if (q.selectedAnswer) initialAnswers[q.id] = q.selectedAnswer;
        });
        setAnswers(initialAnswers);

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
    if (remaining <= 0 && attempt && !autoSubmitted) {
      // Auto-submit when time runs out
      setAutoSubmitted(true);
      setSubmitting(true);
      api.post(`/student/attempts/${attempt.attemptId}/submit`)
        .then(() => {
          setShowSubmitSuccess(true);
        })
        .catch(() => {
          setError('Exam was auto-submitted due to timeout, but an error occurred. Please contact support.');
        })
        .finally(() => setSubmitting(false));
      return;
    }
    if (remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining, attempt, autoSubmitted]);

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

  const currentQuestion = useMemo(() => attempt?.questions[currentIndex] ?? null, [attempt, currentIndex]);

  const saveAnswer = async (questionId: number, value: string) => {
    if (!attempt) return;
    try {
      await api.post(`/student/attempts/${attempt.attemptId}/answers`, {
        question_id: questionId,
        selected_answer: value,
      });
    } catch {
      setError('Failed to save answer. Please check your connection.');
    }
  };

  const scheduleSave = (questionId: number, value: string) => {
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = window.setTimeout(() => {
      saveAnswer(questionId, value).catch(() => undefined);
    }, 600);
  };

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(questionId, value);
  };

  const submitExam = async () => {
    if (!attempt) return;
    const confirmed = window.confirm('Submit exam now? You cannot change answers after submission.');
    if (!confirmed) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/student/attempts/${attempt.attemptId}/submit`);
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
        <div className="mx-auto max-w-2xl rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 flex flex-col items-center">
          <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
          <div className="text-lg font-semibold mb-2">Exam Submitted Successfully</div>
          <div className="mb-4 text-sm text-gray-300">
            {autoSubmitted
              ? 'Your exam was automatically submitted because the time limit expired.'
              : 'Thank you for completing your exam. Your responses have been recorded.'}
          </div>
          <button className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => navigate('/student/submissions')}>Go to Submission History</button>
        </div>
      </div>
    );
  }

  if (error || !attempt || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-gray-100">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-200"><AlertCircle className="h-4 w-4" />{error || 'Exam unavailable'}</div>
          <button className="mt-3 rounded-lg bg-gray-800 px-3 py-2 text-sm" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm font-semibold">{attempt.examName}</p>
          <p className="inline-flex items-center gap-2 rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm text-teal-200">
            <Clock className="h-4 w-4" />
            {formatTimer(remaining)}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-5 md:grid-cols-[280px,1fr]">
        <aside className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="mb-3 text-xs text-gray-400">Questions</p>
          <div className="grid grid-cols-5 gap-2">
            {attempt.questions.map((question, idx) => {
              const answered = Boolean(answers[question.id]);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`rounded-md border px-2 py-2 text-xs ${
                    idx === currentIndex
                      ? 'border-teal-400 bg-teal-500/20 text-teal-100'
                      : answered
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-gray-700 bg-gray-800 text-gray-300'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="mb-3 text-xs text-gray-400">Question {currentIndex + 1} of {attempt.questions.length}</p>
          <h2 className="mb-5 text-base font-semibold leading-7">{currentQuestion.questionText}</h2>

          {currentQuestion.type === 'descriptive' ? (
            <textarea
              value={answers[currentQuestion.id] ?? ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              className="h-56 w-full rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm outline-none focus:border-teal-400"
              placeholder="Write your answer here"
            />
          ) : (
            <div className="space-y-2">
              {(currentQuestion.options ?? []).map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswer(currentQuestion.id, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm"
            >
              Previous
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.min(attempt.questions.length - 1, p + 1))}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm"
              >
                Next
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitExam}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
