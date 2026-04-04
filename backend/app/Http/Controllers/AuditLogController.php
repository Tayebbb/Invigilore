<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = AuditLog::query()
            ->latest('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $logs,
        ]);
    }
}
