<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('users')) {
            return;
        }

        $now = now();

        DB::table('roles')->updateOrInsert(
            ['name' => 'student'],
            [
                'description' => 'Student with limited access',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'teacher'],
            [
                'description' => 'Teacher with course management access',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'admin'],
            [
                'description' => 'Administrator with full access',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $studentRoleId = DB::table('roles')->where('name', 'student')->value('id');

        if (! $studentRoleId || ! Schema::hasColumn('users', 'role_id')) {
            return;
        }

        DB::table('users')->whereNull('role_id')->update(['role_id' => (int) $studentRoleId]);

        $driver = DB::getDriverName();

        try {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE users MODIFY role_id BIGINT UNSIGNED NULL DEFAULT ' . (int) $studentRoleId);
            }

            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE users ALTER COLUMN role_id SET DEFAULT ' . (int) $studentRoleId);
            }
        } catch (\Throwable) {
            // Keep migration resilient across DB engines and schema states.
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'role_id')) {
            return;
        }

        $driver = DB::getDriverName();

        try {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE users MODIFY role_id BIGINT UNSIGNED NULL DEFAULT NULL');
            }

            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE users ALTER COLUMN role_id DROP DEFAULT');
            }
        } catch (\Throwable) {
            // No-op for unsupported drivers.
        }
    }
};
