import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';

import api from '../api';
import useCurrentUser from '../hooks/useCurrentUser';

type ExamWithAssignments = {
  moderator?: { email?: string } | null;
  invigilator?: { email?: string } | null;
  questionSetter?: { email?: string } | null;
  question_setter?: { email?: string } | null;
  controller?: { email?: string } | null;
  start_time?: string | null;
  end_time?: string | null;
};

type ExamRoleKey = 'moderator' | 'invigilator' | 'question_setter' | 'controller';

interface ExamRoleAccessRouteProps {
  requiredRole: ExamRoleKey;
  requireLiveWindow?: boolean;
  children: ReactNode;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function resolveRoleEmail(exam: ExamWithAssignments, role: ExamRoleKey): string {
  if (role === 'moderator') return exam.moderator?.email ?? '';
  if (role === 'invigilator') return exam.invigilator?.email ?? '';
  if (role === 'controller') return exam.controller?.email ?? '';
  return exam.questionSetter?.email ?? exam.question_setter?.email ?? '';
}

function isWithinExamWindow(startTime?: string | null, endTime?: string | null): boolean {
  if (!startTime || !endTime) return false;
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return now >= start && now <= end;
}

export default function ExamRoleAccessRoute({ requiredRole, requireLiveWindow = false, children }: ExamRoleAccessRouteProps) {
  const { id } = useParams();
  const currentUser = useCurrentUser();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const examId = Number(id);
    if (!examId || Number.isNaN(examId)) {
      setAllowed(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    api.get(`/exams/${examId}`)
      .then((res) => {
        const exam = (res.data ?? {}) as ExamWithAssignments;
        const expectedEmail = normalizeText(resolveRoleEmail(exam, requiredRole));
        const controllerEmail = normalizeText(resolveRoleEmail(exam, 'controller'));
        const currentEmail = normalizeText(currentUser.email);
        const hasRole = Boolean(expectedEmail) && expectedEmail === currentEmail;
        const isController = Boolean(controllerEmail) && controllerEmail === currentEmail;

        if (!hasRole && !isController) {
          setAllowed(false);
          return;
        }

        if (requireLiveWindow && !isWithinExamWindow(exam.start_time, exam.end_time)) {
          setAllowed(false);
          return;
        }

        setAllowed(true);
      })
      .catch(() => {
        setAllowed(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [currentUser.email, id, requiredRole, requireLiveWindow]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center px-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm">
          Validating exam access...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <>{children}</>;
}
