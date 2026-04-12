<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Question;
use App\Services\AiService;
use App\Http\Resources\QuestionAdminResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
            $difficulty = $request->difficulty ?? 'medium';

            foreach ($generated as $qData) {
                if (! is_array($qData) || empty(trim((string) ($qData['question_text'] ?? '')))) {
                    continue;
                }

                $rawType = strtolower((string) ($qData['type'] ?? 'mcq'));
                $type = in_array($rawType, ['mcq', 'descriptive'], true) ? $rawType : 'mcq';

                $options = null;
                if ($type === 'mcq') {
                    $inputOptions = is_array($qData['options'] ?? null) ? $qData['options'] : [];
                    $options = [
                        'A' => $inputOptions['A'] ?? ($inputOptions[0] ?? 'Option A'),
                        'B' => $inputOptions['B'] ?? ($inputOptions[1] ?? 'Option B'),
                        'C' => $inputOptions['C'] ?? ($inputOptions[2] ?? 'Option C'),
                        'D' => $inputOptions['D'] ?? ($inputOptions[3] ?? 'Option D'),
                    ];
                }

                $question = Question::create([
                    'exam_id' => $exam->id,
                    'created_by' => Auth::id(),
                    'question_text' => trim((string) $qData['question_text']),
                    'type' => $type,
                    'options' => $options,
                    'correct_answer' => $type === 'mcq' ? (string) ($qData['correct_answer'] ?? 'A') : null,
                    'marks' => max(1, (int) ($qData['marks'] ?? 1)),
                    'difficulty' => $difficulty,
                    'status' => 'draft',
                ]);

                $savedQuestions[] = $question;
            }

            return response()->json([
                'message' => count($savedQuestions) . ' questions generated and added successfully.',
                'questions' => QuestionAdminResource::collection($savedQuestions)
            ]);

        } catch (\Throwable $e) {
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
