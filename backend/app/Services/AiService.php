<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.key') ?? env('OPENROUTER_API_KEY', '');
        
        if (empty($this->apiKey)) {
            Log::warning('AiService: OPENROUTER_API_KEY is not set in .env or config.');
        }
    }

    /**
     * Generate questions using OpenRouter AI
     *
     * @param string $prompt The user's prompt or topic
     * @param int $count Number of questions to generate
     * @param string $difficulty easy, medium, hard
     * @return array
     */
    public function generateQuestions(string $prompt, int $count = 5, string $difficulty = 'medium'): array
    {
        $systemPrompt = "You are an expert exam question generator. Generate exactly $count $difficulty questions about the user's topic.
        Return ONLY a JSON array of objects. Each object MUST have these fields:
        - question_text: The full question
        - type: One of [mcq, descriptive]
        - options: For mcq only, an object like {\"A\": \"Choice 1\", \"B\": \"Choice 2\", \"C\": \"Choice 3\", \"D\": \"Choice 4\"}
        - correct_answer: For mcq, one of [\"A\", \"B\", \"C\", \"D\"]. Leave null for descriptive.
        - marks: A suggested integer mark
        
        Do not include any other text or markdown formatting. Just the raw JSON array.";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'HTTP-Referer' => 'https://invigilore.test', // Optional
                'X-Title' => 'Invigilore',
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, [
                'model' => 'google/gemini-2.0-flash-001', // High performance & fast
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => "Topic: $prompt"],
                ],
                'temperature' => 0.7,
            ]);

            if ($response->failed()) {
                Log::error('OpenRouter API Failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to connect to AI service.');
            }

            $content = $response->json('choices.0.message.content');
            
            // Extract JSON array from the response string
            if (preg_match('/\[.*\]/s', $content, $matches)) {
                $content = $matches[0];
            }
            
            $questions = json_decode(trim($content), true);

            if (!is_array($questions)) {
                Log::error('AI Error: Could not parse JSON array', ['raw_content' => $content]);
                throw new \Exception('AI returned invalid format. Please try a different prompt.');
            }

            return $questions;

        } catch (\Exception $e) {
            Log::error('AI Question Generation Error', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Evaluate a descriptive or short answer using AI
     */
    public function evaluateAnswer(string $question, string $answer, ?string $reference = null, int $maxMarks = 5): array
    {
        $systemPrompt = "You are an expert exam grader. Evaluate the student's answer based on the question and reference answer.
        Provide:
        - score: An integer from 0 to $maxMarks
        - feedback: A short, constructive explanation for the score.
        - is_correct: Boolean (true if score > 50% of maxMarks)
        
        Return ONLY a JSON object with these fields. Do not include markdown or other text.";

        $userContent = "Question: $question\nStudent Answer: $answer";
        if ($reference) {
            $userContent .= "\nReference Answer: $reference";
        }
        $userContent .= "\nMax Marks: $maxMarks";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, [
                'model' => 'google/gemini-2.0-flash-001',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent],
                ],
                'temperature' => 0.3,
            ]);

            if ($response->failed()) return ['score' => 0, 'feedback' => 'AI evaluation failed.', 'is_correct' => false];

            $content = $response->json('choices.0.message.content');
            if (preg_match('/\{.*\}/s', $content, $matches)) {
                $content = $matches[0];
            }
            
            $result = json_decode(trim($content), true);
            return $result ?? ['score' => 0, 'feedback' => 'Invalid AI response.', 'is_correct' => false];

        } catch (\Exception $e) {
            return ['score' => 0, 'feedback' => 'Error during AI evaluation.', 'is_correct' => false];
        }
    }
}
