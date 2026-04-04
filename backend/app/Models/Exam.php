<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'title',
        'teacher_id',
        'controller_id',
        'question_setter_id',
        'moderator_id',
        'invigilator_id',
        'duration',
        'total_marks',
        'start_time',
        'end_time',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function controller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'controller_id');
    }

    public function questionSetter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'question_setter_id');
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }

    public function invigilator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invigilator_id');
    }
}