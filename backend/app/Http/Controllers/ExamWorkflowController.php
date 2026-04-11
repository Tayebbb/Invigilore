<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use Illuminate\Http\Request;

class ExamWorkflowController extends Controller
{
    public function moderator(Exam $exam)
    {
        return response()->json([
            'exam' => $exam->load(['subject', 'questions', 'moderator', 'questionSetter']),
            'paper_status' => $exam->paper_status,
            'reviews' => $exam->reviews()->latest()->get(),
        ]);
    }

    public function invigilator(Exam $exam)
    {
        return response()->json([
            'exam' => $exam->load(['subject']),
            'start_time' => $exam->start_time,
            'end_time' => $exam->end_time,
            'incident_reports' => $exam->incidentReports()->latest()->get(),
        ]);
    }

    public function settings(Exam $exam)
    {
        return response()->json([
            'id' => $exam->id,
            'title' => $exam->title,
            'description' => $exam->description,
            'instructions' => $exam->description,
            'start_time' => $exam->start_time,
            'end_time' => $exam->end_time,
            'duration' => $exam->duration,
            'total_marks' => $exam->total_marks,
            'exam_status' => $exam->exam_status,
            'paper_status' => $exam->paper_status,
        ]);
    }

    public function updateSettings(Request $request, Exam $exam)
    {
        if ((int) $exam->controller_id !== (int) $request->user()->id && ! $request->user()->hasPermission('exams.view.all')) {
            return response()->json(['message' => 'Only the controller can update exam settings.'], 403);
        }

        if (! $request->user()->hasPermission('exams.settings.manage')) {
            return response()->json(['message' => 'Forbidden. Missing exam settings permission.'], 403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'instructions' => ['sometimes', 'nullable', 'string'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['sometimes', 'date', 'after:start_time'],
            'duration' => ['sometimes', 'integer', 'min:1'],
            'total_marks' => ['sometimes', 'integer', 'min:1'],
        ]);

        if (array_key_exists('instructions', $data) && ! array_key_exists('description', $data)) {
            $data['description'] = $data['instructions'];
        }

        unset($data['instructions']);

        $exam->fill($data);
        $exam->save();

        return response()->json([
            'message' => 'Exam settings updated successfully.',
            'exam' => $exam,
        ]);
    }

    public function activate(Request $request, Exam $exam)
    {
        if ((int) $exam->controller_id !== (int) $request->user()->id && ! $request->user()->hasPermission('exams.view.all')) {
            return response()->json(['message' => 'Only the controller can activate this exam.'], 403);
        }

        if (! $request->user()->hasPermission('exams.publish')) {
            return response()->json(['message' => 'Forbidden. Missing publish permission.'], 403);
        }

        if (! $exam->title || ! $exam->start_time || ! $exam->end_time || (int) $exam->questions()->count() === 0) {
            return response()->json([
                'message' => 'Exam cannot be activated. Add title, timing, and at least one question.',
            ], 422);
        }

        $exam->exam_status = 'active';
        $exam->save();

        return response()->json([
            'message' => 'Exam activated successfully.',
            'exam_status' => $exam->exam_status,
        ]);
    }

    public function paper(Exam $exam)
    {
        return response()->json($exam->load([
            'subject',
            'questions',
            'questionSetter',
            'moderator',
            'invigilator',
        ]));
    }

    public function review(Request $request, Exam $exam)
    {
        if (! $request->user()->hasAnyPermission(['questions.review', 'exams.approve_reject'])) {
            return response()->json(['message' => 'Forbidden. Missing review permission.'], 403);
        }

        $request->validate([
            'comments' => ['required', 'string', 'max:4000'],
        ]);

        $currentStatus = strtolower((string) ($exam->paper_status ?? 'submitted'));
        if (! in_array($currentStatus, ['submitted', 'reviewed'], true)) {
            return response()->json([
                'message' => 'Review is allowed only when status is submitted or reviewed.',
            ], 403);
        }

        $fromStatus = $currentStatus;
        $toStatus = 'reviewed';

        $exam->paper_status = $toStatus;
        $exam->save();

        $exam->reviews()->create([
            'reviewer_id' => $request->user()->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'comments' => $request->string('comments')->toString(),
        ]);

        return response()->json([
            'message' => 'Paper reviewed successfully.',
            'paper_status' => $exam->paper_status,
        ]);
    }

    public function approve(Request $request, Exam $exam)
    {
        if (! $request->user()->hasPermission('exams.approve_reject')) {
            return response()->json(['message' => 'Forbidden. Missing approve permission.'], 403);
        }

        $request->validate([
            'comments' => ['nullable', 'string', 'max:4000'],
        ]);

        $currentStatus = strtolower((string) ($exam->paper_status ?? 'submitted'));
        if ($currentStatus !== 'reviewed') {
            return response()->json([
                'message' => 'Paper can be approved only after it is reviewed.',
            ], 403);
        }

        $exam->paper_status = 'approved';
        $exam->save();

        if ($request->filled('comments')) {
            $exam->reviews()->create([
                'reviewer_id' => $request->user()->id,
                'from_status' => $currentStatus,
                'to_status' => 'approved',
                'comments' => $request->string('comments')->toString(),
            ]);
        }

        return response()->json([
            'message' => 'Paper approved successfully.',
            'paper_status' => $exam->paper_status,
        ]);
    }

    public function live(Exam $exam)
    {
        return response()->json($exam->load([
            'subject',
            'questions',
        ]));
    }

    public function instructions(Exam $exam)
    {
        return response()->json([
            'exam_id' => $exam->id,
            'title' => $exam->title,
            'description' => $exam->description,
            'instructions' => $exam->description,
            'start_time' => $exam->start_time,
            'end_time' => $exam->end_time,
        ]);
    }

    public function report(Request $request, Exam $exam)
    {
        $payload = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'severity' => ['nullable', 'in:low,medium,high,critical'],
            'metadata' => ['nullable', 'array'],
        ]);

        $report = $exam->incidentReports()->create([
            'invigilator_id' => $request->user()->id,
            'message' => $payload['message'],
            'severity' => $payload['severity'] ?? 'medium',
            'metadata' => $payload['metadata'] ?? null,
        ]);

        return response()->json([
            'message' => 'Incident report submitted successfully.',
            'report_id' => $report->id,
        ], 201);
    }
}
