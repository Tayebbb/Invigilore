<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'subject_id',
        'name',
        'subject_code',
        'department',
        'credit_hours',
        'description',
    ];

    protected $casts = [
        'credit_hours' => 'integer',
    ];

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }
}