import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import type { StudentExam } from '../pages/student/studentTypes';

type ExamsResponse = {
  success: boolean;
  data: {
    upcoming: StudentExam[];
    ongoing: StudentExam[];
    completed: StudentExam[];
  };
};

export function useStudentExams() {
  const [upcoming, setUpcoming] = useState<StudentExam[]>([]);
  const [ongoing, setOngoing] = useState<StudentExam[]>([]);
  const [completed, setCompleted] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reload() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<ExamsResponse>('/student/exams');
      setUpcoming(response.data.data.upcoming ?? []);
      setOngoing(response.data.data.ongoing ?? []);
      setCompleted(response.data.data.completed ?? []);
    } catch {
      setError('Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const all = useMemo(() => [...upcoming, ...ongoing, ...completed], [upcoming, ongoing, completed]);

  return {
    upcoming,
    ongoing,
    completed,
    all,
    loading,
    error,
    reload,
  };
}
