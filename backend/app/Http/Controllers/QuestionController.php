<?php

namespace App\Http\Controllers;

use App\Http\Requests\Question\GenerateQuestionsRequest;
use App\Http\Requests\Question\StoreQuestionRequest;
use App\Http\Requests\Question\UpdateQuestionRequest;
use App\Http\Resources\QuestionAdminResource;
use App\Http\Resources\QuestionResource;
use App\Models\Exam;
use App\Models\Question;
use App\Services\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuestionController extends Controller
{
    public function __construct(private readonly QuestionService $questionService)
    {
    }

    public function index(Request $request)
    {
        $questions = $this->questionService->paginate(
            $request->only(['exam_id']),
            max(1, min(100, (int) $request->integer('per_page', 15)))
        );

        return QuestionAdminResource::collection($questions);
    }

    public function show(Question $question)
    {
        return new QuestionAdminResource($question->load('exam'));
    }

    public function store(StoreQuestionRequest $request)
    {
        $validated = $request->validated();

        $question = $this->questionService->create([
            'exam_id' => $validated['exam_id'] ?? null,
            'created_by' => $request->user()?->id,
            'question_text' => $validated['question_text'],
            'type' => $validated['type'] ?? 'mcq',
            'options' => [
                'A' => $validated['option_a'],
                'B' => $validated['option_b'],
                'C' => $validated['option_c'],
                'D' => $validated['option_d'],
            ],
            'correct_answer' => $validated['correct_answer'],
            'marks' => $validated['marks'] ?? 1,
            'difficulty' => $validated['difficulty'],
        ]);

        return (new QuestionAdminResource($question))->response()->setStatusCode(201);
    }

    public function update(UpdateQuestionRequest $request, Question $question)
    {
        $validated = $request->validated();
        $payload = [];

        if (array_key_exists('exam_id', $validated)) {
            $payload['exam_id'] = $validated['exam_id'];
        }

        if (array_key_exists('difficulty', $validated)) {
            $payload['difficulty'] = $validated['difficulty'];
        }

        if (array_key_exists('question_text', $validated)) {
            $payload['question_text'] = $validated['question_text'];
        }

        if (array_key_exists('type', $validated)) {
            $payload['type'] = $validated['type'];
        }

        if (
            array_key_exists('option_a', $validated) ||
            array_key_exists('option_b', $validated) ||
            array_key_exists('option_c', $validated) ||
            array_key_exists('option_d', $validated)
        ) {
            $existingOptions = is_array($question->options) ? $question->options : [];

            $payload['options'] = [
                'A' => $validated['option_a'] ?? ($existingOptions['A'] ?? null),
                'B' => $validated['option_b'] ?? ($existingOptions['B'] ?? null),
                'C' => $validated['option_c'] ?? ($existingOptions['C'] ?? null),
                'D' => $validated['option_d'] ?? ($existingOptions['D'] ?? null),
            ];
        }

        if (array_key_exists('correct_answer', $validated)) {
            $payload['correct_answer'] = $validated['correct_answer'];
        }

        if (array_key_exists('marks', $validated)) {
            $payload['marks'] = $validated['marks'];
        }

        $question = $this->questionService->update($question, $payload);

        return new QuestionAdminResource($question);
    }

    public function destroy(Question $question): JsonResponse
    {
        $this->questionService->delete($question);

        return response()->json(['message' => 'Question deleted successfully']);
    }

    public function generateQuestions(GenerateQuestionsRequest $request, Exam $exam)
    {
        $questions = $this->questionService->generateForExam($exam, $request->validated());

        return QuestionResource::collection($questions);
    }

    public function examQuestions(Exam $exam)
    {
        return QuestionAdminResource::collection(
            $exam->questions()->latest()->get()
        );
    }

    public function storeExamQuestion(Request $request, Exam $exam)
    {
        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'type' => ['sometimes', Rule::in(['mcq', 'true_false', 'descriptive'])],
            'option_a' => ['required', 'string', 'max:255'],
            'option_b' => ['required', 'string', 'max:255'],
            'option_c' => ['required', 'string', 'max:255'],
            'option_d' => ['required', 'string', 'max:255'],
            'correct_answer' => ['required', Rule::in(['A', 'B', 'C', 'D'])],
            'marks' => ['required', 'integer', 'min:1'],
        ]);

        $question = $this->questionService->create([
            'exam_id' => $exam->id,
            'created_by' => $request->user()?->id,
            'question_text' => $validated['question_text'],
            'type' => $validated['type'] ?? 'mcq',
            'options' => [
                'A' => $validated['option_a'],
                'B' => $validated['option_b'],
                'C' => $validated['option_c'],
                'D' => $validated['option_d'],
            ],
            'correct_answer' => $validated['correct_answer'],
            'marks' => $validated['marks'],
        ]);

        return (new QuestionAdminResource($question))->response()->setStatusCode(201);
    }

    public function updateExamQuestion(Request $request, Exam $exam, Question $question)
    {
        if ((int) $question->exam_id !== (int) $exam->id) {
            return response()->json(['message' => 'Question not found for this exam.'], 404);
        }

        $validated = $request->validate([
            'question_text' => ['sometimes', 'string'],
            'type' => ['sometimes', Rule::in(['mcq', 'true_false', 'descriptive'])],
            'option_a' => ['sometimes', 'string', 'max:255'],
            'option_b' => ['sometimes', 'string', 'max:255'],
            'option_c' => ['sometimes', 'string', 'max:255'],
            'option_d' => ['sometimes', 'string', 'max:255'],
            'correct_answer' => ['sometimes', Rule::in(['A', 'B', 'C', 'D'])],
            'marks' => ['sometimes', 'integer', 'min:1'],
        ]);

        $payload = [];

        if (array_key_exists('question_text', $validated)) {
            $payload['question_text'] = $validated['question_text'];
        }

        if (array_key_exists('type', $validated)) {
            $payload['type'] = $validated['type'];
        }

        if (
            array_key_exists('option_a', $validated) ||
            array_key_exists('option_b', $validated) ||
            array_key_exists('option_c', $validated) ||
            array_key_exists('option_d', $validated)
        ) {
            $existingOptions = is_array($question->options) ? $question->options : [];

            $payload['options'] = [
                'A' => $validated['option_a'] ?? ($existingOptions['A'] ?? null),
                'B' => $validated['option_b'] ?? ($existingOptions['B'] ?? null),
                'C' => $validated['option_c'] ?? ($existingOptions['C'] ?? null),
                'D' => $validated['option_d'] ?? ($existingOptions['D'] ?? null),
            ];
        }

        if (array_key_exists('correct_answer', $validated)) {
            $payload['correct_answer'] = $validated['correct_answer'];
        }

        if (array_key_exists('marks', $validated)) {
            $payload['marks'] = $validated['marks'];
        }

        $question = $this->questionService->update($question, $payload);

        return new QuestionAdminResource($question);
    }

    public function destroyExamQuestion(Exam $exam, Question $question): JsonResponse
    {
        if ((int) $question->exam_id !== (int) $exam->id) {
            return response()->json(['message' => 'Question not found for this exam.'], 404);
        }

        $this->questionService->delete($question);

        return response()->json(['message' => 'Question deleted successfully']);
    }
}
