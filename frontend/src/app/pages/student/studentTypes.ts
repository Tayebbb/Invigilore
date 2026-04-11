export type StudentExamStatus = 'upcoming' | 'ongoing' | 'completed';

export interface StudentExam {
  id: number;
  examName: string;
  courseName: string;
  subjectCode?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: StudentExamStatus;
  attemptId?: number;
}

export interface StudentSubject {
  id: number;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  department?: string | null;
  creditHours?: number | null;
  description?: string | null;
}

export interface StudentAttemptQuestion {
  id: number;
  type: 'mcq' | 'true_false' | 'descriptive' | 'short_answer' | 'multiple_choice' | 'survey';
  questionText: string;
  options?: string[] | Record<string, string> | null;
  marks: number;
  selectedAnswer?: string | null;
}

export interface StudentAttemptPayload {
  attemptId: number;
  examId: number;
  examName: string;
  status: 'in_progress' | 'submitted' | 'timeout';
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: StudentAttemptQuestion[];
}

export interface StudentResult {
  resultId: number;
  examId: number;
  examName: string;
  courseName: string;
  score: number;
  totalMarks: number;
  grade: string;
  publishedAt: string;
  submittedAt: string;
  feedback?: string | null;
}

export interface StudentSubmission {
  attemptId: number;
  examId: number;
  examName: string;
  courseName: string;
  submissionDateTime: string;
  durationTakenMinutes: number | null;
  status: string;
}

export interface SubmissionResultItem {
  id: number;
  exam_id: number;
  exam?: {
    id: number;
    title: string;
  };
  status: string;
  score: number;
  total_marks: number;
  percentage: number;
  evaluated_at: string;
  created_at: string;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
