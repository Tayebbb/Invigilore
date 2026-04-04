<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditLog extends Model
{
    use HasFactory;

    protected static ?string $resolvedActionColumn = null;
    protected static ?bool $hasUpdatedAt = null;
    protected static ?bool $hasUserAgent = null;

    public $timestamps = false;

    public static function writeEntry(
        ?int $userId,
        string $action,
        ?string $description = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $now = now();

        $payload = [
            'user_id' => $userId,
            static::actionColumn() => $action,
            'description' => $description,
            'ip_address' => $ipAddress,
            'created_at' => $now,
        ];

        if (static::hasUpdatedAtColumn()) {
            $payload['updated_at'] = $now;
        }

        if (static::hasUserAgentColumn()) {
            $payload['user_agent'] = $userAgent;
        }

        DB::table('audit_logs')->insert($payload);
    }

    protected static function actionColumn(): string
    {
        if (static::$resolvedActionColumn !== null) {
            return static::$resolvedActionColumn;
        }

        static::$resolvedActionColumn = Schema::hasColumn('audit_logs', 'event_type')
            ? 'event_type'
            : 'action';

        return static::$resolvedActionColumn;
    }

    protected static function hasUpdatedAtColumn(): bool
    {
        if (static::$hasUpdatedAt !== null) {
            return static::$hasUpdatedAt;
        }

        static::$hasUpdatedAt = Schema::hasColumn('audit_logs', 'updated_at');

        return static::$hasUpdatedAt;
    }

    protected static function hasUserAgentColumn(): bool
    {
        if (static::$hasUserAgent !== null) {
            return static::$hasUserAgent;
        }

        static::$hasUserAgent = Schema::hasColumn('audit_logs', 'user_agent');

        return static::$hasUserAgent;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
