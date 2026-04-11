<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->string('idempotency_key', 100)->nullable();
            $table->char('payload_hash', 64);
            $table->json('answers_payload');
            $table->json('scoring_rules')->nullable();
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedInteger('total_marks')->default(0);
            $table->decimal('score', 10, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->string('status', 20)->default('evaluated');
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'exam_id', 'payload_hash'], 'submissions_user_exam_hash_unique');
            $table->unique(['user_id', 'exam_id', 'idempotency_key'], 'submissions_user_exam_idempotency_unique');
            $table->index(['user_id', 'exam_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};