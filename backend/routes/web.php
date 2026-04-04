<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExamAccessController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test/{exam}', [ExamAccessController::class, 'verify']);
