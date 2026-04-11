<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyPermission(['users.manage', 'roles.assign']) === true;
    }

    public function rules(): array
    {
        $routeUser = $this->route('user');
        $userId = $routeUser instanceof User ? $routeUser->id : $routeUser;

        return [
            'name' => 'sometimes|string|min:2|max:100',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $userId,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|string|exists:roles,name',
            'profile_picture' => 'sometimes|nullable|string|max:255',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->normalizeString($this->input('name')),
            'email' => $this->normalizeString($this->input('email')),
            'role' => $this->normalizeString($this->input('role')),
            'profile_picture' => $this->normalizeString($this->input('profile_picture')),
        ]);
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Forbidden. Missing user-management permissions.',
        ], 403));
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }

    private function normalizeString(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}