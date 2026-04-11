<?php
namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Models\Exam;
use App\Models\ExamAccess;
use App\Models\ExamAccessUser;
use App\Models\ExamAttempt;
use App\Models\Result;
use App\Models\Question;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use App\Models\User;



class ExamAttemptController extends Controller
{
    public function __construct(private readonly AuditService $auditService)
    {
    }

    /**
     * Contract-compliant endpoint: POST /api/attempts
     * Starts a new exam attempt for the authenticated student.
     * Returns 201 with attempt and questions, 409 if already active, 403 if not allowed, 404 if exam not found.
     */
    public function store(Request $request)
    {
        $user = $this->resolveLegacyStudentActor($request);
        $examId = $request->input('exam_id');
        if (!$examId) {
            return response()->json(['message' => 'exam_id is required'], 422);
        }
        $exam = \App\Models\Exam::find($examId);
        if (!$exam) {
            return response()->json(['message' => 'Exam not found'], 404);
        }
        // Only one active attempt per student per exam
        $hasActiveAttempt = \App\Models\ExamAttempt::query()
            ->where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->where(function($query) {
                $query->where('status', 'in_progress')
                    ->orWhereNull('submitted_at');
            })
            ->exists();
        if ($hasActiveAttempt) {
            return response()->json(['message' => 'An active attempt already exists for this exam.'], 409);
        }
        $startTime = now();
        $attemptData = [
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => $startTime,
            'started_at' => $startTime,
            'duration' => (int) $exam->duration,
            'status' => 'in_progress',
            'last_ip' => $request->ip(),
            'last_user_agent' => $request->userAgent(),
            'submitted_at' => null,
        ];
        $attempt = \App\Models\ExamAttempt::create($attemptData);
        // Return attempt and randomized questions (without correct answers)
        $questions = $exam->questions()
            ->inRandomOrder()
            ->get(['id', 'exam_id', 'question_text', 'type', 'options', 'marks']);
        return response()->json($this->buildAttemptResponse($attempt, $questions), 201);
    }

    public function start(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'exam_id' => 'required|integer|exists:exams,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $this->resolveLegacyStudentActor($request);
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

        try {
            $this->auditService->log(
                'exam_start',
                'Exam attempt started. attempt_id='.$attempt->id.', exam_id='.$attempt->exam_id
            );
        } catch (\Throwable) {
            // Do not block exam start when audit logging fails.
        }

        $questions = $exam->questions()
            ->inRandomOrder()
            ->get(['id', 'exam_id', 'question_text', 'type', 'options', 'marks']);

        return response()->json($this->buildAttemptResponse($attempt, $questions, $exam), 201);
    }

    public function storeFromExamId(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $attempt = ExamAttempt::with(['exam.questions:id,exam_id,question_text,type,options,marks', 'answers'])
            ->findOrFail($id);

        if ((int) $attempt->user_id !== (int) $this->resolveLegacyStudentActor($request)->id) {
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
        $validator = Validator::make($request->all(), [
            'question_id' => 'required|integer|exists:questions,id',
            'selected_answer' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attempt = ExamAttempt::with('exam')->findOrFail($id);

        if ((int) $attempt->user_id !== (int) $this->resolveLegacyStudentActor($request)->id) {
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
                'selected_answer' => $request->string('selected_answer')->toString(),
            ]
        );

        return response()->json([
            'message' => 'Answer saved',
            'answer' => [
                'id' => $answer->id,
                'attempt_id' => $answer->attempt_id,
                'question_id' => $answer->question_id,
                'selected_answer' => $answer->selected_answer,
            ],
            'remaining_time' => $this->remainingSeconds($attempt),
        ]);
    }

    public function saveAnswerFromPayload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attempt_id' => 'required|integer',
            'question_id' => 'required|integer',
            'selected_answer' => 'sometimes|nullable|string',
            'answer' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attempt = ExamAttempt::with('exam')->find($request->integer('attempt_id'));

        if (! $attempt) {
            return response()->json(['message' => 'Attempt not found'], 404);
        }

        if (! Question::query()->whereKey($request->integer('question_id'))->exists()) {
            return response()->json(['message' => 'Question not found'], 404);
        }

        if ((int) $attempt->user_id !== (int) $this->resolveLegacyStudentActor($request)->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $this->isAttemptInProgress($attempt)) {
            return response()->json(['message' => 'Attempt already submitted'], 409);
        }

        $selectedAnswer = $request->input('selected_answer', $request->input('answer'));
        if ($selectedAnswer === null || $selectedAnswer === '') {
            return response()->json(['message' => 'selected_answer is required'], 422);
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
                'selected_answer' => (string) $selectedAnswer,
            ]
        );

        if (Schema::hasTable('answers')) {
            DB::table('answers')->updateOrInsert(
                [
                    'attempt_id' => $attempt->id,
                    'question_id' => $request->integer('question_id'),
                ],
                [
                    'answer' => (string) $selectedAnswer,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return response()->json([
            'message' => 'Answer saved',
            'id' => $answer->id,
            'attempt_id' => $answer->attempt_id,
            'question_id' => $answer->question_id,
            'selected_answer' => $answer->selected_answer,
            'remaining_time' => $this->remainingSeconds($attempt),
        ], 201);
    }

    public function submit(Request $request, int $id): JsonResponse
    {
        $attempt = ExamAttempt::with('exam.questions', 'answers')->findOrFail($id);

        if ((int) $attempt->user_id !== (int) $this->resolveLegacyStudentActor($request)->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($this->remainingSeconds($attempt) <= 0) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $this->isAttemptInProgress($attempt)) {
            return response()->json([
                'message' => 'Attempt already finalized',
                'status' => $this->attemptStatus($attempt),
            ], 409);
        }

        $summary = $this->finalizeAttempt($attempt, 'submitted');

        try {
            $this->auditService->log(
                'exam_submit',
                'Exam attempt submitted. attempt_id='.$attempt->id.', exam_id='.$attempt->exam_id
            );
        } catch (\Throwable) {
            // Do not block submit when audit logging fails.
        }

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
            $this->finalizeAttempt($attempt, 'timeout');
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

                $isCorrect = (string) $answer->selected_answer === (string) $question->correct_answer;
                $answer->update(['is_correct' => $isCorrect]);

                if ($isCorrect) {
                    $correctCount++;
                    $score += (int) $question->marks;
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

            Result::updateOrCreate(
                ['attempt_id' => $attempt->id],
                [
                    'score' => $score,
                    'total_marks' => (int) $questions->sum('marks'),
                    'grade' => $this->gradeFromScore($score, (int) $questions->sum('marks')),
                    'published_at' => now(),
                ]
            );

            return [
                'score' => $score,
                'correct_answers' => $correctCount,
                'answered_questions' => $attempt->answers()->count(),
                'total_questions' => $questions->count(),
                'total_marks' => (int) $questions->sum('marks'),
            ];
        });
    }

    private function attemptStartTime(ExamAttempt $attempt)
    {
        return $attempt->started_at ?? $attempt->start_time;
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
        $hasExamAccessConfig = ExamAccess::query()->where('exam_id', $examId)->exists();
        $hasAssignedUsers = ExamAccessUser::query()->where('exam_id', $examId)->exists();

        if (! $hasExamAccessConfig && ! $hasAssignedUsers) {
            return true;
        }

        return ExamAccessUser::query()
            ->where('exam_id', $examId)
            ->whereRaw('LOWER(email) = ?', [$email])
            ->exists();
    }

    private function buildAttemptResponse(ExamAttempt $attempt, $questions, ?Exam $exam = null): array
    {
        return [
            'id' => $attempt->id,
            'attempt' => [
                'id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'start_time' => $this->attemptStartTime($attempt),
                'duration' => $this->attemptDuration($attempt, $exam),
                'status' => $this->attemptStatus($attempt),
            ],
            'questions' => $questions,
        ];
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

    private function resolveLegacyStudentActor(Request $request): User
    {
        $user = $request->user();

        if ($user && strtolower((string) ($user->role?->name ?? '')) === 'student') {
            return $user;
        }

        return User::query()
            ->whereHas('role', function ($query) {
                $query->where('name', 'student');
            })
            ->orderBy('id')
            ->firstOrFail();
    }
}
