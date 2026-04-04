import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { TEACHER_PORTAL_NAV } from './teacherPortalNavigation';
import type { TeacherResultRow } from './teacherPortalData';
import api from '../../api';

const NAV_ITEMS: SidebarNavItem[] = TEACHER_PORTAL_NAV.map((item) => ({ label: item.label, icon: item.icon }));

type ResultsResponse = {
  success: boolean;
  data: TeacherResultRow[];
  meta?: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
};

export default function TeacherResultsDatabasePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<TeacherResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<ResultsResponse>('/teacher/portal/results-database', {
          params: {
            search: query || undefined,
          },
        });
        setRecords(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch {
        setError('Unable to load results database.');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadResults();
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNav = (label: string) => {
    const nav = TEACHER_PORTAL_NAV.find((item) => item.label === label);
    if (nav) navigate(nav.path);
  };

  const averageScore = useMemo(() => {
    if (!records.length) return 0;
    const total = records.reduce((sum, item) => sum + item.scorePercent, 0);
    return Math.round((total / records.length) * 100) / 100;
  }, [records]);

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="Results database"
      onNavChange={handleNav}
      user={{ name: 'Teacher', email: 'teacher@invigilore.com', initial: 'T', role: 'Teacher' }}
      pageTitle="Results database"
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Rows</p>
          <p className="mt-2 text-2xl font-semibold text-white">{records.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Average score</p>
          <p className="mt-2 text-2xl font-semibold text-white">{averageScore}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Search</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by test/respondent"
              className="w-full bg-transparent text-sm text-white outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading results...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200 inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-950 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Result ID</th>
                <th className="px-4 py-3 text-left font-medium">Test</th>
                <th className="px-4 py-3 text-left font-medium">Respondent</th>
                <th className="px-4 py-3 text-left font-medium">Score</th>
                <th className="px-4 py-3 text-left font-medium">Ended at</th>
                <th className="px-4 py-3 text-left font-medium">Time taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {records.map((record) => (
                <tr key={record.id} className="text-gray-200">
                  <td className="px-4 py-3">{record.id}</td>
                  <td className="px-4 py-3">{record.testName}</td>
                  <td className="px-4 py-3">{`${record.firstName} ${record.lastName}`.trim()}</td>
                  <td className="px-4 py-3">{record.scoreLabel} ({record.scorePercent}%)</td>
                  <td className="px-4 py-3">{record.endDate || '-'}</td>
                  <td className="px-4 py-3">{record.timeTaken}</td>
                </tr>
              ))}
              {!records.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No result records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
