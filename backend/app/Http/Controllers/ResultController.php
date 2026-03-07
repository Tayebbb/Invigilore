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
        return response()->json($results);
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
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $result = Result::create($validator->validated());
        return response()->json($result, 201);
    }

    /**
     * GET /results/{result} — show result details
     */
    public function show(Result $result)
    {
        return response()->json($result->load('attempt', 'attempt.user', 'attempt.exam'));
    }

    /**
     * PUT /results/{result} — update result
     */
    public function update(Request $request, Result $result)
    {
        $validator = Validator::make($request->all(), [
            'score'       => 'sometimes|integer',
            'total_marks' => 'sometimes|integer',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $result->update($validator->validated());
        return response()->json($result);
    }

    /**
     * DELETE /results/{result} — delete result
     */
    public function destroy(Result $result)
    {
        $result->delete();
        return response()->json(['message' => 'Result deleted']);
    }
}
