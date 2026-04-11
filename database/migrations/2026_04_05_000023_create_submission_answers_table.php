<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('submission_answers')) {
            return;
        }

        Schema::create('submission_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
            $table->foreignId('question_id')->nullable()->constrained('questions')->nullOnDelete();
            $table->string('question_type', 30);
            $table->longText('submitted_answer')->nullable();
            $table->longText('correct_answer')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->decimal('score_awarded', 10, 2)->default(0);
            $table->text('feedback')->nullable();
            $table->json('evaluation_details')->nullable();
            $table->timestamps();

            $table->index(['submission_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_answers');
    }
};
