<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionAnswerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('question');

        return [
            'id' => $this->id,
            'question_id' => $this->question_id,
            'question' => $this->question ? [
                'id' => $this->question->id,
                'question_text' => $this->question->question_text,
                'type' => $this->question->type,
                'marks' => $this->question->marks,
            ] : null,
            'question_type' => $this->question_type,
            'submitted_answer' => $this->submitted_answer,
            'correct_answer' => $this->correct_answer,
            'is_correct' => (bool) $this->is_correct,
            'score_awarded' => (float) $this->score_awarded,
            'feedback' => $this->feedback,
            'evaluation_details' => $this->evaluation_details,
        ];
    }
}