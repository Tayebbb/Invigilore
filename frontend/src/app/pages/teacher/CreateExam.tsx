import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  AlertCircle,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  FileCheck2,
  FileText,
  Flag,
  Globe,
  LayoutDashboard,
  Languages,
  Lock,
  Loader2,
  Plus,
  Printer,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';

import api from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser from '../../hooks/useCurrentUser';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'My Exams', icon: ClipboardList },
  { label: 'Question Bank', icon: FileText },
  { label: 'Create Exam', icon: Plus },
  { label: 'Student Results', icon: SlidersHorizontal },
  { label: 'Notifications', icon: CircleHelp, badge: '2' },
];

const STEPS = [
  { label: 'Basic settings', icon: Settings, active: true },
  { label: 'Questions manager', icon: FileText, active: false },
  { label: 'Test sets', icon: ClipboardList, active: false },
  { label: 'Test access', icon: Lock, active: false },
  { label: 'Test start page', icon: FileCheck2, active: false },
  { label: 'Grading & summary', icon: CircleCheck, active: false },
  { label: 'Time settings', icon: Flag, active: false },
  { label: 'Certificate template', icon: Printer, active: false },
] as const;

const CATEGORIES = ['python', 'java', 'javascript', 'database'];
const LANGUAGES = ['English', 'French', 'Spanish'];

export default function CreateExam() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const teacherUser = useMemo(() => ({
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Teacher' as const,
  }), [currentUser]);

  const [testName, setTestName] = useState('mytest');
  const [category, setCategory] = useState('python');
  const [description, setDescription] = useState('python exam');
  const [language, setLanguage] = useState('English');
  const [subjectId, setSubjectId] = useState('1');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [questionSetterEmail, setQuestionSetterEmail] = useState('');
  const [moderatorEmail, setModeratorEmail] = useState('');
  const [invigilatorEmail, setInvigilatorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleNavChange(label: string) {
    if (label === 'Dashboard') {
      navigate('/teacher/dashboard');
      return;
    }
    if (label === 'Create Exam') {
      return;
    }
  }

  async function handleCreateExam() {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!startTime || !endTime) {
        throw new Error('Start time and end time are required.');
      }

      const payload = {
        title: testName,
        subject_id: Number(subjectId),
        duration: Number(duration),
        total_marks: Number(totalMarks),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        question_setter_email: questionSetterEmail || null,
        moderator_email: moderatorEmail || null,
        invigilator_email: invigilatorEmail || null,
      };

      await api.post('/exams', payload);
      setSuccess('Exam created. You are set as controller by default.');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const first = Object.values(apiErrors).flat()[0];
        setError(String(first));
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to create exam.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="Create Exam"
      onNavChange={handleNavChange}
      user={teacherUser}
      notificationCount={2}
      pageTitle="Create New Exam"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Create New Exam</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
              Test info
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
              Preview
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
          >
            <div className="mb-4">
              <span className="inline-flex text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
                Setup in progress
              </span>
            </div>

            <div className="mb-5">
              <p className="text-sm font-semibold text-white">Test configuration</p>
              <p className="text-xs text-gray-400 mt-1">83% completed</p>
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full w-[83%] bg-gradient-to-r from-emerald-500 to-cyan-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.label}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer
                      ${step.active
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCreateExam}
              disabled={submitting}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Activating...</span>
              ) : (
                <span>Activate test</span>
              )}
            </button>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5">Basic settings</h3>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {success}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Test name</label>
                  <input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1.5">Select test category to keep track of your tests.</p>
                  </div>

                  <button className="md:mb-5 px-3.5 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Create category
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">Add test description for identification purposes. It will be visible to you only.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Test language</label>
                  <div className="relative">
                    <Languages className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {LANGUAGES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Subject ID</label>
                    <input
                      type="number"
                      min={1}
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Duration (mins)</label>
                    <input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Total marks</label>
                    <input
                      type="number"
                      min={1}
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Start time</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">End time</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="pt-1 border-t border-gray-800">
                  <h4 className="text-sm font-semibold text-white mb-3">Role Assignment by Email</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    You are the default Controller for this exam. Assign setter, moderator, and invigilator using faculty email addresses.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Question Setter Email</label>
                      <input
                        type="email"
                        value={questionSetterEmail}
                        onChange={(e) => setQuestionSetterEmail(e.target.value)}
                        placeholder="setter@university.edu"
                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Moderator Email</label>
                      <input
                        type="email"
                        value={moderatorEmail}
                        onChange={(e) => setModeratorEmail(e.target.value)}
                        placeholder="moderator@university.edu"
                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Invigilator Email</label>
                      <input
                        type="email"
                        value={invigilatorEmail}
                        onChange={(e) => setInvigilatorEmail(e.target.value)}
                        placeholder="invigilator@university.edu"
                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Logo</h4>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-300 mt-0.5" />
                  <div>
                    <p className="text-sm text-cyan-200 font-medium">Logo visibility</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Logo is visible in online and printable version of the test.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </DashboardLayout>
  );
}
