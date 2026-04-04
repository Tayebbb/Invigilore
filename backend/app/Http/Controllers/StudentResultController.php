<?php

namespace App\Http\Controllers;

use App\Models\ExamAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $attempts = ExamAttempt::query()
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->get()
            ->map(function (ExamAttempt $attempt) {
                return [
                    'attempt_id' => $attempt->id,
                    'exam_id' => $attempt->exam_id,
                    'start_time' => $attempt->start_time ?? $attempt->started_at,
                    'end_time' => $attempt->end_time ?? $attempt->submitted_at,
                    'status' => $attempt->status ?? (($attempt->submitted_at || $attempt->end_time) ? 'submitted' : 'in_progress'),
                ];
            });

        return response()->json([
            'data' => $attempts,
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $attempt = ExamAttempt::find($id);

        if (! $attempt) {
            return response()->json([
                'message' => 'Attempt not found',
            ], 404);
        }

        if ((int) $attempt->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Forbidden',
            ], 403);
        }

        $score = $this->calculateAttemptScore($attempt);

        return response()->json([
            'data' => [
                'attempt_id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'total_questions' => $score['total_questions'],
                'total_marks' => $score['total_marks'],
                'obtained_marks' => $score['obtained_marks'],
                'percentage' => $score['percentage'],
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $attempts = ExamAttempt::query()
            ->where('user_id', $request->user()->id)
            ->get();

        if ($attempts->isEmpty()) {
            return response()->json([
                'data' => [
                    'total_attempts' => 0,
                    'completed_attempts' => 0,
                    'average_score' => 0.0,
                    'highest_score' => 0.0,
                    'lowest_score' => 0.0,
                ],
            ]);
        }

        $examQuestionsByExamId = DB::table('questions')
            ->whereIn('exam_id', $attempts->pluck('exam_id')->unique()->values()->all())
            ->get(['id', 'exam_id', 'correct_answer', 'marks'])
            ->groupBy('exam_id');

        $answersByAttemptId = $this->getAttemptAnswersForAttemptIds($attempts->pluck('id'))
            ->groupBy('attempt_id')
            ->map(function (Collection $rows) {
                return $rows->keyBy('question_id');
            });

        $percentages = [];
        $completedAttempts = 0;

        foreach ($attempts as $attempt) {
            if ($this->isCompleted($attempt)) {
                $completedAttempts++;
            }

            $questions = $examQuestionsByExamId->get($attempt->exam_id, collect());
            $answers = $answersByAttemptId->get($attempt->id, collect());

            $totalMarks = (int) $questions->sum('marks');
            $obtainedMarks = 0;

            foreach ($questions as $question) {
                $answer = $answers->get($question->id);

                if (! $answer) {
                    continue;
                }

                if ((string) $answer->selected_answer === (string) $question->correct_answer) {
                    $obtainedMarks += (int) $question->marks;
                }
            }

            $percentages[] = $totalMarks > 0
                ? round(($obtainedMarks / $totalMarks) * 100, 2)
                : 0.0;
        }

        return response()->json([
            'data' => [
                'total_attempts' => $attempts->count(),
                'completed_attempts' => $completedAttempts,
                'average_score' => $this->safeAverage($percentages),
                'highest_score' => empty($percentages) ? 0.0 : max($percentages),
                'lowest_score' => empty($percentages) ? 0.0 : min($percentages),
            ],
        ]);
    }

    private function calculateAttemptScore(ExamAttempt $attempt): array
    {
        $questions = DB::table('questions')
            ->where('exam_id', $attempt->exam_id)
            ->get(['id', 'correct_answer', 'marks']);

        $totalQuestions = $questions->count();
        $totalMarks = (int) $questions->sum('marks');

        $answers = $this->getAttemptAnswers($attempt->id)->keyBy('question_id');

        $obtainedMarks = 0;

        foreach ($questions as $question) {
            $answer = $answers->get($question->id);

            if (! $answer) {
                continue;
            }

            if ((string) $answer->selected_answer === (string) $question->correct_answer) {
                $obtainedMarks += (int) $question->marks;
            }
        }

        $percentage = $totalMarks > 0
            ? round(($obtainedMarks / $totalMarks) * 100, 2)
            : 0.0;

        return [
            'total_questions' => $totalQuestions,
            'total_marks' => $totalMarks,
            'obtained_marks' => $obtainedMarks,
            'percentage' => $percentage,
        ];
    }

    private function getAttemptAnswers(int $attemptId): Collection
    {
        $table = $this->resolveAnswersTable();

        return DB::table($table)
            ->where('attempt_id', $attemptId)
            ->get($this->answerColumns($table));
    }

    private function getAttemptAnswersForAttemptIds(Collection $attemptIds): Collection
    {
        if ($attemptIds->isEmpty()) {
            return collect();
        }

        $table = $this->resolveAnswersTable();

        return DB::table($table)
            ->whereIn('attempt_id', $attemptIds->values()->all())
            ->get($this->answerColumns($table, true));
    }

    private function resolveAnswersTable(): string
    {
        // Support both existing table names without changing DB structure.
        return Schema::hasTable('attempt_answers') ? 'attempt_answers' : 'answers';
    }

    private function answerColumns(string $table, bool $includeAttemptId = false): array
    {
        $columns = [];

        if ($includeAttemptId) {
            $columns[] = 'attempt_id';
        }

        $columns[] = 'question_id';
        $columns[] = $table === 'attempt_answers'
            ? 'selected_answer'
            : DB::raw('answer as selected_answer');

        return $columns;
    }

    private function isCompleted(ExamAttempt $attempt): bool
    {
        if (isset($attempt->status) && in_array($attempt->status, ['submitted', 'timeout'], true)) {
            return true;
        }

        return ! is_null($attempt->end_time) || ! is_null($attempt->submitted_at);
    }

    private function safeAverage(array $values): float
    {
        if ($values === []) {
            return 0.0;
        }

        return round(array_sum($values) / count($values), 2);
    }
}
