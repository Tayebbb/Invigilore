<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Question;
use App\Services\AiService;
use App\Http\Resources\QuestionAdminResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiQuestionController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Generate questions for an exam using AI
     */
    public function generate(Request $request, Exam $exam)
    {
        $request->validate([
            'prompt' => 'required|string|max:500',
            'count' => 'sometimes|integer|min:1|max:10',
            'difficulty' => 'sometimes|string|in:easy,medium,hard',
        ]);

        try {
            $generated = $this->aiService->generateQuestions(
                $request->prompt,
                $request->count ?? 5,
                $request->difficulty ?? 'medium'
            );

            $savedQuestions = [];

            foreach ($generated as $qData) {
                $question = Question::create([
                    'exam_id' => $exam->id,
                    'created_by' => Auth::id(),
                    'question_text' => $qData['question_text'],
                    'type' => $qData['type'] ?? 'mcq',
                    'options' => $qData['options'] ?? null,
                    'correct_answer' => $qData['correct_answer'] ?? null,
                    'marks' => $qData['marks'] ?? 1,
                    'difficulty' => $request->difficulty ?? 'medium',
                    'status' => 'draft',
                ]);

                $savedQuestions[] = $question;
            }

            return response()->json([
                'message' => count($savedQuestions) . ' questions generated and added successfully.',
                'questions' => QuestionAdminResource::collection($savedQuestions)
            ]);

        } catch (\Exception $e) {
            Log::error('Question generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'exam_id' => $exam->id
            ]);
            
            return response()->json([
                'error' => 'Question generation failed: ' . $e->getMessage(),
                'details' => config('app.debug') ? $e->getMessage() : 'The AI service encountered an issue. Please try again with a simpler prompt or shorter count.'
            ], 500);
        }
    }
}
