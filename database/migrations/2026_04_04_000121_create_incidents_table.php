<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('exam_id')->nullable()->constrained('exams')->nullOnDelete();
            $table->foreignId('attempt_id')->nullable()->constrained('exam_attempts')->nullOnDelete();
            $table->string('incident_type', 120);
            $table->enum('severity', ['low', 'medium', 'high'])->default('low');
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['exam_id', 'created_at']);
            $table->index(['incident_type', 'severity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
