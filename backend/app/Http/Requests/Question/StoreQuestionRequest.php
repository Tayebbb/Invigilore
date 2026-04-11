<?php

namespace App\Http\Requests\Question;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('questions.manage') === true;
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['nullable', 'integer', 'exists:exams,id'],
            'question_text' => ['required', 'string'],
            'type' => ['sometimes', 'string'],
            'options' => ['nullable', 'array'],
            'option_a' => ['nullable', 'string', 'max:255'],
            'option_b' => ['nullable', 'string', 'max:255'],
            'option_c' => ['nullable', 'string', 'max:255'],
            'option_d' => ['nullable', 'string', 'max:255'],
            'correct_answer' => ['required', 'string'],
            'marks' => ['required', 'integer', 'min:1'],
            'difficulty' => ['sometimes', Rule::in(['easy', 'medium', 'hard'])],
        ];
    }
}