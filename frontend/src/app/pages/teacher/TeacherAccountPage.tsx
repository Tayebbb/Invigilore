import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Loader2, Mail, UserCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { TEACHER_PORTAL_NAV } from './teacherPortalNavigation';
import type { TeacherTestRecord, TeacherResultRow } from './teacherPortalData';
import api from '../../api';

const NAV_ITEMS: SidebarNavItem[] = TEACHER_PORTAL_NAV.map((item) => ({ label: item.label, icon: item.icon }));

type MeResponse = {
  success?: boolean;
  user?: {
    id: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
  };
};

type TestsResponse = {
  success: boolean;
  data: TeacherTestRecord[];
};

type ResultsResponse = {
  success: boolean;
  data: TeacherResultRow[];
};

export default function TeacherAccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string; role: string }>({
    name: 'Teacher',
    email: 'teacher@invigilore.com',
    role: 'Teacher',
  });
  const [tests, setTests] = useState<TeacherTestRecord[]>([]);
  const [results, setResults] = useState<TeacherResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAccount() {
      setLoading(true);
      setError('');
      try {
        const [meRes, testsRes, resultsRes] = await Promise.all([
          api.get<MeResponse>('/me'),
          api.get<TestsResponse>('/teacher/portal/tests'),
          api.get<ResultsResponse>('/teacher/portal/results-database'),
        ]);

        const me = meRes.data?.user;
        const fullName = [me?.first_name, me?.middle_name, me?.last_name].filter(Boolean).join(' ').trim();
        setUser({
          name: fullName || 'Teacher',
          email: me?.email || 'teacher@invigilore.com',
          role: me?.role || 'Teacher',
        });
        setTests(Array.isArray(testsRes.data?.data) ? testsRes.data.data : []);
        setResults(Array.isArray(resultsRes.data?.data) ? resultsRes.data.data : []);
      } catch {
        setError('Unable to load account insights.');
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  const handleNav = (label: string) => {
    const nav = TEACHER_PORTAL_NAV.find((item) => item.label === label);
    if (nav) navigate(nav.path);
  };

  const activeTests = useMemo(() => tests.filter((test) => test.status === 'active').length, [tests]);
  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    return Math.round((results.reduce((sum, row) => sum + row.scorePercent, 0) / results.length) * 100) / 100;
  }, [results]);

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="My account"
      onNavChange={handleNav}
      user={{ name: user.name, email: user.email, initial: user.name.charAt(0).toUpperCase(), role: user.role }}
      pageTitle="My account"
    >
      {loading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading account data...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200 inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <p className="inline-flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> {user.name}</p>
              <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</p>
              <p>Role: <span className="font-semibold text-white">{user.role}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Total tests</p>
              <p className="mt-2 text-2xl font-semibold text-white">{tests.length}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Active tests</p>
              <p className="mt-2 text-2xl font-semibold text-white">{activeTests}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Average score</p>
              <p className="mt-2 text-2xl font-semibold text-white">{averageScore}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
