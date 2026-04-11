<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $normalized = array_values(array_filter(array_map(static fn (string $value) => trim($value), $permissions)));

        if ($normalized === []) {
            return response()->json(['message' => 'Forbidden. Missing permission configuration.'], 403);
        }

        if (! $user->hasAnyPermission($normalized)) {
            return response()->json(['message' => 'Forbidden. Insufficient permissions.'], 403);
        }

        return $next($request);
    }
}
