<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        // Route::get('/admin/dashboard', [AdminController::class, 'index']);
    });

    // Teacher-only routes
    Route::middleware('role:teacher')->group(function () {
        // Route::get('/teacher/courses', [TeacherController::class, 'index']);
    });

    // Admin or Teacher routes
    Route::middleware('role:admin,teacher')->group(function () {
        // Route::get('/exams', [ExamController::class, 'index']);
    });

    // Student-only routes
    Route::middleware('role:student')->group(function () {
        // Route::get('/student/results', [StudentController::class, 'results']);
    });
});
