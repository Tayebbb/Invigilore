<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class AuditService
{
    public function log(string $eventType, ?string $description = null): void
    {
        try {
            $request = request();
            $user = auth()->user();

            AuditLog::create([
                'user_id' => $user?->id,
                'event_type' => $eventType,
                'description' => $description,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Audit logging failed', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
