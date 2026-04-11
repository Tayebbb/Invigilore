<?php

namespace App\Http\Controllers;

use App\Mail\AccountCreatedMail;
use App\Mail\SignupVerificationCodeMail;
use App\Models\PendingUserRegistration;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use App\Services\AuditTrailService;
use App\Services\IncidentService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    private const SIGNUP_VERIFICATION_EXPIRY_MINUTES = 10;

    public function __construct(private readonly AuditService $auditService)
    {
    }

    /**
     * Register a user by creating a pending record only.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|between:2,100',
            // Use RFC email validation without DNS lookups — `email:rfc,dns` often fails on cloud
            // hosts (e.g. Render) when MX resolution is unavailable, blocking signup while login works.
            'email' => [
                'required',
                'string',
                'email',
                'max:100',
                'unique:users',
            ],
            'password' => 'required|string|min:8',
            'role' => 'sometimes|in:student,teacher,admin,controller,question_setter,viewer,moderator,invigilator',
        ], [
            'email.email' => 'Please use a valid email address with a real domain.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $roleName = $request->string('role')->toString() ?: 'student';
        $role = Role::where('name', $roleName)->first();

        if (! $role) {
            return response()->json([
                'message' => 'Selected role is not available. Please seed roles and try again.',
            ], 422);
        }

        $passwordHash = Hash::make((string) $request->string('password'));
        $verificationCode = (string) random_int(100000, 999999);
        $verificationCodeHash = Hash::make($verificationCode);
        $verificationCodeExpiresAt = Carbon::now()->addMinutes(self::SIGNUP_VERIFICATION_EXPIRY_MINUTES);

        $pending = PendingUserRegistration::updateOrCreate(
            ['email' => (string) $request->string('email')],
            $this->buildPendingRegistrationAttributes(
                name: (string) $request->string('name'),
                passwordHash: $passwordHash,
                role: $role,
                verificationCodeHash: $verificationCodeHash,
                verificationCodeExpiresAt: $verificationCodeExpiresAt,
            ) + [
                'name' => (string) $request->string('name'),
                'password_hash' => $passwordHash,
                'verified_at' => null,
                'consumed_at' => null,
            ]
        );

        // Send after the HTTP response is flushed — avoids blocking the client on SMTP.
        $this->dispatchSignupVerificationEmailAfterResponse(
            (string) $pending->name,
            (string) $pending->email,
            $verificationCode
        );

        return response()->json([
            'message' => 'Verification code sent to your email. Please verify your account to continue.',
            'requires_verification' => true,
            'email' => $pending->email,
        ], 201);
    }

    public function resendRegistrationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $pending = PendingUserRegistration::where('email', $request->string('email')->toString())->first();

        if (! $pending) {
            return response()->json([
                'message' => 'Invalid verification request.',
            ], 422);
        }

        if (User::where('email', $pending->email)->exists() || $pending->consumed_at) {
            return response()->json([
                'message' => 'This account is already verified. Please log in.',
            ], 422);
        }

        $pendingExpiresAt = $pending->verification_code_expires_at ?? $pending->expires_at;

        if ($pendingExpiresAt && now()->greaterThan($pendingExpiresAt)) {
            return response()->json([
                'message' => 'Verification code has expired. Please sign up again.',
            ], 422);
        }

        $this->issueAndSendSignupVerificationCode($pending);

        return response()->json([
            'message' => 'A new verification code has been sent to your email.',
            'email' => $pending->email,
        ]);
    }

    public function verifyRegistrationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $pending = PendingUserRegistration::where('email', $request->string('email')->toString())->first();

        if (! $pending) {
            return response()->json([
                'message' => 'Invalid verification request.',
            ], 422);
        }

        if (User::where('email', $pending->email)->exists() || $pending->consumed_at) {
            return response()->json([
                'message' => 'This account is already verified. Please log in.',
            ], 422);
        }

        $pendingCodeHash = (string) ($pending->verification_code_hash ?: $pending->verification_token_hash ?: '');
        $pendingExpiresAt = $pending->verification_code_expires_at ?? $pending->expires_at;

        if (! $pendingCodeHash || ! $pendingExpiresAt) {
            return response()->json([
                'message' => 'No verification code is pending for this account.',
            ], 422);
        }

        if (now()->greaterThan($pendingExpiresAt)) {
            return response()->json([
                'message' => 'Verification code has expired. Please sign up again.',
            ], 422);
        }

        if (! Hash::check($request->string('code')->toString(), $pendingCodeHash)) {
            return response()->json([
                'message' => 'Invalid verification code.',
            ], 422);
        }

        $user = DB::transaction(function () use ($pending) {
            $resolvedRoleId = $pending->role_id;

            if (! $resolvedRoleId) {
                $pendingRoleName = strtolower((string) ($pending->role ?? 'student'));
                $resolvedRoleId = Role::where('name', $pendingRoleName)->value('id');
            }

            if (! $resolvedRoleId) {
                throw new \RuntimeException('Pending registration role is not valid.');
            }

            $createdUser = User::create([
                'name' => $pending->name,
                'email' => $pending->email,
                'password' => $pending->password_hash,
                'role_id' => $resolvedRoleId,
            ]);

            $createdUser->email_verified_at = now();
            $createdUser->save();

            $pending->verified_at = now();
            $pending->consumed_at = now();

            if ($this->pendingColumnExists('verification_code_hash')) {
                $pending->verification_code_hash = '';
            }

            if ($this->pendingColumnExists('verification_token_hash')) {
                $pending->verification_token_hash = '';
            }

            if ($this->pendingColumnExists('verification_code_expires_at')) {
                $pending->verification_code_expires_at = null;
            }

            if ($this->pendingColumnExists('expires_at')) {
                // Some legacy schemas require expires_at to be non-null.
                $pending->expires_at = now();
            }

            $pending->save();

            return $createdUser;
        });

        \dispatch(function () use ($user): void {
            try {
                Mail::to($user->email)->send(new AccountCreatedMail($user));
            } catch (\Throwable $exception) {
                Log::error('Failed to send account created email.', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $exception->getMessage(),
                ]);
            }
        })->afterResponse();

        return response()->json([
            'user' => $user->load('role'),
            'token' => $user->createToken('api-token')->plainTextToken,
        ]);
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request, AuditTrailService $auditTrailService, IncidentService $incidentService)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->string('email')->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (! ($user->is_active ?? true)) {
            return response()->json(['message' => 'Account is inactive. Please contact an administrator.'], 403);
        }

        if (is_null($user->email_verified_at)) {
            return response()->json([
                'message' => 'Please verify your email before logging in.',
            ], 403);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        try {
            $this->auditService->log('login', 'User logged in successfully');
        } catch (\Throwable) {
            // Do not block login response when audit logging fails.
        }

        return response()->json([
            'user' => $user->load('role'),
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role'));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|between:2,100',
            'password' => 'sometimes|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 400);
        }

        if ($request->filled('name')) {
            $user->name = trim((string) $request->input('name'));
        }

        if ($request->filled('password')) {
            $user->password = Hash::make((string) $request->input('password'));
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user->load('role'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Resend flow: generate a new code, persist, then send after the response is returned.
     */
    private function issueAndSendSignupVerificationCode(
        PendingUserRegistration $pending,
        ?string $verificationCode = null,
        ?Carbon $expiresAt = null,
    ): void {
        $verificationCode = $verificationCode ?? (string) random_int(100000, 999999);

        $codeHash = Hash::make($verificationCode);
        $expiresAt = $expiresAt ?? Carbon::now()->addMinutes(self::SIGNUP_VERIFICATION_EXPIRY_MINUTES);

        if ($this->pendingColumnExists('verification_code_hash')) {
            $pending->verification_code_hash = $codeHash;
        }

        if ($this->pendingColumnExists('verification_token_hash')) {
            $pending->verification_token_hash = $codeHash;
        }

        if ($this->pendingColumnExists('verification_code_expires_at')) {
            $pending->verification_code_expires_at = $expiresAt;
        }

        if ($this->pendingColumnExists('expires_at')) {
            $pending->expires_at = $expiresAt;
        }

        $pending->save();

        $this->dispatchSignupVerificationEmailAfterResponse(
            (string) $pending->name,
            (string) $pending->email,
            $verificationCode
        );
    }

    private function dispatchSignupVerificationEmailAfterResponse(string $name, string $email, string $plainCode): void
    {
        \dispatch(function () use ($name, $email, $plainCode): void {
            try {
                $mailUser = new User([
                    'name' => $name,
                    'email' => $email,
                ]);
                Mail::to($email)->send(new SignupVerificationCodeMail($mailUser, $plainCode));
            } catch (\Throwable $exception) {
                Log::error('Failed to send signup verification code email.', [
                    'email' => $email,
                    'error' => $exception->getMessage(),
                ]);
            }
        })->afterResponse();
    }

    private function buildPendingRegistrationAttributes(
        string $name,
        string $passwordHash,
        Role $role,
        ?string $verificationCodeHash = null,
        ?Carbon $verificationCodeExpiresAt = null,
    ): array
    {
        $attributes = [
            'name' => $name,
            'password_hash' => $passwordHash,
            'verified_at' => null,
            'consumed_at' => null,
        ];

        if ($this->pendingColumnExists('role_id')) {
            $attributes['role_id'] = $role->id;
        }

        if ($this->pendingColumnExists('role')) {
            $attributes['role'] = $role->name;
        }

        if ($verificationCodeHash) {
            if ($this->pendingColumnExists('verification_code_hash')) {
                $attributes['verification_code_hash'] = $verificationCodeHash;
            }

            if ($this->pendingColumnExists('verification_token_hash')) {
                $attributes['verification_token_hash'] = $verificationCodeHash;
            }
        }

        if ($verificationCodeExpiresAt) {
            if ($this->pendingColumnExists('verification_code_expires_at')) {
                $attributes['verification_code_expires_at'] = $verificationCodeExpiresAt;
            }

            if ($this->pendingColumnExists('expires_at')) {
                $attributes['expires_at'] = $verificationCodeExpiresAt;
            }
        }

        return $attributes;
    }

    private function pendingColumnExists(string $column): bool
    {
        static $cache = [];

        if (array_key_exists($column, $cache)) {
            return $cache[$column];
        }

        $cache[$column] = Schema::hasColumn('pending_user_registrations', $column);
        return $cache[$column];
    }
}
