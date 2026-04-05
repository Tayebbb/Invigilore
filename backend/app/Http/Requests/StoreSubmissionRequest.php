<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'exam_id' => 'required|integer|exists:exams,id',
            'answers' => 'required|array|min:1',
            'answers.*.question_id' => 'required|integer|exists:questions,id',
            'answers.*.submitted_answer' => 'sometimes|nullable',
            'scoring_rules' => 'sometimes|array',
            'scoring_rules.partial_credit' => 'sometimes|boolean',
            'scoring_rules.negative_marking' => 'sometimes|numeric|min:0|max:1',
            'scoring_rules.similarity_threshold' => 'sometimes|numeric|min:0|max:100',
            'scoring_rules.case_sensitive' => 'sometimes|boolean',
            'scoring_rules.trim_whitespace' => 'sometimes|boolean',
            'idempotency_key' => 'sometimes|nullable|string|max:100',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }
}