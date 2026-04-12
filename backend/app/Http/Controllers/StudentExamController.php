<?php

namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Notifications\ExamNotification;
use Illuminate\Support\Facades\Notification;
use App\Models\Exam;
use App\Models\ExamAccess;
use App\Models\ExamAccessUser;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\Result;
use App\Models\Submission;
use App\Models\User;
use App\Services\AiService;
use App\Services\AuditTrailService;
use App\Services\IncidentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
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
            ->where(function ($query) use ($studentEmail) {
                $query->whereDoesntHave('accessUsers')
                    ->orWhereHas('accessUsers', function ($userQuery) use ($studentEmail) {
                        $userQuery->whereRaw('LOWER(TRIM(email)) = ?', [$studentEmail]);
                    });
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
                'upcoming' => $exams->where('status', 'Scheduled')->values(),
                'ongoing' => $exams->filter(fn (array $exam) => in_array($exam['status'] ?? '', ['Active', 'In Progress'], true))->values(),
                'completed' => $exams->where('status', 'Completed')->values(),
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
            ->latest('id')
            ->first();

        if ($existing && in_array($existing->status, ['submitted', 'timeout', 'graded'])) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted this exam and cannot enter again.',
            ], 403);
        }

        if ($existing && $existing->status === 'in_progress') {
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

    public function startPublic(Request $request, Exam $exam)
    {
        $token = (string) $request->input('token', '');
        $email = strtolower(trim((string) $request->input('email', '')));

        if ($token === '') {
            return response()->json(['message' => 'Access token is required.'], 403);
        }

        $hashedToken = hash('sha256', $token);
        $config = ExamAccess::query()->where('exam_id', $exam->id)->first();

        // 1. Verify Public access
        if (!$config || $config->access_type !== 'public' || $config->access_token !== $hashedToken) {
            return response()->json(['message' => 'Invalid or expired access link.'], 403);
        }

        if ($config->require_email && $email === '') {
            return response()->json(['message' => 'Email is required to start this exam.'], 400);
        }

        // 2. Resolve User (find or create)
        $user = User::where('email', $email)->first();
        if (!$user) {
            $studentRoleId = \App\Models\Role::where('name', 'student')->value('id');

            if (! $studentRoleId) {
                return response()->json(['message' => 'Student role is not configured.'], 500);
            }

            $user = User::create([
                'name' => explode('@', $email)[0],
                'email' => $email,
                'password' => \Illuminate\Support\Facades\Hash::make(Str::random(16)),
                'role_id' => $studentRoleId,
                'is_active' => true,
            ]);
        }

        // 3. Start Attempt
        $existing = ExamAttempt::query()
            ->where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->latest('id')
            ->first();

        if ($existing && in_array($existing->status, ['submitted', 'timeout', 'graded'])) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted this exam.',
            ], 403);
        }

        if ($existing && $existing->status === 'in_progress') {
            return response()->json([
                'success' => true,
                'message' => 'Resuming active session',
                'data' => $this->attemptPayload($existing->load('exam.questions', 'answers')),
                'token' => $user->createToken('guest_exam_token')->plainTextToken,
            ]);
        }

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => (int) $exam->duration,
            'status' => 'in_progress',
            'last_ip' => $request->ip(),
            'last_user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Exam session started',
            'data' => $this->attemptPayload($attempt->load('exam.questions', 'answers')),
            'token' => $user->createToken('guest_exam_token')->plainTextToken,
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
            'selected_answer' => 'nullable|string',
            'selected_option' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 400);
        }

        $selectedOption = trim((string) ($request->input('selected_option') ?? $request->input('selected_answer') ?? ''));

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

        if ($selectedOption === '') {
            AttemptAnswer::query()
                ->where('attempt_id', $attempt->id)
                ->where('question_id', $request->integer('question_id'))
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Answer cleared',
                'data' => [
                    'remainingSeconds' => $this->remainingSeconds($attempt->fresh()),
                ],
            ]);
        }

        $answer = AttemptAnswer::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $request->integer('question_id'),
            ],
            [
                'selected_answer' => $selectedOption,
                'selected_option' => $selectedOption,
                'answer_text' => $selectedOption,
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
        $now = now();

        $results = Result::query()
            ->with(['attempt.exam.subject'])
            ->whereHas('attempt', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->latest('published_at')
            ->get()
            ->map(function (Result $result) use ($now) {
                $attempt = $result->attempt;
                $exam = $attempt?->exam;
                $percentage = 0.0;

                // Exam end time is the authoritative release gate so schedule edits take effect immediately.
                $releaseAt = $exam?->end_time ?? $result->published_at;
                $isPublished = ! $releaseAt || $releaseAt->lessThanOrEqualTo($now);

                if ($result->total_marks > 0) {
                    $percentage = round(((float) $result->score / (float) $result->total_marks) * 100, 2);
                }

                return [
                    'resultId' => $result->id,
                    'examId' => $exam?->id,
                    'examName' => $exam?->title,
                    'courseName' => $exam?->subject?->name,
                    'score' => $isPublished ? (float) $result->score : null,
                    'totalMarks' => (int) $result->total_marks,
                    'grade' => $isPublished ? ($result->grade ?? $this->gradeFromPercentage($percentage)) : null,
                    'isPublished' => $isPublished,
                    'publishedAt' => $releaseAt?->toISOString() ?? $result->updated_at?->toISOString() ?? now()->toISOString(),
                    'submittedAt' => $attempt?->submitted_at?->toISOString() ?? $attempt?->end_time?->toISOString() ?? $result->published_at?->toISOString() ?? now()->toISOString(),
                    'feedback' => $result->feedback,
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
        $attempts = ExamAttempt::query()
            ->with(['exam.subject', 'result'])
            ->where('user_id', $request->user()->id)
            ->latest('submitted_at')
            ->latest('created_at')
            ->get()
            ->map(function (ExamAttempt $attempt) {
                $exam = $attempt->exam;
                $result = $attempt->result;

                return [
                    'attemptId' => $attempt->id,
                    'examId' => $exam?->id,
                    'examName' => $exam?->title,
                    'courseName' => $exam?->subject?->name,
                    'submissionDateTime' => $attempt->submitted_at?->toISOString() ?? $attempt->end_time?->toISOString() ?? $attempt->created_at?->toISOString(),
                    'durationTakenMinutes' => $this->durationTakenMinutes($attempt),
                    'status' => $attempt->status,
                    'score' => $result?->score,
                    'totalMarks' => $result?->total_marks,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Submission history fetched successfully',
            'data' => $attempts,
        ]);
    }

    private function attemptPayload(ExamAttempt $attempt): array
    {
        $attempt->loadMissing('exam.questions', 'answers', 'result');

        $answersByQuestion = $attempt->answers->keyBy('question_id');
        $obtainedMarks = 0;
        $totalMarks = (int) $attempt->exam->questions->sum('marks');

        foreach ($attempt->exam->questions as $question) {
            $savedAnswer = $answersByQuestion->get($question->id);

            if ($savedAnswer && $this->isObjectiveAnswerCorrect($question, $savedAnswer->selected_answer ?? $savedAnswer->selected_option)) {
                $obtainedMarks += (int) $question->marks;
            }
        }

        if ($attempt->result) {
            $obtainedMarks = (int) $attempt->result->score;
            $totalMarks = (int) $attempt->result->total_marks;
        }

        $percentage = $totalMarks > 0 ? round(($obtainedMarks / $totalMarks) * 100, 2) : 0.0;

        $questions = $attempt->exam->questions->map(function ($question) use ($answersByQuestion) {
            $savedAnswer = $answersByQuestion->get($question->id);

            return [
                'id' => $question->id,
                'type' => $question->type,
                'questionText' => $question->question_text,
                'options' => $question->options,
                'marks' => $question->marks,
                'selectedAnswer' => $savedAnswer?->selected_answer ?? $savedAnswer?->selected_option,
            ];
        })->values();

        return [
            'attemptId' => $attempt->id,
            'attempt_id' => $attempt->id,
            'examId' => $attempt->exam_id,
            'exam_id' => $attempt->exam_id,
            'examName' => $attempt->exam->title,
            'exam_name' => $attempt->exam->title,
            'status' => $attempt->status,
            'startTime' => ($attempt->start_time ?? $attempt->started_at)?->toISOString(),
            'start_time' => ($attempt->start_time ?? $attempt->started_at)?->toISOString(),
            'endTime' => ($attempt->end_time ?? $attempt->submitted_at)?->toISOString(),
            'end_time' => ($attempt->end_time ?? $attempt->submitted_at)?->toISOString(),
            'durationMinutes' => (int) $attempt->duration,
            'duration_minutes' => (int) $attempt->duration,
            'remainingSeconds' => $this->remainingSeconds($attempt),
            'remaining_seconds' => $this->remainingSeconds($attempt),
            'totalQuestions' => $attempt->exam->questions->count(),
            'total_questions' => $attempt->exam->questions->count(),
            'totalMarks' => $totalMarks,
            'total_marks' => $totalMarks,
            'obtainedMarks' => $obtainedMarks,
            'obtained_marks' => $obtainedMarks,
            'percentage' => $percentage,
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
        if (! $exam->accessUsers()->exists()) {
            return true;
        }

        return ExamAccessUser::query()
            ->where('exam_id', $exam->id)
            ->whereRaw('LOWER(TRIM(email)) = ?', [$studentEmail])
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
        // 1. If student has already finished, it's completed for them
        if ($attempt && in_array($attempt->status, ['submitted', 'timeout', 'graded'], true)) {
            return 'Completed';
        }

        // 2. If the global window has passed
        if ($exam->end_time < $now) {
            return 'Completed';
        }

        // 3. If window not yet open
        if ($exam->start_time > $now) {
            return 'Scheduled';
        }

        // 4. If window is open AND student has an active session
        if ($attempt && $attempt->status === 'in_progress') {
            return 'In Progress';
        }

        // 5. Window is open, no attempt started
        return 'Active';
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
            $attempt->loadMissing('exam.questions', 'answers', 'user');

            $questions = $attempt->exam->questions;
            $answers = $attempt->answers->keyBy('question_id');

            $score = 0;
            $correctCount = 0;

            $ai = app(AiService::class);

            foreach ($questions as $question) {
                $answer = $answers->get($question->id);

                if (! $answer) {
                    continue;
                }

                $type = strtolower($question->type);

                if ($type === 'descriptive' || $type === 'short_answer') {
                    $eval = $ai->evaluateAnswer(
                        $question->question_text,
                        $answer->selected_answer ?? $answer->selected_option,
                        $question->correct_answer,
                        (int) $question->marks
                    );

                    $isCorrect = $eval['is_correct'] ?? false;
                    $awarded = (float) ($eval['score'] ?? 0);

                    $answer->update([
                        'is_correct' => $isCorrect,
                        'score_awarded' => $awarded,
                        'feedback' => $eval['feedback'] ?? '',
                        'is_ai_evaluated' => true,
                    ]);

                    $score += $awarded;
                    if ($isCorrect) {
                        $correctCount++;
                    }
                    continue;
                }

                $isCorrect = $this->isObjectiveAnswerCorrect($question, $answer->selected_answer ?? $answer->selected_option);
                $awarded = $isCorrect ? (float) $question->marks : 0.0;

                $answer->update([
                    'is_correct' => $isCorrect,
                    'score_awarded' => $awarded,
                ]);

                if ($isCorrect) {
                    $correctCount++;
                    $score += $awarded;
                }
            }

            $submittedAt = now();

            $attempt->update([
                'status' => $status,
                'end_time' => $submittedAt,
                'submitted_at' => $submittedAt,
            ]);

            $releaseAt = $attempt->exam->end_time
                ? Carbon::parse($attempt->exam->end_time)
                : $submittedAt;
            $isPublished = $releaseAt->lessThanOrEqualTo($submittedAt);

            $result = Result::firstOrNew(['attempt_id' => $attempt->id]);
            $result->score = $score;
            $result->total_marks = (int) $questions->sum('marks');
            $result->evaluated_at = $submittedAt;
            $result->grade = $this->gradeFromScore($score, (int) $questions->sum('marks'));
            $result->published_at = $releaseAt;
            $result->save();

            // Notify Student
            $totalMarks = $result->total_marks;
            if ($attempt->user) {
                $notificationMessage = $isPublished
                    ? "Your exam has been graded. You scored {$score} out of {$totalMarks}."
                    : 'Your exam has been evaluated. Marks will be visible after the exam window closes.';

                $attempt->user->notify(new ExamNotification(
                    'Exam Graded: ' . $attempt->exam->title,
                    $notificationMessage,
                    'success',
                    '/student/attempts/' . $attempt->id
                ));
            }

            $this->notifyExamStaffOfSubmission($attempt, $status, $submittedAt);

            return [
                'score' => $isPublished ? $score : null,
                'totalMarks' => (int) $questions->sum('marks'),
                'correctAnswers' => $correctCount,
                'answeredQuestions' => $attempt->answers()->count(),
                'totalQuestions' => $questions->count(),
                'isPublished' => $isPublished,
                'resultsAvailableAt' => $releaseAt->toISOString(),
            ];
        });
    }

    private function gradeFromScore(float $score, int $total): string
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

    private function isObjectiveAnswerCorrect(Question $question, ?string $selectedAnswer): bool
    {
        $selectedTokens = $this->tokenizeAnswer($selectedAnswer);
        $correctTokens = $this->tokenizeAnswer($question->correct_answer);

        if ($selectedTokens === [] || $correctTokens === []) {
            return false;
        }

        $optionMap = $this->normalizedOptionMap(is_array($question->options) ? $question->options : null);

        $selectedResolved = array_map(fn (string $token) => $this->resolveTokenToCanonicalKey($token, $optionMap), $selectedTokens);
        $correctResolved = array_map(fn (string $token) => $this->resolveTokenToCanonicalKey($token, $optionMap), $correctTokens);

        sort($selectedResolved);
        sort($correctResolved);

        return $selectedResolved === $correctResolved;
    }

    private function normalizeAnswer(?string $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return preg_replace('/\s+/', ' ', $normalized) ?? $normalized;
    }

    private function tokenizeAnswer(?string $value): array
    {
        $normalized = $this->normalizeAnswer($value);

        if ($normalized === '') {
            return [];
        }

        $parts = preg_split('/\s*[,;|]\s*/', $normalized) ?: [];
        $tokens = array_values(array_filter(array_map(fn (string $part) => $this->normalizeAnswer($part), $parts), fn (string $part) => $part !== ''));

        return $tokens === [] ? [$normalized] : $tokens;
    }

    private function normalizedOptionMap(?array $options): array
    {
        if (! is_array($options)) {
            return [];
        }

        $map = [];
        $letterIndex = 0;

        foreach ($options as $rawKey => $rawValue) {
            if (! is_scalar($rawValue)) {
                continue;
            }

            $value = $this->normalizeAnswer((string) $rawValue);
            if ($value === '') {
                continue;
            }

            $key = is_int($rawKey) || ctype_digit((string) $rawKey)
                ? strtolower(chr(65 + $letterIndex))
                : $this->normalizeAnswer((string) $rawKey);

            $map[$key] = $value;
            $letterIndex++;
        }

        return $map;
    }

    private function resolveTokenToCanonicalKey(string $token, array $optionMap): string
    {
        if (array_key_exists($token, $optionMap)) {
            return $token;
        }

        foreach ($optionMap as $key => $value) {
            if ($value === $token) {
                return $key;
            }
        }

        return $token;
    }

    private function notifyExamStaffOfSubmission(ExamAttempt $attempt, string $status, Carbon $submittedAt): void
    {
        try {
            $exam = $attempt->exam;
            if (! $exam) {
                return;
            }

            $recipientIds = array_values(array_unique(array_filter([
                $exam->teacher_id,
                $exam->controller_id,
                $exam->question_setter_id,
                $exam->moderator_id,
                $exam->invigilator_id,
            ], fn ($id) => ! is_null($id) && (int) $id > 0)));

            $recipientIds = array_values(array_filter(
                $recipientIds,
                fn (int $id) => $id !== (int) $attempt->user_id
            ));

            if ($recipientIds === []) {
                return;
            }

            $eventKey = 'exam_submission_' . $attempt->id;

            $alreadyNotifiedIds = DatabaseNotification::query()
                ->where('type', ExamNotification::class)
                ->where('notifiable_type', User::class)
                ->whereIn('notifiable_id', $recipientIds)
                ->where('data->event_key', $eventKey)
                ->pluck('notifiable_id')
                ->map(fn ($value) => (int) $value)
                ->all();

            $pendingRecipientIds = array_values(array_diff($recipientIds, $alreadyNotifiedIds));

            if ($pendingRecipientIds === []) {
                return;
            }

            $studentName = trim((string) ($attempt->user?->name ?? 'A student'));
            $statusLabel = $status === 'timeout' ? 'was auto-submitted (time expired)' : 'submitted';
            $message = sprintf(
                '%s %s the exam "%s" at %s.',
                $studentName,
                $statusLabel,
                (string) $exam->title,
                $submittedAt->format('Y-m-d H:i')
            );

            $recipients = User::query()->whereIn('id', $pendingRecipientIds)->get();

            Notification::send($recipients, new ExamNotification(
                'Exam Submission Received',
                $message,
                'info',
                '/teacher/results',
                $eventKey,
                (int) $exam->id
            ));
        } catch (\Throwable) {
            // Notifications should never block submission flow.
        }
    }

    private function durationTakenMinutes(ExamAttempt $attempt): ?int
    {
        $startedAt = $attempt->start_time ?? $attempt->started_at;
        $endedAt = $attempt->submitted_at ?? $attempt->end_time;

        if (! $startedAt || ! $endedAt) {
            return null;
        }

        return max(0, (int) round(Carbon::parse($startedAt)->diffInSeconds(Carbon::parse($endedAt)) / 60));
    }
}
