<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Incident;

class AdminDashboardController extends Controller
{
    // GET /api/admin/dashboard
    public function index()
    {
        // User stats
        $totalStudents = User::whereHas('role', fn($q) => $q->where('name', 'student'))->count();
        $totalTeachers = User::whereHas('role', fn($q) => $q->where('name', 'teacher'))->count();
        $totalAdmins   = User::whereHas('role', fn($q) => $q->where('name', 'admin'))->count();

        // Recent activity (last 5 audit logs)
        $recentActivity = AuditLog::orderBy('created_at', 'desc')->limit(5)->get(['description', 'created_at']);

        // System health (dummy for now, replace with real checks if needed)
        $systemHealth = [
            ['service' => 'API Server',      'status' => 'Operational'],
            ['service' => 'Database',        'status' => DB::connection()->getPdo() ? 'Operational' : 'Offline'],
            ['service' => 'Storage',         'status' => 'Operational'],
            ['service' => 'Email Service',   'status' => 'Degraded'],
            ['service' => 'Exam AI Engine',  'status' => 'Offline'],
        ];

        return response()->json([
            'stats' => [
                'totalStudents' => $totalStudents,
                'totalTeachers' => $totalTeachers,
                'totalAdmins'   => $totalAdmins,
            ],
            'recentActivity' => $recentActivity,
            'systemHealth'   => $systemHealth,
        ]);
    }
}
