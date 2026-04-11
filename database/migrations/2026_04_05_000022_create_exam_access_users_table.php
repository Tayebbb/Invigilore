<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('exam_access_users')) {
            return;
        }

        Schema::create('exam_access_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->string('email');
            $table->string('access_token', 128);
            $table->string('status', 20)->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['exam_id', 'email']);
            $table->unique('access_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_access_users');
    }
};
