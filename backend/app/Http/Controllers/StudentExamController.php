<?php

namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Models\Exam;
use App\Models\ExamAccess;
use App\Models\ExamAccessUser;
use App\Models\ExamAttempt;
use App\Models\Submission;
use App\Services\AuditTrailService;
use App\Services\IncidentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StudentExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $now = now();
        $studentEmail = strtolower((string) $request->user()->email);

        $exams = Exam::query()
            ->with(['subject:id,name,subject_code'])
            ->whereHas('accessUsers', function ($userQuery) use ($studentEmail) {
                $userQuery->whereRaw('LOWER(email) = ?', [$studentEmail]);
            })
            ->orderBy('start_time')
            ->get()
            ->map(function (Exam $exam) use ($now, $request) {
                $attempt = ExamAttempt::query()
                    ->where('user_id', $request->user()->id)
                    ->where('exam_id', $exam->id)
                    ->latest('id')
                    ->first();

                return [
                    'id' => $exam->id,
                    'examName' => $exam->title,
                    'courseName' => $exam->subject?->name,
                    'subjectCode' => $exam->subject?->subject_code,
                    'date' => $exam->start_time?->toDateString(),
                    'startTime' => $exam->start_time?->toISOString(),
                    'endTime' => $exam->end_time?->toISOString(),
                    'durationMinutes' => (int) $exam->duration,
                    'status' => $this->examStatus($exam, $attempt, $now),
                    'attemptId' => $attempt?->id,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Student exams fetched successfully',
            'data' => [
                'upcoming' => $exams->where('status', 'upcoming')->values(),
                'ongoing' => $exams->where('status', 'ongoing')->values(),
                'completed' => $exams->where('status', 'completed')->values(),
            ],
        ]);
    }

    public function start(Request $request, Exam $exam, IncidentService $incidentService, AuditTrailService $auditTrailService): JsonResponse
    {
        if (! $this->hasStudentAccess($exam, strtolower((string) $request->user()->email))) {
            return response()->json([
                'success' => false,
                'message' => 'You are not assigned to this exam.',
            ], 403);
        }

        if (! $this->isWithinExamWindow($exam)) {
            return response()->json([
                'success' => false,
                'message' => 'Exam is not accessible outside its allowed time window.',
            ], 403);
        }

        $existing = ExamAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('exam_id', $exam->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if ($existing) {
            $incidentService->record(
                $request->user(),
                $exam->id,
                $existing->id,
                'multiple_attempt_start_requests',
                'medium',
                ['message' => 'Student attempted to start while another session is active.'],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Resuming existing active session',
                'data' => $this->attemptPayload($existing->load('exam.questions', 'answers')),
            ]);
        }

        $attempt = ExamAttempt::create([
            'user_id' => $request->user()->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => (int) $exam->duration,
            'status' => 'in_progress',
            'last_ip' => $request->ip(),
            'last_user_agent' => $request->userAgent(),
        ]);

        $auditTrailService->log(
            $request->user(),
            'student.exam_started',
            [
                'attempt_id' => $attempt->id,
                'exam_id' => $exam->id,
                'timestamp' => now()->toISOString(),
            ],
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Exam session started',
            'data' => $this->attemptPayload($attempt->load('exam.questions', 'answers')),
        ], 201);
    }

    public function showAttempt(Request $request, ExamAttempt $attempt, IncidentService $incidentService): JsonResponse
    {
        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $incidentService->detectAttemptEnvironmentDrift($attempt, $request);
        $this->autoFinalizeIfExpired($attempt);

        return response()->json([
            'success' => true,
            'message' => 'Attempt fetched successfully',
            'data' => $this->attemptPayload($attempt->fresh()->load('exam.questions', 'answers')),
        ]);
    }

    public function saveAnswer(Request $request, ExamAttempt $attempt, IncidentService $incidentService, AuditTrailService $auditTrailService): JsonResponse
    {
        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'question_id' => 'required|integer|exists:questions,id',
            'selected_answer' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 400);
        }

        if ($attempt->status !== 'in_progress') {
            return response()->json(['success' => false, 'message' => 'Attempt already finalized'], 409);
        }

        $this->autoFinalizeIfExpired($attempt);
        $attempt->refresh();

        if ($attempt->status !== 'in_progress') {
            return response()->json(['success' => false, 'message' => 'Time expired. Attempt auto-submitted.'], 409);
        }

        $belongsToExam = $attempt->exam->questions()->where('id', $request->integer('question_id'))->exists();

        if (! $belongsToExam) {
            return response()->json(['success' => false, 'message' => 'Question does not belong to this exam'], 400);
        }

        $answer = AttemptAnswer::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $request->integer('question_id'),
            ],
            [
                'selected_answer' => $request->string('selected_answer')->toString(),
            ]
        );

        $incidentService->detectAttemptEnvironmentDrift($attempt, $request);

        $auditTrailService->log(
            $request->user(),
            'student.answer_saved',
            [
                'attempt_id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'question_id' => $answer->question_id,
                'timestamp' => now()->toISOString(),
            ],
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Answer saved',
            'data' => [
                'answerId' => $answer->id,
                'remainingSeconds' => $this->remainingSeconds($attempt->fresh()),
            ],
        ]);
    }

    public function submit(Request $request, ExamAttempt $attempt, IncidentService $incidentService, AuditTrailService $auditTrailService): JsonResponse
    {
        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        if ($attempt->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Attempt already finalized',
                'data' => ['status' => $attempt->status],
            ], 409);
        }

        $incidentService->detectAttemptEnvironmentDrift($attempt, $request);
        $summary = $this->finalizeAttempt($attempt, 'submitted');

        $auditTrailService->log(
            $request->user(),
            'student.exam_submitted',
            [
                'attempt_id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'timestamp' => now()->toISOString(),
                'summary' => $summary,
            ],
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Exam submitted successfully',
            'data' => [
                'attemptId' => $attempt->id,
                'status' => 'submitted',
                'summary' => $summary,
            ],
        ]);
    }

    public function telemetry(Request $request, ExamAttempt $attempt, IncidentService $incidentService): JsonResponse
    {
        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'eventType' => 'required|in:tab_switch,window_blur,focus_return,suspicious_pattern',
            'meta' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 400);
        }

        $severity = in_array($request->string('eventType')->toString(), ['tab_switch', 'window_blur'], true) ? 'medium' : 'low';

        $incidentService->record(
            $request->user(),
            (int) $attempt->exam_id,
            (int) $attempt->id,
            $request->string('eventType')->toString(),
            $severity,
            [
                'client_meta' => $request->input('meta', []),
                'timestamp' => now()->toISOString(),
            ],
            $request
        );

        return response()->json(['success' => true, 'message' => 'Telemetry recorded']);
    }

    public function results(Request $request): JsonResponse
    {
        $results = Submission::query()
            ->with(['exam.subject'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'evaluated')
            ->latest('evaluated_at')
            ->get()
            ->map(function (Submission $submission) {
                $exam = $submission->exam;
                $percentage = (float) $submission->percentage;

                return [
                    'resultId' => $submission->id,
                    'examId' => $exam?->id,
                    'examName' => $exam?->title,
                    'courseName' => $exam?->subject?->name,
                    'score' => (int) $submission->score,
                    'totalMarks' => (int) $submission->total_marks,
                    'grade' => $this->gradeFromPercentage($percentage),
                    'publishedAt' => $submission->evaluated_at?->toISOString() ?? $submission->created_at?->toISOString(),
                    'submittedAt' => $submission->evaluated_at?->toISOString() ?? $submission->created_at?->toISOString(),
                    'feedback' => null,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Published results fetched successfully',
            'data' => $results,
        ]);
    }

    public function submissions(Request $request): JsonResponse
    {
        $submissions = Submission::query()
            ->with(['exam.subject'])
            ->where('user_id', $request->user()->id)
            ->latest('evaluated_at')
            ->latest('created_at')
            ->get()
            ->map(function (Submission $submission) {
                $exam = $submission->exam;

                return [
                    'attemptId' => $submission->id,
                    'examId' => $exam?->id,
                    'examName' => $exam?->title,
                    'courseName' => $exam?->subject?->name,
                    'submissionDateTime' => $submission->evaluated_at?->toISOString() ?? $submission->created_at?->toISOString(),
                    'durationTakenMinutes' => null,
                    'status' => $submission->status,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Submission history fetched successfully',
            'data' => $submissions,
        ]);
    }

    private function attemptPayload(ExamAttempt $attempt): array
    {
        $answersByQuestion = $attempt->answers->keyBy('question_id');

        $questions = $attempt->exam->questions->map(function ($question) use ($answersByQuestion) {
            $savedAnswer = $answersByQuestion->get($question->id);

            return [
                'id' => $question->id,
                'type' => $question->type,
                'questionText' => $question->question_text,
                'options' => $question->options,
                'marks' => $question->marks,
                'selectedAnswer' => $savedAnswer?->selected_answer,
            ];
        })->values();

        return [
            'attemptId' => $attempt->id,
            'examId' => $attempt->exam_id,
            'examName' => $attempt->exam->title,
            'status' => $attempt->status,
            'startTime' => ($attempt->start_time ?? $attempt->started_at)?->toISOString(),
            'endTime' => ($attempt->end_time ?? $attempt->submitted_at)?->toISOString(),
            'durationMinutes' => (int) $attempt->duration,
            'remainingSeconds' => $this->remainingSeconds($attempt),
            'questions' => $questions,
        ];
    }

    private function isWithinExamWindow(Exam $exam): bool
    {
        $now = now();

        return $exam->start_time <= $now && $exam->end_time >= $now;
    }

    private function hasStudentAccess(Exam $exam, string $studentEmail): bool
    {
        return ExamAccessUser::query()
            ->where('exam_id', $exam->id)
            ->whereRaw('LOWER(email) = ?', [$studentEmail])
            ->exists();
    }

    private function gradeFromPercentage(float $percentage): string
    {
        return match (true) {
            $percentage >= 90 => 'A+',
            $percentage >= 80 => 'A',
            $percentage >= 70 => 'B',
            $percentage >= 60 => 'C',
            $percentage >= 50 => 'D',
            default => 'F',
        };
    }

    private function examStatus(Exam $exam, ?ExamAttempt $attempt, Carbon $now): string
    {
        if ($attempt && in_array($attempt->status, ['submitted', 'timeout'], true)) {
            return 'completed';
        }

        if ($exam->start_time > $now) {
            return 'upcoming';
        }

        if ($exam->end_time < $now) {
            return 'completed';
        }

        return 'ongoing';
    }

    private function autoFinalizeIfExpired(ExamAttempt $attempt): void
    {
        if ($attempt->status !== 'in_progress') {
            return;
        }

        if ($this->remainingSeconds($attempt) <= 0) {
            $this->finalizeAttempt($attempt, 'timeout');
        }
    }

    private function remainingSeconds(ExamAttempt $attempt): int
    {
        $startedAt = $attempt->start_time ?? $attempt->started_at;

        if (! $startedAt) {
            return 0;
        }

        $elapsed = Carbon::parse($startedAt)->diffInSeconds(now());
        $remaining = ((int) $attempt->duration * 60) - $elapsed;

        return max(0, $remaining);
    }

    private function finalizeAttempt(ExamAttempt $attempt, string $status): array
    {
        return DB::transaction(function () use ($attempt, $status) {
            $attempt->loadMissing('exam.questions', 'answers');

            $questions = $attempt->exam->questions;
            $answers = $attempt->answers->keyBy('question_id');

            $score = 0;
            $correctCount = 0;

            foreach ($questions as $question) {
                $answer = $answers->get($question->id);

                if (! $answer) {
                    continue;
                }

                if ($question->type === 'descriptive') {
                    continue;
                }

                $isCorrect = (string) $answer->selected_answer === (string) $question->correct_answer;
                $answer->update(['is_correct' => $isCorrect]);

                if ($isCorrect) {
                    $correctCount++;
                    $score += (int) $question->marks;
                }
            }

            $submittedAt = now();

            $attempt->update([
                'status' => $status,
                'end_time' => $submittedAt,
                'submitted_at' => $submittedAt,
            ]);

            $result = Result::firstOrNew(['attempt_id' => $attempt->id]);
            $result->score = $score;
            $result->total_marks = (int) $questions->sum('marks');
            $result->grade = $this->gradeFromScore($score, (int) $questions->sum('marks'));
            $result->save();

            return [
                'score' => $score,
                'totalMarks' => (int) $questions->sum('marks'),
                'correctAnswers' => $correctCount,
                'answeredQuestions' => $attempt->answers()->count(),
                'totalQuestions' => $questions->count(),
            ];
        });
    }

    private function gradeFromScore(int $score, int $total): string
    {
        if ($total <= 0) {
            return 'N/A';
        }

        $percent = ($score / $total) * 100;

        return match (true) {
            $percent >= 90 => 'A+',
            $percent >= 80 => 'A',
            $percent >= 70 => 'B',
            $percent >= 60 => 'C',
            $percent >= 50 => 'D',
            default => 'F',
        };
    }
}
