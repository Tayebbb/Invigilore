import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import {
  AlertCircle,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  FileCheck2,
  FileText,
  Flag,
  Globe,
  LayoutDashboard,
  Languages,
  Lock,
  Loader2,
  Plus,
  Printer,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import api from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser from '../../hooks/useCurrentUser';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Question Bank', icon: FileText },
  { label: 'Create Exam', icon: Plus },
  { label: 'Student Results', icon: SlidersHorizontal },
  { label: 'Notifications', icon: CircleHelp, badge: '2' },
];

const STEPS = [
  { key: 'basic', label: 'Basic settings', icon: Settings },
  { key: 'questions', label: 'Questions manager', icon: FileText },
  { key: 'moderator', label: 'Moderator review', icon: CircleCheck },
  { key: 'invigilator', label: 'Invigilator panel', icon: Lock },
  { key: 'test_access', label: 'Test access', icon: ClipboardList },
  { key: 'grading', label: 'Grading & summary', icon: CircleCheck },
  { key: 'time', label: 'Time settings', icon: Flag },
  { key: 'certificate', label: 'Certificate template', icon: Printer },
  { key: 'activate', label: 'Activate test', icon: FileCheck2 },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

type QuestionDraft = {
  id: number;
  category: string;
  answerType: 'Single choice' | 'Multiple choice' | 'Descriptive' | 'True/False' | 'Short answer' | 'Survey';
  questionText: string;
  answers: string[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  marks?: number;
};

type ApiQuestion = {
  id: number;
  question_text?: string;
  type?: string;
  options?: Record<string, string> | null;
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  marks?: number;
};

type AccessChannel = 'web' | 'teams';
type AccessType = 'public' | 'private' | 'group' | 'training';

const CATEGORIES = ['python', 'java', 'javascript', 'database'];
const LANGUAGES = ['English', 'French', 'Spanish'];

type ExamContext = {
  id: number;
  controller_id?: number | null;
  title?: string;
  subject_id?: number | null;
  duration?: number | string | null;
  total_marks?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  question_setter?: { email?: string } | null;
  questionSetter?: { email?: string } | null;
  moderator?: { email?: string } | null;
  invigilator?: { email?: string } | null;
  teacher?: { email?: string } | null;
  controller?: { email?: string } | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getSetterEmail(exam: ExamContext): string {
  return exam.questionSetter?.email ?? exam.question_setter?.email ?? '';
}

function getExamLabel(title: string): string {
  const normalized = title.trim();
  return normalized || 'Untitled exam';
}

function mapApiTypeToAnswerType(value?: string): QuestionDraft['answerType'] {
  if (value === 'mcq') return 'Single choice';
  if (value === 'true_false') return 'True/False';
  if (value === 'descriptive') return 'Descriptive';
  return 'Single choice';
}

function mapDraftTypeToApi(value: QuestionDraft['answerType']): 'mcq' | 'true_false' | 'descriptive' {
  if (value === 'True/False') return 'true_false';
  if (value === 'Descriptive' || value === 'Short answer' || value === 'Survey') return 'descriptive';
  return 'mcq';
}

function mapApiQuestionToDraft(question: ApiQuestion): QuestionDraft {
  const options = question.options && typeof question.options === 'object'
    ? Object.values(question.options).filter(Boolean)
    : [];

  return {
    id: question.id,
    category: 'Generic',
    answerType: mapApiTypeToAnswerType(question.type),
    questionText: String(question.question_text ?? ''),
    answers: options,
    correctAnswer: question.correct_answer ?? 'A',
    marks: question.marks ?? 1,
  };
}

export default function CreateExam() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: examIdFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const currentUser = useCurrentUser();

  const teacherUser = useMemo(() => ({
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Teacher' as const,
  }), [currentUser]);

  const currentUserId = Number((currentUser as { id?: number | string }).id ?? NaN);

  const roleKey = String((currentUser as { roleKey?: string }).roleKey ?? 'teacher').toLowerCase();
  const canCreateExam = roleKey === 'teacher' || roleKey === 'controller' || roleKey === 'admin';
  const canAssignRoles = canCreateExam;

  const examIdParam = searchParams.get('examId');
  const examIdCandidate = examIdFromPath ?? examIdParam;
  const examId = examIdCandidate ? Number(examIdCandidate) : null;
  const requestedStep = String(searchParams.get('step') ?? '').toLowerCase();
  const shouldOpenQuestions = requestedStep === 'questions' || Boolean(examIdFromPath);
  const [examContext, setExamContext] = useState<ExamContext | null>(null);
  const [setterExams, setSetterExams] = useState<ExamContext[]>([]);
  const [loadingExam, setLoadingExam] = useState(false);

  const [testName, setTestName] = useState('mytest');
  const [category, setCategory] = useState('python');
  const [description, setDescription] = useState('python exam');
  const [language, setLanguage] = useState('English');
  const [subjectId, setSubjectId] = useState('1');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [questionSetterEmail, setQuestionSetterEmail] = useState('');
  const [moderatorEmail, setModeratorEmail] = useState('');
  const [invigilatorEmail, setInvigilatorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState<StepKey>('basic');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionCategory, setQuestionCategory] = useState('Generic');
  const [questionType, setQuestionType] = useState<QuestionDraft['answerType']>('Single choice');
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [questionMarks, setQuestionMarks] = useState('1');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [accessChannel, setAccessChannel] = useState<AccessChannel>('web');
  const [accessType, setAccessType] = useState<AccessType>('public');
  const [requirePublicEmail, setRequirePublicEmail] = useState(false);
  const [publicAccessLink, setPublicAccessLink] = useState('');
  const [privateEmailsInput, setPrivateEmailsInput] = useState('');
  const [privateLinks, setPrivateLinks] = useState<Array<{ email: string; link: string }>>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  const normalizedCurrentUserEmail = normalizeText(currentUser.email);

  const isAssignedQuestionSetterOnCurrentExam =
    !!examContext &&
    normalizeText(getSetterEmail(examContext)) === normalizedCurrentUserEmail;

  const isControllerOnCurrentExam =
    !!examContext && (
      (Number.isFinite(currentUserId) && examContext.controller_id === currentUserId) ||
      normalizeText(examContext.controller?.email) === normalizedCurrentUserEmail
    );

  const isModeratorOnCurrentExam =
    !!examContext &&
    normalizeText(examContext.moderator?.email) === normalizedCurrentUserEmail;

  const isInvigilatorOnCurrentExam =
    !!examContext &&
    normalizeText(examContext.invigilator?.email) === normalizedCurrentUserEmail;

  const activeExamId = examContext?.id ?? null;
  const isEditingExam = !!examId && !Number.isNaN(examId) && activeExamId === examId;

  const canAccessQuestionsManager =
    !!examId && (isAssignedQuestionSetterOnCurrentExam || isControllerOnCurrentExam);

  const canAccessModeratorPanel = !!examId && (isModeratorOnCurrentExam || isControllerOnCurrentExam);
  const canAccessInvigilatorPanel = !!examId && (isInvigilatorOnCurrentExam || isControllerOnCurrentExam);
  const canAccessControllerOnly = !!examId && isControllerOnCurrentExam;

  const activeExamContext = examContext ?? setterExams[0] ?? null;

  async function refreshExamQuestions(examIdToLoad: number) {
    setLoadingQuestions(true);
    try {
      const res = await api.get(`/exams/${examIdToLoad}/questions`);
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setQuestions(rows.map((row: ApiQuestion) => mapApiQuestionToDraft(row)));
    } catch {
      setError('Failed to load questions for this exam.');
    } finally {
      setLoadingQuestions(false);
    }
  }

  useEffect(() => {
    if (activeStep !== 'questions') return;
    if (!canAccessQuestionsManager) return;
    if (!activeExamContext?.id) return;

    void refreshExamQuestions(activeExamContext.id);
  }, [activeExamContext?.id, activeStep, canAccessQuestionsManager]);

  useEffect(() => {
    if (!examId || Number.isNaN(examId)) {
      setExamContext(null);
      return;
    }

    setLoadingExam(true);
    api.get(`/exams/${examId}`)
      .then((res) => {
        const exam = res.data;
        const loadedExam: ExamContext = {
          id: exam.id,
          title: exam.title ?? exam.name,
          subject_id: exam.subject_id ?? null,
          duration: exam.duration ?? null,
          total_marks: exam.total_marks ?? null,
          start_time: exam.start_time ?? null,
          end_time: exam.end_time ?? null,
          question_setter: exam.question_setter ?? null,
          questionSetter: exam.questionSetter ?? null,
          moderator: exam.moderator ?? null,
          invigilator: exam.invigilator ?? null,
          teacher: exam.teacher ?? null,
          controller: exam.controller ?? null,
          controller_id: exam.controller_id ?? null,
        };

        setExamContext(loadedExam);

        setTestName(String(loadedExam.title ?? ''));
        if (loadedExam.subject_id != null) setSubjectId(String(loadedExam.subject_id));
        if (loadedExam.duration != null) setDuration(String(loadedExam.duration));
        if (loadedExam.total_marks != null) setTotalMarks(String(loadedExam.total_marks));
        setStartTime(toDateTimeLocalValue(loadedExam.start_time));
        setEndTime(toDateTimeLocalValue(loadedExam.end_time));
        setQuestionSetterEmail(getSetterEmail(loadedExam));
        setModeratorEmail(String(loadedExam.moderator?.email ?? ''));
        setInvigilatorEmail(String(loadedExam.invigilator?.email ?? ''));

        setSuccess('Loaded exam details from database.');
        setError('');
      })
      .catch(() => {
        setExamContext(null);
        setError('Failed to load selected exam details.');
      })
      .finally(() => {
        setLoadingExam(false);
      });
  }, [examId]);

  useEffect(() => {
    if (!examId || Number.isNaN(examId)) return;

    if (location.pathname.endsWith('/questions') || shouldOpenQuestions) {
      if (canAccessQuestionsManager) setActiveStep('questions');
      return;
    }

    if (location.pathname.endsWith('/moderator')) {
      if (canAccessModeratorPanel) setActiveStep('moderator');
      return;
    }

    if (location.pathname.endsWith('/invigilator')) {
      if (canAccessInvigilatorPanel) setActiveStep('invigilator');
      return;
    }

    if (location.pathname.endsWith('/access')) {
      if (canAccessControllerOnly) setActiveStep('test_access');
      return;
    }

    if (requestedStep === 'activate' && canAccessControllerOnly) {
      setActiveStep('activate');
      return;
    }

    if (requestedStep === 'settings' && canAccessControllerOnly) {
      setActiveStep('basic');
      return;
    }

    if (!shouldOpenQuestions) return;
    if (!examId || Number.isNaN(examId)) return;
    if (canAccessQuestionsManager) {
      setActiveStep('questions');
    }
  }, [
    canAccessControllerOnly,
    canAccessInvigilatorPanel,
    canAccessModeratorPanel,
    canAccessQuestionsManager,
    examId,
    location.pathname,
    requestedStep,
    shouldOpenQuestions,
  ]);

  useEffect(() => {
    if (activeStep !== 'test_access') return;
    if (!canAccessControllerOnly) return;
    if (!activeExamContext?.id) return;

    api.get(`/exams/${activeExamContext.id}/access`)
      .then((res) => {
        const config = res.data?.config;
        if (config?.channel === 'web' || config?.channel === 'teams') {
          setAccessChannel(config.channel);
        }
        if (config?.access_type === 'public' || config?.access_type === 'private') {
          setAccessType(config.access_type);
        }
        setRequirePublicEmail(Boolean(config?.require_email));
        setPublicAccessLink(String(res.data?.public_link ?? ''));
      })
      .catch(() => {
        // Keep defaults when no access config is available yet.
      });
  }, [activeExamContext?.id, activeStep, canAccessControllerOnly]);

  useEffect(() => {
    api.get('/exams')
      .then((res) => {
        const exams = Array.isArray(res.data) ? res.data : [];
        const assigned = exams
          .filter((exam) => normalizeText(exam?.questionSetter?.email ?? exam?.question_setter?.email) === normalizedCurrentUserEmail)
          .map((exam) => ({
            id: exam.id,
            title: exam.title ?? exam.name,
            question_setter: exam.question_setter ?? null,
            questionSetter: exam.questionSetter ?? null,
            teacher: exam.teacher ?? null,
            controller: exam.controller ?? null,
            controller_id: exam.controller_id ?? null,
          }));

        setSetterExams(assigned);
      })
      .catch(() => {
        setSetterExams([]);
      });
  }, [normalizedCurrentUserEmail]);

  function handleNavChange(label: string) {
    if (label === 'Dashboard') {
      navigate('/teacher/dashboard');
      return;
    }
    if (label === 'Create Exam') {
      return;
    }
  }

  function handleStepSelect(step: StepKey) {
    const blockedByStep: Record<StepKey, boolean> = {
      basic: !canAccessControllerOnly,
      questions: !canAccessQuestionsManager,
      moderator: !canAccessModeratorPanel,
      invigilator: !canAccessInvigilatorPanel,
      test_access: !canAccessControllerOnly,
      grading: !canAccessControllerOnly,
      time: !canAccessControllerOnly,
      certificate: !canAccessControllerOnly,
      activate: !canAccessControllerOnly,
    };

    if (blockedByStep[step]) {
      setError('You do not have access to this section for the selected exam.');
      return;
    }

    setError('');
    setSuccess('');
    setActiveStep(step);
  }

  function resetQuestionEditor() {
    setEditingQuestionId(null);
    setQuestionCategory('Generic');
    setQuestionType('Single choice');
    setQuestionText('');
    setAnswers(['', '']);
    setCorrectAnswer('A');
    setQuestionMarks('1');
  }

  function openQuestionEditor(question?: QuestionDraft) {
    if (question) {
      setEditingQuestionId(question.id);
      setQuestionCategory(question.category);
      setQuestionType(question.answerType);
      setQuestionText(question.questionText);
      setAnswers(question.answers.length > 0 ? question.answers : ['', '']);
      setCorrectAnswer(question.correctAnswer ?? 'A');
      setQuestionMarks(String(question.marks ?? 1));
    } else {
      resetQuestionEditor();
    }

    setError('');
    setSuccess('');
    setShowQuestionEditor(true);
  }

  function handleAddAnswer() {
    setAnswers((prev) => [...prev, '']);
  }

  function handleDeleteAnswer(index: number) {
    setAnswers((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleAnswerChange(index: number, value: string) {
    setAnswers((prev) => prev.map((answer, i) => (i === index ? value : answer)));
  }

  async function handleSaveQuestion() {
    if (!activeExamContext?.id) {
      setError('Select an exam before adding questions.');
      return;
    }

    if (!questionText.trim()) {
      setError('Question text is required.');
      return;
    }

    const cleanedAnswers = answers.map((a) => a.trim()).filter(Boolean);
    if ((questionType === 'Single choice' || questionType === 'Multiple choice') && cleanedAnswers.length < 2) {
      setError('At least two answers are required for choice-based questions.');
      return;
    }

    const marksValue = Number(questionMarks);
    if (!Number.isFinite(marksValue) || marksValue < 1) {
      setError('Marks must be a number greater than or equal to 1.');
      return;
    }

    const optionA = cleanedAnswers[0] ?? 'Option A';
    const optionB = cleanedAnswers[1] ?? 'Option B';
    const optionC = cleanedAnswers[2] ?? optionA;
    const optionD = cleanedAnswers[3] ?? optionB;

    try {
      const payload = {
        question_text: questionText.trim(),
        type: mapDraftTypeToApi(questionType),
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        marks: marksValue,
      };

      if (editingQuestionId) {
        await api.put(`/exams/${activeExamContext.id}/questions/${editingQuestionId}`, payload);
      } else {
        await api.post(`/exams/${activeExamContext.id}/questions`, payload);
      }

      await refreshExamQuestions(activeExamContext.id);
      resetQuestionEditor();
      setShowQuestionEditor(false);
      setError('');
      setSuccess(editingQuestionId ? 'Question updated successfully.' : 'Question added to this exam successfully.');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const first = Object.values(apiErrors).flat()[0];
        setError(String(first));
      } else {
        setError(err?.response?.data?.message ?? 'Failed to save question.');
      }
    }
  }

  async function handleCreateExam() {
    if (!canCreateExam) {
      setError('Your role can view exam details but cannot create exams. Ask the Controller of Examinations for access.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!startTime || !endTime) {
        throw new Error('Start time and end time are required.');
      }

      const payload = {
        title: testName,
        subject_id: Number(subjectId),
        duration: Number(duration),
        total_marks: Number(totalMarks),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        question_setter_email: canAssignRoles ? (questionSetterEmail || null) : null,
        moderator_email: canAssignRoles ? (moderatorEmail || null) : null,
        invigilator_email: canAssignRoles ? (invigilatorEmail || null) : null,
      };
      const examLabel = getExamLabel(testName);

      if (isEditingExam && activeExamId) {
        await api.put(`/exams/${activeExamId}`, payload);
        setSuccess(`Exam "${examLabel}" updated successfully.`);
      } else {
        await api.post('/exams', payload);
        setSuccess(`Exam "${examLabel}" created successfully. Controller role can now assign question setter, moderator, and invigilator.`);
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const first = Object.values(apiErrors).flat()[0];
        setError(String(first));
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? `Failed to ${isEditingExam ? 'update' : 'create'} exam.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setError('');
    setSuccess('');

    if (!canCreateExam) {
      setError('Your role can view exam details but cannot create exams. Ask the Controller of Examinations for access.');
      return;
    }

    if (!testName.trim()) {
      setError('Test name is required to create exam.');
      return;
    }

    if (!startTime || !endTime) {
      setError('Start time and end time are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: testName,
        subject_id: Number(subjectId),
        duration: Number(duration),
        total_marks: Number(totalMarks),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        question_setter_email: canAssignRoles ? (questionSetterEmail || null) : null,
        moderator_email: canAssignRoles ? (moderatorEmail || null) : null,
        invigilator_email: canAssignRoles ? (invigilatorEmail || null) : null,
      };
      const examLabel = getExamLabel(testName);

      if (isEditingExam && activeExamId) {
        await api.put(`/exams/${activeExamId}`, payload);
        setSuccess(`Exam "${examLabel}" information updated in database successfully.`);
      } else {
        await api.post('/exams', payload);
        setSuccess(`Exam "${examLabel}" information saved to database successfully. Use Activate test on the left when you are ready to publish.`);
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const first = Object.values(apiErrors).flat()[0];
        setError(String(first));
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? `Failed to ${isEditingExam ? 'update' : 'save'} exam information.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      role="Teacher"
      navItems={NAV_ITEMS}
      activeItem="Create Exam"
      onNavChange={handleNavChange}
      user={teacherUser}
      notificationCount={2}
      pageTitle={isEditingExam ? 'Edit Exam' : 'Create New Exam'}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">{isEditingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
          {activeExamContext?.title && (
            <span className="text-xs text-emerald-300 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Exam: {activeExamContext.title}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
              Test info
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
              Preview
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
              Print
            </button>
          </div>
        </div>

        {loadingExam && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            Loading exam details from database...
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
          >
            <div className="mb-4">
              <span className="inline-flex text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
                Setup in progress
              </span>
            </div>

            <div className="mb-5">
              <p className="text-sm font-semibold text-white">Test configuration</p>
              <p className="text-xs text-gray-400 mt-1">83% completed</p>
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full w-[83%] bg-gradient-to-r from-emerald-500 to-cyan-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.key;
                return (
                  <button
                    key={step.label}
                    onClick={() => handleStepSelect(step.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer
                      ${isActive
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCreateExam}
              disabled={submitting || !canCreateExam}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> {isEditingExam ? 'Updating...' : 'Creating...'}</span>
              ) : (
                <span>{canCreateExam ? (isEditingExam ? 'Update test' : 'Activate test') : 'View only access'}</span>
              )}
            </button>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {activeStep === 'basic' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5 gap-3">
                <h3 className="text-lg font-semibold text-white">Basic settings</h3>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting || !canCreateExam}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isEditingExam ? 'Update' : 'Create'}
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {success}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Test name</label>
                  <input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1.5">Select test category to keep track of your tests.</p>
                  </div>

                  <button className="md:mb-5 px-3.5 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Create category
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">Add test description for identification purposes. It will be visible to you only.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Test language</label>
                  <div className="relative">
                    <Languages className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {LANGUAGES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Subject ID</label>
                    <input
                      type="number"
                      min={1}
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Duration (mins)</label>
                    <input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Total marks</label>
                    <input
                      type="number"
                      min={1}
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Start time</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">End time</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="pt-1 border-t border-gray-800">
                  <h4 className="text-sm font-semibold text-white mb-3">Role Assignment by Email</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    {canAssignRoles
                      ? 'Controller of Examinations can assign question setter, moderator, and invigilator using faculty email addresses.'
                      : 'Only Controller of Examinations can assign question setter, moderator, and invigilator roles.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Question Setter Email</label>
                      <input
                        type="email"
                        value={questionSetterEmail}
                        onChange={(e) => setQuestionSetterEmail(e.target.value)}
                        placeholder="setter@university.edu"
                        disabled={!canAssignRoles}
                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Moderator Email</label>
                      <input
                        type="email"
                        value={moderatorEmail}
                        onChange={(e) => setModeratorEmail(e.target.value)}
                        placeholder="moderator@university.edu"
                        disabled={!canAssignRoles}
                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Invigilator Email</label>
                      <input
                        type="email"
                        value={invigilatorEmail}
                        onChange={(e) => setInvigilatorEmail(e.target.value)}
                        placeholder="invigilator@university.edu"
                        disabled={!canAssignRoles}
                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeStep === 'basic' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Logo</h4>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-300 mt-0.5" />
                  <div>
                    <p className="text-sm text-cyan-200 font-medium">Logo visibility</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Logo is visible in online and printable version of the test.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeStep === 'questions' && !canAccessQuestionsManager && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-rose-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">Questions manager is restricted</h3>
                <p className="text-sm text-gray-400 mt-2">
                  Only the assigned Question Setter or Controller can access this page.
                </p>
              </div>
            )}

            {activeStep === 'questions' && canAccessQuestionsManager && setterExams.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Assigned as Question Setter</p>
                <div className="flex flex-wrap gap-2">
                  {setterExams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setExamContext(exam)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                        activeExamContext?.id === exam.id
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                      }`}
                    >
                      {exam.title ?? `Exam #${exam.id}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeStep === 'questions' && canAccessQuestionsManager && !showQuestionEditor && questions.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl min-h-[540px] flex items-center justify-center">
                <div className="max-w-md text-center px-6 py-10">
                  <h3 className="text-sm font-semibold text-white mb-1">Questions manager</h3>
                  <div className="w-72 mx-auto rounded-2xl bg-gray-950 border border-gray-800 p-4 mt-8 mb-6">
                    <div className="h-2.5 rounded bg-gray-800 mb-3" />
                    <div className="h-2 rounded bg-emerald-500/70 mb-2 w-1/2" />
                    <div className="h-2 rounded bg-gray-800 w-4/5 mb-3" />
                    <div className="h-2 rounded bg-gray-800 mb-2 w-2/3" />
                    <div className="h-2 rounded bg-emerald-500/60 w-1/2" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">You don&apos;t have any questions yet</h4>
                  <p className="text-sm text-gray-400 mb-5">Click Add question to create your first question.</p>
                  <div className="flex items-center justify-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Generate using AI
                    </button>
                    <button
                      onClick={() => openQuestionEditor()}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add question
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'questions' && canAccessQuestionsManager && loadingQuestions && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Loading questions...
              </div>
            )}

            {activeStep === 'questions' && canAccessQuestionsManager && (showQuestionEditor || questions.length > 0) && (
              <div className="space-y-4">
                {showQuestionEditor && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-white">{editingQuestionId ? 'Edit Question' : 'Question 1'}</h3>
                      <button
                        onClick={() => {
                          setShowQuestionEditor(false);
                          resetQuestionEditor();
                        }}
                        className="text-xs text-gray-400 hover:text-gray-200"
                      >
                        Back
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Question</label>
                        <textarea
                          rows={4}
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="Write your question"
                          className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Category</label>
                          <select
                            value={questionCategory}
                            onChange={(e) => setQuestionCategory(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          >
                            <option>Generic</option>
                            <option>Python</option>
                            <option>JavaScript</option>
                            <option>Database</option>
                          </select>
                        </div>
                        <button className="px-3.5 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                          <Plus className="w-4 h-4" />
                          Add new category
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Answer type</label>
                        <select
                          value={questionType}
                          onChange={(e) => setQuestionType(e.target.value as QuestionDraft['answerType'])}
                          className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        >
                          <option>Single choice</option>
                          <option>Multiple choice</option>
                          <option>Descriptive</option>
                          <option>True/False</option>
                          <option>Short answer</option>
                          <option>Survey</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        {answers.map((answer, index) => (
                          <div key={index} className="grid grid-cols-[auto_1fr_auto] gap-2 items-start">
                            <span className="mt-2 w-4 h-4 rounded-full border border-gray-500" />
                            <textarea
                              rows={2}
                              value={answer}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              placeholder={`Answer ${index + 1}`}
                              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                            <button
                              onClick={() => handleDeleteAnswer(index)}
                              className="text-xs text-gray-500 hover:text-rose-300 mt-2"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleAddAnswer}
                          className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Add answer
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Correct answer</label>
                          <select
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value as 'A' | 'B' | 'C' | 'D')}
                            className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Marks</label>
                          <input
                            type="number"
                            min={1}
                            value={questionMarks}
                            onChange={(e) => setQuestionMarks(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => {
                            setShowQuestionEditor(false);
                            resetQuestionEditor();
                          }}
                          className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveQuestion}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                        >
                          {editingQuestionId ? 'Update question' : 'Save question'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-white">Saved questions ({questions.length})</h4>
                      {canAccessQuestionsManager && (
                        <button
                          onClick={() => openQuestionEditor()}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Add question
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          onClick={() => openQuestionEditor(question)}
                          role="button"
                          tabIndex={0}
                          className="rounded-xl border border-gray-800 bg-gray-950/70 p-4 cursor-pointer transition-colors hover:border-emerald-500/30 hover:bg-gray-950"
                        >
                          <p className="text-xs text-gray-500 mb-1">Question {index + 1} · {question.category} · {question.answerType}</p>
                          <p className="text-sm text-gray-200 mb-2">{question.questionText}</p>
                          {question.answers.length > 0 && (
                            <ul className="text-xs text-gray-400 list-disc pl-5 space-y-1">
                              {question.answers.map((answer, i) => (
                                <li key={`${question.id}-${i}`}>{answer}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-3 text-[11px] text-gray-500 flex flex-wrap gap-3">
                            <span>Correct: {question.correctAnswer ?? 'A'}</span>
                            <span>Marks: {question.marks ?? 1}</span>
                            <span className="text-emerald-300">Click to edit</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStep === 'moderator' && canAccessModeratorPanel && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Moderator Review</h3>
                <p className="text-sm text-gray-400">Review paper quality, comments, and approval flow in one place.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/exam/${activeExamContext?.id}/moderator`)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
                  >
                    Open Moderator Tools
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'invigilator' && canAccessInvigilatorPanel && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Invigilator Panel</h3>
                <p className="text-sm text-gray-400">Monitor live exam activity and review suspicious activity reports.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/exam/${activeExamContext?.id}/invigilator`)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
                  >
                    Open Invigilator Tools
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'test_access' && canAccessControllerOnly && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <h3 className="text-lg font-semibold text-white">Test Access</h3>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Channel</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAccessChannel('web')}
                      className={`px-4 py-2 rounded-lg border text-sm ${accessChannel === 'web' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Web Browser
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccessChannel('teams')}
                      className={`px-4 py-2 rounded-lg border text-sm ${accessChannel === 'teams' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Microsoft Teams
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Access type</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['public', 'Public Link'],
                      ['private', 'Private Access'],
                      ['group', 'Group Password'],
                      ['training', 'Training Mode'],
                    ] as Array<[AccessType, string]>).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAccessType(key)}
                        className={`px-4 py-2 rounded-lg border text-sm ${accessType === key ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {accessType === 'public' && (
                  <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                    <p className="text-sm text-gray-300">Anyone with the generated link can access the test.</p>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={requirePublicEmail}
                        onChange={(e) => setRequirePublicEmail(e.target.checked)}
                      />
                      Require email before starting
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingAccess || !activeExamContext?.id}
                        onClick={async () => {
                          if (!activeExamContext?.id) return;
                          setSavingAccess(true);
                          try {
                            const res = await api.post(`/exams/${activeExamContext.id}/access/public`, {
                              channel: accessChannel,
                              require_email: requirePublicEmail,
                            });
                            setPublicAccessLink(String(res.data?.link ?? ''));
                            setSuccess('Public access link generated successfully.');
                            setError('');
                          } catch (err: any) {
                            setError(err?.response?.data?.message ?? 'Failed to generate public link.');
                          } finally {
                            setSavingAccess(false);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
                      >
                        {savingAccess ? 'Generating...' : 'Generate link'}
                      </button>
                      <button
                        type="button"
                        disabled={!publicAccessLink}
                        onClick={async () => {
                          if (!publicAccessLink) return;
                          await navigator.clipboard.writeText(publicAccessLink);
                          setSuccess('Link copied to clipboard.');
                          setError('');
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 disabled:opacity-60"
                      >
                        Copy link
                      </button>
                    </div>
                    {publicAccessLink && (
                      <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 break-all">
                        {publicAccessLink}
                      </div>
                    )}
                  </div>
                )}

                {accessType === 'private' && (
                  <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                    <p className="text-sm text-gray-300">Add one or more emails (comma or new line separated).</p>
                    <textarea
                      rows={5}
                      value={privateEmailsInput}
                      onChange={(e) => setPrivateEmailsInput(e.target.value)}
                      placeholder="student1@example.com, student2@example.com"
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={savingAccess || !activeExamContext?.id}
                      onClick={async () => {
                        if (!activeExamContext?.id) return;
                        const emails = privateEmailsInput
                          .split(/[\n,;]/)
                          .map((e) => e.trim())
                          .filter(Boolean);

                        if (emails.length === 0) {
                          setError('Add at least one valid email.');
                          return;
                        }

                        setSavingAccess(true);
                        try {
                          const res = await api.post(`/exams/${activeExamContext.id}/access/private`, {
                            channel: accessChannel,
                            emails,
                          });
                          setPrivateLinks(Array.isArray(res.data?.links) ? res.data.links : []);
                          setSuccess('Private access links generated and email dispatch triggered.');
                          setError('');
                        } catch (err: any) {
                          setError(err?.response?.data?.message ?? 'Failed to generate private links.');
                        } finally {
                          setSavingAccess(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {savingAccess ? 'Sending...' : 'Send Access Link'}
                    </button>

                    {privateLinks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Generated links</p>
                        {privateLinks.map((item, idx) => (
                          <div key={`${item.email}-${idx}`} className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300">
                            <p className="font-semibold text-gray-200">{item.email}</p>
                            <p className="break-all mt-1">{item.link}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(accessType === 'group' || accessType === 'training') && (
                  <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950/50 p-4 text-sm text-gray-400">
                    This access mode is reserved for future extension.
                  </div>
                )}
              </div>
            )}

            {activeStep === 'grading' && canAccessControllerOnly && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Grading & Summary</h3>
                <p className="text-sm text-gray-400">Configure marks distribution, grading mode, and summary rules.</p>
              </div>
            )}

            {activeStep === 'time' && canAccessControllerOnly && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Time Settings</h3>
                <p className="text-sm text-gray-400">Set exam start/end time, duration, and time restrictions.</p>
              </div>
            )}

            {activeStep === 'certificate' && canAccessControllerOnly && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Certificate Template</h3>
                <p className="text-sm text-gray-400">Choose or design the certificate format for exam completion.</p>
              </div>
            )}

            {activeStep === 'activate' && canAccessControllerOnly && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Activate Test</h3>
                <p className="text-sm text-gray-400">Final validation and publishing step. Controller only.</p>
                <button
                  onClick={async () => {
                    if (!activeExamContext?.id) return;
                    try {
                      await api.post(`/exam/${activeExamContext.id}/activate`);
                      setSuccess('Exam activated successfully.');
                      setError('');
                    } catch (err: any) {
                      setError(err?.response?.data?.message ?? 'Failed to activate exam.');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                >
                  Activate test
                </button>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </DashboardLayout>
  );
}
