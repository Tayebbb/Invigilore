<?php
namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamAccessUser;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\Result;
use App\Models\User;
use App\Notifications\ExamNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ExamAttemptController extends Controller
{
    public function startAttempt(Request $request): JsonResponse
    {
        return $this->start($request);
    }

    public function storeFromExamId(Request $request): JsonResponse
    {
        return $this->start($request);
    }

    /**
     * Contract-compliant endpoint: POST /api/attempts
     * Starts a new exam attempt for the authenticated student.
     * Returns 201 with attempt and questions, 409 if already active, 403 if not allowed, 404 if exam not found.
     */
    public function store(Request $request): JsonResponse
    {
        return $this->start($request);
    }

    public function start(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'exam_id' => 'required|integer|exists:exams,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (strtolower((string) ($user?->role?->name ?? '')) !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $exam = Exam::findOrFail($request->integer('exam_id'));

        $hasActiveAttempt = ExamAttempt::query()
            ->where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->when(Schema::hasColumn('exam_attempts', 'status'), function ($query) {
                $query->where('status', 'in_progress');
            }, function ($query) {
                if (Schema::hasColumn('exam_attempts', 'submitted_at')) {
                    $query->whereNull('submitted_at');
                }
            })
            ->exists();

        if ($hasActiveAttempt) {
            return response()->json([
                'message' => 'An active attempt already exists for this exam.',
            ], 409);
        }

        $startTime = now();

        $attemptData = [
            'user_id' => $user->id,
            'exam_id' => $exam->id,
        ];

        if (Schema::hasColumn('exam_attempts', 'start_time')) {
            $attemptData['start_time'] = $startTime;
        }

        if (Schema::hasColumn('exam_attempts', 'started_at')) {
            $attemptData['started_at'] = $startTime;
        }

        if (Schema::hasColumn('exam_attempts', 'end_time')) {
            $attemptData['end_time'] = null;
        }

        if (Schema::hasColumn('exam_attempts', 'duration')) {
            $attemptData['duration'] = (int) $exam->duration;
        }

        if (Schema::hasColumn('exam_attempts', 'status')) {
            $attemptData['status'] = 'in_progress';
        }

        if (Schema::hasColumn('exam_attempts', 'submitted_at')) {
            $attemptData['submitted_at'] = null;
        }

        $attempt = ExamAttempt::create($attemptData);

        $this->logAudit($request, 'attempt_started', [
            'attempt_id' => $attempt->id,
            'exam_id' => $attempt->exam_id,
            'metadata' => [
                'exam_id' => $attempt->exam_id,
            ],
        ]);

        $questions = $exam->questions()
            ->inRandomOrder()
            ->get(['id', 'exam_id', 'question_text', 'type', 'options', 'marks']);

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'start_time' => $this->attemptStartTime($attempt),
                'duration' => $this->attemptDuration($attempt, $exam),
                'status' => $this->attemptStatus($attempt),
            ],
            'questions' => $questions,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $attempt = ExamAttempt::with(['exam.questions:id,exam_id,question_text,type,options,marks', 'answers'])
            ->findOrFail($id);

        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $this->autoSubmitIfExpired($attempt);
        $attempt->refresh()->load(['exam.questions:id,exam_id,question_text,type,options,marks', 'answers']);

        $answersByQuestion = $attempt->answers->keyBy('question_id');
        $questions = $attempt->exam->questions->map(function ($question) use ($answersByQuestion) {
            $answer = $answersByQuestion->get($question->id);

            return [
                'id' => $question->id,
                'exam_id' => $question->exam_id,
                'question_text' => $question->question_text,
                'type' => $question->type,
                'options' => $question->options,
                'marks' => $question->marks,
                'selected_answer' => $answer?->selected_answer,
            ];
        });

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'start_time' => $this->attemptStartTime($attempt),
                'end_time' => $this->attemptEndTime($attempt),
                'duration' => $this->attemptDuration($attempt),
                'status' => $this->attemptStatus($attempt),
            ],
            'remaining_time' => $this->remainingSeconds($attempt),
            'questions' => $questions,
        ]);
    }

    public function saveAnswer(Request $request, int $id): JsonResponse
    {
        $selectedOption = trim((string) ($request->input('selected_option') ?? $request->input('selected_answer') ?? ''));

        $request->merge([
            'selected_option' => $selectedOption,
        ]);

        $validator = Validator::make($request->all(), [
            'question_id' => 'required|integer|exists:questions,id',
            'selected_option' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attempt = ExamAttempt::with('exam')->findOrFail($id);

        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $this->isAttemptInProgress($attempt)) {
            return response()->json(['message' => 'Attempt already submitted'], 409);
        }

        $this->autoSubmitIfExpired($attempt);
        $attempt->refresh();

        if (! $this->isAttemptInProgress($attempt)) {
            return response()->json(['message' => 'Time expired. Attempt auto-submitted.'], 409);
        }

        $questionExistsInExam = $attempt->exam
            ->questions()
            ->where('id', $request->integer('question_id'))
            ->exists();

        if (! $questionExistsInExam) {
            return response()->json(['message' => 'Question does not belong to this exam'], 422);
        }

        $answer = AttemptAnswer::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $request->integer('question_id'),
            ],
            [
                'selected_answer' => $request->string('selected_option')->trim()->toString(),
                'selected_option' => $request->string('selected_option')->trim()->toString(),
                'answer_text' => $request->string('selected_option')->trim()->toString(),
            ]
        );

        $this->logAudit($request, 'answer_saved', [
            'attempt_id' => $attempt->id,
            'exam_id' => $attempt->exam_id,
            'question_id' => $answer->question_id,
            'metadata' => [
                'question_id' => $answer->question_id,
            ],
        ]);

        return response()->json([
            'message' => 'Answer saved',
            'answer' => [
                'id' => $answer->id,
                'attempt_id' => $answer->attempt_id,
                'question_id' => $answer->question_id,
                'selected_answer' => $answer->selected_answer,
                'selected_option' => $answer->selected_option,
            ],
            'remaining_time' => $this->remainingSeconds($attempt),
        ]);
    }

    public function submit(Request $request, int $id): JsonResponse
    {
        return $this->submitExam($request, $id);
    }

    public function submitExam(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make(['attempt_id' => $id], [
            'attempt_id' => 'required|integer|exists:exam_attempts,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attempt = ExamAttempt::with('exam.questions', 'answers')->findOrFail($id);

        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $this->isAttemptInProgress($attempt)) {
            return response()->json([
                'message' => 'Attempt already finalized',
                'status' => $this->attemptStatus($attempt),
            ], 409);
        }

        $summary = $this->calculateResult($attempt, 'submitted');

        $this->logAudit($request, 'exam_submitted', [
            'attempt_id' => $attempt->id,
            'exam_id' => $attempt->exam_id,
            'status' => 'submitted',
            'metadata' => [
                'status' => 'submitted',
            ],
        ]);

        return response()->json([
            'message' => 'Attempt submitted successfully',
            'attempt_id' => $attempt->id,
            'status' => 'submitted',
            'result' => $summary,
        ]);
    }

    private function autoSubmitIfExpired(ExamAttempt $attempt): void
    {
        if (! $this->isAttemptInProgress($attempt)) {
            return;
        }

        if ($this->remainingSeconds($attempt) <= 0) {
            $this->calculateResult($attempt, 'timeout');
        }
    }

    private function remainingSeconds(ExamAttempt $attempt): int
    {
        $startedAt = $this->attemptStartTime($attempt);

        if (! $startedAt) {
            return 0;
        }

        $elapsed = Carbon::parse($startedAt)->diffInSeconds(now());
        $remaining = ($this->attemptDuration($attempt) * 60) - $elapsed;

        return max(0, $remaining);
    }

    private function calculateResult(ExamAttempt $attempt, string $status): array
    {
        return DB::transaction(function () use ($attempt, $status) {
            $attempt->loadMissing('exam.questions', 'answers');

            $questions = $attempt->exam->questions;
            $answers = $attempt->answers->keyBy('question_id');

            $score = 0;
            $correctCount = 0;
            $answeredCount = 0;

            foreach ($questions as $question) {
                $answer = $answers->get($question->id);
                $selectedAnswer = $answer?->selected_answer ?? $answer?->selected_option;

                if ($answer) {
                    $answeredCount++;
                }

                $isCorrect = $selectedAnswer !== null && $this->isObjectiveAnswerCorrect($question, $selectedAnswer);
                $awardedScore = $isCorrect ? (float) $question->marks : 0.0;

                if ($answer) {
                    $answer->update([
                        'is_correct' => $isCorrect,
                        'score_awarded' => $awardedScore,
                    ]);
                }

                if ($isCorrect) {
                    $correctCount++;
                    $score += $awardedScore;
                }
            }

            $finalTime = now();
            $updateData = [];

            if (Schema::hasColumn('exam_attempts', 'status')) {
                $updateData['status'] = $status;
            }

            if (Schema::hasColumn('exam_attempts', 'end_time')) {
                $updateData['end_time'] = $finalTime;
            }

            if (Schema::hasColumn('exam_attempts', 'submitted_at')) {
                $updateData['submitted_at'] = $finalTime;
            }

            if ($updateData !== []) {
                $attempt->update($updateData);
            }

            $releaseAt = $attempt->exam->end_time
                ? Carbon::parse($attempt->exam->end_time)
                : $finalTime;
            $isPublished = $releaseAt->lessThanOrEqualTo($finalTime);

            $resultPayload = [
                'score' => $score,
                'total_marks' => (int) $questions->sum('marks'),
            ];

            if (Schema::hasColumn('results', 'evaluated_at')) {
                $resultPayload['evaluated_at'] = $finalTime;
            }

            if (Schema::hasColumn('results', 'grade')) {
                $resultPayload['grade'] = $this->gradeFromScore($score, (int) $questions->sum('marks'));
            }

            if (Schema::hasColumn('results', 'is_published')) {
                $resultPayload['is_published'] = $isPublished;
            }

            if (Schema::hasColumn('results', 'published_at')) {
                $resultPayload['published_at'] = $releaseAt;
            }

            $result = Result::updateOrCreate(
                ['attempt_id' => $attempt->id],
                $resultPayload
            );

            $this->notifyExamStaffOfSubmission($attempt, $status, $finalTime);

            $this->logAudit(request(), 'result_calculated', [
                'attempt_id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'score' => $score,
                'total_marks' => (int) $questions->sum('marks'),
                'metadata' => [
                    'score' => $score,
                    'total_marks' => (int) $questions->sum('marks'),
                ],
            ]);

            return [
                'result_id' => $result->id,
                'score' => $score,
                'correct_answers' => $correctCount,
                'answered_questions' => $answeredCount,
                'total_questions' => $questions->count(),
                'total_marks' => (int) $questions->sum('marks'),
                'is_published' => $isPublished,
                'results_available_at' => $releaseAt->toISOString(),
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
            $attempt->loadMissing('exam', 'user');
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
            // Notification failures should not affect exam submission flow.
        }
    }

    private function attemptStartTime(ExamAttempt $attempt)
    {
        return $attempt->start_time ?? $attempt->started_at;
    }

    private function attemptEndTime(ExamAttempt $attempt)
    {
        return $attempt->end_time ?? $attempt->submitted_at;
    }

    private function attemptDuration(ExamAttempt $attempt, ?Exam $exam = null): int
    {
        if (Schema::hasColumn('exam_attempts', 'duration') && ! is_null($attempt->duration)) {
            return (int) $attempt->duration;
        }

        return (int) ($exam?->duration ?? 0);
    }

    private function hasAssignedExamAccess(int $examId, string $email): bool
    {
        $hasPrivateAssignments = ExamAccessUser::query()
            ->where('exam_id', $examId)
            ->exists();

        if (! $hasPrivateAssignments) {
            return true;
        }

        return ExamAccessUser::query()
            ->where('exam_id', $examId)
            ->whereRaw('LOWER(email) = ?', [$email])
            ->exists();
    }

    private function attemptStatus(ExamAttempt $attempt): string
    {
        if (Schema::hasColumn('exam_attempts', 'status') && ! empty($attempt->status)) {
            return (string) $attempt->status;
        }

        return $this->attemptEndTime($attempt) ? 'submitted' : 'in_progress';
    }

    private function isAttemptInProgress(ExamAttempt $attempt): bool
    {
        return $this->attemptStatus($attempt) === 'in_progress';
    }

    private function logAudit(Request $request, string $action, array $payload = []): void
    {
        try {
            $description = json_encode($payload, JSON_UNESCAPED_SLASHES);

            AuditLog::writeEntry(
                $request->user()?->id,
                $action,
                $description === false ? null : $description,
                $request->ip(),
                $request->userAgent()
            );
        } catch (\Throwable) {
            // Audit logging must never block exam flow.
        }
    }
}
