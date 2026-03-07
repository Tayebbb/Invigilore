<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProctoringController extends Controller
{
    /**
     * GET /proctoring — system monitoring placeholder
     */
    public function index()
    {
        // TODO: implement real proctoring logic
        return response()->json(['status' => 'monitoring active', 'details' => []]);
    }
}
