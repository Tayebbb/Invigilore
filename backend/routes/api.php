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
use App\Http\Controllers\ModeratorReviewController;
use App\Http\Controllers\AdminDashboardController;

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
        // Dashboard stats
        Route::get('/admin/dashboard',      [AdminDashboardController::class, 'index']);

        // User (faculty) management
        Route::get('/admin/users',          [UserController::class, 'index']);
        Route::get('/admin/users/{user}',    [UserController::class, 'show']);

        Route::middleware('throttle:admin-actions')->group(function () {
            Route::post('/admin/users',         [UserController::class, 'store']);
            Route::match(['put', 'patch'], '/admin/users/{user}', [UserController::class, 'update']);
            Route::patch('/admin/users/{user}/status', [UserController::class, 'updateStatus']);
            Route::delete('/admin/users/{user}',[UserController::class, 'destroy']);
        });
    });

    // Admin or Teacher routes
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('/exams',          [ExamController::class, 'index']);
        Route::post('/exams',         [ExamController::class, 'store']);
        Route::get('/exams/{exam}',   [ExamController::class, 'show']);
        Route::put('/exams/{exam}',   [ExamController::class, 'update']);
        Route::delete('/exams/{exam}',[ExamController::class, 'destroy']);

        Route::prefix('teacher/portal')->group(function () {
            Route::get('/tests', [TeacherPortalController::class, 'tests']);
            Route::get('/tests/{exam}', [TeacherPortalController::class, 'testInfo']);
            Route::post('/tests/{exam}/activate', [TeacherPortalController::class, 'activate']);
            Route::post('/tests/{exam}/end', [TeacherPortalController::class, 'end']);
            Route::get('/results-database', [TeacherPortalController::class, 'resultsDatabase']);
            Route::get('/respondents', [TeacherPortalController::class, 'respondents']);
        });
    });

    // Admin-only question bank routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/questions', [QuestionController::class, 'index']);
        Route::post('/questions', [QuestionController::class, 'store']);
        Route::get('/questions/{question}', [QuestionController::class, 'show']);
        Route::put('/questions/{question}', [QuestionController::class, 'update']);
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);

        Route::get('/exams/{exam}/generate-questions', [QuestionController::class, 'generateQuestions']);
    });

    // Admin, Teacher, Student routes
    Route::middleware('role:admin,teacher,student')->group(function () {
        Route::get('/exam_sessions',          [ExamSessionController::class, 'index']);
        Route::post('/exam_sessions',         [ExamSessionController::class, 'store']);
        Route::get('/exam_sessions/{session}',   [ExamSessionController::class, 'show']);
        Route::put('/exam_sessions/{session}',   [ExamSessionController::class, 'update']);
        Route::delete('/exam_sessions/{session}',[ExamSessionController::class, 'destroy']);

        Route::post('/attempts/start', [ExamAttemptController::class, 'start']);
        Route::get('/attempts/{id}', [ExamAttemptController::class, 'show']);
        Route::post('/attempts/{id}/answer', [ExamAttemptController::class, 'saveAnswer']);
        Route::post('/attempts/{id}/submit', [ExamAttemptController::class, 'submit']);
    });

    // System monitoring / proctoring
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('/proctoring', [ProctoringController::class, 'index']);
    });

    // Question setter exam-scoped question manager routes
    Route::middleware('exam.role:question_setter')->group(function () {
        Route::get('/exams/{exam}/questions', [QuestionController::class, 'examQuestions']);
        Route::post('/exams/{exam}/questions', [QuestionController::class, 'storeExamQuestion']);
        Route::put('/exams/{exam}/questions/{question}', [QuestionController::class, 'updateExamQuestion']);
        Route::delete('/exams/{exam}/questions/{question}', [QuestionController::class, 'destroyExamQuestion']);
    });

    // Moderator paper workflow routes
    Route::middleware(['exam.role:moderator', 'exam.paper_status:submitted,reviewed'])->group(function () {
        Route::get('/exam/{exam}/paper', [ExamWorkflowController::class, 'paper']);
        Route::post('/exam/{exam}/review', [ExamWorkflowController::class, 'review']);
        Route::post('/exam/{exam}/approve', [ExamWorkflowController::class, 'approve']);
        Route::get('/exam/{exam}/moderator', [ExamWorkflowController::class, 'moderator']);
    });

    // Invigilator routes
    Route::middleware('exam.role:invigilator')->group(function () {
        Route::get('/exam/{exam}/instructions', [ExamWorkflowController::class, 'instructions']);
        Route::get('/exam/{exam}/live', [ExamWorkflowController::class, 'live'])->middleware('exam.live_window');
        Route::post('/exam/{exam}/report', [ExamWorkflowController::class, 'report'])->middleware('exam.live_window');
        Route::get('/exam/{exam}/invigilator', [ExamWorkflowController::class, 'invigilator']);
    });

    // Controller super-role routes
    Route::middleware('exam.role:controller')->group(function () {
        Route::get('/exam/{exam}/settings', [ExamWorkflowController::class, 'settings']);
        Route::put('/exam/{exam}/settings', [ExamWorkflowController::class, 'updateSettings']);
        Route::post('/exam/{exam}/activate', [ExamWorkflowController::class, 'activate']);
        Route::get('/exams/{exam}/access', [ExamAccessController::class, 'show']);
        Route::post('/exams/{exam}/access/public', [ExamAccessController::class, 'generatePublic']);
        Route::post('/exams/{exam}/access/private', [ExamAccessController::class, 'generatePrivate']);
    });

    // Moderator paper review routes
    Route::get('/exams/{id}/questions/review', [ModeratorReviewController::class, 'getQuestions']);
    Route::post('/exams/{id}/approve', [ModeratorReviewController::class, 'approvePaper']);

    // Optional audit log route for testing
    Route::middleware('role:admin')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    // Student result routes
    Route::middleware('role:student')->group(function () {
        Route::get('/student/attempts', [StudentResultController::class, 'index']);
        Route::get('/student/attempts/{id}', [StudentResultController::class, 'show']);
        Route::get('/student/results/summary', [StudentResultController::class, 'summary']);
    });
});
