<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'question_id',
        'question_type',
        'submitted_answer',
        'correct_answer',
        'is_correct',
        'score_awarded',
        'feedback',
        'evaluation_details',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'score_awarded' => 'decimal:2',
            'evaluation_details' => 'array',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}