<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Exam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuestionController extends Controller
{
    /**
     * GET /questions — list all questions (admin/teacher)
     */
    public function index()
    {
        $questions = Question::with('exam')->latest()->get();
        return response()->json($questions);
    }

    /**
     * POST /questions — create question (admin/teacher)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'exam_id'        => 'required|integer|exists:exams,id',
            'question_text'  => 'required|string',
            'type'           => 'required|string',
            'options'        => 'nullable|string',
            'correct_answer' => 'required|string',
            'marks'          => 'required|integer|min:1',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $question = Question::create($validator->validated());
        return response()->json($question, 201);
    }

    /**
     * GET /questions/{question} — show question details
     */
    public function show(Question $question)
    {
        return response()->json($question->load('exam'));
    }

    /**
     * PUT /questions/{question} — update question
     */
    public function update(Request $request, Question $question)
    {
        $validator = Validator::make($request->all(), [
            'exam_id'        => 'sometimes|integer|exists:exams,id',
            'question_text'  => 'sometimes|string',
            'type'           => 'sometimes|string',
            'options'        => 'nullable|string',
            'correct_answer' => 'sometimes|string',
            'marks'          => 'sometimes|integer|min:1',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $question->update($validator->validated());
        return response()->json($question);
    }

    /**
     * DELETE /questions/{question} — delete question
     */
    public function destroy(Question $question)
    {
        $question->delete();
        return response()->json(['message' => 'Question deleted']);
    }
}
