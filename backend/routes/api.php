<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users',          [UserController::class, 'index']);
        Route::post('/admin/users',         [UserController::class, 'store']);
        Route::put('/admin/users/{user}',   [UserController::class, 'update']);
        Route::delete('/admin/users/{user}',[UserController::class, 'destroy']);
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
