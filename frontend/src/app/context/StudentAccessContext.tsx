import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '../api';
import type { StudentExam, StudentSubject } from '../pages/student/studentTypes';
import { isStudentRole } from '../navigation/roleRoutes';

type ExamsResponse = {
  success?: boolean;
  data?: {
    upcoming?: StudentExam[];
    ongoing?: StudentExam[];
    completed?: StudentExam[];
  };
};

type SubjectsResponse = {
  success?: boolean;
  data?: StudentSubject[];
};

interface StudentAccessState {
  subjects: StudentSubject[];
  upcoming: StudentExam[];
  ongoing: StudentExam[];
  completed: StudentExam[];
  loading: boolean;
  error: string;
  warnings: string[];
  refresh: () => Promise<void>;
}

const StudentAccessContext = createContext<StudentAccessState | null>(null);

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function deriveSubjectsFromExams(exams: StudentExam[]): StudentSubject[] {
  const seen = new Set<string>();
  const derived: StudentSubject[] = [];

  exams.forEach((exam, index) => {
    const code = exam.subjectCode?.trim();
    const name = exam.courseName?.trim();
    if (!code && !name) {
      return;
    }

    const key = `${normalize(code)}::${normalize(name)}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    derived.push({
      id: index + 1,
      subjectId: code || `SUBJ-${index + 1}`,
      subjectName: name || code || 'Unnamed Subject',
      subjectCode: code || 'N/A',
      department: null,
      creditHours: null,
      description: null,
    });
  });

  return derived;
}

function filterAssociatedSubjects(subjects: StudentSubject[], exams: StudentExam[]) {
  const subjectCodes = new Set(exams.map((exam) => normalize(exam.subjectCode)).filter(Boolean));
  const subjectNames = new Set(exams.map((exam) => normalize(exam.courseName)).filter(Boolean));

  if (subjectCodes.size === 0 && subjectNames.size === 0) {
    return [];
  }

  return subjects.filter((subject) => {
    const code = normalize(subject.subjectCode);
    const name = normalize(subject.subjectName);
    return subjectCodes.has(code) || subjectNames.has(name);
  });
}

function parseExamGroups(payload?: ExamsResponse['data']) {
  return {
    upcoming: payload?.upcoming ?? [],
    ongoing: payload?.ongoing ?? [],
    completed: payload?.completed ?? [],
  };
}

export function StudentAccessProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [upcoming, setUpcoming] = useState<StudentExam[]>([]);
  const [ongoing, setOngoing] = useState<StudentExam[]>([]);
  const [completed, setCompleted] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const rawUser = localStorage.getItem('invigilore_user');
    const token = localStorage.getItem('token');

    if (!rawUser || !token) {
      setSubjects([]);
      setUpcoming([]);
      setOngoing([]);
      setCompleted([]);
      setLoading(false);
      setError('');
      setWarnings([]);
      return;
    }

    let userRole = '';
    try {
      userRole = JSON.parse(rawUser)?.role ?? '';
    } catch {
      userRole = '';
    }

    if (!isStudentRole(userRole)) {
      setSubjects([]);
      setUpcoming([]);
      setOngoing([]);
      setCompleted([]);
      setLoading(false);
      setError('');
      setWarnings([]);
      return;
    }

    setLoading(true);
    setError('');
    setWarnings([]);

    const [examsResult, subjectsResult] = await Promise.allSettled([
      api.get<ExamsResponse>('/student/exams'),
      api.get<SubjectsResponse>('/subjects', { params: { limit: 100 } }),
    ]);

    const nextWarnings: string[] = [];
    let nextUpcoming: StudentExam[] = [];
    let nextOngoing: StudentExam[] = [];
    let nextCompleted: StudentExam[] = [];
    let nextSubjects: StudentSubject[] = [];

    if (examsResult.status === 'fulfilled') {
      const groups = parseExamGroups(examsResult.value.data?.data);
      nextUpcoming = groups.upcoming;
      nextOngoing = groups.ongoing;
      nextCompleted = groups.completed;
    } else {
      nextWarnings.push('Exams are temporarily unavailable.');
    }

    if (subjectsResult.status === 'fulfilled') {
      nextSubjects = subjectsResult.value.data?.data ?? [];
    } else {
      nextWarnings.push('Subject details could not be loaded.');
    }

    const allExams = [...nextUpcoming, ...nextOngoing, ...nextCompleted];
    const associatedFromApi = filterAssociatedSubjects(nextSubjects, allExams);

    if (associatedFromApi.length > 0) {
      setSubjects(associatedFromApi);
    } else {
      setSubjects(deriveSubjectsFromExams(allExams));
    }

    setUpcoming(nextUpcoming);
    setOngoing(nextOngoing);
    setCompleted(nextCompleted);

    if (examsResult.status === 'rejected' && subjectsResult.status === 'rejected') {
      setError('Unable to load student access data right now. Please try again.');
    }

    setWarnings(nextWarnings);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<StudentAccessState>(() => ({
    subjects,
    upcoming,
    ongoing,
    completed,
    loading,
    error,
    warnings,
    refresh,
  }), [subjects, upcoming, ongoing, completed, loading, error, warnings, refresh]);

  return (
    <StudentAccessContext.Provider value={value}>
      {children}
    </StudentAccessContext.Provider>
  );
}

export function useStudentAccess() {
  const context = useContext(StudentAccessContext);
  if (!context) {
    throw new Error('useStudentAccess must be used within StudentAccessProvider');
  }
  return context;
}
