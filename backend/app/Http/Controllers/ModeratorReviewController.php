<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use Illuminate\Http\Request;

class ModeratorReviewController extends Controller
{
    /**
     * Get all questions for review by moderator.
     * Also returns the exam's existing review_comment.
     */
    public function getQuestions(Request $request, $id)
    {
        $exam = Exam::with('questions.creator')->findOrFail($id);
        $user = $request->user();
        $isOwner = (int) $exam->teacher_id === (int) $user->id;

        $canManageReview = $isOwner || (
            $user->hasAnyPermission(['questions.review', 'exams.approve_reject'])
            && ($exam->controller_id === $user->id || $exam->moderator_id === $user->id || $user->hasPermission('exams.view.all'))
        );

        if (! $canManageReview) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        return response()->json([
            'questions'      => $exam->questions,
            'review_comment' => $exam->review_comment ?? '',
            'exam_status'    => $exam->exam_status,
        ]);
    }

    /**
     * Moderator approves the full paper:
     * - Saves the single review comment on the exam
     * - Sets exam_status to 'active'
     */
    public function approvePaper(Request $request, $id)
    {
        $request->validate([
            'review_comment' => 'nullable|string',
        ]);

        $exam = Exam::findOrFail($id);
        $user = $request->user();
        $isOwner = (int) $exam->teacher_id === (int) $user->id;

        $canApprove = $isOwner || (
            $user->hasPermission('exams.approve_reject')
            && ($exam->controller_id === $user->id || $exam->moderator_id === $user->id || $user->hasPermission('exams.view.all'))
        );

        if (! $canApprove) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $exam->update([
            'status'         => 'active',
            'review_comment' => $request->review_comment,
            'exam_status'    => 'active',
        ]);

        return response()->json([
            'message'     => 'Paper approved and exam set to active.',
            'status'      => $exam->status,
            'exam_status' => $exam->exam_status,
        ]);
    }
}
