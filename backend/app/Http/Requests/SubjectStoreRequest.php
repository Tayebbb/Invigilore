<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class SubjectStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:150',
            'subject_code' => ['required', 'string', 'min:2', 'max:30', 'regex:/^[A-Z0-9_-]+$/'],
            'department' => 'required|string|min:2|max:100',
            'credit_hours' => 'required|numeric|min:1|max:10',
            'description' => 'nullable|string|max:1000',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->normalizeString($this->input('name', $this->input('subjectName'))),
            'subject_code' => strtoupper((string) $this->normalizeString($this->input('subject_code', $this->input('subjectCode')))),
            'department' => $this->normalizeString($this->input('department')),
            'credit_hours' => $this->input('credit_hours', $this->input('creditHours')),
            'description' => $this->normalizeString($this->input('description')),
        ]);
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 400));
    }

    private function normalizeString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}
