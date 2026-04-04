<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Exam;
use App\Models\Result;
use App\Models\ExamSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $studentCount = User::whereHas('role', fn($q) => $q->where('name', 'student'))->count();
        $teacherCount = User::whereHas('role', fn($q) => $q->where('name', 'teacher'))->count();
        $adminCount   = User::whereHas('role', fn($q) => $q->where('name', 'admin'))->count();
        $examCount    = Exam::count();
        $activeExams  = ExamSession::where('status', 'active')->count();
        $upcomingExams= ExamSession::where('status', 'upcoming')->count();
        $recentActivity = DB::table('audit_logs')->latest('created_at')->limit(5)->get(['description', 'created_at']);
        $systemStatus = [
            'api_server'     => 'Operational',
            'database'       => DB::connection()->getPdo() ? 'Operational' : 'Offline',
            'storage'        => 'Operational',
            'email_service'  => 'Operational',
            'exam_ai_engine' => 'Operational',
        ];
        return response()->json([
            'students'        => $studentCount,
            'teachers'        => $teacherCount,
            'admins'          => $adminCount,
            'exams'           => $examCount,
            'active_exams'    => $activeExams,
            'upcoming_exams'  => $upcomingExams,
            'recent_activity' => $recentActivity,
            'system_status'   => $systemStatus,
        ]);
    }
}
