import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CheckCircle, MessageSquare, ShieldCheck, XCircle, ArrowLeft } from 'lucide-react';
import api from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface ReviewQuestion {
  id: number;
  question_text: string;
  type: string;
  options: { a: string; b: string; c: string; d: string; };
  correct_answer: string;
  marks: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  review_comment: string | null;
  created_by?: { name: string; email: string };
}

export default function ModeratorReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentInput, setCommentInput] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchQuestions = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/exams/${id}/questions/review`);
      setQuestions(res.data);
      
      const comments: { [key: number]: string } = {};
      res.data.forEach((q: ReviewQuestion) => {
        comments[q.id] = q.review_comment || '';
      });
      setCommentInput(comments);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (questionId: number, status: 'reviewed' | 'approved') => {
    try {
      await api.post(`/questions/${questionId}/status`, { status });
      
      // Update local state
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status } : q));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleSaveComment = async (questionId: number) => {
    try {
      const comment = commentInput[questionId] || '';
      await api.post(`/questions/${questionId}/comment`, { review_comment: comment });
      
      // Update local state
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, review_comment: comment } : q));
      alert('Comment saved successfully.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save comment.');
    }
  };

  const statusColors = {
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    reviewed: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <DashboardLayout
      role="Teacher"
      navItems={[]} 
      activeItem=""
      onNavChange={() => {}}
      user={{ name: 'Moderator', role: 'teacher', email: 'moderator@example.com', initial: 'M' }}
      pageTitle="Moderator Review"
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => navigate(`/teacher/exams/new?examId=${id}&step=settings`)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Exam Dashboard
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Moderator Review
            </h1>
            <p className="text-gray-400 mt-1">Review questions, add comments, and approve for the final paper.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No questions found for this exam.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-400">Question {index + 1}</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[q.status || 'submitted']}`}>
                        {q.status ? q.status.toUpperCase() : 'SUBMITTED'}
                      </span>
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                        {q.marks} Marks
                      </span>
                      {q.created_by && (
                        <span className="text-xs text-gray-500">
                          By: {q.created_by.name}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium text-lg mt-1">{q.question_text}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0 ml-4">
                    {q.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, 'approved')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    
                    {q.status !== 'reviewed' && q.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, 'reviewed')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>

                {q.type === 'MCQ' || q.type === 'Multiple choice' || q.type === 'Single choice' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div 
                        key={opt} 
                        className={`p-3 rounded-lg border text-sm ${q.correct_answer === opt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-950 border-gray-800 text-gray-300'}`}
                      >
                        <span className="font-semibold uppercase mr-2">{opt}.</span>
                        {q.options && q.options[opt as keyof typeof q.options]}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-400">
                    Non-MCQ question type.
                  </div>
                )}

                <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-300">Moderator Comments</h4>
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      value={commentInput[q.id] || ''}
                      onChange={e => setCommentInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                      disabled={q.status === 'approved'}
                      placeholder={q.status === 'approved' ? 'Question approved. Comments locked.' : 'Write feedback...'}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      rows={2}
                    />
                    <button
                      onClick={() => handleSaveComment(q.id)}
                      disabled={q.status === 'approved' || commentInput[q.id] === q.review_comment}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                  {q.review_comment && typeof q.review_comment === 'string' && q.review_comment.length > 0 && commentInput[q.id] === q.review_comment && (
                    <p className="text-xs text-emerald-400 mt-2">✓ Comment saved</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
