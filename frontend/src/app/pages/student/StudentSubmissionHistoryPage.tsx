import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { extractApiData } from '../../utils/apiHelpers';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import type { StudentSubmission, SubmissionResultItem } from './studentTypes';

function getStoredUserId(): number | null {
  const raw = localStorage.getItem('invigilore_user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { id?: number | string };
    const id = Number(parsed?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function mapSubmission(item: SubmissionResultItem): StudentSubmission {
  return {
    attemptId: item.id,
    examId: item.exam_id,
    examName: item.exam?.title ?? `Exam #${item.exam_id}`,
    courseName: '-',
    submissionDateTime: item.evaluated_at ?? item.created_at,
    durationTakenMinutes: null,
    status: item.status ?? 'evaluated',
  };
}

export default function StudentSubmissionHistoryPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<StudentSubmission[]>([]);
  const [filter, setFilter] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const userId = getStoredUserId();
        if (!userId) {
          setRows([]);
          return;
        }

        const res = await api.get(`/users/${userId}/results`);
        const data = extractApiData(res);
        const list = Array.isArray(data) ? data as SubmissionResultItem[] : [];
        setRows(list.map(mapSubmission));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const data = useMemo(() => {
    const normalized = rows.filter((row) =>
      `${row.examName} ${row.courseName} ${row.status}`.toLowerCase().includes(filter.toLowerCase())
    );

    return normalized.sort((a, b) => {
      const left = new Date(a.submissionDateTime).getTime();
      const right = new Date(b.submissionDateTime).getTime();
      return sortNewest ? right - left : left - right;
    });
  }, [rows, filter, sortNewest]);

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const notifications = [
    {
      id: 'audit-retention',
      title: 'Submission Audit Enabled',
      message: 'Submission records are retained for secure review.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Submission History"
      onNavChange={handleNav}
      user={{ name: 'Student', email: 'student@invigilore.com', initial: 'S', role: 'Student' }}
      notifications={notifications}
      pageTitle="Submission History"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Submission History</h2>
          <p className="text-sm text-gray-400">Track all evaluated submissions from the new submission engine.</p>
        </div>

        <div className="flex gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter"
              className="rounded-lg border border-gray-800 bg-gray-900 py-2 pl-8 pr-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => setSortNewest((s) => !s)}
            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300"
          >
            {sortNewest ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No submissions found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-xs text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Exam</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.attemptId} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-gray-100">{row.examName}</td>
                  <td className="px-4 py-3 text-gray-400">{row.courseName}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(row.submissionDateTime).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{row.durationTakenMinutes ?? '-'} min</td>
                  <td className="px-4 py-3 text-gray-300">{row.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
