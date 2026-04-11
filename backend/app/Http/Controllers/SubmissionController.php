<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubmissionRequest;
use App\Http\Resources\SubmissionResource;
use App\Models\Exam;
use App\Models\Submission;
use App\Models\User;
use App\Services\SubmissionEvaluationService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(private readonly SubmissionEvaluationService $evaluationService)
    {
    }

    public function store(StoreSubmissionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $exam = Exam::query()->with('questions')->findOrFail((int) $validated['exam_id']);

        $submission = $this->evaluationService->submit(
            $request->user(),
            $exam,
            $validated['answers'],
            $validated['scoring_rules'] ?? [],
            $validated['idempotency_key'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => $submission->wasRecentlyCreated ? 'Submission evaluated successfully' : 'Submission already evaluated',
            'data' => new SubmissionResource($submission),
        ], $submission->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Request $request, Submission $submission): JsonResponse
    {
        $this->authorizeSubmissionAccess($request, $submission);

        return response()->json([
            'success' => true,
            'message' => 'Submission fetched successfully',
            'data' => new SubmissionResource($submission),
        ]);
    }

    public function userResults(Request $request, User $user): JsonResponse
    {
        if ((int) $request->user()->id !== (int) $user->id && ! $request->user()->hasPermission('results.view.all')) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403);
        }

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        $submissions = Submission::query()
            ->where('user_id', $user->id)
            ->with('exam')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'User results fetched successfully',
            'data' => SubmissionResource::collection($submissions->getCollection()),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
                'last_page' => $submissions->lastPage(),
            ],
        ]);
    }

    public function examResults(Request $request, Exam $exam): JsonResponse
    {
        if (! $request->user()->hasPermission('results.view.all')) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403);
        }

        $summary = $this->evaluationService->evaluateExamResults($exam);

        return response()->json([
            'success' => true,
            'message' => 'Exam results fetched successfully',
            'data' => [
                'summary' => $summary['summary'],
                'results' => SubmissionResource::collection($summary['submissions']),
            ],
        ]);
    }

    private function authorizeSubmissionAccess(Request $request, Submission $submission): void
    {
        if ((int) $submission->user_id === (int) $request->user()->id) {
            return;
        }

        if ($request->user()->hasPermission('results.view.all')) {
            return;
        }

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Forbidden',
        ], 403));
    }
}