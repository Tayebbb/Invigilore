import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Send } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';

const FAQS = [
  {
    q: 'Why can\'t I enter my exam yet?',
    a: 'Exam access is only allowed inside the official time window configured by your controller or exam administrator.',
  },
  {
    q: 'What if my connection drops during an exam?',
    a: 'Your session can be resumed if the attempt remains active; answers are auto-saved periodically to reduce data loss.',
  },
  {
    q: 'Why are my results hidden?',
    a: 'Results are only visible after official publication by the controller.',
  },
  {
    q: 'What should I do if submission fails?',
    a: 'Refresh the page once, then contact support with the exam name, time, and the issue you observed.',
  },
];

export default function StudentHelpSupportPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await api.get('/student/support-tickets');
        setTickets(response.data?.data ?? []);
      } catch {
        setTickets([]);
      }
    }

    loadTickets();
  }, []);

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const submitTicket = async () => {
    setSubmitting(true);
    setError('');
    setStatus('');

    try {
      await api.post('/student/support-tickets', { subject, category, message });
      setSubject('');
      setCategory('Technical Issue');
      setMessage('');
      setStatus('Support request submitted successfully');
      const response = await api.get('/student/support-tickets');
      setTickets(response.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to submit support request');
    } finally {
      setSubmitting(false);
    }
  };

  const notifications = [
    {
      id: 'support',
      title: 'Help Center',
      message: 'Submit a ticket for technical, exam, or account issues.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Help & Support"
      onNavChange={handleNav}
      user={{ name: 'Student', email: 'student@invigilore.com', initial: 'S', role: 'Student' }}
      notifications={notifications}
      pageTitle="Help & Support"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Help & Support</h2>
        <p className="text-sm text-gray-400">Find answers quickly or contact support for assistance.</p>
      </div>

      {(error || status) && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${error ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
          <AlertCircle className="h-4 w-4" />
          {error || status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-5">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-base font-semibold text-white">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {FAQS.map((faq, index) => (
                <div key={faq.q} className="rounded-lg border border-gray-800 bg-gray-950">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-gray-100">{faq.q}</span>
                    <span className="text-gray-400">{openIndex === index ? '−' : '+'}</span>
                  </button>
                  {openIndex === index && <div className="px-4 pb-4 text-sm text-gray-400">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-base font-semibold text-white">Contact Support</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">Subject</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100">
                  <option>Technical Issue</option>
                  <option>Exam Issue</option>
                  <option>Account Issue</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-gray-400">Message</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100" />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={submitTicket} disabled={submitting || !subject.trim() || !message.trim()} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-3 text-base font-semibold text-white">Support Guidelines</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Include the exam name and date if the issue is exam-related.</li>
              <li>• Response times are faster for clear, concise tickets.</li>
              <li>• Avoid sharing passwords or private tokens in messages.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-3 text-base font-semibold text-white">Previous Requests</h3>
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <p className="text-sm text-gray-500">No support tickets yet.</p>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{ticket.subject}</p>
                      <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{ticket.category}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
