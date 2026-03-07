<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExamSession;

class ExamSessionController extends Controller
{
    public function index()
    {
        return ExamSession::all();
    }

    public function store(Request $request)
    {
        $session = ExamSession::create($request->all());
        return response()->json($session, 201);
    }

    public function show($id)
    {
        return ExamSession::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $session = ExamSession::findOrFail($id);
        $session->update($request->all());
        return response()->json($session);
    }

    public function destroy($id)
    {
        $session = ExamSession::findOrFail($id);
        $session->delete();
        return response()->json(null, 204);
    }
}
