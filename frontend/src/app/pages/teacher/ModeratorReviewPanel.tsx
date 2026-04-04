import { useEffect, useState } from 'react';
import { CheckCircle, ShieldCheck, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../../api';

interface ReviewQuestion {
  id: number;
  question_text: string;
  type: string;
  options: { a: string; b: string; c: string; d: string } | null;
  correct_answer: string;
  marks: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  creator?: { name: string; email: string };
}

export default function ModeratorReviewPanel({ examId, canEdit }: { examId: number; canEdit: boolean }) {
  const [questions, setQuestions]       = useState<ReviewQuestion[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [examStatus, setExamStatus]     = useState('');
  const [approving, setApproving]       = useState(false);
  const [successMsg, setSuccessMsg]     = useState('');

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const fetchQuestions = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/exams/${examId}/questions/review`);
      setQuestions(res.data.questions);
      setReviewComment(res.data.review_comment || '');
      setExamStatus(res.data.exam_status || '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      setSuccessMsg('');
      const res = await api.post(`/exams/${examId}/approve`, { review_comment: reviewComment });
      setExamStatus(res.data.exam_status);
      setSuccessMsg('Paper approved! Exam is now Active.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to approve paper.');
    } finally {
      setApproving(false);
    }
  };

  const isAlreadyActive = examStatus === 'active';

  const statusBadge = {
    draft:     'bg-gray-500/10 text-gray-400 border-gray-500/20',
    submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    reviewed:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Moderator Review Board
        </h3>
        <p className="text-sm text-gray-400">
          Review all questions submitted by the question setter, then approve the paper to activate the exam.
        </p>
        {isAlreadyActive && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            This exam has already been approved and is <strong>Active</strong>.
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 text-center">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No questions have been submitted for this exam yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              {/* Question header */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-sm font-bold text-white">Q{index + 1}.</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge[q.status] ?? statusBadge.submitted}`}>
                  {(q.status ?? 'submitted').toUpperCase()}
                </span>
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                  {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                </span>
                {q.creator && (
                  <span className="text-xs text-gray-500">by {q.creator.name}</span>
                )}
              </div>

              {/* Question text */}
              <p className="text-white text-base mb-4">{q.question_text}</p>

              {/* Options */}
              {q.options && (q.type === 'MCQ' || q.type === 'Multiple choice' || q.type === 'Single choice') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => {
                    const text = q.options?.[opt];
                    if (!text) return null;
                    const isCorrect = q.correct_answer === opt;
                    return (
                      <div
                        key={opt}
                        className={`p-2.5 rounded-lg border text-sm flex items-start gap-2 ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-gray-950 border-gray-800 text-gray-300'
                        }`}
                      >
                        <span className="font-bold uppercase w-4 shrink-0">{opt}.</span>
                        <span>{text}</span>
                        {isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single comment + approve block (only visible when questions exist) */}
      {!loading && questions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {/* Success banner */}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Overall Review Comment <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              disabled={!canEdit || isAlreadyActive}
              placeholder={
                isAlreadyActive
                  ? 'Paper already approved.'
                  : 'Write overall feedback, corrections, or notes for the question setter...'
              }
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 resize-none"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {questions.length} question{questions.length !== 1 ? 's' : ''} reviewed &nbsp;·&nbsp;
              Approving will set the exam status to <strong className="text-white">Active</strong>.
            </p>
            <button
              type="button"
              disabled={!canEdit || isAlreadyActive || approving}
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
            >
              <CheckCircle className="w-4 h-4" />
              {approving ? 'Approving...' : isAlreadyActive ? 'Already Approved' : 'Approve Paper'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
