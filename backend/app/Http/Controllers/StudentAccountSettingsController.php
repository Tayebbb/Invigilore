<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangeStudentPasswordRequest;
use App\Http\Requests\UpdateStudentPreferencesRequest;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StudentAccountSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Account settings loaded successfully',
            'data' => [
                'profile' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->name,
                    'profile_picture' => $user->profile_picture,
                ],
                'security' => [
                    'restrict_login_to_one_device' => (bool) $user->restrict_login_to_one_device,
                ],
                'preferences' => $user->preferences ?? [
                    'notification_preferences' => ['email' => true, 'sms' => false],
                    'theme' => 'dark',
                ],
            ],
        ]);
    }

    public function updateProfile(UpdateStudentProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $before = $user->only(['name', 'profile_picture']);

        if ($request->filled('name')) {
            $user->name = trim((string) $request->input('name'));
        }

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $path = $file?->store('profile-pictures', 'public');
            $user->profile_picture = $path;
        }

        $user->save();

        AuditLog::writeEntry(
            $user->id,
            'student.profile_updated',
            json_encode(['before' => $before, 'after' => $user->only(['name', 'profile_picture'])], JSON_UNESCAPED_SLASHES),
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user->load('role'),
        ]);
    }

    public function changePassword(ChangeStudentPasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check((string) $request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 422);
        }

        $user->password = Hash::make((string) $request->input('password'));
        $user->save();

        AuditLog::writeEntry(
            $user->id,
            'student.password_changed',
            json_encode([
                'timestamp' => now()->toISOString(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ], JSON_UNESCAPED_SLASHES),
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    public function updatePreferences(UpdateStudentPreferencesRequest $request): JsonResponse
    {
        $user = $request->user();
        $preferences = $user->preferences ?? [];
        $before = $preferences;

        if ($request->has('restrict_login_to_one_device')) {
            $user->restrict_login_to_one_device = (bool) $request->boolean('restrict_login_to_one_device');
        }

        $preferences['notification_preferences'] = $request->input('notification_preferences', $preferences['notification_preferences'] ?? ['email' => true, 'sms' => false]);
        $preferences['theme'] = $request->input('theme', $preferences['theme'] ?? 'dark');
        $preferences['restrict_login_to_one_device'] = $user->restrict_login_to_one_device;
        $user->preferences = $preferences;
        $user->save();

        AuditLog::writeEntry(
            $user->id,
            'student.preferences_updated',
            json_encode(['before' => $before, 'after' => $preferences], JSON_UNESCAPED_SLASHES),
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully',
            'data' => $preferences,
        ]);
    }
}
