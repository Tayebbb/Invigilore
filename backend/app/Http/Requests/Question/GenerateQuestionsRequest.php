<?php

namespace App\Http\Requests\Question;

use Illuminate\Foundation\Http\FormRequest;

class GenerateQuestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'admin';
    }

    public function rules(): array
    {
        return [
            'total_questions' => ['required', 'integer', 'min:1'],
            'easy' => ['sometimes', 'integer', 'min:0'],
            'medium' => ['sometimes', 'integer', 'min:0'],
            'hard' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}