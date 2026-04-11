<?php

namespace Database\Seeders;

use App\Models\Permission;
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
            ['name' => 'moderator', 'description' => 'Moderator for exam review'],
            ['name' => 'invigilator', 'description' => 'Invigilator for live exam monitoring'],
        ];

        $permissions = [
            ['name' => 'users.manage', 'description' => 'Manage users in the system'],
            ['name' => 'roles.assign', 'description' => 'Assign roles to users'],
            ['name' => 'exams.view.all', 'description' => 'View all exams, attempts, and workflows'],
            ['name' => 'exam_attempts.view.all', 'description' => 'View all exam attempts'],
            ['name' => 'results.view.all', 'description' => 'View all students results'],
            ['name' => 'audit_logs.view', 'description' => 'View audit logs'],
            ['name' => 'exams.create', 'description' => 'Create exams'],
            ['name' => 'questions.manage', 'description' => 'Create and edit exam questions'],
            ['name' => 'questions.review', 'description' => 'Review submitted exam questions'],
            ['name' => 'exams.approve_reject', 'description' => 'Approve or reject exam paper workflow'],
            ['name' => 'exams.publish', 'description' => 'Publish and activate exams'],
            ['name' => 'exams.manage.access', 'description' => 'Manage exam access controls and assigned actors'],
            ['name' => 'exams.settings.manage', 'description' => 'Manage exam-level settings'],
            ['name' => 'exams.view.assigned', 'description' => 'View only exams assigned to the current student'],
            ['name' => 'exams.attempt', 'description' => 'Attempt assigned exams'],
            ['name' => 'answers.submit', 'description' => 'Submit answers for exam attempts'],
            ['name' => 'results.view.own', 'description' => 'View own exam results'],
        ];

        $rolePermissions = [
            'admin' => [
                'users.manage',
                'roles.assign',
                'exams.view.all',
                'exam_attempts.view.all',
                'results.view.all',
                'audit_logs.view',
                'exams.create',
                'questions.manage',
                'questions.review',
                'exams.approve_reject',
                'exams.publish',
                'exams.manage.access',
                'exams.settings.manage',
            ],
            'question_setter' => [
                'exams.create',
                'questions.manage',
            ],
            'moderator' => [
                'questions.review',
                'exams.approve_reject',
                'exams.publish',
            ],
            'student' => [
                'exams.view.assigned',
                'exams.attempt',
                'answers.submit',
                'results.view.own',
            ],
            'teacher' => [
                'exams.create',
                'questions.manage',
            ],
            'controller' => [
                'exams.manage.access',
                'exams.settings.manage',
                'exams.publish',
            ],
            'invigilator' => [],
            'viewer' => [],
        ];

        $hasDescriptionColumn = Schema::hasColumn('roles', 'description');

        foreach ($roles as $role) {
            $attributes = ['name' => $role['name']];
            $values = $hasDescriptionColumn ? $role : ['name' => $role['name']];
            Role::updateOrCreate($attributes, $values);
        }

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                ['description' => $permission['description']]
            );
        }

        foreach ($rolePermissions as $roleName => $permissionNames) {
            $role = Role::query()->where('name', $roleName)->first();
            if (! $role) {
                continue;
            }

            $permissionIds = Permission::query()
                ->whereIn('name', $permissionNames)
                ->pluck('id')
                ->all();

            $role->permissions()->sync($permissionIds);
        }
    }
}
