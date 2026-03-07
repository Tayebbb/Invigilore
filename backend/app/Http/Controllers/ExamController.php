<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{
    /**
     * GET /exams — list all exams (admin/teacher)
     */
    public function index()
    {
        $exams = Exam::with('subject', 'questions', 'teacher')->latest()->get();
        return response()->json($exams);
    }

    /**
     * POST /exams — create exam (admin/teacher)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'subject_id'  => 'required|integer|exists:subjects,id',
            'teacher_id'  => 'required|integer|exists:users,id',
            'duration'    => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'start_time'  => 'required|date',
            'end_time'    => 'required|date|after:start_time',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $exam = Exam::create($validator->validated());
        return response()->json($exam, 201);
    }

    /**
     * GET /exams/{exam} — show exam details
     */
    public function show(Exam $exam)
    {
        return response()->json($exam->load('subject', 'questions', 'teacher'));
    }

    /**
     * PUT /exams/{exam} — update exam
     */
    public function update(Request $request, Exam $exam)
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|max:255',
            'subject_id'  => 'sometimes|integer|exists:subjects,id',
            'teacher_id'  => 'sometimes|integer|exists:users,id',
            'duration'    => 'sometimes|integer|min:1',
            'total_marks' => 'sometimes|integer|min:1',
            'start_time'  => 'sometimes|date',
            'end_time'    => 'sometimes|date|after:start_time',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $exam->update($validator->validated());
        return response()->json($exam);
    }

    /**
     * DELETE /exams/{exam} — delete exam
     */
    public function destroy(Exam $exam)
    {
        $exam->delete();
        return response()->json(['message' => 'Exam deleted']);
    }
}
