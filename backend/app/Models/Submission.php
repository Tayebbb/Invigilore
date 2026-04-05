<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'exam_id',
        'idempotency_key',
        'payload_hash',
        'answers_payload',
        'scoring_rules',
        'total_questions',
        'total_marks',
        'score',
        'percentage',
        'status',
        'evaluated_at',
    ];

    protected function casts(): array
    {
        return [
            'answers_payload' => 'array',
            'scoring_rules' => 'array',
            'evaluated_at' => 'datetime',
            'score' => 'decimal:2',
            'percentage' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SubmissionAnswer::class);
    }
}