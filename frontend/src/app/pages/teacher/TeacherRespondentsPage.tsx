import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Clock, Loader2, UserSquare2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import { TEACHER_PORTAL_NAV } from './teacherPortalNavigation';
import type { TeacherRespondentRow } from './teacherPortalData';
import api from '../../api';

const NAV_ITEMS: SidebarNavItem[] = TEACHER_PORTAL_NAV.map((item) => ({ label: item.label, icon: item.icon }));

type RespondentsResponse = {
  success: boolean;
  data: TeacherRespondentRow[];
};

export default function TeacherRespondentsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<TeacherRespondentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRespondents() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<RespondentsResponse>('/teacher/portal/respondents');
        setItems(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch {
        setError('Unable to load respondents.');
      } finally {
        setLoading(false);
      }
    }

    loadRespondents();
  }, []);

  const handleNav = (label: string) => {
    const nav = TEACHER_PORTAL_NAV.find((item) => item.label === label);
    if (nav) navigate(nav.path);
  };

  const activeCount = useMemo(() => items.filter((item) => item.status === 'in_progress').length, [items]);

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="Respondents"
      onNavChange={handleNav}
      user={{ name: 'Teacher', email: 'teacher@invigilore.com', initial: 'T', role: 'Teacher' }}
      pageTitle="Respondents"
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total respondents</p>
          <p className="mt-2 text-2xl font-semibold text-white">{items.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">In progress</p>
          <p className="mt-2 text-2xl font-semibold text-white">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-white">{items.length - activeCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading respondents...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200 inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.attemptId}-${item.name}`} className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-white">{item.name}</p>
                <p className="text-sm text-gray-400">{item.testName}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1"><UserSquare2 className="h-4 w-4" /> Attempt #{item.attemptId}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {item.startedAt ? new Date(item.startedAt).toLocaleString() : 'Not started'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'in_progress' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-700 text-gray-100'}`}>
                  {item.status === 'in_progress' ? 'In progress' : 'Completed'}
                </span>
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-sm text-gray-400">
              No respondents found.
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
