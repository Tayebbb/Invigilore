<?php

namespace App\Http\Controllers;

use App\Models\ExamAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $attempts = ExamAttempt::query()
            ->with(['result'])
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
                    'score' => $attempt->result?->score,
                    'total_marks' => $attempt->result?->total_marks,
                ];
            });

        return response()->json([
            'data' => $attempts,
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $attempt = ExamAttempt::with(['result'])->find($id);

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
                'result_id' => $attempt->result?->id,
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $attempts = ExamAttempt::query()
            ->with(['result'])
            ->where('user_id', $request->user()->id)
            ->get();

        $percentages = [];
        $completedAttempts = 0;

        foreach ($attempts as $attempt) {
            if ($this->isCompleted($attempt)) {
                $completedAttempts++;
            }

            $score = $this->calculateAttemptScore($attempt);
            $percentages[] = $score['percentage'];
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
        if ($attempt->result) {
            $questions = DB::table('questions')
                ->where('exam_id', $attempt->exam_id)
                ->get(['id', 'marks']);

            $totalMarks = (int) $attempt->result->total_marks;
            $obtainedMarks = (int) $attempt->result->score;
            $percentage = $totalMarks > 0
                ? round(($obtainedMarks / $totalMarks) * 100, 2)
                : 0.0;

            return [
                'total_questions' => $questions->count(),
                'total_marks' => $totalMarks,
                'obtained_marks' => $obtainedMarks,
                'percentage' => $percentage,
            ];
        }

        $questions = DB::table('questions')
            ->where('exam_id', $attempt->exam_id)
            ->get(['id', 'correct_answer', 'marks']);

        if ($attempt->result) {
            $totalMarks = (int) $attempt->result->total_marks;
            $obtainedMarks = (int) $attempt->result->score;
            $totalQuestions = $attempt->exam?->questions?->count() ?? 0;
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

        $questions = $attempt->exam?->questions ?? collect();
        $totalQuestions = $questions->count();
        $totalMarks = (int) $questions->sum('marks');
        $answers = $attempt->answers->keyBy('question_id');
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

        $percentage = $totalMarks > 0 ? round(($obtainedMarks / $totalMarks) * 100, 2) : 0.0;

        return [
            'total_questions' => $totalQuestions,
            'total_marks' => $totalMarks,
            'obtained_marks' => $obtainedMarks,
            'percentage' => $percentage,
        ];
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
