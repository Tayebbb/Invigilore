<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAccess;
use App\Models\ExamAccessUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ExamAccessController extends Controller
{
    public function show(Exam $exam)
    {
        $config = ExamAccess::query()->where('exam_id', $exam->id)->first();
        $users = ExamAccessUser::query()
            ->where('exam_id', $exam->id)
            ->latest()
            ->get(['id', 'email', 'status', 'expires_at', 'created_at']);

        return response()->json([
            'exam_id' => $exam->id,
            'config' => $config,
            'public_link' => $config && $config->access_type === 'public' && $config->access_token
                ? url("/test/{$exam->id}?token={$config->access_token}")
                : null,
            'private_recipients' => $users,
        ]);
    }

    public function generatePublic(Request $request, Exam $exam)
    {
        $payload = $request->validate([
            'channel' => ['required', 'in:web,teams'],
            'require_email' => ['sometimes', 'boolean'],
        ]);

        $token = Str::uuid()->toString() . Str::random(16);

        $config = ExamAccess::query()->updateOrCreate(
            ['exam_id' => $exam->id],
            [
                'channel' => $payload['channel'],
                'access_type' => 'public',
                'access_token' => hash('sha256', $token),
                'require_email' => (bool) ($payload['require_email'] ?? false),
            ]
        );

        return response()->json([
            'message' => 'Public link generated successfully.',
            'access_type' => $config->access_type,
            'link' => url("/test/{$exam->id}?token={$token}"),
            'require_email' => $config->require_email,
        ]);
    }

    public function generatePrivate(Request $request, Exam $exam)
    {
        $payload = $request->validate([
            'channel' => ['required', 'in:web,teams'],
            'emails' => ['required', 'array', 'min:1'],
            'emails.*' => ['required', 'email'],
        ]);

        $normalizedEmails = collect($payload['emails'])
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->filter()
            ->unique()
            ->values();

        ExamAccess::query()->updateOrCreate(
            ['exam_id' => $exam->id],
            [
                'channel' => $payload['channel'],
                'access_type' => 'private',
                'access_token' => null,
                'require_email' => true,
            ]
        );

        $registeredStudentEmails = User::query()
            ->whereIn('email', $normalizedEmails->all())
            ->whereHas('role', function ($query) {
                $query->where('name', 'student');
            })
            ->pluck('email')
            ->map(fn ($email) => strtolower((string) $email))
            ->all();

        $assigned = 0;
        foreach ($normalizedEmails as $email) {
            $plainToken = Str::uuid()->toString() . Str::random(16);
            $hashedToken = hash('sha256', $plainToken);

            ExamAccessUser::query()->updateOrCreate(
                ['exam_id' => $exam->id, 'email' => $email],
                [
                    'access_token' => $hashedToken,
                    'status' => 'pending',
                    'expires_at' => $exam->end_time,
                ]
            );
            $assigned++;
        }

        return response()->json([
            'message' => 'Private exam access assigned successfully.',
            'assigned' => $assigned,
            'registered_students' => $registeredStudentEmails,
            'pending_registration' => array_values(array_diff($normalizedEmails->all(), $registeredStudentEmails)),
        ]);
    }

    public function verify(Request $request, Exam $exam)
    {
        $token = (string) $request->query('token', '');
        $email = strtolower(trim((string) $request->query('email', '')));

        if ($token === '') {
            return response()->json(['message' => 'Access token is required.'], 403);
        }

        if ($exam->end_time && Carbon::now()->gt(Carbon::parse($exam->end_time))) {
            return response()->json(['message' => 'Access token has expired.'], 403);
        }

        $hashedToken = hash('sha256', $token);
        $config = ExamAccess::query()->where('exam_id', $exam->id)->first();

        if ($config && $config->access_type === 'public' && $config->access_token === $hashedToken) {
            if ($config->require_email && $email === '') {
                return response()->json(['message' => 'Email is required before starting this exam.'], 403);
            }

            return response()->json([
                'allowed' => true,
                'access_type' => 'public',
                'exam' => [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'start_time' => $exam->start_time,
                    'end_time' => $exam->end_time,
                ],
            ]);
        }

        $privateAccess = ExamAccessUser::query()
            ->where('exam_id', $exam->id)
            ->where('access_token', $hashedToken)
            ->first();

        if (! $privateAccess) {
            return response()->json(['message' => 'Invalid access token.'], 403);
        }

        if ($email === '' || strtolower($privateAccess->email) !== $email) {
            return response()->json(['message' => 'Token and email do not match.'], 403);
        }

        if ($privateAccess->status === 'used') {
            return response()->json(['message' => 'This access link has already been used.'], 403);
        }

        if ($privateAccess->expires_at && Carbon::now()->gt(Carbon::parse($privateAccess->expires_at))) {
            return response()->json(['message' => 'Access token has expired.'], 403);
        }

        $privateAccess->status = 'used';
        $privateAccess->save();

        return response()->json([
            'allowed' => true,
            'access_type' => 'private',
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'start_time' => $exam->start_time,
                'end_time' => $exam->end_time,
            ],
            'email' => $privateAccess->email,
        ]);
    }
}
