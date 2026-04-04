<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * GET /admin/users — list all users with their roles.
     */
    public function index()
    {
        $users = User::with('role')->latest()->get()->map(function ($user) {
            return [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role?->name,
                'created_at' => $user->created_at,
            ];
        });

        return response()->json($users);
    }

    /**
     * POST /admin/users — create a new user (admin only).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|between:2,100',
            'email'    => 'required|string|email|max:100|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'sometimes|in:student,teacher,admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $roleName = $request->string('role')->toString() ?: 'student';
        $role = Role::where('name', $roleName)->first();

        if (!$role) {
            return response()->json([
                'error' => 'Selected role is not available. Please seed roles and try again.',
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role_id'  => $role->id,
        ]);

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $roleName,
        ], 201);
    }

    /**
     * PUT /admin/users/{user} — update a user (admin only).
     */
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'sometimes|string|between:2,100',
            'email'    => 'sometimes|string|email|max:100|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role'     => 'sometimes|in:student,teacher,admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->filled('name'))     $user->name     = $request->name;
        if ($request->filled('email'))    $user->email    = $request->email;
        if ($request->filled('password')) $user->password = Hash::make($request->password);

        if ($request->filled('role')) {
            $role = Role::where('name', $request->role)->first();

            if (!$role) {
                return response()->json([
                    'error' => 'Selected role is not available. Please seed roles and try again.',
                ], 422);
            }

            $user->role_id = $role->id;
        }

        $user->save();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role?->name,
        ]);
    }

    /**
     * DELETE /admin/users/{user} — delete a user (admin only).
     */
    public function destroy(User $user)
    {
        if ($user->id === auth('api')->id()) {
            return response()->json(['error' => 'Cannot delete your own account'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
