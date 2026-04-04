import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, Check, Loader2, Play, Square } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { TEACHER_PORTAL_NAV } from './teacherPortalNavigation';
import type { TeacherTestInfo, TeacherTestStatus } from './teacherPortalData';
import api from '../../api';

const NAV_ITEMS: SidebarNavItem[] = TEACHER_PORTAL_NAV.map((item) => ({ label: item.label, icon: item.icon }));

type TestInfoResponse = {
  success: boolean;
  data: TeacherTestInfo;
};

export default function TeacherTestInfoPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [test, setTest] = useState<TeacherTestInfo | null>(null);
  const [status, setStatus] = useState<TeacherTestStatus>('setup_in_progress');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      if (!testId) return;
      setLoading(true);
      setError('');
      try {
        const response = await api.get<TestInfoResponse>(`/teacher/portal/tests/${testId}`);
        setTest(response.data?.data ?? null);
        setStatus(response.data?.data?.status ?? 'setup_in_progress');
      } catch {
        setError('Unable to load test information.');
      } finally {
        setLoading(false);
      }
    }

    loadInfo();
  }, [testId]);

  const handleNav = (label: string) => {
    const nav = TEACHER_PORTAL_NAV.find((item) => item.label === label);
    if (nav) navigate(nav.path);
  };

  async function activateTest() {
    if (!testId) return;
    setActionLoading(true);
    try {
      await api.post(`/teacher/portal/tests/${testId}/activate`);
      setStatus('active');
    } finally {
      setActionLoading(false);
    }
  }

  async function endTest() {
    if (!testId) return;
    setActionLoading(true);
    try {
      await api.post(`/teacher/portal/tests/${testId}/end`);
      setStatus('setup_in_progress');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="My tests"
      onNavChange={handleNav}
      user={{ name: 'Teacher', email: 'teacher@invigilore.com', initial: 'T', role: 'Teacher' }}
      pageTitle={test?.title ?? 'Test info'}
    >
      {loading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300">
          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading test info...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200 inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Test info</h2>
              <p className="text-sm text-gray-400">Configuration summary and activation status</p>
            </div>
            {status === 'active' ? (
              <button
                type="button"
                onClick={endTest}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Square className="h-4 w-4" /> End test
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Activate test
              </button>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-300">{test?.title}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">Status: <span className="font-semibold text-white">{status === 'active' ? 'Active' : 'Setup in progress'}</span></div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">Active respondents: <span className="font-semibold text-white">{test?.activeRespondents ?? 0}</span></div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">Avg score: <span className="font-semibold text-white">{test?.averageScore ?? 0}%</span></div>
            </div>

            <div className="space-y-2">
              {(test?.summary ?? []).map((line) => (
                <div key={line} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm text-gray-300">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setConfirmOpen(false)} />
              <div className="relative w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6">
                <h3 className="text-2xl font-semibold text-white">Test activation</h3>
                <p className="mt-3 text-lg text-gray-300">
                  Are you sure you want to activate this test? Make sure all settings are correct.
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-lg border border-gray-600 px-6 py-2 text-lg font-semibold text-gray-200"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await activateTest();
                      setConfirmOpen(false);
                    }}
                    className="rounded-lg bg-emerald-600 px-6 py-2 text-lg font-semibold text-white"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
