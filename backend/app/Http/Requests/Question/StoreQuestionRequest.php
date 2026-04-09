<?php

namespace App\Http\Requests\Question;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'admin';
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['nullable', 'integer', 'exists:exams,id'],
            'question_text' => ['required', 'string'],
            'type' => ['sometimes', Rule::in(['mcq', 'true_false', 'descriptive'])],
            'option_a' => ['required', 'string', 'max:255'],
            'option_b' => ['required', 'string', 'max:255'],
            'option_c' => ['required', 'string', 'max:255'],
            'option_d' => ['required', 'string', 'max:255'],
            'correct_answer' => ['required', Rule::in(['A', 'B', 'C', 'D'])],
            'marks' => ['required', 'integer', 'min:1'],
            'difficulty' => ['required', Rule::in(['easy', 'medium', 'hard'])],
        ];
    }
}