<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('user.role', 'exam', 'answers.question');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'role' => $this->user?->role?->name,
            ],
            'exam_id' => $this->exam_id,
            'exam' => [
                'id' => $this->exam?->id,
                'title' => $this->exam?->title,
            ],
            'status' => $this->status,
            'score' => (float) $this->score,
            'total_marks' => (int) $this->total_marks,
            'percentage' => (float) $this->percentage,
            'total_questions' => (int) $this->total_questions,
            'evaluated_at' => $this->evaluated_at,
            'scoring_rules' => $this->scoring_rules,
            'answers' => SubmissionAnswerResource::collection($this->answers),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}