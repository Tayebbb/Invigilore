<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingUserRegistration extends Model
{
    protected $fillable = [
        'email',
        'name',
        'password_hash',
        'role_id',
        'role',
        'verification_code_hash',
        'verification_token_hash',
        'verification_code_expires_at',
        'expires_at',
        'verified_at',
        'consumed_at',
    ];

    protected function casts(): array
    {
        return [
            'verification_code_expires_at' => 'datetime',
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }
}
