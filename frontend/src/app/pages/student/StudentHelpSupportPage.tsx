import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle, Send, ChevronDown, ChevronUp,
  MessageSquare, HelpCircle, BookOpen, CheckCircle,
  Zap, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import useCurrentUser from '../../hooks/useCurrentUser';

const FAQS = [
  {
    q: "Why can't I enter my exam yet?",
    a: 'Exam access is only allowed inside the official time window configured by your controller or exam administrator.',
    icon: Shield,
  },
  {
    q: 'What if my connection drops during an exam?',
    a: 'Your session can be resumed if the attempt remains active; answers are auto-saved periodically to reduce data loss.',
    icon: Zap,
  },
  {
    q: 'Why are my results hidden?',
    a: 'Results are only visible after official publication by the controller.',
    icon: BookOpen,
  },
  {
    q: 'What should I do if submission fails?',
    a: 'Refresh the page once, then contact support with the exam name, time, and the issue you observed.',
    icon: AlertCircle,
  },
];

const CATEGORIES = ['Technical Issue', 'Exam Issue', 'Account Issue', 'Other'];

export default function StudentHelpSupportPage() {
  const navigate  = useNavigate();
  const currentUser = useCurrentUser();

  const [openIndex,  setOpenIndex]  = useState<number | null>(0);
  const [subject,    setSubject]    = useState('');
  const [category,   setCategory]   = useState(CATEGORIES[0]);
  const [message,    setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets,    setTickets]    = useState<any[]>([]);
  const [status,     setStatus]     = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await api.get('/student/support-tickets');
        const data = response.data?.data ?? response.data;
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setTickets([]);
      }
    }
    loadTickets();
  }, []);

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) navigate(route);
  };

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError('');
    setStatus('');
    try {
      await api.post('/student/support-tickets', { subject, category, message });
      setSubject('');
      setCategory(CATEGORIES[0]);
      setMessage('');
      setStatus('Support request submitted successfully!');
      const response = await api.get('/student/support-tickets');
      const data = response.data?.data ?? response.data;
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to submit support request.');
    } finally {
      setSubmitting(false);
    }
  };

  const notifications = [
    { id: '1', title: 'Help Center', message: 'Support center is open.', timestamp: new Date().toISOString(), read: false },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Help & Support"
      onNavChange={handleNav}
      user={{
        name:    currentUser?.name  ?? 'Student',
        email:   currentUser?.email ?? '',
        role:    'student',
        initial: (currentUser?.name?.[0] ?? 'S').toUpperCase(),
      }}
      pageTitle="Help & Support"
      notifications={notifications}
    >
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">Support Center</span>
        </div>
        <h1 className="text-3xl font-bold text-white leading-tight">
          How can we{' '}
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            help you?
          </span>
        </h1>
        <p className="text-gray-400 mt-2 text-base">
          Browse the FAQ or submit a support ticket and we'll get back to you.
        </p>
      </motion.div>

      {/* Status / Error banner */}
      <AnimatePresence>
        {(error || status) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
            {error || status}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── LEFT: FAQ + Contact Form ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, index) => {
                const Icon = faq.icon;
                const isOpen = openIndex === index;
                return (
                  <motion.div
                    key={faq.q}
                    initial={false}
                    className={`rounded-xl border transition-colors duration-200 ${
                      isOpen ? 'border-blue-500/30 bg-blue-500/5' : 'border-gray-800 bg-gray-950 hover:border-gray-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isOpen ? 'bg-blue-500/20' : 'bg-gray-800'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isOpen ? 'text-blue-400' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-200'}`}>
                          {faq.q}
                        </span>
                      </div>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                      }
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pl-14 text-sm text-gray-400 leading-relaxed">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-white">Submit a Support Request</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-600">We typically respond within 24 hours.</p>
              <button
                type="button"
                onClick={submitTicket}
                disabled={submitting || !subject.trim() || !message.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Guidelines + Previous Tickets ── */}
        <div className="space-y-6">

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
          >
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Support Guidelines
            </h3>
            <ul className="space-y-3">
              {[
                'Include the exam name and date if the issue is exam-related.',
                'Response times are faster for clear, concise tickets.',
                'Avoid sharing passwords or private tokens in messages.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Previous Tickets */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
          >
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Previous Requests
            </h3>
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No support tickets yet.</p>
                </div>
              ) : (
                tickets.map((ticket) =>
                  ticket?.id && ticket?.subject ? (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-gray-800 bg-gray-950 p-3 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white leading-snug">{ticket.subject}</p>
                        <span
                          className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                            ticket.status === 'resolved'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{ticket.category}</p>
                    </div>
                  ) : null
                )
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </DashboardLayout>
  );
}
