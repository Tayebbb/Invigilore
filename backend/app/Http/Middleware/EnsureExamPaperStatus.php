<?php

namespace App\Http\Middleware;

use App\Models\Exam;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureExamPaperStatus
{
    public function handle(Request $request, Closure $next, string ...$statuses): Response
    {
        $examParam = $request->route('exam');
        $exam = $examParam instanceof Exam
            ? $examParam
            : Exam::query()->find($examParam);

        if (! $exam) {
            return response()->json(['message' => 'Exam not found.'], 404);
        }

        $allowed = array_map(static fn (string $status) => strtolower(trim($status)), $statuses);
        $currentStatus = strtolower((string) ($exam->paper_status ?? 'submitted'));

        if (! in_array($currentStatus, $allowed, true)) {
            return response()->json([
                'message' => 'Forbidden. Exam paper status does not allow this action.',
            ], 403);
        }

        return $next($request);
    }
}
