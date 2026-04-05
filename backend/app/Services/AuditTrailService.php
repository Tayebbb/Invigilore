<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuditTrailService
{
    public function log(?User $user, string $action, array $payload = [], ?string $ipAddress = null): void
    {
        $description = json_encode($payload, JSON_UNESCAPED_SLASHES);

        try {
            AuditLog::writeEntry($user?->id, $action, $description, $ipAddress, null);
        } catch (\Throwable $exception) {
            Log::warning('Audit trail persistence failed', [
                'user_id' => $user?->id,
                'action' => $action,
                'ip_address' => $ipAddress,
                'error' => $exception->getMessage(),
            ]);
        }

        Log::info('Audit trail event', [
            'user_id' => $user?->id,
            'action' => $action,
            'payload' => $payload,
            'ip_address' => $ipAddress,
        ]);
    }
}
