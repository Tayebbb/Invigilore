import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';

import api from '../api';
import { Card, CardContent } from '../components/ui/card';
import useCurrentUser from '../hooks/useCurrentUser';

type ExamRolePayload = {
  questionSetter?: { email?: string } | null;
  question_setter?: { email?: string } | null;
  controller?: { email?: string } | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function getQuestionSetterEmail(exam: ExamRolePayload | null): string {
  return exam?.questionSetter?.email ?? exam?.question_setter?.email ?? '';
}

function getControllerEmail(exam: ExamRolePayload | null): string {
  return exam?.controller?.email ?? '';
}

interface ExamQuestionSetterRouteProps {
  children: ReactNode;
}

export default function ExamQuestionSetterRoute({ children }: ExamQuestionSetterRouteProps) {
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
        const setterEmail = normalizeText(getQuestionSetterEmail(res.data));
        const controllerEmail = normalizeText(getControllerEmail(res.data));
        const currentEmail = normalizeText(currentUser.email);
        const isSetter = Boolean(setterEmail) && setterEmail === currentEmail;
        const isController = Boolean(controllerEmail) && controllerEmail === currentEmail;
        setAllowed(isSetter || isController);
      })
      .catch(() => {
        setAllowed(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [currentUser.email, id]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <Card className="max-w-sm w-full border-border">
          <CardContent className="px-4 py-3 text-sm text-muted-foreground">
          Checking Question Setter access...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <>{children}</>;
}
