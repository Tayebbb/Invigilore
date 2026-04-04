import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Loader2, Plus, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { TEACHER_PORTAL_NAV } from './teacherPortalNavigation';
import type { TeacherTestRecord } from './teacherPortalData';
import api from '../../api';

const NAV_ITEMS: SidebarNavItem[] = TEACHER_PORTAL_NAV.map((item) => ({ label: item.label, icon: item.icon }));

function statusChip(status: TeacherTestRecord['status']) {
  if (status === 'active') {
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  }
  return 'bg-violet-500/15 text-violet-300 border border-violet-500/30';
}

type TestsResponse = {
  success: boolean;
  data: TeacherTestRecord[];
};

export default function TeacherTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TeacherTestRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TeacherTestRecord['status']>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<TestsResponse>('/teacher/portal/tests', {
          params: {
            search: query || undefined,
            status: statusFilter,
          },
        });
        setTests(response.data?.data ?? []);
      } catch {
        setError('Unable to load tests right now.');
        setTests([]);
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, [query, statusFilter]);

  const handleNav = (label: string) => {
    const nav = TEACHER_PORTAL_NAV.find((item) => item.label === label);
    if (nav) navigate(nav.path);
  };

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="My tests"
      onNavChange={handleNav}
      user={{ name: 'Teacher', email: 'teacher@invigilore.com', initial: 'T', role: 'Teacher' }}
      pageTitle="My tests"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">My tests ({tests.length})</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          New test
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
          <p className="mb-1 text-xs text-gray-400">Status</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | TeacherTestRecord['status'])}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
          >
            <option value="all">All</option>
            <option value="setup_in_progress">Setup in progress</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div className="md:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-3">
          <p className="mb-1 text-xs text-gray-400">Search</p>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find tests"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 py-2 pl-9 pr-3 text-sm text-gray-100"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {tests.map((test) => (
            <button
              key={test.id}
              type="button"
              onClick={() => navigate(`/teacher/tests/${test.id}`)}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-left transition-colors hover:bg-gray-800/50"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusChip(test.status)}`}>
                  {test.status === 'active' ? 'Active' : 'Setup in progress'}
                </span>
                <span className="text-xs text-gray-500">Created: {test.createdAt}</span>
              </div>

              <h3 className="text-2xl font-semibold text-white">{test.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{test.description}</p>

              <div className="mt-5 flex items-center justify-between">
                {typeof test.averageScore === 'number' ? (
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{test.averageScore}%</span> avg. score | Results ({test.resultCount ?? 0})
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Ready to configure and activate</p>
                )}
                <span className="rounded-md border border-gray-700 px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase">
                  {test.category}
                </span>
              </div>
            </button>
          ))}

          {!tests.length && (
            <div className="col-span-full rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
              No tests available yet.
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
