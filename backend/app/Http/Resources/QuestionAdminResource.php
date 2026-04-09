<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_id' => $this->exam_id,
            'created_by' => $this->created_by,
            'question_text' => $this->question_text,
            'type' => $this->type,
            'options' => $this->options,
            'correct_answer' => $this->correct_answer,
            'marks' => $this->marks,
            'difficulty' => $this->difficulty,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}