<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'preferences',
    ];

    protected function casts(): array
    {
        return [
            'preferences' => 'array',
        ];
    }
}
