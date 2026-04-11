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
        $this->apiKey = config('services.openrouter.key') ?? env('OPENROUTER_API_KEY');
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
        - type: One of [mcq, true_false, descriptive, short_answer]
        - options: An object like {\"A\": \"Choice 1\", \"B\": \"Choice 2\"...} (required for mcq, use {\"A\": \"True\", \"B\": \"False\"} for true_false)
        - correct_answer: The correct key like \"A\" or \"A,B\" for multiple choice, or a string for short_answer. Leave empty for descriptive.
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
            
            // Cleanup any markdown code blocks that AI might include
            $content = preg_replace('/^```json|```$/m', '', $content);
            $questions = json_decode(trim($content), true);

            if (!is_array($questions)) {
                throw new \Exception('AI returned invalid JSON format.');
            }

            return $questions;

        } catch (\Exception $e) {
            Log::error('AI Question Generation Error', ['message' => $e->getMessage()]);
            throw $e;
        }
    }
}
