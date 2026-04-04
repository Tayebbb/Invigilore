<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamRole;
use App\Models\User;
use App\Support\ExamRoles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{
    /**
     * GET /exams — list all exams (admin/teacher)
     */
    public function index()
    {
        $user = request()->user();

        $query = Exam::with([
            'subject',
            'questions',
            'teacher',
            'controller',
            'questionSetter',
            'moderator',
            'invigilator',
        ])->latest();

        if ($user && $user->role?->name !== 'admin') {
            $query->where(function ($roleQuery) use ($user) {
                $roleQuery->where('teacher_id', $user->id)
                    ->orWhere('controller_id', $user->id)
                    ->orWhere('question_setter_id', $user->id)
                    ->orWhere('moderator_id', $user->id)
                    ->orWhere('invigilator_id', $user->id);
            });
        }

        $exams = $query->get();
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
            'exam_status'           => 'nullable|in:draft,active,scheduled,completed',
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

        if (
            $creator->id === $questionSetter?->id ||
            $creator->id === $moderator?->id ||
            $creator->id === $invigilator?->id
        ) {
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
            'paper_status' => 'submitted',
            'teacher_id' => $creator->id,
            'controller_id' => $creator->id,
            'question_setter_id' => $questionSetter?->id,
            'moderator_id' => $moderator?->id,
            'invigilator_id' => $invigilator?->id,
            'exam_status' => $payload['exam_status'] ?? 'draft',
        ]);

        $this->syncExamRoleAssignments($exam);

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
        $user = request()->user();

        if ($user && $user->role?->name !== 'admin') {
            $allowedUserIds = array_filter([
                $exam->teacher_id,
                $exam->controller_id,
                $exam->question_setter_id,
                $exam->moderator_id,
                $exam->invigilator_id,
            ]);

            if (! in_array($user->id, $allowedUserIds, true)) {
                return response()->json([
                    'message' => 'Forbidden. You do not have access to this exam.',
                ], 403);
            }
        }

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
            'exam_status'           => 'sometimes|nullable|in:draft,active,scheduled,completed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $actor = $request->user();
        $isControllerOrAdmin = $actor && ($actor->role?->name === 'admin' || $exam->controller_id === $actor->id);

        if (!$isControllerOrAdmin) {
            $isOtherRoleOnExam = $actor && (
                $exam->question_setter_id === $actor->id ||
                $exam->moderator_id === $actor->id ||
                $exam->invigilator_id === $actor->id
            );

            if (!$isOtherRoleOnExam) {
                return response()->json([
                    'message' => 'You do not have permission to update this exam.',
                ], 403);
            }

            // Only allow specialized roles to change exam_status
            $allowedKeys = ['exam_status'];
            $data = array_intersect_key($validator->validated(), array_flip($allowedKeys));
        } else {
            $data = $validator->validated();
        }

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

        if (
            $exam->controller_id === $exam->question_setter_id ||
            $exam->controller_id === $exam->moderator_id ||
            $exam->controller_id === $exam->invigilator_id
        ) {
            return response()->json([
                'message' => 'Controller cannot be assigned as question setter, moderator, or invigilator.',
            ], 422);
        }

        $exam->fill($data);
        $exam->save();

        $this->syncExamRoleAssignments($exam);

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

    private function syncExamRoleAssignments(Exam $exam): void
    {
        ExamRole::query()->where('exam_id', $exam->id)->delete();

        $roleUserPairs = [
            ExamRoles::CONTROLLER => $exam->controller_id,
            ExamRoles::QUESTION_SETTER => $exam->question_setter_id,
            ExamRoles::MODERATOR => $exam->moderator_id,
            ExamRoles::INVIGILATOR => $exam->invigilator_id,
        ];

        foreach ($roleUserPairs as $role => $userId) {
            if (! $userId) {
                continue;
            }

            ExamRole::create([
                'exam_id' => $exam->id,
                'user_id' => $userId,
                'role' => $role,
            ]);
        }
    }
}
