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
            $table->enum('name', ['student', 'teacher', 'admin'])->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('roles')->insert([
            ['name' => 'student', 'description' => 'Student with limited access', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'teacher', 'description' => 'Teacher with course management access', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'admin', 'description' => 'Administrator with full access', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
