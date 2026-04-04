<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{
    /**
     * GET /exams — list all exams (admin/teacher)
     */
    public function index()
    {
        $exams = Exam::with([
            'subject',
            'questions',
            'teacher',
            'controller',
            'questionSetter',
            'moderator',
            'invigilator',
        ])->latest()->get();
        return response()->json($exams);
    }

    /**
     * POST /exams — create exam (admin/teacher)
     */
    public function store(Request $request)
    {
        $creator = $request->user();

        if (! $creator) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'subject_id'  => 'required|integer|exists:subjects,id',
            'duration'    => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'start_time'  => 'required|date',
            'end_time'    => 'required|date|after:start_time',
            'question_setter_email' => 'nullable|email|exists:users,email',
            'moderator_email'       => 'nullable|email|exists:users,email',
            'invigilator_email'     => 'nullable|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $validator->validated();
        $questionSetter = null;
        $moderator = null;
        $invigilator = null;

        if (! empty($payload['question_setter_email'])) {
            $questionSetter = User::where('email', $payload['question_setter_email'])->first();
        }

        if (! empty($payload['moderator_email'])) {
            $moderator = User::where('email', $payload['moderator_email'])->first();
        }

        if (! empty($payload['invigilator_email'])) {
            $invigilator = User::where('email', $payload['invigilator_email'])->first();
        }

        $assignedIds = array_filter([
            $questionSetter?->id,
            $moderator?->id,
            $invigilator?->id,
        ]);

        if (count($assignedIds) !== count(array_unique($assignedIds))) {
            return response()->json([
                'message' => 'Each assignment role must be mapped to a different user email.',
            ], 422);
        }

        if (in_array($creator->id, $assignedIds, true)) {
            return response()->json([
                'message' => 'Controller cannot be assigned as question setter, moderator, or invigilator.',
            ], 422);
        }

        $exam = Exam::create([
            'title' => $payload['title'],
            'subject_id' => $payload['subject_id'],
            'duration' => $payload['duration'],
            'total_marks' => $payload['total_marks'],
            'start_time' => $payload['start_time'],
            'end_time' => $payload['end_time'],
            'teacher_id' => $creator->id,
            'controller_id' => $creator->id,
            'question_setter_id' => $questionSetter?->id,
            'moderator_id' => $moderator?->id,
            'invigilator_id' => $invigilator?->id,
        ]);

        return response()->json($exam->load([
            'subject',
            'teacher',
            'controller',
            'questionSetter',
            'moderator',
            'invigilator',
        ]), 201);
    }

    /**
     * GET /exams/{exam} — show exam details
     */
    public function show(Exam $exam)
    {
        return response()->json($exam->load([
            'subject',
            'questions',
            'teacher',
            'controller',
            'questionSetter',
            'moderator',
            'invigilator',
        ]));
    }

    /**
     * PUT /exams/{exam} — update exam
     */
    public function update(Request $request, Exam $exam)
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|max:255',
            'subject_id'  => 'sometimes|integer|exists:subjects,id',
            'duration'    => 'sometimes|integer|min:1',
            'total_marks' => 'sometimes|integer|min:1',
            'start_time'  => 'sometimes|date',
            'end_time'    => 'sometimes|date|after:start_time',
            'question_setter_email' => 'sometimes|nullable|email|exists:users,email',
            'moderator_email'       => 'sometimes|nullable|email|exists:users,email',
            'invigilator_email'     => 'sometimes|nullable|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $actor = $request->user();
        if ($actor && $actor->role?->name !== 'admin' && $exam->controller_id !== $actor->id) {
            return response()->json([
                'message' => 'Only the exam controller or admin can update this exam.',
            ], 403);
        }

        $data = $validator->validated();

        if (array_key_exists('question_setter_email', $data)) {
            $exam->question_setter_id = $data['question_setter_email']
                ? User::where('email', $data['question_setter_email'])->value('id')
                : null;
            unset($data['question_setter_email']);
        }

        if (array_key_exists('moderator_email', $data)) {
            $exam->moderator_id = $data['moderator_email']
                ? User::where('email', $data['moderator_email'])->value('id')
                : null;
            unset($data['moderator_email']);
        }

        if (array_key_exists('invigilator_email', $data)) {
            $exam->invigilator_id = $data['invigilator_email']
                ? User::where('email', $data['invigilator_email'])->value('id')
                : null;
            unset($data['invigilator_email']);
        }

        $assignedIds = array_filter([
            $exam->question_setter_id,
            $exam->moderator_id,
            $exam->invigilator_id,
        ]);

        if (count($assignedIds) !== count(array_unique($assignedIds))) {
            return response()->json([
                'message' => 'Each assignment role must be mapped to a different user email.',
            ], 422);
        }

        if (in_array($exam->controller_id, $assignedIds, true)) {
            return response()->json([
                'message' => 'Controller cannot be assigned as question setter, moderator, or invigilator.',
            ], 422);
        }

        $exam->fill($data);
        $exam->save();

        return response()->json($exam->load([
            'subject',
            'teacher',
            'controller',
            'questionSetter',
            'moderator',
            'invigilator',
        ]));
    }

    /**
     * DELETE /exams/{exam} — delete exam
     */
    public function destroy(Exam $exam)
    {
        $exam->delete();
        return response()->json(['message' => 'Exam deleted']);
    }
}
