<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttemptAnswer extends Model
{
    use HasFactory;

    protected $table = 'attempt_answers';

    protected $fillable = [
        'attempt_id',
        'question_id',
        'selected_answer',
        'selected_option',
        'answer_text',
        'is_correct',
        'score_awarded',
        'feedback',
        'is_ai_evaluated',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'is_ai_evaluated' => 'boolean',
            'score_awarded' => 'float',
        ];
    }

    public function getSelectedAnswerAttribute(): ?string
    {
        return $this->attributes['selected_answer'] ?? $this->attributes['selected_option'] ?? null;
    }

    public function setSelectedAnswerAttribute(?string $value): void
    {
        $this->attributes['selected_answer'] = $value;
        $this->attributes['selected_option'] = $value;
    }

    public function getSelectedOptionAttribute(): ?string
    {
        return $this->attributes['selected_option'] ?? $this->attributes['selected_answer'] ?? null;
    }

    public function setSelectedOptionAttribute(?string $value): void
    {
        $this->attributes['selected_option'] = $value;
        $this->attributes['selected_answer'] = $value;
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
