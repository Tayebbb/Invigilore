<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSession extends Model
{
    protected $fillable = [
        'exam_id', 'user_id', 'started_at', 'ended_at', 'status', 'proctoring_data'
    ];
}
