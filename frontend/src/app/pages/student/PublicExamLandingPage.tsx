import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, ArrowRight, AlertCircle, FileText, Clock } from 'lucide-react';
import api from '../../api';
import { setAuthToken } from '../../utils/authToken';
import { useAuthUser } from '../../context/AuthUserContext';

export default function PublicExamLandingPage() {
    const { user } = useAuthUser();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  useEffect(() => {
    if (!id || !token) {
      setError('Invalid access link. Missing token or exam identifier.');
      setLoading(false);
      return;
    }

    // Verify token and get exam info
    api.get(`/test/${id}?token=${token}`)
      .then(res => {
        setExam(res.data.exam);
        setRequireEmail(true); // Default to true if accessed via public link for identification
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to verify access link.');
        setLoading(false);
      });
  }, [id, token]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && requireEmail) {
      setError('Please enter your email address to proceed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/test/${id}/start`, {
        token: token,
        email: email.trim()
      });

      // Save token and navigate
      if (res.data.token) {
        setAuthToken(res.data.token, true);
      }

      navigate(`/student/exams/${id}/attempt`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to start the exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Verifying your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_40%)]">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Invigilore Secure</h1>
          <p className="text-gray-500 font-medium">Exam Entry Portal</p>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          {error ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <p className="text-rose-400 font-medium mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm text-emerald-500 font-bold hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 p-4 rounded-2xl bg-gray-950 border border-gray-800">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Ready to start</p>
                    <h2 className="text-sm font-bold truncate">{exam?.title}</h2>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    {exam?.duration || 'Timed'} Mins
                  </div>
                  <div className="w-1 h-1 bg-gray-800 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Proctored Session
                  </div>
                </div>
              </div>

              <form onSubmit={handleStart} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block px-1">
                    Enter your email to identify
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full bg-black/50 border border-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 group mt-6 cursor-pointer"
                >
                  {submitting ? 'Starting Session...' : 'Securely Entry Test'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-4">Safety Protocols Active</p>
                <div className="flex items-center justify-center gap-4 opacity-30 grayscale">
                  <div className="w-8 h-8 rounded bg-gray-800" />
                  <div className="w-8 h-8 rounded bg-gray-800" />
                  <div className="w-8 h-8 rounded bg-gray-800" />
                </div>
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-gray-600 font-medium">
          By entering, you agree to the institution's examination policies.<br/>
          Your session will be monitored for integrity.
        </p>
      </motion.div>
    </div>
  );
}
