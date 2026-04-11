<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'admin' => 'admin@example.com',
            'question_setter' => 'setter@example.com',
            'moderator' => 'moderator@example.com',
            'invigilator' => 'invigilator@example.com',
            'student' => 'student@example.com',
        ];
        foreach ($roles as $roleName => $email) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                User::firstOrCreate([
                    'email' => $email,
                ], [
                    'name' => ucfirst($roleName),
                    'password' => Hash::make('password'),
                    'role_id' => $role->id,
                    'is_active' => true,
                ]);
            }
        }
    }
}
