import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import api from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';
import useCurrentUser from '../../hooks/useCurrentUser';

type PageMode = 'moderator' | 'invigilator';

type ExamPaper = {
  id: number;
  title?: string;
  paper_status?: string;
  questions?: Array<{ id: number; question_text?: string; marks?: number }>;
  instructions?: string | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export default function ExamRolePanel({ mode }: { mode: PageMode }) {
  const { id } = useParams();
  const currentUser = useCurrentUser();
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const examId = Number(id);

  const panelTitle = useMemo(() => {
    return mode === 'moderator' ? 'Moderator Panel' : 'Invigilator Panel';
  }, [mode]);

  async function loadPaper() {
    setError('');
    setMessage('');

    try {
      if (mode === 'moderator') {
        const res = await api.get(`/exam/${examId}/paper`);
        const data = extractApiData(res) ?? res.data;
        setPaper(data as ExamPaper);
        setMessage('Question paper loaded successfully.');
        return;
      }

      const liveRes = await api.get(`/exam/${examId}/live`);
      const instructionsRes = await api.get(`/exam/${examId}/instructions`);
      const liveData = extractApiData(liveRes) ?? liveRes.data;
      const instructionsData = extractApiData(instructionsRes) ?? instructionsRes.data;
      setPaper({ ...(liveData as ExamPaper), instructions: instructionsData?.instructions ?? '' });
      setMessage('Live exam paper and instructions loaded.');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load exam data.');
    }
  }

  async function markReviewed() {
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await api.post(`/exam/${examId}/review`, { comments });
      setMessage('Paper marked as reviewed.');
      await loadPaper();
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  async function approvePaper() {
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await api.post(`/exam/${examId}/approve`, { comments });
      setMessage('Paper approved successfully.');
      await loadPaper();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to approve paper.');
    } finally {
      setSubmitting(false);
    }
  }

  async function reportIncident() {
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await api.post(`/exam/${examId}/report`, {
        message: comments || `Incident reported by ${normalizeText(currentUser.email)}`,
        severity: 'medium',
      });
      setMessage('Incident reported successfully.');
      setComments('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to report incident.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{panelTitle}</h1>
          <p className="text-sm text-gray-400 mt-1">Exam #{examId}</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadPaper}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
            >
              {mode === 'moderator' ? 'Load Paper' : 'Load Live Paper'}
            </button>
            {mode === 'moderator' && (
              <>
                <button
                  onClick={markReviewed}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-60"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={approvePaper}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
                >
                  Approve Paper
                </button>
              </>
            )}
            {mode === 'invigilator' && (
              <button
                onClick={reportIncident}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold disabled:opacity-60"
              >
                Report Incident
              </button>
            )}
          </div>

          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={mode === 'moderator' ? 'Add review comments' : 'Describe suspicious activity'}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-950 border border-gray-700 text-sm"
          />

          {error && <div className="text-sm text-red-300">{error}</div>}
          {message && <div className="text-sm text-emerald-300">{message}</div>}
        </div>

        {paper && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <h2 className="text-lg font-semibold">{paper.title ?? 'Exam Paper'}</h2>
            <p className="text-sm text-gray-400">Status: {paper.paper_status ?? 'N/A'}</p>
            {paper.instructions && (
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1">Instructions</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{paper.instructions}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2">Questions</h3>
              <div className="space-y-2">
                {(paper.questions ?? []).map((q, index) => (
                  <div key={q.id} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <p className="text-sm text-gray-200">{index + 1}. {q.question_text ?? 'Untitled question'}</p>
                    <p className="text-xs text-gray-500 mt-1">Marks: {q.marks ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
