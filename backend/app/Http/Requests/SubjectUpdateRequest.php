<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class SubjectUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|min:2|max:150',
            'subject_code' => ['sometimes', 'string', 'min:2', 'max:30', 'regex:/^[A-Z0-9_-]+$/'],
            'department' => 'sometimes|string|min:2|max:100',
            'credit_hours' => 'sometimes|numeric|min:1|max:10',
            'description' => 'nullable|string|max:1000',
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name', $this->input('subjectName'));
        $subjectCode = $this->input('subject_code', $this->input('subjectCode'));
        $department = $this->input('department');
        $creditHours = $this->input('credit_hours', $this->input('creditHours'));
        $description = $this->input('description');

        $payload = [];

        if ($name !== null) {
            $payload['name'] = $this->normalizeString($name);
        }

        if ($subjectCode !== null) {
            $payload['subject_code'] = strtoupper((string) $this->normalizeString($subjectCode));
        }

        if ($department !== null) {
            $payload['department'] = $this->normalizeString($department);
        }

        if ($creditHours !== null) {
            $payload['credit_hours'] = $creditHours;
        }

        if ($this->has('description')) {
            $payload['description'] = $this->normalizeString($description);
        }

        if (! empty($payload)) {
            $this->merge($payload);
        }
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
