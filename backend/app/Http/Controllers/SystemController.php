<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    /**
     * Get the current server time in ISO format.
     * Used for client-server time synchronization and preventing local time tampering.
     */
    public function currentTime(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'server_time' => now()->toISOString(),
            'timezone' => config('app.timezone'),
            'timestamp' => now()->timestamp * 1000 // milliseconds for JS compatibility
        ]);
    }
}
