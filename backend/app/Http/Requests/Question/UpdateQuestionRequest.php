<?php

namespace App\Http\Requests\Question;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'admin';
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['sometimes', 'nullable', 'integer', 'exists:exams,id'],
            'question_text' => ['sometimes', 'string'],
            'type' => ['sometimes', 'string'],
            'options' => ['sometimes', 'array'],
            'option_a' => ['sometimes', 'string', 'max:255'],
            'option_b' => ['sometimes', 'string', 'max:255'],
            'option_c' => ['sometimes', 'string', 'max:255'],
            'option_d' => ['sometimes', 'string', 'max:255'],
            'correct_answer' => ['sometimes', 'string'],
            'marks' => ['sometimes', 'integer', 'min:1'],
            'difficulty' => ['sometimes', Rule::in(['easy', 'medium', 'hard'])],
        ];
    }
}