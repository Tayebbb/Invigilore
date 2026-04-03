<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class QuestionService
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Question::query()->with('exam');

        if (array_key_exists('exam_id', $filters) && $filters['exam_id'] !== null && $filters['exam_id'] !== '') {
            $query->where('exam_id', $filters['exam_id']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function create(array $data): Question
    {
        return Question::create($data)->load('exam');
    }

    public function update(Question $question, array $data): Question
    {
        $question->update($data);

        return $question->fresh()->load('exam');
    }

    public function delete(Question $question): void
    {
        $question->delete();
    }

    public function generateForExam(Exam $exam, array $criteria): Collection
    {
        $totalQuestions = max(0, (int) ($criteria['total_questions'] ?? 0));

        if ($totalQuestions === 0) {
            return new Collection();
        }

        return Question::query()
            ->where('exam_id', $exam->id)
            ->inRandomOrder()
            ->limit($totalQuestions)
            ->get();
    }
}