<?php

namespace App\Services;

use App\Models\ExamAttempt;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Http\Request;

class IncidentService
{
    public function record(
        ?User $user,
        ?int $examId,
        ?int $attemptId,
        string $type,
        string $severity,
        array $metadata,
        ?Request $request = null
    ): Incident {
        return Incident::create([
            'user_id' => $user?->id,
            'exam_id' => $examId,
            'attempt_id' => $attemptId,
            'incident_type' => $type,
            'severity' => $severity,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    public function detectAttemptEnvironmentDrift(ExamAttempt $attempt, Request $request): void
    {
        $incomingIp = (string) ($request->ip() ?? '');
        $incomingAgent = (string) ($request->userAgent() ?? '');

        if (! empty($attempt->last_ip) && $attempt->last_ip !== $incomingIp) {
            $this->record(
                $request->user(),
                (int) $attempt->exam_id,
                (int) $attempt->id,
                'ip_changed_during_attempt',
                'medium',
                [
                    'previous_ip' => $attempt->last_ip,
                    'new_ip' => $incomingIp,
                ],
                $request
            );
        }

        if (! empty($attempt->last_user_agent) && $attempt->last_user_agent !== $incomingAgent) {
            $this->record(
                $request->user(),
                (int) $attempt->exam_id,
                (int) $attempt->id,
                'user_agent_changed_during_attempt',
                'low',
                [
                    'previous_user_agent' => $attempt->last_user_agent,
                    'new_user_agent' => $incomingAgent,
                ],
                $request
            );
        }

        $attempt->forceFill([
            'last_ip' => $incomingIp,
            'last_user_agent' => $incomingAgent,
        ])->save();
    }
}
