<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',   'description' => 'Administrator with full access'],
            ['name' => 'teacher', 'description' => 'Teacher with course management access'],
            ['name' => 'student', 'description' => 'Student with limited access'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
