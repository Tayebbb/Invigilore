<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\ProctoringController;
use App\Http\Controllers\StudentAccountSettingsController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\StudentExamController;
use App\Http\Controllers\ExamSessionController;
use App\Http\Controllers\ExamAttemptController;
use App\Http\Controllers\StudentResultController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ExamWorkflowController;
use App\Http\Controllers\ExamAccessController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/test/{exam}', [ExamAccessController::class, 'verify']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Student secure exam module
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/exams', [StudentExamController::class, 'index']);
        Route::post('/exams/{exam}/start', [StudentExamController::class, 'start']);

        Route::get('/attempts/{attempt}', [StudentExamController::class, 'showAttempt']);
        Route::post('/attempts/{attempt}/answers', [StudentExamController::class, 'saveAnswer']);
        Route::post('/attempts/{attempt}/submit', [StudentExamController::class, 'submit']);
        Route::post('/attempts/{attempt}/telemetry', [StudentExamController::class, 'telemetry']);

        Route::get('/results', [StudentExamController::class, 'results']);
        Route::get('/submissions', [StudentExamController::class, 'submissions']);

        Route::get('/account-settings', [StudentAccountSettingsController::class, 'show']);
        Route::put('/account-settings/profile', [StudentAccountSettingsController::class, 'updateProfile']);
        Route::put('/account-settings/password', [StudentAccountSettingsController::class, 'changePassword']);
        Route::put('/account-settings/preferences', [StudentAccountSettingsController::class, 'updatePreferences']);

        Route::get('/support-tickets', [SupportTicketController::class, 'index']);
        Route::post('/support-tickets', [SupportTicketController::class, 'store']);
    });

    // Subject read routes (all authenticated roles)
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{subject}', [SubjectController::class, 'show']);

    // Subject write routes (Admin + Controller only)
    Route::middleware('role:admin,controller')->group(function () {
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::match(['put', 'patch'], '/subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);
    });


    // System Administrator (IT-only) Admin routes
    Route::middleware('role:admin')->group(function () {
        // User (faculty) management
        Route::get('/admin/users',          [UserController::class, 'index']);
        Route::post('/admin/users',         [UserController::class, 'store']);
        Route::put('/admin/users/{user}',   [UserController::class, 'update']);
        Route::delete('/admin/users/{user}',[UserController::class, 'destroy']);

        // Admin dashboard stats, activity, system health
        Route::get('/admin/dashboard', [\App\Http\Controllers\AdminDashboardController::class, 'index']);

        // System settings, security policies, backups, audit logs, incidents
        // Add endpoints for these features as implemented:
        // Route::get('/admin/settings', [SettingsController::class, 'index']);
        // Route::put('/admin/settings', [SettingsController::class, 'update']);
        // Route::get('/admin/security-policies', [SecurityPolicyController::class, 'index']);
        // Route::put('/admin/security-policies', [SecurityPolicyController::class, 'update']);
        // Route::post('/admin/backups', [BackupController::class, 'create']);
        // Route::post('/admin/backups/restore', [BackupController::class, 'restore']);
        Route::get('/admin/audit-logs', [AuditLogController::class, 'index']);
        // Route::get('/admin/incidents', [IncidentController::class, 'index']);
        // Route::get('/admin/incidents/{id}', [IncidentController::class, 'show']);
    });

    // Student result routes
    Route::middleware('role:student')->group(function () {
        Route::get('/student/attempts', [StudentResultController::class, 'index']);
        Route::get('/student/attempts/{id}', [StudentResultController::class, 'show']);
        Route::get('/student/results/summary', [StudentResultController::class, 'summary']);
    });
});
