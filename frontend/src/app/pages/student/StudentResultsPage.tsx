import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import type { StudentResult } from './studentTypes';

export default function StudentResultsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/student/results');
        const data = extractApiData(res);
        setResults(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const notifications = [
    {
      id: 'results-published',
      title: 'Result Publication Policy',
      message: 'Results appear only after controller publication.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];

  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="My Results"
      onNavChange={handleNav}
      user={{ name: 'Student', email: 'student@invigilore.com', initial: 'S', role: 'Student' }}
      notifications={notifications}
      pageTitle="Published Results"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Published Results</h2>
        <p className="text-sm text-gray-400">Results are visible only after official publication by Controller/Admin.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No published results yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-xs text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Exam</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Marks</th>
                <th className="px-4 py-3 text-left">Grade</th>
                <th className="px-4 py-3 text-left">Published</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.resultId} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-gray-100">{result.examName}</td>
                  <td className="px-4 py-3 text-gray-400">{result.courseName}</td>
                  <td className="px-4 py-3 text-gray-300">{result.score}/{result.totalMarks}</td>
                  <td className="px-4 py-3 text-teal-300">{result.grade ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(result.publishedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
