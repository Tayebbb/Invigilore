export type TeacherTestStatus = 'setup_in_progress' | 'active';

export interface TeacherTestRecord {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  category: string;
  status: TeacherTestStatus;
  averageScore?: number | null;
  resultCount?: number;
}

export interface TeacherTestInfo {
  id: number;
  title: string;
  status: TeacherTestStatus;
  createdAt: string;
  activeRespondents: number;
  averageScore: number;
  resultCount: number;
  summary: string[];
}

export interface TeacherResultRow {
  id: number;
  testName: string;
  lastName: string;
  firstName: string;
  scorePercent: number;
  scoreLabel: string;
  endDate: string;
  timeTaken: string;
}

export interface TeacherRespondentRow {
  attemptId: number;
  testName: string;
  name: string;
  email: string;
  startedAt: string | null;
  status: string;
}
