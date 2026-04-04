<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamIncidentReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'invigilator_id',
        'message',
        'severity',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function invigilator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invigilator_id');
    }
}
