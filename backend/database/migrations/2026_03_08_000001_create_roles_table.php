<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('roles')) {
            return;
        }

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->enum('name', [
                'student',
                'teacher',
                'admin',
                'controller',
                'question_setter',
                'moderator',
                'invigilator',
                'viewer',
            ])->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Role creation moved to RoleSeeder for single source of truth
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
