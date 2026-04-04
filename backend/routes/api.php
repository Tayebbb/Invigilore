<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\ProctoringController;
use App\Http\Controllers\ExamSessionController;
use App\Http\Controllers\ExamAttemptController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users',          [UserController::class, 'index']);
        Route::post('/admin/users',         [UserController::class, 'store']);
        Route::put('/admin/users/{user}',   [UserController::class, 'update']);
        Route::delete('/admin/users/{user}',[UserController::class, 'destroy']);
    });

    // Admin or Teacher routes
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('/exams',          [ExamController::class, 'index']);
        Route::post('/exams',         [ExamController::class, 'store']);
        Route::get('/exams/{exam}',   [ExamController::class, 'show']);
        Route::put('/exams/{exam}',   [ExamController::class, 'update']);
        Route::delete('/exams/{exam}',[ExamController::class, 'destroy']);
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
        Route::get('/results',          [ResultController::class, 'index']);
        Route::post('/results',         [ResultController::class, 'store']);
        Route::get('/results/{result}',   [ResultController::class, 'show']);
        Route::put('/results/{result}',   [ResultController::class, 'update']);
        Route::delete('/results/{result}',[ResultController::class, 'destroy']);
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
});
