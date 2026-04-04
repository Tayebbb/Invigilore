<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentExamController extends Controller
{
    public function __construct(private readonly ExamAttemptController $examAttemptController)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $exams = Exam::query()
            ->with('subject')
            ->withCount('questions')
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $exams,
        ]);
    }

    public function start(Request $request, Exam $exam): JsonResponse
    {
        $request->merge(['exam_id' => $exam->id]);

        return $this->examAttemptController->start($request);
    }

    public function showAttempt(Request $request, int $attempt): JsonResponse
    {
        return $this->examAttemptController->show($request, $attempt);
    }

    public function saveAnswer(Request $request, int $attempt): JsonResponse
    {
        return $this->examAttemptController->saveAnswer($request, $attempt);
    }

    public function submit(Request $request, int $attempt): JsonResponse
    {
        return $this->examAttemptController->submit($request, $attempt);
    }

    public function telemetry(Request $request, int $attempt): JsonResponse
    {
        $attemptModel = ExamAttempt::query()->find($attempt);

        if (! $attemptModel) {
            return response()->json(['message' => 'Attempt not found'], 404);
        }

        if ((int) $attemptModel->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'message' => 'Telemetry received',
            'attempt_id' => $attemptModel->id,
            'recorded_at' => now()->toISOString(),
        ]);
    }

    public function results(Request $request): JsonResponse
    {
        $attempts = ExamAttempt::query()
            ->with('exam')
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->get();

        $data = $attempts->map(function (ExamAttempt $attempt) {
            $metrics = $this->calculateMetrics($attempt);

            return [
                'attempt_id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'exam_title' => $attempt->exam?->title,
                'status' => $attempt->status ?? (($attempt->submitted_at || $attempt->end_time) ? 'submitted' : 'in_progress'),
                'score' => $metrics['obtained_marks'],
                'total_marks' => $metrics['total_marks'],
                'percentage' => $metrics['percentage'],
                'submitted_at' => $attempt->submitted_at ?? $attempt->end_time,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function submissions(Request $request): JsonResponse
    {
        $table = Schema::hasTable('attempt_answers') ? 'attempt_answers' : 'answers';

        $attempts = ExamAttempt::query()
            ->with('exam')
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->get();

        $data = $attempts->map(function (ExamAttempt $attempt) use ($table) {
            $answeredCount = DB::table($table)
                ->where('attempt_id', $attempt->id)
                ->count();

            return [
                'attempt_id' => $attempt->id,
                'exam_id' => $attempt->exam_id,
                'exam_title' => $attempt->exam?->title,
                'status' => $attempt->status ?? (($attempt->submitted_at || $attempt->end_time) ? 'submitted' : 'in_progress'),
                'started_at' => $attempt->start_time ?? $attempt->started_at,
                'submitted_at' => $attempt->submitted_at ?? $attempt->end_time,
                'answers_saved' => $answeredCount,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    private function calculateMetrics(ExamAttempt $attempt): array
    {
        $questions = DB::table('questions')
            ->where('exam_id', $attempt->exam_id)
            ->get(['id', 'correct_answer', 'marks']);

        $totalMarks = (int) $questions->sum('marks');

        $table = Schema::hasTable('attempt_answers') ? 'attempt_answers' : 'answers';
        $answers = DB::table($table)
            ->where('attempt_id', $attempt->id)
            ->get(['question_id', 'selected_answer'])
            ->keyBy('question_id');

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
            'obtained_marks' => $obtainedMarks,
            'total_marks' => $totalMarks,
            'percentage' => $percentage,
        ];
    }
}
