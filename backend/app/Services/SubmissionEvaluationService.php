<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\Question;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmissionEvaluationService
{
    public function submit(User $user, Exam $exam, array $answers, array $scoringRules = [], ?string $idempotencyKey = null): Submission
    {
        $normalizedAnswers = $this->normalizeAnswers($answers);
        $normalizedRules = $this->normalizeScoringRules($scoringRules);
        $payloadHash = $this->buildPayloadHash($user->id, $exam->id, $normalizedAnswers, $normalizedRules, $idempotencyKey);

        $existing = Submission::query()
            ->where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->where('payload_hash', $payloadHash)
            ->with('answers')
            ->first();

        if ($existing) {
            return $existing;
        }

        if ($idempotencyKey) {
            $existingByKey = Submission::query()
                ->where('user_id', $user->id)
                ->where('exam_id', $exam->id)
                ->where('idempotency_key', $idempotencyKey)
                ->with('answers')
                ->first();

            if ($existingByKey) {
                if ($existingByKey->payload_hash !== $payloadHash) {
                    throw ValidationException::withMessages([
                        'idempotency_key' => ['This idempotency key was already used with different submission data.'],
                    ]);
                }

                return $existingByKey;
            }
        }

        return DB::transaction(function () use ($user, $exam, $normalizedAnswers, $normalizedRules, $payloadHash, $idempotencyKey): Submission {
            $examQuestions = $exam->questions()->get();
            $questionsById = $examQuestions->keyBy('id');

            $extraQuestionIds = array_diff(array_keys($normalizedAnswers), $questionsById->keys()->all());
            if ($extraQuestionIds !== []) {
                throw ValidationException::withMessages([
                    'answers' => ['One or more submitted answers do not belong to this exam.'],
                ]);
            }

            $submission = Submission::create([
                'user_id' => $user->id,
                'exam_id' => $exam->id,
                'idempotency_key' => $idempotencyKey,
                'payload_hash' => $payloadHash,
                'answers_payload' => $normalizedAnswers,
                'scoring_rules' => $normalizedRules,
                'total_questions' => $examQuestions->count(),
                'total_marks' => (int) $examQuestions->sum(fn (Question $question) => (int) $this->questionWeight($question)),
                'score' => 0,
                'percentage' => 0,
                'status' => 'evaluated',
                'evaluated_at' => now(),
            ]);

            $evaluation = $this->evaluateQuestions($examQuestions, $normalizedAnswers, $normalizedRules);

            foreach ($evaluation['answers'] as $answerRow) {
                $submission->answers()->create($answerRow);
            }

            $submission->update([
                'score' => $evaluation['score'],
                'percentage' => $evaluation['percentage'],
            ]);

            return $submission->load('user.role', 'exam', 'answers');
        });
    }

    public function evaluateExamResults(Exam $exam): array
    {
        $submissions = Submission::query()
            ->where('exam_id', $exam->id)
            ->with('user.role', 'answers')
            ->latest()
            ->get();

        $scores = $submissions->pluck('score')->map(fn ($value) => (float) $value)->values()->all();

        return [
            'submissions' => $submissions,
            'summary' => [
                'submission_count' => $submissions->count(),
                'average_score' => $this->safeAverage($scores),
                'highest_score' => $scores === [] ? 0.0 : max($scores),
                'lowest_score' => $scores === [] ? 0.0 : min($scores),
                'total_marks' => (int) $exam->questions()->sum('marks'),
            ],
        ];
    }

    private function evaluateQuestions(EloquentCollection $questions, array $answers, array $scoringRules): array
    {
        $rows = [];
        $totalScore = 0.0;
        $totalMarks = 0.0;

        foreach ($questions as $question) {
            $submittedAnswer = $answers[$question->id] ?? null;
            $result = $this->scoreQuestion($question, $submittedAnswer, $scoringRules);

            $totalScore += $result['score_awarded'];
            $totalMarks += $result['weight'];

            $rows[] = [
                'question_id' => $question->id,
                'question_type' => $result['question_type'],
                'submitted_answer' => $result['submitted_answer'],
                'correct_answer' => $result['correct_answer'],
                'is_correct' => $result['is_correct'],
                'score_awarded' => $result['score_awarded'],
                'feedback' => $result['feedback'],
                'evaluation_details' => $result['evaluation_details'],
            ];
        }

        $percentage = $totalMarks > 0 ? round(max(0, $totalScore) / $totalMarks * 100, 2) : 0.0;

        return [
            'score' => round($totalScore, 2),
            'percentage' => $percentage,
            'answers' => $rows,
        ];
    }

    private function scoreQuestion(Question $question, mixed $submittedAnswer, array $scoringRules): array
    {
        $questionType = strtolower(trim((string) ($question->type ?? 'mcq')));
        $weight = $this->questionWeight($question);
        $submitted = $this->normalizeAnswerValue($submittedAnswer, $scoringRules);
        $correct = $this->normalizeAnswerValue($question->correct_answer, $scoringRules);
        $partialCredit = (bool) Arr::get($scoringRules, 'partial_credit', true);
        $negativeMarking = (float) Arr::get($scoringRules, 'negative_marking', 0);
        $similarityThreshold = $this->normalizeThreshold(Arr::get($scoringRules, 'similarity_threshold', 80));

        $isCorrect = false;
        $scoreAwarded = 0.0;
        $feedback = 'Incorrect';
        $evaluationDetails = [
            'weight' => $weight,
            'partial_credit' => $partialCredit,
            'negative_marking' => $negativeMarking,
            'similarity_threshold' => $similarityThreshold,
        ];

        if (in_array($questionType, ['mcq', 'true_false'], true)) {
            $isCorrect = $submitted !== '' && $submitted === $correct;
            $scoreAwarded = $isCorrect ? $weight : ($negativeMarking > 0 ? round(-1 * $weight * $negativeMarking, 2) : 0.0);
            $feedback = $isCorrect ? 'Correct' : ($negativeMarking > 0 ? 'Incorrect with penalty' : 'Incorrect');
        } else {
            $similarity = $this->similarityPercentage($submitted, $correct);
            $isCorrect = ($similarity / 100) >= $similarityThreshold;

            if ($partialCredit) {
                $scoreAwarded = round($weight * ($similarity / 100), 2);
            } elseif ($isCorrect) {
                $scoreAwarded = $weight;
            }

            if (! $isCorrect && $negativeMarking > 0) {
                $scoreAwarded = round(-1 * $weight * $negativeMarking, 2);
            }

            $feedback = $isCorrect
                ? 'Correct'
                : sprintf('Similarity %.1f%%', $similarity);

            $evaluationDetails['similarity'] = $similarity;
        }

        return [
            'question_type' => $questionType,
            'submitted_answer' => $submitted === '' ? null : $submitted,
            'correct_answer' => $correct === '' ? null : $correct,
            'is_correct' => $isCorrect,
            'score_awarded' => $scoreAwarded,
            'feedback' => $feedback,
            'evaluation_details' => $evaluationDetails,
            'weight' => $weight,
        ];
    }

    private function normalizeAnswers(array $answers): array
    {
        $normalized = [];

        foreach ($answers as $entry) {
            if (! is_array($entry)) {
                throw ValidationException::withMessages([
                    'answers' => ['Each answer must be an object containing question_id and submitted_answer.'],
                ]);
            }

            $questionId = (int) ($entry['question_id'] ?? 0);
            if ($questionId <= 0) {
                throw ValidationException::withMessages([
                    'answers' => ['Each answer must include a valid question_id.'],
                ]);
            }

            if (array_key_exists($questionId, $normalized)) {
                throw ValidationException::withMessages([
                    'answers' => ['Duplicate answers detected for question #' . $questionId . '.'],
                ]);
            }

            $normalized[$questionId] = $entry['submitted_answer'] ?? null;
        }

        ksort($normalized);

        return $normalized;
    }

    private function normalizeScoringRules(array $scoringRules): array
    {
        return [
            'partial_credit' => (bool) ($scoringRules['partial_credit'] ?? true),
            'negative_marking' => max(0, (float) ($scoringRules['negative_marking'] ?? 0)),
            'similarity_threshold' => $this->normalizeThreshold($scoringRules['similarity_threshold'] ?? 80),
            'case_sensitive' => (bool) ($scoringRules['case_sensitive'] ?? false),
            'trim_whitespace' => array_key_exists('trim_whitespace', $scoringRules) ? (bool) $scoringRules['trim_whitespace'] : true,
        ];
    }

    private function normalizeThreshold(mixed $value): float
    {
        $threshold = (float) $value;

        if ($threshold > 1) {
            $threshold /= 100;
        }

        return max(0.0, min(1.0, $threshold));
    }

    private function normalizeAnswerValue(mixed $value, array $scoringRules): string
    {
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $text = (string) $value;

        if ((bool) ($scoringRules['trim_whitespace'] ?? true)) {
            $text = trim($text);
            $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
        }

        if (! (bool) ($scoringRules['case_sensitive'] ?? false)) {
            $text = mb_strtolower($text);
        }

        return $text;
    }

    private function similarityPercentage(string $submitted, string $correct): float
    {
        if ($submitted === '' || $correct === '') {
            return 0.0;
        }

        similar_text($submitted, $correct, $percent);

        return round((float) $percent, 2);
    }

    private function questionWeight(Question $question): float
    {
        return max(0.0, (float) ($question->marks ?? 1));
    }

    private function buildPayloadHash(int $userId, int $examId, array $answers, array $rules, ?string $idempotencyKey): string
    {
        $payload = [
            'user_id' => $userId,
            'exam_id' => $examId,
            'answers' => $answers,
            'rules' => $rules,
            'idempotency_key' => $idempotencyKey,
        ];

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function safeAverage(array $values): float
    {
        if ($values === []) {
            return 0.0;
        }

        return round(array_sum($values) / count($values), 2);
    }
}