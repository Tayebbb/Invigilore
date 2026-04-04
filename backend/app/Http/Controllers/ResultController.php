<?php

namespace App\Http\Controllers;

use App\Models\Result;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ResultController extends Controller
{
    /**
     * GET /results — list all results (admin/teacher/student)
     */
    public function index()
    {
        $results = Result::with('attempt', 'attempt.user', 'attempt.exam')->latest()->get();
        return response()->json([
            'success' => true,
            'message' => 'Results fetched successfully',
            'data' => $results,
        ]);
    }

    /**
     * POST /results — create result (admin/teacher)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'attempt_id'  => 'required|integer|exists:exam_attempts,id',
            'score'       => 'required|integer',
            'total_marks' => 'required|integer',
            'grade'       => 'sometimes|string|max:10',
            'feedback'    => 'sometimes|string',
            'is_published' => 'sometimes|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $payload = $validator->validated();

        if (! empty($payload['is_published']) && ! array_key_exists('published_at', $payload)) {
            $payload['published_at'] = now();
        }

        $result = Result::create($payload);

        return response()->json([
            'success' => true,
            'message' => 'Result created successfully',
            'data' => $result,
        ], 201);
    }

    /**
     * GET /results/{result} — show result details
     */
    public function show(Result $result)
    {
        return response()->json([
            'success' => true,
            'message' => 'Result fetched successfully',
            'data' => $result->load('attempt', 'attempt.user', 'attempt.exam'),
        ]);
    }

    /**
     * PUT /results/{result} — update result
     */
    public function update(Request $request, Result $result)
    {
        $validator = Validator::make($request->all(), [
            'score'       => 'sometimes|integer',
            'total_marks' => 'sometimes|integer',
            'grade'       => 'sometimes|string|max:10',
            'feedback'    => 'sometimes|string',
            'is_published' => 'sometimes|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $payload = $validator->validated();

        if (array_key_exists('is_published', $payload)) {
            $payload['published_at'] = $payload['is_published'] ? now() : null;
        }

        $result->update($payload);

        return response()->json([
            'success' => true,
            'message' => 'Result updated successfully',
            'data' => $result,
        ]);
    }

    /**
     * DELETE /results/{result} — delete result
     */
    public function destroy(Result $result)
    {
        $result->delete();
        return response()->json(['success' => true, 'message' => 'Result deleted']);
    }
}
