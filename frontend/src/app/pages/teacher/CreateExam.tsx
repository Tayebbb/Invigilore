import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  CheckSquare,
  ExternalLink,
  FileCheck2,
  FileText,
  Flag,
  Globe,
  LayoutDashboard,
  Languages,
  Lock,
  Loader2,
  Mail,
  Plus,
  Printer,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';

import api from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ModeratorReviewPanel from './ModeratorReviewPanel';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser from '../../hooks/useCurrentUser';
import { hasAnyPermission, normalizePermissionList } from '../../utils/permissions';

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
  answerType: 'Single choice' | 'Multiple choice' | 'Descriptive' | 'True/False' | 'Short answer' | 'Survey';
  questionText: string;
  answers: string[];
  correctAnswer?: string;
  marks?: number;
};

type SubjectOption = {
  id: number;
  name: string;
  subject_code?: string | null;
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

type PrivateRecipient = {
  id?: number;
  email: string;
  status?: string;
  expires_at?: string | null;
};

const LANGUAGES = ['English', 'French', 'Spanish'];

type ExamContext = {
  id: number;
  teacher_id?: number | null;
  controller_id?: number | null;
  title?: string;
  description?: string | null;
  subject?: { name?: string } | null;
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
  exam_status?: 'draft' | 'active' | 'scheduled' | 'completed' | string;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(value: string): string[] {
  return value
    .split(/[\n,;]/)
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
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
  if (value === 'multiple_choice') return 'Multiple choice';
  if (value === 'true_false') return 'True/False';
  if (value === 'descriptive') return 'Descriptive';
  if (value === 'short_answer') return 'Short answer';
  return 'Single choice';
}

function mapDraftTypeToApi(value: QuestionDraft['answerType']): string {
  if (value === 'Multiple choice') return 'multiple_choice';
  if (value === 'True/False') return 'true_false';
  if (value === 'Short answer') return 'short_answer';
  if (value === 'Descriptive' || value === 'Survey') return 'descriptive';
  return 'mcq';
}

function mapApiQuestionToDraft(question: ApiQuestion): QuestionDraft {
  let options: string[] = [];
  if (question.options && typeof question.options === 'object') {
    // Sort keys A, B, C... to maintain correct ordering
    const sortedKeys = Object.keys(question.options as Record<string, string>).sort();
    options = sortedKeys.map(key => (question.options as Record<string, string>)[key]).filter(Boolean);
  }

  return {
    id: question.id,
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
  const currentPermissions = normalizePermissionList((currentUser as { permissions?: string[] }).permissions);
  const canCreateExam = hasAnyPermission(currentPermissions, ['exams.create']);
  const canAssignRoles = hasAnyPermission(currentPermissions, ['exams.manage.access', 'roles.assign']);

  const examIdParam = searchParams.get('examId');
  const examIdCandidate = examIdFromPath ?? examIdParam;
  const examId = examIdCandidate ? Number(examIdCandidate) : null;
  const requestedStep = String(searchParams.get('step') ?? '').toLowerCase();
  const shouldOpenQuestions = requestedStep === 'questions' || Boolean(examIdFromPath);
  const [examContext, setExamContext] = useState<ExamContext | null>(null);
  const [setterExams, setSetterExams] = useState<ExamContext[]>([]);
  const [loadingExam, setLoadingExam] = useState(false);

  const [testName, setTestName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const startTimeInputRef = useRef<HTMLInputElement | null>(null);
  const endTimeInputRef = useRef<HTMLInputElement | null>(null);

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
  const [questionType, setQuestionType] = useState<QuestionDraft['answerType']>('Single choice');
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');

  const calculatedDuration = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (end <= start) return 0;
    return Math.floor((end - start) / (1000 * 60));
  }, [startTime, endTime]);

  const calculatedTotalMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);
  }, [questions]);
  const [questionMarks, setQuestionMarks] = useState('1');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [accessChannel, setAccessChannel] = useState<AccessChannel>('web');
  const [accessType, setAccessType] = useState<AccessType>('public');
  const [requirePublicEmail, setRequirePublicEmail] = useState(false);
  const [publicAccessLink, setPublicAccessLink] = useState('');
  const [privateEmailsInput, setPrivateEmailsInput] = useState('');
  const [privateEmailError, setPrivateEmailError] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState<string[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<string[]>([]);
  const [privateRecipients, setPrivateRecipients] = useState<PrivateRecipient[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  async function handleAiGenerate() {
    if (!targetExamId) {
      setError('Please save the exam draft first before generating questions.');
      return;
    }
    if (!aiPrompt.trim()) {
      setError('Please enter a topic or prompt for AI.');
      return;
    }

    setAiGenerating(true);
    setError('');
    
    try {
      await api.post(`/exams/${targetExamId}/ai-generate`, {
        prompt: aiPrompt.trim(),
        count: aiQuestionCount,
        difficulty: aiDifficulty,
      });
      
      setSuccess(`${aiQuestionCount} questions generated and added successfully.`);
      setShowAiModal(false);
      setAiPrompt('');
      await refreshExamQuestions(Number(targetExamId));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }

  const [endMessage, setEndMessage] = useState('Thank you for taking the test!');
  const [enableRedirection, setEnableRedirection] = useState(false);
  const [redirectionUrl, setRedirectionUrl] = useState('');
  const [passMarkEnabled, setPassMarkEnabled] = useState(true);
  const [passMarkValue, setPassMarkValue] = useState('50');
  const [passMarkUnit, setPassMarkUnit] = useState('%');
  const [feedbackOptions, setFeedbackOptions] = useState({
    percentageScore: true,
    pointsScore: true,
    grade: false,
    descriptiveGrade: false,
    correctAnswers: false,
    passFailMessage: true,
  });
  const [passMessage, setPassMessage] = useState('Congratulations on passing the test!');
  const [failMessage, setFailMessage] = useState('Your score was too low to pass this test.');
  const [emailNotification, setEmailNotification] = useState(false);

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

  const isTeacherOnCurrentExam =
    !!examContext &&
    (
      normalizeText(examContext.teacher?.email) === normalizedCurrentUserEmail
      || (Number.isFinite(currentUserId) && examContext.teacher_id === currentUserId)
    );

  const isInvigilatorOnCurrentExam =
    !!examContext &&
    normalizeText(examContext.invigilator?.email) === normalizedCurrentUserEmail;

  const activeExamId = examContext?.id ?? null;
  const isEditingExam = !!examId && !Number.isNaN(examId) && activeExamId === examId;

  const isPrivileged = hasAnyPermission(currentPermissions, ['exams.view.all', 'exams.create', 'questions.manage', 'questions.review', 'exams.publish', 'exams.settings.manage']);
  const isGlobalAdminOrController = hasAnyPermission(currentPermissions, ['exams.view.all', 'exams.settings.manage']);

  // Read access (can see the tab in sidebar and navigate to it):
  const canAccessQuestionsManager = isPrivileged || (!!examId && (isAssignedQuestionSetterOnCurrentExam || isControllerOnCurrentExam || isModeratorOnCurrentExam || isInvigilatorOnCurrentExam || isTeacherOnCurrentExam));
  const canAccessModeratorPanel = isPrivileged || (!!examId && (isAssignedQuestionSetterOnCurrentExam || isControllerOnCurrentExam || isModeratorOnCurrentExam || isInvigilatorOnCurrentExam || isTeacherOnCurrentExam));
  const canAccessInvigilatorPanel = isPrivileged || (!!examId && (isAssignedQuestionSetterOnCurrentExam || isControllerOnCurrentExam || isModeratorOnCurrentExam || isInvigilatorOnCurrentExam || isTeacherOnCurrentExam));
  const canAccessControllerOnly = isPrivileged || (!!examId && (isAssignedQuestionSetterOnCurrentExam || isControllerOnCurrentExam || isModeratorOnCurrentExam || isInvigilatorOnCurrentExam || isTeacherOnCurrentExam));

  // Edit access (can make changes):
  const canEditControllerOnly = isGlobalAdminOrController || (!examId && canCreateExam) || (!!examId && (isControllerOnCurrentExam || isTeacherOnCurrentExam));
  const canEditQuestionsManager = canEditControllerOnly || (!!examId && isAssignedQuestionSetterOnCurrentExam);
  const canEditModeratorPanel = canEditControllerOnly || (!!examId && isModeratorOnCurrentExam);
  const canEditInvigilatorPanel = canEditControllerOnly || (!!examId && isInvigilatorOnCurrentExam);
  const canEditTestAccess = canEditControllerOnly || (!!examId && (isModeratorOnCurrentExam || isTeacherOnCurrentExam));

  const activeExamContext = examContext ?? setterExams[0] ?? null;
  const targetExamId = activeExamContext?.id ?? ((examId && !Number.isNaN(examId)) ? examId : null);
  const canActivateExam = (isTeacherOnCurrentExam || hasAnyPermission(currentPermissions, ['exams.publish']))
    && (canEditControllerOnly || (!!examId && isModeratorOnCurrentExam && activeExamContext?.exam_status === 'completed'));

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
          description: exam.description ?? null,
          subject: exam.subject ?? null,
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
          teacher_id: exam.teacher_id ?? null,
          controller_id: exam.controller_id ?? null,
          exam_status: exam.exam_status ?? 'draft',
        };

        setExamContext(loadedExam);

        setTestName(String(loadedExam.title ?? ''));
        setDescription(String(loadedExam.description ?? ''));
        if (loadedExam.subject?.name) setSubjectName(String(loadedExam.subject.name));
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
    if (!targetExamId) return;

    api.get(`/exams/${targetExamId}/access`)
      .then((res) => {
        const config = res.data?.config;
        const recipients = Array.isArray(res.data?.private_recipients) ? res.data.private_recipients : [];
        if (config?.channel === 'web' || config?.channel === 'teams') {
          setAccessChannel(config.channel);
        }
        if (config?.access_type === 'public' || config?.access_type === 'private') {
          setAccessType(config.access_type);
        }
        setRequirePublicEmail(Boolean(config?.require_email));
        setPublicAccessLink(String(res.data?.public_link ?? ''));
        setPrivateRecipients(recipients);
        setRegisteredStudents([]);
        setPendingRegistrations([]);
      })
      .catch(() => {
        // Keep defaults when no access config is available yet.
        setPrivateRecipients([]);
      });
  }, [activeStep, canAccessControllerOnly, targetExamId]);

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

  useEffect(() => {
    api.get('/subjects?limit=200')
      .then((res) => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setSubjectOptions(rows.map((item: any) => ({
          id: Number(item.id),
          name: String(item.name ?? item.subject_name ?? '').trim(),
          subject_code: item.subject_code ?? null,
        })).filter((item: SubjectOption) => item.name && Number.isFinite(item.id)));
      })
      .catch(() => {
        setSubjectOptions([]);
      });
  }, []);

  function handleNavChange(label: string) {
    if (label === 'Dashboard') {
      navigate('/teacher/dashboard');
      return;
    }
    if (label === 'Create Exam') {
      return;
    }
    if (label === 'Student Results') {
      navigate('/teacher/results');
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

  function openNativeDateTimePicker(input: HTMLInputElement | null) {
    if (!input) return;
    (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
  }

  function resetQuestionEditor() {
    setEditingQuestionId(null);
    setQuestionType('Single choice');
    setQuestionText('');
    setAnswers(['', '']);
    setCorrectAnswer('A');
    setQuestionMarks('1');
  }

  function openQuestionEditor(question?: QuestionDraft) {
    if (question) {
      setEditingQuestionId(question.id);
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
    if (answers.length >= 5) return;
    setAnswers((prev) => [...prev, '']);
  }

  function handleDeleteAnswer(index: number) {
    setAnswers((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleAnswerChange(index: number, value: string) {
    setAnswers((prev) => prev.map((answer, i) => (i === index ? value : answer)));
  }

  async function handleDeleteQuestion(id: number) {
    if (!examContext?.id) return;
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await api.delete(`/exams/${examContext.id}/questions/${id}`);
      setSuccess('Question deleted successfully.');
      await refreshExamQuestions(examContext.id);
      if (editingQuestionId === id) {
        setShowQuestionEditor(false);
        resetQuestionEditor();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to delete question.');
    }
  }

  async function handleSaveQuestion(stay = false) {
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

    const optionsMap: Record<string, string> = {};
    if (questionType === 'True/False') {
      optionsMap['A'] = 'True';
      optionsMap['B'] = 'False';
    } else if (questionType === 'Single choice' || questionType === 'Multiple choice') {
      cleanedAnswers.forEach((ans, idx) => {
        optionsMap[String.fromCharCode(65 + idx)] = ans;
      });
    }

    try {
      const payload = {
        question_text: questionText.trim(),
        type: mapDraftTypeToApi(questionType),
        options: optionsMap,
        correct_answer: correctAnswer,
        marks: marksValue,
      };

      if (editingQuestionId) {
        await api.put(`/exams/${activeExamContext.id}/questions/${editingQuestionId}`, payload);
      } else {
        await api.post(`/exams/${activeExamContext.id}/questions`, payload);
      }

      await refreshExamQuestions(activeExamContext.id);
      
      if (stay) {
        resetQuestionEditor();
        setError('');
        setSuccess('Question added. You can add another one now.');
      } else {
        resetQuestionEditor();
        setShowQuestionEditor(false);
        setError('');
        setSuccess(editingQuestionId ? 'Question updated successfully.' : 'Question added to this exam successfully.');
      }
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

      if (!subjectName.trim()) {
        throw new Error('Course/subject name is required to create exam.');
      }

      const normalizedSubjectName = subjectName.trim().toLowerCase();
      const matchedSubject = subjectOptions.find((item) => item.name.trim().toLowerCase() === normalizedSubjectName);

      const payload = {
        title: testName,
        subject_id: matchedSubject?.id,
        subject_name: subjectName.trim(),
        description: description.trim() || null,
        duration: calculatedDuration,
        total_marks: calculatedTotalMarks,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        question_setter_email: canAssignRoles ? (questionSetterEmail || null) : null,
        moderator_email: canAssignRoles ? (moderatorEmail || null) : null,
        invigilator_email: canAssignRoles ? (invigilatorEmail || null) : null,
        exam_status: 'active',
      };
      const examLabel = getExamLabel(testName);

      if (isEditingExam && activeExamId) {
        await api.put(`/exams/${activeExamId}`, payload);
        const updatedExam = { ...activeExamContext!, exam_status: 'active' };
        setExamContext(updatedExam as ExamContext);
        setSuccess(`Exam "${examLabel}" is now active.`);
      } else {
        const res = await api.post('/exams', payload);
        setSuccess(`Exam "${examLabel}" created and activated successfully.`);
        if (res.data?.id) {
          navigate(`/exam/${res.data.id}/access`);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? `Failed to ${isEditingExam ? 'update' : 'create'} exam.`);
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

    if (!subjectName.trim()) {
      setError('Course/subject name is required to create exam.');
      return;
    }

    const normalizedSubjectName = subjectName.trim().toLowerCase();
    const matchedSubject = subjectOptions.find((item) => item.name.trim().toLowerCase() === normalizedSubjectName);

    setSubmitting(true);
    try {
      const payload = {
        title: testName,
        subject_id: matchedSubject?.id,
        subject_name: subjectName.trim(),
        description: description.trim() || null,
        duration: calculatedDuration,
        total_marks: calculatedTotalMarks,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        question_setter_email: canAssignRoles ? (questionSetterEmail || null) : null,
        moderator_email: canAssignRoles ? (moderatorEmail || null) : null,
        invigilator_email: canAssignRoles ? (invigilatorEmail || null) : null,
        exam_status: 'draft',
      };
      const examLabel = getExamLabel(testName);

      if (isEditingExam && activeExamId) {
        await api.put(`/exams/${activeExamId}`, payload);
        const updatedExam = { ...activeExamContext!, exam_status: 'draft' };
        setExamContext(updatedExam as ExamContext);
        setSuccess(`Exam "${examLabel}" draft saved successfully.`);
      } else {
        const res = await api.post('/exams', payload);
        setSuccess(`Exam "${examLabel}" saved as draft. You can activate it when ready.`);
        if (res.data?.id) {
          navigate(`/teacher/exams/new?examId=${res.data.id}&step=settings`);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? `Failed to ${isEditingExam ? 'update' : 'save'} exam information.`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteExamSetup() {
    if (!activeExamId) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        exam_status: 'completed',
      };
      await api.put(`/exams/${activeExamId}`, payload);
      const updatedExam = { ...activeExamContext!, exam_status: 'completed' };
      setExamContext(updatedExam as ExamContext);
      setSuccess(`Exam questions setup marked as completed.`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to complete exam setup.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExam() {
    if (!activeExamId) return;
    if (!window.confirm('WARNING: Are you sure you want to delete this ENTIRE exam? This action cannot be undone and will delete all questions and settings.')) return;

    setSubmitting(true);
    try {
      await api.delete(`/exams/${activeExamId}`);
      navigate('/teacher/portal/tests');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to delete exam.');
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
            {isEditingExam && (
              <button 
                onClick={handleDeleteExam}
                className="px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors cursor-pointer"
              >
                Delete Exam
              </button>
            )}
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
            className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
          >
            <div className="mb-4">
              <span className="inline-flex text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
                Setup in progress
              </span>
            </div>

            <div className="mb-5">
              <p className="text-sm font-semibold text-white">Test configuration</p>
              {(() => {
                const currentStepIndex = STEPS.findIndex(s => s.key === activeStep);
                const completionPercentage = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);
                return (
                  <>
                    <p className="text-xs text-gray-400 mt-1">{completionPercentage}% completed</p>
                    <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" 
                      />
                    </div>
                  </>
                );
              })()}
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

            {isEditingExam && (
              <button
                onClick={handleCreateExam}
                disabled={submitting || !canActivateExam || activeExamContext?.exam_status === 'active'}
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Activating...</span>
                ) : (
                  <span>{activeExamContext?.exam_status === 'active' ? 'Exam is Active' : 'Active exam'}</span>
                )}
              </button>
            )}
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {activeStep === 'basic' && (
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5 gap-3">
                <h3 className="text-lg font-semibold text-white">Basic settings</h3>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting || !canEditControllerOnly}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Save
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

              <fieldset disabled={!canEditControllerOnly} className="space-y-5 border-0 p-0 m-0 w-full min-w-0">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Test name</label>
                  <input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Course / Subject name</label>
                    <input
                      list="subject-options"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="Type course or subject name"
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <datalist id="subject-options">
                      {subjectOptions.map((item) => (
                        <option key={item.id} value={item.name} />
                      ))}
                    </datalist>
                    <p className="text-[11px] text-gray-500 mt-1.5">Type the course or subject name. It must match an existing subject.</p>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Duration (mins)</label>
                    <div className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-400 font-semibold flex items-center">
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                      {calculatedDuration || '0'} mins (Calculated)
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Total marks</label>
                    <div className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-400 font-semibold flex items-center">
                      <Plus className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                      {calculatedTotalMarks} pts (Auto-calculated)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Start time</label>
                    <input
                      ref={startTimeInputRef}
                      type="datetime-local"
                      step={60}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      onFocus={() => openNativeDateTimePicker(startTimeInputRef.current)}
                      onClick={() => openNativeDateTimePicker(startTimeInputRef.current)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">End time</label>
                    <input
                      ref={endTimeInputRef}
                      type="datetime-local"
                      step={60}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      onFocus={() => openNativeDateTimePicker(endTimeInputRef.current)}
                      onClick={() => openNativeDateTimePicker(endTimeInputRef.current)}
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
              </fieldset>
            </div>
            )}

            {activeStep === 'basic' && (
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
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
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center">
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
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
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
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl min-h-[540px] flex items-center justify-center">
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
                    <button 
                      onClick={() => setShowAiModal(true)}
                      disabled={!canEditQuestionsManager} 
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate using AI
                    </button>
                    <button
                      onClick={() => openQuestionEditor()}
                      disabled={!canEditQuestionsManager}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-white">
                        {editingQuestionId ? 'Edit Question' : `Question ${questions.length + 1}`}
                      </h3>
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
                      <fieldset disabled={!canEditQuestionsManager} className="space-y-4 border-0 p-0 m-0 w-full min-w-0">
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

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Answer type</label>
                          <select
                            value={questionType}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionDraft['answerType'];
                              setQuestionType(newType);
                              if (newType === 'True/False') {
                                setAnswers(['True', 'False']);
                                setCorrectAnswer('A');
                              } else if (newType === 'Descriptive' || newType === 'Short answer') {
                                setAnswers([]);
                                setCorrectAnswer('');
                              } else if (answers.length < 2) {
                                setAnswers(['', '']);
                              }
                            }}
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
                      </div>

                      {(questionType === 'Single choice' || questionType === 'Multiple choice' || questionType === 'True/False') && (
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-400 uppercase tracking-wide">Options (Max 5)</label>
                          {answers.map((answer, index) => {
                            const letter = String.fromCharCode(65 + index);
                            const isCorrect = questionType === 'Multiple choice' 
                              ? correctAnswer.split(',').includes(letter)
                              : correctAnswer === letter;

                            return (
                              <div key={index} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (questionType === 'Multiple choice') {
                                      const parts = correctAnswer ? correctAnswer.split(',') : [];
                                      if (parts.includes(letter)) {
                                        setCorrectAnswer(parts.filter(p => p !== letter).join(','));
                                      } else {
                                        setCorrectAnswer([...parts, letter].sort().join(','));
                                      }
                                    } else {
                                      setCorrectAnswer(letter);
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                                    isCorrect 
                                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                                      : 'border-gray-600 text-transparent hover:border-emerald-500'
                                  }`}
                                >
                                  {isCorrect && <CircleCheck className="w-4 h-4" />}
                                </button>
                                <textarea
                                  rows={1}
                                  value={answer}
                                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                                  placeholder={`Option ${letter}`}
                                  disabled={questionType === 'True/False'}
                                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
                                />
                                {questionType !== 'True/False' && answers.length > 2 && (
                                  <button
                                    onClick={() => handleDeleteAnswer(index)}
                                    className="text-xs text-gray-500 hover:text-rose-400 p-1"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          
                          {questionType !== 'True/False' && answers.length < 5 && (
                            <button
                              onClick={handleAddAnswer}
                              className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" />
                              Add option
                            </button>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">
                            {questionType === 'Single choice' || questionType === 'Multiple choice' || questionType === 'True/False' 
                              ? 'Correct Answer Key' 
                              : 'Expected Answer (Optional)'}
                          </label>
                          
                          {questionType === 'Single choice' || questionType === 'Multiple choice' || questionType === 'True/False' ? (
                            <div className="px-3 py-2.5 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-emerald-400 font-bold min-h-[42px] flex items-center">
                              {correctAnswer || 'Select an option above'}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={correctAnswer}
                              onChange={(e) => setCorrectAnswer(e.target.value)}
                              placeholder="Type expected answer..."
                              className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 pt-2">
                        {editingQuestionId && (
                          <button
                            onClick={() => handleDeleteQuestion(editingQuestionId)}
                            className="mr-auto px-4 py-2 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-400 text-sm font-semibold hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowQuestionEditor(false);
                            resetQuestionEditor();
                          }}
                          className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        
                        {!editingQuestionId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              void handleSaveQuestion(true);
                            }}
                            disabled={!canEditQuestionsManager}
                            className="px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save & Add Another
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            void handleSaveQuestion(false);
                          }}
                          disabled={!canEditQuestionsManager}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editingQuestionId ? 'Update question' : 'Save question'}
                        </button>
                      </div>
                      </fieldset>
                    </div>
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-white">Saved questions ({questions.length})</h4>
                      {canAccessQuestionsManager && canEditQuestionsManager && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleCompleteExamSetup}
                            disabled={submitting || activeExamContext?.exam_status === 'completed'}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CircleCheck className="w-4 h-4" />
                            {activeExamContext?.exam_status === 'completed' ? 'Completed' : 'Complete setup'}
                          </button>
                          <button
                            onClick={() => setShowAiModal(true)}
                            className="px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/5 text-violet-300 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-violet-500/10"
                          >
                            <Sparkles className="w-4 h-4" />
                            AI Gen
                          </button>
                          <button
                            onClick={() => openQuestionEditor()}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Add question
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          onClick={() => openQuestionEditor(question)}
                          role="button"
                          tabIndex={0}
                          className="group relative rounded-xl border border-gray-800 bg-gray-950/70 p-4 cursor-pointer transition-colors hover:border-emerald-500/30 hover:bg-gray-950"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs text-gray-500">Question {index + 1} · {question.answerType}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (question.id) handleDeleteQuestion(question.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-200 mb-2">{question.questionText}</p>
                          {question.answers.length > 0 && (
                            <ul className="text-xs text-gray-400 list-disc pl-5 space-y-1">
                              {question.answers.map((answer, i) => (
                                <li key={`${question.id}-${i}`}>{answer}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-3 text-[11px] text-gray-500 flex flex-wrap gap-3">
                            <span>Correct: <span className="text-emerald-400 font-bold">{question.correctAnswer ?? 'N/A'}</span></span>
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

            {activeStep === 'moderator' && canAccessModeratorPanel && activeExamContext && (
              <ModeratorReviewPanel 
                examId={activeExamContext.id} 
                canEdit={canEditModeratorPanel} 
              />
            )}

            {activeStep === 'invigilator' && canAccessInvigilatorPanel && (
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Invigilator Panel</h3>
                <p className="text-sm text-gray-400">Monitor live exam activity and review suspicious activity reports.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/exam/${activeExamContext?.id}/invigilator`)}
                    disabled={!canEditInvigilatorPanel}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Open Invigilator Tools
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'test_access' && canAccessControllerOnly && (
              <fieldset disabled={!canEditTestAccess} className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-5">
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
                    <p className="text-sm text-gray-300">Add one or more Gmail addresses (comma or new line separated).</p>
                    <textarea
                      rows={5}
                      value={privateEmailsInput}
                      onChange={(e) => {
                        setPrivateEmailsInput(e.target.value);
                        setPrivateEmailError('');
                      }}
                      placeholder="student1@gmail.com, student2@gmail.com"
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white"
                    />
                    {privateEmailError && (
                      <p className="text-xs text-red-300">{privateEmailError}</p>
                    )}
                    <button
                      type="button"
                      disabled={savingAccess || !targetExamId}
                      onClick={async () => {
                        if (!targetExamId) {
                          setError('Save or open an exam first, then assign students.');
                          return;
                        }

                        const emails = parseEmails(privateEmailsInput);
                        const invalidEmails = emails.filter((email) => !EMAIL_REGEX.test(email) || email.length > 255);
                        const uniqueEmails = Array.from(new Set(emails));

                        if (uniqueEmails.length === 0) {
                          setPrivateEmailError('Invalid email format');
                          setError('Add at least one valid email.');
                          return;
                        }

                        if (invalidEmails.length > 0) {
                          setPrivateEmailError('Invalid email format');
                          setError('One or more email addresses are invalid.');
                          return;
                        }

                        setSavingAccess(true);
                        setPrivateEmailError('');
                        try {
                          const res = await api.post(`/exams/${targetExamId}/access/private`, {
                            channel: accessChannel,
                            emails: uniqueEmails,
                          });
                          setRegisteredStudents(Array.isArray(res.data?.registered_students) ? res.data.registered_students : []);
                          setPendingRegistrations(Array.isArray(res.data?.pending_registration) ? res.data.pending_registration : []);
                          setPrivateRecipients((prev) => {
                            const existingByEmail = new Set(prev.map((item) => normalizeText(item.email)));
                            const additions = uniqueEmails
                              .map((value) => normalizeText(value))
                              .filter((value) => !existingByEmail.has(value))
                              .map((value) => ({ email: value, status: 'pending' as const }));

                            return [...prev, ...additions];
                          });
                          setSuccess('Private access assigned. Registered students can now access this exam after login.');
                          setError('');
                        } catch (err: any) {
                          const status = Number(err?.response?.status ?? 0);
                          const apiErrors = err?.response?.data?.errors;
                          if (status === 422) {
                            const firstError = apiErrors && typeof apiErrors === 'object'
                              ? String(Object.values(apiErrors).flat()[0] ?? 'Invalid email format')
                              : 'Invalid email format';
                            setPrivateEmailError('Invalid email format');
                            setError(firstError);
                          } else if (status === 409) {
                            setPrivateEmailError('Email already assigned');
                            setError(err?.response?.data?.message ?? 'Email already assigned');
                          } else {
                            setError(err?.response?.data?.message ?? 'Failed to assign private access.');
                          }
                        } finally {
                          setSavingAccess(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {savingAccess ? 'Assigning...' : 'Assign Students'}
                    </button>

                    {!targetExamId && (
                      <p className="text-xs text-amber-300">Save or open an exam first to enable student assignment.</p>
                    )}

                    {(registeredStudents.length > 0 || pendingRegistrations.length > 0) && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/15 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-emerald-300">Registered students</p>
                          <p className="mt-1 text-sm text-emerald-100">{registeredStudents.length} assigned and eligible</p>
                        </div>
                        <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-amber-300">Pending registration</p>
                          <p className="mt-1 text-sm text-amber-100">{pendingRegistrations.length} emails not registered yet</p>
                        </div>
                      </div>
                    )}

                    {pendingRegistrations.length > 0 && (
                      <div className="rounded-lg border border-amber-800 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
                        <p className="font-semibold">These emails must register first:</p>
                        <p className="mt-1 break-all">{pendingRegistrations.join(', ')}</p>
                      </div>
                    )}

                    {privateRecipients.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Assigned recipients</p>
                        {privateRecipients.map((item, idx) => (
                          <div key={`${item.email}-${idx}`} className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-200 break-all">{item.email}</p>
                              <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-300">
                                {item.status ?? 'pending'}
                              </span>
                            </div>
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
              </fieldset>
            )}

            {activeStep === 'grading' && canAccessControllerOnly && (
              <div className="space-y-6">
                {/* Section 1: Test End Message and Redirection */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Test end message and redirection</h3>
                    <p className="text-sm text-gray-400 mb-4">Configure a message to be displayed to all respondents at the end of the test, regardless of its results.</p>
                    <textarea
                      value={endMessage}
                      onChange={(e) => setEndMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      placeholder="Thank you for taking the test!"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        Set redirection to an external website
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </p>
                      <p className="text-xs text-gray-500">Redirect users to your website after they complete the test.</p>
                    </div>
                    <button 
                      onClick={() => setEnableRedirection(!enableRedirection)}
                      className={`relative w-11 h-6 transition-colors rounded-full ${enableRedirection ? 'bg-emerald-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enableRedirection ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {enableRedirection && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider">Redirection URL</label>
                      <input
                        type="url"
                        value={redirectionUrl}
                        onChange={(e) => setRedirectionUrl(e.target.value)}
                        placeholder="https://yourwebsite.com/success"
                        className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  )}
                </div>

                {/* Section 2: Grading Criteria */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Grading Criteria</h3>
                  
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-300">Set grading criteria</p>
                      <p className="text-xs text-blue-400/80">Define grading criteria now or when all test scores are available.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-gray-300">Pass mark</p>
                    <button 
                      onClick={() => setPassMarkEnabled(!passMarkEnabled)}
                      className={`relative w-11 h-6 transition-colors rounded-full ${passMarkEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${passMarkEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {passMarkEnabled && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Value</label>
                        <input
                          type="number"
                          value={passMarkValue}
                          onChange={(e) => setPassMarkValue(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
                        <select
                          value={passMarkUnit}
                          onChange={(e) => setPassMarkUnit(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none"
                        >
                          <option value="%">%</option>
                          <option value="points">Points</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800 mt-2">
                    <p className="text-sm text-gray-300">Define grade ranges based on points or percents</p>
                    <button className="relative w-11 h-6 bg-gray-700 rounded-full">
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                </div>

                {/* Section 3: Information for Respondents */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Information for respondents</h3>
                    <p className="text-sm text-gray-400">Choose what information to show to respondents at the end of the test</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {[
                      { key: 'percentageScore', label: 'Percentage score' },
                      { key: 'pointsScore', label: 'Points score' },
                      { key: 'grade', label: 'Grade' },
                      { key: 'descriptiveGrade', label: 'Descriptive grade' },
                      { key: 'correctAnswers', label: 'Correct answers to questions' },
                      { key: 'passFailMessage', label: 'Pass or fail message' },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-950/40 cursor-pointer hover:border-gray-700 transition-colors">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          feedbackOptions[opt.key as keyof typeof feedbackOptions] 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-gray-600'
                        }`}>
                          {feedbackOptions[opt.key as keyof typeof feedbackOptions] && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={feedbackOptions[opt.key as keyof typeof feedbackOptions]}
                          onChange={() => setFeedbackOptions(prev => ({ ...prev, [opt.key]: !prev[opt.key as keyof typeof feedbackOptions] }))}
                        />
                        <span className="text-xs text-gray-300">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {feedbackOptions.passFailMessage && (
                    <div className="space-y-5 pt-4 border-t border-gray-800 animate-in fade-in duration-300">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Message for users who have passed</label>
                        <textarea
                          value={passMessage}
                          onChange={(e) => setPassMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Message for users who have failed</label>
                        <textarea
                          value={failMessage}
                          onChange={(e) => setFailMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800 mt-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        Inform respondent about result via email
                        <Mail className="w-4 h-4 text-violet-400" />
                      </p>
                      <p className="text-xs text-gray-500">The email will display the same content as the one at the end of the test.</p>
                    </div>
                    <button 
                      onClick={() => setEmailNotification(!emailNotification)}
                      className={`relative w-11 h-6 transition-colors rounded-full ${emailNotification ? 'bg-violet-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${emailNotification ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end p-2">
                  <button
                    onClick={() => setSuccess('Grading settings saved locally.')}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    Save grading settings
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'time' && canAccessControllerOnly && (
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Time Settings</h3>
                <p className="text-sm text-gray-400">Set exam start/end time, duration, and time restrictions.</p>
              </div>
            )}

            {activeStep === 'certificate' && canAccessControllerOnly && (
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Certificate Template</h3>
                <p className="text-sm text-gray-400">Choose or design the certificate format for exam completion.</p>
              </div>
            )}

            {activeStep === 'activate' && canAccessControllerOnly && (
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-4">
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

      {showAiModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/10"
          >
            <div className="px-8 pt-8 pb-6 border-b border-gray-800 bg-gradient-to-br from-violet-500/10 to-transparent">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">AI Question Generator</h3>
              <p className="text-sm text-gray-400">Describe the topic or area you want questions for. Our AI will handle the rest.</p>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">TOPIC OR DESCRIPTION</label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Basic concepts of React Hooks like useState and useEffect..."
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">NUMBER OF QUESTIONS</label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-2xl text-sm text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 8, 10].map(n => (
                      <option key={n} value={n}>{n} Questions</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">DIFFICULTY</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-2xl text-sm text-white focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="px-8 py-6 bg-gray-950/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-800 text-sm font-semibold text-gray-400 hover:bg-gray-800 transition-colors"
                disabled={aiGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating}
                className="px-8 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-wait"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
