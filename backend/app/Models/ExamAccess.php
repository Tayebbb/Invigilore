<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAccess extends Model
{
    use HasFactory;

    protected $table = 'exam_access';

    protected $fillable = [
        'exam_id',
        'channel',
        'access_type',
        'access_token',
        'require_email',
    ];

    protected $casts = [
        'require_email' => 'boolean',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
