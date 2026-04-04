<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin', 'description' => 'Administrator with full access'],
            ['name' => 'controller', 'description' => 'Controller with governance and subject management access'],
            ['name' => 'question_setter', 'description' => 'Question setter with read-only subject visibility'],
            ['name' => 'viewer', 'description' => 'Viewer with read-only access'],
            ['name' => 'teacher', 'description' => 'Teacher with course management access'],
            ['name' => 'student', 'description' => 'Student with limited access'],
        ];

        $hasDescriptionColumn = Schema::hasColumn('roles', 'description');

        foreach ($roles as $role) {
            $attributes = ['name' => $role['name']];
            $values = $hasDescriptionColumn ? $role : ['name' => $role['name']];

            Role::firstOrCreate($attributes, $values);
        }
    }
}
