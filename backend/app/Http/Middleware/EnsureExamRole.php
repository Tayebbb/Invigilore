<?php

namespace App\Http\Middleware;

use App\Models\Exam;
use App\Models\ExamRole;
use App\Support\ExamRoles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureExamRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role?->name === 'admin') {
            return $next($request);
        }

        $examParam = $request->route('exam');
        $exam = $examParam instanceof Exam
            ? $examParam
            : Exam::query()->find($examParam);

        if (! $exam) {
            return response()->json(['message' => 'Exam not found.'], 404);
        }

        if ((int) $exam->controller_id === (int) $user->id || (int) $exam->teacher_id === (int) $user->id) {
            return $next($request);
        }

        $normalizedRoles = empty($roles)
            ? [ExamRoles::QUESTION_SETTER]
            : array_map(fn (string $role) => strtolower(str_replace(['-', ' '], '_', trim($role))), $roles);

        $examRolesMatch = ExamRole::query()
            ->where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->whereIn('role', $normalizedRoles)
            ->exists();

        if ($examRolesMatch) {
            return $next($request);
        }

        foreach ($normalizedRoles as $role) {
            $column = ExamRoles::toExamColumn($role);
            if ($column !== null && (int) $exam->{$column} === (int) $user->id) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Forbidden. Missing required exam role.'], 403);
    }
}
