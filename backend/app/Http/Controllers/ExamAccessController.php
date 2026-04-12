<?php

namespace App\Http\Controllers;

use App\Mail\ExamAssignedMail;
use App\Models\Exam;
use App\Models\ExamAccess;
use App\Models\ExamAccessUser;
use App\Models\User;
use App\Notifications\ExamNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ExamAccessController extends Controller
{
    private function canManageExamAccess(Request $request, Exam $exam): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        return (int) $exam->teacher_id === (int) $user->id
            || (int) $exam->controller_id === (int) $user->id
            || $user->hasPermission('exams.view.all');
    }

    public function show(Exam $exam)
    {
        if (! $this->canManageExamAccess(request(), $exam)) {
            return response()->json(['message' => 'Forbidden. You cannot manage access for this exam.'], 403);
        }

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
        if (! $this->canManageExamAccess($request, $exam)) {
            return response()->json(['message' => 'Forbidden. You cannot manage access for this exam.'], 403);
        }

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

        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        return response()->json([
            'message' => 'Public link generated successfully.',
            'access_type' => $config->access_type,
            'link' => "{$frontendUrl}/test/{$exam->id}?token={$token}",
            'require_email' => $config->require_email,
        ]);
    }

    public function generatePrivate(Request $request, Exam $exam)
    {
        if (! $this->canManageExamAccess($request, $exam)) {
            return response()->json(['message' => 'Forbidden. You cannot manage access for this exam.'], 403);
        }

        $request->merge([
            'emails' => collect((array) $request->input('emails', []))
                ->map(fn ($email) => strtolower(trim((string) $email)))
                ->values()
                ->all(),
        ]);

        $payload = $request->validate([
            'channel' => ['required', 'in:web,teams'],
            'emails' => ['required', 'array', 'min:1'],
            'emails.*' => ['required', 'string', 'email:rfc', 'max:255'],
        ]);

        $normalizedEmails = collect($payload['emails'])
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->filter()
            ->unique()
            ->values();

        if ($normalizedEmails->isEmpty()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => [
                    'emails' => ['Add at least one valid email address.'],
                ],
            ], 422);
        }

        $alreadyAssigned = ExamAccessUser::query()
            ->where('exam_id', $exam->id)
            ->where(function ($query) use ($normalizedEmails) {
                foreach ($normalizedEmails as $email) {
                    $query->orWhereRaw('LOWER(email) = ?', [$email]);
                }
            })
            ->pluck('email')
            ->map(fn ($email) => strtolower((string) $email))
            ->unique()
            ->values();

        if ($alreadyAssigned->isNotEmpty()) {
            return response()->json([
                'message' => 'Email already assigned',
                'duplicate_emails' => $alreadyAssigned->all(),
            ], 409);
        }

        ExamAccess::query()->updateOrCreate(
            ['exam_id' => $exam->id],
            [
                'channel' => $payload['channel'],
                'access_type' => 'private',
                'access_token' => null,
                'require_email' => true,
            ]
        );

        $registeredStudents = User::query()
            ->whereIn('email', $normalizedEmails->all())
            ->whereHas('role', function ($query) {
                $query->where('name', 'student');
            })
            ->get(['id', 'name', 'email']);

        $registeredStudentEmails = $registeredStudents
            ->pluck('email')
            ->map(fn ($email) => strtolower((string) $email))
            ->all();

        $studentsByEmail = $registeredStudents
            ->keyBy(fn (User $student) => strtolower((string) $student->email));

        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $emailsSent = 0;
        $inAppNotifications = 0;
        $failedEmails = [];

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

            $accessLink = "{$frontendUrl}/test/{$exam->id}?token={$plainToken}&email=" . rawurlencode($email);

            try {
                Mail::to($email)->send(new ExamAssignedMail($exam, $email, $accessLink));
                $emailsSent++;
            } catch (\Throwable) {
                $failedEmails[] = $email;
            }

            $student = $studentsByEmail->get($email);
            if ($student instanceof User) {
                try {
                    $student->notify(new ExamNotification(
                        'Exam Assigned: ' . $exam->title,
                        'You have been assigned to a new exam. Check your email for your private access link.',
                        'info',
                        '/student/dashboard',
                        'exam_assigned_' . $exam->id . '_' . $email,
                        (int) $exam->id,
                    ));
                    $inAppNotifications++;
                } catch (\Throwable) {
                    // In-app notification failures should not block assignment.
                }
            }

            $assigned++;
        }

        return response()->json([
            'message' => 'Private exam access assigned successfully.',
            'assigned' => $assigned,
            'emails_sent' => $emailsSent,
            'failed_emails' => $failedEmails,
            'in_app_notifications' => $inAppNotifications,
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
