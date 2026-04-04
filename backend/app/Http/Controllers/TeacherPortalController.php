<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Result;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherPortalController extends Controller
{
    public function tests(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));

        $query = Exam::query()
            ->with(['subject:id,name'])
            ->leftJoin('exam_attempts', 'exam_attempts.exam_id', '=', 'exams.id')
            ->leftJoin('results', 'results.attempt_id', '=', 'exam_attempts.id')
            ->selectRaw('
                exams.id,
                exams.title,
                exams.created_at,
                exams.start_time,
                exams.end_time,
                COUNT(results.id) as result_count,
                AVG(results.score) as average_score
            ')
            ->groupBy('exams.id', 'exams.title', 'exams.created_at', 'exams.start_time', 'exams.end_time')
            ->orderByDesc('exams.id');

        if ($search !== '') {
            $query->where('exams.title', 'like', '%' . $search . '%');
        }

        $exams = $query->get();
        $now = now();

        $rows = $exams->map(function ($exam) use ($now) {
            $computedStatus = $this->computeTestStatus($exam, $now);

            return [
                'id' => $exam->id,
                'title' => $exam->title,
                'description' => '(no description)',
                'createdAt' => optional($exam->created_at)->toDateString(),
                'category' => 'Uncategorized',
                'status' => $computedStatus,
                'averageScore' => $exam->average_score ? round((float) $exam->average_score, 1) : null,
                'resultCount' => (int) ($exam->result_count ?? 0),
            ];
        });

        if ($status !== 'all') {
            $rows = $rows->filter(fn($item) => $item['status'] === $status)->values();
        }

        return response()->json([
            'success' => true,
            'message' => 'Teacher tests fetched successfully',
            'data' => $rows,
        ])->header('Cache-Control', 'private, max-age=60');// Cache for 60 seconds on client
    }

    public function testInfo(Request $request, Exam $exam): JsonResponse
    {
        $now = now();

        $activeRespondents = ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->where('status', 'in_progress')
            ->count();

        $resultStats = Result::query()
            ->selectRaw('COUNT(results.id) as result_count, AVG(results.score) as average_score')
            ->join('exam_attempts', 'exam_attempts.id', '=', 'results.attempt_id')
            ->where('exam_attempts.exam_id', $exam->id)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Teacher test info fetched successfully',
            'data' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'status' => $this->computeTestStatus($exam, $now),
                'createdAt' => optional($exam->created_at)->toDateString(),
                'activeRespondents' => $activeRespondents,
                'averageScore' => $resultStats ? round((float) ($resultStats->average_score ?? 0), 1) : 0,
                'resultCount' => $resultStats ? (int) ($resultStats->result_count ?? 0) : 0,
                'summary' => [
                    'You can assign this test to a category.',
                    'Question set is ready for respondents.',
                    'Random order of questions and answers can be enabled.',
                    'Test pass mark defaults to 50%.',
                ],
            ],
        ])->header('Cache-Control', 'private, max-age=30');
    }

    public function activate(Request $request, Exam $exam): JsonResponse
    {
        $now = now();

        if ($this->computeTestStatus($exam, $now) === 'active') {
            return response()->json([
                'success' => true,
                'message' => 'Test is already active',
                'data' => [
                    'id' => $exam->id,
                    'status' => 'active',
                ],
            ]);
        }

        $exam->start_time = $now;
        $exam->end_time = $now->copy()->addMinutes((int) $exam->duration);
        $exam->save();

        return response()->json([
            'success' => true,
            'message' => 'Test activated successfully',
            'data' => [
                'id' => $exam->id,
                'status' => 'active',
            ],
        ]);
    }

    public function end(Request $request, Exam $exam): JsonResponse
    {
        $exam->end_time = now();
        $exam->save();

        return response()->json([
            'success' => true,
            'message' => 'Test ended successfully',
            'data' => [
                'id' => $exam->id,
                'status' => 'setup_in_progress',
            ],
        ]);
    }

    public function resultsDatabase(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = max(1, min(100, (int) $request->query('perPage', 20)));

        $query = Result::query()
            ->with(['attempt.user:id,name', 'attempt.exam:id,title'])
            ->whereHas('attempt')
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->whereHas('attempt.user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', '%' . $search . '%');
                })->orWhereHas('attempt.exam', function ($examQuery) use ($search) {
                    $examQuery->where('title', 'like', '%' . $search . '%');
                });
            });
        }

        $results = $query->paginate($perPage);

        $rows = collect($results->items())->map(function (Result $result, int $index) {
            $fullName = trim((string) ($result->attempt?->user?->name ?? ''));
            [$firstName, $lastName] = $this->splitName($fullName);

            $score = (int) $result->score;
            $total = max(1, (int) $result->total_marks);
            $percent = round(($score / $total) * 100, 1);

            return [
                'id' => $result->id,
                'testName' => $result->attempt?->exam?->title ?? 'Unknown test',
                'lastName' => $lastName,
                'firstName' => $firstName,
                'scorePercent' => $percent,
                'scoreLabel' => $score . '/' . $total,
                'endDate' => optional($result->attempt?->submitted_at ?? $result->attempt?->end_time ?? $result->created_at)?->format('Y-m-d H:i'),
                'timeTaken' => $this->formatDuration((int) ($result->attempt?->duration ?? 0)),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Results database fetched successfully',
            'data' => $rows,
            'meta' => [
                'total' => $results->total(),
                'perPage' => $results->perPage(),
                'currentPage' => $results->currentPage(),
                'lastPage' => $results->lastPage(),
            ],
        ])->header('Cache-Control', 'private, max-age=60');
    }

    public function respondents(Request $request): JsonResponse
    {
        $rows = ExamAttempt::query()
            ->with(['user:id,name,email', 'exam:id,title'])
            ->where('status', 'in_progress')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(function (ExamAttempt $attempt) {
                return [
                    'attemptId' => $attempt->id,
                    'testName' => $attempt->exam?->title ?? 'Unknown test',
                    'name' => $attempt->user?->name ?? 'Unknown user',
                    'email' => $attempt->user?->email ?? '',
                    'startedAt' => optional($attempt->started_at ?? $attempt->start_time)?->toISOString(),
                    'status' => $attempt->status,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Respondents fetched successfully',
            'data' => $rows,
        ])->header('Cache-Control', 'private, max-age=30');
    }

    private function computeTestStatus(Exam $exam, Carbon $now): string
    {
        $start = $exam->start_time;
        $end = $exam->end_time;

        if ($start && $end && $now->between($start, $end)) {
            return 'active';
        }

        return 'setup_in_progress';
    }

    private function splitName(string $name): array
    {
        if ($name === '') {
            return ['Unknown', ''];
        }

        $parts = preg_split('/\s+/', $name) ?: [];
        $first = array_shift($parts) ?? 'Unknown';
        $last = implode(' ', $parts);

        return [$first, $last];
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds <= 0) {
            return '00:00';
        }

        $minutes = intdiv($seconds, 60);
        $secs = $seconds % 60;

        return str_pad((string) $minutes, 2, '0', STR_PAD_LEFT) . ':' . str_pad((string) $secs, 2, '0', STR_PAD_LEFT);
    }
}
