<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $studentRoleId = DB::table('roles')->where('name', 'student')->value('id');

        if (! Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $column = $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();

                $studentRoleId = DB::table('roles')->where('name', 'student')->value('id');
                if ($studentRoleId) {
                    $column->default((int) $studentRoleId);
                }
            });
        }

        if (Schema::hasColumn('users', 'role')) {
            $roleMap = DB::table('roles')
                ->whereIn('name', ['student', 'teacher', 'admin'])
                ->pluck('id', 'name');

            foreach (['student', 'teacher', 'admin'] as $roleName) {
                $roleId = $roleMap[$roleName] ?? null;
                if (! $roleId) {
                    continue;
                }

                DB::table('users')
                    ->where('role', $roleName)
                    ->whereNull('role_id')
                    ->update(['role_id' => $roleId]);
            }

            if ($studentRoleId) {
                DB::table('users')
                    ->whereNull('role_id')
                    ->update(['role_id' => $studentRoleId]);
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role_id')) {
                $table->dropForeign(['role_id']);
                $table->dropColumn('role_id');
            }

            if (! Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['student', 'teacher', 'admin'])->default('student')->after('password');
            }
        });
    }
};
