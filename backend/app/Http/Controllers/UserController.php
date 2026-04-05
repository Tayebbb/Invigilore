<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdminUserRequest;
use App\Http\Requests\UpdateAdminUserRequest;
use App\Http\Requests\UpdateAdminUserStatusRequest;
use App\Http\Resources\UserAdminResource;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(private readonly AuditService $auditService)
    {
    }

    /**
     * GET /admin/users — list all users with their roles.
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $roleName = trim((string) $request->query('role', ''));
        $status = strtolower(trim((string) $request->query('status', 'all')));
        $perPage = (int) $request->query('per_page', 15);
        $errors = [];

        if ($search !== '' && mb_strlen($search) > 100) {
            $errors['search'][] = 'The search field must not be greater than 100 characters.';
        }

        if ($roleName !== '' && ! Role::query()->where('name', $roleName)->exists()) {
            $errors['role'][] = 'The selected role is invalid.';
        }

        if (! in_array($status, ['active', 'inactive', 'all'], true)) {
            $errors['status'][] = 'The selected status is invalid.';
        }

        if ($perPage < 1 || $perPage > 100) {
            $errors['per_page'][] = 'The per page field must be between 1 and 100.';
        }

        if ($errors !== []) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors,
            ], 422);
        }

        $query = User::query()->with('role')->latest();

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        if ($roleName) {
            $query->whereHas('role', function ($builder) use ($roleName): void {
                $builder->where('name', $roleName);
            });
        }

        if ($status === 'active') {
            $query->where(function ($builder): void {
                $builder->whereNull('is_active')->orWhere('is_active', true);
            });
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $users = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => UserAdminResource::collection($users->getCollection()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * GET /admin/users/{user} — show a single user.
     */
    public function show(User $user): JsonResponse
    {
        $user->loadMissing('role');

        return response()->json([
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => new UserAdminResource($user),
        ]);
    }

    /**
     * POST /admin/users — create a new user (admin only).
     */
    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $role = Role::query()->where('name', $validated['role'])->first();

        if (! $role) {
            return response()->json([
                'success' => false,
                'message' => 'Selected role is not available. Please seed roles and try again.',
            ], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'profile_picture' => $validated['profile_picture'] ?? null,
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $user->load('role');

        $this->auditService->log(
            'admin_user_created',
            sprintf('Created user #%d (%s) with role %s', $user->id, $user->email, $user->role?->name ?? $validated['role'])
        );

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => new UserAdminResource($user),
        ], 201);
    }

    /**
     * PUT/PATCH /admin/users/{user} — update a user (admin only).
     */
    public function update(UpdateAdminUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        if (array_key_exists('name', $validated)) {
            $user->name = $validated['name'];
        }

        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
        }

        if (array_key_exists('password', $validated)) {
            $user->password = Hash::make($validated['password']);
        }

        if (array_key_exists('profile_picture', $validated)) {
            $user->profile_picture = $validated['profile_picture'];
        }

        if (array_key_exists('role', $validated)) {
            $role = Role::query()->where('name', $validated['role'])->first();

            if (! $role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected role is not available. Please seed roles and try again.',
                ], 422);
            }

            $user->role_id = $role->id;
        }

        $user->save();
        $user->load('role');

        $this->auditService->log(
            'admin_user_updated',
            sprintf('Updated user #%d (%s)', $user->id, $user->email)
        );

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => new UserAdminResource($user),
        ]);
    }

    /**
     * PATCH /admin/users/{user}/status — activate or deactivate a user.
     */
    public function updateStatus(UpdateAdminUserStatusRequest $request, User $user): JsonResponse
    {
        if ((int) $request->user()?->id === (int) $user->id && $request->has('is_active') && ! $request->boolean('is_active')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deactivate your own account.',
            ], 403);
        }

        $currentStatus = (bool) ($user->is_active ?? true);
        $targetStatus = $request->has('is_active') ? $request->boolean('is_active') : ! $currentStatus;

        if ($currentStatus === $targetStatus) {
            $user->loadMissing('role');

            return response()->json([
                'success' => true,
                'message' => 'User status unchanged',
                'data' => new UserAdminResource($user),
            ]);
        }

        $user->is_active = $targetStatus;
        $user->save();
        $user->load('role');

        $this->auditService->log(
            $targetStatus ? 'admin_user_activated' : 'admin_user_deactivated',
            sprintf('Set user #%d (%s) status to %s', $user->id, $user->email, $targetStatus ? 'active' : 'inactive')
        );

        return response()->json([
            'success' => true,
            'message' => $targetStatus ? 'User account activated successfully' : 'User account deactivated successfully',
            'data' => new UserAdminResource($user),
        ]);
    }

    /**
     * DELETE /admin/users/{user} — delete a user (admin only).
     */
    public function destroy(User $user): JsonResponse
    {
        if ((int) $user->id === (int) auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete your own account',
            ], 403);
        }

        $email = $user->email;
        $userId = $user->id;
        $user->delete();

        $this->auditService->log('admin_user_deleted', sprintf('Deleted user #%d (%s)', $userId, $email));

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}
