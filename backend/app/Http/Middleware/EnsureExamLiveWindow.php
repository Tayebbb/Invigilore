<?php

namespace App\Http\Middleware;

use App\Models\Exam;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class EnsureExamLiveWindow
{
    public function handle(Request $request, Closure $next): Response
    {
        $examParam = $request->route('exam');
        $exam = $examParam instanceof Exam
            ? $examParam
            : Exam::query()->find($examParam);

        if (! $exam) {
            return response()->json(['message' => 'Exam not found.'], 404);
        }

        $now = Carbon::now();
        $start = $exam->start_time ? Carbon::parse($exam->start_time) : null;
        $end = $exam->end_time ? Carbon::parse($exam->end_time) : null;

        if (! $start || ! $end || $now->lt($start) || $now->gt($end)) {
            return response()->json([
                'message' => 'Forbidden. Exam is not currently live for invigilator access.',
            ], 403);
        }

        return $next($request);
    }
}
